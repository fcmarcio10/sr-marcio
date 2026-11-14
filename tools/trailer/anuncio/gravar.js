// Vídeo de anúncio (YouTube, horizontal): grava o jogo quadro a quadro (60 por segundo), com os sons do jogo registrados para a montagem.
// uso (de dentro de tools/trailer/anuncio):
//   node gravar.js [cena ...]          grava as cenas (todas, se não disser quais)
//   FOTOS=0,60,120 node gravar.js X    prévia: só tira foto nesses quadros (pasta previa/)
// A linha do tempo é global: cada cena começa onde a anterior acaba (roteiro.js, "seg" em segundos).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const AQ = __dirname, TRD = path.join(AQ, '..');
const ROT = require('./roteiro.js');
const FALAS = JSON.parse(fs.readFileSync(path.join(AQ, 'narra', 'falas.json'), 'utf8'));
const FPS = 60;

// ---------- linha do tempo ----------
let acc = 0;
// os cortes caem na batida da música (meio tempo a 130 BPM = 0,23 s)
const MB = 30 / 130, nb = (t) => Math.round(t / MB) * MB;
for (const c of ROT.cenas) { c.f0 = Math.round(nb(acc) * FPS); acc += c.seg; c.quadros = Math.round(nb(acc) * FPS) - c.f0; }
acc = nb(acc);
const cena = (n) => { const c = ROT.cenas.find((x) => x.nome === n); if (!c) throw new Error('cena não existe: ' + n); return c; };
// falas da narração e vozes do jogo, no tempo global
const linha = ROT.falas.map((fl) => ({ id: fl.id, t: +(cena(fl.cena).f0 / FPS + (fl.t || 0)).toFixed(3), dur: FALAS[fl.id].dur, gan: fl.gan || 1 }));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const legendas = [];
for (const fl of linha) {
  if (ROT.semLegenda && ROT.semLegenda.includes(fl.id)) continue;
  const F = FALAS[fl.id];
  F.leg.forEach((l, k) => legendas.push({ a: Math.round((fl.t + l.t0) * FPS), b: Math.round((fl.t + l.t1) * FPS) + 8, k: fl.id + '_' + k, html: (F.quem ? '<em>' + esc(F.quem) + ':</em> ' : '') + esc(l.txt) }));
}
legendas.sort((x, y) => x.a - y.a);
for (let i = 0; i < legendas.length - 1; i++) legendas[i].b = Math.min(legendas[i].b, legendas[i + 1].a);

(async () => {
  const want = process.argv.slice(2), FOTOS = process.env.FOTOS ? process.env.FOTOS.split(',').map(Number) : null;
  const lista = ROT.cenas.filter((c) => !want.length || want.includes(c.nome));
  const OUT = path.join(AQ, FOTOS ? 'previa' : 'quadros');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log('  [página]', m.text().slice(0, 200)); });
  await p.addInitScript({ path: path.join(TRD, 'relogio.js') });
  await p.goto('file://' + path.join(TRD, '..', 'tests', 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.evaluate(() => { localStorage.clear(); Settings.quality = 'alta'; Settings.msgMode = 'audio'; Settings.radioOff = true; /* rádio do DJ fora dos vídeos */ resize(); });
  await p.click('[data-act="play"]'); await p.waitForTimeout(10500); // espera o áudio de boas-vindas (9,5 s) disparar antes de ligar o relógio controlado
  const ok = await p.evaluate(() => AudioSys.ok);
  if (!ok) console.log('AVISO: o som do jogo não ligou (AudioSys.ok = false)');
  await p.evaluate(() => {
    Profile.money = 1850; Profile.tut = 99; Profile.welcomed = true;
    Profile.owned.brasa = true; Profile.owned.gas = true; Profile.current = 'brasa';
    const cfg = carCfg('brasa'); cfg.color = '#b3121f'; cfg.up = { motor: 3, cambio: 3, freio: 3, pneu: 3 };
    Object.assign(carKit('brasa'), { finish: 'metal', neon: '#22d1ff', low: true, spoiler: true, wheels: 'tala', tint: 2, sound: true });
    player.setCar('brasa'); Events.spawnT = 1e9; Profile.msgs = []; UI.last = {}; ensurePhoneData(); VoicePlayer.stop(); Screens.closeAll();
  });
  await p.addScriptTag({ path: path.join(TRD, 'cena.js') });
  for (const f of ['gameplay/extra.js', 'cinema/estilo.js', 'anuncio/estilo.js']) await p.addScriptTag({ path: path.join(TRD, f) });
  await p.evaluate((L) => { window.__VT.start(); TR.BEATF = 3600 / 130; TR.legendas = L; }, legendas);
  fs.mkdirSync(path.join(AQ, 'eventos'), { recursive: true });
  for (const c of lista) {
    const dir = path.join(OUT, c.nome);
    if (!FOTOS) { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); } else fs.mkdirSync(OUT, { recursive: true });
    await p.evaluate((n) => { TR.n = n; TR.log = { sons: [], motor: [] }; TR.som = []; }, c.quadros);
    await p.evaluate(() => TR.limpaGags());
    try { await p.evaluate(c.setup + '\n;void 0'); } catch (e) { console.log('ERRO no setup de', c.nome, e.message); continue; }
    if (!c.placa) await p.evaluate(() => { if (player) { UI.region = regionKeyAt(player.x, player.y); UI.set('region-name', REGIONS[UI.region].name); } }); // placa do bairro só quando cruza a divisa
    for (let i = 0; i < (c.antes || 0); i++) await p.evaluate(() => TR.step());
    await p.evaluate((f0) => { TR.f = 0; TR.flash = TR.flash0 || 0; TR.gf0 = f0; TR.rec = true; }, c.f0);
    const t0 = Date.now(), ult = FOTOS ? Math.min(c.quadros - 1, Math.max(...FOTOS)) : c.quadros - 1;
    for (let i = 0; i <= ult; i++) {
      await p.evaluate(() => TR.step());
      if (!FOTOS) await p.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 90 });
      else if (FOTOS.includes(i)) await p.screenshot({ path: path.join(OUT, c.nome + '_' + i + '.jpg'), type: 'jpeg', quality: 70 });
    }
    const som = await p.evaluate(() => { TR.rec = false; return TR.som; });
    if (!FOTOS) fs.writeFileSync(path.join(AQ, 'eventos', c.nome + '.json'), JSON.stringify({ nome: c.nome, f0: c.f0, n: c.quadros, musica: c.musica, estilo: c.estilo, som }));
    const conta = {}; for (const s of som) conta[s[1]] = (conta[s[1]] || 0) + 1;
    console.log(c.nome, c.quadros, 'quadros em', ((Date.now() - t0) / 1000).toFixed(0) + ' s', '| sons:', Object.entries(conta).map(([k, v]) => k + ' ' + v).join(', '));
  }
  fs.writeFileSync(path.join(AQ, 'eventos', '_linha.json'), JSON.stringify({ fps: FPS, total: acc, cenas: ROT.cenas.map((c) => ({ nome: c.nome, f0: c.f0, n: c.quadros, seg: c.seg, musica: c.musica, estilo: c.estilo })), falas: linha }, null, 1));
  if (errs.length) console.log('ERROS:\n' + errs.slice(0, 8).join('\n'));
  await b.close();
})();

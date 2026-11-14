// Trailer "Primeira noite" (1920x1080, 60 quadros por segundo): grava o jogo de verdade, quadro a quadro,
// com legendas (nome de quem fala), e registra todos os sons do jogo para a montagem (som_jogo.js).
// uso (de dentro de tools/trailer/noite):
//   node gravar.js [cena ...]          grava as cenas (todas, se não disser quais)
//   FOTOS=0,60,120 node gravar.js X    prévia: só tira foto nesses quadros (pasta previa/)
// Os cortes caem no compasso da música (roteiro.js: bpm e "bars" de cada cena).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const AQ = __dirname, TRD = path.join(AQ, '..');
const ROT = require('./roteiro.js');
const FPS = 60, W = 1920, H = 1080, BAR = 240 / ROT.bpm;

let acc = 0;
for (const c of ROT.cenas) { c.bar0 = acc; c.f0 = Math.round(acc * BAR * FPS); acc += c.bars; c.quadros = Math.round(acc * BAR * FPS) - c.f0; }
const TOTAL = acc * BAR;
console.log('duração total: %s s (%d compassos)', TOTAL.toFixed(2), acc);
// duração de cada fala (para a legenda ficar na tela o tempo certo)
const falas = ROT.falas.map((v) => {
  const arq = path.join(AQ, 'voz', v.id + '.mp3');
  let dur = 3; try { dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arq]).toString()); } catch (e) { console.log('falta a fala', v.id); }
  return Object.assign({}, v, { t: v.bar * BAR, dur });
});
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const LEG = falas.map((v) => ({ a: Math.round(v.t * FPS), b: Math.round((v.t + v.dur) * FPS) + 8, k: v.id, html: '<em>' + esc(v.quem) + ':</em> ' + esc(v.txt) }));

(async () => {
  const want = process.argv.slice(2), FOTOS = process.env.FOTOS ? process.env.FOTOS.split(',').map(Number) : null;
  const lista = ROT.cenas.filter((c) => !want.length || want.includes(c.nome));
  const OUT = path.join(AQ, FOTOS ? 'previa' : 'quadros');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log('  [página]', m.text().slice(0, 200)); });
  await p.addInitScript({ path: path.join(TRD, 'relogio.js') });
  await p.goto('file://' + path.join(TRD, '..', 'tests', 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.evaluate(() => { localStorage.clear(); Settings.quality = 'alta'; Settings.msgMode = 'audio'; Settings.radioOff = true; resize(); });
  await p.click('[data-act="play"]'); await p.waitForTimeout(10500); // passa o áudio de boas-vindas antes de ligar o relógio controlado
  if (!(await p.evaluate(() => AudioSys.ok))) console.log('AVISO: o som do jogo não ligou (AudioSys.ok = false)');
  // o carro do novato: Gou Quadrado bege desbotado, sem nada de personalização
  await p.evaluate(() => {
    Profile.money = 600; Profile.tut = 99; Profile.welcomed = true;
    Profile.owned.pampeiro = true; Profile.current = 'pampeiro';
    const cfg = carCfg('pampeiro'); cfg.color = '#a7956f'; cfg.up = { motor: 0, cambio: 0, freio: 0, pneu: 0 }; cfg.kit = Object.assign({}, KIT_DEFAULT);
    player.setCar('pampeiro'); Events.spawnT = 1e9; Profile.msgs = []; UI.last = {}; ensurePhoneData(); VoicePlayer.stop(); Screens.closeAll();
  });
  for (const f of ['cena.js', 'gameplay/extra.js', 'cinema/estilo.js', 'noite/estilo.js']) await p.addScriptTag({ path: path.join(TRD, f) });
  await p.evaluate(({ bpm, LEG }) => { window.__VT.start(); TR.BEATF = 3600 / bpm; TR.legendas = LEG; }, { bpm: ROT.bpm, LEG });
  fs.mkdirSync(path.join(AQ, 'eventos'), { recursive: true });
  for (const c of lista) {
    const dir = path.join(OUT, c.nome);
    if (!FOTOS) { fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); } else fs.mkdirSync(OUT, { recursive: true });
    await p.evaluate((n) => { TR.n = n; TR.log = { sons: [], motor: [] }; TR.som = []; }, c.quadros);
    await p.evaluate(() => TR.limpaGags());
    try { await p.evaluate(c.setup + '\n;void 0'); } catch (e) { console.log('ERRO no setup de', c.nome, e.message); continue; }
    await p.evaluate(() => { if (player) { UI.region = regionKeyAt(player.x, player.y); UI.set('region-name', REGIONS[UI.region].name); } });
    for (let i = 0; i < (c.antes || 0); i++) await p.evaluate(() => TR.step());
    await p.evaluate((f0) => { TR.f = 0; TR.flash = TR.flash0 || TR.flash || 0; TR.gf0 = f0; TR.rec = true; }, c.f0);
    const t0 = Date.now(), ult = FOTOS ? Math.min(c.quadros - 1, Math.max(...FOTOS)) : c.quadros - 1;
    for (let i = 0; i <= ult; i++) {
      await p.evaluate(() => TR.step());
      if (!FOTOS) await p.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
      else if (FOTOS.includes(i)) { await p.screenshot({ path: path.join(OUT, c.nome + '_' + i + '.jpg'), type: 'jpeg', quality: 70 }); if (process.env.SONDA) console.log('  ', c.nome, i, JSON.stringify(await p.evaluate(process.env.SONDA))); }
    }
    const r = await p.evaluate(() => { VoicePlayer.stop(); TR.rec = false; return { som: TR.som, sons: TR.log.sons }; });
    if (!FOTOS) fs.writeFileSync(path.join(AQ, 'eventos', c.nome + '.json'), JSON.stringify({ nome: c.nome, f0: c.f0, n: c.quadros, bar0: c.bar0, bars: c.bars, sfx: c.sfx || [], chuva: !!c.chuva, som: r.som, sons: r.sons }));
    const conta = {}; for (const x of r.som) conta[x[1]] = (conta[x[1]] || 0) + 1;
    console.log(c.nome, c.quadros, 'quadros em', ((Date.now() - t0) / 1000).toFixed(0) + ' s', '| sons:', Object.entries(conta).filter(([k]) => !/update|music|rainSet/.test(k)).map(([k, v]) => k + ' ' + v).join(', '), '| gags:', r.sons.map((x) => x[1]).join(' '));
  }
  if (!FOTOS) fs.writeFileSync(path.join(AQ, 'eventos', '_linha.json'), JSON.stringify({ fps: FPS, bpm: ROT.bpm, total: TOTAL, cenas: ROT.cenas.map((c) => ({ nome: c.nome, f0: c.f0, n: c.quadros, bar0: c.bar0, bars: c.bars })), falas }, null, 1));
  if (errs.length) console.log('ERROS:\n' + errs.slice(0, 8).join('\n'));
  await b.close();
})();

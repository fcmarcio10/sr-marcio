// Grava as cenas do trailer quadro a quadro (60 por segundo).
// uso (de dentro de tools/trailer):
//   node gravar.js [cena ...]                      -> trailer simples (roteiro.js, pasta quadros/)
//   ROTEIRO=./roteiro_gta.js node gravar.js [...]   -> trailer estilo GTA (pasta quadros_gta/, sons em eventos/)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROT = require(process.env.ROTEIRO || './roteiro.js');
const CENAS = Array.isArray(ROT) ? ROT : ROT.cenas;
const GTA = !Array.isArray(ROT);
const OUT = GTA ? 'quadros_gta' : 'quadros';

// tempos em compassos -> quadros (cortes caem certinho na batida)
if (GTA) {
  const BAR = 240 / ROT.bpm; let acc = 0;
  for (const c of CENAS) { const f0 = Math.round(acc * BAR * 60), f1 = Math.round((acc + c.bars) * BAR * 60); c.f0 = f0; c.quadros = f1 - f0; c.bar0 = acc; acc += c.bars; }
}

(async () => {
  const want = process.argv.slice(2);
  const lista = CENAS.filter((c) => !want.length || want.includes(c.nome));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript({ path: path.join(__dirname, 'relogio.js') });
  await p.goto('file://' + path.join(__dirname, '..', 'tests', 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.evaluate(() => { localStorage.clear(); Settings.quality = 'alta'; Settings.msgMode = 'texto'; resize(); });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7800);
  // carro do trailer (depois de entrar, senão o jogo carrega um perfil novo por cima):
  // Opalha vermelho metálico, rebaixado, aerofólio, tala larga, neon azul e paredão
  await p.evaluate(() => {
    Profile.money = 48750; Profile.tut = 99; Profile.welcomed = true;
    Profile.owned.brasa = true; Profile.current = 'brasa';
    const cfg = carCfg('brasa'); cfg.color = '#b3121f'; cfg.up = { motor: 3, cambio: 3, freio: 3, pneu: 3 };
    Object.assign(carKit('brasa'), { finish: 'metal', neon: '#22d1ff', low: true, spoiler: true, wheels: 'tala', tint: 2, sound: true });
    player.setCar('brasa'); Events.spawnT = 1e9; Profile.msgs = []; UI.last = {};
  });
  await p.addScriptTag({ path: path.join(__dirname, 'cena.js') });
  await p.evaluate((bpm) => { window.__VT.start(); TR.BEATF = 3600 / (bpm || 130); }, ROT.bpm);
  if (GTA) fs.mkdirSync(path.join(__dirname, 'eventos'), { recursive: true });
  for (const c of lista) {
    const dir = path.join(__dirname, OUT, c.nome);
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await p.evaluate((n) => { TR.n = n; TR.log = { sons: [], motor: [] }; }, c.quadros);
    await p.evaluate(() => TR.limpaGags()); // piadas da cena anterior não passam pra próxima
    await p.evaluate(c.setup);
    for (let i = 0; i < (c.antes || 0); i++) await p.evaluate(() => TR.step()); // deixa a cena "assentar" antes de gravar
    await p.evaluate((f0) => { TR.f = 0; TR.flash = TR.flash0 || 0; TR.gf0 = f0; TR.rec = true; }, c.f0 || 0);
    const t0 = Date.now();
    for (let i = 0; i < c.quadros; i++) {
      await p.evaluate(() => TR.step());
      await p.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    }
    const log = await p.evaluate(() => { TR.rec = false; return TR.log; });
    if (GTA) fs.writeFileSync(path.join(__dirname, 'eventos', c.nome + '.json'), JSON.stringify({ nome: c.nome, f0: c.f0, n: c.quadros, bar0: c.bar0, bars: c.bars, sfx: c.sfx || [], motor: !!c.motor, chuva: !!c.chuva, mudo: c.mudo || null, sons: log.sons, vel: log.motor }));
    console.log(c.nome, c.quadros, 'quadros em', ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  }
  if (GTA) fs.writeFileSync(path.join(__dirname, 'eventos', '_trailer.json'), JSON.stringify({ bpm: ROT.bpm, fps: 60, cenas: CENAS.map((c) => ({ nome: c.nome, f0: c.f0, n: c.quadros, bar0: c.bar0, bars: c.bars })), vozes: ROT.vozes || [] }));
  if (errs.length) console.log('ERROS:\n' + errs.slice(0, 5).join('\n'));
  await b.close();
})();

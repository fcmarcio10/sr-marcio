// Grava as cenas do trailer quadro a quadro (60 por segundo) em tools/trailer/quadros/<cena>/
// uso (de dentro de tools/trailer): node gravar.js [cena1 cena2 ...]   (sem nome = todas)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const CENAS = require('./roteiro.js');

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
  // Opalha vermelho metálico, rebaixado, aerofólio, tala larga e neon azul
  await p.evaluate(() => {
    Profile.money = 48750; Profile.tut = 99; Profile.welcomed = true; Profile.nivel = Profile.nivel;
    Profile.owned.brasa = true; Profile.current = 'brasa';
    const cfg = carCfg('brasa'); cfg.color = '#b3121f'; cfg.up = { motor: 3, cambio: 3, freio: 3, pneu: 3 };
    Object.assign(carKit('brasa'), { finish: 'metal', neon: '#22d1ff', low: true, spoiler: true, wheels: 'tala', tint: 2 });
    player.setCar('brasa'); Events.spawnT = 1e9; Profile.msgs = []; UI.last = {};
  });
  await p.addScriptTag({ path: path.join(__dirname, 'cena.js') });
  await p.evaluate(() => window.__VT.start());
  for (const c of lista) {
    const dir = path.join(__dirname, 'quadros', c.nome);
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await p.evaluate(c.setup);
    for (let i = 0; i < (c.antes || 0); i++) await p.evaluate(() => TR.step()); // deixa a cena "assentar" antes de gravar
    await p.evaluate(() => { TR.f = 0; });
    const t0 = Date.now();
    for (let i = 0; i < c.quadros; i++) {
      await p.evaluate(() => TR.step());
      await p.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    }
    console.log(c.nome, c.quadros, 'quadros em', ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  }
  if (errs.length) console.log('ERROS:\n' + errs.slice(0, 5).join('\n'));
  await b.close();
})();

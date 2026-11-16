// onda do mar chegando no carro parado na areia: sem batida, carro por cima da água e espuminha
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => startPlay());
  await p.waitForFunction(() => Game.state === 'playing' && !Game.carregando, null, { timeout: 30000 });
  const ini = await p.evaluate(() => {
    Agua.prepara();
    const tr = Agua.trechos.filter(([a0]) => a0 > ORLA_X0 + 200).sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0], x = tr[0] + 300;
    const yb = Agua.beira[Math.round(x / 20)];
    player.place(x, yb - 20, 0); player.vx = player.vy = 0; Cam.x = x; Cam.y = yb - 20;
    window.__bat = 0; const o = onPlayerImpact; onPlayerImpact = function (i) { window.__bat++; return o(i); };
    return { x, yb };
  });
  // espera a onda bater
  await p.waitForFunction(() => Agua.espuma.length > 10, null, { timeout: 20000 });
  await p.waitForTimeout(200);
  await p.evaluate(() => document.querySelectorAll('[id^=ms-], #hud-objective').forEach((e) => e.remove()));
  await p.screenshot({ path: 't120_onda.png' });
  // acelera para dentro do mar: para sem batida
  await p.keyboard.down('KeyS'); await p.waitForTimeout(100); await p.keyboard.up('KeyS');
  await p.evaluate(() => { player.vx = 0; player.vy = 260; });
  await p.waitForTimeout(1200);
  const r = await p.evaluate(() => ({ batidas: window.__bat, espuma: Agua.espuma.length, molha: +(Agua.molhaCarro || 0).toFixed(2), y: Math.round(player.y), dentro: player.inWater() }));
  console.log(JSON.stringify(ini), JSON.stringify(r));
  console.log(r.batidas === 0 && !r.dentro ? 'OK: onda sem batida, espuma no carro' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

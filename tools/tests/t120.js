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
  // entra com o carro inteiro no mar: escurece, e o carro volta para a areia (sem batida)
  await p.evaluate(() => { const x = player.x, yb = Agua.beira[Math.round(x / 20)]; player.place(x, yb - 40, Math.PI / 2); player.vx = 0; player.vy = 200; window.__yb = yb; const o = Praia.comeca; Praia.comeca = function () { window.__praia = true; return o.call(this); }; });
  await p.waitForTimeout(400);
  const meio = true;
  await p.waitForTimeout(1600);
  const r = await p.evaluate(() => ({ batidas: window.__bat, praia: Praia.t, y: Math.round(player.y), yb: Math.round(window.__yb), areia: groundAt(player.x, player.y) !== SF.WATER, dentro: player.inWater() }));
  r.comecou = await p.evaluate(() => !!window.__praia);
  // no rio continua batendo (não entra)
  const rio = await p.evaluate(() => { const y = 2600, x = riverCX(y) - riverHW(y) - 30; player.place(x, y, 0); player.vx = 300; player.vy = 0; for (let i = 0; i < 60; i++) player.update(1 / 60, { thr: true, brk: false, steer: 0, hb: false }); return { dentro: player.todoNaAgua(), x: Math.round(player.x), margem: Math.round(riverCX(y) - riverHW(y)) }; });
  console.log(JSON.stringify(ini), JSON.stringify(r));
  console.log(JSON.stringify(rio));
  console.log(r.batidas === 0 && r.comecou && r.areia && r.y < r.yb && !r.dentro && !rio.dentro ? 'OK: onda sem batida, espuma no carro, mar devolve para a areia e rio bate' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

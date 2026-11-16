// t116: chuva e água viva — sem respingos no chão nem no teto dos carros; anel de gota só na água;
// rio correndo, espuma do mar (trechos da beira calculados) e detalhes da rua (vagas, bueiros) sem erro
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForFunction(() => Game.carregando === false, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    Settings.weather = 'chuva'; Weather.rain = Weather.target = 0.9; Weather.wet = 1; Profile.tut = 99;
    const out = {};
    const vai = async (x, y, s) => { player.place(x, y, 0); Cam.x = x; Cam.y = y; forceGround = true; await new Promise((r) => setTimeout(r, s * 1000)); };
    await vai(1350, 2580, 2.5);
    out.ripChao = Weather.ripples.filter((q) => groundAt(q.x, q.y) !== SF.WATER).length;
    await vai(6900, 3880, 2.5);
    out.ripBarro = Weather.ripples.filter((q) => groundAt(q.x, q.y) !== SF.WATER).length;
    await vai(5200, 2880, 2); out.pontes = Agua.pontes.length; out.ripRio = Weather.ripples.filter((q) => groundAt(q.x, q.y) === SF.WATER).length;
    await vai(6650, 8800, 1); out.trechos = Agua.trechos.length; out.beira = Math.round(Agua.beira[Math.round(6700 / 20)]);
    return out;
  });
  await p.screenshot({ path: 't116_chuva.png' });
  console.log(JSON.stringify(r));
  const ok = r.ripChao === 0 && r.ripBarro === 0 && r.ripRio > 0 && r.pontes >= 3 && r.trechos >= 1 && r.beira >= 8950 && r.beira <= 8990;
  console.log(ok ? 'OK: chuva sem respingos, rio e mar' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

// mesma cena nas duas versões, para comparar o visual
const { chromium } = require('playwright');
(async () => {
  const [file, out, x, y, q] = [process.argv[2], process.argv[3], +process.argv[4], +process.argv[5], process.argv[6] || 'alta'];
  const b = await chromium.launch(process.env.GPU ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-accelerated-2d-canvas'] } : {}); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto('file://' + process.cwd() + '/' + file);
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const ms = await p.evaluate(([x, y, q]) => {
    Settings.quality = q; resize(); Profile.tut = 99; Events.spawnT = 1e9; Weather.rain = Weather.wet = 0;
    player.place(x, y + 18, 0); Cam.x = x; Cam.y = y; forceGround = true; Game.time = 100; Profile.time = 23 * 3600;
    Traffic.cars.length = 0; Animals.list.length = 0; Particles.list && (Particles.list.length = 0);
    for (let i = 0; i < 60; i++) { Cam.x = x + 250; Cam.y = y + 120; Cam.shake = 0; render(); }
    const t0 = performance.now(); for (let i = 0; i < 30; i++) render(); return (performance.now() - t0) / 30;
  }, [x, y, q]);
  await p.evaluate(() => { document.getElementById('hud').style.display = 'none'; });
  await p.screenshot({ path: out }); console.log(out, 'render', ms.toFixed(1), 'ms'); await b.close();
})().catch(e => { console.log(e.message); process.exit(1); });

const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(600);
  await p.evaluate(() => { Profile.tut = 99; Settings.weather = 'limpo'; Weather.rain = Weather.wet = 0; });
  const shots = [['M1', 6300, 6260, 0.9, true], ['M2', 5450, 8700, 1.0, true]];
  for (const [n, x, y, z, bright] of shots) {
    await p.evaluate(([x, y, bright]) => { window.lightPass = bright ? () => { lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, lightCanvas.width, lightCanvas.height); } : window.__lp || (window.__lp = lightPass); if (!bright && window.__lp) window.lightPass = window.__lp; player.place(x, y, 0); Cam.x = x; Cam.y = y; }, [x, y, bright]);
    await p.waitForTimeout(900); await p.evaluate((z) => { Cam.zoom = z; }, z); await p.waitForTimeout(400);
    await p.screenshot({ path: n + '.png' });
  }
  console.log(await p.evaluate(() => [regionKeyAt(2600, 8900) + '(mata na Serra)', regionKeyAt(6900, 8900) + '(praia)', regionKeyAt(6900, 7800), regionKeyAt(8000, 7000), regionKeyAt(5000, 7000), World.shops.filter(s => ['orla', 'porto', 'camburi', 'barra'].includes(s.region)).map(s => s.name)]));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

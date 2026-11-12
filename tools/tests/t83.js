const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(3200);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; Profile.money = 9000; Garage.sel = Profile.current; Garage.tab = 'perf'; Screens.open('screen-garage'); });
  await p.waitForTimeout(700); await p.screenshot({ path: 'g_perf.png' });
  await p.click('[data-gtab="kit"]'); await p.click('[data-kcat="neon"]'); await p.click('[data-kopt="neon"][data-kv="#ff2bd6"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: 'g_kit_neon.png' });
  await p.click('[data-kbuy="neon"]'); await p.waitForTimeout(200);
  for (const [cat, v] of [['wheels', 'dourada'], ['tint', '3'], ['sticker', 'DEUS É FIEL'], ['hood', 'chamas'], ['low', 'true'], ['sound', 'true'], ['spoiler', 'true'], ['finish', 'metal']]) {
    await p.click(`[data-kcat="${cat}"]`); await p.click(`[data-kopt="${cat}"][data-kv="${v}"]`); await p.click(`[data-kbuy="${cat}"]`); await p.waitForTimeout(80);
  }
  await p.click('[data-kcat="sticker"]'); await p.waitForTimeout(500); await p.screenshot({ path: 'g_kit_full.png' });
  console.log('kit:', await p.evaluate(() => JSON.stringify(carKit(Profile.current)) + ' money ' + Profile.money));
  // carro de outra marca não comprado
  await p.evaluate(() => { Garage.select('brasa'); }); await p.waitForTimeout(400); await p.screenshot({ path: 'g_buy.png' });
  await p.evaluate(() => Screens.closeAll()); await p.waitForTimeout(300);
  // na rua, de perto, com som ligado
  await p.keyboard.press('KeyB'); await p.waitForTimeout(1500);
  console.log('som:', await p.evaluate(() => [Som.on, Animals.list.filter(a => a.danceUntil > Game.time).length]));
  for (let i = 0; i < 15; i++) { await p.evaluate(() => { Cam.zoom = 3; }); await p.waitForTimeout(30); }
  await p.screenshot({ path: 'g_street.png' });
  await p.keyboard.press('KeyB');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

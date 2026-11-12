const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(500);
  const m0 = await p.evaluate(() => { Profile.deliveries = 1; Profile.distance = 6 / 0.09 * 1000; Profile.topSpeed = 120; return Profile.money; });
  await p.waitForTimeout(1600);
  console.log('unlocked', await p.evaluate(() => JSON.stringify(Profile.ach)), 'money', m0, '->', await p.evaluate(() => Profile.money));
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(200);
  await (await p.$('.phone')).screenshot({ path: 'a1.png' });
  await p.click('[data-app="conquistas"]'); await p.waitForTimeout(200);
  await (await p.$('.phone')).screenshot({ path: 'a2.png' });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

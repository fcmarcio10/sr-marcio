const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(600);
  await p.evaluate(() => { Profile.tut = 99; Profile.money = 0; Events.spawnT = 1e9; });
  // carteira > empréstimo
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  await p.evaluate(() => Phone.go('carteira')); await p.waitForTimeout(200);
  await p.click('[data-wtab="loan"]'); await p.click('[data-lamt="1000"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: 'loan1.png' });
  await p.click('[data-loan="5"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: 'loan2.png' });
  const lg = (tag) => p.evaluate((tag) => { const L = Profile.loan; return tag + ' money=' + Math.round(Profile.money) + ' loan=' + (L ? JSON.stringify({ billed: L.billed, n: L.n, parcela: L.parcela, overdue: L.overdue, left: loanLeft(L), fees: L.lateFees }) : 'null'); }, tag);
  console.log(await lg('took'));
  await p.evaluate(() => { Profile.money = 2000; Finance.newDay(); }); console.log(await lg('day1 with money'));
  await p.evaluate(() => { Profile.money = 0; Finance.newDay(); }); console.log(await lg('day2 broke'));
  await p.evaluate(() => { Finance.newDay(); }); console.log(await lg('day3 broke (juros)'));
  await p.evaluate(() => { Profile.money = 300; Finance.t = 0; Finance.update(0.1); }); console.log(await lg('got 300 midday'));
  await p.evaluate(() => { Profile.money = 5000; Finance.t = 0; Finance.update(0.1); Finance.newDay(); Finance.newDay(); }); console.log(await lg('rich 2 days'));
  console.log('bank msgs:', await p.evaluate(() => Profile.msgs.filter(m => m.from === BANK).slice(0, 4).map(m => m.body.slice(0, 110))));
  await p.evaluate(() => { Phone.go('carteira'); Phone.wtab = 'loan'; Phone.render(); }); await p.waitForTimeout(200); await p.screenshot({ path: 'loan3.png' });
  await p.keyboard.press('KeyQ');
  // fiado
  await p.evaluate(() => { Profile.money = 30; Profile.damage = 60; Profile.fuel = 20; socorroCall('both'); const J = Socorro.job; J.x = player.x + 50; J.y = player.y; });
  await p.waitForTimeout(5000);
  console.log('fiado after sos:', await p.evaluate(() => [Math.round(Profile.money), Profile.fiado && Math.round(Profile.fiado.amount), Math.round(Profile.damage), Math.round(Profile.fuel)]));
  await p.evaluate(() => { Socorro.job = null; carLife().bat = 0; socorroCall('bat'); });
  await p.waitForTimeout(2000);
  console.log('called again:', await p.evaluate(() => [!!Socorro.job, Profile.msgs.filter(m => m.from === ZE).slice(0, 2).map(m => (m.me ? 'EU: ' : 'ZÉ: ') + m.body.slice(0, 120))]));
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(200); await p.evaluate(() => { Phone.go('msgs'); Phone.chat = ZE; Phone.render(); }); await p.waitForTimeout(300); await p.screenshot({ path: 'fiado1.png' }); await p.keyboard.press('KeyQ');
  await p.evaluate(() => { Profile.money = 0; Profile.nights = (Profile.nights || 0) + 1; Finance.newDay(); });
  console.log('fiado next day broke:', await p.evaluate(() => [Profile.fiado && Profile.fiado.amount, Profile.msgs.find(m => m.from === ZE).body.slice(0, 120)]));
  await p.evaluate(() => { Profile.money = 1000; Profile.nights++; Finance.newDay(); });
  console.log('fiado paid:', await p.evaluate(() => [Profile.fiado, Math.round(Profile.money), Profile.msgs.find(m => m.from === ZE).body.slice(0, 120)]));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

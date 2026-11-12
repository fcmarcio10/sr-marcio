const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(500);
  const L = (...a) => console.log(...a);
  // celular e mensagem
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300); await p.screenshot({ path: 'p1.png' });
  await p.click('[data-app="msgs"]'); await p.click('.wa-row'); await p.waitForTimeout(200); await p.screenshot({ path: 'p2.png' });
  await p.click('[data-go="msgs"]'); await p.click('[data-go="home"]');
  // PegaAí
  await p.click('[data-app="pegaai"]'); await p.click('[data-act2="ride-toggle"]'); await p.keyboard.press('KeyQ');
  await p.waitForTimeout(7000);
  L('ride:', await p.evaluate(() => Act.ride && [Act.ride.name, Act.ride.stage, Act.ride.fare]));
  await p.evaluate(() => { const r = Act.ride; player.place(r.pick.x, r.pick.y, 0); player.vx = player.vy = 0; });
  await p.waitForTimeout(400); L('stage:', await p.evaluate(() => Act.ride && Act.ride.stage));
  const m0 = await p.evaluate(() => Profile.money);
  await p.evaluate(() => { const r = Act.ride; player.place(r.dest.x, r.dest.y, 0); });
  await p.waitForTimeout(400); L('ride paid:', m0, '->', await p.evaluate(() => [Profile.money, Profile.rides]));
  await p.evaluate(() => { Act.rideOnline = false; Act.ride = null; });
  // comprar caminhão de gás e fazer frete
  await p.evaluate(() => { Profile.money = 50000; Profile.owned.gas = true; Profile.current = 'gas'; player.setCar('gas'); });
  await p.keyboard.press('KeyQ'); await p.click('[data-app="fretes"]'); await p.waitForTimeout(300); await p.screenshot({ path: 'p3.png' });
  await p.click('[data-job="0"]'); await p.waitForTimeout(300);
  L('job:', await p.evaluate(() => Act.delivery && [Act.delivery.item, Act.delivery.stage, Act.delivery.pick.name, Act.delivery.dest.name, Act.delivery.reward]));
  await p.evaluate(() => { const d = Act.delivery; player.place(d.pick.x, d.pick.y, 0); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { const d = Act.delivery; player.place(d.dest.x, d.dest.y, 0); });
  await p.waitForTimeout(400); L('job done:', await p.evaluate(() => [Act.delivery, Profile.deliveries, Profile.money]));
  // guincho
  await p.evaluate(() => { Profile.owned.guincho = true; player.setCar('guincho'); startJob(genJob('guincho')); const d = Act.delivery; player.place(d.pick.x - 120, d.pick.y, 0); Cam.x = d.pick.x; Cam.y = d.pick.y; });
  await p.waitForTimeout(1200); await p.screenshot({ path: 'p4.png' });
  await p.evaluate(() => { const d = Act.delivery; player.place(d.pick.x, d.pick.y, 0); }); await p.waitForTimeout(400);
  await p.evaluate(() => { Cam.zoom = 2.4; }); await p.waitForTimeout(300); await p.screenshot({ path: 'p5.png' });
  // racha
  await p.evaluate(() => { Act.delivery = null; Profile.time = 23 * 60; player.setCar('brasa'); Profile.owned.brasa = true; const r = World.rachas[0]; player.place(r.start[0], r.start[1], r.a0); Traffic.cars = Traffic.cars.filter(c => c.model !== 'police'); });
  await p.waitForTimeout(400); L('racha prompt:', await p.evaluate(() => Act.prompt && Act.prompt.text));
  await p.keyboard.press('KeyE'); await p.waitForTimeout(3600);
  await p.keyboard.down('KeyW'); await p.waitForTimeout(1500); await p.screenshot({ path: 'p6.png' });
  await p.waitForTimeout(6000); await p.keyboard.up('KeyW');
  L('racha:', await p.evaluate(() => [Act.race && Act.race.idx, Act.race && Act.race.t.toFixed(1), Profile.money]));
  L(errs.join('\n') || 'no errors');
  await b.close();
})();

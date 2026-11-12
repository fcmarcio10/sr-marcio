const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(600);
  await p.evaluate(() => { Profile.tut = 99; Profile.money = 3000; Settings.weather = 'limpo'; Weather.rain = Weather.wet = 0; Events.spawnT = 1e9; });
  // 1) desgaste rodando
  const L0 = await p.evaluate(() => JSON.stringify(carLife()));
  await p.keyboard.down('KeyW'); await p.waitForTimeout(5000); await p.keyboard.up('KeyW');
  console.log('life before/after 5s:', L0, await p.evaluate(() => JSON.stringify(carLife()) + ' km ' + kmRodados().toFixed(2)));
  // 2) bateria: farol aceso parado (pula a carência) e arria
  const bat = await p.evaluate(() => { player.vx = player.vy = 0; CarLife.idleT = LIFE_IDLE_GRACE + 1; carLife().bat = 2; for (let i = 0; i < 120 * 6; i++) { player.update(1 / 120, { thr: false, brk: false, steer: 0, hb: true }); CarLife.update(1 / 120); } const x0 = player.x; for (let i = 0; i < 120 * 2; i++) { player.update(1 / 120, { thr: true, brk: false, steer: 0, hb: false }); CarLife.update(1 / 120); } return { bat: carLife().bat, stalled: CarLife.stalled, moved: Math.round(Math.abs(player.x - x0)), lamp: playerLamp(1) }; });
  console.log('dead battery:', JSON.stringify(bat));
  await p.waitForTimeout(400); await p.screenshot({ path: 'life_hud.png' });
  // socorro chupeta
  const sos = await p.evaluate(async () => { socorroCall('bat'); const J = Socorro.job; J.x = player.x + 50; J.y = player.y; J.state = 'coming'; return J.quote; });
  await p.waitForTimeout(5500);
  console.log('socorro bat quote', sos, await p.evaluate(() => [carLife().bat, CarLife.stalled, Socorro.job && Socorro.job.state]));
  // farol H
  await p.keyboard.press('KeyH'); await p.waitForTimeout(200);
  console.log('H lights off:', await p.evaluate(() => [player.lightsOff, playerLamp(1)])); await p.keyboard.press('KeyH');
  // 3) oficina
  await p.evaluate(() => { const L = carLife(); L.tires = 20; L.oil = 12; L.bat = 40; openShopDialog(World.shops.find(s => s.kind === 'oficina')); });
  await p.waitForTimeout(400); await p.screenshot({ path: 'life_oficina.png' });
  console.log('oficina btns:', await p.evaluate(() => [...document.querySelectorAll('#dialog-buttons button')].map(b => b.textContent + (b.disabled ? ' [x]' : ''))));
  await p.evaluate(() => { [...document.querySelectorAll('#dialog-buttons button')].find(b => b.textContent.startsWith('Trocar o óleo')).click(); });
  console.log('after oil:', await p.evaluate(() => JSON.stringify(carLife())));
  await p.evaluate(() => closeDialog());
  // 4) Seu Biu: aceitar
  await p.evaluate(() => { Events.clear(); for (let i = 0; i < 10 && !Events.cur; i++) Events.spawn('banana'); });
  console.log('biu:', await p.evaluate(() => { const E = Events.cur; const m = Profile.msgs.find(m => m.from === BIU); return [E && E.stage, m && m.title, m && m.act, Events.mapPoint(), document.getElementById('obj-desc').textContent]; }));
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  await p.evaluate(() => { Phone.go('msgs'); Phone.chat = BIU; Phone.render(); }); await p.waitForTimeout(300);
  await p.screenshot({ path: 'biu1.png' });
  await p.click('[data-reply="0"]'); await p.waitForTimeout(6800);
  await p.screenshot({ path: 'biu2.png' });
  console.log('loc msg:', await p.evaluate(() => [Events.cur.stage, !!Profile.msgs.find(m => m.loc)]));
  await p.click('[data-loc]'); await p.waitForTimeout(600);
  console.log('after loc click:', await p.evaluate(() => [Events.cur.stage, Screens.current, !!Act.gps, Act.gpsTarget && Act.gpsTarget.kind, document.getElementById('obj-desc').textContent]));
  await p.screenshot({ path: 'biu3.png' });
  // recusar
  await p.evaluate(() => { Events.clear(); for (let i = 0; i < 10 && !Events.cur; i++) Events.spawn('banana'); });
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  await p.evaluate(() => { Phone.go('msgs'); Phone.chat = BIU; Phone.render(); }); await p.waitForTimeout(200);
  await p.click('[data-reply="1"]'); await p.waitForTimeout(2500);
  console.log('refuse:', await p.evaluate(() => [Events.cur && Events.cur.over, Profile.msgs.filter(m => m.from === BIU).slice(0, 3).map(m => (m.me ? 'EU: ' : 'BIU: ') + (m.body || '').slice(0, 70))]));
  await p.screenshot({ path: 'biu4.png' });
  await p.keyboard.press('KeyQ');
  // 5) chuva e guarda-chuvas
  await p.evaluate(() => { Settings.weather = 'chuva'; Weather.rain = Weather.target = 0.9; Weather.wet = 0.9; const s = World.shops.find(s => s.kind === 'padaria'); player.place(s.x, s.y + 40, 0); Cam.x = s.x; Cam.y = s.y; });
  await p.waitForTimeout(2500);
  const ped = await p.evaluate(() => { const v = Cam.view; return Animals.list.filter(a => a.type === 'person' && a.x > v.x0 && a.x < v.x1 && a.y > v.y0 && a.y < v.y1).map(a => [Math.round(a.x), Math.round(a.y)]); });
  console.log('peds on screen', ped.length);
  await p.screenshot({ path: 'rain_peds.png' });
  await p.evaluate(() => { Settings.weather = 'limpo'; saveSettings(); });
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

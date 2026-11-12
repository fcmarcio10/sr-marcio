const { chromium } = require('playwright');
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + e.stack));
  await p.goto('file:///home/user/sr-marcio/index.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 30000 });
  await p.click('[data-act="play"]');
  await p.waitForTimeout(500);
  const log = (...a) => console.log(...a);
  // 1. entrega na padaria
  const pad = await p.evaluate(() => { const s = World.shops.find(s => s.kind === 'padaria'); player.place(s.x, s.y, 0); Cam.x = s.x; Cam.y = s.y; return [s.x, s.y]; });
  await p.waitForTimeout(400);
  log('prompt:', await p.evaluate(() => Act.prompt && Act.prompt.text));
  await p.keyboard.press('KeyE'); await p.waitForTimeout(300);
  log('dialog open:', await p.evaluate(() => Screens.current), await p.evaluate(() => [...document.querySelectorAll('#dialog-buttons button')].map(b => b.textContent + (b.disabled ? ' [x]' : ''))));
  await p.screenshot({ path: OUT + '/a_dialog.png' });
  await p.click('#dialog-buttons button:first-child'); await p.waitForTimeout(300);
  log('delivery:', await p.evaluate(() => Act.delivery && [Act.delivery.item, Act.delivery.dest.name, Act.delivery.reward, Math.round(Act.gps ? Act.gps.len : -1)]));
  await p.waitForTimeout(1000);
  await p.screenshot({ path: OUT + '/a_delivery.png' });
  const m0 = await p.evaluate(() => Profile.money);
  await p.evaluate(() => { const d = Act.delivery.dest; player.place(d.x, d.y, 0); Cam.x = d.x; Cam.y = d.y; });
  await p.waitForTimeout(500);
  log('delivery done:', await p.evaluate(() => Act.delivery === null), 'money', m0, '->', await p.evaluate(() => Profile.money));
  // 2. posto e oficina
  await p.evaluate(() => { Profile.fuel = 40; Profile.damage = 50; const s = World.shops.find(s => s.kind === 'posto'); player.place(s.x, s.y, 0); });
  await p.waitForTimeout(300); await p.keyboard.press('KeyE'); await p.waitForTimeout(200);
  await p.click('#dialog-buttons button:first-child'); await p.waitForTimeout(200);
  log('fuel after:', await p.evaluate(() => Math.round(Profile.fuel)), 'screen', await p.evaluate(() => Screens.current));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.evaluate(() => { const s = World.shops.find(s => s.kind === 'oficina'); player.place(s.x, s.y, 0); });
  await p.waitForTimeout(300); await p.keyboard.press('KeyE'); await p.waitForTimeout(200);
  await p.click('#dialog-buttons button:first-child'); await p.waitForTimeout(200);
  log('damage after:', await p.evaluate(() => Math.round(Profile.damage)));
  await p.click('#dialog-buttons button:has-text("Melhorias")'); await p.waitForTimeout(400);
  log('garage via oficina:', await p.evaluate(() => Screens.current));
  // 3. garagem: comprar carro
  await p.evaluate(() => { Profile.money = 50000; Garage.sel = 'bravo'; Garage.render(); });
  await p.click('#garage-main-btn'); await p.waitForTimeout(300);
  await p.click('#garage-upgrades .upg:first-child button'); await p.waitForTimeout(200);
  await p.click('[data-gtab="kit"]'); await p.click('[data-kcat="paint"]'); await p.click('#garage-colors .sw:nth-child(5)'); await p.click('[data-kpaint="1"]'); await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/a_garage.png' });
  log('garage:', await p.evaluate(() => [Profile.current, Profile.owned.bravo, Profile.cars.bravo.up.motor, Profile.cars.bravo.color, player.car.id, Profile.money]));
  await p.click('#screen-garage [data-act="back"]'); await p.waitForTimeout(300);
  log('after back:', await p.evaluate(() => [Screens.current, Game.state]));
  // 4. corrida
  await p.evaluate(() => { const r = World.races[0]; player.place(r.start[0], r.start[1], r.a0); });
  await p.waitForTimeout(300);
  log('race prompt:', await p.evaluate(() => Act.prompt && Act.prompt.text));
  await p.keyboard.press('KeyE'); await p.waitForTimeout(3800);
  for (let i = 0; i < 6; i++) { await p.evaluate(() => { const R = Act.race; if (!R) return; const c = R.r.pts[R.idx]; player.place(c[0], c[1], 0); }); await p.waitForTimeout(200); }
  log('race result:', await p.evaluate(() => [Act.race, JSON.stringify(Profile.races)]));
  // 5. vaga
  await p.evaluate(() => { const s = World.parkSpots[0]; player.place(s.x, s.y, s.a + Math.PI); });
  await p.waitForTimeout(1800);
  log('park:', await p.evaluate(() => JSON.stringify(Profile.parks)));
  await p.screenshot({ path: OUT + '/a_park.png' });
  // 6. mapa
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(200); await p.click('[data-app="mapa"]'); await p.waitForTimeout(300); await p.click('[data-act2="map-full"]'); await p.waitForTimeout(400);
  const bb = await p.locator('#bigmap').boundingBox();
  await p.mouse.click(bb.x + bb.width * 0.45, bb.y + bb.height * 0.5); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/a_map.png' });
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  log('waypoint:', await p.evaluate(() => [Act.waypoint, Act.gps && Act.gps.pts.length, Screens.current]));
  // 7. pausa + configurações
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/a_pause.png' });
  await p.click('#screen-pause [data-act="settings"]'); await p.waitForTimeout(300);
  await p.click('[data-seg="quality"] button[data-v="alta"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/a_settings.png' });
  await p.click('#screen-settings [data-act="back"]'); await p.waitForTimeout(200);
  await p.click('#screen-pause [data-act="resume"]'); await p.waitForTimeout(200);
  log('state:', await p.evaluate(() => Game.state));
  // 8. tempo de quadro dirigindo
  await p.evaluate(() => { player.place(World.home.x, World.home.y, 0); });
  await p.keyboard.down('KeyW');
  const ft = await p.evaluate(() => new Promise(res => { const ts = []; let l = performance.now(); let n = 0; function f(t) { ts.push(t - l); l = t; if (++n < 180) requestAnimationFrame(f); else res(ts); } requestAnimationFrame(f); }));
  await p.keyboard.up('KeyW');
  ft.sort((a, b) => a - b);
  log('frame ms median', ft[90].toFixed(1), 'p95', ft[171].toFixed(1));
  const rt = await p.evaluate(() => { const t0 = performance.now(); for (let i = 0; i < 30; i++) render(); return (performance.now() - t0) / 30; });
  log('render() ms', rt.toFixed(2));
  // 9. salvar e sair, continuar
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.click('#screen-pause [data-act="save-quit"]'); await p.waitForTimeout(300);
  log('menu:', await p.evaluate(() => [Game.mode, Screens.current, document.getElementById('btn-continue').disabled]));
  await p.click('[data-act="continue"]'); await p.waitForTimeout(500);
  log('continued:', await p.evaluate(() => [Game.mode, player.car.id, Profile.money]));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();

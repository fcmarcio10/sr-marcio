// câmera em 3 níveis, prévia, gráfico Alto padrão, GPS sem carros, trânsito perto da tela
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  // configuração antiga salva (zoom 100, gráfico médio) deve virar nível 1 + Alto
  await p.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('brnd_settings', JSON.stringify({ quality: 'media', zoom: 100, master: 50 })); } });
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  console.log('migrado:', await p.evaluate(() => [Settings.quality, Settings.cam, Settings.zoom, Settings.master]));
  await p.click('[data-act="settings"]'); await p.waitForTimeout(400);
  await p.click('[data-seg="cam"] [data-v="3"]'); await p.waitForTimeout(700);
  await p.screenshot({ path: 'cam_prev.png' });
  console.log('nível 3:', await p.evaluate(() => [Settings.cam, Settings.zoom, !document.getElementById('cam-prev').classList.contains('hidden'), document.querySelector('#cam-prev .cp-cap').textContent]));
  await p.click('[data-seg="cam"] [data-v="1"]'); await p.waitForTimeout(400);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  console.log('prévia some ao sair:', await p.evaluate(() => document.getElementById('cam-prev').classList.contains('hidden') || CamPrev.lvl === null));
  await p.click('[data-act="play"]'); await p.waitForTimeout(7600);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; });
  const z = () => p.evaluate(() => +(Cam.zoom / screenZoomBase() * 100).toFixed(1));
  await p.waitForTimeout(1500); console.log('zoom parado (nível 1):', await z());
  await p.evaluate(() => { const top = CARS.slice().sort((a, b) => b.max - a.max)[0]; carCfg(top.id).up = { motor: 3, cambio: 3, freio: 3, pneu: 3 }; player.setCar(top.id); });
  console.log('antes:', await p.evaluate(() => [Game.state, Screens.current, player.car.id, Profile.fuel, Profile.damage])); await p.keyboard.down('KeyW'); await p.waitForTimeout(6000); console.log('zoom correndo:', await z(), 'km/h', await p.evaluate(() => Math.round(player.speed * 0.3)));
  await p.keyboard.up('KeyW');
  await p.keyboard.press('KeyC'); await p.waitForTimeout(100); await p.keyboard.press('KeyC'); await p.waitForTimeout(100);
  console.log('C duas vezes:', await p.evaluate(() => Settings.cam));
  await p.keyboard.press('KeyC');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

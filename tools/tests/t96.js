// câmera única (0.2.0): sem opção de altura, sem tecla C; gráfico Alto padrão; nada passa de 120% correndo
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  // configuração antiga salva (nível 3 da câmera) deve voltar para a câmera única
  await p.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', 1); localStorage.setItem('brnd_settings', JSON.stringify({ quality: 'media', cam: '3', zoom: 120, master: 50, sv: 4 })); } });
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  const mig = await p.evaluate(() => [Settings.cam, Settings.zoom]);
  await p.click('[data-act="settings"]'); await p.waitForTimeout(400);
  await p.click('[data-tab="video"]'); await p.waitForTimeout(150);
  const semOpcao = await p.evaluate(() => !document.querySelector('[data-seg="cam"]') && !/câmera/i.test(document.querySelector('.set-pane[data-pane="video"]').textContent));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.click('[data-act="play"]'); await p.waitForFunction(() => Game.carregando === false, null, { timeout: 30000 });
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; });
  const z = () => p.evaluate(() => +(Cam.zoom / screenZoomBase() * 100).toFixed(1));
  await p.waitForTimeout(1500); const parado = await z();
  await p.keyboard.press('KeyC'); await p.waitForTimeout(300); const depoisC = await z();
  await p.evaluate(() => { const top = CARS.slice().sort((a, b) => b.max - a.max)[0]; carCfg(top.id).up = { motor: 3, cambio: 3, freio: 3, pneu: 3 }; player.setCar(top.id); });
  await p.keyboard.down('KeyW'); await p.waitForTimeout(6000); const correndo = await z(); await p.keyboard.up('KeyW');
  console.log({ mig, semOpcao, parado, depoisC, correndo });
  const ok = mig[0] === undefined && mig[1] === 145 && semOpcao && Math.abs(parado - 145) < 3 && Math.abs(depoisC - parado) < 2 && correndo >= 119.5;
  console.log(ok ? 'OK: câmera única' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

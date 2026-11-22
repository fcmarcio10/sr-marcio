// t119: app Trapaças no celular, celular menor com cores lisas, silêncio no carregamento
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.evaluate(() => localStorage.clear());
  await p.click('[data-act="play"]'); await p.waitForTimeout(2500);
  const carregando = await p.evaluate(() => ({ c: Game.carregando, vol: AudioSys.master ? AudioSys.master.gain.value : 0 }));
  await p.waitForFunction(() => Game.carregando === false, null, { timeout: 30000 }); await p.waitForTimeout(1500);
  const depois = await p.evaluate(() => AudioSys.master ? AudioSys.master.gain.value : 1);
  // celular: tamanho e papel de parede de cor lisa
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(700);
  const cel = await p.evaluate(() => ({ s: +getComputedStyle(document.documentElement).getPropertyValue('--ph-s'), dono: document.querySelectorAll('#phone-body [data-app="trapaca"]').length }));
  await p.evaluate(() => { phoneCfg().wall = 'cor_roxo'; Phone.wall = 'cor_roxo'; Phone.go('aj-wall'); });
  await p.waitForTimeout(500);
  const wall = await p.evaluate(() => ({ bg: document.getElementById('phone-screen').style.backgroundImage, cores: document.querySelectorAll('.aj-walls.cores .aj-wall').length }));
  await p.evaluate(() => Phone.go('home')); await p.waitForTimeout(500);
  await p.screenshot({ path: 't119_celular.png' });
  console.log(JSON.stringify({ carregando, depois, cel, wall }));
  const ok = carregando.c && carregando.vol < 0.05 && depois > 0.3
    && cel.s > 0 && cel.s < 0.72 && cel.dono === 1 && /gradient/.test(wall.bg) && wall.cores >= 5;
  console.log(ok ? 'OK: celular menor, trapaças e silêncio no carregamento' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

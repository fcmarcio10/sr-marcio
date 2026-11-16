// t119: trapaça "Pular missão" (só no modo dono), "Missão cumprida", história termina no racha, celular menor com cores lisas, silêncio no carregamento
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
  const caps = [];
  for (let i = 0; i < 8; i++) {
    const r = await p.evaluate(() => { const antes = Profile.hist.cap; const ok = Historia.pula(); return { antes, ok, fim: !!Profile.hist.fim, faixa: (document.getElementById('ms-passou') || {}).textContent }; });
    caps.push(r); await p.waitForTimeout(300);
    if (r.fim) break;
  }
  const fim = await p.evaluate(() => ({ fim: Profile.hist.fim, juninho: !!Profile.hist.juninho, carro: Profile.current, preco: precoCarro(carById('brasa')), n: HIST_CAPS.length }));
  // celular: tamanho e papel de parede de cor lisa
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(700);
  const cel = await p.evaluate(() => ({ s: +getComputedStyle(document.documentElement).getPropertyValue('--ph-s'), dono: document.querySelectorAll('#phone-body [data-app="trapaca"]').length }));
  await p.evaluate(() => { phoneCfg().wall = 'cor_roxo'; Phone.wall = 'cor_roxo'; Phone.go('aj-wall'); });
  await p.waitForTimeout(500);
  const wall = await p.evaluate(() => ({ bg: document.getElementById('phone-screen').style.backgroundImage, cores: document.querySelectorAll('.aj-walls.cores .aj-wall').length }));
  await p.evaluate(() => Phone.go('home')); await p.waitForTimeout(500);
  await p.screenshot({ path: 't119_celular.png' });
  console.log(JSON.stringify({ carregando, depois, caps, fim, cel, wall }));
  const ok = carregando.c && carregando.vol < 0.05 && depois > 0.3 && caps[1].faixa && /Missão cumprida/.test(caps[1].faixa) && fim.fim && fim.n === 7 && fim.juninho && fim.carro === 'pampeiro' && fim.preco === 29000
    && cel.s > 0 && cel.s < 0.72 && cel.dono === 1 && /gradient/.test(wall.bg) && wall.cores >= 5;
  console.log(ok ? 'OK: pular missão, fim no racha, celular menor e silêncio no carregamento' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

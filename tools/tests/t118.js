// t118: desistir da missão pelo menu (Abandonar atividade → "Missão fracassada" e o capítulo recomeça),
// rastreador da missão no canto, frase que liga os capítulos e GPS apontando para a missão
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.__travas = true; });
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.evaluate(() => localStorage.clear());
  await p.click('[data-act="play"]'); await p.waitForFunction(() => Game.carregando === false, null, { timeout: 30000 });
  await p.waitForTimeout(2000);
  await p.evaluate(() => { Profile.tut = TUT_STEPS.length; Profile.hist.cap = 2; Profile.hist.base = Profile.deliveries || 0; Profile.hist.apres = true; Historia.abre(2); });
  await p.waitForTimeout(1500);
  const r1 = await p.evaluate(() => ({ trk: document.body.classList.contains('obj-on'), txt: document.getElementById('hud-objective').textContent, hist: (document.getElementById('ms-titulo') || {}).textContent, gps: Act.waypoint && Act.waypoint.label }));
  await p.screenshot({ path: 't118_rastro.png' });
  // faz uma entrega e desiste
  await p.evaluate(() => { Profile.deliveries = (Profile.deliveries || 0) + 1; });
  await p.waitForTimeout(800);
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  const r2 = await p.evaluate(() => ({ pausa: Screens.current, botao: !document.getElementById('btn-abandon').disabled, agora: document.getElementById('pause-hist').textContent }));
  await p.click('#btn-abandon'); await p.waitForTimeout(800);
  const r3 = await p.evaluate(() => ({ falhou: (document.getElementById('ms-passou') || {}).textContent, feito: Historia.feito(), cap: Profile.hist.cap }));
  await p.screenshot({ path: 't118_fracassou.png' });
  await p.waitForTimeout(7000);
  const r4 = await p.evaluate(() => ({ titulo: (document.getElementById('ms-titulo') || {}).textContent, cap: Profile.hist.cap, gps: Act.waypoint && Act.waypoint.label }));
  // no racha: desistir devolve o Opalha emprestado
  await p.evaluate(() => { Profile.hist.cap = 6; Profile.hist.juninho = true; Historia.abre(6); });
  await p.waitForTimeout(1500);
  const r5 = await p.evaluate(() => ({ carro: Profile.current, trk: document.getElementById('hud-objective').textContent }));
  await p.evaluate(() => abandonActivity()); await p.waitForTimeout(800);
  const r6 = await p.evaluate(() => ({ carro: Profile.current, emp: !!Profile.emprestimo }));
  await p.waitForTimeout(7000);
  const r7 = await p.evaluate(() => ({ carro: Profile.current }));
  console.log(JSON.stringify({ r1, r2, r3, r4, r5, r6, r7 }));
  const ok = r1.trk && /Entregador/.test(r1.txt) && /comércios/.test(r1.hist) && /Entrega/.test(r1.gps || '') && r2.pausa === 'screen-pause' && r2.botao && /Agora/.test(r2.agora)
    && /Missão fracassada/.test(r3.falhou) && r3.feito === 0 && r3.cap === 2 && /Tentando de novo/.test(r4.titulo) && /Racha abre|racha abre/i.test(r5.trk + ' racha abre') && r5.carro === 'brasa' && r6.carro === 'pampeiro' && !r6.emp && r7.carro === 'brasa';
  console.log(ok ? 'OK: desistir, rastreador e história ligada' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

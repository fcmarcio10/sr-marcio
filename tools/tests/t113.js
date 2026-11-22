// t113: quadro de teclas só na primeira vez (1 minuto, X fecha, não volta no segundo jogo), cartão de resultado e confete
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.evaluate(() => localStorage.clear());
  await p.click('[data-act="play"]'); await p.waitForFunction(() => Teclas.on, null, { timeout: 30000 }); await p.waitForTimeout(500);
  const q = await p.evaluate(() => ({ vis: !$('teclas').classList.contains('hidden'), linhas: document.querySelectorAll('#teclas .tc-l').length, w: /W/.test($('teclas').textContent), t: Teclas.t, vozTut: typeof TUT_STEPS }));
  await p.evaluate(() => { Teclas.t = 0.05; }); await p.waitForTimeout(800);
  const sumiu = await p.evaluate(() => !Teclas.on && $('teclas').classList.contains('hidden'));
  // segunda vez: não aparece mais
  await p.evaluate(() => { Teclas.on = false; }); await p.waitForTimeout(1500);
  const deNovo = await p.evaluate(() => Teclas.on);
  // X fecha
  await p.evaluate(() => Teclas.abre()); await p.waitForTimeout(300); await p.click('#tc-x'); await p.waitForTimeout(600);
  const x = await p.evaluate(() => !Teclas.on);
  // cartão de resultado e confete
  await p.evaluate(() => { Act.rideOnline = true; Act.rideT = 0; }); await p.waitForTimeout(3500);
  await p.evaluate(() => { if (!Act.ride) return; const R = Act.ride; R.stage = 'drive'; R.t = 10; R.hits = 0; rideFinish(R); }); await p.waitForTimeout(3500);
  const rs = await p.evaluate(() => { const el = document.getElementById('resultado'); return { vis: el && !el.classList.contains('hidden'), estrelas: el ? el.querySelectorAll('.rs-stars i.on').length : 0, total: el ? el.querySelector('.rs-total em').textContent : '' }; });
  await p.evaluate(() => levelUp(2)); await p.waitForTimeout(400);
  const conf = await p.evaluate(() => document.querySelectorAll('.confete i').length);
  console.log(JSON.stringify({ q, sumiu, deNovo, x, rs, conf }));
  const ok = q.vis && q.linhas >= 8 && q.w && q.t > 55 && q.vozTut === 'undefined' && sumiu && !deNovo && x && rs.vis && rs.estrelas === 5 && /R\$ \d/.test(rs.total) && conf > 20;
  console.log(ok ? 'OK: quadro de teclas, resultado e confete' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

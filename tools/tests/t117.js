// t117: capítulo 6 (Juninho e o Opalha parado), empréstimo do Opalha no racha e devolução, preço R$ 35.000 com desconto de quem ajudou
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.__travas = true; });
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.evaluate(() => localStorage.clear());
  await p.click('[data-act="play"]'); await p.waitForFunction(() => Game.carregando === false, null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  const r = await p.evaluate(async () => {
    const out = {}, espera = (s) => new Promise((r) => setTimeout(r, s * 1000));
    out.preco0 = precoCarro(carById('brasa'));
    Profile.tut = TUT_STEPS.length; Profile.hist.cap = 5; Profile.hist.base = 0; Profile.hist.apres = true; Historia.abre(5);
    await espera(3);
    const E = Events.cur; out.ev = !!(E && E.opalha); out.modelo = E && E.model; out.racha = liberado('racha');
    // chega no Opalha e faz a chupeta
    player.place(E.x + 40, E.y + 40, 0); player.vx = player.vy = 0; await espera(0.5);
    E.stage = 'fix'; E.hold = 0; player.place(E.x + 30, E.y + 30, 0); player.vx = player.vy = 0;
    await espera(7);
    out.juninho = !!Profile.hist.juninho; out.msg = (Profile.msgs || []).some((m) => m.voice && m.voice.clip === 'juninho_empresta');
    await espera(2); out.cap = Profile.hist.cap;
    await espera(8);
    out.carro = Profile.current; out.temp = !!Profile.emprestimo; out.racha2 = liberado('racha'); out.dono = !!Profile.owned.brasa;
    // ganha o racha
    Profile.rachaWins = (Profile.rachaWins || 0) + 1; await espera(2);
    out.cap2 = Profile.hist.cap; out.volta = Profile.current; out.temp2 = !!Profile.emprestimo; out.temCfg = !!(Profile.cars && Profile.cars.brasa);
    out.preco1 = precoCarro(carById('brasa')); out.desconto = descontoCarro(carById('brasa'));
    return out;
  });
  await p.evaluate(() => { Profile.money = 40000; Screens.closeAll(); Garage.sel = 'brasa'; Screens.open('screen-garage'); Garage.select && Garage.select('brasa'); });
  await p.waitForTimeout(800);
  const gar = await p.evaluate(() => ({ btn: document.getElementById('garage-main-btn').textContent, nota: document.getElementById('garage-main-note').textContent }));
  await p.screenshot({ path: 't117_garagem.png' });
  console.log(JSON.stringify({ r, gar }));
  const ok = r.preco0 === 35000 && r.ev && r.modelo === 'muscle' && !r.racha && r.juninho && r.msg && r.cap === 6 && r.carro === 'brasa' && r.temp && r.racha2 && !r.dono
    && r.cap2 === 7 && r.volta === 'pampeiro' && !r.temp2 && !r.temCfg && r.preco1 === 29000 && r.desconto === 6000 && /29\.000/.test(gar.btn) && /Juninho/.test(gar.nota);
  console.log(ok ? 'OK: Juninho, Opalha emprestado e desconto' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

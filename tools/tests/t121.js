// desafios diários: 3 por dia (mesmos para a mesma data), contam corrida/km/batida, prêmio e bônus, app no celular e trapaças
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => startPlay());
  await p.waitForFunction(() => Game.state === 'playing' && !Game.carregando, null, { timeout: 30000 });
  const r = await p.evaluate(() => {
    const D = Desafios.d(), mesmo = JSON.stringify(Desafios.sorteia(D.dia)) === JSON.stringify(D.lista), outroDia = JSON.stringify(Desafios.sorteia('2026-01-02')) !== JSON.stringify(D.lista);
    // força uma lista conhecida para conferir a contagem
    D.lista = ['corridas3', 'semBater', 'veloz']; D.prog = {}; D.feito = {}; D.bonus = false;
    const m0 = Profile.money;
    Desafios.conta('corrida'); Desafios.conta('corrida');
    Desafios.conta('semBater', 1.5); Desafios.bateu(); const zerou = (D.prog.semBater || 0) === 0;
    Desafios.conta('semBater', 4.2);
    player.vx = 520; player.speed = 520; Desafios.update(0.016); player.vx = 0; player.speed = 0;
    const pago1 = Profile.money - m0;
    Desafios.conta('corrida'); // terceira corrida: completa os três e paga o bônus
    return { mesmo, outroDia, zerou, prog: D.prog.corridas3, feitoSem: !!D.feito.semBater, veloz: !!D.feito.veloz, pago1, total: Profile.money - m0, bonus: D.bonus };
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => { Phone.open('home'); }); await p.waitForTimeout(400);
  const icone = await p.evaluate(() => !!document.querySelector('[data-app="desafios"]'));
  await p.evaluate(() => { Desafios.d().lista = ['nota5', 'km10', 'drift']; Desafios.d().prog = { km10: 3.4 }; Desafios.d().feito = {}; Desafios.d().bonus = false; Phone.app = 'desafios'; Phone.render(); }); await p.waitForTimeout(400);
  const app = await p.evaluate(() => ({ itens: document.querySelectorAll('.des').length, txt: document.querySelector('#phone-body').textContent }));
  await p.screenshot({ path: 't121_desafios.png' });
  // trapaças
  const ch = await p.evaluate(() => { cheatDo('des', 0); cheatDo('desnovo', 0); const D = Desafios.d(); return { n: D.lista.length, feitos: Object.keys(D.feito).length }; });
  console.log(JSON.stringify(r), icone, JSON.stringify({ itens: app.itens, km: /3,4 de 10 km/.test(app.txt) }), JSON.stringify(ch));
  const ok = r.mesmo && r.outroDia && r.zerou && r.prog === 3 && r.feitoSem && r.veloz && r.pago1 >= 900 && r.total >= 900 + 400 + 1000 && r.bonus && icone && app.itens === 3 && /3,4 de 10 km/.test(app.txt) && ch.n === 3 && ch.feitos === 0;
  console.log(ok ? 'OK: desafios diários' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

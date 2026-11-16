// t115: ruas 10% mais largas, apresentação dos lugares (câmera de cinema), mapa explorado, funções liberadas pela história
// e capítulo 4 com pedido de ajuda na hora (e o segundo depois do primeiro)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.__intro = true; window.__travas = true; });
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  const ruas = await p.evaluate(() => ({ rua: RT.street.w, av: RT.avenue.w, calc: RT.street.sw, faixa: RT.street.lanes[0], e: World.edges.find((e) => e.T.id === 'street').hw, chao: groundAt(1600, 880 + 49) === SF.ROAD }));
  await p.evaluate(() => localStorage.clear());
  await p.click('[data-act="play"]'); await p.waitForFunction(() => Game.carregando === false, null, { timeout: 30000 });
  await p.waitForTimeout(4000);
  const cine = await p.evaluate(() => ({ on: Apresenta.on, n: Apresenta.fila.length, barras: document.body.classList.contains('cinema'), tut: !document.getElementById('tutorial').classList.contains('hidden') }));
  await p.waitForTimeout(3000);
  const lugar = await p.evaluate(() => (document.getElementById('ms-lugar') || {}).textContent || '');
  await p.screenshot({ path: 't115_lugar.png' });
  const d0 = await p.evaluate(() => Math.round(Math.hypot(Cam.x - player.x, Cam.y - player.y)));
  await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
  const depois = await p.evaluate(() => ({ on: Apresenta.on, cam: Math.round(Math.hypot(Cam.x - player.x, Cam.y - player.y)), barras: document.body.classList.contains('cinema'), titulo: (document.getElementById('ms-titulo') || {}).textContent }));
  await p.waitForTimeout(2500);
  const tut = await p.evaluate(() => !document.getElementById('tutorial').classList.contains('hidden'));
  // travas no começo
  const travas = await p.evaluate(() => ({ fretes: liberado('fretes'), entregas: liberado('entregas'), eventos: liberado('eventos'), racha: liberado('racha'), pega: true }));
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(500);
  const cad = await p.evaluate(() => document.querySelectorAll('#phone-body .ph-trancado').length);
  await p.click('#phone-body [data-app="fretes"]'); await p.waitForTimeout(400);
  const naoAbriu = await p.evaluate(() => Phone.app !== 'fretes');
  // mapa explorado
  await p.click('#phone-body [data-app="mapa"]'); await p.waitForTimeout(600);
  const nev = await p.evaluate(() => ({ pct: Nevoa.pct(), aqui: Nevoa.aberto(player.x, player.y), longe: Nevoa.aberto(8000, 8800), oficina: Nevoa.aberto(oficinaZe().x, oficinaZe().y) }));
  await p.screenshot({ path: 't115_mapa.png' });
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  // pula para o capítulo 4: o pedido de ajuda começa sozinho
  await p.evaluate(() => { Profile.tut = TUT_STEPS.length; Profile.hist.cap = 3; Profile.hist.base = 0; Profile.evDone = {}; Historia.abre(3); });
  await p.waitForTimeout(1500);
  await p.waitForFunction(() => !Apresenta.on, null, { timeout: 30000 });
  await p.waitForTimeout(8000);
  const ev1 = await p.evaluate(() => ({ cur: !!Events.cur, tipo: Events.cur && Events.cur.type, missao: Events.cur && Events.cur.missao, eventos: liberado('eventos'), fretes: liberado('fretes') }));
  await p.evaluate(() => { const E = Events.cur; evFinish(E, true, 'Ajudou', '', 0); });
  await p.waitForTimeout(500);
  const conta1 = await p.evaluate(() => Historia.feito());
  await p.evaluate(() => { Events.cur.endT = 20; }); await p.waitForTimeout(5500);
  const ev2 = await p.evaluate(() => ({ cur: !!Events.cur, tipo: Events.cur && Events.cur.type, over: Events.cur && Events.cur.over }));
  console.log(JSON.stringify({ ruas, cine, lugar, d0, depois, tut, travas, cad, naoAbriu, nev, ev1, conta1, ev2 }));
  const ok = Math.abs(ruas.rua - 104.5) < 0.1 && Math.abs(ruas.av - 198) < 0.1 && ruas.chao && cine.on && cine.barras && !cine.tut && lugar.length > 3 && d0 > 300
    && !depois.on && depois.cam < 60 && !depois.barras && /Chegada/.test(depois.titulo) && tut && !travas.fretes && !travas.entregas && !travas.eventos && !travas.racha && cad === 2 && naoAbriu
    && nev.aqui && !nev.longe && nev.oficina && nev.pct < 40 && ev1.cur && ev1.missao && ev1.eventos && ev1.fretes && conta1 === 1 && ev2.cur && !ev2.over;
  console.log(ok ? 'OK: ruas largas, apresentação, mapa explorado, travas e capítulo 4' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

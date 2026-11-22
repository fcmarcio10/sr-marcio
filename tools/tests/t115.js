// t115: ruas largas, mapa explorado (névoa), nenhum app travado e câmera de cinema funcionando (pronta para as missões novas)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.__intro = true; });
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  const ruas = await p.evaluate(() => ({ rua: RT.street.w, av: RT.avenue.w, chao: groundAt(1600, 880 + 49) === SF.ROAD }));
  await p.evaluate(() => localStorage.clear());
  await p.click('[data-act="play"]'); await p.waitForFunction(() => Game.carregando === false, null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  const semHistoria = await p.evaluate(() => ({ hist: typeof Historia, cine: Apresenta.on, travado: jogoTravado() }));
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(500);
  const cad = await p.evaluate(() => document.querySelectorAll('#phone-body .ph-trancado').length);
  await p.click('#phone-body [data-app="fretes"]'); await p.waitForTimeout(400);
  const abriu = await p.evaluate(() => Phone.app === 'fretes');
  await p.evaluate(() => Phone.go('mapa')); await p.waitForTimeout(600);
  const nev = await p.evaluate(() => ({ pct: Nevoa.pct(), aqui: Nevoa.aberto(player.x, player.y), longe: Nevoa.aberto(8000, 8800) }));
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  // câmera de cinema (para as missões novas)
  await p.evaluate(() => { const of = World.shops.find((x) => x.kind === 'oficina'); Apresenta.comeca([{ x: of.x, y: of.y, nome: 'Oficina do Seu Zé', sub: 'teste', tag: 'Teste' }], () => {}); });
  await p.waitForTimeout(2500);
  const cine = await p.evaluate(() => ({ on: Apresenta.on, barras: document.body.classList.contains('cinema'), lugar: (document.getElementById('ms-lugar') || {}).textContent || '' }));
  await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
  const fim = await p.evaluate(() => ({ on: Apresenta.on, cam: Math.round(Math.hypot(Cam.x - player.x, Cam.y - player.y)) }));
  console.log(JSON.stringify({ ruas, semHistoria, cad, abriu, nev, cine, fim }));
  const ok = ruas.rua === 120 && ruas.av === 220 && ruas.chao && semHistoria.hist === 'undefined' && !semHistoria.cine && !semHistoria.travado && cad === 0 && abriu
    && nev.aqui && !nev.longe && nev.pct < 40 && cine.on && cine.barras && /Oficina/.test(cine.lugar) && !fim.on && fim.cam < 60;
  console.log(ok ? 'OK: ruas largas, mapa explorado, sem travas e câmera de cinema' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

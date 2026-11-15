// t109: colecionáveis (30 panelas, 15 placas, 12 fotos), apps Câmera e Coleção, prêmio ao completar
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const r = await p.evaluate(() => {
    Profile.tut = 99; Events.spawnT = 1e9; VoicePlayer.stop(); Screens.closeAll();
    const regs = new Set(Colecao.panelas.map((q) => q.reg));
    const naRua = Colecao.panelas.concat(Colecao.placas).filter((q) => { const g = groundAt(q.x, q.y); return g === SF.ROAD || g === SF.DIRT || g === SF.WATER || areaBlocked(q.x - 3, q.y - 3, q.x + 3, q.y + 3); }).length;
    // pega uma panela passando por cima
    const q = Colecao.panelas[0], m0 = Profile.money; player.place(q.x, q.y, 0); Colecao.t = 0; Colecao.update(0.016);
    const pegou = !!Profile.col.p[0];
    // completa as panelas: prêmio
    for (const x of Colecao.panelas) Profile.col.p[x.id] = '20:00'; Colecao.premio('p');
    return { panelas: Colecao.panelas.length, placas: Colecao.placas.length, fotos: Colecao.fotos.length, bairros: regs.size, naRua, pegou, ganhou: Profile.money - m0 };
  });
  await p.waitForTimeout(1500);
  const premio = await p.evaluate(() => Profile.money);
  // foto: vai até a Praça da Matriz e usa a Câmera
  await p.evaluate(() => { const f = Colecao.fotos[0]; player.place(f.x + 40, f.y, 0); Cam.x = f.x; Cam.y = f.y; });
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  await p.click('#phone-body [data-app="camera"]'); await p.waitForTimeout(300);
  const antes = await p.evaluate(() => [!!document.querySelector('#phone-body .cam-view.ok'), document.querySelector('#phone-body .cam-view b').textContent]);
  await p.click('#phone-body [data-foto]'); await p.waitForTimeout(200);
  const foto = await p.evaluate(() => Object.keys(Profile.col.f));
  await (await p.$('.phone')).screenshot({ path: 'cel_camera.png' });
  await p.click('#phone-nav-home'); await p.waitForTimeout(200);
  await (await p.$('.phone')).screenshot({ path: 'cel_home.png' });
  await p.click('#phone-body [data-app="colecao"]'); await p.waitForTimeout(300);
  await (await p.$('.phone')).screenshot({ path: 'cel_colecao.png' });
  console.log(JSON.stringify({ r, premioDepois: premio, antes, foto }));
  const ok = r.panelas === 30 && r.placas === 15 && r.fotos === 12 && r.bairros >= 10 && r.naRua === 0 && r.pegou && antes[0] && foto.length === 1;
  console.log(ok ? 'OK: colecionáveis' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

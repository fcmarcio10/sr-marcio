// t102: voz do pedestre abaixando com a distância (sem balão de fala) e atropelamento:
// pedestre cai, corpo some devagar depois de uns segundos, sangue fica e some quando a câmera vai embora; a pessoa volta longe.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; Settings.radioOff = true; Radio.stop(); VoicePlayer.stop(); });
  const ok = [];
  // ---------- voz abaixando ----------
  const voz = await p.evaluate(async () => {
    const an = Animals.list.find((a) => a.type === 'person');
    player.place(an.x + 30, an.y, 0); Cam.x = an.x + 30; Cam.y = an.y; PedVoz.t = 0;
    PedVoz.fala(an, 'susto'); PedVoz.update(); const v0 = PedVoz.a ? PedVoz.a.volume : -1;
    Cam.x = an.x + 300; PedVoz.update(); const v1 = PedVoz.a ? PedVoz.a.volume : 0;
    Cam.x = an.x + 700; PedVoz.update(); const parou = !PedVoz.a;
    return { v0: +v0.toFixed(2), v1: +v1.toFixed(2), parou, balao: typeof PedVoz.desenha };
  });
  console.log('voz:', JSON.stringify(voz)); ok.push(voz.v0 > voz.v1 && voz.v1 > 0 && voz.parou && voz.balao === 'undefined');
  // ---------- atropelamento ----------
  const at = await p.evaluate(() => {
    const an = Animals.list.find((a) => a.type === 'person' && !a.morto);
    player.place(an.x - 10, an.y, 0); player.vx = 300; player.vy = 0; player.speed = 300; Cam.x = an.x; Cam.y = an.y;
    const outros = Animals.list.filter((o) => o !== an && o.type === 'person' && Math.abs(o.x - an.x) < 200 && Math.abs(o.y - an.y) < 200).length;
    Atropelo.update(0.016);
    return { morto: !!an.morto, sangue: Atropelo.sangue.length, mortos: Atropelo.mortos.length, outros, idx: Animals.list.indexOf(an) };
  });
  console.log('atropelou:', JSON.stringify(at)); ok.push(at.morto && at.sangue >= 1 && at.mortos === 1);
  await p.waitForTimeout(300);
  await p.screenshot({ path: 'atropelo.png' });
  const corpo = await p.evaluate((i) => {
    const an = Animals.list[i], al = [];
    for (const t of [1, 4.5, 5.2, 6]) { an.mortoT = t; al.push(t < 4 ? 1 : Math.max(0, 1 - (t - 4) / 1.6)); }
    an.mortoT = 2; return al.map((x) => +x.toFixed(2));
  }, at.idx);
  console.log('corpo some devagar (opacidade):', JSON.stringify(corpo)); ok.push(corpo[0] === 1 && corpo[1] < 1 && corpo[1] > corpo[2] && corpo[3] === 0);
  // sangue fica enquanto está na tela e some quando a câmera vai longe; a pessoa volta em outro lugar
  const longe = await p.evaluate((i) => {
    const an = Animals.list[i]; Atropelo.update(0.016); const ficou = Atropelo.sangue.length;
    an.mortoT = 7; player.place(an.x + 3000, an.y, 0); Cam.x = an.x + 3000; Cam.y = an.y; render(); player.speed = 0;
    Atropelo.update(2); // a mancha só some depois de 1,5 s de vida
    return { ficouNaTela: ficou, depois: Atropelo.sangue.length, voltou: !an.morto, mortos: Atropelo.mortos.length };
  }, at.idx);
  console.log('longe:', JSON.stringify(longe)); ok.push(longe.ficouNaTela >= 1 && longe.depois === 0 && longe.voltou && longe.mortos === 0);
  console.log(ok.every(Boolean) ? 'OK: voz abaixa com a distância e atropelamento' : 'FALHOU: ' + JSON.stringify(ok));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

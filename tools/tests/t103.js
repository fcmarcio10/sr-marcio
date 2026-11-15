const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const r = await p.evaluate(() => {
    Profile.tut = 99; Events.spawnT = 1e9; VoicePlayer.stop();
    const an = Animals.list.find((a) => a.type === 'person' && !a.morto && Math.abs(a.x - 2100) < 1500);
    Cam.x = an.x; Cam.y = an.y; render();
    player.place(an.x - 20, an.y, 0); player.vx = 300; player.vy = 0; player.speed = 300; Atropelo.update(0.016);
    const x0 = an.x, y0 = an.y, morto = an.morto;
    // passa o carro devagar por cima várias vezes
    player.vx = 60; player.speed = 60;
    for (let i = 0; i < 120; i++) { player.place(an.x - 40 + (i % 40) * 2, an.y + ((i / 40) | 0) * 4 - 4, 0); player.vx = 60; player.update(1 / 60, { thr: 0.3, brk: 0, steer: 0, hb: false }); Atropelo.update(1 / 60); an.update && an.update(1 / 60); }
    return { morto, mexeu: +Math.hypot(an.x - x0, an.y - y0).toFixed(2), dentroDeParede: areaBlocked(an.x - 2, an.y - 2, an.x + 2, an.y + 2) };
  });
  console.log(JSON.stringify(r), r.morto && r.mexeu === 0 && !r.dentroDeParede ? 'OK: corpo parado' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

// t105: carro do trânsito troca de faixa virando o bico (como carro de verdade), sem deslizar de lado parado
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const r = await p.evaluate(() => {
    Profile.tut = 99; Events.spawnT = 1e9;
    const a = Traffic.cars.find((c) => c.state === 'edge' && c.sEnd - c.sStart > 900) || Traffic.cars.find((c) => c.state === 'edge'); a.committed = false; player.place(a.x + 3000, a.y + 3000, 0); a.yieldT = 0; a.nudge = 0;
    if (!a) return { semCarro: true };
    const L = a.e.T.lanes, base = Math.atan2(a.dy, a.dx);
    // andando: troca de faixa
    a.v = 160; a.cruise = 160; a.s = a.sStart + 20; a.blocker = null; a.offT = a.off + (L.length > 1 ? (L[1] - L[0]) * (a.lane ? -1 : 1) : 12);
    let maxAng = 0, passos = 0, d0 = Math.abs(a.offT - a.off);
    for (let i = 0; i < 240 && (Math.abs(a.offT - a.off) > 0.2 || Math.abs(a.offV) > 0.5); i++) { a.update(1 / 60, Game.time); a.v = 160; maxAng = Math.max(maxAng, Math.abs(angDiff(a.a, base))); passos++; }
    const fimAng = Math.abs(angDiff(a.a, base));
    for (let i = 0; i < 40; i++) { a.update(1 / 60, Game.time); a.v = 160; if (a.state !== 'edge') break; }
    const angDepois = +(Math.abs(angDiff(a.a, base)) * 57.3).toFixed(1), dbg2 = [a.state, +a.off.toFixed(1), +a.offT.toFixed(1), +(a.offV || 0).toFixed(1), +(a.nudge||0).toFixed(1), a.e === undefined];
    // parado: quase não anda de lado
    const o0 = a.off; a.v = 0; a.cruise = 0; a.offT = a.off + 20; let lat = 0; for (let i = 0; i < 60; i++) { a.update(1 / 60, Game.time); a.v = 0; } lat = Math.abs(a.off - o0);
    return { dbg: [a.state, +a.off.toFixed(1), +a.offT.toFixed(1), +(a.offV||0).toFixed(1), +(a.nudge||0).toFixed(1), a.e.T.lanes.length], dist: +d0.toFixed(1), maxAngGraus: +(maxAng * 57.3).toFixed(1), tempo: +(passos / 60).toFixed(2), angFinal: angDepois, dbg2, parado1s: +lat.toFixed(1) };
  });
  console.log(JSON.stringify(r));
  const ok = r.maxAngGraus > 4 && r.maxAngGraus < 25 && r.angFinal < 1 && r.parado1s < 4;
  console.log(ok ? 'OK: troca de faixa virando o bico' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

const { chromium } = require('playwright');
(async () => {
  const q = process.argv[2] || 'alta';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const r = await p.evaluate(async (q) => {
    Settings.quality = q; resize(); clearChunks(); Profile.tut = 99; Events.spawnT = 1e9;
    const e = World.edges.filter(e => e.T.id === 'avenue' && e.h).sort((a, b) => b.len - a.len)[0];
    player.place(e.a.x + 100, e.a.y + 25, 0); Keys.KeyW = true;
    await new Promise(r => setTimeout(r, 1000));
    window.__PROF = {}; let frames = 0; const t0 = performance.now();
    await new Promise(res => { const f = () => { frames++; if (performance.now() - t0 < 8000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    Keys.KeyW = false; const P = window.__PROF; window.__PROF = null;
    const o = {}; let tot = 0; for (const k in P) { o[k] = +(P[k] / frames).toFixed(2); tot += P[k] / frames; } o.TOTAL = +tot.toFixed(2);
    return { q, fps: +(frames / 8).toFixed(1), ms: o };
  }, q);
  console.log(JSON.stringify(r)); await b.close();
})();

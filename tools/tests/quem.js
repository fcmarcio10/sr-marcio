// quem gasta pinceladas no quadro inteiro (mapa, GPS, velocímetro, HUD), por função que chamou
// uso: FILE=wrapped.html node quem.js x y
const { chromium } = require('playwright');
(async () => {
  const [x, y] = [+(process.argv[2] || 3000), +(process.argv[3] || 7500)];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto('file://' + process.cwd() + '/' + (process.env.FILE || 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  await p.evaluate(([x, y]) => { Profile.tut = 99; Events.spawnT = 1e9; player.place(x, y + 18, 0); Cam.x = x; Cam.y = y; if (process) 0; }, [x, y]).catch(() => {});
  await p.evaluate(([x, y]) => { Profile.tut = 99; Events.spawnT = 1e9; player.place(x, y + 18, 0); Cam.x = x; Cam.y = y; Keys.KeyW = true; }, [x, y]);
  await p.waitForTimeout(2500);
  const r = await p.evaluate(async () => {
    const P = CanvasRenderingContext2D.prototype, names = ['fill', 'stroke', 'fillRect', 'strokeRect', 'drawImage', 'fillText', 'strokeText', 'clearRect', 'putImageData'];
    const by = {}, orig = {}; let total = 0, frames = 0;
    for (const n of names) { orig[n] = P[n]; P[n] = function () { total++; const st = new Error().stack.split('\n'); let f = '?'; for (let i = 2; i < st.length; i++) { const m = st[i].match(/at (?:Object\.|Function\.|[A-Za-z_]+\.)?([A-Za-z_$][\w$]*)/); if (m && m[1] !== 'eval') { f = m[1]; break; } } by[f] = (by[f] || 0) + 1; return orig[n].apply(this, arguments); }; }
    await new Promise(res => { const t0 = performance.now(); const f = () => { frames++; if (performance.now() - t0 < 2500) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    for (const n of names) P[n] = orig[n];
    Keys.KeyW = false;
    const out = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, v]) => k + ': ' + Math.round(v / frames));
    return { porQuadro: Math.round(total / frames), frames, regiao: regionKeyAt(player.x, player.y), out };
  });
  console.log(r.regiao, 'pinceladas por quadro (tudo):', r.porQuadro); console.log(r.out.join('\n')); await b.close();
})();

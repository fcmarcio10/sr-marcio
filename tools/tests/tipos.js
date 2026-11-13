// custo de desenho por tipo de objeto (pinceladas e tempo), em vários pontos do mapa
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto('file://' + process.cwd() + '/' + (process.env.FILE || 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const pts = process.env.PTS ? JSON.parse(process.env.PTS) : [[1600, 1500], [3000, 7500], [1200, 8100], [1500, 4100], [3400, 4700], [3650, 700], [5450, 7300], [6900, 7800], [8150, 6900], [2500, 6200], [7700, 3000]];
  const tot = {};
  for (const [x, y] of pts) {
    const r = await p.evaluate(([x, y]) => {
      Profile.tut = 99; Events.spawnT = 1e9;
      player.place(x, y + 18, 0); Cam.x = x; Cam.y = y; forceGround = true; player.vx = 700;
      for (let i = 0; i < 25; i++) { player.vx = 700; updateCamera(1 / 60); render(); }
      const P = CanvasRenderingContext2D.prototype, names = ['fill', 'stroke', 'fillRect', 'drawImage', 'strokeRect', 'fillText'];
      let calls = 0; const orig = {};
      for (const n of names) { orig[n] = P[n]; P[n] = function () { calls++; return orig[n].apply(this, arguments); }; }
      const T = {}, add = (k, d, c) => { const o = T[k] || (T[k] = [0, 0, 0]); o[0] += d; o[1] += c; o[2]++; };
      const oT = drawTall, oE = drawTallEmissive;
      const key = (o) => o.kind === 'bld' ? 'bld_' + o.style : o.kind;
      drawTall = function (c, o) { const c0 = calls, t = performance.now(); oT(c, o); add('d:' + key(o), performance.now() - t, calls - c0); };
      drawTallEmissive = function (c, o) { const c0 = calls, t = performance.now(); oE(c, o); add('e:' + key(o), performance.now() - t, calls - c0); };
      const N = 8; let c0 = calls;
      for (let i = 0; i < N; i++) { player.vx = 700; updateCamera(1 / 60); render(); }
      const all = calls - c0;
      drawTall = oT; drawTallEmissive = oE; for (const n of names) P[n] = orig[n];
      const out = {}; for (const k in T) out[k] = [+(T[k][0] / N).toFixed(3), Math.round(T[k][1] / N), Math.round(T[k][2] / N)];
      return { reg: regionKeyAt(x, y), all: Math.round(all / N), out };
    }, [x, y]);
    let s = 0; for (const k in r.out) { s += r.out[k][1]; const t = tot[k] || (tot[k] = [0, 0, 0]); t[0] += r.out[k][0]; t[1] += r.out[k][1]; t[2] += r.out[k][2]; }
    console.log(r.reg.padEnd(14), 'pinceladas/quadro', r.all, '(objetos altos:', s + ')');
  }
  console.log('\nsoma dos pontos por tipo: [ms, pinceladas, quantidade]');
  for (const [k, v] of Object.entries(tot).sort((a, b) => b[1][1] - a[1][1]).slice(0, 26)) console.log(k.padEnd(20), v[0].toFixed(2).padStart(7), String(v[1]).padStart(6), String(v[2]).padStart(6));
  await b.close();
})();

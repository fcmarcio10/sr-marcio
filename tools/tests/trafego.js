// mede o trânsito dirigindo: carros no total, carros na tela e tempo gasto simulando
// uso: FILE=wrapped.html node trafego.js [y da avenida] [segundos]
const { chromium } = require('playwright');
(async () => {
  const Y = +(process.argv[2] || 1500), SEC = +(process.argv[3] || 14);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/' + (process.env.FILE || 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const r = await p.evaluate(async ([Y, SEC]) => {
    Settings.quality = 'alta'; resize(); Profile.tut = 99; Events.spawnT = 1e9; Profile.time = 20 * 60;
    const e = World.edges.filter(e => e.h && Math.abs(e.a.y - Y) < 5 && e.T.id === 'avenue').sort((a, b) => a.a.x - b.a.x)[0] || World.edges.filter(e => e.h && Math.abs(e.a.y - Y) < 5)[0];
    player.place(e.a.x + 60, e.a.y + 18, 0); Cam.x = player.x; Cam.y = player.y; Traffic.fill(player.x, player.y);
    const T = { tr: 0, an: 0, steps: 0 };
    const oT = Traffic.update, oA = Animals.update;
    Traffic.update = function () { const t = performance.now(); oT.apply(this, arguments); T.tr += performance.now() - t; T.steps++; };
    Animals.update = function () { const t = performance.now(); oA.apply(this, arguments); T.an += performance.now() - t; };
    let tot = 0, vis = 0, n = 0, maxTot = 0, popIn = 0; let seen = new Set();
    const inV = (c, m) => { const v = Cam.view; return c.x > v.x0 - m && c.x < v.x1 + m && c.y > v.y0 - m && c.y < v.y1 + m; };
    const t0 = performance.now(); let lastSet = new Set();
    // vai e volta na avenida: 4 s acelerando, freia, dá ré... simplificado: acelera e para
    await new Promise(res => {
      const f = () => {
        const el = (performance.now() - t0) / 1000;
        Keys.KeyW = el % 6 < 4; Keys.KeyS = el % 6 >= 4.6;
        n++; tot += Traffic.cars.length; maxTot = Math.max(maxTot, Traffic.cars.length);
        const cur = new Set();
        for (const c of Traffic.cars) if (inV(c, 0)) { vis++; cur.add(c); if (!lastSet.has(c) && seen.has(c) === false && inV(c, -40)) popIn++; seen.add(c); }
        lastSet = cur;
        if (el < SEC) requestAnimationFrame(f); else res();
      }; requestAnimationFrame(f);
    });
    Keys.KeyW = Keys.KeyS = false; Traffic.update = oT; Animals.update = oA;
    return { regiao: regionKeyAt(player.x, player.y), carrosTotal: +(tot / n).toFixed(1), maxTotal: maxTot, naTela: +(vis / n).toFixed(1), surgiramNoMeioDaTela: popIn, transitoMsPorQuadro: +(T.tr / n).toFixed(2), animaisMsPorQuadro: +(T.an / n).toFixed(2), quadros: n };
  }, [Y, SEC]);
  console.log((process.env.FILE || 'wrapped.html').padEnd(18), JSON.stringify(r)); if (errs.length) console.log(errs.slice(0, 3).join('\n')); await b.close();
})();

// mede travadas dirigindo o carro mais rápido (todo upado) pelas ruas da Serra
// uso: node prof3.js [alta|media|baixa] [y da rua]
const { chromium } = require('playwright');
(async () => {
  const q = process.argv[2] || 'alta', Y = +(process.argv[3] || 7500);
  const b = await chromium.launch(process.env.GPU ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-accelerated-2d-canvas'] } : {}); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/' + (process.env.FILE || 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const r = await p.evaluate(async ([q, Y]) => {
    Settings.quality = q; resize(); clearChunks(); Profile.tut = 99; Events.spawnT = 1e9;
    // carro mais rápido, tudo no máximo
    const top = CARS.slice().sort((a, b) => b.max - a.max)[0];
    carCfg(top.id).up = { motor: 3, cambio: 3, freio: 3, pneu: 3 }; Profile.current = top.id; player.setCar(top.id);
    Profile.fuel = 100; Profile.damage = 0;
    const e = World.edges.filter(e => e.h && Math.abs(e.a.y - Y) < 5).sort((a, b) => a.a.x - b.a.x)[0];
    player.place(e.a.x + 40, e.a.y + 18, 0); clearChunks(); forceGround = true;
    // conta tempo de pedaços do jogo
    const T = { chunk: 0, chunkN: 0, step: 0, render: 0, hud: 0 };
    const wrap = (name, key, cnt) => { const f = window[name]; window[name] = function () { const t = performance.now(); const r = f.apply(this, arguments); T[key] += performance.now() - t; if (cnt) T[cnt]++; return r; }; return f; };
    const o1 = renderChunk, o2 = stepPlay, o3 = render, o4 = updateHUD;
    // funções declaradas no topo: troca a referência global
    renderChunk = function (a, b2) { const t = performance.now(); const r = o1(a, b2); const d = performance.now() - t; T.chunk += d; T.chunkN++; T.chunkMax = Math.max(T.chunkMax || 0, d); return r; };
    stepPlay = function (dt) { const t = performance.now(); o2(dt); T.step += performance.now() - t; };
    render = function () { const t = performance.now(); o3(); T.render += performance.now() - t; };
    updateHUD = function (dt) { const t = performance.now(); o4(dt); T.hud += performance.now() - t; };
    Keys.KeyW = true;
    const fr = []; let last = performance.now(); const t0 = last; let minX = player.x;
    window.__PROF = {};
    await new Promise(res => { const f = (now) => { fr.push(now - last); last = now; if (now - t0 < 12000 && player.x < 4500) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    Keys.KeyW = false;
    const P = window.__PROF; window.__PROF = null;
    const n = fr.length, s = fr.slice(1).sort((a, b) => a - b);
    const prof = {}; for (const k in P) prof[k] = +(P[k] / n).toFixed(2);
    return { q, car: top.name, speedKmh: Math.round(player.speed * 0.3), x: [Math.round(minX), Math.round(player.x)], frames: n, fps: +(n / ((last - t0) / 1000)).toFixed(1),
      p50: +s[Math.floor(s.length * 0.5)].toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), max: +s[s.length - 1].toFixed(1), over33: s.filter(x => x > 33).length, over50: s.filter(x => x > 50).length,
      perFrame: { step: +(T.step / n).toFixed(2), render: +(T.render / n).toFixed(2), hud: +(T.hud / n).toFixed(2), chunk: +(T.chunk / n).toFixed(2) }, chunks: T.chunkN, chunkAvg: +(T.chunk / Math.max(1, T.chunkN)).toFixed(1), chunkMax: +(T.chunkMax || 0).toFixed(1), prof };
  }, [q, Y]);
  console.log(JSON.stringify(r)); if (errs.length) console.log(errs.join('\n')); await b.close();
})();

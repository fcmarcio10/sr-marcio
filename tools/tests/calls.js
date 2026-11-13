// conta as pinceladas (chamadas de desenho) por quadro num ponto do mapa
const { chromium } = require('playwright');
(async () => {
  const file = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto('file://' + process.cwd() + '/' + file);
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  for (const [x, y] of [[3000, 7500], [1200, 7500], [3000, 8100], [1600, 1500]]) {
    const r = await p.evaluate(([x, y]) => {
      Settings.quality = 'alta'; resize(); Profile.tut = 99; Events.spawnT = 1e9;
      player.place(x, y + 18, 0); Cam.x = x; Cam.y = y; forceGround = true;
      for (let i = 0; i < 30; i++) { player.vx = 700; updateCamera(1 / 60); render(); }
      const P = CanvasRenderingContext2D.prototype, names = ['fill', 'stroke', 'fillRect', 'drawImage', 'setTransform', 'save'], orig = {}, cnt = {};
      for (const n of names) { orig[n] = P[n]; cnt[n] = 0; P[n] = function () { cnt[n]++; return orig[n].apply(this, arguments); }; }
      const N = 10; for (let i = 0; i < N; i++) { player.vx = 700; updateCamera(1 / 60); render(); }
      for (const n of names) P[n] = orig[n];
      const o = { at: regionKeyAt(x, y) }; let tot = 0; for (const n of names) { o[n] = Math.round(cnt[n] / N); if (n !== 'setTransform' && n !== 'save') tot += o[n]; } o.desenhos = tot; return o;
    }, [x, y]);
    console.log(file.padEnd(18), JSON.stringify(r));
  }
  await b.close();
})();

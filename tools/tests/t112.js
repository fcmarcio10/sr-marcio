// t112: contador de FPS (só o número, colorido, embaixo do mapa) e trava de 30/60/120 FPS
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; VoicePlayer.stop(); Screens.closeAll(); Settings.showFps = true; $('fps').classList.remove('hidden'); });
  const mede = async (cap) => { await p.evaluate((c) => { Settings.fpsCap = c; window.__n = 0; const f = () => { window.__n++; }; window.__h = f; }, cap);
    const n0 = await p.evaluate(() => Game.fpsN + 0), t0 = Date.now();
    const c0 = await p.evaluate(() => { window.__c = 0; const o = window.render; window.__ro = o; window.render = function () { window.__c++; }; /* sem desenhar: mede só a trava (este computador não tem placa de vídeo) */ return 0; });
    await p.waitForTimeout(3000);
    return await p.evaluate(() => { const c = window.__c; window.render = window.__ro; return Math.round(c / 3); }); };
  const f30 = await mede('30'), f60 = await mede('60');
  await p.waitForTimeout(700);
  const r = await p.evaluate(() => { const el = $('fps'), m = $('hud-minimap').getBoundingClientRect(), f = el.getBoundingClientRect(); return { txt: el.textContent, cls: el.className, fpsTopo: Math.round(f.top), mapaBaixo: Math.round(m.bottom), dentroDaTela: f.bottom <= window.innerHeight, centro: Math.round(f.left + f.width / 2), mapaCentro: Math.round(m.left + m.width / 2) }; });
  await p.screenshot({ path: 'fps.png', clip: { x: 0, y: 540, width: 300, height: 280 } });
  console.log(JSON.stringify({ f30, f60, r }));
  const ok = f30 <= 32 && f30 >= 20 && f60 > f30 + 5 && /^\d+ FPS$/.test(r.txt) && r.fpsTopo >= r.mapaBaixo - 2 && r.dentroDaTela && Math.abs(r.centro - r.mapaCentro) < 4;
  console.log(ok ? 'OK: contador de FPS e trava' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

// t111: colisões mais realistas (batida forte quica menos; carro de trás empurra o da frente e ele gira se pegou fora do centro)
// e câmera com tranco na batida
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const r = await p.evaluate(() => {
    Profile.tut = 99; Events.spawnT = 1e9; VoicePlayer.stop(); Profile.damage = 0;
    const out = {};
    // parede: devagar x rápido (quanto da velocidade volta)
    const parede = (v) => {
      // parede de teste no meio da rua (bem longe de tudo)
      if (!window._paredeT) window._paredeT = addRectCol(2185, 1490, 2200, 1546, 'bld');
      player.place(2160 - player.m.L / 2, 1518, 0); player.vx = v; player.vy = 0; player.spin = 0; player.impactCd = 9;
      let vmin = v; for (let i = 0; i < 60; i++) { player.update(1 / 120, { thr: 0, brk: 0, steer: 0, hb: false }); vmin = Math.min(vmin, player.vx); }
      return +(Math.max(0, -vmin) / v).toFixed(2);
    };
    out.voltaDevagar = parede(120); out.voltaRapido = parede(500);
    // por trás num carro do trânsito, pegando fora do centro
    for (let i = 0; i < 900 && !Traffic.cars.some((c) => c.state === 'edge' && c.sEnd - c.s > 300); i++) stepPlay(1 / 60);
    const a = Traffic.cars.find((c) => c.state === 'edge' && c.sEnd - c.s > 300);
    if (a) {
      a.v = 40; const c = Math.cos(a.a), s = Math.sin(a.a), px = -s, py = c;
      player.place(a.x - c * (a.m.L / 2 + player.m.L / 2 + 6) + px * 7, a.y - s * (a.m.L / 2 + player.m.L / 2 + 6) + py * 7, a.a);
      player.vx = c * 300; player.vy = s * 300; Cam.kx = Cam.ky = 0; player.impactCd = 0;
      const v0 = a.v; let vmax = v0, yaw = 0, kick = 0;
      for (let i = 0; i < 30; i++) { player.update(1 / 120, { thr: 0, brk: 0, steer: 0, hb: false }); vmax = Math.max(vmax, a.v); yaw = Math.max(yaw, Math.abs(a.yaw || 0)); kick = Math.max(kick, Math.hypot(Cam.kx || 0, Cam.ky || 0)); }
      out.carro = { v0, vmax: Math.round(vmax), girou: +yaw.toFixed(3), tranco: +kick.toFixed(1) };
    }
    return out;
  });
  console.log(JSON.stringify(r));
  const ok = r.voltaDevagar !== null && r.voltaRapido < r.voltaDevagar && r.carro && r.carro.vmax > r.carro.v0 + 30 && r.carro.girou > 0.005 && r.carro.tranco > 1;
  console.log(ok ? 'OK: batidas realistas e tranco da câmera' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

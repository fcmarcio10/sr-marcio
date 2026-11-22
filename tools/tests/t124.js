// t124: caminhão do Seu Zé é um carro do trânsito com rota: vem pela rua, não atravessa ninguém, chega perto de você e volta
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const r = await p.evaluate(() => {
    Profile.tut = 99; Events.spawnT = 1e9; VoicePlayer.stop(); Screens.closeAll(); Profile.fuel = 3; Profile.money = 5000;
    // longe da oficina: ele vem de uma rua a 1,2 km
    const of = World.shops.find((s) => s.kind === 'oficina');
    const e = World.edges.filter((e) => e.T.asphalt && e.len > 300 && Math.hypot(e.a.x - of.x, e.a.y - of.y) > 1500 && Math.hypot(e.a.x - of.x, e.a.y - of.y) < 2400)[0];
    const lx = e.h ? e.a.x + 150 : e.a.x + e.T.lanes[0], ly = e.h ? e.a.y + e.T.lanes[0] : e.a.y + 150;
    player.x = lx; player.y = ly; player.vx = player.vy = 0; player.a = e.h ? 0 : Math.PI / 2; Cam.x = lx; Cam.y = ly; Traffic.fill(lx, ly);
    socorroCall('gas');
    const ex = []; let t = 0, dentro = 0, foraDaRua = 0, maxV = 0, chegou = -1, voltou = -1, min = 1e9, sumiu = false;
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 300; i++) {
      player.vx = player.vy = 0; player.x = lx; player.y = ly;
      stepPlay(dt); t += dt;
      const J = Socorro.job; if (!J) { sumiu = true; break; }
      const c = J.car; if (!c) continue;
      maxV = Math.max(maxV, c.v);
      for (const o of Traffic.cars) if (o !== c && Math.hypot(o.x - c.x, o.y - c.y) < (o.m.W + c.m.W) * 0.35) { dentro++; break; }
      const g = groundAt(c.x, c.y); if (!(g === SF.ROAD || g === SF.BRIDGE || g === SF.PAVED || g === SF.DIRT || g === SF.SIDEWALK)) { foraDaRua++; if (foraDaRua % 6 === 1) ex.push([g, J.state, c.state, Math.round(c.v), c.e.T.id, Math.round(t*10)/10, Math.round(c.off)]); }
      if (J.state === 'arrived' && chegou < 0) { chegou = t; min = Math.hypot(c.x - lx, c.y - ly); }
      if (J.state === 'leaving' && voltou < 0) voltou = t;
    }
    return { chegou: +chegou.toFixed(1), voltou: +voltou.toFixed(1), distChegada: Math.round(min), sumiu, dentro, foraDaRua, maxV: Math.round(maxV), gas: Math.round(Profile.fuel), ex };
  });
  console.log(JSON.stringify(r));
  const ok = r.chegou > 0 && r.distChegada < 240 && r.voltou > r.chegou && r.dentro < 30 && r.foraDaRua < 30 && r.gas > 50;
  console.log(ok ? 'OK: Seu Zé vem pelo trânsito, chega e volta' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

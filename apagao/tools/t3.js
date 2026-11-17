// Teste longo: zumbis arrombando porta, dormir, virar a noite, e 3 minutos de jogo acelerado sem erro.
const { chromium } = require('playwright');
const S = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 700)));
  await p.goto('file://' + __dirname + '/teste.html'); await p.waitForTimeout(1500);
  await p.click('#b-new'); await p.waitForTimeout(500);
  const out = await p.evaluate(() => {
    const o = {}, P = Player, hb = World.builds[World.home];
    // zumbis do lado de fora da porta, jogador faz barulho dentro
    const zs = []; for (let i = 0; i < 3; i++) zs.push(Zombies.make(hb.door.x + 0.5 + (i - 1) * 0.6, hb.door.y + 3.5, 'comum'));
    P.x = hb.door.x + 0.5; P.y = hb.door.y - 0.5;
    let t = 0; for (; t < 60; t += 0.03) { if (t % 1 < 0.03) Noise.emit(P.x, P.y, 8); P.hp = 100; Main.step(0.03); if (World.eN[idx(hb.door.x, hb.door.y + 1)] !== E.DOOR) break; }
    o.portaArrombada = [t.toFixed(1), World.eN[idx(hb.door.x, hb.door.y + 1)], zs.map(z => z.st + (z.bash ? '!' : ''))];
    for (let k = 0; k < 400; k++) { P.hp = 100; Main.step(0.03); }
    o.entraram = zs.filter(z => World.bld[idx(Math.floor(z.x), Math.floor(z.y))] === hb.id).length;
    for (const z of zs) Zombies.kill(z, 1, 0);
    for (let k = 0; k < 60; k++) Main.step(0.03);
    // dormir
    for (const z of Zombies.list) if (dist(z.x, z.y, P.x, P.y) < 40) z.hp = 0, z.dead = true, z.fall = 1;
    P.energy = 20; P.hp = 100; P.bleed = 0; P.hunger = 90; P.thirst = 90; P.startSleep(1); o.dormindo = P.sleeping;
    let k = 0; for (; k < 2000 && P.sleeping; k++) { Input.pressed.length = 0; Main.step(0.03); }
    o.acordou = [Math.round(P.energy), fmtHora(G.time), Math.round(P.hunger), Math.round(P.thirst)];
    // 3 minutos andando pela cidade (teleporta em vários bairros)
    const pts = [[1, 1], [2, 2], [3, 2], [4, 0], [1, 4], [4, 3], [0, 4], [2, 0]];
    let maxMs = 0, tot = 0, n = 0;
    for (const [bx, by] of pts) { P.x = blockStart(bx) - 3.5; P.y = blockStart(by) + 12.5; Cam.x = P.x; Cam.y = P.y; P.hp = 100;
      for (let i = 0; i < 300; i++) { Input.keys.KeyD = i % 120 < 80; Input.keys.KeyS = i % 90 < 30; P.hp = 100; const t0 = performance.now(); Main.step(0.033); const d = performance.now() - t0; tot += d; n++; if (i > 5 && d > maxMs) maxMs = d; } }
    Input.keys = {};
    o.ms = [(tot / n).toFixed(1), maxMs.toFixed(0)]; o.zumbis = Zombies.list.length; o.ativos = Zombies.active.length; o.hora = 'dia ' + G.day + ' ' + fmtHora(G.time);
    P.x = blockStart(3) + 14.5; P.y = blockStart(2) + 19.5; Cam.x = P.x; Cam.y = P.y; G.time = 12 * 60; P.hp = 100;
    return o;
  });
  await p.waitForTimeout(600); await p.screenshot({ path: S + '/upa.png' });
  await p.evaluate(() => { const b = World.builds.find(b => b && b.type === 'mercado'); Player.x = b.door.x + 0.5; Player.y = b.door.y - 1.5; Cam.x = Player.x; Cam.y = Player.y; Player.hp = 100; for (const z of Zombies.active) if (dist(z.x, z.y, Player.x, Player.y) < 5) { z.x += 9; } });
  await p.waitForTimeout(900); await p.screenshot({ path: S + '/mercado.png' });
  await p.evaluate(() => { Player.x = blockStart(0) - 4; Player.y = blockStart(1) + 20.5; Cam.x = Player.x; Cam.y = Player.y; Player.hp = 100; G.time = 9 * 60; });
  await p.waitForTimeout(900); await p.screenshot({ path: S + '/rua.png' });
  console.log(JSON.stringify(out)); console.log(errs.slice(0, 6).join('\n---\n') || 'sem erros');
  await b.close();
})();

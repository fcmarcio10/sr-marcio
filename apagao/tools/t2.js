// Teste dos sistemas: andar, zumbi, combate, mochila, noite, tiro, salvar.
const { chromium } = require('playwright');
const S = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 700))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await p.goto('file://' + __dirname + '/teste.html'); await p.waitForTimeout(1500);
  await p.click('#b-new'); await p.waitForTimeout(800);
  const out = {};
  // andar
  const p0 = await p.evaluate(() => [Player.x, Player.y]);
  await p.keyboard.down('KeyD'); await p.waitForTimeout(700); await p.keyboard.up('KeyD');
  await p.keyboard.down('KeyS'); await p.waitForTimeout(700); await p.keyboard.up('KeyS');
  const p1 = await p.evaluate(() => [Player.x, Player.y]); out.andou = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(2);
  // mochila
  await p.keyboard.press('Tab'); await p.waitForTimeout(300); await p.screenshot({ path: S + '/mochila.png' }); await p.keyboard.press('Tab');
  // zumbi dentro de casa, combate
  out.zumbi = await p.evaluate(() => { const P = Player; let z = null; for (const [dx, dy] of [[1.5, 0], [0, 1.5], [-1.5, 0], [0, -1.5], [1, 1]]) if (canStand(P.x + dx, P.y + dy, 0.25) && canSee(P.x, P.y, P.x + dx, P.y + dy)) { z = Zombies.make(P.x + dx, P.y + dy, 'comum'); break; } window.__z = z; return z ? 'ok' : 'sem lugar'; });
  await p.waitForTimeout(600);
  out.perseguindo = await p.evaluate(() => window.__z && window.__z.st);
  for (let i = 0; i < 14; i++) { await p.evaluate(() => { const z = window.__z, P = Player; const sx = (isoX(z.x, z.y) - Cam.ix) * Cam.zoom + Render.cw / 2, sy = (isoY(z.x, z.y) - Cam.iy) * Cam.zoom + Render.ch / 2 - 14; Input.mx = sx; Input.my = sy; Input.clicked = true; }); await p.waitForTimeout(650); if (i === 2) await p.screenshot({ path: S + '/luta.png' }); }
  out.zmorto = await p.evaluate(() => [window.__z.dead, G.kills, Math.round(Player.hp)]);
  // sair de casa pela porta: achar a porta e abrir
  out.porta = await p.evaluate(() => { const b = World.builds[World.home]; Player.x = b.door.x + 0.5; Player.y = b.door.y + 0.5; Player.a = Math.PI / 2; Interact.find(); const l = Interact.cur && Interact.cur.label; Interact.act(); return l + ' -> ' + World.eN[idx(b.door.x, b.door.y + 1)]; });
  await p.evaluate(() => { const b = World.builds[World.home]; Player.y = b.door.y + 1.6; });
  await p.waitForTimeout(500); await p.screenshot({ path: S + '/fora.png' });
  // rua de noite com lanterna
  await p.evaluate(() => { Player.add(newItem('lanterna', 1)); Player.x = RPOS[1] + 5; Player.y = RPOS[2] + 5; Cam.x = Player.x; Cam.y = Player.y; G.time = 23 * 60; Player.toggleLight(); for (let i = 0; i < 5; i++) Zombies.make(Player.x + 4 + i, Player.y + (i % 2) * 2 - 1); });
  await p.mouse.move(900, 380); await p.waitForTimeout(1500); await p.screenshot({ path: S + '/noite.png' });
  // tiro
  await p.evaluate(() => { const g = newItem('trovao38', 1); g.a = 6; Player.add(g); Player.equip(g); });
  await p.mouse.move(900, 380); for (let i = 0; i < 4; i++) { await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(600); }
  out.tiro = await p.evaluate(() => [Player.eq.hand.a, G.kills, Zombies.active.filter(z => z.st === 'chase').length]);
  // centro de dia
  await p.evaluate(() => { for (const z of Zombies.list) z.dead || (z.hp = z.hp); G.time = 10 * 60; Player.lightOn = false; Player.x = blockStart(1) + 14; Player.y = blockStart(1) + 14.5; Cam.x = Player.x; Cam.y = Player.y; Player.hp = 100; });
  await p.waitForTimeout(700); await p.screenshot({ path: S + '/centro.png' });
  await p.evaluate(() => { Player.x = blockStart(2) + 12.5; Player.y = blockStart(2) + 24.5; Cam.x = Player.x; Cam.y = Player.y; Player.hp = 100; G.time = 17.6 * 60; });
  await p.waitForTimeout(700); await p.screenshot({ path: S + '/praca.png' });
  // velocidade
  out.ms = await p.evaluate(() => { const t = performance.now(); for (let i = 0; i < 20; i++) Main.step(0.016); return ((performance.now() - t) / 20).toFixed(1); });
  // salvar e continuar
  out.save = await p.evaluate(() => { Player.hp = 100; G.state = 'play'; Save.write(); const n = Player.inv.length, x = Player.x; Main.toMenu(); Main.continueGame(); return [n, Player.inv.length, x === Player.x, Zombies.list.length]; });
  await p.keyboard.press('KeyM'); await p.waitForTimeout(300); await p.screenshot({ path: S + '/mapa.png' });
  console.log(JSON.stringify(out)); console.log(errs.slice(0, 8).join('\n---\n') || 'sem erros');
  await b.close();
})();

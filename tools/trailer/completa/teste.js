const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.log('ERRO', e.message)); p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[p]', m.text().slice(0, 200)); });
  await p.addInitScript({ path: path.join(__dirname, '..', 'relogio.js') }); await p.addInitScript({ path: path.join(__dirname, 'pagina.js') });
  await p.goto('file://' + path.join(__dirname, '..', '..', 'tests', 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.evaluate(() => { localStorage.clear(); Settings.fpsCap = 0; });
  await p.click('[data-act="play"]'); await p.waitForFunction(() => Game.carregando === false, null, { timeout: 30000 });
  await p.evaluate(() => { Profile.tut = 99; Screens.closeAll(); window.__VT.start(); REC.ligaPiloto(); const o = World.shops.find((s) => s.kind === 'oficina'); REC.piloto.vai(o.x, o.y, { vel: 280 }); });
  const N = +(process.env.N || 600); fs.mkdirSync('/tmp/claude-0/q', { recursive: true });
  let t0 = Date.now(); await p.evaluate((n) => REC.inicia(n), N);
  for (let i = 0; i < N; i++) { await p.evaluate(() => REC.passo()); if (i % 3 === 0) await p.screenshot({ path: `/tmp/claude-0/q/${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 88 }); }
  console.log('quadros', N, 'em', (Date.now() - t0) / 1000, 's');
  const n = await p.evaluate(() => REC.termina()); const out = Buffer.alloc(n);
  for (let i = 0; i < n; i += 4 << 20) Buffer.from(await p.evaluate(([i, m]) => REC.pedaco(i, m), [i, 4 << 20]), 'base64').copy(out, i);
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + n, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(48000, 24); h.writeUInt32LE(192000, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(n, 40);
  fs.writeFileSync('/tmp/claude-0/q/som.wav', Buffer.concat([h, out]));
  console.log(await p.evaluate(() => JSON.stringify({ log: REC.log, x: player.x | 0, y: player.y | 0, R: !!REC.piloto.R, dmg: Profile.damage, sp: player.speed | 0 })));
  await b.close();
})();

// Varredura de coisas anormais: simula a cidade em vários bairros e anota carros um dentro do outro,
// carro do trânsito dentro de construção, carro parado muito tempo, posição inválida (NaN),
// pedestre andando no meio da pista e bicho dentro de casa. Uso (de dentro de tools/tests): node varredura.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const R = await p.evaluate(() => {
    Profile.tut = 99; Events.spawnT = 1e9; Settings.radioOff = true; VoicePlayer.stop();
    const lugares = [['centro', 2100, 1500], ['vila', 1500, 3300], ['jardim', 3300, 2300], ['feurosa', 1200, 6700], ['carapina', 3000, 7500], ['rodovia', 3000, 6221], ['orla', 7000, 8725], ['industrial', 5600, 1500], ['novarosa', 6600, 4200], ['saopedro', 5200, 3300]];
    const out = { porLugar: {}, total: {} };
    const conta = (k, txt) => { out.total[k] = (out.total[k] || 0) + 1; (out.ex = out.ex || {})[k] = (out.ex[k] || []); if (out.ex[k].length < 4) out.ex[k].push(txt); };
    const dentroCasa = (x, y) => { colGrid.query(x - 1, y - 1, x + 1, y + 1, _q); return _q.some((c) => c.t === 0 && c.tag === 'bld' && x > c.x0 + 2 && x < c.x1 - 2 && y > c.y0 + 2 && y < c.y1 - 2); };
    for (const [nome, x, y] of lugares) {
      const ne = nearestEdge(x, y), e = ne.e; const px = e.a.x + e.dx * ne.s, py = e.a.y + e.dy * ne.s;
      player.place(px, py, Math.atan2(e.dy, e.dx)); player.vx = player.vy = 0; Cam.x = px; Cam.y = py; render();
      const parado = new Map(); const antes = JSON.stringify(out.total);
      for (let i = 0; i < 60 * 40; i++) {
        stepPlay(1 / 60); if (i % 2 === 0) { updateCamera(1 / 60); }
        if (i % 30 === 0) { render();
          const C = Traffic.cars;
          for (let a = 0; a < C.length; a++) {
            const A = C[a];
            if (!isFinite(A.x) || !isFinite(A.y) || !isFinite(A.a)) conta('carro NaN', nome);
            if (dentroCasa(A.x, A.y)) conta('carro dentro de construção', nome + ' ' + Math.round(A.x) + ',' + Math.round(A.y));
            for (let k = a + 1; k < C.length; k++) { const B = C[k], d = Math.hypot(A.x - B.x, A.y - B.y); if (d < Math.min(A.m.W, B.m.W) * 0.6 && !A.ghost && !(A.ghost > 0) && !(B.ghost > 0)) conta('carros um dentro do outro', nome + ' ' + Math.round(A.x) + ',' + Math.round(A.y)); }
            if (A._px !== undefined && A.v > 40) { const mx = A.x - A._px, my = A.y - A._py; if (Math.hypot(mx, my) > 8) { const d = Math.abs(angDiff(Math.atan2(my, mx), A.a)); if (d > 0.5 && d < 2.6) conta('carro andando de lado', nome + ' ' + Math.round(A.x) + ',' + Math.round(A.y) + ' ' + A.state + ' ' + Math.round(d * 57) + '°'); } }
            A._px = A.x; A._py = A.y;
            if (A.v < 2) { parado.set(A, (parado.get(A) || 0) + 0.5); if (parado.get(A) === 25) conta('carro parado 25 s', nome + ' ' + Math.round(A.x) + ',' + Math.round(A.y) + ' ' + A.state + (A.blocker ? ' bloqueado por ' + (A.blocker === player ? 'você' : A.blocker.constructor.name) : '') + (A.atLight ? ' semáforo' : '')); }
            else parado.delete(A);
          }
          for (const an of Animals.list) {
            if (!nearView(an.x, an.y, 0)) continue;
            if (!isFinite(an.x)) conta('bicho NaN', nome);
            if (an.type === 'person' && an.onRoad && !an.morto && !an.cruza && an.state !== 'flee' && !World.nodes.some((n) => Math.abs(n.x - an.x) < n.hx + 30 && Math.abs(n.y - an.y) < n.hy + 30)) conta('pedestre no meio da pista', nome + ' ' + Math.round(an.x) + ',' + Math.round(an.y));
            if (an.type !== 'owl' && dentroCasa(an.x, an.y)) conta(an.type + ' dentro de construção', nome + ' ' + Math.round(an.x) + ',' + Math.round(an.y));
          }
          if (!isFinite(player.x)) conta('jogador NaN', nome);
        }
      }
      out.porLugar[nome] = antes === JSON.stringify(out.total) ? 'ok' : 'achou';
    }
    return out;
  });
  console.log(JSON.stringify(R, null, 1));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

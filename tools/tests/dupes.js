// dupes.js: procura itens repetidos no mapa (mesmo tipo no mesmo lugar): construções, árvores, postes, lojas, objetos, luzes e colisões
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  const r = await p.evaluate(() => {
    const out = {};
    const conta = (nome, lista, chave) => { const m = new Map(); let n = 0; const ex = []; for (const o of lista) { const k = chave(o); if (k === null) continue; if (m.has(k)) { n++; if (ex.length < 6) ex.push(k); } else m.set(k, 1); } out[nome] = { n, ex }; };
    const r2 = (v) => Math.round(v / 2) * 2;
    conta('altos (mesmo tipo e lugar)', World.tall, (o) => o.removed ? null : o.kind + ':' + (o.pts ? JSON.stringify(o.pts) : '') + (o.x !== undefined ? r2(o.x) + ',' + r2(o.y) : r2(o.x0) + ',' + r2(o.y0) + ',' + r2(o.x1) + ',' + r2(o.y1)));
    conta('lojas (mesmo nome)', World.shops, (s) => s.name);
    conta('lojas (mesmo lugar)', World.shops, (s) => r2(s.x) + ',' + r2(s.y));
    conta('pontos turísticos', World.pois, (q) => q.id);
    conta('objetos baixos', World.props || [], (q) => q.type + ':' + r2(q.x) + ',' + r2(q.y));
    conta('luzes', World.lights, (L) => r2(L.x) + ',' + r2(L.y) + ':' + Math.round(L.r));
    conta('carros parados', PARKED, (c) => r2(c.x) + ',' + r2(c.y));
    const cols = []; const vistos = new Set();
    for (const cell of colGrid.cells) if (cell) for (const c of cell) { if (vistos.has(c)) continue; vistos.add(c); cols.push(c); }
    conta('colisões', cols, (c) => c.tag === 'none' ? null : c.tag + ':' + (c.t === 1 ? r2(c.x) + ',' + r2(c.y) + ',' + r2(c.r) : r2(c.x0) + ',' + r2(c.y0) + ',' + r2(c.x1) + ',' + r2(c.y1)));
    conta('apps do celular', [...Object.keys(PH_APPS)], (k) => PH_APPS[k]);
    conta('conquistas', ACHIEVEMENTS_ALL, (a) => a.id);
    conta('falas (chave)', VOICE_LINES, (l) => l.clip);
    return out;
  });
  for (const [k, v] of Object.entries(r)) console.log(k.padEnd(28), v.n, v.ex.join(' | '));
  await b.close();
})();

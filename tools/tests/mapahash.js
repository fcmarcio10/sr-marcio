// Impressão digital do mapa: posição de todas as árvores, postes, casas, lojas e carros parados.
// Serve para conferir que uma mudança não embaralhou o sorteio do mapa. Uso: node mapahash.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + __dirname + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  const r = await p.evaluate(() => {
    const parts = [];
    for (const t of World.tall) parts.push(t.kind + ':' + Math.round(t.x !== undefined ? t.x : t.x0) + ',' + Math.round(t.y !== undefined ? t.y : t.y0));
    for (const s of World.shops) parts.push('shop:' + s.name + Math.round(s.x) + ',' + Math.round(s.y));
    for (const c of PARKED) parts.push('car:' + c.model + Math.round(c.x) + ',' + Math.round(c.y));
    const hash = (L) => { let h = 0; const str = L.join('|'); for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; };
    return { n: parts.length, h: hash(parts), semSemaforo: hash(parts.filter((x) => !x.startsWith('tlight:'))), poles: World.trafficPoles.filter((q) => q.node.x === 2100 && q.node.y === 6200).map((q) => [Math.round(q.x), Math.round(q.y)]) };
  });
  console.log(JSON.stringify(r)); await b.close();
})();

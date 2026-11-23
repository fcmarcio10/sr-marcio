// Confere as plantas das casas: nenhuma porta tapada por móvel e todo móvel alcançável a partir da cama.
// Uso: node tests/plantas_node.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'render', 'homeScene.js'), 'utf8');
const m = src.match(/const LAY = (\{[\s\S]*?\n  \});/); const LAY = vm.runInNewContext('(' + m[1] + ')');
let bad = 0;
for (const [k, lay] of Object.entries(LAY)) {
  const g = []; for (let y = 0; y < lay.h; y++) { g[y] = []; for (let x = 0; x < lay.w; x++) g[y][x] = 'w'; }
  lay.rooms.forEach(r => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) g[y][x] = 'f'; });
  lay.doors.forEach(([x, y]) => { g[y][x] = 'd'; }); g[lay.entry[1]][lay.entry[0]] = 'd';
  const block = {}; Object.entries(lay.objs).forEach(([id, o]) => { for (let y = o[1]; y < o[1] + o[3]; y++) for (let x = o[0]; x < o[0] + o[2]; x++) block[x + ',' + y] = id; });
  (lay.decoFloor || []).forEach(([x, y], i) => { block[x + ',' + y] = block[x + ',' + y] || 'decoração ' + i; }); // pior caso: toda decoração comprada
  const walk = (x, y) => g[y] && g[y][x] && g[y][x] !== 'w' && !block[x + ',' + y];
  lay.doors.concat([lay.entry]).forEach(([x, y]) => {
    const hz = g[y][x - 1] === 'w' && g[y][x + 1] === 'w'; const sides = hz ? [[x, y - 1], [x, y + 1]] : [[x - 1, y], [x + 1, y]];
    sides.forEach(([a, b]) => { if (g[b] && g[b][a] && g[b][a] !== 'w' && block[a + ',' + b]) { bad++; console.log(`casa ${k}: porta ${x},${y} tapada por ${block[a + ',' + b]}`); } });
  });
  const seen = new Set(); const q = [lay.start]; seen.add(lay.start.join());
  while (q.length) { const [x, y] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy; if (walk(nx, ny) && !seen.has(nx + ',' + ny)) { seen.add(nx + ',' + ny); q.push([nx, ny]); } }); }
  Object.entries(lay.objs).forEach(([id, o]) => { if (o.length > 4 && !seen.has(o[4] + ',' + o[5])) { bad++; console.log(`casa ${k}: não dá para chegar em ${id} (${o[4]},${o[5]})`); } });
  console.log(`casa ${k}: ${lay.doors.length + 1} portas, ${Object.keys(lay.objs).length} móveis conferidos`);
}
console.log(bad ? bad + ' problema(s)' : 'TUDO CERTO'); process.exit(bad ? 1 : 0);

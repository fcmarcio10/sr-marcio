/* ============================ MUNDO ============================ */
const WORLD_W = 9000, WORLD_H = 9200;
const SERRA_YS = [6200, 6900, 7500, 8100, 8700];
const GC = 10, GW = WORLD_W / GC, GH = WORLD_H / GC;
const SF = { GRASS: 0, ROAD: 1, SIDEWALK: 2, DIRT: 3, WATER: 4, BRIDGE: 5, PAVED: 6, FIELD: 7, EARTH: 8, SAND: 9 };
const SURF = [
  { grip: 0.55, drag: 1.05, dirt: 0.020, rough: 0.6 },  // grama
  { grip: 1.00, drag: 0.00, dirt: -0.004, rough: 0 },   // asfalto
  { grip: 0.95, drag: 0.10, dirt: 0, rough: 0.15 },     // calçada
  { grip: 0.70, drag: 0.30, dirt: 0.030, rough: 0.8 },  // terra
  { grip: 1.00, drag: 0.00, dirt: 0, rough: 0 },        // água (bloqueado)
  { grip: 0.95, drag: 0.02, dirt: 0, rough: 0.35 },     // ponte
  { grip: 0.97, drag: 0.03, dirt: 0, rough: 0.05 },     // pavimentado
  { grip: 0.50, drag: 1.55, dirt: 0.045, rough: 1 },    // plantação
  { grip: 0.66, drag: 0.55, dirt: 0.030, rough: 0.7 },  // chão batido
  { grip: 0.48, drag: 1.70, dirt: 0.020, rough: 0.9 },  // areia
];
const ground = new Uint8Array(GW * GH);
function gFill(x0, y0, x1, y1, t) {
  const a = clamp(Math.floor(x0 / GC), 0, GW - 1), b = clamp(Math.ceil(x1 / GC) - 1, 0, GW - 1);
  const c = clamp(Math.floor(y0 / GC), 0, GH - 1), d = clamp(Math.ceil(y1 / GC) - 1, 0, GH - 1);
  for (let y = c; y <= d; y++) { const row = y * GW; for (let x = a; x <= b; x++) ground[row + x] = t; }
}
function groundAt(x, y) {
  const gx = (x / GC) | 0, gy = (y / GC) | 0;
  if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return SF.WATER;
  return ground[gy * GW + gx];
}

/* -------- grade espacial -------- */
let _gridId = 0;
class Grid {
  constructor(cell) {
    this.cell = cell; this.cols = Math.ceil(WORLD_W / cell) + 1; this.rows = Math.ceil(WORLD_H / cell) + 1;
    this.cells = new Array(this.cols * this.rows); this.stamp = 0; this.k = '_g' + (_gridId++);
  }
  insert(o, x0, y0, x1, y1) {
    const c = this.cell;
    const a = clamp(Math.floor(x0 / c), 0, this.cols - 1), b = clamp(Math.floor(x1 / c), 0, this.cols - 1);
    const e = clamp(Math.floor(y0 / c), 0, this.rows - 1), f = clamp(Math.floor(y1 / c), 0, this.rows - 1);
    for (let y = e; y <= f; y++) for (let x = a; x <= b; x++) {
      const i = y * this.cols + x;
      (this.cells[i] || (this.cells[i] = [])).push(o);
    }
  }
  query(x0, y0, x1, y1, out) {
    out.length = 0;
    const c = this.cell, s = ++this.stamp, k = this.k;
    const a = clamp(Math.floor(x0 / c), 0, this.cols - 1), b = clamp(Math.floor(x1 / c), 0, this.cols - 1);
    const e = clamp(Math.floor(y0 / c), 0, this.rows - 1), f = clamp(Math.floor(y1 / c), 0, this.rows - 1);
    for (let y = e; y <= f; y++) for (let x = a; x <= b; x++) {
      const arr = this.cells[y * this.cols + x];
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) { const o = arr[i]; if (o[k] !== s) { o[k] = s; out.push(o); } }
    }
    return out;
  }
}
const colGrid = new Grid(128);
const rendGrid = new Grid(256);
const lightGrid = new Grid(256);
const bakeGrid = new Grid(512);
let _bakeOrd = 0;
function bake(x0, y0, x1, y1, z, fn) {
  const it = { x0, y0, x1, y1, z, fn, o: _bakeOrd++ };
  bakeGrid.insert(it, x0, y0, x1, y1);
  return it;
}
function addRectCol(x0, y0, x1, y1, tag) { const c = { t: 0, x0, y0, x1, y1, tag: tag || 'solid' }; colGrid.insert(c, x0, y0, x1, y1); return c; }
function addCircCol(x, y, r, tag) { const c = { t: 1, x, y, r, tag: tag || 'solid' }; colGrid.insert(c, x - r, y - r, x + r, y + r); return c; }
const _q = [];
function areaBlocked(x0, y0, x1, y1) {
  colGrid.query(x0, y0, x1, y1, _q);
  for (const c of _q) {
    if (c.t === 0) { if (c.x1 > x0 && c.x0 < x1 && c.y1 > y0 && c.y0 < y1) return true; }
    else if (c.x + c.r > x0 && c.x - c.r < x1 && c.y + c.r > y0 && c.y - c.r < y1) return true;
  }
  return false;
}

const World = {
  nodes: [], edges: [], nodeMap: new Map(),
  buildings: [], tall: [], lights: [], shops: [], pois: [], races: [], parkSpots: [],
  homes: [], animalsDef: [], pickups: [], trafficPoles: [], bumps: [], grills: [], radars: [], sparkers: [], geysers: [], fountains: [], obras: [], depots: {}, rachas: [], parties: [], pitches: [],
};

/* -------- tipos de via -------- */
const RT = {
  street: { id: 'street', w: 95, sw: 22, lanes: [23], speed: 150, asphalt: true, center: 'dash' },
  avenue: { id: 'avenue', w: 180, sw: 22, lanes: [25, 67], speed: 190, asphalt: true, center: 'double', laneDiv: 46 },
  highway: { id: 'highway', w: 180, sw: 0, lanes: [24, 66], speed: 280, asphalt: true, center: 'double', laneDiv: 45, edgeLine: true, shoulder: 16 },
  road: { id: 'road', w: 90, sw: 0, lanes: [23], speed: 200, asphalt: true, center: 'dash', edgeLine: true, shoulder: 12 },
  dirt: { id: 'dirt', w: 76, sw: 0, lanes: [18], speed: 115, asphalt: false },
};
const XS = [300, 850, 1450, 2100, 2700, 3350, 3950, 4600];
const YS = [300, 880, 1500, 2080, 2700, 3300, 3880, 4500, 5300];
const HWY_Y = 6200;
const ROADS = [];
function H(y, x1, x2, t, name) { ROADS.push({ h: true, y, x1, x2, T: RT[t], name }); }
function V(x, y1, y2, t, name) { ROADS.push({ h: false, x, y1, y2, T: RT[t], name }); }

function riverCX(y) { return 5450 + Math.sin(y * 0.00105) * 140 + Math.sin(y * 0.0029 + 1.3) * 45; }
function riverHW(y) { return 135 + Math.sin(y * 0.0021 + 0.5) * 22; }

function defineRoads() {
  H(300, 300, 4600, 'street', 'Rua do Pão de Queijo');
  H(880, 300, 4600, 'street', 'Rua Sete de Sextembro');
  H(1500, 300, 4600, 'avenue', 'Avenida Brasil Sil Sil');
  H(1500, 4600, 8700, 'road', 'Estrada do Sol Rachando');
  H(2080, 300, 4600, 'street', 'Rua 15 de Novembrinho');
  H(2700, 300, 4600, 'street', 'Rua dos Bobos');
  H(3300, 300, 4600, 'street', 'Rua Ipê-Ipê Urra');
  H(3880, 300, 4600, 'avenue', 'Avenida Sem Mundial');
  H(3880, 4600, 8700, 'dirt', 'Estrada da Ponte Que Balança');
  H(4500, 300, 4600, 'street', 'Rua Tem Que Ver Isso Aí');
  H(5300, 300, 4600, 'street', 'Rua da Esperança Equilibrista');
  H(880, 7500, 8700, 'dirt', 'Estrada da Vaca Atolada');
  H(5300, 6300, 7500, 'dirt', 'Ramal do Fim do Mundo');
  H(HWY_Y, 300, 8700, 'highway', 'Rodovia BR-101 e Pouco');
  V(300, 300, 8700, 'street', 'Rua Santos Dumontanha');
  V(850, 300, 5300, 'street', 'Rua da Matriz Perdoa');
  V(1450, 300, 8700, 'street', 'Rua do Cafezinho');
  V(2100, 300, 8700, 'avenue', 'Avenida Paulistinha');
  V(2700, 300, 5300, 'street', 'Rua Bela Vista Cansada');
  V(3350, 300, 5300, 'street', 'Rua da Gambiarra');
  V(3950, 300, 8700, 'street', 'Rua do Comércio Fiado');
  V(4600, 300, 8700, 'street', 'Rua Beira-Rio Sem Peixe');
  // Serra: Feio Rosa e Jardim Cara-Pintada
  V(850, 6200, 8700, 'street', 'Rua da Laje Batida');
  V(2700, 6200, 8700, 'street', 'Rua do Campinho');
  V(3350, 6200, 8700, 'street', 'Rua da Padaria do Morro');
  H(6900, 300, 4600, 'street', 'Rua das Flores de Feio Rosa');
  H(7500, 300, 4600, 'avenue', 'Avenida Cara-Pintada');
  H(8100, 300, 4600, 'street', 'Rua do Baile');
  H(8700, 300, 4600, 'street', 'Rua da Esperança Que Sobe');
  V(6300, 1500, 6200, 'road', 'Estrada Velha de Guerra');
  V(7500, 880, 6200, 'dirt', 'Estrada do Sítio Bota Fé');
  V(8700, 880, 6200, 'road', 'Estrada Alta Pressão');
  // litoral (Barra do Jururuzinho, Camburiso e Porto do Tubarão Banguela)
  H(7500, 4600, 8700, 'avenue', 'Avenida Cara-Pintada');
  H(8100, 4600, 8700, 'street', 'Rua da Maré Cheia');
  H(8700, 4600, 8700, 'avenue', 'Avenida Dante Micheline e Meio');
  V(6300, 6200, 8700, 'street', 'Rua do Sol Nascente');
  V(7500, 6200, 8700, 'street', 'Rua dos Coqueiros');
  V(8700, 6200, 8700, 'road', 'Estrada do Porto');
}

function getNode(x, y) {
  const k = x + ',' + y;
  let n = World.nodeMap.get(k);
  if (!n) { n = { id: World.nodes.length, x, y, edges: [], light: null, res: null, resT: 0 }; World.nodes.push(n); World.nodeMap.set(k, n); }
  return n;
}
function buildRoadGraph() {
  defineRoads();
  for (const r of ROADS) r.pts = new Set(r.h ? [r.x1, r.x2] : [r.y1, r.y2]);
  for (const h of ROADS) if (h.h) for (const v of ROADS) if (!v.h) {
    if (v.x >= h.x1 && v.x <= h.x2 && h.y >= v.y1 && h.y <= v.y2) { h.pts.add(v.x); v.pts.add(h.y); }
  }
  for (const r of ROADS) {
    const p = [...r.pts].sort((a, b) => a - b);
    for (let i = 0; i < p.length - 1; i++) {
      const a = r.h ? getNode(p[i], r.y) : getNode(r.x, p[i]);
      const b = r.h ? getNode(p[i + 1], r.y) : getNode(r.x, p[i + 1]);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const e = { id: World.edges.length, a, b, T: r.T, name: r.name, h: r.h, len, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len, hw: r.T.w / 2, bridge: null };
      a.edges.push(e); b.edges.push(e); World.edges.push(e);
    }
  }
  const perp = (e, n) => { let m = 0; for (const o of n.edges) if (o.h !== e.h) m = Math.max(m, o.hw); return m; };
  for (const e of World.edges) {
    const pa = perp(e, e.a), pb = perp(e, e.b);
    const pad = e.T.sw ? 26 : 10;
    e.perpA = pa; e.perpB = pb;
    e.clearA = pa > 0 ? pa + pad : 8;
    e.clearB = pb > 0 ? pb + pad : 8;
    if (e.h) {
      const cx = riverCX(e.a.y), hw = riverHW(e.a.y);
      if (e.a.x < cx - hw && e.b.x > cx + hw) e.bridge = { x0: cx - hw - 46, x1: cx + hw + 46, wood: e.T.id === 'dirt' };
    }
  }
  const lightNodes = [[850, 1500], [1450, 1500], [2100, 1500], [2700, 1500], [3350, 1500], [2100, 880], [2100, 2080], [2100, 2700], [2100, 3880], [1450, 3880], [2700, 3880], [2100, 6200]];
  for (const [x, y] of lightNodes) {
    const n = World.nodeMap.get(x + ',' + y);
    if (n) n.light = { off: rnd(0, 15) };
  }
}
function edgeBox(e, extra) {
  const m = e.hw + (e.T.sw || 0) + (e.T.shoulder || 0) + (extra || 0);
  if (e.h) return [e.a.x, e.a.y - m, e.b.x, e.a.y + m];
  return [e.a.x - m, e.a.y, e.a.x + m, e.b.y];
}
function nearestEdge(x, y) {
  let best = null, bd = 1e18, bs = 0;
  for (const e of World.edges) {
    let s, d;
    if (e.h) { s = clamp(x - e.a.x, 0, e.len); d = Math.hypot(x - (e.a.x + s), y - e.a.y); }
    else { s = clamp(y - e.a.y, 0, e.len); d = Math.hypot(x - e.a.x, y - (e.a.y + s)); }
    if (d < bd) { bd = d; best = e; bs = s; }
  }
  return { e: best, d: bd, s: bs };
}

/* -------- regiões -------- */
const REGIONS = {
  centro: { name: 'Centrão', dark: 0.72, city: 1, rural: 0 },
  industrial: { name: 'Distrito da Gambiarra', dark: 0.76, city: 0.6, rural: 0.1 },
  vila: { name: 'Vila Sem Pressa', dark: 0.75, city: 0.55, rural: 0.25 },
  jardim: { name: 'Alfavila', dark: 0.75, city: 0.45, rural: 0.3 },
  rio: { name: 'Rio Jururu', dark: 0.76, city: 0.15, rural: 0.8 },
  sitio: { name: 'Sítio Bota Fé', dark: 0.76, city: 0, rural: 1 },
  fazenda: { name: 'Fazenda Muuuito Longe', dark: 0.76, city: 0, rural: 1 },
  rodovia: { name: 'Rodovia BR-101 e Pouco', dark: 0.76, city: 0.2, rural: 0.7 },
  novarosa: { name: 'Nova Prosa da Pena', dark: 0.74, city: 0.7, rural: 0.15 },
  flexal: { name: 'Flexão', dark: 0.74, city: 0.7, rural: 0.15 },
  saopedro: { name: 'Morro de São Pedreiro', dark: 0.75, city: 0.6, rural: 0.2 },
  terravermelha: { name: 'Terra Amarelou', dark: 0.75, city: 0.6, rural: 0.2 },
  feurosa: { name: 'Feio Rosa', dark: 0.74, city: 0.7, rural: 0.15 },
  carapina: { name: 'Jardim Cara-Pintada', dark: 0.74, city: 0.7, rural: 0.15 },
  mata: { name: 'Mata do Saci', dark: 0.80, city: 0, rural: 1 },
  barra: { name: 'Barra do Jururuzinho', dark: 0.75, city: 0.45, rural: 0.2 },
  camburi: { name: 'Jardim Camburiso', dark: 0.73, city: 0.75, rural: 0 },
  porto: { name: 'Porto do Tubarão Banguela', dark: 0.74, city: 0.7, rural: 0 },
  orla: { name: 'Orla de Camburiso', dark: 0.72, city: 0.5, rural: 0 },
};
const SUBREG = [];
function regionKeyAt(x, y) {
  if (y > CALC_Y - 40) return x < ORLA_X0 ? 'mata' : 'orla';
  if (x < 230 || y < 230 || x > 8790) return 'mata';
  if (y > 6440 && x >= 4660) return x >= 7520 ? 'porto' : x >= 6300 ? 'camburi' : 'barra';
  for (const s of SUBREG) if (x > s[0] && x < s[2] && y > s[1] && y < s[3]) return s[4];
  if (y > 8030 && x < 4660) return x < 2700 ? 'novarosa' : 'flexal';
  if (y > 6440 && x < 4660) return x < 2100 ? 'feurosa' : 'carapina';
  if (y > 6440) return 'mata';
  if (y > 5720) return 'rodovia';
  if (x >= 6200) return y < 3300 ? 'sitio' : 'fazenda';
  if (x >= 4660) return 'rio';
  if (y < 2700) return x < 3350 ? 'centro' : 'industrial';
  return x < 2100 ? 'vila' : 'jardim';
}

/* -------- decalques (chão) -------- */
const DECAL_SURF = {
  lawn: SF.GRASS, lawn2: SF.GRASS, yard: SF.PAVED, drive: SF.PAVED, urban: SF.PAVED, paved: SF.PAVED, gravel: SF.EARTH,
  concrete: SF.PAVED, plaza: SF.PAVED, walk: SF.PAVED, corn: SF.FIELD, cane: SF.FIELD, coffee: SF.FIELD, soy: SF.FIELD,
  hill: SF.GRASS, pasture: SF.GRASS, earth: SF.EARTH, soccer: SF.EARTH, forest: SF.GRASS, garden: SF.FIELD, sand: SF.SAND, pool: SF.WATER, court: SF.PAVED,
};
function decal(x0, y0, x1, y1, type, opt) {
  const d = { x0, y0, x1, y1, type, seed: (hash2(x0 | 0, y0 | 0) * 1e6) | 0, opt: opt || {} };
  bake(x0, y0, x1, y1, d.opt.z !== undefined ? d.opt.z : 1, (g) => drawDecal(g, d));
  if (DECAL_SURF[type] !== undefined && !d.opt.noSurf) gFill(x0, y0, x1, y1, DECAL_SURF[type]);
  return d;
}
function decalR(r, type, opt) { return decal(r[0], r[1], r[2], r[3], type, opt); }

/* -------- objetos -------- */
const HOUSE_COLORS = ['#e8d9a8', '#f0c8a0', '#c9dfe8', '#e3b5b5', '#cfe3c1', '#f2efe6', '#e8c07a', '#d6c4e6', '#b9d4c9', '#f4dcc0', '#e1a77a', '#a9c6e0'];
const WALL_COLORS = ['#d8d2c2', '#c9b79c', '#e6e0d0', '#b8b0a2', '#cfc6b0', '#9fa8a3', '#e2d2b6', '#c4a989'];
const OFFICE_COLORS = ['#8c939e', '#a39a8b', '#6f7a87', '#b5ada0', '#7d8a8f', '#9c8f84', '#5f6b78', '#c2b8a8'];
const ROOF_TILE = ['#a8492b', '#b8582f', '#93422a', '#c06a3c', '#8a3b24'];

function addBuilding(x0, y0, x1, y1, h, o) {
  o = o || {};
  const b = {
    kind: 'bld', x0, y0, x1, y1, h, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2,
    style: o.style || 'house', roofType: o.roofType || 'flat', roofColor: o.roofColor || '#7d7b78',
    wall: o.wall || pick(HOUSE_COLORS), lit: o.lit !== undefined ? o.lit : 0.4,
    seed: (hash2(x0 | 0, y1 | 0) * 1e6) | 0, front: o.front || 'S', sign: o.sign || null, signColor: o.signColor || '#ffb547',
    roof: null, glowSign: null, alphaNear: !!o.alphaNear,
  };
  World.buildings.push(b); World.tall.push(b);
  if (!o.noCol) addRectCol(x0, y0, x1, y1, 'bld');
  rendGrid.insert(b, x0, y0, x1, y1);
  if (!o.noShadow) {
    const sx = h * 0.42, sy = h * 0.55;
    bake(x0, y0, x1 + sx, y1 + sy, 7, (g) => {
      g.fillStyle = 'rgba(0,0,0,0.34)';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1 + sx, y0 + sy); g.lineTo(x1 + sx, y1 + sy); g.lineTo(x0 + sx, y1 + sy); g.lineTo(x0, y1); g.closePath(); g.fill();
    });
  }
  return b;
}
function addTall(o, x0, y0, x1, y1) { World.tall.push(o); rendGrid.insert(o, x0, y0, x1, y1); return o; }
function addLight(x, y, r, i, col, extra) {
  const L = Object.assign({ x, y, r, i, col, flick: 0, broken: false, seed: rnd() }, extra || {});
  World.lights.push(L); lightGrid.insert(L, x - r, y - r, x + r, y + r);
  return L;
}

const TREE_TYPES = ['round', 'round', 'mango', 'ipeY', 'ipeP', 'palm', 'bush', 'pine'];
function addTree(x, y, type, size, opt) {
  opt = opt || {};
  if (!opt.force) {
    const gt = groundAt(x, y);
    if (gt === SF.ROAD || gt === SF.DIRT || gt === SF.WATER || gt === SF.BRIDGE || gt === SF.SIDEWALK && !opt.sidewalk) return null;
    if (areaBlocked(x - 6, y - 6, x + 6, y + 6)) return null;
  }
  size = size || rnd(0.8, 1.25);
  const t = { kind: 'tree', x, y, type, size, h: (type === 'palm' ? 46 : type === 'bush' ? 10 : 30) * size, v: rndi(0, 2), alpha: 1 };
  World.tall.push(t);
  const R = (type === 'palm' ? 26 : type === 'bush' ? 12 : 24) * size;
  rendGrid.insert(t, x - R, y - R, x + R, y + R);
  const tc = type !== 'bush' ? addCircCol(x, y, type === 'palm' ? 4 : 5 * size, 'tree') : addCircCol(x, y, 7 * size, 'tree');
  t.col = tc;
  if (opt.sidewalk || type === 'bush' || size < 0.9) tc.brk = { kind: 'tree', obj: t };
  const sr = R * 0.9;
  bake(x - sr, y - sr, x + sr * 2, y + sr * 2, 7, (g) => {
    if (t.removed) return;
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath(); g.ellipse(x + sr * 0.45, y + sr * 0.55, sr, sr * 0.8, 0.5, 0, TAU); g.fill();
  });
  return t;
}
function scatterTrees(x0, y0, x1, y1, n, types, smin, smax) {
  let made = 0;
  for (let i = 0; i < n * 3 && made < n; i++) {
    if (addTree(rnd(x0, x1), rnd(y0, y1), pick(types), rnd(smin || 0.8, smax || 1.25))) made++;
  }
}
function addLamp(bx, by, hx, hy, col, opt) {
  opt = opt || {};
  const lamp = { kind: 'lamp', x: bx, y: by, hx, hy, h: opt.h || 56, col, style: opt.style || 'arm', broken: opt.broken || false };
  World.tall.push(lamp);
  rendGrid.insert(lamp, Math.min(bx, hx) - 60, Math.min(by, hy) - 60, Math.max(bx, hx) + 60, Math.max(by, hy) + 60);
  const lc = addCircCol(bx, by, 4, 'pole'); lc.brk = { kind: 'lamp', obj: lamp };
  if (!lamp.broken) lamp.light = addLight(hx, hy, opt.r || 175, opt.i || 0.92, col, { lamp, flick: opt.flick ? 1 : 0 });
  bake(bx - 4, by - 4, bx + 30, by + 34, 7, (g) => { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + 22, by + 28); g.stroke(); });
  return lamp;
}
// objetos baixos (desenhados no chão pré-renderizado)
function addProp(type, x, y, opt) {
  opt = opt || {};
  const p = { type, x, y, a: opt.a || 0, c: opt.c || null, w: opt.w || 0, h: opt.h || 0, seed: rnd() };
  const R = opt.R || 30;
  bake(x - R, y - R, x + R, y + R, opt.z || 8, (g) => drawProp(g, p));
  let col = null;
  if (opt.col === 'circ') col = addCircCol(x, y, opt.cr || 6, 'prop');
  else if (opt.col === 'rect') col = addRectCol(x - opt.w / 2, y - opt.h / 2, x + opt.w / 2, y + opt.h / 2, 'prop');
  if (col && BREAKABLE[type]) col.brk = { kind: 'prop', obj: p, R: R + 20 };
  return p;
}
function addWall(x0, y0, x1, y1, color, opt) {
  opt = opt || {};
  if (x1 - x0 < 1 || y1 - y0 < 1) return;
  const w = { x0, y0, x1, y1, color, hgt: opt.h || 4, kind: opt.kind || 'wall', graf: opt.graf || null };
  bake(x0 - 2, y0 - 8, x1 + 6, y1 + 8, 8, (g) => drawWallBaked(g, w));
  if (!opt.noCol) addRectCol(x0, y0, x1, y1, 'wall');
}
function addFence(x0, y0, x1, y1, opt) {
  opt = opt || {};
  const f = { x0, y0, x1, y1, type: opt.type || 'wood', gaps: [] };
  bake(x0 - 4, y0 - 6, x1 + 6, y1 + 6, 8, (g) => drawFenceBaked(g, f));
  addRectCol(x0, y0, x1, y1, 'fence').brk = { kind: 'fence', obj: f };
}
// cercado com portões (gaps: lista {side, at, w})
function fenceRect(x0, y0, x1, y1, gaps, type) {
  const T = 3;
  const seg = (side, a, b, mk) => {
    const gs = (gaps || []).filter((g) => g.side === side).sort((p, q) => p.at - q.at);
    let cur = a;
    for (const g of gs) { if (g.at - g.w / 2 > cur) mk(cur, g.at - g.w / 2); cur = g.at + g.w / 2; }
    if (b > cur) mk(cur, b);
  };
  seg('N', x0, x1, (a, b) => addFence(a, y0 - T / 2, b, y0 + T / 2, { type }));
  seg('S', x0, x1, (a, b) => addFence(a, y1 - T / 2, b, y1 + T / 2, { type }));
  seg('W', y0, y1, (a, b) => addFence(x0 - T / 2, a, x0 + T / 2, b, { type }));
  seg('E', y0, y1, (a, b) => addFence(x1 - T / 2, a, x1 + T / 2, b, { type }));
}
const PARKED = [];
function addParkedCar(x, y, ang, model, color) {
  const m = VMODELS[model];
  const vert = Math.abs(Math.sin(ang)) > 0.5;
  const hx = (vert ? m.W : m.L) / 2, hy = (vert ? m.L : m.W) / 2;
  if (areaBlocked(x - hx, y - hy, x + hx, y + hy)) return null;
  const p = { x, y, a: ang, model, color };
  PARKED.push(p);
  bake(x - hx - 12, y - hy - 12, x + hx + 12, y + hy + 12, 8.5, (g) => drawVehicle(g, m, color, x, y, ang, { parked: true, seed: p.x }));
  addRectCol(x - hx, y - hy, x + hx, y + hy, 'car');
  return p;
}
const CAR_COLORS = ['#d6c7a1', '#9fc5e8', '#8a2b2b', '#d9d9d9', '#bfc3c7', '#8d949b', '#1d1f24', '#f2f2f2', '#a8231f', '#24446e', '#5a6b4e', '#c9b28a', '#7a1f2b', '#2d5d8a', '#d8c25a', '#3f3f46'];
function randomCarModel() { return pick(['quadrado', 'quadrado', 'escada', 'besouro', 'hatch', 'santana', 'sedan', 'pickup', 'van', 'sport']); }

/* -------- estabelecimentos -------- */
function addShop(def) {
  const s = Object.assign({ id: def.kind + '_' + World.shops.length, visited: false }, def);
  World.shops.push(s);
  return s;
}

/* ============================ LOTES E QUARTEIRÕES ============================ */
const MURO_FRASES = ['FÉ EM DEUS', 'DEUS É FIEL', 'JESUS TE AMA', 'NÃO JOGUE LIXO', 'ALUGA-SE', 'VENDE-SE', 'RESPEITA AS MINA', 'SAUDADE ETERNA', 'MAIS AMOR', 'PAZ NA QUEBRADA', 'FAVELA VIVE', 'CRIA DO MORRO', 'SÓ OS CRIA', 'VAI DAR CERTO', 'O MORRO É TALENTO', 'CAPIXABA COM ORGULHO', 'ESTUDA, MOLEQUE', 'FAZ O BEM', 'TÁ PAGO', 'SORRIA, VOCÊ ESTÁ NO 027'];
const PIXOS = ['CREW 027', 'OS GAMBIARRA', 'NOIS', 'ZN 027', 'LOKOS', 'PIXO ES', 'LAJE CREW', '027 SKATE', 'MANOS DA SERRA ELÉTRICA', 'TINTA FRESCA'];
function addGraffiti(b, kind) {
  return; // pichações removidas (custavam muito desempenho)
  kind = kind || (chance(0.45) ? 'frase' : chance(0.6) ? 'pixo' : 'mural');
  b.graf = { kind, text: kind === 'frase' || kind === 'mural' ? pick(MURO_FRASES) : pick(PIXOS), color: kind === 'pixo' ? pick(['#111111', '#111111', '#f2f2ea', '#c8241c']) : pick(['#e63946', '#1d4f9c', '#2a9d8f', '#111111', '#f4c430']), seed: rnd() };
}
const BREAKABLE = { cone: 'plastic', barrier: 'wood', bench: 'wood', bin: 'plastic', hydrant: 'metal', bollard: 'metal', table: 'plastic', tires: 'rubber', cart: 'metal', pot: 'clay' };
function lotFrame(x0, y0, x1, y1, front) {
  const F = { front, x0, y0, x1, y1 };
  const ns = front === 'N' || front === 'S';
  F.W = ns ? x1 - x0 : y1 - y0;
  F.D = ns ? y1 - y0 : x1 - x0;
  F.pt = (u, v) => {
    switch (front) {
      case 'N': return [x0 + u, y0 + v];
      case 'S': return [x1 - u, y1 - v];
      case 'W': return [x0 + v, y1 - u];
      default: return [x1 - v, y0 + u];
    }
  };
  F.rect = (u0, v0, u1, v1) => { const a = F.pt(u0, v0), b = F.pt(u1, v1); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; };
  F.out = { N: -Math.PI / 2, S: Math.PI / 2, W: Math.PI, E: 0 }[front];
  return F;
}
function splitRun(L, mn, mx) {
  const out = []; let rem = L;
  while (rem > mx) { const w = Math.round(rnd(mn, mx)); out.push(w); rem -= w; }
  if (rem < mn * 0.6 && out.length) out[out.length - 1] += rem; else out.push(rem);
  return out;
}
// ponto na pista em frente ao lote (faixa da direita mais próxima da calçada)
function roadPointFor(F, u, roadHW, laneOff) {
  return F.pt(u, -22 - (roadHW - laneOff));
}
const streetNums = new Map();
function nextNumber(name, side) {
  const k = name + side;
  const n = (streetNums.get(k) || (side === 'a' ? 11 : 20)) + rndi(1, 4) * 2 + 6;
  streetNums.set(k, n);
  return n;
}
function houseLot(F, o) {
  const W = F.W, D = F.D, rich = o.rich;
  const wallCol = pick(WALL_COLORS);
  const gateW = 32;
  const hasCar = W > 70 && chance(rich ? 0.5 : 0.36);
  const gateU = chance(0.5) ? 8 : W - 8 - gateW;
  const cim = chance(0.5);
  if (cim) decalR(F.rect(0, 0, W, Math.min(D, 70)), 'yard');
  // muros
  const fw = (u0, u1) => { if (u1 - u0 > 2) { const r = F.rect(u0, 0, u1, 5); addWall(r[0], r[1], r[2], r[3], wallCol); } };
  fw(0, gateU); fw(gateU + gateW, W);
  { const r = F.rect(0, 5, 4, D); addWall(r[0], r[1], r[2], r[3], wallCol); }
  if (o.lastLot) { const r = F.rect(W - 4, 5, W, D); addWall(r[0], r[1], r[2], r[3], wallCol); }
  if (o.back) { const r = F.rect(4, D - 4, W, D); addWall(r[0], r[1], r[2], r[3], wallCol); }
  // portão (desenhado no chão)
  { const r = F.rect(gateU, 0, gateU + gateW, 4); bake(r[0], r[1], r[2], r[3], 8, (g) => { g.fillStyle = '#3d3a36'; g.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]); g.fillStyle = '#6d6860'; for (let i = 0; i < 6; i++) { if (F.front === 'N' || F.front === 'S') g.fillRect(r[0] + 2 + i * 5, r[1], 1.5, r[3] - r[1]); else g.fillRect(r[0], r[1] + 2 + i * 5, r[2] - r[0], 1.5); } }); }
  const setback = hasCar ? rnd(58, 66) : rnd(22, 38);
  let depth = rich ? rnd(82, 104) : rnd(60, 82);
  depth = Math.min(depth, D - setback - 14);
  if (depth < 40) return;
  const sob = chance(rich ? 0.38 : 0.14);
  let h = sob ? rnd(42, 48) : rnd(25, 31);
  let roofType = rich ? pick(['hip', 'hip', 'flat', 'gable', 'hip']) : pick(['hip', 'hip', 'laje', 'laje', 'gable', 'amianto', 'tijolo', 'amianto']);
  let wall = pick(HOUSE_COLORS), brick = false;
  if (roofType === 'tijolo') { wall = pick(['#b5603a', '#a8553a', '#c06a40']); brick = true; h = rnd(30, 44); }
  if (roofType === 'amianto' && chance(0.3)) { wall = pick(['#b5603a', '#c8c2b4']); brick = wall === '#b5603a'; }
  const hr = F.rect(7, setback, W - 7, setback + depth);
  const roofColor = roofType === 'hip' || roofType === 'gable' ? pick(ROOF_TILE) : roofType === 'laje' || roofType === 'tijolo' ? '#8f8b84' : roofType === 'amianto' ? '#a7a9a4' : '#6f6c69';
  const hb = addBuilding(hr[0], hr[1], hr[2], hr[3], h, { style: 'house', front: F.front, roofType, roofColor, wall, lit: rnd(0.15, 0.6) });
  if (!rich && chance(0.2)) addGraffiti(hb);
  hb.brick = brick; hb.varal = chance(0.35); hb.dish = chance(0.3);
  // churrasco na laje: gente dançando, varal de lâmpadas e churrasqueira acesa
  if (roofType === 'laje' && !rich && chance(0.16) && hr[2] - hr[0] > 44 && hr[3] - hr[1] > 40) { hb.party = true; hb.varal = false; World.parties.push({ x: hb.cx, y: hb.cy, b: hb }); }
  if (hasCar) {
    const dr = F.rect(gateU, 0, gateU + gateW, setback);
    decalR(dr, 'drive');
    const p = F.pt(gateU + gateW / 2, setback / 2 + 1);
    addParkedCar(p[0], p[1], chance(0.5) ? F.out : F.out + Math.PI, randomCarModel(), pick(CAR_COLORS));
  }
  if (chance(0.55)) { const p = F.pt(gateU + gateW / 2, setback - 3); addLight(p[0], p[1], 55, 0.55, 'warm'); }
  const backSpace = D - setback - depth;
  if (backSpace > 34) {
    if (rich && chance(0.45) && W > 80) {
      const pr = F.rect(W / 2 - 24, setback + depth + 10, W / 2 + 24, Math.min(D - 8, setback + depth + 40));
      if (pr[2] - pr[0] > 20 && pr[3] - pr[1] > 20) decalR(pr, 'pool');
    } else if (chance(0.6)) {
      const p = F.pt(rnd(18, W - 18), setback + depth + backSpace * 0.55);
      addTree(p[0], p[1], pick(['mango', 'round', 'round', 'palm', 'ipeY', 'bush']), rnd(0.7, 1.0));
    }
  }
  if (o.street) {
    const rp = roadPointFor(F, W / 2, o.roadHW, o.laneOff);
    World.homes.push({ x: rp[0], y: rp[1], name: o.street + ', ' + nextNumber(o.street, F.front), region: o.region });
  }
}
function shopBuilding(F, def, o) {
  const W = F.W, D = F.D;
  decalR(F.rect(0, 0, W, D), 'yard');
  const depth = Math.min(D - 20, def.depth || 92);
  const r = F.rect(6, 12, W - 6, 12 + depth);
  const b = addBuilding(r[0], r[1], r[2], r[3], def.h || 34, { style: 'shop', front: F.front, roofType: 'flat', roofColor: '#77736d', wall: def.wall || '#efe6d2', lit: 0.85, sign: def.sign, signColor: def.color });
  // toldo / luz da fachada
  const lp = F.pt(W / 2, 6);
  addLight(lp[0], lp[1], 120, 0.95, def.color, { shop: true });
  const aw = F.rect(10, 4, W - 10, 12);
  bake(aw[0], aw[1], aw[2], aw[3], 8, (g) => drawAwning(g, aw, def.color, F.front));
  if (def.tables) {
    const tc = pick(['#d62828', '#f4c430', '#d62828']);
    for (const f of [0.18, 0.42, 0.66, 0.86]) { const tp = F.pt(W * f, -11); if (!areaBlocked(tp[0] - 7, tp[1] - 7, tp[0] + 7, tp[1] + 7)) addProp('table', tp[0], tp[1], { col: 'circ', cr: 5, c: tc, R: 12 }); }
  }
  const rp = roadPointFor(F, W / 2, o.roadHW, o.laneOff);
  const s = addShop({ kind: def.kind, name: def.name, x: rp[0], y: rp[1], bld: b, color: def.color, region: o.region, pickup: def.pickup, items: def.items });
  return s;
}
// comércio de bairro na esquina: açaí, barbearia, mercearia, igreja...
const CORNER_SHOPS = [
  { s: 'AÇAÍ DO BAIRRO', c: '#b05cff', t: true }, { s: 'BARBEARIA NAVALHA', c: '#59e0ff' }, { s: 'SALÃO DA DENISE', c: '#ff6fb5' },
  { s: 'IGREJA DA FÉ', c: '#f4f1e0', church: true }, { s: 'MERCEARIA DO TONINHO', c: '#ffd166' }, { s: 'LAN HOUSE', c: '#3cff8f' },
  { s: 'BAZAR 1,99', c: '#ff8a2a' }, { s: 'AÇOUGUE BOI GORDO', c: '#ff4d4d' }, { s: 'DEPÓSITO DE BEBIDAS', c: '#ffd23a', t: true },
  { s: 'LAVA-JATO', c: '#4cc9f0' }, { s: 'XEROX E PAPELARIA', c: '#9be15d' }, { s: 'SORVETERIA', c: '#ff9ed2', t: true },
  { s: 'CHAVEIRO 24H', c: '#ffe066' }, { s: 'AUTOPEÇAS', c: '#ff7b39' }, { s: 'MOTO PEÇAS', c: '#ff3b3b' }, { s: 'PADARIA PÃO QUENTE', c: '#ffb547', t: true },
  { s: 'ESPETINHO DO GORDO', c: '#ff9f1c', t: true, grill: true }, { s: 'BORRACHARIA', c: '#ffd23a' },
];
function cornerShop(F, o) {
  const W = F.W, D = F.D, def = pick(CORNER_SHOPS);
  decalR(F.rect(0, 0, W, D), 'yard');
  const depth = Math.min(D - 30, rnd(58, 78));
  const r = F.rect(6, 16, W - 6, 16 + depth);
  const b = addBuilding(r[0], r[1], r[2], r[3], def.church ? rnd(34, 40) : rnd(27, 36), { style: 'shop', front: F.front, roofType: def.church ? 'gable' : pick(['laje', 'laje', 'flat', 'amianto']), roofColor: def.church ? '#9a4a32' : '#8f8b84', wall: pick(HOUSE_COLORS), lit: 0.8, sign: def.s, signColor: def.c });
  b.dish = chance(0.4);
  const aw = F.rect(10, 6, W - 10, 16);
  bake(aw[0], aw[1], aw[2], aw[3], 8, (g) => drawAwning(g, aw, def.church ? '#6a6a6a' : def.c, F.front));
  const lp = F.pt(W / 2, 8);
  addLight(lp[0], lp[1], 105, 0.85, def.c, { shop: true });
  // fundos murados
  { const wr = F.rect(0, 16 + depth, 4, D); addWall(wr[0], wr[1], wr[2], wr[3], pick(WALL_COLORS)); }
  if (o.back) { const wr = F.rect(4, D - 4, W, D); addWall(wr[0], wr[1], wr[2], wr[3], pick(WALL_COLORS)); }
  if (o.lastLot) { const wr = F.rect(W - 4, 16 + depth, W, D); addWall(wr[0], wr[1], wr[2], wr[3], pick(WALL_COLORS)); }
  if (def.t) {
    const tc = pick(['#d62828', '#f4c430', '#f4c430']);
    for (const f of [0.22, 0.5, 0.78]) { const tp = F.pt(W * f, -12); if (!areaBlocked(tp[0] - 7, tp[1] - 7, tp[0] + 7, tp[1] + 7)) addProp('table', tp[0], tp[1], { col: 'circ', cr: 5, c: tc, R: 12 }); }
    World.parties.push({ x: lp[0], y: lp[1], bar: true });
  }
  if (def.grill) { const gp = F.pt(W - 14, 2); World.grills.push({ x: gp[0], y: gp[1] }); }
  if (!def.t && chance(0.5)) { const op = F.pt(rnd(12, W - 12), -10); if (!areaBlocked(op[0] - 6, op[1] - 6, op[0] + 6, op[1] + 6)) addProp('orelhao', op[0], op[1], { col: 'circ', cr: 4, R: 14, a: F.out }); }
  if (o.street) {
    const rp = roadPointFor(F, W / 2, o.roadHW, o.laneOff);
    World.homes.push({ x: rp[0], y: rp[1], name: o.street + ', ' + nextNumber(o.street, F.front), region: o.region });
  }
}
function residentialBlock(R, o) {
  const rich = o.rich;
  const D = Math.min(rich ? 162 : 146, Math.floor((R.y1 - R.y0) / 2) - 40);
  decal(R.x0, R.y0, R.x1, R.y1, 'lawn');
  const sides = [
    { s: 'N', a: R.x0, b: R.x1, mk: (p, q) => lotFrame(p, R.y0, q, R.y0 + D, 'N'), road: o.roads.N },
    { s: 'S', a: R.x0, b: R.x1, mk: (p, q) => lotFrame(p, R.y1 - D, q, R.y1, 'S'), road: o.roads.S },
    { s: 'W', a: R.y0 + D, b: R.y1 - D, mk: (p, q) => lotFrame(R.x0, p, R.x0 + D, q, 'W'), road: o.roads.W },
    { s: 'E', a: R.y0 + D, b: R.y1 - D, mk: (p, q) => lotFrame(R.x1 - D, p, R.x1, q, 'E'), road: o.roads.E },
  ];
  for (const sd of sides) {
    const L = sd.b - sd.a;
    if (L < 60 || (o.sides && !o.sides.includes(sd.s))) continue;
    const sp = o.special && o.special.side === sd.s ? o.special : null;
    let widths;
    if (sp) { const rest = L - sp.w; widths = [sp.w].concat(rest > 60 ? splitRun(rest, rich ? 115 : 86, rich ? 158 : 122) : []); if (rest <= 60) widths[0] = L; }
    else widths = splitRun(L, rich ? 115 : 86, rich ? 158 : 122);
    let p = sd.a;
    widths.forEach((w, i) => {
      const F = sd.mk(p, p + w);
      const ro = { rich, back: sd.s === 'N' || sd.s === 'S', lastLot: i === widths.length - 1, street: sd.road.name, roadHW: sd.road.hw, laneOff: sd.road.lane, region: o.region };
      if (sp && i === 0) sp.build(F, ro);
      else if (i === 0 && w >= 84 && F.D >= 100 && chance(rich ? 0.1 : 0.3)) cornerShop(F, ro);
      else houseLot(F, ro);
      p += w;
    });
  }
  // miolo do quarteirão
  const cx0 = R.x0 + D + 6, cx1 = R.x1 - D - 6, cy0 = R.y0 + D + 6, cy1 = R.y1 - D - 6;
  if (cx1 - cx0 > 30 && cy1 - cy0 > 30) {
    if (chance(0.25)) { decal(cx0, cy0, cx1, cy1, 'lawn2'); scatterTrees(cx0, cy0, cx1, cy1, 3, ['bush', 'round']); }
    else scatterTrees(cx0, cy0, cx1, cy1, rndi(2, 4), ['mango', 'round', 'ipeY', 'palm', 'round']);
  }
}
function officeH() { const r = rnd(); return r < 0.3 ? rnd(110, 175) : r < 0.72 ? rnd(60, 100) : rnd(36, 50); }
function downtownBlock(R, o) {
  decal(R.x0, R.y0, R.x1, R.y1, 'urban');
  const w = R.x1 - R.x0, h = R.y1 - R.y0;
  const cols = o.cols || (w > 420 ? (chance(0.5) ? 3 : 2) : (w > 260 ? 2 : 1));
  const rows = o.rows || 2;
  const ws = [], hs = [];
  let acc = 0;
  for (let i = 0; i < cols; i++) { const v = i === cols - 1 ? w - acc : Math.round(w / cols * rnd(0.8, 1.2)); ws.push(v); acc += v; }
  acc = 0;
  for (let i = 0; i < rows; i++) { const v = i === rows - 1 ? h - acc : Math.round(h / rows * rnd(0.85, 1.15)); hs.push(v); acc += v; }
  let y = R.y0, idx = 0;
  for (let j = 0; j < rows; j++) {
    let x = R.x0;
    for (let i = 0; i < cols; i++) {
      const px0 = x, py0 = y, px1 = x + ws[i], py1 = y + hs[j];
      const front = j === 0 ? 'N' : 'S';
      const shopDef = o.shops && o.shops[idx];
      const roll = rnd();
      const il = i === 0 ? 3 : 4, ir = i === cols - 1 ? 3 : 4, it = j === 0 ? 3 : 4, ib = j === rows - 1 ? 3 : 4;
      if (shopDef) {
        const F = lotFrame(px0, py0, px1, py1, front);
        shopBuilding(F, Object.assign({ depth: (py1 - py0) * 0.62 }, shopDef), { roadHW: front === 'N' ? o.roads.N.hw : o.roads.S.hw, laneOff: front === 'N' ? o.roads.N.lane : o.roads.S.lane, region: o.region });
      } else if (roll < 0.12 && !o.noLots) {
        decal(px0 + 2, py0 + 2, px1 - 2, py1 - 2, 'paved');
        const vert = (py1 - py0) > (px1 - px0);
        bake(px0, py0, px1, py1, 6, (g) => drawStallLines(g, px0 + 8, py0 + 8, px1 - 8, py1 - 8, vert));
        for (let k = 0; k < 5; k++) {
          if (!chance(0.6)) continue;
          if (vert) { const yy = py0 + 30 + k * 34; if (yy < py1 - 20) addParkedCar(px0 + 40, yy, chance(0.5) ? 0 : Math.PI, randomCarModel(), pick(CAR_COLORS)); }
          else { const xx = px0 + 26 + k * 34; if (xx < px1 - 20) addParkedCar(xx, py0 + 40, chance(0.5) ? Math.PI / 2 : -Math.PI / 2, randomCarModel(), pick(CAR_COLORS)); }
        }
        addLight((px0 + px1) / 2, (py0 + py1) / 2, 140, 0.6, 'white');
      } else if (roll < 0.2 && !o.noLots) {
        decal(px0 + 2, py0 + 2, px1 - 2, py1 - 2, 'plaza');
        scatterTrees(px0 + 18, py0 + 18, px1 - 18, py1 - 18, 3, ['palm', 'ipeY', 'round']);
        addProp('bench', (px0 + px1) / 2, (py0 + py1) / 2, { col: 'rect', w: 26, h: 8 });
        addLight((px0 + px1) / 2, (py0 + py1) / 2, 110, 0.7, 'white');
      } else {
        const hh0 = officeH();
        const colonial = hh0 < 100 && chance(0.32);
        const hh = colonial ? rnd(34, 46) : hh0;
        const style = colonial ? 'colonial' : hh < 52 ? 'shop' : (chance(0.45) ? 'apart' : 'office');
        const signs = ['AÇOUGUE BOI GORDO', 'SORVETERIA GELADÃO', 'TUDO 1,99', 'SALGADOS DA TIA', 'CHAVEIRO 25H', 'ACADEMIA BOMBADÃO', 'DROGARIA DOR-ZERO', 'PASTEL DE VENTO', 'LOTÉRICA SORTE NADA', 'BOTECO DO ZÉ', 'SALÃO CABELO DURO', 'CALÇADOS PÉ DE BOI', 'MODAS ARRASA', 'MATERIAIS DO BAIANO', 'ÓTICA VÊ BEM', 'BAZAR DA FÉ', 'LAN HOUSE 2005', 'CAFÉ COM PROSA'];
        const cols2 = ['#ff5f7a', '#59e0ff', '#ffd24a', '#5be38f', '#c56bff', '#ff8a3d'];
        const b = addBuilding(px0 + il + rnd(0, 4), py0 + it + rnd(0, 4), px1 - ir - rnd(0, 4), py1 - ib - rnd(0, 4), hh, {
          style, front, roofType: colonial ? 'hip' : 'flat', roofColor: colonial ? pick(ROOF_TILE) : pick(['#6f6d6a', '#7d7a74', '#5f5e5b', '#85817a']),
          wall: colonial ? pick(['#f2d16b', '#8fc1d4', '#e8a0a0', '#a8d5a2', '#f4f0e6', '#e9b872']) : style === 'apart' ? pick(['#d9c8a9', '#c9d3d8', '#e2d6c2', '#b8c4b0', '#e8dccb']) : pick(OFFICE_COLORS), lit: rnd(0.25, 0.6),
          sign: (style === 'shop' || colonial) && chance(0.7) ? pick(signs) : null, signColor: pick(cols2),
        });
        if (style === 'apart') { b.varal = chance(0.5); b.dish = true; }
        if (b.sign) {
          const F = lotFrame(b.x0, b.y0, b.x1, b.y1, front);
          const lp = F.pt(F.W / 2, -6);
          addLight(lp[0], lp[1], 90, 0.7, b.signColor, { shop: true });
        }
      }
      x = px1; idx++;
    }
    y += hs[j];
  }
}
function industrialBlock(R, o) {
  decal(R.x0, R.y0, R.x1, R.y1, 'gravel');
  const gx = (R.x0 + R.x1) / 2;
  fenceRect(R.x0 + 4, R.y0 + 4, R.x1 - 4, R.y1 - 4, [{ side: 'N', at: gx, w: 70 }, { side: 'S', at: gx + 60, w: 70 }], 'chain');
  const w = R.x1 - R.x0;
  const whCol = pick(['#7f8a8c', '#5f7f8c', '#8c8070', '#6c8070']);
  const wx1 = R.x0 + w * rnd(0.5, 0.62);
  const wh = addBuilding(R.x0 + 20, R.y0 + 30, wx1, R.y1 - 120, rnd(36, 46), { style: 'warehouse', roofType: 'corrugated', roofColor: whCol, wall: '#a9a59b', lit: 0.12, front: 'S' });
  if (chance(0.6)) addGraffiti(wh, chance(0.5) ? 'pixo' : 'mural');
  addLight((R.x0 + wx1) / 2, R.y1 - 90, 150, 0.8, 'sodium');
  for (let k = 0; k < 4; k++) {
    const cx = wx1 + 30 + k * 32;
    if (cx > R.x1 - 30) break;
    if (chance(0.7)) addBuilding(cx, R.y0 + 30, cx + 26, R.y0 + 110, 22, { style: 'container', roofType: 'container', roofColor: pick(['#b5452e', '#2e6db5', '#3d8a4a', '#c9a227', '#7a7a7a']), wall: '#6a6a6a', lit: 0, noShadow: false });
  }
  if (!o.noTrucks) {
    addParkedCar(wx1 + 70, R.y1 - 60, 0, 'truck', pick(['#d8d8d8', '#c43d2e', '#2c5d9c']));
  }
  addLamp(R.x1 - 30, R.y0 + 40, R.x1 - 50, R.y0 + 60, 'sodium', { style: 'pole', h: 62 });
}

/* ---------- quarteirões especiais ---------- */
function hwV(x) { return x === 2100 ? RT.avenue.w / 2 : RT.street.w / 2; }
function hwH(y) { return (y === 1500 || y === 3880) ? RT.avenue.w / 2 : RT.street.w / 2; }
function cellRect(c, r) { return { x0: XS[c] + hwV(XS[c]) + 22, x1: XS[c + 1] - hwV(XS[c + 1]) - 22, y0: YS[r] + hwH(YS[r]) + 22, y1: YS[r + 1] - hwH(YS[r + 1]) - 22 }; }
const NAMES_H = {}, NAMES_V = {};
function cellRoads(c, r) {
  const mk = (name, hw) => ({ name, hw, lane: hw > 60 ? RT.avenue.lanes[1] : RT.street.lanes[0] });
  return {
    N: mk(NAMES_H[YS[r]], hwH(YS[r])), S: mk(NAMES_H[YS[r + 1]], hwH(YS[r + 1])),
    W: mk(NAMES_V[XS[c]], hwV(XS[c])), E: mk(NAMES_V[XS[c + 1]], hwV(XS[c + 1])),
  };
}

function plazaChurch(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'plaza');
  const cx = (R.x0 + R.x1) / 2;
  addBuilding(cx - 92, R.y0 + 16, cx + 92, R.y0 + 176, 58, { style: 'church', roofType: 'gableV', roofColor: '#9c4a2c', wall: '#f1ead8', lit: 0.5, front: 'S' });
  const tower = addBuilding(cx - 28, R.y0 + 176, cx + 28, R.y0 + 232, 122, { style: 'tower', roofType: 'tower', roofColor: '#8a3f26', wall: '#efe7d2', lit: 0.3, front: 'S' });
  tower.cross = true;
  addLight(cx, R.y0 + 250, 160, 0.9, 'warm');
  // fonte
  const fy = R.y0 + 340;
  bake(cx - 50, fy - 50, cx + 50, fy + 50, 8, (g) => drawFountain(g, cx, fy));
  addCircCol(cx, fy, 40, 'prop');
  addLight(cx, fy, 90, 0.5, 'cyan', { fountain: true });
  World.fountains.push({ x: cx, y: fy });
  for (const [dx, dy] of [[-150, 280], [150, 280], [-150, 400], [150, 400]]) addTree(cx + dx, R.y0 + dy, chance(0.5) ? 'palm' : 'ipeY', rnd(1, 1.2));
  for (const [dx, dy, a] of [[-80, 300, 0], [80, 300, 0], [-80, 380, 0], [80, 380, 0], [0, 420, 0]]) addProp('bench', cx + dx, R.y0 + dy, { col: 'rect', w: 26, h: 8 });
  for (const [dx, dy] of [[-200, 260], [200, 260], [-200, 430], [200, 430], [-60, 250], [60, 250]]) addLamp(cx + dx, R.y0 + dy, cx + dx, R.y0 + dy, 'white', { style: 'globe', h: 34, r: 120, i: 0.85 });
  addBuilding(R.x0 + 14, R.y1 - 54, R.x0 + 54, R.y1 - 20, 18, { style: 'kiosk', roofType: 'flat', roofColor: '#2f6d4f', wall: '#3b8a63', lit: 0.9, sign: 'BANCA', signColor: '#ffd24a' });
  addProp('cart', R.x1 - 40, R.y1 - 40, { col: 'circ', cr: 9 });
  // balizadores
  for (let x = R.x0 + 8; x <= R.x1 - 8; x += 26) {
    if (Math.abs(x - cx) < 30) continue;
    addProp('bollard', x, R.y1 - 4, { col: 'circ', cr: 3, R: 6 });
  }
}
function parkingLot(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'paved');
  const rows = [
    { y0: R.y0 + 8, y1: R.y0 + 70, nose: -Math.PI / 2 },
    { y0: R.y0 + 170, y1: R.y0 + 232, nose: Math.PI / 2 },
    { y0: R.y0 + 232, y1: R.y0 + 294, nose: -Math.PI / 2 },
    { y0: R.y1 - 70, y1: R.y1 - 8, nose: Math.PI / 2 },
  ];
  const sx0 = R.x0 + 52, SW = 34;
  const n = Math.floor((R.x1 - 18 - sx0) / SW);
  const challenge = { '0,5': 1, '2,2': 1, '3,9': 1 };
  rows.forEach((row, ri) => {
    bake(sx0, row.y0, sx0 + n * SW, row.y1, 6, (g) => {
      g.strokeStyle = 'rgba(240,240,230,0.75)'; g.lineWidth = 2;
      g.beginPath();
      for (let i = 0; i <= n; i++) { g.moveTo(sx0 + i * SW, row.y0); g.lineTo(sx0 + i * SW, row.y1); }
      const yb = row.nose < 0 ? row.y0 : row.y1;
      g.moveTo(sx0, yb); g.lineTo(sx0 + n * SW, yb);
      g.stroke();
    });
    for (let i = 0; i < n; i++) {
      const x = sx0 + i * SW + SW / 2, y = (row.y0 + row.y1) / 2;
      if (challenge[ri + ',' + i]) {
        World.parkSpots.push({ id: 'central_' + ri + '_' + i, name: 'Estacionamento Central', x, y, a: row.nose, w: SW, l: 62, reward: 220 });
        continue;
      }
      if (chance(0.55)) addParkedCar(x, y + (row.nose > 0 ? 2 : -2), row.nose, randomCarModel(), pick(CAR_COLORS));
    }
  });
  // mureta com entradas
  const hedge = (x0, y0, x1, y1) => { addWall(x0, y0, x1, y1, '#4f6b3a', { kind: 'hedge' }); };
  hedge(R.x0, R.y0, R.x0 + 6, R.y0 + 74);
  hedge(R.x0, R.y0 + 166, R.x0 + 6, R.y0 + 298);
  hedge(R.x0, R.y1 - 74, R.x0 + 6, R.y1);
  hedge(R.x1 - 6, R.y0, R.x1, R.y0 + 74);
  hedge(R.x1 - 6, R.y0 + 166, R.x1, R.y0 + 298);
  hedge(R.x1 - 6, R.y1 - 74, R.x1, R.y1);
  hedge(R.x0 + 6, R.y0, R.x1 - 6, R.y0 + 5);
  hedge(R.x0 + 6, R.y1 - 5, R.x1 - 6, R.y1);
  addBuilding(R.x0 + 12, R.y0 + 112, R.x0 + 40, R.y0 + 134, 20, { style: 'kiosk', roofType: 'flat', roofColor: '#3a4a6a', wall: '#dcdcdc', lit: 1 });
  for (const [x, y] of [[R.x0 + 130, R.y0 + 120], [R.x1 - 130, R.y0 + 120], [R.x0 + 130, R.y1 - 120], [R.x1 - 130, R.y1 - 120]]) addLamp(x, y, x, y, 'white', { style: 'pole', h: 64, r: 190 });
}
function gasStation(R, o) {
  // o: {name, color, front:'N'|'S', canopy:[x0,y0,x1,y1], store:[...], wash:[...]?, totem:[x,y]}
  decal(R.x0, R.y0, R.x1, R.y1, 'concrete');
  const [cx0, cy0, cx1, cy1] = o.canopy;
  const midY = (cy0 + cy1) / 2;
  for (const yy of [midY - 28, midY + 28]) {
    addProp('island', (cx0 + cx1) / 2, yy, { col: 'rect', w: cx1 - cx0 - 70, h: 12, R: (cx1 - cx0) / 2, c: o.color });
  }
  const can = { kind: 'canopy', x0: cx0, y0: cy0, x1: cx1, y1: cy1, h: 44, color: o.color, name: o.name, cx: (cx0 + cx1) / 2, cy: midY, alpha: 1 };
  addTall(can, cx0, cy0, cx1, cy1);
  for (const [px, py] of [[cx0 + 14, cy0 + 14], [cx1 - 14, cy0 + 14], [cx0 + 14, cy1 - 14], [cx1 - 14, cy1 - 14]]) addCircCol(px, py, 5, 'pole');
  for (let x = cx0 + 40; x < cx1 - 20; x += 60) for (const yy of [cy0 + 30, cy1 - 30]) addLight(x, yy, 120, 0.95, 'white', { canopy: true });
  const s = o.store;
  addBuilding(s[0], s[1], s[2], s[3], 30, { style: 'shop', front: o.front, roofType: 'flat', roofColor: '#6a6865', wall: '#f0f0ea', lit: 0.95, sign: 'CONVENIÊNCIA', signColor: o.color });
  if (o.wash) {
    const w = o.wash;
    addBuilding(w[0], w[1], w[2], w[3], 30, { style: 'shop', front: o.front, roofType: 'flat', roofColor: '#3f6a8a', wall: '#dfe8ee', lit: 0.8, sign: 'LAVA JATO', signColor: '#59e0ff' });
  }
  const t = o.totem;
  const tot = { kind: 'totem', x: t[0], y: t[1], h: 76, color: o.color, name: o.name };
  addTall(tot, t[0] - 30, t[1] - 30, t[0] + 30, t[1] + 30);
  addCircCol(t[0], t[1], 6, 'pole');
  addLight(t[0], t[1], 90, 0.7, o.color);
  return addShop({ kind: 'posto', name: o.name, x: can.cx, y: can.cy, color: o.color, region: o.region, wash: !!o.wash, radius: 90 });
}
function oficinaBlock(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'gravel');
  decal(R.x0, R.y0, R.x0 + 260, R.y0 + 60, 'concrete');
  const b = addBuilding(R.x0 + 20, R.y0 + 60, R.x0 + 240, R.y0 + 200, 38, { style: 'workshop', front: 'N', roofType: 'corrugated', roofColor: '#4d6b86', wall: '#d9d2c0', lit: 0.8, sign: 'OFICINA DO SEU ZÉ', signColor: '#ffb547' });
  addLight(R.x0 + 130, R.y0 + 40, 140, 1, 'white', { shop: true });
  for (let i = 0; i < 4; i++) addProp('tires', R.x0 + 262 + i * 18, R.y0 + 90 + (i % 2) * 22, { col: 'circ', cr: 8 });
  addParkedCar(R.x0 + 60, R.y0 + 30, 0, 'sedan', '#5a5a5a');
  addParkedCar(R.x0 + 190, R.y0 + 28, Math.PI, 'hatch', '#8a3b2a');
  industrialBlock({ x0: R.x0 + 280, y0: R.y0, x1: R.x1, y1: R.y1 }, { noTrucks: true });
  World.animalsDef.push({ type: 'person', n: 1, rect: [R.x0 + 100, R.y0 + 30, R.x0 + 170, R.y0 + 48], look: { col: '#2a4a8a', pants: '#2a4a8a', hair: '#e8e8e2', skin: '#e0ac69', seuze: true } });
  return addShop({ kind: 'oficina', name: 'Oficina do Seu Zé', x: R.x0 + 130, y: YS[1] + RT.street.lanes[0], bld: b, color: '#ffb547', region: 'industrial', pickup: true, items: ['Peças de motor', 'Bateria nova', 'Jogo de pneus'] });
}
function waterTowerBlock(R) {
  industrialBlock({ x0: R.x0, y0: R.y0, x1: R.x1, y1: R.y0 + 250 }, {});
  decal(R.x0, R.y0 + 250, R.x1, R.y1, 'lawn');
  const cx = (R.x0 + R.x1) / 2, cy = R.y0 + 380;
  fenceRect(cx - 80, cy - 80, cx + 80, cy + 80, [{ side: 'S', at: cx, w: 40 }], 'chain');
  const t = { kind: 'watertower', x: cx, y: cy, h: 150, r: 42 };
  addTall(t, cx - 50, cy - 50, cx + 50, cy + 50);
  for (const [dx, dy] of [[-30, -30], [30, -30], [-30, 30], [30, 30]]) addCircCol(cx + dx, cy + dy, 5, 'pole');
  addLight(cx, cy, 120, 0.6, 'sodium');
}
function soccerBlock(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'lawn');
  const m = 20;
  decal(R.x0 + m, R.y0 + m, R.x1 - m, R.y1 - m, 'soccer');
  const cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2;
  addProp('goal', cx, R.y0 + m + 4, { a: 0, col: 'rect', w: 44, h: 8, R: 30 });
  addProp('goal', cx, R.y1 - m - 4, { a: Math.PI, col: 'rect', w: 44, h: 8, R: 30 });
  fenceRect(R.x0 + 6, R.y0 + 6, R.x1 - 6, R.y1 - 6, [{ side: 'E', at: cy, w: 60 }, { side: 'W', at: cy, w: 60 }], 'chain');
  for (const [x, y] of [[R.x0 + 14, R.y0 + 14], [R.x1 - 14, R.y0 + 14], [R.x0 + 14, R.y1 - 14], [R.x1 - 14, R.y1 - 14]]) {
    const f = { kind: 'flood', x, y, h: 90, tx: cx, ty: cy };
    addTall(f, x - 20, y - 20, x + 20, y + 20);
    addCircCol(x, y, 5, 'pole');
    addLight(lerp(x, cx, 0.4), lerp(y, cy, 0.4), 260, 0.75, 'white', { flood: true });
  }
  addBuilding(R.x1 - 60, R.y0 + 60, R.x1 - 26, R.y1 - 60, 14, { style: 'bleacher', roofType: 'bleacher', roofColor: '#8a8a8a', wall: '#9a9a9a', lit: 0 });
  World.pitches.push({ x0: R.x0 + m + 8, y0: R.y0 + m + 8, x1: R.x1 - 70, y1: R.y1 - m - 8, cx, cy, gy0: R.y0 + m + 4, gy1: R.y1 - m - 4 });
}
function schoolBlock(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'yard');
  const wc = '#e5dcc0';
  addWall(R.x0, R.y0, R.x1, R.y0 + 5, wc); addWall(R.x0, R.y1 - 5, R.x1, R.y1, wc);
  addWall(R.x0, R.y0 + 5, R.x0 + 5, R.y1 - 5, wc); addWall(R.x1 - 5, R.y0 + 5, R.x1, (R.y0 + R.y1) / 2 - 30, wc);
  addWall(R.x1 - 5, (R.y0 + R.y1) / 2 + 30, R.x1, R.y1 - 5, wc);
  addBuilding(R.x0 + 30, R.y0 + 30, R.x1 - 30, R.y0 + 140, 40, { style: 'office', roofType: 'flat', roofColor: '#6e7b6a', wall: '#e9d9a8', lit: 0.2, sign: 'ESCOLA ESTADUAL', signColor: '#59e0ff', front: 'N' });
  addBuilding(R.x0 + 30, R.y0 + 140, R.x0 + 120, R.y1 - 200, 34, { style: 'office', roofType: 'flat', roofColor: '#6e7b6a', wall: '#e9d9a8', lit: 0.1 });
  decal(R.x0 + 150, R.y0 + 180, R.x1 - 40, R.y1 - 220, 'court');
  scatterTrees(R.x0 + 30, R.y1 - 190, R.x1 - 30, R.y1 - 30, 6, ['mango', 'round', 'ipeP']);
  addProp('flag', R.x0 + 140, R.y0 + 160, { col: 'circ', cr: 3 });
  addLight((R.x0 + R.x1) / 2, R.y0 + 160, 160, 0.6, 'white');
}
function homeLot(F, ro) {
  decalR(F.rect(0, 0, F.W, F.D), 'yard');
  const wallCol = '#d8cfb8';
  { const r = F.rect(0, 0, 4, F.D); addWall(r[0], r[1], r[2], r[3], wallCol); }
  { const r = F.rect(4, F.D - 4, F.W, F.D); addWall(r[0], r[1], r[2], r[3], wallCol); }
  const g = F.rect(12, 16, 112, 118);
  const b = addBuilding(g[0], g[1], g[2], g[3], 36, { style: 'garage', front: F.front, roofType: 'corrugated', roofColor: '#5b6470', wall: '#e8e2d0', lit: 0.9, sign: 'GARAGEM', signColor: '#5be38f' });
  const hr = F.rect(122, 30, F.W - 8, 118);
  addBuilding(hr[0], hr[1], hr[2], hr[3], 29, { style: 'house', front: F.front, roofType: 'hip', roofColor: '#a8492b', wall: '#f2d28e', lit: 0.8 });
  const lp = F.pt(62, 8);
  addLight(lp[0], lp[1], 110, 1, 'green', { shop: true });
  const rp = roadPointFor(F, 62, ro.roadHW, ro.laneOff);
  World.home = { x: rp[0], y: rp[1], a: 0, bld: b };
  addShop({ kind: 'garagem', name: 'Sua Garagem', x: rp[0], y: rp[1], color: '#5be38f', region: 'vila', radius: 80 });
}
function comunidadeBlock(R) {
  // comunidade: casinhas coladas de bloco e laje, vielas estreitas, caixas d'água e varais
  decal(R.x0, R.y0, R.x1, R.y1, 'yard');
  // muro grafitado virado para a rua (face sul)
  const gl = [];
  for (let x = R.x0 + 6; x < R.x1 - 60; x += rndi(70, 110)) gl.push({ x, text: chance(0.5) ? pick(MURO_FRASES) : pick(PIXOS), color: pick(['#111111', '#f2f2ea', '#c8241c', '#1d4f9c', '#2a9d8f', '#f4c430']), mural: chance(0.25) });
  addWall(R.x0, R.y1 + 1, R.x1, R.y1 + 5, pick(['#d8d0c0', '#c9b79c', '#e2d2b6', '#b8b0a2']), {});
  const cols = ['#e9c46a', '#f4a261', '#2a9d8f', '#e76f51', '#8ecae6', '#f1efe8', '#b5603a', '#b5603a', '#c06a40', '#9bc53d', '#ff99c8'];
  // casas um pouco maiores e em menor número (metade): mesma cara de comunidade, bem mais leve.
  // As casas usam um sorteio só delas; o sorteio do mapa avança igual ao de antes (comunidadeSorteioAntigo),
  // assim o resto da cidade continua exatamente no mesmo lugar.
  const RG = RNG; RNG = mulberry32(((R.x0 | 0) * 73856093 ^ (R.y0 | 0) * 19349663) >>> 0);
  let y = R.y0 + 4, row = 0;
  while (y < R.y1 - 30) {
    const rh = Math.min(rndi(44, 64), R.y1 - 4 - y);
    let x = R.x0 + 4;
    while (x < R.x1 - 24) {
      const w = Math.min(rndi(38, 64), R.x1 - 4 - x);
      if (w < 20) break;
      const wall = pick(cols), brick = wall === '#b5603a' || wall === '#c06a40';
      const floors = rndi(1, 3);
      const roofType = pick(['laje', 'laje', 'tijolo', 'amianto', 'laje']);
      const b = addBuilding(x, y, x + w, y + rh, 16 + floors * 11 + rnd(0, 4), { style: 'house', front: row === 0 ? 'N' : 'S', roofType, roofColor: roofType === 'amianto' ? '#a7a9a4' : '#8f8b84', wall, lit: rnd(0.3, 0.75) });
      b.brick = brick; b.varal = chance(0.368); b.dish = chance(0.322); // 8% menos detalhe nas casinhas
      if (chance(0.5)) addGraffiti(b);
      if (chance(0.23)) addLight(x + w / 2, y + rh + 4, 45, 0.6, 'warm');
      x += w + (chance(0.22) ? rndi(10, 14) : 1);
    }
    y += rh + (chance(0.5) ? rndi(10, 14) : 2);
    row++;
  }
  RNG = RG;
  comunidadeSorteioAntigo(R, cols);
  rnd(); rnd(); // as duas cordas de bandeirinha que existiam aqui (tiradas: pesavam)
  const cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2;
  addLight(cx, cy, 160, 0.5, 'sodium');
}
// repete, sem construir nada, os sorteios que as casinhas antigas faziam (na mesma ordem)
function comunidadeSorteioAntigo(R, cols) {
  let y = R.y0 + 4;
  while (y < R.y1 - 30) {
    const rh = Math.min(rndi(34, 50), R.y1 - 4 - y);
    let x = R.x0 + 4;
    while (x < R.x1 - 24) {
      const w = Math.min(rndi(26, 46), R.x1 - 4 - x);
      if (w < 20) break;
      pick(cols); rndi(1, 3); pick([0, 0, 0, 0, 0]); rnd(0, 4); rnd(0.3, 0.75); // cor, andares, telhado, altura, janelas
      chance(0.4); chance(0.35); chance(0.5); // varal, antena, pichação
      if (chance(0.25)) rnd(); // poste de luz
      x += w + (chance(0.22) ? rndi(10, 14) : 1);
    }
    y += rh + (chance(0.5) ? rndi(10, 14) : 2);
  }
}
function shopLotBuilder(def) { return (F, ro) => shopBuilding(F, def, ro); }

/* ---------- construção da cidade ---------- */
function buildCity() {
  for (const r of ROADS) { if (r.h && r.x1 < 4700) NAMES_H[r.y] = r.name; if (!r.h && r.y1 < 1000) NAMES_V[r.x] = r.name; }
  NAMES_V[4600] = 'Rua Beira-Rio Sem Peixe';
  const SPECIAL = {
    '2,1': 'plaza', '3,1': 'parking', '4,2': 'posto', '5,1': 'oficina', '5,3': 'tower', '0,5': 'soccer', '3,7': 'school',
  };
  const shopsDowntown = {
    '1,2': { 0: { kind: 'moquecaria', name: 'Moquecaria Panela de Barro', sign: 'MOQUECA', color: '#ff5f3d', h: 32, pickup: true, items: ['Moqueca capixaba', 'Torta capixaba', 'Panela de moqueca'], tables: true }, 3: { kind: 'farmacia', name: 'Farmácia Dorme Bem', sign: 'FARMÁCIA', color: '#3dff8a', h: 34, pickup: true, items: ['Remédios', 'Encomenda da farmácia'] } },
    '0,0': { 1: { kind: 'hotel', name: 'Hotel Dorme e Acorda', sign: 'HOTEL', color: '#c56bff', h: 70, wall: '#c9c2b4' } },
  };
  const resSpecial = {
    '1,4': { side: 'N', w: 186, build: homeLot },
    '2,4': { side: 'N', w: 150, build: shopLotBuilder({ kind: 'padaria', name: 'Padaria Pão-Duro', sign: 'PADARIA', color: '#ffc24a', h: 32, depth: 100, pickup: true, items: ['Bolo de aniversário', 'Pães e frios', 'Encomenda de salgados'], tables: true }) },
    '0,4': { side: 'N', w: 160, build: shopLotBuilder({ kind: 'mercado', name: 'Mercadinho Leva Tudo', sign: 'MERCADINHO', color: '#ff7a3d', h: 32, depth: 105, pickup: true, items: ['Compras do mês', 'Caixa de bebidas', 'Sacolas de compras'] }) },
    '4,6': { side: 'N', w: 150, build: shopLotBuilder({ kind: 'lanchonete', name: 'Lanchonete X-Tudo do Bigode', sign: 'LANCHES', color: '#ff4f8a', h: 30, depth: 95, pickup: true, items: ['X-tudo e batata', 'Pastéis', 'Lanches para a turma'], tables: true }) },
    '2,6': { side: 'N', w: 140, build: shopLotBuilder({ kind: 'bar', name: 'Boteco Saideira do Toninho', sign: 'SAIDEIRA', color: '#ffd24a', h: 28, depth: 90, tables: true }) },
    '5,5': { side: 'W', w: 150, build: shopLotBuilder({ kind: 'floricultura', name: 'Floricultura Rosa Choque', sign: 'FLORES', color: '#ff8ad8', h: 30, depth: 96, pickup: true, items: ['Buquê de rosas', 'Arranjo de flores'] }) },
  };
  for (let c = 0; c < 7; c++) for (let r = 0; r < 8; r++) {
    const R = cellRect(c, r), k = c + ',' + r;
    const roads = cellRoads(c, r);
    const region = regionKeyAt((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2);
    const sp = SPECIAL[k];
    if (sp === 'plaza') plazaChurch(R);
    else if (sp === 'parking') parkingLot(R);
    else if (sp === 'posto') {
      gasStation({ x0: R.x0, y0: R.y0, x1: R.x0 + 300, y1: R.y1 }, { name: 'Posto Tanque Cheio', color: '#ff3d3d', front: 'S', canopy: [R.x0 + 40, R.y0 + 40, R.x0 + 260, R.y0 + 190], store: [R.x0 + 34, R.y1 - 120, R.x0 + 180, R.y1 - 14], wash: [R.x0 + 196, R.y1 - 120, R.x0 + 286, R.y1 - 14], totem: [R.x0 + 14, R.y0 + 14], region: 'centro' });
      downtownBlock({ x0: R.x0 + 300, y0: R.y0, x1: R.x1, y1: R.y1 }, { roads, region, cols: 1 });
    }
    else if (sp === 'oficina') oficinaBlock(R);
    else if (sp === 'tower') waterTowerBlock(R);
    else if (sp === 'soccer') soccerBlock(R);
    else if (sp === 'school') schoolBlock(R);
    else if (r < 4) {
      if (c >= 5) industrialBlock(R, {});
      else downtownBlock(R, { roads, region, shops: shopsDowntown[k] });
    } else if (k === '0,6' || k === '1,7') { comunidadeBlock(R); SUBREG.push([R.x0 - 20, R.y0 - 20, R.x1 + 20, R.y1 + 20, k === '0,6' ? 'saopedro' : 'terravermelha']); }
    else residentialBlock(R, { rich: c >= 3, roads, region, special: resSpecial[k] });
  }
}

/* ---------- sinalização e iluminação viária ---------- */
function lampColorFor(e) {
  const mx = e.h ? (e.a.x + e.b.x) / 2 : e.a.x, my = e.h ? e.a.y : (e.a.y + e.b.y) / 2;
  const rk = regionKeyAt(mx, my);
  if (rk === 'centro' || e.T.id === 'highway' || e.T.id === 'avenue') return chance(0.85) ? 'white' : 'sodium';
  return chance(0.9) ? 'sodium' : 'white';
}
function buildRoadProps() {
  for (const e of World.edges) {
    if (!e.bridge) continue;
    const B = e.bridge, y = e.a.y;
    if (B.wood) {
      for (const x of [B.x0 + 18, B.x1 - 18]) for (const sd of [-1, 1]) addLamp(x, y + sd * (e.hw + 5), x, y + sd * (e.hw + 5), 'warm', { style: 'globe', h: 26, r: 120, i: 0.85 });
    } else {
      let k = 0;
      for (let x = B.x0 + 40; x < B.x1 - 20; x += 105, k++) for (const sd of [-1, 1]) {
        if ((k + (sd > 0 ? 1 : 0)) % 2) continue;
        addLamp(x, y + sd * (e.hw + 4), x, y + sd * (e.hw - 16), 'white', { h: 52, r: 175 });
      }
    }
  }
  for (const e of World.edges) {
    const T = e.T;
    let spacing = 0, both = false;
    if (T.id === 'street') spacing = 190;
    else if (T.id === 'avenue') { spacing = 170; both = true; }
    else if (T.id === 'highway') { spacing = 250; both = true; }
    else if (T.id === 'road') spacing = 330;
    if (!spacing) continue;
    const col = lampColorFor(e);
    const nx = -e.dy, ny = e.dx;
    const off = e.hw + (T.sw ? T.sw * 0.55 : 12);
    const poles = {};
    let k = 0;
    for (let s = e.clearA + 30; s < e.len - e.clearB - 20; s += spacing, k++) {
      const sides = both ? [1, -1] : [k % 2 ? 1 : -1];
      for (const sd of sides) {
        const ss = both && sd < 0 ? s + spacing / 2 : s;
        if (ss > e.len - e.clearB - 20) continue;
        const px = e.a.x + e.dx * ss, py = e.a.y + e.dy * ss;
        let o = off;
        if (e.bridge) {
          if (px > e.bridge.x0 - 40 && px < e.bridge.x1 + 40) continue;
          if (groundAt(px + nx * off * sd, py + ny * off * sd) === SF.WATER) continue;
        }
        const bx = px + nx * o * sd, by = py + ny * o * sd;
        if (groundAt(bx, by) === SF.WATER) continue;
        const hx = px + nx * (o - 22) * sd, hy = py + ny * (o - 22) * sd;
        addLamp(bx, by, hx, hy, col, { broken: chance(0.03), flick: chance(0.05) });
        if (T.id !== 'highway') (poles[sd] || (poles[sd] = [])).push([bx, by]);
      }
    }
    // fiação entre os postes (bem brasileira)
    for (const sd in poles) {
      const P = poles[sd];
      if (P.length < 2) continue;
      const bx = edgeBox(e, 10);
      addTall({ kind: 'wires', pts: P, h: 56, x: (bx[0] + bx[2]) / 2, y: (bx[1] + bx[3]) / 2, seed: rnd() }, bx[0], bx[1], bx[2], bx[3]);
    }
    // lombadas nas ruas dos bairros
    if (T.id === 'street' && e.len > 380) {
      const rk0 = regionKeyAt(e.h ? (e.a.x + e.b.x) / 2 : e.a.x, e.h ? e.a.y : (e.a.y + e.b.y) / 2);
      if ((rk0 === 'vila' || rk0 === 'jardim') && chance(0.45)) {
        const s = e.len * rnd(0.4, 0.6), px = e.a.x + e.dx * s, py = e.a.y + e.dy * s;
        const w = e.h ? 12 : e.hw * 2 - 4, h = e.h ? e.hw * 2 - 4 : 12;
        addProp('bump', px, py, { w, h, z: 5.5, R: e.hw + 4 });
        World.bumps.push({ x0: px - w / 2 - 4, y0: py - h / 2 - 4, x1: px + w / 2 + 4, y1: py + h / 2 + 4 });
      }
    }
    // árvores de calçada
    if (T.sw) {
      const mx = e.h ? (e.a.x + e.b.x) / 2 : e.a.x, my = e.h ? e.a.y : (e.a.y + e.b.y) / 2;
      const rk = regionKeyAt(mx, my);
      const dens = rk === 'jardim' ? 0.5 : rk === 'vila' ? 0.3 : 0.18;
      const types = rk === 'jardim' ? ['palm', 'palm', 'ipeY'] : rk === 'centro' ? ['round', 'ipeP', 'ipeY'] : ['round', 'ipeY', 'mango', 'ipeP'];
      for (let s = e.clearA + 60; s < e.len - e.clearB - 40; s += 95) {
        if (!chance(dens)) continue;
        for (const sd of [1, -1]) {
          if (!chance(0.5)) continue;
          const px = e.a.x + e.dx * s + nx * (e.hw + T.sw * 0.5) * sd, py = e.a.y + e.dy * s + ny * (e.hw + T.sw * 0.5) * sd;
          if (areaBlocked(px - 14, py - 14, px + 14, py + 14)) continue;
          addTree(px, py, pick(types), rnd(0.75, 0.95), { sidewalk: true });
        }
      }
      // obra na rua: buraco com cones e cavalete (tudo derrubável)
      if (T.id === 'street' && e.len > 400 && chance(0.18)) {
        const s = e.len * rnd(0.35, 0.65), sd = chance(0.5) ? 1 : -1, o = e.hw - 9;
        const px = e.a.x + e.dx * s + nx * o * sd, py = e.a.y + e.dy * s + ny * o * sd;
        addProp('hole', px - nx * 4 * sd, py - ny * 4 * sd, { z: 5.6, R: 20 });
        World.obras.push({ x: e.a.x + e.dx * s + nx * T.lanes[0] * sd, y: e.a.y + e.dy * s + ny * T.lanes[0] * sd, name: 'Obra na ' + e.name });
        for (const d of [-26, -9, 9, 26]) addProp('cone', px + e.dx * d, py + e.dy * d, { col: 'circ', cr: 3, R: 14 });
        addProp('barrier', px + e.dx * 40, py + e.dy * 40, { a: Math.atan2(ny, nx), col: 'circ', cr: 4, R: 22 });
      }
      // lixeiras / hidrantes
      for (let s = e.clearA + 40; s < e.len - e.clearB - 40; s += 140) {
        if (!chance(0.35)) continue;
        const sd = chance(0.5) ? 1 : -1;
        const px = e.a.x + e.dx * s + nx * (e.hw + T.sw - 5) * sd, py = e.a.y + e.dy * s + ny * (e.hw + T.sw - 5) * sd;
        if (areaBlocked(px - 6, py - 6, px + 6, py + 6)) continue;
        const rkp = regionKeyAt(px, py);
        if ((rkp === 'centro' || rkp === 'vila' || rkp === 'jardim') && chance(0.16)) {
          const ph = { kind: 'phone', x: px, y: py, h: 24, col: chance(0.7) ? '#ff8c1a' : '#2f7fd6' };
          addTall(ph, px - 30, py - 30, px + 30, py + 30); addCircCol(px, py, 4, 'pole').brk = { kind: 'tall', obj: ph };
        } else addProp(chance(0.7) ? 'bin' : 'hydrant', px, py, { col: 'circ', cr: 4, R: 8 });
      }
    }
    // pedestres nas calçadas
    if (T.sw) {
      const mx = e.h ? (e.a.x + e.b.x) / 2 : e.a.x, my = e.h ? e.a.y : (e.a.y + e.b.y) / 2;
      const rk = regionKeyAt(mx, my);
      const per = rk === 'centro' ? 120 : rk === 'vila' ? 170 : 230;
      const s0 = e.perpA + 8, s1 = e.len - e.perpB - 8;
      // nas pontes não tem calçada: os pedestres andam só até a cabeceira
      const spans = e.bridge ? [[s0, e.bridge.x0 - e.a.x - 20], [e.bridge.x1 - e.a.x + 20, s1]] : [[s0, s1]];
      for (const [q0, q1] of spans) if (q1 - q0 > 60) for (const sd of [1, -1]) {
        const o = e.hw + T.sw * 0.5;
        const ax = e.a.x + e.dx * q0 + nx * o * sd, ay = e.a.y + e.dy * q0 + ny * o * sd;
        const bx = e.a.x + e.dx * q1 + nx * o * sd, by = e.a.y + e.dy * q1 + ny * o * sd;
        const rect = [Math.min(ax, bx) - (e.h ? 0 : 5), Math.min(ay, by) - (e.h ? 5 : 0), Math.max(ax, bx) + (e.h ? 0 : 5), Math.max(ay, by) + (e.h ? 5 : 0)];
        World.animalsDef.push({ type: 'person', n: Math.max(1, Math.round((q1 - q0) / per * rnd(0.6, 1.3))), rect });
      }
    }
    // radar (pardal) nas avenidas e na rodovia
    // 70% menos pardais: o sorteio original continua (não muda o resto do mapa), mas só ~30% deles ficam
    if ((T.id === 'avenue' || T.id === 'highway') && e.len > 450 && chance(0.32) && hash2(e.id * 13 + 5, 77) < 0.3) {
      const s = e.len * 0.5, sd = 1, o = e.hw + (T.sw ? T.sw * 0.5 : 10);
      const px = e.a.x + e.dx * s + nx * o * sd, py = e.a.y + e.dy * s + ny * o * sd;
      if (!areaBlocked(px - 5, py - 5, px + 5, py + 5)) {
        const lim = T.id === 'avenue' ? 80 : 110;
        const rd = { kind: 'radar', x: px, y: py, h: 40, lim, last: -99 };
        addTall(rd, px - 50, py - 50, px + 50, py + 50); addCircCol(px, py, 3, 'pole').brk = { kind: 'tall', obj: rd };
        const cx = e.a.x + e.dx * s, cy = e.a.y + e.dy * s;
        World.radars.push({ obj: rd, lim, x0: e.h ? cx - 22 : cx - e.hw, x1: e.h ? cx + 22 : cx + e.hw, y0: e.h ? cy - e.hw : cy - 22, y1: e.h ? cy + e.hw : cy + 22 });
        const tx = cx - nx * e.hw * 0.5, ty = cy - ny * e.hw * 0.5;
        bake(cx - 60, cy - 60, cx + 60, cy + 60, 5.5, (g) => {
          g.save(); g.translate(cx - e.dx * 70 + nx * e.hw * 0.5, cy - e.dy * 70 + ny * e.hw * 0.5); g.rotate(Math.atan2(e.dy, e.dx) + Math.PI / 2);
          g.fillStyle = 'rgba(235,235,225,0.7)'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(lim), 0, 0); g.restore();
          g.save(); g.translate(cx + e.dx * 70 + -nx * e.hw * 0.5, cy + e.dy * 70 - ny * e.hw * 0.5); g.rotate(Math.atan2(e.dy, e.dx) - Math.PI / 2);
          g.fillStyle = 'rgba(235,235,225,0.7)'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(lim), 0, 0); g.restore();
        });
      }
    }
    // pontos de ônibus nas avenidas
    if (T.id === 'avenue' && e.len > 400) {
      const s = e.len * 0.5, sd = 1;
      const px = e.a.x + e.dx * s + nx * (e.hw + 12) * sd, py = e.a.y + e.dy * s + ny * (e.hw + 12) * sd;
      if (!areaBlocked(px - 20, py - 8, px + 20, py + 8)) {
        const st = { kind: 'busstop', x: px, y: py, a: Math.atan2(e.dy, e.dx), h: 26 };
        addTall(st, px - 30, py - 30, px + 30, py + 30);
        addRectCol(px - (e.h ? 22 : 6), py - (e.h ? 6 : 22), px + (e.h ? 22 : 6), py + (e.h ? 6 : 22), 'prop').brk = { kind: 'tall', obj: st };
        addLight(px, py, 70, 0.7, 'white');
      }
    }
  }
  // semáforos
  for (const n of World.nodes) {
    if (!n.light) continue;
    for (const e of n.edges) {
      const out = e.a === n ? 1 : -1; // direção saindo do nó
      const dx = e.dx * out, dy = e.dy * out;
      const clear = e.a === n ? e.clearA : e.clearB;
      // carros chegando vêm na direção -d; à direita deles fica o lado (-(-dy), -dx)...
      const ax = -dx, ay = -dy; // direção de chegada
      const rx = -ay, ry = ax;
      const off = e.hw + (e.T.sw ? 10 : 8);
      const px = n.x + dx * (clear - 18) + rx * off, py = n.y + dy * (clear - 18) + ry * off;
      const pole = { kind: 'tlight', x: px, y: py, node: n, axis: e.h ? 'H' : 'V', a: Math.atan2(ay, ax), h: 50, hx: px - rx * 14, hy: py - ry * 14 };
      addTall(pole, px - 50, py - 50, px + 50, py + 50);
      addCircCol(px, py, 3, 'pole').brk = { kind: 'tall', obj: pole };
      World.trafficPoles.push(pole);
    }
  }
  // PARE pintado no chão nos cruzamentos sem semáforo da cidade (as placas foram tiradas: pesavam)
  for (const n of World.nodes) {
    if (n.light || n.edges.length < 3 || n.x > 4700) continue;
    for (const e of n.edges) {
      if (e.T.id !== 'street' || !chance(0.35)) continue;
      const out = e.a === n ? 1 : -1, dx = e.dx * out, dy = e.dy * out;
      const clear = e.a === n ? e.clearA : e.clearB;
      const rx = dy, ry = -dx;
      // faixa "PARE" pintada
      const tx = n.x + dx * (clear + 14) + rx * (e.hw * 0.5), ty = n.y + dy * (clear + 14) + ry * (e.hw * 0.5);
      bake(tx - 30, ty - 30, tx + 30, ty + 30, 5.5, (g) => { g.save(); g.translate(tx, ty); g.rotate(Math.atan2(-dy, -dx) + Math.PI / 2); g.fillStyle = 'rgba(235,235,225,0.75)'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PARE', 0, 0); g.restore(); });
    }
  }
}

/* ---------- rodovia, rio e zona rural ---------- */
function buildRiver() {
  for (let gy = 0; gy < GH; gy++) {
    const y = gy * GC + 5, cx = riverCX(y), hw = riverHW(y);
    const a = Math.floor((cx - hw - 30) / GC), b = Math.ceil((cx + hw + 30) / GC);
    for (let gx = a; gx <= b; gx++) {
      const x = gx * GC + 5, d = Math.abs(x - cx);
      if (gx < 0 || gx >= GW) continue;
      ground[gy * GW + gx] = d < hw ? SF.WATER : d < hw + 28 ? SF.SAND : ground[gy * GW + gx];
    }
  }
  for (let y = 0; y < WORLD_H; y += 512) bake(4900, y, 6000, y + 512, 2, (g) => drawRiver(g, y, y + 512));
  // orla (margem oeste)
  const walkX = 4672;
  decal(walkX, 340, walkX + 34, 1400, 'plaza'); decal(walkX, 1600, walkX + 34, 3780, 'plaza'); decal(walkX, 3980, walkX + 34, 6100, 'plaza');
  for (let y = 420; y < 6080; y += 170) {
    if (Math.abs(y - 1500) < 140 || Math.abs(y - 3880) < 140) continue;
    addLamp(walkX + 42, y, walkX + 42, y, 'white', { style: 'globe', h: 32, r: 110, i: 0.7 });
    if (chance(0.5)) addProp('bench', walkX + 52, y + 60, { a: Math.PI / 2, col: 'rect', w: 8, h: 26 });
    if (chance(0.7)) addTree(walkX + rnd(80, 140), y + rnd(30, 120), chance(0.6) ? 'palm' : 'ipeP', rnd(0.9, 1.2));
  }
  addBuilding(4790, 2260, 4840, 2310, 20, { style: 'kiosk', roofType: 'hip', roofColor: '#6e4a2a', wall: '#c9a06a', lit: 0.9, sign: 'QUIOSQUE', signColor: '#ffb547' });
  addBuilding(4800, 4860, 4850, 4910, 20, { style: 'kiosk', roofType: 'hip', roofColor: '#6e4a2a', wall: '#c9a06a', lit: 0.9, sign: 'AÇAÍ', signColor: '#c56bff' });
  // mata ciliar e árvores das margens
  for (let y = 360; y < 6100; y += 240) {
    if (Math.abs(y - 1500) < 180 || Math.abs(y - 3880) < 180 || Math.abs(y - 6200) < 220) continue;
    const cx = riverCX(y), hw = riverHW(y);
    const x0 = cx + hw + 60, x1 = 6240;
    if (chance(0.6) && x1 - x0 > 120 && !(y > 2400 && y < 2800)) {
      const fx0 = x0 + rnd(0, 60), fx1 = x1 - rnd(0, 80);
      forest(fx0, y, fx1, y + rnd(120, 220));
    } else scatterTrees(x0, y, x1, y + 230, 5, ['round', 'mango', 'pine', 'bush']);
    scatterTrees(4900, y, cx - hw - 40, y + 230, 2, ['round', 'palm', 'bush', 'ipeY']);
  }
  // mirante
  const my = 2600, mbx = riverCX(my) + riverHW(my);
  decal(mbx + 20, my - 12, 6262, my + 12, 'earth');
  addBuilding(mbx - 40, my - 34, mbx + 30, my + 34, 7, { style: 'deck', roofType: 'deck', roofColor: '#7a5434', wall: '#5a3c22', lit: 0, noCol: true });
  addRectCol(mbx - 40, my - 34, mbx - 34, my + 34, 'fence'); addRectCol(mbx - 40, my - 34, mbx + 30, my - 28, 'fence'); addRectCol(mbx - 40, my + 28, mbx + 30, my + 34, 'fence');
  addLamp(mbx + 40, my - 40, mbx + 20, my - 20, 'sodium', { h: 40, r: 120 });
  gFill(mbx - 34, my - 28, mbx + 30, my + 28, SF.BRIDGE);
  World.mirante = { x: mbx, y: my };
}
function forest(x0, y0, x1, y1, noCol) {
  decal(x0, y0, x1, y1, 'forest', { z: 7.5 });
  if (!noCol) addRectCol(x0 + 14, y0 + 14, x1 - 14, y1 - 14, 'forest');
}
function buildRural() {
  // bordas do mundo
  forest(0, 0, WORLD_W, 230); forest(0, 230, 230, SEA_Y); forest(8790, 230, WORLD_W, SEA_Y);
  addRectCol(-200, -200, WORLD_W + 200, 20, 'world'); addRectCol(-200, WORLD_H - 20, WORLD_W + 200, WORLD_H + 200, 'world');
  addRectCol(-200, 0, 20, WORLD_H, 'world'); addRectCol(WORLD_W - 20, 0, WORLD_W + 200, WORLD_H, 'world');
  // faixa norte da cidade (entre a mata e a primeira rua)
  scatterTrees(260, 236, 4560, 258, 30, ['round', 'pine', 'bush']);
  // milharal e canavial (norte)
  decal(6360, 360, 7440, 1420, 'corn');
  addProp('scarecrow', 6900, 900, { col: 'circ', cr: 4 });
  decal(7540, 300, 8660, 830, 'cane');
  scatterTrees(6340, 250, 8700, 340, 22, ['round', 'pine', 'mango']);
  // Sítio Boa Vista
  decal(7540, 920, 8660, 1455, 'pasture');
  decal(7840, 920, 8460, 1290, 'earth');
  decal(7948, 913, 7992, 1000, 'earth');
  addBuilding(7900, 1000, 8040, 1100, 28, { style: 'farmhouse', roofType: 'hip', roofColor: '#a04a2a', wall: '#efe4c8', lit: 0.7, front: 'N' });
  addBuilding(8150, 970, 8300, 1120, 40, { style: 'barn', roofType: 'gable', roofColor: '#7a2e22', wall: '#a8402f', lit: 0.15 });
  addBuilding(8350, 1180, 8420, 1232, 16, { style: 'shed', roofType: 'gable', roofColor: '#7d6a50', wall: '#b59a74', lit: 0 });
  decal(7610, 980, 7810, 1120, 'garden');
  addProp('well', 8080, 1180, { col: 'circ', cr: 12 });
  fenceRect(7560, 1300, 8640, 1440, [{ side: 'N', at: 8000, w: 60 }], 'wood');
  for (const [x, y] of [[7880, 960], [8060, 960]]) addLamp(x, y, x, y + 10, 'warm', { style: 'pole', h: 40, r: 130 });
  scatterTrees(7560, 1140, 7830, 1290, 5, ['mango', 'round', 'palm']);
  scatterTrees(8440, 940, 8650, 1280, 5, ['mango', 'round']);
  World.animalsDef.push({ type: 'chicken', n: 9, rect: [8300, 1130, 8460, 1280] });
  World.animalsDef.push({ type: 'cow', n: 4, rect: [7600, 1320, 8600, 1420] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [7860, 1110, 8120, 1280] });
  addShop({ kind: 'sitio', name: 'Sítio Bota Fé', x: 7970, y: 880 + 15, color: '#9be36a', region: 'sitio', pickup: true, items: ['Ovos caipiras', 'Queijo minas', 'Caixa de verduras'] });
  // pasto grande
  decal(6340, 1540, 7460, 3840, 'pasture');
  fenceRect(6380, 1580, 7420, 3800, [{ side: 'E', at: 2400, w: 60 }, { side: 'W', at: 3200, w: 60 }], 'wood');
  scatterTrees(6420, 1620, 7380, 3760, 14, ['mango', 'round', 'round', 'pine'], 1, 1.4);
  addProp('trough', 6900, 2700, { col: 'rect', w: 40, h: 12 });
  addBuilding(7200, 3500, 7300, 3580, 22, { style: 'shed', roofType: 'gable', roofColor: '#6d5a44', wall: '#9a8466', lit: 0 });
  World.animalsDef.push({ type: 'cow', n: 12, rect: [6420, 1620, 7380, 3760] });
  World.animalsDef.push({ type: 'horse', n: 3, rect: [6420, 2600, 7380, 3760] });
  World.animalsDef.push({ type: 'owl', n: 4, rect: [6380, 1580, 7420, 3800] });
  // cafezal
  decal(7540, 1540, 8660, 3300, 'coffee');
  decal(7540, 3300, 8660, 3330, 'earth');
  forest(7540, 3330, 8660, 3840);
  addBuilding(8460, 2380, 8580, 2470, 26, { style: 'farmhouse', roofType: 'hip', roofColor: '#9a4a2a', wall: '#e8dcc2', lit: 0.6 });
  decal(8580, 2410, 8662, 2440, 'earth');
  World.animalsDef.push({ type: 'dog', n: 1, rect: [8420, 2360, 8640, 2520] });
  // Fazenda Santa Luzia
  decal(7540, 3920, 8660, 5260, 'pasture');
  decal(7900, 4250, 8460, 4940, 'earth');
  decal(8050, 3913, 8100, 4260, 'earth');
  for (let y = 3980; y < 4240; y += 46) { addTree(8030, y, 'palm', 1.1, { force: true }); addTree(8122, y, 'palm', 1.1, { force: true }); }
  addBuilding(7950, 4300, 8200, 4460, 36, { style: 'farmhouse', roofType: 'hip', roofColor: '#b0532e', wall: '#f4efe2', lit: 0.75, front: 'N', sign: 'FAZENDA MUUUITO LONGE', signColor: '#ffd24a' });
  addLight(8075, 4280, 150, 0.9, 'warm');
  fenceRect(8300, 4000, 8600, 4240, [{ side: 'W', at: 4120, w: 40 }], 'wood');
  World.animalsDef.push({ type: 'horse', n: 4, rect: [8320, 4020, 8580, 4220] });
  const silo = { kind: 'silo', x: 8460, y: 4600, r: 38, h: 92 };
  addTall(silo, 8420, 4560, 8500, 4640); addCircCol(8460, 4600, 38, 'bld');
  addBuilding(8240, 4700, 8430, 4880, 44, { style: 'barn', roofType: 'gable', roofColor: '#6e2c22', wall: '#9c3b2c', lit: 0.2 });
  addParkedCar(8180, 4800, -Math.PI / 2, 'tractor', '#2e8b3a');
  const mill = { kind: 'windmill', x: 7700, y: 4700, h: 70 };
  addTall(mill, 7660, 4660, 7740, 4740); addCircCol(7700, 4700, 6, 'pole');
  decal(7560, 4960, 8640, 5240, 'soy');
  for (const [x, y] of [[8010, 4270], [8140, 4270], [8300, 4560]]) addLamp(x, y, x, y, 'warm', { style: 'pole', h: 40, r: 130 });
  World.animalsDef.push({ type: 'chicken', n: 7, rect: [7920, 4480, 8200, 4600] });
  World.animalsDef.push({ type: 'cow', n: 6, rect: [7600, 3960, 7880, 4900] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [7950, 4470, 8250, 4650] });
  addShop({ kind: 'fazenda', name: 'Fazenda Muuuito Longe', x: 8075, y: 3880 + 15, color: '#ffd24a', region: 'fazenda', pickup: true, items: ['Leite fresco', 'Queijo da fazenda', 'Doce de leite'] });
  // açude
  decal(6340, 3920, 7460, 4280, 'soy');
  bake(6600, 4380, 7200, 4800, 2, (g) => drawPond(g, 6900, 4590, 230, 150));
  for (let gy = Math.floor(4440 / GC); gy < Math.ceil(4740 / GC); gy++) for (let gx = Math.floor(6670 / GC); gx < Math.ceil(7130 / GC); gx++) {
    const x = gx * GC + 5, y = gy * GC + 5, d = ((x - 6900) / 230) ** 2 + ((y - 4590) / 150) ** 2;
    if (d < 1) ground[gy * GW + gx] = SF.WATER; else if (d < 1.25) ground[gy * GW + gx] = SF.SAND;
  }
  addBuilding(7080, 4480, 7180, 4502, 4, { style: 'deck', roofType: 'deck', roofColor: '#7a5434', wall: '#5a3c22', lit: 0, noCol: true, noShadow: true });
  addLamp(7176, 4478, 7176, 4478, 'warm', { style: 'globe', h: 30, r: 110, i: 0.8 });
  scatterTrees(6360, 4300, 7440, 5260, 20, ['round', 'mango', 'pine', 'bush', 'ipeY']);
  World.animalsDef.push({ type: 'capybara', n: 4, rect: [6700, 4720, 7100, 4790] });
  decal(6360, 4980, 7440, 5240, 'corn');
  // canaviais do sul
  decal(6360, 5360, 7440, 6100, 'cane');
  decal(7560, 5360, 8640, 6100, 'cane');
  for (let x = 6360; x < 8660; x += 70) { addTree(x, 5340, 'pine', rnd(0.9, 1.1)); }
  // (a margem sul da rodovia agora é o litoral: Barra do Jururuzinho, Camburiso e o porto)
  // capivaras do rio
  for (const y of [1000, 2300, 3300, 4300, 5200]) {
    const cx = riverCX(y) + riverHW(y) + 8;
    World.animalsDef.push({ type: 'capybara', n: 3, rect: [cx - 4, y - 60, cx + 14, y + 60] });
  }
  for (const y of [1900, 4700]) {
    const cx = riverCX(y) - riverHW(y) - 14;
    World.animalsDef.push({ type: 'capybara', n: 2, rect: [cx - 10, y - 50, cx + 6, y + 50] });
  }
  // cercas de arame farpado com mourões de madeira e porteiras nas estradas de terra
  for (const e of World.edges) {
    if (e.T.id !== 'dirt' || e.bridge) continue;
    const nx = -e.dy, ny = e.dx;
    for (const sd of [-1, 1]) {
      let s = 70;
      while (s < e.len - 70) {
        const run = rnd(160, 520), s1 = Math.min(e.len - 70, s + run), o = e.hw + 16;
        const posts = [];
        for (let t = s; t <= s1; t += 34) {
          const px = e.a.x + e.dx * t + nx * o * sd, py = e.a.y + e.dy * t + ny * o * sd, gt = groundAt(px, py);
          if (gt !== SF.GRASS && gt !== SF.FIELD && gt !== SF.EARTH) { posts.length = 0; break; }
          posts.push([px, py]);
        }
        if (posts.length > 2 && !areaBlocked(Math.min(posts[0][0], posts[posts.length - 1][0]) - 3, Math.min(posts[0][1], posts[posts.length - 1][1]) - 3, Math.max(posts[0][0], posts[posts.length - 1][0]) + 3, Math.max(posts[0][1], posts[posts.length - 1][1]) + 3)) {
          const P = posts.slice(), xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
          bake(Math.min(...xs) - 6, Math.min(...ys) - 6, Math.max(...xs) + 6, Math.max(...ys) + 6, 8, (g) => {
            g.strokeStyle = 'rgba(190,195,200,0.55)'; g.lineWidth = 0.7;
            for (const w of [-1.4, 1.4]) { g.beginPath(); P.forEach(([x, y], i) => { const xx = x + (e.h ? 0 : w), yy = y + (e.h ? w : 0); if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); }); g.stroke(); }
            for (const [x, y] of P) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - 1, y, 4, 3); g.fillStyle = '#6a4a2c'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = '#8a6440'; g.fillRect(x - 2, y - 2, 4, 1.4); }
          });
        }
        s = s1 + rnd(40, 90); // porteira / entrada de sítio
      }
    }
  }
  // árvores na beira das estradas rurais
  for (const e of World.edges) {
    if (e.T.id !== 'dirt' && e.T.id !== 'road') continue;
    if (e.a.x < 4700 && e.b.x < 4700) continue;
    const nx = -e.dy, ny = e.dx;
    for (let s = 60; s < e.len - 60; s += rnd(70, 160)) {
      const sd = chance(0.5) ? 1 : -1, o = e.hw + rnd(26, 60);
      addTree(e.a.x + e.dx * s + nx * o * sd, e.a.y + e.dy * s + ny * o * sd, pick(['round', 'mango', 'pine', 'bush', 'ipeY', 'ipeP']), rnd(0.8, 1.3));
    }
  }
}
function buildHighwayStrip() {
  const y0 = 5371, y1 = 6098;
  // chácaras
  decal(371, y0, 1379, y1, 'lawn');
  for (const [x0, x1] of [[380, 700], [760, 1100]]) {
    const F = lotFrame(x0, y0, x1, y0 + 220, 'N');
    houseLot(F, { rich: true, back: true, lastLot: true, street: 'Rua da Esperança Equilibrista', roadHW: RT.street.w / 2, laneOff: RT.street.lanes[0], region: 'rodovia' });
  }
  scatterTrees(385, 5600, 1370, 6080, 14, ['mango', 'round', 'palm', 'pine']);
  // Posto Estrela Cadente
  decal(1521, y0, 1988, y1, 'lawn');
  World.posto2 = gasStation({ x0: 1521, y0: 5760, x1: 1988, y1: y1 }, { name: 'Posto Estrela Cadente', color: '#ffb000', front: 'N', canopy: [1580, 5920, 1880, 6070], store: [1560, 5780, 1760, 5880], totem: [1974, 6082], region: 'rodovia' });
  decal(1521, y0 + 20, 1988, 5740, 'paved');
  const sx0 = 1540, SW = 34;
  bake(sx0, 5400, sx0 + 13 * SW, 5470, 6, (g) => { g.strokeStyle = 'rgba(240,240,230,0.7)'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 13; i++) { g.moveTo(sx0 + i * SW, 5400); g.lineTo(sx0 + i * SW, 5470); } g.moveTo(sx0, 5400); g.lineTo(sx0 + 13 * SW, 5400); g.stroke(); });
  for (let i = 0; i < 13; i++) {
    const x = sx0 + i * SW + SW / 2;
    if (i === 3 || i === 9) { World.parkSpots.push({ id: 'estrela_' + i, name: 'Pátio do Posto Estrela Cadente', x, y: 5435, a: -Math.PI / 2, w: SW, l: 62, reward: 200 }); continue; }
    if (chance(0.5)) addParkedCar(x, 5435, -Math.PI / 2, randomCarModel(), pick(CAR_COLORS));
  }
  for (let i = 0; i < 3; i++) addParkedCar(1620 + i * 120, 5640, 0, 'truck', pick(['#d8d8d8', '#c43d2e', '#2c5d9c', '#e0a020']));
  addLamp(1700, 5520, 1700, 5520, 'white', { style: 'pole', h: 64, r: 200 });
  addLamp(1900, 5520, 1900, 5520, 'white', { style: 'pole', h: 64, r: 200 });
  // churrascaria
  decal(2212, y0, 3880, y1, 'lawn');
  decal(2600, 5780, 3100, y1, 'paved');
  const chb = addBuilding(2680, 5790, 3000, 5930, 34, { style: 'shop', front: 'S', roofType: 'hip', roofColor: '#8a3a22', wall: '#e8d2a8', lit: 0.9, sign: 'BOI NA BRASA', signColor: '#ff5f3d' });
  addLight(2840, 5950, 160, 0.9, 'warm', { shop: true });
  const cx0 = 2620;
  bake(cx0, 5990, cx0 + 14 * 34, 6060, 6, (g) => { g.strokeStyle = 'rgba(240,240,230,0.7)'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 14; i++) { g.moveTo(cx0 + i * 34, 5990); g.lineTo(cx0 + i * 34, 6060); } g.moveTo(cx0, 5990); g.lineTo(cx0 + 14 * 34, 5990); g.stroke(); });
  for (let i = 0; i < 14; i++) {
    const x = cx0 + i * 34 + 17;
    if (i === 5 || i === 11) { World.parkSpots.push({ id: 'rodeio_' + i, name: 'Estacionamento da Churrascaria', x, y: 6025, a: -Math.PI / 2, w: 34, l: 62, reward: 200 }); continue; }
    if (chance(0.55)) addParkedCar(x, 6025, -Math.PI / 2, randomCarModel(), pick(CAR_COLORS));
  }
  addLamp(2760, 5970, 2760, 5970, 'sodium', { style: 'pole', h: 60, r: 180 });
  addLamp(3000, 5970, 3000, 5970, 'sodium', { style: 'pole', h: 60, r: 180 });
  addShop({ kind: 'churrascaria', name: 'Churrascaria Boi na Brasa', x: 2840, y: 6200 - 21, bld: chb, color: '#ff5f3d', region: 'rodovia', pickup: true, items: ['Marmitas de churrasco', 'Encomenda de carnes'] });
  scatterTrees(2230, 5400, 2580, 6080, 8, ['mango', 'round', 'pine']);
  scatterTrees(3150, 5400, 3870, 6080, 12, ['mango', 'round', 'pine', 'palm']);
  // borracharia
  decal(4020, y0, 4530, y1, 'lawn');
  decal(4100, 5940, 4400, y1, 'gravel');
  const bb = addBuilding(4150, 5960, 4330, 6060, 26, { style: 'shop', front: 'S', roofType: 'corrugated', roofColor: '#6a6a60', wall: '#d4cdb4', lit: 0.9, sign: 'BORRACHARIA 24H', signColor: '#ffd24a' });
  for (let i = 0; i < 5; i++) addProp('tires', 4120 + i * 22, 6080, { col: 'circ', cr: 8 });
  addLight(4240, 6080, 120, 0.9, 'warm', { shop: true });
  addShop({ kind: 'borracharia', name: 'Borracharia Furou, Chamou', x: 4240, y: 6200 - 21, bld: bb, color: '#ffd24a', region: 'rodovia' });
  scatterTrees(4035, 5400, 4515, 5900, 8, ['round', 'mango', 'palm']);
  // outdoors
  const ads = [['MOQUECA É CAPIXABA', 'O RESTO É PEIXADA'], ['DIRIJA DE BOA, MANO', 'A NOITE É LONGA'], ['RÁDIO GAMBIARRA FM', '171,1'], ['BOI NA BRASA', 'RODÍZIO ATÉ CAIR'], ['CAFÉ CONILON DO ES', 'ACORDA ATÉ DEFUNTO'], ['POSTO ESTRELA CADENTE', 'ABERTO 25H']];
  let ai = 0;
  for (const x of [900, 3400, 5000, 6900, 8200]) {
    const bx = x, by = x > 4700 ? 6320 : 6080;
    if (areaBlocked(bx - 40, by - 10, bx + 40, by + 10)) continue;
    const bd = { kind: 'billboard', x: bx, y: by, h: 58, text: ads[ai % ads.length], col: pick(['#ffb547', '#59e0ff', '#ff5f7a', '#5be38f']), panel: null };
    ai++;
    addTall(bd, bx - 60, by - 60, bx + 60, by + 60);
    addCircCol(bx - 24, by, 4, 'pole'); addCircCol(bx + 24, by, 4, 'pole');
    addLight(bx, by - 20, 110, 0.6, 'white');
  }
  // cachorros pelas ruas residenciais
  World.animalsDef.push({ type: 'dog', n: 1, rect: [640, 2700 + RT.street.w / 2 + 5, 1380, 2700 + RT.street.w / 2 + 17] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [1530, 3880 + RT.avenue.w / 2 + 5, 1980, 3880 + RT.avenue.w / 2 + 17] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [2770, 4500 + RT.street.w / 2 + 5, 3280, 4500 + RT.street.w / 2 + 17] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [300 + RT.street.w / 2 + 5, 3420, 300 + RT.street.w / 2 + 17, 3800] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [3360, 4900, 3920, 5240] });
  World.animalsDef.push({ type: 'dog', n: 2, rect: [420, 3420, 760, 3760] });
}

/* ---------- pontos de interesse e percursos ---------- */
// tira árvores que acabaram em cima do asfalto (ruas alargadas depois do plantio)
function pruneRoadTrees() {
  let n = 0;
  for (const t of World.tall) {
    if (t.kind !== 'tree' || t.removed) continue;
    const gt = groundAt(t.x, t.y);
    let onRoad = gt === SF.ROAD || gt === SF.BRIDGE || gt === SF.DIRT;
    if (!onRoad) { const ne = nearestEdge(t.x, t.y); if (ne && ne.d !== undefined && ne.d < ne.e.hw + 4) onRoad = true; }
    if (onRoad) { t.removed = true; if (t.col) { t.col.x = t.col.y = -1e6; t.col.r = 0; t.col.tag = 'none'; t.col.brk = null; } n++; }
  }
  World.tall = World.tall.filter((t) => !t.removed);
  return n;
}
// tira 20% das árvores do jogo (escolhidas pela posição, sem sorteio: o resto do mapa não muda)
function thinTrees() {
  let n = 0;
  for (const t of World.tall) if (t.kind === 'tree' && !t.removed && hash2((t.x * 7) | 0, (t.y * 3) | 0) < 0.2) {
    t.removed = true; n++;
    if (t.col) { t.col.x = t.col.y = -1e6; t.col.r = 0; t.col.tag = 'none'; t.col.brk = null; }
  }
  World.tall = World.tall.filter((t) => !t.removed);
  // tira as árvores removidas da lista de desenho (nem entram na conta do quadro)
  for (let i = 0; i < rendGrid.cells.length; i++) { const a = rendGrid.cells[i]; if (a && a.some((o) => o.removed)) rendGrid.cells[i] = a.filter((o) => !o.removed); }
  return n;
}
function markReflections() {
  for (const L of World.lights) {
    for (let dy = 30; dy <= 260; dy += 20) if (groundAt(L.x, L.y + dy) === SF.WATER) { L.refl = dy + 30; break; }
  }
}
function addFlags(x1, y1, x2, y2, bulbs) {
  const f = { kind: 'flags', x1, y1, x2, y2, h: 44, bulbs: !!bulbs, x: (x1 + x2) / 2, y: (y1 + y2) / 2, seed: rnd() };
  addTall(f, Math.min(x1, x2) - 20, Math.min(y1, y2) - 30, Math.max(x1, x2) + 20, Math.max(y1, y2) + 20);
}
function addGrill(x, y) {
  if (areaBlocked(x - 8, y - 6, x + 8, y + 6)) return;
  const g = { kind: 'grill', x, y, h: 10 };
  addTall(g, x - 30, y - 30, x + 30, y + 30); addCircCol(x, y, 6, 'prop').brk = { kind: 'tall', obj: g };
  World.grills.push(g);
  addLight(x, y, 70, 0.7, 'sodium');
  World.animalsDef.push({ type: 'person', n: 3, rect: [x - 30, y - 8, x + 30, y + 8], look: { dance: true } });
}
function buildFesta() {
  for (const s of World.shops) {
    if (!['bar', 'lanchonete', 'churrascaria', 'mercado'].includes(s.kind)) continue;
    const ne = nearestEdge(s.x, s.y), e = ne.e;
    const sd = e.h ? Math.sign((s.bld ? s.bld.cy : s.y) - e.a.y) || 1 : Math.sign((s.bld ? s.bld.cx : s.x) - e.a.x) || 1;
    const o = e.hw + (e.T.sw ? e.T.sw * 0.5 : 14);
    if (e.h) addGrill(s.x + 70, e.a.y + sd * o); else addGrill(e.a.x + sd * o, s.y + 70);
  }
  { const R = cellRect(2, 1); addGrill(R.x1 - 80, R.y1 - 26); }
  { const R = cellRect(0, 5); addGrill(XS[1] - RT.street.w / 2 - 11, (R.y0 + R.y1) / 2 + 60); }
  addGrill(1640, 5900);
  // bandeirinhas de festa junina e gambiarras de luz perto dos comércios do bairro
  for (const s of World.shops) {
    if (!['bar', 'lanchonete', 'padaria', 'mercado', 'moquecaria', 'churrascaria'].includes(s.kind)) continue;
    const ne = nearestEdge(s.x, s.y), e = ne.e;
    const span = e.hw + (e.T.sw || 8) + 2;
    for (const d of [-70, -35, 0, 35, 70]) {
      const zig = (d / 35) % 2 ? 14 : -14;
      if (e.h) addFlags(s.x + d, e.a.y - span, s.x + d + zig, e.a.y + span, s.kind === 'bar' || s.kind === 'lanchonete');
      else addFlags(e.a.x - span, s.y + d, e.a.x + span, s.y + d + zig, s.kind === 'bar' || s.kind === 'lanchonete');
    }
  }
  // arraial na praça, no campo de várzea, no sítio e na fazenda
  const lines = [[1530, 1180, 1980, 1380], [1530, 1380, 1980, 1180], [380, 3380, 770, 3760], [380, 3760, 770, 3380], [7860, 1150, 8140, 1270], [7860, 1270, 8140, 1150], [7960, 4500, 8220, 4620], [7960, 4620, 8220, 4500]];
  for (const [a, b, c, d] of lines) addFlags(a, b, c, d, true);
}
function buildCapixaba() {
  // Morro do Convento da Pinha (no alto, com vista para a cidade)
  const hx = 8100, hy = 560;
  decal(hx - 300, hy - 240, hx + 300, hy + 240, 'hill', { z: 1.2 });
  decal(hx - 8, hy + 120, hx + 8, 846, 'earth', { z: 1.3 });
  const cv = addBuilding(hx - 70, hy - 50, hx + 70, hy + 40, 34, { style: 'church', roofType: 'hip', roofColor: '#a8492b', wall: '#f4f0e6', lit: 0.6, front: 'S' });
  const tw = addBuilding(hx - 18, hy + 40, hx + 18, hy + 76, 70, { style: 'tower', roofType: 'tower', roofColor: '#8a3f26', wall: '#f2ece0', lit: 0.3, front: 'S' });
  tw.cross = true;
  addLight(hx, hy + 90, 200, 0.9, 'warm'); addLight(hx, hy - 10, 160, 0.6, 'warm');
  for (const [dx, dy] of [[-150, -60], [150, -60], [-170, 80], [170, 80], [-110, 150], [110, 150]]) addTree(hx + dx, hy + dy, 'palm', 1.1, { force: true });
  for (const dy of [150, 210, 262]) { addLamp(hx - 18, hy + dy, hx - 6, hy + dy, 'warm', { style: 'globe', h: 30, r: 110, i: 0.8 }); }
  // Galpão das Paneleiras, na orla
  const pb = addBuilding(4780, 3240, 4880, 3310, 22, { style: 'shop', roofType: 'corrugated', roofColor: '#6a5a4a', wall: '#3a2a22', lit: 0.8, sign: 'PANELAS DE BARRO', signColor: '#ff9a4a', front: 'W' });
  addLight(4760, 3275, 110, 0.9, 'warm', { shop: true });
  for (let i = 0; i < 5; i++) addProp('pot', 4745, 3250 + i * 14, { col: 'circ', cr: 5, R: 10 });
  addShop({ kind: 'paneleiras', name: 'Galpão das Paneleiras', x: 4600 + RT.street.lanes[0], y: 3275, bld: pb, color: '#ff9a4a', region: 'rio', pickup: true, items: ['Panela de barro grande', 'Jogo de panelas de barro', 'Moquequeira de barro'] });
  // placas verdes de rodovia com cidades do ES
  const signs = [[1180, 'VITORINHA 25', 'VILA VÉIA 31'], [3300, 'GUARAPARIU 58', 'ANCHIETA DE PERTO 80'], [6900, 'PEDRA AZULEJO 92', 'DOMINGOS MARTELO 70'], [8200, 'CACHOEIRO DE ITAPEMIRIM-MIRIM 136', 'LINHA RES 135']];
  for (const [x, a, b] of signs) {
    const y = HWY_Y - RT.highway.w / 2 - 14;
    if (areaBlocked(x - 30, y - 8, x + 30, y + 8)) continue;
    const g = { kind: 'gsign', x, y, h: 54, lines: [a, b], panel: null };
    addTall(g, x - 60, y - 60, x + 60, y + 60);
    addCircCol(x - 26, y, 3, 'pole'); addCircCol(x + 26, y, 3, 'pole');
  }
  { const x = 5000, y = 1500 - RT.road.w / 2 - 14; const g = { kind: 'gsign', x, y, h: 50, lines: ['TERCEIRA PONTE E MEIA', 'SERRA ELÉTRICA 40 · ARACRUZ CREDO 70'], panel: null }; addTall(g, x - 60, y - 60, x + 60, y + 60); addCircCol(x - 26, y, 3, 'pole'); addCircCol(x + 26, y, 3, 'pole'); }
  // feira livre perto das chácaras
  const cols = ['#e63946', '#2a9d8f', '#f4c430', '#3a86ff', '#ff7f11'];
  let n = 0;
  for (let x = 470; x < 1260 && n < 10; x += 74) {
    const y = 5830;
    if (areaBlocked(x - 14, y - 12, x + 14, y + 12)) continue;
    const st = { kind: 'stall', x, y, h: 20, c: cols[n % cols.length], seed: n };
    addTall(st, x - 40, y - 40, x + 40, y + 40); addRectCol(x - 12, y - 8, x + 12, y + 8, 'prop').brk = { kind: 'tall', obj: st }; n++;
  }
  if (n) { decal(450, 5790, 1270, 5870, 'yard', { z: 1.4 }); addLight(860, 5830, 260, 0.6, 'warm'); World.animalsDef.push({ type: 'person', n: 14, rect: [460, 5850, 1260, 5866] }); }
}
/* ---------- Serra: Feio Rosa e Jardim Cara-Pintada ---------- */
function serraRect(c, r) {
  const hv = (x) => (x === 2100 ? RT.avenue.w / 2 : RT.street.w / 2) + 22;
  const hh = (y) => y === 6200 ? RT.highway.w / 2 + 14 : (y === 7500 ? RT.avenue.w / 2 : RT.street.w / 2) + 22;
  return { x0: XS[c] + hv(XS[c]), x1: XS[c + 1] - hv(XS[c + 1]), y0: SERRA_YS[r] + hh(SERRA_YS[r]), y1: SERRA_YS[r + 1] - hh(SERRA_YS[r + 1]) };
}
function serraRoads(c, r) {
  const nm = (y) => y === 6200 ? 'Rodovia BR-101 e Pouco' : (ROADS.find((q) => q.h && q.y === y && q.x1 < 4700) || {}).name;
  const nv = (x) => (ROADS.find((q) => !q.h && q.x === x && q.y2 >= 8700) || ROADS.find((q) => !q.h && q.x === x) || {}).name;
  const mk = (name, hw) => ({ name, hw, lane: hw > 60 ? RT.avenue.lanes[1] : RT.street.lanes[0] });
  const y0 = SERRA_YS[r], y1 = SERRA_YS[r + 1], x0 = XS[c], x1 = XS[c + 1];
  return { N: mk(nm(y0), y0 === 6200 ? RT.highway.w / 2 : y0 === 7500 ? RT.avenue.w / 2 : RT.street.w / 2), S: mk(nm(y1), y1 === 7500 ? RT.avenue.w / 2 : RT.street.w / 2), W: mk(nv(x0), x0 === 2100 ? RT.avenue.w / 2 : RT.street.w / 2), E: mk(nv(x1), x1 === 2100 ? RT.avenue.w / 2 : RT.street.w / 2) };
}
function pracaBagunca(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'plaza');
  const cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2;
  decal(cx - 90, cy - 60, cx + 90, cy + 60, 'court');
  addProp('goal', cx - 84, cy, { a: -Math.PI / 2, col: 'rect', w: 8, h: 44, R: 30 });
  addProp('goal', cx + 84, cy, { a: Math.PI / 2, col: 'rect', w: 8, h: 44, R: 30 });
  addBuilding(R.x0 + 20, R.y0 + 20, R.x0 + 120, R.y0 + 70, 18, { style: 'kiosk', roofType: 'flat', roofColor: '#2a3a5a', wall: '#e8c547', lit: 0.95, sign: 'PAGODE DE DOMINGO', signColor: '#ffd24a', front: 'S' });
  addBuilding(R.x1 - 70, R.y1 - 60, R.x1 - 20, R.y1 - 20, 18, { style: 'kiosk', roofType: 'hip', roofColor: '#6e4a2a', wall: '#c9a06a', lit: 0.9, sign: 'ESPETINHO', signColor: '#ff7a2a' });
  for (const [dx, dy] of [[-170, -150], [170, -150], [-170, 150], [170, 150], [0, -170], [0, 170]]) addTree(cx + dx, cy + dy, pick(['mango', 'ipeY', 'palm']), 1.1);
  for (const [dx, dy] of [[-130, -90], [130, -90], [-130, 90], [130, 90]]) addProp('bench', cx + dx, cy + dy, { col: 'rect', w: 26, h: 8 });
  for (const [dx, dy] of [[-200, 0], [200, 0], [0, -110], [0, 110]]) addLamp(cx + dx, cy + dy, cx + dx, cy + dy, 'white', { style: 'globe', h: 34, r: 140, i: 0.85 });
  addFlags(R.x0 + 20, R.y0 + 90, R.x1 - 20, R.y1 - 90, true); addFlags(R.x0 + 20, R.y1 - 90, R.x1 - 20, R.y0 + 90, true);
  addFlags(R.x0 + 20, cy, R.x1 - 20, cy, true);
  World.animalsDef.push({ type: 'person', n: 16, rect: [R.x0 + 16, R.y0 + 16, R.x1 - 16, R.y1 - 16], look: { dance: true } });
  addShop({ kind: 'bar', name: 'Bar da Bagunça', x: cx, y: R.y0 - 22 - (RT.street.w / 2 - RT.street.lanes[0]), color: '#ffd24a', region: 'feurosa' });
  World.pracaBagunca = { x: cx, y: cy };
}
function quadraBloco(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'yard');
  addBuilding(R.x0 + 30, R.y0 + 30, R.x1 - 30, R.y0 + 230, 34, { style: 'warehouse', roofType: 'corrugated', roofColor: '#2a6a3a', wall: '#f2f2ea', lit: 0.6, sign: 'G.R.E.S. UNIDOS DA GAMBIARRA', signColor: '#5be38f', front: 'S' });
  addLight((R.x0 + R.x1) / 2, R.y0 + 250, 200, 0.9, 'green', { shop: true });
  addFlags(R.x0 + 30, R.y0 + 270, R.x1 - 30, R.y0 + 270, true);
  World.animalsDef.push({ type: 'person', n: 8, rect: [R.x0 + 30, R.y0 + 240, R.x1 - 30, R.y0 + 300], look: { dance: true } });
  comunidadeBlock({ x0: R.x0, y0: R.y0 + 320, x1: R.x1, y1: R.y1 });
}
function batalhaoBlock(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'concrete');
  const wc = '#e2e2dc', gy = (R.y0 + R.y1) / 2;
  addWall(R.x0, R.y0, R.x1, R.y0 + 5, wc); addWall(R.x0, R.y1 - 5, R.x1, R.y1, wc); addWall(R.x1 - 5, R.y0 + 5, R.x1, R.y1 - 5, wc);
  addWall(R.x0, R.y0 + 5, R.x0 + 5, gy - 40, wc); addWall(R.x0, gy + 40, R.x0 + 5, R.y1 - 5, wc);
  const b = addBuilding(R.x0 + 120, R.y0 + 40, R.x1 - 40, R.y0 + 220, 40, { style: 'office', roofType: 'flat', roofColor: '#5a6470', wall: '#f2f2ea', lit: 0.7, sign: 'BATALHÃO DA PM', signColor: '#59a8ff', front: 'W' });
  addBuilding(R.x0 + 16, gy - 70, R.x0 + 46, gy - 44, 18, { style: 'kiosk', roofType: 'flat', roofColor: '#1d4f9c', wall: '#f2f2ea', lit: 1 });
  for (let i = 0; i < 4; i++) addParkedCar(R.x0 + 150 + i * 40, R.y1 - 70, -Math.PI / 2, 'police', '#f2f2ee');
  addProp('flagES', R.x0 + 80, R.y0 + 40, { col: 'circ', cr: 3 }); addProp('flagES', R.x0 + 80, R.y0 + 80, { col: 'circ', cr: 3 });
  for (const [x, y] of [[R.x0 + 90, gy], [R.x1 - 60, R.y1 - 120]]) addLamp(x, y, x, y, 'white', { style: 'pole', h: 64, r: 220 });
  addShop({ kind: 'batalhao', name: 'Batalhão da PM', x: XS[6] + RT.street.lanes[0], y: gy, bld: b, color: '#59a8ff', region: 'carapina' });
  World.batalhao = { x: (R.x0 + R.x1) / 2, y: gy };
}
function buildSerra() {
  const special = { '1,1': 'praca', '4,2': 'campo', '5,1': 'bloco', '6,0': 'batalhao' };
  for (let c = 0; c < 7; c++) for (let r = 0; r < 4; r++) {
    const R = serraRect(c, r), k = c + ',' + r, roads = serraRoads(c, r);
    const region = c < 3 ? 'feurosa' : 'carapina';
    const sp = special[k];
    if (sp === 'praca') pracaBagunca(R);
    else if (sp === 'campo') soccerBlock(R);
    else if (sp === 'bloco') quadraBloco(R);
    else if (sp === 'batalhao') batalhaoBlock(R);
    else if (k === '2,2') residentialBlock(R, { rich: false, roads, region, special: { side: 'N', w: 150, build: shopLotBuilder({ kind: 'mercado', name: 'Mercadinho do Morro', sign: 'MERCADINHO DO MORRO', color: '#ff7a3d', h: 30, depth: 100, pickup: true, items: ['Feira da semana', 'Gás de cozinha', 'Fardo de refrigerante'] }) } });
    else if (k === '5,2') residentialBlock(R, { rich: false, roads, region, special: { side: 'N', w: 150, build: shopLotBuilder({ kind: 'lanchonete', name: 'Pastelaria Feira Livre', sign: 'PASTEL & CALDO DE CANA', color: '#ff4f8a', h: 30, depth: 96, pickup: true, items: ['Pastel de palmito', 'Caldo de cana', 'Pastel de queijo'], tables: true }) } });
    else if (r === 0 || (c + r) % 3 === 0) residentialBlock(R, { rich: false, roads, region });
    else comunidadeBlock(R);
  }
}
function buildDepots() {
  const dep = (key, c, r, name, sign, color, extra) => {
    const R = cellRect(c, r);
    const bx0 = R.x0 + 26, by0 = R.y1 - 104, bx1 = R.x0 + 170, by1 = R.y1 - 44;
    if (!areaBlocked(bx0, by0, bx1, by1)) addBuilding(bx0, by0, bx1, by1, 24, { style: 'shop', roofType: 'flat', roofColor: '#5a5c60', wall: '#e8e2d0', lit: 0.9, sign, signColor: color, front: 'W' });
    if (extra) extra(R);
    const y = R.y1 - 74;
    World.depots[key] = { x: XS[c] + RT.street.lanes[0], y, name };
    addLight(R.x0 + 10, y, 120, 0.9, color, { shop: true });
  };
  dep('bau', 6, 0, 'Transportadora Leva-e-Traz', 'TRANSPORTADORA', '#ffb547');
  dep('gas', 6, 2, 'Depósito de Gás Chama Azul', 'GÁS CHAMA AZUL', '#59a8ff', (R) => { for (let i = 0; i < 6; i++) addProp('pot', R.x0 + 190 + i * 13, R.y1 - 60, { col: 'circ', cr: 5, R: 10 }); });
  dep('fuel', 6, 3, 'Base de Combustível', 'BASE DE COMBUSTÍVEL', '#ff8a2a', (R) => { for (let i = 0; i < 2; i++) { const t = { kind: 'silo', x: R.x0 + 220 + i * 70, y: R.y1 - 70, r: 26, h: 50 }; if (!areaBlocked(t.x - 26, t.y - 26, t.x + 26, t.y + 26)) { addTall(t, t.x - 30, t.y - 30, t.x + 30, t.y + 30); addCircCol(t.x, t.y, 26, 'bld'); } } });
  // aterro no interior
  decal(6700, 5000, 7300, 5250, 'earth', { z: 1.3 });
  for (let i = 0; i < 9; i++) addProp('mound', 6760 + (i % 5) * 110, 5060 + Math.floor(i / 5) * 90, { R: 50 });
  World.depots.aterro = { x: 7000, y: 5300 - RT.dirt.lanes[0], name: 'Aterro do Fim do Mundo' };
}
function buildRachas() {
  const R = (id, name, rival, rt, bet, pts) => {
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    World.rachas.push({ id, name, rival, bet, start: pts[0], pts: pts.slice(1), all: pts, len, rivalTime: len / rt, a0: Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]), racha: true });
  };
  const hy = HWY_Y + RT.highway.lanes[0], cy = 7500 + RT.avenue.lanes[0], ay = 1500 + RT.avenue.lanes[0];
  R('arrancada', 'Arrancada na BR-101', 'Zé do Canecão', 330, 300, [[1500, hy], [3900, hy]]);
  R('carapina', 'Pega na Avenida Cara-Pintada', 'Juninho Rebaixado', 340, 600, [[400, cy], [4500, cy]]);
  R('centrao', 'Racha do Centrão', 'Bia Turbo', 260, 1000, [[400, ay], [2100 - 25, ay], [2100 - 25, 3880 - 25], [400 + 25, 3880 - 25]]);
}
function buildActivitiesData() {
  markReflections();
  buildDepots();
  buildRachas();
  buildCapixaba();
  buildFesta();
  const P = (id, name, x, y, desc) => World.pois.push({ id, name, x, y, r: 170, desc });
  P('praca', 'Praça da Matriz', 1756, 1260, 'O coração do Centrão, com a fonte, a igreja e o pipoqueiro.');
  P('campo', 'Campo do Várzea F.C.', 575, 3570, 'Onde o futebol de domingo vira lenda.');
  P('ponte', 'Ponte Que Balança', riverCX(3880), 3880, 'Ponte de madeira centenária sobre o Rio Jururu.');
  P('mirante', 'Mirante do Jucu', World.mirante.x, World.mirante.y, 'A melhor vista do rio à noite.');
  P('fazenda', 'Fazenda Muuuito Longe', 8075, 4380, 'Casarão antigo cercado de palmeiras.');
  P('sitio', 'Sítio Bota Fé', 7970, 1050, 'Galinhas, horta e café passado na hora.');
  P('estrela', 'Posto Estrela Cadente', 1730, 5990, 'Parada obrigatória de caminhoneiros.');
  P('cafezal', 'Cafezal do Conilon', 8100, 2420, 'Fileiras de café até onde a vista alcança.');
  P('acude', 'Açude dos Sapos', 6900, 4590, 'Água parada, sapos e capivaras.');
  P('caixa', "Caixa d'Água", 3650, 2520, 'O ponto mais alto da cidade.');
  P('orla', 'Orla do Rio', 4720, 4300, 'Calçadão de pedras portuguesas à beira-rio.');
  P('milharal', 'Milharal do Espantalho', 6900, 900, 'Um espantalho vigia o milho no escuro.');
  P('escola', 'Escola Estadual', 2420, 4900, 'A quadra iluminada da escola do bairro.');
  P('convento', 'Convento da Pinha', 8100, 600, 'Lá do alto dá pra ver São Gambiarra inteira. Romaria em abril.');
  P('ponte3', 'Terceira Ponte e Meia', riverCX(1500), 1500, 'Concreto, vento forte e vista do Rio Jururu.');
  P('paneleiras', 'Galpão das Paneleiras', 4830, 3275, 'Panelas de barro feitas à mão, do jeitinho capixaba.');
  P('feira', 'Feira da Roça', 860, 5830, 'Pastel, caldo de cana e banana a preço de domingo.');
  P('orlacamburi', 'Orla de Camburiso', 6900, 8900, 'Calçadão de pedra portuguesa, quiosque aberto e o barulho do mar a noite inteira.');
  P('barra', 'Barra do Jururuzinho', riverCX(8800), 8780, 'Onde o Rio Jururu encontra o mar. Os pescadores juram que o peixe era deste tamanho.');
  P('pedra', 'Pedra da Cebolinha', World.pedra.x, World.pedra.y + 170, 'Pedra de granito no meio do parque. Dizem que é parente da Pedra da Cebola.');
  P('feirarolo', 'Feira do Rolo da Madrugada', World.feiraRolo.x, World.feiraRolo.y, 'Tem de tudo e mais um pouco. Não pergunte de onde veio.');
  P('porto', 'Porto do Tubarão Banguela', World.porto.x, World.porto.y, 'Contêiner para todo lado e o navio Vitorinha Star atracado no píer.');
  P('batalhao', 'Batalhão da PM', World.batalhao.x, World.batalhao.y, 'Viaturas na garagem e plantão a noite inteira.');
  P('bagunca', 'Praça da Bagunça', World.pracaBagunca.x, World.pracaBagunca.y, 'Pagode de domingo, espetinho e pelada na quadra até tarde.');
  P('campao', 'Campão da Cara-Pintada', (serraRect(4, 2).x0 + serraRect(4, 2).x1) / 2, (serraRect(4, 2).y0 + serraRect(4, 2).y1) / 2, 'O terrão onde nasce craque toda semana.');
  P('bloco', 'Quadra da Unidos da Gambiarra', (serraRect(5, 1).x0 + serraRect(5, 1).x1) / 2, serraRect(5, 1).y0 + 200, 'Ensaio da escola de samba às sextas.');
  P('rodeio', 'Churrascaria Boi na Brasa', 2840, 5900, 'Picanha na brasa até de madrugada.');
  const R = (id, name, desc, pts) => {
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    World.races.push({ id, name, desc, start: pts[0], pts: pts.slice(1), len, gold: len / 270, silver: len / 220, bronze: len / 170, a0: Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) });
  };
  R('centro', 'Volta no Centrão', 'Ruas apertadas, semáforos e esquinas do Centro.', [[1720, 2080 + 19], [2700, 2099], [2719, 880], [850, 861], [831, 2080], [1450, 2099], [2081, 2099]]);
  R('fazenda', 'Rali da Vaca Atolada', 'Terra, poeira e curvas entre o cafezal e a fazenda.', [[6319, 2300], [6319, 3880], [7500, 3895], [7515, 1500], [8700, 1519], [8719, 3880], [8719, 4900]]);
  R('rodovia', 'Corujão na BR-101', 'Reta longa, caminhões e a ponte sobre o Rio Jururu.', [[700, 6200 + 21], [2100, 6221], [4600, 6221], [6300, 6221], [8681, 6221], [8681, 4600]]);
}

/* ---------- superfícies de rua (raster físico + itens de bake) ---------- */
function buildRoadSurface() {
  for (const e of World.edges) {
    const T = e.T;
    const box = edgeBox(e, 0);
    if (T.sw) gFill(box[0], box[1], box[2], box[3], SF.SIDEWALK);
    const inner = e.h ? [e.a.x - 2, e.a.y - e.hw, e.b.x + 2, e.a.y + e.hw] : [e.a.x - e.hw, e.a.y - 2, e.a.x + e.hw, e.b.y + 2];
    if (T.shoulder) {
      const s = T.shoulder;
      if (e.h) gFill(e.a.x, e.a.y - e.hw - s, e.b.x, e.a.y + e.hw + s, SF.EARTH); else gFill(e.a.x - e.hw - s, e.a.y, e.a.x + e.hw + s, e.b.y, SF.EARTH);
    }
    gFill(inner[0], inner[1], inner[2], inner[3], T.asphalt ? SF.ROAD : SF.DIRT);
    if (e.bridge) {
      const b = e.bridge;
      const band = e.hw + (T.sw || 0) + (T.shoulder || 0) + 10;
      for (let gy = Math.floor((e.a.y - band) / GC); gy <= Math.floor((e.a.y + band) / GC); gy++) {
        const yy = gy * GC + 5, rc = riverCX(yy), rh = riverHW(yy);
        for (let gx = Math.floor(b.x0 / GC); gx <= Math.floor(b.x1 / GC); gx++) {
          const xx = gx * GC + 5;
          if (Math.abs(xx - rc) >= rh) continue;
          ground[gy * GW + gx] = Math.abs(yy - e.a.y) < e.hw ? SF.BRIDGE : SF.WATER;
        }
      }
      addRectCol(b.x0, e.a.y - e.hw - 7, b.x1, e.a.y - e.hw - 1, 'rail');
      addRectCol(b.x0, e.a.y + e.hw + 1, b.x1, e.a.y + e.hw + 7, 'rail');
    }
    bake(box[0] - 8, box[1] - 8, box[2] + 8, box[3] + 8, 3, (g) => drawEdgeBase(g, e));
    bake(box[0], box[1], box[2], box[3], 5, (g) => drawEdgeMarkings(g, e));
    if (e.bridge) bake(e.bridge.x0 - 10, box[1] - 30, e.bridge.x1 + 10, box[3] + 40, 5.2, (g) => drawBridge(g, e));
  }
  for (const n of World.nodes) {
    let hv = 0, hh = 0, sw = 0, asph = false;
    for (const e of n.edges) { if (e.h) hh = Math.max(hh, e.hw); else hv = Math.max(hv, e.hw); sw = Math.max(sw, e.T.sw || 0); if (e.T.asphalt) asph = true; }
    if (!hv) hv = hh; if (!hh) hh = hv;
    n.hx = hv; n.hy = hh;
    gFill(n.x - hv, n.y - hh, n.x + hv, n.y + hh, asph ? SF.ROAD : SF.DIRT);
    bake(n.x - hv - sw - 6, n.y - hh - sw - 6, n.x + hv + sw + 6, n.y + hh + sw + 6, 4, (g) => drawNode(g, n, asph));
  }
}

/* ============================ LITORAL: BARRA DO JURURUZINHO, CAMBURISO, PORTO DO TUBARÃO BANGUELA E A ORLA ============================ */
const LIT_X = [4600, 6300, 7500, 8700], LIT_Y = [6200, 7500, 8100, 8700];
const SEA_Y = 8960, SAND_Y = 8850, CALC_Y = 8816;
// a praia fica só do lado da cidade grande (Barra, Camburiso e Porto); embaixo da Serra é mata até o mar
const ORLA_X0 = 4660;
function litHW(t) { return RT[t].w / 2 + (RT[t].sw || 0); }
function litRect(c, r) {
  const hv = (x) => (x === 8700 ? RT.road.w / 2 + 14 : RT.street.w / 2 + 22);
  const hh = (y) => (y === 6200 ? RT.highway.w / 2 + 14 + 8 : y === 7500 || y === 8700 ? RT.avenue.w / 2 + 22 : RT.street.w / 2 + 22);
  return { x0: LIT_X[c] + hv(LIT_X[c]), x1: LIT_X[c + 1] - hv(LIT_X[c + 1]), y0: LIT_Y[r] + hh(LIT_Y[r]), y1: LIT_Y[r + 1] - hh(LIT_Y[r + 1]) };
}
function litRoads(c, r) {
  const nm = (y) => (ROADS.find((q) => q.h && q.y === y && q.x2 > 4700) || {}).name;
  const nv = (x) => (ROADS.find((q) => !q.h && q.x === x && q.y2 >= 8700) || ROADS.find((q) => !q.h && q.x === x) || {}).name;
  const hwH = (y) => (y === 6200 ? RT.highway.w / 2 : y === 7500 || y === 8700 ? RT.avenue.w / 2 : RT.street.w / 2);
  const hwV = (x) => (x === 8700 ? RT.road.w / 2 : RT.street.w / 2);
  const mk = (name, hw) => ({ name, hw, lane: hw > 60 ? RT.avenue.lanes[1] : RT.street.lanes[0] });
  return { N: mk(nm(LIT_Y[r]), hwH(LIT_Y[r])), S: mk(nm(LIT_Y[r + 1]), hwH(LIT_Y[r + 1])), W: mk(nv(LIT_X[c]), hwV(LIT_X[c])), E: mk(nv(LIT_X[c + 1]), hwV(LIT_X[c + 1])) };
}
// pedra (Pedra da Cebolinha): morro de granito em camadas
function addRock(x, y, r, h) { const o = { kind: 'rock', x, y, r, h, seed: rnd() }; addTall(o, x - r - 40, y - r - 40, x + r + 40, y + r + 40); addCircCol(x, y, r * 0.92, 'bld'); return o; }
// guindaste do porto
function addCrane(x, y, len, ang) { const o = { kind: 'crane', x, y, len, a: ang, h: 120, seed: rnd() }; addTall(o, x - len - 60, y - len - 60, x + len + 60, y + len + 60); for (const [dx, dy] of [[-16, -16], [16, -16], [-16, 16], [16, 16]]) addCircCol(x + dx, y + dy, 3, 'pole'); return o; }
function buildLitoral() {
  // ---- Barra do Jururuzinho: vila de pescadores dos dois lados do rio ----
  for (let r = 0; r < 3; r++) {
    const R = litRect(0, r), roads = litRoads(0, r);
    let wl = 1e9, er = -1e9;
    for (let y = R.y0; y <= R.y1; y += 20) { wl = Math.min(wl, riverCX(y) - riverHW(y) - 60); er = Math.max(er, riverCX(y) + riverHW(y) + 60); }
    const W = { x0: R.x0, x1: wl, y0: R.y0, y1: R.y1 }, E = { x0: er, x1: R.x1, y0: R.y0, y1: R.y1 };
    if (W.x1 - W.x0 > 160) residentialBlock(W, { rich: false, roads, region: 'barra', sides: ['N', 'S', 'W'] });
    if (E.x1 - E.x0 > 160) {
      if (r === 2) residentialBlock(E, { rich: false, roads, region: 'barra', sides: ['N', 'S', 'E'], special: { side: 'S', w: 170, build: shopLotBuilder({ kind: 'bar', name: 'Bar do Pescador Mentiroso', sign: 'PESCADOR MENTIROSO', color: '#59e0ff', h: 26, depth: 90, pickup: true, items: ['Moqueca pra viagem', 'Isca viva', 'Caldo de sururu'], tables: true }) } });
      else residentialBlock(E, { rich: false, roads, region: 'barra', sides: ['N', 'S', 'E'] });
    }
    // barcos de pesca na margem
    for (let k = 0; k < 3; k++) { const y = R.y0 + 60 + k * ((R.y1 - R.y0 - 120) / 2), x = riverCX(y) - riverHW(y) - 18; bake(x - 30, y - 12, x + 10, y + 12, 3.5, (g) => drawBoat(g, x - 10, y, 0.2 + k * 0.3, ['#2a6fd1', '#e8402a', '#2bb24c'][k])); }
  }
  // ---- Pedra da Cebolinha (parque) ----
  { const R = litRect(1, 0); decal(R.x0, R.y0, R.x1, R.y1, 'lawn2'); const cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2;
    decal(cx - 20, R.y0, cx + 20, R.y1, 'plaza'); decal(R.x0, cy - 18, R.x1, cy + 18, 'plaza');
    addRock(cx - 230, cy - 230, 150, 120); addRock(cx + 210, cy - 250, 95, 70); addRock(cx + 230, cy + 230, 70, 50); addRock(cx - 210, cy + 240, 60, 40);
    scatterTrees(R.x0 + 30, R.y0 + 30, R.x1 - 30, R.y1 - 30, 30, ['round', 'mango', 'ipeY', 'ipeP', 'palm']);
    for (let i = 0; i < 6; i++) { const y = R.y0 + 80 + i * ((R.y1 - R.y0 - 160) / 5); addLamp(cx + 34, y, cx + 34, y, 'warm', { style: 'globe', h: 30, r: 110, i: 0.75 }); if (i % 2) addProp('bench', cx - 34, y, { a: Math.PI / 2, col: 'rect', w: 8, h: 26 }); }
    World.animalsDef.push({ type: 'person', n: 6, rect: [cx - 14, R.y0 + 40, cx + 14, R.y1 - 40] });
    World.pedra = { x: cx - 230, y: cy - 230 };
  }
  // ---- Feira do Rolo da Madrugada ----
  { const R = litRect(1, 1); decal(R.x0, R.y0, R.x1, R.y1, 'urban');
    const cols = ['#e63946', '#2a9d8f', '#f4c430', '#3a86ff', '#ff7f11', '#8338ec'];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
      const x = R.x0 + 60 + i * ((R.x1 - R.x0 - 120) / 8), y = R.y0 + 70 + row * ((R.y1 - R.y0 - 140) / 2), c = cols[(i + row * 2) % cols.length];
      bake(x - 24, y - 20, x + 26, y + 22, 6, (g) => drawStall(g, x, y, c, (i * 7 + row) % 4));
      addRectCol(x - 20, y - 15, x + 20, y + 15, 'prop');
      if (i % 3 === 1) addLight(x, y + 26, 90, 0.85, row % 2 ? 'warm' : 'white', { shop: true });
    }
    World.animalsDef.push({ type: 'person', n: 18, rect: [R.x0 + 20, R.y0 + 100, R.x1 - 20, R.y1 - 100], look: { dance: false } });
    World.feiraRolo = { x: (R.x0 + R.x1) / 2, y: (R.y0 + R.y1) / 2 };
    addShop({ kind: 'mercado', name: 'Feira do Rolo da Madrugada', x: (R.x0 + R.x1) / 2, y: 7500 + RT.avenue.lanes[1], color: '#ffd23f', region: 'camburi', pickup: true, items: ['Caixa de laranja-lima', 'Saco de aipim', 'Rolo de fio de cobre (será?)', 'Engradado de banana'] });
  }
  // ---- Prédios de frente para o mar (Jardim Camburiso) ----
  downtownBlock(litRect(1, 2), { roads: litRoads(1, 2), region: 'camburi', cols: 2, rows: 2, noLots: true, shops: [null, { kind: 'mercado', name: 'Supermercado Preço Bão', sign: 'PREÇO BÃO', color: '#ff4d4d', h: 34, pickup: true, items: ['Compras do mês', 'Fardo de água', 'Carvão e cerveja'] }] });
  // ---- Porto do Tubarão Banguela: pátio de contêineres ----
  for (let r = 0; r < 2; r++) {
    const R = litRect(2, r); decal(R.x0, R.y0, R.x1, R.y1, 'concrete');
    const cc = ['#c0392b', '#2e86de', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#d35400', '#7f8c8d'];
    for (let x = R.x0 + 40; x < R.x1 - 60; x += 64) for (let y = R.y0 + 40; y < R.y1 - 140; y += 150) {
      if (chance(0.15)) continue;
      const c = pick(cc), h = pick([14, 14, 28, 28, 42]);
      addBuilding(x, y, x + 34, y + 120, h, { style: 'container', roofType: 'container', roofColor: c, wall: c, lit: 0, noShadow: h < 20 });
    }
    addLight((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, 320, 0.7, 'white', { flood: true });
    if (r === 1) addCrane(R.x1 - 70, R.y1 - 80, 90, Math.PI / 2);
  }
  // ---- terminal do porto ----
  { const R = litRect(2, 2); decal(R.x0, R.y0, R.x1, R.y1, 'concrete');
    const b = addBuilding(R.x0 + 30, R.y0 + 30, R.x1 - 30, R.y0 + 200, 46, { style: 'warehouse', roofType: 'corrugated', roofColor: '#7d8a96', wall: '#c9d0d6', lit: 0.5, sign: 'PORTO DO TUBARÃO BANGUELA', signColor: '#59e0ff', front: 'S' });
    for (let i = 0; i < 5; i++) addParkedCar(R.x0 + 60 + i * 80, R.y1 - 70, Math.PI / 2, pick(['truck', 'bau', 'tanker']), '#e8e8e8');
    addShop({ kind: 'porto', name: 'Porto do Tubarão Banguela', x: (R.x0 + R.x1) / 2, y: 8700 - RT.avenue.lanes[1], bld: b, color: '#59e0ff', region: 'porto', pickup: true, items: ['Contêiner de café capixaba', 'Pelotas de minério', 'Bloco de granito', 'Caixas de chocolate de Vianinha'] });
    World.porto = { x: (R.x0 + R.x1) / 2, y: (R.y0 + R.y1) / 2 };
  }
  // ---- a orla: calçadão, areia e mar, só do lado da cidade grande ----
  // calçadão e areia dos dois lados da foz do rio (o rio continua desaguando no mar)
  const rL = riverCX(8880) - riverHW(8880) - 30, rR = riverCX(8880) + riverHW(8880) + 30;
  decal(ORLA_X0 - 60, SAND_Y - 20, ORLA_X0 + 40, SEA_Y + 20, 'sand');
  for (const [a, b] of [[ORLA_X0, rL], [rR, 8790]]) { decal(a, CALC_Y, b, SAND_Y, 'plaza'); decal(a, SAND_Y, b, SEA_Y + 20, 'sand'); }
  gFill(0, SEA_Y, WORLD_W, WORLD_H, SF.WATER);
  for (let x = 0; x < WORLD_W; x += 512) bake(x, SEA_Y - 30, x + 512, WORLD_H, 2, (g) => drawSea(g, x, x + 512));
  // píer do porto e o navio atracado
  decal(7800, SAND_Y, 8160, 9140, 'concrete', { z: 2.2 }); gFill(7800, SAND_Y, 8160, 9140, SF.PAVED);
  bake(7800, SEA_Y, 8160, 9150, 2.5, (g) => { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; for (let y = SEA_Y; y < 9140; y += 14) { g.beginPath(); g.moveTo(7800, y); g.lineTo(8160, y); g.stroke(); } g.fillStyle = '#e0b83a'; g.fillRect(7800, 9130, 360, 6); });
  bake(8180, 8990, 8790, 9180, 3, (g) => drawShip(g, 8190, 8995, 590, 170));
  addRectCol(8190, 8995, 8780, 9165, 'bld');
  addCrane(8130, 9020, 140, Math.PI * 0.5); addCrane(7830, 9020, 140, Math.PI * 0.5);
  // a orla antiga ia de ponta a ponta: repete os sorteios dela para o resto do mapa (postes, árvores das
  // ruas, orelhões...) continuar exatamente no mesmo lugar; a orla nova usa um sorteio só dela
  orlaSorteioAntigo();
  const RG = RNG; RNG = mulberry32(8830);
  // embaixo da Serra (Feio Rosa, Cara-Pintada, Nova Prosa e Flexão): mata fechada descendo até o mar
  forest(230, 8760, ORLA_X0, SEA_Y - 4);
  for (const [x, y, r, h] of [[ORLA_X0 + 30, SAND_Y + 40, 46, 30], [ORLA_X0 + 2, SEA_Y - 8, 34, 20], [ORLA_X0 + 80, SEA_Y + 6, 22, 12]]) addRock(x, y, r, h); // pedras onde a praia começa
  // postes, coqueiros e quiosques na beira-mar
  for (let x = ORLA_X0 + 110; x < 8700; x += 230) {
    if (Math.abs(x - riverCX(8830)) < 220 || (x > 7760 && x < 8200)) continue;
    addLamp(x, CALC_Y + 10, x, CALC_Y + 10, 'white', { style: 'globe', h: 32, r: 120, i: 0.75 });
    if (chance(0.8)) addTree(x + 70 + rnd(-20, 20), SAND_Y + rnd(20, 70), 'palm', rnd(0.9, 1.25));
  }
  const KIOSKS = [['SIRI NA LATA', '#ff6b4a', 'Quiosque Siri na Lata'], ['ÁGUA DE COCO', '#3cff8f', 'Quiosque Água de Coco Gelada'], ['SOL E MOQUECA', '#ffd23f', 'Quiosque Sol e Moqueca'], ['CAMARÃO QUE DORME', '#ff9ed2', 'Quiosque Camarão que Dorme'], ['DO CAPIXABA', '#59e0ff', 'Quiosque do Capixaba'], ['PASTEL DE ARRAIA', '#ffb547', 'Quiosque Pastel de Arraia'], ['CHOPP DA MARÉ', '#f4f1e0', 'Quiosque Chopp da Maré']];
  let ki = 0;
  for (let x = ORLA_X0 + 290; x < 7600; x += 900) {
    if (Math.abs(x - riverCX(8900)) < 300) continue;
    const [name, col, full] = KIOSKS[ki++ % KIOSKS.length], y0 = SAND_Y + 8;
    const b = addBuilding(x - 32, y0, x + 32, y0 + 50, 22, { style: 'kiosk', roofType: 'hip', roofColor: '#7a5230', wall: '#c9a06a', lit: 0.95, sign: name, signColor: col, front: 'N' });
    for (const dx of [-50, 50]) addProp('table', x + dx, y0 + 22, { col: 'circ', cr: 5, c: '#f4c430', R: 12 });
    addLight(x, y0 - 6, 110, 0.9, col, { shop: true });
    const yRoad = x < 4600 ? 8700 + RT.street.lanes[0] : 8700 + RT.avenue.lanes[1];
    addShop({ kind: 'bar', name: full, x, y: yRoad, bld: b, color: col, region: 'orla', pickup: true, items: ['Porção de camarão', 'Água de coco', 'Moqueca na panela de barro', 'Isopor de gelo'] });
  }
  RNG = RG;
  // posto de salva-vidas, rede de vôlei e barcos na areia
  for (const x of [6600]) { addBuilding(x - 14, SAND_Y + 40, x + 14, SAND_Y + 68, 30, { style: 'kiosk', roofType: 'flat', roofColor: '#d62828', wall: '#f2f2ea', lit: 0.6, sign: 'SALVA-VIDAS', signColor: '#ff4d4d' }); }
  for (const x of [5000, 7000]) bake(x - 50, SAND_Y + 30, x + 50, SAND_Y + 90, 6, (g) => drawNet(g, x, SAND_Y + 60));
  for (const [x, c] of [[riverCX(8900) - 260, '#2a6fd1'], [riverCX(8900) + 240, '#e8402a'], [riverCX(8900) + 300, '#f4c430']]) bake(x - 30, SAND_Y + 40, x + 30, SAND_Y + 100, 6, (g) => drawBoat(g, x, SAND_Y + 70, 1.4, c));
  // gente no calçadão e na areia, dos dois lados da foz (ninguém anda dentro do rio)
  for (const [a, b] of [[ORLA_X0 + 60, rL - 20], [rR + 20, 7600]]) {
    const k = (b - a) / 7100;
    World.animalsDef.push({ type: 'person', n: Math.round(22 * k), rect: [a, CALC_Y + 6, b, SAND_Y - 6] });
    World.animalsDef.push({ type: 'person', n: Math.round(10 * k), rect: [a, SAND_Y + 20, b, SEA_Y - 30] });
    World.animalsDef.push({ type: 'dog', n: Math.max(1, Math.round(3 * k)), rect: [a + 200, SAND_Y + 20, b - 200, SEA_Y - 30] });
  }
}
// sorteios que a orla antiga (de ponta a ponta) fazia, na mesma ordem, sem construir nada
function orlaSorteioAntigo() {
  for (let x = 400; x < 8700; x += 230) {
    if (Math.abs(x - riverCX(8830)) < 220 || (x > 7760 && x < 8200)) continue;
    rnd(); // luz do poste
    if (chance(0.8)) { // coqueiro (só sorteava a variação se cabia no lugar)
      const px = x + 70 + rnd(-20, 20), py = SAND_Y + rnd(20, 70); rnd(0.9, 1.25);
      const gt = groundAt(px, py);
      if (!(gt === SF.ROAD || gt === SF.DIRT || gt === SF.WATER || gt === SF.BRIDGE || gt === SF.SIDEWALK) && !areaBlocked(px - 6, py - 6, px + 6, py + 6)) rndi(0, 2);
    }
  }
  for (let x = 650; x < 7600; x += 980) { if (Math.abs(x - riverCX(8900)) < 300) continue; rnd(); rnd(); rnd(); } // quiosques: 2 mesas e a luz
}
// desenhos do litoral (assados no chão)
function drawSea(g, x0, x1) {
  const gr = g.createLinearGradient(0, SEA_Y, 0, WORLD_H); gr.addColorStop(0, '#2c6c8e'); gr.addColorStop(0.3, '#1d4d6e'); gr.addColorStop(1, '#0f2c46');
  g.fillStyle = gr; g.fillRect(x0, SEA_Y, x1 - x0, WORLD_H - SEA_Y);
  // espuma da onda na beira e cristas
  g.fillStyle = 'rgba(235,245,250,0.75)';
  g.beginPath(); g.moveTo(x0, SEA_Y); for (let x = x0; x <= x1; x += 12) g.lineTo(x, SEA_Y + 4 + Math.sin(x * 0.02) * 4 + Math.sin(x * 0.053) * 2); g.lineTo(x1, SEA_Y - 6); g.lineTo(x0, SEA_Y - 6); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(220,235,245,0.35)'; g.lineWidth = 1.4;
  for (let y = SEA_Y + 24; y < WORLD_H; y += 22) { g.beginPath(); for (let x = x0; x <= x1; x += 10) { const yy = y + Math.sin(x * 0.015 + y) * 4; if (x === x0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.globalAlpha = Math.max(0.15, 1 - (y - SEA_Y) / 260); g.stroke(); }
  g.globalAlpha = 1;
}
function drawBoat(g, x, y, a, col) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(3, 4, 22, 8, 0, 0, TAU); g.fill();
  g.fillStyle = col; g.beginPath(); g.moveTo(-22, -7); g.lineTo(14, -7); g.quadraticCurveTo(26, 0, 14, 7); g.lineTo(-22, 7); g.closePath(); g.fill();
  g.fillStyle = '#f2efe6'; g.fillRect(-18, -4.5, 26, 9); g.fillStyle = '#7a5230'; g.fillRect(-10, -4.5, 3, 9); g.fillRect(2, -4.5, 3, 9);
  g.restore();
}
function drawStall(g, x, y, col, v) {
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x - 18, y - 12, 44, 32);
  for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#f2efe6' : col; g.fillRect(x - 21 + i * 8.4, y - 16, 8.4, 30); }
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.strokeRect(x - 21, y - 16, 42, 30);
  const fr = [['#ff8a2a', '#f4c430', '#2bb24c'], ['#e63946', '#ff9ed2', '#c8302a'], ['#f4c430', '#7bd389', '#a0522d'], ['#8a5a3a', '#d8c08a', '#f2efe6']][v];
  for (let k = 0; k < 6; k++) { g.fillStyle = '#8a6440'; g.fillRect(x - 18 + (k % 3) * 13, y + 16 + Math.floor(k / 3) * 7, 11, 6); g.fillStyle = fr[k % 3]; for (let j = 0; j < 3; j++) g.fillRect(x - 17 + (k % 3) * 13 + j * 3.5, y + 17 + Math.floor(k / 3) * 7, 2.6, 2.6); }
}
function drawNet(g, x, y) {
  g.fillStyle = '#d8d0c0'; g.fillRect(x - 42, y - 1, 84, 2);
  g.strokeStyle = 'rgba(240,240,235,0.6)'; g.lineWidth = 0.6; for (let i = -40; i <= 40; i += 4) { g.beginPath(); g.moveTo(x + i, y - 2); g.lineTo(x + i, y + 2); g.stroke(); }
  g.fillStyle = '#5a5a5e'; g.fillRect(x - 44, y - 3, 3, 6); g.fillRect(x + 41, y - 3, 3, 6);
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; g.strokeRect(x - 40, y - 22, 80, 44);
}
function drawShip(g, x, y, w, h) {
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.moveTo(x + 10, y + 14); g.lineTo(x + w - 50, y + 14); g.quadraticCurveTo(x + w + 6, y + h / 2 + 10, x + w - 50, y + h + 6); g.lineTo(x + 10, y + h + 6); g.closePath(); g.fill();
  g.fillStyle = '#7a1f1f'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w - 60, y); g.quadraticCurveTo(x + w, y + h / 2, x + w - 60, y + h); g.lineTo(x, y + h); g.closePath(); g.fill();
  g.fillStyle = '#2a3440'; g.fillRect(x + 6, y + 8, w - 80, h - 16);
  const cc = ['#c0392b', '#2e86de', '#27ae60', '#f39c12', '#8e44ad', '#7f8c8d', '#16a085'];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) { g.fillStyle = cc[(i * 3 + j * 5) % cc.length]; g.fillRect(x + 70 + i * 36, y + 14 + j * 36, 32, 32); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x + 70 + i * 36, y + 14 + j * 36 + 28, 32, 4); }
  g.fillStyle = '#f2f2ea'; g.fillRect(x + 12, y + 20, 46, h - 40); g.fillStyle = '#1d4f9c'; g.fillRect(x + 18, y + 26, 34, 10);
  g.fillStyle = 'rgba(255,255,255,0.8)'; g.font = 'bold 14px sans-serif'; g.save(); g.translate(x + w - 70, y + h / 2); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.fillText('VITORINHA STAR', 0, 0); g.restore();
}

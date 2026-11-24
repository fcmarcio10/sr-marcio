/* A casa vista de cima, com a câmera seguindo o personagem.
   Piso desenhado uma vez; paredes, móveis e árvores em blocos que "sobem" em direção à câmera (perspectiva),
   portas que abrem quando você chega perto, sol pelas janelas de dia, lâmpadas à noite,
   e o personagem visto de cima, andando livre (WASD/setas, Shift corre) ou pelo clique. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const H = SL.HomeScene = {};
  const T = 32;        // lado de uma casa da planta (unidades do mundo)
  const WALLZ = 58;    // altura das paredes
  const CAMZ = 440;    // altura da câmera: quanto menor, mais as coisas sobem na tela
  const rr = (c, x, y, w, h, r) => SL.Avatar.rr(c, x, y, w, h, r);

  // plantas: cômodos, portas, saída, objetos (x, y, w, h e casa onde a pessoa fica para usar)
  const LAY = {
    A: {
      w: 22, h: 13,
      rooms: [{ id: 'quarto', name: 'Quarto', x: 1, y: 1, w: 7, h: 5, floor: 'wood' }, { id: 'escritorio', name: 'Escritório', x: 9, y: 1, w: 6, h: 5, floor: 'wood2' }, { id: 'banheiro', name: 'Banheiro', x: 16, y: 1, w: 5, h: 5, floor: 'tile' }, { id: 'sala', name: 'Sala', x: 1, y: 7, w: 11, h: 5, floor: 'wood' }, { id: 'cozinha', name: 'Cozinha', x: 13, y: 7, w: 8, h: 5, floor: 'tile2' }],
      doors: [[4, 6], [10, 6], [18, 6], [12, 9], [8, 3]], entry: [6, 12],
      objs: { cama: [1, 1, 3, 2, 2, 3], mesa: [10, 1, 4, 1, 11, 2], luz: [14, 1, 1, 1], bike: [14, 4, 1, 1, 13, 4], chuveiro: [19, 1, 2, 2, 19, 3], vaso: [16, 1, 1, 1], pia_b: [16, 4, 1, 1, 17, 4], geladeira: [20, 7, 1, 1, 20, 8], fogao: [16, 7, 2, 1, 16, 8], pia: [14, 7, 2, 1, 14, 8], cafeteira: [13, 7, 1, 1, 13, 8], sofa: [5, 10, 4, 1, 6, 9], tv: [6, 7, 2, 1, 6, 9], armario: [20, 10, 1, 2, 19, 11], porta: [6, 12, 1, 1, 6, 11], guarda: [6, 1, 2, 1], mesa_jantar: [15, 10, 2, 1, 15, 9] },
      decoWall: [[2, 'quarto'], [12, 'escritorio'], [3, 'sala'], [9, 'sala'], [5, 'quarto']], decoFloor: [[7, 5], [1, 11], [11, 11], [13, 11], [9, 5], [1, 5]], windows: [[3, 0], [17, 0], [8, 6, 'x'], [2, 6, 'x']], start: [5, 4],
    },
    B: {
      w: 28, h: 15,
      rooms: [{ id: 'quarto', name: 'Quarto', x: 1, y: 1, w: 9, h: 6, floor: 'wood' }, { id: 'escritorio', name: 'Escritório', x: 11, y: 1, w: 8, h: 6, floor: 'wood2' }, { id: 'banheiro', name: 'Banheiro', x: 20, y: 1, w: 7, h: 5, floor: 'tile' }, { id: 'sala', name: 'Sala', x: 1, y: 8, w: 14, h: 6, floor: 'wood' }, { id: 'cozinha', name: 'Cozinha', x: 16, y: 7, w: 11, h: 7, floor: 'tile2' }],
      doors: [[5, 7], [13, 7], [23, 6], [15, 10], [10, 3], [14, 7]], entry: [8, 14],
      objs: { cama: [1, 1, 3, 2, 2, 3], mesa: [12, 1, 5, 1, 14, 2], luz: [18, 1, 1, 1], bike: [17, 5, 1, 1, 16, 5], chuveiro: [24, 1, 2, 2, 24, 3], vaso: [20, 1, 1, 1], pia_b: [20, 4, 1, 1, 21, 4], geladeira: [26, 7, 1, 1, 26, 8], fogao: [20, 7, 2, 1, 20, 8], pia: [18, 7, 2, 1, 18, 8], cafeteira: [17, 7, 1, 1, 17, 8], sofa: [5, 12, 5, 1, 7, 11], tv: [6, 8, 3, 1, 7, 11], armario: [26, 12, 1, 2, 25, 13], porta: [8, 14, 1, 1, 8, 13], guarda: [7, 1, 2, 1], mesa_jantar: [20, 11, 3, 1, 20, 10] },
      decoWall: [[3, 'quarto'], [15, 'escritorio'], [3, 'sala'], [11, 'sala'], [6, 'quarto'], [17, 'escritorio'], [18, 'cozinha']], decoFloor: [[9, 6], [1, 13], [13, 13], [16, 13], [11, 6], [1, 6], [10, 9], [26, 10], [18, 6], [3, 13]], windows: [[4, 0], [21, 0], [12, 0, 'x'], [10, 7, 'x'], [3, 7, 'x']], start: [6, 4],
    },
    C: {
      w: 34, h: 17,
      rooms: [{ id: 'quarto', name: 'Quarto', x: 1, y: 1, w: 9, h: 7, floor: 'wood' }, { id: 'escritorio', name: 'Escritório', x: 11, y: 1, w: 8, h: 7, floor: 'wood2' }, { id: 'estudio', name: 'Estúdio', x: 20, y: 1, w: 13, h: 7, floor: 'studio' }, { id: 'banheiro', name: 'Banheiro', x: 1, y: 9, w: 6, h: 7, floor: 'tile' }, { id: 'sala', name: 'Sala', x: 8, y: 9, w: 13, h: 7, floor: 'wood' }, { id: 'cozinha', name: 'Cozinha', x: 22, y: 9, w: 11, h: 7, floor: 'tile2' }],
      doors: [[10, 4], [19, 4], [5, 8], [14, 8], [26, 8], [7, 12], [21, 12]], entry: [14, 16],
      objs: { cama: [1, 1, 3, 2, 2, 3], mesa: [12, 1, 5, 1, 14, 2], luz: [18, 1, 1, 1], bike: [11, 6, 1, 1, 12, 6], chuveiro: [3, 9, 2, 2, 3, 11], vaso: [1, 9, 1, 1], pia_b: [1, 13, 1, 1, 2, 13], geladeira: [32, 9, 1, 1, 32, 10], fogao: [28, 9, 2, 1, 28, 10], pia: [23, 9, 2, 1, 23, 10], cafeteira: [22, 9, 1, 1, 22, 10], sofa: [14, 14, 5, 1, 16, 13], tv: [15, 9, 3, 1, 16, 13], armario: [32, 14, 1, 2, 31, 15], porta: [14, 16, 1, 1, 14, 15], guarda: [7, 1, 2, 1], mesa_jantar: [26, 13, 3, 1, 26, 12], estudio: [22, 2, 9, 4, 26, 6] },
      decoWall: [[3, 'quarto'], [15, 'escritorio'], [10, 'sala'], [17, 'sala'], [6, 'quarto'], [24, 'estudio'], [29, 'estudio'], [25, 'cozinha']], decoFloor: [[9, 7], [8, 15], [20, 15], [22, 15], [18, 7], [1, 7], [9, 10], [32, 12], [6, 15], [1, 15], [20, 10], [11, 10], [19, 15], [8, 10]], windows: [[4, 0], [14, 0, 'x'], [24, 0], [29, 0], [3, 8, 'x'], [27, 8, 'x']], start: [6, 5],
    },
  };
  H.LAY = LAY;

  // cores
  const PAINT = { quarto: '#8d84ad', escritorio: '#5d6b8a', banheiro: '#93bcc6', sala: '#c19c78', cozinha: '#d3be93', estudio: '#3b4057' };
  const PAINT_MAE = { quarto: '#d4a49c', escritorio: '#a3b386', banheiro: '#a2cbcb', sala: '#dbb98d', cozinha: '#e2cc9e', estudio: '#8a8a8a' };
  const EXT = '#b3a796', WALL_TOP = '#474b57', WALL_EDGE = '#6b7184';
  const FACE = { S: -0.07, N: -0.34, E: -0.24, W: -0.14 };

  let grid = null, lay = null, objs = [], walls = [], wallEdges = [], doors = [], props = [], ch = null, hover = null, onArrive = null;
  let nearPos = null, labels = [], wallMap = {};
  const DOOR_EXTRA = T * 0.175; // cada lado: vão de 32 vira ~43 (35% mais largo)
  let floorCv = null, floorKey = '', lastT = 0, lastRoom = null, banner = { name: '', t: -9 }, near = null, hits = [], lastAct = null, lc = null, grassPat = null;
  const V = { cx: 0, cy: 0, s: 2, W: 800, H: 600, zoom: 1, snap: true };
  H.cam = V;
  const keys = {};

  // ---------- projeção ----------
  const fz = z => CAMZ / (CAMZ - z);
  const P = (x, y, z) => { const f = fz(z || 0) * V.s; return [V.W / 2 + (x - V.cx) * f, V.H / 2 + (y - V.cy) * f]; };
  const atZ = (c, z, fn) => { const f = fz(z) * V.s; c.save(); c.translate(V.W / 2 - V.cx * f, V.H / 2 - V.cy * f); c.scale(f, f); fn(c); c.restore(); };
  const shc = new Map();
  const sh = (col, a) => { const k = col + a; let v = shc.get(k); if (!v) { v = U.shade(col, a); shc.set(k, v); } return v; };
  const quad = (c, a, b, d, e) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); };
  const FACE_AB = (d, x0, y0, x1, y1) => d === 'S' ? [x0, y1, x1, y1] : d === 'N' ? [x1, y0, x0, y0] : d === 'E' ? [x1, y1, x1, y0] : [x0, y0, x0, y1];
  const vis = (d, x0, y0, x1, y1) => d === 'S' ? V.cy > y1 : d === 'N' ? V.cy < y0 : d === 'E' ? V.cx > x1 : V.cx < x0;
  const fq = (c, fp, u0, u1, z0, z1, col) => { c.fillStyle = col; quad(c, fp(u0, z0), fp(u1, z0), fp(u1, z1), fp(u0, z1)); c.fill(); };
  // caixa: faces laterais visíveis e tampo. o.front + o.ff desenham a frente (porta, tela...)
  const box = (c, x0, y0, x1, y1, z0, z1, side, top, o) => {
    o = o || {};
    for (const d of ['N', 'E', 'W', 'S']) {
      if (!vis(d, x0, y0, x1, y1)) continue;
      const [ax, ay, bx, by] = FACE_AB(d, x0, y0, x1, y1);
      const col = sh((o.faces && o.faces[d]) || side, FACE[d]); const a0 = P(ax, ay, z0), b0 = P(bx, by, z0), b1 = P(bx, by, z1), a1 = P(ax, ay, z1);
      if (z1 - z0 > 14) { const g = c.createLinearGradient((a1[0] + b1[0]) / 2, (a1[1] + b1[1]) / 2, (a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2); g.addColorStop(0, sh(col, 0.05)); g.addColorStop(1, sh(col, z0 < 1 ? -0.28 : -0.12)); c.fillStyle = g; } else c.fillStyle = col;
      quad(c, a0, b0, b1, a1); c.fill();
      if (o.ff && (o.front === d || o.front === '*')) o.ff(c, (u, z) => P(ax + (bx - ax) * u, ay + (by - ay) * u, z), d);
    }
    if (top) atZ(c, z1, () => {
      const w = x1 - x0, h = y1 - y0; c.fillStyle = top; c.fillRect(x0, y0, w, h);
      if (w > 6 && h > 6) { c.fillStyle = 'rgba(255,255,255,.13)'; c.fillRect(x0, y0, w, 1.1); c.fillRect(x0, y0, 1.1, h); c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(x0, y1 - 1.1, w, 1.1); c.fillRect(x1 - 1.1, y0, 1.1, h); }
      if (o.tf) o.tf(c, x0, y0, w, h);
    });
  };
  // prisma de base qualquer (portas abrindo, vasos redondos)
  const prism = (c, pts, z0, z1, side, top, tf) => {
    const n = pts.length; let mx = 0, my = 0; pts.forEach(p => { mx += p[0]; my += p[1]; }); mx /= n; my /= n;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      let nx = b[1] - a[1], ny = a[0] - b[0];
      if (nx * ((a[0] + b[0]) / 2 - mx) + ny * ((a[1] + b[1]) / 2 - my) < 0) { nx = -nx; ny = -ny; }
      if ((V.cx - a[0]) * nx + (V.cy - a[1]) * ny <= 0) continue;
      const l = Math.hypot(nx, ny) || 1;
      c.fillStyle = sh(side, -0.06 - 0.2 * Math.abs(nx / l) - (ny < 0 ? 0.2 : 0)); quad(c, P(a[0], a[1], z0), P(b[0], b[1], z0), P(b[0], b[1], z1), P(a[0], a[1], z1)); c.fill();
    }
    if (top) { c.fillStyle = top; c.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1], z1); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); c.fill(); }
    if (tf) atZ(c, z1, tf);
  };
  const circ = (cx, cy, r, n) => { const out = []; n = n || 10; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return out; };
  const cyl = (c, cx, cy, r, z0, z1, side, top, tf) => prism(c, circ(cx, cy, r), z0, z1, side, top, tf);
  const hv = (a, b, s) => { const v = Math.sin(a * 127.1 + b * 311.7 + (s || 0) * 74.7) * 43758.5453; return v - Math.floor(v); };

  // ---------- montagem ----------
  const isWall = (x, y) => !!(grid && grid[y] && grid[y][x] && grid[y][x].t === 'wall');
  const walkable = (x, y) => !!(grid && grid[y] && grid[y][x] && grid[y][x].t !== 'wall' && !grid[y][x].block);
  const roomAtTile = (x, y) => (grid && grid[y] && grid[y][x] && grid[y][x].room) || null;
  const roomNear = (x, y) => roomAtTile(x, y) || roomAtTile(x, y + 1) || roomAtTile(x + 1, y) || roomAtTile(x, y - 1) || roomAtTile(x - 1, y);

  H.build = () => {
    const G = SL.G; const home = D.homeById(G.home.id); lay = LAY[home.layout];
    const mae = G.home.id === 'mae'; const paint = mae ? PAINT_MAE : PAINT;
    grid = [];
    for (let y = 0; y < lay.h; y++) { grid[y] = []; for (let x = 0; x < lay.w; x++) grid[y][x] = { t: 'wall', room: null }; }
    lay.rooms.forEach(r => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) grid[y][x] = { t: 'floor', room: r.id }; });
    lay.doors.forEach(([x, y]) => { grid[y][x] = { t: 'door', room: null }; });
    const [ex, ey] = lay.entry; grid[ey][ex] = { t: 'exit', room: null };
    // objetos
    objs = [];
    const add = (id, kind, label, item, z) => { const o = lay.objs[id]; if (!o) return; objs.push({ id, kind, label, item, x: o[0], y: o[1], w: o[2], h: o[3], z: z || 30, use: o.length > 4 ? [o[4], o[5]] : null }); };
    const it = G.home.items; const fb = id => D.furnById(id) || {};
    add('cama', 'cama', fb(it.cama).name || 'Cama', it.cama, (fb(it.cama).tier || 0) ? 24 : 10);
    add('mesa', 'mesa', 'Computador', it.mesa, 50);
    if (SL.Equip.item('iluminacao') || G.equip.setup.iluminacao) add('luz', 'luz', (D.equipById(G.equip.setup.iluminacao) || {}).name || 'Luz', G.equip.setup.iluminacao, 54);
    if (it.bike) add('bike', 'bike', 'Bicicleta ergométrica', it.bike, 26);
    add('chuveiro', 'chuveiro', fb(it.chuveiro).name || 'Chuveiro', it.chuveiro, 52);
    add('vaso', 'vaso', 'Vaso sanitário', null, 28); add('pia_b', 'pia_b', 'Pia do banheiro', null, 30);
    add('geladeira', 'geladeira', fb(it.geladeira).name || 'Geladeira', it.geladeira, (fb(it.geladeira).tier || 0) ? 56 : 34);
    add('fogao', 'fogao', fb(it.fogao).name || 'Fogão', it.fogao, 28);
    add('pia', 'pia', 'Pia da cozinha', null, 28);
    if (it.cafeteira) add('cafeteira', 'cafeteira', 'Cafeteira', it.cafeteira, 40);
    if (it.sofa) add('sofa', 'sofa', fb(it.sofa).name, it.sofa, 30);
    if (it.tv || G.equip.setup.console) add('tv', 'tv', it.tv ? fb(it.tv).name : 'Console', it.tv, 46);
    add('armario', 'armario', 'Armário de limpeza', null, 50); add('porta', 'porta', 'Porta de saída', null, 52); add('guarda', 'guarda', 'Guarda-roupa', null, 54);
    add('mesa_jantar', 'mesa_jantar', 'Mesa de refeições', null, 22);
    if (lay.objs.estudio) add('estudio', 'estudio', G.home.studio ? 'Estúdio profissional' : 'Cômodo vazio (obra)', null, G.home.studio ? 54 : 20);
    // decoração
    let wi = 0, fi = 0;
    G.home.deco.forEach((id, idx) => {
      const f = D.furnById(id); if (!f) return;
      if (['quadro', 'poster', 'neon'].includes(f.kind)) { const s = lay.decoWall[wi++]; if (!s) return; const r = lay.rooms.find(q => q.id === s[1]); objs.push({ id: 'deco' + idx, kind: f.kind, label: f.name, wall: true, x: s[0], y: r.y - 1, w: 1, h: 1, z: WALLZ, deco: idx }); }
      else if (f.kind === 'led') objs.push({ id: 'deco' + idx, kind: 'led', label: f.name, glow: true, deco: idx, x: 0, y: 0, w: 0, h: 0, z: 0 });
      else { const s = lay.decoFloor[fi++]; if (!s) return; objs.push({ id: 'deco' + idx, kind: f.kind, label: f.name, x: s[0], y: s[1], w: f.kind === 'tapete' ? 2 : 1, h: 1, flat: f.kind === 'tapete', deco: idx, z: { planta: 34, luminaria: 50, estante: 52 }[f.kind] || 4, use: f.kind === 'planta' ? [s[0], Math.min(s[1] + 1, lay.h - 2)] : null }); }
    });
    objs.forEach(o => { if (o.wall || o.glow || o.flat) return; for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (grid[y] && grid[y][x] && grid[y][x].t === 'floor') grid[y][x].block = true; });
    // de que lado está a parede de cada móvel (a frente fica do outro lado)
    objs.forEach(o => {
      const touch = d => { for (let i = 0; i < (d === 'N' || d === 'S' ? o.w : o.h); i++) { const tx = d === 'N' || d === 'S' ? o.x + i : d === 'W' ? o.x - 1 : o.x + o.w; const ty = d === 'W' || d === 'E' ? o.y + i : d === 'N' ? o.y - 1 : o.y + o.h; if (isWall(tx, ty)) return true; } return false; };
      o.back = ['N', 'W', 'E', 'S'].find(touch) || 'N'; o.front = { N: 'S', S: 'N', E: 'W', W: 'E' }[o.back];
    });
    // paredes (cada casa de parede é um bloco; faces escondidas entre paredes vizinhas não são desenhadas)
    walls = []; wallEdges = [];
    const paintOf = (x, y) => { const r = roomAtTile(x, y) || (grid[y] && grid[y][x] && grid[y][x].t !== 'wall' ? roomNear(x, y) : null); return r ? paint[r] : (x < 0 || y < 0 || x >= lay.w || y >= lay.h ? EXT : null); };
    for (let y = 0; y < lay.h; y++) for (let x = 0; x < lay.w; x++) {
      if (!isWall(x, y)) continue;
      const w = { x, y, skip: { N: isWall(x, y - 1), S: isWall(x, y + 1), E: isWall(x + 1, y), W: isWall(x - 1, y) }, col: {}, dec: [] };
      w.col.N = paintOf(x, y - 1) || EXT; w.col.S = paintOf(x, y + 1) || EXT; w.col.E = paintOf(x + 1, y) || EXT; w.col.W = paintOf(x - 1, y) || EXT;
      w.ext = x === 0 || y === 0 || x === lay.w - 1 || y === lay.h - 1;
      w.tr = { N: 0, S: 0, E: 0, W: 0 };
      walls.push(w);
    }
    const wallAt = (x, y) => walls.find(w => w.x === x && w.y === y);
    wallMap = {}; walls.forEach(w => { wallMap[w.y * 1000 + w.x] = w; });
    // portas 35% mais largas: a parede do lado da porta encurta (só onde não há outra parede encostando)
    const portas = lay.doors.concat([lay.entry]);
    portas.forEach(([x, y]) => {
      const hz = isWall(x - 1, y) && isWall(x + 1, y);
      if (hz) { const a = wallAt(x - 1, y), b = wallAt(x + 1, y); if (a && !isWall(x - 1, y - 1) && !isWall(x - 1, y + 1)) a.tr.E = DOOR_EXTRA; if (b && !isWall(x + 1, y - 1) && !isWall(x + 1, y + 1)) b.tr.W = DOOR_EXTRA; }
      else { const a = wallAt(x, y - 1), b = wallAt(x, y + 1); if (a && !isWall(x - 1, y - 1) && !isWall(x + 1, y - 1)) a.tr.S = DOOR_EXTRA; if (b && !isWall(x - 1, y + 1) && !isWall(x + 1, y + 1)) b.tr.N = DOOR_EXTRA; }
    });
    walls.forEach(w => {
      const X = w.x * T, Y = w.y * T; w.r = [X + w.tr.W, Y + w.tr.N, X + T - w.tr.E, Y + T - w.tr.S]; const [a, b, c2, d2] = w.r;
      if (!w.skip.N) wallEdges.push([a, b, c2, b]); if (!w.skip.S) wallEdges.push([a, d2, c2, d2]);
      if (!w.skip.W) wallEdges.push([a, b, a, d2]); if (!w.skip.E) wallEdges.push([c2, b, c2, d2]);
    });
    // janelas (só nas paredes de fora)
    lay.windows.forEach(([x, y]) => { const w = wallAt(x, y); if (!w || !w.ext) return; w.win = true; w.dec.push({ face: '*', fn: decWindow }); });
    // decoração de parede, espuma acústica, fita de LED, espelho
    objs.filter(o => o.wall).forEach(o => { const w = wallAt(o.x, o.y); if (w) w.dec.push({ face: 'S', fn: (c, fp) => decArt(c, fp, o), obj: o }); });
    const desk = objs.find(o => o.id === 'mesa');
    if (desk && G.home.items.acustica) for (let i = 0; i < desk.w; i++) { const w = wallAt(desk.x + i, desk.y - 1); if (w) w.dec.push({ face: 'S', fn: decFoam }); }
    if (G.home.deco.includes('led')) { const er = lay.rooms.find(r => r.id === 'escritorio'); if (er) for (let i = 0; i < er.w; i++) { const w = wallAt(er.x + i, er.y - 1); if (w) w.dec.push({ face: 'S', fn: decLed }); } }
    const pb = objs.find(o => o.id === 'pia_b');
    if (pb) { const d = pb.back; const w = wallAt(pb.x + (d === 'W' ? -1 : d === 'E' ? 1 : 0), pb.y + (d === 'N' ? -1 : d === 'S' ? 1 : 0)); if (w) w.dec.push({ face: pb.front, fn: decMirror }); }
    // portas
    doors = lay.doors.map(([x, y]) => ({ x, y, horiz: isWall(x - 1, y) && isWall(x + 1, y), open: 0, exit: false }));
    doors.push({ x: ex, y: ey, horiz: true, open: 0, exit: true });
    doors.forEach(d => { // vão da porta já com a parede encurtada
      if (d.horiz) { const a = wallAt(d.x - 1, d.y), b = wallAt(d.x + 1, d.y); d.a0 = d.x * T - (a ? a.tr.E : 0); d.a1 = d.x * T + T + (b ? b.tr.W : 0); }
      else { const a = wallAt(d.x, d.y - 1), b = wallAt(d.x, d.y + 1); d.a0 = d.y * T - (a ? a.tr.S : 0); d.a1 = d.y * T + T + (b ? b.tr.N : 0); }
    });
    // lado de fora: árvores, poste e carro
    const W0 = lay.w, H0 = lay.h;
    props = [[-3.4, 2.6, 'tree'], [-2.8, H0 * 0.62, 'tree'], [W0 + 3, 2.2, 'tree'], [W0 + 3.4, H0 * 0.68, 'tree'], [2.5, H0 + 9.4, 'tree'], [W0 - 4, H0 + 9.6, 'tree'], [W0 * 0.45, -3.6, 'tree'], [W0 * 0.8, -3.2, 'bush'], [W0 * 0.2, -2.8, 'bush'], [-2.2, H0 - 1.5, 'bush'], [W0 + 2.2, H0 - 2, 'bush'],
      [ex + 3.2, H0 + 2.6, 'lamp'], [ex - 6, H0 + 2.6, 'lamp']].map(([x, y, k], i) => ({ x: x * T, y: y * T, k, r: k === 'tree' ? 34 + (i % 3) * 7 : 16, i }));
    const ownCar = (G.equip.vehicles || []).includes('carro');
    props.push({ x: (ex - 3.2) * T, y: (H0 + 4.1) * T, k: 'car', col: ownCar ? '#c8392f' : '#3e5c8a', mine: ownCar });
    props.push({ x: (ex + 7.5) * T, y: (H0 + 6.3) * T, k: 'car', col: '#d9d4c7' });
    if ((G.equip.vehicles || []).includes('bike')) props.push({ x: (ex + 1.4) * T, y: (H0 + 0.7) * T, k: 'bikep' });
    // personagem
    let tx = G.loc.tx, ty = G.loc.ty;
    if (!walkable(tx, ty)) { [tx, ty] = lay.start; }
    ch = { x: (tx + 0.5) * T, y: (ty + 0.5) * T, path: [], ang: Math.PI / 2, tang: Math.PI / 2, ph: 0, moving: false, vx: 0, vy: 0 };
    floorCv = null; floorKey = ''; V.snap = true; lastRoom = null; lastAct = null;
  };
  H.objects = () => objs;
  H.roomAt = (x, y) => roomAtTile(x, y);
  H.currentRoom = () => ch ? roomAtTile(Math.floor(ch.x / T), Math.floor(ch.y / T)) || roomNear(Math.floor(ch.x / T), Math.floor(ch.y / T)) : null;

  // ---------- caminho e movimento ----------
  const bfs = (sx, sy, tx, ty) => {
    if (!walkable(tx, ty)) return null;
    const key = (x, y) => y * 200 + x; const prev = new Map(); const q = [[sx, sy]]; prev.set(key(sx, sy), null);
    while (q.length) {
      const [x, y] = q.shift(); if (x === tx && y === ty) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!walkable(nx, ny) || prev.has(key(nx, ny))) continue; prev.set(key(nx, ny), [x, y]); q.push([nx, ny]); }
    }
    if (!prev.has(key(tx, ty))) return null;
    const path = []; let cur = [tx, ty]; while (cur) { path.unshift(cur); cur = prev.get(key(cur[0], cur[1])); }
    return path.slice(1);
  };
  const tileOf = () => [Math.floor(ch.x / T), Math.floor(ch.y / T)];
  H.walkTo = (tx, ty, cb) => {
    const [sx, sy] = tileOf();
    if (!walkable(tx, ty)) { const alt = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => [tx + dx, ty + dy]).find(([x, y]) => walkable(x, y)); if (!alt) return false; [tx, ty] = alt; }
    if (sx === tx && sy === ty) { ch.path = [[tx, ty]]; onArrive = cb || null; return true; }
    const p = bfs(sx, sy, tx, ty); if (!p) return false;
    ch.path = p; onArrive = cb || null; return true;
  };
  H.goToObject = (o, cb) => {
    const G = SL.G;
    if (G.act && G.act.id !== 'usar_pc') { if (cb) cb(); return; }
    const u = o.use || nearestFree(o); if (!u) { if (cb) cb(); return; }
    if (!H.walkTo(u[0], u[1], cb)) { if (cb) cb(); }
  };
  const nearestFree = o => {
    let best = null, bd = 1e9;
    for (let y = o.y - 1; y <= o.y + o.h; y++) for (let x = o.x - 1; x <= o.x + o.w; x++) if (walkable(x, y)) { const d = Math.hypot((x + 0.5) * T - ch.x, (y + 0.5) * T - ch.y) + ((x < o.x || x >= o.x + o.w) && (y < o.y || y >= o.y + o.h) ? 40 : 0); if (d < bd) { bd = d; best = [x, y]; } }
    return best;
  };
  H.placeAt = id => { const o = objs.find(x => x.id === id); if (!o || !o.use) return; ch.x = (o.use[0] + 0.5) * T; ch.y = (o.use[1] + 0.5) * T; ch.path = []; if (id === 'porta') { ch.ang = ch.tang = -Math.PI / 2; } };
  const R = 8.5;
  const walkW = (x, y) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); if (walkable(tx, ty)) return true; const w = wallMap[ty * 1000 + tx]; return !!(w && (x < w.r[0] || x > w.r[2] || y < w.r[1] || y > w.r[3])); };
  const free = (x, y) => walkW(x - R, y - R) && walkW(x + R, y - R) && walkW(x - R, y + R) && walkW(x + R, y + R);
  const move = (dx, dy) => {
    let mx = false, my = false;
    if (dx && free(ch.x + dx, ch.y)) { ch.x += dx; mx = true; }
    if (dy && free(ch.x, ch.y + dy)) { ch.y += dy; my = true; }
    // ajuda nas portas: alinha com o meio da passagem quando esbarra no batente
    const sp = Math.hypot(dx, dy);
    if (dx && !mx) { const cy = (Math.floor(ch.y / T) + 0.5) * T; const n = U.clamp(cy - ch.y, -sp, sp); if (free(ch.x, ch.y + n)) ch.y += n; }
    if (dy && !my) { const cx = (Math.floor(ch.x / T) + 0.5) * T; const n = U.clamp(cx - ch.x, -sp, sp); if (free(ch.x + n, ch.y)) ch.x += n; }
    return mx || my;
  };
  const clear = (x0, y0, x1, y1) => { const d = Math.hypot(x1 - x0, y1 - y0); const n = Math.ceil(d / 8); for (let i = 1; i <= n; i++) { const k = i / n; if (!free(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k)) return false; } return true; };
  const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', Shift: 'run' };
  H.keyDown = k => { const m = keyMap[k]; if (!m) return false; keys[m] = true; return m !== 'run'; };
  H.keyUp = k => { const m = keyMap[k]; if (m) keys[m] = false; };
  H.clearKeys = () => { for (const k in keys) keys[k] = false; };
  H.moving = () => !!(ch && ch.moving);
  H.near = () => near;
  H.nearPos = () => nearPos;
  H.focus = () => { V.snap = true; };
  H.zoomBy = d => { V.zoom = U.clamp(V.zoom * (d > 0 ? 0.9 : 1.11), 0.72, 1.45); };

  // pose da atividade: onde o personagem fica e qual móvel "segura" o desenho dele
  const ob = id => objs.find(o => o.id === id);
  const pose = () => {
    const G = SL.G, a = G.act; if (!a) return null; const def = SL.Life.ACT[a.id]; if (!def) return null;
    const at = (o, d) => o && o.use ? { stand: o.use, x: (o.use[0] + 0.5) * T, y: (o.use[1] + 0.5) * T, ang: Math.atan2((o.y + o.h / 2) * T - (o.use[1] + 0.5) * T, (o.x + o.w / 2) * T - (o.use[0] + 0.5) * T), host: null, ...d } : null;
    if (def.sleep) { if (a.data && a.data.floor) return { x: ch.x, y: ch.y, floor: true, host: 'chao' }; const b = ob('cama'); if (b) return { host: 'cama', stand: b.use, sleep: true }; return { x: ch.x, y: ch.y, floor: true, host: 'chao' }; }
    if (def.pc) { const d = ob('mesa'); if (d && d.use) return { host: 'mesa', stand: d.use, x: (d.use[0] + 0.5) * T, y: (d.use[1] + 0.22) * T, ang: -Math.PI / 2, sit: true, type: a.id !== 'pc_lazer' }; }
    if (['tv', 'videogame', 'descansar', 'ler'].includes(a.id)) { const s = ob('sofa'); if (s) return { host: 'sofa', stand: s.use, x: (s.x + s.w / 2) * T, y: s.y * T + 14, ang: -Math.PI / 2, sit: true }; if (a.id === 'ler') { const b = ob('cama'); if (b) return { host: 'cama', stand: b.use, sleep: true, reading: true }; } }
    if (/banho/.test(a.id)) { const s = ob('chuveiro'); if (s) return { host: 'chuveiro', stand: s.use, x: (s.x + s.w / 2) * T, y: (s.y + s.h / 2) * T, ang: Math.PI / 2 }; }
    if (a.id === 'bike') { const b = ob('bike'); if (b) return { host: 'bike', stand: b.use, x: (b.x + 0.5) * T, y: (b.y + 0.62) * T, ang: -Math.PI / 2, sit: true, pedal: true }; }
    if (a.id === 'comer_pedido' || (a.id === 'comer' && a.data && a.data.where === 'mesa')) { const m = ob('mesa_jantar'); if (m && m.use) return { host: 'mesa_jantar', stand: m.use, x: (m.use[0] + 0.5) * T, y: (m.use[1] + 0.62) * T, ang: Math.PI / 2, sit: true }; }
    if (a.id === 'cozinhar') return at(ob('fogao'));
    if (a.id === 'cafe') return at(ob('cafeteira') || ob('fogao'));
    if (a.id === 'beber') return at(ob('pia'));
    if (a.id === 'escovar') return at(ob('pia_b'));
    if (a.id === 'vaso') { const v = ob('vaso'); if (v) return { host: 'vaso', x: (v.x + 0.5) * T, y: v.y * T + 19, ang: Math.PI / 2, sit: true, nude: true }; }
    if (a.id === 'regar') return at(objs.find(o => o.kind === 'planta'));
    return null;
  };

  H.update = dt => {
    if (!ch || !grid) return;
    const G = SL.G; const act = G.act; const busy = act && act.id !== 'usar_pc';
    // começou uma atividade: o personagem vai para o lugar dela
    const ak = act ? act.id + ':' + act.t0 : null;
    if (ak !== lastAct) { lastAct = ak; if (act) { const p = pose(); if (p && p.stand) { ch.x = (p.stand[0] + 0.5) * T; ch.y = (p.stand[1] + 0.5) * T; ch.path = []; onArrive = null; } } }
    if (act) { const p0 = pose(); if (p0 && !p0.host && p0.ang != null) ch.tang = p0.ang; }
    const tired = SL.Life.tiredLevel ? SL.Life.tiredLevel() : 0;
    const blocked = !!document.querySelector('.modal-bg') || (SL.UI && (SL.UI.pcOpen() || SL.UI.phoneOpen())) || (SL.Seq && SL.Seq.busy());
    let mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    const sp = (keys.run ? 168 : 108) * [1, 0.9, 0.76, 0.62][tired] * (busy ? 0 : 1);
    ch.moving = false;
    const wantKeys = (mx || my) && !busy && !blocked;
    if (wantKeys) { if (ch.path.length) { ch.path = []; onArrive = null; } const l = Math.hypot(mx, my); mx /= l; my /= l; ch.tang = Math.atan2(my, mx); if (SL.UI && SL.UI._ctx) SL.UI.closeCtx(); }
    const kv = 1 - Math.exp(-dt * (wantKeys ? 14 : 18));
    ch.vx += ((wantKeys ? mx * sp : 0) - ch.vx) * kv; ch.vy += ((wantKeys ? my * sp : 0) - ch.vy) * kv;
    if (Math.hypot(ch.vx, ch.vy) > 6 && !ch.path.length) {
      if (move(ch.vx * dt, ch.vy * dt)) ch.moving = true; else { ch.vx *= 0.5; ch.vy *= 0.5; }
    } else if (ch.path.length && (!busy || (act && act.id === 'limpar'))) {
      const s2 = (busy ? 60 : 124) * [1, 0.9, 0.76, 0.62][tired] * dt;
      while (ch.path.length > 1 && clear(ch.x, ch.y, (ch.path[1][0] + 0.5) * T, (ch.path[1][1] + 0.5) * T)) ch.path.shift();
      const [nx, ny] = ch.path[0]; const tx = (nx + 0.5) * T, ty = (ny + 0.5) * T;
      const dx = tx - ch.x, dy = ty - ch.y; const d = Math.hypot(dx, dy);
      if (d > 0.5) ch.tang = Math.atan2(dy, dx);
      if (d <= s2) { ch.x = tx; ch.y = ty; ch.path.shift(); if (!ch.path.length) { G.loc.tx = nx; G.loc.ty = ny; const cb = onArrive; onArrive = null; if (cb) cb(); } }
      else { ch.x += dx / d * s2; ch.y += dy / d * s2; }
      ch.moving = true;
    }
    if (act && act.id === 'limpar' && !ch.path.length && Math.random() < dt * 0.8) {
      const r = lay.rooms.find(q => q.id === H.currentRoom()) || lay.rooms[0];
      const tx = r.x + Math.floor(Math.random() * r.w), ty = r.y + Math.floor(Math.random() * r.h); if (walkable(tx, ty)) { const p = bfs(...tileOf(), tx, ty); if (p) ch.path = p; }
    }
    if (ch.moving) {
      const before = ch.ph; ch.ph += dt * U.clamp((ch.path.length ? 124 : Math.hypot(ch.vx, ch.vy)) / 10, 6, 17);
      if (Math.floor(ch.ph / Math.PI) !== Math.floor(before / Math.PI) && SL.audio) SL.audio.play('step');
      const [tx, ty] = tileOf(); G.loc.tx = tx; G.loc.ty = ty;
    } else ch.ph *= 0.8;
    // vira devagar para onde anda
    let da = ch.tang - ch.ang; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    ch.ang += da * Math.min(1, dt * 12);
    // portas
    doors.forEach(d => { const cx = (d.x + 0.5) * T, cy = (d.y + 0.5) * T; const want = Math.hypot(ch.x - cx, ch.y - cy) < 50 ? 1 : 0; d.open += (want - d.open) * Math.min(1, dt * 7); });
    // objeto mais perto (para a tecla E)
    near = null;
    if (!busy) {
      let best = 22;
      objs.forEach(o => { if (o.glow || o.flat) return; const dx = Math.max(o.x * T - ch.x, 0, ch.x - (o.x + o.w) * T), dy = Math.max(o.y * T - ch.y, 0, ch.y - (o.y + o.h) * T); const d = Math.hypot(dx, dy) + (o.wall ? 6 : 0); if (d < best) { best = d; near = o; } });
    }
    // saiu pela porta da frente andando
    const [tx, ty] = tileOf();
    if (grid[ty] && grid[ty][tx] && grid[ty][tx].t === 'exit' && keys.down && !busy && !blocked && H.onExit) { keys.down = false; H.onExit(); }
  };

  // ---------- conversões de tela ----------
  H.screenToTile = (sx, sy) => { const wx = V.cx + (sx - V.W / 2) / V.s, wy = V.cy + (sy - V.H / 2) / V.s; return { wx, wy, tx: Math.floor(wx / T), ty: Math.floor(wy / T) }; };
  H.tileToScreen = (tx, ty) => { const p = P(tx * T, ty * T, 0); return { x: p[0], y: p[1] }; };
  H.charScreen = () => { if (!ch) return { x: 0, y: 0 }; const p = P(ch.x, ch.y, 36); return { x: p[0], y: p[1] }; };
  H.objectAt = (sx, sy) => {
    for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (sx >= h[0] && sx <= h[2] && sy >= h[1] && sy <= h[3]) return h[4] || null; }
    return null;
  };
  H.setHover = o => { hover = o; };
  const bboxOf = (x0, y0, x1, y1, z0, z1) => { const a = P(x0, y0, z0), b = P(x1, y1, z0), c = P(x0, y0, z1), d = P(x1, y1, z1); return [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(b[0], d[0]), Math.max(b[1], d[1])]; };

  // ---------- luz e céu ----------
  const hour = () => 14;   // sem relógio (pedido do dono): a casa fica sempre de dia
  const skyColor = () => { const h = hour(); if (h < 5 || h >= 20) return '#1a2140'; if (h < 7) return '#e8a070'; if (h < 17) return '#8ec6ff'; if (h < 19) return '#f0a060'; return '#4a4a80'; };
  const nightAlpha = () => { const h = hour(); if (h >= 7 && h < 17.5) return 0; if (h >= 20 || h < 5) return 0.64; if (h < 7) return 0.64 * (1 - (h - 5) / 2); return 0.64 * ((h - 17.5) / 2.5); };
  const chovendo = () => !!(SL.G && SL.G.flags && SL.G.flags.chuva);
  const dayK = () => { if (chovendo()) return 0; const h = hour(); if (h < 6 || h > 18.5) return 0; if (h < 8) return (h - 6) / 2; if (h > 16.5) return (18.5 - h) / 2; return 1; };

  // ---------- chão (desenhado uma vez) ----------
  const FR = 2;
  const floorTile = (c, x, y, kind, mae) => {
    const X = x * T, Y = y * T;
    if (kind === 'wood' || kind === 'wood2') {
      const base = kind === 'wood' ? (mae ? [128, 90, 60] : [108, 78, 56]) : [74, 78, 96];
      const L = kind === 'wood' ? 74 : 92;
      for (let i = 0; i < 4; i++) {
        const row = y * 4 + i, off = hv(row, 3) * L; let s = X;
        while (s < X + T) {
          const pi = Math.floor((s + off) / L); const e = Math.min(X + T, (pi + 1) * L - off);
          const v = (hv(row, pi) - 0.5) * 22; c.fillStyle = `rgb(${base[0] + v | 0},${base[1] + v * 0.8 | 0},${base[2] + v * 0.6 | 0})`; c.fillRect(s, Y + i * 8, e - s + 0.4, 8);
          c.fillStyle = 'rgba(255,255,255,.035)'; c.fillRect(s, Y + i * 8 + 2 + hv(pi, row) * 3, e - s, 0.6);
          if (e < X + T) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(e - 0.4, Y + i * 8, 0.8, 8); }
          s = e;
        }
        c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(X, Y + i * 8 + 7.4, T, 0.6);
      }
    } else if (kind === 'tile' || kind === 'tile2') {
      const a = kind === 'tile' ? ['#d3dce2', '#c6d0d7'] : ['#e3d8c1', '#d5c8ad'];
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { c.fillStyle = a[(x * 2 + i + y * 2 + j) % 2]; c.fillRect(X + i * 16, Y + j * 16, 16, 16); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(X + i * 16 + 1, Y + j * 16 + 1, 14, 1); }
      c.fillStyle = kind === 'tile' ? '#97a4ad' : '#a89a80'; c.fillRect(X, Y, T, 0.8); c.fillRect(X, Y + 16, T, 0.8); c.fillRect(X, Y, 0.8, T); c.fillRect(X + 16, Y, 0.8, T);
    } else {
      c.fillStyle = '#272a37'; c.fillRect(X, Y, T, T); c.fillStyle = '#2c3040'; if ((x + y) % 2) c.fillRect(X, Y, T, T); c.fillStyle = 'rgba(255,255,255,.03)'; c.fillRect(X, Y, T, 0.7);
    }
  };
  const buildFloor = () => {
    const G = SL.G; const mae = G.home.id === 'mae';
    const cv = document.createElement('canvas'); cv.width = lay.w * T * FR; cv.height = lay.h * T * FR;
    const c = cv.getContext('2d'); c.scale(FR, FR);
    for (let y = 0; y < lay.h; y++) for (let x = 0; x < lay.w; x++) {
      const g = grid[y][x]; if (g.t === 'wall') continue;
      const rid = g.room || roomNear(x, y); const r = lay.rooms.find(q => q.id === rid);
      floorTile(c, x, y, r ? r.floor : 'wood', mae);
    }
    walls.forEach(w => { if (!(w.tr.N || w.tr.S || w.tr.E || w.tr.W)) return; const r = lay.rooms.find(q => q.id === roomNear(w.x, w.y) || q.id === roomNear(w.x + (w.tr.W ? -1 : w.tr.E ? 1 : 0), w.y + (w.tr.N ? -1 : w.tr.S ? 1 : 0))); floorTile(c, w.x, w.y, r ? r.floor : 'wood', mae); });
    doors.forEach(d => { c.fillStyle = '#6d5440'; if (d.horiz) { c.fillRect(d.a0, d.y * T + 12, d.a1 - d.a0, 8); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(d.a0, d.y * T + 12, d.a1 - d.a0, 1); } else c.fillRect(d.x * T + 12, d.a0, 8, d.a1 - d.a0); });
    // capacho na porta de entrada
    const [ex, ey] = lay.entry; c.fillStyle = '#5c4434'; rr(c, ex * T + 4, (ey - 1) * T + 14, T - 8, 16, 3); c.fill(); c.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 6; i++) c.fillRect(ex * T + 7 + i * 4, (ey - 1) * T + 16, 1.4, 12);
    // tapetes
    objs.filter(o => o.flat).forEach(o => {
      const x = o.x * T - 8, y = o.y * T + 2, w = o.w * T + 16, h = o.h * T - 4;
      c.fillStyle = 'rgba(0,0,0,.25)'; rr(c, x + 2, y + 3, w, h, 6); c.fill();
      c.fillStyle = '#b0607a'; rr(c, x, y, w, h, 6); c.fill(); c.strokeStyle = '#e9b8c6'; c.lineWidth = 2; rr(c, x + 5, y + 5, w - 10, h - 10, 4); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 5; i++) c.fillRect(x + 10 + i * (w - 20) / 4, y + h / 2 - 1, 3, 3);
    });
    // sombra dos móveis no chão
    objs.forEach(o => {
      if (o.flat || o.wall || o.glow || o.kind === 'porta' || o.kind === 'estudio') return;
      const x = o.x * T, y = o.y * T, w = o.w * T, h = o.h * T;
      for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(0,0,0,.06)'; rr(c, x + 1 - i + 3, y + 1 - i + 4, w - 2 + i * 2, h - 2 + i * 2, 4 + i); c.fill(); }
    });
    // sombra junto às paredes
    for (let y = 0; y < lay.h; y++) for (let x = 0; x < lay.w; x++) {
      if (isWall(x, y)) continue; const X = x * T, Y = y * T;
      const sd = (cond, gx0, gy0, gx1, gy1, rx, ry, rw, rh, a) => { if (!cond) return; const g = c.createLinearGradient(gx0, gy0, gx1, gy1); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(rx, ry, rw, rh); };
      sd(isWall(x, y - 1), 0, Y, 0, Y + 14, X, Y, T, 14, 0.38); sd(isWall(x - 1, y), X, 0, X + 10, 0, X, Y, 10, T, 0.26);
      sd(isWall(x + 1, y), X + T, 0, X + T - 10, 0, X + T - 10, Y, 10, T, 0.26); sd(isWall(x, y + 1), 0, Y + T, 0, Y + T - 8, X, Y + T - 8, T, 8, 0.2);
    }
    // sujeira
    const G0 = SL.G;
    if (G0.home.dirt > 35) { const r = U.mulberry(4); c.fillStyle = 'rgba(60,40,20,' + Math.min(0.35, (G0.home.dirt - 35) / 150) + ')'; for (let i = 0; i < Math.floor(G0.home.dirt / 5); i++) { const room = lay.rooms[Math.floor(r() * lay.rooms.length)]; c.beginPath(); c.ellipse((room.x + r() * room.w) * T, (room.y + r() * room.h) * T, 3 + r() * 6, 2 + r() * 4, r() * 3, 0, 7); c.fill(); } }
    floorCv = cv;
  };
  const grass = c => {
    if (grassPat) return grassPat;
    const g = document.createElement('canvas'); g.width = g.height = 64; const x = g.getContext('2d'); const r = U.mulberry(77);
    x.fillStyle = '#3f6b35'; x.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 260; i++) { x.fillStyle = r() < 0.5 ? 'rgba(90,140,70,.55)' : 'rgba(30,60,28,.5)'; x.fillRect(r() * 64, r() * 64, 1, 2 + r() * 3); }
    grassPat = c.createPattern(g, 'repeat'); return grassPat;
  };

  // ---------- decorações nas paredes ----------
  function decWindow(c, fp, d) {
    fq(c, fp, 0.14, 0.86, 16, 47, '#e8e4dc'); fq(c, fp, 0.2, 0.8, 19, 44, skyColor());
    fq(c, fp, 0.2, 0.8, 34, 44, 'rgba(255,255,255,.18)'); fq(c, fp, 0.485, 0.515, 19, 44, '#e8e4dc'); fq(c, fp, 0.1, 0.9, 14, 16.5, '#d6d0c4');
    void d;
  }
  function decArt(c, fp, o) {
    const G = SL.G;
    if (o.kind === 'quadro') { fq(c, fp, 0.18, 0.82, 22, 46, '#3a2c22'); fq(c, fp, 0.23, 0.77, 25, 43, '#efe6d6'); fq(c, fp, 0.3, 0.52, 28, 38, '#3b82f6'); fq(c, fp, 0.55, 0.7, 30, 41, '#ff5a36'); }
    else if (o.kind === 'poster') { fq(c, fp, 0.22, 0.78, 18, 48, '#e0702a'); fq(c, fp, 0.28, 0.72, 30, 44, '#1a1a22'); fq(c, fp, 0.3, 0.7, 21, 26, '#ffd166'); }
    else if (o.kind === 'neon') {
      fq(c, fp, 0.04, 0.96, 26, 42, 'rgba(255,61,129,.12)');
      const a = fp(0.08, 34), b = fp(0.92, 34); const h = Math.abs(fp(0.5, 40)[1] - fp(0.5, 28)[1]);
      c.save(); c.translate(a[0], a[1]); c.rotate(Math.atan2(b[1] - a[1], b[0] - a[0])); const w = Math.hypot(b[0] - a[0], b[1] - a[1]);
      c.font = '800 ' + Math.max(6, h * 0.9) + 'px Sora, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#ff3d81'; c.shadowBlur = 8; c.fillStyle = '#ffd0e4';
      c.fillText(G.player.channel.slice(0, 12), w / 2, 0, w); c.restore();
    }
  }
  function decFoam(c, fp) { for (let i = 0; i < 3; i++) { fq(c, fp, 0.04 + i * 0.32, 0.32 + i * 0.32, 22, 52, i % 2 ? '#2c2c3c' : '#363650'); fq(c, fp, 0.08 + i * 0.32, 0.28 + i * 0.32, 36, 38, 'rgba(0,0,0,.25)'); } }
  function decLed(c, fp) { fq(c, fp, 0, 1, 52, 54.5, 'hsl(' + ((performance.now() / 1000 * 30) % 360) + ',90%,62%)'); }
  function decMirror(c, fp) { fq(c, fp, 0.18, 0.82, 34, 54, '#9aa8b4'); fq(c, fp, 0.22, 0.78, 36, 52, '#c8dde8'); fq(c, fp, 0.3, 0.42, 38, 50, 'rgba(255,255,255,.35)'); }

  const drawWall = (c, w) => {
    const [x0, y0, x1, y1] = w.r;
    for (const d of ['N', 'E', 'W', 'S']) {
      if (w.skip[d] || !vis(d, x0, y0, x1, y1)) continue;
      const [ax, ay, bx, by] = FACE_AB(d, x0, y0, x1, y1); const fp = (u, z) => P(ax + (bx - ax) * u, ay + (by - ay) * u, z);
      const col = w.col[d];
      const a0 = P(ax, ay, 0), b0 = P(bx, by, 0), b1 = P(bx, by, WALLZ), a1 = P(ax, ay, WALLZ);
      const g = c.createLinearGradient((a1[0] + b1[0]) / 2, (a1[1] + b1[1]) / 2, (a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2); g.addColorStop(0, sh(col, FACE[d] + 0.06)); g.addColorStop(1, sh(col, FACE[d] - 0.16));
      c.fillStyle = g; quad(c, a0, b0, b1, a1); c.fill();
      fq(c, fp, 0, 1, 0, 3.5, sh(col, FACE[d] - 0.3));
      fq(c, fp, 0, 1, WALLZ - 2, WALLZ, sh(col, FACE[d] + 0.12));
      w.dec.forEach(dc => { if (dc.face === d || dc.face === '*') { dc.fn(c, fp, d); if (dc.obj) hits.push(bboxOf(x0, y1, x1, y1, 18, 48).concat(dc.obj)); } });
    }
  };
  const drawWallTops = c => {
    atZ(c, WALLZ, () => {
      c.fillStyle = WALL_TOP; c.beginPath(); walls.forEach(w => c.rect(w.r[0] - 0.3, w.r[1] - 0.3, w.r[2] - w.r[0] + 0.6, w.r[3] - w.r[1] + 0.6)); c.fill();
      const chuva = chovendo(); const tt = performance.now() / 1000;
      walls.forEach(w => { if (!w.win) return; const hz = w.skip.E || w.skip.W; c.fillStyle = chuva ? '#6f8394' : '#9fc6dd'; if (hz) c.fillRect(w.x * T + 3, w.y * T + 13, T - 6, 6); else c.fillRect(w.x * T + 13, w.y * T + 3, 6, T - 6);
        if (chuva) { c.fillStyle = 'rgba(220,235,255,.55)'; for (let i = 0; i < 4; i++) { const k = ((tt * (0.9 + i * 0.23) + i * 0.37 + w.x * 0.13) % 1); if (hz) c.fillRect(w.x * T + 5 + i * 6, w.y * T + 13 + k * 5, 0.8, 1.6); else c.fillRect(w.x * T + 14 + (i % 2) * 2.5, w.y * T + 4 + k * (T - 9), 0.8, 2); } } });
      c.strokeStyle = WALL_EDGE; c.lineWidth = 1.2; c.beginPath(); wallEdges.forEach(e => { c.moveTo(e[0], e[1]); c.lineTo(e[2], e[3]); }); c.stroke();
    });
  };
  const drawDoor = (c, d) => {
    const L = d.a1 - d.a0 - 3, th = 3.5; let hx, hy, a;
    if (d.horiz) { hx = d.a0 + 1.5; hy = d.y * T + T / 2; a = d.exit ? -d.open * Math.PI * 0.48 : d.open * Math.PI * 0.48; }
    else { hx = d.x * T + T / 2; hy = d.a0 + 1.5; a = Math.PI / 2 - d.open * Math.PI * 0.48; }
    const ux = Math.cos(a), uy = Math.sin(a), nx = -uy * th / 2, ny = ux * th / 2;
    const pts = [[hx + nx, hy + ny], [hx + ux * L + nx, hy + uy * L + ny], [hx + ux * L - nx, hy + uy * L - ny], [hx - nx, hy - ny]];
    const col = d.exit ? '#6a4630' : '#8d6a4c';
    prism(c, pts, 0, 52, col, sh(col, 0.15));
    if (d.exit) { const o = ob('porta'); if (o) hits.push(bboxOf(d.a0, d.y * T, d.a1, d.y * T + T, 0, 52).concat(o)); }
  };

  // ---------- móveis ----------
  const drawObj = (c, o, t, ps) => {
    const G = SL.G; const X = o.x * T, Y = o.y * T, W = o.w * T, Hh = o.h * T; const fb = D.furnById(o.item) || {}; const tier = fb.tier || 0;
    const host = ps && ps.host === o.id;
    switch (o.kind) {
      case 'cama': {
        const blanket = ['#4d5d92', '#c8475c', '#3b6fd6', '#7d4fd0'][tier], frame = ['#6b6f7a', '#7a5638', '#5a4034', '#2e2438'][tier];
        const y0 = Y + 3, y1 = Y + (tier >= 2 ? Hh - 3 : tier === 1 ? 42 : 40), x0 = X + 2, x1 = X + W - (tier === 0 ? 12 : 3);
        const mz = tier ? 20 : 9;
        if (tier) { box(c, x0, y0, x1, y1, 0, 12, frame, sh(frame, 0.1)); box(c, x0, y0, x0 + 6, y1, 0, tier >= 2 ? 40 : 32, frame, sh(frame, 0.2)); }
        const mx0 = tier ? x0 + 6 : x0;
        box(c, mx0, y0 + 1, x1 - 1, y1 - 1, tier ? 12 : 0, mz, '#d6dae3', '#eef1f6', { tf: (c2, x, y, w, h) => {
          c2.fillStyle = '#ffffff'; rr(c2, x + 3, y + 4, 15, h / (tier >= 2 ? 2 : 1) - 8, 4); c2.fill(); if (tier >= 2) { rr(c2, x + 3, y + h / 2 + 4, 15, h / 2 - 8, 4); c2.fill(); }
          c2.fillStyle = blanket; rr(c2, x + w * 0.3, y + 1, w * 0.7 - 1, h - 2, 4); c2.fill(); c2.fillStyle = sh(blanket, 0.28); rr(c2, x + w * 0.3, y + 1, 7, h - 2, 3); c2.fill();
          c2.strokeStyle = 'rgba(255,255,255,.12)'; c2.lineWidth = 0.7; c2.setLineDash([2, 2]); for (let i = 1; i < 3; i++) { c2.beginPath(); c2.moveTo(x + w * 0.3 + 8, y + i * h / 3); c2.lineTo(x + w - 3, y + i * h / 3); c2.stroke(); } c2.setLineDash([]);
          c2.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 1; i < 4; i++) c2.fillRect(x + w * 0.3 + i * w * 0.17, y + 2, 1, h - 4);
        } });
        if (host && ps.sleep) { const hx = mx0 + 11, hy = (y0 + y1) / 2 + (tier >= 2 ? -8 : 0); atZ(c, mz + 3, () => { c.fillStyle = sh(blanket, 0.1); c.beginPath(); c.ellipse(hx + 26, hy, 20, 10, 0, 0, 7); c.fill(); lyingHead(c, G.player.look, hx, hy, ps.reading); }); }
        break;
      }
      case 'mesa': drawDesk(c, o, t, X, Y, W, Hh); break;
      case 'luz': {
        const it = D.equipById(o.item); const id = it ? it.id : ''; if (id === 'luz_mesa') break;
        const cx = X + 16, cy = Y + 10;
        cyl(c, cx, cy + 4, 6, 0, 2, '#222222', '#333333');
        box(c, cx - 1.5, cy - 1.5, cx + 1.5, cy + 1.5, 0, 46, '#2a2a2a', '#3a3a3a');
        if (id === 'luz_ring') atZ(c, 48, () => { c.strokeStyle = '#f4f4f4'; c.lineWidth = 3.5; c.beginPath(); c.arc(cx, cy + 2, 9, 0, 7); c.stroke(); });
        else box(c, cx - 12, cy - 2, cx + 12, cy + 6, 40, 54, '#e8e8e8', '#f6f6f6', { front: 'S', ff: (c2, fp) => fq(c2, fp, 0.08, 0.92, 42, 52, id === 'luz_pro' ? 'hsl(' + (t * 30 % 360) + ',80%,75%)' : '#fff6d8') });
        break;
      }
      case 'bike': {
        const cx = X + 16;
        box(c, cx - 3, Y + 4, cx + 3, Y + 28, 0, 6, '#2b2b30', '#3a3a40');
        cyl(c, cx, Y + 7, 7, 4, 10, '#c0392b', '#e0503d');
        box(c, cx - 2, Y + 21, cx + 2, Y + 25, 0, 20, '#2b2b30', '#3a3a40');
        if (host) person(c, G.player.look, ps.x, ps.y, ps.ang, { sit: true, pedal: t });
        else box(c, cx - 5, Y + 19, cx + 5, Y + 27, 20, 23, '#111111', '#222222');
        box(c, cx - 12, Y + 3, cx + 12, Y + 6, 22, 25, '#2b2b30', '#45454d');
        break;
      }
      case 'chuveiro': {
        const du = o.item === 'ducha';
        box(c, X + 2, Y + 2, X + W - 2, Y + Hh - 2, 0, 3, '#c9d2d9', '#dfe6ec', { tf: (c2, x, y, w, h) => { c2.fillStyle = '#b6c0c8'; c2.beginPath(); c2.arc(x + w / 2, y + h / 2, 2.5, 0, 7); c2.fill(); c2.strokeStyle = 'rgba(0,0,0,.08)'; c2.lineWidth = 0.6; for (let i = 1; i < 4; i++) { c2.beginPath(); c2.moveTo(x + i * w / 4, y); c2.lineTo(x + i * w / 4, y + h); c2.stroke(); } } });
        const cx = X + W / 2, cy = Y + Hh / 2;
        atZ(c, 52, () => { c.fillStyle = '#9aa4ac'; c.fillRect(cx - 1.5, Y + 3, 3, cy - Y - 6); c.beginPath(); c.arc(cx, cy - 3, du ? 8 : 5.5, 0, 7); c.fill(); c.fillStyle = '#c3ccd3'; c.beginPath(); c.arc(cx, cy - 3, du ? 6 : 4, 0, 7); c.fill(); });
        if (host) {
          person(c, G.player.look, ps.x, ps.y, ps.ang, { nude: true, t });
          c.fillStyle = 'rgba(190,225,255,.75)';
          for (let i = 0; i < 34; i++) { const ph = (t * 1.7 + i * 0.137) % 1; const z = 50 - ph * 50; const p = P(cx + (hv(i, 1) - 0.5) * (du ? 34 : 24), cy - 3 + (hv(i, 2) - 0.5) * (du ? 34 : 24), z); c.fillRect(p[0], p[1], 1.3, 3.5); }
          for (let i = 0; i < 6; i++) { const ph = (t * 0.25 + i / 6) % 1; const p = P(cx + Math.sin(i * 2 + t) * 14, cy + Math.cos(i * 3) * 12, 20 + ph * 40); c.fillStyle = 'rgba(255,255,255,' + (0.16 * (1 - ph)) + ')'; c.beginPath(); c.arc(p[0], p[1], 8 + ph * 14, 0, 7); c.fill(); }
        }
        const gl = 'rgba(190,225,245,.22)';
        c.fillStyle = gl;
        const panel = (ax, ay, bx, by) => { quad(c, P(ax, ay, 0), P(bx, by, 0), P(bx, by, 50), P(ax, ay, 50)); c.fill(); c.strokeStyle = 'rgba(230,245,255,.5)'; c.lineWidth = 1; c.beginPath(); const a = P(ax, ay, 50), b = P(bx, by, 50); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
        if (!isWall(o.x - 1, o.y)) panel(X + 1, Y + 1, X + 1, Y + Hh - 1);
        if (!isWall(o.x + o.w, o.y)) panel(X + W - 1, Y + 1, X + W - 1, Y + Hh - 1);
        if (!isWall(o.x, o.y + o.h)) { c.fillStyle = gl; panel(X + 1, Y + Hh - 1, X + W * 0.55, Y + Hh - 1); }
        break;
      }
      case 'vaso': {
        const cx = X + 16;
        box(c, cx - 8, Y + 2, cx + 8, Y + 9, 0, 28, '#e9edf2', '#f6f8fb');
        cyl(c, cx, Y + 19, 8, 0, 14, '#e2e7ee', '#f3f6f9', c2 => { c2.fillStyle = '#c9d2dc'; c2.beginPath(); c2.ellipse(cx, Y + 19, 5, 5.6, 0, 0, 7); c2.fill(); });
        if (host) person(c, G.player.look, ps.x, ps.y, ps.ang, { sit: true, nude: true, t });
        break;
      }
      case 'pia_b': {
        const r = inset(o, 3, 6);
        box(c, r[0], r[1], r[2], r[3], 0, 30, '#e2e7ee', '#f1f4f8', { tf: (c2, x, y, w, h) => { c2.fillStyle = '#c3cdd7'; c2.beginPath(); c2.ellipse(x + w / 2, y + h / 2, w * 0.3, h * 0.3, 0, 0, 7); c2.fill(); c2.fillStyle = '#8d99a5'; c2.beginPath(); c2.arc(x + w / 2 + (o.back === 'W' ? -w * 0.36 : o.back === 'E' ? w * 0.36 : 0), y + h / 2 + (o.back === 'N' ? -h * 0.36 : 0), 2.2, 0, 7); c2.fill(); } });
        break;
      }
      case 'geladeira': {
        const r = inset(o, 3, 4); const tall = tier >= 1; const col = tier === 2 ? '#b4bcc6' : '#e8ecf0'; const z = tall ? 56 : 34;
        box(c, r[0], r[1], r[2], r[3], 0, z, col, sh(col, 0.08), { front: o.front, ff: (c2, fp) => { if (tall) fq(c2, fp, 0, 1, 38, 39.2, 'rgba(0,0,0,.25)'); else fq(c2, fp, 0, 1, 26, 27, 'rgba(0,0,0,.2)'); fq(c2, fp, 0.8, 0.86, tall ? 42 : 14, tall ? 52 : 24, '#7a838d'); if (tall) fq(c2, fp, 0.8, 0.86, 16, 34, '#7a838d'); } });
        break;
      }
      case 'fogao': {
        const r = inset(o, 2, 4); const dark = tier >= 2; const col = dark ? '#2a2c33' : '#e5e6ea';
        const cooking = G.act && G.act.id === 'cozinhar';
        box(c, r[0], r[1], r[2], r[3], 0, 28, dark ? '#c8b89a' : col, dark ? '#d8cbb0' : sh(col, 0.05), { front: o.front, ff: (c2, fp) => { if (!dark) { fq(c2, fp, 0.1, 0.9, 6, 20, '#3a3d45'); fq(c2, fp, 0.14, 0.86, 8, 18, cooking ? '#6a3a20' : '#22252c'); } }, tf: (c2, x, y, w, h) => {
          if (dark) { c2.fillStyle = '#16171c'; rr(c2, x + 3, y + 3, w - 6, h - 6, 3); c2.fill(); }
          const n = tier ? 4 : 2; for (let i = 0; i < n; i++) { const bx = x + (n === 2 ? w * (0.3 + i * 0.4) : w * (0.25 + (i % 2) * 0.5)), by = y + (n === 2 ? h / 2 : h * (0.3 + Math.floor(i / 2) * 0.42)); c2.fillStyle = dark ? '#2e3038' : '#3b3d44'; c2.beginPath(); c2.arc(bx, by, 6, 0, 7); c2.fill(); if (cooking && i === 0) { c2.strokeStyle = 'rgba(255,120,40,.9)'; c2.lineWidth = 1.6; c2.beginPath(); c2.arc(bx, by, 5, 0, 7); c2.stroke(); } }
        } });
        if (cooking) { const bx = r[0] + (r[2] - r[0]) * (tier ? 0.25 : 0.3), by = r[1] + (r[3] - r[1]) * (tier ? 0.3 : 0.5); cyl(c, bx, by, 7.5, 28, 37, '#8a8f99', '#a4a9b2', c2 => { c2.fillStyle = '#c86f3c'; c2.beginPath(); c2.arc(bx, by, 5.5, 0, 7); c2.fill(); }); for (let i = 0; i < 5; i++) { const ph = (t * 0.4 + i / 5) % 1; const p = P(bx + Math.sin(t * 2 + i) * 4, by, 38 + ph * 30); c.fillStyle = 'rgba(255,255,255,' + 0.3 * (1 - ph) + ')'; c.beginPath(); c.arc(p[0], p[1], 3 + ph * 7, 0, 7); c.fill(); } }
        break;
      }
      case 'pia': {
        const r = inset(o, 1, 4);
        box(c, r[0], r[1], r[2], r[3], 0, 28, '#a89270', '#d7cbb2', { front: o.front, ff: (c2, fp) => { fq(c2, fp, 0.5, 0.505, 3, 24, 'rgba(0,0,0,.25)'); fq(c2, fp, 0.42, 0.47, 14, 16, '#5a4a38'); fq(c2, fp, 0.53, 0.58, 14, 16, '#5a4a38'); }, tf: (c2, x, y, w, h) => { c2.fillStyle = '#9aa5b0'; rr(c2, x + w * 0.28, y + h * 0.22, w * 0.44, h * 0.62, 4); c2.fill(); c2.fillStyle = '#b8c2cc'; rr(c2, x + w * 0.31, y + h * 0.28, w * 0.38, h * 0.5, 3); c2.fill(); if (G.home.dirt > 50) { c2.fillStyle = '#f2f2f2'; c2.beginPath(); c2.arc(x + w * 0.42, y + h * 0.52, 5, 0, 7); c2.fill(); c2.beginPath(); c2.arc(x + w * 0.56, y + h * 0.5, 4.5, 0, 7); c2.fill(); } } });
        box(c, r[0] + (r[2] - r[0]) / 2 - 1.5, r[1] + 2, r[0] + (r[2] - r[0]) / 2 + 1.5, r[1] + 9, 28, 36, '#9aa0a8', '#c2c8cf');
        break;
      }
      case 'cafeteira': {
        const r = inset(o, 1, 4);
        box(c, r[0], r[1], r[2], r[3], 0, 28, '#a89270', '#d7cbb2');
        const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
        box(c, cx - 7, cy - 8, cx + 7, cy + 4, 28, 42, '#1d1d22', '#2b2b32', { front: 'S', ff: (c2, fp) => fq(c2, fp, 0.25, 0.75, 30, 36, G.act && G.act.id === 'cafe' ? '#6b3c1c' : '#3a2a20') });
        break;
      }
      case 'sofa': {
        const col = tier === 2 ? '#3a4a7a' : '#7a4a5a';
        box(c, X + 1, Y + 2, X + W - 1, Y + Hh - 1, 0, 12, sh(col, -0.15), sh(col, -0.05));
        const n = Math.max(2, Math.round(o.w / 2)); const cw = (W - 18) / n;
        for (let i = 0; i < n; i++) box(c, X + 9 + i * cw + 0.5, Y + 3, X + 9 + (i + 1) * cw - 0.5, Y + Hh - 9, 12, 17, col, sh(col, 0.12));
        if (host) person(c, G.player.look, ps.x, ps.y, ps.ang, { sit: true });
        box(c, X + 1, Y + Hh - 9, X + W - 1, Y + Hh - 1, 12, 31, sh(col, -0.08), sh(col, 0.05));
        box(c, X + 1, Y + 2, X + 9, Y + Hh - 1, 12, 23, sh(col, -0.08), sh(col, 0.06));
        box(c, X + W - 9, Y + 2, X + W - 1, Y + Hh - 1, 12, 23, sh(col, -0.08), sh(col, 0.06));
        break;
      }
      case 'tv': {
        box(c, X - 4, Y + 2, X + W + 4, Y + 16, 0, 16, '#3d2c22', '#523d2f', { tf: (c2, x, y, w, h) => grain(c2, x, y, w, h, 3) });
        if (G.equip.setup.console) box(c, X + W / 2 - 10, Y + 8, X + W / 2 + 10, Y + 15, 16, 19, '#ececf2', '#f6f6fa');
        if (fb.id) {
          const big = tier === 2; const tw = big ? W + 10 : W - 6; const tx0 = X + (W - tw) / 2;
          const on = G.act && (G.act.id === 'tv' || G.act.id === 'videogame');
          box(c, X + W / 2 - 5, Y + 4, X + W / 2 + 5, Y + 9, 16, 18, '#111111', '#1a1a1a');
          box(c, tx0, Y + 4, tx0 + tw, Y + 6.5, 18, big ? 50 : 44, '#0d0d10', '#1a1a20', { front: 'S', ff: (c2, fp) => {
            const scr = on ? 'hsl(' + (t * 40 % 360) + ',55%,48%)' : '#141826';
            fq(c2, fp, 0.03, 0.97, 20, (big ? 50 : 44) - 2, scr);
            if (on) { fq(c2, fp, 0.1, 0.5, 26, 34, 'rgba(255,255,255,.25)'); fq(c2, fp, 0.55, 0.9, 30, 40, 'rgba(0,0,0,.2)'); }
          } });
        }
        break;
      }
      case 'armario': {
        const r = inset(o, 2, 5);
        box(c, r[0], r[1], r[2], r[3], 0, 50, '#7f8592', '#9aa0ac', { front: o.front, ff: (c2, fp) => { fq(c2, fp, 0.495, 0.505, 2, 48, 'rgba(0,0,0,.3)'); fq(c2, fp, 0.42, 0.46, 24, 30, '#2a2a2a'); fq(c2, fp, 0.54, 0.58, 24, 30, '#2a2a2a'); } });
        break;
      }
      case 'guarda': {
        const r = inset(o, 2, 6);
        box(c, r[0], r[1], r[2], r[3], 0, 54, '#5a4030', '#6d4f3c', { tf: (c2, x, y, w, h) => grain(c2, x, y, w, h, 7), front: o.front, ff: (c2, fp) => { for (let i = 1; i < 3; i++) fq(c2, fp, i / 3 - 0.004, i / 3 + 0.004, 2, 52, 'rgba(0,0,0,.35)'); for (let i = 0; i < 3; i++) fq(c2, fp, i / 3 + 0.26, i / 3 + 0.29, 22, 32, '#d9b56a'); } });
        break;
      }
      case 'mesa_jantar': {
        const legs = [[X + 6, Y + 8], [X + W - 10, Y + 8], [X + 6, Y + Hh - 12], [X + W - 10, Y + Hh - 12]];
        const chairs = []; for (let i = 0; i < o.w; i++) { chairs.push([X + i * T + 9, Y - 10, 'N']); chairs.push([X + i * T + 9, Y + Hh - 2, 'S']); }
        chairs.forEach(([cx, cy, s]) => { if (host && s === 'N' && Math.abs(cx + 7 - ps.x) < 16) return; box(c, cx, cy, cx + 14, cy + 12, 0, 13, '#6d5039', '#86644a'); const by = s === 'N' ? cy : cy + 9; box(c, cx, by, cx + 14, by + 3, 13, 28, '#6d5039', '#86644a'); });
        if (host) { const cx = ps.x - 7, cy = ps.y - 6; box(c, cx, cy, cx + 14, cy + 12, 0, 13, '#6d5039', '#86644a'); }
        legs.forEach(([lx, ly]) => box(c, lx, ly, lx + 4, ly + 4, 0, 18, '#5a4230', '#6d5039'));
        if (host) person(c, G.player.look, ps.x, ps.y, ps.ang, { sit: true, eat: true });
        box(c, X + 3, Y + 5, X + W - 3, Y + Hh - 5, 18, 22, '#7a5a40', '#9a7652', { tf: (c2, x, y, w, h) => {
          grain(c2, x, y, w, h, o.x);
          if (G.flags.mealReady || host) { c2.fillStyle = '#f4f4f4'; c2.beginPath(); c2.arc(x + 16, y + 7, 7, 0, 7); c2.fill(); c2.fillStyle = host ? '#c86f3c' : '#d8432f'; c2.beginPath(); c2.arc(x + 16, y + 7, 4.5, 0, 7); c2.fill(); }
          c2.fillStyle = 'rgba(255,255,255,.08)'; c2.fillRect(x + 2, y + 2, w - 4, 1.2);
        } });
        if (host && G.player) { /* talheres já no prato */ }
        break;
      }
      case 'estudio': {
        if (G.home.studio) {
          box(c, X + 8, Y + 2, X + W - 70, Y + 6, 0, 56, '#159a50', '#1fb860', { front: 'S', ff: (c2, fp) => fq(c2, fp, 0, 1, 2, 54, '#19b45c') });
          box(c, X + 40, Y + 70, X + 200, Y + 96, 0, 24, '#1a1a22', '#24242e');
          [[X + 70], [X + 130]].forEach(([mx]) => box(c, mx, Y + 74, mx + 48, Y + 78, 24, 48, '#0d0f14', '#1a1c24', { front: 'S', ff: (c2, fp) => fq(c2, fp, 0.05, 0.95, 26, 46, '#5b3fd6') }));
          [[X + 20, Y + 30], [X + 230, Y + 30]].forEach(([lx, ly]) => { box(c, lx - 1.5, ly - 1.5, lx + 1.5, ly + 1.5, 0, 46, '#222222', '#333333'); box(c, lx - 12, ly - 6, lx + 12, ly + 4, 40, 54, '#e8e8e8', '#fff8e0'); });
        } else {
          atZ(c, 0.5, () => { c.strokeStyle = '#ffb547'; c.lineWidth = 2.5; c.setLineDash([10, 8]); c.strokeRect(X, Y, W, Hh); c.setLineDash([]); });
          for (let i = 0; i < 5; i++) { const bx = X + 26 + i * 50, by = Y + 30 + (i % 2) * 34; box(c, bx, by, bx + 30, by + 24, 0, 18 + (i % 3) * 6, '#9a7448', '#b88d5a', { tf: (c2, x, y, w, h) => { c2.fillStyle = 'rgba(230,210,160,.8)'; c2.fillRect(x, y + h / 2 - 2, w, 4); } }); }
        }
        break;
      }
      case 'planta': {
        const cx = X + 16, cy = Y + 18;
        cyl(c, cx, cy, 8, 0, 12, '#9a5432', '#7a4026', c2 => { c2.fillStyle = '#4a3020'; c2.beginPath(); c2.arc(cx, cy, 6.4, 0, 7); c2.fill(); });
        [[18, 11, 0], [24, 9, 0.8], [30, 7, 1.7]].forEach(([z, r0, rot]) => atZ(c, z, () => { for (let i = 0; i < 5; i++) { const a = rot + i * 1.26 + Math.sin(t * 0.8 + i) * 0.04; c.fillStyle = i % 2 ? '#3f9f4a' : '#4fb85a'; c.beginPath(); c.ellipse(cx + Math.cos(a) * r0 * 0.6, cy + Math.sin(a) * r0 * 0.6, r0 * 0.55, r0 * 0.24, a, 0, 7); c.fill(); } }));
        break;
      }
      case 'luminaria': {
        const cx = X + 16, cy = Y + 16;
        cyl(c, cx, cy, 6, 0, 2, '#2a2a2a', '#3a3a3a');
        box(c, cx - 1.2, cy - 1.2, cx + 1.2, cy + 1.2, 0, 42, '#2a2a2a', '#3a3a3a');
        cyl(c, cx, cy, 8, 40, 50, '#e9dcb8', '#f6ecd0');
        break;
      }
      case 'estante': {
        box(c, X + 2, Y + 3, X + W - 2, Y + 15, 0, 52, '#5a3a2a', '#6d4836', { front: 'S', ff: (c2, fp) => { for (let i = 0; i < 4; i++) { fq(c2, fp, 0.06, 0.94, 4 + i * 12, 5.5 + i * 12, '#3a2418'); for (let j = 0; j < 4; j++) fq(c2, fp, 0.1 + j * 0.21, 0.24 + j * 0.21, 6 + i * 12, 13 + i * 12 - (j % 2) * 2, D.shirtColors[(i * 3 + j * 5) % 12]); } } });
        break;
      }
      default: break;
    }
    const hl = (hover && hover.id === o.id) || (near && near.id === o.id && !SL.G.act);
    if (hl && !o.wall && o.kind !== 'porta') atZ(c, Math.min(o.z, 56) + 0.5, () => { c.strokeStyle = 'rgba(196,181,253,.95)'; c.lineWidth = 1.6; c.setLineDash([5, 4]); rr(c, X - 2, Y - 2, W + 4, Hh + 4, 5); c.stroke(); c.setLineDash([]); });
  };
  // veios de madeira num tampo
  const grain = (c, x, y, w, h, seed) => { c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 0.6; for (let i = 0; i < Math.max(2, h / 4); i++) { const yy = y + 2 + i * 4 + hv(seed, i) * 2; c.beginPath(); c.moveTo(x + 1, yy); c.bezierCurveTo(x + w * 0.3, yy + (hv(i, seed) - 0.5) * 3, x + w * 0.7, yy - (hv(seed + 1, i) - 0.5) * 3, x + w - 1, yy); c.stroke(); } };
  const inset = (o, a, b) => { const X = o.x * T, Y = o.y * T, W = o.w * T, Hh = o.h * T; const s = { N: [a, a, a, b], S: [a, b, a, a], W: [a, a, b, a], E: [b, a, a, a] }[o.back] || [a, a, a, a]; return [X + s[0], Y + s[1], X + W - s[2], Y + Hh - s[3]]; };

  const drawDesk = (c, o, t, X, Y, W) => {
    const G = SL.G;
    const desk = D.furnById(G.home.items.mesa) || { tier: 0 }; const tier = desk.tier || 0; const pcIt = D.equipById(G.equip.setup.computador);
    const broken = pcIt && SL.Equip.isBroken(pcIt.id);
    const top = tier === 0 ? '#c9ad84' : tier === 1 ? '#1d1f26' : '#2a2d38', side = tier === 0 ? '#a48a64' : tier === 1 ? '#15161b' : '#202330';
    const dz = 25;
    box(c, X + 2, Y + 3, X + W - 2, Y + 29, dz - 3, dz, side, top, { tf: (c2, x, y, w, h) => { if (tier === 0) grain(c2, x, y, w, h, 5); else { c2.fillStyle = 'rgba(255,255,255,.04)'; c2.fillRect(x + 4, y + 4, w - 8, h - 8); } }, front: 'S', ff: (c2, fp) => { if (tier === 1) fq(c2, fp, 0, 1, dz - 1.6, dz - 0.6, '#d8432f'); } });
    [[X + 4, Y + 5], [X + W - 8, Y + 5], [X + 4, Y + 23], [X + W - 8, Y + 23]].forEach(([lx, ly]) => box(c, lx, ly, lx + 4, ly + 4, 0, dz - 3, side, side));
    if (tier === 2) box(c, X + W - 30, Y + 29, X + W - 2, Y + 54, dz - 3, dz, side, top);
    const a0 = G.act; const noAr = !!(SL.Live && SL.Live.cur); const a = noAr ? { id: 'live' } : a0; const on = noAr || (a && SL.Life.ACT[a.id] && SL.Life.ACT[a.id].pc);
    const scr = broken ? '#3a0d0d' : on ? (a.id === 'live' ? '#5a1f6a' : a.id === 'editar' ? '#2c2f6e' : '#2d3f7a') : '#0e1118';
    const content = (c2, fp) => { if (!on || broken) return; fq(c2, fp, 0.12, 0.6, 30, 32, 'rgba(255,255,255,.35)'); fq(c2, fp, 0.12, 0.85, 35, 41, 'rgba(255,255,255,.12)'); if (a.id === 'live') fq(c2, fp, 0.72, 0.88, 42, 45, '#ff4d5e'); };
    const mon = SL.Equip.item('monitor');
    const cx = X + W / 2;
    if (pcIt && pcIt.id === 'pc_note' && !mon) {
      box(c, cx - 17, Y + 12, cx + 17, Y + 26, dz, dz + 1.5, '#2a2d36', '#353945', { tf: (c2, x, y, w, h) => { c2.fillStyle = '#1d2029'; c2.fillRect(x + 3, y + 2, w - 6, h - 6); } });
      box(c, cx - 17, Y + 9, cx + 17, Y + 11.5, dz, dz + 22, '#1a1c22', '#24262e', { front: 'S', ff: (c2, fp) => { fq(c2, fp, 0.05, 0.95, dz + 2, dz + 20, scr); content(c2, (u, z) => fp(u, z - dz + 16)); } });
    } else {
      const mw = mon ? (mon.q >= 75 ? 52 : mon.q >= 55 ? 46 : 40) : 40;
      const drawMon = mx => {
        box(c, mx + mw / 2 - 5, Y + 7, mx + mw / 2 + 5, Y + 13, dz, dz + 2, '#111111', '#1c1c1c');
        box(c, mx, Y + 7, mx + mw, Y + 10, dz + 4, dz + 30, '#0d0f14', '#1a1c24', { front: 'S', ff: (c2, fp) => { fq(c2, fp, 0.04, 0.96, dz + 6, dz + 28, scr); content(c2, (u, z) => fp(u, z - 2)); } });
      };
      drawMon(cx - mw / 2 - (mon && mon.dual ? mw / 2 + 3 : 0));
      if (mon && mon.dual) drawMon(cx + 3);
      box(c, cx - 18, Y + 17, cx + 18, Y + 23, dz, dz + 1.5, '#23262e', '#2f333d', { tf: (c2, x, y, w, h) => { c2.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) c2.fillRect(x + 2 + i * 2.7, y + 1.3 + j * 2.2, 1.8, 1.4); } });
      if (pcIt && pcIt.tier >= 1) box(c, X + W - 22, Y + 6, X + W - 8, Y + 26, dz, dz + 28, '#16181f', '#20232c', { front: 'S', ff: (c2, fp) => { if (pcIt.tier >= 2) fq(c2, fp, 0.2, 0.3, dz + 3, dz + 25, 'hsl(' + (t * 50 % 360) + ',90%,60%)'); } });
    }
    if (SL.Equip.item('mouse')) atZ(c, dz + 1, () => { c.fillStyle = '#2b2b2b'; c.beginPath(); c.ellipse(cx + 28, Y + 20, 3, 4.5, 0, 0, 7); c.fill(); });
    const mic = SL.Equip.item('microfone');
    if (mic) { box(c, X + 8, Y + 8, X + 12, Y + 12, dz, dz + 22, '#2a2a2a', '#333333'); atZ(c, dz + 22, () => { c.strokeStyle = '#2a2a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(X + 10, Y + 10); c.lineTo(X + 22, Y + 22); c.stroke(); }); cyl(c, X + 22, Y + 22, 3.4, dz + 16, dz + 24, mic.audio > 70 ? '#111111' : '#444444', mic.audio > 70 ? '#222222' : '#555555'); }
    const cam = SL.Equip.item('webcam'); if (cam) box(c, cx - 6, Y + 7, cx + 6, Y + 11, dz + 30, dz + 34, '#111111', '#1d1d1d', { front: 'S', ff: (c2, fp) => fq(c2, fp, 0.42, 0.58, dz + 31, dz + 33, '#4cc3ff') });
    const lz = SL.Equip.item('iluminacao'); if (lz && lz.id === 'luz_mesa') { box(c, X + W - 34, Y + 8, X + W - 31, Y + 11, dz, dz + 16, '#333333', '#444444'); cyl(c, X + W - 32, Y + 14, 5, dz + 13, dz + 18, '#e9dcb8', '#fff3cf'); }
    if (SL.Equip.item('captura')) box(c, X + 12, Y + 18, X + 26, Y + 24, dz, dz + 3, '#111111', '#1b1b1b', { tf: (c2, x, y) => { c2.fillStyle = '#ff3d81'; c2.fillRect(x + 2, y + 2, 2, 2); } });
  };
  // cadeira do computador (desenhada à parte, para o personagem sentar entre o assento e o encosto)
  const drawChair = (c, o, ps) => {
    const G = SL.G; const chair = D.furnById(G.home.items.cadeira) || { tier: 0 }; const tr = chair.tier || 0;
    const col = ['#e4e4ea', '#5a6070', '#1d1d24', '#3a3f4f'][tr];
    const sitting = ps && ps.host === 'mesa';
    const cx = (o.use[0] + 0.5) * T, cy = (o.use[1] + 0.5) * T + (sitting ? 2 : 13);
    if (tr) cyl(c, cx, cy, 10, 0, 2, '#1b1b1f', '#2a2a30');
    box(c, cx - 2, cy - 2, cx + 2, cy + 2, 0, 13, '#222222', '#2a2a2a');
    box(c, cx - 11, cy - 9, cx + 11, cy + 8, 13, 17, sh(col, -0.1), col);
    if (sitting) person(c, G.player.look, ps.x, ps.y, ps.ang, { sit: true, type: ps.type, t: performance.now() / 1000 });
    const bh = [32, 40, 50, 46][tr];
    box(c, cx - 11, cy + 8, cx + 11, cy + 12, 15, bh, sh(col, -0.05), sh(col, 0.08), { front: 'S', ff: (c2, fp) => { if (tr === 2) fq(c2, fp, 0.42, 0.58, 18, bh - 2, '#d8432f'); } });
    if (tr >= 1) { box(c, cx - 13, cy - 6, cx - 10, cy + 7, 17, 24, '#222222', '#2c2c2c'); box(c, cx + 10, cy - 6, cx + 13, cy + 7, 17, 24, '#222222', '#2c2c2c'); }
  };

  // ---------- personagem visto de cima ----------
  const person = (c, L0, x, y, ang, o) => {
    o = o || {};
    const L = o.nude ? Object.assign({}, L0, { shirt: L0.skin, pants: L0.skin, acc: L0.acc === 2 ? 0 : L0.acc }) : L0;
    const walk = o.walk || 0, sw = Math.sin(walk);
    const sit = !!o.sit; const zs = sit ? 22 : 31;
    atZ(c, sit ? 14 : 0.5, () => { c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x + 2, y + 3, 11.5, 10, 0, 0, 7); c.fill(); });
    atZ(c, sit ? 17 : 6, () => {
      c.translate(x, y); c.rotate(ang);
      const pc = sh(L.pants, -0.04), shoe = '#1f1f24';
      if (sit) {
        const pd = o.pedal ? Math.sin(o.pedal * 9) * 3 : 0;
        c.fillStyle = pc; rr(c, -1, -7.5, 15 + pd, 6.4, 3); c.fill(); rr(c, -1, 1.1, 15 - pd, 6.4, 3); c.fill();
        c.fillStyle = shoe; c.beginPath(); c.ellipse(15 + pd, -4.3, 3.4, 2.8, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(15 - pd, 4.3, 3.4, 2.8, 0, 0, 7); c.fill();
      } else {
        const a = sw * 7.5;
        c.fillStyle = pc; c.beginPath(); c.ellipse(a * 0.5, -4.2, 5.5, 3.3, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(-a * 0.5, 4.2, 5.5, 3.3, 0, 0, 7); c.fill();
        c.fillStyle = shoe; c.beginPath(); c.ellipse(a + 2.5, -4.2, 3.6, 2.7, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(-a + 2.5, 4.2, 3.6, 2.7, 0, 0, 7); c.fill();
      }
    });
    if (L.hair === 5) atZ(c, zs + 2, () => { c.translate(x, y); c.rotate(ang); c.fillStyle = sh(L.hairColor, -0.1); c.beginPath(); c.ellipse(-6, 0, 5.5, 8.5, 0, 0, 7); c.fill(); });
    atZ(c, zs, () => {
      c.translate(x, y); c.rotate(ang);
      const typing = o.type ? Math.sin((o.t || 0) * 22) * 1.2 : 0;
      const arm = sit ? 0 : -sw * 6.5;
      const hand = (hx, hy) => { c.fillStyle = L.skin; c.beginPath(); c.arc(hx, hy, 2.9, 0, 7); c.fill(); };
      c.fillStyle = L.shirt;
      if (o.hold) {
        c.beginPath(); c.ellipse(4, -8.5, 5.5, 3.4, 0.4, 0, 7); c.fill(); c.beginPath(); c.ellipse(4, 8.5, 5.5, 3.4, -0.4, 0, 7); c.fill();
        hand(9.5, -5.5); hand(9.5, 5.5); holdItem(c, o.hold);
      } else if (sit && (o.type || o.eat || o.pedal)) {
        c.beginPath(); c.ellipse(4, -9.5, 5.5, 3.4, 0.35, 0, 7); c.fill(); c.beginPath(); c.ellipse(4, 9.5, 5.5, 3.4, -0.35, 0, 7); c.fill();
        hand(10 + typing, -6.5); hand(10 - typing, 6.5);
      } else {
        c.beginPath(); c.ellipse(arm * 0.4, -10.5, 4.4, 3.8, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(-arm * 0.4, 10.5, 4.4, 3.8, 0, 0, 7); c.fill();
        hand(arm + 1.5, -11.2); hand(-arm + 1.5, 11.2);
      }
      c.fillStyle = sh(L.shirt, -0.16); c.beginPath(); c.ellipse(0, 0, 7.6, 11.6, 0, 0, 7); c.fill();
      c.fillStyle = L.shirt; c.beginPath(); c.ellipse(0.6, 0, 6.6, 10.6, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.ellipse(-1, -3, 3, 5, 0, 0, 7); c.fill();
    });
    if (o.nude) atZ(c, zs + 2, () => { c.translate(x, y); c.rotate(ang); censura(c, L.skin, sit, o.t || 0); });
    atZ(c, zs + 7, () => { c.translate(x, y); c.rotate(ang); head(c, L); });
  };
  // mosaico de censura (como nos jogos de simulação): quadradinhos da cor da pele que tremem
  const censura = (c, skin, sit, t) => {
    const cell = 3.4, fr = Math.floor(t * 5); const x0 = -9, x1 = sit ? 16 : 9, y0 = -11, y1 = 11;
    for (let i = 0; x0 + i * cell < x1; i++) for (let j = 0; y0 + j * cell < y1; j++) {
      const v = (hv(i + fr, j, 3) - 0.5) * 0.34; c.fillStyle = sh(skin, v); c.fillRect(x0 + i * cell, y0 + j * cell, cell + 0.3, cell + 0.3);
    }
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.6; c.strokeRect(x0, y0, x1 - x0, y1 - y0);
  };
  // o que o personagem leva nas mãos durante uma sequência
  const holdItem = (c, k) => {
    if (k === 'prato') { c.fillStyle = '#f4f4f4'; c.beginPath(); c.arc(13, 0, 6.2, 0, 7); c.fill(); c.fillStyle = '#c86f3c'; c.beginPath(); c.arc(13, 0, 3.8, 0, 7); c.fill(); c.fillStyle = '#7fb04a'; c.beginPath(); c.arc(11.6, -1.4, 1.4, 0, 7); c.fill(); }
    else if (k === 'copo') { c.fillStyle = '#d8eef8'; c.beginPath(); c.arc(12, 0, 3.4, 0, 7); c.fill(); c.fillStyle = '#e07a3a'; c.beginPath(); c.arc(12, 0, 2.4, 0, 7); c.fill(); }
    else if (k === 'caneca') { c.fillStyle = '#efe9e0'; c.beginPath(); c.arc(12, 0, 3.6, 0, 7); c.fill(); c.fillStyle = '#5a3420'; c.beginPath(); c.arc(12, 0, 2.6, 0, 7); c.fill(); }
    else { c.fillStyle = '#c9a26a'; rr(c, 8.5, -5, 9, 10, 1.5); c.fill(); c.fillStyle = '#e74c3c'; c.fillRect(8.5, -1, 9, 2); }
  };
  const head = (c, L) => {
    const hc = L.hairColor;
    c.fillStyle = sh(L.skin, -0.08); c.beginPath(); c.arc(0.4, -6.3, 1.9, 0, 7); c.fill(); c.beginPath(); c.arc(0.4, 6.3, 1.9, 0, 7); c.fill();
    c.fillStyle = L.skin; c.beginPath(); c.arc(1, 0, 6.6, 0, 7); c.fill();
    c.fillStyle = sh(L.skin, -0.12); c.beginPath(); c.arc(7.2, 0, 1.3, 0, 7); c.fill();
    c.fillStyle = hc;
    const circle = (x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
    switch (L.hair) {
      case 0: c.globalAlpha = 0.45; circle(-0.6, 0, 6.3); c.globalAlpha = 1; break;
      case 1: circle(-1.3, 0, 6.5); break;
      case 2: circle(-1.4, 0, 6.4); c.fillStyle = sh(hc, 0.15); c.beginPath(); c.ellipse(3.2, -1, 3.6, 3.2, 0.3, 0, 7); c.fill(); break;
      case 3: circle(-1.2, 0, 5.4); for (let i = 0; i < 9; i++) { const a = Math.PI * 0.55 + i / 8 * Math.PI * 0.9; circle(Math.cos(a) * 5.4 - 1, Math.sin(a) * 5.4, 2.7); } circle(1.5, -4.8, 2.4); circle(1.5, 4.8, 2.4); break;
      case 4: circle(-1.6, 0, 6.9); c.beginPath(); c.ellipse(1, -5.8, 3.8, 2.1, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(1, 5.8, 3.8, 2.1, 0, 0, 7); c.fill(); break;
      case 5: circle(-1.6, 0, 6.9); c.beginPath(); c.ellipse(1, -6, 4.2, 2.2, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(1, 6, 4.2, 2.2, 0, 0, 7); c.fill(); break;
      case 6: circle(-1.3, 0, 6.5); c.fillStyle = sh(hc, -0.1); c.beginPath(); c.ellipse(-8.6, 0, 4, 2.6, 0, 0, 7); c.fill(); break;
      case 7: circle(-1.4, 0, 9); break;
      case 8: circle(-1.2, 0, 6.5); c.fillStyle = sh(hc, 0.1); circle(-5.6, 0, 3.4); break;
      default: circle(-1.3, 0, 6.5);
    }
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(-2, -2.4, 2.6, 0, 7); c.fill();
    if (L.acc === 1) { c.strokeStyle = '#1b1b1f'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(6, -4.6); c.lineTo(6, 4.6); c.stroke(); c.fillStyle = 'rgba(160,210,255,.55)'; c.fillRect(6.3, -4, 1.1, 3); c.fillRect(6.3, 1, 1.1, 3); }
    if (L.acc === 2) { c.fillStyle = '#1d2230'; c.beginPath(); c.arc(-0.4, 0, 7, 0, 7); c.fill(); c.fillStyle = '#2b3348'; c.beginPath(); c.ellipse(6.6, 0, 3.8, 5.6, 0, 0, 7); c.fill(); c.fillStyle = '#ff5a36'; c.beginPath(); c.arc(-0.4, 0, 1.4, 0, 7); c.fill(); }
    if (L.acc === 3) { c.strokeStyle = '#18181c'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -7.2); c.quadraticCurveTo(-2.5, 0, 0, 7.2); c.stroke(); c.fillStyle = '#18181c'; rr(c, -2.4, -9.6, 5, 3.6, 1.5); c.fill(); rr(c, -2.4, 6, 5, 3.6, 1.5); c.fill(); }
  };
  // deitado (cama ou chão): rosto para cima
  const lyingHead = (c, L, x, y, reading) => {
    c.fillStyle = L.hairColor; c.beginPath(); c.ellipse(x - 2.5, y, 7.4, 7.8, 0, 0, 7); c.fill();
    c.fillStyle = L.skin; c.beginPath(); c.ellipse(x + 1, y, 6, 6.4, 0, 0, 7); c.fill();
    c.strokeStyle = '#3a2418'; c.lineWidth = 0.9;
    if (reading) { c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(x + 1, y - 2.3, 0.9, 0, 7); c.arc(x + 1, y + 2.3, 0.9, 0, 7); c.fill(); c.fillStyle = '#e8e2d0'; c.fillRect(x + 9, y - 6, 6, 12); c.fillStyle = '#7a2e3a'; c.fillRect(x + 9, y - 6, 1.4, 12); }
    else { c.beginPath(); c.moveTo(x + 1.6, y - 3.4); c.lineTo(x + 1.6, y - 1.2); c.moveTo(x + 1.6, y + 1.2); c.lineTo(x + 1.6, y + 3.4); c.stroke(); }
    c.beginPath(); c.moveTo(x + 4.4, y - 1); c.lineTo(x + 4.4, y + 1); c.stroke();
  };
  const drawCollapsed = (c, L, x, y) => {
    atZ(c, 0.5, () => { c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x + 3, y + 4, 18, 11, 0.3, 0, 7); c.fill(); });
    atZ(c, 4, () => { c.translate(x, y); c.rotate(0.3); c.fillStyle = L.pants; rr(c, 4, -7, 16, 6, 3); c.fill(); rr(c, 4, 1, 16, 6, 3); c.fill(); c.fillStyle = L.shirt; rr(c, -10, -9, 16, 18, 6); c.fill(); c.fillStyle = L.skin; c.beginPath(); c.arc(-6, -12, 2.8, 0, 7); c.arc(2, 12, 2.8, 0, 7); c.fill(); lyingHead(c, L, -17, 0); });
  };

  // ---------- lado de fora ----------
  const drawGround = c => {
    const Wd = lay.w * T, Hd = lay.h * T; const [ex] = lay.entry;
    const vx0 = V.cx - V.W / 2 / V.s - 40, vy0 = V.cy - V.H / 2 / V.s - 40, vx1 = V.cx + V.W / 2 / V.s + 40, vy1 = V.cy + V.H / 2 / V.s + 40;
    atZ(c, 0, () => {
      c.fillStyle = grass(c); c.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
      // canteiro e sombra da casa
      c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(-5, -5, Wd + 12, Hd + 12);
      c.fillStyle = '#5a4433'; c.fillRect(-14, Hd + 2, ex * T - 10, 12); c.fillRect(ex * T + T + 24, Hd + 2, Wd - ex * T - T - 10, 12);
      // calçada, meio-fio e rua
      const sy = Hd + 1.6 * T;
      c.fillStyle = '#a19d94'; c.fillRect(vx0, sy, vx1 - vx0, 1.6 * T);
      c.fillStyle = 'rgba(0,0,0,.12)'; for (let x = Math.floor(vx0 / 32) * 32; x < vx1; x += 32) c.fillRect(x, sy, 1, 1.6 * T);
      c.fillStyle = '#d7d3c9'; c.fillRect(vx0, sy + 1.6 * T - 3, vx1 - vx0, 3);
      c.fillStyle = '#2c2e34'; c.fillRect(vx0, sy + 1.6 * T, vx1 - vx0, 4.2 * T);
      c.fillStyle = 'rgba(255,255,255,.025)'; for (let i = 0; i < 40; i++) c.fillRect(vx0 + hv(i, 3) * (vx1 - vx0), sy + 1.6 * T + hv(i, 4) * 4.2 * T, 3, 2);
      c.fillStyle = '#e6d36a'; for (let x = Math.floor(vx0 / 64) * 64; x < vx1; x += 64) c.fillRect(x, sy + 3.7 * T - 1.5, 34, 3);
      c.fillStyle = '#d7d3c9'; c.fillRect(vx0, sy + 5.8 * T, vx1 - vx0, 3);
      c.fillStyle = '#a19d94'; c.fillRect(vx0, sy + 5.8 * T + 3, vx1 - vx0, 1.5 * T);
      // caminho até a porta
      c.fillStyle = '#b3aea4'; c.fillRect(ex * T + 2, Hd, T - 4, 1.6 * T + 1);
      c.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 1; i < 3; i++) c.fillRect(ex * T + 2, Hd + i * 16, T - 4, 1);
      // sombras do lado de fora (árvores, postes, carros)
      const sx = -0.6, syy = 0.55;
      props.forEach(p => { c.fillStyle = 'rgba(0,0,0,.25)'; if (p.k === 'tree') { c.beginPath(); c.ellipse(p.x + p.r * 0.5 * -sx, p.y + p.r * 0.5 * syy, p.r * 0.95, p.r * 0.85, 0, 0, 7); c.fill(); } else if (p.k === 'bush') { c.beginPath(); c.ellipse(p.x + 4, p.y + 4, p.r, p.r * 0.8, 0, 0, 7); c.fill(); } else if (p.k === 'car') { rr(c, p.x - 34, p.y - 14, 72, 32, 8); c.fill(); } });
    });
  };
  const drawProp = (c, p, t) => {
    if (p.k === 'tree') {
      box(c, p.x - 3, p.y - 3, p.x + 3, p.y + 3, 0, 40, '#5a3d26', '#6d4a2e');
      const cols = ['#2f6b2c', '#3a7d34', '#4b9440'];
      [[62, 1, 0], [72, 0.8, 1], [80, 0.55, 2]].forEach(([z, k, ci]) => atZ(c, z, () => { c.fillStyle = cols[ci]; for (let i = 0; i < 6; i++) { const a = i * 1.05 + p.i; c.beginPath(); c.arc(p.x + Math.cos(a) * p.r * 0.45 * k, p.y + Math.sin(a) * p.r * 0.45 * k, p.r * 0.55 * k, 0, 7); c.fill(); } c.fillStyle = 'rgba(255,255,255,.06)'; c.beginPath(); c.arc(p.x - p.r * 0.25 * k, p.y - p.r * 0.3 * k, p.r * 0.35 * k, 0, 7); c.fill(); }));
    } else if (p.k === 'bush') {
      [[8, '#2f6b2c'], [14, '#3f8a3a']].forEach(([z, col]) => atZ(c, z, () => { c.fillStyle = col; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(p.x + Math.cos(i * 1.6) * 6, p.y + Math.sin(i * 1.6) * 5, z === 8 ? 10 : 7, 0, 7); c.fill(); } }));
    } else if (p.k === 'lamp') {
      cyl(c, p.x, p.y, 3.5, 0, 92, '#3a3d45', '#4a4e58');
      box(c, p.x - 2, p.y, p.x + 2, p.y + 18, 88, 92, '#3a3d45', '#4a4e58');
      box(c, p.x - 5, p.y + 14, p.x + 5, p.y + 24, 84, 90, '#2a2c33', nightAlpha() > 0.1 ? '#fff2c0' : '#d8d4c8');
    } else if (p.k === 'car') {
      const x0 = p.x - 34, y0 = p.y - 14;
      box(c, x0, y0, x0 + 68, y0 + 30, 3, 16, p.col, sh(p.col, 0.08), { front: '*', ff: (c2, fp, d) => { if (d === 'S' || d === 'N') { fq(c2, fp, 0.1, 0.28, 3, 10, '#1a1a1a'); fq(c2, fp, 0.72, 0.9, 3, 10, '#1a1a1a'); } } });
      box(c, x0 + 18, y0 + 3, x0 + 50, y0 + 27, 16, 28, '#26303d', sh(p.col, 0.02), { tf: (c2, x, y, w, h) => { c2.fillStyle = 'rgba(255,255,255,.08)'; c2.fillRect(x + 3, y + 3, w - 6, 2); } });
      atZ(c, 16.2, () => { c.fillStyle = '#ffe9a8'; c.fillRect(x0 + 65, y0 + 3, 3, 6); c.fillRect(x0 + 65, y0 + 21, 3, 6); c.fillStyle = '#a32020'; c.fillRect(x0, y0 + 3, 2.5, 6); c.fillRect(x0, y0 + 21, 2.5, 6); });
      void t;
    } else if (p.k === 'bikep') {
      atZ(c, 10, () => { c.strokeStyle = '#2b2b30'; c.lineWidth = 2.5; c.beginPath(); c.arc(p.x - 10, p.y, 7, 0, 7); c.arc(p.x + 10, p.y, 7, 0, 7); c.stroke(); c.strokeStyle = '#ff5a36'; c.beginPath(); c.moveTo(p.x - 10, p.y); c.lineTo(p.x, p.y); c.lineTo(p.x + 10, p.y); c.stroke(); });
    }
  };

  // ---------- luzes ----------
  // sol entrando pelas janelas (no Brasil o sol fica ao norte), desenhado logo depois do piso
  const sunPass = c => {
    const dk = dayK(); if (dk <= 0.01) return;
    atZ(c, 0, () => {
      const h = hour(); const skew = (12.5 - h) * 7;
      walls.forEach(w => { if (!w.win || w.y !== 0) return; const x0 = w.x * T + 4, x1 = w.x * T + T - 4, y0 = T, y1 = T + 2.8 * T; const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(255,236,190,' + (0.2 * dk) + ')'); g.addColorStop(1, 'rgba(255,236,190,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y0); c.lineTo(x1 + skew, y1); c.lineTo(x0 + skew, y1); c.closePath(); c.fill(); });
    });
  };
  const lightPass = (c, t) => {
    const na = nightAlpha(); const G = SL.G;
    const a = G.act; const sleeping = a && SL.Life.ACT[a.id] && SL.Life.ACT[a.id].sleep;
    const pcOn = (a && SL.Life.ACT[a.id] && SL.Life.ACT[a.id].pc) || !!(SL.Live && SL.Live.cur);
    const tvOn = a && (a.id === 'tv' || a.id === 'videogame');
    if (na <= 0.01) return;
    if (!lc) lc = document.createElement('canvas');
    const q = 0.5; const w = Math.max(2, Math.ceil(V.W * q)), h = Math.max(2, Math.ceil(V.H * q)); if (lc.width !== w || lc.height !== h) { lc.width = w; lc.height = h; }
    const x = lc.getContext('2d'); x.setTransform(q, 0, 0, q, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, V.W, V.H);
    x.fillStyle = 'rgba(6,9,28,' + na + ')'; x.fillRect(0, 0, V.W, V.H);
    x.globalCompositeOperation = 'destination-out';
    const cur = H.currentRoom();
    const hole = (cx, cy, r, k) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(0,0,0,' + k + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); };
    if (!sleeping) lay.rooms.forEach(r => {
      const k = r.id === cur ? 0.94 : 0.62;
      const a0 = P(r.x * T, r.y * T, 0), b0 = P((r.x + r.w) * T, (r.y + r.h) * T, 0), a1 = P(r.x * T, r.y * T, WALLZ), b1 = P((r.x + r.w) * T, (r.y + r.h) * T, WALLZ);
      const x0 = Math.min(a0[0], a1[0]), y0 = Math.min(a0[1], a1[1]), x1 = Math.max(b0[0], b1[0]), y1 = Math.max(b0[1], b1[1]);
      if (x1 < 0 || y1 < 0 || x0 > V.W || y0 > V.H) return;
      const cen = P((r.x + r.w / 2) * T, (r.y + r.h / 2) * T, WALLZ);
      const rad = Math.hypot(x1 - x0, y1 - y0) * 0.6;
      const g = x.createRadialGradient(cen[0], cen[1], rad * 0.15, cen[0], cen[1], rad); g.addColorStop(0, 'rgba(0,0,0,' + k + ')'); g.addColorStop(1, 'rgba(0,0,0,' + (k * 0.6) + ')');
      x.save(); x.beginPath(); x.rect(x0, y0, x1 - x0, y1 - y0); x.clip(); x.fillStyle = g; x.fillRect(x0, y0, x1 - x0, y1 - y0); x.restore();
    });
    const desk = ob('mesa'); const tv = ob('tv');
    if (pcOn && desk) { const p = P((desk.x + desk.w / 2) * T, (desk.y + 1.2) * T, 30); hole(p[0], p[1], 120 * V.s / 2, 0.75); }
    if (tvOn && tv) { const p = P((tv.x + tv.w / 2) * T, (tv.y + 1.6) * T, 30); hole(p[0], p[1], 150 * V.s / 2, 0.75); }
    objs.forEach(o => { if (o.kind === 'luminaria') { const p = P(o.x * T + 16, o.y * T + 16, 46); hole(p[0], p[1], 110 * V.s / 2, 0.9); } if (o.kind === 'neon') { const p = P(o.x * T + 16, (o.y + 1) * T + 8, 34); hole(p[0], p[1], 70 * V.s / 2, 0.7); } });
    props.forEach(p => { if (p.k === 'lamp') { const q2 = P(p.x, p.y + 20, 0); hole(q2[0], q2[1], 150 * V.s / 2, 0.85); } });
    c.drawImage(lc, 0, 0, V.W, V.H);
    // brilhos coloridos
    c.save(); c.globalCompositeOperation = 'lighter';
    const glow = (wx, wy, wz, r, col, al) => { const p = P(wx, wy, wz); const rr0 = r * V.s; const g = c.createRadialGradient(p[0], p[1], 1, p[0], p[1], rr0); g.addColorStop(0, U.rgba(col, al)); g.addColorStop(1, U.rgba(col, 0)); c.fillStyle = g; c.fillRect(p[0] - rr0, p[1] - rr0, rr0 * 2, rr0 * 2); };
    if (pcOn && desk) glow((desk.x + desk.w / 2) * T, (desk.y + 1) * T, 30, 70, (SL.Live && SL.Live.cur) || (a && a.id === 'live') ? '#b04cff' : '#6f86ff', na * 0.55);
    if (tvOn && tv) glow((tv.x + tv.w / 2) * T, (tv.y + 1.5) * T, 30, 90, '#7fb3ff', na * 0.5);
    if (G.home.deco.includes('led')) { const er = lay.rooms.find(r => r.id === 'escritorio'); if (er) glow((er.x + er.w / 2) * T, er.y * T + 12, 54, er.w * 16, '#' + ['c77dff', '7dd3ff', 'ff7ab0'][Math.floor(t / 3) % 3], na * 0.45); }
    objs.forEach(o => { if (o.kind === 'luminaria') glow(o.x * T + 16, o.y * T + 16, 46, 60, '#ffd28a', na * 0.5); if (o.kind === 'neon') glow(o.x * T + 16, (o.y + 1) * T + 4, 34, 40, '#ff3d81', na * 0.7); });
    const lz = SL.Equip.item('iluminacao'); if (lz && pcOn && desk) glow((desk.x + desk.w / 2) * T, (desk.y + 1.6) * T, 40, 60, '#fff6dc', 0.15 + na * 0.3);
    props.forEach(p => { if (p.k === 'lamp') glow(p.x, p.y + 20, 86, 60, '#ffe6a0', na * 0.6); });
    c.restore();
  };

  // ---------- quadro ----------
  H.render = (c, cw, chh, t) => {
    if (!grid) H.build();
    const G = SL.G;
    const dt = Math.min(0.1, Math.max(0, t - lastT)); lastT = t;
    V.W = cw; V.H = chh;
    V.s = U.clamp(Math.min(cw / (17 * T), chh / (10.5 * T)), 1, 2.5) * V.zoom;
    // câmera
    const ps = pose();
    const fx = ps && ps.x != null ? ps.x : ch.x, fy = ps && ps.y != null ? ps.y : ch.y;
    const vw = cw / V.s, vh = chh / V.s, mW = lay.w * T, mH = lay.h * T, mg = 1.5 * T;
    let tx = fx + Math.cos(ch.ang) * (ch.moving ? 26 : 0), ty = fy + Math.sin(ch.ang) * (ch.moving ? 22 : 0);
    tx = vw >= mW + 2 * mg ? mW / 2 : U.clamp(tx, vw / 2 - mg, mW - vw / 2 + mg);
    ty = vh >= mH + 2 * mg + 3 * T ? mH / 2 + 1.5 * T : U.clamp(ty, vh / 2 - mg, mH - vh / 2 + mg + 3 * T);
    if (V.snap) { V.cx = tx; V.cy = ty; V.snap = false; } else { const k = 1 - Math.exp(-dt * 5); V.cx += (tx - V.cx) * k; V.cy += (ty - V.cy) * k; }
    const fk = Math.round(G.home.dirt / 8) + ':' + G.home.deco.length + ':' + G.home.id;
    if (!floorCv || floorKey !== fk) { floorKey = fk; buildFloor(); }
    c.fillStyle = '#0b0d12'; c.fillRect(0, 0, cw, chh);
    drawGround(c);
    atZ(c, 0, () => c.drawImage(floorCv, 0, 0, lay.w * T, lay.h * T));
    sunPass(c);
    hits = [];
    // tudo o que tem altura, do mais longe da câmera para o mais perto
    const dist = (x0, y0, x1, y1) => { const dx = Math.max(x0 - V.cx, 0, V.cx - x1), dy = Math.max(y0 - V.cy, 0, V.cy - y1); return dx * dx + dy * dy; };
    const vx0 = V.cx - vw / 2 - 2 * T, vy0 = V.cy - vh / 2 - 2 * T, vx1 = V.cx + vw / 2 + 2 * T, vy1 = V.cy + vh / 2 + 2 * T;
    const inView = (x0, y0, x1, y1) => x1 > vx0 && x0 < vx1 && y1 > vy0 && y0 < vy1;
    const list = [];
    walls.forEach(w => { const x0 = w.x * T, y0 = w.y * T; if (inView(x0, y0, x0 + T, y0 + T)) list.push({ d: dist(x0, y0, x0 + T, y0 + T), w }); });
    doors.forEach(d => { const x0 = d.x * T, y0 = d.y * T; list.push({ d: dist(x0, y0, x0 + T, y0 + T) - 1, door: d }); });
    objs.forEach(o => { if (o.flat || o.glow || o.wall || o.kind === 'porta') return; const x0 = o.x * T, y0 = o.y * T, x1 = x0 + o.w * T, y1 = y0 + o.h * T; if (!inView(x0, y0, x1, y1)) return; list.push({ d: dist(x0, y0, x1, y1), o }); });
    const desk = ob('mesa'); if (desk && desk.use) { const cx = (desk.use[0] + 0.5) * T, cy = (desk.use[1] + 0.5) * T; list.push({ d: dist(cx - 11, cy - 7, cx + 11, cy + 14), chair: desk }); }
    const hosted = ps && ps.host && ps.host !== 'chao';
    const showChar = !hosted && !(ps && ps.floor);
    if (showChar) { const dd = Math.sqrt(dist(ch.x - 6, ch.y - 6, ch.x + 6, ch.y + 6)); list.push({ d: Math.max(0, dd - 16) ** 2, me: true }); }
    list.sort((a, b) => b.d - a.d);
    if (ps && ps.floor) drawCollapsed(c, G.player.look, ps.x, ps.y);
    list.forEach(e => {
      if (e.w) { const r = e.w.r; hits.push(bboxOf(r[0], r[1], r[2], r[3], 0, WALLZ).concat(null)); drawWall(c, e.w); }
      else if (e.door) drawDoor(c, e.door);
      else if (e.o) { drawObj(c, e.o, t, ps); const o = e.o; hits.push(bboxOf(o.x * T, o.y * T, (o.x + o.w) * T, (o.y + o.h) * T, 0, Math.min(o.z, 56)).concat(o)); }
      else if (e.chair) { drawChair(c, e.chair, ps); const cx = (e.chair.use[0] + 0.5) * T, cy = (e.chair.use[1] + 0.5) * T; hits.push(bboxOf(cx - 11, cy - 9, cx + 11, cy + 12, 0, 40).concat(e.chair)); }
      else if (e.me) person(c, G.player.look, ch.x, ch.y, ch.ang, { walk: ch.moving ? ch.ph : 0, hold: SL.Seq && SL.Seq.holding });
    });
    drawWallTops(c);
    // árvores, postes e carros (mais altos que as paredes)
    props.filter(p => inView(p.x - 60, p.y - 60, p.x + 60, p.y + 60)).sort((a, b) => dist(b.x, b.y, b.x, b.y) - dist(a.x, a.y, a.x, a.y)).forEach(p => drawProp(c, p, t));
    lightPass(c, t);
    // zzz de quem dorme
    if (ps && (ps.sleep || ps.floor) && !ps.reading) {
      const b = ob('cama'); const bx = ps.floor ? ps.x : b ? b.x * T + 14 : ch.x, by = ps.floor ? ps.y : b ? b.y * T + 20 : ch.y;
      for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i / 3) % 1; const p = P(bx + ph * 18, by - ph * 10, 26 + ph * 40); c.globalAlpha = 1 - ph; c.font = '800 ' + Math.round(9 + ph * 8) + 'px Sora, Arial'; c.fillStyle = '#d8d0ff'; c.fillText('z', p[0], p[1]); }
      c.globalAlpha = 1;
    }
    // nome dos móveis por perto (o mais perto ganha o botão E, desenhado fora do canvas)
    nearPos = null; labels = [];
    if (!G.act || G.act.id === 'usar_pc') {
      const used = [];
      const tag = (o, main) => {
        const p = P((o.x + o.w / 2) * T, (o.y + o.h / 2) * T, Math.min(o.z, 56) + 10);
        if (main) { nearPos = { x: p[0], y: p[1] }; return; }
        c.font = '600 11px Inter, Arial'; const tw = c.measureText(o.label).width + 14; const x = Math.round(p[0] - tw / 2), y = Math.round(p[1] - 22);
        if (used.some(r => x < r[2] && x + tw > r[0] && y < r[3] && y + 19 > r[1])) return; used.push([x, y, x + tw, y + 19]);
        const d = Math.hypot((o.x + o.w / 2) * T - ch.x, (o.y + o.h / 2) * T - ch.y); c.globalAlpha = U.clamp(1.25 - d / 150, 0.25, 0.9);
        c.fillStyle = 'rgba(12,14,20,.82)'; rr(c, x, y, tw, 19, 9); c.fill(); c.fillStyle = '#e9e6f6'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.label, x + tw / 2, y + 10); c.globalAlpha = 1;
      };
      if (near) tag(near, true);
      objs.filter(o => o !== near && !o.glow && !o.flat && Math.hypot((o.x + o.w / 2) * T - ch.x, (o.y + o.h / 2) * T - ch.y) < 150 + Math.max(o.w, o.h) * 12).forEach(o => tag(o, false));
      c.textBaseline = 'alphabetic';
    }
    // nome do cômodo ao entrar
    const room = H.currentRoom();
    if (room !== lastRoom) { lastRoom = room; const r = lay.rooms.find(q => q.id === room); if (r) banner = { name: r.name, t }; }
    const bt = t - banner.t;
    if (bt < 2.6 && banner.name) {
      const al = bt < 0.35 ? bt / 0.35 : bt > 2 ? (2.6 - bt) / 0.6 : 1;
      c.save(); c.globalAlpha = al; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
      c.font = '800 26px Sora, Arial'; c.lineWidth = 5; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(banner.name.toUpperCase(), cw - 22, chh - 74); c.fillStyle = '#f5f2ff'; c.fillText(banner.name.toUpperCase(), cw - 22, chh - 74);
      c.font = '600 11px Inter, Arial'; c.fillStyle = 'rgba(230,225,255,.75)'; c.fillText(D.homeById(G.home.id).name, cw - 22, chh - 56);
      c.restore();
    }
    // cansaço: bordas escurecem e as pálpebras pesam
    const tl = SL.Life.tiredLevel ? SL.Life.tiredLevel() : 0;
    if (tl >= 2 && !(ps && (ps.sleep || ps.floor))) {
      const g = c.createRadialGradient(cw / 2, chh / 2, Math.min(cw, chh) * 0.3, cw / 2, chh / 2, Math.max(cw, chh) * 0.72);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + (tl >= 3 ? 0.62 : 0.4) + ')'); c.fillStyle = g; c.fillRect(0, 0, cw, chh);
      if (tl >= 3) { const bl = Math.max(0, Math.sin(t * 0.9) - 0.93) * 14; if (bl > 0) { c.fillStyle = 'rgba(0,0,0,' + Math.min(0.85, bl) + ')'; c.fillRect(0, 0, cw, chh); } }
    }
  };
})(window.SL);

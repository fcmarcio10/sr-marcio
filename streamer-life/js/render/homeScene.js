/* A casa em 2D vista de cima (3/4): cômodos, móveis e equipamentos comprados, personagem que anda e usa os objetos. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, A = SL.Avatar;
  const H = SL.HomeScene = {};
  const T = 32, WH = 26; // tamanho do piso e altura da parede
  const rr = (c, x, y, w, h, r) => A.rr(c, x, y, w, h, r);

  // plantas: cômodos (retângulos internos em casas), portas, saída, objetos (x, y, w, h e casa de uso)
  const LAY = {
    A: {
      w: 22, h: 13,
      rooms: [{ id: 'quarto', name: 'Quarto', x: 1, y: 1, w: 7, h: 5, floor: 'wood' }, { id: 'escritorio', name: 'Escritório', x: 9, y: 1, w: 6, h: 5, floor: 'wood2' }, { id: 'banheiro', name: 'Banheiro', x: 16, y: 1, w: 5, h: 5, floor: 'tile' }, { id: 'sala', name: 'Sala', x: 1, y: 7, w: 11, h: 5, floor: 'wood' }, { id: 'cozinha', name: 'Cozinha', x: 13, y: 7, w: 8, h: 5, floor: 'tile2' }],
      doors: [[4, 6], [10, 6], [18, 6], [12, 9], [8, 3]], entry: [6, 12],
      objs: { cama: [1, 1, 3, 2, 2, 3], mesa: [10, 1, 4, 1, 11, 2], luz: [14, 1, 1, 1], bike: [14, 4, 1, 1, 13, 4], chuveiro: [19, 1, 2, 2, 19, 3], vaso: [16, 1, 1, 1], pia_b: [16, 4, 1, 1, 17, 4], geladeira: [20, 7, 1, 1, 19, 8], fogao: [17, 7, 2, 1, 17, 8], pia: [15, 7, 2, 1, 15, 8], cafeteira: [14, 7, 1, 1, 14, 8], sofa: [5, 10, 4, 1, 6, 9], tv: [6, 7, 2, 1, 6, 9], armario: [20, 10, 1, 2, 19, 11], porta: [6, 12, 1, 1, 6, 11], guarda: [6, 1, 2, 1], mesa_jantar: [15, 10, 2, 1, 15, 9] },
      decoWall: [[2, 'quarto'], [12, 'escritorio'], [3, 'sala'], [9, 'sala'], [5, 'quarto']], decoFloor: [[7, 5], [1, 11], [11, 11], [13, 11], [9, 5], [1, 5]], windows: [[3, 0], [17, 0], [8, 6, 'x'], [2, 6, 'x']], start: [5, 4],
    },
    B: {
      w: 28, h: 15,
      rooms: [{ id: 'quarto', name: 'Quarto', x: 1, y: 1, w: 9, h: 6, floor: 'wood' }, { id: 'escritorio', name: 'Escritório', x: 11, y: 1, w: 8, h: 6, floor: 'wood2' }, { id: 'banheiro', name: 'Banheiro', x: 20, y: 1, w: 7, h: 5, floor: 'tile' }, { id: 'sala', name: 'Sala', x: 1, y: 8, w: 14, h: 6, floor: 'wood' }, { id: 'cozinha', name: 'Cozinha', x: 16, y: 7, w: 11, h: 7, floor: 'tile2' }],
      doors: [[5, 7], [13, 7], [23, 6], [15, 10], [10, 3], [14, 7]], entry: [8, 14],
      objs: { cama: [1, 1, 3, 2, 2, 3], mesa: [12, 1, 5, 1, 14, 2], luz: [18, 1, 1, 1], bike: [17, 5, 1, 1, 16, 5], chuveiro: [24, 1, 2, 2, 24, 3], vaso: [20, 1, 1, 1], pia_b: [20, 4, 1, 1, 21, 4], geladeira: [26, 7, 1, 1, 25, 8], fogao: [22, 7, 2, 1, 22, 8], pia: [19, 7, 2, 1, 19, 8], cafeteira: [18, 7, 1, 1, 18, 8], sofa: [5, 12, 5, 1, 7, 11], tv: [6, 8, 3, 1, 7, 11], armario: [26, 12, 1, 2, 25, 13], porta: [8, 14, 1, 1, 8, 13], guarda: [7, 1, 2, 1], mesa_jantar: [20, 11, 3, 1, 20, 10] },
      decoWall: [[3, 'quarto'], [15, 'escritorio'], [3, 'sala'], [11, 'sala'], [6, 'quarto'], [17, 'escritorio'], [18, 'cozinha']], decoFloor: [[9, 6], [1, 13], [13, 13], [16, 13], [11, 6], [1, 6], [10, 9], [26, 10], [18, 6], [3, 13]], windows: [[4, 0], [21, 0], [12, 0, 'x'], [10, 7, 'x'], [3, 7, 'x']], start: [6, 4],
    },
    C: {
      w: 34, h: 17,
      rooms: [{ id: 'quarto', name: 'Quarto', x: 1, y: 1, w: 9, h: 7, floor: 'wood' }, { id: 'escritorio', name: 'Escritório', x: 11, y: 1, w: 8, h: 7, floor: 'wood2' }, { id: 'estudio', name: 'Estúdio', x: 20, y: 1, w: 13, h: 7, floor: 'studio' }, { id: 'banheiro', name: 'Banheiro', x: 1, y: 9, w: 6, h: 7, floor: 'tile' }, { id: 'sala', name: 'Sala', x: 8, y: 9, w: 13, h: 7, floor: 'wood' }, { id: 'cozinha', name: 'Cozinha', x: 22, y: 9, w: 11, h: 7, floor: 'tile2' }],
      doors: [[10, 4], [19, 4], [5, 8], [14, 8], [26, 8], [7, 12], [21, 12]], entry: [14, 16],
      objs: { cama: [1, 1, 3, 2, 2, 3], mesa: [12, 1, 5, 1, 14, 2], luz: [18, 1, 1, 1], bike: [11, 6, 1, 1, 12, 6], chuveiro: [3, 9, 2, 2, 3, 11], vaso: [1, 9, 1, 1], pia_b: [1, 13, 1, 1, 2, 13], geladeira: [32, 9, 1, 1, 31, 10], fogao: [28, 9, 2, 1, 28, 10], pia: [25, 9, 2, 1, 25, 10], cafeteira: [24, 9, 1, 1, 24, 10], sofa: [11, 14, 5, 1, 13, 13], tv: [12, 9, 3, 1, 13, 13], armario: [32, 14, 1, 2, 31, 15], porta: [14, 16, 1, 1, 14, 15], guarda: [7, 1, 2, 1], mesa_jantar: [26, 13, 3, 1, 26, 12], estudio: [22, 2, 9, 4, 26, 6] },
      decoWall: [[3, 'quarto'], [15, 'escritorio'], [10, 'sala'], [17, 'sala'], [6, 'quarto'], [24, 'estudio'], [29, 'estudio'], [25, 'cozinha']], decoFloor: [[9, 7], [8, 15], [20, 15], [22, 15], [18, 7], [1, 7], [9, 10], [32, 12], [6, 15], [1, 15], [20, 10], [11, 10], [19, 15], [8, 10]], windows: [[4, 0], [14, 0, 'x'], [24, 0], [29, 0], [3, 8, 'x'], [27, 8, 'x']], start: [6, 5],
    },
  };
  H.LAY = LAY;
  const FLOORS = { wood: ['#5b4434', '#634a39', '#3e2e23'], wood2: ['#4b4a5a', '#535265', '#363545'], tile: ['#c9d3da', '#b9c4cc', '#9aa6ae'], tile2: ['#d8cdb8', '#cbbfa8', '#a99c86'], studio: ['#2a2d3a', '#30334a', '#1e2130'] };
  const WALL_TOP = '#2c3142', WALL_FACE = ['#7d7a9a', '#6c6988'], WALL_FACE_MAE = ['#c9a07a', '#b48c68'];

  let grid = null, lay = null, objs = [], ch = null, hover = null, onArrive = null, cam = { s: 1, ox: 0, oy: 0 };
  H.cam = cam;

  H.build = () => {
    const G = SL.G; const home = D.homeById(G.home.id); lay = LAY[home.layout];
    grid = [];
    for (let y = 0; y < lay.h; y++) { grid[y] = []; for (let x = 0; x < lay.w; x++) grid[y][x] = { t: 'wall', room: null }; }
    lay.rooms.forEach(r => { for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) grid[y][x] = { t: 'floor', room: r.id }; });
    lay.doors.forEach(([x, y]) => { grid[y][x] = { t: 'door', room: null }; });
    const [ex, ey] = lay.entry; grid[ey][ex] = { t: 'exit', room: null };
    // objetos
    objs = [];
    const add = (id, kind, label, item) => { const o = lay.objs[id]; if (!o) return; objs.push({ id, kind, label, item, x: o[0], y: o[1], w: o[2], h: o[3], use: o.length > 4 ? [o[4], o[5]] : null }); };
    const it = G.home.items;
    add('cama', 'cama', (D.furnById(it.cama) || {}).name || 'Cama', it.cama);
    add('mesa', 'mesa', 'Computador', it.mesa);
    if (SL.Equip.item('iluminacao') || (G.equip.setup.iluminacao)) add('luz', 'luz', (D.equipById(G.equip.setup.iluminacao) || {}).name || 'Luz', G.equip.setup.iluminacao);
    if (it.bike) add('bike', 'bike', 'Bicicleta ergométrica', it.bike);
    add('chuveiro', 'chuveiro', (D.furnById(it.chuveiro) || {}).name || 'Chuveiro', it.chuveiro);
    add('vaso', 'vaso', 'Vaso sanitário'); add('pia_b', 'pia_b', 'Pia do banheiro');
    add('geladeira', 'geladeira', (D.furnById(it.geladeira) || {}).name || 'Geladeira', it.geladeira);
    add('fogao', 'fogao', (D.furnById(it.fogao) || {}).name || 'Fogão', it.fogao);
    add('pia', 'pia', 'Pia da cozinha');
    if (it.cafeteira) add('cafeteira', 'cafeteira', 'Cafeteira', it.cafeteira);
    if (it.sofa) add('sofa', 'sofa', (D.furnById(it.sofa) || {}).name, it.sofa);
    if (it.tv || G.equip.setup.console) add('tv', 'tv', it.tv ? (D.furnById(it.tv) || {}).name : 'Console', it.tv);
    add('armario', 'armario', 'Armário de limpeza'); add('porta', 'porta', 'Porta de saída'); add('guarda', 'guarda', 'Guarda-roupa');
    add('mesa_jantar', 'mesa_jantar', 'Mesa de refeições');
    if (lay.objs.estudio) add('estudio', 'estudio', G.home.studio ? 'Estúdio profissional' : 'Cômodo vazio (obra)');
    // decoração
    let wi = 0, fi = 0;
    G.home.deco.forEach((id, idx) => {
      const f = D.furnById(id); if (!f) return;
      if (['quadro', 'poster', 'neon'].includes(f.kind)) { const s = lay.decoWall[wi++]; if (!s) return; const r = lay.rooms.find(q => q.id === s[1]); objs.push({ id: 'deco' + idx, kind: f.kind, label: f.name, wall: true, x: s[0], y: r.y - 1, w: 1, h: 1, deco: idx }); }
      else if (f.kind === 'led') objs.push({ id: 'deco' + idx, kind: 'led', label: f.name, glow: true, deco: idx, x: 0, y: 0, w: 0, h: 0 });
      else { const s = lay.decoFloor[fi++]; if (!s) return; objs.push({ id: 'deco' + idx, kind: f.kind, label: f.name, x: s[0], y: s[1], w: f.kind === 'tapete' ? 2 : 1, h: 1, flat: f.kind === 'tapete', deco: idx, use: f.kind === 'planta' ? [s[0], Math.min(s[1] + 1, lay.h - 2)] : null }); }
    });
    objs.forEach(o => { if (o.wall || o.glow || o.flat) return; for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (grid[y] && grid[y][x] && grid[y][x].t === 'floor') grid[y][x].block = true; });
    // personagem
    let tx = G.loc.tx, ty = G.loc.ty;
    if (!walkable(tx, ty)) { [tx, ty] = lay.start; }
    ch = { x: (tx + 0.5) * T, y: (ty + 0.8) * T, path: [], dir: 'down', ph: 0 };
  };
  const walkable = (x, y) => grid && grid[y] && grid[y][x] && grid[y][x].t !== 'wall' && !grid[y][x].block;
  H.objects = () => objs;
  H.roomAt = (x, y) => (grid && grid[y] && grid[y][x] && grid[y][x].room) || null;
  H.currentRoom = () => ch ? H.roomAt(Math.floor(ch.x / T), Math.floor((ch.y - 4) / T)) : null;

  // caminho mais curto (BFS)
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
  H.walkTo = (tx, ty, cb) => {
    const sx = Math.floor(ch.x / T), sy = Math.floor((ch.y - 4) / T);
    if (sx === tx && sy === ty) { ch.path = []; if (cb) cb(); return true; }
    const p = bfs(sx, sy, tx, ty); if (!p) return false;
    ch.path = p; onArrive = cb || null; return true;
  };
  H.goToObject = (o, cb) => {
    const G = SL.G;
    if (G.act && G.act.id !== 'usar_pc') { if (cb) cb(); return; }
    const u = o.use || nearestFree(o); if (!u) { if (cb) cb(); return; }
    if (!H.walkTo(u[0], u[1], cb)) { if (cb) cb(); }
  };
  const nearestFree = o => { for (let y = o.y - 1; y <= o.y + o.h; y++) for (let x = o.x - 1; x <= o.x + o.w; x++) if (walkable(x, y)) return [x, y]; return null; };
  H.placeAt = id => { const o = objs.find(x => x.id === id); if (!o || !o.use) return; ch.x = (o.use[0] + 0.5) * T; ch.y = (o.use[1] + 0.8) * T; ch.path = []; };

  H.update = dt => {
    if (!ch || !grid) return;
    const G = SL.G; const act = G.act;
    if (act && act.id !== 'usar_pc') { ch.path = []; }
    if (ch.path.length) {
      const [nx, ny] = ch.path[0]; const tx = (nx + 0.5) * T, ty = (ny + 0.8) * T;
      const dx = tx - ch.x, dy = ty - ch.y; const d = Math.hypot(dx, dy); const sp = 210 * dt;
      if (Math.abs(dx) > Math.abs(dy)) ch.dir = dx > 0 ? 'right' : 'left'; else ch.dir = dy > 0 ? 'down' : 'up';
      if (d <= sp) { ch.x = tx; ch.y = ty; ch.path.shift(); if (!ch.path.length) { G.loc.tx = nx; G.loc.ty = ny; const cb = onArrive; onArrive = null; if (cb) cb(); } }
      else { ch.x += dx / d * sp; ch.y += dy / d * sp; }
      ch.ph += dt * 12; if (Math.floor(ch.ph / Math.PI) !== Math.floor((ch.ph - dt * 12) / Math.PI) && SL.audio) SL.audio.play('step');
    } else ch.ph = 0;
  };

  // posição na tela -> casa
  H.screenToTile = (sx, sy) => { const x = (sx - cam.ox) / cam.s, y = (sy - cam.oy) / cam.s; return { wx: x, wy: y, tx: Math.floor(x / T), ty: Math.floor(y / T) }; };
  H.objectAt = (sx, sy) => {
    const p = H.screenToTile(sx, sy);
    let best = null;
    objs.forEach(o => {
      if (o.glow) return;
      const x0 = o.x * T, y0 = o.y * T - (o.wall ? -WH * 0.1 : (o.flat ? 0 : 18)), x1 = (o.x + o.w) * T, y1 = (o.y + o.h) * T;
      if (o.wall) { if (p.wx >= x0 && p.wx <= x1 && p.wy >= o.y * T + T - WH - 4 && p.wy <= o.y * T + T + 2) best = o; return; }
      if (p.wx >= x0 && p.wx <= x1 && p.wy >= y0 && p.wy <= y1) { if (!best || o.y + o.h > best.y + best.h) best = o; }
    });
    return best;
  };
  H.setHover = o => { hover = o; };
  H.tileToScreen = (tx, ty) => ({ x: cam.ox + tx * T * cam.s, y: cam.oy + ty * T * cam.s });
  H.charScreen = () => ch ? { x: cam.ox + ch.x * cam.s, y: cam.oy + ch.y * cam.s } : { x: 0, y: 0 };

  // ---------- desenho ----------
  const floorTile = (c, x, y, kind) => {
    const f = FLOORS[kind] || FLOORS.wood;
    c.fillStyle = f[0]; c.fillRect(x * T, y * T, T, T);
    if (kind.startsWith('wood')) { c.fillStyle = f[1]; c.fillRect(x * T, y * T + ((x % 2) ? 0 : 16), T, 15); c.fillStyle = f[2]; c.fillRect(x * T, y * T + 15, T, 1); c.fillRect(x * T + ((y % 2) ? 10 : 24), y * T, 1, 15); c.fillRect(x * T + ((y % 2) ? 20 : 6), y * T + 16, 1, 16); }
    else if (kind === 'studio') { c.fillStyle = f[1]; if ((x + y) % 2) c.fillRect(x * T, y * T, T, T); }
    else { c.fillStyle = f[1]; if ((x + y) % 2) c.fillRect(x * T, y * T, T, T); c.fillStyle = f[2]; c.fillRect(x * T, y * T, T, 1); c.fillRect(x * T, y * T, 1, T); }
  };
  const wallFace = (c, x, y, mae) => { const f = mae ? WALL_FACE_MAE : WALL_FACE; const g = c.createLinearGradient(0, y * T + T - WH, 0, y * T + T); g.addColorStop(0, f[0]); g.addColorStop(1, f[1]); c.fillStyle = g; c.fillRect(x * T, y * T + T - WH, T, WH); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x * T, y * T + T - 4, T, 4); };
  const wallTop = (c, x, y) => { c.fillStyle = WALL_TOP; c.fillRect(x * T, y * T - WH + T - WH, T, WH); };

  const skyColor = () => { const h = SL.Clock.hourF(); if (h < 5 || h >= 20) return '#1a2140'; if (h < 7) return '#e8a070'; if (h < 17) return '#8ec6ff'; if (h < 19) return '#f0a060'; return '#4a4a80'; };
  const nightAlpha = () => { const h = SL.Clock.hourF(); if (h >= 7 && h < 17.5) return 0; if (h >= 20 || h < 5) return 0.42; if (h < 7) return 0.42 * (1 - (h - 5) / 2); return 0.42 * ((h - 17.5) / 2.5); };

  const drawObj = (c, o, t) => {
    const G = SL.G; const x = o.x * T, y = o.y * T, w = o.w * T, h = o.h * T;
    const hl = hover && hover.id === o.id;
    c.save();
    switch (o.kind) {
      case 'cama': {
        const f = D.furnById(o.item) || { tier: 0 }; const tier = f.tier || 0;
        if (tier === 0) { c.fillStyle = '#cfd6e6'; rr(c, x + 4, y + 10, w - 20, h - 12, 6); c.fill(); c.fillStyle = '#5a6aa0'; rr(c, x + 4, y + 26, w - 20, h - 28, 6); c.fill(); c.fillStyle = '#fff'; rr(c, x + 8, y + 13, 22, 12, 5); c.fill(); }
        else { c.fillStyle = tier >= 3 ? '#3a2a4a' : '#6a4a32'; rr(c, x + 2, y - (tier >= 2 ? 14 : 6), w - 8, h + (tier >= 2 ? 12 : 4), 6); c.fill(); c.fillStyle = '#eef1f7'; rr(c, x + 6, y + 2, w - 16, h - 8, 6); c.fill(); c.fillStyle = tier >= 3 ? '#8b5cf6' : tier === 2 ? '#3b82f6' : '#ef476f'; rr(c, x + 6, y + 22, w - 16, h - 28, 6); c.fill(); c.fillStyle = '#fff'; rr(c, x + 12, y + 6, 26, 13, 5); c.fill(); if (tier >= 2) { rr(c, x + 44, y + 6, 26, 13, 5); c.fill(); } }
        break;
      }
      case 'mesa': drawDesk(c, o, t); break;
      case 'luz': {
        const it = D.equipById(o.item); const id = it ? it.id : '';
        if (id === 'luz_mesa') break;
        c.fillStyle = '#222'; c.fillRect(x + 15, y - 10, 2, 34);
        if (id === 'luz_ring') { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(x + 16, y - 16, 10, 0, 7); c.stroke(); }
        else { c.fillStyle = '#eee'; rr(c, x + 4, y - 30, 24, 20, 3); c.fill(); c.fillStyle = id === 'luz_pro' ? 'hsl(' + (t * 30 % 360) + ',80%,70%)' : '#fff8e0'; c.fillRect(x + 6, y - 28, 20, 16); }
        break;
      }
      case 'bike': c.fillStyle = '#333'; rr(c, x + 6, y - 4, 22, 28, 5); c.fill(); c.fillStyle = '#ff5a36'; c.fillRect(x + 12, y - 10, 10, 6); break;
      case 'chuveiro': { const du = o.item === 'ducha'; c.fillStyle = 'rgba(180,220,255,.25)'; c.fillRect(x + 2, y + 2, w - 4, h - 4); c.strokeStyle = 'rgba(220,240,255,.7)'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, w - 4, h - 4); c.fillStyle = '#9aa'; c.beginPath(); c.arc(x + w / 2, y + 12, du ? 9 : 6, 0, 7); c.fill(); if (G.act && /banho/.test(G.act.id)) { c.fillStyle = 'rgba(200,230,255,.6)'; for (let i = 0; i < 14; i++) c.fillRect(x + 10 + (i * 7 % (w - 20)), y + 16 + ((t * 60 + i * 13) % (h - 20)), 1.5, 5); } break; }
      case 'vaso': c.fillStyle = '#f2f4f8'; rr(c, x + 7, y + 2, 18, 12, 4); c.fill(); c.beginPath(); c.ellipse(x + 16, y + 22, 9, 10, 0, 0, 7); c.fill(); break;
      case 'pia_b': c.fillStyle = '#e8ecf2'; rr(c, x + 3, y - 6, 26, 22, 5); c.fill(); c.fillStyle = '#b8c6d4'; c.beginPath(); c.ellipse(x + 16, y + 4, 8, 6, 0, 0, 7); c.fill(); c.fillStyle = '#8af'; c.fillRect(x + 6, y - 22, 20, 14); break;
      case 'geladeira': { const f = D.furnById(o.item) || {}; const tall = f.tier >= 1; c.fillStyle = f.tier === 2 ? '#b8c0cc' : '#eef1f5'; rr(c, x + 2, y - (tall ? 34 : 8), w - 4, h + (tall ? 30 : 6), 4); c.fill(); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x + 2, y - (tall ? 6 : -6), w - 4, 2); c.fillStyle = '#777'; c.fillRect(x + w - 8, y - (tall ? 28 : 2), 2, 10); break; }
      case 'fogao': { const f = D.furnById(o.item) || {}; c.fillStyle = f.tier >= 2 ? '#1a1a1e' : '#e6e6ea'; rr(c, x + 2, y - 4, w - 4, h, 4); c.fill(); c.fillStyle = f.tier >= 2 ? '#333' : '#333'; const n = f.tier >= 1 ? 4 : 2; for (let i = 0; i < n; i++) { c.beginPath(); c.arc(x + 14 + (i % 2) * 32 + (n === 2 ? 4 : 0), y + 4 + Math.floor(i / 2) * 12 - (n === 2 ? -2 : 4), 6, 0, 7); c.fill(); } if (G.act && G.act.id === 'cozinhar') { c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(x + 20, y - 10 - (t * 20 % 12), 5, 0, 7); c.fill(); } break; }
      case 'pia': c.fillStyle = '#d9c8a8'; rr(c, x, y - 4, w, h, 3); c.fill(); c.fillStyle = '#aab4be'; rr(c, x + 14, y + 2, 34, 16, 4); c.fill(); c.fillStyle = '#888'; c.fillRect(x + 30, y - 8, 3, 10); break;
      case 'cafeteira': c.fillStyle = '#d9c8a8'; c.fillRect(x, y - 4, w, h); c.fillStyle = '#222'; rr(c, x + 9, y - 10, 14, 20, 3); c.fill(); c.fillStyle = '#7a4a2a'; c.fillRect(x + 11, y + 2, 10, 6); break;
      case 'sofa': { const f = D.furnById(o.item) || {}; const col = f.tier === 2 ? '#3a4a7a' : '#7a4a5a'; c.fillStyle = U.shade(col, -0.2); rr(c, x, y + 8, w, h + 4, 8); c.fill(); c.fillStyle = col; rr(c, x + 4, y - 4, w - 8, h + 2, 6); c.fill(); c.fillStyle = U.shade(col, 0.12); rr(c, x + 8, y - 2, w / 2 - 10, h - 8, 5); c.fill(); rr(c, x + w / 2 + 2, y - 2, w / 2 - 10, h - 8, 5); c.fill(); break; }
      case 'tv': { const f = D.furnById(o.item); c.fillStyle = '#3a2a22'; rr(c, x - 4, y + 6, w + 8, h - 6, 3); c.fill(); if (f) { const big = f.tier === 2; c.fillStyle = '#0a0a0e'; rr(c, x + (big ? -6 : 4), y - (big ? 26 : 18), w + (big ? 12 : -8), big ? 30 : 24, 3); c.fill(); const on = G.act && (G.act.id === 'tv' || G.act.id === 'videogame'); c.fillStyle = on ? 'hsl(' + (t * 40 % 360) + ',50%,45%)' : '#15192a'; c.fillRect(x + (big ? -3 : 7), y - (big ? 23 : 15), w + (big ? 6 : -14), big ? 24 : 18); } if (G.equip.setup.console) { c.fillStyle = '#f0f0f5'; rr(c, x + w / 2 - 12, y + 10, 24, 7, 2); c.fill(); } break; }
      case 'armario': c.fillStyle = '#8a8f9c'; rr(c, x + 2, y - 18, w - 4, h + 16, 3); c.fill(); c.fillStyle = '#6a6f7c'; c.fillRect(x + 4, y + 10, w - 8, 2); c.fillStyle = '#333'; c.fillRect(x + w - 9, y + 2, 2, 8); break;
      case 'porta': c.fillStyle = '#6a4a32'; c.fillRect(x + 2, y + T - WH - 2, w - 4, WH); c.fillStyle = '#e0c080'; c.beginPath(); c.arc(x + w - 9, y + T - WH / 2, 2.5, 0, 7); c.fill(); break;
      case 'guarda': c.fillStyle = '#5a4030'; rr(c, x + 2, y - 26, w - 4, h + 22, 3); c.fill(); c.fillStyle = '#4a3428'; c.fillRect(x + w / 2 - 1, y - 24, 2, h + 18); break;
      case 'mesa_jantar': c.fillStyle = '#8a6a4a'; rr(c, x + 2, y + 2, w - 4, h - 4, 4); c.fill(); if (G.flags.mealReady) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x + w / 2, y + h / 2, 9, 0, 7); c.fill(); c.fillStyle = '#d8432f'; c.beginPath(); c.arc(x + w / 2, y + h / 2, 6, 0, 7); c.fill(); } break;
      case 'estudio': {
        if (G.home.studio) { c.fillStyle = '#19a35a'; c.fillRect(x + w - 70, y - 20, 64, 60); c.fillStyle = '#1a1a22'; rr(c, x + 20, y + 40, 140, 26, 4); c.fill(); c.fillStyle = '#0d0f14'; rr(c, x + 40, y + 20, 50, 30, 3); c.fill(); rr(c, x + 96, y + 20, 50, 30, 3); c.fill(); c.fillStyle = '#8b5cf6'; c.fillRect(x + 43, y + 23, 44, 24); c.fillRect(x + 99, y + 23, 44, 24); for (const lx of [x + 6, x + 190]) { c.fillStyle = '#222'; c.fillRect(lx + 8, y + 10, 3, 60); c.fillStyle = '#fff8e0'; rr(c, lx, y - 4, 20, 18, 3); c.fill(); } }
        else { c.strokeStyle = '#ffb547'; c.lineWidth = 3; c.setLineDash([10, 8]); c.strokeRect(x, y, w, h); c.setLineDash([]); c.fillStyle = '#7a5a3a'; for (let i = 0; i < 4; i++) { rr(c, x + 30 + i * 60, y + 40 + (i % 2) * 20, 34, 26, 3); c.fill(); } }
        break;
      }
      case 'planta': c.fillStyle = '#8a4a2a'; rr(c, x + 9, y + 8, 14, 14, 3); c.fill(); c.fillStyle = '#3f9f4a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(x + 16 + Math.cos(i * 1.3) * 6, y + 2 - i * 3, 5, 9, i * 0.6, 0, 7); c.fill(); } break;
      case 'tapete': c.fillStyle = 'rgba(200,120,160,.55)'; rr(c, x - 6, y + 4, w + 12, h - 4, 10); c.fill(); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; rr(c, x - 2, y + 8, w + 4, h - 12, 8); c.stroke(); break;
      case 'luminaria': c.fillStyle = '#333'; c.fillRect(x + 15, y - 14, 2, 30); c.fillStyle = '#f0d8a0'; c.beginPath(); c.moveTo(x + 6, y - 14); c.lineTo(x + 26, y - 14); c.lineTo(x + 21, y - 26); c.lineTo(x + 11, y - 26); c.fill(); break;
      case 'estante': c.fillStyle = '#5a3a2a'; rr(c, x - 2, y - 30, w + 4, h + 26, 2); c.fill(); for (let i = 0; i < 3; i++) { c.fillStyle = '#3a2418'; c.fillRect(x - 2, y - 22 + i * 12, w + 4, 2); c.fillStyle = D.shirtColors[(i * 3) % 12]; c.fillRect(x + 4, y - 30 + i * 12, 6, 8); c.fillStyle = D.shirtColors[(i * 3 + 5) % 12]; c.fillRect(x + 16, y - 30 + i * 12, 8, 8); } break;
      case 'quadro': c.fillStyle = '#efe6d6'; c.fillRect(x + 6, y + T - WH + 4, 20, 14); c.fillStyle = '#3b82f6'; c.beginPath(); c.arc(x + 13, y + T - WH + 11, 4, 0, 7); c.fill(); c.fillStyle = '#ff5a36'; c.fillRect(x + 17, y + T - WH + 7, 6, 8); break;
      case 'poster': c.fillStyle = '#e0702a'; c.fillRect(x + 8, y + T - WH + 2, 16, 20); c.fillStyle = '#1a1a22'; c.fillRect(x + 10, y + T - WH + 6, 12, 8); break;
      case 'neon': c.save(); c.shadowColor = '#ff3d81'; c.shadowBlur = 10; c.font = '800 9px Sora, Arial'; c.fillStyle = '#ff7ab0'; c.textAlign = 'center'; c.fillText(G.player.channel.slice(0, 10), x + 16, y + T - WH / 2); c.restore(); break;
    }
    if (hl && !o.glow) { c.strokeStyle = 'rgba(180,157,255,.9)'; c.lineWidth = 2; c.setLineDash([5, 4]); rr(c, x - 3, y - (o.wall ? -T + WH + 3 : 22), Math.max(w, T) + 6, (o.wall ? WH : h + 24) + 3, 6); c.stroke(); c.setLineDash([]); }
    c.restore();
  };
  const drawDesk = (c, o, t) => {
    const G = SL.G; const x = o.x * T, y = o.y * T, w = o.w * T;
    const desk = D.furnById(G.home.items.mesa) || { tier: 0 }; const pcIt = D.equipById(G.equip.setup.computador);
    const broken = pcIt && SL.Equip.isBroken(pcIt.id);
    const tier = desk.tier || 0;
    // acústica na parede
    if (G.home.items.acustica) { for (let i = 0; i < o.w; i++) { c.fillStyle = (i % 2) ? '#2a2a3a' : '#33334a'; c.fillRect(x + i * T + 2, y - WH + 2, T - 4, WH - 6); } }
    c.fillStyle = tier === 0 ? '#b8a080' : tier === 1 ? '#1d1f26' : '#2a2d38'; rr(c, x, y - 2, w, T - 6, 3); c.fill();
    if (tier === 1) { c.fillStyle = '#d8432f'; c.fillRect(x, y + T - 10, w, 2); }
    if (tier === 2) { c.fillStyle = '#2a2d38'; rr(c, x + w - 30, y - 2, 30, T + 18, 3); c.fill(); }
    const on = G.act && SL.Life.ACT[G.act.id] && SL.Life.ACT[G.act.id].pc;
    const mon = SL.Equip.item('monitor');
    const scr = on ? (G.act.id === 'live' ? '#4a1a5a' : 'hsl(' + (250 + Math.sin(t) * 10) + ',45%,35%)') : '#10121a';
    if (pcIt && pcIt.id === 'pc_note' && !mon) { c.fillStyle = '#2a2d36'; rr(c, x + w / 2 - 22, y + 2, 44, 14, 2); c.fill(); c.fillStyle = '#1a1c22'; rr(c, x + w / 2 - 20, y - 22, 40, 26, 2); c.fill(); c.fillStyle = broken ? '#300' : scr; c.fillRect(x + w / 2 - 17, y - 19, 34, 20); }
    else {
      const mw = mon ? (mon.q >= 75 ? 54 : mon.q >= 55 ? 46 : 40) : 40;
      const drawMon = mx => { c.fillStyle = '#111'; c.fillRect(mx + mw / 2 - 2, y - 2, 4, 8); c.fillStyle = '#0d0f14'; rr(c, mx, y - 30, mw, 30, 2); c.fill(); c.fillStyle = broken ? '#300' : scr; c.fillRect(mx + 2, y - 28, mw - 4, 25); };
      drawMon(x + w / 2 - mw / 2 - (mon && mon.dual ? mw / 2 + 3 : 0));
      if (mon && mon.dual) drawMon(x + w / 2 + 3);
      if (pcIt && pcIt.tier >= 1) { c.fillStyle = '#16181f'; rr(c, x + w - 20, y - 26, 16, 36, 2); c.fill(); if (pcIt.tier >= 2) { c.fillStyle = 'hsl(' + (t * 50 % 360) + ',90%,60%)'; c.fillRect(x + w - 17, y - 22, 2, 26); } }
      c.fillStyle = '#2a2d36'; rr(c, x + w / 2 - 20, y + 6, 40, 8, 2); c.fill();
    }
    if (SL.Equip.item('mouse')) { c.fillStyle = '#333'; c.beginPath(); c.ellipse(x + w / 2 + 30, y + 10, 3.5, 5, 0, 0, 7); c.fill(); }
    const mic = SL.Equip.item('microfone'); if (mic) { c.strokeStyle = '#333'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 8, y + 10); c.lineTo(x + 14, y - 18); c.lineTo(x + 30, y - 22); c.stroke(); c.fillStyle = mic.audio > 70 ? '#111' : '#444'; rr(c, x + 26, y - 30, 9, 14, 4); c.fill(); }
    const cam = SL.Equip.item('webcam'); if (cam) { c.fillStyle = '#111'; rr(c, x + w / 2 - 6, y - 38, 12, 7, 2); c.fill(); c.fillStyle = '#4cc3ff'; c.fillRect(x + w / 2 - 1, y - 36, 2, 2); }
    if (SL.Equip.item('iluminacao') && SL.Equip.item('iluminacao').id === 'luz_mesa') { c.fillStyle = '#333'; c.fillRect(x + 6, y - 10, 2, 16); c.fillStyle = '#f0d8a0'; c.beginPath(); c.arc(x + 9, y - 12, 5, Math.PI, 0); c.fill(); }
    if (SL.Equip.item('captura')) { c.fillStyle = '#111'; rr(c, x + 4, y + 8, 16, 6, 2); c.fill(); c.fillStyle = '#ff3d81'; c.fillRect(x + 6, y + 10, 2, 2); }
    // cadeira
    const chair = D.furnById(G.home.items.cadeira) || { tier: 0 }; const cx = (o.use ? o.use[0] : o.x + 1) * T, cy = (o.use ? o.use[1] : o.y + 1) * T;
    const sitting = on && ch && Math.abs(ch.x - (cx + T / 2)) < 4;
    const ccol = ['#e8e8ee', '#5a6070', '#1d1d24', '#3a3f4f'][chair.tier || 0];
    c.fillStyle = ccol; rr(c, cx + 4, cy + 8, T - 8, T - 14, 5); c.fill();
    if (!sitting) { c.fillStyle = U.shade(ccol, -0.15); rr(c, cx + 5, cy + T - 14, T - 10, 14, 4); c.fill(); }
    if (chair.tier === 2) { c.fillStyle = '#d8432f'; c.fillRect(cx + 8, cy + 10, T - 16, 2); }
  };
  // fita de LED e luzes à noite
  const lightsPass = (c, t, alpha) => {
    const G = SL.G; if (alpha <= 0.01) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, col, a) => { const g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, U.rgba(col, a)); g.addColorStop(1, U.rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); };
    lay.rooms.forEach(r => glow((r.x + r.w / 2) * T, (r.y + r.h / 2) * T, Math.max(r.w, r.h) * T * 0.7, '#ffd9a0', alpha * 0.32));
    const desk = objs.find(o => o.id === 'mesa'); const on = G.act && SL.Life.ACT[G.act.id] && SL.Life.ACT[G.act.id].pc;
    if (desk && on) glow((desk.x + desk.w / 2) * T, desk.y * T, 90, '#8b7bff', alpha * 0.7);
    if (G.home.deco.includes('led')) { const er = lay.rooms.find(r => r.id === 'escritorio'); const hue = (t * 30) % 360; c.fillStyle = 'hsla(' + hue + ',90%,60%,' + (0.25 + alpha) + ')'; c.fillRect(er.x * T, er.y * T - 6, er.w * T, 4); glow((er.x + er.w / 2) * T, er.y * T + 10, er.w * T * 0.6, '#c77dff', alpha * 0.6); }
    objs.filter(o => o.kind === 'luminaria').forEach(o => glow(o.x * T + 16, o.y * T - 18, 70, '#ffd28a', alpha * 0.8));
    objs.filter(o => o.kind === 'neon').forEach(o => glow(o.x * T + 16, o.y * T + T - WH / 2, 50, '#ff3d81', alpha * 0.8));
    const tv = objs.find(o => o.id === 'tv'); if (tv && G.act && (G.act.id === 'tv' || G.act.id === 'videogame')) glow((tv.x + tv.w / 2) * T, tv.y * T, 110, '#7fb3ff', alpha * 0.8);
    const lz = SL.Equip.item('iluminacao'); if (lz && on) glow((desk.x + desk.w / 2) * T, desk.y * T + 30, 80, '#fff8e0', 0.25 + alpha * 0.4);
    c.restore();
  };

  H.render = (c, cw, chh, t) => {
    if (!grid) H.build();
    const G = SL.G; const mae = G.home.id === 'mae';
    const pad = 20; const worldW = lay.w * T, worldH = lay.h * T + WH;
    cam.s = Math.min((cw - pad * 2) / worldW, (chh - pad * 2) / worldH, 2.2);
    cam.ox = Math.round((cw - worldW * cam.s) / 2); cam.oy = Math.round((chh - worldH * cam.s) / 2 + WH * cam.s);
    c.fillStyle = '#07080c'; c.fillRect(0, 0, cw, chh);
    c.save(); c.translate(cam.ox, cam.oy); c.scale(cam.s, cam.s);
    // sombra externa
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(-6, -WH + 6, worldW + 12, lay.h * T + 12);
    // pisos
    for (let y = 0; y < lay.h; y++) for (let x = 0; x < lay.w; x++) {
      const g = grid[y][x]; if (g.t === 'wall') continue;
      let kind = 'wood'; if (g.room) kind = lay.rooms.find(r => r.id === g.room).floor; else { const r = lay.rooms.find(r => r.id === (H.roomAt(x, y + 1) || H.roomAt(x + 1, y) || H.roomAt(x, y - 1))); kind = r ? r.floor : 'wood'; }
      if (G.home.id === 'mae' && kind.startsWith('wood')) kind = 'wood';
      floorTile(c, x, y, kind);
    }
    // sujeira
    if (G.home.dirt > 35) { const r = U.mulberry(4); c.fillStyle = 'rgba(60,40,20,' + Math.min(0.35, (G.home.dirt - 35) / 150) + ')'; for (let i = 0; i < Math.floor(G.home.dirt / 6); i++) { const room = lay.rooms[Math.floor(r() * lay.rooms.length)]; c.beginPath(); c.ellipse((room.x + r() * room.w) * T, (room.y + r() * room.h) * T, 4 + r() * 6, 3 + r() * 4, r() * 3, 0, 7); c.fill(); } }
    // tapetes
    objs.filter(o => o.flat).forEach(o => drawObj(c, o, t));
    // linhas de cima para baixo: paredes, objetos e personagem
    const drawables = objs.filter(o => !o.flat && !o.glow && !o.wall).map(o => ({ y: (o.y + o.h) * T - 1, f: () => drawObj(c, o, t) }));
    const act = G.act; const chY = ch.y;
    drawables.push({ y: chY, f: () => drawChar(c, t) });
    drawables.sort((a, b) => a.y - b.y);
    let di = 0;
    for (let y = 0; y < lay.h; y++) {
      for (let x = 0; x < lay.w; x++) {
        if (grid[y][x].t !== 'wall') continue;
        const below = grid[y + 1] && grid[y + 1][x] && grid[y + 1][x].t !== 'wall';
        if (below) {
          wallFace(c, x, y, mae);
          const win = lay.windows.find(w0 => w0[0] === x && w0[1] === y);
          if (win) { c.fillStyle = skyColor(); c.fillRect(x * T + 5, y * T + T - WH + 4, T - 10, WH - 12); c.strokeStyle = '#e8e8f0'; c.lineWidth = 2; c.strokeRect(x * T + 5, y * T + T - WH + 4, T - 10, WH - 12); c.beginPath(); c.moveTo(x * T + T / 2, y * T + T - WH + 4); c.lineTo(x * T + T / 2, y * T + T - 8); c.stroke(); }
        }
        c.fillStyle = WALL_TOP; c.fillRect(x * T, y * T - WH, T, T);
        c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x * T, y * T - WH, T, 2);
      }
      objs.filter(o => o.wall && o.y === y).forEach(o => drawObj(c, o, t));
      while (di < drawables.length && drawables[di].y < (y + 1) * T) { drawables[di].f(); di++; }
    }
    while (di < drawables.length) { drawables[di].f(); di++; }
    // noite
    const na = nightAlpha();
    if (na > 0) { c.fillStyle = 'rgba(8,10,30,' + na + ')'; c.fillRect(-10, -WH - 10, worldW + 20, lay.h * T + WH + 20); }
    lightsPass(c, t, na);
    // nomes dos cômodos (por cima, discretos)
    c.font = '700 10px Inter, Arial'; c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.28)';
    lay.rooms.forEach(r => c.fillText(r.name.toUpperCase(), r.x * T + 6, (r.y + r.h) * T - 8));
    c.restore();
  };
  const drawChar = (c, t) => {
    const G = SL.G; const act = G.act; const L = G.player.look;
    let x = ch.x, y = ch.y, o = { dir: ch.dir, walk: ch.path.length ? ch.ph : 0 };
    if (act) {
      const def = SL.Life.ACT[act.id];
      if (def && def.sleep) { const bed = objs.find(q => q.id === 'cama'); if (bed && act.id !== 'cochilar' || (bed && act.id === 'cochilar')) { x = bed.x * T + 30; y = bed.y * T + 30; o = { sleep: true }; } }
      else if (def && def.pc) { const d = objs.find(q => q.id === 'mesa'); if (d && d.use) { x = (d.use[0] + 0.5) * T; y = (d.use[1] + 0.75) * T; o = { dir: 'up', sit: true }; } }
      else if (['tv', 'videogame', 'descansar', 'ler'].includes(act.id)) { const s = objs.find(q => q.id === 'sofa'); if (s) { x = (s.x + s.w / 2) * T; y = (s.y + 0.9) * T; o = { dir: 'up', sit: true }; } }
      else if (/banho/.test(act.id)) { const s = objs.find(q => q.id === 'chuveiro'); if (s) { x = (s.x + s.w / 2) * T; y = (s.y + 1.6) * T; } }
    }
    A.sprite(c, L, x, y, 1.05, o);
    if (act && SL.Life.ACT[act.id] && SL.Life.ACT[act.id].sleep) { c.font = '800 12px Sora, Arial'; c.fillStyle = 'rgba(200,190,255,.9)'; c.fillText('z', x + 10, y - 30 - (t * 10 % 10)); c.fillText('Z', x + 18, y - 42 - (t * 10 % 10)); }
  };
})(window.SL);

/* ============================ RENDERIZAÇÃO ============================ */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false }); // tela opaca: o navegador não precisa misturar com a página
const lightCanvas = document.createElement('canvas');
const lctx = lightCanvas.getContext('2d');
const glowCanvas = document.createElement('canvas');
const gctx = glowCanvas.getContext('2d');
let RS = 1, LS = 0.5, SCREEN_W = 1, SCREEN_H = 1;
const Cam = { x: 1000, y: 2700, zoom: 1, shake: 0, quick: 1, view: { x0: 0, y0: 0, x1: 0, y1: 0 }, dark: 0.84, menuTarget: null, menuT: 0 };
const PAR = 1 / 1700;
const SQ = 1;      // visão de cima (sem achatamento vertical)
const TILT_H = 0;  // sem inclinação extra: só a paralaxe 2.5D a partir do centro da tela

function resize() {
  SCREEN_W = window.innerWidth; SCREEN_H = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  RS = Settings.quality === 'alta' ? Math.min(dpr, 2) : Settings.quality === 'baixa' ? Math.min(dpr, 1) * 0.7 : Math.min(dpr, 1.25);
  canvas.width = Math.round(SCREEN_W * RS); canvas.height = Math.round(SCREEN_H * RS);
  // a camada de luz é toda suave: resolução menor não muda o visual e alivia muito
  LS = Settings.quality === 'alta' ? 0.5 : Settings.quality === 'baixa' ? 0.28 : 0.42;
  lightCanvas.width = Math.ceil(SCREEN_W * LS); lightCanvas.height = Math.ceil(SCREEN_H * LS);
  glowCanvas.width = lightCanvas.width; glowCanvas.height = lightCanvas.height;
  if (typeof wsClear === 'function') wsClear();
}
function screenZoomBase() { return clamp(Math.min(SCREEN_W, SCREEN_H * 1.45) / 1250, 0.62, 1.5); }

function updateCamera(dt) {
  let tx, ty, sp = 0;
  if (Game.state === 'menu' || !player) {
    Cam.menuT -= dt;
    if (!Cam.menuTarget || !Cam.menuTarget.alive || Cam.menuT <= 0) {
      const city = Traffic.cars.filter((c) => c.x < 4600 && c.y < 5300 && c.model !== 'tractor');
      Cam.menuTarget = pick(city.length ? city : Traffic.cars) || null; Cam.menuT = 14;
    }
    if (Cam.menuTarget) { tx = Cam.menuTarget.x + Math.cos(Cam.menuTarget.a) * 60; ty = Cam.menuTarget.y + Math.sin(Cam.menuTarget.a) * 60; sp = Cam.menuTarget.v; }
    else { tx = 1756; ty = 1260; }
    const k = 1 - Math.exp(-1.6 * dt);
    Cam.x += (tx - Cam.x) * k; Cam.y += (ty - Cam.y) * k;
    Cam.zoom = lerp(Cam.zoom, screenZoomBase() * 0.95, 1 - Math.exp(-2 * dt));
  } else {
    sp = player.speed;
    const la = clamp(0.32, 0, 1);
    let lx = player.vx * la, ly = player.vy * la;
    const ll = Math.hypot(lx, ly); if (ll > 210) { lx *= 210 / ll; ly *= 210 / ll; }
    tx = player.x + lx; ty = player.y + ly;
    const k = 1 - Math.exp(-5 * dt);
    Cam.x += (tx - Cam.x) * k; Cam.y += (ty - Cam.y) * k;
    // correndo, a câmera sobe um pouco, mas nunca passa do nível 3 (130%)
    const pct = Math.max(CAM_MIN, (Settings.zoom || 140) * (1 - clamp(sp / 700, 0, 1) * 0.22));
    const target = screenZoomBase() * (pct / 100);
    Cam.zoom = lerp(Cam.zoom, target, 1 - Math.exp(-2.5 * dt));
  }
  Cam.shake *= Math.exp(-7 * dt);
  Cam.flash = (Cam.flash || 0) * Math.exp(-5 * dt);
  const rk = regionKeyAt(Cam.x, Cam.y);
  let dk = REGIONS[rk].dark;
  const tm = Profile.time % 1440;
  const deep = tm >= 60 && tm < 240 ? 0.025 : 0;
  Cam.dark = lerp(Cam.dark, dk + deep, 1 - Math.exp(-1.2 * dt));
}

/* ---------- chão pré-renderizado ---------- */
const CHUNK = 512;
const chunks = new Map();
let frameNo = 0;
const _bq = [];
// guarda pelo menos os blocos da tela + um anel em volta (senão fica refazendo chão o tempo todo)
function maxChunks() {
  const v = Cam.view, need = v && v.x1 > v.x0 ? (Math.ceil((v.x1 - v.x0) / CHUNK) + 3) * (Math.ceil((v.y1 - v.y0) / CHUNK) + 3) + 6 : 30;
  return Math.max(need, Settings.quality === 'baixa' ? 24 : Settings.quality === 'alta' ? 64 : 46);
}
function renderChunk(cx, cy) {
  const cv = makeCanvas(CHUNK, CHUNK), g = cv.getContext('2d');
  const X = cx * CHUNK, Y = cy * CHUNK;
  CHUNK_BOX = { x0: X, y0: Y, x1: X + CHUNK, y1: Y + CHUNK };
  g.translate(-X, -Y);
  g.fillStyle = pat(g, 'grass'); g.fillRect(X, Y, CHUNK, CHUNK);
  bakeGrid.query(X, Y, X + CHUNK - 1, Y + CHUNK - 1, _bq);
  _bq.sort((a, b) => a.z - b.z || a.o - b.o);
  for (const it of _bq) {
    if (it.x1 < X || it.x0 > X + CHUNK || it.y1 < Y || it.y0 > Y + CHUNK) continue;
    try { it.fn(g); } catch (err) { console.warn('bake', err); }
  }
  const ch = { cv, used: frameNo };
  chunks.set(cy * 1000 + cx, ch);
  if (chunks.size > maxChunks()) {
    let oldK = null, oldU = Infinity;
    for (const [k, v] of chunks) if (v.used < oldU) { oldU = v.used; oldK = k; }
    if (oldK !== null) chunks.delete(oldK);
  }
  return ch;
}
function drawGround(view, force) {
  const x0 = Math.max(0, Math.floor(view.x0 / CHUNK)), x1 = Math.min(Math.ceil(WORLD_W / CHUNK) - 1, Math.floor(view.x1 / CHUNK));
  const y0 = Math.max(0, Math.floor(view.y0 / CHUNK)), y1 = Math.min(Math.ceil(WORLD_H / CHUNK) - 1, Math.floor(view.y1 / CHUNK));
  let budget = force ? 999 : 2;
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
    let ch = chunks.get(cy * 1000 + cx);
    if (!ch && budget > 0) { ch = renderChunk(cx, cy); budget--; }
    if (ch) { ch.used = frameNo; ctx.drawImage(ch.cv, cx * CHUNK, cy * CHUNK, CHUNK + 0.7, CHUNK + 0.7); }
    else { ctx.fillStyle = '#16210f'; ctx.fillRect(cx * CHUNK, cy * CHUNK, CHUNK, CHUNK); }
  }
  if (budget > 0 && !force) {
    // pré-carrega um anel ao redor da tela
    for (let cy = y0 - 1; cy <= y1 + 1 && budget > 0; cy++) for (let cx = x0 - 1; cx <= x1 + 1 && budget > 0; cx++) {
      if (cx < 0 || cy < 0 || cx * CHUNK >= WORLD_W || cy * CHUNK >= WORLD_H) continue;
      const ch = chunks.get(cy * 1000 + cx);
      if (!ch) { renderChunk(cx, cy).used = frameNo; budget--; } else ch.used = frameNo;
    }
  }
}
function clearChunks() { chunks.clear(); }

/* ---------- telhados ---------- */
function roofSprite(b) {
  if (b.roof) return b.roof;
  const w = Math.ceil(b.x1 - b.x0), h = Math.ceil(b.y1 - b.y0);
  const c = makeCanvas(w, h), g = c.getContext('2d');
  const R = mulberry32(b.seed);
  const rc = b.roofColor;
  switch (b.roofType) {
    case 'hip': case 'gable': case 'gableV': case 'tower': {
      g.fillStyle = rc; g.fillRect(0, 0, w, h);
      const alongX = b.roofType === 'gableV' ? false : b.roofType === 'tower' ? null : w >= h;
      if (b.roofType === 'tower') {
        const faces = [[[0, 0], [w, 0], [w / 2, h / 2]], [[w, 0], [w, h], [w / 2, h / 2]], [[w, h], [0, h], [w / 2, h / 2]], [[0, h], [0, 0], [w / 2, h / 2]]];
        const sh = [0.12, -0.12, -0.3, 0.02];
        faces.forEach((f, i) => { g.fillStyle = shade(rc, sh[i]); g.beginPath(); g.moveTo(f[0][0], f[0][1]); g.lineTo(f[1][0], f[1][1]); g.lineTo(f[2][0], f[2][1]); g.closePath(); g.fill(); });
        if (b.cross) { g.strokeStyle = '#f0e6c8'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(w / 2, h / 2 - 9); g.lineTo(w / 2, h / 2 + 9); g.moveTo(w / 2 - 5, h / 2 - 3); g.lineTo(w / 2 + 5, h / 2 - 3); g.stroke(); }
        break;
      }
      const hip = b.roofType === 'hip';
      let faces;
      if (alongX) {
        const r0 = hip ? h / 2 : 0, r1 = hip ? w - h / 2 : w;
        faces = [
          { p: [[0, 0], [w, 0], [r1, h / 2], [r0, h / 2]], s: 0.1, dir: 'h' },
          { p: [[0, h], [w, h], [r1, h / 2], [r0, h / 2]], s: -0.28, dir: 'h' },
          { p: [[0, 0], [r0, h / 2], [0, h]], s: -0.05, dir: 'v' },
          { p: [[w, 0], [r1, h / 2], [w, h]], s: -0.18, dir: 'v' },
        ];
      } else {
        const r0 = hip ? w / 2 : 0, r1 = hip ? h - w / 2 : h;
        faces = [
          { p: [[0, 0], [0, h], [w / 2, r1], [w / 2, r0]], s: 0.02, dir: 'v' },
          { p: [[w, 0], [w, h], [w / 2, r1], [w / 2, r0]], s: -0.22, dir: 'v' },
          { p: [[0, 0], [w / 2, r0], [w, 0]], s: 0.12, dir: 'h' },
          { p: [[0, h], [w / 2, r1], [w, h]], s: -0.3, dir: 'h' },
        ];
      }
      for (const f of faces) {
        g.save();
        g.beginPath(); g.moveTo(f.p[0][0], f.p[0][1]); for (let i = 1; i < f.p.length; i++) g.lineTo(f.p[i][0], f.p[i][1]); g.closePath();
        g.fillStyle = shade(rc, f.s); g.fill(); g.clip();
        g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 1;
        g.beginPath();
        if (f.dir === 'h') for (let y = 2; y < h; y += 3.2) { g.moveTo(0, y); g.lineTo(w, y); }
        else for (let x = 2; x < w; x += 3.2) { g.moveTo(x, 0); g.lineTo(x, h); }
        g.stroke();
        g.fillStyle = 'rgba(0,0,0,0.07)';
        for (let i = 0; i < 6; i++) g.fillRect(R() * w, R() * h, 6 + R() * 10, 3 + R() * 4);
        g.restore();
      }
      g.strokeStyle = shade(rc, 0.3); g.lineWidth = 1.6; g.beginPath();
      if (alongX) { const r0 = hip ? h / 2 : 0, r1 = hip ? w - h / 2 : w; g.moveTo(r0, h / 2); g.lineTo(r1, h / 2); if (hip) { g.moveTo(0, 0); g.lineTo(r0, h / 2); g.lineTo(0, h); g.moveTo(w, 0); g.lineTo(r1, h / 2); g.lineTo(w, h); } }
      else { const r0 = hip ? w / 2 : 0, r1 = hip ? h - w / 2 : h; g.moveTo(w / 2, r0); g.lineTo(w / 2, r1); if (hip) { g.moveTo(0, 0); g.lineTo(w / 2, r0); g.lineTo(w, 0); g.moveTo(0, h); g.lineTo(w / 2, r1); g.lineTo(w, h); } }
      g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 1.5; g.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
      if (b.style === 'church') { g.fillStyle = '#f0e6c8'; g.fillRect(w / 2 - 1.2, 8, 2.4, 14); g.fillRect(w / 2 - 5, 12, 10, 2.4); }
      break;
    }
    case 'corrugated': case 'container': {
      g.fillStyle = rc; g.fillRect(0, 0, w, h);
      const alongX = w < h;
      for (let i = 0; i < (alongX ? w : h); i += 4) { g.fillStyle = i % 8 ? shade(rc, 0.12) : shade(rc, -0.15); if (alongX) g.fillRect(i, 0, 2, h); else g.fillRect(0, i, w, 2); }
      if (b.roofType === 'corrugated' && w > 60 && h > 60) {
        g.fillStyle = 'rgba(220,235,240,0.35)';
        for (let k = 1; k < 4; k++) { if (alongX) g.fillRect(4, h * k / 4 - 4, w - 8, 8); else g.fillRect(w * k / 4 - 4, 4, 8, h - 8); }
      }
      g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 5; i++) g.fillRect(R() * w, R() * h, 10 + R() * 20, 6 + R() * 8);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.5; g.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
      break;
    }
    case 'laje': {
      g.fillStyle = rc; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 10; i++) { g.beginPath(); g.ellipse(R() * w, R() * h, 4 + R() * 10, 3 + R() * 6, R() * 3, 0, TAU); g.fill(); }
      if (R() < 0.45) {
        const bw = w * (0.3 + R() * 0.3), bx = R() < 0.5 ? 0 : w - bw;
        g.fillStyle = '#a65a36'; g.fillRect(bx, 0, bw, h);
        g.fillStyle = 'rgba(60,25,10,0.5)';
        for (let y = 0; y < h; y += 4) for (let x = bx + ((y / 4) % 2) * 4; x < bx + bw; x += 8) g.fillRect(x, y, 1, 4);
        for (let y = 0; y < h; y += 4) g.fillRect(bx, y, bw, 0.8);
      }
      g.strokeStyle = shade(rc, -0.35); g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
      const tx = R() < 0.5 ? 12 : w - 12, ty = R() < 0.5 ? 12 : h - 12;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(tx + 2, ty + 2, 8, 0, TAU); g.fill();
      g.fillStyle = '#3b7fc4'; g.beginPath(); g.arc(tx, ty, 7.5, 0, TAU); g.fill();
      g.fillStyle = '#5a9be0'; g.beginPath(); g.arc(tx - 1, ty - 1, 4.5, 0, TAU); g.fill();
      g.strokeStyle = '#2a5f96'; g.lineWidth = 1; g.beginPath(); g.arc(tx, ty, 7.5, 0, TAU); g.stroke();
      if (R() < 0.6) { g.strokeStyle = '#555'; g.lineWidth = 1; g.beginPath(); g.moveTo(w * 0.3, h * 0.6); g.lineTo(w * 0.3 + 10, h * 0.6 - 8); g.moveTo(w * 0.3 + 4, h * 0.6 - 3); g.lineTo(w * 0.3 + 8, h * 0.6 + 1); g.stroke(); }
      break;
    }
    case 'amianto': {
      g.fillStyle = rc; g.fillRect(0, 0, w, h);
      const alongX = w < h;
      for (let i = 0; i < (alongX ? w : h); i += 3) { g.fillStyle = i % 6 ? shade(rc, 0.1) : shade(rc, -0.18); if (alongX) g.fillRect(i, 0, 1.5, h); else g.fillRect(0, i, w, 1.5); }
      g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 3; i++) { if (alongX) g.fillRect(0, h * (i + 1) / 4, w, 1); else g.fillRect(w * (i + 1) / 4, 0, 1, h); }
      g.fillStyle = 'rgba(60,70,40,0.25)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(R() * w, R() * h, 3 + R() * 7, 2 + R() * 4, 0, 0, TAU); g.fill(); }
      if (R() < 0.4) { g.fillStyle = '#7d5a3a'; g.fillRect(R() * (w - 10), R() * (h - 4), 10, 2); }
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 1.2; g.strokeRect(0.6, 0.6, w - 1.2, h - 1.2);
      break;
    }
    case 'tijolo': {
      g.fillStyle = '#8f8b84'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(R() * w, R() * h, 3 + R() * 8, 2 + R() * 5, 0, 0, TAU); g.fill(); }
      // segundo andar em obra (tijolo baiano aparente)
      const bw = w * (0.45 + R() * 0.3), bh = h * (0.5 + R() * 0.3), bx = R() < 0.5 ? 0 : w - bw, by = R() < 0.5 ? 0 : h - bh;
      g.fillStyle = '#b5603a'; g.fillRect(bx, by, bw, bh);
      g.fillStyle = 'rgba(70,25,10,0.55)';
      for (let yy = by; yy < by + bh; yy += 4) { g.fillRect(bx, yy, bw, 0.8); for (let xx = bx + ((yy - by) / 4 % 2) * 4; xx < bx + bw; xx += 8) g.fillRect(xx, yy, 0.8, 4); }
      g.strokeStyle = '#6a2e18'; g.lineWidth = 2; g.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
      // ferros de espera nos cantos
      g.fillStyle = '#3a2a22';
      for (const [px, py] of [[2, 2], [w - 4, 2], [2, h - 4], [w - 4, h - 4], [bx + bw / 2, 2]]) { g.fillRect(px, py, 1.6, 1.6); g.fillRect(px + 2.5, py, 1.6, 1.6); g.fillRect(px, py + 2.5, 1.6, 1.6); }
      g.fillStyle = '#c06a40'; for (let i = 0; i < 6; i++) g.fillRect(w * 0.6 + (i % 3) * 3.4, h * 0.7 + Math.floor(i / 3) * 2.4, 3, 2);
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
      break;
    }
    case 'bleacher': {
      for (let i = 0; i < w; i += 5) { g.fillStyle = i % 10 ? '#9a9a9a' : '#6a6a6a'; g.fillRect(i, 0, 5, h); }
      break;
    }
    case 'deck': {
      for (let i = 0; i < Math.max(w, h); i += 5) { g.fillStyle = hash2(i, 9) < 0.5 ? '#7a5434' : '#6a4628'; if (w > h) g.fillRect(i, 0, 4.4, h); else g.fillRect(0, i, w, 4.4); }
      g.strokeStyle = '#4a321e'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
      break;
    }
    default: {
      g.fillStyle = rc; g.fillRect(0, 0, w, h);
      g.fillStyle = shade(rc, 0.07); g.fillRect(4, 4, w - 8, h - 8);
      g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < w * h / 500; i++) g.fillRect(R() * w, R() * h, 1.5, 1.5);
      g.strokeStyle = shade(rc, -0.35); g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
      const big = b.h > 60;
      const n = Math.floor(w * h / (big ? 4000 : 6000));
      for (let i = 0; i < n; i++) {
        const x = 8 + R() * (w - 26), y = 8 + R() * (h - 22), kind = R();
        if (kind < 0.55) {
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 2, y + 2, 12, 9);
          g.fillStyle = '#b8b8b2'; g.fillRect(x, y, 12, 9); g.fillStyle = '#5a5a58'; g.beginPath(); g.arc(x + 6, y + 4.5, 3, 0, TAU); g.fill();
        } else if (kind < 0.8) {
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(x + 9, y + 9, 7, 0, TAU); g.fill();
          g.fillStyle = '#5f7a9a'; g.beginPath(); g.arc(x + 7, y + 7, 7, 0, TAU); g.fill();
          g.strokeStyle = '#3d556f'; g.lineWidth = 1; g.stroke();
        } else {
          g.fillStyle = shade(rc, -0.15); g.fillRect(x, y, 16, 12);
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, y + 10, 16, 2);
        }
      }
      if (big && w > 70 && h > 70 && R() < 0.5) {
        g.strokeStyle = 'rgba(230,230,220,0.7)'; g.lineWidth = 2;
        g.beginPath(); g.arc(w / 2, h / 2, 18, 0, TAU); g.stroke();
        g.font = 'bold 20px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(230,230,220,0.7)'; g.fillText('H', w / 2, h / 2 + 1);
      }
      if (big && R() < 0.6) { g.strokeStyle = '#888'; g.lineWidth = 1.2; g.beginPath(); const ax = w - 14, ay = 14; g.moveTo(ax, ay); g.lineTo(ax - 10, ay + 12); g.moveTo(ax - 4, ay + 4); g.lineTo(ax + 3, ay + 8); g.stroke(); b.antenna = [ax, ay]; }
    }
  }
  // detalhes de laje: antena parabólica e varal de roupas
  if (b.dish && w > 22 && h > 22) {
    const dx = R() < 0.5 ? 8 : w - 8, dy = R() < 0.5 ? h - 8 : 8;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(dx + 1.5, dy + 1.5, 5.5, 0, TAU); g.fill();
    g.fillStyle = '#d8d8d2'; g.beginPath(); g.arc(dx, dy, 5.5, 0, TAU); g.fill();
    g.fillStyle = '#a8a8a2'; g.beginPath(); g.arc(dx + 1, dy + 1, 3.2, 0, TAU); g.fill();
    g.fillStyle = '#555'; g.fillRect(dx - 0.6, dy - 0.6, 1.2, 1.2);
  }
  if (b.varal && w > 30 && h > 24) {
    const vy = h * (0.3 + R() * 0.4), vx0 = w * 0.15, vx1 = w * 0.85;
    g.strokeStyle = 'rgba(40,40,40,0.8)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(vx0, vy); g.lineTo(vx1, vy); g.stroke();
    const clothes = ['#e63946', '#f1f1f1', '#3a86ff', '#f4c430', '#2bb24c', '#ff7f11', '#8338ec'];
    for (let x = vx0 + 2; x < vx1 - 5; x += 6 + R() * 3) { g.fillStyle = clothes[(R() * clothes.length) | 0]; g.fillRect(x, vy, 4 + R() * 2, 4 + R() * 3); }
  }
  if (b.sign) {
    const fs = clamp(Math.min(w / (b.sign.length * 0.62), h * 0.42), 7, 22);
    g.font = `800 ${fs}px "Segoe UI", Roboto, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(b.sign, w / 2, h / 2);
    g.fillStyle = b.signColor; g.fillText(b.sign, w / 2, h / 2);
  }
  b.roof = c;
  return c;
}
function signGlow(b) {
  if (b.glowSign) return b.glowSign;
  const w = Math.ceil(b.x1 - b.x0) + 20, h = Math.ceil(b.y1 - b.y0) + 20;
  const c = makeCanvas(w, h), g = c.getContext('2d');
  const fs = clamp(Math.min((w - 20) / (b.sign.length * 0.62), (h - 20) * 0.42), 7, 22);
  g.font = `800 ${fs}px "Segoe UI", Roboto, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = b.signColor; g.shadowBlur = 10; g.fillStyle = b.signColor;
  g.fillText(b.sign, w / 2, h / 2); g.fillText(b.sign, w / 2, h / 2);
  g.shadowBlur = 0; g.globalAlpha = 0.85; g.fillStyle = '#ffffff'; g.fillText(b.sign, w / 2, h / 2);
  b.glowSign = c;
  return c;
}

/* ---------- prédios em 2.5D ---------- */
function bldOffset(b) {
  let ox = (b.cx - Cam.x) * b.h * PAR, oy = (b.cy - Cam.y) * b.h * PAR;
  const m = b.h * 0.85, l = Math.hypot(ox, oy);
  if (l > m) { ox *= m / l; oy *= m / l; }
  return [ox, oy - b.h * TILT_H];
}
/* ---------- paredes prontas ("adesivos") ----------
   Parede de construção pequena (casinhas da comunidade, lojinhas) é pintada uma vez numa imagem
   com janelas, porta, tijolo e sombra, e a cada quadro só é colada inclinada no lugar certo.
   Paredes iguais (mesma cor, tamanho, lado e janelas acesas) usam a mesma imagem, então quase
   não se pinta nada novo enquanto você anda. O desenho é o mesmo de antes. */
let WS_BAKE = 1, WS_LEN = 0, WS_K = 1.6, WS_CHECK = 0;
const WS_H = 40, WS_MAX = 260, WS_CACHE = new Map();
const WS_BASE = { ctx: null, z: 1, zs: 1, tx: 0, ty: 0 };
function wallFlickT(b) { return Math.floor(Game.time * 0.5 + ((b.seed * 0.618) % 1)); }
function wsUse(ctx, b) { return ctx === WS_BASE.ctx && b.x1 - b.x0 <= WS_MAX && b.y1 - b.y0 <= WS_MAX; }
function wsClear() { WS_CACHE.clear(); WS_K = RS >= 1.5 ? 2.5 : 1.6; }
// o que muda o desenho da parede: estilo, cor, lado, tamanho, andares, porta, tijolo e quais janelas estão acesas
// (janelas e porta ficam em proporção ao comprimento: o que importa é quantas cabem, não o tamanho exato)
const WS_LINES = { warehouse: 1, barn: 1, container: 1, shed: 1 };
function wallKey(b, side, len, Lb) {
  const ws = WIN_STYLES[b.style];
  let k = b.style + '|' + b.wall + '|' + side + '|' + Lb + (b.front === side ? 'F' : '') + (b.brick ? 'B' : '');
  if (WS_LINES[b.style]) k += '|' + Math.floor(len / 5);
  if (b.style === 'colonial') k += '|' + (b.seed % 2) + Math.floor(len / 18);
  if (b.style === 'apart') k += '|' + Math.floor(b.h / 15);
  if (!ws || (ws === 3 && b.front === side)) return k + (ws ? '|' + Math.floor(len / 24) : '');
  let floors, cols;
  if (ws === 1) { floors = b.h > 40 ? 2 : 1; cols = Math.max(1, Math.floor(len / 30)); }
  else if (ws === 4) { floors = 2; cols = Math.max(1, Math.floor(len / 18)); }
  else if (ws === 2) { floors = Math.max(1, Math.floor(b.h / 15)); cols = Math.max(1, Math.floor(len / 15)); }
  else { floors = 1; cols = Math.max(1, Math.floor(len / 24)); }
  const tf = wallFlickT(b), sc = side.charCodeAt(0);
  let bits = '';
  for (let f = 0; f < floors; f++) for (let c = 0; c < cols; c++) {
    const hsh = hash2(b.seed + f * 131 + c * 7, sc);
    let on = hsh < b.lit;
    if (hsh < 0.04) on = hash2(b.seed + tf, c) < 0.7;
    bits += on ? '1' : '0';
  }
  return k + '|' + floors + 'x' + cols + '|' + bits;
}
function wallFast(ctx, b, ax, ay, bx, by, ox, oy, side) {
  const len = Math.hypot(bx - ax, by - ay), Lb = Math.max(8, Math.round(len / 8) * 8);
  const key = wallKey(b, side, len, Lb);
  let E = WS_CACHE.get(key);
  if (!E) {
    const W = Math.ceil(Lb * WS_K), cv = makeCanvas(W, WS_H), g = cv.getContext('2d');
    WS_BAKE = WS_K; WS_LEN = len; drawWall(g, b, 0, 0, W, 0, 0, WS_H, side); WS_BAKE = 1; WS_LEN = 0;
    E = { cv, u: 0 }; WS_CACHE.set(key, E);
  }
  E.u = frameNo;
  // canto do adesivo: (0,0) = chão no ponto a; eixo u ao longo da parede; eixo v subindo (ox, oy)
  const B = WS_BASE, W = E.cv.width, m11 = (bx - ax) / W, m12 = (by - ay) / W, m21 = ox / WS_H, m22 = oy / WS_H;
  ctx.setTransform(B.z * m11, B.zs * m12, B.z * m21, B.zs * m22, B.z * ax + B.tx, B.zs * ay + B.ty);
  ctx.drawImage(E.cv, 0, 0);
  ctx.setTransform(B.z, 0, 0, B.zs, B.tx, B.ty);
}
// libera adesivos que não aparecem faz tempo
function wsTrim() {
  if (WS_CACHE.size < 2000 || frameNo < WS_CHECK) return;
  WS_CHECK = frameNo + 120;
  for (const [k, E] of WS_CACHE) if (frameNo - E.u > 90) WS_CACHE.delete(k);
}
const FAVELA_RK = { feurosa: 1, carapina: 1, novarosa: 1, flexal: 1, saopedro: 1, terravermelha: 1 };
const EM_BATCH = { on: false, norm: null, big: null, n: 0 };
const WIN_STYLES = { house: 1, farmhouse: 1, office: 2, tower: 2, church: 2, apart: 2, colonial: 4, shop: 3, workshop: 3, garage: 3, kiosk: 3 };
function wallWindows(ctx, b, ax, ay, bx, by, ox, oy, side, emissive) {
  const ws = WIN_STYLES[b.style];
  if (!ws) return;
  const ext = Math.hypot(ox, oy);
  if (ext < 2.2) return;
  const len = WS_LEN || Math.hypot(bx - ax, by - ay);
  let floors, cols;
  if (ws === 1) { floors = b.h > 40 ? 2 : 1; cols = Math.max(1, Math.floor(len / 30)); }
  else if (ws === 4) { floors = 2; cols = Math.max(1, Math.floor(len / 18)); }
  else if (ws === 2) { floors = Math.max(1, Math.floor(b.h / 15)); cols = Math.max(1, Math.floor(len / 15)); }
  else { floors = 1; cols = Math.max(1, Math.floor(len / 24)); }
  const ex = bx - ax, ey = by - ay;
  const front = b.front === side;
  const big = ws === 3 && front;
  // luz das janelas: vai tudo para um caminho só, pintado de uma vez no fim (luz somada não depende da ordem)
  const lit = emissive ? null : new Path2D(), dark = emissive ? null : new Path2D(), em = emissive ? (EM_BATCH.on ? (big ? EM_BATCH.big : EM_BATCH.norm) : new Path2D()) : null;
  const tflick = wallFlickT(b);
  let nLit = 0, nDark = 0;
  for (let f = 0; f < floors; f++) {
    const f0 = big ? 0.08 : (f + 0.28) / floors, f1 = big ? 0.62 : (f + 0.74) / floors;
    for (let c = 0; c < cols; c++) {
      const s0 = (c + (big ? 0.08 : 0.24)) / cols, s1 = (c + (big ? 0.92 : 0.76)) / cols;
      const hsh = hash2(b.seed + f * 131 + c * 7, side.charCodeAt(0));
      let on = big ? true : hsh < b.lit;
      if (!big && hsh < 0.04) on = hash2(b.seed + tflick, c) < 0.7;
      const P = emissive ? (on ? em : null) : (on ? lit : dark);
      if (!P) continue;
      if (on) nLit++; else nDark++;
      P.moveTo(ax + ex * s0 + ox * f0, ay + ey * s0 + oy * f0);
      P.lineTo(ax + ex * s1 + ox * f0, ay + ey * s1 + oy * f0);
      P.lineTo(ax + ex * s1 + ox * f1, ay + ey * s1 + oy * f1);
      P.lineTo(ax + ex * s0 + ox * f1, ay + ey * s0 + oy * f1);
      P.closePath();
    }
  }
  // só pinta se tiver janela daquele tipo (parede sem janela acesa não gasta nada)
  if (emissive) { if (nLit) { if (EM_BATCH.on) EM_BATCH.n++; else { ctx.fillStyle = big ? 'rgba(255,214,150,0.5)' : 'rgba(255,186,105,0.55)'; ctx.fill(em); } } }
  else {
    if (nDark) { ctx.fillStyle = '#18202b'; ctx.fill(dark); }
    if (nLit) { ctx.fillStyle = big ? '#f3dcb0' : '#f0c47a'; ctx.fill(lit); }
  }
  if (!emissive && ws !== 2 && front && !big) {
    const s0 = 0.45, s1 = 0.55;
    ctx.fillStyle = '#3a2a1e';
    ctx.beginPath(); ctx.moveTo(ax + ex * s0, ay + ey * s0); ctx.lineTo(ax + ex * s1, ay + ey * s1); ctx.lineTo(ax + ex * s1 + ox * 0.75, ay + ey * s1 + oy * 0.75); ctx.lineTo(ax + ex * s0 + ox * 0.75, ay + ey * s0 + oy * 0.75); ctx.closePath(); ctx.fill();
  }
}
const SIDE_SHADE = { N: 0.04, W: -0.08, S: -0.3, E: -0.4 };
function drawWall(ctx, b, ax, ay, bx, by, ox, oy, side) {
  ctx.fillStyle = shade(b.wall, SIDE_SHADE[side]);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx + ox, by + oy); ctx.lineTo(ax + ox, ay + oy); ctx.closePath(); ctx.fill();
  if (b.style === 'warehouse' || b.style === 'barn' || b.style === 'container' || b.style === 'shed') {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = WS_BAKE; ctx.beginPath();
    const n = Math.floor((WS_LEN || Math.hypot(bx - ax, by - ay)) / 5);
    for (let i = 1; i < n; i++) { const t = i / n; ctx.moveTo(ax + (bx - ax) * t, ay + (by - ay) * t); ctx.lineTo(ax + (bx - ax) * t + ox, ay + (by - ay) * t + oy); }
    ctx.stroke();
    if (b.front === side || b.style === 'barn') {
      ctx.fillStyle = 'rgba(20,16,12,0.75)';
      const s0 = 0.35, s1 = 0.65;
      ctx.beginPath(); ctx.moveTo(ax + (bx - ax) * s0, ay + (by - ay) * s0); ctx.lineTo(ax + (bx - ax) * s1, ay + (by - ay) * s1); ctx.lineTo(ax + (bx - ax) * s1 + ox * 0.7, ay + (by - ay) * s1 + oy * 0.7); ctx.lineTo(ax + (bx - ax) * s0 + ox * 0.7, ay + (by - ay) * s0 + oy * 0.7); ctx.closePath(); ctx.fill();
    }
  } else {
    if (b.brick) {
      ctx.strokeStyle = 'rgba(70,25,10,0.4)'; ctx.lineWidth = WS_BAKE > 1 ? 1.6 : 0.7; ctx.beginPath();
      for (let f = 0.12; f < 1; f += 0.11) { ctx.moveTo(ax + ox * f, ay + oy * f); ctx.lineTo(bx + ox * f, by + oy * f); }
      ctx.stroke();
    }
    wallWindows(ctx, b, ax, ay, bx, by, ox, oy, side, false);
    if (b.style === 'colonial') {
      // janelas coloniais com venezianas coloridas
      ctx.fillStyle = b.seed % 2 ? '#2f6b4a' : '#2d4f7a';
      const n = Math.max(1, Math.floor((WS_LEN || Math.hypot(bx - ax, by - ay)) / 18)), ex = bx - ax, ey = by - ay;
      for (let f = 0; f < 2; f++) for (let c = 0; c < n; c++) for (const sd of [0.14, 0.72]) {
        const s0 = (c + sd) / n, s1 = s0 + 0.12 / n, f0 = (f + 0.2) / 2, f1 = (f + 0.8) / 2;
        ctx.beginPath(); ctx.moveTo(ax + ex * s0 + ox * f0, ay + ey * s0 + oy * f0); ctx.lineTo(ax + ex * s1 + ox * f0, ay + ey * s1 + oy * f0); ctx.lineTo(ax + ex * s1 + ox * f1, ay + ey * s1 + oy * f1); ctx.lineTo(ax + ex * s0 + ox * f1, ay + ey * s0 + oy * f1); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.moveTo(ax + ox * 0.98, ay + oy * 0.98); ctx.lineTo(bx + ox * 0.98, by + oy * 0.98); ctx.lineTo(bx + ox * 0.9, by + oy * 0.9); ctx.lineTo(ax + ox * 0.9, ay + oy * 0.9); ctx.closePath(); ctx.fill();
    }
    if (b.style === 'apart') {
      // sacadas com grade por andar
      const fl = Math.max(1, Math.floor(b.h / 15));
      ctx.strokeStyle = 'rgba(235,235,225,0.55)'; ctx.lineWidth = WS_BAKE > 1 ? 1.6 : 1; ctx.beginPath();
      for (let f = 1; f <= fl; f++) { const ff = (f - 0.18) / fl; ctx.moveTo(ax + ox * ff, ay + oy * ff); ctx.lineTo(bx + ox * ff, by + oy * ff); }
      ctx.stroke();
    }
  }
  if (b.style === 'garage' && b.front === side) {
    ctx.fillStyle = '#5c6470';
    const s0 = 0.12, s1 = 0.88;
    ctx.beginPath(); ctx.moveTo(ax + (bx - ax) * s0, ay + (by - ay) * s0); ctx.lineTo(ax + (bx - ax) * s1, ay + (by - ay) * s1); ctx.lineTo(ax + (bx - ax) * s1 + ox * 0.78, ay + (by - ay) * s1 + oy * 0.78); ctx.lineTo(ax + (bx - ax) * s0 + ox * 0.78, ay + (by - ay) * s0 + oy * 0.78); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx + ox * 0.08, by + oy * 0.08); ctx.lineTo(ax + ox * 0.08, ay + oy * 0.08); ctx.closePath(); ctx.fill();
}
function wallGraffiti(ctx, b, ax, ay, bx, by, ox, oy) {
  if (Math.hypot(ox, oy) < 4) return;
  let ex = bx - ax, ey = by - ay;
  if (ex * oy - ey * ox > 0) { ax = bx; ay = by; ex = -ex; ey = -ey; }
  const G = b.graf, W = 100, H = 40;
  ctx.save();
  ctx.transform(ex / W, ey / W, -ox / H, -oy / H, ax + ox, ay + oy);
  if (G.kind === 'mural') {
    const cols = ['#e63946', '#f4c430', '#2a9d8f', '#3a86ff', '#ff7f11'];
    for (let i = 0; i < 5; i++) { ctx.fillStyle = cols[(i + (G.seed * 10 | 0)) % 5]; ctx.beginPath(); ctx.ellipse(10 + i * 20, 22 + Math.sin(i + G.seed * 9) * 6, 14, 12, 0, 0, TAU); ctx.fill(); }
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (G.kind === 'pixo') {
    ctx.font = '900 18px "Arial Narrow", Impact, Arial, sans-serif';
    ctx.fillStyle = G.color; ctx.fillText(G.text, 50, 20, 94);
    ctx.fillRect(10, 30, 80, 1.2);
  } else {
    ctx.font = 'italic 900 15px "Segoe UI", Arial, sans-serif';
    if (G.kind === 'mural') { ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.strokeText(G.text, 50, 22, 94); ctx.fillStyle = '#ffffff'; }
    else ctx.fillStyle = G.color;
    ctx.fillText(G.text, 50, 22, 94);
  }
  ctx.fillStyle = G.color; for (let i = 0; i < 4; i++) ctx.fillRect(20 + i * 19 + (G.seed * 7) % 5, 28, 1, 4 + ((i * 7 + G.seed * 13) % 6));
  ctx.restore();
}
function drawBuilding(ctx, b) {
  const [ox, oy] = bldOffset(b);
  const { x0, y0, x1, y1 } = b;
  let alpha = 1;
  if (b.alphaNear && player && player.x > x0 + ox - 10 && player.x < x1 + ox + 10 && player.y > y0 + oy - 10 && player.y < y1 + oy + 10) alpha = 0.4;
  if (alpha < 1) ctx.globalAlpha = alpha;
  const dw = wsUse(ctx, b) ? wallFast : drawWall;
  if (ox > 0.3) dw(ctx, b, x0, y1, x0, y0, ox, oy, 'W'); else if (ox < -0.3) dw(ctx, b, x1, y0, x1, y1, ox, oy, 'E');
  if (oy > 0.3) dw(ctx, b, x0, y0, x1, y0, ox, oy, 'N'); else if (oy < -0.3) dw(ctx, b, x1, y1, x0, y1, ox, oy, 'S');
  ctx.drawImage(roofSprite(b), x0 + ox, y0 + oy, x1 - x0, y1 - y0);
  if (b.party) drawParty(ctx, b, x0 + ox, y0 + oy);
  if (alpha < 1) ctx.globalAlpha = 1;
}
// churrasco na laje
function partySetup(b) {
  const w = b.x1 - b.x0, h = b.y1 - b.y0, R = mulberry32(b.seed + 7);
  const P = { people: [], grill: [w * (R() < 0.5 ? 0.2 : 0.8), h * (R() < 0.5 ? 0.25 : 0.75)], bulbs: [] };
  const n = 4 + ((R() * 4) | 0);
  const cols = ['#e63946', '#f7d000', '#3a86ff', '#f1f1f1', '#2bb24c', '#ff7f11', '#8338ec', '#14213d'];
  for (let i = 0; i < n; i++) P.people.push({ type: 'person', x: 8 + R() * (w - 16), y: 8 + R() * (h - 16), a: R() * TAU, v: 0, phase: 0, seed: R(), dance: true, state: 'idle',
    col: cols[(R() * cols.length) | 0], skin: ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5a3a22'][(R() * 5) | 0], hair: '#1a1410', pants: ['#2b3a55', '#1d1d1f', '#3a5a7a'][(R() * 3) | 0] });
  const bc = ['#ff4d4d', '#ffd23a', '#3cff8f', '#4cc9f0', '#ff6fb5'];
  for (let i = 0; i <= 8; i++) { const t = i / 8; P.bulbs.push([4 + t * (w - 8), h * 0.5 + Math.sin(t * Math.PI) * h * 0.18 - h * 0.18, bc[i % bc.length]]); }
  b.partyD = P; return P;
}
function drawParty(ctx, b, X, Y) {
  const P = b.partyD || partySetup(b);
  ctx.save(); ctx.translate(X, Y);
  // varal de lâmpadas
  ctx.strokeStyle = 'rgba(30,30,30,0.8)'; ctx.lineWidth = 0.7; ctx.beginPath();
  P.bulbs.forEach(([x, y], i) => { if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
  for (const [x, y, c] of P.bulbs) { ctx.fillStyle = c; ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); }
  // churrasqueira e caixa de isopor
  const [gx, gy] = P.grill;
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(gx - 6, gy - 3.5, 12, 7);
  ctx.fillStyle = (Game.time * 3) % 1 < 0.5 ? '#ff6a1a' : '#ff8a2a'; ctx.fillRect(gx - 5, gy - 2.5, 10, 5);
  ctx.strokeStyle = '#777'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let i = -4; i <= 4; i += 2) { ctx.moveTo(gx + i, gy - 2.5); ctx.lineTo(gx + i, gy + 2.5); } ctx.stroke();
  ctx.fillStyle = '#f2f2ee'; ctx.fillRect(gx + (gx > 30 ? -16 : 9), gy - 3, 7, 5); ctx.fillStyle = '#3a86ff'; ctx.fillRect(gx + (gx > 30 ? -16 : 9), gy - 3, 7, 1.4);
  if (Settings.quality !== 'baixa') for (const pp of P.people) drawAnimal(ctx, pp);
  ctx.restore();
  if (chance(0.06)) Particles.emit('smoke', b.x0 + gx, b.y0 + gy, rnd(-6, 6), rnd(-14, -4), rnd(1.2, 2), 4);
}
function drawBuildingEmissive(ctx, b) {
  const [ox, oy] = bldOffset(b);
  const { x0, y0, x1, y1 } = b;
  if (ox > 0.3) wallWindows(ctx, b, x0, y1, x0, y0, ox, oy, 'W', true); else if (ox < -0.3) wallWindows(ctx, b, x1, y0, x1, y1, ox, oy, 'E', true);
  if (oy > 0.3) wallWindows(ctx, b, x0, y0, x1, y0, ox, oy, 'N', true); else if (oy < -0.3) wallWindows(ctx, b, x1, y1, x0, y1, ox, oy, 'S', true);
  if (b.sign) { const gs = signGlow(b); ctx.globalAlpha = 0.9; ctx.drawImage(gs, x0 + ox - 10, y0 + oy - 10); ctx.globalAlpha = 1; }
  if (b.party && b.partyD) {
    const P = b.partyD;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < P.bulbs.length; i++) { const [x, y, c] = P.bulbs[i]; if ((i + Math.floor(Game.time * 2)) % 3) ctx.drawImage(glowSprite(c), x0 + ox + x - 6, y0 + oy + y - 6, 12, 12); }
    ctx.drawImage(glowSprite('#ff7a1a'), x0 + ox + P.grill[0] - 14, y0 + oy + P.grill[1] - 14, 28, 28);
    ctx.globalAlpha = 1;
  }
  if (b.antenna && b.roof) {
    const on = (Game.time + b.seed * 0.001) % 1.6 < 0.5;
    if (on) { const s = glowSprite('#ff3b3b'); ctx.drawImage(s, x0 + ox + b.antenna[0] - 9, y0 + oy + b.antenna[1] - 9, 18, 18); }
  }
}

/* ---------- objetos altos ---------- */
function offAt(x, y, h) {
  const ox = (x - Cam.x) * h * PAR, oy = (y - Cam.y) * h * PAR - h * TILT_H;
  return [ox, oy];
}
const FLAG_COLS = ['#e63946', '#f4c430', '#2a9d8f', '#3a86ff', '#ff7f11', '#8338ec', '#f1f1f1', '#2bb24c'];
function drawTall(ctx, o) {
  switch (o.kind) {
    case 'bld': drawBuilding(ctx, o); break;
    case 'tree': {
      if (o.removed) break;
      if (o.down !== undefined) {
        const spr2 = treeSprite(o.type, o.v), S2 = 64 * o.size * (o.type === 'bush' ? 0.55 : 1);
        ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 3 * o.size; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + Math.cos(o.down) * S2 * 0.4, o.y + Math.sin(o.down) * S2 * 0.4); ctx.stroke();
        ctx.save(); ctx.translate(o.x + Math.cos(o.down) * S2 * 0.55, o.y + Math.sin(o.down) * S2 * 0.55); ctx.rotate(o.down); ctx.globalAlpha = 0.95;
        ctx.drawImage(spr2, -S2 * 0.45, -S2 * 0.32, S2 * 0.9, S2 * 0.64); ctx.restore(); ctx.globalAlpha = 1;
        break;
      }
      const [ox0, oy] = offAt(o.x, o.y, o.h);
      const ox = ox0 + Math.sin(Game.time * 1.3 + o.x * 0.05) * 0.9 * o.size;
      const spr = treeSprite(o.type, o.v);
      const S = 64 * o.size * (o.type === 'bush' ? 0.55 : 1);
      let a = 1;
      if (player && Game.state !== 'menu') { const d = Math.hypot(player.x - o.x - ox, player.y - o.y - oy); if (d < S * 0.45) a = 0.42; }
      if (a < 1) ctx.globalAlpha = a;
      if (o.type !== 'bush' && Math.hypot(ox, oy) > 3) { ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 3 * o.size; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox * 0.8, o.y + oy * 0.8); ctx.stroke(); }
      ctx.drawImage(spr, o.x + ox - S / 2, o.y + oy - S / 2, S, S);
      if (a < 1) ctx.globalAlpha = 1;
      break;
    }
    case 'lamp': {
      if (o.down !== undefined) {
        const L = o.h * 0.85, ex = o.x + Math.cos(o.down) * L, ey = o.y + Math.sin(o.down) * L;
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(o.x + 2, o.y + 3); ctx.lineTo(ex + 2, ey + 3); ctx.stroke();
        ctx.strokeStyle = '#4a4d52'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = '#3a3d42'; ctx.beginPath(); ctx.ellipse(ex, ey, 6, 3.5, o.down, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a5d62'; ctx.beginPath(); ctx.arc(o.x, o.y, 2.6, 0, TAU); ctx.fill();
        break;
      }
      const [ox, oy] = offAt(o.hx, o.hy, o.h);
      const [bx2, by2] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#4a4d52'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + bx2, o.y + by2);
      if (o.style === 'arm') ctx.lineTo(o.hx + ox, o.hy + oy);
      ctx.stroke();
      if (o.style === 'globe') { ctx.fillStyle = o.broken ? '#555' : '#eef3ff'; ctx.beginPath(); ctx.arc(o.hx + ox, o.hy + oy, 4.5, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = '#5c6066'; ctx.beginPath(); ctx.ellipse(o.hx + ox, o.hy + oy, 6, 3.5, Math.atan2(o.hy - o.y, o.hx - o.x), 0, TAU); ctx.fill(); if (o.broken) { ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(o.hx + ox, o.hy + oy, 2.2, 0, TAU); ctx.fill(); } } // lâmpada acesa: o brilho por cima já mostra
      break;
    }
    case 'tlight': {
      if (o.down !== undefined) { drawFallen(ctx, o, '#3a3d42', (x, y) => { ctx.fillStyle = '#16181b'; ctx.fillRect(x - 4, y - 4, 8, 8); }); break; }
      const [ox, oy] = offAt(o.hx, o.hy, o.h);
      const [px, py] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#3a3d42'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + px, o.y + py); ctx.lineTo(o.hx + ox, o.hy + oy); ctx.stroke();
      ctx.save(); ctx.translate(o.hx + ox, o.hy + oy); ctx.rotate(o.a);
      ctx.fillStyle = '#16181b'; ctx.fillRect(-4, -8, 8, 16);
      const st = lightState(o.node, o.axis, Game.time);
      const cols = [['R', '#ff3b30', -5], ['Y', '#ffb000', 0], ['G', '#2bff7a', 5]];
      for (const [k, c, yy] of cols) { ctx.fillStyle = st === k ? c : '#2a2c30'; ctx.beginPath(); ctx.arc(0, yy, 2, 0, TAU); ctx.fill(); }
      ctx.restore();
      break;
    }
    case 'sign': {
      if (o.down !== undefined) { drawFallen(ctx, o, '#8a8d92', (x, y) => { ctx.fillStyle = '#c8241c'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); }); break; }
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#8a8d92'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox, o.y + oy); ctx.stroke();
      ctx.save(); ctx.translate(o.x + ox, o.y + oy);
      ctx.fillStyle = '#c8241c'; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(-3.5, -0.7, 7, 1.4);
      ctx.restore();
      break;
    }
    case 'canopy': {
      const [ox, oy] = offAt(o.cx, o.cy, o.h);
      ctx.strokeStyle = '#d8d8d2'; ctx.lineWidth = 4;
      ctx.beginPath();
      for (const [px, py] of [[o.x0 + 14, o.y0 + 14], [o.x1 - 14, o.y0 + 14], [o.x0 + 14, o.y1 - 14], [o.x1 - 14, o.y1 - 14]]) { ctx.moveTo(px, py); ctx.lineTo(px + ox, py + oy); }
      ctx.stroke();
      let a = 1;
      if (player && Game.state !== 'menu' && player.x > o.x0 + ox && player.x < o.x1 + ox && player.y > o.y0 + oy && player.y < o.y1 + oy) a = 0.32;
      ctx.globalAlpha = a;
      const w = o.x1 - o.x0, h = o.y1 - o.y0;
      ctx.fillStyle = '#e9e9e4'; ctx.fillRect(o.x0 + ox, o.y0 + oy, w, h);
      ctx.fillStyle = o.color; ctx.fillRect(o.x0 + ox, o.y0 + oy, w, 7); ctx.fillRect(o.x0 + ox, o.y1 + oy - 7, w, 7); ctx.fillRect(o.x0 + ox, o.y0 + oy, 7, h); ctx.fillRect(o.x1 + ox - 7, o.y0 + oy, 7, h);
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = o.x0 + 20; x < o.x1 - 10; x += 20) ctx.fillRect(x + ox, o.y0 + oy + 7, 1.5, h - 14);
      ctx.font = '800 16px "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = shade(o.color, -0.2); ctx.fillText(o.name.toUpperCase(), o.cx + ox, o.cy + oy);
      ctx.globalAlpha = 1;
      break;
    }
    case 'totem': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#6a6d72'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox, o.y + oy); ctx.stroke();
      ctx.fillStyle = '#1a1c20'; ctx.fillRect(o.x + ox - 16, o.y + oy - 22, 32, 44);
      ctx.fillStyle = o.color; ctx.fillRect(o.x + ox - 16, o.y + oy - 22, 32, 10);
      break;
    }
    case 'wires': {
      ctx.strokeStyle = 'rgba(16,16,18,0.8)'; ctx.lineWidth = 0.9;
      const P = o.pts;
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        for (let i = 0; i < P.length - 1; i++) {
          const [ax, ay] = P[i], [bx, by] = P[i + 1];
          const [aox, aoy] = offAt(ax, ay, o.h - w * 4), [box, boy] = offAt(bx, by, o.h - w * 4);
          const x0 = ax + aox, y0 = ay + aoy, x1 = bx + box, y1 = by + boy;
          ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 14 + w * 3, x1, y1);
        }
        ctx.stroke();
      }
      // "gato" emaranhado em alguns postes
      for (let i = 0; i < P.length; i++) {
        if (hash2(i, o.seed * 1000 | 0) > 0.3) continue;
        const [ax, ay] = P[i], [aox, aoy] = offAt(ax, ay, o.h - 4);
        ctx.beginPath(); ctx.ellipse(ax + aox + 3, ay + aoy + 4, 5, 3, 0.4, 0, TAU); ctx.ellipse(ax + aox - 2, ay + aoy + 6, 3.5, 2.5, -0.3, 0, TAU); ctx.stroke();
      }
      break;
    }
    case 'flags': {
      const [aox, aoy] = offAt(o.x1, o.y1, o.h), [box, boy] = offAt(o.x2, o.y2, o.h);
      const x0 = o.x1 + aox, y0 = o.y1 + aoy, x1 = o.x2 + box, y1 = o.y2 + boy;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + 12;
      ctx.strokeStyle = 'rgba(30,26,22,0.8)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
      const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(3, Math.floor(L / 9));
      // junta as bandeirinhas da mesma cor numa pincelada só (8 em vez de uma por bandeirinha)
      const cols = FLAG_COLS, so = o.seed * 8 | 0;
      for (let k = 0; k < cols.length; k++) {
        let any = false;
        ctx.beginPath();
        for (let i = 1; i < n; i++) {
          if ((i + so) % cols.length !== k) continue;
          const t = i / n, u = 1 - t;
          const px = u * u * x0 + 2 * u * t * cx + t * t * x1, py = u * u * y0 + 2 * u * t * cy + t * t * y1;
          const t2 = (i + 0.6) / n, u2 = 1 - t2;
          const qx = u2 * u2 * x0 + 2 * u2 * t2 * cx + t2 * t2 * x1, qy = u2 * u2 * y0 + 2 * u2 * t2 * cy + t2 * t2 * y1;
          const sw = Math.sin(Game.time * 3 + i + o.seed * 9) * 1.2;
          ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.lineTo((px + qx) / 2 + sw, (py + qy) / 2 + 6); ctx.closePath(); any = true;
        }
        if (any) { ctx.fillStyle = cols[k]; ctx.fill(); }
      }
      break;
    }
    case 'gsign': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#8a8d92'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(o.x - 26, o.y); ctx.lineTo(o.x - 26 + ox, o.y + oy); ctx.moveTo(o.x + 26, o.y); ctx.lineTo(o.x + 26 + ox, o.y + oy); ctx.stroke();
      if (!o.panel) {
        const c = makeCanvas(240, 96), g = c.getContext('2d');
        g.fillStyle = '#0f6b3a'; g.fillRect(0, 0, 240, 96); g.strokeStyle = '#f2f2ea'; g.lineWidth = 4; g.strokeRect(5, 5, 230, 86);
        g.fillStyle = '#f2f2ea'; g.font = '800 22px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(o.lines[0], 120, 32, 220); g.fillText(o.lines[1], 120, 66, 220);
        o.panel = c;
      }
      ctx.drawImage(o.panel, o.x + ox - 55, o.y + oy - 22, 110, 44);
      break;
    }
    case 'stall': {
      if (o.down !== undefined) { const fr = ['#ffcf3a', '#e63946', '#7cc24a', '#ff8a2a']; for (let i = 0; i < 16; i++) { ctx.fillStyle = fr[i % 4]; ctx.beginPath(); ctx.arc(o.x + Math.cos(o.down + i) * (6 + i * 1.8), o.y + Math.sin(o.down + i * 1.7) * (4 + i), 1.6, 0, TAU); ctx.fill(); } ctx.save(); ctx.translate(o.x + Math.cos(o.down) * 16, o.y + Math.sin(o.down) * 16); ctx.rotate(o.down + 0.6); for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f2f2ea' : o.c; ctx.fillRect(-15 + i * 5, -6, 5, 12); } ctx.restore(); break; }
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(o.x - 12, o.y - 7, 24, 14);
      const fr = ['#ffcf3a', '#e63946', '#7cc24a', '#ff8a2a', '#a35bd6'];
      for (let i = 0; i < 12; i++) { ctx.fillStyle = fr[(i + o.seed) % fr.length]; ctx.beginPath(); ctx.arc(o.x - 9 + (i % 6) * 3.6, o.y - 3 + Math.floor(i / 6) * 5, 1.6, 0, TAU); ctx.fill(); }
      ctx.save(); ctx.translate(o.x + ox, o.y + oy);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f2f2ea' : o.c; ctx.fillRect(-15 + i * 5, -10, 5, 20); }
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-15, 8, 30, 2);
      ctx.restore();
      break;
    }
    case 'grill': {
      if (o.down !== undefined) { ctx.save(); ctx.translate(o.x + Math.cos(o.down) * 8, o.y + Math.sin(o.down) * 8); ctx.rotate(o.down + 1.2); ctx.fillStyle = '#7a7d82'; ctx.fillRect(-9, -5, 18, 10); ctx.restore(); ctx.fillStyle = '#ff6a2a'; for (let i = 0; i < 8; i++) ctx.fillRect(o.x + Math.cos(o.down + i) * (4 + i * 2), o.y + Math.sin(o.down + i * 1.3) * (3 + i * 1.5), 1.6, 1.6); break; }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(o.x - 7, o.y - 3, 17, 10);
      ctx.fillStyle = '#7a7d82'; ctx.fillRect(o.x - 9, o.y - 5, 18, 10);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(o.x - 8, o.y - 4, 16, 8);
      const fl = 0.6 + 0.4 * Math.sin(Game.time * 9 + o.x);
      ctx.fillStyle = `rgba(255,${90 + fl * 60 | 0},30,0.9)`; ctx.fillRect(o.x - 7, o.y - 3, 14, 6);
      ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let i = -6; i <= 6; i += 3) { ctx.moveTo(o.x + i, o.y - 7); ctx.lineTo(o.x + i, o.y + 7); } ctx.stroke();
      ctx.fillStyle = '#5a2a1a'; for (let i = -6; i <= 6; i += 3) { ctx.fillRect(o.x + i - 1, o.y - 2.5, 2, 1.6); ctx.fillRect(o.x + i - 1, o.y + 1, 2, 1.6); }
      ctx.fillStyle = '#333'; ctx.fillRect(o.x - 11, o.y + 5, 3, 3); ctx.fillRect(o.x + 8, o.y + 5, 3, 3);
      break;
    }
    case 'radar': {
      if (o.down !== undefined) { drawFallen(ctx, o, '#6a6d72', (x, y) => { ctx.fillStyle = '#2a2d33'; ctx.fillRect(x - 6, y - 5, 12, 10); ctx.fillStyle = '#1d4fa0'; ctx.fillRect(x - 7, y + 5, 14, 6); }); break; }
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#6a6d72'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox, o.y + oy); ctx.stroke();
      ctx.fillStyle = '#2a2d33'; ctx.fillRect(o.x + ox - 6, o.y + oy - 5, 12, 10);
      ctx.fillStyle = '#0c0e12'; ctx.beginPath(); ctx.arc(o.x + ox, o.y + oy, 2.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1d4fa0'; ctx.fillRect(o.x + ox - 7, o.y + oy - 14, 14, 8);
      ctx.fillStyle = '#fff'; ctx.font = '800 6px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(o.lim), o.x + ox, o.y + oy - 10);
      break;
    }
    case 'phone': {
      if (o.down !== undefined) { drawFallen(ctx, o, '#5a5d62', (x, y) => { ctx.fillStyle = o.col; ctx.beginPath(); ctx.ellipse(x, y, 7, 6, o.down, 0, TAU); ctx.fill(); }); break; }
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#5a5d62'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox, o.y + oy + 4); ctx.stroke();
      const hx = o.x + ox, hy = o.y + oy;
      const gr = ctx.createRadialGradient(hx - 2, hy - 3, 1, hx, hy, 8);
      gr.addColorStop(0, shade(o.col, 0.35)); gr.addColorStop(1, shade(o.col, -0.25));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(hx, hy, 7, 8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(hx, hy + 2.5, 4.2, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c9c9c4'; ctx.fillRect(hx - 1.5, hy + 1, 3, 3.5);
      break;
    }
    case 'busstop': {
      if (o.down !== undefined) { ctx.save(); ctx.translate(o.x + Math.cos(o.down) * 10, o.y + Math.sin(o.down) * 10); ctx.rotate(o.a + 0.4); ctx.fillStyle = '#3a3d42'; ctx.fillRect(-23, -7, 46, 14); ctx.fillStyle = '#2a6fd1'; ctx.fillRect(-23, -7, 10, 14); ctx.restore(); ctx.fillStyle = 'rgba(190,220,240,0.7)'; for (let i = 0; i < 18; i++) ctx.fillRect(o.x + (hash2(i, 3) - 0.5) * 50, o.y + (hash2(i, 4) - 0.5) * 30, 1.6, 1.6); break; }
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a);
      ctx.fillStyle = '#5a5d62'; ctx.fillRect(-20, -5, 2, 2); ctx.fillRect(18, -5, 2, 2);
      ctx.restore();
      ctx.save(); ctx.translate(o.x + ox, o.y + oy); ctx.rotate(o.a);
      ctx.fillStyle = 'rgba(120,170,210,0.55)'; ctx.fillRect(-23, -7, 46, 14);
      ctx.strokeStyle = '#3a3d42'; ctx.lineWidth = 1.5; ctx.strokeRect(-23, -7, 46, 14);
      ctx.fillStyle = '#2a6fd1'; ctx.fillRect(-23, -7, 10, 14);
      ctx.restore();
      break;
    }
    case 'watertower': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#7a7d80'; ctx.lineWidth = 4;
      ctx.beginPath();
      for (const [dx, dy] of [[-30, -30], [30, -30], [-30, 30], [30, 30]]) { ctx.moveTo(o.x + dx, o.y + dy); ctx.lineTo(o.x + ox + dx * 0.6, o.y + oy + dy * 0.6); }
      ctx.stroke();
      ctx.lineWidth = 1.5; ctx.beginPath();
      for (const t of [0.35, 0.7]) { const pts = [[-30, -30], [30, -30], [30, 30], [-30, 30]].map(([dx, dy]) => [o.x + dx + (ox + dx * -0.4) * t, o.y + dy + (oy + dy * -0.4) * t]); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); }
      ctx.stroke();
      const tx = o.x + ox, ty = o.y + oy;
      const gr = ctx.createRadialGradient(tx - 12, ty - 12, 4, tx, ty, o.r);
      gr.addColorStop(0, '#d8dde2'); gr.addColorStop(1, '#7a8288');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(tx, ty, o.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#5a6066'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#9aa2a8'; ctx.beginPath(); ctx.arc(tx, ty, o.r * 0.35, 0, TAU); ctx.fill();
      ctx.font = '800 11px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#3a6fa0'; ctx.fillText('ÁGUA', tx, ty + o.r * 0.7);
      break;
    }
    case 'rock': {
      // morro de granito em camadas, mais estreito e claro em cima
      const N = 7;
      for (let k = 0; k <= N; k++) {
        const t = k / N, [ox, oy] = offAt(o.x, o.y, o.h * t), rr = o.r * (1 - t * 0.62);
        const sh = 0.55 + t * 0.4;
        const cxk = o.x + ox, cyk = o.y + oy;
        const gr = ctx.createRadialGradient(cxk - rr * 0.35, cyk - rr * 0.35, rr * 0.1, cxk, cyk, rr * 1.1);
        gr.addColorStop(0, `rgb(${Math.round(120 * sh + 40)},${Math.round(122 * sh + 40)},${Math.round(128 * sh + 42)})`); gr.addColorStop(1, `rgb(${Math.round(60 * sh + 20)},${Math.round(62 * sh + 20)},${Math.round(70 * sh + 22)})`);
        ctx.fillStyle = gr; ctx.beginPath();
        for (let q = 0; q <= 24; q++) { const an = q / 24 * TAU, wob = 1 + 0.09 * Math.sin(an * 3 + o.seed * 20 + k) + 0.05 * Math.sin(an * 7 + o.seed * 9); const px = cxk + Math.cos(an) * rr * 1.08 * wob, py = cyk + Math.sin(an) * rr * wob; if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.closePath(); ctx.fill();
        if (k > 1 && k < N) { ctx.strokeStyle = 'rgba(40,44,52,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(o.x + ox, o.y + oy, rr * 0.92, o.seed * 6 + k, o.seed * 6 + k + 1.4); ctx.stroke(); }
      }
      const [tx, ty] = offAt(o.x, o.y, o.h);
      ctx.fillStyle = 'rgba(70,110,50,0.55)'; ctx.beginPath(); ctx.ellipse(o.x + tx - o.r * 0.08, o.y + ty - o.r * 0.06, o.r * 0.22, o.r * 0.16, 0, 0, TAU); ctx.fill();
      break;
    }
    case 'crane': {
      // guindaste de porto: 4 pernas, pórtico no alto e a lança apontando para o mar
      const [ox, oy] = offAt(o.x, o.y, o.h), legs = [[-16, -16], [16, -16], [16, 16], [-16, 16]];
      ctx.strokeStyle = '#d98a1a'; ctx.lineWidth = 3;
      ctx.beginPath(); for (const [dx, dy] of legs) { ctx.moveTo(o.x + dx, o.y + dy); ctx.lineTo(o.x + dx + ox, o.y + dy + oy); } ctx.stroke();
      ctx.lineWidth = 1.4; ctx.beginPath(); for (const t of [0.35, 0.7]) { ctx.moveTo(o.x - 16 + ox * t, o.y - 16 + oy * t); ctx.lineTo(o.x + 16 + ox * t, o.y + 16 + oy * t); ctx.moveTo(o.x + 16 + ox * t, o.y - 16 + oy * t); ctx.lineTo(o.x - 16 + ox * t, o.y + 16 + oy * t); } ctx.stroke();
      const ca = Math.cos(o.a), sa = Math.sin(o.a), tx = o.x + ox, ty = o.y + oy;
      ctx.fillStyle = '#f0a020'; ctx.fillRect(tx - 22, ty - 22, 44, 44);
      ctx.fillStyle = '#2a2d33'; ctx.fillRect(tx - 10, ty - 14, 20, 14);
      ctx.strokeStyle = '#f0a020'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx - ca * 40, ty - sa * 40); ctx.lineTo(tx + ca * o.len, ty + sa * o.len); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (let t = 20; t < o.len; t += 14) { ctx.moveTo(tx + ca * t - sa * 3, ty + sa * t + ca * 3); ctx.lineTo(tx + ca * (t + 7) + sa * 3, ty + sa * (t + 7) - ca * 3); } ctx.stroke();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx + ca * o.len * 0.75, ty + sa * o.len * 0.75); ctx.lineTo(o.x + ca * o.len * 0.75, o.y + sa * o.len * 0.75); ctx.stroke();
      o.lightAt = [tx + ca * o.len, ty + sa * o.len];
      break;
    }
    case 'silo': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      const tx = o.x + ox, ty = o.y + oy, r = o.r;
      const ang = Math.atan2(oy, ox) + Math.PI / 2;
      ctx.fillStyle = '#9aa0a4';
      ctx.beginPath(); ctx.moveTo(o.x + Math.cos(ang) * r, o.y + Math.sin(ang) * r); ctx.lineTo(tx + Math.cos(ang) * r, ty + Math.sin(ang) * r);
      ctx.lineTo(tx - Math.cos(ang) * r, ty - Math.sin(ang) * r); ctx.lineTo(o.x - Math.cos(ang) * r, o.y - Math.sin(ang) * r); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
      for (let t = 0.1; t < 1; t += 0.12) { ctx.beginPath(); ctx.arc(o.x + ox * t, o.y + oy * t, r, ang, ang + Math.PI); ctx.stroke(); }
      const gr = ctx.createRadialGradient(tx - 10, ty - 10, 3, tx, ty, r);
      gr.addColorStop(0, '#e2e6e8'); gr.addColorStop(1, '#8a9094');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(tx, ty, r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6a7074'; ctx.beginPath(); ctx.arc(tx, ty, 5, 0, TAU); ctx.fill();
      break;
    }
    case 'windmill': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#8a8d90'; ctx.lineWidth = 2;
      ctx.beginPath(); for (const [dx, dy] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) { ctx.moveTo(o.x + dx, o.y + dy); ctx.lineTo(o.x + ox, o.y + oy); } ctx.stroke();
      ctx.save(); ctx.translate(o.x + ox, o.y + oy); ctx.rotate(Game.time * 1.8);
      for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.fillStyle = i % 2 ? '#c9ccd0' : '#a8acb0'; ctx.beginPath(); ctx.moveTo(2, -1.5); ctx.lineTo(19, -4); ctx.lineTo(19, 2); ctx.lineTo(2, 1.5); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#5a5d60'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
      ctx.restore();
      break;
    }
    case 'flood': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#5a5d62'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox, o.y + oy); ctx.stroke();
      ctx.save(); ctx.translate(o.x + ox, o.y + oy); ctx.rotate(Math.atan2(o.ty - o.y, o.tx - o.x));
      ctx.fillStyle = '#2a2c30'; ctx.fillRect(-4, -9, 8, 18);
      ctx.fillStyle = '#f4f6ff'; for (let i = -6; i <= 6; i += 4) ctx.fillRect(1, i - 1.2, 3, 2.4);
      ctx.restore();
      break;
    }
    case 'billboard': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#4a4d52'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(o.x - 24, o.y); ctx.lineTo(o.x - 24 + ox, o.y + oy); ctx.moveTo(o.x + 24, o.y); ctx.lineTo(o.x + 24 + ox, o.y + oy); ctx.stroke();
      ctx.drawImage(billboardPanel(o), o.x + ox - 50, o.y + oy - 20, 100, 40);
      break;
    }
  }
}
function drawFallen(ctx, o, poleCol, head) {
  const L = o.h * 0.85, bx = o.x, by = o.y, ex = bx + Math.cos(o.down) * L, ey = by + Math.sin(o.down) * L;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(bx + 2, by + 3); ctx.lineTo(ex + 2, ey + 3); ctx.stroke();
  ctx.strokeStyle = poleCol; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
  head(ex, ey);
}
function billboardPanel(o) {
  if (o.panel) return o.panel;
  const c = makeCanvas(200, 80), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 200, 80); gr.addColorStop(0, '#1b1e2a'); gr.addColorStop(1, '#2c2f40');
  g.fillStyle = gr; g.fillRect(0, 0, 200, 80);
  g.fillStyle = o.col; g.fillRect(0, 0, 200, 6); g.fillRect(0, 74, 200, 6);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 21px "Segoe UI", Arial, sans-serif'; g.fillStyle = '#ffffff'; g.fillText(o.text[0], 100, 32, 186);
  g.font = '700 15px "Segoe UI", Arial, sans-serif'; g.fillStyle = o.col; g.fillText(o.text[1], 100, 56, 186);
  g.strokeStyle = '#0a0a0a'; g.lineWidth = 4; g.strokeRect(2, 2, 196, 76);
  o.panel = c;
  return c;
}
function drawTallEmissive(ctx, o) {
  if (o.kind === 'crane' && o.lightAt && (Game.time + o.seed * 3) % 1.4 < 0.5) { const g = glowSprite('#ff3b3b'); ctx.drawImage(g, o.lightAt[0] - 10, o.lightAt[1] - 10, 20, 20); return; }
  switch (o.kind) {
    case 'bld': drawBuildingEmissive(ctx, o); break;
    case 'lamp': {
      if (o.broken) { if (o.light && o.light.dieAt && Game.time < o.light.dieAt && Math.random() < 0.5) { const [ox, oy] = offAt(o.hx, o.hy, o.h); ctx.drawImage(glowSprite('#ffffff'), o.hx + ox - 8, o.hy + oy - 8, 16, 16); } return; }
      const [ox, oy] = offAt(o.hx, o.hy, o.h);
      const hex = lightHex(o.col);
      ctx.drawImage(glowSprite(hex), o.hx + ox - 16, o.hy + oy - 16, 32, 32);
      ctx.drawImage(glowSprite('#ffffff'), o.hx + ox - 5, o.hy + oy - 5, 10, 10);
      // mariposas rodando a lâmpada: só em 30% dos postes das favelas
      if (o.moth === undefined) o.moth = !!FAVELA_RK[regionKeyAt(o.x, o.y)] && hash2(o.x | 0, o.y | 0) < 0.3;
      if (o.moth && Settings.quality !== 'baixa') { ctx.fillStyle = 'rgba(255,240,200,0.75)'; for (let i = 0; i < 3; i++) { const a = Game.time * (3 + i) + i * 2.1 + o.x * 0.01; ctx.fillRect(o.hx + ox + Math.cos(a) * (7 + i * 3), o.hy + oy + Math.sin(a * 1.3) * (6 + i * 2), 1.2, 1.2); } }
      break;
    }
    case 'tlight': {
      if (o.down !== undefined) break;
      const [ox, oy] = offAt(o.hx, o.hy, o.h);
      const st = lightState(o.node, o.axis, Game.time);
      const c = st === 'R' ? '#ff3b30' : st === 'Y' ? '#ffb000' : '#2bff7a';
      const yy = st === 'R' ? -5 : st === 'Y' ? 0 : 5;
      const px = o.hx + ox - Math.sin(o.a) * yy, py = o.hy + oy + Math.cos(o.a) * yy;
      ctx.drawImage(glowSprite(c), px - 10, py - 10, 20, 20);
      break;
    }
    case 'totem': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.fillStyle = 'rgba(255,90,60,0.9)';
      ctx.font = '700 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('5,89', o.x + ox, o.y + oy + 3); ctx.fillText('4,19', o.x + ox, o.y + oy + 14);
      ctx.globalAlpha = 0.6; ctx.drawImage(glowSprite(lightHex(o.color)), o.x + ox - 30, o.y + oy - 30, 60, 60); ctx.globalAlpha = 1;
      break;
    }
    case 'canopy': {
      const [ox, oy] = offAt(o.cx, o.cy, o.h);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let x = o.x0 + 40; x < o.x1 - 20; x += 60) for (const yy of [o.y0 + 30, o.y1 - 30]) ctx.fillRect(x + ox - 10, yy + oy - 2, 20, 4);
      break;
    }
    case 'watertower': {
      if (Game.time % 2 < 0.6) { const [ox, oy] = offAt(o.x, o.y, o.h + 6); ctx.drawImage(glowSprite('#ff2a2a'), o.x + ox - 16, o.y + oy - 16, 32, 32); }
      break;
    }
    case 'flood': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.drawImage(glowSprite('#e8f0ff'), o.x + ox - 22, o.y + oy - 22, 44, 44);
      break;
    }
    case 'billboard': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.globalAlpha = 0.35; ctx.drawImage(billboardPanel(o), o.x + ox - 50, o.y + oy - 20, 100, 40); ctx.globalAlpha = 1;
      break;
    }
    case 'grill': {
      if (o.down !== undefined) break;
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(Game.time * 9 + o.x); ctx.drawImage(glowSprite('#ff7a2a'), o.x - 18, o.y - 18, 36, 36); ctx.globalAlpha = 1;
      break;
    }
    case 'radar': {
      if (o.down !== undefined) break;
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.drawImage(glowSprite('#ff2a2a'), o.x + ox + 3, o.y + oy - 6, 5, 5);
      const fl = Game.time - o.last;
      if (fl < 0.25) { ctx.globalAlpha = 1 - fl * 4; ctx.drawImage(glowSprite('#ffffff'), o.x + ox - 90, o.y + oy - 90, 180, 180); ctx.globalAlpha = 1; }
      break;
    }
    case 'flags': {
      if (!o.bulbs) break;
      const [aox, aoy] = offAt(o.x1, o.y1, o.h), [box, boy] = offAt(o.x2, o.y2, o.h);
      const x0 = o.x1 + aox, y0 = o.y1 + aoy, x1 = o.x2 + box, y1 = o.y2 + boy;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + 12;
      const spr = glowSprite('#ffc46a'), n = Math.max(3, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 18));
      for (let i = 1; i < n; i++) {
        const t = i / n, u = 1 - t;
        const px = u * u * x0 + 2 * u * t * cx + t * t * x1, py = u * u * y0 + 2 * u * t * cy + t * t * y1;
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Game.time * 2 + i); ctx.drawImage(spr, px - 5, py - 5, 10, 10);
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'busstop': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.globalAlpha = 0.5; ctx.drawImage(glowSprite('#cfe0ff'), o.x + ox - 20, o.y + oy - 20, 40, 40); ctx.globalAlpha = 1;
      break;
    }
  }
}

/* ---------- iluminação ---------- */
const _lq = [], _rq = [];
/* ---------- clima: garoa, temporal e pista molhada ---------- */
const Weather = { rain: 0, target: 0, wet: 0, timer: 45, drops: [], ripples: [], thunderT: 15 };
Weather.label = function () { return this.rain > 0.6 ? 'Chuva forte' : this.rain > 0.15 ? 'Garoa' : this.wet > 0.2 ? 'Pista molhada' : ''; };
Weather.update = function (dt) {
  const m = Settings.weather || 'auto';
  if (m === 'limpo') this.target = 0;
  else if (m === 'chuva') this.target = 0.85;
  else {
    this.timer -= dt;
    if (this.timer <= 0) {
      const prev = this.target, r = Math.random();
      this.target = r < 0.5 ? 0 : r < 0.78 ? 0.35 : 0.9;
      this.timer = this.target ? rnd(77, 165) : rnd(90, 200); // chuva 10% mais longa
      if (Game.mode === 'play') {
        if (this.target > 0.2 && prev < 0.2) toast(this.target > 0.6 ? 'Temporal chegando' : 'Começou a garoar', 'Pista molhada: o carro escorrega mais e demora mais para frear.', 'info');
        else if (this.target < 0.1 && prev > 0.2) toast('A chuva parou', 'O asfalto ainda fica molhado por um tempo.', 'info');
      }
    }
  }
  this.rain += clamp(this.target - this.rain, -dt / 10, dt / 10);
  this.wet = Math.max(this.rain, this.wet - dt / 70); // o asfalto demora a secar
  // relâmpago e trovão no temporal
  if (this.rain > 0.6) { this.thunderT -= dt; if (this.thunderT <= 0) { this.thunderT = rnd(14, 32); Cam.flash = Math.max(Cam.flash, 0.55); const d = rnd(0.4, 2); setTimeout(() => AudioSys.thunder(d), d * 1000); } }
  // gotas na tela (espaço da tela)
  const want = Math.round(this.rain * (Settings.quality === 'baixa' ? 81 : Settings.quality === 'alta' ? 378 : 216)); // 10% menos gotas
  // câmera olhando de cima: a gota cai na direção do chão, então na tela ela "afunda" em direção ao centro,
  // encolhendo e ficando mais fina até bater no chão (onde vira respingo)
  const newDrop = (d, z) => { const R = Math.hypot(SCREEN_W, SCREEN_H) * 0.62; d.a = Math.random() * TAU; d.r = Math.sqrt(Math.random()) * R; d.z = z; d.life = rnd(0.3, 0.55); d.l = rnd(0.025, 0.055); return d; };
  while (this.drops.length < want) this.drops.push(newDrop({}, Math.random()));
  if (this.drops.length > want) this.drops.length = want;
  this.wind = lerp(this.wind || 0, Math.sin(Game.time * 0.13) * 0.6 + this.rain * 0.4, 1 - Math.exp(-dt * 0.5));
  for (const d of this.drops) { d.z -= dt / d.life; if (d.z <= 0) newDrop(d, 1); }
  // respingos no chão (espaço do mundo)
  if (Settings.quality !== 'baixa' && this.rain > 0.05) {
    const v = Cam.view, n = this.rain * 54 * dt;
    for (let i = 0; i < n || (Math.random() < n - Math.floor(n) && i < n + 1); i++) {
      const x = rnd(v.x0, v.x1), y = rnd(v.y0, v.y1), g = groundAt(x, y);
      if (g === SF.ROAD || g === SF.PAVED || g === SF.SIDEWALK || g === SF.BRIDGE || g === SF.WATER) this.ripples.push({ x, y, t: 0 });
    }
  }
  for (const r of this.ripples) r.t += dt;
  if (this.ripples.length) this.ripples = this.ripples.filter((r) => r.t < 0.45);
  if (this.ripples.length > 160) this.ripples.splice(0, this.ripples.length - 160);
  AudioSys.rainSet && AudioSys.rainSet(this.rain);
};
// poças: aparecem na chuva no asfalto (junto ao meio-fio) e nas trilhas da estrada de terra
Weather.puddleGrid = null;
Weather.buildPuddles = function () {
  const G = new Map(), C = 400, R = mulberry32(4242);
  const put = (p) => { const k = Math.floor(p.x / C) + ',' + Math.floor(p.y / C); if (!G.has(k)) G.set(k, []); G.get(k).push(p); };
  for (const e of World.edges) {
    if (e.bridge) continue;
    const dirt = e.T.id === 'dirt', step = dirt ? 150 : 280;
    for (let s = 40 + R() * step; s < e.len - 40; s += step * (0.6 + R() * 0.8)) {
      const side = R() < 0.5 ? -1 : 1;
      const lat = dirt ? side * (11 + R() * 14) : side * (e.hw - 9 - R() * 12);
      const x = e.h ? e.a.x + s : e.a.x - lat, y = e.h ? e.a.y + lat : e.a.y + s;
      const along = (dirt ? 14 : 16) + R() * 18, across = 6 + R() * 6;
      if (hash2(x | 0, y | 0) < 0.1) continue; // 10% menos poças
      put({ x, y, rx: e.h ? along : across, ry: e.h ? across : along, mud: dirt, cool: 0, ph: R() * 10 });
    }
  }
  this.puddleGrid = G; this.puddleCell = C;
};
Weather.puddlesNear = function (x0, y0, x1, y1, out) {
  out.length = 0; if (!this.puddleGrid) return out;
  const C = this.puddleCell;
  for (let cx = Math.floor(x0 / C); cx <= Math.floor(x1 / C); cx++) for (let cy = Math.floor(y0 / C); cy <= Math.floor(y1 / C); cy++) { const a = this.puddleGrid.get(cx + ',' + cy); if (a) for (const p of a) out.push(p); }
  return out;
};
const _pq = [];
Weather.drawPuddles = function (ctx, view) {
  if (this.wet < 0.05) return;
  if (!this.puddleGrid) this.buildPuddles();
  const k = clamp((this.wet - 0.05) / 0.4, 0, 1), T = Game.time;
  this.puddlesNear(view.x0 - 40, view.y0 - 40, view.x1 + 40, view.y1 + 40, _pq);
  for (const p of _pq) {
    ctx.globalAlpha = k;
    ctx.fillStyle = p.mud ? 'rgba(52,34,20,0.75)' : 'rgba(16,22,32,0.7)';
    ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = p.mud ? 'rgba(120,90,60,0.5)' : 'rgba(150,170,200,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(210,225,245,0.18)'; ctx.beginPath(); ctx.ellipse(p.x - p.rx * 0.2, p.y - p.ry * 0.25, p.rx * 0.45, p.ry * 0.25, 0, 0, TAU); ctx.fill();
    // gotas caindo na poça: anéis
    if (this.rain > 0.1) { const t = ((T * (0.8 + this.rain) + p.ph) % 1); ctx.strokeStyle = `rgba(200,215,235,${(0.5 * (1 - t) * this.rain).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(p.x + Math.sin(p.ph * 7) * p.rx * 0.4, p.y + Math.cos(p.ph * 5) * p.ry * 0.3, 1 + t * 5, (1 + t * 5) * 0.7, 0, 0, TAU); ctx.stroke(); }
    // ondas depois de você passar
    if (p.wave > 0) { const t = 1 - p.wave; ctx.strokeStyle = `rgba(210,225,245,${(0.6 * p.wave).toFixed(3)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx * (0.4 + t), p.ry * (0.4 + t), 0, 0, TAU); ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
};
// passar na poça: espirra água (ou barro), faz barulho e puxa um pouco o carro
Weather.updatePlayer = function (dt, pl) {
  if (!this.puddleGrid || this.wet < 0.15 || !pl) return;
  this.puddlesNear(pl.x - 60, pl.y - 60, pl.x + 60, pl.y + 60, _pq);
  for (const p of _pq) {
    if (p.wave > 0) p.wave = Math.max(0, p.wave - dt * 1.2);
    p.cool -= dt;
    const dx = (pl.x - p.x) / (p.rx + 8), dy = (pl.y - p.y) / (p.ry + 8);
    if (dx * dx + dy * dy > 1 || p.cool > 0) continue;
    const sp = pl.speed; if (sp < 30) continue;
    p.cool = 0.6; p.wave = 1;
    const n = Math.min(17, 4 + sp / 28); // espirro 35% mais leve
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(pl.vy, pl.vx) + (chance(0.5) ? 1 : -1) * rnd(1.1, 1.9), v = rnd(60, 140) + sp * 0.25;
      Particles.emit(p.mud ? 'mud' : 'water', pl.x + rnd(-8, 8), pl.y + rnd(-8, 8), Math.cos(a) * v, Math.sin(a) * v, rnd(0.35, 0.7), p.mud ? 3 : 3.5);
    }
    AudioSys.noise(0.35, p.mud ? 700 : 1900, 0.7, clamp(sp / 900, 0.05, 0.22), 'engine', 'bandpass');
    pl.vx *= 0.96; pl.vy *= 0.96;
    if (sp > 260) pl.spin += rnd(-0.5, 0.5) * this.wet; // aquaplanagem leve
    if (p.mud) { pl.mud = Math.min(1, (pl.mud || 0) + 0.3); Profile.dirt = clamp(Profile.dirt + 0.04, 0, 1); }
    Cam.shake = Math.max(Cam.shake, 1.5);
  }
};
Weather.drawRipples = function (ctx, view) {
  if (!this.ripples.length) return;
  ctx.strokeStyle = 'rgba(200,215,235,0.5)'; ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const r of this.ripples) { if (!inView(view, r.x, r.y, 10)) continue; const k = r.t / 0.45, rr = 1 + k * 6; ctx.moveTo(r.x + rr, r.y); ctx.ellipse(r.x, r.y, rr, rr * 0.6, 0, 0, TAU); }
  ctx.globalAlpha = 0.6; ctx.stroke();
  ctx.fillStyle = 'rgba(225,235,250,0.7)';
  for (const r of this.ripples) if (r.t < 0.12 && inView(view, r.x, r.y, 4)) ctx.fillRect(r.x - 0.8, r.y - 0.8, 1.6, 1.6);
  ctx.globalAlpha = 1;
};
Weather.drawDrops = function (ctx) {
  if (!this.drops.length) return;
  ctx.setTransform(RS, 0, 0, RS, 0, 0);
  const cx = SCREEN_W / 2, cy = SCREEN_H / 2, wx = (this.wind || 0) * 60;
  // duas camadas: gotas perto da câmera (grossas e claras) e longe (finas)
  for (const near of [true, false]) {
    ctx.strokeStyle = near ? 'rgba(200,215,240,0.34)' : 'rgba(170,190,220,0.22)'; ctx.lineWidth = near ? 1.6 : 0.9;
    ctx.beginPath();
    for (const d of this.drops) {
      if ((d.z > 0.5) !== near) continue;
      const k = 0.55 + 0.45 * d.z; // perto da câmera = mais longe do centro
      const ca = Math.cos(d.a), sa = Math.sin(d.a);
      const x = cx + ca * d.r * k + wx * (1 - d.z), y = cy + sa * d.r * k;
      const tl = Math.max(4, d.r * d.l) * (0.4 + d.z); // rastro curto apontando para fora (de onde a gota veio)
      ctx.moveTo(x, y); ctx.lineTo(x + ca * tl - wx * 0.08, y + sa * tl);
    }
    ctx.stroke();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
const Fireflies = { list: [] };
function updateFireflies(dt) {
  const R = REGIONS[regionKeyAt(Cam.x, Cam.y)];
  const want = R.rural > 0.5 && Settings.quality !== 'baixa' ? (Settings.quality === 'alta' ? 85 : 45) : 0;
  while (Fireflies.list.length < want) Fireflies.list.push({ x: Cam.x + rnd(-900, 900), y: Cam.y + rnd(-600, 600), ph: rnd(TAU), vx: rnd(-8, 8), vy: rnd(-8, 8) });
  if (Fireflies.list.length > want) Fireflies.list.length = want;
  for (const f of Fireflies.list) {
    f.ph += dt; f.x += (f.vx + Math.sin(f.ph * 0.7) * 6) * dt; f.y += (f.vy + Math.cos(f.ph * 0.9) * 6) * dt;
    if (Math.abs(f.x - Cam.x) > 1000 || Math.abs(f.y - Cam.y) > 700) { f.x = Cam.x + rnd(-900, 900); f.y = Cam.y + rnd(-600, 600); }
  }
}
// força do farol do jogador: frente amassada deixa o farol fraco e piscando
function headlightK() {
  const zf = Profile.zones ? Profile.zones.f : 0;
  if (zf < 0.35) return 1;
  let k = 1 - (zf - 0.35) / 0.65 * 0.75;
  if (zf > 0.65) { const T = Game.time, f = Math.sin(T * 17.3) + Math.sin(T * 5.1 + 1.7) + Math.sin(T * 41 + 0.4) * 0.6; if (f > 1.5) k *= 0.3; }
  return clamp(k, 0.2, 1);
}
// farol de cada lado (s = -1 esquerdo, 1 direito): lado muito amassado apaga aquele farol
// nunca apagam os dois: no máximo um farol para, o outro fica fraquinho
function playerLamp(s) {
  const LK = CarLife.lampK(); if (LK <= 0) return 0; // farol desligado (H) ou bateria arriada
  return playerLampBase(s) * LK;
}
function playerLampBase(s) {
  const Z = Profile.zones || {};
  const dmg = (q) => Math.max(q < 0 ? Z.l || 0 : Z.rt || 0, q < 0 ? Z.fL || 0 : Z.fR || 0);
  const me = dmg(s), other = dmg(-s), f = Z.f || 0;
  // qual lado apagaria: o mais amassado (empate: o esquerdo)
  const worst = me > other || (me === other && s < 0);
  const off = (me > 0.82 || f > 0.97) && worst;
  if (off) return 0;
  let k = headlightK() * (me > 0.55 ? 0.7 : 1);
  if (me > 0.82 || f > 0.97) k = Math.min(k, 0.4); // o farol que sobrou, também amassado, fica fraquinho
  return Math.max(k, 0.22);
}
function carLightsInfo(c, isPlayer) {
  const m = c.m, as = Math.atan2(Math.sin(c.a) * SQ, Math.cos(c.a)), ca = Math.cos(as), sa = Math.sin(as);
  const hl = m.L / 2, hw = Math.max(0, m.W / 2 - 4);
  const cy = c.y - vehLift(m) / SQ;
  return { ca, sa, fx: c.x + ca * hl, fy: cy + sa * hl / SQ, rx: c.x - ca * hl, ry: cy - sa * hl / SQ, nx: -sa * hw, ny: ca * hw / SQ };
}
function lightPass(view, cx, cy) {
  const lw = lightCanvas.width, lh = lightCanvas.height;
  const zl = Cam.zoom * LS;
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalCompositeOperation = 'source-over';
  lctx.globalAlpha = 1;
  lctx.fillStyle = `rgba(6,11,30,${Cam.dark.toFixed(3)})`;
  lctx.fillRect(0, 0, lw, lh);
  lctx.globalCompositeOperation = 'destination-out';
  lctx.setTransform(zl, 0, 0, zl * SQ, lw / 2 - cx * zl, lh / 2 - cy * zl * SQ);
  lightGrid.query(view.x0 - 260, view.y0 - 260, view.x1 + 260, view.y1 + 260, _lq);
  const T = Game.time;
  for (const L of _lq) {
    let i = L.i;
    if (L.dieAt) { if (T > L.dieAt) continue; i *= Math.random() < 0.5 ? 0.1 : 1; }
    if (L.flick) { const f = Math.sin(T * 23 + L.seed * 50) + Math.sin(T * 7.3 + L.seed * 9); i *= f > 1.2 ? 0.25 : 1; }
    lctx.globalAlpha = i;
    lctx.drawImage(LSPR, L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
  }
  const cone = (c, len, alpha) => {
    const I = carLightsInfo(c);
    lctx.save(); lctx.translate(I.fx, I.fy); lctx.rotate(c.a); lctx.globalAlpha = alpha;
    lctx.drawImage(CONE, -4, -len / 4, len, len / 2);
    lctx.restore();
    lctx.globalAlpha = alpha * 0.6;
    lctx.drawImage(LSPR, c.x - 34, c.y - 34, 68, 68);
  };
  for (const c of Traffic.cars) {
    if (c.x < view.x0 - 400 || c.x > view.x1 + 400 || c.y < view.y0 - 400 || c.y > view.y1 + 400) continue;
    cone(c, c.big ? 300 : 250, 0.85);
  }
  Events.drawLights(lctx, view);
  for (const u of Police.units) { if (!inView(view, u.x, u.y, 400)) continue; cone(u, 280, 0.85); lctx.globalAlpha = 0.5; lctx.drawImage(LSPR, u.x - 120, u.y - 120, 240, 240); }
  if (player && Game.state !== 'menu') {
    // um facho saindo de cada farol, na posição real da lâmpada
    const I = carLightsInfo(player), base = player.highBeam ? 520 : 360;
    for (const s of [-1, 1]) {
      const k = playerLamp(s); if (k <= 0.01) continue;
      const len = base * (0.45 + 0.55 * k);
      lctx.save(); lctx.translate(I.fx + I.nx * s, I.fy + I.ny * s); lctx.rotate(player.a + s * 0.03); lctx.globalAlpha = 0.72 * k;
      lctx.drawImage(CONE, -2, -len * 0.21, len, len * 0.42);
      lctx.restore();
    }
    lctx.globalAlpha = (CarLife.lightsOn() ? 0.22 : 0.1) + (carKit(player.car.id).neon ? 0.18 : 0); lctx.drawImage(LSPR, player.x - 105, player.y - 105, 210, 210); // brilho em volta do carro (60% mais fraco)
  }
  lctx.globalAlpha = 1;
  lctx.globalCompositeOperation = 'source-over';
  lctx.setTransform(1, 0, 0, 1, 0, 0);
}
function glowPass(view, cx, cy) {
  // camada de brilho colorido em baixa resolução (poças de luz e cones)
  const gw = glowCanvas.width, gh = glowCanvas.height, zl = Cam.zoom * LS;
  gctx.setTransform(1, 0, 0, 1, 0, 0);
  gctx.globalCompositeOperation = 'source-over'; gctx.globalAlpha = 1;
  gctx.clearRect(0, 0, gw, gh);
  gctx.globalCompositeOperation = 'lighter';
  gctx.setTransform(zl, 0, 0, zl * SQ, gw / 2 - cx * zl, gh / 2 - cy * zl * SQ);
  const T = Game.time;
  for (const L of _lq) {
    if (L.x < view.x0 - L.r || L.x > view.x1 + L.r || L.y < view.y0 - L.r || L.y > view.y1 + L.r) continue;
    let i = L.i;
    if (L.dieAt) { if (T > L.dieAt) continue; i *= Math.random() < 0.5 ? 0.1 : 1; }
    if (L.flick) { const f = Math.sin(T * 23 + L.seed * 50) + Math.sin(T * 7.3 + L.seed * 9); i *= f > 1.2 ? 0.2 : 1; }
    const a = (L.shop ? 0.32 : L.canopy ? 0.12 : L.flood ? 0.1 : 0.17) * i;
    gctx.globalAlpha = a;
    gctx.drawImage(glowSprite(lightHex(L.col)), L.x - L.r * 0.85, L.y - L.r * 0.85, L.r * 1.7, L.r * 1.7);
  }
  // pista molhada: cada luz da rua reflete num risco comprido no asfalto
  if (Weather.wet > 0.05) {
    for (const L of _lq) {
      if (L.refl || L.canopy || (L.dieAt && T > L.dieAt) || L.x < view.x0 - 40 || L.x > view.x1 + 40 || L.y < view.y0 - 120 || L.y > view.y1) continue;
      gctx.globalAlpha = 0.22 * Weather.wet * L.i;
      gctx.drawImage(glowSprite(lightHex(L.col)), L.x - 9 + Math.sin(T * 1.7 + L.seed * 9) * 1.5, L.y + 4, 18, 90);
    }
  }
  // reflexos das luzes na água
  for (const L of _lq) {
    if (!L.refl || (L.dieAt && T > L.dieAt) || L.y + L.refl < view.y0 - 100 || L.y > view.y1) continue;
    const spr = glowSprite(lightHex(L.col));
    for (let k = 0; k < 3; k++) {
      const yy = L.y + L.refl + k * 26, sh = Math.sin(T * 2.2 + k * 1.7 + L.seed * 20);
      gctx.globalAlpha = (0.32 - k * 0.08) * L.i;
      gctx.drawImage(spr, L.x - 16 + sh * 4, yy - 28, 32, 56);
    }
  }
  const cone = (c, len, a) => {
    const I = carLightsInfo(c);
    gctx.globalAlpha = a;
    gctx.save(); gctx.translate(I.fx, I.fy); gctx.rotate(c.a);
    gctx.drawImage(CONE, -4, -len / 4, len, len / 2);
    gctx.restore();
  };
  for (const c of Traffic.cars) if (inView(view, c.x, c.y, 300)) cone(c, c.big ? 300 : 250, 0.07);
  // giroflex pintando a rua de azul e vermelho
  for (const u of Police.units) { if (!inView(view, u.x, u.y, 260)) continue; const ph = Math.floor(T * 7 + u.id * 10) % 2; gctx.globalAlpha = 0.28; gctx.drawImage(glowSprite(ph ? '#ff2a2a' : '#2a6aff'), u.x - 200, u.y - 200, 400, 400); }
  if (player && Game.state !== 'menu') {
    const I = carLightsInfo(player), base = player.highBeam ? 520 : 360;
    for (const s of [-1, 1]) {
      const k = playerLamp(s); if (k <= 0.01) continue;
      const len = base * (0.45 + 0.55 * k);
      gctx.globalAlpha = 0.08 * k; gctx.save(); gctx.translate(I.fx + I.nx * s, I.fy + I.ny * s); gctx.rotate(player.a + s * 0.03);
      gctx.drawImage(CONE, -2, -len * 0.21, len, len * 0.42); gctx.restore();
    }
  }
  for (const o of _talls) {
    if (o.kind !== 'tlight') continue;
    const st = lightState(o.node, o.axis, T);
    gctx.globalAlpha = 0.18; gctx.drawImage(glowSprite(st === 'R' ? '#ff3b30' : st === 'Y' ? '#ffb000' : '#2bff7a'), o.hx - 40, o.hy - 40, 80, 80);
  }
  gctx.globalAlpha = 1;
  gctx.globalCompositeOperation = 'source-over';
}
function emissivePass(view, talls) {
  ctx.globalCompositeOperation = 'lighter';
  const T = Game.time;
  EM_BATCH.on = true; EM_BATCH.norm = new Path2D(); EM_BATCH.big = new Path2D(); EM_BATCH.n = 0;
  for (const o of talls) drawTallEmissive(ctx, o);
  EM_BATCH.on = false;
  if (EM_BATCH.n) { ctx.fillStyle = 'rgba(255,186,105,0.55)'; ctx.fill(EM_BATCH.norm); ctx.fillStyle = 'rgba(255,214,150,0.5)'; ctx.fill(EM_BATCH.big); }
  // veículos
  const tail = glowSprite('#ff2a1e'), head = glowSprite('#fff1cf'), amber = glowSprite('#ffa520'), white = glowSprite('#ffffff');
  const carGlow = (c, brake, rev, blink, isPlayer) => {
    const I = carLightsInfo(c);
    const Z = isPlayer ? Profile.zones : c.zones;
    const brokeF = (s) => Z && (Z.f > 0.85 || (Z.f > 0.6 && s < 0)), brokeR = (s) => Z && (Z.r > 0.85 || (Z.r > 0.6 && s < 0));
    if (isPlayer) for (const s of [1, -1]) { const k = playerLamp(s); if (k <= 0.01) continue; ctx.globalAlpha = 0.95 * (0.25 + 0.75 * k); ctx.drawImage(head, I.fx + I.nx * s - 9, I.fy + I.ny * s - 9, 18, 18); }
    else { ctx.globalAlpha = 0.95; for (const s of [1, -1]) if (!brokeF(s)) ctx.drawImage(head, I.fx + I.nx * s - 9, I.fy + I.ny * s - 9, 18, 18); }
    const tr = brake ? 15 : 9;
    ctx.globalAlpha = brake ? 1 : 0.7;
    for (const s of [1, -1]) if (!brokeR(s)) ctx.drawImage(tail, I.rx + I.nx * s - tr, I.ry + I.ny * s - tr, tr * 2, tr * 2);
    if (brake) { ctx.globalAlpha = 0.25; ctx.drawImage(tail, I.rx - 30, I.ry - 30, 60, 60); }
    if (rev) { ctx.globalAlpha = 0.8; for (const s of [1, -1]) ctx.drawImage(white, I.rx + I.nx * s * 0.5 - 7, I.ry + I.ny * s * 0.5 - 7, 14, 14); }
    if (blink && (T * 2.6) % 1 < 0.5) {
      ctx.globalAlpha = 0.9;
      const s = blink;
      ctx.drawImage(amber, I.fx + I.nx * s * 1.2 - 8, I.fy + I.ny * s * 1.2 - 8, 16, 16);
      ctx.drawImage(amber, I.rx + I.nx * s * 1.2 - 8, I.ry + I.ny * s * 1.2 - 8, 16, 16);
    }
    if (c.model === 'police') {
      const ph = Math.floor(T * 7) % 2;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(glowSprite(ph ? '#ff2a2a' : '#2a6aff'), c.x - 14, c.y - 14, 28, 28);
      ctx.globalAlpha = 0.25; ctx.drawImage(glowSprite(ph ? '#ff2a2a' : '#2a6aff'), c.x - 60, c.y - 60, 120, 120);
    }
    if (c.model === 'taxi') { ctx.globalAlpha = 0.8; ctx.drawImage(amber, c.x - 7, c.y - 7, 14, 14); }
    if (c.model === 'bus') { ctx.globalAlpha = 0.6; ctx.drawImage(amber, I.fx - I.ca * 4 - 10, I.fy - I.sa * 4 - 10, 20, 20); }
  };
  for (const c of Traffic.cars) {
    if (c.x < view.x0 - 300 || c.x > view.x1 + 300 || c.y < view.y0 - 300 || c.y > view.y1 + 300) continue;
    const nearNode = c.state === 'turn' || (c.sEnd - c.s) < 150;
    carGlow(c, c.braking || c.hitT > 0 || c.v < 3, false, c.lcBlink || (nearNode ? c.blink : 0), false);
  }
  if (player && Game.state !== 'menu') {
    const nk = carKit(player.car.id).neon;
    if (nk) { const f = 0.8 + 0.12 * Math.sin(T * 9); ctx.globalAlpha = 0.95 * f; const gs = glowSprite(nk), R = player.m.L * 1.55; ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.a); ctx.drawImage(gs, -R, -R * 0.62, R * 2, R * 1.24); ctx.restore(); ctx.globalAlpha = 1; }
    carGlow(player, player.braking || Keys.Space, player.rev, 0, true);
  }
  for (const u of Police.units) { const ph = Math.floor(T * 7 + u.id * 10) % 2; ctx.globalAlpha = 0.95; ctx.drawImage(glowSprite(ph ? '#ff2a2a' : '#2a6aff'), u.x - 14, u.y - 14, 28, 28); ctx.globalAlpha = 0.3; ctx.drawImage(glowSprite(ph ? '#ff2a2a' : '#2a6aff'), u.x - 70, u.y - 70, 140, 140); ctx.globalAlpha = 1; }
  Events.drawGlow(ctx, view);
  if (Socorro.job && (Game.time * 2.2) % 1 < 0.5) { const J = Socorro.job; ctx.globalAlpha = 0.9; const s = glowSprite('#ffa520'); ctx.drawImage(s, J.x - 22, J.y - 22, 44, 44); ctx.globalAlpha = 1; }
  // animais (olhos de coruja)
  for (const an of Animals.list) {
    if (an.type !== 'owl' || an.blinkT < 0) continue;
    if (an.x < view.x0 || an.x > view.x1 || an.y < view.y0 || an.y > view.y1) continue;
    ctx.globalAlpha = 0.9; ctx.drawImage(glowSprite('#ffd84a'), an.x - 6, an.y - 6, 12, 12);
  }
  // vaga-lumes
  for (const f of Fireflies.list) {
    const a = Math.max(0, Math.sin(f.ph * 2.2)) ** 3;
    if (a < 0.05) continue;
    ctx.globalAlpha = a * 0.9; ctx.drawImage(glowSprite('#d8ff6a'), f.x - 5, f.y - 5, 10, 10);
  }
  ctx.globalAlpha = 1;
  Particles.drawEmissive(ctx);
  for (const f of World.fountains) {
    if (!inView(view, f.x, f.y, 60)) continue;
    for (let i = 0; i < 3; i++) { const ph = ((T * 0.6 + i / 3) % 1); ctx.globalAlpha = (1 - ph) * 0.35; ctx.strokeStyle = '#bff0ff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + ph * 26, 0, TAU); ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
  drawMarkersEmissive(view);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/* ---------- marcadores de atividade ---------- */
function ring(x, y, r, hex, a, w) {
  ctx.globalAlpha = a; ctx.strokeStyle = hex; ctx.lineWidth = w || 3;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
}
function inView(view, x, y, m) { return x > view.x0 - m && x < view.x1 + m && y > view.y0 - m && y < view.y1 + m; }
function drawMarkersEmissive(view) {
  if (!player || Game.state === 'menu') return;
  const T = Game.time, pulse = 0.5 + 0.5 * Math.sin(T * 4);
  // GPS
  if (Act.gps && Act.gps.pts.length > 1) {
    const pts = Act.gps.pts;
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#5be38f';
    let acc = (T * 60) % 40, drawn = 0;
    for (let i = 1; i < pts.length && drawn < 30; i++) {
      const ax = pts[i - 1][0], ay = pts[i - 1][1], bx = pts[i][0], by = pts[i][1];
      const L = Math.hypot(bx - ax, by - ay); if (L < 1) continue;
      const ux = (bx - ax) / L, uy = (by - ay) / L, ang = Math.atan2(uy, ux);
      for (let s = acc; s < L; s += 40) {
        const x = ax + ux * s, y = ay + uy * s;
        const d = Math.hypot(x - player.x, y - player.y);
        if (d > 650) { drawn = 99; break; }
        if (d < 40) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-1, 0); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
        ctx.restore(); drawn++;
      }
      acc = (acc - L) % 40; if (acc < 0) acc += 40;
    }
  }
  // comércios
  for (const s of World.shops) {
    if (!inView(view, s.x, s.y, 80)) continue;
    let col = '#ff8a3d', r = 26;
    if (s.kind === 'garagem') col = '#5be38f';
    else if (s.kind === 'posto') col = '#ffb000';
    else if (s.kind === 'oficina') col = '#59e0ff';
    else if (s.pickup && !Act.delivery) { col = '#ffd24a'; r = 32; }
    ring(s.x, s.y, r + pulse * 4, col, 0.55, 3);
    ctx.globalAlpha = 0.35; ctx.drawImage(glowSprite(col), s.x - r * 1.6, s.y - r * 1.6, r * 3.2, r * 3.2);
    if (s.pickup && !Act.delivery) {
      ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffd24a';
      const bob = Math.sin(T * 3) * 3 - r - 16;
      ctx.fillRect(s.x - 7, s.y - 7 + bob, 14, 12); ctx.fillStyle = '#7a5a1a'; ctx.fillRect(s.x - 7, s.y - 2 + bob, 14, 1.5); ctx.fillRect(s.x - 0.75, s.y - 7 + bob, 1.5, 12);
    }
  }
  // destino da entrega / frete / corrida
  const tg = currentTarget();
  if (tg && (tg.kind === 'delivery' || tg.kind === 'ride')) {
    const d = tg;
    if (inView(view, d.x, d.y, 120)) {
      ctx.globalAlpha = 0.5; ctx.drawImage(glowSprite('#ffd24a'), d.x - 70, d.y - 70, 140, 140);
      ring(d.x, d.y, 44 + pulse * 8, '#ffd24a', 0.8, 4);
      ring(d.x, d.y, 26, '#fff3b0', 0.6, 2);
    }
  }
  // percursos
  if (!Act.race) {
    for (const r of World.races) {
      if (!inView(view, r.start[0], r.start[1], 80)) continue;
      ring(r.start[0], r.start[1], 40 + pulse * 5, '#59e0ff', 0.7, 4);
      ctx.globalAlpha = 0.8;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = (i + j) % 2 ? '#ffffff' : '#59e0ff'; ctx.fillRect(r.start[0] - 12 + i * 6, r.start[1] - 9 + j * 6, 6, 6); }
    }
  } else {
    const R = Act.race;
    for (let i = R.idx; i < Math.min(R.r.pts.length, R.idx + 2); i++) {
      const p = R.r.pts[i], last = i === R.r.pts.length - 1;
      if (!inView(view, p[0], p[1], 120)) continue;
      const main = i === R.idx;
      ctx.globalAlpha = main ? 0.55 : 0.2; ctx.drawImage(glowSprite(last ? '#ffffff' : '#59e0ff'), p[0] - 90, p[1] - 90, 180, 180);
      ring(p[0], p[1], 80, last ? '#ffffff' : '#59e0ff', main ? 0.85 : 0.3, main ? 5 : 3);
    }
  }
  // vaga
  if (Act.parkSpot) {
    const s = Act.parkSpot;
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a);
    const prog = Act.parkHold > 0 ? Act.parkHold / 1.2 : 0;
    const ok = Act.parkHold > 0 || Act.parkLock === s.id;
    ctx.globalAlpha = 0.7 + pulse * 0.2; ctx.strokeStyle = ok ? '#5be38f' : '#5b8cff'; ctx.lineWidth = 2.5;
    ctx.strokeRect(-s.l / 2, -s.w / 2, s.l, s.w);
    ctx.globalAlpha = 0.25; ctx.fillStyle = ok ? '#5be38f' : '#5b8cff'; ctx.fillRect(-s.l / 2, -s.w / 2, s.l * Math.max(prog, 0.08), s.w);
    ctx.restore();
    ctx.globalAlpha = 0.85; ctx.fillStyle = '#cfe0ff'; ctx.font = '800 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('P', s.x, s.y);
  }
  ctx.globalAlpha = 1;
}

/* ---------- quadro principal ---------- */
const _talls = [];
let forceGround = true;
function render() {
  frameNo++;
  const _P = window.__PROF; let _pt = _P ? performance.now() : 0; const pm = (k) => { if (_P) { const t = performance.now(); _P[k] = (_P[k] || 0) + t - _pt; _pt = t; } };
  const W = canvas.width, Hh = canvas.height;
  const z = Cam.zoom * RS;
  const sx = (Math.random() - 0.5) * Cam.shake, sy = (Math.random() - 0.5) * Cam.shake;
  const cx = Cam.x + sx, cy = Cam.y + sy;
  const vw = W / z, vh = Hh / (z * SQ);
  const view = Cam.view; view.x0 = cx - vw / 2; view.y0 = cy - vh / 2; view.x1 = cx + vw / 2; view.y1 = cy + vh / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#0a1008'; ctx.fillRect(0, 0, W, Hh);
  pm('clear');
  ctx.setTransform(z, 0, 0, z * SQ, W / 2 - cx * z, Hh / 2 - cy * z * SQ);
  WS_BASE.ctx = ctx; WS_BASE.z = z; WS_BASE.zs = z * SQ; WS_BASE.tx = W / 2 - cx * z; WS_BASE.ty = Hh / 2 - cy * z * SQ; wsTrim();
  ctx.imageSmoothingEnabled = true;
  drawGround(view, forceGround); forceGround = false;
  pm('ground');
  Weather.drawPuddles(ctx, view);
  Skids.draw(ctx, view);
  Weather.drawRipples(ctx, view);
  Debris.draw(ctx, view);
  drawDynShadows(ctx, view);
  pm('decals');
  // veículos e animais
  for (const an of Animals.list) if (an.type !== 'owl' && inView(view, an.x, an.y, 30)) drawAnimal(ctx, an);
  if (Settings.quality !== 'baixa') Peladas.draw(ctx, view);
  pm('animals');
  for (const c of Traffic.cars) {
    if (!inView(view, c.x, c.y, 80)) continue;
    drawVehicle(ctx, c.m, c.color, c.x, c.y, c.a, { steer: c.steerVis, roll: c.roll, brake: c.braking || c.v < 3, box: c.box, zones: c.zones });
  }
  Events.draw(ctx, view);
  for (const u of Police.units) if (inView(view, u.x, u.y, 80)) drawVehicle(ctx, VMODELS.police, '#f2f2ee', u.x, u.y, u.a, { roll: 0, brake: u.v < 30 });
  if (Socorro.job && inView(view, Socorro.job.x, Socorro.job.y, 120)) { const J = Socorro.job; ctx.globalAlpha = clamp(1 - (J.fade || 0), 0, 1); drawVehicle(ctx, VMODELS.guincho, '#c8302a', J.x, J.y, J.a, { roll: 0, brake: J.state === 'arrived' || (J.v || 0) < 20 }); ctx.globalAlpha = 1; }
  if (player && Game.state !== 'menu') {
    drawVehicle(ctx, player.m, player.color, player.x, player.y, player.a, { steer: player.steer * 1.4, roll: player.roll, lean: player.lean, brake: player.braking || Keys.Space, rev: player.rev, dirt: Profile.dirt, damage: Profile.damage, cargo: !!Act.delivery || !!(Act.ride && Act.ride.type === 'mudanca' && Act.ride.stage === 'drive'), zones: Profile.zones, tow: player.car.job === 'guincho' && Act.delivery && Act.delivery.stage === 'deliver', towColor: Act.delivery && Act.delivery.color, boxText: player.car.job === 'bau' ? 'LEVA-E-TRAZ' : null, kit: carKit(player.car.id) });
  }
  if (player && Game.state !== 'menu') {
    const D = Act.delivery;
    if (D && D.type === 'guincho' && D.stage === 'pickup' && inView(view, D.pick.x, D.pick.y, 60)) drawVehicle(ctx, VMODELS.quadrado, D.color, D.pick.x, D.pick.y, 0.4, { parked: true, zones: { f: 0.9, r: 0, l: 0.3, rt: 0 } });
    if (Act.ride && Act.ride.stage === 'pickup' && inView(view, Act.ride.pick.x, Act.ride.pick.y, 40)) drawAnimal(ctx, { type: 'person', x: Act.ride.pick.x, y: Act.ride.pick.y - 14, a: Math.PI / 2, v: 0, phase: 0, seed: Act.ride.seed, col: '#ffd24a', skin: '#c68642', hair: '#1a1410', pants: '#2b3a55', dance: true, state: 'idle' });
    if (Act.race && Act.race.racha && Act.race.count <= 0) {
      const g = rachaGhostPos(Act.race);
      ctx.globalAlpha = 0.85; drawVehicle(ctx, VMODELS.muscle, '#e63946', g[0] - Math.sin(g[2]) * 30, g[1] + Math.cos(g[2]) * 30, g[2], { roll: Game.time * 40 }); ctx.globalAlpha = 1;
      ctx.font = 'italic 800 11px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff9a9a'; ctx.fillText(Act.race.r.rival, g[0], g[1] - 6);
    }
  }
  Particles.draw(ctx);
  pm('vehicles');
  // objetos altos ordenados por distância à câmera (longe primeiro)
  rendGrid.query(view.x0 - 170, view.y0 - 170, view.x1 + 170, view.y1 + 170, _rq);
  _talls.length = 0;
  for (const o of _rq) { const ox = o.cx !== undefined ? o.cx : o.x, oy = o.cy !== undefined ? o.cy : o.y; o._d = (ox - cx) * (ox - cx) + (oy - cy) * (oy - cy); _talls.push(o); }
  _talls.sort((a, b) => b._d - a._d);
  pm('tallsQuery');
  for (const o of _talls) drawTall(ctx, o);
  pm('talls');
  Events.drawTop(ctx, view);
  for (const an of Animals.list) if (an.type === 'owl' && inView(view, an.x, an.y, 30)) drawAnimal(ctx, an);
  // escuridão + luzes
  if (Weather.wet > 0.02) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(18,30,52,${(0.2 * Weather.wet).toFixed(3)})`; ctx.fillRect(0, 0, W, Hh); ctx.setTransform(z, 0, 0, z * SQ, W / 2 - cx * z, Hh / 2 - cy * z * SQ); }
  lightPass(view, cx, cy);
  pm('lightPass');
  const lowQ = Settings.quality === 'baixa';
  if (!lowQ) glowPass(view, cx, cy); // na baixa: sem a camada de brilho colorido
  pm('glowPass');
  if (Settings.quality === 'alta') {
    // bloom: espalha o brilho na própria camada de baixa resolução (barato) antes de ir para a tela
    const gw = glowCanvas.width, gh = glowCanvas.height;
    if (!window._bloomC) { window._bloomC = document.createElement('canvas'); window._bloomX = window._bloomC.getContext('2d'); }
    const bc = window._bloomC, bx = window._bloomX, bw = Math.ceil(gw / 4), bh = Math.ceil(gh / 4);
    if (bc.width !== bw || bc.height !== bh) { bc.width = bw; bc.height = bh; }
    bx.clearRect(0, 0, bw, bh); bx.drawImage(glowCanvas, 0, 0, bw, bh); // reduzir = desfocar
    gctx.setTransform(1, 0, 0, 1, 0, 0); gctx.globalCompositeOperation = 'lighter'; gctx.globalAlpha = 0.45;
    gctx.drawImage(bc, -gw * 0.02, -gh * 0.02, gw * 1.04, gh * 1.04);
    gctx.globalAlpha = 1; gctx.globalCompositeOperation = 'source-over';
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingQuality = 'low';
  ctx.drawImage(lightCanvas, 0, 0, W, Hh);
  pm('compLight');
  if (!lowQ) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glowCanvas, 0, 0, W, Hh);
  pm('compGlow');

    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.setTransform(z, 0, 0, z * SQ, W / 2 - cx * z, Hh / 2 - cy * z * SQ);
  emissivePass(view, _talls);
  pm('emissive');
  Weather.drawDrops(ctx);
  pm('drops');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (Cam.flash > 0.01) { ctx.fillStyle = `rgba(255,255,255,${(Cam.flash * 0.6).toFixed(3)})`; ctx.fillRect(0, 0, W, Hh); }
}

/* ---------- mapa (minimapa e mapa grande) ---------- */
let MAPIMG = null;
const MAP_S = 0.1;
function buildMapImage() {
  const c = makeCanvas(GW, GH), g = c.getContext('2d');
  const img = g.createImageData(GW, GH), d = img.data;
  // estilo noturno: chão escuro, água azul forte, ruas claras por cima
  const COLS = [[26, 36, 30], [42, 48, 59], [52, 58, 70], [74, 58, 42], [20, 70, 110], [58, 63, 74], [44, 50, 64], [34, 48, 28], [62, 50, 36], [122, 106, 72]];
  for (let i = 0; i < GW * GH; i++) { const col = COLS[ground[i]] || COLS[0]; d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  g.fillStyle = 'rgba(16,40,24,0.92)';
  colGrid.query(0, 0, WORLD_W, WORLD_H, _q);
  for (const o of _q) if (o.tag === 'forest') g.fillRect(o.x0 * MAP_S - 1.4, o.y0 * MAP_S - 1.4, (o.x1 - o.x0) * MAP_S + 2.8, (o.y1 - o.y0) * MAP_S + 2.8);
  for (const b of World.buildings) { g.fillStyle = b.h > 60 ? '#4f5a70' : '#3b4456'; g.fillRect(b.x0 * MAP_S, b.y0 * MAP_S, (b.x1 - b.x0) * MAP_S, (b.y1 - b.y0) * MAP_S); }
  g.lineCap = 'round';
  for (const pass of [0, 1]) for (const e of World.edges) {
    const w = e.T.id === 'avenue' || e.T.id === 'highway' ? 3.4 : e.T.id === 'dirt' ? 1.6 : 2.3;
    g.lineWidth = pass ? w : w + 1.4;
    g.strokeStyle = pass ? (e.T.id === 'dirt' ? '#a8804e' : e.T.id === 'highway' ? '#ffb52e' : e.T.id === 'avenue' ? '#ffe7a0' : '#d6dbe4') : 'rgba(5,7,11,0.8)';
    g.beginPath(); g.moveTo(e.a.x * MAP_S, e.a.y * MAP_S); g.lineTo(e.b.x * MAP_S, e.b.y * MAP_S); g.stroke();
  }
  MAPIMG = c;
}
function mapIcon(g, x, y, kind, s) {
  s = s || 1;
  const col = { job: '#ffcc2e', shop: '#ff8a3d', race: '#59e0ff', park: '#5b8cff', poi: '#c56bff', gps: '#22d17a', home: '#22d17a', fuel: '#ff9a1f', repair: '#59e0ff', unknown: 'rgba(197,107,255,0.55)', event: '#ff5ad1' }[kind] || '#fff';
  // marcador redondo com aro escuro e um símbolo desenhado dentro
  g.fillStyle = 'rgba(5,7,11,0.85)'; g.beginPath(); g.arc(x, y, 5.8 * s, 0, TAU); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(x, y, 4.5 * s, 0, TAU); g.fill();
  const u = 0.62 * s; g.save(); g.translate(x, y); g.scale(u, u);
  g.fillStyle = '#0b0d12'; g.strokeStyle = '#0b0d12'; g.lineWidth = 1.3; g.lineCap = 'round'; g.lineJoin = 'round';
  switch (kind) {
    case 'home': g.beginPath(); g.moveTo(-4, 0); g.lineTo(0, -4); g.lineTo(4, 0); g.lineTo(2.8, 0); g.lineTo(2.8, 3.6); g.lineTo(-2.8, 3.6); g.lineTo(-2.8, 0); g.closePath(); g.fill(); break;
    case 'fuel': g.fillRect(-3.4, -3.6, 4.2, 7.4); g.fillStyle = col; g.fillRect(-2.6, -2.8, 2.6, 2); g.strokeStyle = '#0b0d12'; g.beginPath(); g.moveTo(0.8, -1); g.lineTo(2.6, -1); g.lineTo(2.6, 2.4); g.lineTo(3.6, 2.4); g.lineTo(3.6, -2.4); g.stroke(); break;
    case 'repair': g.lineWidth = 1.8; g.beginPath(); g.moveTo(-3, 3); g.lineTo(1.2, -1.2); g.stroke(); g.beginPath(); g.arc(2, -2, 2, 0.6, 5.2); g.stroke(); break;
    case 'job': g.fillRect(-3.5, -2.6, 7, 6); g.fillStyle = col; g.fillRect(-0.6, -2.6, 1.2, 2.6); break;
    case 'shop': g.fillRect(-3.2, -1.4, 6.4, 5); g.lineWidth = 1.2; g.beginPath(); g.arc(0, -1.4, 1.9, Math.PI, 0); g.stroke(); break;
    case 'race': g.fillRect(-3, -4, 1, 8); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) if ((i + j) % 2 === 0) g.fillRect(-2 + i * 1.8, -4 + j * 1.8, 1.8, 1.8); g.strokeRect(-2, -4, 5.4, 3.6); break;
    case 'park': g.font = '900 8px "BRND Cond", Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', 0, 0.6); break;
    case 'poi': g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.8 : 4.2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); break;
    case 'event': g.fillRect(-0.9, -3.8, 1.8, 5); g.beginPath(); g.arc(0, 3.1, 1, 0, TAU); g.fill(); break;
    case 'unknown': g.font = '900 8px "BRND Cond", Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 0.6); break;
    case 'gps': g.beginPath(); g.arc(0, 0, 1.8, 0, TAU); g.fill(); break;
  }
  g.restore();
}
function shopIconKind(s) { return s.kind === 'garagem' ? 'home' : s.kind === 'posto' ? 'fuel' : s.kind === 'oficina' ? 'repair' : s.pickup && !Act.delivery ? 'job' : 'shop'; }
const mmCanvas = document.getElementById('minimap'), mm = mmCanvas.getContext('2d');
function drawMinimap() {
  if (!MAPIMG || !player) return;
  const S = mmCanvas.width, k = S / 220;
  const R = Math.round(1250 / 1.2); // 20% mais perto da cidade
  const scale = (S / 2) / R;
  mm.setTransform(1, 0, 0, 1, 0, 0);
  mm.fillStyle = '#0b1210'; mm.fillRect(0, 0, S, S);
  mm.save();
  mm.beginPath(); mm.arc(S / 2, S / 2, S / 2, 0, TAU); mm.clip();
  mm.translate(S / 2, S / 2);
  const rot = Settings.minimapRotate ? -player.a - Math.PI / 2 : 0;
  mm.rotate(rot);
  mm.scale(scale, scale);
  mm.translate(-player.x, -player.y);
  mm.imageSmoothingEnabled = true;
  mm.drawImage(MAPIMG, 0, 0, WORLD_W, WORLD_H);
  if (Act.gps) {
    mm.strokeStyle = '#ffcc2e'; mm.lineWidth = 5 / scale * k * 0.5; mm.lineJoin = 'round';
    mm.beginPath(); Act.gps.pts.forEach((p, i) => (i ? mm.lineTo(p[0], p[1]) : mm.moveTo(p[0], p[1]))); mm.stroke();
  }
  const ic = (x, y, kind) => { mm.save(); mm.translate(x, y); mm.rotate(-rot); mm.scale(1 / scale * k * 1.05, 1 / scale * k * 1.05); mapIcon(mm, 0, 0, kind, 1.1); mm.restore(); };
  for (const s of World.shops) ic(s.x, s.y, shopIconKind(s));
  if (Socorro.job) ic(Socorro.job.x, Socorro.job.y, 'repair');
  { const ep = Events.mapPoint(); if (ep) ic(ep[0], ep[1], 'event'); }
  for (const u of Police.units) { mm.save(); mm.translate(u.x, u.y); mm.rotate(-rot); const s = 1 / scale * k; mm.fillStyle = Math.floor(Game.time * 6) % 2 ? '#ff3b30' : '#2a6aff'; mm.beginPath(); mm.arc(0, 0, 6 * s, 0, TAU); mm.fill(); mm.strokeStyle = '#fff'; mm.lineWidth = 1.5 * s; mm.stroke(); mm.restore(); }
  if (!Act.race) for (const r of World.races) ic(r.start[0], r.start[1], 'race');
  for (const s of World.parkSpots) if (!Profile.parks[s.id]) ic(s.x, s.y, 'park');
  for (const p of World.pois) if (Profile.discovered.includes(p.id)) ic(p.x, p.y, 'poi');
  const t = currentTarget();
  if (t) ic(t.x, t.y, 'gps');
  mm.restore();
  // seta do jogador
  mm.save(); mm.translate(S / 2, S / 2); mm.rotate(player.a + rot);
  mm.fillStyle = '#ffffff'; mm.strokeStyle = '#000'; mm.lineWidth = 2 * k;
  mm.beginPath(); mm.moveTo(9 * k, 0); mm.lineTo(-6 * k, -6 * k); mm.lineTo(-3 * k, 0); mm.lineTo(-6 * k, 6 * k); mm.closePath(); mm.stroke(); mm.fill();
  mm.restore();
  if (!Settings.minimapRotate) {
    mm.fillStyle = '#ffcc2e'; mm.font = `800 ${13 * k}px "BRND Cond", Arial`; mm.textAlign = 'center'; mm.fillText('N', S / 2, 17 * k);
  }
}
/* ---------- mapa estilo app de celular: arrastar, zoom e destinos ---------- */
const MAP_LABELS = [['BARRA DO JURURUZINHO', 5450, 7300], ['JARDIM CAMBURISO', 6900, 7800], ['PORTO DO TUBARÃO BANGUELA', 8150, 6900], ['ORLA DE CAMBURISO', 6700, 8905], ['CENTRÃO', 1600, 1150], ['DISTRITO DA GAMBIARRA', 3650, 700], ['VILA SEM PRESSA', 1150, 4100], ['ALFAVILA', 3400, 4700], ['RIO JURURU', 5450, 5000], ['SÍTIO BOTA FÉ', 7500, 2600], ['FAZENDA MUUUITO LONGE', 7700, 5000], ['RODOVIA BR-101 E POUCO', 4200, 6370], ['FEIO ROSA', 1150, 7350], ['JARDIM CARA-PINTADA', 3300, 7350], ['NOVA PROSA DA PENA', 1300, 8400], ['FLEXÃO', 3600, 8400]];
class MapView {
  constructor(canvas, st) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.st = st; // st: {cx, cy, z} compartilhado
    const P = new Map(); let down = null, moved = false, pinch0 = null;
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]);
      if (P.size === 1) { down = [e.clientX, e.clientY, this.st.cx, this.st.cy]; moved = false; }
      if (P.size === 2) { const [a, b] = [...P.values()]; pinch0 = [Math.hypot(a[0] - b[0], a[1] - b[1]), this.st.z]; moved = true; }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!P.has(e.pointerId)) return; P.set(e.pointerId, [e.clientX, e.clientY]);
      if (P.size === 2 && pinch0) { const [a, b] = [...P.values()]; this.setZoom(pinch0[1] * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0[0]); this.draw(); return; }
      if (!down) return;
      const dx = e.clientX - down[0], dy = e.clientY - down[1];
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      if (moved) { this.st.cx = clamp(down[2] - dx / this.st.z, 0, WORLD_W); this.st.cy = clamp(down[3] - dy / this.st.z, 0, WORLD_H); this.st.follow = false; this.draw(); }
    });
    const up = (e) => {
      P.delete(e.pointerId); if (P.size < 2) pinch0 = null;
      if (down && !moved && P.size === 0 && e.type === 'pointerup' && e.button === 0) { const w = this.toWorld(e.clientX, e.clientY); mapSetWaypoint(w[0], w[1], 'ponto marcado no mapa'); }
      if (P.size === 0) down = null;
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const w0 = this.toWorld(e.clientX, e.clientY);
      this.setZoom(this.st.z * Math.exp(-e.deltaY * 0.0015));
      const w1 = this.toWorld(e.clientX, e.clientY);
      this.st.cx = clamp(this.st.cx + w0[0] - w1[0], 0, WORLD_W); this.st.cy = clamp(this.st.cy + w0[1] - w1[1], 0, WORLD_H); this.st.follow = false;
      this.draw();
    }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); if (Act.waypoint) { Act.waypoint = null; Act.gps = null; AudioSys.back(); renderMapDests(); drawBigMap(); } });
  }
  minZ() { const r = this.c.getBoundingClientRect(); return Math.min(r.width / WORLD_W, r.height / WORLD_H) * 0.9; }
  setZoom(z) { this.st.z = clamp(z, this.minZ(), 0.24); }
  toWorld(clx, cly) { const r = this.c.getBoundingClientRect(); return [this.st.cx + (clx - r.left - r.width / 2) / this.st.z, this.st.cy + (cly - r.top - r.height / 2) / this.st.z]; }
  zoomBy(f) { this.setZoom(this.st.z * f); this.draw(); }
  center() { if (player) { this.st.cx = player.x; this.st.cy = player.y; this.st.follow = true; } this.draw(); }
  draw() {
    if (!MAPIMG || !this.c.isConnected) return;
    const c = this.c, g = this.g, r = c.getBoundingClientRect();
    if (r.width < 4) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const Wp = Math.round(r.width * dpr), Hp = Math.round(r.height * dpr);
    if (c.width !== Wp || c.height !== Hp) { c.width = Wp; c.height = Hp; }
    if (!this.st.z) { this.st.z = this.minZ(); this.st.cx = WORLD_W / 2; this.st.cy = WORLD_H / 2; }
    if (this.st.z < this.minZ()) this.st.z = this.minZ();
    if (this.st.follow && player) { this.st.cx = player.x; this.st.cy = player.y; }
    const z = this.st.z, s = z * dpr, k = 1 / z; // k: unidades do mundo por px de tela
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#0b1a2a'; g.fillRect(0, 0, Wp, Hp);
    g.setTransform(s, 0, 0, s, Wp / 2 - this.st.cx * s, Hp / 2 - this.st.cy * s);
    g.imageSmoothingEnabled = true;
    g.drawImage(MAPIMG, 0, 0, WORLD_W, WORLD_H);
    // vista visível em coordenadas do mundo
    const x0 = this.st.cx - r.width / 2 * k - 200, x1 = this.st.cx + r.width / 2 * k + 200, y0 = this.st.cy - r.height / 2 * k - 200, y1 = this.st.cy + r.height / 2 * k + 200;
    const vis = (e) => Math.max(e.a.x, e.b.x) > x0 && Math.min(e.a.x, e.b.x) < x1 && Math.max(e.a.y, e.b.y) > y0 && Math.min(e.a.y, e.b.y) < y1;
    const RW = { highway: 1, avenue: 0.9, street: 0.75, road: 0.75, dirt: 0.55 };
    const RC = { highway: '#ffb52e', avenue: '#ffe7a0', street: '#d6dbe4', road: '#d6dbe4', dirt: '#a8804e' };
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pass of [0, 1]) for (const e of World.edges) {
      if (!vis(e)) continue;
      const id = e.T.id, w = Math.max((RW[id] || 0.7) * 3.2 * k, e.T.w * 0.62);
      g.lineWidth = pass ? w : w + 2.4 * k;
      g.strokeStyle = pass ? (RC[id] || '#d6dbe4') : 'rgba(5,7,11,0.85)';
      g.beginPath(); g.moveTo(e.a.x, e.a.y); g.lineTo(e.b.x, e.b.y); g.stroke();
    }
    // nomes de rua de perto
    if (z > 0.11) {
      g.font = `700 ${11 * k}px "BRND Cond", Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const seen = new Set();
      for (const e of World.edges) {
        if (!e.name || !vis(e) || e.len < 260 || seen.has(e.name + (e.h ? 'h' : 'v') + Math.round((e.h ? e.a.y : e.a.x) / 50))) continue;
        const mx = (e.a.x + e.b.x) / 2, my = (e.a.y + e.b.y) / 2;
        if (mx < x0 + 200 || mx > x1 - 200 || my < y0 + 200 || my > y1 - 200) continue;
        seen.add(e.name + (e.h ? 'h' : 'v') + Math.round((e.h ? e.a.y : e.a.x) / 50));
        g.save(); g.translate(mx, my); if (!e.h) g.rotate(Math.PI / 2);
        g.lineWidth = 3 * k; g.strokeStyle = 'rgba(5,7,11,0.85)'; g.strokeText(e.name.toUpperCase(), 0, 0); g.fillStyle = '#e9edf5'; g.fillText(e.name.toUpperCase(), 0, 0);
        g.restore();
      }
    }
    // bairros
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const ls = clamp(19 * k, 62, 300);
    g.font = `${ls}px "BRND Anton", Impact, sans-serif`; g.lineJoin = 'round';
    g.globalAlpha = z > 0.12 ? 0.45 : 0.95;
    const boxes = [];
    for (const [t, x, y] of MAP_LABELS) {
      const words = t.split(' '), lines = [];
      if (t.length > 13 && words.length > 1) { let best = 1, bd = 1e9; for (let i = 1; i < words.length; i++) { const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length); if (d < bd) { bd = d; best = i; } } lines.push(words.slice(0, best).join(' '), words.slice(best).join(' ')); } else lines.push(t);
      const lh = ls * 1.02, w = Math.max(...lines.map((l) => g.measureText(l).width)), h = lh * lines.length;
      const bx = { x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2 };
      if (boxes.some((o) => bx.x0 < o.x1 && bx.x1 > o.x0 && bx.y0 < o.y1 && bx.y1 > o.y0)) continue;
      boxes.push(bx);
      lines.forEach((l, i) => { const ly = y - h / 2 + lh * (i + 0.5); g.lineWidth = ls * 0.2; g.strokeStyle = 'rgba(5,7,11,0.9)'; g.strokeText(l, x, ly); g.fillStyle = '#f4f1e6'; g.fillText(l, x, ly); });
    }
    g.globalAlpha = 1;
    // rota do GPS (azul, como app de mapa)
    if (Act.gps) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); Act.gps.pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.strokeStyle = 'rgba(5,7,11,0.9)'; g.lineWidth = 9 * k; g.stroke(); g.strokeStyle = '#ffcc2e'; g.lineWidth = 5.5 * k; g.stroke();
    }
    const ic = (x, y, kind) => { if (x < x0 || x > x1 || y < y0 || y > y1) return; g.save(); g.translate(x, y); g.scale(k * 1.35, k * 1.35); mapIcon(g, 0, 0, kind, 1.2); g.restore(); };
    for (const p of World.pois) ic(p.x, p.y, Profile.discovered.includes(p.id) ? 'poi' : 'unknown');
    for (const sp of World.parkSpots) if (!Profile.parks[sp.id]) ic(sp.x, sp.y, 'park');
    for (const r2 of World.races) ic(r2.start[0], r2.start[1], 'race');
    for (const s2 of World.shops) ic(s2.x, s2.y, shopIconKind(s2));
    { const ep = Events.mapPoint(); if (ep) ic(ep[0], ep[1], 'event'); }
    if (z > 0.09) {
      g.font = `700 ${11 * k}px "BRND Cond", Arial`; g.textBaseline = 'alphabetic';
      for (const s2 of World.shops) if (s2.x > x0 && s2.x < x1 && s2.y > y0 && s2.y < y1) { g.lineWidth = 3 * k; g.strokeStyle = 'rgba(8,12,18,0.85)'; g.strokeText(s2.name, s2.x, s2.y - 12 * k); g.fillStyle = '#ffe2c4'; g.fillText(s2.name, s2.x, s2.y - 12 * k); }
      for (const p of World.pois) if (Profile.discovered.includes(p.id)) { g.lineWidth = 3 * k; g.strokeStyle = 'rgba(8,12,18,0.85)'; g.strokeText(p.name, p.x, p.y - 12 * k); g.fillStyle = '#ecd6ff'; g.fillText(p.name, p.x, p.y - 12 * k); }
    }
    // destino: alfinete vermelho
    if (Act.waypoint) {
      const w = Act.waypoint;
      g.save(); g.translate(w.x, w.y); g.scale(k, k);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, 1, 6, 2.5, 0, 0, TAU); g.fill();
      g.fillStyle = '#ff3b4a'; g.strokeStyle = '#05070b'; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-11, -13, -11, -28, 0, -28); g.bezierCurveTo(11, -28, 11, -13, 0, 0); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -19, 4, 0, TAU); g.fill();
      g.restore();
    }
    // você: seta branca com contorno e brilho pulsando
    if (player) {
      const t = performance.now() / 1000;
      g.save(); g.translate(player.x, player.y); g.scale(k, k);
      g.fillStyle = 'rgba(255,204,46,0.22)'; g.beginPath(); g.arc(0, 0, 15 + Math.sin(t * 3) * 3, 0, TAU); g.fill();
      g.rotate(player.a);
      g.beginPath(); g.moveTo(13, 0); g.lineTo(-9, -9); g.lineTo(-4, 0); g.lineTo(-9, 9); g.closePath();
      g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = '#05070b'; g.stroke(); g.fillStyle = '#ffffff'; g.fill();
      g.restore();
    }
    // escala
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const m = 100 * k * 0.09; // metros em 100 px
    const nice = [10, 20, 50, 100, 200, 500, 1000, 2000].find((v) => v >= m * 0.6) || 2000, px = nice / (k * 0.09);
    g.fillStyle = 'rgba(5,7,11,0.75)'; g.fillRect(10, r.height - 26, px + 12, 18);
    g.fillStyle = '#ffcc2e'; g.fillRect(16, r.height - 13, px, 3);
    g.font = '700 11px "BRND Cond", Arial'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(nice >= 1000 ? nice / 1000 + ' km' : nice + ' m', 16, r.height - 15);
  }
}
function mapSetWaypoint(x, y, label) {
  if (Game.mode !== 'play') return;
  x = clamp(x, 0, WORLD_W); y = clamp(y, 0, WORLD_H);
  const ne = nearestEdge(x, y);
  const px = ne.e.h ? ne.e.a.x + ne.s : ne.e.a.x, py = ne.e.h ? ne.e.a.y : ne.e.a.y + ne.s;
  Act.waypoint = { x: px, y: py, label }; Act.gpsT = 0; Act.gps = player ? gpsRoute(player.x, player.y, px, py) : null;
  AudioSys.click(); renderMapDests(); drawBigMap();
}
function buildMapLegend() {
  const box = document.getElementById('map-legend'); if (!box || box.dataset.ok) return;
  const items = [['you', 'Você'], ['home', 'Garagem'], ['job', 'Entregas'], ['shop', 'Comércios'], ['fuel', 'Posto'], ['repair', 'Oficina'], ['race', 'Percursos'], ['park', 'Vagas'], ['poi', 'Pontos'], ['event', 'Eventos'], ['route', 'Rota'], ['dest', 'Destino']];
  box.innerHTML = '';
  for (const [kind, label] of items) {
    const sp = document.createElement('span'), c = document.createElement('canvas'); c.width = c.height = 36; const g = c.getContext('2d'); g.scale(2, 2);
    if (kind === 'you') { g.translate(9, 9); g.beginPath(); g.moveTo(7, 0); g.lineTo(-5, -5); g.lineTo(-2, 0); g.lineTo(-5, 5); g.closePath(); g.lineWidth = 2.4; g.strokeStyle = '#05070b'; g.lineJoin = 'round'; g.stroke(); g.fillStyle = '#fff'; g.fill(); }
    else if (kind === 'route') { g.lineCap = 'round'; g.strokeStyle = '#05070b'; g.lineWidth = 6; g.beginPath(); g.moveTo(3, 13); g.lineTo(15, 5); g.stroke(); g.strokeStyle = '#ffcc2e'; g.lineWidth = 3.5; g.stroke(); }
    else if (kind === 'dest') { g.translate(9, 16); g.scale(0.5, 0.5); g.fillStyle = '#ff3b4a'; g.strokeStyle = '#05070b'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-11, -13, -11, -28, 0, -28); g.bezierCurveTo(11, -28, 11, -13, 0, 0); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -19, 4, 0, TAU); g.fill(); }
    else mapIcon(g, 9, 9, kind, 1.45);
    sp.appendChild(c); sp.appendChild(document.createTextNode(label)); box.appendChild(sp);
  }
  box.dataset.ok = '1';
}
const MAP_CTRLS = '<div class="map-ctrls"><button data-mz="in" title="Aproximar">+</button><button data-mz="out" title="Afastar">−</button><button data-mz="me" title="Centralizar em você"><svg viewBox="0 0 24 24"><path d="M20 4L4 11l7 2 2 7z" fill="currentColor"/></svg></button></div>';
function mapCtrl(v, k) { if (k === 'in') v.zoomBy(1.5); else if (k === 'out') v.zoomBy(1 / 1.5); else v.center(); AudioSys.tone(1100, 0.03, 'sine', 0.04, 'ui'); }
const MapState = { full: { cx: 0, cy: 0, z: 0, follow: true }, phone: { cx: 0, cy: 0, z: 0.055, follow: true } };
const bigCanvas = document.getElementById('bigmap');
let bigMap = null, phoneMap = null;
function drawBigMap() {
  if (!bigMap) bigMap = new MapView(bigCanvas, MapState.full);
  buildMapLegend();
  { const el = document.getElementById('map-region'); if (el && player) el.textContent = (REGIONS[regionKeyAt(player.x, player.y)] || {}).name || ''; }
  if (Screens.current === 'screen-map') bigMap.draw();
  if (phoneMap && Screens.current === 'screen-phone') phoneMap.draw();
}

/* ---------- velocímetro ---------- */
const spCanvas = document.getElementById('speedo'), spx = spCanvas.getContext('2d');
function drawSpeedo() {
  if (!player) return;
  const W = spCanvas.width, H = spCanvas.height, k = W / 220;
  spx.setTransform(1, 0, 0, 1, 0, 0); spx.clearRect(0, 0, W, H);
  spx.scale(k, k);
  const cx = 110, cy = 84, R = 72;
  const kmh = player.speed * 0.3;
  const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
  const maxK = 240;
  spx.lineCap = 'round';
  spx.strokeStyle = 'rgba(255,255,255,0.08)'; spx.lineWidth = 9;
  spx.beginPath(); spx.arc(cx, cy, R, a0, a1); spx.stroke();
  const f = clamp(kmh / maxK, 0, 1);
  const gr = spx.createLinearGradient(30, 0, 190, 0); gr.addColorStop(0, '#22d17a'); gr.addColorStop(0.55, '#ffcc2e'); gr.addColorStop(1, '#ff4a3a');
  spx.strokeStyle = gr; spx.lineWidth = 9;
  if (f > 0.002) { spx.beginPath(); spx.arc(cx, cy, R, a0, a0 + (a1 - a0) * f); spx.stroke(); }
  spx.lineCap = 'butt';
  for (let v = 0; v <= maxK; v += 20) {
    const a = a0 + (a1 - a0) * v / maxK, big = v % 40 === 0;
    spx.strokeStyle = big ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)'; spx.lineWidth = big ? 2 : 1;
    spx.beginPath(); spx.moveTo(cx + Math.cos(a) * (R - 12), cy + Math.sin(a) * (R - 12)); spx.lineTo(cx + Math.cos(a) * (R - (big ? 20 : 16)), cy + Math.sin(a) * (R - (big ? 20 : 16))); spx.stroke();
  }
  const rf = clamp((player.rpm - 600) / 6400, 0, 1);
  spx.strokeStyle = rf > 0.85 ? '#ff5f7a' : 'rgba(255,255,255,0.45)'; spx.lineWidth = 3;
  spx.beginPath(); spx.arc(cx, cy, R - 30, a0 + 0.5, a0 + 0.5 + (a1 - a0 - 1) * rf); spx.stroke();
  spx.fillStyle = '#ffffff'; spx.textAlign = 'center'; spx.textBaseline = 'middle';
  spx.font = '48px "BRND Anton", Impact, sans-serif'; spx.fillStyle = '#05070b'; spx.fillText(Math.round(kmh), cx + 2, cy - 3); spx.fillStyle = '#ffffff'; spx.fillText(Math.round(kmh), cx, cy - 5);
  spx.font = '700 12px "BRND Cond", Arial'; spx.fillStyle = 'rgba(255,255,255,0.6)'; spx.fillText('KM/H', cx, cy + 19);
  const gear = player.gear === -1 ? 'R' : player.speed < 4 && !Keys.KeyW && !Keys.ArrowUp ? 'N' : String(player.gear);
  spx.font = '22px "BRND Anton", Impact, sans-serif'; spx.fillStyle = gear === 'R' ? '#ff5f7a' : '#ffcc2e'; spx.fillText(gear, cx, cy + 43);
  spx.font = '700 10px "BRND Cond", Arial'; spx.fillStyle = 'rgba(255,255,255,0.45)'; spx.fillText('MARCHA', cx, cy + 60);
  if (player.highBeam) { spx.fillStyle = '#59e0ff'; spx.font = '800 12px "BRND Cond", Arial'; spx.fillText('FAROL ALTO', cx, 12); }
}

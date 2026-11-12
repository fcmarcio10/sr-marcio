
/* ============================ SOMBRAS DETALHADAS (gráfico Alta) ============================
   1) Cada poste projeta no chão a sombra das construções e árvores em volta (assada uma vez no chão).
   2) Carros e pedestres projetam sombra macia para longe de cada poste perto (muda enquanto andam).
   3) Sombra de contato macia embaixo dos carros e escurecimento no pé das construções. */
function hqShadows() { return Settings.quality === 'alta'; }
let SHSPR = null, SHDOT = null;
function buildShadowSprites() {
  // retângulo borrado (sombra de carro) e mancha redonda (pessoas)
  SHSPR = makeCanvas(128, 72);
  { const g = SHSPR.getContext('2d'); g.shadowColor = 'rgba(0,0,0,1)'; g.shadowBlur = 12; g.shadowOffsetX = 1000; g.fillStyle = '#000'; g.beginPath(); rrect(g, 18 - 1000, 16, 92, 40, 8); g.fill(); }
  SHDOT = makeCanvas(64, 64);
  { const g = SHDOT.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
}
// sombra macia de um retângulo L x W (centro em 0,0, já rotacionado pelo chamador)
function softCarShadow(ctx, L, W) { const sx = L / 92, sy = W / 40; ctx.drawImage(SHSPR, -64 * sx, -36 * sy, 128 * sx, 72 * sy); }

// --- postes que iluminam um ponto (no máximo 2, os mais fortes) ---
const _shLq = [], _shLn = [];
function lampsAt(x, y) {
  lightGrid.query(x - 1, y - 1, x + 1, y + 1, _shLq);
  _shLn.length = 0;
  for (const L of _shLq) {
    if (L.fountain || L.shop || (L.dieAt && Game.time > L.dieAt)) continue;
    if (!(L.lamp || L.flood || L.canopy || (L.r >= 110 && L.i >= 0.75))) continue;
    const R = L.r * 0.9, d = Math.hypot(x - L.x, y - L.y);
    if (d >= R || d < 3) continue;
    _shLn.push([L, d, (1 - d / R) * L.i]);
  }
  _shLn.sort((a, b) => b[2] - a[2]);
  if (_shLn.length > 2) _shLn.length = 2;
  return _shLn;
}
function drawDynShadows(ctx, view) {
  if (!hqShadows() || !SHSPR) return;
  const car = (o, m, a) => {
    for (const [L, d, w] of lampsAt(o.x, o.y)) {
      const dx = (o.x - L.x) / d, dy = (o.y - L.y) / d, len = 10 + 42 * (d / L.r);
      for (const [k, al] of [[0.4, 0.55], [0.85, 0.32]]) {
        ctx.save(); ctx.translate(o.x + dx * len * k, o.y + dy * len * k); ctx.rotate(a);
        ctx.globalAlpha = Math.min(0.85, 0.95 * w + 0.15) * al * 1.5; softCarShadow(ctx, m.L * (1 + k * 0.15), m.W); ctx.restore();
      }
    }
  };
  const ped = (o) => {
    for (const [L, d, w] of lampsAt(o.x, o.y)) {
      const dx = (o.x - L.x) / d, dy = (o.y - L.y) / d, len = 6 + 22 * (d / L.r);
      ctx.globalAlpha = Math.min(0.7, 0.8 * w + 0.1);
      ctx.save(); ctx.translate(o.x + dx * len * 0.5, o.y + dy * len * 0.5); ctx.rotate(Math.atan2(dy, dx)); ctx.drawImage(SHDOT, -len * 0.5 - 4, -4.5, len + 8, 9); ctx.restore();
    }
  };
  for (const c of Traffic.cars) if (inView(view, c.x, c.y, 60)) car(c, c.m, c.a);
  for (const u of Police.units) if (inView(view, u.x, u.y, 60)) car(u, VMODELS.police, u.a);
  if (Socorro.job && inView(view, Socorro.job.x, Socorro.job.y, 60)) car(Socorro.job, VMODELS.guincho, Socorro.job.a);
  if (player && Game.state !== 'menu') car(player, player.m, player.a);
  for (const an of Animals.list) if ((an.type === 'person' || an.type === 'dog') && inView(view, an.x, an.y, 30)) ped(an);
  ctx.globalAlpha = 1;
}

// --- sombras fixas dos postes (assadas no chão) ---
function hull(P) {
  P.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}
function bakeLampShadows() {
  const HL = 64, q = [];
  for (const L of World.lights) {
    if (!L.lamp) continue;
    const R = L.r * 0.95;
    rendGrid.query(L.x - R, L.y - R, L.x + R, L.y + R, q);
    const occ = q.filter((o) => (o.kind === 'bld' && !(L.x > o.x0 && L.x < o.x1 && L.y > o.y0 && L.y < o.y1)) || (o.kind === 'tree' && o.type !== 'bush'));
    if (!occ.length) continue;
    // pré-calcula os polígonos de sombra
    const shapes = [];
    for (const o of occ) {
      if (o.kind === 'bld') {
        const C = [[o.x0, o.y0], [o.x1, o.y0], [o.x1, o.y1], [o.x0, o.y1]], P = C.slice();
        for (const c of C) {
          const dx = c[0] - L.x, dy = c[1] - L.y, d = Math.hypot(dx, dy) || 1;
          const ext = o.h >= HL * 0.85 ? R * 1.2 : Math.min(R * 1.2, d * o.h / (HL - o.h));
          P.push([c[0] + dx / d * ext, c[1] + dy / d * ext]);
        }
        shapes.push({ poly: hull(P) });
      } else {
        const dx = o.x - L.x, dy = o.y - L.y, d = Math.hypot(dx, dy) || 1, h = Math.min(o.h, HL * 0.8);
        const cd = Math.min(R, d * HL / (HL - h)), rc = (o.type === 'palm' ? 18 : 15) * o.size;
        shapes.push({ tree: o, cx: L.x + dx / d * cd, cy: L.y + dy / d * cd, rx: rc * (1.15 + 0.25 * cd / R), ry: rc, a: Math.atan2(dy, dx), bx: o.x, by: o.y });
      }
    }
    bake(L.x - R, L.y - R, L.x + R, L.y + R, 7.3, (g) => {
      if (!hqShadows() || (L.lamp && (L.lamp.broken || L.lamp.down !== undefined))) return;
      g.save();
      g.beginPath(); g.arc(L.x, L.y, R, 0, TAU); g.clip();
      const grd = g.createRadialGradient(L.x, L.y, 8, L.x, L.y, R);
      grd.addColorStop(0, `rgba(0,0,0,${(0.75 * L.i).toFixed(3)})`); grd.addColorStop(0.65, `rgba(0,0,0,${(0.45 * L.i).toFixed(3)})`); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.strokeStyle = grd; g.lineCap = 'round';
      const path = () => {
        g.beginPath();
        for (const s of shapes) {
          if (s.poly) { s.poly.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); }
          else if (!s.tree.removed) { g.moveTo(s.cx + Math.cos(s.a) * s.rx, s.cy + Math.sin(s.a) * s.rx); g.ellipse(s.cx, s.cy, s.rx, s.ry, s.a, 0, TAU); }
        }
      };
      // três passadas levemente deslocadas = borda de penumbra macia
      for (const [ox, oy, al] of [[0, 0, 0.5], [1.6, 1.2, 0.28], [-1.6, 1.2, 0.28]]) { g.globalAlpha = al; g.save(); g.translate(ox, oy); path(); g.fill(); g.restore(); }
      // tronco das árvores
      g.globalAlpha = 0.5; g.lineWidth = 3;
      for (const s of shapes) if (s.tree && !s.tree.removed) { g.beginPath(); g.moveTo(s.bx, s.by); g.lineTo(s.cx, s.cy); g.stroke(); }
      g.restore();
    });
  }
  // escurecimento no pé das construções (as paredes "assentam" no chão)
  for (const b of World.buildings) {
    const m = 10;
    bake(b.x0 - m, b.y0 - m, b.x1 + m, b.y1 + m, 7.1, (g) => {
      if (!hqShadows()) return;
      const side = (x0, y0, x1, y1, gx0, gy0, gx1, gy1) => { const gr = g.createLinearGradient(gx0, gy0, gx1, gy1); gr.addColorStop(0, 'rgba(0,0,0,0.38)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0); };
      side(b.x0, b.y0 - m, b.x1, b.y0, 0, b.y0, 0, b.y0 - m);
      side(b.x0, b.y1, b.x1, b.y1 + m, 0, b.y1, 0, b.y1 + m);
      side(b.x0 - m, b.y0, b.x0, b.y1, b.x0, 0, b.x0 - m, 0);
      side(b.x1, b.y0, b.x1 + m, b.y1, b.x1, 0, b.x1 + m, 0);
    });
  }
}

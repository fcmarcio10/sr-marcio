/* Desenhos: tudo é feito no código (chão, paredes, telhados, objetos e pessoas). */
const P3 = (x, y, z) => [(x - y) * HW, (x + y) * HH - z * ZS];
function rotPt(x, y, w, h, r) { return r === 0 ? [x, y] : r === 1 ? [h - y, x] : r === 2 ? [w - x, h - y] : [y, w - x]; }

const Art = {
  cache: new Map(), tiles: new Map(), walls: new Map(), roofs: [],

  /* ---------- peças em 3D simples ---------- */
  box(g, P, x0, y0, z0, x1, y1, z1, col, o) {
    o = o || {};
    const poly = (pts, f) => {
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath(); g.fillStyle = f; g.fill();
      if (!o.flat) { g.strokeStyle = 'rgba(0,0,0,.32)'; g.lineWidth = 0.6; g.stroke(); }
    };
    if (o.a) g.globalAlpha = o.a;
    poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], shade(col, 0.86));
    poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], shade(col, 0.64));
    poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], o.top || shade(col, 1.12));
    g.globalAlpha = 1;
  },
  cyl(g, P, cx, cy, z0, z1, r, col, o) {
    const a = P(cx, cy, z0), b = P(cx, cy, z1), rx = r * 45.25, ry = r * 22.6;
    const gr = g.createLinearGradient(a[0] - rx, 0, a[0] + rx, 0);
    gr.addColorStop(0, shade(col, 0.95)); gr.addColorStop(0.45, shade(col, 0.82)); gr.addColorStop(1, shade(col, 0.5));
    g.beginPath(); g.ellipse(a[0], a[1], rx, ry, 0, 0, Math.PI); g.lineTo(b[0] - rx, b[1]); g.ellipse(b[0], b[1], rx, ry, 0, Math.PI, 0, true); g.closePath();
    g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(0,0,0,.32)'; g.lineWidth = 0.6; g.stroke();
    g.beginPath(); g.ellipse(b[0], b[1], rx, ry, 0, 0, 7); g.fillStyle = (o && o.top) || shade(col, 1.15); g.fill(); g.stroke();
  },
  blob(g, P, cx, cy, cz, r, col, rng) {
    const p = P(cx, cy, cz), R = r * 44, ry = R * 0.86;
    const gr = g.createRadialGradient(p[0] - R * 0.35, p[1] - ry * 0.45, R * 0.08, p[0], p[1], R);
    gr.addColorStop(0, shade(col, 1.22)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, 0.55));
    g.save(); g.beginPath(); g.ellipse(p[0], p[1], R, ry, 0, 0, 7); g.fillStyle = gr; g.fill(); g.clip();
    const n = Math.floor(r * r * 70);
    for (let i = 0; i < n; i++) {
      const a = rng() * 6.283, d = Math.sqrt(rng()) * R, x = p[0] + Math.cos(a) * d, y = p[1] + Math.sin(a) * d * 0.86;
      const up = (y - p[1]) / ry;
      g.fillStyle = rng() < 0.5 - up * 0.3 ? 'rgba(255,255,220,.13)' : 'rgba(0,0,0,.16)';
      g.beginPath(); g.ellipse(x, y, 1.6 + rng() * 2.2, 1 + rng() * 1.4, rng() * 3, 0, 7); g.fill();
    }
    g.restore();
  },
  /* monta o desenho de um objeto a partir da lista de peças */
  model(prims, w, h, rot, seed) {
    const rng = mulberry32(seed || 1), list = [];
    let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    const ext = (x, y, z, pad) => { const p = P3(x, y, z); pad = pad || 0; minx = Math.min(minx, p[0] - pad); maxx = Math.max(maxx, p[0] + pad); miny = Math.min(miny, p[1] - pad); maxy = Math.max(maxy, p[1] + pad); };
    for (const q of prims) {
      if (!q) continue;
      if (q[0] === 'b') {
        const a = rotPt(q[1], q[2], w, h, rot), b = rotPt(q[4], q[5], w, h, rot);
        const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
        const o = q[8] || {};
        list.push({ k: q[3] * 10 + (x0 + x1 + y0 + y1) / 2 + (o.bias || 0), t: 'b', v: [x0, y0, q[3], x1, y1, q[6], q[7], o] });
        for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [q[3], q[6]]) ext(x, y, z);
      } else if (q[0] === 'c') {
        const c = rotPt(q[1], q[2], w, h, rot), o = q[7] || {};
        list.push({ k: q[3] * 10 + c[0] + c[1] + (o.bias || 0), t: 'c', v: [c[0], c[1], q[3], q[4], q[5], q[6], o] });
        ext(c[0], c[1], q[3], q[5] * 46); ext(c[0], c[1], q[4], q[5] * 46);
      } else if (q[0] === 's') {
        const c = rotPt(q[1], q[2], w, h, rot);
        list.push({ k: (q[3] - q[4] * 0.5) * 10 + c[0] + c[1], t: 's', v: [c[0], c[1], q[3], q[4], q[5]] });
        ext(c[0], c[1], q[3], q[4] * 45);
      } else if (q[0] === 'f') {
        const bb = q[2];
        const a = rotPt(bb[0], bb[1], w, h, rot), b = rotPt(bb[3], bb[4], w, h, rot);
        for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) for (const z of [bb[2], bb[5]]) ext(x, y, z, 2);
        list.push({ k: bb[2] * 10 + (a[0] + b[0] + a[1] + b[1]) / 2 + (q[3] || 0), t: 'f', v: q[1] });
      }
    }
    list.sort((a, b) => a.k - b.k);
    const ww = rot & 1 ? h : w, hh = rot & 1 ? w : h;
    ext(0, 0, 0); ext(ww, hh, 0); ext(ww, 0, 0); ext(0, hh, 0);
    minx = Math.floor(minx) - 2; miny = Math.floor(miny) - 2;
    const [cv, g] = mk((maxx - minx + 3) * SS, (maxy - miny + 3) * SS);
    g.scale(SS, SS); g.translate(-minx, -miny); g.lineJoin = 'round';
    const Pw = (x, y, z) => P3(x, y, z);
    const Pl = (x, y, z) => { const r = rotPt(x, y, w, h, rot); return P3(r[0], r[1], z); };
    for (const it of list) {
      const v = it.v;
      if (it.t === 'b') this.box(g, Pw, v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7]);
      else if (it.t === 'c') this.cyl(g, Pw, v[0], v[1], v[2], v[3], v[4], v[5], v[6]);
      else if (it.t === 's') this.blob(g, Pw, v[0], v[1], v[2], v[3], v[4], rng);
      else v(g, Pl, rng);
    }
    return { img: cv, ax: -minx, ay: -miny, w: cv.width / SS, h: cv.height / SS };
  },
  prop(t, rot, v) {
    const M = MODELS[t];
    if (!M) return null;
    const nv = M.vars || 1, vi = v % nv, key = t + '|' + rot + '|' + vi;
    let s = this.cache.get(key);
    if (s) return s;
    const d = PROPS[t];
    const vis = { py: rot === 0 || rot === 3, px: rot === 0 || rot === 1, ny: rot === 1 || rot === 2, nx: rot === 2 || rot === 3 };
    const D = (side, a0, a1, z0, z1, c, at, o) => {
      if (!vis[side]) return null;
      const e = 0.016, oo = Object.assign({ bias: 6, flat: 1 }, o || {});
      if (side === 'py') return ['b', a0, at, z0, a1, at + e, z1, c, oo];
      if (side === 'ny') return ['b', a0, at - e, z0, a1, at, z1, c, oo];
      if (side === 'px') return ['b', at, a0, z0, at + e, a1, z1, c, oo];
      return ['b', at - e, a0, z0, at, a1, z1, c, oo];
    };
    s = this.model(M.f(vi, D, vis), d.w, d.h, rot, 77 + vi * 13 + t.length * 7);
    this.cache.set(key, s);
    return s;
  },
  /* liga os objetos às casas do mapa (objetos grandes são fatiados para a ordem de desenho ficar certa) */
  registerAll() {
    const W = World;
    W.tileDraw = new Array(MW * MH);
    for (const p of W.props) if (!p.dead) this.register(p);
  },
  register(p) {
    const s = this.prop(p.t, p.rot, p.v);
    if (!s) return;
    const W = World, ox = isoX(p.x, p.y) - s.ax, oy = isoY(p.x, p.y) - s.ay;
    const put = (tx, ty, d) => { const i = idx(tx, ty); (W.tileDraw[i] || (W.tileDraw[i] = [])).push(d); };
    p.spr = s; p.dx = ox; p.dy = oy;
    if (p.w === 1 && p.h === 1) { put(p.x, p.y, { img: s.img, sx: 0, sw: s.img.width, sh: s.img.height, dx: ox, dy: oy, p }); return; }
    for (let j = -p.h; j < p.w; j++) {
      let best = -1, bx = 0, by = 0;
      for (const d of [j, j + 1]) {
        const X = Math.min(p.w - 1, p.h - 1 + d), Y = X - d;
        if (X < 0 || Y < 0 || Y > p.h - 1) continue;
        if (X + Y > best) { best = X + Y; bx = X; by = Y; }
      }
      if (best < 0) continue;
      let x0 = s.ax + j * HW, x1 = x0 + HW;
      if (j === -p.h) x0 = 0;
      if (j === p.w - 1) x1 = s.w;
      put(p.x + bx, p.y + by, { img: s.img, sx: x0 * SS, sw: (x1 - x0) * SS, sh: s.img.height, dx: ox + x0, dy: oy, p });
    }
  },

  /* ---------- chão ---------- */
  tile(t, x, y) {
    const W = World;
    let mask = 0, vr = Math.floor(hash2(x, y, 1) * 4);
    if (t === GR.SIDE || t === GR.PORT) {
      const road = q => q === GR.ASPH || (q >= GR.LW && q <= GR.ZH) || q === GR.DLW || q === GR.DLN;
      if (road(W.ground[idx(x, y - 1)])) mask |= 1;
      if (road(W.ground[idx(x + 1, y)])) mask |= 2;
      if (road(W.ground[idx(x, y + 1)])) mask |= 4;
      if (road(W.ground[idx(x - 1, y)])) mask |= 8;
    } else if (t === GR.PARK) mask = (x % 3 === 0) ? 1 : 0;
    else if (t === GR.FIELD || t === GR.COURT) mask = ((x >> 2) & 1);
    else if (t === GR.CHECK) { mask = (x + y) & 1; vr = 0; }
    const key = t * 256 + vr * 16 + mask;
    let c = this.tiles.get(key);
    if (c) return c;
    const [cv, g] = mk((TW + 2) * SS, (TH + 2) * SS);
    g.scale(SS, SS);
    const rng = mulberry32(key * 31 + 5);
    const T = (u, v) => [(u - v) * HW + HW + 1, (u + v) * HH + 1];
    const dia = (e) => { g.beginPath(); g.moveTo(HW + 1, 1 - e); g.lineTo(TW + 1 + e * 2, HH + 1); g.lineTo(HW + 1, TH + 1 + e); g.lineTo(1 - e * 2, HH + 1); g.closePath(); };
    const line = (u0, v0, u1, v1, col, w) => { const a = T(u0, v0), b = T(u1, v1); g.strokeStyle = col; g.lineWidth = w || 0.7; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
    const quad = (u0, v0, u1, v1, col) => { const a = T(u0, v0), b = T(u1, v0), c2 = T(u1, v1), d = T(u0, v1); g.fillStyle = col; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c2[0], c2[1]); g.lineTo(d[0], d[1]); g.fill(); };
    const speck = (n, cols, s) => { for (let i = 0; i < n; i++) { const p = T(rng(), rng()); g.fillStyle = cols[Math.floor(rng() * cols.length)]; g.fillRect(p[0], p[1], (s || 1) + rng(), 0.6 + rng() * 0.6); } };
    const crack = (n) => { g.strokeStyle = 'rgba(0,0,0,.38)'; g.lineWidth = 0.6; for (let k = 0; k < n; k++) { let u = rng(), v = rng(); g.beginPath(); const p = T(u, v); g.moveTo(p[0], p[1]); for (let i = 0; i < 4; i++) { u += (rng() - 0.5) * 0.3; v += (rng() - 0.5) * 0.3; const q = T(u, v); g.lineTo(q[0], q[1]); } g.stroke(); } };
    const base = (col) => { dia(0.6); g.fillStyle = col; g.fill(); dia(0); g.save(); g.clip(); };
    const asph = (col) => { base(col || '#414143'); speck(90, ['rgba(255,255,255,.05)', 'rgba(0,0,0,.13)', 'rgba(255,255,255,.03)']); if (vr === 1) crack(1); if (vr === 2) { crack(2); } if (vr === 3) { g.fillStyle = 'rgba(0,0,0,.12)'; const p = T(0.3 + rng() * 0.3, 0.3 + rng() * 0.3); g.beginPath(); g.ellipse(p[0], p[1], 9, 4, 0, 0, 7); g.fill(); } };
    switch (t) {
      case GR.GRASS: case GR.DRYG: case GR.FIELD: {
        const b = t === GR.GRASS ? '#56633d' : t === GR.DRYG ? '#6d6a45' : (mask ? '#5c6e40' : '#566839');
        base(b);
        speck(50, ['rgba(0,0,0,.12)', 'rgba(255,255,200,.07)']);
        for (let i = 0; i < 46; i++) { const p = T(rng(), rng()); g.strokeStyle = rng() < 0.5 ? shade(b, 1.14 + rng() * 0.1) : shade(b, 0.78); g.lineWidth = 0.7; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + (rng() - 0.5) * 2, p[1] - 1.5 - rng() * 2.2); g.stroke(); }
        if (t === GR.FIELD && vr === 2) { g.fillStyle = 'rgba(138,90,60,.5)'; const p = T(0.5, 0.5); g.beginPath(); g.ellipse(p[0], p[1], 12, 5, 0, 0, 7); g.fill(); }
        if (t === GR.GRASS && vr === 3) for (let i = 0; i < 3; i++) { const p = T(rng(), rng()); g.fillStyle = '#c9c08a'; g.fillRect(p[0], p[1], 1, 1); }
        break;
      }
      case GR.DIRT: base('#85573b'); speck(70, ['rgba(0,0,0,.14)', 'rgba(255,220,180,.09)', 'rgba(60,20,10,.15)'], 1.4); if (vr > 1) crack(1); for (let i = 0; i < 4; i++) { const p = T(rng(), rng()); g.fillStyle = '#9c8f80'; g.fillRect(p[0], p[1], 1.5, 1); } break;
      case GR.ASPH: asph(); break;
      case GR.LW: asph(); quad(0.0, 0.12, 0.09, 0.62, 'rgba(196,164,58,.62)'); break;
      case GR.LN: asph(); quad(0.12, 0.0, 0.62, 0.09, 'rgba(196,164,58,.62)'); break;
      case GR.DLW: asph(); quad(0.0, 0, 0.06, 1, 'rgba(196,164,58,.6)'); quad(0.12, 0, 0.18, 1, 'rgba(196,164,58,.6)'); break;
      case GR.DLN: asph(); quad(0, 0.0, 1, 0.06, 'rgba(196,164,58,.6)'); quad(0, 0.12, 1, 0.18, 'rgba(196,164,58,.6)'); break;
      case GR.ZV: asph(); quad(0.18, 0, 0.62, 1, 'rgba(214,210,196,.55)'); speck(30, ['rgba(65,65,67,.7)'], 2); break;
      case GR.ZH: asph(); quad(0, 0.18, 1, 0.62, 'rgba(214,210,196,.55)'); speck(30, ['rgba(65,65,67,.7)'], 2); break;
      case GR.PARK: asph('#4b4b4c'); if (mask) quad(0, 0, 0.07, 1, 'rgba(210,206,190,.45)'); break;
      case GR.COURT: base(mask ? '#647a80' : '#5f757c'); speck(60, ['rgba(0,0,0,.1)', 'rgba(255,255,255,.06)']); if (vr === 1) crack(1); line(0, 0, 1, 0, 'rgba(230,230,220,.18)', 1); break;
      case GR.SIDE: {
        base('#8d897f'); speck(55, ['rgba(0,0,0,.09)', 'rgba(255,255,255,.07)']);
        line(0, 0, 1, 0, 'rgba(0,0,0,.25)'); line(0, 0, 0, 1, 'rgba(0,0,0,.25)'); line(0.5, 0, 0.5, 1, 'rgba(0,0,0,.1)');
        if (vr === 1) crack(1);
        if (vr === 3) for (let i = 0; i < 7; i++) { const p = T(rng() * 0.2, rng()); g.fillStyle = '#5d6b3e'; g.fillRect(p[0], p[1], 1.6, 1.2); }
        if (vr === 2) { g.fillStyle = 'rgba(40,30,20,.16)'; const p = T(rng(), rng()); g.beginPath(); g.ellipse(p[0], p[1], 7, 3, 0, 0, 7); g.fill(); }
        const cb = 'rgba(205,200,186,.9)', sh = 'rgba(0,0,0,.3)';
        if (mask & 1) { quad(0, 0, 1, 0.12, cb); line(0, 0.12, 1, 0.12, sh); }
        if (mask & 2) { quad(0.88, 0, 1, 1, cb); line(0.88, 0, 0.88, 1, sh); }
        if (mask & 4) { quad(0, 0.88, 1, 1, cb); line(0, 0.88, 1, 0.88, sh); }
        if (mask & 8) { quad(0, 0, 0.12, 1, cb); line(0.12, 0, 0.12, 1, sh); }
        break;
      }
      case GR.PORT: {
        base('#cbc4b3');
        for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { const u = i / 10, v = j / 10; if (Math.sin((u + v) * 6.283 + Math.sin(u * 6.283) * 1.3) > 0.25) quad(u + 0.008, v + 0.008, u + 0.094, v + 0.094, '#3a3733'); }
        speck(40, ['rgba(0,0,0,.1)', 'rgba(255,255,255,.08)']);
        if (mask & 1) quad(0, 0, 1, 0.12, '#cdc8ba'); if (mask & 2) quad(0.88, 0, 1, 1, '#cdc8ba'); if (mask & 4) quad(0, 0.88, 1, 1, '#cdc8ba'); if (mask & 8) quad(0, 0, 0.12, 1, '#cdc8ba');
        break;
      }
      case GR.CER: base('#b8aa8e'); speck(40, ['rgba(0,0,0,.07)', 'rgba(255,255,255,.07)']); for (const k of [0, 0.5]) { line(k, 0, k, 1, 'rgba(60,45,30,.4)'); line(0, k, 1, k, 'rgba(60,45,30,.4)'); } if (vr === 2) crack(1); break;
      case GR.WHITE: base('#cbcec8'); speck(30, ['rgba(0,0,0,.06)']); for (const k of [0, 0.33, 0.66]) { line(k, 0, k, 1, 'rgba(60,70,70,.3)'); line(0, k, 1, k, 'rgba(60,70,70,.3)'); } if (vr === 3) { g.fillStyle = 'rgba(70,40,30,.2)'; const p = T(rng(), rng()); g.beginPath(); g.ellipse(p[0], p[1], 6, 3, 0, 0, 7); g.fill(); } break;
      case GR.WOOD: base('#7b5b3b'); for (let k = 0; k < 4; k++) { quad(0, k / 4, 1, k / 4 + 0.25, k % 2 ? 'rgba(0,0,0,.07)' : 'rgba(255,220,170,.05)'); line(0, k / 4, 1, k / 4, 'rgba(30,18,8,.5)'); line((k * 0.37 + vr * 0.2) % 1, k / 4, (k * 0.37 + vr * 0.2) % 1, k / 4 + 0.25, 'rgba(30,18,8,.4)'); } speck(40, ['rgba(0,0,0,.1)', 'rgba(255,230,190,.06)'], 2.5); break;
      case GR.RED: base('#8b4034'); speck(50, ['rgba(0,0,0,.12)', 'rgba(255,200,180,.08)']); if (vr === 1) crack(1); if (vr >= 2) { g.fillStyle = 'rgba(190,150,130,.18)'; const p = T(rng(), rng()); g.beginPath(); g.ellipse(p[0], p[1], 9, 4, 0, 0, 7); g.fill(); } line(0, 0, 1, 0, 'rgba(0,0,0,.14)'); break;
      case GR.CHECK: base(mask ? '#c9c5b8' : '#3d3a37'); speck(30, ['rgba(0,0,0,.1)', 'rgba(255,255,255,.07)']); line(0, 0, 1, 0, 'rgba(0,0,0,.3)'); line(0, 0, 0, 1, 'rgba(0,0,0,.3)'); break;
      default: base('#83817b'); speck(60, ['rgba(0,0,0,.1)', 'rgba(255,255,255,.06)']); line(0, 0, 1, 0, 'rgba(0,0,0,.2)'); if (vr === 1) crack(1); if (vr === 2) { g.fillStyle = 'rgba(20,20,20,.18)'; const p = T(rng(), rng()); g.beginPath(); g.ellipse(p[0], p[1], 8, 4, 0, 0, 7); g.fill(); }
    }
    g.restore();
    this.tiles.set(key, cv);
    return cv;
  },

  /* ---------- paredes ---------- */
  wall(o, type, st) {
    const key = o + '|' + type + '|' + st.col + '|' + st.lv + '|' + (st.ext ? 1 : 0) + '|' + (st.barr || 0) + '|' + (st.brick ? 1 : 0) + '|' + (st.cut ? 1 : 0) + '|' + st.seed + '|' + (st.sign ? st.sign.txt + st.sign.i + st.sign.st : '');
    let s = this.walls.get(key);
    if (s) return s;
    const T = WALL_T, L = 1 + T;
    const low = type >= E.MURO;
    let H = low ? 1.75 : st.cut ? 0.34 : st.lv * LVL_H;
    const big = type === E.DOPEN || type === E.GOPEN;
    const mx = big ? 30 : 2, my = big ? 18 : 2;
    const cw = (1 + 2 * T) * HW + mx * 2, ch = H * ZS + (1 + 2 * T) * HH + my + 2;
    const [cv, g] = mk(cw * SS, ch * SS);
    g.scale(SS, SS);
    const ox = (o === 0 ? T * HW : L * HW) + mx, oy = H * ZS + 2;
    const P = (x, y, z) => [ox + (x - y) * HW, oy + (x + y) * HH - z * ZS];
    const rng = mulberry32(st.seed * 97 + type * 13 + o * 5 + 3);
    const faceCol = shade(st.col, o === 0 ? 0.93 : 0.72);
    const poly = (pts, f) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = f; g.fill(); };
    const dark = o === 0 ? 1 : 0.8;
    g.save();
    if (o === 0) g.transform(HW, HH, 0, -ZS, ox - T * HW, oy + T * HH);
    else g.transform(HW, -HH, 0, -ZS, ox - HW, oy + (1 + 2 * T) * HH);
    const R = (u0, v0, u1, v1, c) => { g.fillStyle = c; g.fillRect(u0, v0, u1 - u0, v1 - v0); };
    const hole = (u0, v0, u1, v1) => g.clearRect(u0, v0, u1 - u0, v1 - v0);
    const metal = '#30302e';
    if (type === E.GRADE) {
      R(0, 0, L, 0.3, shade('#8f8a7e', dark));
      R(0, 0, 0.07, 1.7, shade('#8f8a7e', dark));
      R(0, 0.36, L, 0.41, metal); R(0, 1.55, L, 1.6, metal);
      for (let u = 0.14; u < L; u += 0.115) R(u, 0.3, u + 0.022, 1.68, metal);
    } else if (type === E.GOPEN) {
      R(0, 0, 0.08, 1.75, shade('#8f8a7e', dark)); R(L - 0.08, 0, L, 1.75, shade('#8f8a7e', dark));
    } else if (type === E.GATE) {
      R(0, 0, 0.08, 1.75, shade('#8f8a7e', dark)); R(L - 0.08, 0, L, 1.75, shade('#8f8a7e', dark));
      R(0.08, 0.06, L - 0.08, 1.68, shade('#5d666a', dark));
      for (let u = 0.14; u < L - 0.1; u += 0.1) R(u, 0.08, u + 0.02, 1.66, 'rgba(0,0,0,.25)');
      R(0.08, 0.8, L - 0.08, 0.86, 'rgba(0,0,0,.3)'); R(0.52, 0.72, 0.6, 0.94, '#2a2a2a');
      for (let i = 0; i < 14; i++) R(0.1 + rng() * 0.9, rng() * 1.5, 0.1 + rng() * 0.9 + 0.05, rng() * 1.5 + 0.12, 'rgba(120,60,30,.25)');
    } else {
      const wcol = type === E.MURO ? shade('#aaa392', dark * 0.95) : faceCol;
      R(0, 0, L, H, wcol);
      if (!st.cut) {
        if (st.brick && type !== E.MURO) {
          for (let v = 0, r = 0; v < H; v += 0.19, r++) { R(0, v, L, v + 0.02, 'rgba(60,35,25,.45)'); for (let u = (r % 2) * 0.2; u < L; u += 0.4) R(u, v, u + 0.02, v + 0.19, 'rgba(60,35,25,.4)'); }
        }
        if (st.barr && type !== E.MURO && st.ext) R(0, 0, L, 0.85, typeof st.barr === 'string' ? shade(st.barr, dark) : 'rgba(40,25,15,.3)');
        /* sujeira e manchas */
        const gr = g.createLinearGradient(0, 0, 0, Math.min(H, 2.7));
        gr.addColorStop(0, 'rgba(20,14,8,.34)'); gr.addColorStop(0.3, 'rgba(20,14,8,.06)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, L, H);
        for (let i = 0; i < 26; i++) { const u = rng() * L, v = rng() * H; R(u, v, u + 0.02 + rng() * 0.05, v + 0.03 + rng() * 0.2, rng() < 0.6 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.05)'); }
        if (st.ext && rng() < 0.5) { const u = rng() * 0.8; R(u, H - 0.5 - rng() * 1.2, u + 0.05, H, 'rgba(30,40,25,.14)'); }
        if (type === E.MURO) for (let i = 0; i < 60; i++) { const u = rng() * L, v = rng() * H; R(u, v, u + 0.025, v + 0.03, 'rgba(0,0,0,.1)'); }
        for (let lv = 1; lv < st.lv; lv++) {
          const b0 = lv * LVL_H;
          R(0, b0 - 0.08, L, b0, 'rgba(0,0,0,.18)');
          if (st.ext && hash2(st.seed, lv, o) < 0.7) { R(0.2, b0 + 0.95, 0.84, b0 + 2.0, '#d9d5c8'); R(0.24, b0 + 1.0, 0.8, b0 + 1.95, hash2(st.seed, lv, 9) < 0.25 ? '#15181a' : '#35454e'); R(0.51, b0 + 1.0, 0.53, b0 + 1.95, '#d9d5c8'); if (hash2(st.seed, lv, 4) < 0.3) R(0.26, b0 + 1.4, 0.5, b0 + 1.95, 'rgba(190,170,140,.75)'); }
        }
        if (st.sign && st.ext) {
          const sg = st.sign;
          g.save();
          if (sg.st === 0) { R(0, 2.12, L, 2.62, shade(sg.col, dark)); R(0, 2.12, L, 2.15, 'rgba(0,0,0,.3)'); R(0, 2.59, L, 2.62, 'rgba(255,255,255,.18)'); }
          g.beginPath(); g.rect(0, 0, L, H); g.clip();
          g.translate(0, sg.st === 0 ? 2.24 : 1.15); g.scale(0.01, -0.01);
          g.font = (sg.st === 0 ? '700 30px ' : '700 34px ') + '"Barlow Condensed", "Arial Narrow", Arial, sans-serif';
          g.textAlign = 'center'; g.textBaseline = 'alphabetic';
          g.fillStyle = sg.st === 0 ? 'rgba(244,238,220,.95)' : rgba(sg.col, 0.8);
          g.fillText(sg.txt, (sg.n / 2 - sg.i) * 100, 0);
          g.restore();
        }
      }
      if (type === E.WIN || type === E.WOPEN) {
        if (st.cut) { R(0.2, 0.3, 0.8, 0.34, '#6f8894'); }
        else {
          hole(0.2, 0.95, 0.8, 1.95);
          if (type === E.WIN) { R(0.2, 0.95, 0.8, 1.95, 'rgba(38,54,64,.62)'); R(0.22, 1.5, 0.5, 1.93, 'rgba(160,190,200,.10)'); }
          const fc = shade('#cfc9b8', dark);
          R(0.2, 0.95, 0.8, 1.0, fc); R(0.2, 1.9, 0.8, 1.95, fc); R(0.2, 0.95, 0.24, 1.95, fc); R(0.76, 0.95, 0.8, 1.95, fc);
          if (type === E.WIN) { R(0.49, 0.95, 0.51, 1.95, fc); if (st.ext && st.barr) for (let u = 0.28; u < 0.76; u += 0.08) R(u, 1.0, u + 0.012, 1.9, 'rgba(25,25,25,.8)'); }
          else { g.fillStyle = 'rgba(190,210,215,.5)'; g.beginPath(); g.moveTo(0.24, 1.0); g.lineTo(0.36, 1.0); g.lineTo(0.24, 1.25); g.fill(); g.beginPath(); g.moveTo(0.76, 1.9); g.lineTo(0.6, 1.9); g.lineTo(0.76, 1.6); g.fill(); }
          R(0.17, 0.9, 0.83, 0.95, shade('#b9b3a2', dark));
        }
      } else if (type === E.DOOR || type === E.DOPEN || type === E.FRAME) {
        if (st.cut) { hole(0.14, 0, 0.86, 0.34); if (type === E.DOOR) R(0.14, 0, 0.86, 0.12, '#6b4a2c'); }
        else {
          hole(0.14, 0, 0.86, 2.1);
          const fc = shade('#5c4630', dark);
          if (type === E.DOOR) {
            const dc = st.ext ? shade('#6f5032', dark) : shade('#84684a', dark);
            R(0.14, 0, 0.86, 2.1, dc);
            R(0.22, 0.15, 0.78, 0.95, 'rgba(0,0,0,.16)'); R(0.22, 1.1, 0.78, 1.95, 'rgba(0,0,0,.16)');
            R(0.25, 0.2, 0.75, 0.9, 'rgba(255,255,255,.05)'); R(0.25, 1.15, 0.75, 1.9, 'rgba(255,255,255,.05)');
            R(0.74, 0.98, 0.8, 1.06, '#c9b36a');
          }
          R(0.1, 0, 0.14, 2.14, fc); R(0.86, 0, 0.9, 2.14, fc); R(0.1, 2.1, 0.9, 2.16, fc);
        }
      }
    }
    g.restore();
    /* topo e ponta */
    if (type !== E.GRADE && type !== E.GOPEN && type !== E.GATE) {
      const tc = st.cut ? '#2a2623' : shade(type === E.MURO ? '#aaa392' : st.col, 1.1);
      if (o === 0) { poly([P(0, 0, H), P(L, 0, H), P(L, T, H), P(0, T, H)], tc); poly([P(L, 0, 0), P(L, T, 0), P(L, T, H), P(L, 0, H)], shade(st.col, 0.6)); }
      else { poly([P(0, 0, H), P(T, 0, H), P(T, L, H), P(0, L, H)], tc); poly([P(0, L, 0), P(T, L, 0), P(T, L, H), P(0, L, H)], shade(st.col, 0.8)); }
      if (st.cut && (type === E.DOOR || type === E.DOPEN || type === E.FRAME)) { g.globalCompositeOperation = 'destination-out'; if (o === 0) poly([P(0.16, 0, H), P(0.86, 0, H), P(0.86, T, H), P(0.16, T, H)], '#000'); else poly([P(0, 0.28, H), P(T, 0.28, H), P(T, 1.0, H), P(0, 1.0, H)], '#000'); g.globalCompositeOperation = 'source-over'; }
    }
    if (type === E.DOPEN || type === E.GOPEN) {
      const hh = type === E.DOPEN ? (st.cut ? 0.34 : 2.08) : 1.68, c = type === E.DOPEN ? '#7a5a3a' : '#5d666a';
      if (o === 0) this.box(g, P, 0.14, T, 0, 0.2, T + 0.7, hh, c); else this.box(g, P, T, 0.94, 0, T + 0.7, 1.0, hh, c);
    }
    s = { img: cv, ax: ox, ay: oy, w: cw, h: ch };
    this.walls.set(key, s);
    return s;
  },

  /* ---------- telhados ---------- */
  roof(b) {
    if (b._roof) { b._roofUse = G.now; return b._roof; }
    const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1, H = b.levels * LVL_H + (b.roof === 'posto' ? 1.4 : 0);
    const RS = w * h < 140 ? 1.5 : 1, rng = mulberry32(b.seed + 11);
    const o = b.roof === 'telha' || b.roof === 'coreto' ? 0.4 : b.roof === 'zinco' ? 0.3 : 0.12;
    const x0 = -o, y0 = -o, x1 = w + o, y1 = h + o, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const s = Math.min(x1 - x0, y1 - y0) / 2, rh = b.roof === 'telha' ? s * 0.45 : b.roof === 'coreto' ? 1.2 : b.roof === 'zinco' ? s * 0.3 : 0.3;
    const top = P3(x0, y0, H + rh + 1.3), lft = P3(x0, y1, H), rgt = P3(x1, y0, H), bot = P3(x1, y1, b.roof === 'posto' ? 0 : H - 0.3);
    const minx = lft[0] - 3, miny = top[1] - 3, cwid = rgt[0] - minx + 3, chei = bot[1] - miny + 3;
    const [cv, g] = mk(cwid * RS, chei * RS);
    g.scale(RS, RS); g.translate(-minx, -miny); g.lineJoin = 'round';
    const P = P3;
    const poly = (pts, f, st) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = f; g.fill(); if (st) { g.strokeStyle = st; g.lineWidth = 0.7; g.stroke(); } };
    const L2 = (a, c, t) => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t];
    /* água do telhado: e0-e1 beiral, r0-r1 cumeeira */
    const slope = (e0, e1, r0, r1, col, n, kind) => {
      const pts = [e0, e1, r1, r0];
      poly(pts, col);
      g.save(); g.beginPath(); g.moveTo(e0[0], e0[1]); g.lineTo(e1[0], e1[1]); g.lineTo(r1[0], r1[1]); g.lineTo(r0[0], r0[1]); g.closePath(); g.clip();
      const em = L2(e0, e1, 0.5), rm = L2(r0, r1, 0.5), dv = [rm[0] - em[0], rm[1] - em[1]];
      const len = Math.hypot(e1[0] - e0[0], e1[1] - e0[1]);
      g.lineWidth = 0.6;
      const step = kind === 'zinco' ? 5 : 3.2;
      g.strokeStyle = kind === 'zinco' ? 'rgba(0,0,0,.2)' : 'rgba(40,12,6,.3)';
      g.beginPath();
      for (let d = -len; d < len * 2; d += step) { const p = L2(e0, e1, d / len); g.moveTo(p[0], p[1]); g.lineTo(p[0] + dv[0] * 1.3, p[1] + dv[1] * 1.3); }
      g.stroke();
      if (kind !== 'zinco') {
        g.strokeStyle = 'rgba(40,12,6,.2)'; g.beginPath();
        for (let k = 1; k < n; k++) { const a = L2(e0, r0, k / n), c = L2(e1, r1, k / n); const ex = [(c[0] - a[0]), (c[1] - a[1])]; g.moveTo(a[0] - ex[0], a[1] - ex[1]); g.lineTo(c[0] + ex[0], c[1] + ex[1]); }
        g.stroke();
      }
      const bb = [Math.min(e0[0], e1[0], r0[0], r1[0]), Math.min(e0[1], e1[1], r0[1], r1[1]), Math.max(e0[0], e1[0], r0[0], r1[0]), Math.max(e0[1], e1[1], r0[1], r1[1])];
      for (let i = 0; i < len * 0.35; i++) {
        const x = bb[0] + rng() * (bb[2] - bb[0]), y = bb[1] + rng() * (bb[3] - bb[1]), r = rng();
        g.fillStyle = kind === 'zinco' ? (r < 0.5 ? 'rgba(120,60,30,.22)' : 'rgba(0,0,0,.1)') : (r < 0.3 ? 'rgba(50,70,35,.25)' : r < 0.7 ? 'rgba(0,0,0,.14)' : 'rgba(255,200,160,.1)');
        g.beginPath(); g.ellipse(x, y, 2 + rng() * 7, 1 + rng() * 3, 0, 0, 7); g.fill();
      }
      g.restore();
    };
    if (b.roof === 'telha' || b.roof === 'coreto' || b.roof === 'zinco') {
      const base = b.roof === 'zinco' ? ['#8f979c', '#858d92', '#9a9c98'][b.seed % 3] : b.roof === 'coreto' ? '#8f4433' : ['#a5553a', '#96503a', '#ad5f42', '#8e4a38'][b.seed % 4];
      const A = P(x0, y0, H), B = P(x1, y0, H), C = P(x1, y1, H), D = P(x0, y1, H);
      const alongX = (x1 - x0) >= (y1 - y0), hip = b.roof !== 'zinco';
      let R1, R2;
      if (alongX) { const e = hip ? s : 0; R1 = P(x0 + e, cy, H + rh); R2 = P(x1 - e, cy, H + rh); }
      else { const e = hip ? s : 0; R1 = P(cx, y0 + e, H + rh); R2 = P(cx, y1 - e, H + rh); }
      /* forro/beiral escuro */
      poly([D, C, P(x1, y1, H - 0.16), P(x0, y1, H - 0.16)], '#3d2a1c'); poly([B, C, P(x1, y1, H - 0.16), P(x1, y0, H - 0.16)], '#2f2016');
      const n = Math.max(4, Math.round(s * 2.6));
      if (alongX) {
        slope(A, B, R1, R2, shade(base, 0.68), n, b.roof);
        if (hip) slope(D, A, R1, R1, shade(base, 0.6), n, b.roof);
        if (hip) slope(B, C, R2, R2, shade(base, 0.82), n, b.roof); else poly([B, C, R2], shade(b.col, 0.7), 'rgba(0,0,0,.3)');
        slope(D, C, R1, R2, base, n, b.roof);
      } else {
        slope(D, A, R2, R1, shade(base, 0.6), n, b.roof);
        if (hip) slope(A, B, R1, R1, shade(base, 0.68), n, b.roof);
        if (hip) slope(D, C, R2, R2, base, n, b.roof); else poly([D, C, R2], shade(b.col, 0.93), 'rgba(0,0,0,.3)');
        slope(B, C, R1, R2, shade(base, 0.84), n, b.roof);
      }
      g.strokeStyle = shade(base, 0.5); g.lineWidth = 1.6; g.beginPath(); g.moveTo(R1[0], R1[1]); g.lineTo(R2[0], R2[1]);
      if (hip) { for (const [q, r] of [[A, R1], [D, R1], [B, R2], [C, R2]]) { g.moveTo(q[0], q[1]); g.lineTo(r[0], r[1]); } }
      g.stroke();
      if (b.type === 'igreja') { this.box(g, P, cx - 0.08, y1 - 1.2, H + rh, cx + 0.08, y1 - 1.04, H + rh + 1.2, '#d8d2c0'); this.box(g, P, cx - 0.4, y1 - 1.2, H + rh + 0.7, cx + 0.4, y1 - 1.04, H + rh + 0.86, '#d8d2c0'); }
    } else if (b.roof === 'posto') {
      for (const [px, py] of [[1, 1.5], [w - 1.3, 1.5], [1, h - 1.8], [w - 1.3, h - 1.8]]) this.box(g, P, px, py, 0, px + 0.3, py + 0.3, H, '#cfcabb');
      this.box(g, P, x0, y0, H, x1, y1, H + 0.5, '#d9c23a', { top: '#b9b4a6' });
      const a = P(x0, y1, H + 0.14), c = P(x1, y1, H + 0.14), d = P(x1, y1, H + 0.3), e = P(x0, y1, H + 0.3); poly([a, c, d, e], '#2f6a45');
    } else {
      const base = ['#9a968c', '#8f8c84', '#a39e92'][b.seed % 3];
      this.box(g, P, x0, y0, H - 0.05, x1, y1, H + 0.32, shade(b.col, 0.95), { top: shade(base, 1.1) });
      poly([P(x0 + 0.3, y0 + 0.3, H + 0.1), P(x1 - 0.3, y0 + 0.3, H + 0.1), P(x1 - 0.3, y1 - 0.3, H + 0.1), P(x0 + 0.3, y1 - 0.3, H + 0.1)], base, 'rgba(0,0,0,.35)');
      g.save(); g.beginPath(); const q = [P(x0 + 0.3, y0 + 0.3, H + 0.1), P(x1 - 0.3, y0 + 0.3, H + 0.1), P(x1 - 0.3, y1 - 0.3, H + 0.1), P(x0 + 0.3, y1 - 0.3, H + 0.1)];
      g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) g.lineTo(q[i][0], q[i][1]); g.clip();
      for (let i = 0; i < w * h * 0.6; i++) { const p = P(x0 + rng() * (x1 - x0), y0 + rng() * (y1 - y0), H + 0.1); g.fillStyle = rng() < 0.6 ? 'rgba(0,0,0,.1)' : 'rgba(60,80,50,.14)'; g.beginPath(); g.ellipse(p[0], p[1], 3 + rng() * 9, 1.5 + rng() * 4, 0, 0, 7); g.fill(); }
      g.restore();
      const nb = 1 + Math.floor(w * h / 70);
      for (let i = 0; i < nb; i++) { const px = 0.9 + rng() * Math.max(0.1, w - 1.8), py = 0.9 + rng() * Math.max(0.1, h - 1.8); if (rng() < 0.75) { this.box(g, P, px - 0.35, py - 0.35, H + 0.1, px + 0.35, py + 0.35, H + 0.35, '#77736a'); this.cyl(g, P, px, py, H + 0.35, H + 1.15, 0.36, '#2f6aa8'); } else this.box(g, P, px - 0.4, py - 0.3, H + 0.1, px + 0.4, py + 0.3, H + 0.6, '#b9b9b2'); }
      if (rng() < 0.6) { const px = 0.6 + rng() * (w - 1.2), py = 0.6 + rng() * (h - 1.2), a = P(px, py, H + 0.1), c = P(px, py, H + 1.9); g.strokeStyle = '#2b2b2b'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(c[0], c[1]); for (let k = 0; k < 3; k++) { g.moveTo(c[0] - 6 + k, c[1] + 3 + k * 4); g.lineTo(c[0] + 6 - k, c[1] + 3 + k * 4); } g.stroke(); }
    }
    b._roof = { img: cv, dx: isoX(b.x0, b.y0) + minx, dy: isoY(b.x0, b.y0) + miny, w: cwid, h: chei };
    b._roofUse = G.now;
    this.roofs.push(b);
    if (this.roofs.length > 34) { this.roofs.sort((p, q2) => p._roofUse - q2._roofUse); const old = this.roofs.shift(); old._roof = null; }
    return b._roof;
  }
};

/* ---------- modelos dos objetos ---------- */
const MODELS = (function () {
  const B = (x0, y0, z0, x1, y1, z1, c, o) => ['b', x0, y0, z0, x1, y1, z1, c, o];
  const C = (cx, cy, z0, z1, r, c, o) => ['c', cx, cy, z0, z1, r, c, o];
  const S = (cx, cy, cz, r, c) => ['s', cx, cy, cz, r, c];
  const F = (fn, bb, bias) => ['f', fn, bb, bias || 0];
  const legs = (x0, y0, x1, y1, z, c) => [B(x0, y0, 0, x0 + 0.06, y0 + 0.06, z, c), B(x1 - 0.06, y0, 0, x1, y0 + 0.06, z, c), B(x0, y1 - 0.06, 0, x0 + 0.06, y1, z, c), B(x1 - 0.06, y1 - 0.06, 0, x1, y1, z, c)];
  const CARC = ['#7a2f2a', '#8a8f94', '#d2cec4', '#2f4a6a', '#3a3d40', '#b0963a', '#5a6a4a', '#9aa39a'];
  const GL = '#27333b';
  const wheels = (L, yA, yB, xs) => { const o = []; for (const x of xs) { o.push(B(x, yA - 0.05, 0, x + 0.62, yA + 0.12, 0.52, '#18181a'), B(x, yB - 0.12, 0, x + 0.62, yB + 0.05, 0.52, '#18181a')); } return o; };
  const car = (col, cab0, cab1, o) => (v, D) => {
    const c = col || CARC[v % CARC.length], W = 2, L = (o && o.L) || 4, top = (o && o.top) || 1.34;
    const out = wheels(L, 0.2, 1.8, [0.5, L - 1.15]);
    out.push(B(0.15, 0.2, 0.26, L - 0.15, 1.8, 0.82, c), B(cab0, 0.28, 0.82, cab1, 1.72, top, (o && o.cabc) || c));
    out.push(D('py', cab0 + 0.1, cab1 - 0.1, 0.9, top - 0.08, GL, 1.72), D('ny', cab0 + 0.1, cab1 - 0.1, 0.9, top - 0.08, GL, 0.28), D('px', 0.38, 1.62, 0.9, top - 0.08, GL, cab1), D('nx', 0.38, 1.62, 0.9, top - 0.08, GL, cab0));
    out.push(D('px', 0.3, 0.6, 0.5, 0.66, '#e6e0b8', L - 0.15), D('px', 1.4, 1.7, 0.5, 0.66, '#e6e0b8', L - 0.15), D('nx', 0.3, 0.6, 0.5, 0.66, '#8a2a22', 0.15), D('nx', 1.4, 1.7, 0.5, 0.66, '#8a2a22', 0.15));
    out.push(D('py', (cab0 + cab1) / 2, (cab0 + cab1) / 2 + 0.02, 0.3, 0.86, 'rgba(0,0,0,.4)', 1.8), D('ny', (cab0 + cab1) / 2, (cab0 + cab1) / 2 + 0.02, 0.3, 0.86, 'rgba(0,0,0,.4)', 0.2));
    if (o && o.extra) for (const e of o.extra(v, D, c)) out.push(e);
    return out;
  };
  const leaf = (cols, trunkH, blobs) => (v) => { const c = cols[v % cols.length]; const o = [C(0.5, 0.5, 0, trunkH, 0.13, '#5c4632')]; for (const b of blobs) o.push(S(0.5 + b[0], 0.5 + b[1], b[2], b[3], b[4] ? shade(c, b[4]) : c)); return o; };
  const M = {};
  const def = (k, f, vars) => { M[k] = { f, vars: vars || 1 }; };
  const BL = ['#6a7f9a', '#9a5a4a', '#7a8a5a', '#b9a070'];
  def('cama', v => [B(0.06, 0.02, 0, 0.94, 0.1, 0.85, '#5a3d24'), B(0.08, 0.1, 0, 0.92, 1.95, 0.28, '#6b4a2e'), B(0.1, 0.12, 0.28, 0.9, 1.92, 0.46, '#d8d2c2'), B(0.1, 0.75, 0.46, 0.9, 1.92, 0.5, BL[v % 4]), B(0.2, 0.18, 0.46, 0.8, 0.55, 0.57, '#eee9dc')], 4);
  def('cama_casal', v => [B(0.06, 0.02, 0, 1.94, 0.1, 0.9, '#5a3d24'), B(0.08, 0.1, 0, 1.92, 1.95, 0.28, '#6b4a2e'), B(0.1, 0.12, 0.28, 1.9, 1.92, 0.46, '#d8d2c2'), B(0.1, 0.75, 0.46, 1.9, 1.92, 0.5, BL[v % 4]), B(0.2, 0.18, 0.46, 0.9, 0.55, 0.57, '#eee9dc'), B(1.1, 0.18, 0.46, 1.8, 0.55, 0.57, '#eee9dc')], 4);
  def('sofa', v => { const c = ['#6a5a4a', '#5a6a5a', '#7a4a3a', '#4a5568'][v % 4]; return [B(0.1, 0.12, 0, 1.9, 0.38, 0.86, c), B(0.1, 0.38, 0, 1.9, 0.9, 0.4, c), B(0.1, 0.38, 0.4, 0.3, 0.9, 0.6, c), B(1.7, 0.38, 0.4, 1.9, 0.9, 0.6, c), B(0.34, 0.4, 0.4, 0.98, 0.88, 0.47, shade(c, 1.15)), B(1.02, 0.4, 0.4, 1.66, 0.88, 0.47, shade(c, 1.15))]; }, 4);
  def('mesa', () => legs(0.12, 0.12, 0.88, 0.88, 0.66, '#5a4028').concat([B(0.08, 0.08, 0.66, 0.92, 0.92, 0.72, '#7a5a38')]));
  def('cadeira', () => legs(0.3, 0.3, 0.7, 0.7, 0.42, '#5a4028').concat([B(0.28, 0.28, 0.42, 0.72, 0.72, 0.47, '#7a5a38'), B(0.28, 0.28, 0.47, 0.72, 0.33, 0.92, '#6b4c30')]));
  def('geladeira', (v, D) => [B(0.15, 0.1, 0, 0.85, 0.8, 1.72, v ? '#cfd3cf' : '#d9d6c8'), D('py', 0.15, 0.85, 1.12, 1.14, '#8a8f8c', 0.8), D('py', 0.2, 0.24, 0.6, 1.0, '#70757a', 0.8), D('py', 0.2, 0.24, 1.25, 1.55, '#70757a', 0.8), D('py', 0.5, 0.75, 1.3, 1.5, 'rgba(120,60,30,.25)', 0.8)], 2);
  def('fogao', (v, D) => [B(0.15, 0.12, 0, 0.85, 0.82, 0.86, '#e0ded6'), B(0.15, 0.12, 0.86, 0.85, 0.2, 1.0, '#d0cec6'), C(0.33, 0.4, 0.86, 0.89, 0.09, '#222'), C(0.67, 0.4, 0.86, 0.89, 0.09, '#222'), C(0.33, 0.66, 0.86, 0.89, 0.09, '#222'), C(0.67, 0.66, 0.86, 0.89, 0.09, '#222'), D('py', 0.24, 0.76, 0.2, 0.58, '#25282b', 0.82), D('py', 0.22, 0.78, 0.68, 0.72, '#888', 0.82)]);
  def('armario_coz', (v, D) => [B(0.04, 0.1, 0, 0.96, 0.8, 0.86, '#b79868'), B(0.02, 0.08, 0.86, 0.98, 0.84, 0.91, '#8d8f8c'), B(0.04, 0.08, 1.5, 0.96, 0.42, 2.05, '#b79868'), D('py', 0.49, 0.51, 0.05, 0.84, 'rgba(0,0,0,.35)', 0.8), D('py', 0.4, 0.44, 0.5, 0.6, '#ddd', 0.8), D('py', 0.56, 0.6, 0.5, 0.6, '#ddd', 0.8), D('py', 0.49, 0.51, 1.52, 2.03, 'rgba(0,0,0,.35)', 0.42)]);
  def('pia', (v, D) => [B(0.04, 0.1, 0, 0.96, 0.8, 0.86, '#a8a49a'), B(0.02, 0.08, 0.86, 0.98, 0.84, 0.91, '#b9bcba'), B(0.25, 0.25, 0.9, 0.75, 0.7, 0.92, '#5f6466', { flat: 1 }), B(0.47, 0.14, 0.91, 0.53, 0.2, 1.15, '#9aa0a4'), B(0.47, 0.14, 1.12, 0.53, 0.4, 1.17, '#9aa0a4'), D('py', 0.49, 0.51, 0.05, 0.84, 'rgba(0,0,0,.3)', 0.8)]);
  def('filtro', () => [B(0.28, 0.28, 0, 0.72, 0.72, 0.72, '#6b4a2e'), C(0.5, 0.5, 0.72, 1.0, 0.2, '#b5623a'), C(0.5, 0.5, 1.0, 1.24, 0.17, '#c06e44'), C(0.5, 0.5, 1.24, 1.28, 0.1, '#a85a36')]);
  def('guarda_roupa', (v, D) => [B(0.06, 0.1, 0, 0.94, 0.72, 1.95, v ? '#6e4c2c' : '#8a7458'), D('py', 0.49, 0.51, 0.06, 1.9, 'rgba(0,0,0,.45)', 0.72), D('py', 0.42, 0.45, 0.9, 1.1, '#c9b36a', 0.72), D('py', 0.55, 0.58, 0.9, 1.1, '#c9b36a', 0.72)], 2);
  def('comoda', (v, D) => [B(0.1, 0.15, 0, 0.9, 0.75, 0.85, '#7a5a3a'), D('py', 0.14, 0.86, 0.28, 0.3, 'rgba(0,0,0,.4)', 0.75), D('py', 0.14, 0.86, 0.56, 0.58, 'rgba(0,0,0,.4)', 0.75), D('py', 0.45, 0.55, 0.14, 0.18, '#c9b36a', 0.75), D('py', 0.45, 0.55, 0.42, 0.46, '#c9b36a', 0.75), D('py', 0.45, 0.55, 0.7, 0.74, '#c9b36a', 0.75)]);
  def('criado', (v, D) => [B(0.25, 0.2, 0, 0.75, 0.7, 0.55, '#6b4c30'), D('py', 0.3, 0.7, 0.28, 0.3, 'rgba(0,0,0,.4)', 0.7), C(0.5, 0.45, 0.55, 0.7, 0.07, '#d8cfa8')]);
  def('estante', (v, D) => { const o = [B(0.08, 0.12, 0, 0.92, 0.6, 1.75, '#6b4c30')]; const cs = ['#8a3a2a', '#2f5a7a', '#c9b06a', '#4a6a4a', '#d8d2c2', '#5a3a5a']; for (let l = 0; l < 4; l++) { o.push(D('py', 0.12, 0.88, 0.1 + l * 0.42, 0.44 + l * 0.42, '#2a1e14', 0.6)); for (let i = 0; i < 6; i++) if ((i * 7 + l * 3 + v) % 5) o.push(D('py', 0.15 + i * 0.12, 0.25 + i * 0.12, 0.1 + l * 0.42, 0.34 + l * 0.42 + ((i + l) % 3) * 0.03, cs[(i + l * 2 + v) % 6], 0.6, { bias: 7 })); } return o; }, 2);
  def('tv', (v, D) => [B(0.1, 0.2, 0, 0.9, 0.7, 0.5, '#5a4028'), B(0.18, 0.36, 0.5, 0.82, 0.46, 1.02, '#1c1c20'), D('py', 0.22, 0.78, 0.56, 0.98, '#0d1114', 0.46), D('py', 0.3, 0.5, 0.75, 0.95, 'rgba(255,255,255,.06)', 0.46, { bias: 7 })]);
  def('vaso', () => [B(0.3, 0.14, 0, 0.7, 0.3, 0.8, '#eceae4'), B(0.3, 0.3, 0, 0.7, 0.78, 0.4, '#e6e4de'), B(0.34, 0.34, 0.4, 0.66, 0.74, 0.43, '#cfcdc6', { flat: 1 })]);
  def('pia_ban', (v, D) => [B(0.2, 0.1, 0, 0.8, 0.55, 0.8, '#d6d3ca'), B(0.28, 0.16, 0.8, 0.72, 0.5, 0.83, '#b9c0c2', { flat: 1 }), B(0.25, 0.08, 1.1, 0.75, 0.11, 1.7, '#8fa8b4'), D('py', 0.49, 0.51, 0.05, 0.78, 'rgba(0,0,0,.3)', 0.55)]);
  def('prateleira', (v, D) => {
    const o = [B(0.12, 0.3, 0, 0.88, 0.7, 1.6, '#b4b4ac'), B(0.08, 0.2, 0.1, 0.92, 0.8, 0.14, '#9a9a92'), B(0.08, 0.2, 0.58, 0.92, 0.8, 0.62, '#9a9a92'), B(0.08, 0.2, 1.06, 0.92, 0.8, 1.1, '#9a9a92')];
    const cs = ['#b0302a', '#d8b23a', '#2f6a45', '#2f5a8a', '#e2dccb', '#8a4a2a', '#c9662a'];
    for (let l = 0; l < 3; l++) for (let i = 0; i < 5; i++) { if ((i * 5 + l * 7 + v * 3) % 4 === 0) continue; const x = 0.12 + i * 0.155, hgt = 0.2 + ((i + l + v) % 3) * 0.07, c = cs[(i * 3 + l + v) % 7]; o.push(B(x, 0.7, 0.14 + l * 0.48, x + 0.13, 0.79, 0.14 + l * 0.48 + hgt, c, { flat: 1 }), B(x, 0.21, 0.14 + l * 0.48, x + 0.13, 0.3, 0.14 + l * 0.48 + hgt, c, { flat: 1 })); }
    return o;
  }, 3);
  def('arara', v => { const o = [B(0.1, 0.46, 0, 0.16, 0.54, 1.5, '#888'), B(0.84, 0.46, 0, 0.9, 0.54, 1.5, '#888'), B(0.1, 0.47, 1.46, 0.9, 0.53, 1.5, '#999')]; const cs = ['#7a2f3a', '#2f4a6a', '#c9b06a', '#4a6a4a', '#d8d2c2', '#3a3a3a']; for (let i = 0; i < 6; i++) if ((i + v) % 4) o.push(B(0.18 + i * 0.11, 0.32, 0.7 + (i % 2) * 0.1, 0.25 + i * 0.11, 0.68, 1.44, cs[(i + v) % 6])); return o; }, 3);
  def('balcao', (v, D) => [B(0.04, 0.2, 0, 0.96, 0.8, 0.98, v ? '#8a6a48' : '#7c8488'), B(0.02, 0.17, 0.98, 0.98, 0.83, 1.03, v ? '#a88a62' : '#b9bcba'), D('py', 0.08, 0.92, 0.1, 0.9, 'rgba(0,0,0,.12)', 0.8)], 2);
  def('caixa_reg', (v, D) => [B(0.04, 0.2, 0, 0.96, 0.8, 0.9, '#7c8488'), B(0.06, 0.24, 0.9, 0.6, 0.76, 0.93, '#26282a', { flat: 1 }), B(0.66, 0.34, 0.9, 0.92, 0.66, 1.18, '#3a3d40'), D('py', 0.7, 0.88, 1.0, 1.14, '#1f2b22', 0.66)]);
  def('freezer', (v, D) => [B(0.06, 0.15, 0, 0.94, 0.85, 0.88, '#e6e6e2'), B(0.1, 0.19, 0.88, 0.9, 0.81, 0.91, '#55707e', { flat: 1 }), D('py', 0.06, 0.94, 0.5, 0.72, v ? '#b0302a' : '#2f5a8a', 0.85)], 2);
  def('maca', () => legs(0.14, 0.1, 0.86, 1.9, 0.5, '#8a9094').concat([B(0.12, 0.08, 0.5, 0.88, 1.92, 0.56, '#9aa0a4'), B(0.14, 0.1, 0.56, 0.86, 1.9, 0.68, '#c9d6d8'), B(0.2, 0.14, 0.68, 0.8, 0.5, 0.76, '#e6e9e6')]));
  def('arm_med', (v, D) => [B(0.1, 0.12, 0, 0.9, 0.62, 1.8, '#dcdfdb'), D('py', 0.15, 0.85, 0.95, 1.72, '#8fa8b0', 0.62), D('py', 0.49, 0.51, 0.06, 1.74, 'rgba(0,0,0,.35)', 0.62), D('py', 0.28, 0.38, 1.2, 1.5, '#2e7a4f', 0.62, { bias: 7 }), D('py', 0.23, 0.43, 1.31, 1.39, '#2e7a4f', 0.62, { bias: 7 }), D('py', 0.6, 0.72, 1.05, 1.3, '#d8b23a', 0.62, { bias: 7 })]);
  def('arm_armas', (v, D) => [B(0.1, 0.12, 0, 0.9, 0.62, 1.9, '#4a5258'), D('py', 0.49, 0.51, 0.06, 1.85, 'rgba(0,0,0,.5)', 0.62), D('py', 0.4, 0.44, 0.85, 1.05, '#b9b9b0', 0.62), D('py', 0.15, 0.45, 1.5, 1.8, 'rgba(0,0,0,.25)', 0.62), D('py', 0.55, 0.85, 1.5, 1.8, 'rgba(0,0,0,.25)', 0.62)]);
  def('escrivaninha', (v, D) => [B(0.08, 0.16, 0, 0.3, 0.8, 0.72, '#6b4c30'), B(0.7, 0.16, 0, 0.92, 0.8, 0.72, '#6b4c30'), B(0.05, 0.14, 0.72, 0.95, 0.84, 0.77, '#7d5c3a'), B(0.3, 0.3, 0.77, 0.56, 0.6, 0.79, '#e6e2d4', { flat: 1 }), B(0.6, 0.28, 0.77, 0.86, 0.38, 1.1, '#2a2c2e'), D('py', 0.72, 0.9, 0.4, 0.42, 'rgba(0,0,0,.4)', 0.8)]);
  def('arquivo', (v, D) => [B(0.25, 0.2, 0, 0.75, 0.75, 1.3, '#7f878c'), D('py', 0.28, 0.72, 0.42, 0.44, 'rgba(0,0,0,.4)', 0.75), D('py', 0.28, 0.72, 0.85, 0.87, 'rgba(0,0,0,.4)', 0.75), D('py', 0.44, 0.56, 0.2, 0.24, '#d0d0c8', 0.75), D('py', 0.44, 0.56, 0.62, 0.66, '#d0d0c8', 0.75), D('py', 0.44, 0.56, 1.05, 1.09, '#d0d0c8', 0.75)]);
  def('carteira', () => legs(0.25, 0.18, 0.75, 0.55, 0.62, '#6f777c').concat([B(0.22, 0.15, 0.62, 0.78, 0.58, 0.67, '#b9a070'), B(0.3, 0.62, 0.38, 0.7, 0.9, 0.42, '#6b8a6a'), B(0.3, 0.86, 0.42, 0.7, 0.9, 0.8, '#6b8a6a')]));
  def('caixote', (v, D) => [B(0.14, 0.14, 0, 0.86, 0.86, 0.7, v ? '#a07a48' : '#8f7450'), D('py', 0.14, 0.86, 0.22, 0.25, 'rgba(0,0,0,.35)', 0.86), D('py', 0.14, 0.86, 0.46, 0.49, 'rgba(0,0,0,.35)', 0.86), D('px', 0.14, 0.86, 0.22, 0.25, 'rgba(0,0,0,.35)', 0.86), D('px', 0.14, 0.86, 0.46, 0.49, 'rgba(0,0,0,.35)', 0.86), D('py', 0.2, 0.26, 0.02, 0.68, 'rgba(0,0,0,.2)', 0.86), D('py', 0.74, 0.8, 0.02, 0.68, 'rgba(0,0,0,.2)', 0.86)], 2);
  def('pallet', v => [B(0.08, 0.08, 0, 0.92, 0.92, 0.14, '#8a6a42'), B(0.12, 0.12, 0.14, 0.52, 0.5, 0.52, '#b08a5a'), B(0.52, 0.12, 0.14, 0.9, 0.5, 0.5, '#a88252'), B(0.12, 0.5, 0.14, 0.9, 0.9, 0.56, '#b89462'), B(0.2, 0.2, 0.56, 0.7, 0.8, v ? 0.95 : 1.15, '#ad8858')], 2);
  def('tambor', v => [C(0.5, 0.5, 0, 0.9, 0.3, ['#2f5a8a', '#8a3a2a', '#4a5a3a'][v % 3]), C(0.5, 0.5, 0.9, 0.92, 0.26, '#3a3a3a')], 3);
  def('tambor_fogo', () => [C(0.5, 0.5, 0, 0.9, 0.3, '#5a3a2a', { top: '#1a0f08' }), F((g, P) => { const p = P(0.5, 0.5, 0.95); const gr = g.createRadialGradient(p[0], p[1], 1, p[0], p[1] - 6, 16); gr.addColorStop(0, 'rgba(255,230,150,.95)'); gr.addColorStop(0.4, 'rgba(255,140,40,.8)'); gr.addColorStop(1, 'rgba(200,40,10,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(p[0] - 9, p[1] + 2); g.quadraticCurveTo(p[0] - 10, p[1] - 12, p[0] - 3, p[1] - 22); g.quadraticCurveTo(p[0] + 1, p[1] - 12, p[0] + 5, p[1] - 26); g.quadraticCurveTo(p[0] + 11, p[1] - 10, p[0] + 9, p[1] + 2); g.fill(); }, [0.2, 0.2, 0.9, 0.8, 0.8, 1.8], 5)]);
  def('pneus', () => [C(0.5, 0.5, 0, 0.2, 0.32, '#1c1c1e', { top: '#101012' }), C(0.52, 0.48, 0.2, 0.4, 0.32, '#222224', { top: '#101012' }), C(0.48, 0.52, 0.4, 0.6, 0.32, '#1c1c1e', { top: '#0c0c0e' })]);
  def('bancada', (v, D) => legs(0.06, 0.16, 0.94, 0.8, 0.82, '#5a5e62').concat([B(0.03, 0.13, 0.82, 0.97, 0.83, 0.9, '#6b5a44'), B(0.1, 0.3, 0.3, 0.9, 0.7, 0.34, '#5a5e62'), B(0.15, 0.3, 0.9, 0.35, 0.5, 1.05, '#8a2a22'), B(0.5, 0.25, 0.9, 0.85, 0.4, 0.96, '#3a3d40'), B(0.03, 0.13, 0.9, 0.97, 0.17, 1.6, '#7a7468'), D('py', 0.2, 0.26, 1.1, 1.5, '#aab', 0.17), D('py', 0.4, 0.44, 1.05, 1.5, '#a55', 0.17), D('py', 0.6, 0.72, 1.2, 1.45, '#888', 0.17)]));
  def('mesa_bar', () => [C(0.5, 0.5, 0, 0.66, 0.05, '#c9c9c0'), B(0.14, 0.14, 0.66, 0.86, 0.86, 0.71, '#d6b52c')]);
  def('cad_bar', v => legs(0.32, 0.32, 0.68, 0.68, 0.4, v ? '#b0302a' : '#d6b52c').concat([B(0.3, 0.3, 0.4, 0.7, 0.7, 0.44, v ? '#b0302a' : '#d6b52c'), B(0.3, 0.3, 0.44, 0.7, 0.35, 0.8, v ? '#b0302a' : '#d6b52c')]), 2);
  def('sinuca', () => legs(0.2, 0.16, 1.8, 0.84, 0.4, '#3d2818').concat([B(0.1, 0.08, 0.4, 1.9, 0.92, 0.8, '#5a3a22'), B(0.2, 0.18, 0.8, 1.8, 0.82, 0.82, '#2f6a45', { flat: 1 }), C(0.7, 0.5, 0.82, 0.86, 0.035, '#e6e0d0'), C(1.3, 0.4, 0.82, 0.86, 0.035, '#b0302a'), C(1.4, 0.6, 0.82, 0.86, 0.035, '#d6b52c')]));
  def('banco_igreja', () => [B(0.08, 0.3, 0, 0.14, 0.8, 0.45, '#5a3d24'), B(1.86, 0.3, 0, 1.92, 0.8, 0.45, '#5a3d24'), B(0.06, 0.3, 0.42, 1.94, 0.8, 0.48, '#6b4a2e'), B(0.06, 0.24, 0.48, 1.94, 0.32, 0.95, '#6b4a2e')]);
  def('altar', () => [B(0.2, 0.2, 0, 1.8, 0.8, 0.98, '#e6e0d0'), B(0.15, 0.15, 0.98, 1.85, 0.85, 1.02, '#f1ece0'), B(0.96, 0.45, 1.02, 1.04, 0.53, 1.75, '#7a5a30'), B(0.75, 0.46, 1.45, 1.25, 0.52, 1.52, '#7a5a30'), C(0.4, 0.5, 1.02, 1.25, 0.04, '#e8e0c0'), C(1.6, 0.5, 1.02, 1.25, 0.04, '#e8e0c0')]);
  def('lixeira', v => [C(0.5, 0.5, 0, 0.85, 0.26, v ? '#4a6a52' : '#5a5e62'), C(0.5, 0.5, 0.85, 0.9, 0.28, '#3a3d40')], 2);
  def('saco_lixo', v => [S(0.42, 0.5, 0.2, 0.3, '#1e1e22'), S(0.66, 0.6, 0.16, 0.24, v ? '#2a2a30' : '#3a4a5a'), S(0.5, 0.35, 0.14, 0.2, '#16161a')], 2);
  def('orelhao', () => [C(0.5, 0.45, 0, 1.25, 0.06, '#5a6268'), S(0.5, 0.5, 1.6, 0.44, '#c96a26'), F((g, P) => { const p = P(0.56, 0.62, 1.48); g.fillStyle = '#1a1612'; g.beginPath(); g.ellipse(p[0], p[1], 11, 12, 0.3, 0, 7); g.fill(); g.fillStyle = '#3a4a5a'; g.fillRect(p[0] - 4, p[1] - 5, 7, 10); }, [0.3, 0.3, 1.2, 0.8, 0.9, 1.9], 30)]);
  def('banco_praca', () => [B(0.15, 0.3, 0, 0.3, 0.7, 0.4, '#9a968c'), B(1.7, 0.3, 0, 1.85, 0.7, 0.4, '#9a968c'), B(0.08, 0.26, 0.4, 1.92, 0.74, 0.47, '#6b5a40'), B(0.08, 0.26, 0.47, 1.92, 0.32, 0.85, '#6b5a40')]);
  def('poste', () => [C(0.5, 0.5, 0, 5.2, 0.075, '#8f8c84'), B(0.1, 0.46, 4.7, 0.9, 0.54, 4.8, '#5a4a3a'), B(0.46, 0.46, 4.2, 0.54, 1.3, 4.28, '#77756e'), B(0.4, 1.1, 4.1, 0.6, 1.4, 4.2, '#b9b9a8'), F((g, P) => { g.strokeStyle = 'rgba(20,20,20,.55)'; g.lineWidth = 0.7; for (const s of [0.12, 0.88]) { const a = P(s, 0.5, 4.8), b = P(s + 2.2, 0.5 - 0.4, 4.45); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }, [0, 0, 4.2, 3, 1, 5], 40)]);
  def('ponto_onibus', (v, D) => [B(0.1, 0.15, 0, 0.18, 0.23, 2.2, '#5a6268'), B(2.82, 0.15, 0, 2.9, 0.23, 2.2, '#5a6268'), B(0.1, 0.12, 0.9, 2.9, 0.16, 2.1, '#6f8a94', { a: 0.5 }), B(0.3, 0.3, 0.4, 2.7, 0.6, 0.46, '#6b5a40'), B(0, 0.05, 2.2, 3, 0.95, 2.3, '#b0302a')]);
  def('mangueira', leaf(['#3f5a36', '#465f33', '#39502f'], 1.5, [[0, 0, 2.5, 1.15], [-0.7, 0.3, 2.2, 0.8, 0.9], [0.6, -0.5, 2.3, 0.85, 0.92], [0.3, 0.7, 2.1, 0.8, 1.05], [0, 0, 3.4, 0.8, 1.08], [-0.5, -0.5, 2.9, 0.7, 0.85]]), 3);
  def('ipe', leaf(['#d2b23a', '#c9a832', '#9a6aa8', '#c98aa0'], 1.9, [[0, 0, 2.7, 0.8], [-0.5, 0.2, 2.5, 0.55, 0.92], [0.5, -0.3, 2.6, 0.6, 0.95], [0.2, 0.5, 2.4, 0.5, 1.06], [0, -0.1, 3.3, 0.55, 1.08]]), 4);
  def('coqueiro', v => [C(0.5, 0.5, 0, 1.2, 0.11, '#7a6a52'), C(0.56, 0.5, 1.2, 2.4, 0.1, '#7a6a52'), C(0.66, 0.5, 2.4, 3.6, 0.09, '#746450'), C(0.8, 0.5, 3.6, 4.6, 0.08, '#6e5e4a'),
    F((g, P, rng) => { const c = P(0.8, 0.5, 4.6); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + 0.3, dx = Math.cos(a) * 38, dy = Math.sin(a) * 15 + 16; g.strokeStyle = i % 2 ? '#4a6a38' : '#3d5a30'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(c[0], c[1]); g.quadraticCurveTo(c[0] + dx * 0.6, c[1] + dy * 0.2 - 14, c[0] + dx, c[1] + dy); g.stroke(); g.lineWidth = 0.8; g.strokeStyle = '#5a7a44'; for (let k = 1; k < 7; k++) { const t = k / 7, x = c[0] + dx * t, y = c[1] + (dy * t * t) - 14 * 2 * t * (1 - t) * 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rng() - 0.5) * 6, y + 5 + rng() * 4); g.stroke(); } } g.fillStyle = '#5a4a2a'; g.beginPath(); g.arc(c[0] + 2, c[1] + 4, 3, 0, 7); g.arc(c[0] - 3, c[1] + 5, 3, 0, 7); g.fill(); }, [-0.6, -0.6, 3.8, 2.2, 1.6, 5.4], 20)]);
  def('bananeira', () => [C(0.5, 0.5, 0, 1.1, 0.1, '#6a7a42'), F((g, P) => { const c = P(0.5, 0.5, 1.1); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + 0.5, dx = Math.cos(a) * 26, dy = Math.sin(a) * 11 - 12; g.fillStyle = i % 2 ? '#4f7038' : '#5c7f40'; g.beginPath(); g.moveTo(c[0], c[1]); g.quadraticCurveTo(c[0] + dx * 0.3 - dy * 0.3, c[1] + dy - 12, c[0] + dx, c[1] + dy + 10); g.quadraticCurveTo(c[0] + dx * 0.5 + dy * 0.2, c[1] + dy * 0.2, c[0], c[1]); g.fill(); g.strokeStyle = 'rgba(20,40,10,.4)'; g.lineWidth = 0.6; g.stroke(); } }, [-0.3, -0.3, 0.8, 1.3, 1.3, 2.2], 20)]);
  def('arbusto', v => [S(0.4, 0.5, 0.3, 0.38, '#4a5f38'), S(0.66, 0.44, 0.26, 0.3, '#55683c'), S(0.52, 0.66, 0.2, 0.26, v ? '#5f6f42' : '#4f6436')], 2);
  def('capim', () => [F((g, P, rng) => { for (let i = 0; i < 26; i++) { const p = P(0.15 + rng() * 0.7, 0.15 + rng() * 0.7, 0); g.strokeStyle = ['#6f7a44', '#5d6b3a', '#84864e', '#4f5f34'][i % 4]; g.lineWidth = 0.9; g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + (rng() - 0.5) * 4, p[1] - 8, p[0] + (rng() - 0.5) * 10, p[1] - 12 - rng() * 12); g.stroke(); } }, [0, 0, 0, 1, 1, 0.8])]);
  def('carro_a', car(null, 0.5, 2.7), 8);
  def('carro_b', car(null, 1.05, 2.75), 8);
  def('kombi', car(null, 0.2, 3.8, { top: 1.85, cabc: '#e2ddd0' }), 8);
  def('pickup', car(null, 2.7, 4.0, { L: 5, top: 1.4, extra: (v, D, c) => [B(0.28, 0.32, 0.82, 2.6, 1.68, 0.84, '#26221e', { flat: 1 }), B(0.15, 0.2, 0.82, 2.65, 0.3, 1.0, c), B(0.15, 1.7, 0.82, 2.65, 1.8, 1.0, c), B(0.15, 0.2, 0.82, 0.25, 1.8, 1.0, c)] }), 8);
  def('viatura', car('#d8d6cc', 1.05, 2.75, { extra: (v, D) => [B(1.8, 0.5, 1.34, 2.0, 1.0, 1.44, '#b02a2a'), B(1.8, 1.0, 1.34, 2.0, 1.5, 1.44, '#2a4ab0'), D('py', 0.3, 3.7, 0.42, 0.62, '#1d2f4a', 1.8), D('ny', 0.3, 3.7, 0.42, 0.62, '#1d2f4a', 0.2)] }));
  def('ambulancia', car('#e2e0d8', 0.2, 3.6, { L: 5, top: 2.0, extra: (v, D) => [B(3.6, 0.28, 0.82, 4.5, 1.72, 1.45, '#e2e0d8'), D('px', 0.4, 1.6, 0.92, 1.38, GL, 4.5), B(3.3, 0.5, 2.0, 3.5, 1.5, 2.1, '#c2531e'), D('py', 0.3, 4.4, 0.5, 0.68, '#c2531e', 1.8), D('ny', 0.3, 4.4, 0.5, 0.68, '#c2531e', 0.2), D('py', 1.4, 1.7, 1.2, 1.7, '#2e7a4f', 1.72, { bias: 8 }), D('py', 1.25, 1.85, 1.38, 1.52, '#2e7a4f', 1.72, { bias: 8 })] }));
  def('queimado', (v, D) => { const c = '#2a2420'; return wheels(4, 0.2, 1.8, [0.5, 2.85]).concat([B(0.15, 0.2, 0.2, 3.85, 1.8, 0.78, c), B(1.05, 0.28, 0.78, 2.75, 1.72, 1.25, '#3a2a20'), D('py', 1.15, 2.65, 0.86, 1.18, '#0c0a08', 1.72), D('px', 0.38, 1.62, 0.86, 1.18, '#0c0a08', 2.75), D('ny', 1.15, 2.65, 0.86, 1.18, '#0c0a08', 0.28), D('nx', 0.38, 1.62, 0.86, 1.18, '#0c0a08', 1.05), D('py', 0.4, 1.0, 0.3, 0.6, 'rgba(140,70,30,.5)', 1.8), D('py', 2.6, 3.4, 0.4, 0.7, 'rgba(140,70,30,.4)', 1.8)]); });
  def('onibus', (v, D) => { const c = ['#c9a22a', '#2f5a8a', '#b0302a'][v % 3]; const o = wheels(9, 0.3, 2.7, [1.2, 6.6]).concat([B(0.2, 0.3, 0.35, 8.8, 2.7, 1.35, c), B(0.2, 0.3, 1.35, 8.8, 2.7, 2.85, '#d8d4c8')]); for (let i = 0; i < 7; i++) { o.push(D('py', 0.6 + i * 1.12, 1.55 + i * 1.12, 1.55, 2.45, GL, 2.7), D('ny', 0.6 + i * 1.12, 1.55 + i * 1.12, 1.55, 2.45, GL, 0.3)); } o.push(D('px', 0.5, 2.5, 1.3, 2.5, GL, 8.8), D('nx', 0.5, 2.5, 1.6, 2.5, GL, 0.2), D('px', 0.6, 2.4, 2.55, 2.78, '#1a1a1a', 8.8, { bias: 8 }), D('py', 7.6, 8.4, 0.5, 2.4, 'rgba(0,0,0,.25)', 2.7, { bias: 8 }), D('py', 0.2, 8.8, 1.0, 1.2, '#f1ece0', 2.7)); return o; }, 3);
  def('caminhao', (v, D) => wheels(7, 0.35, 2.65, [0.8, 1.6, 5.6]).concat([B(0.2, 0.4, 0.5, 6.8, 2.6, 0.9, '#2a2a2c'), B(0.2, 0.3, 0.9, 5.0, 2.7, 3.0, v ? '#c9c6bd' : '#a8b0a0'), B(5.25, 0.4, 0.9, 6.8, 2.6, 2.45, ['#8a3a2a', '#2f5a7a'][v % 2]), D('px', 0.6, 2.4, 1.5, 2.3, GL, 6.8), D('py', 5.5, 6.6, 1.5, 2.3, GL, 2.6), D('ny', 5.5, 6.6, 1.5, 2.3, GL, 0.4), D('py', 0.4, 4.8, 1.2, 1.3, 'rgba(0,0,0,.2)', 2.7), D('nx', 0.5, 2.5, 1.0, 2.9, 'rgba(0,0,0,.15)', 0.2)]), 2);
  def('conteiner', (v, D) => { const c = ['#8a3a2a', '#2f5a7a', '#6a7a3a', '#a8862a'][v % 4]; const o = [B(0.1, 0.1, 0, 4.9, 1.9, 2.5, c)]; for (let i = 0; i < 16; i++) { o.push(D('py', 0.2 + i * 0.29, 0.26 + i * 0.29, 0.1, 2.4, 'rgba(0,0,0,.2)', 1.9), D('ny', 0.2 + i * 0.29, 0.26 + i * 0.29, 0.1, 2.4, 'rgba(0,0,0,.2)', 0.1)); } for (let i = 0; i < 6; i++) { o.push(D('px', 0.2 + i * 0.29, 0.26 + i * 0.29, 0.1, 2.4, 'rgba(0,0,0,.2)', 4.9), D('nx', 0.2 + i * 0.29, 0.26 + i * 0.29, 0.1, 2.4, 'rgba(0,0,0,.2)', 0.1)); } o.push(D('py', 1.0, 2.4, 0.6, 1.5, 'rgba(120,60,30,.3)', 1.9, { bias: 8 })); return o; }, 4);
  def('tumulo', v => [B(0.15, 0.2, 0, 0.85, 1.85, 0.34, v ? '#b9b6ac' : '#a8a498'), B(0.2, 0.1, 0, 0.8, 0.22, 0.95, '#c4c1b6'), B(0.46, 0.12, 0.95, 0.54, 0.2, 1.4, '#c4c1b6'), B(0.32, 0.12, 1.15, 0.68, 0.2, 1.23, '#c4c1b6')], 2);
  def('cruz', () => [B(0.45, 0.45, 0, 0.55, 0.55, 1.25, '#d2cec2'), B(0.2, 0.46, 0.82, 0.8, 0.54, 0.92, '#d2cec2'), B(0.3, 0.3, 0, 0.7, 0.7, 0.12, '#9a968c')]);
  def('gol', () => [C(0.5, 0.2, 0, 2.2, 0.05, '#e6e2d6'), C(0.5, 3.8, 0, 2.2, 0.05, '#e6e2d6'), B(0.45, 0.2, 2.15, 0.55, 3.8, 2.23, '#e6e2d6')]);
  def('barraca', v => [F((g, P) => { const c = ['#4a6a8a', '#b0662a', '#5a7a4a'][v % 3]; const a = P(0.2, 1, 1.3), b = P(1.8, 1, 1.3), p1 = P(0.2, 1.9, 0), p2 = P(1.8, 1.9, 0), p3 = P(1.8, 0.1, 0), p4 = P(0.2, 0.1, 0); const poly = (pts, f) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = f; g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 0.6; g.stroke(); }; poly([p4, p3, b, a], shade(c, 0.6)); poly([p3, p2, b], shade(c, 0.72)); poly([p1, p2, b, a], c); const d1 = P(1.8, 0.8, 0), d2 = P(1.8, 1.25, 0); poly([d1, d2, b], '#15130f'); }, [0.1, 0.1, 0, 1.9, 1.9, 1.4])], 3);
  def('sacos_areia', () => [B(0.05, 0.2, 0, 0.5, 0.8, 0.28, '#a8997a'), B(0.5, 0.2, 0, 0.95, 0.8, 0.28, '#9f9072'), B(0.2, 0.22, 0.28, 0.72, 0.78, 0.56, '#ad9e80'), B(0.05, 0.24, 0.56, 0.5, 0.76, 0.82, '#a39476'), B(0.5, 0.24, 0.56, 0.95, 0.76, 0.82, '#a8997a')]);
  def('cavalete', (v, D) => [B(0.1, 0.4, 0, 0.16, 0.6, 1.0, '#5a5e62'), B(0.84, 0.4, 0, 0.9, 0.6, 1.0, '#5a5e62'), B(0.05, 0.46, 0.62, 0.95, 0.54, 0.95, '#d6b52c'), D('py', 0.15, 0.3, 0.62, 0.95, '#1e1e1e', 0.54), D('py', 0.45, 0.6, 0.62, 0.95, '#1e1e1e', 0.54), D('py', 0.75, 0.9, 0.62, 0.95, '#1e1e1e', 0.54)]);
  def('botijao', () => [C(0.5, 0.5, 0, 0.42, 0.17, '#5f7f9a'), C(0.5, 0.5, 0.42, 0.55, 0.09, '#4a6a84')]);
  def('caixa_dagua', () => [B(0.2, 0.2, 0, 0.8, 0.8, 0.3, '#77736a'), C(0.5, 0.5, 0.3, 1.1, 0.4, '#2f6aa8'), C(0.5, 0.5, 1.1, 1.16, 0.34, '#285c94')]);
  def('varal', v => { const o = [B(0.1, 0.46, 0, 0.16, 0.54, 1.7, '#77756e'), B(1.84, 0.46, 0, 1.9, 0.54, 1.7, '#77756e'), B(0.1, 0.49, 1.64, 1.9, 0.51, 1.66, '#c9c9c0', { flat: 1 })]; const cs = ['#d8d2c2', '#7a2f3a', '#2f5a8a', '#c9b23a', '#5a7a5a']; for (let i = 0; i < 5; i++) if ((i + v) % 3) o.push(B(0.25 + i * 0.3, 0.48, 1.0 + (i % 2) * 0.15, 0.48 + i * 0.3, 0.52, 1.64, cs[(i + v) % 5], { flat: 1 })); return o; }, 3);
  def('bomba', (v, D) => [B(0.2, 0.25, 0, 0.8, 0.75, 0.12, '#77736a'), B(0.28, 0.3, 0.12, 0.72, 0.7, 1.55, '#d6d0c0'), D('py', 0.32, 0.68, 0.95, 1.4, '#1f2b22', 0.7), D('py', 0.28, 0.72, 0.5, 0.8, '#d9c23a', 0.7), D('px', 0.34, 0.66, 0.5, 0.8, '#2f6a45', 0.72), B(0.74, 0.45, 0.4, 0.78, 0.55, 1.1, '#1a1a1a')]);
  def('carrinho', () => legs(0.25, 0.2, 0.75, 0.85, 0.4, '#8a8f94').concat([B(0.25, 0.2, 0.4, 0.75, 0.85, 0.44, '#9aa0a4'), B(0.25, 0.2, 0.44, 0.75, 0.85, 0.9, '#b9bec4', { a: 0.45 })]));
  def('bicicleta', () => [F((g, P) => { const a = P(0.25, 0.5, 0.02), b = P(0.8, 0.5, 0.02); g.strokeStyle = '#1e1e1e'; g.lineWidth = 1.3; for (const c of [a, b]) { g.beginPath(); g.ellipse(c[0], c[1], 9, 4.5, 0, 0, 7); g.stroke(); } g.strokeStyle = '#8a2f2a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo((a[0] + b[0]) / 2, a[1] - 4); g.lineTo(b[0], b[1]); g.moveTo((a[0] + b[0]) / 2, a[1] - 4); g.lineTo(b[0] - 4, b[1] - 7); g.stroke(); }, [0, 0.2, 0, 1, 0.8, 0.3])]);
  def('horta', () => { const o = []; for (let i = 0; i < 3; i++) { o.push(B(0.15, 0.2 + i * 0.6, 0, 1.85, 0.6 + i * 0.6, 0.1, '#5f3d28')); for (let k = 0; k < 5; k++) o.push(S(0.35 + k * 0.33, 0.4 + i * 0.6, 0.16, 0.11, (k + i) % 3 ? '#557a3a' : '#6a8a42')); } return o; });
  def('fonte', () => [C(1.5, 1.5, 0, 0.42, 1.3, '#a8a498', { top: '#3a4238' }), C(1.5, 1.5, 0.3, 0.9, 0.2, '#b9b6ac'), C(1.5, 1.5, 0.9, 0.98, 0.5, '#b0aca0', { top: '#4a5248' })]);
  def('coreto', () => [C(0.5, 0.5, 0, 2.7, 0.08, '#e2dccb')]);
  def('fogueira', () => [C(0.5, 0.5, 0, 0.1, 0.34, '#77736a', { top: '#1a120c' }), B(0.3, 0.44, 0.1, 0.72, 0.54, 0.2, '#3d2818'), B(0.45, 0.28, 0.1, 0.55, 0.72, 0.22, '#33200f'), F((g, P) => { const p = P(0.5, 0.5, 0.25); const gr = g.createRadialGradient(p[0], p[1], 1, p[0], p[1] - 5, 15); gr.addColorStop(0, 'rgba(255,230,150,.95)'); gr.addColorStop(0.45, 'rgba(255,130,40,.8)'); gr.addColorStop(1, 'rgba(200,40,10,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(p[0] - 8, p[1] + 2); g.quadraticCurveTo(p[0] - 8, p[1] - 10, p[0] - 2, p[1] - 20); g.quadraticCurveTo(p[0] + 2, p[1] - 10, p[0] + 5, p[1] - 22); g.quadraticCurveTo(p[0] + 10, p[1] - 8, p[0] + 8, p[1] + 2); g.fill(); }, [0.2, 0.2, 0.2, 0.8, 0.8, 1.2], 5)]);
  def('arquibancada', () => [B(0.05, 0.1, 0, 3.95, 0.4, 1.2, '#8f8c84'), B(0.05, 0.4, 0, 3.95, 0.65, 0.8, '#99968c'), B(0.05, 0.65, 0, 3.95, 0.92, 0.4, '#a39f94')]);
  def('placa_q', () => [B(0.2, 0.46, 0, 0.28, 0.54, 2.2, '#5a5e62'), B(1.72, 0.46, 0, 1.8, 0.54, 2.2, '#5a5e62'), B(0.08, 0.45, 1.2, 1.92, 0.55, 2.15, '#d9c23a'),
    F((g, P) => { const a = P(0.12, 0.56, 2.1), b = P(1.88, 0.56, 2.1), c = P(0.12, 0.56, 1.25); g.save(); g.transform((b[0] - a[0]) / 100, (b[1] - a[1]) / 100, (c[0] - a[0]) / 40, (c[1] - a[1]) / 40, a[0], a[1]); g.fillStyle = '#1a1a1a'; g.textAlign = 'center'; g.font = '700 14px "Barlow Condensed", Arial, sans-serif'; g.fillText('ÁREA DE', 50, 15); g.font = '700 17px "Barlow Condensed", Arial, sans-serif'; g.fillText('QUARENTENA', 50, 33); g.restore(); }, [0.1, 0.5, 1.2, 1.9, 0.6, 2.2], 30)]);
  return M;
})();

/* ---------- pessoas e zumbis (esqueleto simples, qualquer direção) ---------- */
const PAL_SHIRT = ['#c9b23a', '#d8d2c2', '#3a5a8a', '#7a2f2a', '#4a6a4a', '#8a8a8a', '#2a2a30', '#b0662a', '#6a4a7a', '#3f7f6a'];
const PAL_PANTS = ['#2f3a52', '#3a3a3a', '#5a4a3a', '#44505a', '#6a6a5a'];
const PAL_ZSKIN = ['#84917a', '#8a927e', '#74826c', '#93927a', '#7c8a84'];
const PAL_HAIR = ['#1e1814', '#3a2a1c', '#5a5048', '#141414', '#7a6a50'];
function drawHuman(g, x, y, a, o) {
  const bx = isoX(x, y), by = isoY(x, y);
  const fx = Math.cos(a), fy = Math.sin(a), rx = -fy, ry = fx;
  const sc = o.sc || 1, fall = o.fall || 0, fat = o.fat || 1;
  const J = (f, s, u) => {
    if (fall) { f = f - u * fall * 0.95; u = u * (1 - fall) + 0.08 * fall; }
    const dx = (fx * f + rx * s) * sc, dy = (fy * f + ry * s) * sc;
    return [bx + (dx - dy) * HW, by + (dx + dy) * HH - u * sc * ZS, dx + dy];
  };
  const pal = o.pal, zb = o.pose === 'zombie';
  const cr = o.crouch ? 0.78 : 1, hipU = 0.88 * cr, lean = (o.lean || 0) + (o.crouch ? 0.12 : 0);
  const shU = 1.4 * cr - (zb ? 0.05 : 0), headU = shU + 0.2;
  const wk = o.walk || 0, mv = o.mv || 0, sw = Math.sin(wk) * mv;
  const OUT = 'rgba(18,14,10,.85)';
  const limb = (p, q, r, w, col) => {
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); if (r) g.lineTo(r[0], r[1]);
    g.strokeStyle = OUT; g.lineWidth = (w + 1.5) * sc; g.stroke();
    g.strokeStyle = col; g.lineWidth = w * sc; g.stroke();
  };
  /* pernas */
  const legs = [];
  for (const sg of [-1, 1]) {
    const ph = sg * sw, lift = Math.max(0, sg * Math.cos(wk)) * 0.1 * mv;
    const stiff = o.drag && sg > 0 ? 0.3 : 1;
    const hip = J(0, sg * 0.1 * fat, hipU), foot = J(ph * 0.27 * stiff, sg * 0.1 * fat, lift * stiff), knee = J(ph * 0.14 * stiff + 0.07, sg * 0.105 * fat, hipU * 0.52 + lift * 0.5);
    const toe = J(ph * 0.27 * stiff + 0.11, sg * 0.1 * fat, lift * stiff);
    legs.push({ d: foot[2], hip, knee, foot, toe });
  }
  legs.sort((p, q) => p.d - q.d);
  for (const l of legs) { limb(l.hip, l.knee, l.foot, 4.6 * fat, pal.pants); limb(l.foot, l.toe, null, 3.6, pal.shoe || '#231d18'); }
  /* braços */
  const arms = [];
  const p = o.sw >= 0 ? o.sw : -1;
  for (const sg of [-1, 1]) {
    const sh = J(lean, sg * 0.2 * fat, shU);
    let hf = lean + 0.04 - sg * sw * 0.2, hs = sg * 0.25 * fat, hu = hipU * 0.96, tip = null;
    if (zb) { hf = 0.42 + Math.sin(wk * 0.5 + sg) * 0.05 + (o.atk || 0) * 0.15; hs = sg * 0.14; hu = shU - 0.08 + sg * 0.07 + (o.atk || 0) * 0.1; if (o.runner) { hf = -0.2 + sg * sw * 0.2; hu = hipU + 0.1; hs = sg * 0.28; } }
    else if (o.pose === 'gun') { hf = 0.44; hs = sg * 0.04 + 0.05; hu = shU - 0.1; }
    else if (o.pose === 'melee' && sg === 1) {
      if (p >= 0) {
        const t1 = clamp(p / 0.35, 0, 1), t2 = clamp((p - 0.35) / 0.3, 0, 1), t3 = clamp((p - 0.65) / 0.35, 0, 1);
        const A = [0.16, 0.26, hipU + 0.14], Bk = [-0.18, 0.32, shU + 0.34], Ck = [0.52, -0.06, shU - 0.36];
        let cur = p < 0.35 ? A.map((v, i) => lerp(v, Bk[i], t1)) : p < 0.65 ? Bk.map((v, i) => lerp(v, Ck[i], t2)) : Ck.map((v, i) => lerp(v, A[i], t3));
        hf = cur[0]; hs = cur[1]; hu = cur[2];
      } else { hf = 0.16; hs = 0.26; hu = hipU + 0.14; }
    } else if (o.pose === 'throw' && sg === 1 && p >= 0) { hf = lerp(-0.25, 0.5, p); hs = 0.25; hu = shU + lerp(0.3, 0.1, p); }
    else if (o.light && sg === -1) { hf = 0.3; hs = -0.16; hu = shU - 0.25; }
    const hand = J(hf, hs, hu), el = J((lean + hf) / 2 - 0.06, sg * 0.24 * fat, (shU + hu) / 2 - 0.08);
    if (o.wpn && sg === 1) {
      const w = o.wpn; let d;
      if (o.pose === 'gun') d = [1, 0, 0.02];
      else if (p >= 0) { const t = clamp((p - 0.2) / 0.5, 0, 1); d = [lerp(-0.35, 0.95, t), lerp(0.2, -0.1, t), lerp(0.9, -0.15, t)]; }
      else d = [0.45, 0.05, 0.9];
      const n = Math.hypot(d[0], d[1], d[2]);
      tip = J(hf + d[0] / n * w.len, hs + d[1] / n * w.len, hu + d[2] / n * w.len);
    }
    arms.push({ d: sh[2], sh, el, hand, tip, sg });
  }
  const cD = J(lean * 0.5, 0, 1.1)[2];
  const drawArm = (ar) => {
    limb(ar.sh, ar.el, ar.hand, 3.6 * fat, o.sleeve ? pal.shirt : pal.skin);
    if (o.sleeve !== 0) limb(ar.sh, ar.el, null, 3.8 * fat, pal.shirt);
    if (ar.tip) { const w = o.wpn; g.beginPath(); g.moveTo(ar.hand[0], ar.hand[1]); g.lineTo(ar.tip[0], ar.tip[1]); g.strokeStyle = OUT; g.lineWidth = (w.w || 2) + 1.4; g.stroke(); g.strokeStyle = w.col; g.lineWidth = w.w || 2; g.stroke(); if (w.head) { g.fillStyle = w.head; g.strokeStyle = OUT; g.lineWidth = 0.8; g.beginPath(); g.arc(ar.tip[0], ar.tip[1], w.hr || 2.6, 0, 7); g.fill(); g.stroke(); } }
    if (o.light && ar.sg === -1) { g.fillStyle = '#d0a52c'; g.beginPath(); g.arc(ar.hand[0], ar.hand[1], 2, 0, 7); g.fill(); }
  };
  for (const ar of arms) if (ar.d < cD - 0.001) drawArm(ar);
  /* mochila atrás */
  const back = J(lean - 0.17, 0, shU - 0.22);
  const bagFirst = back[2] < cD;
  const drawBag = () => { if (!o.bag) return; g.fillStyle = o.bag; g.strokeStyle = OUT; g.lineWidth = 1; g.beginPath(); g.roundRect(back[0] - 4.5 * sc, back[1] - 6 * sc, 9 * sc, 12 * sc, 3); g.fill(); g.stroke(); };
  if (bagFirst) drawBag();
  /* tronco */
  const sL = J(lean, -0.19 * fat, shU), sR = J(lean, 0.19 * fat, shU), hL = J(0, -0.13 * fat, hipU), hR = J(0, 0.13 * fat, hipU);
  g.lineJoin = 'round';
  g.beginPath(); g.moveTo(sL[0], sL[1]); g.lineTo(sR[0], sR[1]); g.lineTo(hR[0], hR[1]); g.lineTo(hL[0], hL[1]); g.closePath();
  g.strokeStyle = OUT; g.lineWidth = 7.4 * sc * fat; g.stroke();
  g.strokeStyle = pal.shirt; g.lineWidth = 5.8 * sc * fat; g.stroke(); g.fillStyle = pal.shirt; g.fill();
  g.beginPath(); g.moveTo(hL[0], hL[1]); g.lineTo(hR[0], hR[1]); g.strokeStyle = pal.pants; g.lineWidth = 5.6 * sc * fat; g.stroke();
  if (o.stain) { const m = J(lean * 0.6 + 0.05, o.stain * 0.06, shU - 0.2); g.fillStyle = 'rgba(80,22,18,.75)'; g.beginPath(); g.ellipse(m[0], m[1], 3 * sc, 3.6 * sc, 0, 0, 7); g.fill(); }
  if (o.vest) { g.beginPath(); g.moveTo(sL[0], sL[1]); g.lineTo(sR[0], sR[1]); g.lineTo((sR[0] + hR[0]) / 2, (sR[1] + hR[1]) / 2 + 3); g.lineTo((sL[0] + hL[0]) / 2, (sL[1] + hL[1]) / 2 + 3); g.closePath(); g.fillStyle = o.vest; g.strokeStyle = o.vest; g.lineWidth = 5 * sc; g.stroke(); g.fill(); }
  if (!bagFirst) drawBag();
  /* cabeça */
  const hd = J(lean * 1.4 + 0.03, 0, headU + (o.headUp || 0)), nk = J(lean * 1.2, 0, shU + 0.04);
  limb(nk, hd, null, 3, pal.skin);
  const hr = 5.4 * sc;
  g.beginPath(); g.arc(hd[0], hd[1], hr, 0, 7); g.fillStyle = o.helmet || pal.hair; g.fill(); g.strokeStyle = OUT; g.lineWidth = 1.1; g.stroke();
  const fd = fx + fy;
  if (fd > -0.6 && !fall) {
    const sxn = (fx - fy) * 0.7, syn = fd * 0.5;
    g.save(); g.beginPath(); g.arc(hd[0], hd[1], hr - 0.5, 0, 7); g.clip();
    g.beginPath(); g.arc(hd[0] + sxn * hr * 0.55, hd[1] + syn * hr * 0.45 + 1.3 * sc, hr * 0.86, 0, 7); g.fillStyle = o.helmet ? '#1c2228' : pal.skin; g.fill();
    if (zb && fd > 0) { g.fillStyle = 'rgba(70,16,14,.85)'; g.beginPath(); g.arc(hd[0] + sxn * hr * 0.6, hd[1] + syn * hr * 0.5 + 3.2 * sc, 1.5 * sc, 0, 7); g.fill(); g.fillStyle = 'rgba(20,20,16,.8)'; g.fillRect(hd[0] + sxn * hr * 0.6 - 2.2 * sc, hd[1] + syn * hr * 0.3, 1.2 * sc, 1.1 * sc); g.fillRect(hd[0] + sxn * hr * 0.6 + 1.1 * sc, hd[1] + syn * hr * 0.3, 1.2 * sc, 1.1 * sc); }
    g.restore();
  }
  for (const ar of arms) if (ar.d >= cD - 0.001) drawArm(ar);
}

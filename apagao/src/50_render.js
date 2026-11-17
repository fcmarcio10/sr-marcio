/* Câmera e desenho do quadro: chão, sombras, paredes/objetos/pessoas em ordem, telhados e luz. */
const Cam = { x: 100, y: 100, zoom: 1.5, ix: 0, iy: 0 };
const AMB = [[0, .15, .18, .33], [4.8, .15, .18, .33], [5.8, .5, .42, .5], [6.8, .95, .82, .72], [8, 1, 1, 1], [16.3, 1, 1, 1], [17.4, 1, .82, .62], [18.2, .78, .5, .45], [19, .34, .3, .48], [20, .15, .18, .33], [24, .15, .18, .33]];
function ambient(h) {
  for (let i = 0; i < AMB.length - 1; i++) { const a = AMB[i], b = AMB[i + 1]; if (h >= a[0] && h <= b[0]) { const t = (h - a[0]) / (b[0] - a[0] || 1); return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]; } }
  return [1, 1, 1];
}
const WPN_VIS = {
  cabo: { len: 0.95, col: '#b08a52', w: 2 }, taco: { len: 0.95, col: '#7a4a26', w: 2 }, frigideira: { len: 0.42, col: '#2a2a2e', w: 2.2, head: '#3a3a3e', hr: 4 }, chave: { len: 0.42, col: '#8a8f96', w: 2.4 },
  pecabra: { len: 0.6, col: '#9a2e25', w: 2.4 }, enxada: { len: 1.0, col: '#8a6a3e', w: 2.2, head: '#7f858c', hr: 3 }, martelo: { len: 0.36, col: '#6b4a2a', w: 2.2, head: '#70767d', hr: 2.8 },
  tabua_pregos: { len: 0.7, col: '#9a7446', w: 3.4 }, faca: { len: 0.26, col: '#c9ced4', w: 2 }, peixeira: { len: 0.36, col: '#d5d9de', w: 2.6 }, facao: { len: 0.55, col: '#bfc5cc', w: 2.6 },
  machado: { len: 0.66, col: '#7a5530', w: 2.4, head: '#aeb4bb', hr: 3.4 }, lanca: { len: 1.2, col: '#b08a52', w: 1.8, head: '#cfd4da', hr: 1.8 },
  trovao38: { len: 0.2, col: '#3a3d42', w: 3 }, carcara9: { len: 0.18, col: '#26282c', w: 3 }, cartucheira: { len: 0.7, col: '#4a3520', w: 3 }, jaguatirica: { len: 0.82, col: '#5a3d22', w: 2.6 },
  rojao: { len: 0.25, col: '#c23b2e', w: 3 }, molotov: { len: 0.2, col: '#6a8a4a', w: 4 }, sinalizador: { len: 0.2, col: '#d8452e', w: 3 }
};

const Render = {
  cv: null, g: null, cw: 0, ch: 0, dpr: 1, lm: null, lg: null, sh: null, sg: null, frameId: 0, WC: [[], []], vprops: [], buckets: new Map(), pb: 0,
  init(cv) {
    this.cv = cv; this.g = cv.getContext('2d', { alpha: false });
    [this.lm, this.lg] = mk(4, 4); [this.sh, this.sg] = mk(4, 4);
    this.resize(); window.addEventListener('resize', () => this.resize());
  },
  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = window.innerWidth; this.ch = window.innerHeight;
    this.cv.width = Math.round(this.cw * this.dpr); this.cv.height = Math.round(this.ch * this.dpr);
    this.lm.width = Math.ceil(this.cw / 2); this.lm.height = Math.ceil(this.ch / 2);
    this.sh.width = Math.ceil(this.cw / 2); this.sh.height = Math.ceil(this.ch / 2);
    if (!Settings.zoom) Cam.zoom = clamp(Math.min(this.cw / 900, this.ch / 520), 1, 2.2); else Cam.zoom = Settings.zoom;
  },
  toWorld(mx, my) {
    const ix = (mx - this.cw / 2) / Cam.zoom + Cam.ix, iy = (my - this.ch / 2) / Cam.zoom + Cam.iy;
    return [(ix / HW + iy / HH) / 2, (iy / HH - ix / HW) / 2];
  },
  wallSpr(o, i, x, y, t) {
    let c = this.WC[o][i];
    if (c && c.t === t) return c;
    const W = World, fb = W.bld[i], bi = o ? idx(x - 1, y) : idx(x, y - 1), bb = W.bld[bi];
    const seed = Math.floor(hash2(x, y, o + 11) * 3);
    let st;
    if (t >= E.MURO) st = { col: '#aaa392', lv: 1, ext: 1, seed, barr: 0 };
    else {
      const B = W.builds[fb] && !W.builds[fb].open ? W.builds[fb] : null, Bb = W.builds[bb] && !W.builds[bb].open ? W.builds[bb] : null;
      if (B) st = { col: B.int, lv: 1, ext: 0, seed, barr: 0, brick: 0 };
      else if (Bb) st = { col: Bb.col, lv: Bb.levels, ext: 1, seed, barr: Bb.barr, brick: Bb.brick, sign: W.signs.get(o + ':' + i) };
      else st = { col: '#aaa392', lv: 1, ext: 1, seed };
    }
    c = { t, fb, bb, low: t >= E.MURO };
    c.a = Art.wall(o, t, st);
    c.b = st.lv > 1 ? Art.wall(o, t, Object.assign({}, st, { lv: 1, sign: null })) : c.a;
    c.c = c.low ? c.a : Art.wall(o, t, Object.assign({}, st, { cut: 1, sign: null }));
    this.WC[o][i] = c;
    return c;
  },
  frame() {
    const g = this.g, W = World, P = Player, cw = this.cw, ch = this.ch, z = Cam.zoom, dpr = this.dpr;
    this.frameId++;
    Cam.ix = isoX(Cam.x, Cam.y); Cam.iy = isoY(Cam.x, Cam.y) - 20;
    const shx = G.shake > 0.1 && Settings.shake ? (Math.random() - 0.5) * G.shake : 0, shy = G.shake > 0.1 && Settings.shake ? (Math.random() - 0.5) * G.shake : 0;
    const TX = (cw / 2 - Cam.ix * z + shx) * dpr, TY = (ch / 2 - Cam.iy * z + shy) * dpr, SC = z * dpr;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b0c0d'; g.fillRect(0, 0, this.cv.width, this.cv.height);
    g.setTransform(SC, 0, 0, SC, TX, TY);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'low';
    const hw = cw / 2 / z, hh = ch / 2 / z;
    const sMin = Math.floor((Cam.iy - hh) / HH) - 2, sMaxF = Math.ceil((Cam.iy + hh) / HH) + 1, sMax = sMaxF + 22;
    const tMin = Math.floor((Cam.ix - hw) / HW) - 2, tMax = Math.ceil((Cam.ix + hw) / HW) + 2;
    const playing = G.state !== 'menu';
    const ptx = Math.floor(P.x), pty = Math.floor(P.y);
    let pb = playing ? W.bld[idx(ptx, pty)] : 0;
    const pbOpen = pb && W.builds[pb].open;
    this.pb = pbOpen ? 0 : pb;
    const inB = this.pb;
    /* ---- chão ---- */
    const vp = this.vprops; vp.length = 0;
    const vb = new Set();
    for (let s = sMin; s <= sMaxF + 4; s++) {
      for (let t = tMin + ((s + tMin) & 1); t <= tMax; t += 2) {
        const x = (s + t) >> 1, y = (s - t) >> 1;
        if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
        const i = y * MW + x;
        if (s <= sMaxF) g.drawImage(Art.tile(W.ground[i], x, y), (x - y) * HW - HW - 1, s * HH - 1, TW + 2, TH + 2);
        const b = W.bld[i]; if (b) vb.add(b);
        const td = W.tileDraw[i]; if (td) for (const d of td) { if (d.p._f !== this.frameId) { d.p._f = this.frameId; vp.push(d.p); } }
      }
    }
    /* manchas */
    for (const d of Decals.list) {
      const px = isoX(d.x, d.y), py = isoY(d.x, d.y);
      if (Math.abs(px - Cam.ix) > hw + 60 || Math.abs(py - Cam.iy) > hh + 60) continue;
      if (inB !== W.bld[idx(Math.floor(d.x), Math.floor(d.y))] && W.bld[idx(Math.floor(d.x), Math.floor(d.y))]) continue;
      g.fillStyle = d.k === 'blood' ? 'rgba(74,18,14,.5)' : 'rgba(10,8,6,.5)';
      g.beginPath(); g.ellipse(px, py, 13 * d.r, 6.5 * d.r, 0, 0, 7); g.fill();
      if (d.k === 'blood') { g.beginPath(); g.ellipse(px + Math.cos(d.a) * 10 * d.r, py + Math.sin(d.a) * 5 * d.r, 5 * d.r, 2.5 * d.r, 0, 0, 7); g.fill(); }
    }
    /* ---- sombras ---- */
    const hr = G.time / 60, day = hr > 5.6 && hr < 18.4;
    let sdx, sdy, sAlpha;
    if (day) { const k = (hr - 5.6) / 12.8, e = Math.abs(2 * k - 1); sdx = lerp(-1.6, 1.6, k) * (0.3 + 0.7 * e); sdy = 0.3 + 0.25 * e; sAlpha = 0.36 * Math.min(1, Math.sin(Math.PI * k) * 3); }
    else { sdx = 0.45; sdy = 0.5; sAlpha = 0.14; }
    const ents = [];
    if (playing && !P.dead) ents.push(P);
    for (const zb of Zombies.active) if (zb.vis > 0.05) ents.push(zb);
    if (Settings.shadows && sAlpha > 0.02) {
      const sg = this.sg; sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, this.sh.width, this.sh.height);
      sg.setTransform(z / 2, 0, 0, z / 2, (cw / 2 - Cam.ix * z) / 2, (ch / 2 - Cam.iy * z) / 2);
      sg.fillStyle = '#000'; sg.strokeStyle = '#000'; sg.lineCap = 'round';
      const hull = (pts) => {
        pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
        for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
        for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
        lo.pop(); up.pop(); const h = lo.concat(up);
        sg.beginPath(); sg.moveTo(h[0][0], h[0][1]); for (let i = 1; i < h.length; i++) sg.lineTo(h[i][0], h[i][1]); sg.closePath(); sg.fill();
      };
      const boxSh = (x0, y0, x1, y1, h) => { const pts = []; for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) { pts.push([isoX(x, y), isoY(x, y)], [isoX(x + sdx * h, y + sdy * h), isoY(x + sdx * h, y + sdy * h)]); } hull(pts); };
      for (const id of vb) { const b = W.builds[id]; if (id === inB || b.open) continue; boxSh(b.x0, b.y0, b.x1 + 1, b.y1 + 1, b.levels * LVL_H + 0.6); }
      for (const p of vp) {
        const d = PROPS[p.t]; if (!d.sh) continue;
        if (W.bld[idx(p.x, p.y)] && W.bld[idx(p.x, p.y)] !== inB) continue;
        if (d.tree) { const cx = p.x + 0.5 + sdx * d.sh * 0.7, cy = p.y + 0.5 + sdy * d.sh * 0.7; sg.beginPath(); sg.ellipse(isoX(cx, cy), isoY(cx, cy), d.tree * 45, d.tree * 23, 0, 0, 7); sg.fill(); sg.lineWidth = 5; sg.beginPath(); sg.moveTo(isoX(p.x + 0.5, p.y + 0.5), isoY(p.x + 0.5, p.y + 0.5)); sg.lineTo(isoX(cx, cy), isoY(cx, cy)); sg.stroke(); }
        else if (d.thin) { sg.lineWidth = 3.5; sg.beginPath(); sg.moveTo(isoX(p.x + 0.5, p.y + 0.5), isoY(p.x + 0.5, p.y + 0.5)); sg.lineTo(isoX(p.x + 0.5 + sdx * d.sh, p.y + 0.5 + sdy * d.sh), isoY(p.x + 0.5 + sdx * d.sh, p.y + 0.5 + sdy * d.sh)); sg.stroke(); }
        else boxSh(p.x + 0.14, p.y + 0.14, p.x + p.w - 0.14, p.y + p.h - 0.14, d.sh);
      }
      sg.lineWidth = 10;
      for (const e of ents) {
        let ex = sdx, ey = sdy;
        if (!day && P.lightOn && e !== P) { const dd = dist(e.x, e.y, P.x, P.y); if (dd < 10 && Math.abs(angDiff(Math.atan2(e.y - P.y, e.x - P.x), P.a)) < 0.5) { ex = (e.x - P.x) / dd * 0.9; ey = (e.y - P.y) / dd * 0.9; } }
        const hgt = (e.fall || e.down > 0) ? 0.3 : 1.6;
        sg.beginPath(); sg.moveTo(isoX(e.x, e.y), isoY(e.x, e.y)); sg.lineTo(isoX(e.x + ex * hgt, e.y + ey * hgt), isoY(e.x + ex * hgt, e.y + ey * hgt)); sg.stroke();
      }
      g.setTransform(dpr, 0, 0, dpr, shx * dpr, shy * dpr); g.globalAlpha = sAlpha; g.drawImage(this.sh, 0, 0, cw, ch); g.globalAlpha = 1;
      g.setTransform(SC, 0, 0, SC, TX, TY);
    }
    /* ---- baldes por casa ---- */
    const bk = this.buckets; bk.clear();
    const put = (x, y, o) => { const k = Math.floor(y) * MW + Math.floor(x); let a = bk.get(k); if (!a) bk.set(k, a = []); a.push(o); };
    for (const c of Zombies.corpses) put(c.x, c.y, { k: 0, d: c.x + c.y - 5, c });
    for (const gi of Ground.items) put(gi.x, gi.y, { k: 1, d: gi.x + gi.y - 4, gi });
    for (const e of ents) put(e.x, e.y, { k: 2, d: e.x + e.y, e });
    for (const f of FX.fires) put(f.x, f.y, { k: 3, d: f.x + f.y, f });
    for (const f of FX.flares) put(f.x, f.y, { k: 4, d: f.x + f.y, f });
    for (const p of FX.proj) put(p.x, p.y, { k: 5, d: p.x + p.y, p });
    /* telhados por fileira */
    const roofRow = new Map();
    for (const id of vb) {
      const b = W.builds[id];
      const tgt = id === pb ? (b.open ? 0.3 : 0) : 1;
      if (b.roofA === undefined) b.roofA = tgt;
      b.roofA += clamp(tgt - b.roofA, -G.dt * 5, G.dt * 5);
      if (!playing) b.roofA = 1;
      if (b.roofA < 0.02) continue;
      const row = b.x1 + b.y1 + 3; let a = roofRow.get(row); if (!a) roofRow.set(row, a = []); a.push(b);
    }
    /* construção na frente do jogador fica meio transparente */
    for (const id of vb) {
      const b = W.builds[id]; let hid = 0;
      if (playing && !inB && !b.open && id !== pb) { const H = b.levels * LVL_H + 1.2; for (let t = 0.4; t < 16; t += 0.5) { const zz = 0.9 + t * 0.889; if (zz > H) break; const qx = P.x + t, qy = P.y + t; if (qx > b.x0 - 0.3 && qx < b.x1 + 1.3 && qy > b.y0 - 0.3 && qy < b.y1 + 1.3) { hid = 1; break; } } }
      if (b.fadeA === undefined) b.fadeA = 1;
      b.fadeA += clamp((hid ? 0.28 : 1) - b.fadeA, -G.dt * 4, G.dt * 4);
    }
    const drawRoof = (b) => { const r = Art.roof(b); g.globalAlpha = b.roofA * b.fadeA; g.drawImage(r.img, r.dx, r.dy, r.w, r.h); g.globalAlpha = 1; };
    const wAlpha = (c) => { if (c.fb || !c.bb) return 1; const b = W.builds[c.bb]; return b.fadeA === undefined ? 1 : b.fadeA; };
    /* ---- passada em ordem ---- */
    const px = P.x, py = P.y;
    for (let s = sMin; s <= sMax; s++) {
      const rr = roofRow.get(s); if (rr) { for (const b of rr) drawRoof(b); roofRow.delete(s); }
      for (let t = tMin + ((s + tMin) & 1); t <= tMax; t += 2) {
        const x = (s + t) >> 1, y = (s - t) >> 1;
        if (x < 0 || y < 0 || x >= MW || y >= MH) continue;
        const i = y * MW + x;
        const n = W.eN[i], w = W.eW[i];
        if (n) { const c = this.wallSpr(0, i, x, y, n); const mine = inB && (c.fb === inB || c.bb === inB); const sp = mine ? (y > py && !c.low ? c.c : c.b) : c.a; const al = wAlpha(c); if (al < 0.99) g.globalAlpha = al; g.drawImage(sp.img, (x - y) * HW - sp.ax, s * HH - sp.ay, sp.w, sp.h); g.globalAlpha = 1; }
        if (w) { const c = this.wallSpr(1, i, x, y, w); const mine = inB && (c.fb === inB || c.bb === inB); const sp = mine ? (x > px && !c.low ? c.c : c.b) : c.a; const al = wAlpha(c); if (al < 0.99) g.globalAlpha = al; g.drawImage(sp.img, (x - y) * HW - sp.ax, s * HH - sp.ay, sp.w, sp.h); g.globalAlpha = 1; }
        const td = W.tileDraw[i];
        if (td) for (const d of td) g.drawImage(d.img, d.sx, 0, d.sw, d.sh, d.dx, d.dy, d.sw / SS, d.sh / SS);
        const be = bk.get(i);
        if (be) { if (be.length > 1) be.sort((a, b) => a.d - b.d); for (const o of be) this.drawEnt(g, o); }
      }
    }
    for (const rr of roofRow.values()) for (const b of rr) drawRoof(b);
    /* jogador sempre visível (fantasma por cima do que tapa) */
    if (playing && !P.dead) { g.globalAlpha = 0.3; this.drawPlayer(g); g.globalAlpha = 1; }
    /* efeitos */
    for (const f of FX.list) {
      const fx = isoX(f.x, f.y), fy = isoY(f.x, f.y) - (f.z || 0) * ZS;
      if (f.k === 'tracer') { g.strokeStyle = 'rgba(255,236,180,' + Math.min(1, f.t * 14) + ')'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(fx, fy - 46); g.lineTo(isoX(f.x1, f.y1), isoY(f.x1, f.y1) - 40); g.stroke(); }
      else if (f.k === 'spark') { g.fillStyle = f.col; g.globalAlpha = Math.min(1, f.t * 4); g.fillRect(fx - 1, fy - 1, 2.2, 2.2); g.globalAlpha = 1; }
      else if (f.k === 'smoke') { g.fillStyle = 'rgba(40,36,32,' + Math.min(0.35, f.t * 0.4) + ')'; g.beginPath(); g.arc(fx, fy, 9 + (1.2 - f.t) * 10, 0, 7); g.fill(); }
      else if (f.k === 'crit') { g.strokeStyle = 'rgba(255,240,200,' + Math.min(1, f.t * 3) + ')'; g.lineWidth = 1.5; const r = 8 + (0.5 - f.t) * 26; g.beginPath(); g.ellipse(fx, fy - 40, r, r * 0.6, 0, 0, 7); g.stroke(); }
    }
    /* alvo da interação */
    const ic = Interact.cur;
    if (playing && ic && !G.invOpen) { const ax = isoX(ic.x, ic.y), ay = isoY(ic.x, ic.y) - (ic.kind === 'edge' ? 38 : ic.kind === 'prop' ? 26 : 8) + Math.sin(G.now * 5) * 2; g.fillStyle = 'rgba(240,228,190,.9)'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(ax, ay + 5); g.lineTo(ax - 4.5, ay - 2); g.lineTo(ax + 4.5, ay - 2); g.closePath(); g.fill(); g.stroke(); }
    /* ---- luz ---- */
    const amb = ambient(hr);
    let indoorDim = inB ? 0.86 : 1;
    if (amb[0] * indoorDim < 0.97 || FX.fires.length) this.lightPass(amb, indoorDim, hw, hh, shx, shy);
    /* mira */
    if (playing && G.state === 'play' && !G.invOpen && !G.mapOpen) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const d = P.wpnDef(), mx = Input.mx, my = Input.my;
      g.strokeStyle = 'rgba(240,232,210,.85)'; g.lineWidth = 1.4;
      if (d && d.t === 'gun') { const r = 7 + (1 - d.prec) * 40 * (P.moving ? 1.6 : 1); g.beginPath(); g.arc(mx, my, r, 0, 7); g.stroke(); g.fillStyle = 'rgba(240,232,210,.9)'; g.fillRect(mx - 1, my - 1, 2, 2); }
      else { g.beginPath(); g.moveTo(mx - 6, my); g.lineTo(mx - 2, my); g.moveTo(mx + 2, my); g.lineTo(mx + 6, my); g.moveTo(mx, my - 6); g.lineTo(mx, my - 2); g.moveTo(mx, my + 2); g.lineTo(mx, my + 6); g.stroke(); }
    }
  },
  drawPlayer(g) {
    const P = Player, h = P.eq.hand, d = h ? ITEMS[h.k] : null;
    const pose = d ? (d.t === 'gun' ? 'gun' : d.t === 'throw' ? 'throw' : 'melee') : (P.sw >= 0 ? 'melee' : 'idle');
    const body = P.eq.body, bag = P.eq.bag;
    drawHuman(g, P.x, P.y, P.a, { pal: P.pal, walk: P.walk, mv: P.mv, pose: P.sw >= 0 && P.swKind === 'throw' ? 'throw' : pose, sw: P.sw, crouch: P.sneak, wpn: h ? WPN_VIS[h.k] : null, light: P.lightOn,
      bag: bag ? (bag.k === 'mochila' ? '#2c5a8a' : '#5a6a3a') : null, helmet: P.eq.head ? '#b63a2c' : null, vest: body ? (body.k === 'colete' ? '#3b4046' : '#4a3426') : null, sleeve: 1 });
  },
  drawEnt(g, o) {
    if (o.k === 2) {
      const e = o.e;
      if (e === Player) { if (Player.hurtT > 0 && Math.floor(G.now * 30) % 2) g.globalAlpha = 0.6; this.drawPlayer(g); g.globalAlpha = 1; return; }
      const T = ZT[e.type];
      g.globalAlpha = Math.min(1, e.vis);
      const fall = e.dead ? e.fall : e.down > 0 ? Math.min(1, e.down * 3, (1.8 - e.down) * 5 + 0.2) : 0;
      drawHuman(g, e.x, e.y, e.dead ? e.fa : e.a, { pal: e.pal, walk: e.walk, mv: e.mv, pose: 'zombie', sc: e.sc, fat: T.fat, runner: T.runner && e.mv > 0.3, drag: T.drag, lean: T.runner ? 0.22 : 0.1, stain: (e.s % 3) - 1 || 1, fall, atk: e.wind > 0 ? 1 - e.wind / 0.38 : e.bash ? (Math.sin(G.now * 7) + 1) / 2 : 0, headUp: e.scream > 0 ? 0.06 : 0, sleeve: e.s % 2 });
      if (e.stun > 0 && !e.dead && e.down <= 0) { g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.arc(isoX(e.x, e.y), isoY(e.x, e.y) - 30 * e.sc, 13, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    } else if (o.k === 0) { const c = o.c; drawHuman(g, c.x, c.y, c.a, { pal: c.pal, pose: 'zombie', sc: c.sc, fat: c.fat, fall: 1, stain: 1 }); }
    else if (o.k === 1) {
      const gi = o.gi, x = isoX(gi.x, gi.y), y = isoY(gi.x, gi.y);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + 1, 8, 3.5, 0, 0, 7); g.fill();
      g.drawImage(itemIcon(gi.it.k, 48), x - 8, y - 13, 16, 16);
    } else if (o.k === 3) {
      const f = o.f, n = 9;
      for (let i = 0; i < n; i++) { const a = i * 2.4 + f.x, r = (i / n) * f.r * 0.85, x = isoX(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r), y = isoY(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); const hgt = (12 + 9 * Math.sin(G.now * 9 + i * 1.7)) * Math.min(1, f.t); const gr = g.createLinearGradient(0, y, 0, y - hgt); gr.addColorStop(0, 'rgba(255,220,120,.9)'); gr.addColorStop(0.5, 'rgba(255,120,30,.7)'); gr.addColorStop(1, 'rgba(180,30,10,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 6, y); g.quadraticCurveTo(x - 4, y - hgt * 0.6, x, y - hgt); g.quadraticCurveTo(x + 4, y - hgt * 0.6, x + 6, y); g.fill(); }
    } else if (o.k === 4) { const f = o.f, x = isoX(f.x, f.y), y = isoY(f.x, f.y); g.fillStyle = f.k === 'flare' ? '#ff5a3a' : '#c23b2e'; g.fillRect(x - 3, y - 2, 6, 2.5); if (f.k === 'flare') { g.fillStyle = 'rgba(255,120,90,' + (0.5 + 0.3 * Math.sin(G.now * 30)) + ')'; g.beginPath(); g.arc(x + 3, y - 2, 4, 0, 7); g.fill(); } }
    else if (o.k === 5) { const p = o.p, x = isoX(p.x, p.y), y = isoY(p.x, p.y) - p.z * ZS; g.fillStyle = WPN_VIS[p.k].col; g.strokeStyle = '#111'; g.lineWidth = 0.8; g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); g.stroke(); }
  },
  lightPass(amb, dim, hw, hh, shx, shy) {
    const lg = this.lg, g = this.g, P = Player, z = Cam.zoom, cw = this.cw, ch = this.ch, W = World;
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over';
    const c = v => Math.round(clamp(v * dim, 0, 1) * 255);
    lg.fillStyle = 'rgb(' + c(amb[0]) + ',' + c(amb[1]) + ',' + c(amb[2]) + ')'; lg.fillRect(0, 0, this.lm.width, this.lm.height);
    const dark = 1 - amb[0];
    if (dark > 0.03) {
      lg.setTransform(z / 2, 0, 0, z / 2, (cw / 2 - Cam.ix * z) / 2, (ch / 2 - Cam.iy * z) / 2);
      lg.globalCompositeOperation = 'lighter';
      const glow = (x, y, zz, r, col, k) => {
        const px = isoX(x, y), py = isoY(x, y) - zz * ZS * 0.5;
        if (Math.abs(px - Cam.ix) > hw + r * 46 || Math.abs(py - Cam.iy) > hh + r * 30) return;
        lg.save(); lg.translate(px, py); lg.scale(1, 0.6);
        const gr = lg.createRadialGradient(0, 0, 2, 0, 0, r * 44);
        gr.addColorStop(0, rgba(col, k)); gr.addColorStop(0.5, rgba(col, k * 0.4)); gr.addColorStop(1, rgba(col, 0));
        lg.fillStyle = gr; lg.beginPath(); lg.arc(0, 0, r * 44, 0, 7); lg.fill(); lg.restore();
      };
      for (const l of W.lights) {
        if (l.b && l.b !== this.pb) continue;
        const fl = l.fl === 1 ? 0.8 + 0.12 * Math.sin(G.now * 11 + l.x) + 0.08 * Math.sin(G.now * 23 + l.y) : l.fl === 2 ? (Math.sin(G.now * 3 + l.x * 7) > -0.85 ? 0.85 : 0.25) : 1;
        glow(l.x, l.y, l.z || 0, l.r, l.col, dark * fl);
      }
      for (const f of FX.fires) glow(f.x, f.y, 0.5, 6, '#ff8a30', dark * (0.85 + 0.15 * Math.sin(G.now * 13)) * Math.min(1, f.t));
      for (const f of FX.flares) if (f.k === 'flare') glow(f.x, f.y, 0.3, 7.5, '#ff4a34', dark * (0.8 + 0.2 * Math.sin(G.now * 31)));
      for (const f of FX.list) if (f.k === 'flash') glow(f.x, f.y, 1, f.r, f.col, dark);
      if (G.state !== 'menu' && !P.dead) {
        glow(P.x, P.y, 1, 2.8, '#8f9bb8', dark * 0.5);
        if (P.lightOn) {
          const ppx = isoX(P.x, P.y), ppy = isoY(P.x, P.y) - 22, R = 11.5, N = 22, spread = 0.44;
          lg.beginPath(); lg.moveTo(ppx, ppy);
          for (let i = 0; i <= N; i++) { const a = P.a - spread + spread * 2 * i / N; const ex = P.x + Math.cos(a) * R, ey = P.y + Math.sin(a) * R; const f = Math.min(1, rayCast(P.x, P.y, ex, ey, edgeSee) + 0.06); const qx = P.x + (ex - P.x) * f, qy = P.y + (ey - P.y) * f; lg.lineTo(isoX(qx, qy), isoY(qx, qy) - 14); }
          lg.closePath();
          const gr = lg.createRadialGradient(ppx, ppy, 6, ppx, ppy, R * 38);
          gr.addColorStop(0, 'rgba(255,244,214,' + dark + ')'); gr.addColorStop(0.6, 'rgba(255,240,200,' + dark * 0.6 + ')'); gr.addColorStop(1, 'rgba(255,240,200,0)');
          lg.fillStyle = gr; lg.fill();
          glow(P.x + Math.cos(P.a) * 1.2, P.y + Math.sin(P.a) * 1.2, 0.5, 2.2, '#fff0cc', dark * 0.5);
        }
      }
    }
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.globalCompositeOperation = 'multiply'; g.drawImage(this.lm, 0, 0, cw, ch); g.globalCompositeOperation = 'source-over';
  }
};

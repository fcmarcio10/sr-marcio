/* Cidade: mapa com ruas, trânsito e lugares; viagem animada; interior dos lugares com pessoas e atividades. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, A = SL.Avatar;
  const C = SL.City = {};
  const W = 1000, Hh = 640;
  const ROADS_X = [60, 230, 410, 620, 770, 950], ROADS_Y = [90, 235, 390, 555];
  const M_PER_UNIT = 3.2;
  let cam = { s: 1, ox: 0, oy: 0 }, hoverPlace = null, cars = [], walkers = [], blocks = null;

  const anchor = p => ({ x: ROADS_X.reduce((a, b) => Math.abs(b - p.x) < Math.abs(a - p.x) ? b : a), y: ROADS_Y.reduce((a, b) => Math.abs(b - p.y) < Math.abs(a - p.y) ? b : a) });
  C.path = (fromId, toId) => {
    const a = D.placeById(fromId), b = D.placeById(toId); const pa = anchor(a), pb = anchor(b);
    return [{ x: a.x, y: a.y }, { x: pa.x, y: a.y }, { x: pa.x, y: pb.y }, { x: b.x, y: pb.y }, { x: b.x, y: b.y }];
  };
  const plen = pts => { let d = 0; for (let i = 1; i < pts.length; i++) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return d; };
  C.distanceKm = (a, b) => plen(C.path(a, b)) * M_PER_UNIT / 1000;
  C.here = () => { const G = SL.G; return G.loc.area === 'casa' ? 'casa' : (G.loc.place || 'casa'); };
  C.isOpen = (id, t) => { const p = D.placeById(id); const h = SL.Clock.hourF(t); if (p.kind === 'amigos') return true; return h >= p.open[0] && h < p.open[1]; };
  C.options = toId => {
    const G = SL.G; const from = C.here(); const km = C.distanceKm(from, toId); const m = km * 1000;
    return D.transport.filter(tr => !tr.needs || G.equip.vehicles.includes(tr.needs)).map(tr => {
      const min = Math.max(3, Math.round(tr.wait + m / tr.speed));
      const cost = Math.round((tr.cost + (tr.perKm || 0) * km) * 100) / 100;
      return { tr, min, cost, km };
    });
  };
  C.travel = (toId, trId) => {
    const G = SL.G; const opt = C.options(toId).find(o => o.tr.id === trId); if (!opt) return 'Transporte indisponível.';
    if (G.act && G.act.id !== 'usar_pc') return 'Termine o que está fazendo primeiro.';
    if (opt.cost > 0 && !SL.Econ.spend(opt.cost, 'transporte', opt.tr.name + ' até ' + D.placeById(toId).name)) return 'Dinheiro insuficiente.';
    const from = C.here();
    G.loc = { area: 'cidade', place: from, tx: G.loc.tx, ty: G.loc.ty, dir: 1 };
    const err = SL.Life.start('viagem', { from, to: toId, min: opt.min, tr: trId }, { label: (opt.tr.id === 'pe' ? 'Caminhando' : 'Indo de ' + opt.tr.name.toLowerCase()) + ' para ' + D.placeById(toId).name });
    if (err) return err;
    if (trId === 'pe' || trId === 'bike') SL.Life.mod({ energia: -opt.min * 0.06 });
    if (trId === 'bike' || trId === 'pe') SL.Life.skillUp('fisico', opt.min * 0.01);
    SL.bus.emit('loc');
    return null;
  };
  C.arrive = d => {
    const G = SL.G;
    if (d.to === 'casa') { G.loc = { area: 'casa', place: null, tx: 0, ty: 0, dir: 1 }; if (SL.HomeScene) { SL.HomeScene.build(); SL.HomeScene.placeAt('porta'); } if (SL.audio) SL.audio.play('door'); }
    else { G.loc = { area: 'local', place: d.to, tx: 0, ty: 0, dir: 1 }; SL.Rel.passiveMeet(d.to); }
    SL.bus.emit('loc');
  };
  C.goOutside = () => { const G = SL.G; const p = G.loc.area === 'casa' ? 'casa' : G.loc.place; G.loc = { area: 'cidade', place: p, tx: G.loc.tx, ty: G.loc.ty, dir: 1 }; if (SL.audio) SL.audio.play('door'); SL.bus.emit('loc'); };
  C.enter = id => { const G = SL.G; if (id === 'casa') { G.loc = { area: 'casa', place: null, tx: 0, ty: 0 }; SL.HomeScene.build(); SL.HomeScene.placeAt('porta'); } else { G.loc = { area: 'local', place: id }; SL.Rel.passiveMeet(id); } SL.bus.emit('loc'); };

  // ícones SVG convertidos uma vez para caminhos do Canvas
  const iconCache = {};
  C.drawIcon = (c, name, color, lw) => {
    let parts = iconCache[name];
    if (!parts) {
      parts = []; const tmp = document.createElement('div'); tmp.innerHTML = SL.icon(name); const svg = tmp.firstChild;
      [...svg.children].forEach(el => {
        const fill = el.getAttribute('fill') === 'currentColor';
        if (el.tagName === 'path' && el.getAttribute('d')) parts.push({ p: new Path2D(el.getAttribute('d')), fill });
        else if (el.tagName === 'circle') { const p = new Path2D(); p.arc(+el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('r'), 0, 7); parts.push({ p, fill }); }
        else if (el.tagName === 'rect') { const p = new Path2D(); p.rect(+el.getAttribute('x'), +el.getAttribute('y'), +el.getAttribute('width'), +el.getAttribute('height')); parts.push({ p, fill }); }
      });
      iconCache[name] = parts;
    }
    c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw || 2; c.lineCap = 'round'; c.lineJoin = 'round';
    parts.forEach(pt => { if (pt.fill) c.fill(pt.p); c.stroke(pt.p); });
  };

  // ---------- mapa ----------
  const buildBlocks = () => {
    blocks = []; const r = U.mulberry(2027);
    const xs = [0].concat(ROADS_X).concat([W]), ys = [0].concat(ROADS_Y).concat([Hh]);
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
      const x0 = xs[i] + 16, x1 = xs[i + 1] - 16, y0 = ys[j] + 16, y1 = ys[j + 1] - 16; if (x1 - x0 < 20 || y1 - y0 < 20) continue;
      const park = (i === 3 && j === 1) || (i === 3 && j === 0);
      const items = [];
      if (park) { for (let k = 0; k < 26; k++) items.push({ tree: true, x: x0 + r() * (x1 - x0), y: y0 + r() * (y1 - y0), s: 6 + r() * 8 }); }
      else { let x = x0; while (x < x1 - 14) { const bw = Math.min(x1 - x, 24 + r() * 40); let y = y0; while (y < y1 - 14) { const bh = Math.min(y1 - y, 24 + r() * 44); items.push({ x, y, w: bw - 5, h: bh - 5, c: ['#3a3f52', '#454a5e', '#4a4256', '#3f4a52', '#524a46'][Math.floor(r() * 5)], lit: r() }); y += bh; } x += bw; } }
      blocks.push({ x0, y0, x1, y1, park, items });
    }
    cars = []; for (let i = 0; i < 26; i++) { const horiz = r() < 0.5; cars.push({ horiz, lane: horiz ? ROADS_Y[Math.floor(r() * ROADS_Y.length)] : ROADS_X[Math.floor(r() * ROADS_X.length)], p: r() * (horiz ? W : Hh), v: (20 + r() * 40) * (r() < 0.5 ? -1 : 1), c: D.shirtColors[Math.floor(r() * 12)] }); }
    walkers = []; for (let i = 0; i < 30; i++) walkers.push({ x: r() * W, y: r() * Hh, a: r() * 6.3, look: A.randomLook(U.mulberry(i + 50)) });
  };
  const nightA = () => { const h = SL.Clock.hourF(); if (h >= 7 && h < 17.5) return 0; if (h >= 20 || h < 5) return 0.5; if (h < 7) return 0.5 * (1 - (h - 5) / 2); return 0.5 * ((h - 17.5) / 2.5); };
  C.renderMap = (c, cw, ch, t, dt) => {
    if (!blocks) buildBlocks();
    cam.s = Math.min(cw / W, ch / Hh) * 0.98; cam.ox = (cw - W * cam.s) / 2; cam.oy = (ch - Hh * cam.s) / 2;
    c.fillStyle = '#0b0d12'; c.fillRect(0, 0, cw, ch);
    c.save(); c.translate(cam.ox, cam.oy); c.scale(cam.s, cam.s);
    c.fillStyle = '#263024'; c.fillRect(0, 0, W, Hh);
    c.fillStyle = '#2a5f8a'; c.beginPath(); c.ellipse(560, 70, 60, 26, 0, 0, 7); c.fill();
    blocks.forEach(b => {
      c.fillStyle = b.park ? '#2f5a2a' : '#22252e'; c.fillRect(b.x0 - 4, b.y0 - 4, b.x1 - b.x0 + 8, b.y1 - b.y0 + 8);
      b.items.forEach(it => { if (it.tree) { c.fillStyle = '#1f4a1f'; c.beginPath(); c.arc(it.x + 2, it.y + 3, it.s, 0, 7); c.fill(); c.fillStyle = '#3f8f3a'; c.beginPath(); c.arc(it.x, it.y, it.s, 0, 7); c.fill(); } else { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(it.x + 3, it.y + 3, it.w, it.h); c.fillStyle = it.c; c.fillRect(it.x, it.y, it.w, it.h); c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(it.x, it.y, it.w, 3); } });
    });
    c.strokeStyle = '#3a3d48'; c.lineWidth = 22; c.lineCap = 'butt';
    ROADS_X.forEach(x => { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, Hh); c.stroke(); }); ROADS_Y.forEach(y => { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); });
    c.strokeStyle = 'rgba(255,220,120,.35)'; c.lineWidth = 1.5; c.setLineDash([10, 10]);
    ROADS_X.forEach(x => { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, Hh); c.stroke(); }); ROADS_Y.forEach(y => { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }); c.setLineDash([]);
    // trânsito
    const sp = SL.Clock.rate() > 0 ? 1 : 0.15;
    cars.forEach(k => { k.p += k.v * dt * sp; const L = k.horiz ? W : Hh; if (k.p > L + 20) k.p = -20; if (k.p < -20) k.p = L + 20; const x = k.horiz ? k.p : k.lane + (k.v > 0 ? 5 : -5), y = k.horiz ? k.lane + (k.v > 0 ? 5 : -5) : k.p; c.fillStyle = k.c; c.save(); c.translate(x, y); if (!k.horiz) c.rotate(Math.PI / 2); A.rr(c, -7, -4, 14, 8, 2); c.fill(); c.fillStyle = 'rgba(180,220,255,.6)'; c.fillRect(k.v > 0 ? 2 : -5, -3, 3, 6); c.restore(); });
    walkers.forEach(wk => { wk.a += (Math.random() - 0.5) * 0.2; wk.x += Math.cos(wk.a) * 8 * dt * sp; wk.y += Math.sin(wk.a) * 8 * dt * sp; if (wk.x < 0 || wk.x > W) wk.a = Math.PI - wk.a; if (wk.y < 0 || wk.y > Hh) wk.a = -wk.a; c.fillStyle = wk.look.shirt; c.beginPath(); c.arc(wk.x, wk.y, 2.2, 0, 7); c.fill(); });
    // noite
    const na = nightA();
    if (na > 0) {
      c.fillStyle = 'rgba(6,8,24,' + na + ')'; c.fillRect(0, 0, W, Hh);
      c.save(); c.globalCompositeOperation = 'lighter';
      blocks.forEach(b => b.items.forEach(it => { if (!it.tree && it.lit < 0.55) { c.fillStyle = 'rgba(255,210,130,' + na * 0.5 + ')'; c.fillRect(it.x + it.w * 0.3, it.y + it.h * 0.3, 4, 4); c.fillRect(it.x + it.w * 0.6, it.y + it.h * 0.55, 4, 4); } }));
      ROADS_X.forEach(x => ROADS_Y.forEach(y => { const g = c.createRadialGradient(x, y, 1, x, y, 30); g.addColorStop(0, 'rgba(255,210,140,' + na * 0.5 + ')'); g.addColorStop(1, 'rgba(255,210,140,0)'); c.fillStyle = g; c.fillRect(x - 30, y - 30, 60, 60); }));
      c.restore();
    }
    // lugares
    const G = SL.G; const here = C.here();
    D.places.forEach(p => {
      const open = C.isOpen(p.id); const hv = hoverPlace === p.id;
      c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(p.x, p.y + 15, 14, 5, 0, 0, 7); c.fill();
      c.fillStyle = open ? p.color : '#555b6b'; c.beginPath(); c.arc(p.x, p.y, hv ? 17 : 14, 0, 7); c.fill();
      c.lineWidth = 3; c.strokeStyle = p.id === here ? '#fff' : 'rgba(10,12,18,.8)'; c.stroke();
      c.save(); c.translate(p.x - 8, p.y - 8); c.scale(16 / 24, 16 / 24); C.drawIcon(c, p.icon, '#fff', 2.2); c.restore();
      c.font = '700 ' + (hv ? 12 : 11) + 'px Inter, Arial'; c.textAlign = 'center';
      const label = p.id === 'casa' ? 'Sua casa' : p.name; const tw = c.measureText(label).width + 14;
      c.fillStyle = 'rgba(10,12,18,.85)'; A.rr(c, p.x - tw / 2, p.y + 19, tw, 18, 9); c.fill();
      c.fillStyle = open ? '#fff' : '#8f98ae'; c.fillText(label, p.x, p.y + 32);
    });
    // jogador
    let px, py;
    const act = G.act;
    if (act && act.id === 'viagem') {
      const pts = C.path(act.data.from, act.data.to); const total = plen(pts); let d = total * SL.Life.progress();
      px = pts[0].x; py = pts[0].y;
      for (let i = 1; i < pts.length; i++) { const sl = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); if (d <= sl) { const k = sl ? d / sl : 0; px = U.lerp(pts[i - 1].x, pts[i].x, k); py = U.lerp(pts[i - 1].y, pts[i].y, k); break; } d -= sl; px = pts[i].x; py = pts[i].y; }
      c.strokeStyle = 'rgba(180,157,255,.7)'; c.lineWidth = 3; c.setLineDash([6, 6]); c.beginPath(); pts.forEach((p0, i) => i ? c.lineTo(p0.x, p0.y) : c.moveTo(p0.x, p0.y)); c.stroke(); c.setLineDash([]);
      const tr = act.data.tr;
      if (tr === 'onibus' || tr === 'app' || tr === 'carro') { c.fillStyle = tr === 'onibus' ? '#f5c542' : '#ffffff'; A.rr(c, px - 10, py - 6, 20, 12, 3); c.fill(); c.fillStyle = '#4cc3ff'; c.fillRect(px - 7, py - 4, 14, 4); }
      else A.sprite(c, G.player.look, px, py + 6, 0.55, { walk: t * 10, dir: 'down' });
    } else {
      const p = D.placeById(here); px = p.x; py = p.y; A.sprite(c, G.player.look, px + 18, py + 10, 0.55, {});
    }
    c.restore();
  };
  C.placeAtScreen = (sx, sy) => { const x = (sx - cam.ox) / cam.s, y = (sy - cam.oy) / cam.s; let best = null; D.places.forEach(p => { if (Math.hypot(p.x - x, p.y - y) < 22) best = p.id; }); return best; };
  C.setHover = id => { hoverPlace = id; };
  C.placeScreen = id => { const p = D.placeById(id); return { x: cam.ox + p.x * cam.s, y: cam.oy + p.y * cam.s }; };

  // ---------- interior dos lugares ----------
  const SCN = {
    mercado: { floor: '#d8d2c4', wall: '#3a7a5a', props: c => { for (let i = 0; i < 4; i++) { c.fillStyle = '#8a6a4a'; c.fillRect(60 + i * 140, 90, 100, 150); for (let j = 0; j < 5; j++) { c.fillStyle = D.shirtColors[(i * 5 + j) % 12]; c.fillRect(66 + i * 140, 100 + j * 28, 88, 16); } } c.fillStyle = '#444'; c.fillRect(520, 270, 90, 40); c.fillStyle = '#35d39a'; c.fillRect(530, 260, 70, 12); } },
    restaurante: { floor: '#7a4a3a', wall: '#5a2a22', props: c => { for (let i = 0; i < 6; i++) { const x = 80 + (i % 3) * 170, y = 140 + Math.floor(i / 3) * 120; c.fillStyle = '#efe6d6'; c.beginPath(); c.arc(x, y, 34, 0, 7); c.fill(); c.fillStyle = '#d8432f'; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); } c.fillStyle = '#3a2418'; c.fillRect(520, 70, 110, 40); } },
    eletronicos: { floor: '#1c2230', wall: '#4cc3ff', props: c => { for (let i = 0; i < 3; i++) { c.fillStyle = '#2a3142'; c.fillRect(60 + i * 190, 120, 150, 60); for (let j = 0; j < 3; j++) { c.fillStyle = '#0d0f14'; c.fillRect(70 + i * 190 + j * 46, 96, 40, 28); c.fillStyle = 'hsl(' + (200 + i * 40 + j * 20) + ',60%,45%)'; c.fillRect(72 + i * 190 + j * 46, 98, 36, 22); } } c.fillStyle = '#ffb547'; c.fillRect(480, 260, 140, 30); } },
    academia: { floor: '#2a2a32', wall: '#ff4d6d', props: c => { for (let i = 0; i < 4; i++) { c.fillStyle = '#111'; c.fillRect(60 + i * 140, 110, 90, 50); c.fillStyle = '#ff4d6d'; c.fillRect(60 + i * 140, 110, 90, 6); } for (let i = 0; i < 6; i++) { c.fillStyle = '#555'; c.fillRect(80 + i * 80, 250, 50, 8); c.beginPath(); c.arc(80 + i * 80, 254, 10, 0, 7); c.arc(130 + i * 80, 254, 10, 0, 7); c.fill(); } } },
    shopping: { floor: '#e8e2f0', wall: '#c084fc', props: c => { const names = ['Moda', 'Cinema', 'Casa&Lar', 'Presentes']; for (let i = 0; i < 4; i++) { c.fillStyle = ['#c084fc', '#ff5a36', '#35d39a', '#ffb547'][i]; c.fillRect(30 + i * 160, 60, 140, 70); c.fillStyle = '#fff'; c.font = '800 16px Sora, Arial'; c.textAlign = 'center'; c.fillText(names[i], 100 + i * 160, 100); } c.fillStyle = '#a0d0ff'; c.beginPath(); c.arc(330, 250, 40, 0, 7); c.fill(); } },
    parque: { floor: '#5fae3e', wall: null, props: c => { c.fillStyle = '#c8b090'; c.beginPath(); c.ellipse(330, 230, 300, 60, 0, 0, 7); c.fill(); c.fillStyle = '#5fae3e'; c.beginPath(); c.ellipse(330, 230, 250, 30, 0, 0, 7); c.fill(); const r = U.mulberry(3); for (let i = 0; i < 14; i++) { const x = r() * 640, y = 40 + r() * 140; c.fillStyle = '#2f6a2a'; c.beginPath(); c.arc(x, y, 22, 0, 7); c.fill(); c.fillStyle = '#3f8f3a'; c.beginPath(); c.arc(x - 4, y - 4, 20, 0, 7); c.fill(); } c.fillStyle = '#7a5a3a'; c.fillRect(540, 300, 70, 10); } },
    cafeteria: { floor: '#a07a5a', wall: '#6a4a32', props: c => { c.fillStyle = '#3a2418'; c.fillRect(40, 80, 260, 50); c.fillStyle = '#222'; c.fillRect(60, 60, 40, 30); for (let i = 0; i < 4; i++) { const x = 380 + (i % 2) * 130, y = 140 + Math.floor(i / 2) * 110; c.fillStyle = '#d8c8a8'; c.beginPath(); c.arc(x, y, 26, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - 6, y - 4, 5, 0, 7); c.fill(); } } },
    amigos: { floor: '#7a6a5a', wall: '#ffb547', props: c => { c.fillStyle = '#4a5a8a'; c.fillRect(60, 200, 180, 50); c.fillStyle = '#0d0f14'; c.fillRect(400, 80, 160, 90); c.fillStyle = '#3b82f6'; c.fillRect(406, 86, 148, 78); c.fillStyle = 'rgba(200,120,160,.5)'; c.beginPath(); c.ellipse(320, 280, 120, 40, 0, 0, 7); c.fill(); } },
    expo: { floor: '#262a38', wall: '#ff5a36', props: c => { for (let i = 0; i < 5; i++) { c.fillStyle = ['#8b5cf6', '#ff5a36', '#19d3c5', '#3b82f6', '#ffb547'][i]; c.fillRect(30 + i * 125, 80, 105, 60); c.fillStyle = '#111'; c.fillRect(30 + i * 125, 140, 105, 30); } c.fillStyle = '#ff5a36'; c.fillRect(200, 250, 240, 40); } },
  };
  C.renderPlace = (c, cw, ch, t) => {
    const G = SL.G; const p = D.placeById(G.loc.place); if (!p) return;
    const s = SCN[p.kind] || SCN.parque; const VW = 660, VH = 400;
    const sc = Math.min(cw / VW, ch / VH); const ox = (cw - VW * sc) / 2, oy = (ch - VH * sc) / 2;
    cam.ps = sc; cam.pox = ox; cam.poy = oy;
    c.fillStyle = '#07080c'; c.fillRect(0, 0, cw, ch);
    c.save(); c.translate(ox, oy); c.scale(sc, sc);
    c.fillStyle = s.floor; c.fillRect(0, 0, VW, VH);
    if (s.wall) { c.fillStyle = s.wall; c.fillRect(0, 0, VW, 50); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, 44, VW, 6); }
    s.props(c);
    // pessoas
    const people = SL.Rel.presentAt(p.id).concat(SL.Rel.planHere(p.id).filter(id => !SL.Rel.presentAt(p.id).includes(id)));
    C._people = [];
    const spots = [[150, 330], [260, 300], [380, 335], [470, 300], [560, 340], [90, 280]];
    const r = U.mulberry(U.hash(p.id + SL.Clock.day()));
    for (let i = 0; i < 4; i++) { const sp = [40 + r() * 580, 220 + r() * 160]; A.sprite(c, A.randomLook(r), sp[0], sp[1], 1.1, { dir: r() < 0.5 ? 'left' : 'right', walk: Math.sin(t + i) > 0.6 ? t * 6 : 0 }); }
    people.forEach((id, i) => {
      const def = SL.Rel.def(id); if (!def) return; const sp = spots[i % spots.length];
      A.sprite(c, def.look, sp[0], sp[1], 1.25, { dir: 'down' });
      const met = SL.Rel.get(id).met;
      c.font = '700 12px Inter, Arial'; c.textAlign = 'center'; const label = met ? def.short || def.name : '?'; const tw = c.measureText(label).width + 12;
      c.fillStyle = 'rgba(10,12,18,.85)'; A.rr(c, sp[0] - tw / 2, sp[1] - 66, tw, 18, 9); c.fill(); c.fillStyle = met ? '#ffd1e6' : '#cfd3e0'; c.fillText(label, sp[0], sp[1] - 53);
      C._people.push({ id, x: sp[0], y: sp[1] });
    });
    A.sprite(c, G.player.look, 330, 385, 1.3, { dir: 'up' });
    const h = SL.Clock.hourF(); if (p.kind === 'parque' && (h >= 18.5 || h < 6)) { c.fillStyle = 'rgba(8,10,30,.45)'; c.fillRect(0, 0, VW, VH); }
    c.restore();
  };
  C.personAtScreen = (sx, sy) => { if (!C._people || !cam.ps) return null; const x = (sx - cam.pox) / cam.ps, y = (sy - cam.poy) / cam.ps; const hit = C._people.find(pp => Math.abs(pp.x - x) < 18 && y > pp.y - 62 && y < pp.y + 6); return hit ? hit.id : null; };

  // atividades de cada lugar: { id, label, desc, icon, price, min, can() -> erro|null, run() }
  C.activities = placeId => {
    const G = SL.G; const p = D.placeById(placeId); const open = C.isOpen(placeId);
    const L = []; const act = (o) => L.push(o);
    const life = (id, data, label) => () => SL.Life.start(id, data, label ? { label } : undefined);
    const pay = (v, cat, desc, then) => () => { if (!SL.Econ.spend(v, cat, desc)) return 'Dinheiro insuficiente.'; return then(); };
    if (!open) return [{ id: 'fechado', label: 'Fechado agora', desc: 'Abre das ' + p.open[0] + 'h às ' + (p.open[1] % 24) + 'h.', icon: 'clock', disabled: true }];
    SL.Rel.planHere(placeId).forEach(id => act({ id: 'plan_' + id, label: 'Encontro marcado com ' + SL.Rel.name(id), desc: (SL.Rel.INVITES[SL.Rel.get(id).plan.kind] || {}).label || 'Compromisso', icon: 'heart', hl: true, run: () => SL.Rel.startPlan(id) }));
    switch (p.kind) {
      case 'mercado':
        act({ id: 'compras', label: 'Fazer compras', desc: 'Comida vai para a sua geladeira/armário.', icon: 'cart', ui: 'mercado' });
        act({ id: 'lanche', label: 'Lanche rápido no balcão', desc: '20 min', icon: 'food', price: 12, run: pay(12, 'comida', 'Lanche no mercado', life('lanche_fora')) });
        break;
      case 'restaurante':
        act({ id: 'comer', label: 'Almoçar ou jantar', desc: '45 min · refeição completa', icon: 'utensils', price: 48, run: pay(48, 'comida', 'Refeição na Cantina', life('restaurante')) });
        break;
      case 'eletronicos':
        act({ id: 'loja', label: 'Ver equipamentos', desc: 'Compra na loja sai na hora.', icon: 'cpu', ui: 'loja_fisica' });
        Object.keys(G.equip.broken).forEach(id => { const it = D.equipById(id); if (it) act({ id: 'fix_' + id, label: 'Consertar ' + it.name, desc: 'Assistência técnica', icon: 'wrench', price: SL.Equip.repairCost(id), run: () => SL.Equip.repair(id) }); });
        break;
      case 'academia':
        if (!G.gym) act({ id: 'plano', label: 'Assinar plano mensal', desc: 'R$ 99/mês, treinos liberados', icon: 'dumbbell', price: 99, run: pay(99, 'lazer', 'Plano da academia (1º mês)', () => { G.gym = 1; return null; }) });
        act({ id: 'treinar', label: 'Treinar', desc: G.gym ? '1h · incluso no plano' : '1h · diária', icon: 'dumbbell', price: G.gym ? 0 : 25, run: G.gym ? life('academia') : pay(25, 'lazer', 'Diária da academia', life('academia')) });
        act({ id: 'vestiario', label: 'Banho no vestiário', desc: '15 min', icon: 'shower', run: life('banho') });
        break;
      case 'shopping':
        act({ id: 'passear', label: 'Passear', desc: '1h', icon: 'bag', run: life('passear') });
        act({ id: 'cinema', label: 'Cinema', desc: '2h20', icon: 'video', price: 32, run: pay(32, 'lazer', 'Cinema', life('cinema')) });
        act({ id: 'roupa', label: 'Comprar roupa e mudar o visual', desc: 'Muda sua aparência', icon: 'user', price: 140, ui: 'visual' });
        act({ id: 'presente', label: 'Comprar um presente', desc: 'Para dar a alguém', icon: 'gift', price: 90, run: pay(90, 'lazer', 'Presente', () => { G.flags.gifts = (G.flags.gifts || 0) + 1; SL.notify({ cat: 'vida', icon: 'gift', title: 'Presente comprado', text: 'Entregue numa conversa com alguém.' }); return null; }) });
        act({ id: 'casalar', label: 'Loja Casa&Lar', desc: 'Móveis e decoração na hora', icon: 'sofa', ui: 'moveis_fisica' });
        act({ id: 'praca', label: 'Praça de alimentação', desc: '20 min', icon: 'food', price: 29, run: pay(29, 'comida', 'Praça de alimentação', life('lanche_fora')) });
        break;
      case 'parque':
        act({ id: 'caminhar', label: 'Caminhar', desc: '45 min · grátis', icon: 'walk', run: life('caminhar') });
        act({ id: 'relaxar', label: 'Relaxar na grama', desc: '1h · tira o estresse', icon: 'tree', run: life('relaxar') });
        break;
      case 'cafeteria':
        act({ id: 'cafe', label: 'Tomar um café', desc: '20 min', icon: 'coffee', price: 9, run: pay(9, 'comida', 'Café no Grão Fino', life('cafe_fora')) });
        { const h = SL.Clock.hourF(); act({ id: 'turno', label: 'Trabalhar um turno', desc: '4h · R$ 19/h + gorjetas', icon: 'briefcase', disabled: h > 16 || h < 7, why: 'Turnos começam entre 7h e 16h', run: life('turno_cafe') }); }
        break;
      case 'amigos': {
        const host = p.host; const home = SL.Rel.presentAt(placeId).includes(host); const r = SL.Rel.get(host);
        act({ id: 'visitar', label: 'Fazer uma visita', desc: home ? SL.Rel.name(host) + ' está em casa' : 'Ninguém em casa agora', icon: 'users', disabled: !home || r.aff < 0, run: () => SL.Life.start('visita', { npc: host, kind: 'visita', dur: 120 }, { label: 'Visitando ' + SL.Rel.name(host) }) });
        break;
      }
      case 'expo': {
        const ev = D.expoEvents.find(x => x.md === SL.Clock.md());
        if (ev) act({ id: 'evento', label: 'Participar: ' + ev.name, desc: '4h de networking e fãs', icon: 'flag', price: G.flags.expo && G.flags.expo.name === ev.name ? 0 : ev.fee, run: pay(G.flags.expo && G.flags.expo.name === ev.name ? 0 : ev.fee, 'lazer', 'Ingresso: ' + ev.name, life('evento', G.flags.expo && G.flags.expo.name === ev.name ? G.flags.expo : { name: ev.name })) });
        else { const next = D.expoEvents.map(x => ({ x, d: SL.Clock.dayForMD(SL.Clock.day(), x.md) })).sort((a, b) => a.d - b.d)[0]; act({ id: 'sem', label: 'Nenhum evento hoje', desc: 'Próximo: ' + next.x.name + ' em ' + SL.Clock.fmtDay(next.d), icon: 'calendar', disabled: true }); }
        break;
      }
    }
    if (p.kind !== 'amigos') act({ id: 'vlog', label: 'Gravar vlog aqui', desc: 'Material bruto para vídeo', icon: 'cam', ui: 'vlog' });
    act({ id: 'foto', label: 'Tirar foto para o Connect', desc: 'Postar onde você está', icon: 'image', ui: 'foto' });
    return L;
  };
})(window.SL);

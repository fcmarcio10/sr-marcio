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
  C.isOpen = () => true;   // sem relógio: tudo aberto
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
  // com a live no ar, sair de casa pergunta e encerra a live
  C.liveGuard = fn => {
    if (!(SL.Live && SL.Live.cur) || !SL.G || SL.G.loc.area !== 'casa') return fn();
    SL.UI.confirm('Sair de casa?', 'Sua live está no ar e vai ser encerrada se você sair de casa.', () => { SL.LiveUI.finish('saiu'); fn(); }, 'Encerrar live e sair', true);
  };
  C.goOutside = then => { if (SL.Live && SL.Live.cur && SL.G.loc.area === 'casa') return C.liveGuard(() => { C.goOutside(); if (typeof then === 'function') then(); }); C.goOutsideNow(); if (typeof then === 'function') then(); };
  C.goOutsideNow = () => { const G = SL.G; const p = G.loc.area === 'casa' ? 'casa' : G.loc.place; G.loc = { area: 'cidade', place: p, tx: G.loc.tx, ty: G.loc.ty, dir: 1 }; if (SL.audio) SL.audio.play('door'); SL.bus.emit('loc'); };
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

  // ---------- mapa (nov/2026: refeito, com calçadas, prédios com telhado, árvores e pessoas no tamanho da cidade) ----------
  const ROAD = 22, CAL = 6;   // largura da rua e da calçada
  const TELHA = ['#c4664a', '#b8573c', '#d07a55'];
  const LAJE = ['#cfd3d6', '#e3d3b5', '#9fc3d6', '#a8d5ba', '#e7b2b9', '#f0d58a', '#d9c7e8', '#c9d8a8'];
  let mapa = null;   // camada parada (chão, ruas, prédios, árvores) desenhada uma vez
  const buildBlocks = () => {
    blocks = []; const r = U.mulberry(2027);
    const xs = [0].concat(ROADS_X).concat([W]), ys = [0].concat(ROADS_Y).concat([Hh]);
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) {
      const x0 = xs[i] + ROAD / 2 + CAL, x1 = xs[i + 1] - ROAD / 2 - CAL, y0 = ys[j] + ROAD / 2 + CAL, y1 = ys[j + 1] - ROAD / 2 - CAL; if (x1 - x0 < 20 || y1 - y0 < 20) continue;
      const park = (i === 3 && j === 1) || (i === 3 && j === 0);
      const items = [];
      if (park) { for (let k = 0; k < 34; k++) items.push({ tree: true, x: x0 + 6 + r() * (x1 - x0 - 12), y: y0 + 6 + r() * (y1 - y0 - 12), s: 4 + r() * 5 }); }
      else {
        let x = x0 + 2;
        while (x < x1 - 12) {
          const bw = Math.min(x1 - 2 - x, 18 + r() * 30); let y = y0 + 2;
          while (y < y1 - 12) {
            const bh = Math.min(y1 - 2 - y, 18 + r() * 34);
            const casa = r() < 0.55 && bw * bh < 900;
            items.push({ x, y, w: bw - 4, h: bh - 4, casa, c: casa ? TELHA[Math.floor(r() * TELHA.length)] : LAJE[Math.floor(r() * LAJE.length)], alt: casa ? 2 + r() * 2 : 3 + r() * 7, caixa: r() < 0.6, ar: Math.floor(r() * 3), quintal: casa && r() < 0.5 });
            y += bh;
          }
          x += bw;
        }
      }
      blocks.push({ x0, y0, x1, y1, park, items });
    }
    cars = []; for (let i = 0; i < 30; i++) { const horiz = r() < 0.5; cars.push({ horiz, lane: horiz ? ROADS_Y[Math.floor(r() * ROADS_Y.length)] : ROADS_X[Math.floor(r() * ROADS_X.length)], p: r() * (horiz ? W : Hh), v: (16 + r() * 30) * (r() < 0.5 ? -1 : 1), c: ['#e8e8e8', '#1d1f24', '#b8bcc4', '#c0392b', '#2d6cdf', '#f2f2f2', '#7a7f88', '#e0b030'][Math.floor(r() * 8)], bus: r() < 0.08 }); }
    walkers = []; for (let i = 0; i < 60; i++) { const horiz = r() < 0.5; const lane = horiz ? ROADS_Y[Math.floor(r() * ROADS_Y.length)] : ROADS_X[Math.floor(r() * ROADS_X.length)]; walkers.push({ horiz, lane: lane + (r() < 0.5 ? -1 : 1) * (ROAD / 2 + CAL / 2), p: r() * (horiz ? W : Hh), v: (2.5 + r() * 3) * (r() < 0.5 ? -1 : 1), look: A.randomLook(U.mulberry(i + 50)) }); }
    mapa = null;
  };
  const arvore = (c, x, y, s) => {
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.arc(x + s * 0.35, y + s * 0.4, s, 0, 7); c.fill();
    c.fillStyle = '#2f6b2c'; c.beginPath(); c.arc(x, y, s, 0, 7); c.fill();
    c.fillStyle = '#3f8a38'; c.beginPath(); c.arc(x - s * 0.22, y - s * 0.22, s * 0.72, 0, 7); c.fill();
    c.fillStyle = 'rgba(190,230,140,.35)'; c.beginPath(); c.arc(x - s * 0.38, y - s * 0.38, s * 0.3, 0, 7); c.fill();
  };
  const desenhaMapa = () => {
    const K = 2; const cv = document.createElement('canvas'); cv.width = W * K; cv.height = Hh * K; const c = cv.getContext('2d'); c.scale(K, K);
    const r = U.mulberry(77);
    // grama com textura
    c.fillStyle = '#4b7a3f'; c.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 2600; i++) { c.fillStyle = r() < 0.5 ? 'rgba(30,60,25,.18)' : 'rgba(150,200,100,.12)'; c.fillRect(r() * W, r() * Hh, 1 + r() * 2, 1 + r() * 2); }
    // lago com areia e brilho
    c.fillStyle = '#d8c79a'; c.beginPath(); c.ellipse(560, 70, 66, 31, 0, 0, 7); c.fill();
    const lg = c.createLinearGradient(0, 44, 0, 96); lg.addColorStop(0, '#5fb3d6'); lg.addColorStop(1, '#2f7fae'); c.fillStyle = lg; c.beginPath(); c.ellipse(560, 70, 60, 26, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(520 + i * 13, 60 + (i % 3) * 8); c.lineTo(530 + i * 13, 60 + (i % 3) * 8); c.stroke(); }
    // quadras: calçada e lote
    blocks.forEach(b => {
      c.fillStyle = '#c9c3b4'; c.fillRect(b.x0 - CAL, b.y0 - CAL, b.x1 - b.x0 + CAL * 2, b.y1 - b.y0 + CAL * 2);
      c.strokeStyle = 'rgba(0,0,0,.06)'; c.lineWidth = 0.5; for (let x = b.x0 - CAL; x < b.x1 + CAL; x += 4) { c.beginPath(); c.moveTo(x, b.y0 - CAL); c.lineTo(x, b.y0); c.moveTo(x, b.y1); c.lineTo(x, b.y1 + CAL); c.stroke(); }
      c.fillStyle = b.park ? '#5c9a46' : '#8f8a7e'; c.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
      if (b.park) {
        c.strokeStyle = '#d9c9a0'; c.lineWidth = 4; c.beginPath(); c.moveTo(b.x0, (b.y0 + b.y1) / 2); c.bezierCurveTo(b.x0 + (b.x1 - b.x0) * 0.3, b.y0 + 10, b.x0 + (b.x1 - b.x0) * 0.7, b.y1 - 10, b.x1, (b.y0 + b.y1) / 2); c.stroke();
        c.fillStyle = '#7cc0de'; c.beginPath(); c.arc((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 6, 0, 7); c.fill(); c.strokeStyle = '#e8e2d0'; c.lineWidth = 1.5; c.stroke();
      }
    });
    // ruas: asfalto, meio-fio, faixa amarela tracejada e faixas de pedestre
    c.fillStyle = '#3d4148';
    ROADS_X.forEach(x => c.fillRect(x - ROAD / 2, 0, ROAD, Hh)); ROADS_Y.forEach(y => c.fillRect(0, y - ROAD / 2, W, ROAD));
    for (let i = 0; i < 1800; i++) { const v = r() < 0.5; const x = v ? ROADS_X[Math.floor(r() * ROADS_X.length)] - ROAD / 2 + r() * ROAD : r() * W, y = v ? r() * Hh : ROADS_Y[Math.floor(r() * ROADS_Y.length)] - ROAD / 2 + r() * ROAD; c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.08)'; c.fillRect(x, y, 1, 1); }
    c.strokeStyle = '#e2c25a'; c.lineWidth = 1; c.setLineDash([5, 5]);
    ROADS_X.forEach(x => { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, Hh); c.stroke(); }); ROADS_Y.forEach(y => { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }); c.setLineDash([]);
    // cruzamentos limpos com faixa de pedestre
    ROADS_X.forEach(x => ROADS_Y.forEach(y => {
      c.fillStyle = '#3d4148'; c.fillRect(x - ROAD / 2, y - ROAD / 2, ROAD, ROAD);
      c.fillStyle = 'rgba(240,240,240,.85)';
      for (let k = -ROAD / 2 + 2; k < ROAD / 2 - 1; k += 3.2) { c.fillRect(x + k, y - ROAD / 2 - 5, 1.8, 4); c.fillRect(x + k, y + ROAD / 2 + 1, 1.8, 4); c.fillRect(x - ROAD / 2 - 5, y + k, 4, 1.8); c.fillRect(x + ROAD / 2 + 1, y + k, 4, 1.8); }
    }));
    // prédios e casas
    blocks.forEach(b => b.items.forEach(it => {
      if (it.tree) return;
      const ox = it.alt * 0.9, oy = it.alt * 1.1;
      c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(it.x + ox * 0.6, it.y + oy * 0.6, it.w, it.h);   // sombra
      if (it.quintal) { c.fillStyle = '#6aa055'; c.fillRect(it.x, it.y, it.w, it.h); }
      const w = it.quintal ? it.w * 0.7 : it.w, h = it.quintal ? it.h * 0.7 : it.h;
      c.fillStyle = U.shade(it.c, -0.28); c.fillRect(it.x, it.y + h - Math.min(3, it.alt * 0.6), w, Math.min(3, it.alt * 0.6));   // parede da frente
      if (it.casa) {
        // telhado de barro com cumeeira e telhas
        c.fillStyle = it.c; c.fillRect(it.x, it.y, w, h - 2);
        c.fillStyle = U.shade(it.c, -0.12); c.fillRect(it.x, it.y + (h - 2) / 2, w, (h - 2) / 2);
        c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 0.5; for (let yy = it.y + 2; yy < it.y + h - 2; yy += 2) { c.beginPath(); c.moveTo(it.x, yy); c.lineTo(it.x + w, yy); c.stroke(); }
        c.strokeStyle = U.shade(it.c, 0.2); c.lineWidth = 1; c.beginPath(); c.moveTo(it.x + 1, it.y + (h - 2) / 2); c.lineTo(it.x + w - 1, it.y + (h - 2) / 2); c.stroke();
      } else {
        // laje: borda, caixa d'água azul e condensadoras
        c.fillStyle = it.c; c.fillRect(it.x, it.y, w, h - 2);
        c.strokeStyle = U.shade(it.c, -0.18); c.lineWidth = 1; c.strokeRect(it.x + 0.5, it.y + 0.5, w - 1, h - 3);
        if (it.caixa && w > 10 && h > 10) { c.fillStyle = '#2f6fb5'; c.beginPath(); c.arc(it.x + w - 5, it.y + 5, 2.6, 0, 7); c.fill(); c.fillStyle = '#5b9be0'; c.beginPath(); c.arc(it.x + w - 5.5, it.y + 4.5, 1.4, 0, 7); c.fill(); }
        for (let k = 0; k < it.ar; k++) { c.fillStyle = '#e9ecef'; c.fillRect(it.x + 3 + k * 5, it.y + h - 8, 4, 3); c.fillStyle = '#9aa2ab'; c.beginPath(); c.arc(it.x + 5 + k * 5, it.y + h - 6.5, 1, 0, 7); c.fill(); }
      }
    }));
    // árvores nas calçadas e nos parques
    blocks.forEach(b => {
      if (b.park) b.items.forEach(it => arvore(c, it.x, it.y, it.s));
      else { for (let x = b.x0 + 8; x < b.x1 - 4; x += 26) { arvore(c, x, b.y0 - CAL / 2, 2.8); arvore(c, x + 13, b.y1 + CAL / 2, 2.8); } }
    });
    return cv;
  };
  const nightA = () => 0;
  C.renderMap = (c, cw, ch, t, dt) => {
    if (!blocks) buildBlocks();
    if (!mapa) mapa = desenhaMapa();
    cam.s = Math.min(cw / W, ch / Hh) * 0.98; cam.ox = (cw - W * cam.s) / 2; cam.oy = (ch - Hh * cam.s) / 2;
    c.fillStyle = '#2f4a2a'; c.fillRect(0, 0, cw, ch);
    c.save(); c.translate(cam.ox, cam.oy); c.scale(cam.s, cam.s);
    c.drawImage(mapa, 0, 0, W, Hh);
    const sp = SL.Clock.rate() > 0 ? 1 : 0.15;
    // pessoas nas calçadas (no tamanho da cidade)
    walkers.forEach(wk => {
      wk.p += wk.v * dt * sp; const L = wk.horiz ? W : Hh; if (wk.p > L) wk.p = 0; if (wk.p < 0) wk.p = L;
      const x = wk.horiz ? wk.p : wk.lane, y = wk.horiz ? wk.lane : wk.p;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(x + 0.5, y + 0.6, 1.2, 0, 7); c.fill();
      c.fillStyle = wk.look.shirt; c.beginPath(); c.arc(x, y, 1.15, 0, 7); c.fill();
      c.fillStyle = wk.look.hair || '#2a1a10'; c.beginPath(); c.arc(x, y, 0.6, 0, 7); c.fill();
    });
    // trânsito: carrinhos com para-brisa e faróis
    cars.forEach(k => {
      k.p += k.v * dt * sp; const L = k.horiz ? W : Hh; if (k.p > L + 20) k.p = -20; if (k.p < -20) k.p = L + 20;
      const x = k.horiz ? k.p : k.lane + (k.v > 0 ? -5 : 5), y = k.horiz ? k.lane + (k.v > 0 ? 5 : -5) : k.p;
      const len = k.bus ? 15 : 8, lar = k.bus ? 4.6 : 4;
      c.save(); c.translate(x, y); c.rotate(k.horiz ? (k.v > 0 ? 0 : Math.PI) : (k.v > 0 ? Math.PI / 2 : -Math.PI / 2));
      c.fillStyle = 'rgba(0,0,0,.3)'; A.rr(c, -len / 2 + 0.8, -lar / 2 + 0.9, len, lar, 1.2); c.fill();
      c.fillStyle = k.bus ? '#f2c230' : k.c; A.rr(c, -len / 2, -lar / 2, len, lar, 1.3); c.fill();
      c.fillStyle = 'rgba(25,35,50,.85)'; if (k.bus) { c.fillRect(len / 2 - 2.4, -lar / 2 + 0.6, 1.6, lar - 1.2); } else { c.fillRect(len * 0.08, -lar / 2 + 0.6, 1.6, lar - 1.2); c.fillRect(-len * 0.38, -lar / 2 + 0.7, 1.1, lar - 1.4); }
      c.fillStyle = '#fff4c0'; c.fillRect(len / 2 - 0.6, -lar / 2 + 0.4, 0.6, 0.9); c.fillRect(len / 2 - 0.6, lar / 2 - 1.3, 0.6, 0.9);
      c.restore();
    });
    // lugares (marcador com ícone e nome)
    const G = SL.G; const here = C.here();
    D.places.forEach(p => {
      const hv = hoverPlace === p.id; const R = hv ? 12 : 10;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(p.x, p.y + 2, 6, 2.4, 0, 0, 7); c.fill();
      c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y - R - 4, R, Math.PI * 0.85, Math.PI * 2.15); c.lineTo(p.x, p.y); c.closePath(); c.fill();
      c.lineWidth = 2; c.strokeStyle = p.id === here ? '#fff' : 'rgba(10,12,18,.65)'; c.stroke();
      c.save(); c.translate(p.x - R * 0.6, p.y - R - 4 - R * 0.6); c.scale(R * 1.2 / 24, R * 1.2 / 24); C.drawIcon(c, p.icon, '#fff', 2.4); c.restore();
      c.font = '600 ' + (hv ? 11 : 10) + 'px Inter, Arial'; c.textAlign = 'center';
      const label = p.id === 'casa' ? 'Sua casa' : p.name; const tw = c.measureText(label).width + 12;
      c.fillStyle = 'rgba(12,14,20,.82)'; A.rr(c, p.x - tw / 2, p.y + 5, tw, 15, 7.5); c.fill();
      c.fillStyle = '#fff'; c.fillText(label, p.x, p.y + 15.5);
    });
    // jogador no tamanho da cidade (com um anel e um marcador para achar fácil)
    const ESC = 0.16;
    let px, py;
    const act = G.act;
    const marca = (x, y) => {
      const pr = 5 + Math.sin(t * 3) * 1; c.strokeStyle = 'rgba(180,157,255,.9)'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y, pr, pr * 0.5, 0, 0, 7); c.stroke();
      c.fillStyle = '#b49dff'; c.beginPath(); c.moveTo(x, y - 9); c.lineTo(x - 2.6, y - 13.5); c.lineTo(x + 2.6, y - 13.5); c.closePath(); c.fill();
      c.font = '700 8px Inter, Arial'; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('Você', x, y - 15.5);
    };
    if (act && act.id === 'viagem') {
      const pts = C.path(act.data.from, act.data.to); const total = plen(pts); let d = total * SL.Life.progress();
      px = pts[0].x; py = pts[0].y;
      for (let i = 1; i < pts.length; i++) { const sl = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); if (d <= sl) { const k = sl ? d / sl : 0; px = U.lerp(pts[i - 1].x, pts[i].x, k); py = U.lerp(pts[i - 1].y, pts[i].y, k); break; } d -= sl; px = pts[i].x; py = pts[i].y; }
      c.strokeStyle = 'rgba(180,157,255,.75)'; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); pts.forEach((p0, i) => i ? c.lineTo(p0.x, p0.y) : c.moveTo(p0.x, p0.y)); c.stroke(); c.setLineDash([]);
      const tr = act.data.tr;
      if (tr === 'onibus' || tr === 'app' || tr === 'carro') { c.fillStyle = tr === 'onibus' ? '#f2c230' : '#ffffff'; A.rr(c, px - (tr === 'onibus' ? 7.5 : 4), py - 2.2, tr === 'onibus' ? 15 : 8, 4.4, 1.2); c.fill(); c.fillStyle = 'rgba(25,35,50,.85)'; c.fillRect(px + 1, py - 1.6, 1.4, 3.2); }
      else A.sprite(c, G.player.look, px, py + 2, ESC, { walk: t * 10, dir: px > (pts[pts.length - 1].x) ? 'left' : 'right' });
      marca(px, py);
    } else {
      const p = D.placeById(here); px = p.x + 9; py = p.y + 3;
      A.sprite(c, G.player.look, px, py, ESC, {});
      marca(px, py);
    }
    c.restore();
  };
  C.placeAtScreen = (sx, sy) => { const x = (sx - cam.ox) / cam.s, y = (sy - cam.oy) / cam.s; let best = null; D.places.forEach(p => { if (Math.abs(p.x - x) < 15 && y > p.y - 27 && y < p.y + 21) best = p.id; }); return best; };
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
    const left = cw > 900 ? 370 : 0; const aw = cw - left;
    const sc = Math.min(aw / VW, ch / VH); const ox = left + (aw - VW * sc) / 2, oy = (ch - VH * sc) / 2;
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
    for (let i = 0; i < 4; i++) { const sp = [40 + r() * 580, 220 + r() * 150]; A.sprite(c, A.randomLook(r), sp[0], sp[1], 0.72, { dir: r() < 0.5 ? 'left' : 'right', walk: Math.sin(t + i) > 0.6 ? t * 6 : 0 }); }
    people.forEach((id, i) => {
      const def = SL.Rel.def(id); if (!def) return; const sp = spots[i % spots.length];
      A.sprite(c, def.look, sp[0], sp[1], 0.8, { dir: 'down' });
      const met = SL.Rel.get(id).met;
      c.font = '700 12px Inter, Arial'; c.textAlign = 'center'; const label = met ? def.short || def.name : '?'; const tw = c.measureText(label).width + 12;
      c.fillStyle = 'rgba(10,12,18,.85)'; A.rr(c, sp[0] - tw / 2, sp[1] - 52, tw, 18, 9); c.fill(); c.fillStyle = met ? '#ffd1e6' : '#cfd3e0'; c.fillText(label, sp[0], sp[1] - 39);
      C._people.push({ id, x: sp[0], y: sp[1] });
    });
    A.sprite(c, G.player.look, 330, 372, 0.85, { dir: 'up' });
    c.restore();
  };
  C.personAtScreen = (sx, sy) => { if (!C._people || !cam.ps) return null; const x = (sx - cam.pox) / cam.ps, y = (sy - cam.poy) / cam.ps; const hit = C._people.find(pp => Math.abs(pp.x - x) < 16 && y > pp.y - 50 && y < pp.y + 6); return hit ? hit.id : null; };

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
        act({ id: 'turno', label: 'Trabalhar um turno', desc: '2h · R$ 57/h + gorjetas', icon: 'briefcase', run: life('turno_cafe') });
        break;
      case 'amigos': {
        const host = p.host; const home = SL.Rel.presentAt(placeId).includes(host); const r = SL.Rel.get(host);
        act({ id: 'visitar', label: 'Fazer uma visita', desc: home ? SL.Rel.name(host) + ' está em casa' : 'Ninguém em casa agora', icon: 'users', disabled: !home || r.aff < 0, run: () => SL.Life.start('visita', { npc: host, kind: 'visita', dur: 120 }, { label: 'Visitando ' + SL.Rel.name(host) }) });
        break;
      }
      case 'expo': {
        // sem calendário: cada semana do jogo tem um evento; com convite, o evento do convite (de graça)
        const sem = Math.floor(SL.Clock.day() / 7); const conv = G.flags.expo;
        const ev = conv ? (D.expoEvents.find(x => x.name === conv.name) || D.expoEvents[0]) : D.expoEvents[sem % D.expoEvents.length];
        if (!conv && G.flags.expoSem === sem) { const prox = D.expoEvents[(sem + 1) % D.expoEvents.length]; act({ id: 'sem', label: 'Você já foi ao evento desta semana', desc: 'O próximo é ' + prox.name, icon: 'calendar', disabled: true }); }
        else act({ id: 'evento', label: 'Participar: ' + ev.name, desc: '2h de networking e fãs', icon: 'flag', price: conv ? 0 : ev.fee, run: pay(conv ? 0 : ev.fee, 'lazer', 'Ingresso: ' + ev.name, life('evento', conv || { name: ev.name })) });
        break;
      }
    }
    act({ id: 'foto', label: 'Tirar foto para o Instagram', desc: 'Postar onde você está', icon: 'image', ui: 'foto' });
    return L;
  };
})(window.SL);

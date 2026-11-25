/* Telas dos jogos do PC refeitas (nov/2026, pedido do dono: "mais originais e mais bonitas").
   Cada tela é desenhada no código, no estilo do gênero, com HUD próprio. Substitui as de previews.js.
   As partes que não mudam (céu, cenário de fundo, chão) ficam guardadas numa tela à parte por tamanho. */
'use strict';
(function (SL) {
  const U = SL.U, A = SL.Avatar, P = SL.Preview, G = P.GAMES;
  const rr = (c, x, y, w, h, r) => A.rr(c, x, y, w, h, r);
  const lin = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; };
  const rad = (c, x, y, r0, r1, stops) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; };
  const txt = P.txt;
  const look = () => (SL.G && SL.G.player && SL.G.player.look) || A.randomLook();
  const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
  // fundo guardado: desenhado uma vez por tamanho
  const cache = {};
  const fundo = (k, w, h, fn) => {
    const key = k + w + 'x' + h; let cv = cache[key];
    if (!cv) { cv = cache[key] = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w)); cv.height = Math.max(1, Math.round(h)); fn(cv.getContext('2d'), w, h); }
    return cv;
  };
  const caixa = (c, x, y, w, h, r, cor) => { c.fillStyle = cor || 'rgba(8,10,16,.72)'; rr(c, x, y, w, h, r); c.fill(); };
  const barra = (c, x, y, w, h, f, cor, fundoCor) => { c.fillStyle = fundoCor || 'rgba(0,0,0,.55)'; rr(c, x, y, w, h, h / 2); c.fill(); if (f > 0) { c.fillStyle = cor; rr(c, x, y, Math.max(h, w * U.clamp(f, 0, 1)), h, h / 2); c.fill(); } };

  // =================== FIFA: câmera de TV com perspectiva ===================
  G.futebol = (c, w, h, s, t) => {
    const top = h * 0.3, bot = h * 1.02, half = u => u;
    const camU = 0.5 + Math.sin(t * 0.21) * 0.22;           // a câmera acompanha a jogada
    const proj = (u, v) => { const k = 0.55 + v * 0.75; const y = top + (bot - top) * (v * (0.7 + v * 0.3)); return [w / 2 + (u - camU) * w * 1.55 * k, y, k]; };
    // arquibancada e céu
    c.drawImage(fundo('fifa', w, h, (b, w, h) => {
      b.fillStyle = lin(b, 0, 0, 0, h * 0.32, ['#0d1626', '#1c2a44']); b.fillRect(0, 0, w, h);
      for (let row = 0; row < 14; row++) for (let i = 0; i < 110; i++) { const x = i * w / 100 + (row % 2) * 3, y = h * 0.05 + row * h * 0.018; b.fillStyle = ['#d94a3d', '#f2f2f2', '#3b6fd8', '#f2c94c', '#2a2f3d', '#e9e2d2'][Math.floor(hash(i, row) * 6)]; b.fillRect(x, y, w / 130, h * 0.012); }
      b.fillStyle = 'rgba(10,14,24,.35)'; b.fillRect(0, 0, w, h * 0.3);
      b.fillStyle = '#152033'; b.fillRect(0, h * 0.28, w, h * 0.03);
      for (let i = 0; i < 6; i++) { b.fillStyle = i % 2 ? '#1b5fd6' : '#e03a3a'; b.fillRect(i * w / 6, h * 0.285, w / 6 - 2, h * 0.022); b.fillStyle = 'rgba(255,255,255,.85)'; b.font = '800 ' + Math.round(h * 0.015) + 'px Inter, Arial'; b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillText(['GOLAÇO', 'BOLA 27', 'TORCIDA', 'GOLAÇO', 'BOLA 27', 'TORCIDA'][i], i * w / 6 + w / 12, h * 0.297); }
      for (let i = 0; i < 4; i++) { const g = rad(b, w * (0.12 + i * 0.25), 0, 2, w * 0.18, ['rgba(255,255,230,.35)', 'rgba(255,255,230,0)']); b.fillStyle = g; b.fillRect(0, 0, w, h * 0.3); }
    }), 0, 0);
    // gramado listrado em perspectiva
    for (let i = 0; i < 16; i++) {
      const u0 = i / 16 - 0.05, u1 = (i + 1) / 16 - 0.05;
      const a = proj(u0, 0), b = proj(u1, 0), cc = proj(u1, 1), d = proj(u0, 1);
      c.fillStyle = i % 2 ? '#2f9a4c' : '#2a8b44'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fill();
    }
    c.strokeStyle = 'rgba(255,255,255,.78)'; c.lineWidth = Math.max(1.2, h / 300);
    const linha = pts => { c.beginPath(); pts.forEach((p, i) => { const q = proj(p[0], p[1]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke(); };
    linha([[0, 0.05], [1, 0.05], [1, 0.97], [0, 0.97], [0, 0.05]]); linha([[0.5, 0.05], [0.5, 0.97]]);
    const circ = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; circ.push([0.5 + Math.cos(a) * 0.07, 0.51 + Math.sin(a) * 0.17]); } linha(circ);
    linha([[0, 0.25], [0.12, 0.25], [0.12, 0.77], [0, 0.77]]); linha([[1, 0.25], [0.88, 0.25], [0.88, 0.77], [1, 0.77]]);
    // gols
    [[0, -1], [1, 1]].forEach(([u, sd]) => { const a = proj(u, 0.42), b = proj(u, 0.6); const gh = (b[1] - a[1]) * 1.3; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] - gh); c.lineTo(b[0], b[1] - gh * 1.1); c.lineTo(b[0], b[1]); c.stroke(); c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(a[0], a[1] - gh); c.lineTo(b[0], b[1] - gh * 1.1); c.lineTo(b[0], b[1]); c.closePath(); c.fill(); });
    // bola e jogadores
    const bu = 0.5 + Math.sin(t * 0.21) * 0.3 + Math.sin(t * 0.9) * 0.04, bv = 0.5 + Math.sin(t * 0.47) * 0.32;
    const gente = [];
    for (let team = 0; team < 2; team++) for (let i = 0; i < 11; i++) {
      const hu = i === 0 ? (team ? 0.97 : 0.03) : (team ? 0.52 : 0.1) + hash(i, team) * 0.38, hv = i === 0 ? 0.51 : 0.12 + hash(i + 3, team + 7) * 0.76;
      const pull = i === 0 ? 0.05 : 0.22 + 0.08 * Math.sin(t * 0.7 + i);
      gente.push({ u: U.lerp(hu, bu, pull) + Math.sin(t * 1.3 + i * 2) * 0.006, v: U.lerp(hv, bv, pull * 0.8), team, gk: i === 0, n: i + 1 });
    }
    gente.sort((a, b) => a.v - b.v).forEach(p => {
      const q = proj(p.u, p.v); const k = q[2]; const ph = h * 0.085 * k, pw = ph * 0.38;
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(q[0], q[1], pw * 0.9, pw * 0.3, 0, 0, 7); c.fill();
      const kit = p.gk ? (p.team ? '#f2c94c' : '#1fb38a') : p.team ? '#e8433a' : '#f4f4f6', calcao = p.team ? '#f4f4f6' : '#1b2a55';
      const pern = Math.sin(t * 9 + p.n) * pw * 0.25;
      c.fillStyle = '#111'; c.fillRect(q[0] - pw * 0.35 + pern, q[1] - ph * 0.32, pw * 0.28, ph * 0.32); c.fillRect(q[0] + pw * 0.07 - pern, q[1] - ph * 0.32, pw * 0.28, ph * 0.32);
      c.fillStyle = calcao; c.fillRect(q[0] - pw * 0.45, q[1] - ph * 0.48, pw * 0.9, ph * 0.2);
      c.fillStyle = kit; rr(c, q[0] - pw * 0.5, q[1] - ph * 0.85, pw, ph * 0.4, pw * 0.2); c.fill();
      c.fillStyle = '#c9925e'; c.beginPath(); c.arc(q[0], q[1] - ph * 0.93, pw * 0.27, 0, 7); c.fill();
    });
    const bq = proj(bu, bv); const pulo = Math.abs(Math.sin(t * 2.2)) * h * 0.02;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(bq[0], bq[1], h * 0.008 * bq[2], h * 0.003, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(bq[0], bq[1] - h * 0.01 - pulo, h * 0.0095 * bq[2], 0, 7); c.fill(); c.fillStyle = '#222'; c.beginPath(); c.arc(bq[0] + 1, bq[1] - h * 0.011 - pulo, h * 0.003 * bq[2], 0, 7); c.fill();
    // jogador controlado: seta em cima
    const eu = gente.filter(p => !p.team && !p.gk).sort((a, b) => Math.hypot(a.u - bu, a.v - bv) - Math.hypot(b.u - bu, b.v - bv))[0];
    if (eu) { const q = proj(eu.u, eu.v); c.fillStyle = '#ffe14d'; c.beginPath(); c.moveTo(q[0], q[1] - h * 0.075 * q[2]); c.lineTo(q[0] - 5, q[1] - h * 0.09 * q[2]); c.lineTo(q[0] + 5, q[1] - h * 0.09 * q[2]); c.closePath(); c.fill(); }
    // placar
    if (s) {
      const fs = Math.round(h * 0.034), sig = n => (n || '???').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
      const x0 = w * 0.03, y0 = h * 0.035, bh = fs * 1.7;
      caixa(c, x0, y0, fs * 11.4, bh, 5, 'rgba(10,12,20,.9)');
      c.fillStyle = '#f4f4f6'; c.fillRect(x0 + fs * 0.4, y0 + bh * 0.25, fs * 0.35, bh * 0.5); c.fillStyle = '#e8433a'; c.fillRect(x0 + fs * 10.6, y0 + bh * 0.25, fs * 0.35, bh * 0.5);
      txt(c, sig(s.teamA), x0 + fs * 1.1, y0 + bh / 2, fs, '#fff', 'left', 800, 'Inter, Arial');
      caixa(c, x0 + fs * 4, y0 + 3, fs * 3.4, bh - 6, 3, '#ffffff'); txt(c, s.a + ' - ' + s.b, x0 + fs * 5.7, y0 + bh / 2, fs, '#111', 'center', 900, 'Inter, Arial');
      txt(c, sig(s.teamB), x0 + fs * 10.2, y0 + bh / 2, fs, '#fff', 'right', 800, 'Inter, Arial');
      caixa(c, x0 + fs * 11.6, y0, fs * 3.2, bh, 5, '#ffe14d'); txt(c, String(Math.min(90, s.min)).padStart(2, '0') + ':' + String(Math.floor(t * 7) % 60).padStart(2, '0'), x0 + fs * 13.2, y0 + bh / 2, Math.round(fs * 0.85), '#111', 'center', 800, 'JetBrains Mono, monospace');
    }
    // radar embaixo
    const rw = w * 0.2, rh = rw * 0.5, rx = w / 2 - rw / 2, ry = h * 0.95 - rh;
    caixa(c, rx, ry, rw, rh, 4, 'rgba(10,30,18,.6)'); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.strokeRect(rx + 3, ry + 3, rw - 6, rh - 6); c.beginPath(); c.moveTo(rx + rw / 2, ry + 3); c.lineTo(rx + rw / 2, ry + rh - 3); c.stroke();
    gente.forEach(p => { c.fillStyle = p.team ? '#e8433a' : '#fff'; c.fillRect(rx + 3 + p.u * (rw - 6) - 1.5, ry + 3 + p.v * (rh - 6) - 1.5, 3, 3); });
    c.fillStyle = '#ffe14d'; c.fillRect(rx + 3 + bu * (rw - 6) - 2, ry + 3 + bv * (rh - 6) - 2, 4, 4);
  };

  // =================== Fortnite: terceira pessoa, ilha colorida e HUD ===================
  G.br = (c, w, h, s, t) => {
    c.drawImage(fundo('br', w, h, (b, w, h) => {
      b.fillStyle = lin(b, 0, 0, 0, h * 0.6, ['#3a8cff', '#86c6ff', '#d9f0ff']); b.fillRect(0, 0, w, h);
      for (let i = 0; i < 7; i++) { const x = hash(i, 1) * w, y = h * (0.06 + hash(i, 2) * 0.2), r = h * (0.04 + hash(i, 3) * 0.05); b.fillStyle = 'rgba(255,255,255,.9)'; for (let k = 0; k < 4; k++) { b.beginPath(); b.arc(x + k * r * 0.9, y + Math.sin(k) * r * 0.3, r * (0.8 + (k % 2) * 0.3), 0, 7); b.fill(); } }
      b.fillStyle = '#7fb48a'; b.beginPath(); b.moveTo(0, h * 0.55); for (let i = 0; i <= 12; i++) b.lineTo(i * w / 12, h * (0.44 + hash(i, 9) * 0.08)); b.lineTo(w, h); b.lineTo(0, h); b.fill();
      b.fillStyle = '#5fa35a'; b.beginPath(); b.moveTo(0, h * 0.6); for (let i = 0; i <= 16; i++) b.lineTo(i * w / 16, h * (0.53 + hash(i, 4) * 0.05)); b.lineTo(w, h); b.lineTo(0, h); b.fill();
      b.fillStyle = lin(b, 0, h * 0.55, 0, h, ['#58b24a', '#3d8c35']); b.fillRect(0, h * 0.6, w, h * 0.4);
      for (let i = 0; i < 260; i++) { b.fillStyle = 'rgba(30,80,25,' + (0.2 + hash(i, 5) * 0.3) + ')'; const y = h * (0.62 + hash(i, 6) * 0.38); b.fillRect(hash(i, 7) * w, y, 2 + (y / h) * 3, 1.5); }
      // casinha e árvores redondas
      const hx = w * 0.12, hy = h * 0.58; b.fillStyle = '#d6c3a5'; b.fillRect(hx, hy - h * 0.1, w * 0.1, h * 0.1); b.fillStyle = '#b4473a'; b.beginPath(); b.moveTo(hx - w * 0.01, hy - h * 0.1); b.lineTo(hx + w * 0.05, hy - h * 0.17); b.lineTo(hx + w * 0.11, hy - h * 0.1); b.fill(); b.fillStyle = '#4a3a2a'; b.fillRect(hx + w * 0.04, hy - h * 0.05, w * 0.02, h * 0.05);
      [[0.3, 0.57, 1], [0.38, 0.6, 1.3], [0.86, 0.58, 1.1], [0.95, 0.63, 1.5], [0.04, 0.66, 1.6]].forEach(([x, y, k]) => { b.fillStyle = '#6b4a2a'; b.fillRect(w * x - 2 * k, h * y - h * 0.05 * k, 4 * k, h * 0.05 * k); b.fillStyle = '#2f8a3a'; b.beginPath(); b.arc(w * x, h * y - h * 0.07 * k, h * 0.045 * k, 0, 7); b.fill(); b.fillStyle = '#3fa64a'; b.beginPath(); b.arc(w * x - h * 0.012 * k, h * y - h * 0.08 * k, h * 0.025 * k, 0, 7); b.fill(); });
    }), 0, 0);
    // tempestade chegando pela direita
    const tx = w * (0.8 - (s ? (1 - s.alive / 100) * 0.25 : 0.1));
    c.fillStyle = lin(c, tx, 0, tx + w * 0.1, 0, ['rgba(140,60,255,0)', 'rgba(140,60,255,.45)']); c.fillRect(tx, 0, w - tx, h);
    c.strokeStyle = 'rgba(220,180,255,.6)'; c.lineWidth = 1.2; for (let i = 0; i < 4; i++) { const y = ((t * 60 + i * h / 4) % h); c.beginPath(); c.moveTo(tx + w * 0.1, y); c.lineTo(w, y + 10); c.stroke(); }
    // construção de madeira (rampa)
    const bx = w * 0.6, by = h * 0.62, bs = h * 0.16;
    c.fillStyle = '#c08a4a'; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bs, by - bs * 0.9); c.lineTo(bx + bs * 1.3, by - bs * 0.75); c.lineTo(bx + bs * 0.3, by + bs * 0.15); c.closePath(); c.fill();
    c.strokeStyle = '#8a5a2a'; c.lineWidth = 2; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(bx + bs * i / 4, by - bs * 0.9 * i / 4); c.lineTo(bx + bs * 0.3 + bs * i / 4, by + bs * 0.15 - bs * 0.9 * i / 4); c.stroke(); }
    c.fillStyle = '#d9a35a'; c.fillRect(bx + bs * 0.1, by - bs * 0.05, bs * 0.9, bs * 0.25); c.strokeStyle = '#8a5a2a'; c.strokeRect(bx + bs * 0.1, by - bs * 0.05, bs * 0.9, bs * 0.25);
    // inimigo ao longe
    const ex = w * (0.52 + Math.sin(t * 0.8) * 0.06), ey = h * 0.6; c.fillStyle = '#2a2240'; rr(c, ex - 3, ey - h * 0.045, 6, h * 0.045, 2); c.fill(); c.beginPath(); c.arc(ex, ey - h * 0.052, 3.4, 0, 7); c.fill();
    // personagem de costas (terceira pessoa) com mochila e arma
    const L = look(), px = w * 0.36, py = h * 0.98, sc = h / 260, bob = Math.sin(t * 6) * sc * 2;
    c.save(); c.translate(px, py + bob); c.scale(sc, sc);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, -2, 26, 6, 0, 0, 7); c.fill();
    c.fillStyle = L.pants; rr(c, -15, -50, 13, 48, 5); c.fill(); rr(c, 2, -50, 13, 48, 5); c.fill();
    c.fillStyle = L.shirt; rr(c, -20, -100, 40, 54, 12); c.fill();
    c.fillStyle = '#3a4a5a'; rr(c, -14, -96, 28, 34, 7); c.fill(); c.fillStyle = '#2a3646'; c.fillRect(-14, -78, 28, 3);
    c.fillStyle = L.skin; c.beginPath(); c.arc(24, -70, 6, 0, 7); c.fill();
    c.fillStyle = '#2b2b33'; rr(c, 18, -84, 50, 9, 3); c.fill(); c.fillStyle = '#5a6070'; c.fillRect(30, -88, 12, 5);
    c.fillStyle = L.hairColor; c.beginPath(); c.arc(0, -112, 15, 0, 7); c.fill();
    c.restore();
    // mira
    c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2; const cx = w / 2, cy = h * 0.48;
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(cx + dx * 5, cy + dy * 5); c.lineTo(cx + dx * 12, cy + dy * 12); c.stroke(); });
    // HUD: vida, escudo, itens, mapa
    const fs = Math.round(h * 0.028);
    barra(c, w * 0.03, h * 0.86, w * 0.22, h * 0.03, 1, '#4de05a'); txt(c, '100', w * 0.26, h * 0.875, fs, '#fff', 'left', 800);
    barra(c, w * 0.03, h * 0.82, w * 0.22, h * 0.022, 0.5 + 0.5 * Math.sin(t * 0.2) * 0.5 + 0.25, '#4cb8ff');
    const slots = 5, sw = h * 0.085; for (let i = 0; i < slots; i++) { const x = w * 0.97 - (slots - i) * (sw + 4), y = h * 0.84; caixa(c, x, y, sw, sw, 5, i === 1 ? 'rgba(255,255,255,.28)' : 'rgba(10,14,30,.55)'); c.strokeStyle = ['#9aa', '#4cb8ff', '#b06cff', '#ffb547', '#7cd36b'][i]; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, sw - 2, sw - 2); c.fillStyle = 'rgba(255,255,255,.75)'; if (i < 3) { c.fillRect(x + sw * 0.18, y + sw * 0.45, sw * 0.64, sw * 0.14); c.fillRect(x + sw * 0.3, y + sw * 0.55, sw * 0.12, sw * 0.18); } else { c.beginPath(); c.arc(x + sw / 2, y + sw / 2, sw * 0.18, 0, 7); c.fill(); } }
    const mr = h * 0.12, mx = w * 0.97 - mr, my = h * 0.05 + mr;
    c.save(); c.beginPath(); rr(c, mx - mr, my - mr, mr * 2, mr * 2, 6); c.clip(); c.fillStyle = '#4f9a48'; c.fillRect(mx - mr, my - mr, mr * 2, mr * 2); c.fillStyle = '#3a7ab8'; c.fillRect(mx - mr, my + mr * 0.5, mr * 2, mr); c.fillStyle = 'rgba(150,70,255,.45)'; c.fillRect(mx + mr * 0.3, my - mr, mr, mr * 2); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.arc(mx - mr * 0.1, my, mr * 0.55, 0, 7); c.stroke(); c.restore();
    c.fillStyle = '#ffe14d'; c.beginPath(); c.moveTo(mx - mr * 0.2, my - 5); c.lineTo(mx - mr * 0.2 + 4, my + 4); c.lineTo(mx - mr * 0.2 - 4, my + 4); c.closePath(); c.fill();
    if (s) { caixa(c, mx - mr, my + mr + 4, mr * 2, h * 0.05, 4); txt(c, s.alive + ' vivos  ·  ' + s.kills + ' abates', mx, my + mr + 4 + h * 0.025, fs * 0.85, '#fff', 'center', 800); }
  };

  // =================== Resident Evil: corredor com lanterna ===================
  G.terror = (c, w, h, s, t) => {
    const vx = w / 2 + Math.sin(t * 0.6) * w * 0.02, vy = h * 0.48 + Math.sin(t * 1.7) * h * 0.008;
    c.drawImage(fundo('re', w, h, (b, w, h) => {
      const vx = w / 2, vy = h * 0.48, fw = w * 0.14, fh = h * 0.2;
      b.fillStyle = '#1b1a17'; b.fillRect(0, 0, w, h);
      // paredes com papel de parede listrado
      const parede = (lado) => {
        b.save(); b.beginPath(); if (lado < 0) { b.moveTo(0, 0); b.lineTo(vx - fw, vy - fh); b.lineTo(vx - fw, vy + fh); b.lineTo(0, h); } else { b.moveTo(w, 0); b.lineTo(vx + fw, vy - fh); b.lineTo(vx + fw, vy + fh); b.lineTo(w, h); } b.closePath(); b.clip();
        b.fillStyle = lado < 0 ? '#4a3c2e' : '#3f3327'; b.fillRect(0, 0, w, h);
        for (let i = 0; i < 40; i++) { const k = i / 40, x = lado < 0 ? U.lerp(0, vx - fw, k * k) : U.lerp(w, vx + fw, k * k); b.strokeStyle = 'rgba(0,0,0,' + (0.15 + (i % 2) * 0.1) + ')'; b.lineWidth = Math.max(1, (1 - k) * 6); b.beginPath(); b.moveTo(x, 0); b.lineTo(x, h); b.stroke(); }
        b.fillStyle = 'rgba(30,20,14,.7)'; b.beginPath(); if (lado < 0) { b.moveTo(0, h * 0.68); b.lineTo(vx - fw, vy + fh * 0.45); b.lineTo(vx - fw, vy + fh); b.lineTo(0, h); } else { b.moveTo(w, h * 0.68); b.lineTo(vx + fw, vy + fh * 0.45); b.lineTo(vx + fw, vy + fh); b.lineTo(w, h); } b.fill();
        // portas
        [0.35, 0.72].forEach(k => { const x0 = lado < 0 ? U.lerp(0, vx - fw, k) : U.lerp(w, vx + fw, k), x1 = lado < 0 ? U.lerp(0, vx - fw, k + 0.12) : U.lerp(w, vx + fw, k + 0.12); const yt0 = U.lerp(h * 0.12, vy - fh * 0.6, k), yt1 = U.lerp(h * 0.12, vy - fh * 0.6, k + 0.12), yb0 = U.lerp(h, vy + fh, k), yb1 = U.lerp(h, vy + fh, k + 0.12); b.fillStyle = '#24170f'; b.beginPath(); b.moveTo(x0, yt0); b.lineTo(x1, yt1); b.lineTo(x1, yb1); b.lineTo(x0, yb0); b.closePath(); b.fill(); b.strokeStyle = '#5a3a22'; b.lineWidth = 2; b.stroke(); });
        b.restore();
      };
      parede(-1); parede(1);
      b.fillStyle = '#2a211b'; b.beginPath(); b.moveTo(0, h); b.lineTo(vx - fw, vy + fh); b.lineTo(vx + fw, vy + fh); b.lineTo(w, h); b.fill();
      for (let i = 0; i < 16; i++) { const k = i / 16; const y = U.lerp(vy + fh, h, k * k); b.strokeStyle = 'rgba(0,0,0,.35)'; b.lineWidth = 1 + k * 2; b.beginPath(); b.moveTo(0, y); b.lineTo(w, y); b.stroke(); }
      b.fillStyle = '#211a15'; b.beginPath(); b.moveTo(0, 0); b.lineTo(vx - fw, vy - fh); b.lineTo(vx + fw, vy - fh); b.lineTo(w, 0); b.fill();
      b.fillStyle = '#0a0807'; b.fillRect(vx - fw, vy - fh, fw * 2, fh * 2);
      // sangue no chão e na parede
      b.fillStyle = 'rgba(110,10,14,.75)'; b.beginPath(); b.ellipse(w * 0.6, h * 0.86, w * 0.08, h * 0.03, 0.1, 0, 7); b.fill(); for (let i = 0; i < 8; i++) { b.beginPath(); b.arc(w * (0.52 + hash(i, 1) * 0.2), h * (0.8 + hash(i, 2) * 0.12), 2 + hash(i, 3) * 4, 0, 7); b.fill(); }
      b.strokeStyle = 'rgba(110,10,14,.6)'; b.lineWidth = 5; b.beginPath(); b.moveTo(w * 0.2, h * 0.4); b.bezierCurveTo(w * 0.24, h * 0.45, w * 0.22, h * 0.5, w * 0.27, h * 0.55); b.stroke();
    }), vx - w / 2, vy - h * 0.48);
    // vulto no fundo
    const vulto = (Math.sin(t * 0.35) + 1) / 2;
    if (vulto > 0.6) { c.fillStyle = 'rgba(8,6,6,' + ((vulto - 0.6) * 2.2) + ')'; c.beginPath(); c.ellipse(vx + w * 0.02, vy + h * 0.08, w * 0.014, h * 0.09, 0, 0, 7); c.fill(); c.beginPath(); c.arc(vx + w * 0.02, vy - h * 0.03, w * 0.01, 0, 7); c.fill(); }
    // escuridão com o cone da lanterna (pisca às vezes)
    const fl = 0.92 + Math.sin(t * 13) * 0.04 - (Math.sin(t * 2.3) > 0.985 ? 0.6 : 0);
    const lx = w * 0.5 + Math.sin(t * 0.9) * w * 0.05, ly = h * 0.55 + Math.cos(t * 0.7) * h * 0.04;
    c.fillStyle = rad(c, lx, ly, h * 0.05, h * 0.62, ['rgba(0,0,0,0)', 'rgba(0,0,0,' + (0.62 - 0.3 * fl) + ')', 'rgba(0,0,0,.86)']); c.fillRect(0, 0, w, h);
    c.fillStyle = rad(c, lx, ly, 2, h * 0.3, ['rgba(255,236,190,' + 0.16 * fl + ')', 'rgba(255,236,190,0)']); c.fillRect(0, 0, w, h);
    // susto
    if (s && s.last && s.last[0] && s.last[0].type === 'jumpscare' && (SL.G.time.t - s.last[0].at) < 1) {
      c.fillStyle = 'rgba(120,0,0,.35)'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#d8d2c8'; c.beginPath(); c.ellipse(w / 2, h * 0.5, w * 0.16, h * 0.34, 0, 0, 7); c.fill();
      c.fillStyle = '#000'; c.beginPath(); c.ellipse(w * 0.455, h * 0.42, w * 0.03, h * 0.06, 0.2, 0, 7); c.ellipse(w * 0.545, h * 0.42, w * 0.03, h * 0.06, -0.2, 0, 7); c.ellipse(w / 2, h * 0.64, w * 0.05, h * 0.11, 0, 0, 7); c.fill();
    }
    // granulado e HUD discreto
    for (let i = 0; i < 90; i++) { c.fillStyle = 'rgba(255,255,255,' + (hash(i, Math.floor(t * 12)) * 0.06) + ')'; c.fillRect(hash(i, Math.floor(t * 12) + 1) * w, hash(i + 9, Math.floor(t * 12)) * h, 2, 2); }
    if (s) {
      txt(c, 'CAPÍTULO ' + s.ch, w * 0.04, h * 0.07, Math.round(h * 0.03), 'rgba(230,210,200,.75)', 'left', 600, 'JetBrains Mono, monospace');
      const ox = w * 0.05, oy = h * 0.9; c.strokeStyle = 'rgba(80,220,120,.85)'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i <= 60; i++) { const x = ox + i * w * 0.003; const ph = (i / 60 + t * 0.6) % 1; const y = oy - (ph > 0.45 && ph < 0.5 ? h * 0.04 : ph > 0.5 && ph < 0.54 ? -h * 0.02 : 0); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      txt(c, 'BEM', ox, oy + h * 0.035, Math.round(h * 0.024), 'rgba(80,220,120,.85)', 'left', 700, 'JetBrains Mono, monospace');
      txt(c, '9 / 15', w * 0.95, h * 0.92, Math.round(h * 0.035), 'rgba(230,220,210,.8)', 'right', 700, 'JetBrains Mono, monospace');
    }
  };

  // =================== Forza: estrada com curvas (pseudo 3D), pôr do sol e velocímetro ===================
  G.corrida = (c, w, h, s, t) => {
    const hz = h * 0.45;
    c.drawImage(fundo('forza', w, h, (b, w, h) => {
      const hz = h * 0.45;
      b.fillStyle = lin(b, 0, 0, 0, hz, ['#3a2a6a', '#e0607a', '#ffb36b', '#ffe2a8']); b.fillRect(0, 0, w, hz + 2);
      b.fillStyle = 'rgba(255,240,200,.95)'; b.beginPath(); b.arc(w * 0.62, hz * 0.86, h * 0.08, 0, 7); b.fill();
      b.fillStyle = '#5a3a6a'; b.beginPath(); b.moveTo(0, hz); for (let i = 0; i <= 10; i++) b.lineTo(i * w / 10, hz - h * (0.05 + hash(i, 2) * 0.1)); b.lineTo(w, hz); b.fill();
      b.fillStyle = '#3e5a3a'; b.beginPath(); b.moveTo(0, hz); for (let i = 0; i <= 20; i++) b.lineTo(i * w / 20, hz - h * (0.01 + hash(i, 5) * 0.035)); b.lineTo(w, hz); b.fill();
    }), 0, 0);
    // estrada: linhas da horizontal para baixo, com curva que muda com o tempo
    const N = 70, vel = t * 5.5; let curva = 0, dx = 0;
    const segs = [];
    for (let i = 0; i < N; i++) {
      const k = i / N; const y = hz + (h - hz) * Math.pow(k, 1.9); const z = 1 / (k + 0.02);
      const curv = Math.sin((vel + z * 0.18) * 0.12) * 0.9;
      segs.push({ y, k, z, curv });
    }
    for (let i = N - 1; i >= 0; i--) { const sg = segs[i]; dx += sg.curv * (1 - sg.k) * 0.9; sg.x = w / 2 + dx * w * 0.007 * (1 - sg.k) - Math.sin(vel * 0.12) * w * 0.05 * (1 - sg.k); }
    for (let i = 1; i < N; i++) {
      const a = segs[i - 1], b = segs[i]; const listra = Math.floor(b.z * 0.9 + vel * 2) % 2;
      const wa = w * 0.02 + a.k * w * 0.85, wb = w * 0.02 + b.k * w * 0.85;
      c.fillStyle = listra ? '#4f7a3a' : '#5a8a42'; c.fillRect(0, a.y, w, b.y - a.y + 1);
      const quad = (fa, fb, cor) => { c.fillStyle = cor; c.beginPath(); c.moveTo(a.x - wa * fa, a.y); c.lineTo(a.x + wa * fa, a.y); c.lineTo(b.x + wb * fb, b.y + 1); c.lineTo(b.x - wb * fb, b.y + 1); c.closePath(); c.fill(); };
      quad(0.62, 0.62, listra ? '#e8e8e8' : '#d8342c');
      quad(0.55, 0.55, listra ? '#3c3d45' : '#41424b');
      if (listra) quad(0.02, 0.02, '#f2f2f2');
    }
    // árvores e placas na beira (de longe para perto)
    for (let i = 8; i < N; i += 9) { const sg = segs[i]; const ww = w * 0.02 + sg.k * w * 0.85; const sz = sg.k * h * 0.28; [-1, 1].forEach(sd => { const x = sg.x + sd * ww * 0.85; const ph = (Math.floor(sg.z * 0.9 + vel * 2) + i) % 3; if (ph === 0) { c.fillStyle = '#5a3a22'; c.fillRect(x - sz * 0.04, sg.y - sz * 0.6, sz * 0.08, sz * 0.6); c.fillStyle = '#2f6a34'; c.beginPath(); c.arc(x, sg.y - sz * 0.7, sz * 0.25, 0, 7); c.fill(); c.fillStyle = '#3e8a44'; c.beginPath(); c.arc(x - sz * 0.07, sg.y - sz * 0.78, sz * 0.12, 0, 7); c.fill(); } else if (ph === 1) { c.fillStyle = '#ddd'; c.fillRect(x - 1, sg.y - sz * 0.4, 2, sz * 0.4); c.fillStyle = '#ff7a1a'; rr(c, x - sz * 0.14, sg.y - sz * 0.55, sz * 0.28, sz * 0.18, 2); c.fill(); } }); }
    // carro adversário à frente
    const op = segs[Math.round(N * 0.42)]; const ow = (w * 0.02 + op.k * w * 0.85) * 0.22; const ox = op.x + Math.sin(t * 0.7) * ow * 1.2;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(ox, op.y, ow * 0.6, ow * 0.12, 0, 0, 7); c.fill(); c.fillStyle = '#2a6be0'; rr(c, ox - ow / 2, op.y - ow * 0.45, ow, ow * 0.4, ow * 0.08); c.fill(); c.fillStyle = '#1a1c24'; rr(c, ox - ow * 0.34, op.y - ow * 0.62, ow * 0.68, ow * 0.2, ow * 0.05); c.fill(); c.fillStyle = '#ff3b3b'; c.fillRect(ox - ow * 0.45, op.y - ow * 0.3, ow * 0.15, ow * 0.06); c.fillRect(ox + ow * 0.3, op.y - ow * 0.3, ow * 0.15, ow * 0.06);
    // seu carro (traseira)
    const cw = w * 0.24, cx = w / 2 + Math.sin(vel * 0.12) * w * 0.015, cyy = h * 0.93 + Math.sin(t * 17) * 1.2; const inc = -Math.sin(vel * 0.12) * 0.04;
    c.save(); c.translate(cx, cyy); c.rotate(inc);
    c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(0, 0, cw * 0.58, cw * 0.08, 0, 0, 7); c.fill();
    c.fillStyle = '#16171c'; rr(c, -cw * 0.5, -cw * 0.16, cw * 0.16, cw * 0.16, 4); c.fill(); rr(c, cw * 0.34, -cw * 0.16, cw * 0.16, cw * 0.16, 4); c.fill();
    c.fillStyle = lin(c, 0, -cw * 0.36, 0, 0, ['#ff4a3a', '#b81e1a']); rr(c, -cw * 0.52, -cw * 0.36, cw * 1.04, cw * 0.26, cw * 0.06); c.fill();
    c.fillStyle = '#c42a22'; c.beginPath(); c.moveTo(-cw * 0.36, -cw * 0.36); c.lineTo(-cw * 0.26, -cw * 0.52); c.lineTo(cw * 0.26, -cw * 0.52); c.lineTo(cw * 0.36, -cw * 0.36); c.fill();
    c.fillStyle = '#1c2230'; c.beginPath(); c.moveTo(-cw * 0.31, -cw * 0.37); c.lineTo(-cw * 0.23, -cw * 0.49); c.lineTo(cw * 0.23, -cw * 0.49); c.lineTo(cw * 0.31, -cw * 0.37); c.fill();
    c.fillStyle = '#111'; c.fillRect(-cw * 0.5, -cw * 0.56, cw, cw * 0.04); c.fillRect(-cw * 0.4, -cw * 0.53, cw * 0.03, cw * 0.06); c.fillRect(cw * 0.37, -cw * 0.53, cw * 0.03, cw * 0.06);
    c.fillStyle = '#ff2a2a'; rr(c, -cw * 0.48, -cw * 0.3, cw * 0.2, cw * 0.06, 3); c.fill(); rr(c, cw * 0.28, -cw * 0.3, cw * 0.2, cw * 0.06, 3); c.fill();
    c.fillStyle = '#f2f2f2'; rr(c, -cw * 0.09, -cw * 0.24, cw * 0.18, cw * 0.06, 2); c.fill(); c.fillStyle = '#111'; txt(c, 'BR 27', 0, -cw * 0.21, Math.round(cw * 0.04), '#111', 'center', 800, 'JetBrains Mono, monospace');
    c.fillStyle = '#2b2c33'; c.fillRect(-cw * 0.2, -cw * 0.13, cw * 0.4, cw * 0.05); c.fillStyle = '#888'; c.beginPath(); c.arc(-cw * 0.16, -cw * 0.1, cw * 0.025, 0, 7); c.arc(cw * 0.16, -cw * 0.1, cw * 0.025, 0, 7); c.fill();
    c.restore();
    // velocímetro
    const kmh = Math.round(178 + Math.sin(t * 0.8) * 28 + Math.sin(t * 2.3) * 6); const r = h * 0.13, gx = w * 0.88, gy = h * 0.84;
    c.fillStyle = 'rgba(8,10,18,.75)'; c.beginPath(); c.arc(gx, gy, r * 1.08, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = r * 0.12; c.beginPath(); c.arc(gx, gy, r * 0.85, Math.PI * 0.75, Math.PI * 2.25); c.stroke();
    c.strokeStyle = lin(c, gx - r, 0, gx + r, 0, ['#4de0ff', '#ffe14d', '#ff3b3b']); c.beginPath(); c.arc(gx, gy, r * 0.85, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * kmh / 300)); c.stroke();
    txt(c, String(kmh), gx, gy - r * 0.05, Math.round(r * 0.5), '#fff', 'center', 900, 'Inter, Arial'); txt(c, 'KM/H', gx, gy + r * 0.35, Math.round(r * 0.18), 'rgba(255,255,255,.7)', 'center', 700);
    txt(c, String(5 + Math.floor((kmh - 150) / 40)), gx, gy + r * 0.72, Math.round(r * 0.26), '#ffe14d', 'center', 900, 'JetBrains Mono, monospace');
    if (s) { caixa(c, w * 0.03, h * 0.04, w * 0.16, h * 0.17, 6); txt(c, s.pos + 'º', w * 0.05, h * 0.105, Math.round(h * 0.075), '#fff', 'left', 900, 'Inter, Arial'); txt(c, '/ 12', w * 0.115, h * 0.115, Math.round(h * 0.03), 'rgba(255,255,255,.6)', 'left', 700); txt(c, 'VOLTA ' + Math.min(s.lap, s.laps) + '/' + s.laps, w * 0.05, h * 0.175, Math.round(h * 0.028), '#ffe14d', 'left', 800, 'JetBrains Mono, monospace'); }
  };

  // =================== League of Legends: mapa visto de cima, campeão e barra de habilidades ===================
  G.moba = (c, w, h, s, t) => {
    c.drawImage(fundo('lol', w, h, (b, w, h) => {
      b.fillStyle = '#2c4a2a'; b.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { b.fillStyle = 'rgba(' + (hash(i, 1) > 0.5 ? '70,110,50' : '30,60,30') + ',.5)'; b.fillRect(hash(i, 2) * w, hash(i, 3) * h, 3, 3); }
      // rio na diagonal
      b.strokeStyle = '#2f6f8f'; b.lineWidth = h * 0.16; b.lineCap = 'round'; b.beginPath(); b.moveTo(-w * 0.1, h * 0.2); b.quadraticCurveTo(w * 0.45, h * 0.62, w * 1.1, h * 0.75); b.stroke();
      b.strokeStyle = 'rgba(140,210,230,.25)'; b.lineWidth = h * 0.1; b.stroke();
      // trilha da rota
      b.strokeStyle = '#8d7a58'; b.lineWidth = h * 0.13; b.beginPath(); b.moveTo(-w * 0.05, h * 1.05); b.lineTo(w * 1.05, -h * 0.05); b.stroke(); b.strokeStyle = 'rgba(0,0,0,.12)'; b.lineWidth = h * 0.13; b.setLineDash([6, 10]); b.stroke(); b.setLineDash([]);
      // pedras e arbustos
      for (let i = 0; i < 22; i++) { const x = hash(i, 4) * w, y = hash(i, 5) * h; if (Math.abs((x / w) + (y / h) - 1) < 0.18) continue; b.fillStyle = i % 3 ? '#1e3a1e' : '#4a4a48'; b.beginPath(); b.arc(x, y, h * (0.03 + hash(i, 6) * 0.04), 0, 7); b.fill(); b.fillStyle = i % 3 ? '#2d522a' : '#666'; b.beginPath(); b.arc(x - 3, y - 3, h * 0.02, 0, 7); b.fill(); }
      // torres
      [[0.22, 0.8, '#3a7ad8'], [0.8, 0.22, '#d83a4a']].forEach(([x, y, cor]) => { b.fillStyle = 'rgba(0,0,0,.35)'; b.beginPath(); b.ellipse(w * x + 6, h * y + 6, h * 0.06, h * 0.03, 0, 0, 7); b.fill(); b.fillStyle = '#8a8f9c'; b.beginPath(); b.arc(w * x, h * y, h * 0.05, 0, 7); b.fill(); b.fillStyle = '#5a5f6c'; b.beginPath(); b.arc(w * x, h * y, h * 0.032, 0, 7); b.fill(); b.fillStyle = cor; b.beginPath(); b.arc(w * x, h * y, h * 0.018, 0, 7); b.fill(); });
    }), 0, 0);
    // tropas indo e voltando
    const tropa = (x, y, cor) => { c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x, y + 3, 5, 2, 0, 0, 7); c.fill(); c.fillStyle = cor; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); c.fillStyle = '#222'; c.fillRect(x - 5, y - 9, 10, 2); c.fillStyle = cor; c.fillRect(x - 5, y - 9, 10 * (0.5 + 0.5 * Math.sin(x)), 2); };
    const meio = 0.5 + Math.sin(t * 0.1) * 0.08;
    for (let i = 0; i < 6; i++) { const p = meio - 0.06 - i * 0.025 + Math.sin(t * 2 + i) * 0.005; tropa(w * p, h * (1 - p) + (i % 2 ? 6 : -6), '#4c8dff'); const q = meio + 0.06 + i * 0.025; tropa(w * q, h * (1 - q) + (i % 2 ? 6 : -6), '#ff5a5a'); }
    // efeitos de habilidade
    const cx = w * (meio - 0.08), cy = h * (1 - meio + 0.08); const pulso = (t * 0.8) % 1;
    c.strokeStyle = 'rgba(120,220,255,' + (1 - pulso) + ')'; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, cy, h * 0.18 * pulso, h * 0.1 * pulso, 0, 0, 7); c.stroke();
    const tiro = (t * 1.3) % 1; c.fillStyle = 'rgba(160,230,255,.9)'; c.beginPath(); c.arc(U.lerp(cx, w * (meio + 0.08), tiro), U.lerp(cy - 8, h * (1 - meio - 0.08), tiro), 5, 0, 7); c.fill();
    // campeão (o seu)
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(cx, cy + 6, 12, 5, 0, 0, 7); c.fill();
    c.strokeStyle = '#4ce0ff'; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy + 5, 14, 6, 0, 0, 7); c.stroke();
    A.sprite(c, look(), cx, cy + 6, h / 160, { walk: t * 5, dir: 'right' });
    c.fillStyle = '#111'; c.fillRect(cx - 20, cy - h * 0.13, 40, 6); c.fillStyle = '#3ad15a'; c.fillRect(cx - 19, cy - h * 0.13 + 1, 38 * (0.6 + 0.3 * Math.sin(t * 0.3)), 4); c.fillStyle = '#3a8cff'; c.fillRect(cx - 19, cy - h * 0.13 + 6, 38 * 0.7, 2);
    txt(c, '14', cx - 26, cy - h * 0.125, 9, '#ffe14d', 'center', 800);
    // HUD: KDA, barra de habilidades, minimapa
    const fs = Math.round(h * 0.03);
    caixa(c, w / 2 - w * 0.12, 4, w * 0.24, h * 0.06, 5); txt(c, (s ? s.k : 0) + ' / ' + (s ? s.d : 0) + ' / ' + (s ? Math.round((s.k || 0) * 1.4) : 0), w / 2, 4 + h * 0.03, fs, '#fff', 'center', 800, 'JetBrains Mono, monospace');
    const sl = h * 0.09, bxx = w / 2 - (sl * 4 + 18) / 2, byy = h * 0.88;
    caixa(c, bxx - 10, byy - 8, sl * 4 + 38, sl + 16, 8, 'rgba(12,16,26,.85)');
    ['Q', 'W', 'E', 'R'].forEach((k, i) => {
      const x = bxx + i * (sl + 6), cd = ((t * 0.4 + i * 0.27) % 1);
      c.fillStyle = ['#2f7ad8', '#8a3ad8', '#3ab07a', '#d8a23a'][i]; rr(c, x, byy, sl, sl, 5); c.fill();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x + sl / 2, byy + sl / 2, sl * 0.25, 0, 7); c.fill();
      if (cd < 0.5) { c.fillStyle = 'rgba(0,0,0,.6)'; c.beginPath(); c.moveTo(x + sl / 2, byy + sl / 2); c.arc(x + sl / 2, byy + sl / 2, sl * 0.72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - cd * 2)); c.closePath(); c.save(); c.clip(); c.fillRect(x, byy, sl, sl); c.restore(); }
      c.strokeStyle = '#c8aa6e'; c.lineWidth = 1.5; rr(c, x, byy, sl, sl, 5); c.stroke(); txt(c, k, x + 4, byy + sl - 6, Math.round(sl * 0.24), '#fff', 'left', 800);
    });
    const ms = h * 0.24, mx = w - ms - 6, my = h - ms - 6; c.fillStyle = '#1d2e1c'; c.fillRect(mx, my, ms, ms); c.strokeStyle = '#c8aa6e'; c.lineWidth = 2; c.strokeRect(mx, my, ms, ms);
    c.strokeStyle = '#8d7a58'; c.lineWidth = 3; c.beginPath(); c.moveTo(mx + 6, my + ms - 6); c.lineTo(mx + ms - 6, my + 6); c.moveTo(mx + 6, my + ms - 6); c.lineTo(mx + 6, my + 6); c.lineTo(mx + ms - 6, my + 6); c.moveTo(mx + 6, my + ms - 6); c.lineTo(mx + ms - 6, my + ms - 6); c.lineTo(mx + ms - 6, my + 6); c.stroke();
    c.fillStyle = '#4c8dff'; c.beginPath(); c.arc(mx + 10, my + ms - 10, 6, 0, 7); c.fill(); c.fillStyle = '#ff5a5a'; c.beginPath(); c.arc(mx + ms - 10, my + 10, 6, 0, 7); c.fill();
    c.fillStyle = '#4ce0ff'; c.beginPath(); c.arc(mx + ms * meio, my + ms * (1 - meio), 3.5, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1; c.strokeRect(mx + ms * meio - 14, my + ms * (1 - meio) - 10, 28, 20);
  };

  // =================== Minecraft: primeira pessoa, mundo de blocos e barra de itens ===================
  G.sandbox = (c, w, h, s, t) => {
    c.imageSmoothingEnabled = false;
    c.drawImage(fundo('mc', w, h, (b, w, h) => {
      b.fillStyle = lin(b, 0, 0, 0, h * 0.6, ['#78a7ff', '#a9c8ff', '#cfe0ff']); b.fillRect(0, 0, w, h);
      b.fillStyle = '#fff8d0'; b.fillRect(w * 0.76, h * 0.08, h * 0.09, h * 0.09);
      for (let i = 0; i < 5; i++) { b.fillStyle = 'rgba(255,255,255,.92)'; const x = hash(i, 1) * w, y = h * (0.06 + hash(i, 2) * 0.12), u = h * 0.03; for (let k = 0; k < 4; k++) b.fillRect(x + k * u * 1.5, y + (k % 2) * u * 0.5, u * 2.2, u); }
      // três camadas de morros de blocos (de longe para perto)
      [[0.42, 0.016, '#6b9a8a', '#5d8a7a', 1], [0.5, 0.024, '#5fae3e', '#7a5a3a', 2], [0.6, 0.04, '#5fae3e', '#8a5a3a', 3]].forEach(([base, u, topo, terra, seed]) => {
        const bs = h * u * 2; for (let x = 0; x < w / bs + 1; x++) {
          const alt = Math.round(3 + Math.sin(x * 0.35 + seed) * 2 + hash(x, seed) * 2); const y0 = h * base - alt * bs;
          for (let y = y0; y < h; y += bs) { b.fillStyle = y === y0 ? topo : y < y0 + bs * 3 ? terra : '#7d7f86'; b.fillRect(x * bs, y, bs, bs); b.fillStyle = 'rgba(0,0,0,.07)'; b.fillRect(x * bs, y + bs - 1, bs, 1); b.fillRect(x * bs + bs - 1, y, 1, bs); if (y === y0) { b.fillStyle = 'rgba(255,255,255,.12)'; b.fillRect(x * bs, y, bs, bs * 0.25); } }
          if (seed === 2 && x % 9 === 4) { b.fillStyle = '#6b4a2a'; b.fillRect(x * bs, y0 - bs * 3, bs, bs * 3); b.fillStyle = '#3f8f3a'; b.fillRect(x * bs - bs * 2, y0 - bs * 6, bs * 5, bs * 3); b.fillRect(x * bs - bs, y0 - bs * 7, bs * 3, bs); }
        }
        if (seed === 1) { b.fillStyle = 'rgba(160,190,230,.35)'; b.fillRect(0, 0, w, h * base + 4); }
      });
      // água
      b.fillStyle = 'rgba(50,100,220,.75)'; b.fillRect(w * 0.05, h * 0.72, w * 0.25, h * 0.05);
    }), 0, 0);
    // casa que você está construindo (cresce com o progresso)
    const prog = s ? s.prog / 100 : 0.5, bs = h * 0.065, ox = w * 0.5, oy = h * 0.6;
    const linhas = Math.max(1, Math.round(prog * 6));
    for (let y = 0; y < linhas; y++) for (let x = 0; x < 7; x++) {
      const tipo = y === 5 ? 'telhado' : (x === 3 && y < 2) ? 'porta' : (y === 2 && (x === 1 || x === 5)) ? 'vidro' : (x === 0 || x === 6) ? 'tronco' : 'tabua';
      const X = ox + x * bs, Y = oy - (y + 1) * bs;
      c.fillStyle = { telhado: '#8a5a3a', porta: '#6b4a2a', vidro: '#bfe3ff', tronco: '#5a3f24', tabua: '#c89a5a' }[tipo]; c.fillRect(X, Y, bs, bs);
      c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(X, Y + bs * 0.48, bs, 2); if (tipo === 'tabua') c.fillRect(X + bs * ((x + y) % 2 ? 0.3 : 0.7), Y, 2, bs * 0.5);
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.strokeRect(X + 0.5, Y + 0.5, bs - 1, bs - 1);
    }
    // bloco sendo colocado (contorno piscando)
    const nx = ox + (Math.floor(t * 2) % 7) * bs, ny = oy - (linhas + 1) * bs; c.strokeStyle = 'rgba(0,0,0,' + (0.5 + 0.4 * Math.sin(t * 8)) + ')'; c.lineWidth = 2; c.strokeRect(nx, ny, bs, bs);
    // mão segurando a picareta (balança)
    const sw = Math.max(0, Math.sin(t * 7)) * 0.5; c.save(); c.translate(w * 0.82, h * 1.02); c.rotate(-0.5 - sw);
    c.fillStyle = '#6b4a2a'; c.fillRect(-h * 0.02, -h * 0.34, h * 0.04, h * 0.3); c.fillStyle = '#5ad0d8'; c.fillRect(-h * 0.12, -h * 0.38, h * 0.24, h * 0.05); c.fillRect(-h * 0.14, -h * 0.35, h * 0.05, h * 0.05); c.fillRect(h * 0.09, -h * 0.35, h * 0.05, h * 0.05);
    c.fillStyle = look().skin; c.fillRect(-h * 0.05, -h * 0.12, h * 0.1, h * 0.16); c.restore();
    // mira, corações, fome e barra de itens
    c.fillStyle = '#fff'; c.fillRect(w / 2 - 7, h / 2 - 1, 14, 2); c.fillRect(w / 2 - 1, h / 2 - 7, 2, 14);
    const sl = h * 0.075, hx = w / 2 - sl * 4.5, hy = h - sl - 6;
    for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(60,60,60,.75)'; c.fillRect(hx + i * sl, hy, sl, sl); c.strokeStyle = i === 2 ? '#fff' : '#222'; c.lineWidth = i === 2 ? 3 : 2; c.strokeRect(hx + i * sl + 1, hy + 1, sl - 2, sl - 2); c.fillStyle = ['#5ad0d8', '#9a9a9a', '#c89a5a', '#5a3f24', '#bfe3ff', '#8a5a3a', '#e03030', '#3f8f3a', '#ffd34d'][i]; c.fillRect(hx + i * sl + sl * 0.25, hy + sl * 0.25, sl * 0.5, sl * 0.5); }
    for (let i = 0; i < 10; i++) { const x = hx + i * sl * 0.42, y = hy - sl * 0.55; c.fillStyle = i < 9 ? '#e0202a' : '#4a1010'; c.fillRect(x, y, sl * 0.16, sl * 0.14); c.fillRect(x + sl * 0.2, y, sl * 0.16, sl * 0.14); c.fillRect(x + sl * 0.03, y + sl * 0.12, sl * 0.3, sl * 0.12); c.fillRect(x + sl * 0.1, y + sl * 0.22, sl * 0.16, sl * 0.08); }
    for (let i = 0; i < 10; i++) { const x = hx + sl * 9 - (i + 1) * sl * 0.42, y = hy - sl * 0.55; c.fillStyle = '#b07a3a'; c.fillRect(x + sl * 0.05, y, sl * 0.28, sl * 0.3); c.fillStyle = '#e8d8c0'; c.fillRect(x, y + sl * 0.18, sl * 0.1, sl * 0.1); }
    c.fillStyle = '#7ce03a'; c.fillRect(hx, hy - sl * 0.18, sl * 9 * 0.62, 4); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(hx + sl * 9 * 0.62, hy - sl * 0.18, sl * 9 * 0.38, 4);
    if (s) txt(c, s.proj + '  ' + Math.round(s.prog) + '%', w * 0.03, h * 0.07, Math.round(h * 0.035), '#fff', 'left', 700, 'JetBrains Mono, monospace');
    c.imageSmoothingEnabled = true;
  };

  // =================== Street Fighter: palco de rua, golpes e barras ===================
  G.luta = (c, w, h, s, t) => {
    c.drawImage(fundo('sf', w, h, (b, w, h) => {
      b.fillStyle = lin(b, 0, 0, 0, h * 0.7, ['#140c2a', '#3a1a4a', '#8a2a5a']); b.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) { const bw = w * (0.08 + hash(i, 1) * 0.07), bh = h * (0.25 + hash(i, 2) * 0.35), x = i * w / 8 - 10; b.fillStyle = '#1a1028'; b.fillRect(x, h * 0.72 - bh, bw, bh); for (let k = 0; k < 18; k++) { if (hash(i, k) > 0.55) { b.fillStyle = hash(k, i) > 0.5 ? 'rgba(255,200,90,.7)' : 'rgba(120,200,255,.5)'; b.fillRect(x + 4 + (k % 3) * bw * 0.3, h * 0.72 - bh + 8 + Math.floor(k / 3) * bh * 0.14, bw * 0.15, bh * 0.06); } } }
      // letreiros neon
      [['LUTA', '#ff3d81', 0.2, 0.3], ['BAR', '#4de0ff', 0.75, 0.24]].forEach(([s0, cor, x, y]) => { b.save(); b.shadowColor = cor; b.shadowBlur = 16; b.strokeStyle = cor; b.lineWidth = 3; b.strokeRect(w * x - w * 0.07, h * y - h * 0.05, w * 0.14, h * 0.1); b.font = '900 ' + Math.round(h * 0.06) + 'px Inter, Arial'; b.fillStyle = cor; b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillText(s0, w * x, h * y); b.restore(); });
      // plateia
      for (let i = 0; i < 40; i++) { const x = i * w / 38, y = h * 0.7 + (i % 2) * 4; b.fillStyle = '#0c0814'; b.beginPath(); b.arc(x, y - h * 0.04, h * 0.022, 0, 7); b.fill(); b.fillRect(x - h * 0.025, y - h * 0.02, h * 0.05, h * 0.06); }
      b.fillStyle = lin(b, 0, h * 0.74, 0, h, ['#4a3a4a', '#2a1e2a']); b.fillRect(0, h * 0.74, w, h * 0.26);
      b.strokeStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 12; i++) { b.beginPath(); b.moveTo(w / 2 + (i - 6) * w * 0.02, h * 0.74); b.lineTo(w / 2 + (i - 6) * w * 0.15, h); b.stroke(); }
    }), 0, 0);
    // lutadores (maiores, se mexendo)
    const fase = (t * 1.2) % 4, golpe = fase > 3.2; const k = Math.sin(t * 4) * 0.012; const look2 = { skin: '#c28a5e', hair: 1, hairColor: '#1d1512', shirt: '#e8e8e8', pants: '#e8e8e8', acc: 0, beard: 1 };
    const p1 = w * (0.36 + k + (golpe ? 0.04 : 0)), p2 = w * (0.64 - k + (golpe ? 0.015 : 0));
    [[p1, look(), 'right'], [p2, look2, 'left']].forEach(([x, L, d]) => { c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(x, h * 0.9, w * 0.06, h * 0.025, 0, 0, 7); c.fill(); A.sprite(c, L, x, h * 0.9, h / 66, { dir: d, walk: t * 4 + (d === 'left' ? 2 : 0) }); });
    if (golpe) {
      const fx = w * 0.56, fy = h * 0.55, r = h * (0.05 + (fase - 3.2) * 0.2);
      c.fillStyle = 'rgba(255,240,120,.9)'; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr0 = i % 2 ? r : r * 0.45; c.lineTo(fx + Math.cos(a) * rr0, fy + Math.sin(a) * rr0); } c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(fx, fy, r * 0.3, 0, 7); c.fill();
      txt(c, (2 + Math.floor(t) % 5) + ' HITS', w * 0.12, h * 0.38, Math.round(h * 0.06), '#ffd34d', 'left', 900, 'Inter, Arial');
    }
    // barras de vida e tempo
    const vida1 = 0.35 + (Math.sin(t * 0.17) + 1) * 0.3, vida2 = 0.25 + (Math.cos(t * 0.13) + 1) * 0.32;
    const bw = w * 0.38, bh = h * 0.045, y = h * 0.06;
    c.fillStyle = '#111'; c.fillRect(w * 0.05 - 2, y - 2, bw + 4, bh + 4); c.fillRect(w * 0.57 - 2, y - 2, bw + 4, bh + 4);
    c.fillStyle = '#5a0a0a'; c.fillRect(w * 0.05, y, bw, bh); c.fillRect(w * 0.57, y, bw, bh);
    c.fillStyle = lin(c, 0, y, 0, y + bh, ['#ffe14d', '#ffb000']); c.fillRect(w * 0.05 + bw * (1 - vida1), y, bw * vida1, bh); c.fillRect(w * 0.57, y, bw * vida2, bh);
    c.fillStyle = '#3ac8ff'; c.fillRect(w * 0.05, y + bh + 4, bw * 0.6 * ((t * 0.2) % 1), h * 0.012); c.fillRect(w * 0.95 - bw * 0.5 * ((t * 0.15) % 1), y + bh + 4, bw * 0.5 * ((t * 0.15) % 1), h * 0.012);
    txt(c, String(99 - Math.floor(t) % 99).padStart(2, '0'), w / 2, y + bh / 2 + 2, Math.round(h * 0.07), '#fff', 'center', 900, 'Inter, Arial');
    txt(c, (SL.G ? SL.G.player.name : 'VOCÊ').toUpperCase().slice(0, 10), w * 0.05, y + bh + h * 0.045, Math.round(h * 0.03), '#fff', 'left', 900, 'Inter, Arial'); txt(c, 'RIVAL', w * 0.95, y + bh + h * 0.045, Math.round(h * 0.03), '#fff', 'right', 900, 'Inter, Arial');
    if (s) { for (let i = 0; i < 2; i++) { c.fillStyle = i < s.r[0] ? '#ffd34d' : 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(w * 0.43 - i * 12, y + bh + h * 0.045, 4, 0, 7); c.fill(); c.fillStyle = i < s.r[1] ? '#ffd34d' : 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(w * 0.57 + i * 12, y + bh + h * 0.045, 4, 0, 7); c.fill(); } }
  };

  // =================== Stardew Valley: fazenda vista de cima ===================
  G.fazenda = (c, w, h, s, t) => {
    const T = h / 11;
    c.imageSmoothingEnabled = false;
    c.drawImage(fundo('sdv', w, h, (b, w, h) => {
      const T = h / 11;
      for (let x = 0; x < w / T + 1; x++) for (let y = 0; y < 12; y++) { b.fillStyle = hash(x, y) > 0.5 ? '#76b84a' : '#6dae43'; b.fillRect(x * T, y * T, T, T); if (hash(x + 3, y) > 0.8) { b.fillStyle = '#8fd060'; b.fillRect(x * T + T * 0.3, y * T + T * 0.4, T * 0.1, T * 0.25); b.fillRect(x * T + T * 0.45, y * T + T * 0.3, T * 0.1, T * 0.35); } }
      // lago
      b.fillStyle = '#d8c890'; b.beginPath(); b.ellipse(w * 0.12, h * 0.82, T * 2.6, T * 1.6, 0, 0, 7); b.fill(); b.fillStyle = '#3a8ad8'; b.beginPath(); b.ellipse(w * 0.12, h * 0.82, T * 2.3, T * 1.3, 0, 0, 7); b.fill(); b.fillStyle = 'rgba(255,255,255,.35)'; b.fillRect(w * 0.08, h * 0.78, T, 2); b.fillRect(w * 0.14, h * 0.85, T * 0.7, 2);
      // casa da fazenda
      const hx = w * 0.62, hy = T * 0.6; b.fillStyle = '#c8a070'; b.fillRect(hx, hy + T * 1.2, T * 4, T * 2.2); for (let i = 0; i < 6; i++) { b.fillStyle = 'rgba(0,0,0,.08)'; b.fillRect(hx, hy + T * 1.2 + i * T * 0.37, T * 4, 2); }
      b.fillStyle = '#a03a2a'; b.beginPath(); b.moveTo(hx - T * 0.3, hy + T * 1.3); b.lineTo(hx + T * 2, hy); b.lineTo(hx + T * 4.3, hy + T * 1.3); b.fill(); b.fillStyle = '#7a2a1e'; for (let i = 0; i < 5; i++) b.fillRect(hx + i * T * 0.85, hy + T * 0.6 + (i % 2) * 4, T * 0.7, 3);
      b.fillStyle = '#5a3a22'; b.fillRect(hx + T * 1.6, hy + T * 2.3, T * 0.8, T * 1.1); b.fillStyle = '#bfe3ff'; b.fillRect(hx + T * 0.4, hy + T * 1.8, T * 0.8, T * 0.6); b.fillRect(hx + T * 2.8, hy + T * 1.8, T * 0.8, T * 0.6);
      // cerca
      b.fillStyle = '#a07a4a'; for (let x = 0; x < 11; x++) { b.fillRect(w * 0.06 + x * T * 1.05, T * 3.8, T * 0.18, T * 0.6); } b.fillRect(w * 0.06, T * 3.95, T * 11, T * 0.1); b.fillRect(w * 0.06, T * 4.2, T * 11, T * 0.1);
      // árvores
      [[0.93, 0.55], [0.88, 0.85], [0.03, 0.2]].forEach(([x, y]) => { b.fillStyle = 'rgba(0,0,0,.2)'; b.beginPath(); b.ellipse(w * x + 4, h * y + T, T * 1.1, T * 0.4, 0, 0, 7); b.fill(); b.fillStyle = '#5a3a22'; b.fillRect(w * x - T * 0.15, h * y, T * 0.3, T); b.fillStyle = '#2f7a34'; b.beginPath(); b.arc(w * x, h * y - T * 0.2, T * 1.1, 0, 7); b.fill(); b.fillStyle = '#44983f'; b.beginPath(); b.arc(w * x - T * 0.3, h * y - T * 0.5, T * 0.55, 0, 7); b.fill(); });
    }), 0, 0);
    // canteiro arado com plantas em fases
    const dia = s ? s.dayN : 1;
    for (let r = 0; r < 4; r++) for (let col = 0; col < 9; col++) {
      const x = w * 0.08 + col * T * 1.05, y = T * 5 + r * T * 1.05;
      c.fillStyle = '#8a5a34'; c.fillRect(x, y, T, T); c.fillStyle = '#7a4e2c'; c.fillRect(x + 2, y + T * 0.45, T - 4, 2);
      const fase = (col + r + dia) % 5; const cx = x + T / 2, cy = y + T * 0.6 + Math.sin(t * 1.5 + col) * 0.6;
      if (fase >= 1) { c.fillStyle = '#4ea83a'; c.fillRect(cx - 1, cy - T * 0.15 * fase, 2, T * 0.15 * fase); c.fillRect(cx - T * 0.18, cy - T * 0.12 * fase, T * 0.18, T * 0.08); c.fillRect(cx, cy - T * 0.16 * fase, T * 0.18, T * 0.08); }
      if (fase === 4) { c.fillStyle = (col + r) % 2 ? '#ff6a3a' : '#ffd34d'; c.beginPath(); c.arc(cx, cy - T * 0.55, T * 0.17, 0, 7); c.fill(); }
      if (fase === 0) { c.fillStyle = 'rgba(40,90,200,.25)'; c.fillRect(x, y, T, T); }
    }
    // galinha andando
    const gx = w * (0.5 + Math.sin(t * 0.4) * 0.08), gy = h * 0.88; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(gx, gy, T * 0.3, T * 0.22, 0, 0, 7); c.fill(); c.fillStyle = '#e03030'; c.fillRect(gx + T * 0.15 * Math.sign(Math.cos(t * 0.4) || 1), gy - T * 0.28, T * 0.08, T * 0.08);
    // personagem regando
    const px = w * (0.28 + Math.sin(t * 0.25) * 0.15), py = T * 5.1;
    A.sprite(c, look(), px, py, h / 120, { walk: t * 5, dir: Math.cos(t * 0.25) > 0 ? 'right' : 'left' });
    c.fillStyle = 'rgba(120,180,255,.7)'; for (let i = 0; i < 4; i++) c.fillRect(px + T * 0.5 + i * 3, py + ((t * 40 + i * 7) % 12), 2, 3);
    // HUD: relógio/dinheiro, energia e barra de ferramentas
    c.imageSmoothingEnabled = true;
    const fs = Math.round(h * 0.03), bx = w - w * 0.2 - 8;
    c.fillStyle = '#f6d9a0'; rr(c, bx, 8, w * 0.2, h * 0.2, 6); c.fill(); c.strokeStyle = '#8a5a2a'; c.lineWidth = 3; rr(c, bx, 8, w * 0.2, h * 0.2, 6); c.stroke();
    txt(c, 'Dia ' + dia, bx + w * 0.1, 8 + h * 0.045, fs, '#5a3418', 'center', 800); txt(c, String(9 + Math.floor(t / 4) % 12) + ':' + (Math.floor(t) % 6) + '0', bx + w * 0.1, 8 + h * 0.095, fs, '#5a3418', 'center', 800, 'JetBrains Mono, monospace');
    c.fillStyle = '#fff4dc'; c.fillRect(bx + 6, 8 + h * 0.13, w * 0.2 - 12, h * 0.055); txt(c, String(s ? s.gold : 0), bx + w * 0.2 - 12, 8 + h * 0.158, fs, '#5a3418', 'right', 800, 'JetBrains Mono, monospace');
    const ew = h * 0.04, eh = h * 0.3; c.fillStyle = '#8a5a2a'; rr(c, w - ew - 10, h - eh - 10, ew, eh, 4); c.fill(); c.fillStyle = '#3ad15a'; c.fillRect(w - ew - 7, h - 13 - (eh - 6) * 0.72, ew - 6, (eh - 6) * 0.72);
    const sl = h * 0.08, tx = w / 2 - sl * 5; c.fillStyle = '#f6d9a0'; rr(c, tx - 4, h - sl - 12, sl * 10 + 8, sl + 8, 5); c.fill();
    for (let i = 0; i < 10; i++) { c.fillStyle = '#e8c48a'; c.fillRect(tx + i * sl + 2, h - sl - 8, sl - 4, sl - 4); if (i === 3) { c.strokeStyle = '#e03030'; c.lineWidth = 2; c.strokeRect(tx + i * sl + 1, h - sl - 9, sl - 2, sl - 2); } c.fillStyle = ['#8a8f9c', '#a07a4a', '#3a8ad8', '#5a8ad8', '#c84a2a', '#4ea83a', '#ffd34d', '#ff6a3a', '#b08a5a', '#fff'][i]; c.fillRect(tx + i * sl + sl * 0.3, h - sl - 8 + sl * 0.25, sl * 0.36, sl * 0.4); }
  };

  // =================== Tetris: neon com peça fantasma, guardada e linhas ===================
  const tetrisAntigo = G.tetris;
  G.tetris = (c, w, h, s, t) => {
    tetrisAntigo(c, w, h, s, t);
    const S = h / 22, px = w / 2 - S * 5, py = h * 0.04;
    c.save(); c.shadowColor = '#00e5ff'; c.shadowBlur = 14; c.strokeStyle = 'rgba(0,229,255,.8)'; c.lineWidth = 2; c.strokeRect(px - 3, py - 3, S * 10 + 6, S * 20 + 6); c.restore();
    // grade fininha
    c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 1; for (let i = 1; i < 10; i++) { c.beginPath(); c.moveTo(px + i * S, py); c.lineTo(px + i * S, py + S * 20); c.stroke(); }
    // guardada e linhas (lado esquerdo)
    const lx = px - w * 0.04 - S * 4; txt(c, 'GUARDADA', lx, h * 0.2, Math.round(h * 0.03), '#9a9ad8', 'left', 800);
    c.strokeStyle = 'rgba(154,154,216,.5)'; c.strokeRect(lx, h * 0.23, S * 4, S * 3); c.fillStyle = '#ff8a00'; [[0, 1], [1, 1], [2, 1], [2, 0]].forEach(([dx, dy]) => c.fillRect(lx + S * 0.5 + dx * S * 0.9, h * 0.25 + dy * S * 0.9, S * 0.85, S * 0.85));
    txt(c, 'LINHAS', lx, h * 0.5, Math.round(h * 0.03), '#9a9ad8', 'left', 800); txt(c, String(40 + Math.floor(t / 6) * 4), lx, h * 0.56, Math.round(h * 0.05), '#fff', 'left', 900);
    // fundo com partículas
    for (let i = 0; i < 24; i++) { const y = (hash(i, 1) * h + t * 20 * (0.5 + hash(i, 2))) % h; c.fillStyle = 'rgba(120,180,255,' + (0.1 + hash(i, 3) * 0.2) + ')'; c.fillRect(hash(i, 4) * w * 0.22, y, 2, 2); c.fillRect(w - hash(i, 5) * w * 0.22, (y * 1.3) % h, 2, 2); }
  };

  // =================== React: player de vídeo com lista ao lado ===================
  G.react = (c, w, h, s, t) => {
    c.fillStyle = '#0f0f0f'; c.fillRect(0, 0, w, h);
    const vx = w * 0.03, vy = h * 0.05, vw = w * 0.64, vh = vw * 9 / 16; const n = s ? s.n : 0; const r = U.mulberry(n + 1);
    const hue = Math.round(r() * 360);
    c.fillStyle = lin(c, vx, vy, vx + vw, vy + vh, ['hsl(' + hue + ',55%,52%)', 'hsl(' + ((hue + 60) % 360) + ',55%,28%)']); c.fillRect(vx, vy, vw, vh);
    // "vídeo": personagem falando e legenda
    const fx = vx + vw * (0.5 + Math.sin(t * 0.6) * 0.12); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(fx, vy + vh * 0.95, vw * 0.12, vh * 0.04, 0, 0, 7); c.fill();
    A.sprite(c, { skin: ['#f1c7a5', '#c28a5e', '#8d5a3b'][n % 3], hair: n % 5, hairColor: '#2a1a12', shirt: 'hsl(' + ((hue + 180) % 360) + ',60%,50%)', pants: '#2a2f3d', acc: n % 2, beard: 0 }, fx, vy + vh * 0.95, vh / 85, { walk: t * 3 });
    c.fillStyle = 'rgba(0,0,0,.65)'; rr(c, vx + vw * 0.2, vy + vh * 0.06, vw * 0.6, vh * 0.12, 4); c.fill(); txt(c, ['NÃO ACREDITO NISSO', 'O FINAL É INSANO', 'TESTEI POR 7 DIAS', 'REAGINDO AO PIOR', 'ISSO DEU CERTO?'][n % 5], vx + vw / 2, vy + vh * 0.12, Math.round(vh * 0.06), '#fff', 'center', 900, 'Inter, Arial');
    // barra de progresso e controles
    c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(vx, vy + vh - vh * 0.1, vw, vh * 0.1); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(vx + 8, vy + vh - vh * 0.1, vw - 16, 3); const pr = (t * 0.03) % 1; c.fillStyle = '#ff0033'; c.fillRect(vx + 8, vy + vh - vh * 0.1, (vw - 16) * pr, 3); c.beginPath(); c.arc(vx + 8 + (vw - 16) * pr, vy + vh - vh * 0.1 + 1.5, 5, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(vx + 14, vy + vh - vh * 0.075); c.lineTo(vx + 14, vy + vh - vh * 0.025); c.lineTo(vx + 24, vy + vh - vh * 0.05); c.closePath(); c.fill();
    const m = Math.floor(pr * 600); txt(c, Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') + ' / 10:00', vx + 34, vy + vh - vh * 0.05, Math.round(vh * 0.04), '#fff', 'left', 600);
    txt(c, 'Vídeo ' + (n + 1) + ' da lista · ' + (1 + Math.round(r() * 9)) + ',' + Math.round(r() * 9) + ' mi de visualizações', vx, vy + vh + h * 0.05, Math.round(h * 0.032), '#fff', 'left', 700);
    // lista ao lado
    const lx = vx + vw + w * 0.025, lw = w - lx - w * 0.02;
    for (let i = 0; i < 5; i++) { const y = vy + i * h * 0.17; const hh = U.mulberry(n + i + 2)(); c.fillStyle = 'hsl(' + Math.round(hh * 360) + ',50%,40%)'; c.fillRect(lx, y, lw * 0.45, h * 0.14); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(lx + lw * 0.5, y + 4, lw * 0.45, 5); c.fillRect(lx + lw * 0.5, y + 14, lw * 0.32, 5); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(lx + lw * 0.5, y + 26, lw * 0.25, 4); if (i === 0) { c.strokeStyle = '#ff0033'; c.lineWidth = 2; c.strokeRect(lx, y, lw * 0.45, h * 0.14); } }
  };
})(window.SL);

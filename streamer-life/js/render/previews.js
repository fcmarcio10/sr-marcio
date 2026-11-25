/* Desenhos das telas de jogo (prévia da live), câmera do streamer, thumbnails, fotos do Instagram e papel de parede. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, A = SL.Avatar;
  const P = SL.Preview = {};
  const rr = (ctx, x, y, w, h, r) => A.rr(ctx, x, y, w, h, r);
  const grad = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
  const txt = (ctx, s, x, y, size, color, align, weight, font) => { ctx.font = (weight || 700) + ' ' + size + 'px ' + (font || 'Sora, Arial'); ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); };
  P.txt = txt;

  // ---------- cenas de jogo ----------
  const G = {};
  G.futebol = (ctx, w, h, s, t) => {
    ctx.fillStyle = grad(ctx, 0, 0, 0, h, ['#2f8f4e', '#277a42']); ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) { if (i % 2) { ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(i * w / 10, 0, w / 10, h); } }
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = Math.max(1.5, w / 400);
    ctx.strokeRect(w * 0.05, h * 0.1, w * 0.9, h * 0.8); ctx.beginPath(); ctx.moveTo(w / 2, h * 0.1); ctx.lineTo(w / 2, h * 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, h * 0.13, 0, 7); ctx.stroke();
    ctx.strokeRect(w * 0.05, h * 0.32, w * 0.1, h * 0.36); ctx.strokeRect(w * 0.85, h * 0.32, w * 0.1, h * 0.36);
    const bx = w / 2 + Math.sin(t * 0.7) * w * 0.3, by = h / 2 + Math.sin(t * 1.3) * h * 0.25;
    for (let i = 0; i < 11; i++) for (const team of [0, 1]) {
      const r = U.mulberry(i * 7 + team * 99); const hx = (team ? 0.55 : 0.08) + r() * 0.37, hy = 0.15 + r() * 0.7;
      const px = U.lerp(hx * w, bx, 0.18 + Math.sin(t + i) * 0.05), py = U.lerp(hy * h, by, 0.15);
      ctx.fillStyle = team ? '#ff5a36' : '#3b82f6'; ctx.beginPath(); ctx.arc(px, py, h * 0.017, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, h * 0.011, 0, 7); ctx.fill();
    if (s) { // placar de TV: siglas dos times, gols e o minuto em caixinhas separadas (nada encavalado)
      const fs = Math.round(h * 0.038); const sig = n => (n || '???').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase();
      const label = sig(s.teamA) + '  ' + s.a + ' x ' + s.b + '  ' + sig(s.teamB); ctx.font = '800 ' + fs + 'px Inter, Arial'; const tw = ctx.measureText(label).width;
      const x0 = w * 0.03, y0 = h * 0.03, bh = fs * 1.9; ctx.fillStyle = 'rgba(8,10,16,.88)'; rr(ctx, x0, y0, tw + fs * 1.4, bh, 6); ctx.fill();
      txt(ctx, label, x0 + fs * 0.7, y0 + bh * 0.68, fs, '#fff', 'left', 800, 'Inter, Arial');
      const mx = x0 + tw + fs * 1.4 + 4; ctx.fillStyle = '#ffe066'; rr(ctx, mx, y0, fs * 2.6, bh, 6); ctx.fill();
      txt(ctx, Math.min(90, s.min) + "'", mx + fs * 1.3, y0 + bh * 0.68, Math.round(fs * 0.9), '#14121f', 'center', 800, 'JetBrains Mono, monospace');
    }
  };
  G.br = (ctx, w, h, s, t) => {
    ctx.fillStyle = grad(ctx, 0, 0, 0, h * 0.6, ['#7fb3e0', '#e9c8a0']); ctx.fillRect(0, 0, w, h);
    const r = U.mulberry(5); ctx.fillStyle = '#6b7a5a';
    ctx.beginPath(); ctx.moveTo(0, h * 0.6); for (let i = 0; i <= 10; i++) ctx.lineTo(i * w / 10, h * (0.5 + r() * 0.1)); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    for (let i = 0; i < 6; i++) { const bw = w * (0.06 + r() * 0.06), bh = h * (0.12 + r() * 0.2), bx = r() * w; ctx.fillStyle = ['#8a8f9c', '#a08a74', '#77808f'][i % 3]; ctx.fillRect(bx, h * 0.6 - bh, bw, bh); ctx.fillStyle = 'rgba(30,40,60,.5)'; for (let k = 0; k < 4; k++) ctx.fillRect(bx + bw * 0.15, h * 0.6 - bh + bh * (0.12 + k * 0.2), bw * 0.25, bh * 0.08); }
    ctx.fillStyle = grad(ctx, 0, h * 0.6, 0, h, ['#7a8a5a', '#55663e']); ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.fillStyle = 'rgba(160,80,255,.22)'; ctx.fillRect(w * 0.82, 0, w * 0.18, h);
    const ex = w * (0.55 + Math.sin(t * 0.8) * 0.12), ey = h * 0.55; ctx.fillStyle = '#3a2a2a'; rr(ctx, ex - w * 0.008, ey - h * 0.05, w * 0.016, h * 0.05, 3); ctx.fill(); ctx.beginPath(); ctx.arc(ex, ey - h * 0.06, w * 0.008, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; const cx = w / 2, cy = h / 2; ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 4, cy); ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 12, cy); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy - 4); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 12); ctx.stroke();
    ctx.fillStyle = '#2b2b33'; ctx.beginPath(); ctx.moveTo(w * 0.62, h); ctx.lineTo(w * 0.7, h * 0.72); ctx.lineTo(w * 0.8, h * 0.74); ctx.lineTo(w * 0.84, h); ctx.fill(); ctx.fillStyle = '#4a4a55'; ctx.fillRect(w * 0.69, h * 0.7, w * 0.04, h * 0.05);
    if (s) { ctx.fillStyle = 'rgba(8,10,16,.75)'; rr(ctx, w * 0.78, h * 0.04, w * 0.19, h * 0.11, 6); ctx.fill(); txt(ctx, s.alive + ' VIVOS', w * 0.875, h * 0.075, Math.round(h * 0.03), '#fff', 'center', 800); txt(ctx, s.kills + ' ABATES', w * 0.875, h * 0.12, Math.round(h * 0.026), '#ffb547', 'center', 700); }
  };
  G.terror = (ctx, w, h, s, t) => {
    ctx.fillStyle = '#050407'; ctx.fillRect(0, 0, w, h);
    const flick = 0.75 + Math.sin(t * 13) * 0.08 + (Math.sin(t * 3.1) > 0.97 ? -0.5 : 0);
    ctx.fillStyle = '#1a1418'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.38, h * 0.32); ctx.lineTo(w * 0.38, h * 0.68); ctx.lineTo(0, h); ctx.fill();
    ctx.fillStyle = '#161116'; ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(w * 0.62, h * 0.32); ctx.lineTo(w * 0.62, h * 0.68); ctx.lineTo(w, h); ctx.fill();
    ctx.fillStyle = '#221a1e'; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w * 0.38, h * 0.68); ctx.lineTo(w * 0.62, h * 0.68); ctx.lineTo(w, h); ctx.fill();
    ctx.fillStyle = '#0b080b'; ctx.fillRect(w * 0.44, h * 0.4, w * 0.12, h * 0.28);
    const g = ctx.createRadialGradient(w / 2, h * 0.6, 10, w / 2, h * 0.6, w * 0.45); g.addColorStop(0, 'rgba(255,240,200,' + 0.28 * flick + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (s && s.last && s.last[0] && s.last[0].type === 'jumpscare' && (SL.G.time.t - s.last[0].at) < 1) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w * 0.15, h * 0.3, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(w * 0.46, h * 0.43, w * 0.025, h * 0.05, 0, 0, 7); ctx.ellipse(w * 0.54, h * 0.43, w * 0.025, h * 0.05, 0, 0, 7); ctx.ellipse(w / 2, h * 0.6, w * 0.04, h * 0.09, 0, 0, 7); ctx.fill(); }
    if (s) txt(ctx, 'CAPÍTULO ' + s.ch, w * 0.04, h * 0.07, Math.round(h * 0.03), 'rgba(255,220,220,.7)', 'left', 600, 'JetBrains Mono, monospace');
  };
  G.corrida = (ctx, w, h, s, t) => {
    ctx.fillStyle = grad(ctx, 0, 0, 0, h * 0.45, ['#ff9a5a', '#ffd19a']); ctx.fillRect(0, 0, w, h * 0.45);
    ctx.fillStyle = '#3a4a3a'; ctx.fillRect(0, h * 0.45, w, h * 0.55);
    ctx.fillStyle = '#33343c'; ctx.beginPath(); ctx.moveTo(w * 0.47, h * 0.45); ctx.lineTo(w * 0.53, h * 0.45); ctx.lineTo(w * 0.95, h); ctx.lineTo(w * 0.05, h); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { const p = ((i / 8) + (t * 0.6) % (1 / 8) * 8 / 8) % 1; const y = h * 0.45 + p * p * h * 0.55; const ww = 2 + p * 10; ctx.fillRect(w / 2 - ww / 2, y, ww, 4 + p * 18); }
    ctx.fillStyle = '#d8432f'; rr(ctx, w * 0.42, h * 0.72, w * 0.16, h * 0.16, 8); ctx.fill(); ctx.fillStyle = '#222'; ctx.fillRect(w * 0.44, h * 0.73, w * 0.12, h * 0.04);
    ctx.fillStyle = '#3b82f6'; rr(ctx, w * (0.47 + Math.sin(t) * 0.03), h * 0.55, w * 0.05, h * 0.05, 4); ctx.fill();
    if (s) { txt(ctx, s.pos + 'º', w * 0.05, h * 0.1, Math.round(h * 0.09), '#fff', 'left', 800); txt(ctx, 'VOLTA ' + Math.min(s.lap, s.laps) + '/' + s.laps, w * 0.05, h * 0.18, Math.round(h * 0.03), '#fff', 'left', 700, 'JetBrains Mono, monospace'); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w * 0.88, h * 0.82, h * 0.1, Math.PI * 0.8, Math.PI * (0.8 + 1.4 * (0.6 + Math.sin(t * 2) * 0.2))); ctx.stroke();
  };
  G.moba = (ctx, w, h, s, t) => {
    ctx.fillStyle = '#1f3a2a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#a09070'; ctx.lineWidth = h * 0.05; ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.9); ctx.lineTo(w * 0.92, h * 0.1); ctx.moveTo(w * 0.08, h * 0.9); ctx.lineTo(w * 0.08, h * 0.1); ctx.lineTo(w * 0.92, h * 0.1); ctx.moveTo(w * 0.08, h * 0.9); ctx.lineTo(w * 0.92, h * 0.9); ctx.lineTo(w * 0.92, h * 0.1); ctx.stroke();
    ctx.fillStyle = '#2a5a8a'; ctx.beginPath(); ctx.arc(w * 0.08, h * 0.9, h * 0.08, 0, 7); ctx.fill(); ctx.fillStyle = '#8a2a3a'; ctx.beginPath(); ctx.arc(w * 0.92, h * 0.1, h * 0.08, 0, 7); ctx.fill();
    for (let i = 0; i < 6; i++) { const p = ((t * 0.05 + i / 6) % 1); ctx.fillStyle = '#4cc3ff'; ctx.beginPath(); ctx.arc(U.lerp(w * 0.1, w * 0.9, p), U.lerp(h * 0.88, h * 0.12, p), 3, 0, 7); ctx.fill(); ctx.fillStyle = '#ff6b6b'; ctx.beginPath(); ctx.arc(U.lerp(w * 0.9, w * 0.1, p), U.lerp(h * 0.12, h * 0.88, p), 3, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(w * (0.45 + Math.sin(t * 0.5) * 0.05), h * (0.55 + Math.cos(t * 0.4) * 0.05), h * 0.025, 0, 7); ctx.fill();
    if (s) txt(ctx, s.k + ' / ' + s.d, w * 0.5, h * 0.06, Math.round(h * 0.04), '#fff', 'center', 800, 'JetBrains Mono, monospace');
  };
  G.sandbox = (ctx, w, h, s, t) => {
    ctx.fillStyle = grad(ctx, 0, 0, 0, h, ['#8fd0ff', '#c8ecff']); ctx.fillRect(0, 0, w, h);
    const bs = h / 12; const r = U.mulberry(11);
    for (let x = 0; x < w / bs + 1; x++) { const top = 7 + Math.round(r() * 1.5); for (let y = top; y < 13; y++) { ctx.fillStyle = y === top ? '#5fae3e' : y < top + 3 ? '#8a5a3a' : '#777b85'; ctx.fillRect(x * bs, y * bs, bs - 1, bs - 1); } }
    const prog = s ? s.prog / 100 : 0.5; const cols = 6, rows = Math.max(1, Math.round(prog * 5));
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) { ctx.fillStyle = (x + y) % 2 ? '#b0a090' : '#c8b8a6'; ctx.fillRect(w * 0.55 + x * bs, h * 0.58 - (y + 1) * bs, bs - 1, bs - 1); }
    for (let i = 0; i < 2; i++) { const tx = w * (0.12 + i * 0.2); ctx.fillStyle = '#6b4a2a'; ctx.fillRect(tx, h * 0.58 - bs * 3, bs, bs * 3); ctx.fillStyle = '#3f8f3a'; ctx.fillRect(tx - bs, h * 0.58 - bs * 5, bs * 3, bs * 2); }
    A.sprite(ctx, SL.G ? SL.G.player.look : A.randomLook(), w * 0.42, h * 0.58, h / 90, { walk: t * 6 });
    if (s) txt(ctx, s.proj + ' ' + Math.round(s.prog) + '%', w * 0.04, h * 0.07, Math.round(h * 0.032), '#173a5a', 'left', 700);
  };
  G.luta = (ctx, w, h, s, t) => {
    ctx.fillStyle = grad(ctx, 0, 0, 0, h, ['#3a1a4a', '#c33b8a']); ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2a1a2a'; ctx.fillRect(0, h * 0.78, w, h * 0.22);
    const k = Math.sin(t * 4); const look2 = { skin: '#c28a5e', hair: 1, hairColor: '#1d1512', shirt: '#2a2f3d', pants: '#5a1d18', acc: 0, beard: 1 };
    A.sprite(ctx, SL.G ? SL.G.player.look : look2, w * (0.38 + k * 0.02), h * 0.8, h / 55, { dir: 'right', walk: t * 5 });
    A.sprite(ctx, look2, w * (0.62 - k * 0.02), h * 0.8, h / 55, { dir: 'left', walk: t * 5 + 2 });
    ctx.fillStyle = '#222'; rr(ctx, w * 0.05, h * 0.06, w * 0.38, h * 0.04, 4); ctx.fill(); rr(ctx, w * 0.57, h * 0.06, w * 0.38, h * 0.04, 4); ctx.fill();
    ctx.fillStyle = '#ffe066'; rr(ctx, w * 0.05, h * 0.06, w * 0.38 * (0.4 + (Math.sin(t * 0.7) + 1) * 0.3), h * 0.04, 4); ctx.fill(); ctx.fillStyle = '#ff5a36'; rr(ctx, w * 0.57, h * 0.06, w * 0.38 * (0.3 + (Math.cos(t * 0.6) + 1) * 0.3), h * 0.04, 4); ctx.fill();
    if (s) txt(ctx, s.r[0] + ' x ' + s.r[1], w / 2, h * 0.08, Math.round(h * 0.045), '#fff', 'center', 800);
  };
  // peças de xadrez desenhadas (rei, dama, torre, bispo, cavalo e peão) numa posição que muda com os lances
  const PECAS = ['t', 'c', 'b', 'd', 'r', 'b', 'c', 't'];
  const peca = (ctx, k, cx, cy, sz, white) => {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sz, sz);
    ctx.fillStyle = white ? '#f7f3ea' : '#1b1b1f'; ctx.strokeStyle = white ? '#3a3328' : '#9a9aa6'; ctx.lineWidth = 0.045;
    ctx.beginPath(); ctx.moveTo(-0.32, 0.4); ctx.lineTo(0.32, 0.4); ctx.lineTo(0.26, 0.3); ctx.lineTo(-0.26, 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    if (k === 'p') { ctx.moveTo(-0.17, 0.3); ctx.lineTo(-0.09, 0.02); ctx.lineTo(0.09, 0.02); ctx.lineTo(0.17, 0.3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -0.06, 0.13, 0, 7); }
    else if (k === 't') { ctx.rect(-0.18, -0.12, 0.36, 0.42); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-0.24, -0.12); ctx.lineTo(-0.24, -0.3); ctx.lineTo(-0.13, -0.3); ctx.lineTo(-0.13, -0.22); ctx.lineTo(-0.05, -0.22); ctx.lineTo(-0.05, -0.3); ctx.lineTo(0.05, -0.3); ctx.lineTo(0.05, -0.22); ctx.lineTo(0.13, -0.22); ctx.lineTo(0.13, -0.3); ctx.lineTo(0.24, -0.3); ctx.lineTo(0.24, -0.12); ctx.closePath(); }
    else if (k === 'c') { ctx.moveTo(-0.2, 0.3); ctx.lineTo(-0.12, 0); ctx.quadraticCurveTo(-0.26, -0.08, -0.12, -0.3); ctx.lineTo(0.06, -0.38); ctx.quadraticCurveTo(0.3, -0.25, 0.26, -0.04); ctx.lineTo(0.08, -0.08); ctx.lineTo(0.2, 0.3); ctx.closePath(); }
    else if (k === 'b') { ctx.moveTo(-0.16, 0.3); ctx.quadraticCurveTo(-0.22, -0.1, 0, -0.32); ctx.quadraticCurveTo(0.22, -0.1, 0.16, 0.3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -0.38, 0.06, 0, 7); }
    else if (k === 'd') { ctx.moveTo(-0.22, 0.3); ctx.lineTo(-0.28, -0.24); ctx.lineTo(-0.12, -0.08); ctx.lineTo(0, -0.32); ctx.lineTo(0.12, -0.08); ctx.lineTo(0.28, -0.24); ctx.lineTo(0.22, 0.3); ctx.closePath(); }
    else { ctx.moveTo(-0.22, 0.3); ctx.quadraticCurveTo(-0.3, -0.12, 0, -0.18); ctx.quadraticCurveTo(0.3, -0.12, 0.22, 0.3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.rect(-0.03, -0.42, 0.06, 0.22); ctx.rect(-0.1, -0.35, 0.2, 0.06); }
    ctx.fill(); ctx.stroke(); ctx.restore();
  };
  G.xadrez = (ctx, w, h, s, t) => {
    ctx.fillStyle = '#231e17'; ctx.fillRect(0, 0, w, h);
    const bs = h * 0.105, ox = (w - bs * 8) / 2, oy = h * 0.08; const mv = s ? s.mv : 0; const r = U.mulberry(Math.floor(mv / 4) + 3);
    ctx.fillStyle = '#5a4430'; ctx.fillRect(ox - bs * 0.12, oy - bs * 0.12, bs * 8.24, bs * 8.24);
    for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) { ctx.fillStyle = (x + y) % 2 ? '#a07850' : '#ecdcbc'; ctx.fillRect(ox + x * bs, oy + y * bs, bs, bs); }
    // posição: começa a inicial e, a cada lance, peças saem do lugar (algumas são capturadas)
    const board = {}; for (let x = 0; x < 8; x++) { board[x + ',0'] = [PECAS[x], 0]; board[x + ',1'] = ['p', 0]; board[x + ',6'] = ['p', 1]; board[x + ',7'] = [PECAS[x], 1]; }
    const moves = Math.min(28, Math.floor(mv / 2));
    for (let i = 0; i < moves; i++) {
      const keys = Object.keys(board).filter(k => board[k][1] === i % 2 && board[k][0] !== 'r'); if (!keys.length) break;
      const from = keys[Math.floor(r() * keys.length)]; const [fx, fy] = from.split(',').map(Number);
      const dir = i % 2 ? -1 : 1; const tx = U.clamp(fx + Math.round((r() - 0.5) * 3), 0, 7), ty = U.clamp(fy + dir * (1 + Math.floor(r() * 2)), 0, 7);
      const to = tx + ',' + ty; if (board[to] && (board[to][1] === i % 2 || board[to][0] === 'r')) continue;
      board[to] = board[from]; delete board[from];
    }
    Object.keys(board).forEach(k => { const [x, y] = k.split(',').map(Number); peca(ctx, board[k][0], ox + x * bs + bs / 2, oy + y * bs + bs * 0.52, bs * 0.9, board[k][1] === 1); });
    if (s && s.last && s.last[0]) { const lx = Math.floor(r() * 8), ly = Math.floor(r() * 8); ctx.strokeStyle = 'rgba(255,214,102,.85)'; ctx.lineWidth = 3; ctx.strokeRect(ox + lx * bs + 1.5, oy + ly * bs + 1.5, bs - 3, bs - 3); }
    if (s) { txt(ctx, 'Rating ' + s.rating, w * 0.03, h * 0.5, Math.round(h * 0.03), '#e8d8b8', 'left', 700, 'JetBrains Mono, monospace'); txt(ctx, '0' + Math.max(0, 9 - Math.floor(s.mv / 6)) + ':' + String(59 - (s.mv * 7) % 60).padStart(2, '0'), w * 0.97, h * 0.5, Math.round(h * 0.04), '#fff', 'right', 700, 'JetBrains Mono, monospace'); }
  };
  G.fazenda = (ctx, w, h, s, t) => {
    ctx.fillStyle = '#9fd36b'; ctx.fillRect(0, 0, w, h);
    for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) { ctx.fillStyle = '#7a5a3a'; ctx.fillRect(w * 0.08 + c * w * 0.05, h * 0.42 + r * h * 0.08, w * 0.04, h * 0.06); ctx.fillStyle = (r + c) % 3 ? '#3f8f3a' : '#f2a33a'; ctx.beginPath(); ctx.arc(w * 0.1 + c * w * 0.05, h * 0.44 + r * h * 0.08 + Math.sin(t + c) * 1, h * 0.018, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#c33b2a'; ctx.fillRect(w * 0.68, h * 0.18, w * 0.2, h * 0.24); ctx.fillStyle = '#8a2a1a'; ctx.beginPath(); ctx.moveTo(w * 0.66, h * 0.19); ctx.lineTo(w * 0.78, h * 0.06); ctx.lineTo(w * 0.9, h * 0.19); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(w * 0.76, h * 0.3, w * 0.04, h * 0.12);
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(w * 0.12, h * 0.15, h * 0.07, 0, 7); ctx.fill();
    A.sprite(ctx, SL.G ? SL.G.player.look : A.randomLook(), w * (0.4 + Math.sin(t * 0.3) * 0.1), h * 0.38, h / 100, { walk: t * 6, dir: Math.cos(t * 0.3) > 0 ? 'right' : 'left' });
    if (s) txt(ctx, 'Dia ' + s.dayN + ' · ' + s.gold + ' moedas', w * 0.04, h * 0.92, Math.round(h * 0.032), '#173a10', 'left', 700);
  };
  G.rpg = (ctx, w, h, s, t) => {
    ctx.fillStyle = grad(ctx, 0, 0, 0, h, ['#2a1a5a', '#8a5ab0', '#f0a070']); ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a2a5a'; ctx.beginPath(); ctx.moveTo(0, h * 0.65); ctx.lineTo(w * 0.2, h * 0.35); ctx.lineTo(w * 0.4, h * 0.6); ctx.lineTo(w * 0.6, h * 0.3); ctx.lineTo(w * 0.85, h * 0.62); ctx.lineTo(w, h * 0.5); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill();
    ctx.fillStyle = '#1a1230'; ctx.fillRect(w * 0.7, h * 0.38, w * 0.08, h * 0.25); ctx.fillRect(w * 0.66, h * 0.34, w * 0.03, h * 0.29); ctx.fillRect(w * 0.79, h * 0.34, w * 0.03, h * 0.29);
    ctx.fillStyle = '#2a4a2a'; ctx.fillRect(0, h * 0.78, w, h * 0.22);
    A.sprite(ctx, SL.G ? SL.G.player.look : A.randomLook(), w * 0.3, h * 0.86, h / 70, { dir: 'right', walk: t * 3 });
    if (s && s.boss) { ctx.fillStyle = '#5a1a2a'; ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.72, w * 0.08, h * 0.16, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(w * 0.6, h * 0.66, 4, 0, 7); ctx.arc(w * 0.64, h * 0.66, 4, 0, 7); ctx.fill(); }
    if (s) txt(ctx, 'Nv. ' + s.lvl, w * 0.04, h * 0.07, Math.round(h * 0.035), '#fff', 'left', 800);
  };
  // Tetris: poço com peças caindo, linhas sendo completadas, próxima peça e pontuação
  G.tetris = (ctx, w, h, s, t) => {
    ctx.fillStyle = grad(ctx, 0, 0, 0, h, ['#0b0b1e', '#151538']); ctx.fillRect(0, 0, w, h);
    const S = h / 22, cols = 10, px = w / 2 - S * cols / 2, py = h * 0.04;
    ctx.fillStyle = '#05050c'; ctx.fillRect(px - 3, py - 3, S * cols + 6, S * 20 + 6); ctx.strokeStyle = '#3a3a7a'; ctx.lineWidth = 2; ctx.strokeRect(px - 3, py - 3, S * cols + 6, S * 20 + 6);
    const cores = ['#00e5ff', '#ffd400', '#b04aff', '#2ee86a', '#ff3b3b', '#2f6bff', '#ff8a00'];
    const bloco = (gx, gy, cor) => { const x = px + gx * S, y = py + gy * S; ctx.fillStyle = cor; ctx.fillRect(x + 1, y + 1, S - 2, S - 2); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 1, y + 1, S - 2, S * 0.18); };
    const ciclo = Math.floor(t / 6); const alt = 5 + (ciclo % 4);
    for (let y = 0; y < alt; y++) for (let x = 0; x < cols; x++) if (((x * 7 + y * 5 + ciclo) % 9) !== 0) bloco(x, 19 - y, cores[(x + y + ciclo) % 7]);
    const f = (t % 6) / 6; const gy = Math.floor(f * (19 - alt - 1)); const gx = 3 + Math.floor(Math.sin(t * 0.8) * 2 + 2);
    const pecas = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]]];
    const pc = pecas[ciclo % 4]; pc.forEach(([dx, dy]) => bloco(gx + dx, gy + dy, cores[ciclo % 7]));
    if (f > 0.9) { ctx.fillStyle = 'rgba(255,255,255,' + ((f - 0.9) * 8) + ')'; ctx.fillRect(px, py + (19 - 0) * S, S * cols, S); }
    const lx = px + S * cols + w * 0.04; txt(ctx, 'PRÓXIMA', lx, h * 0.1, Math.round(h * 0.035), '#9a9ad8', 'left', 800);
    pecas[(ciclo + 1) % 4].forEach(([dx, dy]) => { ctx.fillStyle = cores[(ciclo + 1) % 7]; ctx.fillRect(lx + dx * S * 0.8, h * 0.14 + dy * S * 0.8, S * 0.75, S * 0.75); });
    txt(ctx, 'PONTOS', lx, h * 0.34, Math.round(h * 0.035), '#9a9ad8', 'left', 800); txt(ctx, String(12000 + ciclo * 800 + Math.floor(f * 100) * 10), lx, h * 0.4, Math.round(h * 0.05), '#fff', 'left', 800);
    txt(ctx, 'NÍVEL ' + (5 + (ciclo % 10)), lx, h * 0.5, Math.round(h * 0.04), '#ffd400', 'left', 800);
    txt(ctx, 'TETRIS', px - w * 0.04, h * 0.1, Math.round(h * 0.06), '#00e5ff', 'right', 900);
  };
  // GTA 6: cidade de praia ao entardecer, carro na avenida, palmeiras, mapinha e "procurado"
  G.gta = (ctx, w, h, s, t) => {
    ctx.fillStyle = grad(ctx, 0, 0, 0, h * 0.6, ['#ff6fa8', '#ff9a5a', '#ffd08a']); ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,240,190,.9)'; ctx.beginPath(); ctx.arc(w * 0.7, h * 0.38, h * 0.08, 0, 7); ctx.fill();
    for (let i = 0; i < 16; i++) { const bx = ((i * w / 12 - t * 18) % (w + 120) + w + 120) % (w + 120) - 60; const bh = h * (0.14 + ((i * 37) % 10) / 40); ctx.fillStyle = '#3a2450'; ctx.fillRect(bx, h * 0.55 - bh, w / 14, bh); ctx.fillStyle = 'rgba(255,220,140,.55)'; for (let j = 0; j < 5; j++) ctx.fillRect(bx + 4, h * 0.55 - bh + 6 + j * (bh / 6), w / 40, 3); }
    ctx.fillStyle = '#2a2a33'; ctx.fillRect(0, h * 0.55, w, h * 0.45);
    ctx.fillStyle = '#ffd36b'; for (let i = 0; i < 10; i++) { const x = ((i * w / 6 - t * 220) % (w + 100) + w + 100) % (w + 100) - 50; ctx.fillRect(x, h * 0.76, w / 14, h * 0.012); }
    for (let i = 0; i < 6; i++) { const x = ((i * w / 4 - t * 120) % (w + 200) + w + 200) % (w + 200) - 100; ctx.strokeStyle = '#2a1840'; ctx.lineWidth = h * 0.012; ctx.beginPath(); ctx.moveTo(x, h * 0.56); ctx.quadraticCurveTo(x + 6, h * 0.42, x + 2, h * 0.3); ctx.stroke(); ctx.fillStyle = '#2a1840'; for (let k = 0; k < 6; k++) { ctx.save(); ctx.translate(x + 2, h * 0.3); ctx.rotate(-Math.PI + k * Math.PI / 5); ctx.beginPath(); ctx.ellipse(h * 0.04, 0, h * 0.045, h * 0.01, 0.25, 0, 7); ctx.fill(); ctx.restore(); } }
    const cy = h * 0.8 + Math.sin(t * 8) * 1.5; ctx.fillStyle = '#e0306a'; rr(ctx, w * 0.36, cy - h * 0.06, w * 0.26, h * 0.08, h * 0.02); ctx.fill(); ctx.fillStyle = '#1a1424'; rr(ctx, w * 0.42, cy - h * 0.1, w * 0.13, h * 0.05, h * 0.015); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(w * 0.41, cy + h * 0.02, h * 0.03, 0, 7); ctx.arc(w * 0.57, cy + h * 0.02, h * 0.03, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.arc(w * 0.09, h * 0.85, h * 0.1, 0, 7); ctx.fill(); ctx.strokeStyle = '#8af'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(w * 0.09, h * 0.82); ctx.lineTo(w * 0.1, h * 0.87); ctx.lineTo(w * 0.08, h * 0.87); ctx.closePath(); ctx.fill();
    const est = s && s.boss ? 3 : 1; for (let i = 0; i < 5; i++) txt(ctx, '★', w * (0.95 - i * 0.035), h * 0.08, Math.round(h * 0.045), i < est ? '#fff' : 'rgba(255,255,255,.25)', 'right', 900, 'Arial');
    txt(ctx, 'R$ ' + (12000 + (s ? s.area * 3500 : 0)).toLocaleString('pt-BR'), w * 0.95, h * 0.15, Math.round(h * 0.045), '#7CFC9A', 'right', 800);
  };
  G.retro = (ctx, w, h, s, t) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#5c94fc'; ctx.fillRect(0, 0, w, h); const bs = h / 14;
    const off = (t * 40) % bs;
    for (let x = -1; x < w / bs + 1; x++) { ctx.fillStyle = '#c84c0c'; ctx.fillRect(x * bs - off, h - bs * 2, bs - 1, bs - 1); ctx.fillRect(x * bs - off, h - bs, bs - 1, bs - 1); if (x % 7 === 3) { ctx.fillStyle = '#fca044'; ctx.fillRect(x * bs - off, h - bs * 6, bs - 1, bs - 1); } }
    ctx.fillStyle = '#00a800'; ctx.fillRect(w * 0.7 - off, h - bs * 4, bs * 2, bs * 2);
    ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { ctx.fillRect(((i * 300 - t * 10) % (w + 100) + w) % (w + 100) - 50, h * (0.15 + i * 0.07), bs * 2, bs * 0.6); }
    const jump = Math.abs(Math.sin(t * 3)) * bs * 2; ctx.fillStyle = '#e03030'; ctx.fillRect(w * 0.3, h - bs * 3 - jump, bs * 0.8, bs); ctx.fillStyle = '#f8b878'; ctx.fillRect(w * 0.3 + bs * 0.1, h - bs * 3.6 - jump, bs * 0.6, bs * 0.6);
    if (s) { const tm = (s.split || 0) * 47 + Math.floor(t) % 47; txt(ctx, Math.floor(tm / 60) + ':' + String(tm % 60).padStart(2, '0') + '.' + String(Math.floor(t * 100) % 100).padStart(2, '0'), w * 0.96, h * 0.08, Math.round(h * 0.05), (s.split || 0) > 2 ? '#7eff7e' : '#fff', 'right', 700, 'JetBrains Mono, monospace'); }
    ctx.imageSmoothingEnabled = true;
  };
  G.conversa = (ctx, w, h, s, t, o) => { P.room(ctx, w, h, t, o); };
  G.react = (ctx, w, h, s, t) => {
    ctx.fillStyle = '#101218'; ctx.fillRect(0, 0, w, h);
    const vx = w * 0.04, vy = h * 0.06, vw = w * 0.62, vh = vw * 9 / 16; ctx.fillStyle = '#000'; ctx.fillRect(vx, vy, vw, vh);
    const r = U.mulberry((s ? s.n : 0) + 1); ctx.fillStyle = grad(ctx, vx, vy, vx + vw, vy + vh, ['hsl(' + Math.round(r() * 360) + ',60%,45%)', 'hsl(' + Math.round(r() * 360) + ',60%,25%)']); ctx.fillRect(vx, vy, vw, vh * 0.92);
    ctx.fillStyle = '#ffe9b0'; ctx.beginPath(); ctx.ellipse(vx + vw * (0.5 + Math.sin(t) * 0.2), vy + vh * 0.6, vw * 0.09, vh * 0.12, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.arc(vx + vw * (0.53 + Math.sin(t) * 0.2), vy + vh * 0.42, vw * 0.05, 0, 7); ctx.fill();
    ctx.fillStyle = '#333'; ctx.fillRect(vx, vy + vh * 0.94, vw, 4); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(vx, vy + vh * 0.94, vw * ((t * 0.05) % 1), 4);
    if (s) txt(ctx, 'Vídeo ' + (s.n + 1) + ' da lista', vx, vy + vh + h * 0.06, Math.round(h * 0.035), '#fff', 'left', 700);
  };
  P.GAMES = G;

  // quarto/escritório atrás da câmera (o "cenário" da live)
  P.room = (ctx, w, h, t, o) => {
    const G0 = SL.G; const deco = G0 ? G0.home.deco : [];
    const studio = G0 && G0.home.studio; const it = G0 ? G0.home.items : {};
    const PAREDE = { kitnet: ['#3f3a4a', '#2b2734'], apto: ['#3b4252', '#282d38'], casa: ['#4a4038', '#332c26'], cobertura: ['#2f3d45', '#1f2a30'], mansao: ['#3d3a30', '#2a2820'] };
    const hid = G0 ? G0.home.id : 'kitnet'; const par = PAREDE[hid] || PAREDE[Object.keys(PAREDE)[(hid || '').length % 5]];
    ctx.fillStyle = grad(ctx, 0, 0, 0, h, studio ? ['#1d1838', '#120f22'] : par); ctx.fillRect(0, 0, w, h);
    // rodapé e chão
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(0, h * 0.9, w, h * 0.1); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(0, h * 0.9, w, Math.max(1, h * 0.006));
    // janela da casa: céu de dia ou chuva escorrendo
    if (!studio) {
      const jx = w * 0.5, jy = h * 0.08, jw = w * 0.17, jh = h * 0.28; const chuva = G0 && G0.flags.chuva;
      ctx.fillStyle = '#d8d4cc'; ctx.fillRect(jx - w * 0.008, jy - h * 0.012, jw + w * 0.016, jh + h * 0.024);
      ctx.fillStyle = grad(ctx, 0, jy, 0, jy + jh, chuva ? ['#5d6873', '#47525c'] : ['#7fb8f0', '#b8dcff']); ctx.fillRect(jx, jy, jw, jh);
      if (chuva) { ctx.fillStyle = 'rgba(220,235,255,.5)'; for (let i = 0; i < 9; i++) { const k = ((t * (0.6 + (i % 4) * 0.17) + i * 0.29) % 1); ctx.fillRect(jx + jw * ((i * 0.113) % 1), jy + k * jh * 0.9, Math.max(1, w * 0.002), jh * 0.08); } }
      else { ctx.fillStyle = 'rgba(255,255,255,.85)'; const nx = jx + ((t * 0.01) % 1) * jw; ctx.beginPath(); ctx.ellipse(nx, jy + jh * 0.35, jw * 0.16, jh * 0.08, 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#d8d4cc'; ctx.fillRect(jx + jw / 2 - w * 0.003, jy, w * 0.006, jh); ctx.fillRect(jx, jy + jh / 2 - h * 0.004, jw, h * 0.008);
    }
    // painel acústico
    if (it.acustica && !studio) { ctx.fillStyle = '#2a2a33'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { ctx.fillRect(w * (0.27 + i * 0.045), h * (0.36 + j * 0.08), w * 0.04, h * 0.07); } }
    // luminária de chão acesa
    if (deco.includes('luminaria')) { const lx = w * 0.17; const gl = ctx.createRadialGradient(lx, h * 0.3, 1, lx, h * 0.3, h * 0.3); gl.addColorStop(0, 'rgba(255,220,150,.35)'); gl.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = gl; ctx.fillRect(lx - h * 0.3, 0, h * 0.6, h * 0.7); ctx.fillStyle = '#222'; ctx.fillRect(lx - w * 0.003, h * 0.32, w * 0.006, h * 0.58); ctx.fillStyle = '#f2e2c0'; ctx.beginPath(); ctx.moveTo(lx - w * 0.03, h * 0.33); ctx.lineTo(lx + w * 0.03, h * 0.33); ctx.lineTo(lx + w * 0.018, h * 0.25); ctx.lineTo(lx - w * 0.018, h * 0.25); ctx.closePath(); ctx.fill(); }
    // cama no canto (na casa pequena, o quarto é o escritório)
    if (it.cama && !studio && (hid === 'kitnet' || !G0.home.owned)) { const cor = it.cama === 'cama_premium' ? '#6b4fa0' : it.cama === 'cama_casal' ? '#2f6f8f' : '#8a6a4a'; ctx.fillStyle = '#5a3c28'; ctx.fillRect(w * 0.8, h * 0.74, w * 0.2, h * 0.17); ctx.fillStyle = '#e8e2d6'; ctx.fillRect(w * 0.81, h * 0.7, w * 0.19, h * 0.08); ctx.fillStyle = cor; ctx.fillRect(w * 0.81, h * 0.75, w * 0.19, h * 0.12); ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.ellipse(w * 0.88, h * 0.7, w * 0.04, h * 0.03, 0, 0, 7); ctx.fill(); }
    if (deco.includes('led')) { const hue = (t * 20) % 360; ctx.fillStyle = 'hsla(' + hue + ',90%,60%,.28)'; ctx.fillRect(0, h * 0.1, w, h * 0.04); const g = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.5); g.addColorStop(0, 'hsla(' + hue + ',90%,60%,.18)'); g.addColorStop(1, 'transparent'); ctx.fillStyle = g; ctx.fillRect(0, h * 0.1, w, h * 0.4); }
    if (deco.includes('estante')) { ctx.fillStyle = '#5a3a2a'; ctx.fillRect(w * 0.72, h * 0.15, w * 0.22, h * 0.6); ctx.fillStyle = '#3a2418'; for (let i = 0; i < 4; i++) ctx.fillRect(w * 0.72, h * (0.28 + i * 0.13), w * 0.22, h * 0.015); const r = U.mulberry(3); for (let i = 0; i < 10; i++) { ctx.fillStyle = D.shirtColors[i % D.shirtColors.length]; ctx.fillRect(w * (0.74 + r() * 0.17), h * (0.2 + Math.floor(i / 3) * 0.13), w * 0.02, h * 0.07); } }
    if (deco.includes('neon') && G0) { ctx.save(); ctx.shadowColor = '#ff3d81'; ctx.shadowBlur = 18; txt(ctx, G0.player.channel, w * 0.06, h * 0.2, Math.round(h * 0.08), '#ff7ab0', 'left', 800); ctx.restore(); }
    if (deco.includes('poster') && SL.Capa) { const id = (SL.Creators && SL.Creators.playerMainGame && SL.Creators.playerMainGame()) || 'blocolandia'; const g = D.gameById(id); const pw = h * 0.2, ph = pw * 4 / 3; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(w * 0.085 + 3, h * 0.3 + 4, pw, ph); ctx.fillStyle = '#eee'; ctx.fillRect(w * 0.085 - 2, h * 0.3 - 2, pw + 4, ph + 4); ctx.drawImage(SL.Capa.img(g && !g.nongame ? id : 'blocolandia'), w * 0.085, h * 0.3, pw, ph); }
    if (G0 && G0.placas && SL.Capa && SL.Placas) SL.Placas.lista().forEach((pl, i) => { const pw = h * 0.15, ph = pw * 1.3, px = w * (0.62 + i * 0.1), py = h * 0.08; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(px + 3, py + 4, pw, ph); ctx.drawImage(SL.Capa.placa(pl.id, G0.player.channel), px, py, pw, ph); });
    if (deco.includes('quadro')) { ctx.fillStyle = '#efe6d6'; ctx.fillRect(w * 0.26, h * 0.12, w * 0.14, h * 0.18); ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(w * 0.31, h * 0.2, h * 0.04, 0, 7); ctx.fill(); ctx.fillStyle = '#ff5a36'; ctx.fillRect(w * 0.33, h * 0.18, w * 0.05, h * 0.08); }
    if (deco.includes('planta')) { ctx.fillStyle = '#7a4a2a'; ctx.fillRect(w * 0.04, h * 0.7, w * 0.06, h * 0.1); ctx.fillStyle = '#3f8f3a'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(w * 0.07 + Math.cos(i) * w * 0.02, h * 0.62 - i * h * 0.02, w * 0.02, h * 0.05, i, 0, 7); ctx.fill(); } }
    if (studio) { ctx.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) ctx.fillRect(w * 0.5 + i * w * 0.04, h * 0.1 + j * h * 0.07, w * 0.035, h * 0.06); }
    // a sua cadeira, atrás de você
    if (it.cadeira) {
      const cx = w * 0.5; const cad = it.cadeira;
      if (cad === 'cadeira_gamer') { ctx.fillStyle = '#16161c'; rr(ctx, cx - w * 0.15, h * 0.3, w * 0.3, h * 0.75, w * 0.05); ctx.fill(); ctx.fillStyle = '#d6283b'; ctx.fillRect(cx - w * 0.11, h * 0.34, w * 0.03, h * 0.6); ctx.fillRect(cx + w * 0.08, h * 0.34, w * 0.03, h * 0.6); }
      else if (cad === 'cadeira_ergo' || cad === 'cadeira_escritorio') { ctx.fillStyle = '#20232b'; rr(ctx, cx - w * 0.13, h * 0.36, w * 0.26, h * 0.7, w * 0.04); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(cx - w * 0.12, h * (0.36 + i * 0.1)); ctx.lineTo(cx + w * 0.12, h * (0.36 + i * 0.1)); ctx.stroke(); } }
      else { ctx.fillStyle = '#e8e8e4'; rr(ctx, cx - w * 0.12, h * 0.48, w * 0.24, h * 0.6, w * 0.03); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 3; i++) ctx.fillRect(cx - w * 0.09, h * (0.52 + i * 0.05), w * 0.18, h * 0.015); }
    }
    if (G0 && G0.home.dirt > 55) { ctx.fillStyle = '#8a8a7a'; ctx.beginPath(); ctx.ellipse(w * 0.85, h * 0.92, w * 0.08, h * 0.05, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#5a6a8a'; ctx.fillRect(w * 0.8, h * 0.85, w * 0.05, h * 0.04); }
  };

  // ---------- câmera do streamer ----------
  const camCv = document.createElement('canvas');
  P.webcam = (ctx, x, y, w, h, o) => {
    const G0 = SL.G; const st = SL.Equip.stats(); o = o || {};
    const q = U.clamp(st.video, 5, 100), light = st.light;
    const res = q < 25 ? 0.16 : q < 45 ? 0.3 : q < 70 ? 0.55 : 1;
    const cw = Math.max(24, Math.round(w * res)), ch = Math.max(18, Math.round(h * res));
    camCv.width = cw; camCv.height = ch;
    const c = camCv.getContext('2d');
    P.room(c, cw, ch, o.t || 0);
    A.portrait(c, G0.player.look, cw * 0.5, ch * 0.66, ch * 0.92, { expr: o.expr || 'neutro' });
    if (light < 40) { c.fillStyle = 'rgba(0,0,10,' + (0.45 - light / 100) + ')'; c.fillRect(0, 0, cw, ch); }
    if (q > 80) { const g = c.createRadialGradient(cw / 2, ch / 2, ch * 0.2, cw / 2, ch / 2, ch * 0.8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = g; c.fillRect(0, 0, cw, ch); }
    ctx.save(); rr(ctx, x, y, w, h, Math.min(12, w * 0.05)); ctx.clip();
    ctx.imageSmoothingEnabled = res >= 0.55; ctx.drawImage(camCv, x, y, w, h); ctx.imageSmoothingEnabled = true;
    if (q < 30) { ctx.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 40; i++) ctx.fillRect(x + Math.random() * w, y + Math.random() * h, 2, 2); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2; rr(ctx, x, y, w, h, Math.min(12, w * 0.05)); ctx.stroke();
  };

  // composição completa da live
  let frozen = null, freezeUntil = 0;
  // câmera com a cadeira vazia (o streamer levantou do PC)
  const camVazia = (ctx, x, y, w, h) => {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = grad(ctx, x, y, x, y + h, ['#2a2540', '#14121f']); ctx.fillRect(x, y, w, h);
    const cx = x + w / 2, s = Math.min(w, h);
    ctx.fillStyle = '#1b1b24'; rr(ctx, cx - s * 0.22, y + h * 0.28, s * 0.44, h * 0.5, s * 0.08); ctx.fill();
    ctx.fillStyle = '#26263a'; rr(ctx, cx - s * 0.17, y + h * 0.34, s * 0.34, h * 0.36, s * 0.06); ctx.fill();
    ctx.fillStyle = '#101018'; ctx.fillRect(cx - s * 0.3, y + h * 0.74, s * 0.6, h * 0.1);
    if (w < ctx.canvas.clientWidth * 0.6) txt(ctx, 'ausente', cx, y + h * 0.16, Math.max(9, Math.round(s * 0.09)), '#b49dff', 'center', 700, 'Inter, Arial');
    ctx.restore();
  };
  P.live = (cv, L, tSec) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1); const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const now = performance.now();
    // quadros perdidos: congela a imagem por instantes
    if (L.tech && L.tech.smooth < 0.75 && now < freezeUntil && frozen) { return; }
    const g = D.gameById(L.game);
    const paused = L.ev.paused > 0;
    // expressão pela situação
    const last = L.sim.last[0]; let expr = 'neutro';
    const age = last ? (SL.G.time.t - last.at) : 99;
    if (last && age <= 2) expr = last.type === 'jumpscare' ? 'surpreso' : last.funny > 0.7 ? 'rindo' : last.good === true ? (last.big ? 'rindo' : 'feliz') : last.good === false ? (last.int > 0.5 ? 'bravo' : 'triste') : 'neutro';
    else if (SL.Life.perf() < 0.7) expr = 'cansado'; else if (L.focus) expr = 'concentrado'; else if (L.hype > 65) expr = 'feliz';
    if (L.ev.celeb && SL.G.time.t - L.t0 - L.ev.celebT < 3) expr = 'surpreso';
    if (paused) {
      ctx.fillStyle = grad(ctx, 0, 0, w, h, ['#1d1840', '#0b0d14']); ctx.fillRect(0, 0, w, h);
      txt(ctx, 'JÁ VOLTO', w / 2, h * 0.45, Math.round(h * 0.11), '#fff', 'center', 800);
      txt(ctx, 'pausa rapidinha · ' + L.ev.paused + ' min', w / 2, h * 0.58, Math.round(h * 0.04), '#b49dff', 'center', 600, 'Inter, Arial');
    } else if (g.sim === 'conversa' || L.layout === 'camera') {
      if (L.away) camVazia(ctx, 0, 0, w, h); else P.webcam(ctx, 0, 0, w, h, { expr, t: tSec });
    } else {
      G[g.tela || g.sim](ctx, w, h, L.sim, L.away ? (L._awayT || (L._awayT = tSec)) : tSec, {});
      if (!L.away) L._awayT = 0;
      if (L.cam && L.layout !== 'sem') {
        const cw = L.layout === 'dividida' ? w * 0.42 : w * 0.24, ch = cw * 0.75;
        const cx = L.layout === 'dividida' ? w - cw - w * 0.02 : w - cw - w * 0.02, cy = L.layout === 'dividida' ? h * 0.28 : h - ch - h * 0.04;
        if (L.away) camVazia(ctx, cx, cy, cw, ch); else P.webcam(ctx, cx, cy, cw, ch, { expr, t: tSec });
      }
    }
    // o que você está falando (fala automática): legenda embaixo da tela por 6 segundos
    if (L.fala && !L.ev.ad && !L.away && performance.now() - L.fala.at < 6000) {
      const fs = Math.max(10, Math.round(h * 0.034)); ctx.font = '600 ' + fs + 'px Inter, Arial';
      const pal = L.fala.t.split(' '); const linhas = ['']; pal.forEach(p => { const tt = (linhas[linhas.length - 1] + ' ' + p).trim(); if (ctx.measureText(tt).width > w * 0.62 && linhas[linhas.length - 1]) linhas.push(p); else linhas[linhas.length - 1] = tt; });
      const lh = fs * 1.35, bw = Math.max(...linhas.map(l => ctx.measureText(l).width)) + fs * 1.4, bh = linhas.length * lh + fs * 0.7, bx = (w - bw) / 2, by = h - bh - h * 0.1;
      ctx.fillStyle = 'rgba(8,10,16,.78)'; rr(ctx, bx, by, bw, bh, 6); ctx.fill();
      linhas.forEach((l, i) => txt(ctx, l, w / 2, by + fs * 0.35 + lh * (i + 0.5), fs, '#fff', 'center', 600, 'Inter, Arial'));
    }
    if (L.ev.ad) {
      ctx.fillStyle = 'rgba(6,7,12,.86)'; ctx.fillRect(0, 0, w, h);
      txt(ctx, 'INTERVALO COMERCIAL', w / 2, h * 0.42, Math.round(h * 0.075), '#fff', 'center', 800);
      const fim = L.ev.ad.until, ini = L.ev.ad.t0; const k = U.clamp((SL.G.time.t + SL.Clock.fraction() - ini) / Math.max(1, fim - ini), 0, 1);
      txt(ctx, 'volta em ' + Math.max(1, Math.ceil(L.ev.ad.s * (1 - k))) + ' s', w / 2, h * 0.53, Math.round(h * 0.04), '#b49dff', 'center', 600, 'Inter, Arial');
      ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(ctx, w * 0.3, h * 0.6, w * 0.4, h * 0.02, 4); ctx.fill();
      ctx.fillStyle = '#9146ff'; rr(ctx, w * 0.3, h * 0.6, w * 0.4 * k, h * 0.02, 4); ctx.fill();
    } else if (L.ev.spon) {
      const tw = w * 0.34, th = h * 0.085, x0 = w - tw - w * 0.02, y0 = h * 0.03;
      ctx.fillStyle = 'rgba(8,10,16,.82)'; rr(ctx, x0, y0, tw, th, 8); ctx.fill();
      ctx.fillStyle = '#ffd166'; rr(ctx, x0, y0, w * 0.012, th, 4); ctx.fill();
      txt(ctx, 'APOIO', x0 + w * 0.025, y0 + th * 0.32, Math.round(h * 0.024), '#ffd166', 'left', 800);
      txt(ctx, L.ev.spon.name, x0 + w * 0.025, y0 + th * 0.68, Math.round(h * 0.034), '#fff', 'left', 800);
    }
    if (L.away && !L.ev.ad) {
      ctx.fillStyle = 'rgba(8,10,16,.78)'; rr(ctx, w * 0.3, h * 0.03, w * 0.4, h * 0.075, 6); ctx.fill();
      txt(ctx, 'JÁ VOLTO', w / 2, h * 0.068, Math.round(h * 0.04), '#fff', 'center', 800);
    }
    // sobreposições
    const s = SL.Equip.stats();
    ctx.fillStyle = 'rgba(8,10,16,.7)'; rr(ctx, w * 0.015, h - h * 0.075, w * 0.3, h * 0.055, 6); ctx.fill();
    txt(ctx, SL.G.player.channel + (SL.G.equip.soft.overlays ? '  ·  segue aí' : ''), w * 0.03, h - h * 0.047, Math.round(h * 0.028), '#fff', 'left', 700);
    if (SL.G.equip.soft.overlays) { const goal = Math.max(10, Math.ceil((SL.G.ch.pulso.f + 1) / 50) * 50); ctx.fillStyle = 'rgba(8,10,16,.75)'; rr(ctx, w * 0.015, h * 0.02, w * 0.28, h * 0.05, 6); ctx.fill(); ctx.fillStyle = '#8b5cf6'; rr(ctx, w * 0.015, h * 0.02, w * 0.28 * (SL.G.ch.pulso.f / goal), h * 0.05, 6); ctx.fill(); txt(ctx, 'Meta: ' + SL.G.ch.pulso.f + '/' + goal + ' seguidores', w * 0.03, h * 0.045, Math.round(h * 0.024), '#fff', 'left', 700, 'Inter, Arial'); }
    // qualidade baixa: pixelado e com ruído; rede ruim: carregando
    const pres = Q => Q === '480p' ? 0.4 : 1;
    if (pres(L.quality) < 1 || L.tech.img < 35) {
      const sc = U.clamp(Math.min(pres(L.quality), 0.3 + L.tech.img / 100), 0.25, 1);
      if (sc < 0.95) { const tmp = P._tmp || (P._tmp = document.createElement('canvas')); tmp.width = Math.max(32, Math.round(w * sc)); tmp.height = Math.max(18, Math.round(h * sc)); const tc = tmp.getContext('2d'); tc.drawImage(cv, 0, 0, tmp.width, tmp.height); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, 0, cv.width, cv.height); ctx.restore(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    }
    if (L.ev.net > 0) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(w / 2, h / 2, h * 0.06, now / 200, now / 200 + 4.5); ctx.stroke(); txt(ctx, 'Conexão instável...', w / 2, h / 2 + h * 0.11, Math.round(h * 0.035), '#fff', 'center', 600, 'Inter, Arial'); }
    if (L.ev.mic) { ctx.fillStyle = 'rgba(255,77,94,.9)'; rr(ctx, w * 0.36, h * 0.02, w * 0.28, h * 0.055, 6); ctx.fill(); txt(ctx, 'MICROFONE SEM SINAL', w / 2, h * 0.048, Math.round(h * 0.026), '#fff', 'center', 800); }
    if (L.tech.smooth < 0.75) { freezeUntil = now + (1 - L.tech.smooth) * 500 * Math.random(); frozen = true; }
  };

  // ---------- thumbnails ----------
  const cache = new Map();
  const thumbKey = (o) => JSON.stringify([o.game, o.th, o.title && o.title.slice(0, 20), o.creator, o.seed]);
  // o = { game, th: {scene, expr, text, color, arrow, circle}, look, seed }
  P.thumbTo = (cv, o) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1); const w = cv.clientWidth || 320, h = cv.clientHeight || 180;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    const key = thumbKey(o) + w;
    let img = cache.get(key);
    if (!img) {
      img = document.createElement('canvas'); img.width = cv.width; img.height = cv.height;
      const c = img.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      P.drawThumb(c, w, h, o);
      cache.set(key, img); if (cache.size > 160) cache.delete(cache.keys().next().value);
    }
    ctx.drawImage(img, 0, 0);
  };
  P.drawThumb = (c, w, h, o) => {
    const g = D.gameById(o.game) || D.gameById('conversa');
    const th = o.th || { expr: 'surpreso', text: '', color: '#ffe066' };
    const sim = SL.GameSim.make(g.id); const r = U.mulberry(U.hash(String(o.seed || o.title || 'x')));
    for (let i = 0; i < (th.scene || 0) + 3; i++) SL.GameSim.sims[g.sim].step(sim, { skill: 0.5, perf: 1, char: 50 }, []);
    if (g.sim === 'conversa' || o.vlog) { c.fillStyle = grad(c, 0, 0, w, h, ['hsl(' + Math.round(r() * 360) + ',55%,40%)', '#12141c']); c.fillRect(0, 0, w, h); }
    else G[g.tela || g.sim](c, w, h, sim, r() * 20, {});
    c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(0, 0, w, h);
    const look = o.look || (SL.G && SL.G.player.look) || A.randomLook(r);
    c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 12; A.portrait(c, look, w * 0.24, h * 0.72, h * 0.95, { expr: th.expr || 'surpreso' }); c.restore();
    if (th.text) {
      const words = th.text.toUpperCase().split(/\s+/); const lines = []; let cur = '';
      words.forEach(wd => { if ((cur + ' ' + wd).trim().length > 12) { if (cur) lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); }); if (cur) lines.push(cur);
      const fs = Math.round(h * (lines.length > 2 ? 0.15 : 0.2));
      c.font = '800 ' + fs + 'px Sora, Arial'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.lineJoin = 'round';
      lines.slice(0, 3).forEach((ln, i) => { const y = h * 0.3 + i * fs * 1.05; c.lineWidth = fs * 0.22; c.strokeStyle = '#000'; c.strokeText(ln, w * 0.96, y); c.fillStyle = th.color || '#ffe066'; c.fillText(ln, w * 0.96, y); });
    }
    if (th.arrow) { c.fillStyle = '#ff3b3b'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); const ax = w * 0.6, ay = h * 0.72; c.moveTo(ax, ay); c.lineTo(ax + w * 0.12, ay - h * 0.08); c.lineTo(ax + w * 0.1, ay - h * 0.02); c.lineTo(ax + w * 0.2, ay - h * 0.02); c.lineTo(ax + w * 0.2, ay + h * 0.05); c.lineTo(ax + w * 0.1, ay + h * 0.05); c.lineTo(ax + w * 0.12, ay + h * 0.11); c.closePath(); c.fill(); c.stroke(); }
    if (th.circle) { c.strokeStyle = '#ff3b3b'; c.lineWidth = Math.max(3, h * 0.025); c.beginPath(); c.ellipse(w * 0.82, h * 0.72, w * 0.1, h * 0.16, 0, 0, 7); c.stroke(); }
  };

  // ---------- fotos do Instagram ----------
  P.photo = (cv, ph) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1); const w = cv.clientWidth || 300, h = cv.clientHeight || 190;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const look = (SL.G && SL.G.player.look) || A.randomLook();
    if (ph.kind === 'setup') { P.room(c, w, h, 3); c.fillStyle = '#2a2230'; c.fillRect(0, h * 0.68, w, h * 0.32); c.fillStyle = '#4a3a2a'; c.fillRect(w * 0.1, h * 0.6, w * 0.8, h * 0.06); const st = ph.setup || {}; c.fillStyle = '#0d0f14'; rr(c, w * 0.3, h * 0.25, w * 0.4, h * 0.33, 6); c.fill(); c.fillStyle = 'hsl(260,60%,45%)'; rr(c, w * 0.31, h * 0.27, w * 0.38, h * 0.29, 4); c.fill(); if (st.dual) { c.fillStyle = '#0d0f14'; rr(c, w * 0.72, h * 0.3, w * 0.2, h * 0.28, 5); c.fill(); } if (st.mic) { c.fillStyle = '#222'; c.fillRect(w * 0.2, h * 0.36, w * 0.03, h * 0.24); c.beginPath(); c.arc(w * 0.215, h * 0.34, w * 0.03, 0, 7); c.fill(); } if (st.light) { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(w * 0.1, h * 0.3, h * 0.1, 0, 7); c.stroke(); } }
    else if (ph.kind === 'selfie') { c.fillStyle = grad(c, 0, 0, w, h, ['#ff8fc1', '#8b5cf6']); c.fillRect(0, 0, w, h); A.portrait(c, look, w / 2, h * 0.68, h * 1.05, { expr: 'feliz' }); }
    else if (ph.kind === 'comida') { c.fillStyle = '#c8a27a'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(w / 2, h / 2, w * 0.3, h * 0.34, 0, 0, 7); c.fill(); c.fillStyle = '#e8d2a0'; c.beginPath(); c.ellipse(w / 2, h / 2, w * 0.24, h * 0.27, 0, 0, 7); c.fill(); const r = U.mulberry(7); for (let i = 0; i < 12; i++) { c.fillStyle = ['#d8432f', '#5fae3e', '#f5c542', '#7a4a2a'][i % 4]; c.beginPath(); c.arc(w / 2 + (r() - 0.5) * w * 0.3, h / 2 + (r() - 0.5) * h * 0.35, h * 0.04, 0, 7); c.fill(); } }
    else { const pl = D.placeById(ph.place) || D.places[6]; c.fillStyle = grad(c, 0, 0, 0, h, ['#7fb3e0', '#f3d1a6']); c.fillRect(0, 0, w, h); c.fillStyle = pl.color; c.fillRect(w * 0.15, h * 0.35, w * 0.7, h * 0.45); c.fillStyle = U.shade(pl.color, -0.3); c.fillRect(w * 0.12, h * 0.3, w * 0.76, h * 0.07); txt(c, pl.name, w / 2, h * 0.48, Math.round(h * 0.08), '#fff', 'center', 800); c.fillStyle = '#5fae3e'; c.fillRect(0, h * 0.8, w, h * 0.2); A.sprite(c, look, w * 0.3, h * 0.92, h / 80, {}); }
  };

  // ---------- papel de parede e fundo da tela inicial ----------
  P.wallpaper = (cv, t) => {
    const dpr = 1; const w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
    if (cv.width !== w) { cv.width = w * dpr; cv.height = h * dpr; }
    const c = cv.getContext('2d');
    c.fillStyle = grad(c, 0, 0, w, h, ['#151033', '#0b0d17', '#0d1a24']); c.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { c.strokeStyle = ['rgba(139,92,246,.35)', 'rgba(25,211,197,.22)', 'rgba(255,61,129,.18)', 'rgba(76,195,255,.15)'][i]; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= w; x += 12) { const y = h * (0.45 + i * 0.09) + Math.sin(x / (160 + i * 40) + t * 0.0003 * (i + 1) + i) * 40; x === 0 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
    if (SL.G) { c.globalAlpha = 0.07; txt(c, SL.G.player.channel.toUpperCase(), w - 30, h - 70, Math.round(Math.min(90, w / 10)), '#fff', 'right', 800); c.globalAlpha = 1; }
  };
  // fundo do menu: você ao vivo no seu quarto, com a moldura da live (AO VIVO, público e chat)
  const MENU_CHAT = [['luisgameplays', 'que live boa!'], ['bia_ama', 'boa noite chat'], ['Bigode', 'Seja bem-vindo, chega mais!'], ['ze_trovao', 'joga demais'], ['carol.s', 'primeira vez aqui :)'], ['tetedev', 'qual o setup?'], ['mari_x', 'kkkkkkkk'], ['rafa_tecinfo', 'bora subir esse canal']];
  P.menuStreamer = (cv, t, look) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1); const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // quarto (a mesma cena da câmera da live), desenhado mais à direita para o menu ficar livre à esquerda
    const rw = w, rx = 0;
    P.room(ctx, rw, h, t);
    const cx = w * 0.66;
    // luz de LED roxa e ring light
    const led = ctx.createRadialGradient(cx, h * 0.45, 10, cx, h * 0.45, h * 0.7); led.addColorStop(0, 'rgba(139,92,246,.16)'); led.addColorStop(1, 'rgba(139,92,246,0)'); ctx.fillStyle = led; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,250,235,.75)'; ctx.lineWidth = Math.max(4, h * 0.012); ctx.beginPath(); ctx.arc(rx + rw * 0.9, h * 0.3, h * 0.08, 0, 7); ctx.stroke();
    ctx.fillStyle = '#222'; ctx.fillRect(rx + rw * 0.9 - 2, h * 0.38, 4, h * 0.25);
    // você (fala e ri de vez em quando)
    const fase = Math.floor(t / 2.4) % 4; const expr = ['feliz', 'rindo', 'feliz', 'surpreso'][fase];
    const s = h * 0.62; A.portrait(ctx, look, cx, h * 0.66 + Math.sin(t * 1.3) * 2, s, { expr });
    // fone e microfone de braço
    ctx.strokeStyle = '#15151b'; ctx.lineWidth = Math.max(5, s * 0.03); ctx.beginPath(); ctx.arc(cx, h * 0.66 - s * 0.12, s * 0.3, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    ctx.strokeStyle = '#2a2a33'; ctx.lineWidth = Math.max(3, s * 0.012); ctx.beginPath(); ctx.moveTo(rx + rw * 0.99, h * 0.62); ctx.lineTo(cx + s * 0.5, h * 0.7); ctx.lineTo(cx + s * 0.36, h * 0.8); ctx.stroke();
    ctx.fillStyle = '#1b1b22'; rr(ctx, cx + s * 0.3, h * 0.76, s * 0.09, s * 0.16, s * 0.04); ctx.fill();
    // mesa e teclado com brilho
    ctx.fillStyle = '#17141f'; ctx.fillRect(rx, h * 0.9, rw, h * 0.1); ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(rx, h * 0.9, rw, 2);
    const kb = ctx.createLinearGradient(cx - s * 0.3, 0, cx + s * 0.3, 0); const hu = (t * 40) % 360; kb.addColorStop(0, 'hsla(' + hu + ',90%,60%,.55)'); kb.addColorStop(1, 'hsla(' + (hu + 120) + ',90%,60%,.55)');
    ctx.fillStyle = kb; rr(ctx, cx - s * 0.32, h * 0.915, s * 0.64, h * 0.035, 4); ctx.fill();
    // moldura da live
    const pad = Math.max(14, w * 0.018); const fs = Math.max(11, Math.round(h * 0.018));
    const vx = Math.max(rx + pad, w * 0.42);
    ctx.font = '800 ' + fs + 'px Inter, Arial'; const tag = 'AO VIVO'; const tw = ctx.measureText(tag).width + fs * 1.8;
    ctx.fillStyle = '#e5323e'; rr(ctx, vx, pad, tw, fs * 1.9, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(vx + fs * 0.75, pad + fs * 0.95, fs * 0.28 * (0.7 + 0.3 * Math.sin(t * 5)), 0, 7); ctx.fill();
    txt(ctx, tag, vx + fs * 1.25, pad + fs * 0.95, fs, '#fff', 'left', 800, 'Inter, Arial');
    const vis = 1200 + Math.round(Math.sin(t * 0.3) * 80 + t * 2) % 400;
    ctx.fillStyle = 'rgba(10,10,16,.7)'; rr(ctx, vx + tw + 8, pad, fs * 6.5, fs * 1.9, 5); ctx.fill();
    txt(ctx, U.int(vis) + ' assistindo', vx + tw + 8 + fs * 0.7, pad + fs * 0.95, fs, '#fff', 'left', 700, 'Inter, Arial');
    // chat subindo no canto
    const cw = Math.min(w * 0.22, 300), cxx = w - cw - pad; const linhas = 5; const lh = fs * 2.2; const k = t / 2.2;
    for (let i = 0; i < linhas; i++) {
      const idx = Math.floor(k) + i; const m = MENU_CHAT[idx % MENU_CHAT.length]; const y = h - pad - (linhas - i - (k % 1)) * lh;
      const a = Math.min(1, (i + 1 - (k % 1)) / 1.5); if (a <= 0) continue;
      ctx.globalAlpha = a * 0.92; ctx.fillStyle = 'rgba(10,10,16,.72)'; rr(ctx, cxx, y - lh * 0.42, cw, lh * 0.84, 6); ctx.fill();
      ctx.font = '700 ' + fs + 'px Inter, Arial'; const nw = ctx.measureText(m[0] + ':').width;
      txt(ctx, m[0] + ':', cxx + fs * 0.7, y, fs, m[0] === 'Bigode' ? '#22c55e' : ['#c4b5fd', '#7dd3fc', '#fca5a5', '#fde68a'][idx % 4], 'left', 700, 'Inter, Arial');
      txt(ctx, m[1], cxx + fs * 1.1 + nw, y, fs, '#e5e7eb', 'left', 500, 'Inter, Arial');
    }
    ctx.globalAlpha = 1;
  };
  P.titleBg = (cv, t) => {
    const w = cv.clientWidth, h = cv.clientHeight; if (!w) return; if (cv.width !== w) { cv.width = w; cv.height = h; }
    const c = cv.getContext('2d');
    c.fillStyle = grad(c, 0, 0, 0, h, ['#0b0a1d', '#1a1035', '#2a1438']); c.fillRect(0, 0, w, h);
    const r = U.mulberry(9);
    for (let i = 0; i < 90; i++) { c.fillStyle = 'rgba(255,255,255,' + (0.2 + r() * 0.6) * (0.6 + Math.sin(t / 900 + i) * 0.4) + ')'; c.fillRect(r() * w, r() * h * 0.5, 1.5, 1.5); }
    for (let layer = 0; layer < 2; layer++) {
      let x = -20 + ((t * (layer ? 0.004 : 0.0015)) % 60);
      const base = h * (layer ? 1 : 0.92);
      while (x < w + 60) {
        const bw = 30 + r() * 70, bh = h * (layer ? 0.15 + r() * 0.3 : 0.25 + r() * 0.35);
        c.fillStyle = layer ? '#0a0a14' : '#151228'; c.fillRect(x, base - bh, bw, bh);
        for (let wy = base - bh + 8; wy < base - 8; wy += 12) for (let wx = x + 6; wx < x + bw - 6; wx += 10) { if (r() < 0.32) { c.fillStyle = r() < 0.15 ? 'rgba(139,92,246,.75)' : 'rgba(255,214,140,' + (layer ? 0.55 : 0.3) + ')'; c.fillRect(wx, wy, 4, 6); } }
        x += bw + 4;
      }
    }
    const g = c.createRadialGradient(w * 0.75, h * 0.35, 10, w * 0.75, h * 0.35, w * 0.5); g.addColorStop(0, 'rgba(139,92,246,.25)'); g.addColorStop(1, 'transparent'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  };
})(window.SL);

/* Capas dos jogos e placas do YouTube (nov/2026), desenhadas no código (sem imagens de fora).
   SL.Capa.img(gameId) → tela 240x320 com a capa do jogo (guardada uma vez).
   SL.Capa.placa(tipo, canal) → tela 200x260 com a placa (prata, ouro ou diamante).
   SL.Capa.pintar(el) pinta todos os <canvas data-capa="id"> dentro do elemento. */
'use strict';
(function (SL) {
  const C = SL.Capa = {};
  const W = 240, H = 320;
  const cache = {};
  const lin = (c, x0, y0, x1, y1, cores) => { const g = c.createLinearGradient(x0, y0, x1, y1); cores.forEach((k, i) => g.addColorStop(i / (cores.length - 1), k)); return g; };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  // título grande com contorno e sombra
  const titulo = (c, txt, y, tam, cor, contorno, opt) => {
    opt = opt || {};
    c.save(); c.font = (opt.peso || 900) + ' ' + tam + 'px ' + (opt.fonte || 'Sora, Inter, Arial'); c.textAlign = 'center'; c.textBaseline = 'middle';
    let w = c.measureText(txt).width; if (w > W - 24) { tam = Math.floor(tam * (W - 24) / w); c.font = (opt.peso || 900) + ' ' + tam + 'px ' + (opt.fonte || 'Sora, Inter, Arial'); }
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    if (contorno) { c.lineWidth = Math.max(3, tam * 0.14); c.strokeStyle = contorno; c.lineJoin = 'round'; c.strokeText(txt, W / 2, y); }
    c.shadowColor = 'transparent'; c.fillStyle = cor; c.fillText(txt, W / 2, y); c.restore();
  };
  const sub = (c, txt, y, cor, tam) => { c.save(); c.font = '700 ' + (tam || 11) + 'px Inter, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = cor || 'rgba(255,255,255,.85)'; c.fillText(txt, W / 2, y); c.restore(); };
  const selo = (c, idade) => { const cor = { L: '#0a9a48', 10: '#0f7ad8', 12: '#e6b800', 14: '#e07a00', 16: '#d62020', 18: '#111' }[idade] || '#111'; c.fillStyle = cor; rr(c, 10, H - 34, 24, 24, 4); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); c.fillStyle = '#fff'; c.font = '900 12px Inter, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(idade), 22, H - 22); };
  const faixa = (c, txt, cor) => { c.fillStyle = cor || '#111'; c.fillRect(0, 0, W, 18); c.fillStyle = '#fff'; c.font = '800 10px Inter, Arial'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(txt, 8, 9.5); };
  const brilho = c => { c.fillStyle = lin(c, 0, 0, W, H, ['rgba(255,255,255,.14)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)', 'rgba(255,255,255,.06)']); c.fillRect(0, 0, W, H); };
  const palmeira = (c, x, y, s, cor) => { c.strokeStyle = cor; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 6 * s, y - 40 * s, x + 2 * s, y - 80 * s); c.stroke(); c.fillStyle = cor; for (let i = 0; i < 6; i++) { const a = -Math.PI + i * Math.PI / 5; c.save(); c.translate(x + 2 * s, y - 80 * s); c.rotate(a); c.beginPath(); c.ellipse(16 * s, 0, 18 * s, 4 * s, 0.25, 0, 7); c.fill(); c.restore(); } };

  const ARTE = {
    golplaca(c) { // FIFA 27
      c.fillStyle = lin(c, 0, 0, 0, H, ['#061a3a', '#0c2f66', '#123d7a']); c.fillRect(0, 0, W, H);
      for (let i = 0; i < 4; i++) { const gx = 20 + i * 66; const g = c.createRadialGradient(gx, 34, 1, gx, 34, 60); g.addColorStop(0, 'rgba(255,255,240,.9)'); g.addColorStop(1, 'rgba(255,255,240,0)'); c.fillStyle = g; c.beginPath(); c.arc(gx, 34, 60, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 96, W, 24);
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#1f8a3a' : '#25a043'; c.beginPath(); c.moveTo(i * W / 8 - 30 + i * 8, 120); c.lineTo((i + 1) * W / 8 - 30 + (i + 1) * 8, 120); c.lineTo((i + 1) * W / 8 * 1.6 - 90, H); c.lineTo(i * W / 8 * 1.6 - 90, H); c.closePath(); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.beginPath(); c.ellipse(W / 2, 230, 70, 22, 0, 0, 7); c.stroke(); c.beginPath(); c.moveTo(0, 230); c.lineTo(W, 230); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(W / 2 + 30, 262, 17, 0, 7); c.fill(); c.fillStyle = '#111'; for (const [dx, dy] of [[0, 0], [-9, -8], [9, -8], [-9, 8], [9, 8]]) { c.beginPath(); c.arc(W / 2 + 30 + dx, 262 + dy, dx || dy ? 3 : 5, 0, 7); c.fill(); }
      faixa(c, 'EA SPORTS', '#0b0b0b'); titulo(c, 'FIFA 27', 160, 54, '#fff', '#0b2a55'); sub(c, 'O JOGO DO MUNDO', 196); selo(c, 'L');
    },
    zonafinal(c) { // Fortnite
      c.fillStyle = lin(c, 0, 0, 0, H, ['#2b0f5e', '#6a2bd6', '#2ca7f0']); c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(160,80,255,.45)'; c.beginPath(); c.arc(W / 2, 70, 120, 0, 7); c.fill();
      c.fillStyle = '#1e7f3a'; c.beginPath(); c.moveTo(0, 250); c.quadraticCurveTo(70, 200, 130, 236); c.quadraticCurveTo(190, 210, W, 240); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      c.fillStyle = '#2a9df4'; rr(c, 120, 92, 70, 30, 6); c.fill(); c.fillStyle = '#e8e8f0'; c.fillRect(126, 98, 58, 8); c.fillStyle = '#ffd400'; c.beginPath(); c.arc(155, 72, 16, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(155, 88); c.lineTo(155, 92); c.stroke();
      titulo(c, 'FORTNITE', 170, 46, '#fff', '#2a0a5e', { fonte: 'Inter, Arial' }); sub(c, 'BATTLE ROYALE', 204, '#ffe14d', 12); selo(c, 12);
    },
    corredor13(c) { // Resident Evil Requiem
      c.fillStyle = lin(c, 0, 0, 0, H, ['#0a0606', '#2a0a0a', '#050303']); c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(180,20,20,.25)'; c.beginPath(); c.arc(W / 2, 110, 90, 0, 7); c.fill();
      c.fillStyle = '#0d0909'; c.beginPath(); c.moveTo(30, 220); c.lineTo(30, 150); c.lineTo(80, 110); c.lineTo(120, 150); c.lineTo(160, 110); c.lineTo(210, 150); c.lineTo(210, 220); c.closePath(); c.fill();
      c.fillStyle = '#ffcf6a'; c.fillRect(110, 170, 12, 16); c.fillStyle = 'rgba(255,207,106,.2)'; c.beginPath(); c.arc(116, 178, 22, 0, 7); c.fill();
      c.fillStyle = 'rgba(200,200,210,.08)'; for (let i = 0; i < 5; i++) c.fillRect(0, 210 + i * 12, W, 6);
      titulo(c, 'RESIDENT EVIL', 246, 30, '#e8e2dc', '#3a0000', { peso: 800, fonte: 'Georgia, serif' }); sub(c, 'R E Q U I E M', 276, '#c21f1f', 13); selo(c, 18);
    },
    turbo(c) { // Forza Horizon 6
      c.fillStyle = lin(c, 0, 0, 0, H, ['#ff8a3d', '#ff4f7b', '#5a2a8a']); c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,240,200,.85)'; c.beginPath(); c.arc(W / 2, 120, 34, 0, 7); c.fill();
      c.fillStyle = '#3a2a6a'; c.beginPath(); c.moveTo(20, 170); c.lineTo(120, 70); c.lineTo(220, 170); c.closePath(); c.fill(); c.fillStyle = '#f4f2ff'; c.beginPath(); c.moveTo(98, 92); c.lineTo(120, 70); c.lineTo(142, 92); c.lineTo(130, 98); c.lineTo(120, 90); c.lineTo(110, 98); c.closePath(); c.fill();
      c.fillStyle = '#20183a'; c.beginPath(); c.moveTo(0, 170); c.lineTo(W, 170); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      c.fillStyle = '#2b2b33'; c.beginPath(); c.moveTo(100, 170); c.lineTo(140, 170); c.lineTo(230, H); c.lineTo(10, H); c.closePath(); c.fill();
      c.strokeStyle = '#ffd36b'; c.lineWidth = 3; c.setLineDash([12, 10]); c.beginPath(); c.moveTo(120, 172); c.lineTo(120, H); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#d61f2c'; rr(c, 70, 236, 100, 34, 10); c.fill(); c.fillStyle = '#16121e'; rr(c, 86, 226, 68, 18, 8); c.fill(); c.fillStyle = '#fff6c8'; c.fillRect(74, 254, 16, 6); c.fillRect(150, 254, 16, 6);
      titulo(c, 'FORZA', 40, 40, '#fff', '#2a0a3a', { fonte: 'Inter, Arial' }); titulo(c, 'HORIZON 6', 78, 30, '#ffe14d', '#2a0a3a', { fonte: 'Inter, Arial' }); selo(c, 'L');
    },
    lendas(c) { // League of Legends
      c.fillStyle = lin(c, 0, 0, 0, H, ['#061424', '#0b2a44', '#03101c']); c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(200,170,110,.35)'; c.lineWidth = 2; for (let r = 40; r < 160; r += 30) { c.beginPath(); c.arc(W / 2, 140, r, 0, 7); c.stroke(); }
      c.fillStyle = lin(c, 0, 60, 0, 230, ['#f0e6d2', '#c8aa6e', '#785a28']); c.beginPath(); c.moveTo(W / 2, 60); c.lineTo(W / 2 + 12, 90); c.lineTo(W / 2 + 6, 200); c.lineTo(W / 2 - 6, 200); c.lineTo(W / 2 - 12, 90); c.closePath(); c.fill(); c.fillRect(W / 2 - 34, 196, 68, 10); c.fillRect(W / 2 - 5, 206, 10, 30);
      c.fillStyle = '#0ac8b9'; c.beginPath(); c.arc(W / 2, 201, 6, 0, 7); c.fill();
      titulo(c, 'LEAGUE OF', 262, 26, '#c8aa6e', '#1a1206', { peso: 800, fonte: 'Georgia, serif' }); titulo(c, 'LEGENDS', 290, 34, '#f0e6d2', '#1a1206', { peso: 800, fonte: 'Georgia, serif' }); selo(c, 12);
    },
    blocolandia(c) { // Minecraft
      c.fillStyle = lin(c, 0, 0, 0, 200, ['#5aa8ff', '#9fd2ff']); c.fillRect(0, 0, W, H);
      c.fillStyle = '#fff6a0'; c.fillRect(170, 30, 26, 26);
      c.fillStyle = '#fff'; [[30, 50, 50], [110, 70, 40]].forEach(([x, y, w]) => { c.fillRect(x, y, w, 12); c.fillRect(x + 10, y - 8, w - 20, 8); });
      const B = 16; for (let x = 0; x < W; x += B) { const h = 150 + Math.round(Math.sin(x * 0.04) * 2) * B; for (let y = h; y < H; y += B) { const top = y === h; c.fillStyle = top ? ((x / B) % 2 ? '#5fae3e' : '#6cbf47') : y < h + B * 3 ? ((x / B + y / B) % 2 ? '#8b5a2b' : '#7a4e25') : ((x / B + y / B) % 3 ? '#7d7d7d' : '#6a6a6a'); c.fillRect(x, y, B, B); if (top) { c.fillStyle = '#4f9a32'; c.fillRect(x, y + B - 4, B, 4); } } }
      c.fillStyle = '#5b3a1e'; c.fillRect(186, 102, 12, 48); c.fillStyle = '#3f8a2c'; c.fillRect(168, 70, 48, 36);
      c.save(); c.font = '900 34px "Courier New", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 6; c.strokeStyle = '#2a2a2a'; c.strokeText('MINECRAFT', W / 2, 250); c.fillStyle = lin(c, 0, 236, 0, 264, ['#e8e8e8', '#9a9a9a']); c.fillText('MINECRAFT', W / 2, 250); c.restore(); selo(c, 10);
    },
    punho(c) { // Street Fighter 6
      c.fillStyle = '#16141c'; c.fillRect(0, 0, W, H);
      const tinta = (x, y, r, cor) => { c.fillStyle = cor; c.beginPath(); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28; const rr2 = r * (0.7 + ((i * 37) % 10) / 22); c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill(); };
      tinta(70, 120, 90, '#ff2d8a'); tinta(180, 150, 90, '#ffd400'); tinta(120, 90, 60, '#29d3ff');
      const lutador = (x, dir, cor) => { c.fillStyle = cor; c.beginPath(); c.arc(x, 120, 14, 0, 7); c.fill(); c.fillRect(x - 14, 134, 28, 50); c.save(); c.translate(x, 146); c.rotate(dir * -0.6); c.fillRect(0, -6, dir * 44, 12); c.restore(); c.fillRect(x - 14, 184, 10, 44); c.fillRect(x + 4, 184, 10, 44); };
      lutador(80, 1, '#111'); lutador(165, -1, '#111');
      titulo(c, 'STREET', 252, 34, '#fff', '#111', { fonte: 'Inter, Arial' }); titulo(c, 'FIGHTER 6', 286, 30, '#ffd400', '#111', { fonte: 'Inter, Arial' }); selo(c, 12);
    },
    xeque(c) { // Chess.com
      c.fillStyle = lin(c, 0, 0, 0, H, ['#262421', '#312e2b']); c.fillRect(0, 0, W, H);
      for (let r = 0; r < 6; r++) for (let k = 0; k < 8; k++) { const y0 = 150 + r * 22, s = 0.6 + r * 0.1; c.fillStyle = (r + k) % 2 ? '#769656' : '#eeeed2'; const x0 = W / 2 + (k - 4) * 30 * s; c.fillRect(x0, y0, 30 * s + 0.5, 22); }
      c.fillStyle = '#f4f4f4'; c.beginPath(); c.moveTo(100, 150); c.lineTo(140, 150); c.lineTo(132, 130); c.lineTo(136, 96); c.lineTo(104, 96); c.lineTo(108, 130); c.closePath(); c.fill(); c.beginPath(); c.arc(120, 86, 12, 0, 7); c.fill(); c.fillRect(117, 60, 6, 18); c.fillRect(111, 66, 18, 5);
      titulo(c, 'Chess.com', 40, 34, '#81b64c', '#111', { peso: 800, fonte: 'Inter, Arial' }); sub(c, 'XADREZ ONLINE', 70); selo(c, 'L');
    },
    fazendinha(c) { // Stardew Valley
      c.fillStyle = lin(c, 0, 0, 0, 180, ['#7ec8f5', '#c8ecff']); c.fillRect(0, 0, W, H);
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(60, 60, 30, 12, 0, 0, 7); c.ellipse(180, 40, 24, 10, 0, 0, 7); c.fill();
      c.fillStyle = '#5daa3c'; c.beginPath(); c.moveTo(0, 170); c.quadraticCurveTo(120, 130, W, 170); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      c.fillStyle = '#7a4a24'; for (let i = 0; i < 5; i++) c.fillRect(20, 210 + i * 18, 200, 8);
      c.fillStyle = '#3f8a2c'; for (let i = 0; i < 5; i++) for (let k = 0; k < 8; k++) { c.beginPath(); c.arc(32 + k * 25, 208 + i * 18, 4, 0, 7); c.fill(); }
      c.fillStyle = '#b23a2a'; c.beginPath(); c.moveTo(150, 140); c.lineTo(180, 116); c.lineTo(210, 140); c.closePath(); c.fill(); c.fillStyle = '#e8d2a0'; c.fillRect(156, 140, 48, 34);
      c.fillStyle = '#7a4a24'; rr(c, 22, 28, 196, 70, 10); c.fill(); c.strokeStyle = '#4a2a12'; c.lineWidth = 3; c.stroke();
      titulo(c, 'STARDEW', 52, 28, '#ffe08a', '#4a2a12', { fonte: 'Georgia, serif' }); titulo(c, 'VALLEY', 82, 26, '#9be07a', '#2a4a12', { fonte: 'Georgia, serif' }); selo(c, 10);
    },
    estrela(c) { // GTA 6
      c.fillStyle = lin(c, 0, 0, 0, H, ['#ff6fa8', '#ff9a5a', '#5a2a8a', '#15102a']); c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,236,170,.9)'; c.beginPath(); c.arc(W / 2, 165, 44, 0, 7); c.fill();
      c.fillStyle = '#2a1840'; for (let i = 0; i < 12; i++) { const bh = 18 + ((i * 53) % 46); c.fillRect(i * 20, 214 - bh, 18, bh + 20); c.fillStyle = 'rgba(255,220,120,.6)'; for (let j = 0; j < 3; j++) c.fillRect(i * 20 + 4, 220 - bh + j * 10, 3, 4); c.fillStyle = '#2a1840'; }
      c.fillStyle = '#1a1030'; c.fillRect(0, 226, W, H);
      palmeira(c, 30, 240, 1.1, '#120a22'); palmeira(c, 210, 246, 1.2, '#120a22');
      c.fillStyle = 'rgba(0,240,255,.35)'; c.fillRect(0, 230, W, 2);
      titulo(c, 'GTA 6', 280, 58, '#fff', '#2a0a3a', { fonte: 'Inter, Arial' }); sub(c, 'GRAND THEFT AUTO VI', 46, '#fff', 13); selo(c, 18);
    },
    pixel(c) { // Tetris
      c.fillStyle = '#0a0a14'; c.fillRect(0, 0, W, H);
      const S = 20; const cores = ['#00e5ff', '#ffd400', '#b04aff', '#2ee86a', '#ff3b3b', '#2f6bff', '#ff8a00'];
      const pecas = [[[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[0, 0], [0, 1], [1, 1], [2, 1]], [[2, 0], [0, 1], [1, 1], [2, 1]]];
      const bloco = (x, y, cor) => { c.fillStyle = cor; c.fillRect(x, y, S - 1, S - 1); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, y, S - 1, 3); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x, y + S - 4, S - 1, 3); };
      [[0, 1, 1], [3, 3, 4], [6, 2, 1], [1, 5, 2], [8, 6, 3]].forEach(([p, gx, gy]) => pecas[p].forEach(([dx, dy]) => bloco((gx + dx) * S, (gy + dy) * S + 10, cores[p])));
      for (let y = 0; y < 4; y++) for (let x = 0; x < 12; x++) if ((x * 7 + y * 3) % 11 !== 0) bloco(x * S, H - (y + 1) * S, cores[(x + y) % 7]);
      const L = ['T', 'E', 'T', 'R', 'I', 'S']; c.font = '900 40px Inter, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; L.forEach((l, i) => { c.lineWidth = 6; c.strokeStyle = '#000'; c.strokeText(l, 40 + i * 32, 200); c.fillStyle = cores[i]; c.fillText(l, 40 + i * 32, 200); });
      selo(c, 'L');
    },
    conversa(c) {
      c.fillStyle = lin(c, 0, 0, W, H, ['#5b2bb8', '#9146ff', '#c084fc']); c.fillRect(0, 0, W, H);
      const bal = (x, y, w, cor) => { c.fillStyle = cor; rr(c, x, y, w, 34, 14); c.fill(); c.beginPath(); c.moveTo(x + 16, y + 34); c.lineTo(x + 10, y + 46); c.lineTo(x + 28, y + 34); c.fill(); };
      bal(26, 60, 130, 'rgba(255,255,255,.9)'); bal(84, 116, 130, 'rgba(255,255,255,.6)'); bal(40, 172, 110, 'rgba(255,255,255,.8)');
      titulo(c, 'Conversando', 262, 34, '#fff', '#2a0a5e', { peso: 800, fonte: 'Inter, Arial' }); selo(c, 'L');
    },
    react(c) {
      c.fillStyle = lin(c, 0, 0, W, H, ['#ff5a36', '#ff2d8a']); c.fillRect(0, 0, W, H);
      c.fillStyle = '#16121e'; rr(c, 30, 50, 180, 110, 10); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(108, 84); c.lineTo(108, 126); c.lineTo(142, 105); c.closePath(); c.fill();
      c.fillStyle = '#ffd400'; c.beginPath(); c.arc(70, 200, 26, 0, 7); c.fill(); c.fillStyle = '#16121e'; c.beginPath(); c.arc(62, 194, 3.5, 0, 7); c.arc(78, 194, 3.5, 0, 7); c.fill(); c.beginPath(); c.ellipse(70, 210, 8, 10, 0, 0, 7); c.fill();
      titulo(c, 'React', 262, 46, '#fff', '#5a0a1a', { fonte: 'Inter, Arial' }); selo(c, 'L');
    },
  };
  C.img = id => {
    if (cache[id]) return cache[id];
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const g = SL.D.gameById(id);
    try { (ARTE[id] || (cc => { cc.fillStyle = g ? g.color : '#333'; cc.fillRect(0, 0, W, H); titulo(cc, g ? g.name : id, H / 2, 30, '#fff', '#111'); }))(c); } catch (e) { /* capa simples */ }
    brilho(c);
    return (cache[id] = cv);
  };
  C.pintar = el => {
    el.querySelectorAll('canvas[data-capa]').forEach(cv => {
      const img = C.img(cv.dataset.capa); const r = cv.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(30, Math.round((r.width || 60) * dpr)), h = Math.round(w * H / W);
      if (cv.width !== w) { cv.width = w; cv.height = h; }
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
    });
  };

  // ---------- placas do YouTube (prata 100 mil, ouro 1 milhão, diamante 10 milhões) ----------
  C.PLACAS = [
    { id: 'prata', nome: 'Placa de Prata', meta: 100000, txt: '100.000', metal: ['#f4f6f8', '#aeb6bf', '#e8ecf0', '#8c949c'] },
    { id: 'ouro', nome: 'Placa de Ouro', meta: 1000000, txt: '1.000.000', metal: ['#fff2b0', '#d4a72c', '#ffe680', '#a77a12'] },
    { id: 'diamante', nome: 'Placa de Diamante', meta: 10000000, txt: '10.000.000', metal: ['#f0fbff', '#a9d8ef', '#ffffff', '#7fb7d6'] },
  ];
  const pcache = {};
  C.placa = (tipo, canal) => {
    const k = tipo + '|' + canal; if (pcache[k]) return pcache[k];
    const P = C.PLACAS.find(p => p.id === tipo) || C.PLACAS[0];
    const PW = 200, PH = 260; const cv = document.createElement('canvas'); cv.width = PW; cv.height = PH; const c = cv.getContext('2d');
    // moldura preta com borda
    c.fillStyle = lin(c, 0, 0, PW, PH, ['#2a2a2e', '#0c0c0e', '#1e1e22']); rr(c, 0, 0, PW, PH, 8); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; rr(c, 3, 3, PW - 6, PH - 6, 6); c.stroke();
    c.fillStyle = '#131316'; rr(c, 12, 12, PW - 24, PH - 24, 4); c.fill();
    // placa de metal
    const mx = 26, my = 30, mw = PW - 52, mh = 140;
    c.fillStyle = lin(c, mx, my, mx + mw, my + mh, P.metal); rr(c, mx, my, mw, mh, 6); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; rr(c, mx + 4, my + 4, mw - 8, mh - 8, 4); c.stroke();
    // botão de play em relevo (círculo com triângulo)
    const cx = PW / 2, cy = my + 62;
    if (tipo === 'diamante') { c.fillStyle = lin(c, cx - 40, cy - 40, cx + 40, cy + 40, ['#ffffff', '#bfe6ff', '#e8f8ff', '#8fd0f0']); c.beginPath(); c.moveTo(cx, cy - 44); c.lineTo(cx + 44, cy - 10); c.lineTo(cx, cy + 44); c.lineTo(cx - 44, cy - 10); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 44, cy - 10); c.lineTo(cx + 44, cy - 10); c.moveTo(cx, cy - 44); c.lineTo(cx - 16, cy - 10); c.lineTo(cx, cy + 44); c.lineTo(cx + 16, cy - 10); c.closePath(); c.stroke(); }
    else { c.fillStyle = lin(c, cx - 40, cy - 30, cx + 40, cy + 30, [P.metal[3], P.metal[0], P.metal[1]]); rr(c, cx - 42, cy - 30, 84, 60, 16); c.fill(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; rr(c, cx - 42, cy - 30, 84, 60, 16); c.stroke(); }
    c.fillStyle = tipo === 'diamante' ? 'rgba(255,255,255,.95)' : lin(c, cx - 10, cy - 14, cx + 14, cy + 14, [P.metal[0], P.metal[3]]); c.beginPath(); c.moveTo(cx - 11, cy - 16); c.lineTo(cx - 11, cy + 16); c.lineTo(cx + 17, cy); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(30,30,36,.75)'; c.font = '800 13px Inter, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('YouTube', cx, my + 118);
    // parafusos
    c.fillStyle = '#8a8f99'; [[20, 20], [PW - 20, 20], [20, PH - 20], [PW - 20, PH - 20]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); });
    // texto da placa
    c.fillStyle = '#d8d8de'; c.font = '600 9px Inter, Arial'; c.fillText('Entregue a', PW / 2, 188);
    c.fillStyle = '#ffffff'; c.font = '800 15px Inter, Arial'; let nome = String(canal || '').slice(0, 20); c.fillText(nome, PW / 2, 206, PW - 40);
    c.fillStyle = '#b8b8c2'; c.font = '600 8.5px Inter, Arial'; c.fillText('por ultrapassar ' + P.txt + ' inscritos', PW / 2, 224);
    // reflexo do vidro
    c.fillStyle = lin(c, 0, 0, PW, PH, ['rgba(255,255,255,.22)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)', 'rgba(255,255,255,.08)']); c.beginPath(); c.moveTo(12, 12); c.lineTo(120, 12); c.lineTo(12, 150); c.closePath(); c.fill();
    return (pcache[k] = cv);
  };
})(window.SL);

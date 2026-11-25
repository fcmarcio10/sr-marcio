/* Fotos dos produtos da loja (nov/2026): cada item ganha uma "foto de catálogo" desenhada no código,
   com fundo de estúdio claro, sombra no chão e o produto no centro. Desenho feito uma vez por item
   (cache em imagem) e copiado para as telinhas da loja. Uso: SL.Produto.pintar(elemento). */
'use strict';
(function (SL) {
  const PR = SL.Produto = {};
  const FW = 320, FH = 240;
  const cache = {};
  const rr = (c, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const lin = (c, x0, y0, x1, y1, cores) => { const g = c.createLinearGradient(x0, y0, x1, y1); cores.forEach((k, i) => g.addColorStop(i / (cores.length - 1), k)); return g; };
  const sombra = (c, x, y, w, h) => { const g = c.createRadialGradient(x, y, 1, x, y, w); g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.save(); c.translate(x, y); c.scale(1, h / w); c.beginPath(); c.arc(0, 0, w, 0, 7); c.fill(); c.restore(); };
  const brilho = (c, x, y, w, h, a) => { c.fillStyle = 'rgba(255,255,255,' + (a || 0.18) + ')'; rr(c, x, y, w, h, Math.min(w, h) / 2); c.fill(); };
  const rgb = (c, x, y, w, h, t) => { c.fillStyle = lin(c, x, y, x + w, y, ['#ff3d81', '#ffb547', '#35d39a', '#4cc3ff', '#8b5cf6']); rr(c, x, y, w, h, Math.min(w, h) / 2); c.fill(); void t; };
  const tela = (c, x, y, w, h, hue) => { c.fillStyle = lin(c, x, y, x + w, y + h, ['hsl(' + hue + ',70%,45%)', 'hsl(' + (hue + 60) + ',75%,30%)', '#0d1020']); c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w * 0.45, y); c.lineTo(x, y + h * 0.7); c.closePath(); c.fill(); };

  // ---------- equipamentos ----------
  const D_ = {
    computador: (c, it) => {
      const t = it.tier || 0;
      if (t === 0) { // notebook aberto
        sombra(c, 160, 196, 110, 12);
        c.fillStyle = '#2b2e35'; rr(c, 92, 62, 136, 92, 6); c.fill(); tela(c, 99, 69, 122, 78, 220);
        c.fillStyle = lin(c, 0, 154, 0, 196, ['#5c616b', '#3a3e46']); c.beginPath(); c.moveTo(92, 154); c.lineTo(228, 154); c.lineTo(250, 192); c.lineTo(70, 192); c.closePath(); c.fill();
        c.fillStyle = 'rgba(0,0,0,.35)'; for (let r = 0; r < 4; r++) for (let k = 0; k < 12; k++) c.fillRect(96 + k * 11 - r * 3 + (r * 2), 158 + r * 7, 9, 5);
        c.fillStyle = 'rgba(0,0,0,.25)'; rr(c, 140, 184, 40, 6, 2); c.fill(); return;
      }
      const corpo = t >= 3 ? '#f2f3f5' : '#1c1e23';
      sombra(c, 160, 208, 70, 10);
      c.fillStyle = corpo; rr(c, 112, 36, 96, 170, 8); c.fill();
      c.fillStyle = t >= 3 ? '#dcdfe4' : '#2a2d34'; rr(c, 112, 36, 18, 170, 6); c.fill();
      c.fillStyle = 'rgba(20,24,36,.88)'; rr(c, 134, 46, 66, 150, 5); c.fill();   // vidro lateral
      const fans = 1 + t;
      for (let i = 0; i < Math.min(3, fans); i++) { const y = 72 + i * 44; const g = c.createRadialGradient(167, y, 3, 167, y, 18); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.5, ['#8b5cf6', '#4cc3ff', '#ff3d81'][i % 3]); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(167, y, 18, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(167, y, 15, 0, 7); c.stroke(); }
      if (t >= 2) { c.fillStyle = '#3a3f4a'; c.fillRect(140, 150, 52, 14); rgb(c, 141, 163, 50, 2, 0); }
      brilho(c, 138, 50, 8, 140, 0.1);
      c.fillStyle = '#4cc3ff'; c.beginPath(); c.arc(121, 52, 2.6, 0, 7); c.fill();
    },
    monitor: (c, it) => {
      const duo = it.id === 'mon_duo'; const larg = it.id === 'mon_21' ? 150 : it.id === 'mon_24' ? 170 : 190;
      sombra(c, 160, 204, duo ? 140 : 80, 10);
      const um = (cx, w) => {
        c.fillStyle = '#2a2d33'; c.beginPath(); c.moveTo(cx - 28, 198); c.lineTo(cx + 28, 198); c.lineTo(cx + 22, 192); c.lineTo(cx - 22, 192); c.closePath(); c.fill(); c.fillRect(cx - 5, 150, 10, 44);
        c.fillStyle = '#16181c'; rr(c, cx - w / 2, 54, w, w * 0.6, 5); c.fill(); tela(c, cx - w / 2 + 4, 58, w - 8, w * 0.6 - 12, 250 + cx % 60);
        c.fillStyle = '#16181c'; c.fillRect(cx - w / 2, 54 + w * 0.6 - 8, w, 8);
      };
      if (duo) { um(98, 120); um(222, 120); } else um(160, larg);
    },
    microfone: (c, it) => {
      sombra(c, 160, 206, 60, 9);
      if (it.id === 'mic_usb') { c.strokeStyle = '#3a3d44'; c.lineWidth = 5; [[130, 204], [190, 204], [160, 210]].forEach(([x, y]) => { c.beginPath(); c.moveTo(160, 160); c.lineTo(x, y); c.stroke(); }); c.fillStyle = lin(c, 140, 0, 180, 0, ['#5b606a', '#9aa1ab', '#5b606a']); rr(c, 140, 60, 40, 104, 20); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 68; y < 110; y += 5) c.fillRect(146, y, 28, 2); c.fillStyle = '#35d39a'; c.beginPath(); c.arc(160, 132, 3, 0, 7); c.fill(); return; }
      if (it.id === 'mic_cond') { c.strokeStyle = '#2b2e35'; c.lineWidth = 6; c.beginPath(); c.moveTo(60, 210); c.lineTo(100, 120); c.lineTo(150, 108); c.stroke(); c.strokeStyle = '#9aa1ab'; c.lineWidth = 2; c.beginPath(); c.arc(170, 110, 34, 0, 7); c.stroke(); c.fillStyle = lin(c, 152, 0, 188, 0, ['#c8a86a', '#f0d79a', '#c8a86a']); rr(c, 152, 56, 36, 110, 18); c.fill(); c.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 62; y < 104; y += 5) c.fillRect(156, y, 28, 2); return; }
      c.fillStyle = '#16181c'; rr(c, 60, 160, 90, 40, 6); c.fill(); c.fillStyle = '#c0392b'; [80, 104, 128].forEach(x => { c.beginPath(); c.arc(x, 180, 8, 0, 7); c.fill(); });
      c.strokeStyle = '#2b2e35'; c.lineWidth = 6; c.beginPath(); c.moveTo(250, 210); c.lineTo(230, 120); c.lineTo(200, 100); c.stroke();
      c.save(); c.translate(196, 96); c.rotate(-0.5); c.fillStyle = lin(c, -16, 0, 16, 0, ['#1c1e23', '#4a4e57', '#1c1e23']); rr(c, -16, -50, 32, 96, 10); c.fill(); c.fillStyle = 'rgba(255,255,255,.1)'; for (let y = -44; y < -6; y += 5) c.fillRect(-12, y, 24, 2); c.restore();
    },
    webcam: (c, it) => {
      if (it.id === 'cam_mirror') { sombra(c, 160, 200, 80, 10); c.fillStyle = '#1c1e23'; rr(c, 92, 80, 136, 96, 10); c.fill(); c.fillStyle = '#2a2d34'; rr(c, 196, 66, 32, 20, 4); c.fill(); const g = c.createRadialGradient(150, 128, 4, 150, 128, 40); g.addColorStop(0, '#5b7fd8'); g.addColorStop(0.35, '#0b0d14'); g.addColorStop(1, '#2b2e35'); c.fillStyle = g; c.beginPath(); c.arc(150, 128, 40, 0, 7); c.fill(); c.strokeStyle = '#9aa1ab'; c.lineWidth = 3; c.stroke(); brilho(c, 136, 112, 12, 8, 0.5); return; }
      sombra(c, 160, 190, 70, 8);
      c.fillStyle = '#2a2d34'; rr(c, 136, 150, 48, 34, 6); c.fill();
      c.fillStyle = '#1c1e23'; rr(c, 100, 90, 120, 52, 26); c.fill();
      const g = c.createRadialGradient(160, 116, 2, 160, 116, 20); g.addColorStop(0, '#6a8fe0'); g.addColorStop(0.4, '#0b0d14'); g.addColorStop(1, '#3a3d44'); c.fillStyle = g; c.beginPath(); c.arc(160, 116, 20, 0, 7); c.fill(); brilho(c, 152, 106, 8, 6, 0.55);
      c.fillStyle = it.id === 'cam_fhd' ? '#35d39a' : '#ff5a5a'; c.beginPath(); c.arc(196, 116, 3, 0, 7); c.fill();
    },
    headset: (c, it) => {
      sombra(c, 160, 204, 80, 10);
      if (it.id === 'fone_simples') { c.strokeStyle = '#e8e8e8'; c.lineWidth = 3; c.beginPath(); c.moveTo(120, 100); c.bezierCurveTo(140, 190, 180, 190, 200, 100); c.stroke(); c.fillStyle = '#f4f4f4'; [[120, 92], [200, 92]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 12, 0, 7); c.fill(); }); return; }
      const cor = it.id === 'head_gamer' ? '#c0392b' : '#2b2e35';
      c.strokeStyle = '#1c1e23'; c.lineWidth = 14; c.beginPath(); c.arc(160, 130, 62, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
      c.strokeStyle = cor; c.lineWidth = 5; c.beginPath(); c.arc(160, 130, 62, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      [[96, 140], [224, 140]].forEach(([x, y]) => { c.fillStyle = '#1c1e23'; rr(c, x - 20, y - 34, 40, 68, 18); c.fill(); c.fillStyle = cor; rr(c, x - 12, y - 24, 24, 48, 12); c.fill(); brilho(c, x - 8, y - 20, 6, 20, 0.25); });
      if (it.id === 'head_gamer') { c.strokeStyle = '#1c1e23'; c.lineWidth = 5; c.beginPath(); c.moveTo(80, 160); c.quadraticCurveTo(84, 196, 120, 196); c.stroke(); }
    },
    teclado: (c, it) => {
      sombra(c, 160, 190, 130, 12);
      c.fillStyle = it.id === 'tec_membrana' ? '#2b2e35' : '#1c1e23'; c.beginPath(); c.moveTo(48, 176); c.lineTo(272, 176); c.lineTo(250, 104); c.lineTo(70, 104); c.closePath(); c.fill();
      for (let r = 0; r < 5; r++) for (let k = 0; k < 14; k++) { const y = 110 + r * 13, f = (y - 104) / 72; const x0 = 70 - 22 * f + 6, w = (180 + 44 * f - 12) / 14; c.fillStyle = it.id === 'tec_membrana' ? '#3a3d44' : '#2f323a'; rr(c, x0 + k * w, y, w - 2, 10, 2); c.fill(); if (it.id !== 'tec_membrana') { c.fillStyle = 'hsla(' + (k * 25 + r * 10) + ',85%,60%,.55)'; c.fillRect(x0 + k * w + 1, y + 8, w - 4, 1.5); } }
    },
    mouse: (c, it) => {
      sombra(c, 160, 200, 60, 10);
      c.fillStyle = lin(c, 120, 0, 200, 0, ['#1c1e23', '#3a3d44', '#1c1e23']); c.beginPath(); c.ellipse(160, 130, 40, 66, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(160, 64); c.lineTo(160, 112); c.stroke();
      c.fillStyle = '#5b606a'; rr(c, 155, 80, 10, 20, 5); c.fill();
      if (it.id !== 'mouse_basico') rgb(c, 130, 170, 60, 4, 0);
      brilho(c, 134, 84, 10, 40, 0.15);
    },
    iluminacao: (c, it) => {
      sombra(c, 160, 208, 70, 10);
      if (it.id === 'luz_mesa') { c.strokeStyle = '#2b2e35'; c.lineWidth = 6; c.beginPath(); c.moveTo(140, 200); c.lineTo(130, 120); c.lineTo(190, 80); c.stroke(); c.fillStyle = '#2b2e35'; rr(c, 110, 196, 60, 10, 4); c.fill(); c.fillStyle = '#3a3d44'; c.beginPath(); c.moveTo(176, 70); c.lineTo(226, 92); c.lineTo(206, 112); c.closePath(); c.fill(); const g = c.createRadialGradient(214, 104, 2, 214, 104, 40); g.addColorStop(0, 'rgba(255,240,190,.9)'); g.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = g; c.beginPath(); c.arc(214, 104, 40, 0, 7); c.fill(); return; }
      c.strokeStyle = '#2b2e35'; c.lineWidth = 4; [[120, 210], [200, 210]].forEach(([x, y]) => { c.beginPath(); c.moveTo(160, 160); c.lineTo(x, y); c.stroke(); }); c.beginPath(); c.moveTo(160, 160); c.lineTo(160, 110); c.stroke();
      if (it.id === 'luz_ring') { const g = c.createRadialGradient(160, 80, 30, 160, 80, 60); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,250,230,.95)'); g.addColorStop(1, 'rgba(255,250,230,0)'); c.fillStyle = g; c.beginPath(); c.arc(160, 80, 60, 0, 7); c.fill(); c.strokeStyle = '#ffffff'; c.lineWidth = 10; c.beginPath(); c.arc(160, 80, 44, 0, 7); c.stroke(); return; }
      if (it.id === 'luz_soft') { c.fillStyle = '#1c1e23'; c.beginPath(); c.moveTo(110, 40); c.lineTo(210, 40); c.lineTo(190, 116); c.lineTo(130, 116); c.closePath(); c.fill(); c.fillStyle = '#fffaf0'; rr(c, 114, 44, 92, 60, 4); c.fill(); return; }
      c.fillStyle = '#1c1e23'; rr(c, 100, 40, 120, 74, 8); c.fill(); c.fillStyle = lin(c, 100, 40, 220, 114, ['#ff3d81', '#8b5cf6', '#4cc3ff']); rr(c, 106, 46, 108, 62, 5); c.fill(); brilho(c, 110, 50, 60, 8, 0.25);
    },
    captura: (c, it) => {
      sombra(c, 160, 186, 90, 10);
      c.fillStyle = lin(c, 0, 100, 0, 170, ['#2b2e35', '#16181c']); rr(c, 80, 100, 160, 70, 12); c.fill();
      c.fillStyle = '#8b5cf6'; c.font = '800 16px Inter, Arial'; c.textAlign = 'center'; c.fillText(it.id === 'cap_nebula_pro' ? 'NÉBULA 4K' : 'NÉBULA', 160, 142);
      rgb(c, 96, 158, 128, 3, 0); c.fillStyle = '#0b0d12'; [100, 124].forEach(x => c.fillRect(x, 108, 16, 8));
    },
    vlogcam: (c, it) => {
      sombra(c, 160, 198, 70, 10);
      if (it.id === 'vlog_cel') { c.fillStyle = '#1c1e23'; rr(c, 116, 34, 88, 166, 14); c.fill(); tela(c, 122, 42, 76, 150, 280); c.fillStyle = '#0b0d12'; rr(c, 148, 46, 24, 6, 3); c.fill(); return; }
      c.fillStyle = '#1c1e23'; rr(c, 96, 90, 128, 86, 10); c.fill(); const g = c.createRadialGradient(150, 133, 3, 150, 133, 32); g.addColorStop(0, '#6a8fe0'); g.addColorStop(0.4, '#0b0d14'); g.addColorStop(1, '#3a3d44'); c.fillStyle = g; c.beginPath(); c.arc(150, 133, 32, 0, 7); c.fill(); c.fillStyle = '#c0392b'; c.beginPath(); c.arc(206, 104, 5, 0, 7); c.fill();
    },
  };
  D_.console = (c) => {
    sombra(c, 150, 206, 110, 12);
    c.fillStyle = lin(c, 100, 0, 170, 0, ['#f6f7f9', '#d9dce2']); c.beginPath(); c.moveTo(106, 36); c.quadraticCurveTo(90, 120, 108, 204); c.lineTo(168, 204); c.quadraticCurveTo(150, 120, 166, 36); c.closePath(); c.fill();
    c.fillStyle = '#1c1e23'; c.fillRect(132, 40, 10, 162); c.fillStyle = '#4cc3ff'; c.fillRect(134, 50, 6, 20);
    c.fillStyle = '#e9ebef'; c.beginPath(); c.ellipse(232, 176, 44, 22, 0, 0, 7); c.fill(); c.fillStyle = '#1c1e23'; [[214, 172], [250, 172]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 7, 0, 7); c.fill(); });
  };

  // ---------- casa ----------
  // ---------- peças do PC ----------
  const fan = (c, x, y, r, cor) => { c.fillStyle = '#16181c'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#2b2e35'; for (let i = 0; i < 7; i++) { c.save(); c.translate(x, y); c.rotate(i * 0.9); c.beginPath(); c.ellipse(r * 0.45, 0, r * 0.42, r * 0.17, 0.5, 0, 7); c.fill(); c.restore(); } c.fillStyle = cor || '#3a3d44'; c.beginPath(); c.arc(x, y, r * 0.24, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, r - 1, 0, 7); c.stroke(); };
  D_.cpu = (c, it) => {
    sombra(c, 160, 196, 80, 10);
    c.fillStyle = '#1f6b3a'; rr(c, 100, 64, 120, 120, 6); c.fill();
    c.fillStyle = '#c9a64a'; for (let i = 0; i < 14; i++) { c.fillRect(104 + i * 8.4, 180, 3, 6); c.fillRect(104 + i * 8.4, 62, 3, 4); }
    c.fillStyle = lin(c, 112, 76, 208, 172, ['#e7e9ec', '#b9bdc4', '#eef0f2']); rr(c, 112, 76, 96, 96, 6); c.fill();
    c.fillStyle = '#2b2e35'; c.font = '800 15px Inter, Arial'; c.textAlign = 'center'; c.fillText('NÚCLEO', 160, 118); c.font = '900 26px Inter, Arial'; c.fillStyle = it.tier >= 4 ? '#c0392b' : it.tier >= 3 ? '#8b5cf6' : '#3b82f6'; c.fillText(String(it.tier * 2 + 1), 160, 150);
    brilho(c, 118, 80, 50, 6, 0.4);
  };
  D_.gpu = (c, it) => {
    const n = it.tier >= 3 ? 3 : it.tier >= 2 ? 2 : 1; const w = 160 + n * 30; const x0 = 160 - w / 2;
    sombra(c, 160, 186, w * 0.55, 10);
    c.fillStyle = '#c9a64a'; c.fillRect(x0 + 30, 168, w * 0.45, 8);
    c.fillStyle = lin(c, 0, 92, 0, 168, ['#3a3e47', '#1c1e23']); rr(c, x0, 92, w, 76, 10); c.fill();
    for (let i = 0; i < n; i++) fan(c, x0 + w / (n * 2) * (1 + i * 2), 130, 28, it.tier >= 4 ? '#c0392b' : '#5b606a');
    if (it.tier >= 2) rgb(c, x0 + 10, 95, w - 20, 3, 0);
    c.fillStyle = '#9aa1ab'; c.fillRect(x0 + w - 4, 88, 8, 84);
  };
  D_.ram = (c, it) => {
    sombra(c, 160, 196, 110, 10);
    const pente = (y, k) => { c.fillStyle = '#1f6b3a'; c.fillRect(48, y + 36, 224, 22); c.fillStyle = '#c9a64a'; for (let i = 0; i < 40; i++) c.fillRect(52 + i * 5.4, y + 56, 3, 5); c.fillStyle = it.tier >= 3 ? lin(c, 48, 0, 272, 0, ['#2b2e35', '#4a4f5a', '#2b2e35']) : '#16181c'; rr(c, 44, y, 232, 42, 4); c.fill(); if (it.tier >= 3) rgb(c, 46, y - 4, 228, 6, k); c.fillStyle = '#c9a64a'; c.font = '800 11px Inter, Arial'; c.textAlign = 'left'; c.fillText('MEMORA ' + (it.id.split('_')[1]) + 'GB', 58, y + 26); };
    pente(70, 0); if (it.tier >= 2) pente(118, 1);
  };
  D_.ssd = (c, it) => {
    sombra(c, 160, 186, 110, 9);
    if (it.tier === 1) { c.fillStyle = lin(c, 0, 90, 0, 170, ['#3a3e47', '#1c1e23']); rr(c, 84, 84, 152, 98, 8); c.fill(); c.fillStyle = '#e8e8ec'; rr(c, 100, 100, 120, 50, 4); c.fill(); c.fillStyle = '#2b2e35'; c.font = '900 16px Inter, Arial'; c.textAlign = 'center'; c.fillText('RÁPIDO SSD', 160, 130); return; }
    c.fillStyle = '#16181c'; rr(c, 40, 114, 240, 50, 4); c.fill(); c.fillStyle = '#c9a64a'; for (let i = 0; i < 9; i++) c.fillRect(42, 120 + i * 5, 6, 3);
    c.fillStyle = '#2b2e35'; [70, 130, 190].forEach(x => { rr(c, x, 122, 48, 34, 3); c.fill(); });
    c.fillStyle = it.tier >= 3 ? '#c0392b' : '#3b82f6'; c.fillRect(70, 150, 168, 4);
    c.fillStyle = '#fff'; c.font = '800 11px Inter, Arial'; c.textAlign = 'left'; c.fillText('NVMe ' + (it.tier >= 3 ? '2TB' : '1TB'), 76, 142);
  };
  D_.fonte = (c, it) => {
    sombra(c, 160, 198, 90, 10);
    c.fillStyle = lin(c, 0, 70, 0, 190, ['#2b2e35', '#16181c']); rr(c, 86, 70, 148, 120, 8); c.fill();
    c.strokeStyle = '#4a4f5a'; c.lineWidth = 2; c.beginPath(); c.arc(160, 126, 42, 0, 7); c.stroke(); for (let r = 10; r < 42; r += 8) { c.beginPath(); c.arc(160, 126, r, 0, 7); c.stroke(); }
    c.fillStyle = it.tier >= 3 ? '#d6d9de' : it.tier >= 2 ? '#c9a64a' : '#8a8f99'; rr(c, 96, 172, 128, 12, 3); c.fill();
    c.fillStyle = '#16181c'; c.font = '900 10px Inter, Arial'; c.textAlign = 'center'; c.fillText(it.pw + ' W', 160, 181);
  };
  D_.cooler = (c, it) => {
    sombra(c, 160, 204, 100, 10);
    if (it.tier === 1) { c.fillStyle = '#9aa1ab'; for (let i = 0; i < 18; i++) c.fillRect(118, 60 + i * 7, 84, 4); c.fillStyle = '#c87a3a'; [136, 152, 168, 184].forEach(x => c.fillRect(x, 186, 4, 18)); fan(c, 160, 122, 44, '#5b606a'); return; }
    const n = it.tier >= 3 ? 3 : 2; const w = n * 70 + 20; const x0 = 160 - w / 2;
    c.fillStyle = '#16181c'; rr(c, x0, 70, w, 76, 6); c.fill();
    for (let i = 0; i < n; i++) { fan(c, x0 + 45 + i * 70, 108, 32, '#5b606a'); if (it.tier >= 3) { c.strokeStyle = ['#ff3d81', '#8b5cf6', '#4cc3ff'][i]; c.lineWidth = 3; c.beginPath(); c.arc(x0 + 45 + i * 70, 108, 32, 0, 7); c.stroke(); } }
    c.strokeStyle = '#2b2e35'; c.lineWidth = 6; c.beginPath(); c.moveTo(x0 + 30, 146); c.quadraticCurveTo(x0 + 20, 186, 132, 184); c.moveTo(x0 + 50, 146); c.quadraticCurveTo(x0 + 44, 176, 140, 176); c.stroke();
    c.fillStyle = '#2b2e35'; c.beginPath(); c.arc(160, 182, 22, 0, 7); c.fill(); c.fillStyle = it.tier >= 3 ? lin(c, 140, 0, 180, 0, ['#ff3d81', '#4cc3ff']) : '#9aa1ab'; c.beginPath(); c.arc(160, 182, 13, 0, 7); c.fill();
  };
  const MV = {
    cama: (c, it) => {
      sombra(c, 160, 206, 140, 12);
      if (it.id === 'colchao') { c.fillStyle = '#e9e4da'; rr(c, 40, 150, 240, 44, 10); c.fill(); c.fillStyle = '#c9c1b0'; c.fillRect(40, 178, 240, 16); c.fillStyle = '#fff'; rr(c, 52, 140, 60, 22, 10); c.fill(); return; }
      const cor = it.id === 'cama_premium' ? '#6b4fa0' : it.id === 'cama_casal' ? '#2f6f8f' : '#8a6a4a';
      c.fillStyle = '#5a3c28'; rr(c, 30, 70, 30, 132, 6); c.fill();
      c.fillStyle = '#7a5236'; c.fillRect(56, 150, 236, 48); c.fillStyle = '#f2ede4'; rr(c, 58, 124, 232, 36, 8); c.fill();
      c.fillStyle = cor; rr(c, 120, 118, 172, 46, 8); c.fill(); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(120, 122, 172, 4);
      c.fillStyle = '#ffffff'; rr(c, 64, 108, 52, 26, 12); c.fill();
    },
    geladeira: (c, it) => {
      const h = it.id === 'frigobar' ? 110 : 176, w = it.id === 'frigobar' ? 90 : 104; const y0 = 206 - h;
      sombra(c, 160, 208, w * 0.8, 10);
      c.fillStyle = it.id === 'geladeira_inox' ? lin(c, 160 - w / 2, 0, 160 + w / 2, 0, ['#9aa1ab', '#d9dde2', '#9aa1ab']) : lin(c, 160 - w / 2, 0, 160 + w / 2, 0, ['#e6e8ec', '#ffffff', '#dfe2e7']); rr(c, 160 - w / 2, y0, w, h, 10); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; if (it.id !== 'frigobar') { c.beginPath(); c.moveTo(160 - w / 2, y0 + h * 0.36); c.lineTo(160 + w / 2, y0 + h * 0.36); c.stroke(); }
      c.fillStyle = '#9aa1ab'; rr(c, 160 + w / 2 - 14, y0 + 14, 5, 34, 2); c.fill(); if (it.id !== 'frigobar') { rr(c, 160 + w / 2 - 14, y0 + h * 0.36 + 12, 5, 50, 2); c.fill(); }
    },
    fogao: (c, it) => {
      sombra(c, 160, 206, 100, 10);
      const bocas = it.id === 'fogao2' ? 2 : 4;
      if (it.id !== 'fogao2') { c.fillStyle = it.id === 'cooktop' ? '#1c1e23' : '#eceef1'; rr(c, 90, 100, 140, 104, 8); c.fill(); c.fillStyle = 'rgba(20,25,35,.85)'; rr(c, 104, 130, 112, 56, 6); c.fill(); }
      c.fillStyle = '#1c1e23'; rr(c, 84, it.id === 'fogao2' ? 150 : 84, 152, it.id === 'fogao2' ? 40 : 22, 6); c.fill();
      for (let i = 0; i < bocas; i++) { const x = bocas === 2 ? 125 + i * 70 : 112 + i * 32; c.strokeStyle = '#5b606a'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, it.id === 'fogao2' ? 166 : 92, 12, 5, 0, 0, 7); c.stroke(); }
    },
    mesa: (c, it) => {
      sombra(c, 160, 206, 130, 10);
      const topo = it.id === 'mesa_gamer' ? '#1c1e23' : it.id === 'mesa_l' ? '#d6c2a0' : '#e9e4da';
      c.fillStyle = topo; c.beginPath(); c.moveTo(40, 120); c.lineTo(280, 120); c.lineTo(262, 96); c.lineTo(58, 96); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(40, 120, 240, 8);
      c.fillStyle = it.id === 'mesa_gamer' ? '#2b2e35' : '#8a8f99'; [[50, 128], [264, 128]].forEach(([x, y]) => c.fillRect(x, y, 8, 76));
      if (it.id === 'mesa_gamer') rgb(c, 44, 126, 232, 3, 0);
      if (it.id === 'mesa_l') { c.fillStyle = topo; c.beginPath(); c.moveTo(220, 96); c.lineTo(262, 96); c.lineTo(250, 60); c.lineTo(222, 60); c.closePath(); c.fill(); }
    },
    cadeira: (c, it) => {
      sombra(c, 160, 208, 70, 10);
      if (it.id === 'cadeira_plastico') { c.fillStyle = '#f3f3f1'; rr(c, 116, 60, 88, 70, 14); c.fill(); rr(c, 108, 126, 104, 18, 8); c.fill(); c.fillStyle = '#dcdcd8'; [[114, 140], [198, 140]].forEach(([x, y]) => c.fillRect(x, y, 8, 66)); c.fillStyle = 'rgba(0,0,0,.08)'; for (let y = 72; y < 120; y += 9) c.fillRect(126, y, 68, 3); return; }
      const cor = it.id === 'cadeira_gamer' ? '#c0392b' : '#2b2e35';
      c.fillStyle = '#5b606a'; c.fillRect(156, 150, 8, 36); [[-40, 6], [40, 6], [-22, 14], [22, 14]].forEach(([dx, dy]) => { c.strokeStyle = '#3a3d44'; c.lineWidth = 5; c.beginPath(); c.moveTo(160, 188); c.lineTo(160 + dx, 196 + dy); c.stroke(); c.fillStyle = '#16181c'; c.beginPath(); c.arc(160 + dx, 198 + dy, 4, 0, 7); c.fill(); });
      c.fillStyle = '#16181c'; rr(c, 116, 136, 88, 20, 8); c.fill();
      c.fillStyle = '#16181c'; rr(c, 122, 30, 76, 114, 16); c.fill();
      if (it.id === 'cadeira_gamer') { c.fillStyle = cor; c.fillRect(132, 40, 10, 96); c.fillRect(178, 40, 10, 96); c.fillStyle = '#16181c'; rr(c, 140, 40, 40, 16, 6); c.fill(); }
      if (it.id === 'cadeira_ergo') { c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; for (let y = 44; y < 136; y += 6) { c.beginPath(); c.moveTo(128, y); c.lineTo(192, y); c.stroke(); } }
    },
    sofa: (c, it) => {
      sombra(c, 160, 206, 140, 12);
      const cor = it.id === 'sofa_retratil' ? '#4a5a8a' : '#7a6a5a';
      c.fillStyle = cor; rr(c, 40, 90, 240, 70, 14); c.fill(); c.fillStyle = U_shade(cor, 0.12); rr(c, 56, 130, 208, 50, 10); c.fill();
      c.fillStyle = U_shade(cor, -0.12); rr(c, 30, 110, 34, 84, 12); c.fill(); rr(c, 256, 110, 34, 84, 12); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.15)'; c.lineWidth = 2; c.beginPath(); c.moveTo(160, 132); c.lineTo(160, 178); c.stroke();
      c.fillStyle = '#2b2e35'; [[60, 194], [252, 194]].forEach(([x, y]) => c.fillRect(x, y, 8, 12));
    },
    tv: (c, it) => {
      const w = it.id === 'tv55' ? 230 : 160; sombra(c, 160, 206, w * 0.5, 10);
      c.fillStyle = '#16181c'; rr(c, 160 - w / 2, 50, w, w * 0.56, 4); c.fill(); tela(c, 160 - w / 2 + 4, 54, w - 8, w * 0.56 - 8, 20);
      c.fillStyle = '#2a2d33'; c.fillRect(150, 50 + w * 0.56, 20, 14); rr(c, 120, 62 + w * 0.56, 80, 8, 3); c.fill();
    },
    chuveiro: (c, it) => {
      sombra(c, 160, 210, 60, 8);
      c.strokeStyle = '#9aa1ab'; c.lineWidth = 8; c.beginPath(); c.moveTo(250, 40); c.lineTo(250, 70); c.lineTo(180, 70); c.stroke();
      c.fillStyle = it.id === 'ducha' ? lin(c, 120, 0, 200, 0, ['#9aa1ab', '#e3e6ea', '#9aa1ab']) : '#f2f3f5'; c.beginPath(); c.ellipse(160, 82, it.id === 'ducha' ? 50 : 34, 16, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(120,180,230,.55)'; c.lineWidth = 2; for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(160 + i * 7, 96); c.lineTo(160 + i * 10, 200); c.stroke(); }
    },
    cafeteira: (c) => {
      sombra(c, 160, 204, 60, 10);
      c.fillStyle = '#1c1e23'; rr(c, 116, 60, 88, 140, 10); c.fill(); c.fillStyle = '#2b2e35'; rr(c, 116, 186, 88, 18, 6); c.fill();
      c.fillStyle = 'rgba(200,230,255,.55)'; rr(c, 128, 126, 64, 58, 10); c.fill(); c.fillStyle = '#5a3418'; rr(c, 130, 150, 60, 32, 8); c.fill();
      c.fillStyle = '#ff5a5a'; c.beginPath(); c.arc(188, 80, 4, 0, 7); c.fill();
    },
    bike: (c) => {
      sombra(c, 160, 206, 110, 10);
      c.fillStyle = '#5b606a'; rr(c, 70, 196, 70, 10, 4); c.fill(); rr(c, 190, 196, 70, 10, 4); c.fill();
      c.strokeStyle = '#c3c8cf'; c.lineWidth = 8; c.beginPath(); c.moveTo(105, 198); c.lineTo(150, 120); c.lineTo(225, 198); c.stroke();
      c.fillStyle = '#c0392b'; c.beginPath(); c.arc(206, 150, 34, 0, 7); c.fill(); c.fillStyle = '#e3e6ea'; c.beginPath(); c.arc(206, 150, 18, 0, 7); c.fill();
      c.strokeStyle = '#8e959f'; c.lineWidth = 6; c.beginPath(); c.moveTo(130, 150); c.lineTo(118, 84); c.stroke(); c.fillStyle = '#16171a'; rr(c, 96, 74, 46, 14, 7); c.fill();
      c.beginPath(); c.moveTo(196, 120); c.lineTo(214, 56); c.stroke(); c.strokeStyle = '#16171a'; c.lineWidth = 7; c.beginPath(); c.moveTo(200, 54); c.lineTo(236, 50); c.stroke(); c.fillStyle = '#1c1d22'; rr(c, 202, 40, 22, 14, 3); c.fill(); c.fillStyle = '#5ee0a0'; c.fillRect(206, 44, 14, 6);
    },
    acustica: (c) => {
      sombra(c, 160, 206, 120, 10);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const x = 76 + i * 58, y = 36 + j * 56; c.fillStyle = (i + j) % 2 ? '#2b2e35' : '#3a3f4a'; rr(c, x, y, 52, 50, 3); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 5; k++) c.fillRect(x + 4 + k * 10, y + 4, 4, 42); }
    },
  };
  const U_shade = (h, a) => SL.U.shade(h, a);
  const DECO = {
    planta: c => { sombra(c, 160, 206, 50, 8); c.fillStyle = '#c4664a'; c.beginPath(); c.moveTo(128, 150); c.lineTo(192, 150); c.lineTo(182, 204); c.lineTo(138, 204); c.closePath(); c.fill(); for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.33; c.fillStyle = i % 2 ? '#3f8a38' : '#2f6b2c'; c.save(); c.translate(160, 150); c.rotate(a + Math.PI / 2); c.beginPath(); c.ellipse(0, -46, 12, 46, 0, 0, 7); c.fill(); c.restore(); } },
    quadro: c => { sombra(c, 160, 204, 70, 8); c.fillStyle = '#c8a86a'; c.fillRect(86, 40, 148, 150); c.fillStyle = '#efe6d6'; c.fillRect(96, 50, 128, 130); c.fillStyle = '#3b82f6'; c.beginPath(); c.arc(140, 100, 26, 0, 7); c.fill(); c.fillStyle = '#ff5a36'; c.fillRect(160, 96, 50, 60); c.fillStyle = '#ffb547'; c.beginPath(); c.moveTo(110, 170); c.lineTo(150, 128); c.lineTo(190, 170); c.closePath(); c.fill(); },
    poster: (c, it) => { if (it && it.game && SL.Capa) { sombra(c, 160, 206, 64, 8); c.fillStyle = '#f2f2f4'; c.fillRect(103, 24, 114, 154); c.drawImage(SL.Capa.img(it.game), 108, 29, 104, 139); c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(108, 29); c.lineTo(180, 29); c.lineTo(108, 110); c.closePath(); c.fill(); return; } DECO.posterGen(c); },
    posterGen: c => { sombra(c, 160, 204, 60, 8); c.fillStyle = lin(c, 0, 30, 0, 200, ['#e0702a', '#7a2a6a']); c.fillRect(104, 30, 112, 170); c.fillStyle = '#1a1a22'; c.fillRect(120, 70, 80, 70); c.fillStyle = '#fff'; c.font = '900 18px Inter, Arial'; c.textAlign = 'center'; c.fillText('GAME', 160, 60); c.fillStyle = '#ffe066'; c.beginPath(); c.arc(160, 105, 18, 0, 7); c.fill(); },
    tapete: c => { c.fillStyle = '#e8e2f0'; c.beginPath(); c.ellipse(160, 150, 130, 48, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 1; for (let i = 0; i < 40; i++) { const a = i / 40 * 6.28; c.beginPath(); c.moveTo(160 + Math.cos(a) * 120, 150 + Math.sin(a) * 44); c.lineTo(160 + Math.cos(a) * 132, 150 + Math.sin(a) * 50); c.stroke(); } c.fillStyle = 'rgba(200,180,230,.5)'; c.beginPath(); c.ellipse(160, 150, 90, 32, 0, 0, 7); c.fill(); },
    led: c => { c.fillStyle = '#e8e8ec'; c.beginPath(); c.arc(130, 140, 46, 0, 7); c.fill(); c.fillStyle = '#d8d8dc'; c.beginPath(); c.arc(130, 140, 16, 0, 7); c.fill(); c.strokeStyle = lin(c, 170, 0, 300, 0, ['#ff3d81', '#ffb547', '#35d39a', '#4cc3ff', '#8b5cf6']); c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(166, 140); c.bezierCurveTo(220, 80, 260, 200, 296, 120); c.stroke(); c.globalAlpha = 0.35; c.lineWidth = 20; c.stroke(); c.globalAlpha = 1; },
    estante: c => { sombra(c, 160, 208, 90, 10); c.fillStyle = '#5a3a2a'; c.fillRect(90, 30, 140, 176); c.fillStyle = '#3a2418'; for (let i = 0; i < 4; i++) c.fillRect(96, 72 + i * 40, 128, 5); const cs = ['#ff5a36', '#4cc3ff', '#ffe066', '#35d39a', '#8b5cf6', '#ff3d81']; for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) { c.fillStyle = cs[(i + k) % 6]; if ((i + k) % 3) rr(c, 102 + k * 30, 46 + i * 40, 18, 26, 4); else c.beginPath(), c.arc(111 + k * 30, 62 + i * 40, 10, 0, 7); c.fill(); } },
    neon: c => { c.fillStyle = '#16141f'; rr(c, 40, 60, 240, 120, 12); c.fill(); c.save(); c.shadowColor = '#ff3d81'; c.shadowBlur = 22; c.fillStyle = '#ff9ac6'; c.font = '900 34px Inter, Arial'; c.textAlign = 'center'; c.fillText('SEU CANAL', 160, 132); c.restore(); },
    luminaria: c => { sombra(c, 160, 208, 50, 8); c.fillStyle = '#222'; c.fillRect(157, 70, 6, 134); rr(c, 132, 198, 56, 8, 4); c.fill(); c.fillStyle = '#f2e2c0'; c.beginPath(); c.moveTo(126, 80); c.lineTo(194, 80); c.lineTo(178, 30); c.lineTo(142, 30); c.closePath(); c.fill(); const g = c.createRadialGradient(160, 90, 4, 160, 90, 60); g.addColorStop(0, 'rgba(255,220,150,.6)'); g.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = g; c.beginPath(); c.arc(160, 90, 60, 0, 7); c.fill(); },
  };
  const OUT = {
    net: (c, it) => { sombra(c, 160, 196, 90, 10); c.fillStyle = '#f2f3f5'; rr(c, 84, 120, 152, 66, 12); c.fill(); const n = it.id === 'net50' ? 2 : it.id === 'fibra300' ? 3 : 4; for (let i = 0; i < n; i++) { const x = 100 + i * (120 / Math.max(1, n - 1)); c.fillStyle = '#1c1e23'; rr(c, x - 4, 52, 8, 72, 4); c.fill(); } c.fillStyle = '#35d39a'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(116 + i * 22, 168, 3, 0, 7); c.fill(); } },
    soft: (c, it) => { sombra(c, 160, 204, 70, 10); c.fillStyle = it.id === 'editor_pro' ? '#3b2a8a' : it.id === 'overlays' ? '#c0392b' : it.id === 'auto_ads' ? '#9146ff' : '#16794c'; rr(c, 110, 40, 100, 160, 8); c.fill(); c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(110, 40, 16, 160); c.fillStyle = '#fff'; c.font = '900 13px Inter, Arial'; c.textAlign = 'center'; c.fillText(it.id === 'editor_pro' ? 'CORTE PRO' : it.id === 'overlays' ? 'OVERLAYS' : it.id === 'auto_ads' ? 'AUTO ADS' : 'VIGIA', 168, 130); },
    veh: (c, it) => {
      sombra(c, 160, 198, 130, 10);
      if (it.id === 'bike') { c.strokeStyle = '#1c1e23'; c.lineWidth = 6; [[96, 160], [224, 160]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 36, 0, 7); c.stroke(); }); c.strokeStyle = '#ff5a36'; c.lineWidth = 6; c.beginPath(); c.moveTo(96, 160); c.lineTo(146, 110); c.lineTo(200, 110); c.lineTo(224, 160); c.moveTo(146, 110); c.lineTo(160, 160); c.lineTo(200, 110); c.moveTo(96, 160); c.lineTo(160, 160); c.stroke(); c.fillStyle = '#16171a'; rr(c, 130, 96, 34, 10, 5); c.fill(); c.strokeStyle = '#2a2c31'; c.lineWidth = 5; c.beginPath(); c.moveTo(204, 110); c.lineTo(208, 90); c.lineTo(228, 88); c.stroke(); return; }
      c.fillStyle = '#c0392b'; c.beginPath(); c.moveTo(40, 170); c.lineTo(40, 140); c.quadraticCurveTo(70, 132, 100, 128); c.lineTo(134, 98); c.lineTo(214, 98); c.lineTo(250, 128); c.quadraticCurveTo(282, 134, 282, 160); c.lineTo(282, 170); c.closePath(); c.fill();
      c.fillStyle = 'rgba(25,35,50,.85)'; c.beginPath(); c.moveTo(142, 104); c.lineTo(206, 104); c.lineTo(236, 128); c.lineTo(116, 128); c.closePath(); c.fill(); c.fillStyle = '#c0392b'; c.fillRect(172, 104, 6, 24);
      c.fillStyle = '#16181c'; [[88, 172], [236, 172]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 22, 0, 7); c.fill(); c.fillStyle = '#9aa1ab'; c.beginPath(); c.arc(x, y, 10, 0, 7); c.fill(); c.fillStyle = '#16181c'; });
      c.fillStyle = '#fff4c0'; c.fillRect(272, 140, 10, 8); brilho(c, 60, 136, 200, 4, 0.25);
    },
  };

  const desenhar = (tipo, it) => {
    const cv = document.createElement('canvas'); cv.width = FW * 2; cv.height = FH * 2; const c = cv.getContext('2d'); c.scale(2, 2);
    // fundo de estúdio fotográfico
    const g = c.createRadialGradient(FW / 2, FH * 0.4, 20, FW / 2, FH * 0.45, FW * 0.75); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e4e6ea'); c.fillStyle = g; c.fillRect(0, 0, FW, FH);
    c.fillStyle = 'rgba(0,0,0,.035)'; c.fillRect(0, FH * 0.82, FW, FH * 0.18);
    let fn = null;
    if (tipo === 'equip') fn = D_[it.slot];
    else if (tipo === 'furn') fn = it.slot === 'deco' ? DECO[it.kind || it.id] : MV[it.slot];
    else fn = OUT[tipo];
    try { if (fn) fn(c, it); else { sombra(c, 160, 200, 70, 10); c.fillStyle = '#8b5cf6'; rr(c, 110, 70, 100, 120, 12); c.fill(); } } catch (e) { /* desenho falhou: fica só o fundo */ }
    return cv;
  };
  PR.foto = (tipo, it) => { const k = tipo + ':' + it.id; return cache[k] || (cache[k] = desenhar(tipo, it)); };
  // pinta todas as telinhas [data-foto="tipo|id"] dentro de um elemento
  PR.pintar = el => {
    el.querySelectorAll('canvas[data-foto]').forEach(cv => {
      const [tipo, id] = cv.dataset.foto.split('|');
      const it = tipo === 'equip' ? SL.D.equipById(id) : tipo === 'furn' ? SL.D.furnById(id) : tipo === 'net' ? SL.D.internet.find(x => x.id === id) : tipo === 'soft' ? SL.D.software.find(x => x.id === id) : tipo === 'veh' ? SL.D.vehicles.find(x => x.id === id) : null;
      if (!it) return;
      const img = PR.foto(tipo, it); const r = cv.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(80, Math.round((r.width || 220) * dpr)), h = Math.round(w * FH / FW);
      if (cv.width !== w) { cv.width = w; cv.height = h; }
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
    });
  };
})(window.SL);

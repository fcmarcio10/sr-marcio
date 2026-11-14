/* ============================ TEXTURAS ============================ */
const PSRC = {};
function tex(size, base, fn) {
  const c = makeCanvas(size, size), g = c.getContext('2d');
  const R = mulberry32((size * 7919 + base.length * 131 + base.charCodeAt(1) * 17) | 0);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  fn(g, size, R);
  return c;
}
function speck(g, s, R, n, cols, rmin, rmax) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[(R() * cols.length) | 0];
    const r = rmin + R() * (rmax - rmin);
    g.fillRect(R() * s, R() * s, r, r);
  }
}
function buildPatterns() {
  PSRC.grass = tex(128, '#33502a', (g, s, R) => {
    speck(g, s, R, 900, ['#2b4523', '#3b5c30', '#44683a', '#283f21', '#4a6b35'], 1, 2.4);
    g.strokeStyle = 'rgba(80,120,60,0.35)'; g.lineWidth = 1;
    for (let i = 0; i < 120; i++) { const x = R() * s, y = R() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R() * 3 - 1.5, y - 3 - R() * 3); g.stroke(); }
  });
  PSRC.lawn = tex(128, '#3b5f30', (g, s, R) => speck(g, s, R, 800, ['#34552b', '#43693a', '#4a7340', '#30502a'], 1, 2));
  PSRC.lawn2 = tex(64, '#456e38', (g, s, R) => {
    g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(0, 0, s, s / 2);
    speck(g, s, R, 300, ['#3d6432', '#4f7a42', '#527d45'], 1, 2);
  });
  PSRC.pasture = tex(128, '#3a5a2c', (g, s, R) => {
    speck(g, s, R, 700, ['#33512a', '#45693a', '#4e733a', '#5d7a3a', '#2c4724'], 1, 2.5);
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(30,50,20,0.35)'; g.beginPath(); g.arc(R() * s, R() * s, 3 + R() * 5, 0, TAU); g.fill(); }
  });
  // asfalto: um só para o jogo todo (4% menos detalhe que antes)
  PSRC.asphalt = tex(128, '#33353b', (g, s, R) => speck(g, s, R, 1440, ['#2b2d32', '#3b3e44', '#43464d', '#2f3136', '#4b4d52'], 1, 1.8));
  // bloquete de concreto (paver): só nas ruas de comunidade (7% menos detalhe que antes)
  PSRC.bloquete = tex(64, '#5f5e5a', (g, s, R) => {
    for (let y = 0; y < s; y += 6) for (let x = ((y / 6) % 2) * 6 - 6; x < s; x += 12) {
      const t = R(); g.fillStyle = t < 0.3 ? '#77756f' : t < 0.6 ? '#6e6c66' : t < 0.85 ? '#81807a' : '#68665f';
      g.fillRect(x + 0.6, y + 0.6, 10.8, 4.8);
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x + 0.6, y + 0.6, 10.8, 1);
    }
    for (let i = 0; i < 37; i++) { g.fillStyle = 'rgba(30,30,28,0.25)'; g.fillRect(R() * s, R() * s, 1.5, 1.5); }
  });
  // pedra portuguesa em ondas (calçadão), preto e branco
  PSRC.portuguesa = tex(128, '#d9d5ca', (g, s, R) => {
    for (let y = 0; y < s; y += 2.6) for (let x = 0; x < s; x += 2.6) {
      const w = s / 2 + Math.sin(x / s * TAU) * 22, w2 = Math.sin((x / s) * TAU) * 22;
      const d = Math.min(Math.abs(y - w), Math.abs(y - (w2 + 6)), Math.abs(y - (w2 + 6 + s)));
      const dark = d < 7;
      const t = R();
      g.fillStyle = dark ? (t < 0.5 ? '#2b2b2c' : '#3a3a3b') : (t < 0.5 ? '#dcd8cd' : '#cfcabd');
      g.fillRect(x + 0.3, y + 0.3, 2.1, 2.1);
    }
  });
  PSRC.paved = tex(128, '#3b3d42', (g, s, R) => speck(g, s, R, 1200, ['#34363b', '#45474d', '#4d4f55', '#303237'], 1, 1.8));
  PSRC.sidewalk = tex(64, '#8b8a84', (g, s, R) => {
    speck(g, s, R, 300, ['#83827c', '#93928b', '#7d7c76'], 1, 2);
    g.fillStyle = '#76756f';
    for (let i = 0; i < s; i += 16) { g.fillRect(i, 0, 1, s); g.fillRect(0, i, s, 1); }
  });
  // barro vermelho do interior, com cascalho
  PSRC.dirt = tex(128, '#8a5a3c', (g, s, R) => {
    speck(g, s, R, 1100, ['#7c4f34', '#956345', '#a06e4c', '#6e462f', '#ab7a56', '#83563a'], 1, 3);
    for (let i = 0; i < 70; i++) { g.fillStyle = R() < 0.5 ? 'rgba(190,170,140,0.55)' : 'rgba(120,110,100,0.5)'; g.beginPath(); g.arc(R() * s, R() * s, 0.8 + R() * 1.4, 0, TAU); g.fill(); }
  });
  PSRC.earth = tex(128, '#6b523a', (g, s, R) => speck(g, s, R, 900, ['#5e4833', '#7a5f44', '#836649', '#574230'], 1, 3));
  PSRC.soil = tex(128, '#4f3a29', (g, s, R) => speck(g, s, R, 900, ['#453223', '#5c4530', '#3e2d20', '#634b35'], 1, 2.5));
  PSRC.sand = tex(128, '#b19c70', (g, s, R) => speck(g, s, R, 900, ['#a69066', '#bda97c', '#9b865d', '#c4b186'], 1, 2));
  PSRC.gravel = tex(128, '#67625a', (g, s, R) => speck(g, s, R, 1500, ['#5a564f', '#77726a', '#827c73', '#4f4b45', '#8d877d'], 1, 2.6));
  PSRC.urban = tex(128, '#57554f', (g, s, R) => speck(g, s, R, 1000, ['#4f4d48', '#605e58', '#68655f', '#4a4843'], 1, 2));
  PSRC.concrete = tex(128, '#8c8b86', (g, s, R) => {
    speck(g, s, R, 700, ['#84837e', '#95948f', '#7e7d78'], 1, 2);
    g.fillStyle = '#74736e'; g.fillRect(0, 0, s, 1.5); g.fillRect(0, 0, 1.5, s); g.fillRect(0, s / 2, s, 1); g.fillRect(s / 2, 0, 1, s);
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(40,35,30,0.12)'; g.beginPath(); g.ellipse(R() * s, R() * s, 5 + R() * 8, 3 + R() * 5, R() * 3, 0, TAU); g.fill(); }
  });
  PSRC.yard = tex(64, '#96938a', (g, s, R) => {
    speck(g, s, R, 300, ['#8c8980', '#a09d94', '#86837a'], 1, 2);
    g.fillStyle = '#807d75'; g.fillRect(0, 0, s, 1); g.fillRect(0, 0, 1, s);
  });
  PSRC.plaza = tex(128, '#b9b2a4', (g, s) => {
    g.fillStyle = '#57524b';
    for (let k = 0; k < 4; k++) {
      const y0 = k * 32;
      g.beginPath();
      for (let x = 0; x <= s; x += 2) { const y = y0 + 9 * Math.sin((x / s) * TAU * 2); if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      for (let x = s; x >= 0; x -= 2) { const y = y0 + 11 + 9 * Math.sin((x / s) * TAU * 2); g.lineTo(x, y); }
      g.closePath(); g.fill();
    }
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = 0; x < s; x += 6) for (let y = 0; y < s; y += 6) if ((x * 7 + y * 3) % 5 === 0) g.fillRect(x, y, 1, 1);
  });
  PSRC.water = tex(256, '#143247', (g, s, R) => {
    g.strokeStyle = 'rgba(120,170,200,0.16)'; g.lineWidth = 1.2;
    for (let i = 0; i < 70; i++) { const x = R() * s, y = R() * s, w = 6 + R() * 18; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 2, x + w, y); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 30; i++) { g.beginPath(); g.ellipse(R() * s, R() * s, 10 + R() * 20, 3 + R() * 6, 0, 0, TAU); g.fill(); }
  });
  PSRC.forest = tex(256, '#11240f', (g, s, R) => {
    const cols = ['#173219', '#1d3c1c', '#244621', '#2a5226', '#1a361a'];
    for (let i = 0; i < 95; i++) {
      const x = R() * s, y = R() * s, r = 9 + R() * 18, c = cols[(R() * cols.length) | 0];
      for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) {
        if (x + ox + r < 0 || x + ox - r > s || y + oy + r < 0 || y + oy - r > s) continue;
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(x + ox + 3, y + oy + 4, r, 0, TAU); g.fill();
        g.fillStyle = c; g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill();
        g.fillStyle = 'rgba(120,170,90,0.12)'; g.beginPath(); g.arc(x + ox - r * 0.3, y + oy - r * 0.3, r * 0.5, 0, TAU); g.fill();
      }
    }
  });
}
function pat(g, name) {
  if (!g._pats) g._pats = {};
  let p = g._pats[name];
  if (!p) { p = g.createPattern(PSRC[name], 'repeat'); g._pats[name] = p; }
  return p;
}
let CHUNK_BOX = { x0: 0, y0: 0, x1: 0, y1: 0 };

/* ============================ DECALQUES ============================ */
function drawDecal(g, d) {
  const { x0, y0, x1, y1 } = d, w = x1 - x0, h = y1 - y0;
  const R = mulberry32(d.seed);
  const ix0 = Math.max(x0, CHUNK_BOX.x0 - 20), ix1 = Math.min(x1, CHUNK_BOX.x1 + 20);
  const iy0 = Math.max(y0, CHUNK_BOX.y0 - 20), iy1 = Math.min(y1, CHUNK_BOX.y1 + 20);
  switch (d.type) {
    case 'lawn': case 'lawn2': case 'pasture': case 'urban': case 'paved': case 'gravel': case 'earth': case 'sand': case 'plaza': case 'concrete': case 'yard':
      g.fillStyle = pat(g, d.type); g.fillRect(x0, y0, w, h);
      if (d.type === 'yard' || d.type === 'concrete') { g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1; g.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1); }
      if (d.type === 'paved') {
        g.fillStyle = 'rgba(0,0,0,0.12)';
        for (let i = 0; i < w * h / 9000; i++) { g.beginPath(); g.ellipse(x0 + R() * w, y0 + R() * h, 4 + R() * 9, 3 + R() * 5, R() * 3, 0, TAU); g.fill(); }
      }
      break;
    case 'drive':
      g.fillStyle = pat(g, 'yard'); g.fillRect(x0, y0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.12)';
      if (w < h) { g.fillRect(x0 + w * 0.2, y0, w * 0.15, h); g.fillRect(x0 + w * 0.65, y0, w * 0.15, h); }
      else { g.fillRect(x0, y0 + h * 0.2, w, h * 0.15); g.fillRect(x0, y0 + h * 0.65, w, h * 0.15); }
      break;
    case 'pool': {
      g.fillStyle = '#d9d4c6'; g.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
      const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#3fb6d8'); gr.addColorStop(1, '#1d7aa0');
      g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
      for (let i = 0; i < 4; i++) { const yy = y0 + 4 + R() * (h - 8); g.beginPath(); g.moveTo(x0 + 3, yy); g.quadraticCurveTo(x0 + w / 2, yy + 3, x1 - 3, yy); g.stroke(); }
      break;
    }
    case 'hill': {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = w / 2, ry = h / 2;
      const cols = ['#2f4a26', '#34532b', '#3b5c30', '#426634', '#4a7038'];
      for (let i = 0; i < 5; i++) {
        const k = 1 - i * 0.18;
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(cx + 6, cy + 8, rx * k, ry * k, 0, 0, TAU); g.fill();
        g.fillStyle = cols[i]; g.beginPath(); g.ellipse(cx, cy, rx * k, ry * k, 0, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(20,35,15,0.35)'; g.lineWidth = 1.2; g.stroke();
      }
      g.strokeStyle = 'rgba(140,110,70,0.85)'; g.lineWidth = 7; g.beginPath();
      for (let t = 0; t <= 1.001; t += 0.02) { const a = t * TAU * 1.15 + Math.PI * 0.5, k = 0.95 - t * 0.7; const px = cx + Math.cos(a) * rx * k, py = cy + Math.sin(a) * ry * k; if (t === 0) g.moveTo(px, py); else g.lineTo(px, py); }
      g.stroke();
      break;
    }
    case 'court':
      g.fillStyle = '#2f6a5a'; g.fillRect(x0, y0, w, h);
      g.fillStyle = '#3a5a8a'; g.fillRect(x0 + 10, y0 + 10, w - 20, h - 20);
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.strokeRect(x0 + 10, y0 + 10, w - 20, h - 20);
      g.beginPath(); g.moveTo(x0 + w / 2, y0 + 10); g.lineTo(x0 + w / 2, y1 - 10); g.stroke();
      g.beginPath(); g.arc(x0 + w / 2, y0 + h / 2, Math.min(w, h) * 0.12, 0, TAU); g.stroke();
      break;
    case 'soccer': {
      g.fillStyle = pat(g, 'earth'); g.fillRect(x0, y0, w, h);
      g.fillStyle = 'rgba(70,110,50,0.55)';
      for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(x0 + R() * w, y0 + (R() < 0.5 ? R() * h * 0.25 : h - R() * h * 0.25), 6 + R() * 22, 4 + R() * 10, R() * 3, 0, TAU); g.fill(); }
      for (let i = 0; i < 20; i++) { g.beginPath(); g.ellipse(x0 + (R() < 0.5 ? R() * w * 0.2 : w - R() * w * 0.2), y0 + R() * h, 5 + R() * 14, 4 + R() * 8, R() * 3, 0, TAU); g.fill(); }
      g.strokeStyle = 'rgba(240,240,230,0.7)'; g.lineWidth = 2.5;
      const m = 10;
      g.strokeRect(x0 + m, y0 + m, w - 2 * m, h - 2 * m);
      g.beginPath(); g.moveTo(x0 + m, y0 + h / 2); g.lineTo(x1 - m, y0 + h / 2); g.stroke();
      g.beginPath(); g.arc(x0 + w / 2, y0 + h / 2, 42, 0, TAU); g.stroke();
      g.strokeRect(x0 + w / 2 - 70, y0 + m, 140, 60); g.strokeRect(x0 + w / 2 - 70, y1 - m - 60, 140, 60);
      g.strokeRect(x0 + w / 2 - 32, y0 + m, 64, 22); g.strokeRect(x0 + w / 2 - 32, y1 - m - 22, 64, 22);
      break;
    }
    case 'forest': {
      g.fillStyle = pat(g, 'forest');
      g.beginPath();
      const step = 24;
      g.moveTo(x0 + 10, y0 + 10);
      for (let x = x0 + 10; x <= x1 - 10; x += step) g.lineTo(x, y0 + 4 + hash2(x | 0, y0 | 0) * 14);
      for (let y = y0 + 10; y <= y1 - 10; y += step) g.lineTo(x1 - 4 - hash2(x1 | 0, y | 0) * 14, y);
      for (let x = x1 - 10; x >= x0 + 10; x -= step) g.lineTo(x, y1 - 4 - hash2(x | 0, y1 | 0) * 14);
      for (let y = y1 - 10; y >= y0 + 10; y -= step) g.lineTo(x0 + 4 + hash2(x0 | 0, y | 0) * 14, y);
      g.closePath();
      g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 0; g.shadowOffsetX = 6; g.shadowOffsetY = 8; g.fill(); g.restore();
      g.fill();
      break;
    }
    case 'corn': case 'cane': case 'soy': case 'coffee': case 'garden': {
      g.fillStyle = pat(g, 'soil'); g.fillRect(x0, y0, w, h);
      if (d.type === 'corn') {
        const sp = 12;
        for (let y = y0 + 6 + Math.max(0, Math.floor((iy0 - y0) / sp)) * sp; y < iy1; y += sp) {
          for (let x = Math.max(x0 + 4, ix0); x < ix1 - 2; x += 5) {
            const r = hash2(x | 0, y | 0);
            g.fillStyle = r < 0.3 ? '#3f6a26' : r < 0.7 ? '#4f7d2e' : '#5d8a34';
            g.fillRect(x, y - 3 - r * 2, 4, 5 + r * 3);
            if (r > 0.93) { g.fillStyle = '#c8b04a'; g.fillRect(x + 1, y - 2, 2, 2); }
          }
        }
      } else if (d.type === 'cane') {
        const sp = 9;
        for (let y = y0 + 4 + Math.max(0, Math.floor((iy0 - y0) / sp)) * sp; y < iy1; y += sp) {
          g.fillStyle = '#41692a'; g.fillRect(ix0, y - 3, ix1 - ix0, 7);
          g.fillStyle = '#5a8a36';
          for (let x = ix0; x < ix1; x += 7) { const r = hash2(x | 0, y | 0); g.fillRect(x, y - 3 + r * 3, 5, 1.5); }
          g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(ix0, y + 4, ix1 - ix0, 2);
        }
      } else if (d.type === 'soy') {
        const sp = 10;
        for (let y = y0 + 5 + Math.max(0, Math.floor((iy0 - y0) / sp)) * sp; y < iy1; y += sp) {
          for (let x = ix0; x < ix1; x += 6) {
            const r = hash2(x | 0, y | 0);
            g.fillStyle = r < 0.5 ? '#5f8a3a' : '#719b45';
            g.beginPath(); g.arc(x, y, 2.4 + r, 0, TAU); g.fill();
          }
        }
      } else if (d.type === 'coffee') {
        const sp = 22;
        for (let y = y0 + 11 + Math.max(0, Math.floor((iy0 - y0) / sp)) * sp; y < iy1; y += sp) {
          for (let x = ix0; x < ix1; x += 11) {
            const r = hash2(x | 0, y | 0);
            g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(x + 2, y + 3, 7, 0, TAU); g.fill();
            g.fillStyle = r < 0.5 ? '#1f4420' : '#26502a'; g.beginPath(); g.arc(x, y, 7 + r, 0, TAU); g.fill();
            g.fillStyle = '#33652f'; g.beginPath(); g.arc(x - 2, y - 2, 3.5, 0, TAU); g.fill();
            if (r > 0.55) { g.fillStyle = '#b8322a'; g.fillRect(x + 2, y + 1, 1.6, 1.6); g.fillRect(x - 3, y + 3, 1.6, 1.6); }
          }
        }
      } else {
        for (let y = y0 + 6; y < y1 - 6; y += 30) {
          g.fillStyle = '#3e2c1f'; g.fillRect(x0 + 6, y, w - 12, 22);
          for (let x = x0 + 12; x < x1 - 10; x += 10) { g.fillStyle = hash2(x | 0, y | 0) < 0.5 ? '#7db84a' : '#5f9a3a'; g.beginPath(); g.arc(x, y + 11, 4, 0, TAU); g.fill(); }
        }
      }
      break;
    }
  }
}
function drawStallLines(g, x0, y0, x1, y1, vert) {
  g.strokeStyle = 'rgba(235,235,225,0.6)'; g.lineWidth = 2; g.beginPath();
  if (vert) { for (let y = y0; y <= y1; y += 34) { g.moveTo(x0, y); g.lineTo(x0 + 64, y); } }
  else { for (let x = x0; x <= x1; x += 34) { g.moveTo(x, y0); g.lineTo(x, y0 + 64); } }
  g.stroke();
}

/* ============================ RUAS ============================ */
function edgeLocal(g, e) { g.save(); g.translate(e.a.x, e.a.y); if (!e.h) g.rotate(Math.PI / 2); }
// cara de rua brasileira: bloquete nos bairros, asfalto remendado nas avenidas,
// calçadão de pedra portuguesa no Centrão e meio-fio caiado de branco
// bloquete só na favela (Serra e os morros de São Pedreiro e Terra Amarelou); no resto, asfalto
const PAVER_REGIONS = { saopedro: 0.75, terravermelha: 0.75, feurosa: 0.7, carapina: 0.7, novarosa: 0.7, flexal: 0.7 };
function edgePave(e) {
  if (e.pave) return e.pave;
  if (!e.T.asphalt || e.T.id !== 'street' || e.bridge) return (e.pave = 'asphalt');
  const rk = regionKeyAt((e.a.x + e.b.x) / 2, (e.a.y + e.b.y) / 2);
  return (e.pave = hash2(e.id * 17 + 3, 91) < (PAVER_REGIONS[rk] || 0) ? 'bloquete' : 'asphalt');
}
function edgeWalk(e) {
  if (e.walkT) return e.walkT;
  const rk = regionKeyAt((e.a.x + e.b.x) / 2, (e.a.y + e.b.y) / 2);
  return (e.walkT = rk === 'centro' || (e.T.id === 'avenue' && (rk === 'jardim' || rk === 'vila')) ? 'portuguesa' : 'sidewalk');
}
const CURB_W = '#e6e3d6', CURB_Y = '#e0b83a';
function drawEdgeBase(g, e) {
  const T = e.T, L = e.len, hw = e.hw;
  edgeLocal(g, e);
  if (T.sw) {
    g.fillStyle = pat(g, edgeWalk(e));
    const s0 = e.perpA, s1 = L - e.perpB;
    g.fillRect(s0, -hw - T.sw, s1 - s0, T.sw); g.fillRect(s0, hw, s1 - s0, T.sw);
    // meio-fio caiado; amarelo perto das esquinas (proibido estacionar)
    g.fillStyle = CURB_W; g.fillRect(s0, -hw - 2.5, s1 - s0, 2.5); g.fillRect(s0, hw, s1 - s0, 2.5);
    g.fillStyle = CURB_Y; for (const [a, b] of [[s0, s0 + 36], [s1 - 36, s1]]) if (b > a) { g.fillRect(a, -hw - 2.5, b - a, 2.5); g.fillRect(a, hw, b - a, 2.5); }
    g.fillStyle = 'rgba(0,0,0,0.18)'; for (let s = s0 + 8; s < s1; s += 9) { g.fillRect(s, -hw - 2.5, 0.8, 2.5); g.fillRect(s, hw, 0.8, 2.5); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(s0, -hw - T.sw, s1 - s0, 1.5); g.fillRect(s0, hw + T.sw - 1.5, s1 - s0, 1.5);
  }
  if (T.shoulder) {
    g.fillStyle = pat(g, 'gravel');
    g.fillRect(0, -hw - T.shoulder, L, T.shoulder); g.fillRect(0, hw, L, T.shoulder);
  }
  if (T.asphalt && edgePave(e) === 'bloquete') {
    g.fillStyle = pat(g, 'bloquete'); g.fillRect(0, -hw, L, hw * 2);
    const R = mulberry32(e.id * 977 + 13);
    // trilhas de pneu escurecidas, manchas de óleo e bloquetes afundados/remendados com cimento
    g.fillStyle = 'rgba(25,25,28,0.16)'; for (const y of [-hw * 0.55, -hw * 0.3, hw * 0.3, hw * 0.55]) g.fillRect(0, y - 3, L, 6);
    for (let i = 0; i < L / 129; i++) { g.fillStyle = 'rgba(15,15,18,0.28)'; g.beginPath(); g.ellipse(R() * L, (R() - 0.5) * hw * 1.4, 4 + R() * 6, 3 + R() * 4, 0, 0, TAU); g.fill(); }
    for (let i = 0; i < L / 323; i++) { g.fillStyle = R() < 0.5 ? 'rgba(150,148,140,0.75)' : 'rgba(40,40,42,0.45)'; g.fillRect(R() * L, (R() - 0.5) * hw * 1.5, 10 + R() * 18, 6 + R() * 10); }
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, -hw, L, 3); g.fillRect(0, hw - 3, L, 3);
  } else if (T.asphalt) {
    g.fillStyle = pat(g, 'asphalt'); g.fillRect(0, -hw, L, hw * 2);
    g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(0, -hw, L, 5); g.fillRect(0, hw - 5, L, 5);
    const R = mulberry32(e.id * 977 + 13);
    // remendos de asfalto (operação tapa-buraco) e desgaste nas trilhas de roda
    g.fillStyle = 'rgba(0,0,0,0.07)'; for (const y of [-hw * 0.6, -hw * 0.25, hw * 0.25, hw * 0.6]) g.fillRect(0, y - 3.5, L, 7);
    for (let i = 0; i < L / 188; i++) {
      const s = R() * L, y = (R() - 0.5) * hw * 1.5, w = 16 + R() * 34, h = 10 + R() * 16;
      g.fillStyle = R() < 0.55 ? '#25272b' : '#3f4146'; g.fillRect(s, y, w, h);
      g.strokeStyle = 'rgba(10,10,12,0.5)'; g.lineWidth = 1; g.strokeRect(s, y, w, h);
    }
    for (let i = 0; i < L / 271; i++) {
      const s = R() * L, y = (R() - 0.5) * hw * 1.6;
      g.fillStyle = R() < 0.5 ? 'rgba(20,20,24,0.35)' : 'rgba(80,80,85,0.25)';
      g.fillRect(s, y, 14 + R() * 30, 6 + R() * 12);
    }
    g.strokeStyle = 'rgba(15,15,18,0.45)'; g.lineWidth = 1;
    for (let i = 0; i < L / 333; i++) {
      let s = R() * L, y = (R() - 0.5) * hw * 1.7;
      g.beginPath(); g.moveTo(s, y);
      for (let k = 0; k < 5; k++) { s += 4 + R() * 7; y += (R() - 0.5) * 6; g.lineTo(s, y); }
      g.stroke();
    }
    for (let i = 0; i < L / 500; i++) {
      const s = e.perpA + 40 + R() * Math.max(10, L - e.perpA - e.perpB - 80), y = (R() < 0.5 ? -1 : 1) * hw * 0.5;
      g.fillStyle = '#26272b'; g.beginPath(); g.arc(s, y, 7, 0, TAU); g.fill();
      g.strokeStyle = '#55565c'; g.lineWidth = 1.5; g.stroke();
      g.strokeStyle = 'rgba(90,90,95,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(s - 4, y); g.lineTo(s + 4, y); g.moveTo(s, y - 4); g.lineTo(s, y + 4); g.stroke();
    }
  } else {
    g.fillStyle = pat(g, 'dirt');
    g.beginPath();
    g.moveTo(0, -hw);
    for (let s = 0; s <= L; s += 16) g.lineTo(s, -hw - 3 + hash2((e.id * 131 + s) | 0, 7) * 8);
    for (let s = L; s >= 0; s -= 16) g.lineTo(s, hw + 3 - hash2((e.id * 131 + s) | 0, 11) * 8);
    g.closePath(); g.fill();
    const R = mulberry32(e.id * 31 + 7);
    const wob = (s, k) => Math.sin(s * 0.013 + k) * 2.2 + Math.sin(s * 0.041 + k * 3) * 1.1;
    // capim invadindo as bordas
    g.fillStyle = 'rgba(70,96,44,0.45)';
    for (let s = 0; s < L; s += 10) { const w1 = 3 + hash2((e.id * 7 + s) | 0, 3) * 7, w2 = 3 + hash2((e.id * 7 + s) | 0, 5) * 7; g.fillRect(s, -hw - 2, 10, w1); g.fillRect(s, hw + 2 - w2, 10, w2); }
    // trilhas dos pneus: terra mais escura e compactada
    for (const y of [-25, -11, 11, 25]) {
      g.strokeStyle = 'rgba(70,40,24,0.38)'; g.lineWidth = 5.5; g.beginPath();
      for (let s = 0; s <= L; s += 24) { const yy = y + wob(s, y); if (s) g.lineTo(s, yy); else g.moveTo(s, yy); }
      g.stroke();
      g.strokeStyle = 'rgba(200,150,110,0.12)'; g.lineWidth = 1.2; g.stroke();
    }
    // faixa de capim no meio da estrada e entre as trilhas
    for (const y of [-18, 0, 18]) {
      for (let s = R() * 20; s < L; s += 6 + R() * 16) {
        if (R() < (y === 0 ? 0.35 : 0.6)) continue;
        g.fillStyle = R() < 0.5 ? 'rgba(84,112,50,0.75)' : 'rgba(104,128,60,0.7)';
        g.beginPath(); g.ellipse(s, y + wob(s, y) + (R() - 0.5) * 3, 2 + R() * 3, 1.2 + R() * 1.6, 0, 0, TAU); g.fill();
      }
    }
    // costela de vaca (ondulações) em alguns trechos
    for (let i = 0; i < L / 260; i++) {
      const s0 = R() * L, n = 6 + R() * 10;
      g.strokeStyle = 'rgba(60,34,20,0.18)'; g.lineWidth = 1.4; g.beginPath();
      for (let k = 0; k < n; k++) { const s = s0 + k * 6; g.moveTo(s, -hw + 8); g.lineTo(s + 1, hw - 8); }
      g.stroke();
    }
    // buracos e poças d'água
    for (let i = 0; i < L / 150; i++) {
      const s = R() * L, y = (R() < 0.5 ? -1 : 1) * (6 + R() * (hw - 14)), rx = 5 + R() * 9, ry = 3 + R() * 5;
      g.fillStyle = 'rgba(50,28,16,0.55)'; g.beginPath(); g.ellipse(s, y, rx + 2, ry + 1.5, R() * 0.6, 0, TAU); g.fill();
      if (R() < 0.6) { g.fillStyle = 'rgba(120,140,160,0.55)'; g.beginPath(); g.ellipse(s - 1, y - 0.5, rx * 0.75, ry * 0.65, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(220,230,240,0.35)'; g.fillRect(s - rx * 0.4, y - ry * 0.3, rx * 0.5, 1); }
    }
    // pedras soltas
    for (let i = 0; i < L / 18; i++) { g.fillStyle = R() < 0.5 ? 'rgba(170,160,145,0.8)' : 'rgba(110,100,92,0.8)'; g.fillRect(R() * L, (R() - 0.5) * hw * 1.8, 1.5 + R() * 1.5, 1.2 + R()); }
  }
  g.restore();
}
function drawEdgeMarkings(g, e) {
  const T = e.T;
  if (!T.asphalt) return;
  const blq = edgePave(e) === 'bloquete';
  const L = e.len, hw = e.hw;
  const pad = T.sw ? 26 : 6;
  const s0 = e.perpA ? e.perpA + pad : 0, s1 = e.perpB ? L - e.perpB - pad : L;
  if (s1 <= s0) return;
  edgeLocal(g, e);
  const yel = '#e3bf3f', wht = 'rgba(236,236,230,0.92)';
  if (blq) { /* rua de bloquete: sem faixa no meio */ }
  else if (T.center === 'dash') {
    g.fillStyle = yel;
    for (let s = s0; s < s1; s += 46) g.fillRect(s, -1.5, Math.min(24, s1 - s), 3);
  } else {
    g.fillStyle = yel; g.fillRect(s0, -4.5, s1 - s0, 2.5); g.fillRect(s0, 2, s1 - s0, 2.5);
  }
  if (T.laneDiv) {
    g.fillStyle = wht;
    for (let s = s0; s < s1; s += 42) { const l = Math.min(20, s1 - s); g.fillRect(s, -T.laneDiv - 1, l, 2.4); g.fillRect(s, T.laneDiv - 1.4, l, 2.4); }
  }
  if (T.edgeLine) { g.fillStyle = wht; g.fillRect(0, -hw + 3, L, 2.4); g.fillRect(0, hw - 5.4, L, 2.4); }
  if (T.sw) {
    for (const [atA, perp] of [[true, e.perpA], [false, e.perpB]]) {
      if (!perp) continue;
      const base = atA ? perp + 3 : L - perp - 19;
      g.fillStyle = 'rgba(236,236,230,0.85)';
      for (let y = -hw + 5; y < hw - 6; y += 10) g.fillRect(base, y, 16, 5.5);
      const sl = atA ? perp + 23 : L - perp - 26;
      if (atA) g.fillRect(sl, -hw + 2, 3, hw - 4); else g.fillRect(sl, 2, 3, hw - 4);
    }
  }
  g.restore();
}
function drawNode(g, n, asph) {
  const hv = n.hx, hh = n.hy;
  let sw = 0; for (const e of n.edges) sw = Math.max(sw, e.T.sw || 0);
  const dirs = { N: false, S: false, W: false, E: false };
  for (const e of n.edges) {
    if (e.h) { if (e.a === n) dirs.E = true; else dirs.W = true; }
    else { if (e.a === n) dirs.S = true; else dirs.N = true; }
  }
  const walkP = n.edges.some((e) => e.T.sw && edgeWalk(e) === 'portuguesa') ? 'portuguesa' : 'sidewalk';
  const blq = n.edges.length > 0 && n.edges.every((e) => edgePave(e) === 'bloquete');
  if (sw) {
    g.fillStyle = pat(g, walkP);
    g.fillRect(n.x - hv - sw, n.y - hh - sw, sw, sw); g.fillRect(n.x + hv, n.y - hh - sw, sw, sw);
    g.fillRect(n.x - hv - sw, n.y + hh, sw, sw); g.fillRect(n.x + hv, n.y + hh, sw, sw);
    if (!dirs.N) g.fillRect(n.x - hv, n.y - hh - sw, hv * 2, sw);
    if (!dirs.S) g.fillRect(n.x - hv, n.y + hh, hv * 2, sw);
    if (!dirs.W) g.fillRect(n.x - hv - sw, n.y - hh, sw, hh * 2);
    if (!dirs.E) g.fillRect(n.x + hv, n.y - hh, sw, hh * 2);
    g.fillStyle = CURB_Y;
    if (!dirs.N) g.fillRect(n.x - hv, n.y - hh - 2.5, hv * 2, 2.5);
    if (!dirs.S) g.fillRect(n.x - hv, n.y + hh, hv * 2, 2.5);
    if (!dirs.W) g.fillRect(n.x - hv - 2.5, n.y - hh, 2.5, hh * 2);
    if (!dirs.E) g.fillRect(n.x + hv, n.y - hh, 2.5, hh * 2);
  } else {
    let sh = 0; for (const e of n.edges) sh = Math.max(sh, e.T.shoulder || 0);
    if (sh) { g.fillStyle = pat(g, 'gravel'); g.fillRect(n.x - hv - sh, n.y - hh - sh, (hv + sh) * 2, (hh + sh) * 2); }
  }
  g.fillStyle = pat(g, asph ? (blq ? 'bloquete' : 'asphalt') : 'dirt');
  if (asph) g.fillRect(n.x - hv, n.y - hh, hv * 2, hh * 2);
  else { g.beginPath(); g.arc(n.x, n.y, Math.max(hv, hh) * 1.15, 0, TAU); g.fill(); g.fillRect(n.x - hv, n.y - hh, hv * 2, hh * 2); }
  if (asph && n.edges.length >= 3) {
    g.fillStyle = 'rgba(0,0,0,0.1)'; g.beginPath(); g.ellipse(n.x, n.y, hv * 0.7, hh * 0.7, 0, 0, TAU); g.fill();
  }
}
function drawBridge(g, e) {
  const b = e.bridge, hw = e.hw, y = e.a.y;
  const extra = (e.T.sw || 0) + (e.T.shoulder || 0) + 12;
  g.save();
  g.beginPath(); g.rect(b.x0 - 10, y - hw - extra, b.x1 - b.x0 + 20, extra - 6); g.rect(b.x0 - 10, y + hw + 6, b.x1 - b.x0 + 20, extra);
  g.clip();
  drawRiver(g, y - hw - extra - 20, y + hw + extra + 20);
  g.restore();
  // sombra do tabuleiro na água
  g.save();
  g.beginPath(); for (let yy = y + hw + 6; yy < y + hw + 40; yy += 8) { const cx = riverCX(yy), rh = riverHW(yy); g.rect(cx - rh, yy, rh * 2, 8); }
  g.clip();
  g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(b.x0, y + hw + 6, b.x1 - b.x0, 26);
  g.restore();
  if (b.wood) {
    for (let x = b.x0; x < b.x1; x += 7) {
      const r = hash2(x | 0, 3);
      g.fillStyle = r < 0.33 ? '#6e4a2c' : r < 0.66 ? '#7d5634' : '#634328';
      g.fillRect(x, y - hw, 6.2, hw * 2);
      if (r > 0.85) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, y - hw + r * 20, 6.2, 4); }
    }
    g.fillStyle = '#4a321e'; g.fillRect(b.x0, y - hw - 6, b.x1 - b.x0, 6); g.fillRect(b.x0, y + hw, b.x1 - b.x0, 6);
    g.fillStyle = '#2e1f12';
    for (let x = b.x0; x < b.x1; x += 30) { g.fillRect(x, y - hw - 8, 6, 8); g.fillRect(x, y + hw, 6, 8); }
  } else {
    // tabuleiro um pouco mais claro, com transição suave para o asfalto da pista (sem corte seco)
    const fade = 46, gr = g.createLinearGradient(b.x0, 0, b.x1, 0), f = fade / (b.x1 - b.x0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(f, 'rgba(255,255,255,0.045)'); gr.addColorStop(1 - f, 'rgba(255,255,255,0.045)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(b.x0, y - hw, b.x1 - b.x0, hw * 2);
    // juntas de dilatação: perfil metálico nas duas cabeceiras e a cada vão
    for (const x of [b.x0 + fade, b.x1 - fade]) { g.fillStyle = '#1c1d20'; g.fillRect(x - 2, y - hw, 4, hw * 2); g.fillStyle = 'rgba(190,195,200,0.55)'; g.fillRect(x - 0.6, y - hw, 1.2, hw * 2); }
    g.fillStyle = 'rgba(0,0,0,0.3)';
    for (let x = b.x0 + fade + 110; x < b.x1 - fade - 20; x += 110) g.fillRect(x, y - hw, 2, hw * 2);
    g.fillStyle = '#b9b7ae'; g.fillRect(b.x0, y - hw - 7, b.x1 - b.x0, 6); g.fillRect(b.x0, y + hw + 1, b.x1 - b.x0, 6);
    g.fillStyle = '#8a8880';
    for (let x = b.x0; x < b.x1; x += 22) { g.fillRect(x, y - hw - 8, 4, 8); g.fillRect(x, y + hw, 4, 8); }
  }
}
function drawRiver(g, ya, yb) {
  const step = 16;
  const y0 = Math.floor(ya / step) * step - step, y1 = yb + step * 2;
  g.fillStyle = pat(g, 'sand');
  g.beginPath();
  for (let y = y0; y <= y1; y += step) { const x = riverCX(y) - riverHW(y) - 28 - hash2(y, 1) * 6; if (y === y0) g.moveTo(x, y); else g.lineTo(x, y); }
  for (let y = y1; y >= y0; y -= step) g.lineTo(riverCX(y) + riverHW(y) + 28 + hash2(y, 2) * 6, y);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(40,30,20,0.25)';
  g.beginPath();
  for (let y = y0; y <= y1; y += step) { const x = riverCX(y) - riverHW(y) - 6; if (y === y0) g.moveTo(x, y); else g.lineTo(x, y); }
  for (let y = y1; y >= y0; y -= step) g.lineTo(riverCX(y) + riverHW(y) + 6, y);
  g.closePath(); g.fill();
  g.fillStyle = pat(g, 'water');
  g.beginPath();
  for (let y = y0; y <= y1; y += step) { const x = riverCX(y) - riverHW(y); if (y === y0) g.moveTo(x, y); else g.lineTo(x, y); }
  for (let y = y1; y >= y0; y -= step) g.lineTo(riverCX(y) + riverHW(y), y);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(4,14,24,0.35)';
  g.beginPath();
  for (let y = y0; y <= y1; y += step) { const x = riverCX(y) - riverHW(y) * 0.55; if (y === y0) g.moveTo(x, y); else g.lineTo(x, y); }
  for (let y = y1; y >= y0; y -= step) g.lineTo(riverCX(y) + riverHW(y) * 0.55, y);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(190,215,225,0.22)'; g.lineWidth = 2;
  for (const sd of [-1, 1]) {
    g.beginPath();
    for (let y = y0; y <= y1; y += step) { const x = riverCX(y) + sd * (riverHW(y) - 2); if (y === y0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
  }
}
function drawPond(g, cx, cy, rx, ry) {
  g.fillStyle = pat(g, 'sand'); g.beginPath(); g.ellipse(cx, cy, rx * 1.12, ry * 1.14, 0, 0, TAU); g.fill();
  g.fillStyle = pat(g, 'water'); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(4,14,24,0.3)'; g.beginPath(); g.ellipse(cx, cy, rx * 0.6, ry * 0.6, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(190,215,225,0.2)'; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, rx - 2, ry - 2, 0, 0, TAU); g.stroke();
  g.fillStyle = '#3e6a2e';
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + hash2(i, 9); g.beginPath(); g.arc(cx + Math.cos(a) * rx * 0.98, cy + Math.sin(a) * ry * 0.98, 4 + hash2(i, 5) * 5, 0, TAU); g.fill(); }
}
function drawFountain(g, cx, cy) {
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(cx + 4, cy + 5, 41, 0, TAU); g.fill();
  g.fillStyle = '#c2bba9'; g.beginPath(); g.arc(cx, cy, 41, 0, TAU); g.fill();
  g.fillStyle = '#9d9684'; g.beginPath(); g.arc(cx, cy, 36, 0, TAU); g.fill();
  const gr = g.createRadialGradient(cx, cy, 4, cx, cy, 35); gr.addColorStop(0, '#5fc6e0'); gr.addColorStop(1, '#1f6f90');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 34, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1;
  for (const r of [14, 22, 29]) { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); }
  g.fillStyle = '#d8d2c2'; g.beginPath(); g.arc(cx, cy, 8, 0, TAU); g.fill();
  g.fillStyle = '#bfe9f5'; g.beginPath(); g.arc(cx, cy, 4, 0, TAU); g.fill();
}

/* ============================ PROPS BAIXOS ============================ */
function drawBrokenProp(g, p) {
  const R = mulberry32((p.seed * 1e6) | 0);
  g.rotate(p.fallA - p.a);
  switch (p.type) {
    case 'bench':
      for (let i = 0; i < 3; i++) { g.save(); g.translate(4 + i * 7 + R() * 4, (R() - 0.5) * 14); g.rotate((R() - 0.5) * 1.6); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-9, -1, 20, 4); g.fillStyle = i % 2 ? '#6a4224' : '#8a5a34'; g.fillRect(-10, -2, 20, 3); g.restore(); }
      g.fillStyle = '#3a3a3a'; g.fillRect(-3, -6, 2, 5); g.fillRect(-2, 4, 5, 2);
      break;
    case 'bin':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(4, -3, 12, 8);
      g.fillStyle = '#2f6a3a'; g.fillRect(3, -4, 11, 7); g.fillStyle = '#1c3f22'; g.fillRect(13, -4, 2, 7);
      for (let i = 0; i < 9; i++) { g.fillStyle = ['#e8e2d0', '#c9a46a', '#3a86ff', '#e63946', '#7a7a7a'][i % 5]; g.fillRect(14 + R() * 18, (R() - 0.5) * 18, 2.4, 2); }
      break;
    case 'hydrant':
      g.fillStyle = 'rgba(80,140,190,0.35)'; g.beginPath(); g.ellipse(6, 0, 16, 10, 0, 0, TAU); g.fill();
      g.fillStyle = '#7a1a16'; g.beginPath(); g.arc(0, 0, 2.6, 0, TAU); g.fill();
      g.fillStyle = '#c8302a'; g.fillRect(10, -2, 7, 4);
      break;
    case 'table': case 'cart':
      g.save(); g.translate(6, 2); g.rotate(0.7); g.fillStyle = p.c || '#d23a2a'; g.fillRect(-5, -5, 10, 10); g.restore();
      for (let i = 0; i < 4; i++) { g.fillStyle = shade(p.c || '#d62828', -0.15); g.fillRect(-4 + R() * 22, (R() - 0.5) * 18, 3, 3); }
      if (p.type === 'cart') for (let i = 0; i < 14; i++) { g.fillStyle = '#f5e6b0'; g.fillRect(4 + R() * 20, (R() - 0.5) * 16, 1.6, 1.6); }
      break;
    case 'cone':
      g.save(); g.translate(14 + R() * 10, (R() - 0.5) * 14); g.rotate(R() * TAU); g.fillStyle = '#ff6a1a'; g.beginPath(); g.moveTo(-5, -3); g.lineTo(5, 0); g.lineTo(-5, 3); g.closePath(); g.fill(); g.fillStyle = '#f2f2ea'; g.fillRect(-2, -1.5, 1.5, 3); g.restore();
      break;
    case 'barrier':
      for (let i = 0; i < 2; i++) { g.save(); g.translate(8 + i * 12 + R() * 6, (R() - 0.5) * 16); g.rotate((R() - 0.5) * 2); for (let j = 0; j < 3; j++) { g.fillStyle = j % 2 ? '#f2f2ea' : '#e8402a'; g.fillRect(-7 + j * 4.7, -1.5, 4.7, 3); } g.restore(); }
      break;
    case 'tires':
      for (let i = 0; i < 3; i++) { const x = 4 + R() * 22, y = (R() - 0.5) * 20; g.fillStyle = '#18181a'; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); g.fillStyle = '#3a3a3e'; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); }
      break;
    case 'pot':
      for (let i = 0; i < 6; i++) { g.fillStyle = '#2a2420'; g.beginPath(); const x = R() * 16, y = (R() - 0.5) * 14; g.moveTo(x, y); g.lineTo(x + 3, y + 1); g.lineTo(x + 1, y + 3); g.fill(); }
      break;
    default:
      g.fillStyle = '#4a4a4e'; g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill(); g.fillRect(2, -1, 7, 2);
  }
}
function drawProp(g, p) {
  g.save(); g.translate(p.x, p.y); g.rotate(p.a);
  if (p.broken) { drawBrokenProp(g, p); g.restore(); return; }
  switch (p.type) {
    case 'bench':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-12, -2, 28, 9);
      g.fillStyle = '#3a3a3a'; g.fillRect(-12, -4, 2, 8); g.fillRect(10, -4, 2, 8);
      g.fillStyle = '#8a5a34'; g.fillRect(-13, -4, 26, 3); g.fillRect(-13, 0, 26, 3);
      g.fillStyle = '#6a4224'; g.fillRect(-13, -1, 26, 1);
      break;
    case 'bin':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(2, 3, 5, 0, TAU); g.fill();
      g.fillStyle = '#2f6a3a'; g.beginPath(); g.arc(0, 0, 4.5, 0, TAU); g.fill();
      g.fillStyle = '#1c3f22'; g.beginPath(); g.arc(0, 0, 2.5, 0, TAU); g.fill();
      break;
    case 'hydrant':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(2, 3, 4, 0, TAU); g.fill();
      g.fillStyle = '#c8302a'; g.beginPath(); g.arc(0, 0, 3.6, 0, TAU); g.fill();
      g.fillStyle = '#ffd04a'; g.beginPath(); g.arc(0, 0, 1.6, 0, TAU); g.fill();
      break;
    case 'bollard':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(1.5, 2, 3, 0, TAU); g.fill();
      g.fillStyle = '#5a5a5e'; g.beginPath(); g.arc(0, 0, 2.6, 0, TAU); g.fill();
      g.fillStyle = '#e0c04a'; g.beginPath(); g.arc(0, 0, 1.2, 0, TAU); g.fill();
      break;
    case 'island': {
      const w = p.w, h = p.h;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
      g.fillStyle = '#d8d6cf'; g.fillRect(-w / 2, -h / 2, w, h);
      g.fillStyle = '#3a3a3a'; g.fillRect(-w / 2, -h / 2, w, 2); g.fillRect(-w / 2, h / 2 - 2, w, 2);
      for (let x = -w / 2 + 18; x < w / 2 - 10; x += 46) {
        g.fillStyle = '#f2f2ee'; g.fillRect(x - 7, -5, 14, 10);
        g.fillStyle = p.c || '#ff3d3d'; g.fillRect(x - 7, -5, 14, 3);
        g.fillStyle = '#222'; g.fillRect(x - 4, 0, 8, 3);
        g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 7, 0); g.quadraticCurveTo(x + 12, 6, x + 9, 9); g.stroke();
      }
      break;
    }
    case 'tires':
      for (const [dx, dy] of [[0, 0], [5, 3]]) {
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(dx + 2, dy + 3, 8, 0, TAU); g.fill();
        g.fillStyle = '#18181a'; g.beginPath(); g.arc(dx, dy, 7.5, 0, TAU); g.fill();
        g.fillStyle = '#3a3a3e'; g.beginPath(); g.arc(dx, dy, 3.5, 0, TAU); g.fill();
      }
      break;
    case 'goal':
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.strokeRect(-20, 0, 40, 10);
      g.strokeStyle = '#f2f2f2'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-22, 0); g.lineTo(22, 0); g.stroke();
      g.strokeStyle = 'rgba(230,230,230,0.45)'; g.lineWidth = 0.8;
      for (let x = -20; x <= 20; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, -8); g.stroke(); }
      g.beginPath(); g.moveTo(-20, -8); g.lineTo(20, -8); g.stroke();
      break;
    case 'well':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(3, 4, 12, 0, TAU); g.fill();
      g.fillStyle = '#8a8478'; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill();
      g.fillStyle = '#0c1418'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill();
      g.fillStyle = '#5a3c22'; g.fillRect(-13, -1.5, 26, 3);
      break;
    case 'trough':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-18, -3, 40, 13);
      g.fillStyle = '#7d7a72'; g.fillRect(-20, -6, 40, 12);
      g.fillStyle = '#2a5a70'; g.fillRect(-17, -3, 34, 6);
      break;
    case 'scarecrow':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-10, 2, 22, 4);
      g.fillStyle = '#5a3c22'; g.fillRect(-12, -1, 24, 2.5); g.fillRect(-1, -8, 2.5, 16);
      g.fillStyle = '#8a3a2a'; g.fillRect(-6, -3, 12, 7);
      g.fillStyle = '#c9a64a'; g.beginPath(); g.arc(0, -6, 4.5, 0, TAU); g.fill();
      g.fillStyle = '#6a4a22'; g.beginPath(); g.arc(0, -6, 6.5, Math.PI, TAU); g.fill();
      break;
    case 'cart':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-8, -4, 20, 14);
      g.fillStyle = '#d23a2a'; g.fillRect(-10, -7, 20, 13);
      g.fillStyle = '#f5e6b0'; g.fillRect(-7, -5, 14, 8);
      g.fillStyle = '#222'; g.fillRect(-11, 4, 4, 4); g.fillRect(7, 4, 4, 4);
      break;
    case 'mound':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(6, 8, 44, 30, 0, 0, TAU); g.fill();
      for (let i = 0; i < 4; i++) { g.fillStyle = ['#7a6248', '#8a7258', '#6a5240', '#9a8268'][i]; g.beginPath(); g.ellipse(-i * 3, -i * 3, 42 - i * 9, 28 - i * 6, 0, 0, TAU); g.fill(); }
      g.fillStyle = '#b0a080'; for (let i = 0; i < 12; i++) g.fillRect((hash2(i, 3) - 0.5) * 60, (hash2(i, 4) - 0.5) * 36, 3, 2);
      break;
    case 'hole':
      g.fillStyle = '#141416'; g.beginPath(); g.ellipse(0, 0, 11, 7, 0.3, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(120,110,90,0.6)'; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = 'rgba(80,140,190,0.35)'; g.beginPath(); g.ellipse(-2, 1, 6, 3, 0.3, 0, TAU); g.fill();
      break;
    case 'cone':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(1.5, 2, 4, 0, TAU); g.fill();
      g.fillStyle = '#ff6a1a'; g.fillRect(-3.5, -3.5, 7, 7); g.fillStyle = '#ff7f2a'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
      g.strokeStyle = '#f2f2ea'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 1.8, 0, TAU); g.stroke();
      break;
    case 'barrier':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-13, -1, 28, 5);
      for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#f2f2ea' : '#e8402a'; g.fillRect(-14 + i * 4.7, -2.5, 4.7, 4); }
      g.fillStyle = '#3a3a3a'; g.fillRect(-14, 1.5, 2, 2); g.fillRect(12, 1.5, 2, 2);
      break;
    case 'flagES':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(1, 2, 3, 0, TAU); g.fill();
      g.fillStyle = '#ccc'; g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill();
      for (let i = 0; i < 3; i++) { g.fillStyle = ['#1d4f9c', '#f4f4f0', '#e98bb0'][i]; g.fillRect(2, -8 + i * 4, 18, 4); }
      break;
    case 'pot': {
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(1.5, 2, 6, 0, TAU); g.fill();
      g.fillStyle = '#2a2420'; g.beginPath(); g.arc(0, 0, 5.5, 0, TAU); g.fill();
      g.fillStyle = '#4a3a30'; g.beginPath(); g.arc(-1, -1, 3.4, 0, TAU); g.fill();
      g.fillStyle = '#1a1410'; g.fillRect(-7.5, -1, 2.5, 2); g.fillRect(5, -1, 2.5, 2);
      break;
    }
    case 'table': {
      const c = p.c || '#d62828';
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-4, -3, 11, 11);
      g.fillStyle = shade(c, -0.15);
      for (const [dx, dy] of [[-7, -1.5], [5, -1.5], [-1.5, -7], [-1.5, 5]]) g.fillRect(dx, dy, 3, 3);
      g.fillStyle = c; g.fillRect(-4.5, -4.5, 9, 9);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-4.5, -4.5, 9, 2);
      g.fillStyle = '#e8c547'; g.fillRect(-1, -1, 2, 3);
      break;
    }
    case 'orelhao': {
      // orelhão: concha laranja aberta para a rua
      g.fillStyle = 'rgba(0,0,0,0.32)'; g.beginPath(); g.ellipse(2.5, 3, 8, 7, 0, 0, TAU); g.fill();
      g.fillStyle = '#5a5a5e'; g.fillRect(-1, -1, 2, 2);
      g.fillStyle = '#ff7a1a'; g.beginPath(); g.arc(0, 0, 7.2, Math.PI * 0.32, Math.PI * 1.68, false); g.lineTo(0, 0); g.closePath(); g.fill();
      g.fillStyle = '#ffa04a'; g.beginPath(); g.arc(-1.2, -1, 4.6, Math.PI * 0.5, Math.PI * 1.5, false); g.closePath(); g.fill();
      g.strokeStyle = '#b34a08'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 7.2, Math.PI * 0.32, Math.PI * 1.68, false); g.stroke();
      g.fillStyle = '#1d4f9c'; g.fillRect(1, -2, 3, 4); g.fillStyle = '#c8c8c0'; g.fillRect(1.6, -1.3, 1.6, 1);
      break;
    }
    case 'bump': {
      const w = p.w, h = p.h;
      g.fillStyle = '#1c1c1e'; g.fillRect(-w / 2, -h / 2, w, h);
      g.fillStyle = '#e8c23a';
      const long = w > h, L = long ? w : h;
      for (let t = -L / 2; t < L / 2; t += 10) { if (long) g.fillRect(t, -h / 2, 5, h); else g.fillRect(-w / 2, t, w, 5); }
      g.fillStyle = 'rgba(255,255,255,0.12)'; if (long) g.fillRect(-w / 2, -h / 2, w, 2); else g.fillRect(-w / 2, -h / 2, 2, h);
      break;
    }
    case 'flag':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(1, 2, 3, 0, TAU); g.fill();
      g.fillStyle = '#ccc'; g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill();
      g.fillStyle = '#2a9a48'; g.fillRect(2, -8, 18, 12);
      g.fillStyle = '#f0d43a'; g.beginPath(); g.moveTo(4, -2); g.lineTo(11, -7); g.lineTo(18, -2); g.lineTo(11, 3); g.closePath(); g.fill();
      g.fillStyle = '#2a4a9a'; g.beginPath(); g.arc(11, -2, 2.6, 0, TAU); g.fill();
      break;
  }
  g.restore();
}
function drawWallBaked(g, w) {
  if (w.graf) {
    // muro alto pichado: face sul visível com frases e pixos
    const x0 = w.x0, y0 = w.y0, ww = w.x1 - w.x0, hh = w.y1 - w.y0, lift = 11, fy = y0 - lift + hh;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x0 + 2, y0 + 2, ww + 2, hh + 3);
    g.fillStyle = shade(w.color, -0.18); g.fillRect(x0, fy, ww, lift);
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = x0; x < x0 + ww; x += 9) g.fillRect(x, fy, 0.7, lift);
    g.fillStyle = shade(w.color, 0.1); g.fillRect(x0, y0 - lift, ww, hh);
    g.textBaseline = 'middle'; g.textAlign = 'left';
    for (const t of w.graf) {
      if (t.mural) {
        const cols = ['#e63946', '#f4c430', '#2a9d8f', '#3a86ff', '#ff7f11'];
        for (let i = 0; i < 6; i++) { g.fillStyle = cols[(i + t.x) % 5]; g.fillRect(t.x + i * 11, fy + 1, 11, lift - 2); }
        g.font = 'italic 900 8px Arial, sans-serif'; g.lineWidth = 2; g.strokeStyle = '#111'; g.strokeText(t.text, t.x + 2, fy + lift / 2, 64); g.fillStyle = '#fff'; g.fillText(t.text, t.x + 2, fy + lift / 2, 64);
      } else {
        g.font = (PIXOS.includes(t.text) ? '900 9px "Arial Narrow", Impact, Arial' : 'italic 800 8px Arial') + ', sans-serif';
        g.fillStyle = t.color; g.fillText(t.text, t.x, fy + lift / 2, 80);
        for (let i = 0; i < 3; i++) g.fillRect(t.x + 6 + i * 17, fy + lift / 2 + 3, 0.8, 2 + (i * 3 + t.x) % 3);
      }
    }
    return;
  }
  const x0 = w.x0, y0 = w.y0, ww = w.x1 - w.x0, hh = w.y1 - w.y0, lift = 3;
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x0 + 2, y0 + 2, ww + 2, hh + 2);
  if (w.kind === 'hedge') {
    g.fillStyle = '#2e4a24'; g.fillRect(x0, y0 - lift + 1, ww, hh + lift);
    g.fillStyle = '#4a6e36';
    const long = ww > hh;
    for (let i = 0; i < (long ? ww : hh); i += 5) { g.beginPath(); g.arc(long ? x0 + i + 2 : x0 + ww / 2, long ? y0 + hh / 2 - lift : y0 + i + 2 - lift, Math.min(ww, hh) * 0.55 + 0.8, 0, TAU); g.fill(); }
    return;
  }
  g.fillStyle = shade(w.color, -0.42); g.fillRect(x0, y0 - lift + hh, ww, lift);
  g.fillStyle = shade(w.color, -0.1); g.fillRect(x0, y0 - lift, ww, hh);
  g.fillStyle = shade(w.color, 0.2); g.fillRect(x0, y0 - lift, ww, 1);
}
function drawFenceBaked(g, f) {
  const long = (f.x1 - f.x0) > (f.y1 - f.y0);
  const L = long ? f.x1 - f.x0 : f.y1 - f.y0;
  if (f.gaps && f.gaps.length) {
    // cerca arrebentada: desenha os pedaços inteiros e madeira/arame caídos nos buracos
    let cur = 0;
    const parts = [];
    for (const gp of [...f.gaps].sort((a, b) => a.t - b.t)) { if (gp.t - 22 > cur) parts.push([cur, gp.t - 22]); cur = Math.max(cur, gp.t + 22); }
    if (L > cur) parts.push([cur, L]);
    for (const [a, b] of parts) drawFenceBaked(g, long ? { x0: f.x0 + a, x1: f.x0 + b, y0: f.y0, y1: f.y1, type: f.type } : { x0: f.x0, x1: f.x1, y0: f.y0 + a, y1: f.y0 + b, type: f.type });
    for (const gp of f.gaps) {
      const R = mulberry32((gp.t * 97) | 0), cx0 = long ? f.x0 + gp.t : (f.x0 + f.x1) / 2, cy0 = long ? (f.y0 + f.y1) / 2 : f.y0 + gp.t;
      for (let i = 0; i < 4; i++) { g.save(); g.translate(cx0 + Math.cos(gp.a) * (6 + R() * 22) + (R() - 0.5) * 12, cy0 + Math.sin(gp.a) * (6 + R() * 22) + (R() - 0.5) * 12); g.rotate(R() * TAU); g.fillStyle = f.type === 'chain' ? '#8f949a' : '#6a4a2a'; g.fillRect(-7, -1, 14, 2.4); g.restore(); }
    }
    return;
  }
  const cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2;
  const P = (t, o) => long ? [f.x0 + t, cy + o] : [cx + o, f.y0 + t];
  if (f.type === 'chain') {
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.beginPath(); let a = P(0, 3), b = P(L, 3); g.moveTo(a[0] + 2, a[1]); g.lineTo(b[0] + 2, b[1]); g.stroke();
    g.strokeStyle = 'rgba(180,185,190,0.55)'; g.lineWidth = 1.6; a = P(0, 0); b = P(L, 0); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.fillStyle = '#8f949a';
    for (let t = 0; t <= L; t += 30) { const p = P(t, 0); g.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3); }
  } else {
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; let a = P(0, 3), b = P(L, 3); g.beginPath(); g.moveTo(a[0] + 2, a[1]); g.lineTo(b[0] + 2, b[1]); g.stroke();
    g.strokeStyle = '#8a6a44'; g.lineWidth = 1.2;
    for (const o of [-1, 1]) { a = P(0, o); b = P(L, o); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    for (let t = 0; t <= L; t += 26) {
      const p = P(t, 0);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(p[0] - 1, p[1] - 1, 5, 5);
      g.fillStyle = '#5c3f24'; g.fillRect(p[0] - 2.2, p[1] - 2.2, 4.4, 4.4);
      g.fillStyle = '#7a5634'; g.fillRect(p[0] - 2.2, p[1] - 2.2, 4.4, 1.4);
    }
  }
}
function drawAwning(g, r, color, front) {
  const [x0, y0, x1, y1] = r, w = x1 - x0, h = y1 - y0;
  const along = front === 'N' || front === 'S';
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x0 + 2, y0 + 3, w, h);
  const n = Math.max(2, Math.floor((along ? w : h) / 8));
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? '#f1ece0' : color;
    if (along) g.fillRect(x0 + (w / n) * i, y0, w / n + 0.5, h); else g.fillRect(x0, y0 + (h / n) * i, w, h / n + 0.5);
  }
  g.fillStyle = 'rgba(0,0,0,0.25)';
  if (along) g.fillRect(x0, front === 'N' ? y0 : y1 - 1.5, w, 1.5); else g.fillRect(front === 'W' ? x0 : x1 - 1.5, y0, 1.5, h);
}

/* ============================ VEÍCULOS ============================ */
const VMODELS = {
  quadrado: { id: 'quadrado', L: 43, W: 22, ws: 0.24, rf: 0.10, rr: -0.30, rw: -0.44, nose: 1.8, tail: 1.6, kind: 'car', boxy: true },
  besouro: { id: 'besouro', L: 41, W: 22, ws: 0.13, rf: 0.0, rr: -0.22, rw: -0.36, nose: 10, tail: 11, kind: 'car', beetle: true },
  escada: { id: 'escada', L: 39, W: 21, ws: 0.25, rf: 0.14, rr: -0.40, rw: -0.47, nose: 2, tail: 1.5, kind: 'car', boxy: true, ladder: true },
  santana: { id: 'santana', L: 50, W: 23, ws: 0.18, rf: 0.04, rr: -0.22, rw: -0.33, nose: 2, tail: 2, kind: 'car', boxy: true },
  hatch: { id: 'hatch', L: 44, W: 22, ws: 0.20, rf: 0.06, rr: -0.30, rw: -0.43, nose: 6, tail: 5, kind: 'car' },
  sedan: { id: 'sedan', L: 50, W: 23, ws: 0.17, rf: 0.02, rr: -0.20, rw: -0.32, nose: 6, tail: 5, kind: 'car' },
  police: { id: 'police', L: 50, W: 23, ws: 0.17, rf: 0.02, rr: -0.20, rw: -0.32, nose: 6, tail: 5, kind: 'car', police: true },
  taxi: { id: 'taxi', L: 50, W: 23, ws: 0.17, rf: 0.02, rr: -0.20, rw: -0.32, nose: 6, tail: 5, kind: 'car', taxi: true },
  pickup: { id: 'pickup', L: 52, W: 24, ws: 0.25, rf: 0.13, rr: -0.07, rw: -0.10, nose: 5, tail: 3, kind: 'car', bed: -0.12 },
  van: { id: 'van', L: 48, W: 24, ws: 0.45, rf: 0.37, rr: -0.44, rw: -0.47, nose: 10, tail: 6, kind: 'car', van: true },
  sport: { id: 'sport', L: 45, W: 24, ws: 0.14, rf: -0.02, rr: -0.25, rw: -0.37, nose: 9, tail: 6, kind: 'car', stripes: true, spoiler: true },
  muscle: { id: 'muscle', L: 56, W: 25, ws: 0.10, rf: -0.05, rr: -0.25, rw: -0.34, nose: 4, tail: 4, kind: 'car', chrome: true },
  truck: { id: 'truck', L: 84, W: 28, kind: 'truck' },
  bus: { id: 'bus', L: 112, W: 30, kind: 'bus' },
  tractor: { id: 'tractor', L: 34, W: 24, kind: 'tractor' },
  moto: { id: 'moto', L: 21, W: 8, kind: 'moto' },
  bau: { id: 'bau', L: 72, W: 26, kind: 'truck', variant: 'bau' },
  gas: { id: 'gas', L: 58, W: 25, kind: 'truck', variant: 'gas' },
  tanker: { id: 'tanker', L: 80, W: 27, kind: 'truck', variant: 'tanker' },
  cacamba: { id: 'cacamba', L: 62, W: 26, kind: 'truck', variant: 'cacamba' },
  guincho: { id: 'guincho', L: 68, W: 26, kind: 'truck', variant: 'guincho' },
};
const _bodyPaths = {};
function bodyPath(m) {
  if (_bodyPaths[m.id]) return _bodyPaths[m.id];
  const hl = m.L / 2, hw = m.W / 2, n = m.nose || 4, t = m.tail || 4, p = new Path2D();
  p.moveTo(-hl + t, -hw);
  p.lineTo(hl - n, -hw + 0.6);
  p.quadraticCurveTo(hl, -hw + 0.8, hl, -hw + n);
  p.lineTo(hl, hw - n);
  p.quadraticCurveTo(hl, hw - 0.8, hl - n, hw - 0.6);
  p.lineTo(-hl + t, hw);
  p.quadraticCurveTo(-hl, hw, -hl, hw - t);
  p.lineTo(-hl, -hw + t);
  p.quadraticCurveTo(-hl, -hw, -hl + t, -hw);
  p.closePath();
  _bodyPaths[m.id] = p;
  return p;
}
const _grads = new Map();
function bodyGrad(ctx, color, hw, lift) {
  const k = color + hw + (lift || 0);
  let g = _grads.get(k);
  if (!g) {
    g = ctx.createLinearGradient(0, -hw, 0, hw);
    const L = lift || 0;
    g.addColorStop(0, shade(color, -0.5)); g.addColorStop(0.2, shade(color, -0.12 + L));
    g.addColorStop(0.5, shade(color, 0.16 + L)); g.addColorStop(0.8, shade(color, -0.12 + L)); g.addColorStop(1, shade(color, -0.5));
    _grads.set(k, g);
  }
  return g;
}
let _glassGrad = null;
function glassGrad(ctx) {
  if (!_glassGrad) {
    _glassGrad = ctx.createLinearGradient(0, -12, 0, 12);
    _glassGrad.addColorStop(0, '#0b111b'); _glassGrad.addColorStop(0.45, '#2c3d55'); _glassGrad.addColorStop(0.55, '#3d5270'); _glassGrad.addColorStop(1, '#0b111b');
  }
  return _glassGrad;
}
function drawWheel(ctx, x, y, len, wid, steer, roll, rim) {
  ctx.save(); ctx.translate(x, y); if (steer) ctx.rotate(steer);
  ctx.fillStyle = '#0d0d0f'; ctx.beginPath(); rrect(ctx, -len / 2, -wid / 2, len, wid, 1.6); ctx.fill();
  ctx.fillStyle = '#2c2c31';
  const ph = ((roll || 0) % 3 + 3) % 3;
  ctx.beginPath(); for (let s = -len / 2 + ph; s < len / 2; s += 3) ctx.rect(s, -wid / 2, 1, wid); ctx.fill(); // banda do pneu numa pincelada
  if (rim) { ctx.fillStyle = rim; ctx.beginPath(); rrect(ctx, -len * 0.3, -wid * 0.3, len * 0.6, wid * 0.6, 1); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-len * 0.3, -wid * 0.3, len * 0.6, wid * 0.15); }
  ctx.restore();
}
function drawVehicle(ctx, m, color, x, y, a, o) {
  o = o || {};
  // a câmera achata o chão (SQ); o carro é desenhado sem achatar, girado pelo ângulo projetado na tela
  const sq = o.noSq ? 1 : SQ;
  const as = o.noSq ? a : Math.atan2(Math.sin(a) * SQ, Math.cos(a));
  const lift = o.noLift ? 0 : vehLift(m);
  ctx.save();
  ctx.translate(x + 2.5, y + 3.5 / sq); ctx.scale(1, 1 / sq); ctx.rotate(as);
  if (typeof SHSPR !== 'undefined' && SHSPR && Settings.quality === 'alta') { const ga = ctx.globalAlpha; ctx.translate(-1, -1); ctx.globalAlpha = ga * 0.78; softCarShadow(ctx, m.L + 4, m.W + 3); ctx.globalAlpha = ga; } // sombra de contato macia
  else { ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.beginPath(); rrect(ctx, -m.L / 2 - 1, -m.W / 2 - 0.5, m.L + 2, m.W + 1, m.kind === 'moto' ? 4 : 6); ctx.fill(); }
  ctx.restore();
  if (lift && m.kind !== 'moto') {
    const bp = bodyPath(m), base = m.kind === 'car' ? color : m.kind === 'bus' ? '#d8d6ce' : m.kind === 'truck' ? (o.box || '#d9d6cc') : color;
    const steps = [[0, -0.7], [0.35, -0.6], [0.7, -0.48]];
    for (const [k, sh] of steps) {
      ctx.save(); ctx.translate(x, y - lift * k / sq); ctx.scale(1, 1 / sq); ctx.rotate(as);
      ctx.fillStyle = shade(base, sh); ctx.fill(bp);
      ctx.restore();
    }
  }
  ctx.save();
  ctx.translate(x, y - lift / sq); ctx.scale(1, 1 / sq); ctx.rotate(as);
  if (o.bump) ctx.translate(o.bump, 0);
  if (m.kind === 'truck') drawTruck(ctx, m, color, o);
  else if (m.kind === 'bus') drawBus(ctx, m, color, o);
  else if (m.kind === 'tractor') drawTractor(ctx, m, color, o);
  else if (m.kind === 'moto') drawMoto(ctx, m, color, o);
  else drawCar(ctx, m, color, o);
  ctx.restore();
}
function drawMoto(ctx, m, color, o) {
  drawWheel(ctx, 7, 0, 6.5, 3, o.steer, o.roll); drawWheel(ctx, -7, 0, 6.5, 3.2, 0, o.roll);
  ctx.fillStyle = bodyGrad(ctx, color, 3); ctx.beginPath(); rrect(ctx, -6, -2.6, 13, 5.2, 2); ctx.fill();
  ctx.fillStyle = '#c8321e'; ctx.fillRect(-10, -3.6, 6, 7.2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-10, -0.4, 6, 0.8);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(5, -4.2); ctx.lineTo(5, 4.2); ctx.stroke();
  ctx.fillStyle = '#1e2430'; ctx.beginPath(); ctx.ellipse(-1, 0, 3.6, 3.4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = shade(color, 0.15); ctx.beginPath(); ctx.arc(1.5, 0, 2.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0e141c'; ctx.fillRect(2.6, -1.4, 1.2, 2.8);
  ctx.fillStyle = o.parked ? '#a8a698' : '#fff6d8'; ctx.fillRect(9.4, -1, 1, 2);
  ctx.fillStyle = o.brake ? '#ff3a30' : '#a01818'; ctx.fillRect(-10.6, -1, 0.8, 2);
}
function vehLift(m) { return 0; }
function drawLightsFR(ctx, hl, hw, o, m) {
  if (m && m.boxy) {
    // grade de frisos e faróis retangulares, lanternas em bloco
    ctx.fillStyle = '#141416'; ctx.fillRect(hl - 2.4, -hw + 5.4, 2.2, hw * 2 - 10.8);
    ctx.fillStyle = '#5a5c62'; ctx.beginPath(); for (let y = -hw + 6.4; y < hw - 5.4; y += 2) ctx.rect(hl - 2.2, y, 1.8, 0.7); ctx.fill();
    ctx.fillStyle = o.parked ? '#a8a698' : '#fff6d8';
    ctx.fillRect(hl - 2.8, -hw + 1.2, 2.6, 4.2); ctx.fillRect(hl - 2.8, hw - 5.4, 2.6, 4.2);
    ctx.fillStyle = '#e8a33a'; ctx.fillRect(hl - 2.6, -hw + 0.6, 1.6, 0.9); ctx.fillRect(hl - 2.6, hw - 1.5, 1.6, 0.9);
    ctx.fillStyle = o.brake ? '#ff3a30' : (o.parked ? '#5a1414' : '#a01818');
    ctx.fillRect(-hl + 0.3, -hw + 1, 2.6, 7.4); ctx.fillRect(-hl + 0.3, hw - 8.4, 2.6, 7.4);
    ctx.fillStyle = '#e8a33a'; ctx.fillRect(-hl + 0.3, -hw + 1, 2.6, 1.6); ctx.fillRect(-hl + 0.3, hw - 2.6, 2.6, 1.6);
    if (o.rev) { ctx.fillStyle = '#f4f4f4'; ctx.fillRect(-hl + 0.3, -hw + 5.6, 2.6, 1.6); ctx.fillRect(-hl + 0.3, hw - 7.2, 2.6, 1.6); }
    return;
  }
  if (m && m.beetle) {
    ctx.fillStyle = o.parked ? '#a8a698' : '#fff6d8';
    ctx.beginPath(); ctx.arc(hl - 5.5, -hw + 2.6, 2.3, 0, TAU); ctx.arc(hl - 5.5, hw - 2.6, 2.3, 0, TAU); ctx.fill();
    ctx.fillStyle = o.brake ? '#ff3a30' : (o.parked ? '#5a1414' : '#a01818');
    ctx.beginPath(); ctx.ellipse(-hl + 4.5, -hw + 2.4, 1.6, 2.2, 0, 0, TAU); ctx.ellipse(-hl + 4.5, hw - 2.4, 1.6, 2.2, 0, 0, TAU); ctx.fill();
    return;
  }
  ctx.fillStyle = o.parked ? '#a8a698' : '#fff6d8';
  ctx.fillRect(hl - 3.2, -hw + 1.6, 2.8, 4.6); ctx.fillRect(hl - 3.2, hw - 6.2, 2.8, 4.6);
  ctx.fillStyle = o.brake ? '#ff3a30' : (o.parked ? '#5a1414' : '#a01818');
  ctx.fillRect(-hl + 0.4, -hw + 1.4, 2.4, 5.2); ctx.fillRect(-hl + 0.4, hw - 6.6, 2.4, 5.2);
  if (o.rev) { ctx.fillStyle = '#f4f4f4'; ctx.fillRect(-hl + 0.4, -hw + 6.8, 2, 2.2); ctx.fillRect(-hl + 0.4, hw - 9, 2, 2.2); }
}
function drawCar(ctx, m, color, o) {
  const L = m.L, W = m.W, hl = L / 2, hw = W / 2;
  const wl = L * 0.2, xf = hl - L * 0.215, xr = -hl + L * 0.2;
  const K = o.kit, rim = K && K.wheels !== 'serie' ? RIMS[K.wheels] : null;
  const tw = K && K.wheels === 'tala' ? 6.6 : 5, wy = K && K.low ? 2.4 : 1.6, tww = K && K.low ? tw * 0.82 : tw;
  drawWheel(ctx, xf, -hw + wy, wl, tww, o.steer, o.roll, rim); drawWheel(ctx, xf, hw - wy, wl, tww, o.steer, o.roll, rim);
  drawWheel(ctx, xr, -hw + wy, wl, tww, 0, o.roll, rim); drawWheel(ctx, xr, hw - wy, wl, tww, 0, o.roll, rim);
  const bp = bodyPath(m);
  if (m.beetle) {
    // para-lamas redondos do besouro
    ctx.fillStyle = shade(color, -0.12);
    for (const x of [xf, xr]) for (const sy of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x, sy * (hw - 1.2), 6.4, 3.4, 0, 0, TAU); ctx.fill(); }
  }
  ctx.fillStyle = K && K.finish === 'fosco' ? shade(color, -0.1) : bodyGrad(ctx, color, hw); ctx.fill(bp);
  if (K && K.finish === 'metal') { ctx.save(); ctx.clip(bp); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-L / 2, -hw * 0.18, L, hw * 0.36); ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(-L / 2, -hw * 0.6, L, hw * 0.12); ctx.restore(); }
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke(bp);
  const lean = clamp(o.lean || 0, -1, 1) * 1.3;
  const ws = L * m.ws, rf = L * m.rf, rr = L * m.rr, rw = L * m.rw;
  // capô
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(hl - 4, -hw * 0.45); ctx.lineTo(ws + 2, -hw * 0.5 + lean * 0.3); ctx.moveTo(hl - 4, hw * 0.45); ctx.lineTo(ws + 2, hw * 0.5 + lean * 0.3); ctx.stroke();
  // para-choques
  ctx.fillStyle = m.chrome ? '#d9d9d4' : '#26262a';
  ctx.fillRect(hl - 1.8, -hw + 2.5, 1.8, W - 5); ctx.fillRect(-hl, -hw + 2.5, 1.6, W - 5);
  drawLightsFR(ctx, hl, hw, o, m);
  if (m.beetle) {
    ctx.fillStyle = shade(color, -0.12);
    for (const x of [xf, xr]) for (const sy of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x, sy * (hw - 1.4), 5.6, 2.6, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(hl * 0.25, -0.6, hl * 0.6, 1.2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); for (let i = 0; i < 4; i++) ctx.rect(-hl + 7 + i * 1.8, -4, 0.9, 8); ctx.fill();
    drawLightsFR(ctx, hl, hw, o, m);
  }
  if (m.bed !== undefined) {
    const bx = L * m.bed;
    ctx.fillStyle = '#1e1e21'; ctx.fillRect(-hl + 2.2, -hw + 2.4, bx + hl - 2.2, W - 4.8);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath(); for (let x = -hl + 5; x < bx - 1; x += 4) ctx.rect(x, -hw + 3, 1.2, W - 6); ctx.fill();
    ctx.fillStyle = o.cargo ? '#c9a46a' : 'transparent';
    if (o.cargo) { ctx.fillRect(-hl + 5, -hw + 4.5, 10, 7); ctx.fillStyle = '#a88450'; ctx.fillRect(-hl + 5, -hw + 4.5 + 7.5, 10, 6); }
  }
  // para-brisa
  ctx.fillStyle = glassGrad(ctx);
  ctx.beginPath(); ctx.moveTo(ws, -hw + 2.4 + lean * 0.4); ctx.lineTo(rf, -hw + 4 + lean); ctx.lineTo(rf, hw - 4 + lean); ctx.lineTo(ws, hw - 2.4 + lean * 0.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(200,225,255,0.18)';
  ctx.beginPath(); ctx.moveTo(ws - 0.5, -hw + 4 + lean * 0.4); ctx.lineTo(ws - (ws - rf) * 0.6, -hw + 4.5 + lean); ctx.lineTo(ws - (ws - rf) * 0.9, -hw + 9 + lean); ctx.lineTo(ws - 0.5, -hw + 8 + lean * 0.4); ctx.fill();
  // vidro traseiro
  if (m.bed === undefined) {
    ctx.fillStyle = glassGrad(ctx);
    ctx.beginPath(); ctx.moveTo(rr, -hw + 4 + lean); ctx.lineTo(rw, -hw + 2.8 + lean * 0.4); ctx.lineTo(rw, hw - 2.8 + lean * 0.4); ctx.lineTo(rr, hw - 4 + lean); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = glassGrad(ctx); ctx.fillRect(rw - 1, -hw + 4 + lean, 2.6, W - 8);
  }
  // vidros laterais
  ctx.fillStyle = '#121a26';
  ctx.fillRect(rw + 1, -hw + 1.6 + lean * 0.5, ws - rw - 2, 1.8); ctx.fillRect(rw + 1, hw - 3.4 + lean * 0.5, ws - rw - 2, 1.8);
  kitTint(ctx, K, m, hw, ws, rf, rr, rw, lean);
  // teto
  ctx.fillStyle = m.van ? bodyGrad(ctx, '#efe9da', hw - 4) : (m.chrome ? '#1a1a1c' : bodyGrad(ctx, color, hw - 4, 0.06));
  if (m.beetle) { ctx.beginPath(); ctx.ellipse((rr + rf) / 2, lean, (rf - rr) / 2, hw - 4, 0, 0, TAU); ctx.fill(); }
  else { ctx.beginPath(); rrect(ctx, rr, -hw + 4 + lean, rf - rr, W - 8, m.boxy ? 1 : 3); ctx.fill(); }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
  if (m.van) {
    ctx.fillStyle = '#121a26';
    for (let x = rr + 3; x < rf - 6; x += 8) { ctx.fillRect(x, -hw + 1.2 + lean * 0.5, 6, 2.2); ctx.fillRect(x, hw - 3.4 + lean * 0.5, 6, 2.2); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(rr + 4, -2 + lean, rf - rr - 8, 4);
    ctx.fillStyle = '#efe9da';
    ctx.beginPath(); ctx.moveTo(hl - 2, -hw + 3); ctx.lineTo(hl - 9, 0); ctx.lineTo(hl - 2, hw - 3); ctx.lineTo(hl - 1, hw - 3); ctx.lineTo(hl - 1, -hw + 3); ctx.closePath(); ctx.fill();
  }
  if (m.stripes) {
    ctx.fillStyle = 'rgba(245,245,245,0.85)';
    ctx.fillRect(-hl + 1, -3.2 + lean * 0.5, L - 2, 2); ctx.fillRect(-hl + 1, 1.2 + lean * 0.5, L - 2, 2);
  }
  if (m.ladder) {
    ctx.strokeStyle = '#b9bcc2'; ctx.lineWidth = 1.1; ctx.beginPath();
    for (const y of [-3.4, 3.4]) { ctx.moveTo(rr - 3, y + lean); ctx.lineTo(rf + 4, y + lean); }
    for (let x = rr - 1; x <= rf + 3; x += 3.2) { ctx.moveTo(x, -3.4 + lean); ctx.lineTo(x, 3.4 + lean); }
    ctx.stroke();
    ctx.fillStyle = '#333'; ctx.fillRect(rr - 4, -hw + 4.5, 1.5, W - 9); ctx.fillRect(rf + 1, -hw + 4.5, 1.5, W - 9);
  }
  if (m.spoiler) { ctx.fillStyle = '#151517'; ctx.fillRect(-hl + 1.2, -hw + 1, 3, W - 2); }
  if (m.chrome) { ctx.fillStyle = shade(color, -0.3); ctx.fillRect(ws + 3, -3.5, hl - ws - 7, 7); ctx.fillStyle = '#222'; ctx.fillRect(ws + 5, -2, 4, 4); }
  if (m.police) {
    ctx.fillStyle = '#1d4f9c'; ctx.fillRect(rw, -hw + 0.4, ws - rw, 1.4); ctx.fillRect(rw, hw - 1.8, ws - rw, 1.4);
    ctx.fillStyle = '#f4f4f0'; ctx.fillRect(rw, -hw + 1.8, ws - rw, 1); ctx.fillRect(rw, hw - 2.8, ws - rw, 1);
    ctx.fillStyle = '#e98bb0'; ctx.fillRect(rw, -hw + 2.8, ws - rw, 1.4); ctx.fillRect(rw, hw - 4.2, ws - rw, 1.4);
    ctx.fillStyle = '#f4f4f0'; ctx.font = 'bold 4px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(hl - 8, 0); ctx.rotate(Math.PI / 2); ctx.fillStyle = '#1d4f9c'; ctx.fillText('POLÍCIA', 0, 0); ctx.restore();
    const mid = (rr + rf) / 2;
    ctx.fillStyle = '#222'; ctx.fillRect(mid - 2.5, -7 + lean, 5, 14);
    ctx.fillStyle = '#ff2a2a'; ctx.fillRect(mid - 2, -6.5 + lean, 4, 6); ctx.fillStyle = '#2a6aff'; ctx.fillRect(mid - 2, 0.5 + lean, 4, 6);
  }
  if (m.taxi) {
    ctx.fillStyle = '#f2c230'; ctx.fillRect((rr + rf) / 2 - 3, -5 + lean, 6, 10);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect((rr + rf) / 2 - 1, -4 + lean, 2, 8);
  }
  kitOver(ctx, K, m, color, L, W, hl, hw, ws, rf, rr, rw, lean);
  // espelhos
  ctx.fillStyle = shade(color, -0.3);
  ctx.fillRect(ws - 2, -hw - 1.8, 3, 2); ctx.fillRect(ws - 2, hw - 0.2, 3, 2);
  // sujeira e dano
  if (o.zones) drawDents(ctx, m, color, o.zones, lean);
  if (o.dirt > 0.03 || o.damage > 30) {
    ctx.save(); ctx.clip(bp);
    if (o.dirt > 0.03) {
      ctx.globalAlpha = clamp(o.dirt, 0, 1) * 0.75;
      ctx.fillStyle = '#5b452e';
      for (let i = 0; i < 14; i++) { const r = hash2(i, 77); ctx.beginPath(); ctx.ellipse(-hl + r * L, (hash2(i, 13) - 0.5) * W, 3 + hash2(i, 5) * 6, 2 + hash2(i, 6) * 3, 0, 0, TAU); ctx.fill(); }
      ctx.fillRect(-hl, -hw, L, 2.5); ctx.fillRect(-hl, hw - 2.5, L, 2.5);
      ctx.globalAlpha = 1;
    }
    if (o.damage > 30) {
      ctx.strokeStyle = 'rgba(30,30,30,0.6)'; ctx.lineWidth = 0.8;
      const n = Math.floor((o.damage - 30) / 10);
      for (let i = 0; i < n; i++) { const sx = (hash2(i, 41) - 0.5) * L, sy = (hash2(i, 42) - 0.5) * W; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 5, sy + (hash2(i, 43) - 0.5) * 4); ctx.stroke(); }
    }
    ctx.restore();
  }
}
function drawDents(ctx, m, color, Z, lean) {
  const L = m.L, W = m.W, hl = L / 2, hw = W / 2, bp = bodyPath(m);
  const R = mulberry32(((Z.seed || 1) * 7919) | 0);
  ctx.save(); ctx.clip(bp);
  const dent = (x, y, rx, ry, depth) => {
    const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 0.5, x, y, Math.max(rx, ry));
    g.addColorStop(0, shade(color, -0.55 * depth)); g.addColorStop(0.7, shade(color, -0.3 * depth)); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
  };
  const scratches = (x0, x1, y, n) => {
    ctx.strokeStyle = 'rgba(225,225,220,0.75)'; ctx.lineWidth = 0.5; ctx.beginPath();
    for (let i = 0; i < n; i++) { const sx = lerp(x0, x1, R()), sy = y + (R() - 0.5) * 3; ctx.moveTo(sx, sy); ctx.lineTo(sx + 3 + R() * 6, sy + (R() - 0.5) * 1.5); }
    ctx.stroke();
  };
  // frente: capô e para-choque amassados
  if (Z.f > 0.05) {
    const d = Z.f;
    dent(hl - 3, (R() - 0.5) * hw, 4 + d * 7, 3 + d * 5, d);
    if (d > 0.35) { ctx.fillStyle = shade(color, -0.6); ctx.beginPath(); ctx.moveTo(hl, -hw); for (let y = -hw; y <= hw; y += 2.5) ctx.lineTo(hl - 1 - R() * d * 5, y); ctx.lineTo(hl, hw); ctx.closePath(); ctx.fill(); }
    if (d > 0.6) { ctx.fillStyle = '#18181a'; ctx.fillRect(hl - 3.2, -hw + 1.6, 2.8, 4.6); }
    if (d > 0.85) { ctx.fillStyle = '#18181a'; ctx.fillRect(hl - 3.2, hw - 6.2, 2.8, 4.6); }
    scratches(hl - 10, hl - 2, 0, Math.round(d * 6));
  }
  if (Z.r > 0.05) {
    const d = Z.r;
    dent(-hl + 3, (R() - 0.5) * hw, 4 + d * 7, 3 + d * 5, d);
    if (d > 0.35) { ctx.fillStyle = shade(color, -0.6); ctx.beginPath(); ctx.moveTo(-hl, -hw); for (let y = -hw; y <= hw; y += 2.5) ctx.lineTo(-hl + 1 + R() * d * 5, y); ctx.lineTo(-hl, hw); ctx.closePath(); ctx.fill(); }
    if (d > 0.6) { ctx.fillStyle = '#2a0c0c'; ctx.fillRect(-hl + 0.4, -hw + 1.4, 2.4, 5.2); }
    if (d > 0.85) { ctx.fillStyle = '#2a0c0c'; ctx.fillRect(-hl + 0.4, hw - 6.6, 2.4, 5.2); }
    scratches(-hl + 2, -hl + 10, 0, Math.round(d * 6));
  }
  for (const [k, sy] of [['l', -1], ['rt', 1]]) {
    const d = Z[k]; if (!(d > 0.05)) continue;
    const cx = (R() - 0.5) * L * 0.5;
    dent(cx, sy * (hw - 1), 5 + d * 10, 2 + d * 3, d);
    if (d > 0.5) dent(cx + (R() - 0.5) * 14, sy * (hw - 1), 3 + d * 5, 1.5 + d * 2, d * 0.8);
    scratches(cx - 10 - d * 8, cx + 8 + d * 8, sy * (hw - 1.5), Math.round(3 + d * 9));
  }
  ctx.restore();
  // para-choque solto pendurado
  if (Z.f > 0.8) { ctx.save(); ctx.translate(hl - 1, -hw + 2); ctx.rotate(0.45); ctx.fillStyle = '#26262a'; ctx.fillRect(0, -1, 2, W * 0.55); ctx.restore(); }
  if (Z.r > 0.8) { ctx.save(); ctx.translate(-hl + 1, hw - 2); ctx.rotate(Math.PI + 0.45); ctx.fillStyle = '#26262a'; ctx.fillRect(0, -1, 2, W * 0.55); ctx.restore(); }
  // para-brisa trincado
  if (Z.f > 0.5 && m.ws !== undefined) {
    const ws = L * m.ws, rf = L * m.rf, cx = (ws + rf) / 2, cy = (R() - 0.5) * hw * 0.8 + lean;
    ctx.strokeStyle = 'rgba(230,240,255,0.7)'; ctx.lineWidth = 0.5; ctx.beginPath();
    for (let i = 0; i < 7; i++) { const a = R() * TAU, l = 3 + R() * 5; ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * l * 0.5, cy + Math.sin(a) * l); }
    ctx.stroke();
  }
}
function drawTruck(ctx, m, color, o) {
  const L = m.L, W = m.W, hl = L / 2, hw = W / 2;
  for (const x of [hl - 12, -hl + 22, -hl + 10]) { drawWheel(ctx, x, -hw + 1, 11, 5.5, x > 0 ? o.steer : 0, o.roll); drawWheel(ctx, x, hw - 1, 11, 5.5, x > 0 ? o.steer : 0, o.roll); }
  const box = o.box || '#d9d6cc', v = m.variant || 'bau', bl = L - 26;
  if (v === 'tanker') {
    ctx.fillStyle = '#26262a'; ctx.fillRect(-hl, -hw + 2, bl, W - 4);
    const g = ctx.createLinearGradient(0, -hw, 0, hw); g.addColorStop(0, '#7d8289'); g.addColorStop(0.45, '#eef0f2'); g.addColorStop(1, '#6a6f76');
    ctx.fillStyle = g; ctx.beginPath(); rrect(ctx, -hl + 1, -hw + 1, bl - 2, W - 2, hw - 1); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; for (let x = -hl + 10; x < hl - 30; x += 12) { ctx.beginPath(); ctx.moveTo(x, -hw + 1); ctx.lineTo(x, hw - 1); ctx.stroke(); }
    ctx.fillStyle = '#4a4d52'; for (let x = -hl + 12; x < hl - 32; x += 18) { ctx.beginPath(); ctx.arc(x, 0, 2.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ff8a1a'; ctx.fillRect(-hl + 2, -2, 3, 4);
  } else if (v === 'gas') {
    ctx.fillStyle = '#3a3d42'; ctx.fillRect(-hl, -hw, bl, W);
    ctx.strokeStyle = '#8a8d92'; ctx.lineWidth = 1; ctx.strokeRect(-hl + 0.5, -hw + 0.5, bl - 1, W - 1);
    for (let x = -hl + 4; x < hl - 30; x += 5.4) for (let y = -hw + 4; y < hw - 2; y += 5.4) {
      ctx.fillStyle = '#2a5fae'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#9fb3c8'; ctx.beginPath(); ctx.arc(x, y, 1, 0, TAU); ctx.fill();
    }
  } else if (v === 'cacamba') {
    ctx.fillStyle = bodyGrad(ctx, box, hw); ctx.fillRect(-hl, -hw, bl, W);
    ctx.fillStyle = '#6b5a44'; ctx.fillRect(-hl + 3, -hw + 3, bl - 6, W - 6);
    ctx.fillStyle = '#8a7a64'; for (let i = 0; i < 26; i++) ctx.fillRect(-hl + 4 + hash2(i, 5) * (bl - 9), -hw + 4 + hash2(i, 9) * (W - 9), 2.4, 2.4);
    ctx.fillStyle = '#b0a080'; for (let i = 0; i < 10; i++) ctx.fillRect(-hl + 6 + hash2(i, 15) * (bl - 12), -hw + 5 + hash2(i, 19) * (W - 11), 3.4, 2);
  } else if (v === 'guincho') {
    ctx.fillStyle = '#2a2c30'; ctx.fillRect(-hl, -hw + 1, bl, W - 2);
    ctx.fillStyle = '#3e4146'; for (let x = -hl + 2; x < hl - 28; x += 4) ctx.fillRect(x, -hw + 2, 2.4, W - 4);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(-hl, -hw + 1, 2, W - 2); ctx.fillRect(-hl, -hw + 1, bl, 1.4); ctx.fillRect(-hl, hw - 2.4, bl, 1.4);
    if (o.tow) { ctx.save(); ctx.translate(-hl + bl / 2, 0); drawCar(ctx, VMODELS.quadrado, o.towColor || '#8a8d92', { parked: true }); ctx.restore(); }
    else { ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-hl + 2, 0); ctx.lineTo(-hl + 14, 0); ctx.stroke(); }
  } else {
    ctx.fillStyle = bodyGrad(ctx, box, hw); ctx.fillRect(-hl, -hw, bl, W);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(-hl, -hw, bl, W);
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    for (let x = -hl + 6; x < hl - 28; x += 6) { ctx.beginPath(); ctx.moveTo(x, -hw + 1); ctx.lineTo(x, hw - 1); ctx.stroke(); }
    if (o.boxText) { ctx.save(); ctx.fillStyle = 'rgba(30,30,30,0.7)'; ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.boxText, -hl + bl / 2, 0); ctx.restore(); }
  }
  ctx.fillStyle = '#26262a'; ctx.fillRect(hl - 27, -hw + 3, 2, W - 6);
  ctx.fillStyle = bodyGrad(ctx, color, hw - 1);
  ctx.beginPath(); rrect(ctx, hl - 25, -hw + 1, 25, W - 2, 4); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.stroke();
  ctx.fillStyle = glassGrad(ctx); ctx.fillRect(hl - 8, -hw + 3, 5, W - 6);
  ctx.fillStyle = bodyGrad(ctx, color, hw - 3, 0.1); ctx.fillRect(hl - 22, -hw + 3, 13, W - 6);
  ctx.fillStyle = '#ffb547'; ctx.fillRect(hl - 20, -hw + 2, 2, 2); ctx.fillRect(hl - 20, hw - 4, 2, 2);
  drawLightsFR(ctx, hl, hw, o);
}
function drawBus(ctx, m, color, o) {
  const L = m.L, W = m.W, hl = L / 2, hw = W / 2;
  for (const x of [hl - 20, -hl + 26]) { drawWheel(ctx, x, -hw + 1, 12, 5.5, x > 0 ? o.steer : 0, o.roll); drawWheel(ctx, x, hw - 1, 12, 5.5, x > 0 ? o.steer : 0, o.roll); }
  ctx.fillStyle = bodyGrad(ctx, '#e8e6de', hw); ctx.beginPath(); rrect(ctx, -hl, -hw, L, W, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = color; ctx.fillRect(-hl + 2, -hw, L - 4, 3); ctx.fillRect(-hl + 2, hw - 3, L - 4, 3);
  ctx.fillStyle = '#16202c';
  for (let x = -hl + 8; x < hl - 16; x += 13) { ctx.fillRect(x, -hw + 3, 11, 2); ctx.fillRect(x, hw - 5, 11, 2); }
  ctx.fillStyle = glassGrad(ctx); ctx.fillRect(hl - 6, -hw + 3, 5, W - 6);
  ctx.fillStyle = '#bfbdb5'; ctx.fillRect(-hl + 20, -7, 22, 14); ctx.fillRect(hl - 46, -6, 16, 12);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-hl + 22, -5, 18, 10);
  ctx.fillStyle = color; ctx.fillRect(-10, -hw + 5, 30, W - 10);
  drawLightsFR(ctx, hl, hw, o);
}
function drawTractor(ctx, m, color, o) {
  const L = m.L, hl = L / 2;
  drawWheel(ctx, -hl + 8, -11, 15, 8, 0, o.roll); drawWheel(ctx, -hl + 8, 11, 15, 8, 0, o.roll);
  drawWheel(ctx, hl - 6, -8, 9, 4.5, o.steer, o.roll); drawWheel(ctx, hl - 6, 8, 9, 4.5, o.steer, o.roll);
  ctx.fillStyle = bodyGrad(ctx, color, 6); ctx.beginPath(); rrect(ctx, -4, -6, hl + 4, 12, 3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
  ctx.fillStyle = '#222'; ctx.fillRect(hl - 2, -4, 2, 8);
  ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(4, -3, 1.8, 0, TAU); ctx.fill();
  ctx.fillStyle = bodyGrad(ctx, color, 9); ctx.fillRect(-hl + 2, -9, 16, 18);
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-hl + 6, -4, 7, 8);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(-hl + 15, 0, 3, 0, TAU); ctx.stroke();
  ctx.fillStyle = o.parked ? '#a8a698' : '#fff6d8'; ctx.fillRect(hl - 1.5, -5.5, 1.5, 3); ctx.fillRect(hl - 1.5, 2.5, 1.5, 3);
  ctx.fillStyle = o.brake ? '#ff3a30' : '#901818'; ctx.fillRect(-hl + 1.5, -8, 1.6, 3); ctx.fillRect(-hl + 1.5, 5, 1.6, 3);
}
// posições locais das luzes [frente esquerda, frente direita, trás esquerda, trás direita]
function lightPoints(m) {
  const hl = m.L / 2, hw = m.W / 2 - 4;
  return { fx: hl, fy: hw, rx: -hl, ry: hw };
}

/* ============================ ÁRVORES ============================ */
const _treeSprites = new Map();
const TREE_RES = 2;
function treeSprite(type, v) {
  const k = type + v;
  let c = _treeSprites.get(k);
  if (c) return c;
  const S = 64, R = mulberry32(type.length * 1000 + v * 37 + type.charCodeAt(0));
  c = makeCanvas(S * TREE_RES, S * TREE_RES);
  const g = c.getContext('2d');
  g.scale(TREE_RES, TREE_RES); g.translate(S / 2, S / 2);
  const blob = (x, y, r, base, hi) => {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, hi); gr.addColorStop(0.7, base); gr.addColorStop(1, shade(base, -0.35));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  };
  if (type === 'palm') {
    const n = 9 + (v % 3);
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + R() * 0.3, len = 22 + R() * 6;
      g.save(); g.rotate(a);
      g.fillStyle = i % 2 ? '#4a7a33' : '#3d6a2b';
      g.beginPath(); g.moveTo(2, 0); g.quadraticCurveTo(len * 0.5, -6, len, 1.5); g.quadraticCurveTo(len * 0.5, 5, 2, 0); g.fill();
      g.strokeStyle = 'rgba(20,40,15,0.7)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(2, 0); g.quadraticCurveTo(len * 0.5, -0.5, len, 1.5); g.stroke();
      g.restore();
    }
    g.fillStyle = '#6a4a2a'; g.beginPath(); g.arc(0, 0, 3.4, 0, TAU); g.fill();
    g.fillStyle = '#8a6a3a'; g.beginPath(); g.arc(-0.8, -0.8, 1.6, 0, TAU); g.fill();
  } else if (type === 'pine') {
    const n = 7;
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + v * 0.4, len = 18 + R() * 5;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * len, Math.sin(a) * len); g.stroke();
    }
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + v * 0.4, len = 18 + R() * 5;
      blob(Math.cos(a) * len, Math.sin(a) * len, 7 + R() * 2, '#244a2a', '#3f6e3e');
      blob(Math.cos(a) * len * 0.55, Math.sin(a) * len * 0.55, 5, '#20422a', '#376338');
    }
    blob(0, 0, 6, '#22462a', '#3d6a3d');
  } else if (type === 'bush') {
    for (let i = 0; i < 5; i++) blob((R() - 0.5) * 9, (R() - 0.5) * 9, 6 + R() * 3, '#3a6a2c', '#5f9446');
  } else {
    let base = '#2c5524', hi = '#4f8a3a', n = 8, rad = 20;
    if (type === 'mango') { base = '#1f4320'; hi = '#3a6e34'; n = 11; rad = 23; }
    if (type === 'ipeY') { base = '#c9a024'; hi = '#ffe066'; n = 9; }
    if (type === 'ipeP') { base = '#b8508f'; hi = '#ff9fd6'; n = 9; }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(1.5, 2, rad, 0, TAU); g.fill();
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, d = R() * rad * 0.55;
      blob(Math.cos(a) * d, Math.sin(a) * d, rad * (0.42 + R() * 0.2), base, hi);
    }
    blob(-rad * 0.15, -rad * 0.15, rad * 0.45, base, hi);
    if (type === 'ipeY' || type === 'ipeP') {
      g.fillStyle = 'rgba(60,100,40,0.55)';
      for (let i = 0; i < 6; i++) { g.beginPath(); g.arc((R() - 0.5) * rad * 1.4, (R() - 0.5) * rad * 1.4, 3, 0, TAU); g.fill(); }
      g.fillStyle = type === 'ipeY' ? '#fff3a0' : '#ffd0ec';
      for (let i = 0; i < 40; i++) { g.fillRect((R() - 0.5) * rad * 1.6, (R() - 0.5) * rad * 1.6, 1.4, 1.4); }
    }
  }
  _treeSprites.set(k, c);
  return c;
}

/* ============================ SPRITES DE LUZ ============================ */
const LCOL = { sodium: '#ffa64a', warm: '#ffcf8a', white: '#cfe0ff', cyan: '#59e0ff', green: '#5be38f', red: '#ff3b3b', amber: '#ffb000', head: '#fff1cf' };
function lightHex(c) { return LCOL[c] || c; }
let LSPR = null, CONE = null;
const _glowSpr = new Map();
function buildLightSprites() {
  const S = 128;
  LSPR = makeCanvas(S, S);
  const g = LSPR.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0.4)'); gr.addColorStop(0.8, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  // cone dos faróis: origem em (0, H/2), apontando para +x — gerado por pixel (atenuação suave)
  const W2 = 256, H2 = 128;
  CONE = makeCanvas(W2, H2);
  const c = CONE.getContext('2d');
  const img = c.createImageData(W2, H2), d = img.data;
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
    const dx = x + 3, dy = y + 0.5 - H2 / 2;
    const dist = Math.hypot(dx, dy) / W2;
    const ang = Math.abs(Math.atan2(dy, dx));
    const angF = 1 - smoothstep(clamp((ang - 0.12) / 0.36, 0, 1));
    const radF = dist > 1 ? 0 : Math.pow(1 - dist, 1.6) * smoothstep(clamp(dist * 9, 0, 1) * 0.6 + 0.4);
    const a = clamp(angF * radF * 1.15, 0, 1);
    const i = (y * W2 + x) * 4;
    d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255);
  }
  c.putImageData(img, 0, 0);
}
function glowSprite(hex) {
  let c = _glowSpr.get(hex);
  if (c) return c;
  const S = 128; c = makeCanvas(S, S);
  const g = c.getContext('2d');
  const [r, gg, b] = hexToRgb(hex);
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, `rgba(${r},${gg},${b},1)`); gr.addColorStop(0.2, `rgba(${r},${gg},${b},0.6)`);
  gr.addColorStop(0.5, `rgba(${r},${gg},${b},0.2)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  _glowSpr.set(hex, c);
  return c;
}

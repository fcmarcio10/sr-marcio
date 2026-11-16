/* ============================ ÁGUA VIVA E CHÃO MOLHADO ============================
   Desenhado por cima do chão pré-renderizado, só no que está na tela:
   - rio: correnteza em duas camadas (fina e larga), ondinhas em "V" descendo, redemoinhos nas margens,
     folhas e galhinhos boiando, espuma logo depois das pontes e brilho da lua;
   - praia: a onda chega (crista), quebra, sobe espumando na areia, volta e deixa a areia molhada secando;
   - chuva: só o asfalto um pouco mais escuro e a terra virando barro (sem respingos nem riscos). */
const Agua = { pontes: null };
Agua.prepara = function () {
  this.pontes = World.edges.filter((e) => e.bridge).map((e) => ({ y0: e.a.y - e.hw - 16, y1: e.a.y + e.hw + 16, x0: e.bridge.x0, x1: e.bridge.x1 }));
  // trechos da beira do mar que são água de verdade (o píer e o porto ficam de fora) e onde a água começa em cada ponto
  this.trechos = []; this.beira = new Float32Array(Math.ceil(WORLD_W / 20) + 2);
  let ini = null;
  for (let x = 0, i = 0; x <= WORLD_W; x += 20, i++) {
    let y = SEA_Y - 10; while (y < SEA_Y + 60 && groundAt(x, y) !== SF.WATER) y += 4;
    this.beira[i] = y;
    const ok = y < SEA_Y + 60 && groundAt(x, y + 50) === SF.WATER;
    if (ok && ini === null) ini = x;
    if ((!ok || x >= WORLD_W) && ini !== null) { if (x - ini > 40) this.trechos.push([ini, x - 20]); ini = null; }
  }
};
const _sob = (P, x, y) => { for (const p of P) if (y > p.y0 && y < p.y1 && x > p.x0 - 20 && x < p.x1 + 20) return true; return false; };

// ---------- rio ----------
Agua.rio = function (ctx, view) {
  const ya = Math.max(view.y0 - 30, 0), yb = Math.min(view.y1 + 30, SEA_Y);
  if (yb <= ya) return;
  const cxm = riverCX((ya + yb) / 2);
  if (cxm + 260 < view.x0 || cxm - 260 > view.x1) return;
  const T = Game.time, P = this.pontes || [];
  const fl = 22 + Weather.rain * 16; // velocidade da correnteza (a chuva engrossa)
  const X = (y, f) => riverCX(y) + f * riverHW(y); // f de -1 (margem esquerda) a 1 (direita)
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // 1) faixas largas e suaves (o corpo da água se mexendo)
  ctx.strokeStyle = 'rgba(120,170,200,0.07)'; ctx.lineWidth = 7;
  ctx.beginPath();
  for (let k = -3; k <= 3; k++) {
    const passo = 150, vel = fl * 0.7 * (1.2 - Math.abs(k) / 5), off = (T * vel + hash2(k + 30, 7) * passo) % passo;
    for (let y = Math.floor(ya / passo) * passo + off - passo; y < yb; y += passo) {
      if (_sob(P, cxm, y)) continue;
      const f = k / 3.6, L = 38 + hash2(Math.round(y), k + 3) * 30;
      ctx.moveTo(X(y, f), y); ctx.quadraticCurveTo(X(y + L / 2, f) + Math.sin(y * 0.02 + T * 0.4) * 4, y + L / 2, X(y + L, f), y + L);
    }
  }
  ctx.stroke();
  // 2) riscos finos e rápidos (mais rápidos no meio)
  ctx.strokeStyle = 'rgba(210,232,244,0.17)'; ctx.lineWidth = 1.3;
  ctx.beginPath();
  for (let k = -6; k <= 6; k++) {
    const vel = fl * (1.35 - Math.abs(k) / 7.5), passo = 62 + (k & 1) * 21, off = (T * vel + hash2(k + 9, 3) * passo) % passo;
    for (let y = Math.floor(ya / passo) * passo + off - passo; y < yb; y += passo) {
      if (y < ya - 30 || _sob(P, cxm, y)) continue;
      const f = k / 6.6 + Math.sin(y * 0.011 + k) * 0.03, L = 10 + hash2(Math.round(y), k) * 18;
      ctx.moveTo(X(y, f), y); ctx.lineTo(X(y + L, f) + Math.sin(y * 0.02 + T * 0.6) * 1.4, y + L);
    }
  }
  ctx.stroke();
  // 3) ondinhas em "V" descendo com a correnteza
  ctx.strokeStyle = 'rgba(225,240,250,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 18; i++) {
    const passo = 260, f = (hash2(i, 51) - 0.5) * 1.4, off = (T * fl * 0.9 + hash2(i, 52) * passo) % passo;
    for (let y = Math.floor(ya / passo) * passo + off - passo + i * 14; y < yb; y += passo) {
      if (_sob(P, cxm, y)) continue;
      const x = X(y, f), w = 5 + hash2(i, 53) * 5;
      ctx.moveTo(x - w, y - w * 0.7); ctx.lineTo(x, y); ctx.lineTo(x + w, y - w * 0.7);
    }
  }
  ctx.stroke();
  // 4) redemoinhos girando perto das margens
  ctx.strokeStyle = 'rgba(215,235,245,0.22)'; ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const y = ya + ((hash2(i, 61) * 4000 + i * 377) % Math.max(1, yb - ya)); if (_sob(P, cxm, y)) continue;
    const sd = i & 1 ? 1 : -1, x = X(y, sd * (0.78 + hash2(i, 62) * 0.12)), r = 5 + hash2(i, 63) * 5, a0 = T * (1.6 + hash2(i, 64)) * sd;
    ctx.beginPath(); ctx.arc(x, y, r, a0, a0 + 4.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.5, a0 + 2, a0 + 5); ctx.stroke();
  }
  // 5) marolinha batendo nas margens
  ctx.strokeStyle = 'rgba(225,240,248,0.3)'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const sd of [-1, 1]) {
    let first = true;
    for (let y = ya; y <= yb; y += 8) {
      if (_sob(P, cxm, y)) { first = true; continue; }
      const x = riverCX(y) + sd * (riverHW(y) - 4 - (1 + Math.sin(y * 0.09 - T * 2.4 + sd)) * 2.4);
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  // 6) espuma logo depois das pontes (a água bate nos pilares)
  ctx.fillStyle = 'rgba(235,245,250,0.32)';
  for (const p of P) {
    const y = p.y1 - 10; if (y < ya || y > yb + 60) continue;
    for (let j = 0; j < 9; j++) {
      const f = -0.8 + j * 0.2, yy = y + ((T * fl * 0.6 + j * 13) % 46);
      ctx.globalAlpha = 1 - ((yy - y) / 46); ctx.beginPath(); ctx.ellipse(X(yy, f), yy, 3.5, 1.6, 0, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // 7) folhas e galhinhos boiando, descendo devagar e balançando
  for (let i = 0; i < 14; i++) {
    const passo = 900, f = (hash2(i, 71) - 0.5) * 1.5, off = (T * fl * 0.55 + hash2(i, 72) * passo) % passo;
    for (let y = Math.floor(ya / passo) * passo + off - passo + i * 61; y < yb; y += passo) {
      if (_sob(P, cxm, y)) continue;
      const x = X(y, f) + Math.sin(T * 0.8 + i) * 3, a = T * 0.3 + i;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = i % 3 ? 'rgba(70,90,40,0.85)' : 'rgba(92,64,38,0.85)';
      if (i % 3) { ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.2, 0, 0, TAU); ctx.fill(); } else ctx.fillRect(-4, -0.6, 8, 1.2);
      ctx.restore();
    }
  }
  // 8) brilho da lua piscando na água
  ctx.fillStyle = 'rgba(235,245,255,0.6)';
  for (let i = 0; i < 30; i++) {
    const y = ya + hash2(i, 77) * (yb - ya), ph = (T * 0.9 + hash2(i, 5) * 10) % 3;
    if (ph > 0.6 || _sob(P, cxm, y)) continue;
    const x = X(y, (hash2(i, 13) - 0.5) * 1.6), a = Math.sin(ph / 0.6 * Math.PI);
    ctx.globalAlpha = a * 0.8; ctx.fillRect(x - 2.5, y - 0.6, 5, 1.2);
  }
  ctx.restore();
};

// ---------- praia: ciclo da onda ----------
// cada trecho da praia tem a sua fase: a onda vem (crista), quebra, sobe na areia espumando, volta e a areia fica molhada secando
Agua.mar = function (ctx, view, topo) {
  if (view.y1 < SAND_Y - 20 || !this.trechos) return;
  const T = Game.time, B = this.beira;
  const by = (x) => { const f = x / 20, i = Math.floor(f), t = f - i; return lerp(B[i] || SEA_Y, B[i + 1] || SEA_Y, t); };
  const praia = (x) => x >= ORLA_X0 + 40; // na Serra o mar bate na mata/pedra: espuma sem subir na areia
  const PER = 8; // segundos por onda
  const fase = (x) => ((T / PER + Math.sin(x * 0.0021) * 0.35 + Math.sin(x * 0.0007 + 1.3) * 0.2) % 1 + 1) % 1;
  const corre = (x) => (praia(x) ? 26 + Math.sin(x * 0.013) * 6 : 4); // quanto a onda sobe na areia
  // posição da frente da água em relação à beira (negativo = subiu na areia)
  const frente = (x) => {
    const p = fase(x), R = corre(x);
    if (p < 0.55) return 0;
    if (p < 0.72) { const u = (p - 0.55) / 0.17; return -R * Math.sin(u * Math.PI / 2); }
    const u = (p - 0.72) / 0.28; return -R * (1 - u * u * (3 - 2 * u));
  };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [a0, a1] of this.trechos) {
    const x0 = Math.max(a0, view.x0 - 20), x1 = Math.min(a1, view.x1 + 20);
    if (x1 <= x0) continue;
    const xs = []; for (let x = x0; x <= x1; x += 12) xs.push(x); if (xs[xs.length - 1] < x1) xs.push(x1);
    if (!topo) {
      // areia molhada: escura onde a onda acabou de passar, secando aos poucos
      ctx.fillStyle = 'rgba(38,48,54,0.28)';
      ctx.beginPath(); ctx.moveTo(xs[0], by(xs[0]) + 2);
      for (const x of xs) { const p = fase(x), seca = p > 0.72 ? 1 - (p - 0.72) / 0.28 * 0.5 : p < 0.55 ? 0.5 - p / 0.55 * 0.3 : 1; ctx.lineTo(x, by(x) - corre(x) * Math.max(0.2, seca) - 2); }
      for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(xs[i], by(xs[i]) + 2);
      ctx.closePath(); ctx.fill();
      // brilho molhado na areia logo atrás da água
      ctx.fillStyle = 'rgba(170,190,205,0.12)';
      ctx.beginPath(); ctx.moveTo(xs[0], by(xs[0]));
      for (const x of xs) ctx.lineTo(x, by(x) + frente(x) - 5);
      for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(xs[i], by(xs[i]) + frente(xs[i]));
      ctx.closePath(); ctx.fill();
    }
    // cristas chegando (antes de quebrar): linha clara ficando mais grossa perto da beira
    for (let w = 0; w < 3; w++) {
      ctx.beginPath(); let caneta = false, pp = -1;
      for (const x of xs) {
        const p = (fase(x) + w / 3) % 1;
        // levanta a caneta onde a onda já quebrou ou onde a fase virou (sem riscos retos ligando pontos longe)
        if (p > 0.55 || (pp >= 0 && Math.abs(p - pp) > 0.2)) { caneta = false; pp = p; if (p > 0.55) continue; }
        pp = p;
        const u = p / 0.55, y = by(x) + 120 * (1 - u) + 4 + Math.sin(x * 0.04 + T) * 1.5;
        if (caneta) ctx.lineTo(x, y); else { ctx.moveTo(x, y); caneta = true; }
      }
      ctx.strokeStyle = 'rgba(232,244,250,0.32)'; ctx.lineWidth = 1.2 + w * 0.4; ctx.stroke();
    }
    // água subindo na areia (lâmina clara) com a espuma na ponta
    ctx.fillStyle = 'rgba(200,225,235,0.22)';
    ctx.beginPath(); ctx.moveTo(xs[0], by(xs[0]) + 6);
    for (const x of xs) ctx.lineTo(x, by(x) + frente(x));
    for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(xs[i], by(xs[i]) + 6);
    ctx.closePath(); ctx.fill();
    // espuma: faixa branca na ponta da água (mais grossa quando a onda acabou de quebrar)
    ctx.fillStyle = 'rgba(246,251,253,0.7)';
    ctx.beginPath();
    xs.forEach((x, i) => { const y = by(x) + frente(x) + Math.sin(x * 0.09 + T * 1.6) * 1.2; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    for (let i = xs.length - 1; i >= 0; i--) {
      const x = xs[i], p = fase(x), g = p > 0.55 && p < 0.8 ? 5.5 : 2.6;
      ctx.lineTo(x, by(x) + frente(x) + g + Math.sin(x * 0.05 - T) * 1.4);
    }
    ctx.closePath(); ctx.fill();
    // linha de espuma que fica onde a onda chegou mais alto, sumindo devagar
    ctx.strokeStyle = 'rgba(240,248,252,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath();
    xs.forEach((x, i) => { const p = fase(x); const y = by(x) - corre(x) + 1; if (p < 0.72 || !praia(x)) { ctx.moveTo(x, y); return; } ctx.lineTo(x, y); });
    ctx.stroke();
    // bolhinhas da espuma
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let x = Math.ceil(x0 / 7) * 7; x <= x1; x += 7) {
      const h = hash2(x, 41); if (h > 0.5) continue;
      ctx.fillRect(x, by(x) + frente(x) + 3 + h * 12 + Math.sin(T * 2 + x) * 1.2, 1.3, 1.3);
    }
  }
  ctx.restore();
};

// ---------- chão molhado (só escurece; sem respingos nem riscos) ----------
Agua.molhado = function (ctx, view) {
  const w = Weather.wet; if (w < 0.04) return;
  ctx.save();
  ctx.fillStyle = `rgba(4,10,22,${(0.2 * w).toFixed(3)})`;
  ctx.beginPath();
  const vis = [];
  for (const e of World.edges) {
    const r = e.h ? [Math.min(e.a.x, e.b.x), e.a.y - e.hw, Math.max(e.a.x, e.b.x), e.a.y + e.hw] : [e.a.x - e.hw, Math.min(e.a.y, e.b.y), e.a.x + e.hw, Math.max(e.a.y, e.b.y)];
    if (r[2] < view.x0 || r[0] > view.x1 || r[3] < view.y0 || r[1] > view.y1) continue;
    vis.push([e, r]);
    if (e.T.asphalt && !e.bridge) ctx.rect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
  }
  const nos = [];
  for (const n of World.nodes) {
    if (n.x + n.hx < view.x0 || n.x - n.hx > view.x1 || n.y + n.hy < view.y0 || n.y - n.hy > view.y1 || !n.hx) continue;
    const asf = n.edges.some((e) => e.T.asphalt); nos.push([n, asf]);
    if (asf) ctx.rect(n.x - n.hx, n.y - n.hy, n.hx * 2, n.hy * 2);
  }
  ctx.fill();
  ctx.fillStyle = `rgba(34,18,6,${(0.32 * w).toFixed(3)})`;
  ctx.beginPath();
  for (const [e, r] of vis) if (!e.T.asphalt) ctx.rect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
  for (const [n, asf] of nos) if (!asf) ctx.rect(n.x - n.hx, n.y - n.hy, n.hx * 2, n.hy * 2);
  ctx.fill();
  ctx.restore();
};
// sem respingos no teto dos carros nem espirro do trânsito (o dono não gostou): ficam vazias
Agua.atualiza = function () {};
Agua.respingosCarro = function () {};

Agua.desenhaChao = function (ctx, view) {
  if (!this.pontes) this.prepara();
  if (Settings.quality !== 'baixa') { this.rio(ctx, view); this.mar(ctx, view); }
  this.molhado(ctx, view);
};

// por cima da escuridão: a espuma e o brilho da água aparecem de noite como se a lua batesse
Agua.luar = function (ctx, view) {
  if (Settings.quality === 'baixa' || !this.pontes) return;
  ctx.save(); ctx.globalAlpha = 0.55 * clamp(Cam.dark || 0.7, 0.3, 1);
  this.rio(ctx, view); this.mar(ctx, view, true);
  ctx.restore();
};

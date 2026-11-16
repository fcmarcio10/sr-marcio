/* ============================ ÁGUA VIVA E CHÃO MOLHADO ============================
   Tudo desenhado por cima do chão pré-renderizado, só no que está na tela (poucas pinceladas por quadro):
   - rio correndo (riscos de correnteza descendo para o mar, brilho e marolinha nas margens);
   - mar com ondas: cristas que chegam, espuma que sobe na areia e volta, areia molhada por onde a onda passou;
   - chuva: asfalto mais escuro e brilhante (marcas de pneu lustrosas), terra escura de barro,
     água escorrendo na sarjeta até o bueiro e respingos no teto dos carros. */
const Agua = { pontes: null, respC: [] };
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
  const ya = Math.max(view.y0 - 20, 0), yb = Math.min(view.y1 + 20, SEA_Y);
  if (yb <= ya) return;
  const cxm = riverCX((ya + yb) / 2);
  if (cxm + 200 < view.x0 || cxm - 200 > view.x1) return;
  const T = Game.time, P = this.pontes || [];
  const flui = 26 + Weather.rain * 18; // a chuva engrossa a correnteza
  ctx.save();
  // riscos de correnteza: faixas que descem devagar (mais rápidas no meio)
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(205,228,240,0.16)'; ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let k = -5; k <= 5; k++) {
    const vel = flui * (1.25 - Math.abs(k) / 7), passo = 70 + (k & 1) * 23;
    const off = ((T * vel + hash2(k + 9, 3) * passo) % passo);
    for (let y = Math.floor(ya / passo) * passo + off - passo; y < yb; y += passo) {
      if (y < ya - 30 || _sob(P, cxm, y)) continue;
      const hw = riverHW(y), x = riverCX(y) + k / 5.6 * hw * 0.92 + Math.sin(y * 0.03 + k) * 3;
      const L = 12 + hash2(Math.round(y), k) * 16;
      ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(y * 0.02 + T * 0.6) * 1.5, y + L);
    }
  }
  ctx.stroke();
  // marolinha batendo nas margens
  ctx.strokeStyle = 'rgba(225,240,248,0.28)'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const sd of [-1, 1]) {
    let first = true;
    for (let y = ya; y <= yb; y += 10) {
      if (_sob(P, cxm, y)) { first = true; continue; }
      const x = riverCX(y) + sd * (riverHW(y) - 4 - (1 + Math.sin(y * 0.09 - T * 2.2 + sd)) * 2.2);
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  // brilho da lua piscando na água
  ctx.fillStyle = 'rgba(235,245,255,0.55)';
  for (let i = 0; i < 26; i++) {
    const y = ya + hash2(i, 77) * (yb - ya), ph = (T * 0.9 + hash2(i, 5) * 10) % 3;
    if (ph > 0.6 || _sob(P, cxm, y)) continue;
    const x = riverCX(y) + (hash2(i, 13) - 0.5) * riverHW(y) * 1.6, a = Math.sin(ph / 0.6 * Math.PI);
    ctx.globalAlpha = a * 0.8; ctx.fillRect(x - 2.5, y - 0.6, 5, 1.2);
  }
  ctx.restore();
};

// ---------- mar ----------
Agua.mar = function (ctx, view, topo) {
  if (view.y1 < SAND_Y - 20 || !this.trechos) return;
  const T = Game.time;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [a0, a1] of this.trechos) {
    const x0 = Math.max(a0, view.x0 - 20), x1 = Math.min(a1, view.x1 + 20);
    if (x1 <= x0) continue;
    const praia = (x) => x >= ORLA_X0 + 40; // na Serra o mar bate na mata/pedra: espuma sem subir na areia
    const B = this.beira, by = (x) => { const f = x / 20, i = Math.floor(f), t = f - i; return lerp(B[i] || SEA_Y, B[i + 1] || SEA_Y, t); };
    // cristas chegando (de longe para a beira, ficando mais fortes perto da praia)
    ctx.lineWidth = 1.6;
    for (let w = 0; w < 4; w++) {
      const k = ((T / 7 + w / 4) % 1), y = SEA_Y + 170 - k * 140, alpha = Math.sin(k * Math.PI) * 0.4;
      if (y > view.y1 + 20 || y < view.y0 - 20) continue;
      ctx.strokeStyle = `rgba(230,242,250,${alpha.toFixed(3)})`;
      ctx.beginPath();
      for (let x = x0; x <= x1; x += 14) { const yy = y + Math.sin(x * 0.012 + w * 2) * 6 + Math.sin(x * 0.041 + T) * 2; if (x === x0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke();
    }
    // espuma subindo na areia e voltando (o mar "respira"), com a areia molhada atrás
    const fase = (x) => Math.sin(T * 0.9 + x * 0.004) * 0.5 + Math.sin(T * 0.37 + x * 0.0013) * 0.5;
    const sobe = (x) => (praia(x) ? 10 + 12 * fase(x) : 2 + 3 * fase(x));
    if (!topo) { ctx.fillStyle = 'rgba(40,52,58,0.22)'; // areia molhada
    ctx.beginPath(); ctx.moveTo(x0, by(x0) + 2);
    for (let x = x0; x <= x1; x += 14) ctx.lineTo(x, by(x) - (praia(x) ? 24 + Math.sin(x * 0.02) * 3 : 3));
    ctx.lineTo(x1, by(x1) + 2); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(244,250,252,0.62)';
    ctx.beginPath(); ctx.moveTo(x0, by(x0) + 8);
    for (let x = x0; x <= x1; x += 12) ctx.lineTo(x, by(x) - sobe(x) + Math.sin(x * 0.07 + T * 1.3) * 1.6);
    for (let x = x1; x >= x0; x -= 12) ctx.lineTo(x, by(x) - sobe(x) + 5 + Math.sin(x * 0.05 - T) * 2);
    ctx.closePath(); ctx.fill();
    // bolhinhas da espuma
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let x = Math.ceil(x0 / 9) * 9; x <= x1; x += 9) {
      const h = hash2(x, 41); if (h > 0.45) continue;
      ctx.fillRect(x, by(x) - sobe(x) + 6 + h * 10 + Math.sin(T * 2 + x) * 1.2, 1.4, 1.4);
    }
  }
  ctx.restore();
};

// ---------- chão molhado ----------
Agua.molhado = function (ctx, view) {
  const w = Weather.wet; if (w < 0.04) return;
  const T = Game.time;
  ctx.save();
  // asfalto mais escuro (encharcado) e terra virando barro
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
  // brilho molhado nas trilhas dos pneus (onde a água fica lisa e reflete o céu)
  ctx.fillStyle = `rgba(150,175,215,${(0.07 * w).toFixed(3)})`;
  ctx.beginPath();
  for (const [e, r] of vis) {
    if (!e.T.asphalt) continue;
    for (const l of e.T.lanes) for (const sd of [-1, 1]) for (const t of [-6, 6]) {
      const o = sd * l + t;
      if (e.h) ctx.rect(r[0], e.a.y + o - 1.6, r[2] - r[0], 3.2); else ctx.rect(e.a.x + o - 1.6, r[1], 3.2, r[3] - r[1]);
    }
  }
  ctx.fill();
  // água escorrendo na sarjeta (rua com calçada) na direção dos bueiros
  if (Weather.rain > 0.08 && Settings.quality !== 'baixa') {
    ctx.strokeStyle = `rgba(185,210,240,${(0.32 * Math.min(1, Weather.rain * 1.4)).toFixed(3)})`; ctx.lineWidth = 1.4;
    ctx.setLineDash([7, 11]); ctx.lineDashOffset = -T * 34;
    ctx.beginPath();
    for (const [e, r] of vis) {
      if (!e.T.sw || e.bridge) continue;
      const o = e.hw - 2.2;
      if (e.h) { ctx.moveTo(r[0], e.a.y - o); ctx.lineTo(r[2], e.a.y - o); ctx.moveTo(r[0], e.a.y + o); ctx.lineTo(r[2], e.a.y + o); }
      else { ctx.moveTo(e.a.x - o, r[1]); ctx.lineTo(e.a.x - o, r[3]); ctx.moveTo(e.a.x + o, r[1]); ctx.lineTo(e.a.x + o, r[3]); }
    }
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
};

// ---------- respingos no teto dos carros (por cima dos carros) ----------
Agua.atualiza = function (dt) {
  const L = this.respC;
  for (const r of L) r.t += dt;
  if (L.length && L[0].t > 0.3) this.respC = L.filter((r) => r.t < 0.3);
  // carro do trânsito rápido no asfalto molhado levanta água atrás
  if (Weather.wet > 0.25 && Settings.quality !== 'baixa' && Game.mode === 'play') {
    const v = Cam.view;
    for (const c of Traffic.cars) {
      if (c.v < 140 || !c.m || !inView(v, c.x, c.y, 30) || Math.random() > 0.3 * Weather.wet * dt * 60) continue;
      const g = groundAt(c.x, c.y); if (g !== SF.ROAD && g !== SF.BRIDGE && g !== SF.PAVED) continue;
      const ca = Math.cos(c.a), sa = Math.sin(c.a), L = c.m.L * 0.45;
      Particles.emit('water', c.x - ca * L + (Math.random() - 0.5) * 10, c.y - sa * L + (Math.random() - 0.5) * 10, -ca * c.v * 0.12 + (Math.random() - 0.5) * 40, -sa * c.v * 0.12 + (Math.random() - 0.5) * 40, 0.3 + Math.random() * 0.25, 3);
    }
  }
  if (Weather.rain < 0.15 || Settings.quality === 'baixa' || !player || Game.mode !== 'play') return;
  const v = Cam.view, n = Weather.rain * (Settings.quality === 'alta' ? 26 : 14) * dt;
  const carros = [player];
  for (const c of Traffic.cars) if (inView(v, c.x, c.y, 10)) carros.push(c);
  for (let i = 0; i < n || (Math.random() < n - Math.floor(n) && i < n + 1); i++) {
    const c = carros[(Math.random() * carros.length) | 0], m = c.m; if (!m) continue;
    const u = (Math.random() - 0.5) * m.L * 0.8, s = (Math.random() - 0.5) * m.W * 0.8;
    this.respC.push({ c, u, s, t: 0 });
  }
  if (this.respC.length > 80) this.respC.splice(0, this.respC.length - 80);
};
Agua.respingosCarro = function (ctx, view) {
  if (!this.respC.length) return;
  ctx.save(); ctx.fillStyle = 'rgba(230,240,255,0.75)'; ctx.strokeStyle = 'rgba(220,235,255,0.45)'; ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (const r of this.respC) {
    const c = r.c, ca = Math.cos(c.a), sa = Math.sin(c.a);
    const x = c.x + ca * r.u - sa * r.s, y = c.y + sa * r.u + ca * r.s;
    if (!inView(view, x, y, 6)) continue;
    const k = r.t / 0.3, rr = 0.8 + k * 3.2;
    ctx.moveTo(x + rr, y); ctx.ellipse(x, y, rr, rr * 0.6, 0, 0, TAU);
  }
  ctx.globalAlpha = 0.7; ctx.stroke();
  ctx.restore();
};

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

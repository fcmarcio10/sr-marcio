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
// tudo preso ao mapa (nada depende de onde a câmera está): parar o carro não muda nada na água
Agua.rio = function (ctx, view) {
  const ya = Math.max(view.y0 - 40, 0), yb = Math.min(view.y1 + 40, SEA_Y);
  if (yb <= ya) return;
  const cxm = riverCX((ya + yb) / 2);
  if (cxm + 260 < view.x0 || cxm - 260 > view.x1) return;
  const T = Game.time, P = this.pontes || [];
  const fl = 20 + Weather.rain * 14; // velocidade da correnteza (a chuva engrossa)
  const X = (y, f) => riverCX(y) + f * riverHW(y); // f de -1 (margem esquerda) a 1 (direita)
  // percorre as marcas de uma faixa que desce com a correnteza: cada marca tem número fixo (n) e sorteio próprio
  const faixa = (passo, vel, sem, fn) => {
    const off = ((T * vel + sem * passo) % passo + passo) % passo;
    for (let n = Math.floor((ya - off) / passo) - 1, y; (y = n * passo + off) < yb; n++) {
      if (y < ya - 60 || _sob(P, cxm, y)) continue;
      fn(y, n);
    }
  };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // 1) o corpo da água: veios largos e macios, mais lentos perto da margem
  ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(130,180,210,0.06)';
  ctx.beginPath();
  for (let k = -3; k <= 3; k++) {
    const vel = fl * 0.65 * (1.15 - Math.abs(k) / 6);
    faixa(170, vel, hash2(k + 30, 7), (y, n) => {
      const f = k / 3.8 + (hash2(n, k + 40) - 0.5) * 0.12, L = 60 + hash2(n, k + 3) * 50, s = (hash2(n, k + 5) - 0.5) * 10;
      ctx.moveTo(X(y, f), y); ctx.quadraticCurveTo(X(y + L / 2, f) + s, y + L / 2, X(y + L, f), y + L);
    });
  }
  ctx.stroke();
  // 2) riscos finos de correnteza, curvinhos, em dois tons (uns mais fortes, outros quase sumindo)
  ctx.lineWidth = 1.2;
  for (const [cor, par] of [['rgba(215,235,246,0.10)', 0], ['rgba(225,242,250,0.22)', 1]]) {
    ctx.strokeStyle = cor; ctx.beginPath();
    for (let k = -5; k <= 5; k++) {
      const vel = fl * (1.3 - Math.abs(k) / 7), passo = 70 + (k & 1) * 26;
      faixa(passo, vel, hash2(k + 9, 3), (y, n) => {
        if (((n + k) & 1) !== par) return;
        const f = k / 5.8 + (hash2(n, k + 21) - 0.5) * 0.1, L = 12 + hash2(n, k) * 20, s = (hash2(n, k + 22) - 0.5) * 4;
        ctx.moveTo(X(y, f), y); ctx.quadraticCurveTo(X(y + L / 2, f) + s, y + L / 2, X(y + L, f), y + L);
      });
    }
    ctx.stroke();
  }
  // 3) ondinhas em "V" descendo atrás de pedrinhas (abrem e fecham devagar)
  ctx.strokeStyle = 'rgba(228,242,250,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    faixa(320, fl * 0.85, hash2(i, 52), (y, n) => {
      const f = (hash2(n, i + 51) - 0.5) * 1.3, x = X(y, f), w = 4 + hash2(n, i + 53) * 4 + Math.sin(T * 1.3 + n + i) * 1.2;
      ctx.moveTo(x - w, y - w * 0.8); ctx.quadraticCurveTo(x - w * 0.3, y - w * 0.1, x, y); ctx.quadraticCurveTo(x + w * 0.3, y - w * 0.1, x + w, y - w * 0.8);
    });
  }
  ctx.stroke();
  // 4) redemoinhos fixos no mapa, perto das margens, girando
  ctx.strokeStyle = 'rgba(215,235,245,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath();
  const PR = 230;
  for (let c = Math.floor(ya / PR); c * PR < yb; c++) {
    if (hash2(c, 60) < 0.35) continue;
    const y = c * PR + hash2(c, 61) * PR; if (y < ya || y > yb || _sob(P, cxm, y)) continue;
    const sd = hash2(c, 65) < 0.5 ? 1 : -1, x = X(y, sd * (0.72 + hash2(c, 62) * 0.14)), r = 5 + hash2(c, 63) * 4, a0 = T * (1.1 + hash2(c, 64) * 0.6) * sd;
    ctx.moveTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r * 0.75); ctx.ellipse(x, y, r, r * 0.75, 0, a0, a0 + 3.6);
    const a1 = a0 + 2.4; ctx.moveTo(x + Math.cos(a1) * r * 0.45, y + Math.sin(a1) * r * 0.34); ctx.ellipse(x, y, r * 0.45, r * 0.34, 0, a1, a1 + 3.2);
  }
  ctx.stroke();
  // 5) marolinha batendo nas margens (linha macia que respira)
  ctx.strokeStyle = 'rgba(225,240,248,0.26)'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (const sd of [-1, 1]) {
    let first = true;
    for (let y = Math.floor(ya / 8) * 8; y <= yb; y += 8) {
      if (_sob(P, cxm, y)) { first = true; continue; }
      const x = riverCX(y) + sd * (riverHW(y) - 4 - (1 + Math.sin(y * 0.07 - T * 1.8 + sd)) * 2);
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
  for (let i = 0; i < 10; i++) {
    faixa(1100, fl * 0.5, hash2(i, 72), (y, n) => {
      const f = (hash2(n, i + 71) - 0.5) * 1.4, x = X(y, f) + Math.sin(T * 0.7 + i + n) * 3, a = T * 0.25 + i + n;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = (i + n) % 3 ? 'rgba(70,90,40,0.85)' : 'rgba(92,64,38,0.85)';
      if ((i + n) % 3) { ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.2, 0, 0, TAU); ctx.fill(); } else ctx.fillRect(-4, -0.6, 8, 1.2);
      ctx.restore();
    });
  }
  // 8) brilho da lua piscando, preso ao mapa e descendo junto com a água
  ctx.fillStyle = 'rgb(235,245,255)';
  for (let i = 0; i < 6; i++) {
    faixa(140, fl * 0.8, hash2(i, 77), (y, n) => {
      const ph = (T * 0.7 + hash2(n, i + 5) * 9) % 3; if (ph > 0.9) return;
      const x = X(y, (hash2(n, i + 13) - 0.5) * 1.5), a = Math.sin(ph / 0.9 * Math.PI);
      ctx.globalAlpha = a * 0.55; ctx.fillRect(x - 3, y - 0.6, 6, 1.2); ctx.fillRect(x - 1.2, y + 1.6, 2.4, 1);
    });
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
// ---------- a onda chegando no carro parado na areia ----------
// sem batida: o carro fica por cima da água e a onda bate nele, levantando espuminha em volta
Agua.espuma = [];
// y da ponta da água em x (mesma conta de Agua.mar); null onde não é praia
Agua.pontaY = function (x) {
  if (!this.trechos || x < ORLA_X0 + 40) return null;
  let dentro = false; for (const [a0, a1] of this.trechos) if (x >= a0 && x <= a1) { dentro = true; break; }
  if (!dentro) return null;
  const T = Game.time, B = this.beira, f = x / 20, i = Math.floor(f), t = f - i;
  const by = lerp(B[i] || SEA_Y, B[i + 1] || SEA_Y, t);
  const p = ((T / 8 + Math.sin(x * 0.0021) * 0.35 + Math.sin(x * 0.0007 + 1.3) * 0.2) % 1 + 1) % 1, R = 26 + Math.sin(x * 0.013) * 6;
  let fr = 0;
  if (p >= 0.55 && p < 0.72) fr = -R * Math.sin((p - 0.55) / 0.17 * Math.PI / 2);
  else if (p >= 0.72) { const u = (p - 0.72) / 0.28; fr = -R * (1 - u * u * (3 - 2 * u)); }
  return { y: by + fr, subindo: p >= 0.55 && p < 0.72 };
};
Agua.atualiza = function (dt) {
  for (const f of this.espuma) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= Math.exp(-3 * dt); f.vy *= Math.exp(-3 * dt); }
  if (this.espuma.length) this.espuma = this.espuma.filter((f) => f.t < f.vida);
  if (!player || Game.state !== 'playing' || player.y < SAND_Y - 80 || Settings.quality === 'baixa') return;
  // o ponto do carro mais perto do mar (embaixo) e a água chegando nele
  const c = Math.cos(player.a), s = Math.sin(player.a), hl = player.m.L / 2, hw = player.m.W / 2;
  let fundo = -1e9, fx = player.x;
  for (const [u, v] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw]]) { const y = player.y + s * u + c * v; if (y > fundo) { fundo = y; fx = player.x + c * u - s * v; } }
  const P = this.pontaY(player.x); if (!P) return;
  const molhado = P.y < fundo - 2;
  if (molhado && P.subindo && !this.bateu && Game.time - (this.bateuT || -9) > 3) {
    this.bateu = true; this.bateuT = Game.time;
    const n = 26;
    for (let k = 0; k < n; k++) {
      const u = (k / (n - 1) - 0.5) * 2; // ao longo do lado do carro que olha para o mar
      const bx = lerp(player.x - Math.abs(c) * hl - Math.abs(s) * hw, player.x + Math.abs(c) * hl + Math.abs(s) * hw, (u + 1) / 2);
      const by = fundo + rnd(-2, 3);
      this.espuma.push({ x: bx + rnd(-3, 3), y: by, vx: rnd(-22, 22), vy: rnd(-70, -25), r: rnd(1.2, 2.8), t: 0, vida: rnd(0.7, 1.4) });
    }
    for (let k = 0; k < 10; k++) { const a = rnd(0, TAU); this.espuma.push({ x: player.x + Math.cos(a) * hl, y: player.y + Math.sin(a) * hw, vx: Math.cos(a) * rnd(15, 35), vy: Math.sin(a) * rnd(10, 25), r: rnd(1, 2.2), t: 0, vida: rnd(0.9, 1.6) }); }
    if (AudioSys.ok) AudioSys.noise(0.7, 900, 0.6, 0.06, 'ambient', 'bandpass');
  }
  if (!molhado) this.bateu = false;
  this.molhaCarro = molhado ? Math.min(1, (this.molhaCarro || 0) + dt * 3) : Math.max(0, (this.molhaCarro || 0) - dt * 1.2);
};
// espuma só onde a água está de fato encostando, seguindo o desenho do carro (carroceria e rodas: roda tala larga
// aparece para fora e a espuma contorna ela também). Feito numa telinha à parte: contorno largo menos o carro, recortado pela água.
Agua.contornoMolhado = function (ctx) {
  const m = player.m, K = carKit(player.car.id), Q = 3, S = Math.ceil(m.L + 26), N = S * Q;
  const cv = this._cv || (this._cv = document.createElement('canvas'));
  if (cv.width !== N) { cv.width = cv.height = N; }
  const g = cv.getContext('2d'), x0 = player.x - S / 2, y0 = player.y - S / 2, T = Game.time;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, N, N);
  // silhueta do carro (mesma conta de drawCar: rodas com a largura do kit)
  const hl = m.L / 2, hw = m.W / 2, wl = m.L * 0.2, xf = hl - m.L * 0.215, xr = -hl + m.L * 0.2;
  const tw = K && K.wheels === 'tala' ? 6.6 : 5, wy = K && K.low ? 2.4 : 1.6, tww = K && K.low ? tw * 0.82 : tw;
  const forma = (fn) => {
    g.save(); g.setTransform(Q, 0, 0, Q, 0, 0); g.translate(S / 2, S / 2); g.rotate(player.a);
    fn(bodyPath(m));
    const rodas = new Path2D();
    for (const x of [xf, xr]) for (const sy of [-1, 1]) rodas.rect(x - wl / 2, sy * (hw - wy) - tww / 2, wl, tww);
    fn(rodas);
    g.restore();
  };
  // contorno: um largo e macio e um fino mais forte, que mexem um pouco (água batendo)
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = 'rgba(235,245,250,0.4)'; g.lineWidth = 6 + Math.sin(T * 5) * 1.2; forma((p) => g.stroke(p));
  g.strokeStyle = 'rgba(248,252,255,0.9)'; g.lineWidth = 3 + Math.sin(T * 7 + 1) * 0.6; forma((p) => g.stroke(p));
  // tira o que ficou em cima do carro: a espuma só fica do lado de fora
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; forma((p) => g.fill(p));
  // e só onde a água chegou (da ponta da onda para o lado do mar)
  g.globalCompositeOperation = 'destination-in'; g.setTransform(Q, 0, 0, Q, -x0 * Q, -y0 * Q);
  g.beginPath(); g.moveTo(x0 - 2, y0 + S + 2);
  for (let x = x0 - 2; x <= x0 + S + 2; x += 3) { const P = this.pontaY(x); g.lineTo(x, P ? P.y + Math.sin(x * 0.4 + T * 3) * 0.6 : y0 + S + 4); }
  g.lineTo(x0 + S + 2, y0 + S + 2); g.closePath(); g.fill();
  g.globalCompositeOperation = 'source-over'; g.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = this.molhaCarro; ctx.drawImage(cv, x0, y0, S, S); ctx.globalAlpha = 1;
};
// espuminha e a água lambendo o pneu (desenhado por cima do carro)
Agua.respingosCarro = function (ctx) {
  if (!player || (!this.espuma.length && !(this.molhaCarro > 0.02))) return;
  ctx.save();
  if (this.molhaCarro > 0.02) this.contornoMolhado(ctx);
  ctx.fillStyle = '#f4fafd';
  for (const f of this.espuma) { ctx.globalAlpha = 0.85 * (1 - f.t / f.vida); ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 + f.t * 0.8), 0, TAU); ctx.fill(); }
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
  this.rio(ctx, view);
  if (player && Game.state !== 'menu' && player.y > SAND_Y - 120) { // o carro fica por cima da onda: recorta o carro da espuma do luar
    const c = Math.cos(player.a), s = Math.sin(player.a), hl = player.m.L / 2 + 1, hw = player.m.W / 2 + 1, P = [[hl, hw], [-hl, hw], [-hl, -hw], [hl, -hw]];
    ctx.beginPath(); ctx.rect(view.x0 - 50, view.y0 - 50, view.x1 - view.x0 + 100, view.y1 - view.y0 + 100);
    P.forEach(([u, v], i) => { const x = player.x + c * u - s * v, y = player.y + s * u + c * v; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.closePath(); ctx.clip('evenodd');
  }
  this.mar(ctx, view, true);
  ctx.restore();
  if (this.espuma.length) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#eef6fa'; for (const f of this.espuma) { ctx.globalAlpha = 0.45 * (1 - f.t / f.vida); ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 + f.t * 0.8), 0, TAU); ctx.fill(); } ctx.restore(); }
};

// ---------- entrou inteiro no mar: escurece suave, espirra água e o carro volta para a areia ----------
const Praia = { t: 0, D: 1.3, feito: false };
Praia.comeca = function () {
  this.t = this.D; this.feito = false;
  for (let k = 0; k < 30; k++) { const a = rnd(0, TAU); Agua.espuma.push({ x: player.x + Math.cos(a) * rnd(4, 20), y: player.y + Math.sin(a) * rnd(3, 14), vx: Math.cos(a) * rnd(20, 60), vy: Math.sin(a) * rnd(15, 45) - 20, r: rnd(1.2, 3), t: 0, vida: rnd(0.8, 1.5) }); }
  if (AudioSys.ok) { AudioSys.noise(0.9, 700, 0.5, 0.12, 'ambient', 'bandpass'); AudioSys.noise(0.4, 2400, 0.8, 0.05, 'ambient', 'highpass', 0.1); }
};
Praia.update = function (dt) {
  if (!player) return;
  // contagem antes de voltar: "Voltando em 3, 2, 1, 0"; se o carro sair da água, cancela
  if (!this.t) {
    const fora = !player.inWater() || player.y < SAND_Y - 40 || (player.agua || 0) < 0.5; // saiu (ou ficou raso): cancela
    if (this.naAgua && !fora) {
      if (this.conta === undefined) { this.conta = 3.99; this.mostraConta(3); } // aparece na hora
      const ant = Math.floor(this.conta); this.conta -= dt; const n = Math.floor(Math.max(0, this.conta));
      if (n !== ant || !this.el) this.mostraConta(n);
      if (this.conta <= 0) { this.conta = undefined; this.escondeConta(); this.comeca(); }
    } else if (this.conta !== undefined && fora) { this.conta = undefined; this.escondeConta(); }
    this.naAgua = false;
    return;
  }
  this.t = Math.max(0, this.t - dt);
  if (!this.feito && this.t < this.D / 2) { // meio da animação (tela escura): põe o carro na areia, de frente para a cidade
    this.feito = true;
    const B = Agua.beira, i = Math.round(player.x / 20), yb = (B && B[i]) || SEA_Y;
    player.x = clamp(player.x, ORLA_X0 + 60, WORLD_W - 260); player.y = yb - 48; player.a = -Math.PI / 2;
    player.vx = player.vy = 0; player.spin = 0; Cam.x = player.x; Cam.y = player.y; Agua.molhaCarro = 0;
  }
};
// escurecimento suave por cima de tudo
Praia.desenha = function (ctx, W, H) {
  if (!this.t) return;
  const p = 1 - this.t / this.D, a = Math.sin(p * Math.PI);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(4,10,20,${(a * 0.92).toFixed(3)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
};

Praia.mostraConta = function (n) {
  if (!this.el) { this.el = document.createElement('div'); this.el.id = 'praia-conta'; document.body.appendChild(this.el); }
  this.el.innerHTML = '<span>Voltando em</span><b>' + n + '</b>'; this.el.classList.add('on');
  try { AudioSys.tone(n ? 660 : 990, 0.12, 'sine', 0.06, 'ui'); } catch (e) {}
};
Praia.escondeConta = function () { if (this.el) this.el.classList.remove('on'); };

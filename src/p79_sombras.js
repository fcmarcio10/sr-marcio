/* ============================ SOL E SOMBRAS FIÉIS (nov/2026) ============================
   O sol (pela hora do dia) decide a direção e o tamanho de todas as sombras: cada coisa projeta a sombra no
   formato dela — árvore (silhueta da copa + tronco), poste, semáforo, outdoor, ponto de ônibus, orelhão,
   cobertura do posto, bancos, mesas, lixeiras, hidrantes, cones, pessoas (pernas andando, corpo, braços e
   cabeça), bichos (corpo, patas e cabeça) e carros (contorno da carroceria). O que é derrubado ou quebrado
   perde a sombra na hora (não fica mais "pintada" no chão). De noite as sombras vêm dos postes (p65).
   Todas as sombras do chão de um quadro vão num caminho só e são pintadas de uma vez: onde duas se cruzam
   não fica mais escuro (como na vida real). */
const Sol = { a: 0, dx: 0, dy: 0 };
const SOMBRA_COR = (a) => `rgba(16,20,40,${Math.min(0.85, a).toFixed(3)})`; // sombra azulada (o céu clareia a sombra)
// Ultra: sombra 45% mais forte e com borda macia (meia-sombra em volta, como sombra de sol de verdade)
const SOMBRA_K = () => (ultraQ() ? 1.45 : 1);
function sombraFill(ctx, P, a) { if (ultraQ()) { ctx.lineJoin = 'round'; ctx.lineWidth = 3.2; ctx.strokeStyle = SOMBRA_COR(a * 0.32); ctx.stroke(P); } ctx.fillStyle = SOMBRA_COR(a); ctx.fill(P); }
Sol.calc = function () {
  if (typeof Dia === 'undefined' || Settings.quality === 'baixa') { this.a = 0; return; }
  const h = Dia.hora(), th = clamp(Math.PI * (h - 6) / 12, 0.08, Math.PI - 0.08);
  const comp = 0.32 + 1.25 * Math.pow(1 - Math.sin(th), 1.4); // de manhã cedo e no fim da tarde, sombras compridas
  this.dx = -Math.cos(th) * comp; this.dy = 0.5 * comp; this.a = Dia.sol > 0.04 ? Dia.sol : 0;
};
// ---- formas (tudo em coordenadas do mundo, somado num Path2D) ----
function sbSeg(P, x1, y1, x2, y2, w) { // traço grosso como polígono (para ir no mesmo caminho)
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
  P.moveTo(x1 + nx, y1 + ny); P.lineTo(x2 + nx, y2 + ny); P.lineTo(x2 - nx, y2 - ny); P.lineTo(x1 - nx, y1 - ny); P.closePath();
}
function sbCirc(P, x, y, r) { P.moveTo(x + r, y); P.arc(x, y, r, 0, TAU); }
function sbElip(P, x, y, rx, ry, a) { P.moveTo(x + Math.cos(a) * rx, y + Math.sin(a) * rx); P.ellipse(x, y, rx, ry, a, 0, TAU); }
// pegada (polígono) arrastada pela sombra: desenha na base, no meio e na ponta (fica uma forma comprida e cheia)
function sbArrasta(P, pts, sx, sy) {
  for (const t of [0, 0.34, 0.67, 1]) { pts.forEach((p, i) => (i ? P.lineTo(p[0] + sx * t, p[1] + sy * t) : P.moveTo(p[0] + sx * t, p[1] + sy * t))); P.closePath(); }
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; P.moveTo(a[0], a[1]); P.lineTo(b[0], b[1]); P.lineTo(b[0] + sx, b[1] + sy); P.lineTo(a[0] + sx, a[1] + sy); P.closePath(); }
}
function sbRet(cx, cy, L, W, a) { const c = Math.cos(a), s = Math.sin(a); return [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]].map(([u, v]) => [cx + c * u - s * v, cy + s * u + c * v]); }
// pessoa: pernas (andando), quadril, tronco, braços balançando e cabeça, esticada na direção da sombra
function sbPessoa(P, an, sx, sy) {
  const x = an.x, y = an.y, L = Math.hypot(sx, sy) || 0.001, ux = sx / L, uy = sy / L, nx = -uy, ny = ux;
  const hx = Math.cos(an.a), hy = Math.sin(an.a), pk = passoK(an), danca = !pk && ((an.dance && an.v < 1) || an.danceUntil > Game.time);
  const sw = pk ? Math.sin(an.phase) * Math.min(1.15, pk) : danca ? Math.sin(Game.time * 9 + (an.seed || 0) * 20) * 1.1 : 0; // mesmo passo (e mesma dança) do desenho
  const at = (t, w) => [x + sx * t + nx * w, y + sy * t + ny * w];
  // pés (um para frente e outro para trás quando anda) e pernas até o quadril
  const q = at(0.46, 0);
  for (const k of [-1, 1]) { const fx = x + hx * sw * 2.2 * k + nx * k * 0.9, fy = y + hy * sw * 2.2 * k + ny * k * 0.9; sbSeg(P, fx, fy, q[0] + nx * k * 1, q[1] + ny * k * 1, 1.7); }
  // tronco (mais largo nos ombros)
  const a1 = at(0.44, -1.7), a2 = at(0.44, 1.7), b1 = at(0.8, 2.4), b2 = at(0.8, -2.4);
  P.moveTo(a1[0], a1[1]); P.lineTo(a2[0], a2[1]); P.lineTo(b1[0], b1[1]); P.lineTo(b2[0], b2[1]); P.closePath();
  // braços (balançam ao contrário das pernas)
  for (const k of [-1, 1]) { const o = at(0.78, 2.5 * k), m = at(0.5, 3 * k); sbSeg(P, o[0], o[1], m[0] - hx * sw * 1.6 * k, m[1] - hy * sw * 1.6 * k, 1.2); }
  // pescoço e cabeça
  const pc = at(0.86, 0), cb = at(0.93, 0); sbSeg(P, q[0], q[1], pc[0], pc[1], 1.2); sbCirc(P, cb[0], cb[1], 1.9);
  sbElip(P, x, y, 2.6, 1.6, an.a); // pé no chão (contato)
}
// bichos: corpo, patas, pescoço e cabeça
const SB_BICHO = { cow: [11, 13, 4.5, 5], horse: [13, 13, 3.75, 5.5], dog: [4.5, 4.8, 1.8, 2.2], capybara: [4, 5.6, 2.45, 2], chicken: [3, 2.3, 1.9, 1.15] }; // altura, comprimento, largura e cabeça no mesmo tamanho do desenho (ESCALA_BICHO)
function sbBicho(P, an, sx, sy, Hk) {
  const D = SB_BICHO[an.type]; if (!D) return;
  const [H, L, W, cab] = D, x = an.x, y = an.y, hx = Math.cos(an.a), hy = Math.sin(an.a), px = -hy, py = hx;
  const bx = x + sx * H * Hk * 0.62, by = y + sy * H * Hk * 0.62, sw = passoK(an) ? Math.sin(an.phase) * 0.35 * Math.min(1, passoK(an)) : 0;
  sbElip(P, bx, by, L * 0.55, W * 0.55, an.a); // corpo
  if (an.type !== 'chicken') for (const [u, v] of [[0.38, 1], [0.38, -1], [-0.38, 1], [-0.38, -1]]) {
    const fx = x + hx * L * (u + sw * Math.sign(u * v)) * 0.55 + px * v * W * 0.4, fy = y + hy * L * (u + sw * Math.sign(u * v)) * 0.55 + py * v * W * 0.4;
    sbSeg(P, fx, fy, bx + hx * L * u * 0.5 + px * v * W * 0.3, by + hy * L * u * 0.5 + py * v * W * 0.3, an.type === 'dog' ? 0.9 : 1.6);
  }
  const graze = an.state === 'graze', ch = graze ? 0.3 : 0.85;
  const kx = x + hx * L * 0.62 + sx * H * Hk * ch, ky = y + hy * L * 0.62 + sy * H * Hk * ch;
  sbSeg(P, bx + hx * L * 0.4, by + hy * L * 0.4, kx, ky, cab * 0.55); sbElip(P, kx + hx * cab * 0.4, ky + hy * cab * 0.4, cab * 0.7, cab * 0.45, an.a);
  if (an.type === 'cow' || an.type === 'horse') { const tx = bx - hx * L * 0.55, ty = by - hy * L * 0.55; sbSeg(P, tx, ty, tx - hx * 3 + sx * 1.5, ty - hy * 3 + sy * 1.5, 0.8); } // rabo
}
// objetos baixos do chão (bancos, mesas, lixeiras...): pegada e altura
const SB_PROP = { bench: [26, 8, 5], table: [12, 12, 7, 1], bin: [6, 6, 8, 1], hydrant: [5, 5, 6, 1], cone: [5, 5, 6, 1], bollard: [4, 4, 6, 1], orelhao: [8, 8, 14, 1], pot: [10, 10, 6, 1], tires: [12, 12, 4, 1], scarecrow: [14, 3, 14], goal: [6, 30, 12], barrier: [28, 4, 6], cart: [16, 9, 10], well: [14, 14, 8, 1], trough: [22, 7, 5] };

const Sombras = {};
// sombras no chão: pessoas, bichos e objetos baixos (debaixo deles)
Sombras.chao = function (ctx, view) {
  if (!Sol.a) return;
  const P = new Path2D(), sx = Sol.dx, sy = Sol.dy;
  for (const an of Animals.list) {
    if (an.morto || an.oculto || an.type === 'owl' || !inView(view, an.x, an.y, 60)) continue;
    if (an.type === 'person') sbPessoa(P, an, sx * 14 * (an.esc || 1), sy * 14 * (an.esc || 1)); else sbBicho(P, an, sx, sy, 1); // sombra da altura de cada um
  }
  if (Act.ride && Act.ride.stage === 'pickup' && inView(view, Act.ride.pick.x, Act.ride.pick.y, 60)) sbPessoa(P, Embarque.esperando(Act.ride), sx * 14, sy * 14);
  // quem não está na lista de pedestres: boleiros da pelada, gente dos eventos e passageiro entrando ou saindo do carro
  const outros = (o) => { if (o && o.x !== undefined && inView(view, o.x, o.y, 60)) sbPessoa(P, o, sx * 14, sy * 14); };
  if (Settings.quality !== 'baixa') for (const G of Peladas.list) if (inView(view, G.P.cx, G.P.cy, 400)) {
    for (const p of G.pl) outros(p);
    const bz = G.bz || 0; sbCirc(P, G.bx + sx * (2 + bz * 0.9), G.by + sy * (2 + bz * 0.9), 2.3); // a bola no ar joga a sombra mais longe
  }
  if (Events.cur) for (const o of Events.pessoas()) outros(o);
  for (const w of Embarque.lista) if (w.alpha > 0.5) outros(w);
  // corpo caído: sombra deitada, curtinha (rente ao chão)
  for (const an of Atropelo.mortos) if (an.mortoT < 4 && inView(view, an.x, an.y, 40)) sbElip(P, an.x + sx * 1.2, an.y + sy * 1.2, 7, 3, an.ca);
  for (const p of World.props || []) {
    const D = SB_PROP[p.type]; if (!D || p.broken || !inView(view, p.x, p.y, 50)) continue;
    const [L, W, H, redondo] = D;
    if (redondo) { for (const t of [0, 0.5, 1]) sbCirc(P, p.x + sx * H * t, p.y + sy * H * t, L / 2); sbSeg(P, p.x, p.y, p.x + sx * H, p.y + sy * H, L * 0.9); }
    else sbArrasta(P, sbRet(p.x, p.y, L, W, p.a || 0), sx * H, sy * H);
  }
  // coisas dos lotes e obras (paredes, cantos de tijolo, pilhas, cercas, placas): somem quando quebram
  for (const q of World.sombrasLote || []) {
    if ((q.obj && q.obj.broken) || q.H <= 0) continue;
    const x = q.c ? q.c[0] : q.pts[0][0], y = q.c ? q.c[1] : q.pts[0][1]; if (!inView(view, x, y, 90)) continue;
    if (q.c) { for (const t of [0, 0.5, 1]) sbCirc(P, q.c[0] + sx * q.H * t, q.c[1] + sy * q.H * t, q.c[2]); }
    else sbArrasta(P, q.pts, sx * q.H, sy * q.H);
  }
  ctx.save(); sombraFill(ctx, P, 0.34 * Sol.a * SOMBRA_K()); ctx.restore();
};
// sombras dos objetos altos (árvores, postes, semáforos, outdoors...): pintadas por cima do chão e dos carros
// (um carro embaixo de uma árvore fica na sombra dela); o próprio objeto é desenhado depois, por cima
Sombras.altos = function (ctx, view) {
  if (!Sol.a) return;
  const P = new Path2D(), sx = Sol.dx, sy = Sol.dy, q = [];
  rendGrid.query(view.x0 - 220, view.y0 - 220, view.x1 + 220, view.y1 + 220, q);
  ctx.save(); ctx.globalAlpha = Math.min(0.85, 0.36 * Sol.a * SOMBRA_K());
  for (const o of q) {
    if (o.down !== undefined || o.removed) continue; // derrubado ou arrancado: sem sombra
    switch (o.kind) {
      case 'tree': {
        const S = 64 * o.size * (o.type === 'bush' ? 0.55 : 1), H = o.h * 0.95, cx = o.x + sx * H, cy = o.y + sy * H;
        if (!inView(view, cx, cy, S)) break;
        ctx.drawImage(sombraArvore(o.type, o.v), cx - S / 2, cy - S / 2, S, S); // copa com o contorno dela
        if (o.type !== 'bush') sbSeg(P, o.x, o.y, o.x + sx * H * 0.75, o.y + sy * H * 0.75, 2.4 * o.size); // tronco
        break;
      }
      case 'lamp': {
        const H = o.h, ex = o.x + sx * H, ey = o.y + sy * H; sbSeg(P, o.x, o.y, ex, ey, 2.4);
        if (o.style === 'arm') { const ax = o.hx + sx * H, ay = o.hy + sy * H; sbSeg(P, ex, ey, ax, ay, 2); sbElip(P, ax, ay, 6, 3.4, Math.atan2(o.hy - o.y, o.hx - o.x)); }
        else sbCirc(P, ex, ey, 4);
        break;
      }
      case 'tlight': { const H = o.h, ex = o.x + sx * H, ey = o.y + sy * H; sbSeg(P, o.x, o.y, ex, ey, 2.2); const ax = o.hx + sx * H, ay = o.hy + sy * H; sbSeg(P, ex, ey, ax, ay, 2); sbArrasta(P, sbRet(ax, ay, 5, 12, o.a), sx * 3, sy * 3); break; }
      case 'billboard': {
        const c = Math.cos(o.rot || 0), s = Math.sin(o.rot || 0), pe = OD_PW * 0.3, H = o.h;
        for (const k of [-1, 1]) sbSeg(P, o.x + c * pe * k, o.y + s * pe * k, o.x + c * pe * k + sx * H, o.y + s * pe * k + sy * H, 2.6);
        const r = sbRet(o.x + sx * H, o.y + sy * H, OD_PW, 3, o.rot || 0); sbArrasta(P, r, sx * OD_PH * 0.9, sy * OD_PH * 0.9); // painel em pé
        break;
      }
      case 'busstop': { sbArrasta(P, sbRet(o.x + sx * o.h, o.y + sy * o.h, 46, 14, o.a), sx * 3, sy * 3); for (const k of [-19, 19]) sbSeg(P, o.x + Math.cos(o.a) * k, o.y + Math.sin(o.a) * k, o.x + Math.cos(o.a) * k + sx * o.h, o.y + Math.sin(o.a) * k + sy * o.h, 1.6); break; }
      case 'phone': { sbSeg(P, o.x, o.y, o.x + sx * o.h, o.y + sy * o.h, 1.8); sbCirc(P, o.x + sx * o.h, o.y + sy * o.h, 6); break; }
      case 'flood': { sbSeg(P, o.x, o.y, o.x + sx * o.h, o.y + sy * o.h, 2.6); break; }
      case 'canopy': { const H = o.h; P.moveTo(o.x0 + sx * H, o.y0 + sy * H); P.lineTo(o.x1 + sx * H, o.y0 + sy * H); P.lineTo(o.x1 + sx * H, o.y1 + sy * H); P.lineTo(o.x0 + sx * H, o.y1 + sy * H); P.closePath(); break; }
      case 'watertower': case 'silo': { const H = o.h || 60, r = o.r || 14; sbSeg(P, o.x, o.y, o.x + sx * H, o.y + sy * H, r * 1.6); sbCirc(P, o.x + sx * H, o.y + sy * H, r); break; }
    }
  }
  ctx.globalAlpha = 1; sombraFill(ctx, P, 0.36 * Sol.a * SOMBRA_K());
  ctx.restore();
};
// sombra do carro pelo sol: contorno fiel da carroceria, deslocada pela altura do carro (chamada em drawVehicle)
function sombraCarroSol(ctx, m, x, y, as, sq) {
  if (!Sol.a || Settings.quality === 'baixa') return;
  const H = m.kind === 'bus' ? 16 : m.kind === 'truck' ? 13 : m.kind === 'moto' ? 6 : 7;
  ctx.save(); ctx.fillStyle = SOMBRA_COR(0.34 * Sol.a * SOMBRA_K());
  for (const t of [0.45, 1]) { ctx.save(); ctx.translate(x + Sol.dx * H * t, y + Sol.dy * H * t); ctx.scale(1, 1 / sq); ctx.rotate(as); ctx.globalAlpha = t === 1 ? 1 : 0.55; if (m.kind === 'car') ctx.fill(bodyPath(m)); else { ctx.beginPath(); rrect(ctx, -m.L / 2, -m.W / 2, m.L, m.W, m.kind === 'moto' ? 3 : 5); ctx.fill(); } ctx.restore(); }
  ctx.restore();
}
// de noite, perto de poste: pessoa com a silhueta do corpo para longe da luz (no lugar da mancha redonda)
function sombraPessoaLuz(ctx, an, dx, dy, len, alpha) {
  const P = new Path2D(); sbPessoa(P, an, dx * len, dy * len);
  ctx.save(); ctx.fillStyle = `rgba(0,0,0,${alpha.toFixed(3)})`; ctx.fill(P); ctx.restore();
}

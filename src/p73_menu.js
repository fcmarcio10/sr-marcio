/* ============================ MENU INICIAL ANIMADO ============================
   No menu, o carro do jogador (modelo e cor da garagem) roda sozinho pelas ruas do centro, de farol aceso,
   virando nas esquinas por uma curva suave, e a câmera acompanha de longe com um movimento lento de cinema.
   Só visual: não tem colisão nem mexe no sorteio do mapa (usa Math.random só para escolher a próxima rua). */
const MenuCar = { on: false, pts: [], i: 0, f: 0, x: 0, y: 0, a: 0, v: 135, roll: 0, steer: 0, lean: 0 };
const MENU_AREA = { x0: 300, y0: 300, x1: 4400, y1: 5000 }; // centro e bairros em volta (asfalto, iluminado)
MenuCar.okEdge = (e) => e.T.asphalt && (e.T.id === 'street' || e.T.id === 'avenue') && !e.bridge &&
  Math.min(e.a.x, e.b.x) > MENU_AREA.x0 && Math.max(e.a.x, e.b.x) < MENU_AREA.x1 && Math.min(e.a.y, e.b.y) > MENU_AREA.y0 && Math.max(e.a.y, e.b.y) < MENU_AREA.y1;
MenuCar.comeca = function () {
  const ok = World.edges.filter(this.okEdge); if (!ok.length) { this.on = false; return; }
  // começa numa avenida do centro, perto de onde a câmera do menu nasce
  ok.sort((p, q) => Math.hypot((p.a.x + p.b.x) / 2 - 1756, (p.a.y + p.b.y) / 2 - 1260) - Math.hypot((q.a.x + q.b.x) / 2 - 1756, (q.a.y + q.b.y) / 2 - 1260));
  const e = ok[0];
  this.pts = []; this.i = 0; this.f = 0; this.no = e.b; this.ultima = e;
  this.trecho(e, e.a);
  while (this.pts.length < 200) this.estende();
  const c = carById(Profile.current || 'gou'); this.m = VMODELS[c.model] || VMODELS.quadrado; this.color = carCfg(c.id).color;
  this.kit = typeof carKit === 'function' ? carKit(c.id) : null;
  this.pos(); this.on = true;
};
// faixa da direita de uma rua, do nó "de" até o outro, cortando o cruzamento
MenuCar.faixa = function (e, de) {
  const para = e.a === de ? e.b : e.a, dx = Math.sign(para.x - de.x), dy = Math.sign(para.y - de.y);
  const off = e.T.lanes[e.T.lanes.length - 1], rx = -dy * off, ry = dx * off; // direita de quem anda (y para baixo)
  const r0 = (e.h ? de.hx : de.hy) || 30, r1 = (e.h ? para.hx : para.hy) || 30;
  return { de, para, dx, dy, rx, ry, p0: [de.x + dx * r0 + rx, de.y + dy * r0 + ry], p1: [para.x - dx * r1 + rx, para.y - dy * r1 + ry] };
};
MenuCar.trecho = function (e, de) {
  const F = this.faixa(e, de), L = Math.hypot(F.p1[0] - F.p0[0], F.p1[1] - F.p0[1]), n = Math.max(2, Math.ceil(L / 12));
  for (let k = 0; k <= n; k++) this.pts.push([lerp(F.p0[0], F.p1[0], k / n), lerp(F.p0[1], F.p1[1], k / n)]);
  this.no = F.para; this.ultima = e; this.ultF = F;
};
// escolhe a próxima rua no cruzamento (evita voltar) e liga as duas com uma curva
MenuCar.estende = function () {
  const n = this.no, sai = n.edges.filter((e) => e !== this.ultima && this.okEdge(e));
  const e = sai.length ? sai[Math.floor(Math.random() * sai.length)] : this.ultima;
  const A = this.ultF, B = this.faixa(e, n);
  // curva: do fim da faixa de chegada até o começo da faixa de saída, com o ponto de controle onde as duas faixas se cruzam
  const ctl = A.dx === -B.dx && A.dy === -B.dy ? [n.x, n.y] : (A.dx ? [B.p0[0], A.p1[1]] : [A.p1[0], B.p0[1]]);
  const m = 8;
  for (let k = 1; k < m; k++) { const t = k / m, u = 1 - t; this.pts.push([u * u * A.p1[0] + 2 * u * t * ctl[0] + t * t * B.p0[0], u * u * A.p1[1] + 2 * u * t * ctl[1] + t * t * B.p0[1]]); }
  this.trecho(e, n);
};
MenuCar.pos = function () {
  const P = this.pts, a = P[this.i], b = P[this.i + 1] || a;
  this.x = lerp(a[0], b[0], this.f); this.y = lerp(a[1], b[1], this.f);
  const c = P[Math.min(P.length - 1, this.i + 3)], ang = Math.atan2(c[1] - this.y, c[0] - this.x);
  if (Math.hypot(c[0] - this.x, c[1] - this.y) > 1) { let d = ang - this.a; d = Math.atan2(Math.sin(d), Math.cos(d)); this.steer = clamp(d * 2.5, -0.5, 0.5); this.a += d * 0.25; }
};
MenuCar.update = function (dt) {
  if (!this.on) return;
  // devagar nas curvas, mais solto na reta
  const P = this.pts, ahead = P[Math.min(P.length - 1, this.i + 6)], here = P[this.i];
  const curva = Math.abs(Math.atan2(Math.sin(Math.atan2(ahead[1] - here[1], ahead[0] - here[0]) - this.a), Math.cos(Math.atan2(ahead[1] - here[1], ahead[0] - here[0]) - this.a)));
  const alvo = curva > 0.3 ? 75 : 150; this.v = lerp(this.v, alvo, 1 - Math.exp(-1.5 * dt));
  let d = this.v * dt;
  while (d > 0) {
    const a = P[this.i], b = P[this.i + 1]; if (!b) break;
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 0.01, resto = (1 - this.f) * L;
    if (d < resto) { this.f += d / L; d = 0; } else { d -= resto; this.i++; this.f = 0; }
  }
  if (P.length - this.i < 120) this.estende();
  if (this.i > 300) { this.pts.splice(0, 200); this.i -= 200; }
  this.roll += this.v * dt * 0.35; this.lean = lerp(this.lean, clamp(-this.steer * 0.8, -1, 1), 1 - Math.exp(-5 * dt));
  this.pos();
};
MenuCar.desenha = function (ctx, view) {
  if (!this.on || !inView(view, this.x, this.y, 80)) return;
  drawVehicle(ctx, this.m, this.color, this.x, this.y, this.a, { steer: this.steer, roll: this.roll, lean: this.lean, kit: this.kit });
};

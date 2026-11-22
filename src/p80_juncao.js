/* ============================ ASFALTO ENCONTRANDO A TERRA (0.2.0) ============================
   Onde uma estrada de terra (ou estradinha) chega no asfalto, o encontro deixa de ser um corte reto:
   - beira do asfalto quebrada, com pedaços soltos na terra e um buraco na boca da estrada;
   - terra espalhada por cima do asfalto (tapa a faixa branca da beira) e pedrinhas;
   - rastro de pneu sujo de terra saindo da estrada e entrando no asfalto (reto e fazendo a curva);
   - com chuva (desenhado por cima na hora, conforme o tanto de chuva): barro escuro brilhando nos rastros e poça na boca.
   Tudo escolhido por sorteio próprio de cada encontro (não mexe no sorteio do mapa). */
const Juncao = { lista: [] };
Juncao.monta = function () {
  const L = this.lista; L.length = 0;
  // cruzamentos onde chega asfalto e terra
  for (const n of World.nodes) {
    if (!n.edges.some((e) => e.T.asphalt)) continue;
    for (const d of n.edges) {
      if (d.T.asphalt) continue;
      const o = d.a === n ? d.b : d.a, l = Math.hypot(o.x - n.x, o.y - n.y) || 1, ux = (o.x - n.x) / l, uy = (o.y - n.y) / l;
      const ext = Math.abs(ux) > Math.abs(uy) ? n.hx : n.hy;
      this.add(n.x + ux * ext, n.y + uy * ext, ux, uy, d.hw);
    }
  }
  // estradinhas dos lotes que saem da beira do asfalto
  for (const s of World.estradinhas || []) if (s.boca) this.add(s.boca[0], s.boca[1], s.boca[2], s.boca[3], s.boca[4], true);
  for (const J of L) bake(J.x - 170, J.y - 170, J.x + 170, J.y + 170, 5.6, (g) => this.desenha(g, J));
};
Juncao.add = function (x, y, ux, uy, dw, estreita) {
  const R = mulberry32(((x * 7.31) | 0) * 131 + ((y * 3.17) | 0)), J = { x, y, ux, uy, dw, R, estreita: !!estreita };
  // rastros (calculados uma vez: o desenho seco e o molhado usam os mesmos)
  J.rastros = [];
  // continuam as trilhas de pneu da própria estrada de terra (a 11 e 25 do meio)
  const pistas = estreita ? [0] : [-18, 18];
  for (const py of pistas) for (const w of [-7, 7]) {
    const comp = 60 + R() * 90, curva = R() < 0.55 ? (R() < 0.5 ? -1 : 1) * (25 + R() * 50) : 0;
    J.rastros.push({ y0: py + w + (R() - 0.5) * 2, comp, curva, a: 0.35 + R() * 0.3 });
  }
  J.poca = R() < 0.45 ? { x: 12 + R() * 14, y: (R() - 0.5) * dw, rx: 7 + R() * 6, ry: 4 + R() * 3 } : null; // buraco na boca só em parte dos encontros
  // poeira de terra levada para o asfalto: manchas macias num leque que vai afinando para dentro da pista
  J.manchas = []; const ab = estreita ? 5 : 10;
  for (let i = 0; i < (estreita ? 14 : 26); i++) { const cx = -Math.pow(R(), 1.3) * (estreita ? 40 : 62), hf = (dw + ab) * (1 - 0.45 * -cx / 62); J.manchas.push({ x: cx, y: (R() - 0.5) * 2 * hf, r: 8 + R() * 16, a: 0.3 * (1 + cx / 66) }); }
  this.lista.push(J);
};
// caminho de um rastro: começa dentro da terra e vai entrando no asfalto (x < 0), podendo virar para um lado
Juncao.rastro = function (P, r) {
  P.moveTo(34, r.y0); P.lineTo(0, r.y0);
  P.quadraticCurveTo(-r.comp * 0.55, r.y0, -r.comp, r.y0 + r.curva);
};
Juncao.desenha = function (g, J) {
  const R = mulberry32(((J.x * 5.1) | 0) + ((J.y * 9.7) | 0) * 7), dw = J.dw, ux = J.ux, uy = J.uy;
  // pontos no sistema do encontro (+x = para dentro da terra) levados para o mundo: assim a textura de terra e de asfalto
  // fica alinhada com a da estrada (sem emenda)
  const W = (x, y) => [J.x + ux * x - uy * y, J.y + uy * x + ux * y];
  const poli = (pts, fechar) => { g.beginPath(); pts.forEach((p, i) => { const q = W(p[0], p[1]); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); if (fechar !== false) g.closePath(); };
  const f1 = R() * 6, f2 = R() * 6, onda = (t, a, j) => Math.sin(t * 0.21 + f1) * a + Math.sin(t * 0.53 + f2) * a * 0.5 + (R() - 0.5) * a * (j === undefined ? 0.6 : j);
  const LQ = J.estreita ? 22 : 34, AB = J.estreita ? 5 : 10, HB = dw + AB;
  // 1) a estrada de terra abre em leque quando chega no asfalto (as rodas alargam a boca), comendo o mato e o acostamento;
  //    só as abas dos lados: o miolo continua sendo a própria estrada (com as trilhas dela, sem corte)
  g.fillStyle = pat(g, 'dirt');
  for (const lado of [-1, 1]) {
    const pts = [[-1, lado * (dw - 4)]];
    for (let x = 0; x <= LQ; x += 3) { const k = Math.pow(1 - x / LQ, 2); pts.push([x, lado * (dw + AB * k + onda(x + (lado + 1) * 20, 1.6, 0.25) * k)]); }
    pts.push([LQ + 2, lado * (dw - 4)]); poli(pts); g.fill();
  }
  // 2) beira do asfalto esfarelada: a terra entra em mordidas irregulares (mais fundas onde as rodas passam)
  const borda = [];
  for (let y = -HB; y <= HB + 0.1; y += 3) { const sino = Math.exp(-Math.pow(y / (dw * 0.9), 2)); borda.push([-(J.estreita ? 0.5 : 1) - (J.estreita ? 2 : 5) * sino * (0.7 + R() * 0.4) - Math.max(0, onda(y, 1.6, 0.35)), y]); }
  g.fillStyle = pat(g, 'dirt'); poli([[1, -HB - 1]].concat(borda, [[1, HB + 1]])); g.fill();
  g.strokeStyle = 'rgba(18,18,20,0.2)'; g.lineWidth = 0.9; g.lineJoin = 'round'; poli(borda.map((p) => [p[0] - 0.7, p[1]]), false); g.stroke(); // quina do asfalto quebrado
  g.strokeStyle = 'rgba(160,128,90,0.28)'; g.lineWidth = 1.6; poli(borda.map((p) => [p[0] + 1.2, p[1]]), false); g.stroke(); // terra solta encostada
  // 3) pedaços de asfalto soltos na terra
  if (!J.estreita) for (let i = 0; i < 4; i++) {
    const x = 3 + R() * 12, y = (R() - 0.5) * 2 * dw, s = 1 + R() * 1.6, a0 = R() * 6, pts = [];
    for (let k = 0; k < 5; k++) { const an = a0 + k * 1.26, rr = s * (0.6 + R() * 0.5); pts.push([x + Math.cos(an) * rr, y + Math.sin(an) * rr]); }
    g.fillStyle = 'rgba(0,0,0,0.3)'; poli(pts.map((p) => [p[0] + 0.7, p[1] + 0.7])); g.fill();
    g.fillStyle = pat(g, 'asphalt'); poli(pts); g.fill();
  }
  // 4) daqui para baixo, desenho no sistema do encontro (manchas, rastros e pedrinhas não têm textura)
  g.save(); g.translate(J.x, J.y); g.rotate(Math.atan2(uy, ux));
  for (const m of J.manchas) { // poeira de terra levada para o asfalto
    const gr = g.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r); gr.addColorStop(0, `rgba(128,98,66,${m.a.toFixed(3)})`); gr.addColorStop(1, 'rgba(128,98,66,0)');
    g.fillStyle = gr; g.fillRect(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
  }
  // rastros de pneu sujos de terra saindo das trilhas da estrada e entrando na pista
  g.lineCap = 'round';
  for (const r of J.rastros) {
    const P = new Path2D(); this.rastro(P, r);
    const gr = g.createLinearGradient(30, 0, -r.comp, 0); gr.addColorStop(0, `rgba(96,70,44,${(r.a * 0.85).toFixed(3)})`); gr.addColorStop(0.35, `rgba(96,70,44,${(r.a * 0.6).toFixed(3)})`); gr.addColorStop(1, 'rgba(96,70,44,0)');
    g.strokeStyle = gr; g.lineWidth = 3; g.stroke(P);
    g.fillStyle = 'rgba(70,50,30,0.25)'; for (let x = -2; x > -r.comp * 0.3; x -= 3.5) g.fillRect(x, r.y0 + (x / -r.comp) * (x / -r.comp) * r.curva - 1.4, 1.1, 2.8); // gomos do pneu
  }
  // pedrinhas e cascalho espalhados, mais juntos na beira
  for (let i = 0; i < 54; i++) { const x = 14 - Math.pow(R(), 1.6) * 60, y = (R() - 0.5) * 2 * (HB + 4) * (1 - Math.max(0, -x) / 110), s = 0.6 + R() * 1.1; g.fillStyle = R() < 0.5 ? 'rgba(150,140,128,0.8)' : 'rgba(110,86,60,0.8)'; g.fillRect(x, y, s, s); }
  const p = J.poca; // buraco na boca da estrada de terra (borda clara e fundo escuro)
  if (p) { g.fillStyle = 'rgba(40,28,18,0.45)'; g.beginPath(); g.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(170,140,100,0.3)'; g.lineWidth = 1.1; g.beginPath(); g.ellipse(p.x + 0.6, p.y + 0.6, p.rx, p.ry, 0, 0.2, Math.PI - 0.2); g.stroke(); }
  g.restore();
};
// chuva: barro escuro e brilhando nos rastros, terra virando lama no asfalto e poça no buraco (por cima, na hora)
Juncao.molhado = function (ctx, view) {
  const w = Weather.wet; if (w < 0.05 || Settings.quality === 'baixa') return;
  for (const J of this.lista) {
    if (J.x < view.x0 - 170 || J.x > view.x1 + 170 || J.y < view.y0 - 170 || J.y > view.y1 + 170) continue;
    ctx.save(); ctx.translate(J.x, J.y); ctx.rotate(Math.atan2(J.uy, J.ux));
    for (const m of J.manchas) { // a poeira vira barro (mesmas manchas macias, sem bordas retas)
      const gr = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r); gr.addColorStop(0, `rgba(52,36,22,${(m.a * 1.3 * w).toFixed(3)})`); gr.addColorStop(1, 'rgba(52,36,22,0)');
      ctx.fillStyle = gr; ctx.fillRect(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    }
    const P = new Path2D(); for (const r of J.rastros) this.rastro(P, r);
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(48,32,20,${(0.5 * w).toFixed(3)})`; ctx.lineWidth = 3.8; ctx.stroke(P);
    ctx.strokeStyle = `rgba(200,210,228,${(0.14 * w).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke(P); // brilho da água no barro
    const p = J.poca; // poça no buraco com o céu refletido
    if (p) { ctx.fillStyle = `rgba(62,74,92,${(0.75 * w).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx * 1.15, p.ry * 1.15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(180,195,215,${(0.22 * w).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(p.x - p.rx * 0.3, p.y - p.ry * 0.3, p.rx * 0.45, p.ry * 0.3, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
};

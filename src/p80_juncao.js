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
  const pistas = estreita ? [0] : [-dw * 0.42, dw * 0.42];
  for (const py of pistas) for (const w of [-7, 7]) {
    const comp = 60 + R() * 90, curva = R() < 0.55 ? (R() < 0.5 ? -1 : 1) * (25 + R() * 50) : 0;
    J.rastros.push({ y0: py + w + (R() - 0.5) * 2, comp, curva, a: 0.35 + R() * 0.3 });
  }
  J.poca = { x: 10 + R() * 14, y: (R() - 0.5) * dw, rx: 9 + R() * 8, ry: 5 + R() * 4 };
  this.lista.push(J);
};
// caminho de um rastro: começa dentro da terra e vai entrando no asfalto (x < 0), podendo virar para um lado
Juncao.rastro = function (P, r) {
  P.moveTo(34, r.y0); P.lineTo(0, r.y0);
  P.quadraticCurveTo(-r.comp * 0.55, r.y0, -r.comp, r.y0 + r.curva);
};
Juncao.desenha = function (g, J) {
  const R = mulberry32(((J.x * 5.1) | 0) + ((J.y * 9.7) | 0) * 7), dw = J.dw;
  g.save(); g.translate(J.x, J.y); g.rotate(Math.atan2(J.uy, J.ux)); // +x = para dentro da terra
  // 1) terra espalhada por cima do asfalto (manchas macias, mais forte perto da beira)
  for (let i = 0; i < (J.estreita ? 9 : 16); i++) {
    const cx = -Math.pow(R(), 1.6) * (J.estreita ? 30 : 50), cy = (R() - 0.5) * 2 * (dw + 6), r = 6 + R() * 14, a = 0.5 * (1 + cx / 60);
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(128,98,66,${a.toFixed(3)})`); gr.addColorStop(1, 'rgba(128,98,66,0)');
    g.fillStyle = gr; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  g.fillStyle = 'rgba(122,94,64,0.62)'; g.beginPath(); g.moveTo(0, -dw - 5);
  for (let y = -dw - 5; y <= dw + 5; y += 4) g.lineTo(-3 - R() * 7, y);
  g.lineTo(0, dw + 5); g.closePath(); g.fill(); // faixa de terra que tapa a linha branca da beira
  // 2) beira do asfalto quebrada, avançando um pouco na terra, com pedaços soltos (estradinha começa depois da calçada: sem isso)
  if (!J.estreita) {
  g.fillStyle = '#3a3a3d'; g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-1, -dw - 2);
  for (let y = -dw - 2; y <= dw + 2; y += 3 + R() * 3) g.lineTo(R() < 0.3 ? 1 : 1 + R() * 6, y);
  g.lineTo(-1, dw + 2); g.closePath(); g.fill(); g.stroke();
  for (let i = 0; i < 7; i++) { const x = 6 + R() * 16, y = (R() - 0.5) * 2 * dw, s = 1.5 + R() * 2.5; g.fillStyle = '#3d3d40'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s, y); g.lineTo(x + s * 0.3, y + s); g.lineTo(x - s * 0.8, y + s * 0.2); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x - s * 0.8, y + s * 0.2, s * 1.4, 0.8); }
  }
  // 3) terra batida e afundada onde os carros passam (logo depois da beira)
  for (const r of J.rastros) { g.fillStyle = 'rgba(70,50,32,0.22)'; g.fillRect(3, r.y0 - 2.5, 40, 5); }
  // 4) rastros de pneu sujos de terra entrando no asfalto (somem aos poucos)
  for (const r of J.rastros) {
    const P = new Path2D(); this.rastro(P, r);
    const gr = g.createLinearGradient(30, 0, -r.comp, 0); gr.addColorStop(0, `rgba(96,70,44,${(r.a + 0.15).toFixed(3)})`); gr.addColorStop(0.35, `rgba(96,70,44,${r.a.toFixed(3)})`); gr.addColorStop(1, 'rgba(96,70,44,0)');
    g.strokeStyle = gr; g.lineWidth = 3.2; g.lineCap = 'round'; g.stroke(P);
    // desenho do pneu (gomos) no começo do rastro
    g.fillStyle = 'rgba(70,50,30,0.35)'; for (let x = -2; x > -r.comp * 0.35; x -= 3.5) g.fillRect(x, r.y0 + (x / -r.comp) * (x / -r.comp) * r.curva - 1.5, 1.2, 3);
  }
  // 5) pedrinhas e cascalho espalhados
  for (let i = 0; i < 46; i++) { const x = -R() * R() * 45 + 12 - R() * 4, y = (R() - 0.5) * 2 * (dw + 10), s = 0.7 + R() * 1.1; g.fillStyle = R() < 0.5 ? 'rgba(150,140,128,0.85)' : 'rgba(110,86,60,0.85)'; g.fillRect(x, y, s, s); }
  // 6) buraco na boca da estrada de terra (borda clara e fundo escuro)
  const p = J.poca; g.fillStyle = 'rgba(40,28,18,0.55)'; g.beginPath(); g.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(170,140,100,0.35)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(p.x + 0.6, p.y + 0.6, p.rx, p.ry, 0, 0.2, Math.PI - 0.2); g.stroke();
  g.restore();
};
// chuva: barro escuro e brilhando nos rastros, terra virando lama no asfalto e poça no buraco (por cima, na hora)
Juncao.molhado = function (ctx, view) {
  const w = Weather.wet; if (w < 0.05 || Settings.quality === 'baixa') return;
  for (const J of this.lista) {
    if (J.x < view.x0 - 170 || J.x > view.x1 + 170 || J.y < view.y0 - 170 || J.y > view.y1 + 170) continue;
    ctx.save(); ctx.translate(J.x, J.y); ctx.rotate(Math.atan2(J.uy, J.ux));
    const gr = ctx.createLinearGradient(20, 0, -55, 0); gr.addColorStop(0, `rgba(52,36,22,${(0.45 * w).toFixed(3)})`); gr.addColorStop(1, 'rgba(52,36,22,0)');
    ctx.fillStyle = gr; ctx.fillRect(-55, -J.dw - 8, 75, J.dw * 2 + 16);
    const P = new Path2D(); for (const r of J.rastros) this.rastro(P, r);
    ctx.lineCap = 'round';
    ctx.strokeStyle = `rgba(48,32,20,${(0.5 * w).toFixed(3)})`; ctx.lineWidth = 3.8; ctx.stroke(P);
    ctx.strokeStyle = `rgba(200,210,228,${(0.14 * w).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke(P); // brilho da água no barro
    const p = J.poca; // poça no buraco com o céu refletido
    ctx.fillStyle = `rgba(62,74,92,${(0.75 * w).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx * 1.15, p.ry * 1.15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(180,195,215,${(0.22 * w).toFixed(3)})`; ctx.beginPath(); ctx.ellipse(p.x - p.rx * 0.3, p.y - p.ry * 0.3, p.rx * 0.45, p.ry * 0.3, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
};

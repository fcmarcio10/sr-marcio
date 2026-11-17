/* ============================ CAMPO PERTO DO ASFALTO E CIDADE NOBRE (nov/2026) ============================
   Feito depois de montar o mapa, com sorteio próprio (não mexe no resto):
   - outdoors menores no meio do pasto, meio de lado, perto das rodovias e estradas asfaltadas;
   - lotes à venda na beira do asfalto: só a plaquinha no mato alto, lote cercado, lote com os cantos de tijolo
     começando e obra (laje, paredes subindo, ferragem, tijolo, areia e carrinho de mão);
   - entre os lotes, estradinhas de terra apertadas com mato fechando dos dois lados;
   - palmeiras nas calçadas do Jardim Camburiso (cidade limpa e chique);
   - propaganda pintada na parede (empena) de alguns prédios altos da cidade. */
const CAMPO_REG = { rio: 1, sitio: 1, fazenda: 1, rodovia: 1 };
const VENDE_TIT = ['VENDE-SE', 'VENDE-SE', 'LOTE À VENDA', 'VENDO', 'VENDE-SE URGENTE'];
const VENDE_SUB = ['TRATAR 9 9171-0000', 'DIRETO C/ DONO', 'ACEITO CARRO', 'LOTE 12 x 30', 'ACEITO PIX', 'PARCELO', 'NÃO É GOLPE'];
// lugar livre no pasto? Árvore no meio não impede: o terreno é limpo (a árvore sai) quando "limpa" é verdadeiro
const _campoQ = [];
function campoLivre(x0, y0, x1, y1, limpa) {
  if (x0 < 260 || y0 < 260 || x1 > WORLD_W - 260 || y1 > WORLD_H - 260) return false;
  _campoQ.length = 0; colGrid.query(x0, y0, x1, y1, _campoQ);
  const arv = [];
  for (const c of _campoQ) {
    const dentro = c.t === 1 ? c.x + c.r > x0 && c.x - c.r < x1 && c.y + c.r > y0 && c.y - c.r < y1 : c.x1 > x0 && c.x0 < x1 && c.y1 > y0 && c.y0 < y1;
    if (!dentro || c.tag === 'none') continue;
    if (c.tag === 'tree' && limpa) { arv.push(c); continue; }
    return false;
  }
  for (let x = x0; x <= x1; x += 12) for (let y = y0; y <= y1; y += 12) if (groundAt(x, y) !== SF.GRASS) return false;
  for (let x = x0; x <= x1; x += 24) if (groundAt(x, y1) !== SF.GRASS || groundAt(x, y0) !== SF.GRASS) return false;
  for (const c of arv) { const t = World.tall.find((o) => o.col === c); if (t) t.removed = true; c.x = c.y = -1e6; c.r = 0; c.tag = 'none'; c.brk = null; } // limpa o terreno
  return true;
}
// retângulo em coordenadas da rua: s ao longo da rua, d para o lado (sd = +1 ou -1)
function ruaRet(e, s0, s1, d0, d1, sd) {
  const nx = -e.dy * sd, ny = e.dx * sd, P = (s, d) => [e.a.x + e.dx * s + nx * d, e.a.y + e.dy * s + ny * d];
  const A = P(s0, d0), B = P(s1, d1);
  return [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[0], B[0]), Math.max(A[1], B[1])];
}
function posMontagem() {
  const sv = RNG; RNG = mulberry32(78078);
  try { lotesEEstradinhas(); outdoorsNoPasto(); palmeirasNobres(); empenas(); } finally { RNG = sv; }
  World.tall = World.tall.filter((t) => !t.removed);
}
function bordasRurais() {
  return World.edges.filter((e) => e.T.asphalt && !e.bridge && e.len > 260 && CAMPO_REG[regionKeyAt(e.a.x + e.dx * e.len / 2, e.a.y + e.dy * e.len / 2)]);
}
const beiraDa = (e) => e.hw + (e.T.sw || 0) + (e.T.shoulder || 0);

/* ---------- outdoors no pasto ---------- */
function outdoorsNoPasto() {
  const feitos = [], E = bordasRurais().sort((p, q) => p.id - q.id);
  let ad = 0;
  for (let volta = 0; volta < 3 && feitos.length < 10; volta++) for (const e of E) {
    if (feitos.length >= 10) break;
    const s = 200 + rnd(0, Math.max(1, e.len - 400)), sd = chance(0.5) ? 1 : -1, d = beiraDa(e) + rnd(70, 130);
    const [x0, y0, x1, y1] = ruaRet(e, s - 1, s + 1, d - 1, d + 1, sd), x = (x0 + x1) / 2, y = (y0 + y1) / 2;
    if (feitos.some((q) => Math.hypot(q.x - x, q.y - y) < 800)) continue;
    if (y > 6200 || !CAMPO_REG[regionKeyAt(x, y)] || !campoLivre(x - 62, y - 46, x + 62, y + 30, true)) continue;
    // meio de lado: quase de frente para a tela, virado uns 15° a 30° (cada um para um lado)
    const rot = (chance(0.5) ? 1 : -1) * rnd(0.26, 0.52);
    const o = { kind: 'billboard', x, y, h: 44, ad: ad++ % OUTDOORS.length, rot, panel: null };
    addTall(o, x - 80, y - 80, x + 80, y + 80);
    for (const k of [-1, 1]) addCircCol(x + Math.cos(rot) * OD_PW * 0.3 * k, y + Math.sin(rot) * OD_PW * 0.3 * k, 3.5, 'pole');
    addLightFixa(x, y + 10, 80, 0.55, 'white');
    // capim alto em volta do pé
    bake(x - 60, y - 30, x + 60, y + 30, 6.4, (g) => tufosMato(g, x, y, 54, 18, 26, mulberry32((x | 0) * 7 + (y | 0))));
    feitos.push(o);
  }
}

/* ---------- lotes à venda e estradinhas ---------- */
function lotesEEstradinhas() {
  let nLotes = 0, nRuas = 0;
  for (const e of bordasRurais().sort((p, q) => p.id - q.id)) {
    const beira = beiraDa(e);
    for (const sd of [1, -1]) {
      let s = 140 + rnd(0, 120), seguidos = 0, grupo = 0;
      while (s < e.len - 150 && nLotes < 70) {
        if (!grupo) { if (!chance(0.3)) { s += 150; continue; } grupo = 2 + Math.floor(rnd(0, 4)); seguidos = 0; }
        // estradinha de terra no meio do grupo
        if (seguidos >= 1 && nRuas < 14 && chance(0.6)) {
          const lw = 34, s1 = s + 6; let feito = false;
          for (const L of [rnd(320, 470), 260, 190]) { // tenta comprida; se não couber, mais curta
            const r = ruaRet(e, s1, s1 + lw, beira, beira + L, sd), m = ruaRet(e, s1 - 4, s1 + lw + 4, beira + 10, beira + L, sd);
            if (r[3] < 6150 && campoLivre(m[0], m[1], m[2], m[3], true) && CAMPO_REG[regionKeyAt((r[0] + r[2]) / 2, (r[1] + r[3]) / 2)]) { estradinha(e, s1, lw, beira, L, sd); feito = true; break; }
          }
          if (feito) { nRuas++; s = s1 + lw + 14; seguidos = 0; continue; }
        }
        const W = rnd(118, 140), D = rnd(98, 128), d0 = beira + 16;
        const r = ruaRet(e, s, s + W, d0, d0 + D, sd);
        if (r[3] < 6150 && campoLivre(r[0] - 4, r[1] - 4, r[2] + 4, r[3] + 4, true) && CAMPO_REG[regionKeyAt((r[0] + r[2]) / 2, (r[1] + r[3]) / 2)]) {
          const frente = e.h ? (sd * e.dx > 0 ? 'N' : 'S') : (sd * e.dy > 0 ? 'E' : 'W'); // lado do lote que dá para a rua
          lote(r, frente); nLotes++; seguidos++;
        } else seguidos = 0;
        s += W + rnd(8, 30); grupo--;
      }
    }
  }
  World.loteamento = { lotes: nLotes, estradinhas: nRuas };
}
// lote: tipo sorteado; a plaquinha fica na frente, virada para a rua
function lote(r, frente) {
  const [x0, y0, x1, y1] = r, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rr = rnd();
  const tipo = rr < 0.25 ? 'mato' : rr < 0.55 ? 'cercado' : rr < 0.75 ? 'cantos' : 'obra';
  (World.lotes || (World.lotes = [])).push({ x: cx, y: cy, tipo });
  const fx = frente === 'W' ? x0 + 10 : frente === 'E' ? x1 - 10 : cx + rnd(-30, 30), fy = frente === 'N' ? y0 + 10 : frente === 'S' ? y1 - 10 : cy + rnd(-30, 30);
  const seed = (x0 * 13 + y0 * 7) | 0, R = () => mulberry32(seed);
  const placa = { x: fx, y: fy, t: tipo === 'obra' ? 'OBRA' : pick(VENDE_TIT), s: tipo === 'obra' ? 'ENG. ZÉ DA LAJE' : pick(VENDE_SUB), a: rnd(-0.12, 0.12) };
  if (tipo === 'mato') bake(x0, y0, x1, y1, 6.2, (g) => tufosMato(g, cx, cy, (x1 - x0) / 2, (y1 - y0) / 2, 70, R()));
  if (tipo === 'cercado') {
    const gap = { N: frente === 'N', S: frente === 'S', W: frente === 'W', E: frente === 'E' }, G = 34;
    const lado = (a, b, mk, temGap, meio) => { if (!temGap) mk(a, b); else { mk(a, meio - G / 2); mk(meio + G / 2, b); } };
    lado(x0, x1, (a, b) => addFence(a, y0 - 1.5, b, y0 + 1.5), gap.N, cx); lado(x0, x1, (a, b) => addFence(a, y1 - 1.5, b, y1 + 1.5), gap.S, cx);
    lado(y0, y1, (a, b) => addFence(x0 - 1.5, a, x0 + 1.5, b), gap.W, cy); lado(y0, y1, (a, b) => addFence(x1 - 1.5, a, x1 + 1.5, b), gap.E, cy);
    bake(x0, y0, x1, y1, 6.2, (g) => tufosMato(g, cx, cy, (x1 - x0) / 2 - 6, (y1 - y0) / 2 - 6, 26, R()));
  }
  if (tipo === 'cantos') {
    const k = 12, C = [[x0 + 8, y0 + 8, 1, 1], [x1 - 8, y0 + 8, -1, 1], [x0 + 8, y1 - 8, 1, -1], [x1 - 8, y1 - 8, -1, -1]];
    const alt = C.map(() => rnd(4, 10));
    bake(x0 - 6, y0 - 6, x1 + 10, y1 + 10, 7.4, (g) => { linhaDeObra(g, C); C.forEach(([x, y, sx, sy], i) => cantoTijolo(g, x, y, sx, sy, k + alt[i] * 1.2, alt[i])); pilhaTijolo(g, cx - 20, cy, 0.3); monteAreia(g, cx + 26, cy + 10, 13); tufosMato(g, cx, cy, (x1 - x0) / 2 - 10, (y1 - y0) / 2 - 10, 20, R()); });
    for (const [x, y] of C) addRectCol(x - 4, y - 4, x + 4, y + 4, 'wall');
    addRectCol(cx - 30, cy - 8, cx - 10, cy + 8, 'prop');
  }
  if (tipo === 'obra') {
    const m = 14, L = { x0: x0 + m, y0: y0 + m, x1: x1 - m, y1: y1 - m };
    decal(L.x0, L.y0, L.x1, L.y1, 'concrete', { z: 2.3 });
    const paredes = [], lados = ['N', 'S', 'W', 'E'].filter((q) => q !== frente);
    for (const ld of lados) if (chance(0.8)) paredes.push({ ld, alt: rnd(5, 14), fim: rnd(0.45, 1) });
    bake(x0 - 6, y0 - 6, x1 + 12, y1 + 12, 7.4, (g) => {
      tufosMato(g, cx, cy, (x1 - x0) / 2, (y1 - y0) / 2, 18, R());
      for (const p of paredes) paredeTijolo(g, L, p);
      for (const [x, y] of [[L.x0, L.y0], [L.x1, L.y0], [L.x0, L.y1], [L.x1, L.y1], [(L.x0 + L.x1) / 2, L.y0], [(L.x0 + L.x1) / 2, L.y1]]) ferragem(g, x, y);
      pilhaTijolo(g, cx - 18, cy - 4, 0); pilhaTijolo(g, cx - 18, cy + 14, 0.1); monteAreia(g, cx + 22, cy + 6, 15); sacosCimento(g, cx + 4, cy - 18); carrinhoMao(g, cx + 6, cy + 18, 0.6);
    });
    for (const p of paredes) { const q = paredeRet(L, p); addRectCol(q[0], q[1], q[2], q[3], 'wall'); }
    addRectCol(cx - 28, cy - 12, cx - 8, cy + 22, 'prop'); addRectCol(cx + 10, cy - 6, cx + 36, cy + 18, 'prop');
  }
  bake(placa.x - 22, placa.y - 16, placa.x + 24, placa.y + 18, 7.6, (g) => plaquinha(g, placa));
  addCircCol(placa.x, placa.y + 5, 2, 'prop');
}
// estradinha de terra apertada, com mato e moitas fechando dos dois lados
function estradinha(e, s, lw, beira, L, sd) {
  const r = ruaRet(e, s, s + lw, beira, beira + L, sd);
  (World.estradinhas || (World.estradinhas = [])).push({ x: (r[0] + r[2]) / 2, y: (r[1] + r[3]) / 2 });
  decal(r[0], r[1], r[2], r[3], 'earth', { z: 2.2 });
  const vert = (r[3] - r[1]) > (r[2] - r[0]), R = mulberry32((r[0] * 3 + r[1]) | 0);
  bake(r[0] - 16, r[1] - 16, r[2] + 16, r[3] + 16, 6.3, (g) => trilhaTerra(g, r, vert, R));
  // moitas dos dois lados (algumas avançando um pouco na estrada) e árvores atrás
  const comp = vert ? r[3] - r[1] : r[2] - r[0];
  for (let t = 14; t < comp - 6; t += rnd(15, 24)) for (const lado of [0, 1]) {
    if (chance(0.12)) continue;
    const dentro = rnd(0, 4), x = vert ? (lado ? r[2] + 5 - dentro : r[0] - 5 + dentro) : r[0] + t, y = vert ? r[1] + t : (lado ? r[3] + 5 - dentro : r[1] - 5 + dentro);
    addTree(x, y, 'bush', rnd(0.85, 1.15), { force: true });
    if (chance(0.18)) { const fx = vert ? x + (lado ? 22 : -22) : x, fy = vert ? y : y + (lado ? 22 : -22); if (groundAt(fx, fy) === SF.GRASS && !areaBlocked(fx - 6, fy - 6, fx + 6, fy + 6)) addTree(fx, fy, pick(['round', 'mango', 'round']), rnd(0.75, 1)); }
  }
}

/* ---------- desenhos (pintados uma vez no chão) ---------- */
function tufosMato(g, cx, cy, rx, ry, n, R) {
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = cx + (R() * 2 - 1) * rx, y = cy + (R() * 2 - 1) * ry, h = 4 + R() * 7, seco = R() < 0.35;
    g.strokeStyle = seco ? 'rgba(170,160,90,0.85)' : 'rgba(58,98,40,0.9)'; g.lineWidth = 1.1;
    g.beginPath(); for (let k = -2; k <= 2; k++) { g.moveTo(x + k * 1.2, y); g.quadraticCurveTo(x + k * 2, y - h * 0.6, x + k * 2.6 + (R() - 0.5) * 2, y - h); } g.stroke();
  }
}
function plaquinha(g, p) {
  g.save(); g.translate(p.x, p.y); g.rotate(p.a);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-14, 2, 32, 15); // sombra
  g.fillStyle = '#6a4a2a'; g.fillRect(-1, 2, 2.4, 8); // estaca
  g.fillStyle = '#f4f1e8'; g.fillRect(-17, -11, 34, 16); g.strokeStyle = '#8a8478'; g.lineWidth = 0.8; g.strokeRect(-17, -11, 34, 16);
  g.textAlign = 'center'; g.fillStyle = p.t === 'OBRA' ? '#1d4f9c' : '#d42a1a';
  let fs = 7; g.font = `${fs}px "BRND Anton", Impact, sans-serif`; while (g.measureText(p.t).width > 31 && fs > 4) { fs -= 0.5; g.font = `${fs}px "BRND Anton", Impact, sans-serif`; }
  g.textBaseline = 'alphabetic'; g.fillText(p.t, 0, -3);
  g.fillStyle = '#222'; g.font = '3.4px "BRND Cond", sans-serif'; g.fillText(p.s, 0, 2.6, 32);
  g.restore();
}
const TIJ = '#b5502e', TIJ2 = '#c96a3e', REB = '#9a948a';
function blocoTij(g, x, y, w, h, alt) { // bloco de tijolo com "altura": sombra, lado escuro, topo claro e juntas
  g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x + alt * 0.5, y + alt * 0.7, w, h);
  g.fillStyle = '#8a3a20'; g.fillRect(x, y + h - 1, w, Math.min(alt * 0.5, 4) + 1);
  g.fillStyle = TIJ; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(230,220,200,0.55)'; g.lineWidth = 0.5;
  if (w > h) { for (let xx = x + 4; xx < x + w; xx += 4) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); } }
  else { for (let yy = y + 4; yy < y + h; yy += 4) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); } }
  g.fillStyle = 'rgba(255,220,180,0.35)'; g.fillRect(x, y, w, 1);
}
function cantoTijolo(g, x, y, sx, sy, k, alt) {
  blocoTij(g, Math.min(x, x + sx * k), y - 2.5, k, 5, alt);
  blocoTij(g, x - 2.5, Math.min(y, y + sy * k), 5, k, alt);
  ferragem(g, x, y);
}
function linhaDeObra(g, C) { // linha de nylon esticada marcando o lote
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.5; g.beginPath();
  g.moveTo(C[0][0], C[0][1]); g.lineTo(C[1][0], C[1][1]); g.lineTo(C[3][0], C[3][1]); g.lineTo(C[2][0], C[2][1]); g.closePath(); g.stroke();
}
function paredeRet(L, p) {
  const t = 5;
  if (p.ld === 'N') return [L.x0, L.y0 - t / 2, L.x0 + (L.x1 - L.x0) * p.fim, L.y0 + t / 2];
  if (p.ld === 'S') return [L.x1 - (L.x1 - L.x0) * p.fim, L.y1 - t / 2, L.x1, L.y1 + t / 2];
  if (p.ld === 'W') return [L.x0 - t / 2, L.y1 - (L.y1 - L.y0) * p.fim, L.x0 + t / 2, L.y1];
  return [L.x1 - t / 2, L.y0, L.x1 + t / 2, L.y0 + (L.y1 - L.y0) * p.fim];
}
function paredeTijolo(g, L, p) {
  const [a, b, c, d] = paredeRet(L, p);
  blocoTij(g, a, b, c - a, d - b, p.alt);
  // fiada de cima desigual (parede subindo)
  const hz = c - a > d - b;
  g.fillStyle = TIJ2; for (let k = 0; k < 4; k++) { const f = 0.5 + k * 0.12; if (hz) g.fillRect(a + (c - a) * f, b - 1, (c - a) * 0.08, d - b); else g.fillRect(a, b + (d - b) * f, c - a, (d - b) * 0.08); }
}
function ferragem(g, x, y) { // ferro da coluna saindo do chão
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x - 2, y + 1, 6, 4);
  g.fillStyle = REB; g.fillRect(x - 2.5, y - 2.5, 5, 5);
  g.fillStyle = '#5a3a28'; for (const [dx, dy] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) g.fillRect(x + dx - 0.6, y + dy - 0.6, 1.2, 1.2);
}
function pilhaTijolo(g, x, y, a) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-8, -5, 20, 14);
  g.fillStyle = '#7a5a3a'; g.fillRect(-10, -7, 20, 14); // palete
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j) % 2 ? TIJ : TIJ2; g.fillRect(-9 + i * 4.6, -6 + j * 4.2, 4.2, 3.8); }
  g.fillStyle = 'rgba(255,230,200,0.25)'; g.fillRect(-9, -6, 18, 1);
  g.restore();
}
function monteAreia(g, x, y, r) {
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(x + 3, y + 3, r, r * 0.75, 0, 0, TAU); g.fill();
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, 1, x, y, r); gr.addColorStop(0, '#f0dca4'); gr.addColorStop(0.7, '#d8bc7c'); gr.addColorStop(1, '#b89a5a');
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * 0.75, 0, 0, TAU); g.fill();
}
function sacosCimento(g, x, y) {
  for (let i = 0; i < 3; i++) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + i * 7 + 1, y + 2, 6, 9); g.fillStyle = '#d8d4c8'; g.fillRect(x + i * 7, y, 6, 9); g.fillStyle = '#c03a2a'; g.fillRect(x + i * 7, y + 3, 6, 2); }
}
function carrinhoMao(g, x, y, a) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-5, -3, 16, 9);
  g.strokeStyle = '#3a3a3a'; g.lineWidth = 1; g.beginPath(); g.moveTo(2, -3); g.lineTo(14, -4); g.moveTo(2, 3); g.lineTo(14, 4); g.stroke();
  g.fillStyle = '#2f6db0'; g.beginPath(); g.moveTo(-7, -5); g.lineTo(5, -4); g.lineTo(5, 4); g.lineTo(-7, 5); g.closePath(); g.fill();
  g.fillStyle = '#9a8a6a'; g.fillRect(-5, -2.6, 8, 5.2); // massa
  g.fillStyle = '#1a1a1a'; g.fillRect(-9, -1.5, 3, 3);
  g.restore();
}
function trilhaTerra(g, r, vert, R) {
  const [x0, y0, x1, y1] = r, L = vert ? y1 - y0 : x1 - x0, W = vert ? x1 - x0 : y1 - y0;
  const P = (t, w) => (vert ? [x0 + w, y0 + t] : [x0 + t, y0 + w]);
  // duas trilhas de pneu mais escuras e capim no meio
  g.strokeStyle = 'rgba(70,48,28,0.35)'; g.lineWidth = 4.5; g.lineCap = 'round';
  for (const w of [W * 0.3, W * 0.7]) { g.beginPath(); for (let t = 0; t <= L; t += 20) { const p = P(t, w + Math.sin(t * 0.03) * 1.5); if (t) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); } g.stroke(); }
  g.lineWidth = 1;
  for (let t = 4; t < L; t += 5) { const p = P(t, W / 2 + (R() - 0.5) * 4), h = 2 + R() * 4; g.strokeStyle = R() < 0.4 ? 'rgba(150,150,80,0.8)' : 'rgba(60,100,40,0.85)'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + (R() - 0.5) * 3, p[1] - h); g.stroke(); }
  // capim avançando das beiradas (a estrada vai se fechando)
  for (let t = 0; t < L; t += 3) for (const lado of [0, 1]) {
    if (R() < 0.35) continue;
    const w = lado ? W - R() * 7 : R() * 7, p = P(t, w), h = 3 + R() * 6;
    g.strokeStyle = R() < 0.3 ? 'rgba(160,150,85,0.85)' : 'rgba(55,95,38,0.9)';
    g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + (R() - 0.5) * 4, p[1] - h * 0.6, p[0] + (R() - 0.5) * 6, p[1] - h); g.stroke();
  }
  // pedrinhas e poça seca
  g.fillStyle = 'rgba(120,100,80,0.6)'; for (let i = 0; i < L / 12; i++) { const p = P(R() * L, W * (0.2 + R() * 0.6)); g.fillRect(p[0], p[1], 1.4, 1.2); }
}

/* ---------- cidade nobre e empenas ---------- */
function palmeirasNobres() {
  for (const e of World.edges) {
    if (!e.T.asphalt || !e.T.sw || e.bridge) continue;
    if (regionKeyAt(e.a.x + e.dx * e.len / 2, e.a.y + e.dy * e.len / 2) !== 'camburi') continue;
    const d = e.hw + e.T.sw * 0.55;
    for (const sd of [1, -1]) for (let s = (e.clearA || 40) + 40; s < e.len - (e.clearB || 40) - 30; s += 86) {
      const x = e.a.x + e.dx * s - e.dy * sd * d, y = e.a.y + e.dy * s + e.dx * sd * d;
      if (regionKeyAt(x, y) !== 'camburi') continue;
      addTree(x, y, 'palm', rnd(0.95, 1.15), { sidewalk: true });
    }
  }
}
function empenas() {
  const REG = { centro: 1, camburi: 1.4, industrial: 0.7, jardim: 0.8, vila: 0.6, porto: 0.8 };
  let n = 0;
  for (const b of World.buildings) {
    if ((b.style !== 'office' && b.style !== 'apart') || b.h < 50 || b.vidro || b.sign) continue;
    const r = REG[regionKeyAt(b.cx, b.cy)]; if (!r) continue;
    if (hash2((b.x0 | 0) + 313, (b.y0 | 0) + 71) > 0.34 * r) continue;
    b.empena = Math.floor(hash2(b.x1 | 0, b.y1 | 0) * OUTDOORS.length); n++;
    if (b.x1 - b.x0 >= 70 && hash2((b.x0 | 0) + 5, (b.y1 | 0) + 9) < 0.55) b.topo = true; // painel em cima do prédio
  }
  World.nEmpenas = n;
}

/* ---------- além da borda do mapa: a mata continua (cada vez mais longe e enevoada) e o mar segue até o horizonte ---------- */
function bordaFora(ctx, view) {
  const L = view.x0, T = view.y0, R = view.x1, B = view.y1;
  if (L >= 0 && T >= 0 && R <= WORLD_W && B <= WORLD_H) return;
  const terra = (x0, y0, x1, y1) => { if (x1 > x0 && y1 > y0) ctx.fillRect(x0, y0, x1 - x0, y1 - y0); };
  ctx.save();
  // mata lá fora
  ctx.fillStyle = pat(ctx, 'forest');
  terra(L, T, R, Math.min(0, B)); terra(L, Math.max(0, T), Math.min(0, R), Math.min(SEA_Y, B)); terra(Math.max(WORLD_W, L), Math.max(0, T), R, Math.min(SEA_Y, B));
  // copas grandes por cima (presas ao mapa) para não parecer chão liso
  const G = 46, cores = ['#1d3c1c', '#244621', '#2a5226', '#1a361a'];
  for (let gy = Math.floor(T / G); gy * G < B; gy++) for (let gx = Math.floor(L / G); gx * G < R; gx++) {
    const x = gx * G + hash2(gx, gy) * G, y = gy * G + hash2(gy, gx) * G;
    if (!(x < 0 || y < 0 || x > WORLD_W) || y > SEA_Y - 20) continue;
    const r = 18 + hash2(gx + 7, gy) * 16;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(x + 5, y + 7, r, 0, TAU); ctx.fill();
    ctx.fillStyle = cores[(gx * 7 + gy * 3 & 0xffff) % 4]; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(130,180,95,0.13)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.5, 0, TAU); ctx.fill();
  }
  // mar lá fora (até o horizonte)
  ctx.fillStyle = pat(ctx, 'water');
  terra(L, Math.max(WORLD_H, T), R, B); terra(L, Math.max(SEA_Y, T), Math.min(0, R), Math.min(WORLD_H, B)); terra(Math.max(WORLD_W, L), Math.max(SEA_Y, T), R, Math.min(WORLD_H, B));
  // quanto mais longe da borda, mais escuro e enevoado (fundo da paisagem)
  const nevoa = (x0, y0, x1, y1, gx0, gy0, gx1, gy1, cor) => {
    if (x1 <= x0 || y1 <= y0) return;
    const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1); g.addColorStop(0, cor + '0)'); g.addColorStop(1, cor + '0.75)');
    ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  };
  nevoa(L, T, R, Math.min(0, B), 0, 0, 0, -700, 'rgba(14,24,18,');
  nevoa(L, Math.max(0, T), Math.min(0, R), Math.min(SEA_Y, B), 0, 0, -700, 0, 'rgba(14,24,18,');
  nevoa(Math.max(WORLD_W, L), Math.max(0, T), R, Math.min(SEA_Y, B), WORLD_W, 0, WORLD_W + 700, 0, 'rgba(14,24,18,');
  nevoa(L, Math.max(WORLD_H, T), R, B, 0, WORLD_H, 0, WORLD_H + 700, 'rgba(10,30,48,');
  ctx.restore();
}

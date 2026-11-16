/* ============================ MATA, VENTO E MATO ============================
   - Vento: rajadas que passam pela cidade (onda lenta) e fazem árvores, moitas, mato e plantação balançarem juntos.
   - Mata das beiradas: além da textura do chão, copas de árvore de verdade na borda (com sombra, luz e balanço),
     e rajadas de vento clareando as copas por dentro. Bater nela faz barulho de folha e galho (sem faísca).
   - Mato: tufos de capim nos campos livres (grama), escolhidos pela posição (sem mexer no sorteio do mapa).
   - Plantação: ondas de vento passando por cima e pontas das plantas balançando. */
const Vento = {
  // força do vento num ponto (0 a 1): duas ondas lentas atravessando o mapa
  f(x, y) { const T = Game.time; return 0.5 + 0.3 * Math.sin(T * 0.55 - x * 0.0032 - y * 0.0011) + 0.2 * Math.sin(T * 0.23 + y * 0.0021); },
  // deslocamento de balanço (para a direita e um pouco para baixo, seguindo o vento)
  bal(x, y, fase, amp) { const g = this.f(x, y), T = Game.time; return Math.sin(T * (1.4 + g * 0.8) + fase) * amp * (0.35 + g); },
};
const Mata = { rects: [], plantas: [] };
const MATA_CORES = ['#1d3c1c', '#244621', '#2a5226', '#1a361a', '#30592a'];
// copas na borda da mata: só nas bordas que estão na tela
Mata.copa = function (ctx, view) {
  if (Settings.quality === 'baixa' || !this.rects.length) return;
  const T = Game.time, base = MATA_CORES.map(() => new Path2D()), sombra = new Path2D(), luz = new Path2D(), folha = new Path2D();
  let n = 0;
  const crown = (x, y, r, k) => {
    const b = Vento.bal(x, y, k * 1.7, 1.6);
    const cx = x + b, cy = y + b * 0.35;
    sombra.moveTo(cx + 4 + r, cy + 6); sombra.arc(cx + 4, cy + 6, r, 0, TAU);
    const p = base[(k * 7) % base.length]; p.moveTo(cx + r, cy); p.arc(cx, cy, r, 0, TAU);
    // tufos menores em volta da copa (contorno de folhagem, não um círculo liso)
    for (let j = 0; j < 4; j++) { const a = j * 1.57 + k, rr = r * 0.45, px = cx + Math.cos(a) * r * 0.75, py = cy + Math.sin(a) * r * 0.75; p.moveTo(px + rr, py); p.arc(px, py, rr, 0, TAU); }
    luz.moveTo(cx - r * 0.25 + r * 0.45, cy - r * 0.3); luz.arc(cx - r * 0.25, cy - r * 0.3, r * 0.45, 0, TAU);
    if (k % 3 === 0) { folha.moveTo(cx + r * 0.3 + 2, cy + r * 0.1); folha.arc(cx + r * 0.3, cy + r * 0.1, 2, 0, TAU); }
    n++;
  };
  for (const R of this.rects) {
    if (R.x1 < view.x0 - 40 || R.x0 > view.x1 + 40 || R.y1 < view.y0 - 40 || R.y0 > view.y1 + 40) continue;
    const lado = (ax, ay, bx, by, nx, ny) => { // borda de (ax,ay) a (bx,by); (nx,ny) aponta para dentro
      const L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L, passo = 21;
      for (let s = 10; s < L - 6; s += passo) {
        const x = ax + ux * s, y = ay + uy * s;
        if (x < view.x0 - 30 || x > view.x1 + 30 || y < view.y0 - 30 || y > view.y1 + 30) continue;
        const h = hash2(x | 0, y | 0), r = 12 + h * 11, ent = 8 + h * 10;
        crown(x + nx * ent, y + ny * ent, r, (h * 97) | 0);
      }
    };
    // só as bordas que dão para fora do mundo não precisam (ninguém vê); as outras ganham copas
    if (R.y0 > 5) lado(R.x0, R.y0, R.x1, R.y0, 0, 1);
    if (R.y1 < WORLD_H - 5) lado(R.x0, R.y1, R.x1, R.y1, 0, -1);
    if (R.x0 > 5) lado(R.x0, R.y0, R.x0, R.y1, 1, 0);
    if (R.x1 < WORLD_W - 5) lado(R.x1, R.y0, R.x1, R.y1, -1, 0);
  }
  if (!n) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fill(sombra);
  MATA_CORES.forEach((c, i) => { ctx.fillStyle = c; ctx.fill(base[i]); });
  ctx.fillStyle = 'rgba(130,180,95,0.16)'; ctx.fill(luz);
  ctx.fillStyle = 'rgba(160,200,110,0.35)'; ctx.fill(folha);
  ctx.restore();
};
// rajada de vento clareando as copas por dentro da mata (faixa de luz andando) e mato e plantação no chão
Mata.chao = function (ctx, view) {
  if (Settings.quality === 'baixa') return;
  const T = Game.time;
  ctx.save();
  // rajadas nas copas da mata
  for (const R of this.rects) {
    const x0 = Math.max(R.x0 + 16, view.x0), x1 = Math.min(R.x1 - 16, view.x1), y0 = Math.max(R.y0 + 16, view.y0), y1 = Math.min(R.y1 - 16, view.y1);
    if (x1 <= x0 || y1 <= y0) continue;
    const pos = ((T * 60) % 900) - 450, gx = view.x0 + pos;
    const gr = ctx.createLinearGradient(gx, view.y0, gx + 380, view.y0 + 220);
    gr.addColorStop(0, 'rgba(150,200,120,0)'); gr.addColorStop(0.5, 'rgba(150,200,120,0.07)'); gr.addColorStop(1, 'rgba(150,200,120,0)');
    ctx.fillStyle = gr; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  // plantações: onda de vento passando (faixa clara) e pontas das plantas balançando
  const pontas = new Path2D();
  for (const P of this.plantas) {
    const x0 = Math.max(P.x0 + 4, view.x0), x1 = Math.min(P.x1 - 4, view.x1), y0 = Math.max(P.y0 + 4, view.y0), y1 = Math.min(P.y1 - 4, view.y1);
    if (x1 <= x0 || y1 <= y0) continue;
    const pos = ((T * 45 + P.x0) % 700) - 350, gx = P.x0 + pos;
    const gr = ctx.createLinearGradient(gx, P.y0, gx + 260, P.y0 + 160);
    gr.addColorStop(0, 'rgba(200,220,150,0)'); gr.addColorStop(0.5, 'rgba(200,220,150,0.1)'); gr.addColorStop(1, 'rgba(200,220,150,0)');
    ctx.fillStyle = gr; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (P.type === 'garden' || P.type === 'coffee') continue;
    const sp = P.type === 'corn' ? 12 : P.type === 'cane' ? 9 : 10, dx = P.type === 'soy' ? 12 : 10;
    for (let y = P.y0 + 6 + Math.max(0, Math.ceil((y0 - P.y0 - 6) / sp)) * sp; y < y1; y += sp) {
      for (let x = x0 + ((y * 7) % dx); x < x1; x += dx) {
        const b = Vento.bal(x, y, (x * 0.13 + y * 0.07), 1.8);
        pontas.moveTo(x, y + 1); pontas.lineTo(x + b + 1.5, y - 4 - (hash2(x | 0, y | 0) * 2));
      }
    }
  }
  ctx.strokeStyle = 'rgba(120,160,70,0.75)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.stroke(pontas);
  // tufos de mato nos campos livres (grama), presos ao mapa, balançando com o vento
  const G = 34, tufos = new Path2D(), claros = new Path2D();
  for (let gy = Math.floor(view.y0 / G); gy * G < view.y1; gy++) for (let gx = Math.floor(view.x0 / G); gx * G < view.x1; gx++) {
    const h = hash2(gx * 13 + 7, gy * 29 + 3); if (h > 0.42) continue;
    const x = gx * G + hash2(gx, gy + 5) * G, y = gy * G + hash2(gx + 3, gy) * G;
    if (groundAt(x, y) !== SF.GRASS || this.dentro(x, y)) continue;
    const b = Vento.bal(x, y, h * 20, 1.6), alto = 4 + h * 9, P = h < 0.14 ? claros : tufos;
    for (let k = -1; k <= 1; k++) { P.moveTo(x + k * 1.6, y); P.quadraticCurveTo(x + k * 2.4 + b * 0.5, y - alto * 0.6, x + k * 3 + b, y - alto - (k ? 0 : 2)); }
  }
  ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(52,92,36,0.85)'; ctx.stroke(tufos);
  ctx.strokeStyle = 'rgba(150,160,80,0.8)'; ctx.stroke(claros);
  ctx.restore();
};
Mata.dentro = function (x, y) { for (const R of this.rects) if (x > R.x0 - 4 && x < R.x1 + 4 && y > R.y0 - 4 && y < R.y1 + 4) return true; return false; };

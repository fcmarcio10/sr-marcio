/* ============================ DIA E NOITE (24 horas, domingo a sábado) ============================
   Profile.time: minutos do dia (0 a 1440; 1 minuto do jogo = 1 segundo de verdade, um dia = 24 minutos).
   Profile.dia: 0 = domingo ... 6 = sábado. Vira à meia-noite.
   Dia.sol (0 noite, 1 dia) clareia o céu no amanhecer (5h às 6h40) e escurece no fim da tarde (17h20 às 19h);
   Dia.apaga (0 a 1) é a parte das luzes já apagadas: de manhã apagam uma a uma (janelas, postes, casas e
   fazendas) e de tardinha acendem uma a uma. Neblina na roça de madrugada. Movimento (carros, pedestres,
   passageiros) segue os horários de pico de verdade. Lojas têm horário: fechada, aparece "Loja fechada". */
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
// horário de funcionamento [abre, fecha] em horas (fecha < abre = passa da meia-noite); sem entrada = 24 horas
const LOJA_HORA = { mercado: [7, 22], padaria: [5, 20], floricultura: [8, 18], paneleiras: [8, 17], porto: [6, 18], sitio: [5, 19], fazenda: [5, 19], bar: [16, 3], churrascaria: [11, 23], moquecaria: [11, 23] };
const Dia = { sol: 0, noite: 1, apaga: 0, aurora: 0, neblina: 0 };
const suave = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
Dia.hora = () => ((Profile.time % 1440) + 1440) % 1440 / 60;
Dia.semana = () => ((Profile.dia === undefined ? 5 : Profile.dia) % 7 + 7) % 7;
Dia.fimDeSemana = () => { const d = Dia.semana(); return d === 0 || d === 6; };
Dia.update = function () {
  const h = Dia.hora();
  this.sol = h < 12 ? suave(5, 6.7, h) : 1 - suave(17.3, 19, h);
  this.noite = 1 - this.sol;
  // luzes: apagam entre 5h20 e 7h, acendem entre 17h e 18h40 (cada uma no seu minuto)
  this.apaga = h < 12 ? suave(5.3, 7, h) : 1 - suave(17, 18.7, h);
  // cor de amanhecer/entardecer (laranja-rosado) no meio da virada
  this.aurora = Math.max(Math.sin(Math.PI * clamp((h - 5) / 1.9, 0, 1)), Math.sin(Math.PI * clamp((h - 17.2) / 2, 0, 1)));
  // neblina na roça de madrugada (4h às 7h30), mais forte por volta das 5h30
  this.neblina = h >= 3.8 && h < 7.6 ? Math.sin(Math.PI * (h - 3.8) / 3.8) : 0;
  // na roça com neblina, o céu não fica alaranjado (a neblina é branca) e aparece o aviso, como o de pista molhada
  if (Game.mode === 'play') {
    const R = REGIONS[regionKeyAt(Cam.x, Cam.y)], nk = this.neblina * clamp((R.rural - 0.2) / 0.6, 0, 1);
    this.aurora *= 1 - clamp(nk * 1.5, 0, 1);
    if (nk > 0.25 && !this.avisoNeblina) { this.avisoNeblina = true; toast('Neblina na estrada', 'Visibilidade diminui: vá devagar e use o farol.', 'info'); }
    if (nk < 0.05) this.avisoNeblina = false;
  }
};
// a luz (janela, poste, casa) já está apagada? cada uma tem o seu momento (escolhido pela posição)
Dia.desligada = function (seed) { return this.apaga > 0 && hash2(seed | 0, 77) < this.apaga; };
// poste: no minuto em que acende ou apaga, a lâmpada pisca um pouco (como lâmpada de rua esquentando)
Dia.posteApagado = function (seed) { const h = hash2(seed | 0, 77), d = h - this.apaga; if (Math.abs(d) < 0.02 && this.apaga < 1) return (Game.time * 9 + h * 50) % 1 < 0.45; return d < 0; };
// movimento da cidade por hora (carros e passageiros): picos às 7h-9h e 17h-19h30; madrugada vazia; fim de semana mais calmo de manhã
Dia.movimento = function () {
  const h = Dia.hora(), fds = Dia.fimDeSemana();
  if (h < 5) return { k: 0.35, label: 'madrugada' };
  if (h < 6.5) return { k: 0.7, label: 'amanhecer' };
  if (h < 9) return fds ? { k: 0.85, label: '' } : { k: 1.5, label: 'horário de pico' };
  if (h < 17) return { k: fds ? 1.05 : 1.2, label: '' };
  if (h < 19.5) return fds ? { k: 1.1, label: '' } : { k: 1.55, label: 'horário de pico' };
  if (h < 22) return { k: fds ? 1.1 : 0.95, label: '' };
  return { k: fds ? 0.75 : 0.55, label: '' };
};
// gente na rua: de dia todo mundo, de noite menos, de madrugada pouca
Dia.pedestres = function () { if (navigator.webdriver && !window.__dia) return 1; const h = Dia.hora(); return h < 5 ? 0.25 : h < 6.5 ? 0.5 : h < 19 ? 1 : h < 22 ? 0.7 : 0.4; };
// pedidos de corrida por hora (multiplica a velocidade do relógio de espera do PegaAí)
function demandaHora() { return clamp(Dia.movimento().k, 0.45, 1.4); }
function lojaAberta(s) {
  if (navigator.webdriver && !window.__dia) return true; // testes antigos: tudo aberto (window.__dia liga os horários)
  const H = LOJA_HORA[s.kind]; if (!H) return true;
  const h = Dia.hora(); return H[0] < H[1] ? h >= H[0] && h < H[1] : h >= H[0] || h < H[1];
}
function lojaHorario(s) { const H = LOJA_HORA[s.kind]; return H ? 'Abre às ' + String(H[0]).padStart(2, '0') + ':00' : ''; }
// aviso grande "Loja fechada" um pouco acima da legenda (não tapa nada nem pega clique)
function avisoFechada(s) {
  let el = $('loja-fechada');
  if (!el) { el = document.createElement('div'); el.id = 'loja-fechada'; document.body.appendChild(el); }
  el.innerHTML = '<b>Loja fechada</b><span>' + escapeHtml(s.name) + (lojaHorario(s) ? ' · ' + lojaHorario(s) : '') + '</span>';
  el.classList.remove('sai'); el.classList.add('on');
  clearTimeout(avisoFechada.t); avisoFechada.t = setTimeout(() => el.classList.add('sai'), 2200);
  try { AudioSys.error(); } catch (e) {}
}
// neblina da roça: manchas claras e lentas por cima de tudo (tela inteira)
Dia.desenhaNeblina = function (ctx, W, H) {
  if (!this.neblina || Settings.quality === 'baixa' || Game.mode !== 'play') return;
  const R = REGIONS[regionKeyAt(Cam.x, Cam.y)], k = this.neblina * clamp((R.rural - 0.2) / 0.6, 0, 1);
  if (k < 0.02) return;
  const T = Game.time;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = `rgba(222,226,230,${(0.38 * k).toFixed(3)})`; ctx.fillRect(0, 0, W, H); // neblina branca e densa: a visibilidade cai
  for (let i = 0; i < 7; i++) {
    const zz = Cam.zoom * (typeof RS !== 'undefined' ? RS : 1), x = ((hash2(i, 3) * W + T * (6 + i) - Cam.x * zz) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2, y = ((hash2(i, 9) * H - Cam.y * zz * SQ) % (H * 1.3) + H * 1.3) % (H * 1.3) - H * 0.15, r = (0.25 + hash2(i, 5) * 0.25) * W; // anda junto com o chão (antes ia em outra velocidade e enjoava)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(235,238,240,${(0.42 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(235,238,240,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
};

// sombras do sol: cada prédio projeta a própria sombra (contorno do prédio arrastado pelo chão), na direção
// oposta ao sol; de manhã cedo e no fim da tarde ficam compridas, ao meio-dia curtas. Tudo numa pincelada só.
Dia.sombrasSol = function (ctx, view) {
  if (this.sol < 0.04 || Settings.quality === 'baixa') return;
  const h = this.hora(), th = clamp(Math.PI * (h - 6) / 12, 0.08, Math.PI - 0.08);
  const comp = 0.32 + 1.25 * Math.pow(1 - Math.sin(th), 1.4); // tamanho da sombra por altura
  const dx = -Math.cos(th), dy = 0.5; // sol do leste de manhã, do oeste à tarde, um pouco ao norte (hemisfério sul)
  const P = new Path2D(), m = 160 * comp + 40;
  const hull = (pts) => { pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
  for (const b of World.buildings) {
    if (b.x1 < view.x0 - m || b.x0 > view.x1 + m || b.y1 < view.y0 - m || b.y0 > view.y1 + m || b.h < 8) continue;
    const L = b.h * comp, ox = dx * L, oy = dy * L;
    const H = hull([[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1], [b.x0 + ox, b.y0 + oy], [b.x1 + ox, b.y0 + oy], [b.x1 + ox, b.y1 + oy], [b.x0 + ox, b.y1 + oy]]);
    H.forEach((p, i) => (i ? P.lineTo(p[0], p[1]) : P.moveTo(p[0], p[1]))); P.closePath();
  }
  ctx.save(); ctx.fillStyle = `rgba(18,22,44,${(0.36 * this.sol).toFixed(3)})`; ctx.fill(P); ctx.restore();
};
// luz do sol de dia: um toque quente e mais contraste (estilo cinema), por cima de tudo
Dia.luzSol = function (ctx, W, H) {
  if (this.sol < 0.04 || Settings.quality === 'baixa') return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = `rgba(255,200,130,${(0.42 * this.sol).toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  ctx.restore();
};

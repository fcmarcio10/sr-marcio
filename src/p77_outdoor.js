/* ============================ OUTDOORS (painel de propaganda com desenho e humor) ============================
   No lugar das placas verdes de rodovia e dos outdoors só com letra: painel grande em duas colunas de aço, com
   moldura, passarela embaixo, refletores em cima e propaganda desenhada no código (sem imagem de fora).
   A arte de cada outdoor é desenhada uma vez (imagem pronta) e reaproveitada a cada quadro. */
const OUTDOORS = [
  { marca: 'MOQUECA DA DONA PENHA', frase: 'Tão boa que o peixe volta pra pedir mais', c1: '#ff7a2a', c2: '#3a1406', arte: 'moqueca' },
  { marca: 'PEGAAÍ', frase: 'Seu motorista já está chegando. Um dia.', c1: '#ffd23f', c2: '#14161c', arte: 'caramujo' },
  { marca: 'GAMBIARRA FM 171,1', frase: 'Sintonia garantida (às vezes)', c1: '#ff4f8a', c2: '#20102a', arte: 'radio' },
  { marca: 'BOI NA BRASA', frase: 'Rodízio até o boi pedir arrego', c1: '#e8402a', c2: '#2a0f08', arte: 'boi' },
  { marca: 'BANESTRESSE', frase: 'Seu dinheiro rendendo... preocupação', c1: '#3a9be0', c2: '#0a1a2e', arte: 'porquinho' },
  { marca: 'POSTO TANQUE CHEIO', frase: 'Gasolina em 12x sem juros', c1: '#2bd36b', c2: '#06200f', arte: 'bomba' },
  { marca: 'OFICINA DO SEU ZÉ', frase: 'Se não tem conserto, tem fita', c1: '#ffb547', c2: '#1d1408', arte: 'fita' },
  { marca: 'COLCHÕES SONECA', frase: 'Durma bem. O trânsito te espera.', c1: '#9a7bff', c2: '#120c2a', arte: 'colchao' },
  { marca: 'AUTOESCOLA DO BIRA', frase: 'Baliza em 3 tentativas (ou 30)', c1: '#ffd23f', c2: '#1a1a1a', arte: 'baliza' },
  { marca: 'ACADEMIA BOMBADÃO', frase: 'Músculo de verdade, preço de mentira', c1: '#ff3b3b', c2: '#1a0606', arte: 'halter' },
];
const OD_W = 640, OD_H = 240;
const _odArte = new Map(); // uma arte por propaganda (vários outdoors e prédios podem usar a mesma)
function outdoorArte(o) {
  if (o.panel) return o.panel;
  const ja = _odArte.get((o.ad || 0) % OUTDOORS.length); if (ja) return (o.panel = ja);
  const A = OUTDOORS[(o.ad || 0) % OUTDOORS.length];
  const c = makeCanvas(OD_W, OD_H), g = c.getContext('2d');
  // fundo: degradê com faixas diagonais e brilho
  const bg = g.createLinearGradient(0, 0, OD_W, OD_H); bg.addColorStop(0, shade(A.c2, 0.25)); bg.addColorStop(1, A.c2);
  g.fillStyle = bg; g.fillRect(0, 0, OD_W, OD_H);
  g.save(); g.globalAlpha = 0.08; g.fillStyle = A.c1; for (let x = -OD_H; x < OD_W; x += 46) { g.beginPath(); g.moveTo(x, OD_H); g.lineTo(x + 22, OD_H); g.lineTo(x + 22 + OD_H, 0); g.lineTo(x + OD_H, 0); g.fill(); } g.restore();
  // círculo de destaque atrás do desenho
  const rg = g.createRadialGradient(130, 120, 10, 130, 120, 130); rg.addColorStop(0, shade(A.c1, 0.3)); rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = 0.55; g.fillStyle = rg; g.fillRect(0, 0, 280, OD_H); g.globalAlpha = 1;
  g.save(); g.translate(130, 124); OD_ARTE[A.arte](g, A); g.restore();
  // texto
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  const tx = 268, mw = OD_W - tx - 24;
  let fs = 60; g.font = `${fs}px "BRND Anton", Impact, sans-serif`; while (g.measureText(A.marca).width > mw && fs > 30) { fs -= 2; g.font = `${fs}px "BRND Anton", Impact, sans-serif`; }
  g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.strokeText(A.marca, tx, 104);
  g.fillStyle = '#ffffff'; g.fillText(A.marca, tx, 104);
  g.fillStyle = A.c1; g.fillRect(tx, 120, Math.min(mw, 120), 7);
  g.font = '700 30px "BRND Cond", "Arial Narrow", sans-serif'; g.fillStyle = shade(A.c1, 0.45);
  const pal = A.frase.split(' '), linhas = []; let L = '';
  for (const w of pal) { const t = L ? L + ' ' + w : w; if (g.measureText(t).width > mw && L) { linhas.push(L); L = w; } else L = t; }
  if (L) linhas.push(L);
  linhas.slice(0, 2).forEach((t, i) => g.fillText(t, tx, 162 + i * 34));
  // moldura e marcas de folha colada (papel de outdoor)
  g.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 160; x < OD_W; x += 160) g.fillRect(x, 0, 1.5, OD_H);
  const vg = g.createLinearGradient(0, 0, 0, OD_H); vg.addColorStop(0, 'rgba(255,255,255,0.10)'); vg.addColorStop(0.5, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = vg; g.fillRect(0, 0, OD_W, OD_H);
  _odArte.set((o.ad || 0) % OUTDOORS.length, c); o.panel = c; return c;
}
// ajudantes de desenho
const odRR = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const odEl = (g, x, y, rx, ry, cor, borda) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fillStyle = cor; g.fill(); if (borda) { g.lineWidth = 4; g.strokeStyle = borda; g.stroke(); } };
const odOlho = (g, x, y, r, olhar) => { odEl(g, x, y, r, r * 1.1, '#fff', '#111'); odEl(g, x + (olhar || 0) * r * 0.35, y + r * 0.15, r * 0.45, r * 0.5, '#111'); odEl(g, x + (olhar || 0) * r * 0.35 - r * 0.15, y, r * 0.15, r * 0.15, '#fff'); };
const odGota = (g, x, y, s) => { g.beginPath(); g.moveTo(x, y - 10 * s); g.quadraticCurveTo(x + 7 * s, y, x, y + 6 * s); g.quadraticCurveTo(x - 7 * s, y, x, y - 10 * s); g.fillStyle = '#9fe3ff'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#1a4a6a'; g.stroke(); };
const odSombra = (g, w) => odEl(g, 0, 88, w, 12, 'rgba(0,0,0,0.35)');
const OD_ARTE = {
  moqueca(g) {
    odSombra(g, 92);
    // vapor
    g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 6; g.lineCap = 'round';
    for (const x of [-34, 0, 34]) { g.beginPath(); g.moveTo(x, -40); g.bezierCurveTo(x - 16, -60, x + 16, -72, x, -96); g.stroke(); }
    // panela de barro
    g.beginPath(); g.moveTo(-86, -24); g.quadraticCurveTo(-90, 70, 0, 78); g.quadraticCurveTo(90, 70, 86, -24); g.closePath();
    const pg = g.createLinearGradient(-86, 0, 86, 0); pg.addColorStop(0, '#5a2a16'); pg.addColorStop(0.4, '#9a4a26'); pg.addColorStop(1, '#4a2010');
    g.fillStyle = pg; g.fill(); g.lineWidth = 5; g.strokeStyle = '#2a0f06'; g.stroke();
    odEl(g, 0, -24, 88, 20, '#c8401a', '#2a0f06'); // caldo
    for (const [x, y, r] of [[-40, -26, 9], [28, -20, 7], [52, -30, 6]]) odEl(g, x, y, r, r * 0.6, '#ffd23f'); // dendê
    odEl(g, -60, -18, 7, 4, '#3a9a3a'); odEl(g, 10, -32, 8, 4, '#3a9a3a'); // coentro
    // alças
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 96, -4, 14, 10, 0, 0, TAU); g.lineWidth = 7; g.strokeStyle = '#5a2a16'; g.stroke(); }
    // peixe saindo, feliz, fazendo joinha com a nadadeira
    g.save(); g.translate(16, -46); g.rotate(-0.5);
    g.beginPath(); g.ellipse(0, 0, 46, 20, 0, 0, TAU); g.fillStyle = '#7ab8d8'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#1a3a52'; g.stroke();
    g.beginPath(); g.moveTo(-40, 0); g.lineTo(-66, -18); g.lineTo(-62, 18); g.closePath(); g.fillStyle = '#5a9ac0'; g.fill(); g.stroke();
    odOlho(g, 24, -5, 7, 1); g.beginPath(); g.arc(34, 6, 6, 0.2, 2.4); g.stroke();
    g.restore();
  },
  caramujo(g) {
    odSombra(g, 100);
    // carro
    odRR(g, -96, 10, 192, 50, 16); g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#14161c'; g.stroke();
    odRR(g, -56, -18, 104, 36, 14); g.fillStyle = '#ffd23f'; g.fill(); g.stroke();
    g.fillStyle = '#9fd6ff'; odRR(g, -46, -10, 40, 22, 6); g.fill(); g.stroke(); odRR(g, 2, -10, 38, 22, 6); g.fill(); g.stroke();
    for (const x of [-58, 58]) { odEl(g, x, 62, 20, 20, '#1a1a1a'); odEl(g, x, 62, 8, 8, '#aaa'); }
    g.fillStyle = '#14161c'; g.font = '28px "BRND Anton", Impact'; g.textAlign = 'center'; g.fillText('PEGAAÍ', 0, 46);
    // casco de caramujo no teto
    g.save(); g.translate(-4, -46);
    odEl(g, 0, 0, 44, 36, '#c98a4a', '#3a2008');
    g.beginPath(); for (let a = 0; a < 12; a += 0.2) { const r = 34 - a * 2.6; const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.82; if (a === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.lineWidth = 4; g.strokeStyle = '#6a3a10'; g.stroke(); g.restore();
    // anteninhas e olhinhos de caramujo saindo do capô
    g.lineWidth = 4; g.strokeStyle = '#14161c'; for (const x of [84, 98]) { g.beginPath(); g.moveTo(90, 14); g.lineTo(x + 8, -26); g.stroke(); odEl(g, x + 8, -30, 6, 6, '#fff', '#14161c'); }
    // trilha de baba (brilho)
    g.strokeStyle = 'rgba(180,255,220,0.55)'; g.lineWidth = 6; g.beginPath(); g.moveTo(-100, 82); g.lineTo(-150, 84); g.stroke();
  },
  radio(g) {
    odSombra(g, 96);
    odRR(g, -100, -30, 200, 110, 18); const rg = g.createLinearGradient(0, -30, 0, 80); rg.addColorStop(0, '#d8d2c4'); rg.addColorStop(1, '#8a8478');
    g.fillStyle = rg; g.fill(); g.lineWidth = 5; g.strokeStyle = '#1a1a1a'; g.stroke();
    // alto-falantes
    for (const x of [-52, 52]) { odEl(g, x, 26, 34, 34, '#2a2a2a', '#111'); for (let r = 26; r > 4; r -= 7) { g.beginPath(); g.arc(x, 26, r, 0, TAU); g.lineWidth = 2; g.strokeStyle = '#444'; g.stroke(); } odEl(g, x, 26, 8, 8, '#666'); }
    odRR(g, -34, -18, 68, 22, 5); g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#111'; g.stroke();
    g.fillStyle = '#111'; g.font = '18px "BRND Anton", Impact'; g.textAlign = 'center'; g.fillText('171,1', 0, 0);
    // antena de cabide de arame
    g.lineWidth = 4; g.strokeStyle = '#c8c8c8'; g.beginPath(); g.moveTo(70, -30); g.lineTo(70, -60); g.moveTo(70, -60); g.lineTo(20, -96); g.lineTo(120, -96); g.lineTo(70, -60); g.stroke();
    g.beginPath(); g.arc(70, -66, 8, Math.PI, TAU * 0.9); g.stroke();
    // fita prateada segurando a tampa
    g.save(); g.rotate(-0.4); g.fillStyle = '#b8bcc4'; g.fillRect(-90, -12, 70, 18); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-90, -12, 70, 5); g.restore();
    // notas musicais tortas
    const nota = (x, y) => { odEl(g, x, y, 9, 7, '#fff'); g.fillStyle = '#fff'; g.fillRect(x + 6, y - 30, 4, 30); g.fillRect(x + 6, y - 30, 14, 5); };
    nota(-112, -50); g.save(); g.rotate(-0.3); nota(-70, -60); g.restore();
  },
  boi(g) {
    odSombra(g, 84);
    // corpo/cabeça do boi com guardanapo, suando
    odEl(g, 0, 0, 74, 70, '#f2efe8', '#1a1a1a');
    for (const [x, y, r] of [[-40, -30, 18], [36, 30, 22], [-20, 46, 12]]) odEl(g, x, y, r, r * 0.8, '#2a2a2a');
    // chifres
    g.lineWidth = 12; g.lineCap = 'round'; g.strokeStyle = '#e8d8a8'; g.beginPath(); g.moveTo(-50, -54); g.quadraticCurveTo(-90, -70, -96, -100); g.moveTo(50, -54); g.quadraticCurveTo(90, -70, 96, -100); g.stroke();
    // focinho
    odEl(g, 0, 30, 44, 28, '#f2a8a8', '#1a1a1a'); odEl(g, -14, 30, 6, 8, '#6a2a2a'); odEl(g, 14, 30, 6, 8, '#6a2a2a');
    odOlho(g, -26, -16, 12, 1); odOlho(g, 26, -16, 12, -1);
    // guardanapo no pescoço
    g.beginPath(); g.moveTo(-40, 62); g.lineTo(40, 62); g.lineTo(0, 100); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#d03030'; g.stroke();
    for (let i = 0; i < 4; i++) { g.fillStyle = '#d03030'; g.fillRect(-28 + i * 16, 66, 6, 6); }
    odGota(g, 70, -40, 1.6); odGota(g, -74, -10, 1.2);
    // garfo e faca
    g.lineWidth = 6; g.strokeStyle = '#c8ccd4'; g.beginPath(); g.moveTo(-100, 80); g.lineTo(-100, 10); g.moveTo(100, 80); g.lineTo(100, 10); g.stroke();
    for (const d of [-8, 0, 8]) { g.beginPath(); g.moveTo(-100 + d, 10); g.lineTo(-100 + d, -10); g.lineWidth = 3; g.stroke(); }
  },
  porquinho(g) {
    odSombra(g, 84);
    odEl(g, 0, 10, 86, 66, '#ff9fc0', '#5a1a30');
    odEl(g, 66, 6, 24, 20, '#ffb8d0', '#5a1a30'); odEl(g, 60, 6, 4, 6, '#5a1a30'); odEl(g, 72, 6, 4, 6, '#5a1a30');
    for (const x of [-46, -16, 22, 50]) { odRR(g, x - 9, 60, 18, 30, 6); g.fillStyle = '#ff8fb4'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#5a1a30'; g.stroke(); }
    g.beginPath(); g.moveTo(-20, -40); g.lineTo(-40, -76); g.lineTo(0, -54); g.fillStyle = '#ff8fb4'; g.fill(); g.stroke();
    g.fillStyle = '#5a1a30'; g.fillRect(-30, -50, 40, 8); // fenda da moeda
    odOlho(g, 34, -14, 10, 1);
    // lágrima e curativo
    odGota(g, 46, 10, 1.3);
    g.save(); g.translate(-30, 10); g.rotate(0.5); odRR(g, -24, -9, 48, 18, 8); g.fillStyle = '#e8c8a0'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#8a6a4a'; g.stroke(); g.restore();
    // uma moedinha só, caindo
    odEl(g, -96, -60, 16, 16, '#ffd23f', '#8a6a10'); g.fillStyle = '#8a6a10'; g.font = '20px "BRND Anton", Impact'; g.textAlign = 'center'; g.fillText('1', -96, -52);
  },
  bomba(g) {
    odSombra(g, 70);
    odRR(g, -60, -80, 110, 166, 14); const bg = g.createLinearGradient(-60, 0, 50, 0); bg.addColorStop(0, '#1fa356'); bg.addColorStop(1, '#0e6a34');
    g.fillStyle = bg; g.fill(); g.lineWidth = 5; g.strokeStyle = '#06200f'; g.stroke();
    odRR(g, -44, -64, 78, 44, 6); g.fillStyle = '#0a0f0a'; g.fill();
    g.fillStyle = '#ff3b3b'; g.font = '28px "BRND Anton", Impact'; g.textAlign = 'center'; g.fillText('R$ 9,99', -5, -32);
    // rosto preocupado
    odOlho(g, -24, 4, 9, 0); odOlho(g, 14, 4, 9, 0); g.beginPath(); g.arc(-5, 44, 16, Math.PI * 1.15, Math.PI * 1.85); g.lineWidth = 4; g.strokeStyle = '#06200f'; g.stroke();
    // mangueira e maquininha de cartão
    g.lineWidth = 8; g.strokeStyle = '#1a1a1a'; g.beginPath(); g.moveTo(50, -40); g.bezierCurveTo(110, -40, 110, 30, 84, 50); g.stroke();
    g.save(); g.translate(96, 16); g.rotate(0.25); odRR(g, -22, -34, 44, 68, 8); g.fillStyle = '#2a2d36'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#000'; g.stroke();
    g.fillStyle = '#7ad0ff'; g.fillRect(-15, -26, 30, 18); g.fillStyle = '#ddd'; for (let i = 0; i < 6; i++) g.fillRect(-14 + (i % 3) * 10, 0 + Math.floor(i / 3) * 10, 7, 6);
    g.fillStyle = '#111'; g.font = '13px "BRND Cond", sans-serif'; g.fillText('12x', 0, -12); g.restore();
  },
  fita(g) {
    odSombra(g, 100);
    // carrinho velho todo remendado com fita prateada
    odRR(g, -100, 0, 200, 54, 14); g.fillStyle = '#c84a2a'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#1d1408'; g.stroke();
    odRR(g, -58, -30, 104, 38, 12); g.fillStyle = '#c84a2a'; g.fill(); g.stroke();
    g.fillStyle = '#9fd6ff'; odRR(g, -48, -22, 40, 24, 5); g.fill(); g.stroke(); odRR(g, 0, -22, 36, 24, 5); g.fill(); g.stroke();
    for (const x of [-60, 60]) { odEl(g, x, 56, 20, 20, '#1a1a1a'); odEl(g, x, 56, 8, 8, '#999'); }
    const fita = (x, y, w, a) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#b8bcc4'; g.fillRect(-w / 2, -8, w, 16); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(-w / 2, -8, w, 4); g.restore(); };
    fita(-20, 20, 90, 0.3); fita(40, 26, 70, -0.5); fita(-10, -10, 60, 0.9); fita(80, 10, 40, 1.2);
    // para-choque caído preso com arame
    g.lineWidth = 3; g.strokeStyle = '#888'; g.beginPath(); g.moveTo(96, 40); g.lineTo(110, 70); g.stroke();
    g.fillStyle = '#555'; g.fillRect(96, 66, 40, 8);
    // chave de boca
    g.save(); g.translate(-96, -60); g.rotate(-0.6); g.fillStyle = '#c8ccd4'; g.fillRect(-6, -40, 12, 80); g.beginPath(); g.arc(0, -46, 16, 0, TAU); g.fill();
    g.fillStyle = A_BG; g.fillRect(-6, -66, 12, 20); g.restore();
  },
  colchao(g) {
    odSombra(g, 110);
    // colchão com um cara dormindo, tampando os ouvidos de felicidade
    odRR(g, -110, 10, 220, 56, 16); g.fillStyle = '#e8e4ff'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#120c2a'; g.stroke();
    g.strokeStyle = 'rgba(120,100,200,0.5)'; g.lineWidth = 2; for (let x = -90; x < 110; x += 30) { g.beginPath(); g.moveTo(x, 14); g.lineTo(x, 62); g.stroke(); }
    odRR(g, -100, -14, 70, 30, 12); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#120c2a'; g.stroke(); // travesseiro
    odEl(g, -62, -14, 26, 24, '#e8b48a', '#120c2a'); // cabeça
    g.beginPath(); g.arc(-70, -16, 6, 0.2, Math.PI - 0.2); g.lineWidth = 3; g.stroke(); g.beginPath(); g.arc(-52, -16, 6, 0.2, Math.PI - 0.2); g.stroke();
    odRR(g, -40, -10, 140, 30, 12); g.fillStyle = '#9a7bff'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#120c2a'; g.stroke(); // coberta
    g.fillStyle = '#fff'; g.font = '44px "BRND Anton", Impact'; g.textAlign = 'center'; g.fillText('Z', -10, -50); g.font = '34px "BRND Anton", Impact'; g.fillText('z', 24, -76); g.font = '26px "BRND Anton", Impact'; g.fillText('z', 50, -96);
    // lua
    g.beginPath(); g.arc(90, -70, 22, 0, TAU); g.fillStyle = '#ffe58a'; g.fill(); g.beginPath(); g.arc(100, -78, 20, 0, TAU); g.fillStyle = '#120c2a'; g.fill();
  },
  baliza(g) {
    odSombra(g, 110);
    // vaga com cones e o carro todo torto, um cone amassado
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.setLineDash([16, 12]); g.beginPath(); g.moveTo(-110, 76); g.lineTo(110, 76); g.stroke(); g.setLineDash([]);
    const cone = (x, y, a) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(-14, 20); g.lineTo(0, -26); g.lineTo(14, 20); g.closePath(); g.fillStyle = '#ff7a1a'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#3a1a06'; g.stroke(); g.fillStyle = '#fff'; g.fillRect(-8, -4, 16, 6); g.fillRect(-18, 18, 36, 6); g.restore(); };
    cone(-100, 50, 0); cone(100, 50, 0); cone(64, 70, 1.4);
    g.save(); g.rotate(0.32); odRR(g, -70, -10, 140, 50, 14); g.fillStyle = '#3a9be0'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#0a1a2e'; g.stroke();
    odRR(g, -40, -34, 80, 30, 10); g.fill(); g.stroke(); g.fillStyle = '#9fd6ff'; odRR(g, -32, -28, 28, 20, 4); g.fill(); odRR(g, 4, -28, 28, 20, 4); g.fill();
    for (const x of [-42, 42]) { odEl(g, x, 42, 15, 15, '#1a1a1a'); odEl(g, x, 42, 6, 6, '#999'); }
    odRR(g, -24, -66, 48, 22, 4); g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#111'; g.stroke(); g.fillStyle = '#111'; g.font = '18px "BRND Anton", Impact'; g.textAlign = 'center'; g.fillText('AUTO', 0, -49);
    g.restore();
    g.fillStyle = '#fff'; g.font = '38px "BRND Anton", Impact'; g.textAlign = 'center'; g.fillText('?!', 96, -50);
  },
  halter(g) {
    odSombra(g, 100);
    // halter tão pesado que a barra entorta, com gotas de suor
    g.lineWidth = 14; g.lineCap = 'round'; g.strokeStyle = '#c8ccd4'; g.beginPath(); g.moveTo(-80, 10); g.quadraticCurveTo(0, 50, 80, 10); g.stroke();
    for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) { odRR(g, s * (74 + k * 14) - 9, -36 + k * 4, 18, 92 - k * 8, 6); g.fillStyle = k % 2 ? '#3a3a3a' : '#1a1a1a'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#000'; g.stroke(); } }
    g.fillStyle = '#ff3b3b'; g.font = '30px "BRND Anton", Impact'; g.textAlign = 'center'; g.fillText('500 KG', 0, -40);
    odGota(g, -40, -60, 1.4); odGota(g, 44, -70, 1.1); odGota(g, 10, 80, 1.2);
    g.strokeStyle = '#fff'; g.lineWidth = 4; for (const a of [-0.6, 0, 0.6]) { g.beginPath(); g.moveTo(Math.sin(a) * 70, 70 - Math.cos(a) * 10); g.lineTo(Math.sin(a) * 90, 88); g.stroke(); }
  },
};
const A_BG = '#1d1408';
// desenho do outdoor no mundo (nov/2026: menor, no meio do pasto e meio de lado, como na beira de estrada do Brasil):
// sombra no chão, duas colunas de aço com reforço, painel com moldura, passarela e refletores — tudo girado em o.rot
const OD_PW = 104, OD_PH = 39;
function desenhaOutdoor(ctx, o) {
  const [ox, oy] = offAt(o.x, o.y, o.h), rot = o.rot || 0, c = Math.cos(rot), s = Math.sin(rot);
  const W = OD_PW, H = OD_PH, px = o.x + ox, py = o.y + oy, pe = W * 0.3;
  // sombra no chão (o painel deitado pelo sol, de leve)
  ctx.save(); ctx.translate(o.x + 8, o.y + 7); ctx.rotate(rot); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-W / 2, -4, W, 9); ctx.restore();
  // colunas do chão até o painel (cilindro: escuro + brilho)
  for (const k of [-1, 1]) {
    const bx = o.x + c * pe * k, by = o.y + s * pe * k, tx = px + c * pe * k - s * (H / 2 - 3), ty = py + s * pe * k + c * (H / 2 - 3);
    ctx.strokeStyle = '#2e3136'; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.strokeStyle = '#7a8088'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx - 1, by); ctx.lineTo(tx - 1, ty); ctx.stroke();
    ctx.fillStyle = '#6e6658'; ctx.beginPath(); ctx.ellipse(bx, by, 4.5, 3, rot, 0, TAU); ctx.fill(); // sapata de concreto
  }
  ctx.save(); ctx.translate(px, py); ctx.rotate(rot);
  ctx.fillStyle = '#1b1d21'; ctx.fillRect(-W / 2 + 2, -H / 2 + 3, W, H); // fundo (profundidade)
  ctx.drawImage(outdoorArte(o), -W / 2, -H / 2, W, H);
  ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = 2; ctx.strokeRect(-W / 2, -H / 2, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-W / 2 + 1, -H / 2 + 1); ctx.lineTo(W / 2 - 1, -H / 2 + 1); ctx.stroke();
  ctx.fillStyle = '#3a3d42'; ctx.fillRect(-W / 2 - 1, H / 2, W + 2, 3); // passarela
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = -W / 2; x < W / 2; x += 5) ctx.fillRect(x, H / 2 + 0.8, 0.8, 1.5);
  ctx.strokeStyle = '#3a3d42'; ctx.lineWidth = 1.1; ctx.fillStyle = '#4a4e55';
  for (const k of [-0.3, 0.3]) { const x = k * W; ctx.beginPath(); ctx.moveTo(x, -H / 2); ctx.lineTo(x, -H / 2 - 5); ctx.stroke(); ctx.fillRect(x - 3, -H / 2 - 7.5, 6, 3); }
  ctx.restore();
}
// de noite: dois refletores acesos lavando o painel de luz
function outdoorLuz(ctx, o) {
  if (Dia.apaga > 0.6) return;
  const [ox, oy] = offAt(o.x, o.y, o.h), W = OD_PW, H = OD_PH, px = o.x + ox, py = o.y + oy, k = 1 - Dia.apaga;
  ctx.save(); ctx.translate(px, py); ctx.rotate(o.rot || 0);
  ctx.globalAlpha = 0.5 * k; ctx.drawImage(outdoorArte(o), -W / 2, -H / 2, W, H);
  const lg = ctx.createLinearGradient(0, -H / 2, 0, H / 2); lg.addColorStop(0, 'rgba(255,245,215,0.35)'); lg.addColorStop(1, 'rgba(255,245,215,0)');
  ctx.globalAlpha = k; ctx.fillStyle = lg; ctx.fillRect(-W / 2, -H / 2, W, H);
  for (const x of [-0.3, 0.3]) ctx.drawImage(glowSprite('#fff4d8'), x * W - 7, -H / 2 - 13, 14, 14);
  ctx.restore();
}

/* ---------- propaganda pintada na parede de prédio (empena) ---------- */
const _empArte = new Map();
function empenaArte(i) {
  let c = _empArte.get(i); if (c) return c;
  const A = OUTDOORS[i % OUTDOORS.length], W = 360, H = 300; c = makeCanvas(W, H); const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, shade(A.c2, 0.3)); bg.addColorStop(1, A.c2); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.1; g.fillStyle = A.c1; for (let x = -H; x < W; x += 40) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + 18, H); g.lineTo(x + 18 + H, 0); g.lineTo(x + H, 0); g.fill(); } g.restore();
  g.save(); g.translate(W / 2, 118); g.scale(0.85, 0.85); OD_ARTE[A.arte](g, A); g.restore();
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  let fs = 46; g.font = `${fs}px "BRND Anton", Impact, sans-serif`; while (g.measureText(A.marca).width > W - 30 && fs > 22) { fs -= 2; g.font = `${fs}px "BRND Anton", Impact, sans-serif`; }
  g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.strokeText(A.marca, W / 2, 252); g.fillStyle = '#fff'; g.fillText(A.marca, W / 2, 252);
  g.fillStyle = A.c1; g.fillRect(W / 2 - 50, 264, 100, 6);
  g.font = '700 20px "BRND Cond", "Arial Narrow", sans-serif'; g.fillStyle = shade(A.c1, 0.5); g.fillText(A.frase, W / 2, 290, W - 24);
  // pintura velha: bordas gastas
  g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 8; g.strokeRect(0, 0, W, H);
  _empArte.set(i, c); return c;
}
// pinta a propaganda na parede N ou S (no N direto; no S girado 180°, para ler certo na tela)
function empenaPinta(ctx, b, ax, ay, bx, by, ox, oy, side) {
  if (Math.hypot(ox, oy) < 3) return;
  const u0 = 0.14, u1 = 0.86, v0 = 0.18, v1 = 0.9;
  ctx.save(); ctx.transform(bx - ax, by - ay, ox, oy, ax, ay);
  const art = empenaArte(b.empena);
  if (side === 'N') ctx.drawImage(art, u0, v0, u1 - u0, v1 - v0);
  else { ctx.translate(u1, v1); ctx.scale(-1, -1); ctx.drawImage(art, 0, 0, u1 - u0, v1 - v0); }
  ctx.restore();
}

/* ---------- painel de propaganda em cima do prédio (comum nas capitais) ---------- */
function topoGeo(b) {
  const W = Math.min(96, (b.x1 - b.x0) * 0.78), H = W * OD_PH / OD_PW, cy = b.y0 + (b.y1 - b.y0) * 0.62, cx = (b.x0 + b.x1) / 2;
  return { W, H, cx, cy };
}
function desenhaTopo(ctx, b) {
  const T = topoGeo(b), [rx, ry] = bldOffset(b), h2 = b.h + 16, [px, py] = offAt(T.cx, T.cy, h2), k = b.h / h2;
  // pés de aço saindo da laje (laje = deslocamento do prédio) até o painel
  ctx.strokeStyle = '#2e3136'; ctx.lineWidth = 2.6;
  for (const f of [-0.32, 0.32]) { ctx.beginPath(); ctx.moveTo(T.cx + f * T.W + rx, T.cy + ry); ctx.lineTo(T.cx + f * T.W + px, T.cy + py + T.H / 2 - 2); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(T.cx + rx - T.W / 2 + 4, T.cy + ry - 2, T.W, 5); // sombra na laje
  ctx.fillStyle = '#1b1d21'; ctx.fillRect(T.cx + px - T.W / 2 + 2, T.cy + py - T.H / 2 + 2, T.W, T.H);
  ctx.drawImage(outdoorArte({ ad: b.empena }), T.cx + px - T.W / 2, T.cy + py - T.H / 2, T.W, T.H);
  ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = 1.6; ctx.strokeRect(T.cx + px - T.W / 2, T.cy + py - T.H / 2, T.W, T.H);
}
function topoLuz(ctx, b) {
  if (Dia.apaga > 0.6) return;
  const T = topoGeo(b), [px, py] = offAt(T.cx, T.cy, b.h + 16);
  ctx.save(); ctx.globalAlpha = 0.45 * (1 - Dia.apaga); ctx.drawImage(outdoorArte({ ad: b.empena }), T.cx + px - T.W / 2, T.cy + py - T.H / 2, T.W, T.H); ctx.restore();
}

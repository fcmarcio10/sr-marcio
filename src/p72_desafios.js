/* ============================ DESAFIOS DIÁRIOS ============================
   Três desafios por dia, sorteados pela data de hoje (todo mundo que joga no mesmo dia recebe os mesmos).
   Cada um paga um prêmio; fazer os três dá um bônus. Viram no dia seguinte (meia-noite do relógio do computador).
   Salvo em Profile.des = { dia, lista: [ids], prog: {id: n}, feito: {id: hora}, bonus }.
   Contagem: Desafios.conta(tipo, n, info) nos ganchos (corrida, entrega, percurso, ajuda, panela, racha, batida)
   e Desafios.update(dt) para os que medem direção (km, velocidade, derrapagem, chuva, rodovia, sem bater). */
const DESAFIOS = [
  { id: 'corridas3', txt: 'Faça 3 corridas no PegaAí', alvo: 3, premio: 400, tipo: 'corrida' },
  { id: 'nota5', txt: 'Faça 2 corridas com nota 5', alvo: 2, premio: 500, tipo: 'corrida5' },
  { id: 'entregas3', txt: 'Faça 3 entregas ou fretes', alvo: 3, premio: 450, tipo: 'entrega', trava: 'entregas' },
  { id: 'prazo2', txt: 'Entregue 2 cargas no prazo', alvo: 2, premio: 550, tipo: 'prazo', trava: 'entregas' },
  { id: 'km10', txt: 'Rode 10 km pela cidade', alvo: 10, premio: 350, tipo: 'km', un: 'km' },
  { id: 'br5', txt: 'Rode 5 km na rodovia', alvo: 5, premio: 400, tipo: 'kmBR', un: 'km' },
  { id: 'semBater', txt: 'Rode 4 km sem bater em nada', alvo: 4, premio: 600, tipo: 'semBater', un: 'km' },
  { id: 'veloz', txt: 'Chegue a 150 km/h', alvo: 1, premio: 300, tipo: 'veloz' },
  { id: 'drift', txt: 'Derrape de lado por 8 segundos', alvo: 8, premio: 450, tipo: 'drift', un: 's' },
  { id: 'ajuda1', txt: 'Ajude alguém num pedido de ajuda', alvo: 1, premio: 500, tipo: 'ajuda', trava: 'eventos' },
  { id: 'percurso1', txt: 'Termine um percurso cronometrado', alvo: 1, premio: 450, tipo: 'percurso', trava: 'percursos' },
  { id: 'panela1', txt: 'Ache uma panela de barro escondida', alvo: 1, premio: 400, tipo: 'panela' },
  { id: 'racha1', txt: 'Ganhe um racha de madrugada', alvo: 1, premio: 700, tipo: 'racha', trava: 'racha' },
  { id: 'ganho', txt: 'Ganhe R$ 1.500 hoje', alvo: 1500, premio: 500, tipo: 'ganho', un: 'R$' },
];
const DES_BONUS = 1000;
const DES_POR_ID = Object.fromEntries(DESAFIOS.map((d) => [d.id, d]));
const Desafios = { kmPassado: 0, avisoT: 0 };
Desafios.hoje = function () { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
// sorteio do dia: a data vira a semente (o sorteio do mapa não é tocado)
Desafios.sorteia = function (dia) {
  let s = 0; for (const ch of dia) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const R = mulberry32(s ^ 0x5eed), pool = DESAFIOS.filter((d) => this.ativo(d.id)), out = []; // só o que já está liberado pela história
  // um de trabalho, um de direção e um qualquer: o dia fica variado
  const trab = ['corridas3', 'nota5', 'entregas3', 'prazo2', 'ganho'], dir = ['km10', 'br5', 'semBater', 'veloz', 'drift'];
  const pega = (lista) => { const ops = pool.filter((d) => lista.includes(d.id) && !out.includes(d.id)); if (ops.length) out.push(ops[Math.floor(R() * ops.length)].id); };
  pega(trab); pega(dir); pega(pool.map((d) => d.id));
  return out;
};
Desafios.d = function () {
  const hoje = this.hoje();
  if (!Profile.des || Profile.des.dia !== hoje) Profile.des = { dia: hoje, lista: this.sorteia(hoje), prog: {}, feito: {}, bonus: false };
  return Profile.des;
};
// o desafio está valendo? (se a função ainda está travada pela história, ele espera: aparece com cadeado)
Desafios.ativo = function (id) { const d = DES_POR_ID[id]; return !d.trava || (typeof liberado !== 'function' || liberado(d.trava)); };
Desafios.conta = function (tipo, n, abs) {
  if (Game.mode !== 'play' || !Profile) return;
  const D = this.d();
  for (const id of D.lista) {
    const d = DES_POR_ID[id]; if (!d || d.tipo !== tipo || D.feito[id] || !this.ativo(id)) continue;
    D.prog[id] = abs ? Math.max(D.prog[id] || 0, n) : (D.prog[id] || 0) + (n === undefined ? 1 : n);
    if (D.prog[id] >= d.alvo) this.cumpre(id);
  }
};
Desafios.zera = function (tipo) { const D = this.d(); for (const id of D.lista) if (DES_POR_ID[id].tipo === tipo && !D.feito[id]) D.prog[id] = 0; };
Desafios.cumpre = function (id) {
  const D = this.d(), d = DES_POR_ID[id]; if (D.feito[id]) return;
  D.prog[id] = d.alvo; D.feito[id] = clockStr();
  pay(d.premio);
  const todos = D.lista.every((x) => D.feito[x]);
  if (todos && !D.bonus) { D.bonus = true; pay(DES_BONUS); Missao.passou('Desafios do dia completos', 'Os três desafios de hoje. Amanhã tem mais!', d.premio + DES_BONUS); if (typeof confete === 'function') confete(70); }
  else Missao.passou('Desafio cumprido', d.txt, d.premio);
  if (typeof saveGame === 'function') saveGame();
  if (Phone.app === 'desafios' && Screens.current === 'screen-phone') Phone.render();
};
// direção: medido a cada passo do jogo
Desafios.update = function (dt) {
  if (!player || Game.mode !== 'play') return;
  const D = this.d(), km = (Profile.distance || 0) * 0.09 / 1000, dk = Math.max(0, km - (this.kmPassado || km));
  this.kmPassado = km;
  const kmh = player.speed * 0.3;
  if (dk > 0 && dk < 0.05) {
    this.conta('km', dk);
    if (regionKeyAt(player.x, player.y) === 'rodovia') this.conta('kmBR', dk);
    this.conta('semBater', dk);
  }
  if (kmh >= 150) this.conta('veloz', 1, true);
  if (player.slip > 0.5 && kmh > 35) this.conta('drift', dt);
  this.conta('ganho', Math.max(0, (Profile.earned || 0) - (D.ganho0 === undefined ? (D.ganho0 = Profile.earned || 0) : D.ganho0)), true);
};
// batida forte zera o "sem bater"
Desafios.bateu = function () { this.zera('semBater'); };
// quanto falta para trocar (meia-noite)
Desafios.faltaTxt = function () {
  const a = new Date(), b = new Date(a); b.setHours(24, 0, 0, 0);
  const m = Math.max(1, Math.round((b - a) / 60000)), h = Math.floor(m / 60);
  return h ? h + ' h ' + (m % 60) + ' min' : m + ' min';
};
const fmtProg = (d, v) => d.un === 'km' ? v.toFixed(1).replace('.', ',') + ' de ' + d.alvo + ' km' : d.un === 's' ? Math.floor(v) + ' de ' + d.alvo + ' s' : d.un === 'R$' ? 'R$ ' + fmtMoney(Math.floor(v)) + ' de R$ ' + fmtMoney(d.alvo) : Math.floor(v) + ' de ' + d.alvo;
function desafiosHTML() {
  const D = Desafios.d(), feitos = D.lista.filter((x) => D.feito[x]).length;
  let h = '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Desafios</div>' +
    `<div class="des-top"><b>${feitos} de 3</b><span>feitos hoje · novos em ${Desafios.faltaTxt()}</span></div>`;
  for (const id of D.lista) {
    const d = DES_POR_ID[id], ok = !!D.feito[id], trav = !Desafios.ativo(id), v = Math.min(d.alvo, D.prog[id] || 0);
    h += `<div class="des${ok ? ' ok' : ''}${trav ? ' trav' : ''}"><div class="des-txt"><b>${escapeHtml(d.txt)}</b>` +
      (trav ? '<small>Libera mais adiante na história</small>' : ok ? `<small>Feito às ${escapeHtml(D.feito[id])}</small>` : `<small>${fmtProg(d, v)}</small><div class="ach-bar sm"><i style="width:${(v / d.alvo * 100).toFixed(0)}%"></i></div>`) +
      `</div><em>R$ ${fmtMoney(d.premio)}</em></div>`;
  }
  h += `<div class="des-bonus${D.bonus ? ' ok' : ''}"><b>Bônus dos três</b><em>${D.bonus ? 'Recebido' : 'R$ ' + fmtMoney(DES_BONUS)}</em></div>`;
  return h;
}

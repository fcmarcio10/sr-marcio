/* ============================ PLACAR DE RECORDES (0.2.0) ============================
   Cada percurso e cada racha tem um placar com motoristas inventados da cidade (tempos fixos, escolhidos pelo id do
   percurso: sempre os mesmos) e o seu melhor tempo no meio deles. Aparece:
   - no app Recordes do celular (todos os percursos e rachas, o seu tempo destacado);
   - no fim do percurso/racha (a posição que você ficou: "3º lugar no placar");
   - ao começar (o recorde da cidade que você precisa bater). */
const REC_PILOTOS = ['Bia Turbo', 'Rafa Drift', 'Lucão Escapamento', 'Dona Neide do Fusca', 'Wesley Grau', 'Cris Motoca', 'Tio Barbosa', 'Kelvin Rebaixado', 'Duda Nitro', 'Seu Valdir', 'Thaís Pé de Chumbo', 'Marquinho Retífica', 'Jéssica Arrancada', 'Gordinho do Kart'];
const Recordes = {};
// lista de motoristas e tempos de um percurso ou racha (sem você), do mais rápido ao mais lento
Recordes.base = function (r) {
  if (r._rec) return r._rec;
  const R = mulberry32([...r.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0), nomes = REC_PILOTOS.slice(), out = [];
  const ref = r.racha ? r.rivalTime : r.gold, n = 6;
  if (r.racha) out.push({ nome: r.rival, t: r.rivalTime }); // o rival do racha está no placar com o tempo dele
  for (let i = out.length; i < n; i++) {
    const nome = nomes.splice(Math.floor(R() * nomes.length), 1)[0];
    out.push({ nome, t: ref * (0.9 + i * 0.07 + R() * 0.05) }); // o 1º é um pouco melhor que o ouro (ou que o rival)
  }
  out.sort((a, b) => a.t - b.t);
  return (r._rec = out);
};
Recordes.meu = function (r) {
  const v = r.racha ? (Profile.rachaBest || {})[r.id] : (Profile.races[r.id] || {}).best;
  return isFinite(v) ? v : null;
};
// placar completo com você no meio (se já correu)
Recordes.tabela = function (r) {
  const L = this.base(r).map((x) => Object.assign({}, x)), m = this.meu(r);
  if (m) L.push({ nome: 'Você', t: m, eu: true });
  return L.sort((a, b) => a.t - b.t);
};
Recordes.posicao = function (r, t) { return this.base(r).filter((x) => x.t < t).length + 1; };
// guarda o melhor tempo do racha (o do percurso já fica em Profile.races)
Recordes.racha = function (r, t) { Profile.rachaBest = Profile.rachaBest || {}; if (!(Profile.rachaBest[r.id] <= t)) Profile.rachaBest[r.id] = t; };
// app Recordes do celular
Recordes.html = function () {
  const sec = (r) => {
    const T = this.tabela(r), meu = T.findIndex((x) => x.eu);
    const linhas = T.slice(0, 5).map((x, i) => `<div class="rc-l${x.eu ? ' eu' : ''}"><i>${i + 1}</i><span>${escapeHtml(x.nome)}</span><em>${fmtTime(x.t)}</em></div>`).join('') +
      (meu >= 5 ? `<div class="rc-l eu"><i>${meu + 1}</i><span>Você</span><em>${fmtTime(T[meu].t)}</em></div>` : '') +
      (meu < 0 ? '<div class="rc-vazio">Você ainda não correu aqui</div>' : '');
    return `<div class="rc-card"><div class="rc-tit"><b>${escapeHtml(r.name)}</b><small>${r.racha ? 'Racha · das 22h às 4h30' : 'Percurso'}</small></div>${linhas}</div>`;
  };
  return '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Recordes</div>' +
    '<div class="rc-sub">Percursos</div>' + World.races.map(sec).join('') +
    '<div class="rc-sub">Rachas</div>' + (World.rachas || []).map(sec).join('');
};

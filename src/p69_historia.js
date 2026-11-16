/* ============================ HISTÓRIA: O CARRO DOS SONHOS ============================
   7 capítulos + o final. No fundo da oficina do Seu Zé tem um Opalha 6C preto à venda (R$ 35.000; R$ 29.000 com o
   desconto de quem ajudou o Juninho, o dono do outro Opalha, que empresta o carro dele para o racha):
   cada capítulo abre com um áudio do Seu Zé no zap, tem uma meta, paga um prêmio e leva ao próximo.
   O progresso conta a partir do começo do capítulo (Profile.hist = { cap, base }). */
const SONHO = 'brasa'; // Opalha 6C
const CAP_FINAL = 7; // índice do final (os capítulos vão de 0 a 6)
const capNome = (i) => (i >= CAP_FINAL ? 'Final' : 'Capítulo ' + (i + 1));
// preço do Opalha: R$ 35.000; quem ajudou o Juninho paga R$ 29.000
const OPALHA_CHEIO = 35000, OPALHA_AMIGO = 29000;
function precoCarro(c) { return c && c.id === SONHO && Profile.hist && Profile.hist.juninho ? OPALHA_AMIGO : c ? c.price : 0; }
function descontoCarro(c) { return c ? c.price - precoCarro(c) : 0; }
const corridasDe = () => Profile.rides || 0;
const HIST_CAPS = [
  { nome: 'Chegada', leg: 'Siga o <b>Seu Zé</b> no passo a passo.', dica: '', meta: 'Termine o passo a passo com o Seu Zé.', voz: null, premio: 200,
    val: () => (Profile.tut === undefined || Profile.tut >= TUT_STEPS.length ? 1 : 0), alvo: 1, absoluto: true },
  { nome: 'Ganha-pão', leg: 'Faça <b>5 corridas</b> no <b>PegaAí</b>.', dica: 'Abra o celular com <kbd>Q</kbd> e fique <b>online</b> no PegaAí.', meta: 'Faça corridas no PegaAí.', voz: 'cap_2', premio: 400, val: corridasDe, alvo: 5 },
  { nome: 'Entregador da madrugada', leg: 'Faça <b>3 entregas</b> dos comércios ou fretes.', dica: 'Comércios com marcador <b>amarelo</b> têm entrega: pare na frente e aperte <kbd>E</kbd>. Fretes ficam no app <b>Fretes</b>.', meta: 'Faça entregas dos comércios ou fretes.', voz: 'cap_3', premio: 500, val: () => Profile.deliveries || 0, alvo: 3 },
  { nome: 'Socorro na madrugada', leg: 'Ajude <b>2 pessoas</b> nos eventos da cidade.', dica: 'Quando chegar um pedido de ajuda na tela, aperte <kbd>Y</kbd> para aceitar.', meta: 'Ajude gente nos eventos da cidade (fique de olho no celular).', voz: 'cap_4', premio: 700, val: () => Profile.evTotal || 0, alvo: 2 },
  { nome: 'A estrada da roça', leg: 'Vá até a <b>fazenda</b> e termine o <b>Rali da Vaca Atolada</b>.', dica: 'O <b>GPS</b> já marca a largada do rali. Pare na bandeira e aperte <kbd>E</kbd>.', meta: 'Termine o Rali da Vaca Atolada, lá na fazenda.', voz: 'cap_5', premio: 900,
    val: () => Profile.histRali || 0, alvo: 1, absoluto: true,
    alvoMapa: () => { const r = World.races.find((q) => q.id === 'fazenda'); return r && { x: r.start[0], y: r.start[1], label: 'Rali da Vaca Atolada' }; } },
  { nome: 'O dono do Opalha', leg: 'O Opalha do <b>Juninho</b> morreu na rua: vá lá e dê uma <b>chupeta</b>.', dica: 'O Gou Quadrado não ganha do carro do Zé do Canecão. Ajude o <b>Juninho</b> e ele te empresta o <b>Opalha</b> pro racha.', meta: 'Ajude o Juninho com o Opalha parado (siga o ponto rosa).', voz: 'cap_opalha', premio: 600,
    val: () => (Profile.hist && Profile.hist.juninho ? 1 : 0), alvo: 1, absoluto: true },
  { nome: 'Tudo ou nada', leg: 'Ganhe o <b>racha</b> do <b>Zé do Canecão</b> com o Opalha emprestado.', dica: 'Rachas acontecem das <b>22h às 4h30</b>. Veja no app <b>Racha</b> do celular. Depois o Opalha volta pro Juninho.', meta: 'Ganhe um racha de madrugada (das 22h às 4h30) com o Opalha do Juninho.', voz: 'cap_6', premio: 1500, val: () => Profile.rachaWins || 0, alvo: 1 },
  { nome: 'O carro dos sonhos', leg: 'Junte o dinheiro e compre o <b>Opalha 6C</b> na garagem.', dica: 'O Opalha custa <b>R$ 35.000</b>, mas quem ajudou o Juninho paga <b>R$ 29.000</b>. Compre na <b>garagem</b>.', meta: 'Junte o dinheiro e compre o Opalha 6C na sua garagem.', voz: 'cap_7', premio: 0,
    val: () => (Profile.owned && Profile.owned[SONHO] ? 1 : 0), alvo: 1, absoluto: true,
    extra: () => { const pr = precoCarro(carById(SONHO)); return 'R$ ' + fmtMoney(Math.max(0, Math.min(Profile.money, pr))) + ' de R$ ' + fmtMoney(pr) + (descontoCarro(carById(SONHO)) ? ' (com desconto)' : ''); } },
];
const Historia = {
  t: 0, popT: 0,
  h() {
    if (!Profile.hist) {
      // quem já jogava antes da história começa no capítulo 2 (o passo a passo não existia)
      const veterano = Profile.tut === undefined && (Profile.rides || Profile.deliveries || Profile.earned);
      Profile.hist = { cap: veterano ? 1 : 0, base: 0, fim: false, v: 3 };
      if (veterano) { Profile.hist.base = this.cru(1); Profile.hist.anunciar = true; Profile.hist.tudo = true; Profile.hist.apres = true; }
    }
    // história começada na versão anterior (sem travas): quem já jogava continua com tudo liberado e sem a apresentação inicial
    if (Profile.hist.v === undefined) { Profile.hist.v = 2; Profile.hist.apres = true; if (Profile.rides || Profile.deliveries || Profile.earned > 0) Profile.hist.tudo = true; }
    // v3 (nov/2026): entrou o capítulo do Juninho antes do racha; quem já estava no racha ou no final pula ele (e ganha o desconto)
    if (Profile.hist.v === 2) { Profile.hist.v = 3; if (Profile.hist.cap >= 5) { Profile.hist.cap++; Profile.hist.juninho = true; } }
    return Profile.hist;
  },
  cru(i) { const c = HIST_CAPS[i]; return c ? c.val() : 0; },
  cap() { const h = this.h(); return h.fim ? null : HIST_CAPS[h.cap]; },
  feito() { const h = this.h(), c = HIST_CAPS[h.cap]; if (!c) return 0; return Math.max(0, c.absoluto ? c.val() : c.val() - h.base); },
  // linha do painel de objetivo (quando não tem corrida, entrega ou evento)
  hud() {
    const h = this.h(), c = this.cap(); if (!c || h.cap === 0) return null;
    const f = Math.min(c.alvo, this.feito());
    return [capNome(h.cap) + ' · ' + c.nome, c.meta, c.extra ? c.extra() : (c.alvo > 1 ? f + ' de ' + c.alvo : 'Falta pouco') + (c.premio ? ' · prêmio R$ ' + fmtMoney(c.premio) : '')];
  },
  update(dt) {
    if (Game.mode !== 'play' || !carregou(1)) return;
    const h = this.h(); if (h.fim) return;
    this.t -= dt; if (this.t > 0) return; this.t = 0.5;
    if (h.anunciar) { if (VoicePlayer.msg || Screens.current === 'screen-dialog' || Apresenta.on) return; h.anunciar = false; this.abre(h.cap); return; }
    if (h.cap === 0 && !h.apres) { // primeira noite: a câmera apresenta a cidade, a oficina e a garagem; depois começa o passo a passo
      h.apres = true; saveGame();
      Apresenta.comeca(lugaresDoCapitulo(0), () => { Missao.titulo('Capítulo 1 de 6', 'Chegada'); });
      return;
    }
    if (Apresenta.on) return;
    if (Profile.tut !== undefined && Profile.tut < TUT_STEPS.length && h.cap === 0) return;
    const c = HIST_CAPS[h.cap], f = this.feito();
    // avanço do capítulo aparece como legenda (sem quadro fixo na tela)
    if (h.cap > 0 && c.alvo > 1 && f > (this.ultimo === undefined ? f : this.ultimo) && f < c.alvo && telaLivre() && !Apresenta.on) Missao.legenda(escapeHtml(c.nome) + ': <b>' + f + ' de ' + c.alvo + '</b>', 5);
    this.ultimo = f;
    if (f >= c.alvo) { this.ultimo = undefined; this.conclui(); }
  },
  conclui() {
    const h = this.h(), c = HIST_CAPS[h.cap], n = h.cap + 1;
    if (c.premio) pay(c.premio);
    if (h.cap === HIST_CAPS.length - 1) { this.final(); return; }
    Missao.passou('Capítulo concluído', c.nome, c.premio); confete(60);
    h.cap++; h.base = this.cru(h.cap);
    if (h.cap === 4) Profile.histRali = 0;
    if (h.cap === 7) Emprestimo.devolve(); // ganhou o racha: o Opalha volta para o Juninho
    saveGame();
    setTimeout(() => this.abre(h.cap), 6500);
  },
  // começa um capítulo: nome grande no meio, objetivo em legenda, dica no canto e áudio do Seu Zé no zap
  abre(i) {
    const c = HIST_CAPS[i]; if (!c || Game.mode !== 'play') return;
    if (c.voz && CHAR_VOICES[c.voz]) { const m = charVoice(c.voz); if (m && m.voice) setTimeout(() => VoicePlayer.play(m), 900); }
    if (c.alvoMapa) { const w = c.alvoMapa(); if (w) { Act.waypoint = w; Act.gpsT = 0; } }
    if (i === 3) MissaoAjuda.t = 14; // o pedido de ajuda começa logo depois do título
    if (i === 5) MissaoOpalha.nasce(); // o Opalha do Juninho já aparece parado na rua (a câmera mostra onde)
    if (i === 6) Emprestimo.empresta(); // o Juninho empresta o Opalha para o racha
    saveGame();
    Apresenta.comeca(lugaresDoCapitulo(i), () => {
      if (Game.mode !== 'play') return;
      Missao.titulo(i >= CAP_FINAL ? 'O final' : 'Capítulo ' + (i + 1) + ' de ' + CAP_FINAL, c.nome);
      setTimeout(() => { if (Game.mode === 'play') Missao.legenda(c.leg, 8); }, 5000);
      const lib = Object.keys(LIBERA).filter((k) => LIBERA[k] === i).map((k) => LIBERA_NOME[k]);
      const dica = (lib.length ? '<div class="ms-ajuda-tit">Liberado</div><b>' + lib.join('</b> · <b>') + '</b><br>' : '') + (c.dica || '');
      if (dica) setTimeout(() => { if (Game.mode === 'play') Missao.ajuda(dica, 10); }, 5600);
      if (i === 3) MissaoAjuda.t = 6;
    });
  },
  final() {
    const h = this.h(); h.fim = true; saveGame();
    confete(160);
    Missao.passou('História concluída', 'O Opalha 6C é seu. São Gambiarra inteira sabe o seu nome.', 0);
    const m = charVoice('cap_fim'); if (m && m.voice) setTimeout(() => VoicePlayer.play(m), 2200);
    try { AudioSys.chime(); setTimeout(() => AudioSys.chime(), 350); } catch (e) {}
  },
  // tela de pausa: lista dos capítulos
  listaHTML() {
    const h = this.h();
    return HIST_CAPS.map((c, i) => {
      const st = h.fim || i < h.cap ? 'ok' : i === h.cap ? 'at' : '';
      return `<div class="hist-cap ${st}"><b>${i >= CAP_FINAL ? 'F' : i + 1}</b><span>${escapeHtml(c.nome)}</span></div>`;
    }).join('');
  },
};

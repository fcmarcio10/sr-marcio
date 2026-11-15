/* ============================ HISTÓRIA: O CARRO DOS SONHOS ============================
   6 capítulos + o final. No fundo da oficina do Seu Zé tem um Opalha 6C preto à venda (R$ 29.000):
   cada capítulo abre com um áudio do Seu Zé no zap, tem uma meta, paga um prêmio e leva ao próximo.
   O progresso conta a partir do começo do capítulo (Profile.hist = { cap, base }). */
const SONHO = 'brasa'; // Opalha 6C
const capNome = (i) => (i >= 6 ? 'Final' : 'Capítulo ' + (i + 1));
const corridasDe = () => Profile.rides || 0;
const HIST_CAPS = [
  { nome: 'Chegada', meta: 'Termine o passo a passo com o Seu Zé.', voz: null, premio: 200,
    val: () => (Profile.tut === undefined || Profile.tut >= TUT_STEPS.length ? 1 : 0), alvo: 1, absoluto: true },
  { nome: 'Ganha-pão', meta: 'Faça corridas no PegaAí.', voz: 'cap_2', premio: 400, val: corridasDe, alvo: 5 },
  { nome: 'Entregador da madrugada', meta: 'Faça entregas dos comércios ou fretes.', voz: 'cap_3', premio: 500, val: () => Profile.deliveries || 0, alvo: 3 },
  { nome: 'Socorro na madrugada', meta: 'Ajude gente nos eventos da cidade (fique de olho no celular).', voz: 'cap_4', premio: 700, val: () => Profile.evTotal || 0, alvo: 2 },
  { nome: 'A estrada da roça', meta: 'Termine o Rali da Vaca Atolada, lá na fazenda.', voz: 'cap_5', premio: 900,
    val: () => Profile.histRali || 0, alvo: 1, absoluto: true,
    alvoMapa: () => { const r = World.races.find((q) => q.id === 'fazenda'); return r && { x: r.start[0], y: r.start[1], label: 'Rali da Vaca Atolada' }; } },
  { nome: 'Tudo ou nada', meta: 'Ganhe um racha de madrugada (das 22h às 4h30).', voz: 'cap_6', premio: 1500, val: () => Profile.rachaWins || 0, alvo: 1 },
  { nome: 'O carro dos sonhos', meta: 'Junte R$ 29.000 e compre o Opalha 6C na sua garagem.', voz: 'cap_7', premio: 0,
    val: () => (Profile.owned && Profile.owned[SONHO] ? 1 : 0), alvo: 1, absoluto: true,
    extra: () => 'R$ ' + fmtMoney(Math.max(0, Math.min(Profile.money, 29000))) + ' de R$ 29.000' },
];
const Historia = {
  t: 0, popT: 0,
  h() {
    if (!Profile.hist) {
      // quem já jogava antes da história começa no capítulo 2 (o passo a passo não existia)
      const veterano = Profile.tut === undefined && (Profile.rides || Profile.deliveries || Profile.earned);
      Profile.hist = { cap: veterano ? 1 : 0, base: 0, fim: false };
      if (veterano) { Profile.hist.base = this.cru(1); Profile.hist.anunciar = true; }
    }
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
    if (Game.mode !== 'play' || !carregou(3)) return;
    const h = this.h(); if (h.fim) return;
    this.t -= dt; if (this.t > 0) return; this.t = 0.5;
    if (h.anunciar) { if (VoicePlayer.msg || Screens.current === 'screen-dialog') return; h.anunciar = false; this.abre(h.cap); return; }
    if (Profile.tut !== undefined && Profile.tut < TUT_STEPS.length && h.cap === 0) return;
    const c = HIST_CAPS[h.cap];
    if (this.feito() >= c.alvo) this.conclui();
  },
  conclui() {
    const h = this.h(), c = HIST_CAPS[h.cap], n = h.cap + 1;
    if (c.premio) pay(c.premio);
    if (h.cap === HIST_CAPS.length - 1) { this.final(); return; }
    Resultado.mostra({ titulo: 'Capítulo ' + n + ' concluído', sub: c.nome, estrelas: null, linhas: [['Prêmio do capítulo', c.premio]], total: c.premio });
    confete(60); AudioSys.checkpoint && AudioSys.checkpoint();
    h.cap++; h.base = this.cru(h.cap);
    if (h.cap === 4) Profile.histRali = 0;
    saveGame();
    setTimeout(() => this.abre(h.cap), 4200);
  },
  // começa um capítulo: cartaz grande no meio e áudio do Seu Zé no zap
  abre(i) {
    const c = HIST_CAPS[i]; if (!c || Game.mode !== 'play') return;
    this.cartaz(i >= 6 ? 'O FINAL' : 'CAPÍTULO ' + (i + 1) + ' DE 6', c.nome, c.meta);
    if (c.voz && CHAR_VOICES[c.voz]) { const m = charVoice(c.voz); if (m && m.voice) setTimeout(() => VoicePlayer.play(m), 1800); }
    if (c.alvoMapa) { const w = c.alvoMapa(); if (w) { Act.waypoint = w; Act.gpsT = 0; } }
    saveGame();
  },
  final() {
    const h = this.h(); h.fim = true; saveGame();
    confete(160);
    this.cartaz('FIM DA HISTÓRIA', 'O carro dos sonhos', 'O Opalha 6C é seu. São Gambiarra inteira sabe o seu nome.', true);
    const m = charVoice('cap_fim'); if (m && m.voice) setTimeout(() => VoicePlayer.play(m), 2200);
    try { AudioSys.chime(); setTimeout(() => AudioSys.chime(), 350); } catch (e) {}
  },
  cartaz(n, titulo, texto, grande) {
    let p = $('hist-pop');
    if (!p) { p = document.createElement('div'); p.id = 'hist-pop'; document.body.appendChild(p); }
    p.innerHTML = `<div class="hp-n">${escapeHtml(n)}</div><div class="hp-t">${escapeHtml(titulo)}</div><div class="hp-d">${escapeHtml(texto)}</div>`;
    p.classList.toggle('grande', !!grande);
    p.classList.remove('on', 'sai'); void p.offsetWidth; p.classList.add('on');
    clearTimeout(this.popT); this.popT = setTimeout(() => p.classList.add('sai'), grande ? 7000 : 5200);
  },
  // tela de pausa: lista dos capítulos
  listaHTML() {
    const h = this.h();
    return HIST_CAPS.map((c, i) => {
      const st = h.fim || i < h.cap ? 'ok' : i === h.cap ? 'at' : '';
      return `<div class="hist-cap ${st}"><b>${i >= 6 ? 'F' : i + 1}</b><span>${escapeHtml(c.nome)}</span></div>`;
    }).join('');
  },
};

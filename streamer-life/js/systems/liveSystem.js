/* Transmissão ao vivo: público agregado + pessoas detalhadas no chat, momentos do jogo, ações do streamer,
   acontecimentos aleatórios, doações, seguidores, inscrições e o resumo final. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const LV = SL.Live = {};
  // requisitos da Twitch (mostrados no app da Twitch e no OBS): média das últimas 7 lives (afiliado) e 10 (parceiro)
  LV.media = n => { const a = SL.G.ch.avgViewers.slice(-n); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; };
  LV.reqAfiliado = () => { const P = SL.G.ch.pulso; return [{ id: 'f', nome: 'Ter 50 seguidores', v: P.f, meta: 50 }, { id: 'h', nome: 'Transmitir por 8 horas', v: P.hours, meta: 8, horas: 1 }, { id: 'd', nome: 'Fazer live em 7 dias diferentes', v: P.livesN, meta: 7 }, { id: 'm', nome: 'Média de 3 espectadores', v: LV.media(7), meta: 3, media: 1 }]; };
  LV.reqParceiro = () => { const P = SL.G.ch.pulso; return [{ id: 'f', nome: 'Ter 15 mil seguidores', v: P.f, meta: 15000 }, { id: 'h', nome: 'Transmitir por 150 horas', v: P.hours, meta: 150, horas: 1 }, { id: 'm', nome: 'Média de 75 espectadores', v: LV.media(10), meta: 75, media: 1 }]; };
  const G = () => SL.G;
  LV.cur = null; LV.queue = []; LV.CAP_PRESENT = 45; LV.MSG_CAP_MIN = 34;

  LV.POLLS = [
    { id: 'jogo_amanha', q: 'Qual jogo na próxima live?' },
    { id: 'desafio', q: 'Qual o próximo desafio?', opts: ['Ganhar sem morrer', 'Só no modo difícil', 'Jogar de olhos vendados'] },
    { id: 'lanche', q: 'O que eu como depois da live?', opts: ['Pizza', 'Miojo', 'Salada'] },
    { id: 'horario', q: 'Melhor horário para as lives?', opts: ['18h', '20h', '22h'] },
  ];
  LV.TALKS = [
    { id: 'dia', label: 'Contar como foi o dia', icon: 'chat' },
    { id: 'historia', label: 'Contar uma história', icon: 'book' },
    { id: 'perguntar', label: 'Perguntar algo ao chat', icon: 'comment' },
    { id: 'planos', label: 'Falar dos planos do canal', icon: 'flag' },
  ];
  LV.CHALLENGES = [
    { id: 'vencer', label: 'Vencer a próxima partida', desc: 'Se der certo, o chat vai à loucura. Se der errado, vira piada.' },
    { id: 'arriscado', label: 'Só jogadas arriscadas por 10 min', desc: 'Mais momentos épicos e mais vexames.' },
    { id: 'chat', label: 'Jogar com o chat (inscritos)', desc: 'Cumpre promessas de jogar com o público. Precisa de 5 pessoas.' },
  ];

  const pushMsg = (msg, delayFrac) => {
    const L = LV.cur; if (!L || !msg) return;
    if (!LV.filtraModo(L, msg)) return;
    const msPerMin = 1000 / (SL.Clock.rate() || 0.25);
    LV.queue.push({ at: performance.now() + (delayFrac == null ? U.rand() : delayFrac) * msPerMin * 0.95, msg });
    L.chat.push(msg); if (L.chat.length > 220) L.chat.splice(0, L.chat.length - 220);
    L.stats.msgs++;
    if (msg.vid) { const st = L.present.get(msg.vid); if (st) st.lastMsg = L.min; const v = SL.Viewers.byId(msg.vid); if (v) v.m.msg++; }
  };
  // modos do chat valem para toda fala de espectador (doações e superchats sempre passam)
  const PASSA = ['donation', 'mod', 'streamer', 'superchat'];
  LV.filtraModo = (L, msg) => {
    if (!msg.vid || PASSA.includes(msg.kind)) return true;
    const v = SL.Viewers.byId(msg.vid); if (v && (v.mod || v.npc)) return true;
    if (L.followersOnly && !(v && v.fol)) return false;       // quem não segue não consegue escrever
    if (L.emoteOnly && !/^(:[a-z]+:\s?)+$/.test((msg.raw || '').trim())) {
      msg.raw = U.shuffle(LV.EMOTES.slice()).slice(0, U.ri(1, 3)).join(' '); msg.html = SL.Chat.html(msg.raw); msg.q = null; msg.qd = null; msg.intent = 'emote'; if (msg.kind !== 'reply_got') msg.kind = 'msg';
    }
    return true;
  };
  LV.flush = () => {
    const now = performance.now(); const out = [];
    for (let i = 0; i < LV.queue.length; i++) if (LV.queue[i].at <= now) out.push(LV.queue[i].msg);
    if (out.length) LV.queue = LV.queue.filter(q => q.at > now);
    return out;
  };
  const sys = (kind, text, o) => pushMsg(SL.Chat.system(kind, text, o), 0.05);
  const say = (text) => { const m = SL.Chat.streamer(text); pushMsg(m, 0); return m; };

  LV.ctx = () => {
    const L = LV.cur; const g = D.gameById(L.game);
    return { s: G().player.name, g: g.name, p: SL.GameSim.answer(L.sim), cat: g.cat, canal: G().player.user, via: U.pick(['diretório', 'diretório', 'TikTok', 'YouTube', 'Instagram']), gameId: g.id, sim: g.sim, nongame: !!g.nongame, late: L.min > 40 };
  };

  // ---------- início ----------
  LV.check = opts => {
    const G0 = G(); const g = D.gameById(opts.game);
    if (!g) return 'Escolha um jogo ou categoria.';
    if (!opts.title || opts.title.trim().length < 3) return 'Escreva um título para a live.';
    if (G0.loc.area !== 'casa') return 'Você precisa estar em casa, no computador.';
    const cs = SL.Equip.canStream(g, opts.quality); if (!cs.ok) return cs.reason;
    if (G0.needs.sono < 5) return 'Você está caindo de sono. Durma antes.';
    return null;
  };
  LV.start = opts => {
    const err = LV.check(opts); if (err) return err;
    if (SL.Clock.sp() === 0) SL.Clock.setSpeed(1);   // a live sempre começa andando
    const G0 = G(), P = G0.ch.pulso, g = D.gameById(opts.game);
    SL.Viewers.ensureNpcViewers();
    const day = SL.Clock.day();
    // live prometida ("amanhã tem live"): sem relógio, vale a próxima live que você fizer
    let promised = false;
    G0.ch.schedule.forEach(s => { if (!s.done && s.day <= day + 1) { s.done = true; promised = true; } });
    G0.promises.forEach(p => {
      if (p.status === 'pendente' && p.kind === 'live') { LV.keepPromise(p); promised = true; }
      if (p.status === 'pendente' && p.kind === 'jogo' && p.game === g.id) LV.keepPromise(p);
    });
    const ts = SL.Algo.titleScore(opts.title, { game: opts.game, kind: 'live' });
    const L = LV.cur = {
      id: U.uid('live'), game: g.id, title: opts.title.trim(), desc: opts.desc || '', tags: opts.tags || [], quality: opts.quality || '720p',
      planned: opts.planned || 120, cam: opts.cam !== false && SL.Equip.stats().hasCam, layout: opts.layout || 'classico', announced: !!opts.announce || promised, promised,
      t0: G0.time.t, min: 0, speed: 1, titleScore: ts.score, bait: ts.bait, tagScore: SL.Algo.tagScore(opts.tags, g.id), descScore: SL.Algo.descScore(opts.desc),
      sim: SL.GameSim.make(g.id), tech: null, contentQ: 50, mScore: 40, hype: 38 + (opts.announce ? 6 : 0) + (promised ? 8 : 0), silence: 0, anon: 0, viewers: 0,
      present: new Map(), att: new Map(), sched: [], anonPlan: [], graph: [], hypeG: [], peak: 0, sumV: 0, sumQ: 0,
      stats: { fol: 0, subs: 0, don: 0, donN: 0, msgs: 0, ads: 0, adRev: 0, newV: 0, chatters: new Set(), raid: 0 },
      chat: [], questions: [], donations: [], newcomers: [], moments: [], best: [],
      ev: { net: 0, mic: 0, paused: 0, celeb: null, celebT: 0, boost: 0, raidIn: 0, compNotified: false, discussion: null, endWarned: false },
      log: [], poll: null, challenge: null, risky: 0, focus: false, followersOnly: !!P.followersOnly, trolls: new Set(), toxic: 0, ctxQ: null,
      promisesMade: [], sponsors: {}, srcHint: null, alerts: [],
    };
    L.tech = SL.Equip.streamQuality(g, L.quality, L.cam, L.ev);
    if (opts.announce && SL.Social) SL.Social.announceLiveNow(L);
    L.sched = SL.Viewers.planAttendance(L);
    // seguidores sem pessoa detalhada que aparecem (agregado)
    const known = SL.Viewers.knownFollowers();
    const anonF = Math.max(0, P.f - known);
    const days = G0.ch.contentDays.filter(d => d >= day - 14).length;
    const consistency = Math.min(1, days / 7);
    let show = 0.04 * (0.5 + 0.5 * SL.Algo.todMul(SL.Clock.HORA)) * (L.announced ? 1.35 : 1) * (promised ? 1.25 : 1) * (0.7 + consistency * 0.5) * (0.6 + G0.ch.lastLiveQ / 125) * (0.6 + G0.rep.confianca / 125);
    if (G0.ch.catHist[g.id] === undefined && G0.ch.pulso.livesN > 3) show *= 0.85;
    const buzz = SL.Videos ? SL.Videos.buzz() : { k: 0 }; show *= 1 + buzz.k; L.buzz = buzz.k > 0.04 ? buzz.plat : null;
    const total = anonF * show + (buzz.k > 0.04 ? Math.round(buzz.k * 8) : 0);
    // chegada dos seguidores: 45% logo no começo (aviso da live) e o resto aos poucos durante a live toda
    // (antes todos chegavam nos primeiros ~30 min e o público caía rápido depois do pico)
    const dur = Math.max(40, L.planned || 120), cauda = dur * 0.8;
    for (let m = 0; m < dur + 30; m++) L.anonPlan[m] = total * (0.45 * (Math.exp(-m / 12) - Math.exp(-(m + 1) / 12)) + 0.55 * (Math.exp(-m / cauda) - Math.exp(-(m + 1) / cauda)) / (1 - Math.exp(-(dur + 30) / cauda)));
    SL.Life.start('live');
    G0.flags.liveToday = day;
    SL.bus.emit('live:start', L);
    sys('alert', 'Transmissão iniciada: ' + L.title);
    if (L.buzz) sys('alert', 'Tem gente chegando pelo seu vídeo no ' + L.buzz + '!');
    if (G0.equip.soft.bot_chat) sys('bot', SL.Chat.fill(U.pick(D.chat.bot), null, { canal: G0.player.user }), { u: 'Vigia' });
    if (SL.audio) SL.audio.play('live');
    return null;
  };

  // ---------- chegada e saída de pessoas ----------
  const arrive = (v, src) => {
    const L = LV.cur; if (!v || L.present.has(v.id) || v.ban) return;
    if (L.present.size >= LV.CAP_PRESENT) { L.anon++; return; }
    let st = L.att.get(v.id);
    if (!st) { st = { id: v.id, joined: L.min, mins: 0, sat: 0.55, asked: false, askedAt: -99, replied: false, welcomed: false, lastMsg: -99, memDone: false, first: v.m.v === 0, thanked: true }; L.att.set(v.id, st); L.stats.newV += v.m.v === 0 ? 1 : 0; }
    else st.joined = L.min;
    if (v.m.f0 == null) v.m.f0 = G().ch.pulso.f;
    L.present.set(v.id, st);
    if (src === 'raid') return; // raid fala em grupo
    const pGreet = U.clamp(0.25 + v.tl * 1.5 + (v.npc ? 0.4 : 0), 0, 0.95);
    if (U.chance(pGreet)) {
      const msg = SL.Chat.say(v, 'greet', LV.ctx());
      if (msg) {
        pushMsg(msg);
        if (st.first && !v.npc) L.newcomers.push({ vid: v.id, msgId: msg.id, at: L.min });
        if (msg.q === 'contexto') L.ctxQ = { vid: v.id, u: v.u, at: L.min, msgId: msg.id };
        if (msg.q) L.questions.push({ msgId: msg.id, vid: v.id, type: msg.q, qd: msg.qd, at: L.min, text: msg.raw });
      }
    }
  };
  const leave = (v, st, bored) => {
    const L = LV.cur; L.present.delete(v.id);
    if (U.chance(v.tl * 1.1)) { const m = SL.Chat.say(v, 'leave', LV.ctx(), { bored }); pushMsg(m); }
  };

  const follow = (v) => {
    const L = LV.cur, P = G().ch.pulso;
    if (v.fol) return;
    v.fol = 1 + SL.Clock.day(); v.loy = U.clamp(v.loy + 6, 0, 100); v.int = U.clamp(v.int + 8, 0, 100);
    P.f++; L.stats.fol++;
    sys('follow', '@' + v.u + ' começou a seguir!');
    (L.novosSeg = L.novosSeg || []).push(v.id);
    L.alerts.push({ k: 'follow', u: v.u });
    if (SL.audio && L.stats.fol < 40) SL.audio.play('follow');
  };
  const subscribe = (v, gifted) => {
    const L = LV.cur, P = G().ch.pulso;
    v.sub = SL.Clock.day() + 30; v.subM = (v.subM || 0) + 1; v.loy = U.clamp(v.loy + 8, 0, 100);
    P.bal += 3.95; L.stats.subs++; P.subs++;
    sys('sub', '@' + v.u + ' se inscreveu' + (v.subM > 1 ? ' (' + v.subM + ' meses)' : '') + '!');
    (L.novasInsc = L.novasInsc || []).push(v.id);
    L.alerts.push({ k: 'sub', u: v.u });
    if (SL.audio) SL.audio.play('sub');
  };
  const donate = (v, amount, text, uName) => {
    const L = LV.cur, P = G().ch.pulso;
    // teto pelo tamanho do canal (sugestão 7): canal pequeno não recebe R$ 900 de uma vez
    const teto = LV.tetoDoacao();
    amount = LV.valorBR(Math.min(amount, teto));
    P.bal += amount * 0.95; L.stats.don += amount; L.stats.donN++;
    if (v) { v.m.don += amount; v.m.ld = SL.Clock.day(); const st = L.present.get(v.id); if (st) st.thanked = false; }
    const u = v ? v.u : uName;
    // superchat: a partir de R$ 5 a mensagem é lida em voz alta (vozes gravadas no ElevenLabs)
    let sc = null;
    if (amount >= LV.scMin() - 0.001) { L.scUsados = L.scUsados || []; const pool = LV.SUPERCHATS.filter(x => !L.scUsados.includes(x.id)); sc = U.pick(pool.length ? pool : LV.SUPERCHATS); L.scUsados.push(sc.id); text = sc.t; }
    const msg = SL.Chat.msg(v, text, { kind: 'donation', amount, u, badges: v ? undefined : [] });
    if (sc) msg.sc = sc.id;
    pushMsg(msg, 0.1);
    L.donations.push({ msgId: msg.id, vid: v ? v.id : null, u, amount, at: L.min, thanked: false });
    if (!sc) L.alerts.push({ k: 'don', u, amount, text: '' }); // o superchat ganha o alerta próprio, junto com a voz (um atrás do outro)
    if (sc) SL.bus.emit('live:superchat', { id: sc.id, u, amount, text: sc.t }); else if (SL.audio) SL.audio.play('donate');
    L.hype = U.clamp(L.hype + Math.min(12, 2 + amount / 10), 0, 100);
  };

  LV.donate = donate;   // para testes e eventos
  // superchat mínimo (você escolhe no OBS ou na Twitch): 4,99, 7,99 ou 9,99
  LV.SC_MINIMOS = [4.99, 7.99, 9.99];
  LV.scMin = () => { const v = G().ch.pulso.scMin; return LV.SC_MINIMOS.includes(v) ? v : 4.99; };
  LV.setScMin = v => { if (LV.SC_MINIMOS.includes(+v)) G().ch.pulso.scMin = +v; };
  // valores como as pessoas mandam de verdade: 1,99 · 2,99 · 4,99 · 5 · 7,99 · 9,99 · 10 · 14,99 · 19,99 · 20 · 29,99 · 49,99 · 50 · 99,99 · 100...
  LV.VALORES = [1.99, 2, 2.99, 4.99, 5, 7.99, 9.99, 10, 14.99, 19.99, 20, 25, 29.99, 49.99, 50, 79.99, 99.99, 100, 149.99, 199.99, 250, 499.99, 500, 999.99];
  LV.valorBR = v => { let best = LV.VALORES[0]; for (const x of LV.VALORES) if (Math.abs(x - v) < Math.abs(best - v)) best = x; return best; };
  LV.tetoDoacao = () => { const L = LV.cur, P = G().ch.pulso; return Math.max(25, Math.round(20 + P.f * 0.5 + (L ? L.viewers : 0) * 4)); };
  // falas de superchat com voz (audio/sc_1..sc_10.mp3, cada uma com uma voz diferente)
  LV.SUPERCHATS = [
    { id: 'sc_1', t: 'Toma esse superchat pra comprar um microfone novo, porque esse aí tá chiando demais!' },
    { id: 'sc_2', t: 'Mandei um pix de presente! Agora joga direito, pelo amor de Deus!' },
    { id: 'sc_3', t: 'No meu tempo a gente jogava bola na rua... mas tá bom, toma aí uma moedinha pra você.' },
    { id: 'sc_4', t: 'Primeiro superchat da minha vida! Manda um beijo pra minha mãe, que ela tá assistindo!' },
    { id: 'sc_5', t: 'Meu filho, já tá tarde, vai dormir! Mas antes, toma aqui pro lanche.' },
    { id: 'sc_6', t: 'Superchat pra você dar aquele grito na próxima jogada! Bora, bora, bora!' },
    { id: 'sc_7', t: 'Tô assistindo escondido do chefe no trabalho. Valeu pela companhia, toma um superchat!' },
    { id: 'sc_8', t: 'Ai, eu amo essa live! Toma esse superchat e lê meu nome bem bonito, tá?' },
    { id: 'sc_9', t: 'Passando só pra deixar esse superchat e voltar a fingir que tô estudando.' },
    { id: 'sc_10', t: 'Superchat pra ver se você acerta pelo menos uma hoje!' },
    // nov/2026: mais 20 vozes (ElevenLabs, eleven_v4)
    { id: 'sc_11', t: 'Acabei de receber o salário e já tô gastando aqui. Prioridades, né?' },
    { id: 'sc_12', t: 'Esse superchat é pra você comprar uma cadeira nova, porque essa aí tá rangendo!' },
    { id: 'sc_13', t: 'Netinho, eu não entendo nada desse jogo, mas tô muito orgulhosa de você!' },
    { id: 'sc_14', t: 'Mandei esse superchat só pra você ler meu nome. Pronto, agora pode continuar.' },
    { id: 'sc_15', t: 'Se você ganhar essa, eu mando outro. Se perder, eu mando outro também!' },
    { id: 'sc_16', t: 'Boa noite, chat! Vim só deixar esse presentinho e já vou fazer a janta.' },
    { id: 'sc_17', t: 'Faz uma dancinha aí que eu mando mais um, prometo!' },
    { id: 'sc_18', t: 'Tô vendo aqui do interior, o sinal tá fraco, mas tô aqui com você, viu!' },
    { id: 'sc_19', t: 'Que live boa! Toma esse superchat e manda um abraço pra galera do sul!' },
    { id: 'sc_20', t: 'Jovem, eu assisto todas as suas lives. Continue assim. Tome aqui.' },
    { id: 'sc_21', t: 'Ai, meu Deus, apertei o botão sem querer! Ah, deixa assim, é seu!' },
    { id: 'sc_22', t: 'Isso aqui é melhor que novela! Toma, e não me decepciona.' },
    { id: 'sc_23', t: 'Ganhei meu primeiro dinheiro vendendo brigadeiro e vim gastar aqui!' },
    { id: 'sc_24', t: 'Superchat pra você beber uma água, que você tá falando sem parar!' },
    { id: 'sc_25', t: 'Eu devia tá dormindo, mas essa live tá boa demais. Toma aí!' },
    { id: 'sc_26', t: 'Esse lance foi inacreditável! Toma esse superchat, merecido!' },
    { id: 'sc_27', t: 'Passei aqui pra dar um salve e deixar esse trocadinho. Tamo junto!' },
    { id: 'sc_28', t: 'Primeira vez aqui e já virei fã! Toma esse superchat de boas-vindas pra mim mesma.' },
    { id: 'sc_29', t: 'Meu gato pisou no teclado e mandou esse superchat. Mas ele aprova a live.' },
    { id: 'sc_30', t: 'Tô no ônibus assistindo a live. Se eu perder o ponto, a culpa é sua!' },    // nov/2026: +40 vozes de adolescentes zoando o streamer na brincadeira (z: zoeira)
    { id: 'sc_31', t: 'Mandei dez reais pra você parar de jogar. Por favor, para!', z: 1 },
    { id: 'sc_32', t: 'Esse superchat é pra pagar sua aula de mira, porque tá precisando!', z: 1 },
    { id: 'sc_33', t: 'Mano, minha avó joga melhor que você. E ela nem tem celular!', z: 1 },
    { id: 'sc_34', t: 'Toma aqui, compra um cérebro novo pro seu personagem!', z: 1 },
    { id: 'sc_35', t: 'Eu tô na aula fingindo que tô prestando atenção. Joga direito aí!', z: 1 },
    { id: 'sc_36', t: 'Superchat de pena. Ninguém merece ver você morrendo assim.', z: 1 },
    { id: 'sc_37', t: 'Eu pago pra ver você errar de novo. Literalmente!', z: 1 },
    { id: 'sc_38', t: 'Minha mãe mandou eu dormir, mas eu fiquei só pra rir de você.', z: 1 },
    { id: 'sc_39', t: 'Mano, você é muito ruim. Mas é o meu streamer favorito.', z: 1 },
    { id: 'sc_40', t: 'Gastei o dinheiro do lanche aqui. Amanhã eu passo fome por sua causa!', z: 1 },
    { id: 'sc_41', t: 'Esse dinheiro é pra você comprar um mouse que obedece você!', z: 1 },
    { id: 'sc_42', t: 'Se você ganhar essa, eu faço minha lição de casa. Mentira, não faço não.', z: 1 },
    { id: 'sc_43', t: 'Tá jogando de olho fechado? Porque não é possível!', z: 1 },
    { id: 'sc_44', t: 'Eu e minhas amigas fizemos uma vaquinha só pra te zoar. Valeu a pena!', z: 1 },
    { id: 'sc_45', t: 'Esse superchat é patrocinado pela minha mesada. Joga bonito!', z: 1 },
    { id: 'sc_46', t: 'Fala comigo, ídolo! Mentira, você é horrível. Mas eu te amo.', z: 1 },
    { id: 'sc_47', t: 'Ai, que vergonha alheia! Toma esse superchat e esquece o que aconteceu.', z: 1 },
    { id: 'sc_48', t: 'Meu irmão de sete anos tá rindo de você aqui do meu lado.', z: 1 },
    { id: 'sc_49', t: 'Lê meu nome errado de propósito, eu duvido!', z: 1 },
    { id: 'sc_50', t: 'Esse superchat é pra você aprender a pular. É só apertar o espaço!', z: 1 },
    { id: 'sc_51', t: 'Tô no banheiro da escola assistindo. Não conta pra ninguém!', z: 1 },
    { id: 'sc_52', t: 'Você é tipo wi-fi de escola: some na hora mais importante!', z: 1 },
    { id: 'sc_53', t: 'Uma moedinha pro streamer mais azarado da internet!', z: 1 },
    { id: 'sc_54', t: 'Mano, faz a dancinha que você prometeu! A gente não esqueceu, não!', z: 1 },
    { id: 'sc_55', t: 'Se você morrer de novo eu vou dar unfollow. Brincadeira, eu nunca saio daqui.', z: 1 },
    { id: 'sc_56', t: 'Eu ia comprar skin, mas preferi pagar pra te ver sofrer.', z: 1 },
    { id: 'sc_57', t: 'Acabei de tirar zero na prova, e mesmo assim jogo melhor que você.', z: 1 },
    { id: 'sc_58', t: 'Hoje é meu aniversário e o meu presente é zoar você. Obrigada!', z: 1 },
    { id: 'sc_59', t: "Grita \"eu sou o melhor\" bem alto. Agora!", z: 1 },
    { id: 'sc_60', t: 'Essa jogada foi tão ruim que eu vou mostrar pra minha turma amanhã!', z: 1 },
    { id: 'sc_61', t: 'Superchat pra você tomar um banho. O chat tá sentindo o cheiro daqui!', z: 1 },
    { id: 'sc_62', t: 'Mano, você tá jogando ou só passeando pelo mapa?', z: 1 },
    { id: 'sc_63', t: 'Esse dinheiro é seu se você não morrer nos próximos cinco minutos. Boa sorte!', z: 1 },
    { id: 'sc_64', t: 'Calma, chat! Ele tá só aquecendo. Há três horas.', z: 1 },
    { id: 'sc_65', t: 'Minha professora disse pra eu investir no futuro. Investi em você. Erro meu.', z: 1 },
    { id: 'sc_66', t: 'Faz a dancinha do TikTok! Sem desculpa, eu paguei!', z: 1 },
    { id: 'sc_67', t: 'Eu vim pela gameplay e fiquei pela vergonha. Toma aí!', z: 1 },
    { id: 'sc_68', t: 'Bora, bora! Mostra pro chat que você não é tão ruim assim!', z: 1 },
    { id: 'sc_69', t: 'Mãe, se você tiver assistindo: eu não gastei o dinheiro todo, juro!', z: 1 },
    { id: 'sc_70', t: 'Toma, pra você contratar um técnico. De jogo, de vida, de qualquer coisa!', z: 1 },
    // nov/2026: mais 40 (zoeira com o streamer e com a comunidade, estilo chat brasileiro de verdade)
    { id: 'sc_71', t: 'Esse chat aqui é tudo desempregado, olha o horário que vocês tão aqui! Inclusive eu.', z: 2 },
    { id: 'sc_72', t: 'Mandei esse superchat pro streamer pagar a conta de luz, porque essa ring light tá puxando energia do bairro inteiro!', z: 2 },
    { id: 'sc_73', t: 'Chat, quem aí também tá vendo a live escondido no banheiro do trabalho? Só eu?', z: 2 },
    { id: 'sc_74', t: 'Essa jogada aí foi igual o Wi-Fi da minha casa: caiu bem na melhor parte!', z: 2 },
    { id: 'sc_75', t: 'Toma cinco real. Não gasta tudo em miojo, hein!', z: 2 },
    { id: 'sc_76', t: 'O moderador tá mais ativo que o streamer! Promove o Bigode logo!', z: 2 },
    { id: 'sc_77', t: 'Chat, alguém explica pro streamer que o inimigo é do outro lado!', z: 2 },
    { id: 'sc_78', t: 'Mandei esse pix porque a professora disse pra investir no futuro. E o futuro é essa live!', z: 2 },
    { id: 'sc_79', t: 'Essa live tá mais parada que fila de banco em dia de pagamento!', z: 2 },
    { id: 'sc_80', t: 'Galera do chat, bora fazer uma vaquinha pro streamer comprar um mouse que funcione?', z: 2 },
    { id: 'sc_81', t: 'Eu e mais três pessoas: a audiência oficial desse canal. Respeita a gente!', z: 2 },
    { id: 'sc_82', t: 'Streamer, tua mira tá igual previsão do tempo: nunca acerta!', z: 2 },
    { id: 'sc_83', t: 'Toma esse superchat pra você ligar pra sua mãe. Ela tá no chat perguntando se você jantou!', z: 2 },
    { id: 'sc_84', t: 'Ô streamer, para de culpar o lag! O lag é você!', z: 2 },
    { id: 'sc_85', t: 'Mandei o superchat e agora tô sem dinheiro pro busão. Vou ter que ir andando, mas valeu a pena!', z: 2 },
    { id: 'sc_86', t: 'A comunidade desse canal é igual grupo da família: todo mundo fala e ninguém escuta!', z: 2 },
    { id: 'sc_87', t: 'Streamer, tu tá jogando ou tá fazendo tutorial de como perder?', z: 2 },
    { id: 'sc_88', t: 'Chat, segura que lá vem mais uma desculpa: o controle tá ruim!', z: 2 },
    { id: 'sc_89', t: 'Esse superchat é patrocinado pela minha mesada. Valoriza, hein!', z: 2 },
    { id: 'sc_90', t: 'Eu tava estudando pra prova, mas aí abri a live. Se eu tirar zero, a culpa é sua!', z: 2 },
    { id: 'sc_91', t: 'Streamer, pisca duas vezes se você tá sendo obrigado a jogar isso!', z: 2 },
    { id: 'sc_92', t: 'Mandei esse superchat só pra ver o moderador trabalhar. Vai, Bigode!', z: 2 },
    { id: 'sc_93', t: 'Essa live tá tão boa que eu nem pulei os anúncios. Mentira, pulei sim!', z: 2 },
    { id: 'sc_94', t: 'Chat, vamo combinar: quem perder a próxima vai ter que assistir essa live de novo!', z: 2 },
    { id: 'sc_95', t: 'Streamer, teu microfone pega até o vizinho cantando no chuveiro!', z: 2 },
    { id: 'sc_96', t: 'Já dei like, já segui, já mandei pix. Só falta você jogar bem!', z: 2 },
    { id: 'sc_97', t: 'Essa jogada vai pro corte de fails, com certeza absoluta!', z: 2 },
    { id: 'sc_98', t: 'Sinceramente, não sei quem é mais doido: a gente do chat ou o streamer.', z: 2 },
    { id: 'sc_99', t: 'Toma, compra uma cadeira gamer. Essa de plástico já tá pedindo arrego!', z: 2 },
    { id: 'sc_100', t: 'Streamer, eu fui pra escola, voltei, almocei... e tu ainda tá na mesma fase!', z: 2 },
    { id: 'sc_101', t: 'Mandei dez reais. Cinco é pela live, e cinco é pra você parar de cantar!', z: 2 },
    { id: 'sc_102', t: 'Se o streamer ganhar essa, eu raspo a cabeça. Pode ficar tranquilo, tô seguro.', z: 2 },
    { id: 'sc_103', t: 'Galera que chegou agora: não liga não, ele é assim mesmo.', z: 2 },
    { id: 'sc_104', t: 'Minha vó assiste a live com o volume no talo. Manda um oi pra Dona Cida!', z: 2 },
    { id: 'sc_105', t: 'Esse superchat é pra você ir dormir, que amanhã tem escola. Ah, você não estuda? Melhor ainda!', z: 2 },
    { id: 'sc_106', t: 'Fala, streamer! Minha mãe mandou dizer que a louça não vai se lavar sozinha. Ah, é pra mim? Tchau!', z: 2 },
    { id: 'sc_107', t: 'O streamer joga igual meu avô dirige: devagar e no meio da pista!', z: 2 },
    { id: 'sc_108', t: 'Esse cabelo aí é estilo ou foi o vento? Pergunta sincera, tá?', z: 2 },
    { id: 'sc_109', t: 'Se essa live fosse comida, seria arroz sem sal. Mas eu como todo dia!', z: 2 },
    { id: 'sc_110', t: 'Chat, quem pediu pizza aí? Porque o streamer tá entregando... entregando a partida!', z: 2 },
  ];

  // ---------- momentos de decisão (sugestão 1): escolha rápida com 2 botões e tempo ----------
  // "a" arrisca (pode virar o melhor momento da live ou um fracasso engraçado: os dois viram corte); "b" joga seguro.
  LV.MOMENTOS = [
    { t: 'Um inimigo forte apareceu na sua frente!', a: 'Partir pra cima', b: 'Recuar', fa: 'Vou pra cima!', fb: 'Calma, vou recuar um pouco.' },
    { t: 'Última vida e o chefe está quase morto!', a: 'Golpe final', b: 'Curar antes', fa: 'É agora ou nunca!', fb: 'Primeiro me curo, depois eu volto.' },
    { t: 'O chat está pedindo uma jogada maluca!', a: 'Fazer a jogada', b: 'Jogar normal', fa: 'Vocês pediram, vocês vão ter!', fb: 'Hoje não, chat, hoje não.' },
    { t: 'Tem um atalho perigoso no mapa.', a: 'Pegar o atalho', b: 'Caminho seguro', fa: 'Segura que vou pelo atalho!', fb: 'Vou pelo caminho de sempre.' },
    { t: 'Dá para tentar um recorde agora!', a: 'Tentar o recorde', b: 'Deixar pra depois', fa: 'Bora tentar esse recorde!', fb: 'Recorde fica pra outro dia.' },
    { t: 'Um contra três: dá pra virar?', a: 'Encarar os três', b: 'Fugir', fa: 'Vem todo mundo!', fb: 'Três é demais, vou sair daqui.' },
    { t: 'Item raro no lugar mais perigoso do mapa.', a: 'Ir buscar', b: 'Deixar quieto', fa: 'Esse item vai ser meu!', fb: 'Nem vale o risco.' },
    { t: 'Último lance da partida!', a: 'Tentar o impossível', b: 'Garantir o empate', fa: 'Olha isso, chat!', fb: 'Empate tá bom demais.' },
  ];
  LV.MOMENTOS_PAPO = [
    { t: 'O chat pediu para você cantar!', a: 'Cantar', b: 'Desconversar', fa: 'Tá bom, mas não riam!', fb: 'Vocês não merecem minha voz hoje.' },
    { t: 'Desafio do chat: ler os comentários com sotaque.', a: 'Topar', b: 'Recusar', fa: 'Bora, sotaque ativado!', fb: 'Isso não vai acontecer.' },
    { t: 'Contar a história mais vergonhosa da sua vida?', a: 'Contar', b: 'Melhor não', fa: 'Senta que lá vem história...', fb: 'Essa eu levo pro túmulo.' },
  ];
  LV.MOMENTO_SEG = 9;   // segundos para escolher (no tempo real); sem escolha, joga seguro
  const momentoNovo = () => {
    const L = LV.cur; const g = D.gameById(L.game);
    const pool = g && (g.nongame || g.id === 'conversa') ? LV.MOMENTOS_PAPO : LV.MOMENTOS;
    const usados = L.momUsados || (L.momUsados = []); const livres = pool.filter((x, i) => !usados.includes(i));
    const m = U.pick(livres.length ? livres : pool); usados.push(pool.indexOf(m));
    L.momento = { id: U.uid('mo'), t: m.t, a: m.a, b: m.b, fa: m.fa, fb: m.fb, ini: L.min, real: typeof performance !== 'undefined' ? performance.now() : 0 };
    if (SL.audio) SL.audio.play('notif');
    SL.bus.emit('live:momento', L.momento);
  };
  LV.decidir = escolha => {
    const L = LV.cur; if (!L || !L.momento) return null;
    const mo = L.momento; L.momento = null; touch();
    const ag = { game: L.game, sim: L.sim.sim, at: G().time.t };
    let res;
    if (escolha === 'a') {
      L.fala = { t: mo.fa, at: performance.now() };
      const p = U.clamp(0.32 + G().player.skills.jogo / 220 + SL.Life.perf() * 0.15 + L.hype / 500, 0.25, 0.8);
      if (U.chance(p)) {
        res = { ok: true, txt: 'Deu certo! O chat foi à loucura.' };
        L.hype = U.clamp(L.hype + 18, 0, 100); reactAll('momento_ok', 0.5);
        const m = Object.assign({ type: 'epic', txt: 'Arriscou e deu certo: ' + mo.a.toLowerCase(), int: 0.9, funny: 0.15, good: true, big: true, mt: 'você arriscou ao vivo e deu muito certo', clip: 0.9 }, ag);
        L.moments.push(m); L.best.push(m);
        SL.Rep.mod({ popularidade: 0.3 });
      } else {
        res = { ok: false, txt: 'Deu tudo errado... mas o chat amou rir.' };
        L.hype = U.clamp(L.hype + 7, 0, 100); reactAll('momento_fail', 0.5);
        const m = Object.assign({ type: 'funny', txt: 'Arriscou e deu tudo errado', int: 0.65, funny: 0.95, good: false, mt: 'você arriscou ao vivo e passou vergonha', clip: 0.78 }, ag);
        L.moments.push(m); L.best.push(m);
      }
    } else {
      L.fala = { t: mo.fb, at: performance.now() };
      res = { ok: null, txt: 'Jogou seguro.' };
      L.hype = U.clamp(L.hype + 2, 0, 100); reactAll('momento_safe', 0.2);
    }
    L.best.sort((x, y) => y.clip - x.clip); L.best.length = Math.min(L.best.length, 10);
    L.momRes = Object.assign({ at: typeof performance !== 'undefined' ? performance.now() : 0, escolha }, res);
    SL.bus.emit('live:momento', null);
    return res;
  };
  // moderador do canal: dá boas-vindas, agradece seguidores, inscrições e superchats, responde perguntas simples
  // e silencia quem passa do ponto. Espera 1 minuto para você poder fazer isso antes, se quiser.
  LV.MOD = { u: 'Bigode', c: '#22c55e' };
  const modSay = text => sys('mod', text, { u: LV.MOD.u, c: LV.MOD.c });
  const lista = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];
  const textoResposta = (q, opt) => {
    const L = LV.cur; const g = D.gameById(L.game); const h = SL.Clock.HORA;
    const setupDesc = [SL.Equip.item('computador'), SL.Equip.item('microfone'), SL.Equip.item('webcam')].filter(Boolean).map(i => i.name).join(', ') || 'o básico do básico';
    return opt.text({ p: SL.GameSim.answer(L.sim), g: g.name, og: q.qd && q.qd.game ? D.gameById(q.qd.game).name : '', cr: q.qd && q.qd.creator ? D.creatorById(q.qd.creator).name : '', setup: setupDesc, hora: String(h).padStart(2, '0') + 'h' });
  };
  const modMinute = () => {
    const L = LV.cur; if (!L) return;
    const sat = (v, k) => { const st = v && (L.present.get(v.id) || L.att.get(v.id)); if (st) st.sat = U.clamp(st.sat + k, 0, 1); return st; };
    const nomes = ids => ids.map(id => SL.Viewers.byId(id)).filter(Boolean);
    // superchats: agradece sempre (depois de 1 minuto, para você poder agradecer antes se quiser)
    const dons = L.donations.filter(d => !d.thanked && L.min - d.at >= 1).slice(0, 3);
    if (dons.length) {
      modSay(dons.length === 1 ? 'Valeu demais pelo superchat de ' + U.money(dons[0].amount) + ', @' + dons[0].u + '! :coracao:' : 'Valeu pelos superchats, ' + lista(dons.map(d => '@' + d.u)) + '! :coracao:');
      dons.forEach(d => { d.thanked = true; const v = d.vid && SL.Viewers.byId(d.vid); if (v) { v.loy = U.clamp(v.loy + 3, 0, 100); const st = sat(v, 0.2); if (st) st.thanked = true; } });
    }
    // o resto: no máximo uma mensagem a cada 2 minutos, juntando quem chegou e quem seguiu
    if (L.min - (L.modUlt == null ? -99 : L.modUlt) < 2) return;
    const q = L.questions.find(x => !x.done && L.min - x.at >= 1);
    const opt = q && (SL.Chat.ANSWERS[q.type] || []).find(o => !(o.fx && (o.fx.promise || o.fx.creator || o.fx.polemic)));
    if (q && opt) {
      const v = SL.Viewers.byId(q.vid); q.done = true; L.modUlt = L.min;
      modSay((v ? '@' + v.u + ' ' : '') + textoResposta(q, opt));
      if (v) { v.m.rep++; v.loy = U.clamp(v.loy + 2, 0, 100); const st = sat(v, ((opt.fx && opt.fx.sat) || 0.2) * 0.8); if (st) { st.replied = true; st.repliedAt = L.min; } }
      return;
    }
    const novos = L.newcomers.filter(n => L.min - n.at >= 1).slice(0, 5);
    const seg = nomes((L.novosSeg || []).splice(0, 6)); if (L.novosSeg) L.novosSeg.length = 0;
    const insc = nomes((L.novasInsc || []).splice(0, 6)); if (L.novasInsc) L.novasInsc.length = 0;
    const partes = [];
    if (novos.length) {
      const vs = nomes(novos.map(n => n.vid));
      if (vs.length) partes.push((vs.length === 1 ? 'Seja bem-vindo(a), ' : 'Sejam bem-vindos, ') + lista(vs.map(v => '@' + v.u)) + '!');
      vs.forEach(v => { const st = sat(v, 0.2); if (st) st.welcomed = true; v.int = U.clamp(v.int + 5, 0, 100); });
      L.newcomers = L.newcomers.filter(n => !novos.includes(n));
    }
    if (seg.length) { partes.push('Valeu pelo follow, ' + lista(seg.map(v => '@' + v.u)) + '!'); seg.forEach(v => { v.loy = U.clamp(v.loy + 2, 0, 100); sat(v, 0.05); }); }
    if (insc.length) { partes.push('Obrigado pela inscrição, ' + lista(insc.map(v => '@' + v.u)) + '!'); insc.forEach(v => { v.loy = U.clamp(v.loy + 3, 0, 100); sat(v, 0.08); }); }
    if (partes.length) { modSay(partes.join(' ') + ' :coracao:'); L.modUlt = L.min; }
  };
  // modos do chat: todos, só seguidores ou só emojis
  LV.EMOTES = [':hype:', ':fogo:', ':palmas:', ':gg:', ':riso:', ':coracao:', ':nossa:', ':susto:'];
  LV.chatMode = () => { const L = LV.cur; return !L ? 'todos' : L.emoteOnly ? 'emotes' : L.followersOnly ? 'seguidores' : 'todos'; };
  LV.setChatMode = modo => {
    const L = LV.cur; if (!L) return;
    L.followersOnly = modo === 'seguidores'; L.emoteOnly = modo === 'emotes'; G().ch.pulso.followersOnly = L.followersOnly;
    if (L.followersOnly) { L.trolls.forEach(id => { const v = SL.Viewers.byId(id); if (v && !v.fol) L.present.delete(id); }); L.trolls.clear(); }
    if (L.emoteOnly) L.trolls.clear();
    // o que já estava na fila para aparecer também segue o modo novo
    LV.queue = LV.queue.filter(q => q.msg.kind === 'streamer' || LV.filtraModo(L, q.msg));
    sys('alert', modo === 'seguidores' ? 'Chat só para seguidores' : modo === 'emotes' ? 'Chat só com emojis' : 'Chat aberto para todos');
  };

  // ---------- minuto a minuto ----------
  LV.minute = () => {
    const L = LV.cur; if (!L) return;
    const G0 = G(), P = G0.ch.pulso, g = D.gameById(L.game);
    L.min++;
    const perf = SL.Life.perf(); const char = SL.Life.charisma();
    const wasPaused = L.ev.paused > 0;
    if (L.ev.paused > 0) { L.ev.paused--; if (L.ev.paused === 0) { say('Voltei, galera!'); reactAll('pause_back', 0.25); L.silence = 0; } }
    // fora da frente do PC: ninguém jogando, conta como pausa
    const paused = L.ev.paused > 0 || !!L.away;
    if (L.away) L.awayMin = (L.awayMin || 0) + 1;
    if (L.away && L.awayMin % 6 === 4) reactAll('ausente', 0.12);
    if (L.ev.net > 0) L.ev.net--;
    if (L.ev.mic > 0) { L.ev.mic++; if (L.ev.mic > 25) L.ev.mic = 0; }
    if (L.ev.boost > 0) L.ev.boost--;
    if (L.ev.ad && G0.time.t >= L.ev.ad.until) L.ev.ad = null;
    if (L.ev.spon && L.min >= L.ev.spon.until) L.ev.spon = null;
    L.tech = SL.Equip.streamQuality(g, L.quality, L.cam, L.ev);

    // jogo
    const st0 = SL.Equip.stats();
    const k = { skill: U.clamp(G0.player.skills.jogo / 100 * 0.75 + st0.game / 100 * 0.25, 0, 1), perf, risky: L.risky > 0, focus: L.focus, char };
    if (L.risky > 0) L.risky--;
    const moments = paused ? [] : SL.GameSim.step(L.sim, k);
    moments.forEach(m => { L.moments.push(m); if (m.clip >= 0.55 && L.best.filter(b => b.type === m.type).length < 2 && !L.best.some(b => b.txt === m.txt)) { L.best.push(m); L.best.sort((a, b) => b.clip - a.clip); L.best.length = Math.min(L.best.length, 10); } });
    if (L.moments.length > 300) L.moments.splice(0, 50);
    checkChallenge(moments);

    // qualidade do conteúdo
    const maxInt = moments.reduce((a, m) => Math.max(a, m.int + (m.big ? 0.2 : 0)), 0);
    L.mScore = L.mScore * 0.72 + maxInt * 100 * 0.28 + (g.nongame ? char * 0.06 : 0);
    let cq = 0.33 * Math.min(100, L.mScore) + 0.27 * L.hype + 0.2 * L.tech.overall + 0.2 * char;
    if (g.nongame) cq = 0.25 * Math.min(100, L.mScore) + 0.27 * L.hype + 0.18 * L.tech.overall + 0.3 * char;
    if (paused) cq = 14;
    L.contentQ = L.contentQ * 0.6 + cq * 0.4;

    // empolgação do chat
    L.silence++;
    let dh = (38 - L.hype) * 0.04;
    moments.forEach(m => { dh += m.int * 9 + (m.big ? 8 : 0); });
    if (L.silence > 6) dh -= Math.min(4, 1.2 + (L.silence - 6) * 0.15);
    if (L.tech.issues.includes('lag') || L.tech.issues.includes('rede')) dh -= 2;
    if (L.ev.mic) dh -= 4;
    if (paused) dh -= 2;
    if (L.ev.discussion) dh -= 1;
    L.hype = U.clamp(L.hype + dh * (0.7 + 0.3 * perf), 0, 100);

    // fluxo de público
    const plan = L.anonPlan[L.min] || 0;
    let retN = Math.floor(plan) + (U.chance(plan % 1) ? 1 : 0);
    let discRate = SL.Algo.liveDiscovery(L) * (L.ev.boost > 0 ? 1.6 : 1);
    let discN = U.poisson(discRate);
    if (L.ev.raidIn > 0) { discN += L.ev.raidIn; L.stats.raid += L.ev.raidIn; L.ev.raidIn = 0; }
    while (L.sched.length && L.sched[0].at <= L.min) { const it = L.sched.shift(); const v = SL.Viewers.byId(it.id); if (v) arrive(v, 'agenda'); }
    for (let i = 0; i < retN; i++) {
      if (L.present.size < LV.CAP_PRESENT && U.chance(0.7)) {
        const v = SL.Viewers.create({ cat: g.cat, int: U.rf(40, 70), loy: U.rf(25, 60), src: 'seguidor' });
        v.fol = 1 + SL.Clock.day() - U.ri(1, 30); v.m.v = U.ri(1, 6); v.m.f0 = Math.round(P.f * 0.5);
        arrive(v, 'seguidor');
      } else L.anon++;
    }
    for (let i = 0; i < discN; i++) {
      if (L.present.size < LV.CAP_PRESENT) { const v = SL.Viewers.discoveryArrival(L, L.present); arrive(v, 'descoberta'); }
      else L.anon++;
    }
    // saída do público agregado
    const stayAnon = 12 + 38 * Math.pow(L.contentQ / 100, 1.2) + L.hype / 8 + Math.min(10, L.min / 12);   // quem fica um tempo tende a ficar mais
    const leaveN = Math.min(L.anon, U.poisson(L.anon / stayAnon));
    L.anon -= leaveN;
    // seguidores e inscrições vindos do agregado
    const conv = 0.05 * Math.pow(Math.max(0.05, L.contentQ / 60), 1.5);
    const anonFol = leaveN * conv + L.anon * 0.0006 * (L.hype / 60);
    let nf = Math.floor(anonFol) + (U.chance(anonFol % 1) ? 1 : 0);
    if (nf > 0) {
      const named = Math.min(nf, 3);
      for (let i = 0; i < named; i++) { const v = SL.Viewers.create({ cat: g.cat, int: 45, src: 'descoberta' }); v.m.v = 1; v.m.l = SL.Clock.day(); follow(v); }
      const rest = nf - named;
      if (rest > 0) { P.f += rest; L.stats.fol += rest; sys('follow', '+' + U.int(rest) + ' novos seguidores'); }
    }
    if (P.afil && L.anon > 0) {
      const s = L.anon * 0.00035 * (L.hype / 50) * (L.contentQ / 60);
      const ns = Math.floor(s) + (U.chance(s % 1) ? 1 : 0);
      if (ns > 0) { G0.ch.subCohorts.push({ n: ns, until: SL.Clock.day() + 30 }); P.bal += ns * 3.95; P.subs += ns; L.stats.subs += ns; sys('sub', ns === 1 ? '@' + SL.Viewers.genIdentity().u + ' se inscreveu!' : '+' + ns + ' novas inscrições'); if (SL.audio) SL.audio.play('sub'); }
      const dr = L.anon * 0.0003 * (L.hype / 60);
      if (U.chance(Math.min(0.9, dr))) { const idt = SL.Viewers.genIdentity(); donate(null, U.clamp(U.lognorm(Math.log(10), 0.8), 2, 300), SL.Chat.fill(U.pick(D.chat.donation), null, { u: 'o chat' }) || 'Pela live!', idt.u); }
    }

    // pessoas detalhadas
    const ctx = LV.ctx();
    const catFitOf = v => v.favs.includes(g.cat) ? 1 : 0.55;
    let msgBudget = LV.MSG_CAP_MIN;
    const hour = SL.Clock.HORA;
    const present = [...L.present.values()];
    present.forEach(st => {
      const v = SL.Viewers.byId(st.id); if (!v) { L.present.delete(st.id); return; }
      st.mins++;
      let e = 0.22 + 0.33 * (L.contentQ / 100) + 0.18 * catFitOf(v) + 0.15 * (L.tech.overall / 100) + 0.12 * (L.hype / 100);
      if (st.replied && L.min - st.repliedAt < 20) e += 0.12;
      if (L.toxic > 2 && v.tx < 0.5) e -= 0.08;
      if (L.silence > 8) e -= 0.1;
      if (paused) e -= 0.15;
      if (L.emoteOnly) e -= 0.03;
      if (v.tx > 0.6) e = 0.45 + (L.trollFed ? 0.2 : 0);
      if (v.npc) e = Math.max(e, 0.72);
      st.sat = U.clamp(st.sat * 0.85 + e * 0.15, 0, 1);
      // ir embora
      let stay = 9 + v.pa * 42 + v.loy * 0.6 + (st.sat - 0.5) * 60 + Math.min(12, st.mins / 5);   // quem já ficou um tempo se acomoda
      let hd = Math.abs(hour - v.hr); hd = Math.min(hd, 24 - hd); if (hd > 4) stay *= 0.6;
      if (v.npc) stay = Math.max(stay, 60);
      stay = U.clamp(stay, 4, 260);
      if (U.chance(1 / stay)) { leave(v, st, st.sat < 0.42); return; }
      // seguir, inscrever, doar
      if (!v.fol && st.mins >= 5 && st.sat > 0.52 && U.chance((st.sat - 0.5) * 0.09 * (0.6 + v.int / 100))) follow(v);
      if (v.npc && !v.fol && st.mins >= 2) follow(v);
      if (P.afil && v.fol && !v.sub && v.loy > 40 && v.w >= 2 && U.chance(0.0016 * v.w * v.gen * st.sat * (1 + L.hype / 100))) subscribe(v);
      const bigNow = moments.some(m => m.big);
      if (v.w >= 1 && U.chance(v.gen * v.w * 0.00063 * (st.sat + 0.2) * (bigNow ? 2.5 : 1) * (v.npc ? 0.3 : 1))) {
        const amt = U.clamp([0, 4, 8, 18, 45, 120][v.w] * U.lognorm(0, 0.5), 2, 2000);
        const t = SL.Chat.fill(U.pick(D.chat.donation), v, { u: U.pick(['a família', 'o chat', 'minha mãe', 'todo mundo']) });
        donate(v, amt, t || 'Pela live!');
      }
      // falar
      if (msgBudget <= 0) return;
      if (L.emoteOnly) {
        if (U.chance(v.tl * 0.45 + (moments.some(m => m.int >= 0.35) ? 0.12 : 0))) { pushMsg(SL.Chat.msg(v, U.shuffle(LV.EMOTES.slice()).slice(0, U.ri(1, 3)).join(' '), { kind: 'msg', intent: 'emote', tone: 'h' })); msgBudget--; }
        return;
      }
      if (v.tx > 0.6 && !v.mod) {
        if (U.chance(0.35 + v.tl)) { const m = SL.Chat.say(v, 'troll', ctx); pushMsg(m); L.toxic++; L.trolls.add(v.id); msgBudget--; }
        return;
      }
      // reação a momentos
      const strong = moments.filter(m => m.int >= 0.35);
      if (strong.length) {
        const m = strong[strong.length - 1];
        let tm = 1; const ar = v.a;
        if (m.funny > 0.6 && (ar === 'engracado' || ar === 'comunicativo')) tm = 1.6;
        if (m.good === false && ar === 'critico') tm = 1.5;
        if (m.big && (ar === 'competitivo' || ar === 'especialista' || ar === 'fiel')) tm = 1.4;
        if (U.chance((0.1 + m.int * 0.42) * (0.45 + v.tl * 2.2) * tm)) { pushMsg(SL.Chat.say(v, 'moment', ctx, { moment: m })); msgBudget--; return; }
      }
      // conversa geral
      const p = v.tl * (0.35 + L.hype / 90) * (L.silence > 8 ? 0.55 : 1) * (v.loy > 60 ? 1.2 : 1) * (paused ? 0.5 : 1);
      if (!U.chance(p)) return;
      const w = { chatter: 3, question: (L.min - st.askedAt > 12) ? (v.a === 'novato' ? 2.5 : 1.1) : 0, compliment: st.sat > 0.62 ? 1.4 : 0.2, memory: (v.m.v >= 2 && !st.memDone) ? 1.3 : 0,
        attention: (st.asked && !st.replied && L.min - st.askedAt > 5) ? 1.5 : 0.1, reply_other: L.chat.length > 3 ? 0.9 : 0, crit: 0, welcome_other: 0, answer_other: 0 };
      let reason = null;
      if (L.ev.mic) reason = 'audio'; else if (L.tech.issues.includes('lag') || L.tech.issues.includes('rede')) reason = 'lag'; else if (L.cam && L.tech.issues.includes('cam') && U.chance(0.3)) reason = 'video';
      else if (L.silence > 8) reason = 'silencio'; else if (L.bait && L.contentQ < 50 && st.mins < 15) reason = 'clickbait';
      else if (perf < 0.7 && v.loy > 30) reason = 'cansado'; else if (L.stats.ads >= 3) reason = 'anuncio';
      else if ((G0.ch.catHist[g.id] || 0) >= 8 && v.a === 'critico') reason = 'repetitivo'; else if (v.a === 'critico' && L.sim.last.some(m => m.good === false)) reason = 'gameplay';
      if (reason) w.crit = (v.a === 'critico' ? 3 : 1.1) * (reason === 'cansado' ? 0.5 : 1);
      const nc = L.newcomers.find(n => L.min - n.at <= 2 && n.vid !== v.id && !n.welcomedBy);
      if (nc && v.loy > 35) w.welcome_other = 1.4;
      if (L.ctxQ && L.min - L.ctxQ.at <= 3 && !L.ctxQ.answered && v.m.v >= 2 && v.id !== L.ctxQ.vid) w.answer_other = 3;
      const intent = U.wkey(w);
      let msg = null;
      if (intent === 'crit') msg = SL.Chat.say(v, 'crit', ctx, { reason });
      else if (intent === 'welcome_other') { const nv = SL.Viewers.byId(nc.vid); if (nv) { msg = SL.Chat.say(v, 'welcome_other', Object.assign({}, ctx, { u: nv.u })); nc.welcomedBy = v.id; const nst = L.present.get(nv.id); if (nst) nst.sat = U.clamp(nst.sat + 0.1, 0, 1); } }
      else if (intent === 'answer_other') { msg = SL.Chat.say(v, 'answer_other', Object.assign({}, ctx, { u: L.ctxQ.u })); L.ctxQ.answered = true; }
      else if (intent === 'reply_other') { const others = L.chat.slice(-8).filter(x => x.vid && x.vid !== v.id && x.kind === 'msg'); if (others.length) { const o = U.pick(others); msg = SL.Chat.say(v, L.trolls.has(o.vid) ? (U.chance(0.6) ? 'defend' : 'argue') : 'reply_other', Object.assign({}, ctx, { u: o.u })); } }
      else if (intent === 'memory') { msg = SL.Chat.say(v, 'memory', ctx); st.memDone = true; }
      else msg = SL.Chat.say(v, intent, ctx);
      if (!msg) return;
      pushMsg(msg); msgBudget--;
      if (msg.q) {
        st.asked = true; st.askedAt = L.min;
        L.questions.push({ msgId: msg.id, vid: v.id, type: msg.q, qd: msg.qd, at: L.min, text: msg.raw });
        if (msg.q === 'contexto') L.ctxQ = { vid: v.id, u: v.u, at: L.min, msgId: msg.id };
      }
    });
    L.questions = L.questions.filter(q => !q.done && L.min - q.at <= 10).slice(-10);
    L.newcomers = L.newcomers.filter(n => L.min - n.at <= 6);
    // doações não agradecidas
    L.donations.forEach(d => { if (!d.thanked && !d.late && L.min - d.at > 10) { d.late = true; const v = d.vid && SL.Viewers.byId(d.vid); if (v) { v.loy = U.clamp(v.loy - 3, 0, 100); SL.Viewers.note(v, 'semobrigado'); } } });
    // moderação automática
    const hasMod = true;   // o Bigode modera sempre
    if (L.trolls.size && hasMod && U.chance(0.5)) {
      const tid = [...L.trolls][0]; const tv = SL.Viewers.byId(tid);
      if (tv && L.present.has(tid)) { sys('mod', SL.Chat.fill(U.pick(D.chat.mod), null, {}), { u: LV.MOD.u, c: LV.MOD.c }); L.present.delete(tid); sys('alert', '@' + tv.u + ' foi silenciado(a) pela moderação'); }
      L.trolls.delete(tid);
    }
    if (L.trolls.size && !hasMod && L.toxic > 3 && U.chance(0.3)) { L.hype = U.clamp(L.hype - 2, 0, 100); }

    eventsMinute(g);
    pollMinute();
    modMinute();
    // momento de decisão (sugestão 1)
    if (L.momEm == null) L.momEm = U.ri(5, 9);
    if (!L.momento && !L.away && !paused && !L.ev.ad && L.min >= L.momEm) { L.momEm = L.min + U.ri(12, 20); momentoNovo(); }
    else if (L.momento && (L.away || L.min - L.momento.ini >= 3) && !(SL.LiveUI && SL.LiveUI.visible && SL.LiveUI.visible())) LV.decidir('b');
    // você fala sozinho com o chat de tempos em tempos (só escreve se quiser)
    if (!L.away && !paused && !L.ev.ad && L.silence >= (L.falaEm || 4)) { L.falaEm = U.ri(4, 8); if (U.chance(0.3)) LV.joke(true); else LV.talk(U.pick(['dia', 'historia', 'perguntar', 'planos']), true); }
    // problemas técnicos e visita famosa se resolvem sem botão
    if (L.ev.mic && L.ev.mic >= 3) LV.fixMic();
    if (L.ev.net > 0) { L.netT = (L.netT || 0) + 1; if (L.netT >= 2) { LV.fixNet(L.quality !== '480p' ? 'qualidade' : 'roteador'); L.netT = 0; } } else L.netT = 0;
    if (L.ev.celeb && !L.ev.celeb.greeted && !L.away) LV.greetCeleb();
    // amigos mandam um superchat nas primeiras lives
    if (L.scAmigoEm == null) L.scAmigoEm = G().ch.pulso.livesN < 6 && U.chance(0.6) ? U.ri(8, 30) : -1;
    if (L.min === L.scAmigoEm) { const amigo = [...L.present.keys()].map(id => SL.Viewers.byId(id)).find(v => v && v.npc); if (amigo) donate(amigo, U.ri(5, 15), ''); }

    // números
    L.viewers = L.anon + L.present.size;
    L.peak = Math.max(L.peak, L.viewers); L.sumV += L.viewers; L.sumQ += L.contentQ;
    L.graph.push(L.viewers); L.hypeG.push(Math.round(L.hype));
    if (L.min === L.planned && !L.ev.endWarned) { L.ev.endWarned = true; SL.notify({ cat: 'canal', icon: 'clock', title: 'Tempo planejado da live acabou', text: 'Você pode continuar ou encerrar quando quiser.', silent: false }); }
    SL.bus.emit('live:minute', L);
  };

  const reactAll = (kind, p) => {
    const L = LV.cur; const ctx = LV.ctx(); let n = 0;
    for (const st of L.present.values()) { const v = SL.Viewers.byId(st.id); if (v && v.tx < 0.6 && U.chance(p * (0.5 + v.tl * 2)) && n < 6) { pushMsg(SL.Chat.say(v, 'react', ctx, { kind })); n++; } }
  };
  LV.reactAll = reactAll;

  // ---------- acontecimentos durante a live ----------
  const eventsMinute = g => {
    const L = LV.cur, G0 = G(); const V = L.viewers;
    const net = D.internet.find(n => n.id === G0.equip.net);
    if (!L.ev.net && U.chance((1 - net.stab) * 0.035)) { L.ev.net = U.ri(3, 8); sys('alert', 'Conexão instável: a live está engasgando'); LV.issue = 'net'; }
    const mic = SL.Equip.item('microfone');
    if (!L.ev.mic && U.chance(mic ? 0.0012 : 0.003)) { L.ev.mic = 1; sys('alert', 'O microfone parou de captar sua voz'); }
    // celebridade
    if (!L.ev.celeb && L.min > 10 && U.chance(0.0004 * Math.pow(Math.log10(1 + V), 1.5))) {
      const c = U.pick(D.celebs); L.ev.celeb = c; L.ev.celebT = L.min; L.ev.boost = 25;
      sys('alert', c.name + ' (' + c.kind + ') está assistindo a live!');
      const ctx = Object.assign(LV.ctx(), { u: c.name }); let n = 0;
      for (const st of L.present.values()) { const v = SL.Viewers.byId(st.id); if (v && U.chance(0.5) && n < 8) { pushMsg(SL.Chat.say(v, 'celeb', ctx)); n++; } }
      pushMsg(SL.Chat.msg(null, U.pick(['salve, curtindo a live aqui', 'boa live! vim pelo corte que me mandaram', 'chat animado esse hein']), { u: c.handle, c: '#ffe066', badges: ['verificado'] }), 0.5);
      L.hype = U.clamp(L.hype + 18, 0, 100);
      SL.notify({ cat: 'canal', icon: 'star', title: c.name + ' entrou na sua live', text: 'Cumprimente para aproveitar o momento.', silent: true });
    }
    // doação grande inesperada
    if (V >= 3 && U.chance(0.0016)) {
      const rich = [...L.present.keys()].map(id => SL.Viewers.byId(id)).filter(v => v && v.w >= 3 && !v.npc);
      const v = rich.length ? U.pick(rich) : null;
      if (v) donate(v, U.rf(100, 900), U.pick(D.chat.donation_big));
    }
    // vídeo antigo viraliza
    if (U.chance(0.0012) && G0.videos.length) {
      const vids = G0.videos.filter(x => x.status === 'publicado' && x.views > 50);
      if (vids.length) {
        const vid = U.pick(vids); vid.boost = { until: G0.time.t + 3 * 1440, mul: U.rf(3, 7) }; L.ev.raidIn += U.ri(3, 10) + Math.round(V * 0.2); L.srcHint = 'vision';
        sys('alert', 'Seu vídeo "' + vid.title + '" está bombando e trazendo gente para a live');
        const ctx = LV.ctx(); let n = 0; for (const st of L.present.values()) { const v = SL.Viewers.byId(st.id); if (v && U.chance(0.2) && n < 3) { pushMsg(SL.Chat.say(v, 'viral', ctx)); n++; } }
      }
    }
    // discussão no chat
    if (!L.ev.discussion && L.present.size >= 4 && U.chance(0.01)) {
      const ids = [...L.present.keys()]; const a = SL.Viewers.byId(U.pick(ids)), b = SL.Viewers.byId(U.pick(ids));
      if (a && b && a.id !== b.id && !a.npc && !b.npc) {
        L.ev.discussion = { a: a.id, b: b.id, left: 3 };
        pushMsg(SL.Chat.say(a, 'argue', Object.assign(LV.ctx(), { u: b.u })));
        pushMsg(SL.Chat.say(b, 'argue', Object.assign(LV.ctx(), { u: a.u })));
        a.m.fight++; b.m.fight++;
      }
    } else if (L.ev.discussion) {
      const d = L.ev.discussion; d.left--;
      const a = SL.Viewers.byId(d.a), b = SL.Viewers.byId(d.b);
      if (d.left > 0 && a && b && L.present.has(a.id) && L.present.has(b.id)) pushMsg(SL.Chat.say(U.chance(0.5) ? a : b, 'argue', Object.assign(LV.ctx(), { u: U.chance(0.5) ? a.u : b.u })));
      else { L.ev.discussion = null; L.toxic++; }
    }
    // concorrente forte na mesma categoria
    const comp = SL.Algo.competitors(L.game);
    if (comp.best && comp.viewers > 3000 && !L.ev.compNotified) { L.ev.compNotified = true; sys('alert', '@' + D.creatorById(comp.best.id).handle + ' está ao vivo em ' + g.name + ' com ' + U.num(comp.viewers) + ' pessoas'); }
    // criador no chat propõe parceria
    if (U.chance(0.004)) {
      const cr = [...L.present.keys()].map(id => SL.Viewers.byId(id)).find(v => v && v.cr && !v.m.collabAsked);
      if (cr) { cr.m.collabAsked = 1; pushMsg(SL.Chat.msg(cr, 'curti muito a live! também tenho canal (' + cr.cr.h + '), bora fazer uma collab um dia? te chamo no Instagram', { intent: 'collab' })); if (SL.Rel) SL.Rel.viewerCollabOffer(cr); }
    }
  };

  // ---------- enquete ----------
  const pollMinute = () => {
    const L = LV.cur; const p = L.poll; if (!p) return;
    const n = Math.max(1, Math.round(L.viewers * U.rf(0.2, 0.45) * (0.5 + L.hype / 100)));
    for (let i = 0; i < n / 3; i++) {
      let idx = U.ri(0, p.opts.length - 1);
      if (p.id === 'jogo_amanha') { const ids = [...L.present.keys()]; const v = ids.length ? SL.Viewers.byId(U.pick(ids)) : null; if (v) { const j = p.games.findIndex(gid => v.favs.includes(D.gameById(gid).cat)); if (j >= 0 && U.chance(0.7)) idx = j; } }
      p.votes[idx]++;
    }
    if (L.min >= p.end) {
      const tot = p.votes.reduce((a, b) => a + b, 0) || 1; const win = p.votes.indexOf(Math.max(...p.votes));
      sys('alert', 'Enquete encerrada: "' + p.opts[win] + '" venceu com ' + Math.round(p.votes[win] / tot * 100) + '% dos ' + tot + ' votos');
      if (p.id === 'jogo_amanha') { LV.makePromise('jogo', { game: p.games[win] }, 'O chat escolheu ' + p.opts[win]); say('Decidido! Próxima live tem ' + p.opts[win]); }
      if (p.id === 'horario') G().flags.prefHour = parseInt(p.opts[win], 10);
      L.poll = null; L.hype = U.clamp(L.hype + 4, 0, 100);
    }
  };

  // ---------- desafios ----------
  const checkChallenge = moments => {
    const L = LV.cur; const c = L.challenge; if (!c) return;
    const good = moments.filter(m => m.good === true && m.int >= 0.6), bad = moments.filter(m => m.good === false && m.int >= 0.4);
    let res = null;
    if (c.id === 'vencer') { if (good.some(m => /vit|vitoria|fim_vit|win|xeque_mate|chefe_ok|recorde|projeto/.test(m.type))) res = true; else if (bad.some(m => /morte|fim_der|lose|derrota/.test(m.type))) res = false; }
    if (c.id === 'arriscado') { c.good = (c.good || 0) + good.length; if (c.good >= 2) res = true; }
    if (L.min >= c.until && res === null) res = c.id === 'arriscado' ? (c.good || 0) >= 1 : false;
    if (res === null) return;
    L.challenge = null;
    if (res) {
      L.hype = U.clamp(L.hype + 18, 0, 100); reactAll('challenge_ok', 0.45);
      const m = { type: 'epic', txt: 'Desafio cumprido: ' + c.label, int: 0.9, funny: 0.1, good: true, big: true, mt: 'você cumpriu aquele desafio "' + c.label.toLowerCase() + '" ao vivo', clip: 0.85, game: L.game, sim: L.sim.sim, at: G().time.t };
      L.moments.push(m); L.best.push(m); L.best.sort((a, b) => b.clip - a.clip);
    } else {
      L.hype = U.clamp(L.hype - 3, 0, 100); reactAll('challenge_fail', 0.4);
      const m = { type: 'funny', txt: 'Desafio fracassado: ' + c.label, int: 0.6, funny: 0.8, good: false, mt: 'você falhou feio naquele desafio ao vivo', clip: 0.7, game: L.game, sim: L.sim.sim, at: G().time.t };
      L.moments.push(m); L.best.push(m); L.best.sort((a, b) => b.clip - a.clip);
    }
    L.best.length = Math.min(L.best.length, 10);
  };

  // ---------- promessas ----------
  LV.makePromise = (kind, data, why) => {
    const G0 = G(); const L = LV.cur;
    const same = G0.promises.find(x => x.status === 'pendente' && x.kind === kind && (kind === 'inscritos' || (kind === 'jogo' && x.game === data.game) || (kind === 'live' && x.day === data.day)));
    if (same) { if (L) [...L.present.keys()].forEach(id => { if (!same.viewers.includes(id) && same.viewers.length < 25) same.viewers.push(id); }); return same; }
    const p = { id: U.uid('p'), kind, made: G0.time.t, status: 'pendente', viewers: L ? [...L.present.keys()].slice(0, 25) : [], why: why || '' };
    if (kind === 'live') { p.day = data.day; p.hour = data.hour; }
    if (kind === 'jogo') { p.game = data.game; p.until = SL.Clock.day() + 7; }
    if (kind === 'inscritos') { p.until = SL.Clock.day() + 7; }
    G0.promises.push(p);
    p.viewers.forEach(id => { const v = SL.Viewers.byId(id); if (v) { v.m.prom.push(p.id); if (v.m.prom.length > 4) v.m.prom.shift(); } });
    const title = kind === 'live' ? 'Live prometida' : kind === 'jogo' ? 'Prometido: live de ' + D.gameById(p.game).name : 'Prometido: jogar com o chat';
    if (SL.Calendar) SL.Calendar.add({ day: kind === 'live' ? p.day : p.until, hour: p.hour, kind: 'promessa', title, ref: p.id });
    if (L) L.promisesMade.push(p.id);
    SL.bus.emit('promises');
    return p;
  };
  LV.keepPromise = p => {
    p.status = 'cumprida'; SL.Rep.mod({ confianca: 1.2 });
    p.viewers.forEach(id => { const v = SL.Viewers.byId(id); if (v) { v.m.pk = (v.m.pk || 0) + 1; v.loy = U.clamp(v.loy + 4, 0, 100); } });
    if (SL.Calendar) SL.Calendar.removeRef(p.id);
  };
  LV.breakPromise = p => {
    p.status = 'quebrada'; SL.Rep.mod({ confianca: -1.6 });
    p.viewers.forEach(id => { const v = SL.Viewers.byId(id); if (v) { v.m.pb = (v.m.pb || 0) + 1; v.loy = U.clamp(v.loy - 7, 0, 100); SL.Viewers.note(v, 'promessa'); } });
    SL.notify({ cat: 'canal', icon: 'alert', title: 'Promessa quebrada', text: (p.kind === 'live' ? 'Você prometeu uma live e não apareceu.' : p.kind === 'jogo' ? 'Você prometeu jogar ' + D.gameById(p.game).name + ' e não jogou.' : 'Você prometeu jogar com o chat e não jogou.') + ' Quem estava lá vai lembrar.' });
    if (SL.Calendar) SL.Calendar.removeRef(p.id);
  };
  SL.bus.on('tick:hour', () => {
    const G0 = G(); if (!G0) return; const day = SL.Clock.day();
    G0.promises.forEach(p => {
      if (p.status !== 'pendente') return;
      if (p.kind === 'live' && day > p.day + 2) LV.breakPromise(p);
      if ((p.kind === 'jogo' || p.kind === 'inscritos') && day > p.until) LV.breakPromise(p);
    });
    G0.ch.schedule.forEach(s => { if (!s.done && !s.missed && day > s.day + 2) { s.missed = true; SL.Rep.mod({ confianca: -1.5 }); SL.notify({ cat: 'canal', icon: 'alert', title: 'Live agendada não aconteceu', text: 'Seus seguidores esperaram e você não entrou ao vivo.' }); } });
    G0.promises = G0.promises.filter(p => p.status === 'pendente' || G0.time.t - p.made < 14 * 1440);
  });

  // ---------- ações do streamer ----------
  const dim = kind => { const L = LV.cur; const n = L.log.filter(x => x.k === kind && L.min - x.m < 10).length; L.log.push({ k: kind, m: L.min }); if (L.log.length > 40) L.log.shift(); return Math.pow(0.55, n); };
  const touch = () => { LV.cur.silence = 0; };

  LV.answer = (msgId, optId) => {
    const L = LV.cur; if (!L) return;
    const q = L.questions.find(x => x.msgId === msgId); if (!q) return;
    const opt = (SL.Chat.ANSWERS[q.type] || []).find(o => o.id === optId); if (!opt) return;
    q.done = true; touch();
    const v = SL.Viewers.byId(q.vid); const st = v && (L.present.get(v.id) || L.att.get(v.id));
    const g = D.gameById(L.game);
    const setupDesc = [SL.Equip.item('computador'), SL.Equip.item('microfone'), SL.Equip.item('webcam')].filter(Boolean).map(i => i.name).join(', ') || 'o básico do básico';
    const h = SL.Clock.HORA;
    const text = opt.text({ p: SL.GameSim.answer(L.sim), g: g.name, og: q.qd && q.qd.game ? D.gameById(q.qd.game).name : '', cr: q.qd && q.qd.creator ? D.creatorById(q.qd.creator).name : '', setup: setupDesc, hora: String(h).padStart(2, '0') + 'h' });
    say((v ? '@' + v.u + ' ' : '') + text);
    const fx = opt.fx || {};
    if (v) {
      v.m.rep++; v.loy = U.clamp(v.loy + 3 * ((D.archetypes[v.a] || {}).loy || 1), 0, 100); v.int = U.clamp(v.int + 5, 0, 100);
      if (st) { st.replied = true; st.repliedAt = L.min; st.sat = U.clamp(st.sat + (fx.sat || 0.2), 0, 1); }
      if (L.present.has(v.id) && U.chance(0.55)) pushMsg(SL.Chat.say(v, 'react', LV.ctx(), { kind: 'reply_got' }));
    }
    L.hype = U.clamp(L.hype + (2 + (fx.hype || 0)) * dim('answer'), 0, 100);
    if (fx.promise === 'live') LV.makePromise('live', { day: SL.Clock.day() + 1, hour: h }, 'Respondeu no chat');
    if (fx.promise === 'jogo' && q.qd) LV.makePromise('jogo', { game: q.qd.game }, 'Pedido do chat');
    if (fx.promise === 'inscritos') LV.makePromise('inscritos', {}, 'Pedido do chat');
    if (fx.trust) SL.Rep.mod({ confianca: fx.trust });
    if (fx.cred) SL.Rep.mod({ credibilidade: fx.cred });
    if (fx.creator && q.qd && q.qd.creator && SL.Rel) SL.Rel.creatorOpinion(q.qd.creator, fx.creator, !!fx.polemic);
    SL.Life.skillUp('carisma', 0.15);
  };
  LV.read = msgId => {
    const L = LV.cur; const m = L.chat.find(x => x.id === msgId); if (!m || !m.vid) return;
    touch(); say('O @' + m.u + ' falou: "' + m.raw.slice(0, 60) + '". Boa!');
    const v = SL.Viewers.byId(m.vid); const st = L.present.get(m.vid);
    if (v) { v.m.rep++; v.loy = U.clamp(v.loy + 1.5, 0, 100); }
    if (st) { st.sat = U.clamp(st.sat + 0.15, 0, 1); st.replied = true; st.repliedAt = L.min; if (U.chance(0.45)) pushMsg(SL.Chat.say(v, 'react', LV.ctx(), { kind: 'read' })); }
    L.hype = U.clamp(L.hype + 1.5 * dim('read'), 0, 100);
  };
  LV.welcome = (vid, txt) => {
    const L = LV.cur; const v = SL.Viewers.byId(vid); if (!v) return; touch();
    say(txt || 'Seja muito bem-vindo(a), @' + v.u + '! Fica à vontade');
    const st = L.present.get(vid) || L.att.get(vid);
    if (st) { st.welcomed = true; st.sat = U.clamp(st.sat + 0.28, 0, 1); }
    v.int = U.clamp(v.int + 8, 0, 100);
    L.newcomers = L.newcomers.filter(n => n.vid !== vid);
    if (L.present.has(vid) && U.chance(0.7)) pushMsg(SL.Chat.say(v, 'react', LV.ctx(), { kind: 'welcome_got' }));
    L.hype = U.clamp(L.hype + 1 * dim('welcome'), 0, 100);
  };
  LV.thank = msgId => {
    const L = LV.cur; const list = msgId === 'all' ? L.donations.filter(d => !d.thanked) : L.donations.filter(d => d.msgId === msgId && !d.thanked);
    if (!list.length) return; touch();
    if (list.length === 1) say('Muito obrigado(a), @' + list[0].u + ', pelos ' + U.money(list[0].amount) + '! Você é demais');
    else say('Obrigado(a) ' + list.map(d => '@' + d.u).slice(0, 5).join(', ') + ' pelo apoio!');
    list.forEach(d => {
      d.thanked = true;
      const v = d.vid && SL.Viewers.byId(d.vid);
      if (v) { v.loy = U.clamp(v.loy + 5, 0, 100); const st = L.present.get(v.id); if (st) { st.sat = U.clamp(st.sat + 0.3, 0, 1); st.thanked = true; } }
    });
    reactAll('thanks', 0.12);
    L.hype = U.clamp(L.hype + 3 * dim('thank'), 0, 100);
  };
  LV.ban = (vid, timeout) => {
    const L = LV.cur; const v = SL.Viewers.byId(vid); if (!v) return; touch();
    const fair = v.tx > 0.5 || L.trolls.has(vid);
    L.present.delete(vid); L.trolls.delete(vid);
    const st = L.att.get(vid); if (st) st.banned = !timeout;
    if (!timeout) { v.ban = 1; v.fol = 0; }
    sys('alert', '@' + v.u + (timeout ? ' foi silenciado(a) por 10 minutos' : ' foi banido(a) do canal'));
    if (fair) { reactAll('ban', 0.3); L.hype = U.clamp(L.hype + 3, 0, 100); L.toxic = Math.max(0, L.toxic - 2); }
    else { reactAll('ban_unfair', 0.25); SL.Rep.mod({ confianca: -1, imagem: -0.5 }); L.hype = U.clamp(L.hype - 4, 0, 100); }
  };
  LV.makeMod = vid => { const v = SL.Viewers.byId(vid); if (!v || v.tx > 0.6) return 'Essa pessoa não parece confiável para moderar.'; v.mod = 1; v.loy = U.clamp(v.loy + 15, 0, 100); if (LV.cur) sys('alert', '@' + v.u + ' agora é moderador(a) do canal'); return null; };
  // fala sem repetir as últimas frases; automática (auto) aparece como legenda na tela da live, não no chat
  const falar = (pool, auto) => {
    const L = LV.cur; L.falasUsadas = L.falasUsadas || [];
    const livres = pool.filter(x => !L.falasUsadas.includes(x)); const t = U.pick(livres.length ? livres : pool);
    L.falasUsadas.push(t); if (L.falasUsadas.length > 14) L.falasUsadas.shift();
    if (auto) L.fala = { t, at: performance.now() }; else say(t);
  };
  LV.FALAS = {
    dia: ['Hoje o dia foi corrido, mas tô aqui com vocês', 'Gente, vocês não sabem o que aconteceu no mercado hoje', 'Acordei com uma energia hoje que nem eu tô entendendo', 'Fui comprar pão e voltei com três coisas que eu não precisava', 'O vizinho resolveu furar a parede bem na hora da live, olha a sorte', 'Tomei tanto café hoje que tô ouvindo cores'],
    historia: ['Deixa eu contar uma história que aconteceu comigo...', 'Uma vez, na escola, eu caí da cadeira na frente da sala inteira', 'Minha avó acha que eu trabalho consertando computador', 'Uma vez eu fiquei preso no elevador com um cachorro que não gostava de mim', 'Quando eu era criança eu achava que o jogo salvava sozinho. Não salvava', 'Já perdi uma partida inteira porque o gato deitou no teclado'],
    perguntar: ['Chat, me contem: o que vocês fizeram hoje?', 'Pergunta séria: pizza com ketchup pode?', 'Vocês preferem praia ou serra?', 'Quem aí tá assistindo do trabalho? Pode confessar', 'Qual foi o melhor jogo que vocês jogaram esse ano?', 'Me indiquem uma série boa, que eu tô sem nada pra ver'],
    planos: ['Quero trazer mais desafios e vídeos pro canal', 'Meu sonho é fazer o canal virar meu trabalho de verdade', 'Semana que vem quero tentar uma live mais longa', 'Tô juntando pra trocar esse microfone, vocês merecem', 'Quero fazer uma live especial quando a gente bater a próxima meta'],
  };
  LV.PIADAS = ['Por que o computador foi ao médico? Porque estava com vírus!', 'Meu jogo travou mais que eu na prova de matemática', 'Eu não perco, eu deixo o adversário ganhar por educação', 'Minha dieta é igual meu ping: sempre alta', 'Eu jogo no modo difícil: o modo internet da minha casa', 'Meu personagem tem mais vida social que eu', 'Eu não sou ruim no jogo, eu sou criativo', 'O controle tá com defeito. Toda vez que eu erro, é o controle'];
  LV.talk = (topic, auto) => {
    const L = LV.cur; touch();
    const char = SL.Life.charisma(); const k = dim('talk') * (auto ? 0.6 : 1);   // falar sozinho rende menos que puxar assunto você mesmo
    const ok = U.chance(U.clamp(0.35 + char / 140, 0.2, 0.95));
    falar(LV.FALAS[topic] || LV.FALAS.dia, auto);
    if (ok) { L.hype = U.clamp(L.hype + 9 * k, 0, 100); L.mScore += 12 * k; reactAll('talk_ok', topic === 'perguntar' ? 0.4 : 0.18); }
    else { L.hype = U.clamp(L.hype + 2 * k, 0, 100); }
    if (topic === 'historia' && ok && U.chance(0.35)) { const m = { type: 'historia', txt: 'Contou uma história hilária', int: 0.6, funny: 0.75, good: true, mt: 'você contou aquela história hilária na live', clip: 0.7, game: L.game, sim: L.sim.sim, at: G().time.t }; L.moments.push(m); L.best.push(m); L.best.sort((a, b) => b.clip - a.clip); L.best.length = Math.min(L.best.length, 10); }
    if (topic === 'planos') { for (const st of L.present.values()) { const v = SL.Viewers.byId(st.id); if (v && v.loy > 40) st.sat = U.clamp(st.sat + 0.05, 0, 1); } }
    SL.Life.skillUp('carisma', 0.12); SL.Life.mod({ energia: -0.6 });
  };
  LV.joke = auto => {
    const L = LV.cur; touch(); const k = dim('joke') * (auto ? 0.6 : 1);
    const ok = U.chance(U.clamp(0.3 + SL.Life.charisma() / 160 + G().needs.humor / 400, 0.15, 0.9));
    falar(LV.PIADAS, auto);
    if (ok) { L.hype = U.clamp(L.hype + 12 * k, 0, 100); reactAll('joke_ok', 0.35); if (U.chance(0.25)) { const m = { type: 'funny', txt: 'Piada que fez o chat explodir', int: 0.55, funny: 0.85, good: true, mt: 'você fez aquela piada que o chat nunca esqueceu', clip: 0.68, game: L.game, sim: L.sim.sim, at: G().time.t }; L.moments.push(m); L.best.push(m); L.best.sort((a, b) => b.clip - a.clip); L.best.length = Math.min(L.best.length, 10); } }
    else { L.hype = U.clamp(L.hype - 4, 0, 100); reactAll('joke_bad', 0.3); }
  };
  LV.challenge = id => {
    const L = LV.cur; if (L.challenge) return 'Já existe um desafio em andamento.';
    const c = LV.CHALLENGES.find(x => x.id === id); if (!c) return null;
    touch();
    if (id === 'chat') {
      if (L.viewers < 5) return 'Precisa de pelo menos 5 pessoas na live.';
      say('Bora jogar com o chat! Quem quiser entrar, chega mais');
      L.hype = U.clamp(L.hype + 14 * dim('challenge'), 0, 100); reactAll('challenge', 0.35);
      G().promises.filter(p => p.status === 'pendente' && p.kind === 'inscritos').forEach(LV.keepPromise);
      for (const st of L.present.values()) st.sat = U.clamp(st.sat + 0.12, 0, 1);
      return null;
    }
    L.challenge = { id, label: c.label, until: L.min + (id === 'vencer' ? 25 : 10) };
    if (id === 'arriscado') L.risky = 10;
    say('Desafio aceito: ' + c.label + '!');
    L.hype = U.clamp(L.hype + 10 * dim('challenge'), 0, 100); reactAll('challenge', 0.35);
    return null;
  };
  LV.poll = id => {
    const L = LV.cur; if (L.poll) return 'Já tem uma enquete aberta.';
    const t = LV.POLLS.find(x => x.id === id); if (!t) return null; touch();
    let opts = t.opts, games = null;
    if (id === 'jogo_amanha') { games = U.shuffle(D.games.filter(g => g.id !== L.game && SL.Equip.canStream(g, '480p').ok).map(g => g.id)).slice(0, 2); games.unshift(L.game); opts = games.map(gid => D.gameById(gid).name); }
    L.poll = { id, q: t.q, opts, games, votes: opts.map(() => 0), end: L.min + 3 };
    sys('alert', 'Enquete: ' + t.q + ' (' + opts.join(' / ') + ')');
    L.hype = U.clamp(L.hype + 6 * dim('poll'), 0, 100); reactAll('poll', 0.25);
    return null;
  };
  LV.pause = () => { const L = LV.cur; if (L.ev.paused) return; touch(); say('Vou dar uma pausa de 10 minutinhos, já volto!'); L.ev.paused = 10; SL.Life.alimenta({ sede: 25 }); SL.Life.mod({ estresse: -4, energia: 3 }); if (SL.Life.foodCount('salgadinho')) { SL.Life.takeFood('salgadinho'); SL.Life.alimenta({ fome: 13 }); } else if (SL.Life.foodCount('pao')) { SL.Life.takeFood('pao'); SL.Life.alimenta({ fome: 28 }); } };
  LV.changeGame = gid => {
    const L = LV.cur; const g = D.gameById(gid); if (!g || gid === L.game) return;
    const cs = SL.Equip.canStream(g, L.quality); if (!cs.ok) return cs.reason;
    touch(); L.game = gid; L.sim = SL.GameSim.make(gid);
    say('Bora mudar: agora é ' + g.name + '!');
    for (const st of L.present.values()) { const v = SL.Viewers.byId(st.id); if (v) st.sat = U.clamp(st.sat + (v.favs.includes(g.cat) ? 0.1 : -0.18), 0, 1); }
    reactAll('game_change', 0.2); L.hype = U.clamp(L.hype - 3, 0, 100);
    G().promises.filter(p => p.status === 'pendente' && p.kind === 'jogo' && p.game === gid).forEach(LV.keepPromise);
    return null;
  };
  LV.toggleRisky = () => { const L = LV.cur; L.risky = L.risky > 0 ? 0 : 5; L.focus = false; touch(); if (L.risky) say('Agora é tudo ou nada!'); };
  LV.toggleFocus = () => { const L = LV.cur; L.focus = !L.focus; L.risky = 0; if (L.focus) { say('Deixa eu me concentrar aqui um pouquinho'); reactAll('focus', 0.1); } };
  LV.sponsor = cid => {
    const L = LV.cur; const c = G().contracts.find(x => x.id === cid); if (!L || !c) return 'Contrato não encontrado.';
    const b = D.brandById(c.brand);
    const err = SL.Sponsors ? SL.Sponsors.deliver(cid, 'live', { viewers: L.viewers, avg: L.sumV / Math.max(1, L.min) }) : null;
    if (err) return err;
    touch();
    say('Essa live tem o apoio de ' + b.name + '! Conheçam o ' + b.prod + ', link na descrição');
    L.sponsors[cid] = (L.sponsors[cid] || 0) + 1;
    L.ev.spon = { name: b.name, prod: b.prod, until: L.min + 10 };   // faixa do patrocinador na tela por 10 minutos
    L.hype = U.clamp(L.hype - 3, 0, 100); reactAll('sponsor', 0.2);
    if (b.ethics < 0.3) { SL.Rep.mod({ confianca: -1.5, imagem: -1 }); for (const st of L.present.values()) st.sat = U.clamp(st.sat - 0.05, 0, 1); }
    return null;
  };
  // intervalo de anúncios de 30, 60 ou 120 segundos: o dinheiro vai para o saldo da Twitch e cai na conta no repasse de segunda
  LV.AD_OPCOES = [
    { s: 30, label: '30 segundos', sai: 0.015, hype: 3 },
    { s: 60, label: '60 segundos', sai: 0.035, hype: 6 },
    { s: 120, label: '120 segundos', sai: 0.08, hype: 10 },
  ];
  LV.AD_ESPERA = 10;                               // minutos do jogo entre um intervalo e outro
  LV.adValor = (s, viewers) => (viewers || 0) * 0.003 * s * (G().ch.pulso.afil ? 1.25 : 1);   // R$ por intervalo (nov/2026: o dobro)
  LV.adEspera = () => { const L = LV.cur; if (!L || L.lastAd == null) return 0; return Math.max(0, LV.AD_ESPERA - (L.min - L.lastAd)); };
  // Mod AutoAnúncios (compra única, D.software 'auto_ads'): roda o intervalo sozinho.
  // modo 'logo': assim que libera, roda outro (como o dono faz à mão: espera um terminar e coloca outro).
  // modo 'hora': 2 por hora (um a cada 30 min); com o de 120 s, só 1 por hora. 'inicio': minutos de live antes do primeiro.
  // (Versão final: lembrar o dono se o limite de 2 por hora deve valer sempre, também no "um atrás do outro".)
  LV.temAutoAd = () => !!(G().equip.soft && G().equip.soft.auto_ads);
  LV.autoCfg = () => { const P = G().ch.pulso; const c = P.autoAd || (P.autoAd = { on: true, seg: 60, modo: 'logo', inicio: 5 }); if (c.modo === 'cada') c.modo = 'hora'; return c; };
  LV.autoLimite = c => c.seg === 120 ? 1 : 2;     // intervalos por hora no modo 'hora'
  LV.autoMinute = () => {
    const L = LV.cur; if (!L || !LV.temAutoAd()) return;
    const c = LV.autoCfg(); if (!c.on || L.ev.ad || LV.adEspera() > 0) return;
    if (L.min < (c.inicio || 0)) return;
    if (c.modo === 'hora') {
      const lim = LV.autoLimite(c); const hist = (L.adHist || []).filter(m => L.min - m < 60);
      if (hist.length >= lim) return;                                        // já passou o limite desta hora
      if (L.lastAd != null && L.min - L.lastAd < 60 / lim) return;           // espalha: um a cada 30 min (ou 60 com o de 120 s)
    }
    if (!LV.ad(c.seg)) L.stats.autoAds = (L.stats.autoAds || 0) + 1;
  };
  LV.ad = seg => {
    const L = LV.cur; if (!L) return 'Os anúncios só passam durante a live.';
    const o = LV.AD_OPCOES.find(x => x.s === (seg || 60)) || LV.AD_OPCOES[1];
    const falta = LV.adEspera(); if (falta > 0) return 'Espere ' + falta + ' min para outro intervalo de anúncios.';
    if (L.ev.ad) return 'Já tem um intervalo de anúncios passando.';
    const P = G().ch.pulso;
    touch(); L.stats.ads++; L.lastAd = L.min; (L.adHist = L.adHist || []).push(L.min);
    const rev = Math.round(LV.adValor(o.s, L.viewers) * U.rf(0.85, 1.15) * 100) / 100;
    L.stats.adRev += rev; P.bal += rev;
    (P.ads = P.ads || []).unshift({ t: G().time.t, s: o.s, v: Math.round(L.viewers), rev }); if (P.ads.length > 30) P.ads.length = 30;
    P.adsTotal = (P.adsTotal || 0) + rev;
    L.ev.ad = { s: o.s, t0: G().time.t, until: G().time.t + Math.max(1, Math.round(o.s / 60)) };
    say(o.s >= 120 ? 'Vou rodar uns anúncios rapidinho, aproveitem pra pegar uma água!' : 'Intervalo rapidinho, já volto!');
    sys('alert', 'Intervalo comercial de ' + o.s + ' segundos (' + U.money(rev) + ' para o seu saldo da Twitch)');
    L.hype = U.clamp(L.hype - o.hype, 0, 100); L.anon = Math.max(0, Math.round(L.anon * (1 - o.sai)));
    for (const st of L.present.values()) if (U.chance(o.sai * 0.6)) st.sat = U.clamp(st.sat - 0.08, 0, 1);
    reactAll('ad', 0.08 + o.s / 1000);
    SL.bus.emit('ads');
    return null;
  };
  LV.fixMic = () => { const L = LV.cur; if (!L.ev.mic) return; L.ev.mic = 0; touch(); say('Pronto, era o cabo. Tão me ouvindo agora?'); reactAll('mic_fix', 0.3); };
  LV.fixNet = mode => {
    const L = LV.cur;
    if (mode === 'qualidade') { const order = ['480p', '720p', '1080p', '1440p']; const i = order.indexOf(L.quality); if (i > 0) L.quality = order[i - 1]; L.ev.net = Math.max(0, L.ev.net - 3); say('Baixei a qualidade pra parar de travar'); }
    else { L.ev.net = 0; L.anon = Math.round(L.anon * 0.85); say('Reiniciei o roteador, voltamos!'); }
    touch(); reactAll('net_fix', 0.25);
  };
  LV.toggleFollowersOnly = () => { const L = LV.cur; L.followersOnly = !L.followersOnly; G().ch.pulso.followersOnly = L.followersOnly; if (L.followersOnly) { L.trolls.forEach(id => { const v = SL.Viewers.byId(id); if (v && !v.fol) L.present.delete(id); }); L.trolls.clear(); } sys('alert', L.followersOnly ? 'Chat só para seguidores ativado' : 'Chat aberto para todos'); };
  LV.greetCeleb = () => { const L = LV.cur; const c = L.ev.celeb; if (!c || c.greeted) return; c.greeted = true; touch(); say('Gente, o(a) ' + c.name + ' tá aqui! Que honra, valeu demais pela visita'); L.hype = U.clamp(L.hype + 10, 0, 100); SL.Rep.mod({ popularidade: 1.5, profissional: 1 }); L.ev.boost = Math.max(L.ev.boost, 20); if (SL.Social) SL.Social.celebMention(c); };
  LV.scheduleNext = (dayOffset, hour) => {
    const L = LV.cur; const G0 = G(); const day = SL.Clock.day() + dayOffset;
    G0.ch.schedule.push({ id: U.uid('s'), day, hour, done: false });
    const p = LV.makePromise('live', { day, hour }, 'Anunciado na live');
    if (L) { touch(); say('Próxima live: ' + SL.Clock.fmtDay(day) + ' às ' + hour + 'h. Anotem!'); }
    return p;
  };
  LV.setSpeed = s => SL.Clock.setSpeed(s);
  // levantar do PC com a live no ar (andar pela casa, comer, ir ao banheiro); voltar ao PC retoma
  LV.sair = () => { const L = LV.cur; if (!L || L.away) return; L.away = true; L.awayMin = 0; touch(); say('Já volto, galera! Não sai ninguém!'); sys('alert', 'O streamer saiu da frente do PC (a live continua)'); };
  LV.voltar = () => { const L = LV.cur; if (!L || !L.away) return; L.away = false; touch(); say('Voltei, galera!'); reactAll('pause_back', 0.25); };

  // ---------- fim ----------
  LV.forceEnd = reason => {
    const L = LV.cur; if (!L) return;
    if (reason === 'sono') {
      const m = { type: 'funny', txt: 'Dormiu ao vivo na frente do chat', int: 0.85, funny: 1, good: false, mt: 'você dormiu ao vivo na frente de todo mundo', clip: 0.95, game: L.game, sim: L.sim.sim, at: G().time.t };
      L.best.unshift(m); SL.Rep.mod({ imagem: -1, popularidade: 0.5 });
    }
    LV.end(reason);
  };
  LV.end = reason => {
    const L = LV.cur; if (!L) return null;
    const G0 = G(), P = G0.ch.pulso; const day = SL.Clock.day();
    LV.cur = null; LV.queue = [];
    if (G0.act && G0.act.id === 'live') { G0.act = null; SL.bus.emit('activity', null); }
    const dur = Math.max(1, L.min);
    const avg = L.sumV / dur; const avgQ = L.sumQ / dur;
    for (const st of L.present.values()) { /* quem ficou até o fim */ st.toEnd = true; }
    SL.Viewers.afterLive(L, [...L.att.values()]);
    P.livesN++; P.hours += dur / 60;
    const record = L.peak > P.peak && P.livesN > 1; P.peak = Math.max(P.peak, L.peak);
    G0.ch.avgViewers.push(Math.round(avg * 10) / 10); U.cap_list(G0.ch.avgViewers, 30);
    G0.ch.lastLiveQ = avgQ;
    G0.ch.catHist[L.game] = (G0.ch.catHist[L.game] || 0) + 1;
    if (!G0.ch.contentDays.includes(day)) G0.ch.contentDays.push(day); U.cap_list(G0.ch.contentDays, 90);
    // momentos marcantes do canal (memória coletiva)
    const witnesses = [...L.att.keys()];
    L.best.filter(m => m.mt && m.clip >= 0.72).slice(0, 2).forEach(m => {
      const cm = { id: U.uid('cm'), d: day, mt: m.mt, txt: m.txt, game: L.game, live: L.id };
      G0.ch.moments.push(cm); U.cap_list(G0.ch.moments, 40);
      witnesses.forEach(id => { const v = SL.Viewers.byId(id); if (v) { v.m.saw.push(cm.id); if (v.m.saw.length > 6) v.m.saw.shift(); } });
    });
    // material bruto para cortes
    const rawLive = SL.Videos ? SL.Videos.addRaw({ kind: 'live', game: L.game, minutes: dur, quality: Math.round(avgQ * 0.65 + L.tech.overall * 0.35), moments: L.best.slice(0, 8).map(m => ({ type: m.type, txt: m.txt, int: m.int, funny: m.funny, mt: m.mt, clip: m.clip, big: !!m.big })), live: L.id, title: L.title }) : null;
    // cortes automáticos no TikTok e no YouTube assim que a live acaba (pedido do dono)
    const cortes = rawLive && dur >= 10 ? SL.Videos.autoCortes(rawLive.id) : [];
    SL.Life.skillUp('carisma', dur / 60 * 0.5); SL.Life.skillUp('jogo', dur / 60 * 0.35);
    // reputação
    if (L.toxic > 6 && L.trolls.size) SL.Rep.mod({ imagem: -1 });
    SL.Rep.mod({ confianca: (avgQ - 50) / 60, popularidade: Math.log10(1 + L.peak) * 0.15 });
    // patrocínio: menções contam ao terminar
    const sum = { id: L.id, t0: L.t0, dur, game: L.game, title: L.title, peak: L.peak, avg: Math.round(avg * 10) / 10, fol: L.stats.fol, subs: L.stats.subs, don: Math.round(L.stats.don * 100) / 100, donN: L.stats.donN, msgs: L.stats.msgs,
      q: Math.round(avgQ), adRev: Math.round(L.stats.adRev * 100) / 100, newV: L.stats.newV, uniq: L.att.size, raid: L.stats.raid,
      graph: sample(L.graph, 60), hype: sample(L.hypeG, 60), best: L.best.slice(0, 5).map(m => ({ txt: m.txt, clip: m.clip, type: m.type })), reason: reason || 'normal', record, promises: L.promisesMade.length, cortes };
    G0.lives.push(sum); U.cap_list(G0.lives, 120);
    // repasse na hora (antes era toda segunda-feira): doações, inscrições e anúncios caem na conta
    if (P.bal >= 0.01) { const v = Math.round(P.bal * 100) / 100; P.bal = 0; SL.Econ.add(v, 'doacoes', 'Repasse da Twitch (live)'); sum.pago = v; }
    // afiliado
    if (!P.afil && LV.reqAfiliado().every(r => r.v >= r.meta)) { P.afil = true; SL.notify({ cat: 'carreira', icon: 'star', title: 'Você virou afiliado(a) da Twitch!', text: 'Agora seus espectadores podem se inscrever e você pode rodar anúncios.' }); if (SL.audio) SL.audio.play('levelup'); }
    if (P.afil && !P.parc && LV.reqParceiro().every(r => r.v >= r.meta)) { P.parc = true; SL.notify({ cat: 'carreira', icon: 'crown', title: 'Parceria Twitch aprovada!', text: 'Selo de parceiro, 1440p e repasse maior.' }); }
    if (record) SL.notify({ cat: 'canal', icon: 'trophy', title: 'Recorde de público!', text: 'Pico de ' + U.int(L.peak) + ' pessoas ao mesmo tempo.' });
    SL.bus.emit('live:end', sum);
    if (SL.Goals) SL.Goals.check();
    if (SL.audio) SL.audio.play('end');
    return sum;
  };
  const sample = (arr, n) => { if (arr.length <= n) return arr.slice(); const out = []; for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * arr.length / n)]); out.push(arr[arr.length - 1]); return out; };

  SL.bus.on('tick:minute', () => { if (LV.cur) { LV.minute(); LV.autoMinute(); } });
})(window.SL);

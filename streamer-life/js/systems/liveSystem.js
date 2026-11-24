/* Transmissão ao vivo: público agregado + pessoas detalhadas no chat, momentos do jogo, ações do streamer,
   acontecimentos aleatórios, doações, seguidores, inscrições e o resumo final. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const LV = SL.Live = {};
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
    const msPerMin = 1000 / (SL.Clock.rate() || 0.25);
    LV.queue.push({ at: performance.now() + (delayFrac == null ? U.rand() : delayFrac) * msPerMin * 0.95, msg });
    L.chat.push(msg); if (L.chat.length > 220) L.chat.splice(0, L.chat.length - 220);
    L.stats.msgs++;
    if (msg.vid) { const st = L.present.get(msg.vid); if (st) st.lastMsg = L.min; const v = SL.Viewers.byId(msg.vid); if (v) v.m.msg++; }
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
    const G0 = G(), P = G0.ch.pulso, g = D.gameById(opts.game);
    SL.Viewers.ensureNpcViewers();
    const day = SL.Clock.day(), h = SL.Clock.hourF();
    // live agendada / prometida
    let promised = false;
    G0.ch.schedule.forEach(s => { if (!s.done && s.day === day && Math.abs(s.hour - h) <= 1.6) { s.done = true; promised = true; } });
    G0.promises.forEach(p => {
      if (p.status === 'pendente' && p.kind === 'live' && p.day === day && Math.abs(p.hour - h) <= 2) { LV.keepPromise(p); promised = true; }
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
    let show = 0.04 * (0.5 + 0.5 * SL.Algo.todMul(Math.floor(h))) * (L.announced ? 1.35 : 1) * (promised ? 1.25 : 1) * (0.7 + consistency * 0.5) * (0.6 + G0.ch.lastLiveQ / 125) * (0.6 + G0.rep.confianca / 125);
    if (G0.ch.catHist[g.id] === undefined && G0.ch.pulso.livesN > 3) show *= 0.85;
    const total = anonF * show;
    for (let m = 0; m < L.planned + 30; m++) L.anonPlan[m] = total * (Math.exp(-m / 15) - Math.exp(-(m + 1) / 15));
    SL.Life.start('live');
    G0.flags.liveToday = day;
    SL.bus.emit('live:start', L);
    sys('alert', 'Transmissão iniciada: ' + L.title);
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
    L.alerts.push({ k: 'follow', u: v.u });
    if (SL.audio && L.stats.fol < 40) SL.audio.play('follow');
  };
  const subscribe = (v, gifted) => {
    const L = LV.cur, P = G().ch.pulso;
    v.sub = SL.Clock.day() + 30; v.subM = (v.subM || 0) + 1; v.loy = U.clamp(v.loy + 8, 0, 100);
    P.bal += 3.95; L.stats.subs++; P.subs++;
    sys('sub', '@' + v.u + ' se inscreveu' + (v.subM > 1 ? ' (' + v.subM + ' meses)' : '') + '!');
    L.alerts.push({ k: 'sub', u: v.u });
    if (SL.audio) SL.audio.play('sub');
  };
  const donate = (v, amount, text, uName) => {
    const L = LV.cur, P = G().ch.pulso;
    amount = Math.round(amount * 100) / 100;
    P.bal += amount * 0.95; L.stats.don += amount; L.stats.donN++;
    if (v) { v.m.don += amount; v.m.ld = SL.Clock.day(); const st = L.present.get(v.id); if (st) st.thanked = false; }
    const u = v ? v.u : uName;
    const msg = SL.Chat.msg(v, text, { kind: 'donation', amount, u, badges: v ? undefined : [] });
    pushMsg(msg, 0.1);
    L.donations.push({ msgId: msg.id, vid: v ? v.id : null, u, amount, at: L.min, thanked: false });
    L.alerts.push({ k: 'don', u, amount });
    if (SL.audio) SL.audio.play('donate');
    L.hype = U.clamp(L.hype + Math.min(12, 2 + amount / 10), 0, 100);
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
    const stayAnon = 8 + 30 * Math.pow(L.contentQ / 100, 1.2) + L.hype / 10;
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
      const dr = L.anon * 0.0002 * (L.hype / 60);
      if (U.chance(Math.min(0.9, dr))) { const idt = SL.Viewers.genIdentity(); donate(null, U.clamp(U.lognorm(Math.log(10), 0.8), 2, 300), SL.Chat.fill(U.pick(D.chat.donation), null, { u: 'o chat' }) || 'Pela live!', idt.u); }
    }

    // pessoas detalhadas
    const ctx = LV.ctx();
    const catFitOf = v => v.favs.includes(g.cat) ? 1 : 0.55;
    let msgBudget = LV.MSG_CAP_MIN;
    const hour = SL.Clock.hour();
    const present = [...L.present.values()];
    present.forEach(st => {
      const v = SL.Viewers.byId(st.id); if (!v) { L.present.delete(st.id); return; }
      st.mins++;
      let e = 0.22 + 0.33 * (L.contentQ / 100) + 0.18 * catFitOf(v) + 0.15 * (L.tech.overall / 100) + 0.12 * (L.hype / 100);
      if (st.replied && L.min - st.repliedAt < 20) e += 0.12;
      if (L.toxic > 2 && v.tx < 0.5) e -= 0.08;
      if (L.silence > 8) e -= 0.1;
      if (paused) e -= 0.15;
      if (v.tx > 0.6) e = 0.45 + (L.trollFed ? 0.2 : 0);
      if (v.npc) e = Math.max(e, 0.72);
      st.sat = U.clamp(st.sat * 0.85 + e * 0.15, 0, 1);
      // ir embora
      let stay = 6 + v.pa * 38 + v.loy * 0.55 + (st.sat - 0.5) * 60;
      let hd = Math.abs(hour - v.hr); hd = Math.min(hd, 24 - hd); if (hd > 4) stay *= 0.6;
      if (v.npc) stay = Math.max(stay, 60);
      stay = U.clamp(stay, 4, 260);
      if (U.chance(1 / stay)) { leave(v, st, st.sat < 0.42); return; }
      // seguir, inscrever, doar
      if (!v.fol && st.mins >= 5 && st.sat > 0.52 && U.chance((st.sat - 0.5) * 0.09 * (0.6 + v.int / 100))) follow(v);
      if (v.npc && !v.fol && st.mins >= 2) follow(v);
      if (P.afil && v.fol && !v.sub && v.loy > 40 && v.w >= 2 && U.chance(0.0016 * v.w * v.gen * st.sat * (1 + L.hype / 100))) subscribe(v);
      const bigNow = moments.some(m => m.big);
      if (v.w >= 1 && U.chance(v.gen * v.w * 0.00042 * (st.sat + 0.2) * (bigNow ? 2.5 : 1) * (v.npc ? 0.3 : 1))) {
        const amt = U.clamp([0, 4, 8, 18, 45, 120][v.w] * U.lognorm(0, 0.5), 2, 2000);
        const t = SL.Chat.fill(U.pick(D.chat.donation), v, { u: U.pick(['a família', 'o chat', 'minha mãe', 'todo mundo']) });
        donate(v, amt, t || 'Pela live!');
      }
      // falar
      if (msgBudget <= 0) return;
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
    const hasMod = [...L.present.keys()].some(id => (SL.Viewers.byId(id) || {}).mod) || G0.staff.some(s => (D.npcById(s.npc) || {}).role === 'moderador') || !!G0.equip.soft.bot_chat;
    if (L.trolls.size && hasMod && U.chance(0.5)) {
      const tid = [...L.trolls][0]; const tv = SL.Viewers.byId(tid);
      if (tv && L.present.has(tid)) { sys('mod', SL.Chat.fill(U.pick(D.chat.mod), null, {}), { u: 'moderação' }); L.present.delete(tid); sys('alert', '@' + tv.u + ' foi silenciado(a) pela moderação'); }
      L.trolls.delete(tid);
    }
    if (L.trolls.size && !hasMod && L.toxic > 3 && U.chance(0.3)) { L.hype = U.clamp(L.hype - 2, 0, 100); }

    eventsMinute(g);
    pollMinute();

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
    const G0 = G(); if (!G0) return; const day = SL.Clock.day(), h = SL.Clock.hour();
    G0.promises.forEach(p => {
      if (p.status !== 'pendente') return;
      if (p.kind === 'live' && (day > p.day || (day === p.day && h > p.hour + 2))) LV.breakPromise(p);
      if ((p.kind === 'jogo' || p.kind === 'inscritos') && day > p.until) LV.breakPromise(p);
    });
    G0.ch.schedule.forEach(s => { if (!s.done && !s.missed && (day > s.day || (day === s.day && h > s.hour + 2))) { s.missed = true; SL.Rep.mod({ confianca: -1.5 }); SL.notify({ cat: 'canal', icon: 'alert', title: 'Live agendada não aconteceu', text: 'Seus seguidores esperaram e você não entrou ao vivo.' }); } });
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
    const h = SL.Clock.hour();
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
  LV.talk = topic => {
    const L = LV.cur; touch();
    const char = SL.Life.charisma(); const k = dim('talk');
    const ok = U.chance(U.clamp(0.35 + char / 140, 0.2, 0.95));
    const lines = { dia: ['Hoje o dia foi corrido, mas tô aqui com vocês', 'Gente, vocês não sabem o que aconteceu no mercado hoje'], historia: ['Deixa eu contar uma história que aconteceu comigo...', 'Uma vez, na escola, eu...'], perguntar: ['Chat, me contem: o que vocês fizeram hoje?', 'Pergunta séria: pizza com ketchup pode?'], planos: ['Quero trazer mais desafios e vídeos pro canal', 'Meu sonho é fazer o canal virar meu trabalho de verdade'] };
    say(U.pick(lines[topic] || lines.dia));
    if (ok) { L.hype = U.clamp(L.hype + 9 * k, 0, 100); L.mScore += 12 * k; reactAll('talk_ok', topic === 'perguntar' ? 0.4 : 0.18); }
    else { L.hype = U.clamp(L.hype + 2 * k, 0, 100); }
    if (topic === 'historia' && ok && U.chance(0.35)) { const m = { type: 'historia', txt: 'Contou uma história hilária', int: 0.6, funny: 0.75, good: true, mt: 'você contou aquela história hilária na live', clip: 0.7, game: L.game, sim: L.sim.sim, at: G().time.t }; L.moments.push(m); L.best.push(m); L.best.sort((a, b) => b.clip - a.clip); L.best.length = Math.min(L.best.length, 10); }
    if (topic === 'planos') { for (const st of L.present.values()) { const v = SL.Viewers.byId(st.id); if (v && v.loy > 40) st.sat = U.clamp(st.sat + 0.05, 0, 1); } }
    SL.Life.skillUp('carisma', 0.12); SL.Life.mod({ energia: -0.6 });
  };
  LV.joke = () => {
    const L = LV.cur; touch(); const k = dim('joke');
    const ok = U.chance(U.clamp(0.3 + SL.Life.charisma() / 160 + G().needs.humor / 400, 0.15, 0.9));
    say(U.pick(['Por que o computador foi ao médico? Porque estava com vírus!', 'Meu jogo travou mais que eu na prova de matemática', 'Eu não perco, eu deixo o adversário ganhar por educação', 'Minha dieta é igual meu ping: sempre alta']));
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
  LV.adValor = (s, viewers) => (viewers || 0) * 0.0015 * s * (G().ch.pulso.afil ? 1.25 : 1);   // R$ por intervalo
  LV.adEspera = () => { const L = LV.cur; if (!L || L.lastAd == null) return 0; return Math.max(0, LV.AD_ESPERA - (L.min - L.lastAd)); };
  LV.ad = seg => {
    const L = LV.cur; if (!L) return 'Os anúncios só passam durante a live.';
    const o = LV.AD_OPCOES.find(x => x.s === (seg || 60)) || LV.AD_OPCOES[1];
    const falta = LV.adEspera(); if (falta > 0) return 'Espere ' + falta + ' min para outro intervalo de anúncios.';
    if (L.ev.ad) return 'Já tem um intervalo de anúncios passando.';
    const P = G().ch.pulso;
    touch(); L.stats.ads++; L.lastAd = L.min;
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
    if (SL.Videos) SL.Videos.addRaw({ kind: 'live', game: L.game, minutes: dur, quality: Math.round(avgQ * 0.65 + L.tech.overall * 0.35), moments: L.best.slice(0, 8).map(m => ({ type: m.type, txt: m.txt, int: m.int, funny: m.funny, mt: m.mt, clip: m.clip, big: !!m.big })), live: L.id, title: L.title });
    SL.Life.skillUp('carisma', dur / 60 * 0.5); SL.Life.skillUp('jogo', dur / 60 * 0.35);
    // reputação
    if (L.toxic > 6 && L.trolls.size) SL.Rep.mod({ imagem: -1 });
    SL.Rep.mod({ confianca: (avgQ - 50) / 60, popularidade: Math.log10(1 + L.peak) * 0.15 });
    // patrocínio: menções contam ao terminar
    const sum = { id: L.id, t0: L.t0, dur, game: L.game, title: L.title, peak: L.peak, avg: Math.round(avg * 10) / 10, fol: L.stats.fol, subs: L.stats.subs, don: Math.round(L.stats.don * 100) / 100, donN: L.stats.donN, msgs: L.stats.msgs,
      q: Math.round(avgQ), adRev: Math.round(L.stats.adRev * 100) / 100, newV: L.stats.newV, uniq: L.att.size, raid: L.stats.raid,
      graph: sample(L.graph, 60), hype: sample(L.hypeG, 60), best: L.best.slice(0, 5).map(m => ({ txt: m.txt, clip: m.clip, type: m.type })), reason: reason || 'normal', record, promises: L.promisesMade.length };
    G0.lives.push(sum); U.cap_list(G0.lives, 120);
    // afiliado
    if (!P.afil && P.f >= 50 && P.livesN >= 7 && avg >= 3) { P.afil = true; SL.notify({ cat: 'carreira', icon: 'star', title: 'Você virou afiliado(a) da Twitch!', text: 'Agora seus espectadores podem se inscrever e você pode rodar anúncios.' }); if (SL.audio) SL.audio.play('levelup'); }
    if (P.afil && !P.parc && P.f >= 15000 && P.hours >= 150 && G0.ch.avgViewers.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, G0.ch.avgViewers.length) >= 75) { P.parc = true; SL.notify({ cat: 'carreira', icon: 'crown', title: 'Parceria Twitch aprovada!', text: 'Selo de parceiro, 1440p e repasse maior.' }); }
    if (record) SL.notify({ cat: 'canal', icon: 'trophy', title: 'Recorde de público!', text: 'Pico de ' + U.int(L.peak) + ' pessoas ao mesmo tempo.' });
    SL.bus.emit('live:end', sum);
    if (SL.Goals) SL.Goals.check();
    if (SL.audio) SL.audio.play('end');
    return sum;
  };
  const sample = (arr, n) => { if (arr.length <= n) return arr.slice(); const out = []; for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * arr.length / n)]); out.push(arr[arr.length - 1]); return out; };

  SL.bus.on('tick:minute', () => { if (LV.cur) LV.minute(); });
})(window.SL);

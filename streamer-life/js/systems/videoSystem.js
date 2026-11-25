/* Vídeos: gravação (material bruto), edição (por você ou por editor contratado), renderização,
   título/descrição/thumbnail/tags, publicação ou agendamento e desempenho ao longo do tempo. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const VS = SL.Videos = {};
  const G = () => SL.G;

  VS.TYPES = {
    tradicional: { label: 'Vídeo tradicional', plat: 'vision', len: [480, 1080], raws: ['gameplay', 'react', 'vlog', 'opiniao', 'desafio', 'colab', 'live'], work: 180, icon: 'video' },
    corte: { label: 'Corte de transmissão', plat: 'vision', len: [300, 720], raws: ['live'], work: 90, icon: 'scissors' },
    short: { label: 'Corte (TikTok)', plat: 'clipz', len: [15, 60], raws: 'any', work: 30, icon: 'clip', short: true },
    reels: { label: 'Reels (YouTube)', plat: 'vision', len: [15, 60], raws: 'any', work: 30, icon: 'clip', short: true },
    reel: { label: 'Reel (Instagram)', plat: 'connect', len: [15, 90], raws: 'any', work: 35, icon: 'connect', short: true },
    gameplay: { label: 'Gameplay', plat: 'vision', len: [720, 1500], raws: ['gameplay', 'live'], work: 120, icon: 'gamepad' },
    reacao: { label: 'Reação', plat: 'vision', len: [480, 1080], raws: ['react'], work: 140, icon: 'eye' },
    opiniao: { label: 'Vídeo de opinião', plat: 'vision', len: [360, 900], raws: ['opiniao'], work: 150, icon: 'megaphone' },
    vlog: { label: 'Vlog', plat: 'vision', len: [420, 1080], raws: ['vlog'], work: 200, icon: 'cam' },
    desafio: { label: 'Desafio', plat: 'vision', len: [480, 1080], raws: ['desafio'], work: 170, icon: 'target' },
    colab: { label: 'Colaboração', plat: 'vision', len: [600, 1200], raws: ['colab'], work: 170, icon: 'users' },
  };
  VS.RAWKINDS = {
    gameplay: { label: 'Gameplay', where: 'pc', icon: 'gamepad' },
    desafio: { label: 'Desafio em jogo', where: 'pc', icon: 'target' },
    react: { label: 'Reação a vídeos', where: 'pc', icon: 'eye' },
    opiniao: { label: 'Opinião (câmera e microfone)', where: 'pc', icon: 'megaphone' },
    vlog: { label: 'Vlog na rua', where: 'rua', icon: 'cam' },
    live: { label: 'Gravação de live', where: 'auto', icon: 'live' },
    colab: { label: 'Colaboração', where: 'auto', icon: 'users' },
  };
  VS.LEVELS = { rapida: { label: 'Rápida', mult: 0.5, q: 0.85 }, padrao: { label: 'Padrão', mult: 1, q: 1 }, caprichada: { label: 'Caprichada', mult: 2.1, q: 1.2 } };

  // ---------- material bruto ----------
  VS.addRaw = r => {
    const G0 = G();
    const raw = Object.assign({ id: U.uid('r'), t: G0.time.t, used: 0 }, r);
    G0.raw.push(raw); U.cap_list(G0.raw, 40);
    SL.bus.emit('videos');
    return raw;
  };
  VS.recQuality = (kind, game, place) => {
    const s = SL.Equip.stats(); const perf = SL.Life.perf(); const ch = SL.Life.charisma();
    let q;
    if (kind === 'vlog') q = 0.42 * s.vlog + 0.33 * ch + 0.25 * (place ? 70 : 45);
    else if (kind === 'opiniao') q = 0.4 * ch + 0.3 * s.audio + 0.18 * (s.hasCam ? s.video * (0.55 + s.light / 180) : 10) + 0.12 * s.cenario;
    else {
      const g = D.gameById(game) || D.games[0];
      const fps = U.clamp(s.perf / Math.max(1, (g.console ? 6 : g.demand) + 8), 0.2, 1);
      q = 0.34 * fps * 100 + 0.24 * s.audio + 0.2 * ch + 0.12 * (s.hasCam ? s.video : 15) + 0.1 * s.cenario;
      if (g.console) q *= 0.6 + s.cap / 250;
    }
    return U.clamp(q * (0.55 + perf * 0.45), 5, 100);
  };
  VS.canRecord = (kind, game) => {
    const G0 = G();
    if (kind === 'vlog') { if (G0.loc.area !== 'local') return 'Vlogs são gravados na rua: vá a algum lugar da cidade.'; return null; }
    if (G0.loc.area !== 'casa') return 'Grave no computador de casa.';
    if (!SL.Equip.item('computador')) return 'Seu computador está quebrado.';
    if (kind !== 'opiniao') { const g = D.gameById(game); if (!g) return 'Escolha o jogo.'; const cs = SL.Equip.canStream(g, '480p'); if (!cs.ok) return cs.reason; }
    return null;
  };
  VS.startRecording = o => {
    const err = VS.canRecord(o.kind, o.game); if (err) return err;
    const game = o.kind === 'react' ? 'react' : o.kind === 'opiniao' ? 'conversa' : o.kind === 'vlog' ? 'conversa' : o.game;
    return SL.Life.start('gravar', { kind: o.kind, game, topic: o.topic || null, minutes: o.minutes, place: o.place || (G().loc.place || null), sim: SL.GameSim.make(game), moments: [], q: 0, n: 0 }, { label: 'Gravando: ' + VS.RAWKINDS[o.kind].label.toLowerCase() });
  };
  VS.recordMinute = a => {
    const d = a.data; const G0 = G();
    if (d.kind === 'vlog') {
      if (U.chance(0.12)) d.moments.push({ type: 'vlog', txt: U.pick(['Encontrou um cachorro simpático', 'Provou uma comida diferente', 'Mostrou um cantinho escondido', 'Conversou com um fã na rua', 'Pegou o pôr do sol perfeito', 'Tropeçou ao vivo na calçada']), int: U.rf(0.3, 0.7), funny: U.rf(0, 0.7), clip: U.rf(0.3, 0.75), mt: null });
    } else if (d.kind === 'opiniao') {
      if (U.chance(0.1)) d.moments.push({ type: 'opiniao', txt: U.pick(['Argumento forte sobre o assunto', 'Comparação engraçada', 'Momento sincero', 'Frase de efeito que pode virar corte']), int: U.rf(0.3, 0.75), funny: U.rf(0, 0.5), clip: U.rf(0.35, 0.8) });
    } else {
      const k = { skill: G0.player.skills.jogo / 100, perf: SL.Life.perf(), risky: d.kind === 'desafio', focus: d.kind !== 'desafio', char: SL.Life.charisma() };
      SL.GameSim.step(d.sim, k).forEach(m => d.moments.push({ type: m.type, txt: m.txt, int: m.int, funny: m.funny, clip: m.clip, mt: m.mt, big: !!m.big }));
    }
    if (d.moments.length > 40) { d.moments.sort((x, y) => y.clip - x.clip); d.moments.length = 25; }
    d.q += VS.recQuality(d.kind, d.game, d.place); d.n++;
  };
  VS.recordEnd = (a, ok) => {
    const d = a.data;
    if (d.n < 5) { SL.notify({ cat: 'canal', icon: 'video', title: 'Gravação descartada', text: 'Menos de 5 minutos não rende vídeo.' }); return; }
    d.moments.sort((x, y) => y.clip - x.clip);
    const raw = VS.addRaw({ kind: d.kind, game: d.game, topic: d.topic, minutes: d.n, quality: Math.round(d.q / d.n), moments: d.moments.slice(0, 12), place: d.place });
    SL.Life.skillUp(d.kind === 'opiniao' || d.kind === 'vlog' ? 'carisma' : 'jogo', d.n / 60 * 0.4);
    SL.notify({ cat: 'canal', icon: 'video', title: 'Gravação pronta', text: U.dur(d.n) + ' de material (' + VS.RAWKINDS[d.kind].label.toLowerCase() + '). Continue no YouTube ou no TikTok.', app: 'vision' });
    if (!G().ch.contentDays.includes(SL.Clock.day())) G().ch.contentDays.push(SL.Clock.day());
    return raw;
  };

  // ---------- edição ----------
  VS.workNeeded = (type, level) => {
    const G0 = G(); const T = VS.TYPES[type]; const s = SL.Equip.stats();
    let w = T.work * VS.LEVELS[level].mult * (1.4 - G0.player.skills.edicao / 100 * 0.6);
    if (G0.equip.soft.editor_pro) w *= 0.75;
    w *= 1 - s.prod / 100; w *= 1.3 - s.render / 100 * 0.4;
    return Math.max(8, Math.round(w * 0.5));   // nov/2026: edição 2x mais curta (pedido do dono)
  };
  VS.createEdit = o => {
    const G0 = G(); const raw = G0.raw.find(r => r.id === o.raw); if (!raw) return 'Escolha um material.';
    const T = VS.TYPES[o.type]; if (!T) return 'Tipo inválido.';
    if (!o.moments || !o.moments.length) return 'Escolha pelo menos um momento.';
    if (T.short && o.moments.length > 1) o.moments = o.moments.slice(0, 1);
    const e = { id: U.uid('e'), raw: raw.id, type: o.type, plat: T.plat, game: raw.game, topic: raw.topic, rawKind: raw.kind, rawQ: raw.quality, moments: o.moments.map(i => raw.moments[i]).filter(Boolean),
      level: o.level || 'padrao', work: VS.workNeeded(o.type, o.level || 'padrao'), done: 0, editor: o.editor || 'eu', status: 'editando', render: 0, qAcc: 0, qN: 0,
      title: '', desc: '', tags: [], thumb: { scene: 0, expr: 'surpreso', text: '', color: '#ffe066', arrow: false, circle: false }, sponsor: null, created: G0.time.t, rawTitle: raw.title || '' };
    raw.used++;
    G0.edits.push(e); SL.bus.emit('videos');
    return e;
  };
  VS.editQualityNow = (e) => {
    const G0 = G(); const s = SL.Equip.stats();
    let sk = G0.player.skills.edicao;
    if (e.editor !== 'eu') { const n = D.npcById(e.editor); sk = n ? n.skill : sk; }
    let q = 28 + sk * 0.55 + s.monQ * 0.1 + s.render * 0.08;
    if (G0.equip.soft.editor_pro) q *= 1.12;
    if (e.editor === 'eu') q *= 0.6 + SL.Life.perf() * 0.4;
    return U.clamp(q * VS.LEVELS[e.level].q, 5, 100);
  };
  VS.workMinute = editId => {
    const e = G().edits.find(x => x.id === editId); if (!e || e.status !== 'editando') return;
    e.done++; e.qAcc += VS.editQualityNow(e); e.qN++;
    if (e.done % 30 === 0) SL.Life.skillUp('edicao', 0.18);
    if (e.done >= e.work) VS.finishWork(e);
  };
  VS.finishWork = e => {
    const s = SL.Equip.stats(); const T = VS.TYPES[e.type];
    e.status = 'renderizando';
    const lenMin = (T.len[0] + T.len[1]) / 2 / 60;
    e.render = Math.max(2, Math.round(lenMin * 55 / Math.max(8, s.render)));
    if (G().act && G().act.id === 'editar' && G().act.data.edit === e.id) SL.Life.stop(true);
    SL.notify({ cat: 'canal', icon: 'scissors', title: 'Edição concluída', text: 'Renderizando "' + (e.title || T.label) + '": cerca de ' + U.dur(e.render) + '.', app: 'vision' });
    SL.bus.emit('videos');
  };
  VS.startEditing = (editId, minutes) => {
    const e = G().edits.find(x => x.id === editId); if (!e) return 'Edição não encontrada.';
    if (G().loc.area !== 'casa') return 'Edite no computador de casa.';
    if (e.editor !== 'eu') return 'Este vídeo está com o editor contratado.';
    return SL.Life.start('editar', { edit: e.id, minutes: Math.min(minutes, e.work - e.done) }, { label: 'Editando vídeo' });
  };
  VS.finalQuality = e => {
    const editQ = e.qN ? e.qAcc / e.qN : VS.editQualityNow(e);
    const mom = e.moments.length ? e.moments.reduce((a, m) => a + m.clip, 0) / e.moments.length * 100 : 30;
    const T = VS.TYPES[e.type];
    let need = T.short ? 1 : Math.max(2, Math.round((T.len[0] + T.len[1]) / 2 / 180));
    const fill = U.clamp(e.moments.length / need, 0.4, 1);
    return U.clamp(0.42 * e.rawQ + 0.36 * editQ + 0.22 * mom * fill, 3, 100);
  };

  // ---------- publicação ----------
  VS.canPublish = e => {
    if (e.status !== 'pronto') return 'O vídeo ainda não está pronto.';
    if (!e.title || e.title.trim().length < 4) return 'Escreva um título.';
    return null;
  };
  VS.publish = (editId, scheduleT) => {
    const G0 = G(); const e = G0.edits.find(x => x.id === editId); if (!e) return 'Não encontrado.';
    const err = VS.canPublish(e); if (err) return err;
    const T = VS.TYPES[e.type];
    const q = VS.finalQuality(e);
    const ts = SL.Algo.titleScore(e.title, { game: e.game, kind: 'video' });
    const th = SL.Algo.thumbScore(e.thumb, { title: e.title, momentInt: e.moments[0] ? e.moments[0].int : 0 }).score;
    const tg = SL.Algo.tagScore(e.tags, e.game);
    const ds = SL.Algo.descScore(e.desc);
    const P = SL.Algo.PLAT[T.plat];
    const fam = 1 + Math.log10(1 + (G0.ch[T.plat] || G0.ch.connect).f) * 0.05;
    let ctr = P.ctrBase * (0.5 + ts.score / 100 * 0.55 + (T.plat === 'vision' ? th / 100 * 0.6 : 0.3) + tg / 400 + ds / 800) * fam * (ts.bait ? 1.22 : 1);
    if (T.short) ctr = P.ctrBase * (0.55 + q / 100 * 0.6 + ts.score / 100 * 0.15);
    const len = Math.round(U.lerp(T.len[0], T.len[1], U.rand()));
    let ret = (T.short ? 0.26 : 0.17) + q / 100 * (T.short ? 0.62 : 0.55) - (ts.bait && q < 60 ? 0.09 : 0) - (e.sponsor ? 0.02 : 0);
    let trend = SL.Algo.trendMul(e.game);
    if (e.rawKind === 'opiniao' && e.topic && G0.trends.topics.some(t => t.key === e.topic)) trend *= 1.6;
    if (T.plat === 'clipz' && e.tags.some(t => G0.trends.tags.some(x => x.tag.toLowerCase() === '#' + t.toLowerCase().replace('#', '')))) trend *= 1.25;
    const funny = e.moments.some(m => m.funny > 0.7);
    const v = { id: U.uid('vd'), edit: e.id, plat: T.plat, type: e.type, title: e.title.trim(), desc: e.desc, tags: e.tags.slice(), thumb: Object.assign({}, e.thumb), game: e.game, len, quality: Math.round(q),
      ctr: U.clamp(ctr, 0.005, 0.9), ret: U.clamp(ret, 0.05, 0.95), luck: U.lognorm(0, 0.45), bait: ts.bait, trend, funny, sponsor: e.sponsor, topic: e.topic, rawKind: e.rawKind,
      t: scheduleT && scheduleT > G0.time.t ? scheduleT : G0.time.t, status: scheduleT && scheduleT > G0.time.t ? 'agendado' : 'publicado',
      views: 0, imp: 0, likes: 0, dislikes: 0, ccount: 0, comments: [], shares: 0, newSubs: 0, wh: 0, rev: 0, hist: [], viral: null, boost: null, ms: 0,
      moments: e.moments.map(m => m.txt).slice(0, 4), scores: { title: ts.score, thumb: th, tags: tg, desc: ds }, auto: !!e.auto };
    SL.Algo.rollViral(v);
    e.status = v.status === 'agendado' ? 'agendado' : 'publicado'; e.video = v.id;
    G0.videos.push(v);
    if (v.status === 'agendado') { if (SL.Calendar) SL.Calendar.add({ day: SL.Clock.day(v.t), hour: SL.Clock.hour(v.t), kind: 'publicacao', title: 'Publicação: ' + v.title, ref: v.id }); SL.notify({ cat: 'canal', icon: 'calendar', title: 'Vídeo agendado', text: '"' + v.title + '" sai ' + SL.Clock.fmtStamp(v.t) + '.' }); }
    else VS.onPublished(v);
    SL.bus.emit('videos');
    return null;
  };
  // vídeos publicados nos últimos 2 dias puxam público para a próxima live (sistemas ligados)
  VS.buzz = () => {
    const G0 = G(); const t = G0.time.t; let k = 0; let melhor = null;
    G0.videos.forEach(v => { if (v.status !== 'publicado' || t - v.t > 2880 || t < v.t) return; const f = Math.log10(1 + (v.views || 0)) / 45 + 0.01; k += f; if (!melhor || v.views > melhor.views) melhor = v; });
    return { k: Math.min(0.18, k), plat: melhor ? (melhor.plat === 'clipz' ? 'TikTok' : 'YouTube') : null, video: melhor };
  };
  VS.onPublished = v => {
    const G0 = G(); const day = SL.Clock.day();
    if (!G0.ch.contentDays.includes(day)) G0.ch.contentDays.push(day);
    if (v.sponsor && SL.Sponsors) SL.Sponsors.deliver(v.sponsor, 'video', { video: v.id });
    if (v.plat === 'vision' && SL.Social) SL.Social.autoPostVideo(v);
    if (v.rawKind === 'opiniao' && SL.Events) SL.Events.opinionRisk(v);
    SL.notify({ silent: !!v.auto, cat: 'canal', icon: v.plat === 'clipz' ? 'clip' : v.plat === 'connect' ? 'connect' : 'vision', title: (v.auto ? 'Corte automático no ' : 'Publicado no ') + ({ vision: 'YouTube', clipz: 'TikTok', connect: 'Instagram' })[v.plat], text: '"' + v.title + '"', app: v.plat === 'clipz' ? 'clipz' : v.plat === 'connect' ? 'connect' : 'vision' });
    SL.bus.emit('video:published', v);
    if (SL.Goals) SL.Goals.check();
  };

  // ---------- cortes automáticos no fim da live (pedido do dono, nov/2026) ----------
  // A gravação da live vira na hora um corte no TikTok e um corte no YouTube, com título, descrição,
  // hashtags e thumbnail automáticos. A nota depende dos momentos da live e da sua habilidade de edição.
  const AUTO_TIT = {
    short: ['{m}!', 'Ninguém esperava isso no {g}', 'Olha o que aconteceu na live de {g}', 'Esse momento no {g} foi INSANO', '{m} (ao vivo)'],
    corte: ['{m}: melhores momentos da live de {g}', 'MELHORES MOMENTOS: {g} ao vivo', 'A live de {g} foi assim: {m}', 'Corte da live: {m}'],
  };
  VS.autoCortes = rawId => {
    const G0 = G(); const raw = G0.raw.find(r => r.id === rawId); if (!raw || !raw.moments || !raw.moments.length) return [];
    const g = D.gameById(raw.game) || D.gameById('conversa'); const out = [];
    const ordem = raw.moments.map((m, i) => [m.clip, i]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
    [['short', 'TikTok'], ['corte', 'YouTube']].forEach(([type, nome]) => {
      const T = VS.TYPES[type]; const need = T.short ? 1 : Math.max(2, Math.round((T.len[0] + T.len[1]) / 2 / 180));
      const e = VS.createEdit({ raw: raw.id, type, moments: ordem.slice(0, Math.max(1, Math.min(need, ordem.length))), level: 'padrao' });
      if (typeof e === 'string') return;
      e.auto = true; e.qAcc = VS.editQualityNow(e) * 0.9; e.qN = 1; e.done = e.work; e.status = 'pronto';   // edição automática: um pouco pior que a sua
      const mo = e.moments[0]; const fill = s => s.replace('{g}', g.name).replace('{m}', mo ? mo.txt : 'Que momento');
      e.title = fill(U.pick(AUTO_TIT[type])).slice(0, 95);
      e.desc = 'Corte da live de ' + g.name + '. Tem live quase todo dia na Twitch: @' + G0.player.user + '. Segue para não perder a próxima!';
      e.tags = SL.Algo.suggestTags(raw.game).slice(0, 3);
      if (!T.short) e.thumb = { scene: 0, expr: 'surpreso', text: U.pick(['NÃO ACREDITO', 'QUE ISSO?!', 'INSANO']), color: '#ffe066', arrow: true, circle: false };
      if (VS.publish(e.id)) return;
      const v = G0.videos.find(x => x.id === e.video); if (v) out.push({ id: v.id, plat: nome, app: v.plat === 'clipz' ? 'clipz' : 'vision', title: v.title, q: v.quality });
    });
    return out;
  };

  // ---------- comentários ----------
  const MS = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000];
  const addComments = (v, n) => {
    const G0 = G(); const T = D.T.vcomments; const q = v.quality;
    for (let i = 0; i < n; i++) {
      let pool;
      if (v.bait && q < 60 && U.chance(0.45)) pool = T.clickbait;
      else if (v.sponsor && U.chance(0.15)) pool = T.sponsor;
      else if (v.rawKind === 'opiniao' && U.chance(0.6)) pool = T.opinion;
      else if (v.rawKind === 'vlog' && U.chance(0.4)) pool = T.vlog;
      else if (v.moments.length && U.chance(0.3)) pool = T.moment;
      else if (v.views < 30 && U.chance(0.3)) pool = T.first;
      else pool = q >= 75 ? T.great : q >= 55 ? T.good : q >= 35 ? T.meh : T.bad;
      const fans = G0.viewers.list.filter(x => x.fol && !x.ban);
      const who = fans.length && U.chance(0.55) ? U.pick(fans) : null;
      const u = who ? who.u : SL.Viewers.genIdentity().u;
      const text = U.pick(pool).replace('{m}', (U.pick(v.moments) || 'aquele momento').toLowerCase());
      v.comments.push({ id: U.uid('c'), u, vid: who ? who.id : null, text, t: G0.time.t, likes: U.ri(0, Math.max(1, Math.round(v.views / 200))), heart: false, reply: null });
    }
    if (v.comments.length > 30) v.comments.splice(0, v.comments.length - 30);
  };
  VS.replyComment = (videoId, cid, kind) => {
    const v = G().videos.find(x => x.id === videoId); if (!v) return;
    const c = v.comments.find(x => x.id === cid); if (!c) return;
    if (kind === 'heart') c.heart = true; else c.reply = kind;
    if (c.vid) { const w = SL.Viewers.byId(c.vid); if (w) { w.loy = U.clamp(w.loy + (kind === 'heart' ? 2 : 4), 0, 100); w.m.rep++; } }
    SL.Life.skillUp('marketing', 0.05); SL.bus.emit('videos');
  };

  // ---------- ciclos ----------
  SL.bus.on('tick:minute', () => {
    const G0 = G(); if (!G0) return;
    G0.edits.forEach(e => {
      if (e.status === 'renderizando') { e.render--; if (e.render <= 0) { e.status = 'pronto'; SL.notify({ cat: 'canal', icon: 'check', title: 'Vídeo renderizado', text: (e.title || VS.TYPES[e.type].label) + ' está pronto para publicar.', app: 'vision' }); SL.bus.emit('videos'); } }
    });
  });
  SL.bus.on('tick:hour', () => {
    const G0 = G(); if (!G0) return;
    // editores contratados trabalham das 9h às 18h
    const h = SL.Clock.hour();
    if (h >= 9 && h < 18) G0.edits.forEach(e => { if (e.status === 'editando' && e.editor !== 'eu') { for (let i = 0; i < 50; i++) { e.done++; e.qAcc += VS.editQualityNow(e); e.qN++; if (e.done >= e.work) { VS.finishWork(e); break; } } } });
    G0.videos.forEach(v => {
      if (v.status === 'agendado' && G0.time.t >= v.t) { v.status = 'publicado'; const e = G0.edits.find(x => x.id === v.edit); if (e) e.status = 'publicado'; if (SL.Calendar) SL.Calendar.removeRef(v.id); VS.onPublished(v); }
      if (v.status !== 'publicado') return;
      const before = v.views; const viralBefore = v.viral && G0.time.t >= v.t + v.viral.at * 60;
      SL.Algo.videoHour(v);
      for (let i = v.ms; i < MS.length; i++) if (before < MS[i] && v.views >= MS[i]) { v.ms = i + 1; if (MS[i] >= 1000) SL.notify({ cat: 'canal', icon: 'eye', title: 'Seu vídeo passou de ' + U.num(MS[i]) + ' visualizações', text: '"' + v.title + '"', app: v.plat === 'clipz' ? 'clipz' : 'vision' }); }
      if (v.viral && !v.viralNotified && G0.time.t >= v.t + v.viral.at * 60) { v.viralNotified = 1; SL.notify({ cat: 'canal', icon: 'fire', title: 'Seu vídeo está viralizando!', text: '"' + v.title + '" está sendo muito recomendado.', app: v.plat === 'clipz' ? 'clipz' : 'vision' }); if (SL.Social) SL.Social.newsAboutPlayer('good', { n: U.num(v.views) }); SL.Rep.mod({ popularidade: 2 }); }
      const wantComments = Math.min(30, Math.floor(Math.log2(1 + v.ccount)) * 2);
      if (v.comments.length < wantComments) addComments(v, Math.min(3, wantComments - v.comments.length));
      if (viralBefore === undefined) return;
    });
  });
  SL.bus.on('tick:day', () => {
    const G0 = G(); if (!G0) return; const ch = G0.ch;
    if (!ch.vision.mon && ch.vision.f >= 1000 && ch.vision.wh >= 4000) { ch.vision.mon = true; SL.notify({ cat: 'carreira', icon: 'money', title: 'Canal monetizado no YouTube!', text: 'Você entrou no Programa de Parceiros: seus vídeos agora rendem dinheiro.' }); if (SL.audio) SL.audio.play('levelup'); }
    if (!ch.clipz.mon && ch.clipz.f >= 10000 && ch.clipz.views >= 100000) { ch.clipz.mon = true; SL.notify({ cat: 'carreira', icon: 'money', title: 'Fundo de criadores do TikTok', text: 'Seus shorts agora pagam (pouco, mas pagam).' }); }
    // vídeo antigo volta a ser recomendado
    const old = G0.videos.filter(v => v.status === 'publicado' && G0.time.t - v.t > 20 * 1440 && v.quality >= 55);
    if (old.length && U.chance(0.04)) { const v = U.pick(old); v.boost = { until: G0.time.t + U.ri(2, 5) * 1440, mul: U.rf(4, 12) }; SL.notify({ cat: 'canal', icon: 'trend', title: 'Vídeo antigo voltando', text: '"' + v.title + '" voltou a ser recomendado do nada.', app: 'vision' }); }
  });
  VS.recentViews = (v, days) => { const d = Math.floor((G().time.t - v.t) / 1440); let s = 0; for (let i = Math.max(0, d - days + 1); i <= d; i++) s += v.hist[i] || 0; return s; };
})(window.SL);

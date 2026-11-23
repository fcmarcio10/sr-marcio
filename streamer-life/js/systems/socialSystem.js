/* Redes sociais: feed vivo (Instagram, YouTube, TikTok, Twitch), publicações do jogador, comentários, notícias e mensagens diretas. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const S = SL.Social = {};
  const G = () => SL.G;

  S.author = id => {
    if (id === 'me') { const p = G().player; return { name: p.name, handle: p.user, color: '#c9b8ff', me: true, look: p.look }; }
    const c = D.creatorById(id); if (c) { const st = G().creators.find(x => x.id === id); return { name: c.name, handle: c.handle, color: '#8b93a7', look: c.look, f: st ? st.f : c.f, creator: true }; }
    const n = D.newsAccounts.find(x => x.id === id); if (n) return { name: n.name, handle: n.handle, color: n.color, news: true };
    const p = D.npcById(id); if (p) return { name: p.name, handle: U.stripAccents(p.short).toLowerCase() + '_' + p.id, look: p.look, npc: true };
    const ce = D.celebs.find(x => x.handle === id); if (ce) return { name: ce.name, handle: ce.handle, celeb: true };
    return { name: id, handle: id };
  };
  const pushFeed = item => {
    const G0 = G();
    const it = Object.assign({ id: U.uid('f'), t: G0.time.t, likes: 0, ccount: 0, comments: [], liked: false }, item);
    G0.feed.push(it); U.cap_list(G0.feed, 180);
    SL.bus.emit('feed', it);
    return it;
  };
  S.pushFeed = pushFeed;

  S.news = (kind, data) => {
    const tpls = D.T.news[kind]; if (!tpls) return;
    const acc = kind === 'gossip' || kind === 'player_bad' ? 'n_fofoca' : kind === 'update' || kind === 'decline' ? 'n_games' : 'n_pulso';
    let text = U.pick(tpls);
    for (const k in data || {}) text = text.replace('{' + k + '}', data[k]);
    return pushFeed({ plat: 'connect', author: acc, kind: 'noticia', text, likes: U.ri(50, 4000) });
  };
  S.newsAboutPlayer = (tone, data) => {
    const p = G().player; data = Object.assign({ u: p.user, n: U.num(totalFollowers()) }, data || {});
    const it = S.news(tone === 'good' ? 'player_good' : 'player_bad', data);
    if (it) { it.aboutMe = true; SL.notify({ cat: 'social', icon: 'connect', title: tone === 'good' ? 'Falaram de você' : 'Estão falando mal de você', text: it.text, app: 'connect' }); }
    return it;
  };
  const totalFollowers = () => { const c = G().ch; return c.pulso.f + c.vision.f + c.clipz.f + c.connect.f; };
  S.totalFollowers = totalFollowers;

  // ---------- publicações do jogador no Instagram ----------
  S.post = o => {
    const G0 = G();
    if (G0.flags.lastPostT && G0.time.t - G0.flags.lastPostT < 20) return 'Espere um pouco antes de postar de novo.';
    const p = { id: U.uid('po'), author: 'me', t: G0.time.t, kind: o.kind, text: (o.text || '').trim(), photo: o.photo || null, poll: o.poll || null, topic: o.topic || null,
      eng: o.eng || 1, risk: o.risk || 0, polemic: !!o.polemic, reach: 0, likes: 0, comments: [], ccount: 0, shares: 0, newF: 0, live: o.live || null };
    if (!p.text && !p.photo && !p.poll) return 'A publicação está vazia.';
    if (p.photo) { p.eng *= ({ setup: 1.2 + SL.Equip.stats().cenario / 200, selfie: 0.9 + G0.needs.higiene / 300, comida: 0.95, lugar: 1.25 })[p.photo.kind] || 1; }
    if (p.poll) p.poll.votes = p.poll.opts.map(() => 0);
    G0.posts.push(p); U.cap_list(G0.posts, 80);
    G0.flags.lastPostT = G0.time.t;
    pushFeed({ plat: 'connect', author: 'me', kind: p.kind, text: p.text, ref: p.id, photo: p.photo, poll: p.poll });
    if (p.risk && SL.Events) SL.Events.postRisk(p);
    SL.Life.skillUp('marketing', 0.08);
    SL.bus.emit('posts');
    return null;
  };
  S.announceLiveNow = L => S.post({ kind: 'anuncio', text: 'Ao vivo agora: ' + L.title + ' — link no perfil', eng: 1.2, live: { now: true } });
  S.scheduleLivePost = (dayOff, hour) => {
    const p = SL.Live.scheduleNext(dayOff, hour);
    S.post({ kind: 'anuncio', text: 'Próxima live: ' + SL.Clock.fmtDay(SL.Clock.day() + dayOff) + ' às ' + hour + 'h. Ativa o lembrete!', eng: 1.1, live: { day: SL.Clock.day() + dayOff, hour } });
    return p;
  };
  S.autoPostVideo = v => pushFeed({ plat: 'vision', author: 'me', kind: 'video', text: v.title, ref: v.id, game: v.game });
  S.celebMention = c => {
    const it = pushFeed({ plat: 'connect', author: c.handle, kind: 'texto', text: 'Passei na live do @' + G().player.user + ' e a vibe é muito boa. Recomendo!', likes: U.ri(2000, 40000) });
    it.aboutMe = true;
    const gain = U.ri(8, 60) + Math.round(totalFollowers() * 0.03);
    G().ch.connect.f += gain; G().ch.pulso.f += Math.round(gain * 0.6);
    SL.notify({ cat: 'social', icon: 'star', title: c.name + ' falou de você', text: 'A menção trouxe uns ' + U.int(gain) + ' seguidores novos.', app: 'connect' });
  };

  const postHour = p => {
    const G0 = G(); const age = (G0.time.t - p.t) / 60; if (age > 72) return;
    const f = G0.ch.connect.f;
    let reach = (f * 0.035 * Math.exp(-age / 7) + 6 * p.eng * Math.exp(-age / 14)) * (p.polemic ? 1.6 : 1) * U.rf(0.7, 1.3) * SL.Algo.diff();
    if (p.kind === 'anuncio') reach *= 0.85;
    p.reach += reach;
    p.likes += reach * U.rf(0.05, 0.11) * p.eng;
    const nc = reach * (p.polemic ? 0.02 : 0.007);
    p.ccount += nc;
    const gained = reach * 0.0035 * p.eng * (p.polemic ? 1.3 : 1);
    p.fAcc = (p.fAcc || 0) + gained; const w = Math.floor(p.fAcc); if (w > 0) { p.fAcc -= w; p.newF += w; G0.ch.connect.f += w; }
    if (p.poll) { const n = Math.round(reach * 0.12); for (let i = 0; i < n; i++) p.poll.votes[U.ri(0, p.poll.opts.length - 1)]++; }
    const want = Math.min(12, Math.floor(Math.log2(1 + p.ccount)) * 2);
    while (p.comments.length < want) {
      const fans = G0.viewers.list.filter(v => v.fol && !v.ban);
      const who = fans.length && U.chance(0.6) ? U.pick(fans) : null;
      const pool = p.polemic ? D.T.pcomments.polemica : D.T.pcomments[p.photo ? 'foto' : p.kind] || D.T.pcomments.texto;
      p.comments.push({ u: who ? who.u : SL.Viewers.genIdentity().u, vid: who ? who.id : null, text: U.pick(pool), t: G0.time.t });
    }
    const it = G0.feed.find(x => x.ref === p.id); if (it) { it.likes = Math.round(p.likes); it.ccount = Math.round(p.ccount); it.poll = p.poll; }
  };

  // ---------- interação com o feed ----------
  S.like = feedId => {
    const it = G().feed.find(x => x.id === feedId); if (!it || it.liked) return;
    it.liked = true; it.likes++;
    if (D.creatorById(it.author) && SL.Rel) SL.Rel.touchCreator(it.author, 0.6, 'curtiu');
    SL.bus.emit('feed');
  };
  S.comment = (feedId, tone) => {
    const it = G().feed.find(x => x.id === feedId); if (!it) return null;
    const texts = { elogio: ['Que demais!', 'Conteúdo top, parabéns', 'Mandou muito bem'], piada: ['Kkkkkkk a cara do chat', 'Meu Deus, eu de manhã', 'Isso aqui sou eu'], critica: ['Discordo totalmente', 'Forçado isso aí', 'Já foi melhor'] };
    const text = U.pick(texts[tone] || texts.elogio);
    it.comments = it.comments || []; it.comments.push({ u: G().player.user, text, t: G().time.t, me: true }); it.ccount++;
    if (D.creatorById(it.author) && SL.Rel) SL.Rel.touchCreator(it.author, tone === 'critica' ? -5 : tone === 'piada' ? 1.5 : 1.2, tone === 'critica' ? 'criticou' : 'comentou');
    G().ch.connect.f += U.chance(0.25) ? U.ri(1, 4) : 0;
    SL.bus.emit('feed');
    return text;
  };
  S.share = feedId => {
    const it = G().feed.find(x => x.id === feedId); if (!it || it.shared) return;
    it.shared = true;
    if (D.creatorById(it.author) && SL.Rel) SL.Rel.touchCreator(it.author, 2, 'compartilhou');
    SL.bus.emit('feed');
  };

  // ---------- mensagens diretas ----------
  S.thread = (withId, name) => {
    const dms = G().dms;
    if (!dms[withId]) dms[withId] = { id: withId, name: name || S.author(withId).name, msgs: [], unread: 0, last: G().time.t };
    return dms[withId];
  };
  S.dm = (withId, text, opts, o) => {
    const th = S.thread(withId, o && o.name);
    const m = { id: U.uid('dm'), from: 'them', text, t: G().time.t, opts: opts || null, done: false, data: (o && o.data) || null };
    th.msgs.push(m); U.cap_list(th.msgs, 60); th.unread++; th.last = G().time.t;
    SL.bus.emit('dm', th);
    if (!(o && o.silent)) SL.notify({ cat: 'pessoas', icon: 'chat', title: th.name, text, app: 'mensagens', args: { thread: withId }, sound: 'msg' });
    return m;
  };
  S.me = (withId, text) => { const th = S.thread(withId); th.msgs.push({ id: U.uid('dm'), from: 'me', text, t: G().time.t }); th.last = G().time.t; SL.bus.emit('dm', th); };
  S.unreadDMs = () => Object.values(G().dms).reduce((s, t) => s + t.unread, 0);

  // ---------- ciclos ----------
  SL.bus.on('tick:hour', () => {
    const G0 = G(); if (!G0) return;
    G0.posts.forEach(postHour);
    // fãs mandam mensagem de vez em quando
    const f = totalFollowers();
    if (f > 30 && U.chance(Math.min(0.06, 0.004 + Math.log10(f) * 0.006))) {
      const fans = G0.viewers.list.filter(v => v.fol && v.loy > 40 && !v.npc && !v.ban);
      if (fans.length) {
        const v = U.pick(fans);
        const txt = U.pick(['Oi! Só queria dizer que suas lives me ajudam a relaxar depois do trabalho.', 'Assisto desde o começo, continua assim!', 'Você podia fazer live de ' + (D.gameById(v.fg) || {}).name + ', ia ser demais.', 'Meu sonho é ser streamer também. Alguma dica?', 'Seu último vídeo me fez rir demais.']);
        S.dm('fan_' + v.id, txt, [{ id: 'fan_obrigado', label: 'Agradecer com carinho' }, { id: 'fan_curto', label: 'Responder rapidinho' }, { id: 'fan_ignorar', label: 'Deixar no visto' }], { name: '@' + v.u + ' (fã)', data: { vid: v.id }, silent: true });
      }
    }
  });
})(window.SL);

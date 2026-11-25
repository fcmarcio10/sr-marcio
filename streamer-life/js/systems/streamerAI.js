/* IA dos outros criadores: fazem live no horário deles, publicam vídeos e posts, crescem, caem, brigam,
   viralizam e reagem ao jogador (convites, menções, críticas, raids). O mundo não para quando você não está ao vivo. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const AI = SL.Creators = {};
  const G = () => SL.G;
  const total = c => c.f.pulso + c.f.vision + c.f.clipz + c.f.connect;
  AI.total = total;
  AI.state = id => G().creators.find(c => c.id === id);
  AI.def = id => D.creatorById(id);

  const pickGame = def => {
    const opts = def.niche.map(id => D.gameById(id)).filter(Boolean);
    return U.wpick(opts, g => SL.Algo.trendMul(g.id)).id;
  };
  const titleFor = (def, game) => {
    const g = D.gameById(game);
    const pool = def.vlog ? D.T.creatorTitles.vlog : def.tech ? D.T.creatorTitles.tech : D.T.creatorTitles[g ? g.sim : 'conversa'] || D.T.creatorTitles.conversa;
    return U.pick(pool).replace('{g}', g ? g.name : '').replace('{n}', U.ri(7, 31));
  };

  const goLive = (c, def) => {
    const G0 = G(); const game = pickGame(def);
    const h = SL.Clock.hour();
    const viewers = Math.max(1, Math.round(c.f.pulso * U.rf(0.025, 0.06) * (0.6 + 0.4 * SL.Algo.todMul(h)) * (1 + c.mom) * SL.Algo.trendMul(game)));
    c.live = { game, viewers, start: G0.time.t, until: G0.time.t + def.sched.dur * 60, title: titleFor(def, game) };
    SL.Social.pushFeed({ plat: 'pulso', author: c.id, kind: 'live', text: c.live.title, game, views: viewers });
    if (U.chance(0.4)) SL.Social.pushFeed({ plat: 'connect', author: c.id, kind: 'texto', text: U.pick(D.T.creatorPosts.live).replace('{g}', D.gameById(game).name), likes: Math.round(c.f.connect * U.rf(0.01, 0.04)) });
    // concorrente na mesma categoria do jogador
    const main = AI.playerMainGame();
    if (main === game && viewers > 800 && !(SL.Live && SL.Live.cur)) SL.notify({ cat: 'mundo', icon: 'live', title: 'Concorrente ao vivo', text: def.name + ' está ao vivo em ' + D.gameById(game).name + ' com ' + U.num(viewers) + ' pessoas. Seu horário compete com o dele(a).', silent: viewers < 5000 });
  };
  const endLive = (c, def) => {
    const L = c.live; c.live = null;
    const gain = Math.round(L.viewers * U.rf(0.01, 0.035) * (1 + c.mom));
    c.f.pulso += gain;
    // raid: manda o público para outra live
    const cur = SL.Live && SL.Live.cur;
    const rel = G().rel[c.id];
    if (cur && rel && (rel.aff >= 25 || (def.small && rel.aff >= 5)) && U.chance(0.55)) {
      const n = Math.max(2, Math.round(L.viewers * U.rf(0.15, 0.35)));
      cur.ev.raidIn += n;
      const ctx = Object.assign(SL.Live.ctx(), { u: def.name });
      SL.notify({ cat: 'canal', icon: 'users', title: 'Raid de ' + def.name + '!', text: U.int(n) + ' pessoas chegando na sua live.', sound: 'raid' });
      for (let i = 0; i < Math.min(6, n); i++) { const v = SL.Viewers.create({ cat: D.gameById(cur.game).cat, src: 'raid' }); const m = SL.Chat.say(v, 'raid', ctx); if (m) { cur.chat.push(m); SL.Live.queue.push({ at: performance.now() + i * 250, msg: m }); } }
      cur.hype = U.clamp(cur.hype + 15, 0, 100);
      if (SL.audio) SL.audio.play('raid');
      SL.Rel.touchCreator(c.id, 3, 'raid');
    }
  };
  AI.playerMainGame = () => {
    const h = G().ch.catHist; let best = null, n = 0;
    for (const k in h) if (h[k] > n) { n = h[k]; best = k; }
    return best;
  };

  SL.bus.on('tick:hour', () => {
    const G0 = G(); if (!G0) return;
    const dow = SL.Clock.dow(), h = SL.Clock.hour();
    G0.creators.forEach(c => {
      const def = AI.def(c.id); if (!def) return;
      if (c.live) {
        c.live.viewers = Math.max(1, Math.round(c.live.viewers * U.rf(0.95, 1.08)));
        if (G0.time.t >= c.live.until) endLive(c, def);
      } else if (def.sched.d.includes(dow) && def.sched.h === h && !c.paused && U.chance(0.88)) goLive(c, def);
    });
  });

  SL.bus.on('tick:day', day => {
    const G0 = G(); if (!G0) return;
    const pf = SL.Social.totalFollowers();
    G0.creators.forEach(c => {
      const def = AI.def(c.id); if (!def) return;
      if (c.paused && day >= c.paused) { c.paused = 0; SL.Social.pushFeed({ plat: 'connect', author: c.id, kind: 'texto', text: 'Voltei! Obrigado pela paciência, bora de live hoje', likes: Math.round(c.f.connect * 0.05) }); }
      // impulso: volta para perto de zero, com tendência do nicho
      const nicheTrend = def.niche.reduce((s, id) => s + SL.Algo.trendMul(id), 0) / def.niche.length;
      c.mom = U.clamp(c.mom * 0.95 + U.gauss() * 0.05 + (nicheTrend - 1) * 0.03 + (def.small ? def.amb * 0.012 : 0), -0.8, 1.2);
      const k = def.small ? 2.5 : 1;
      for (const p in c.f) c.f[p] = Math.max(0, Math.round(c.f[p] * (1 + (c.mom * 0.004 + 0.0006) * k + U.gauss() * 0.0015)));
      // vídeos
      if (U.chance(def.vids / 7)) {
        const game = pickGame(def); const title = titleFor(def, game);
        const views = Math.round(c.f.vision * U.lognorm(Math.log(0.07), 0.65) * (1 + c.mom));
        c.vids.push({ id: U.uid('cv'), title, views, t: G0.time.t, game }); U.cap_list(c.vids, 8);
        SL.Social.pushFeed({ plat: 'vision', author: c.id, kind: 'video', text: title, game, views, likes: Math.round(views * 0.05) });
        if (U.chance(0.5)) SL.Social.pushFeed({ plat: 'clipz', author: c.id, kind: 'short', text: U.pick(['O final desse clipe', 'Ninguém esperava isso', 'Parte 2 amanhã', 'O chat não acreditou']) + ' ' + U.pick(G0.trends.tags.map(t => t.tag).concat([''])), game, views: Math.round(c.f.clipz * U.lognorm(Math.log(0.15), 0.8)) });
      }
      // postagens
      if (U.chance(0.32)) {
        const kind = U.wkey({ life: 3, opinion: 1 + def.tox * 2, trend: 1.5, milestone: 0.4, drama: def.tox * 2.2, praise: def.warm * 1.2 });
        let text = U.pick(D.T.creatorPosts[kind]);
        const other = U.pick(G0.creators.filter(x => x.id !== c.id));
        text = text.replace('{g}', D.gameById(pickGame(def)).name).replace('{tag}', (G0.trends.tags[0] || { tag: '#ChatEscolhe' }).tag).replace('{n}', U.num(total(c))).replace('{h}', AI.def(other.id).handle);
        if (kind === 'praise') { c.rel[other.id] = U.clamp((c.rel[other.id] || 0) + 3, -100, 100); }
        if (kind === 'drama' && U.chance(0.2)) { const target = U.pick(G0.creators.filter(x => x.id !== c.id && (c.rel[x.id] || 0) < 0)); if (target) { text = U.pick(D.T.creatorPosts.beef).replace('{h}', AI.def(target.id).handle); c.rel[target.id] = (c.rel[target.id] || 0) - 5; if (U.chance(0.4)) SL.Social.news('gossip', { h: def.handle, h2: AI.def(target.id).handle }); } }
        SL.Social.pushFeed({ plat: 'connect', author: c.id, kind: 'texto', text, likes: Math.round(c.f.connect * U.rf(0.01, 0.06)) });
      }
      // acontecimentos raros
      if (U.chance(0.006)) { const gain = Math.round(total(c) * U.rf(0.05, 0.2)); c.f.clipz += gain; c.mom += 0.3; SL.Social.news('record', { h: def.handle, n: U.num(total(c)) }); if (AI.playerMainGame() && def.niche.includes(AI.playerMainGame())) SL.notify({ cat: 'mundo', icon: 'trend', title: 'Concorrente cresceu rápido', text: def.name + ' viralizou e ganhou ' + U.num(gain) + ' seguidores.', app: 'connect' }); }
      if (U.chance(0.004 + def.tox * 0.006)) { for (const p in c.f) c.f[p] = Math.round(c.f[p] * U.rf(0.9, 0.97)); c.mom -= 0.3; SL.Social.news('gossip', { h: def.handle, h2: AI.def(U.pick(G0.creators.filter(x => x.id !== c.id)).id).handle }); }
      if (U.chance(0.003)) { c.paused = day + U.ri(4, 12); SL.Social.news('gossip', { h: def.handle, h2: def.handle }); }
      c.hist.push({ d: day, f: total(c) }); U.cap_list(c.hist, 120);
      // relação com o jogador
      AI.considerPlayer(c, def, pf);
    });
  });

  // decide se o criador interage com o jogador hoje
  AI.considerPlayer = (c, def, pf) => {
    const G0 = G(); const rel = G0.rel[c.id]; if (!rel) return;
    const ratio = pf / Math.max(1, total(c));
    const sameNiche = def.niche.includes(AI.playerMainGame());
    const visible = pf > 150 || ratio > 0.05;
    if (!visible && !def.small) return;
    // conhecer o jogador
    if (!c.knowsPlayer && (sameNiche || def.small) && U.chance(def.small ? 0.08 : 0.01 + Math.min(0.06, ratio * 0.2))) {
      c.knowsPlayer = true;
      if (def.warm > 0.4) { G0.ch.connect.f++; SL.Social.dm(c.id, U.pick(D.T.creatorMsgs.congrats.concat(D.T.creatorMsgs.advice)), [{ id: 'cr_agradece', label: 'Agradecer e puxar papo' }, { id: 'cr_seco', label: 'Responder educadamente' }]); rel.met = true; if (rel.stage === 'desconhecido') rel.stage = 'conhecido'; }
      return;
    }
    if (!c.knowsPlayer) return;
    // convite de collab
    const size = ratio > 0.25 && ratio < 6 || def.small;
    if (!rel.flags.collabPending && (rel.aff >= 18 || (size && def.warm > 0.55)) && U.chance(0.03 + rel.aff / 1500)) {
      rel.flags.collabPending = 1;
      SL.Social.dm(c.id, U.pick(D.T.creatorMsgs.collab), [{ id: 'collab_sim', label: 'Topar uma live juntos' }, { id: 'collab_depois', label: 'Agora não, mas quero sim' }, { id: 'collab_nao', label: 'Recusar' }], { data: { kind: 'collab' } });
    }
    // menção (criador grande que gosta do jogador)
    if (rel.aff >= 45 && U.chance(0.02)) {
      const gain = Math.round(Math.min(total(c) * 0.004, 50000) * U.rf(0.5, 1.5)) + 10;
      G0.ch.connect.f += gain; G0.ch.pulso.f += Math.round(gain * 0.5);
      const it = SL.Social.pushFeed({ plat: 'connect', author: c.id, kind: 'texto', text: U.pick(D.T.creatorPosts.praise).replace('{h}', G0.player.user), likes: Math.round(c.f.connect * 0.04) }); it.aboutMe = true;
      SL.notify({ cat: 'social', icon: 'star', title: def.name + ' falou de você', text: 'A menção trouxe cerca de ' + U.int(gain) + ' seguidores.', app: 'connect' });
      SL.Rep.mod({ popularidade: 1, profissional: 1.5 });
    }
    // crítica (personalidade tóxica e jogador crescendo ou em polêmica)
    const polemic = G0.flags.polemicUntil && G0.time.t < G0.flags.polemicUntil;
    if ((def.drama || def.tox > 0.4) && (polemic || (sameNiche && ratio > 0.15)) && rel.aff < 15 && U.chance(polemic ? 0.25 : 0.015)) {
      if (SL.Events) SL.Events.creatorTalksAboutPlayer(c.id, polemic ? 'critica' : 'critica_leve');
    }
  };

  AI.ranking = () => {
    const G0 = G(); const list = G0.creators.map(c => ({ id: c.id, name: AI.def(c.id).name, handle: AI.def(c.id).handle, total: total(c), f: c.f, mom: c.mom, live: !!c.live }));
    const p = G0.player;
    list.push({ id: 'me', name: p.name, handle: p.user, total: SL.Social.totalFollowers(), f: { pulso: G0.ch.pulso.f, vision: G0.ch.vision.f, clipz: G0.ch.clipz.f, connect: G0.ch.connect.f }, me: true });
    return list.sort((a, b) => b.total - a.total);
  };
})(window.SL);

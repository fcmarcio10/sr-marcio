/* Redes sociais: YouTube (vídeos longos), TikTok (vídeos curtos) e Instagram (publicações). */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const $ = UI.$, $$ = UI.$$, ic = UI.ic, esc = U.esc;
  const author = id => SL.Social.author(id);
  const avatarCanvas = (id, size) => `<canvas data-av="${esc(id)}" style="width:${size || 38}px;height:${size || 38}px;border-radius:50%;flex:none"></canvas>`;
  const paintAvatars = root => $$('canvas[data-av]', root).forEach(cv => { const a = author(cv.dataset.av); if (a.look) SL.Avatar.toCanvas(cv, a.look, { scale: 1 }); else SL.Avatar.initial(cv, a.name, a.color); });
  const paintThumbs = root => $$('canvas[data-th]', root).forEach(cv => {
    const it = cv.dataset.th; const v = SL.G.videos.find(x => x.id === it);
    if (v) return SL.Preview.thumbTo(cv, { game: v.game, th: v.thumb, title: v.title, seed: v.id });
    const f = SL.G.feed.find(x => x.id === it); if (!f) return; const a = author(f.author);
    SL.Preview.thumbTo(cv, { game: f.game || 'conversa', th: { expr: U.pick(['surpreso', 'rindo', 'feliz']), text: f.text.split(' ').slice(0, 2).join(' '), color: '#ffe066', scene: 1 }, look: a.look, seed: f.id, title: f.text });
  });
  const trendTag = v => { if (v.status !== 'publicado') return '<span class="tag acc">agendado</span>'; const age = (SL.G.time.t - v.t) / 1440; if (age < 1) return '<span class="tag info">novo</span>'; const r = SL.Videos.recentViews(v, 2), p = SL.Videos.recentViews(v, 4) - r; if (v.viral && SL.G.time.t >= v.t + v.viral.at * 60 && age < (v.viral.at + v.viral.dur) / 24) return '<span class="tag live">viralizando</span>'; if (r > p * 1.2 && r > 20) return '<span class="tag ok">crescendo</span>'; if (r < p * 0.6) return '<span class="tag bad">perdendo audiência</span>'; return '<span class="tag">estável</span>'; };

  // ---------- VISION ----------
  SL.Apps.vision = {
    title: 'YouTube', short: 'YouTube', icon: 'vision', color: 'linear-gradient(135deg,#ff4136,#c4161c)', order: 3, pc: true, phone: true, w: 1000, h: 660,
    watch: ['videos', 'tick:hour', 'feed'],
    render(el, ctx) {
      const st = ctx.st; if (ctx.args && ctx.args.video && !st.used) { st.used = 1; st.tab = 'canal'; st.vid = ctx.args.video; }
      st.tab = st.tab || 'inicio';
      const tabs = [['inicio', 'Início'], ['canal', 'Seu canal'], ['tendencias', 'Tendências']];
      el.innerHTML = `<div class="app"><div class="app-head"><div class="brandbar"><span class="bl" style="background:#ff3b30">${ic('vision', 15)}</span>YouTube</div><div class="criar-bar"><button class="btn red sm" data-act="criar" data-k="video">${ic('video', 15)} Gravar vídeo</button><button class="btn sm" data-act="criar" data-k="reels">${ic('clip', 15)} Gravar Reels</button></div><div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`).join('')}</div></div><div class="app-body">${this[st.tab](ctx)}</div></div>`;
      paintAvatars(el); paintThumbs(el);
      const cv = $('#vi-ch', el); if (cv) { const s = this.dailyViews(30); UI.chart(cv, [{ data: s.data, color: '#ff5a36' }], { labels: s.labels }); }
      const cv2 = $('#vd-ch', el); if (cv2) { const v = SL.G.videos.find(x => x.id === st.vid); UI.chart(cv2, [{ data: v.hist.length ? v.hist.map(x => x || 0) : [0], color: '#ff5a36' }]); }
    },
    dailyViews(n) {
      const G = SL.G; const today = SL.Clock.day(); const arr = new Array(n).fill(0);
      G.videos.filter(v => v.plat === 'vision').forEach(v => { const d0 = SL.Clock.day(v.t); v.hist.forEach((x, i) => { const k = d0 + i - (today - n + 1); if (k >= 0 && k < n) arr[k] += x || 0; }); });
      return { data: arr, labels: arr.map(() => '') };
    },
    inicio() {
      const G = SL.G; const items = G.feed.filter(f => f.plat === 'vision').slice().reverse().slice(0, 24);
      return `<div class="vgrid">${items.map(f => { const a = author(f.author); return `<div class="vcard" data-act="watch" data-f="${f.id}"><canvas data-th="${f.author === 'me' ? f.ref : f.id}"></canvas><b>${esc(f.text)}</b><small>${esc(a.name)} · ${U.num(f.author === 'me' ? (G.videos.find(v => v.id === f.ref) || {}).views || 0 : f.views || 0)} visualizações · ${SL.Clock.ago(f.t)}</small></div>`; }).join('') || '<div class="empty">O feed se enche conforme os criadores publicam.</div>'}</div>`;
    },
    canal(ctx) {
      const G = SL.G; const ch = G.ch.vision; const st = ctx.st;
      if (st.vid) { const v = G.videos.find(x => x.id === st.vid); if (v) return this.detail(v); st.vid = null; }
      const vids = G.videos.filter(v => v.plat === 'vision').slice().reverse();
      const rev = vids.reduce((s, v) => s + v.rev, 0);
      const drafts = G.edits.filter(e => ['editando', 'renderizando', 'pronto'].includes(e.status));
      return (drafts.length ? `<div class="card col"><h3>Rascunhos</h3>${drafts.map(e => `<div class="row"><span class="grow small"><b>${esc((SL.Videos.TYPES[e.type] || {}).label || 'Vídeo')}</b> · ${esc((D.gameById(e.game) || {}).name || '')} · ${e.status === 'pronto' ? 'pronto para publicar' : e.status}</span><button class="btn sm primary" data-act="rascunho" data-e="${e.id}">Continuar</button></div>`).join('')}</div>` : '') + `<div class="statrow"><div class="card stat"><b>${U.num(ch.f)}</b><span>Inscritos</span></div><div class="card stat"><b>${U.num(ch.views)}</b><span>Visualizações</span></div><div class="card stat"><b>${U.num(ch.wh)}</b><span>Horas assistidas</span></div><div class="card stat"><b class="ok">${U.money(rev)}</b><span>Receita acumulada</span></div><div class="card stat"><b>${ch.mon ? 'Monetizado' : 'Não monetizado'}</b><span>${ch.mon ? 'A receita cai no dia 21' : 'Precisa 1.000 inscritos e 4.000 horas'}</span></div></div>
        ${!ch.mon ? `<div class="card col"><div class="attr">Inscritos<div class="bar"><i style="width:${Math.min(100, ch.f / 10)}%"></i></div><b>${U.num(ch.f)}</b></div><div class="attr">Horas<div class="bar"><i style="width:${Math.min(100, ch.wh / 40)}%"></i></div><b>${U.num(ch.wh)}</b></div></div>` : ''}
        <div class="card col gap4"><h3>Membros do canal</h3><div class="tiny muted">${ch.mon ? U.int(ch.membros || 0) + ' membros pagando · você fica com 70% (' + U.money(SL.Live.membroPreco('vision') * 0.7) + ' por membro por mês)' : 'Libera quando o canal for monetizado (1.000 inscritos e 4.000 horas). Já dá para escolher o valor.'}</div><div class="row wrap gap4">${SL.Live.MEMBRO_PRECOS.map(v => `<button class="chip ${SL.Live.membroPreco('vision') === v ? 'on' : ''}" data-act="membro" data-p="vision" data-v="${v}">${U.money(v)}/mês</button>`).join('')}</div></div>
        <div class="card"><h3>Visualizações por dia (30 dias)</h3><canvas class="chart" id="vi-ch"></canvas></div>
        <div class="card"><h3>Seus vídeos</h3>${vids.length ? `<div class="tablewrap"><table class="table"><tr><th>Vídeo</th><th>Situação</th><th>Views</th><th>CTR</th><th>Retenção</th><th>Inscritos</th><th>Receita</th></tr>${vids.map(v => `<tr class="click" data-act="vid" data-v="${v.id}"><td><b class="small">${esc(v.title)}</b><div class="tiny muted">${SL.Clock.fmtStamp(v.t)} · qualidade ${v.quality}</div></td><td>${trendTag(v)}</td><td class="n">${U.num(v.views)}</td><td class="n">${U.pct(v.ctr, 1)}</td><td class="n">${U.pct(v.ret)}</td><td class="n">+${U.int(v.newSubs)}</td><td class="n">${U.money(v.rev)}</td></tr>`).join('')}</table></div>` : '<div class="empty">Publique pelo Premiere Pro (no computador).</div>'}</div>
        ${this.recentComments(vids)}`;
    },
    recentComments(vids) {
      const all = vids.flatMap(v => v.comments.map(c => ({ c, v }))).sort((a, b) => b.c.t - a.c.t).slice(0, 8);
      if (!all.length) return '';
      return `<div class="card col"><h3>Comentários recentes</h3>${all.map(({ c, v }) => `<div class="row top"><span class="ava" style="width:28px;height:28px;font-size:12px;background:#475069">${esc(c.u[0].toUpperCase())}</span><div class="grow"><div class="small"><b>@${esc(c.u)}</b> <span class="muted tiny">em "${esc(v.title.slice(0, 40))}"</span></div><div class="small">${esc(c.text)}</div></div></div>`).join('')}</div>`;
    },
    detail(v) {
      const s = v.scores || {};
      return `<div class="row"><button class="btn sm" data-act="back">${ic('left', 14)} Seus vídeos</button><b class="grow">${esc(v.title)}</b>${trendTag(v)}</div>
        <div class="grid2" style="align-items:start"><canvas class="thumb" data-th="${v.id}"></canvas><div class="kv"><span>Publicado</span><span>${SL.Clock.fmtStamp(v.t)}</span><span>Duração</span><span>${Math.floor(v.len / 60)}:${String(v.len % 60).padStart(2, '0')}</span><span>Impressões</span><span>${U.num(v.imp)}</span><span>Visualizações</span><span>${U.num(v.views)}</span><span>Taxa de cliques</span><span>${U.pct(v.ctr, 1)}</span><span>Retenção média</span><span>${U.pct(v.ret)}</span><span>Curtidas / não curtidas</span><span>${U.num(v.likes)} / ${U.num(v.dislikes)}</span><span>Compartilhamentos</span><span>${U.num(v.shares)}</span><span>Novos inscritos</span><span>+${U.int(v.newSubs)}</span><span>Receita</span><span>${U.money(v.rev)}</span><span>Notas</span><span>título ${s.title} · thumb ${s.thumb} · tags ${s.tags}</span></div></div>
        <div class="card"><h3>Visualizações por dia</h3><canvas class="chart" id="vd-ch"></canvas></div>
        <div class="card col"><h3>Comentários (${U.int(v.ccount)})</h3>${v.comments.length ? v.comments.slice().reverse().map(c => `<div class="row top"><span class="ava" style="width:28px;height:28px;font-size:12px;background:#475069">${esc(c.u[0].toUpperCase())}</span><div class="grow"><div class="small"><b>@${esc(c.u)}</b> <span class="tiny muted">${SL.Clock.ago(c.t)} · ${c.likes} curtidas</span>${c.heart ? ' <span class="live-c">' + ic('heart', 12) + '</span>' : ''}</div><div class="small">${esc(c.text)}</div>${c.reply ? `<div class="tiny acc">Você respondeu: ${esc({ obrigado: 'Valeu demais!', piada: 'Kkkkk isso aí', explicar: 'Explico melhor no próximo vídeo!' }[c.reply])}</div>` : `<div class="row gap4">${c.heart ? '' : `<button class="btn sm ghost" data-act="heart" data-v="${v.id}" data-c="${c.id}">${ic('heart', 12)} Curtir</button>`}<button class="btn sm ghost" data-act="reply" data-k="obrigado" data-v="${v.id}" data-c="${c.id}">Agradecer</button><button class="btn sm ghost" data-act="reply" data-k="piada" data-v="${v.id}" data-c="${c.id}">Brincar</button><button class="btn sm ghost" data-act="reply" data-k="explicar" data-v="${v.id}" data-c="${c.id}">Explicar</button></div>`}</div></div>`).join('') : '<div class="small muted">Sem comentários ainda.</div>'}</div>`;
    },
    tendencias() {
      const G = SL.G; const hot = SL.Algo.hotGames();
      return `<div class="grid2" style="align-items:start"><div class="card"><h3>Jogos e categorias</h3><div class="list">${hot.map(x => `<div class="li"><span class="dot" style="background:${x.g.color}"></span><b class="grow small">${esc(x.g.name)}</b><span class="${x.m > 1.08 ? 'ok' : x.m < 0.92 ? 'bad' : 'muted'}">${ic(x.m >= 1 ? 'trend' : 'trendDown', 15)}</span><span class="mono small">${Math.round(x.pop)}</span></div>`).join('')}</div><p class="tiny muted">Popularidade × saturação: jogos gigantes têm muitos streamers disputando o mesmo público.</p></div>
        <div class="card"><h3>Assuntos do momento</h3><div class="list">${G.trends.tags.map(t => `<div class="li"><b class="grow small">${esc(t.tag)}</b><div class="bar" style="width:90px"><i style="width:${Math.min(100, t.heat * 80)}%;background:var(--clipz2)"></i></div></div>`).join('') || '<div class="li muted small">Nada em alta.</div>'}</div></div></div>`;
    },
    act(a, ds, ctx) {
      const st = ctx.st;
      if (a === 'criar') return UI.criarVideo(ds.k);
      if (a === 'rascunho') return UI.criarVideo(null, ds.e);
      if (a === 'membro') { SL.Live.setMembroPreco(ds.p, ds.v); return ctx.render(); }
      if (a === 'tab') { st.tab = ds.t; st.vid = null; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'vid') { st.vid = ds.v; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'back') { st.vid = null; return ctx.render(); }
      if (a === 'heart') { SL.Videos.replyComment(ds.v, ds.c, 'heart'); return ctx.render(); }
      if (a === 'reply') { SL.Videos.replyComment(ds.v, ds.c, ds.k); return ctx.render(); }
      if (a === 'watch') {
        const f = SL.G.feed.find(x => x.id === ds.f); if (!f) return;
        if (f.author === 'me') { st.tab = 'canal'; st.vid = f.ref; return ctx.render(); }
        const busy = SL.G.act && SL.G.act.id !== 'usar_pc'; if (busy) return 'Termine o que está fazendo.';
        SL.Life.mod({ humor: 3, estresse: -2 }); SL.Life.skillUp('marketing', 0.15); SL.Clock.skip(15); f.views = (f.views || 0) + 1;
        if (D.creatorById(f.author)) SL.Rel.touchCreator(f.author, 0.4, 'visualização');
        UI.toast({ title: 'Você assistiu', text: '"' + f.text + '" · aprendeu um pouco sobre o que funciona.', icon: 'eye', cat: 'social' }, null, true);
      }
    },
  };

  // ---------- CLIPZ ----------
  SL.Apps.clipz = {
    title: 'TikTok', short: 'TikTok', icon: 'clip', color: 'linear-gradient(135deg,#1f1f27 45%,#fe2c55)', order: 4, pc: true, phone: true, w: 900, h: 660,
    watch: ['videos', 'tick:hour', 'feed'],
    render(el, ctx) {
      const st = ctx.st; st.tab = st.tab || 'foryou';
      const tabs = [['foryou', 'Para você'], ['trends', 'Desafios e trends'], ['perfil', 'Seu perfil']];
      el.innerHTML = `<div class="app"><div class="app-head"><div class="brandbar"><span class="bl" style="background:#111">${ic('clip', 15)}</span>TikTok</div><div class="criar-bar"><button class="btn pink sm" data-act="criar" data-k="corte">${ic('scissors', 15)} Gravar corte</button></div><div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`).join('')}</div></div><div class="app-body">${this[st.tab](ctx)}</div></div>`;
      $$('canvas[data-short]', el).forEach(cv => this.paintShort(cv));
    },
    paintShort(cv) {
      const id = cv.dataset.short; const G = SL.G; const v = G.videos.find(x => x.id === id); const f = v ? null : G.feed.find(x => x.id === id);
      const game = v ? v.game : (f && f.game) || 'conversa'; const r = U.mulberry(U.hash(id));
      const dpr = Math.min(2, devicePixelRatio || 1); const w = cv.clientWidth || 130, h = cv.clientHeight || 230; cv.width = w * dpr; cv.height = h * dpr;
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = D.gameById(game) || D.games[0]; const sim = SL.GameSim.make(g.id); for (let i = 0; i < 2 + Math.floor(r() * 4); i++) SL.GameSim.sims[g.sim].step(sim, { skill: 0.5, perf: 1, char: 50 }, []);
      c.save(); c.translate(-w * 0.45, 0); SL.Preview.GAMES[g.tela || g.sim](c, w * 1.9, h, sim, r() * 20, {}); c.restore();
      const look = v ? G.player.look : (SL.Social.author(f.author).look || SL.Avatar.randomLook(r));
      SL.Avatar.portrait(c, look, w / 2, h * 0.86, w * 0.7, { expr: U.pick(['rindo', 'surpreso', 'feliz']) });
    },
    foryou() {
      const G = SL.G; const items = G.feed.filter(f => f.plat === 'clipz').slice().reverse().slice(0, 18);
      const mine = G.videos.filter(v => v.plat === 'clipz' && v.status === 'publicado').slice(-4).reverse();
      return `<div class="sgrid">${mine.map(v => `<div class="short"><canvas data-short="${v.id}"></canvas><div class="sinfo"><b>${esc(v.title)}</b>Você · ${U.num(v.views)} views</div></div>`).join('')}${items.map(f => `<div class="short" data-act="see" data-f="${f.id}"><canvas data-short="${f.id}"></canvas><div class="sinfo"><b>${esc(f.text)}</b>@${esc(author(f.author).handle)} · ${U.num(f.views || 0)} views</div></div>`).join('')}</div>${!items.length && !mine.length ? '<div class="empty">Ainda não há shorts no feed.</div>' : ''}`;
    },
    trends() {
      const G = SL.G;
      return `<div class="col">${G.trends.tags.map(t => `<div class="card row"><span class="acc">${ic('fire', 20)}</span><div class="grow"><b>${esc(t.tag)}</b><div class="tiny muted">Em alta desde ${SL.Clock.fmtDay(t.since)} · calor ${Math.round(t.heat * 100)}</div><div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, t.heat * 80)}%;background:var(--clipz2)"></i></div></div><button class="btn sm" data-act="trend" data-v="${esc(t.tag.slice(1))}">${ic('plus', 14)} Fazer um short</button></div>`).join('') || '<div class="empty">Nenhuma trend agora.</div>'}<p class="small muted">Shorts com a tag da trend ganham um empurrão enquanto ela estiver quente. Use no Premiere Pro, passo "Tags".</p></div>`;
    },
    perfil() {
      const G = SL.G; const ch = G.ch.clipz; const vids = G.videos.filter(v => v.plat === 'clipz').slice().reverse();
      return `<div class="statrow"><div class="card stat"><b>${U.num(ch.f)}</b><span>Seguidores no TikTok</span></div><div class="card stat"><b>${U.num(ch.views)}</b><span>Visualizações</span></div><div class="card stat"><b>${ch.mon ? 'Ativo' : 'Inativo'}</b><span>Fundo de criadores (10 mil seguidores e 100 mil views)</span></div></div>
        <div class="card">${vids.length ? `<div class="tablewrap"><table class="table"><tr><th>Short</th><th>Situação</th><th>Views</th><th>Curtidas</th><th>Compart.</th><th>Seguidores</th></tr>${vids.map(v => `<tr><td class="small">${esc(v.title)}</td><td>${trendTag(v)}</td><td class="n">${U.num(v.views)}</td><td class="n">${U.num(v.likes)}</td><td class="n">${U.num(v.shares)}</td><td class="n">+${U.int(v.newSubs)}</td></tr>`).join('')}</table></div>` : '<div class="empty">Nenhum short ainda. Cortes de live viram ótimos shorts.</div>'}</div>`;
    },
    act(a, ds, ctx) {
      if (a === 'criar') return UI.criarVideo(ds.k);
      if (a === 'tab') { ctx.st.tab = ds.t; return ctx.render(); }
      if (a === 'trend') return UI.criarVideo('corte');
      if (a === 'see') { const f = SL.G.feed.find(x => x.id === ds.f); if (f) { f.views = (f.views || 0) + 1; SL.Life.mod({ humor: 1 }); SL.Clock.skip(3); if (D.creatorById(f.author)) SL.Rel.touchCreator(f.author, 0.2, 'visualização'); UI.toast({ title: '@' + author(f.author).handle, text: f.text, icon: 'clip', cat: 'social' }, null, true); } }
    },
  };

  // ---------- CONNECT ----------
  SL.Apps.connect = {
    title: 'Instagram', short: 'Instagram', icon: 'connect', color: 'linear-gradient(135deg,#f9a03f,#d62976 55%,#7b3fe4)', order: 5, pc: true, phone: true, w: 760, h: 680,
    watch: ['feed', 'posts', 'tick:hour'],
    render(el, ctx) {
      const st = ctx.st; if (ctx.args && ctx.args.compose && !st.used) { st.used = 1; st.tab = 'publicar'; st.kind = 'foto'; st.photo = ctx.args.photo; }
      st.tab = st.tab || 'feed';
      const tabs = [['feed', 'Feed'], ['publicar', 'Publicar'], ['perfil', 'Seu perfil']];
      el.innerHTML = `<div class="app"><div class="app-head"><div class="brandbar"><span class="bl" style="background:#3b82f6">${ic('connect', 15)}</span>Instagram</div><div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`).join('')}</div></div><div class="app-body">${this[st.tab](ctx)}</div></div>`;
      paintAvatars(el);
      $$('canvas[data-photo]', el).forEach(cv => { const p = SL.G.posts.find(x => x.id === cv.dataset.photo) || (ctx.st.preview && ctx.st.preview.id === cv.dataset.photo ? ctx.st.preview : null); if (p && p.photo) SL.Preview.photo(cv, p.photo); });
      $$('canvas[data-th]', el).forEach(cv => { const v = SL.G.videos.find(x => x.id === cv.dataset.th); if (v) SL.Preview.thumbTo(cv, { game: v.game, th: v.thumb, title: v.title, seed: v.id }); });
    },
    postHTML(f) {
      const a = author(f.author); const p = f.author === 'me' ? SL.G.posts.find(x => x.id === f.ref) : null; const G = SL.G;
      const vid = f.plat === 'vision' && f.author === 'me' ? G.videos.find(v => v.id === f.ref) : null;
      const poll = f.poll || (p && p.poll);
      const comments = (p ? p.comments : f.comments || []).slice(-3);
      return `<div class="post ${f.author === 'me' ? 'me' : ''} ${f.aboutMe ? 'about' : ''}"><div class="ph">${avatarCanvas(f.author)}<div class="grow"><b>${esc(a.name)}</b> ${a.creator ? '<span class="tag">criador(a)</span>' : a.news ? '<span class="tag info">notícias</span>' : ''}<div><small>@${esc(a.handle)} · ${SL.Clock.ago(f.t)}${f.plat !== 'connect' ? ' · ' + ({ pulso: 'ao vivo na Twitch', vision: 'vídeo no YouTube', clipz: 'short no TikTok' })[f.plat] : ''}</small></div></div></div>
        <div class="txt">${f.plat === 'pulso' ? ic('live', 14) + ' ' : ''}${esc(f.text)}</div>
        ${f.photo ? `<canvas class="photo" data-photo="${f.ref}"></canvas>` : ''}${vid ? `<canvas class="thumb" data-th="${vid.id}"></canvas>` : ''}
        ${poll ? (() => { const tot = poll.votes.reduce((x, y) => x + y, 0) || 1; return `<div class="col gap4"><b class="small">${esc(poll.q)}</b>${poll.opts.map((o, i) => `<div class="pollbar"><i style="width:${poll.votes[i] / tot * 100}%"></i><span>${esc(o)} · ${Math.round(poll.votes[i] / tot * 100)}%</span></div>`).join('')}<span class="tiny muted">${U.int(tot)} votos</span></div>`; })() : ''}
        <div class="acts"><button class="btn ghost ${f.liked ? 'on' : ''}" data-act="like" data-f="${f.id}">${ic('heart', 13)} ${U.num(p ? p.likes : f.likes || 0)}</button><button class="btn ghost" data-act="cmt" data-f="${f.id}">${ic('comment', 13)} ${U.num(p ? p.ccount : f.ccount || 0)}</button>${f.author !== 'me' ? `<button class="btn ghost ${f.shared ? 'on' : ''}" data-act="share" data-f="${f.id}">${ic('share', 13)} Compartilhar</button>` : `<span class="tiny muted">alcance ${U.num(p ? p.reach : 0)} · +${p ? p.newF : 0} seguidores</span>`}</div>
        ${comments.length ? `<div class="cmts">${comments.map(c => `<div><b>@${esc(c.u)}</b> ${esc(c.text)}</div>`).join('')}</div>` : ''}</div>`;
    },
    feed() {
      const G = SL.G; const items = G.feed.filter(f => f.plat === 'connect' || f.plat === 'pulso' || (f.plat === 'vision' && f.author === 'me')).slice().reverse().slice(0, 40);
      return `<div class="feed">${items.map(f => this.postHTML(f)).join('') || '<div class="empty">Seu feed vai encher conforme o mundo acontece.</div>'}</div>`;
    },
    publicar(ctx) {
      const G = SL.G; const st = ctx.st; st.kind = st.kind || 'texto';
      const kinds = [['texto', 'Texto', 'chat'], ['foto', 'Foto', 'image'], ['enquete', 'Enquete', 'poll']];
      let body = '';
      if (st.kind === 'texto') body = `<div class="upper">Sobre o quê?</div><div class="col gap4">${D.T.playerPostTopics.map(t => `<button class="choice ${st.topic === t.id ? 'on' : ''}" data-act="topic" data-v="${t.id}" style="${st.topic === t.id ? 'border-color:var(--accent)' : ''}"><b>${esc(t.label)}</b><small>${esc(t.text.replace('{g}', (D.gameById(SL.Creators.playerMainGame() || 'zonafinal') || {}).name))}${t.polemic ? ' · pode dar polêmica' : ''}</small></button>`).join('')}</div><div class="field"><label>Ou escreva do seu jeito</label><textarea class="textarea" data-f="ptext" maxlength="280" placeholder="O que está acontecendo?">${esc(st.text || '')}</textarea></div>`;
      if (st.kind === 'foto') {
        const opts = D.T.photoKinds.filter(k => k.where === 'any' || (k.where === 'casa' ? G.loc.area === 'casa' : G.loc.area === 'local'));
        if (!opts.find(o => o.id === st.photo)) st.photo = opts[0] && opts[0].id;
        st.preview = { id: 'preview', photo: { kind: st.photo, place: G.loc.place, setup: { dual: !!(SL.Equip.item('monitor') || {}).dual, mic: !!SL.Equip.item('microfone'), light: !!SL.Equip.item('iluminacao') } } };
        body = `<div class="row wrap">${opts.map(o => `<button class="chip ${st.photo === o.id ? 'on' : ''}" data-act="photo" data-v="${o.id}">${esc(o.label)}</button>`).join('')}</div><span class="tiny muted">${G.loc.area === 'casa' ? 'Na rua você pode fotografar o lugar onde está.' : 'Em casa dá para mostrar o setup.'}</span><canvas class="photo" data-photo="preview" style="max-width:420px;border-radius:12px;width:100%;aspect-ratio:16/10"></canvas><div class="field"><label>Legenda</label><input class="input" data-f="ptext" maxlength="160" value="${esc(st.text || '')}" placeholder="Legenda da foto"></div>`;
      }
      if (st.kind === 'enquete') body = `<div class="field"><label>Pergunta</label><input class="input" data-f="pq" maxlength="80" value="${esc(st.pq || 'Qual jogo vocês querem na próxima live?')}"></div><div class="grid3">${[0, 1, 2].map(i => `<input class="input" data-f="po${i}" maxlength="30" value="${esc((st.po || [])[i] || ['Fortnite', 'Resident Evil', 'FIFA 27'][i])}">`).join('')}</div>`;
      if (st.kind === 'anuncio') body = `<p class="small muted">O anúncio vira compromisso: quem vir vai esperar a live nesse horário.</p><div class="row wrap">${[[0, 20], [0, 22], [1, 19], [1, 20], [1, 21], [2, 20]].filter(([d, h]) => d > 0 || h > SL.Clock.hour()).map(([d, h]) => `<button class="chip ${st.ann === d + ',' + h ? 'on' : ''}" data-act="ann" data-v="${d},${h}">${d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : SL.Clock.fmtDay(SL.Clock.day() + d)} ${h}h</button>`).join('')}</div>`;
      return `<div class="feed"><div class="card col"><div class="row wrap">${kinds.map(([k, l, i]) => `<button class="chip ${st.kind === k ? 'on' : ''}" data-act="kind" data-v="${k}">${ic(i, 13)} ${l}</button>`).join('')}</div>${body}<div class="row end"><span class="tiny muted grow">${U.num(G.ch.connect.f)} seguidores no Instagram</span><button class="btn primary" data-act="post">${ic('send', 14)} Publicar</button></div></div></div>`;
    },
    perfil() {
      const G = SL.G; const posts = G.posts.slice().reverse();
      return `<div class="feed"><div class="card row"><canvas data-av="me" style="width:64px;height:64px;border-radius:50%"></canvas><div class="grow"><b>${esc(G.player.name)}</b><div class="small muted">@${esc(G.player.user)} · ${esc(SL.Career.tierName())}</div><div class="small"><b>${U.num(G.ch.connect.f)}</b> seguidores · <b>${posts.length}</b> publicações</div></div></div>
        ${posts.map(p => { const f = G.feed.find(x => x.ref === p.id) || { id: 'x', author: 'me', t: p.t, plat: 'connect', text: p.text, ref: p.id, photo: p.photo, poll: p.poll }; return this.postHTML(f); }).join('') || '<div class="empty">Você ainda não publicou nada.</div>'}</div>`;
    },
    act(a, ds, ctx, ev) {
      const st = ctx.st; const G = SL.G;
      if (a === 'tab') { st.tab = ds.t; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'kind') { st.kind = ds.v; return ctx.render(); }
      if (a === 'topic') { st.topic = ds.v; const t = D.T.playerPostTopics.find(x => x.id === ds.v); st.text = t.text.replace('{g}', (D.gameById(SL.Creators.playerMainGame() || 'zonafinal') || {}).name); return ctx.render(); }
      if (a === 'photo') { st.photo = ds.v; return ctx.render(); }
      if (a === 'ann') { st.ann = ds.v; return ctx.render(); }
      if (a === 'like') { SL.Social.like(ds.f); return ctx.render(); }
      if (a === 'share') { SL.Social.share(ds.f); return ctx.render(); }
      if (a === 'cmt') {
        const f = G.feed.find(x => x.id === ds.f); if (!f) return; if (f.author === 'me') return;
        const m = UI.modal({ title: 'Comentar', icon: 'comment', html: '<div class="col">' + [['elogio', 'Elogiar'], ['piada', 'Fazer uma piada'], ['critica', 'Criticar (pode azedar a relação)']].map(([k, l]) => `<button class="choice" data-t="${k}"><b>${l}</b></button>`).join('') + '</div>' });
        $$('[data-t]', m.el).forEach(b => b.onclick = () => { SL.Social.comment(ds.f, b.dataset.t); m.close(); ctx.render(); });
        return;
      }
      if (a === 'post') {
        let o;
        if (st.kind === 'texto') { const t = D.T.playerPostTopics.find(x => x.id === st.topic); const text = (st.text || '').trim(); if (!text) return 'Escolha um assunto ou escreva algo.'; o = { kind: t && t.polemic ? 'polemica' : 'texto', text, eng: t ? t.eng : 1.1, risk: t ? t.risk || 0 : (/(lixo|odeio|horrível|fraco)/i.test(text) ? 0.3 : 0.02), polemic: t ? !!t.polemic : /(lixo|odeio|horrível|fraco)/i.test(text), topic: st.topic }; }
        if (st.kind === 'foto') o = { kind: 'foto', text: (st.text || '').trim(), photo: st.preview.photo, eng: 1.15 };
        if (st.kind === 'enquete') { const opts = [0, 1, 2].map(i => ($('[data-f="po' + i + '"]', ctx.host) || {}).value).filter(Boolean); o = { kind: 'enquete', text: '', poll: { q: ($('[data-f="pq"]', ctx.host) || {}).value || 'Enquete', opts }, eng: 1.3 }; }
        if (st.kind === 'anuncio') { if (!st.ann) return 'Escolha o dia e a hora da live.'; const [d, h] = st.ann.split(',').map(Number); SL.Social.scheduleLivePost(d, h); st.ann = null; st.tab = 'perfil'; UI.toast({ title: 'Live anunciada', text: 'Seus seguidores foram avisados.', icon: 'megaphone', cat: 'social' }, 'success'); return ctx.render(); }
        const err = SL.Social.post(o); if (err) return err;
        st.text = ''; st.topic = null; st.tab = 'perfil'; SL.Goals.check(); UI.toast({ title: 'Publicado no Instagram', icon: 'check', cat: 'social' }, 'success', true);
        return ctx.render();
      }
      void ev;
    },
    input(t, ctx) { if (t.dataset.f === 'ptext') ctx.st.text = t.value; if (t.dataset.f === 'pq') ctx.st.pq = t.value; if (/^po\d$/.test(t.dataset.f || '')) { ctx.st.po = ctx.st.po || []; ctx.st.po[+t.dataset.f[2]] = t.value; } },
  };
})(window.SL);

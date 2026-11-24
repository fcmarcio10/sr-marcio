/* Criar vídeo dentro dos apps (no jeito dos simuladores de streamer). YouTube grava vídeo normal ou Reels,
   TikTok faz cortes. Fluxo: escolher o que gravar → gravando → gravação pronta com o botão "Editar"
   (Rápida, Normal ou Caprichada) → caixa "Editando" até terminar → configurar título, thumbnail (só vídeo
   do YouTube), descrição e até 3 hashtags entre 5 do próprio vídeo → publicar e ver a nota de cada escolha. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI; const ic = UI.ic, esc = U.esc;
  const VS = () => SL.Videos;

  const KINDS = {
    video: { type: 'tradicional', app: 'vision', plat: 'YouTube', nome: 'Vídeo para o YouTube', rec: 30, thumb: true, icon: 'vision', extra: 'gameplay' },
    reels: { type: 'reels', app: 'vision', plat: 'YouTube', nome: 'Reels para o YouTube', rec: 10, thumb: false, icon: 'clip', extra: 'reels' },
    corte: { type: 'short', app: 'clipz', plat: 'TikTok', nome: 'Corte para o TikTok', rec: 10, thumb: false, icon: 'scissors', extra: 'corte' },
  };
  const kindOfType = t => t === 'reels' ? 'reels' : t === 'short' ? 'corte' : 'video';
  const MAX_TAGS = 3;

  // ---------- 3 opções sorteadas (uma forte, uma média e uma fraca, em ordem aleatória) ----------
  const TITULOS = {
    forte: ['NÃO ACREDITO nesse final no {g}!', 'Primeira vez no {g} e olha o que aconteceu', 'Joguei {g} até vencer: o desafio mais difícil', 'O momento mais insano que já vivi no {g}', '{m} (você não vai acreditar)', 'Tentei o impossível no {g} hoje'],
    media: ['{g}: {m}', 'Jogando {g} com o chat', 'Mais uma partida de {g}', 'Tentando melhorar no {g}', 'Gameplay de {g} sem cortes'],
    fraca: ['vídeo novo', '{g} parte 2', 'gameplay', 'jogando de boa'],
  };
  const TITULOS_CURTOS = {
    forte: ['Ninguém esperava esse final no {g}!', 'Olha o que aconteceu no {g}', 'Esse lance no {g} foi INSANO', '{m}!'],
    media: ['Momento do {g}', 'Corte da live de {g}', '{g} hoje'],
    fraca: ['corte', 'kkkkk', 'clip'],
  };
  const TITULOS_CONVERSA = {
    forte: ['Precisei falar sobre isso: minha opinião sincera', 'O que ninguém te conta sobre criar conteúdo', 'Respondendo as 10 perguntas mais polêmicas'],
    media: ['Conversando com vocês', 'Minha opinião sobre a semana', 'Papo rápido com o chat'],
    fraca: ['vídeo novo', 'falando um pouco', 'vlog'],
  };
  const DESCRICOES = {
    forte: ['Nesse vídeo {resumo}. Live todo dia às 20h na Twitch! Me segue no Instagram e no TikTok: @{u}. Deixa o like e se inscreve no canal!', 'Hoje {resumo}. Se curtiu, se inscreve e ativa o sininho. Lives de segunda a sábado às 20h. Instagram e TikTok: @{u}'],
    media: ['Gameplay de {g}. Se gostou, deixa o like!', 'Hoje {resumo}. Valeu por assistir!', 'Mais um vídeo de {g} para vocês. Comenta aí o que achou.'],
    fraca: ['...', 'vídeo', 'link na bio'],
  };
  const THUMBS = [
    { forte: true, expr: 'surpreso', text: 'NÃO ACREDITO', color: '#ffe066', arrow: true, circle: true },
    { forte: true, expr: 'rindo', text: 'QUE ISSO?!', color: '#ff3b3b', arrow: true, circle: false },
    { expr: 'feliz', text: '{G}', color: '#ffffff', arrow: false, circle: false },
    { expr: 'neutro', text: '', color: '#9aa4b2', arrow: false, circle: false },
    { expr: 'bravo', text: 'DESISTO DESSE JOGO DE VEZ', color: '#9aa4b2', arrow: false, circle: true },
  ];
  const fill = (s, c) => s.replace('{g}', c.g).replace('{G}', c.g.toUpperCase().split(' ')[0]).replace('{m}', c.m).replace('{resumo}', c.resumo).replace('{u}', c.u);
  const tres = pools => U.shuffle(['forte', 'media', 'fraca'].map(k => U.pick(pools[k])));
  // 5 hashtags que combinam com o vídeo (do jogo e do formato)
  const tagsDoVideo = (game, K) => {
    const g = D.gameById(game) || D.gameById('conversa');
    const base = g.nongame || g.id === 'conversa' ? ['opiniao', 'papo', 'criador de conteudo', 'dicas', 'vlog'] : g.tags.concat([g.name.toLowerCase()]);
    return [...new Set(base.concat([K.extra, 'brasil']))].slice(0, 5);
  };
  const hash = t => '#' + t.replace(/\s+/g, '');

  // ---------- o assistente ----------
  UI.criarVideo = (kind, resumeEdit, op) => {
    const G = SL.G;
    if (!UI.pcOpen()) return UI.err('Para gravar e editar, use o computador de casa (YouTube ou TikTok no PC).');
    let K = KINDS[kind] || KINDS.video;
    const st = { step: 'conteudo', game: null, raw: null, edit: null, opts: null, pick: { tags: [] }, video: null, err: '', niveis: false };
    if (resumeEdit) {
      const e = G.edits.find(x => x.id === resumeEdit);
      if (e) { K = KINDS[kindOfType(e.type)]; st.edit = e.id; st.raw = e.raw; st.game = e.game; st.step = e.status === 'pronto' ? 'configurar' : 'editando'; }
    }
    // veio do resumo da live: já começa com aquela gravação
    if (!resumeEdit && op && op.raw) { const r0 = G.raw.find(x => x.id === op.raw); if (r0) { st.raw = r0.id; st.game = r0.game; st.step = 'gravado'; } }
    const steps = [['conteudo', 'Conteúdo'], ['gravando', 'Gravação'], ['editando', 'Edição'], ['configurar', 'Configurar'], ['resultado', 'Publicado']];
    const ordem = { conteudo: 0, gravando: 1, gravado: 1, editando: 2, configurar: 3, resultado: 4 };
    let timer = null;
    const m = UI.modal({ title: K.nome, icon: K.icon, cls: 'game criar', wide: true, html: '', onClose: () => { clearInterval(timer); document.body.classList.remove('criar-open'); } });
    document.body.classList.add('criar-open');
    const edit = () => G.edits.find(x => x.id === st.edit);
    const raw = () => G.raw.find(r => r.id === st.raw);
    const ctxText = () => {
      const e = edit(); const g = D.gameById(st.game || (e && e.game)) || D.gameById('conversa'); const mo = e && e.moments[0];
      return { g: g.name, m: mo ? mo.txt : 'Esse momento foi demais', resumo: mo ? 'rolou isso: ' + mo.txt.toLowerCase() : 'eu joguei ' + g.name + ' com vocês', u: G.player.user, conversa: !!(g.nongame || g.id === 'conversa') };
    };
    const opcoes = () => {
      const c = ctxText();
      const pools = c.conversa ? TITULOS_CONVERSA : K.type === 'tradicional' ? TITULOS : TITULOS_CURTOS;
      st.opts = { titulo: tres(pools).map(s => fill(s, c)), descricao: tres(DESCRICOES).map(s => fill(s, c)), tags: tagsDoVideo(st.game || edit().game, K) };
      const ths = U.shuffle(THUMBS.slice()); const forte = ths.find(t => t.forte), outras = ths.filter(t => !t.forte).slice(0, 2);
      st.opts.thumb = U.shuffle([forte].concat(outras)).map(t => ({ scene: 0, expr: t.expr, text: fill(t.text, c), color: t.color, arrow: t.arrow, circle: t.circle }));
    };
    const espera = fim => { clearInterval(timer); timer = setInterval(() => { if (m.closed) return clearInterval(timer); const r = fim(); if (r) { clearInterval(timer); r(); } else render(); }, 250); };
    const carregando = (txt, icon, p, sub) => `<div class="cv-wait"><div class="cv-spin">${ic(icon, 28)}</div><b>${txt}</b><div class="cv-bar"><i style="width:${Math.round(p * 100)}%"></i></div><small>${sub}</small></div>`;
    const render = () => {
      const e = edit(); const io = ordem[st.step];
      let h = `<div class="cv-steps">${steps.map(([k, n], i) => `<span class="${i < io ? 'ok' : i === io ? 'on' : ''}"><b>${i + 1}</b>${n}</span>`).join('')}</div>`;
      if (st.err) h += `<div class="cv-err">${ic('alert', 16)}${esc(st.err)}</div>`;
      if (st.step === 'conteudo') {
        const lives = K.type === 'short' ? G.raw.filter(r => r.kind === 'live' && r.moments && r.moments.length).slice(-3).reverse() : [];
        const jogos = D.games.filter(x => !x.nongame && SL.Equip.canStream(x, '480p').ok);
        h += `<p class="cv-p">${K.type === 'short' ? 'Corte um momento de uma live ou grave uma partida curta.' : 'Escolha o jogo. A gravação leva ' + U.dur(K.rec) + ' do jogo.'}</p>`;
        if (lives.length) h += `<div class="cv-sub">Gravações das suas lives</div><div class="cv-grid">${lives.map(r => `<button class="cv-card" data-raw="${r.id}"><span class="cv-ic" style="background:#9146ff">${ic('live', 18)}</span><b>Live de ${esc((D.gameById(r.game) || {}).name || 'conversa')}</b><small>${SL.Clock.fmtDay(SL.Clock.day(r.t))} · ${r.moments.length} momentos</small></button>`).join('')}</div><div class="cv-sub">Ou gravar agora</div>`;
        h += `<div class="cv-grid">${jogos.map(x => `<button class="cv-card" data-game="${x.id}"><span class="cv-ic" style="background:${x.color}">${ic('gamepad', 18)}</span><b>${esc(x.name)}</b><small>${esc(x.cat)}</small></button>`).join('')}</div>`;
      } else if (st.step === 'gravando') {
        const a = G.act; const mom = a && a.data && a.data.moments ? a.data.moments.length : 0;
        h += carregando('Gravando...', 'video', a ? SL.Life.progress() : 1, mom + ' momentos bons até agora');
      } else if (st.step === 'gravado') {
        const r = raw();
        h += `<div class="cv-ready"><span class="cv-ic big" style="background:#16a34a">${ic('check', 26)}</span><div class="grow"><b>Gravação pronta</b><small>${r ? U.dur(r.minutes) + ' de material · ' + r.moments.length + ' momentos bons' : ''}</small></div>${st.niveis ? '' : `<button class="btn red lg" data-editar>${ic('scissors', 17)} Editar</button>`}</div>`;
        if (st.niveis) {
          const lv = [['rapida', 'Rápida', 'Sai logo, mas fica simples.', '#2563eb'], ['padrao', 'Normal', 'Cortes, zoom e música.', '#16a34a'], ['caprichada', 'Caprichada', 'Efeitos e legendas. Demora mais.', '#9333ea']];
          h += `<p class="cv-p">Como você quer editar?</p><div class="cv-grid three">${lv.map(([k, n, d, c]) => `<button class="cv-card big" data-level="${k}"><span class="cv-ic" style="background:${c}">${ic('scissors', 18)}</span><b>${n}</b><small>${d}</small><em>${U.dur(VS().workNeeded(K.type, k))} de edição</em></button>`).join('')}</div>`;
        }
      } else if (st.step === 'editando') {
        const a = G.act; const p = !e ? 0 : e.status === 'editando' ? (e.done / Math.max(1, e.work)) * 0.85 : e.status === 'renderizando' ? 0.85 + (a && a.id === 'renderizar' ? SL.Life.progress() * 0.15 : 0) : 1;
        const falta = !e ? 0 : e.status === 'editando' ? e.work - e.done + e.render : e.status === 'renderizando' ? e.render : 0;
        h += carregando('Editando...', 'scissors', p, falta > 0 ? 'Faltam ' + U.dur(falta) + ' do jogo' : 'Finalizando...');
      } else if (st.step === 'configurar') {
        const sec = (t, inner) => `<div class="cv-sec"><div class="cv-sub">${t}</div>${inner}</div>`;
        const op = (k, i, inner) => `<button class="cv-opt ${st.pick[k] === i ? 'on' : ''}" data-pick="${k}" data-i="${i}">${inner}</button>`;
        h += sec('Título', `<div class="cv-list">${st.opts.titulo.map((t, i) => op('titulo', i, `<span>${esc(t)}</span>`)).join('')}</div>`);
        if (K.thumb) h += sec('Thumbnail', `<div class="cv-grid three">${st.opts.thumb.map((t, i) => op('thumb', i, `<canvas class="cv-th" data-th="${i}"></canvas>`)).join('')}</div>`);
        h += sec('Descrição', `<div class="cv-list">${st.opts.descricao.map((t, i) => op('descricao', i, `<span>${esc(t)}</span>`)).join('')}</div>`);
        h += sec(`Hashtags <small class="muted">(${st.pick.tags.length}/${MAX_TAGS})</small>`, `<div class="cv-tags">${st.opts.tags.map(t => { const on = st.pick.tags.includes(t); return `<button class="cv-tag ${on ? 'on' : ''}" data-tag="${esc(t)}" ${!on && st.pick.tags.length >= MAX_TAGS ? 'disabled' : ''}>${esc(hash(t))}</button>`; }).join('')}</div>`);
        // contrato com vídeo de publicidade pendente: dá para cumprir aqui mesmo
        const publis = SL.Sponsors.active().filter(c => c.deliv.some(d => d.k === 'video' && d.done < d.n));
        if (publis.length) h += sec('Publicidade', `<div class="cv-tags">${op('publi', -1, '<span>Sem publi</span>').replace('cv-opt', 'cv-opt cv-mini')}${publis.map(c => op('publi', SL.G.contracts.indexOf(c), `<span>Publi da ${esc(D.brandById(c.brand).name)}</span>`).replace('cv-opt', 'cv-opt cv-mini')).join('')}</div>`);
        const okPub = st.pick.titulo != null && st.pick.descricao != null && (!K.thumb || st.pick.thumb != null);
        h += `<div class="cv-foot"><span class="tiny muted">${okPub ? '' : 'Escolha título' + (K.thumb ? ', thumbnail' : '') + ' e descrição'}</span><button class="btn green" data-publicar ${okPub ? '' : 'disabled'}>${ic('upload', 16)} Publicar no ${K.plat}</button></div>`;
      } else if (st.step === 'resultado') {
        const v = G.videos.find(x => x.id === st.video); const s = v.scores || {}; const ed = e && e.qN ? Math.round(e.qAcc / e.qN) : Math.round(VS().editQualityNow(e));
        const rows = [['Gravação', Math.round(e.rawQ)], ['Edição', ed], ['Título', s.title]].concat(K.thumb ? [['Thumbnail', s.thumb]] : []).concat([['Descrição', s.desc], ['Hashtags', s.tags]]);
        const nota = Math.round(rows.reduce((a, r) => a + r[1], 0) / rows.length); const est = Math.max(1, Math.min(5, Math.round(nota / 20)));
        const cor = n => n >= 70 ? 'var(--ok)' : n >= 45 ? 'var(--warn)' : 'var(--bad)';
        h += `<div class="cv-res"><div class="cv-nota"><b>${nota}</b><span>nota do vídeo</span><div class="stars">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= est ? 'on' : ''}">${ic('star', 18)}</i>`).join('')}</div></div>
          <div class="cv-rows">${rows.map(([n, val]) => `<div class="cv-row"><span>${n}</span><div class="cv-bar"><i style="width:${val}%;background:${cor(val)}"></i></div><b style="color:${cor(val)}">${val}</b></div>`).join('')}</div></div>
          <p class="cv-p tiny muted">Publicado: "${esc(v.title)}" ${v.tags.map(hash).join(' ')}. As visualizações chegam nas próximas horas e trazem gente para a sua próxima live.${st.publi ? ' Publicidade da ' + esc(st.publi) + ' entregue.' : ''}</p>
          <div class="cv-foot"><button class="btn" data-ver>${ic('eye', 15)} Ver no ${K.plat}</button><button class="btn" data-divulgar ${st.divulgado ? 'disabled' : ''}>${ic('connect', 15)} ${st.divulgado ? 'Divulgado' : 'Divulgar no Instagram'}</button><button class="btn primary" data-fim>Pronto</button></div>`;
      }
      m.body.innerHTML = h;
      m.body.querySelectorAll('canvas[data-th]').forEach(cv => SL.Preview.thumbTo(cv, { game: st.game || (edit() || {}).game, th: st.opts.thumb[+cv.dataset.th], title: st.opts.titulo[st.pick.titulo || 0], seed: st.edit + cv.dataset.th }));
    };
    const editar = () => {
      st.step = 'editando'; render();
      espera(() => {
        const e = edit(); if (!e) return () => { st.err = 'O projeto sumiu.'; st.step = 'conteudo'; render(); };
        const a = G.act;
        if (e.status === 'editando' && !(a && a.id === 'editar')) { const err = VS().startEditing(e.id, e.work - e.done); if (err) return () => { st.err = err; render(); }; return null; }
        if (e.status === 'renderizando' && !(a && a.id === 'renderizar')) { SL.Life.start('renderizar', { dur: e.render + 1 }); return null; }
        if (e.status === 'pronto') return () => { if (G.act && G.act.id === 'renderizar') SL.Life.stop(true); opcoes(); st.step = 'configurar'; render(); };
        return null;
      });
    };
    m.body.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b || b.disabled) return; SL.audio.play('click'); st.err = '';
      if (b.dataset.raw) { st.raw = b.dataset.raw; st.game = (raw() || {}).game; st.step = 'gravado'; return render(); }
      if (b.dataset.game) {
        const op = b.dataset.game === 'opiniao'; st.game = op ? 'conversa' : b.dataset.game;
        const antes = G.raw.length ? G.raw[G.raw.length - 1].id : null;
        const err = VS().startRecording({ kind: op ? 'opiniao' : 'gameplay', game: st.game, minutes: K.rec }); if (err) { st.err = err; return render(); }
        st.step = 'gravando'; render();
        espera(() => {
          if (G.act && G.act.id === 'gravar') return null;
          const r = G.raw[G.raw.length - 1];
          if (!r || r.id === antes) return () => { st.err = 'A gravação foi interrompida antes de gerar material.'; st.step = 'conteudo'; render(); };
          return () => { st.raw = r.id; st.step = 'gravado'; render(); };
        });
        return;
      }
      if (b.hasAttribute('data-editar')) { st.niveis = true; return render(); }
      if (b.dataset.level) {
        const r = raw(); if (!r) { st.err = 'Gravação não encontrada.'; st.step = 'conteudo'; return render(); }
        const T = VS().TYPES[K.type]; const need = T.short ? 1 : Math.max(2, Math.round((T.len[0] + T.len[1]) / 2 / 180));
        const idx = r.moments.map((mo, i) => [mo.clip, i]).sort((x, y) => y[0] - x[0]).slice(0, Math.max(1, Math.min(need, r.moments.length))).map(x => x[1]);
        const e = VS().createEdit({ raw: r.id, type: K.type, moments: idx.length ? idx : [0], level: b.dataset.level });
        if (typeof e === 'string') { st.err = e; return render(); }
        st.edit = e.id; return editar();
      }
      if (b.dataset.pick) { st.pick[b.dataset.pick] = +b.dataset.i; return render(); }
      if (b.dataset.tag != null) { const t = b.dataset.tag; const i = st.pick.tags.indexOf(t); if (i >= 0) st.pick.tags.splice(i, 1); else if (st.pick.tags.length < MAX_TAGS) st.pick.tags.push(t); return render(); }
      if (b.hasAttribute('data-publicar')) {
        const e = edit(); if (!e) return;
        e.title = st.opts.titulo[st.pick.titulo]; e.desc = st.opts.descricao[st.pick.descricao]; e.tags = st.pick.tags.slice(0, MAX_TAGS);
        if (K.thumb) e.thumb = Object.assign({}, st.opts.thumb[st.pick.thumb]);
        const pc = st.pick.publi != null && st.pick.publi >= 0 ? SL.G.contracts[st.pick.publi] : null; e.sponsor = pc ? pc.id : null; st.publi = pc ? D.brandById(pc.brand).name : null;
        const err = VS().publish(e.id); if (err) { st.err = err; return render(); }
        st.video = e.video; st.step = 'resultado'; return render();
      }
      if (b.hasAttribute('data-divulgar')) { const v = G.videos.find(x => x.id === st.video); const err = SL.Social.post({ kind: 'texto', text: 'Vídeo novo no ' + K.plat + ': ' + (v ? v.title : '') + ' (link no perfil)', eng: 1.1 }); if (err) { st.err = err; return render(); } st.divulgado = true; if (v) v.boost = Object.assign({}, v.boost || {}, { ig: 1 }); return render(); }
      if (b.hasAttribute('data-ver')) { m.close(); UI.openApp(K.app, K.app === 'vision' ? { video: st.video } : undefined); return; }
      if (b.hasAttribute('data-fim')) return m.close();
    });
    if (st.step === 'editando') editar(); else { if (st.step === 'configurar') opcoes(); render(); }
  };
  UI.criarVideo.KINDS = KINDS;
})(window.SL);

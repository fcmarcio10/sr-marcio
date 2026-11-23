/* App Estúdio de Vídeo: criar vídeos em 10 passos, editar, fazer thumbnail, publicar ou agendar. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const $ = UI.$, $$ = UI.$$, ic = UI.ic, esc = U.esc;
  const VS = () => SL.Videos;
  const STEPS = ['Tipo', 'Assunto', 'Jogo', 'Gravação', 'Momentos', 'Edição', 'Título', 'Thumbnail', 'Tags', 'Publicar'];
  const EXPR = [['surpreso', 'Surpresa'], ['rindo', 'Rindo'], ['bravo', 'Bravo'], ['feliz', 'Feliz'], ['triste', 'Triste'], ['neutro', 'Neutro']];
  const TCOL = ['#ffe066', '#ffffff', '#ff3b3b', '#4cc3ff', '#35d39a', '#ff8fc1'];
  const rawLabel = r => (VS().RAWKINDS[r.kind] || { label: r.kind }).label + (r.game && !['conversa', 'react'].includes(r.game) || r.kind === 'gameplay' || r.kind === 'live' ? ' · ' + (D.gameById(r.game) || {}).name : '') + (r.title ? ' · ' + r.title : '');
  const titleIdeas = (e) => {
    const g = D.gameById(e.game) || {}; const n = g.name || ''; const m = (e.moments[0] || {}).txt || '';
    const base = { short: ['{m}', 'O chat não acreditou nisso', 'Isso aconteceu ao vivo'], reel: ['{m}', 'Melhor momento da semana'], corte: ['O momento mais insano da live de {g}', '{m} (corte da live)'], opiniao: ['Minha opinião sincera sobre {t}', 'Precisamos falar sobre {t}'], vlog: ['Um dia comigo: {t}', 'Passei o dia no {p}'], desafio: ['DESAFIO: {m} no {g}', 'Tentei o impossível no {g}'], reacao: ['Reagindo aos vídeos mais absurdos', 'Não consegui parar de rir com esses vídeos'], colab: ['Collab insana no {g}', 'Jogamos {g} juntos e deu nisso'] };
    const list = base[e.type] || ['{g}: {m}', 'PRIMEIRA VEZ jogando {g}', 'Joguei {g} até vencer'];
    return list.map(s => s.replace('{m}', m).replace('{g}', n).replace('{t}', e.topic || n || 'o assunto do momento').replace('{p}', (D.placeById(e.place || '') || {}).name || 'shopping'));
  };

  SL.Apps.estudio = {
    title: 'Estúdio de Vídeo', short: 'Estúdio', icon: 'scissors', color: 'linear-gradient(135deg,#ff5a36,#c2306a)', pc: true, phone: false, w: 1000, h: 680,
    watch: ['videos', 'activity'],
    badge: () => SL.G.edits.filter(e => e.status === 'pronto').length,
    render(el, ctx) {
      const st = ctx.st; const a = ctx.args || {};
      if (a.raw && !st.consumed) { st.consumed = true; st.tab = 'novo'; st.w = { step: 5, type: a.type || 'short', raw: a.raw, moments: a.moment != null ? [a.moment] : [], level: 'padrao', editor: 'eu', topic: '' }; const r = SL.G.raw.find(x => x.id === a.raw); if (r) st.w.game = r.game; }
      st.tab = st.tab || 'novo';
      const tabs = [['novo', 'Novo vídeo', 'plus'], ['producao', 'Em produção', 'scissors'], ['gravacoes', 'Gravações', 'video'], ['publicados', 'Publicados', 'upload']];
      el.innerHTML = `<div class="app"><div class="app-head"><div class="brandbar"><span class="bl" style="background:#ff5a36">${ic('scissors', 15)}</span>Estúdio de Vídeo</div><div class="tabs">${tabs.map(([k, l, i]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${ic(i, 14)}${l}${k === 'producao' && SL.G.edits.some(e => e.status === 'pronto') ? ' <span class="badge">' + SL.G.edits.filter(e => e.status === 'pronto').length + '</span>' : ''}</button>`).join('')}</div></div><div class="app-body">${this[st.tab](ctx)}</div></div>`;
      $$('canvas[data-thumb]', el).forEach(cv => { const e = SL.G.edits.find(x => x.id === cv.dataset.thumb) || SL.G.videos.find(x => x.id === cv.dataset.thumb); if (e) SL.Preview.thumbTo(cv, { game: e.game, th: e.thumb, title: e.title, seed: e.id }); });
    },
    stepper(cur) { return `<div class="stepper">${STEPS.map((s, i) => `<span class="st ${i + 1 === cur ? 'on' : i + 1 < cur ? 'done' : ''}">${i + 1}. ${s}</span>`).join('')}</div>`; },
    novo(ctx) {
      const st = ctx.st; const w = st.w = st.w || { step: 1, type: null, raw: null, moments: [], level: 'padrao', editor: 'eu', topic: '', game: null };
      const G = SL.G; const T = VS().TYPES;
      const nav = (back, next, nextOk, nextLabel) => `<div class="row between">${back ? `<button class="btn" data-act="step" data-s="${back}">${ic('left', 14)} Voltar</button>` : '<span></span>'}${next ? `<button class="btn primary" data-act="step" data-s="${next}" ${nextOk ? '' : 'disabled'}>${nextLabel || 'Continuar'} ${ic('right', 14)}</button>` : ''}</div>`;
      let body = '';
      if (G.act && G.act.id === 'gravar') body += `<div class="card" style="border-color:var(--live)"><b class="small">${ic('video', 14)} ${esc(G.act.label)}: ${Math.round(SL.Life.progress() * 100)}%</b><div class="tiny muted">Quando terminar, o material aparece em Gravações.</div></div>`;
      if (w.step === 1) body += `<h3>Que tipo de conteúdo?</h3><div class="opt-grid">${Object.entries(T).map(([k, t]) => `<button class="opt-card ${w.type === k ? 'on' : ''}" data-act="type" data-v="${k}"><span class="oi">${ic(t.icon, 22)}</span><b>${t.label}</b><small>${({ vision: 'Vision', clipz: 'Clipz', connect: 'Connect' })[t.plat]} · ${t.short ? t.len[0] + '–' + t.len[1] + ' s' : Math.round(t.len[0] / 60) + '–' + Math.round(t.len[1] / 60) + ' min'}</small><small>Material: ${t.raws === 'any' ? 'qualquer gravação' : t.raws.map(r => (VS().RAWKINDS[r] || {}).label).join(', ')}</small></button>`).join('')}</div>` + nav(null, 2, !!w.type);
      if (w.step === 2) { const tr = G.trends; body += `<h3>Sobre o que é o vídeo?</h3><input class="input" data-f="topic" maxlength="60" value="${esc(w.topic)}" placeholder="Ex.: a nova atualização, meu primeiro PC, desafio sem morrer..."><div class="upper">Em alta agora</div><div class="row wrap">${tr.tags.slice(0, 5).map(t => `<button class="chip" data-act="topic" data-v="${esc(t.tag.slice(1))}">${esc(t.tag)}</button>`).join('')}${SL.Algo.hotGames().slice(0, 4).map(x => `<button class="chip" data-act="topic" data-v="${esc(x.g.name)}">${esc(x.g.name)}</button>`).join('')}${tr.topics.map(t => `<button class="chip" data-act="topic" data-v="${esc(t.key)}">${esc(t.label || t.key)}</button>`).join('')}</div><p class="small muted">Assuntos em alta trazem mais cliques. Opiniões fortes chamam atenção, mas podem virar polêmica.</p>` + nav(1, 3, true); }
      if (w.step === 3) { body += `<h3>Jogo ou categoria</h3><div class="game-pick">${D.games.map(g => `<button class="gp ${w.game === g.id ? 'on' : ''}" data-act="wgame" data-v="${g.id}"><span class="gc" style="background:${g.color}"></span><b>${esc(g.name)}</b><small>${esc(g.cat)} · ${SL.Algo.trendMul(g.id) > 1.12 ? '<span class="ok">em alta</span>' : 'estável'}</small></button>`).join('')}</div>` + nav(2, 4, !!w.game); }
      if (w.step === 4) {
        const t = T[w.type]; const raws = G.raw.filter(r => (t.raws === 'any' || t.raws.includes(r.kind))).slice().reverse();
        const pref = raws.filter(r => !w.game || r.game === w.game || ['vlog', 'opiniao', 'react'].includes(r.kind));
        const kinds = t.raws === 'any' ? ['gameplay', 'desafio', 'react', 'opiniao', 'vlog'] : t.raws.filter(k => VS().RAWKINDS[k].where !== 'auto');
        body += `<h3>Gravação</h3><div class="small muted">Escolha um material já gravado ou grave agora (o tempo do jogo passa enquanto você grava).</div>
          <div class="col">${pref.length ? pref.map(r => `<button class="opt-card ${w.raw === r.id ? 'on' : ''}" data-act="raw" data-v="${r.id}"><div class="row"><span class="oi">${ic(VS().RAWKINDS[r.kind].icon, 18)}</span><b class="grow">${esc(rawLabel(r))}</b><span class="tag">${U.dur(r.minutes)}</span><span class="tag ${r.quality >= 60 ? 'ok' : r.quality >= 40 ? 'warn' : 'bad'}">qualidade ${r.quality}</span></div><small>${r.moments.length} momentos · gravado ${SL.Clock.ago(r.t)}${r.used ? ' · já usado ' + r.used + 'x' : ''}</small></button>`).join('') : '<div class="empty">Nenhum material compatível ainda.</div>'}</div>
          ${kinds.length ? `<div class="card col"><h3>Gravar agora</h3><div class="row wrap">${kinds.map(k => `<button class="chip ${st.rk === k ? 'on' : ''}" data-act="rk" data-v="${k}">${ic(VS().RAWKINDS[k].icon, 13)} ${VS().RAWKINDS[k].label}</button>`).join('')}</div>${st.rk ? `<div class="row wrap">${[30, 60, 120, 180].map(m => `<button class="btn sm" data-act="rec" data-m="${m}">${U.dur(m)}</button>`).join('')}<span class="tiny muted">${st.rk === 'vlog' ? 'Vlog só na rua.' : 'Usa o computador e o jogo escolhido.'}</span></div>` : ''}</div>` : ''}` + nav(3, 5, !!w.raw);
      }
      if (w.step === 5) {
        const r = G.raw.find(x => x.id === w.raw); const t = T[w.type];
        body += `<h3>Escolha os melhores momentos</h3><div class="small muted">${t.short ? 'Shorts e reels usam um momento só.' : 'Vídeos longos rendem mais com 3 a 6 momentos fortes.'} A barra mostra o potencial de cada um.</div><div class="col gap4">${r ? r.moments.map((m, i) => `<div class="moment ${w.moments.includes(i) ? 'on' : ''}" data-act="mom" data-v="${i}"><span class="acc">${ic(m.funny > 0.6 ? 'joke' : m.int > 0.7 ? 'fire' : 'star', 16)}</span><span class="grow small">${esc(m.txt)}</span><div class="bar clipbar"><i style="width:${m.clip * 100}%"></i></div></div>`).join('') : ''}</div>` + nav(4, 6, w.moments.length > 0);
      }
      if (w.step === 6) {
        const editors = SL.Rel.staffOf('editor');
        body += `<h3>Edição</h3><div class="opt-grid">${Object.entries(VS().LEVELS).map(([k, l]) => `<button class="opt-card ${w.level === k ? 'on' : ''}" data-act="lvl" data-v="${k}"><b>${l.label}</b><small>${k === 'rapida' ? 'Corte simples, sai rápido' : k === 'padrao' ? 'Cortes, zoom e legendas' : 'Efeitos, ritmo e trilha caprichados'}</small><small class="mono">${U.dur(VS().workNeeded(w.type, k))} de trabalho</small></button>`).join('')}</div>
          <div class="upper">Quem edita</div><div class="row wrap"><button class="chip ${w.editor === 'eu' ? 'on' : ''}" data-act="ed" data-v="eu">Você (edição ${Math.round(G.player.skills.edicao)})</button>${editors.map(n => `<button class="chip ${w.editor === n.id ? 'on' : ''}" data-act="ed" data-v="${n.id}">${esc(n.name)} (edição ${n.skill})</button>`).join('')}${editors.length ? '' : '<span class="tiny muted">Contrate editores no app Equipe.</span>'}</div>
          <div class="small muted">Qualidade da edição depende da habilidade, do computador (${Math.round(SL.Equip.stats().render)} de renderização), do monitor e do seu cansaço.${G.equip.soft.editor_pro ? ' Editor Corte Pro ativo.' : ''}</div>` + nav(5, null) + `<button class="btn primary" data-act="create">${ic('scissors', 15)} Criar projeto de edição</button>`;
      }
      return this.stepper(w.step) + body;
    },
    producao(ctx) {
      const G = SL.G; const st = ctx.st;
      if (st.fin) { const e = G.edits.find(x => x.id === st.fin); if (e) return this.finalize(ctx, e); st.fin = null; }
      const list = G.edits.filter(e => ['editando', 'renderizando', 'pronto', 'agendado'].includes(e.status)).slice().reverse();
      if (!list.length) return `<div class="empty">${ic('scissors', 36)}<p>Nenhum vídeo em produção. Comece em "Novo vídeo".</p></div>`;
      return `<div class="col">${list.map(e => { const T = VS().TYPES[e.type]; const ed = e.editor === 'eu' ? 'Você' : (D.npcById(e.editor) || {}).name; return `<div class="job"><div class="row"><span class="acc">${ic(T.icon, 18)}</span><b class="grow">${esc(e.title || T.label + ' · ' + ((D.gameById(e.game) || {}).name || ''))}</b><span class="tag ${e.status === 'pronto' ? 'ok' : e.status === 'renderizando' ? 'info' : e.status === 'agendado' ? 'acc' : 'warn'}">${e.status}</span></div>
        <div class="row small muted">${VS().LEVELS[e.level].label} · ${e.moments.length} momentos · edição: ${esc(ed)}</div>
        ${e.status === 'editando' ? `<div class="bar"><i style="width:${e.done / e.work * 100}%"></i></div><div class="tiny muted mono">${U.dur(e.done)} / ${U.dur(e.work)}</div>` : e.status === 'renderizando' ? `<div class="tiny muted">Renderizando: cerca de ${U.dur(e.render)} restantes (o computador trabalha sozinho)</div>` : ''}
        <div class="row wrap">${e.status === 'editando' && e.editor === 'eu' ? [60, 120, 240].map(m => `<button class="btn sm" data-act="edit" data-e="${e.id}" data-m="${m}">Editar ${U.dur(Math.min(m, e.work - e.done))}</button>`).join('') + `<button class="btn sm" data-act="edit" data-e="${e.id}" data-m="9999">Até terminar</button>` : ''}${e.status === 'editando' && e.editor !== 'eu' ? '<span class="tiny muted">O editor trabalha das 9h às 18h.</span>' : ''}${e.status !== 'agendado' ? `<button class="btn sm primary" data-act="fin" data-e="${e.id}">${ic('edit', 14)} Título, thumbnail e publicação</button>` : ''}${e.status === 'editando' ? `<button class="btn sm ghost danger" data-act="del" data-e="${e.id}">${ic('trash', 14)}</button>` : ''}</div></div>`; }).join('')}</div>`;
    },
    finalize(ctx, e) {
      const st = ctx.st; st.ft = st.ft || 'titulo'; const T = VS().TYPES[e.type];
      const ts = SL.Algo.titleScore(e.title, { game: e.game, kind: 'video' }); const th = SL.Algo.thumbScore(e.thumb, { title: e.title, momentInt: e.moments[0] ? e.moments[0].int : 0 }); const tg = SL.Algo.tagScore(e.tags, e.game); const ds = SL.Algo.descScore(e.desc);
      const ring = (v, l) => `<div class="score"><div class="ring" style="border:3px solid ${v >= 65 ? 'var(--ok)' : v >= 45 ? 'var(--warn)' : 'var(--bad)'}">${v}</div><span class="small">${l}</span></div>`;
      const tabs = [['titulo', '7. Título e descrição'], ['thumb', '8. Thumbnail'], ['tags', '9. Tags'], ['pub', '10. Publicar']];
      let body = '';
      if (st.ft === 'titulo') body = `<div class="field"><label>Título</label><input class="input" data-f="etitle" maxlength="90" value="${esc(e.title)}" placeholder="Um título que dê vontade de clicar"><div class="tiny muted">${ts.notes.map(esc).join(' · ')}</div></div><div class="row wrap"><span class="upper">Ideias:</span>${titleIdeas(e).map(x => `<button class="chip" data-act="tidea" data-v="${esc(x)}">${esc(x.length > 46 ? x.slice(0, 44) + '…' : x)}</button>`).join('')}</div>
        <div class="field"><label>Descrição</label><textarea class="textarea" data-f="edesc" placeholder="Explique o vídeo, avise o horário das lives, chame para o Connect...">${esc(e.desc)}</textarea></div>`;
      if (st.ft === 'thumb') body = T.plat !== 'vision' ? `<p class="small muted">${T.label} não usa thumbnail: o primeiro segundo do vídeo é a capa. O que conta é o momento escolhido.</p>` : `<div class="thumb-ed"><div class="col"><canvas class="thumb" id="th-cv"></canvas><div class="tiny muted">${th.notes.map(esc).join(' · ')}</div></div><div class="col">
        <div class="field"><label>Texto (curto funciona melhor)</label><input class="input" data-f="ttext" maxlength="28" value="${esc(e.thumb.text)}" placeholder="NÃO ACREDITO"></div>
        <div class="field"><label>Sua expressão</label><div class="row wrap">${EXPR.map(([k, l]) => `<button class="chip ${e.thumb.expr === k ? 'on' : ''}" data-act="texpr" data-v="${k}">${l}</button>`).join('')}</div></div>
        <div class="field"><label>Cor do texto</label><div class="swatches">${TCOL.map(c => `<button class="sw ${e.thumb.color === c ? 'on' : ''}" style="background:${c}" data-act="tcol" data-v="${c}"></button>`).join('')}</div></div>
        <div class="field"><label>Fundo</label><div class="row wrap">${[0, 1, 2, 3, 4].map(i => `<button class="chip ${e.thumb.scene === i ? 'on' : ''}" data-act="tscene" data-v="${i}">Cena ${i + 1}</button>`).join('')}</div></div>
        <div class="row"><label class="row small"><input type="checkbox" data-act="tarrow" ${e.thumb.arrow ? 'checked' : ''}> Seta</label><label class="row small"><input type="checkbox" data-act="tcircle" ${e.thumb.circle ? 'checked' : ''}> Círculo</label></div></div></div>`;
      if (st.ft === 'tags') body = `<div class="row wrap">${SL.Algo.suggestTags(e.game).map(t => `<button class="chip ${e.tags.includes(t) ? 'on' : ''}" data-act="etag" data-v="${esc(t)}">#${esc(t)}</button>`).join('')}</div><div class="row"><input class="input" data-f="newtag" placeholder="Outra tag e Enter" style="max-width:240px"><span class="tiny muted">${e.tags.length}/8 tags</span></div>${e.tags.length ? `<div class="small">Escolhidas: ${e.tags.map(t => '#' + esc(t)).join(' ')}</div>` : ''}`;
      if (st.ft === 'pub') {
        const sponsorOpts = SL.Sponsors.active().filter(c => c.deliv.some(d => d.k === 'video' && d.done < d.n));
        const q = Math.round(VS().finalQuality(e)); const ready = e.status === 'pronto';
        body = `<div class="statrow"><div class="card">${ring(ts.score, 'Título')}</div>${T.plat === 'vision' ? `<div class="card">${ring(th.score, 'Thumbnail')}</div>` : ''}<div class="card">${ring(tg, 'Tags')}</div><div class="card">${ring(ds, 'Descrição')}</div><div class="card">${ring(q, 'Qualidade')}</div></div>
          ${sponsorOpts.length ? `<div class="card col"><b class="small">Publicidade paga</b>${sponsorOpts.map(c => `<label class="row small"><input type="radio" name="spons" data-act="spons" data-v="${c.id}" ${e.sponsor === c.id ? 'checked' : ''}> Incluir publi de ${esc(D.brandById(c.brand).name)}</label>`).join('')}<label class="row small"><input type="radio" name="spons" data-act="spons" data-v="" ${!e.sponsor ? 'checked' : ''}> Sem publicidade</label></div>` : ''}
          ${ready ? `<div class="row wrap"><button class="btn primary lg" data-act="pub" data-e="${e.id}">${ic('upload', 16)} Publicar agora no ${({ vision: 'Vision', clipz: 'Clipz', connect: 'Connect' })[T.plat]}</button><span class="upper">ou agendar:</span>${[[0, 18], [1, 12], [1, 18], [2, 18]].filter(([d, h]) => d > 0 || h > SL.Clock.hour()).map(([d, h]) => `<button class="btn sm" data-act="sched" data-e="${e.id}" data-d="${d}" data-h="${h}">${d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : SL.Clock.fmtDay(SL.Clock.day() + d)} ${h}h</button>`).join('')}</div>` : `<div class="card"><b class="small warn">${ic('clock', 14)} O vídeo ainda está ${e.status}. Prepare título e thumbnail enquanto isso.</b></div>`}
          <p class="tiny muted">Publicar com frequência ajuda o algoritmo. Títulos que prometem algo que o vídeo não entrega trazem cliques, mas derrubam a retenção.</p>`;
      }
      return `<div class="row"><button class="btn sm" data-act="finback">${ic('left', 14)} Em produção</button><b class="grow">${esc(e.title || T.label)}</b></div><div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${st.ft === k ? 'on' : ''}" data-act="ft" data-v="${k}">${l}</button>`).join('')}</div>${body}`;
    },
    gravacoes(ctx) {
      const G = SL.G; const list = G.raw.slice().reverse();
      return `<div class="card col"><h3>Nova gravação</h3><div class="row wrap">${['gameplay', 'desafio', 'react', 'opiniao'].map(k => `<button class="chip ${ctx.st.rk2 === k ? 'on' : ''}" data-act="rk2" data-v="${k}">${ic(VS().RAWKINDS[k].icon, 13)} ${VS().RAWKINDS[k].label}</button>`).join('')}</div>
        ${ctx.st.rk2 && ['gameplay', 'desafio'].includes(ctx.st.rk2) ? `<div class="row wrap">${D.games.filter(g => !g.nongame).map(g => `<button class="chip ${ctx.st.rg === g.id ? 'on' : ''}" data-act="rg" data-v="${g.id}">${esc(g.name)}</button>`).join('')}</div>` : ''}
        ${ctx.st.rk2 ? `<div class="row wrap">${[30, 60, 120, 180].map(m => `<button class="btn sm" data-act="rec2" data-m="${m}">Gravar ${U.dur(m)}</button>`).join('')}</div>` : '<span class="tiny muted">Vlogs são gravados na rua (vá a um lugar da cidade).</span>'}</div>
        ${list.length ? `<div class="col">${list.map(r => `<div class="job"><div class="row"><span class="acc">${ic(VS().RAWKINDS[r.kind].icon, 16)}</span><b class="grow small">${esc(rawLabel(r))}</b><span class="tag">${U.dur(r.minutes)}</span><span class="tag ${r.quality >= 60 ? 'ok' : 'warn'}">qualidade ${r.quality}</span></div><div class="tiny muted">${r.moments.length} momentos · ${SL.Clock.ago(r.t)}${r.used ? ' · usado ' + r.used + 'x' : ''}</div><div class="tiny">${r.moments.slice(0, 3).map(m => esc(m.txt)).join(' · ')}</div></div>`).join('')}</div>` : '<div class="empty">Nenhuma gravação. Lives também viram material automaticamente.</div>'}`;
    },
    publicados() {
      const G = SL.G; const list = G.videos.slice().reverse();
      if (!list.length) return '<div class="empty">Nada publicado ainda.</div>';
      return `<div class="vgrid">${list.slice(0, 40).map(v => `<div class="vcard" data-act="open" data-p="${v.plat}" data-v="${v.id}">${v.plat === 'vision' ? `<canvas data-thumb="${v.id}"></canvas>` : `<div class="thumb" style="display:grid;place-items:center;color:var(--clipz)">${ic(v.plat === 'clipz' ? 'clip' : 'connect', 30)}</div>`}<b>${esc(v.title)}</b><small>${({ vision: 'Vision', clipz: 'Clipz', connect: 'Connect' })[v.plat]} · ${v.status === 'agendado' ? 'agendado ' + SL.Clock.fmtStamp(v.t) : U.num(v.views) + ' visualizações · ' + SL.Clock.ago(v.t)}</small></div>`).join('')}</div>`;
    },
    act(a, ds, ctx, ev, t) {
      const st = ctx.st; const w = st.w; const G = SL.G;
      const e = ds.e ? G.edits.find(x => x.id === ds.e) : st.fin ? G.edits.find(x => x.id === st.fin) : null;
      const rr = () => ctx.render();
      switch (a) {
        case 'tab': st.tab = ds.t; st.fin = null; ctx.resetScroll = true; return rr();
        case 'step': w.step = +ds.s; return rr();
        case 'type': w.type = ds.v; w.raw = null; w.moments = []; return rr();
        case 'topic': w.topic = ds.v; return rr();
        case 'wgame': w.game = ds.v; return rr();
        case 'raw': { w.raw = ds.v; const r = G.raw.find(x => x.id === ds.v); w.moments = []; if (r) { w.game = r.game; w.place = r.place; const n = VS().TYPES[w.type].short ? 1 : Math.min(5, r.moments.length); for (let i = 0; i < n; i++) w.moments.push(i); } return rr(); }
        case 'rk': st.rk = ds.v; return rr();
        case 'rec': { const err = VS().startRecording({ kind: st.rk, game: w.game || 'xeque', minutes: +ds.m, topic: w.topic }); if (err) return err; UI.toast({ title: 'Gravando', text: 'Acompanhe pelo painel. O material aparece aqui quando acabar.', icon: 'video', cat: 'canal' }); return rr(); }
        case 'mom': { const i = +ds.v; const T = VS().TYPES[w.type]; const k = w.moments.indexOf(i); if (k >= 0) w.moments.splice(k, 1); else { if (T.short) w.moments = [i]; else if (w.moments.length < 8) w.moments.push(i); } return rr(); }
        case 'lvl': w.level = ds.v; return rr();
        case 'ed': w.editor = ds.v; return rr();
        case 'create': {
          const job = VS().createEdit({ raw: w.raw, type: w.type, moments: w.moments, level: w.level, editor: w.editor });
          if (typeof job === 'string') return job;
          job.topic = w.topic; job.place = w.place; job.title = titleIdeas(job)[0].slice(0, 80);
          st.w = null; st.tab = 'producao';
          UI.toast({ title: 'Projeto criado', text: w.editor === 'eu' ? 'Agora é editar: escolha quanto tempo trabalhar.' : 'O editor começa no próximo horário comercial.', icon: 'scissors', cat: 'canal' });
          return rr();
        }
        case 'edit': { const err = VS().startEditing(ds.e, +ds.m); if (err) return err; return rr(); }
        case 'del': return UI.confirm('Descartar projeto', 'O trabalho de edição feito será perdido.', () => { G.edits = G.edits.filter(x => x.id !== ds.e); rr(); }, 'Descartar', true);
        case 'fin': st.fin = ds.e; st.ft = 'titulo'; ctx.resetScroll = true; return rr();
        case 'finback': st.fin = null; return rr();
        case 'ft': st.ft = ds.v; rr(); return this.paintThumb(ctx);
        case 'tidea': e.title = ds.v; return rr();
        case 'texpr': e.thumb.expr = ds.v; rr(); return this.paintThumb(ctx);
        case 'tcol': e.thumb.color = ds.v; rr(); return this.paintThumb(ctx);
        case 'tscene': e.thumb.scene = +ds.v; rr(); return this.paintThumb(ctx);
        case 'tarrow': e.thumb.arrow = t.checked; return this.paintThumb(ctx);
        case 'tcircle': e.thumb.circle = t.checked; return this.paintThumb(ctx);
        case 'etag': { const i = e.tags.indexOf(ds.v); if (i >= 0) e.tags.splice(i, 1); else if (e.tags.length < 8) e.tags.push(ds.v); return rr(); }
        case 'spons': e.sponsor = ds.v || null; return;
        case 'pub': { const err = VS().publish(ds.e); if (err) return err; st.fin = null; st.tab = 'publicados'; SL.audio.play('success'); return rr(); }
        case 'sched': { const t0 = (SL.Clock.day() + +ds.d) * 1440 + +ds.h * 60; const err = VS().publish(ds.e, t0); if (err) return err; st.fin = null; return rr(); }
        case 'rk2': st.rk2 = ds.v; return rr();
        case 'rg': st.rg = ds.v; return rr();
        case 'rec2': { const err = VS().startRecording({ kind: st.rk2, game: st.rg || 'golplaca', minutes: +ds.m }); if (err) return err; return rr(); }
        case 'open': return UI.openApp(ds.p === 'clipz' ? 'clipz' : ds.p === 'connect' ? 'connect' : 'vision', { video: ds.v });
      }
    },
    paintThumb(ctx) { const cv = $('#th-cv', ctx.host); const e = SL.G.edits.find(x => x.id === ctx.st.fin); if (cv && e) SL.Preview.thumbTo(cv, { game: e.game, th: e.thumb, title: e.title, seed: e.id }); },
    input(t, ctx) {
      const st = ctx.st; const e = st.fin && SL.G.edits.find(x => x.id === st.fin);
      if (t.dataset.f === 'topic') st.w.topic = t.value;
      if (!e) return;
      if (t.dataset.f === 'etitle') { e.title = t.value; const ts = SL.Algo.titleScore(e.title, { game: e.game }); $('.tiny', t.closest('.field')).textContent = 'Nota ' + ts.score + ' · ' + ts.notes.join(' · '); }
      if (t.dataset.f === 'edesc') e.desc = t.value;
      if (t.dataset.f === 'ttext') { e.thumb.text = t.value; clearTimeout(st._tt); st._tt = setTimeout(() => this.paintThumb(ctx), 150); }
    },
    change(t, ctx) {
      const e = ctx.st.fin && SL.G.edits.find(x => x.id === ctx.st.fin);
      if (t.dataset.f === 'newtag' && e && t.value.trim()) { const v = t.value.trim().replace(/^#/, '').toLowerCase().slice(0, 20); if (!e.tags.includes(v) && e.tags.length < 8) e.tags.push(v); ctx.render(); }
    },
  };
  // a thumbnail é redesenhada depois de cada render
  const orig = SL.Apps.estudio.render;
  SL.Apps.estudio.render = function (el, ctx) { orig.call(this, el, ctx); if (ctx.st.fin && ctx.st.ft === 'thumb') this.paintThumb(ctx); };
})(window.SL);

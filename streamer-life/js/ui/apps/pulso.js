/* App Pulso Studio: preparar a live, estúdio ao vivo, painel do canal, comunidade, agenda e monetização. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const $ = UI.$, $$ = UI.$$;
  const ic = UI.ic, esc = U.esc;
  const LV = () => SL.Live;
  const TITLE_IDEAS = ['Primeira vez jogando {g}: será que eu aguento?', 'DESAFIO: só paro quando vencer no {g}', '{g} até zerar! Chat manda nos desafios', 'Live relax de {g} e papo com o chat', 'Tentando o impossível no {g} hoje', 'Subindo de nível no {g} com vocês', 'Noite de {g}: recorde do canal hoje?'];

  const viewerBadges = m => (m.badges || []).map(b => ({ streamer: '<i style="background:#8b5cf6" title="Streamer">S</i>', mod: '<i style="background:#35d39a" title="Moderador">M</i>', sub: '<i style="background:#ffb547" title="Inscrito">★</i>', veterano: '<i style="background:#c084fc" title="Veterano">V</i>', novo: '<i style="background:#4cc3ff" title="Primeira vez">N</i>', apoiador: '<i style="background:#ff8fc1" title="Apoiador">$</i>', amigo: '<i style="background:#ff5a36" title="Amigo">♥</i>', verificado: '<i style="background:#4cc3ff" title="Verificado">✓</i>' })[b] || '').join('');
  const msgHTML = m => {
    if (m.kind === 'follow' || m.kind === 'sub' || m.kind === 'alert' || m.kind === 'bot') return `<div class="cm sys ${m.kind}" data-m="${m.id}">${m.kind === 'follow' ? ic('follow', 13) : m.kind === 'sub' ? ic('sub', 13) : m.kind === 'bot' ? ic('shield', 13) : ic('info', 13)} ${m.html}</div>`;
    if (m.kind === 'mod') return `<div class="cm mod" data-m="${m.id}">${ic('shield', 13)} <b>moderação:</b> ${m.html}</div>`;
    if (m.kind === 'donation') return `<div class="cm donation" data-m="${m.id}"><span class="amt">${U.money(m.amount)}</span> <span class="u" style="color:${m.c}">${esc(m.u)}</span> ${m.html}</div>`;
    return `<div class="cm ${m.kind === 'streamer' ? 'streamer' : ''} ${m.q ? 'q' : ''}" data-m="${m.id}"><span class="bd">${viewerBadges(m)}</span><span class="u" style="color:${m.c}">${esc(m.u)}:</span>${m.html}</div>`;
  };
  const predict = o => {
    const G = SL.G; const g = D.gameById(o.game); if (!g) return null;
    const P = G.ch.pulso; const pop = SL.Algo.gamePop(g);
    const base = P.f * 0.04 * (0.5 + 0.5 * SL.Algo.todMul(SL.Clock.hour())) * (o.announce ? 1.35 : 1) + (1.05 * pop / 100 * (1 - 0.7 * g.sat) * 0.35 * SL.Algo.todMul(SL.Clock.hour()) * 15);
    const lo = Math.max(0, Math.round(base * 0.5)), hi = Math.max(2, Math.round(base * 1.7 + 3));
    return [lo, hi];
  };

  SL.Apps.pulso = {
    title: 'Pulso Studio', short: 'Pulso', icon: 'pulso', color: 'linear-gradient(135deg,#8b5cf6,#5b3fd6)', pc: true, phone: false, w: 1040, h: 680,
    watch: ['live:end', 'promises', 'tick:hour', 'equip', 'videos'],
    render(el, ctx) {
      const st = ctx.st; st.tab = st.tab || (ctx.args && ctx.args.tab) || 'transmitir';
      const tabs = [['transmitir', 'Transmitir', 'live'], ['painel', 'Painel', 'stats'], ['comunidade', 'Comunidade', 'users'], ['agenda', 'Agenda', 'calendar'], ['monetizacao', 'Monetização', 'money']];
      el.innerHTML = `<div class="app"><div class="app-head"><div class="brandbar"><span class="bl" style="background:#8b5cf6">${ic('pulso', 15)}</span>Pulso Studio</div><div class="tabs">${tabs.map(([k, l, i]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${ic(i, 14)}${l}</button>`).join('')}</div></div><div class="app-body">${this[st.tab](ctx)}</div></div>`;
      if (st.tab === 'painel') { const cv = $('#pl-chart', el); if (cv) UI.chart(cv, [{ data: SL.G.lives.slice(-20).map(l => l.avg), color: '#8b5cf6' }, { data: SL.G.lives.slice(-20).map(l => l.peak), color: '#ff4d5e', fill: false }], { labels: SL.G.lives.slice(-20).map(l => SL.Clock.fmtDay(SL.Clock.day(l.t0)).slice(5)) }); }
    },
    transmitir(ctx) {
      const G = SL.G; const st = ctx.st;
      const f = st.form = st.form || { game: G.ch.catHist && SL.Creators.playerMainGame() || 'conversa', title: '', desc: '', tags: [], quality: '720p', planned: 120, cam: SL.Equip.stats().hasCam, layout: 'classico', announce: true };
      if (LV().cur) return `<div class="empty">${ic('live', 40)}<p>Você está ao vivo agora.</p><button class="btn live" data-act="reopen">Voltar para a live</button></div>`;
      const g = D.gameById(f.game); const ts = SL.Algo.titleScore(f.title, { game: f.game, kind: 'live' });
      const q = SL.Equip.streamQuality(g, f.quality, f.cam, {});
      const comp = SL.Algo.competitors(f.game); const pr = predict(f);
      const collab = Object.keys(G.rel).find(id => { const r = G.rel[id]; return r.plan && r.plan.kind === 'collab' && Math.abs(G.time.t - r.plan.t) <= 120; });
      const sched = G.ch.schedule.find(s => !s.done && s.day === SL.Clock.day() && Math.abs(s.hour - SL.Clock.hourF()) <= 1.6);
      return `<div class="live-setup">
        <div class="col gap16">
          ${collab ? `<div class="card" style="border-color:var(--info)"><div class="row"><span class="acc">${ic('users', 18)}</span><b class="grow">Collab agendada com ${esc(SL.Rel.name(collab))}</b><label class="row small"><input type="checkbox" data-act="collab" ${f.collab ? 'checked' : ''}> Fazer agora</label></div></div>` : ''}
          ${sched ? `<div class="card" style="border-color:var(--ok)"><b class="small">${ic('calendar', 14)} Esta live estava agendada: seus seguidores estão esperando.</b></div>` : ''}
          <div class="col"><div class="section-t"><h3>Jogo ou categoria</h3><span class="tiny muted">Tendência e concorrência mudam todo dia</span></div>
          <div class="game-pick">${D.games.map(x => { const cs = SL.Equip.canStream(x, '480p'); const tm = SL.Algo.trendMul(x.id); const cp = SL.Algo.competitors(x.id); const ql = SL.Equip.streamQuality(x, f.quality, f.cam, {}); return `<button class="gp ${f.game === x.id ? 'on' : ''} ${cs.ok ? '' : 'no'}" data-act="game" data-g="${x.id}" title="${esc(cs.ok ? x.cat : cs.reason)}"><span class="gc" style="background:${x.color}"></span><b>${esc(x.name)}</b><small>${esc(x.cat)} · ${tm > 1.12 ? '<span class="ok">em alta</span>' : tm < 0.88 ? '<span class="bad">em baixa</span>' : 'estável'}</small><small>${cs.ok ? (ql.fps < 0.8 ? '<span class="warn">PC no limite</span>' : 'roda bem') : '<span class="bad">indisponível</span>'}${cp.viewers ? ' · ' + U.num(cp.viewers) + ' em concorrentes' : ''}</small></button>`; }).join('')}</div></div>
          <div class="field"><label for="lv-title">Título da live</label><div class="row"><input id="lv-title" class="input" maxlength="90" value="${esc(f.title)}" data-f="title" placeholder="Ex.: Primeira vez no ${esc(g.name)}!"><button class="btn sm" data-act="idea">${ic('sparkle', 14)} Ideia</button></div>
            <div class="row small"><div class="bar grow"><i style="width:${ts.score}%;background:${ts.score >= 65 ? 'var(--ok)' : ts.score >= 45 ? 'var(--warn)' : 'var(--bad)'}"></i></div><b class="mono">${ts.score}</b></div><div class="tiny muted">${ts.notes.slice(0, 3).map(esc).join(' · ')}</div></div>
          <div class="field"><label for="lv-desc">Descrição</label><textarea id="lv-desc" class="textarea" data-f="desc" placeholder="Conte o que vai rolar, horário das lives, redes...">${esc(f.desc)}</textarea><div class="tiny muted">Nota da descrição: ${SL.Algo.descScore(f.desc)}</div></div>
          <div class="field"><label>Tags (até 6)</label><div class="row wrap">${SL.Algo.suggestTags(f.game).map(t => `<button class="chip ${f.tags.includes(t) ? 'on' : ''}" data-act="tag" data-v="${esc(t)}">#${esc(t)}</button>`).join('')}</div></div>
        </div>
        <div class="col gap16">
          <div class="card col"><h3>Transmissão</h3>
            <div class="field"><label>Qualidade</label><div class="row wrap">${Object.keys(SL.Equip.PRESETS).map(k => `<button class="chip ${f.quality === k ? 'on' : ''}" data-act="q" data-v="${k}">${k}</button>`).join('')}</div></div>
            <div class="field"><label>Duração planejada</label><div class="row wrap">${[60, 120, 180, 240].map(m => `<button class="chip ${f.planned === m ? 'on' : ''}" data-act="dur" data-v="${m}">${U.dur(m)}</button>`).join('')}</div></div>
            <div class="field"><label>Layout</label><div class="row wrap">${[['classico', 'Câmera no canto'], ['camera', 'Câmera grande'], ['dividida', 'Tela dividida'], ['sem', 'Sem câmera']].map(([k, l]) => `<button class="chip ${f.layout === k ? 'on' : ''}" data-act="layout" data-v="${k}">${l}</button>`).join('')}</div></div>
            <label class="row small"><input type="checkbox" data-act="cam" ${f.cam ? 'checked' : ''} ${SL.Equip.stats().hasCam ? '' : 'disabled'}> Webcam ligada ${SL.Equip.stats().hasCam ? '' : '<span class="muted">(sem webcam)</span>'}</label>
            <label class="row small"><input type="checkbox" data-act="ann" ${f.announce ? 'checked' : ''}> Divulgar no Connect ao começar</label>
          </div>
          <div class="card col"><h3>Teste técnico</h3>
            <div class="attr">Imagem<div class="bar"><i style="width:${q.img}%"></i></div><b>${Math.round(q.img)}</b></div>
            <div class="attr">Fluidez<div class="bar"><i style="width:${q.fps * 100}%;background:${q.fps < 0.8 ? 'var(--warn)' : 'var(--ok)'}"></i></div><b>${Math.round(q.fps * 100)}</b></div>
            <div class="attr">Áudio<div class="bar"><i style="width:${q.audio}%"></i></div><b>${Math.round(q.audio)}</b></div>
            <div class="attr">Câmera<div class="bar"><i style="width:${q.video}%"></i></div><b>${Math.round(q.video)}</b></div>
            <div class="attr">Internet<div class="bar"><i style="width:${q.netOk * 100}%;background:${q.netOk < 0.85 ? 'var(--bad)' : 'var(--ok)'}"></i></div><b>${Math.round(q.netOk * 100)}</b></div>
            ${q.issues.length ? `<div class="tiny warn">${q.issues.map(i => ({ lag: 'O computador não dá conta: vai travar.', rede: 'Sua internet não aguenta essa qualidade.', cam: 'Câmera escura ou ruim.', mic: 'Sem microfone.' })[i]).join(' ')}</div>` : '<div class="tiny ok">Tudo certo para transmitir.</div>'}
          </div>
          <div class="card col"><h3>Estimativa</h3><div class="stat"><b>${pr ? pr[0] + '–' + pr[1] : '?'}</b><span>pessoas ao mesmo tempo (estimativa incerta)</span></div>
            <div class="tiny muted">Horário: ${SL.Algo.todMul(SL.Clock.hour()) >= 1 ? 'nobre (19h–23h)' : 'fora do horário nobre'} · ${comp.best ? esc(D.creatorById(comp.best.id).name) + ' está ao vivo nesse jogo' : 'sem concorrente grande ao vivo nesse jogo'}</div></div>
          <button class="btn live lg pulse" data-act="start">${ic('live', 18)} Entrar ao vivo</button>
        </div></div>`;
    },
    painel() {
      const G = SL.G; const P = G.ch.pulso; const lives = G.lives.slice().reverse();
      const av = G.ch.avgViewers.slice(-10); const avg = av.length ? av.reduce((a, b) => a + b, 0) / av.length : 0;
      return `<div class="statrow"><div class="card stat"><b>${U.num(P.f)}</b><span>Seguidores na Pulso</span></div><div class="card stat"><b>${U.num(P.subs)}</b><span>Inscritos ativos</span></div><div class="card stat"><b>${U.int(avg * 10) / 10 || 0}</b><span>Média (últimas 10 lives)</span></div><div class="card stat"><b>${U.num(P.peak)}</b><span>Recorde de público</span></div><div class="card stat"><b>${Math.round(P.hours)}h</b><span>Horas transmitidas</span></div><div class="card stat"><b>${P.parc ? 'Parceiro' : P.afil ? 'Afiliado' : 'Iniciante'}</b><span>Status na Pulso</span></div></div>
        <div class="card"><div class="section-t"><h3>Público por live</h3><span class="tiny muted"><span style="color:#8b5cf6">média</span> · <span style="color:#ff4d5e">pico</span></span></div>${G.lives.length ? '<canvas class="chart" id="pl-chart"></canvas>' : '<div class="empty">Faça sua primeira live para ver o gráfico.</div>'}</div>
        <div class="card"><h3>Histórico de lives</h3>${lives.length ? `<div class="tablewrap"><table class="table"><tr><th>Data</th><th>Jogo</th><th>Duração</th><th>Pico</th><th>Média</th><th>Seguidores</th><th>Doações</th><th>Qualidade</th></tr>${lives.slice(0, 40).map(l => `<tr><td>${SL.Clock.fmtDay(SL.Clock.day(l.t0))}</td><td>${esc(D.gameById(l.game).name)}</td><td class="n">${U.dur(l.dur)}</td><td class="n">${U.int(l.peak)}</td><td class="n">${l.avg}</td><td class="n ok">+${U.int(l.fol)}</td><td class="n">${U.money(l.don)}</td><td class="n">${l.q}</td></tr>`).join('')}</table></div>` : '<div class="empty">Nenhuma live ainda.</div>'}</div>`;
    },
    comunidade(ctx) {
      const G = SL.G; const st = ctx.st; st.cf = st.cf || 'todos'; st.q = st.q || '';
      let list = G.viewers.list.slice();
      const F = { todos: v => !v.ban, fas: v => v.loy >= 55 && !v.ban, inscritos: v => v.sub, novos: v => v.m.v <= 1 && !v.ban, recorrentes: v => v.m.v >= 3 && !v.ban, mods: v => v.mod, banidos: v => v.ban };
      list = list.filter(F[st.cf]).filter(v => !st.q || v.u.includes(st.q.toLowerCase()));
      list.sort((a, b) => (b.loy + b.m.v * 2) - (a.loy + a.m.v * 2));
      const sel = st.sel && SL.Viewers.byId(st.sel);
      return `<div class="row wrap"><input class="input" style="max-width:220px" placeholder="Buscar @usuário" data-f="q" value="${esc(st.q)}">${Object.keys(F).map(k => `<button class="chip ${st.cf === k ? 'on' : ''}" data-act="cf" data-v="${k}">${({ todos: 'Todos', fas: 'Fãs', inscritos: 'Inscritos', novos: 'Novos', recorrentes: 'Recorrentes', mods: 'Moderadores', banidos: 'Banidos' })[k]}</button>`).join('')}<span class="tiny muted">${U.int(G.viewers.list.length)} pessoas conhecidas · o resto do público é anônimo</span></div>
        <div class="grid2" style="align-items:start"><div class="card" style="padding:6px"><div class="list">${list.slice(0, 80).map(v => `<div class="li click" data-act="vsel" data-v="${v.id}"><span class="ava" style="width:30px;height:30px;font-size:13px;background:${v.c}">${esc(v.u[0].toUpperCase())}</span><div class="grow"><b class="small" style="color:${v.c}">@${esc(v.u)}</b><div class="tiny muted">${v.m.v} visitas · ${v.fol ? 'segue' : 'não segue'}${v.m.don ? ' · doou ' + U.money0(v.m.don) : ''}</div></div><span class="tag ${v.loy >= 55 ? 'acc' : ''}">${SL.Viewers.label(v)}</span></div>`).join('') || '<div class="empty">Ninguém aqui ainda.</div>'}</div></div>
        <div>${sel ? this.profile(sel) : '<div class="card empty">' + ic('user', 30) + '<p>Escolha alguém para ver a ficha, a memória e o histórico.</p></div>'}</div></div>`;
    },
    profile(v) {
      const ar = D.archetypes[v.a]; const games = Object.entries(v.m.g).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g, n]) => D.gameById(g).name + ' (' + n + ')').join(', ');
      return `<div class="card col"><div class="row"><span class="ava" style="width:48px;height:48px;font-size:20px;background:${v.c}">${esc(v.u[0].toUpperCase())}</span><div class="grow"><b style="color:${v.c}">@${esc(v.u)}</b><div class="small muted">${esc(v.n)} · ${v.age} anos</div></div><span class="tag acc">${SL.Viewers.label(v)}</span></div>
        <div class="kv"><span>Jeito</span><span>${esc(ar ? ar.label : v.a)}</span><span>Gosta de</span><span>${esc(v.favs.join(', '))}</span><span>Jogo favorito</span><span>${esc((D.gameById(v.fg) || {}).name || '')}</span><span>Costuma ver às</span><span>${v.hr}h</span><span>Visitas</span><span>${v.m.v}</span><span>Mensagens</span><span>${v.m.msg}</span><span>Respondido(a)</span><span>${v.m.rep}x</span><span>Doações</span><span>${U.money(v.m.don)}</span><span>Desde</span><span>${SL.Clock.fmtDay(v.m.f)}</span></div>
        <div class="relbar">Fidelidade<div class="bar"><i style="width:${v.loy}%"></i></div><b>${Math.round(v.loy)}</b></div>
        <div class="relbar">Interesse<div class="bar"><i style="width:${v.int}%;background:var(--info)"></i></div><b>${Math.round(v.int)}</b></div>
        ${games ? `<div class="small"><span class="muted">Viu você jogar:</span> ${esc(games)}</div>` : ''}
        ${v.m.notes.length ? `<div class="upper">Memória</div>${v.m.notes.slice().reverse().map(n => `<div class="memo">${esc(SL.Chat.fill(SL.Viewers.noteText(n), v, {}))} <span class="faint tiny">· ${SL.Clock.fmtDay(n.d)}</span></div>`).join('')}` : ''}
        ${v.m.saw.length ? `<div class="small muted">Esteve presente em ${v.m.saw.length} momentos marcantes do canal.</div>` : ''}
        <div class="row wrap">${v.ban ? `<button class="btn sm" data-act="unban" data-v="${v.id}">Desbanir</button>` : v.mod ? `<button class="btn sm" data-act="unmod" data-v="${v.id}">Remover moderação</button>` : `<button class="btn sm" data-act="mkmod" data-v="${v.id}">${ic('shield', 14)} Tornar moderador(a)</button>`}</div></div>`;
    },
    agenda() {
      const G = SL.G; const day = SL.Clock.day();
      const sch = G.ch.schedule.filter(s => s.day >= day - 1).sort((a, b) => a.day - b.day || a.hour - b.hour);
      const prom = G.promises.slice().reverse().slice(0, 20);
      const kindL = p => p.kind === 'live' ? 'Live ' + SL.Clock.fmtDay(p.day) + ' às ' + p.hour + 'h' : p.kind === 'jogo' ? 'Jogar ' + D.gameById(p.game).name + ' até ' + SL.Clock.fmtDay(p.until) : 'Jogar com o chat até ' + SL.Clock.fmtDay(p.until);
      return `<div class="card col"><h3>Agendar uma live</h3><p class="small muted">Agendar avisa os seguidores (post no Connect) e aumenta o público. Faltar quebra a confiança.</p>
        <div class="row wrap">${[0, 1, 2, 3].map(d => `<button class="chip" data-act="schd" data-v="${d}" ${d === (G.st_schd || 0) ? '' : ''}>${d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : SL.Clock.fmtDay(day + d)}</button>`).join('')}</div>
        <div class="row wrap">${[14, 16, 18, 19, 20, 21, 22, 23].map(h => `<button class="btn sm" data-act="sch" data-h="${h}">${h}h</button>`).join('')}</div><div class="tiny muted" id="sch-day">Dia escolhido: ${this._schd ? SL.Clock.fmtDay(day + this._schd) : 'hoje'}</div></div>
        <div class="card"><h3>Lives agendadas</h3>${sch.length ? `<div class="list">${sch.map(s => `<div class="li"><span class="acc">${ic('live', 15)}</span><b class="grow small">${SL.Clock.fmtDay(s.day)} às ${s.hour}h</b><span class="tag ${s.done ? 'ok' : s.missed ? 'bad' : 'warn'}">${s.done ? 'aconteceu' : s.missed ? 'perdida' : 'pendente'}</span></div>`).join('')}</div>` : '<div class="empty">Nenhuma live agendada.</div>'}</div>
        <div class="card"><h3>Promessas feitas ao público</h3>${prom.length ? `<div class="list">${prom.map(p => `<div class="li"><span class="${p.status === 'cumprida' ? 'ok' : p.status === 'quebrada' ? 'bad' : 'warn'}">${ic(p.status === 'cumprida' ? 'check' : p.status === 'quebrada' ? 'x' : 'clock', 15)}</span><div class="grow"><b class="small">${esc(kindL(p))}</b><div class="tiny muted">${esc(p.why)} · ${p.viewers.length} pessoas lembram</div></div><span class="tag">${p.status}</span></div>`).join('')}</div>` : '<div class="empty">Nenhuma promessa. Elas surgem quando você responde o chat.</div>'}</div>`;
    },
    monetizacao() {
      const G = SL.G; const P = G.ch.pulso; const mk = SL.Clock.monthKey(); const m = G.month[mk] || { in: {} };
      const req = [[P.f, 50, 'seguidores'], [P.livesN, 7, 'lives feitas'], [G.ch.avgViewers.slice(-10).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(10, G.ch.avgViewers.length)), 3, 'média de pessoas']];
      const nextMon = (() => { for (let d = SL.Clock.day() + 1; d < SL.Clock.day() + 8; d++) if (SL.Clock.dowOfDay(d) === 1) return d; return SL.Clock.day() + 7; })();
      return `<div class="statrow"><div class="card stat"><b class="ok">${U.money(P.bal)}</b><span>Saldo a receber (repasse segunda, ${SL.Clock.fmtDay(nextMon)})</span></div><div class="card stat"><b>${U.money(m.in.doacoes || 0)}</b><span>Repasses de doações no mês</span></div><div class="card stat"><b>${U.num(P.subs)}</b><span>Inscrições ativas (R$ 3,95 cada por mês)</span></div></div>
        <div class="card col"><h3>${P.afil ? ic('check', 16) + ' Você é afiliado(a)' : 'Programa de afiliados'}</h3>${P.afil ? '<p class="small muted">Seus espectadores podem se inscrever e você pode rodar anúncios durante a live (cada anúncio rende pela quantidade de pessoas, mas cansa o público).</p>' : req.map(([a, b, l]) => `<div class="attr">${l}<div class="bar"><i style="width:${Math.min(100, a / b * 100)}%"></i></div><b>${Math.floor(a)}/${b}</b></div>`).join('')}</div>
        <div class="card col"><h3>Parceria Pulso</h3><p class="small muted">Exige 15 mil seguidores, 150 horas de live e média de 75 pessoas. Libera 1440p e o selo de parceiro.</p>${[[P.f, 15000, 'seguidores'], [P.hours, 150, 'horas'], [G.ch.avgViewers.slice(-10).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(10, G.ch.avgViewers.length)), 75, 'média']].map(([a, b, l]) => `<div class="attr">${l}<div class="bar"><i style="width:${Math.min(100, a / b * 100)}%"></i></div><b>${U.num(a)}</b></div>`).join('')}</div>`;
    },
    act(a, ds, ctx, ev, t) {
      const st = ctx.st; const f = st.form; const G = SL.G;
      if (a === 'tab') { st.tab = ds.t; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'reopen') return SL.LiveUI.open();
      if (a === 'game') { const g = D.gameById(ds.g); const cs = SL.Equip.canStream(g, '480p'); if (!cs.ok) return cs.reason; f.game = ds.g; f.tags = f.tags.filter(x => SL.Algo.suggestTags(f.game).includes(x)); return ctx.render(); }
      if (a === 'idea') { f.title = U.pick(TITLE_IDEAS).replace('{g}', D.gameById(f.game).name); SL.Life.skillUp('marketing', 0.02); return ctx.render(); }
      if (a === 'tag') { const i = f.tags.indexOf(ds.v); if (i >= 0) f.tags.splice(i, 1); else if (f.tags.length < 6) f.tags.push(ds.v); return ctx.render(); }
      if (a === 'q') { f.quality = ds.v; return ctx.render(); }
      if (a === 'dur') { f.planned = +ds.v; return ctx.render(); }
      if (a === 'layout') { f.layout = ds.v; if (ds.v === 'sem') f.cam = false; else if (SL.Equip.stats().hasCam) f.cam = true; return ctx.render(); }
      if (a === 'cam') { f.cam = t.checked; return; }
      if (a === 'ann') { f.announce = t.checked; return; }
      if (a === 'collab') { f.collab = t.checked; return; }
      if (a === 'start') { const err = SL.LiveUI.start(f); if (err) return err; return; }
      if (a === 'cf') { st.cf = ds.v; return ctx.render(); }
      if (a === 'vsel') { st.sel = ds.v; return ctx.render(); }
      if (a === 'mkmod') { const e = SL.Live.makeMod(ds.v); if (e) return e; return ctx.render(); }
      if (a === 'unmod') { SL.Viewers.byId(ds.v).mod = 0; return ctx.render(); }
      if (a === 'unban') { SL.Viewers.byId(ds.v).ban = 0; return ctx.render(); }
      if (a === 'schd') { this._schd = +ds.v; $$('[data-act="schd"]', ctx.host).forEach(b => b.classList.toggle('on', b === t)); $('#sch-day', ctx.host).textContent = 'Dia escolhido: ' + SL.Clock.fmtDay(SL.Clock.day() + this._schd); return; }
      if (a === 'sch') { const d = this._schd || 0; const h = +ds.h; if (d === 0 && h <= SL.Clock.hour()) return 'Esse horário já passou hoje.'; SL.Social.scheduleLivePost(d, h); UI.toast({ title: 'Live agendada', text: SL.Clock.fmtDay(SL.Clock.day() + d) + ' às ' + h + 'h · anunciada no Connect', icon: 'calendar', cat: 'canal' }, 'success'); return ctx.render(); }
      void G;
    },
    input(target, ctx) {
      const st = ctx.st; if (target.dataset.f === 'title') { st.form.title = target.value; const ts = SL.Algo.titleScore(target.value, { game: st.form.game, kind: 'live' }); const box = target.closest('.field'); const bar = $('.bar i', box); bar.style.width = ts.score + '%'; bar.style.background = ts.score >= 65 ? 'var(--ok)' : ts.score >= 45 ? 'var(--warn)' : 'var(--bad)'; $('.bar + b', box).textContent = ts.score; $('.tiny', box).textContent = ts.notes.slice(0, 3).join(' · '); }
      if (target.dataset.f === 'desc') st.form.desc = target.value;
      if (target.dataset.f === 'q') { st.q = target.value; clearTimeout(st._qt); st._qt = setTimeout(() => { ctx.render(); const i = $('[data-f="q"]', ctx.host); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); }
    },
  };

  // ---------- estúdio ao vivo ----------
  const LUI = SL.LiveUI = {};
  let buf = [], lastStat = 0, pendSig = '', alertsShown = 0;
  LUI.start = f => {
    const G = SL.G;
    const opts = Object.assign({}, f);
    if (f.collab) { const id = Object.keys(G.rel).find(k => G.rel[k].plan && G.rel[k].plan.kind === 'collab'); if (id) opts.collabWith = id; }
    const err = SL.Live.start(opts); if (err) return err;
    if (opts.collabWith) LUI.setupCollab(opts.collabWith);
    LUI.open();
    return null;
  };
  LUI.setupCollab = id => {
    const L = SL.Live.cur; const G = SL.G; const r = G.rel[id]; const c = SL.Creators.state(id); const def = D.creatorById(id) || {};
    L.collab = id; r.plan = null; if (SL.Calendar) SL.Calendar.removeRef('plan_' + id);
    const partner = c ? Math.round(c.f.pulso * U.rf(0.02, 0.05)) : 30;
    for (let m = 0; m < 40; m++) L.anonPlan[m] = (L.anonPlan[m] || 0) + partner * (Math.exp(-m / 12) - Math.exp(-(m + 1) / 12));
    L.hype += 10; L.announced = true;
    const sayIt = SL.Chat.msg(null, 'Fala, galera do ' + G.player.channel + '! Bora fazer barulho hoje', { u: def.handle || id, c: '#4cc3ff', badges: ['verificado'] });
    L.chat.push(sayIt); SL.Live.queue.push({ at: performance.now() + 1500, msg: sayIt });
    L.collabChem = U.clamp(0.5 + (def.warm || 0.5) * 0.3 - (def.tox || 0) * 0.5 + r.aff / 300 + U.rf(-0.15, 0.15), 0, 1);
    SL.bus.on('live:end', function once(sum) {
      SL.bus.off('live:end', once);
      const good = L.collabChem > 0.45;
      r.aff = U.clamp(r.aff + (good ? 12 : -8), -100, 100); r.last = G.time.t; SL.Rel.updateStage(id); G.flags.collabDone = 1;
      if (c && good) { const gain = Math.round(sum.peak * 0.15 + c.f.pulso * 0.0015); G.ch.pulso.f += gain; SL.Rep.mod({ profissional: 3, popularidade: 1 }); SL.notify({ cat: 'canal', icon: 'users', title: 'Collab com ' + def.name + ' foi um sucesso', text: 'Química boa: +' + U.int(gain) + ' seguidores vindos do público dele(a).' }); }
      else if (c) { SL.Rep.mod({ profissional: -1 }); SL.notify({ cat: 'canal', icon: 'alert', title: 'A collab não rolou', text: 'Faltou química entre vocês. O público percebeu.' }); if (def.tox > 0.4 && U.chance(0.5)) SL.Events.trigger('critica_criador', { id, name: def.name, f: SL.Creators.total(c), hard: false }); }
      SL.Videos.addRaw({ kind: 'colab', game: L.game, minutes: sum.dur, quality: Math.round(sum.q * (good ? 1.1 : 0.85)), moments: L.best.slice(0, 6).map(m => ({ type: m.type, txt: m.txt, int: m.int, funny: m.funny, mt: m.mt, clip: m.clip })), title: 'Collab com ' + def.name });
    });
  };
  LUI.open = () => {
    const ov = $('#overlay-live'); ov.hidden = false; buf = []; pendSig = ''; alertsShown = 0;
    const L = SL.Live.cur; const G = SL.G;
    ov.innerHTML = `<div class="studio">
      <div class="live-main">
        <div class="live-top"><span class="onair"><i></i>AO VIVO</span><div class="ttl"><b class="ellipsis" id="lv-t"></b><small id="lv-g"></small></div>
          <div class="lstats"><div class="lstat v"><b id="ls-v">0</b><span>assistindo</span></div><div class="lstat"><b id="ls-f">+0</b><span>seguidores</span></div><div class="lstat"><b id="ls-s">0</b><span>inscrições</span></div><div class="lstat"><b id="ls-d">R$ 0</b><span>doações</span></div><div class="lstat"><b id="ls-t">0:00</b><span>no ar</span></div></div></div>
        <div class="preview-wrap"><div class="preview-box"><canvas id="lv-cv"></canvas><div class="alerts" id="lv-al"></div></div></div>
        <div class="meter-row"><div class="meter" title="Empolgação do chat">${ic('fire', 14)}<span>Empolgação</span><div class="bar"><i id="m-h"></i></div></div><div class="meter" title="Qualidade do conteúdo agora">${ic('star', 14)}<span>Conteúdo</span><div class="bar"><i id="m-c"></i></div></div><div class="meter" title="Qualidade técnica">${ic('cpu', 14)}<span>Técnica</span><div class="bar"><i id="m-t"></i></div></div><div class="meter" title="Sua energia">${ic('energy', 14)}<span>Você</span><div class="bar"><i id="m-e"></i></div></div><span id="m-issues" class="row gap4"></span></div>
        <div class="actions" id="lv-actions"></div>
      </div>
      <div class="live-side"><div class="sh">${ic('chat', 16)}<b class="grow">Chat</b><span class="tiny muted" id="lv-rate"></span></div><div class="chat" id="lv-chat"></div><div class="pending" id="lv-pend"></div>
        <form class="chat-input" id="lv-form"><input class="input" id="lv-in" maxlength="120" placeholder="Escrever no chat como ${esc(G.player.user)}" autocomplete="off"><button class="btn primary sm">${ic('send', 14)}</button></form></div>
    </div>`;
    $('#lv-t').textContent = L.title;
    LUI.actions();
    $('#lv-actions').onclick = LUI.actionClick;
    $('#lv-pend').onclick = LUI.pendClick;
    $('#lv-chat').onclick = e => { const m = e.target.closest('[data-m]'); if (m) LUI.msgPop(m.dataset.m, m); };
    $('#lv-form').onsubmit = e => { e.preventDefault(); const v = $('#lv-in').value.trim(); if (!v) return; $('#lv-in').value = ''; LUI.typed(v); };
  };
  LUI.close = () => { const ov = $('#overlay-live'); ov.hidden = true; ov.innerHTML = ''; };
  LUI.typed = text => {
    const L = SL.Live.cur; if (!L) return; L.silence = 0;
    const m = SL.Chat.streamer(text); L.chat.push(m); buf.push(m);
    L.hype = U.clamp(L.hype + 1.5, 0, 100);
    const low = text.toLowerCase();
    const named = [...L.present.values()].map(st => SL.Viewers.byId(st.id)).filter(Boolean).find(v => low.includes('@' + v.u) || low.includes(v.u));
    if (named) { const st = L.present.get(named.id); st.replied = true; st.repliedAt = L.min; st.sat = U.clamp(st.sat + 0.15, 0, 1); named.m.rep++; setTimeout(() => { if (SL.Live.cur && SL.Live.cur.present.has(named.id)) { const r = SL.Chat.say(named, 'react', SL.Live.ctx(), { kind: 'reply_got' }); if (r) { SL.Live.cur.chat.push(r); buf.push(r); } } }, 900); }
    else if (/\?$/.test(text)) SL.Live.reactAll('talk_ok', 0.25);
  };
  LUI.actions = () => {
    const L = SL.Live.cur; if (!L) return; const G = SL.G; const el = $('#lv-actions'); if (!el) return;
    const g = D.gameById(L.game); const contracts = SL.Sponsors.active();
    const sig = JSON.stringify([L.risky > 0, L.focus, !!L.poll, !!L.challenge, L.ev.mic, L.ev.net > 0, L.ev.paused, L.speed, L.followersOnly, contracts.length, G.ch.pulso.afil, !!(L.ev.celeb && !L.ev.celeb.greeted)]);
    if (el.dataset.sig === sig) return; el.dataset.sig = sig;
    const b = (k, label, icon, cls, title) => `<button class="btn ${cls || ''}" data-la="${k}" title="${esc(title || '')}">${ic(icon, 15)}${label}</button>`;
    el.innerHTML = `<div class="agroup">${b('talk', 'Conversar', 'chat', '', 'Puxa assunto com o chat (zera o silêncio)')}${b('joke', 'Piada', 'joke')}${b('poll', 'Enquete', 'poll', L.poll ? 'disabled' : '')}${b('schedule', 'Anunciar próxima live', 'calendar')}${L.ev.celeb && !L.ev.celeb.greeted ? b('celeb', 'Cumprimentar ' + L.ev.celeb.name, 'star', 'primary') : ''}</div>
      <div class="agroup">${g.nongame ? '' : b('risky', L.risky > 0 ? 'Arriscando' : 'Jogada arriscada', 'fire', L.risky > 0 ? 'primary' : '') + b('focus', L.focus ? 'Focado' : 'Focar no jogo', 'target', L.focus ? 'primary' : '')}${b('challenge', 'Desafio', 'trophy', L.challenge ? 'disabled' : '')}${b('game', 'Trocar de jogo', 'gamepad')}${b('pause', L.ev.paused ? 'Em pausa' : 'Pausa (10 min)', 'clock', L.ev.paused ? 'disabled' : '')}</div>
      <div class="agroup">${contracts.length ? b('sponsor', 'Mencionar patrocinador', 'brief') : ''}${G.ch.pulso.afil ? b('ad', 'Rodar anúncio', 'ads') : ''}${b('fonly', L.followersOnly ? 'Só seguidores: ligado' : 'Chat só para seguidores', 'shield', L.followersOnly ? 'primary' : '')}${L.ev.mic ? b('mic', 'Arrumar microfone', 'mic', 'danger') : ''}${L.ev.net > 0 ? b('netq', 'Baixar qualidade', 'wifiOff', 'danger') + b('netr', 'Reiniciar roteador', 'refresh', 'danger') : ''}
        <span class="grow"></span><span class="row gap4">${[[1, '½x'], [2, '1x'], [3, '2,5x']].map(([s, l]) => `<button class="btn sm ${L.speed === s ? 'primary' : 'ghost'}" data-la="speed" data-s="${s}">${l}</button>`).join('')}</span>${b('end', 'Encerrar live', 'stop', 'live')}</div>`;
  };
  const menu = (anchor, title, items) => {
    const r = anchor.getBoundingClientRect(); const host = $('#overlay-live');
    const m = document.createElement('div'); m.className = 'ctx'; m.style.position = 'fixed';
    m.innerHTML = `<h4>${esc(title)}</h4>` + items.map((it, i) => `<button class="opt" data-i="${i}" ${it.disabled ? 'disabled' : ''}>${ic(it.icon || 'chevR', 15)}<span>${esc(it.label)}${it.desc ? '<span class="why" style="color:var(--muted)">' + esc(it.desc) + '</span>' : ''}</span></button>`).join('');
    host.appendChild(m); m.style.left = Math.min(r.left, innerWidth - m.offsetWidth - 10) + 'px'; m.style.top = Math.max(10, r.top - m.offsetHeight - 6) + 'px';
    const close = () => { m.remove(); document.removeEventListener('mousedown', out); };
    const out = e => { if (!m.contains(e.target)) close(); };
    setTimeout(() => document.addEventListener('mousedown', out), 0);
    $$('.opt', m).forEach(o => o.onclick = () => { close(); const res = items[+o.dataset.i].fn(); if (typeof res === 'string') UI.err(res); LUI.actions(); });
  };
  LUI.actionClick = e => {
    const t = e.target.closest('[data-la]'); if (!t) return; const LVs = SL.Live; const L = LVs.cur; if (!L) return; const k = t.dataset.la;
    SL.audio.play('click');
    if (k === 'talk') return menu(t, 'Conversar sobre...', LVs.TALKS.map(x => ({ label: x.label, icon: x.icon, fn: () => LVs.talk(x.id) })));
    if (k === 'joke') LVs.joke();
    if (k === 'poll') return menu(t, 'Criar enquete', LVs.POLLS.map(p => ({ label: p.q, icon: 'poll', fn: () => LVs.poll(p.id) })));
    if (k === 'schedule') return menu(t, 'Próxima live', [[1, 20], [1, 21], [2, 20], [3, 20]].map(([d, h]) => ({ label: (d === 1 ? 'Amanhã' : SL.Clock.fmtDay(SL.Clock.day() + d)) + ' às ' + h + 'h', icon: 'calendar', desc: 'Vira promessa para quem está aqui', fn: () => { LVs.scheduleNext(d, h); } })));
    if (k === 'celeb') LVs.greetCeleb();
    if (k === 'risky') LVs.toggleRisky();
    if (k === 'focus') LVs.toggleFocus();
    if (k === 'challenge') return menu(t, 'Desafio', LVs.CHALLENGES.map(c => ({ label: c.label, desc: c.desc, icon: 'trophy', fn: () => LVs.challenge(c.id) })));
    if (k === 'game') return menu(t, 'Trocar para', D.games.filter(x => x.id !== L.game).map(x => { const cs = SL.Equip.canStream(x, L.quality); return { label: x.name, desc: cs.ok ? x.cat : cs.reason, icon: 'gamepad', disabled: !cs.ok, fn: () => { const r = LVs.changeGame(x.id); $('#lv-g').textContent = ''; return r; } }; }));
    if (k === 'pause') LVs.pause();
    if (k === 'sponsor') return menu(t, 'Patrocinador', SL.Sponsors.active().map(c => { const b = D.brandById(c.brand); const d = c.deliv.find(x => x.k === 'live'); return { label: b.name, desc: d ? d.done + '/' + d.n + ' menções · mínimo ' + d.minV + ' pessoas' : 'sem menções no contrato', icon: 'brief', disabled: !d || d.done >= d.n, fn: () => LVs.sponsor(c.id) }; }));
    if (k === 'ad') { const r = LVs.ad(); if (r) UI.err(r); }
    if (k === 'fonly') LVs.toggleFollowersOnly();
    if (k === 'mic') LVs.fixMic();
    if (k === 'netq') LVs.fixNet('qualidade');
    if (k === 'netr') LVs.fixNet('roteador');
    if (k === 'speed') LVs.setSpeed(+t.dataset.s);
    if (k === 'end') return UI.confirm('Encerrar a live?', 'O resumo da transmissão vai aparecer em seguida.', () => LUI.finish(), 'Encerrar', true);
    LUI.actions();
  };
  LUI.finish = reason => { const vis = !$('#overlay-live').hidden; const sum = SL.Live.end(reason); if (sum && !vis) LUI.summary(sum); };
  SL.bus.on('live:end', sum => { if (!$('#overlay-live').hidden) { LUI.close(); LUI.summary(sum); } });

  // perguntas, recém-chegados e doações para responder
  LUI.pending = () => {
    const L = SL.Live.cur; const el = $('#lv-pend'); if (!L || !el) return;
    const qs = L.questions.filter(q => !q.done).slice(-4);
    const nc = L.newcomers.filter(n => !L.att.get(n.vid) || !L.att.get(n.vid).welcomed).slice(-3);
    const dons = L.donations.filter(d => !d.thanked).slice(-5);
    const sig = JSON.stringify([qs.map(q => q.msgId), nc.map(n => n.vid), dons.map(d => d.msgId), L.poll && L.poll.votes, L.challenge && L.challenge.label]);
    if (sig === pendSig) return; pendSig = sig;
    let h = '';
    if (L.poll) { const tot = L.poll.votes.reduce((a, b) => a + b, 0) || 1; h += `<div class="pq"><b class="small">${ic('poll', 13)} ${esc(L.poll.q)}</b>${L.poll.opts.map((o, i) => `<div class="pollbar"><i style="width:${L.poll.votes[i] / tot * 100}%"></i><span>${esc(o)} · ${Math.round(L.poll.votes[i] / tot * 100)}%</span></div>`).join('')}</div>`; }
    if (L.challenge) h += `<div class="pq"><b class="small">${ic('trophy', 13)} Desafio: ${esc(L.challenge.label)}</b><span class="tiny muted">até ${U.dur(Math.max(0, L.challenge.until - L.min))}</span></div>`;
    if (dons.length) h += `<div class="pq"><div class="row"><b class="small ok grow">${ic('gift', 13)} ${dons.length} doaç${dons.length > 1 ? 'ões' : 'ão'} sem agradecer</b><button class="btn sm ok" data-pa="thankall">Agradecer</button></div><div class="tiny muted">${dons.map(d => '@' + esc(d.u) + ' ' + U.money(d.amount)).join(' · ')}</div></div>`;
    nc.forEach(n => { const v = SL.Viewers.byId(n.vid); if (v) h += `<div class="pq"><div class="row"><span class="grow small"><span class="who" style="color:${v.c}">@${esc(v.u)}</span> chegou pela primeira vez</span><button class="btn sm" data-pa="welcome" data-v="${v.id}">Dar boas-vindas</button></div></div>`; });
    qs.forEach(q => { const v = SL.Viewers.byId(q.vid); if (!v) return; h += `<div class="pq"><div><span class="who" style="color:${v.c}">@${esc(v.u)}</span> <span class="tiny muted">(${esc(SL.Viewers.label(v))})</span></div><div>${SL.Chat.html(q.text)}</div><div class="row wrap">${(SL.Chat.ANSWERS[q.type] || []).map(o => `<button class="btn sm" data-pa="ans" data-m="${q.msgId}" data-o="${o.id}">${esc(o.label)}</button>`).join('')}</div></div>`; });
    el.innerHTML = h || `<div class="tiny muted center" style="padding:6px">Perguntas, recém-chegados e doações aparecem aqui.</div>`;
  };
  LUI.pendClick = e => {
    const b = e.target.closest('[data-pa]'); if (!b) return; SL.audio.play('click'); const LVs = SL.Live;
    if (b.dataset.pa === 'ans') LVs.answer(b.dataset.m, b.dataset.o);
    if (b.dataset.pa === 'welcome') LVs.welcome(b.dataset.v);
    if (b.dataset.pa === 'thankall') LVs.thank('all');
    pendSig = ''; LUI.pending();
  };
  LUI.msgPop = (mid, node) => {
    const L = SL.Live.cur; if (!L) return; const m = L.chat.find(x => x.id === mid); $$('.viewer-pop').forEach(x => x.remove());
    if (!m || !m.vid) return; const v = SL.Viewers.byId(m.vid); if (!v) return;
    const pop = document.createElement('div'); pop.className = 'viewer-pop'; const side = $('.live-side');
    const q = L.questions.find(x => x.msgId === mid && !x.done); const isNew = L.newcomers.some(n => n.vid === v.id); const don = L.donations.find(d => d.msgId === mid && !d.thanked);
    pop.innerHTML = `<div class="row"><span class="ava" style="width:34px;height:34px;font-size:15px;background:${v.c}">${esc(v.u[0].toUpperCase())}</span><div class="grow"><b style="color:${v.c}">@${esc(v.u)}</b><div class="tiny muted">${esc(SL.Viewers.label(v))} · ${v.m.v} visitas · parece ${esc((D.archetypes[v.a] || {}).label || '').toLowerCase()}</div></div><button class="ibtn" data-x>${ic('x', 14)}</button></div>
      <div class="relbar">Fidelidade<div class="bar"><i style="width:${v.loy}%"></i></div><b>${Math.round(v.loy)}</b></div>
      ${v.m.notes.length ? v.m.notes.slice(-2).map(n => `<div class="memo">${esc(SL.Chat.fill(SL.Viewers.noteText(n), v, {}))}</div>`).join('') : '<div class="tiny muted">Sem lembranças marcantes ainda.</div>'}
      <div class="col gap4">${q ? (SL.Chat.ANSWERS[q.type] || []).map(o => `<button class="btn sm" data-p="ans" data-o="${o.id}">${esc(o.label)}</button>`).join('') : ''}${don ? `<button class="btn sm ok" data-p="thank">Agradecer a doação</button>` : ''}${isNew ? `<button class="btn sm" data-p="welcome">Dar boas-vindas</button>` : ''}<button class="btn sm" data-p="read">Ler em voz alta</button>
      <div class="row"><button class="btn sm grow" data-p="timeout">Silenciar 10 min</button><button class="btn sm danger grow" data-p="ban">Banir</button></div>${v.mod ? '' : `<button class="btn sm ghost" data-p="mod">${ic('shield', 13)} Tornar moderador(a)</button>`}</div>`;
    side.appendChild(pop); const r = node.getBoundingClientRect(), sr = side.getBoundingClientRect();
    pop.style.left = '10px'; pop.style.top = Math.max(8, Math.min(r.top - sr.top, side.clientHeight - pop.offsetHeight - 8)) + 'px';
    pop.onclick = ev => {
      const b = ev.target.closest('[data-p],[data-x]'); if (!b) return; const k = b.dataset.p; const LVs = SL.Live;
      if (k === 'ans') LVs.answer(mid, b.dataset.o); if (k === 'thank') LVs.thank(mid); if (k === 'welcome') LVs.welcome(v.id); if (k === 'read') LVs.read(mid);
      if (k === 'timeout') LVs.ban(v.id, true); if (k === 'ban') LVs.ban(v.id, false); if (k === 'mod') UI.err(LVs.makeMod(v.id));
      pop.remove(); pendSig = ''; LUI.pending();
    };
  };

  // laço do estúdio (chamado pelo laço principal)
  LUI.frame = tSec => {
    const L = SL.Live.cur; if (!L || $('#overlay-live').hidden) return;
    const cv = $('#lv-cv'); if (cv) SL.Preview.live(cv, L, tSec);
    // chat com limite de mensagens por segundo
    const fresh = SL.Live.flush(); if (fresh.length) buf.push(...fresh);
    const cap = (SL.settings.chatCap || 6);
    const now = performance.now(); LUI._acc = (LUI._acc || 0) + (now - (LUI._last || now)) / 1000 * cap; LUI._last = now;
    if (buf.length > 60) buf = buf.filter((m, i) => i >= buf.length - 40 || m.kind !== 'msg' || m.q);
    const chat = $('#lv-chat');
    if (chat && buf.length && LUI._acc >= 1) {
      const n = Math.min(buf.length, Math.floor(LUI._acc)); LUI._acc -= n;
      const nearBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 60;
      const frag = document.createElement('div'); frag.innerHTML = buf.splice(0, n).map(msgHTML).join('');
      while (frag.firstChild) chat.appendChild(frag.firstChild);
      while (chat.children.length > 160) chat.firstChild.remove();
      if (nearBottom) chat.scrollTop = chat.scrollHeight;
    }
    if (LUI._acc > cap * 2) LUI._acc = cap * 2;
    // alertas animados
    const al = $('#lv-al');
    if (al && L.alerts.length > alertsShown) {
      const list = L.alerts.slice(alertsShown); alertsShown = L.alerts.length;
      list.slice(-3).forEach(a => { const d = document.createElement('div'); d.className = 'lalert ' + a.k; d.innerHTML = a.k === 'follow' ? ic('follow', 16) + '@' + esc(a.u) + ' seguiu!' : a.k === 'sub' ? ic('sub', 16) + '@' + esc(a.u) + ' se inscreveu!' : ic('gift', 16) + '@' + esc(a.u) + ' doou ' + U.money(a.amount); al.appendChild(d); setTimeout(() => d.remove(), 4000); });
      while (al.children.length > 3) al.firstChild.remove();
    }
    if (now - lastStat > 250) {
      lastStat = now; const G = SL.G;
      $('#ls-v').textContent = U.int(L.viewers); $('#ls-f').textContent = '+' + U.int(L.stats.fol); $('#ls-s').textContent = U.int(L.stats.subs); $('#ls-d').textContent = U.money0(L.stats.don);
      $('#ls-t').textContent = Math.floor(L.min / 60) + ':' + String(L.min % 60).padStart(2, '0');
      $('#lv-g').textContent = D.gameById(L.game).name + ' · ' + SL.GameSim.status(L.sim);
      const setBar = (id, v, col) => { const b = $(id); if (b) { b.style.width = U.clamp(v, 0, 100) + '%'; if (col) b.style.background = col; } };
      setBar('#m-h', L.hype, '#ff7a1a'); setBar('#m-c', L.contentQ, '#8b5cf6'); setBar('#m-t', L.tech.overall, L.tech.overall < 40 ? 'var(--bad)' : '#4cc3ff'); setBar('#m-e', Math.min(G.needs.energia, G.needs.sono), '#ffe066');
      const iss = []; if (L.silence > 6) iss.push(ic('micOff', 13) + ' Você está quieto(a) há ' + L.silence + ' min'); if (L.ev.mic) iss.push(ic('mic', 13) + ' Sem áudio'); if (L.ev.net > 0) iss.push(ic('wifiOff', 13) + ' Rede instável'); if (L.tech.fps < 0.8) iss.push(ic('cpu', 13) + ' PC no limite'); if (L.trolls.size) iss.push(ic('alert', 13) + ' Troll no chat'); if (G.needs.sede < 20 || G.needs.fome < 20) iss.push(ic('food', 13) + ' Fome/sede: faça uma pausa');
      const ie = $('#m-issues'); const ih = iss.map(x => `<span class="issue">${SL.Chat.fill(x, null, {})}</span>`).join(''); if (ie.dataset.h !== ih) { ie.innerHTML = ih; ie.dataset.h = ih; }
      $('#lv-rate').textContent = L.stats.msgs ? Math.round(L.stats.msgs / Math.max(1, L.min)) + ' msgs/min' : '';
      LUI.pending(); LUI.actions();
    }
  };

  LUI.summary = s => {
    const G = SL.G; const g = D.gameById(s.game);
    const raw = G.raw.find(r => r.live === s.id);
    const m = UI.modal({ title: s.reason === 'sono' ? 'Você dormiu ao vivo!' : s.reason === 'saude' ? 'A live acabou: você passou mal' : 'Resumo da transmissão', icon: 'live', wide: true, sub: g.name + ' · ' + U.dur(s.dur) + (s.record ? ' · NOVO RECORDE' : ''), html: `
      <div class="sum-grid"><div class="card stat"><b>${U.int(s.peak)}</b><span>Pico de público</span></div><div class="card stat"><b>${s.avg}</b><span>Média</span></div><div class="card stat"><b class="ok">+${U.int(s.fol)}</b><span>Novos seguidores</span></div><div class="card stat"><b>${U.int(s.uniq)}</b><span>Pessoas diferentes</span></div>
      <div class="card stat"><b>${U.int(s.subs)}</b><span>Inscrições</span></div><div class="card stat"><b class="ok">${U.money(s.don)}</b><span>Doações (${s.donN})</span></div><div class="card stat"><b>${U.int(s.msgs)}</b><span>Mensagens no chat</span></div><div class="card stat"><b>${s.q}</b><span>Qualidade média</span></div></div>
      <div class="card"><div class="section-t"><h3>Público e empolgação</h3><span class="tiny muted"><span style="color:#ff4d5e">pessoas</span> · <span style="color:#ffb547">empolgação</span></span></div><canvas class="chart" id="sum-ch"></canvas></div>
      <div class="card col"><h3>Melhores momentos</h3>${s.best.length ? s.best.map((b, i) => `<div class="row"><span class="acc">${ic('scissors', 15)}</span><span class="grow small">${esc(b.txt)}</span><div class="bar" style="width:70px"><i style="width:${b.clip * 100}%"></i></div>${raw ? `<button class="btn sm" data-cut="${i}">Criar corte</button>` : ''}</div>`).join('') : '<div class="small muted">Nenhum momento forte o bastante para virar corte.</div>'}
      ${s.adRev ? `<div class="small muted">Anúncios renderam ${U.money(s.adRev)}.</div>` : ''}${s.promises ? `<div class="small warn">${s.promises} promessa(s) feita(s) nesta live. Cumpra para manter a confiança.</div>` : ''}${s.raid ? `<div class="small acc">${U.int(s.raid)} pessoas chegaram por raid ou vídeo bombando.</div>` : ''}</div>
      <p class="tiny muted">Doações, inscrições e anúncios caem no saldo da Pulso e são repassados toda segunda-feira.</p>`, buttons: [{ label: 'Fechar', cls: 'primary' }] });
    UI.chart($('#sum-ch', m.el), [{ data: s.graph, color: '#ff4d5e' }, { data: s.hype, color: '#ffb547', fill: false }]);
    $$('[data-cut]', m.el).forEach(b => b.onclick = () => { m.close(); UI.openApp('estudio', { raw: raw.id, moment: +b.dataset.cut, type: 'short' }); });
  };
})(window.SL);

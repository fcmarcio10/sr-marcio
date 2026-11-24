/* App OBS Studio: preparar a live, estúdio ao vivo, painel do canal, comunidade, agenda e monetização. */
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
    if (m.kind === 'mod') return `<div class="cm mod" data-m="${m.id}"><span class="modtag">${ic('shield', 11)} MOD</span><span class="u" style="color:${m.c || '#22c55e'}">${esc(m.u || 'Bigode')}:</span> ${m.html}</div>`;
    if (m.kind === 'donation') { const cor = m.amount >= 100 ? 'r' : m.amount >= 50 ? 'o' : m.amount >= 20 ? 'y' : m.amount >= 10 ? 't' : 'a'; return `<div class="cm superchat sc-${cor}" data-m="${m.id}"><div class="sc-h"><b>${esc(m.u)}</b><span>${U.money(m.amount)}</span>${m.sc ? `<i class="sc-voz" title="Lido em voz alta">${ic('megaphone', 12)}</i>` : ''}</div>${m.raw ? `<div class="sc-b">${m.html}</div>` : ''}</div>`; }
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
    title: 'OBS Studio', short: 'OBS', icon: 'pulso', color: 'linear-gradient(135deg,#4a4658,#1c1a24)', order: 1, pc: true, phone: false, w: 1040, h: 680,
    watch: ['live:end', 'promises', 'tick:hour', 'equip', 'videos'],
    render(el, ctx) {
      const st = ctx.st; st.tab = st.tab || (ctx.args && ctx.args.tab) || 'transmitir';
      const tabs = [['transmitir', 'Transmitir', 'live'], ['painel', 'Painel', 'stats'], ['comunidade', 'Comunidade', 'users'], ['agenda', 'Agenda', 'calendar'], ['monetizacao', 'Monetização', 'money']];
      el.innerHTML = `<div class="app"><div class="app-head"><div class="brandbar"><span class="bl" style="background:#8b5cf6">${ic('pulso', 15)}</span>OBS Studio</div><div class="tabs">${tabs.map(([k, l, i]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${ic(i, 14)}${l}</button>`).join('')}</div></div><div class="app-body">${this[st.tab](ctx)}</div></div>`;
      if (st.tab === 'painel') { const cv = $('#pl-chart', el); if (cv) UI.chart(cv, [{ data: SL.G.lives.slice(-20).map(l => l.avg), color: '#8b5cf6' }, { data: SL.G.lives.slice(-20).map(l => l.peak), color: '#ff4d5e', fill: false }], { labels: SL.G.lives.slice(-20).map(l => SL.Clock.fmtDay(SL.Clock.day(l.t0)).slice(5)) }); }
    },
    transmitir(ctx) {
      const G = SL.G; const st = ctx.st;
      const f = st.form = st.form || { game: st.pendingGame || G.ch.catHist && SL.Creators.playerMainGame() || 'conversa', title: '', desc: '', tags: [], quality: '720p', planned: 120, cam: SL.Equip.stats().hasCam, layout: 'classico', announce: true };
      if (LV().cur) return `<div class="empty">${ic('live', 40)}<p>Você está ao vivo agora.</p><button class="btn live" data-act="reopen">Voltar para a live</button></div>`;
      const g = D.gameById(f.game); const ts = SL.Algo.titleScore(f.title, { game: f.game, kind: 'live' });
      const q = SL.Equip.streamQuality(g, f.quality, f.cam, {});
      const comp = SL.Algo.competitors(f.game); const pr = predict(f);
      const collab = Object.keys(G.rel).find(id => { const r = G.rel[id]; return r.plan && r.plan.kind === 'collab' && Math.abs(G.time.t - r.plan.t) <= 120; });
      const sched = G.ch.schedule.find(s => !s.done && s.day === SL.Clock.day() && Math.abs(s.hour - SL.Clock.hourF()) <= 1.6);
      return `<div class="go-bar"><div class="grow"><b>${esc(g.name)}</b><small>${f.title ? esc(f.title) : 'Escolha um título para a live'} · ${f.quality} · ${U.dur(f.planned)}</small></div><button class="btn live lg" data-act="start">${ic('live', 18)} Entrar ao vivo</button></div>
      <div class="live-setup">
        <div class="col gap16">
          ${collab ? `<div class="card" style="border-color:var(--info)"><div class="row"><span class="acc">${ic('users', 18)}</span><b class="grow">Collab agendada com ${esc(SL.Rel.name(collab))}</b><label class="row small"><input type="checkbox" data-act="collab" ${f.collab ? 'checked' : ''}> Fazer agora</label></div></div>` : ''}
          ${sched ? `<div class="card" style="border-color:var(--ok)"><b class="small">${ic('calendar', 14)} Esta live estava agendada: seus seguidores estão esperando.</b></div>` : ''}
          <div class="col"><div class="section-t"><h3>Jogo ou categoria</h3><span class="tiny muted">Tendência e concorrência mudam todo dia</span></div>
          <div class="game-pick">${D.games.map(x => { const cs = SL.Equip.canStream(x, '480p'); const tm = SL.Algo.trendMul(x.id); const cp = SL.Algo.competitors(x.id); const ql = SL.Equip.streamQuality(x, f.quality, f.cam, {}); return `<button class="gp ${f.game === x.id ? 'on' : ''} ${cs.ok ? '' : 'no'}" data-act="game" data-g="${x.id}" title="${esc(cs.ok ? x.cat : cs.reason)}"><span class="gc" style="background:${x.color}"></span><b>${esc(x.name)}</b><small>${esc(x.cat)} · ${tm > 1.12 ? '<span class="ok">em alta</span>' : tm < 0.88 ? '<span class="bad">em baixa</span>' : 'estável'}</small><small class="gp-pc">${cs.ok ? (ql.fps < 0.8 ? '<i class="dot warn"></i>PC no limite' : '<i class="dot ok"></i>roda bem') : '<i class="dot bad"></i>' + esc(cs.reason || 'indisponível')}</small></button>`; }).join('')}</div></div>
          <div class="field"><label for="lv-title">Título da live</label><div class="row"><input id="lv-title" class="input" maxlength="90" value="${esc(f.title)}" data-f="title" placeholder="Ex.: Primeira vez no ${esc(g.name)}!"><button class="btn sm" data-act="idea">${ic('sparkle', 14)} Ideia</button></div>
            <div class="row small"><div class="bar grow"><i style="width:${ts.score}%;background:${ts.score >= 65 ? 'var(--ok)' : ts.score >= 45 ? 'var(--warn)' : 'var(--bad)'}"></i></div><b class="mono">${ts.score}</b></div><div class="tiny muted">${ts.notes.slice(0, 3).map(esc).join(' · ')}</div></div>
        </div>
        <div class="col gap16">
          <div class="card col"><h3>Transmissão</h3>
            <div class="field"><label>Qualidade</label><div class="row wrap">${Object.keys(SL.Equip.PRESETS).map(k => `<button class="chip ${f.quality === k ? 'on' : ''}" data-act="q" data-v="${k}">${k}</button>`).join('')}</div></div>
            <div class="field"><label>Duração planejada</label><div class="row wrap">${[60, 120, 180, 240].map(m => `<button class="chip ${f.planned === m ? 'on' : ''}" data-act="dur" data-v="${m}">${U.dur(m)}</button>`).join('')}</div></div>
            <label class="row small"><input type="checkbox" data-act="cam" ${f.cam ? 'checked' : ''} ${SL.Equip.stats().hasCam ? '' : 'disabled'}> Webcam ligada ${SL.Equip.stats().hasCam ? '' : '<span class="muted">(sem webcam)</span>'}</label>
            <label class="row small"><input type="checkbox" data-act="ann" ${f.announce ? 'checked' : ''}> Divulgar no Instagram ao começar</label>
          </div>
          <div class="card col"><h3>Antes de entrar</h3>
            <div class="row small"><span class="dot ${q.fps < 0.8 || q.netOk < 0.85 ? 'warn' : 'ok'}"></span><span class="grow">${q.issues.length ? q.issues.map(i => ({ lag: 'Seu PC está no limite: pode travar.', rede: 'Sua internet não aguenta essa qualidade.', cam: 'Câmera escura ou ruim.', mic: 'Sem microfone.' })[i]).join(' ') : 'Tudo certo para transmitir.'}</span></div>
            <div class="row small"><span class="dot ok"></span><span class="grow">Público esperado: <b>${pr ? pr[0] + ' a ' + pr[1] : '?'}</b> pessoas</span></div>
            ${(() => { const bz = SL.Videos.buzz(); return bz.k > 0.04 ? `<div class="row small"><span class="dot ok"></span><span class="grow">Seu vídeo no ${bz.plat} vai trazer gente nova.</span></div>` : `<div class="row small"><span class="dot"></span><span class="grow muted">Postar um vídeo ou corte antes traz mais gente.</span></div>`; })()}
            ${(() => { const hoje = G.ch.schedule.find(x => !x.done && x.day === SL.Clock.day()); return hoje ? `<div class="row small"><span class="dot ${Math.abs(hoje.hour - SL.Clock.hourF()) <= 1.6 ? 'ok' : 'warn'}"></span><span class="grow">Live marcada hoje às ${hoje.hour}h${Math.abs(hoje.hour - SL.Clock.hourF()) <= 1.6 ? ': é agora, o público está esperando.' : '.'}</span></div>` : ''; })()}
          </div>
        </div></div>`;
    },
    painel() {
      const G = SL.G; const P = G.ch.pulso; const lives = G.lives.slice().reverse();
      const av = G.ch.avgViewers.slice(-10); const avg = av.length ? av.reduce((a, b) => a + b, 0) / av.length : 0;
      return `<div class="statrow"><div class="card stat"><b>${U.num(P.f)}</b><span>Seguidores na Twitch</span></div><div class="card stat"><b>${U.num(P.subs)}</b><span>Inscritos ativos</span></div><div class="card stat"><b>${U.int(avg * 10) / 10 || 0}</b><span>Média (últimas 10 lives)</span></div><div class="card stat"><b>${U.num(P.peak)}</b><span>Recorde de público</span></div><div class="card stat"><b>${Math.round(P.hours)}h</b><span>Horas transmitidas</span></div><div class="card stat"><b>${P.parc ? 'Parceiro' : P.afil ? 'Afiliado' : 'Iniciante'}</b><span>Status na Twitch</span></div></div>
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
      return `<div class="card col"><h3>Agendar uma live</h3><p class="small muted">Agendar avisa os seguidores (post no Instagram) e aumenta o público. Faltar quebra a confiança.</p>
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
        <div class="card col"><h3>Parceria Twitch</h3><p class="small muted">Exige 15 mil seguidores, 150 horas de live e média de 75 pessoas. Libera 1440p e o selo de parceiro.</p>${[[P.f, 15000, 'seguidores'], [P.hours, 150, 'horas'], [G.ch.avgViewers.slice(-10).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(10, G.ch.avgViewers.length)), 75, 'média']].map(([a, b, l]) => `<div class="attr">${l}<div class="bar"><i style="width:${Math.min(100, a / b * 100)}%"></i></div><b>${U.num(a)}</b></div>`).join('')}</div>`;
    },
    act(a, ds, ctx, ev, t) {
      const st = ctx.st; const f = st.form; const G = SL.G;
      if (a === 'tab') { st.tab = ds.t; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'reopen') return SL.LiveUI.restore();
      if (a === 'game') { const g = D.gameById(ds.g); const cs = SL.Equip.canStream(g, '480p'); if (!cs.ok) return cs.reason; f.game = ds.g; f.tags = f.tags.filter(x => SL.Algo.suggestTags(f.game).includes(x)); return ctx.render(); }
      if (a === 'idea') { f.title = U.pick(TITLE_IDEAS).replace('{g}', D.gameById(f.game).name); SL.Life.skillUp('marketing', 0.02); return ctx.render(); }
      if (a === 'tag') { const i = f.tags.indexOf(ds.v); if (i >= 0) f.tags.splice(i, 1); else if (f.tags.length < 6) f.tags.push(ds.v); return ctx.render(); }
      if (a === 'q') { f.quality = ds.v; return ctx.render(); }
      if (a === 'dur') { f.planned = +ds.v; return ctx.render(); }
      if (a === 'layout') { f.layout = ds.v; if (ds.v === 'sem') f.cam = false; else if (SL.Equip.stats().hasCam) f.cam = true; return ctx.render(); }
      if (a === 'cam') { f.cam = t.checked; return; }
      if (a === 'ann') { f.announce = t.checked; return; }
      if (a === 'collab') { f.collab = t.checked; return; }
      if (a === 'start') { if (!f.title || f.title.trim().length < 3) f.title = U.pick(TITLE_IDEAS).replace('{g}', D.gameById(f.game).name); const err = SL.LiveUI.start(f); if (err) { ctx.render(); return err; } return; }
      if (a === 'cf') { st.cf = ds.v; return ctx.render(); }
      if (a === 'vsel') { st.sel = ds.v; return ctx.render(); }
      if (a === 'mkmod') { const e = SL.Live.makeMod(ds.v); if (e) return e; return ctx.render(); }
      if (a === 'unmod') { SL.Viewers.byId(ds.v).mod = 0; return ctx.render(); }
      if (a === 'unban') { SL.Viewers.byId(ds.v).ban = 0; return ctx.render(); }
      if (a === 'schd') { this._schd = +ds.v; $$('[data-act="schd"]', ctx.host).forEach(b => b.classList.toggle('on', b === t)); $('#sch-day', ctx.host).textContent = 'Dia escolhido: ' + SL.Clock.fmtDay(SL.Clock.day() + this._schd); return; }
      if (a === 'sch') { const d = this._schd || 0; const h = +ds.h; if (d === 0 && h <= SL.Clock.hour()) return 'Esse horário já passou hoje.'; SL.Social.scheduleLivePost(d, h); UI.toast({ title: 'Live agendada', text: SL.Clock.fmtDay(SL.Clock.day() + d) + ' às ' + h + 'h · anunciada no Instagram', icon: 'calendar', cat: 'canal' }, 'success'); return ctx.render(); }
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
    LUI.open(); UI.renderTaskbar();
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
    if (!UI.pcOpen()) UI.openPC();
    const tz = document.getElementById('toasts'); if (tz) tz.innerHTML = '';
    const ov = $('#overlay-live'); ov.hidden = false; buf = []; pendSig = ''; alertsShown = 0; LUI._aq = []; LUI._aqT = 0; LUI.minimized = false; document.body.classList.add('live-open');
    const L = SL.Live.cur; const G = SL.G;
    ov.innerHTML = `<div class="studio">
      <div class="live-main">
        <div class="live-top"><span class="onair"><i></i>AO VIVO</span><div class="ttl"><b class="ellipsis" id="lv-t"></b><small id="lv-g"></small></div>
          <div class="lstats"><div class="lstat v"><b id="ls-v">0</b><span>assistindo</span></div><div class="lstat"><b id="ls-f">+0</b><span>seguidores</span></div><div class="lstat"><b id="ls-s">0</b><span>inscrições</span></div><div class="lstat"><b id="ls-d">R$ 0</b><span>doações</span></div><div class="lstat"><b id="ls-t">0:00</b><span>no ar</span></div></div><div class="lctl" id="lv-ctl"></div></div>
        <div class="preview-wrap" id="lv-wrap"><div class="preview-box" id="lv-box"><canvas id="lv-cv"></canvas><div class="alerts" id="lv-al"></div></div></div>
        <div class="meter-row"><div class="meter" title="Empolgação do chat">${ic('fire', 14)}<span>Empolgação</span><div class="bar"><i id="m-h"></i></div></div><div class="meter" title="Qualidade do conteúdo agora">${ic('star', 14)}<span>Conteúdo</span><div class="bar"><i id="m-c"></i></div></div><div class="meter" title="Qualidade técnica">${ic('cpu', 14)}<span>Técnica</span><div class="bar"><i id="m-t"></i></div></div><div class="meter" title="Sua energia">${ic('energy', 14)}<span>Você</span><div class="bar"><i id="m-e"></i></div></div><span id="m-issues" class="row gap4"></span></div>
      </div>
      <div class="live-side"><div class="sh">${ic('chat', 16)}<b class="grow">Chat</b><span class="tiny muted" id="lv-rate"></span></div><div class="actions" id="lv-actions"></div><div class="chat-tip tiny muted">O Bigode (moderador) cuida do chat. Clique num comentário só se quiser responder.</div><div class="chat" id="lv-chat"></div><div class="pending" id="lv-pend"></div>
        <form class="chat-input" id="lv-form"><input class="input" id="lv-in" maxlength="120" placeholder="Escrever no chat como ${esc(G.player.user)}" autocomplete="off"><button class="btn primary sm">${ic('send', 14)}</button></form></div>
    </div>`;
    $('#lv-t').textContent = L.title;
    // voltando para a live (ou reabrindo a janela): o chat continua de onde estava
    { const fila = new Set(SL.Live.queue.map(q => q.msg)); const hist = L.chat.filter(m => !fila.has(m)).slice(-40); const ch = $('#lv-chat'); ch.innerHTML = hist.map(msgHTML).join(''); ch.scrollTop = ch.scrollHeight; }
    LUI.actions();
    $('#lv-actions').onclick = LUI.actionClick; $('#lv-ctl').onclick = LUI.actionClick;
    $('#lv-pend').onclick = LUI.pendClick;
    $('#lv-chat').onclick = e => { const m = e.target.closest('[data-m]'); if (m) LUI.msgPop(m.dataset.m, m); };
    $('#lv-form').onsubmit = e => { e.preventDefault(); const v = $('#lv-in').value.trim(); if (!v) return; $('#lv-in').value = ''; LUI.typed(v); };
  };
  LUI.close = () => { const ov = $('#overlay-live'); ov.hidden = true; ov.innerHTML = ''; LUI.minimized = false; document.body.classList.remove('live-open'); if (UI.renderTaskbar) UI.renderTaskbar(); };
  // a live é uma janela: dá para minimizar, usar outros apps e voltar pela aba "AO VIVO" da barra de tarefas
  LUI.minimized = false;
  LUI.visible = () => !$('#overlay-live').hidden;
  LUI.minimize = () => { if (!SL.Live.cur) return; LUI.minimized = true; $('#overlay-live').hidden = true; document.body.classList.remove('live-open'); document.querySelectorAll('.viewer-pop, #overlay-live .ctx').forEach(x => x.remove()); UI.renderTaskbar(); };
  LUI.restore = () => { if (!SL.Live.cur) return; const ov = $('#overlay-live'); if (!ov.firstChild) return LUI.open(); LUI.minimized = false; ov.hidden = false; document.body.classList.add('live-open'); UI.renderTaskbar(); };
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
    const sig = JSON.stringify([L.risky > 0, L.focus, !!L.poll, !!L.challenge, L.ev.mic, L.ev.net > 0, L.ev.paused, L.followersOnly, contracts.length, G.ch.pulso.afil, !!L.ev.ad, SL.Live.chatMode(), !!(L.ev.celeb && !L.ev.celeb.greeted)]);
    if (el.dataset.sig === sig) return; el.dataset.sig = sig;
    const b = (k, label, icon, cls, title) => `<button class="btn ${cls || ''}" data-la="${k}" title="${esc(title || '')}">${ic(icon, 15)}${label}</button>`;
    const k = (key, label, icon, cls, title) => `<button class="lbtn ${cls || ''}" data-la="${key}" title="${esc(title || label)}">${ic(icon, 15)}<span>${label}</span></button>`;
    // live simples: você fala sozinho e o Bigode (moderador) cuida do chat; ficam só estes botões
    const modo = SL.Live.chatMode(); const modoTxt = { todos: 'Chat livre', seguidores: 'Só seguidores', emotes: 'Só emojis' }[modo];
    const acts = [k('challenge', L.challenge ? 'Em desafio' : 'Desafio', 'trophy', L.challenge ? 'on' : ''), k('ad', L.ev.ad ? 'No intervalo' : 'Anúncios', 'ads', L.ev.ad ? 'on' : '', 'Intervalo de anúncios de 30, 60 ou 120 segundos')];
    if (contracts.length) acts.push(k('sponsor', 'Patrocínio', 'brief', '', 'Mencionar patrocinador'));
    acts.push(k('chatmode', modoTxt, 'shield', modo !== 'todos' ? 'on' : '', 'Quem pode escrever no chat'));
    el.innerHTML = `<div class="lgrid g${acts.length}">${acts.join('')}</div>`;
    const ctl = $('#lv-ctl'); if (ctl && !ctl.firstChild) ctl.innerHTML = `<span class="speeds lv-speeds">${UI.speedBtns()}</span><button class="btn live sm" data-la="end">${ic('stop', 14)} Encerrar live</button>`;
  };
  const menu = (anchor, title, items) => {
    const r = anchor.getBoundingClientRect(); const host = $('#overlay-live');
    const m = document.createElement('div'); m.className = 'ctx'; m.style.position = 'fixed';
    m.innerHTML = `<h4>${esc(title)}</h4>` + items.map((it, i) => `<button class="opt" data-i="${i}" ${it.disabled ? 'disabled' : ''}>${ic(it.icon || 'chevR', 15)}<span>${esc(it.label)}${it.desc ? '<span class="why" style="color:var(--muted)">' + esc(it.desc) + '</span>' : ''}</span></button>`).join('');
    host.appendChild(m); m.style.left = Math.max(10, Math.min(r.left, innerWidth - m.offsetWidth - 10)) + 'px'; m.style.top = (r.top - m.offsetHeight - 6 >= 10 ? r.top - m.offsetHeight - 6 : Math.min(r.bottom + 6, innerHeight - m.offsetHeight - 10)) + 'px';
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
    if (k === 'sponsor') return menu(t, 'Patrocinador', SL.Sponsors.active().map(c => { const b = D.brandById(c.brand); const d = c.deliv.find(x => x.k === 'live'); const falta = SL.Sponsors.espera(c); return { label: b.name, desc: !d ? 'sem menções no contrato' : d.done >= d.n ? 'menções já cumpridas' : d.done + '/' + d.n + ' menções · mínimo ' + d.minV + ' pessoas' + (falta > 0 ? ' · próxima em ' + falta + ' min' : ''), icon: 'brief', disabled: !d || d.done >= d.n, fn: () => LVs.sponsor(c.id) }; }));
    if (k === 'ad') { const falta = LVs.adEspera(); return menu(t, falta > 0 ? 'Anúncios (próximo em ' + falta + ' min)' : 'Intervalo de anúncios', LVs.AD_OPCOES.map(o => ({ label: o.label, icon: 'ads', desc: '≈ ' + U.money(LVs.adValor(o.s, L.viewers)) + ' · cai na conta segunda', disabled: falta > 0 || !!L.ev.ad, fn: () => LVs.ad(o.s) }))); }
    if (k === 'fonly') LVs.toggleFollowersOnly();
    if (k === 'chatmode') return menu(t, 'Quem pode escrever no chat', [['todos', 'Todos', 'Chat aberto', 'chat'], ['seguidores', 'Só seguidores', 'Menos trolls, menos gente nova falando', 'shield'], ['emotes', 'Só emojis', 'Sem textos: só emojis, sem trolls', 'star']].map(([id, label, desc, icon]) => ({ label: label + (LVs.chatMode() === id ? ' (agora)' : ''), desc, icon, fn: () => LVs.setChatMode(id) })));
    if (k === 'mic') LVs.fixMic();
    if (k === 'netq') LVs.fixNet('qualidade');
    if (k === 'netr') LVs.fixNet('roteador');
    if (k === 'speed') LVs.setSpeed(+t.dataset.s);
    if (k === 'end') return UI.confirm('Encerrar a live?', 'O resumo da transmissão vai aparecer em seguida.', () => LUI.finish(), 'Encerrar', true);
    LUI.actions();
  };
  // mensagens por segundo na tela: poucas pessoas, chat calmo; muita gente, chat rápido
  LUI.CHAT_MODOS = { 3: { k: 0.45, max: 0.6 }, 6: { k: 1, max: 2 }, 12: { k: 1.7, max: 5 } };
  LUI.chatRate = L => {
    const cap = SL.settings.chatCap || 6; const modo = LUI.CHAT_MODOS[cap] || (cap <= 3 ? LUI.CHAT_MODOS[3] : cap <= 6 ? LUI.CHAT_MODOS[6] : LUI.CHAT_MODOS[12]);
    const v = Math.max(0, L.viewers || 0); const rapido = SL.Clock.sp() === 2 ? 1.5 : 1;
    return Math.min(modo.max, (0.06 + Math.sqrt(v) * 0.05 + v * 0.004) * modo.k * rapido);
  };
  // superchat: som e voz (fila no SL.audio, um por vez)
  SL.bus.on('live:superchat', s => { if (SL.audio && SL.audio.superchat) SL.audio.superchat(s.id); });
  LUI.finish = reason => { const sum = SL.Live.end(reason); if (sum && LUI._shown !== sum) LUI.summary(sum); };
  SL.bus.on('live:end', sum => { const had = !!$('#overlay-live').firstChild; LUI.close(); if (had && sum) { LUI._shown = sum; LUI.summary(sum); } });

  // perguntas, recém-chegados e doações para responder
  LUI.pending = () => {
    const L = SL.Live.cur; const el = $('#lv-pend'); if (!L || !el) return;
    const qs = [], nc = [], dons = [];   // perguntas, boas-vindas e superchats ficam com o Bigode
    const sig = JSON.stringify([qs.map(q => q.msgId), nc.map(n => n.vid), dons.map(d => d.msgId), L.poll && L.poll.votes, L.challenge && L.challenge.label]);
    if (sig === pendSig) return; pendSig = sig;
    let h = '';
    if (L.poll) { const tot = L.poll.votes.reduce((a, b) => a + b, 0) || 1; h += `<div class="pq"><b class="small">${ic('poll', 13)} ${esc(L.poll.q)}</b>${L.poll.opts.map((o, i) => `<div class="pollbar"><i style="width:${L.poll.votes[i] / tot * 100}%"></i><span>${esc(o)} · ${Math.round(L.poll.votes[i] / tot * 100)}%</span></div>`).join('')}</div>`; }
    if (L.challenge) h += `<div class="pq"><b class="small">${ic('trophy', 13)} Desafio: ${esc(L.challenge.label)}</b><span class="tiny muted">até ${U.dur(Math.max(0, L.challenge.until - L.min))}</span></div>`;
    if (dons.length) h += `<div class="pq"><div class="row"><b class="small ok grow">${ic('gift', 13)} ${dons.length} doaç${dons.length > 1 ? 'ões' : 'ão'} sem agradecer</b><button class="btn sm ok" data-pa="thankall">Agradecer</button></div><div class="tiny muted">${dons.map(d => '@' + esc(d.u) + ' ' + U.money(d.amount)).join(' · ')}</div></div>`;
    nc.forEach(n => { const v = SL.Viewers.byId(n.vid); if (v) h += `<div class="pq"><div class="row"><span class="grow small"><span class="who" style="color:${v.c}">@${esc(v.u)}</span> chegou pela primeira vez</span><button class="btn sm" data-pa="welcome" data-v="${v.id}">Dar boas-vindas</button></div></div>`; });
    qs.forEach(q => { const v = SL.Viewers.byId(q.vid); if (!v) return; h += `<div class="pq"><div><span class="who" style="color:${v.c}">@${esc(v.u)}</span> <span class="tiny muted">(${esc(SL.Viewers.label(v))})</span></div><div>${SL.Chat.html(q.text)}</div><div class="row wrap">${(SL.Chat.ANSWERS[q.type] || []).map(o => `<button class="btn sm" data-pa="ans" data-m="${q.msgId}" data-o="${o.id}">${esc(o.label)}</button>`).join('')}</div></div>`; });
    el.innerHTML = h; el.hidden = !h;
  };
  LUI.pendClick = e => {
    const b = e.target.closest('[data-pa]'); if (!b) return; SL.audio.play('click'); const LVs = SL.Live;
    if (b.dataset.pa === 'ans') LVs.answer(b.dataset.m, b.dataset.o);
    if (b.dataset.pa === 'welcome') LVs.welcome(b.dataset.v);
    if (b.dataset.pa === 'thankall') LVs.thank('all');
    pendSig = ''; LUI.pending();
  };
  // clicar num comentário: logo acima dele aparece UMA resposta de acordo com o que a pessoa escreveu
  // (botão curto, ex.: "Obrigado, Luis"; no chat sai "Obrigado, @luisgameplays43!") e a moderação
  const primeiroNome = v => { const p = (v.n || '').split(' ').filter(x => x && !/^(dona|seu|sr\.?|sra\.?|tio|tia|dr\.?|dra\.?|v[óô])$/i.test(x)); const n = p[0] || ((v.u.match(/[a-zA-Z]+/) || ['você'])[0]); return n.charAt(0).toUpperCase() + n.slice(1, 12); };
  LUI.respostaPara = (m, v) => {
    const L = SL.Live.cur; const LVs = SL.Live; const low = (m.raw || '').toLowerCase(); const nome = primeiroNome(v); const u = '@' + v.u;
    const ob = SL.G.player.gender === 'f' ? 'Obrigada' : 'Obrigado';
    const q = L.questions.find(x => x.msgId === m.id && !x.done); const don = L.donations.find(d => d.msgId === m.id && !d.thanked);
    const isNew = L.newcomers.some(n => n.vid === v.id) && !(L.att.get(v.id) || {}).welcomed;
    // quem acabou de chegar: a resposta também dá as boas-vindas (conta como recebido)
    const diz = t => isNew ? () => LVs.welcome(v.id, t + ' Seja bem-vindo(a)!') : () => LUI.typed(t);
    if (q) { const o = (SL.Chat.ANSWERS[q.type] || [])[0]; if (o) return { label: 'Responder ' + nome, fn: () => LVs.answer(m.id, o.id) }; }
    if (don) return { label: 'Valeu, ' + nome, fn: () => LVs.thank(m.id) };
    if (m.intent === 'leave' || /tchau|vou (sair|nessa|dormir)|\bfui\b|at[eé] amanh[aã]/.test(low)) return { label: 'Tchau, ' + nome, fn: () => LUI.typed('Valeu por ter vindo, ' + u + '! Até a próxima!') };
    if (m.tone === 't' || /\b(lixo|fraco|ruim|chato|horr[ií]vel|desiste)\b/.test(low)) return { label: 'Calma, ' + nome, fn: () => LUI.typed('Calma, ' + u + ', aqui o clima é de boa.') };
    const oi = { label: 'Oi, ' + nome, fn: isNew ? () => LVs.welcome(v.id) : () => LUI.typed('Fala, ' + u + '! Seja bem-vindo(a)!') };
    if (/\b(oi+|ol[aá]|eae|e a[ií]|salve|cheguei|chegando|boa (noite|tarde)|bom dia)\b/.test(low)) return oi;
    if (/k{3,}|haha|\brs\b/.test(low)) return { label: 'Kkkk, ' + nome, fn: diz('Kkkkk ' + u + '!') };
    if (/\b(boa|top|brabo|mito|amo|melhor|parab[eé]ns|gg|demais|massa|show|lind[oa]|orgulh\w*|bora|vai)\b/.test(low)) return { label: ob + ', ' + nome, fn: diz(ob + ', ' + u + '!') };
    if (/\b(conta|mostra|faz|joga|tenta|explica|testa)\b/.test(low)) return { label: 'Pode deixar, ' + nome, fn: diz('Pode deixar, ' + u + '!') };
    if (m.intent === 'greet') return oi;
    if (m.tone === 'c') return { label: 'Valeu, ' + nome, fn: diz('Valeu pela dica, ' + u + ', vou melhorar!') };
    if (m.tone === 'z') return { label: 'Kkkk, ' + nome, fn: diz('Kkkkk ' + u + '!') };
    if (m.intent === 'moment' || m.intent === 'react') return { label: 'Né, ' + nome, fn: diz('Né, ' + u + '? Foi demais!') };
    if (m.tone === 'h' || m.intent === 'compliment') return { label: ob + ', ' + nome, fn: diz(ob + ', ' + u + '!') };
    if (isNew) return oi;
    return { label: 'Valeu, ' + nome, fn: diz('Valeu, ' + u + '!') };
  };
  LUI.msgPop = (mid, node) => {
    const L = SL.Live.cur; if (!L) return; const m = L.chat.find(x => x.id === mid);
    document.querySelectorAll('.viewer-pop').forEach(x => x.remove());
    document.querySelectorAll('#lv-chat .cm.sel').forEach(x => x.classList.remove('sel'));
    if (!m || !m.vid) return; const v = SL.Viewers.byId(m.vid); if (!v) return;
    node.classList.add('sel');
    const rep = LUI.respostaPara(m, v);
    const pop = document.createElement('div'); pop.className = 'viewer-pop'; const side = $('.live-side');
    pop.innerHTML = `<div class="vp-h"><span class="ava" style="background:${v.c}">${esc(v.u[0].toUpperCase())}</span><div class="grow"><b style="color:${v.c}">@${esc(v.u)}</b><div class="tiny muted">${esc(SL.Viewers.label(v))}</div></div><button class="ibtn" data-x title="Fechar">${ic('x', 14)}</button></div>
      <div class="vp-r"><button class="rbtn reply" data-p="rep">${ic('send', 13)} ${esc(rep.label)}</button></div>
      <div class="vp-m"><button class="rbtn warn" data-p="timeout">${ic('micOff', 12)} Silenciar</button><button class="rbtn bad" data-p="ban">${ic('ban', 12)} Banir</button>${v.mod ? '<span class="tiny muted">Já é moderador(a)</span>' : `<button class="rbtn hot" data-p="mod">${ic('shield', 12)} Moderador</button>`}</div>`;
    side.appendChild(pop);
    const r = node.getBoundingClientRect(), sr = side.getBoundingClientRect(); const ph = pop.offsetHeight;
    let top = r.top - sr.top - ph - 8, below = false; if (top < 6) { top = r.bottom - sr.top + 8; below = true; }
    pop.style.top = Math.max(6, Math.min(top, side.clientHeight - ph - 6)) + 'px'; pop.classList.toggle('below', below);
    const done = () => { pop.remove(); node.classList.remove('sel'); pendSig = ''; LUI.pending(); };
    pop.onclick = ev => {
      const b = ev.target.closest('[data-p],[data-x]'); if (!b) return; const k = b.dataset.p; const LVs = SL.Live; SL.audio.play('click');
      if (k === 'rep') rep.fn();
      if (k === 'timeout') LVs.ban(v.id, true); if (k === 'ban') LVs.ban(v.id, false); if (k === 'mod') UI.err(LVs.makeMod(v.id));
      done();
    };
  };

  // laço do estúdio (chamado pelo laço principal)
  LUI.frame = tSec => {
    const L = SL.Live.cur; if (!L || $('#overlay-live').hidden) return;
    const wrap = $('#lv-wrap'), box = $('#lv-box');
    if (wrap && box) { const aw = wrap.clientWidth - 20, ah = wrap.clientHeight - 20; const w = Math.max(80, Math.min(aw, ah * 16 / 9)); const k = Math.round(w) + 'x' + Math.round(w * 9 / 16); if (box.dataset.k !== k) { box.dataset.k = k; box.style.width = Math.round(w) + 'px'; box.style.height = Math.round(w * 9 / 16) + 'px'; } }
    const cv = $('#lv-cv'); if (cv) SL.Preview.live(cv, L, tSec);
    // chat com limite de mensagens por segundo
    const fresh = SL.Live.flush(); if (fresh.length) buf.push(...fresh);
    const rate = LUI.chatRate(L);
    const now = performance.now(); LUI._acc = (LUI._acc || 0) + (now - (LUI._last || now)) / 1000 * rate; LUI._last = now;
    // mensagens comuns que não couberam no ritmo do chat ficam para trás (perguntas, doações e avisos nunca somem)
    const comum = m => m.kind === 'msg' && !m.q; const nComum = buf.filter(comum).length; const maxFila = Math.max(2, Math.ceil(rate * 3));
    if (nComum > maxFila) { let tira = nComum - maxFila; buf = buf.filter(m => !(comum(m) && tira-- > 0)); }
    const chat = $('#lv-chat');
    // o que você escreve aparece na hora
    const jaJa = m => m.kind !== 'msg';   // só a conversa do público segue o ritmo; o que você escreve, superchats, avisos e o Bigode aparecem na hora
    if (chat && buf.some(jaJa)) { const meus = buf.filter(jaJa); buf = buf.filter(m => !jaJa(m)); const f = document.createElement('div'); f.innerHTML = meus.map(msgHTML).join(''); while (f.firstChild) chat.appendChild(f.firstChild); chat.scrollTop = chat.scrollHeight; }
    if (chat && buf.length && LUI._acc >= 1) {
      const n = Math.min(buf.length, Math.floor(LUI._acc)); LUI._acc -= n;
      const nearBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 60;
      const frag = document.createElement('div'); frag.innerHTML = buf.splice(0, n).map(msgHTML).join('');
      while (frag.firstChild) chat.appendChild(frag.firstChild);
      while (chat.children.length > 160) chat.firstChild.remove();
      if (nearBottom) chat.scrollTop = chat.scrollHeight;
    }
    if (LUI._acc > 1.5) LUI._acc = 1.5;
    // alertas animados
    const al = $('#lv-al');
    if (al && L.alerts.length > alertsShown) {
      const list = L.alerts.slice(alertsShown); alertsShown = L.alerts.length;
      LUI._aq = (LUI._aq || []).concat(list.slice(-4)).slice(-4);
      // superchat passa na frente dos alertas de seguidor
      const scs = LUI._aq.filter(a => a.k === 'don'); if (scs.length) { LUI._aq = scs.concat(LUI._aq.filter(a => a.k !== 'don')); if (!(al.querySelector('.lalert.sc'))) LUI._aqT = 0; }
    }
    // um alerta por vez, como nos programas de live de verdade
    if (al && LUI._aq && LUI._aq.length && now > (LUI._aqT || 0)) {
      LUI._aqT = now + 2600; const a = LUI._aq.shift(); al.innerHTML = '';
      [a].forEach(a => { const d = document.createElement('div'); d.className = 'lalert ' + a.k; d.innerHTML = a.k === 'follow' ? ic('follow', 16) + '@' + esc(a.u) + ' seguiu!' : a.k === 'sub' ? ic('sub', 16) + '@' + esc(a.u) + ' se inscreveu!' : '<span class="sc-al"><b>SUPERCHAT ' + U.money(a.amount) + '</b><span>@' + esc(a.u) + '</span>' + (a.text ? '<em>' + esc(a.text) + '</em>' : '') + '</span>'; if (a.k === 'don') { d.className = 'lalert sc'; LUI._aqT = performance.now() + 6500; } al.appendChild(d); setTimeout(() => d.remove(), a.k === 'don' ? 6500 : 4000); });
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
      <div class="card col prox"><h3>Próximos passos</h3><div class="row gap6 wrap">${raw && raw.moments && raw.moments.length ? `<button class="btn sm pink" data-prox="corte">${ic('scissors', 14)} Corte no TikTok</button>` : ''}<button class="btn sm" data-prox="post">${ic('connect', 14)} Agradecer no Instagram</button><button class="btn sm" data-prox="agenda">${ic('calendar', 14)} Marcar a próxima live</button></div><span class="tiny muted">Cortes e posts trazem gente nova para a próxima live.</span></div>
      <p class="tiny muted">Doações, inscrições e anúncios caem no saldo da Twitch e são repassados toda segunda-feira.</p>`, buttons: [{ label: 'Fechar', cls: 'primary' }] });
    UI.chart($('#sum-ch', m.el), [{ data: s.graph, color: '#ff4d5e' }, { data: s.hype, color: '#ffb547', fill: false }]);
    $$('[data-cut]', m.el).forEach(b => b.onclick = () => { m.close(); UI.criarVideo('corte', null, { raw: raw && raw.id }); });
    // próximos passos: cada sistema puxa o outro
    $$('[data-prox]', m.el).forEach(b => b.onclick = () => {
      const k = b.dataset.prox;
      if (k === 'corte') { m.close(); UI.criarVideo('corte', null, { raw: raw && raw.id }); }
      if (k === 'post') { const e = SL.Social.post({ kind: 'texto', text: 'Valeu demais pela live de hoje! ' + U.int(s.peak) + ' pessoas no pico. Amanhã tem mais.', eng: 1.15 }); if (e) return UI.err(e); b.disabled = true; b.innerHTML = ic('check', 14) + ' Postado'; }
      if (k === 'agenda') { m.close(); UI.openApp('calendario'); }
    });
  };
})(window.SL);

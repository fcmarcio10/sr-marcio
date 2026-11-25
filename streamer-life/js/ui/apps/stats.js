/* App Estatísticas: carreira, seguidores, reputação, ranking, objetivos e acontecimentos. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const ic = UI.ic, esc = U.esc;
  SL.Apps.stats = {
    title: 'Carreira', short: 'Carreira', icon: 'stats', color: 'linear-gradient(135deg,#c084fc,#7c3aed)', order: 14, pc: true, phone: true, w: 960, h: 680,
    watch: ['career', 'goals', 'rep', 'tick:day'],
    render(el, ctx) {
      const st = ctx.st; if (ctx.args && ctx.args.tab && !st.used) { st.used = 1; st.tab = ctx.args.tab; }
      st.tab = st.tab || (ctx.args && ctx.args.tab) || 'carreira';
      const tabs = [['carreira', 'Carreira'], ['seguidores', 'Seguidores'], ['reputacao', 'Reputação'], ['ranking', 'Ranking'], ['objetivos', 'Objetivos'], ['historico', 'Acontecimentos']];
      el.innerHTML = `<div class="app"><div class="app-head"><h2>${ic('stats', 16)} Estatísticas</h2><div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`).join('')}</div></div><div class="app-body">${this[st.tab]()}</div></div>`;
      const cv = el.querySelector('#st-f'); if (cv) { const d = SL.G.stats.days.slice(-60); UI.chart(cv, [{ data: d.map(x => x.f.p), color: '#8b5cf6' }, { data: d.map(x => x.f.v), color: '#ff5a36', fill: false }, { data: d.map(x => x.f.c), color: '#19d3c5', fill: false }, { data: d.map(x => x.f.n), color: '#3b82f6', fill: false }], { labels: d.map(() => '') }); }
      const cv2 = el.querySelector('#st-inc'); if (cv2) { const ks = Object.keys(SL.G.month).sort().slice(-8); UI.chart(cv2, [{ data: ks.map(k => SL.Econ.taxableLastMonth(k) + (SL.G.month[k].in.trabalho || 0)), color: '#35d39a' }], { labels: ks.map(k => k.slice(5) + '/' + k.slice(2, 4)) }); }
    },
    carreira() {
      const G = SL.G; const b = SL.Career.breakdown(); const t = G.career.tier; const T = SL.Career.TIERS; const next = T[t + 1];
      const parts = [['alcance', 'Alcance (seguidores somados)'], ['audiencia', 'Público nas lives'], ['engajamento', 'Engajamento do chat'], ['qualidade', 'Qualidade do conteúdo'], ['reputacao', 'Reputação'], ['constancia', 'Constância']];
      return `<div class="card row wrap gap16"><div class="stat"><b>${esc(T[t].n)}</b><span>Nível atual</span></div><div class="stat"><b>${G.career.score}</b><span>Pontuação</span></div><div class="stat"><b>${U.num(SL.Social.totalFollowers())}</b><span>Seguidores somados</span></div><div class="stat"><b>${Math.floor((G.time.t) / 1440) + 1}</b><span>Dias de carreira</span></div></div>
        <div class="card col"><h3>De onde vem a pontuação</h3>${parts.map(([k, l]) => `<div class="attr" style="grid-template-columns:200px 1fr 44px">${l}<div class="bar"><i style="width:${Math.min(100, b.parts[k] / 40 * 100)}%"></i></div><b>${b.parts[k].toFixed(1).replace('.', ',')}</b></div>`).join('')}</div>
        ${next ? `<div class="card col"><h3>Para chegar em "${esc(next.n)}"</h3><div class="attr" style="grid-template-columns:200px 1fr 70px">Pontuação ${next.s}<div class="bar"><i style="width:${Math.min(100, b.score / next.s * 100)}%"></i></div><b>${b.score.toFixed(0)}</b></div><div class="attr" style="grid-template-columns:200px 1fr 70px">Alcance ${U.num(next.reach)}<div class="bar"><i style="width:${Math.min(100, b.reach / next.reach * 100)}%"></i></div><b>${U.num(b.reach)}</b></div>${next.rep ? `<div class="attr" style="grid-template-columns:200px 1fr 70px">Reputação média ${next.rep}<div class="bar"><i style="width:${Math.min(100, SL.Rep.avg() / next.rep * 100)}%"></i></div><b>${Math.round(SL.Rep.avg())}</b></div>` : ''}${next.pop ? `<div class="attr" style="grid-template-columns:200px 1fr 70px">Popularidade ${next.pop}<div class="bar"><i style="width:${Math.min(100, G.rep.popularidade / next.pop * 100)}%"></i></div><b>${Math.round(G.rep.popularidade)}</b></div>` : ''}<p class="tiny muted">Os níveis vêm de resultados, não só de seguidores. Ficar duas semanas bem abaixo da pontuação do nível faz você cair.</p></div>` : '<div class="card"><b>Você chegou ao topo. Agora é se manter.</b></div>'}
        <div class="card col"><h3>Habilidades</h3>${Object.entries(G.player.skills).map(([k, v]) => `<div class="attr" style="grid-template-columns:160px 1fr 44px">${({ carisma: 'Carisma', jogo: 'Habilidade em jogos', edicao: 'Edição', marketing: 'Marketing', culinaria: 'Culinária', fisico: 'Condicionamento' })[k]}<div class="bar"><i style="width:${v}%"></i></div><b>${Math.round(v)}</b></div>`).join('')}</div>`;
    },
    seguidores() {
      const G = SL.G; const c = G.ch;
      return `<div class="statrow"><div class="card stat"><b style="color:#b49dff">${U.num(c.pulso.f)}</b><span>Twitch (lives)</span></div><div class="card stat"><b style="color:#ff8a6a">${U.num(c.vision.f)}</b><span>YouTube (vídeos)</span></div><div class="card stat"><b style="color:#19d3c5">${U.num(c.clipz.f)}</b><span>TikTok (shorts)</span></div><div class="card stat"><b style="color:#6aa8ff">${U.num(c.connect.f)}</b><span>Instagram (posts)</span></div></div>
        <div class="card"><h3>Evolução (60 dias)</h3>${G.stats.days.length > 1 ? '<canvas class="chart" id="st-f" style="height:200px"></canvas>' : '<div class="small muted">Disponível depois do primeiro dia.</div>'}</div>
        <div class="card"><h3>Renda das plataformas e trabalho por mês</h3>${Object.keys(G.month).length ? '<canvas class="chart" id="st-inc"></canvas>' : ''}</div>
        <div class="card"><h3>Momentos marcantes do canal</h3>${G.ch.moments.length ? `<div class="list">${G.ch.moments.slice().reverse().slice(0, 12).map(m => `<div class="li small"><span class="acc">${ic('star', 14)}</span><span class="grow">${esc(m.txt)}</span><span class="tiny muted">${SL.Clock.fmtDay(m.d)}</span></div>`).join('')}</div>` : '<div class="small muted">Os momentos mais fortes das lives ficam na memória do público.</div>'}</div>`;
    },
    reputacao() {
      const G = SL.G;
      return `<div class="card col">${SL.Rep.DIMS.map(d => `<div><div class="row between"><b class="small">${d.label}</b><b class="mono">${Math.round(G.rep[d.k])}</b></div><div class="bar"><i style="width:${G.rep[d.k]}%;background:${G.rep[d.k] >= 60 ? 'var(--ok)' : G.rep[d.k] >= 35 ? 'var(--warn)' : 'var(--bad)'}"></i></div><div class="tiny muted">${d.desc}</div></div>`).join('')}</div>
        <p class="small muted">Promessas cumpridas e lives boas aumentam a confiança. Polêmicas dão popularidade, mas derrubam a imagem e afastam marcas. Contratos cumpridos aumentam a credibilidade.</p>`;
    },
    ranking() {
      const list = SL.Creators.ranking();
      return `<div class="card"><div class="tablewrap"><table class="table"><tr><th>#</th><th>Criador</th><th>Twitch</th><th>YouTube</th><th>TikTok</th><th>Total</th><th>Agora</th></tr>${list.map((c, i) => `<tr class="${c.me ? 'rank-me' : ''}"><td class="n">${i + 1}</td><td><b class="small">${esc(c.name)}</b><div class="tiny muted">@${esc(c.handle)}</div></td><td class="n">${U.num(c.f.pulso)}</td><td class="n">${U.num(c.f.vision)}</td><td class="n">${U.num(c.f.clipz)}</td><td class="n"><b>${U.num(c.total)}</b></td><td>${c.live ? '<span class="tag live">ao vivo</span>' : c.me ? '<span class="tag acc">você</span>' : c.mom > 0.25 ? '<span class="tag ok">crescendo</span>' : c.mom < -0.25 ? '<span class="tag bad">caindo</span>' : ''}</td></tr>`).join('')}</table></div></div>`;
    },
    objetivos() {
      const groups = {}; SL.Goals.LIST.forEach(g => { (groups[g.g] = groups[g.g] || []).push(g); });
      return Object.entries(groups).map(([name, list]) => `<div class="card"><h3>${esc(name)}</h3>${list.map(g => { const s = SL.Goals.status(g); return `<div class="goal ${s.done ? 'done' : ''}"><span class="gi">${ic(s.done ? 'check' : 'target', 14)}</span><div class="grow"><b class="small">${esc(g.title)}</b>${g.hint && !s.done ? `<div class="tiny muted">${esc(g.hint)}</div>` : ''}${s.b && !s.done ? `<div class="row small"><div class="bar grow"><i style="width:${s.p * 100}%"></i></div><span class="mono tiny">${U.num(s.a)}/${U.num(s.b)}</span></div>` : ''}</div>${s.done && SL.G.goals[g.id] != null ? `<span class="tiny muted">${SL.Clock.fmtDay(SL.G.goals[g.id])}</span>` : ''}</div>`; }).join('')}</div>`).join('');
    },
    historico() {
      const G = SL.G; const log = G.events.log.slice().reverse();
      return `<div class="card">${log.length ? `<div class="list">${log.map(e => `<div class="li"><span class="acc">${ic('flag', 15)}</span><div class="grow"><b class="small">${esc(e.title)}</b><div class="tiny muted">Você escolheu: ${esc(e.label)} · ${esc(e.result)}</div></div><span class="tiny muted">${SL.Clock.fmtDay(SL.Clock.day(e.t))}</span></div>`).join('')}</div>` : '<div class="empty">Nenhum acontecimento marcante ainda.</div>'}</div>`;
    },
    act(a, ds, ctx) { if (a === 'tab') { ctx.st.tab = ds.t; ctx.resetScroll = true; return ctx.render(); } },
  };
})(window.SL);

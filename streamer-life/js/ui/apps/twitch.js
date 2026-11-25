/* App Twitch (nov/2026): página do seu canal no estilo da Twitch, vídeos das lives, painel do criador,
   conquistas (caminho para afiliado e parceiro) e monetização. Internamente a plataforma continua "pulso". */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const $ = UI.$, $$ = UI.$$;
  const ic = UI.ic, esc = U.esc;
  const ROXO = '#9146ff';
  const hms = min => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h + ':' + String(m).padStart(2, '0') + ':00'; };

  SL.Apps.twitch = {
    title: 'Twitch', short: 'Twitch', icon: 'live', color: 'linear-gradient(135deg,#a970ff,#6b2fd6)', order: 1.5, pc: true, phone: true, w: 1100, h: 720,
    watch: ['live:end', 'live:start', 'live:minute', 'tick:hour', 'money'],
    sig(ctx) { const L = SL.Live.cur; const P = SL.G.ch.pulso; return [ctx.st.tab, !!L, L ? Math.round(L.viewers) : 0, P.f, P.subs, Math.round(P.bal * 100), SL.G.lives.length, P.afil, P.parc].join('|'); },
    render(el, ctx) {
      const G = SL.G; const P = G.ch.pulso; const st = ctx.st; st.tab = st.tab || (ctx.args && ctx.args.tab) || 'inicio';
      const L = SL.Live.cur; const nome = G.player.channel;
      const tabs = [['inicio', 'Início'], ['videos', 'Vídeos'], ['painel', 'Painel do criador'], ['conquistas', 'Conquistas'], ['monetizacao', 'Monetização']];
      const status = P.parc ? '<span class="tw-selo parc" title="Parceiro">' + ic('check', 11) + '</span>' : '';
      const recs = G.creators.map(c => ({ c, d: D.creatorById(c.id) })).filter(x => x.d).sort((a, b) => (b.c.live ? 1 : 0) - (a.c.live ? 1 : 0) || b.c.f.pulso - a.c.f.pulso).slice(0, 9);
      el.innerHTML = `<div class="app tw"><div class="tw-top"><span class="tw-logo">${ic('live', 16)}</span><b class="tw-marca">Twitch</b><span class="tw-nav">Seguindo</span><span class="tw-nav">Navegar</span><div class="tw-busca">${ic('search', 13)}<span>Buscar</span></div><span class="tw-saldo">${U.money0(G.money)}</span><canvas class="tw-eu" data-ava="eu"></canvas></div>
        <div class="tw-wrap"><aside class="tw-side"><div class="tw-side-h">CANAIS RECOMENDADOS</div>${recs.map(({ c, d }) => `<div class="tw-rec"><canvas data-ava="${c.id}"></canvas><div class="grow"><b>${esc(d.name)}</b><small>${c.live ? esc((D.gameById(c.live.game) || {}).name || '') : 'Offline'}</small></div>${c.live ? `<span class="tw-vv"><i></i>${U.num(c.live.viewers)}</span>` : ''}</div>`).join('')}</aside>
        <main class="tw-main app-body"><div class="tw-banner"><span>${esc(nome)}</span></div>
          <div class="tw-canal"><div class="tw-ava ${L ? 'aovivo' : ''}"><canvas data-ava="eu"></canvas>${L ? '<em>AO VIVO</em>' : ''}</div>
            <div class="grow"><h2>${esc(nome)} ${status}</h2><div class="tw-sub">${U.num(P.f)} seguidores${P.afil ? ' · ' + (P.parc ? 'Parceiro(a)' : 'Afiliado(a)') : ''}</div>${L ? `<div class="tw-agora">${esc(L.title)} <span>· ${esc(D.gameById(L.game).name)} · ${U.int(L.viewers)} assistindo</span></div>` : ''}</div>
            <button class="btn sm tw-btn" data-act="obs">${ic('live', 14)} ${L ? 'Voltar para a live' : 'Ir ao vivo'}</button></div>
          <nav class="tw-tabs">${tabs.map(([k, l]) => `<button class="${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`).join('')}</nav>
          <div class="tw-corpo">${this[st.tab](ctx)}</div></main></div></div>`;
      // retratos: você e os canais recomendados
      $$('canvas[data-ava]', el).forEach(cv => { const id = cv.dataset.ava; const look = id === 'eu' ? G.player.look : (D.creatorById(id) || {}).look; if (look) SL.Avatar.toCanvas(cv, look, { bg: id === 'eu' ? '#5b2bb8' : '#2a2d36', scale: 1.1 }); });
      if (SL.Capa) requestAnimationFrame(() => SL.Capa.pintar(el));
      if (st.tab === 'painel') { const cv = $('#tw-chart', el); if (cv) UI.chart(cv, [{ data: G.lives.slice(-20).map(l => l.avg), color: ROXO }, { data: G.lives.slice(-20).map(l => l.peak), color: '#ff4d5e', fill: false }], { labels: G.lives.slice(-20).map((l, i, a) => '#' + (G.lives.length - a.length + i + 1)) }); }
    },
    vod(l, i) {
      const g = D.gameById(l.game) || { name: '', color: ROXO }; const n = SL.G.lives.indexOf(l) + 1;
      return `<div class="tw-vod"><div class="tw-th" style="--c:${g.color}"><canvas class="tw-capa" data-capa="${l.game}"></canvas><b>${esc(g.name)}</b><span class="tw-dur">${hms(l.dur)}</span><span class="tw-vis">${U.num(Math.round(l.uniq || l.peak * 1.6))} visualizações</span><span class="tw-dia">${SL.Clock.ago(l.t0)}</span></div><div class="tw-vi"><b class="ellipsis">${esc(l.title || 'Live #' + n)}</b><small>${esc(SL.G.player.channel)}</small><span class="tw-tag">${esc(g.name)}</span></div></div>`;
    },
    inicio(ctx) {
      const G = SL.G; const P = G.ch.pulso; const L = SL.Live.cur; const ult = G.lives.slice(-4).reverse();
      const req = SL.Live.reqAfiliado(); const feitos = req.filter(r => r.v >= r.meta).length;
      return `${L ? `<div class="tw-live-card"><span class="tw-ao">AO VIVO</span><div class="grow"><b>${esc(L.title)}</b><small>${esc(D.gameById(L.game).name)} · ${U.int(L.viewers)} assistindo · pico ${U.int(L.peak)}</small></div><button class="btn sm tw-btn" data-act="obs">Ver live</button></div>` : ''}
        ${!P.afil ? `<div class="tw-meta" data-act="tab" data-t="conquistas"><div class="grow"><b>Caminho para Afiliado</b><small>${feitos} de ${req.length} requisitos cumpridos. Afiliado(a) recebe inscrições e roda anúncios.</small></div><div class="tw-anel" style="--p:${feitos / req.length * 100}%"><span>${feitos}/${req.length}</span></div></div>` : ''}
        <h3 class="tw-h">Transmissões recentes</h3>${ult.length ? `<div class="tw-vods">${ult.map((l, i) => this.vod(l, i)).join('')}</div>` : '<div class="tw-vazio">Nenhuma transmissão ainda. Abra o OBS Studio e entre ao vivo.</div>'}
        <h3 class="tw-h">Sobre ${esc(G.player.channel)}</h3><div class="tw-sobre"><div><b>${U.num(P.f)}</b><small>seguidores</small></div><div><b>${U.num(P.subs)}</b><small>inscritos</small></div><div><b>${Math.round(P.hours)}h</b><small>de live</small></div><div><b>${U.num(P.peak)}</b><small>recorde de público</small></div><p>Canal de ${esc(G.player.name)}. Lives de jogos e papo com o chat${P.afil ? '. Inscreva-se para apoiar o canal!' : '.'}</p></div>`;
    },
    videos() {
      const lives = SL.G.lives.slice().reverse();
      return lives.length ? `<div class="tw-vods">${lives.slice(0, 24).map((l, i) => this.vod(l, i)).join('')}</div>` : '<div class="tw-vazio">Suas lives aparecem aqui depois que terminam.</div>';
    },
    painel() {
      const G = SL.G; const P = G.ch.pulso; const lives = G.lives.slice().reverse();
      const tile = (v, l) => `<div class="tw-tile"><b>${v}</b><small>${l}</small></div>`;
      return `<div class="tw-tiles">${tile(U.num(P.f), 'Seguidores')}${tile(U.num(P.subs), 'Inscritos ativos')}${tile(Math.round(SL.Live.media(7) * 10) / 10, 'Média de espectadores (7 lives)')}${tile(U.num(P.peak), 'Recorde de público')}${tile(Math.round(P.hours) + 'h', 'Horas transmitidas')}${tile(P.livesN, 'Lives feitas')}</div>
        <div class="tw-box"><div class="tw-box-h"><b>Público por live</b><small><span style="color:${ROXO}">média</span> · <span style="color:#ff4d5e">pico</span></small></div>${G.lives.length ? '<canvas class="chart" id="tw-chart"></canvas>' : '<div class="tw-vazio">Faça sua primeira live para ver o gráfico.</div>'}</div>
        <div class="tw-box"><div class="tw-box-h"><b>Histórico de transmissões</b></div>${lives.length ? `<div class="tablewrap"><table class="table"><tr><th>Live</th><th>Jogo</th><th>Duração</th><th>Pico</th><th>Média</th><th>Seguidores</th><th>Doações</th></tr>${lives.slice(0, 40).map((l, i) => `<tr><td>#${G.lives.length - i}</td><td>${esc(D.gameById(l.game).name)}</td><td class="n">${U.dur(l.dur)}</td><td class="n">${U.int(l.peak)}</td><td class="n">${l.avg}</td><td class="n ok">+${U.int(l.fol)}</td><td class="n">${U.money(l.don)}</td></tr>`).join('')}</table></div>` : '<div class="tw-vazio">Nenhuma live ainda.</div>'}</div>`;
    },
    reqHTML(lista) {
      return lista.map(r => { const ok = r.v >= r.meta; const v = r.horas ? Math.floor(r.v * 10) / 10 + 'h' : r.media ? Math.round(r.v * 10) / 10 : U.num(Math.floor(r.v)); const m = r.horas ? r.meta + 'h' : U.num(r.meta);
        return `<div class="tw-req ${ok ? 'ok' : ''}"><span class="tw-ck">${ok ? ic('check', 13) : ''}</span><div class="grow"><b>${esc(r.nome)}</b><div class="tw-rbar"><i style="width:${Math.min(100, r.v / r.meta * 100)}%"></i></div></div><span class="tw-rv">${v} / ${m}</span></div>`; }).join('');
    },
    conquistas() {
      const P = SL.G.ch.pulso;
      return `<div class="tw-box tw-cam ${P.afil ? 'feito' : ''}"><div class="tw-box-h"><b>${P.afil ? ic('check', 15) + ' Você é Afiliado(a)!' : 'Caminho para Afiliado'}</b><small>${P.afil ? 'Inscrições e anúncios liberados' : 'Cumpra tudo e vire afiliado(a) no fim de uma live'}</small></div>
          ${P.afil ? '' : this.reqHTML(SL.Live.reqAfiliado())}
          <div class="tw-libera"><span>${ic('star', 13)} Inscrições (R$ 3,95 por mês cada)</span><span>${ic('ads', 13)} Anúncios durante a live</span><span>${ic('money', 13)} Repasse no fim de cada live</span></div></div>
        <div class="tw-box tw-cam ${P.parc ? 'feito' : ''}"><div class="tw-box-h"><b>${P.parc ? ic('check', 15) + ' Você é Parceiro(a)!' : 'Caminho para Parceiro'}</b><small>${P.parc ? 'Selo de parceiro e 1440p' : P.afil ? 'O próximo passo da sua carreira' : 'Primeiro vire afiliado(a)'}</small></div>
          ${P.parc ? '' : this.reqHTML(SL.Live.reqParceiro())}
          <div class="tw-libera"><span>${ic('check', 13)} Selo de parceiro no canal</span><span>${ic('monitor', 13)} Transmitir em 1440p</span><span>${ic('crown', 13)} Mais público e patrocínios maiores</span></div></div>`;
    },
    monetizacao() {
      const G = SL.G; const P = G.ch.pulso; const mk = SL.Clock.monthKey(); const m = G.month[mk] || { in: {} };
      return `<div class="tw-tiles"><div class="tw-tile"><b class="ok">${U.money(P.bal)}</b><small>Saldo a receber (cai no fim da live)</small></div><div class="tw-tile"><b>${U.money(m.in.doacoes || 0)}</b><small>Repasses da Twitch no mês</small></div><div class="tw-tile"><b>${U.num(P.subs)}</b><small>Inscrições ativas</small></div><div class="tw-tile"><b>${U.money(P.adsTotal || 0)}</b><small>Ganho com anúncios</small></div></div>
        ${P.afil ? `<div class="tw-box"><div class="tw-box-h"><b>Anúncios</b><small>Intervalos de 30, 60 ou 120 segundos durante a live</small></div><button class="btn sm tw-btn" data-act="ads">${ic('ads', 14)} Abrir Anúncios</button></div>` : `<div class="tw-box"><div class="tw-box-h"><b>Ganhe dinheiro com o canal</b><small>Vire afiliado(a) para liberar inscrições e anúncios</small></div><button class="btn sm" data-act="tab" data-t="conquistas">Ver o caminho para afiliado</button></div>`}`;
    },
    act(a, ds, ctx) {
      if (a === 'tab') { ctx.st.tab = ds.t; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'obs') { if (SL.Live.cur && SL.LiveUI) { if (SL.LiveUI.fechaJanela) SL.LiveUI.fechaJanela(); return SL.LiveUI.restore(); } return UI.openApp('pulso'); }
      if (a === 'ads') return SL.LiveUI && SL.LiveUI.janela && SL.Live.cur ? SL.LiveUI.janela('anuncios') : UI.openApp('anuncios');
    },
  };
})(window.SL);

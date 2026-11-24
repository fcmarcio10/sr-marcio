/* Apps menores: iFood (comida), Equipe, Trabalho e cursos, Pessoas, Mapa e Ajustes. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const ic = UI.ic, esc = U.esc, $$ = UI.$$;

  SL.Apps.rango = {
    title: 'iFood', short: 'iFood', icon: 'food', color: 'linear-gradient(135deg,#ff4b55,#d41625)', order: 10, pc: true, phone: true, w: 560, h: 600, watch: ['food', 'money'],
    render(el) {
      const G = SL.G; const pend = G.equip.deliveries.filter(d => d.kind === 'food');
      el.innerHTML = `<div class="app"><div class="app-head"><div class="brandbar"><span class="bl" style="background:#e0402a">${ic('food', 15)}</span>iFood</div></div><div class="app-body">
        ${pend.length ? `<div class="card" style="border-color:var(--warn)">${ic('clock', 14)} Pedido a caminho: chega por volta de ${SL.Clock.fmtTime(pend[0].at)}.</div>` : ''}${G.flags.mealReady ? `<div class="card" style="border-color:var(--ok)"><div class="row"><b class="grow">Seu pedido chegou!</b><button class="btn sm ok" data-act="eat">Comer agora</button></div></div>` : ''}
        <div class="small muted">Entrega só em casa · taxa de R$ 6 · 30 a 55 minutos</div>
        <div class="list">${D.delivery.map(f => `<div class="li"><div class="grow"><b class="small">${esc(f.name)}</b><div class="tiny muted">${Object.entries(f.eat).filter(([k]) => k === 'fome' || k === 'sede').map(([k, v]) => (v > 0 ? '+' : '') + Math.min(100, Math.round(SL.Life.efeito(k, v))) + ' ' + k).join(' · ')}</div></div><span class="mono small ok">${U.money(f.price)}</span><button class="btn sm" data-act="order" data-v="${f.id}" ${pend.length || G.money < f.price + 6 ? 'disabled' : ''}>Pedir</button></div>`).join('')}</div></div></div>`;
    },
    act(a, ds, ctx) {
      if (a === 'order') { const e = SL.Rel.orderFood(ds.v); if (e) return e; UI.toast({ title: 'Pedido feito', text: 'O entregador já está a caminho.', icon: 'food', cat: 'vida' }, 'cash'); return ctx.render(); }
      if (a === 'eat') { SL.G.flags.ate = 1; const e = SL.Rel.eatDelivery(); if (e) return e; return ctx.render(); }
    },
  };

  SL.Apps.equipe = {
    title: 'LinkedIn', short: 'LinkedIn', icon: 'team', color: 'linear-gradient(135deg,#2c8be0,#0a5aa8)', order: 12, pc: true, phone: false, w: 820, h: 620, watch: ['staff', 'money'],
    render(el) {
      const G = SL.G; const roles = [['editor', 'Editores de vídeo', 'Editam seus projetos em horário comercial. Qualidade pela habilidade deles.'], ['moderador', 'Moderadores', 'Silenciam trolls na live automaticamente.'], ['empresario', 'Empresários', 'Trazem propostas melhores e mais frequentes, ficam com uma parte dos patrocínios.']];
      el.innerHTML = `<div class="app"><div class="app-head"><h2>${ic('team', 16)} Equipe</h2><span class="tiny muted" style="margin-left:auto">Salários entram nas contas do mês</span></div><div class="app-body">${roles.map(([r, t, d]) => `<div class="card col"><h3>${t}</h3><p class="tiny muted">${d}</p>${D.npcs.filter(n => n.role === r).map(n => { const hired = G.staff.some(s => s.npc === n.id); return `<div class="row"><canvas data-lk="${n.id}" style="width:40px;height:40px;border-radius:50%"></canvas><div class="grow"><b class="small">${esc(n.name)}</b><div class="tiny muted">${esc(n.job)} · ${n.skill ? 'habilidade ' + n.skill + ' · ' : ''}${n.salary ? U.money0(n.salary) + '/mês' : Math.round(n.cut * 100) + '% dos patrocínios'} · ${esc(n.pers)}</div></div>${hired ? `<span class="tag ok">contratado(a)</span><button class="btn sm ghost" data-act="fire" data-v="${n.id}">Demitir</button>` : `<button class="btn sm primary" data-act="hire" data-v="${n.id}">Contratar</button>`}</div>`; }).join('')}</div>`).join('')}</div></div>`;
      $$('canvas[data-lk]', el).forEach(cv => SL.Avatar.toCanvas(cv, D.npcById(cv.dataset.lk).look, { scale: 1 }));
    },
    act(a, ds, ctx) {
      if (a === 'hire') { const e = SL.Rel.hire(ds.v); if (e) return e; return ctx.render(); }
      if (a === 'fire') return UI.confirm('Demitir', 'A pessoa vai lembrar disso.', () => { SL.Rel.fire(ds.v); ctx.render(); }, 'Demitir', true);
    },
  };

  SL.Apps.trabalho = {
    title: 'Udemy', short: 'Udemy', icon: 'briefcase', color: 'linear-gradient(135deg,#b55cff,#7b23c7)', order: 11, pc: true, phone: false, w: 760, h: 600, watch: ['skills', 'activity'],
    render(el) {
      const G = SL.G; const rate = 14 + G.player.skills.edicao * 0.9;
      el.innerHTML = `<div class="app"><div class="app-head"><h2>${ic('briefcase', 16)} Udemy · cursos e freelas</h2></div><div class="app-body">
        <div class="card col"><h3>Freela de edição</h3><p class="small muted">Edite vídeos de outras pessoas por hora. Paga cerca de ${U.money(rate)}/h (sobe com sua habilidade de edição) e treina edição. Também dá para trabalhar no Café Grão Fino.</p><div class="row wrap">${[1, 2, 4].map(h => `<button class="btn sm" data-act="freela" data-h="${h}">Trabalhar ${h}h (~${U.money0(rate * h)})</button>`).join('')}</div></div>
        <div class="card col"><h3>Cursos online</h3>${D.courses.map(c => { const done = G.courses[c.id] != null; return `<div class="row"><div class="grow"><b class="small">${esc(c.name)}</b><div class="tiny muted">${c.hours}h · melhora ${({ edicao: 'edição', marketing: 'marketing', carisma: 'carisma', culinaria: 'culinária' })[c.skill]}${c.desc ? ' · ' + esc(c.desc) : ''}</div></div>${done ? '<span class="tag ok">concluído</span>' : `<button class="btn sm" data-act="course" data-v="${c.id}">${c.price ? U.money0(c.price) : 'Grátis'}</button>`}</div>`; }).join('')}</div>
</div></div>`;
    },
    act(a, ds) {
      const G = SL.G;
      if (a === 'freela') return SL.Life.start('freela', { hours: +ds.h });
      if (a === 'course') { const c = D.courses.find(x => x.id === ds.v); if (c.price && !SL.Econ.spend(c.price, 'outros', 'Curso: ' + c.name)) return 'Dinheiro insuficiente.'; return SL.Life.start('estudar', { course: c.id, hours: c.hours }, { label: 'Estudando: ' + c.name }); }
      void G;
    },
  };

  SL.Apps.pessoas = {
    title: 'Contatos', short: 'Contatos', icon: 'users', color: 'linear-gradient(135deg,#ff8fc1,#c33b8a)', order: 15, pc: false, phone: true, w: 820, h: 640, watch: ['rel'],
    render(el, ctx) {
      const G = SL.G; const st = ctx.st; st.f = st.f || 'todos';
      const ids = Object.keys(G.rel).filter(id => G.rel[id].met && SL.Rel.def(id));
      const F = { todos: () => true, amigos: id => ['amigo', 'melhor_amigo'].includes(G.rel[id].stage), familia: id => G.rel[id].stage === 'familia', romance: id => ['interesse', 'namorando', 'ex'].includes(G.rel[id].stage), criadores: id => !!D.creatorById(id), trabalho: id => ['editor', 'moderador', 'empresario'].includes((D.npcById(id) || {}).role) };
      const list = ids.filter(F[st.f]).sort((a, b) => G.rel[b].aff - G.rel[a].aff);
      el.innerHTML = `<div class="app"><div class="app-head"><h2>${ic('users', 16)} Pessoas</h2><div class="row wrap" style="margin-left:auto">${Object.keys(F).map(k => `<button class="chip ${st.f === k ? 'on' : ''}" data-act="f" data-v="${k}">${({ todos: 'Todos', amigos: 'Amizades', familia: 'Família', romance: 'Romance', criadores: 'Criadores', trabalho: 'Trabalho' })[k]}</button>`).join('')}</div></div><div class="app-body">
        <div class="list">${list.map(id => { const r = G.rel[id], d = SL.Rel.def(id); return `<div class="li click" data-act="talk" data-v="${id}"><canvas data-lk="${id}" style="width:40px;height:40px;border-radius:50%"></canvas><div class="grow"><b class="small">${esc(d.name)}</b><div class="tiny muted">${esc(d.job || 'Criador(a) de conteúdo')} · ${esc(SL.Rel.STAGES[r.stage] || '')}${r.flags.conflict ? ' · <span class="bad">chateado(a)</span>' : ''}${r.plan ? ' · compromisso marcado' : ''}</div><div class="bar thin" style="margin-top:4px;max-width:220px"><i style="width:${(r.aff + 100) / 2}%;background:${r.aff >= 0 ? 'var(--ok)' : 'var(--bad)'}"></i></div></div><span class="tiny muted">${r.last ? SL.Clock.ago(r.last) : ''}</span></div>`; }).join('') || '<div class="empty">Conheça gente nos lugares da cidade, em eventos e nas redes.</div>'}</div>
        <p class="tiny muted">Cada pessoa frequenta lugares em horários próprios. Conversas pessoalmente rendem mais que por mensagem.</p></div></div>`;
      $$('canvas[data-lk]', el).forEach(cv => SL.Avatar.toCanvas(cv, SL.Rel.def(cv.dataset.lk).look, { scale: 1 }));
    },
    act(a, ds, ctx) { if (a === 'f') { ctx.st.f = ds.v; return ctx.render(); } if (a === 'talk') SL.HUD.talk(ds.v, 'msg'); },
  };

  SL.Apps.mapa = {
    title: 'Maps', short: 'Maps', icon: 'map', color: 'linear-gradient(135deg,#5fae3e,#2f6a2a)', order: 16, pc: false, phone: true, watch: ['loc', 'tick:hour'],
    render(el) {
      const G = SL.G; const here = SL.City.here();
      el.innerHTML = `<div class="app"><div class="app-head"><h2>${ic('map', 16)} Mapa da cidade</h2></div><div class="app-body"><div class="small muted">Você está em: <b>${esc((D.placeById(here) || {}).name || '')}</b></div><div class="list">${D.places.filter(p => p.id !== here).map(p => { const o = SL.City.options(p.id)[0]; return `<div class="li click" data-act="go" data-v="${p.id}"><span class="ava" style="width:34px;height:34px;background:${p.color}">${ic(p.icon, 16)}</span><div class="grow"><b class="small">${esc(p.name)}</b><div class="tiny ${SL.City.isOpen(p.id) ? 'ok' : 'bad'}">${SL.City.isOpen(p.id) ? 'aberto' : 'fechado'} · ${o.km.toFixed(1).replace('.', ',')} km · a pé ${U.dur(o.min)}</div></div>${ic('chevR', 15)}</div>`; }).join('')}</div></div></div>`;
      void G;
    },
    act(a, ds) { if (a === 'go') { UI.closePhone(); if (SL.G.loc.area === 'casa') SL.City.goOutside(() => SL.HUD.travelDialog(ds.v)); else SL.HUD.travelDialog(ds.v); } },
  };

  SL.Apps.ajustes = {
    title: 'Ajustes', short: 'Ajustes', icon: 'settings', color: 'linear-gradient(135deg,#475069,#2a3142)', order: 99, pc: false, phone: false, w: 620, h: 620,
    render(el) {
      el.innerHTML = `<div class="app"><div class="app-head"><h2>${ic('settings', 16)} Ajustes</h2></div><div class="app-body"><div class="card"><h3>Salvar</h3><div class="row wrap">${['1', '2', '3'].map(s => `<button class="btn sm" data-act="save" data-v="${s}">${ic('save', 14)} Espaço ${s}</button>`).join('')}<button class="btn sm" data-act="exp">Exportar</button></div></div><div class="card">${SL.Screens.settingsHTML()}</div></div></div>`;
      SL.Screens.bindSettings(el);
    },
    act(a, ds) {
      if (a === 'save') { const e = SL.Save.write(ds.v); if (e) return e; UI.toast({ title: 'Jogo salvo', text: 'Espaço ' + ds.v, icon: 'save', cat: 'sistema' }, 'success'); }
      if (a === 'exp') SL.Screens.exportDialog();
    },
  };
})(window.SL);

// Central de notificações: só no celular
(function (SL) {
  const U = SL.U, UI = SL.UI;
  SL.Apps.notificacoes = {
    title: 'Notificações', short: 'Avisos', icon: 'bell', color: 'linear-gradient(135deg,#5b6378,#30364a)', order: 17, pc: false, phone: true, watch: ['notif'],
    badge: () => SL.Notify.unread(),
    render(el) {
      const G = SL.G; const items = G.notifs.slice().reverse().slice(0, 60);
      const col = id => (SL.Notify.CATS[id] || SL.Notify.CATS.sistema).color;
      el.innerHTML = `<div class="app-body col"><div class="row between"><h3>Notificações</h3>${items.some(n => !n.read) ? '<button class="btn sm" data-act="readall">Marcar como lidas</button>' : ''}</div>
        <div class="col gap4">${items.length ? items.map(n => `<button class="nitem ${n.read ? '' : 'unread'}" data-act="open" data-n="${n.id}"><span class="ti" style="background:${U.rgba(col(n.cat), 0.16)};color:${col(n.cat)}">${UI.ic(n.icon || 'info', 15)}</span><span class="grow"><b>${U.esc(n.title)}</b><p>${U.esc(n.text || '')}</p><time>${SL.Clock.fmtStamp(n.t)}</time></span></button>`).join('') : '<div class="empty">Nada por aqui ainda.</div>'}</div></div>`;
    },
    act(a, ds, ctx) {
      const G = SL.G;
      if (a === 'readall') { SL.Notify.readAll(); ctx.render(); }
      if (a === 'open') { const n = G.notifs.find(x => x.id === ds.n); if (!n) return; n.read = true; SL.bus.emit('notif'); if (n.app) UI.openApp(n.app, n.args); else ctx.render(); }
    },
  };
})(window.SL);

// Steam: biblioteca de jogos do computador (jogar para treinar e abrir a live já no jogo)
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI; const ic = UI.ic, esc = U.esc;
  SL.Apps.steam = {
    title: 'Steam', short: 'Steam', icon: 'gamepad', color: 'linear-gradient(135deg,#2a475e,#171a21)', order: 3, pc: true, phone: false, w: 900, h: 620, watch: ['activity', 'equip'],
    render(el) {
      const G = SL.G; const a = G.act; const playing = a && a.id === 'pc_lazer';
      el.innerHTML = `<div class="app"><div class="app-head"><h2>${ic('gamepad', 16)} Biblioteca</h2><span class="tiny muted">Jogar sozinho treina a habilidade em jogos (sem câmera, sem público).</span></div><div class="app-body">
        ${playing ? `<div class="card row"><span class="acc">${ic('gamepad', 20)}</span><div class="grow"><b>${esc(a.label)}</b><div class="bar thin"><i data-actprog style="width:${SL.Life.progress() * 100}%"></i></div><small class="tiny muted" data-actfim></small></div><button class="btn sm" data-act="stop">Parar</button></div>` : ''}
        <div class="lib">${D.games.map(g => { const cs = SL.Equip.canStream(g, '480p'); return `<div class="lib-g ${cs.ok ? '' : 'no'}"><span class="lib-c" style="background:${g.color}"></span><div class="grow"><b>${esc(g.name)}</b><small>${esc(g.cat)}${cs.ok ? '' : ' · ' + esc(cs.reason || 'indisponível')}</small></div>
          <button class="btn sm" data-act="play" data-g="${g.id}" ${cs.ok && !playing ? '' : 'disabled'}>${ic('play', 14)} Jogar 1h</button><button class="btn sm live" data-act="stream" data-g="${g.id}" ${cs.ok ? '' : 'disabled'}>${ic('live', 14)} Live</button></div>`; }).join('')}</div></div></div>`;
    },
    act(a, ds, ctx) {
      if (a === 'stop') { SL.Life.stop(false); ctx.render(); return; }
      if (a === 'play') { const g = D.gameById(ds.g); const r = SL.Life.start('pc_lazer', { game: g.id }, { label: 'Jogando ' + g.name }); if (r) return r; ctx.render(); return; }
      if (a === 'stream') { UI.openApp('pulso'); const w = UI.wins.find(x => x.app === 'pulso'); if (w) { w.ctx.st.tab = 'transmitir'; if (w.ctx.st.form) w.ctx.st.form.game = ds.g; else w.ctx.st.pendingGame = ds.g; w.ctx.render(); } }
    },
  };
})(window.SL);

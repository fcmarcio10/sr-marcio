/* Painel do jogo: barra superior, painel lateral, cliques no cenário (casa, cidade e lugares), conversas e compras presenciais. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const $ = UI.$, $$ = UI.$$;
  const HUD = SL.HUD = {};
  let refs = {};

  HUD.build = () => {
    const hud = $('#hud');
    hud.innerHTML = `<div class="hud-me" data-h="me" title="Estatísticas e carreira"><canvas></canvas><div><b class="ellipsis"></b><small></small></div></div>
      <div class="hud-clock"><div><div class="t mono"></div><div class="d"></div></div><div class="speeds">${[['pause', 0, 'Pausar (espaço)'], ['speed1', 1, 'Normal (1)'], ['speed2', 2, 'Rápido (2)'], ['speed3', 3, 'Muito rápido (3)']].map(([ic, v, t]) => `<button class="ibtn" data-speed="${v}" title="${t}">${UI.ic(ic, 15)}</button>`).join('')}</div></div>
      <div class="hud-right"><span class="pill money" data-h="bank" title="Banco">${UI.ic('money', 15)}<span class="mv"></span></span><span class="pill fol" data-h="stats" title="Seguidores somados em todas as redes">${UI.ic('users', 15)}<span class="fv"></span><span class="lbl small">seguidores</span></span>
      <button class="ibtn" data-h="phone" title="Celular (C)">${UI.ic('phone')}</button><button class="ibtn" data-h="pc" title="Computador (P)">${UI.ic('laptop')}</button><button class="ibtn bell" data-h="notif" title="Notificações">${UI.ic('bell')}<span class="badge" hidden></span></button><button class="ibtn" data-h="menu" title="Menu (Esc)">${UI.ic('more')}</button></div>`;
    refs = { cv: $('.hud-me canvas', hud), name: $('.hud-me b', hud), tier: $('.hud-me small', hud), t: $('.hud-clock .t', hud), d: $('.hud-clock .d', hud), money: $('.pill.money', hud), mv: $('.mv', hud), fv: $('.fv', hud), badge: $('.bell .badge', hud) };
    hud.onclick = e => {
      const b = e.target.closest('[data-h],[data-speed]'); if (!b) return; SL.audio.play('click');
      if (b.dataset.speed != null) { SL.G.time.speed = +b.dataset.speed; HUD.update(true); return; }
      const h = b.dataset.h;
      if (h === 'phone') UI.phoneOpen() ? UI.closePhone() : UI.openPhone();
      if (h === 'pc') UI.pcOpen() ? UI.closePC() : HUD.goToPC();
      if (h === 'notif') UI.toggleNotifs();
      if (h === 'menu') SL.Screens.pauseMenu();
      if (h === 'bank') UI.openApp('banco');
      if (h === 'stats' || h === 'me') UI.openApp('stats');
    };
    HUD.paintPortrait();
    $('#side').onclick = HUD.sideClick;
  };
  HUD.paintPortrait = () => { if (refs.cv) SL.Avatar.toCanvas(refs.cv, SL.G.player.look, { scale: 1.05 }); };
  let lastSide = 0;
  HUD.update = force => {
    const G = SL.G; if (!G || !refs.t) return;
    refs.t.textContent = SL.Clock.fmtTime(G.time.t); refs.d.textContent = SL.Clock.fmtDate(G.time.t);
    refs.name.textContent = G.player.channel; refs.tier.textContent = SL.Career.tierName();
    refs.mv.textContent = U.money0(G.money); refs.money.classList.toggle('neg', G.money < 0);
    refs.fv.textContent = U.num(SL.Social.totalFollowers());
    const un = SL.Notify.unread(); refs.badge.hidden = !un; refs.badge.textContent = un > 99 ? '99+' : un;
    $$('#hud [data-speed]').forEach(b => b.classList.toggle('on', +b.dataset.speed === G.time.speed));
    const now = performance.now();
    if (force || now - lastSide > 450) { lastSide = now; HUD.side(); }
  };

  // ---------- painel lateral ----------
  HUD.side = () => {
    const G = SL.G; const el = $('#side'); if (!el) return;
    const n = G.needs; const perf = SL.Life.perf();
    const a = G.act;
    const where = G.loc.area === 'casa' ? (D.homeById(G.home.id).name + (SL.HomeScene.currentRoom() ? ' · ' + (SL.HomeScene.LAY[D.homeById(G.home.id).layout].rooms.find(r => r.id === SL.HomeScene.currentRoom()) || {}).name : '')) : G.loc.area === 'cidade' ? 'Na rua' : (D.placeById(G.loc.place) || {}).name;
    const upcoming = SL.Calendar.upcoming(4);
    const goals = SL.Goals.next(3);
    const warns = SL.Life.warnings();
    el.innerHTML = `
      <div class="side-h"><div class="upper">Necessidades</div><span class="tag ${perf >= 0.95 ? 'ok' : perf >= 0.75 ? 'warn' : 'bad'}" title="Desempenho geral: afeta lives, edição e conversas">${UI.ic('energy', 12)} ${Math.round(perf * 100)}%</span></div>
      <div class="needs">${SL.Life.NEEDS.map(nd => { const v = n[nd.k]; const good = nd.inv ? 100 - v : v; return `<div class="need ${good < 25 ? 'low' : ''}" title="${nd.label}: ${Math.round(v)}"><div class="nl">${UI.ic(nd.icon, 13)}${nd.label}<b>${Math.round(v)}</b></div><div class="bar"><i style="width:${v}%;background:${good < 25 ? 'var(--bad)' : nd.color}"></i></div></div>`; }).join('')}</div>
      ${warns.length ? `<div class="warns">${warns.map(w => `<span class="tag bad">${U.esc(w)}</span>`).join('')}</div>` : ''}
      ${a && a.id !== 'usar_pc' ? `<div class="act-card"><div class="row"><span class="acc">${UI.ic(SL.Life.ACT[a.id].icon, 16)}</span><b class="grow small">${U.esc(a.label)}</b>${a.id !== 'live' ? `<button class="btn sm ghost" data-s="stop" title="Parar">${UI.ic('x', 14)}</button>` : ''}</div>${a.dur ? `<div class="bar thin"><i style="width:${SL.Life.progress() * 100}%"></i></div><div class="tiny muted">${U.dur(Math.max(0, a.dur - (G.time.t - a.t0)))} restantes · o tempo passa mais rápido</div>` : ''}</div>` : ''}
      <div class="card flat col gap4" style="padding:10px"><div class="row small"><span class="acc">${UI.ic('location', 15)}</span><b class="grow ellipsis">${U.esc(where || '')}</b></div>
        <div class="quick">${G.loc.area === 'casa' ? `<button class="btn" data-s="pc">${UI.ic('laptop', 15)} Computador</button><button class="btn" data-s="sair">${UI.ic('door', 15)} Sair de casa</button>` : G.loc.area === 'local' ? `<button class="btn" data-s="rua">${UI.ic('map', 15)} Voltar à rua</button><button class="btn" data-s="casa">${UI.ic('home', 15)} Ir para casa</button>` : `<button class="btn" data-s="casa">${UI.ic('home', 15)} Ir para casa</button><button class="btn" data-s="entrar">${UI.ic('door', 15)} Entrar aqui</button>`}
        <button class="btn" data-s="phone">${UI.ic('phone', 15)} Celular</button><button class="btn" data-s="rango">${UI.ic('food', 15)} Pedir comida</button></div></div>
      ${G.flags.mealReady ? `<button class="btn ok" data-s="comerpedido">${UI.ic('food', 15)} Comer o pedido que chegou</button>` : ''}
      <div><div class="side-h"><div class="upper">Próximos compromissos</div><button class="btn sm ghost" data-s="cal">${UI.ic('calendar', 14)}</button></div>
        <div class="list agenda">${upcoming.length ? upcoming.map(e => { const k = SL.Calendar.KINDS[e.kind] || SL.Calendar.KINDS.especial; return `<div class="li"><span class="dot" style="background:${k.color}"></span><span class="grow ellipsis">${U.esc(e.title)}</span><span class="muted tiny mono">${e.day === SL.Clock.day() ? (e.hour != null ? e.hour + 'h' : 'hoje') : SL.Clock.fmtDay(e.day).slice(5)}</span></div>`; }).join('') : '<div class="li muted small">Agenda livre</div>'}</div></div>
      <div><div class="side-h"><div class="upper">Objetivos</div><button class="btn sm ghost" data-s="goals">${UI.ic('trophy', 14)}</button></div>
        <div class="list">${goals.map(g => { const s = SL.Goals.status(g); return `<div class="li" style="flex-direction:column;align-items:stretch;gap:4px"><div class="small"><b>${U.esc(g.title)}</b></div>${g.hint ? `<div class="tiny muted">${U.esc(g.hint)}</div>` : ''}${s.b ? `<div class="bar thin"><i style="width:${s.p * 100}%"></i></div><div class="tiny muted mono">${U.num(s.a)} / ${U.num(s.b)}</div>` : ''}</div>`; }).join('')}</div></div>`;
  };
  HUD.sideClick = e => {
    const b = e.target.closest('[data-s]'); if (!b) return; SL.audio.play('click');
    const G = SL.G; const s = b.dataset.s;
    if (s === 'stop') SL.Life.stop(false);
    if (s === 'pc') HUD.goToPC();
    if (s === 'sair') HUD.leaveHome();
    if (s === 'rua') SL.City.goOutside();
    if (s === 'casa') { if (G.loc.area === 'cidade' && G.loc.place === 'casa') SL.City.enter('casa'); else HUD.travelDialog('casa'); }
    if (s === 'entrar') SL.City.enter(G.loc.place);
    if (s === 'phone') UI.openPhone();
    if (s === 'rango') UI.openApp('rango');
    if (s === 'cal') UI.openApp('calendario');
    if (s === 'goals') UI.openApp('stats', { tab: 'objetivos' });
    if (s === 'comerpedido') { const err = SL.Rel.eatDelivery(); UI.err(err); G.flags.ate = 1; }
    HUD.update(true);
  };
  HUD.goToPC = () => {
    const G = SL.G;
    if (G.loc.area !== 'casa') return UI.err('O computador está em casa.');
    const o = SL.HomeScene.objects().find(x => x.id === 'mesa');
    SL.HomeScene.goToObject(o, () => UI.openPC());
  };
  HUD.leaveHome = () => {
    const o = SL.HomeScene.objects().find(x => x.id === 'porta');
    if (SL.G.act && SL.G.act.id !== 'usar_pc') return UI.err('Termine o que está fazendo primeiro.');
    SL.HomeScene.goToObject(o, () => SL.City.goOutside());
  };

  // ---------- ações dos objetos da casa ----------
  HUD.objectActions = o => {
    const G = SL.G; const L = SL.Life; const it = G.home.items; const out = [];
    const busy = G.act && G.act.id !== 'usar_pc';
    const life = (id, data, label) => () => { const r = L.start(id, data, label ? { label } : undefined); if (!r && id === 'comer') G.flags.ate = 1; return r; };
    const why = !busy ? null : 'Termine: ' + G.act.label;
    const add = (label, icon, fn, sub, dis, w) => out.push({ label, icon, fn, sub, disabled: dis || !!why, why: w || why });
    switch (o.kind) {
      case 'cama': {
        add('Dormir até descansar', 'sleep', life('dormir', {}), 'até o sono encher');
        const h = SL.Clock.hour(); [7, 9].forEach(hh => { const day = SL.Clock.day() + (h >= hh ? 1 : 0); add('Dormir até ' + hh + 'h', 'clock', life('dormir', { until: day * 1440 + hh * 60 }, 'Dormindo até ' + hh + 'h')); });
        add('Cochilar', 'sleep', life('cochilar'), '1h'); add('Ler um livro', 'book', life('ler'), '1h');
        break;
      }
      case 'mesa': out.push({ label: 'Usar o computador', icon: 'laptop', fn: () => UI.openPC() }); break;
      case 'bike': add('Pedalar', 'bike', life('bike'), '40 min'); break;
      case 'chuveiro': add('Banho rápido', 'shower', life('banho'), '15 min'); add('Banho demorado', 'shower', life('banho_longo'), '35 min · relaxa'); break;
      case 'pia_b': add('Escovar os dentes e se arrumar', 'hygiene', life('escovar'), '6 min'); break;
      case 'vaso': out.push({ label: 'Nada para fazer aqui', icon: 'info', disabled: true }); break;
      case 'geladeira': {
        const stock = L.stockList().filter(s => !s.food.cook && !s.food.coffee);
        stock.forEach(s => add('Comer ' + s.food.name.toLowerCase(), 'food', life('comer', { food: s.food.id }), s.n + 'x'));
        if (!stock.length) out.push({ label: 'Geladeira vazia: vá ao mercado', icon: 'cart', disabled: true });
        out.push({ label: 'Ver o que tem em casa', icon: 'fridge', fn: HUD.stockDialog });
        break;
      }
      case 'fogao': add('Cozinhar uma refeição', 'stove', life('cozinhar'), L.foodCount('ingredientes') + ' ingredientes', !L.foodCount('ingredientes'), 'Compre ingredientes no mercado'); add('Passar café', 'coffee', life('cafe'), L.foodCount('cafe') + ' doses', !L.foodCount('cafe'), 'Compre café no mercado'); break;
      case 'pia': add('Beber água', 'drink', life('beber'), '2 min'); break;
      case 'cafeteira': add('Passar café', 'coffee', life('cafe'), L.foodCount('cafe') + ' doses', !L.foodCount('cafe'), 'Compre café no mercado'); break;
      case 'sofa': add('Descansar', 'sofa', life('descansar'), '30 min'); add('Ler um livro', 'book', life('ler'), '1h'); if (it.tv) add('Assistir TV', 'tv', life('tv'), '1h'); break;
      case 'tv': if (it.tv) add('Assistir TV', 'tv', life('tv'), '1h · descobre tendências'); if (G.equip.setup.console && it.tv) add('Jogar videogame', 'gamepad', life('videogame'), '1h'); if (!it.tv) out.push({ label: 'Compre uma TV para usar o console', icon: 'tv', disabled: true }); break;
      case 'armario': add('Limpar a casa', 'broom', life('limpar'), 'sujeira ' + Math.round(G.home.dirt) + '%'); break;
      case 'porta': out.push({ label: 'Sair de casa', icon: 'door', fn: () => SL.City.goOutside() }); out.push({ label: 'Pedir comida (Rangô)', icon: 'food', fn: () => UI.openApp('rango') }); break;
      case 'guarda': out.push({ label: 'Trocar de roupa', icon: 'user', fn: () => HUD.lookDialog(false) }); break;
      case 'mesa_jantar': if (G.flags.mealReady) out.push({ label: 'Comer o pedido', icon: 'food', fn: () => { G.flags.ate = 1; return SL.Rel.eatDelivery(); } }); else out.push({ label: 'Mesa vazia', icon: 'info', disabled: true }); break;
      case 'estudio': if (!G.home.studio) out.push({ label: 'Construir o estúdio', icon: 'sparkle', sub: U.money0(D.STUDIO_COST), fn: () => UI.confirm('Construir estúdio', 'A obra custa ' + U.money(D.STUDIO_COST) + ' e deixa o cenário, o som e a imagem das suas lives muito melhores.', () => UI.err(SL.Home.buildStudio()), 'Construir') }); else out.push({ label: 'Usar o estúdio (computador)', icon: 'live', fn: () => UI.openPC() }); break;
      case 'planta': add('Regar a planta', 'plant', life('regar'), '3 min'); out.push({ label: 'Vender (25%)', icon: 'coin', fn: () => SL.Home.removeDeco(o.deco) }); break;
      case 'luz': out.push({ label: 'Iluminação do setup', icon: 'light', disabled: true }); break;
      default: if (o.deco != null) { out.push({ label: 'Decoração (melhora o cenário)', icon: 'sparkle', disabled: true }); out.push({ label: 'Vender (25%)', icon: 'coin', fn: () => SL.Home.removeDeco(o.deco) }); }
    }
    return out;
  };
  HUD.stockDialog = () => {
    const L = SL.Life; const list = L.stockList(); const day = SL.Clock.day();
    UI.modal({ title: 'Comida em casa', icon: 'fridge', sub: 'Geladeira: ' + L.fridgeUsed() + '/' + L.fridgeCap() + ' porções perecíveis', html: list.length ? `<div class="list">${list.map(s => `<div class="li"><b class="grow">${U.esc(s.food.name)}</b><span class="mono">${s.n}x</span><span class="tiny muted">${s.exp > 9000 ? 'não estraga' : s.exp - day <= 1 ? '<span class="bad">vence amanhã</span>' : 'vence em ' + (s.exp - day) + ' dias'}</span></div>`).join('')}</div>` : '<div class="empty">Nada em casa. Compre no Mercado Bom Preço ou peça no Rangô.</div>', buttons: [{ label: 'Fechar' }] });
  };

  // ---------- visual (roupas) ----------
  HUD.lookDialog = paid => {
    const G = SL.G; const look = JSON.parse(JSON.stringify(G.player.look));
    const sw = (k, list) => `<div class="swatches">${list.map(c => `<button class="sw ${look[k] === c ? 'on' : ''}" style="background:${c}" data-k="${k}" data-v="${c}"></button>`).join('')}</div>`;
    const html = () => `<div class="row top gap16"><canvas id="lk-prev" style="width:150px;height:150px;border-radius:14px;flex:none"></canvas><div class="col grow"><div class="field"><label>Camiseta</label>${sw('shirt', D.shirtColors)}</div><div class="field"><label>Calça</label>${sw('pants', ['#2a2f3d', '#3a4a6b', '#4a3a2a', '#5a5f6e', '#1d2230', '#7a2e3a'])}</div>${paid ? `<div class="field"><label>Cabelo</label><div class="row wrap">${D.hairStyles.map((h, i) => `<button class="chip ${look.hair === i ? 'on' : ''}" data-hair="${i}">${h}</button>`).join('')}</div></div><div class="field"><label>Cor do cabelo</label>${sw('hairColor', D.hairColors)}</div><div class="field"><label>Acessório</label><div class="row wrap">${['Nenhum', 'Óculos', 'Boné', 'Fone'].map((a, i) => `<button class="chip ${look.acc === i ? 'on' : ''}" data-acc="${i}">${a}</button>`).join('')}</div></div>` : '<p class="small muted">Corte de cabelo e acessórios novos: Shopping Aurora.</p>'}</div></div>`;
    const m = UI.modal({ title: paid ? 'Mudar o visual' : 'Trocar de roupa', icon: 'user', wide: true, html: html(), buttons: [{ label: 'Cancelar' }, { label: paid ? 'Comprar (R$ 140)' : 'Vestir', cls: 'primary', fn: () => { if (paid && !SL.Econ.spend(140, 'lazer', 'Visual novo no shopping')) { UI.err('Dinheiro insuficiente.'); return false; } G.player.look = look; HUD.paintPortrait(); if (paid) SL.Life.mod({ humor: 6 }); G.flags.lastLook = G.time.t; } }] });
    const bind = () => { SL.Avatar.toCanvas($('#lk-prev', m.el), look, { expr: 'feliz' }); $$('[data-k]', m.el).forEach(b => b.onclick = () => { look[b.dataset.k] = b.dataset.v; m.body.innerHTML = html(); bind(); }); $$('[data-hair]', m.el).forEach(b => b.onclick = () => { look.hair = +b.dataset.hair; m.body.innerHTML = html(); bind(); }); $$('[data-acc]', m.el).forEach(b => b.onclick = () => { look.acc = +b.dataset.acc; m.body.innerHTML = html(); bind(); }); };
    bind();
  };

  // ---------- cidade e lugares ----------
  HUD.travelDialog = toId => {
    const G = SL.G; const p = D.placeById(toId); const here = SL.City.here();
    if (toId === here) { SL.City.enter(toId); return; }
    const opts = SL.City.options(toId); const open = SL.City.isOpen(toId);
    const m = UI.modal({ title: p.id === 'casa' ? 'Voltar para casa' : p.name, icon: p.icon, sub: (open ? 'Aberto agora' : 'Fechado agora') + ' · ' + opts[0].km.toFixed(1).replace('.', ',') + ' km · abre ' + p.open[0] + 'h–' + (p.open[1] % 24) + 'h',
      html: `<div class="col">${opts.map(o => `<button class="choice" data-tr="${o.tr.id}"><div class="row"><span class="acc">${UI.ic(o.tr.icon, 18)}</span><b class="grow">${o.tr.name}</b><span class="mono small">${U.dur(o.min)}</span><span class="mono small ok" style="width:70px;text-align:right">${o.cost ? U.money(o.cost) : 'grátis'}</span></div></button>`).join('')}</div>${!open && p.kind !== 'casa' ? '<p class="small warn">Chegando lá você vai encontrar a porta fechada.</p>' : ''}` });
    $$('[data-tr]', m.el).forEach(b => b.onclick = () => { m.close(); UI.err(SL.City.travel(toId, b.dataset.tr)); });
  };
  HUD.placePanel = () => {
    const G = SL.G; const host = $('#stage-ui'); let el = $('.place-panel', host);
    if (G.loc.area !== 'local') { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'place-panel'; host.appendChild(el); el.onclick = HUD.placeClick; }
    const p = D.placeById(G.loc.place); const open = SL.City.isOpen(p.id);
    const acts = SL.City.activities(p.id);
    const people = [...new Set(SL.Rel.presentAt(p.id).concat(SL.Rel.planHere(p.id)))];
    const busy = G.act && G.act.id !== 'usar_pc';
    const sig = JSON.stringify([p.id, open, acts.map(a => a.id + a.disabled + a.price), people, busy, G.money > 0, Math.floor(G.time.t / 30)]);
    if (el.dataset.sig === sig) return; el.dataset.sig = sig;
    HUD._acts = acts;
    el.innerHTML = `<header><div class="pi" style="background:${p.color}">${UI.ic(p.icon, 20)}</div><div class="grow"><b>${U.esc(p.name)}</b><div class="tiny ${open ? 'ok' : 'bad'}">${open ? 'Aberto' : 'Fechado'} · ${p.open[0]}h às ${p.open[1] % 24}h</div></div></header>
      <div class="pbody">
        <div class="col gap4">${acts.map((a, i) => `<button class="act-btn" data-pa="${i}" ${a.disabled || (busy && !a.ui) ? 'disabled' : ''} ${a.hl ? 'style="border-color:var(--live)"' : ''}><span class="ai">${UI.ic(a.icon, 17)}</span><span class="grow"><b>${U.esc(a.label)}</b><small>${U.esc(a.disabled && a.why ? a.why : a.desc || '')}</small></span>${a.price ? `<span class="price">${U.money0(a.price)}</span>` : ''}</button>`).join('')}</div>
        <div><div class="upper" style="margin-bottom:6px">Pessoas aqui</div>${people.length ? `<div class="people">${people.map(id => `<button class="person" data-person="${id}"><canvas data-look="${id}"></canvas><span class="small">${SL.Rel.get(id).met ? U.esc(SL.Rel.name(id)) : 'Alguém novo'}</span></button>`).join('')}</div>` : '<div class="small muted">Ninguém conhecido agora. Cada pessoa tem horários próprios.</div>'}</div>
        <div class="row"><button class="btn sm grow" data-pp="rua">${UI.ic('map', 14)} Voltar à rua</button><button class="btn sm grow" data-pp="casa">${UI.ic('home', 14)} Ir para casa</button></div>
      </div>`;
    $$('[data-look]', el).forEach(cv => SL.Avatar.toCanvas(cv, SL.Rel.def(cv.dataset.look).look, { scale: 1 }));
  };
  HUD.placeClick = e => {
    const G = SL.G;
    const pa = e.target.closest('[data-pa]'); if (pa) { SL.audio.play('click'); const a = HUD._acts[+pa.dataset.pa]; if (!a) return; if (a.ui) return HUD.placeUI(a.ui); if (a.run) { const r = a.run(); UI.err(r); } return; }
    const pe = e.target.closest('[data-person]'); if (pe) { HUD.talk(pe.dataset.person); return; }
    const pp = e.target.closest('[data-pp]'); if (pp) { if (pp.dataset.pp === 'rua') SL.City.goOutside(); else HUD.travelDialog('casa'); }
    void G;
  };
  HUD.placeUI = kind => {
    const G = SL.G;
    if (kind === 'mercado') return HUD.marketDialog();
    if (kind === 'loja_fisica') return UI.openPhone('loja', { physical: true, tab: 'equip' });
    if (kind === 'moveis_fisica') return UI.openPhone('loja', { physical: true, tab: 'casa' });
    if (kind === 'visual') return HUD.lookDialog(true);
    if (kind === 'foto') return UI.openPhone('connect', { compose: true, photo: 'lugar' });
    if (kind === 'vlog') {
      const m = UI.modal({ title: 'Gravar vlog', icon: 'cam', sub: 'Câmera: ' + ((SL.Equip.item('vlogcam') || { name: 'celular comum' }).name), html: '<div class="col">' + [60, 120, 180].map(mn => `<button class="choice" data-mn="${mn}"><b>${U.dur(mn)} de gravação</b><small>Mais tempo = mais momentos para escolher</small></button>`).join('') + '</div>' });
      $$('[data-mn]', m.el).forEach(b => b.onclick = () => { m.close(); UI.err(SL.Videos.startRecording({ kind: 'vlog', minutes: +b.dataset.mn, place: G.loc.place })); });
    }
  };
  HUD.marketDialog = () => {
    const cart = {}; const L = SL.Life;
    const html = () => { const total = Object.keys(cart).reduce((s, id) => s + D.foodById(id).price * cart[id], 0); return `<div class="list">${D.foods.map(f => `<div class="li"><div class="grow"><b class="small">${U.esc(f.name)}</b><div class="tiny muted">${f.portions} porç${f.portions > 1 ? 'ões' : 'ão'}${f.perish ? ' · estraga em ' + f.perish + ' dias' : ''}${f.cook ? ' · precisa cozinhar' : ''}</div></div><span class="mono small ok">${U.money(f.price)}</span><button class="ibtn" data-m="-${f.id}">${UI.ic('minus', 14)}</button><b class="mono" style="width:18px;text-align:center">${cart[f.id] || 0}</b><button class="ibtn" data-m="+${f.id}">${UI.ic('plus', 14)}</button></div>`).join('')}</div><div class="row between"><span class="small muted">Geladeira: ${L.fridgeUsed()}/${L.fridgeCap()} porções perecíveis</span><b class="mono">Total: ${U.money(total)}</b></div>`; };
    const m = UI.modal({ title: 'Mercado Bom Preço', icon: 'cart', wide: true, html: html(), buttons: [{ label: 'Cancelar' }, { label: 'Pagar e levar para casa', cls: 'primary', fn: () => {
      const total = Object.keys(cart).reduce((s, id) => s + D.foodById(id).price * cart[id], 0); if (!total) return;
      if (!SL.Econ.spend(Math.round(total * 100) / 100, 'comida', 'Compras no mercado')) { UI.err('Dinheiro insuficiente.'); return false; }
      let lost = 0; Object.keys(cart).forEach(id => { const f = D.foodById(id); const want = cart[id] * f.portions; const got = L.addFood(id, want); lost += want - got; });
      UI.toast({ title: 'Compras guardadas', text: lost ? lost + ' porções não couberam na geladeira e ficaram para trás.' : 'Tudo guardado em casa.', icon: 'cart', cat: 'vida' }, 'cash');
    } }] });
    m.body.onclick = e => { const b = e.target.closest('[data-m]'); if (!b) return; const id = b.dataset.m.slice(1); cart[id] = Math.max(0, (cart[id] || 0) + (b.dataset.m[0] === '+' ? 1 : -1)); m.body.innerHTML = html(); };
  };

  // ---------- conversa com uma pessoa ----------
  HUD.talk = (id, via) => {
    const R = SL.Rel; const def = R.def(id); const r = R.get(id); if (!def || !r) return;
    if (!r.met && via !== 'msg') R.meet(id);
    let line = r.met ? U.pick(['Oi! Tudo bem?', 'E aí, como você tá?', 'Olha quem apareceu!']) : 'Oi... a gente se conhece?';
    const m = UI.modal({ title: def.name, icon: 'chat', wide: true, sub: (def.job || 'Criador(a) de conteúdo') + (def.age ? ' · ' + def.age + ' anos' : ''), html: '' });
    const draw = () => {
      const romanceOk = R.prefAllows(def);
      const acts = R.ACTIONS.filter(a => (!a.romance || romanceOk) && (!a.conflict || r.flags.conflict) && (!a.gift || SL.G.flags.gifts > 0));
      m.body.innerHTML = `<div class="row top gap16 wrap"><canvas id="tk-p" style="width:130px;height:130px;border-radius:50%;flex:none"></canvas><div class="col grow" style="min-width:220px">
        <div class="row"><span class="tag acc">${R.STAGES[r.stage] || r.stage}</span>${r.flags.conflict ? '<span class="tag bad">Chateado(a) com você</span>' : ''}${SL.G.staff.some(s => s.npc === id) ? '<span class="tag ok">Na sua equipe</span>' : ''}</div>
        <div class="card flat" style="font-size:1.02em">“${U.esc(line)}”</div>
        <div class="relbar">Afinidade<div class="bar"><i style="width:${(r.aff + 100) / 2}%;background:${r.aff >= 0 ? 'var(--ok)' : 'var(--bad)'}"></i></div><b>${Math.round(r.aff)}</b></div>
        <div class="relbar">Confiança<div class="bar"><i style="width:${r.trust}%;background:var(--info)"></i></div><b>${Math.round(r.trust)}</b></div>
        ${romanceOk && r.rom > 0 ? `<div class="relbar">Romance<div class="bar"><i style="width:${r.rom}%;background:var(--clipz2)"></i></div><b>${Math.round(r.rom)}</b></div>` : ''}
        <div class="small muted">Interesses: ${(def.interests || []).join(', ')}</div></div></div>
        <div class="upper">Conversar</div><div class="row wrap">${acts.map(a => `<button class="btn sm" data-ta="${a.id}">${UI.ic(a.icon, 14)} ${a.label}</button>`).join('')}</div>
        <div class="upper">Convidar</div><div class="row wrap">${Object.entries(R.INVITES).filter(([k]) => k !== 'visita' || ['duda', 'rafa'].includes(id)).map(([k, v]) => `<button class="btn sm" data-inv="${k}">${U.esc(v.label)}</button>`).join('')}${R.canAskOut(id) ? `<button class="btn sm primary" data-ask>${UI.ic('heart', 14)} Pedir em namoro</button>` : ''}${r.stage === 'namorando' ? `<button class="btn sm danger" data-break>Terminar</button>` : ''}${['editor', 'moderador', 'empresario'].includes(def.role) && !SL.G.staff.some(s => s.npc === id) ? `<button class="btn sm ok" data-hire>${UI.ic('team', 14)} Contratar</button>` : ''}</div>
        ${r.memo.length ? `<div class="upper">O que ${U.esc(def.short || def.name)} lembra de vocês</div><div class="col gap4">${r.memo.slice(-4).reverse().map(x => `<div class="memo">${U.esc(SL.Chat.fill(x.x, null, {}))} <span class="faint tiny">· ${SL.Clock.fmtDay(x.d)}</span></div>`).join('')}</div>` : ''}`;
      SL.Avatar.toCanvas(UI.$('#tk-p', m.el), def.look, { expr: r.flags.conflict ? 'bravo' : r.aff > 40 ? 'feliz' : 'neutro' });
      $$('[data-ta]', m.el).forEach(b => b.onclick = () => { const res = R.interact(id, b.dataset.ta, via); if (res) { line = res.line; if (res.outcome !== 'none') SL.Clock.skip(via === 'msg' ? 3 : 8); } draw(); });
      $$('[data-inv]', m.el).forEach(b => b.onclick = () => HUD.inviteWhen(id, b.dataset.inv, res => { line = res.line; draw(); }));
      const ask = $('[data-ask]', m.el); if (ask) ask.onclick = () => { const res = R.askOut(id); line = res.line; draw(); };
      const brk = $('[data-break]', m.el); if (brk) brk.onclick = () => UI.confirm('Terminar o namoro', 'Tem certeza?', () => { R.breakUp(id); line = 'Tá... se é isso que você quer.'; draw(); }, 'Terminar', true);
      const hire = $('[data-hire]', m.el); if (hire) hire.onclick = () => { const err = R.hire(id); if (err) UI.err(err); else line = 'Fechado! Bora trabalhar juntos.'; draw(); };
    };
    draw();
  };
  HUD.inviteWhen = (id, kind, cb) => {
    const h = SL.Clock.hour(); const today = SL.Clock.day();
    const slots = []; for (let d = 0; d < 3; d++) [10, 15, 20].forEach(hh => { if (d > 0 || hh > h + 1) slots.push([d, hh]); });
    const m = UI.modal({ title: SL.Rel.INVITES[kind].label + ' com ' + SL.Rel.name(id), icon: 'calendar', html: '<p class="small muted">Escolha quando. Faltar ao combinado tem consequência.</p><div class="grid3">' + slots.map(([d, hh]) => `<button class="choice" data-sl="${d},${hh}"><b>${d === 0 ? 'Hoje' : d === 1 ? 'Amanhã' : SL.Clock.fmtDay(today + d)}</b><small>às ${hh}h</small></button>`).join('') + '</div>' });
    $$('[data-sl]', m.el).forEach(b => b.onclick = () => { const [d, hh] = b.dataset.sl.split(',').map(Number); m.close(); cb(SL.Rel.invite(id, kind, d, hh)); });
  };

  // ---------- cenário: mouse e teclado ----------
  HUD.bindStage = () => {
    const cv = $('#cv-world'); const tip = document.createElement('div'); tip.className = 'stage-tip'; tip.hidden = true; $('#stage-ui').appendChild(tip);
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener('mousemove', e => {
      const G = SL.G; if (!G) return; const p = pos(e); let label = null;
      if (G.loc.area === 'casa') { const o = SL.HomeScene.objectAt(p.x, p.y); SL.HomeScene.setHover(o); label = o ? o.label : null; }
      else if (G.loc.area === 'cidade') { const id = SL.City.placeAtScreen(p.x, p.y); SL.City.setHover(id); label = id ? (D.placeById(id).name + (SL.City.isOpen(id) ? '' : ' (fechado)')) : null; }
      else if (G.loc.area === 'local') { const id = SL.City.personAtScreen(p.x, p.y); label = id ? (SL.Rel.get(id).met ? SL.Rel.def(id).name + ' · conversar' : 'Puxar conversa') : null; }
      cv.style.cursor = label ? 'pointer' : 'default';
      if (label) { tip.hidden = false; tip.textContent = label; tip.style.left = (p.x + 14) + 'px'; tip.style.top = (p.y + 10) + 'px'; } else tip.hidden = true;
    });
    cv.addEventListener('mouseleave', () => { tip.hidden = true; SL.HomeScene.setHover(null); });
    cv.addEventListener('click', e => {
      const G = SL.G; if (!G) return; const p = pos(e); UI.closeCtx(); $('.notif-panel') && $('.notif-panel').remove();
      SL.audio.init();
      if (G.loc.area === 'casa') {
        const o = SL.HomeScene.objectAt(p.x, p.y);
        if (o) {
          const opts = HUD.objectActions(o);
          SL.HomeScene.goToObject(o, () => { const sp = SL.HomeScene.charScreen(); if (opts.length === 1 && !opts[0].disabled && (o.kind === 'mesa')) { opts[0].fn(); return; } UI.ctxMenu(sp.x + 20, sp.y - 70, o.label, opts[0] ? opts[0].icon : 'info', opts); });
          return;
        }
        if (G.act && G.act.id !== 'usar_pc') { UI.toast({ title: 'Ocupado(a)', text: G.act.label + '. Pare a atividade no painel ao lado para andar.', icon: 'clock', cat: 'vida' }, null, true); return; }
        const t = SL.HomeScene.screenToTile(p.x, p.y); SL.HomeScene.walkTo(t.tx, t.ty);
      } else if (G.loc.area === 'cidade') {
        const id = SL.City.placeAtScreen(p.x, p.y); if (!id) return;
        if (G.act && G.act.id === 'viagem') return UI.err('Você já está a caminho.');
        HUD.travelDialog(id);
      } else if (G.loc.area === 'local') {
        const id = SL.City.personAtScreen(p.x, p.y); if (id) HUD.talk(id);
      }
    });
    window.addEventListener('keydown', e => {
      if (UI.screen !== 'game' || /input|textarea|select/i.test(document.activeElement.tagName)) return;
      const G = SL.G;
      if (e.key === ' ') { e.preventDefault(); G.time.speed = G.time.speed === 0 ? (HUD._lastSpeed || 1) : (HUD._lastSpeed = G.time.speed, 0); HUD.update(true); }
      if (['1', '2', '3'].includes(e.key)) { G.time.speed = +e.key; HUD.update(true); }
      if (e.key === 'Escape') { if ($('.modal-bg')) return; if (UI._ctx) return UI.closeCtx(); if (UI.phoneOpen()) return UI.closePhone(); if (UI.pcOpen() && !(SL.Live && SL.Live.cur)) return UI.closePC(); SL.Screens.pauseMenu(); }
      if ((e.key === 'c' || e.key === 'C') && !UI.pcOpen()) UI.phoneOpen() ? UI.closePhone() : UI.openPhone();
      if ((e.key === 'p' || e.key === 'P') && G.loc.area === 'casa') UI.pcOpen() ? UI.closePC() : HUD.goToPC();
      if (G.loc.area === 'casa' && !UI.pcOpen() && !UI.phoneOpen()) {
        const d = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }[e.key];
        if (d && (!G.act || G.act.id === 'usar_pc')) { e.preventDefault(); const sp = SL.HomeScene.charScreen(); const t = SL.HomeScene.screenToTile(sp.x, sp.y - 4); SL.HomeScene.walkTo(t.tx + d[0], t.ty + d[1]); }
      }
    });
  };
  HUD.stageOverlay = () => {
    const G = SL.G; const host = $('#stage-ui'); let b = $('.stage-badge', host), h = $('.stage-hint', host);
    if (!b) { b = document.createElement('div'); b.className = 'stage-badge'; host.appendChild(b); h = document.createElement('div'); h.className = 'stage-hint'; host.appendChild(h); }
    const txt = G.loc.area === 'casa' ? [UI.ic('home', 15) + ' ' + U.esc(D.homeById(G.home.id).name), 'Clique nos objetos para usar · WASD/setas para andar · Espaço pausa'] : G.loc.area === 'cidade' ? [UI.ic('map', 15) + ' ' + (G.act && G.act.id === 'viagem' ? U.esc(G.act.label) : 'Você está em: ' + U.esc((D.placeById(G.loc.place) || {}).name || '')), 'Clique num lugar para ir até lá'] : [UI.ic('location', 15) + ' ' + U.esc((D.placeById(G.loc.place) || {}).name || ''), 'Clique nas pessoas para conversar'];
    if (b.dataset.t !== txt[0]) { b.innerHTML = txt[0]; b.dataset.t = txt[0]; }
    if (h.dataset.t !== txt[1]) { h.textContent = txt[1]; h.dataset.t = txt[1]; }
    h.hidden = G.loc.area === 'local'; b.hidden = G.loc.area === 'local';
  };
})(window.SL);

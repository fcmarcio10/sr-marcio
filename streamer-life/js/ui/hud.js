/* Painel do jogo: barra superior, painel lateral, cliques no cenário (casa, cidade e lugares), conversas e compras presenciais. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const $ = UI.$, $$ = UI.$$;
  const HUD = SL.HUD = {};
  let refs = {};

  HUD.build = () => {
    const hud = $('#hud');
    hud.innerHTML = `<div class="hud-tl">
        <div class="hud-top"><button class="hud-me" data-h="me" title="Sua carreira"><canvas></canvas><span class="hm-t"><b class="ellipsis"></b><small class="ellipsis"></small></span></button>
        <button class="hud-money" data-h="bank" title="Bank">${UI.ic('money', 14)}<span class="mv"></span></button></div>
        <div class="hud-needs">${SL.Life.NEEDS.map(nd => `<div class="hn" data-k="${nd.k}" title="${nd.label}"><span class="hn-i" style="color:${nd.color}">${UI.ic(nd.icon, 14)}</span><span class="hn-l">${nd.label}</span><div class="hn-b"><i style="background:${nd.color}"></i></div></div>`).join('')}</div>
      </div>
      <div class="hud-tc">
        <div class="hud-clock"><button class="hud-meta" data-h="metas" title="Suas metas"><span class="hmi">${UI.ic('trophy', 15)}</span><span class="hmt"><small>Próxima meta</small><b class="ellipsis"></b><span class="hm-bar"><i></i></span></span><span class="hm-r"></span></button><div class="speeds" hidden title="Velocidade da live">${UI.speedBtns()}</div></div>
        <div class="hud-act" hidden></div>
      </div>
      <div class="hud-tr">
        <button class="gbtn" data-h="phone" title="Celular (C)">${UI.ic('phone', 20)}<span>Celular</span><i class="badge" hidden></i></button>
        <button class="gbtn" data-h="pc" title="Computador (P)">${UI.ic('laptop', 20)}<span>PC</span></button>
        <button class="gbtn" data-h="menu" title="Menu (Esc)">${UI.ic('more', 20)}<span>Menu</span></button>
      </div>
      <div class="hud-live" hidden></div>`;
    refs = { cv: $('.hud-me canvas', hud), name: $('.hud-me b', hud), tier: $('.hud-me small', hud), meta: $('.hud-meta', hud), mt: $('.hud-meta b', hud), mbar: $('.hud-meta .hm-bar i', hud), mr: $('.hud-meta .hm-r', hud), speeds: $('.hud-clock .speeds', hud), money: $('.hud-money', hud), mv: $('.mv', hud), badge: $('[data-h="phone"] .badge', hud), act: $('.hud-act', hud), pc: $('[data-h="pc"]', hud), bars: SL.Life.NEEDS.map(nd => ({ nd, el: $('.hn[data-k="' + nd.k + '"]', hud) })) };
    hud.onclick = e => {
      if (HUD.locked()) return;
      const b = e.target.closest('[data-h],[data-speed],[data-actstop]'); if (!b) return; SL.audio.play('click');
      if (b.dataset.speed != null) { SL.Clock.setSpeed(+b.dataset.speed); HUD.update(true); return; }
      if (b.dataset.actstop != null) { SL.Life.stop(false); HUD.update(true); return; }
      const h = b.dataset.h;
      if (h === 'phone') { if (UI.phoneOpen()) UI.closePhone(); else UI.openPhone(); }
      if (h === 'pc') { if (UI.pcOpen()) UI.closePC(); else HUD.goToPC(); }
      if (h === 'menu') SL.Screens.pauseMenu();
      if (h === 'bank') UI.openApp('banco');
      if (h === 'me') UI.openApp('stats');
      if (h === 'metas') UI.openApp('stats', { tab: 'objetivos' });
      if (h === 'voltarpc') HUD.goToPC();
    };
    HUD.paintPortrait();
  };
  HUD.paintPortrait = () => { if (refs.cv) SL.Avatar.toCanvas(refs.cv, SL.G.player.look, { scale: 1.05 }); };
  // durante uma sequência (cozinhar e levar à mesa, por exemplo) nada pode interromper
  HUD.locked = () => !!(SL.Seq && SL.Seq.busy());
  let lastAct = '', lastMeta = '', metaT = 0;
  HUD.update = force => {
    const G = SL.G; if (!G || !refs.meta) return;
    // próxima meta (sem relógio nem data: pedido do dono)
    const nowM = performance.now();
    if (force || nowM - metaT > 600) {
      metaT = nowM; const m = SL.Goals.atual(); const key = m ? m.g.id + '|' + Math.round(m.s.p * 100) : 'fim';
      if (key !== lastMeta) {
        lastMeta = key;
        refs.mt.textContent = m ? m.g.title : 'Todas as metas cumpridas';
        refs.mbar.style.width = (m ? m.s.p * 100 : 100) + '%';
        refs.mr.textContent = m && m.g.r ? '+' + U.money0(m.g.r) : '';
        refs.meta.title = m ? (m.g.hint ? m.g.hint + ' ' : '') + (m.s.b ? '(' + U.num(Math.floor(m.s.a)) + ' de ' + U.num(m.s.b) + ')' : '') + (m.g.r ? ' Prêmio: ' + U.money0(m.g.r) : '') : '';
      }
    }
    const aoVivo = !!(SL.Live && SL.Live.cur); if (refs.speeds.hidden === aoVivo) refs.speeds.hidden = !aoVivo;
    refs.name.textContent = G.player.channel; refs.tier.textContent = SL.Career.tierName();
    refs.mv.textContent = U.money0(G.money); refs.money.classList.toggle('neg', G.money < 0);
    const un = SL.Notify.unread(); refs.badge.hidden = !un; refs.badge.textContent = un > 99 ? '99+' : un;
    refs.bars.forEach(({ nd, el }) => { const raw = G.needs[nd.k]; const v = nd.tired ? 100 - raw : raw; const bad = nd.tired ? v > 75 : v < 22; const i = el.querySelector('i'); i.style.width = v + '%'; el.classList.toggle('low', bad); });
    refs.pc.hidden = G.loc.area !== 'casa';
    UI.$$('[data-speed]').forEach(b => b.classList.toggle('on', +b.dataset.speed === SL.Clock.sp()));
    $('#hud').classList.toggle('locked', HUD.locked());
    const a = G.act; const show = !!(a && a.id !== 'usar_pc' && a.id !== 'live');
    const key = show ? [a.id, a.label, Math.round(SL.Life.progress() * 100), HUD.locked()].join('|') : '';
    if (force || key !== lastAct) {
      lastAct = key; refs.act.hidden = !show;
      if (show) refs.act.innerHTML = `<span class="ha-i">${UI.ic(SL.Life.ACT[a.id].icon, 16)}</span><div class="grow"><b>${U.esc(a.label)}</b>${a.dur ? `<div class="ha-b"><i style="width:${SL.Life.progress() * 100}%"></i></div>` : ''}</div>${HUD.locked() ? '' : `<button class="sbtn" data-actstop title="Parar">${UI.ic('x', 14)}</button>`}`;
    }
  };
  // live no ar com você longe do PC: janelinha com a tela da live onde você parou
  let lmT = 0;
  HUD.liveMini = (t, pcOpen) => {
    const el = $('#hud .hud-live'); if (!el) return;
    const L = SL.Live && SL.Live.cur; const show = !!(L && L.away && !pcOpen && SL.G.loc.area === 'casa');
    if (el.hidden !== !show) el.hidden = !show;
    if (!show) { if (el.firstChild) el.innerHTML = ''; return; }
    if (!el.firstChild) {
      el.innerHTML = `<div class="hl-h"><span class="onair"><i></i>AO VIVO</span><span class="hl-v" title="Assistindo agora">${UI.ic('eye', 13)}<b></b></span><span class="hl-t mono" title="Tempo no ar"></span></div>
        <div class="hl-cv"><canvas></canvas></div>
        <div class="hl-msg"></div>
        <button class="btn red sm hl-b" data-h="voltarpc">${UI.ic('laptop', 15)} Voltar ao PC</button>
        <small class="hl-tip">Sair de casa encerra a live</small>`;
      lmT = 0;
    }
    SL.Preview.live(el.querySelector('canvas'), L, t);
    const now = performance.now(); if (now - lmT < 300) return; lmT = now;
    el.querySelector('.hl-v b').textContent = U.int(L.viewers);
    el.querySelector('.hl-t').textContent = Math.floor(L.min / 60) + ':' + String(L.min % 60).padStart(2, '0');
    const m = [...L.chat].reverse().find(x => x.u && x.html && x.kind !== 'streamer');
    const mh = m ? `<b style="color:${m.c || '#bbb'}">${U.esc(m.u)}:</b> ${m.html}` : '<span class="muted">O chat está quieto...</span>';
    const box = el.querySelector('.hl-msg'); if (box.dataset.h !== mh) { box.dataset.h = mh; box.innerHTML = mh; }
  };
  HUD.goToPC = () => {
    const G = SL.G;
    if (G.loc.area !== 'casa') return UI.err('O computador está em casa.');
    { const b = SL.Life.pcBloqueio(); if (b) return UI.alert('Cuide da sua saúde', b, 'health'); }
    const o = SL.HomeScene.objects().find(x => x.id === 'mesa');
    SL.HomeScene.goToObject(o, () => UI.openPC());
  };
  HUD.leaveHome = () => {
    const o = SL.HomeScene.objects().find(x => x.id === 'porta');
    if (SL.G.act && SL.G.act.id !== 'usar_pc') return UI.err('Termine o que está fazendo primeiro.');
    SL.HomeScene.goToObject(o, () => SL.City.goOutside());
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
    const m = UI.modal({ title: p.id === 'casa' ? 'Voltar para casa' : p.name, icon: p.icon, sub: opts[0].km.toFixed(1).replace('.', ',') + ' km',
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
    el.innerHTML = `<header><div class="pi" style="background:${p.color}">${UI.ic(p.icon, 20)}</div><div class="grow"><b>${U.esc(p.name)}</b><div class="tiny ok">Aberto</div></div></header>
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
  HUD.inviteWhen = (id, kind, cb) => { cb(SL.Rel.invite(id, kind)); };
  HUD.resumoSemana = () => {
    const G = SL.G; const r = G && G.resumo; if (!r || (SL.Live && SL.Live.cur) || HUD.locked() || document.querySelector('#modals .modal-bg')) return;
    G.resumo = null;
    const meta = SL.Goals.atual(); const sg = n => (n > 0 ? '+' : '') + U.num(n);
    UI.modal({ title: 'Resumo da semana ' + r.n, icon: 'stats', html: `<div class="sum-grid"><div class="card stat"><b>${r.lives}</b><span>Lives (${r.horas}h no ar)</span></div><div class="card stat"><b>${U.int(r.pico)}</b><span>Maior público</span></div><div class="card stat"><b class="ok">${U.money0(r.ganho)}</b><span>Dinheiro que entrou</span></div><div class="card stat"><b class="bad">${U.money0(r.gasto)}</b><span>Gastos</span></div></div>
      <div class="card col"><h3>Seguidores novos</h3><div class="kv">${r.seg.map(([n, v]) => `<span>${n}</span><b class="${v > 0 ? 'ok' : v < 0 ? 'bad' : ''}">${sg(v)}</b>`).join('')}</div></div>
      ${r.best ? `<div class="card col"><h3>Melhor vídeo da semana</h3><div class="small">${U.esc(r.best.title)} <span class="muted">· ${r.best.plat} · ${U.num(r.best.views)} visualizações</span></div><span class="tiny muted">${r.videos} vídeo(s) e corte(s) publicados.</span></div>` : ''}
      ${meta ? `<div class="card col"><h3>Próxima meta</h3><div class="small">${U.esc(meta.g.title)}${meta.g.r ? ' <b class="ok">+' + U.money0(meta.g.r) + '</b>' : ''}</div><div class="bar"><i style="width:${Math.round(meta.s.p * 100)}%"></i></div></div>` : ''}`, buttons: [{ label: 'Bora pra próxima', cls: 'primary' }] });
    if (SL.audio) SL.audio.play('levelup');
  };

  // ---------- cenário: mouse e teclado ----------
  HUD.bindStage = () => {
    const cv = $('#cv-world'); const tip = document.createElement('div'); tip.className = 'stage-tip'; tip.hidden = true; $('#stage-ui').appendChild(tip);
    const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    cv.addEventListener('mousemove', e => {
      const G = SL.G; if (!G) return; const p = pos(e); let label = null;
      if (UI._ctx || HUD.locked()) { tip.hidden = true; SL.HomeScene.setHover(null); cv.style.cursor = 'default'; return; }
      if (G.loc.area === 'casa') { const o = SL.HomeScene.objectAt(p.x, p.y); SL.HomeScene.setHover(o); label = o ? o.label : null; }
      else if (G.loc.area === 'cidade') { const id = SL.City.placeAtScreen(p.x, p.y); SL.City.setHover(id); label = id ? (D.placeById(id).name + (SL.City.isOpen(id) ? '' : ' (fechado)')) : null; }
      else if (G.loc.area === 'local') { const id = SL.City.personAtScreen(p.x, p.y); label = id ? (SL.Rel.get(id).met ? SL.Rel.def(id).name + ' · conversar' : 'Puxar conversa') : null; }
      cv.style.cursor = label ? 'pointer' : 'default';
      if (label) { tip.hidden = false; tip.textContent = label; tip.style.left = (p.x + 14) + 'px'; tip.style.top = (p.y + 10) + 'px'; } else tip.hidden = true;
    });
    cv.addEventListener('mouseleave', () => { tip.hidden = true; SL.HomeScene.setHover(null); });
    cv.addEventListener('click', e => {
      const G = SL.G; if (!G) return; const p = pos(e);
      SL.audio.init();
      if (HUD.locked()) return;
      UI.closeCtx();
      if (G.loc.area === 'casa') {
        const o = SL.HomeScene.objectAt(p.x, p.y);
        if (o) { if (G.act && G.act.id !== 'usar_pc') return HUD.busyHint(); if (SL.HomeScene.near() === o) HUD.openObjectMenu(o); else SL.HomeScene.goToObject(o); return; }
        if (G.act && G.act.id !== 'usar_pc') { HUD.busyHint(); return; }
        const t = SL.HomeScene.screenToTile(p.x, p.y); SL.HomeScene.walkTo(t.tx, t.ty);
      } else if (G.loc.area === 'cidade') {
        const id = SL.City.placeAtScreen(p.x, p.y); if (!id) return;
        if (G.act && G.act.id === 'viagem') return UI.err('Você já está a caminho.');
        HUD.travelDialog(id);
      } else if (G.loc.area === 'local') {
        const id = SL.City.personAtScreen(p.x, p.y); if (id) HUD.talk(id);
      }
    });
    // barulhinho de teclado quando você digita (chat da live, mensagens, posts)
    window.addEventListener('keydown', e => { if (UI.screen === 'game' && /input|textarea/i.test(document.activeElement.tagName) && e.key.length === 1 && SL.audio.tecla) SL.audio.tecla(); });
    window.addEventListener('keydown', e => {
      if (UI.screen !== 'game' || /input|textarea|select/i.test(document.activeElement.tagName)) return;
      const G = SL.G;
      if (HUD.locked()) { if (G.loc.area === 'casa' && SL.HomeScene.keyDown(e.key)) e.preventDefault(); return; }
      const noAr = !!(SL.Live && SL.Live.cur);
      if (e.key === ' ' && noAr) { e.preventDefault(); const cur = SL.Clock.sp(); if (cur === 0) SL.Clock.setSpeed(HUD._lastSpeed || 1); else { HUD._lastSpeed = cur; SL.Clock.setSpeed(0); } HUD.update(true); }
      if (noAr && ['1', '2', '3'].includes(e.key) && !(UI._ctx && UI._ctx._pick)) { SL.Clock.setSpeed(e.key === '1' ? 1 : 2); HUD.update(true); }
      if (e.key === 'Escape') { if ($('.modal-bg')) return; if (UI._ctx) return UI.closeCtx(); if (UI.phoneOpen()) return UI.closePhone(); if (UI.pcOpen() && !(SL.Live && SL.Live.cur)) return UI.closePC(); SL.Screens.pauseMenu(); }
      if ((e.key === 'c' || e.key === 'C') && !UI.pcOpen()) { if (UI.phoneOpen()) UI.closePhone(); else UI.openPhone(); }
      if ((e.key === 'p' || e.key === 'P') && G.loc.area === 'casa') { if (UI.pcOpen()) UI.closePC(); else HUD.goToPC(); }
      if (G.loc.area === 'casa' && !UI.pcOpen() && !UI.phoneOpen() && !$('.modal-bg')) {
        if (SL.HomeScene.keyDown(e.key)) { e.preventDefault(); if (G.act && G.act.id !== 'usar_pc') HUD.busyHint(); }
        if ((e.key === 'e' || e.key === 'E') && !e.repeat) HUD.interactNear();
        if (UI._ctx && UI._ctx._pick && /^[1-9]$/.test(e.key) && +e.key < UI._ctx._n) UI._ctx._pick(+e.key - 1);
      }
    });
    window.addEventListener('keyup', e => SL.HomeScene.keyUp(e.key));
    window.addEventListener('blur', () => SL.HomeScene.clearKeys());
    cv.addEventListener('wheel', e => { if (SL.G && SL.G.loc.area === 'casa') { e.preventDefault(); SL.HomeScene.zoomBy(e.deltaY); } }, { passive: false });
    SL.HomeScene.onExit = () => { const o = SL.HomeScene.objects().find(x => x.id === 'porta'); if (o) HUD.openObjectMenu(o); };
  };
  let busyT = 0;
  HUD.busyHint = () => { const now = performance.now(); if (now - busyT < 2500) return; busyT = now; const G = SL.G; UI.toast({ title: 'Ocupado(a)', text: G.act.label + '. Toque no X lá em cima para parar.', icon: 'clock', cat: 'vida' }, null, true); };
  // dica curta embaixo: some sozinha depois de um tempo em cada lugar
  let hintAt = 0, hintKey = '';
  HUD.stageOverlay = () => {
    const G = SL.G; const host = $('#stage-ui'); let h = $('.stage-hint', host);
    if (!h) { h = document.createElement('div'); h.className = 'stage-hint'; host.appendChild(h); }
    const txt = G.loc.area === 'casa' ? 'WASD anda · chegue perto de um móvel e aperte E' : G.loc.area === 'cidade' ? (G.act && G.act.id === 'viagem' ? '' : 'Clique num lugar para ir até lá') : '';
    if (txt !== hintKey) { hintKey = txt; hintAt = performance.now(); h.textContent = txt; }
    h.classList.toggle('gone', !txt || performance.now() - hintAt > 14000 || (G.loc.area === 'casa' && SL.HomeScene.moving()));
  };
})(window.SL);

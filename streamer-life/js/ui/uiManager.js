/* Gerenciador da interface: telas, avisos, modais, decisões, menu de contexto, computador (janelas) e celular. */
'use strict';
(function (SL) {
  const U = SL.U;
  const UI = SL.UI = {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  UI.$ = $; UI.$$ = $$;
  UI.ic = (n, s) => SL.icon(n, s || 18);
  // botões de velocidade (pausa, normal e 3x): os mesmos na casa, no PC e na live
  UI.speedBtns = () => `<button class="sbtn" data-speed="0" title="Pausar (Espaço)">${UI.ic('pause', 15)}</button><button class="sbtn" data-speed="1" title="Velocidade normal (1)">${UI.ic('speed1', 15)}</button><button class="sbtn x3" data-speed="2" title="3 vezes mais rápido (2)">${UI.ic('speed2', 14)}<b>3x</b></button>`;
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-speed]'); if (!b || b.closest('#hud') || !SL.G) return;
    SL.Clock.setSpeed(+b.dataset.speed); if (SL.audio) SL.audio.play('click'); if (SL.HUD) SL.HUD.update(true);
  });
  UI.esc = U.esc;

  UI.show = id => { $$('.screen').forEach(s => { s.hidden = s.id !== 'scr-' + id; }); UI.screen = id; SL.bus.emit('screen', id); };

  // ---------- avisos ----------
  const CATC = id => (SL.Notify.CATS[id] || SL.Notify.CATS.sistema).color;
  UI.toast = (n, sound, quick) => {
    const box = $('#toasts'); if (!box) return;
    if (UI.screen !== 'game') return;
    [...box.children].forEach(c => { if (c.dataset.title === n.title) c.remove(); });
    if (document.body.classList.contains('live-open') && !n.err) return; // ao vivo: só erros das ações; o resto fica guardado no celular
    const el = document.createElement('div'); el.className = 'toast'; el.dataset.title = n.title;
    const col = CATC(n.cat); const life = quick ? 2800 : 6000; el.style.borderLeftColor = col;
    el.innerHTML = `<div class="ti" style="background:${U.rgba(col, 0.16)};color:${col}">${UI.ic(n.icon || 'info', 16)}</div><div class="grow"><b>${U.esc(n.title)}</b>${n.text ? '<p>' + U.esc(n.text) + '</p>' : ''}</div><button class="tx" aria-label="Fechar aviso" title="Fechar">${UI.ic('x', 14)}</button><i class="tbar" style="color:${col};animation-duration:${life}ms"></i>`;
    const kill = () => { if (!el.isConnected) return; el.classList.add('out'); setTimeout(() => el.remove(), 260); };
    el.querySelector('.tx').onclick = e => { e.stopPropagation(); n.read = true; kill(); SL.bus.emit('notif'); };
    el.onclick = () => { if (n.app) UI.openApp(n.app, n.args); n.read = true; kill(); SL.bus.emit('notif'); };
    box.prepend(el);
    const maxT = document.body.classList.contains('pc-open') || document.body.classList.contains('live-open') ? 1 : 3;
    while (box.children.length > maxT) box.lastChild.remove();
    if (SL.audio && !quick) SL.audio.play(sound || 'notif');
    setTimeout(kill, life);
  };

  // ---------- modais ----------
  UI.modal = o => {
    const root = $('#modals'); const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${o.wide ? 'wide' : ''} ${o.cls || ''}" role="dialog" aria-modal="true"><div class="mh">${o.icon ? '<div class="mi">' + UI.ic(o.icon, 20) + '</div>' : ''}<div class="grow"><h3>${U.esc(o.title || '')}</h3>${o.sub ? '<div class="muted small">' + U.esc(o.sub) + '</div>' : ''}</div>${o.noClose ? '' : '<button class="ibtn" data-x aria-label="Fechar">' + UI.ic('x') + '</button>'}</div><div class="mb">${o.html || ''}</div>${(o.buttons && o.buttons.filter(Boolean).length) ? '<div class="mf"></div>' : ''}</div>`;
    root.appendChild(bg);
    const m = { el: bg, body: $('.mb', bg), closed: false };
    m.close = () => { if (m.closed) return; m.closed = true; bg.remove(); if (o.hold) SL.Clock.release(); if (o.onClose) o.onClose(); };
    if (o.hold) SL.Clock.hold();
    const mf = $('.mf', bg);
    (o.buttons || []).filter(Boolean).forEach(b => { const btn = document.createElement('button'); btn.className = 'btn ' + (b.cls || ''); btn.innerHTML = (b.icon ? UI.ic(b.icon, 16) : '') + U.esc(b.label); btn.onclick = () => { const r = b.fn ? b.fn(m) : null; if (r !== false && !b.keep) m.close(); }; mf.appendChild(btn); });
    const x = $('[data-x]', bg); if (x) x.onclick = () => m.close();
    if (!o.noClose) bg.addEventListener('mousedown', e => { if (e.target === bg) m.close(); });
    if (o.onRender) o.onRender(m);
    return m;
  };
  UI.alert = (title, text, icon) => UI.modal({ title, icon: icon || 'info', html: '<p>' + U.esc(text) + '</p>', buttons: [{ label: 'Ok', cls: 'primary' }] });
  UI.confirm = (title, text, fn, okLabel, danger) => UI.modal({ title, icon: danger ? 'alert' : 'info', html: '<p>' + U.esc(text) + '</p>', buttons: [{ label: 'Cancelar' }, { label: okLabel || 'Confirmar', cls: danger ? 'danger' : 'primary', fn }] });
  UI.err = msg => { if (!msg) return false; UI.toast({ title: 'Não deu', text: msg, icon: 'alert', cat: 'sistema', err: true }, 'error'); return true; };

  // decisões pendentes (eventos): uma por vez, pausa o tempo
  let decisionOpen = false;
  UI.checkDecisions = () => {
    const G = SL.G; if (!G || decisionOpen || UI.screen !== 'game') return;
    if (SL.Live && SL.Live.cur) return;
    const ev = G.events.pending[0]; if (!ev) return;
    decisionOpen = true;
    const html = `<p>${U.esc(ev.text)}</p><div class="col">${ev.choices.map(c => `<button class="choice" data-c="${c.id}"><b>${U.esc(c.label)}</b>${c.desc ? '<small>' + U.esc(c.desc) + '</small>' : ''}</button>`).join('')}</div>`;
    const m = UI.modal({ title: ev.title, icon: ev.icon, html, hold: true, noClose: true, onClose: () => { decisionOpen = false; setTimeout(UI.checkDecisions, 300); } });
    $$('[data-c]', m.el).forEach(b => b.onclick = () => {
      const res = SL.Events.choose(ev.uid, b.dataset.c);
      m.body.innerHTML = '<p>' + U.esc(res || 'Decisão tomada.') + '</p>';
      const mf = document.createElement('div'); mf.className = 'mf'; mf.innerHTML = '<button class="btn primary">Continuar</button>'; m.el.querySelector('.modal').appendChild(mf);
      mf.firstChild.onclick = () => m.close();
    });
  };

  // ---------- menu de contexto ----------
  UI.ctxMenu = (x, y, title, icon, opts) => {
    UI.closeCtx();
    const host = $('#stage-ui'); const el = document.createElement('div'); el.className = 'ctx';
    el.innerHTML = `<h4>${UI.ic(icon || 'info', 15)}${U.esc(title)}</h4>` + opts.map((o, i) => `<button class="opt" data-i="${i}" ${o.disabled ? 'disabled' : ''}>${UI.ic(o.icon || 'chevR', 16)}<span>${U.esc(o.label)}${o.disabled && o.why ? '<span class="why">' + U.esc(o.why) + '</span>' : ''}</span>${o.sub ? '<small>' + U.esc(o.sub) + '</small>' : ''}</button>`).join('');
    host.appendChild(el);
    const W0 = host.clientWidth, H0 = host.clientHeight;
    el.style.left = Math.min(Math.max(8, x), W0 - el.offsetWidth - 8) + 'px'; el.style.top = Math.min(Math.max(8, y), H0 - el.offsetHeight - 8) + 'px';
    $$('.opt', el).forEach(b => b.onclick = e => { e.stopPropagation(); const o = opts[+b.dataset.i]; UI.closeCtx(); const r = o.fn && o.fn(); if (typeof r === 'string') UI.err(r); });
    UI._ctx = el;
  };
  UI.closeCtx = () => { document.body.classList.remove('menu-open'); if (UI._ctx) { UI._ctx.remove(); UI._ctx = null; } };

  // ---------- apps: computador e celular ----------
  const wins = []; let zTop = 10; UI.wins = wins;
  UI.pcOpen = () => !$('#overlay-pc').hidden;
  UI.phoneOpen = () => !$('#overlay-phone').hidden;
  UI.canUsePC = () => SL.G && SL.G.loc.area === 'casa' && !!SL.Equip.item('computador');
  UI.openPC = () => {
    const G = SL.G;
    if (G.loc.area !== 'casa') return UI.err('O computador fica em casa.');
    if (!SL.Equip.item('computador')) return UI.err('Seu computador está quebrado. Conserte ou compre outro (pelo celular: app Loja).');
    if (G.act && G.act.id !== 'usar_pc' && G.act.id !== 'live' && !SL.Life.ACT[G.act.id].pc) { if (SL.Life.ACT[G.act.id].sleep) return UI.err('Você está dormindo.'); SL.Life.stop(false); }
    if (SL.HomeScene) { const d = SL.HomeScene.objects().find(o => o.id === 'mesa'); if (d) SL.HomeScene.placeAt('mesa'); }
    // voltou para o PC com a live no ar: volta a jogar ao vivo
    const L = SL.Live && SL.Live.cur;
    if (L && L.away) { SL.Live.voltar(); SL.Life.start('live'); }
    if (!G.act) SL.Life.start('usar_pc');
    G.flags.pcOpened = 1;
    UI.closePhone();
    const ov = $('#overlay-pc'); ov.hidden = false; document.body.classList.add('pc-open');
    if (!ov.firstChild) UI.buildDesktop(ov);
    UI.renderDesktopIcons();
    if (SL.audio) SL.audio.play('open');
    SL.Goals.check();
  };
  // mode 'sair': levanta do PC (com a live no ar, ela continua enquanto você estiver em casa)
  // mode 'desligar': desliga o PC (com a live no ar, pergunta e encerra a live)
  UI.closePC = mode => {
    const ov = $('#overlay-pc'); if (ov.hidden) return;
    const L = SL.Live && SL.Live.cur;
    if (L && mode === 'desligar') return UI.confirm('Desligar o PC?', 'Sua live está no ar e vai ser encerrada.', () => { SL.LiveUI.finish(); UI.closePC(); }, 'Encerrar live e desligar', true);
    if (L) {
      SL.Live.sair(); SL.LiveUI.close();
      if (SL.G.act && SL.G.act.id === 'live') { SL.G.act = null; SL.bus.emit('activity', null); }
      UI.toast({ title: 'A live continua no ar', text: 'Você pode andar pela casa. Sair de casa encerra a live.', icon: 'live', cat: 'canal' });
    }
    ov.hidden = true; document.body.classList.remove('pc-open'); wins.slice().forEach(w => UI.closeWin(w, true));
    const G = SL.G; if (G.act && G.act.id === 'usar_pc') SL.Life.stop(false);
    if (SL.audio) SL.audio.play('close');
  };
  UI.buildDesktop = ov => {
    ov.innerHTML = `<div class="desktop"><canvas class="wall"></canvas><div class="desk-area"><div class="desk-icons"></div></div><div class="start-menu" hidden></div><div class="taskbar"><button class="tb-start" data-start title="Iniciar: todos os aplicativos">${UI.ic('window', 18)}<span>Iniciar</span></button><div class="tb-wins row gap4"></div><div class="tray"><div class="speeds tb-speeds">${UI.speedBtns()}</div>${UI.ic('wifi', 15)}<span class="tb-clock mono"></span><button class="tb-out" data-sair title="Levantar do PC (a live continua se estiver no ar)">${UI.ic('exit', 15)}<span>Sair do PC</span></button><button class="tb-off" data-desligar title="Desligar o PC">${UI.ic('power', 16)}</button></div></div></div>`;
    const sm = $('.start-menu', ov);
    // com a live aberta, o menu Iniciar ficava escondido atrás dela: a live minimiza antes
    $('[data-start]', ov).onclick = e => { e.stopPropagation(); if (sm.hidden && SL.LiveUI && SL.LiveUI.visible()) SL.LiveUI.minimize(); if (sm.hidden) UI.renderStart(); sm.hidden = !sm.hidden; };
    ov.addEventListener('mousedown', e => { if (!sm.hidden && !sm.contains(e.target) && !e.target.closest('[data-start]')) sm.hidden = true; });
    $('[data-sair]', ov).onclick = () => { SL.audio.play('click'); UI.closePC('sair'); };
    $('[data-desligar]', ov).onclick = () => { SL.audio.play('click'); UI.closePC('desligar'); };
  };
  UI.appList = mode => Object.keys(SL.Apps).filter(id => { const a = SL.Apps[id]; return mode === 'pc' ? a.pc !== false : a.phone; }).sort((a, b) => (SL.Apps[a].order || 50) - (SL.Apps[b].order || 50));
  UI.renderDesktopIcons = () => {
    const box = $('#overlay-pc .desk-icons'); if (!box) return;
    // só redesenha quando algo muda (antes era a cada segundo e um clique podia se perder)
    const html = UI.appList('pc').map(id => { const a = SL.Apps[id]; const b = a.badge ? a.badge() : 0; return `<button class="dicon" data-app="${id}"><div class="ai" style="background:${a.color};${a.fg ? 'color:' + a.fg : ''}">${UI.ic(a.icon, 22)}${b ? '<span class="dot"></span>' : ''}</div><span>${U.esc(a.title)}</span></button>`; }).join('');
    if (box._html === html) return; box._html = html; box.innerHTML = html;
    if (!box._click) { box._click = true; box.addEventListener('click', e => { const b = e.target.closest('[data-app]'); if (b) UI.openApp(b.dataset.app); }); }
  };
  // menu Iniciar com todos os apps do PC
  UI.renderStart = () => {
    const sm = $('#overlay-pc .start-menu'); if (!sm) return; const G = SL.G;
    sm.innerHTML = `<div class="sm-h"><canvas class="sm-ava"></canvas><div><b>${U.esc(G.player.channel)}</b><small>${U.esc(SL.Career.tierName())}</small></div></div><div class="sm-grid">${UI.appList('pc').map(id => { const a = SL.Apps[id]; return `<button class="sm-app" data-app="${id}"><span class="ai" style="background:${a.color};${a.fg ? 'color:' + a.fg : ''}">${UI.ic(a.icon, 20)}</span><span>${U.esc(a.title)}</span></button>`; }).join('')}</div><div class="sm-f"><button class="btn sm danger" data-off>${UI.ic('exit', 15)} Desligar o PC</button></div>`;
    SL.Avatar.toCanvas($('.sm-ava', sm), G.player.look, { scale: 1 });
    sm.querySelectorAll('[data-app]').forEach(b => b.onclick = () => { sm.hidden = true; UI.openApp(b.dataset.app); });
    $('[data-off]', sm).onclick = () => { sm.hidden = true; UI.closePC('desligar'); };
  };
  UI.renderTaskbar = () => {
    const tb = $('#overlay-pc .tb-wins'); if (!tb) return;
    const L = SL.Live && SL.Live.cur; const lv = L ? `<button class="tb-app tb-live ${SL.LiveUI.visible() ? 'on' : ''}" data-live title="Live (clique para minimizar ou voltar)"><i class="dot-live"></i><span>OBS · AO VIVO</span></button>` : '';
    tb.innerHTML = lv + wins.map(w => `<button class="tb-app ${w.focus ? 'on' : ''}" data-w="${w.id}">${UI.ic(SL.Apps[w.app].icon, 15)}<span class="ellipsis">${U.esc(SL.Apps[w.app].title)}</span></button>`).join('');
    const lb = $('[data-live]', tb); if (lb) lb.onclick = () => { if (SL.LiveUI.visible()) SL.LiveUI.minimize(); else SL.LiveUI.restore(); };
    $$('[data-w]', tb).forEach(b => b.onclick = () => { const w = wins.find(x => x.id === b.dataset.w); if (!w) return; if (SL.LiveUI && SL.LiveUI.visible()) { SL.LiveUI.minimize(); w.min = false; w.el.hidden = false; UI.focusWin(w); return; } if (w.focus && !w.min) { w.min = true; w.el.hidden = true; w.focus = false; } else { w.min = false; w.el.hidden = false; UI.focusWin(w); } UI.renderTaskbar(); });
  };
  UI.focusWin = w => { wins.forEach(x => { x.focus = false; x.el.classList.remove('focus'); }); w.focus = true; w.el.classList.add('focus'); w.el.style.zIndex = ++zTop; UI.renderTaskbar(); };
  UI.closeWin = (w, silent) => { const a = SL.Apps[w.app]; if (a.onClose) a.onClose(w.ctx); w.unsub.forEach(([ev, fn]) => SL.bus.off(ev, fn)); w.el.remove(); wins.splice(wins.indexOf(w), 1); UI.renderTaskbar(); if (!silent && SL.audio) SL.audio.play('close'); };

  const makeCtx = (app, host, args, mode) => {
    const ctx = { app, args: args || {}, st: {}, mode, host };
    ctx.render = () => {
      const a = SL.Apps[app]; const sc = $('.app-body, .app-split > section', host); const top = sc ? sc.scrollTop : 0;
      const sc2 = $('.chat', host); const atBottom = sc2 ? sc2.scrollHeight - sc2.scrollTop - sc2.clientHeight < 30 : true;
      try { a.render(host, ctx); } catch (e) { console.error(e); host.innerHTML = '<div class="empty">Erro ao abrir o app: ' + U.esc(e.message) + '</div>'; }
      const sn = $('.app-body, .app-split > section', host); if (sn && !ctx.resetScroll) sn.scrollTop = top; ctx.resetScroll = false;
      void atBottom;
    };
    // apps com sig() só redesenham quando algo que aparece na tela mudou (o clique não se perde)
    ctx.rr = U.throttle(() => { if (!document.body.contains(host)) return; const a = SL.Apps[app]; if (a && a.sig) { const s = a.sig(ctx); if (s === ctx._sig) return; ctx._sig = s; } ctx.render(); }, 350);
    host.addEventListener('click', e => {
      const t = e.target.closest('[data-act]'); if (!t || !host.contains(t)) return;
      const a = SL.Apps[app]; if (!a.act) return;
      if (SL.audio) SL.audio.play('click');
      let r; try { r = a.act(t.dataset.act, t.dataset, ctx, e, t); } catch (err) { console.error(err); r = 'Erro: ' + err.message; }
      if (typeof r === 'string') UI.err(r);
    });
    host.addEventListener('change', e => { const a = SL.Apps[app]; if (a.change) a.change(e.target, ctx, e); });
    host.addEventListener('input', e => { const a = SL.Apps[app]; if (a.input) a.input(e.target, ctx, e); });
    return ctx;
  };

  UI.openApp = (id, args) => {
    const a = SL.Apps[id]; if (!a) return;
    if (UI.screen !== 'game') return;
    if (SL.LiveUI && SL.LiveUI.visible() && UI.pcOpen()) SL.LiveUI.minimize();
    const wantPC = UI.pcOpen() || (a.phone === false || !a.phone) ;
    if (UI.pcOpen() || (!a.phone && UI.canUsePC())) {
      if (!UI.pcOpen()) UI.openPC(); if (!UI.pcOpen()) return;
      if (a.pc === false) return UI.openPhone(id, args);
      const ex = wins.find(w => w.app === id);
      if (ex) { ex.min = false; ex.el.hidden = false; if (args) { ex.ctx.args = args; ex.ctx.render(); } UI.focusWin(ex); return; }
      UI.newWin(id, args);
      return;
    }
    if (a.phone) return UI.openPhone(id, args);
    void wantPC;
    UI.err(a.title + ' só funciona no computador de casa.');
  };
  UI.newWin = (id, args) => {
    const a = SL.Apps[id]; const area = $('#overlay-pc .desk-area');
    const el = document.createElement('div'); el.className = 'win';
    const W0 = area.clientWidth, H0 = area.clientHeight;
    const w = Math.min(a.w || 900, W0 - 40), h = Math.min(a.h || 600, H0 - 30);
    const off = (wins.length % 5) * 26;
    el.style.width = w + 'px'; el.style.height = h + 'px'; el.style.left = Math.round(U.clamp((W0 - w) / 2 + off, 8, Math.max(8, W0 - w - 8))) + 'px'; el.style.top = Math.round(U.clamp((H0 - h) / 2 + off - 10, 8, Math.max(8, H0 - h - 8))) + 'px';
    el.innerHTML = `<div class="wh"><div class="wi" style="background:${a.color};${a.fg ? 'color:' + a.fg : ''}">${UI.ic(a.icon, 13)}</div><b>${U.esc(a.title)}</b><button class="ibtn" data-min title="Minimizar">${UI.ic('minimize', 15)}</button><button class="ibtn" data-max title="Maximizar">${UI.ic('maximize', 14)}</button><button class="ibtn" data-close title="Fechar">${UI.ic('x', 15)}</button></div><div class="wb"></div><div class="resize"></div>`;
    area.appendChild(el);
    const body = $('.wb', el);
    const win = { id: U.uid('w'), app: id, el, min: false, focus: false, unsub: [] };
    win.ctx = makeCtx(id, body, args, 'pc'); win.ctx.win = win;
    wins.push(win);
    if (a.max || W0 < 760 || (a.w || 900) > W0 - 120 || (a.h || 600) > H0 - 20) el.classList.add('max');
    $('[data-close]', el).onclick = () => UI.closeWin(win);
    $('[data-min]', el).onclick = () => { win.min = true; el.hidden = true; win.focus = false; UI.renderTaskbar(); };
    $('[data-max]', el).onclick = () => el.classList.toggle('max');
    el.addEventListener('mousedown', () => UI.focusWin(win));
    // arrastar e redimensionar
    const wh = $('.wh', el);
    wh.addEventListener('mousedown', e => {
      if (e.target.closest('button') || el.classList.contains('max')) return;
      const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
      const mv = ev => { el.style.left = U.clamp(ox + ev.clientX - sx, -w + 120, area.clientWidth - 80) + 'px'; el.style.top = U.clamp(oy + ev.clientY - sy, 0, area.clientHeight - 40) + 'px'; };
      const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
      window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    });
    wh.addEventListener('dblclick', () => el.classList.toggle('max'));
    $('.resize', el).addEventListener('mousedown', e => {
      e.stopPropagation(); const sx = e.clientX, sy = e.clientY, ow = el.offsetWidth, oh = el.offsetHeight;
      const mv = ev => { el.style.width = Math.max(320, ow + ev.clientX - sx) + 'px'; el.style.height = Math.max(220, oh + ev.clientY - sy) + 'px'; };
      const up = () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); win.ctx.render(); };
      window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    });
    (a.watch || []).forEach(ev => { const fn = () => { if (!el.hidden) win.ctx.rr(); }; SL.bus.on(ev, fn); win.unsub.push([ev, fn]); });
    win.ctx.render();
    UI.focusWin(win);
    if (SL.audio) SL.audio.play('open');
    return win;
  };

  // celular
  let phoneCtx = null, phoneUnsub = [];
  UI.openPhone = (appId, args) => {
    if (UI.pcOpen() && appId && SL.Apps[appId] && SL.Apps[appId].pc !== false) return UI.openApp(appId, args);
    const ov = $('#overlay-phone'); ov.hidden = false; document.body.classList.add('phone-open');
    if (!ov.firstChild) {
      ov.innerHTML = `<div class="phone-wrap"><div class="phone"><div class="screen-in"><div class="sbar"><span class="ph-clock"></span><span class="row gap4">${UI.ic('wifi', 13)}<span class="ph-bat"></span></span></div><div class="pbody"></div><div class="nav"><button class="ibtn" data-pback aria-label="Voltar">${UI.ic('left', 18)}</button><button class="ibtn" data-phome aria-label="Início">${UI.ic('home', 18)}</button><button class="ibtn" data-pclose aria-label="Guardar celular">${UI.ic('x', 18)}</button></div></div></div></div>`;
      $('.phone-wrap', ov).addEventListener('mousedown', e => { if (e.target.classList.contains('phone-wrap')) UI.closePhone(); });
      $('[data-phome]', ov).onclick = () => UI.phoneApp(null);
      $('[data-pback]', ov).onclick = () => { if (phoneCtx && phoneCtx.st.back) { phoneCtx.st.back(); } else UI.phoneApp(null); };
      $('[data-pclose]', ov).onclick = () => UI.closePhone();
    }
    UI.phoneApp(appId || null, args);
    if (SL.audio) SL.audio.play('open');
  };
  UI.closePhone = () => { const ov = $('#overlay-phone'); document.body.classList.remove('phone-open'); if (ov.hidden) return; ov.hidden = true; phoneUnsub.forEach(([e, f]) => SL.bus.off(e, f)); phoneUnsub = []; phoneCtx = null; };
  UI.phoneApp = (id, args) => {
    const body = $('#overlay-phone .pbody'); phoneUnsub.forEach(([e, f]) => SL.bus.off(e, f)); phoneUnsub = [];
    const fresh = body.cloneNode(false); body.replaceWith(fresh);
    if (!id) {
      phoneCtx = null;
      const G = SL.G;
      fresh.innerHTML = `<div class="phone-home"><div><div class="big-t">${SL.Clock.fmtTime(G.time.t)}</div><div class="muted">${SL.Clock.fmtFull(G.time.t)}</div></div><div class="app-grid">${UI.appList('phone').map(k => { const a = SL.Apps[k]; const b = a.badge ? a.badge() : 0; return `<button class="dicon" data-app="${k}"><div class="ai" style="background:${a.color};${a.fg ? 'color:' + a.fg : ''}">${UI.ic(a.icon, 22)}${b ? '<span class="badge">' + (b > 99 ? '99+' : b) + '</span>' : ''}</div><span>${U.esc(a.short || a.title)}</span></button>`; }).join('')}</div></div>`;
      $$('[data-app]', fresh).forEach(b => b.onclick = () => UI.phoneApp(b.dataset.app));
      return;
    }
    const a = SL.Apps[id]; if (!a) return;
    if (!a.phone) { UI.toast({ title: 'Precisa do computador', text: a.title + ' só abre no computador de casa.', icon: 'laptop', cat: 'sistema' }); return UI.phoneApp(null); }
    phoneCtx = makeCtx(id, fresh, args, 'phone');
    (a.watch || []).forEach(ev => { const fn = () => phoneCtx && phoneCtx.rr(); SL.bus.on(ev, fn); phoneUnsub.push([ev, fn]); });
    phoneCtx.render();
  };

  // ---------- central de notificações: fica no celular ----------
  UI.toggleNotifs = () => UI.openPhone('notificacoes');

  // ---------- confete (subida de nível) ----------
  UI.confetti = () => {
    if (SL.settings && SL.settings.reduceMotion) return;
    const cv = document.createElement('canvas'); cv.className = 'confetti'; $('#app').appendChild(cv);
    const w = cv.width = innerWidth, h = cv.height = innerHeight; const c = cv.getContext('2d');
    const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * w, y: -20 - Math.random() * h * 0.4, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, r: Math.random() * 6.3, c: SL.D.shirtColors[Math.floor(Math.random() * 12)] }));
    let f = 0; const step = () => { c.clearRect(0, 0, w, h); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += 0.1; c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-4, -2, 8, 4); c.restore(); }); if (++f < 200) requestAnimationFrame(step); else cv.remove(); }; step();
  };

  // gráfico de linha simples (dados reais)
  UI.chart = (cv, series, o) => {
    o = o || {}; const dpr = Math.min(2, window.devicePixelRatio || 1); const w = cv.clientWidth || 300, h = cv.clientHeight || 120;
    cv.width = w * dpr; cv.height = h * dpr; const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = { l: 38, r: 8, t: 8, b: 18 };
    const all = series.flatMap(s => s.data); const max = Math.max(1, ...all) * 1.1, min = o.min != null ? o.min : 0;
    c.strokeStyle = '#262e40'; c.fillStyle = '#5c667e'; c.font = '10px JetBrains Mono, monospace'; c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let i = 0; i <= 3; i++) { const y = pad.t + (h - pad.t - pad.b) * i / 3; c.beginPath(); c.moveTo(pad.l, y); c.lineTo(w - pad.r, y); c.stroke(); c.fillText(U.num(max - (max - min) * i / 3), pad.l - 5, y); }
    if (o.labels) { c.textAlign = 'center'; c.textBaseline = 'top'; const n = o.labels.length; [0, Math.floor(n / 2), n - 1].forEach(i => { if (o.labels[i] == null) return; c.fillText(o.labels[i], pad.l + (w - pad.l - pad.r) * (n > 1 ? i / (n - 1) : 0.5), h - pad.b + 4); }); }
    series.forEach(s => {
      const d = s.data; if (!d.length) return; const n = d.length;
      const X = i => pad.l + (w - pad.l - pad.r) * (n > 1 ? i / (n - 1) : 0.5), Y = v => pad.t + (h - pad.t - pad.b) * (1 - (v - min) / (max - min));
      c.beginPath(); d.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v)));
      if (s.fill !== false) { c.save(); c.lineTo(X(n - 1), h - pad.b); c.lineTo(X(0), h - pad.b); c.closePath(); c.fillStyle = U.rgba(s.color, 0.14); c.fill(); c.restore(); c.beginPath(); d.forEach((v, i) => i ? c.lineTo(X(i), Y(v)) : c.moveTo(X(i), Y(v))); }
      c.strokeStyle = s.color; c.lineWidth = 2; c.stroke();
      c.fillStyle = s.color; c.beginPath(); c.arc(X(n - 1), Y(d[n - 1]), 3, 0, 7); c.fill();
    });
  };
})(window.SL);

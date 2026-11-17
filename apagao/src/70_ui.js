/* Tela: barras, relógio, atalhos, mochila, fabricação, mapa e menus. */
const $ = id => document.getElementById(id);
const UI = {
  cont: null, sel: null, tick: 0, hotKey: '', mapImg: null, back: 'menu',
  init() {
    /* ícones das barras */
    const draw = { hp: g => { g.fillStyle = '#b8402e'; g.beginPath(); g.moveTo(20, 34); g.bezierCurveTo(2, 20, 6, 6, 20, 13); g.bezierCurveTo(34, 6, 38, 20, 20, 34); g.fill(); },
      hunger: g => { g.strokeStyle = '#b98a3c'; g.lineWidth = 3.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(12, 6); g.lineTo(12, 34); g.moveTo(7, 6); g.lineTo(7, 15); g.quadraticCurveTo(12, 20, 17, 15); g.lineTo(17, 6); g.moveTo(29, 34); g.lineTo(29, 6); g.quadraticCurveTo(36, 12, 29, 21); g.stroke(); },
      thirst: g => { g.fillStyle = '#4f8fa8'; g.beginPath(); g.moveTo(20, 5); g.quadraticCurveTo(34, 22, 30, 29); g.arc(20, 26, 10.5, 0.3, Math.PI - 0.3); g.quadraticCurveTo(6, 22, 20, 5); g.fill(); },
      energy: g => { g.fillStyle = '#8a79b0'; g.beginPath(); g.arc(20, 20, 14, 0.6, 5.2); g.arc(26, 15, 11, 4.7, 1.2, true); g.fill(); },
      stam: g => { g.fillStyle = '#86a35c'; g.beginPath(); g.moveTo(23, 4); g.lineTo(9, 22); g.lineTo(19, 22); g.lineTo(16, 36); g.lineTo(31, 17); g.lineTo(21, 17); g.closePath(); g.fill(); } };
    document.querySelectorAll('.bar').forEach(b => draw[b.dataset.k](b.querySelector('canvas').getContext('2d')));
    const on = (id, fn) => $(id).addEventListener('click', () => { AudioSys.init(); AudioSys.click(); fn(); });
    on('b-new', () => Main.newGame()); on('b-cont', () => Main.continueGame());
    on('b-help', () => this.show('help', 'menu')); on('b-cfg', () => this.show('cfg', 'menu'));
    on('p-resume', () => Main.resume()); on('p-help', () => this.show('help', 'pause')); on('p-cfg', () => this.show('cfg', 'pause'));
    on('p-quit', () => { Save.write(); Main.toMenu(); });
    on('c-back', () => this.show(this.back)); on('h-back', () => this.show(this.back));
    on('d-new', () => Main.newGame()); on('d-menu', () => Main.toMenu());
    on('take-all', () => { if (!this.cont) return; const L = World.lootOf(this.cont); for (let i = L.length - 1; i >= 0; i--) if (Player.add(L[i])) L.splice(i, 1); AudioSys.pickup(); this.renderInv(); });
    const bind = (id, k, sc, after) => { const el = $(id); el.value = Math.round(Settings[k] * sc); el.addEventListener('input', () => { Settings[k] = el.value / sc; saveSettings(); AudioSys.volumes(); if (after) after(); }); };
    bind('c-vol', 'vol', 100); bind('c-sfx', 'sfx', 100); bind('c-mus', 'mus', 100);
    const chk = (id, k) => { const el = $(id); el.checked = !!Settings[k]; el.addEventListener('change', () => { Settings[k] = el.checked; saveSettings(); AudioSys.volumes(); }); };
    chk('c-music', 'music'); chk('c-shadows', 'shadows'); chk('c-shake', 'shake');
    const zm = $('c-zoom'); zm.value = Settings.zoom ? Math.round(Settings.zoom * 10) : 0;
    zm.addEventListener('input', () => { Settings.zoom = +zm.value < 8 ? 0 : zm.value / 10; saveSettings(); Render.resize(); });
    $('inv').addEventListener('mousedown', e => { if (e.target === $('inv')) this.closeInv(); });
  },
  show(name, back) {
    if (back) this.back = back;
    for (const s of ['menu', 'pause', 'cfg', 'help', 'death']) $(s).hidden = s !== name;
    if (name === 'menu') $('b-cont').hidden = !Save.has();
  },
  hideAll() { for (const s of ['menu', 'pause', 'cfg', 'help', 'death']) $(s).hidden = true; },
  showDeath() {
    const h = Math.floor(((G.day - 1) * 1440 + G.time - 480) / 60);
    $('d-stats').innerHTML = 'Você sobreviveu <b>' + Math.floor(h / 24) + ' dia' + (Math.floor(h / 24) === 1 ? '' : 's') + ' e ' + (h % 24) + ' h</b> em Santa Aurora.<br>Zumbis abatidos: <b>' + G.kills + '</b>';
    setTimeout(() => { this.closeInv(); this.show('death'); }, 1400);
  },
  toasts() { $('toasts').innerHTML = G.msgs.map(m => '<div class="' + m.kind + '">' + m.txt + '</div>').join(''); },
  update(dt) {
    const P = Player;
    let ch = false;
    for (let i = G.msgs.length - 1; i >= 0; i--) { G.msgs[i].t -= dt; if (G.msgs[i].t <= 0) { G.msgs.splice(i, 1); ch = true; } }
    if (ch) this.toasts();
    $('hurt').style.opacity = Math.max(G.hurtFlash, P.hp < 30 && G.state === 'play' ? 0.35 + 0.15 * Math.sin(G.now * 4) : 0).toFixed(2);
    document.body.classList.toggle('sleeping', !!G.sleeping && G.state === 'play');
    if (G.state !== 'play') return;
    this.tick -= dt; if (this.tick > 0) return; this.tick = 0.12;
    for (const b of document.querySelectorAll('.bar')) { const v = P[b.dataset.k]; b.querySelector('span').style.width = clamp(v, 0, 100) + '%'; b.classList.toggle('low', v < 22); }
    $('ck-time').textContent = fmtHora(G.time); $('ck-day').textContent = 'Dia ' + G.day;
    $('ck-zone').textContent = ZONE_NOME[World.zone[idx(Math.floor(P.x), Math.floor(P.y))]] || '';
    const m = [];
    if (P.bleed > 0) m.push(['Sangrando', '']); if (P.infected) m.push(['Infectado', '']);
    if (P.hunger < 22) m.push([P.hunger <= 0 ? 'Morrendo de fome' : 'Com fome', P.hunger <= 0 ? '' : 'w']); if (P.thirst < 22) m.push([P.thirst <= 0 ? 'Desidratado' : 'Com sede', P.thirst <= 0 ? '' : 'w']);
    if (P.energy < 22) m.push(['Exausto', 'w']); if (P.weight() > P.cap()) m.push(['Peso demais', 'w']); if (P.sneak) m.push(['Agachado', 'w']);
    const ms = m.map(x => '<div class="' + x[1] + '">' + x[0] + '</div>').join(''); if (ms !== this._m) { this._m = ms; $('moodles').innerHTML = ms; }
    /* atalhos */
    const hk = P.hot.map((it, i) => it ? it.k + ':' + it.q + (P.eq.hand === it ? '*' : '') : '-').join('|');
    if (hk !== this.hotKey) {
      this.hotKey = hk; const hb = $('hotbar'); hb.innerHTML = '';
      P.hot.forEach((it, i) => { const d = document.createElement('div'); d.className = 'hs' + (it && P.eq.hand === it ? ' on' : ''); d.innerHTML = '<b>' + (i + 1) + '</b>' + (it && it.q > 1 ? '<i>' + it.q + '</i>' : ''); if (it) d.prepend(this.icon(it.k)); hb.appendChild(d); });
    }
    const h = P.eq.hand, d = h ? ITEMS[h.k] : null;
    let wi = '';
    if (d && d.t === 'gun') wi = d.n + ' · <em>' + h.a + '</em> / ' + P.count(d.ammo) + (P.reload > 0 ? ' · recarregando' : '');
    else if (d && d.t === 'melee') wi = d.n + ' · ' + Math.round(h.d / d.dur * 100) + '%';
    else if (d) wi = d.n + ' · ' + h.q;
    if (P.lightOn) { const l = P.inv.find(i => i.k === 'lanterna'); if (l) wi += (wi ? ' · ' : '') + 'lanterna ' + Math.round(l.c) + '%'; }
    if (wi !== this._w) { this._w = wi; $('wpninfo').innerHTML = wi; }
    const c = Interact.cur; let pr = '';
    if (c && !G.invOpen && !G.sleeping) pr = '<kbd>E</kbd>' + c.label + (c.canBarr && P.has('martelo') ? ' &nbsp; <kbd>B</kbd>Reforçar' : '');
    if (pr !== this._p) { this._p = pr; $('prompt').innerHTML = pr; }
    if (G.invOpen && this.cont && dist(P.x, P.y, this.cont.x + this.cont.w / 2, this.cont.y + this.cont.h / 2) > 3.2) this.closeInv();
  },
  icon(k) { const c = document.createElement('canvas'); c.width = c.height = 64; c.getContext('2d').drawImage(itemIcon(k, 64), 0, 0); return c; },
  openInv(cont) { this.cont = cont || null; this.sel = null; G.invOpen = true; $('inv').hidden = false; this.renderInv(); },
  closeInv() { G.invOpen = false; this.cont = null; $('inv').hidden = true; },
  slot(it, src, eqd) {
    const d = ITEMS[it.k], el = document.createElement('div');
    el.className = 'slot' + (this.sel && this.sel.it === it ? ' sel' : '') + (eqd ? ' eq' : '');
    el.title = d.n; el.appendChild(this.icon(it.k));
    if (it.q > 1) el.insertAdjacentHTML('beforeend', '<i>' + it.q + '</i>');
    if (d.t === 'melee') el.insertAdjacentHTML('beforeend', '<u><s style="width:' + Math.round(it.d / d.dur * 100) + '%"></s></u>');
    if (d.t === 'gun') el.insertAdjacentHTML('beforeend', '<i>' + it.a + '/' + d.mag + '</i>');
    const hi = Player.hot.indexOf(it); if (hi >= 0 && src === 'inv') el.insertAdjacentHTML('beforeend', '<b>' + (hi + 1) + '</b>');
    el.addEventListener('click', () => { this.sel = { it, src }; AudioSys.click(); this.renderInv(); });
    el.addEventListener('dblclick', () => this.quick(it, src));
    el.addEventListener('contextmenu', e => { e.preventDefault(); this.quick(it, src); });
    return el;
  },
  quick(it, src) {
    const P = Player;
    if (src === 'cont') this.takeFrom(it);
    else if (this.cont) this.putIn(it);
    else P.use(it);
    this.sel = null; this.renderInv();
  },
  takeFrom(it) { const L = World.lootOf(this.cont); if (Player.add(it)) { L.splice(L.indexOf(it), 1); AudioSys.pickup(); } else toast('Inventário cheio.'); },
  putIn(it) { const L = World.lootOf(this.cont); if (L.length >= 24) { toast('Não cabe mais nada aí.'); return; } Player.removeItem(it); L.push(it); AudioSys.pickup(); },
  renderInv() {
    if (!G.invOpen) return;
    const P = Player, w = P.weight(), cap = P.cap();
    $('inv-w').textContent = w.toFixed(1).replace('.', ',') + ' / ' + cap + ' kg · ' + P.inv.length + ' / ' + P.slots() + ' espaços';
    $('inv-w').className = w > cap ? 'over' : '';
    const eq = $('eq'); eq.innerHTML = '';
    for (const [k, n] of [['hand', 'Mão'], ['body', 'Corpo'], ['head', 'Cabeça'], ['bag', 'Mochila']]) {
      const it = P.eq[k], el = document.createElement('div'); el.className = 'eqs';
      el.innerHTML = '<small>' + n + '</small>' + (it ? ITEMS[it.k].n : '—');
      if (it) el.addEventListener('click', () => { this.sel = { it, src: 'inv' }; this.renderInv(); });
      eq.appendChild(el);
    }
    const gr = $('inv-grid'); gr.innerHTML = '';
    const eqd = it => P.eq.hand === it || P.eq.body === it || P.eq.head === it || P.eq.bag === it;
    for (const it of P.inv) gr.appendChild(this.slot(it, 'inv', eqd(it)));
    for (let i = P.inv.length; i < P.slots(); i++) { const e = document.createElement('div'); e.className = 'slot'; e.style.cursor = 'default'; gr.appendChild(e); }
    const cg = $('cont-grid'), cr = $('craft');
    if (this.cont) {
      const L = World.lootOf(this.cont);
      $('side-title').textContent = PROPS[this.cont.t].n || 'Recipiente'; cg.hidden = false; cr.hidden = true; $('take-all').hidden = !L.length; cg.innerHTML = '';
      for (const it of L) cg.appendChild(this.slot(it, 'cont'));
      if (!L.length) cg.innerHTML = '<p class="tip">Vazio.</p>';
    } else {
      $('side-title').textContent = 'Fabricar'; cg.hidden = true; cr.hidden = false; $('take-all').hidden = true; cr.innerHTML = '';
      for (const r of RECIPES) {
        let ok = true; const parts = [];
        for (const k in r.need) { const have = P.count(k); if (have < r.need[k]) ok = false; parts.push(r.need[k] + ' ' + ITEMS[k].n.toLowerCase()); }
        if (r.tool && !P.has(r.tool)) ok = false;
        const el = document.createElement('div'); el.className = 'rec'; el.appendChild(this.icon(r.out));
        el.insertAdjacentHTML('beforeend', '<div>' + r.n + '<small class="' + (ok ? '' : 'no') + '">' + parts.join(' + ') + (r.tool ? ' · precisa de ' + ITEMS[r.tool].n.toLowerCase() : '') + '</small></div>');
        const b = document.createElement('button'); b.className = 'btn sm'; b.textContent = 'Fazer'; b.disabled = !ok;
        b.addEventListener('click', () => { for (const k in r.need) P.take(k, r.need[k]); const it = newItem(r.out, r.q); if (!P.add(it)) Ground.drop(P.x, P.y, it); AudioSys.rip(); toast('Feito: ' + r.n + '.', 'ok'); this.renderInv(); });
        el.appendChild(b); cr.appendChild(el);
      }
    }
    /* detalhe */
    const dt = $('detail'), s = this.sel;
    if (!s || (s.src === 'inv' && !P.inv.includes(s.it)) || (s.src === 'cont' && (!this.cont || !World.lootOf(this.cont).includes(s.it)))) { dt.innerHTML = '<p>Escolha um item para ver o que ele faz.</p>'; return; }
    const it = s.it, d = ITEMS[it.k], st = [];
    if (d.t === 'melee') st.push('Dano ' + d.dmg, 'Alcance ' + d.rng.toFixed(1).replace('.', ','), 'Velocidade ' + d.spd.toFixed(2).replace('.', ',') + ' s', 'Estado ' + Math.round(it.d / d.dur * 100) + '%');
    if (d.t === 'gun') st.push('Dano ' + d.dmg + (d.pellets ? ' x' + d.pellets : ''), 'Alcance ' + d.rng, 'Precisão ' + Math.round(d.prec * 100) + '%', 'Pente ' + it.a + '/' + d.mag, 'Barulho ' + d.noise);
    if (d.hunger) st.push('Fome ' + (d.hunger > 0 ? '+' : '') + d.hunger); if (d.thirst) st.push('Sede ' + (d.thirst > 0 ? '+' : '') + d.thirst);
    if (d.energy) st.push('Energia ' + (d.energy > 0 ? '+' : '') + d.energy); if (d.hp) st.push('Saúde +' + d.hp); if (d.bleed) st.push('Estanca sangramento'); if (d.cure) st.push('Cura infecção');
    if (d.def) st.push('Proteção ' + Math.round(d.def * 100) + '%'); if (d.cap) st.push('+' + d.cap + ' kg');
    if (it.k === 'lanterna') st.push('Pilha ' + Math.round(it.c) + '%');
    st.push((d.w * it.q).toFixed(2).replace('.', ',') + ' kg');
    dt.innerHTML = '<h3>' + d.n + (it.q > 1 ? ' x' + it.q : '') + '</h3><p>' + d.d + '</p><div class="st">' + st.join(' · ') + '</div><div class="acts"></div>';
    const acts = dt.querySelector('.acts');
    const btn = (txt, fn) => { const b = document.createElement('button'); b.className = 'btn sm'; b.textContent = txt; b.addEventListener('click', () => { fn(); this.renderInv(); }); acts.appendChild(b); };
    if (s.src === 'cont') { btn('Pegar', () => { this.takeFrom(it); this.sel = null; }); return; }
    const equipT = ['melee', 'gun', 'throw', 'body', 'head', 'bag'].includes(d.t);
    if (equipT) btn(eqd(it) ? 'Guardar' : 'Equipar', () => P.equip(it));
    else if (['food', 'drink', 'med'].includes(d.t) || ['pilhas', 'fita', 'lanterna'].includes(it.k)) btn(d.t === 'food' ? 'Comer' : d.t === 'drink' ? 'Beber' : it.k === 'lanterna' ? 'Ligar / desligar' : 'Usar', () => P.use(it));
    if (this.cont) btn('Guardar aqui', () => { this.putIn(it); this.sel = null; });
    btn('Largar', () => P.drop(it, false)); if (it.q > 1) btn('Largar tudo', () => P.drop(it, true));
    if (['melee', 'gun', 'throw', 'food', 'drink', 'med'].includes(d.t)) for (let i = 0; i < 5; i++) btn('Atalho ' + (i + 1), () => { const o = P.hot.indexOf(it); if (o >= 0) P.hot[o] = null; P.hot[i] = it; });
  },
  /* mapa */
  toggleMap() {
    G.mapOpen = !G.mapOpen; $('map').hidden = !G.mapOpen;
    if (!G.mapOpen) return;
    const W = World, COL = { casa: '#b9a070', casa_morro: '#a8623e', predio: '#8f8f96', upa: '#4fa878', delegacia: '#4a6fb0', escola: '#d6c040', igreja: '#e2dccb', galpao: '#77808a', mercado: '#c2531e', farmacia: '#58c088' };
    if (!this.mapImg) {
      const [c, g] = mk(MW * 2, MH * 2);
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const i = idx(x, y), t = W.ground[i], b = W.bld[i];
        let col = t === GR.GRASS || t === GR.DRYG || t === GR.FIELD ? '#39442c' : t === GR.DIRT ? '#5a4030' : t === GR.SIDE || t === GR.PORT ? '#6a675f' : (t === GR.ASPH || (t >= GR.LW && t <= GR.PARK) || t === GR.DLW || t === GR.DLN) ? '#2c2c2e' : '#55534c';
        if (b) { const T = W.builds[b].type; col = COL[T] || (BT[T].sign ? '#b0703a' : '#8a8478'); }
        g.fillStyle = col; g.fillRect(x * 2, y * 2, 2, 2);
      }
      this.mapImg = c;
      $('legend').innerHTML = [['#b9a070', 'Casas'], ['#b0703a', 'Comércio'], ['#c2531e', 'Mercado'], ['#58c088', 'Farmácia'], ['#4fa878', 'UPA'], ['#4a6fb0', 'Delegacia'], ['#d6c040', 'Escola'], ['#77808a', 'Galpões'], ['#f4f0e6', 'Você'], ['#c9a83a', 'Sua casa']].map(e => '<span><i style="background:' + e[0] + '"></i>' + e[1] + '</span>').join('');
    }
    const g = $('mapcv').getContext('2d'); g.drawImage(this.mapImg, 0, 0);
    const hb = W.builds[W.home]; g.strokeStyle = '#c9a83a'; g.lineWidth = 2; g.strokeRect(hb.x0 * 2 - 2, hb.y0 * 2 - 2, (hb.x1 - hb.x0 + 1) * 2 + 4, (hb.y1 - hb.y0 + 1) * 2 + 4);
    g.fillStyle = '#f4f0e6'; g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); g.arc(Player.x * 2, Player.y * 2, 4.5, 0, 7); g.fill(); g.stroke();
  }
};

/* ---------- salvamento ---------- */
const Save = {
  key: 'apagao_save_v1',
  has() { try { return !!localStorage.getItem(this.key); } catch (e) { return false; } },
  clear() { try { localStorage.removeItem(this.key); } catch (e) {} },
  write() {
    if (G.state === 'menu' || Player.dead) return;
    const P = Player, W = World, ix = it => P.inv.indexOf(it);
    const d = { v: 1, day: G.day, time: G.time, kills: G.kills, water: G.waterOff, now: G.now,
      p: { x: P.x, y: P.y, a: P.a, hp: P.hp, hunger: P.hunger, thirst: P.thirst, energy: P.energy, stam: P.stam, bleed: P.bleed, inf: P.infected, infT: P.infT, inv: P.inv, eq: { hand: ix(P.eq.hand), body: ix(P.eq.body), head: ix(P.eq.head), bag: ix(P.eq.bag) }, hot: P.hot.map(ix) },
      loot: W.loot, ch: W.changed || {}, barr: W.barr ? [...W.barr] : [], ehp: [...W.edgeHp], used: W.used || {},
      gi: Ground.items.map(g => [+g.x.toFixed(2), +g.y.toFixed(2), g.it]),
      z: Zombies.list.filter(z => !z.dead).map(z => [+z.x.toFixed(1), +z.y.toFixed(1), z.type, Math.round(z.hp)]) };
    try { localStorage.setItem(this.key, JSON.stringify(d)); } catch (e) {}
  },
  load() {
    let d; try { d = JSON.parse(localStorage.getItem(this.key)); } catch (e) { return false; }
    if (!d || d.v !== 1) return false;
    const P = Player, W = World;
    G.day = d.day; G.time = d.time; G.kills = d.kills; G.waterOff = d.water; G.now = d.now || 0;
    Object.assign(P, { x: d.p.x, y: d.p.y, a: d.p.a, hp: d.p.hp, hunger: d.p.hunger, thirst: d.p.thirst, energy: d.p.energy, stam: d.p.stam, bleed: d.p.bleed, infected: d.p.inf, infT: d.p.infT, inv: d.p.inv });
    for (const k in d.p.eq) P.eq[k] = d.p.eq[k] >= 0 ? P.inv[d.p.eq[k]] : null;
    P.hot = d.p.hot.map(i => i >= 0 ? P.inv[i] : null);
    W.loot = d.loot || {}; W.changed = d.ch || {};
    const N = MW * MH;
    for (const k in W.changed) { const key = +k; if (key >= N) W.eW[key - N] = W.changed[k]; else W.eN[key] = W.changed[k]; }
    W.barr = new Set(d.barr || []); W.edgeHp = new Map(d.ehp || []); W.used = d.used || {};
    for (const id in W.used) if (W.props[id]) W.props[id].uses = W.used[id];
    Ground.items = (d.gi || []).map(e => ({ x: e[0], y: e[1], it: e[2] }));
    Zombies.list.length = 0;
    for (const e of d.z || []) { const z = Zombies.make(e[0], e[1], e[2]); z.hp = e[3]; }
    return true;
  }
};

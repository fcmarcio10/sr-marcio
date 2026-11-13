/* ============================ INTERFACE ============================ */
const $ = (id) => document.getElementById(id);
const UI = {
  last: {},
  set(id, v, prop) {
    const k = id + (prop || '');
    if (this.last[k] === v) return;
    this.last[k] = v;
    const el = $(id);
    if (!el) return;
    if (prop === 'width') el.style.width = v;
    else if (prop === 'bg') el.style.background = v;
    else if (prop === 'html') el.innerHTML = v;
    else el.textContent = v;
  },
  moneyDelta(v) {
    const el = $('money-delta');
    el.textContent = (v >= 0 ? '+ R$ ' : '− R$ ') + fmtMoney(Math.abs(v));
    el.className = 'show ' + (v >= 0 ? 'pos' : 'neg');
    clearTimeout(this._md);
    this._md = setTimeout(() => { el.className = ''; }, 1800);
  },
  bannerT: 0, region: null,
};
function toast(title, text, kind) {
  const box = $('toasts');
  const d = document.createElement('div');
  d.className = 'toast ' + (kind || '');
  const b = document.createElement('b'); b.textContent = title; d.appendChild(b);
  if (text) d.appendChild(document.createTextNode(text));
  box.appendChild(d);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 600); }, 4600);
}

/* ---------- pilha de telas ---------- */
const Screens = {
  current: null, stack: [],
  show(id) { $(id).classList.remove('hidden'); },
  hide(id) { $(id).classList.add('hidden'); },
  open(id) {
    if (this.current) { this.hide(this.current); this.stack.push(this.current); }
    this.show(id); this.current = id; this.onOpen(id);
    updateHudVisibility();
  },
  replace(id) { if (this.current) this.hide(this.current); this.show(id); this.current = id; this.onOpen(id); updateHudVisibility(); },
  back() {
    if (!this.current) return;
    if (this.current === 'screen-main') return;
    this.hide(this.current);
    const prev = this.stack.pop();
    if (prev) { this.show(prev); this.current = prev; this.onOpen(prev); }
    else this.current = null;
    AudioSys.back();
    updateHudVisibility();
  },
  closeAll() { if (this.current) this.hide(this.current); for (const s of this.stack) this.hide(s); this.stack.length = 0; this.current = null; updateHudVisibility(); },
  onOpen(id) {
    if (id === 'screen-settings') syncSettingsUI();
    if (id === 'screen-garage') Garage.render();
    if (id === 'screen-phone' && typeof Phone !== 'undefined') Phone.render();
    if (id === 'screen-map') { renderMapDests(); requestAnimationFrame(() => { if (!bigMap) bigMap = new MapView(bigCanvas, MapState.full); if (MapState.full.follow && player) { MapState.full.cx = player.x; MapState.full.cy = player.y; } drawBigMap(); }); }
    if (id === 'screen-pause') renderPauseStats();
    if (id === 'screen-main') $('btn-continue').disabled = !hasSave;
    if (id === 'screen-pause') $('btn-abandon').disabled = !(Act.race || Act.delivery || Act.waypoint);
  },
};
function updateHudVisibility() {
  const show = Game.mode === 'play' && (!Screens.current || Screens.current === 'screen-dialog');
  $('hud').classList.toggle('hidden', !show);
}

/* ---------- botões e menus ---------- */
function bindMenus() {
  // convite de evento: clique aceita/recusa sem tirar o foco do jogo (senão o espaço apertaria o botão)
  for (const [sel, yes] of [['.evo-yes', true], ['.evo-no', false]]) {
    const b = document.querySelector('#ev-offer ' + sel); if (!b) continue;
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => { b.blur(); Events.answerOffer(yes); });
  }
  document.querySelectorAll('.mbtn').forEach((b) => {
    b.addEventListener('mouseenter', () => AudioSys.hover());
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    AudioSys.init();
    const act = b.dataset.act;
    if (act !== 'back') AudioSys.click();
    switch (act) {
      case 'play': if (hasSave) confirmBox('Novo jogo', 'Começar do zero? Seu progresso salvo (dinheiro, carros e descobertas) será apagado.', () => newGame()); else newGame(); break;
      case 'continue': continueGame(); break;
      case 'quit': confirmBox('Sair do jogo', 'Fechar o BR Night Drive? Seu progresso fica salvo.', () => { if (player && Game.mode === 'play') saveGame(); setTimeout(() => window.brnd && window.brnd.quit(), 120); }); break;
      case 'garage': Garage.sel = Profile.current; Screens.open('screen-garage'); break;
      case 'settings': Screens.open('screen-settings'); break;
      case 'credits': Screens.open('screen-credits'); break;
      case 'back': Screens.back(); break;
      case 'resume': Screens.closeAll(); break;
      case 'abandon': abandonActivity(); Screens.closeAll(); break;
      case 'reset': resetVehicle(); Screens.closeAll(); break;
      case 'save-quit': saveGame(); toMenu(); break;
    }
  });
  $('confirm-no').addEventListener('click', () => { AudioSys.back(); Screens.back(); });
  $('confirm-yes').addEventListener('click', () => { AudioSys.click(); const fn = confirmBox.fn; Screens.back(); if (fn) fn(); });
  $('map-back').addEventListener('click', () => Screens.back());
  $('map-ctrls-full').addEventListener('click', (e) => { const b = e.target.closest('[data-mz]'); if (b && bigMap) mapCtrl(bigMap, b.dataset.mz); });
  window.addEventListener('resize', () => { resize(); drawBigMap(); });
}
function confirmBox(title, text, fn) {
  $('confirm-title').textContent = title; $('confirm-text').textContent = text;
  confirmBox.fn = fn;
  Screens.open('screen-confirm');
}

/* ---------- configurações ---------- */
function syncSettingsUI() {
  document.querySelectorAll('[data-set]').forEach((inp) => {
    const k = inp.dataset.set;
    inp.value = Settings[k];
    inp.nextElementSibling.textContent = k === 'zoom' ? Settings[k] + '%' : Settings[k];
  });
  document.querySelectorAll('[data-seg]').forEach((seg) => {
    const k = seg.dataset.seg;
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(Settings[k]) === b.dataset.v));
  });
}
function bindSettings() {
  document.querySelectorAll('[data-set]').forEach((inp) => {
    inp.addEventListener('input', () => {
      const k = inp.dataset.set;
      Settings[k] = Number(inp.value);
      inp.nextElementSibling.textContent = k === 'zoom' ? Settings[k] + '%' : Settings[k];
      AudioSys.applyVolumes();
      saveSettings();
    });
    inp.addEventListener('change', () => { if (inp.dataset.set === 'ui') AudioSys.click(); });
  });
  document.querySelectorAll('[data-seg]').forEach((seg) => {
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const k = seg.dataset.seg;
      const v = b.dataset.v;
      Settings[k] = v === 'true' ? true : v === 'false' ? false : v;
      AudioSys.click();
      if (k === 'quality') { resize(); clearChunks(); forceGround = true; Particles.list.length = 0; }
      if (k === 'showFps') $('fps').classList.toggle('hidden', !Settings.showFps);
      if (k === 'cam') { Settings.zoom = CAM_LEVELS[v]; CamPrev.show(v); }
      saveSettings(); syncSettingsUI();
    });
  });
}

/* ---------- prévia da altura da câmera ---------- */
// desenha a cena atual na altura escolhida (como fica dirigindo parado) numa janelinha
const CamPrev = { lvl: null, t: 0, hideT: null };
CamPrev.show = function (lvl) {
  this.lvl = lvl; this.t = 0;
  const box = $('cam-prev'); box.classList.remove('hidden');
  box.querySelector('.cp-cap').textContent = 'Nível ' + lvl + ' · ' + CAM_LEVELS[lvl] + '%' + (lvl === '1' ? ' · mais perto (padrão)' : lvl === '3' ? ' · mais alto' : '');
  this.snap();
  clearTimeout(this.hideT); this.hideT = setTimeout(() => this.hide(), 6000);
};
CamPrev.hide = function () { this.lvl = null; $('cam-prev').classList.add('hidden'); };
CamPrev.snap = function () {
  if (!this.lvl) return;
  const z0 = Cam.zoom, cv = $('cam-prev').querySelector('canvas'), g = cv.getContext('2d');
  Cam.zoom = screenZoomBase() * CAM_LEVELS[this.lvl] / 100;
  render();
  // recorta o meio da tela no formato da janelinha
  const W = canvas.width, H = canvas.height, r = cv.width / cv.height;
  let sw = W, sh = W / r; if (sh > H) { sh = H; sw = H * r; }
  g.drawImage(canvas, (W - sw) / 2, (H - sh) / 2, sw, sh, 0, 0, cv.width, cv.height);
  Cam.zoom = z0; render(); // devolve a tela de trás como estava
};
// atualiza a janelinha algumas vezes por segundo enquanto está aberta
CamPrev.update = function (dt) {
  if (!this.lvl) return;
  if (Screens.current !== 'screen-settings') return this.hide();
  this.t += dt; if (this.t > 0.25) { this.t = 0; this.snap(); }
};

/* ---------- garagem ---------- */
const CAR_KIND_TXT = { gas: 'Caminhão de gás', guincho: 'Guincho', cacamba: 'Caçamba', bau: 'Caminhão baú', tanker: 'Caminhão-tanque', quadrado: 'Hatch quadrado', besouro: 'Clássico a ar', escada: 'Hatch caixote', hatch: 'Hatch', van: 'Furgão', pickup: 'Picape', sedan: 'Sedã', santana: 'Sedã quadrado', sport: 'Esportivo', muscle: 'Clássico V6' };
const JOB_TXT = { pickup: 'fretes de picape', gas: 'entrega de gás', guincho: 'reboque de carros', cacamba: 'retirada de entulho', bau: 'cargas de baú', tanker: 'abastecer postos' };
function carTags(c) {
  const t = [];
  if (c.price === 0) t.push(['Carro inicial', 'g']);
  if (c.job) t.push(['Trabalho: ' + JOB_TXT[c.job], 'y']);
  if (c.cargo) t.push(['Entregas +' + Math.round((c.cargo - 1) * 100) + '%', 'y']);
  if (c.offroad) t.push(['Bom na terra', 'g']);
  if (c.max >= 560) t.push(['Muito rápido', 'r']); else if (c.max >= 500) t.push(['Rápido', 'r']);
  if (c.fuel <= 0.9) t.push(['Econômico', 'g']); else if (c.fuel >= 1.6) t.push(['Bebe muito', 'r']);
  if (VMODELS[c.model].kind === 'truck') t.push(['Não faz PegaAí', 'n']);
  return t;
}
const Garage = {
  sel: 'pampeiro', previewColor: null, t: 0, tab: 'perf', cat: 'paint', preview: {},
  previewKit() { const own = !!Profile.owned[this.sel]; return Object.assign({}, own ? carKit(this.sel) : KIT_DEFAULT, this.preview); },
  select(id) { this.sel = id; this.previewColor = null; this.preview = {}; if (!kitCatsFor(id).some((c) => c.id === this.cat)) this.cat = 'paint'; AudioSys.click(); this.render(); },
  render() {
    const sel = carById(this.sel), owned = !!Profile.owned[sel.id], br = brandOf(sel.model);
    $('garage-money').textContent = fmtMoney(Profile.money);
    // lista: meus carros / à venda
    const list = $('garage-list'); list.innerHTML = '';
    const mine = CARS.filter((c) => Profile.owned[c.id]), shop = CARS.filter((c) => !Profile.owned[c.id]);
    for (const [title, arr] of [['MEUS CARROS', mine], ['À VENDA', shop]]) {
      if (!arr.length) continue;
      const h = document.createElement('div'); h.className = 'g-sec'; h.textContent = title + ' · ' + arr.length; list.appendChild(h);
      for (const c of arr) {
        const b = brandOf(c.model), d = document.createElement('div');
        d.className = 'gcard' + (c.id === this.sel ? ' sel' : '');
        const st = Profile.current === c.id ? '<span class="cur">EM USO</span>' : Profile.owned[c.id] ? '<span class="own">NA GARAGEM</span>' : '<span class="price' + (Profile.money >= c.price ? ' ok' : '') + '">R$ ' + fmtMoney(c.price) + '</span>';
        d.innerHTML = `<div class="gbrand" style="color:${b.color}">${escapeHtml(b.name)}</div><div class="gname">${escapeHtml(c.name)}</div><div class="gsub"><span>${CAR_KIND_TXT[c.model] || ''}</span>${st}</div>`;
        d.addEventListener('click', () => this.select(c.id));
        d.addEventListener('mouseenter', () => AudioSys.hover());
        list.appendChild(d);
      }
    }
    // centro: marca na cor dela, com o slogan logo abaixo
    $('garage-brand').innerHTML = `<b style="color:${br.color}">${escapeHtml(br.name)}</b><i style="color:${br.color}">"${escapeHtml(br.slogan)}"</i>`;
    $('garage-car-title').textContent = sel.name;
    $('garage-tags').innerHTML = carTags(sel).map(([t, k]) => `<span class="gt-${k}">${escapeHtml(t)}</span>`).join('');
    $('garage-car-desc').textContent = sel.desc;
    const mb = $('garage-main-btn'), note = $('garage-main-note');
    if (!owned) { mb.textContent = 'COMPRAR POR R$ ' + fmtMoney(sel.price); mb.disabled = Profile.money < sel.price; note.textContent = Profile.money < sel.price ? 'Faltam R$ ' + fmtMoney(sel.price - Profile.money) + '.' : ''; }
    else if (Profile.current === sel.id) { mb.textContent = 'EM USO'; mb.disabled = true; note.textContent = ''; }
    else { mb.textContent = 'USAR ESTE CARRO'; mb.disabled = false; note.textContent = ''; }
    document.querySelectorAll('[data-gtab]').forEach((b) => b.classList.toggle('on', b.dataset.gtab === this.tab));
    $('garage-tab').innerHTML = this.tab === 'kit' ? this.kitHTML(sel, owned) : this.perfHTML(sel, owned);
  },
  perfHTML(sel, owned) {
    const cur = owned ? carStats(sel.id) : { max: sel.max, acc: sel.acc, brk: sel.brk, grip: sel.grip, steer: sel.steer };
    const word = (f) => f < 0.35 ? 'fraca' : f < 0.55 ? 'média' : f < 0.75 ? 'boa' : 'ótima';
    const rows = [['Velocidade máxima', sel.max, cur.max, 720, Math.round(cur.max * 0.3) + ' km/h'], ['Aceleração', sel.acc, cur.acc, 230], ['Freio', sel.brk, cur.brk, 520], ['Direção', sel.steer * sel.grip, cur.steer * cur.grip, 1.45]];
    let h = '<div class="side-title">COMO ELE ANDA</div><div id="garage-stats">' + rows.map(([n, b, c, mx, lab]) => {
      const pb = clamp(b / mx, 0, 1) * 100, pc = clamp(c / mx, 0, 1) * 100;
      return `<div class="stat"><div class="st-top"><span>${n}</span><span>${lab || word(pc / 100)}</span></div><div class="st-bar"><i class="up" style="width:${pc}%"></i><i style="width:${pb}%"></i></div></div>`;
    }).join('') + '</div><div class="side-title">MELHORIAS</div><div id="garage-upgrades">';
    const cfg = owned ? carCfg(sel.id) : null;
    const plain = { motor: 'Arranca mais rápido', cambio: 'Chega mais longe na velocidade', freio: 'Para em menos espaço', pneu: 'Segura melhor nas curvas' };
    for (const u of UPGRADES) {
      const lvl = owned ? cfg.up[u.id] : 0, cost = lvl < 3 ? upgradeCost(sel.id, u.id, lvl) : 0;
      h += `<div class="upg"><div class="un">${u.name}<small>${plain[u.id]}</small></div><div class="pips">${[0, 1, 2].map((i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div><button data-gup="${u.id}" ${!owned || lvl >= 3 || Profile.money < cost ? 'disabled' : ''}>${!owned ? '—' : lvl >= 3 ? 'MÁXIMO' : 'R$ ' + fmtMoney(cost)}</button></div>`;
    }
    h += '</div>' + (!owned ? '<div class="garage-note">Compre o carro para melhorar.</div>' : '');
    return h;
  },
  kitHTML(sel, owned) {
    const cats = kitCatsFor(sel.id), k = this.previewKit(), real = owned ? carKit(sel.id) : KIT_DEFAULT;
    let h = '<div class="kit-cats">' + cats.map((c) => `<button data-kcat="${c.id}" class="${c.id === this.cat ? 'on' : ''}">${KIT_ICONS[c.id] || ''}<span>${c.name}</span></button>`).join('') + '</div>';
    const C = KIT_CATS.find((c) => c.id === this.cat);
    h += `<div class="side-title">${C.name.toUpperCase()}</div>` + (KIT_DESC[C.id] ? `<p class="kit-desc">${KIT_DESC[C.id]}</p>` : '');
    if (C.id === 'paint') {
      const curColor = this.previewColor || (owned ? carCfg(sel.id).color : PALETTE[CARS.indexOf(sel) % PALETTE.length]);
      h += '<div id="garage-colors" class="swatches">' + PALETTE.map((col) => `<div class="sw${col === curColor ? ' on' : ''}" data-kcol="${col}" style="background:${col}" title="${owned ? 'Pintar (R$ 150)' : 'Ver cor'}"></div>`).join('') + '</div>';
      const pend = owned && this.previewColor && this.previewColor !== carCfg(sel.id).color;
      h += pend ? `<button class="kit-buy" data-kpaint="1" ${Profile.money < 150 ? 'disabled' : ''}>PINTAR — R$ 150</button>` : '';
    } else {
      h += '<div class="kit-opts">' + C.opts.map(([v, label, price]) => {
        const isReal = real[C.id] === v, isPrev = k[C.id] === v;
        const sw = C.id === 'neon' && v ? `<i class="kit-sw" style="background:${v};box-shadow:0 0 10px ${v}"></i>` : C.id === 'wheels' && v !== 'serie' ? `<i class="kit-sw" style="background:${RIMS[v]}"></i>` : '';
        return `<button data-kopt="${C.id}" data-kv="${String(v)}" class="${isPrev ? 'prev' : ''}${isReal ? ' inst' : ''}">${sw}<span>${escapeHtml(label)}</span><em>${isReal ? 'INSTALADO' : price ? 'R$ ' + fmtMoney(price) : 'GRÁTIS'}</em></button>`;
      }).join('') + '</div>';
      const pv = this.preview[C.id];
      if (pv !== undefined && pv !== real[C.id]) {
        const price = kitPrice(C.id, pv);
        h += owned ? `<button class="kit-buy" data-kbuy="${C.id}" ${Profile.money < price ? 'disabled' : ''}>${price ? 'INSTALAR — R$ ' + fmtMoney(price) : 'VOLTAR AO ORIGINAL (GRÁTIS)'}</button>` : '<div class="garage-note">Compre o carro para instalar.</div>';
      }
    }
    return h;
  },
  click(e) {
    const t = e.target.closest('[data-gtab],[data-kcat],[data-kcol],[data-kopt],[data-kbuy],[data-kpaint],[data-gup]'); if (!t) return;
    const sel = carById(this.sel), owned = !!Profile.owned[sel.id];
    if (t.dataset.gtab) { this.tab = t.dataset.gtab; AudioSys.click(); this.render(); return; }
    if (t.dataset.kcat) { this.cat = t.dataset.kcat; AudioSys.click(); this.render(); return; }
    if (t.dataset.kcol) { this.previewColor = t.dataset.kcol; AudioSys.click(); if (!owned) { this.render(); return; } this.render(); return; }
    if (t.dataset.kpaint) { this.paint(this.previewColor); return; }
    if (t.dataset.gup) { this.upgrade(t.dataset.gup); return; }
    if (t.dataset.kopt) {
      const C = KIT_CATS.find((c) => c.id === t.dataset.kopt), raw = t.dataset.kv, v = C.opts.map((o) => o[0]).find((x) => String(x) === raw);
      this.preview[C.id] = v; AudioSys.click(); this.render(); return;
    }
    if (t.dataset.kbuy) {
      const cat = t.dataset.kbuy, v = this.preview[cat], price = kitPrice(cat, v);
      if (!owned) return;
      if (Profile.money < price) { AudioSys.error(); return; }
      Profile.money -= price; if (price) UI.moneyDelta(-price);
      carKit(sel.id)[cat] = v; delete this.preview[cat];
      if (cat === 'low' && player && player.car.id === sel.id) player.recalc();
      if (cat === 'sound' && !v) Som.on = false;
      AudioSys.wrench(); toast('Instalado!', KIT_CATS.find((c) => c.id === cat).name + ': ' + KIT_CATS.find((c) => c.id === cat).opts.find((o) => o[0] === v)[1], 'good');
      saveGame(); this.render();
    }
  },
  main() {
    const sel = carById(this.sel);
    const prev = Profile.current;
    if (!Profile.owned[sel.id]) {
      if (Profile.money < sel.price) { AudioSys.error(); return; }
      Profile.money -= sel.price;
      Profile.owned[sel.id] = true;
      const cfg = carCfg(sel.id);
      if (this.previewColor) cfg.color = this.previewColor;
      this.previewColor = null;
      AudioSys.money();
      toast('Novo veículo!', carFullName(sel) + ' agora é seu.', 'good');
      if (sel.job) addMsg('Central de Fretes', 'Bem-vindo à frota', 'Recebemos o cadastro do seu ' + sel.name + '. Abra o app Fretes no celular (Q) para ver as cargas disponíveis perto de você. Quanto mais longe, mais paga. Cuidado com carga frágil e perigosa.');
      UI.moneyDelta(-sel.price);
    }
    // cada carro guarda o próprio estado: trocar de carro não leva o amassado junto
    if (prev !== sel.id) { stashCondition(prev); Profile.current = sel.id; loadCondition(sel.id); Som.on = false; }
    if (player) { player.setCar(sel.id); }
    AudioSys.click();
    saveGame();
    this.render();
  },
  paint(col) {
    const sel = carById(this.sel);
    if (!Profile.owned[sel.id]) { this.previewColor = col; AudioSys.click(); this.render(); return; }
    const cfg = carCfg(sel.id);
    if (!col || cfg.color === col) return;
    if (Profile.money < 150) { AudioSys.error(); toast('Dinheiro insuficiente', 'A pintura custa R$ 150.', 'bad'); return; }
    Profile.money -= 150; cfg.color = col; UI.moneyDelta(-150); this.previewColor = null;
    AudioSys.wash(); toast('Pintado!', 'Cor nova na lataria.', 'good');
    if (player && player.car.id === sel.id) player.recalc();
    saveGame(); this.render();
  },
  upgrade(id) {
    const sel = carById(this.sel), cfg = carCfg(sel.id), lvl = cfg.up[id];
    if (lvl >= 3) return;
    const cost = upgradeCost(sel.id, id, lvl);
    if (Profile.money < cost) { AudioSys.error(); return; }
    Profile.money -= cost; cfg.up[id] = lvl + 1; UI.moneyDelta(-cost);
    AudioSys.wrench();
    // a melhoria passa pela oficina: o carro volta novinho
    if (sel.id === Profile.current) { const had = Profile.damage > 1; Profile.damage = 0; Profile.zones = { f: 0, r: 0, l: 0, rt: 0, seed: ((Profile.zones && Profile.zones.seed) || 0) + 1 }; if (had) toast('Seu Zé', '"Aproveitei a melhoria e desamassei tudo. Tá novinho!"', 'good'); }
    else cfg.cond = null;
    if (player && player.car.id === sel.id) player.recalc();
    saveGame(); this.render();
  },
};
const _ki = (d) => `<svg viewBox="0 0 24 24" class="kit-ico">${d}</svg>`;
const KIT_ICONS = {
  paint: _ki('<path d="M4 15l7-7 5 5-7 7H4z"/><path d="M14 6l4 4M16 4l4 4"/>'),
  finish: _ki('<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>'),
  wheels: _ki('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5V9M12 15v5.5M3.5 12H9M15 12h5.5"/>'),
  tint: _ki('<path d="M4 7h16l-2 11H6z"/><path d="M8 7l1-3h6l1 3"/>'),
  sticker: _ki('<path d="M5 4h14v10l-6 6H5z"/><path d="M13 20v-6h6"/>'),
  hood: _ki('<path d="M12 21c-4 0-6-3-6-6 0-4 4-5 3-10 3 2 4 4 4 6 1-1 1.5-2 1.5-3 2 2 3.5 4.5 3.5 7 0 3-2 6-6 6z"/>'),
  neon: _ki('<path d="M4 15h16"/><path d="M6 19h12" opacity=".6"/><path d="M6 15l2-6h8l2 6"/>'),
  low: _ki('<path d="M3 15h18M6 15l2-5h8l2 5"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M12 3v4M10 5l2 2 2-2"/>'),
  sound: _ki('<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="14" r="3.5"/><circle cx="12" cy="7" r="1.5"/>'),
  spoiler: _ki('<path d="M3 8h18v3H3z"/><path d="M7 11l1 6M17 11l-1 6"/>'),
};
function stashCondition(id) { if (!id) return; carCfg(id).cond = { damage: Profile.damage || 0, zones: Profile.zones ? Object.assign({}, Profile.zones) : null, dirt: Profile.dirt || 0 }; }
function loadCondition(id) {
  const c = carCfg(id).cond, seed = ((Profile.zones && Profile.zones.seed) || 0) + 1;
  Profile.damage = c ? c.damage : 0; Profile.dirt = c ? c.dirt : 0;
  Profile.zones = Object.assign({ f: 0, r: 0, l: 0, rt: 0 }, c && c.zones ? c.zones : {}); Profile.zones.seed = seed;
}
const gpCanvas = document.getElementById('garage-preview'), gpx = gpCanvas.getContext('2d');
function drawGaragePreview(dt) {
  Garage.t += dt;
  const W = gpCanvas.width, H = gpCanvas.height;
  gpx.setTransform(1, 0, 0, 1, 0, 0);
  const bgr = gpx.createRadialGradient(W / 2, H * 0.55, 20, W / 2, H * 0.55, W * 0.6);
  bgr.addColorStop(0, '#2a2620'); bgr.addColorStop(0.5, '#141210'); bgr.addColorStop(1, '#060606');
  gpx.fillStyle = bgr; gpx.fillRect(0, 0, W, H);
  gpx.strokeStyle = 'rgba(255,255,255,0.04)'; gpx.lineWidth = 2;
  for (let x = -H; x < W; x += 60) { gpx.beginPath(); gpx.moveTo(x, H); gpx.lineTo(x + H, 0); gpx.stroke(); }
  gpx.strokeStyle = 'rgba(255,200,80,0.35)'; gpx.lineWidth = 3; gpx.setLineDash([22, 16]);
  gpx.beginPath(); gpx.ellipse(W / 2, H * 0.55, 250, 150, 0, 0, TAU); gpx.stroke(); gpx.setLineDash([]);
  const sel = carById(Garage.sel);
  const owned = !!Profile.owned[sel.id];
  const col = Garage.previewColor || (owned ? carCfg(sel.id).color : PALETTE[CARS.indexOf(sel) % PALETTE.length]);
  const m = VMODELS[sel.model];
  const sc = 300 / Math.max(m.L, 50) * 1.15;
  gpx.save();
  gpx.translate(W / 2, H * 0.55); gpx.scale(sc, sc);
  const a = Garage.t * 0.45;
  gpx.globalCompositeOperation = 'lighter';
  gpx.save(); gpx.rotate(a); gpx.globalAlpha = 0.18; gpx.drawImage(CONE, m.L / 2 - 2, -40, 160, 80); gpx.restore();
  gpx.globalCompositeOperation = 'source-over'; gpx.globalAlpha = 1;
  const pk = Garage.previewKit();
  if (pk.neon) { gpx.globalCompositeOperation = 'lighter'; gpx.save(); gpx.rotate(a); gpx.globalAlpha = 0.7 + 0.1 * Math.sin(Garage.t * 8); const R = m.L * 1.3; gpx.drawImage(glowSprite(pk.neon), -R, -R * 0.65, R * 2, R * 1.3); gpx.restore(); gpx.globalCompositeOperation = 'source-over'; gpx.globalAlpha = 1; }
  drawVehicle(gpx, m, col, 0, 0, a, { steer: Math.sin(Garage.t * 0.9) * 0.3, roll: Garage.t * 10, dirt: 0, noSq: true, noLift: true, kit: pk });
  gpx.globalCompositeOperation = 'lighter';
  const ca = Math.cos(a), sa = Math.sin(a), hl = m.L / 2, hw = m.W / 2 - 4;
  for (const s of [1, -1]) {
    gpx.globalAlpha = 0.9; gpx.drawImage(glowSprite('#fff1cf'), ca * hl - sa * hw * s - 5, sa * hl + ca * hw * s - 5, 10, 10);
    gpx.globalAlpha = 0.7; gpx.drawImage(glowSprite('#ff2a1e'), -ca * hl - sa * hw * s - 4, -sa * hl + ca * hw * s - 4, 8, 8);
  }
  gpx.restore();
  gpx.globalCompositeOperation = 'source-over'; gpx.globalAlpha = 1;
  const vg = gpx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.65);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.65)');
  gpx.fillStyle = vg; gpx.fillRect(0, 0, W, H);
}

/* ---------- diálogos dos estabelecimentos ---------- */
function openShopDialog(s) {
  if (s.kind === 'garagem') { Garage.sel = Profile.current; Screens.open('screen-garage'); AudioSys.click(); return; }
  visitShop(s);
  const KIND = { batalhao: 'SEGURANÇA PÚBLICA', paneleiras: 'ARTESANATO CAPIXABA', posto: 'POSTO DE COMBUSTÍVEL', oficina: 'OFICINA MECÂNICA', moquecaria: 'MOQUECARIA', farmacia: 'FARMÁCIA', padaria: 'PADARIA', mercado: 'MERCADO', lanchonete: 'LANCHONETE', bar: 'BAR', floricultura: 'FLORICULTURA', hotel: 'HOTEL', churrascaria: 'CHURRASCARIA', borracharia: 'BORRACHARIA', sitio: 'SÍTIO', fazenda: 'FAZENDA' };
  $('dialog-kind').textContent = KIND[s.kind] || 'ESTABELECIMENTO';
  $('dialog-title').textContent = s.name;
  $('dialog-text').textContent = SHOP_TEXT[s.kind] || '';
  $('dialog-portrait').classList.toggle('hidden', s.kind !== 'oficina');
  if (s.kind === 'oficina') {
    drawSeuZe($('dialog-portrait'));
    const Zs = Profile.zones || {}, zl = zoneList(Profile.zones);
    const dm = Math.max(Profile.damage, Math.max(Zs.f || 0, Zs.r || 0, Zs.l || 0, Zs.rt || 0) * 70);
    const fala = dm < 3 ? '"Tá zerado, meu filho. Volta quando bater, que eu sei que vai."'
      : dm < 25 ? '"Uns arranhãozinho à toa. Isso eu resolvo enquanto o café passa."'
      : dm < 60 ? '"Rapaz… que pancada foi essa? Beijou o poste, foi? Deixa com o Seu Zé."'
      : '"Nossa Senhora da Penha! Isso aqui tá pocado, menino! Quarenta anos de oficina e nunca vi um estrago desse."';
    $('dialog-text').textContent = 'Seu Zé limpa as mãos na estopa e olha o carro por cima dos óculos. ' + fala + lifeZeFala() + (zl.length ? ' Orçamento: ' + zl.join(', ') + '.' : '');
  }
  const btns = [];
  const B = (label, fn, disabled) => btns.push({ label, fn, disabled });
  if (s.kind === 'posto') {
    const need = Math.max(0, 100 - Profile.fuel), price = 1.8;
    const cost = Math.ceil(need * price);
    const afford = Math.min(need, Profile.money / price);
    B(need < 1 ? 'Tanque cheio' : Profile.money >= cost ? `Encher o tanque — R$ ${fmtMoney(cost)}` : `Abastecer o que der — R$ ${fmtMoney(Math.floor(afford * price))}`, () => {
      const add = Math.min(need, Profile.money / price);
      const c = Math.ceil(add * price);
      Profile.fuel = Math.min(100, Profile.fuel + add); Profile.money -= c; UI.moneyDelta(-c); AudioSys.pump();
      toast('Tanque abastecido', Math.round(Profile.fuel) + '% de combustível', 'good');
      saveGame(); openShopDialog(s);
    }, need < 1 || Profile.money < price);
    if (s.wash) B(Profile.dirt < 0.05 ? 'Carro já está limpo' : 'Lavar o carro — R$ 30', () => { Profile.dirt = 0; Profile.money -= 30; UI.moneyDelta(-30); AudioSys.wash(); toast('Lava-jato', 'Brilhando como novo.', 'good'); saveGame(); openShopDialog(s); }, Profile.dirt < 0.05 || Profile.money < 30);
    lifeButtons(B, s, ['oil']);
    B('Tomar um café na conveniência — R$ 4', () => { Profile.money -= 4; UI.moneyDelta(-4); toast('Café passado', 'Quentinho. Bora rodar mais um pouco.', 'info'); closeDialog(); }, Profile.money < 4);
  }
  if (s.kind === 'oficina') {
    const cost = Math.ceil(Profile.damage * 4);
    if (fiadoOpen()) B(Profile.money >= 1 ? `Acertar o fiado com o Seu Zé — R$ ${fmtMoney(Math.ceil(Math.min(Profile.fiado.amount, Profile.money)))}${Profile.money < Profile.fiado.amount ? ' (de ' + fmtMoney(Math.ceil(Profile.fiado.amount)) + ')' : ''}` : `Fiado em aberto: R$ ${fmtMoney(Math.ceil(Profile.fiado.amount))}`, () => { fiadoPay(true); AudioSys.money(); openShopDialog(s); }, Profile.money < 1);
    const canFiado = !fiadoOpen();
    if (Profile.damage >= 1 && Profile.money < cost && canFiado) B(`Consertar tudo no fiado — R$ ${fmtMoney(cost)} (paga o que tiver)`, () => {
      zeCharge(cost, true); Profile.damage = 0; AudioSys.wrench();
      if (Profile.zones) { for (const z of ['f', 'r', 'l', 'rt', 'fL', 'fR']) Profile.zones[z] = 0; Profile.zones.seed = (Profile.zones.seed || 0) + 1; }
      toast('Seu Zé', '"Pode levar. Anotei na caderneta, amanhã eu pego. Amigo é pra essas coisas, mas o juro também é."', 'good');
      saveGame(); openShopDialog(s);
    });
    B(Profile.damage < 1 ? 'Carro em perfeito estado' : `Consertar o carro — R$ ${fmtMoney(cost)}`, () => {
      const fix = Math.min(Profile.damage, Profile.money / 4);
      const c = Math.ceil(fix * 4);
      const before = Profile.damage;
      Profile.damage -= fix; Profile.money -= c; UI.moneyDelta(-c); AudioSys.wrench();
      if (Profile.zones) { const f = before > 0 && Profile.damage >= 1 ? Profile.damage / before : 0; for (const z of ['f', 'r', 'l', 'rt', 'fL', 'fR']) Profile.zones[z] = (Profile.zones[z] || 0) * f; Profile.zones.seed = (Profile.zones.seed || 0) + 1; }
      if (Profile.damage < 1) Profile.damage = 0;
      toast('Seu Zé', Profile.damage < 1 ? '"Pronto! Tá novinho em folha. Vai com Deus e devagar."' : '"Fiz o que deu com o seu dinheiro, viu?"', 'good');
      saveGame(); openShopDialog(s);
    }, Profile.damage < 1 || Profile.money < 4);
    lifeButtons(B, s, ['oil', 'tires', 'bat'], true);
    B('Melhorias e pintura', () => { Garage.sel = Profile.current; Screens.replace('screen-garage'); });
  }
  if (s.kind === 'borracharia') { lifeButtons(B, s, ['tires']); B('Calibrar os pneus (grátis)', () => { Profile.damage = Math.max(0, Profile.damage - 3); AudioSys.pump(); toast('Borracharia', 'Pneus calibrados. Valeu, chefe!', 'info'); closeDialog(); }); }
  if (s.kind === 'bar') B('Pedir um guaraná — R$ 6', () => { Profile.money -= 6; UI.moneyDelta(-6); toast('Boteco Saideira do Toninho', 'Guaraná trincando de gelado.', 'info'); closeDialog(); }, Profile.money < 6);
  if (s.kind === 'lanchonete') B('Comer um pastel — R$ 8', () => { Profile.money -= 8; UI.moneyDelta(-8); toast('Lanchonete X-Tudo do Bigode', 'Pastel de carne com caldo de cana. Perfeito.', 'info'); closeDialog(); }, Profile.money < 8);
  if (s.kind === 'hotel') B('Pedir uma dica de passeio ao porteiro', () => {
    const left = World.pois.filter((p) => !Profile.discovered.includes(p.id));
    if (!left.length) { toast('Porteiro', '"Você já conhece tudo por aqui!"', 'info'); closeDialog(); return; }
    let best = left[0], bd = Infinity;
    for (const p of left) { const d = Math.hypot(p.x - player.x, p.y - player.y); if (d < bd) { bd = d; best = p; } }
    Act.waypoint = { x: best.x, y: best.y }; Act.gpsT = 0;
    toast('Dica do porteiro', '"Já foi conhecer ' + best.name + '? Marquei no seu GPS."', 'info');
    closeDialog();
  });
  if (s.pickup) {
    if (Act.race) B('Termine o percurso antes de pegar entregas', null, true);
    else if (Act.delivery) B('Você já está com uma entrega em andamento', null, true);
    else {
      const off = deliveryOffer(s);
      const tags = (off.fragile ? ' · frágil' : '') + (off.hot ? ' · urgente' : '');
      B(`Entregar ${off.item} → ${off.dest.name} · R$ ${fmtMoney(off.reward)}${tags}`, () => { startDelivery(off); closeDialog(); });
    }
  }
  B('Sair', () => closeDialog());
  const box = $('dialog-buttons'); box.innerHTML = '';
  for (const b of btns) {
    const el = document.createElement('button');
    el.className = 'mbtn'; el.textContent = b.label; el.disabled = !!b.disabled;
    el.addEventListener('mouseenter', () => AudioSys.hover());
    el.addEventListener('click', () => { if (b.fn) { AudioSys.click(); b.fn(); } });
    box.appendChild(el);
  }
  if (Screens.current === 'screen-dialog') Screens.onOpen('screen-dialog'); else Screens.open('screen-dialog');
}
function drawSeuZe(cv) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3a3f4a'); bg.addColorStop(1, '#1a1d24');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 6; i++) g.fillRect(14 + i * 38, 20, 22, 60);
  g.translate(W / 2, H / 2 + 10);
  g.fillStyle = '#2a4a8a'; g.beginPath(); g.moveTo(-80, 110); g.quadraticCurveTo(-78, 30, 0, 28); g.quadraticCurveTo(78, 30, 80, 110); g.fill();
  g.fillStyle = '#1e3a70'; g.fillRect(-30, 40, 12, 70); g.fillRect(18, 40, 12, 70);
  g.fillStyle = '#f2f2ea'; g.fillRect(-12, 60, 24, 14); g.fillStyle = '#c8302a'; g.font = 'bold 12px Arial'; g.textAlign = 'center'; g.fillText('ZÉ', 0, 71);
  g.fillStyle = '#d9a066'; g.fillRect(-12, 10, 24, 22);
  g.fillStyle = '#e0ac69'; g.beginPath(); g.ellipse(0, -18, 34, 40, 0, 0, TAU); g.fill();
  g.fillStyle = '#d29a5c'; g.beginPath(); g.ellipse(-34, -16, 7, 11, 0, 0, TAU); g.ellipse(34, -16, 7, 11, 0, 0, TAU); g.fill();
  g.fillStyle = '#ededE6'; g.beginPath(); g.ellipse(-30, -30, 9, 16, 0.2, 0, TAU); g.ellipse(30, -30, 9, 16, -0.2, 0, TAU); g.fill();
  g.fillStyle = '#c8302a'; g.beginPath(); g.ellipse(0, -52, 36, 15, 0, Math.PI, TAU); g.fill(); g.fillRect(-36, -54, 72, 6); g.fillRect(-4, -56, 46, 6);
  g.fillStyle = '#f2f2ea'; g.font = 'bold 9px Arial'; g.fillText('OFICINA', 0, -58);
  g.strokeStyle = '#a0784a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-18, -30); g.lineTo(-6, -28); g.moveTo(6, -28); g.lineTo(18, -30); g.stroke();
  g.strokeStyle = '#2a2a2a'; g.lineWidth = 2; g.beginPath(); g.arc(-12, -18, 8, 0, TAU); g.moveTo(20, -18); g.arc(12, -18, 8, 0, TAU); g.moveTo(-4, -18); g.lineTo(4, -18); g.stroke();
  g.fillStyle = '#1a1410'; g.beginPath(); g.arc(-12, -18, 2.2, 0, TAU); g.arc(12, -18, 2.2, 0, TAU); g.fill();
  g.fillStyle = '#c98a55'; g.beginPath(); g.ellipse(0, -6, 5, 8, 0, 0, TAU); g.fill();
  g.fillStyle = '#f0f0ea'; g.beginPath(); g.moveTo(-22, 6); g.quadraticCurveTo(0, -6, 22, 6); g.quadraticCurveTo(10, 14, 0, 6); g.quadraticCurveTo(-10, 14, -22, 6); g.fill();
  g.strokeStyle = 'rgba(120,70,40,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-24, -40 + 6); g.quadraticCurveTo(-18, -44, -10, -42); g.moveTo(10, -42); g.quadraticCurveTo(18, -44, 24, -34); g.stroke();
  g.fillStyle = '#1a1a1a'; g.globalAlpha = 0.35; g.beginPath(); g.ellipse(24, 30, 10, 4, 0.3, 0, TAU); g.fill(); g.globalAlpha = 1;
}
function renderMapDests() {
  for (const id of ['map-dests', 'ph-map-dests']) { const box = $(id); if (box) box.innerHTML = ''; }
  if (Game.mode !== 'play' || !player) return;
  const near = (kind) => { let b = null, bd = Infinity; for (const s of World.shops) if (s.kind === kind) { const d = Math.hypot(s.x - player.x, s.y - player.y); if (d < bd) { bd = d; b = s; } } return b; };
  const opts = [];
  if (World.home) opts.push(['Minha garagem', World.home.x, World.home.y]);
  const posto = near('posto'); if (posto) opts.push(['Posto mais próximo', posto.x, posto.y]);
  const of = near('oficina'); if (of) opts.push(['Oficina do Seu Zé', of.x, of.y]);
  const mq = near('moquecaria'); if (mq) opts.push(['Moquecaria', mq.x, mq.y]);
  let poi = null, pd = Infinity; for (const p of World.pois) if (!Profile.discovered.includes(p.id)) { const d = Math.hypot(p.x - player.x, p.y - player.y); if (d < pd) { pd = d; poi = p; } }
  if (poi) opts.push(['Ponto "?" mais perto', poi.x, poi.y]);
  let rc = null, rd = Infinity; for (const r of World.races) { const d = Math.hypot(r.start[0] - player.x, r.start[1] - player.y); if (d < rd) { rd = d; rc = r; } }
  if (rc) opts.push(['Percurso: ' + rc.name, rc.start[0], rc.start[1]]);
  for (const id of ['map-dests', 'ph-map-dests']) {
    const box = $(id); if (!box) continue;
    const now = document.createElement('div'); now.className = 'dest-now';
    now.textContent = Act.waypoint ? 'Destino: ' + (Act.waypoint.label || 'ponto marcado no mapa') + (Act.gps ? ' · ' + (Act.gps.len * 0.09 / 1000).toFixed(2).replace('.', ',') + ' km' : '') : 'Toque no mapa ou escolha um destino:';
    box.appendChild(now);
    for (const [label, x, y] of opts) { const b = document.createElement('button'); b.textContent = label; b.addEventListener('click', () => mapSetWaypoint(x, y, label)); box.appendChild(b); }
    if (Act.waypoint) { const b = document.createElement('button'); b.className = 'off'; b.textContent = 'Remover destino'; b.addEventListener('click', () => { Act.waypoint = null; Act.gps = null; AudioSys.back(); renderMapDests(); drawBigMap(); }); box.appendChild(b); }
  }
}
/* ---------- tutorial curto do primeiro jogo ---------- */
const TUT_STEPS = [
  { html: 'Acelere com <kbd>W</kbd> ou <kbd>↑</kbd> e vire com <kbd>A</kbd> <kbd>D</kbd>. <kbd>S</kbd> freia e dá ré.', done: () => (Profile.distance || 0) - Tutorial.d0 > 220 },
  { html: 'Numa curva, segure <kbd>Espaço</kbd> para puxar o freio de mão e fazer a traseira escorregar.', done: () => Keys.Space && player.speed > 90, skipAfter: 25 },
  { html: 'Aperte <kbd>Q</kbd> para abrir o celular.', done: () => Screens.current === 'screen-phone' },
  { html: 'No celular: <b>Mapa</b> marca destinos, <b>PegaAí</b> dá corridas e <b>Mensagens</b> fala com o Seu Zé. Aperte <kbd>Q</kbd> de novo para guardar.', done: () => !Screens.current, inPhone: true },
  { html: 'Pare em frente a um comércio com marcador <b style="color:#ffd24a">amarelo</b> e aperte <kbd>E</kbd> para pegar uma entrega.', done: () => !!Act.delivery || !!Act.ride, skipAfter: 45 },
  { html: 'Bateu? A <b>Oficina do Seu Zé</b> conserta. Sem gasolina? Chame o Seu Zé pelas Mensagens que ele vai até você. Boa noite!', done: () => Tutorial.t > 9 },
];
const Tutorial = {
  t: 0, d0: 0, shown: -1,
  update(dt) {
    const el = $('tutorial');
    const vis = Game.mode === 'play' && (!Screens.current || Screens.current === 'screen-phone');
    if (!el || !vis || Profile.tut === undefined || Profile.tut >= TUT_STEPS.length) { if (el && this.shown !== -2) { el.classList.add('hidden'); this.shown = -2; } return; }
    const st = TUT_STEPS[Profile.tut];
    this.t += dt;
    if (this.shown !== Profile.tut) {
      this.shown = Profile.tut;
      el.innerHTML = `<div class="tut-step">${Profile.tut + 1}/${TUT_STEPS.length}</div><div class="tut-text">${st.html}</div><button class="tut-skip" id="tut-skip">Pular tutorial</button>`;
      $('tut-skip').addEventListener('click', () => { Profile.tut = TUT_STEPS.length; AudioSys.back(); saveGame(); });
      el.classList.remove('hidden'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
    el.classList.toggle('in-phone', !!st.inPhone);
    if (st.done() || (st.skipAfter && this.t > st.skipAfter)) { Profile.tut++; this.t = 0; AudioSys.checkpoint(); }
  },
};
function showDialog(o) {
  $('dialog-kind').textContent = o.kind || ''; $('dialog-title').textContent = o.title || ''; $('dialog-text').textContent = o.text || '';
  $('dialog-portrait').classList.add('hidden');
  const box = $('dialog-buttons'); box.innerHTML = '';
  for (const [label, fn] of o.buttons || [['OK', closeDialog]]) { const el = document.createElement('button'); el.className = 'mbtn'; el.textContent = label; el.addEventListener('click', () => { AudioSys.click(); fn(); }); box.appendChild(el); }
  if (Screens.current === 'screen-dialog') Screens.onOpen('screen-dialog'); else { Screens.closeAll(); Screens.open('screen-dialog'); }
}
function closeDialog() { if (Screens.current === 'screen-dialog') Screens.closeAll(); }

/* ---------- estatísticas da pausa ---------- */
function renderPauseStats() {
  const medals = Object.values(Profile.races).filter((r) => r.medal === 3).length;
  const rows = [
    ['Dinheiro', 'R$ ' + fmtMoney(Profile.money)], ['Total ganho', 'R$ ' + fmtMoney(Profile.earned)],
    ['Entregas', Profile.deliveries], ['Distância', (Profile.distance * 0.09 / 1000).toFixed(1) + ' km'],
    ['Pontos de interesse', Profile.discovered.length + '/' + World.pois.length], ['Caderneta', Profile.visited.length + '/' + World.shops.filter((x) => x.kind !== 'garagem').length],
    ['Medalhas de ouro', medals + '/' + World.races.length], ['Carros', Object.keys(Profile.owned).length + '/' + CARS.length],
  ];
  $('pause-stats').innerHTML = rows.map(([a, b]) => `<div>${a} <b>${b}</b></div>`).join('');
}

/* ---------- HUD ---------- */
function clockStr() { const t = Math.floor(Profile.time) % 1440; const h = Math.floor(t / 60), m = t % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
function updateHUD(dt) {
  if (Game.mode !== 'play' || !player) return;
  const rk = regionKeyAt(player.x, player.y);
  if (rk !== UI.region) {
    UI.region = rk;
    UI.set('region-name', REGIONS[rk].name);
    const bn = $('region-banner'); bn.textContent = REGIONS[rk].name; bn.classList.add('show');
    clearTimeout(UI._bn); UI._bn = setTimeout(() => bn.classList.remove('show'), 2600);
  }
  { const rush = trafficRush().label; UI.set('clock', clockStr() + (rush ? ' · ' + (Weather.rain > 0.15 ? 'pico' : rush) : '') + (Weather.rain > 0.6 ? ' · chuva' : Weather.rain > 0.15 ? ' · garoa' : '')); if (rush !== UI.rush) { if (UI.rush !== undefined && rush === 'horário de pico') toast('Horário de pico', 'As ruas de São Gambiarra estão cheias. Paciência no trânsito!', 'info'); UI.rush = rush; } }
  UI.set('money-value', fmtMoney(Profile.money));
  { const C = career(), need = C.lvl >= LEVEL_MAX ? 1 : xpNeed(C.lvl); UI.set('lvl-num', String(C.lvl)); UI.set('lvl-fill', (C.lvl >= LEVEL_MAX ? 100 : Math.round(C.xp / need * 100)) + '%', 'width'); }
  // objetivo
  let title, desc = '', meta = '', cls = '';
  if (Act.race && Act.race.racha) {
    const R = Act.race; cls = 'race';
    title = 'Racha: ' + R.r.name; desc = R.count > 0 ? 'Prepare-se… contra ' + R.r.rival : 'Corre! ' + R.r.rival + ' tá do seu lado. Cuidado com viatura.';
    meta = 'Aposta R$ ' + fmtMoney(R.r.bet) + ' · tempo dele ' + fmtTime(R.r.rivalTime);
  } else if (Act.race) {
    const R = Act.race;
    title = 'Percurso: ' + R.r.name; cls = 'race';
    desc = R.count > 0 ? 'Prepare-se…' : 'Checkpoint ' + (R.idx + 1) + ' de ' + R.r.pts.length;
    meta = 'Ouro ' + fmtTime(R.r.gold) + ' · Prata ' + fmtTime(R.r.silver) + ' · Bronze ' + fmtTime(R.r.bronze);
  } else if (Act.delivery && Act.delivery.stage === 'pickup') {
    const d = Act.delivery; cls = 'active';
    title = d.jobName + ': ' + d.item; desc = 'Buscar em ' + d.pick.name;
    meta = Math.round((Act.gps ? Act.gps.len : 0) * 0.09) + ' m · R$ ' + fmtMoney(d.reward);
  } else if (Act.ride) {
    const R = Act.ride; cls = 'active';
    title = RIDE_TYPES[R.type || 'comum'].name + ': ' + R.name; desc = R.stage === 'pickup' ? 'Buscar em ' + R.pick.name : 'Levar até ' + R.dest.name;
    meta = Math.round((Act.gps ? Act.gps.len : 0) * 0.09) + ' m · R$ ' + R.fare + (R.tmax && R.stage === 'drive' ? ' · ' + (R.tmax - R.t > 0 ? 'faltam ' + fmtTime(R.tmax - R.t).replace(/\.\d$/, '') : 'atrasado!') : '');
  } else if (Act.delivery) {
    const d = Act.delivery; cls = 'active';
    title = 'Entrega: ' + d.item;
    desc = 'Destino: ' + d.dest.name + (d.fragile ? ' · carga frágil' : '');
    const dist = Act.gps ? Act.gps.len : Math.hypot(d.dest.x - player.x, d.dest.y - player.y);
    const left = d.par - d.t;
    meta = Math.round(dist * 0.09) + ' m · ' + (left > 0 ? 'prazo ' + fmtTime(left).replace(/\.\d$/, '') : 'atrasado') + ' · R$ ' + fmtMoney(d.reward);
  } else if (Events.cur && Events.cur.stage !== 'wait' && Events.hud()) {
    const h = Events.hud(); title = h[0]; desc = h[1]; meta = h[2]; cls = 'event';
  } else if (Act.waypoint) {
    title = 'Destino no GPS'; desc = 'Siga as setas verdes no chão.';
    meta = Math.round((Act.gps ? Act.gps.len : 0) * 0.09) + ' m';
  } else if (Events.hud()) { const h = Events.hud(); title = h[0]; desc = h[1]; meta = h[2]; cls = 'event'; }
  else { const h = freeRoamHint(); title = h[0]; desc = h[1]; }
  UI.set('obj-title', title); UI.set('obj-desc', desc); UI.set('obj-meta', meta);
  if (UI.last.objcls !== cls) { UI.last.objcls = cls; $('hud-objective').className = 'glass ' + cls; }
  // veículo
  UI.set('car-name', carFullName(player.car));
  { const w = $('hud-wanted'), L = Police.level; w.classList.toggle('hidden', L <= 0);
    if (L > 0) { w.querySelectorAll('.w-stars i').forEach((s, i) => s.classList.toggle('on', i < L)); const lost = Police.lostT / (7 + L * 3), bust = Police.bustT / 2.6;
      w.querySelector('.w-label').textContent = bust > 0.05 ? 'PARE OU SERÁ PRESO' : lost > 0.02 ? 'DESPISTANDO…' : 'PROCURADO';
      $('w-bar').style.width = (Math.max(lost, bust) * 100).toFixed(0) + '%'; $('w-bar').className = bust > 0.05 ? 'bust' : ''; w.classList.toggle('flash', lost < 0.02 && bust < 0.05); } }
  UI.set('fuel-bar', Math.round(Profile.fuel) + '%', 'width');
  UI.set('fuel-bar', Profile.fuel < 20 ? 'linear-gradient(90deg,#ff5a5a,#ff8a7a)' : '', 'bg');
  UI.set('cond-bar', Math.round(100 - Profile.damage) + '%', 'width');
  UI.set('cond-bar', Profile.damage > 60 ? 'linear-gradient(90deg,#ff8a3d,#ffb547)' : '', 'bg');
  { const L = carLife(), low = (v) => v < 25 ? 'linear-gradient(90deg,#ff5a5a,#ff8a7a)' : '';
    UI.set('tire-bar', Math.round(L.tires) + '%', 'width'); UI.set('tire-bar', low(L.tires), 'bg');
    UI.set('oil-bar', Math.round(L.oil) + '%', 'width'); UI.set('oil-bar', low(L.oil), 'bg');
    UI.set('bat-bar', Math.round(L.bat) + '%', 'width'); UI.set('bat-bar', low(L.bat), 'bg');
    const lo = !!player.lightsOff; if (UI.last.lo !== lo) { UI.last.lo = lo; $('hud-dash').classList.toggle('lights-off', lo); }
    if (UI.last.som !== Som.on) { UI.last.som = Som.on; $('hud-dash').classList.toggle('som-on', Som.on); } }
  // prompt
  const pr = Act.prompt && !Screens.current ? '<kbd>E</kbd>' + escapeHtml(Act.prompt.text) : '';
  if (UI.last.prompt !== pr) { UI.last.prompt = pr; const el = $('prompt'); el.innerHTML = pr; el.classList.toggle('hidden', !pr); }
  // percurso
  const rt = Act.race && Act.race.count <= 0 ? fmtTime(Act.race.t) : '';
  UI.set('race-timer', rt); $('race-timer').classList.toggle('hidden', !rt);
  const cd = Act.race && Act.race.count > 0 ? String(Math.ceil(Act.race.count)) : Act.race && Act.race.t < 0.8 ? 'VAI!' : '';
  if (UI.last.cd !== cd) { UI.last.cd = cd; const el = $('countdown'); el.textContent = cd; el.classList.toggle('hidden', !cd); }
  { const un = unreadCount() + pgUnread() > 0; if (UI.last.badge !== un) { UI.last.badge = un; $('hud-phone-badge').classList.toggle('hidden', !un); } }
  drawMinimap();
  drawSpeedo();
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* Ações da casa no jeito dos jogos de simulação de vida: o personagem anda até o objeto, aparece um menu
   redondo com as opções e "Cancelar". Ações de várias etapas (pegar na geladeira, cozinhar no fogão, levar à
   mesa e comer) rodam em sequência, com todos os botões travados até terminar. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI, HUD = SL.HUD;
  const $ = UI.$;
  const obj = id => SL.HomeScene.objects().find(o => o.id === id);

  // ---------- menu de opções do objeto (lista em cima do móvel, sempre com Cancelar) ----------
  UI.pie = (x, y, title, opts) => {
    UI.closeCtx();
    const host = $('#stage-ui'); const el = document.createElement('div'); el.className = 'pie';
    const all = opts.concat([{ label: 'Cancelar', icon: 'x', cancel: true }]);
    el.innerHTML = `<div class="pie-c">${U.esc(title)}</div><div class="pie-l">` + all.map((o, i) => {
      const sub = o.disabled && o.why ? o.why : o.sub || '';
      return `<button class="pie-o ${o.cancel ? 'cancel' : ''}" data-i="${i}" style="--d:${i * 35}ms" ${o.disabled ? 'disabled' : ''}>${UI.ic(o.icon || 'chevR', 16)}<span>${U.esc(o.label)}${sub ? `<small>${U.esc(sub)}</small>` : ''}</span>${i < 9 && !o.cancel ? `<kbd>${i + 1}</kbd>` : ''}</button>`;
    }).join('') + '</div>';
    host.appendChild(el);
    const W0 = host.clientWidth, H0 = host.clientHeight, w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = Math.round(U.clamp(x - w / 2, 12, W0 - w - 12)) + 'px';
    el.style.top = Math.round(U.clamp(y - h - 18, 96, H0 - h - 12)) + 'px';
    el.querySelectorAll('.pie-o').forEach(b => b.onclick = e => { e.stopPropagation(); pick(+b.dataset.i); });
    const pick = i => { const o = all[i]; if (!o || o.disabled) return; UI.closeCtx(); SL.audio.play('click'); if (o.cancel) return; const r = o.fn && o.fn(); if (typeof r === 'string') UI.err(r); };
    el._pick = pick; el._n = all.length;
    UI._ctx = el; document.body.classList.add('menu-open');
    if (SL.audio) SL.audio.play('open');
  };

  // ---------- sequências ----------
  const Seq = SL.Seq = { cur: null, holding: null };
  Seq.busy = () => !!Seq.cur;
  Seq.cancel = () => { if (Seq.cur && Seq.cur.timer) clearInterval(Seq.cur.timer); Seq.cur = null; Seq.holding = null; if (SL.HUD.update) SL.HUD.update(true); };
  Seq.run = (steps, label) => {
    if (Seq.cur) return;
    UI.closeCtx(); SL.HomeScene.clearKeys();
    Seq.cur = { steps, i: -1, label, id: U.uid('sq') };
    next(Seq.cur.id);
    SL.HUD.update(true);
  };
  const next = id => {
    const c = Seq.cur; if (!c || c.id !== id) return;
    c.i++; const st = c.steps[c.i];
    if (!st) { Seq.cur = null; Seq.holding = null; SL.HUD.update(true); SL.Goals.check(); return; }
    try { st(() => next(id), msg => { Seq.cancel(); if (msg) UI.err(msg); }); } catch (e) { console.error(e); Seq.cancel(); }
  };
  const S = {
    walk: id => (ok) => { const o = obj(id); if (!o || !o.use) return ok(); if (!SL.HomeScene.walkTo(o.use[0], o.use[1], ok)) ok(); },
    act: (id, data, label) => (ok, no) => {
      const err = SL.Life.start(id, data, label ? { label } : undefined); if (err) return no(err);
      const a = SL.G.act; const c = Seq.cur;
      c.timer = setInterval(() => { if (Seq.cur !== c) return clearInterval(c.timer); if (SL.G.act !== a) { clearInterval(c.timer); c.timer = null; ok(); } }, 120);
    },
    hold: item => ok => { Seq.holding = item; ok(); },
    take: food => (ok, no) => { if (!SL.Life.takeFood(food)) return no('Acabou ' + ((D.foodById(food) || {}).name || 'isso') + '.'); SL.audio.play('click'); ok(); },
    wait: ms => ok => setTimeout(ok, ms),
    run: fn => ok => { fn(); ok(); },
  };
  SL.Seq.S = S;

  // jeito de consumir cada comida
  const how = fd => fd.coffee ? 'cafe' : (fd.cook || fd.id === 'miojo' || fd.id === 'lasanha') ? 'preparar' : ['refri', 'suco', 'energetico'].includes(fd.id) ? 'beber' : 'comer';
  const HOW = { preparar: ['Preparar', 'stove'], comer: ['Comer', 'food'], beber: ['Beber', 'drink'], cafe: ['Passar café', 'coffee'] };
  const atTable = () => !!obj('mesa_jantar');
  UI.consume = id => {
    const fd = D.foodById(id); if (!fd) return;
    const k = how(fd); const lower = fd.name.toLowerCase();
    if (k === 'preparar') {
      if (!obj('fogao')) return UI.err('Você não tem fogão.');
      const cook = { food: id };
      Seq.run([S.walk('geladeira'), S.take(id), S.hold('pacote'), S.walk('fogao'), S.hold(null), S.act('cozinhar', cook, 'Preparando ' + lower), S.hold('prato'),
        atTable() ? S.walk('mesa_jantar') : S.wait(0), (ok, no) => S.act('comer', { food: id, taken: true, q: cook.q || 1, where: atTable() ? 'mesa' : '', dur: fd.cook ? 20 : 12 }, 'Comendo ' + lower)(ok, no), S.hold(null)], 'Preparando ' + lower);
    } else if (k === 'comer') {
      Seq.run([S.walk('geladeira'), S.take(id), S.hold('pacote'), atTable() ? S.walk('mesa_jantar') : S.wait(0), S.act('comer', { food: id, taken: true, where: atTable() ? 'mesa' : '' }, 'Comendo ' + lower), S.hold(null)], 'Comendo');
    } else if (k === 'beber') {
      Seq.run([S.walk('geladeira'), S.take(id), S.hold('copo'), S.act('comer', { food: id, taken: true }, 'Bebendo ' + lower), S.hold(null)], 'Bebendo');
    } else {
      const m = obj('cafeteira') ? 'cafeteira' : 'fogao';
      Seq.run([S.walk('geladeira'), S.hold('pacote'), S.walk(m), S.hold(null), S.act('cafe', {}, 'Passando café'), S.hold('caneca'), S.wait(900), S.hold(null)], 'Café');
    }
  };

  // ---------- geladeira ----------
  UI.fridge = filter => {
    const L = SL.Life; const day = SL.Clock.day();
    const list = L.stockList().filter(s => !filter || filter(s.food)).sort((a, b) => a.food.name.localeCompare(b.food.name));
    const m = UI.modal({ title: filter ? 'O que preparar?' : 'Geladeira', icon: 'fridge', cls: 'game', sub: filter ? 'Itens que vão ao fogo' : L.fridgeUsed() + ' de ' + L.fridgeCap() + ' espaços ocupados',
      html: list.length ? `<div class="fridge">${list.map(s => { const k = how(s.food); const [lb, ic] = HOW[k]; const exp = s.exp > 9000 ? '' : s.exp - day <= 1 ? '<span class="bad">vence amanhã</span>' : 'vence em ' + (s.exp - day) + ' dias'; return `<div class="fr-i"><span class="fr-ic">${UI.ic(ic, 18)}</span><div class="grow"><b>${U.esc(s.food.name)}</b><small class="muted">${s.n}x${exp ? ' · ' + exp : ''}</small></div><button class="btn ${k === 'preparar' ? 'primary' : 'ok'}" data-eat="${s.food.id}">${lb}</button></div>`; }).join('')}</div>`
        : '<div class="empty">Nada aqui. Compre no mercado da cidade ou peça comida pelo iFood no celular.</div>',
      buttons: [{ label: 'Cancelar' }] });
    m.body.addEventListener('click', e => { const b = e.target.closest('[data-eat]'); if (!b) return; m.close(); UI.consume(b.dataset.eat); });
  };

  // ---------- opções de cada objeto ----------
  HUD.objectActions = o => {
    const G = SL.G; const L = SL.Life; const it = G.home.items; const out = [];
    const life = (id, data, label) => () => L.start(id, data, label ? { label } : undefined);
    const add = (label, icon, fn, sub, dis, why) => out.push({ label, icon, fn, sub, disabled: !!dis, why });
    switch (o.kind) {
      case 'porta': add('Sair de casa', 'door', () => SL.City.goOutside()); break;
      case 'geladeira': add('Ver geladeira', 'fridge', () => UI.fridge()); break;
      case 'fogao': add('Cozinhar', 'stove', () => UI.fridge(f => how(f) === 'preparar')); if (L.foodCount('cafe') && !it.cafeteira) add('Passar café', 'coffee', () => UI.consume('cafe')); break;
      case 'cafeteira': add('Passar café', 'coffee', () => UI.consume('cafe'), L.foodCount('cafe') + ' doses', !L.foodCount('cafe'), 'Sem café'); break;
      case 'pia': add('Beber água', 'drink', life('beber')); break;
      case 'cama': add('Dormir', 'sleep', life('dormir', {})); add('Cochilar', 'sleep', life('cochilar'), '1 hora'); break;
      case 'mesa': add('Usar o computador', 'laptop', () => UI.openPC()); break;
      case 'chuveiro': add('Tomar banho', 'shower', life('banho'), '15 min'); break;
      case 'pia_b': add('Lavar o rosto', 'hygiene', life('escovar', {}, 'Lavando o rosto')); break;
      case 'sofa': add('Descansar', 'sofa', life('descansar'), '30 min'); if (it.tv) add('Ver TV', 'tv', life('tv'), '1 hora'); break;
      case 'tv': if (it.tv) add('Ver TV', 'tv', life('tv'), '1 hora'); if (G.equip.setup.console && it.tv) add('Jogar videogame', 'gamepad', life('videogame'), '1 hora'); if (!it.tv) add('Precisa de uma TV', 'tv', null, '', true); break;
      case 'armario': add('Limpar a casa', 'broom', life('limpar'), 'sujeira ' + Math.round(G.home.dirt) + '%'); break;
      case 'guarda': add('Trocar de roupa', 'user', () => HUD.lookDialog(false)); break;
      case 'mesa_jantar': if (G.flags.mealReady) add('Comer o pedido', 'food', () => Seq.run([S.walk('mesa_jantar'), S.act('comer_pedido')], 'Comendo')); else add('Mesa vazia', 'info', null, 'peça comida no iFood', true); break;
      case 'bike': add('Pedalar', 'bike', life('bike'), '40 min'); break;
      case 'estudio': if (!G.home.studio) add('Construir o estúdio', 'sparkle', () => UI.confirm('Construir estúdio', 'A obra custa ' + U.money(D.STUDIO_COST) + ' e deixa as suas lives com cenário, som e imagem muito melhores.', () => UI.err(SL.Home.buildStudio()), 'Construir'), U.money0(D.STUDIO_COST)); else add('Usar o estúdio', 'live', () => UI.openPC()); break;
      case 'planta': add('Regar', 'plant', life('regar')); add('Vender', 'coin', () => SL.Home.removeDeco(o.deco), '25% do valor'); break;
      case 'luz': add('Luz do setup', 'light', null, '', true); break;
      default: if (o.deco != null) add('Vender', 'coin', () => SL.Home.removeDeco(o.deco), '25% do valor');
    }
    return out;
  };
  HUD.openObjectMenu = o => {
    const G = SL.G; if (Seq.busy()) return;
    if (G.act && G.act.id !== 'usar_pc') return HUD.busyHint();
    const opts = HUD.objectActions(o); if (!opts.length) return;
    const p = SL.HomeScene.nearPos() || SL.HomeScene.charScreen();
    UI.pie(p.x, p.y, o.label, opts);
  };
  // só dá para usar o que está ao alcance: chegue perto e aperte E (ou toque no botão E)
  HUD.interactNear = () => {
    if (UI._ctx) return UI.closeCtx();
    const o = SL.HomeScene.near(); if (!o) return;
    SL.audio.play('click'); HUD.openObjectMenu(o);
  };
  // botão E que acompanha o móvel mais perto
  let promptEl = null;
  HUD.prompt = () => {
    const G = SL.G; if (!promptEl) { promptEl = document.createElement('button'); promptEl.className = 'e-prompt'; promptEl.innerHTML = '<kbd>E</kbd><span></span>'; promptEl.onclick = e => { e.stopPropagation(); HUD.interactNear(); }; }
    const host = $('#stage-ui'); if (promptEl.parentNode !== host) host.appendChild(promptEl);
    const o = G && G.loc.area === 'casa' && !UI._ctx && !Seq.busy() && !(G.act && G.act.id !== 'usar_pc') ? SL.HomeScene.near() : null;
    const p = o && SL.HomeScene.nearPos();
    if (!o || !p) { promptEl.hidden = true; return; }
    promptEl.hidden = false; const sp = promptEl.querySelector('span'); if (sp.textContent !== o.label) sp.textContent = o.label;
    promptEl.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) translate(-50%, -100%)`;
  };
  SL.HomeScene.onExit = () => { const o = obj('porta'); if (o) HUD.openObjectMenu(o); };

  // pedido do iFood comido na mesa (vira uma atividade curta)
  SL.Life.ACT.comer_pedido = { id: 'comer_pedido', label: 'Comendo o pedido', icon: 'food', speed: 2, dur: 15, fx: {}, start: () => { if (!SL.G.flags.mealReady) return 'Nenhum pedido esperando.'; },
    end: (a, ok) => { if (ok) { SL.Rel.eatDelivery(); SL.G.flags.ate = 1; } } };
})(window.SL);

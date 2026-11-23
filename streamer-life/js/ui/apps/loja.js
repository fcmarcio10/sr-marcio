/* App Loja: MegaByte (equipamentos), Casa&Lar (móveis e decoração), internet e softwares, veículos e imóveis. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const ic = UI.ic, esc = U.esc;
  const ATTR = { perf: 'Desempenho', render: 'Renderização', q: 'Qualidade', audio: 'Áudio', video: 'Imagem', game: 'Jogo', light: 'Luz', cap: 'Captura', vlog: 'Vlog' };
  const slotIcon = s => (D.equipSlots.find(x => x.id === s) || { icon: 'shop' }).icon;
  const priceHTML = it => { const p = SL.Equip.price(it); return p < it.price ? `<span class="price"><s>${U.money0(it.price)}</s>${U.money0(p)}</span>` : `<span class="price">${it.price ? U.money0(it.price) : 'Grátis'}</span>`; };

  SL.Apps.loja = {
    title: 'Mercado Livre', short: 'Mercado Livre', icon: 'shop', color: 'linear-gradient(135deg,#ffe14d,#f5b800)', fg: '#2d2a1a', order: 9, pc: true, phone: true, w: 1000, h: 680,
    watch: ['equip', 'home', 'money'],
    render(el, ctx) {
      const st = ctx.st; const phys = ctx.args && ctx.args.physical;
      if (ctx.args && ctx.args.tab && !st.used) { st.used = 1; st.tab = ctx.args.tab; }
      st.tab = st.tab || 'equip';
      const tabs = phys ? (st.tab === 'casa' ? [['casa', 'Casa&Lar']] : [['equip', 'MegaByte']]) : [['equip', 'Equipamentos'], ['casa', 'Casa e decoração'], ['servicos', 'Internet e softwares'], ['veiculos', 'Veículos'], ['imoveis', 'Imóveis']];
      el.innerHTML = `<div class="app"><div class="app-head"><div class="brandbar"><span class="bl" style="background:#2a7ad8">${ic('shop', 15)}</span>${phys ? (st.tab === 'casa' ? 'Casa&Lar (loja física)' : 'MegaByte (loja física)') : 'Loja online'}</div><div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`).join('')}</div></div><div class="app-body">${SL.Equip.isBlackFriday() ? '<div class="card" style="border-color:var(--ok)"><b class="ok">Black Friday: 30% de desconto em tudo hoje!</b></div>' : ''}${this[st.tab](ctx, phys)}</div></div>`;
    },
    equip(ctx, phys) {
      const st = ctx.st; st.slot = st.slot || 'computador'; const G = SL.G;
      const cur = D.equipById(G.equip.setup[st.slot]);
      const items = D.equip.filter(e => e.slot === st.slot && e.price > 0 || (e.slot === st.slot && G.equip.owned[e.id]));
      return `<div class="row wrap">${D.equipSlots.map(s => `<button class="chip ${st.slot === s.id ? 'on' : ''}" data-act="slot" data-v="${s.id}">${ic(s.icon, 13)} ${s.name}</button>`).join('')}</div>
        <div class="small muted">${phys ? 'Compra na loja física: você leva na hora.' : 'Compra online: entrega amanhã de manhã.'} Equipado agora: <b>${cur ? esc(cur.name) + (SL.Equip.isBroken(cur.id) ? ' (quebrado)' : '') : 'nada'}</b></div>
        <div class="shop-grid">${items.map(it => this.card(it, cur, phys)).join('')}</div>
        ${st.slot === 'computador' ? this.compat() : ''}`;
    },
    card(it, cur, phys) {
      const G = SL.G; const owned = !!G.equip.owned[it.id]; const using = G.equip.setup[it.slot] === it.id; const broken = SL.Equip.isBroken(it.id);
      const attrs = Object.keys(ATTR).filter(k => it[k] != null);
      return `<div class="prod ${owned ? 'owned' : ''}"><div class="pa">${ic(slotIcon(it.slot), 40)}</div><div><b>${esc(it.name)}</b><div class="tiny muted">${esc(it.brand)} · ${esc(it.desc)}</div></div>
        ${attrs.map(k => { const d = cur && cur[k] != null ? it[k] - cur[k] : null; return `<div class="attr">${ATTR[k]}<div class="bar"><i style="width:${Math.min(100, it[k] * (k === 'game' ? 12 : 1))}%"></i></div><b>${it[k]}</b></div>${d && !using ? `<div class="cmp ${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d} em relação ao atual</div>` : ''}`; }).join('')}
        ${it.rel ? `<div class="tiny muted">Confiabilidade: ${it.rel >= 0.998 ? 'alta' : it.rel >= 0.995 ? 'média' : 'baixa'}${it.w ? ' · consumo ' + it.w + ' W' : ''}</div>` : ''}
        <div class="row between">${priceHTML(it)}${broken ? '<span class="tag bad">quebrado</span>' : using ? '<span class="tag ok">em uso</span>' : owned ? '<span class="tag">guardado</span>' : ''}</div>
        <div class="row wrap">${!owned || broken ? `<button class="btn sm primary" data-act="buy" data-v="${it.id}" ${G.money < SL.Equip.price(it) ? 'disabled' : ''}>${ic('cart', 14)} ${phys ? 'Comprar e levar' : 'Comprar'}</button>` : ''}${owned && !using && !broken ? `<button class="btn sm" data-act="use" data-v="${it.id}">Usar</button>` : ''}${broken && phys ? `<button class="btn sm" data-act="fix" data-v="${it.id}">Consertar ${U.money0(SL.Equip.repairCost(it.id))}</button>` : ''}${owned && it.price ? `<button class="btn sm ghost" data-act="sell" data-v="${it.id}">Vender</button>` : ''}</div></div>`;
    },
    compat() {
      const pcs = D.equip.filter(e => e.slot === 'computador');
      return `<div class="card"><h3>Compatibilidade com os jogos (720p)</h3><div class="tablewrap"><table class="table"><tr><th>Jogo</th>${pcs.map(p => `<th>${esc(p.name.replace('PC ', ''))}</th>`).join('')}</tr>${D.games.filter(g => !g.console).map(g => `<tr><td class="small">${esc(g.name)}</td>${pcs.map(p => { const f = Math.min(1, p.perf / (g.demand + 15 + 4)); return `<td class="n ${f >= 0.95 ? 'ok' : f >= 0.75 ? 'warn' : 'bad'}">${f >= 0.95 ? 'liso' : f >= 0.75 ? 'trava às vezes' : 'trava muito'}</td>`; }).join('')}</tr>`).join('')}</table></div><p class="tiny muted">Reino de Estrela é exclusivo de console: precisa do VortexStation 5 e de uma placa de captura.</p></div>`;
    },
    casa(ctx, phys) {
      const G = SL.G; const st = ctx.st; st.fslot = st.fslot || 'cama';
      const slots = [['cama', 'Cama', 'bed'], ['geladeira', 'Geladeira', 'fridge'], ['fogao', 'Fogão', 'stove'], ['mesa', 'Mesa', 'desk'], ['cadeira', 'Cadeira', 'chair'], ['sofa', 'Sofá', 'sofa'], ['tv', 'TV', 'tv'], ['chuveiro', 'Chuveiro', 'shower'], ['cafeteira', 'Cafeteira', 'coffee'], ['bike', 'Exercício', 'bike'], ['acustica', 'Acústica', 'mic'], ['deco', 'Decoração', 'plant']];
      const items = D.furniture.filter(f => f.slot === st.fslot && f.price > 0);
      const curId = G.home.items[st.fslot]; const cur = D.furnById(curId);
      return `<div class="row wrap">${slots.map(([k, l, i]) => `<button class="chip ${st.fslot === k ? 'on' : ''}" data-act="fslot" data-v="${k}">${ic(i, 13)} ${l}</button>`).join('')}</div>
        <div class="small muted">${st.fslot === 'deco' ? 'Decoração: ' + G.home.deco.length + '/' + SL.Home.decoMax() + ' espaços usados. Melhora o humor e o cenário da câmera.' : 'Atual: <b>' + (cur ? esc(cur.name) : 'nenhum') + '</b>'}</div>
        <div class="shop-grid">${items.map(f => { const has = st.fslot !== 'deco' && curId === f.id; const desc = { cama: 'Recupera o sono ' + Math.round((f.sleep || 1) * 100) + '% mais rápido', geladeira: 'Guarda ' + f.cap + ' porções perecíveis', fogao: 'Comida ' + Math.round((f.cook || 1) * 100) + '% melhor', mesa: 'Produção +' + (f.prod || 0) + '%', cadeira: 'Conforto ' + f.comfort, sofa: 'Lazer melhor', tv: 'Lazer e tendências', chuveiro: 'Banho melhor', cafeteira: 'Café em casa', bike: 'Exercício em casa', acustica: '+' + f.audio + ' de áudio nas lives', deco: '+' + f.decor + ' de decoração' + (f.cam ? ', +' + f.cam + ' no cenário da câmera' : '') }[st.fslot]; return `<div class="prod ${has ? 'owned' : ''}"><div class="pa">${ic((slots.find(s => s[0] === st.fslot) || [])[2] || 'home', 40)}</div><b>${esc(f.name)}</b><div class="tiny muted">${esc(desc || '')}</div><div class="row between">${priceHTML(f)}${has ? '<span class="tag ok">em casa</span>' : ''}</div>${has ? '' : `<button class="btn sm primary" data-act="buyf" data-v="${f.id}" ${G.money < SL.Equip.price(f) ? 'disabled' : ''}>${ic('cart', 14)} ${phys ? 'Comprar e levar' : 'Comprar (entrega amanhã)'}</button>`}</div>`; }).join('')}</div>`;
    },
    servicos() {
      const G = SL.G;
      return `<div class="card"><h3>Plano de internet</h3><div class="shop-grid">${D.internet.map(n => `<div class="prod ${G.equip.net === n.id ? 'owned' : ''}"><div class="pa">${ic('wifi', 36)}</div><b>${esc(n.name)}</b><div class="attr">Upload<div class="bar"><i style="width:${Math.min(100, n.up * 1.6)}%"></i></div><b>${n.up}</b></div><div class="attr">Estabilidade<div class="bar"><i style="width:${n.stab * 100}%"></i></div><b>${Math.round(n.stab * 100)}</b></div><div class="row between"><span class="price">${U.money0(n.price)}/mês</span>${G.equip.net === n.id ? '<span class="tag ok">atual</span>' : `<button class="btn sm" data-act="net" data-v="${n.id}">Mudar</button>`}</div></div>`).join('')}</div><p class="tiny muted">Upload define a qualidade máxima da live. Estabilidade evita quedas no meio da transmissão.</p></div>
        <div class="card"><h3>Softwares</h3><div class="shop-grid">${D.software.map(s => `<div class="prod ${G.equip.soft[s.id] ? 'owned' : ''}"><div class="pa">${ic(s.id === 'editor_pro' ? 'scissors' : s.id === 'overlays' ? 'sparkle' : 'shield', 36)}</div><b>${esc(s.name)}</b><div class="tiny muted">${esc(s.desc)}</div><div class="row between"><span class="price">${U.money0(s.price)}${s.monthly ? '/mês' : ''}</span>${G.equip.soft[s.id] ? (s.monthly ? `<button class="btn sm ghost" data-act="soft" data-v="${s.id}">Cancelar</button>` : '<span class="tag ok">comprado</span>') : `<button class="btn sm primary" data-act="soft" data-v="${s.id}">Assinar</button>`}</div></div>`).join('')}</div></div>`;
    },
    veiculos() {
      const G = SL.G;
      return `<div class="shop-grid">${D.vehicles.map(v => `<div class="prod ${G.equip.vehicles.includes(v.id) ? 'owned' : ''}"><div class="pa">${ic(v.id === 'bike' ? 'bike' : 'car', 40)}</div><b>${esc(v.name)}</b><div class="tiny muted">${esc(v.desc)}</div><div class="row between"><span class="price">${U.money0(v.price)}</span>${G.equip.vehicles.includes(v.id) ? '<span class="tag ok">seu</span>' : `<button class="btn sm primary" data-act="veh" data-v="${v.id}" ${G.money < v.price ? 'disabled' : ''}>Comprar</button>`}</div></div>`).join('')}</div>`;
    },
    imoveis() {
      const G = SL.G;
      return `<div class="col">${D.homes.filter(h => h.id !== 'mae').map(h => `<div class="card row wrap"><span class="acc">${ic('home', 28)}</span><div class="grow"><b>${esc(h.name)}</b> <span class="tag">${esc(h.district)}</span><div class="small muted">${esc(h.desc)}</div><div class="small">Aluguel: <b>${U.money0(h.rent * SL.State.DIFF[G.player.diff].rent)}/mês</b>${h.price ? ' · Compra à vista: <b>' + U.money0(h.price) + '</b>' : ''} · ${h.deco} espaços de decoração</div></div>
        ${G.home.id === h.id ? `<span class="tag ok">${G.home.owned ? 'sua casa' : 'você mora aqui'}</span>${h.price && !G.home.owned ? `<button class="btn sm" data-act="buyhome" data-v="${h.id}">Comprar este</button>` : ''}` : `<button class="btn sm" data-act="rent" data-v="${h.id}">Alugar e mudar</button>${h.price ? `<button class="btn sm primary" data-act="buyhome" data-v="${h.id}">Comprar</button>` : ''}`}</div>`).join('')}
        ${G.home.id === 'casa' && !G.home.studio ? `<div class="card row"><span class="acc">${ic('sparkle', 24)}</span><div class="grow"><b>Construir estúdio</b><div class="small muted">Cenário profissional, isolamento acústico e +4 espaços de decoração.</div></div><button class="btn primary sm" data-act="studio">${U.money0(D.STUDIO_COST)}</button></div>` : ''}</div>`;
    },
    act(a, ds, ctx) {
      const st = ctx.st; const phys = ctx.args && ctx.args.physical;
      const done = r => { if (r) return r; SL.audio.play('cash'); return ctx.render(); };
      if (a === 'tab') { st.tab = ds.t; return ctx.render(); }
      if (a === 'slot') { st.slot = ds.v; return ctx.render(); }
      if (a === 'fslot') { st.fslot = ds.v; return ctx.render(); }
      if (a === 'buy') return done(SL.Equip.buy(ds.v, phys ? 'na_hora' : 'entrega'));
      if (a === 'use') { SL.Equip.use(ds.v); return ctx.render(); }
      if (a === 'sell') return UI.confirm('Vender', 'Vender usado por cerca de 40% do preço?', () => { SL.Equip.sell(ds.v); ctx.render(); }, 'Vender');
      if (a === 'fix') return done(SL.Equip.repair(ds.v));
      if (a === 'buyf') return done(SL.Home.buyFurniture(ds.v, phys ? 'na_hora' : 'entrega'));
      if (a === 'net') { SL.Equip.setNet(ds.v); return ctx.render(); }
      if (a === 'soft') return done(SL.Equip.buySoft(ds.v));
      if (a === 'veh') return done(SL.Equip.buyVehicle(ds.v));
      if (a === 'rent') return UI.confirm('Mudar de casa', 'Paga 2 aluguéis de caução + R$ 900 de mudança. Seus móveis e equipamentos vão junto.', () => { const r = SL.Home.moveTo(ds.v, false); if (r) UI.err(r); else { SL.HomeScene.build(); ctx.render(); } }, 'Mudar');
      if (a === 'buyhome') return UI.confirm('Comprar imóvel', 'Pagamento à vista de ' + U.money(D.homeById(ds.v).price) + '. Sem aluguel daqui pra frente (só condomínio e IPTU).', () => { const r = SL.Home.moveTo(ds.v, true); if (r) UI.err(r); else { SL.HomeScene.build(); ctx.render(); } }, 'Comprar');
      if (a === 'studio') return done(SL.Home.buildStudio());
    },
  };
})(window.SL);

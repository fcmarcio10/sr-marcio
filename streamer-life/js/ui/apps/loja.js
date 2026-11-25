/* App Loja: MegaByte (equipamentos), Casa&Lar (móveis e decoração), internet e softwares, veículos e imóveis. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const ic = UI.ic, esc = U.esc;
  const ATTR = { perf: 'Desempenho', render: 'Renderização', q: 'Qualidade', audio: 'Áudio', video: 'Imagem', game: 'Jogo', light: 'Luz', cap: 'Captura', vlog: 'Vlog' };
  const slotIcon = s => (D.equipSlots.find(x => x.id === s) || { icon: 'shop' }).icon;
  const priceHTML = it => { const p = SL.Equip.price(it); return p < it.price ? `<span class="price"><s>${U.money0(it.price)}</s>${U.money0(p)}</span>` : `<span class="price">${it.price ? U.money0(it.price) : 'Grátis'}</span>`; };

  // nota e avaliações de mentira, sempre as mesmas para o mesmo produto
  const hash = t => { let h = 7; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const nota = it => { const h = hash(it.id); return Math.min(4.9, 4.0 + (it.tier || 0) * 0.15 + (h % 7) / 10); };
  const avaliacoes = it => { const h = hash(it.id + 'r'); return 40 + h % 2400 + (it.price < 400 ? 1800 : 0); };
  const estrelas = n => { let s = ''; for (let i = 1; i <= 5; i++) s += `<i class="${n >= i - 0.25 ? 'on' : n >= i - 0.75 ? 'meia' : ''}"></i>`; return `<span class="ml-est">${s}</span>`; };
  const fmtN = n => n.toLocaleString('pt-BR');
  const vendedor = it => it.brand || ['Loja Oficial', 'TecnoMais', 'Casa Bela', 'MegaShop'][hash(it.id) % 4];
  // cartão de produto (estilo vitrine): foto, nome, nota, preço, parcela, entrega e botões
  const cartao = o => {
    const it = o.it; const p = o.preco != null ? o.preco : SL.Equip.price(it); const velho = o.velho != null ? o.velho : (p < it.price ? it.price : 0);
    const off = velho ? Math.round((1 - p / velho) * 100) : 0;
    const parc = p >= 200 && !o.mensal ? `<div class="ml-parc">em <b>${p >= 2000 ? 12 : 10}x ${U.money(p / (p >= 2000 ? 12 : 10))}</b> sem juros</div>` : '';
    return `<div class="ml-card ${o.owned ? 'owned' : ''}" ${o.ver ? `data-act="ver" data-k="${o.tipo}" data-v="${it.id}"` : ''}>
      <div class="ml-foto"><canvas class="pfoto" data-foto="${o.tipo}|${it.id}"></canvas>${o.selo ? `<span class="ml-selo ${o.seloCls || ''}">${o.selo}</span>` : ''}${off ? `<span class="ml-off">${off}% OFF</span>` : ''}</div>
      <div class="ml-info"><div class="ml-nome">${esc(it.name)}</div><div class="ml-vend">${esc(o.marca || vendedor(it))}</div>
      <div class="ml-nota">${estrelas(nota(it))}<span>${nota(it).toFixed(1).replace('.', ',')} (${fmtN(avaliacoes(it))})</span></div>
      ${o.sub ? `<div class="ml-sub">${o.sub}</div>` : ''}
      <div class="ml-preco">${velho ? `<s>${U.money0(velho)}</s>` : ''}<b>${p ? U.money0(p) : 'Grátis'}${o.mensal ? '<small>/mês</small>' : ''}</b></div>${parc}
      ${o.frete ? `<div class="ml-frete">${ic('check', 12)} ${o.frete}</div>` : ''}
      <div class="ml-bts">${o.botoes || ''}</div></div></div>`;
  };
  const freteDe = phys => phys ? 'Retire agora na loja' : 'Frete grátis · chega quando você acordar';

  SL.Apps.loja = {
    title: 'Mercado Livre', short: 'Mercado Livre', icon: 'shop', color: 'linear-gradient(135deg,#ffe14d,#f5b800)', fg: '#2d2a1a', order: 9, pc: true, phone: true, w: 1040, h: 700,
    watch: ['equip', 'home', 'money'],
    render(el, ctx) {
      const st = ctx.st; const phys = ctx.args && ctx.args.physical;
      if (ctx.args && ctx.args.tab && !st.used) { st.used = 1; st.tab = ctx.args.tab; }
      st.tab = st.tab || 'equip';
      const tabs = phys ? (st.tab === 'casa' ? [['casa', 'Casa&Lar']] : [['equip', 'MegaByte'], ['pecas', 'Peças do PC']]) : [['equip', 'Equipamentos'], ['pecas', 'Peças do PC'], ['casa', 'Casa e decoração'], ['servicos', 'Internet e programas'], ['veiculos', 'Veículos'], ['imoveis', 'Imóveis']];
      const loja = phys ? (st.tab === 'casa' ? 'Casa&Lar · loja física' : 'MegaByte · loja física') : 'Mercado Livre';
      el.innerHTML = `<div class="app ml-app"><div class="ml-top"><div class="ml-logo"><span>${ic('shop', 16)}</span>${loja}</div><div class="ml-saldo">Seu saldo <b>${U.money0(SL.G.money)}</b></div></div><nav class="ml-tabs">${tabs.map(([k, l]) => `<button class="${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`).join('')}</nav><div class="app-body ml-body">${SL.Equip.isBlackFriday() ? '<div class="ml-bf"><b>BLACK FRIDAY</b> 30% de desconto em tudo hoje</div>' : ''}${this[st.tab](ctx, phys)}</div></div>`;
      requestAnimationFrame(() => SL.Produto.pintar(el));
    },
    equip(ctx, phys) {
      const st = ctx.st; st.slot = st.slot || 'computador'; const G = SL.G;
      const cur = D.equipById(G.equip.setup[st.slot]);
      const items = D.equip.filter(e => e.slot === st.slot && e.price > 0 || (e.slot === st.slot && G.equip.owned[e.id]));
      return `<div class="ml-cats">${D.equipSlots.map(s => `<button class="${st.slot === s.id ? 'on' : ''}" data-act="slot" data-v="${s.id}">${ic(s.icon, 14)}<span>${s.name}</span></button>`).join('')}</div>
        <div class="ml-atual">${ic(slotIcon(st.slot), 14)} Você usa: <b>${cur ? esc(cur.name) + (SL.Equip.isBroken(cur.id) ? ' (quebrado)' : '') : 'nada'}</b><span class="muted"> · toque num produto para ver os detalhes</span></div>
        <div class="ml-grid">${items.map(it => this.card(it, cur, phys)).join('')}</div>
        ${st.slot === 'computador' ? this.compat() : ''}`;
    },
    // montar o PC: processador, placa de vídeo, memória, SSD, fonte e refrigeração
    pecas(ctx, phys) {
      const st = ctx.st; st.pslot = st.pslot || 'cpu'; const G = SL.G; const pc = SL.Equip.item('computador'); const pb = SL.Equip.pecas(); const s = SL.Equip.stats();
      const cur = D.equipById(G.equip.setup[st.pslot]);
      const items = D.equip.filter(e => e.slot === st.pslot);
      const linha = sl => { const it = SL.Equip.item(sl.id); return `<div class="pc-peca ${it ? 'tem' : ''}" data-act="pslot" data-v="${sl.id}">${ic(sl.icon, 15)}<span><small>${sl.name}</small><b>${it ? esc(it.name.replace(/^(Processador|Placa de vídeo|Memória RAM) /, '')) : 'vazio'}</b></span></div>`; };
      const barra = (nome, base, extra) => `<div class="pc-bar"><span>${nome}</span><div class="bar"><i style="width:${Math.min(100, base)}%"></i><i class="mais" style="left:${Math.min(100, base)}%;width:${Math.max(0, Math.min(100 - base, extra))}%"></i></div><b>${Math.min(100, base + extra)}</b></div>`;
      return `<div class="pc-monta"><div class="pc-monta-h"><div><small>Seu PC</small><b>${pc ? esc(pc.name) : 'Sem computador'}</b></div>${pb.desktop ? '' : '<span class="tag warn">Notebook não aceita peças: compre um PC de mesa</span>'}${pb.fraca ? '<span class="tag bad">Fonte fraca: a placa de vídeo rende só 40%</span>' : ''}</div>
        <div class="pc-pecas">${D.pecaSlots.map(linha).join('')}</div>
        ${pc ? barra('Desempenho', pc.perf, pb.perf) + barra('Renderização', pc.render, pb.render) : ''}
        ${pb.desktop ? `<div class="tiny muted">Energia: precisa de ${pb.need} W, a fonte entrega ${pb.supply} W${pb.cool ? ' · refrigeração diminui a chance de quebrar' : ''}. Desempenho atual: <b>${s.perf}</b> (jogos e live) · renderização <b>${s.render}</b> (edição de vídeo).</div>` : ''}</div>
        <div class="ml-cats">${D.pecaSlots.map(x => `<button class="${st.pslot === x.id ? 'on' : ''}" data-act="pslot" data-v="${x.id}">${ic(x.icon, 14)}<span>${x.name}</span></button>`).join('')}</div>
        <div class="ml-grid">${items.map(it => this.card(it, cur, phys)).join('')}</div>`;
    },
    botoesEquip(it, phys) {
      const G = SL.G; const owned = !!G.equip.owned[it.id]; const using = G.equip.setup[it.slot] === it.id; const broken = SL.Equip.isBroken(it.id);
      return `${!owned || broken ? `<button class="btn sm primary" data-act="buy" data-v="${it.id}" ${G.money < SL.Equip.price(it) ? 'disabled' : ''}>${phys ? 'Comprar e levar' : 'Comprar agora'}</button>` : ''}${owned && !using && !broken ? `<button class="btn sm" data-act="use" data-v="${it.id}">Usar</button>` : ''}${broken && phys ? `<button class="btn sm" data-act="fix" data-v="${it.id}">Consertar ${U.money0(SL.Equip.repairCost(it.id))}</button>` : ''}${owned && it.price ? `<button class="btn sm ghost" data-act="sell" data-v="${it.id}">Vender</button>` : ''}`;
    },
    card(it, cur, phys) {
      const G = SL.G; const owned = !!G.equip.owned[it.id]; const using = G.equip.setup[it.slot] === it.id; const broken = SL.Equip.isBroken(it.id);
      const k = Object.keys(ATTR).find(x => it[x] != null && x !== 'game'); const d = k && cur && cur[k] != null && !using ? it[k] - cur[k] : 0;
      if (it.peca) return cartao({ tipo: 'equip', it, ver: true, owned, marca: it.brand, selo: broken ? 'Quebrada' : using ? 'Instalada' : owned ? 'Guardada' : (it.tier >= 4 ? 'Topo de linha' : it.tier === 2 ? 'Mais vendido' : ''), seloCls: broken ? 'bad' : using ? 'ok' : owned ? '' : 'top', sub: this.pecaTxt(it), frete: owned && !broken ? '' : freteDe(phys), botoes: this.botoesEquip(it, phys) });
      return cartao({ tipo: 'equip', it, ver: true, owned, marca: it.brand, selo: broken ? 'Quebrado' : using ? 'Em uso' : owned ? 'Guardado' : (it.tier >= 3 ? 'Profissional' : nota(it) >= 4.7 ? 'Mais vendido' : ''), seloCls: broken ? 'bad' : using ? 'ok' : owned ? '' : 'top', sub: d ? `<span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d} de ${ATTR[k].toLowerCase()} em relação ao seu</span>` : '', frete: owned && !broken ? '' : freteDe(phys), botoes: this.botoesEquip(it, phys) });
    },
    // janela com a foto grande, descrição, ficha técnica e comparação
    ver(k, id, ctx, phys) {
      const G = SL.G; let it, ficha = '', bts = [], desc = '';
      const barra = (nome, v, max, d) => `<div class="ml-ficha-l"><span>${nome}</span><div class="bar"><i style="width:${Math.min(100, v / max * 100)}%"></i></div><b>${v}</b>${d ? `<em class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d}</em>` : ''}</div>`;
      if (k === 'equip') {
        it = D.equipById(id); const cur = D.equipById(G.equip.setup[it.slot]); const using = cur && cur.id === it.id;
        desc = esc(it.desc);
        ficha = it.peca ? `<div class="ml-ficha-t">${esc(this.pecaTxt(it))}</div>` + (cur && !using ? `<div class="ml-ficha-t">No lugar de: <b>${esc(cur.name)}</b></div>` : '') + (SL.Equip.pecas().desktop ? '' : '<div class="ml-ficha-t bad">Seu notebook não aceita peças: ela fica guardada até você ter um PC de mesa.</div>')
          : Object.keys(ATTR).filter(x => it[x] != null).map(x => barra(ATTR[x], it[x], x === 'game' ? 8 : 100, cur && cur[x] != null && !using ? it[x] - cur[x] : 0)).join('');
          if (it.rel && !it.peca) ficha += `<div class="ml-ficha-t">Confiabilidade <b>${it.rel >= 0.998 ? 'alta' : it.rel >= 0.995 ? 'média' : 'baixa'}</b>${it.w ? ' · consumo <b>' + it.w + ' W</b>' : ''}</div>`;
        if (cur && !using) ficha += `<div class="ml-ficha-t">Comparando com o seu: <b>${esc(cur.name)}</b></div>`;
        bts = this.botoesEquip(it, phys);
      } else if (k === 'furn') {
        it = D.furnById(id); desc = esc(this.descMovel(it)); const has = it.slot !== 'deco' && G.home.items[it.slot] === it.id;
        bts = has ? '' : `<button class="btn sm primary" data-act="buyf" data-v="${it.id}" ${G.money < SL.Equip.price(it) ? 'disabled' : ''}>${phys ? 'Comprar e levar' : 'Comprar agora'}</button>`;
      }
      if (!it) return;
      const p = SL.Equip.price(it);
      const m = UI.modal({ title: it.name, icon: 'shop', wide: true, cls: 'ml-modal', html: `<div class="ml-det"><div class="ml-det-foto"><canvas class="pfoto" data-foto="${k}|${it.id}"></canvas></div><div class="ml-det-info"><div class="ml-vend">${esc(it.brand || vendedor(it))} · Loja oficial</div><div class="ml-nota">${estrelas(nota(it))}<span>${nota(it).toFixed(1).replace('.', ',')} · ${fmtN(avaliacoes(it))} avaliações</span></div><div class="ml-preco big">${p < it.price ? `<s>${U.money0(it.price)}</s>` : ''}<b>${U.money0(p)}</b></div>${p >= 200 ? `<div class="ml-parc">em <b>${p >= 2000 ? 12 : 10}x ${U.money(p / (p >= 2000 ? 12 : 10))}</b> sem juros</div>` : ''}<div class="ml-frete">${ic('check', 12)} ${freteDe(phys)}</div><p class="ml-desc">${desc}</p>${ficha ? `<div class="ml-ficha"><h4>Ficha técnica</h4>${ficha}</div>` : ''}<div class="ml-bts">${bts}</div></div></div>`, onRender: mm => requestAnimationFrame(() => SL.Produto.pintar(mm.el)) });
      // os botões de dentro usam as mesmas ações do app
      m.el.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (!t) return; SL.audio.play('click'); const r = this.act(t.dataset.act, t.dataset, ctx); m.close(); if (typeof r === 'string') UI.err(r); });
    },
    pecaTxt(it) {
      const p = []; if (it.perf) p.push('+' + it.perf + ' desempenho'); if (it.render) p.push('+' + it.render + ' renderização'); if (it.pw) p.push(it.pw + ' W'); if (it.slot === 'gpu') p.push('gasta ' + it.w + ' W'); if (it.cool) p.push('quebra menos');
      return p.join(' · ');
    },
    descMovel(f) {
      return { cama: 'Recupera o cansaço ' + Math.round((f.sleep || 1) * 100) + '% mais rápido', geladeira: 'Guarda ' + f.cap + ' porções de comida', fogao: 'Comida ' + Math.round((f.cook || 1) * 100) + '% melhor', mesa: 'Produção +' + (f.prod || 0) + '%', cadeira: 'Conforto ' + f.comfort + ' (aparece atrás de você na live)', sofa: 'Descanso melhor', tv: 'Lazer e tendências', chuveiro: 'Banho melhor', cafeteira: 'Café em casa', bike: 'Exercício em casa', acustica: '+' + f.audio + ' de áudio nas lives', deco: '+' + f.decor + ' de decoração' + (f.cam ? ', +' + f.cam + ' no cenário da câmera' : '') }[f.slot] || '';
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
      return `<div class="ml-cats">${slots.map(([k, l, i]) => `<button class="${st.fslot === k ? 'on' : ''}" data-act="fslot" data-v="${k}">${ic(i, 14)}<span>${l}</span></button>`).join('')}</div>
        <div class="ml-atual">${st.fslot === 'deco' ? 'Decoração: <b>' + G.home.deco.length + ' de ' + SL.Home.decoMax() + '</b> espaços usados. Vai para o escritório e aparece na câmera.' : 'Na sua casa: <b>' + (cur ? esc(cur.name) : 'nenhum') + '</b>'}</div>
        <div class="ml-grid">${items.map(f => { const has = st.fslot !== 'deco' && curId === f.id; return cartao({ tipo: 'furn', it: f, ver: true, owned: has, marca: 'Casa&Lar', selo: has ? 'Em casa' : '', seloCls: 'ok', sub: esc(this.descMovel(f)), frete: has ? '' : freteDe(phys), botoes: has ? '' : `<button class="btn sm primary" data-act="buyf" data-v="${f.id}" ${G.money < SL.Equip.price(f) ? 'disabled' : ''}>${phys ? 'Comprar e levar' : 'Comprar agora'}</button>` }); }).join('')}</div>`;
    },
    servicos() {
      const G = SL.G;
      return `<h3 class="ml-h">Plano de internet</h3><div class="ml-grid">${D.internet.map(n => cartao({ tipo: 'net', it: n, preco: n.price, velho: 0, mensal: true, owned: G.equip.net === n.id, marca: 'Operadora', selo: G.equip.net === n.id ? 'Seu plano' : '', seloCls: 'ok', sub: `Envio ${n.up} Mbps · estabilidade ${Math.round(n.stab * 100)}%`, frete: G.equip.net === n.id ? '' : 'Instalação na hora', botoes: G.equip.net === n.id ? '' : `<button class="btn sm" data-act="net" data-v="${n.id}">Mudar para este</button>` })).join('')}</div><p class="tiny muted">O envio define a qualidade máxima da live. A estabilidade evita quedas no meio da transmissão.</p>
        <h3 class="ml-h">Programas</h3><div class="ml-grid">${D.software.map(s => cartao({ tipo: 'soft', it: s, preco: s.price, velho: 0, mensal: !!s.monthly, owned: !!G.equip.soft[s.id], marca: 'Download digital', selo: G.equip.soft[s.id] ? 'Ativo' : '', seloCls: 'ok', sub: esc(s.desc), frete: G.equip.soft[s.id] ? '' : 'Liberado na hora', botoes: G.equip.soft[s.id] ? (s.monthly ? `<button class="btn sm ghost" data-act="soft" data-v="${s.id}">Cancelar</button>` : '') : `<button class="btn sm primary" data-act="soft" data-v="${s.id}">${s.monthly ? 'Assinar' : 'Comprar'}</button>` })).join('')}</div>`;
    },
    veiculos() {
      const G = SL.G;
      return `<div class="ml-grid">${D.vehicles.map(v => { const seu = G.equip.vehicles.includes(v.id); return cartao({ tipo: 'veh', it: v, preco: v.price, velho: 0, owned: seu, marca: v.id === 'bike' ? 'Pedala Bem' : 'Seminovos', selo: seu ? 'Seu' : '', seloCls: 'ok', sub: esc(v.desc), frete: seu ? '' : 'Retire hoje', botoes: seu ? '' : `<button class="btn sm primary" data-act="veh" data-v="${v.id}" ${G.money < v.price ? 'disabled' : ''}>Comprar agora</button>` }); }).join('')}</div>`;
    },
    imoveis() {
      const G = SL.G;
      return `<div class="col">${D.homes.filter(h => h.id !== 'mae').map(h => `<div class="ml-imovel ${G.home.id === h.id ? 'owned' : ''}"><div class="ml-casa c-${h.id}"><i></i><b></b></div><div class="grow"><div class="ml-nome">${esc(h.name)} <span class="tag">${esc(h.district)}</span></div><div class="small muted">${esc(h.desc)}</div><div class="ml-preco"><b>${U.money0(h.rent * SL.State.DIFF[G.player.diff].rent)}<small>/mês</small></b>${h.price ? `<span class="muted small"> · ou ${U.money0(h.price)} à vista</span>` : ''}</div><div class="tiny muted">${h.deco} espaços de decoração</div></div>
        <div class="ml-bts">${G.home.id === h.id ? `<span class="tag ok">${G.home.owned ? 'sua casa' : 'você mora aqui'}</span>${h.price && !G.home.owned ? `<button class="btn sm" data-act="buyhome" data-v="${h.id}">Comprar este</button>` : ''}` : `<button class="btn sm" data-act="rent" data-v="${h.id}">Alugar e mudar</button>${h.price ? `<button class="btn sm primary" data-act="buyhome" data-v="${h.id}">Comprar</button>` : ''}`}</div></div>`).join('')}
        ${G.home.id === 'casa' && !G.home.studio ? `<div class="card row"><span class="acc">${ic('sparkle', 24)}</span><div class="grow"><b>Construir estúdio</b><div class="small muted">Cenário profissional, isolamento acústico e +4 espaços de decoração.</div></div><button class="btn primary sm" data-act="studio">${U.money0(D.STUDIO_COST)}</button></div>` : ''}</div>`;
    },
    act(a, ds, ctx) {
      const st = ctx.st; const phys = ctx.args && ctx.args.physical;
      const done = r => { if (r) return r; SL.audio.play('cash'); return ctx.render(); };
      if (a === 'ver') return this.ver(ds.k, ds.v, ctx, phys);
      if (a === 'tab') { st.tab = ds.t; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'slot') { st.slot = ds.v; return ctx.render(); }
      if (a === 'pslot') { st.pslot = ds.v; return ctx.render(); }
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

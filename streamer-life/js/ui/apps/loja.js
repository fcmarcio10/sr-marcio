/* App Mercado Livre (refeito em nov/2026 no estilo do site de verdade): página inicial com ofertas e os mais vendidos,
   busca com filtros (categoria, preço, avaliação, o que dá pra pagar) e ordem, página do produto, "Monte seu PC" e imóveis.
   Depois de comprar, o botão fica cinza ("A caminho", "Em uso", "Na sua casa"...) para não comprar duas vezes.
   Decorações saíram da loja (pedido do dono): só equipamentos, peças, móveis e itens de casa. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const ic = UI.ic, esc = U.esc;
  const $ = UI.$;
  const ATTR = { perf: 'Desempenho', render: 'Renderização', q: 'Qualidade', audio: 'Áudio', video: 'Imagem', game: 'Jogo', light: 'Luz', cap: 'Captura', vlog: 'Vlog' };

  // nota, avaliações e vendas inventadas, sempre as mesmas para o mesmo produto
  const hash = t => { let h = 7; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const nota = it => { const h = hash(it.id); return Math.min(4.9, 4.0 + (it.tier || 0) * 0.15 + (h % 7) / 10); };
  const avaliacoes = it => { const h = hash(it.id + 'r'); return 40 + h % 2400 + (it.price < 400 ? 1800 : 0); };
  const vendidos = it => avaliacoes(it) * 3 + (hash(it.id + 'v') % 500);
  const estrelas = n => { let s = ''; for (let i = 1; i <= 5; i++) s += `<i class="${n >= i - 0.25 ? 'on' : n >= i - 0.75 ? 'meia' : ''}"></i>`; return `<span class="ml-est">${s}</span>`; };
  const fmtN = n => n.toLocaleString('pt-BR');
  const fmtVend = n => n >= 1000 ? '+' + Math.floor(n / 1000) + ' mil vendidos' : '+' + Math.floor(n / 50) * 50 + ' vendidos';
  // "oferta": alguns produtos aparecem com preço antigo riscado (como no site); o preço que você paga é o de verdade
  const antigo = it => (hash(it.id + 'o') % 3 === 0 && it.price > 30) ? D.precoBR(it.price * (1.15 + (hash(it.id) % 4) * 0.07)) : 0;

  // categorias da loja
  const CATS = [
    { id: 'info', nome: 'Informática', icon: 'laptop', slots: ['computador', 'monitor', 'teclado', 'mouse', 'headset'] },
    { id: 'pecas', nome: 'Peças de PC', icon: 'cpu', slots: ['cpu', 'gpu', 'ram', 'ssd', 'fonte', 'cooler'] },
    { id: 'av', nome: 'Áudio, vídeo e luz', icon: 'cam', slots: ['microfone', 'webcam', 'iluminacao', 'captura', 'vlogcam'] },
    { id: 'games', nome: 'Games', icon: 'gamepad', slots: ['console'] },
    { id: 'moveis', nome: 'Móveis', icon: 'sofa', slots: ['cama', 'mesa', 'cadeira', 'sofa', 'acustica'] },
    { id: 'eletro', nome: 'Eletrodomésticos', icon: 'fridge', slots: ['geladeira', 'fogao', 'cafeteira', 'tv', 'chuveiro', 'bike'] },
    { id: 'servicos', nome: 'Internet e programas', icon: 'wifi', slots: ['net', 'soft'] },
    { id: 'veiculos', nome: 'Veículos', icon: 'car', slots: ['veh'] },
  ];
  const catDe = slot => CATS.find(c => c.slots.includes(slot)) || CATS[0];
  const SLOT_NOME = Object.assign({}, ...D.equipSlots.concat(D.pecaSlots).map(s => ({ [s.id]: s.name })), { cama: 'Camas', geladeira: 'Geladeiras', fogao: 'Fogões', mesa: 'Mesas', cadeira: 'Cadeiras', sofa: 'Sofás', tv: 'TVs', chuveiro: 'Chuveiros', cafeteira: 'Cafeteiras', bike: 'Exercício', acustica: 'Espuma acústica', net: 'Planos de internet', soft: 'Programas', veh: 'Veículos' });

  // todos os produtos à venda (sem decoração)
  const produtos = () => {
    const G = SL.G; const out = [];
    D.equip.forEach(it => { if (it.price > 0 || G.equip.owned[it.id]) out.push({ tipo: 'equip', it, slot: it.slot }); });
    D.furniture.forEach(it => { if (it.slot !== 'deco' && it.price > 0 && !it.oculto) out.push({ tipo: 'furn', it, slot: it.slot }); });
    D.internet.forEach(it => out.push({ tipo: 'net', it, slot: 'net', mensal: true }));
    D.software.forEach(it => out.push({ tipo: 'soft', it, slot: 'soft', mensal: !!it.monthly }));
    D.vehicles.forEach(it => out.push({ tipo: 'veh', it, slot: 'veh' }));
    out.forEach(p => { p.cat = catDe(p.slot).id; p.preco = p.tipo === 'equip' || p.tipo === 'furn' ? SL.Equip.price(p.it) : p.it.price; });
    return out;
  };
  const aCaminho = id => SL.G.equip.deliveries.some(d => d.id === id);

  // situação do produto para você: o botão fica cinza depois de comprar (pedido do dono)
  const situacao = (p, phys) => {
    const G = SL.G; const it = p.it; const pode = G.money >= p.preco;
    const compra = (act, label) => ({ act, label: label || (phys ? 'Comprar e levar' : 'Comprar agora'), cls: 'primary', off: !pode, dica: pode ? '' : 'Saldo insuficiente' });
    if (p.tipo === 'equip') {
      if (aCaminho(it.id)) return { label: 'A caminho', off: true, tag: 'Chega quando você acordar' };
      const owned = !!G.equip.owned[it.id]; const using = G.equip.setup[it.slot] === it.id; const broken = SL.Equip.isBroken(it.id);
      if (broken) return Object.assign(compra('buy', 'Comprar outro'), { tag: 'O seu quebrou', extra: phys ? { act: 'fix', label: 'Consertar ' + U.money0(SL.Equip.repairCost(it.id)) } : null });
      if (owned && using) return { label: it.peca ? 'Instalada no PC' : 'Em uso', off: true, tag: 'Já é seu', vender: it.price > 0 };
      if (owned) return { act: 'use', label: it.peca ? 'Instalar' : 'Usar este', cls: '', tag: 'Já é seu (guardado)', vender: it.price > 0 };
      return compra('buy');
    }
    if (p.tipo === 'furn') {
      if (aCaminho(it.id)) return { label: 'A caminho', off: true, tag: 'Chega quando você acordar' };
      if (G.home.items[it.slot] === it.id) return { label: 'Na sua casa', off: true, tag: 'Já é seu' };
      return compra('buyf');
    }
    if (p.tipo === 'net') return G.equip.net === it.id ? { label: 'Seu plano atual', off: true, tag: 'Contratado' } : { act: 'net', label: 'Mudar para este plano', cls: 'primary' };
    if (p.tipo === 'soft') {
      if (G.equip.soft[it.id]) return it.monthly ? { act: 'soft', label: 'Cancelar assinatura', cls: '', tag: 'Assinatura ativa' } : { label: 'Comprado', off: true, tag: 'Já é seu' };
      return compra('soft', it.monthly ? 'Assinar' : 'Comprar');
    }
    if (p.tipo === 'veh') return G.equip.vehicles.includes(it.id) ? { label: 'Já é seu', off: true, tag: 'Na garagem' } : compra('veh');
    return compra('buy');
  };
  const botao = (p, s, grande) => `<button class="btn ${grande ? '' : 'sm'} ${s.off ? 'ml-off-bt' : s.cls || ''}" ${s.act && !s.off ? `data-act="${s.act}" data-v="${p.it.id}"` : 'disabled'} title="${esc(s.dica || '')}">${s.off ? ic('check', 13) + ' ' : ''}${esc(s.dica && s.off ? s.dica : s.label)}</button>`;
  const extras = (p, s) => (s.extra ? `<button class="btn sm" data-act="${s.extra.act}" data-v="${p.it.id}">${esc(s.extra.label)}</button>` : '') + (s.vender ? `<button class="btn sm ghost" data-act="sell" data-v="${p.it.id}">Vender usado</button>` : '');
  const parcelas = p => p.preco >= 100 && !p.mensal ? `<div class="ml-parc">em <b>${p.preco >= 2000 ? 12 : 10}x ${U.money(p.preco / (p.preco >= 2000 ? 12 : 10))}</b> sem juros</div>` : '';
  const frete = (p, phys) => p.tipo === 'net' ? 'Instalação no mesmo dia' : p.tipo === 'soft' ? 'Liberado na hora' : phys ? 'Retire agora na loja' : p.tipo === 'veh' ? 'Retire hoje' : 'Frete grátis · chega amanhã';
  const precoHTML = (p, big) => { const old = SL.Equip.isBlackFriday() && p.preco < p.it.price ? p.it.price : antigo(p.it); const off = old ? Math.round((1 - p.preco / old) * 100) : 0; return `<div class="ml-preco ${big ? 'big' : ''}">${old ? `<s>${U.money(old)}</s>` : ''}<span class="ml-pv"><b>${p.preco ? U.money(p.preco) : 'Grátis'}</b>${p.mensal ? '<small>/mês</small>' : ''}${off ? `<em>${off}% OFF</em>` : ''}</span></div>`; };
  const subtitulo = p => {
    const it = p.it;
    if (p.tipo === 'equip' && it.peca) { const a = []; if (it.perf) a.push('+' + it.perf + ' desempenho'); if (it.render) a.push('+' + it.render + ' renderização'); if (it.pw) a.push(it.pw + ' W'); if (it.slot === 'gpu') a.push('gasta ' + it.w + ' W'); if (it.cool) a.push('quebra menos'); return a.join(' · '); }
    if (p.tipo === 'equip') { const cur = D.equipById(SL.G.equip.setup[it.slot]); const k = Object.keys(ATTR).find(x => it[x] != null && x !== 'game'); const d = k && cur && cur[k] != null && cur.id !== it.id ? it[k] - cur[k] : 0; return d ? `<span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d} de ${ATTR[k].toLowerCase()} em relação ao seu</span>` : esc(it.desc || ''); }
    if (p.tipo === 'furn') return esc(descMovel(it));
    if (p.tipo === 'net') return `Envio ${it.up} Mbps · estabilidade ${Math.round(it.stab * 100)}%`;
    return esc(it.desc || '');
  };
  const descMovel = f => ({ cama: 'Recupera o cansaço ' + Math.round((f.sleep || 1) * 100) + '% mais rápido', geladeira: 'Guarda ' + f.cap + ' porções de comida', fogao: 'Comida ' + Math.round((f.cook || 1) * 100) + '% melhor', mesa: 'Produção +' + (f.prod || 0) + '%', cadeira: 'Conforto ' + f.comfort + ' (aparece atrás de você na live)', sofa: 'Descanso melhor', tv: 'Lazer e tendências', chuveiro: 'Banho melhor', cafeteira: 'Café em casa', bike: 'Exercício em casa', acustica: '+' + f.audio + ' de áudio nas lives' })[f.slot] || '';
  const marca = p => p.it.brand || ({ furn: 'Casa&Lar', net: 'Operadora', soft: 'Download digital', veh: p.it.id === 'bike' ? 'Pedala Bem' : 'Seminovos' })[p.tipo] || 'Loja oficial';

  // cartão em grade (página inicial) e linha (resultado da busca)
  const cartao = (p, phys) => { const s = situacao(p, phys); return `<div class="ml-card ${s.off ? 'comprado' : ''}" data-act="ver" data-k="${p.tipo}" data-v="${p.it.id}"><div class="ml-foto"><canvas class="pfoto" data-foto="${p.tipo}|${p.it.id}"></canvas>${s.tag ? `<span class="ml-selo ok">${esc(s.tag)}</span>` : ''}</div><div class="ml-info">${precoHTML(p)}${parcelas(p)}<div class="ml-frete">${esc(frete(p, phys))}</div><div class="ml-nome">${esc(p.it.name)}</div><div class="ml-nota">${estrelas(nota(p.it))}<span>(${fmtN(avaliacoes(p.it))})</span></div><div class="ml-bts">${botao(p, s)}</div></div></div>`; };
  const linha = (p, phys) => { const s = situacao(p, phys); return `<div class="ml-row ${s.off ? 'comprado' : ''}" data-act="ver" data-k="${p.tipo}" data-v="${p.it.id}"><div class="ml-foto"><canvas class="pfoto" data-foto="${p.tipo}|${p.it.id}"></canvas></div><div class="ml-info"><div class="ml-nome">${esc(p.it.name)}</div><div class="ml-vend">por ${esc(marca(p))}${nota(p.it) >= 4.6 ? ' <span class="ml-mv">MAIS VENDIDO</span>' : ''}</div><div class="ml-nota">${nota(p.it).toFixed(1).replace('.', ',')} ${estrelas(nota(p.it))}<span>(${fmtN(avaliacoes(p.it))}) · ${fmtVend(vendidos(p.it))}</span></div>${precoHTML(p)}${parcelas(p)}<div class="ml-frete">${esc(frete(p, phys))}</div><div class="ml-sub">${subtitulo(p)}</div>${s.tag ? `<div class="ml-tag">${ic('check', 12)} ${esc(s.tag)}</div>` : ''}<div class="ml-bts">${botao(p, s)}${extras(p, s)}</div></div></div>`; };

  const FAIXAS = [['ate100', 'Até R$ 100', p => p.preco <= 100], ['100a500', 'R$ 100 a R$ 500', p => p.preco > 100 && p.preco <= 500], ['500a2000', 'R$ 500 a R$ 2.000', p => p.preco > 500 && p.preco <= 2000], ['mais2000', 'Mais de R$ 2.000', p => p.preco > 2000]];
  const ORDENS = [['rel', 'Mais relevantes'], ['menor', 'Menor preço'], ['maior', 'Maior preço'], ['vendidos', 'Mais vendidos'], ['nota', 'Melhor avaliados']];
  const semAcento = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  SL.Apps.loja = {
    title: 'Mercado Livre', short: 'Mercado Livre', icon: 'shop', color: 'linear-gradient(135deg,#ffe600,#ffd100)', fg: '#2d3277', order: 9, pc: true, phone: true, w: 1080, h: 720,
    watch: ['equip', 'home', 'money'],
    render(el, ctx) {
      const st = ctx.st; const phys = ctx.args && ctx.args.physical; const G = SL.G;
      if (ctx.args && ctx.args.tab && !st.used) { st.used = 1; st.tab = ctx.args.tab; if (st.tab === 'casa') { st.view = 'busca'; st.cat = 'moveis'; } else if (st.tab === 'pecas') st.view = 'pc'; else if (st.tab === 'imoveis') st.view = 'imoveis'; }
      if (phys && !st.view) { st.view = 'busca'; st.cat = st.tab === 'casa' ? 'moveis' : 'info'; }
      st.view = st.view || 'home';
      const loja = phys ? (st.tab === 'casa' ? 'Casa&Lar · loja física' : 'MegaByte · loja física') : '';
      const nPed = G.equip.deliveries.length;
      el.innerHTML = `<div class="app ml-app"><header class="ml-top"><button class="ml-logo" data-act="inicio"><span class="ml-logo-ic">${ic('shop', 15)}</span><span class="ml-logo-t">mercado<br>livre</span></button>
          <form class="ml-busca" data-busca><input data-f="q" placeholder="Buscar produtos, marcas e muito mais..." value="${esc(st.q || '')}" autocomplete="off"><button type="submit" aria-label="Buscar">${ic('search', 16)}</button></form>
          <div class="ml-saldo">${loja ? `<b class="ml-fis">${esc(loja)}</b>` : ''}<span>Saldo</span><b>${U.money(G.money)}</b></div></header>
        <nav class="ml-nav"><button class="${st.view === 'busca' && !st.cat && !st.q ? 'on' : ''}" data-act="cat" data-v="">Categorias</button>${CATS.map(c => `<button class="${st.view === 'busca' && st.cat === c.id ? 'on' : ''}" data-act="cat" data-v="${c.id}">${c.nome}</button>`).join('')}<button class="${st.view === 'pc' ? 'on' : ''}" data-act="tab" data-t="pecas">Monte seu PC</button>${phys ? '' : `<button class="${st.view === 'imoveis' ? 'on' : ''}" data-act="tab" data-t="imoveis">Imóveis</button>`}<button class="${st.view === 'pedidos' ? 'on' : ''}" data-act="pedidos">Minhas compras${nPed ? ` <i class="ml-badge">${nPed}</i>` : ''}</button></nav>
        <div class="app-body ml-body">${SL.Equip.isBlackFriday() ? '<div class="ml-bf"><b>BLACK FRIDAY</b> 30% de desconto em tudo hoje</div>' : ''}${this[st.view](ctx, phys)}</div></div>`;
      const f = $('[data-busca]', el); if (f) f.onsubmit = e => { e.preventDefault(); st.q = $('[data-f="q"]', el).value.trim(); st.view = 'busca'; st.cat = ''; st.slot = ''; ctx.resetScroll = true; ctx.render(); };
      requestAnimationFrame(() => SL.Produto.pintar(el));
    },
    // página inicial: banner, categorias, ofertas do dia e os mais vendidos
    home(ctx, phys) {
      const lista = produtos().filter(p => p.preco > 0);
      const mais = lista.slice().sort((a, b) => vendidos(b.it) - vendidos(a.it)).slice(0, 10);
      const ofertas = lista.filter(p => antigo(p.it)).sort((a, b) => hash(a.it.id + 'd') - hash(b.it.id + 'd')).slice(0, 5);
      return `<div class="ml-hero"><div><small>OFERTAS DA SEMANA</small><b>Monte seu setup de streamer</b><span>Frete grátis em tudo · parcele em até 12x sem juros</span><button class="btn" data-act="tab" data-t="pecas">Monte seu PC</button></div><div class="ml-hero-ic">${ic('cpu', 64)}</div></div>
        <div class="ml-atalhos">${CATS.map(c => `<button data-act="cat" data-v="${c.id}"><span>${ic(c.icon, 22)}</span>${c.nome}</button>`).join('')}</div>
        <div class="ml-sec"><div class="ml-sec-h"><b>Ofertas do dia</b><button class="ml-link" data-act="cat" data-v="">Ver todas</button></div><div class="ml-grid">${ofertas.map(p => cartao(p, phys)).join('')}</div></div>
        <div class="ml-sec"><div class="ml-sec-h"><b>Mais vendidos</b><button class="ml-link" data-act="ordem" data-v="vendidos">Ver mais</button></div><div class="ml-grid">${mais.map(p => cartao(p, phys)).join('')}</div></div>`;
    },
    // busca com filtros na lateral e resultados em lista
    busca(ctx, phys) {
      const st = ctx.st; const G = SL.G; st.ordem = st.ordem || 'rel';
      let lista = produtos();
      if (phys) lista = lista.filter(p => st.tab === 'casa' ? ['moveis', 'eletro'].includes(p.cat) : ['info', 'pecas', 'av', 'games'].includes(p.cat));
      const termo = semAcento(st.q);
      if (termo) lista = lista.filter(p => termo.split(/\s+/).every(w => semAcento(p.it.name + ' ' + (p.it.brand || '') + ' ' + (SLOT_NOME[p.slot] || '') + ' ' + catDe(p.slot).nome + ' ' + (p.it.desc || '')).includes(w)));
      const contaCat = id => lista.filter(p => p.cat === id).length;
      const cats = CATS.filter(c => contaCat(c.id));
      if (st.cat) lista = lista.filter(p => p.cat === st.cat);
      const slots = st.cat ? CATS.find(c => c.id === st.cat).slots.filter(s => lista.some(p => p.slot === s)) : [];
      if (st.slot) lista = lista.filter(p => p.slot === st.slot);
      if (st.faixa) { const fx = FAIXAS.find(f => f[0] === st.faixa); if (fx) lista = lista.filter(fx[2]); }
      if (st.nota4) lista = lista.filter(p => nota(p.it) >= 4.5);
      if (st.pago) lista = lista.filter(p => p.preco <= G.money);
      if (st.naoTenho) lista = lista.filter(p => !situacao(p, phys).off);
      const ord = { rel: (a, b) => (b.it.tier || 0) - (a.it.tier || 0) || a.preco - b.preco, menor: (a, b) => a.preco - b.preco, maior: (a, b) => b.preco - a.preco, vendidos: (a, b) => vendidos(b.it) - vendidos(a.it), nota: (a, b) => nota(b.it) - nota(a.it) }[st.ordem];
      lista.sort(ord);
      const titulo = st.q ? `"${esc(st.q)}"` : st.slot ? esc(SLOT_NOME[st.slot] || '') : st.cat ? esc(CATS.find(c => c.id === st.cat).nome) : 'Todos os produtos';
      const chk = (k, txt) => `<label class="ml-chk"><input type="checkbox" data-act="filtro" data-v="${k}" ${st[k] ? 'checked' : ''}><span>${txt}</span></label>`;
      return `<div class="ml-busca-pg"><aside class="ml-filtros"><h2>${titulo}</h2><small>${lista.length} resultado${lista.length === 1 ? '' : 's'}</small>
          ${st.q || st.cat || st.slot || st.faixa || st.nota4 || st.pago || st.naoTenho ? '<button class="ml-link" data-act="limpar">Limpar filtros</button>' : ''}
          <h4>Categorias</h4>${(st.cat ? CATS.filter(c => c.id === st.cat) : cats).map(c => `<button class="ml-fl ${st.cat === c.id ? 'on' : ''}" data-act="cat" data-v="${st.cat === c.id ? '' : c.id}">${c.nome} <span>(${contaCat(c.id)})</span></button>`).join('')}
          ${slots.length > 1 ? `<h4>Tipo</h4>${slots.map(s => `<button class="ml-fl ${st.slot === s ? 'on' : ''}" data-act="slot" data-v="${st.slot === s ? '' : s}">${esc(SLOT_NOME[s] || s)}</button>`).join('')}` : ''}
          <h4>Preço</h4>${FAIXAS.map(([k, t]) => `<button class="ml-fl ${st.faixa === k ? 'on' : ''}" data-act="faixa" data-v="${st.faixa === k ? '' : k}">${t}</button>`).join('')}
          <h4>Mais filtros</h4>${chk('pago', 'Cabe no meu saldo')}${chk('nota4', 'Avaliação 4,5 ou mais')}${chk('naoTenho', 'Esconder o que já tenho')}
          <div class="ml-ftag">${ic('check', 12)} Frete grátis em todos</div></aside>
        <section class="ml-res"><div class="ml-res-h"><span>Ordenar por</span><select data-f="ordem">${ORDENS.map(([k, t]) => `<option value="${k}" ${st.ordem === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
          ${lista.length ? `<div class="ml-lista">${lista.map(p => linha(p, phys)).join('')}</div>` : `<div class="ml-vazio">${ic('search', 30)}<b>Não encontramos nenhum produto</b><span>Tente outras palavras ou tire alguns filtros.</span></div>`}
          ${st.slot === 'computador' ? this.compat() : ''}</section></div>`;
    },
    // Monte seu PC: peças instaladas e o ganho de cada uma
    pc(ctx, phys) {
      const st = ctx.st; st.pslot = st.pslot || 'cpu'; const G = SL.G; const pc = SL.Equip.item('computador'); const pb = SL.Equip.pecas(); const s = SL.Equip.stats();
      const lista = produtos().filter(p => p.slot === st.pslot);
      const lp = sl => { const it = SL.Equip.item(sl.id); return `<div class="pc-peca ${it ? 'tem' : ''} ${st.pslot === sl.id ? 'sel' : ''}" data-act="pslot" data-v="${sl.id}">${ic(sl.icon, 15)}<span><small>${sl.name}</small><b>${it ? esc(it.name.replace(/^(Processador|Placa de vídeo|Memória RAM) /, '')) : 'vazio'}</b></span></div>`; };
      const barra = (nome, base, extra) => `<div class="pc-bar"><span>${nome}</span><div class="bar"><i style="width:${Math.min(100, base)}%"></i><i class="mais" style="left:${Math.min(100, base)}%;width:${Math.max(0, Math.min(100 - base, extra))}%"></i></div><b>${Math.min(100, base + extra)}</b></div>`;
      return `<div class="pc-monta"><div class="pc-monta-h"><div><small>Seu PC</small><b>${pc ? esc(pc.name) : 'Sem computador'}</b></div>${pb.desktop ? '' : '<span class="tag warn">Notebook não aceita peças: compre um PC de mesa</span>'}${pb.fraca ? '<span class="tag bad">Fonte fraca: a placa de vídeo rende só 40%</span>' : ''}</div>
        <div class="pc-pecas">${D.pecaSlots.map(lp).join('')}</div>
        ${pc ? barra('Desempenho', pc.perf, pb.perf) + barra('Renderização', pc.render, pb.render) : ''}
        ${pb.desktop ? `<div class="tiny muted">Energia: precisa de ${pb.need} W, a fonte entrega ${pb.supply} W${pb.cool ? ' · refrigeração diminui a chance de quebrar' : ''}. Desempenho atual: <b>${s.perf}</b> (jogos e live) · renderização <b>${s.render}</b> (edição de vídeo).</div>` : ''}</div>
        <div class="ml-lista">${lista.map(p => linha(p, phys)).join('')}</div>`;
    },
    // compras que estão chegando
    pedidos(ctx) {
      const G = SL.G; const ped = G.equip.deliveries.map(d => ({ d, it: d.kind === 'furn' ? D.furnById(d.id) : D.equipById(d.id), tipo: d.kind === 'furn' ? 'furn' : 'equip' })).filter(x => x.it);
      return `<div class="ml-sec"><div class="ml-sec-h"><b>Minhas compras</b></div>${ped.length ? `<div class="ml-lista">${ped.map(x => `<div class="ml-row comprado"><div class="ml-foto"><canvas class="pfoto" data-foto="${x.tipo}|${x.it.id}"></canvas></div><div class="ml-info"><div class="ml-tag ok">${ic('truck', 13)} A caminho · chega quando você acordar</div><div class="ml-nome">${esc(x.it.name)}</div><div class="ml-sub">Pago ${U.money(x.it.price)}</div></div></div>`).join('')}</div>` : `<div class="ml-vazio">${ic('shop', 30)}<b>Nenhuma compra a caminho</b><span>O que você compra online chega quando você acorda.</span></div>`}</div>`;
    },
    // página do produto: foto grande, preço, ficha técnica e o botão (cinza se já é seu)
    ver(k, id, ctx, phys) {
      const G = SL.G; const p = produtos().find(x => x.tipo === k && x.it.id === id); if (!p) return; const it = p.it;
      let ficha = '';
      const barra = (nome, v, max, d) => `<div class="ml-ficha-l"><span>${nome}</span><div class="bar"><i style="width:${Math.min(100, v / max * 100)}%"></i></div><b>${v}</b>${d ? `<em class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d}</em>` : ''}</div>`;
      if (k === 'equip') {
        const cur = D.equipById(G.equip.setup[it.slot]); const using = cur && cur.id === it.id;
        ficha = it.peca ? `<div class="ml-ficha-t">${subtitulo(p)}</div>` + (cur && !using ? `<div class="ml-ficha-t">No lugar de: <b>${esc(cur.name)}</b></div>` : '') + (SL.Equip.pecas().desktop ? '' : '<div class="ml-ficha-t bad">Seu notebook não aceita peças: ela fica guardada até você ter um PC de mesa.</div>')
          : Object.keys(ATTR).filter(x => it[x] != null).map(x => barra(ATTR[x], it[x], x === 'game' ? 8 : 100, cur && cur[x] != null && !using ? it[x] - cur[x] : 0)).join('');
        if (it.rel && !it.peca) ficha += `<div class="ml-ficha-t">Confiabilidade <b>${it.rel >= 0.998 ? 'alta' : it.rel >= 0.995 ? 'média' : 'baixa'}</b>${it.w ? ' · consumo <b>' + it.w + ' W</b>' : ''}</div>`;
        if (cur && !using) ficha += `<div class="ml-ficha-t">Comparando com o seu: <b>${esc(cur.name)}</b></div>`;
      }
      const s = situacao(p, phys);
      const m = UI.modal({ title: it.name, icon: 'shop', wide: true, cls: 'ml-modal', html: `<div class="ml-det"><div class="ml-det-foto"><canvas class="pfoto" data-foto="${k}|${it.id}"></canvas></div><div class="ml-det-info"><div class="ml-vend">Novo · ${fmtVend(vendidos(it))}</div><h3 class="ml-det-t">${esc(it.name)}</h3><div class="ml-nota">${nota(it).toFixed(1).replace('.', ',')} ${estrelas(nota(it))}<span>(${fmtN(avaliacoes(it))})</span></div>${precoHTML(p, true)}${parcelas(p)}<div class="ml-frete">${ic('check', 12)} ${esc(frete(p, phys))}</div>${s.tag ? `<div class="ml-tag">${ic('check', 12)} ${esc(s.tag)}</div>` : ''}<div class="ml-bts">${botao(p, s, true)}${extras(p, s)}</div><div class="ml-vend">Vendido por <b>${esc(marca(p))}</b> · Loja oficial</div><p class="ml-desc">${subtitulo(p)}</p>${ficha ? `<div class="ml-ficha"><h4>Características</h4>${ficha}</div>` : ''}</div></div>`, onRender: mm => requestAnimationFrame(() => SL.Produto.pintar(mm.el)) });
      m.el.addEventListener('click', e => { const t = e.target.closest('[data-act]'); if (!t || t.disabled) return; SL.audio.play('click'); const r = this.act(t.dataset.act, t.dataset, ctx); m.close(); if (typeof r === 'string') UI.err(r); });
    },
    compat() {
      const pcs = D.equip.filter(e => e.slot === 'computador');
      return `<div class="card"><h3>Compatibilidade com os jogos (720p)</h3><div class="tablewrap"><table class="table"><tr><th>Jogo</th>${pcs.map(p => `<th>${esc(p.name.replace('PC ', ''))}</th>`).join('')}</tr>${D.games.filter(g => !g.console).map(g => `<tr><td class="small">${esc(g.name)}</td>${pcs.map(p => { const f = Math.min(1, p.perf / (g.demand + 15 + 4)); return `<td class="n ${f >= 0.95 ? 'ok' : f >= 0.75 ? 'warn' : 'bad'}">${f >= 0.95 ? 'liso' : f >= 0.75 ? 'trava às vezes' : 'trava muito'}</td>`; }).join('')}</tr>`).join('')}</table></div><p class="tiny muted">GTA 6 é exclusivo de console: precisa do VortexStation 5 e de uma placa de captura.</p></div>`;
    },
    imoveis() {
      const G = SL.G;
      return `<div class="col">${D.homes.filter(h => h.id !== 'mae').map(h => `<div class="ml-imovel ${G.home.id === h.id ? 'owned' : ''}"><div class="ml-casa c-${h.id}"><i></i><b></b></div><div class="grow"><div class="ml-nome">${esc(h.name)} <span class="tag">${esc(h.district)}</span></div><div class="small muted">${esc(h.desc)}</div><div class="ml-preco"><b>${U.money0(h.rent * SL.State.DIFF[G.player.diff].rent)}<small>/mês</small></b>${h.price ? `<span class="muted small"> · ou ${U.money0(h.price)} à vista</span>` : ''}</div></div>
        <div class="ml-bts">${G.home.id === h.id ? `<button class="btn sm ml-off-bt" disabled>${ic('check', 13)} ${G.home.owned ? 'Sua casa' : 'Você mora aqui'}</button>${h.price && !G.home.owned ? `<button class="btn sm" data-act="buyhome" data-v="${h.id}">Comprar este</button>` : ''}` : `<button class="btn sm" data-act="rent" data-v="${h.id}">Alugar e mudar</button>${h.price ? `<button class="btn sm primary" data-act="buyhome" data-v="${h.id}">Comprar</button>` : ''}`}</div></div>`).join('')}
        ${G.home.id === 'casa' && !G.home.studio ? `<div class="card row"><span class="acc">${ic('sparkle', 24)}</span><div class="grow"><b>Construir estúdio</b><div class="small muted">Cenário profissional e isolamento acústico.</div></div><button class="btn primary sm" data-act="studio">${U.money0(D.STUDIO_COST)}</button></div>` : ''}</div>`;
    },
    act(a, ds, ctx, ev, t) {
      const st = ctx.st; const phys = ctx.args && ctx.args.physical;
      const done = r => { if (r) return r; SL.audio.play('cash'); return ctx.render(); };
      if (a === 'ver') return this.ver(ds.k, ds.v, ctx, phys);
      if (a === 'inicio') { st.view = phys ? 'busca' : 'home'; st.q = ''; st.cat = ''; st.slot = ''; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'tab') { st.view = ds.t === 'pecas' ? 'pc' : ds.t === 'imoveis' ? 'imoveis' : ds.t === 'casa' ? 'busca' : 'busca'; if (ds.t === 'casa') st.cat = 'moveis'; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'pedidos') { st.view = 'pedidos'; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'cat') { st.view = 'busca'; st.cat = ds.v; st.slot = ''; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'slot') { st.view = 'busca'; st.slot = ds.v; if (ds.v) st.cat = catDe(ds.v).id; ctx.resetScroll = true; return ctx.render(); }
      if (a === 'faixa') { st.faixa = ds.v; return ctx.render(); }
      if (a === 'ordem') { st.view = 'busca'; st.ordem = ds.v; return ctx.render(); }
      if (a === 'filtro') { st[ds.v] = t ? t.checked : !st[ds.v]; return ctx.render(); }
      if (a === 'limpar') { st.q = ''; st.cat = ''; st.slot = ''; st.faixa = ''; st.nota4 = st.pago = st.naoTenho = false; return ctx.render(); }
      if (a === 'pslot') { st.view = 'pc'; st.pslot = ds.v; return ctx.render(); }
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
    change(target, ctx) { if (target.dataset.f === 'ordem') { ctx.st.ordem = target.value; ctx.render(); } },
  };
})(window.SL);

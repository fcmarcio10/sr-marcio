/* Patrocínios com exigências e prazo (aceitar, negociar, recusar, cumprir ou pagar multa) e produtos próprios do canal. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const SP = SL.Sponsors = {};
  const G = () => SL.G;
  SP.KIND = { live: 'Menção ao vivo', video: 'Vídeo com publicidade', post: 'Post no Connect' };

  SP.reach = () => {
    const G0 = G(); const av = G0.ch.avgViewers.slice(-10); const avgV = av.length ? av.reduce((a, b) => a + b, 0) / av.length : 0;
    return { followers: SL.Social.totalFollowers(), avgV };
  };
  SP.tierFor = () => { const r = SP.reach(); const s = Math.log10(1 + r.followers) + Math.log10(1 + r.avgV) * 1.2; return s < 3.6 ? 0 : s < 5.6 ? 1 : s < 7.2 ? 2 : 3; };

  SP.makeOffer = (forceBrand) => {
    const G0 = G(); const r = SP.reach(); const tier = SP.tierFor();
    const mgr = SL.Rel.manager();
    const blocked = G0.flags.brandBlock || {};
    let pool = D.brands.filter(b => b.tier <= tier && !blocked[b.id] && !G0.offers.some(o => o.brand === b.id) && !G0.contracts.some(c => c.brand === b.id && c.state === 'ativo'));
    if (forceBrand) pool = D.brands.filter(b => b.id === forceBrand);
    if (!pool.length) return null;
    const b = U.wpick(pool, x => (x.tier === tier ? 2 : 1) * (x.ethics < 0.3 ? (mgr && mgr.pers === 'agressiva' ? 1.6 : 0.6) : 1) * (G0.flags['brandFav_' + x.id] ? 2 : 1));
    // valor por alcance: cerca de R$ 30 a cada mil seguidores + R$ 6 por pessoa na média das lives
    const mult = [0.8, 1.15, 1.5, 2.0][b.tier] * (b.ethics < 0.3 ? 1.7 : 1);
    let value = (r.followers * 0.03 + r.avgV * 6 + 150) * mult * (0.6 + G0.rep.credibilidade / 100) * U.rf(0.85, 1.15) * (G0.flags['brandFav_' + b.id] ? 1.2 : 1);
    if (mgr) value *= mgr.pers === 'agressiva' ? 1.45 : 1.25;
    value = Math.round(value / 50) * 50;
    const deliv = [];
    const nLive = U.ri(1, 3); if (G0.ch.pulso.livesN > 0 || U.chance(0.6)) deliv.push({ k: 'live', n: nLive, done: 0, minV: Math.max(3, Math.round(r.avgV * 0.6)), lives: [] });
    if (U.chance(0.5) || !deliv.length) deliv.push({ k: 'video', n: 1, done: 0 });
    if (U.chance(0.55)) deliv.push({ k: 'post', n: U.ri(1, 2), done: 0 });
    const o = { id: U.uid('of'), brand: b.id, value, deliv, days: U.ri(10, 21), excl: b.cat, t: G0.time.t, expires: G0.time.t + 4 * 1440, neg: 0, state: 'aberta' };
    G0.offers.push(o);
    const desc = deliv.map(d => d.n + 'x ' + SP.KIND[d.k].toLowerCase() + (d.k === 'live' ? ' (mín. ' + d.minV + ' pessoas assistindo)' : '')).join(', ');
    SL.Social.dm('brand_' + b.id, 'Olá! Somos da ' + b.name + '. Queremos fazer uma parceria: ' + U.money(value) + ' por ' + desc + ' em até ' + o.days + ' dias.' + (mgr ? ' (negociado por ' + mgr.short + ')' : ''),
      [{ id: 'of_aceitar', label: 'Aceitar a proposta' }, { id: 'of_negociar', label: 'Pedir 20% a mais' }, { id: 'of_recusar', label: 'Recusar' }], { name: b.name + ' (parcerias)', data: { offer: o.id } });
    SL.bus.emit('offers');
    return o;
  };
  SP.offerText = o => o.deliv.map(d => d.n + 'x ' + SP.KIND[d.k].toLowerCase()).join(' + ');
  SP.conflict = o => G().contracts.find(c => c.state === 'ativo' && c.excl === o.excl);

  SP.accept = id => {
    const G0 = G(); const o = G0.offers.find(x => x.id === id); if (!o) return 'Proposta não encontrada.';
    const cf = SP.conflict(o); if (cf) return 'Exclusividade: você já tem contrato com ' + D.brandById(cf.brand).name + ' (mesmo ramo).';
    G0.offers = G0.offers.filter(x => x.id !== id);
    const b = D.brandById(o.brand); const mgr = SL.Rel.manager();
    const c = Object.assign({}, o, { state: 'ativo', start: SL.Clock.day(), deadline: SL.Clock.day() + o.days, paid: 0, cut: mgr ? mgr.cut : 0 });
    const up = Math.round(c.value * 0.5 * (1 - c.cut));
    SL.Econ.add(up, 'patrocinio', 'Adiantamento: ' + b.name); c.paid = up;
    G0.contracts.push(c);
    if (SL.Calendar) SL.Calendar.add({ day: c.deadline, kind: 'contrato', title: 'Prazo do contrato ' + b.name, ref: c.id });
    if (b.ethics < 0.3) { SL.Rep.mod({ confianca: -4, imagem: -2 }); SL.Social.newsAboutPlayer('bad'); }
    else SL.Rep.mod({ credibilidade: 1, profissional: 1 });
    SL.notify({ cat: 'carreira', icon: 'brief', title: 'Contrato assinado com ' + b.name, text: 'Entregue: ' + SP.offerText(c) + ' até ' + SL.Clock.fmtDay(c.deadline) + '.', app: 'parcerias' });
    SL.bus.emit('offers'); if (SL.Goals) SL.Goals.check();
    return null;
  };
  SP.negotiate = (id, pct) => {
    const G0 = G(); const o = G0.offers.find(x => x.id === id); if (!o) return { ok: false, text: 'Proposta não encontrada.' };
    if (o.neg >= 1) return { ok: false, text: 'A marca já disse que esse é o valor final.' };
    o.neg++;
    const p = 0.78 - pct * 1.6 + G0.rep.credibilidade / 250 + (SL.Rel.manager() ? 0.15 : 0);
    const b = D.brandById(o.brand);
    if (U.chance(p)) { o.value = Math.round(o.value * (1 + pct) / 50) * 50; SL.Social.dm('brand_' + b.id, 'Conseguimos chegar em ' + U.money(o.value) + '. Fechamos?', [{ id: 'of_aceitar', label: 'Fechar' }, { id: 'of_recusar', label: 'Recusar' }], { name: b.name + ' (parcerias)', data: { offer: o.id }, silent: true }); SL.bus.emit('offers'); return { ok: true, text: 'A marca aceitou: ' + U.money(o.value) }; }
    if (U.chance(0.5)) { G0.offers = G0.offers.filter(x => x.id !== id); SL.Social.dm('brand_' + b.id, 'Infelizmente não conseguimos subir o valor. Vamos procurar outro criador.', null, { name: b.name + ' (parcerias)', silent: true }); SL.bus.emit('offers'); return { ok: false, text: 'A marca desistiu da parceria.' }; }
    SL.bus.emit('offers');
    return { ok: false, text: 'A marca manteve o valor original. A proposta continua de pé.' };
  };
  SP.decline = id => { const G0 = G(); G0.offers = G0.offers.filter(x => x.id !== id); SL.bus.emit('offers'); };
  SP.onDm = (threadId, m, optId) => {
    const oid = m.data && m.data.offer;
    if (optId === 'of_aceitar') { const err = SP.accept(oid); SL.Social.dm(threadId, err ? 'Hmm: ' + err : 'Perfeito! Contrato enviado. Adiantamento depositado.', null, { silent: true }); }
    if (optId === 'of_negociar') { const r = SP.negotiate(oid, 0.2); if (!r.ok) SL.Social.dm(threadId, r.text, null, { silent: true }); }
    if (optId === 'of_recusar') { SP.decline(oid); SL.Social.dm(threadId, 'Tudo bem, obrigado pelo retorno!', null, { silent: true }); }
  };

  SP.active = () => G().contracts.filter(c => c.state === 'ativo');
  SP.deliver = (cid, kind, data) => {
    const c = G().contracts.find(x => x.id === cid && x.state === 'ativo'); if (!c) return;
    const d = c.deliv.find(x => x.k === kind && x.done < x.n); if (!d) return;
    if (kind === 'live') {
      const liveId = SL.Live.cur ? SL.Live.cur.id : 'x';
      if (d.lives.includes(liveId)) return;
      if (data.viewers < d.minV) { SL.notify({ cat: 'carreira', icon: 'alert', title: 'Menção não contou', text: 'A ' + D.brandById(c.brand).name + ' exige pelo menos ' + d.minV + ' pessoas assistindo no momento da menção.' }); return; }
      d.lives.push(liveId);
    }
    d.done++;
    SL.notify({ cat: 'carreira', icon: 'check', title: 'Entrega do contrato', text: D.brandById(c.brand).name + ': ' + SP.KIND[kind] + ' (' + d.done + '/' + d.n + ')', silent: kind === 'live' });
    if (c.deliv.every(x => x.done >= x.n)) SP.complete(c);
    SL.bus.emit('offers');
  };
  SP.complete = c => {
    const b = D.brandById(c.brand);
    c.state = 'cumprido';
    const rest = Math.round(c.value * 0.5 * (1 - c.cut));
    SL.Econ.add(rest, 'patrocinio', 'Pagamento final: ' + b.name); c.paid += rest;
    SL.Rep.mod({ credibilidade: 3, profissional: 2 });
    G().flags['brandFav_' + b.id] = 1;
    if (SL.Calendar) SL.Calendar.removeRef(c.id);
    SL.notify({ cat: 'carreira', icon: 'trophy', title: 'Contrato cumprido', text: b.name + ' pagou ' + U.money(rest) + ' e quer trabalhar com você de novo.', app: 'parcerias' });
  };
  SP.cancelByBrand = c => {
    c.state = 'cancelado'; if (SL.Calendar) SL.Calendar.removeRef(c.id);
    SL.notify({ cat: 'carreira', icon: 'alert', title: D.brandById(c.brand).name + ' cancelou o contrato', text: 'A marca não quer mais associar o nome dela ao seu agora. Você fica com o adiantamento.', app: 'parcerias' });
    SL.Rep.mod({ credibilidade: -2, profissional: -2 });
    SL.bus.emit('offers');
  };

  // ---------- produtos próprios ----------
  SP.fans = () => { const G0 = G(); return Math.round((G0.ch.pulso.f - (G0.ch.pulso.fake || 0)) * 0.1 + G0.ch.vision.f * 0.04 + G0.viewers.list.filter(v => v.loy >= 55).length); };
  SP.launch = id => {
    const G0 = G(); const m = D.merch.find(x => x.id === id); if (!m) return 'Produto inválido.';
    if (G0.ch.merch.products[id]) return 'Esse produto já está à venda.';
    if (SP.fans() < m.minFans) return 'Precisa de pelo menos ' + U.int(m.minFans) + ' fãs engajados (você tem ' + U.int(SP.fans()) + ').';
    if (!SL.Econ.spend(800, 'outros', 'Design e loja: ' + m.name)) return 'Precisa de R$ 800 para criar a arte e a loja.';
    G0.ch.merch.products[id] = { since: SL.Clock.day(), sold: 0, rev: 0 }; G0.ch.merch.on = true;
    SL.notify({ cat: 'carreira', icon: 'bag', title: 'Produto lançado', text: m.name + ' por ' + U.money(m.price) + '. Divulgue nas lives!', app: 'parcerias' });
    if (SL.Goals) SL.Goals.check();
    return null;
  };

  SL.bus.on('tick:day', day => {
    const G0 = G(); if (!G0) return;
    // propostas expiram
    G0.offers = G0.offers.filter(o => { if (G0.time.t > o.expires) { return false; } return true; });
    // prazos
    G0.contracts.forEach(c => {
      if (c.state !== 'ativo') return;
      if (day === c.deadline - 2) SL.notify({ cat: 'carreira', icon: 'clock', title: 'Contrato vence em 2 dias', text: D.brandById(c.brand).name + ': faltam ' + c.deliv.filter(d => d.done < d.n).map(d => (d.n - d.done) + 'x ' + SP.KIND[d.k].toLowerCase()).join(', '), app: 'parcerias' });
      if (day > c.deadline) {
        c.state = 'quebrado';
        const fine = Math.round(c.paid + c.value * 0.2);
        SL.Econ.addBill('multa', 'Multa contratual: ' + D.brandById(c.brand).name, fine, day + 7, 'dividas');
        SL.Rep.mod({ credibilidade: -8, imagem: -2, profissional: -4 });
        (G0.flags.brandBlock = G0.flags.brandBlock || {})[c.brand] = 1;
        if (SL.Calendar) SL.Calendar.removeRef(c.id);
        SL.notify({ cat: 'carreira', icon: 'alert', title: 'Contrato descumprido', text: 'Multa de ' + U.money(fine) + ' (devolução do adiantamento + 20%). A marca não trabalha mais com você.', app: 'banco' });
      }
      if (D.brandById(c.brand).ethics > 0.5 && (G0.rep.imagem < 30 || (G0.flags.polemicUntil && G0.time.t < G0.flags.polemicUntil)) && U.chance(0.12)) SP.cancelByBrand(c);
    });
    // novas propostas
    const r = SP.reach();
    if ((r.followers >= 120 || r.avgV >= 5) && G0.offers.length < 3) {
      const p = 0.07 + Math.min(0.25, Math.log10(1 + r.followers) * 0.03) + (SL.Rel.manager() ? 0.12 : 0) + (G0.rep.credibilidade - 40) / 400;
      if (U.chance(p)) SP.makeOffer();
    }
    // vendas da lojinha
    const prods = G0.ch.merch.products; let total = 0, units = 0;
    for (const id in prods) {
      const m = D.merch.find(x => x.id === id);
      const n = U.poisson(SP.fans() * 0.00045 * (G0.rep.imagem / 50) * (m.price < 80 ? 1.3 : 0.8));
      if (n > 0) { const profit = n * (m.price - m.unit - 8); prods[id].sold += n; prods[id].rev += profit; total += profit; units += n; }
    }
    if (total > 0) { SL.Econ.add(Math.round(total * 100) / 100, 'produtos', 'Vendas da loja do canal (' + units + ' itens)'); G0.ch.merch.sold += units; }
  });
})(window.SL);

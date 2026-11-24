/* Equipamentos (setup), compatibilidade com os jogos, qualidade da transmissão, entregas, quebras.
   Também a casa: móveis, decoração, mudança, despejo e estúdio. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const Q = SL.Equip = {};
  const H = SL.Home = {};
  const G = () => SL.G;

  Q.PRESETS = {
    '480p': { up: 2, load: 8, mul: 0.7, label: '480p (leve)' },
    '720p': { up: 4.5, load: 15, mul: 1, label: '720p 30 qps' },
    '1080p': { up: 7.5, load: 25, mul: 1.15, label: '1080p 60 qps' },
    '1440p': { up: 13, load: 36, mul: 1.25, label: '1440p 60 qps', need: 'parc' },
  };

  Q.item = slot => { const id = G().equip.setup[slot]; if (!id || G().equip.broken[id]) return null; return D.equipById(id); };
  Q.isBroken = id => !!G().equip.broken[id];
  Q.owns = id => !!G().equip.owned[id];
  Q.isBlackFriday = () => SL.Clock.md() === '11-26' || SL.Clock.md() === '11-27';
  Q.price = it => Math.round(it.price * (Q.isBlackFriday() ? 0.7 : 1));

  // Atributos somados do setup atual
  Q.stats = () => {
    const G0 = G(), s = {};
    const pc = Q.item('computador');
    s.perf = pc ? pc.perf : 0; s.render = pc ? pc.render : 0; s.watts = pc ? pc.w : 0;
    const mic = Q.item('microfone'); s.audio = mic ? mic.audio : (pc ? 14 : 0);
    const cam = Q.item('webcam'); s.video = cam ? cam.video : (pc && pc.id === 'pc_note' ? 16 : 0);
    s.hasCam = !!cam || (pc && pc.id === 'pc_note');
    const light = Q.item('iluminacao'); s.light = light ? light.light : 8;
    const head = Q.item('headset'); s.audio += head ? head.audio * 0.08 : 0;
    s.game = ['headset', 'teclado', 'mouse'].reduce((a, k) => a + ((Q.item(k) || {}).game || 0), 0);
    const mon = Q.item('monitor'); s.monQ = mon ? mon.q : 15; s.dual = !!(mon && mon.dual); s.game += mon ? mon.q / 20 : 0;
    const cap = Q.item('captura'); s.cap = cap ? cap.cap : 0;
    s.console = !!Q.item('console');
    const vc = Q.item('vlogcam'); s.vlog = vc ? vc.vlog : 30; // celular comum
    const net = D.internet.find(n => n.id === G0.equip.net); s.up = G0.flags.netCut ? 0 : net.up; s.stab = net.stab;
    const ac = D.furnById(G0.home.items.acustica); if (ac) s.audio += ac.audio;
    if (G0.home.studio) s.audio += 8;
    s.audio = U.clamp(s.audio, 0, 100);
    // cenário: decoração do escritório + iluminação + limpeza
    let cen = 18 + G0.home.deco.reduce((a, id) => a + ((D.furnById(id) || {}).cam || 0) + ((D.furnById(id) || {}).decor || 0) * 0.4, 0);
    cen += s.light * 0.15; cen -= Math.max(0, G0.home.dirt - 40) * 0.4; if (G0.home.studio) cen += 30;
    if (G0.equip.soft.overlays) cen += 5;
    s.cenario = U.clamp(cen, 0, 100);
    const chair = D.furnById(G0.home.items.cadeira); s.comfort = chair ? chair.comfort : 5;
    const desk = D.furnById(G0.home.items.mesa); s.prod = (desk ? desk.prod : 0) + (s.dual ? 10 : 0);
    return s;
  };

  Q.canStream = (game, preset) => {
    const s = Q.stats();
    if (!Q.item('computador')) return { ok: false, reason: 'Seu computador está quebrado ou você não tem um.' };
    if (G().flags.netCut) return { ok: false, reason: 'Sua internet foi cortada por falta de pagamento.' };
    if (game.console && !s.console) return { ok: false, reason: game.name + ' é exclusivo de console. Compre o VortexStation 5.' };
    if (game.console && !s.cap) return { ok: false, reason: 'Para transmitir do console você precisa de uma placa de captura.' };
    const p = Q.PRESETS[preset];
    if (p && p.need === 'parc' && !G().ch.pulso.parc) return { ok: false, reason: '1440p só para parceiros da Twitch.' };
    return { ok: true };
  };

  // Qualidade técnica da live (0-100) e problemas
  Q.streamQuality = (game, preset, camOn, ev) => {
    const s = Q.stats(); const p = Q.PRESETS[preset] || Q.PRESETS['720p'];
    const issues = [];
    const gameLoad = game.console ? 6 : game.demand;
    const load = gameLoad + p.load + (camOn ? 4 : 0);
    let fps = U.clamp(s.perf / Math.max(1, load), 0.15, 1);
    if (fps < 0.8) issues.push('lag');
    let netOk = U.clamp(s.up / p.up, 0, 1);
    if (ev && ev.net > 0) netOk *= 0.25;
    if (netOk < 0.85) issues.push('rede');
    const smooth = Math.min(fps, netOk);
    let img = p.mul * Math.pow(smooth, 1.4) * 80;
    if (game.console) img *= 0.6 + s.cap / 250;
    let audio = s.audio; if (ev && ev.mic > 0) { audio = 3; issues.push('mic'); }
    const video = camOn ? U.clamp(s.video * (0.55 + s.light / 180), 0, 100) : 0;
    if (camOn && video < 25) issues.push('cam');
    const overall = U.clamp(img * 0.42 + audio * 0.3 + (camOn ? video * 0.18 + s.cenario * 0.1 : 20), 0, 100);
    return { fps, netOk, smooth, img: U.clamp(img, 0, 100), audio, video, overall, issues, drop: 1 - smooth };
  };

  // ---------- compras ----------
  Q.buy = (id, mode) => {
    const it = D.equipById(id); if (!it) return 'Item não encontrado.';
    if (Q.owns(id) && !Q.isBroken(id)) return 'Você já tem este item.';
    const price = Q.price(it);
    if (!SL.Econ.spend(price, 'equipamentos', it.name)) return 'Dinheiro insuficiente.';
    if (mode === 'entrega') {
      const at = (SL.Clock.day() + 1) * 1440 + 10 * 60 + U.ri(0, 180);
      G().equip.deliveries.push({ id, at, kind: 'equip' });
      if (SL.Calendar) SL.Calendar.add({ day: SL.Clock.day(at), kind: 'entrega', title: 'Entrega: ' + it.name });
      SL.notify({ cat: 'dinheiro', icon: 'shop', title: 'Pedido confirmado', text: it.name + ' chega quando você acordar.' });
    } else Q.receive(id);
    return null;
  };
  Q.receive = id => {
    const it = D.equipById(id); const G0 = G();
    G0.equip.owned[id] = { cond: 100, t: G0.time.t }; delete G0.equip.broken[id];
    const cur = G0.equip.setup[it.slot];
    const curIt = cur ? D.equipById(cur) : null;
    if (!curIt || (it.tier || 0) >= (curIt.tier || 0) || Q.isBroken(cur)) G0.equip.setup[it.slot] = id;
    G0.flags.lastUpgrade = G0.time.t; G0.flags.lastUpgradeSlot = it.slot;
    SL.bus.emit('equip');
    SL.notify({ cat: 'vida', icon: (D.equipSlots.find(s => s.id === it.slot) || {}).icon || 'shop', title: 'Novo equipamento instalado', text: it.name + ' já está no seu setup.' });
  };
  Q.use = id => { const it = D.equipById(id); if (!it || !Q.owns(id)) return; G().equip.setup[it.slot] = id; SL.bus.emit('equip'); };
  Q.sell = id => {
    const it = D.equipById(id); const G0 = G(); if (!it || !G0.equip.owned[id] || it.price === 0) return false;
    const v = Math.round(it.price * 0.4 * (G0.equip.owned[id].cond / 100) * (Q.isBroken(id) ? 0.3 : 1));
    delete G0.equip.owned[id]; delete G0.equip.broken[id];
    if (G0.equip.setup[it.slot] === id) {
      const alt = Object.keys(G0.equip.owned).map(D.equipById).filter(x => x && x.slot === it.slot && !Q.isBroken(x.id)).sort((a, b) => b.tier - a.tier)[0];
      G0.equip.setup[it.slot] = alt ? alt.id : null;
    }
    SL.Econ.add(v, 'venda', 'Venda de ' + it.name + ' (usado)');
    SL.bus.emit('equip'); return v;
  };
  Q.repairCost = id => { const it = D.equipById(id); return Math.max(60, Math.round(it.price * 0.22)); };
  Q.repair = (id, discount) => {
    const it = D.equipById(id); if (!it || !Q.isBroken(id)) return 'Nada para consertar.';
    const c = Math.round(Q.repairCost(id) * (discount || 1));
    if (!SL.Econ.spend(c, 'manutencao', 'Conserto: ' + it.name)) return 'Dinheiro insuficiente.';
    delete G().equip.broken[id]; G().equip.owned[id].cond = 85; SL.bus.emit('equip'); return null;
  };
  Q.setNet = id => {
    G().equip.net = id; SL.bus.emit('equip');
    SL.notify({ cat: 'vida', icon: 'wifi', title: 'Plano de internet alterado', text: D.internet.find(n => n.id === id).name + ' a partir de agora. A cobrança muda na próxima conta.' });
  };
  Q.buySoft = id => {
    const s = D.software.find(x => x.id === id); if (!s) return 'Não encontrado.';
    if (G().equip.soft[id]) { delete G().equip.soft[id]; SL.bus.emit('equip'); return null; } // cancela
    if (!SL.Econ.spend(s.price, 'software', s.name)) return 'Dinheiro insuficiente.';
    G().equip.soft[id] = SL.Clock.day(); SL.bus.emit('equip'); return null;
  };
  Q.buyVehicle = id => {
    const v = D.vehicles.find(x => x.id === id); if (!v || G().equip.vehicles.includes(id)) return 'Indisponível.';
    if (!SL.Econ.spend(v.price, 'transporte', v.name)) return 'Dinheiro insuficiente.';
    G().equip.vehicles.push(id); SL.bus.emit('equip'); return null;
  };

  // uso e quebra (por dia)
  Q.entregar = () => {
    const G0 = G(); if (!G0) return;
    const del = G0.equip.deliveries;
    for (let i = del.length - 1; i >= 0; i--) if (del[i].at <= G0.time.t) {
      const d = del.splice(i, 1)[0];
      if (d.kind === 'equip') Q.receive(d.id); else if (d.kind === 'furn') H.receive(d.id); else if (d.kind === 'food' && SL.Rel) SL.Rel.deliveryArrived(d);
    }
  };
  SL.bus.on('tick:minute', () => {
    const G0 = G(); if (!G0) return;
    Q.entregar();
    if (G0.act && G0.act.id === 'live') G0.flags.useToday = (G0.flags.useToday || 0) + 1.4;
    else if (G0.act && SL.Life.ACT[G0.act.id] && SL.Life.ACT[G0.act.id].pc) G0.flags.useToday = (G0.flags.useToday || 0) + 1;
  });
  SL.bus.on('tick:day', () => {
    const G0 = G(); if (!G0) return;
    const hours = (G0.flags.useToday || 0) / 60; G0.flags.useToday = 0;
    if (hours < 0.3) return;
    for (const slot in G0.equip.setup) {
      const id = G0.equip.setup[slot]; if (!id || Q.isBroken(id)) continue;
      const it = D.equipById(id); const o = G0.equip.owned[id]; if (!o) continue;
      o.cond = U.clamp(o.cond - hours * 0.05, 20, 100);
      const p = (1 - it.rel) * (hours / 5) * (1.6 - o.cond / 100);
      if (U.chance(p)) {
        G0.equip.broken[id] = SL.Clock.day();
        SL.bus.emit('equip');
        if (SL.Events) SL.Events.equipBroken(it);
      }
    }
  });

  // ---------- casa ----------
  H.home = () => D.homeById(G().home.id);
  H.decoMax = () => H.home().deco + (G().home.studio ? 4 : 0);
  H.buyFurniture = (id, mode) => {
    const f = D.furnById(id); if (!f) return 'Item não encontrado.';
    const G0 = G();
    if (f.slot === 'deco' && G0.home.deco.length >= H.decoMax()) return 'Não há mais espaço para decoração nesta casa.';
    if (f.slot !== 'deco' && G0.home.items[f.slot] === id) return 'Você já tem este item.';
    if (!SL.Econ.spend(Q.price(f), 'casa', f.name)) return 'Dinheiro insuficiente.';
    if (mode === 'entrega') {
      G0.equip.deliveries.push({ id, at: (SL.Clock.day() + 1) * 1440 + 9 * 60 + U.ri(0, 240), kind: 'furn' });
      SL.notify({ cat: 'dinheiro', icon: 'shop', title: 'Compra confirmada', text: f.name + ' chega quando você acordar.' });
    } else H.receive(id);
    return null;
  };
  H.receive = id => {
    const f = D.furnById(id); const G0 = G();
    if (f.slot === 'deco') { if (G0.home.deco.length < H.decoMax()) G0.home.deco.push(id); if (id === 'planta' && G0.home.plants.last == null) G0.home.plants.last = SL.Clock.day(); }
    else G0.home.items[f.slot] = id;
    SL.bus.emit('home');
    SL.notify({ cat: 'vida', icon: 'home', title: 'Chegou: ' + f.name, text: 'Já está no lugar.' });
  };
  H.removeDeco = idx => { const G0 = G(); const id = G0.home.deco[idx]; if (!id) return; G0.home.deco.splice(idx, 1); const f = D.furnById(id); SL.Econ.add(Math.round(f.price * 0.25), 'venda', 'Venda de ' + f.name); SL.bus.emit('home'); };

  H.moveTo = (homeId, buy) => {
    const G0 = G(); const h = D.homeById(homeId); if (!h) return 'Casa inválida.';
    if (G0.home.id === homeId && (!buy || G0.home.owned)) return 'Você já mora aqui.';
    const moveCost = 900;
    if (buy) {
      if (!SL.Econ.spend(h.price, 'aluguel', 'Compra: ' + h.name)) return 'Dinheiro insuficiente para comprar à vista.';
    } else {
      const deposit = h.rent * 2 + moveCost;
      if (!SL.Econ.spend(deposit, 'aluguel', 'Caução e mudança: ' + h.name)) return 'Precisa de ' + U.money(deposit) + ' (caução de 2 aluguéis + mudança).';
    }
    // contas de aluguel antigas em aberto continuam (dívida)
    G0.home.id = homeId; G0.home.owned = !!buy; G0.home.studio = false;
    if (G0.home.deco.length > H.decoMax()) G0.home.deco.length = H.decoMax();
    G0.loc = { area: 'casa', tx: 3, ty: 3, place: null, dir: 1 };
    SL.bus.emit('home'); SL.bus.emit('loc');
    if (SL.Goals) SL.Goals.check();
    SL.notify({ cat: 'vida', icon: 'home', title: buy ? 'Casa própria!' : 'Mudança feita', text: 'Agora você mora em: ' + h.name + ' (' + h.district + ').' });
    return null;
  };
  H.buildStudio = () => {
    const G0 = G(); if (G0.home.id !== 'casa') return 'Só a casa do Alto da Colina tem espaço para estúdio.';
    if (G0.home.studio) return 'O estúdio já está pronto.';
    if (!SL.Econ.spend(D.STUDIO_COST, 'casa', 'Obra do estúdio')) return 'Dinheiro insuficiente.';
    G0.home.studio = true; SL.bus.emit('home');
    if (SL.Rep) SL.Rep.mod({ profissional: 5 });
    SL.notify({ cat: 'carreira', icon: 'sparkle', title: 'Estúdio construído', text: 'Isolamento acústico, cenário profissional e espaço para gravar.' });
    return null;
  };
  H.evict = bill => {
    const G0 = G();
    bill.paid = true; bill.name += ' (perdoado no despejo)';
    G0.home.id = 'mae'; G0.home.owned = false; G0.home.studio = false;
    if (G0.home.deco.length > H.decoMax()) G0.home.deco.length = H.decoMax();
    G0.loc = { area: 'casa', tx: 3, ty: 3, place: null, dir: 1 };
    if (SL.Rep) SL.Rep.mod({ imagem: -3, credibilidade: -6 });
    SL.Life.mod({ humor: -25, estresse: 25 });
    SL.bus.emit('home'); SL.bus.emit('loc');
    SL.notify({ cat: 'vida', icon: 'home', title: 'Despejo', text: 'Você não pagou o aluguel e voltou a morar com sua mãe. Recomece com calma.' });
    if (SL.Social) SL.Social.newsAboutPlayer('bad');
  };
})(window.SL);

/* Relacionamentos: amizades, família, romance opcional, criadores, equipe contratada.
   Cada pessoa lembra das interações; convites viram compromissos no calendário; faltar tem consequência. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const R = SL.Rel = {};
  const G = () => SL.G;

  R.def = id => D.npcById(id) || D.creatorById(id);
  R.get = id => G().rel[id];
  R.name = id => { const d = R.def(id); return d ? (d.short || d.name) : id; };
  R.STAGES = { desconhecido: 'Desconhecido(a)', conhecido: 'Conhecido(a)', amigo: 'Amizade', melhor_amigo: 'Melhor amizade', interesse: 'Clima de romance', namorando: 'Namorando', rival: 'Rivalidade', ex: 'Ex', familia: 'Família', profissional: 'Profissional' };
  const PREF = {
    carinhosa: { vida: 1.3, trabalho: 1.1, elogio: 1.2, piada: 0.9 }, animada: { piada: 1.3, chat: 1.2 }, nerd: { trabalho: 1.3, piada: 1.1, elogio: 0.9 },
    tranquila: { vida: 1.3, conselho: 1.2, piada: 0.85 }, aventureiro: { chat: 1.2, vida: 1.2 }, energética: { piada: 1.1, chat: 1.2, elogio: 1.1 },
    estudiosa: { conselho: 1.2, vida: 1.2, piada: 0.8 }, carismático: { piada: 1.3, elogio: 1.1, flerte: 1.1 }, criativa: { vida: 1.2, trabalho: 1.1 },
    reservado: { chat: 0.8, vida: 1.1, trabalho: 1.3, piada: 0.8 }, direta: { conselho: 1.2, elogio: 0.8 },
  };
  R.ACTIONS = [
    { id: 'chat', label: 'Bater papo', icon: 'chat' }, { id: 'vida', label: 'Perguntar da vida', icon: 'heart' },
    { id: 'trabalho', label: 'Falar do seu canal', icon: 'live' }, { id: 'elogio', label: 'Fazer um elogio', icon: 'star' },
    { id: 'piada', label: 'Contar uma piada', icon: 'joke' }, { id: 'conselho', label: 'Pedir um conselho', icon: 'book' },
    { id: 'flerte', label: 'Flertar', icon: 'heart', romance: true }, { id: 'desculpa', label: 'Pedir desculpas', icon: 'hand', conflict: true },
    { id: 'presente', label: 'Dar um presente', icon: 'gift', gift: true },
  ];

  R.prefAllows = def => {
    const p = G().player.pref; if (!def || !def.romance || p === 'nenhum') return false;
    if (p === 'todos') return true; if (p === 'homens') return def.gender === 'm'; if (p === 'mulheres') return def.gender === 'f';
    return false;
  };
  R.partner = () => { const r = G().rel; for (const id in r) if (r[id].stage === 'namorando') return id; return null; };
  const remember = (r, a, o, text) => { r.hist.push({ t: G().time.t, a, o }); if (r.hist.length > 30) r.hist.shift(); if (text) { r.memo.push({ d: SL.Clock.day(), x: text }); if (r.memo.length > 8) r.memo.shift(); } };
  const updateStage = (id) => {
    const r = R.get(id); const def = R.def(id); const before = r.stage;
    if (r.stage === 'familia' || r.stage === 'ex') return;
    if (r.aff <= -30) r.stage = 'rival';
    else if (r.stage === 'namorando') return;
    else if (r.rom >= 30 && R.prefAllows(def)) r.stage = 'interesse';
    else if (r.aff >= 75 && r.trust >= 70) r.stage = 'melhor_amigo';
    else if (r.aff >= 35 && r.trust >= 35) r.stage = 'amigo';
    else if (r.met) r.stage = (def && def.role === 'editor') || (def && def.role === 'moderador') || (def && def.role === 'empresario') ? (r.aff > 30 ? 'amigo' : 'profissional') : 'conhecido';
    if (before !== r.stage && ['amigo', 'melhor_amigo', 'interesse', 'rival'].includes(r.stage)) {
      SL.notify({ cat: 'pessoas', icon: r.stage === 'rival' ? 'alert' : 'heart', title: R.name(id) + ': ' + R.STAGES[r.stage], text: r.stage === 'rival' ? 'A relação azedou.' : 'A relação de vocês mudou.' });
    }
  };
  R.updateStage = updateStage;

  // conversa (pessoalmente ou por mensagem). Retorna { line, outcome, deltas }
  R.interact = (id, action, via) => {
    const G0 = G(); const r = R.get(id); const def = R.def(id); if (!r || !def) return null;
    const A = R.ACTIONS.find(x => x.id === action); if (!A) return null;
    if (A.romance && !R.prefAllows(def)) return { line: 'Isso não combina com a relação de vocês.', outcome: 'bad' };
    if (A.gift && !(G0.flags.gifts > 0)) return { line: 'Você não tem um presente. Compre no Shopping Aurora.', outcome: 'none' };
    if (A.conflict && !r.flags.conflict) return { line: 'Não há nada para se desculpar agora.', outcome: 'none' };
    const pref = (PREF[def.pers] || {})[action] || 1;
    const recent = r.hist.filter(h => h.a === action && G0.time.t - h.t < 2 * 1440).length;
    let p = 0.45 + r.aff / 220 + (pref - 1) * 0.8 - recent * 0.22 + SL.Life.charisma() / 260;
    if (G0.needs.higiene < 25 && via !== 'msg') p -= 0.15;
    if (r.flags.conflict && action !== 'desculpa') p -= 0.25;
    if (action === 'trabalho' && SL.Social.totalFollowers() > 1000) p += 0.1;
    if (action === 'flerte') p = 0.25 + r.aff / 180 + r.rom / 200 + SL.Life.charisma() / 300 - recent * 0.3 + (r.stage === 'interesse' ? 0.15 : 0);
    if (action === 'presente') p = 0.75;
    if (via === 'msg') p -= 0.05;
    const roll = U.rand();
    const outcome = roll < U.clamp(p, 0.05, 0.95) ? 'good' : roll < U.clamp(p + 0.3, 0.1, 0.98) ? 'ok' : 'bad';
    const d = { aff: 0, trust: 0, rom: 0 };
    if (outcome === 'good') { d.aff = U.rf(3.5, 7) * pref; d.trust = 1.2; }
    else if (outcome === 'ok') d.aff = 1;
    else { d.aff = -3; d.trust = -1; }
    if (action === 'vida' && outcome === 'good') d.trust += 2;
    if (action === 'conselho' && outcome === 'good') { d.trust += 2; SL.Life.mod({ estresse: -6 }); }
    if (action === 'flerte') { if (outcome === 'good') d.rom = U.rf(6, 11); else if (outcome === 'bad') { d.aff = -6; d.rom = -5; } }
    if (action === 'desculpa') { if (outcome !== 'bad') { r.flags.conflict = 0; d.trust = 6; d.aff = 4; remember(r, action, outcome, 'vocês fizeram as pazes'); } }
    if (action === 'presente') { G0.flags.gifts--; d.aff = 8; d.trust = 2; if (r.stage === 'interesse' || r.stage === 'namorando') d.rom = 5; }
    r.aff = U.clamp(r.aff + d.aff, -100, 100); r.trust = U.clamp(r.trust + d.trust, 0, 100); r.rom = U.clamp(r.rom + d.rom, 0, 100);
    r.met = true; r.last = G0.time.t;
    remember(r, action, outcome);
    updateStage(id);
    SL.Life.mod({ humor: outcome === 'good' ? 2.5 : outcome === 'bad' ? -1.5 : 0.5 });
    SL.Life.skillUp('carisma', 0.06);
    const pool = D.T.dialog[action][outcome] || D.T.dialog.chat.ok;
    let line = U.pick(pool);
    if (line.includes('{x}')) line = line.replace('{x}', U.pick(D.T.lifeBits[def.pers] || D.T.lifeBits.default));
    line = SL.Chat.fill(line, null, {});
    SL.bus.emit('rel', id);
    return { line, outcome, d };
  };

  R.canAskOut = id => { const r = R.get(id); return r && r.stage === 'interesse' && r.rom >= 65 && r.trust >= 50 && !R.partner(); };
  R.askOut = id => {
    const r = R.get(id); if (!R.canAskOut(id)) return { ok: false, line: 'Ainda é cedo para isso.' };
    const ok = U.chance(U.clamp(0.4 + (r.rom - 65) / 50 + (r.trust - 50) / 100, 0.2, 0.95));
    if (ok) { r.stage = 'namorando'; r.flags.lastTogether = G().time.t; remember(r, 'pedido', 'good', 'começaram a namorar'); SL.notify({ cat: 'pessoas', icon: 'heart', title: 'Vocês estão namorando!', text: R.name(id) + ' aceitou. Lembre de dar atenção.' }); SL.Life.mod({ humor: 25, estresse: -10 }); }
    else { r.rom -= 15; r.aff -= 3; remember(r, 'pedido', 'bad', 'pediu em namoro e ouviu um "ainda não"'); }
    SL.bus.emit('rel', id);
    return { ok, line: ok ? 'Sim! Eu tava esperando você perguntar.' : 'Eu gosto de você, mas preciso de mais tempo.' };
  };
  R.breakUp = id => { const r = R.get(id); if (r.stage !== 'namorando') return; r.stage = 'ex'; r.aff -= 25; r.rom = 10; remember(r, 'fim', 'bad', 'terminaram'); SL.Life.mod({ humor: -20, estresse: 12 }); SL.bus.emit('rel', id); };

  // quem está em um lugar agora (pelos horários de cada pessoa)
  // sem relógio: quem frequenta o lugar pode estar lá (sorteado pelo dia, para não mudar a cada clique)
  R.PRAZO = 3 * 1440;   // um combinado vale por uns 3 dias do jogo
  const planOk = p => p && !p.done && G().time.t <= p.t + R.PRAZO;
  R.presentAt = placeId => {
    const day = SL.Clock.day(); const out = [];
    D.npcs.forEach((n, i) => {
      (n.places || []).forEach(pl => { if (pl.p === placeId && ((day * 7 + i * 3 + pl.d.length) % 10) < 3 + pl.d.length) out.push(n.id); });
      const plan = R.get(n.id) && R.get(n.id).plan;
      if (planOk(plan) && plan.place === placeId && !out.includes(n.id)) out.push(n.id);
    });
    return [...new Set(out)];
  };
  R.passiveMeet = placeId => {
    const ids = R.presentAt(placeId).filter(id => !R.get(id).met);
    if (ids.length && U.chance(0.5)) { const id = U.pick(ids); R.get(id).met = true; R.get(id).stage = 'conhecido'; remember(R.get(id), 'conheceu', 'ok', 'se conheceram em ' + D.placeById(placeId).name); SL.notify({ cat: 'pessoas', icon: 'users', title: 'Você conheceu ' + R.def(id).name, text: R.def(id).job + '. Puxe papo da próxima vez.' }); }
  };
  R.meet = id => { const r = R.get(id); if (!r.met) { r.met = true; if (r.stage === 'desconhecido') r.stage = 'conhecido'; remember(r, 'conheceu', 'ok', 'se conheceram'); SL.bus.emit('rel', id); } };

  // ---------- convites e compromissos ----------
  R.INVITES = {
    cafe: { label: 'Tomar um café', place: 'cafeteria', cost: 30, dur: 60 },
    jantar: { label: 'Jantar', place: 'restaurante', cost: 140, dur: 100 },
    parque: { label: 'Passear no parque', place: 'parque', cost: 0, dur: 80 },
    jogar: { label: 'Jogar online juntos', place: 'pc', cost: 0, dur: 120 },
    visita: { label: 'Visitar a casa', place: 'amigos', cost: 0, dur: 120 },
  };
  R.invite = (id, kind) => {
    const r = R.get(id); const def = R.def(id); const I = R.INVITES[kind]; if (!r || !I) return { ok: false, line: '...' };
    if (kind === 'visita' && !['duda', 'rafa'].includes(id)) return { ok: false, line: 'Melhor combinar em outro lugar.' };
    const romantic = (kind === 'jantar' || kind === 'parque' || kind === 'cafe') && (r.stage === 'interesse' || r.stage === 'namorando');
    let p = 0.3 + r.aff / 120 + (r.flags.conflict ? -0.3 : 0) + (romantic ? 0.15 : 0);
    if (r.flags.noShow && G().time.t - r.flags.noShow < 7 * 1440) p -= 0.35;
    if (!U.chance(U.clamp(p, 0.05, 0.95))) { remember(r, 'convite', 'bad'); return { ok: false, line: U.pick(['Essa semana tá corrida, fica pra próxima.', 'Hmm, não vai dar. Desculpa!', 'Agora não consigo.']) }; }
    const place = kind === 'visita' ? (id === 'rafa' ? 'rafa' : 'amigos') : I.place;
    r.plan = { kind, place, t: G().time.t, romantic };
    remember(r, 'convite', 'good');
    SL.bus.emit('rel', id);
    return { ok: true, line: U.pick(['Bora! Combinado.', 'Fechou, tô dentro!', 'Ótima ideia!']) + ' ' + (place === 'pc' ? 'É só me chamar quando ligar o PC.' : 'Te encontro lá: vá quando puder.') };
  };
  R.planHere = placeId => {
    const out = [];
    for (const id in G().rel) { const r = G().rel[id]; if (planOk(r.plan) && r.plan.place === placeId) out.push(id); }
    return out;
  };
  R.startPlan = id => {
    const r = R.get(id); if (!r || !r.plan) return 'Nada combinado.';
    const I = R.INVITES[r.plan.kind];
    if (I.cost && !SL.Econ.spend(I.cost, 'lazer', I.label + ' com ' + R.name(id))) return 'Dinheiro insuficiente (' + U.money(I.cost) + ').';
    r.plan.done = true;
    if (SL.Calendar) SL.Calendar.removeRef('plan_' + id);
    const act = r.plan.kind === 'visita' ? 'visita' : r.plan.kind === 'jogar' ? 'colab' : 'encontro';
    return SL.Life.start(act, { npc: id, kind: r.plan.kind, romantic: r.plan.romantic, dur: I.dur }, { label: I.label + ' com ' + R.name(id) });
  };
  const endTogether = (data, ok, bonus) => {
    const r = R.get(data.npc); if (!r) return;
    const n = G().needs;
    let q = 0.55 + SL.Life.charisma() / 250 + (n.higiene > 50 ? 0.08 : -0.15) + (n.humor - 50) / 300 + (bonus || 0);
    if (!ok) q -= 0.25;
    const good = U.chance(U.clamp(q, 0.1, 0.95));
    r.aff = U.clamp(r.aff + (good ? 8 : 2), -100, 100); r.trust = U.clamp(r.trust + (good ? 4 : 1), 0, 100);
    if (data.romantic && R.prefAllows(R.def(data.npc))) r.rom = U.clamp(r.rom + (good ? 12 : 3), 0, 100);
    r.last = G().time.t; r.flags.lastTogether = G().time.t; r.plan = null;
    remember(r, data.kind || 'encontro', good ? 'good' : 'ok', good ? 'tiveram um ótimo momento juntos (' + (R.INVITES[data.kind] || { label: 'encontro' }).label.toLowerCase() + ')' : null);
    updateStage(data.npc);
    SL.notify({ cat: 'pessoas', icon: 'heart', title: good ? 'Foi ótimo!' : 'Foi legal', text: R.name(data.npc) + (good ? ' adorou o tempo com você.' : ' gostou, mas faltou alguma coisa.') });
    SL.bus.emit('rel', data.npc);
  };
  R.dateEnd = (data, ok) => endTogether(data, ok);
  R.visitEnd = (data, ok) => endTogether(data, ok, 0.1);
  R.playTogetherEnd = (data, ok) => { endTogether(data, ok, 0.05); SL.Life.skillUp('jogo', 0.6); };

  // ---------- criadores ----------
  R.touchCreator = (id, amount, why) => {
    const r = R.get(id); if (!r) return;
    r.aff = U.clamp(r.aff + amount * (r.met ? 1 : 0.5), -100, 100);
    const st = SL.Creators.state(id);
    if (amount > 0 && U.chance(0.08) && st) { st.knowsPlayer = true; if (!r.met) { r.met = true; r.stage = 'conhecido'; SL.notify({ cat: 'social', icon: 'connect', title: R.def(id).name + ' notou você', text: 'Seguiu você de volta depois do seu ' + why + '.' }); G().ch.connect.f++; } }
    r.last = G().time.t; updateStage(id);
  };
  R.creatorOpinion = (id, delta, polemic) => {
    const r = R.get(id); if (!r) return;
    r.aff = U.clamp(r.aff + delta * 0.6, -100, 100);
    if (polemic) { remember(r, 'critica', 'bad', 'você criticou ' + R.def(id).name + ' ao vivo'); if (SL.Events) SL.Events.livePolemic(id); }
    updateStage(id);
  };
  R.viewerCollabOffer = v => {
    SL.Social.dm('vc_' + v.id, 'Oi! Sou o(a) ' + v.u + ' do canal ' + v.cr.h + ' (' + U.int(v.cr.f) + ' seguidores). Bora gravar uma collab?', [{ id: 'vc_sim', label: 'Topar gravar agora (2h no PC)' }, { id: 'vc_nao', label: 'Agradecer e recusar' }], { name: '@' + v.u + ' (criador)', data: { vid: v.id } });
  };

  // ---------- equipe ----------
  R.hire = id => {
    const def = D.npcById(id); const G0 = G(); if (!def || G0.staff.some(s => s.npc === id)) return 'Já contratado(a).';
    if (def.role === 'empresario' && G0.staff.some(s => D.npcById(s.npc).role === 'empresario')) return 'Você já tem um empresário.';
    const need = def.role === 'empresario' ? 2000 : 0;
    if (SL.Social.totalFollowers() < need) return 'Precisa de pelo menos ' + U.int(need) + ' seguidores para ' + def.short + ' aceitar.';
    if (def.salary && G0.money < def.salary) return 'Precisa ter pelo menos um salário em caixa (' + U.money(def.salary) + ').';
    G0.staff.push({ npc: id, since: SL.Clock.day() });
    if (def.salary) SL.Econ.addBill('equipe', 'Salário de ' + def.short + ' (proporcional)', Math.round(def.salary * 0.5), SL.Clock.day() + 3, 'equipe', id);
    const r = R.get(id); r.met = true; r.stage = 'profissional'; r.aff = Math.max(r.aff, 15);
    SL.notify({ cat: 'carreira', icon: 'team', title: def.name + ' entrou para a equipe', text: def.job + (def.salary ? ' · ' + U.money(def.salary) + '/mês' : ' · ' + Math.round(def.cut * 100) + '% dos patrocínios') });
    SL.bus.emit('staff'); if (SL.Goals) SL.Goals.check();
    return null;
  };
  R.fire = id => { const G0 = G(); G0.staff = G0.staff.filter(s => s.npc !== id); const r = R.get(id); if (r) { r.aff -= 10; remember(r, 'demissao', 'bad', 'foi demitido(a)'); } G0.edits.forEach(e => { if (e.editor === id) e.editor = 'eu'; }); SL.bus.emit('staff'); };
  R.staffOf = role => G().staff.map(s => D.npcById(s.npc)).filter(n => n && n.role === role);
  R.manager = () => R.staffOf('empresario')[0] || null;

  // ---------- comida por aplicativo ----------
  R.orderFood = id => {
    const it = D.delivery.find(x => x.id === id); if (!it) return 'Item inválido.';
    if (G().loc.area !== 'casa') return 'O entregador só leva na sua casa.';
    if (!SL.Econ.spend(it.price + 6, 'comida', 'Pedido no iFood: ' + it.name)) return 'Dinheiro insuficiente.';
    R.deliveryArrived({ id, kind: 'food' });   // sem relógio: o entregador chega na hora
    return null;
  };
  R.deliveryArrived = d => {
    const it = D.delivery.find(x => x.id === d.id); if (!it) return;
    G().flags.mealReady = d.id;
    SL.notify({ cat: 'vida', icon: 'food', title: 'Seu pedido chegou', text: it.name + ' está na mesa. Coma antes que esfrie.', sound: 'msg' });
    SL.bus.emit('food');
  };
  R.eatDelivery = () => {
    const id = G().flags.mealReady; const it = D.delivery.find(x => x.id === id); if (!it) return 'Nenhum pedido esperando.';
    G().flags.mealReady = null;
    SL.Life.alimenta(it.eat); if (it.leftovers) SL.Life.addFood(it.leftovers, 1);
    G().home.dirt = U.clamp(G().home.dirt + 2, 0, 100);
    return null;
  };

  // ---------- respostas em mensagens diretas ----------
  R.onDmOption = (threadId, msgId, optId) => {
    const G0 = G(); const th = G0.dms[threadId]; if (!th) return;
    const m = th.msgs.find(x => x.id === msgId); if (!m || m.done) return;
    const opt = (m.opts || []).find(o => o.id === optId); if (!opt) return;
    m.done = true; m.chosen = optId;
    SL.Social.me(threadId, opt.label.replace(/\s*\(.*\)$/, ''));
    const reply = (text, opts, data) => setTimeout(() => { SL.Social.dm(threadId, text, opts, { data, silent: true }); }, 400);
    const id = threadId;
    switch (optId) {
      case 'fan_obrigado': { const v = SL.Viewers.byId(m.data.vid); if (v) { v.loy = U.clamp(v.loy + 8, 0, 100); SL.Viewers.note(v, 'dm'); } reply('Aaaah você respondeu!! Ganhei o dia.'); break; }
      case 'fan_curto': { const v = SL.Viewers.byId(m.data.vid); if (v) v.loy = U.clamp(v.loy + 3, 0, 100); break; }
      case 'fan_ignorar': { const v = SL.Viewers.byId(m.data.vid); if (v) v.loy = U.clamp(v.loy - 1, 0, 100); break; }
      case 'cr_agradece': { R.touchCreator(id, 6, 'resposta'); R.get(id).met = true; reply('Imagina! Qualquer coisa chama. Quem sabe uma collab um dia.'); break; }
      case 'cr_seco': R.touchCreator(id, 1, 'resposta'); break;
      case 'collab_sim': {
        const r = R.get(id); r.flags.collabPending = 0;
        r.plan = { kind: 'collab', place: 'pc', t: G0.time.t };
        R.touchCreator(id, 5, 'collab');
        reply('Fechado! Na sua próxima live a gente faz junto. Vou avisar meu público também.');
        break;
      }
      case 'collab_depois': { const r = R.get(id); r.flags.collabPending = 0; R.touchCreator(id, 1, 'resposta'); reply('Tranquilo, quando der me chama!'); break; }
      case 'collab_nao': { const r = R.get(id); r.flags.collabPending = 0; R.touchCreator(id, -4, 'recusa'); reply('Ok, sem problemas.'); break; }
      case 'vc_sim': {
        const v = SL.Viewers.byId(m.data.vid);
        if (G0.loc.area !== 'casa') { reply('Me chama quando estiver no PC!'); m.done = false; break; }
        SL.Life.start('gravar', { kind: 'colab', game: v ? v.fg : 'conversa', minutes: 120, sim: SL.GameSim.make(v ? v.fg : 'conversa'), moments: [], q: 0, n: 0 }, { label: 'Gravando collab com @' + (v ? v.u : 'criador') });
        if (v) { v.loy = U.clamp(v.loy + 15, 0, 100); G0.ch.pulso.f += Math.round(v.cr.f * 0.04); G0.ch.vision.f += Math.round(v.cr.f * 0.02); }
        reply('Bora! Entrando na chamada.');
        break;
      }
      case 'vc_nao': reply('De boa, valeu mesmo assim!'); break;
      case 'mae_ligar': { const r = R.get('mae'); r.aff = U.clamp(r.aff + 5, -100, 100); r.last = G0.time.t; SL.Life.mod({ humor: 6, estresse: -5 }); reply('Que bom ouvir sua voz! Se cuida, viu?'); break; }
      case 'mae_dinheiro': {
        const r = R.get('mae'); const mk = SL.Clock.monthKey();
        if (G0.flags.maeHelp === mk) { reply('Filho(a), esse mês já ajudei. Tô apertada também.'); r.aff -= 2; break; }
        G0.flags.maeHelp = mk; const v = U.ri(3, 6) * 100; SL.Econ.add(v, 'familia', 'Ajuda da mãe'); r.trust -= 2;
        reply('Mandei ' + U.money(v) + '. Mas organiza essas contas, hein!'); break;
      }
      case 'mae_novidade': { const r = R.get('mae'); r.aff += 3; r.last = G0.time.t; reply(SL.Social.totalFollowers() > 500 ? 'Já tem ' + U.num(SL.Social.totalFollowers()) + ' pessoas te seguindo?! Vou contar pra todo mundo!' : 'Que orgulho! Continua assim.'); break; }
      case 'amigo_sim': { const res = R.invite(id, m.data.kind); if (!res.ok) { const r = R.get(id); r.plan = { kind: m.data.kind, place: m.data.place, t: G0.time.t, romantic: false }; } reply('Combinado então! Vá quando puder.'); break; }
      case 'amigo_nao': { const r = R.get(id); r.flags.declines = (r.flags.declines || 0) + 1; r.aff -= 2; if (r.flags.declines >= 3) { r.flags.conflict = 1; r.flags.declines = 0; reply('Você sempre tá ocupado(a) pra mim, né? Tudo bem.'); remember(r, 'conflito', 'bad', 'se sentiu deixado(a) de lado'); } else reply('Ah, tudo bem. Fica pra próxima.'); break; }
      case 'parceiro_sim': { const r = R.get(id); r.rom = U.clamp(r.rom + 3, 0, 100); reply('Te espero no restaurante! :)'); r.plan = { kind: 'jantar', place: 'restaurante', t: G0.time.t, romantic: true }; break; }
      case 'parceiro_nao': { const r = R.get(id); r.rom -= 4; r.aff -= 2; reply('Hm. Tá bom.'); break; }
      default: if (SL.Sponsors && optId.startsWith('of_')) SL.Sponsors.onDm(threadId, m, optId); else if (SL.Events && optId.startsWith('ev_')) SL.Events.onDm(threadId, m, optId);
    }
    SL.bus.emit('dm', th);
  };

  // ---------- ciclos ----------
  SL.bus.on('tick:hour', () => {
    const G0 = G(); if (!G0) return;
    for (const id in G0.rel) {
      const r = G0.rel[id]; const p = r.plan; if (!p || p.done) continue;
      if (p.kind === 'collab' && G0.time.t > p.t + R.PRAZO) { r.plan = null; r.aff -= 20; r.trust -= 15; remember(r, 'falta', 'bad', 'você faltou à collab combinada'); SL.Rep.mod({ profissional: -4 }); SL.Social.dm(id, 'Fiquei te esperando pra collab... avisei meu público e tudo.', null, {}); if (SL.Calendar) SL.Calendar.removeRef('plan_' + id); continue; }
      if (p.kind !== 'collab' && G0.time.t > p.t + R.PRAZO) {
        r.plan = null; r.aff -= 12; r.trust -= 15; r.flags.noShow = G0.time.t;
        remember(r, 'falta', 'bad', 'você não apareceu no encontro');
        SL.Social.dm(id, U.pick(['Fiquei te esperando... tá tudo bem?', 'Sério que você esqueceu?', 'Esperei quase uma hora. Poxa.']), null, {});
        if (SL.Calendar) SL.Calendar.removeRef('plan_' + id);
        updateStage(id);
      }
      if (p.kind !== 'collab' && G0.time.t - p.t > R.PRAZO - 1440 && !p.reminded) { p.reminded = 1; SL.notify({ cat: 'pessoas', icon: 'calendar', title: 'Não esqueça do combinado', text: (R.INVITES[p.kind] || { label: 'Encontro' }).label + ' com ' + R.name(id) + (p.place === 'pc' ? ' (no computador)' : ' em ' + (D.placeById(p.place) || { name: '' }).name) }); }
      if (p.kind === 'collab' && G0.time.t - p.t > R.PRAZO - 1440 && !p.reminded) { p.reminded = 1; SL.notify({ cat: 'canal', icon: 'users', title: 'Collab combinada', text: 'Abra o OBS no computador e comece a live com ' + R.name(id) + '.', app: 'pulso' }); }
    }
  });
  SL.bus.on('tick:day', day => {
    const G0 = G(); if (!G0) return; const t = G0.time.t;
    for (const id in G0.rel) {
      const r = G0.rel[id]; if (!r.met) continue;
      const since = (t - (r.last || 0)) / 1440;
      if ((r.stage === 'amigo' || r.stage === 'melhor_amigo') && since > 10) r.aff = U.clamp(r.aff - 0.6, -100, 100);
      if (r.stage === 'namorando') {
        const tg = (t - (r.flags.lastTogether || t)) / 1440;
        if (tg > 5 && U.chance(0.35)) SL.Social.dm(id, U.pick(D.T.npcMsgs.partner), [{ id: 'parceiro_sim', label: 'Marcar um jantar' }, { id: 'parceiro_nao', label: 'Hoje não dá' }]);
        if (tg > 10) { r.rom = U.clamp(r.rom - 2.5, 0, 100); if (!r.flags.conflict && U.chance(0.25)) { r.flags.conflict = 1; SL.Social.dm(id, 'A gente precisa conversar. Você só tem tempo pro canal.', null); remember(r, 'conflito', 'bad', 'reclamou da falta de atenção'); } }
        if (r.rom < 25 && U.chance(0.2)) { R.breakUp(id); SL.Social.dm(id, 'Acho melhor a gente terminar. Desculpa.', null); SL.notify({ cat: 'pessoas', icon: 'heart', title: 'Fim do namoro', text: R.name(id) + ' terminou com você.' }); }
      }
      updateStage(id);
    }
    // mensagens espontâneas
    if (U.chance(0.22)) SL.Social.dm('mae', U.pick(D.T.npcMsgs.mae), [{ id: 'mae_ligar', label: 'Ligar para ela (20 min)' }, { id: 'mae_novidade', label: 'Contar as novidades' }].concat(G0.money < 400 ? [{ id: 'mae_dinheiro', label: 'Pedir uma ajuda com as contas' }] : []));
    ['duda', 'rafa'].forEach(id => {
      const r = G0.rel[id]; if (!r || r.plan || !U.chance(0.12 + r.aff / 600)) return;
      const kind = id === 'rafa' ? U.pick(['jogar', 'visita']) : U.pick(['cafe', 'parque', 'visita']);
      const place = kind === 'visita' ? (id === 'rafa' ? 'rafa' : 'amigos') : R.INVITES[kind].place;
      SL.Social.dm(id, U.pick(D.T.npcMsgs[id]) + ' (' + R.INVITES[kind].label.toLowerCase() + '?)', [{ id: 'amigo_sim', label: 'Topar' }, { id: 'amigo_nao', label: 'Recusar' }], { data: { kind, place } });
    });
    const crush = Object.keys(G0.rel).find(id => G0.rel[id].stage === 'interesse' && !G0.rel[id].plan);
    if (crush && U.chance(0.2)) SL.Social.dm(crush, U.pick(D.T.npcMsgs.crush), null);
  });
})(window.SL);

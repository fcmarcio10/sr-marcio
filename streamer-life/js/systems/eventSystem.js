/* Acontecimentos, polêmicas e reputação. Os eventos dependem do histórico do personagem e pedem decisões com consequências. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const G = () => SL.G;

  // ---------- reputação ----------
  const Rep = SL.Rep = {};
  Rep.DIMS = [
    { k: 'imagem', label: 'Imagem pública', desc: 'Como o público em geral te vê.' },
    { k: 'confianca', label: 'Confiança do público', desc: 'Se seus fãs acreditam no que você fala e promete.' },
    { k: 'credibilidade', label: 'Credibilidade', desc: 'Como marcas e empresas te avaliam.' },
    { k: 'popularidade', label: 'Popularidade', desc: 'Quanto as pessoas falam de você.' },
    { k: 'profissional', label: 'Relações profissionais', desc: 'Sua fama entre criadores e o mercado.' },
  ];
  Rep.mod = d => { const r = G().rep; for (const k in d) if (k in r) r[k] = U.clamp(r[k] + d[k], 0, 100); SL.bus.emit('rep'); };
  Rep.avg = () => { const r = G().rep; return (r.imagem + r.confianca + r.credibilidade + r.profissional) / 4; };

  // ---------- eventos com decisão ----------
  const E = SL.Events = {};
  const DEF = E.DEF = {};
  E.trigger = (id, data) => {
    const def = DEF[id]; if (!def) return null;
    const G0 = G();
    const ev = { uid: U.uid('ev'), id, data: data || {}, t: G0.time.t, title: typeof def.title === 'function' ? def.title(data || {}) : def.title, text: typeof def.text === 'function' ? def.text(data || {}) : def.text, icon: def.icon || 'alert' };
    ev.choices = def.choices.filter(c => !c.cond || c.cond(ev.data)).map(c => ({ id: c.id, label: typeof c.label === 'function' ? c.label(ev.data) : c.label, desc: c.desc || '' }));
    G0.events.pending.push(ev);
    G0.events.cd[id] = G0.time.t;
    SL.bus.emit('event:pending', ev);
    if (SL.audio) SL.audio.play('notif');
    return ev;
  };
  E.choose = (uid, choiceId) => {
    const G0 = G(); const i = G0.events.pending.findIndex(e => e.uid === uid); if (i < 0) return null;
    const ev = G0.events.pending.splice(i, 1)[0];
    const c = DEF[ev.id].choices.find(x => x.id === choiceId) || DEF[ev.id].choices[0];
    let result = null; try { result = c.fn(ev.data); } catch (e) { console.error(e); }
    G0.events.log.push({ t: G0.time.t, id: ev.id, title: ev.title, choice: c.id, label: typeof c.label === 'function' ? c.label(ev.data) : c.label, result: result || '' });
    U.cap_list(G0.events.log, 80);
    SL.bus.emit('event:done', ev);
    return result;
  };
  const cool = (id, days) => { const t = G().events.cd[id]; return !t || G().time.t - t > days * 1440; };
  const polemic = days => { G().flags.polemicUntil = G().time.t + days * 1440; };

  DEF.corte_viraliza = {
    title: 'Um corte da sua live viralizou', icon: 'fire',
    text: d => 'Um fã postou no TikTok o momento "' + d.txt + '" e ele já passou de ' + U.num(d.views) + ' visualizações.',
    choices: [
      { id: 'repostar', label: 'Repostar oficialmente no seu TikTok', desc: 'Você aproveita a onda e leva o crédito.', fn: d => { const gain = Math.round(d.views * 0.004) + 20; G().ch.clipz.f += gain; G().ch.pulso.f += Math.round(gain * 0.3); Rep.mod({ popularidade: 2 }); return '+' + U.int(gain) + ' seguidores no TikTok.'; } },
      { id: 'agradecer', label: 'Agradecer o fã publicamente', desc: 'Seu público adora quando você valoriza a comunidade.', fn: d => { const gain = Math.round(d.views * 0.002) + 10; G().ch.connect.f += gain; G().ch.pulso.f += Math.round(gain * 0.4); Rep.mod({ confianca: 2, imagem: 1, popularidade: 1 }); return 'A comunidade ficou orgulhosa.'; } },
      { id: 'ignorar', label: 'Deixar rolar', desc: 'Sem esforço, menos retorno.', fn: d => { G().ch.pulso.f += Math.round(d.views * 0.0008); return 'Alguns seguidores chegaram mesmo assim.'; } },
    ],
  };
  DEF.post_criticada = {
    title: 'Sua publicação está sendo criticada', icon: 'alert',
    text: d => 'O post "' + d.text.slice(0, 80) + '" virou assunto e muita gente está discordando.',
    choices: [
      { id: 'desculpa', label: 'Pedir desculpas', desc: 'Diminui o estrago, mas parte do público acha fraco.', fn: () => { Rep.mod({ imagem: 2, confianca: 2, popularidade: -1 }); return 'A poeira baixou.'; } },
      { id: 'manter', label: 'Manter a opinião', desc: 'Mais atenção e seguidores fiéis, imagem pior com marcas.', fn: () => { Rep.mod({ popularidade: 4, imagem: -4, credibilidade: -3, profissional: -2 }); G().ch.connect.f += U.ri(30, 300); polemic(5); SL.Social.newsAboutPlayer('bad'); return 'Você virou assunto por dias.'; } },
      { id: 'apagar', label: 'Apagar o post', desc: 'Some do feed, mas já tiraram print.', fn: () => { Rep.mod({ imagem: -1, confianca: -2 }); return 'Os prints continuam circulando.'; } },
    ],
  };
  DEF.mal_interpretado = {
    title: 'Seu vídeo foi mal interpretado', icon: 'alert',
    text: d => 'Um trecho de "' + d.title + '" foi cortado fora de contexto e está circulando.',
    choices: [
      { id: 'video', label: 'Gravar vídeo explicando', desc: 'Resolve melhor, mas custa tempo e energia.', fn: () => { Rep.mod({ imagem: 3, confianca: 3 }); SL.Life.mod({ energia: -10, estresse: 6 }); return 'O vídeo de explicação foi bem recebido.'; } },
      { id: 'post', label: 'Postar um esclarecimento no Instagram', desc: 'Rápido, efeito médio.', fn: () => { Rep.mod({ imagem: 1, confianca: 1 }); return 'Parte do público entendeu.'; } },
      { id: 'ignorar', label: 'Ignorar', desc: 'Pode passar... ou crescer.', fn: () => { if (U.chance(0.5)) { Rep.mod({ imagem: -4, credibilidade: -2 }); polemic(4); SL.Social.newsAboutPlayer('bad'); return 'Cresceu. Agora todo mundo está comentando.'; } return 'Passou sem grandes estragos.'; } },
    ],
  };
  DEF.equip_quebra = {
    title: d => 'Seu ' + d.name.toLowerCase() + ' quebrou', icon: 'wrench',
    text: d => 'O ' + d.name + ' parou de funcionar. ' + (d.slot === 'computador' ? 'Sem computador não dá para fazer live, gravar nem editar.' : 'Sem ele a qualidade cai.'),
    choices: [
      { id: 'rafa', label: d => 'Pedir para o Rafa consertar (' + U.money(Math.round(SL.Equip.repairCost(d.id) * 0.5)) + ')', cond: () => SL.Rel.get('rafa').aff >= 30, desc: 'Amigo cobra metade.', fn: d => { const e = SL.Equip.repair(d.id, 0.5); if (e) return e; SL.Rel.get('rafa').aff += 2; SL.Rel.get('rafa').last = G().time.t; return 'O Rafa resolveu em uma tarde.'; } },
      { id: 'loja', label: d => 'Levar na assistência (' + U.money(SL.Equip.repairCost(d.id)) + ')', fn: d => SL.Equip.repair(d.id) || 'Consertado.' },
      { id: 'depois', label: 'Resolver depois', desc: 'Você pode consertar pela loja MegaByte.', fn: () => 'Fica para depois.' },
    ],
  };
  DEF.fake_news = {
    title: 'Notícia falsa sobre você', icon: 'alert',
    text: d => 'A página Fofoca Digital publicou: "' + d.text + '". É mentira, mas está espalhando.',
    choices: [
      { id: 'desmentir', label: 'Desmentir com provas', desc: 'Funciona se o público confia em você.', fn: () => { if (G().rep.confianca > 45) { Rep.mod({ imagem: 3, confianca: 2 }); return 'Desmentido aceito. A página teve que se retratar.'; } Rep.mod({ imagem: -1 }); return 'Pouca gente acreditou em você.'; } },
      { id: 'advogado', label: 'Contratar advogado (R$ 2.000)', desc: 'Caro, mas resolve.', fn: () => { if (!SL.Econ.spend(2000, 'outros', 'Advogado: notícia falsa')) return 'Sem dinheiro para o advogado.'; Rep.mod({ imagem: 3, popularidade: 1, credibilidade: 2 }); return 'A página apagou a notícia e pediu desculpas.'; } },
      { id: 'ignorar', label: 'Ignorar', fn: () => { Rep.mod({ imagem: -3, credibilidade: -1 }); return 'A notícia continuou rodando por um tempo.'; } },
    ],
  };
  DEF.critica_criador = {
    title: d => d.name + ' falou de você', icon: 'megaphone',
    text: d => d.name + ' (' + U.num(d.f) + ' seguidores) publicou um vídeo ' + (d.hard ? 'criticando você e o seu conteúdo.' : 'comentando o seu crescimento com ironia.'),
    choices: [
      { id: 'responder', label: 'Responder em vídeo', desc: 'Muita audiência, risco de briga longa.', fn: d => { Rep.mod({ popularidade: 5, imagem: -2, profissional: -2 }); SL.Rel.get(d.id).aff -= 20; G().ch.vision.f += U.ri(50, 500); polemic(6); SL.Social.news('gossip', { h: G().player.user, h2: D.creatorById(d.id).handle }); return 'A treta rendeu views e dor de cabeça.'; } },
      { id: 'classe', label: 'Responder com classe no Instagram', desc: 'Pega bem com marcas e com o público.', fn: d => { Rep.mod({ imagem: 3, profissional: 2, credibilidade: 1 }); SL.Rel.get(d.id).aff += 5; G().ch.connect.f += U.ri(20, 200); return 'Muita gente elogiou sua postura.'; } },
      { id: 'ignorar', label: 'Ignorar', fn: () => { Rep.mod({ popularidade: 1, imagem: -1 }); return 'O assunto morreu em alguns dias.'; } },
    ],
  };
  DEF.critica_ao_vivo = {
    title: d => 'Sua crítica a ' + d.name + ' repercutiu', icon: 'megaphone',
    text: d => 'Um corte em que você critica ' + d.name + ' está rodando. Os fãs dele(a) estão nos seus comentários.',
    choices: [
      { id: 'desculpa', label: 'Pedir desculpas a ' + 'quem foi criticado(a)', fn: d => { SL.Rel.get(d.id).aff += 15; Rep.mod({ imagem: 2, profissional: 3 }); return 'A pessoa aceitou as desculpas.'; } },
      { id: 'manter', label: 'Manter o que disse', fn: d => { Rep.mod({ popularidade: 3, imagem: -3, profissional: -3 }); polemic(4); SL.Rel.get(d.id).aff -= 10; return 'Treta instalada.'; } },
    ],
  };
  DEF.convite_expo = {
    title: d => 'Convite: ' + d.name, icon: 'flag',
    text: d => 'Você foi convidado(a) para o evento "' + d.name + '" no Centro de Eventos Expo Norte. ' + (d.fee ? 'Inscrição de ' + U.money(d.fee) + '.' : 'Entrada liberada para criadores.') + (d.cache ? ' Cachê de ' + U.money(d.cache) + ' para participar de um painel.' : ''),
    choices: [
      { id: 'sim', label: 'Confirmar presença', fn: d => { G().flags.expo = d; return 'Confirmado. Vá ao Centro de Eventos quando quiser.'; } },
      { id: 'nao', label: 'Recusar', fn: () => { Rep.mod({ profissional: -0.5 }); return 'Fica para a próxima.'; } },
    ],
  };
  DEF.seguidores_comprados = {
    title: 'Proposta tentadora', icon: 'coin',
    text: 'Uma conta te mandou: "10 mil seguidores na Twitch por R$ 199. Ninguém percebe, garantido."',
    choices: [
      { id: 'comprar', label: 'Comprar (R$ 199)', desc: 'Números maiores agora. Se descobrirem...', fn: () => { if (!SL.Econ.spend(199, 'outros', 'Pacote de seguidores')) return 'Sem dinheiro.'; G().ch.pulso.f += 10000; G().ch.pulso.fake = (G().ch.pulso.fake || 0) + 10000; return '10 mil seguidores apareceram do nada. Nenhum deles assiste.'; } },
      { id: 'recusar', label: 'Recusar e denunciar', fn: () => { Rep.mod({ credibilidade: 1 }); return 'Você bloqueou a conta.'; } },
    ],
  };
  DEF.vizinho = {
    title: 'O vizinho reclamou do barulho', icon: 'home',
    text: 'Bateram na porta: "Toda noite essa gritaria! Vou reclamar com o síndico."',
    choices: [
      { id: 'espuma', label: 'Prometer instalar espuma acústica', desc: 'Compre na loja Casa&Lar.', fn: () => { G().flags.neighborCalm = SL.Clock.day() + 14; return 'O vizinho deu um prazo.'; } },
      { id: 'desculpa', label: 'Pedir desculpas', fn: () => { SL.Life.mod({ estresse: 3 }); return 'Ele aceitou, mas está de olho.'; } },
      { id: 'ignorar', label: 'Ignorar', fn: () => { if (U.chance(0.5)) { SL.Econ.addBill('multa', 'Multa do condomínio (barulho)', 250, SL.Clock.day() + 10, 'aluguel'); return 'Chegou uma multa do condomínio.'; } return 'Nada aconteceu... por enquanto.'; } },
    ],
  };
  DEF.esgotamento = {
    title: 'Sinais de esgotamento', icon: 'stress',
    text: 'Você está há dias no limite: dorme mal, sem paciência e sem vontade de ligar a câmera.',
    choices: [
      { id: 'folga', label: 'Tirar o dia de folga e avisar o público', desc: 'Seus fãs entendem. Saúde primeiro.', fn: () => { SL.Life.mod({ estresse: -30, humor: 15, saude: 5 }); Rep.mod({ confianca: 1 }); SL.Social.post({ kind: 'texto', text: 'Hoje vou descansar. Saúde mental em primeiro lugar. Volto logo!', eng: 1.3 }); return 'Você respirou fundo e se sentiu melhor.'; } },
      { id: 'seguir', label: 'Seguir no ritmo', desc: 'O canal não pode parar... certo?', fn: () => { SL.Life.mod({ saude: -12, humor: -8 }); return 'O corpo vai cobrar.'; } },
    ],
  };
  DEF.entrevista = {
    title: 'Convite para entrevista na TV', icon: 'star',
    text: d => 'O programa "Noite Digital" quer você como convidado(a). Cachê de ' + U.money(d.cache) + '.',
    choices: [
      { id: 'sim', label: 'Aceitar', fn: d => { SL.Econ.add(d.cache, 'eventos', 'Cachê: entrevista na TV'); Rep.mod({ popularidade: 5, imagem: 3, profissional: 3 }); G().ch.connect.f += Math.round(SL.Social.totalFollowers() * 0.03); return 'Você foi um sucesso no programa.'; } },
      { id: 'nao', label: 'Recusar', fn: () => 'Ficou para a próxima.' },
    ],
  };
  DEF.doacao_fora = {
    title: 'Mensagem de um fã antigo', icon: 'gift',
    text: d => '@' + d.u + ' mandou ' + U.money(d.v) + ': "' + d.msg + '"',
    choices: [
      { id: 'agradecer', label: 'Agradecer em público', fn: d => { SL.Econ.add(d.v, 'doacoes', 'Pix de fã: @' + d.u); Rep.mod({ confianca: 1 }); return 'Você agradeceu e o post emocionou muita gente.'; } },
      { id: 'privado', label: 'Agradecer no privado', fn: d => { SL.Econ.add(d.v, 'doacoes', 'Pix de fã: @' + d.u); return 'O fã ficou muito feliz com a resposta.'; } },
    ],
  };

  // ---------- gatilhos usados por outros sistemas ----------
  E.equipBroken = it => { if (G().flags.noEvents) return; E.trigger('equip_quebra', { id: it.id, name: it.name, slot: it.slot }); };
  E.postRisk = p => { if (U.chance(p.risk * (1 + G().rep.popularidade / 100))) setTimeout(() => E.trigger('post_criticada', { text: p.text, id: p.id }), 50); };
  E.opinionRisk = v => { if (U.chance(0.18 + (v.bait ? 0.1 : 0))) G().events.pendingLater = (G().events.pendingLater || []).concat([{ at: G().time.t + U.ri(6, 30) * 60, id: 'mal_interpretado', data: { title: v.title } }]); };
  E.creatorTalksAboutPlayer = (id, kind) => { if (!cool('critica_criador', 12)) return; const c = SL.Creators.state(id); E.trigger('critica_criador', { id, name: D.creatorById(id).name, f: SL.Creators.total(c), hard: kind === 'critica' }); };
  E.livePolemic = id => { G().events.pendingLater = (G().events.pendingLater || []).concat([{ at: G().time.t + 120, id: 'critica_ao_vivo', data: { id, name: D.creatorById(id).name } }]); };
  E.expoAttended = (d, ok) => {
    const G0 = G(); if (!d) return;
    const met = U.shuffle(G0.creators.slice()).slice(0, 3);
    met.forEach(c => { const r = G0.rel[c.id]; r.met = true; if (r.stage === 'desconhecido') r.stage = 'conhecido'; r.aff += 5; r.last = G0.time.t; c.knowsPlayer = true; SL.Rel.updateStage(c.id); });
    const fans = Math.round(10 + SL.Social.totalFollowers() * 0.01);
    G0.ch.connect.f += fans; Rep.mod({ profissional: 3, popularidade: 1.5 });
    if (d.cache) SL.Econ.add(d.cache, 'eventos', 'Cachê: ' + d.name);
    SL.notify({ cat: 'carreira', icon: 'flag', title: 'Evento aproveitado', text: 'Você conheceu ' + met.map(c => D.creatorById(c.id).name).join(', ') + ' e ganhou ' + fans + ' seguidores.' });
    if (U.chance(0.5)) SL.Sponsors.makeOffer();
    G0.flags.expo = null; G0.flags.expoSem = Math.floor(SL.Clock.day() / 7);
  };
  E.onDm = () => {};

  // ---------- verificação periódica ----------
  SL.bus.on('tick:hour', () => {
    const G0 = G(); if (!G0 || G0.flags.noEvents) return;
    const later = G0.events.pendingLater || [];
    if (later.length) { const now = later.filter(x => x.at <= G0.time.t); G0.events.pendingLater = later.filter(x => x.at > G0.time.t); now.forEach(x => E.trigger(x.id, x.data)); }
    if (G0.events.pending.length >= 2 || (SL.Live && SL.Live.cur)) return;
    const pf = SL.Social.totalFollowers();
    // corte viraliza
    const raw = G0.raw.filter(r => r.kind === 'live' && G0.time.t - r.t < 3 * 1440 && r.moments.length && r.moments[0].clip >= 0.78 && !r.viralEv);
    if (raw.length && cool('corte_viraliza', 5) && U.chance(0.04 * (1 + G0.rep.popularidade / 50))) { const r = U.pick(raw); r.viralEv = 1; E.trigger('corte_viraliza', { txt: r.moments[0].txt, views: Math.round((pf + 500) * U.rf(2, 12)) }); return; }
    if (G0.rep.popularidade >= 30 && cool('fake_news', 25) && U.chance(0.004)) { E.trigger('fake_news', { text: U.pick(['@' + G0.player.user + ' compra seguidores', '@' + G0.player.user + ' é grosseiro(a) com fãs fora das lives', '@' + G0.player.user + ' vai parar com o canal']) }); return; }
    if (pf > 300 && cool('seguidores_comprados', 40) && U.chance(0.003)) { E.trigger('seguidores_comprados', {}); return; }
    if (G0.home.id === 'kitnet' && G0.act && G0.act.id === 'live' && cool('vizinho', 20) && U.chance(0.1)) { E.trigger('vizinho', {}); return; }
    if (SL.Career && SL.Career.tier() >= 4 && cool('entrevista', 30) && U.chance(0.004)) { E.trigger('entrevista', { cache: Math.round(3000 + pf * 0.01) }); return; }
    if (pf > 200 && cool('doacao_fora', 15) && U.chance(0.003)) { const fans = G0.viewers.list.filter(v => v.fol && v.w >= 3 && v.loy > 40); if (fans.length) { const v = U.pick(fans); E.trigger('doacao_fora', { u: v.u, v: U.ri(1, 5) * 100, msg: U.pick(['Obrigado por me fazer companhia nas madrugadas.', 'Investe no canal, você merece.', 'Suas lives me ajudaram numa fase difícil.']) }); } }
  });
  SL.bus.on('tick:day', day => {
    const G0 = G(); if (!G0) return;
    // popularidade acompanha o alcance
    const pf = SL.Social.totalFollowers();
    const target = U.clamp(Math.log10(1 + pf) * 14, 0, 100);
    G0.rep.popularidade = U.clamp(G0.rep.popularidade + (target - G0.rep.popularidade) * 0.08, 0, 100);
    // imagem e confiança voltam devagar ao centro
    ['imagem', 'confianca', 'credibilidade'].forEach(k => { G0.rep[k] += (50 - G0.rep[k]) * 0.01; });
    // estresse alto por dias
    if (G0.needs.estresse > 82) G0.flags.stressDays = (G0.flags.stressDays || 0) + 1; else G0.flags.stressDays = 0;
    if (G0.flags.stressDays >= 2 && cool('esgotamento', 10)) E.trigger('esgotamento', {});
    // seguidores comprados podem ser descobertos
    if (G0.ch.pulso.fake && U.chance(0.03)) { const n = G0.ch.pulso.fake; G0.ch.pulso.f = Math.max(0, G0.ch.pulso.f - n); G0.ch.pulso.fake = 0; Rep.mod({ confianca: -12, credibilidade: -10, imagem: -6 }); SL.Social.news('player_bad', { u: G0.player.user }); SL.notify({ cat: 'carreira', icon: 'alert', title: 'Descobriram os seguidores comprados', text: 'A Twitch removeu ' + U.int(n) + ' contas falsas e a notícia se espalhou.' }); }
    // convites para eventos fixos
    const tier = SL.Career ? SL.Career.tier() : 0;
    D.expoEvents.forEach(x => {
      const evDay = SL.Clock.dayForMD(day, x.md);
      if (evDay === day + 10 && tier >= x.minTier) E.trigger('convite_expo', { name: x.name, day: evDay, fee: tier >= 3 ? 0 : x.fee, cache: tier >= 3 ? Math.round(1500 * tier) : 0 });
    });
  });
})(window.SL);

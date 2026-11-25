/* Carreira (níveis por resultado e reputação), objetivos e calendário. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const G = () => SL.G;

  // ---------- calendário ----------
  const Cal = SL.Calendar = {};
  Cal.KINDS = { conta: { label: 'Pagamento', color: '#35d39a', icon: 'money' }, promessa: { label: 'Promessa', color: '#ffb547', icon: 'flag' }, live: { label: 'Live agendada', color: '#8b5cf6', icon: 'live' },
    encontro: { label: 'Compromisso', color: '#ff8fc1', icon: 'heart' }, collab: { label: 'Collab', color: '#4cc3ff', icon: 'users' }, publicacao: { label: 'Publicação', color: '#ff5a36', icon: 'upload' },
    contrato: { label: 'Contrato', color: '#c084fc', icon: 'brief' }, evento: { label: 'Evento', color: '#ff5a36', icon: 'flag' }, entrega: { label: 'Entrega', color: '#8b93a7', icon: 'shop' },
    especial: { label: 'Data especial', color: '#ffe066', icon: 'star' }, feriado: { label: 'Feriado', color: '#ffe066', icon: 'star' }, promo: { label: 'Promoção', color: '#35d39a', icon: 'tag' } };
  Cal.add = e => {
    const G0 = G(); if (e.ref && G0.cal.some(x => x.ref === e.ref && x.day === e.day)) return;
    G0.cal.push({ id: U.uid('cal'), day: e.day, hour: e.hour == null ? null : e.hour, kind: e.kind, title: e.title, ref: e.ref || null });
    SL.bus.emit('calendar');
  };
  Cal.removeRef = ref => { const G0 = G(); const n = G0.cal.length; G0.cal = G0.cal.filter(x => x.ref !== ref); if (n !== G0.cal.length) SL.bus.emit('calendar'); };
  Cal.forDay = day => {
    const G0 = G(); const md = SL.Clock.mdOfDay(day);
    const out = G0.cal.filter(x => x.day === day).slice();
    D.specialDates.filter(s => s.md === md).forEach(s => out.push({ kind: s.kind, title: s.name, day }));
    D.expoEvents.filter(s => s.md === md).forEach(s => out.push({ kind: 'evento', title: s.name + ' (Expo Norte)', day }));
    G0.ch.schedule.filter(s => s.day === day && !s.done).forEach(s => { if (!out.some(o => o.kind === 'promessa' && o.hour === s.hour)) out.push({ kind: 'live', title: 'Live agendada', hour: s.hour, day }); });
    return out.sort((a, b) => (a.hour == null ? -1 : a.hour) - (b.hour == null ? -1 : b.hour));
  };
  Cal.upcoming = (n, fromDay) => {
    const d0 = fromDay == null ? SL.Clock.day() : fromDay; const out = [];
    for (let d = d0; d < d0 + 30 && out.length < n; d++) Cal.forDay(d).forEach(e => { if (out.length < n) out.push(e); });
    return out;
  };
  SL.bus.on('tick:day', day => { const G0 = G(); if (G0) G0.cal = G0.cal.filter(x => x.day >= day - 45); });

  // ---------- carreira ----------
  const CR = SL.Career = {};
  CR.TIERS = [
    { n: 'Desconhecido', s: 0, reach: 0 }, { n: 'Iniciante', s: 6, reach: 1 }, { n: 'Pequeno criador', s: 21, reach: 500 },
    { n: 'Criador em crescimento', s: 34, reach: 10000 }, { n: 'Influenciador conhecido', s: 47, reach: 100000, rep: 45 },
    { n: 'Influenciador de grande porte', s: 59, reach: 1000000, rep: 45 }, { n: 'Celebridade digital', s: 71, reach: 5000000, pop: 85, img: 55 },
  ];
  CR.breakdown = () => {
    const G0 = G(); const ch = G0.ch;
    const reach = ch.pulso.f - (ch.pulso.fake || 0) + ch.vision.f + ch.clipz.f * 0.5 + ch.connect.f * 0.4;
    const av = ch.avgViewers.slice(-10); const avgV = av.length ? av.reduce((a, b) => a + b, 0) / av.length : 0;
    const lives = G0.lives.slice(-10); const eng = lives.length ? lives.reduce((a, l) => a + Math.min(100, (l.msgs / Math.max(1, l.dur)) / Math.max(1, l.avg) * 200), 0) / lives.length : 0;
    const vids = G0.videos.filter(v => v.status === 'publicado').slice(-10);
    const q = (vids.length + lives.length) ? (vids.reduce((a, v) => a + v.quality, 0) + lives.reduce((a, l) => a + l.q, 0)) / (vids.length + lives.length) : 0;
    const day = SL.Clock.day(); const cons = Math.min(100, ch.contentDays.filter(d => d > day - 28).length / 16 * 100);
    const parts = {
      alcance: Math.log10(1 + reach) * 14 * 0.48, audiencia: Math.log10(1 + avgV) * 18 * 0.25, engajamento: Math.min(100, eng) * 0.12,
      qualidade: q * 0.1, reputacao: SL.Rep.avg() * 0.14, constancia: cons * 0.08,
    };
    const score = Object.values(parts).reduce((a, b) => a + b, 0);
    return { parts, score, reach, avgV, eng, q, cons };
  };
  CR.tier = () => G().career.tier;
  CR.tierName = t => CR.TIERS[t == null ? G().career.tier : t].n;
  CR.eligible = (t, b) => { const T = CR.TIERS[t]; const r = G().rep; if (b.score < T.s || b.reach < T.reach) return false; if (T.rep && SL.Rep.avg() < T.rep) return false; if (T.pop && r.popularidade < T.pop) return false; if (T.img && r.imagem < T.img) return false; if (t === 1 && !G().lives.length && !G().videos.length) return false; return true; };
  CR.evaluate = () => {
    const G0 = G(); const c = G0.career; const b = CR.breakdown();
    c.score = Math.round(b.score * 10) / 10;
    let t = c.tier;
    while (t + 1 < CR.TIERS.length && CR.eligible(t + 1, b)) t++;
    if (t > c.tier) {
      c.tier = t; c.low = 0; c.best = Math.max(c.best, t);
      c.hist.push({ d: SL.Clock.day(), t, up: true });
      SL.notify({ cat: 'carreira', icon: 'crown', title: 'Novo nível de carreira', text: 'Agora você é: ' + CR.TIERS[t].n + '.' });
      if (SL.audio) SL.audio.play('levelup');
      if (SL.UI && SL.UI.confetti) SL.UI.confetti();
    } else if (c.tier > 1 && b.score < CR.TIERS[c.tier].s - 4) {
      c.low++;
      if (c.low >= 14) { c.tier--; c.low = 0; c.hist.push({ d: SL.Clock.day(), t: c.tier, up: false }); SL.notify({ cat: 'carreira', icon: 'trendDown', title: 'A carreira esfriou', text: 'Você voltou para: ' + CR.TIERS[c.tier].n + '. Constância e qualidade trazem de volta.' }); }
    } else c.low = 0;
    SL.bus.emit('career');
  };
  SL.bus.on('tick:day', () => { if (G()) CR.evaluate(); });
  SL.bus.on('live:end', () => CR.evaluate());

  // ---------- objetivos ----------
  // Placas do YouTube (como na vida real: prata com 100 mil, ouro com 1 milhão e diamante com 10 milhões de inscritos).
  // TikTok e Twitch não dão placa. A placa fica pendurada na parede do escritório e aparece atrás de você na live.
  const PL = SL.Placas = {};
  PL.NOMES = { prata: 'Placa de Prata', ouro: 'Placa de Ouro', diamante: 'Placa de Diamante' };
  PL.lista = () => { const g = G(); const p = (g && g.placas) || {}; return ['prata', 'ouro', 'diamante'].filter(k => p[k]).map(k => ({ id: k, nome: PL.NOMES[k], dia: p[k] })); };
  PL.ganha = id => {
    const G0 = G(); G0.placas = G0.placas || {}; if (G0.placas[id]) return;
    G0.placas[id] = SL.Clock.day() + 1;
    SL.notify({ cat: 'carreira', icon: 'trophy', title: 'Chegou a sua ' + PL.NOMES[id] + ' do YouTube!', text: 'Ela já está pendurada na parede do escritório.', sound: 'levelup' });
    SL.bus.emit('placa', id); SL.bus.emit('home');
  };
  const GO = SL.Goals = {};
  const tf = () => SL.Social.totalFollowers();
  const ownsPc = t => Object.keys(G().equip.owned).some(id => { const e = D.equipById(id); return e && e.slot === 'computador' && e.tier >= t; });
  GO.LIST = [
    { id: 'p_comer', r: 50, g: 'Primeiros passos', title: 'Comer alguma coisa', hint: 'Clique na geladeira da cozinha.', check: () => !!G().flags.ate },
    { id: 'p_pc', r: 50, g: 'Primeiros passos', title: 'Ligar o computador', hint: 'Clique na mesa do escritório.', check: () => !!G().flags.pcOpened },
    { id: 'p_live', r: 150, g: 'Primeiros passos', title: 'Fazer sua primeira transmissão', hint: 'App OBS Studio, no computador.', check: () => G().ch.pulso.livesN >= 1 },
    { id: 'p_post', r: 80, g: 'Primeiros passos', title: 'Publicar algo no Instagram', hint: 'App Instagram, no celular ou no computador.', check: () => G().posts.length >= 1 },
    { id: 'p_video', r: 150, g: 'Primeiros passos', title: 'Publicar seu primeiro vídeo', hint: 'Faça uma live: o corte sai sozinho no TikTok e no YouTube.', check: () => G().videos.length >= 1 },
    { id: 'f100', r: 300, g: 'Carreira', title: 'Conseguir os primeiros 100 seguidores', prog: () => [tf(), 100] },
    { id: 'afil', r: 500, g: 'Carreira', title: 'Virar afiliado(a) da Twitch', hint: '50 seguidores, 7 lives e média de 3 pessoas.', check: () => G().ch.pulso.afil },
    { id: 'pc1', r: 300, g: 'Carreira', title: 'Comprar seu primeiro computador de verdade', check: () => ownsPc(1) },
    { id: 'spons', r: 400, g: 'Carreira', title: 'Conseguir o primeiro patrocínio', check: () => G().contracts.length >= 1 },
    { id: 'v100', r: 800, g: 'Carreira', title: 'Live com 100 pessoas ao mesmo tempo', prog: () => [G().ch.pulso.peak, 100] },
    { id: 'mon', r: 1500, g: 'Carreira', title: 'Monetizar o canal no YouTube', hint: '1.000 inscritos e 4.000 horas assistidas.', check: () => G().ch.vision.mon },
    { id: 'f10k', r: 3000, g: 'Carreira', title: 'Alcançar 10 mil inscritos no YouTube', prog: () => [G().ch.vision.f, 10000] },
    { id: 'yt_prata', r: 5000, g: 'Carreira', title: 'Ganhar a Placa de Prata do YouTube', hint: '100 mil inscritos no YouTube. A placa vai para a parede do escritório.', prog: () => [G().ch.vision.f, 100000], placa: 'prata' },
    { id: 'viral', r: 2500, g: 'Carreira', title: 'Ter um vídeo com 100 mil visualizações', prog: () => [Math.max(0, ...G().videos.map(v => v.views)), 100000] },
    { id: 'v1000', r: 4000, g: 'Carreira', title: 'Live com 1.000 espectadores simultâneos', prog: () => [G().ch.pulso.peak, 1000] },
    { id: 'f100k', r: 10000, g: 'Carreira', title: 'Alcançar 100 mil seguidores', prog: () => [tf(), 100000] },
    { id: 'yt_ouro', r: 20000, g: 'Carreira', title: 'Ganhar a Placa de Ouro do YouTube', hint: '1 milhão de inscritos no YouTube.', prog: () => [G().ch.vision.f, 1000000], placa: 'ouro' },
    { id: 'top10', r: 8000, g: 'Carreira', title: 'Entrar no top 10 do ranking de criadores', check: () => SL.Creators.ranking().findIndex(x => x.me) < 10 },
    { id: 'f1m', r: 30000, g: 'Carreira', title: 'Chegar a 1 milhão de seguidores', prog: () => [tf(), 1000000] },
    { id: 'yt_diamante', r: 60000, g: 'Carreira', title: 'Ganhar a Placa de Diamante do YouTube', hint: '10 milhões de inscritos no YouTube.', prog: () => [G().ch.vision.f, 10000000], placa: 'diamante' },
    { id: 'top1', r: 50000, g: 'Carreira', title: 'Ser o maior criador de conteúdo do ranking', check: () => SL.Creators.ranking()[0].me },
    { id: 'pcpro', r: 2000, g: 'Conquistas da vida', title: 'Comprar um computador profissional', check: () => ownsPc(4) },
    { id: 'equipe', r: 1500, g: 'Conquistas da vida', title: 'Montar uma equipe (2 contratados)', prog: () => [G().staff.length, 2] },
    { id: 'produto', r: 2000, g: 'Conquistas da vida', title: 'Lançar um produto próprio', check: () => G().ch.merch.on },
    { id: 'patri', r: 5000, g: 'Conquistas da vida', title: 'Patrimônio de R$ 100 mil', prog: () => [Math.max(0, SL.Econ.netWorth()), 100000] },
    { id: 'casa', r: 10000, g: 'Conquistas da vida', title: 'Comprar uma casa', check: () => G().home.owned },
    { id: 'estudio', r: 5000, g: 'Conquistas da vida', title: 'Construir um estúdio', check: () => G().home.studio },
    { id: 'amigo', r: 200, g: 'Pessoas', title: 'Fazer uma nova amizade', check: () => Object.keys(G().rel).some(id => !['duda', 'rafa', 'mae'].includes(id) && ['amigo', 'melhor_amigo'].includes(G().rel[id].stage)) },
    { id: 'collab', r: 400, g: 'Pessoas', title: 'Fazer uma live em colaboração', check: () => !!G().flags.collabDone },
    { id: 'namoro', g: 'Pessoas', title: 'Começar um namoro (opcional)', check: () => !!SL.Rel.partner() },
  ];
  GO.status = g => { if (G().goals[g.id]) return { done: true, p: 1 }; if (g.prog) { const [a, b] = g.prog(); return { done: a >= b, p: U.clamp(a / b, 0, 1), a, b }; } return { done: !!g.check(), p: g.check() ? 1 : 0 }; };
  GO.check = () => {
    const G0 = G(); if (!G0) return;
    GO.LIST.forEach(g => {
      if (G0.goals[g.id]) return;
      let ok = false; try { ok = GO.status(g).done; } catch (e) { ok = false; }
      if (ok) {
        G0.goals[g.id] = SL.Clock.day();
        if (g.r) SL.Econ.add(g.r, 'outros', 'Prêmio da meta: ' + g.title);
        if (g.placa) PL.ganha(g.placa);
        SL.notify({ cat: 'carreira', icon: 'trophy', title: 'Meta cumprida' + (g.r ? ': +' + U.money0(g.r) : ''), text: g.title, sound: 'success' });
        if (SL.audio) SL.audio.play('success');
      }
    });
    SL.bus.emit('goals');
  };
  GO.next = n => GO.LIST.filter(g => !G().goals[g.id]).slice(0, n || 3);
  // a meta que aparece no painel do jogo: a primeira que falta (primeiros passos e carreira, na ordem)
  GO.atual = () => {
    const G0 = G(); if (!G0) return null;
    const g = GO.LIST.find(x => (x.g === 'Primeiros passos' || x.g === 'Carreira') && !G0.goals[x.id]); if (!g) return null;
    let st; try { st = GO.status(g); } catch (e) { st = { done: false, p: 0 }; }
    return { g, s: st };
  };

  // ---------- resumo da semana (sugestão 2): a cada 7 dias do jogo ----------
  GO.semana = day => {
    const G0 = G(); const ini = (day - 7) * 1440, fim = day * 1440; const ch = G0.ch;
    const lives = G0.lives.filter(l => l.t0 >= ini && l.t0 < fim);
    const d0 = G0.stats.days.find(x => x.d === day - 7) || G0.stats.days[0] || { f: { p: 0, v: 0, c: 0, n: 0 } };
    const mov = G0.ledger.filter(x => x.t >= ini && x.t < fim);
    const vids = G0.videos.filter(v => v.t >= ini && v.t < fim && v.status === 'publicado');
    const best = vids.slice().sort((a, b) => b.views - a.views)[0];
    return { n: Math.floor(day / 7), lives: lives.length, horas: Math.round(lives.reduce((a, l) => a + l.dur, 0) / 6) / 10, pico: lives.reduce((a, l) => Math.max(a, l.peak), 0),
      seg: [['Twitch', ch.pulso.f - d0.f.p], ['YouTube', ch.vision.f - d0.f.v], ['TikTok', ch.clipz.f - d0.f.c], ['Instagram', ch.connect.f - d0.f.n]],
      ganho: Math.round(mov.filter(x => x.v > 0 && x.cat !== 'emprestimo').reduce((a, x) => a + x.v, 0)), gasto: Math.round(mov.filter(x => x.v < 0).reduce((a, x) => a - x.v, 0)),
      videos: vids.length, best: best ? { title: best.title, views: best.views, plat: best.plat === 'clipz' ? 'TikTok' : 'YouTube' } : null };
  };
  SL.bus.on('tick:day', day => { const G0 = G(); if (!G0 || day < 7 || day % 7) return; G0.resumo = GO.semana(day); });
  SL.bus.on('tick:hour', () => { if (G()) GO.check(); });
})(window.SL);

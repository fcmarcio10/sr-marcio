/* Vida: necessidades, desempenho, comida em casa e atividades que consomem tempo. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const L = SL.Life = {};
  const G = () => SL.G;

  // Só três necessidades: fome, sede e cansaço (cansaço alto = sono). As antigas (saúde, sono, higiene,
  // humor e estresse) ficam com valor fixo no salvamento só para os outros sistemas continuarem funcionando.
  L.NEEDS = [
    { k: 'fome', label: 'Fome', icon: 'food', color: '#ffb547' },
    { k: 'sede', label: 'Sede', icon: 'drink', color: '#4cc3ff' },
    { k: 'energia', label: 'Cansaço', icon: 'sleep', color: '#a78bfa', tired: true }, // guardado como disposição (100 = descansado)
  ];
  const LIVE_KEYS = { fome: 1, sede: 1, energia: 1 };
  L.fixed = n => { n.sono = n.energia; n.saude = 100; n.higiene = 100; n.humor = 70; n.estresse = 10; };
  L.mod = delta => {
    const n = G().needs;
    for (const k in delta) if (LIVE_KEYS[k]) n[k] = U.clamp(n[k] + delta[k], 0, 100);
    L.fixed(n);
    SL.bus.emit('needs');
  };

  L.perf = () => {
    const n = G().needs; let p = 1;
    if (n.energia < 35) p -= (35 - n.energia) * 0.011;
    if (n.energia < 10) p -= (10 - n.energia) * 0.012;
    if (n.fome < 25) p -= (25 - n.fome) * 0.009;
    if (n.sede < 25) p -= (25 - n.sede) * 0.009;
    if (n.fome > 60 && n.sede > 60 && n.energia > 60) p += 0.05;
    return U.clamp(p, 0.35, 1.1);
  };
  // carisma efetivo na câmera (0-100)
  L.charisma = () => {
    const G0 = G();
    let c = 22 + G0.player.skills.carisma * 0.7;
    c *= L.perf();
    if (G0.rel && SL.Rel && SL.Rel.partner()) c += 3;
    return U.clamp(c, 5, 100);
  };

  L.warnings = () => {
    const n = G().needs, w = [];
    if (n.fome < 20) w.push('Com fome'); if (n.sede < 20) w.push('Com sede');
    const tl = L.tiredLevel(); if (tl >= 2) w.push(tl >= 3 ? 'Morrendo de sono' : 'Com sono');
    return w;
  };

  // ---------- cansaço ----------
  // 0 descansado, 1 cansado, 2 muito cansado, 3 exausto. Anda mais devagar, rende menos e pode cochilar na cadeira.
  L.tiredLevel = () => { const e = G().needs.energia; return e >= 45 ? 0 : e >= 25 ? 1 : e >= 10 ? 2 : 3; };
  L.TIRED = ['Descansado(a)', 'Cansado(a)', 'Com sono', 'Morrendo de sono'];
  L.tiredValue = () => Math.round(100 - G().needs.energia);
  L.awakeHours = () => Math.floor(((G().life && G().life.awake) || 0) / 60);
  const PHYS = ['academia', 'bike', 'caminhar', 'limpar', 'turno_cafe'];

  L.skillUp = (k, amt) => {
    const s = G().player.skills; const before = s[k] || 0;
    s[k] = U.clamp(before + amt * (1 - before / 115), 0, 100);
    if (Math.floor(s[k] / 10) > Math.floor(before / 10)) {
      const names = { carisma: 'Carisma', jogo: 'Habilidade em jogos', edicao: 'Edição', marketing: 'Marketing', culinaria: 'Culinária', fisico: 'Condicionamento físico' };
      SL.notify({ cat: 'vida', icon: 'sparkle', title: names[k] + ' subiu para ' + Math.floor(s[k] / 10) * 10, text: 'A prática está dando resultado.', silent: false });
    }
    SL.bus.emit('skills');
  };

  // ---------- comida ----------
  L.foodCount = id => (G().home.food[id] || []).length;
  L.fridgeCap = () => (D.furnById(G().home.items.geladeira) || { cap: 4 }).cap;
  L.fridgeUsed = () => { let n = 0; const f = G().home.food; for (const id in f) { const fd = D.foodById(id); if (fd && fd.perish) n += f[id].length; } return n; };
  L.addFood = (id, portions) => {
    const fd = D.foodById(id); if (!fd) return 0;
    const H = G().home; const day = SL.Clock.day();
    const keep = (D.furnById(H.items.geladeira) || { keep: 1 }).keep || 1;
    let added = 0;
    for (let i = 0; i < portions; i++) {
      if (fd.perish && L.fridgeUsed() >= L.fridgeCap()) break;
      (H.food[id] = H.food[id] || []).push(fd.perish ? day + Math.round(fd.perish * keep) : 99999);
      added++;
    }
    SL.bus.emit('food');
    return added;
  };
  L.takeFood = id => {
    const arr = G().home.food[id]; if (!arr || !arr.length) return false;
    arr.sort((a, b) => a - b); arr.shift(); if (!arr.length) delete G().home.food[id];
    SL.bus.emit('food'); return true;
  };
  L.stockList = () => Object.keys(G().home.food).map(id => ({ food: D.foodById(id), n: G().home.food[id].length, exp: Math.min(...G().home.food[id]) })).filter(x => x.food);

  // ---------- atividades ----------
  const ACT = L.ACT = {};
  const def = (id, o) => { ACT[id] = Object.assign({ id, speed: 4, icon: 'clock', fx: {} }, o); };
  // speed = minutos do jogo por segundo real na velocidade 1 (banho de 15 min leva uns 6 segundos; 8 horas de sono, uns 16)
  const bed = () => (D.furnById(G().home.items.cama) || { sleep: 0.8 }).sleep;

  def('dormir', { label: 'Dormindo', icon: 'sleep', speed: 30, sleep: true, fx: { estresse: -4, humor: 0.6 },
    minute: a => {
      L.mod({ sono: 14.5 * bed() / 60, energia: 14 * bed() / 60 });
      if (a.data && a.data.until && G().time.t >= a.data.until) return 'fim';
      if (!a.data || !a.data.until) { if (G().needs.sono >= 99.5 && G().time.t - a.t0 > 120) return 'fim'; }
    },
    end: (a, ok) => { const h = (G().time.t - a.t0) / 60; if (h >= 6) L.mod({ humor: 4, saude: 1 }); if (h < 4 && ok) L.mod({ humor: -2 }); const lf = G().life; if (lf) lf.awake = h >= 3 ? 0 : Math.max(0, lf.awake - h * 120); } });
  def('cochilar', { label: 'Cochilando', icon: 'sleep', speed: 10, sleep: true, dur: 60, fx: { sono: 10, energia: 12, estresse: -3 },
    minute: () => { L.mod({ sono: 10 * bed() / 60 }); },
    end: () => { const lf = G().life; if (lf) lf.awake = Math.max(0, lf.awake - 90); } });
  def('banho', { label: 'Tomando banho', icon: 'shower', speed: 2.5, dur: 15,
    end: (a, ok) => { if (ok) L.mod({ energia: 4 }); } });
  def('banho_longo', { label: 'Banho demorado', icon: 'shower', speed: 3.5, dur: 35, fx: { estresse: -12, humor: 8 },
    end: (a, ok) => { if (ok) { L.mod({ higiene: 100, humor: 3 }); } } });
  def('vaso', { label: 'No banheiro', icon: 'hygiene', speed: 1.2, dur: 6 });
  def('escovar', { label: 'Se arrumando', icon: 'hygiene', speed: 1.5, dur: 6, end: (a, ok) => { if (ok) L.mod({ higiene: 14, humor: 1 }); } });
  def('beber', { label: 'Bebendo água', icon: 'drink', speed: 1, dur: 2, end: (a, ok) => { if (ok) L.mod({ sede: 42 }); } });
  // comer/beber: data.food; data.taken = já tirou da geladeira; data.q = qualidade do preparo; data.where = 'mesa' para sentar
  def('comer', { label: 'Comendo', icon: 'food', speed: 2,
    dur: a => a.data.dur || Math.min(20, (D.foodById(a.data.food) || { time: 10 }).time),
    start: a => { if (!a.data.taken && !L.takeFood(a.data.food)) return 'Não tem ' + (D.foodById(a.data.food) || {}).name + ' em casa.'; G().flags.ate = 1; },
    end: (a, ok) => {
      const fd = D.foodById(a.data.food); if (!fd) return;
      const q = a.data.q || 1; const part = ok ? 1 : U.clamp((G().time.t - a.t0) / (a.dur || 1), 0.3, 1);
      const fx = {}; for (const k in fd.eat) fx[k] = fd.eat[k] * (fd.eat[k] > 0 ? q : 1) * part;
      L.mod(fx); if (fd.coffee || fd.id === 'energetico') G().life.caf = 180;
      G().home.dirt = U.clamp(G().home.dirt + 1, 0, 100);
    } });
  // cozinhar: com data.food prepara aquele item (já tirado da geladeira) e guarda a qualidade em data.q
  def('cozinhar', { label: 'Cozinhando', icon: 'stove', speed: 4,
    dur: a => { const fd = D.foodById(a.data.food || 'ingredientes') || { time: 40 }; return Math.round((fd.cook ? 45 : fd.time) / (0.8 + G().player.skills.culinaria / 200)); },
    start: a => { if (a.data.food) return; if (!L.takeFood('ingredientes')) return 'Você precisa de ingredientes de refeição (compre no mercado).'; },
    end: (a, ok) => {
      const q = (D.furnById(G().home.items.fogao) || { cook: 0.85 }).cook * (0.75 + G().player.skills.culinaria / 140);
      a.data.q = ok ? q : 0.6;
      if (!a.data.food) { if (ok) L.mod({ fome: 62 * q }); else L.mod({ fome: 20 }); }
      if (ok) L.skillUp('culinaria', 1.4);
      G().home.dirt = U.clamp(G().home.dirt + 4, 0, 100);
    } });
  def('cafe', { label: 'Passando café', icon: 'coffee', speed: 1.5, dur: 6,
    start: () => { if (!G().home.items.cafeteira && !G().home.items.fogao) return 'Sem cafeteira nem fogão.'; if (!L.takeFood('cafe')) return 'Acabou o café. Compre no mercado.'; },
    end: (a, ok) => { if (ok) { L.mod({ energia: 14, sono: 6, humor: 1.5 }); G().life.caf = 180; } } });
  def('tv', { label: 'Assistindo TV', icon: 'tv', speed: 5, dur: 60, leisure: true, fx: { humor: 8, estresse: -7, energia: 2 },
    end: (a, ok) => { if (ok && SL.Algo) SL.Algo.learnTrend('tv'); } });
  def('videogame', { label: 'Jogando videogame', icon: 'gamepad', speed: 5, dur: 60, leisure: true, fx: { humor: 10, estresse: -7 },
    minute: () => L.skillUp('jogo', 0.025) });
  def('pc_lazer', { label: 'Jogando por diversão', icon: 'gamepad', speed: 5, dur: 60, leisure: true, pc: true, fx: { humor: 8, estresse: -6, energia: -1 },
    minute: () => L.skillUp('jogo', 0.03) });
  def('descansar', { label: 'Descansando no sofá', icon: 'sofa', speed: 4, dur: 30, leisure: true, fx: { energia: 12, estresse: -5, humor: 2 } });
  def('ler', { label: 'Lendo um livro', icon: 'book', speed: 5, dur: 60, leisure: true, fx: { estresse: -7, humor: 3 },
    minute: () => { L.skillUp('carisma', 0.008); L.skillUp('marketing', 0.006); } });
  def('limpar', { label: 'Limpando a casa', icon: 'broom', speed: 3, dur: 45, fx: { energia: -7, higiene: -5 },
    end: (a, ok) => { const f = ok ? 1 : (G().time.t - a.t0) / 45; G().home.dirt = U.clamp(G().home.dirt - 60 * f, 0, 100); L.mod({ humor: 3 * f }); SL.bus.emit('home'); } });
  def('bike', { label: 'Pedalando na ergométrica', icon: 'bike', speed: 4, dur: 40, fx: { energia: -14, higiene: -18, estresse: -11, humor: 4 },
    minute: () => { L.skillUp('fisico', 0.05); L.mod({ saude: 0.03 }); } });
  def('regar', { label: 'Regando as plantas', icon: 'plant', speed: 1, dur: 3, end: (a, ok) => { if (ok) { G().home.plants.last = SL.Clock.day(); L.mod({ humor: 1 }); } } });
  def('usar_pc', { label: 'Usando o computador', icon: 'monitor', speed: 0, pc: true, fx: { energia: -1.5 } });
  def('estudar', { label: 'Estudando', icon: 'book', speed: 8, pc: true, work: true, fx: { energia: -4, estresse: 1.5 },
    dur: a => a.data.hours * 60,
    minute: a => { const c = D.courses.find(x => x.id === a.data.course); if (c) L.skillUp(c.skill, c.gain / (c.hours * 60) * 1.15); },
    end: (a, ok) => { if (ok) { G().courses[a.data.course] = SL.Clock.day(); SL.notify({ cat: 'vida', icon: 'book', title: 'Curso concluído', text: (D.courses.find(x => x.id === a.data.course) || {}).name }); } } });
  def('freela', { label: 'Fazendo freela de edição', icon: 'briefcase', speed: 8, pc: true, work: true, fx: { energia: -6, estresse: 3 },
    dur: a => a.data.hours * 60,
    minute: () => L.skillUp('edicao', 0.012),
    end: (a, ok) => {
      const h = (G().time.t - a.t0) / 60; const rate = 14 + G().player.skills.edicao * 0.9;
      const pay = Math.round(h * rate * (ok ? 1 : 0.6));
      if (pay > 0) SL.Econ.add(pay, 'trabalho', 'Freela de edição (' + U.dur(h * 60) + ')');
    } });
  def('editar', { label: 'Editando vídeo', icon: 'scissors', speed: 8, pc: true, work: true, fx: { energia: -5, estresse: 2 },
    dur: a => a.data.minutes, minute: a => SL.Videos.workMinute(a.data.edit) });
  def('gravar', { label: 'Gravando', icon: 'video', speed: 6, pc: true, work: true, fx: { energia: -5, estresse: 1.5 },
    dur: a => a.data.minutes, minute: a => SL.Videos.recordMinute(a), end: (a, ok) => SL.Videos.recordEnd(a, ok) });
  def('live', { label: 'Ao vivo', icon: 'live', speed: 1, pc: true, work: true, fx: { energia: -6, estresse: 2.5, sede: -2 } });
  // cidade
  def('viagem', { label: 'A caminho', icon: 'walk', speed: 3, dur: a => a.data.min, end: (a, ok) => { if (ok && SL.City) SL.City.arrive(a.data); } });
  def('academia', { label: 'Treinando na academia', icon: 'dumbbell', speed: 6, dur: 60, fx: { energia: -16, higiene: -22, estresse: -14, humor: 6 },
    minute: () => { L.skillUp('fisico', 0.07); L.mod({ saude: 0.04 }); } });
  def('caminhar', { label: 'Caminhando no parque', icon: 'walk', speed: 5, dur: 45, leisure: true, fx: { energia: -5, estresse: -10, humor: 7, higiene: -4 },
    minute: () => { L.skillUp('fisico', 0.02); L.mod({ saude: 0.02 }); } });
  def('relaxar', { label: 'Relaxando', icon: 'tree', speed: 6, dur: 60, leisure: true, fx: { estresse: -12, humor: 8, energia: 3 } });
  def('restaurante', { label: 'Almoçando fora', icon: 'utensils', speed: 5, dur: 45, leisure: true, fx: { humor: 6, estresse: -4 },
    end: (a, ok) => { if (ok) L.mod({ fome: 70, sede: 25, saude: 1 }); } });
  def('cafe_fora', { label: 'Tomando café', icon: 'coffee', speed: 3, dur: 20, leisure: true, end: (a, ok) => { if (ok) { L.mod({ energia: 15, sono: 5, sede: 10, humor: 4 }); G().life.caf = 180; } } });
  def('lanche_fora', { label: 'Comendo um lanche', icon: 'food', speed: 3, dur: 20, end: (a, ok) => { if (ok) L.mod({ fome: 40, sede: 20, humor: 3 }); } });
  def('turno_cafe', { label: 'Trabalhando no Café Grão Fino', icon: 'briefcase', speed: 10, dur: 240, work: true, fx: { energia: -8, estresse: 3, higiene: -3 },
    minute: () => L.skillUp('carisma', 0.006),
    end: (a, ok) => {
      const h = (G().time.t - a.t0) / 60; const pay = Math.round(h * 19 + (ok ? U.ri(8, 30) : 0));
      if (pay > 0) SL.Econ.add(pay, 'trabalho', 'Turno no Café Grão Fino' + (ok ? ' (com gorjetas)' : ''));
      if (SL.Rel) SL.Rel.passiveMeet('cafeteria');
    } });
  def('cinema', { label: 'No cinema', icon: 'video', speed: 8, dur: 140, leisure: true, fx: { humor: 7, estresse: -6 } });
  def('passear', { label: 'Passeando', icon: 'bag', speed: 6, dur: 60, leisure: true, fx: { humor: 6, estresse: -5, energia: -3 } });
  def('evento', { label: 'No evento', icon: 'flag', speed: 10, dur: 240, fx: { energia: -6, humor: 6 },
    end: (a, ok) => { if (SL.Events) SL.Events.expoAttended(a.data, ok); } });
  def('encontro', { label: 'Em um encontro', icon: 'heart', speed: 6, dur: 90, leisure: true, fx: { humor: 8, estresse: -6 },
    end: (a, ok) => { if (SL.Rel) SL.Rel.dateEnd(a.data, ok); } });
  def('visita', { label: 'Visitando', icon: 'users', speed: 8, dur: 120, leisure: true, fx: { humor: 7, estresse: -6 },
    end: (a, ok) => { if (SL.Rel) SL.Rel.visitEnd(a.data, ok); } });
  def('hospital', { label: 'No hospital', icon: 'health', speed: 20, dur: a => a.data.min || 300, fx: { estresse: 2 },
    end: () => L.mod({ saude: 45, fome: 20, sede: 30 }) });
  def('colab', { label: 'Jogando com amigos', icon: 'gamepad', speed: 6, dur: 120, leisure: true, pc: true, fx: { humor: 9, estresse: -6 },
    end: (a, ok) => { if (SL.Rel) SL.Rel.playTogetherEnd(a.data, ok); } });

  L.can = id => !!ACT[id];
  L.current = () => G().act;
  L.busy = () => !!G().act && G().act.id !== 'usar_pc';

  // começa uma atividade. Retorna mensagem de erro (string) ou null.
  L.start = (id, data, opts) => {
    const def0 = ACT[id]; if (!def0) return 'Atividade desconhecida.';
    const G0 = G();
    if (G0.act && G0.act.id === 'live' && id !== 'live') return 'Você está ao vivo.';
    if (PHYS.includes(id) && L.tiredLevel() >= 3) return 'Você está exausto(a). Descanse ou durma antes.';
    if (G0.act && G0.act.id !== 'usar_pc') L.stop(false);
    const a = { id, t0: G0.time.t, data: data || {}, label: (opts && opts.label) || def0.label, speed: def0.speed };
    if (def0.start) { const err = def0.start(a); if (err) return err; }
    a.dur = typeof def0.dur === 'function' ? def0.dur(a) : (def0.dur || 0);
    if (data && data.dur) a.dur = data.dur;
    G0.act = a;
    SL.bus.emit('activity', a);
    return null;
  };
  L.stop = (completed) => {
    const G0 = G(); const a = G0.act; if (!a) return;
    G0.act = null;
    const def0 = ACT[a.id];
    if (def0 && def0.end) try { def0.end(a, !!completed); } catch (e) { console.error(e); }
    SL.bus.emit('activity', null);
    if (completed && def0 && def0.speed && !def0.pc && SL.UI && a.id !== 'viagem') SL.UI.toast({ title: 'Atividade concluída', text: a.label, icon: def0.icon, cat: 'vida' }, null, true);
  };
  L.progress = () => { const a = G().act; if (!a || !a.dur) return 0; return U.clamp((G().time.t - a.t0) / a.dur, 0, 1); };

  // ---------- ciclo por minuto ----------
  let warnCd = {};
  SL.bus.on('tick:minute', () => {
    const G0 = G(); if (!G0) return;
    const n = G0.needs, a = G0.act, def0 = a ? ACT[a.id] : null;
    const k = SL.State.DIFF[G0.player.diff].needs;
    const sleeping = def0 && def0.sleep;
    // fome e sede caem 2,5x mais devagar que na primeira versão (pedido do dono)
    const d = { fome: -(sleeping ? 0.92 : 2) / 60 * k, sede: -(sleeping ? 1.12 : 2.8) / 60 * k, energia: sleeping ? 0 : -3.8 / 60 * k };
    if (def0 && def0.fx) for (const key in def0.fx) d[key] = (d[key] || 0) + def0.fx[key] / 60;
    // cansaço: horas acordado, computador sem pausa, café, fome e sede
    const lf = G0.life || (G0.life = { awake: 0, pcRun: 0, offPc: 0, caf: 0, warnT: -9999 });
    if (sleeping) { lf.pcRun = 0; } else {
      lf.awake++;
      if (lf.awake > 16 * 60) d.energia -= (lf.awake - 16 * 60) / 60 * 0.6 / 60;
      const atPc = def0 && def0.pc;
      if (atPc) { lf.pcRun++; lf.offPc = 0; } else if (++lf.offPc >= 10) lf.pcRun = 0;
      if (lf.pcRun > 90) d.energia -= 2 / 60;
      if (n.fome < 8 || n.sede < 8) d.energia -= 6 / 60;
      if (lf.caf > 0) { if (d.energia < 0) d.energia *= 0.5; if (--lf.caf === 0) d.energia -= 6; }
    }
    L.mod(d);
    // atividade
    if (a) {
      let r = null;
      if (def0 && def0.minute) r = def0.minute(a);
      if (r === 'fim' || (a.dur && G0.time.t - a.t0 >= a.dur)) L.stop(true);
    }
    // cansaço total: dorme onde estiver
    if (n.energia <= 0.5 && !(G0.act && ACT[G0.act.id].sleep)) {
      if (G0.act && G0.act.id === 'live' && SL.Live) SL.Live.forceEnd('sono');
      if (SL.Seq) SL.Seq.cancel();
      L.stop(false);
      L.start('dormir', { until: G0.time.t + 360, floor: G0.loc.area === 'casa' }, { label: 'Apagou de sono' });
      SL.notify({ cat: 'vida', icon: 'sleep', title: 'Você apagou de sono', text: 'O corpo cobrou a conta. Vai dormir umas horas onde está.' });
    }
    // morrendo de sono no computador: cochila na cadeira
    if (!sleeping && L.tiredLevel() >= 3 && def0 && def0.pc && def0.id !== 'live' && U.rand() < 0.006) {
      L.stop(false); L.start('cochilar', { dur: 25 }, { label: 'Cochilou na cadeira' });
      SL.notify({ cat: 'vida', icon: 'sleep', title: 'Você cochilou na cadeira', text: 'Apagou uns minutos na frente do computador. Vá dormir na cama.' });
    }
    // avisos (no máximo um a cada 3 horas por necessidade)
    const now = G0.time.t;
    if (!sleeping && now - lf.warnT > 240 && L.tiredLevel() >= 2) { lf.warnT = now; SL.notify({ cat: 'vida', icon: 'sleep', title: L.tiredLevel() >= 3 ? 'Você está morrendo de sono' : 'Você está com sono', text: 'Acordado(a) há ' + L.awakeHours() + 'h. Anda mais devagar e rende menos. Durma ou tome um café.' }); }
    [['fome', 15, 'Você está com fome', 'Abra a geladeira ou peça comida pelo celular.'], ['sede', 15, 'Você está com sede', 'Beba água na pia da cozinha.']].forEach(([key, lim, t, tx]) => {
      if (n[key] < lim && (!warnCd[key] || now - warnCd[key] > 180)) { warnCd[key] = now; SL.notify({ cat: 'vida', icon: L.NEEDS.find(x => x.k === key).icon, title: t, text: tx }); }
    });
  });

  SL.bus.on('tick:day', day => {
    const G0 = G(); if (!G0) return;
    // comida estraga
    const spoiled = [];
    for (const id in G0.home.food) {
      const before = G0.home.food[id].length;
      G0.home.food[id] = G0.home.food[id].filter(e => e > day);
      if (G0.home.food[id].length < before) spoiled.push((D.foodById(id) || {}).name);
      if (!G0.home.food[id].length) delete G0.home.food[id];
    }
    if (spoiled.length) SL.notify({ cat: 'vida', icon: 'fridge', title: 'Comida estragou', text: spoiled.join(', ') + ' passou da validade.' });
    // casa suja
    G0.home.dirt = U.clamp(G0.home.dirt + 6, 0, 100);
    if (G0.home.dirt > 70 && day % 3 === 0) SL.notify({ cat: 'vida', icon: 'broom', title: 'A casa está bagunçada', text: 'Casa suja deixa o humor baixo e aparece na câmera.' });
    // plantas
    const plants = G0.home.deco.filter(x => x === 'planta').length;
    if (plants) {
      const last = G0.home.plants.last != null ? G0.home.plants.last : day;
      if (G0.home.plants.last == null) G0.home.plants.last = day;
      if (day - last >= 7) {
        const i = G0.home.deco.indexOf('planta'); if (i >= 0) G0.home.deco.splice(i, 1);
        G0.home.plants.last = day;
        SL.notify({ cat: 'vida', icon: 'plant', title: 'Uma planta morreu', text: 'Ela ficou uma semana sem água.' });
        SL.bus.emit('home');
      }
    }
  });
})(window.SL);

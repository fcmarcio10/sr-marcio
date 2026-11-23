/* IA dos espectadores: cada pessoa conhecida tem identidade, personalidade, gostos, horário, fidelidade e memória.
   Arquitetura híbrida: até V.CAP pessoas detalhadas e salvas; o resto do público é agregado (números). */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const V = SL.Viewers = {};
  const G = () => SL.G;
  V.CAP = 1000;
  let index = null, indexLen = -1;

  V.list = () => G().viewers.list;
  V.reindex = () => { index = new Map(); V.list().forEach(v => index.set(v.id, v)); indexLen = V.list().length; };
  V.byId = id => { if (!index || indexLen !== V.list().length) V.reindex(); return index.get(id); };
  V.byUser = u => V.list().find(v => v.u === u);

  const WORDS = D.userBits;
  V.genIdentity = () => {
    const sx = U.rand() < 0.5 ? 'm' : 'f';
    const first = U.pick(sx === 'm' ? D.namesM : D.namesF), sur = U.pick(D.surnames);
    const f = U.stripAccents(first).toLowerCase(), s = U.stripAccents(sur).toLowerCase();
    const w = U.stripAccents(U.pick(WORDS.words)), suf = U.pick(WORDS.suf), pre = U.stripAccents(U.pick(WORDS.pre));
    const p = U.ri(0, 8);
    let u;
    switch (p) {
      case 0: u = f + '_' + suf; break;
      case 1: u = f + U.ri(80, 99); break;
      case 2: u = w + '_' + suf; break;
      case 3: u = (pre || 'eu') + f; break;
      case 4: u = f + s[0]; break;
      case 5: u = w + U.pick(['7', '22', '777', '01', '10', '13', '99']); break;
      case 6: u = f + '.' + s; break;
      case 7: u = f + suf; break;
      default: u = w + f; break;
    }
    u = u.replace(/[^a-z0-9_.]/g, '').slice(0, 18);
    if (V.list().some(v => v.u === u)) u += U.ri(2, 99);
    return { n: first + ' ' + sur, u, sx };
  };

  V.create = (opts = {}) => {
    const G0 = G();
    const catMods = D.archetypeByCat[opts.cat] || {};
    const a = opts.a || U.wkey(Object.fromEntries(Object.entries(D.archetypes).map(([k, ar]) => [k, ar.w * (catMods[k] || 1)])));
    const ar = D.archetypes[a];
    const idt = opts.identity || V.genIdentity();
    const cats = [...new Set(D.games.map(g => g.cat))];
    const favs = [];
    if (opts.cat && U.chance(0.75)) favs.push(opts.cat);
    while (favs.length < U.ri(2, 3)) { const c = U.pick(cats); if (!favs.includes(c)) favs.push(c); }
    const favGames = D.games.filter(g => favs.includes(g.cat));
    const hrBase = U.wkey({ noite: 50, tarde: 20, madrugada: 15, manha: 15 });
    const wealth = a === 'apoiador' ? U.wkey({ 2: 15, 3: 35, 4: 35, 5: 15 }) : U.wkey({ 1: 35, 2: 30, 3: 20, 4: 11, 5: 4 });
    const v = {
      id: 'v' + (G0.viewers.next++), n: idt.n, u: idt.u, sx: idt.sx, c: U.pick(D.nameColors), a,
      age: U.clamp(Math.round(18 + U.lognorm(2.0, 0.6)), 18, 64),
      tl: U.clamp(ar.tl * U.rf(0.6, 1.4), 0.01, 0.6), pa: U.clamp(ar.pa * U.rf(0.75, 1.25), 0.1, 1), tx: U.clamp(ar.tx * U.rf(0.6, 1.3), 0, 1),
      gen: U.clamp(ar.gen * U.rf(0.6, 1.4), 0, 1), w: +wealth,
      favs, fg: favGames.length ? U.pick(favGames).id : U.pick(D.games).id,
      hr: (D.viewerHours[hrBase] + U.ri(-2, 2) + 24) % 24,
      int: opts.int != null ? opts.int : U.rf(12, 38), loy: opts.loy || 0,
      fol: 0, sub: 0, subM: 0, mod: 0, ban: 0, npc: opts.npc || null,
      sty: { cp: U.clamp(ar.caps * U.rf(0.4, 1.6), 0, 0.8), lo: U.chance(0.4) ? 1 : 0, lg: U.ri(0, 6), pu: U.rf(0, 1), ty: U.chance(0.15) ? U.rf(0.02, 0.07) : 0, em: U.rf(0, 0.5) },
      m: { v: 0, f: SL.Clock.day(), l: -1, msg: 0, rep: 0, ign: 0, don: 0, ld: -1, saw: [], g: {}, prom: [], fight: 0, notes: [] },
      src: opts.src || 'descoberta',
      cr: a === 'criador' ? { h: idt.u.replace(/[._]/g, '') + 'tv', f: U.ri(30, 4000) } : null,
    };
    G0.viewers.list.push(v);
    if (index) { index.set(v.id, v); indexLen = G0.viewers.list.length; }
    return v;
  };

  // amigos e família que assistem como espectadores
  V.ensureNpcViewers = () => {
    const mk = (npc, a, u, opts) => {
      if (V.list().some(v => v.npc === npc)) return;
      const n = D.npcById(npc);
      const v = V.create({ a, npc, identity: { n: n.name, u, sx: n.gender === 'm' ? 'm' : 'f' }, int: 80, loy: 60, src: 'amigo' });
      Object.assign(v, opts || {});
    };
    mk('duda', 'comunicativo', 'duda.ramos', { tl: 0.35, gen: 0.5, w: 2, c: '#ffb547' });
    mk('rafa', 'especialista', 'rafa_tecinfo', { tl: 0.25, w: 2, c: '#62b6ff' });
    mk('mae', 'silencioso', 'celia_costuras', { tl: 0.12, sty: { cp: 0, lo: 0, lg: 3, pu: 1, ty: 0.03, em: 0.6 }, gen: 0.6, w: 2, c: '#ff8fc1' });
  };

  // memória curta de cada pessoa: guarda só o tipo (e um número), o texto é montado na hora
  V.NOTES = { ign: 'perguntou várias vezes e não foi respondido(a)', volta: 'voltou depois de {p} dias', boasvindas: 'foi bem recebido(a) na primeira live', ban: 'foi banido(a)', unf: 'deixou de seguir',
    semobrigado: 'doou e não foi agradecido(a)', promessa: 'ficou esperando uma promessa que não foi cumprida', dm: 'recebeu resposta carinhosa no Instagram' };
  V.note = (v, k, p) => { const n = v.m.notes; const i = n.findIndex(o => o.k === k); if (i >= 0) n.splice(i, 1); const o = { d: SL.Clock.day(), k }; if (typeof p === 'number') o.p = p; n.push(o); if (n.length > 6) n.shift(); };
  V.noteText = o => (V.NOTES[o.k] || o.x || o.k).replace('{p}', o.p);

  V.label = v => {
    if (v.npc) return v.npc === 'mae' ? 'Família' : 'Amigo(a)';
    if (v.ban) return 'Banido';
    if (v.mod) return 'Moderador';
    if (v.m.v >= 20 && v.loy >= 70) return 'Veterano';
    if (v.sub) return 'Inscrito';
    if (v.m.don >= 50) return 'Apoiador';
    if (v.loy >= 55) return 'Fã';
    if (v.m.v >= 3) return 'Recorrente';
    if (v.m.v <= 1) return 'Novo';
    return 'Visitante';
  };

  // Quem das pessoas conhecidas vai aparecer nesta live, e quando
  V.planAttendance = (live) => {
    const G0 = G(); const day = SL.Clock.day(); const hour = SL.Clock.hour();
    const game = D.gameById(live.game);
    const trust = 0.5 + G0.rep.confianca / 100;
    const out = [];
    V.list().forEach(v => {
      if (v.ban) return;
      let p;
      if (v.npc) {
        const r = G0.rel[v.npc]; const aff = r ? r.aff : 0;
        p = v.npc === 'mae' ? (G0.ch.pulso.livesN < 3 ? 0.55 : 0.12) : U.clamp(0.15 + aff / 140, 0, 0.75);
        if (G0.ch.pulso.livesN === 0) p = Math.max(p, 0.85);
      } else {
        if (!v.fol && v.int < 8) return;
        p = v.fol ? 0.06 + v.loy / 100 * 0.62 : 0.012 + v.int / 100 * 0.08;
        let diff = Math.abs(hour - v.hr); diff = Math.min(diff, 24 - diff);
        p *= 0.15 + 0.85 * Math.exp(-(diff * diff) / (2 * 3.2 * 3.2));
        p *= v.favs.includes(game.cat) ? 1.25 : 0.72;
        if (live.announced) p *= 1.3;
        if (live.promised && v.m.prom.length) p *= 1.5;
        p *= 0.4 + v.int / 100;
        if (v.m.l >= 0 && day - v.m.l > 14) p *= 0.6;
        if (v.m.ign >= 3) p *= 0.5;
        p *= trust;
        p = U.clamp(p, 0, 0.92);
      }
      if (U.chance(p)) {
        const mean = v.loy > 50 ? 10 : 24;
        const at = Math.min(Math.round(-Math.log(1 - U.rand() * 0.98) * mean), Math.round(live.planned * 0.8));
        out.push({ id: v.id, at });
      }
    });
    return out.sort((a, b) => a.at - b.at);
  };

  // alguém chegando pela descoberta: às vezes é uma pessoa que já veio antes e não segue
  V.discoveryArrival = (live, present) => {
    const game = D.gameById(live.game);
    if (U.chance(0.22)) {
      const cands = [];
      const list = V.list();
      for (let i = 0; i < 40 && list.length; i++) {
        const v = list[Math.floor(U.rand() * list.length)];
        if (!v.fol && !v.ban && !v.npc && !present.has(v.id) && v.int > 5 && v.favs.includes(game.cat)) cands.push(v);
      }
      if (cands.length) return U.pick(cands);
    }
    return V.create({ cat: game.cat, src: live.srcHint || 'descoberta' });
  };

  V.knownFollowers = () => V.list().reduce((s, v) => s + (v.fol ? 1 : 0), 0);

  // Ajustes depois da live (memória e fidelidade)
  V.afterLive = (live, attended) => {
    const day = SL.Clock.day();
    attended.forEach(st => {
      const v = V.byId(st.id); if (!v) return;
      const m = v.m;
      const absence = m.l >= 0 ? day - m.l : 0;
      m.v++; m.l = day; m.g[live.game] = (m.g[live.game] || 0) + 1;
      const sat = st.sat;
      const ar = D.archetypes[v.a] || { loy: 1 };
      let dl = (sat - 0.5) * 14 * ar.loy;
      if (st.replied) dl += 4 * ar.loy;
      if (st.asked && !st.replied) { m.ign++; dl -= 3; if (m.ign === 3) V.note(v, 'ign'); }
      else if (st.replied) m.ign = 0;
      if (st.mins >= 30) dl += 1.5;
      v.loy = U.clamp(v.loy + dl, 0, 100);
      v.int = U.clamp(v.int + (sat - 0.45) * 25 + (st.mins > 20 ? 4 : 0), 0, 100);
      if (absence > 20) V.note(v, 'volta', absence);
      if (st.welcomed && m.v === 1) V.note(v, 'boasvindas');
      if (st.banned) V.note(v, 'ban');
    });
  };

  // Ciclo diário: interesse cai, quem segue pode desistir, inscrições vencem, limpeza da lista
  SL.bus.on('tick:day', day => {
    const G0 = G(); if (!G0 || !G0.viewers.list.length) return;
    const lastContent = G0.ch.contentDays.length ? G0.ch.contentDays[G0.ch.contentDays.length - 1] : -99;
    const inactive = day - lastContent;
    const P = G0.ch.pulso;
    let unf = 0, subLost = 0;
    V.list().forEach(v => {
      if (v.npc) return;
      v.int = U.clamp(v.int - (v.fol ? 0.5 : 1.8), 0, 100);
      if (v.fol) {
        if (inactive > 4) v.loy = U.clamp(v.loy - 0.25 * Math.min(inactive, 20) / 4, 0, 100);
        if (v.loy < 8 && v.int < 12 && U.chance(0.015 + Math.max(0, inactive - 4) * 0.004)) { v.fol = 0; unf++; V.note(v, 'unf'); }
      }
      if (v.sub && day >= v.sub) {
        const renew = U.clamp(0.5 + v.loy / 250 + (G0.rep.confianca - 50) / 300, 0.2, 0.95);
        if (U.chance(renew) && P.afil) { v.sub = day + 30; v.subM++; P.bal += 3.95; }
        else { v.sub = 0; subLost++; }
      }
    });
    if (unf) { P.f = Math.max(0, P.f - unf); }
    // seguidores agregados (sem pessoa detalhada) também se perdem com inatividade ou reputação ruim
    const anon = Math.max(0, P.f - V.knownFollowers());
    const churn = anon * (0.0012 + Math.max(0, inactive - 3) * 0.0009 + Math.max(0, 45 - G0.rep.confianca) * 0.00008);
    const lost = Math.floor(churn) + (U.chance(churn % 1) ? 1 : 0);
    if (lost > 0) P.f = Math.max(0, P.f - lost);
    // inscrições agregadas (coortes)
    const keep = [];
    G0.ch.subCohorts.forEach(c => {
      if (day >= c.until) {
        const renew = Math.round(c.n * U.clamp(0.55 + (G0.rep.confianca - 50) / 250, 0.3, 0.9));
        if (renew > 0 && P.afil) { keep.push({ n: renew, until: day + 30 }); P.bal += renew * 3.95; }
        subLost += c.n - renew;
      } else keep.push(c);
    });
    G0.ch.subCohorts = keep;
    P.subs = V.list().filter(v => v.sub).length + keep.reduce((s, c) => s + c.n, 0);
    if (unf + lost >= 5) SL.notify({ cat: 'canal', icon: 'trendDown', title: 'Você perdeu seguidores', text: U.int(unf + lost) + ' pessoas deixaram de seguir o canal na Twitch' + (inactive > 4 ? ' (o canal está parado há ' + inactive + ' dias).' : '.'), silent: unf + lost < 20 });
    // quem veio uma vez e não voltou vira parte do público agregado (é esquecido)
    G0.viewers.list = G0.viewers.list.filter(v => v.npc || v.fol || v.sub || v.mod || v.ban || v.m.v >= 2 || v.m.don > 0 || v.int >= 15 || (v.m.l >= 0 && day - v.m.l < 7));
    // limpeza: mantém os mais relevantes
    const list = G0.viewers.list;
    if (list.length > V.CAP) {
      const score = v => (v.npc ? 1e6 : 0) + (v.fol ? 500 : 0) + (v.sub ? 300 : 0) + v.loy * 2 + v.int + v.m.don / 5 + v.m.v * 3 + (v.mod ? 1000 : 0);
      list.sort((a, b) => score(b) - score(a));
      list.length = V.CAP;
    }
    V.reindex();
  });
})(window.SL);

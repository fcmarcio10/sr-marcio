/* Economia: carteira, extrato, contas do mês, impostos, repasses das plataformas, empréstimos e patrimônio. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const E = SL.Econ = {};
  const G = () => SL.G;

  E.IN = { doacoes: 'Doações', inscricoes: 'Inscrições', anuncios: 'Anúncios em live', vision: 'Monetização YouTube', clipz: 'Fundo de criadores TikTok', patrocinio: 'Patrocínios', eventos: 'Eventos', produtos: 'Produtos próprios', trabalho: 'Trabalho e freelas', familia: 'Família', emprestimo: 'Empréstimo', venda: 'Vendas', outros: 'Outros' };
  E.OUT = { aluguel: 'Aluguel e moradia', energia: 'Energia', internet: 'Internet', comida: 'Alimentação', equipamentos: 'Equipamentos', casa: 'Casa e móveis', software: 'Softwares', equipe: 'Funcionários', transporte: 'Transporte', impostos: 'Impostos', lazer: 'Lazer', saude: 'Saúde', dividas: 'Dívidas e juros', manutencao: 'Manutenção', outros: 'Outros' };
  E.PLATFORM_INCOME = ['doacoes', 'inscricoes', 'anuncios', 'vision', 'clipz', 'patrocinio', 'eventos', 'produtos'];

  const month = key => { const m = G().month; return (m[key] = m[key] || { in: {}, out: {} }); };
  const log = (v, cat, desc) => {
    const G0 = G();
    G0.ledger.push({ t: G0.time.t, v: Math.round(v * 100) / 100, cat, desc });
    U.cap_list(G0.ledger, 260);
    const m = month(SL.Clock.monthKey());
    const side = v >= 0 ? m.in : m.out;
    side[cat] = (side[cat] || 0) + Math.abs(v);
  };

  E.add = (v, cat, desc) => {
    if (!v) return;
    G().money += v; log(v, cat || 'outros', desc || '');
    SL.bus.emit('money', v);
    if (v >= 50 && SL.audio) SL.audio.play('cash');
  };
  E.spend = (v, cat, desc, allowDebt) => {
    if (v <= 0) { if (v === 0 && desc) log(0, cat || 'outros', desc); return true; }
    if (!allowDebt && G().money < v) return false;
    G().money -= v; log(-v, cat || 'outros', desc || '');
    SL.bus.emit('money', -v);
    return true;
  };
  E.can = v => G().money >= v;

  // ---------- contas ----------
  E.overdueCount = () => { const d = SL.Clock.day(); return G().bills.filter(b => !b.paid && b.due < d).length; };
  E.pending = () => G().bills.filter(b => !b.paid).sort((a, b) => a.due - b.due);
  E.CONTAS = 0.7;   // nov/2026: aluguel, internet, energia e assinaturas 30% mais baratos (dinheiro mais fácil)
  const BARATO = { aluguel: 1, internet: 1, energia: 1, software: 1 };
  const addBill = (kind, name, amount, dueDay, cat, ref) => {
    if (BARATO[kind]) amount *= E.CONTAS;
    if (amount <= 0) return;
    const b = { id: U.uid('b'), kind, name, amount: Math.round(amount * 100) / 100, due: dueDay, paid: false, cat, late: 0, ref: ref || null, created: SL.Clock.day() };
    G().bills.push(b);
    if (SL.Calendar) SL.Calendar.add({ day: dueDay, kind: 'conta', title: name + ' vence', ref: b.id });
    return b;
  };
  E.addBill = addBill;

  E.taxableLastMonth = key => {
    const m = G().month[key]; if (!m) return 0;
    return E.PLATFORM_INCOME.reduce((s, c) => s + (m.in[c] || 0), 0);
  };
  E.monthlyCosts = () => {
    const G0 = G(); const diff = SL.State.DIFF[G0.player.diff];
    const home = D.homeById(G0.home.id);
    let sum = 0; const items = [];
    if (!G0.home.owned && home.rent) { const v = home.rent * diff.rent; items.push(['Aluguel', v]); sum += v; }
    if (G0.home.owned) { const v = Math.max(180, home.price * 0.0012); items.push(['Condomínio e IPTU', v]); sum += v; }
    const net = D.internet.find(n => n.id === G0.equip.net); items.push(['Internet', net.price]); sum += net.price;
    items.push(['Energia (estimada)', 45 + G0.stats.kwh * 0.95]); sum += 45 + G0.stats.kwh * 0.95;
    for (const id in G0.equip.soft) { const s = D.software.find(x => x.id === id); if (s && s.monthly) { items.push([s.name, s.price]); sum += s.price; } }
    G0.staff.forEach(st => { const n = D.npcById(st.npc); if (n && n.salary) { items.push(['Salário ' + n.short, n.salary]); sum += n.salary; } });
    G0.equip.vehicles.forEach(v => { const vv = D.vehicles.find(x => x.id === v); if (vv && vv.monthly) { items.push([vv.name, vv.monthly]); sum += vv.monthly; } });
    if (G0.gym) { items.push(['Academia (mensal)', 99]); sum += 99; }
    G0.loans.forEach(l => { if (l.left > 0) { items.push(['Parcela do empréstimo', l.inst]); sum += l.inst; } });
    items.forEach(it => { if (/^(Aluguel|Condomínio|Internet|Energia)/.test(it[0]) || (D.software.some(s => s.name === it[0]))) it[1] *= E.CONTAS; });
    return { sum: items.reduce((s, it) => s + it[1], 0), items };
  };

  E.createMonthlyBills = day => {
    const G0 = G(); const diff = SL.State.DIFF[G0.player.diff];
    const home = D.homeById(G0.home.id);
    const mk = SL.Clock.monthKey(day * 1440);
    if (G0.flags['bills_' + mk]) return;
    G0.flags['bills_' + mk] = 1;
    const dd = dom => SL.Clock.dayForDayOfMonth(day, dom);
    if (!G0.home.owned && home.rent) addBill('aluguel', 'Aluguel de ' + SL.Clock.MON[SL.Clock.date(day * 1440).getUTCMonth()], home.rent * diff.rent, dd(10), 'aluguel');
    if (G0.home.owned) addBill('aluguel', 'Condomínio e IPTU', Math.max(180, home.price * 0.0012), dd(10), 'aluguel');
    const net = D.internet.find(n => n.id === G0.equip.net);
    addBill('internet', 'Internet (' + net.name + ')', net.price, dd(15), 'internet');
    if (day > 0) addBill('energia', 'Conta de energia', 45 + G0.stats.kwh * 0.95, dd(20), 'energia');
    G0.stats.kwh = 0;
    let soft = 0; for (const id in G0.equip.soft) { const s = D.software.find(x => x.id === id); if (s && s.monthly) soft += s.price; }
    if (soft) addBill('software', 'Assinaturas de software', soft, dd(12), 'software');
    G0.staff.forEach(st => { const n = D.npcById(st.npc); if (n && n.salary) addBill('equipe', 'Salário de ' + n.short, n.salary, dd(5), 'equipe', st.npc); });
    G0.equip.vehicles.forEach(v => { const vv = D.vehicles.find(x => x.id === v); if (vv && vv.monthly) addBill('transporte', 'Custos do ' + vv.name.toLowerCase(), vv.monthly, dd(8), 'transporte'); });
    if (G0.gym) addBill('lazer', 'Mensalidade da academia', 99, dd(7), 'lazer');
    G0.loans.forEach(l => { if (l.left > 0) { addBill('emprestimo', 'Parcela do empréstimo (' + (l.n - l.left + 1) + '/' + l.n + ')', l.inst, dd(18), 'dividas', l.id); l.left--; } });
    // imposto sobre a renda das plataformas do mês anterior
    const prev = SL.Clock.monthKey(day * 1440 - 1440 * 3);
    const income = E.taxableLastMonth(prev);
    let tax = 0;
    if (G0.flags.mei) {
      const year = Object.keys(G0.month).filter(k => k.slice(0, 4) === prev.slice(0, 4)).reduce((s, k) => s + E.taxableLastMonth(k), 0);
      tax = year > 81000 ? income * 0.08 : 76;
    } else if (income > 2259) tax = (income - 2259) * 0.15;
    if (tax > 0) addBill('impostos', G0.flags.mei ? 'Imposto do MEI' : 'Imposto de renda (carnê-leão)', tax, dd(20), 'impostos');
    SL.bus.emit('bills');
  };

  E.pay = id => {
    const b = G().bills.find(x => x.id === id); if (!b || b.paid) return false;
    const total = b.amount + b.late;
    if (!E.spend(total, b.cat, b.name + (b.late ? ' (com multa)' : ''))) return false;
    b.paid = true; b.paidT = G().time.t;
    if (SL.Calendar) SL.Calendar.removeRef(b.id);
    SL.bus.emit('bills');
    return true;
  };
  E.payAll = () => { let n = 0; E.pending().forEach(b => { if (E.pay(b.id)) n++; }); return n; };

  // ---------- empréstimos ----------
  E.creditLimit = () => {
    const G0 = G(); if (E.overdueCount() > 1) return 0;
    const keys = Object.keys(G0.month).sort().slice(-3);
    const avg = keys.length ? keys.reduce((s, k) => s + E.taxableLastMonth(k) + ((G0.month[k].in.trabalho) || 0), 0) / keys.length : 0;
    const debt = G0.loans.reduce((s, l) => s + l.inst * l.left, 0);
    return Math.max(0, Math.round((1500 + avg * 2.5 + G0.rep.credibilidade * 20 - debt) / 100) * 100);
  };
  E.loanTake = (amount, months) => {
    if (amount > E.creditLimit() || amount <= 0) return false;
    const r = 0.035; const inst = amount * r / (1 - Math.pow(1 + r, -months));
    G().loans.push({ id: U.uid('l'), amount, n: months, left: months, inst: Math.round(inst * 100) / 100, t: G().time.t });
    E.add(amount, 'emprestimo', 'Empréstimo do Bank');
    return true;
  };

  // ---------- patrimônio ----------
  E.netWorth = () => {
    const G0 = G(); let v = G0.money;
    for (const id in G0.equip.owned) { const it = D.equipById(id); if (it) v += it.price * 0.45 * (G0.equip.owned[id].cond / 100); }
    for (const slot in G0.home.items) { const f = D.furnById(G0.home.items[slot]); if (f) v += f.price * 0.3; }
    G0.home.deco.forEach(id => { const f = D.furnById(id); if (f) v += f.price * 0.25; });
    if (G0.home.owned) v += D.homeById(G0.home.id).price + (G0.home.studio ? D.STUDIO_COST * 0.8 : 0);
    G0.equip.vehicles.forEach(id => { const x = D.vehicles.find(y => y.id === id); if (x) v += x.price * 0.7; });
    v += G0.ch.pulso.bal + G0.ch.vision.bal + G0.ch.clipz.bal;
    v -= G0.loans.reduce((s, l) => s + l.inst * l.left, 0);
    v -= E.pending().reduce((s, b) => s + b.amount + b.late, 0);
    return v;
  };

  // ---------- ciclos ----------
  SL.bus.on('tick:minute', () => {
    const G0 = G(); if (!G0) return;
    const a = G0.act;
    if (a && SL.Life.ACT[a.id] && SL.Life.ACT[a.id].pc) {
      const pc = D.equipById(G0.equip.setup.computador);
      G0.stats.kwh += ((pc ? pc.w : 60) + 40) / 60000;
      G0.stats.pcMin++;
    }
    if (a && (a.id === 'tv' || a.id === 'videogame')) G0.stats.kwh += 150 / 60000;
  });

  SL.bus.on('tick:day', day => {
    const G0 = G(); if (!G0) return;
    G0.stats.kwh += 3.2; // geladeira, luz etc.
    if (SL.Clock.dayOfMonth(day * 1440) === 1) E.createMonthlyBills(day);
    // vencimentos
    G0.bills.forEach(b => {
      if (b.paid) return;
      if (b.due === day + 1) SL.notify({ cat: 'dinheiro', icon: 'calendar', title: 'Conta vence amanhã', text: b.name + ': ' + U.money(b.amount), app: 'banco' });
      if (b.due <= day && G0.autopay && G0.money >= b.amount + b.late) { E.pay(b.id); SL.notify({ cat: 'dinheiro', icon: 'check', title: 'Débito automático', text: b.name + ' paga: ' + U.money(b.amount), silent: true }); return; }
      if (b.due < day) {
        if (!b.lateNotified) { b.lateNotified = 1; b.late += b.amount * 0.02; SL.notify({ cat: 'dinheiro', icon: 'alert', title: 'Conta atrasada', text: b.name + ' venceu. Multa de 2% e juros por dia.', app: 'banco' }); if (SL.Rep) SL.Rep.mod({ credibilidade: -0.5 }); }
        b.late += b.amount * 0.0033;
        if (b.kind === 'aluguel' && day - b.due === 25) SL.notify({ cat: 'dinheiro', icon: 'alert', title: 'Aviso de despejo', text: 'O proprietário avisou: mais 15 dias sem pagar o aluguel e você terá que sair.', app: 'banco' });
        if (b.kind === 'aluguel' && day - b.due >= 40 && !G0.home.owned && SL.Home) SL.Home.evict(b);
        if (b.kind === 'internet' && day - b.due >= 20 && !G0.flags.netCut) { G0.flags.netCut = 1; SL.notify({ cat: 'dinheiro', icon: 'wifiOff', title: 'Internet cortada', text: 'Pague a conta de internet para voltar a transmitir.', app: 'banco' }); }
      }
    });
    if (G0.flags.netCut && !G0.bills.some(b => b.kind === 'internet' && !b.paid)) G0.flags.netCut = 0;
    // limpa contas antigas pagas
    G0.bills = G0.bills.filter(b => !b.paid || day - SL.Clock.day(b.paidT || 0) < 45);
    // repasses das plataformas
    const P = G0.ch;
    if (P.pulso.bal >= 1 && !(SL.Live && SL.Live.cur)) { const v = P.pulso.bal; P.pulso.bal = 0; E.add(v, 'doacoes', 'Repasse da Twitch'); SL.notify({ silent: true, cat: 'dinheiro', icon: 'money', title: 'Repasse da Twitch', text: U.money(v) + ' caiu na conta (inscrições renovadas).', app: 'banco' }); }
    if (P.vision.bal >= 10) { const v = P.vision.bal; P.vision.bal = 0; E.add(v, 'vision', 'Pagamento do YouTube'); SL.notify({ cat: 'dinheiro', icon: 'vision', title: 'Pagamento do YouTube', text: U.money(v) + ' pela monetização dos vídeos.', app: 'banco' }); }
    if (P.clipz.bal >= 10) { const v = P.clipz.bal; P.clipz.bal = 0; E.add(v, 'clipz', 'Fundo de criadores do TikTok'); SL.notify({ cat: 'dinheiro', icon: 'clip', title: 'Pagamento do TikTok', text: U.money(v) + ' do fundo de criadores.', app: 'banco' }); }
    // registro diário
    const st = G0.stats;
    st.days.push({ d: day, f: { p: P.pulso.f, v: P.vision.f, c: P.clipz.f, n: P.connect.f }, m: Math.round(G0.money), nw: Math.round(E.netWorth()), subs: P.pulso.subs, views: P.vision.views + P.clipz.views });
    U.cap_list(st.days, 400);
  });

  SL.bus.on('newgame', () => { E.createMonthlyBills(0); });
})(window.SL);

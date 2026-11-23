/* App Bank: saldo, contas, extrato, resumo do mês, empréstimo, patrimônio e MEI. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const ic = UI.ic, esc = U.esc;
  SL.Apps.banco = {
    title: 'Bank', short: 'Bank', icon: 'bank', color: 'linear-gradient(135deg,#35d39a,#0f766e)', order: 8, pc: true, phone: true, w: 900, h: 660,
    watch: ['money', 'bills'],
    badge: () => SL.Econ.overdueCount() || 0,
    render(el, ctx) {
      const st = ctx.st; st.tab = st.tab || 'inicio';
      const tabs = [['inicio', 'Início'], ['contas', 'Contas'], ['extrato', 'Extrato'], ['credito', 'Crédito'], ['patrimonio', 'Patrimônio']];
      el.innerHTML = `<div class="app"><div class="app-head"><div class="brandbar"><span class="bl" style="background:#0f766e">${ic('bank', 15)}</span>Bank</div><div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${st.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${l}</button>`).join('')}</div></div><div class="app-body">${this[st.tab](ctx)}</div></div>`;
      const cv = el.querySelector('#bk-ch'); if (cv) { const days = SL.G.stats.days.slice(-30); UI.chart(cv, [{ data: days.map(d => d.m), color: '#35d39a' }, { data: days.map(d => d.nw), color: '#4cc3ff', fill: false }], { labels: days.map(d => SL.Clock.fmtDay(d.d).slice(5)) }); }
    },
    inicio() {
      const G = SL.G; const mk = SL.Clock.monthKey(); const m = G.month[mk] || { in: {}, out: {} };
      const tin = Object.values(m.in).reduce((a, b) => a + b, 0), tout = Object.values(m.out).reduce((a, b) => a + b, 0);
      const P = G.ch; const pend = SL.Econ.pending();
      const mc = SL.Econ.monthlyCosts();
      return `<div class="balance"><div class="upper" style="color:#9fe8cc">Saldo disponível</div><b class="${G.money < 0 ? 'bad' : ''}">${U.money(G.money)}</b><div class="small" style="color:#9fe8cc">A receber das plataformas: ${U.money(P.pulso.bal + P.vision.bal + P.clipz.bal)}</div></div>
        <div class="statrow"><div class="card stat"><b class="ok">${U.money0(tin)}</b><span>Entrou este mês</span></div><div class="card stat"><b class="bad">${U.money0(tout)}</b><span>Saiu este mês</span></div><div class="card stat"><b>${U.money0(mc.sum)}</b><span>Custo fixo mensal</span></div><div class="card stat"><b class="${pend.some(b => b.due < SL.Clock.day()) ? 'bad' : ''}">${pend.length}</b><span>Contas em aberto</span></div></div>
        <div class="card"><h3>Saldo e patrimônio (30 dias)</h3>${G.stats.days.length > 1 ? '<canvas class="chart" id="bk-ch"></canvas><div class="tiny muted"><span style="color:#35d39a">saldo</span> · <span style="color:#4cc3ff">patrimônio</span></div>' : '<div class="small muted">O gráfico aparece depois do primeiro dia.</div>'}</div>
        <div class="grid2" style="align-items:start"><div class="card"><h3>Receitas do mês</h3><div class="kv">${Object.keys(m.in).length ? Object.entries(m.in).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span>${esc(SL.Econ.IN[k] || k)}</span><span class="ok">${U.money(v)}</span>`).join('') : '<span>Nada ainda</span><span></span>'}</div></div><div class="card"><h3>Despesas do mês</h3><div class="kv">${Object.keys(m.out).length ? Object.entries(m.out).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span>${esc(SL.Econ.OUT[k] || k)}</span><span class="bad">${U.money(v)}</span>`).join('') : '<span>Nada ainda</span><span></span>'}</div></div></div>
        <div class="card"><h3>Custos fixos previstos</h3><div class="kv">${mc.items.map(([n, v]) => `<span>${esc(n)}</span><span>${U.money(v)}</span>`).join('')}</div></div>`;
    },
    contas() {
      const G = SL.G; const pend = SL.Econ.pending(); const day = SL.Clock.day();
      return `<div class="row between"><label class="row small"><input type="checkbox" data-act="auto" ${G.autopay ? 'checked' : ''}> Débito automático no vencimento (se tiver saldo)</label>${pend.length ? `<button class="btn sm primary" data-act="payall">Pagar todas (${U.money0(pend.reduce((s, b) => s + b.amount + b.late, 0))})</button>` : ''}</div>
        <div class="col">${pend.length ? pend.map(b => `<div class="bill ${b.due < day ? 'late' : ''}"><span class="acc">${ic(b.kind === 'aluguel' ? 'home' : b.kind === 'internet' ? 'wifi' : b.kind === 'energia' ? 'energy' : b.kind === 'impostos' ? 'bank' : b.kind === 'equipe' ? 'team' : 'money', 18)}</span><div class="grow"><b class="small">${esc(b.name)}</b><div class="tiny ${b.due < day ? 'bad' : 'muted'}">${b.due < day ? 'Atrasada desde ' : 'Vence '}${SL.Clock.fmtDay(b.due)}${b.late ? ' · multa e juros: ' + U.money(b.late) : ''}</div></div><b class="mono">${U.money(b.amount + b.late)}</b><button class="btn sm" data-act="pay" data-v="${b.id}" ${G.money < b.amount + b.late ? 'disabled' : ''}>Pagar</button></div>`).join('') : '<div class="empty">Nenhuma conta em aberto.</div>'}</div>
        <div class="card col"><h3>Impostos</h3><p class="small muted">${G.flags.mei ? 'Você tem MEI: paga R$ 76 por mês enquanto faturar até R$ 81 mil no ano (acima disso, 8%).' : 'Sem empresa, a renda das plataformas paga carnê-leão: 15% do que passar de R$ 2.259 por mês.'}</p>${G.flags.mei ? '<span class="tag ok">MEI ativo</span>' : '<button class="btn sm" data-act="mei">Abrir MEI (grátis)</button>'}</div>`;
    },
    extrato() {
      const G = SL.G; const list = G.ledger.slice().reverse();
      return `<div class="card">${list.length ? list.map(t => `<div class="tx"><span class="${t.v >= 0 ? 'ok' : 'bad'}">${ic(t.v >= 0 ? 'trend' : 'trendDown', 15)}</span><div class="grow"><div class="small">${esc(t.desc)}</div><div class="tiny muted">${SL.Clock.fmtStamp(t.t)} · ${esc((t.v >= 0 ? SL.Econ.IN : SL.Econ.OUT)[t.cat] || t.cat)}</div></div><span class="v ${t.v >= 0 ? 'ok' : 'bad'}">${t.v >= 0 ? '+' : ''}${U.money(t.v)}</span></div>`).join('') : '<div class="empty">Sem movimentações.</div>'}</div>`;
    },
    credito() {
      const G = SL.G; const lim = SL.Econ.creditLimit();
      return `<div class="card col"><h3>Empréstimo pessoal</h3><p class="small muted">Juros de 3,5% ao mês. O limite depende da sua renda e da credibilidade. Parcela atrasada vira dívida com multa.</p><div class="stat"><b>${U.money0(lim)}</b><span>Limite disponível</span></div>
        <div class="row wrap">${[500, 1000, 2500, 5000, 10000, 25000].filter(v => v <= lim).map(v => [6, 12].map(n => { const inst = v * 0.035 / (1 - Math.pow(1.035, -n)); return `<button class="btn sm" data-act="loan" data-v="${v}" data-n="${n}">${U.money0(v)} em ${n}x de ${U.money0(inst)}</button>`; }).join('')).join('') || '<span class="small muted">Sem limite agora. Aumente sua renda e pague as contas em dia.</span>'}</div></div>
        <div class="card"><h3>Empréstimos ativos</h3>${G.loans.filter(l => l.left > 0).map(l => `<div class="tx"><div class="grow small">${U.money(l.amount)} em ${l.n}x</div><span class="v">${l.left} parcelas de ${U.money(l.inst)}</span></div>`).join('') || '<div class="small muted">Nenhum.</div>'}</div>`;
    },
    patrimonio() {
      const G = SL.G; const eqv = Object.keys(G.equip.owned).reduce((s, id) => { const it = D.equipById(id); return s + (it ? it.price * 0.45 * G.equip.owned[id].cond / 100 : 0); }, 0);
      const home = G.home.owned ? D.homeById(G.home.id).price : 0;
      return `<div class="balance" style="background:linear-gradient(135deg,#1b2a4a,#12171f 60%);border-color:#2a4a7a"><div class="upper" style="color:#9ec8ff">Patrimônio líquido</div><b>${U.money(SL.Econ.netWorth())}</b></div>
        <div class="card"><div class="kv"><span>Dinheiro</span><span>${U.money(G.money)}</span><span>Equipamentos (valor de revenda)</span><span>${U.money(eqv)}</span><span>Imóvel próprio</span><span>${U.money(home)}</span><span>Veículos</span><span>${U.money(G.equip.vehicles.reduce((s, id) => s + D.vehicles.find(v => v.id === id).price * 0.7, 0))}</span><span>A receber das plataformas</span><span>${U.money(G.ch.pulso.bal + G.ch.vision.bal + G.ch.clipz.bal)}</span><span>Dívidas e contas em aberto</span><span class="bad">-${U.money(G.loans.reduce((s, l) => s + l.inst * l.left, 0) + SL.Econ.pending().reduce((s, b) => s + b.amount + b.late, 0))}</span></div></div>`;
    },
    act(a, ds, ctx, ev, t) {
      const G = SL.G;
      if (a === 'tab') { ctx.st.tab = ds.t; return ctx.render(); }
      if (a === 'pay') { if (!SL.Econ.pay(ds.v)) return 'Saldo insuficiente.'; SL.audio.play('cash'); return ctx.render(); }
      if (a === 'payall') { const n = SL.Econ.payAll(); UI.toast({ title: n + ' contas pagas', icon: 'check', cat: 'dinheiro' }, null, true); return ctx.render(); }
      if (a === 'auto') { G.autopay = t.checked; return; }
      if (a === 'mei') { G.flags.mei = 1; SL.Rep.mod({ credibilidade: 4 }); UI.toast({ title: 'MEI aberto', text: 'Marcas confiam mais em quem emite nota fiscal.', icon: 'brief', cat: 'dinheiro' }, 'success'); return ctx.render(); }
      if (a === 'loan') return UI.confirm('Confirmar empréstimo', 'Pegar ' + U.money(+ds.v) + ' em ' + ds.n + ' parcelas?', () => { if (!SL.Econ.loanTake(+ds.v, +ds.n)) UI.err('Limite insuficiente.'); ctx.render(); }, 'Pegar empréstimo');
    },
  };
})(window.SL);

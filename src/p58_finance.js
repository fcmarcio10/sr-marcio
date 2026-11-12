
/* ============================ BANCO (EMPRÉSTIMO) E FIADO DO SEU ZÉ ============================
   Um "dia" do jogo é uma noite inteira (19:30 até 05:00). A parcela vence a cada virada de noite e é
   descontada sozinha. Sem saldo, a parcela atrasa, ganha juros e é descontada assim que entrar dinheiro.
   O Seu Zé faz fiado quando você não tem dinheiro; ele cobra sozinho na virada da noite e, se atrasar,
   bota juros. Com fiado em aberto, ele não vem de novo sem acertar a caderneta. */
const BANK = 'Banestresse';
const LOAN_AMOUNTS = [500, 1000, 2000];
const LOAN_PLANS = [{ n: 3, rate: 0.06 }, { n: 5, rate: 0.12 }, { n: 8, rate: 0.2 }];
const LOAN_LATE = 0.10; // juros por noite de atraso, sobre o que está atrasado
const FIADO_LATE = 0.05; // o Seu Zé é amigo: juros menores
const ZE_FIADO_NAO = [
  'Ô meu filho... ainda tem R$ {v} pendurado na caderneta. Fiado é igual sogra: uma vez a gente aguenta, duas já é abuso. Acerta o de antes que eu vou correndo!',
  'Rapaz, a caderneta tá tão cheia com teu nome que minha mulher achou que eu tinha outra família. R$ {v} ainda! Acerta comigo primeiro.',
  'Meu guincho anda a diesel, não a promessa. Tem R$ {v} no fiado. Pega um empréstimo no Banestresse, faz umas corridas, vende o rim... aí eu vou.',
  'Fiado só amanhã. E amanhã também é amanhã. Brincadeira... mas não muito: são R$ {v} ainda, viu? Paga que eu vou voando.',
  'Até o papagaio da oficina já aprendeu a falar teu nome e "cadê o dinheiro". R$ {v}, meu querido. Primeiro acerta, depois eu socorro.',
];
function brl(v) { return 'R$ ' + fmtMoney(Math.round(v)); }
function bankMsg(text, silent) { return addMsg(BANK, '', text, silent); }
const Finance = { t: 0 };
function loanPlan(amount, plan) { const total = Math.round(amount * (1 + plan.rate)); return { total, parcela: Math.ceil(total / plan.n) }; }
function takeLoan(amount, n) {
  if (Profile.loan) return false;
  const plan = LOAN_PLANS.find((p) => p.n === n), q = loanPlan(amount, plan);
  Profile.loan = { amount, n, parcela: q.parcela, total: q.total, billed: 0, paid: 0, overdue: 0, paidAmt: 0, lateFees: 0, day: Profile.nights || 0 };
  Profile.money += amount; UI.moneyDelta(amount); AudioSys.money();
  toast('Empréstimo aprovado', brl(amount) + ' na conta. ' + n + 'x de ' + brl(q.parcela) + ', descontadas a cada noite.', 'good');
  bankMsg('Parabéns! Seu empréstimo de ' + brl(amount) + ' foi aprovado em 0,3 segundos, sem consulta, sem fiador e sem vergonha. Serão ' + n + ' parcelas de ' + brl(q.parcela) + ', descontadas sozinhas toda virada de noite. Banestresse: o banco que te estressa, mas te empresta.', true);
  saveGame(); return true;
}
function loanLeft(L) { return L.overdue + Math.max(0, L.n - L.billed) * L.parcela; }
// desconta o que estiver atrasado, se der
function loanTryPay(fromNewDay) {
  const L = Profile.loan; if (!L || L.overdue < 1) return;
  const amt = Profile.money >= L.overdue ? L.overdue : Profile.money >= Math.min(L.overdue, L.parcela) ? Math.min(L.overdue, L.parcela) : 0;
  if (amt <= 0) return;
  const v = Math.ceil(amt);
  Profile.money -= v; UI.moneyDelta(-v); L.overdue = Math.max(0, L.overdue - v); L.paidAmt += v;
  const done = L.billed >= L.n && L.overdue < 1;
  if (done) {
    Profile.loan = null; Profile.loansPaid = (Profile.loansPaid || 0) + 1;
    toast('Empréstimo quitado!', 'Banestresse descontou ' + brl(v) + '. Você está livre!', 'good');
    bankMsg('QUITADO! Última parcela de ' + brl(v) + ' descontada. Você saiu do vermelho, parabéns. Já pré-aprovamos outro empréstimo pra você, porque a gente sente saudade.', false);
  } else {
    const falta = L.n - L.billed;
    toast('Banestresse', 'Parcela descontada: ' + brl(v) + (L.overdue >= 1 ? ' · ainda atrasado ' + brl(L.overdue) : ''), 'info');
    bankMsg((fromNewDay ? 'Parcela do dia descontada: ' : 'Opa, entrou dinheiro! Já descontamos a parcela atrasada: ') + brl(v) + '. ' + (L.overdue >= 1 ? 'Ainda tem ' + brl(L.overdue) + ' em atraso. ' : 'Tudo em dia. ') + 'Faltam ' + falta + ' parcela(s) a vencer.', true);
  }
  saveGame();
}
// cobra o Seu Zé: paga o que tiver e o resto vai pra caderneta (se puder)
function zeCharge(cost, allowFiado) {
  cost = Math.ceil(cost);
  const has = Math.max(0, Math.floor(Profile.money));
  const paid = Math.min(has, cost), owed = cost - paid;
  if (owed > 0 && !allowFiado) return null;
  Profile.money -= paid; if (paid) UI.moneyDelta(-paid);
  if (owed > 0) {
    if (!Profile.fiado) Profile.fiado = { amount: 0, day: Profile.nights || 0, count: 0 };
    Profile.fiado.amount += owed; Profile.fiado.day = Profile.nights || 0; Profile.fiado.count++;
  }
  return { paid, owed };
}
function fiadoOpen() { return !!(Profile.fiado && Profile.fiado.amount >= 1); }
function fiadoPay(manual) {
  const F = Profile.fiado; if (!F) return 0;
  const v = Math.min(Math.ceil(F.amount), Math.max(0, Math.floor(Profile.money)));
  if (v <= 0) return 0;
  Profile.money -= v; UI.moneyDelta(-v); F.amount -= v;
  if (F.amount < 1) { Profile.fiado = null; addMsg(ZE, '', manual ? 'Recebido, ' + brl(v) + '! Caderneta zerada, pode rasgar a página. Tamo quite!' : 'Peguei os ' + brl(v) + ' do fiado, como combinado. Tamo quite! Pode quebrar o carro de novo... mas não muito, hein.', !manual); }
  else addMsg(ZE, '', 'Peguei ' + brl(v) + ' do fiado. Ainda falta ' + brl(F.amount) + ', sem pressa (com um pouquinho de pressa).', true);
  saveGame();
  return v;
}
// virada da noite: vence parcela, aplica juros e cobra o fiado
Finance.newDay = function () {
  const L = Profile.loan;
  if (L) {
    if (L.overdue >= 1) {
      charVoice('banco_atraso');
      const j = Math.ceil(L.overdue * LOAN_LATE); L.overdue += j; L.lateFees += j;
      bankMsg('Prezado(a) cliente, sua parcela continua atrasada. Aplicamos juros de ' + Math.round(LOAN_LATE * 100) + '% (' + brl(j) + '). Total em atraso: ' + brl(L.overdue) + '. Assim que entrar dinheiro, a gente desconta sozinho. Banestresse: a gente não esquece. Nunca.', false);
    }
    if (L.billed < L.n) {
      L.billed++; L.overdue += L.parcela;
      if (Profile.money < Math.min(L.overdue, L.parcela)) {
        bankMsg('Parcela ' + L.billed + '/' + L.n + ' venceu hoje (' + brl(L.parcela) + ') e o saldo tá zerado. Vai entrar juros amanhã se não pagar. Fica tranquilo: quando o dinheiro cair, a gente desconta na hora. Na hora mesmo.', false);
      }
    }
    loanTryPay(true);
  }
  const F = Profile.fiado;
  if (F && F.amount >= 1 && (Profile.nights || 0) > F.day) {
    const v = fiadoPay(false);
    if (Profile.fiado && Profile.fiado.amount >= 1) {
      const j = Math.ceil(Profile.fiado.amount * FIADO_LATE); Profile.fiado.amount += j;
      if (!v) charVoice('ze_fiado');
      addMsg(ZE, '', (v ? 'Peguei ' + brl(v) + ', mas ' : 'Ô meu filho, ') + 'ainda falta ' + brl(Profile.fiado.amount) + ' na caderneta. Botei ' + Math.round(FIADO_LATE * 100) + '% de juros, que eu sou amigo mas não sou de ferro. A caderneta já tá até com cheiro de mofo!', false);
    }
  }
  saveGame();
};
Finance.update = function (dt) {
  this.t -= dt; if (this.t > 0) return; this.t = 1;
  if (Profile.loan && Profile.loan.overdue >= 1) loanTryPay(false);
};
// Seu Zé recusa vir com fiado aberto (a não ser que dê pra pagar na hora)
function zeFiadoGate() {
  if (!fiadoOpen()) return true;
  if (Profile.money >= Profile.fiado.amount) { fiadoPay(true); return true; }
  const k = Profile.zeNaoI = ((Profile.zeNaoI || 0) + 1) % ZE_FIADO_NAO.length;
  Profile.msgs.unshift({ from: ZE, title: '', body: 'Seu Zé, me socorre aí? Depois eu acerto...', read: true, me: true, t: Math.floor(Profile.time) });
  setTimeout(() => { if (k % 2 === 0) { charVoice('ze_nao'); return; } addMsg(ZE, '', ZE_FIADO_NAO[k].replace('{v}', fmtMoney(Math.ceil(Profile.fiado ? Profile.fiado.amount : 0))), true); if (Screens.current === 'screen-phone' && Phone.chat === ZE) { phoneTone(1320, 0.06, 0.05); Phone.render(); } }, 1400);
  return false;
}
// tela da carteira: resumo + empréstimo
function walletHTML(tab) {
  const tabs = `<div class="ph-tabs"><button class="${tab !== 'loan' ? 'on' : ''}" data-wtab="sum">Resumo</button><button class="${tab === 'loan' ? 'on' : ''}" data-wtab="loan">Empréstimo</button></div>`;
  const L = Profile.loan, F = Profile.fiado;
  if (tab !== 'loan') {
    return tabs + `<div class="ph-card"><div class="ph-big">R$ ${fmtMoney(Profile.money)}</div><p>Total ganho: R$ ${fmtMoney(Profile.earned)}</p></div>` +
      (L ? `<div class="ph-row static"><b>Empréstimo ${BANK}</b><span>${L.billed}/${L.n} parcelas vencidas · falta ${brl(loanLeft(L))}${L.overdue >= 1 ? ' · <em class="late">atrasado ' + brl(L.overdue) + '</em>' : ''}</span></div>` : '') +
      (F ? `<div class="ph-row static"><b>Caderneta do Seu Zé (fiado)</b><span>${brl(F.amount)} · cobra sozinho na virada da noite</span></div>` : '') +
      `<div class="ph-row static"><b>Entregas e fretes</b><span>${Profile.deliveries} concluídos</span></div><div class="ph-row static"><b>Corridas no PegaAí</b><span>${Profile.rides || 0}</span></div><div class="ph-row static"><b>Veículo atual</b><span>${H(player.car.name)}</span></div>`;
  }
  let h = tabs + `<div class="bank-hero"><b>${BANK}</b><span>o banco que te estressa, mas te empresta</span></div>`;
  if (L) {
    const pct = Math.round((L.billed - (L.overdue >= 1 ? Math.ceil(L.overdue / L.parcela) : 0)) / L.n * 100);
    h += `<div class="ph-card"><div class="ph-big">${brl(loanLeft(L))}</div><p>falta pagar · ${L.n}x de ${brl(L.parcela)}</p><div class="ach-bar"><i style="width:${clamp(pct, 0, 100)}%"></i></div>` +
      `<p>${L.billed}/${L.n} parcelas vencidas${L.lateFees ? ' · juros de atraso: ' + brl(L.lateFees) : ''}</p>` +
      (L.overdue >= 1 ? `<p class="late">Em atraso: ${brl(L.overdue)}. Desconta sozinho assim que entrar dinheiro.</p>` : `<p>Próxima parcela na virada da noite (05:00).</p>`) + '</div>' +
      `<p class="ph-note">Só um empréstimo por vez. Quitou, pode pegar outro.</p>`;
    return h;
  }
  const amt = Phone.loanAmt || 1000;
  h += '<p class="ph-note">Escolha o valor e em quantas parcelas. Cada parcela é descontada sozinha na virada da noite. Sem saldo? Atrasa, entra juros de 10% por noite e desconta assim que o dinheiro cair.</p>' +
    '<div class="loan-amts">' + LOAN_AMOUNTS.map((a) => `<button class="${a === amt ? 'on' : ''}" data-lamt="${a}">${brl(a)}</button>`).join('') + '</div>' +
    LOAN_PLANS.map((p) => { const q = loanPlan(amt, p); return `<button class="ph-row" data-loan="${p.n}"><b>${p.n}x de ${brl(q.parcela)}</b><span>total ${brl(q.total)} · juros ${Math.round(p.rate * 100)}%</span></button>`; }).join('') +
    (F ? `<p class="ph-note">Dica: o fiado do Seu Zé (${brl(F.amount)}) é cobrado sozinho na virada da noite.</p>` : '');
  return h;
}

/* App Calendário: mês com contas, promessas, lives agendadas, compromissos, publicações, contratos, eventos e datas especiais. */
'use strict';
(function (SL) {
  const U = SL.U, UI = SL.UI;
  const ic = UI.ic, esc = U.esc;
  SL.Apps.calendario = {
    title: 'Agenda', short: 'Agenda', icon: 'calendar', color: 'linear-gradient(135deg,#ffb547,#e07a1a)', order: 13, pc: true, phone: true, w: 900, h: 660,
    watch: ['calendar', 'tick:day', 'bills', 'promises'],
    render(el, ctx) {
      const st = ctx.st; const today = SL.Clock.day();
      if (st.off == null) st.off = 0; if (st.sel == null) st.sel = today;
      const d0 = SL.Clock.dateOfDay(today);
      const first = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + st.off, 1));
      const firstDay = Math.round((first.getTime() - SL.State.START) / 86400000);
      const startDay = firstDay - first.getUTCDay();
      const cells = []; for (let i = 0; i < 42; i++) cells.push(startDay + i);
      const month = first.getUTCMonth();
      const sel = SL.Calendar.forDay(st.sel);
      el.innerHTML = `<div class="app"><div class="app-head"><h2>${ic('calendar', 16)} ${SL.Clock.MON[month][0].toUpperCase() + SL.Clock.MON[month].slice(1)} de ${first.getUTCFullYear()}</h2><div class="row" style="margin-left:auto"><button class="ibtn" data-act="m" data-v="-1">${ic('left', 15)}</button><button class="btn sm" data-act="m" data-v="0">Hoje</button><button class="ibtn" data-act="m" data-v="1">${ic('right', 15)}</button></div></div>
        <div class="app-body"><div class="cal-head">${SL.Clock.DOW3.map(d => `<span>${d}</span>`).join('')}</div>
        <div class="cal-grid">${cells.map(d => { const date = SL.Clock.dateOfDay(d); const evs = d >= 0 ? SL.Calendar.forDay(d) : []; return `<div class="cal-day ${date.getUTCMonth() !== month ? 'out' : ''} ${d === today ? 'today' : ''} ${d === st.sel ? 'sel' : ''}" data-act="sel" data-v="${d}"><span class="dn">${date.getUTCDate()}</span>${evs.slice(0, 3).map(e => { const k = SL.Calendar.KINDS[e.kind] || SL.Calendar.KINDS.especial; return `<span class="cal-ev" style="background:${k.color}" title="${esc(e.title)}">${e.hour != null ? e.hour + 'h ' : ''}${esc(e.title)}</span>`; }).join('')}${evs.length > 3 ? `<span class="tiny muted">+${evs.length - 3}</span>` : ''}</div>`; }).join('')}</div>
        <div class="card"><h3>${esc(SL.Clock.fmtFull(st.sel * 1440))}</h3>${sel.length ? `<div class="list">${sel.map(e => { const k = SL.Calendar.KINDS[e.kind] || SL.Calendar.KINDS.especial; return `<div class="li"><span style="color:${k.color}">${ic(k.icon, 16)}</span><div class="grow"><b class="small">${esc(e.title)}</b><div class="tiny muted">${k.label}${e.hour != null ? ' · ' + e.hour + 'h' : ''}</div></div></div>`; }).join('')}</div>` : '<div class="small muted">Nada marcado.</div>'}</div>
        <div class="row wrap">${Object.values(SL.Calendar.KINDS).filter((v, i, a) => a.findIndex(x => x.label === v.label) === i).map(k => `<span class="row gap4 tiny muted"><span class="dot" style="background:${k.color}"></span>${k.label}</span>`).join('')}</div></div></div>`;
    },
    act(a, ds, ctx) {
      if (a === 'm') { ctx.st.off = +ds.v === 0 ? 0 : ctx.st.off + +ds.v; return ctx.render(); }
      if (a === 'sel') { ctx.st.sel = +ds.v; return ctx.render(); }
    },
  };
})(window.SL);

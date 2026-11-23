/* Relógio do jogo: minutos desde 01/03/2027 00:00. Dispara os ciclos por minuto, hora e dia. */
'use strict';
(function (SL) {
  const U = SL.U;
  const C = SL.Clock = {};
  C.SPEEDS = [0, 0.5, 2, 6];        // minutos de jogo por segundo real: 1x é calmo (1 hora do jogo = 2 minutos)
  C.ACT_MULT = [0, 1, 2, 4];        // atividades (dormir, banho...) andam no ritmo delas, multiplicado pela velocidade escolhida
  C.LIVE_SPEEDS = [0, 0.5, 1, 2.5]; // durante a live
  C.MAX_STEPS_FRAME = 400;          // limite de minutos simulados por quadro (evita travar)
  let acc = 0, holds = 0;

  const DOW = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const DOW3 = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const MON = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const MON3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  C.DOW = DOW; C.DOW3 = DOW3; C.MON = MON; C.MON3 = MON3;

  C.now = () => SL.G.time.t;
  C.day = t => Math.floor((t == null ? SL.G.time.t : t) / 1440);
  C.mod = t => ((t == null ? SL.G.time.t : t) % 1440 + 1440) % 1440;
  C.hour = t => Math.floor(C.mod(t) / 60);
  C.hourF = t => C.mod(t) / 60;
  C.date = t => new Date(SL.State.START + C.day(t) * 86400000);
  C.dateOfDay = d => new Date(SL.State.START + d * 86400000);
  C.dow = t => C.date(t).getUTCDay();
  C.dowOfDay = d => C.dateOfDay(d).getUTCDay();
  C.md = t => { const d = C.date(t); return String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); };
  C.mdOfDay = d => C.md(d * 1440);
  C.monthKey = t => { const d = C.date(t); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); };
  C.dayOfMonth = t => C.date(t).getUTCDate();
  C.fmtTime = t => { const m = C.mod(t); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  C.fmtDate = t => { const d = C.date(t); return DOW3[d.getUTCDay()] + ', ' + String(d.getUTCDate()).padStart(2, '0') + ' ' + MON3[d.getUTCMonth()]; };
  C.fmtDay = d => C.fmtDate(d * 1440);
  C.fmtFull = t => { const d = C.date(t); return DOW[d.getUTCDay()] + ', ' + d.getUTCDate() + ' de ' + MON[d.getUTCMonth()] + ' de ' + d.getUTCFullYear(); };
  C.fmtStamp = t => C.fmtDate(t) + ' ' + C.fmtTime(t);
  C.period = t => { const h = C.hour(t); return h < 5 ? 'Madrugada' : h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite'; };
  C.ago = t => {
    const d = SL.G.time.t - t;
    if (d < 60) return 'há ' + Math.max(1, Math.round(d)) + ' min';
    if (d < 1440) return 'há ' + Math.round(d / 60) + ' h';
    const days = Math.round(d / 1440);
    return days === 1 ? 'ontem' : 'há ' + days + ' dias';
  };
  // próximo dia (>= hoje) que cai em um dia do mês
  C.dayForDayOfMonth = (fromDay, dom) => {
    for (let d = fromDay; d < fromDay + 62; d++) if (C.dateOfDay(d).getUTCDate() === dom) return d;
    return fromDay + 30;
  };
  C.dayForMD = (fromDay, md) => {
    for (let d = fromDay; d < fromDay + 370; d++) if (C.mdOfDay(d) === md) return d;
    return -1;
  };

  C.hold = () => { holds++; };
  C.release = () => { holds = Math.max(0, holds - 1); };
  C.held = () => holds > 0;
  C.resetHolds = () => { holds = 0; acc = 0; };

  // minutos de jogo por segundo real no momento
  C.rate = () => {
    const G = SL.G;
    if (!G || holds > 0) return 0;
    if (G.act) {
      if (G.act.id === 'live') return C.LIVE_SPEEDS[SL.Live && SL.Live.cur ? SL.Live.cur.speed : 1] || 0;
      if (G.time.speed === 0) return 0;
      return Math.max(C.SPEEDS[G.time.speed], (G.act.speed || 0) * C.ACT_MULT[G.time.speed]);
    }
    return C.SPEEDS[G.time.speed] || 0;
  };

  C.advance = realSec => {
    const G = SL.G; if (!G) return;
    const r = C.rate(); if (!r) return;
    acc += r * Math.min(realSec, 0.25);
    let steps = 0;
    while (acc >= 1 && steps < C.MAX_STEPS_FRAME) { acc -= 1; steps++; C.step(); if (C.held()) { acc = 0; break; } }
    if (steps >= C.MAX_STEPS_FRAME) acc = 0;
  };
  C.fraction = () => acc;

  C.step = () => {
    const G = SL.G;
    G.time.t++;
    SL.bus.emit('tick:minute', G.time.t);
    if (G.time.t % 60 === 0) SL.bus.emit('tick:hour', G.time.t);
    if (G.time.t % 1440 === 0) SL.bus.emit('tick:day', C.day());
  };
  // avança vários minutos de uma vez (usado por testes e por eventos que pulam tempo)
  C.skip = minutes => { for (let i = 0; i < minutes; i++) C.step(); };
})(window.SL);

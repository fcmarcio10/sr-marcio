/* Relógio do jogo: minutos desde 01/03/2027 00:00. Dispara os ciclos por minuto, hora e dia. */
'use strict';
(function (SL) {
  const U = SL.U;
  const C = SL.Clock = {};
  // 3 velocidades (pedido do dono): pausa, normal e 3x. Valem na casa, no PC e na live.
  // nov/2026: o relógio anda 2x mais devagar (normal: 1 minuto do jogo a cada 4 segundos; 1 hora do jogo = 4 minutos)
  C.SPEEDS = [0, 0.25, 0.75];      // minutos de jogo por segundo real
  C.ACT_MULT = [0, 1, 3];          // atividades (dormir, banho...) andam no ritmo delas, multiplicado pela velocidade escolhida
  C.LIVE_SPEEDS = [0, 0.25, 1.95]; // durante a live: o 3x acelera 160% a mais (pedido do dono)
  // nov/2026 (pedido do dono): sem relógio e sem dias na tela. O tempo só anda quando você faz alguma coisa
  // (dormir, comer, editar, live...). Parado pela casa ou mexendo no PC, nada passa. As velocidades só existem na live.
  C.RITMO = 2;                      // atividades fora da live: ritmo próprio x2 (antes: x1 no normal, x3 no 3x)
  C.HORA = 20;                      // hora fixa para o público, as lojas e o resto que dependia do relógio
  // "hoje", "amanhã", "em 3 dias" (sem datas)
  C.quando = d => { const n = d - C.day(); return n < 0 ? C.ago(d * 1440 + 720) : n === 0 ? 'hoje' : n === 1 ? 'amanhã' : 'daqui a ' + n + ' dias'; };
  // velocidade escolhida (saves antigos tinham 4 velocidades: o que passa de 2 vira 3x)
  C.sp = () => { const G = SL.G; const s = G ? G.time.speed | 0 : 1; return Math.max(0, Math.min(C.SPEEDS.length - 1, s)); };
  C.setSpeed = s => { const G = SL.G; if (!G) return; G.time.speed = Math.max(0, Math.min(C.SPEEDS.length - 1, s | 0)); SL.bus.emit('speed', G.time.speed); };
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
  C.date = t => new Date(SL.State.START + C.day(t) * 86400000);
  C.dateOfDay = d => new Date(SL.State.START + d * 86400000);
  C.dow = t => C.date(t).getUTCDay();
  C.md = t => { const d = C.date(t); return String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); };
  C.mdOfDay = d => C.md(d * 1440);
  C.monthKey = t => { const d = C.date(t); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); };
  C.dayOfMonth = t => C.date(t).getUTCDate();
  C.fmtTime = t => { const m = C.mod(t); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  // sem datas na tela (pedido do dono): tudo vira "hoje", "ontem", "amanhã", "daqui a 3 dias"...
  C.fmtDate = t => C.quando(C.day(t));
  C.fmtDay = d => C.quando(d);
  C.fmtFull = t => C.quando(C.day(t));
  C.fmtStamp = t => C.ago(t);
  C.ago = t => {
    const d = SL.G.time.t - t;
    if (d < 180) return 'agora há pouco';
    const days = C.day() - C.day(t);
    return days <= 0 ? 'hoje' : days === 1 ? 'ontem' : 'há ' + days + ' dias';
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
    const act = G.act && G.act.id !== 'live' ? (G.act.speed || 0) * C.RITMO : 0;
    // live no ar (mesmo com você longe do PC): velocidade escolhida na live (pausa, normal, 3x)
    if (SL.Live && SL.Live.cur) { const sp = C.sp(); if (sp === 0) return 0; return Math.max(C.LIVE_SPEEDS[sp] || 0, act); }
    // fora da live: só passa tempo fazendo alguma coisa
    return act;
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

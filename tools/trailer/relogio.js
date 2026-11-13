// Relógio controlado: o jogo só anda quando o gravador manda (um quadro por vez).
// Assim o vídeo sai liso a 60 quadros por segundo, mesmo num computador lento.
(() => {
  const V = window.__VT = { on: false, t: 0, rafs: [], timers: [], id: 1 };
  const realNow = performance.now.bind(performance), realRaf = window.requestAnimationFrame.bind(window);
  const realST = window.setTimeout.bind(window), realCT = window.clearTimeout.bind(window);
  window.requestAnimationFrame = (cb) => { if (!V.on) return realRaf(cb); V.rafs.push(cb); return 0; };
  performance.now = () => (V.on ? V.t : realNow());
  window.setTimeout = (fn, ms, ...a) => { if (!V.on) return realST(fn, ms, ...a); const id = 'v' + V.id++; V.timers.push({ id, at: V.t + (ms || 0), fn, a }); return id; };
  window.clearTimeout = (id) => { if (typeof id === 'string' && id[0] === 'v') { V.timers = V.timers.filter((t) => t.id !== id); return; } realCT(id); };
  V.start = () => { V.t = realNow(); V.on = true; };
  V.step = (ms) => {
    V.t += ms;
    const due = V.timers.filter((t) => t.at <= V.t); V.timers = V.timers.filter((t) => t.at > V.t);
    for (const t of due) { try { t.fn(...t.a); } catch (e) { console.warn(e); } }
    const cbs = V.rafs; V.rafs = [];
    for (const cb of cbs) cb(V.t);
    // animações e transições do CSS (avisos, banners) andam junto com o relógio
    for (const an of document.getAnimations()) { if (!an._vt) { an.pause(); an._vt = 1; } an.currentTime = (an.currentTime || 0) + ms; }
  };
})();

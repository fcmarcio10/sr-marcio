/* Sons sintetizados com WebAudio (nenhum arquivo externo). Só começam depois do primeiro clique. */
'use strict';
(function (SL) {
  let ctx = null, master = null, musicGain = null, musicTimer = null;
  const A = SL.audio = {};

  A.init = () => {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.connect(master); musicGain.gain.value = 0;
      A.applyVolume();
    } catch (e) { ctx = null; }
  };
  A.applyVolume = () => {
    if (!ctx) return;
    const s = SL.settings || {};
    master.gain.value = (s.volume == null ? 0.6 : s.volume);
    musicGain.gain.value = (s.music == null ? 0.25 : s.music) * 0.35;
  };

  function tone(freq, dur, type = 'sine', vol = 0.2, when = 0, slide = 0) {
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol = 0.1, when = 0, hp = 1500) {
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }

  const SFX = {
    click: () => tone(660, 0.05, 'triangle', 0.06),
    hover: () => tone(900, 0.03, 'sine', 0.025),
    open: () => { tone(520, 0.08, 'triangle', 0.07); tone(780, 0.1, 'triangle', 0.06, 0.05); },
    close: () => { tone(700, 0.07, 'triangle', 0.06); tone(460, 0.09, 'triangle', 0.05, 0.05); },
    notif: () => { tone(880, 0.12, 'sine', 0.12); tone(1320, 0.18, 'sine', 0.1, 0.09); },
    msg: () => { tone(1046, 0.08, 'sine', 0.1); tone(1568, 0.12, 'sine', 0.08, 0.07); },
    follow: () => { tone(784, 0.1, 'triangle', 0.12); tone(988, 0.1, 'triangle', 0.12, 0.08); tone(1318, 0.18, 'triangle', 0.12, 0.16); },
    sub: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'square', 0.05, i * 0.07)); },
    donate: () => { tone(1568, 0.08, 'square', 0.06); tone(2093, 0.25, 'square', 0.06, 0.07); noise(0.25, 0.04, 0.05, 4000); },
    cash: () => { tone(1318, 0.06, 'square', 0.05); tone(1760, 0.18, 'square', 0.05, 0.06); },
    error: () => { tone(220, 0.15, 'sawtooth', 0.06); tone(180, 0.2, 'sawtooth', 0.06, 0.1); },
    success: () => { [523, 659, 784].forEach((f, i) => tone(f, 0.14, 'triangle', 0.1, i * 0.08)); },
    levelup: () => { [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'triangle', 0.1, i * 0.09)); },
    raid: () => { tone(196, 0.4, 'sawtooth', 0.08, 0, 400); noise(0.5, 0.06, 0.05, 800); },
    live: () => { tone(440, 0.15, 'square', 0.06); tone(660, 0.15, 'square', 0.06, 0.15); tone(880, 0.3, 'square', 0.06, 0.3); },
    end: () => { tone(660, 0.2, 'triangle', 0.08); tone(440, 0.3, 'triangle', 0.08, 0.18); },
    step: () => noise(0.03, 0.015, 0, 3000),
    door: () => { tone(140, 0.15, 'sine', 0.12); noise(0.1, 0.04, 0.02, 600); },
    pop: () => tone(1200, 0.05, 'sine', 0.06, 0, -500),
    scare: () => { noise(0.4, 0.12, 0, 300); tone(90, 0.5, 'sawtooth', 0.08, 0, -40); },
    goal: () => { noise(0.6, 0.07, 0, 500); [523, 784, 1046].forEach((f, i) => tone(f, 0.25, 'square', 0.05, i * 0.1)); },
  };
  A.play = name => {
    if (!ctx || (SL.settings && SL.settings.volume === 0)) return;
    if (ctx.state === 'suspended') ctx.resume();
    const f = SFX[name]; if (f) try { f(); } catch (e) { /* ignora */ }
  };

  // Trilha ambiente lo-fi simples (acordes suaves), opcional
  const CHORDS = [[220, 277, 330, 415], [196, 247, 294, 370], [175, 220, 262, 330], [196, 247, 294, 349]];
  let chordIdx = 0;
  A.music = on => {
    if (!ctx) return;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (!on) return;
    const playChord = () => {
      const ch = CHORDS[chordIdx++ % CHORDS.length];
      const t0 = ctx.currentTime;
      ch.forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
        o.type = 'triangle'; o.frequency.value = f / 2;
        fl.type = 'lowpass'; fl.frequency.value = 900;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.4 + i * 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.8);
        o.connect(fl); fl.connect(g); g.connect(musicGain); o.start(t0 + i * 0.05); o.stop(t0 + 4);
      });
    };
    playChord(); musicTimer = setInterval(playChord, 4000);
  };
})(window.SL);

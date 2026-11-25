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

  // arquivos de som gravados (vozes do superchat e o som do superchat, ElevenLabs): SL.SONS em js/data/sons.js
  A.arquivo = (id, vol) => {
    const src = SL.SONS && SL.SONS[id]; if (!src || typeof Audio === 'undefined') return null;
    const s = SL.settings || {}; const a = new Audio(src);
    a.volume = Math.max(0, Math.min(1, (s.volume == null ? 0.6 : s.volume) * (vol == null ? 1 : vol) * (s.vozes == null ? 1 : s.vozes)));
    const p = a.play(); if (p && p.catch) p.catch(() => {});
    return a;
  };
  // superchat: toca o som e depois a voz; um de cada vez, sem falar por cima
  const filaSc = []; let tocandoSc = false;
  const proximoSc = () => {
    if (tocandoSc || !filaSc.length) return;
    const it = filaSc.shift(); tocandoSc = true;
    if (it.som) A.arquivo('sc_som', 0.85);
    setTimeout(() => {
      const a = A.arquivo(it.id, it.vol || 1);
      const fim = () => { if (!tocandoSc) return; tocandoSc = false; setTimeout(proximoSc, 400); };
      if (!a) return fim();
      a.onended = fim; a.onerror = fim; setTimeout(fim, 9000);
    }, it.som ? 1000 : 0);
  };
  A.superchat = id => { if (filaSc.filter(x => x.som).length < 3) filaSc.push({ id, som: true }); proximoSc(); };
  // vozes da live sem o som do superchat: Bigode (no máximo uma a cada 25 s) e o público gritando
  let ultBigode = -1e9;
  A.voz = id => {
    const agora = performance.now();
    if (/^bg_/.test(id)) { if (agora - ultBigode < 25000 || filaSc.length >= 2) return; ultBigode = agora; }
    else if (filaSc.length >= 3) return;
    if (/^pb_/.test(id)) filaSc.unshift({ id, vol: 0.9 }); else filaSc.push({ id, vol: 0.9 });
    proximoSc();
  };
  A.paraSuperchats = () => { filaSc.length = 0; };

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

  // ---------- sons de fundo (sugestão 8): chuva na janela e teclado ----------
  let chuvaG = null, chuvaSrc = null, tecladoT = 0, ambOn = { chuva: false, teclado: false, live: false };
  const ruido = seg => { const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seg), ctx.sampleRate); const d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { last = last * 0.86 + (Math.random() * 2 - 1) * 0.14; d[i] = last * 3; } return b; };
  const ligaChuva = () => {
    if (chuvaG) return;
    chuvaG = ctx.createGain(); chuvaG.gain.value = 0; chuvaG.connect(master);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500; f.connect(chuvaG);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 220; hp.connect(f);
    chuvaSrc = ctx.createBufferSource(); chuvaSrc.buffer = ruido(3); chuvaSrc.loop = true; chuvaSrc.connect(hp); chuvaSrc.start();
  };
  // pingos na janela de vez em quando
  const pingo = () => { if (!ctx) return; tone(1800 + Math.random() * 1600, 0.04, 'sine', 0.012 + Math.random() * 0.01, 0, -900); };
  // uma tecla: clique curto com um pouco de corpo
  const tecla = (when, forte) => { noise(0.018, forte ? 0.05 : 0.032, when, 2400); tone(150 + Math.random() * 60, 0.025, 'triangle', forte ? 0.02 : 0.012, when); };
  A.tecla = () => { if (!ctx || (SL.settings && SL.settings.teclas === false) || (SL.settings && SL.settings.volume === 0)) return; if (ctx.state === 'suspended') ctx.resume(); tecla(0, Math.random() < 0.12); };
  // chamado pelo laço do jogo umas 4 vezes por segundo
  A.ambiente = st => {
    if (!ctx) return;
    if (SL.settings && SL.settings.ambOn === false) st = Object.assign({}, st, { chuva: false, teclado: false });
    ambOn = st;
    if (st.chuva) ligaChuva();
    if (chuvaG) { const alvo = st.chuva ? (st.fora ? 0.05 : 0.11) : 0; chuvaG.gain.setTargetAtTime(alvo, ctx.currentTime, 1.2); if (st.chuva && Math.random() < 0.35) pingo(); }
    // trabalhando no PC (editar, freela, estudar): rajadas de teclas de vez em quando
    const agora = performance.now();
    if (st.teclado && agora > tecladoT) {
      const n = 3 + Math.floor(Math.random() * 7); let t = 0;
      for (let i = 0; i < n; i++) { t += 0.07 + Math.random() * 0.12; tecla(t, i === n - 1 && Math.random() < 0.4); }
      tecladoT = agora + 900 + Math.random() * 2600;
    }
    // música mais baixa durante a live (para ouvir o superchat e o Bigode)
    if (musicGain) { const s = SL.settings || {}; const base = (s.music == null ? 0.25 : s.music) * 0.35; musicGain.gain.setTargetAtTime(base * (st.live ? 0.45 : 1), ctx.currentTime, 0.8); }
  };

  // Trilha ambiente lo-fi calma (acordes suaves, baixo e notas soltas), ligada por padrão
  const CHORDS = [[220, 277, 330, 415], [196, 247, 294, 370], [175, 220, 262, 330], [196, 247, 294, 349]];
  const MELO = [440, 494, 554, 659, 740, 880];
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
      // baixo macio
      { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = ch[0] / 4; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.8); o.connect(g); g.connect(musicGain); o.start(t0); o.stop(t0 + 2); }
      // duas ou três notas soltas por cima, bem baixinho
      const n = 1 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n; k++) { const when = 0.6 + k * (0.8 + Math.random() * 0.6); const f0 = MELO[Math.floor(Math.random() * MELO.length)]; const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f0; g.gain.setValueAtTime(0.0001, t0 + when); g.gain.exponentialRampToValueAtTime(0.035, t0 + when + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + when + 1.2); o.connect(g); g.connect(musicGain); o.start(t0 + when); o.stop(t0 + when + 1.3); }
    };
    playChord(); musicTimer = setInterval(playChord, 4000);
  };
})(window.SL);

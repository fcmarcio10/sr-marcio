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
  // cada superchat: som de chegada + alerta na tela (onStart), depois a voz; o próximo só começa quando o anterior termina
  const filaSc = []; let tocandoSc = false, atualSc = null, somSc = null, timersSc = [], vezSc = 0;
  const proximoSc = () => {
    if (tocandoSc || !filaSc.length) return;
    const it = filaSc.shift(); tocandoSc = true; const vez = ++vezSc;
    somSc = it.som ? A.arquivo('sc_som', 0.85) : null;
    if (!somSc && it.som) A.play('donate');
    if (it.onStart) try { it.onStart(); } catch (e) { /* tela fechada */ }
    const fim = () => { if (vez !== vezSc || !tocandoSc) return; tocandoSc = false; atualSc = null; if (it.onEnd) try { it.onEnd(); } catch (e) { /* tela fechada */ } timersSc.push(setTimeout(proximoSc, 500)); };
    timersSc.push(setTimeout(() => {
      if (vez !== vezSc) return;
      const a = A.arquivo(it.id, it.vol || 1); atualSc = a;
      if (!a) { timersSc.push(setTimeout(fim, 3500)); return; }
      a.onended = fim; a.onerror = fim; timersSc.push(setTimeout(fim, 12000));
    }, it.som ? 1100 : 0));
  };
  A.superchat = (id, onStart, onEnd) => { if (filaSc.length < 8) filaSc.push({ id, som: true, onStart, onEnd }); proximoSc(); };
  // corta na hora (live encerrada, PC desligado por sono/fome/sede, sair de casa)
  A.paraSuperchats = () => {
    filaSc.length = 0; vezSc++; tocandoSc = false; timersSc.forEach(clearTimeout); timersSc = [];
    [atualSc, somSc].forEach(a => { if (a) { try { a.pause(); a.currentTime = 0; } catch (e) { /* já parou */ } } }); atualSc = somSc = null;
  };

  // nov/2026: efeitos refeitos (sinos suaves com eco curto, cliques macios e "whoosh" em vez de ondas quadradas)
  let eco = null;
  const saidaEco = () => {
    if (eco || !ctx) return eco;
    const d = ctx.createDelay(); d.delayTime.value = 0.13; const fb = ctx.createGain(); fb.gain.value = 0.22; const wet = ctx.createGain(); wet.gain.value = 0.25;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(master); eco = d; return eco;
  };
  // sino: fundamental + oitava + quinta curtinha, com um pouco de eco
  function sino(freq, dur, vol, when) {
    if (!ctx) return; const t0 = ctx.currentTime + (when || 0); const e = saidaEco();
    [[1, 1], [2, 0.35], [3, 0.12]].forEach(([m, k]) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(freq * m, t0);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol * k, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur / m);
      o.connect(g); g.connect(master); if (e) g.connect(e); o.start(t0); o.stop(t0 + dur + 0.05);
    });
  }
  // clique macio (como botão de interface de celular)
  function toque(freq, vol, when) {
    if (!ctx) return; const t0 = ctx.currentTime + (when || 0);
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'triangle'; o.frequency.setValueAtTime(freq, t0); o.frequency.exponentialRampToValueAtTime(freq * 0.6, t0 + 0.05);
    f.type = 'lowpass'; f.frequency.value = 2400; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
    o.connect(f); f.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.08);
  }
  // whoosh: ruído filtrado subindo ou descendo
  function whoosh(dur, vol, de, ate, when) {
    if (!ctx) return; const t0 = ctx.currentTime + (when || 0);
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate); const dd = buf.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
    const sr = ctx.createBufferSource(); sr.buffer = buf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(de, t0); f.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    sr.connect(f); f.connect(g); g.connect(master); sr.start(t0);
  }
  const SFX = {
    click: () => toque(900, 0.05),
    hover: () => toque(1400, 0.015),
    open: () => { whoosh(0.18, 0.05, 600, 2200); sino(880, 0.25, 0.03, 0.05); },
    close: () => { whoosh(0.16, 0.04, 2000, 500); },
    notif: () => { sino(1046, 0.5, 0.06); sino(1568, 0.6, 0.045, 0.1); },
    msg: () => { sino(1318, 0.3, 0.05); sino(1760, 0.35, 0.04, 0.08); },
    follow: () => { [784, 988, 1318].forEach((f, i) => sino(f, 0.45, 0.05, i * 0.07)); },
    sub: () => { [659, 784, 988, 1318].forEach((f, i) => sino(f, 0.6, 0.05, i * 0.08)); whoosh(0.4, 0.025, 3000, 8000, 0.2); },
    donate: () => { sino(1568, 0.4, 0.06); sino(2093, 0.6, 0.05, 0.08); whoosh(0.3, 0.02, 5000, 9000, 0.05); },
    cash: () => { toque(2400, 0.04); sino(1760, 0.35, 0.05, 0.04); sino(2637, 0.45, 0.04, 0.1); },
    error: () => { const t = ctx.currentTime; [330, 247].forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i * 0.12); g.gain.exponentialRampToValueAtTime(0.07, t + i * 0.12 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.18); o.connect(g); g.connect(master); o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.2); }); },
    success: () => { [523, 659, 784, 1046].forEach((f, i) => sino(f, 0.5, 0.05, i * 0.07)); },
    levelup: () => { [392, 523, 659, 784, 1046, 1318].forEach((f, i) => sino(f, 0.7, 0.05, i * 0.08)); whoosh(0.6, 0.03, 800, 6000, 0.1); },
    raid: () => { whoosh(0.7, 0.07, 300, 3000); [262, 330, 392, 523].forEach((f, i) => sino(f, 0.6, 0.05, 0.25 + i * 0.08)); },
    live: () => { [523, 784, 1046].forEach((f, i) => sino(f, 0.55, 0.055, i * 0.14)); },
    end: () => { [784, 659, 523].forEach((f, i) => sino(f, 0.6, 0.05, i * 0.14)); },
    step: () => noise(0.025, 0.012, 0, 2500),
    door: () => { whoosh(0.35, 0.05, 400, 150); toque(180, 0.05, 0.25); },
    pop: () => toque(1300, 0.06),
    scare: () => { whoosh(0.5, 0.12, 200, 1200); tone(90, 0.5, 'sawtooth', 0.06, 0, -40); },
    goal: () => { [523, 659, 784, 1046].forEach((f, i) => sino(f, 0.6, 0.06, i * 0.09)); whoosh(0.6, 0.04, 1000, 7000, 0.1); },
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

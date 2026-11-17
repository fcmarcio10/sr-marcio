/* Som: tudo sintetizado (passos, portas, golpes, tiros, gemidos, ambiente e música de fundo). */
const AudioSys = {
  ac: null, master: null, sfxG: null, musG: null, nbuf: null, amb: null, mus: null, lastGroan: 0,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const ac = this.ac;
    this.master = ac.createGain(); this.master.connect(ac.destination);
    this.sfxG = ac.createGain(); this.sfxG.connect(this.master);
    this.musG = ac.createGain(); this.musG.connect(this.master);
    const n = ac.sampleRate * 2; this.nbuf = ac.createBuffer(1, n, ac.sampleRate);
    const d = this.nbuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.volumes(); this.startAmb(); this.startMusic();
  },
  volumes() { if (!this.ac) return; this.master.gain.value = Settings.vol; this.sfxG.gain.value = Settings.sfx; this.musG.gain.value = Settings.music ? Settings.mus * 0.5 : 0; },
  /* ruído filtrado com envelope */
  noise(dur, freq, q, vol, type, pan, f2) {
    const ac = this.ac; if (!ac || vol <= 0.002) return;
    const s = ac.createBufferSource(); s.buffer = this.nbuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, ac.currentTime + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0008, ac.currentTime + dur);
    s.connect(f); f.connect(g); this.out(g, pan);
    s.start(ac.currentTime, Math.random()); s.stop(ac.currentTime + dur + 0.02);
  },
  tone(type, f0, f1, dur, vol, pan, delay) {
    const ac = this.ac; if (!ac || vol <= 0.002) return;
    const t = ac.currentTime + (delay || 0);
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); this.out(g, pan); o.start(t); o.stop(t + dur + 0.03);
  },
  out(node, pan) {
    if (pan && this.ac.createStereoPanner) { const p = this.ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); p.connect(this.sfxG); } else node.connect(this.sfxG);
  },
  /* volume e lado conforme a posição no mundo */
  at(x, y, maxD) {
    const d = dist(x, y, Player.x, Player.y), v = clamp(1 - d / (maxD || 18), 0, 1);
    return [v * v, clamp(((x - y) - (Player.x - Player.y)) / 12, -1, 1)];
  },
  step(surf, v) { if (surf === 1) this.noise(0.09, 900, 0.7, 0.1 * v, 'bandpass'); else if (surf === 2) { this.noise(0.05, 300, 1.5, 0.16 * v, 'lowpass'); this.tone('sine', 110, 70, 0.05, 0.05 * v); } else this.noise(0.06, 1700, 1.2, 0.09 * v, 'bandpass'); },
  swing() { this.noise(0.16, 500, 1.2, 0.22, 'bandpass', 0, 2200); },
  hit(heavy) { this.noise(0.1, heavy ? 240 : 420, 1, 0.5, 'lowpass'); this.tone('sine', heavy ? 120 : 170, 50, 0.12, 0.4); this.noise(0.05, 2400, 2, 0.12); },
  shot(k) {
    const big = k === 'cartucheira', small = k === 'jaguatirica';
    this.noise(big ? 0.5 : 0.3, big ? 900 : 1600, 0.4, big ? 1 : 0.8, 'lowpass', 0, 200);
    this.tone('square', big ? 110 : small ? 220 : 160, 40, big ? 0.22 : 0.14, 0.5);
    this.noise(1.0, 500, 0.3, 0.12, 'lowpass');
  },
  dry() { this.tone('square', 1400, 900, 0.03, 0.12); },
  click() { this.tone('square', 900, 500, 0.035, 0.08); },
  reload() { this.tone('square', 700, 400, 0.04, 0.12); this.tone('square', 1100, 700, 0.04, 0.12, 0, 0.35); this.noise(0.08, 3000, 2, 0.1); },
  door(open) { if (open) { this.tone('sawtooth', 240, 420, 0.28, 0.05); this.noise(0.08, 500, 1, 0.2, 'lowpass'); } else { this.noise(0.12, 260, 1, 0.5, 'lowpass'); this.tone('sine', 120, 60, 0.1, 0.3); } },
  gate() { this.noise(0.4, 2600, 6, 0.2); this.tone('sawtooth', 320, 520, 0.4, 0.04); this.noise(0.1, 300, 1, 0.3, 'lowpass'); },
  open() { this.noise(0.1, 700, 1, 0.14, 'bandpass'); this.tone('sine', 300, 200, 0.06, 0.06); },
  pickup() { this.tone('triangle', 520, 780, 0.07, 0.12); },
  thump(x, y) { const [v, p] = this.at(x, y, 22); this.noise(0.14, 180, 1, 0.8 * v, 'lowpass', p); this.tone('sine', 90, 45, 0.16, 0.6 * v, p); },
  glass(x, y) { const [v, p] = this.at(x, y, 26); for (let i = 0; i < 5; i++) this.tone('triangle', 2500 + Math.random() * 4000, 1800, 0.12, 0.12 * v, p, i * 0.035); this.noise(0.3, 5000, 0.8, 0.4 * v, 'highpass', p); },
  breakS() { this.noise(0.25, 700, 0.6, 0.6, 'lowpass'); for (let i = 0; i < 3; i++) this.tone('square', 300 + Math.random() * 300, 100, 0.07, 0.12, 0, i * 0.04); },
  groan(x, y, angry) {
    const ac = this.ac; if (!ac) return;
    if (ac.currentTime - this.lastGroan < 0.25) return; this.lastGroan = ac.currentTime;
    const [v, pan] = this.at(x, y, 17); if (v < 0.01) return;
    const dur = angry ? 0.55 : 0.9 + Math.random() * 0.6, t = ac.currentTime, f0 = (angry ? 130 : 85) + Math.random() * 40;
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * (angry ? 1.35 : 0.8), t + dur);
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 17 + Math.random() * 12; lg.gain.value = 14; lfo.connect(lg); lg.connect(o.frequency);
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(angry ? 800 : 450, t); f.frequency.linearRampToValueAtTime(angry ? 500 : 300, t + dur); f.Q.value = 2.5;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3 * v, t + 0.1); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f); f.connect(g); this.out(g, pan); o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
  },
  scream(x, y) { const [v, p] = this.at(x, y, 30); this.tone('sawtooth', 520, 900, 0.8, 0.3 * v, p); this.tone('sawtooth', 780, 1250, 0.8, 0.18 * v, p); this.noise(0.8, 2200, 1.5, 0.25 * v, 'bandpass', p); },
  zdie(x, y) { const [v, p] = this.at(x, y, 16); this.tone('sawtooth', 140, 50, 0.4, 0.2 * v, p); this.noise(0.12, 200, 1, 0.5 * v, 'lowpass', p, 0); },
  hurt() { this.tone('sawtooth', 220, 110, 0.18, 0.25); this.noise(0.12, 600, 1, 0.3, 'lowpass'); },
  death() { this.tone('sine', 180, 40, 1.6, 0.5); this.tone('sawtooth', 90, 30, 2.2, 0.2); },
  eat() { for (let i = 0; i < 3; i++) this.noise(0.07, 1200, 1.5, 0.14, 'bandpass', 0); this.tone('sine', 200, 150, 0.06, 0.05, 0, 0.12); },
  drink() { for (let i = 0; i < 3; i++) this.tone('sine', 260 + i * 60, 520 + i * 60, 0.09, 0.1, 0, i * 0.13); },
  rip() { this.noise(0.25, 2600, 0.8, 0.2, 'highpass', 0, 5000); },
  bang(x, y) { const [v, p] = this.at(x, y, 45); this.noise(0.35, 1400, 0.4, 0.9 * v + 0.05, 'lowpass', p, 150); this.tone('square', 190, 40, 0.15, 0.4 * v, p); for (let i = 0; i < 4; i++) this.tone('triangle', 2000 + Math.random() * 2500, 800, 0.1, 0.07 * v, p, 0.08 + i * 0.06); },
  whoosh() { this.noise(0.8, 400, 0.5, 0.5, 'lowpass', 0, 1800); },
  hiss() { this.noise(2.5, 5000, 0.8, 0.14, 'highpass'); },
  horde() { for (let i = 0; i < 7; i++) this.tone('sawtooth', 70 + Math.random() * 50, 55, 1.6, 0.05, Math.random() * 2 - 1, i * 0.35); },
  heart() { this.tone('sine', 70, 42, 0.12, 0.35); this.tone('sine', 60, 38, 0.12, 0.25, 0, 0.17); },
  /* ambiente: vento contínuo + grilos de noite + passarinho de dia */
  startAmb() {
    const ac = this.ac;
    const s = ac.createBufferSource(); s.buffer = this.nbuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 0.4;
    const g = ac.createGain(); g.gain.value = 0.05; s.connect(f); f.connect(g); g.connect(this.sfxG); s.start();
    this.amb = { f, g, t: 0, hb: 0 };
  },
  startMusic() {
    const ac = this.ac, out = ac.createGain(); out.gain.value = 0.0;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520; f.Q.value = 1;
    f.connect(out); out.connect(this.musG);
    const os = [];
    for (const [fr, det] of [[55, 0], [55, 7], [82.4, -5], [110, 4], [130.8, -6]]) { const o = ac.createOscillator(); o.type = fr < 100 ? 'sawtooth' : 'triangle'; o.frequency.value = fr; o.detune.value = det; const g = ac.createGain(); g.gain.value = fr < 100 ? 0.16 : 0.1; o.connect(g); g.connect(f); o.start(); os.push(o); }
    this.mus = { out, f, os, t: 0, step: 0 };
  },
  update(dt) {
    const ac = this.ac; if (!ac || !this.amb) return;
    const A = this.amb, night = NIGHT(), play = G.state === 'play';
    A.t -= dt;
    const wind = 0.035 + 0.03 * Math.sin(G.now * 0.13) + (night ? 0.025 : 0);
    A.g.gain.setTargetAtTime(Math.max(0.01, wind), ac.currentTime, 0.8);
    A.f.frequency.setTargetAtTime(340 + 180 * Math.sin(G.now * 0.21), ac.currentTime, 1);
    if (A.t <= 0) {
      if (night) { A.t = 0.5 + Math.random() * 1.4; const p = Math.random() * 2 - 1, f0 = 3800 + Math.random() * 900; for (let i = 0; i < 3; i++) this.tone('sine', f0, f0 * 1.01, 0.035, 0.016, p, i * 0.055); if (Math.random() < 0.05) this.tone('sine', 420, 300, 0.5, 0.03, p); }
      else { A.t = 2.5 + Math.random() * 7; if (G.time > 330 && G.time < 1080) { const p = Math.random() * 2 - 1, f0 = 2300 + Math.random() * 1400; for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) this.tone('sine', f0, f0 * (1.15 + Math.random() * 0.3), 0.07, 0.018, p, i * 0.11); } }
      if (play && Math.random() < (night ? 0.1 : 0.04)) this.tone('sawtooth', 75 + Math.random() * 30, 60, 1.4, 0.022, Math.random() * 2 - 1);
    }
    /* coração: pouca vida ou perseguição */
    if (play) {
      let chase = 0; for (const z of Zombies.active) if (z.st === 'chase' && !z.dead) chase++;
      const tense = Player.hp < 30 || chase > 0;
      A.hb -= dt; if (tense && A.hb <= 0) { A.hb = Player.hp < 30 ? 0.75 : clamp(1.3 - chase * 0.08, 0.6, 1.3); this.heart(); }
      const M = this.mus; M.t -= dt;
      M.out.gain.setTargetAtTime(chase > 0 ? 0.9 : night ? 0.7 : 0.4, ac.currentTime, 2);
      M.f.frequency.setTargetAtTime(chase > 0 ? 1100 : night ? 430 : 560, ac.currentTime, 1.5);
      if (M.t <= 0) { M.t = 11; M.step = (M.step + 1) % 4; const root = [55, 51.9, 46.2, 49][M.step]; const r = [1, 1, 1.498, 2, 2.378]; M.os.forEach((o, i) => o.frequency.setTargetAtTime(root * r[i], ac.currentTime, 2.5)); }
    } else if (this.mus) this.mus.out.gain.setTargetAtTime(0.5, ac.currentTime, 2);
  }
};

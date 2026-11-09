/* =====================================================================
   BR NIGHT DRIVE
   Jogo de exploração noturna top-down 2.5D — HTML5 Canvas + JS puro
   ===================================================================== */
'use strict';

/* ============================ UTILIDADES ============================ */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => t * t * (3 - 2 * t);
function angDiff(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU;
  return d;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let RNG = mulberry32(20261108);
function rnd(a, b) { if (a === undefined) return RNG(); if (b === undefined) return RNG() * a; return a + RNG() * (b - a); }
function rndi(a, b) { return Math.floor(rnd(a, b + 1)); }
function pick(arr) { return arr[Math.floor(RNG() * arr.length)]; }
function chance(p) { return RNG() < p; }
function hash2(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const _shadeCache = new Map();
function shade(hex, f) {
  const k = hex + '|' + f;
  let v = _shadeCache.get(k);
  if (v) return v;
  const [r, g, b] = hexToRgb(hex);
  let R, G, B;
  if (f >= 0) { R = r + (255 - r) * f; G = g + (255 - g) * f; B = b + (255 - b) * f; }
  else { R = r * (1 + f); G = g * (1 + f); B = b * (1 + f); }
  v = `rgb(${R | 0},${G | 0},${B | 0})`;
  _shadeCache.set(k, v);
  return v;
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function fmtMoney(v) { return Math.round(v).toLocaleString('pt-BR'); }
function fmtTime(t) {
  if (!isFinite(t)) return '--:--.-';
  const m = Math.floor(t / 60), s = t - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
}
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, style) { ctx.beginPath(); rrect(ctx, x, y, w, h, r); if (style) ctx.fillStyle = style; ctx.fill(); }

/* ============================ CONFIGURAÇÕES ============================ */
// tipos de buzina: frequências, timbre e ritmo (início, duração, multiplicador de nota)
const HORNS = {
  dupla: { f: [392, 494], wave: 'square', band: 900, len: 0.3, pat: [[0, 0.16], [0.22, 0.32]] },
  fina: { f: [610, 760], wave: 'square', band: 1500, len: 0.25, pat: [[0, 0.12], [0.18, 0.12]] },
  fusquinha: { f: [430], wave: 'sawtooth', band: 1100, len: 0.3, vib: 18, pat: [[0, 0.35]] },
  caminhao: { f: [155, 196, 233], wave: 'sawtooth', band: 520, len: 0.8, pat: [[0, 0.9]] },
  onibus: { f: [220, 277], wave: 'sawtooth', band: 650, len: 0.6, pat: [[0, 0.25], [0.32, 0.55]] },
  moto: { f: [820], wave: 'square', band: 2000, len: 0.18, pat: [[0, 0.1], [0.14, 0.1], [0.28, 0.1]] },
  esportivo: { f: [523, 659], wave: 'square', band: 1200, len: 0.3, pat: [[0, 0.14], [0.16, 0.14], [0.32, 0.3]] },
  musical: { f: [523], wave: 'square', band: 1300, len: 0.2, pat: [[0, 0.12, 1], [0.14, 0.12, 1.25], [0.28, 0.12, 1.5], [0.42, 0.28, 2], [0.74, 0.12, 1.5], [0.88, 0.32, 2]] },
  trator: { f: [180], wave: 'square', band: 700, len: 0.5, pat: [[0, 0.5]] },
};
const Settings = { master: 80, engine: 75, ambient: 65, ui: 60, quality: 'media', zoom: 100, showFps: false, minimapRotate: false };
function loadSettings() {
  try { const s = JSON.parse(localStorage.getItem('brnd_settings') || 'null'); if (s && typeof s === 'object') Object.assign(Settings, s); } catch (e) { /* sem storage */ }
}
function saveSettings() { try { localStorage.setItem('brnd_settings', JSON.stringify(Settings)); } catch (e) { /* sem storage */ } }

/* ============================ PERFIL / SAVE ============================ */
const START_TIME = 20 * 60 + 30; // 20:30
function newProfile() {
  return {
    v: 1, money: 600,
    owned: { pampeiro: true }, current: 'pampeiro',
    cars: { pampeiro: { color: '#c0392b', up: { motor: 0, cambio: 0, freio: 0, pneu: 0 } } },
    fuel: 100, damage: 0, dirt: 0, pos: null,
    discovered: [], visited: [], races: {}, parks: {},
    deliveries: 0, earned: 0, distance: 0, time: START_TIME,
  };
}
let Profile = newProfile();
let hasSave = false;
function loadProfileFromStorage() {
  try {
    const p = JSON.parse(localStorage.getItem('brnd_save') || 'null');
    if (p && p.v === 1 && p.owned && p.cars) {
      const base = newProfile();
      return Object.assign(base, p);
    }
  } catch (e) { /* save inválido */ }
  return null;
}
function writeProfile() {
  try { localStorage.setItem('brnd_save', JSON.stringify(Profile)); hasSave = true; } catch (e) { /* sem storage */ }
}

/* ============================ ENTRADA ============================ */
const Keys = Object.create(null);
const KeyPress = [];
function isTyping(e) { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'); }
addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && !isTyping(e)) e.preventDefault();
  if (isTyping(e) && e.code !== 'Escape') return;
  if (!Keys[e.code]) KeyPress.push(e.code);
  Keys[e.code] = true;
});
addEventListener('keyup', (e) => { Keys[e.code] = false; });
addEventListener('blur', () => { for (const k in Keys) Keys[k] = false; if (typeof onWindowBlur === 'function') onWindowBlur(); });
const key = {
  up: () => Keys.KeyW || Keys.ArrowUp,
  down: () => Keys.KeyS || Keys.ArrowDown,
  left: () => Keys.KeyA || Keys.ArrowLeft,
  right: () => Keys.KeyD || Keys.ArrowRight,
  hb: () => Keys.Space,
  horn: () => Keys.KeyH,
};

/* ============================ ÁUDIO (Web Audio) ============================ */
const AudioSys = {
  ctx: null, ok: false, hornOn: false,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { this.ctx = null; return; }
    const c = this.ctx;
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -14; this.comp.ratio.value = 4;
    this.comp.connect(c.destination);
    this.master = c.createGain(); this.master.connect(this.comp);
    this.bus = {};
    for (const k of ['engine', 'ambient', 'ui']) { const g = c.createGain(); g.connect(this.master); this.bus[k] = g; }
    this.white = this.makeNoise(false, 2);
    this.brown = this.makeNoise(true, 4);
    this.setupEngine();
    this.setupAmbient();
    this.applyVolumes();
    this.ok = true;
  },
  makeNoise(brown, secs) {
    const c = this.ctx, len = Math.floor(c.sampleRate * secs);
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  },
  makeEngineCycle(cyl) {
    const c = this.ctx, sr = c.sampleRate, len = Math.round(sr * 0.12);
    const buf = c.createBuffer(1, len, sr), d = buf.getChannelData(0);
    const R = mulberry32(cyl * 131 + 7);
    for (let k = 0; k < cyl; k++) {
      const t0 = Math.round(k * len / cyl), amp = 0.75 + R() * 0.4, f = 48 + R() * 16, f2 = f * (2.1 + R() * 0.4), dec = 0.016 + R() * 0.008;
      for (let i = 0; i < len; i++) {
        let n = i - t0; if (n < 0) n += len;
        const tt = n / sr, env = Math.exp(-tt / dec);
        if (env < 0.001) continue;
        d[i] += amp * env * (Math.sin(TAU * f * tt) + 0.35 * Math.sin(TAU * f2 * tt)) + amp * Math.exp(-tt / (dec * 0.3)) * (R() * 2 - 1) * 0.45;
      }
    }
    let m = 0; for (let i = 0; i < len; i++) m = Math.max(m, Math.abs(d[i]));
    for (let i = 0; i < len; i++) d[i] = d[i] / m * 0.9;
    return buf;
  },
  loop(buf) { const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; },
  gain(v, dest) { const g = this.ctx.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; },
  filt(type, f, q, dest) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; if (dest) b.connect(dest); return b; },
  setupEngine() {
    const c = this.ctx;
    // motor: um ciclo completo de explosões (2 voltas do virabrequim a 1000 rpm) gerado em buffer,
    // tocado em loop com a velocidade de reprodução acompanhando a rotação (técnica de "loop de ciclo")
    this.eOut = this.gain(0, this.bus.engine);
    this.eLP = this.filt('lowpass', 900, 0.6, this.eOut);
    this.eBody = this.filt('peaking', 95, 1, this.eLP); this.eBody.gain.value = 5;
    this.eSrc = {}; this.eSel = {};
    for (const cyl of [4, 6]) {
      const src = c.createBufferSource(); src.buffer = this.makeEngineCycle(cyl); src.loop = true;
      const g = this.gain(0, this.eBody); src.connect(g);
      const mech = this.gain(0, this.eOut); src.connect(this.filt('bandpass', 1400, 1.5, mech));
      src.start(); this.eSrc[cyl] = src; this.eSel[cyl] = { g, mech };
    }
    const rumble = this.loop(this.brown);
    this.eRumble = this.gain(0, this.eOut);
    rumble.connect(this.filt('lowpass', 110, 1, this.eRumble));
    // pneus cantando
    const sq = this.loop(this.white);
    this.sGain = this.gain(0, this.bus.engine);
    this.sFilter = this.filt('bandpass', 2100, 7, this.sGain);
    sq.connect(this.sFilter);
    // vento / rolagem
    const wn = this.loop(this.white);
    this.wGain = this.gain(0, this.bus.engine);
    wn.connect(this.filt('lowpass', 520, 0.6, this.wGain));
    // terra/cascalho
    const gr = this.loop(this.white);
    this.gGain = this.gain(0, this.bus.engine);
    gr.connect(this.filt('bandpass', 900, 1.2, this.gGain));
  },
  setupAmbient() {
    const c = this.ctx;
    // grilos: portadora * pulsos rápidos * envelope lento
    this.crickets = [];
    const mk = (freq, fast, slow, vol) => {
      const out = this.gain(0, this.bus.ambient);
      const env = this.gain(0, out);
      const pulse = this.gain(0, env);
      const carrier = c.createOscillator(); carrier.type = 'sine'; carrier.frequency.value = freq; carrier.connect(pulse); carrier.start();
      const lf1 = c.createOscillator(); lf1.type = 'square'; lf1.frequency.value = fast;
      const d1 = this.gain(0.5); lf1.connect(d1); d1.connect(pulse.gain); pulse.gain.value = 0.5; lf1.start();
      const lf2 = c.createOscillator(); lf2.type = 'sine'; lf2.frequency.value = slow;
      const d2 = this.gain(0.5); lf2.connect(d2); d2.connect(env.gain); env.gain.value = 0.5; lf2.start();
      this.crickets.push({ out, vol });
    };
    mk(4350, 31, 1.7, 0.05); mk(3900, 24, 1.1, 0.04); mk(4800, 38, 0.63, 0.03);
    // zumbido da cidade
    const hum = this.loop(this.brown);
    this.cityGain = this.gain(0, this.bus.ambient);
    hum.connect(this.filt('lowpass', 240, 0.8, this.cityGain));
    const traffic = this.loop(this.white);
    this.trafficGain = this.gain(0, this.bus.ambient);
    traffic.connect(this.filt('bandpass', 380, 0.5, this.trafficGain));
    // rio
    const rv = this.loop(this.white);
    this.riverGain = this.gain(0, this.bus.ambient);
    const rf = this.filt('bandpass', 700, 0.6, this.riverGain);
    rv.connect(rf);
    this.riverF = rf;
    // horn (buzina do jogador)
    this.hornGain = this.gain(0, this.bus.engine);
    const hf = this.filt('lowpass', 1800, 1, this.hornGain);
    for (const f of [415, 520]) { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(this.gain(0.25, hf)); o.start(); }
  },
  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime((Settings.master / 100) * 0.9, t, 0.05);
    this.bus.engine.gain.setTargetAtTime(Settings.engine / 100, t, 0.05);
    this.bus.ambient.gain.setTargetAtTime(Settings.ambient / 100, t, 0.05);
    this.bus.ui.gain.setTargetAtTime(Settings.ui / 100, t, 0.05);
  },
  // p: {active, rpm, thr, speed, slip, surfaceRough, rural, city, river, pitch}
  update(p) {
    if (!this.ok) return;
    const t = this.ctx.currentTime, k = 0.06;
    const on = p.active ? 1 : 0;
    const load = p.thr, rr = Math.min(p.rpm / 7000, 1);
    const rate = Math.max(0.5, p.rpm / 1000) * p.pitch;
    for (const cyl of [4, 6]) {
      const sel = (p.cyl || 4) === cyl ? 1 : 0;
      this.eSrc[cyl].playbackRate.setTargetAtTime(rate, t, 0.03);
      this.eSel[cyl].g.gain.setTargetAtTime(sel * (0.55 + load * 0.6), t, 0.05);
      this.eSel[cyl].mech.gain.setTargetAtTime(sel * (0.02 + rr * 0.05), t, 0.08);
    }
    this.eLP.frequency.setTargetAtTime(380 + load * 1700 + p.rpm * 0.2, t, 0.06);
    this.eBody.frequency.setTargetAtTime(80 + p.rpm * 0.012, t, 0.1);
    this.eOut.gain.setTargetAtTime(on * (0.09 + load * 0.1 + rr * 0.05), t, 0.06);
    this.eRumble.gain.setTargetAtTime(on * (0.08 + load * 0.16), t, k);
    this.sGain.gain.setTargetAtTime(on * clamp(p.slip, 0, 1) * 0.16, t, 0.04);
    this.sFilter.frequency.setTargetAtTime(1700 + clamp(p.speed / 600, 0, 1) * 900, t, 0.1);
    this.wGain.gain.setTargetAtTime(on * clamp(p.speed / 650, 0, 1) * 0.11, t, 0.1);
    this.gGain.gain.setTargetAtTime(on * p.surfaceRough * clamp(p.speed / 300, 0, 1) * 0.12, t, 0.1);
    this.hornGain.gain.setTargetAtTime(on && this.hornOn ? 0.16 : 0, t, 0.015);
    // ambiente
    for (const cr of this.crickets) cr.out.gain.setTargetAtTime(cr.vol * (0.25 + p.rural * 1.1), t, 0.6);
    this.cityGain.gain.setTargetAtTime(0.05 + p.city * 0.13, t, 0.8);
    this.trafficGain.gain.setTargetAtTime(p.city * 0.035, t, 0.8);
    this.riverGain.gain.setTargetAtTime(p.river * 0.09, t, 0.6);
  },
  tone(freq, dur, type, vol, bus, slide, delay) {
    if (!this.ok) return;
    const c = this.ctx, t = c.currentTime + (delay || 0);
    const o = c.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.bus[bus || 'ui']);
    o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, freq, q, vol, bus, type, delay) {
    if (!this.ok) return;
    const c = this.ctx, t = c.currentTime + (delay || 0);
    const s = c.createBufferSource(); s.buffer = this.white;
    const f = c.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.bus[bus || 'engine']);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  // forró ambiente dos bares: zabumba, triângulo e sanfona sintetizados
  music(vol) {
    if (!this.ok) return;
    const c = this.ctx, t = c.currentTime;
    if (!this.mGain) { this.mGain = this.gain(0, this.bus.ambient); this.mLP = this.filt('lowpass', 2400, 0.7, this.mGain); this.mI = 0; this.mNext = 0; }
    this.mGain.gain.setTargetAtTime(vol, t, 0.4);
    if (vol < 0.002) { this.mNext = 0; return; }
    const sp = 60 / 116 / 4;
    if (!this.mNext || this.mNext < t) this.mNext = t + 0.05;
    while (this.mNext < t + 0.3) { this.mStep(this.mNext, this.mI++); this.mNext += sp; }
  },
  mNote(t, f, dur, type, v, slide, det, dst) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur); if (det) o.detune.value = det;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dst || this.mLP); o.start(t); o.stop(t + dur + 0.05);
  },
  mNoise(t, dur, f, v, dst, type) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.white;
    const b = c.createBiquadFilter(); b.type = type || 'highpass'; b.frequency.value = f; b.Q.value = 0.8;
    const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(b); b.connect(g); g.connect(dst); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  mStep(t, i, d) {
    const s = i % 16, bar = Math.floor(i / 16) % 4;
    if (s === 0 || s === 3 || s === 8 || s === 11) this.mNote(t, s % 8 === 0 ? 105 : 92, 0.28, 'sine', s % 8 === 0 ? 0.9 : 0.55, 48, 0, d);
    if (s === 4 || s === 12) this.mNote(t, 620, 0.05, 'triangle', 0.25, null, 0, d);
    const open = s % 4 === 2;
    this.mNote(t, 4100, open ? 0.22 : 0.04, 'sine', open ? 0.16 : 0.06, null, 0, d);
    if (open) this.mNote(t, 6150, 0.18, 'sine', 0.05, null, 0, d);
    if (s === 0 || s === 6 || s === 10) {
      const chords = [[261.6, 329.6, 392], [349.2, 440, 523.3], [392, 493.9, 587.3], [261.6, 329.6, 392]];
      for (const f of chords[bar]) { this.mNote(t, f, s === 0 ? 0.5 : 0.3, 'sawtooth', 0.05, null, -6, d); this.mNote(t, f, s === 0 ? 0.5 : 0.3, 'sawtooth', 0.05, null, 6, d); }
      this.mNote(t, chords[bar][0] / 2, 0.35, 'triangle', 0.18, null, 0, d);
    }
    if (s === 14 && bar === 3) this.mNote(t, 784, 0.12, 'square', 0.05, null, 0, d);
  },
  hover() { this.tone(1500, 0.04, 'sine', 0.035, 'ui'); },
  click() { this.tone(720, 0.07, 'triangle', 0.12, 'ui'); this.tone(1080, 0.06, 'sine', 0.06, 'ui', null, 0.03); },
  back() { this.tone(520, 0.08, 'triangle', 0.1, 'ui', 380); },
  error() { this.tone(180, 0.18, 'square', 0.06, 'ui'); },
  money() { this.tone(1318, 0.1, 'square', 0.05, 'ui'); this.tone(1760, 0.22, 'square', 0.05, 'ui', null, 0.08); },
  chime() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.08, 'ui', null, i * 0.09)); },
  checkpoint() { this.tone(988, 0.12, 'sine', 0.12, 'ui'); this.tone(1480, 0.18, 'sine', 0.1, 'ui', null, 0.07); },
  beep(hi) { this.tone(hi ? 1320 : 660, hi ? 0.5 : 0.2, 'square', 0.07, 'ui'); },
  crash(i) {
    i = clamp(i, 0.1, 1);
    this.noise(0.35, 500, 0.8, 0.5 * i, 'engine');
    this.tone(70, 0.3, 'sine', 0.5 * i, 'engine', 40);
    if (i > 0.5) this.noise(0.5, 3200, 2, 0.12 * i, 'engine', 'bandpass', 0.03);
  },
  breakSnd(mat, k) {
    k = clamp(k || 0.5, 0.2, 1);
    if (mat === 'wood') { this.noise(0.18, 900, 1.5, 0.35 * k, 'engine', 'bandpass'); this.tone(160, 0.12, 'triangle', 0.2 * k, 'engine', 90); }
    else if (mat === 'plastic' || mat === 'rubber') { this.noise(0.12, 2200, 1, 0.25 * k, 'engine', 'highpass'); this.tone(240, 0.08, 'square', 0.06 * k, 'engine', 150); }
    else if (mat === 'clay') { this.noise(0.22, 3000, 2, 0.3 * k, 'engine', 'bandpass'); }
    else if (mat === 'lamp') { this.tone(880, 0.5, 'triangle', 0.18 * k, 'engine', 600); this.tone(120, 0.6, 'sawtooth', 0.08, 'engine', 60); this.noise(0.4, 4000, 0.8, 0.15, 'engine', 'highpass', 0.05); }
    else { this.tone(980, 0.35, 'triangle', 0.2 * k, 'engine', 760); this.tone(1430, 0.25, 'sine', 0.1 * k, 'engine'); this.noise(0.15, 1800, 1, 0.2 * k, 'engine', 'bandpass'); }
  },
  thud() { this.tone(90, 0.12, 'sine', 0.15, 'engine', 60); },
  pump() { this.noise(0.9, 1200, 1, 0.08, 'ui', 'bandpass'); this.tone(240, 0.8, 'sawtooth', 0.02, 'ui'); },
  wash() { this.noise(1.4, 3000, 0.6, 0.1, 'ui', 'highpass'); },
  wrench() { [0, 0.18, 0.36].forEach((d) => this.tone(1900, 0.06, 'square', 0.04, 'ui', 1500, d)); },
  // buzina dos outros carros: cada carro tem a sua, com volume e lado (estéreo) pela posição
  aiHorn(dist, type, pan, long) {
    if (!this.ok) return;
    const v = clamp(1 - dist / 950, 0, 1) * 0.085;
    if (v < 0.004) return;
    const H = HORNS[type] || HORNS.dupla, c = this.ctx, t0 = c.currentTime + 0.01;
    const out = c.createGain(); out.gain.value = v;
    let node = out;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(pan || 0, -0.9, 0.9); out.connect(p); p.connect(this.bus.ambient); } else out.connect(this.bus.ambient);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = H.band; bp.Q.value = 0.9; bp.connect(node);
    const sh = c.createWaveShaper(); sh.curve = this.hornCurve || (this.hornCurve = (() => { const n = 256, a = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; a[i] = Math.tanh(x * 3); } return a; })()); sh.connect(bp);
    const pat = long ? [[0, H.len * 2.4]] : H.pat;
    for (const [st, du, fm] of pat) {
      for (const f of H.f) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = H.wave; o.frequency.setValueAtTime(f * (fm || 1), t0 + st);
        if (H.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = H.vib; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t0 + st); l.stop(t0 + st + du + 0.05); }
        g.gain.setValueAtTime(0.0001, t0 + st); g.gain.exponentialRampToValueAtTime(0.5 / H.f.length, t0 + st + 0.012);
        g.gain.setValueAtTime(0.5 / H.f.length, t0 + st + du - 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + st + du);
        o.connect(g); g.connect(sh); o.start(t0 + st); o.stop(t0 + st + du + 0.05);
      }
    }
  },
  bark(dist) {
    const v = clamp(1 - dist / 1200, 0.05, 1) * 0.12;
    for (let i = 0; i < 2; i++) { this.noise(0.09, 700, 3, v, 'ambient', 'bandpass', i * 0.22); this.tone(520, 0.08, 'sawtooth', v * 0.4, 'ambient', 300, i * 0.22); }
  },
  owl() { this.tone(390, 0.35, 'sine', 0.05, 'ambient', 360); this.tone(390, 0.5, 'sine', 0.05, 'ambient', 340, 0.5); },
  frog() { for (let i = 0; i < 3; i++) this.tone(170, 0.07, 'square', 0.025, 'ambient', 120, i * 0.13); },
  moo() { this.tone(160, 1.1, 'sawtooth', 0.03, 'ambient', 120); },
  siren() {
    if (!this.ok) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'triangle';
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.02, t + 1); g.gain.linearRampToValueAtTime(0.0001, t + 5);
    for (let i = 0; i < 6; i++) { o.frequency.setValueAtTime(650, t + i * 0.8); o.frequency.linearRampToValueAtTime(950, t + i * 0.8 + 0.4); o.frequency.linearRampToValueAtTime(650, t + i * 0.8 + 0.8); }
    o.connect(g); g.connect(this.bus.ambient); o.start(t); o.stop(t + 5.2);
  },
};
/* ============================ MUNDO ============================ */
const WORLD_W = 9000, WORLD_H = 9200;
const SERRA_YS = [6200, 6900, 7500, 8100, 8700];
const GC = 10, GW = WORLD_W / GC, GH = WORLD_H / GC;
const SF = { GRASS: 0, ROAD: 1, SIDEWALK: 2, DIRT: 3, WATER: 4, BRIDGE: 5, PAVED: 6, FIELD: 7, EARTH: 8, SAND: 9 };
const SURF = [
  { grip: 0.55, drag: 1.05, dirt: 0.020, rough: 0.6 },  // grama
  { grip: 1.00, drag: 0.00, dirt: -0.004, rough: 0 },   // asfalto
  { grip: 0.95, drag: 0.10, dirt: 0, rough: 0.15 },     // calçada
  { grip: 0.70, drag: 0.30, dirt: 0.030, rough: 0.8 },  // terra
  { grip: 1.00, drag: 0.00, dirt: 0, rough: 0 },        // água (bloqueado)
  { grip: 0.95, drag: 0.02, dirt: 0, rough: 0.35 },     // ponte
  { grip: 0.97, drag: 0.03, dirt: 0, rough: 0.05 },     // pavimentado
  { grip: 0.50, drag: 1.55, dirt: 0.045, rough: 1 },    // plantação
  { grip: 0.66, drag: 0.55, dirt: 0.030, rough: 0.7 },  // chão batido
  { grip: 0.48, drag: 1.70, dirt: 0.020, rough: 0.9 },  // areia
];
const ground = new Uint8Array(GW * GH);
function gFill(x0, y0, x1, y1, t) {
  const a = clamp(Math.floor(x0 / GC), 0, GW - 1), b = clamp(Math.ceil(x1 / GC) - 1, 0, GW - 1);
  const c = clamp(Math.floor(y0 / GC), 0, GH - 1), d = clamp(Math.ceil(y1 / GC) - 1, 0, GH - 1);
  for (let y = c; y <= d; y++) { const row = y * GW; for (let x = a; x <= b; x++) ground[row + x] = t; }
}
function groundAt(x, y) {
  const gx = (x / GC) | 0, gy = (y / GC) | 0;
  if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return SF.WATER;
  return ground[gy * GW + gx];
}

/* -------- grade espacial -------- */
let _gridId = 0;
class Grid {
  constructor(cell) {
    this.cell = cell; this.cols = Math.ceil(WORLD_W / cell) + 1; this.rows = Math.ceil(WORLD_H / cell) + 1;
    this.cells = new Array(this.cols * this.rows); this.stamp = 0; this.k = '_g' + (_gridId++);
  }
  insert(o, x0, y0, x1, y1) {
    const c = this.cell;
    const a = clamp(Math.floor(x0 / c), 0, this.cols - 1), b = clamp(Math.floor(x1 / c), 0, this.cols - 1);
    const e = clamp(Math.floor(y0 / c), 0, this.rows - 1), f = clamp(Math.floor(y1 / c), 0, this.rows - 1);
    for (let y = e; y <= f; y++) for (let x = a; x <= b; x++) {
      const i = y * this.cols + x;
      (this.cells[i] || (this.cells[i] = [])).push(o);
    }
  }
  query(x0, y0, x1, y1, out) {
    out.length = 0;
    const c = this.cell, s = ++this.stamp, k = this.k;
    const a = clamp(Math.floor(x0 / c), 0, this.cols - 1), b = clamp(Math.floor(x1 / c), 0, this.cols - 1);
    const e = clamp(Math.floor(y0 / c), 0, this.rows - 1), f = clamp(Math.floor(y1 / c), 0, this.rows - 1);
    for (let y = e; y <= f; y++) for (let x = a; x <= b; x++) {
      const arr = this.cells[y * this.cols + x];
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) { const o = arr[i]; if (o[k] !== s) { o[k] = s; out.push(o); } }
    }
    return out;
  }
}
const colGrid = new Grid(128);
const rendGrid = new Grid(256);
const lightGrid = new Grid(256);
const bakeGrid = new Grid(512);
let _bakeOrd = 0;
function bake(x0, y0, x1, y1, z, fn) {
  const it = { x0, y0, x1, y1, z, fn, o: _bakeOrd++ };
  bakeGrid.insert(it, x0, y0, x1, y1);
  return it;
}
function addRectCol(x0, y0, x1, y1, tag) { const c = { t: 0, x0, y0, x1, y1, tag: tag || 'solid' }; colGrid.insert(c, x0, y0, x1, y1); return c; }
function addCircCol(x, y, r, tag) { const c = { t: 1, x, y, r, tag: tag || 'solid' }; colGrid.insert(c, x - r, y - r, x + r, y + r); return c; }
const _q = [];
function areaBlocked(x0, y0, x1, y1) {
  colGrid.query(x0, y0, x1, y1, _q);
  for (const c of _q) {
    if (c.t === 0) { if (c.x1 > x0 && c.x0 < x1 && c.y1 > y0 && c.y0 < y1) return true; }
    else if (c.x + c.r > x0 && c.x - c.r < x1 && c.y + c.r > y0 && c.y - c.r < y1) return true;
  }
  return false;
}

const World = {
  nodes: [], edges: [], nodeMap: new Map(),
  buildings: [], tall: [], lights: [], shops: [], pois: [], races: [], parkSpots: [],
  homes: [], animalsDef: [], pickups: [], trafficPoles: [], bumps: [], grills: [], radars: [], sparkers: [], geysers: [], fountains: [], obras: [], depots: {}, rachas: [], parties: [], pitches: [],
};

/* -------- tipos de via -------- */
const RT = {
  street: { id: 'street', w: 95, sw: 22, lanes: [23], speed: 150, asphalt: true, center: 'dash' },
  avenue: { id: 'avenue', w: 180, sw: 22, lanes: [25, 67], speed: 190, asphalt: true, center: 'double', laneDiv: 46 },
  highway: { id: 'highway', w: 180, sw: 0, lanes: [24, 66], speed: 280, asphalt: true, center: 'double', laneDiv: 45, edgeLine: true, shoulder: 16 },
  road: { id: 'road', w: 90, sw: 0, lanes: [23], speed: 200, asphalt: true, center: 'dash', edgeLine: true, shoulder: 12 },
  dirt: { id: 'dirt', w: 76, sw: 0, lanes: [18], speed: 115, asphalt: false },
};
const XS = [300, 850, 1450, 2100, 2700, 3350, 3950, 4600];
const YS = [300, 880, 1500, 2080, 2700, 3300, 3880, 4500, 5300];
const HWY_Y = 6200;
const ROADS = [];
function H(y, x1, x2, t, name) { ROADS.push({ h: true, y, x1, x2, T: RT[t], name }); }
function V(x, y1, y2, t, name) { ROADS.push({ h: false, x, y1, y2, T: RT[t], name }); }

function riverCX(y) { return 5450 + Math.sin(y * 0.00105) * 140 + Math.sin(y * 0.0029 + 1.3) * 45; }
function riverHW(y) { return 135 + Math.sin(y * 0.0021 + 0.5) * 22; }

function defineRoads() {
  H(300, 300, 4600, 'street', 'Rua do Pão de Queijo');
  H(880, 300, 4600, 'street', 'Rua Sete de Sextembro');
  H(1500, 300, 4600, 'avenue', 'Avenida Brasil Sil Sil');
  H(1500, 4600, 8700, 'road', 'Estrada do Sol Rachando');
  H(2080, 300, 4600, 'street', 'Rua 15 de Novembrinho');
  H(2700, 300, 4600, 'street', 'Rua dos Bobos');
  H(3300, 300, 4600, 'street', 'Rua Ipê-Ipê Urra');
  H(3880, 300, 4600, 'avenue', 'Avenida Sem Mundial');
  H(3880, 4600, 8700, 'dirt', 'Estrada da Ponte Que Balança');
  H(4500, 300, 4600, 'street', 'Rua Tem Que Ver Isso Aí');
  H(5300, 300, 4600, 'street', 'Rua da Esperança Equilibrista');
  H(880, 7500, 8700, 'dirt', 'Estrada da Vaca Atolada');
  H(5300, 6300, 7500, 'dirt', 'Ramal do Fim do Mundo');
  H(HWY_Y, 300, 8700, 'highway', 'Rodovia BR-101 e Pouco');
  V(300, 300, 8700, 'street', 'Rua Santos Dumontanha');
  V(850, 300, 5300, 'street', 'Rua da Matriz Perdoa');
  V(1450, 300, 8700, 'street', 'Rua do Cafezinho');
  V(2100, 300, 8700, 'avenue', 'Avenida Paulistinha');
  V(2700, 300, 5300, 'street', 'Rua Bela Vista Cansada');
  V(3350, 300, 5300, 'street', 'Rua da Gambiarra');
  V(3950, 300, 8700, 'street', 'Rua do Comércio Fiado');
  V(4600, 300, 8700, 'street', 'Rua Beira-Rio Sem Peixe');
  // Serra: Feu Rosa e Jardim Carapina
  V(850, 6200, 8700, 'street', 'Rua da Laje Batida');
  V(2700, 6200, 8700, 'street', 'Rua do Campinho');
  V(3350, 6200, 8700, 'street', 'Rua da Padaria do Morro');
  H(6900, 300, 4600, 'street', 'Rua das Flores de Feu Rosa');
  H(7500, 300, 4600, 'avenue', 'Avenida Carapina');
  H(8100, 300, 4600, 'street', 'Rua do Baile');
  H(8700, 300, 4600, 'street', 'Rua da Esperança Que Sobe');
  V(6300, 1500, 6200, 'road', 'Estrada Velha de Guerra');
  V(7500, 880, 6200, 'dirt', 'Estrada do Sítio Bota Fé');
  V(8700, 880, 6200, 'road', 'Estrada Alta Pressão');
}

function getNode(x, y) {
  const k = x + ',' + y;
  let n = World.nodeMap.get(k);
  if (!n) { n = { id: World.nodes.length, x, y, edges: [], light: null, res: null, resT: 0 }; World.nodes.push(n); World.nodeMap.set(k, n); }
  return n;
}
function buildRoadGraph() {
  defineRoads();
  for (const r of ROADS) r.pts = new Set(r.h ? [r.x1, r.x2] : [r.y1, r.y2]);
  for (const h of ROADS) if (h.h) for (const v of ROADS) if (!v.h) {
    if (v.x >= h.x1 && v.x <= h.x2 && h.y >= v.y1 && h.y <= v.y2) { h.pts.add(v.x); v.pts.add(h.y); }
  }
  for (const r of ROADS) {
    const p = [...r.pts].sort((a, b) => a - b);
    for (let i = 0; i < p.length - 1; i++) {
      const a = r.h ? getNode(p[i], r.y) : getNode(r.x, p[i]);
      const b = r.h ? getNode(p[i + 1], r.y) : getNode(r.x, p[i + 1]);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const e = { id: World.edges.length, a, b, T: r.T, name: r.name, h: r.h, len, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len, hw: r.T.w / 2, bridge: null };
      a.edges.push(e); b.edges.push(e); World.edges.push(e);
    }
  }
  const perp = (e, n) => { let m = 0; for (const o of n.edges) if (o.h !== e.h) m = Math.max(m, o.hw); return m; };
  for (const e of World.edges) {
    const pa = perp(e, e.a), pb = perp(e, e.b);
    const pad = e.T.sw ? 26 : 10;
    e.perpA = pa; e.perpB = pb;
    e.clearA = pa > 0 ? pa + pad : 8;
    e.clearB = pb > 0 ? pb + pad : 8;
    if (e.h) {
      const cx = riverCX(e.a.y), hw = riverHW(e.a.y);
      if (e.a.x < cx - hw && e.b.x > cx + hw) e.bridge = { x0: cx - hw - 46, x1: cx + hw + 46, wood: e.T.id === 'dirt' };
    }
  }
  const lightNodes = [[850, 1500], [1450, 1500], [2100, 1500], [2700, 1500], [3350, 1500], [2100, 880], [2100, 2080], [2100, 2700], [2100, 3880], [1450, 3880], [2700, 3880], [2100, 6200]];
  for (const [x, y] of lightNodes) {
    const n = World.nodeMap.get(x + ',' + y);
    if (n) n.light = { off: rnd(0, 15) };
  }
}
function edgeBox(e, extra) {
  const m = e.hw + (e.T.sw || 0) + (e.T.shoulder || 0) + (extra || 0);
  if (e.h) return [e.a.x, e.a.y - m, e.b.x, e.a.y + m];
  return [e.a.x - m, e.a.y, e.a.x + m, e.b.y];
}
function nearestEdge(x, y) {
  let best = null, bd = 1e18, bs = 0;
  for (const e of World.edges) {
    let s, d;
    if (e.h) { s = clamp(x - e.a.x, 0, e.len); d = Math.hypot(x - (e.a.x + s), y - e.a.y); }
    else { s = clamp(y - e.a.y, 0, e.len); d = Math.hypot(x - e.a.x, y - (e.a.y + s)); }
    if (d < bd) { bd = d; best = e; bs = s; }
  }
  return { e: best, d: bd, s: bs };
}

/* -------- regiões -------- */
const REGIONS = {
  centro: { name: 'Centrão', dark: 0.72, city: 1, rural: 0 },
  industrial: { name: 'Distrito da Gambiarra', dark: 0.76, city: 0.6, rural: 0.1 },
  vila: { name: 'Vila Sem Pressa', dark: 0.75, city: 0.55, rural: 0.25 },
  jardim: { name: 'Alfavila', dark: 0.75, city: 0.45, rural: 0.3 },
  rio: { name: 'Rio Jucu', dark: 0.76, city: 0.15, rural: 0.8 },
  sitio: { name: 'Sítio Bota Fé', dark: 0.76, city: 0, rural: 1 },
  fazenda: { name: 'Fazenda Muuuito Longe', dark: 0.76, city: 0, rural: 1 },
  rodovia: { name: 'Rodovia BR-101 e Pouco', dark: 0.76, city: 0.2, rural: 0.7 },
  novarosa: { name: 'Nova Rosa da Penha', dark: 0.74, city: 0.7, rural: 0.15 },
  flexal: { name: 'Flexal', dark: 0.74, city: 0.7, rural: 0.15 },
  saopedro: { name: 'Morro de São Pedro', dark: 0.75, city: 0.6, rural: 0.2 },
  terravermelha: { name: 'Terra Vermelha', dark: 0.75, city: 0.6, rural: 0.2 },
  feurosa: { name: 'Feu Rosa', dark: 0.74, city: 0.7, rural: 0.15 },
  carapina: { name: 'Jardim Carapina', dark: 0.74, city: 0.7, rural: 0.15 },
  mata: { name: 'Mata do Saci', dark: 0.80, city: 0, rural: 1 },
};
const SUBREG = [];
function regionKeyAt(x, y) {
  if (x < 230 || y < 230 || x > 8790 || y > WORLD_H - 240) return 'mata';
  for (const s of SUBREG) if (x > s[0] && x < s[2] && y > s[1] && y < s[3]) return s[4];
  if (y > 8030 && x < 4660) return x < 2700 ? 'novarosa' : 'flexal';
  if (y > 6440 && x < 4660) return x < 2100 ? 'feurosa' : 'carapina';
  if (y > 6440) return 'mata';
  if (y > 5720) return 'rodovia';
  if (x >= 6200) return y < 3300 ? 'sitio' : 'fazenda';
  if (x >= 4660) return 'rio';
  if (y < 2700) return x < 3350 ? 'centro' : 'industrial';
  return x < 2100 ? 'vila' : 'jardim';
}

/* -------- decalques (chão) -------- */
const DECAL_SURF = {
  lawn: SF.GRASS, lawn2: SF.GRASS, yard: SF.PAVED, drive: SF.PAVED, urban: SF.PAVED, paved: SF.PAVED, gravel: SF.EARTH,
  concrete: SF.PAVED, plaza: SF.PAVED, walk: SF.PAVED, corn: SF.FIELD, cane: SF.FIELD, coffee: SF.FIELD, soy: SF.FIELD,
  hill: SF.GRASS, pasture: SF.GRASS, earth: SF.EARTH, soccer: SF.EARTH, forest: SF.GRASS, garden: SF.FIELD, sand: SF.SAND, pool: SF.WATER, court: SF.PAVED,
};
function decal(x0, y0, x1, y1, type, opt) {
  const d = { x0, y0, x1, y1, type, seed: (hash2(x0 | 0, y0 | 0) * 1e6) | 0, opt: opt || {} };
  bake(x0, y0, x1, y1, d.opt.z !== undefined ? d.opt.z : 1, (g) => drawDecal(g, d));
  if (DECAL_SURF[type] !== undefined && !d.opt.noSurf) gFill(x0, y0, x1, y1, DECAL_SURF[type]);
  return d;
}
function decalR(r, type, opt) { return decal(r[0], r[1], r[2], r[3], type, opt); }

/* -------- objetos -------- */
const HOUSE_COLORS = ['#e8d9a8', '#f0c8a0', '#c9dfe8', '#e3b5b5', '#cfe3c1', '#f2efe6', '#e8c07a', '#d6c4e6', '#b9d4c9', '#f4dcc0', '#e1a77a', '#a9c6e0'];
const WALL_COLORS = ['#d8d2c2', '#c9b79c', '#e6e0d0', '#b8b0a2', '#cfc6b0', '#9fa8a3', '#e2d2b6', '#c4a989'];
const OFFICE_COLORS = ['#8c939e', '#a39a8b', '#6f7a87', '#b5ada0', '#7d8a8f', '#9c8f84', '#5f6b78', '#c2b8a8'];
const ROOF_TILE = ['#a8492b', '#b8582f', '#93422a', '#c06a3c', '#8a3b24'];

function addBuilding(x0, y0, x1, y1, h, o) {
  o = o || {};
  const b = {
    kind: 'bld', x0, y0, x1, y1, h, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2,
    style: o.style || 'house', roofType: o.roofType || 'flat', roofColor: o.roofColor || '#7d7b78',
    wall: o.wall || pick(HOUSE_COLORS), lit: o.lit !== undefined ? o.lit : 0.4,
    seed: (hash2(x0 | 0, y1 | 0) * 1e6) | 0, front: o.front || 'S', sign: o.sign || null, signColor: o.signColor || '#ffb547',
    roof: null, glowSign: null, alphaNear: !!o.alphaNear,
  };
  World.buildings.push(b); World.tall.push(b);
  if (!o.noCol) addRectCol(x0, y0, x1, y1, 'bld');
  rendGrid.insert(b, x0, y0, x1, y1);
  if (!o.noShadow) {
    const sx = h * 0.42, sy = h * 0.55;
    bake(x0, y0, x1 + sx, y1 + sy, 7, (g) => {
      g.fillStyle = 'rgba(0,0,0,0.34)';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1 + sx, y0 + sy); g.lineTo(x1 + sx, y1 + sy); g.lineTo(x0 + sx, y1 + sy); g.lineTo(x0, y1); g.closePath(); g.fill();
    });
  }
  return b;
}
function addTall(o, x0, y0, x1, y1) { World.tall.push(o); rendGrid.insert(o, x0, y0, x1, y1); return o; }
function addLight(x, y, r, i, col, extra) {
  const L = Object.assign({ x, y, r, i, col, flick: 0, broken: false, seed: rnd() }, extra || {});
  World.lights.push(L); lightGrid.insert(L, x - r, y - r, x + r, y + r);
  return L;
}

const TREE_TYPES = ['round', 'round', 'mango', 'ipeY', 'ipeP', 'palm', 'bush', 'pine'];
function addTree(x, y, type, size, opt) {
  opt = opt || {};
  if (!opt.force) {
    const gt = groundAt(x, y);
    if (gt === SF.ROAD || gt === SF.DIRT || gt === SF.WATER || gt === SF.BRIDGE || gt === SF.SIDEWALK && !opt.sidewalk) return null;
    if (areaBlocked(x - 6, y - 6, x + 6, y + 6)) return null;
  }
  size = size || rnd(0.8, 1.25);
  const t = { kind: 'tree', x, y, type, size, h: (type === 'palm' ? 46 : type === 'bush' ? 10 : 30) * size, v: rndi(0, 2), alpha: 1 };
  World.tall.push(t);
  const R = (type === 'palm' ? 26 : type === 'bush' ? 12 : 24) * size;
  rendGrid.insert(t, x - R, y - R, x + R, y + R);
  const tc = type !== 'bush' ? addCircCol(x, y, type === 'palm' ? 4 : 5 * size, 'tree') : addCircCol(x, y, 7 * size, 'tree');
  t.col = tc;
  if (opt.sidewalk || type === 'bush' || size < 0.9) tc.brk = { kind: 'tree', obj: t };
  const sr = R * 0.9;
  bake(x - sr, y - sr, x + sr * 2, y + sr * 2, 7, (g) => {
    if (t.removed) return;
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath(); g.ellipse(x + sr * 0.45, y + sr * 0.55, sr, sr * 0.8, 0.5, 0, TAU); g.fill();
  });
  return t;
}
function scatterTrees(x0, y0, x1, y1, n, types, smin, smax) {
  let made = 0;
  for (let i = 0; i < n * 3 && made < n; i++) {
    if (addTree(rnd(x0, x1), rnd(y0, y1), pick(types), rnd(smin || 0.8, smax || 1.25))) made++;
  }
}
function addLamp(bx, by, hx, hy, col, opt) {
  opt = opt || {};
  const lamp = { kind: 'lamp', x: bx, y: by, hx, hy, h: opt.h || 56, col, style: opt.style || 'arm', broken: opt.broken || false };
  World.tall.push(lamp);
  rendGrid.insert(lamp, Math.min(bx, hx) - 60, Math.min(by, hy) - 60, Math.max(bx, hx) + 60, Math.max(by, hy) + 60);
  const lc = addCircCol(bx, by, 4, 'pole'); lc.brk = { kind: 'lamp', obj: lamp };
  if (!lamp.broken) lamp.light = addLight(hx, hy, opt.r || 175, opt.i || 0.92, col, { lamp, flick: opt.flick ? 1 : 0 });
  bake(bx - 4, by - 4, bx + 30, by + 34, 7, (g) => { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + 22, by + 28); g.stroke(); });
  return lamp;
}
// objetos baixos (desenhados no chão pré-renderizado)
function addProp(type, x, y, opt) {
  opt = opt || {};
  const p = { type, x, y, a: opt.a || 0, c: opt.c || null, w: opt.w || 0, h: opt.h || 0, seed: rnd() };
  const R = opt.R || 30;
  bake(x - R, y - R, x + R, y + R, opt.z || 8, (g) => drawProp(g, p));
  let col = null;
  if (opt.col === 'circ') col = addCircCol(x, y, opt.cr || 6, 'prop');
  else if (opt.col === 'rect') col = addRectCol(x - opt.w / 2, y - opt.h / 2, x + opt.w / 2, y + opt.h / 2, 'prop');
  if (col && BREAKABLE[type]) col.brk = { kind: 'prop', obj: p, R: R + 20 };
  return p;
}
function addWall(x0, y0, x1, y1, color, opt) {
  opt = opt || {};
  if (x1 - x0 < 1 || y1 - y0 < 1) return;
  const w = { x0, y0, x1, y1, color, hgt: opt.h || 4, kind: opt.kind || 'wall', graf: opt.graf || null };
  bake(x0 - 2, y0 - 8, x1 + 6, y1 + 8, 8, (g) => drawWallBaked(g, w));
  if (!opt.noCol) addRectCol(x0, y0, x1, y1, 'wall');
}
function addFence(x0, y0, x1, y1, opt) {
  opt = opt || {};
  const f = { x0, y0, x1, y1, type: opt.type || 'wood', gaps: [] };
  bake(x0 - 4, y0 - 6, x1 + 6, y1 + 6, 8, (g) => drawFenceBaked(g, f));
  addRectCol(x0, y0, x1, y1, 'fence').brk = { kind: 'fence', obj: f };
}
// cercado com portões (gaps: lista {side, at, w})
function fenceRect(x0, y0, x1, y1, gaps, type) {
  const T = 3;
  const seg = (side, a, b, mk) => {
    const gs = (gaps || []).filter((g) => g.side === side).sort((p, q) => p.at - q.at);
    let cur = a;
    for (const g of gs) { if (g.at - g.w / 2 > cur) mk(cur, g.at - g.w / 2); cur = g.at + g.w / 2; }
    if (b > cur) mk(cur, b);
  };
  seg('N', x0, x1, (a, b) => addFence(a, y0 - T / 2, b, y0 + T / 2, { type }));
  seg('S', x0, x1, (a, b) => addFence(a, y1 - T / 2, b, y1 + T / 2, { type }));
  seg('W', y0, y1, (a, b) => addFence(x0 - T / 2, a, x0 + T / 2, b, { type }));
  seg('E', y0, y1, (a, b) => addFence(x1 - T / 2, a, x1 + T / 2, b, { type }));
}
const PARKED = [];
function addParkedCar(x, y, ang, model, color) {
  const m = VMODELS[model];
  const vert = Math.abs(Math.sin(ang)) > 0.5;
  const hx = (vert ? m.W : m.L) / 2, hy = (vert ? m.L : m.W) / 2;
  if (areaBlocked(x - hx, y - hy, x + hx, y + hy)) return null;
  const p = { x, y, a: ang, model, color };
  PARKED.push(p);
  bake(x - hx - 12, y - hy - 12, x + hx + 12, y + hy + 12, 8.5, (g) => drawVehicle(g, m, color, x, y, ang, { parked: true, seed: p.x }));
  addRectCol(x - hx, y - hy, x + hx, y + hy, 'car');
  return p;
}
const CAR_COLORS = ['#d6c7a1', '#9fc5e8', '#8a2b2b', '#d9d9d9', '#bfc3c7', '#8d949b', '#1d1f24', '#f2f2f2', '#a8231f', '#24446e', '#5a6b4e', '#c9b28a', '#7a1f2b', '#2d5d8a', '#d8c25a', '#3f3f46'];
function randomCarModel() { return pick(['quadrado', 'quadrado', 'escada', 'besouro', 'hatch', 'santana', 'sedan', 'pickup', 'van', 'sport']); }

/* -------- estabelecimentos -------- */
function addShop(def) {
  const s = Object.assign({ id: def.kind + '_' + World.shops.length, visited: false }, def);
  World.shops.push(s);
  return s;
}

/* ============================ LOTES E QUARTEIRÕES ============================ */
const MURO_FRASES = ['FÉ EM DEUS', 'DEUS É FIEL', 'JESUS TE AMA', 'NÃO JOGUE LIXO', 'ALUGA-SE', 'VENDE-SE', 'RESPEITA AS MINA', 'SAUDADE ETERNA', 'MAIS AMOR', 'PAZ NA QUEBRADA', 'FAVELA VIVE', 'CRIA DO MORRO', 'SÓ OS CRIA', 'VAI DAR CERTO', 'O MORRO É TALENTO', 'CAPIXABA COM ORGULHO', 'ESTUDA, MOLEQUE', 'FAZ O BEM', 'TÁ PAGO', 'SORRIA, VOCÊ ESTÁ NO 027'];
const PIXOS = ['CREW 027', 'OS GAMBIARRA', 'NOIS', 'ZN 027', 'LOKOS', 'PIXO ES', 'LAJE CREW', '027 SKATE', 'MANOS DA SERRA', 'TINTA FRESCA'];
function addGraffiti(b, kind) {
  return; // pichações removidas (custavam muito desempenho)
  kind = kind || (chance(0.45) ? 'frase' : chance(0.6) ? 'pixo' : 'mural');
  b.graf = { kind, text: kind === 'frase' || kind === 'mural' ? pick(MURO_FRASES) : pick(PIXOS), color: kind === 'pixo' ? pick(['#111111', '#111111', '#f2f2ea', '#c8241c']) : pick(['#e63946', '#1d4f9c', '#2a9d8f', '#111111', '#f4c430']), seed: rnd() };
}
const BREAKABLE = { cone: 'plastic', barrier: 'wood', bench: 'wood', bin: 'plastic', hydrant: 'metal', bollard: 'metal', table: 'plastic', tires: 'rubber', cart: 'metal', pot: 'clay' };
function lotFrame(x0, y0, x1, y1, front) {
  const F = { front, x0, y0, x1, y1 };
  const ns = front === 'N' || front === 'S';
  F.W = ns ? x1 - x0 : y1 - y0;
  F.D = ns ? y1 - y0 : x1 - x0;
  F.pt = (u, v) => {
    switch (front) {
      case 'N': return [x0 + u, y0 + v];
      case 'S': return [x1 - u, y1 - v];
      case 'W': return [x0 + v, y1 - u];
      default: return [x1 - v, y0 + u];
    }
  };
  F.rect = (u0, v0, u1, v1) => { const a = F.pt(u0, v0), b = F.pt(u1, v1); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; };
  F.out = { N: -Math.PI / 2, S: Math.PI / 2, W: Math.PI, E: 0 }[front];
  return F;
}
function splitRun(L, mn, mx) {
  const out = []; let rem = L;
  while (rem > mx) { const w = Math.round(rnd(mn, mx)); out.push(w); rem -= w; }
  if (rem < mn * 0.6 && out.length) out[out.length - 1] += rem; else out.push(rem);
  return out;
}
// ponto na pista em frente ao lote (faixa da direita mais próxima da calçada)
function roadPointFor(F, u, roadHW, laneOff) {
  return F.pt(u, -22 - (roadHW - laneOff));
}
const streetNums = new Map();
function nextNumber(name, side) {
  const k = name + side;
  const n = (streetNums.get(k) || (side === 'a' ? 11 : 20)) + rndi(1, 4) * 2 + 6;
  streetNums.set(k, n);
  return n;
}
function houseLot(F, o) {
  const W = F.W, D = F.D, rich = o.rich;
  const wallCol = pick(WALL_COLORS);
  const gateW = 32;
  const hasCar = W > 70 && chance(rich ? 0.5 : 0.36);
  const gateU = chance(0.5) ? 8 : W - 8 - gateW;
  const cim = chance(0.5);
  if (cim) decalR(F.rect(0, 0, W, Math.min(D, 70)), 'yard');
  // muros
  const fw = (u0, u1) => { if (u1 - u0 > 2) { const r = F.rect(u0, 0, u1, 5); addWall(r[0], r[1], r[2], r[3], wallCol); } };
  fw(0, gateU); fw(gateU + gateW, W);
  { const r = F.rect(0, 5, 4, D); addWall(r[0], r[1], r[2], r[3], wallCol); }
  if (o.lastLot) { const r = F.rect(W - 4, 5, W, D); addWall(r[0], r[1], r[2], r[3], wallCol); }
  if (o.back) { const r = F.rect(4, D - 4, W, D); addWall(r[0], r[1], r[2], r[3], wallCol); }
  // portão (desenhado no chão)
  { const r = F.rect(gateU, 0, gateU + gateW, 4); bake(r[0], r[1], r[2], r[3], 8, (g) => { g.fillStyle = '#3d3a36'; g.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]); g.fillStyle = '#6d6860'; for (let i = 0; i < 6; i++) { if (F.front === 'N' || F.front === 'S') g.fillRect(r[0] + 2 + i * 5, r[1], 1.5, r[3] - r[1]); else g.fillRect(r[0], r[1] + 2 + i * 5, r[2] - r[0], 1.5); } }); }
  const setback = hasCar ? rnd(58, 66) : rnd(22, 38);
  let depth = rich ? rnd(82, 104) : rnd(60, 82);
  depth = Math.min(depth, D - setback - 14);
  if (depth < 40) return;
  const sob = chance(rich ? 0.38 : 0.14);
  let h = sob ? rnd(42, 48) : rnd(25, 31);
  let roofType = rich ? pick(['hip', 'hip', 'flat', 'gable', 'hip']) : pick(['hip', 'hip', 'laje', 'laje', 'gable', 'amianto', 'tijolo', 'amianto']);
  let wall = pick(HOUSE_COLORS), brick = false;
  if (roofType === 'tijolo') { wall = pick(['#b5603a', '#a8553a', '#c06a40']); brick = true; h = rnd(30, 44); }
  if (roofType === 'amianto' && chance(0.3)) { wall = pick(['#b5603a', '#c8c2b4']); brick = wall === '#b5603a'; }
  const hr = F.rect(7, setback, W - 7, setback + depth);
  const roofColor = roofType === 'hip' || roofType === 'gable' ? pick(ROOF_TILE) : roofType === 'laje' || roofType === 'tijolo' ? '#8f8b84' : roofType === 'amianto' ? '#a7a9a4' : '#6f6c69';
  const hb = addBuilding(hr[0], hr[1], hr[2], hr[3], h, { style: 'house', front: F.front, roofType, roofColor, wall, lit: rnd(0.15, 0.6) });
  if (!rich && chance(0.2)) addGraffiti(hb);
  hb.brick = brick; hb.varal = chance(0.35); hb.dish = chance(0.3);
  // churrasco na laje: gente dançando, varal de lâmpadas e churrasqueira acesa
  if (roofType === 'laje' && !rich && chance(0.16) && hr[2] - hr[0] > 44 && hr[3] - hr[1] > 40) { hb.party = true; hb.varal = false; World.parties.push({ x: hb.cx, y: hb.cy, b: hb }); }
  if (hasCar) {
    const dr = F.rect(gateU, 0, gateU + gateW, setback);
    decalR(dr, 'drive');
    const p = F.pt(gateU + gateW / 2, setback / 2 + 1);
    addParkedCar(p[0], p[1], chance(0.5) ? F.out : F.out + Math.PI, randomCarModel(), pick(CAR_COLORS));
  }
  if (chance(0.55)) { const p = F.pt(gateU + gateW / 2, setback - 3); addLight(p[0], p[1], 55, 0.55, 'warm'); }
  const backSpace = D - setback - depth;
  if (backSpace > 34) {
    if (rich && chance(0.45) && W > 80) {
      const pr = F.rect(W / 2 - 24, setback + depth + 10, W / 2 + 24, Math.min(D - 8, setback + depth + 40));
      if (pr[2] - pr[0] > 20 && pr[3] - pr[1] > 20) decalR(pr, 'pool');
    } else if (chance(0.6)) {
      const p = F.pt(rnd(18, W - 18), setback + depth + backSpace * 0.55);
      addTree(p[0], p[1], pick(['mango', 'round', 'round', 'palm', 'ipeY', 'bush']), rnd(0.7, 1.0));
    }
  }
  if (o.street) {
    const rp = roadPointFor(F, W / 2, o.roadHW, o.laneOff);
    World.homes.push({ x: rp[0], y: rp[1], name: o.street + ', ' + nextNumber(o.street, F.front), region: o.region });
  }
}
function shopBuilding(F, def, o) {
  const W = F.W, D = F.D;
  decalR(F.rect(0, 0, W, D), 'yard');
  const depth = Math.min(D - 20, def.depth || 92);
  const r = F.rect(6, 12, W - 6, 12 + depth);
  const b = addBuilding(r[0], r[1], r[2], r[3], def.h || 34, { style: 'shop', front: F.front, roofType: 'flat', roofColor: '#77736d', wall: def.wall || '#efe6d2', lit: 0.85, sign: def.sign, signColor: def.color });
  // toldo / luz da fachada
  const lp = F.pt(W / 2, 6);
  addLight(lp[0], lp[1], 120, 0.95, def.color, { shop: true });
  const aw = F.rect(10, 4, W - 10, 12);
  bake(aw[0], aw[1], aw[2], aw[3], 8, (g) => drawAwning(g, aw, def.color, F.front));
  if (def.tables) {
    const tc = pick(['#d62828', '#f4c430', '#d62828']);
    for (const f of [0.18, 0.42, 0.66, 0.86]) { const tp = F.pt(W * f, -11); if (!areaBlocked(tp[0] - 7, tp[1] - 7, tp[0] + 7, tp[1] + 7)) addProp('table', tp[0], tp[1], { col: 'circ', cr: 5, c: tc, R: 12 }); }
  }
  const rp = roadPointFor(F, W / 2, o.roadHW, o.laneOff);
  const s = addShop({ kind: def.kind, name: def.name, x: rp[0], y: rp[1], bld: b, color: def.color, region: o.region, pickup: def.pickup, items: def.items });
  return s;
}
// comércio de bairro na esquina: açaí, barbearia, mercearia, igreja...
const CORNER_SHOPS = [
  { s: 'AÇAÍ DO BAIRRO', c: '#b05cff', t: true }, { s: 'BARBEARIA NAVALHA', c: '#59e0ff' }, { s: 'SALÃO DA DENISE', c: '#ff6fb5' },
  { s: 'IGREJA DA FÉ', c: '#f4f1e0', church: true }, { s: 'MERCEARIA DO TONINHO', c: '#ffd166' }, { s: 'LAN HOUSE', c: '#3cff8f' },
  { s: 'BAZAR 1,99', c: '#ff8a2a' }, { s: 'AÇOUGUE BOI GORDO', c: '#ff4d4d' }, { s: 'DEPÓSITO DE BEBIDAS', c: '#ffd23a', t: true },
  { s: 'LAVA-JATO', c: '#4cc9f0' }, { s: 'XEROX E PAPELARIA', c: '#9be15d' }, { s: 'SORVETERIA', c: '#ff9ed2', t: true },
  { s: 'CHAVEIRO 24H', c: '#ffe066' }, { s: 'AUTOPEÇAS', c: '#ff7b39' }, { s: 'MOTO PEÇAS', c: '#ff3b3b' }, { s: 'PADARIA PÃO QUENTE', c: '#ffb547', t: true },
  { s: 'ESPETINHO DO GORDO', c: '#ff9f1c', t: true, grill: true }, { s: 'BORRACHARIA', c: '#ffd23a' },
];
function cornerShop(F, o) {
  const W = F.W, D = F.D, def = pick(CORNER_SHOPS);
  decalR(F.rect(0, 0, W, D), 'yard');
  const depth = Math.min(D - 30, rnd(58, 78));
  const r = F.rect(6, 16, W - 6, 16 + depth);
  const b = addBuilding(r[0], r[1], r[2], r[3], def.church ? rnd(34, 40) : rnd(27, 36), { style: 'shop', front: F.front, roofType: def.church ? 'gable' : pick(['laje', 'laje', 'flat', 'amianto']), roofColor: def.church ? '#9a4a32' : '#8f8b84', wall: pick(HOUSE_COLORS), lit: 0.8, sign: def.s, signColor: def.c });
  b.dish = chance(0.4);
  const aw = F.rect(10, 6, W - 10, 16);
  bake(aw[0], aw[1], aw[2], aw[3], 8, (g) => drawAwning(g, aw, def.church ? '#6a6a6a' : def.c, F.front));
  const lp = F.pt(W / 2, 8);
  addLight(lp[0], lp[1], 105, 0.85, def.c, { shop: true });
  // fundos murados
  { const wr = F.rect(0, 16 + depth, 4, D); addWall(wr[0], wr[1], wr[2], wr[3], pick(WALL_COLORS)); }
  if (o.back) { const wr = F.rect(4, D - 4, W, D); addWall(wr[0], wr[1], wr[2], wr[3], pick(WALL_COLORS)); }
  if (o.lastLot) { const wr = F.rect(W - 4, 16 + depth, W, D); addWall(wr[0], wr[1], wr[2], wr[3], pick(WALL_COLORS)); }
  if (def.t) {
    const tc = pick(['#d62828', '#f4c430', '#f4c430']);
    for (const f of [0.22, 0.5, 0.78]) { const tp = F.pt(W * f, -12); if (!areaBlocked(tp[0] - 7, tp[1] - 7, tp[0] + 7, tp[1] + 7)) addProp('table', tp[0], tp[1], { col: 'circ', cr: 5, c: tc, R: 12 }); }
    World.parties.push({ x: lp[0], y: lp[1], bar: true });
  }
  if (def.grill) { const gp = F.pt(W - 14, 2); World.grills.push({ x: gp[0], y: gp[1] }); }
  if (!def.t && chance(0.5)) { const op = F.pt(rnd(12, W - 12), -10); if (!areaBlocked(op[0] - 6, op[1] - 6, op[0] + 6, op[1] + 6)) addProp('orelhao', op[0], op[1], { col: 'circ', cr: 4, R: 14, a: F.out }); }
  if (o.street) {
    const rp = roadPointFor(F, W / 2, o.roadHW, o.laneOff);
    World.homes.push({ x: rp[0], y: rp[1], name: o.street + ', ' + nextNumber(o.street, F.front), region: o.region });
  }
}
function residentialBlock(R, o) {
  const rich = o.rich;
  const D = Math.min(rich ? 162 : 146, Math.floor((R.y1 - R.y0) / 2) - 40);
  decal(R.x0, R.y0, R.x1, R.y1, 'lawn');
  const sides = [
    { s: 'N', a: R.x0, b: R.x1, mk: (p, q) => lotFrame(p, R.y0, q, R.y0 + D, 'N'), road: o.roads.N },
    { s: 'S', a: R.x0, b: R.x1, mk: (p, q) => lotFrame(p, R.y1 - D, q, R.y1, 'S'), road: o.roads.S },
    { s: 'W', a: R.y0 + D, b: R.y1 - D, mk: (p, q) => lotFrame(R.x0, p, R.x0 + D, q, 'W'), road: o.roads.W },
    { s: 'E', a: R.y0 + D, b: R.y1 - D, mk: (p, q) => lotFrame(R.x1 - D, p, R.x1, q, 'E'), road: o.roads.E },
  ];
  for (const sd of sides) {
    const L = sd.b - sd.a;
    if (L < 60) continue;
    const sp = o.special && o.special.side === sd.s ? o.special : null;
    let widths;
    if (sp) { const rest = L - sp.w; widths = [sp.w].concat(rest > 60 ? splitRun(rest, rich ? 115 : 86, rich ? 158 : 122) : []); if (rest <= 60) widths[0] = L; }
    else widths = splitRun(L, rich ? 115 : 86, rich ? 158 : 122);
    let p = sd.a;
    widths.forEach((w, i) => {
      const F = sd.mk(p, p + w);
      const ro = { rich, back: sd.s === 'N' || sd.s === 'S', lastLot: i === widths.length - 1, street: sd.road.name, roadHW: sd.road.hw, laneOff: sd.road.lane, region: o.region };
      if (sp && i === 0) sp.build(F, ro);
      else if (i === 0 && w >= 84 && F.D >= 100 && chance(rich ? 0.1 : 0.3)) cornerShop(F, ro);
      else houseLot(F, ro);
      p += w;
    });
  }
  // miolo do quarteirão
  const cx0 = R.x0 + D + 6, cx1 = R.x1 - D - 6, cy0 = R.y0 + D + 6, cy1 = R.y1 - D - 6;
  if (cx1 - cx0 > 30 && cy1 - cy0 > 30) {
    if (chance(0.25)) { decal(cx0, cy0, cx1, cy1, 'lawn2'); scatterTrees(cx0, cy0, cx1, cy1, 3, ['bush', 'round']); }
    else scatterTrees(cx0, cy0, cx1, cy1, rndi(2, 4), ['mango', 'round', 'ipeY', 'palm', 'round']);
  }
}
function officeH() { const r = rnd(); return r < 0.3 ? rnd(110, 175) : r < 0.72 ? rnd(60, 100) : rnd(36, 50); }
function downtownBlock(R, o) {
  decal(R.x0, R.y0, R.x1, R.y1, 'urban');
  const w = R.x1 - R.x0, h = R.y1 - R.y0;
  const cols = o.cols || (w > 420 ? (chance(0.5) ? 3 : 2) : (w > 260 ? 2 : 1));
  const rows = o.rows || 2;
  const ws = [], hs = [];
  let acc = 0;
  for (let i = 0; i < cols; i++) { const v = i === cols - 1 ? w - acc : Math.round(w / cols * rnd(0.8, 1.2)); ws.push(v); acc += v; }
  acc = 0;
  for (let i = 0; i < rows; i++) { const v = i === rows - 1 ? h - acc : Math.round(h / rows * rnd(0.85, 1.15)); hs.push(v); acc += v; }
  let y = R.y0, idx = 0;
  for (let j = 0; j < rows; j++) {
    let x = R.x0;
    for (let i = 0; i < cols; i++) {
      const px0 = x, py0 = y, px1 = x + ws[i], py1 = y + hs[j];
      const front = j === 0 ? 'N' : 'S';
      const shopDef = o.shops && o.shops[idx];
      const roll = rnd();
      const il = i === 0 ? 3 : 4, ir = i === cols - 1 ? 3 : 4, it = j === 0 ? 3 : 4, ib = j === rows - 1 ? 3 : 4;
      if (shopDef) {
        const F = lotFrame(px0, py0, px1, py1, front);
        shopBuilding(F, Object.assign({ depth: (py1 - py0) * 0.62 }, shopDef), { roadHW: front === 'N' ? o.roads.N.hw : o.roads.S.hw, laneOff: front === 'N' ? o.roads.N.lane : o.roads.S.lane, region: o.region });
      } else if (roll < 0.12 && !o.noLots) {
        decal(px0 + 2, py0 + 2, px1 - 2, py1 - 2, 'paved');
        const vert = (py1 - py0) > (px1 - px0);
        bake(px0, py0, px1, py1, 6, (g) => drawStallLines(g, px0 + 8, py0 + 8, px1 - 8, py1 - 8, vert));
        for (let k = 0; k < 5; k++) {
          if (!chance(0.6)) continue;
          if (vert) { const yy = py0 + 30 + k * 34; if (yy < py1 - 20) addParkedCar(px0 + 40, yy, chance(0.5) ? 0 : Math.PI, randomCarModel(), pick(CAR_COLORS)); }
          else { const xx = px0 + 26 + k * 34; if (xx < px1 - 20) addParkedCar(xx, py0 + 40, chance(0.5) ? Math.PI / 2 : -Math.PI / 2, randomCarModel(), pick(CAR_COLORS)); }
        }
        addLight((px0 + px1) / 2, (py0 + py1) / 2, 140, 0.6, 'white');
      } else if (roll < 0.2 && !o.noLots) {
        decal(px0 + 2, py0 + 2, px1 - 2, py1 - 2, 'plaza');
        scatterTrees(px0 + 18, py0 + 18, px1 - 18, py1 - 18, 3, ['palm', 'ipeY', 'round']);
        addProp('bench', (px0 + px1) / 2, (py0 + py1) / 2, { col: 'rect', w: 26, h: 8 });
        addLight((px0 + px1) / 2, (py0 + py1) / 2, 110, 0.7, 'white');
      } else {
        const hh0 = officeH();
        const colonial = hh0 < 100 && chance(0.32);
        const hh = colonial ? rnd(34, 46) : hh0;
        const style = colonial ? 'colonial' : hh < 52 ? 'shop' : (chance(0.45) ? 'apart' : 'office');
        const signs = ['AÇOUGUE BOI GORDO', 'SORVETERIA GELADÃO', 'TUDO 1,99', 'SALGADOS DA TIA', 'CHAVEIRO 25H', 'ACADEMIA BOMBADÃO', 'DROGARIA DOR-ZERO', 'PASTEL DE VENTO', 'LOTÉRICA SORTE NADA', 'BOTECO DO ZÉ', 'SALÃO CABELO DURO', 'CALÇADOS PÉ DE BOI', 'MODAS ARRASA', 'MATERIAIS DO BAIANO', 'ÓTICA VÊ BEM', 'BAZAR DA FÉ', 'LAN HOUSE 2005', 'CAFÉ COM PROSA'];
        const cols2 = ['#ff5f7a', '#59e0ff', '#ffd24a', '#5be38f', '#c56bff', '#ff8a3d'];
        const b = addBuilding(px0 + il + rnd(0, 4), py0 + it + rnd(0, 4), px1 - ir - rnd(0, 4), py1 - ib - rnd(0, 4), hh, {
          style, front, roofType: colonial ? 'hip' : 'flat', roofColor: colonial ? pick(ROOF_TILE) : pick(['#6f6d6a', '#7d7a74', '#5f5e5b', '#85817a']),
          wall: colonial ? pick(['#f2d16b', '#8fc1d4', '#e8a0a0', '#a8d5a2', '#f4f0e6', '#e9b872']) : style === 'apart' ? pick(['#d9c8a9', '#c9d3d8', '#e2d6c2', '#b8c4b0', '#e8dccb']) : pick(OFFICE_COLORS), lit: rnd(0.25, 0.6),
          sign: (style === 'shop' || colonial) && chance(0.7) ? pick(signs) : null, signColor: pick(cols2),
        });
        if (style === 'apart') { b.varal = chance(0.5); b.dish = true; }
        if (b.sign) {
          const F = lotFrame(b.x0, b.y0, b.x1, b.y1, front);
          const lp = F.pt(F.W / 2, -6);
          addLight(lp[0], lp[1], 90, 0.7, b.signColor, { shop: true });
        }
      }
      x = px1; idx++;
    }
    y += hs[j];
  }
}
function industrialBlock(R, o) {
  decal(R.x0, R.y0, R.x1, R.y1, 'gravel');
  const gx = (R.x0 + R.x1) / 2;
  fenceRect(R.x0 + 4, R.y0 + 4, R.x1 - 4, R.y1 - 4, [{ side: 'N', at: gx, w: 70 }, { side: 'S', at: gx + 60, w: 70 }], 'chain');
  const w = R.x1 - R.x0;
  const whCol = pick(['#7f8a8c', '#5f7f8c', '#8c8070', '#6c8070']);
  const wx1 = R.x0 + w * rnd(0.5, 0.62);
  const wh = addBuilding(R.x0 + 20, R.y0 + 30, wx1, R.y1 - 120, rnd(36, 46), { style: 'warehouse', roofType: 'corrugated', roofColor: whCol, wall: '#a9a59b', lit: 0.12, front: 'S' });
  if (chance(0.6)) addGraffiti(wh, chance(0.5) ? 'pixo' : 'mural');
  addLight((R.x0 + wx1) / 2, R.y1 - 90, 150, 0.8, 'sodium');
  for (let k = 0; k < 4; k++) {
    const cx = wx1 + 30 + k * 32;
    if (cx > R.x1 - 30) break;
    if (chance(0.7)) addBuilding(cx, R.y0 + 30, cx + 26, R.y0 + 110, 22, { style: 'container', roofType: 'container', roofColor: pick(['#b5452e', '#2e6db5', '#3d8a4a', '#c9a227', '#7a7a7a']), wall: '#6a6a6a', lit: 0, noShadow: false });
  }
  if (!o.noTrucks) {
    addParkedCar(wx1 + 70, R.y1 - 60, 0, 'truck', pick(['#d8d8d8', '#c43d2e', '#2c5d9c']));
  }
  addLamp(R.x1 - 30, R.y0 + 40, R.x1 - 50, R.y0 + 60, 'sodium', { style: 'pole', h: 62 });
}

/* ---------- quarteirões especiais ---------- */
function hwV(x) { return x === 2100 ? RT.avenue.w / 2 : RT.street.w / 2; }
function hwH(y) { return (y === 1500 || y === 3880) ? RT.avenue.w / 2 : RT.street.w / 2; }
function cellRect(c, r) { return { x0: XS[c] + hwV(XS[c]) + 22, x1: XS[c + 1] - hwV(XS[c + 1]) - 22, y0: YS[r] + hwH(YS[r]) + 22, y1: YS[r + 1] - hwH(YS[r + 1]) - 22 }; }
const NAMES_H = {}, NAMES_V = {};
function cellRoads(c, r) {
  const mk = (name, hw) => ({ name, hw, lane: hw > 60 ? RT.avenue.lanes[1] : RT.street.lanes[0] });
  return {
    N: mk(NAMES_H[YS[r]], hwH(YS[r])), S: mk(NAMES_H[YS[r + 1]], hwH(YS[r + 1])),
    W: mk(NAMES_V[XS[c]], hwV(XS[c])), E: mk(NAMES_V[XS[c + 1]], hwV(XS[c + 1])),
  };
}

function plazaChurch(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'plaza');
  const cx = (R.x0 + R.x1) / 2;
  addBuilding(cx - 92, R.y0 + 16, cx + 92, R.y0 + 176, 58, { style: 'church', roofType: 'gableV', roofColor: '#9c4a2c', wall: '#f1ead8', lit: 0.5, front: 'S' });
  const tower = addBuilding(cx - 28, R.y0 + 176, cx + 28, R.y0 + 232, 122, { style: 'tower', roofType: 'tower', roofColor: '#8a3f26', wall: '#efe7d2', lit: 0.3, front: 'S' });
  tower.cross = true;
  addLight(cx, R.y0 + 250, 160, 0.9, 'warm');
  // fonte
  const fy = R.y0 + 340;
  bake(cx - 50, fy - 50, cx + 50, fy + 50, 8, (g) => drawFountain(g, cx, fy));
  addCircCol(cx, fy, 40, 'prop');
  addLight(cx, fy, 90, 0.5, 'cyan', { fountain: true });
  World.fountains.push({ x: cx, y: fy });
  for (const [dx, dy] of [[-150, 280], [150, 280], [-150, 400], [150, 400]]) addTree(cx + dx, R.y0 + dy, chance(0.5) ? 'palm' : 'ipeY', rnd(1, 1.2));
  for (const [dx, dy, a] of [[-80, 300, 0], [80, 300, 0], [-80, 380, 0], [80, 380, 0], [0, 420, 0]]) addProp('bench', cx + dx, R.y0 + dy, { col: 'rect', w: 26, h: 8 });
  for (const [dx, dy] of [[-200, 260], [200, 260], [-200, 430], [200, 430], [-60, 250], [60, 250]]) addLamp(cx + dx, R.y0 + dy, cx + dx, R.y0 + dy, 'white', { style: 'globe', h: 34, r: 120, i: 0.85 });
  addBuilding(R.x0 + 14, R.y1 - 54, R.x0 + 54, R.y1 - 20, 18, { style: 'kiosk', roofType: 'flat', roofColor: '#2f6d4f', wall: '#3b8a63', lit: 0.9, sign: 'BANCA', signColor: '#ffd24a' });
  addProp('cart', R.x1 - 40, R.y1 - 40, { col: 'circ', cr: 9 });
  // balizadores
  for (let x = R.x0 + 8; x <= R.x1 - 8; x += 26) {
    if (Math.abs(x - cx) < 30) continue;
    addProp('bollard', x, R.y1 - 4, { col: 'circ', cr: 3, R: 6 });
  }
}
function parkingLot(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'paved');
  const rows = [
    { y0: R.y0 + 8, y1: R.y0 + 70, nose: -Math.PI / 2 },
    { y0: R.y0 + 170, y1: R.y0 + 232, nose: Math.PI / 2 },
    { y0: R.y0 + 232, y1: R.y0 + 294, nose: -Math.PI / 2 },
    { y0: R.y1 - 70, y1: R.y1 - 8, nose: Math.PI / 2 },
  ];
  const sx0 = R.x0 + 52, SW = 34;
  const n = Math.floor((R.x1 - 18 - sx0) / SW);
  const challenge = { '0,5': 1, '2,2': 1, '3,9': 1 };
  rows.forEach((row, ri) => {
    bake(sx0, row.y0, sx0 + n * SW, row.y1, 6, (g) => {
      g.strokeStyle = 'rgba(240,240,230,0.75)'; g.lineWidth = 2;
      g.beginPath();
      for (let i = 0; i <= n; i++) { g.moveTo(sx0 + i * SW, row.y0); g.lineTo(sx0 + i * SW, row.y1); }
      const yb = row.nose < 0 ? row.y0 : row.y1;
      g.moveTo(sx0, yb); g.lineTo(sx0 + n * SW, yb);
      g.stroke();
    });
    for (let i = 0; i < n; i++) {
      const x = sx0 + i * SW + SW / 2, y = (row.y0 + row.y1) / 2;
      if (challenge[ri + ',' + i]) {
        World.parkSpots.push({ id: 'central_' + ri + '_' + i, name: 'Estacionamento Central', x, y, a: row.nose, w: SW, l: 62, reward: 220 });
        continue;
      }
      if (chance(0.55)) addParkedCar(x, y + (row.nose > 0 ? 2 : -2), row.nose, randomCarModel(), pick(CAR_COLORS));
    }
  });
  // mureta com entradas
  const hedge = (x0, y0, x1, y1) => { addWall(x0, y0, x1, y1, '#4f6b3a', { kind: 'hedge' }); };
  hedge(R.x0, R.y0, R.x0 + 6, R.y0 + 74);
  hedge(R.x0, R.y0 + 166, R.x0 + 6, R.y0 + 298);
  hedge(R.x0, R.y1 - 74, R.x0 + 6, R.y1);
  hedge(R.x1 - 6, R.y0, R.x1, R.y0 + 74);
  hedge(R.x1 - 6, R.y0 + 166, R.x1, R.y0 + 298);
  hedge(R.x1 - 6, R.y1 - 74, R.x1, R.y1);
  hedge(R.x0 + 6, R.y0, R.x1 - 6, R.y0 + 5);
  hedge(R.x0 + 6, R.y1 - 5, R.x1 - 6, R.y1);
  addBuilding(R.x0 + 12, R.y0 + 112, R.x0 + 40, R.y0 + 134, 20, { style: 'kiosk', roofType: 'flat', roofColor: '#3a4a6a', wall: '#dcdcdc', lit: 1 });
  for (const [x, y] of [[R.x0 + 130, R.y0 + 120], [R.x1 - 130, R.y0 + 120], [R.x0 + 130, R.y1 - 120], [R.x1 - 130, R.y1 - 120]]) addLamp(x, y, x, y, 'white', { style: 'pole', h: 64, r: 190 });
}
function gasStation(R, o) {
  // o: {name, color, front:'N'|'S', canopy:[x0,y0,x1,y1], store:[...], wash:[...]?, totem:[x,y]}
  decal(R.x0, R.y0, R.x1, R.y1, 'concrete');
  const [cx0, cy0, cx1, cy1] = o.canopy;
  const midY = (cy0 + cy1) / 2;
  for (const yy of [midY - 28, midY + 28]) {
    addProp('island', (cx0 + cx1) / 2, yy, { col: 'rect', w: cx1 - cx0 - 70, h: 12, R: (cx1 - cx0) / 2, c: o.color });
  }
  const can = { kind: 'canopy', x0: cx0, y0: cy0, x1: cx1, y1: cy1, h: 44, color: o.color, name: o.name, cx: (cx0 + cx1) / 2, cy: midY, alpha: 1 };
  addTall(can, cx0, cy0, cx1, cy1);
  for (const [px, py] of [[cx0 + 14, cy0 + 14], [cx1 - 14, cy0 + 14], [cx0 + 14, cy1 - 14], [cx1 - 14, cy1 - 14]]) addCircCol(px, py, 5, 'pole');
  for (let x = cx0 + 40; x < cx1 - 20; x += 60) for (const yy of [cy0 + 30, cy1 - 30]) addLight(x, yy, 120, 0.95, 'white', { canopy: true });
  const s = o.store;
  addBuilding(s[0], s[1], s[2], s[3], 30, { style: 'shop', front: o.front, roofType: 'flat', roofColor: '#6a6865', wall: '#f0f0ea', lit: 0.95, sign: 'CONVENIÊNCIA', signColor: o.color });
  if (o.wash) {
    const w = o.wash;
    addBuilding(w[0], w[1], w[2], w[3], 30, { style: 'shop', front: o.front, roofType: 'flat', roofColor: '#3f6a8a', wall: '#dfe8ee', lit: 0.8, sign: 'LAVA JATO', signColor: '#59e0ff' });
  }
  const t = o.totem;
  const tot = { kind: 'totem', x: t[0], y: t[1], h: 76, color: o.color, name: o.name };
  addTall(tot, t[0] - 30, t[1] - 30, t[0] + 30, t[1] + 30);
  addCircCol(t[0], t[1], 6, 'pole');
  addLight(t[0], t[1], 90, 0.7, o.color);
  return addShop({ kind: 'posto', name: o.name, x: can.cx, y: can.cy, color: o.color, region: o.region, wash: !!o.wash, radius: 90 });
}
function oficinaBlock(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'gravel');
  decal(R.x0, R.y0, R.x0 + 260, R.y0 + 60, 'concrete');
  const b = addBuilding(R.x0 + 20, R.y0 + 60, R.x0 + 240, R.y0 + 200, 38, { style: 'workshop', front: 'N', roofType: 'corrugated', roofColor: '#4d6b86', wall: '#d9d2c0', lit: 0.8, sign: 'OFICINA DO SEU ZÉ', signColor: '#ffb547' });
  addLight(R.x0 + 130, R.y0 + 40, 140, 1, 'white', { shop: true });
  for (let i = 0; i < 4; i++) addProp('tires', R.x0 + 262 + i * 18, R.y0 + 90 + (i % 2) * 22, { col: 'circ', cr: 8 });
  addParkedCar(R.x0 + 60, R.y0 + 30, 0, 'sedan', '#5a5a5a');
  addParkedCar(R.x0 + 190, R.y0 + 28, Math.PI, 'hatch', '#8a3b2a');
  industrialBlock({ x0: R.x0 + 280, y0: R.y0, x1: R.x1, y1: R.y1 }, { noTrucks: true });
  World.animalsDef.push({ type: 'person', n: 1, rect: [R.x0 + 100, R.y0 + 30, R.x0 + 170, R.y0 + 48], look: { col: '#2a4a8a', pants: '#2a4a8a', hair: '#e8e8e2', skin: '#e0ac69', seuze: true } });
  return addShop({ kind: 'oficina', name: 'Oficina do Seu Zé', x: R.x0 + 130, y: YS[1] + RT.street.lanes[0], bld: b, color: '#ffb547', region: 'industrial', pickup: true, items: ['Peças de motor', 'Bateria nova', 'Jogo de pneus'] });
}
function waterTowerBlock(R) {
  industrialBlock({ x0: R.x0, y0: R.y0, x1: R.x1, y1: R.y0 + 250 }, {});
  decal(R.x0, R.y0 + 250, R.x1, R.y1, 'lawn');
  const cx = (R.x0 + R.x1) / 2, cy = R.y0 + 380;
  fenceRect(cx - 80, cy - 80, cx + 80, cy + 80, [{ side: 'S', at: cx, w: 40 }], 'chain');
  const t = { kind: 'watertower', x: cx, y: cy, h: 150, r: 42 };
  addTall(t, cx - 50, cy - 50, cx + 50, cy + 50);
  for (const [dx, dy] of [[-30, -30], [30, -30], [-30, 30], [30, 30]]) addCircCol(cx + dx, cy + dy, 5, 'pole');
  addLight(cx, cy, 120, 0.6, 'sodium');
}
function soccerBlock(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'lawn');
  const m = 20;
  decal(R.x0 + m, R.y0 + m, R.x1 - m, R.y1 - m, 'soccer');
  const cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2;
  addProp('goal', cx, R.y0 + m + 4, { a: 0, col: 'rect', w: 44, h: 8, R: 30 });
  addProp('goal', cx, R.y1 - m - 4, { a: Math.PI, col: 'rect', w: 44, h: 8, R: 30 });
  fenceRect(R.x0 + 6, R.y0 + 6, R.x1 - 6, R.y1 - 6, [{ side: 'E', at: cy, w: 60 }, { side: 'W', at: cy, w: 60 }], 'chain');
  for (const [x, y] of [[R.x0 + 14, R.y0 + 14], [R.x1 - 14, R.y0 + 14], [R.x0 + 14, R.y1 - 14], [R.x1 - 14, R.y1 - 14]]) {
    const f = { kind: 'flood', x, y, h: 90, tx: cx, ty: cy };
    addTall(f, x - 20, y - 20, x + 20, y + 20);
    addCircCol(x, y, 5, 'pole');
    addLight(lerp(x, cx, 0.4), lerp(y, cy, 0.4), 260, 0.75, 'white', { flood: true });
  }
  addBuilding(R.x1 - 60, R.y0 + 60, R.x1 - 26, R.y1 - 60, 14, { style: 'bleacher', roofType: 'bleacher', roofColor: '#8a8a8a', wall: '#9a9a9a', lit: 0 });
  World.pitches.push({ x0: R.x0 + m + 8, y0: R.y0 + m + 8, x1: R.x1 - 70, y1: R.y1 - m - 8, cx, cy, gy0: R.y0 + m + 4, gy1: R.y1 - m - 4 });
}
function schoolBlock(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'yard');
  const wc = '#e5dcc0';
  addWall(R.x0, R.y0, R.x1, R.y0 + 5, wc); addWall(R.x0, R.y1 - 5, R.x1, R.y1, wc);
  addWall(R.x0, R.y0 + 5, R.x0 + 5, R.y1 - 5, wc); addWall(R.x1 - 5, R.y0 + 5, R.x1, (R.y0 + R.y1) / 2 - 30, wc);
  addWall(R.x1 - 5, (R.y0 + R.y1) / 2 + 30, R.x1, R.y1 - 5, wc);
  addBuilding(R.x0 + 30, R.y0 + 30, R.x1 - 30, R.y0 + 140, 40, { style: 'office', roofType: 'flat', roofColor: '#6e7b6a', wall: '#e9d9a8', lit: 0.2, sign: 'ESCOLA ESTADUAL', signColor: '#59e0ff', front: 'N' });
  addBuilding(R.x0 + 30, R.y0 + 140, R.x0 + 120, R.y1 - 200, 34, { style: 'office', roofType: 'flat', roofColor: '#6e7b6a', wall: '#e9d9a8', lit: 0.1 });
  decal(R.x0 + 150, R.y0 + 180, R.x1 - 40, R.y1 - 220, 'court');
  scatterTrees(R.x0 + 30, R.y1 - 190, R.x1 - 30, R.y1 - 30, 6, ['mango', 'round', 'ipeP']);
  addProp('flag', R.x0 + 140, R.y0 + 160, { col: 'circ', cr: 3 });
  addLight((R.x0 + R.x1) / 2, R.y0 + 160, 160, 0.6, 'white');
}
function homeLot(F, ro) {
  decalR(F.rect(0, 0, F.W, F.D), 'yard');
  const wallCol = '#d8cfb8';
  { const r = F.rect(0, 0, 4, F.D); addWall(r[0], r[1], r[2], r[3], wallCol); }
  { const r = F.rect(4, F.D - 4, F.W, F.D); addWall(r[0], r[1], r[2], r[3], wallCol); }
  const g = F.rect(12, 16, 112, 118);
  const b = addBuilding(g[0], g[1], g[2], g[3], 36, { style: 'garage', front: F.front, roofType: 'corrugated', roofColor: '#5b6470', wall: '#e8e2d0', lit: 0.9, sign: 'GARAGEM', signColor: '#5be38f' });
  const hr = F.rect(122, 30, F.W - 8, 118);
  addBuilding(hr[0], hr[1], hr[2], hr[3], 29, { style: 'house', front: F.front, roofType: 'hip', roofColor: '#a8492b', wall: '#f2d28e', lit: 0.8 });
  const lp = F.pt(62, 8);
  addLight(lp[0], lp[1], 110, 1, 'green', { shop: true });
  const rp = roadPointFor(F, 62, ro.roadHW, ro.laneOff);
  World.home = { x: rp[0], y: rp[1], a: 0, bld: b };
  addShop({ kind: 'garagem', name: 'Sua Garagem', x: rp[0], y: rp[1], color: '#5be38f', region: 'vila', radius: 80 });
}
function comunidadeBlock(R) {
  // comunidade: casinhas coladas de bloco e laje, vielas estreitas, caixas d'água e varais
  decal(R.x0, R.y0, R.x1, R.y1, 'yard');
  // muro grafitado virado para a rua (face sul)
  const gl = [];
  for (let x = R.x0 + 6; x < R.x1 - 60; x += rndi(70, 110)) gl.push({ x, text: chance(0.5) ? pick(MURO_FRASES) : pick(PIXOS), color: pick(['#111111', '#f2f2ea', '#c8241c', '#1d4f9c', '#2a9d8f', '#f4c430']), mural: chance(0.25) });
  addWall(R.x0, R.y1 + 1, R.x1, R.y1 + 5, pick(['#d8d0c0', '#c9b79c', '#e2d2b6', '#b8b0a2']), {});
  const cols = ['#e9c46a', '#f4a261', '#2a9d8f', '#e76f51', '#8ecae6', '#f1efe8', '#b5603a', '#b5603a', '#c06a40', '#9bc53d', '#ff99c8'];
  let y = R.y0 + 4, row = 0;
  while (y < R.y1 - 30) {
    const rh = Math.min(rndi(34, 50), R.y1 - 4 - y);
    let x = R.x0 + 4;
    while (x < R.x1 - 24) {
      const w = Math.min(rndi(26, 46), R.x1 - 4 - x);
      if (w < 20) break;
      const wall = pick(cols), brick = wall === '#b5603a' || wall === '#c06a40';
      const floors = rndi(1, 3);
      const roofType = pick(['laje', 'laje', 'tijolo', 'amianto', 'laje']);
      const b = addBuilding(x, y, x + w, y + rh, 16 + floors * 11 + rnd(0, 4), { style: 'house', front: row === 0 ? 'N' : 'S', roofType, roofColor: roofType === 'amianto' ? '#a7a9a4' : '#8f8b84', wall, lit: rnd(0.3, 0.75) });
      b.brick = brick; b.varal = chance(0.4); b.dish = chance(0.35);
      if (chance(0.5)) addGraffiti(b);
      if (chance(0.25)) addLight(x + w / 2, y + rh + 4, 45, 0.6, 'warm');
      x += w + (chance(0.22) ? rndi(10, 14) : 1);
    }
    y += rh + (chance(0.5) ? rndi(10, 14) : 2);
    row++;
  }
  const cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2;
  addFlags(R.x0 + 30, cy - 40, R.x1 - 30, cy + 20, true);
  addFlags(R.x0 + 30, cy + 40, R.x1 - 30, cy - 20, true);
  addLight(cx, cy, 160, 0.5, 'sodium');
}
function shopLotBuilder(def) { return (F, ro) => shopBuilding(F, def, ro); }

/* ---------- construção da cidade ---------- */
function buildCity() {
  for (const r of ROADS) { if (r.h && r.x1 < 4700) NAMES_H[r.y] = r.name; if (!r.h && r.y1 < 1000) NAMES_V[r.x] = r.name; }
  NAMES_V[4600] = 'Rua Beira-Rio Sem Peixe';
  const SPECIAL = {
    '2,1': 'plaza', '3,1': 'parking', '4,2': 'posto', '5,1': 'oficina', '5,3': 'tower', '0,5': 'soccer', '3,7': 'school',
  };
  const shopsDowntown = {
    '1,2': { 0: { kind: 'moquecaria', name: 'Moquecaria Panela de Barro', sign: 'MOQUECA', color: '#ff5f3d', h: 32, pickup: true, items: ['Moqueca capixaba', 'Torta capixaba', 'Panela de moqueca'], tables: true }, 3: { kind: 'farmacia', name: 'Farmácia Dorme Bem', sign: 'FARMÁCIA', color: '#3dff8a', h: 34, pickup: true, items: ['Remédios', 'Encomenda da farmácia'] } },
    '0,0': { 1: { kind: 'hotel', name: 'Hotel Dorme e Acorda', sign: 'HOTEL', color: '#c56bff', h: 70, wall: '#c9c2b4' } },
  };
  const resSpecial = {
    '1,4': { side: 'N', w: 186, build: homeLot },
    '2,4': { side: 'N', w: 150, build: shopLotBuilder({ kind: 'padaria', name: 'Padaria Pão-Duro', sign: 'PADARIA', color: '#ffc24a', h: 32, depth: 100, pickup: true, items: ['Bolo de aniversário', 'Pães e frios', 'Encomenda de salgados'], tables: true }) },
    '0,4': { side: 'N', w: 160, build: shopLotBuilder({ kind: 'mercado', name: 'Mercadinho Leva Tudo', sign: 'MERCADINHO', color: '#ff7a3d', h: 32, depth: 105, pickup: true, items: ['Compras do mês', 'Caixa de bebidas', 'Sacolas de compras'] }) },
    '4,6': { side: 'N', w: 150, build: shopLotBuilder({ kind: 'lanchonete', name: 'Lanchonete X-Tudo do Bigode', sign: 'LANCHES', color: '#ff4f8a', h: 30, depth: 95, pickup: true, items: ['X-tudo e batata', 'Pastéis', 'Lanches para a turma'], tables: true }) },
    '2,6': { side: 'N', w: 140, build: shopLotBuilder({ kind: 'bar', name: 'Boteco Saideira do Toninho', sign: 'SAIDEIRA', color: '#ffd24a', h: 28, depth: 90, tables: true }) },
    '5,5': { side: 'W', w: 150, build: shopLotBuilder({ kind: 'floricultura', name: 'Floricultura Rosa Choque', sign: 'FLORES', color: '#ff8ad8', h: 30, depth: 96, pickup: true, items: ['Buquê de rosas', 'Arranjo de flores'] }) },
  };
  for (let c = 0; c < 7; c++) for (let r = 0; r < 8; r++) {
    const R = cellRect(c, r), k = c + ',' + r;
    const roads = cellRoads(c, r);
    const region = regionKeyAt((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2);
    const sp = SPECIAL[k];
    if (sp === 'plaza') plazaChurch(R);
    else if (sp === 'parking') parkingLot(R);
    else if (sp === 'posto') {
      gasStation({ x0: R.x0, y0: R.y0, x1: R.x0 + 300, y1: R.y1 }, { name: 'Posto Tanque Cheio', color: '#ff3d3d', front: 'S', canopy: [R.x0 + 40, R.y0 + 40, R.x0 + 260, R.y0 + 190], store: [R.x0 + 34, R.y1 - 120, R.x0 + 180, R.y1 - 14], wash: [R.x0 + 196, R.y1 - 120, R.x0 + 286, R.y1 - 14], totem: [R.x0 + 14, R.y0 + 14], region: 'centro' });
      downtownBlock({ x0: R.x0 + 300, y0: R.y0, x1: R.x1, y1: R.y1 }, { roads, region, cols: 1 });
    }
    else if (sp === 'oficina') oficinaBlock(R);
    else if (sp === 'tower') waterTowerBlock(R);
    else if (sp === 'soccer') soccerBlock(R);
    else if (sp === 'school') schoolBlock(R);
    else if (r < 4) {
      if (c >= 5) industrialBlock(R, {});
      else downtownBlock(R, { roads, region, shops: shopsDowntown[k] });
    } else if (k === '0,6' || k === '1,7') { comunidadeBlock(R); SUBREG.push([R.x0 - 20, R.y0 - 20, R.x1 + 20, R.y1 + 20, k === '0,6' ? 'saopedro' : 'terravermelha']); }
    else residentialBlock(R, { rich: c >= 3, roads, region, special: resSpecial[k] });
  }
}

/* ---------- sinalização e iluminação viária ---------- */
function lampColorFor(e) {
  const mx = e.h ? (e.a.x + e.b.x) / 2 : e.a.x, my = e.h ? e.a.y : (e.a.y + e.b.y) / 2;
  const rk = regionKeyAt(mx, my);
  if (rk === 'centro' || e.T.id === 'highway' || e.T.id === 'avenue') return chance(0.85) ? 'white' : 'sodium';
  return chance(0.9) ? 'sodium' : 'white';
}
function buildRoadProps() {
  for (const e of World.edges) {
    if (!e.bridge) continue;
    const B = e.bridge, y = e.a.y;
    if (B.wood) {
      for (const x of [B.x0 + 18, B.x1 - 18]) for (const sd of [-1, 1]) addLamp(x, y + sd * (e.hw + 5), x, y + sd * (e.hw + 5), 'warm', { style: 'globe', h: 26, r: 120, i: 0.85 });
    } else {
      let k = 0;
      for (let x = B.x0 + 40; x < B.x1 - 20; x += 105, k++) for (const sd of [-1, 1]) {
        if ((k + (sd > 0 ? 1 : 0)) % 2) continue;
        addLamp(x, y + sd * (e.hw + 4), x, y + sd * (e.hw - 16), 'white', { h: 52, r: 175 });
      }
    }
  }
  for (const e of World.edges) {
    const T = e.T;
    let spacing = 0, both = false;
    if (T.id === 'street') spacing = 190;
    else if (T.id === 'avenue') { spacing = 170; both = true; }
    else if (T.id === 'highway') { spacing = 250; both = true; }
    else if (T.id === 'road') spacing = 330;
    if (!spacing) continue;
    const col = lampColorFor(e);
    const nx = -e.dy, ny = e.dx;
    const off = e.hw + (T.sw ? T.sw * 0.55 : 12);
    const poles = {};
    let k = 0;
    for (let s = e.clearA + 30; s < e.len - e.clearB - 20; s += spacing, k++) {
      const sides = both ? [1, -1] : [k % 2 ? 1 : -1];
      for (const sd of sides) {
        const ss = both && sd < 0 ? s + spacing / 2 : s;
        if (ss > e.len - e.clearB - 20) continue;
        const px = e.a.x + e.dx * ss, py = e.a.y + e.dy * ss;
        let o = off;
        if (e.bridge) {
          if (px > e.bridge.x0 - 40 && px < e.bridge.x1 + 40) continue;
          if (groundAt(px + nx * off * sd, py + ny * off * sd) === SF.WATER) continue;
        }
        const bx = px + nx * o * sd, by = py + ny * o * sd;
        if (groundAt(bx, by) === SF.WATER) continue;
        const hx = px + nx * (o - 22) * sd, hy = py + ny * (o - 22) * sd;
        addLamp(bx, by, hx, hy, col, { broken: chance(0.03), flick: chance(0.05) });
        if (T.id !== 'highway') (poles[sd] || (poles[sd] = [])).push([bx, by]);
      }
    }
    // fiação entre os postes (bem brasileira)
    for (const sd in poles) {
      const P = poles[sd];
      if (P.length < 2) continue;
      const bx = edgeBox(e, 10);
      addTall({ kind: 'wires', pts: P, h: 56, x: (bx[0] + bx[2]) / 2, y: (bx[1] + bx[3]) / 2, seed: rnd() }, bx[0], bx[1], bx[2], bx[3]);
    }
    // lombadas nas ruas dos bairros
    if (T.id === 'street' && e.len > 380) {
      const rk0 = regionKeyAt(e.h ? (e.a.x + e.b.x) / 2 : e.a.x, e.h ? e.a.y : (e.a.y + e.b.y) / 2);
      if ((rk0 === 'vila' || rk0 === 'jardim') && chance(0.45)) {
        const s = e.len * rnd(0.4, 0.6), px = e.a.x + e.dx * s, py = e.a.y + e.dy * s;
        const w = e.h ? 12 : e.hw * 2 - 4, h = e.h ? e.hw * 2 - 4 : 12;
        addProp('bump', px, py, { w, h, z: 5.5, R: e.hw + 4 });
        World.bumps.push({ x0: px - w / 2 - 4, y0: py - h / 2 - 4, x1: px + w / 2 + 4, y1: py + h / 2 + 4 });
      }
    }
    // árvores de calçada
    if (T.sw) {
      const mx = e.h ? (e.a.x + e.b.x) / 2 : e.a.x, my = e.h ? e.a.y : (e.a.y + e.b.y) / 2;
      const rk = regionKeyAt(mx, my);
      const dens = rk === 'jardim' ? 0.5 : rk === 'vila' ? 0.3 : 0.18;
      const types = rk === 'jardim' ? ['palm', 'palm', 'ipeY'] : rk === 'centro' ? ['round', 'ipeP', 'ipeY'] : ['round', 'ipeY', 'mango', 'ipeP'];
      for (let s = e.clearA + 60; s < e.len - e.clearB - 40; s += 95) {
        if (!chance(dens)) continue;
        for (const sd of [1, -1]) {
          if (!chance(0.5)) continue;
          const px = e.a.x + e.dx * s + nx * (e.hw + T.sw * 0.5) * sd, py = e.a.y + e.dy * s + ny * (e.hw + T.sw * 0.5) * sd;
          if (areaBlocked(px - 14, py - 14, px + 14, py + 14)) continue;
          addTree(px, py, pick(types), rnd(0.75, 0.95), { sidewalk: true });
        }
      }
      // obra na rua: buraco com cones e cavalete (tudo derrubável)
      if (T.id === 'street' && e.len > 400 && chance(0.18)) {
        const s = e.len * rnd(0.35, 0.65), sd = chance(0.5) ? 1 : -1, o = e.hw - 9;
        const px = e.a.x + e.dx * s + nx * o * sd, py = e.a.y + e.dy * s + ny * o * sd;
        addProp('hole', px - nx * 4 * sd, py - ny * 4 * sd, { z: 5.6, R: 20 });
        World.obras.push({ x: e.a.x + e.dx * s + nx * T.lanes[0] * sd, y: e.a.y + e.dy * s + ny * T.lanes[0] * sd, name: 'Obra na ' + e.name });
        for (const d of [-26, -9, 9, 26]) addProp('cone', px + e.dx * d, py + e.dy * d, { col: 'circ', cr: 3, R: 14 });
        addProp('barrier', px + e.dx * 40, py + e.dy * 40, { a: Math.atan2(ny, nx), col: 'circ', cr: 4, R: 22 });
      }
      // lixeiras / hidrantes
      for (let s = e.clearA + 40; s < e.len - e.clearB - 40; s += 140) {
        if (!chance(0.35)) continue;
        const sd = chance(0.5) ? 1 : -1;
        const px = e.a.x + e.dx * s + nx * (e.hw + T.sw - 5) * sd, py = e.a.y + e.dy * s + ny * (e.hw + T.sw - 5) * sd;
        if (areaBlocked(px - 6, py - 6, px + 6, py + 6)) continue;
        const rkp = regionKeyAt(px, py);
        if ((rkp === 'centro' || rkp === 'vila' || rkp === 'jardim') && chance(0.16)) {
          const ph = { kind: 'phone', x: px, y: py, h: 24, col: chance(0.7) ? '#ff8c1a' : '#2f7fd6' };
          addTall(ph, px - 30, py - 30, px + 30, py + 30); addCircCol(px, py, 4, 'pole').brk = { kind: 'tall', obj: ph };
        } else addProp(chance(0.7) ? 'bin' : 'hydrant', px, py, { col: 'circ', cr: 4, R: 8 });
      }
    }
    // pedestres nas calçadas
    if (T.sw) {
      const mx = e.h ? (e.a.x + e.b.x) / 2 : e.a.x, my = e.h ? e.a.y : (e.a.y + e.b.y) / 2;
      const rk = regionKeyAt(mx, my);
      const per = rk === 'centro' ? 120 : rk === 'vila' ? 170 : 230;
      const s0 = e.perpA + 8, s1 = e.len - e.perpB - 8;
      if (s1 - s0 > 60) for (const sd of [1, -1]) {
        const o = e.hw + T.sw * 0.5;
        const ax = e.a.x + e.dx * s0 + nx * o * sd, ay = e.a.y + e.dy * s0 + ny * o * sd;
        const bx = e.a.x + e.dx * s1 + nx * o * sd, by = e.a.y + e.dy * s1 + ny * o * sd;
        const rect = [Math.min(ax, bx) - (e.h ? 0 : 5), Math.min(ay, by) - (e.h ? 5 : 0), Math.max(ax, bx) + (e.h ? 0 : 5), Math.max(ay, by) + (e.h ? 5 : 0)];
        World.animalsDef.push({ type: 'person', n: Math.max(1, Math.round((s1 - s0) / per * rnd(0.6, 1.3))), rect });
      }
    }
    // radar (pardal) nas avenidas e na rodovia
    if ((T.id === 'avenue' || T.id === 'highway') && e.len > 450 && chance(0.32)) {
      const s = e.len * 0.5, sd = 1, o = e.hw + (T.sw ? T.sw * 0.5 : 10);
      const px = e.a.x + e.dx * s + nx * o * sd, py = e.a.y + e.dy * s + ny * o * sd;
      if (!areaBlocked(px - 5, py - 5, px + 5, py + 5)) {
        const lim = T.id === 'avenue' ? 80 : 110;
        const rd = { kind: 'radar', x: px, y: py, h: 40, lim, last: -99 };
        addTall(rd, px - 50, py - 50, px + 50, py + 50); addCircCol(px, py, 3, 'pole').brk = { kind: 'tall', obj: rd };
        const cx = e.a.x + e.dx * s, cy = e.a.y + e.dy * s;
        World.radars.push({ obj: rd, lim, x0: e.h ? cx - 22 : cx - e.hw, x1: e.h ? cx + 22 : cx + e.hw, y0: e.h ? cy - e.hw : cy - 22, y1: e.h ? cy + e.hw : cy + 22 });
        const tx = cx - nx * e.hw * 0.5, ty = cy - ny * e.hw * 0.5;
        bake(cx - 60, cy - 60, cx + 60, cy + 60, 5.5, (g) => {
          g.save(); g.translate(cx - e.dx * 70 + nx * e.hw * 0.5, cy - e.dy * 70 + ny * e.hw * 0.5); g.rotate(Math.atan2(e.dy, e.dx) + Math.PI / 2);
          g.fillStyle = 'rgba(235,235,225,0.7)'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(lim), 0, 0); g.restore();
          g.save(); g.translate(cx + e.dx * 70 + -nx * e.hw * 0.5, cy + e.dy * 70 - ny * e.hw * 0.5); g.rotate(Math.atan2(e.dy, e.dx) - Math.PI / 2);
          g.fillStyle = 'rgba(235,235,225,0.7)'; g.font = 'bold 15px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(lim), 0, 0); g.restore();
        });
      }
    }
    // pontos de ônibus nas avenidas
    if (T.id === 'avenue' && e.len > 400) {
      const s = e.len * 0.5, sd = 1;
      const px = e.a.x + e.dx * s + nx * (e.hw + 12) * sd, py = e.a.y + e.dy * s + ny * (e.hw + 12) * sd;
      if (!areaBlocked(px - 20, py - 8, px + 20, py + 8)) {
        const st = { kind: 'busstop', x: px, y: py, a: Math.atan2(e.dy, e.dx), h: 26 };
        addTall(st, px - 30, py - 30, px + 30, py + 30);
        addRectCol(px - (e.h ? 22 : 6), py - (e.h ? 6 : 22), px + (e.h ? 22 : 6), py + (e.h ? 6 : 22), 'prop').brk = { kind: 'tall', obj: st };
        addLight(px, py, 70, 0.7, 'white');
      }
    }
  }
  // semáforos
  for (const n of World.nodes) {
    if (!n.light) continue;
    for (const e of n.edges) {
      const out = e.a === n ? 1 : -1; // direção saindo do nó
      const dx = e.dx * out, dy = e.dy * out;
      const clear = e.a === n ? e.clearA : e.clearB;
      // carros chegando vêm na direção -d; à direita deles fica o lado (-(-dy), -dx)...
      const ax = -dx, ay = -dy; // direção de chegada
      const rx = -ay, ry = ax;
      const off = e.hw + (e.T.sw ? 10 : 8);
      const px = n.x + dx * (clear - 18) + rx * off, py = n.y + dy * (clear - 18) + ry * off;
      const pole = { kind: 'tlight', x: px, y: py, node: n, axis: e.h ? 'H' : 'V', a: Math.atan2(ay, ax), h: 50, hx: px - rx * 14, hy: py - ry * 14 };
      addTall(pole, px - 50, py - 50, px + 50, py + 50);
      addCircCol(px, py, 3, 'pole').brk = { kind: 'tall', obj: pole };
      World.trafficPoles.push(pole);
    }
  }
  // placas PARE nos cruzamentos sem semáforo da cidade
  for (const n of World.nodes) {
    if (n.light || n.edges.length < 3 || n.x > 4700) continue;
    for (const e of n.edges) {
      if (e.T.id !== 'street' || !chance(0.35)) continue;
      const out = e.a === n ? 1 : -1, dx = e.dx * out, dy = e.dy * out;
      const clear = e.a === n ? e.clearA : e.clearB;
      const rx = dy, ry = -dx;
      const px = n.x + dx * (clear - 14) + rx * (e.hw + 12), py = n.y + dy * (clear - 14) + ry * (e.hw + 12);
      if (areaBlocked(px - 5, py - 5, px + 5, py + 5)) continue;
      const sgn = { kind: 'sign', x: px, y: py, h: 28, t: 'stop' };
      addTall(sgn, px - 30, py - 30, px + 30, py + 30);
      addCircCol(px, py, 2.5, 'pole').brk = { kind: 'tall', obj: sgn };
      // faixa "PARE" pintada
      const tx = n.x + dx * (clear + 14) + rx * (e.hw * 0.5), ty = n.y + dy * (clear + 14) + ry * (e.hw * 0.5);
      bake(tx - 30, ty - 30, tx + 30, ty + 30, 5.5, (g) => { g.save(); g.translate(tx, ty); g.rotate(Math.atan2(-dy, -dx) + Math.PI / 2); g.fillStyle = 'rgba(235,235,225,0.75)'; g.font = 'bold 13px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PARE', 0, 0); g.restore(); });
    }
  }
}

/* ---------- rodovia, rio e zona rural ---------- */
function buildRiver() {
  for (let gy = 0; gy < GH; gy++) {
    const y = gy * GC + 5, cx = riverCX(y), hw = riverHW(y);
    const a = Math.floor((cx - hw - 30) / GC), b = Math.ceil((cx + hw + 30) / GC);
    for (let gx = a; gx <= b; gx++) {
      const x = gx * GC + 5, d = Math.abs(x - cx);
      if (gx < 0 || gx >= GW) continue;
      ground[gy * GW + gx] = d < hw ? SF.WATER : d < hw + 28 ? SF.SAND : ground[gy * GW + gx];
    }
  }
  for (let y = 0; y < WORLD_H; y += 512) bake(4900, y, 6000, y + 512, 2, (g) => drawRiver(g, y, y + 512));
  // orla (margem oeste)
  const walkX = 4672;
  decal(walkX, 340, walkX + 34, 1400, 'plaza'); decal(walkX, 1600, walkX + 34, 3780, 'plaza'); decal(walkX, 3980, walkX + 34, 6100, 'plaza');
  for (let y = 420; y < 6080; y += 170) {
    if (Math.abs(y - 1500) < 140 || Math.abs(y - 3880) < 140) continue;
    addLamp(walkX + 42, y, walkX + 42, y, 'white', { style: 'globe', h: 32, r: 110, i: 0.7 });
    if (chance(0.5)) addProp('bench', walkX + 52, y + 60, { a: Math.PI / 2, col: 'rect', w: 8, h: 26 });
    if (chance(0.7)) addTree(walkX + rnd(80, 140), y + rnd(30, 120), chance(0.6) ? 'palm' : 'ipeP', rnd(0.9, 1.2));
  }
  addBuilding(4790, 2260, 4840, 2310, 20, { style: 'kiosk', roofType: 'hip', roofColor: '#6e4a2a', wall: '#c9a06a', lit: 0.9, sign: 'QUIOSQUE', signColor: '#ffb547' });
  addBuilding(4800, 4860, 4850, 4910, 20, { style: 'kiosk', roofType: 'hip', roofColor: '#6e4a2a', wall: '#c9a06a', lit: 0.9, sign: 'AÇAÍ', signColor: '#c56bff' });
  // mata ciliar e árvores das margens
  for (let y = 360; y < 6100; y += 240) {
    if (Math.abs(y - 1500) < 180 || Math.abs(y - 3880) < 180 || Math.abs(y - 6200) < 220) continue;
    const cx = riverCX(y), hw = riverHW(y);
    const x0 = cx + hw + 60, x1 = 6240;
    if (chance(0.6) && x1 - x0 > 120 && !(y > 2400 && y < 2800)) {
      const fx0 = x0 + rnd(0, 60), fx1 = x1 - rnd(0, 80);
      forest(fx0, y, fx1, y + rnd(120, 220));
    } else scatterTrees(x0, y, x1, y + 230, 5, ['round', 'mango', 'pine', 'bush']);
    scatterTrees(4900, y, cx - hw - 40, y + 230, 2, ['round', 'palm', 'bush', 'ipeY']);
  }
  // mirante
  const my = 2600, mbx = riverCX(my) + riverHW(my);
  decal(mbx + 20, my - 12, 6262, my + 12, 'earth');
  addBuilding(mbx - 40, my - 34, mbx + 30, my + 34, 7, { style: 'deck', roofType: 'deck', roofColor: '#7a5434', wall: '#5a3c22', lit: 0, noCol: true });
  addRectCol(mbx - 40, my - 34, mbx - 34, my + 34, 'fence'); addRectCol(mbx - 40, my - 34, mbx + 30, my - 28, 'fence'); addRectCol(mbx - 40, my + 28, mbx + 30, my + 34, 'fence');
  addLamp(mbx + 40, my - 40, mbx + 20, my - 20, 'sodium', { h: 40, r: 120 });
  gFill(mbx - 34, my - 28, mbx + 30, my + 28, SF.BRIDGE);
  World.mirante = { x: mbx, y: my };
}
function forest(x0, y0, x1, y1, noCol) {
  decal(x0, y0, x1, y1, 'forest', { z: 7.5 });
  if (!noCol) addRectCol(x0 + 14, y0 + 14, x1 - 14, y1 - 14, 'forest');
}
function buildRural() {
  // bordas do mundo
  forest(0, 0, WORLD_W, 230); forest(0, 230, 230, WORLD_H); forest(8790, 230, WORLD_W, WORLD_H); forest(4700, 6440, 8790, WORLD_H); forest(230, WORLD_H - 240, 4700, WORLD_H);
  addRectCol(-200, -200, WORLD_W + 200, 20, 'world'); addRectCol(-200, WORLD_H - 20, WORLD_W + 200, WORLD_H + 200, 'world');
  addRectCol(-200, 0, 20, WORLD_H, 'world'); addRectCol(WORLD_W - 20, 0, WORLD_W + 200, WORLD_H, 'world');
  // faixa norte da cidade (entre a mata e a primeira rua)
  scatterTrees(260, 236, 4560, 258, 30, ['round', 'pine', 'bush']);
  // milharal e canavial (norte)
  decal(6360, 360, 7440, 1420, 'corn');
  addProp('scarecrow', 6900, 900, { col: 'circ', cr: 4 });
  decal(7540, 300, 8660, 830, 'cane');
  scatterTrees(6340, 250, 8700, 340, 22, ['round', 'pine', 'mango']);
  // Sítio Boa Vista
  decal(7540, 920, 8660, 1455, 'pasture');
  decal(7840, 920, 8460, 1290, 'earth');
  decal(7948, 913, 7992, 1000, 'earth');
  addBuilding(7900, 1000, 8040, 1100, 28, { style: 'farmhouse', roofType: 'hip', roofColor: '#a04a2a', wall: '#efe4c8', lit: 0.7, front: 'N' });
  addBuilding(8150, 970, 8300, 1120, 40, { style: 'barn', roofType: 'gable', roofColor: '#7a2e22', wall: '#a8402f', lit: 0.15 });
  addBuilding(8350, 1180, 8420, 1232, 16, { style: 'shed', roofType: 'gable', roofColor: '#7d6a50', wall: '#b59a74', lit: 0 });
  decal(7610, 980, 7810, 1120, 'garden');
  addProp('well', 8080, 1180, { col: 'circ', cr: 12 });
  fenceRect(7560, 1300, 8640, 1440, [{ side: 'N', at: 8000, w: 60 }], 'wood');
  for (const [x, y] of [[7880, 960], [8060, 960]]) addLamp(x, y, x, y + 10, 'warm', { style: 'pole', h: 40, r: 130 });
  scatterTrees(7560, 1140, 7830, 1290, 5, ['mango', 'round', 'palm']);
  scatterTrees(8440, 940, 8650, 1280, 5, ['mango', 'round']);
  World.animalsDef.push({ type: 'chicken', n: 9, rect: [8300, 1130, 8460, 1280] });
  World.animalsDef.push({ type: 'cow', n: 4, rect: [7600, 1320, 8600, 1420] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [7860, 1110, 8120, 1280] });
  addShop({ kind: 'sitio', name: 'Sítio Bota Fé', x: 7970, y: 880 + 15, color: '#9be36a', region: 'sitio', pickup: true, items: ['Ovos caipiras', 'Queijo minas', 'Caixa de verduras'] });
  // pasto grande
  decal(6340, 1540, 7460, 3840, 'pasture');
  fenceRect(6380, 1580, 7420, 3800, [{ side: 'E', at: 2400, w: 60 }, { side: 'W', at: 3200, w: 60 }], 'wood');
  scatterTrees(6420, 1620, 7380, 3760, 14, ['mango', 'round', 'round', 'pine'], 1, 1.4);
  addProp('trough', 6900, 2700, { col: 'rect', w: 40, h: 12 });
  addBuilding(7200, 3500, 7300, 3580, 22, { style: 'shed', roofType: 'gable', roofColor: '#6d5a44', wall: '#9a8466', lit: 0 });
  World.animalsDef.push({ type: 'cow', n: 12, rect: [6420, 1620, 7380, 3760] });
  World.animalsDef.push({ type: 'horse', n: 3, rect: [6420, 2600, 7380, 3760] });
  World.animalsDef.push({ type: 'owl', n: 4, rect: [6380, 1580, 7420, 3800] });
  // cafezal
  decal(7540, 1540, 8660, 3300, 'coffee');
  decal(7540, 3300, 8660, 3330, 'earth');
  forest(7540, 3330, 8660, 3840);
  addBuilding(8460, 2380, 8580, 2470, 26, { style: 'farmhouse', roofType: 'hip', roofColor: '#9a4a2a', wall: '#e8dcc2', lit: 0.6 });
  decal(8580, 2410, 8662, 2440, 'earth');
  World.animalsDef.push({ type: 'dog', n: 1, rect: [8420, 2360, 8640, 2520] });
  // Fazenda Santa Luzia
  decal(7540, 3920, 8660, 5260, 'pasture');
  decal(7900, 4250, 8460, 4940, 'earth');
  decal(8050, 3913, 8100, 4260, 'earth');
  for (let y = 3980; y < 4240; y += 46) { addTree(8030, y, 'palm', 1.1, { force: true }); addTree(8122, y, 'palm', 1.1, { force: true }); }
  addBuilding(7950, 4300, 8200, 4460, 36, { style: 'farmhouse', roofType: 'hip', roofColor: '#b0532e', wall: '#f4efe2', lit: 0.75, front: 'N', sign: 'FAZENDA MUUUITO LONGE', signColor: '#ffd24a' });
  addLight(8075, 4280, 150, 0.9, 'warm');
  fenceRect(8300, 4000, 8600, 4240, [{ side: 'W', at: 4120, w: 40 }], 'wood');
  World.animalsDef.push({ type: 'horse', n: 4, rect: [8320, 4020, 8580, 4220] });
  const silo = { kind: 'silo', x: 8460, y: 4600, r: 38, h: 92 };
  addTall(silo, 8420, 4560, 8500, 4640); addCircCol(8460, 4600, 38, 'bld');
  addBuilding(8240, 4700, 8430, 4880, 44, { style: 'barn', roofType: 'gable', roofColor: '#6e2c22', wall: '#9c3b2c', lit: 0.2 });
  addParkedCar(8180, 4800, -Math.PI / 2, 'tractor', '#2e8b3a');
  const mill = { kind: 'windmill', x: 7700, y: 4700, h: 70 };
  addTall(mill, 7660, 4660, 7740, 4740); addCircCol(7700, 4700, 6, 'pole');
  decal(7560, 4960, 8640, 5240, 'soy');
  for (const [x, y] of [[8010, 4270], [8140, 4270], [8300, 4560]]) addLamp(x, y, x, y, 'warm', { style: 'pole', h: 40, r: 130 });
  World.animalsDef.push({ type: 'chicken', n: 7, rect: [7920, 4480, 8200, 4600] });
  World.animalsDef.push({ type: 'cow', n: 6, rect: [7600, 3960, 7880, 4900] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [7950, 4470, 8250, 4650] });
  addShop({ kind: 'fazenda', name: 'Fazenda Muuuito Longe', x: 8075, y: 3880 + 15, color: '#ffd24a', region: 'fazenda', pickup: true, items: ['Leite fresco', 'Queijo da fazenda', 'Doce de leite'] });
  // açude
  decal(6340, 3920, 7460, 4280, 'soy');
  bake(6600, 4380, 7200, 4800, 2, (g) => drawPond(g, 6900, 4590, 230, 150));
  for (let gy = Math.floor(4440 / GC); gy < Math.ceil(4740 / GC); gy++) for (let gx = Math.floor(6670 / GC); gx < Math.ceil(7130 / GC); gx++) {
    const x = gx * GC + 5, y = gy * GC + 5, d = ((x - 6900) / 230) ** 2 + ((y - 4590) / 150) ** 2;
    if (d < 1) ground[gy * GW + gx] = SF.WATER; else if (d < 1.25) ground[gy * GW + gx] = SF.SAND;
  }
  addBuilding(7080, 4480, 7180, 4502, 4, { style: 'deck', roofType: 'deck', roofColor: '#7a5434', wall: '#5a3c22', lit: 0, noCol: true, noShadow: true });
  addLamp(7176, 4478, 7176, 4478, 'warm', { style: 'globe', h: 30, r: 110, i: 0.8 });
  scatterTrees(6360, 4300, 7440, 5260, 20, ['round', 'mango', 'pine', 'bush', 'ipeY']);
  World.animalsDef.push({ type: 'capybara', n: 4, rect: [6700, 4720, 7100, 4790] });
  decal(6360, 4980, 7440, 5240, 'corn');
  // canaviais do sul
  decal(6360, 5360, 7440, 6100, 'cane');
  decal(7560, 5360, 8640, 6100, 'cane');
  for (let x = 6360; x < 8660; x += 70) { addTree(x, 5340, 'pine', rnd(0.9, 1.1)); }
  // margem sul da rodovia
  decal(4700, 6300, 8760, 6420, 'pasture');
  for (let x = 4800; x < 8700; x += 600) fenceRect(x, 6310, x + 560, 6410, [], 'wood');
  scatterTrees(4700, 6290, 8760, 6430, 24, ['round', 'pine', 'mango', 'bush']);
  // capivaras do rio
  for (const y of [1000, 2300, 3300, 4300, 5200]) {
    const cx = riverCX(y) + riverHW(y) + 8;
    World.animalsDef.push({ type: 'capybara', n: 3, rect: [cx - 4, y - 60, cx + 14, y + 60] });
  }
  for (const y of [1900, 4700]) {
    const cx = riverCX(y) - riverHW(y) - 14;
    World.animalsDef.push({ type: 'capybara', n: 2, rect: [cx - 10, y - 50, cx + 6, y + 50] });
  }
  // cercas de arame farpado com mourões de madeira e porteiras nas estradas de terra
  for (const e of World.edges) {
    if (e.T.id !== 'dirt' || e.bridge) continue;
    const nx = -e.dy, ny = e.dx;
    for (const sd of [-1, 1]) {
      let s = 70;
      while (s < e.len - 70) {
        const run = rnd(160, 520), s1 = Math.min(e.len - 70, s + run), o = e.hw + 16;
        const posts = [];
        for (let t = s; t <= s1; t += 34) {
          const px = e.a.x + e.dx * t + nx * o * sd, py = e.a.y + e.dy * t + ny * o * sd, gt = groundAt(px, py);
          if (gt !== SF.GRASS && gt !== SF.FIELD && gt !== SF.EARTH) { posts.length = 0; break; }
          posts.push([px, py]);
        }
        if (posts.length > 2 && !areaBlocked(Math.min(posts[0][0], posts[posts.length - 1][0]) - 3, Math.min(posts[0][1], posts[posts.length - 1][1]) - 3, Math.max(posts[0][0], posts[posts.length - 1][0]) + 3, Math.max(posts[0][1], posts[posts.length - 1][1]) + 3)) {
          const P = posts.slice(), xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
          bake(Math.min(...xs) - 6, Math.min(...ys) - 6, Math.max(...xs) + 6, Math.max(...ys) + 6, 8, (g) => {
            g.strokeStyle = 'rgba(190,195,200,0.55)'; g.lineWidth = 0.7;
            for (const w of [-1.4, 1.4]) { g.beginPath(); P.forEach(([x, y], i) => { const xx = x + (e.h ? 0 : w), yy = y + (e.h ? w : 0); if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); }); g.stroke(); }
            for (const [x, y] of P) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - 1, y, 4, 3); g.fillStyle = '#6a4a2c'; g.fillRect(x - 2, y - 2, 4, 4); g.fillStyle = '#8a6440'; g.fillRect(x - 2, y - 2, 4, 1.4); }
          });
        }
        s = s1 + rnd(40, 90); // porteira / entrada de sítio
      }
    }
  }
  // árvores na beira das estradas rurais
  for (const e of World.edges) {
    if (e.T.id !== 'dirt' && e.T.id !== 'road') continue;
    if (e.a.x < 4700 && e.b.x < 4700) continue;
    const nx = -e.dy, ny = e.dx;
    for (let s = 60; s < e.len - 60; s += rnd(70, 160)) {
      const sd = chance(0.5) ? 1 : -1, o = e.hw + rnd(26, 60);
      addTree(e.a.x + e.dx * s + nx * o * sd, e.a.y + e.dy * s + ny * o * sd, pick(['round', 'mango', 'pine', 'bush', 'ipeY', 'ipeP']), rnd(0.8, 1.3));
    }
  }
}
function buildHighwayStrip() {
  const y0 = 5371, y1 = 6098;
  // chácaras
  decal(371, y0, 1379, y1, 'lawn');
  for (const [x0, x1] of [[380, 700], [760, 1100]]) {
    const F = lotFrame(x0, y0, x1, y0 + 220, 'N');
    houseLot(F, { rich: true, back: true, lastLot: true, street: 'Rua da Esperança Equilibrista', roadHW: RT.street.w / 2, laneOff: RT.street.lanes[0], region: 'rodovia' });
  }
  scatterTrees(385, 5600, 1370, 6080, 14, ['mango', 'round', 'palm', 'pine']);
  // Posto Estrela Cadente
  decal(1521, y0, 1988, y1, 'lawn');
  World.posto2 = gasStation({ x0: 1521, y0: 5760, x1: 1988, y1: y1 }, { name: 'Posto Estrela Cadente', color: '#ffb000', front: 'N', canopy: [1580, 5920, 1880, 6070], store: [1560, 5780, 1760, 5880], totem: [1974, 6082], region: 'rodovia' });
  decal(1521, y0 + 20, 1988, 5740, 'paved');
  const sx0 = 1540, SW = 34;
  bake(sx0, 5400, sx0 + 13 * SW, 5470, 6, (g) => { g.strokeStyle = 'rgba(240,240,230,0.7)'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 13; i++) { g.moveTo(sx0 + i * SW, 5400); g.lineTo(sx0 + i * SW, 5470); } g.moveTo(sx0, 5400); g.lineTo(sx0 + 13 * SW, 5400); g.stroke(); });
  for (let i = 0; i < 13; i++) {
    const x = sx0 + i * SW + SW / 2;
    if (i === 3 || i === 9) { World.parkSpots.push({ id: 'estrela_' + i, name: 'Pátio do Posto Estrela Cadente', x, y: 5435, a: -Math.PI / 2, w: SW, l: 62, reward: 200 }); continue; }
    if (chance(0.5)) addParkedCar(x, 5435, -Math.PI / 2, randomCarModel(), pick(CAR_COLORS));
  }
  for (let i = 0; i < 3; i++) addParkedCar(1620 + i * 120, 5640, 0, 'truck', pick(['#d8d8d8', '#c43d2e', '#2c5d9c', '#e0a020']));
  addLamp(1700, 5520, 1700, 5520, 'white', { style: 'pole', h: 64, r: 200 });
  addLamp(1900, 5520, 1900, 5520, 'white', { style: 'pole', h: 64, r: 200 });
  // churrascaria
  decal(2212, y0, 3880, y1, 'lawn');
  decal(2600, 5780, 3100, y1, 'paved');
  const chb = addBuilding(2680, 5790, 3000, 5930, 34, { style: 'shop', front: 'S', roofType: 'hip', roofColor: '#8a3a22', wall: '#e8d2a8', lit: 0.9, sign: 'BOI NA BRASA', signColor: '#ff5f3d' });
  addLight(2840, 5950, 160, 0.9, 'warm', { shop: true });
  const cx0 = 2620;
  bake(cx0, 5990, cx0 + 14 * 34, 6060, 6, (g) => { g.strokeStyle = 'rgba(240,240,230,0.7)'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 14; i++) { g.moveTo(cx0 + i * 34, 5990); g.lineTo(cx0 + i * 34, 6060); } g.moveTo(cx0, 5990); g.lineTo(cx0 + 14 * 34, 5990); g.stroke(); });
  for (let i = 0; i < 14; i++) {
    const x = cx0 + i * 34 + 17;
    if (i === 5 || i === 11) { World.parkSpots.push({ id: 'rodeio_' + i, name: 'Estacionamento da Churrascaria', x, y: 6025, a: -Math.PI / 2, w: 34, l: 62, reward: 200 }); continue; }
    if (chance(0.55)) addParkedCar(x, 6025, -Math.PI / 2, randomCarModel(), pick(CAR_COLORS));
  }
  addLamp(2760, 5970, 2760, 5970, 'sodium', { style: 'pole', h: 60, r: 180 });
  addLamp(3000, 5970, 3000, 5970, 'sodium', { style: 'pole', h: 60, r: 180 });
  addShop({ kind: 'churrascaria', name: 'Churrascaria Boi na Brasa', x: 2840, y: 6200 - 21, bld: chb, color: '#ff5f3d', region: 'rodovia', pickup: true, items: ['Marmitas de churrasco', 'Encomenda de carnes'] });
  scatterTrees(2230, 5400, 2580, 6080, 8, ['mango', 'round', 'pine']);
  scatterTrees(3150, 5400, 3870, 6080, 12, ['mango', 'round', 'pine', 'palm']);
  // borracharia
  decal(4020, y0, 4530, y1, 'lawn');
  decal(4100, 5940, 4400, y1, 'gravel');
  const bb = addBuilding(4150, 5960, 4330, 6060, 26, { style: 'shop', front: 'S', roofType: 'corrugated', roofColor: '#6a6a60', wall: '#d4cdb4', lit: 0.9, sign: 'BORRACHARIA 24H', signColor: '#ffd24a' });
  for (let i = 0; i < 5; i++) addProp('tires', 4120 + i * 22, 6080, { col: 'circ', cr: 8 });
  addLight(4240, 6080, 120, 0.9, 'warm', { shop: true });
  addShop({ kind: 'borracharia', name: 'Borracharia Furou, Chamou', x: 4240, y: 6200 - 21, bld: bb, color: '#ffd24a', region: 'rodovia' });
  scatterTrees(4035, 5400, 4515, 5900, 8, ['round', 'mango', 'palm']);
  // outdoors
  const ads = [['MOQUECA É CAPIXABA', 'O RESTO É PEIXADA'], ['DIRIJA DE BOA, MANO', 'A NOITE É LONGA'], ['RÁDIO GAMBIARRA FM', '171,1'], ['BOI NA BRASA', 'RODÍZIO ATÉ CAIR'], ['CAFÉ CONILON DO ES', 'ACORDA ATÉ DEFUNTO'], ['POSTO ESTRELA CADENTE', 'ABERTO 25H']];
  let ai = 0;
  for (const x of [900, 3400, 5000, 6900, 8200]) {
    const bx = x, by = x > 4700 ? 6320 : 6080;
    if (areaBlocked(bx - 40, by - 10, bx + 40, by + 10)) continue;
    const bd = { kind: 'billboard', x: bx, y: by, h: 58, text: ads[ai % ads.length], col: pick(['#ffb547', '#59e0ff', '#ff5f7a', '#5be38f']), panel: null };
    ai++;
    addTall(bd, bx - 60, by - 60, bx + 60, by + 60);
    addCircCol(bx - 24, by, 4, 'pole'); addCircCol(bx + 24, by, 4, 'pole');
    addLight(bx, by - 20, 110, 0.6, 'white');
  }
  // cachorros pelas ruas residenciais
  World.animalsDef.push({ type: 'dog', n: 1, rect: [640, 2700 + RT.street.w / 2 + 5, 1380, 2700 + RT.street.w / 2 + 17] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [1530, 3880 + RT.avenue.w / 2 + 5, 1980, 3880 + RT.avenue.w / 2 + 17] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [2770, 4500 + RT.street.w / 2 + 5, 3280, 4500 + RT.street.w / 2 + 17] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [300 + RT.street.w / 2 + 5, 3420, 300 + RT.street.w / 2 + 17, 3800] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [3360, 4900, 3920, 5240] });
  World.animalsDef.push({ type: 'dog', n: 2, rect: [420, 3420, 760, 3760] });
}

/* ---------- pontos de interesse e percursos ---------- */
// tira árvores que acabaram em cima do asfalto (ruas alargadas depois do plantio)
function pruneRoadTrees() {
  let n = 0;
  for (const t of World.tall) {
    if (t.kind !== 'tree' || t.removed) continue;
    const gt = groundAt(t.x, t.y);
    let onRoad = gt === SF.ROAD || gt === SF.BRIDGE || gt === SF.DIRT;
    if (!onRoad) { const ne = nearestEdge(t.x, t.y); if (ne && ne.d !== undefined && ne.d < ne.e.hw + 4) onRoad = true; }
    if (onRoad) { t.removed = true; if (t.col) { t.col.x = t.col.y = -1e6; t.col.r = 0; t.col.tag = 'none'; t.col.brk = null; } n++; }
  }
  World.tall = World.tall.filter((t) => !t.removed);
  return n;
}
function markReflections() {
  for (const L of World.lights) {
    for (let dy = 30; dy <= 260; dy += 20) if (groundAt(L.x, L.y + dy) === SF.WATER) { L.refl = dy + 30; break; }
  }
}
function addFlags(x1, y1, x2, y2, bulbs) {
  const f = { kind: 'flags', x1, y1, x2, y2, h: 44, bulbs: !!bulbs, x: (x1 + x2) / 2, y: (y1 + y2) / 2, seed: rnd() };
  addTall(f, Math.min(x1, x2) - 20, Math.min(y1, y2) - 30, Math.max(x1, x2) + 20, Math.max(y1, y2) + 20);
}
function addGrill(x, y) {
  if (areaBlocked(x - 8, y - 6, x + 8, y + 6)) return;
  const g = { kind: 'grill', x, y, h: 10 };
  addTall(g, x - 30, y - 30, x + 30, y + 30); addCircCol(x, y, 6, 'prop').brk = { kind: 'tall', obj: g };
  World.grills.push(g);
  addLight(x, y, 70, 0.7, 'sodium');
  World.animalsDef.push({ type: 'person', n: 3, rect: [x - 30, y - 8, x + 30, y + 8], look: { dance: true } });
}
function buildFesta() {
  for (const s of World.shops) {
    if (!['bar', 'lanchonete', 'churrascaria', 'mercado'].includes(s.kind)) continue;
    const ne = nearestEdge(s.x, s.y), e = ne.e;
    const sd = e.h ? Math.sign((s.bld ? s.bld.cy : s.y) - e.a.y) || 1 : Math.sign((s.bld ? s.bld.cx : s.x) - e.a.x) || 1;
    const o = e.hw + (e.T.sw ? e.T.sw * 0.5 : 14);
    if (e.h) addGrill(s.x + 70, e.a.y + sd * o); else addGrill(e.a.x + sd * o, s.y + 70);
  }
  { const R = cellRect(2, 1); addGrill(R.x1 - 80, R.y1 - 26); }
  { const R = cellRect(0, 5); addGrill(XS[1] - RT.street.w / 2 - 11, (R.y0 + R.y1) / 2 + 60); }
  addGrill(1640, 5900);
  // bandeirinhas de festa junina e gambiarras de luz perto dos comércios do bairro
  for (const s of World.shops) {
    if (!['bar', 'lanchonete', 'padaria', 'mercado', 'moquecaria', 'churrascaria'].includes(s.kind)) continue;
    const ne = nearestEdge(s.x, s.y), e = ne.e;
    const span = e.hw + (e.T.sw || 8) + 2;
    for (const d of [-70, -35, 0, 35, 70]) {
      const zig = (d / 35) % 2 ? 14 : -14;
      if (e.h) addFlags(s.x + d, e.a.y - span, s.x + d + zig, e.a.y + span, s.kind === 'bar' || s.kind === 'lanchonete');
      else addFlags(e.a.x - span, s.y + d, e.a.x + span, s.y + d + zig, s.kind === 'bar' || s.kind === 'lanchonete');
    }
  }
  // arraial na praça, no campo de várzea, no sítio e na fazenda
  const lines = [[1530, 1180, 1980, 1380], [1530, 1380, 1980, 1180], [380, 3380, 770, 3760], [380, 3760, 770, 3380], [7860, 1150, 8140, 1270], [7860, 1270, 8140, 1150], [7960, 4500, 8220, 4620], [7960, 4620, 8220, 4500]];
  for (const [a, b, c, d] of lines) addFlags(a, b, c, d, true);
}
function buildCapixaba() {
  // Morro do Convento da Pinha (no alto, com vista para a cidade)
  const hx = 8100, hy = 560;
  decal(hx - 300, hy - 240, hx + 300, hy + 240, 'hill', { z: 1.2 });
  decal(hx - 8, hy + 120, hx + 8, 846, 'earth', { z: 1.3 });
  const cv = addBuilding(hx - 70, hy - 50, hx + 70, hy + 40, 34, { style: 'church', roofType: 'hip', roofColor: '#a8492b', wall: '#f4f0e6', lit: 0.6, front: 'S' });
  const tw = addBuilding(hx - 18, hy + 40, hx + 18, hy + 76, 70, { style: 'tower', roofType: 'tower', roofColor: '#8a3f26', wall: '#f2ece0', lit: 0.3, front: 'S' });
  tw.cross = true;
  addLight(hx, hy + 90, 200, 0.9, 'warm'); addLight(hx, hy - 10, 160, 0.6, 'warm');
  for (const [dx, dy] of [[-150, -60], [150, -60], [-170, 80], [170, 80], [-110, 150], [110, 150]]) addTree(hx + dx, hy + dy, 'palm', 1.1, { force: true });
  for (const dy of [150, 210, 262]) { addLamp(hx - 18, hy + dy, hx - 6, hy + dy, 'warm', { style: 'globe', h: 30, r: 110, i: 0.8 }); }
  // Galpão das Paneleiras, na orla
  const pb = addBuilding(4780, 3240, 4880, 3310, 22, { style: 'shop', roofType: 'corrugated', roofColor: '#6a5a4a', wall: '#3a2a22', lit: 0.8, sign: 'PANELAS DE BARRO', signColor: '#ff9a4a', front: 'W' });
  addLight(4760, 3275, 110, 0.9, 'warm', { shop: true });
  for (let i = 0; i < 5; i++) addProp('pot', 4745, 3250 + i * 14, { col: 'circ', cr: 5, R: 10 });
  addShop({ kind: 'paneleiras', name: 'Galpão das Paneleiras', x: 4600 + RT.street.lanes[0], y: 3275, bld: pb, color: '#ff9a4a', region: 'rio', pickup: true, items: ['Panela de barro grande', 'Jogo de panelas de barro', 'Moquequeira de barro'] });
  // placas verdes de rodovia com cidades do ES
  const signs = [[1180, 'VITÓRIA 25', 'VILA VELHA 31'], [3300, 'GUARAPARI 58', 'ANCHIETA 80'], [6900, 'PEDRA AZUL 92', 'DOMINGOS MARTINS 70'], [8200, 'CACHOEIRO 136', 'LINHARES 135']];
  for (const [x, a, b] of signs) {
    const y = HWY_Y - RT.highway.w / 2 - 14;
    if (areaBlocked(x - 30, y - 8, x + 30, y + 8)) continue;
    const g = { kind: 'gsign', x, y, h: 54, lines: [a, b], panel: null };
    addTall(g, x - 60, y - 60, x + 60, y + 60);
    addCircCol(x - 26, y, 3, 'pole'); addCircCol(x + 26, y, 3, 'pole');
  }
  { const x = 5000, y = 1500 - RT.road.w / 2 - 14; const g = { kind: 'gsign', x, y, h: 50, lines: ['TERCEIRA PONTE E MEIA', 'SERRA 40 · ARACRUZ 70'], panel: null }; addTall(g, x - 60, y - 60, x + 60, y + 60); addCircCol(x - 26, y, 3, 'pole'); addCircCol(x + 26, y, 3, 'pole'); }
  // feira livre perto das chácaras
  const cols = ['#e63946', '#2a9d8f', '#f4c430', '#3a86ff', '#ff7f11'];
  let n = 0;
  for (let x = 470; x < 1260 && n < 10; x += 74) {
    const y = 5830;
    if (areaBlocked(x - 14, y - 12, x + 14, y + 12)) continue;
    const st = { kind: 'stall', x, y, h: 20, c: cols[n % cols.length], seed: n };
    addTall(st, x - 40, y - 40, x + 40, y + 40); addRectCol(x - 12, y - 8, x + 12, y + 8, 'prop').brk = { kind: 'tall', obj: st }; n++;
  }
  if (n) { decal(450, 5790, 1270, 5870, 'yard', { z: 1.4 }); addLight(860, 5830, 260, 0.6, 'warm'); World.animalsDef.push({ type: 'person', n: 14, rect: [460, 5850, 1260, 5866] }); }
}
/* ---------- Serra: Feu Rosa e Jardim Carapina ---------- */
function serraRect(c, r) {
  const hv = (x) => (x === 2100 ? RT.avenue.w / 2 : RT.street.w / 2) + 22;
  const hh = (y) => y === 6200 ? RT.highway.w / 2 + 14 : (y === 7500 ? RT.avenue.w / 2 : RT.street.w / 2) + 22;
  return { x0: XS[c] + hv(XS[c]), x1: XS[c + 1] - hv(XS[c + 1]), y0: SERRA_YS[r] + hh(SERRA_YS[r]), y1: SERRA_YS[r + 1] - hh(SERRA_YS[r + 1]) };
}
function serraRoads(c, r) {
  const nm = (y) => y === 6200 ? 'Rodovia BR-101 e Pouco' : (ROADS.find((q) => q.h && q.y === y && q.x1 < 4700) || {}).name;
  const nv = (x) => (ROADS.find((q) => !q.h && q.x === x && q.y2 >= 8700) || ROADS.find((q) => !q.h && q.x === x) || {}).name;
  const mk = (name, hw) => ({ name, hw, lane: hw > 60 ? RT.avenue.lanes[1] : RT.street.lanes[0] });
  const y0 = SERRA_YS[r], y1 = SERRA_YS[r + 1], x0 = XS[c], x1 = XS[c + 1];
  return { N: mk(nm(y0), y0 === 6200 ? RT.highway.w / 2 : y0 === 7500 ? RT.avenue.w / 2 : RT.street.w / 2), S: mk(nm(y1), y1 === 7500 ? RT.avenue.w / 2 : RT.street.w / 2), W: mk(nv(x0), x0 === 2100 ? RT.avenue.w / 2 : RT.street.w / 2), E: mk(nv(x1), x1 === 2100 ? RT.avenue.w / 2 : RT.street.w / 2) };
}
function pracaBagunca(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'plaza');
  const cx = (R.x0 + R.x1) / 2, cy = (R.y0 + R.y1) / 2;
  decal(cx - 90, cy - 60, cx + 90, cy + 60, 'court');
  addProp('goal', cx - 84, cy, { a: -Math.PI / 2, col: 'rect', w: 8, h: 44, R: 30 });
  addProp('goal', cx + 84, cy, { a: Math.PI / 2, col: 'rect', w: 8, h: 44, R: 30 });
  addBuilding(R.x0 + 20, R.y0 + 20, R.x0 + 120, R.y0 + 70, 18, { style: 'kiosk', roofType: 'flat', roofColor: '#2a3a5a', wall: '#e8c547', lit: 0.95, sign: 'PAGODE DE DOMINGO', signColor: '#ffd24a', front: 'S' });
  addBuilding(R.x1 - 70, R.y1 - 60, R.x1 - 20, R.y1 - 20, 18, { style: 'kiosk', roofType: 'hip', roofColor: '#6e4a2a', wall: '#c9a06a', lit: 0.9, sign: 'ESPETINHO', signColor: '#ff7a2a' });
  for (const [dx, dy] of [[-170, -150], [170, -150], [-170, 150], [170, 150], [0, -170], [0, 170]]) addTree(cx + dx, cy + dy, pick(['mango', 'ipeY', 'palm']), 1.1);
  for (const [dx, dy] of [[-130, -90], [130, -90], [-130, 90], [130, 90]]) addProp('bench', cx + dx, cy + dy, { col: 'rect', w: 26, h: 8 });
  for (const [dx, dy] of [[-200, 0], [200, 0], [0, -110], [0, 110]]) addLamp(cx + dx, cy + dy, cx + dx, cy + dy, 'white', { style: 'globe', h: 34, r: 140, i: 0.85 });
  addFlags(R.x0 + 20, R.y0 + 90, R.x1 - 20, R.y1 - 90, true); addFlags(R.x0 + 20, R.y1 - 90, R.x1 - 20, R.y0 + 90, true);
  addFlags(R.x0 + 20, cy, R.x1 - 20, cy, true);
  World.animalsDef.push({ type: 'person', n: 26, rect: [R.x0 + 16, R.y0 + 16, R.x1 - 16, R.y1 - 16], look: { dance: true } });
  addShop({ kind: 'bar', name: 'Bar da Bagunça', x: cx, y: R.y0 - 22 - (RT.street.w / 2 - RT.street.lanes[0]), color: '#ffd24a', region: 'feurosa' });
  World.pracaBagunca = { x: cx, y: cy };
}
function quadraBloco(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'yard');
  addBuilding(R.x0 + 30, R.y0 + 30, R.x1 - 30, R.y0 + 230, 34, { style: 'warehouse', roofType: 'corrugated', roofColor: '#2a6a3a', wall: '#f2f2ea', lit: 0.6, sign: 'G.R.E.S. UNIDOS DA GAMBIARRA', signColor: '#5be38f', front: 'S' });
  addLight((R.x0 + R.x1) / 2, R.y0 + 250, 200, 0.9, 'green', { shop: true });
  addFlags(R.x0 + 30, R.y0 + 270, R.x1 - 30, R.y0 + 270, true);
  World.animalsDef.push({ type: 'person', n: 12, rect: [R.x0 + 30, R.y0 + 240, R.x1 - 30, R.y0 + 300], look: { dance: true } });
  comunidadeBlock({ x0: R.x0, y0: R.y0 + 320, x1: R.x1, y1: R.y1 });
}
function batalhaoBlock(R) {
  decal(R.x0, R.y0, R.x1, R.y1, 'concrete');
  const wc = '#e2e2dc', gy = (R.y0 + R.y1) / 2;
  addWall(R.x0, R.y0, R.x1, R.y0 + 5, wc); addWall(R.x0, R.y1 - 5, R.x1, R.y1, wc); addWall(R.x1 - 5, R.y0 + 5, R.x1, R.y1 - 5, wc);
  addWall(R.x0, R.y0 + 5, R.x0 + 5, gy - 40, wc); addWall(R.x0, gy + 40, R.x0 + 5, R.y1 - 5, wc);
  const b = addBuilding(R.x0 + 120, R.y0 + 40, R.x1 - 40, R.y0 + 220, 40, { style: 'office', roofType: 'flat', roofColor: '#5a6470', wall: '#f2f2ea', lit: 0.7, sign: 'BATALHÃO DA PM', signColor: '#59a8ff', front: 'W' });
  addBuilding(R.x0 + 16, gy - 70, R.x0 + 46, gy - 44, 18, { style: 'kiosk', roofType: 'flat', roofColor: '#1d4f9c', wall: '#f2f2ea', lit: 1 });
  for (let i = 0; i < 4; i++) addParkedCar(R.x0 + 150 + i * 40, R.y1 - 70, -Math.PI / 2, 'police', '#f2f2ee');
  addProp('flagES', R.x0 + 80, R.y0 + 40, { col: 'circ', cr: 3 }); addProp('flagES', R.x0 + 80, R.y0 + 80, { col: 'circ', cr: 3 });
  for (const [x, y] of [[R.x0 + 90, gy], [R.x1 - 60, R.y1 - 120]]) addLamp(x, y, x, y, 'white', { style: 'pole', h: 64, r: 220 });
  addShop({ kind: 'batalhao', name: 'Batalhão da PM', x: XS[6] + RT.street.lanes[0], y: gy, bld: b, color: '#59a8ff', region: 'carapina' });
  World.batalhao = { x: (R.x0 + R.x1) / 2, y: gy };
}
function buildSerra() {
  const special = { '1,1': 'praca', '4,2': 'campo', '5,1': 'bloco', '6,0': 'batalhao' };
  for (let c = 0; c < 7; c++) for (let r = 0; r < 4; r++) {
    const R = serraRect(c, r), k = c + ',' + r, roads = serraRoads(c, r);
    const region = c < 3 ? 'feurosa' : 'carapina';
    const sp = special[k];
    if (sp === 'praca') pracaBagunca(R);
    else if (sp === 'campo') soccerBlock(R);
    else if (sp === 'bloco') quadraBloco(R);
    else if (sp === 'batalhao') batalhaoBlock(R);
    else if (k === '2,2') residentialBlock(R, { rich: false, roads, region, special: { side: 'N', w: 150, build: shopLotBuilder({ kind: 'mercado', name: 'Mercadinho do Morro', sign: 'MERCADINHO DO MORRO', color: '#ff7a3d', h: 30, depth: 100, pickup: true, items: ['Feira da semana', 'Gás de cozinha', 'Fardo de refrigerante'] }) } });
    else if (k === '5,2') residentialBlock(R, { rich: false, roads, region, special: { side: 'N', w: 150, build: shopLotBuilder({ kind: 'lanchonete', name: 'Pastelaria Feira Livre', sign: 'PASTEL & CALDO DE CANA', color: '#ff4f8a', h: 30, depth: 96, pickup: true, items: ['Pastel de palmito', 'Caldo de cana', 'Pastel de queijo'], tables: true }) } });
    else if (r === 0 || (c + r) % 3 === 0) residentialBlock(R, { rich: false, roads, region });
    else comunidadeBlock(R);
  }
}
function buildDepots() {
  const dep = (key, c, r, name, sign, color, extra) => {
    const R = cellRect(c, r);
    const bx0 = R.x0 + 26, by0 = R.y1 - 104, bx1 = R.x0 + 170, by1 = R.y1 - 44;
    if (!areaBlocked(bx0, by0, bx1, by1)) addBuilding(bx0, by0, bx1, by1, 24, { style: 'shop', roofType: 'flat', roofColor: '#5a5c60', wall: '#e8e2d0', lit: 0.9, sign, signColor: color, front: 'W' });
    if (extra) extra(R);
    const y = R.y1 - 74;
    World.depots[key] = { x: XS[c] + RT.street.lanes[0], y, name };
    addLight(R.x0 + 10, y, 120, 0.9, color, { shop: true });
  };
  dep('bau', 6, 0, 'Transportadora Leva-e-Traz', 'TRANSPORTADORA', '#ffb547');
  dep('gas', 6, 2, 'Depósito de Gás Chama Azul', 'GÁS CHAMA AZUL', '#59a8ff', (R) => { for (let i = 0; i < 6; i++) addProp('pot', R.x0 + 190 + i * 13, R.y1 - 60, { col: 'circ', cr: 5, R: 10 }); });
  dep('fuel', 6, 3, 'Base de Combustível', 'BASE DE COMBUSTÍVEL', '#ff8a2a', (R) => { for (let i = 0; i < 2; i++) { const t = { kind: 'silo', x: R.x0 + 220 + i * 70, y: R.y1 - 70, r: 26, h: 50 }; if (!areaBlocked(t.x - 26, t.y - 26, t.x + 26, t.y + 26)) { addTall(t, t.x - 30, t.y - 30, t.x + 30, t.y + 30); addCircCol(t.x, t.y, 26, 'bld'); } } });
  // aterro no interior
  decal(6700, 5000, 7300, 5250, 'earth', { z: 1.3 });
  for (let i = 0; i < 9; i++) addProp('mound', 6760 + (i % 5) * 110, 5060 + Math.floor(i / 5) * 90, { R: 50 });
  World.depots.aterro = { x: 7000, y: 5300 - RT.dirt.lanes[0], name: 'Aterro do Fim do Mundo' };
}
function buildRachas() {
  const R = (id, name, rival, rt, bet, pts) => {
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    World.rachas.push({ id, name, rival, bet, start: pts[0], pts: pts.slice(1), all: pts, len, rivalTime: len / rt, a0: Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]), racha: true });
  };
  const hy = HWY_Y + RT.highway.lanes[0], cy = 7500 + RT.avenue.lanes[0], ay = 1500 + RT.avenue.lanes[0];
  R('arrancada', 'Arrancada na BR-101', 'Zé do Canecão', 330, 300, [[1500, hy], [3900, hy]]);
  R('carapina', 'Pega na Avenida Carapina', 'Juninho Rebaixado', 340, 600, [[400, cy], [4500, cy]]);
  R('centrao', 'Racha do Centrão', 'Bia Turbo', 260, 1000, [[400, ay], [2100 - 25, ay], [2100 - 25, 3880 - 25], [400 + 25, 3880 - 25]]);
}
function buildActivitiesData() {
  markReflections();
  buildDepots();
  buildRachas();
  buildCapixaba();
  buildFesta();
  const P = (id, name, x, y, desc) => World.pois.push({ id, name, x, y, r: 170, desc });
  P('praca', 'Praça da Matriz', 1756, 1260, 'O coração do Centrão, com a fonte, a igreja e o pipoqueiro.');
  P('campo', 'Campo do Várzea F.C.', 575, 3570, 'Onde o futebol de domingo vira lenda.');
  P('ponte', 'Ponte Que Balança', riverCX(3880), 3880, 'Ponte de madeira centenária sobre o Rio Jucu.');
  P('mirante', 'Mirante do Jucu', World.mirante.x, World.mirante.y, 'A melhor vista do rio à noite.');
  P('fazenda', 'Fazenda Muuuito Longe', 8075, 4380, 'Casarão antigo cercado de palmeiras.');
  P('sitio', 'Sítio Bota Fé', 7970, 1050, 'Galinhas, horta e café passado na hora.');
  P('estrela', 'Posto Estrela Cadente', 1730, 5990, 'Parada obrigatória de caminhoneiros.');
  P('cafezal', 'Cafezal do Conilon', 8100, 2420, 'Fileiras de café até onde a vista alcança.');
  P('acude', 'Açude dos Sapos', 6900, 4590, 'Água parada, sapos e capivaras.');
  P('caixa', "Caixa d'Água", 3650, 2520, 'O ponto mais alto da cidade.');
  P('orla', 'Orla do Rio', 4720, 4300, 'Calçadão de pedras portuguesas à beira-rio.');
  P('milharal', 'Milharal do Espantalho', 6900, 900, 'Um espantalho vigia o milho no escuro.');
  P('escola', 'Escola Estadual', 2420, 4900, 'A quadra iluminada da escola do bairro.');
  P('convento', 'Convento da Pinha', 8100, 600, 'Lá do alto dá pra ver São Gambiarra inteira. Romaria em abril.');
  P('ponte3', 'Terceira Ponte e Meia', riverCX(1500), 1500, 'Concreto, vento forte e vista do Rio Jucu.');
  P('paneleiras', 'Galpão das Paneleiras', 4830, 3275, 'Panelas de barro feitas à mão, do jeitinho capixaba.');
  P('feira', 'Feira da Roça', 860, 5830, 'Pastel, caldo de cana e banana a preço de domingo.');
  P('batalhao', 'Batalhão da PM', World.batalhao.x, World.batalhao.y, 'Viaturas na garagem e plantão a noite inteira.');
  P('bagunca', 'Praça da Bagunça', World.pracaBagunca.x, World.pracaBagunca.y, 'Pagode de domingo, espetinho e pelada na quadra até tarde.');
  P('campao', 'Campão de Carapina', (serraRect(4, 2).x0 + serraRect(4, 2).x1) / 2, (serraRect(4, 2).y0 + serraRect(4, 2).y1) / 2, 'O terrão onde nasce craque toda semana.');
  P('bloco', 'Quadra da Unidos da Gambiarra', (serraRect(5, 1).x0 + serraRect(5, 1).x1) / 2, serraRect(5, 1).y0 + 200, 'Ensaio da escola de samba às sextas.');
  P('rodeio', 'Churrascaria Boi na Brasa', 2840, 5900, 'Picanha na brasa até de madrugada.');
  const R = (id, name, desc, pts) => {
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    World.races.push({ id, name, desc, start: pts[0], pts: pts.slice(1), len, gold: len / 270, silver: len / 220, bronze: len / 170, a0: Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) });
  };
  R('centro', 'Volta no Centrão', 'Ruas apertadas, semáforos e esquinas do Centro.', [[1720, 2080 + 19], [2700, 2099], [2719, 880], [850, 861], [831, 2080], [1450, 2099], [2081, 2099]]);
  R('fazenda', 'Rali da Vaca Atolada', 'Terra, poeira e curvas entre o cafezal e a fazenda.', [[6319, 2300], [6319, 3880], [7500, 3895], [7515, 1500], [8700, 1519], [8719, 3880], [8719, 4900]]);
  R('rodovia', 'Corujão na BR-101', 'Reta longa, caminhões e a ponte sobre o Rio Jucu.', [[700, 6200 + 21], [2100, 6221], [4600, 6221], [6300, 6221], [8681, 6221], [8681, 4600]]);
}

/* ---------- superfícies de rua (raster físico + itens de bake) ---------- */
function buildRoadSurface() {
  for (const e of World.edges) {
    const T = e.T;
    const box = edgeBox(e, 0);
    if (T.sw) gFill(box[0], box[1], box[2], box[3], SF.SIDEWALK);
    const inner = e.h ? [e.a.x - 2, e.a.y - e.hw, e.b.x + 2, e.a.y + e.hw] : [e.a.x - e.hw, e.a.y - 2, e.a.x + e.hw, e.b.y + 2];
    if (T.shoulder) {
      const s = T.shoulder;
      if (e.h) gFill(e.a.x, e.a.y - e.hw - s, e.b.x, e.a.y + e.hw + s, SF.EARTH); else gFill(e.a.x - e.hw - s, e.a.y, e.a.x + e.hw + s, e.b.y, SF.EARTH);
    }
    gFill(inner[0], inner[1], inner[2], inner[3], T.asphalt ? SF.ROAD : SF.DIRT);
    if (e.bridge) {
      const b = e.bridge;
      const band = e.hw + (T.sw || 0) + (T.shoulder || 0) + 10;
      for (let gy = Math.floor((e.a.y - band) / GC); gy <= Math.floor((e.a.y + band) / GC); gy++) {
        const yy = gy * GC + 5, rc = riverCX(yy), rh = riverHW(yy);
        for (let gx = Math.floor(b.x0 / GC); gx <= Math.floor(b.x1 / GC); gx++) {
          const xx = gx * GC + 5;
          if (Math.abs(xx - rc) >= rh) continue;
          ground[gy * GW + gx] = Math.abs(yy - e.a.y) < e.hw ? SF.BRIDGE : SF.WATER;
        }
      }
      addRectCol(b.x0, e.a.y - e.hw - 7, b.x1, e.a.y - e.hw - 1, 'rail');
      addRectCol(b.x0, e.a.y + e.hw + 1, b.x1, e.a.y + e.hw + 7, 'rail');
    }
    bake(box[0] - 8, box[1] - 8, box[2] + 8, box[3] + 8, 3, (g) => drawEdgeBase(g, e));
    bake(box[0], box[1], box[2], box[3], 5, (g) => drawEdgeMarkings(g, e));
    if (e.bridge) bake(e.bridge.x0 - 10, box[1] - 30, e.bridge.x1 + 10, box[3] + 40, 5.2, (g) => drawBridge(g, e));
  }
  for (const n of World.nodes) {
    let hv = 0, hh = 0, sw = 0, asph = false;
    for (const e of n.edges) { if (e.h) hh = Math.max(hh, e.hw); else hv = Math.max(hv, e.hw); sw = Math.max(sw, e.T.sw || 0); if (e.T.asphalt) asph = true; }
    if (!hv) hv = hh; if (!hh) hh = hv;
    n.hx = hv; n.hy = hh;
    gFill(n.x - hv, n.y - hh, n.x + hv, n.y + hh, asph ? SF.ROAD : SF.DIRT);
    bake(n.x - hv - sw - 6, n.y - hh - sw - 6, n.x + hv + sw + 6, n.y + hh + sw + 6, 4, (g) => drawNode(g, n, asph));
  }
}
/* ============================ TEXTURAS ============================ */
const PSRC = {};
function tex(size, base, fn) {
  const c = makeCanvas(size, size), g = c.getContext('2d');
  const R = mulberry32((size * 7919 + base.length * 131 + base.charCodeAt(1) * 17) | 0);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  fn(g, size, R);
  return c;
}
function speck(g, s, R, n, cols, rmin, rmax) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = cols[(R() * cols.length) | 0];
    const r = rmin + R() * (rmax - rmin);
    g.fillRect(R() * s, R() * s, r, r);
  }
}
function buildPatterns() {
  PSRC.grass = tex(128, '#33502a', (g, s, R) => {
    speck(g, s, R, 900, ['#2b4523', '#3b5c30', '#44683a', '#283f21', '#4a6b35'], 1, 2.4);
    g.strokeStyle = 'rgba(80,120,60,0.35)'; g.lineWidth = 1;
    for (let i = 0; i < 120; i++) { const x = R() * s, y = R() * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R() * 3 - 1.5, y - 3 - R() * 3); g.stroke(); }
  });
  PSRC.lawn = tex(128, '#3b5f30', (g, s, R) => speck(g, s, R, 800, ['#34552b', '#43693a', '#4a7340', '#30502a'], 1, 2));
  PSRC.lawn2 = tex(64, '#456e38', (g, s, R) => {
    g.fillStyle = 'rgba(0,0,0,0.07)'; g.fillRect(0, 0, s, s / 2);
    speck(g, s, R, 300, ['#3d6432', '#4f7a42', '#527d45'], 1, 2);
  });
  PSRC.pasture = tex(128, '#3a5a2c', (g, s, R) => {
    speck(g, s, R, 700, ['#33512a', '#45693a', '#4e733a', '#5d7a3a', '#2c4724'], 1, 2.5);
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(30,50,20,0.35)'; g.beginPath(); g.arc(R() * s, R() * s, 3 + R() * 5, 0, TAU); g.fill(); }
  });
  PSRC.asphalt = tex(128, '#33353b', (g, s, R) => speck(g, s, R, 1500, ['#2b2d32', '#3b3e44', '#43464d', '#2f3136', '#4b4d52'], 1, 1.8));
  // bloquete de concreto (paver), muito usado nas ruas de bairro da Grande Vitória e da Serra
  PSRC.bloquete = tex(64, '#5f5e5a', (g, s, R) => {
    for (let y = 0; y < s; y += 6) for (let x = ((y / 6) % 2) * 6 - 6; x < s; x += 12) {
      const t = R(); g.fillStyle = t < 0.3 ? '#77756f' : t < 0.6 ? '#6e6c66' : t < 0.85 ? '#81807a' : '#68665f';
      g.fillRect(x + 0.6, y + 0.6, 10.8, 4.8);
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x + 0.6, y + 0.6, 10.8, 1);
    }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(30,30,28,0.25)'; g.fillRect(R() * s, R() * s, 1.5, 1.5); }
  });
  // pedra portuguesa em ondas (calçadão), preto e branco
  PSRC.portuguesa = tex(128, '#d9d5ca', (g, s, R) => {
    for (let y = 0; y < s; y += 2.6) for (let x = 0; x < s; x += 2.6) {
      const w = s / 2 + Math.sin(x / s * TAU) * 22, w2 = Math.sin((x / s) * TAU) * 22;
      const d = Math.min(Math.abs(y - w), Math.abs(y - (w2 + 6)), Math.abs(y - (w2 + 6 + s)));
      const dark = d < 7;
      const t = R();
      g.fillStyle = dark ? (t < 0.5 ? '#2b2b2c' : '#3a3a3b') : (t < 0.5 ? '#dcd8cd' : '#cfcabd');
      g.fillRect(x + 0.3, y + 0.3, 2.1, 2.1);
    }
  });
  PSRC.paved = tex(128, '#3b3d42', (g, s, R) => speck(g, s, R, 1200, ['#34363b', '#45474d', '#4d4f55', '#303237'], 1, 1.8));
  PSRC.sidewalk = tex(64, '#8b8a84', (g, s, R) => {
    speck(g, s, R, 300, ['#83827c', '#93928b', '#7d7c76'], 1, 2);
    g.fillStyle = '#76756f';
    for (let i = 0; i < s; i += 16) { g.fillRect(i, 0, 1, s); g.fillRect(0, i, s, 1); }
  });
  // barro vermelho do interior capixaba, com cascalho
  PSRC.dirt = tex(128, '#8a5a3c', (g, s, R) => {
    speck(g, s, R, 1100, ['#7c4f34', '#956345', '#a06e4c', '#6e462f', '#ab7a56', '#83563a'], 1, 3);
    for (let i = 0; i < 70; i++) { g.fillStyle = R() < 0.5 ? 'rgba(190,170,140,0.55)' : 'rgba(120,110,100,0.5)'; g.beginPath(); g.arc(R() * s, R() * s, 0.8 + R() * 1.4, 0, TAU); g.fill(); }
  });
  PSRC.earth = tex(128, '#6b523a', (g, s, R) => speck(g, s, R, 900, ['#5e4833', '#7a5f44', '#836649', '#574230'], 1, 3));
  PSRC.soil = tex(128, '#4f3a29', (g, s, R) => speck(g, s, R, 900, ['#453223', '#5c4530', '#3e2d20', '#634b35'], 1, 2.5));
  PSRC.sand = tex(128, '#b19c70', (g, s, R) => speck(g, s, R, 900, ['#a69066', '#bda97c', '#9b865d', '#c4b186'], 1, 2));
  PSRC.gravel = tex(128, '#67625a', (g, s, R) => speck(g, s, R, 1500, ['#5a564f', '#77726a', '#827c73', '#4f4b45', '#8d877d'], 1, 2.6));
  PSRC.urban = tex(128, '#57554f', (g, s, R) => speck(g, s, R, 1000, ['#4f4d48', '#605e58', '#68655f', '#4a4843'], 1, 2));
  PSRC.concrete = tex(128, '#8c8b86', (g, s, R) => {
    speck(g, s, R, 700, ['#84837e', '#95948f', '#7e7d78'], 1, 2);
    g.fillStyle = '#74736e'; g.fillRect(0, 0, s, 1.5); g.fillRect(0, 0, 1.5, s); g.fillRect(0, s / 2, s, 1); g.fillRect(s / 2, 0, 1, s);
    for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(40,35,30,0.12)'; g.beginPath(); g.ellipse(R() * s, R() * s, 5 + R() * 8, 3 + R() * 5, R() * 3, 0, TAU); g.fill(); }
  });
  PSRC.yard = tex(64, '#96938a', (g, s, R) => {
    speck(g, s, R, 300, ['#8c8980', '#a09d94', '#86837a'], 1, 2);
    g.fillStyle = '#807d75'; g.fillRect(0, 0, s, 1); g.fillRect(0, 0, 1, s);
  });
  PSRC.plaza = tex(128, '#b9b2a4', (g, s) => {
    g.fillStyle = '#57524b';
    for (let k = 0; k < 4; k++) {
      const y0 = k * 32;
      g.beginPath();
      for (let x = 0; x <= s; x += 2) { const y = y0 + 9 * Math.sin((x / s) * TAU * 2); if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      for (let x = s; x >= 0; x -= 2) { const y = y0 + 11 + 9 * Math.sin((x / s) * TAU * 2); g.lineTo(x, y); }
      g.closePath(); g.fill();
    }
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let x = 0; x < s; x += 6) for (let y = 0; y < s; y += 6) if ((x * 7 + y * 3) % 5 === 0) g.fillRect(x, y, 1, 1);
  });
  PSRC.water = tex(256, '#143247', (g, s, R) => {
    g.strokeStyle = 'rgba(120,170,200,0.16)'; g.lineWidth = 1.2;
    for (let i = 0; i < 70; i++) { const x = R() * s, y = R() * s, w = 6 + R() * 18; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 2, x + w, y); g.stroke(); }
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 30; i++) { g.beginPath(); g.ellipse(R() * s, R() * s, 10 + R() * 20, 3 + R() * 6, 0, 0, TAU); g.fill(); }
  });
  PSRC.forest = tex(256, '#11240f', (g, s, R) => {
    const cols = ['#173219', '#1d3c1c', '#244621', '#2a5226', '#1a361a'];
    for (let i = 0; i < 95; i++) {
      const x = R() * s, y = R() * s, r = 9 + R() * 18, c = cols[(R() * cols.length) | 0];
      for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) {
        if (x + ox + r < 0 || x + ox - r > s || y + oy + r < 0 || y + oy - r > s) continue;
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(x + ox + 3, y + oy + 4, r, 0, TAU); g.fill();
        g.fillStyle = c; g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill();
        g.fillStyle = 'rgba(120,170,90,0.12)'; g.beginPath(); g.arc(x + ox - r * 0.3, y + oy - r * 0.3, r * 0.5, 0, TAU); g.fill();
      }
    }
  });
}
function pat(g, name) {
  if (!g._pats) g._pats = {};
  let p = g._pats[name];
  if (!p) { p = g.createPattern(PSRC[name], 'repeat'); g._pats[name] = p; }
  return p;
}
let CHUNK_BOX = { x0: 0, y0: 0, x1: 0, y1: 0 };

/* ============================ DECALQUES ============================ */
function drawDecal(g, d) {
  const { x0, y0, x1, y1 } = d, w = x1 - x0, h = y1 - y0;
  const R = mulberry32(d.seed);
  const ix0 = Math.max(x0, CHUNK_BOX.x0 - 20), ix1 = Math.min(x1, CHUNK_BOX.x1 + 20);
  const iy0 = Math.max(y0, CHUNK_BOX.y0 - 20), iy1 = Math.min(y1, CHUNK_BOX.y1 + 20);
  switch (d.type) {
    case 'lawn': case 'lawn2': case 'pasture': case 'urban': case 'paved': case 'gravel': case 'earth': case 'sand': case 'plaza': case 'concrete': case 'yard':
      g.fillStyle = pat(g, d.type); g.fillRect(x0, y0, w, h);
      if (d.type === 'yard' || d.type === 'concrete') { g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1; g.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1); }
      if (d.type === 'paved') {
        g.fillStyle = 'rgba(0,0,0,0.12)';
        for (let i = 0; i < w * h / 9000; i++) { g.beginPath(); g.ellipse(x0 + R() * w, y0 + R() * h, 4 + R() * 9, 3 + R() * 5, R() * 3, 0, TAU); g.fill(); }
      }
      break;
    case 'drive':
      g.fillStyle = pat(g, 'yard'); g.fillRect(x0, y0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.12)';
      if (w < h) { g.fillRect(x0 + w * 0.2, y0, w * 0.15, h); g.fillRect(x0 + w * 0.65, y0, w * 0.15, h); }
      else { g.fillRect(x0, y0 + h * 0.2, w, h * 0.15); g.fillRect(x0, y0 + h * 0.65, w, h * 0.15); }
      break;
    case 'pool': {
      g.fillStyle = '#d9d4c6'; g.fillRect(x0 - 3, y0 - 3, w + 6, h + 6);
      const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#3fb6d8'); gr.addColorStop(1, '#1d7aa0');
      g.fillStyle = gr; g.fillRect(x0, y0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
      for (let i = 0; i < 4; i++) { const yy = y0 + 4 + R() * (h - 8); g.beginPath(); g.moveTo(x0 + 3, yy); g.quadraticCurveTo(x0 + w / 2, yy + 3, x1 - 3, yy); g.stroke(); }
      break;
    }
    case 'hill': {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = w / 2, ry = h / 2;
      const cols = ['#2f4a26', '#34532b', '#3b5c30', '#426634', '#4a7038'];
      for (let i = 0; i < 5; i++) {
        const k = 1 - i * 0.18;
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(cx + 6, cy + 8, rx * k, ry * k, 0, 0, TAU); g.fill();
        g.fillStyle = cols[i]; g.beginPath(); g.ellipse(cx, cy, rx * k, ry * k, 0, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(20,35,15,0.35)'; g.lineWidth = 1.2; g.stroke();
      }
      g.strokeStyle = 'rgba(140,110,70,0.85)'; g.lineWidth = 7; g.beginPath();
      for (let t = 0; t <= 1.001; t += 0.02) { const a = t * TAU * 1.15 + Math.PI * 0.5, k = 0.95 - t * 0.7; const px = cx + Math.cos(a) * rx * k, py = cy + Math.sin(a) * ry * k; if (t === 0) g.moveTo(px, py); else g.lineTo(px, py); }
      g.stroke();
      break;
    }
    case 'court':
      g.fillStyle = '#2f6a5a'; g.fillRect(x0, y0, w, h);
      g.fillStyle = '#3a5a8a'; g.fillRect(x0 + 10, y0 + 10, w - 20, h - 20);
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2; g.strokeRect(x0 + 10, y0 + 10, w - 20, h - 20);
      g.beginPath(); g.moveTo(x0 + w / 2, y0 + 10); g.lineTo(x0 + w / 2, y1 - 10); g.stroke();
      g.beginPath(); g.arc(x0 + w / 2, y0 + h / 2, Math.min(w, h) * 0.12, 0, TAU); g.stroke();
      break;
    case 'soccer': {
      g.fillStyle = pat(g, 'earth'); g.fillRect(x0, y0, w, h);
      g.fillStyle = 'rgba(70,110,50,0.55)';
      for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(x0 + R() * w, y0 + (R() < 0.5 ? R() * h * 0.25 : h - R() * h * 0.25), 6 + R() * 22, 4 + R() * 10, R() * 3, 0, TAU); g.fill(); }
      for (let i = 0; i < 20; i++) { g.beginPath(); g.ellipse(x0 + (R() < 0.5 ? R() * w * 0.2 : w - R() * w * 0.2), y0 + R() * h, 5 + R() * 14, 4 + R() * 8, R() * 3, 0, TAU); g.fill(); }
      g.strokeStyle = 'rgba(240,240,230,0.7)'; g.lineWidth = 2.5;
      const m = 10;
      g.strokeRect(x0 + m, y0 + m, w - 2 * m, h - 2 * m);
      g.beginPath(); g.moveTo(x0 + m, y0 + h / 2); g.lineTo(x1 - m, y0 + h / 2); g.stroke();
      g.beginPath(); g.arc(x0 + w / 2, y0 + h / 2, 42, 0, TAU); g.stroke();
      g.strokeRect(x0 + w / 2 - 70, y0 + m, 140, 60); g.strokeRect(x0 + w / 2 - 70, y1 - m - 60, 140, 60);
      g.strokeRect(x0 + w / 2 - 32, y0 + m, 64, 22); g.strokeRect(x0 + w / 2 - 32, y1 - m - 22, 64, 22);
      break;
    }
    case 'forest': {
      g.fillStyle = pat(g, 'forest');
      g.beginPath();
      const step = 24;
      g.moveTo(x0 + 10, y0 + 10);
      for (let x = x0 + 10; x <= x1 - 10; x += step) g.lineTo(x, y0 + 4 + hash2(x | 0, y0 | 0) * 14);
      for (let y = y0 + 10; y <= y1 - 10; y += step) g.lineTo(x1 - 4 - hash2(x1 | 0, y | 0) * 14, y);
      for (let x = x1 - 10; x >= x0 + 10; x -= step) g.lineTo(x, y1 - 4 - hash2(x | 0, y1 | 0) * 14);
      for (let y = y1 - 10; y >= y0 + 10; y -= step) g.lineTo(x0 + 4 + hash2(x0 | 0, y | 0) * 14, y);
      g.closePath();
      g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 0; g.shadowOffsetX = 6; g.shadowOffsetY = 8; g.fill(); g.restore();
      g.fill();
      break;
    }
    case 'corn': case 'cane': case 'soy': case 'coffee': case 'garden': {
      g.fillStyle = pat(g, 'soil'); g.fillRect(x0, y0, w, h);
      if (d.type === 'corn') {
        const sp = 12;
        for (let y = y0 + 6 + Math.max(0, Math.floor((iy0 - y0) / sp)) * sp; y < iy1; y += sp) {
          for (let x = Math.max(x0 + 4, ix0); x < ix1 - 2; x += 5) {
            const r = hash2(x | 0, y | 0);
            g.fillStyle = r < 0.3 ? '#3f6a26' : r < 0.7 ? '#4f7d2e' : '#5d8a34';
            g.fillRect(x, y - 3 - r * 2, 4, 5 + r * 3);
            if (r > 0.93) { g.fillStyle = '#c8b04a'; g.fillRect(x + 1, y - 2, 2, 2); }
          }
        }
      } else if (d.type === 'cane') {
        const sp = 9;
        for (let y = y0 + 4 + Math.max(0, Math.floor((iy0 - y0) / sp)) * sp; y < iy1; y += sp) {
          g.fillStyle = '#41692a'; g.fillRect(ix0, y - 3, ix1 - ix0, 7);
          g.fillStyle = '#5a8a36';
          for (let x = ix0; x < ix1; x += 7) { const r = hash2(x | 0, y | 0); g.fillRect(x, y - 3 + r * 3, 5, 1.5); }
          g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(ix0, y + 4, ix1 - ix0, 2);
        }
      } else if (d.type === 'soy') {
        const sp = 10;
        for (let y = y0 + 5 + Math.max(0, Math.floor((iy0 - y0) / sp)) * sp; y < iy1; y += sp) {
          for (let x = ix0; x < ix1; x += 6) {
            const r = hash2(x | 0, y | 0);
            g.fillStyle = r < 0.5 ? '#5f8a3a' : '#719b45';
            g.beginPath(); g.arc(x, y, 2.4 + r, 0, TAU); g.fill();
          }
        }
      } else if (d.type === 'coffee') {
        const sp = 22;
        for (let y = y0 + 11 + Math.max(0, Math.floor((iy0 - y0) / sp)) * sp; y < iy1; y += sp) {
          for (let x = ix0; x < ix1; x += 11) {
            const r = hash2(x | 0, y | 0);
            g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(x + 2, y + 3, 7, 0, TAU); g.fill();
            g.fillStyle = r < 0.5 ? '#1f4420' : '#26502a'; g.beginPath(); g.arc(x, y, 7 + r, 0, TAU); g.fill();
            g.fillStyle = '#33652f'; g.beginPath(); g.arc(x - 2, y - 2, 3.5, 0, TAU); g.fill();
            if (r > 0.55) { g.fillStyle = '#b8322a'; g.fillRect(x + 2, y + 1, 1.6, 1.6); g.fillRect(x - 3, y + 3, 1.6, 1.6); }
          }
        }
      } else {
        for (let y = y0 + 6; y < y1 - 6; y += 30) {
          g.fillStyle = '#3e2c1f'; g.fillRect(x0 + 6, y, w - 12, 22);
          for (let x = x0 + 12; x < x1 - 10; x += 10) { g.fillStyle = hash2(x | 0, y | 0) < 0.5 ? '#7db84a' : '#5f9a3a'; g.beginPath(); g.arc(x, y + 11, 4, 0, TAU); g.fill(); }
        }
      }
      break;
    }
  }
}
function drawStallLines(g, x0, y0, x1, y1, vert) {
  g.strokeStyle = 'rgba(235,235,225,0.6)'; g.lineWidth = 2; g.beginPath();
  if (vert) { for (let y = y0; y <= y1; y += 34) { g.moveTo(x0, y); g.lineTo(x0 + 64, y); } }
  else { for (let x = x0; x <= x1; x += 34) { g.moveTo(x, y0); g.lineTo(x, y0 + 64); } }
  g.stroke();
}

/* ============================ RUAS ============================ */
function edgeLocal(g, e) { g.save(); g.translate(e.a.x, e.a.y); if (!e.h) g.rotate(Math.PI / 2); }
// cara de rua capixaba: bloquete nos bairros, asfalto remendado nas avenidas,
// calçadão de pedra portuguesa no Centrão e meio-fio caiado de branco
const PAVER_REGIONS = { vila: 0.65, saopedro: 0.75, terravermelha: 0.75, feurosa: 0.7, carapina: 0.7, novarosa: 0.7, flexal: 0.7, jardim: 0.35, industrial: 0.3 };
function edgePave(e) {
  if (e.pave) return e.pave;
  if (!e.T.asphalt || e.T.id !== 'street' || e.bridge) return (e.pave = 'asphalt');
  const rk = regionKeyAt((e.a.x + e.b.x) / 2, (e.a.y + e.b.y) / 2);
  return (e.pave = hash2(e.id * 17 + 3, 91) < (PAVER_REGIONS[rk] || 0) ? 'bloquete' : 'asphalt');
}
function edgeWalk(e) {
  if (e.walkT) return e.walkT;
  const rk = regionKeyAt((e.a.x + e.b.x) / 2, (e.a.y + e.b.y) / 2);
  return (e.walkT = rk === 'centro' || (e.T.id === 'avenue' && (rk === 'jardim' || rk === 'vila')) ? 'portuguesa' : 'sidewalk');
}
const CURB_W = '#e6e3d6', CURB_Y = '#e0b83a';
function drawEdgeBase(g, e) {
  const T = e.T, L = e.len, hw = e.hw;
  edgeLocal(g, e);
  if (T.sw) {
    g.fillStyle = pat(g, edgeWalk(e));
    const s0 = e.perpA, s1 = L - e.perpB;
    g.fillRect(s0, -hw - T.sw, s1 - s0, T.sw); g.fillRect(s0, hw, s1 - s0, T.sw);
    // meio-fio caiado; amarelo perto das esquinas (proibido estacionar)
    g.fillStyle = CURB_W; g.fillRect(s0, -hw - 2.5, s1 - s0, 2.5); g.fillRect(s0, hw, s1 - s0, 2.5);
    g.fillStyle = CURB_Y; for (const [a, b] of [[s0, s0 + 36], [s1 - 36, s1]]) if (b > a) { g.fillRect(a, -hw - 2.5, b - a, 2.5); g.fillRect(a, hw, b - a, 2.5); }
    g.fillStyle = 'rgba(0,0,0,0.18)'; for (let s = s0 + 8; s < s1; s += 9) { g.fillRect(s, -hw - 2.5, 0.8, 2.5); g.fillRect(s, hw, 0.8, 2.5); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(s0, -hw - T.sw, s1 - s0, 1.5); g.fillRect(s0, hw + T.sw - 1.5, s1 - s0, 1.5);
  }
  if (T.shoulder) {
    g.fillStyle = pat(g, 'gravel');
    g.fillRect(0, -hw - T.shoulder, L, T.shoulder); g.fillRect(0, hw, L, T.shoulder);
  }
  if (T.asphalt && edgePave(e) === 'bloquete') {
    g.fillStyle = pat(g, 'bloquete'); g.fillRect(0, -hw, L, hw * 2);
    const R = mulberry32(e.id * 977 + 13);
    // trilhas de pneu escurecidas, manchas de óleo e bloquetes afundados/remendados com cimento
    g.fillStyle = 'rgba(25,25,28,0.16)'; for (const y of [-hw * 0.55, -hw * 0.3, hw * 0.3, hw * 0.55]) g.fillRect(0, y - 3, L, 6);
    for (let i = 0; i < L / 120; i++) { g.fillStyle = 'rgba(15,15,18,0.28)'; g.beginPath(); g.ellipse(R() * L, (R() - 0.5) * hw * 1.4, 4 + R() * 6, 3 + R() * 4, 0, 0, TAU); g.fill(); }
    for (let i = 0; i < L / 300; i++) { g.fillStyle = R() < 0.5 ? 'rgba(150,148,140,0.75)' : 'rgba(40,40,42,0.45)'; g.fillRect(R() * L, (R() - 0.5) * hw * 1.5, 10 + R() * 18, 6 + R() * 10); }
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, -hw, L, 3); g.fillRect(0, hw - 3, L, 3);
  } else if (T.asphalt) {
    g.fillStyle = pat(g, 'asphalt'); g.fillRect(0, -hw, L, hw * 2);
    g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(0, -hw, L, 5); g.fillRect(0, hw - 5, L, 5);
    const R = mulberry32(e.id * 977 + 13);
    // remendos de asfalto (operação tapa-buraco) e desgaste nas trilhas de roda
    g.fillStyle = 'rgba(0,0,0,0.07)'; for (const y of [-hw * 0.6, -hw * 0.25, hw * 0.25, hw * 0.6]) g.fillRect(0, y - 3.5, L, 7);
    for (let i = 0; i < L / 180; i++) {
      const s = R() * L, y = (R() - 0.5) * hw * 1.5, w = 16 + R() * 34, h = 10 + R() * 16;
      g.fillStyle = R() < 0.55 ? '#25272b' : '#3f4146'; g.fillRect(s, y, w, h);
      g.strokeStyle = 'rgba(10,10,12,0.5)'; g.lineWidth = 1; g.strokeRect(s, y, w, h);
    }
    for (let i = 0; i < L / 260; i++) {
      const s = R() * L, y = (R() - 0.5) * hw * 1.6;
      g.fillStyle = R() < 0.5 ? 'rgba(20,20,24,0.35)' : 'rgba(80,80,85,0.25)';
      g.fillRect(s, y, 14 + R() * 30, 6 + R() * 12);
    }
    g.strokeStyle = 'rgba(15,15,18,0.45)'; g.lineWidth = 1;
    for (let i = 0; i < L / 320; i++) {
      let s = R() * L, y = (R() - 0.5) * hw * 1.7;
      g.beginPath(); g.moveTo(s, y);
      for (let k = 0; k < 5; k++) { s += 4 + R() * 7; y += (R() - 0.5) * 6; g.lineTo(s, y); }
      g.stroke();
    }
    for (let i = 0; i < L / 500; i++) {
      const s = e.perpA + 40 + R() * Math.max(10, L - e.perpA - e.perpB - 80), y = (R() < 0.5 ? -1 : 1) * hw * 0.5;
      g.fillStyle = '#26272b'; g.beginPath(); g.arc(s, y, 7, 0, TAU); g.fill();
      g.strokeStyle = '#55565c'; g.lineWidth = 1.5; g.stroke();
      g.strokeStyle = 'rgba(90,90,95,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(s - 4, y); g.lineTo(s + 4, y); g.moveTo(s, y - 4); g.lineTo(s, y + 4); g.stroke();
    }
  } else {
    g.fillStyle = pat(g, 'dirt');
    g.beginPath();
    g.moveTo(0, -hw);
    for (let s = 0; s <= L; s += 16) g.lineTo(s, -hw - 3 + hash2((e.id * 131 + s) | 0, 7) * 8);
    for (let s = L; s >= 0; s -= 16) g.lineTo(s, hw + 3 - hash2((e.id * 131 + s) | 0, 11) * 8);
    g.closePath(); g.fill();
    const R = mulberry32(e.id * 31 + 7);
    const wob = (s, k) => Math.sin(s * 0.013 + k) * 2.2 + Math.sin(s * 0.041 + k * 3) * 1.1;
    // capim invadindo as bordas
    g.fillStyle = 'rgba(70,96,44,0.45)';
    for (let s = 0; s < L; s += 10) { const w1 = 3 + hash2((e.id * 7 + s) | 0, 3) * 7, w2 = 3 + hash2((e.id * 7 + s) | 0, 5) * 7; g.fillRect(s, -hw - 2, 10, w1); g.fillRect(s, hw + 2 - w2, 10, w2); }
    // trilhas dos pneus: terra mais escura e compactada
    for (const y of [-25, -11, 11, 25]) {
      g.strokeStyle = 'rgba(70,40,24,0.38)'; g.lineWidth = 5.5; g.beginPath();
      for (let s = 0; s <= L; s += 24) { const yy = y + wob(s, y); if (s) g.lineTo(s, yy); else g.moveTo(s, yy); }
      g.stroke();
      g.strokeStyle = 'rgba(200,150,110,0.12)'; g.lineWidth = 1.2; g.stroke();
    }
    // faixa de capim no meio da estrada e entre as trilhas
    for (const y of [-18, 0, 18]) {
      for (let s = R() * 20; s < L; s += 6 + R() * 16) {
        if (R() < (y === 0 ? 0.35 : 0.6)) continue;
        g.fillStyle = R() < 0.5 ? 'rgba(84,112,50,0.75)' : 'rgba(104,128,60,0.7)';
        g.beginPath(); g.ellipse(s, y + wob(s, y) + (R() - 0.5) * 3, 2 + R() * 3, 1.2 + R() * 1.6, 0, 0, TAU); g.fill();
      }
    }
    // costela de vaca (ondulações) em alguns trechos
    for (let i = 0; i < L / 260; i++) {
      const s0 = R() * L, n = 6 + R() * 10;
      g.strokeStyle = 'rgba(60,34,20,0.18)'; g.lineWidth = 1.4; g.beginPath();
      for (let k = 0; k < n; k++) { const s = s0 + k * 6; g.moveTo(s, -hw + 8); g.lineTo(s + 1, hw - 8); }
      g.stroke();
    }
    // buracos e poças d'água
    for (let i = 0; i < L / 150; i++) {
      const s = R() * L, y = (R() < 0.5 ? -1 : 1) * (6 + R() * (hw - 14)), rx = 5 + R() * 9, ry = 3 + R() * 5;
      g.fillStyle = 'rgba(50,28,16,0.55)'; g.beginPath(); g.ellipse(s, y, rx + 2, ry + 1.5, R() * 0.6, 0, TAU); g.fill();
      if (R() < 0.6) { g.fillStyle = 'rgba(120,140,160,0.55)'; g.beginPath(); g.ellipse(s - 1, y - 0.5, rx * 0.75, ry * 0.65, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(220,230,240,0.35)'; g.fillRect(s - rx * 0.4, y - ry * 0.3, rx * 0.5, 1); }
    }
    // pedras soltas
    for (let i = 0; i < L / 18; i++) { g.fillStyle = R() < 0.5 ? 'rgba(170,160,145,0.8)' : 'rgba(110,100,92,0.8)'; g.fillRect(R() * L, (R() - 0.5) * hw * 1.8, 1.5 + R() * 1.5, 1.2 + R()); }
  }
  g.restore();
}
function drawEdgeMarkings(g, e) {
  const T = e.T;
  if (!T.asphalt) return;
  const blq = edgePave(e) === 'bloquete';
  const L = e.len, hw = e.hw;
  const pad = T.sw ? 26 : 6;
  const s0 = e.perpA ? e.perpA + pad : 0, s1 = e.perpB ? L - e.perpB - pad : L;
  if (s1 <= s0) return;
  edgeLocal(g, e);
  const yel = '#e3bf3f', wht = 'rgba(236,236,230,0.92)';
  if (blq) { /* rua de bloquete: sem faixa no meio */ }
  else if (T.center === 'dash') {
    g.fillStyle = yel;
    for (let s = s0; s < s1; s += 46) g.fillRect(s, -1.5, Math.min(24, s1 - s), 3);
  } else {
    g.fillStyle = yel; g.fillRect(s0, -4.5, s1 - s0, 2.5); g.fillRect(s0, 2, s1 - s0, 2.5);
  }
  if (T.laneDiv) {
    g.fillStyle = wht;
    for (let s = s0; s < s1; s += 42) { const l = Math.min(20, s1 - s); g.fillRect(s, -T.laneDiv - 1, l, 2.4); g.fillRect(s, T.laneDiv - 1.4, l, 2.4); }
  }
  if (T.edgeLine) { g.fillStyle = wht; g.fillRect(0, -hw + 3, L, 2.4); g.fillRect(0, hw - 5.4, L, 2.4); }
  if (T.sw) {
    for (const [atA, perp] of [[true, e.perpA], [false, e.perpB]]) {
      if (!perp) continue;
      const base = atA ? perp + 3 : L - perp - 19;
      g.fillStyle = 'rgba(236,236,230,0.85)';
      for (let y = -hw + 5; y < hw - 6; y += 10) g.fillRect(base, y, 16, 5.5);
      const sl = atA ? perp + 23 : L - perp - 26;
      if (atA) g.fillRect(sl, -hw + 2, 3, hw - 4); else g.fillRect(sl, 2, 3, hw - 4);
    }
  }
  g.restore();
}
function drawNode(g, n, asph) {
  const hv = n.hx, hh = n.hy;
  let sw = 0; for (const e of n.edges) sw = Math.max(sw, e.T.sw || 0);
  const dirs = { N: false, S: false, W: false, E: false };
  for (const e of n.edges) {
    if (e.h) { if (e.a === n) dirs.E = true; else dirs.W = true; }
    else { if (e.a === n) dirs.S = true; else dirs.N = true; }
  }
  const walkP = n.edges.some((e) => e.T.sw && edgeWalk(e) === 'portuguesa') ? 'portuguesa' : 'sidewalk';
  const blq = n.edges.length > 0 && n.edges.every((e) => edgePave(e) === 'bloquete');
  if (sw) {
    g.fillStyle = pat(g, walkP);
    g.fillRect(n.x - hv - sw, n.y - hh - sw, sw, sw); g.fillRect(n.x + hv, n.y - hh - sw, sw, sw);
    g.fillRect(n.x - hv - sw, n.y + hh, sw, sw); g.fillRect(n.x + hv, n.y + hh, sw, sw);
    if (!dirs.N) g.fillRect(n.x - hv, n.y - hh - sw, hv * 2, sw);
    if (!dirs.S) g.fillRect(n.x - hv, n.y + hh, hv * 2, sw);
    if (!dirs.W) g.fillRect(n.x - hv - sw, n.y - hh, sw, hh * 2);
    if (!dirs.E) g.fillRect(n.x + hv, n.y - hh, sw, hh * 2);
    g.fillStyle = CURB_Y;
    if (!dirs.N) g.fillRect(n.x - hv, n.y - hh - 2.5, hv * 2, 2.5);
    if (!dirs.S) g.fillRect(n.x - hv, n.y + hh, hv * 2, 2.5);
    if (!dirs.W) g.fillRect(n.x - hv - 2.5, n.y - hh, 2.5, hh * 2);
    if (!dirs.E) g.fillRect(n.x + hv, n.y - hh, 2.5, hh * 2);
  } else {
    let sh = 0; for (const e of n.edges) sh = Math.max(sh, e.T.shoulder || 0);
    if (sh) { g.fillStyle = pat(g, 'gravel'); g.fillRect(n.x - hv - sh, n.y - hh - sh, (hv + sh) * 2, (hh + sh) * 2); }
  }
  g.fillStyle = pat(g, asph ? (blq ? 'bloquete' : 'asphalt') : 'dirt');
  if (asph) g.fillRect(n.x - hv, n.y - hh, hv * 2, hh * 2);
  else { g.beginPath(); g.arc(n.x, n.y, Math.max(hv, hh) * 1.15, 0, TAU); g.fill(); g.fillRect(n.x - hv, n.y - hh, hv * 2, hh * 2); }
  if (asph && n.edges.length >= 3) {
    g.fillStyle = 'rgba(0,0,0,0.1)'; g.beginPath(); g.ellipse(n.x, n.y, hv * 0.7, hh * 0.7, 0, 0, TAU); g.fill();
  }
}
function drawBridge(g, e) {
  const b = e.bridge, hw = e.hw, y = e.a.y;
  const extra = (e.T.sw || 0) + (e.T.shoulder || 0) + 12;
  g.save();
  g.beginPath(); g.rect(b.x0 - 10, y - hw - extra, b.x1 - b.x0 + 20, extra - 6); g.rect(b.x0 - 10, y + hw + 6, b.x1 - b.x0 + 20, extra);
  g.clip();
  drawRiver(g, y - hw - extra - 20, y + hw + extra + 20);
  g.restore();
  // sombra do tabuleiro na água
  g.save();
  g.beginPath(); for (let yy = y + hw + 6; yy < y + hw + 40; yy += 8) { const cx = riverCX(yy), rh = riverHW(yy); g.rect(cx - rh, yy, rh * 2, 8); }
  g.clip();
  g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(b.x0, y + hw + 6, b.x1 - b.x0, 26);
  g.restore();
  if (b.wood) {
    for (let x = b.x0; x < b.x1; x += 7) {
      const r = hash2(x | 0, 3);
      g.fillStyle = r < 0.33 ? '#6e4a2c' : r < 0.66 ? '#7d5634' : '#634328';
      g.fillRect(x, y - hw, 6.2, hw * 2);
      if (r > 0.85) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x, y - hw + r * 20, 6.2, 4); }
    }
    g.fillStyle = '#4a321e'; g.fillRect(b.x0, y - hw - 6, b.x1 - b.x0, 6); g.fillRect(b.x0, y + hw, b.x1 - b.x0, 6);
    g.fillStyle = '#2e1f12';
    for (let x = b.x0; x < b.x1; x += 30) { g.fillRect(x, y - hw - 8, 6, 8); g.fillRect(x, y + hw, 6, 8); }
  } else {
    // tabuleiro um pouco mais claro, com transição suave para o asfalto da pista (sem corte seco)
    const fade = 46, gr = g.createLinearGradient(b.x0, 0, b.x1, 0), f = fade / (b.x1 - b.x0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(f, 'rgba(255,255,255,0.045)'); gr.addColorStop(1 - f, 'rgba(255,255,255,0.045)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(b.x0, y - hw, b.x1 - b.x0, hw * 2);
    // juntas de dilatação: perfil metálico nas duas cabeceiras e a cada vão
    for (const x of [b.x0 + fade, b.x1 - fade]) { g.fillStyle = '#1c1d20'; g.fillRect(x - 2, y - hw, 4, hw * 2); g.fillStyle = 'rgba(190,195,200,0.55)'; g.fillRect(x - 0.6, y - hw, 1.2, hw * 2); }
    g.fillStyle = 'rgba(0,0,0,0.3)';
    for (let x = b.x0 + fade + 110; x < b.x1 - fade - 20; x += 110) g.fillRect(x, y - hw, 2, hw * 2);
    g.fillStyle = '#b9b7ae'; g.fillRect(b.x0, y - hw - 7, b.x1 - b.x0, 6); g.fillRect(b.x0, y + hw + 1, b.x1 - b.x0, 6);
    g.fillStyle = '#8a8880';
    for (let x = b.x0; x < b.x1; x += 22) { g.fillRect(x, y - hw - 8, 4, 8); g.fillRect(x, y + hw, 4, 8); }
  }
}
function drawRiver(g, ya, yb) {
  const step = 16;
  const y0 = Math.floor(ya / step) * step - step, y1 = yb + step * 2;
  g.fillStyle = pat(g, 'sand');
  g.beginPath();
  for (let y = y0; y <= y1; y += step) { const x = riverCX(y) - riverHW(y) - 28 - hash2(y, 1) * 6; if (y === y0) g.moveTo(x, y); else g.lineTo(x, y); }
  for (let y = y1; y >= y0; y -= step) g.lineTo(riverCX(y) + riverHW(y) + 28 + hash2(y, 2) * 6, y);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(40,30,20,0.25)';
  g.beginPath();
  for (let y = y0; y <= y1; y += step) { const x = riverCX(y) - riverHW(y) - 6; if (y === y0) g.moveTo(x, y); else g.lineTo(x, y); }
  for (let y = y1; y >= y0; y -= step) g.lineTo(riverCX(y) + riverHW(y) + 6, y);
  g.closePath(); g.fill();
  g.fillStyle = pat(g, 'water');
  g.beginPath();
  for (let y = y0; y <= y1; y += step) { const x = riverCX(y) - riverHW(y); if (y === y0) g.moveTo(x, y); else g.lineTo(x, y); }
  for (let y = y1; y >= y0; y -= step) g.lineTo(riverCX(y) + riverHW(y), y);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(4,14,24,0.35)';
  g.beginPath();
  for (let y = y0; y <= y1; y += step) { const x = riverCX(y) - riverHW(y) * 0.55; if (y === y0) g.moveTo(x, y); else g.lineTo(x, y); }
  for (let y = y1; y >= y0; y -= step) g.lineTo(riverCX(y) + riverHW(y) * 0.55, y);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(190,215,225,0.22)'; g.lineWidth = 2;
  for (const sd of [-1, 1]) {
    g.beginPath();
    for (let y = y0; y <= y1; y += step) { const x = riverCX(y) + sd * (riverHW(y) - 2); if (y === y0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
  }
}
function drawPond(g, cx, cy, rx, ry) {
  g.fillStyle = pat(g, 'sand'); g.beginPath(); g.ellipse(cx, cy, rx * 1.12, ry * 1.14, 0, 0, TAU); g.fill();
  g.fillStyle = pat(g, 'water'); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill();
  g.fillStyle = 'rgba(4,14,24,0.3)'; g.beginPath(); g.ellipse(cx, cy, rx * 0.6, ry * 0.6, 0, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(190,215,225,0.2)'; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, rx - 2, ry - 2, 0, 0, TAU); g.stroke();
  g.fillStyle = '#3e6a2e';
  for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + hash2(i, 9); g.beginPath(); g.arc(cx + Math.cos(a) * rx * 0.98, cy + Math.sin(a) * ry * 0.98, 4 + hash2(i, 5) * 5, 0, TAU); g.fill(); }
}
function drawFountain(g, cx, cy) {
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(cx + 4, cy + 5, 41, 0, TAU); g.fill();
  g.fillStyle = '#c2bba9'; g.beginPath(); g.arc(cx, cy, 41, 0, TAU); g.fill();
  g.fillStyle = '#9d9684'; g.beginPath(); g.arc(cx, cy, 36, 0, TAU); g.fill();
  const gr = g.createRadialGradient(cx, cy, 4, cx, cy, 35); gr.addColorStop(0, '#5fc6e0'); gr.addColorStop(1, '#1f6f90');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 34, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 1;
  for (const r of [14, 22, 29]) { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); }
  g.fillStyle = '#d8d2c2'; g.beginPath(); g.arc(cx, cy, 8, 0, TAU); g.fill();
  g.fillStyle = '#bfe9f5'; g.beginPath(); g.arc(cx, cy, 4, 0, TAU); g.fill();
}

/* ============================ PROPS BAIXOS ============================ */
function drawBrokenProp(g, p) {
  const R = mulberry32((p.seed * 1e6) | 0);
  g.rotate(p.fallA - p.a);
  switch (p.type) {
    case 'bench':
      for (let i = 0; i < 3; i++) { g.save(); g.translate(4 + i * 7 + R() * 4, (R() - 0.5) * 14); g.rotate((R() - 0.5) * 1.6); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-9, -1, 20, 4); g.fillStyle = i % 2 ? '#6a4224' : '#8a5a34'; g.fillRect(-10, -2, 20, 3); g.restore(); }
      g.fillStyle = '#3a3a3a'; g.fillRect(-3, -6, 2, 5); g.fillRect(-2, 4, 5, 2);
      break;
    case 'bin':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(4, -3, 12, 8);
      g.fillStyle = '#2f6a3a'; g.fillRect(3, -4, 11, 7); g.fillStyle = '#1c3f22'; g.fillRect(13, -4, 2, 7);
      for (let i = 0; i < 9; i++) { g.fillStyle = ['#e8e2d0', '#c9a46a', '#3a86ff', '#e63946', '#7a7a7a'][i % 5]; g.fillRect(14 + R() * 18, (R() - 0.5) * 18, 2.4, 2); }
      break;
    case 'hydrant':
      g.fillStyle = 'rgba(80,140,190,0.35)'; g.beginPath(); g.ellipse(6, 0, 16, 10, 0, 0, TAU); g.fill();
      g.fillStyle = '#7a1a16'; g.beginPath(); g.arc(0, 0, 2.6, 0, TAU); g.fill();
      g.fillStyle = '#c8302a'; g.fillRect(10, -2, 7, 4);
      break;
    case 'table': case 'cart':
      g.save(); g.translate(6, 2); g.rotate(0.7); g.fillStyle = p.c || '#d23a2a'; g.fillRect(-5, -5, 10, 10); g.restore();
      for (let i = 0; i < 4; i++) { g.fillStyle = shade(p.c || '#d62828', -0.15); g.fillRect(-4 + R() * 22, (R() - 0.5) * 18, 3, 3); }
      if (p.type === 'cart') for (let i = 0; i < 14; i++) { g.fillStyle = '#f5e6b0'; g.fillRect(4 + R() * 20, (R() - 0.5) * 16, 1.6, 1.6); }
      break;
    case 'cone':
      g.save(); g.translate(14 + R() * 10, (R() - 0.5) * 14); g.rotate(R() * TAU); g.fillStyle = '#ff6a1a'; g.beginPath(); g.moveTo(-5, -3); g.lineTo(5, 0); g.lineTo(-5, 3); g.closePath(); g.fill(); g.fillStyle = '#f2f2ea'; g.fillRect(-2, -1.5, 1.5, 3); g.restore();
      break;
    case 'barrier':
      for (let i = 0; i < 2; i++) { g.save(); g.translate(8 + i * 12 + R() * 6, (R() - 0.5) * 16); g.rotate((R() - 0.5) * 2); for (let j = 0; j < 3; j++) { g.fillStyle = j % 2 ? '#f2f2ea' : '#e8402a'; g.fillRect(-7 + j * 4.7, -1.5, 4.7, 3); } g.restore(); }
      break;
    case 'tires':
      for (let i = 0; i < 3; i++) { const x = 4 + R() * 22, y = (R() - 0.5) * 20; g.fillStyle = '#18181a'; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); g.fillStyle = '#3a3a3e'; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); }
      break;
    case 'pot':
      for (let i = 0; i < 6; i++) { g.fillStyle = '#2a2420'; g.beginPath(); const x = R() * 16, y = (R() - 0.5) * 14; g.moveTo(x, y); g.lineTo(x + 3, y + 1); g.lineTo(x + 1, y + 3); g.fill(); }
      break;
    default:
      g.fillStyle = '#4a4a4e'; g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill(); g.fillRect(2, -1, 7, 2);
  }
}
function drawProp(g, p) {
  g.save(); g.translate(p.x, p.y); g.rotate(p.a);
  if (p.broken) { drawBrokenProp(g, p); g.restore(); return; }
  switch (p.type) {
    case 'bench':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-12, -2, 28, 9);
      g.fillStyle = '#3a3a3a'; g.fillRect(-12, -4, 2, 8); g.fillRect(10, -4, 2, 8);
      g.fillStyle = '#8a5a34'; g.fillRect(-13, -4, 26, 3); g.fillRect(-13, 0, 26, 3);
      g.fillStyle = '#6a4224'; g.fillRect(-13, -1, 26, 1);
      break;
    case 'bin':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(2, 3, 5, 0, TAU); g.fill();
      g.fillStyle = '#2f6a3a'; g.beginPath(); g.arc(0, 0, 4.5, 0, TAU); g.fill();
      g.fillStyle = '#1c3f22'; g.beginPath(); g.arc(0, 0, 2.5, 0, TAU); g.fill();
      break;
    case 'hydrant':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(2, 3, 4, 0, TAU); g.fill();
      g.fillStyle = '#c8302a'; g.beginPath(); g.arc(0, 0, 3.6, 0, TAU); g.fill();
      g.fillStyle = '#ffd04a'; g.beginPath(); g.arc(0, 0, 1.6, 0, TAU); g.fill();
      break;
    case 'bollard':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(1.5, 2, 3, 0, TAU); g.fill();
      g.fillStyle = '#5a5a5e'; g.beginPath(); g.arc(0, 0, 2.6, 0, TAU); g.fill();
      g.fillStyle = '#e0c04a'; g.beginPath(); g.arc(0, 0, 1.2, 0, TAU); g.fill();
      break;
    case 'island': {
      const w = p.w, h = p.h;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
      g.fillStyle = '#d8d6cf'; g.fillRect(-w / 2, -h / 2, w, h);
      g.fillStyle = '#3a3a3a'; g.fillRect(-w / 2, -h / 2, w, 2); g.fillRect(-w / 2, h / 2 - 2, w, 2);
      for (let x = -w / 2 + 18; x < w / 2 - 10; x += 46) {
        g.fillStyle = '#f2f2ee'; g.fillRect(x - 7, -5, 14, 10);
        g.fillStyle = p.c || '#ff3d3d'; g.fillRect(x - 7, -5, 14, 3);
        g.fillStyle = '#222'; g.fillRect(x - 4, 0, 8, 3);
        g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x + 7, 0); g.quadraticCurveTo(x + 12, 6, x + 9, 9); g.stroke();
      }
      break;
    }
    case 'tires':
      for (const [dx, dy] of [[0, 0], [5, 3]]) {
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(dx + 2, dy + 3, 8, 0, TAU); g.fill();
        g.fillStyle = '#18181a'; g.beginPath(); g.arc(dx, dy, 7.5, 0, TAU); g.fill();
        g.fillStyle = '#3a3a3e'; g.beginPath(); g.arc(dx, dy, 3.5, 0, TAU); g.fill();
      }
      break;
    case 'goal':
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.strokeRect(-20, 0, 40, 10);
      g.strokeStyle = '#f2f2f2'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-22, 0); g.lineTo(22, 0); g.stroke();
      g.strokeStyle = 'rgba(230,230,230,0.45)'; g.lineWidth = 0.8;
      for (let x = -20; x <= 20; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, -8); g.stroke(); }
      g.beginPath(); g.moveTo(-20, -8); g.lineTo(20, -8); g.stroke();
      break;
    case 'well':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(3, 4, 12, 0, TAU); g.fill();
      g.fillStyle = '#8a8478'; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill();
      g.fillStyle = '#0c1418'; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.fill();
      g.fillStyle = '#5a3c22'; g.fillRect(-13, -1.5, 26, 3);
      break;
    case 'trough':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-18, -3, 40, 13);
      g.fillStyle = '#7d7a72'; g.fillRect(-20, -6, 40, 12);
      g.fillStyle = '#2a5a70'; g.fillRect(-17, -3, 34, 6);
      break;
    case 'scarecrow':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-10, 2, 22, 4);
      g.fillStyle = '#5a3c22'; g.fillRect(-12, -1, 24, 2.5); g.fillRect(-1, -8, 2.5, 16);
      g.fillStyle = '#8a3a2a'; g.fillRect(-6, -3, 12, 7);
      g.fillStyle = '#c9a64a'; g.beginPath(); g.arc(0, -6, 4.5, 0, TAU); g.fill();
      g.fillStyle = '#6a4a22'; g.beginPath(); g.arc(0, -6, 6.5, Math.PI, TAU); g.fill();
      break;
    case 'cart':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-8, -4, 20, 14);
      g.fillStyle = '#d23a2a'; g.fillRect(-10, -7, 20, 13);
      g.fillStyle = '#f5e6b0'; g.fillRect(-7, -5, 14, 8);
      g.fillStyle = '#222'; g.fillRect(-11, 4, 4, 4); g.fillRect(7, 4, 4, 4);
      break;
    case 'mound':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(6, 8, 44, 30, 0, 0, TAU); g.fill();
      for (let i = 0; i < 4; i++) { g.fillStyle = ['#7a6248', '#8a7258', '#6a5240', '#9a8268'][i]; g.beginPath(); g.ellipse(-i * 3, -i * 3, 42 - i * 9, 28 - i * 6, 0, 0, TAU); g.fill(); }
      g.fillStyle = '#b0a080'; for (let i = 0; i < 12; i++) g.fillRect((hash2(i, 3) - 0.5) * 60, (hash2(i, 4) - 0.5) * 36, 3, 2);
      break;
    case 'hole':
      g.fillStyle = '#141416'; g.beginPath(); g.ellipse(0, 0, 11, 7, 0.3, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(120,110,90,0.6)'; g.lineWidth = 1.2; g.stroke();
      g.fillStyle = 'rgba(80,140,190,0.35)'; g.beginPath(); g.ellipse(-2, 1, 6, 3, 0.3, 0, TAU); g.fill();
      break;
    case 'cone':
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(1.5, 2, 4, 0, TAU); g.fill();
      g.fillStyle = '#ff6a1a'; g.fillRect(-3.5, -3.5, 7, 7); g.fillStyle = '#ff7f2a'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
      g.strokeStyle = '#f2f2ea'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 1.8, 0, TAU); g.stroke();
      break;
    case 'barrier':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-13, -1, 28, 5);
      for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#f2f2ea' : '#e8402a'; g.fillRect(-14 + i * 4.7, -2.5, 4.7, 4); }
      g.fillStyle = '#3a3a3a'; g.fillRect(-14, 1.5, 2, 2); g.fillRect(12, 1.5, 2, 2);
      break;
    case 'flagES':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(1, 2, 3, 0, TAU); g.fill();
      g.fillStyle = '#ccc'; g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill();
      for (let i = 0; i < 3; i++) { g.fillStyle = ['#1d4f9c', '#f4f4f0', '#e98bb0'][i]; g.fillRect(2, -8 + i * 4, 18, 4); }
      break;
    case 'pot': {
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(1.5, 2, 6, 0, TAU); g.fill();
      g.fillStyle = '#2a2420'; g.beginPath(); g.arc(0, 0, 5.5, 0, TAU); g.fill();
      g.fillStyle = '#4a3a30'; g.beginPath(); g.arc(-1, -1, 3.4, 0, TAU); g.fill();
      g.fillStyle = '#1a1410'; g.fillRect(-7.5, -1, 2.5, 2); g.fillRect(5, -1, 2.5, 2);
      break;
    }
    case 'table': {
      const c = p.c || '#d62828';
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(-4, -3, 11, 11);
      g.fillStyle = shade(c, -0.15);
      for (const [dx, dy] of [[-7, -1.5], [5, -1.5], [-1.5, -7], [-1.5, 5]]) g.fillRect(dx, dy, 3, 3);
      g.fillStyle = c; g.fillRect(-4.5, -4.5, 9, 9);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-4.5, -4.5, 9, 2);
      g.fillStyle = '#e8c547'; g.fillRect(-1, -1, 2, 3);
      break;
    }
    case 'orelhao': {
      // orelhão: concha laranja aberta para a rua
      g.fillStyle = 'rgba(0,0,0,0.32)'; g.beginPath(); g.ellipse(2.5, 3, 8, 7, 0, 0, TAU); g.fill();
      g.fillStyle = '#5a5a5e'; g.fillRect(-1, -1, 2, 2);
      g.fillStyle = '#ff7a1a'; g.beginPath(); g.arc(0, 0, 7.2, Math.PI * 0.32, Math.PI * 1.68, false); g.lineTo(0, 0); g.closePath(); g.fill();
      g.fillStyle = '#ffa04a'; g.beginPath(); g.arc(-1.2, -1, 4.6, Math.PI * 0.5, Math.PI * 1.5, false); g.closePath(); g.fill();
      g.strokeStyle = '#b34a08'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 7.2, Math.PI * 0.32, Math.PI * 1.68, false); g.stroke();
      g.fillStyle = '#1d4f9c'; g.fillRect(1, -2, 3, 4); g.fillStyle = '#c8c8c0'; g.fillRect(1.6, -1.3, 1.6, 1);
      break;
    }
    case 'bump': {
      const w = p.w, h = p.h;
      g.fillStyle = '#1c1c1e'; g.fillRect(-w / 2, -h / 2, w, h);
      g.fillStyle = '#e8c23a';
      const long = w > h, L = long ? w : h;
      for (let t = -L / 2; t < L / 2; t += 10) { if (long) g.fillRect(t, -h / 2, 5, h); else g.fillRect(-w / 2, t, w, 5); }
      g.fillStyle = 'rgba(255,255,255,0.12)'; if (long) g.fillRect(-w / 2, -h / 2, w, 2); else g.fillRect(-w / 2, -h / 2, 2, h);
      break;
    }
    case 'flag':
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(1, 2, 3, 0, TAU); g.fill();
      g.fillStyle = '#ccc'; g.beginPath(); g.arc(0, 0, 2, 0, TAU); g.fill();
      g.fillStyle = '#2a9a48'; g.fillRect(2, -8, 18, 12);
      g.fillStyle = '#f0d43a'; g.beginPath(); g.moveTo(4, -2); g.lineTo(11, -7); g.lineTo(18, -2); g.lineTo(11, 3); g.closePath(); g.fill();
      g.fillStyle = '#2a4a9a'; g.beginPath(); g.arc(11, -2, 2.6, 0, TAU); g.fill();
      break;
  }
  g.restore();
}
function drawWallBaked(g, w) {
  if (w.graf) {
    // muro alto pichado: face sul visível com frases e pixos
    const x0 = w.x0, y0 = w.y0, ww = w.x1 - w.x0, hh = w.y1 - w.y0, lift = 11, fy = y0 - lift + hh;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x0 + 2, y0 + 2, ww + 2, hh + 3);
    g.fillStyle = shade(w.color, -0.18); g.fillRect(x0, fy, ww, lift);
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = x0; x < x0 + ww; x += 9) g.fillRect(x, fy, 0.7, lift);
    g.fillStyle = shade(w.color, 0.1); g.fillRect(x0, y0 - lift, ww, hh);
    g.textBaseline = 'middle'; g.textAlign = 'left';
    for (const t of w.graf) {
      if (t.mural) {
        const cols = ['#e63946', '#f4c430', '#2a9d8f', '#3a86ff', '#ff7f11'];
        for (let i = 0; i < 6; i++) { g.fillStyle = cols[(i + t.x) % 5]; g.fillRect(t.x + i * 11, fy + 1, 11, lift - 2); }
        g.font = 'italic 900 8px Arial, sans-serif'; g.lineWidth = 2; g.strokeStyle = '#111'; g.strokeText(t.text, t.x + 2, fy + lift / 2, 64); g.fillStyle = '#fff'; g.fillText(t.text, t.x + 2, fy + lift / 2, 64);
      } else {
        g.font = (PIXOS.includes(t.text) ? '900 9px "Arial Narrow", Impact, Arial' : 'italic 800 8px Arial') + ', sans-serif';
        g.fillStyle = t.color; g.fillText(t.text, t.x, fy + lift / 2, 80);
        for (let i = 0; i < 3; i++) g.fillRect(t.x + 6 + i * 17, fy + lift / 2 + 3, 0.8, 2 + (i * 3 + t.x) % 3);
      }
    }
    return;
  }
  const x0 = w.x0, y0 = w.y0, ww = w.x1 - w.x0, hh = w.y1 - w.y0, lift = 3;
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x0 + 2, y0 + 2, ww + 2, hh + 2);
  if (w.kind === 'hedge') {
    g.fillStyle = '#2e4a24'; g.fillRect(x0, y0 - lift + 1, ww, hh + lift);
    g.fillStyle = '#4a6e36';
    const long = ww > hh;
    for (let i = 0; i < (long ? ww : hh); i += 5) { g.beginPath(); g.arc(long ? x0 + i + 2 : x0 + ww / 2, long ? y0 + hh / 2 - lift : y0 + i + 2 - lift, Math.min(ww, hh) * 0.55 + 0.8, 0, TAU); g.fill(); }
    return;
  }
  g.fillStyle = shade(w.color, -0.42); g.fillRect(x0, y0 - lift + hh, ww, lift);
  g.fillStyle = shade(w.color, -0.1); g.fillRect(x0, y0 - lift, ww, hh);
  g.fillStyle = shade(w.color, 0.2); g.fillRect(x0, y0 - lift, ww, 1);
}
function drawFenceBaked(g, f) {
  const long = (f.x1 - f.x0) > (f.y1 - f.y0);
  const L = long ? f.x1 - f.x0 : f.y1 - f.y0;
  if (f.gaps && f.gaps.length) {
    // cerca arrebentada: desenha os pedaços inteiros e madeira/arame caídos nos buracos
    let cur = 0;
    const parts = [];
    for (const gp of [...f.gaps].sort((a, b) => a.t - b.t)) { if (gp.t - 22 > cur) parts.push([cur, gp.t - 22]); cur = Math.max(cur, gp.t + 22); }
    if (L > cur) parts.push([cur, L]);
    for (const [a, b] of parts) drawFenceBaked(g, long ? { x0: f.x0 + a, x1: f.x0 + b, y0: f.y0, y1: f.y1, type: f.type } : { x0: f.x0, x1: f.x1, y0: f.y0 + a, y1: f.y0 + b, type: f.type });
    for (const gp of f.gaps) {
      const R = mulberry32((gp.t * 97) | 0), cx0 = long ? f.x0 + gp.t : (f.x0 + f.x1) / 2, cy0 = long ? (f.y0 + f.y1) / 2 : f.y0 + gp.t;
      for (let i = 0; i < 4; i++) { g.save(); g.translate(cx0 + Math.cos(gp.a) * (6 + R() * 22) + (R() - 0.5) * 12, cy0 + Math.sin(gp.a) * (6 + R() * 22) + (R() - 0.5) * 12); g.rotate(R() * TAU); g.fillStyle = f.type === 'chain' ? '#8f949a' : '#6a4a2a'; g.fillRect(-7, -1, 14, 2.4); g.restore(); }
    }
    return;
  }
  const cx = (f.x0 + f.x1) / 2, cy = (f.y0 + f.y1) / 2;
  const P = (t, o) => long ? [f.x0 + t, cy + o] : [cx + o, f.y0 + t];
  if (f.type === 'chain') {
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; g.beginPath(); let a = P(0, 3), b = P(L, 3); g.moveTo(a[0] + 2, a[1]); g.lineTo(b[0] + 2, b[1]); g.stroke();
    g.strokeStyle = 'rgba(180,185,190,0.55)'; g.lineWidth = 1.6; a = P(0, 0); b = P(L, 0); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    g.fillStyle = '#8f949a';
    for (let t = 0; t <= L; t += 30) { const p = P(t, 0); g.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3); }
  } else {
    g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; let a = P(0, 3), b = P(L, 3); g.beginPath(); g.moveTo(a[0] + 2, a[1]); g.lineTo(b[0] + 2, b[1]); g.stroke();
    g.strokeStyle = '#8a6a44'; g.lineWidth = 1.2;
    for (const o of [-1, 1]) { a = P(0, o); b = P(L, o); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    for (let t = 0; t <= L; t += 26) {
      const p = P(t, 0);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(p[0] - 1, p[1] - 1, 5, 5);
      g.fillStyle = '#5c3f24'; g.fillRect(p[0] - 2.2, p[1] - 2.2, 4.4, 4.4);
      g.fillStyle = '#7a5634'; g.fillRect(p[0] - 2.2, p[1] - 2.2, 4.4, 1.4);
    }
  }
}
function drawAwning(g, r, color, front) {
  const [x0, y0, x1, y1] = r, w = x1 - x0, h = y1 - y0;
  const along = front === 'N' || front === 'S';
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x0 + 2, y0 + 3, w, h);
  const n = Math.max(2, Math.floor((along ? w : h) / 8));
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? '#f1ece0' : color;
    if (along) g.fillRect(x0 + (w / n) * i, y0, w / n + 0.5, h); else g.fillRect(x0, y0 + (h / n) * i, w, h / n + 0.5);
  }
  g.fillStyle = 'rgba(0,0,0,0.25)';
  if (along) g.fillRect(x0, front === 'N' ? y0 : y1 - 1.5, w, 1.5); else g.fillRect(front === 'W' ? x0 : x1 - 1.5, y0, 1.5, h);
}

/* ============================ VEÍCULOS ============================ */
const VMODELS = {
  quadrado: { id: 'quadrado', L: 43, W: 22, ws: 0.24, rf: 0.10, rr: -0.30, rw: -0.44, nose: 1.8, tail: 1.6, kind: 'car', boxy: true },
  besouro: { id: 'besouro', L: 41, W: 22, ws: 0.13, rf: 0.0, rr: -0.22, rw: -0.36, nose: 10, tail: 11, kind: 'car', beetle: true },
  escada: { id: 'escada', L: 39, W: 21, ws: 0.25, rf: 0.14, rr: -0.40, rw: -0.47, nose: 2, tail: 1.5, kind: 'car', boxy: true, ladder: true },
  santana: { id: 'santana', L: 50, W: 23, ws: 0.18, rf: 0.04, rr: -0.22, rw: -0.33, nose: 2, tail: 2, kind: 'car', boxy: true },
  hatch: { id: 'hatch', L: 44, W: 22, ws: 0.20, rf: 0.06, rr: -0.30, rw: -0.43, nose: 6, tail: 5, kind: 'car' },
  sedan: { id: 'sedan', L: 50, W: 23, ws: 0.17, rf: 0.02, rr: -0.20, rw: -0.32, nose: 6, tail: 5, kind: 'car' },
  police: { id: 'police', L: 50, W: 23, ws: 0.17, rf: 0.02, rr: -0.20, rw: -0.32, nose: 6, tail: 5, kind: 'car', police: true },
  taxi: { id: 'taxi', L: 50, W: 23, ws: 0.17, rf: 0.02, rr: -0.20, rw: -0.32, nose: 6, tail: 5, kind: 'car', taxi: true },
  pickup: { id: 'pickup', L: 52, W: 24, ws: 0.25, rf: 0.13, rr: -0.07, rw: -0.10, nose: 5, tail: 3, kind: 'car', bed: -0.12 },
  van: { id: 'van', L: 48, W: 24, ws: 0.45, rf: 0.37, rr: -0.44, rw: -0.47, nose: 10, tail: 6, kind: 'car', van: true },
  sport: { id: 'sport', L: 45, W: 24, ws: 0.14, rf: -0.02, rr: -0.25, rw: -0.37, nose: 9, tail: 6, kind: 'car', stripes: true, spoiler: true },
  muscle: { id: 'muscle', L: 56, W: 25, ws: 0.10, rf: -0.05, rr: -0.25, rw: -0.34, nose: 4, tail: 4, kind: 'car', chrome: true },
  truck: { id: 'truck', L: 84, W: 28, kind: 'truck' },
  bus: { id: 'bus', L: 112, W: 30, kind: 'bus' },
  tractor: { id: 'tractor', L: 34, W: 24, kind: 'tractor' },
  moto: { id: 'moto', L: 21, W: 8, kind: 'moto' },
  bau: { id: 'bau', L: 72, W: 26, kind: 'truck', variant: 'bau' },
  gas: { id: 'gas', L: 58, W: 25, kind: 'truck', variant: 'gas' },
  tanker: { id: 'tanker', L: 80, W: 27, kind: 'truck', variant: 'tanker' },
  cacamba: { id: 'cacamba', L: 62, W: 26, kind: 'truck', variant: 'cacamba' },
  guincho: { id: 'guincho', L: 68, W: 26, kind: 'truck', variant: 'guincho' },
};
const _bodyPaths = {};
function bodyPath(m) {
  if (_bodyPaths[m.id]) return _bodyPaths[m.id];
  const hl = m.L / 2, hw = m.W / 2, n = m.nose || 4, t = m.tail || 4, p = new Path2D();
  p.moveTo(-hl + t, -hw);
  p.lineTo(hl - n, -hw + 0.6);
  p.quadraticCurveTo(hl, -hw + 0.8, hl, -hw + n);
  p.lineTo(hl, hw - n);
  p.quadraticCurveTo(hl, hw - 0.8, hl - n, hw - 0.6);
  p.lineTo(-hl + t, hw);
  p.quadraticCurveTo(-hl, hw, -hl, hw - t);
  p.lineTo(-hl, -hw + t);
  p.quadraticCurveTo(-hl, -hw, -hl + t, -hw);
  p.closePath();
  _bodyPaths[m.id] = p;
  return p;
}
const _grads = new Map();
function bodyGrad(ctx, color, hw, lift) {
  const k = color + hw + (lift || 0);
  let g = _grads.get(k);
  if (!g) {
    g = ctx.createLinearGradient(0, -hw, 0, hw);
    const L = lift || 0;
    g.addColorStop(0, shade(color, -0.5)); g.addColorStop(0.2, shade(color, -0.12 + L));
    g.addColorStop(0.5, shade(color, 0.16 + L)); g.addColorStop(0.8, shade(color, -0.12 + L)); g.addColorStop(1, shade(color, -0.5));
    _grads.set(k, g);
  }
  return g;
}
let _glassGrad = null;
function glassGrad(ctx) {
  if (!_glassGrad) {
    _glassGrad = ctx.createLinearGradient(0, -12, 0, 12);
    _glassGrad.addColorStop(0, '#0b111b'); _glassGrad.addColorStop(0.45, '#2c3d55'); _glassGrad.addColorStop(0.55, '#3d5270'); _glassGrad.addColorStop(1, '#0b111b');
  }
  return _glassGrad;
}
function drawWheel(ctx, x, y, len, wid, steer, roll) {
  ctx.save(); ctx.translate(x, y); if (steer) ctx.rotate(steer);
  ctx.fillStyle = '#0d0d0f'; ctx.beginPath(); rrect(ctx, -len / 2, -wid / 2, len, wid, 1.6); ctx.fill();
  ctx.fillStyle = '#2c2c31';
  const ph = ((roll || 0) % 3 + 3) % 3;
  for (let s = -len / 2 + ph; s < len / 2; s += 3) ctx.fillRect(s, -wid / 2, 1, wid);
  ctx.restore();
}
function drawVehicle(ctx, m, color, x, y, a, o) {
  o = o || {};
  // a câmera achata o chão (SQ); o carro é desenhado sem achatar, girado pelo ângulo projetado na tela
  const sq = o.noSq ? 1 : SQ;
  const as = o.noSq ? a : Math.atan2(Math.sin(a) * SQ, Math.cos(a));
  const lift = o.noLift ? 0 : vehLift(m);
  ctx.save();
  ctx.translate(x + 2.5, y + 3.5 / sq); ctx.scale(1, 1 / sq); ctx.rotate(as);
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath(); rrect(ctx, -m.L / 2 - 1, -m.W / 2 - 0.5, m.L + 2, m.W + 1, m.kind === 'moto' ? 4 : 6); ctx.fill();
  ctx.restore();
  if (lift && m.kind !== 'moto') {
    const bp = bodyPath(m), base = m.kind === 'car' ? color : m.kind === 'bus' ? '#d8d6ce' : m.kind === 'truck' ? (o.box || '#d9d6cc') : color;
    const steps = [[0, -0.7], [0.35, -0.6], [0.7, -0.48]];
    for (const [k, sh] of steps) {
      ctx.save(); ctx.translate(x, y - lift * k / sq); ctx.scale(1, 1 / sq); ctx.rotate(as);
      ctx.fillStyle = shade(base, sh); ctx.fill(bp);
      ctx.restore();
    }
  }
  ctx.save();
  ctx.translate(x, y - lift / sq); ctx.scale(1, 1 / sq); ctx.rotate(as);
  if (o.bump) ctx.translate(o.bump, 0);
  if (m.kind === 'truck') drawTruck(ctx, m, color, o);
  else if (m.kind === 'bus') drawBus(ctx, m, color, o);
  else if (m.kind === 'tractor') drawTractor(ctx, m, color, o);
  else if (m.kind === 'moto') drawMoto(ctx, m, color, o);
  else drawCar(ctx, m, color, o);
  ctx.restore();
}
function drawMoto(ctx, m, color, o) {
  drawWheel(ctx, 7, 0, 6.5, 3, o.steer, o.roll); drawWheel(ctx, -7, 0, 6.5, 3.2, 0, o.roll);
  ctx.fillStyle = bodyGrad(ctx, color, 3); ctx.beginPath(); rrect(ctx, -6, -2.6, 13, 5.2, 2); ctx.fill();
  ctx.fillStyle = '#c8321e'; ctx.fillRect(-10, -3.6, 6, 7.2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-10, -0.4, 6, 0.8);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(5, -4.2); ctx.lineTo(5, 4.2); ctx.stroke();
  ctx.fillStyle = '#1e2430'; ctx.beginPath(); ctx.ellipse(-1, 0, 3.6, 3.4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = shade(color, 0.15); ctx.beginPath(); ctx.arc(1.5, 0, 2.6, 0, TAU); ctx.fill();
  ctx.fillStyle = '#0e141c'; ctx.fillRect(2.6, -1.4, 1.2, 2.8);
  ctx.fillStyle = o.parked ? '#a8a698' : '#fff6d8'; ctx.fillRect(9.4, -1, 1, 2);
  ctx.fillStyle = o.brake ? '#ff3a30' : '#a01818'; ctx.fillRect(-10.6, -1, 0.8, 2);
}
function vehLift(m) { return 0; }
function drawLightsFR(ctx, hl, hw, o, m) {
  if (m && m.boxy) {
    // grade de frisos e faróis retangulares, lanternas em bloco
    ctx.fillStyle = '#141416'; ctx.fillRect(hl - 2.4, -hw + 5.4, 2.2, hw * 2 - 10.8);
    ctx.fillStyle = '#5a5c62'; for (let y = -hw + 6.4; y < hw - 5.4; y += 2) ctx.fillRect(hl - 2.2, y, 1.8, 0.7);
    ctx.fillStyle = o.parked ? '#a8a698' : '#fff6d8';
    ctx.fillRect(hl - 2.8, -hw + 1.2, 2.6, 4.2); ctx.fillRect(hl - 2.8, hw - 5.4, 2.6, 4.2);
    ctx.fillStyle = '#e8a33a'; ctx.fillRect(hl - 2.6, -hw + 0.6, 1.6, 0.9); ctx.fillRect(hl - 2.6, hw - 1.5, 1.6, 0.9);
    ctx.fillStyle = o.brake ? '#ff3a30' : (o.parked ? '#5a1414' : '#a01818');
    ctx.fillRect(-hl + 0.3, -hw + 1, 2.6, 7.4); ctx.fillRect(-hl + 0.3, hw - 8.4, 2.6, 7.4);
    ctx.fillStyle = '#e8a33a'; ctx.fillRect(-hl + 0.3, -hw + 1, 2.6, 1.6); ctx.fillRect(-hl + 0.3, hw - 2.6, 2.6, 1.6);
    if (o.rev) { ctx.fillStyle = '#f4f4f4'; ctx.fillRect(-hl + 0.3, -hw + 5.6, 2.6, 1.6); ctx.fillRect(-hl + 0.3, hw - 7.2, 2.6, 1.6); }
    return;
  }
  if (m && m.beetle) {
    ctx.fillStyle = o.parked ? '#a8a698' : '#fff6d8';
    ctx.beginPath(); ctx.arc(hl - 5.5, -hw + 2.6, 2.3, 0, TAU); ctx.arc(hl - 5.5, hw - 2.6, 2.3, 0, TAU); ctx.fill();
    ctx.fillStyle = o.brake ? '#ff3a30' : (o.parked ? '#5a1414' : '#a01818');
    ctx.beginPath(); ctx.ellipse(-hl + 4.5, -hw + 2.4, 1.6, 2.2, 0, 0, TAU); ctx.ellipse(-hl + 4.5, hw - 2.4, 1.6, 2.2, 0, 0, TAU); ctx.fill();
    return;
  }
  ctx.fillStyle = o.parked ? '#a8a698' : '#fff6d8';
  ctx.fillRect(hl - 3.2, -hw + 1.6, 2.8, 4.6); ctx.fillRect(hl - 3.2, hw - 6.2, 2.8, 4.6);
  ctx.fillStyle = o.brake ? '#ff3a30' : (o.parked ? '#5a1414' : '#a01818');
  ctx.fillRect(-hl + 0.4, -hw + 1.4, 2.4, 5.2); ctx.fillRect(-hl + 0.4, hw - 6.6, 2.4, 5.2);
  if (o.rev) { ctx.fillStyle = '#f4f4f4'; ctx.fillRect(-hl + 0.4, -hw + 6.8, 2, 2.2); ctx.fillRect(-hl + 0.4, hw - 9, 2, 2.2); }
}
function drawCar(ctx, m, color, o) {
  const L = m.L, W = m.W, hl = L / 2, hw = W / 2;
  const wl = L * 0.2, xf = hl - L * 0.215, xr = -hl + L * 0.2;
  drawWheel(ctx, xf, -hw + 1.6, wl, 5, o.steer, o.roll); drawWheel(ctx, xf, hw - 1.6, wl, 5, o.steer, o.roll);
  drawWheel(ctx, xr, -hw + 1.6, wl, 5, 0, o.roll); drawWheel(ctx, xr, hw - 1.6, wl, 5, 0, o.roll);
  const bp = bodyPath(m);
  if (m.beetle) {
    // para-lamas redondos do besouro
    ctx.fillStyle = shade(color, -0.12);
    for (const x of [xf, xr]) for (const sy of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x, sy * (hw - 1.2), 6.4, 3.4, 0, 0, TAU); ctx.fill(); }
  }
  ctx.fillStyle = bodyGrad(ctx, color, hw); ctx.fill(bp);
  ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke(bp);
  const lean = clamp(o.lean || 0, -1, 1) * 1.3;
  const ws = L * m.ws, rf = L * m.rf, rr = L * m.rr, rw = L * m.rw;
  // capô
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(hl - 4, -hw * 0.45); ctx.lineTo(ws + 2, -hw * 0.5 + lean * 0.3); ctx.moveTo(hl - 4, hw * 0.45); ctx.lineTo(ws + 2, hw * 0.5 + lean * 0.3); ctx.stroke();
  // para-choques
  ctx.fillStyle = m.chrome ? '#d9d9d4' : '#26262a';
  ctx.fillRect(hl - 1.8, -hw + 2.5, 1.8, W - 5); ctx.fillRect(-hl, -hw + 2.5, 1.6, W - 5);
  drawLightsFR(ctx, hl, hw, o, m);
  if (m.beetle) {
    ctx.fillStyle = shade(color, -0.12);
    for (const x of [xf, xr]) for (const sy of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x, sy * (hw - 1.4), 5.6, 2.6, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(hl * 0.25, -0.6, hl * 0.6, 1.2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 4; i++) ctx.fillRect(-hl + 7 + i * 1.8, -4, 0.9, 8);
    drawLightsFR(ctx, hl, hw, o, m);
  }
  if (m.bed !== undefined) {
    const bx = L * m.bed;
    ctx.fillStyle = '#1e1e21'; ctx.fillRect(-hl + 2.2, -hw + 2.4, bx + hl - 2.2, W - 4.8);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let x = -hl + 5; x < bx - 1; x += 4) ctx.fillRect(x, -hw + 3, 1.2, W - 6);
    ctx.fillStyle = o.cargo ? '#c9a46a' : 'transparent';
    if (o.cargo) { ctx.fillRect(-hl + 5, -hw + 4.5, 10, 7); ctx.fillStyle = '#a88450'; ctx.fillRect(-hl + 5, -hw + 4.5 + 7.5, 10, 6); }
  }
  // para-brisa
  ctx.fillStyle = glassGrad(ctx);
  ctx.beginPath(); ctx.moveTo(ws, -hw + 2.4 + lean * 0.4); ctx.lineTo(rf, -hw + 4 + lean); ctx.lineTo(rf, hw - 4 + lean); ctx.lineTo(ws, hw - 2.4 + lean * 0.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(200,225,255,0.18)';
  ctx.beginPath(); ctx.moveTo(ws - 0.5, -hw + 4 + lean * 0.4); ctx.lineTo(ws - (ws - rf) * 0.6, -hw + 4.5 + lean); ctx.lineTo(ws - (ws - rf) * 0.9, -hw + 9 + lean); ctx.lineTo(ws - 0.5, -hw + 8 + lean * 0.4); ctx.fill();
  // vidro traseiro
  if (m.bed === undefined) {
    ctx.fillStyle = glassGrad(ctx);
    ctx.beginPath(); ctx.moveTo(rr, -hw + 4 + lean); ctx.lineTo(rw, -hw + 2.8 + lean * 0.4); ctx.lineTo(rw, hw - 2.8 + lean * 0.4); ctx.lineTo(rr, hw - 4 + lean); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = glassGrad(ctx); ctx.fillRect(rw - 1, -hw + 4 + lean, 2.6, W - 8);
  }
  // vidros laterais
  ctx.fillStyle = '#121a26';
  ctx.fillRect(rw + 1, -hw + 1.6 + lean * 0.5, ws - rw - 2, 1.8); ctx.fillRect(rw + 1, hw - 3.4 + lean * 0.5, ws - rw - 2, 1.8);
  // teto
  ctx.fillStyle = m.van ? bodyGrad(ctx, '#efe9da', hw - 4) : (m.chrome ? '#1a1a1c' : bodyGrad(ctx, color, hw - 4, 0.06));
  if (m.beetle) { ctx.beginPath(); ctx.ellipse((rr + rf) / 2, lean, (rf - rr) / 2, hw - 4, 0, 0, TAU); ctx.fill(); }
  else { ctx.beginPath(); rrect(ctx, rr, -hw + 4 + lean, rf - rr, W - 8, m.boxy ? 1 : 3); ctx.fill(); }
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
  if (m.van) {
    ctx.fillStyle = '#121a26';
    for (let x = rr + 3; x < rf - 6; x += 8) { ctx.fillRect(x, -hw + 1.2 + lean * 0.5, 6, 2.2); ctx.fillRect(x, hw - 3.4 + lean * 0.5, 6, 2.2); }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(rr + 4, -2 + lean, rf - rr - 8, 4);
    ctx.fillStyle = '#efe9da';
    ctx.beginPath(); ctx.moveTo(hl - 2, -hw + 3); ctx.lineTo(hl - 9, 0); ctx.lineTo(hl - 2, hw - 3); ctx.lineTo(hl - 1, hw - 3); ctx.lineTo(hl - 1, -hw + 3); ctx.closePath(); ctx.fill();
  }
  if (m.stripes) {
    ctx.fillStyle = 'rgba(245,245,245,0.85)';
    ctx.fillRect(-hl + 1, -3.2 + lean * 0.5, L - 2, 2); ctx.fillRect(-hl + 1, 1.2 + lean * 0.5, L - 2, 2);
  }
  if (m.ladder) {
    ctx.strokeStyle = '#b9bcc2'; ctx.lineWidth = 1.1; ctx.beginPath();
    for (const y of [-3.4, 3.4]) { ctx.moveTo(rr - 3, y + lean); ctx.lineTo(rf + 4, y + lean); }
    for (let x = rr - 1; x <= rf + 3; x += 3.2) { ctx.moveTo(x, -3.4 + lean); ctx.lineTo(x, 3.4 + lean); }
    ctx.stroke();
    ctx.fillStyle = '#333'; ctx.fillRect(rr - 4, -hw + 4.5, 1.5, W - 9); ctx.fillRect(rf + 1, -hw + 4.5, 1.5, W - 9);
  }
  if (m.spoiler) { ctx.fillStyle = '#151517'; ctx.fillRect(-hl + 1.2, -hw + 1, 3, W - 2); }
  if (m.chrome) { ctx.fillStyle = shade(color, -0.3); ctx.fillRect(ws + 3, -3.5, hl - ws - 7, 7); ctx.fillStyle = '#222'; ctx.fillRect(ws + 5, -2, 4, 4); }
  if (m.police) {
    ctx.fillStyle = '#1d4f9c'; ctx.fillRect(rw, -hw + 0.4, ws - rw, 1.4); ctx.fillRect(rw, hw - 1.8, ws - rw, 1.4);
    ctx.fillStyle = '#f4f4f0'; ctx.fillRect(rw, -hw + 1.8, ws - rw, 1); ctx.fillRect(rw, hw - 2.8, ws - rw, 1);
    ctx.fillStyle = '#e98bb0'; ctx.fillRect(rw, -hw + 2.8, ws - rw, 1.4); ctx.fillRect(rw, hw - 4.2, ws - rw, 1.4);
    ctx.fillStyle = '#f4f4f0'; ctx.font = 'bold 4px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(hl - 8, 0); ctx.rotate(Math.PI / 2); ctx.fillStyle = '#1d4f9c'; ctx.fillText('POLÍCIA', 0, 0); ctx.restore();
    const mid = (rr + rf) / 2;
    ctx.fillStyle = '#222'; ctx.fillRect(mid - 2.5, -7 + lean, 5, 14);
    ctx.fillStyle = '#ff2a2a'; ctx.fillRect(mid - 2, -6.5 + lean, 4, 6); ctx.fillStyle = '#2a6aff'; ctx.fillRect(mid - 2, 0.5 + lean, 4, 6);
  }
  if (m.taxi) {
    ctx.fillStyle = '#f2c230'; ctx.fillRect((rr + rf) / 2 - 3, -5 + lean, 6, 10);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect((rr + rf) / 2 - 1, -4 + lean, 2, 8);
  }
  // espelhos
  ctx.fillStyle = shade(color, -0.3);
  ctx.fillRect(ws - 2, -hw - 1.8, 3, 2); ctx.fillRect(ws - 2, hw - 0.2, 3, 2);
  // sujeira e dano
  if (o.zones) drawDents(ctx, m, color, o.zones, lean);
  if (o.dirt > 0.03 || o.damage > 30) {
    ctx.save(); ctx.clip(bp);
    if (o.dirt > 0.03) {
      ctx.globalAlpha = clamp(o.dirt, 0, 1) * 0.75;
      ctx.fillStyle = '#5b452e';
      for (let i = 0; i < 14; i++) { const r = hash2(i, 77); ctx.beginPath(); ctx.ellipse(-hl + r * L, (hash2(i, 13) - 0.5) * W, 3 + hash2(i, 5) * 6, 2 + hash2(i, 6) * 3, 0, 0, TAU); ctx.fill(); }
      ctx.fillRect(-hl, -hw, L, 2.5); ctx.fillRect(-hl, hw - 2.5, L, 2.5);
      ctx.globalAlpha = 1;
    }
    if (o.damage > 30) {
      ctx.strokeStyle = 'rgba(30,30,30,0.6)'; ctx.lineWidth = 0.8;
      const n = Math.floor((o.damage - 30) / 10);
      for (let i = 0; i < n; i++) { const sx = (hash2(i, 41) - 0.5) * L, sy = (hash2(i, 42) - 0.5) * W; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 5, sy + (hash2(i, 43) - 0.5) * 4); ctx.stroke(); }
    }
    ctx.restore();
  }
}
function drawDents(ctx, m, color, Z, lean) {
  const L = m.L, W = m.W, hl = L / 2, hw = W / 2, bp = bodyPath(m);
  const R = mulberry32(((Z.seed || 1) * 7919) | 0);
  ctx.save(); ctx.clip(bp);
  const dent = (x, y, rx, ry, depth) => {
    const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 0.5, x, y, Math.max(rx, ry));
    g.addColorStop(0, shade(color, -0.55 * depth)); g.addColorStop(0.7, shade(color, -0.3 * depth)); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
  };
  const scratches = (x0, x1, y, n) => {
    ctx.strokeStyle = 'rgba(225,225,220,0.75)'; ctx.lineWidth = 0.5; ctx.beginPath();
    for (let i = 0; i < n; i++) { const sx = lerp(x0, x1, R()), sy = y + (R() - 0.5) * 3; ctx.moveTo(sx, sy); ctx.lineTo(sx + 3 + R() * 6, sy + (R() - 0.5) * 1.5); }
    ctx.stroke();
  };
  // frente: capô e para-choque amassados
  if (Z.f > 0.05) {
    const d = Z.f;
    dent(hl - 3, (R() - 0.5) * hw, 4 + d * 7, 3 + d * 5, d);
    if (d > 0.35) { ctx.fillStyle = shade(color, -0.6); ctx.beginPath(); ctx.moveTo(hl, -hw); for (let y = -hw; y <= hw; y += 2.5) ctx.lineTo(hl - 1 - R() * d * 5, y); ctx.lineTo(hl, hw); ctx.closePath(); ctx.fill(); }
    if (d > 0.6) { ctx.fillStyle = '#18181a'; ctx.fillRect(hl - 3.2, -hw + 1.6, 2.8, 4.6); }
    if (d > 0.85) { ctx.fillStyle = '#18181a'; ctx.fillRect(hl - 3.2, hw - 6.2, 2.8, 4.6); }
    scratches(hl - 10, hl - 2, 0, Math.round(d * 6));
  }
  if (Z.r > 0.05) {
    const d = Z.r;
    dent(-hl + 3, (R() - 0.5) * hw, 4 + d * 7, 3 + d * 5, d);
    if (d > 0.35) { ctx.fillStyle = shade(color, -0.6); ctx.beginPath(); ctx.moveTo(-hl, -hw); for (let y = -hw; y <= hw; y += 2.5) ctx.lineTo(-hl + 1 + R() * d * 5, y); ctx.lineTo(-hl, hw); ctx.closePath(); ctx.fill(); }
    if (d > 0.6) { ctx.fillStyle = '#2a0c0c'; ctx.fillRect(-hl + 0.4, -hw + 1.4, 2.4, 5.2); }
    if (d > 0.85) { ctx.fillStyle = '#2a0c0c'; ctx.fillRect(-hl + 0.4, hw - 6.6, 2.4, 5.2); }
    scratches(-hl + 2, -hl + 10, 0, Math.round(d * 6));
  }
  for (const [k, sy] of [['l', -1], ['rt', 1]]) {
    const d = Z[k]; if (!(d > 0.05)) continue;
    const cx = (R() - 0.5) * L * 0.5;
    dent(cx, sy * (hw - 1), 5 + d * 10, 2 + d * 3, d);
    if (d > 0.5) dent(cx + (R() - 0.5) * 14, sy * (hw - 1), 3 + d * 5, 1.5 + d * 2, d * 0.8);
    scratches(cx - 10 - d * 8, cx + 8 + d * 8, sy * (hw - 1.5), Math.round(3 + d * 9));
  }
  ctx.restore();
  // para-choque solto pendurado
  if (Z.f > 0.8) { ctx.save(); ctx.translate(hl - 1, -hw + 2); ctx.rotate(0.45); ctx.fillStyle = '#26262a'; ctx.fillRect(0, -1, 2, W * 0.55); ctx.restore(); }
  if (Z.r > 0.8) { ctx.save(); ctx.translate(-hl + 1, hw - 2); ctx.rotate(Math.PI + 0.45); ctx.fillStyle = '#26262a'; ctx.fillRect(0, -1, 2, W * 0.55); ctx.restore(); }
  // para-brisa trincado
  if (Z.f > 0.5 && m.ws !== undefined) {
    const ws = L * m.ws, rf = L * m.rf, cx = (ws + rf) / 2, cy = (R() - 0.5) * hw * 0.8 + lean;
    ctx.strokeStyle = 'rgba(230,240,255,0.7)'; ctx.lineWidth = 0.5; ctx.beginPath();
    for (let i = 0; i < 7; i++) { const a = R() * TAU, l = 3 + R() * 5; ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * l * 0.5, cy + Math.sin(a) * l); }
    ctx.stroke();
  }
}
function drawTruck(ctx, m, color, o) {
  const L = m.L, W = m.W, hl = L / 2, hw = W / 2;
  for (const x of [hl - 12, -hl + 22, -hl + 10]) { drawWheel(ctx, x, -hw + 1, 11, 5.5, x > 0 ? o.steer : 0, o.roll); drawWheel(ctx, x, hw - 1, 11, 5.5, x > 0 ? o.steer : 0, o.roll); }
  const box = o.box || '#d9d6cc', v = m.variant || 'bau', bl = L - 26;
  if (v === 'tanker') {
    ctx.fillStyle = '#26262a'; ctx.fillRect(-hl, -hw + 2, bl, W - 4);
    const g = ctx.createLinearGradient(0, -hw, 0, hw); g.addColorStop(0, '#7d8289'); g.addColorStop(0.45, '#eef0f2'); g.addColorStop(1, '#6a6f76');
    ctx.fillStyle = g; ctx.beginPath(); rrect(ctx, -hl + 1, -hw + 1, bl - 2, W - 2, hw - 1); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; for (let x = -hl + 10; x < hl - 30; x += 12) { ctx.beginPath(); ctx.moveTo(x, -hw + 1); ctx.lineTo(x, hw - 1); ctx.stroke(); }
    ctx.fillStyle = '#4a4d52'; for (let x = -hl + 12; x < hl - 32; x += 18) { ctx.beginPath(); ctx.arc(x, 0, 2.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ff8a1a'; ctx.fillRect(-hl + 2, -2, 3, 4);
  } else if (v === 'gas') {
    ctx.fillStyle = '#3a3d42'; ctx.fillRect(-hl, -hw, bl, W);
    ctx.strokeStyle = '#8a8d92'; ctx.lineWidth = 1; ctx.strokeRect(-hl + 0.5, -hw + 0.5, bl - 1, W - 1);
    for (let x = -hl + 4; x < hl - 30; x += 5.4) for (let y = -hw + 4; y < hw - 2; y += 5.4) {
      ctx.fillStyle = '#2a5fae'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#9fb3c8'; ctx.beginPath(); ctx.arc(x, y, 1, 0, TAU); ctx.fill();
    }
  } else if (v === 'cacamba') {
    ctx.fillStyle = bodyGrad(ctx, box, hw); ctx.fillRect(-hl, -hw, bl, W);
    ctx.fillStyle = '#6b5a44'; ctx.fillRect(-hl + 3, -hw + 3, bl - 6, W - 6);
    ctx.fillStyle = '#8a7a64'; for (let i = 0; i < 26; i++) ctx.fillRect(-hl + 4 + hash2(i, 5) * (bl - 9), -hw + 4 + hash2(i, 9) * (W - 9), 2.4, 2.4);
    ctx.fillStyle = '#b0a080'; for (let i = 0; i < 10; i++) ctx.fillRect(-hl + 6 + hash2(i, 15) * (bl - 12), -hw + 5 + hash2(i, 19) * (W - 11), 3.4, 2);
  } else if (v === 'guincho') {
    ctx.fillStyle = '#2a2c30'; ctx.fillRect(-hl, -hw + 1, bl, W - 2);
    ctx.fillStyle = '#3e4146'; for (let x = -hl + 2; x < hl - 28; x += 4) ctx.fillRect(x, -hw + 2, 2.4, W - 4);
    ctx.fillStyle = '#f2c230'; ctx.fillRect(-hl, -hw + 1, 2, W - 2); ctx.fillRect(-hl, -hw + 1, bl, 1.4); ctx.fillRect(-hl, hw - 2.4, bl, 1.4);
    if (o.tow) { ctx.save(); ctx.translate(-hl + bl / 2, 0); drawCar(ctx, VMODELS.quadrado, o.towColor || '#8a8d92', { parked: true }); ctx.restore(); }
    else { ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-hl + 2, 0); ctx.lineTo(-hl + 14, 0); ctx.stroke(); }
  } else {
    ctx.fillStyle = bodyGrad(ctx, box, hw); ctx.fillRect(-hl, -hw, bl, W);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(-hl, -hw, bl, W);
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    for (let x = -hl + 6; x < hl - 28; x += 6) { ctx.beginPath(); ctx.moveTo(x, -hw + 1); ctx.lineTo(x, hw - 1); ctx.stroke(); }
    if (o.boxText) { ctx.save(); ctx.fillStyle = 'rgba(30,30,30,0.7)'; ctx.font = 'bold 7px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.boxText, -hl + bl / 2, 0); ctx.restore(); }
  }
  ctx.fillStyle = '#26262a'; ctx.fillRect(hl - 27, -hw + 3, 2, W - 6);
  ctx.fillStyle = bodyGrad(ctx, color, hw - 1);
  ctx.beginPath(); rrect(ctx, hl - 25, -hw + 1, 25, W - 2, 4); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.stroke();
  ctx.fillStyle = glassGrad(ctx); ctx.fillRect(hl - 8, -hw + 3, 5, W - 6);
  ctx.fillStyle = bodyGrad(ctx, color, hw - 3, 0.1); ctx.fillRect(hl - 22, -hw + 3, 13, W - 6);
  ctx.fillStyle = '#ffb547'; ctx.fillRect(hl - 20, -hw + 2, 2, 2); ctx.fillRect(hl - 20, hw - 4, 2, 2);
  drawLightsFR(ctx, hl, hw, o);
}
function drawBus(ctx, m, color, o) {
  const L = m.L, W = m.W, hl = L / 2, hw = W / 2;
  for (const x of [hl - 20, -hl + 26]) { drawWheel(ctx, x, -hw + 1, 12, 5.5, x > 0 ? o.steer : 0, o.roll); drawWheel(ctx, x, hw - 1, 12, 5.5, x > 0 ? o.steer : 0, o.roll); }
  ctx.fillStyle = bodyGrad(ctx, '#e8e6de', hw); ctx.beginPath(); rrect(ctx, -hl, -hw, L, W, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = color; ctx.fillRect(-hl + 2, -hw, L - 4, 3); ctx.fillRect(-hl + 2, hw - 3, L - 4, 3);
  ctx.fillStyle = '#16202c';
  for (let x = -hl + 8; x < hl - 16; x += 13) { ctx.fillRect(x, -hw + 3, 11, 2); ctx.fillRect(x, hw - 5, 11, 2); }
  ctx.fillStyle = glassGrad(ctx); ctx.fillRect(hl - 6, -hw + 3, 5, W - 6);
  ctx.fillStyle = '#bfbdb5'; ctx.fillRect(-hl + 20, -7, 22, 14); ctx.fillRect(hl - 46, -6, 16, 12);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-hl + 22, -5, 18, 10);
  ctx.fillStyle = color; ctx.fillRect(-10, -hw + 5, 30, W - 10);
  drawLightsFR(ctx, hl, hw, o);
}
function drawTractor(ctx, m, color, o) {
  const L = m.L, hl = L / 2;
  drawWheel(ctx, -hl + 8, -11, 15, 8, 0, o.roll); drawWheel(ctx, -hl + 8, 11, 15, 8, 0, o.roll);
  drawWheel(ctx, hl - 6, -8, 9, 4.5, o.steer, o.roll); drawWheel(ctx, hl - 6, 8, 9, 4.5, o.steer, o.roll);
  ctx.fillStyle = bodyGrad(ctx, color, 6); ctx.beginPath(); rrect(ctx, -4, -6, hl + 4, 12, 3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.stroke();
  ctx.fillStyle = '#222'; ctx.fillRect(hl - 2, -4, 2, 8);
  ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(4, -3, 1.8, 0, TAU); ctx.fill();
  ctx.fillStyle = bodyGrad(ctx, color, 9); ctx.fillRect(-hl + 2, -9, 16, 18);
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-hl + 6, -4, 7, 8);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(-hl + 15, 0, 3, 0, TAU); ctx.stroke();
  ctx.fillStyle = o.parked ? '#a8a698' : '#fff6d8'; ctx.fillRect(hl - 1.5, -5.5, 1.5, 3); ctx.fillRect(hl - 1.5, 2.5, 1.5, 3);
  ctx.fillStyle = o.brake ? '#ff3a30' : '#901818'; ctx.fillRect(-hl + 1.5, -8, 1.6, 3); ctx.fillRect(-hl + 1.5, 5, 1.6, 3);
}
// posições locais das luzes [frente esquerda, frente direita, trás esquerda, trás direita]
function lightPoints(m) {
  const hl = m.L / 2, hw = m.W / 2 - 4;
  return { fx: hl, fy: hw, rx: -hl, ry: hw };
}

/* ============================ ÁRVORES ============================ */
const _treeSprites = new Map();
const TREE_RES = 2;
function treeSprite(type, v) {
  const k = type + v;
  let c = _treeSprites.get(k);
  if (c) return c;
  const S = 64, R = mulberry32(type.length * 1000 + v * 37 + type.charCodeAt(0));
  c = makeCanvas(S * TREE_RES, S * TREE_RES);
  const g = c.getContext('2d');
  g.scale(TREE_RES, TREE_RES); g.translate(S / 2, S / 2);
  const blob = (x, y, r, base, hi) => {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, hi); gr.addColorStop(0.7, base); gr.addColorStop(1, shade(base, -0.35));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  };
  if (type === 'palm') {
    const n = 9 + (v % 3);
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + R() * 0.3, len = 22 + R() * 6;
      g.save(); g.rotate(a);
      g.fillStyle = i % 2 ? '#4a7a33' : '#3d6a2b';
      g.beginPath(); g.moveTo(2, 0); g.quadraticCurveTo(len * 0.5, -6, len, 1.5); g.quadraticCurveTo(len * 0.5, 5, 2, 0); g.fill();
      g.strokeStyle = 'rgba(20,40,15,0.7)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(2, 0); g.quadraticCurveTo(len * 0.5, -0.5, len, 1.5); g.stroke();
      g.restore();
    }
    g.fillStyle = '#6a4a2a'; g.beginPath(); g.arc(0, 0, 3.4, 0, TAU); g.fill();
    g.fillStyle = '#8a6a3a'; g.beginPath(); g.arc(-0.8, -0.8, 1.6, 0, TAU); g.fill();
  } else if (type === 'pine') {
    const n = 7;
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + v * 0.4, len = 18 + R() * 5;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * len, Math.sin(a) * len); g.stroke();
    }
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + v * 0.4, len = 18 + R() * 5;
      blob(Math.cos(a) * len, Math.sin(a) * len, 7 + R() * 2, '#244a2a', '#3f6e3e');
      blob(Math.cos(a) * len * 0.55, Math.sin(a) * len * 0.55, 5, '#20422a', '#376338');
    }
    blob(0, 0, 6, '#22462a', '#3d6a3d');
  } else if (type === 'bush') {
    for (let i = 0; i < 5; i++) blob((R() - 0.5) * 9, (R() - 0.5) * 9, 6 + R() * 3, '#3a6a2c', '#5f9446');
  } else {
    let base = '#2c5524', hi = '#4f8a3a', n = 8, rad = 20;
    if (type === 'mango') { base = '#1f4320'; hi = '#3a6e34'; n = 11; rad = 23; }
    if (type === 'ipeY') { base = '#c9a024'; hi = '#ffe066'; n = 9; }
    if (type === 'ipeP') { base = '#b8508f'; hi = '#ff9fd6'; n = 9; }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(1.5, 2, rad, 0, TAU); g.fill();
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, d = R() * rad * 0.55;
      blob(Math.cos(a) * d, Math.sin(a) * d, rad * (0.42 + R() * 0.2), base, hi);
    }
    blob(-rad * 0.15, -rad * 0.15, rad * 0.45, base, hi);
    if (type === 'ipeY' || type === 'ipeP') {
      g.fillStyle = 'rgba(60,100,40,0.55)';
      for (let i = 0; i < 6; i++) { g.beginPath(); g.arc((R() - 0.5) * rad * 1.4, (R() - 0.5) * rad * 1.4, 3, 0, TAU); g.fill(); }
      g.fillStyle = type === 'ipeY' ? '#fff3a0' : '#ffd0ec';
      for (let i = 0; i < 40; i++) { g.fillRect((R() - 0.5) * rad * 1.6, (R() - 0.5) * rad * 1.6, 1.4, 1.4); }
    }
  }
  _treeSprites.set(k, c);
  return c;
}

/* ============================ SPRITES DE LUZ ============================ */
const LCOL = { sodium: '#ffa64a', warm: '#ffcf8a', white: '#cfe0ff', cyan: '#59e0ff', green: '#5be38f', red: '#ff3b3b', amber: '#ffb000', head: '#fff1cf' };
function lightHex(c) { return LCOL[c] || c; }
let LSPR = null, CONE = null;
const _glowSpr = new Map();
function buildLightSprites() {
  const S = 128;
  LSPR = makeCanvas(S, S);
  const g = LSPR.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0.4)'); gr.addColorStop(0.8, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  // cone dos faróis: origem em (0, H/2), apontando para +x — gerado por pixel (atenuação suave)
  const W2 = 256, H2 = 128;
  CONE = makeCanvas(W2, H2);
  const c = CONE.getContext('2d');
  const img = c.createImageData(W2, H2), d = img.data;
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
    const dx = x + 3, dy = y + 0.5 - H2 / 2;
    const dist = Math.hypot(dx, dy) / W2;
    const ang = Math.abs(Math.atan2(dy, dx));
    const angF = 1 - smoothstep(clamp((ang - 0.12) / 0.36, 0, 1));
    const radF = dist > 1 ? 0 : Math.pow(1 - dist, 1.6) * smoothstep(clamp(dist * 9, 0, 1) * 0.6 + 0.4);
    const a = clamp(angF * radF * 1.15, 0, 1);
    const i = (y * W2 + x) * 4;
    d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255);
  }
  c.putImageData(img, 0, 0);
}
function glowSprite(hex) {
  let c = _glowSpr.get(hex);
  if (c) return c;
  const S = 128; c = makeCanvas(S, S);
  const g = c.getContext('2d');
  const [r, gg, b] = hexToRgb(hex);
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, `rgba(${r},${gg},${b},1)`); gr.addColorStop(0.2, `rgba(${r},${gg},${b},0.6)`);
  gr.addColorStop(0.5, `rgba(${r},${gg},${b},0.2)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  _glowSpr.set(hex, c);
  return c;
}
/* ============================ VEÍCULOS DO JOGADOR ============================ */
const CARS = [
  { id: 'pampeiro', name: 'Quadradão 1.6', model: 'quadrado', price: 0, max: 418, acc: 118, brk: 330, steer: 1.0, grip: 1.0, pitch: 1.0, cyl: 4, fuel: 1.0, desc: 'O hatch quadradinho dos anos 80 que todo brasileiro já teve, ou já empurrou. Faróis retangulares, grade de frisos e valentia de sobra.' },
  { id: 'besouro', name: 'Besouro 1300', model: 'besouro', price: 2800, max: 392, acc: 104, brk: 300, steer: 1.05, grip: 0.96, pitch: 1.22, cyl: 4, fuel: 0.9, desc: 'Motor a ar lá atrás, para-lamas redondos e faróis de sapo. Não corre, mas sobe qualquer ladeira de Vila Velha.' },
  { id: 'tropeiro', name: 'Pão de Forma', model: 'van', price: 4500, max: 352, acc: 92, brk: 285, steer: 0.9, grip: 0.93, pitch: 0.82, cyl: 4, fuel: 1.15, cargo: 1.25, desc: 'Furgão de motor traseiro, frente em V e duas cores. O xodó das feiras e das mudanças: entregas rendem 25% a mais.' },
  { id: 'escada', name: 'Mil e Um com Escada', model: 'escada', price: 5500, max: 425, acc: 121, brk: 330, steer: 1.08, grip: 1.0, pitch: 1.06, cyl: 4, fuel: 0.85, cargo: 1.1, desc: 'Hatch caixote de teto alto com a famosa escada no teto. Pau pra toda obra: entregas rendem 10% a mais.' },
  { id: 'sertaneja', name: 'Picape do Peão', model: 'pickup', price: 3500, max: 446, acc: 128, brk: 320, steer: 0.96, grip: 1.04, pitch: 0.9, cyl: 4, fuel: 1.1, offroad: true, job: 'pickup', desc: 'Picape de cabine simples: o veículo de trabalho mais barato. Faz fretes pelo app Fretes e quase não perde velocidade na terra.' },
  { id: 'cometa', name: 'Santo Antão 2.0', model: 'santana', price: 12500, max: 508, acc: 146, brk: 370, steer: 1.0, grip: 1.05, pitch: 0.95, cyl: 4, fuel: 1.05, desc: 'Sedã quadradão de quatro portas, o carro do tio no domingo. Firme e confortável na BR-101.' },
  { id: 'bravo', name: 'Xerão Turbo', model: 'sport', price: 19000, max: 575, acc: 186, brk: 420, steer: 1.12, grip: 1.13, pitch: 1.12, cyl: 4, fuel: 1.2, desc: 'Hatch esportivo dos anos 90 com faixas, aerofólio e escapamento que acorda a rua inteira.' },
  { id: 'gas', name: 'Gás na Porta', model: 'gas', price: 7000, max: 330, acc: 86, brk: 270, steer: 0.84, grip: 0.92, pitch: 0.62, cyl: 6, fuel: 1.5, job: 'gas', desc: 'Caminhãozinho de gás com a musiquinha clássica. Entrega botijão de casa em casa pelo app Fretes.' },
  { id: 'guincho', name: 'Guincho do Seu Zé', model: 'guincho', price: 10000, max: 360, acc: 92, brk: 285, steer: 0.82, grip: 0.95, pitch: 0.6, cyl: 6, fuel: 1.6, job: 'guincho', desc: 'Plataforma para rebocar carros quebrados até a oficina do Seu Zé.' },
  { id: 'cacamba', name: 'Caçamba Entulho', model: 'cacamba', price: 12000, max: 320, acc: 80, brk: 260, steer: 0.78, grip: 0.95, pitch: 0.55, cyl: 6, fuel: 1.8, offroad: true, job: 'cacamba', desc: 'Recolhe entulho das obras da cidade e leva para o aterro.' },
  { id: 'bau', name: 'Baú Leva-e-Traz', model: 'bau', price: 16000, max: 350, acc: 84, brk: 270, steer: 0.76, grip: 0.95, pitch: 0.55, cyl: 6, fuel: 1.9, job: 'bau', desc: 'Caminhão baú que abastece mercados, bares e restaurantes. Fretes longos e bem pagos.' },
  { id: 'tanker', name: 'Tanque Cheio', model: 'tanker', price: 24000, max: 340, acc: 76, brk: 250, steer: 0.72, grip: 0.95, pitch: 0.5, cyl: 6, fuel: 2.1, job: 'tanker', desc: 'Caminhão-tanque que abastece os postos. O frete que mais paga, e o mais pesado de manobrar.' },
  { id: 'brasa', name: 'Canecão 6C', model: 'muscle', price: 29000, max: 632, acc: 196, brk: 385, steer: 0.95, grip: 0.98, pitch: 0.78, cyl: 6, fuel: 1.4, desc: 'O sedã clássico de seis canecos, para-choques cromados e teto de vinil. Ronco grave e força de sobra.' },
];
const PALETTE = ['#c0392b', '#e8e8e8', '#1f2a44', '#2e86de', '#f1c40f', '#27ae60', '#16181d', '#8e9aa6', '#e67e22', '#7d3c98', '#6d4c3a', '#ff6fa5'];
const UPGRADES = [
  { id: 'motor', name: 'Motor', desc: 'Aceleração +10%/nível', base: [350, 800, 1600] },
  { id: 'cambio', name: 'Câmbio', desc: 'Velocidade máx. +5%/nível', base: [300, 700, 1400] },
  { id: 'freio', name: 'Freios', desc: 'Frenagem +12%/nível', base: [250, 550, 1100] },
  { id: 'pneu', name: 'Pneus', desc: 'Aderência e direção', base: [300, 650, 1300] },
];
// marcas inventadas, na zoeira (nenhuma marca real)
const BRANDS = {
  rebimboca: { name: 'Rebimboca', color: '#ffb547', slogan: 'Com parafuseta de série.' },
  jabuti: { name: 'Jabuti', color: '#7bd389', slogan: 'Devagar e sempre.' },
  pedeboi: { name: 'Pé-de-Boi', color: '#c98a4a', slogan: 'Aguenta o tranco.' },
  gambiarra: { name: 'Gambiarra Motors', color: '#59e0ff', slogan: 'Se funciona, tá certo.' },
  possante: { name: 'Possante', color: '#ff5a5f', slogan: 'Ronca até parado.' },
  lataveia: { name: 'Lata Véia', color: '#c9c2ad', slogan: 'De 0 a 100 em algum dia.' },
  bruto: { name: 'Bruto Diesel', color: '#ffd23a', slogan: 'Fumaça é sinal de força.' },
  cinquentinha: { name: 'Cinquentinha', color: '#ff8ad8', slogan: 'Cabe em qualquer vão.' },
};
const MODEL_BRAND = { quadrado: 'rebimboca', escada: 'rebimboca', besouro: 'jabuti', van: 'jabuti', pickup: 'pedeboi', tractor: 'pedeboi', santana: 'gambiarra', sedan: 'gambiarra', taxi: 'gambiarra', police: 'gambiarra', sport: 'possante', muscle: 'possante', hatch: 'lataveia', truck: 'bruto', bus: 'bruto', bau: 'bruto', gas: 'bruto', tanker: 'bruto', cacamba: 'bruto', guincho: 'bruto', moto: 'cinquentinha' };
function brandOf(model) { return BRANDS[MODEL_BRAND[model] || 'gambiarra']; }
function carFullName(c) { return brandOf(c.model).name + ' ' + c.name; }
function carById(id) { return CARS.find((c) => c.id === id) || CARS[0]; }
function carCfg(id) {
  if (!Profile.cars[id]) Profile.cars[id] = { color: PALETTE[CARS.findIndex((c) => c.id === id) % PALETTE.length], up: { motor: 0, cambio: 0, freio: 0, pneu: 0 } };
  return Profile.cars[id];
}
function upgradeCost(carId, upId, lvl) {
  const car = carById(carId), u = UPGRADES.find((x) => x.id === upId);
  return Math.round(u.base[lvl] * (1 + car.price / 16000) / 10) * 10;
}
function carStats(id) {
  const c = carById(id), u = carCfg(id).up;
  return { max: c.max * (1 + 0.05 * u.cambio), acc: c.acc * (1 + 0.1 * u.motor), brk: c.brk * (1 + 0.12 * u.freio), grip: c.grip * (1 + 0.07 * u.pneu), steer: c.steer * (1 + 0.04 * u.pneu), rev: 135 };
}

let player = null;
const _cq = [];
class Player {
  constructor(id) {
    this.x = 0; this.y = 0; this.a = 0; this.vx = 0; this.vy = 0; this.px = 0; this.py = 0;
    this.steer = 0; this.roll = 0; this.lean = 0; this.spin = 0; this.rpm = 900; this.gear = 1;
    this.slip = 0; this.braking = false; this.rev = false; this.highBeam = false; this.thr = 0;
    this.impactCd = 0; this.vf = 0; this.yaw = 0; this.surface = SF.ROAD; this.lastRear = null;
    this.setCar(id);
  }
  setCar(id) { this.car = carById(id); this.m = VMODELS[this.car.model]; this.recalc(); }
  recalc() { this.st = carStats(this.car.id); this.color = carCfg(this.car.id).color; }
  get speed() { return Math.hypot(this.vx, this.vy); }
  place(x, y, a) { this.x = this.px = x; this.y = this.py = y; this.a = a; this.vx = this.vy = 0; this.steer = 0; this.spin = 0; this.lastRear = null; }
  update(dt, inp) {
    const st = this.st, c = Math.cos(this.a), s = Math.sin(this.a);
    let vf = this.vx * c + this.vy * s, vl = -this.vx * s + this.vy * c;
    this.surface = groundAt(this.x, this.y);
    const surf = SURF[this.surface];
    const offK = this.car.offroad ? 0.4 : 1;
    const drag = surf.drag * offK, gripS = this.car.offroad ? lerp(1, surf.grip, 0.45) : surf.grip;
    let maxS = st.max * (1 - Profile.damage / 100 * 0.3), acc = st.acc;
    if (Profile.fuel <= 0) { maxS *= 0.3; acc *= 0.3; }
    this.braking = false;
    // arrancada: pneu patina ao sair forte com o carro parado
    if (inp.thr && !this.prevThr && !inp.brk && Math.abs(vf) < 60 && surf.grip > 0.75) this.launchT = 0.5 + st.acc / 650;
    if (!inp.thr || inp.brk) this.launchT = 0;
    if (this.launchT > 0) this.launchT -= dt;
    if (inp.thr && !inp.brk) {
      if (vf < -8) { vf += st.brk * dt; this.braking = true; if (vf > 0) vf = 0; }
      else { const k = clamp(vf / maxS, 0, 1); vf += acc * (1.08 - k * k) * (this.launchT > 0 ? 0.82 : 1) * dt; }
    } else if (inp.brk) {
      if (vf > 8) { vf -= st.brk * dt; this.braking = true; if (vf < 0) vf = 0; }
      else { vf -= acc * 0.75 * dt; if (vf < -st.rev) vf = -st.rev; }
    } else {
      const eb = (38 + Math.abs(vf) * 0.22) * dt;
      vf = Math.abs(vf) <= eb ? 0 : vf - Math.sign(vf) * eb;
    }
    if (inp.hb) { const hb = 260 * dt; vf = Math.abs(vf) <= hb ? 0 : vf - Math.sign(vf) * hb; }
    vf -= vf * drag * dt;
    if (vf > maxS) vf -= (vf - maxS) * Math.min(1, 3 * dt);
    this.vf = vf;
    // direção progressiva e sensível à velocidade
    const target = inp.steer * 0.42 * st.steer / (1 + Math.abs(vf) / 330);
    const rate = Math.abs(target) > Math.abs(this.steer) && Math.sign(target) === Math.sign(this.steer || target) ? 1.9 : 4.2;
    this.steer += clamp(target - this.steer, -rate * dt, rate * dt);
    const wb = this.m.L * 0.62;
    let yaw = vf / wb * Math.tan(this.steer);
    const latMax = 980 * st.grip * gripS;
    const ylim = latMax / Math.max(60, Math.abs(vf));
    yaw = clamp(yaw, -ylim, ylim);
    // derrapagem: curva fechada em alta velocidade faz a traseira escorregar
    const sMax = 0.42 * st.steer / (1 + Math.abs(vf) / 330);
    const frac = Math.abs(this.steer) / Math.max(0.01, sMax);
    const drift = vf > 0 ? clamp((vf - 210) / 250, 0, 1) * clamp(frac * 1.5 - 0.45, 0, 1) * (this.car.offroad ? 0.7 : 1) : 0;
    this.drift = lerp(this.drift || 0, drift, 1 - Math.exp(-6 * dt));
    if (inp.hb && Math.abs(vf) > 40) yaw *= 1.28;
    yaw *= 1 + 0.22 * this.drift;
    this.yaw = yaw;
    const g = (inp.hb ? 3.4 : 17 * (1 - 0.64 * this.drift)) * st.grip * gripS;
    if (this.drift > 0.05) vl += Math.sign(yaw) * this.drift * Math.abs(vf) * 0.55 * dt;
    vl *= Math.exp(-g * dt);
    this.slip = clamp(Math.abs(vl) / 110 + (this.braking && Math.abs(vf) > 200 ? 0.35 : 0) + (inp.hb && Math.abs(vf) > 70 ? 0.45 : 0) + this.drift * 0.4 + (this.launchT > 0 ? 0.9 : 0), 0, 1.2);
    this.vx = c * vf - s * vl; this.vy = s * vf + c * vl;
    this.a += (yaw + this.spin) * dt;
    this.spin *= Math.exp(-5 * dt);
    this.px = this.x; this.py = this.y;
    this.x += this.vx * dt; this.y += this.vy * dt;
    let impact = this.collide();
    impact = Math.max(impact, this.collideDynamic());
    if (this.inWater()) {
      this.x = this.px; this.y = this.py;
      impact = Math.max(impact, this.speed * 0.6);
      this.vx *= -0.25; this.vy *= -0.25;
    }
    this.impactCd -= dt;
    if (impact > 70 && this.impactCd <= 0) onPlayerImpact(impact);
    // visuais e consumo
    this.roll += vf * dt * 0.35;
    this.lean = lerp(this.lean, clamp(-yaw * vf / 1500, -1, 1), 1 - Math.exp(-8 * dt));
    this.rev = vf < -3 && inp.brk;
    this.thr = lerp(this.thr, inp.thr ? 1 : 0, 1 - Math.exp(-10 * dt));
    const sp = Math.abs(vf);
    const f0 = Profile.fuel;
    Profile.fuel = Math.max(0, Profile.fuel - (0.022 + this.thr * 0.16 * (0.4 + Math.min(1, sp / 400) * 0.6)) * this.car.fuel * dt);
    if (f0 > 15 && Profile.fuel <= 15) toast('Combustível na reserva', 'Procure um posto: Posto Tanque Cheio, no Centrão, ou Posto Estrela Cadente, na BR-101.', 'bad');
    if (f0 > 0 && Profile.fuel <= 0) toast('Tanque vazio!', 'O motor engasga, mas ainda dá para chegar devagar a um posto.', 'bad');
    Profile.dirt = clamp(Profile.dirt + surf.dirt * dt * clamp(sp / 200, 0, 1.5), 0, 1);
    Profile.distance += sp * dt;
    // câmbio automático (para o som e o painel)
    const bounds = [0, 0.18, 0.36, 0.55, 0.76, 1.05];
    const fr = sp / Math.max(1, st.max);
    let gear = 1; while (gear < 5 && fr > bounds[gear]) gear++;
    this.gear = vf < -3 ? -1 : gear;
    const lo = bounds[gear - 1], hi = bounds[gear];
    let rpmT = sp < 6 ? 850 + this.thr * 1600 : 1300 + clamp((fr - lo) / (hi - lo), 0, 1.1) * 5200;
    if (vf < -3) rpmT = 1200 + sp / st.rev * 3000;
    if (this.launchT > 0) rpmT = Math.max(rpmT, 5200);
    this.rpm = lerp(this.rpm, rpmT, 1 - Math.exp(-9 * dt));
    // marcas de pneu e fumaça
    if (this.launchT > 0 && chance(0.5)) {
      const bx = this.x - c * this.m.L * 0.32, by = this.y - s * this.m.L * 0.32, ox2 = -s * (this.m.W / 2 - 2), oy2 = c * (this.m.W / 2 - 2);
      Particles.emit(this.surface === SF.ROAD || this.surface === SF.PAVED ? 'smoke' : 'dust', bx + (chance(0.5) ? ox2 : -ox2) - c * 6, by + (chance(0.5) ? oy2 : -oy2) - s * 6, -c * 40 + rnd(-18, 18), -s * 40 + rnd(-18, 18), rnd(1, 1.8), 8);
    }
    if ((this.slip > 0.45 && sp > 60) || (this.braking && sp > 240) || (this.launchT > 0 && this.surface !== SF.WATER)) {
      const rx = this.x - c * this.m.L * 0.3, ry = this.y - s * this.m.L * 0.3;
      const ox = -s * (this.m.W / 2 - 2.5), oy = c * (this.m.W / 2 - 2.5);
      if (this.lastRear) Skids.add(this.lastRear[0], this.lastRear[1], rx + ox, ry + oy, this.lastRear[2], this.lastRear[3], rx - ox, ry - oy, this.surface);
      this.lastRear = [rx + ox, ry + oy, rx - ox, ry - oy];
      if (chance(0.35)) Particles.emit(this.surface === SF.ROAD || this.surface === SF.PAVED ? 'smoke' : 'dust', rx + (chance(0.5) ? ox : -ox), ry + (chance(0.5) ? oy : -oy), -this.vx * 0.1 + rnd(-10, 10), -this.vy * 0.1 + rnd(-10, 10), rnd(0.8, 1.4), 6);
    } else this.lastRear = null;
    if (sp > 120 && (this.surface === SF.DIRT || this.surface === SF.EARTH || this.surface === SF.FIELD || this.surface === SF.SAND) && chance(0.45)) {
      Particles.emit('dust', this.x - c * this.m.L * 0.5 + rnd(-6, 6), this.y - s * this.m.L * 0.5 + rnd(-6, 6), -this.vx * 0.15, -this.vy * 0.15, rnd(0.8, 1.6), 8);
    }
    let onB = false;
    for (const b of World.bumps) if (this.x > b.x0 && this.x < b.x1 && this.y > b.y0 && this.y < b.y1) { onB = true; break; }
    if (onB && !this.onBump && sp > 80) { Cam.shake = Math.max(Cam.shake, Math.min(9, sp / 45)); AudioSys.thud(); if (sp > 260) { Profile.damage = Math.min(100, Profile.damage + 0.6); } }
    this.onBump = onB;
    // efeitos: fumaça do capô amassado, escapamento e estouro no escape
    const Zf = Profile.zones ? Profile.zones.f : 0;
    if (Zf > 0.45 && !this.lampWarn) { this.lampWarn = true; toast('Farol avariado', 'A frente amassada deixou o farol fraco. Conserte na Oficina do Seu Zé.', 'bad'); }
    if (Zf < 0.2) this.lampWarn = false;
    for (const sd of [-1, 1]) {
      const off = playerLamp(sd) <= 0.01, key = sd < 0 ? 'lampOffL' : 'lampOffR';
      if (off && !this[key] && Game.state === 'playing') toast('Farol ' + (sd < 0 ? 'esquerdo' : 'direito') + ' apagou', 'Esse lado amassou demais. A Oficina do Seu Zé troca a lâmpada.', 'bad');
      this[key] = off;
    }
    if (Zf > 0.45 && chance(0.08 + Zf * 0.25)) Particles.emit(Zf > 0.75 ? 'smoke' : 'steam', this.x + c * this.m.L * 0.38, this.y + s * this.m.L * 0.38, rnd(-10, 10), rnd(-10, 10), rnd(0.8, 1.6), 4);
    if (this.thr > 0.6 && chance(0.12)) Particles.emit('exhaust', this.x - c * this.m.L * 0.52, this.y - s * this.m.L * 0.52, -c * 30 + rnd(-8, 8), -s * 30 + rnd(-8, 8), rnd(0.4, 0.8), 2.5);
    if (this.prevThr > 0.8 && !inp.thr && this.rpm > 4300 && chance(0.6)) { Particles.emit('flame', this.x - c * this.m.L * 0.55, this.y - s * this.m.L * 0.55, -c * 60, -s * 60, 0.18, 5); AudioSys.noise(0.06, 900, 1, 0.25, 'engine', 'lowpass'); AudioSys.tone(70, 0.08, 'square', 0.12, 'engine'); }
    this.prevThr = inp.thr ? 1 : 0;
    if (this.scrapeT > 0) { this.scrapeT -= dt; if (chance(0.25)) AudioSys.noise(0.08, 3400, 3, 0.05, 'engine', 'bandpass'); }
    if (Profile.damage > 70 && chance(0.2)) Particles.emit('smoke', this.x + c * this.m.L * 0.35, this.y + s * this.m.L * 0.35, rnd(-8, 8), rnd(-8, 8), rnd(0.8, 1.5), 5);
  }
  circleOffsets() {
    const r = this.m.W / 2, span = this.m.L / 2 - r;
    return [-span, 0, span];
  }
  collide() {
    const m = this.m, r = m.W / 2 * 0.98;
    const c = Math.cos(this.a), s = Math.sin(this.a);
    const ks = this.circleOffsets();
    let impact = 0;
    colGrid.query(this.x - m.L, this.y - m.L, this.x + m.L, this.y + m.L, _cq);
    if (!_cq.length) return 0;
    for (let iter = 0; iter < 3; iter++) {
      let any = false;
      for (const k of ks) {
        let cx = this.x + c * k, cy = this.y + s * k;
        for (let i = 0; i < _cq.length; i++) {
          const o = _cq[i];
          if (o.dead) continue;
          let nx, ny, pen;
          if (o.t === 0) {
            const qx = clamp(cx, o.x0, o.x1), qy = clamp(cy, o.y0, o.y1);
            const dx = cx - qx, dy = cy - qy, d2 = dx * dx + dy * dy;
            if (d2 >= r * r) continue;
            if (d2 > 1e-6) { const d = Math.sqrt(d2); nx = dx / d; ny = dy / d; pen = r - d; }
            else {
              const l = cx - o.x0, rr = o.x1 - cx, t = cy - o.y0, b = o.y1 - cy, mn = Math.min(l, rr, t, b);
              if (mn === l) { nx = -1; ny = 0; pen = l + r; } else if (mn === rr) { nx = 1; ny = 0; pen = rr + r; } else if (mn === t) { nx = 0; ny = -1; pen = t + r; } else { nx = 0; ny = 1; pen = b + r; }
            }
          } else {
            const dx = cx - o.x, dy = cy - o.y, d2 = dx * dx + dy * dy, R = r + o.r;
            if (d2 >= R * R) continue;
            const d = Math.sqrt(d2) || 0.001; nx = dx / d; ny = dy / d; pen = R - d;
          }
          if (o.brk) {
            const vb = this.vx * nx + this.vy * ny;
            if (-vb > 70) { breakObject(o, this.vx, this.vy, -vb, cx - nx * r, cy - ny * r); this.vx *= 0.82; this.vy *= 0.82; Profile.damage = Math.min(100, Profile.damage + 0.8); if (Profile.zones) Profile.zones.f = Math.min(1, Profile.zones.f + 0.05); continue; }
          }
          this.x += nx * pen; this.y += ny * pen; cx += nx * pen; cy += ny * pen; any = true;
          const vn = this.vx * nx + this.vy * ny;
          // raspando na parede: faíscas e chiado
          const vtan = Math.abs(-this.vx * ny + this.vy * nx);
          if (vtan > 140 && vn > -60) { if (chance(0.5)) Particles.emit('spark', cx - nx * r, cy - ny * r, -this.vx * 0.3 + rnd(-60, 60), -this.vy * 0.3 + rnd(-60, 60), rnd(0.15, 0.35), 2); this.scrapeT = 0.12; }
          if (vn < 0) {
            const jx = -1.25 * vn * nx, jy = -1.25 * vn * ny;
            this.vx += jx; this.vy += jy;
            const tx = -ny, ty = nx, vt = this.vx * tx + this.vy * ty;
            this.vx -= tx * vt * 0.1; this.vy -= ty * vt * 0.1;
            const tau = (c * k) * jy - (s * k) * jx;
            this.spin = clamp(this.spin + tau * 0.00018, -2.5, 2.5);
            if (-vn > impact) { impact = -vn; this.hitX = cx - nx * r; this.hitY = cy - ny * r; }
          }
        }
      }
      if (!any) break;
    }
    return impact;
  }
  collideDynamic() {
    const m = this.m, r = m.W / 2;
    const c = Math.cos(this.a), s = Math.sin(this.a);
    const ks = this.circleOffsets();
    let impact = 0;
    for (const ai of Traffic.cars) {
      const dx0 = ai.x - this.x, dy0 = ai.y - this.y;
      if (dx0 * dx0 + dy0 * dy0 > 160 * 160) continue;
      const ac = Math.cos(ai.a), as = Math.sin(ai.a), ar = ai.m.W / 2;
      const aks = ai.circles;
      for (const k of ks) {
        let cx = this.x + c * k, cy = this.y + s * k;
        for (const ak of aks) {
          const ox = ai.x + ac * ak, oy = ai.y + as * ak;
          const dx = cx - ox, dy = cy - oy, d2 = dx * dx + dy * dy, R = r + ar;
          if (d2 >= R * R) continue;
          const d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d, pen = R - d;
          this.x += nx * pen; this.y += ny * pen; cx += nx * pen; cy += ny * pen;
          const avx = ac * ai.v, avy = as * ai.v;
          const vn = (this.vx - avx) * nx + (this.vy - avy) * ny;
          if (vn < 0) {
            const share = ai.mass / (ai.mass + 1);
            this.vx -= 1.3 * vn * nx * share; this.vy -= 1.3 * vn * ny * share;
            const tau = (c * k) * (-vn * ny) - (s * k) * (-vn * nx);
            this.spin = clamp(this.spin + tau * 0.00015, -2.5, 2.5);
            if (-vn > impact) { impact = -vn; this.hitX = cx - nx * r; this.hitY = cy - ny * r; }
            ai.hit(-vn, -nx, -ny);
          }
        }
      }
    }
    for (const an of Animals.list) {
      if (an.type === 'owl') continue;
      const dx0 = an.x - this.x, dy0 = an.y - this.y;
      if (dx0 * dx0 + dy0 * dy0 > 80 * 80) continue;
      for (const k of ks) {
        const cx = this.x + c * k, cy = this.y + s * k;
        const dx = an.x - cx, dy = an.y - cy, d2 = dx * dx + dy * dy, R = r + an.r;
        if (d2 >= R * R) continue;
        const d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d, pen = R - d;
        const heavy = an.r > 8;
        an.x += nx * pen * (heavy ? 0.4 : 1); an.y += ny * pen * (heavy ? 0.4 : 1);
        if (heavy) { this.x -= nx * pen * 0.6; this.y -= ny * pen * 0.6; this.vx *= 0.97; this.vy *= 0.97; }
        an.scare(this.x, this.y, true);
      }
    }
    return impact;
  }
  inWater() {
    const c = Math.cos(this.a), s = Math.sin(this.a), hl = this.m.L / 2 - 3, hw = this.m.W / 2 - 3;
    for (const [u, v] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw], [0, 0]]) {
      if (groundAt(this.x + c * u - s * v, this.y + s * u + c * v) === SF.WATER) return true;
    }
    return false;
  }
}

/* ============================ TRÁFEGO (IA) ============================ */
const Traffic = { cars: [], idc: 1, timer: 0, cum: null, total: 0 };
function trafficRush() {
  // 19:30–21:00 saída do trabalho; 04:30–05:00 gente indo trabalhar; madrugada vazia
  const t = Profile.time;
  if (t < 21 * 60) return { k: 1.45, label: 'horário de pico' };
  if (t < 23 * 60) return { k: 1.0, label: '' };
  if (t < 25 * 60) return { k: 0.72, label: '' };
  if (t < 28 * 60 + 30) return { k: 0.42, label: 'madrugada' };
  return { k: 1.2, label: 'horário de pico' };
}
// área rural: 60% menos movimento que na cidade
function ruralFactor(x, y) { const R = REGIONS[regionKeyAt(x, y)]; return 1 - 0.8 * clamp((R.rural - 0.3) / 0.5, 0, 1); }
function trafficMax() {
  const base = Settings.quality === 'alta' ? 22 : Settings.quality === 'baixa' ? 10 : 17;
  const k = Cam && Cam.x !== undefined ? ruralFactor(Cam.x, Cam.y) : 1;
  return Math.max(k < 0.7 ? 2 : 5, Math.round(base * trafficRush().k * k));
}
function lightState(n, axis, now) {
  const t = (now + n.light.off) % 15;
  if (axis === 'H') return t < 6 ? 'G' : t < 7.5 ? 'Y' : 'R';
  return t >= 8 && t < 13 ? 'G' : t >= 13 && t < 14.5 ? 'Y' : 'R';
}
function wpick(list) {
  let tot = 0; for (const it of list) tot += it[1];
  let r = rnd(tot);
  for (const it of list) { r -= it[1]; if (r <= 0) return it[0]; }
  return list[0][0];
}
function trafficModelFor(e) {
  switch (e.T.id) {
    case 'dirt': return wpick([['pickup', 4.5], ['tractor', 2.6], ['truck', 1.0], ['cacamba', 0.4], ['quadrado', 0.9], ['besouro', 0.7], ['moto', 0.9]]);
    case 'highway': return wpick([['truck', 1.5], ['bau', 1.4], ['tanker', 0.8], ['gas', 0.5], ['cacamba', 0.6], ['bus', 1.2], ['santana', 2], ['sedan', 1.5], ['quadrado', 1.5], ['escada', 1.2], ['hatch', 1], ['pickup', 2], ['van', 0.8], ['sport', 0.4], ['police', 0.5]]);
    case 'road': return wpick([['pickup', 4], ['tractor', 1.4], ['truck', 1.6], ['bau', 0.7], ['cacamba', 0.5], ['gas', 0.3], ['quadrado', 1], ['santana', 0.8], ['besouro', 0.6], ['moto', 0.6]]);
    case 'avenue': return wpick([['quadrado', 2.5], ['escada', 2], ['besouro', 1.2], ['hatch', 1.5], ['santana', 2], ['sedan', 1.5], ['taxi', 1.5], ['bus', 1.1], ['pickup', 1.2], ['van', 1], ['sport', 0.5], ['truck', 0.4], ['moto', 1.8], ['police', 0.6]]);
    default: return wpick([['gas', 0.35], ['quadrado', 3], ['escada', 2.5], ['besouro', 2], ['hatch', 1.5], ['santana', 2], ['sedan', 1], ['taxi', 1], ['pickup', 1.5], ['van', 1.2], ['sport', 0.5], ['moto', 2.2], ['police', 0.35]]);
  }
}
class AICar {
  constructor(e, dir, s, lane, model) {
    this.id = Traffic.idc++;
    this.m = VMODELS[model]; this.model = model;
    this.horn = model === 'moto' ? 'moto' : model === 'tractor' ? 'trator' : model === 'bus' ? 'onibus' : VMODELS[model].kind === 'truck' ? 'caminhao' : model === 'besouro' || model === 'van' ? pick(['fusquinha', 'fusquinha', 'dupla']) : model === 'sport' || model === 'muscle' ? pick(['esportivo', 'musical']) : pick(['dupla', 'dupla', 'fina', 'fina', 'musical', 'esportivo']);
    this.big = this.m.kind === 'truck' || model === 'bus';
    this.color = model === 'taxi' || model === 'police' ? '#f2f2ee' : model === 'bus' ? pick(['#2a6fd1', '#d13a2a', '#1f9a5a', '#e0a020']) : model === 'tractor' ? pick(['#2e8b3a', '#c0392b', '#2e5fae']) : pick(CAR_COLORS);
    this.box = pick(['#d9d6cc', '#e8e8e8', '#c9c3b5', '#d07a2a', '#5a7aa0']);
    this.mass = this.big ? 6 : model === 'tractor' ? 3 : model === 'moto' ? 0.7 : 1.6;
    this.vmax = this.m.kind === 'truck' ? 235 : model === 'bus' ? 190 : model === 'tractor' ? 70 : model === 'van' ? 205 : 1e9;
    this.acc = this.big ? 70 : model === 'tractor' ? 45 : model === 'moto' ? 190 : rnd(120, 160);
    this.turnV = this.big ? 55 : model === 'tractor' ? 40 : model === 'moto' ? 92 : 82;
    this.mul = rnd(0.85, 1.1);
    const r = this.m.W / 2, span = Math.max(0, this.m.L / 2 - r);
    const n = Math.max(2, Math.ceil(this.m.L / (this.m.W * 1.1)));
    this.circles = []; for (let i = 0; i < n; i++) this.circles.push(-span + 2 * span * i / (n - 1));
    this.alive = true; this.wait = 0; this.ghost = 0; this.hitT = 0; this.ox = 0; this.oy = 0; this.honkT = rnd(1, 3);
    this.roll = 0; this.state = 'edge'; this.blink = 0; this.braking = false; this.v = 0;
    if (this.big) lane = 1;
    this.setEdge(e, dir, lane);
    this.s = clamp(s, this.sStart, this.sEnd);
    this.v = this.cruise * 0.8;
    this.chooseNext();
    this.pose();
  }
  setEdge(e, dir, lane) {
    this.e = e; this.dir = dir;
    this.from = dir > 0 ? e.a : e.b; this.to = dir > 0 ? e.b : e.a;
    this.dx = e.dx * dir; this.dy = e.dy * dir;
    this.lane = Math.min(lane, e.T.lanes.length - 1);
    this.off = e.T.lanes[this.lane];
    this.sStart = dir > 0 ? e.clearA : e.clearB;
    this.sEnd = Math.max(this.sStart, e.len - (dir > 0 ? e.clearB : e.clearA));
    this.cruise = Math.min(e.T.speed * this.mul, this.vmax);
    this.committed = false;
    this.offT = this.off; this.overtake = 0; this.lcBlink = 0;
  }
  edgePos(s) { return [this.from.x + this.dx * s - this.dy * this.off, this.from.y + this.dy * s + this.dx * this.off]; }
  allowed(e) {
    if (this.model === 'bus' && e.T.id === 'dirt') return false;
    if (this.model === 'tractor' && (e.T.id === 'highway' || e.T.id === 'avenue' || e.T.id === 'street')) return false;
    if (this.m.kind === 'truck' && e.T.id === 'street' && chance(0.7)) return false;
    return true;
  }
  chooseNext() {
    const n = this.to;
    let opts = n.edges.filter((x) => x !== this.e && this.allowed(x));
    if (!opts.length) opts = n.edges.filter((x) => x !== this.e);
    let ne, nd;
    if (!opts.length) { ne = this.e; nd = -this.dir; }
    else {
      const weighted = opts.map((x) => { const d = x.a === n ? 1 : -1; const dot = this.dx * x.dx * d + this.dy * x.dy * d; return [x, dot > 0.5 ? 2.3 : 1]; });
      ne = wpick(weighted); nd = ne.a === n ? 1 : -1;
    }
    const ox = ne.dx * nd, oy = ne.dy * nd;
    const dot = this.dx * ox + this.dy * oy, cross = this.dx * oy - this.dy * ox;
    this.turnType = dot > 0.5 ? 'straight' : dot < -0.5 ? 'uturn' : cross > 0 ? 'right' : 'left';
    let lane = this.lane;
    if (ne.T.lanes.length > 1) { if (this.big) lane = 1; else if (this.turnType === 'right') lane = 1; else if (this.turnType === 'left') lane = 0; else lane = this.lane; } else lane = 0;
    this.next = { e: ne, dir: nd, lane };
    this.blink = this.turnType === 'right' ? 1 : this.turnType === 'left' || this.turnType === 'uturn' ? -1 : 0;
  }
  exitBlocked() {
    const N = this.next;
    for (const o of Traffic.cars) {
      if (o === this || o.state !== 'edge' || o.e !== N.e || o.dir !== N.dir) continue;
      if (o.s - o.sStart < this.m.L + 26 && o.v < 60) return true;
    }
    if (player && Game.state !== 'menu') {
      const T = this.planTurn();
      for (let i = 2; i < T.pts.length - 1; i++) { const q = T.pts[i]; if (Math.hypot(q[0] - player.x, q[1] - player.y) < player.m.W * 0.5 + 14) return true; }
    }
    return false;
  }
  planTurn() {
    if (this.plan && this.plan.e === this.e && this.plan.dir === this.dir && this.plan.ne === this.next.e && this.plan.nd === this.next.dir && this.plan.off === this.off) return this.plan;
    const p0 = this.edgePos(this.sEnd);
    const N = this.next, ne = N.e, nd = N.dir;
    const ox = ne.dx * nd, oy = ne.dy * nd;
    const off = ne.T.lanes[Math.min(N.lane, ne.T.lanes.length - 1)];
    const s0 = nd > 0 ? ne.clearA : ne.clearB;
    const n = this.to;
    const p3 = [n.x + ox * s0 - oy * off, n.y + oy * s0 + ox * off];
    let k1, k2;
    if (this.turnType === 'uturn') { k1 = 45; k2 = 45; }
    else if (this.turnType === 'straight') { k1 = k2 = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) / 3; }
    else { k1 = Math.max(4, ((p3[0] - p0[0]) * this.dx + (p3[1] - p0[1]) * this.dy) * 0.55); k2 = Math.max(4, ((p3[0] - p0[0]) * ox + (p3[1] - p0[1]) * oy) * 0.55); }
    const c1 = [p0[0] + this.dx * k1, p0[1] + this.dy * k1], c2 = [p3[0] - ox * k2, p3[1] - oy * k2];
    let len = 0, lx = p0[0], ly = p0[1];
    const pts = [p0];
    for (let i = 1; i <= 12; i++) { const q = bez(p0, c1, c2, p3, i / 12); len += Math.hypot(q[0] - lx, q[1] - ly); lx = q[0]; ly = q[1]; pts.push(q); }
    this.plan = { e: this.e, dir: this.dir, ne, nd, off: this.off, p0, c1, c2, p3, len: Math.max(len, 1), pts, node: n };
    return this.plan;
  }
  conflicts(n) {
    // dois trajetos dentro do cruzamento que passam a menos de ~22px um do outro não entram juntos
    if (!n.active) n.active = new Set();
    const A = this.planTurn().pts;
    for (const o of n.active) {
      if (o === this || !o.alive) { if (!o.alive) n.active.delete(o); continue; }
      if (o.e === this.e && o.dir === this.dir && o.lane === this.lane) continue; // mesma fila: segue atrás
      const B = (o.state === 'turn' ? o.turn : o.plan);
      if (!B) continue;
      const tStart = o.state === 'turn' ? Math.floor(o.turn.t * 12) : 0;
      for (const p of A) for (let j = tStart; j < B.pts.length; j++) { const q = B.pts[j]; const dx = p[0] - q[0], dy = p[1] - q[1]; if (dx * dx + dy * dy < 22 * 22) return true; }
    }
    return false;
  }
  laneClear(off2, back, fwd) {
    const nx = -this.dy, ny = this.dx;
    const test = (ox, oy) => {
      const al = (ox - this.x) * this.dx + (oy - this.y) * this.dy;
      if (al < back || al > fwd) return true;
      const lat = (ox - this.from.x) * nx + (oy - this.from.y) * ny;
      return Math.abs(lat - off2) > 20;
    };
    for (const o of Traffic.cars) if (o !== this && !test(o.x, o.y)) return false;
    if (player && Game.state !== 'menu' && !test(player.x, player.y)) return false;
    return true;
  }
  tryPass() {
    const T = this.e.T, bl = this.blocker;
    const bv = bl === player ? player.speed : (bl.v || 0);
    if (bv > this.cruise - 12) return;
    if (T.lanes.length > 1 && !this.big) {
      const L2 = 1 - this.lane, off2 = T.lanes[L2];
      if (this.laneClear(off2, -70, 120)) { this.lane = L2; this.offT = off2; this.lcT = 3.5; }
      else this.lcT = 0.6;
    } else if (T.lanes.length === 1 && (bl === player || (bl instanceof AICar && bl.hitT > 0)) && this.wait > 1.8 && this.overtake <= 0 && bv < 25) {
      const off2 = -T.lanes[0];
      if (this.laneClear(off2, -40, 280)) { this.offT = off2; this.overtake = 4; this.lcT = 6; }
      else this.lcT = 1;
    }
  }
  canEnter(remain, now) {
    const n = this.to;
    if (this.exitBlocked()) return false;
    if (n.light) {
      const st = lightState(n, this.e.h ? 'H' : 'V', now);
      const go = st === 'G' || (st === 'Y' && remain < 25);
      if (go && this.conflicts(n)) return false;
      if (go && (this.turnType === 'left' || this.turnType === 'uturn')) {
        for (const o of Traffic.cars) {
          if (o === this || o.e.h !== this.e.h || o.dir === this.dir || o.turnType === 'left') continue;
          if (o.state === 'edge' && o.to === n && o.sEnd - o.s < 150 && o.v > 10) return false;
          if (o.state === 'turn' && o.turn.node === n && o.turnType === 'straight') return false;
        }
      }
      return go;
    }
    if (n.edges.length >= 3) return !this.conflicts(n);
    return true;
  }
  startTurn() {
    const P = this.planTurn();
    this.turn = { p0: P.p0, c1: P.c1, c2: P.c2, p3: P.p3, len: P.len, pts: P.pts, t: 0, node: P.node };
    if (!P.node.active) P.node.active = new Set();
    P.node.active.add(this);
    this.state = 'turn';
  }
  finishTurn() {
    const n = this.turn.node;
    if (n.active) n.active.delete(this);
    this.plan = null;
    this.setEdge(this.next.e, this.next.dir, this.next.lane);
    this.s = this.sStart; this.state = 'edge';
    this.chooseNext();
  }
  hit(imp, nx, ny) {
    addZoneDamage(this.zones || (this.zones = { f: 0, r: 0, l: 0, rt: 0 }), this, this.x - nx * 20, this.y - ny * 20, clamp((imp - 40) / 300, 0, 1));
    this.hitT = Math.max(this.hitT, 0.8 + Math.min(2, imp / 250));
    const k = Math.min(10, imp * 0.03) / this.mass * 1.6;
    this.ox += nx * k; this.oy += ny * k;
    if (imp > 60) this.honkT = Math.min(this.honkT, 0.3);
  }
  scanAhead() {
    const look = 34 + this.v * 1.15 + this.m.L / 2;
    const c = Math.cos(this.a), s = Math.sin(this.a);
    const lat = this.state === 'turn' ? 14 : 13;
    let best = 1e9; this.blocker = null;
    const check = (o, ox, oy, oL, oW) => {
      const rx = ox - this.x, ry = oy - this.y;
      const f = rx * c + ry * s;
      if (f <= 0 || f > look + oL / 2) return;
      const l = -rx * s + ry * c;
      if (Math.abs(l) > lat + oW * 0.5) return;
      const g = f - this.m.L / 2 - oL / 2;
      if (g < best) { best = g; this.blocker = o; }
    };
    if (this.ghost <= 0) for (const o of Traffic.cars) {
      if (o === this) continue;
      if (this.state === 'turn' && o.state === 'edge' && o.e !== this.next.e && Math.abs(angDiff(o.a, this.a)) > 0.9) continue; // parado na faixa de retenção da outra rua
      check(o, o.x, o.y, o.m.L, o.m.W);
    }
    // o jogador é visto de mais longe e com folga lateral maior: os carros mantêm distância de você
    if (player && Game.state !== 'menu') { const m = this.state === 'edge' ? 1 : 0; check(player, player.x, player.y, player.m.L + 26 * m, player.m.W + 12 * m); }
    if (this.ghost <= 0 && this.animalGhost <= 0) for (const an of Animals.list) if (an.onRoad) check(an, an.x, an.y, an.r * 2, an.r * 2);
    return best;
  }
  update(dt, now) {
    let target = this.cruise;
    const gap = this.scanAhead();
    if (this.state === 'edge') {
      const remain = this.sEnd - this.s;
      if (this.turnType !== 'straight') target = Math.min(target, this.turnV + remain * 0.9);
      const firstInLine = !(gap < remain + 4 && this.blocker instanceof AICar && this.blocker.state === 'edge' && this.blocker.e === this.e);
      // cansou de esperar na faixa de retenção sem ser sinal vermelho: escolhe outro caminho
      if (!this.committed && firstInLine && this.wait > 8 && remain < 30 && !(this.to.light && lightState(this.to, this.e.h ? 'H' : 'V', now) !== 'G')) {
        const old = this.next.e; this.chooseNext(); if (this.next.e === old && this.to.edges.length > 2) this.chooseNext();
        this.plan = null; this.wait = 3;
      }
      if (!this.committed && firstInLine && remain < 40 + this.v * 0.9) {
        if (this.canEnter(remain, now)) { this.committed = true; if (!this.to.active) this.to.active = new Set(); this.planTurn(); this.to.active.add(this); }
        else { target = Math.min(target, Math.max(0, (remain - 2) * 2.2)); this.atLight = !!this.to.light; }
      }
    } else target = this.turnType === 'straight' ? this.cruise : this.turnV;
    if (gap < 1e9) {
      const bl = this.blocker;
      let bv = 0;
      if (bl === player) bv = Math.max(0, player.vx * Math.cos(this.a) + player.vy * Math.sin(this.a));
      else if (bl instanceof AICar) bv = Math.max(0, bl.v * Math.cos(bl.a - this.a));
      const keep = bl === player ? 34 : 14; // distância de segurança maior atrás de você
      target = Math.min(target, Math.max(0, bv + (gap - keep) * 1.1), Math.max(0, (gap - keep * 0.5) * 3));
    }
    // ultrapassagem / troca de faixa
    this.lcT = (this.lcT || 0) - dt;
    if (this.state === 'edge' && gap < 110 && this.blocker && !(this.blocker instanceof Animal) && this.lcT <= 0 && this.sEnd - this.s > 170) this.tryPass();
    if (this.overtake > 0) {
      this.overtake -= dt;
      const passed = player && ((player.x - this.x) * this.dx + (player.y - this.y) * this.dy) < -this.m.L - 10;
      if (this.overtake <= 0 || passed || this.sEnd - this.s < 120 || !this.laneClear(this.offT, 0, 140)) { this.overtake = 0; this.offT = this.e.T.lanes[this.lane]; }
    }
    // desvio leve: se você está meio dentro da faixa à frente, ele se afasta um pouco dentro da pista
    this.nudge = (this.nudge || 0) * Math.exp(-2 * dt);
    if (player && this.state === 'edge' && Game.state !== 'menu') {
      const rx = player.x - this.x, ry = player.y - this.y, f = rx * this.dx + ry * this.dy;
      if (f > 0 && f < 60 + this.v * 1.2) {
        const l = -rx * this.dy + ry * this.dx, room = 8;
        if (Math.abs(l) < 34 && Math.abs(l) > 6) { const nd = clamp(-Math.sign(l) * (34 - Math.abs(l)) * 0.5, -room, room); if (this.e.T.lanes.length === 1 || this.laneClear(this.offT + nd, -40, 80)) this.nudge = nd; }
      }
    }
    const dOff = this.offT + this.nudge - this.off;
    this.off += clamp(dOff, -42 * dt, 42 * dt);
    this.lcBlink = Math.abs(dOff) > 2 ? (dOff > 0 ? 1 : -1) : 0;
    if (this.hitT > 0) { this.hitT -= dt; target = 0; }
    this.ghost -= dt;
    if (this.v < 5 && target < 5) this.wait += dt; else this.wait = Math.max(0, this.wait - dt * 2);
    if (this.wait > 4 && gap < 1e9 && this.ghost <= 0 && this.blockCycle()) { this.ghost = 2; this.wait = 0; }
    // bicho na pista: buzina, espanta e, se não sair, contorna
    this.animalGhost = (this.animalGhost || 0) - dt;
    if (this.blocker instanceof Animal && this.v < 5) {
      this.animalWait = (this.animalWait || 0) + dt;
      if (this.animalWait > 1.2 && this.blocker.state !== 'flee') this.blocker.scare(this.x, this.y, true);
      if (this.animalWait > 3) { this.animalGhost = 2; this.animalWait = 0; }
    } else this.animalWait = 0;
    if (this.v > 8) this.atLight = false;
    this.honkT -= dt;
    if (this.honkT <= 0) {
      this.honkT = rnd(2.5, 4.5);
      if (player && Game.state === 'playing' && ((this.blocker === player && (this.wait > 2 || (gap < 26 && this.v > 70))) || this.hitT > 0)) {
        const d = Math.hypot(this.x - player.x, this.y - player.y), pan = (this.x - player.x) / 500;
        AudioSys.aiHorn(d, this.horn, pan, this.wait > 6);
        this.honking = this.wait > 6 ? 0.9 : 0.4;
      }
    }
    if (this.honking > 0) this.honking -= dt;
    this.braking = target < this.v - 5;
    if (this.v < target) this.v = Math.min(target, this.v + this.acc * dt);
    else this.v = Math.max(target, this.v - (this.hitT > 0 ? 600 : 380) * dt);
    if (this.state === 'edge') {
      this.s += this.v * dt;
      if (this.s >= this.sEnd) { if (this.committed) this.startTurn(); else { this.s = this.sEnd; this.v = 0; } }
    } else {
      this.turn.t += this.v * dt / this.turn.len;
      if (this.turn.t >= 1) this.finishTurn();
    }
    this.ox *= Math.exp(-2.5 * dt); this.oy *= Math.exp(-2.5 * dt);
    this.roll += this.v * dt * 0.35;
    // poeira levantada na estrada de terra
    if (this.v > 50 && (this.state === 'edge' ? this.e.T.id === 'dirt' : this.dirtTurn) && chance(dt * 9)) {
      const v = Cam.view;
      if (v && this.x > v.x0 - 60 && this.x < v.x1 + 60 && this.y > v.y0 - 60 && this.y < v.y1 + 60) {
        const c = Math.cos(this.a), s = Math.sin(this.a), L = this.m.L * 0.5;
        Particles.emit('dust', this.x - c * L + rnd(-6, 6), this.y - s * L + rnd(-6, 6), -c * this.v * 0.12, -s * this.v * 0.12, rnd(0.9, 1.7), 8);
      }
    }
    this.pose();
  }
  pose() {
    if (this.state === 'edge') {
      const p = this.edgePos(this.s);
      this.x = p[0] + this.ox; this.y = p[1] + this.oy; this.a = Math.atan2(this.dy, this.dx);
      this.steerVis = 0;
    } else {
      const T = this.turn, p = bez(T.p0, T.c1, T.c2, T.p3, T.t), d = bezD(T.p0, T.c1, T.c2, T.p3, T.t);
      this.x = p[0] + this.ox; this.y = p[1] + this.oy; this.a = Math.atan2(d[1], d[0]);
      this.steerVis = this.turnType === 'right' ? 0.35 : this.turnType === 'straight' ? 0 : -0.35;
    }
  }
  blockCycle() {
    let o = this.blocker, k = 0;
    while (o && o !== player && o instanceof AICar && k < 5) { if (o === this) return true; o = o.blocker; k++; }
    return false;
  }
  release() {
    this.alive = false;
    for (const n of [this.to, this.from]) if (n.active) n.active.delete(this);
    if (this.turn && this.turn.node.active) this.turn.node.active.delete(this);
  }
}
function bez(p0, c1, c2, p3, t) {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p0[0] + b * c1[0] + c * c2[0] + d * p3[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p3[1]];
}
function bezD(p0, c1, c2, p3, t) {
  const u = 1 - t;
  return [3 * u * u * (c1[0] - p0[0]) + 6 * u * t * (c2[0] - c1[0]) + 3 * t * t * (p3[0] - c2[0]), 3 * u * u * (c1[1] - p0[1]) + 6 * u * t * (c2[1] - c1[1]) + 3 * t * t * (p3[1] - c2[1])];
}
Traffic.prepare = function () {
  let acc = 0;
  this.cum = World.edges.map((e) => (acc += e.len));
  this.total = acc;
};
Traffic.randomEdge = function () {
  const r = rnd(this.total);
  let lo = 0, hi = this.cum.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (this.cum[mid] < r) lo = mid + 1; else hi = mid; }
  return World.edges[lo];
};
Traffic.spawnNear = function (cx, cy, minD, maxD, view) {
  for (let t = 0; t < 24; t++) {
    const e = this.randomEdge();
    const dir = chance(0.5) ? 1 : -1;
    const sStart = dir > 0 ? e.clearA : e.clearB, sEnd = e.len - (dir > 0 ? e.clearB : e.clearA);
    if (sEnd - sStart < 80) continue;
    const s = rnd(sStart + 20, sEnd - 20);
    const fx = dir > 0 ? e.a : e.b;
    const dx = e.dx * dir, dy = e.dy * dir;
    const lane = e.T.lanes.length > 1 ? (chance(0.5) ? 1 : 0) : 0;
    const off = e.T.lanes[lane];
    const x = fx.x + dx * s - dy * off, y = fx.y + dy * s + dx * off;
    const d = Math.hypot(x - cx, y - cy);
    if (d < minD || d > maxD) continue;
    if (view && x > view.x0 - 80 && x < view.x1 + 80 && y > view.y0 - 80 && y < view.y1 + 80) continue;
    let ok = true;
    for (const o of this.cars) if (Math.abs(o.x - x) < 90 && Math.abs(o.y - y) < 90) { ok = false; break; }
    if (player && Math.abs(player.x - x) < 120 && Math.abs(player.y - y) < 120) ok = false;
    if (!ok) continue;
    // estradas da roça recebem bem menos carros
    if ((e.T.id === 'dirt' || e.T.id === 'road') && !chance(0.22)) continue;
    const model = trafficModelFor(e);
    const car = new AICar(e, dir, s, lane, model);
    if (!car.allowed(e)) { car.release(); continue; }
    this.cars.push(car);
    return car;
  }
  return null;
};
Traffic.fill = function (cx, cy) {
  for (const c of this.cars) c.release();
  this.cars.length = 0;
  for (const n of World.nodes) n.res = null;
  const mx = trafficMax();
  for (let i = 0; i < mx; i++) this.spawnNear(cx, cy, 160, 2100, null);
};
Traffic.update = function (dt, now, cx, cy, view) {
  for (const c of this.cars) c.update(dt, now);
  // vigia anti-travamento: carro parado tempo demais sem ser por sinal vermelho nem pelo jogador
  for (const c of this.cars) {
    if (c.wait < 13) continue;
    let o = c, light = false, k = 0;
    while (o && k < 10) { if (o === player) { light = true; break; } if (o.atLight) { light = true; break; } o = o.blocker instanceof AICar ? o.blocker : null; k++; }
    if (light) continue;
    const v = Cam.view, vis = c.x > v.x0 - 60 && c.x < v.x1 + 60 && c.y > v.y0 - 60 && c.y < v.y1 + 60;
    if (!vis) { c.release(); c.dead = true; continue; }
    c.ghost = 2; c.animalGhost = 2; c.wait = 0;
  }
  if (this.cars.some((c) => c.dead)) this.cars = this.cars.filter((c) => !c.dead);
  this.timer -= dt;
  if (this.timer <= 0) {
    this.timer = 0.4;
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const c = this.cars[i];
      if (Math.abs(c.x - cx) > 2700 || Math.abs(c.y - cy) > 2300) { c.release(); this.cars.splice(i, 1); }
    }
    const mx = trafficMax();
    let n = 0;
    while (this.cars.length < mx && n++ < 3) this.spawnNear(cx, cy, 700, 2200, view);
    // menos carros fora do pico: tira um por vez, longe da tela
    if (this.cars.length > mx) {
      let far = -1, fd = 0;
      this.cars.forEach((c, i) => { const v = Cam.view; if (c.x > v.x0 - 80 && c.x < v.x1 + 80 && c.y > v.y0 - 80 && c.y < v.y1 + 80) return; const d = Math.hypot(c.x - cx, c.y - cy); if (d > fd) { fd = d; far = i; } });
      if (far >= 0) { this.cars[far].release(); this.cars.splice(far, 1); }
    }
  }
};

/* ============================ ANIMAIS ============================ */
const Animals = { list: [], soundT: 3 };
const ANIMAL = {
  cow: { r: 11, walk: 12, flee: 55, scare: 110 },
  horse: { r: 10, walk: 22, flee: 95, scare: 130 },
  chicken: { r: 3, walk: 16, flee: 70, scare: 90 },
  dog: { r: 6, walk: 38, flee: 120, scare: 120 },
  capybara: { r: 7, walk: 9, flee: 40, scare: 70 },
  owl: { r: 3, walk: 0, flee: 0, scare: 0 },
  person: { r: 4, walk: 20, flee: 85, scare: 95 },
};
class Animal {
  constructor(type, rect) {
    this.type = type; this.rect = rect; this.P = ANIMAL[type]; this.r = this.P.r;
    this.x = rnd(rect[0], rect[2]); this.y = rnd(rect[1], rect[3]);
    if (type === 'owl') {
      const side = rndi(0, 3);
      if (side === 0) this.y = rect[1]; else if (side === 1) this.y = rect[3]; else if (side === 2) this.x = rect[0]; else this.x = rect[2];
    }
    this.a = rnd(TAU); this.state = 'idle'; this.t = rnd(0, 3); this.tx = this.x; this.ty = this.y;
    this.phase = rnd(TAU); this.seed = rnd(); this.v = 0; this.onRoad = false; this.blinkT = rnd(2, 6);
    if (type === 'person') {
      this.col = chance(0.15) ? '#f7d000' : pick(['#e63946', '#3a86ff', '#2a9d8f', '#f1f1f1', '#22223b', '#ff7f11', '#8338ec', '#2bb24c', '#b5838d', '#14213d', '#d62828']);
      this.skin = pick(['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5a3a22', '#ffdbac']);
      this.hair = pick(['#1a1410', '#2a1a10', '#4a2e1a', '#8a6a3a', '#d8c08a', '#1a1410']);
      this.pants = pick(['#2b3a55', '#1d1d1f', '#5a4a3a', '#3a5a7a']);
    }
    this.col = this.col || (type === 'cow' ? pick(['#ece7dc', '#ece7dc', '#8a5a3a', '#2a2420']) : type === 'horse' ? pick(['#6a4026', '#3a2618', '#d8cfc0', '#8a5a34']) : type === 'chicken' ? pick(['#f2efe6', '#b56a2a', '#3a2a1e']) : type === 'dog' ? pick(['#c98a3a', '#c98a3a', '#2a2420', '#e8e0d0', '#7a5a3a']) : '#7a5a3c');
  }
  scare(px, py, hard) {
    if (this.type === 'owl') return;
    if (this.state !== 'flee' && this.type === 'dog' && Game.state === 'playing') AudioSys.bark(player ? Math.hypot(this.x - player.x, this.y - player.y) : 400);
    this.state = 'flee'; this.t = hard ? 2.2 : 1.6;
    const a = Math.atan2(this.y - py, this.x - px) + rnd(-0.5, 0.5);
    this.tx = clamp(this.x + Math.cos(a) * 160, this.rect[0], this.rect[2]);
    this.ty = clamp(this.y + Math.sin(a) * 160, this.rect[1], this.rect[3]);
  }
  update(dt) {
    this.phase += dt * (this.state === 'idle' ? 2 : 8 + this.v * 0.1);
    if (this.type === 'owl') { this.blinkT -= dt; if (this.blinkT < -0.15) this.blinkT = rnd(2, 6); return; }
    if (player && Game.state === 'playing') {
      const d = Math.hypot(player.x - this.x, player.y - this.y);
      const sp = player.speed;
      if (d < this.P.scare && sp > 50 && this.state !== 'flee') this.scare(player.x, player.y, false);
      if (d < 260 && AudioSys.hornOn && this.state !== 'flee') this.scare(player.x, player.y, false);
    }
    this.t -= dt;
    if (this.state === 'idle' || this.state === 'graze') {
      this.v = 0;
      if (this.t <= 0) {
        if (chance(0.55)) { this.state = 'walk'; this.tx = rnd(this.rect[0], this.rect[2]); this.ty = rnd(this.rect[1], this.rect[3]); this.t = 8; }
        else { this.state = (this.type === 'cow' || this.type === 'horse' || this.type === 'chicken' || this.type === 'capybara') && chance(0.6) ? 'graze' : 'idle'; this.t = rnd(2, 6); }
      }
    } else {
      const spd = this.state === 'flee' ? this.P.flee : this.P.walk;
      const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
      if (d < 4 || this.t <= 0) { this.state = 'idle'; this.t = rnd(1, 4); this.v = 0; }
      else {
        const ta = Math.atan2(dy, dx);
        this.a += clamp(angDiff(this.a, ta), -4 * dt, 4 * dt);
        this.v = spd;
        this.x += Math.cos(this.a) * spd * dt; this.y += Math.sin(this.a) * spd * dt;
        this.x = clamp(this.x, this.rect[0], this.rect[2]); this.y = clamp(this.y, this.rect[1], this.rect[3]);
      }
    }
    const g = groundAt(this.x, this.y);
    this.onRoad = g === SF.ROAD || g === SF.DIRT || g === SF.BRIDGE;
  }
}
Animals.build = function () {
  RNG = mulberry32(777);
  this.list.length = 0;
  for (const d of World.animalsDef) for (let i = 0; i < d.n; i++) { const a = new Animal(d.type, d.rect); if (d.look) Object.assign(a, d.look); this.list.push(a); }
};
Animals.update = function (dt, cx, cy) {
  for (const a of this.list) if (Math.abs(a.x - cx) < 1700 && Math.abs(a.y - cy) < 1400) a.update(dt);
  for (const s of World.sparkers) if (Game.time < s.until && Math.abs(s.x - cx) < 1200 && Math.abs(s.y - cy) < 900) for (let i = 0; i < 2; i++) Particles.emit('spark', s.x, s.y, rnd(-160, 160), rnd(-160, 160), rnd(0.2, 0.5), 2);
  for (const g of World.geysers) if (Game.time < g.until && Math.abs(g.x - cx) < 1200 && Math.abs(g.y - cy) < 900 && chance(0.7)) Particles.emit('water', g.x + rnd(-2, 2), g.y + rnd(-2, 2), rnd(-70, 70), rnd(-70, 70), rnd(0.5, 1.1), 2);
  for (const g of World.grills) if (g.down === undefined && Math.abs(g.x - cx) < 900 && Math.abs(g.y - cy) < 700 && chance(dt * 6)) Particles.emit('smoke', g.x + rnd(-4, 4), g.y + rnd(-3, 3), rnd(-6, 6), rnd(-14, -4), rnd(1.2, 2.2), 4);
  this.soundT -= dt;
  if (this.soundT <= 0 && Game.state === 'playing') {
    this.soundT = rnd(5, 11);
    const rk = regionKeyAt(cx, cy), R = REGIONS[rk];
    const r = rnd();
    if (R.rural > 0.6) { if (r < 0.3) AudioSys.owl(); else if (r < 0.55) AudioSys.moo(); else if (r < 0.75) AudioSys.bark(900); }
    else if (rk === 'rio') { if (r < 0.6) AudioSys.frog(); else AudioSys.owl(); }
    else { if (r < 0.35) AudioSys.bark(rnd(500, 1100)); else if (r < 0.5) AudioSys.siren(); else if (r < 0.7) AudioSys.aiHorn(rnd(500, 850), pick(Object.keys(HORNS)), rnd(-0.8, 0.8)); }
  }
};
/* ---------- pelada nos campos de várzea ---------- */
const Peladas = { list: [] };
Peladas.build = function () {
  this.list.length = 0;
  const kits = [['#f7d000', '#f1f1f1'], ['#e63946', '#14213d'], ['#2bb24c', '#f1f1f1'], ['#3a86ff', '#ff7f11']];
  World.pitches.forEach((P, k) => {
    const kit = kits[k % kits.length], pl = [];
    for (let i = 0; i < 10; i++) {
      const team = i % 2, a = new Animal('person', [P.x0, P.y0, P.x1, P.y1]);
      a.col = kit[team]; a.team = team; a.state = 'idle';
      const row = Math.floor(i / 2);
      a.hx = lerp(P.x0 + 14, P.x1 - 14, ((row * 0.37 + team * 0.21) % 1));
      a.hy = team ? lerp(P.cy, P.y1 - 18, (row % 3) / 2.5 + 0.1) : lerp(P.y0 + 18, P.cy, 1 - ((row % 3) / 2.5 + 0.1));
      if (row === 4) { a.hx = P.cx; a.hy = team ? P.y1 - 10 : P.y0 + 10; a.keeper = true; a.col = team ? '#222' : '#9b5de5'; }
      a.x = a.hx; a.y = a.hy; pl.push(a);
    }
    this.list.push({ P, pl, bx: P.cx, by: P.cy, bvx: 0, bvy: 0, cd: 0, cel: 0, score: [0, 0] });
  });
};
Peladas.update = function (dt, cx, cy) {
  for (const G of this.list) {
    const P = G.P;
    if (Math.abs(P.cx - cx) > 1500 || Math.abs(P.cy - cy) > 1200) continue;
    G.cd -= dt;
    if (G.cel > 0) {
      G.cel -= dt;
      for (const p of G.pl) { p.v = 0; p.dance = p.team === G.lastTeam; p.phase += dt * 2; }
      if (G.cel <= 0) { G.bx = P.cx; G.by = P.cy; G.bvx = G.bvy = 0; for (const p of G.pl) { p.x = p.hx; p.y = p.hy; p.dance = false; } }
      continue;
    }
    // bola
    G.bx += G.bvx * dt; G.by += G.bvy * dt;
    const fr = Math.exp(-1.1 * dt); G.bvx *= fr; G.bvy *= fr;
    if (G.bx < P.x0) { G.bx = P.x0; G.bvx = Math.abs(G.bvx) * 0.6; } else if (G.bx > P.x1) { G.bx = P.x1; G.bvx = -Math.abs(G.bvx) * 0.6; }
    for (const [gy, side] of [[P.gy0, 0], [P.gy1, 1]]) {
      const past = side ? G.by > gy - 6 : G.by < gy + 6;
      if (!past) continue;
      if (Math.abs(G.bx - P.cx) < 20) { G.lastTeam = side ? 0 : 1; G.score[G.lastTeam]++; G.cel = 2.6; if (player && Math.hypot(player.x - P.cx, player.y - P.cy) < 600) AudioSys.tone(660, 0.25, 'triangle', 0.05, 'ambient', 880); }
      else { G.by = side ? gy - 6 : gy + 6; G.bvy = -G.bvy * 0.6; }
    }
    // carro do jogador chuta a bola e espanta a galera
    if (player) {
      const d = Math.hypot(player.x - G.bx, player.y - G.by);
      if (d < 16 && player.speed > 10) { const a = Math.atan2(G.by - player.y, G.bx - player.x); const s = 120 + player.speed * 0.8; G.bvx = Math.cos(a) * s; G.bvy = Math.sin(a) * s; }
    }
    // jogadores: o mais perto de cada time vai na bola, o resto se posiciona
    const near = [null, null], nd = [1e9, 1e9];
    for (const p of G.pl) { if (p.keeper) continue; const d = Math.hypot(p.x - G.bx, p.y - G.by); if (d < nd[p.team]) { nd[p.team] = d; near[p.team] = p; } }
    for (const p of G.pl) {
      let tx, ty, spd;
      if (p === near[0] || p === near[1]) { tx = G.bx; ty = G.by; spd = 58; }
      else if (p.keeper) { tx = clamp(G.bx, P.cx - 18, P.cx + 18); ty = p.hy; spd = 40; }
      else { tx = p.hx + (G.bx - P.cx) * 0.45; ty = p.hy + (G.by - P.cy) * 0.35; spd = 30; }
      if (player) { const dx = p.x - player.x, dy = p.y - player.y, d = Math.hypot(dx, dy); if (d < 70) { tx = p.x + dx / d * 60; ty = p.y + dy / d * 60; spd = 85; } }
      tx = clamp(tx, P.x0, P.x1); ty = clamp(ty, P.y0 - 6, P.y1 + 6);
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      if (d > 3) { const ta = Math.atan2(dy, dx); p.a += clamp(angDiff(p.a, ta), -7 * dt, 7 * dt); const s = Math.min(spd, d * 3); p.x += Math.cos(ta) * s * dt; p.y += Math.sin(ta) * s * dt; p.v = s; p.phase += dt * (8 + s * 0.1); }
      else { p.v = 0; p.a += clamp(angDiff(p.a, Math.atan2(G.by - p.y, G.bx - p.x)), -5 * dt, 5 * dt); }
      // chute / passe
      if (G.cd <= 0 && Math.hypot(p.x - G.bx, p.y - G.by) < 7) {
        const goalY = p.team ? P.gy0 : P.gy1;
        let tX = P.cx + rnd(-26, 26), tY = goalY, pw = rnd(150, 230);
        const dGoal = Math.abs(goalY - G.by);
        if (dGoal > 160 && chance(0.6)) { const mates = G.pl.filter((m) => m.team === p.team && m !== p && !m.keeper); const m = pick(mates); tX = m.x; tY = m.y + (p.team ? -20 : 20); pw = rnd(110, 160); }
        if (p.keeper) { tX = P.cx + rnd(-80, 80); tY = P.cy; pw = 230; }
        const a = Math.atan2(tY - G.by, tX - G.bx) + rnd(-0.18, 0.18);
        G.bvx = Math.cos(a) * pw; G.bvy = Math.sin(a) * pw; G.cd = 0.4;
      }
    }
  }
};
Peladas.draw = function (ctx, view) {
  for (const G of this.list) {
    if (!inView(view, G.P.cx, G.P.cy, 400)) continue;
    for (const p of G.pl) drawAnimal(ctx, p);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(G.bx + 1.2, G.by + 1.5, 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f8f8f4'; ctx.beginPath(); ctx.arc(G.bx, G.by, 2.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#222'; ctx.fillRect(G.bx - 0.7, G.by - 0.7, 1.4, 1.4);
  }
};
function drawAnimal(ctx, an) {
  const aas = Math.atan2(Math.sin(an.a) * SQ, Math.cos(an.a));
  ctx.save(); ctx.translate(an.x, an.y); ctx.scale(1, 1 / SQ); ctx.rotate(aas);
  const walk = an.v > 0 ? Math.sin(an.phase) : 0;
  const graze = an.state === 'graze';
  switch (an.type) {
    case 'person': {
      const dancing = an.dance && an.v === 0;
      const sw = an.v > 0 ? Math.sin(an.phase) * 2.4 : dancing ? Math.sin(Game.time * 9 + an.seed * 20) * 2.6 : 0;
      if (dancing) ctx.rotate(Math.sin(Game.time * 4.5 + an.seed * 9) * 0.35);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(1.5, 2, 4, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = an.pants; ctx.fillRect(-1 + sw * 0.5, -2.6, 2.6, 1.8); ctx.fillRect(-1 - sw * 0.5, 0.8, 2.6, 1.8);
      ctx.fillStyle = an.skin; ctx.beginPath(); ctx.arc(sw, -4.6, 1.2, 0, TAU); ctx.arc(-sw, 4.6, 1.2, 0, TAU); ctx.fill();
      ctx.fillStyle = an.col; ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 4.4, 0, 0, TAU); ctx.fill();
      if (an.col === '#f7d000') { ctx.fillStyle = '#1f9a48'; ctx.fillRect(-2.2, -0.6, 4.4, 1.2); }
      ctx.fillStyle = an.skin; ctx.beginPath(); ctx.arc(0.5, 0, 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = an.hair; ctx.beginPath(); ctx.arc(0, 0, 2.3, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
      if (an.seuze) { ctx.fillStyle = '#c8302a'; ctx.beginPath(); ctx.arc(0.2, 0, 2.4, -Math.PI * 0.5, Math.PI * 0.5); ctx.fill(); ctx.fillStyle = '#f0f0ea'; ctx.fillRect(2.1, -1, 0.9, 2); }
      break;
    }
    case 'cow': case 'horse': {
      const horse = an.type === 'horse';
      const L = horse ? 13 : 13, W = horse ? 5.5 : 7.5;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(3, 4, L + 2, W + 1.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a2420';
      for (const [lx, ly, ph] of [[8, -W + 0.5, 0], [8, W - 0.5, Math.PI], [-8, -W + 0.5, Math.PI], [-8, W - 0.5, 0]]) ctx.fillRect(lx + Math.sin(an.phase + ph) * (an.v ? 2 : 0) - 1.5, ly - 1.2, 3, 2.4);
      ctx.fillStyle = an.col; ctx.beginPath(); ctx.ellipse(0, 0, L, W, 0, 0, TAU); ctx.fill();
      if (!horse && an.col === '#ece7dc') {
        ctx.fillStyle = '#26211e';
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-8 + hash2(i, an.seed * 100 | 0) * 15, (hash2(i + 9, an.seed * 100 | 0) - 0.5) * W * 1.3, 2.5 + hash2(i, 3) * 2, 2 + hash2(i, 4) * 1.5, 0, 0, TAU); ctx.fill(); }
      }
      if (horse) { ctx.fillStyle = shade(an.col, -0.45); ctx.fillRect(2, -1, 11, 2); }
      const hx = graze ? L + 3 + Math.sin(an.phase * 0.5) * 1 : L + 2;
      ctx.fillStyle = horse ? shade(an.col, -0.1) : (an.col === '#ece7dc' ? '#e2dccf' : an.col);
      ctx.beginPath(); ctx.ellipse(hx, 0, horse ? 6 : 5, horse ? 2.6 : 3.8, 0, 0, TAU); ctx.fill();
      if (!horse) { ctx.fillStyle = '#d8b8a8'; ctx.beginPath(); ctx.ellipse(hx + 3.5, 0, 2, 2.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ddd2b8'; ctx.fillRect(hx - 2, -5.5, 1.5, 2.5); ctx.fillRect(hx - 2, 3, 1.5, 2.5); }
      ctx.strokeStyle = horse ? shade(an.col, -0.5) : '#3a3028'; ctx.lineWidth = horse ? 2 : 1.2;
      ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(-L - 4, Math.sin(an.phase * 0.7) * 3, -L - 7, Math.sin(an.phase * 0.7 + 1) * 4); ctx.stroke();
      break;
    }
    case 'chicken': {
      const peck = graze ? Math.max(0, Math.sin(an.phase * 2)) * 2 : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(1, 1.5, 3.5, 0, TAU); ctx.fill();
      ctx.fillStyle = an.col; ctx.beginPath(); ctx.ellipse(0, 0, 3.6, 2.6, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(3 + peck, 0, 1.7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d82a1a'; ctx.fillRect(2.5 + peck, -0.6, 1.4, 1.2);
      ctx.fillStyle = '#e8a020'; ctx.fillRect(4.5 + peck, -0.5, 1.2, 1);
      break;
    }
    case 'dog': {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(2, 2.5, 8, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(an.col, -0.3);
      for (const [lx, ly, ph] of [[4, -3, 0], [4, 3, Math.PI], [-4, -3, Math.PI], [-4, 3, 0]]) ctx.fillRect(lx + Math.sin(an.phase + ph) * (an.v ? 1.8 : 0) - 1, ly - 0.9, 2, 1.8);
      ctx.fillStyle = an.col; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 3.2, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(6.5, 0, 2.8, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(an.col, -0.35); ctx.beginPath(); ctx.ellipse(5.5, -2.6, 1.6, 1, 0.5, 0, TAU); ctx.ellipse(5.5, 2.6, 1.6, 1, -0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1412'; ctx.fillRect(8.8, -0.6, 1.2, 1.2);
      ctx.strokeStyle = an.col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-10, Math.sin(an.phase * (an.state === 'flee' ? 1 : 2.5)) * 3); ctx.stroke();
      break;
    }
    case 'capybara': {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(2, 2.5, 9.5, 5.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = an.col; ctx.beginPath(); ctx.ellipse(0, 0, 8.5, 5.2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(an.col, 0.08); ctx.beginPath(); ctx.ellipse(-1, -1, 5, 2.5, 0, 0, TAU); ctx.fill();
      const hx = graze ? 9.5 : 8.5;
      ctx.fillStyle = shade(an.col, -0.12); ctx.beginPath(); rrect(ctx, hx - 3, -3, 6.5, 6, 2.5); ctx.fill();
      ctx.fillStyle = '#2a1e14'; ctx.fillRect(hx + 2.5, -1.5, 1, 1); ctx.fillRect(hx + 2.5, 0.5, 1, 1);
      ctx.fillRect(hx - 2.5, -3.6, 1.6, 1.2); ctx.fillRect(hx - 2.5, 2.4, 1.6, 1.2);
      break;
    }
    case 'owl':
      ctx.rotate(-aas);
      ctx.fillStyle = '#5a4430'; ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c9b08a'; ctx.beginPath(); ctx.arc(0, -0.5, 2.4, 0, TAU); ctx.fill();
      break;
  }
  ctx.restore();
}

/* ============================ PARTÍCULAS E MARCAS ============================ */
const Particles = {
  list: [],
  emit(type, x, y, vx, vy, life, size) {
    if (Settings.quality === 'baixa') return; // gráfico baixo: sem partículas
    const max = Settings.quality === 'alta' ? 560 : 320;
    if (this.list.length >= max) this.list.shift();
    this.list.push({ type, x, y, vx, vy, life, max: life, size });
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const k = p.type === 'spark' ? 2.5 : p.type === 'leaf' ? 1.4 : p.type === 'hubcap' ? 0.9 : p.type === 'water' ? 1.2 : 1.8;
      if (p.type === 'hubcap') p.rot = (p.rot || 0) + dt * 12;
      p.vx *= Math.exp(-k * dt); p.vy *= Math.exp(-k * dt);
      if (p.type !== 'spark') p.size += dt * (p.type === 'dust' ? 14 : 10);
    }
  },
  draw(ctx) {
    for (const p of this.list) {
      const t = p.life / p.max;
      if (p.type === 'spark' || p.type === 'flame') continue;
      if (p.type === 'hubcap') { ctx.globalAlpha = Math.min(1, t * 3); ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6a6d72'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.rot) * 3, p.y + Math.sin(p.rot) * 3); ctx.lineTo(p.x - Math.cos(p.rot) * 3, p.y - Math.sin(p.rot) * 3); ctx.stroke(); continue; }
      if (p.type === 'leaf') { ctx.globalAlpha = t; ctx.fillStyle = '#3f7a2e'; ctx.fillRect(p.x, p.y, 2.4, 1.6); continue; }
      if (p.type === 'steam' || p.type === 'exhaust') { ctx.globalAlpha = t * (p.type === 'steam' ? 0.35 : 0.18); ctx.fillStyle = p.type === 'steam' ? '#f0f4f8' : '#9a9a9a'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); continue; }
      ctx.globalAlpha = t * (p.type === 'dust' ? 0.35 : 0.28);
      ctx.fillStyle = p.type === 'dust' ? '#9a7e5a' : p.type === 'water' ? '#9ec8dc' : '#c8c8c8';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  drawEmissive(ctx) {
    ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const p of this.list) {
      if (p.type !== 'spark') continue;
      ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
    }
    ctx.stroke();
    for (const p of this.list) if (p.type === 'flame') { ctx.globalAlpha = p.life / p.max; ctx.drawImage(glowSprite('#ff8a2a'), p.x - 9, p.y - 9, 18, 18); }
    ctx.globalAlpha = 1;
  },
};
const Skids = {
  N: 900, buf: new Float32Array(900 * 4), t: new Float32Array(900), dirt: new Uint8Array(900), i: 0, count: 0,
  add(ax, ay, bx, by, cx, cy, dx, dy, surf) {
    for (const [x0, y0, x1, y1] of [[ax, ay, bx, by], [cx, cy, dx, dy]]) {
      const j = this.i;
      this.buf[j * 4] = x0; this.buf[j * 4 + 1] = y0; this.buf[j * 4 + 2] = x1; this.buf[j * 4 + 3] = y1;
      this.t[j] = Game.time; this.dirt[j] = surf === SF.ROAD || surf === SF.PAVED || surf === SF.BRIDGE ? 0 : 1;
      this.i = (j + 1) % this.N; this.count = Math.min(this.N, this.count + 1);
    }
  },
  draw(ctx, view) {
    if (!this.count) return;
    ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    for (let bucket = 0; bucket < 3; bucket++) {
      const lo = bucket * 15, hi = lo + 15;
      ctx.strokeStyle = `rgba(14,14,16,${0.42 - bucket * 0.12})`;
      ctx.beginPath();
      let any = false;
      for (let j = 0; j < this.count; j++) {
        const age = Game.time - this.t[j];
        if (age < lo || age >= hi) continue;
        const x = this.buf[j * 4], y = this.buf[j * 4 + 1];
        if (x < view.x0 - 20 || x > view.x1 + 20 || y < view.y0 - 20 || y > view.y1 + 20) continue;
        ctx.moveTo(x, y); ctx.lineTo(this.buf[j * 4 + 2], this.buf[j * 4 + 3]); any = true;
      }
      if (any) ctx.stroke();
    }
    ctx.lineCap = 'butt';
  },
};
/* ============================ ATIVIDADES ============================ */
const SHOP_TEXT = {
  moquecaria: 'Panelas de barro fumegando no fogão. Dona Penha grita da cozinha: "Moqueca é capixaba, o resto é peixada!"',
  farmacia: 'Aberta 24 horas. A balconista separa uma sacola com receita grampeada.',
  padaria: 'O último pão de queijo da noite ainda está quente no balcão.',
  mercado: 'Prateleiras cheias e um rádio tocando sertanejo baixinho.',
  lanchonete: 'O Bigode vira hambúrgueres na chapa enquanto conta causos.',
  paneleiras: 'Mulheres moldando argila preta do manguezal e queimando as panelas no chão, do jeito que se faz há séculos no Espírito Santo.',
  batalhao: 'O sargento de plantão te olha por cima do balcão: "Tá perdido, cidadão? Dirige com calma aí, que a noite é longa."',
  bar: 'Mesas de plástico na calçada, futebol na TV e petiscos no balcão. Motorista não bebe — só um guaraná.',
  floricultura: 'Baldes de rosas e girassóis iluminados por um letreiro rosa.',
  hotel: 'O porteiro da noite cochila atrás do balcão de madeira.',
  churrascaria: 'Espetos girando na brasa. O gaúcho da porta acena para você.',
  borracharia: 'Pilhas de pneus e um compressor chiando. "Precisando, é só chamar!"',
  sitio: 'Galinhas dormindo no poleiro e café passado no fogão a lenha.',
  fazenda: 'O casarão tem varanda iluminada e cheiro de doce de leite.',
  oficina: 'Macacos hidráulicos, ferramentas na parede e um rádio AM chiando.',
  posto: 'Frentistas de uniforme e o zumbido das lâmpadas da cobertura.',
};
const FRAGILE = /Moquequeira|Panela|panelas|Bolo|Ovos|bebidas|Arranjo|Buquê|Remédios|Doce/i;
const HOT = /Moqueca|Torta|Pizza|X-tudo|Pastéis|Lanches|Esfihas|Marmitas|salgados/i;

const Act = {
  delivery: null, race: null, parkSpot: null, parkHold: 0, parkCd: {}, waypoint: null,
  gps: null, gpsT: 0, gpsTarget: null, prompt: null, hintT: 0, hintI: 0, offers: new Map(), parkLock: null,
  ride: null, rideOnline: false, rideT: 5,
  reset() { this.ride = null; this.rideOnline = false; this.rideT = 5; this.parkLock = null; this.delivery = null; this.race = null; this.parkSpot = null; this.parkHold = 0; this.waypoint = null; this.gps = null; this.gpsTarget = null; this.prompt = null; this.offers.clear(); },
};
function pay(v, why) {
  v = Math.round(v);
  Profile.money += v;
  if (v > 0) Profile.earned += v;
  UI.moneyDelta(v);
  if (v > 0) AudioSys.money();
  if (why) toast(why, (v >= 0 ? '+' : '−') + ' R$ ' + fmtMoney(Math.abs(v)), v >= 0 ? 'good' : 'bad');
}
function onPlayerImpact(imp) {
  player.impactCd = 0.35;
  const k = clamp((imp - 70) / 380, 0, 1);
  Profile.damage = clamp(Profile.damage + k * 13, 0, 100);
  AudioSys.crash(0.2 + k);
  Cam.shake = Math.max(Cam.shake, 3 + k * 12);
  const hx = player.hitX || player.x, hy = player.hitY || player.y;
  for (let i = 0; i < 4 + k * 12; i++) Particles.emit('spark', hx, hy, rnd(-220, 220), rnd(-220, 220), rnd(0.2, 0.5), 2);
  if (k > 0.45 && chance(0.6)) { const f = pick([['Pocou!', 'Isso vai doer no bolso…'], ['Ô, rapá!', 'Olha a lataria, sô!'], ['Que isso, maluco?', 'Seu Zé vai ter trabalho.'], ['Vixe!', 'Bateu feio.']]); toast(f[0], f[1], 'bad'); }
  const zone = addZoneDamage(Profile.zones || (Profile.zones = { f: 0, r: 0, l: 0, rt: 0 }), player, hx, hy, k);
  Debris.spill(hx, hy, k, player.color, zone);
  if ((zone === 'l' || zone === 'rt') && k > 0.45 && chance(0.6)) Particles.emit('hubcap', hx, hy, rnd(-140, 140), rnd(-140, 140), 2.6, 3);
  if (Act.ride && Act.ride.stage === 'drive' && imp > 110) { Act.ride.hits++; toast(Act.ride.name, pick(FALAS_BATIDA), 'bad'); }
  if (Act.delivery && Act.delivery.fragile && imp > 130) {
    Act.delivery.hits++;
    toast('Carga frágil!', 'A encomenda sofreu um impacto (−15%).', 'bad');
  }
}
// marcas de colisão: amassados por região do carro (frente, traseira, laterais)
function addZoneDamage(Z, car, hx, hy, k) {
  const c = Math.cos(car.a), s = Math.sin(car.a);
  const dx = hx - car.x, dy = hy - car.y;
  const lx = dx * c + dy * s, ly = -dx * s + dy * c;
  let zone;
  if (Math.abs(lx) > car.m.L * 0.28) zone = lx > 0 ? 'f' : 'r'; else zone = ly < 0 ? 'l' : 'rt';
  Z[zone] = clamp(Z[zone] + 0.12 + k * 0.7, 0, 1);
  // batida na frente: guarda de que lado do para-choque foi (para o farol daquele lado)
  if (zone === 'f') { const sk = ly < 0 ? 'fL' : 'fR'; Z[sk] = clamp((Z[sk] || 0) + (0.1 + k * 0.6) * (Math.abs(ly) > car.m.W * 0.15 ? 0.8 : 0.4), 0, 1); }
  Z.seed = (Z.seed || 0) + 1;
  return zone;
}
const Debris = {
  list: [],
  spill(x, y, k, color, zone) {
    const n = Math.round(4 + k * 18);
    for (let i = 0; i < n; i++) {
      const r = rnd(), type = r < 0.45 ? 'glass' : r < 0.75 ? 'paint' : 'plastic';
      this.list.push({ x: x + rnd(-14, 14) * (0.6 + k), y: y + rnd(-14, 14) * (0.6 + k), a: rnd(TAU), s: rnd(1.2, 3.2), type, c: type === 'paint' ? color : type === 'glass' ? (zone === 'r' ? '#ff6a5a' : '#cfe6ff') : '#202024', t: Game.time });
    }
    if (k > 0.25) this.list.push({ x, y, a: rnd(TAU), s: 6 + k * 8, type: 'oil', c: '#000', t: Game.time });
    while (this.list.length > 500) this.list.shift();
  },
  draw(ctx, view) {
    for (const d of this.list) {
      if (d.x < view.x0 - 20 || d.x > view.x1 + 20 || d.y < view.y0 - 20 || d.y > view.y1 + 20) continue;
      const age = Game.time - d.t, al = clamp(1 - (age - 120) / 60, 0, 1);
      if (al <= 0) continue;
      ctx.globalAlpha = al * (d.type === 'oil' ? 0.45 : d.type === 'glass' ? 0.85 : 0.95);
      ctx.fillStyle = d.c;
      if (d.type === 'oil') { ctx.beginPath(); ctx.ellipse(d.x, d.y, d.s, d.s * 0.65, d.a, 0, TAU); ctx.fill(); continue; }
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a);
      ctx.beginPath(); ctx.moveTo(-d.s, -d.s * 0.4); ctx.lineTo(d.s * 0.8, -d.s * 0.6); ctx.lineTo(d.s * 0.3, d.s * 0.6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
};
function zoneList(Z) {
  if (!Z) return [];
  const N = { f: 'dianteira', r: 'traseira', l: 'lateral esquerda', rt: 'lateral direita' }, out = [];
  for (const k of ['f', 'r', 'l', 'rt']) if (Z[k] > 0.05) out.push(N[k] + (Z[k] > 0.66 ? ' destruída' : Z[k] > 0.33 ? ' amassada' : ' arranhada'));
  return out;
}
// cenário que quebra
function refreshGroundArea(x0, y0, x1, y1) {
  for (let cy = Math.floor(y0 / CHUNK); cy <= Math.floor(y1 / CHUNK); cy++) for (let cx = Math.floor(x0 / CHUNK); cx <= Math.floor(x1 / CHUNK); cx++) {
    if (chunks.has(cy * 1000 + cx)) renderChunk(cx, cy);
  }
}
function breakObject(col, vx, vy, sp, hx, hy) {
  col.dead = true;
  const b = col.brk, o = b.obj, ang = Math.atan2(vy, vx) + rnd(-0.4, 0.4);
  if (b.kind === 'fence') {
    const long = (o.x1 - o.x0) > (o.y1 - o.y0), L = long ? o.x1 - o.x0 : o.y1 - o.y0;
    const t = clamp(long ? hx - o.x0 : hy - o.y0, 0, L);
    o.gaps.push({ t, a: ang });
    // recria a colisão só nos pedaços que sobraram
    const parts = []; let cur = 0;
    for (const gp of [...o.gaps].sort((a, c) => a.t - c.t)) { if (gp.t - 22 > cur) parts.push([cur, gp.t - 22]); cur = Math.max(cur, gp.t + 22); }
    if (L > cur) parts.push([cur, L]);
    for (const [a, c] of parts) { const nc = long ? addRectCol(o.x0 + a, o.y0, o.x0 + c, o.y1, 'fence') : addRectCol(o.x0, o.y0 + a, o.x1, o.y0 + c, 'fence'); nc.brk = b; }
    colGrid.query(o.x0, o.y0, o.x1, o.y1, _q); for (const c2 of _q) if (c2.brk === b && c2 !== col && c2.t === 0 && (c2.x1 - c2.x0) * (c2.y1 - c2.y0) >= (o.x1 - o.x0) * (o.y1 - o.y0) - 1) c2.dead = true;
    refreshGroundArea(o.x0 - 40, o.y0 - 40, o.x1 + 40, o.y1 + 40);
    AudioSys.breakSnd(o.type === 'chain' ? 'metal' : 'wood', clamp(sp / 400, 0.2, 1));
    Cam.shake = Math.max(Cam.shake, 3);
    return;
  }
  if (b.kind === 'tree') {
    o.down = ang; AudioSys.breakSnd('wood', 0.8);
    for (let i = 0; i < 14; i++) Particles.emit('leaf', o.x + rnd(-14, 14), o.y + rnd(-14, 14), rnd(-60, 60) + Math.cos(ang) * 60, rnd(-60, 60) + Math.sin(ang) * 60, rnd(0.8, 1.6), 2);
    Cam.shake = Math.max(Cam.shake, 5);
    return;
  }
  const k = clamp(sp / 400, 0.2, 1);
  Cam.shake = Math.max(Cam.shake, 2 + k * 5);
  if (b.kind === 'prop') {
    o.broken = true; o.fallA = ang;
    refreshGroundArea(o.x - b.R, o.y - b.R, o.x + b.R, o.y + b.R);
    const mat = BREAKABLE[o.type];
    AudioSys.breakSnd(mat, k);
    const cols = { wood: ['#8a5a34', '#6a4224'], plastic: [o.c || '#2f6a3a', '#e8e2d0'], metal: ['#8a8d92', '#c8302a'], rubber: ['#18181a'], clay: ['#2a2420'] }[mat] || ['#888'];
    for (let i = 0; i < 6 + k * 8; i++) Debris.list.push({ x: o.x + rnd(-6, 6) + Math.cos(ang) * rnd(4, 26), y: o.y + rnd(-6, 6) + Math.sin(ang) * rnd(4, 26), a: rnd(TAU), s: rnd(1.4, 3), type: 'paint', c: pick(cols), t: Game.time });
    if (o.type === 'hydrant') { World.geysers.push({ x: o.x, y: o.y, until: Game.time + 45 }); toast('Hidrante estourado!', 'Molhou a rua inteira.', 'bad'); }
  } else if (b.kind === 'lamp') {
    o.broken = true; o.down = ang;
    if (o.light) o.light.dieAt = Game.time + 1.1;
    World.sparkers.push({ x: o.hx, y: o.hy, until: Game.time + 1.5 });
    AudioSys.breakSnd('lamp', k);
    if (chance(0.5)) toast('Derrubou o poste!', 'A rua ficou no escuro. A prefeitura agradece…', 'bad');
    Debris.spill(o.hx, o.hy, 0.4, '#d8d8d2', 'f');
  } else {
    o.down = ang;
    AudioSys.breakSnd('metal', k);
    if (o.kind === 'tlight') toast('Semáforo no chão!', 'Agora é cada um por si nesse cruzamento.', 'bad');
  }
}
function deliveryOffer(shop) {
  let off = Act.offers.get(shop.id);
  if (off && Game.time - off.made < 90) return off;
  const item = pick(shop.items || ['Encomenda']);
  let dest = null;
  const rural = shop.region === 'sitio' || shop.region === 'fazenda';
  const pool = [];
  if (rural || chance(0.2)) {
    for (const s of World.shops) if (s !== shop && s.pickup && s.region !== shop.region) pool.push({ x: s.x, y: s.y, name: s.name });
  }
  if (!pool.length || chance(0.6)) {
    for (const h of World.homes) {
      const d = Math.hypot(h.x - shop.x, h.y - shop.y);
      if (d > 800 && d < (rural ? 6000 : 3400)) pool.push(h);
    }
  }
  dest = pick(pool) || pick(World.homes);
  const route = gpsRoute(shop.x, shop.y, dest.x, dest.y);
  const len = route ? route.len : Math.hypot(dest.x - shop.x, dest.y - shop.y) * 1.3;
  const cargo = player ? (player.car.cargo || 1) : 1;
  const fragile = FRAGILE.test(item), hot = HOT.test(item);
  const reward = Math.round((70 + len * 0.075) * cargo * (fragile ? 1.15 : 1) / 5) * 5;
  off = { shop, item, dest: { x: dest.x, y: dest.y, name: dest.name }, len, par: len / 230 + 22, reward, fragile, hot, made: Game.time };
  Act.offers.set(shop.id, off);
  return off;
}
function startDelivery(off) {
  Act.delivery = Object.assign({}, off, { t: 0, hits: 0 });
  Act.offers.delete(off.shop.id);
  AudioSys.chime();
  toast('Entrega aceita', off.item + ' para ' + off.dest.name, 'info');
  Act.gpsT = 0;
}
function finishDelivery() {
  const d = Act.delivery;
  let v = d.reward;
  let bonus = 0;
  if (d.t <= d.par) bonus = Math.round(d.reward * (d.hot ? 0.45 : 0.25));
  else if (d.t > d.par * 1.6) v *= 0.75;
  if (d.fragile) v *= Math.max(0.3, 1 - 0.15 * d.hits);
  Act.delivery = null;
  Profile.deliveries++;
  pay(v + bonus, 'Entrega concluída' + (bonus ? ' — no prazo!' : ''));
  saveGame();
}
function startRace(r) {
  Act.race = { r, idx: 0, t: 0, count: 3.4, lastBeep: 4 };
  toast('Percurso: ' + r.name, 'Ouro ' + fmtTime(r.gold) + ' · Prata ' + fmtTime(r.silver) + ' · Bronze ' + fmtTime(r.bronze), 'info');
}
function finishRace() {
  if (Act.race.racha) { finishRacha(Act.race); return; }
  const R = Act.race, r = R.r, t = R.t;
  const medal = t <= r.gold ? 3 : t <= r.silver ? 2 : t <= r.bronze ? 1 : 0;
  const names = ['Sem medalha', 'Bronze', 'Prata', 'Ouro'];
  const rewards = [60, 300, 550, 900];
  const prev = Profile.races[r.id] || { best: Infinity, medal: -1 };
  let v;
  if (medal > prev.medal) v = rewards[medal] - (prev.medal > 0 ? rewards[prev.medal] : 0);
  else v = Math.round(rewards[medal] * 0.15);
  v = Math.max(v, 40);
  const record = t < prev.best;
  Profile.races[r.id] = { best: Math.min(prev.best, t), medal: Math.max(prev.medal, medal) };
  Act.race = null;
  AudioSys.chime();
  toast(r.name + ' — ' + names[medal], 'Tempo ' + fmtTime(t) + (record ? ' · NOVO RECORDE' : ''), medal >= 2 ? 'good' : 'info');
  pay(v, 'Prêmio do percurso');
  saveGame();
}
function abandonActivity() {
  if (Act.race) { Act.race = null; toast('Percurso abandonado', '', 'bad'); return true; }
  if (Act.delivery) { Act.delivery = null; toast('Entrega cancelada', 'O cliente vai ter que esperar…', 'bad'); return true; }
  if (Act.ride) { Act.ride = null; Act.rideT = 8; toast('Corrida cancelada', 'O passageiro chamou outro motorista.', 'bad'); return true; }
  if (Act.waypoint) { Act.waypoint = null; toast('Destino do GPS removido', '', 'info'); return true; }
  return false;
}
function visitShop(s) {
  if (Profile.visited.includes(s.id)) return;
  Profile.visited.push(s.id);
  const total = World.shops.filter((x) => x.kind !== 'garagem').length;
  const n = Profile.visited.length;
  pay(100, 'Caderneta: ' + s.name + ' (' + n + '/' + total + ')');
  if (n === total) setTimeout(() => pay(1500, 'Caderneta completa! Você conhece a cidade inteira.'), 900);
}

/* ---------- GPS (Dijkstra na malha viária) ---------- */
function gpsRoute(sx, sy, tx, ty) {
  const A = nearestEdge(sx, sy), B = nearestEdge(tx, ty);
  if (!A.e || !B.e) return null;
  const pA = A.e.h ? [A.e.a.x + A.s, A.e.a.y] : [A.e.a.x, A.e.a.y + A.s];
  const pB = B.e.h ? [B.e.a.x + B.s, B.e.a.y] : [B.e.a.x, B.e.a.y + B.s];
  if (A.e === B.e) return { pts: [[sx, sy], pA, pB, [tx, ty]], len: Math.abs(A.s - B.s) + A.d + B.d };
  const N = World.nodes.length;
  const dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  dist[A.e.a.id] = A.s; dist[A.e.b.id] = A.e.len - A.s;
  for (;;) {
    let u = -1, best = Infinity;
    for (let i = 0; i < N; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
    if (u < 0) break;
    done[u] = 1;
    const n = World.nodes[u];
    for (const e of n.edges) {
      const o = e.a === n ? e.b : e.a;
      const nd = best + e.len;
      if (nd < dist[o.id]) { dist[o.id] = nd; prev[o.id] = u; }
    }
  }
  const ca = dist[B.e.a.id] + B.s, cb = dist[B.e.b.id] + (B.e.len - B.s);
  let end = ca <= cb ? B.e.a : B.e.b;
  const len = Math.min(ca, cb) + A.d + B.d;
  if (!isFinite(len)) return null;
  const path = [];
  for (let i = end.id; i >= 0; i = prev[i]) path.push(World.nodes[i]);
  path.reverse();
  const pts = [[sx, sy], pA];
  for (const n of path) pts.push([n.x, n.y]);
  pts.push(pB, [tx, ty]);
  return { pts, len };
}
function currentTarget() {
  if (Act.race) { const R = Act.race; const p = R.idx < R.r.pts.length ? R.r.pts[R.idx] : null; return p ? { x: p[0], y: p[1], kind: 'race' } : null; }
  if (Act.delivery) { const D = Act.delivery, q = D.stage === 'pickup' ? D.pick : D.dest; return { x: q.x, y: q.y, kind: 'delivery' }; }
  if (Act.ride) { const q = Act.ride.stage === 'pickup' ? Act.ride.pick : Act.ride.dest; return { x: q.x, y: q.y, kind: 'ride' }; }
  if (Act.waypoint) return { x: Act.waypoint.x, y: Act.waypoint.y, kind: 'waypoint' };
  return null;
}
function nearestShop(kind) {
  let best = null, bd = Infinity;
  for (const s of World.shops) if (s.kind === kind) { const d = Math.hypot(s.x - player.x, s.y - player.y); if (d < bd) { bd = d; best = s; } }
  return best;
}

/* ---------- atualização por quadro ---------- */
function updateActivities(dt) {
  const p = player, sp = p.speed;
  updateJobs(dt);
  // pontos de interesse
  for (const poi of World.pois) {
    if (Profile.discovered.includes(poi.id)) continue;
    if (Math.hypot(poi.x - p.x, poi.y - p.y) < poi.r) {
      Profile.discovered.push(poi.id);
      AudioSys.chime();
      toast('Ponto de interesse: ' + poi.name, poi.desc, 'info');
      pay(150);
      if (Profile.discovered.length === World.pois.length) setTimeout(() => pay(2000, 'Todos os pontos de interesse descobertos!'), 1200);
    }
  }
  // radares (pardal)
  for (const r of World.radars) {
    if (r.obj.down !== undefined) continue;
    if (p.x < r.x0 || p.x > r.x1 || p.y < r.y0 || p.y > r.y1) continue;
    const kmh = sp * 0.3;
    if (kmh > r.lim + 3 && Game.time - r.obj.last > 6) {
      r.obj.last = Game.time; Cam.flash = 1;
      AudioSys.tone(2400, 0.06, 'square', 0.06, 'ui'); AudioSys.tone(2400, 0.06, 'square', 0.06, 'ui', null, 0.1);
      const fine = Math.min(130, Math.max(0, Math.floor(Profile.money)));
      if (fine > 0) pay(-fine, 'Pardal! ' + Math.round(kmh) + ' km/h numa via de ' + r.lim);
      else toast('Pardal!', 'Flagrado a ' + Math.round(kmh) + ' km/h. A multa vai chegar pelo correio…', 'bad');
    }
  }
  // entrega em andamento
  if (Act.delivery) {
    const d = Act.delivery;
    d.t += dt;
    if (d.stage !== 'pickup' && Math.hypot(d.dest.x - p.x, d.dest.y - p.y) < 70 && sp < 40) finishDelivery();
  }
  // corrida
  if (Act.race) {
    const R = Act.race;
    if (R.count > 0) {
      R.count -= dt;
      const c = Math.ceil(R.count);
      if (c < R.lastBeep && c >= 1) { AudioSys.beep(false); R.lastBeep = c; }
      if (R.count <= 0) { AudioSys.beep(true); R.lastBeep = 0; }
    } else {
      R.t += dt;
      const cp = R.r.pts[R.idx];
      if (Math.hypot(cp[0] - p.x, cp[1] - p.y) < 95) {
        R.idx++;
        if (R.idx >= R.r.pts.length) finishRace(); else { AudioSys.checkpoint(); Act.gpsT = 0; }
      } else if (Math.hypot(cp[0] - p.x, cp[1] - p.y) > 2600) {
        Act.race = null; toast('Percurso cancelado', 'Você se afastou demais do trajeto.', 'bad');
      }
    }
  }
  // GPS
  const tgt = currentTarget();
  if (Act.waypoint && Math.hypot(Act.waypoint.x - p.x, Act.waypoint.y - p.y) < 90) { Act.waypoint = null; toast('Você chegou ao destino', '', 'good'); AudioSys.checkpoint(); }
  Act.gpsT -= dt;
  if (tgt && (Act.gpsT <= 0 || !Act.gps)) { Act.gps = gpsRoute(p.x, p.y, tgt.x, tgt.y); Act.gpsT = 0.8; Act.gpsTarget = tgt; }
  if (!tgt) { Act.gps = null; Act.gpsTarget = null; }
  // vagas
  Act.parkSpot = null;
  if (!Act.race) {
    let best = null, bd = 520;
    for (const s of World.parkSpots) { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = s; } }
    Act.parkSpot = best;
    if (best) {
      const inside = parkedIn(best);
      if (Act.parkLock === best.id) { Act.parkHold = 0; if (!inside) Act.parkLock = null; }
      else if (inside && sp < 12) {
        Act.parkHold += dt;
        if (Act.parkHold >= 1.2) {
          Act.parkHold = 0; Act.parkLock = best.id;
          const cd = Act.parkCd[best.id] || -1e9;
          const rev = Math.abs(angDiff(p.a, best.a)) > Math.PI / 2;
          if (Game.time - cd < 120) toast('Vaga ocupada há pouco', 'Tente outra vaga ou volte mais tarde.', 'info');
          else {
            const first = !Profile.parks[best.id];
            Profile.parks[best.id] = true; Act.parkCd[best.id] = Game.time;
            const v = (first ? best.reward : 45) * (rev ? 1.3 : 1);
            pay(v, (rev ? 'Baliza de ré perfeita! ' : 'Estacionou bonito! ') + best.name);
          }
        }
      } else Act.parkHold = 0;
    }
  }
  // interações (E)
  Act.prompt = null;
  if (sp < 70 && !(Act.race && Act.race.count <= 0)) {
    let best = null, bd = Infinity;
    for (const s of World.shops) {
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < (s.radius || 72) && d < bd) { bd = d; best = s; }
    }
    if (best) {
      const verb = { garagem: 'Entrar na garagem', posto: 'Abastecer / lavar — ' + best.name, oficina: 'Oficina — consertar e melhorar' }[best.kind];
      Act.prompt = { text: verb || (best.pickup && !Act.delivery ? 'Pegar entrega — ' + best.name : 'Entrar — ' + best.name), act: () => openShopDialog(best) };
    } else if (!Act.race) {
      if (rachaOpen()) for (const r of World.rachas) {
        if (Math.hypot(r.start[0] - p.x, r.start[1] - p.y) < 85) { Act.prompt = { text: 'Racha (ilegal): ' + r.name + ' — aposta R$ ' + fmtMoney(r.bet) + ' contra ' + r.rival, act: () => startRacha(r) }; break; }
      }
      if (!Act.prompt) for (const r of World.races) {
        if (Math.hypot(r.start[0] - p.x, r.start[1] - p.y) < 85) {
          const rec = Profile.races[r.id];
          Act.prompt = { text: 'Iniciar percurso: ' + r.name + (rec ? ' (recorde ' + fmtTime(rec.best) + ')' : ''), act: () => startRace(r) };
          break;
        }
      }
    }
  }
  // dicas do modo livre
  Act.hintT -= dt;
  if (Act.hintT <= 0) { Act.hintT = 11; Act.hintI++; }
}
function parkedIn(s) {
  const p = player, m = p.m;
  let da = Math.abs(angDiff(p.a, s.a));
  if (da > Math.PI / 2) da = Math.PI - da;
  if (da > 0.22) return false;
  const c = Math.cos(s.a), sn = Math.sin(s.a);
  const pc = Math.cos(p.a), ps = Math.sin(p.a);
  for (const [u, v] of [[m.L / 2, m.W / 2], [m.L / 2, -m.W / 2], [-m.L / 2, m.W / 2], [-m.L / 2, -m.W / 2]]) {
    const wx = p.x + pc * u - ps * v - s.x, wy = p.y + ps * u + pc * v - s.y;
    const lu = wx * c + wy * sn, lv = -wx * sn + wy * c;
    if (Math.abs(lu) > s.l / 2 + 3 || Math.abs(lv) > s.w / 2 + 3) return false;
  }
  return true;
}
function freeRoamHint() {
  const disc = Profile.discovered.length, totP = World.pois.length;
  const vis = Profile.visited.length, totV = World.shops.filter((x) => x.kind !== 'garagem').length;
  if (Profile.fuel < 22) { const s = nearestShop('posto'); return ['Combustível baixo', 'Procure um posto: ' + (s ? s.name : '') + '. Marque no mapa do celular (Q).']; }
  if (Profile.damage > 55) return ['Carro avariado', 'Passe na Oficina do Seu Zé, no Distrito da Gambiarra.'];
  const cheapest = CARS.filter((c) => !Profile.owned[c.id]).sort((a, b) => a.price - b.price)[0];
  const list = [
    ['Exploração livre', 'Comércios com marcador amarelo oferecem entregas. Pare em frente e aperte E.'],
    ['Exploração livre', 'Pontos de interesse descobertos: ' + disc + '/' + totP + '. O mapa do celular (Q) mostra o que falta perto de você.'],
    ['Exploração livre', 'Percursos cronometrados começam nas bandeiras azuis. Medalha de ouro paga bem.'],
    ['Exploração livre', 'Caderneta de visitas: ' + vis + '/' + totV + ' estabelecimentos. Cada visita nova rende R$ 100.'],
    ['Exploração livre', 'Vagas marcadas em azul pagam por um estacionamento perfeito. De ré vale mais.'],
    ['Exploração livre', 'Abra o mapa no celular (Q) e clique para traçar uma rota no GPS até qualquer lugar.'],
    ['Exploração livre', 'Cuidado com o pardal: radares nas avenidas (80 km/h) e na BR-101 (110 km/h) multam na hora.'],
    ['Exploração livre', 'Tem churrasquinho na esquina do boteco e forró tocando. São Gambiarra nunca dorme.'],
  ];
  if (cheapest && Profile.money >= cheapest.price) list.push(['Carro novo disponível', 'Você já pode comprar o ' + cheapest.name + ' na sua garagem.']);
  return list[Act.hintI % list.length];
}
/* ============================ CELULAR, PROFISSÕES, APP DE MOTORISTA E RACHA ============================ */
const PASSAGEIROS = ['Dona Cida', 'Seu Jorge', 'Thaís', 'Juninho', 'Pastor Elias', 'Dona Penha', 'Marcão', 'Bia da Farmácia', 'Tio Zezinho', 'Kelly', 'Rafa do Bloco', 'Vó Lurdes', 'Diego Entregador', 'Professora Solange'];
const FALAS_EMBARQUE = ['"Boa noite, moço! Pode ir pela avenida que é mais rápido."', '"Liga o ar aí, por favor?"', '"Tô atrasada pro plantão, vai com fé!"', '"Nossa, esse carro é raiz, hein?"', '"Me deixa na porta, que tá escuro."', '"Pode botar um pagodinho no rádio?"'];
const FALAS_BATIDA = ['"Ô motorista, devagar!"', '"Jesus amado, quase morri!"', '"Vou dar uma estrela pra você, viu?"', '"Eita! Cuidado aí!"'];
const JOB_TYPES = {
  pickup: { name: 'Frete de picape', items: ['Sacos de cimento', 'Mudança pequena', 'Tijolos baianos', 'Geladeira usada', 'Móveis da vó'], mult: 1.35 },
  bau: { name: 'Carga de baú', items: ['Carga de bebidas', 'Caixas de mercadoria', 'Eletrodomésticos', 'Engradados de refrigerante'], mult: 2.2 },
  gas: { name: 'Entrega de gás', items: ['Botijões de gás'], mult: 1.6 },
  tanker: { name: 'Abastecer posto', items: ['Gasolina comum', 'Etanol', 'Diesel S10'], mult: 2.8, fragile: true },
  cacamba: { name: 'Retirar entulho', items: ['Entulho de obra'], mult: 2.0 },
  guincho: { name: 'Reboque', items: ['Carro quebrado de cliente'], mult: 1.9 },
};
// rep: respostas possíveis [[texto, resposta do contato]]; mensagens informativas não têm
function addMsg(from, title, body, silent, rep) {
  Profile.msgs = Profile.msgs || [];
  const m = { from, title, body, read: false, t: Math.floor(Profile.time) };
  if (rep) m.rep = rep;
  Profile.msgs.unshift(m);
  if (!silent) { const cfg = phoneCfg(); if (cfg.notif) toast('Nova mensagem: ' + from, title + ' — aperte Q para abrir o celular.', 'info'); if (cfg.sounds) { AudioSys.tone(1568, 0.08, 'sine', 0.08, 'ui'); AudioSys.tone(2093, 0.12, 'sine', 0.08, 'ui', null, 0.1); } }
}
function ensurePhoneData() {
  if (!Profile.msgs) {
    Profile.msgs = [];
    addMsg('Seu Zé (Oficina)', 'Bem-vindo a São Gambiarra!',
      'Aqui é o Seu Zé, da oficina. Você chegou em São Gambiarra, no Espírito Santo, uma cidade que nunca dorme. Seu Quadradão tá na garagem da Vila Sem Pressa.\n\n' +
      'Pra ganhar a vida por aqui:\n• Entregas: pare em frente aos comércios com marcador amarelo e aperte E.\n• App PegaAí: fique online e leve passageiros pela cidade.\n• App Fretes: com uma picape ou caminhão de trabalho (a picape é a mais barata), faça fretes de carga, gás, combustível, entulho e reboque.\n• Percursos: bandeiras azuis no mapa, com medalhas.\n• Racha: depois das 22h, os rachas da madrugada pagam a aposta em dobro. Só cuidado: se a viatura vir, é multa.\n\n' +
      'Abasteça no posto, conserte aqui comigo quando bater e cuidado com o pardal nas avenidas. Q abre o celular, e o mapa fica no app Mapa.\n\nBoa noite e vai com Deus!', true);
  }
  if (Profile.rides === undefined) { Profile.rides = 0; Profile.ratingSum = 0; Profile.jobs = 0; }
  if (!Profile.sosMsg) { Profile.sosMsg = true; addMsg(ZE, 'Socorro 24h', 'Ficou sem gasolina ou bateu feio no meio do caminho? Me chama aqui no zap que eu vou até você com o guincho. Levo gasolina e ferramenta. Cobro 15% a mais que na oficina, por causa do deslocamento.', true); }
}
function randomHome(nx, ny, dmin, dmax) {
  const pool = World.homes.filter((h) => { const d = Math.hypot(h.x - nx, h.y - ny); return d > dmin && d < dmax; });
  return pick(pool.length ? pool : World.homes);
}
function routeLen(a, b) { const r = gpsRoute(a.x, a.y, b.x, b.y); return r ? r.len : Math.hypot(a.x - b.x, a.y - b.y) * 1.3; }
function genJob(type) {
  const J = JOB_TYPES[type];
  let pickPt, dest;
  const P = { x: player.x, y: player.y };
  if (type === 'pickup') {
    const s = pick(World.shops.filter((x) => ['mercado', 'paneleiras', 'oficina', 'sitio', 'fazenda'].includes(x.kind)));
    pickPt = { x: s.x, y: s.y, name: s.name }; const h = randomHome(s.x, s.y, 900, 3600); dest = { x: h.x, y: h.y, name: h.name };
  } else if (type === 'bau') {
    const d = World.depots.bau; pickPt = { x: d.x, y: d.y, name: d.name };
    const s = pick(World.shops.filter((x) => ['mercado', 'padaria', 'farmacia', 'lanchonete', 'churrascaria', 'bar', 'moquecaria', 'fazenda', 'sitio'].includes(x.kind)));
    dest = { x: s.x, y: s.y, name: s.name };
  } else if (type === 'gas') {
    const d = World.depots.gas; pickPt = { x: d.x, y: d.y, name: d.name }; const h = randomHome(d.x, d.y, 700, 4000); dest = { x: h.x, y: h.y, name: h.name };
  } else if (type === 'tanker') {
    const d = World.depots.fuel; pickPt = { x: d.x, y: d.y, name: d.name }; const s = pick(World.shops.filter((x) => x.kind === 'posto')); dest = { x: s.x, y: s.y, name: s.name };
  } else if (type === 'cacamba') {
    const o = pick(World.obras); pickPt = { x: o.x, y: o.y, name: o.name }; const d = World.depots.aterro; dest = { x: d.x, y: d.y, name: d.name };
  } else {
    const h = randomHome(P.x, P.y, 500, 2600); pickPt = { x: h.x, y: h.y, name: h.name };
    const s = World.shops.find((x) => x.kind === 'oficina'); dest = { x: s.x, y: s.y, name: s.name };
  }
  const len = routeLen(pickPt, dest) + routeLen(P, pickPt) * 0.3;
  const reward = Math.round((90 + len * 0.08) * J.mult / 5) * 5;
  return { type, item: pick(J.items), pick: pickPt, dest, len, reward, par: len / 190 + 35, fragile: !!J.fragile, hot: false, jobName: J.name, color: pick(CAR_COLORS) };
}
function startJob(job) {
  Act.delivery = Object.assign({}, job, { t: 0, hits: 0, stage: 'pickup', shop: { name: job.pick.name } });
  Act.gpsT = 0;
  AudioSys.chime();
  toast(job.jobName + ' aceito', 'Buscar ' + job.item.toLowerCase() + ' em ' + job.pick.name + '.', 'info');
}
// ---------- app de motorista ----------
function newRideRequest() {
  const near = World.homes.concat(World.shops.map((s) => ({ x: s.x, y: s.y, name: s.name })));
  const pool = near.filter((h) => { const d = Math.hypot(h.x - player.x, h.y - player.y); return d > 250 && d < 1300; });
  const pk = pick(pool.length ? pool : near);
  const dd = near.filter((h) => { const d = Math.hypot(h.x - pk.x, h.y - pk.y); return d > 900 && d < 3600; });
  const ds = pick(dd.length ? dd : near);
  const len = routeLen(pk, ds);
  Act.ride = { name: pick(PASSAGEIROS), pick: { x: pk.x, y: pk.y, name: pk.name }, dest: { x: ds.x, y: ds.y, name: ds.name }, len, fare: Math.round((8 + len * 0.048) / 1) , stage: 'pickup', hits: 0, t: 0, seed: rnd() };
  Act.gpsT = 0;
  AudioSys.tone(988, 0.1, 'square', 0.06, 'ui'); AudioSys.tone(1319, 0.14, 'square', 0.06, 'ui', null, 0.12);
  toast('PegaAí: nova corrida', Act.ride.name + ' em ' + pk.name + ' · R$ ' + Act.ride.fare, 'info');
}
function canDriveRides() { return player && VMODELS[player.car.model].kind !== 'truck'; }
// ---------- racha ----------
function rachaOpen() { const t = Profile.time; return t >= 22 * 60 && t < 28 * 60 + 30; }
function startRacha(r) {
  if (Profile.money < r.bet) { toast('Sem grana pra aposta', 'O racha custa R$ ' + fmtMoney(r.bet) + '.', 'bad'); AudioSys.error(); return; }
  Profile.money -= r.bet; UI.moneyDelta(-r.bet);
  Act.race = { r, idx: 0, t: 0, count: 3.4, lastBeep: 4, racha: true };
  toast('Racha contra ' + r.rival, 'Aposta R$ ' + fmtMoney(r.bet) + ' · tempo dele: ' + fmtTime(r.rivalTime) + '. Fuja das viaturas!', 'bad');
}
function finishRacha(R) {
  const r = R.r;
  Act.race = null;
  if (R.t < r.rivalTime) { AudioSys.chime(); pay(r.bet * 2, 'Ganhou o racha de ' + r.rival + '! (' + fmtTime(R.t) + ')'); }
  else toast('Perdeu o racha', r.rival + ' chegou antes (' + fmtTime(r.rivalTime) + ' contra ' + fmtTime(R.t) + '). Já era a aposta.', 'bad');
  saveGame();
}
function rachaGhostPos(R) {
  const r = R.r, d = clamp(R.t / r.rivalTime, 0, 1) * r.len;
  let acc = 0;
  for (let i = 1; i < r.all.length; i++) {
    const a = r.all[i - 1], b = r.all[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (acc + L >= d) { const k = (d - acc) / L; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])]; }
    acc += L;
  }
  const z = r.all[r.all.length - 1]; return [z[0], z[1], 0];
}
// ---------- música do gás ----------
const GasJingle = { t: 0 };
function gasJingle(dt) {
  if (!AudioSys.ok || !player || player.car.job !== 'gas' || !Act.delivery || Act.delivery.stage !== 'deliver') { GasJingle.t = 0; return; }
  GasJingle.t -= dt;
  if (GasJingle.t > 0) return;
  GasJingle.t = 7;
  // "Pour Elise" (domínio público), a musiquinha do caminhão de gás
  const N = [659, 622, 659, 622, 659, 494, 587, 523, 440];
  N.forEach((f, i) => { AudioSys.tone(f, 0.22, 'triangle', 0.05, 'engine', null, i * 0.18); AudioSys.tone(f * 2, 0.12, 'sine', 0.015, 'engine', null, i * 0.18); });
}
// ---------- atualização ----------
function updateJobs(dt) {
  const p = player, sp = p.speed;
  ensurePhoneData();
  // estágio de coleta de fretes
  if (Act.delivery && Act.delivery.stage === 'pickup') {
    const d = Act.delivery;
    if (Math.hypot(d.pick.x - p.x, d.pick.y - p.y) < 75 && sp < 40) {
      d.stage = 'deliver'; d.t = 0; Act.gpsT = 0;
      AudioSys.thud(); AudioSys.tone(660, 0.1, 'triangle', 0.08, 'ui');
      toast('Carregado!', d.item + ' a bordo. Leve até ' + d.dest.name + '.', 'good');
    }
  }
  gasJingle(dt);
  // app de motorista
  if (Act.rideOnline && !Act.ride && !Act.delivery && !Act.race) {
    Act.rideT -= dt;
    if (Act.rideT <= 0) newRideRequest();
  }
  if (Act.ride) {
    const R = Act.ride;
    R.t += dt;
    if (R.stage === 'pickup' && Math.hypot(R.pick.x - p.x, R.pick.y - p.y) < 70 && sp < 35) {
      R.stage = 'drive'; R.t = 0; Act.gpsT = 0; AudioSys.thud();
      toast(R.name + ' entrou', pick(FALAS_EMBARQUE), 'info');
    } else if (R.stage === 'drive' && Math.hypot(R.dest.x - p.x, R.dest.y - p.y) < 70 && sp < 35) {
      const stars = clamp(5 - R.hits - (R.t > R.len / 120 + 40 ? 1 : 0), 1, 5);
      const v = Math.round(R.fare * (0.6 + stars * 0.1));
      Profile.rides++; Profile.ratingSum += stars;
      Act.ride = null; Act.rideT = rnd(4, 9);
      pay(v, 'Corrida finalizada ' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + ' · ' + R.name);
      saveGame();
    }
  }
  // racha: polícia de olho
  if (Act.race && Act.race.racha && Act.race.count <= 0) {
    for (const c of Traffic.cars) {
      if (c.model !== 'police') continue;
      if (Math.hypot(c.x - p.x, c.y - p.y) < 380) {
        Act.race = null;
        const fine = Math.min(300, Math.max(0, Math.floor(Profile.money)));
        Cam.flash = 0.6; AudioSys.siren();
        if (fine) pay(-fine, 'Sujou! A viatura viu o racha. Multa e aposta perdida.'); else toast('Sujou!', 'A viatura viu o racha. Aposta perdida.', 'bad');
        break;
      }
    }
  }
  // convite do racha quando chega a madrugada
  if (rachaOpen() && !Profile.rachaMsg) { Profile.rachaMsg = true; addMsg('Zé do Canecão', 'Racha hoje?', 'E aí, parceiro. Hoje tem racha: arrancada na BR-101, pega na Avenida Carapina e o racha do Centrão. Aposta na hora, quem ganhar leva o dobro. Abre o app Racha que eu te passo o ponto. Só fica esperto com a viatura, que se ela vir, é multa na certa.', false,
    [['Tô dentro!', 'Fechou! Abre o app Racha que o ponto tá lá. Chega quieto e sem farol alto.'], ['Hoje não, valeu', 'Tranquilo, parceiro. Até a madrugada acaba, se mudar de ideia é só chegar.']]); }
  if (!rachaOpen()) Profile.rachaMsg = false;
}

/* ---------- socorro do Seu Zé: chama pelo zap e ele vem de guincho (15% mais caro que a oficina) ---------- */
const ZE = 'Seu Zé (Oficina)';
const Socorro = { job: null };
function socorroQuote(kind) {
  const fuel = Math.ceil(Math.max(0, 100 - Profile.fuel) * 1.8 * 1.15), fix = Math.ceil(Profile.damage * 4 * 1.15);
  return kind === 'gas' ? fuel : kind === 'fix' ? fix : fuel + fix;
}
function socorroCall(kind) {
  if (Socorro.job || !player) return;
  // sai da oficina se ela estiver perto; senão aparece numa rua a uns 1,2 km de você
  const of = World.shops.find((s) => s.kind === 'oficina');
  let sx, sy;
  if (of && Math.hypot(of.x - player.x, of.y - player.y) < 2600) { sx = of.x; sy = of.y; }
  else { const a = rnd(TAU); const ne = nearestEdge(clamp(player.x + Math.cos(a) * 1300, 100, WORLD_W - 100), clamp(player.y + Math.sin(a) * 1300, 100, WORLD_H - 100)); sx = ne.e.h ? ne.e.a.x + ne.s : ne.e.a.x; sy = ne.e.h ? ne.e.a.y : ne.e.a.y + ne.s; }
  const route = gpsRoute(sx, sy, player.x, player.y);
  const pts = route ? route.pts.slice() : [[sx, sy], [player.x, player.y]];
  const J = { kind, x: sx, y: sy, a: 0, pts, ri: 1, state: 'coming', t: 0, rt: 3, quote: socorroQuote(kind) };
  Socorro.job = J;
  const len = route ? route.len : Math.hypot(sx - player.x, sy - player.y), eta = Math.max(1, Math.round(len / 280 / 20));
  const what = kind === 'gas' ? 'gasolina' : kind === 'fix' ? 'conserto' : 'gasolina e conserto';
  Profile.msgs.unshift({ from: ZE, title: '', body: 'Seu Zé, preciso de ' + what + '. Me socorre aí!', read: true, me: true, t: Math.floor(Profile.time) });
  setTimeout(() => {
    addMsg(ZE, '', 'Tô indo aí com o guincho! Fica parado num lugar seguro, com o pisca ligado. Chego em uns ' + eta + ' min. Fica uns R$ ' + fmtMoney(J.quote) + ' (15% a mais que na oficina, por causa do deslocamento).', true);
    if (Screens.current === 'screen-phone' && Phone.chat === ZE) Phone.render();
    phoneTone(1320, 0.06, 0.05);
  }, 1200);
  Act.waypoint = null; Act.gps = null;
}
function socorroCancel() {
  if (!Socorro.job) return;
  Socorro.job = null;
  Profile.msgs.unshift({ from: ZE, title: '', body: 'Seu Zé, pode cancelar, já me virei.', read: true, me: true, t: Math.floor(Profile.time) });
  setTimeout(() => { addMsg(ZE, '', 'Beleza, dei meia-volta. Qualquer coisa me chama!', true); if (Screens.current === 'screen-phone' && Phone.chat === ZE) Phone.render(); }, 900);
}
Socorro.update = function (dt) {
  const J = this.job; if (!J || !player) return;
  J.t += dt;
  if (J.state === 'coming') {
    // recalcula a rota se você saiu do lugar
    J.rt -= dt;
    const end = J.pts[J.pts.length - 1];
    if (J.rt <= 0) { J.rt = 3; if (Math.hypot(end[0] - player.x, end[1] - player.y) > 150) { const r = gpsRoute(J.x, J.y, player.x, player.y); if (r) { J.pts = r.pts.slice(); J.ri = 1; } } }
    let step = 300 * dt;
    while (step > 0 && J.ri < J.pts.length) {
      const p = J.pts[J.ri], dx = p[0] - J.x, dy = p[1] - J.y, d = Math.hypot(dx, dy);
      if (d < 0.5) { J.ri++; continue; }
      const m = Math.min(d, step); J.x += dx / d * m; J.y += dy / d * m; step -= m;
      J.a += angDiff(J.a, Math.atan2(dy, dx)) * Math.min(1, dt * 8);
      if (m >= d) J.ri++;
    }
    if (J.ri >= J.pts.length) { const dx = player.x - J.x, dy = player.y - J.y, d = Math.hypot(dx, dy); if (d > 40) { const m = Math.min(d - 40, 200 * dt); J.x += dx / d * m; J.y += dy / d * m; J.a = Math.atan2(dy, dx); } }
    if (Math.hypot(player.x - J.x, player.y - J.y) < 75) { J.state = 'arrived'; J.t = 0; toast('Seu Zé chegou!', 'Fica parado aí que ele já resolve.', 'info'); AudioSys.aiHorn(60, 'caminhao', 0); }
  } else if (J.state === 'arrived') {
    if (player.speed > 30) { J.t = 0; if (Math.hypot(player.x - J.x, player.y - J.y) > 160) { J.state = 'coming'; J.rt = 0; } return; }
    if (J.t > 0.4 && Math.floor(J.t * 2.5) !== Math.floor((J.t - dt) * 2.5)) AudioSys.wrench();
    if (J.t > 3) {
      // serviço feito: cobra o que der com o dinheiro que você tem
      const fuelNeed = J.kind !== 'fix' ? Math.max(0, 100 - Profile.fuel) : 0, dmg = J.kind !== 'gas' ? Profile.damage : 0;
      const pf = 1.8 * 1.15, pd = 4 * 1.15;
      let money = Math.max(0, Profile.money), paid = 0;
      const f = Math.min(fuelNeed, money / pf); Profile.fuel = Math.min(100, Profile.fuel + f); paid += f * pf; money -= f * pf;
      const r = Math.min(dmg, money / pd); paid += r * pd;
      if (r > 0) { const before = Profile.damage; Profile.damage = Math.max(0, Profile.damage - r); if (Profile.zones) { const k = before > 0 && Profile.damage >= 1 ? Profile.damage / before : 0; for (const z of ['f', 'r', 'l', 'rt', 'fL', 'fR']) Profile.zones[z] = (Profile.zones[z] || 0) * k; Profile.zones.seed = (Profile.zones.seed || 0) + 1; } if (Profile.damage < 1) Profile.damage = 0; }
      paid = Math.ceil(paid);
      Profile.money -= paid; UI.moneyDelta(-paid); AudioSys.chime();
      const full = (fuelNeed - f) < 1 && (dmg - r) < 1;
      toast('Socorro do Seu Zé', (full ? 'Tudo resolvido' : 'Fez o que deu com o seu dinheiro') + ' — R$ ' + fmtMoney(paid), 'good');
      addMsg(ZE, '', full ? 'Prontinho, R$ ' + fmtMoney(paid) + '. Tá rodando de novo! Vai com Deus e devagar.' : 'Fiz o que deu com os R$ ' + fmtMoney(paid) + ' que você tinha. Passa na oficina depois pra terminar.', true);
      J.state = 'leaving'; J.t = 0; saveGame();
    }
  } else if (J.state === 'leaving') {
    J.x += Math.cos(J.a) * 160 * dt; J.y += Math.sin(J.a) * 160 * dt;
    if (J.t > 6) this.job = null;
  }
};
function socorroBar(H) {
  const J = Socorro.job;
  if (J) {
    const d = Math.round(Math.hypot(J.x - player.x, J.y - player.y) * 0.09);
    return `<div class="wa-sos"><b>${J.state === 'coming' ? 'Seu Zé está a caminho · ' + (d > 1000 ? (d / 1000).toFixed(1).replace('.', ',') + ' km' : d + ' m') : J.state === 'arrived' ? 'Seu Zé chegou! Fique parado.' : 'Serviço concluído'}</b>${J.state === 'coming' ? '<button data-sos="cancel" class="off">Cancelar</button>' : ''}</div>`;
  }
  const qg = socorroQuote('gas'), qf = socorroQuote('fix');
  const btn = (k, label, q, need) => `<button data-sos="${k}" ${need ? '' : 'disabled'}>${label}<small>${need ? 'R$ ' + fmtMoney(q) : 'não precisa'}</small></button>`;
  return '<div class="wa-sos"><b>Pedir socorro (15% mais caro que a oficina)</b><div class="wa-sos-btns">' +
    btn('gas', 'Gasolina', qg, qg > 0) + btn('fix', 'Conserto', qf, qf > 0) + btn('both', 'Os dois', qg + qf, qg > 0 && qf > 0) + '</div></div>';
}

/* ---------- interface do celular ---------- */
/* ---------- celular Pera: papéis de parede capixabas, ícones e ajustes ---------- */
const PERA_LOGO = '<svg class="pera-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.4c-1.7 0-2.7 1.4-3 3.1C8.7 11.2 5.8 12.6 5.8 16.2c0 3.4 2.8 5.6 6.2 5.6s6.2-2.2 6.2-5.6c0-3.6-2.9-5-3.2-6.7-.3-1.7-1.3-3.1-3-3.1z" fill="currentColor"/><path d="M12 6.4c0-1.6.4-2.9 1.3-3.8" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M13.1 4.3c1.6-1.5 3.6-1.4 4.6-.8-1 1.7-3 2.3-4.6.8z" fill="currentColor"/></svg>';
// ícones minimalistas: um símbolo de traço branco sobre cor sólida
const _ln = (d) => `<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
const PH_ICONS = {
  mapa: ['#16a085', _ln('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>')],
  msgs: ['#25b04a', _ln('<path d="M20 11.5a7.5 7 0 0 1-10.6 6.4L4.5 19.5l1.4-4A7 7 0 0 1 4.5 11.5 7.5 7 0 0 1 20 11.5z"/>')],
  pegaai: ['#2c2c30', _ln('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 14v6M10.2 11.2 4.6 9.6M13.8 11.2l5.6-1.6"/>')],
  fretes: ['#f08a24', _ln('<path d="M12 3.5 19.5 7.5v9L12 20.5 4.5 16.5v-9z"/><path d="M4.5 7.5 12 11.5l7.5-4M12 11.5v9"/>')],
  racha: ['#e0353b', _ln('<path d="M6 21V4"/><path d="M6 4.5h11l-2.5 4 2.5 4H6"/>')],
  carteira: ['#2f6fdf', _ln('<rect x="3.5" y="6" width="17" height="13" rx="2.5"/><path d="M3.5 10h17"/><circle cx="16.5" cy="14.5" r="1" fill="#fff"/>')],
  ajustes: ['#7b808a', _ln('<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>')],
};
const PH_APPS = { mapa: 'Mapa', msgs: 'Mensagens', pegaai: 'PegaAí', fretes: 'Fretes', racha: 'Racha', carteira: 'Carteira', ajustes: 'Ajustes' };
function phIcon(id, badge) {
  const [bg, svg] = PH_ICONS[id];
  return `<button class="ph-app" data-app="${id}"><span class="ph-ico" style="background:${bg}"><svg viewBox="0 0 24 24">${svg}</svg>${badge ? `<i class="ph-badge">${badge}</i>` : ''}</span><span class="ph-lbl">${PH_APPS[id]}</span></button>`;
}
// papéis de parede: paisagens do Espírito Santo desenhadas em SVG
const WALLS = [
  { id: 'penha', name: 'Convento da Penha', place: 'Vila Velha' },
  { id: 'ponte', name: 'Terceira Ponte', place: 'Vitória' },
  { id: 'pedra', name: 'Pedra Azul', place: 'Domingos Martins' },
  { id: 'camburi', name: 'Praia de Camburi', place: 'Vitória' },
  { id: 'dunas', name: 'Dunas de Itaúnas', place: 'Conceição da Barra' },
  { id: 'bandeira', name: 'Trabalha e Confia', place: 'Bandeira capixaba' },
];
const _wallCache = {};
function wallSVG(id) {
  const R = mulberry32(id.length * 977 + id.charCodeAt(0) * 31);
  const stars = (n, y1, op) => { let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${(R() * 300).toFixed(1)}" cy="${(R() * y1).toFixed(1)}" r="${(0.4 + R() * 1.1).toFixed(2)}" fill="#fff" opacity="${(op * (0.4 + R() * 0.6)).toFixed(2)}"/>`; return s; };
  const lights = (n, y0, y1, cols) => { let s = ''; for (let i = 0; i < n; i++) s += `<rect x="${(R() * 300).toFixed(1)}" y="${(y0 + R() * (y1 - y0)).toFixed(1)}" width="1.6" height="1.6" fill="${cols[(R() * cols.length) | 0]}" opacity="${(0.5 + R() * 0.5).toFixed(2)}"/>`; return s; };
  const grad = (gid, stops, vert) => `<linearGradient id="${gid}" x1="0" y1="0" x2="${vert ? 0 : 1}" y2="${vert ? 1 : 0}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  let g = '';
  switch (id) {
    case 'penha':
      g = `<defs>${grad('s', [[0, '#0a1433'], [0.55, '#3a2a6a'], [0.8, '#d0607a'], [1, '#f2a25a']], 1)}${grad('w', [[0, '#1c2550'], [1, '#05081a']], 1)}</defs>
      <rect width="300" height="600" fill="url(#s)"/>${stars(70, 260, 1)}
      <path d="M0 470 C40 455 70 440 100 400 C120 370 140 330 160 318 C175 309 205 306 222 318 C240 334 255 380 275 420 C285 440 295 455 300 462 V600 H0Z" fill="#1a1a2e"/>
      <path d="M118 380 C135 350 150 330 165 322 L170 340 C150 352 135 370 125 392Z" fill="#26263f"/>
      <rect x="170" y="290" width="44" height="22" fill="#e9e2cf"/><rect x="200" y="276" width="14" height="36" fill="#f2ecdc"/>
      <path d="M168 292 L192 280 L216 292Z" fill="#b5523a"/><path d="M198 278 L207 268 L216 278Z" fill="#b5523a"/>
      <rect x="176" y="297" width="4" height="7" fill="#f6c24a"/><rect x="186" y="297" width="4" height="7" fill="#f6c24a"/><rect x="205" y="284" width="4" height="6" fill="#f6c24a"/>
      <rect y="470" width="300" height="130" fill="url(#w)"/>${lights(160, 470, 600, ['#ffcf6a', '#ffe9b0', '#ff9a4a'])}
      <path d="M0 470 H300" stroke="#f2a25a" stroke-opacity="0.5"/>`;
      break;
    case 'ponte':
      g = `<defs>${grad('s', [[0, '#03061a'], [0.7, '#162452'], [1, '#2c3f7a']], 1)}${grad('w', [[0, '#0d1838'], [1, '#02040e']], 1)}</defs>
      <rect width="300" height="600" fill="url(#s)"/>${stars(80, 330, 1)}<circle cx="232" cy="96" r="22" fill="#f4efd6"/><circle cx="224" cy="90" r="22" fill="#162452" opacity="0.15"/>
      <path d="M0 360 h24 v-50 h18 v30 h14 v-62 h20 v82 h16 v-36 h22 v40 H0Z" fill="#0b1230"/><path d="M200 380 v-40 h18 v-30 h22 v50 h16 v-74 h22 v58 h22 v36Z" fill="#0b1230"/>
      ${lights(70, 300, 380, ['#ffd37a', '#bfe3ff'])}
      <rect y="380" width="300" height="220" fill="url(#w)"/>
      <path d="M-10 420 Q150 300 310 420" stroke="#d8dce8" stroke-width="5" fill="none"/>
      ${[30, 70, 110, 150, 190, 230, 270].map((x) => { const t = (x + 10) / 320, y = (1 - t) * (1 - t) * 420 + 2 * (1 - t) * t * 300 + t * t * 420; return `<rect x="${x - 3}" y="${y.toFixed(0)}" width="6" height="${(600 - y).toFixed(0)}" fill="#8a90a6" opacity="0.55"/>`; }).join('')}
      ${Array.from({ length: 26 }, (_, i) => { const t = i / 25, x = -10 + t * 320, y = (1 - t) * (1 - t) * 420 + 2 * (1 - t) * t * 300 + t * t * 420; return `<circle cx="${x.toFixed(1)}" cy="${(y - 5).toFixed(1)}" r="1.8" fill="#ffd37a"/><rect x="${(x - 1).toFixed(1)}" y="${(y + 40 + R() * 80).toFixed(0)}" width="2" height="${(12 + R() * 30).toFixed(0)}" fill="#ffd37a" opacity="0.25"/>`; }).join('')}`;
      break;
    case 'pedra':
      g = `<defs>${grad('s', [[0, '#0b0f2a'], [0.5, '#2a3a7a'], [1, '#7a8ac8']], 1)}${grad('r', [[0, '#7d93b8'], [1, '#3c4f78']], 0)}</defs>
      <rect width="300" height="600" fill="url(#s)"/>${stars(60, 220, 0.9)}
      <path d="M0 420 C40 400 60 390 90 380 L300 360 V600 H0Z" fill="#26305a"/>
      <path d="M60 420 C70 330 105 230 165 215 C220 205 250 290 262 420Z" fill="url(#r)"/>
      <path d="M150 230 C160 280 158 340 170 410" stroke="#5f7298" stroke-width="5" fill="none" opacity="0.7"/><path d="M196 222 C210 260 222 320 232 410" stroke="#a8b8d6" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M232 300 C240 270 258 266 268 290 C274 320 276 370 280 420 H232Z" fill="#4c6190"/>
      <rect y="410" width="300" height="190" fill="#121a36"/>
      ${Array.from({ length: 30 }, (_, i) => { const x = i * 10.5 + R() * 6, h = 30 + R() * 40, y = 415 + R() * 30; return `<path d="M${x.toFixed(0)} ${(y - h).toFixed(0)} L${(x + 9).toFixed(0)} ${y.toFixed(0)} L${(x - 9).toFixed(0)} ${y.toFixed(0)}Z" fill="#0a1226"/>`; }).join('')}
      <rect y="440" width="300" height="160" fill="#070c1c"/><rect y="400" width="300" height="30" fill="#c8d4f0" opacity="0.08"/>`;
      break;
    case 'camburi':
      g = `<defs>${grad('s', [[0, '#3a2a6a'], [0.45, '#d65a6a'], [0.75, '#ffa64a'], [1, '#ffd27a']], 1)}${grad('w', [[0, '#c8706a'], [1, '#203a6a']], 1)}</defs>
      <rect width="300" height="600" fill="url(#s)"/><circle cx="150" cy="345" r="40" fill="#ffe7a0"/>
      <rect y="350" width="300" height="140" fill="url(#w)"/>
      ${Array.from({ length: 16 }, (_, i) => `<rect x="${(150 - 30 + R() * 60 - i * 1.5).toFixed(0)}" y="${358 + i * 8}" width="${(20 + R() * 40 - i).toFixed(0)}" height="2" fill="#ffe7a0" opacity="${(0.8 - i * 0.04).toFixed(2)}"/>`).join('')}
      <path d="M20 345 h30 v-6 h16 v6 h8 v5 h-54z" fill="#2a2440"/><path d="M228 346 h40 v-5 h10 v5 h6 v4 h-56z" fill="#2a2440"/>
      <path d="M0 490 Q150 470 300 490 V600 H0Z" fill="#e8c890"/><path d="M0 500 Q150 482 300 500" stroke="#fff" stroke-opacity="0.5" fill="none"/>
      <path d="M58 600 C62 540 60 500 70 440" stroke="#2a1a24" stroke-width="7" fill="none"/>
      <path d="M70 440 C50 430 30 438 18 452 M70 440 C90 425 112 430 126 446 M70 440 C60 420 46 408 30 404 M70 440 C84 418 102 410 118 412 M70 440 C72 425 70 410 64 398" stroke="#2a1a24" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      break;
    case 'dunas':
      g = `<defs>${grad('s', [[0, '#050a22'], [0.6, '#14285a'], [1, '#2a4c84']], 1)}</defs>
      <rect width="300" height="600" fill="url(#s)"/>${stars(110, 360, 1)}<circle cx="90" cy="150" r="30" fill="#fbf6e0"/><circle cx="90" cy="150" r="50" fill="#fbf6e0" opacity="0.08"/>
      <path d="M0 380 C60 340 120 350 180 380 C230 404 270 370 300 360 V600 H0Z" fill="#6a6a8a"/>
      <path d="M0 430 C80 390 150 400 210 440 C250 466 280 440 300 430 V600 H0Z" fill="#8a7e8e"/>
      <path d="M0 500 C70 470 140 480 200 510 C240 528 270 515 300 505 V600 H0Z" fill="#a8968e"/>
      <path d="M0 430 C80 390 150 400 210 440" stroke="#d8cfd0" stroke-opacity="0.5" fill="none"/><path d="M0 500 C70 470 140 480 200 510" stroke="#efe2d6" stroke-opacity="0.5" fill="none"/>
      <path d="M232 500 C236 470 238 456 246 440" stroke="#2a2440" stroke-width="3" fill="none"/><path d="M246 440 l-12 4 M246 440 l12 2 M246 440 l-6 -10 M246 440 l8 -9" stroke="#2a2440" stroke-width="2.5" stroke-linecap="round"/>`;
      break;
    default:
      g = `<defs>${grad('b', [[0, '#16408a'], [1, '#2a62c4']], 0)}${grad('p', [[0, '#e07aa6'], [1, '#f2a8c6']], 0)}</defs>
      <rect width="300" height="600" fill="#f4f4f0"/>
      <path d="M0 0 H300 V170 L0 290Z" fill="url(#b)"/><path d="M0 390 L300 270 V600 H0Z" fill="url(#p)"/>
      <path d="M0 290 L300 170" stroke="#fff" stroke-width="2"/>
      <text x="150" y="312" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="700" fill="#16408a" transform="rotate(-21.8 150 312)" letter-spacing="2">TRABALHA E CONFIA</text>
      ${stars(40, 160, 0.5)}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 600" preserveAspectRatio="xMidYMid slice">${g}</svg>`;
}
function wallURL(id) { if (!_wallCache[id]) _wallCache[id] = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(wallSVG(id)) + '")'; return _wallCache[id]; }
function phoneCfg() { if (!Profile.phone) Profile.phone = { wall: 'auto', notif: true, sounds: true, lastSave: null }; return Profile.phone; }
function phoneTone(f, d, v, delay) { if (phoneCfg().sounds) AudioSys.tone(f, d, 'sine', v, 'ui', null, delay); }
const PERA_OS = '18.4';

const Phone = {
  app: 'home', fretes: [], fretesT: -1e9, chat: null,
  open(app) {
    ensurePhoneData(); const cfg = phoneCfg();
    if (cfg.wall === 'auto' || !WALLS.some((w) => w.id === cfg.wall)) { let w; do { w = pick(WALLS).id; } while (w === this.wall); this.wall = w; } else this.wall = cfg.wall;
    this.app = app || 'home'; if (Screens.current !== 'screen-phone') Screens.open('screen-phone'); this.render(); phoneTone(1200, 0.05, 0.05);
  },
  go(app) { this.app = app; this.chat = null; if (app === 'aj-update') this.updT = performance.now(); this.render(); if (phoneCfg().sounds) AudioSys.click(); },
  render() {
    const body = $('phone-body'); if (!body) return;
    $('phone-clock').textContent = clockStr();
    const unread = (Profile.msgs || []).filter((m) => !m.read).length;
    const H = (s) => escapeHtml(s);
    let html = '';
    const scr = $('phone-screen'), cfg = phoneCfg();
    if (scr) { scr.style.backgroundImage = wallURL(this.wall || 'penha'); scr.classList.toggle('inapp', this.app !== 'home'); }
    body.classList.toggle('home', this.app === 'home');
    const row = (go, label, val, cls) => `<button class="aj-row${cls ? ' ' + cls : ''}" ${go ? `data-go="${go}"` : ''}><span>${label}</span><em>${val || ''}${go ? '<i class="chev"></i>' : ''}</em></button>`;
    const tog = (k, label) => `<button class="aj-row" data-tog="${k}"><span>${label}</span><i class="ios-tog${(k === 'autoWall' ? cfg.wall === 'auto' : cfg[k]) ? ' on' : ''}"></i></button>`;
    if (this.app === 'home') {
      const W = WALLS.find((w) => w.id === this.wall) || WALLS[0];
      const hr = Math.floor(Profile.time / 60) % 24, temp = Math.round(27 - ((hr + 24 - 19) % 24) * 0.55);
      const dest = Act.waypoint ? Act.waypoint.label : null, job = Act.delivery ? Act.delivery.item : Act.ride ? 'Corrida: ' + Act.ride.name : null;
      html = `<div class="ph-lock"><div class="ph-date">São Gambiarra · ES</div><div class="ph-time">${clockStr()}</div></div>` +
        `<div class="ph-widgets"><div class="ph-wid wid-sky"><small>São Gambiarra</small><b>${temp}°</b><span>${hr >= 19 || hr < 5 ? 'Noite abafada' : 'Céu limpo'}</span><span class="wid-sub">Máx. 31° Mín. 21°</span></div>` +
        `<button class="ph-wid wid-money" data-app="carteira"><small>Carteira</small><b>R$ ${fmtMoney(Profile.money)}</b><span>${Profile.deliveries || 0} entregas · ${Profile.rides || 0} corridas</span><span class="wid-sub">${job ? H(job) : dest ? 'Destino: ' + H(dest) : 'Nenhum serviço ativo'}</span></button></div>` +
        '<div class="ph-grid">' + ['fretes', 'racha', 'carteira'].map((id) => phIcon(id)).join('') + '</div>' +
        `<div class="ph-wname">${H(W.name)} · ${H(W.place)}</div>` +
        '<div class="ph-dock">' + ['mapa', 'msgs', 'pegaai', 'ajustes'].map((id) => phIcon(id, id === 'msgs' ? unread : 0)).join('') + '</div>';
    } else if (this.app === 'ajustes') {
      html = '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Ajustes</div>' +
        `<div class="aj-group"><div class="aj-prof"><span class="aj-ava">${PERA_LOGO}</span><div><b>Motorista de São Gambiarra</b><small>Pera ID · Nuvem Capixaba</small></div></div></div>` +
        '<div class="aj-group">' + row('aj-wall', 'Papel de parede', cfg.wall === 'auto' ? 'Variado' : (WALLS.find((w) => w.id === cfg.wall) || WALLS[0]).name) + tog('notif', 'Notificações') + tog('sounds', 'Sons do celular') + '</div>' +
        '<div class="aj-group">' + row('aj-sobre', 'Sobre') + row('aj-update', 'Atualização de Software') + '</div>' +
        `<div class="aj-group"><button class="aj-row aj-save" data-act2="save"><span>Salvar jogo</span></button></div><p class="aj-foot">${cfg.lastSave ? 'Último salvamento às ' + H(cfg.lastSave) + ' (horário do jogo).' : 'O jogo também salva sozinho a cada 30 segundos.'}</p>`;
    } else if (this.app === 'aj-wall') {
      html = '<div class="ph-head"><button class="ph-back" data-go="ajustes">‹</button>Papel de parede</div>' +
        '<div class="aj-group">' + tog('autoWall', 'Variar a cada vez que abrir') + '</div>' +
        '<div class="aj-walls">' + WALLS.map((w) => `<button class="aj-wall${cfg.wall === w.id ? ' sel' : ''}" data-wall="${w.id}"><span style="background-image:${wallURL(w.id).replace(/"/g, "'")}"></span><b>${H(w.name)}</b><small>${H(w.place)}</small></button>`).join('') + '</div>';
    } else if (this.app === 'aj-sobre') {
      const free = 256 - 41 - Math.min(60, Math.floor((Profile.distance || 0) / 90000));
      html = '<div class="ph-head"><button class="ph-back" data-go="ajustes">‹</button>Sobre</div><div class="aj-hero">' + PERA_LOGO + '<b>Pera 15 Pro</b></div>' +
        '<div class="aj-group">' + row(null, 'Nome', 'Pera do Motorista') + row(null, 'Versão do PeraOS', PERA_OS) + row(null, 'Modelo', 'Pera 15 Pro') + row(null, 'Operadora', 'Moqueca Tel 5G') + '</div>' +
        '<div class="aj-group">' + row(null, 'Capacidade', '256 GB') + row(null, 'Disponível', free + ' GB') + row(null, 'Apps', '7') + row(null, 'Número de série', 'PR027ES' + (1000 + ((Profile.earned || 0) % 9000))) + '</div>';
    } else if (this.app === 'aj-update') {
      const chk = performance.now() - (this.updT || 0) < 1600;
      html = '<div class="ph-head"><button class="ph-back" data-go="ajustes">‹</button>Atualização</div><div class="aj-hero big">' + PERA_LOGO +
        (chk ? '<div class="aj-spin"></div><p>Procurando atualização…</p>' : `<b>PeraOS ${PERA_OS}</b><p>Seu Pera está atualizado.</p><small>Instalada automaticamente. Inclui melhorias no app Mapa, no PegaAí e na bateria durante corridas noturnas.</small>`) + '</div>' +
        '<div class="aj-group">' + row(null, 'Atualizações automáticas', 'Ativadas') + '</div>';
      if (chk) setTimeout(() => { if (this.app === 'aj-update' && Screens.current === 'screen-phone') { this.render(); phoneTone(1320, 0.12, 0.05); } }, 1700);
    } else if (this.app === 'mapa') {
      html = `<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Mapa<button class="ph-expand" data-act2="map-full" title="Expandir o mapa em tela cheia"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>` +
        '<div class="ph-mapbox"><canvas id="phonemap"></canvas>' + MAP_CTRLS + '</div><div id="ph-map-dests" class="ph-dests"></div>';
    } else if (this.app === 'msgs') {
      const M = Profile.msgs || [];
      const fmtT = (t) => { const v = Math.floor(t || 0) % 1440; return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0'); };
      const ava = (n) => { const ini = n.replace(/\(.*\)/, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(); const hue = Math.floor(hash2(n.length * 13, n.charCodeAt(0) + n.charCodeAt(n.length - 1)) * 360); return `<span class="wa-ava" style="background:hsl(${hue} 45% 42%)">${H(ini)}</span>`; };
      if (this.chat) {
        const conv = M.filter((m) => m.from === this.chat).slice().reverse();
        conv.forEach((m) => { m.read = true; });
        html = `<div class="wa-top"><button class="ph-back" data-go="msgs">‹</button>${ava(this.chat)}<div><b>${H(this.chat)}</b><small>online</small></div></div><div class="wa-chat"><div class="wa-day">HOJE</div>` +
          conv.map((m) => `<div class="wa-msg ${m.me ? 'me' : ''}">${m.title && !m.me ? `<b>${H(m.title)}</b>` : ''}${H(m.body).replace(/\n/g, '<br>')}<i>${fmtT(m.t)}${m.me ? ' <span class="wa-ok">✓✓</span>' : ''}</i></div>`).join('') +
          '</div>';
        // só dá para responder a última mensagem do contato, se ela pedir resposta e ainda não foi respondida
        const lastIn = M.find((m) => m.from === this.chat);
        if (this.chat === ZE && Game.mode === 'play') html += socorroBar(H);
        else if (lastIn && !lastIn.me && lastIn.rep && !lastIn.answered) html += '<div class="wa-quick">' + lastIn.rep.map(([q], i) => `<button data-reply="${i}">${H(q)}</button>`).join('') + '</div>';
        else html += '<div class="wa-bar">' + (conv.some((m) => m.me || m.answered) ? 'Você já respondeu esta conversa' : 'Mensagem informativa · não precisa responder') + '</div>';
      } else {
        const order = [], last = {}, unread = {};
        for (const m of M) { if (!(m.from in last)) { last[m.from] = m; order.push(m.from); } if (!m.read && !m.me) unread[m.from] = (unread[m.from] || 0) + 1; }
        html = '<div class="wa-head"><button class="ph-back" data-go="home">‹</button><b>Conversas</b></div>' +
          (order.length ? order.map((n) => { const m = last[n], u = unread[n]; return `<button class="wa-row" data-chat="${H(n)}">${ava(n)}<div class="wa-mid"><b>${H(n)}</b><span>${m.me ? '<em>Você:</em> ' : ''}${H((m.me ? m.body : m.title || m.body).slice(0, 60))}</span></div><div class="wa-side"><small class="${u ? 'new' : ''}">${fmtT(m.t)}</small>${u ? `<i>${u}</i>` : ''}</div></button>`; }).join('') : '<p class="ph-empty">Nenhuma conversa.</p>');
      }
    } else if (this.app === 'pegaai') {
      const ok = canDriveRides();
      const avg = Profile.rides ? (Profile.ratingSum / Profile.rides).toFixed(1).replace('.', ',') : '–';
      html = `<div class="ph-head"><button class="ph-back" data-go="home">‹</button>PegaAí Motorista</div><div class="ph-card"><div class="ph-big">${Act.rideOnline ? 'Você está ONLINE' : 'Você está offline'}</div><p>${Profile.rides} corridas · nota ${avg} ★</p>` +
        (Act.ride ? `<p><b>${H(Act.ride.name)}</b><br>${Act.ride.stage === 'pickup' ? 'Buscar em ' + H(Act.ride.pick.name) : 'Levar até ' + H(Act.ride.dest.name)}<br>R$ ${Act.ride.fare}</p>` : '') + '</div>' +
        (ok ? `<button class="ph-btn ${Act.rideOnline ? 'off' : ''}" data-act2="ride-toggle">${Act.rideOnline ? 'Ficar offline' : 'Ficar online'}</button>` : '<p class="ph-empty">Caminhão não roda no PegaAí. Use um carro de passeio ou a picape.</p>') +
        '<p class="ph-note">Corridas aparecem perto de você. Busque o passageiro, leve ao destino e pare. Batida e demora derrubam a nota e a gorjeta.</p>';
    } else if (this.app === 'fretes') {
      const job = player.car.job;
      html = '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Fretes</div>';
      if (!job) html += '<p class="ph-empty">Seu veículo não faz fretes. Compre um veículo de trabalho na garagem: o mais barato é a Picape do Peão (R$ 3.500). Também tem caminhão de gás, guincho, caçamba, baú e tanque.</p>';
      else if (Act.delivery) html += `<div class="ph-card"><div class="ph-big">${H(Act.delivery.item)}</div><p>${Act.delivery.stage === 'pickup' ? 'Buscar em ' + H(Act.delivery.pick ? Act.delivery.pick.name : '') : 'Entregar em ' + H(Act.delivery.dest.name)}<br>R$ ${fmtMoney(Act.delivery.reward)}</p></div><button class="ph-btn off" data-act2="job-cancel">Cancelar frete</button>`;
      else {
        if (Game.time - this.fretesT > 60 || !this.fretes.length || this.fretes[0].type !== job) { this.fretes = [genJob(job), genJob(job), genJob(job)]; this.fretesT = Game.time; }
        html += `<p class="ph-note">${H(JOB_TYPES[job].name)} · ${H(player.car.name)}</p>` + this.fretes.map((f, i) => `<button class="ph-row" data-job="${i}"><b>${H(f.item)} · R$ ${fmtMoney(f.reward)}</b><span>${H(f.pick.name)} → ${H(f.dest.name)} · ${(f.len * 0.09 / 1000).toFixed(1).replace('.', ',')} km</span></button>`).join('');
      }
    } else if (this.app === 'racha') {
      const open = rachaOpen();
      html = '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Racha</div>' + (open ? '<p class="ph-note">Madrugada liberada. Vá até o ponto e aperte E. Quem ganhar leva o dobro da aposta. Se uma viatura chegar perto, é multa e aposta perdida.</p>' : '<p class="ph-empty">Os rachas só rolam de madrugada, das 22h às 4h30. Agora são ' + clockStr() + '.</p>') +
        World.rachas.map((r, i) => `<button class="ph-row" data-racha="${i}"><b>${H(r.name)} · aposta R$ ${fmtMoney(r.bet)}</b><span>contra ${H(r.rival)} (${fmtTime(r.rivalTime)}) · toque para marcar no GPS</span></button>`).join('');
    } else if (this.app === 'carteira') {
      html = `<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Carteira</div><div class="ph-card"><div class="ph-big">R$ ${fmtMoney(Profile.money)}</div><p>Total ganho: R$ ${fmtMoney(Profile.earned)}</p></div>` +
        `<div class="ph-row static"><b>Entregas e fretes</b><span>${Profile.deliveries} concluídos</span></div><div class="ph-row static"><b>Corridas no PegaAí</b><span>${Profile.rides || 0}</span></div><div class="ph-row static"><b>Veículo atual</b><span>${H(player.car.name)}</span></div>`;
    }
    body.innerHTML = html;
    if (this.app === 'mapa') { phoneMap = new MapView($('phonemap'), MapState.phone); renderMapDests(); requestAnimationFrame(() => phoneMap && phoneMap.draw()); } else phoneMap = null;
    if (this.chat) { const ch = body.querySelector('.wa-chat'); if (ch) body.scrollTop = body.scrollHeight; }
  },
  click(e) {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.app) { this.go(t.dataset.app); return; }
    if (t.dataset.mz) { if (phoneMap) mapCtrl(phoneMap, t.dataset.mz); return; }
    if (t.dataset.sos) { if (t.dataset.sos === 'cancel') socorroCancel(); else socorroCall(t.dataset.sos); phoneTone(1760, 0.05, 0.04); this.render(); return; }
    if (t.dataset.chat) { this.chat = t.dataset.chat; this.render(); if (phoneCfg().sounds) AudioSys.click(); return; }
    if (t.dataset.reply && this.chat) {
      const who = this.chat, src = Profile.msgs.find((m) => m.from === who);
      if (!src || !src.rep || src.answered) return;
      const [q, ans] = src.rep[+t.dataset.reply] || [];
      if (!q) return;
      src.answered = true;
      Profile.msgs.unshift({ from: who, title: '', body: q, read: true, me: true, t: Math.floor(Profile.time) });
      phoneTone(1760, 0.05, 0.04); this.render();
      if (ans) setTimeout(() => { addMsg(who, '', ans, true); if (Screens.current === 'screen-phone' && Phone.chat === who) { phoneTone(1320, 0.06, 0.05); Phone.render(); } }, 1800);
      return;
    }
    if (t.dataset.go) { this.go(t.dataset.go); return; }
    if (t.dataset.job) { const j = this.fretes[+t.dataset.job]; if (j && !Act.delivery && !Act.race) { startJob(j); this.fretes = []; Screens.closeAll(); } return; }
    if (t.dataset.racha) { const r = World.rachas[+t.dataset.racha]; Act.waypoint = { x: r.start[0], y: r.start[1], label: 'Racha: ' + r.name }; Act.gpsT = 0; AudioSys.click(); toast('Ponto do racha no GPS', r.name, 'info'); Screens.closeAll(); return; }
    if (t.dataset.tog) {
      const cfg = phoneCfg(), k = t.dataset.tog;
      if (k === 'autoWall') cfg.wall = cfg.wall === 'auto' ? this.wall : 'auto'; else cfg[k] = !cfg[k];
      phoneTone(900, 0.04, 0.05); this.render(); return;
    }
    if (t.dataset.wall) { phoneCfg().wall = this.wall = t.dataset.wall; phoneTone(1100, 0.05, 0.05); this.render(); return; }
    const a = t.dataset.act2;
    if (a === 'map-full') { Object.assign(MapState.full, MapState.phone); Screens.open('screen-map'); AudioSys.click(); return; }
    if (a === 'save') { saveGame(); phoneCfg().lastSave = clockStr(); writeProfile(); AudioSys.chime(); toast('Jogo salvo', 'Progresso, dinheiro e carros guardados neste navegador.', 'good'); this.render(); return; }
    if (a === 'ride-toggle') { Act.rideOnline = !Act.rideOnline; Act.rideT = rnd(3, 6); if (!Act.rideOnline) Act.ride = null; AudioSys.click(); this.render(); }
    if (a === 'job-cancel') { Act.delivery = null; toast('Frete cancelado', '', 'bad'); AudioSys.back(); this.render(); }
  },
};
/* ============================ RENDERIZAÇÃO ============================ */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const lightCanvas = document.createElement('canvas');
const lctx = lightCanvas.getContext('2d');
const glowCanvas = document.createElement('canvas');
const gctx = glowCanvas.getContext('2d');
let RS = 1, LS = 0.5, SCREEN_W = 1, SCREEN_H = 1;
const Cam = { x: 1000, y: 2700, zoom: 1, shake: 0, quick: 1, view: { x0: 0, y0: 0, x1: 0, y1: 0 }, dark: 0.84, menuTarget: null, menuT: 0 };
const PAR = 1 / 1700;
const SQ = 1;      // visão de cima (sem achatamento vertical)
const TILT_H = 0;  // sem inclinação extra: só a paralaxe 2.5D a partir do centro da tela

function resize() {
  SCREEN_W = window.innerWidth; SCREEN_H = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  RS = Settings.quality === 'alta' ? Math.min(dpr, 2) : Settings.quality === 'baixa' ? Math.min(dpr, 1) * 0.7 : Math.min(dpr, 1.25);
  canvas.width = Math.round(SCREEN_W * RS); canvas.height = Math.round(SCREEN_H * RS);
  LS = Settings.quality === 'alta' ? 0.8 : Settings.quality === 'baixa' ? 0.28 : 0.45;
  lightCanvas.width = Math.ceil(SCREEN_W * LS); lightCanvas.height = Math.ceil(SCREEN_H * LS);
  glowCanvas.width = lightCanvas.width; glowCanvas.height = lightCanvas.height;
}
function screenZoomBase() { return clamp(Math.min(SCREEN_W, SCREEN_H * 1.45) / 1250, 0.62, 1.5); }

function updateCamera(dt) {
  let tx, ty, sp = 0;
  if (Game.state === 'menu' || !player) {
    Cam.menuT -= dt;
    if (!Cam.menuTarget || !Cam.menuTarget.alive || Cam.menuT <= 0) {
      const city = Traffic.cars.filter((c) => c.x < 4600 && c.y < 5300 && c.model !== 'tractor');
      Cam.menuTarget = pick(city.length ? city : Traffic.cars) || null; Cam.menuT = 14;
    }
    if (Cam.menuTarget) { tx = Cam.menuTarget.x + Math.cos(Cam.menuTarget.a) * 60; ty = Cam.menuTarget.y + Math.sin(Cam.menuTarget.a) * 60; sp = Cam.menuTarget.v; }
    else { tx = 1756; ty = 1260; }
    const k = 1 - Math.exp(-1.6 * dt);
    Cam.x += (tx - Cam.x) * k; Cam.y += (ty - Cam.y) * k;
    Cam.zoom = lerp(Cam.zoom, screenZoomBase() * 0.95, 1 - Math.exp(-2 * dt));
  } else {
    sp = player.speed;
    const la = clamp(0.32, 0, 1);
    let lx = player.vx * la, ly = player.vy * la;
    const ll = Math.hypot(lx, ly); if (ll > 210) { lx *= 210 / ll; ly *= 210 / ll; }
    tx = player.x + lx; ty = player.y + ly;
    const k = 1 - Math.exp(-5 * dt);
    Cam.x += (tx - Cam.x) * k; Cam.y += (ty - Cam.y) * k;
    const target = screenZoomBase() * (Settings.zoom / 100) * Cam.quick * (1 - clamp(sp / 700, 0, 1) * 0.22);
    Cam.zoom = lerp(Cam.zoom, target, 1 - Math.exp(-2.5 * dt));
  }
  Cam.shake *= Math.exp(-7 * dt);
  Cam.flash = (Cam.flash || 0) * Math.exp(-5 * dt);
  const rk = regionKeyAt(Cam.x, Cam.y);
  let dk = REGIONS[rk].dark;
  const tm = Profile.time % 1440;
  const deep = tm >= 60 && tm < 240 ? 0.025 : 0;
  Cam.dark = lerp(Cam.dark, dk + deep, 1 - Math.exp(-1.2 * dt));
}

/* ---------- chão pré-renderizado ---------- */
const CHUNK = 512;
const chunks = new Map();
let frameNo = 0;
const _bq = [];
function maxChunks() { return Settings.quality === 'baixa' ? 24 : Settings.quality === 'alta' ? 64 : 46; }
function renderChunk(cx, cy) {
  const cv = makeCanvas(CHUNK, CHUNK), g = cv.getContext('2d');
  const X = cx * CHUNK, Y = cy * CHUNK;
  CHUNK_BOX = { x0: X, y0: Y, x1: X + CHUNK, y1: Y + CHUNK };
  g.translate(-X, -Y);
  g.fillStyle = pat(g, 'grass'); g.fillRect(X, Y, CHUNK, CHUNK);
  bakeGrid.query(X, Y, X + CHUNK - 1, Y + CHUNK - 1, _bq);
  _bq.sort((a, b) => a.z - b.z || a.o - b.o);
  for (const it of _bq) {
    if (it.x1 < X || it.x0 > X + CHUNK || it.y1 < Y || it.y0 > Y + CHUNK) continue;
    try { it.fn(g); } catch (err) { console.warn('bake', err); }
  }
  const ch = { cv, used: frameNo };
  chunks.set(cy * 1000 + cx, ch);
  if (chunks.size > maxChunks()) {
    let oldK = null, oldU = Infinity;
    for (const [k, v] of chunks) if (v.used < oldU) { oldU = v.used; oldK = k; }
    if (oldK !== null) chunks.delete(oldK);
  }
  return ch;
}
function drawGround(view, force) {
  const x0 = Math.max(0, Math.floor(view.x0 / CHUNK)), x1 = Math.min(Math.ceil(WORLD_W / CHUNK) - 1, Math.floor(view.x1 / CHUNK));
  const y0 = Math.max(0, Math.floor(view.y0 / CHUNK)), y1 = Math.min(Math.ceil(WORLD_H / CHUNK) - 1, Math.floor(view.y1 / CHUNK));
  let budget = force ? 999 : 2;
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
    let ch = chunks.get(cy * 1000 + cx);
    if (!ch && budget > 0) { ch = renderChunk(cx, cy); budget--; }
    if (ch) { ch.used = frameNo; ctx.drawImage(ch.cv, cx * CHUNK, cy * CHUNK, CHUNK + 0.7, CHUNK + 0.7); }
    else { ctx.fillStyle = '#16210f'; ctx.fillRect(cx * CHUNK, cy * CHUNK, CHUNK, CHUNK); }
  }
  if (budget > 0 && !force) {
    // pré-carrega um anel ao redor da tela
    for (let cy = y0 - 1; cy <= y1 + 1 && budget > 0; cy++) for (let cx = x0 - 1; cx <= x1 + 1 && budget > 0; cx++) {
      if (cx < 0 || cy < 0 || cx * CHUNK >= WORLD_W || cy * CHUNK >= WORLD_H) continue;
      const ch = chunks.get(cy * 1000 + cx);
      if (!ch) { renderChunk(cx, cy).used = frameNo; budget--; } else ch.used = frameNo;
    }
  }
}
function clearChunks() { chunks.clear(); }

/* ---------- telhados ---------- */
function roofSprite(b) {
  if (b.roof) return b.roof;
  const w = Math.ceil(b.x1 - b.x0), h = Math.ceil(b.y1 - b.y0);
  const c = makeCanvas(w, h), g = c.getContext('2d');
  const R = mulberry32(b.seed);
  const rc = b.roofColor;
  switch (b.roofType) {
    case 'hip': case 'gable': case 'gableV': case 'tower': {
      g.fillStyle = rc; g.fillRect(0, 0, w, h);
      const alongX = b.roofType === 'gableV' ? false : b.roofType === 'tower' ? null : w >= h;
      if (b.roofType === 'tower') {
        const faces = [[[0, 0], [w, 0], [w / 2, h / 2]], [[w, 0], [w, h], [w / 2, h / 2]], [[w, h], [0, h], [w / 2, h / 2]], [[0, h], [0, 0], [w / 2, h / 2]]];
        const sh = [0.12, -0.12, -0.3, 0.02];
        faces.forEach((f, i) => { g.fillStyle = shade(rc, sh[i]); g.beginPath(); g.moveTo(f[0][0], f[0][1]); g.lineTo(f[1][0], f[1][1]); g.lineTo(f[2][0], f[2][1]); g.closePath(); g.fill(); });
        if (b.cross) { g.strokeStyle = '#f0e6c8'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(w / 2, h / 2 - 9); g.lineTo(w / 2, h / 2 + 9); g.moveTo(w / 2 - 5, h / 2 - 3); g.lineTo(w / 2 + 5, h / 2 - 3); g.stroke(); }
        break;
      }
      const hip = b.roofType === 'hip';
      let faces;
      if (alongX) {
        const r0 = hip ? h / 2 : 0, r1 = hip ? w - h / 2 : w;
        faces = [
          { p: [[0, 0], [w, 0], [r1, h / 2], [r0, h / 2]], s: 0.1, dir: 'h' },
          { p: [[0, h], [w, h], [r1, h / 2], [r0, h / 2]], s: -0.28, dir: 'h' },
          { p: [[0, 0], [r0, h / 2], [0, h]], s: -0.05, dir: 'v' },
          { p: [[w, 0], [r1, h / 2], [w, h]], s: -0.18, dir: 'v' },
        ];
      } else {
        const r0 = hip ? w / 2 : 0, r1 = hip ? h - w / 2 : h;
        faces = [
          { p: [[0, 0], [0, h], [w / 2, r1], [w / 2, r0]], s: 0.02, dir: 'v' },
          { p: [[w, 0], [w, h], [w / 2, r1], [w / 2, r0]], s: -0.22, dir: 'v' },
          { p: [[0, 0], [w / 2, r0], [w, 0]], s: 0.12, dir: 'h' },
          { p: [[0, h], [w / 2, r1], [w, h]], s: -0.3, dir: 'h' },
        ];
      }
      for (const f of faces) {
        g.save();
        g.beginPath(); g.moveTo(f.p[0][0], f.p[0][1]); for (let i = 1; i < f.p.length; i++) g.lineTo(f.p[i][0], f.p[i][1]); g.closePath();
        g.fillStyle = shade(rc, f.s); g.fill(); g.clip();
        g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = 1;
        g.beginPath();
        if (f.dir === 'h') for (let y = 2; y < h; y += 3.2) { g.moveTo(0, y); g.lineTo(w, y); }
        else for (let x = 2; x < w; x += 3.2) { g.moveTo(x, 0); g.lineTo(x, h); }
        g.stroke();
        g.fillStyle = 'rgba(0,0,0,0.07)';
        for (let i = 0; i < 6; i++) g.fillRect(R() * w, R() * h, 6 + R() * 10, 3 + R() * 4);
        g.restore();
      }
      g.strokeStyle = shade(rc, 0.3); g.lineWidth = 1.6; g.beginPath();
      if (alongX) { const r0 = hip ? h / 2 : 0, r1 = hip ? w - h / 2 : w; g.moveTo(r0, h / 2); g.lineTo(r1, h / 2); if (hip) { g.moveTo(0, 0); g.lineTo(r0, h / 2); g.lineTo(0, h); g.moveTo(w, 0); g.lineTo(r1, h / 2); g.lineTo(w, h); } }
      else { const r0 = hip ? w / 2 : 0, r1 = hip ? h - w / 2 : h; g.moveTo(w / 2, r0); g.lineTo(w / 2, r1); if (hip) { g.moveTo(0, 0); g.lineTo(w / 2, r0); g.lineTo(w, 0); g.moveTo(0, h); g.lineTo(w / 2, r1); g.lineTo(w, h); } }
      g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 1.5; g.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
      if (b.style === 'church') { g.fillStyle = '#f0e6c8'; g.fillRect(w / 2 - 1.2, 8, 2.4, 14); g.fillRect(w / 2 - 5, 12, 10, 2.4); }
      break;
    }
    case 'corrugated': case 'container': {
      g.fillStyle = rc; g.fillRect(0, 0, w, h);
      const alongX = w < h;
      for (let i = 0; i < (alongX ? w : h); i += 4) { g.fillStyle = i % 8 ? shade(rc, 0.12) : shade(rc, -0.15); if (alongX) g.fillRect(i, 0, 2, h); else g.fillRect(0, i, w, 2); }
      if (b.roofType === 'corrugated' && w > 60 && h > 60) {
        g.fillStyle = 'rgba(220,235,240,0.35)';
        for (let k = 1; k < 4; k++) { if (alongX) g.fillRect(4, h * k / 4 - 4, w - 8, 8); else g.fillRect(w * k / 4 - 4, 4, 8, h - 8); }
      }
      g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 5; i++) g.fillRect(R() * w, R() * h, 10 + R() * 20, 6 + R() * 8);
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.5; g.strokeRect(0.75, 0.75, w - 1.5, h - 1.5);
      break;
    }
    case 'laje': {
      g.fillStyle = rc; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 10; i++) { g.beginPath(); g.ellipse(R() * w, R() * h, 4 + R() * 10, 3 + R() * 6, R() * 3, 0, TAU); g.fill(); }
      if (R() < 0.45) {
        const bw = w * (0.3 + R() * 0.3), bx = R() < 0.5 ? 0 : w - bw;
        g.fillStyle = '#a65a36'; g.fillRect(bx, 0, bw, h);
        g.fillStyle = 'rgba(60,25,10,0.5)';
        for (let y = 0; y < h; y += 4) for (let x = bx + ((y / 4) % 2) * 4; x < bx + bw; x += 8) g.fillRect(x, y, 1, 4);
        for (let y = 0; y < h; y += 4) g.fillRect(bx, y, bw, 0.8);
      }
      g.strokeStyle = shade(rc, -0.35); g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
      const tx = R() < 0.5 ? 12 : w - 12, ty = R() < 0.5 ? 12 : h - 12;
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(tx + 2, ty + 2, 8, 0, TAU); g.fill();
      g.fillStyle = '#3b7fc4'; g.beginPath(); g.arc(tx, ty, 7.5, 0, TAU); g.fill();
      g.fillStyle = '#5a9be0'; g.beginPath(); g.arc(tx - 1, ty - 1, 4.5, 0, TAU); g.fill();
      g.strokeStyle = '#2a5f96'; g.lineWidth = 1; g.beginPath(); g.arc(tx, ty, 7.5, 0, TAU); g.stroke();
      if (R() < 0.6) { g.strokeStyle = '#555'; g.lineWidth = 1; g.beginPath(); g.moveTo(w * 0.3, h * 0.6); g.lineTo(w * 0.3 + 10, h * 0.6 - 8); g.moveTo(w * 0.3 + 4, h * 0.6 - 3); g.lineTo(w * 0.3 + 8, h * 0.6 + 1); g.stroke(); }
      break;
    }
    case 'amianto': {
      g.fillStyle = rc; g.fillRect(0, 0, w, h);
      const alongX = w < h;
      for (let i = 0; i < (alongX ? w : h); i += 3) { g.fillStyle = i % 6 ? shade(rc, 0.1) : shade(rc, -0.18); if (alongX) g.fillRect(i, 0, 1.5, h); else g.fillRect(0, i, w, 1.5); }
      g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 3; i++) { if (alongX) g.fillRect(0, h * (i + 1) / 4, w, 1); else g.fillRect(w * (i + 1) / 4, 0, 1, h); }
      g.fillStyle = 'rgba(60,70,40,0.25)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(R() * w, R() * h, 3 + R() * 7, 2 + R() * 4, 0, 0, TAU); g.fill(); }
      if (R() < 0.4) { g.fillStyle = '#7d5a3a'; g.fillRect(R() * (w - 10), R() * (h - 4), 10, 2); }
      g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 1.2; g.strokeRect(0.6, 0.6, w - 1.2, h - 1.2);
      break;
    }
    case 'tijolo': {
      g.fillStyle = '#8f8b84'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.ellipse(R() * w, R() * h, 3 + R() * 8, 2 + R() * 5, 0, 0, TAU); g.fill(); }
      // segundo andar em obra (tijolo baiano aparente)
      const bw = w * (0.45 + R() * 0.3), bh = h * (0.5 + R() * 0.3), bx = R() < 0.5 ? 0 : w - bw, by = R() < 0.5 ? 0 : h - bh;
      g.fillStyle = '#b5603a'; g.fillRect(bx, by, bw, bh);
      g.fillStyle = 'rgba(70,25,10,0.55)';
      for (let yy = by; yy < by + bh; yy += 4) { g.fillRect(bx, yy, bw, 0.8); for (let xx = bx + ((yy - by) / 4 % 2) * 4; xx < bx + bw; xx += 8) g.fillRect(xx, yy, 0.8, 4); }
      g.strokeStyle = '#6a2e18'; g.lineWidth = 2; g.strokeRect(bx + 1, by + 1, bw - 2, bh - 2);
      // ferros de espera nos cantos
      g.fillStyle = '#3a2a22';
      for (const [px, py] of [[2, 2], [w - 4, 2], [2, h - 4], [w - 4, h - 4], [bx + bw / 2, 2]]) { g.fillRect(px, py, 1.6, 1.6); g.fillRect(px + 2.5, py, 1.6, 1.6); g.fillRect(px, py + 2.5, 1.6, 1.6); }
      g.fillStyle = '#c06a40'; for (let i = 0; i < 6; i++) g.fillRect(w * 0.6 + (i % 3) * 3.4, h * 0.7 + Math.floor(i / 3) * 2.4, 3, 2);
      g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
      break;
    }
    case 'bleacher': {
      for (let i = 0; i < w; i += 5) { g.fillStyle = i % 10 ? '#9a9a9a' : '#6a6a6a'; g.fillRect(i, 0, 5, h); }
      break;
    }
    case 'deck': {
      for (let i = 0; i < Math.max(w, h); i += 5) { g.fillStyle = hash2(i, 9) < 0.5 ? '#7a5434' : '#6a4628'; if (w > h) g.fillRect(i, 0, 4.4, h); else g.fillRect(0, i, w, 4.4); }
      g.strokeStyle = '#4a321e'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
      break;
    }
    default: {
      g.fillStyle = rc; g.fillRect(0, 0, w, h);
      g.fillStyle = shade(rc, 0.07); g.fillRect(4, 4, w - 8, h - 8);
      g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < w * h / 500; i++) g.fillRect(R() * w, R() * h, 1.5, 1.5);
      g.strokeStyle = shade(rc, -0.35); g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
      const big = b.h > 60;
      const n = Math.floor(w * h / (big ? 4000 : 6000));
      for (let i = 0; i < n; i++) {
        const x = 8 + R() * (w - 26), y = 8 + R() * (h - 22), kind = R();
        if (kind < 0.55) {
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 2, y + 2, 12, 9);
          g.fillStyle = '#b8b8b2'; g.fillRect(x, y, 12, 9); g.fillStyle = '#5a5a58'; g.beginPath(); g.arc(x + 6, y + 4.5, 3, 0, TAU); g.fill();
        } else if (kind < 0.8) {
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(x + 9, y + 9, 7, 0, TAU); g.fill();
          g.fillStyle = '#5f7a9a'; g.beginPath(); g.arc(x + 7, y + 7, 7, 0, TAU); g.fill();
          g.strokeStyle = '#3d556f'; g.lineWidth = 1; g.stroke();
        } else {
          g.fillStyle = shade(rc, -0.15); g.fillRect(x, y, 16, 12);
          g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, y + 10, 16, 2);
        }
      }
      if (big && w > 70 && h > 70 && R() < 0.5) {
        g.strokeStyle = 'rgba(230,230,220,0.7)'; g.lineWidth = 2;
        g.beginPath(); g.arc(w / 2, h / 2, 18, 0, TAU); g.stroke();
        g.font = 'bold 20px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(230,230,220,0.7)'; g.fillText('H', w / 2, h / 2 + 1);
      }
      if (big && R() < 0.6) { g.strokeStyle = '#888'; g.lineWidth = 1.2; g.beginPath(); const ax = w - 14, ay = 14; g.moveTo(ax, ay); g.lineTo(ax - 10, ay + 12); g.moveTo(ax - 4, ay + 4); g.lineTo(ax + 3, ay + 8); g.stroke(); b.antenna = [ax, ay]; }
    }
  }
  // detalhes de laje: antena parabólica e varal de roupas
  if (b.dish && w > 22 && h > 22) {
    const dx = R() < 0.5 ? 8 : w - 8, dy = R() < 0.5 ? h - 8 : 8;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(dx + 1.5, dy + 1.5, 5.5, 0, TAU); g.fill();
    g.fillStyle = '#d8d8d2'; g.beginPath(); g.arc(dx, dy, 5.5, 0, TAU); g.fill();
    g.fillStyle = '#a8a8a2'; g.beginPath(); g.arc(dx + 1, dy + 1, 3.2, 0, TAU); g.fill();
    g.fillStyle = '#555'; g.fillRect(dx - 0.6, dy - 0.6, 1.2, 1.2);
  }
  if (b.varal && w > 30 && h > 24) {
    const vy = h * (0.3 + R() * 0.4), vx0 = w * 0.15, vx1 = w * 0.85;
    g.strokeStyle = 'rgba(40,40,40,0.8)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(vx0, vy); g.lineTo(vx1, vy); g.stroke();
    const clothes = ['#e63946', '#f1f1f1', '#3a86ff', '#f4c430', '#2bb24c', '#ff7f11', '#8338ec'];
    for (let x = vx0 + 2; x < vx1 - 5; x += 6 + R() * 3) { g.fillStyle = clothes[(R() * clothes.length) | 0]; g.fillRect(x, vy, 4 + R() * 2, 4 + R() * 3); }
  }
  if (b.sign) {
    const fs = clamp(Math.min(w / (b.sign.length * 0.62), h * 0.42), 7, 22);
    g.font = `800 ${fs}px "Segoe UI", Roboto, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(b.sign, w / 2, h / 2);
    g.fillStyle = b.signColor; g.fillText(b.sign, w / 2, h / 2);
  }
  b.roof = c;
  return c;
}
function signGlow(b) {
  if (b.glowSign) return b.glowSign;
  const w = Math.ceil(b.x1 - b.x0) + 20, h = Math.ceil(b.y1 - b.y0) + 20;
  const c = makeCanvas(w, h), g = c.getContext('2d');
  const fs = clamp(Math.min((w - 20) / (b.sign.length * 0.62), (h - 20) * 0.42), 7, 22);
  g.font = `800 ${fs}px "Segoe UI", Roboto, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = b.signColor; g.shadowBlur = 10; g.fillStyle = b.signColor;
  g.fillText(b.sign, w / 2, h / 2); g.fillText(b.sign, w / 2, h / 2);
  g.shadowBlur = 0; g.globalAlpha = 0.85; g.fillStyle = '#ffffff'; g.fillText(b.sign, w / 2, h / 2);
  b.glowSign = c;
  return c;
}

/* ---------- prédios em 2.5D ---------- */
function bldOffset(b) {
  let ox = (b.cx - Cam.x) * b.h * PAR, oy = (b.cy - Cam.y) * b.h * PAR;
  const m = b.h * 0.85, l = Math.hypot(ox, oy);
  if (l > m) { ox *= m / l; oy *= m / l; }
  return [ox, oy - b.h * TILT_H];
}
const WIN_STYLES = { house: 1, farmhouse: 1, office: 2, tower: 2, church: 2, apart: 2, colonial: 4, shop: 3, workshop: 3, garage: 3, kiosk: 3 };
function wallWindows(ctx, b, ax, ay, bx, by, ox, oy, side, emissive) {
  const ws = WIN_STYLES[b.style];
  if (!ws) return;
  const ext = Math.hypot(ox, oy);
  if (ext < 2.2) return;
  const len = Math.hypot(bx - ax, by - ay);
  let floors, cols;
  if (ws === 1) { floors = b.h > 40 ? 2 : 1; cols = Math.max(1, Math.floor(len / 30)); }
  else if (ws === 4) { floors = 2; cols = Math.max(1, Math.floor(len / 18)); }
  else if (ws === 2) { floors = Math.max(1, Math.floor(b.h / 15)); cols = Math.max(1, Math.floor(len / 15)); }
  else { floors = 1; cols = Math.max(1, Math.floor(len / 24)); }
  const ex = bx - ax, ey = by - ay;
  const front = b.front === side;
  const big = ws === 3 && front;
  const lit = emissive ? null : new Path2D(), dark = emissive ? null : new Path2D(), em = emissive ? new Path2D() : null;
  const tflick = Math.floor(Game.time * 0.5);
  for (let f = 0; f < floors; f++) {
    const f0 = big ? 0.08 : (f + 0.28) / floors, f1 = big ? 0.62 : (f + 0.74) / floors;
    for (let c = 0; c < cols; c++) {
      const s0 = (c + (big ? 0.08 : 0.24)) / cols, s1 = (c + (big ? 0.92 : 0.76)) / cols;
      const hsh = hash2(b.seed + f * 131 + c * 7, side.charCodeAt(0));
      let on = big ? true : hsh < b.lit;
      if (!big && hsh < 0.04) on = hash2(b.seed + tflick, c) < 0.7;
      const P = emissive ? (on ? em : null) : (on ? lit : dark);
      if (!P) continue;
      P.moveTo(ax + ex * s0 + ox * f0, ay + ey * s0 + oy * f0);
      P.lineTo(ax + ex * s1 + ox * f0, ay + ey * s1 + oy * f0);
      P.lineTo(ax + ex * s1 + ox * f1, ay + ey * s1 + oy * f1);
      P.lineTo(ax + ex * s0 + ox * f1, ay + ey * s0 + oy * f1);
      P.closePath();
    }
  }
  if (emissive) { ctx.fillStyle = big ? 'rgba(255,214,150,0.5)' : 'rgba(255,186,105,0.55)'; ctx.fill(em); }
  else {
    ctx.fillStyle = '#18202b'; ctx.fill(dark);
    ctx.fillStyle = big ? '#f3dcb0' : '#f0c47a'; ctx.fill(lit);
  }
  if (!emissive && ws !== 2 && front && !big) {
    const s0 = 0.45, s1 = 0.55;
    ctx.fillStyle = '#3a2a1e';
    ctx.beginPath(); ctx.moveTo(ax + ex * s0, ay + ey * s0); ctx.lineTo(ax + ex * s1, ay + ey * s1); ctx.lineTo(ax + ex * s1 + ox * 0.75, ay + ey * s1 + oy * 0.75); ctx.lineTo(ax + ex * s0 + ox * 0.75, ay + ey * s0 + oy * 0.75); ctx.closePath(); ctx.fill();
  }
}
const SIDE_SHADE = { N: 0.04, W: -0.08, S: -0.3, E: -0.4 };
function drawWall(ctx, b, ax, ay, bx, by, ox, oy, side) {
  ctx.fillStyle = shade(b.wall, SIDE_SHADE[side]);
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx + ox, by + oy); ctx.lineTo(ax + ox, ay + oy); ctx.closePath(); ctx.fill();
  if (b.style === 'warehouse' || b.style === 'barn' || b.style === 'container' || b.style === 'shed') {
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.beginPath();
    const n = Math.floor(Math.hypot(bx - ax, by - ay) / 5);
    for (let i = 1; i < n; i++) { const t = i / n; ctx.moveTo(ax + (bx - ax) * t, ay + (by - ay) * t); ctx.lineTo(ax + (bx - ax) * t + ox, ay + (by - ay) * t + oy); }
    ctx.stroke();
    if (b.front === side || b.style === 'barn') {
      ctx.fillStyle = 'rgba(20,16,12,0.75)';
      const s0 = 0.35, s1 = 0.65;
      ctx.beginPath(); ctx.moveTo(ax + (bx - ax) * s0, ay + (by - ay) * s0); ctx.lineTo(ax + (bx - ax) * s1, ay + (by - ay) * s1); ctx.lineTo(ax + (bx - ax) * s1 + ox * 0.7, ay + (by - ay) * s1 + oy * 0.7); ctx.lineTo(ax + (bx - ax) * s0 + ox * 0.7, ay + (by - ay) * s0 + oy * 0.7); ctx.closePath(); ctx.fill();
    }
  } else {
    if (b.brick) {
      ctx.strokeStyle = 'rgba(70,25,10,0.4)'; ctx.lineWidth = 0.7; ctx.beginPath();
      for (let f = 0.12; f < 1; f += 0.11) { ctx.moveTo(ax + ox * f, ay + oy * f); ctx.lineTo(bx + ox * f, by + oy * f); }
      ctx.stroke();
    }
    wallWindows(ctx, b, ax, ay, bx, by, ox, oy, side, false);
    if (b.style === 'colonial') {
      // janelas coloniais com venezianas coloridas
      ctx.fillStyle = b.seed % 2 ? '#2f6b4a' : '#2d4f7a';
      const n = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) / 18)), ex = bx - ax, ey = by - ay;
      for (let f = 0; f < 2; f++) for (let c = 0; c < n; c++) for (const sd of [0.14, 0.72]) {
        const s0 = (c + sd) / n, s1 = s0 + 0.12 / n, f0 = (f + 0.2) / 2, f1 = (f + 0.8) / 2;
        ctx.beginPath(); ctx.moveTo(ax + ex * s0 + ox * f0, ay + ey * s0 + oy * f0); ctx.lineTo(ax + ex * s1 + ox * f0, ay + ey * s1 + oy * f0); ctx.lineTo(ax + ex * s1 + ox * f1, ay + ey * s1 + oy * f1); ctx.lineTo(ax + ex * s0 + ox * f1, ay + ey * s0 + oy * f1); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.moveTo(ax + ox * 0.98, ay + oy * 0.98); ctx.lineTo(bx + ox * 0.98, by + oy * 0.98); ctx.lineTo(bx + ox * 0.9, by + oy * 0.9); ctx.lineTo(ax + ox * 0.9, ay + oy * 0.9); ctx.closePath(); ctx.fill();
    }
    if (b.style === 'apart') {
      // sacadas com grade por andar
      const fl = Math.max(1, Math.floor(b.h / 15));
      ctx.strokeStyle = 'rgba(235,235,225,0.55)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let f = 1; f <= fl; f++) { const ff = (f - 0.18) / fl; ctx.moveTo(ax + ox * ff, ay + oy * ff); ctx.lineTo(bx + ox * ff, by + oy * ff); }
      ctx.stroke();
    }
  }
  if (b.style === 'garage' && b.front === side) {
    ctx.fillStyle = '#5c6470';
    const s0 = 0.12, s1 = 0.88;
    ctx.beginPath(); ctx.moveTo(ax + (bx - ax) * s0, ay + (by - ay) * s0); ctx.lineTo(ax + (bx - ax) * s1, ay + (by - ay) * s1); ctx.lineTo(ax + (bx - ax) * s1 + ox * 0.78, ay + (by - ay) * s1 + oy * 0.78); ctx.lineTo(ax + (bx - ax) * s0 + ox * 0.78, ay + (by - ay) * s0 + oy * 0.78); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx + ox * 0.08, by + oy * 0.08); ctx.lineTo(ax + ox * 0.08, ay + oy * 0.08); ctx.closePath(); ctx.fill();
}
function wallGraffiti(ctx, b, ax, ay, bx, by, ox, oy) {
  if (Math.hypot(ox, oy) < 4) return;
  let ex = bx - ax, ey = by - ay;
  if (ex * oy - ey * ox > 0) { ax = bx; ay = by; ex = -ex; ey = -ey; }
  const G = b.graf, W = 100, H = 40;
  ctx.save();
  ctx.transform(ex / W, ey / W, -ox / H, -oy / H, ax + ox, ay + oy);
  if (G.kind === 'mural') {
    const cols = ['#e63946', '#f4c430', '#2a9d8f', '#3a86ff', '#ff7f11'];
    for (let i = 0; i < 5; i++) { ctx.fillStyle = cols[(i + (G.seed * 10 | 0)) % 5]; ctx.beginPath(); ctx.ellipse(10 + i * 20, 22 + Math.sin(i + G.seed * 9) * 6, 14, 12, 0, 0, TAU); ctx.fill(); }
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (G.kind === 'pixo') {
    ctx.font = '900 18px "Arial Narrow", Impact, Arial, sans-serif';
    ctx.fillStyle = G.color; ctx.fillText(G.text, 50, 20, 94);
    ctx.fillRect(10, 30, 80, 1.2);
  } else {
    ctx.font = 'italic 900 15px "Segoe UI", Arial, sans-serif';
    if (G.kind === 'mural') { ctx.lineWidth = 3; ctx.strokeStyle = '#111'; ctx.strokeText(G.text, 50, 22, 94); ctx.fillStyle = '#ffffff'; }
    else ctx.fillStyle = G.color;
    ctx.fillText(G.text, 50, 22, 94);
  }
  ctx.fillStyle = G.color; for (let i = 0; i < 4; i++) ctx.fillRect(20 + i * 19 + (G.seed * 7) % 5, 28, 1, 4 + ((i * 7 + G.seed * 13) % 6));
  ctx.restore();
}
function drawBuilding(ctx, b) {
  const [ox, oy] = bldOffset(b);
  const { x0, y0, x1, y1 } = b;
  let alpha = 1;
  if (b.alphaNear && player && player.x > x0 + ox - 10 && player.x < x1 + ox + 10 && player.y > y0 + oy - 10 && player.y < y1 + oy + 10) alpha = 0.4;
  if (alpha < 1) ctx.globalAlpha = alpha;
  if (ox > 0.3) drawWall(ctx, b, x0, y1, x0, y0, ox, oy, 'W'); else if (ox < -0.3) drawWall(ctx, b, x1, y0, x1, y1, ox, oy, 'E');
  if (oy > 0.3) drawWall(ctx, b, x0, y0, x1, y0, ox, oy, 'N'); else if (oy < -0.3) drawWall(ctx, b, x1, y1, x0, y1, ox, oy, 'S');
  ctx.drawImage(roofSprite(b), x0 + ox, y0 + oy, x1 - x0, y1 - y0);
  if (b.party) drawParty(ctx, b, x0 + ox, y0 + oy);
  if (alpha < 1) ctx.globalAlpha = 1;
}
// churrasco na laje
function partySetup(b) {
  const w = b.x1 - b.x0, h = b.y1 - b.y0, R = mulberry32(b.seed + 7);
  const P = { people: [], grill: [w * (R() < 0.5 ? 0.2 : 0.8), h * (R() < 0.5 ? 0.25 : 0.75)], bulbs: [] };
  const n = 4 + ((R() * 4) | 0);
  const cols = ['#e63946', '#f7d000', '#3a86ff', '#f1f1f1', '#2bb24c', '#ff7f11', '#8338ec', '#14213d'];
  for (let i = 0; i < n; i++) P.people.push({ type: 'person', x: 8 + R() * (w - 16), y: 8 + R() * (h - 16), a: R() * TAU, v: 0, phase: 0, seed: R(), dance: true, state: 'idle',
    col: cols[(R() * cols.length) | 0], skin: ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5a3a22'][(R() * 5) | 0], hair: '#1a1410', pants: ['#2b3a55', '#1d1d1f', '#3a5a7a'][(R() * 3) | 0] });
  const bc = ['#ff4d4d', '#ffd23a', '#3cff8f', '#4cc9f0', '#ff6fb5'];
  for (let i = 0; i <= 8; i++) { const t = i / 8; P.bulbs.push([4 + t * (w - 8), h * 0.5 + Math.sin(t * Math.PI) * h * 0.18 - h * 0.18, bc[i % bc.length]]); }
  b.partyD = P; return P;
}
function drawParty(ctx, b, X, Y) {
  const P = b.partyD || partySetup(b);
  ctx.save(); ctx.translate(X, Y);
  // varal de lâmpadas
  ctx.strokeStyle = 'rgba(30,30,30,0.8)'; ctx.lineWidth = 0.7; ctx.beginPath();
  P.bulbs.forEach(([x, y], i) => { if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); ctx.stroke();
  for (const [x, y, c] of P.bulbs) { ctx.fillStyle = c; ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4); }
  // churrasqueira e caixa de isopor
  const [gx, gy] = P.grill;
  ctx.fillStyle = '#2a2a2a'; ctx.fillRect(gx - 6, gy - 3.5, 12, 7);
  ctx.fillStyle = (Game.time * 3) % 1 < 0.5 ? '#ff6a1a' : '#ff8a2a'; ctx.fillRect(gx - 5, gy - 2.5, 10, 5);
  ctx.strokeStyle = '#777'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let i = -4; i <= 4; i += 2) { ctx.moveTo(gx + i, gy - 2.5); ctx.lineTo(gx + i, gy + 2.5); } ctx.stroke();
  ctx.fillStyle = '#f2f2ee'; ctx.fillRect(gx + (gx > 30 ? -16 : 9), gy - 3, 7, 5); ctx.fillStyle = '#3a86ff'; ctx.fillRect(gx + (gx > 30 ? -16 : 9), gy - 3, 7, 1.4);
  if (Settings.quality !== 'baixa') for (const pp of P.people) drawAnimal(ctx, pp);
  ctx.restore();
  if (chance(0.06)) Particles.emit('smoke', b.x0 + gx, b.y0 + gy, rnd(-6, 6), rnd(-14, -4), rnd(1.2, 2), 4);
}
function drawBuildingEmissive(ctx, b) {
  const [ox, oy] = bldOffset(b);
  const { x0, y0, x1, y1 } = b;
  if (ox > 0.3) wallWindows(ctx, b, x0, y1, x0, y0, ox, oy, 'W', true); else if (ox < -0.3) wallWindows(ctx, b, x1, y0, x1, y1, ox, oy, 'E', true);
  if (oy > 0.3) wallWindows(ctx, b, x0, y0, x1, y0, ox, oy, 'N', true); else if (oy < -0.3) wallWindows(ctx, b, x1, y1, x0, y1, ox, oy, 'S', true);
  if (b.sign) { const gs = signGlow(b); ctx.globalAlpha = 0.9; ctx.drawImage(gs, x0 + ox - 10, y0 + oy - 10); ctx.globalAlpha = 1; }
  if (b.party && b.partyD) {
    const P = b.partyD;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < P.bulbs.length; i++) { const [x, y, c] = P.bulbs[i]; if ((i + Math.floor(Game.time * 2)) % 3) ctx.drawImage(glowSprite(c), x0 + ox + x - 6, y0 + oy + y - 6, 12, 12); }
    ctx.drawImage(glowSprite('#ff7a1a'), x0 + ox + P.grill[0] - 14, y0 + oy + P.grill[1] - 14, 28, 28);
    ctx.globalAlpha = 1;
  }
  if (b.antenna && b.roof) {
    const on = (Game.time + b.seed * 0.001) % 1.6 < 0.5;
    if (on) { const s = glowSprite('#ff3b3b'); ctx.drawImage(s, x0 + ox + b.antenna[0] - 9, y0 + oy + b.antenna[1] - 9, 18, 18); }
  }
}

/* ---------- objetos altos ---------- */
function offAt(x, y, h) {
  const ox = (x - Cam.x) * h * PAR, oy = (y - Cam.y) * h * PAR - h * TILT_H;
  return [ox, oy];
}
function drawTall(ctx, o) {
  switch (o.kind) {
    case 'bld': drawBuilding(ctx, o); break;
    case 'tree': {
      if (o.removed) break;
      if (o.down !== undefined) {
        const spr2 = treeSprite(o.type, o.v), S2 = 64 * o.size * (o.type === 'bush' ? 0.55 : 1);
        ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 3 * o.size; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + Math.cos(o.down) * S2 * 0.4, o.y + Math.sin(o.down) * S2 * 0.4); ctx.stroke();
        ctx.save(); ctx.translate(o.x + Math.cos(o.down) * S2 * 0.55, o.y + Math.sin(o.down) * S2 * 0.55); ctx.rotate(o.down); ctx.globalAlpha = 0.95;
        ctx.drawImage(spr2, -S2 * 0.45, -S2 * 0.32, S2 * 0.9, S2 * 0.64); ctx.restore(); ctx.globalAlpha = 1;
        break;
      }
      const [ox0, oy] = offAt(o.x, o.y, o.h);
      const ox = ox0 + Math.sin(Game.time * 1.3 + o.x * 0.05) * 0.9 * o.size;
      const spr = treeSprite(o.type, o.v);
      const S = 64 * o.size * (o.type === 'bush' ? 0.55 : 1);
      let a = 1;
      if (player && Game.state !== 'menu') { const d = Math.hypot(player.x - o.x - ox, player.y - o.y - oy); if (d < S * 0.45) a = 0.42; }
      if (a < 1) ctx.globalAlpha = a;
      if (o.type !== 'bush' && Math.hypot(ox, oy) > 3) { ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 3 * o.size; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox * 0.8, o.y + oy * 0.8); ctx.stroke(); }
      ctx.drawImage(spr, o.x + ox - S / 2, o.y + oy - S / 2, S, S);
      if (a < 1) ctx.globalAlpha = 1;
      break;
    }
    case 'lamp': {
      if (o.down !== undefined) {
        const L = o.h * 0.85, ex = o.x + Math.cos(o.down) * L, ey = o.y + Math.sin(o.down) * L;
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(o.x + 2, o.y + 3); ctx.lineTo(ex + 2, ey + 3); ctx.stroke();
        ctx.strokeStyle = '#4a4d52'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = '#3a3d42'; ctx.beginPath(); ctx.ellipse(ex, ey, 6, 3.5, o.down, 0, TAU); ctx.fill();
        ctx.fillStyle = '#5a5d62'; ctx.beginPath(); ctx.arc(o.x, o.y, 2.6, 0, TAU); ctx.fill();
        break;
      }
      const [ox, oy] = offAt(o.hx, o.hy, o.h);
      const [bx2, by2] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#4a4d52'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + bx2, o.y + by2);
      if (o.style === 'arm') ctx.lineTo(o.hx + ox, o.hy + oy);
      ctx.stroke();
      if (o.style === 'globe') { ctx.fillStyle = o.broken ? '#555' : '#eef3ff'; ctx.beginPath(); ctx.arc(o.hx + ox, o.hy + oy, 4.5, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = '#5c6066'; ctx.beginPath(); ctx.ellipse(o.hx + ox, o.hy + oy, 6, 3.5, Math.atan2(o.hy - o.y, o.hx - o.x), 0, TAU); ctx.fill(); ctx.fillStyle = o.broken ? '#333' : '#fff1c8'; ctx.beginPath(); ctx.arc(o.hx + ox, o.hy + oy, 2.2, 0, TAU); ctx.fill(); }
      break;
    }
    case 'tlight': {
      if (o.down !== undefined) { drawFallen(ctx, o, '#3a3d42', (x, y) => { ctx.fillStyle = '#16181b'; ctx.fillRect(x - 4, y - 4, 8, 8); }); break; }
      const [ox, oy] = offAt(o.hx, o.hy, o.h);
      const [px, py] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#3a3d42'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + px, o.y + py); ctx.lineTo(o.hx + ox, o.hy + oy); ctx.stroke();
      ctx.save(); ctx.translate(o.hx + ox, o.hy + oy); ctx.rotate(o.a);
      ctx.fillStyle = '#16181b'; ctx.fillRect(-4, -8, 8, 16);
      const st = lightState(o.node, o.axis, Game.time);
      const cols = [['R', '#ff3b30', -5], ['Y', '#ffb000', 0], ['G', '#2bff7a', 5]];
      for (const [k, c, yy] of cols) { ctx.fillStyle = st === k ? c : '#2a2c30'; ctx.beginPath(); ctx.arc(0, yy, 2, 0, TAU); ctx.fill(); }
      ctx.restore();
      break;
    }
    case 'sign': {
      if (o.down !== undefined) { drawFallen(ctx, o, '#8a8d92', (x, y) => { ctx.fillStyle = '#c8241c'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); }); break; }
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#8a8d92'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox, o.y + oy); ctx.stroke();
      ctx.save(); ctx.translate(o.x + ox, o.y + oy);
      ctx.fillStyle = '#c8241c'; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); }
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(-3.5, -0.7, 7, 1.4);
      ctx.restore();
      break;
    }
    case 'canopy': {
      const [ox, oy] = offAt(o.cx, o.cy, o.h);
      ctx.strokeStyle = '#d8d8d2'; ctx.lineWidth = 4;
      ctx.beginPath();
      for (const [px, py] of [[o.x0 + 14, o.y0 + 14], [o.x1 - 14, o.y0 + 14], [o.x0 + 14, o.y1 - 14], [o.x1 - 14, o.y1 - 14]]) { ctx.moveTo(px, py); ctx.lineTo(px + ox, py + oy); }
      ctx.stroke();
      let a = 1;
      if (player && Game.state !== 'menu' && player.x > o.x0 + ox && player.x < o.x1 + ox && player.y > o.y0 + oy && player.y < o.y1 + oy) a = 0.32;
      ctx.globalAlpha = a;
      const w = o.x1 - o.x0, h = o.y1 - o.y0;
      ctx.fillStyle = '#e9e9e4'; ctx.fillRect(o.x0 + ox, o.y0 + oy, w, h);
      ctx.fillStyle = o.color; ctx.fillRect(o.x0 + ox, o.y0 + oy, w, 7); ctx.fillRect(o.x0 + ox, o.y1 + oy - 7, w, 7); ctx.fillRect(o.x0 + ox, o.y0 + oy, 7, h); ctx.fillRect(o.x1 + ox - 7, o.y0 + oy, 7, h);
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let x = o.x0 + 20; x < o.x1 - 10; x += 20) ctx.fillRect(x + ox, o.y0 + oy + 7, 1.5, h - 14);
      ctx.font = '800 16px "Segoe UI", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = shade(o.color, -0.2); ctx.fillText(o.name.toUpperCase(), o.cx + ox, o.cy + oy);
      ctx.globalAlpha = 1;
      break;
    }
    case 'totem': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#6a6d72'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox, o.y + oy); ctx.stroke();
      ctx.fillStyle = '#1a1c20'; ctx.fillRect(o.x + ox - 16, o.y + oy - 22, 32, 44);
      ctx.fillStyle = o.color; ctx.fillRect(o.x + ox - 16, o.y + oy - 22, 32, 10);
      break;
    }
    case 'wires': {
      ctx.strokeStyle = 'rgba(16,16,18,0.8)'; ctx.lineWidth = 0.9;
      const P = o.pts;
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        for (let i = 0; i < P.length - 1; i++) {
          const [ax, ay] = P[i], [bx, by] = P[i + 1];
          const [aox, aoy] = offAt(ax, ay, o.h - w * 4), [box, boy] = offAt(bx, by, o.h - w * 4);
          const x0 = ax + aox, y0 = ay + aoy, x1 = bx + box, y1 = by + boy;
          ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 14 + w * 3, x1, y1);
        }
        ctx.stroke();
      }
      // "gato" emaranhado em alguns postes
      for (let i = 0; i < P.length; i++) {
        if (hash2(i, o.seed * 1000 | 0) > 0.3) continue;
        const [ax, ay] = P[i], [aox, aoy] = offAt(ax, ay, o.h - 4);
        ctx.beginPath(); ctx.ellipse(ax + aox + 3, ay + aoy + 4, 5, 3, 0.4, 0, TAU); ctx.ellipse(ax + aox - 2, ay + aoy + 6, 3.5, 2.5, -0.3, 0, TAU); ctx.stroke();
      }
      break;
    }
    case 'flags': {
      const [aox, aoy] = offAt(o.x1, o.y1, o.h), [box, boy] = offAt(o.x2, o.y2, o.h);
      const x0 = o.x1 + aox, y0 = o.y1 + aoy, x1 = o.x2 + box, y1 = o.y2 + boy;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + 12;
      ctx.strokeStyle = 'rgba(30,26,22,0.8)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
      const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(3, Math.floor(L / 9));
      const cols = ['#e63946', '#f4c430', '#2a9d8f', '#3a86ff', '#ff7f11', '#8338ec', '#f1f1f1', '#2bb24c'];
      for (let i = 1; i < n; i++) {
        const t = i / n, u = 1 - t;
        const px = u * u * x0 + 2 * u * t * cx + t * t * x1, py = u * u * y0 + 2 * u * t * cy + t * t * y1;
        const t2 = (i + 0.6) / n, u2 = 1 - t2;
        const qx = u2 * u2 * x0 + 2 * u2 * t2 * cx + t2 * t2 * x1, qy = u2 * u2 * y0 + 2 * u2 * t2 * cy + t2 * t2 * y1;
        const sw = Math.sin(Game.time * 3 + i + o.seed * 9) * 1.2;
        ctx.fillStyle = cols[(i + (o.seed * 8 | 0)) % cols.length];
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.lineTo((px + qx) / 2 + sw, (py + qy) / 2 + 6); ctx.closePath(); ctx.fill();
      }
      break;
    }
    case 'gsign': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#8a8d92'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(o.x - 26, o.y); ctx.lineTo(o.x - 26 + ox, o.y + oy); ctx.moveTo(o.x + 26, o.y); ctx.lineTo(o.x + 26 + ox, o.y + oy); ctx.stroke();
      if (!o.panel) {
        const c = makeCanvas(240, 96), g = c.getContext('2d');
        g.fillStyle = '#0f6b3a'; g.fillRect(0, 0, 240, 96); g.strokeStyle = '#f2f2ea'; g.lineWidth = 4; g.strokeRect(5, 5, 230, 86);
        g.fillStyle = '#f2f2ea'; g.font = '800 22px "Segoe UI", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(o.lines[0], 120, 32, 220); g.fillText(o.lines[1], 120, 66, 220);
        o.panel = c;
      }
      ctx.drawImage(o.panel, o.x + ox - 55, o.y + oy - 22, 110, 44);
      break;
    }
    case 'stall': {
      if (o.down !== undefined) { const fr = ['#ffcf3a', '#e63946', '#7cc24a', '#ff8a2a']; for (let i = 0; i < 16; i++) { ctx.fillStyle = fr[i % 4]; ctx.beginPath(); ctx.arc(o.x + Math.cos(o.down + i) * (6 + i * 1.8), o.y + Math.sin(o.down + i * 1.7) * (4 + i), 1.6, 0, TAU); ctx.fill(); } ctx.save(); ctx.translate(o.x + Math.cos(o.down) * 16, o.y + Math.sin(o.down) * 16); ctx.rotate(o.down + 0.6); for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f2f2ea' : o.c; ctx.fillRect(-15 + i * 5, -6, 5, 12); } ctx.restore(); break; }
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.fillStyle = '#6a4a2a'; ctx.fillRect(o.x - 12, o.y - 7, 24, 14);
      const fr = ['#ffcf3a', '#e63946', '#7cc24a', '#ff8a2a', '#a35bd6'];
      for (let i = 0; i < 12; i++) { ctx.fillStyle = fr[(i + o.seed) % fr.length]; ctx.beginPath(); ctx.arc(o.x - 9 + (i % 6) * 3.6, o.y - 3 + Math.floor(i / 6) * 5, 1.6, 0, TAU); ctx.fill(); }
      ctx.save(); ctx.translate(o.x + ox, o.y + oy);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f2f2ea' : o.c; ctx.fillRect(-15 + i * 5, -10, 5, 20); }
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(-15, 8, 30, 2);
      ctx.restore();
      break;
    }
    case 'grill': {
      if (o.down !== undefined) { ctx.save(); ctx.translate(o.x + Math.cos(o.down) * 8, o.y + Math.sin(o.down) * 8); ctx.rotate(o.down + 1.2); ctx.fillStyle = '#7a7d82'; ctx.fillRect(-9, -5, 18, 10); ctx.restore(); ctx.fillStyle = '#ff6a2a'; for (let i = 0; i < 8; i++) ctx.fillRect(o.x + Math.cos(o.down + i) * (4 + i * 2), o.y + Math.sin(o.down + i * 1.3) * (3 + i * 1.5), 1.6, 1.6); break; }
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(o.x - 7, o.y - 3, 17, 10);
      ctx.fillStyle = '#7a7d82'; ctx.fillRect(o.x - 9, o.y - 5, 18, 10);
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(o.x - 8, o.y - 4, 16, 8);
      const fl = 0.6 + 0.4 * Math.sin(Game.time * 9 + o.x);
      ctx.fillStyle = `rgba(255,${90 + fl * 60 | 0},30,0.9)`; ctx.fillRect(o.x - 7, o.y - 3, 14, 6);
      ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 1;
      ctx.beginPath(); for (let i = -6; i <= 6; i += 3) { ctx.moveTo(o.x + i, o.y - 7); ctx.lineTo(o.x + i, o.y + 7); } ctx.stroke();
      ctx.fillStyle = '#5a2a1a'; for (let i = -6; i <= 6; i += 3) { ctx.fillRect(o.x + i - 1, o.y - 2.5, 2, 1.6); ctx.fillRect(o.x + i - 1, o.y + 1, 2, 1.6); }
      ctx.fillStyle = '#333'; ctx.fillRect(o.x - 11, o.y + 5, 3, 3); ctx.fillRect(o.x + 8, o.y + 5, 3, 3);
      break;
    }
    case 'radar': {
      if (o.down !== undefined) { drawFallen(ctx, o, '#6a6d72', (x, y) => { ctx.fillStyle = '#2a2d33'; ctx.fillRect(x - 6, y - 5, 12, 10); ctx.fillStyle = '#1d4fa0'; ctx.fillRect(x - 7, y + 5, 14, 6); }); break; }
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#6a6d72'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox, o.y + oy); ctx.stroke();
      ctx.fillStyle = '#2a2d33'; ctx.fillRect(o.x + ox - 6, o.y + oy - 5, 12, 10);
      ctx.fillStyle = '#0c0e12'; ctx.beginPath(); ctx.arc(o.x + ox, o.y + oy, 2.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1d4fa0'; ctx.fillRect(o.x + ox - 7, o.y + oy - 14, 14, 8);
      ctx.fillStyle = '#fff'; ctx.font = '800 6px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(o.lim), o.x + ox, o.y + oy - 10);
      break;
    }
    case 'phone': {
      if (o.down !== undefined) { drawFallen(ctx, o, '#5a5d62', (x, y) => { ctx.fillStyle = o.col; ctx.beginPath(); ctx.ellipse(x, y, 7, 6, o.down, 0, TAU); ctx.fill(); }); break; }
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#5a5d62'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox, o.y + oy + 4); ctx.stroke();
      const hx = o.x + ox, hy = o.y + oy;
      const gr = ctx.createRadialGradient(hx - 2, hy - 3, 1, hx, hy, 8);
      gr.addColorStop(0, shade(o.col, 0.35)); gr.addColorStop(1, shade(o.col, -0.25));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(hx, hy, 7, 8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(hx, hy + 2.5, 4.2, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c9c9c4'; ctx.fillRect(hx - 1.5, hy + 1, 3, 3.5);
      break;
    }
    case 'busstop': {
      if (o.down !== undefined) { ctx.save(); ctx.translate(o.x + Math.cos(o.down) * 10, o.y + Math.sin(o.down) * 10); ctx.rotate(o.a + 0.4); ctx.fillStyle = '#3a3d42'; ctx.fillRect(-23, -7, 46, 14); ctx.fillStyle = '#2a6fd1'; ctx.fillRect(-23, -7, 10, 14); ctx.restore(); ctx.fillStyle = 'rgba(190,220,240,0.7)'; for (let i = 0; i < 18; i++) ctx.fillRect(o.x + (hash2(i, 3) - 0.5) * 50, o.y + (hash2(i, 4) - 0.5) * 30, 1.6, 1.6); break; }
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a);
      ctx.fillStyle = '#5a5d62'; ctx.fillRect(-20, -5, 2, 2); ctx.fillRect(18, -5, 2, 2);
      ctx.restore();
      ctx.save(); ctx.translate(o.x + ox, o.y + oy); ctx.rotate(o.a);
      ctx.fillStyle = 'rgba(120,170,210,0.55)'; ctx.fillRect(-23, -7, 46, 14);
      ctx.strokeStyle = '#3a3d42'; ctx.lineWidth = 1.5; ctx.strokeRect(-23, -7, 46, 14);
      ctx.fillStyle = '#2a6fd1'; ctx.fillRect(-23, -7, 10, 14);
      ctx.restore();
      break;
    }
    case 'watertower': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#7a7d80'; ctx.lineWidth = 4;
      ctx.beginPath();
      for (const [dx, dy] of [[-30, -30], [30, -30], [-30, 30], [30, 30]]) { ctx.moveTo(o.x + dx, o.y + dy); ctx.lineTo(o.x + ox + dx * 0.6, o.y + oy + dy * 0.6); }
      ctx.stroke();
      ctx.lineWidth = 1.5; ctx.beginPath();
      for (const t of [0.35, 0.7]) { const pts = [[-30, -30], [30, -30], [30, 30], [-30, 30]].map(([dx, dy]) => [o.x + dx + (ox + dx * -0.4) * t, o.y + dy + (oy + dy * -0.4) * t]); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); }
      ctx.stroke();
      const tx = o.x + ox, ty = o.y + oy;
      const gr = ctx.createRadialGradient(tx - 12, ty - 12, 4, tx, ty, o.r);
      gr.addColorStop(0, '#d8dde2'); gr.addColorStop(1, '#7a8288');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(tx, ty, o.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#5a6066'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#9aa2a8'; ctx.beginPath(); ctx.arc(tx, ty, o.r * 0.35, 0, TAU); ctx.fill();
      ctx.font = '800 11px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#3a6fa0'; ctx.fillText('ÁGUA', tx, ty + o.r * 0.7);
      break;
    }
    case 'silo': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      const tx = o.x + ox, ty = o.y + oy, r = o.r;
      const ang = Math.atan2(oy, ox) + Math.PI / 2;
      ctx.fillStyle = '#9aa0a4';
      ctx.beginPath(); ctx.moveTo(o.x + Math.cos(ang) * r, o.y + Math.sin(ang) * r); ctx.lineTo(tx + Math.cos(ang) * r, ty + Math.sin(ang) * r);
      ctx.lineTo(tx - Math.cos(ang) * r, ty - Math.sin(ang) * r); ctx.lineTo(o.x - Math.cos(ang) * r, o.y - Math.sin(ang) * r); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
      for (let t = 0.1; t < 1; t += 0.12) { ctx.beginPath(); ctx.arc(o.x + ox * t, o.y + oy * t, r, ang, ang + Math.PI); ctx.stroke(); }
      const gr = ctx.createRadialGradient(tx - 10, ty - 10, 3, tx, ty, r);
      gr.addColorStop(0, '#e2e6e8'); gr.addColorStop(1, '#8a9094');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(tx, ty, r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6a7074'; ctx.beginPath(); ctx.arc(tx, ty, 5, 0, TAU); ctx.fill();
      break;
    }
    case 'windmill': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#8a8d90'; ctx.lineWidth = 2;
      ctx.beginPath(); for (const [dx, dy] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]) { ctx.moveTo(o.x + dx, o.y + dy); ctx.lineTo(o.x + ox, o.y + oy); } ctx.stroke();
      ctx.save(); ctx.translate(o.x + ox, o.y + oy); ctx.rotate(Game.time * 1.8);
      for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.fillStyle = i % 2 ? '#c9ccd0' : '#a8acb0'; ctx.beginPath(); ctx.moveTo(2, -1.5); ctx.lineTo(19, -4); ctx.lineTo(19, 2); ctx.lineTo(2, 1.5); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#5a5d60'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
      ctx.restore();
      break;
    }
    case 'flood': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#5a5d62'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + ox, o.y + oy); ctx.stroke();
      ctx.save(); ctx.translate(o.x + ox, o.y + oy); ctx.rotate(Math.atan2(o.ty - o.y, o.tx - o.x));
      ctx.fillStyle = '#2a2c30'; ctx.fillRect(-4, -9, 8, 18);
      ctx.fillStyle = '#f4f6ff'; for (let i = -6; i <= 6; i += 4) ctx.fillRect(1, i - 1.2, 3, 2.4);
      ctx.restore();
      break;
    }
    case 'billboard': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.strokeStyle = '#4a4d52'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(o.x - 24, o.y); ctx.lineTo(o.x - 24 + ox, o.y + oy); ctx.moveTo(o.x + 24, o.y); ctx.lineTo(o.x + 24 + ox, o.y + oy); ctx.stroke();
      ctx.drawImage(billboardPanel(o), o.x + ox - 50, o.y + oy - 20, 100, 40);
      break;
    }
  }
}
function drawFallen(ctx, o, poleCol, head) {
  const L = o.h * 0.85, bx = o.x, by = o.y, ex = bx + Math.cos(o.down) * L, ey = by + Math.sin(o.down) * L;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(bx + 2, by + 3); ctx.lineTo(ex + 2, ey + 3); ctx.stroke();
  ctx.strokeStyle = poleCol; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
  head(ex, ey);
}
function billboardPanel(o) {
  if (o.panel) return o.panel;
  const c = makeCanvas(200, 80), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 200, 80); gr.addColorStop(0, '#1b1e2a'); gr.addColorStop(1, '#2c2f40');
  g.fillStyle = gr; g.fillRect(0, 0, 200, 80);
  g.fillStyle = o.col; g.fillRect(0, 0, 200, 6); g.fillRect(0, 74, 200, 6);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 21px "Segoe UI", Arial, sans-serif'; g.fillStyle = '#ffffff'; g.fillText(o.text[0], 100, 32, 186);
  g.font = '700 15px "Segoe UI", Arial, sans-serif'; g.fillStyle = o.col; g.fillText(o.text[1], 100, 56, 186);
  g.strokeStyle = '#0a0a0a'; g.lineWidth = 4; g.strokeRect(2, 2, 196, 76);
  o.panel = c;
  return c;
}
function drawTallEmissive(ctx, o) {
  switch (o.kind) {
    case 'bld': drawBuildingEmissive(ctx, o); break;
    case 'lamp': {
      if (o.broken) { if (o.light && o.light.dieAt && Game.time < o.light.dieAt && Math.random() < 0.5) { const [ox, oy] = offAt(o.hx, o.hy, o.h); ctx.drawImage(glowSprite('#ffffff'), o.hx + ox - 8, o.hy + oy - 8, 16, 16); } return; }
      const [ox, oy] = offAt(o.hx, o.hy, o.h);
      const hex = lightHex(o.col);
      ctx.drawImage(glowSprite(hex), o.hx + ox - 16, o.hy + oy - 16, 32, 32);
      ctx.drawImage(glowSprite('#ffffff'), o.hx + ox - 5, o.hy + oy - 5, 10, 10);
      // mariposas rodando a lâmpada
      if (Settings.quality !== 'baixa') { ctx.fillStyle = 'rgba(255,240,200,0.75)'; for (let i = 0; i < 3; i++) { const a = Game.time * (3 + i) + i * 2.1 + o.x * 0.01; ctx.fillRect(o.hx + ox + Math.cos(a) * (7 + i * 3), o.hy + oy + Math.sin(a * 1.3) * (6 + i * 2), 1.2, 1.2); } }
      break;
    }
    case 'tlight': {
      if (o.down !== undefined) break;
      const [ox, oy] = offAt(o.hx, o.hy, o.h);
      const st = lightState(o.node, o.axis, Game.time);
      const c = st === 'R' ? '#ff3b30' : st === 'Y' ? '#ffb000' : '#2bff7a';
      const yy = st === 'R' ? -5 : st === 'Y' ? 0 : 5;
      const px = o.hx + ox - Math.sin(o.a) * yy, py = o.hy + oy + Math.cos(o.a) * yy;
      ctx.drawImage(glowSprite(c), px - 10, py - 10, 20, 20);
      break;
    }
    case 'totem': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.fillStyle = 'rgba(255,90,60,0.9)';
      ctx.font = '700 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('5,89', o.x + ox, o.y + oy + 3); ctx.fillText('4,19', o.x + ox, o.y + oy + 14);
      ctx.globalAlpha = 0.6; ctx.drawImage(glowSprite(lightHex(o.color)), o.x + ox - 30, o.y + oy - 30, 60, 60); ctx.globalAlpha = 1;
      break;
    }
    case 'canopy': {
      const [ox, oy] = offAt(o.cx, o.cy, o.h);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let x = o.x0 + 40; x < o.x1 - 20; x += 60) for (const yy of [o.y0 + 30, o.y1 - 30]) ctx.fillRect(x + ox - 10, yy + oy - 2, 20, 4);
      break;
    }
    case 'watertower': {
      if (Game.time % 2 < 0.6) { const [ox, oy] = offAt(o.x, o.y, o.h + 6); ctx.drawImage(glowSprite('#ff2a2a'), o.x + ox - 16, o.y + oy - 16, 32, 32); }
      break;
    }
    case 'flood': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.drawImage(glowSprite('#e8f0ff'), o.x + ox - 22, o.y + oy - 22, 44, 44);
      break;
    }
    case 'billboard': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.globalAlpha = 0.35; ctx.drawImage(billboardPanel(o), o.x + ox - 50, o.y + oy - 20, 100, 40); ctx.globalAlpha = 1;
      break;
    }
    case 'grill': {
      if (o.down !== undefined) break;
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(Game.time * 9 + o.x); ctx.drawImage(glowSprite('#ff7a2a'), o.x - 18, o.y - 18, 36, 36); ctx.globalAlpha = 1;
      break;
    }
    case 'radar': {
      if (o.down !== undefined) break;
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.drawImage(glowSprite('#ff2a2a'), o.x + ox + 3, o.y + oy - 6, 5, 5);
      const fl = Game.time - o.last;
      if (fl < 0.25) { ctx.globalAlpha = 1 - fl * 4; ctx.drawImage(glowSprite('#ffffff'), o.x + ox - 90, o.y + oy - 90, 180, 180); ctx.globalAlpha = 1; }
      break;
    }
    case 'flags': {
      if (!o.bulbs) break;
      const [aox, aoy] = offAt(o.x1, o.y1, o.h), [box, boy] = offAt(o.x2, o.y2, o.h);
      const x0 = o.x1 + aox, y0 = o.y1 + aoy, x1 = o.x2 + box, y1 = o.y2 + boy;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + 12;
      const spr = glowSprite('#ffc46a'), n = Math.max(3, Math.floor(Math.hypot(x1 - x0, y1 - y0) / 18));
      for (let i = 1; i < n; i++) {
        const t = i / n, u = 1 - t;
        const px = u * u * x0 + 2 * u * t * cx + t * t * x1, py = u * u * y0 + 2 * u * t * cy + t * t * y1;
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Game.time * 2 + i); ctx.drawImage(spr, px - 5, py - 5, 10, 10);
      }
      ctx.globalAlpha = 1;
      break;
    }
    case 'busstop': {
      const [ox, oy] = offAt(o.x, o.y, o.h);
      ctx.globalAlpha = 0.5; ctx.drawImage(glowSprite('#cfe0ff'), o.x + ox - 20, o.y + oy - 20, 40, 40); ctx.globalAlpha = 1;
      break;
    }
  }
}

/* ---------- iluminação ---------- */
const _lq = [], _rq = [];
const Fireflies = { list: [] };
function updateFireflies(dt) {
  const R = REGIONS[regionKeyAt(Cam.x, Cam.y)];
  const want = R.rural > 0.5 && Settings.quality !== 'baixa' ? (Settings.quality === 'alta' ? 85 : 45) : 0;
  while (Fireflies.list.length < want) Fireflies.list.push({ x: Cam.x + rnd(-900, 900), y: Cam.y + rnd(-600, 600), ph: rnd(TAU), vx: rnd(-8, 8), vy: rnd(-8, 8) });
  if (Fireflies.list.length > want) Fireflies.list.length = want;
  for (const f of Fireflies.list) {
    f.ph += dt; f.x += (f.vx + Math.sin(f.ph * 0.7) * 6) * dt; f.y += (f.vy + Math.cos(f.ph * 0.9) * 6) * dt;
    if (Math.abs(f.x - Cam.x) > 1000 || Math.abs(f.y - Cam.y) > 700) { f.x = Cam.x + rnd(-900, 900); f.y = Cam.y + rnd(-600, 600); }
  }
}
// força do farol do jogador: frente amassada deixa o farol fraco e piscando
function headlightK() {
  const zf = Profile.zones ? Profile.zones.f : 0;
  if (zf < 0.35) return 1;
  let k = 1 - (zf - 0.35) / 0.65 * 0.75;
  if (zf > 0.65) { const T = Game.time, f = Math.sin(T * 17.3) + Math.sin(T * 5.1 + 1.7) + Math.sin(T * 41 + 0.4) * 0.6; if (f > 1.5) k *= 0.3; }
  return clamp(k, 0.2, 1);
}
// farol de cada lado (s = -1 esquerdo, 1 direito): lado muito amassado apaga aquele farol
// nunca apagam os dois: no máximo um farol para, o outro fica fraquinho
function playerLamp(s) {
  const Z = Profile.zones || {};
  const dmg = (q) => Math.max(q < 0 ? Z.l || 0 : Z.rt || 0, q < 0 ? Z.fL || 0 : Z.fR || 0);
  const me = dmg(s), other = dmg(-s), f = Z.f || 0;
  // qual lado apagaria: o mais amassado (empate: o esquerdo)
  const worst = me > other || (me === other && s < 0);
  const off = (me > 0.82 || f > 0.97) && worst;
  if (off) return 0;
  let k = headlightK() * (me > 0.55 ? 0.7 : 1);
  if (me > 0.82 || f > 0.97) k = Math.min(k, 0.4); // o farol que sobrou, também amassado, fica fraquinho
  return Math.max(k, 0.22);
}
function carLightsInfo(c, isPlayer) {
  const m = c.m, as = Math.atan2(Math.sin(c.a) * SQ, Math.cos(c.a)), ca = Math.cos(as), sa = Math.sin(as);
  const hl = m.L / 2, hw = Math.max(0, m.W / 2 - 4);
  const cy = c.y - vehLift(m) / SQ;
  return { ca, sa, fx: c.x + ca * hl, fy: cy + sa * hl / SQ, rx: c.x - ca * hl, ry: cy - sa * hl / SQ, nx: -sa * hw, ny: ca * hw / SQ };
}
function lightPass(view, cx, cy) {
  const lw = lightCanvas.width, lh = lightCanvas.height;
  const zl = Cam.zoom * LS;
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalCompositeOperation = 'source-over';
  lctx.globalAlpha = 1;
  lctx.fillStyle = `rgba(6,11,30,${Cam.dark.toFixed(3)})`;
  lctx.fillRect(0, 0, lw, lh);
  lctx.globalCompositeOperation = 'destination-out';
  lctx.setTransform(zl, 0, 0, zl * SQ, lw / 2 - cx * zl, lh / 2 - cy * zl * SQ);
  lightGrid.query(view.x0 - 260, view.y0 - 260, view.x1 + 260, view.y1 + 260, _lq);
  const T = Game.time;
  for (const L of _lq) {
    let i = L.i;
    if (L.dieAt) { if (T > L.dieAt) continue; i *= Math.random() < 0.5 ? 0.1 : 1; }
    if (L.flick) { const f = Math.sin(T * 23 + L.seed * 50) + Math.sin(T * 7.3 + L.seed * 9); i *= f > 1.2 ? 0.25 : 1; }
    lctx.globalAlpha = i;
    lctx.drawImage(LSPR, L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
  }
  const cone = (c, len, alpha) => {
    const I = carLightsInfo(c);
    lctx.save(); lctx.translate(I.fx, I.fy); lctx.rotate(c.a); lctx.globalAlpha = alpha;
    lctx.drawImage(CONE, -4, -len / 4, len, len / 2);
    lctx.restore();
    lctx.globalAlpha = alpha * 0.6;
    lctx.drawImage(LSPR, c.x - 34, c.y - 34, 68, 68);
  };
  for (const c of Traffic.cars) {
    if (c.x < view.x0 - 400 || c.x > view.x1 + 400 || c.y < view.y0 - 400 || c.y > view.y1 + 400) continue;
    cone(c, c.big ? 300 : 250, 0.85);
  }
  if (player && Game.state !== 'menu') {
    // um facho saindo de cada farol, na posição real da lâmpada
    const I = carLightsInfo(player), base = player.highBeam ? 520 : 360;
    for (const s of [-1, 1]) {
      const k = playerLamp(s); if (k <= 0.01) continue;
      const len = base * (0.45 + 0.55 * k);
      lctx.save(); lctx.translate(I.fx + I.nx * s, I.fy + I.ny * s); lctx.rotate(player.a + s * 0.03); lctx.globalAlpha = 0.72 * k;
      lctx.drawImage(CONE, -2, -len * 0.21, len, len * 0.42);
      lctx.restore();
    }
    lctx.globalAlpha = 0.22; lctx.drawImage(LSPR, player.x - 105, player.y - 105, 210, 210); // brilho em volta do carro (60% mais fraco)
  }
  lctx.globalAlpha = 1;
  lctx.globalCompositeOperation = 'source-over';
  lctx.setTransform(1, 0, 0, 1, 0, 0);
}
function glowPass(view, cx, cy) {
  // camada de brilho colorido em baixa resolução (poças de luz e cones)
  const gw = glowCanvas.width, gh = glowCanvas.height, zl = Cam.zoom * LS;
  gctx.setTransform(1, 0, 0, 1, 0, 0);
  gctx.globalCompositeOperation = 'source-over'; gctx.globalAlpha = 1;
  gctx.clearRect(0, 0, gw, gh);
  gctx.globalCompositeOperation = 'lighter';
  gctx.setTransform(zl, 0, 0, zl * SQ, gw / 2 - cx * zl, gh / 2 - cy * zl * SQ);
  const T = Game.time;
  for (const L of _lq) {
    if (L.x < view.x0 - L.r || L.x > view.x1 + L.r || L.y < view.y0 - L.r || L.y > view.y1 + L.r) continue;
    let i = L.i;
    if (L.dieAt) { if (T > L.dieAt) continue; i *= Math.random() < 0.5 ? 0.1 : 1; }
    if (L.flick) { const f = Math.sin(T * 23 + L.seed * 50) + Math.sin(T * 7.3 + L.seed * 9); i *= f > 1.2 ? 0.2 : 1; }
    const a = (L.shop ? 0.32 : L.canopy ? 0.12 : L.flood ? 0.1 : 0.17) * i;
    gctx.globalAlpha = a;
    gctx.drawImage(glowSprite(lightHex(L.col)), L.x - L.r * 0.85, L.y - L.r * 0.85, L.r * 1.7, L.r * 1.7);
  }
  // reflexos das luzes na água
  for (const L of _lq) {
    if (!L.refl || (L.dieAt && T > L.dieAt) || L.y + L.refl < view.y0 - 100 || L.y > view.y1) continue;
    const spr = glowSprite(lightHex(L.col));
    for (let k = 0; k < 3; k++) {
      const yy = L.y + L.refl + k * 26, sh = Math.sin(T * 2.2 + k * 1.7 + L.seed * 20);
      gctx.globalAlpha = (0.32 - k * 0.08) * L.i;
      gctx.drawImage(spr, L.x - 16 + sh * 4, yy - 28, 32, 56);
    }
  }
  const cone = (c, len, a) => {
    const I = carLightsInfo(c);
    gctx.globalAlpha = a;
    gctx.save(); gctx.translate(I.fx, I.fy); gctx.rotate(c.a);
    gctx.drawImage(CONE, -4, -len / 4, len, len / 2);
    gctx.restore();
  };
  for (const c of Traffic.cars) if (inView(view, c.x, c.y, 300)) cone(c, c.big ? 300 : 250, 0.07);
  if (player && Game.state !== 'menu') {
    const I = carLightsInfo(player), base = player.highBeam ? 520 : 360;
    for (const s of [-1, 1]) {
      const k = playerLamp(s); if (k <= 0.01) continue;
      const len = base * (0.45 + 0.55 * k);
      gctx.globalAlpha = 0.08 * k; gctx.save(); gctx.translate(I.fx + I.nx * s, I.fy + I.ny * s); gctx.rotate(player.a + s * 0.03);
      gctx.drawImage(CONE, -2, -len * 0.21, len, len * 0.42); gctx.restore();
    }
  }
  for (const o of _talls) {
    if (o.kind !== 'tlight') continue;
    const st = lightState(o.node, o.axis, T);
    gctx.globalAlpha = 0.18; gctx.drawImage(glowSprite(st === 'R' ? '#ff3b30' : st === 'Y' ? '#ffb000' : '#2bff7a'), o.hx - 40, o.hy - 40, 80, 80);
  }
  gctx.globalAlpha = 1;
  gctx.globalCompositeOperation = 'source-over';
}
function emissivePass(view, talls) {
  ctx.globalCompositeOperation = 'lighter';
  const T = Game.time;
  for (const o of talls) drawTallEmissive(ctx, o);
  // veículos
  const tail = glowSprite('#ff2a1e'), head = glowSprite('#fff1cf'), amber = glowSprite('#ffa520'), white = glowSprite('#ffffff');
  const carGlow = (c, brake, rev, blink, isPlayer) => {
    const I = carLightsInfo(c);
    const Z = isPlayer ? Profile.zones : c.zones;
    const brokeF = (s) => Z && (Z.f > 0.85 || (Z.f > 0.6 && s < 0)), brokeR = (s) => Z && (Z.r > 0.85 || (Z.r > 0.6 && s < 0));
    if (isPlayer) for (const s of [1, -1]) { const k = playerLamp(s); if (k <= 0.01) continue; ctx.globalAlpha = 0.95 * (0.25 + 0.75 * k); ctx.drawImage(head, I.fx + I.nx * s - 9, I.fy + I.ny * s - 9, 18, 18); }
    else { ctx.globalAlpha = 0.95; for (const s of [1, -1]) if (!brokeF(s)) ctx.drawImage(head, I.fx + I.nx * s - 9, I.fy + I.ny * s - 9, 18, 18); }
    const tr = brake ? 15 : 9;
    ctx.globalAlpha = brake ? 1 : 0.7;
    for (const s of [1, -1]) if (!brokeR(s)) ctx.drawImage(tail, I.rx + I.nx * s - tr, I.ry + I.ny * s - tr, tr * 2, tr * 2);
    if (brake) { ctx.globalAlpha = 0.25; ctx.drawImage(tail, I.rx - 30, I.ry - 30, 60, 60); }
    if (rev) { ctx.globalAlpha = 0.8; for (const s of [1, -1]) ctx.drawImage(white, I.rx + I.nx * s * 0.5 - 7, I.ry + I.ny * s * 0.5 - 7, 14, 14); }
    if (blink && (T * 2.6) % 1 < 0.5) {
      ctx.globalAlpha = 0.9;
      const s = blink;
      ctx.drawImage(amber, I.fx + I.nx * s * 1.2 - 8, I.fy + I.ny * s * 1.2 - 8, 16, 16);
      ctx.drawImage(amber, I.rx + I.nx * s * 1.2 - 8, I.ry + I.ny * s * 1.2 - 8, 16, 16);
    }
    if (c.model === 'police') {
      const ph = Math.floor(T * 7) % 2;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(glowSprite(ph ? '#ff2a2a' : '#2a6aff'), c.x - 14, c.y - 14, 28, 28);
      ctx.globalAlpha = 0.25; ctx.drawImage(glowSprite(ph ? '#ff2a2a' : '#2a6aff'), c.x - 60, c.y - 60, 120, 120);
    }
    if (c.model === 'taxi') { ctx.globalAlpha = 0.8; ctx.drawImage(amber, c.x - 7, c.y - 7, 14, 14); }
    if (c.model === 'bus') { ctx.globalAlpha = 0.6; ctx.drawImage(amber, I.fx - I.ca * 4 - 10, I.fy - I.sa * 4 - 10, 20, 20); }
  };
  for (const c of Traffic.cars) {
    if (c.x < view.x0 - 300 || c.x > view.x1 + 300 || c.y < view.y0 - 300 || c.y > view.y1 + 300) continue;
    const nearNode = c.state === 'turn' || (c.sEnd - c.s) < 150;
    carGlow(c, c.braking || c.hitT > 0 || c.v < 3, false, c.lcBlink || (nearNode ? c.blink : 0), false);
  }
  if (player && Game.state !== 'menu') carGlow(player, player.braking || Keys.Space, player.rev, 0, true);
  if (Socorro.job && (Game.time * 2.2) % 1 < 0.5) { const J = Socorro.job; ctx.globalAlpha = 0.9; const s = glowSprite('#ffa520'); ctx.drawImage(s, J.x - 22, J.y - 22, 44, 44); ctx.globalAlpha = 1; }
  // animais (olhos de coruja)
  for (const an of Animals.list) {
    if (an.type !== 'owl' || an.blinkT < 0) continue;
    if (an.x < view.x0 || an.x > view.x1 || an.y < view.y0 || an.y > view.y1) continue;
    ctx.globalAlpha = 0.9; ctx.drawImage(glowSprite('#ffd84a'), an.x - 6, an.y - 6, 12, 12);
  }
  // vaga-lumes
  for (const f of Fireflies.list) {
    const a = Math.max(0, Math.sin(f.ph * 2.2)) ** 3;
    if (a < 0.05) continue;
    ctx.globalAlpha = a * 0.9; ctx.drawImage(glowSprite('#d8ff6a'), f.x - 5, f.y - 5, 10, 10);
  }
  ctx.globalAlpha = 1;
  Particles.drawEmissive(ctx);
  for (const f of World.fountains) {
    if (!inView(view, f.x, f.y, 60)) continue;
    for (let i = 0; i < 3; i++) { const ph = ((T * 0.6 + i / 3) % 1); ctx.globalAlpha = (1 - ph) * 0.35; ctx.strokeStyle = '#bff0ff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(f.x, f.y, 6 + ph * 26, 0, TAU); ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
  drawMarkersEmissive(view);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/* ---------- marcadores de atividade ---------- */
function ring(x, y, r, hex, a, w) {
  ctx.globalAlpha = a; ctx.strokeStyle = hex; ctx.lineWidth = w || 3;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
}
function inView(view, x, y, m) { return x > view.x0 - m && x < view.x1 + m && y > view.y0 - m && y < view.y1 + m; }
function drawMarkersEmissive(view) {
  if (!player || Game.state === 'menu') return;
  const T = Game.time, pulse = 0.5 + 0.5 * Math.sin(T * 4);
  // GPS
  if (Act.gps && Act.gps.pts.length > 1) {
    const pts = Act.gps.pts;
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#5be38f';
    let acc = (T * 60) % 40, drawn = 0;
    for (let i = 1; i < pts.length && drawn < 30; i++) {
      const ax = pts[i - 1][0], ay = pts[i - 1][1], bx = pts[i][0], by = pts[i][1];
      const L = Math.hypot(bx - ax, by - ay); if (L < 1) continue;
      const ux = (bx - ax) / L, uy = (by - ay) / L, ang = Math.atan2(uy, ux);
      for (let s = acc; s < L; s += 40) {
        const x = ax + ux * s, y = ay + uy * s;
        const d = Math.hypot(x - player.x, y - player.y);
        if (d > 650) { drawn = 99; break; }
        if (d < 40) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-1, 0); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
        ctx.restore(); drawn++;
      }
      acc = (acc - L) % 40; if (acc < 0) acc += 40;
    }
  }
  // comércios
  for (const s of World.shops) {
    if (!inView(view, s.x, s.y, 80)) continue;
    let col = '#ff8a3d', r = 26;
    if (s.kind === 'garagem') col = '#5be38f';
    else if (s.kind === 'posto') col = '#ffb000';
    else if (s.kind === 'oficina') col = '#59e0ff';
    else if (s.pickup && !Act.delivery) { col = '#ffd24a'; r = 32; }
    ring(s.x, s.y, r + pulse * 4, col, 0.55, 3);
    ctx.globalAlpha = 0.35; ctx.drawImage(glowSprite(col), s.x - r * 1.6, s.y - r * 1.6, r * 3.2, r * 3.2);
    if (s.pickup && !Act.delivery) {
      ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffd24a';
      const bob = Math.sin(T * 3) * 3 - r - 16;
      ctx.fillRect(s.x - 7, s.y - 7 + bob, 14, 12); ctx.fillStyle = '#7a5a1a'; ctx.fillRect(s.x - 7, s.y - 2 + bob, 14, 1.5); ctx.fillRect(s.x - 0.75, s.y - 7 + bob, 1.5, 12);
    }
  }
  // destino da entrega / frete / corrida
  const tg = currentTarget();
  if (tg && (tg.kind === 'delivery' || tg.kind === 'ride')) {
    const d = tg;
    if (inView(view, d.x, d.y, 120)) {
      ctx.globalAlpha = 0.5; ctx.drawImage(glowSprite('#ffd24a'), d.x - 70, d.y - 70, 140, 140);
      ring(d.x, d.y, 44 + pulse * 8, '#ffd24a', 0.8, 4);
      ring(d.x, d.y, 26, '#fff3b0', 0.6, 2);
    }
  }
  // percursos
  if (!Act.race) {
    for (const r of World.races) {
      if (!inView(view, r.start[0], r.start[1], 80)) continue;
      ring(r.start[0], r.start[1], 40 + pulse * 5, '#59e0ff', 0.7, 4);
      ctx.globalAlpha = 0.8;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = (i + j) % 2 ? '#ffffff' : '#59e0ff'; ctx.fillRect(r.start[0] - 12 + i * 6, r.start[1] - 9 + j * 6, 6, 6); }
    }
  } else {
    const R = Act.race;
    for (let i = R.idx; i < Math.min(R.r.pts.length, R.idx + 2); i++) {
      const p = R.r.pts[i], last = i === R.r.pts.length - 1;
      if (!inView(view, p[0], p[1], 120)) continue;
      const main = i === R.idx;
      ctx.globalAlpha = main ? 0.55 : 0.2; ctx.drawImage(glowSprite(last ? '#ffffff' : '#59e0ff'), p[0] - 90, p[1] - 90, 180, 180);
      ring(p[0], p[1], 80, last ? '#ffffff' : '#59e0ff', main ? 0.85 : 0.3, main ? 5 : 3);
    }
  }
  // vaga
  if (Act.parkSpot) {
    const s = Act.parkSpot;
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a);
    const prog = Act.parkHold > 0 ? Act.parkHold / 1.2 : 0;
    const ok = Act.parkHold > 0 || Act.parkLock === s.id;
    ctx.globalAlpha = 0.7 + pulse * 0.2; ctx.strokeStyle = ok ? '#5be38f' : '#5b8cff'; ctx.lineWidth = 2.5;
    ctx.strokeRect(-s.l / 2, -s.w / 2, s.l, s.w);
    ctx.globalAlpha = 0.25; ctx.fillStyle = ok ? '#5be38f' : '#5b8cff'; ctx.fillRect(-s.l / 2, -s.w / 2, s.l * Math.max(prog, 0.08), s.w);
    ctx.restore();
    ctx.globalAlpha = 0.85; ctx.fillStyle = '#cfe0ff'; ctx.font = '800 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('P', s.x, s.y);
  }
  ctx.globalAlpha = 1;
}

/* ---------- quadro principal ---------- */
const _talls = [];
let forceGround = true;
function render() {
  frameNo++;
  const W = canvas.width, Hh = canvas.height;
  const z = Cam.zoom * RS;
  const sx = (Math.random() - 0.5) * Cam.shake, sy = (Math.random() - 0.5) * Cam.shake;
  const cx = Cam.x + sx, cy = Cam.y + sy;
  const vw = W / z, vh = Hh / (z * SQ);
  const view = Cam.view; view.x0 = cx - vw / 2; view.y0 = cy - vh / 2; view.x1 = cx + vw / 2; view.y1 = cy + vh / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = '#0a1008'; ctx.fillRect(0, 0, W, Hh);
  ctx.setTransform(z, 0, 0, z * SQ, W / 2 - cx * z, Hh / 2 - cy * z * SQ);
  ctx.imageSmoothingEnabled = true;
  drawGround(view, forceGround); forceGround = false;
  Skids.draw(ctx, view);
  Debris.draw(ctx, view);
  // veículos e animais
  for (const an of Animals.list) if (an.type !== 'owl' && inView(view, an.x, an.y, 30)) drawAnimal(ctx, an);
  if (Settings.quality !== 'baixa') Peladas.draw(ctx, view);
  for (const c of Traffic.cars) {
    if (!inView(view, c.x, c.y, 80)) continue;
    drawVehicle(ctx, c.m, c.color, c.x, c.y, c.a, { steer: c.steerVis, roll: c.roll, brake: c.braking || c.v < 3, box: c.box, zones: c.zones });
  }
  if (Socorro.job && inView(view, Socorro.job.x, Socorro.job.y, 120)) drawVehicle(ctx, VMODELS.guincho, '#c8302a', Socorro.job.x, Socorro.job.y, Socorro.job.a, { roll: 0, brake: Socorro.job.state === 'arrived' });
  if (player && Game.state !== 'menu') {
    drawVehicle(ctx, player.m, player.color, player.x, player.y, player.a, { steer: player.steer * 1.4, roll: player.roll, lean: player.lean, brake: player.braking || Keys.Space, rev: player.rev, dirt: Profile.dirt, damage: Profile.damage, cargo: !!Act.delivery, zones: Profile.zones, tow: player.car.job === 'guincho' && Act.delivery && Act.delivery.stage === 'deliver', towColor: Act.delivery && Act.delivery.color, boxText: player.car.job === 'bau' ? 'LEVA-E-TRAZ' : null });
  }
  if (player && Game.state !== 'menu') {
    const D = Act.delivery;
    if (D && D.type === 'guincho' && D.stage === 'pickup' && inView(view, D.pick.x, D.pick.y, 60)) drawVehicle(ctx, VMODELS.quadrado, D.color, D.pick.x, D.pick.y, 0.4, { parked: true, zones: { f: 0.9, r: 0, l: 0.3, rt: 0 } });
    if (Act.ride && Act.ride.stage === 'pickup' && inView(view, Act.ride.pick.x, Act.ride.pick.y, 40)) drawAnimal(ctx, { type: 'person', x: Act.ride.pick.x, y: Act.ride.pick.y - 14, a: Math.PI / 2, v: 0, phase: 0, seed: Act.ride.seed, col: '#ffd24a', skin: '#c68642', hair: '#1a1410', pants: '#2b3a55', dance: true, state: 'idle' });
    if (Act.race && Act.race.racha && Act.race.count <= 0) {
      const g = rachaGhostPos(Act.race);
      ctx.globalAlpha = 0.85; drawVehicle(ctx, VMODELS.muscle, '#e63946', g[0] - Math.sin(g[2]) * 30, g[1] + Math.cos(g[2]) * 30, g[2], { roll: Game.time * 40 }); ctx.globalAlpha = 1;
      ctx.font = 'italic 800 11px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff9a9a'; ctx.fillText(Act.race.r.rival, g[0], g[1] - 6);
    }
  }
  Particles.draw(ctx);
  // objetos altos ordenados por distância à câmera (longe primeiro)
  rendGrid.query(view.x0 - 170, view.y0 - 170, view.x1 + 170, view.y1 + 170, _rq);
  _talls.length = 0;
  for (const o of _rq) { const ox = o.cx !== undefined ? o.cx : o.x, oy = o.cy !== undefined ? o.cy : o.y; o._d = (ox - cx) * (ox - cx) + (oy - cy) * (oy - cy); _talls.push(o); }
  _talls.sort((a, b) => b._d - a._d);
  for (const o of _talls) drawTall(ctx, o);
  for (const an of Animals.list) if (an.type === 'owl' && inView(view, an.x, an.y, 30)) drawAnimal(ctx, an);
  // escuridão + luzes
  lightPass(view, cx, cy);
  const lowQ = Settings.quality === 'baixa';
  if (!lowQ) glowPass(view, cx, cy); // na baixa: sem a camada de brilho colorido
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingQuality = Settings.quality === 'alta' ? 'high' : 'low';
  ctx.drawImage(lightCanvas, 0, 0, W, Hh);
  if (!lowQ) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glowCanvas, 0, 0, W, Hh);
    // na alta: um segundo brilho suave por cima (efeito bloom)
    if (Settings.quality === 'alta') { ctx.globalAlpha = 0.35; ctx.drawImage(glowCanvas, -W * 0.01, -Hh * 0.01, W * 1.02, Hh * 1.02); ctx.globalAlpha = 1; }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.setTransform(z, 0, 0, z * SQ, W / 2 - cx * z, Hh / 2 - cy * z * SQ);
  emissivePass(view, _talls);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (Cam.flash > 0.01) { ctx.fillStyle = `rgba(255,255,255,${(Cam.flash * 0.6).toFixed(3)})`; ctx.fillRect(0, 0, W, Hh); }
}

/* ---------- mapa (minimapa e mapa grande) ---------- */
let MAPIMG = null;
const MAP_S = 0.1;
function buildMapImage() {
  const c = makeCanvas(GW, GH), g = c.getContext('2d');
  const img = g.createImageData(GW, GH), d = img.data;
  const COLS = [[34, 52, 30], [92, 96, 104], [70, 72, 76], [150, 98, 64], [24, 64, 96], [140, 112, 80], [74, 76, 80], [62, 80, 40], [96, 78, 56], [150, 136, 100]];
  for (let i = 0; i < GW * GH; i++) { const col = COLS[ground[i]] || COLS[0]; d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  g.fillStyle = 'rgba(14,30,14,0.9)';
  colGrid.query(0, 0, WORLD_W, WORLD_H, _q);
  for (const o of _q) if (o.tag === 'forest') g.fillRect(o.x0 * MAP_S - 1.4, o.y0 * MAP_S - 1.4, (o.x1 - o.x0) * MAP_S + 2.8, (o.y1 - o.y0) * MAP_S + 2.8);
  for (const b of World.buildings) { g.fillStyle = b.h > 60 ? '#a8a49a' : '#8a7f72'; g.fillRect(b.x0 * MAP_S, b.y0 * MAP_S, (b.x1 - b.x0) * MAP_S, (b.y1 - b.y0) * MAP_S); }
  g.strokeStyle = 'rgba(210,214,220,0.9)'; g.lineCap = 'round';
  for (const e of World.edges) {
    g.lineWidth = e.T.id === 'avenue' || e.T.id === 'highway' ? 3.2 : e.T.id === 'dirt' ? 1.6 : 2.2;
    g.strokeStyle = e.T.id === 'dirt' ? 'rgba(190,150,100,0.95)' : e.T.id === 'highway' ? 'rgba(255,200,110,0.95)' : 'rgba(215,218,224,0.9)';
    g.beginPath(); g.moveTo(e.a.x * MAP_S, e.a.y * MAP_S); g.lineTo(e.b.x * MAP_S, e.b.y * MAP_S); g.stroke();
  }
  MAPIMG = c;
}
function mapIcon(g, x, y, kind, s) {
  s = s || 1;
  const col = { job: '#ffd24a', shop: '#ff8a3d', race: '#59e0ff', park: '#5b8cff', poi: '#c56bff', gps: '#5be38f', home: '#5be38f', fuel: '#ffb000', repair: '#59e0ff', unknown: 'rgba(197,107,255,0.55)' }[kind];
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.beginPath(); g.arc(x, y, 5.5 * s, 0, TAU); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(x, y, 4 * s, 0, TAU); g.fill();
  if (kind === 'unknown' || kind === 'home' || kind === 'fuel' || kind === 'repair') {
    g.fillStyle = '#0a0a0a'; g.font = `800 ${Math.round(6 * s)}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(kind === 'unknown' ? '?' : kind === 'home' ? 'G' : kind === 'fuel' ? 'P' : 'O', x, y + 0.5);
  }
}
function shopIconKind(s) { return s.kind === 'garagem' ? 'home' : s.kind === 'posto' ? 'fuel' : s.kind === 'oficina' ? 'repair' : s.pickup && !Act.delivery ? 'job' : 'shop'; }
const mmCanvas = document.getElementById('minimap'), mm = mmCanvas.getContext('2d');
function drawMinimap() {
  if (!MAPIMG || !player) return;
  const S = mmCanvas.width, k = S / 220;
  const R = 1250;
  const scale = (S / 2) / R;
  mm.setTransform(1, 0, 0, 1, 0, 0);
  mm.fillStyle = '#0b1210'; mm.fillRect(0, 0, S, S);
  mm.save();
  mm.beginPath(); mm.arc(S / 2, S / 2, S / 2, 0, TAU); mm.clip();
  mm.translate(S / 2, S / 2);
  const rot = Settings.minimapRotate ? -player.a - Math.PI / 2 : 0;
  mm.rotate(rot);
  mm.scale(scale, scale);
  mm.translate(-player.x, -player.y);
  mm.imageSmoothingEnabled = true;
  mm.drawImage(MAPIMG, 0, 0, WORLD_W, WORLD_H);
  if (Act.gps) {
    mm.strokeStyle = '#2f8bff'; mm.lineWidth = 5 / scale * k * 0.5; mm.lineJoin = 'round';
    mm.beginPath(); Act.gps.pts.forEach((p, i) => (i ? mm.lineTo(p[0], p[1]) : mm.moveTo(p[0], p[1]))); mm.stroke();
  }
  const ic = (x, y, kind) => { mm.save(); mm.translate(x, y); mm.rotate(-rot); mm.scale(1 / scale * k * 1.05, 1 / scale * k * 1.05); mapIcon(mm, 0, 0, kind, 1.1); mm.restore(); };
  for (const c of Traffic.cars) { if (Math.abs(c.x - player.x) > R * 1.5 || Math.abs(c.y - player.y) > R * 1.5) continue; mm.fillStyle = 'rgba(255,255,255,0.55)'; mm.fillRect(c.x - 12, c.y - 12, 24, 24); }
  for (const s of World.shops) ic(s.x, s.y, shopIconKind(s));
  if (Socorro.job) ic(Socorro.job.x, Socorro.job.y, 'repair');
  if (!Act.race) for (const r of World.races) ic(r.start[0], r.start[1], 'race');
  for (const s of World.parkSpots) if (!Profile.parks[s.id]) ic(s.x, s.y, 'park');
  for (const p of World.pois) if (Profile.discovered.includes(p.id)) ic(p.x, p.y, 'poi');
  const t = currentTarget();
  if (t) ic(t.x, t.y, 'gps');
  mm.restore();
  // seta do jogador
  mm.save(); mm.translate(S / 2, S / 2); mm.rotate(player.a + rot);
  mm.fillStyle = '#ffffff'; mm.strokeStyle = '#000'; mm.lineWidth = 2 * k;
  mm.beginPath(); mm.moveTo(9 * k, 0); mm.lineTo(-6 * k, -6 * k); mm.lineTo(-3 * k, 0); mm.lineTo(-6 * k, 6 * k); mm.closePath(); mm.stroke(); mm.fill();
  mm.restore();
  if (!Settings.minimapRotate) {
    mm.fillStyle = 'rgba(255,255,255,0.8)'; mm.font = `700 ${11 * k}px Arial`; mm.textAlign = 'center'; mm.fillText('N', S / 2, 16 * k);
  }
}
/* ---------- mapa estilo app de celular: arrastar, zoom e destinos ---------- */
const MAP_LABELS = [['CENTRÃO', 1600, 1150], ['DISTRITO DA GAMBIARRA', 3650, 700], ['VILA SEM PRESSA', 1150, 4100], ['ALFAVILA', 3400, 4700], ['RIO JUCU', 5450, 5000], ['SÍTIO BOTA FÉ', 7500, 2600], ['FAZENDA MUUUITO LONGE', 7700, 5000], ['RODOVIA BR-101 E POUCO', 4200, 6370], ['FEU ROSA', 1150, 7350], ['JARDIM CARAPINA', 3300, 7350], ['NOVA ROSA DA PENHA', 1300, 8400], ['FLEXAL', 3600, 8400]];
class MapView {
  constructor(canvas, st) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.st = st; // st: {cx, cy, z} compartilhado
    const P = new Map(); let down = null, moved = false, pinch0 = null;
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]);
      if (P.size === 1) { down = [e.clientX, e.clientY, this.st.cx, this.st.cy]; moved = false; }
      if (P.size === 2) { const [a, b] = [...P.values()]; pinch0 = [Math.hypot(a[0] - b[0], a[1] - b[1]), this.st.z]; moved = true; }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!P.has(e.pointerId)) return; P.set(e.pointerId, [e.clientX, e.clientY]);
      if (P.size === 2 && pinch0) { const [a, b] = [...P.values()]; this.setZoom(pinch0[1] * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0[0]); this.draw(); return; }
      if (!down) return;
      const dx = e.clientX - down[0], dy = e.clientY - down[1];
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      if (moved) { this.st.cx = clamp(down[2] - dx / this.st.z, 0, WORLD_W); this.st.cy = clamp(down[3] - dy / this.st.z, 0, WORLD_H); this.st.follow = false; this.draw(); }
    });
    const up = (e) => {
      P.delete(e.pointerId); if (P.size < 2) pinch0 = null;
      if (down && !moved && P.size === 0 && e.type === 'pointerup' && e.button === 0) { const w = this.toWorld(e.clientX, e.clientY); mapSetWaypoint(w[0], w[1], 'ponto marcado no mapa'); }
      if (P.size === 0) down = null;
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const w0 = this.toWorld(e.clientX, e.clientY);
      this.setZoom(this.st.z * Math.exp(-e.deltaY * 0.0015));
      const w1 = this.toWorld(e.clientX, e.clientY);
      this.st.cx = clamp(this.st.cx + w0[0] - w1[0], 0, WORLD_W); this.st.cy = clamp(this.st.cy + w0[1] - w1[1], 0, WORLD_H); this.st.follow = false;
      this.draw();
    }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); if (Act.waypoint) { Act.waypoint = null; Act.gps = null; AudioSys.back(); renderMapDests(); drawBigMap(); } });
  }
  minZ() { const r = this.c.getBoundingClientRect(); return Math.min(r.width / WORLD_W, r.height / WORLD_H) * 0.9; }
  setZoom(z) { this.st.z = clamp(z, this.minZ(), 0.24); }
  toWorld(clx, cly) { const r = this.c.getBoundingClientRect(); return [this.st.cx + (clx - r.left - r.width / 2) / this.st.z, this.st.cy + (cly - r.top - r.height / 2) / this.st.z]; }
  zoomBy(f) { this.setZoom(this.st.z * f); this.draw(); }
  center() { if (player) { this.st.cx = player.x; this.st.cy = player.y; this.st.follow = true; } this.draw(); }
  draw() {
    if (!MAPIMG || !this.c.isConnected) return;
    const c = this.c, g = this.g, r = c.getBoundingClientRect();
    if (r.width < 4) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const Wp = Math.round(r.width * dpr), Hp = Math.round(r.height * dpr);
    if (c.width !== Wp || c.height !== Hp) { c.width = Wp; c.height = Hp; }
    if (!this.st.z) { this.st.z = this.minZ(); this.st.cx = WORLD_W / 2; this.st.cy = WORLD_H / 2; }
    if (this.st.z < this.minZ()) this.st.z = this.minZ();
    if (this.st.follow && player) { this.st.cx = player.x; this.st.cy = player.y; }
    const z = this.st.z, s = z * dpr, k = 1 / z; // k: unidades do mundo por px de tela
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#16231a'; g.fillRect(0, 0, Wp, Hp);
    g.setTransform(s, 0, 0, s, Wp / 2 - this.st.cx * s, Hp / 2 - this.st.cy * s);
    g.imageSmoothingEnabled = true;
    g.drawImage(MAPIMG, 0, 0, WORLD_W, WORLD_H);
    // vista visível em coordenadas do mundo
    const x0 = this.st.cx - r.width / 2 * k - 200, x1 = this.st.cx + r.width / 2 * k + 200, y0 = this.st.cy - r.height / 2 * k - 200, y1 = this.st.cy + r.height / 2 * k + 200;
    const vis = (e) => Math.max(e.a.x, e.b.x) > x0 && Math.min(e.a.x, e.b.x) < x1 && Math.max(e.a.y, e.b.y) > y0 && Math.min(e.a.y, e.b.y) < y1;
    const RW = { highway: 1, avenue: 0.9, street: 0.75, road: 0.75, dirt: 0.55 };
    const RC = { highway: '#ffc65a', avenue: '#fff2b8', street: '#e9ecf2', road: '#e9ecf2', dirt: '#c9a46a' };
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pass of [0, 1]) for (const e of World.edges) {
      if (!vis(e)) continue;
      const id = e.T.id, w = Math.max((RW[id] || 0.7) * 3.2 * k, e.T.w * 0.62);
      g.lineWidth = pass ? w : w + 2.4 * k;
      g.strokeStyle = pass ? (RC[id] || '#e9ecf2') : 'rgba(10,14,20,0.75)';
      g.beginPath(); g.moveTo(e.a.x, e.a.y); g.lineTo(e.b.x, e.b.y); g.stroke();
    }
    // nomes de rua de perto
    if (z > 0.11) {
      g.font = `600 ${10.5 * k}px -apple-system, "Segoe UI", Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const seen = new Set();
      for (const e of World.edges) {
        if (!e.name || !vis(e) || e.len < 260 || seen.has(e.name + (e.h ? 'h' : 'v') + Math.round((e.h ? e.a.y : e.a.x) / 50))) continue;
        const mx = (e.a.x + e.b.x) / 2, my = (e.a.y + e.b.y) / 2;
        if (mx < x0 + 200 || mx > x1 - 200 || my < y0 + 200 || my > y1 - 200) continue;
        seen.add(e.name + (e.h ? 'h' : 'v') + Math.round((e.h ? e.a.y : e.a.x) / 50));
        g.save(); g.translate(mx, my); if (!e.h) g.rotate(Math.PI / 2);
        g.lineWidth = 3 * k; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.strokeText(e.name, 0, 0); g.fillStyle = '#3a4250'; g.fillText(e.name, 0, 0);
        g.restore();
      }
    }
    // bairros
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const ls = clamp(14 * k, 60, 260);
    g.font = `800 ${ls}px -apple-system, "Segoe UI", Arial`;
    for (const [t, x, y] of MAP_LABELS) { g.lineWidth = ls * 0.22; g.strokeStyle = 'rgba(8,12,18,0.8)'; g.strokeText(t, x, y); g.fillStyle = 'rgba(255,255,255,0.88)'; g.fillText(t, x, y); }
    // rota do GPS (azul, como app de mapa)
    if (Act.gps) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); Act.gps.pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.strokeStyle = '#0b4fae'; g.lineWidth = 8 * k; g.stroke(); g.strokeStyle = '#2f8bff'; g.lineWidth = 5 * k; g.stroke();
    }
    const ic = (x, y, kind) => { if (x < x0 || x > x1 || y < y0 || y > y1) return; g.save(); g.translate(x, y); g.scale(k * 1.35, k * 1.35); mapIcon(g, 0, 0, kind, 1.2); g.restore(); };
    for (const p of World.pois) ic(p.x, p.y, Profile.discovered.includes(p.id) ? 'poi' : 'unknown');
    for (const sp of World.parkSpots) if (!Profile.parks[sp.id]) ic(sp.x, sp.y, 'park');
    for (const r2 of World.races) ic(r2.start[0], r2.start[1], 'race');
    for (const s2 of World.shops) ic(s2.x, s2.y, shopIconKind(s2));
    if (z > 0.09) {
      g.font = `600 ${10 * k}px -apple-system, "Segoe UI", Arial`; g.textBaseline = 'alphabetic';
      for (const s2 of World.shops) if (s2.x > x0 && s2.x < x1 && s2.y > y0 && s2.y < y1) { g.lineWidth = 3 * k; g.strokeStyle = 'rgba(8,12,18,0.85)'; g.strokeText(s2.name, s2.x, s2.y - 12 * k); g.fillStyle = '#ffe2c4'; g.fillText(s2.name, s2.x, s2.y - 12 * k); }
      for (const p of World.pois) if (Profile.discovered.includes(p.id)) { g.lineWidth = 3 * k; g.strokeStyle = 'rgba(8,12,18,0.85)'; g.strokeText(p.name, p.x, p.y - 12 * k); g.fillStyle = '#ecd6ff'; g.fillText(p.name, p.x, p.y - 12 * k); }
    }
    // destino: alfinete vermelho
    if (Act.waypoint) {
      const w = Act.waypoint;
      g.save(); g.translate(w.x, w.y); g.scale(k, k);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(0, 1, 6, 2.5, 0, 0, TAU); g.fill();
      g.fillStyle = '#ff3b30'; g.strokeStyle = '#fff'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-11, -13, -11, -28, 0, -28); g.bezierCurveTo(11, -28, 11, -13, 0, 0); g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -19, 4, 0, TAU); g.fill();
      g.restore();
    }
    // você: ponto azul com cone de direção
    if (player) {
      const t = performance.now() / 1000;
      g.save(); g.translate(player.x, player.y); g.scale(k, k);
      g.fillStyle = 'rgba(47,139,255,0.18)'; g.beginPath(); g.arc(0, 0, 16 + Math.sin(t * 3) * 3, 0, TAU); g.fill();
      g.rotate(player.a);
      const cg = g.createRadialGradient(0, 0, 4, 0, 0, 34); cg.addColorStop(0, 'rgba(47,139,255,0.55)'); cg.addColorStop(1, 'rgba(47,139,255,0)');
      g.fillStyle = cg; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 34, -0.55, 0.55); g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 8.5, 0, TAU); g.fill();
      g.fillStyle = '#2f8bff'; g.beginPath(); g.arc(0, 0, 6, 0, TAU); g.fill();
      g.restore();
    }
    // escala
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const m = 100 * k * 0.09; // metros em 100 px
    const nice = [10, 20, 50, 100, 200, 500, 1000, 2000].find((v) => v >= m * 0.6) || 2000, px = nice / (k * 0.09);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(10, r.height - 24, px + 12, 16);
    g.fillStyle = '#fff'; g.fillRect(16, r.height - 13, px, 2);
    g.font = '600 10px -apple-system, "Segoe UI", Arial'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(nice >= 1000 ? nice / 1000 + ' km' : nice + ' m', 16, r.height - 15);
  }
}
function mapSetWaypoint(x, y, label) {
  if (Game.mode !== 'play') return;
  x = clamp(x, 0, WORLD_W); y = clamp(y, 0, WORLD_H);
  const ne = nearestEdge(x, y);
  const px = ne.e.h ? ne.e.a.x + ne.s : ne.e.a.x, py = ne.e.h ? ne.e.a.y : ne.e.a.y + ne.s;
  Act.waypoint = { x: px, y: py, label }; Act.gpsT = 0; Act.gps = player ? gpsRoute(player.x, player.y, px, py) : null;
  AudioSys.click(); renderMapDests(); drawBigMap();
}
const MAP_CTRLS = '<div class="map-ctrls"><button data-mz="in" title="Aproximar">+</button><button data-mz="out" title="Afastar">−</button><button data-mz="me" title="Centralizar em você"><svg viewBox="0 0 24 24"><path d="M20 4L4 11l7 2 2 7z" fill="currentColor"/></svg></button></div>';
function mapCtrl(v, k) { if (k === 'in') v.zoomBy(1.5); else if (k === 'out') v.zoomBy(1 / 1.5); else v.center(); AudioSys.tone(1100, 0.03, 'sine', 0.04, 'ui'); }
const MapState = { full: { cx: 0, cy: 0, z: 0, follow: true }, phone: { cx: 0, cy: 0, z: 0.055, follow: true } };
const bigCanvas = document.getElementById('bigmap');
let bigMap = null, phoneMap = null;
function drawBigMap() {
  if (!bigMap) bigMap = new MapView(bigCanvas, MapState.full);
  if (Screens.current === 'screen-map') bigMap.draw();
  if (phoneMap && Screens.current === 'screen-phone') phoneMap.draw();
}

/* ---------- velocímetro ---------- */
const spCanvas = document.getElementById('speedo'), spx = spCanvas.getContext('2d');
function drawSpeedo() {
  if (!player) return;
  const W = spCanvas.width, H = spCanvas.height, k = W / 220;
  spx.setTransform(1, 0, 0, 1, 0, 0); spx.clearRect(0, 0, W, H);
  spx.scale(k, k);
  const cx = 110, cy = 84, R = 72;
  const kmh = player.speed * 0.3;
  const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
  const maxK = 240;
  spx.lineCap = 'round';
  spx.strokeStyle = 'rgba(255,255,255,0.08)'; spx.lineWidth = 9;
  spx.beginPath(); spx.arc(cx, cy, R, a0, a1); spx.stroke();
  const f = clamp(kmh / maxK, 0, 1);
  const gr = spx.createLinearGradient(30, 0, 190, 0); gr.addColorStop(0, '#59e0ff'); gr.addColorStop(0.6, '#ffb547'); gr.addColorStop(1, '#ff5f7a');
  spx.strokeStyle = gr; spx.lineWidth = 9;
  if (f > 0.002) { spx.beginPath(); spx.arc(cx, cy, R, a0, a0 + (a1 - a0) * f); spx.stroke(); }
  spx.lineCap = 'butt';
  for (let v = 0; v <= maxK; v += 20) {
    const a = a0 + (a1 - a0) * v / maxK, big = v % 40 === 0;
    spx.strokeStyle = big ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)'; spx.lineWidth = big ? 2 : 1;
    spx.beginPath(); spx.moveTo(cx + Math.cos(a) * (R - 12), cy + Math.sin(a) * (R - 12)); spx.lineTo(cx + Math.cos(a) * (R - (big ? 20 : 16)), cy + Math.sin(a) * (R - (big ? 20 : 16))); spx.stroke();
  }
  const rf = clamp((player.rpm - 600) / 6400, 0, 1);
  spx.strokeStyle = rf > 0.85 ? '#ff5f7a' : 'rgba(255,255,255,0.45)'; spx.lineWidth = 3;
  spx.beginPath(); spx.arc(cx, cy, R - 30, a0 + 0.5, a0 + 0.5 + (a1 - a0 - 1) * rf); spx.stroke();
  spx.fillStyle = '#ffffff'; spx.textAlign = 'center'; spx.textBaseline = 'middle';
  spx.font = '800 40px "Segoe UI", Roboto, Arial, sans-serif'; spx.fillText(Math.round(kmh), cx, cy - 2);
  spx.font = '600 11px "Segoe UI", Arial'; spx.fillStyle = 'rgba(255,255,255,0.55)'; spx.fillText('km/h', cx, cy + 22);
  const gear = player.gear === -1 ? 'R' : player.speed < 4 && !Keys.KeyW && !Keys.ArrowUp ? 'N' : String(player.gear);
  spx.font = '800 18px "Segoe UI", Arial'; spx.fillStyle = gear === 'R' ? '#ff5f7a' : '#ffb547'; spx.fillText(gear, cx, cy + 40);
  spx.font = '600 9px "Segoe UI", Arial'; spx.fillStyle = 'rgba(255,255,255,0.4)'; spx.fillText('MARCHA', cx, cy + 54);
  if (player.highBeam) { spx.fillStyle = '#59e0ff'; spx.font = '700 10px Arial'; spx.fillText('FAROL ALTO', cx, 12); }
}
/* ============================ INTERFACE ============================ */
const $ = (id) => document.getElementById(id);
const UI = {
  last: {},
  set(id, v, prop) {
    const k = id + (prop || '');
    if (this.last[k] === v) return;
    this.last[k] = v;
    const el = $(id);
    if (!el) return;
    if (prop === 'width') el.style.width = v;
    else if (prop === 'bg') el.style.background = v;
    else if (prop === 'html') el.innerHTML = v;
    else el.textContent = v;
  },
  moneyDelta(v) {
    const el = $('money-delta');
    el.textContent = (v >= 0 ? '+ R$ ' : '− R$ ') + fmtMoney(Math.abs(v));
    el.className = 'show ' + (v >= 0 ? 'pos' : 'neg');
    clearTimeout(this._md);
    this._md = setTimeout(() => { el.className = ''; }, 1800);
  },
  bannerT: 0, region: null,
};
function toast(title, text, kind) {
  const box = $('toasts');
  const d = document.createElement('div');
  d.className = 'toast ' + (kind || '');
  const b = document.createElement('b'); b.textContent = title; d.appendChild(b);
  if (text) d.appendChild(document.createTextNode(text));
  box.appendChild(d);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 600); }, 4600);
}

/* ---------- pilha de telas ---------- */
const Screens = {
  current: null, stack: [],
  show(id) { $(id).classList.remove('hidden'); },
  hide(id) { $(id).classList.add('hidden'); },
  open(id) {
    if (this.current) { this.hide(this.current); this.stack.push(this.current); }
    this.show(id); this.current = id; this.onOpen(id);
    updateHudVisibility();
  },
  replace(id) { if (this.current) this.hide(this.current); this.show(id); this.current = id; this.onOpen(id); updateHudVisibility(); },
  back() {
    if (!this.current) return;
    if (this.current === 'screen-main') return;
    this.hide(this.current);
    const prev = this.stack.pop();
    if (prev) { this.show(prev); this.current = prev; this.onOpen(prev); }
    else this.current = null;
    AudioSys.back();
    updateHudVisibility();
  },
  closeAll() { if (this.current) this.hide(this.current); for (const s of this.stack) this.hide(s); this.stack.length = 0; this.current = null; updateHudVisibility(); },
  onOpen(id) {
    if (id === 'screen-settings') syncSettingsUI();
    if (id === 'screen-garage') Garage.render();
    if (id === 'screen-phone' && typeof Phone !== 'undefined') Phone.render();
    if (id === 'screen-map') { renderMapDests(); requestAnimationFrame(() => { if (!bigMap) bigMap = new MapView(bigCanvas, MapState.full); if (MapState.full.follow && player) { MapState.full.cx = player.x; MapState.full.cy = player.y; } drawBigMap(); }); }
    if (id === 'screen-pause') renderPauseStats();
    if (id === 'screen-main') $('btn-continue').disabled = !hasSave;
    if (id === 'screen-pause') $('btn-abandon').disabled = !(Act.race || Act.delivery || Act.waypoint);
  },
};
function updateHudVisibility() {
  const show = Game.mode === 'play' && (!Screens.current || Screens.current === 'screen-dialog');
  $('hud').classList.toggle('hidden', !show);
}

/* ---------- botões e menus ---------- */
function bindMenus() {
  document.querySelectorAll('.mbtn').forEach((b) => {
    b.addEventListener('mouseenter', () => AudioSys.hover());
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    AudioSys.init();
    const act = b.dataset.act;
    if (act !== 'back') AudioSys.click();
    switch (act) {
      case 'play': if (hasSave) confirmBox('Novo jogo', 'Começar do zero? Seu progresso salvo (dinheiro, carros e descobertas) será apagado.', () => newGame()); else newGame(); break;
      case 'continue': continueGame(); break;
      case 'garage': Garage.sel = Profile.current; Screens.open('screen-garage'); break;
      case 'settings': Screens.open('screen-settings'); break;
      case 'credits': Screens.open('screen-credits'); break;
      case 'back': Screens.back(); break;
      case 'resume': Screens.closeAll(); break;
      case 'abandon': abandonActivity(); Screens.closeAll(); break;
      case 'reset': resetVehicle(); Screens.closeAll(); break;
      case 'save-quit': saveGame(); toMenu(); break;
    }
  });
  $('confirm-no').addEventListener('click', () => { AudioSys.back(); Screens.back(); });
  $('confirm-yes').addEventListener('click', () => { AudioSys.click(); const fn = confirmBox.fn; Screens.back(); if (fn) fn(); });
  $('map-back').addEventListener('click', () => Screens.back());
  $('map-ctrls-full').addEventListener('click', (e) => { const b = e.target.closest('[data-mz]'); if (b && bigMap) mapCtrl(bigMap, b.dataset.mz); });
  window.addEventListener('resize', () => { resize(); drawBigMap(); });
}
function confirmBox(title, text, fn) {
  $('confirm-title').textContent = title; $('confirm-text').textContent = text;
  confirmBox.fn = fn;
  Screens.open('screen-confirm');
}

/* ---------- configurações ---------- */
function syncSettingsUI() {
  document.querySelectorAll('[data-set]').forEach((inp) => {
    const k = inp.dataset.set;
    inp.value = Settings[k];
    inp.nextElementSibling.textContent = k === 'zoom' ? Settings[k] + '%' : Settings[k];
  });
  document.querySelectorAll('[data-seg]').forEach((seg) => {
    const k = seg.dataset.seg;
    seg.querySelectorAll('button').forEach((b) => b.classList.toggle('on', String(Settings[k]) === b.dataset.v));
  });
}
function bindSettings() {
  document.querySelectorAll('[data-set]').forEach((inp) => {
    inp.addEventListener('input', () => {
      const k = inp.dataset.set;
      Settings[k] = Number(inp.value);
      inp.nextElementSibling.textContent = k === 'zoom' ? Settings[k] + '%' : Settings[k];
      AudioSys.applyVolumes();
      saveSettings();
    });
    inp.addEventListener('change', () => { if (inp.dataset.set === 'ui') AudioSys.click(); });
  });
  document.querySelectorAll('[data-seg]').forEach((seg) => {
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const k = seg.dataset.seg;
      const v = b.dataset.v;
      Settings[k] = v === 'true' ? true : v === 'false' ? false : v;
      AudioSys.click();
      if (k === 'quality') { resize(); clearChunks(); forceGround = true; Particles.list.length = 0; }
      if (k === 'showFps') $('fps').classList.toggle('hidden', !Settings.showFps);
      saveSettings(); syncSettingsUI();
    });
  });
}

/* ---------- garagem ---------- */
const Garage = {
  sel: 'pampeiro', previewColor: null, t: 0,
  render() {
    const sel = carById(this.sel);
    const owned = !!Profile.owned[sel.id];
    $('garage-money').textContent = fmtMoney(Profile.money);
    const list = $('garage-list');
    list.innerHTML = '';
    for (const c of CARS) {
      const d = document.createElement('div');
      d.className = 'gcard' + (c.id === this.sel ? ' sel' : '');
      const st = Profile.current === c.id ? '<span class="cur">Em uso</span>' : Profile.owned[c.id] ? '<span class="own">Na garagem</span>' : 'R$ ' + fmtMoney(c.price);
      d.innerHTML = `<div class="gname"><small class="gbrand" style="color:${brandOf(c.model).color}">${escapeHtml(brandOf(c.model).name)}</small>${c.name}</div><div class="gsub"><span>${{ gas: 'Trabalho · gás', guincho: 'Trabalho · guincho', cacamba: 'Trabalho · caçamba', bau: 'Trabalho · baú', tanker: 'Trabalho · tanque', quadrado: 'Hatch quadrado', besouro: 'Clássico a ar', escada: 'Hatch caixote', hatch: 'Hatch', van: 'Furgão', pickup: 'Picape · trabalho', sedan: 'Sedã', santana: 'Sedã quadrado', sport: 'Esportivo', muscle: 'Clássico' }[c.model]}</span>${st}</div>`;
      d.addEventListener('click', () => { this.sel = c.id; this.previewColor = null; AudioSys.click(); this.render(); });
      d.addEventListener('mouseenter', () => AudioSys.hover());
      list.appendChild(d);
    }
    const br = brandOf(sel.model);
    $('garage-car-title').innerHTML = `<span class="brand-badge" style="--bc:${br.color}">${escapeHtml(br.name)}</span>${escapeHtml(sel.name)}`;
    $('garage-car-desc').textContent = '"' + br.slogan + '" ' + sel.desc;
    // estatísticas
    const base = { max: sel.max, acc: sel.acc, brk: sel.brk, steer: sel.steer * sel.grip };
    const cur = owned ? carStats(sel.id) : { max: sel.max, acc: sel.acc, brk: sel.brk, grip: sel.grip, steer: sel.steer };
    const rows = [['Velocidade máx.', base.max, cur.max, 720, Math.round(cur.max * 0.3) + ' km/h'], ['Aceleração', base.acc, cur.acc, 230], ['Frenagem', base.brk, cur.brk, 520], ['Direção', base.steer, cur.steer * cur.grip, 1.45]];
    $('garage-stats').innerHTML = rows.map(([n, b, c, mx, lab]) => {
      const pb = clamp(b / mx, 0, 1) * 100, pc = clamp(c / mx, 0, 1) * 100;
      return `<div class="stat"><div class="st-top"><span>${n}</span><span>${lab || Math.round(pc)}</span></div><div class="st-bar"><i class="up" style="width:${pc}%"></i><i style="width:${pb}%"></i></div></div>`;
    }).join('');
    // cores
    const cfg = owned ? carCfg(sel.id) : null;
    const curColor = this.previewColor || (cfg ? cfg.color : PALETTE[CARS.indexOf(sel) % PALETTE.length]);
    const sw = $('garage-colors'); sw.innerHTML = '';
    for (const col of PALETTE) {
      const d = document.createElement('div');
      d.className = 'sw' + (col === curColor ? ' on' : '');
      d.style.background = col;
      d.title = owned ? 'Pintar (R$ 150)' : 'Ver cor';
      d.addEventListener('click', () => this.paint(col));
      sw.appendChild(d);
    }
    // melhorias
    const up = $('garage-upgrades'); up.innerHTML = '';
    for (const u of UPGRADES) {
      const lvl = owned ? cfg.up[u.id] : 0;
      const row = document.createElement('div'); row.className = 'upg';
      const cost = lvl < 3 ? upgradeCost(sel.id, u.id, lvl) : 0;
      row.innerHTML = `<div class="un">${u.name}<small>${u.desc}</small></div><div class="pips">${[0, 1, 2].map((i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div>`;
      const b = document.createElement('button');
      b.textContent = !owned ? '—' : lvl >= 3 ? 'MÁX' : 'R$ ' + fmtMoney(cost);
      b.disabled = !owned || lvl >= 3 || Profile.money < cost;
      b.addEventListener('click', () => this.upgrade(u.id));
      row.appendChild(b); up.appendChild(row);
    }
    if (!owned) { const n = document.createElement('div'); n.className = 'garage-note'; n.textContent = 'Compre o veículo para instalar melhorias e pintar.'; up.appendChild(n); }
    // botão principal
    const mb = $('garage-main-btn');
    if (!owned) { mb.textContent = 'COMPRAR — R$ ' + fmtMoney(sel.price); mb.disabled = Profile.money < sel.price; }
    else if (Profile.current === sel.id) { mb.textContent = 'EM USO'; mb.disabled = true; }
    else { mb.textContent = 'USAR ESTE CARRO'; mb.disabled = false; }
  },
  main() {
    const sel = carById(this.sel);
    const prev = Profile.current;
    if (!Profile.owned[sel.id]) {
      if (Profile.money < sel.price) { AudioSys.error(); return; }
      Profile.money -= sel.price;
      Profile.owned[sel.id] = true;
      const cfg = carCfg(sel.id);
      if (this.previewColor) cfg.color = this.previewColor;
      this.previewColor = null;
      AudioSys.money();
      toast('Novo veículo!', sel.name + ' agora é seu.', 'good');
      if (sel.job) addMsg('Central de Fretes', 'Bem-vindo à frota', 'Recebemos o cadastro do seu ' + sel.name + '. Abra o app Fretes no celular (Q) para ver as cargas disponíveis perto de você. Quanto mais longe, mais paga. Cuidado com carga frágil e perigosa.');
      UI.moneyDelta(-sel.price);
    }
    // cada carro guarda o próprio estado: trocar de carro não leva o amassado junto
    if (prev !== sel.id) { stashCondition(prev); Profile.current = sel.id; loadCondition(sel.id); }
    if (player) { player.setCar(sel.id); }
    AudioSys.click();
    saveGame();
    this.render();
  },
  paint(col) {
    const sel = carById(this.sel);
    if (!Profile.owned[sel.id]) { this.previewColor = col; AudioSys.click(); this.render(); return; }
    const cfg = carCfg(sel.id);
    if (cfg.color === col) return;
    if (Profile.money < 150) { AudioSys.error(); toast('Dinheiro insuficiente', 'A pintura custa R$ 150.', 'bad'); return; }
    Profile.money -= 150; cfg.color = col; UI.moneyDelta(-150);
    AudioSys.wash();
    if (player && player.car.id === sel.id) player.recalc();
    saveGame(); this.render();
  },
  upgrade(id) {
    const sel = carById(this.sel), cfg = carCfg(sel.id), lvl = cfg.up[id];
    if (lvl >= 3) return;
    const cost = upgradeCost(sel.id, id, lvl);
    if (Profile.money < cost) { AudioSys.error(); return; }
    Profile.money -= cost; cfg.up[id] = lvl + 1; UI.moneyDelta(-cost);
    AudioSys.wrench();
    // a melhoria passa pela oficina: o carro volta novinho
    if (sel.id === Profile.current) { const had = Profile.damage > 1; Profile.damage = 0; Profile.zones = { f: 0, r: 0, l: 0, rt: 0, seed: ((Profile.zones && Profile.zones.seed) || 0) + 1 }; if (had) toast('Seu Zé', '"Aproveitei a melhoria e desamassei tudo. Tá novinho!"', 'good'); }
    else cfg.cond = null;
    if (player && player.car.id === sel.id) player.recalc();
    saveGame(); this.render();
  },
};
function stashCondition(id) { if (!id) return; carCfg(id).cond = { damage: Profile.damage || 0, zones: Profile.zones ? Object.assign({}, Profile.zones) : null, dirt: Profile.dirt || 0 }; }
function loadCondition(id) {
  const c = carCfg(id).cond, seed = ((Profile.zones && Profile.zones.seed) || 0) + 1;
  Profile.damage = c ? c.damage : 0; Profile.dirt = c ? c.dirt : 0;
  Profile.zones = Object.assign({ f: 0, r: 0, l: 0, rt: 0 }, c && c.zones ? c.zones : {}); Profile.zones.seed = seed;
}
const gpCanvas = document.getElementById('garage-preview'), gpx = gpCanvas.getContext('2d');
function drawGaragePreview(dt) {
  Garage.t += dt;
  const W = gpCanvas.width, H = gpCanvas.height;
  gpx.setTransform(1, 0, 0, 1, 0, 0);
  const bgr = gpx.createRadialGradient(W / 2, H * 0.55, 20, W / 2, H * 0.55, W * 0.6);
  bgr.addColorStop(0, '#2a2620'); bgr.addColorStop(0.5, '#141210'); bgr.addColorStop(1, '#060606');
  gpx.fillStyle = bgr; gpx.fillRect(0, 0, W, H);
  gpx.strokeStyle = 'rgba(255,255,255,0.04)'; gpx.lineWidth = 2;
  for (let x = -H; x < W; x += 60) { gpx.beginPath(); gpx.moveTo(x, H); gpx.lineTo(x + H, 0); gpx.stroke(); }
  gpx.strokeStyle = 'rgba(255,200,80,0.35)'; gpx.lineWidth = 3; gpx.setLineDash([22, 16]);
  gpx.beginPath(); gpx.ellipse(W / 2, H * 0.55, 250, 150, 0, 0, TAU); gpx.stroke(); gpx.setLineDash([]);
  const sel = carById(Garage.sel);
  const owned = !!Profile.owned[sel.id];
  const col = Garage.previewColor || (owned ? carCfg(sel.id).color : PALETTE[CARS.indexOf(sel) % PALETTE.length]);
  const m = VMODELS[sel.model];
  const sc = 340 / Math.max(m.L, 50) * 1.15;
  gpx.save();
  gpx.translate(W / 2, H * 0.55); gpx.scale(sc, sc);
  const a = Garage.t * 0.45;
  gpx.globalCompositeOperation = 'lighter';
  gpx.save(); gpx.rotate(a); gpx.globalAlpha = 0.18; gpx.drawImage(CONE, m.L / 2 - 2, -40, 160, 80); gpx.restore();
  gpx.globalCompositeOperation = 'source-over'; gpx.globalAlpha = 1;
  drawVehicle(gpx, m, col, 0, 0, a, { steer: Math.sin(Garage.t * 0.9) * 0.3, roll: Garage.t * 10, dirt: 0, noSq: true, noLift: true });
  gpx.globalCompositeOperation = 'lighter';
  const ca = Math.cos(a), sa = Math.sin(a), hl = m.L / 2, hw = m.W / 2 - 4;
  for (const s of [1, -1]) {
    gpx.globalAlpha = 0.9; gpx.drawImage(glowSprite('#fff1cf'), ca * hl - sa * hw * s - 5, sa * hl + ca * hw * s - 5, 10, 10);
    gpx.globalAlpha = 0.7; gpx.drawImage(glowSprite('#ff2a1e'), -ca * hl - sa * hw * s - 4, -sa * hl + ca * hw * s - 4, 8, 8);
  }
  gpx.restore();
  gpx.globalCompositeOperation = 'source-over'; gpx.globalAlpha = 1;
  const vg = gpx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.65);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.65)');
  gpx.fillStyle = vg; gpx.fillRect(0, 0, W, H);
}

/* ---------- diálogos dos estabelecimentos ---------- */
function openShopDialog(s) {
  if (s.kind === 'garagem') { Garage.sel = Profile.current; Screens.open('screen-garage'); AudioSys.click(); return; }
  visitShop(s);
  const KIND = { batalhao: 'SEGURANÇA PÚBLICA', paneleiras: 'ARTESANATO CAPIXABA', posto: 'POSTO DE COMBUSTÍVEL', oficina: 'OFICINA MECÂNICA', moquecaria: 'MOQUECARIA', farmacia: 'FARMÁCIA', padaria: 'PADARIA', mercado: 'MERCADO', lanchonete: 'LANCHONETE', bar: 'BAR', floricultura: 'FLORICULTURA', hotel: 'HOTEL', churrascaria: 'CHURRASCARIA', borracharia: 'BORRACHARIA', sitio: 'SÍTIO', fazenda: 'FAZENDA' };
  $('dialog-kind').textContent = KIND[s.kind] || 'ESTABELECIMENTO';
  $('dialog-title').textContent = s.name;
  $('dialog-text').textContent = SHOP_TEXT[s.kind] || '';
  $('dialog-portrait').classList.toggle('hidden', s.kind !== 'oficina');
  if (s.kind === 'oficina') {
    drawSeuZe($('dialog-portrait'));
    const Zs = Profile.zones || {}, zl = zoneList(Profile.zones);
    const dm = Math.max(Profile.damage, Math.max(Zs.f || 0, Zs.r || 0, Zs.l || 0, Zs.rt || 0) * 70);
    const fala = dm < 3 ? '"Tá zerado, meu filho. Volta quando bater, que eu sei que vai."'
      : dm < 25 ? '"Uns arranhãozinho à toa. Isso eu resolvo enquanto o café passa."'
      : dm < 60 ? '"Rapaz… que pancada foi essa? Beijou o poste, foi? Deixa com o Seu Zé."'
      : '"Nossa Senhora da Penha! Isso aqui tá pocado, menino! Quarenta anos de oficina e nunca vi um estrago desse."';
    $('dialog-text').textContent = 'Seu Zé limpa as mãos na estopa e olha o carro por cima dos óculos. ' + fala + (zl.length ? ' Orçamento: ' + zl.join(', ') + '.' : '');
  }
  const btns = [];
  const B = (label, fn, disabled) => btns.push({ label, fn, disabled });
  if (s.kind === 'posto') {
    const need = Math.max(0, 100 - Profile.fuel), price = 1.8;
    const cost = Math.ceil(need * price);
    const afford = Math.min(need, Profile.money / price);
    B(need < 1 ? 'Tanque cheio' : Profile.money >= cost ? `Encher o tanque — R$ ${fmtMoney(cost)}` : `Abastecer o que der — R$ ${fmtMoney(Math.floor(afford * price))}`, () => {
      const add = Math.min(need, Profile.money / price);
      const c = Math.ceil(add * price);
      Profile.fuel = Math.min(100, Profile.fuel + add); Profile.money -= c; UI.moneyDelta(-c); AudioSys.pump();
      toast('Tanque abastecido', Math.round(Profile.fuel) + '% de combustível', 'good');
      saveGame(); openShopDialog(s);
    }, need < 1 || Profile.money < price);
    if (s.wash) B(Profile.dirt < 0.05 ? 'Carro já está limpo' : 'Lavar o carro — R$ 30', () => { Profile.dirt = 0; Profile.money -= 30; UI.moneyDelta(-30); AudioSys.wash(); toast('Lava-jato', 'Brilhando como novo.', 'good'); saveGame(); openShopDialog(s); }, Profile.dirt < 0.05 || Profile.money < 30);
    B('Tomar um café na conveniência — R$ 4', () => { Profile.money -= 4; UI.moneyDelta(-4); toast('Café passado', 'Quentinho. Bora rodar mais um pouco.', 'info'); closeDialog(); }, Profile.money < 4);
  }
  if (s.kind === 'oficina') {
    const cost = Math.ceil(Profile.damage * 4);
    B(Profile.damage < 1 ? 'Carro em perfeito estado' : `Consertar o carro — R$ ${fmtMoney(cost)}`, () => {
      const fix = Math.min(Profile.damage, Profile.money / 4);
      const c = Math.ceil(fix * 4);
      const before = Profile.damage;
      Profile.damage -= fix; Profile.money -= c; UI.moneyDelta(-c); AudioSys.wrench();
      if (Profile.zones) { const f = before > 0 && Profile.damage >= 1 ? Profile.damage / before : 0; for (const z of ['f', 'r', 'l', 'rt', 'fL', 'fR']) Profile.zones[z] = (Profile.zones[z] || 0) * f; Profile.zones.seed = (Profile.zones.seed || 0) + 1; }
      if (Profile.damage < 1) Profile.damage = 0;
      toast('Seu Zé', Profile.damage < 1 ? '"Pronto! Tá novinho em folha. Vai com Deus e devagar."' : '"Fiz o que deu com o seu dinheiro, viu?"', 'good');
      saveGame(); openShopDialog(s);
    }, Profile.damage < 1 || Profile.money < 4);
    B('Melhorias e pintura', () => { Garage.sel = Profile.current; Screens.replace('screen-garage'); });
  }
  if (s.kind === 'borracharia') B('Calibrar os pneus (grátis)', () => { Profile.damage = Math.max(0, Profile.damage - 3); AudioSys.pump(); toast('Borracharia', 'Pneus calibrados. Valeu, chefe!', 'info'); closeDialog(); });
  if (s.kind === 'bar') B('Pedir um guaraná — R$ 6', () => { Profile.money -= 6; UI.moneyDelta(-6); toast('Boteco Saideira do Toninho', 'Guaraná trincando de gelado.', 'info'); closeDialog(); }, Profile.money < 6);
  if (s.kind === 'lanchonete') B('Comer um pastel — R$ 8', () => { Profile.money -= 8; UI.moneyDelta(-8); toast('Lanchonete X-Tudo do Bigode', 'Pastel de carne com caldo de cana. Perfeito.', 'info'); closeDialog(); }, Profile.money < 8);
  if (s.kind === 'hotel') B('Pedir uma dica de passeio ao porteiro', () => {
    const left = World.pois.filter((p) => !Profile.discovered.includes(p.id));
    if (!left.length) { toast('Porteiro', '"Você já conhece tudo por aqui!"', 'info'); closeDialog(); return; }
    let best = left[0], bd = Infinity;
    for (const p of left) { const d = Math.hypot(p.x - player.x, p.y - player.y); if (d < bd) { bd = d; best = p; } }
    Act.waypoint = { x: best.x, y: best.y }; Act.gpsT = 0;
    toast('Dica do porteiro', '"Já foi conhecer ' + best.name + '? Marquei no seu GPS."', 'info');
    closeDialog();
  });
  if (s.pickup) {
    if (Act.race) B('Termine o percurso antes de pegar entregas', null, true);
    else if (Act.delivery) B('Você já está com uma entrega em andamento', null, true);
    else {
      const off = deliveryOffer(s);
      const tags = (off.fragile ? ' · frágil' : '') + (off.hot ? ' · urgente' : '');
      B(`Entregar ${off.item} → ${off.dest.name} · R$ ${fmtMoney(off.reward)}${tags}`, () => { startDelivery(off); closeDialog(); });
    }
  }
  B('Sair', () => closeDialog());
  const box = $('dialog-buttons'); box.innerHTML = '';
  for (const b of btns) {
    const el = document.createElement('button');
    el.className = 'mbtn'; el.textContent = b.label; el.disabled = !!b.disabled;
    el.addEventListener('mouseenter', () => AudioSys.hover());
    el.addEventListener('click', () => { if (b.fn) { AudioSys.click(); b.fn(); } });
    box.appendChild(el);
  }
  if (Screens.current === 'screen-dialog') Screens.onOpen('screen-dialog'); else Screens.open('screen-dialog');
}
function drawSeuZe(cv) {
  const g = cv.getContext('2d'), W = cv.width, H = cv.height;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3a3f4a'); bg.addColorStop(1, '#1a1d24');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 6; i++) g.fillRect(14 + i * 38, 20, 22, 60);
  g.translate(W / 2, H / 2 + 10);
  g.fillStyle = '#2a4a8a'; g.beginPath(); g.moveTo(-80, 110); g.quadraticCurveTo(-78, 30, 0, 28); g.quadraticCurveTo(78, 30, 80, 110); g.fill();
  g.fillStyle = '#1e3a70'; g.fillRect(-30, 40, 12, 70); g.fillRect(18, 40, 12, 70);
  g.fillStyle = '#f2f2ea'; g.fillRect(-12, 60, 24, 14); g.fillStyle = '#c8302a'; g.font = 'bold 12px Arial'; g.textAlign = 'center'; g.fillText('ZÉ', 0, 71);
  g.fillStyle = '#d9a066'; g.fillRect(-12, 10, 24, 22);
  g.fillStyle = '#e0ac69'; g.beginPath(); g.ellipse(0, -18, 34, 40, 0, 0, TAU); g.fill();
  g.fillStyle = '#d29a5c'; g.beginPath(); g.ellipse(-34, -16, 7, 11, 0, 0, TAU); g.ellipse(34, -16, 7, 11, 0, 0, TAU); g.fill();
  g.fillStyle = '#ededE6'; g.beginPath(); g.ellipse(-30, -30, 9, 16, 0.2, 0, TAU); g.ellipse(30, -30, 9, 16, -0.2, 0, TAU); g.fill();
  g.fillStyle = '#c8302a'; g.beginPath(); g.ellipse(0, -52, 36, 15, 0, Math.PI, TAU); g.fill(); g.fillRect(-36, -54, 72, 6); g.fillRect(-4, -56, 46, 6);
  g.fillStyle = '#f2f2ea'; g.font = 'bold 9px Arial'; g.fillText('OFICINA', 0, -58);
  g.strokeStyle = '#a0784a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-18, -30); g.lineTo(-6, -28); g.moveTo(6, -28); g.lineTo(18, -30); g.stroke();
  g.strokeStyle = '#2a2a2a'; g.lineWidth = 2; g.beginPath(); g.arc(-12, -18, 8, 0, TAU); g.moveTo(20, -18); g.arc(12, -18, 8, 0, TAU); g.moveTo(-4, -18); g.lineTo(4, -18); g.stroke();
  g.fillStyle = '#1a1410'; g.beginPath(); g.arc(-12, -18, 2.2, 0, TAU); g.arc(12, -18, 2.2, 0, TAU); g.fill();
  g.fillStyle = '#c98a55'; g.beginPath(); g.ellipse(0, -6, 5, 8, 0, 0, TAU); g.fill();
  g.fillStyle = '#f0f0ea'; g.beginPath(); g.moveTo(-22, 6); g.quadraticCurveTo(0, -6, 22, 6); g.quadraticCurveTo(10, 14, 0, 6); g.quadraticCurveTo(-10, 14, -22, 6); g.fill();
  g.strokeStyle = 'rgba(120,70,40,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-24, -40 + 6); g.quadraticCurveTo(-18, -44, -10, -42); g.moveTo(10, -42); g.quadraticCurveTo(18, -44, 24, -34); g.stroke();
  g.fillStyle = '#1a1a1a'; g.globalAlpha = 0.35; g.beginPath(); g.ellipse(24, 30, 10, 4, 0.3, 0, TAU); g.fill(); g.globalAlpha = 1;
}
function renderMapDests() {
  for (const id of ['map-dests', 'ph-map-dests']) { const box = $(id); if (box) box.innerHTML = ''; }
  if (Game.mode !== 'play' || !player) return;
  const near = (kind) => { let b = null, bd = Infinity; for (const s of World.shops) if (s.kind === kind) { const d = Math.hypot(s.x - player.x, s.y - player.y); if (d < bd) { bd = d; b = s; } } return b; };
  const opts = [];
  if (World.home) opts.push(['Minha garagem', World.home.x, World.home.y]);
  const posto = near('posto'); if (posto) opts.push(['Posto mais próximo', posto.x, posto.y]);
  const of = near('oficina'); if (of) opts.push(['Oficina do Seu Zé', of.x, of.y]);
  const mq = near('moquecaria'); if (mq) opts.push(['Moquecaria', mq.x, mq.y]);
  let poi = null, pd = Infinity; for (const p of World.pois) if (!Profile.discovered.includes(p.id)) { const d = Math.hypot(p.x - player.x, p.y - player.y); if (d < pd) { pd = d; poi = p; } }
  if (poi) opts.push(['Ponto "?" mais perto', poi.x, poi.y]);
  let rc = null, rd = Infinity; for (const r of World.races) { const d = Math.hypot(r.start[0] - player.x, r.start[1] - player.y); if (d < rd) { rd = d; rc = r; } }
  if (rc) opts.push(['Percurso: ' + rc.name, rc.start[0], rc.start[1]]);
  for (const id of ['map-dests', 'ph-map-dests']) {
    const box = $(id); if (!box) continue;
    const now = document.createElement('div'); now.className = 'dest-now';
    now.textContent = Act.waypoint ? 'Destino: ' + (Act.waypoint.label || 'ponto marcado no mapa') + (Act.gps ? ' · ' + (Act.gps.len * 0.09 / 1000).toFixed(2).replace('.', ',') + ' km' : '') : 'Toque no mapa ou escolha um destino:';
    box.appendChild(now);
    for (const [label, x, y] of opts) { const b = document.createElement('button'); b.textContent = label; b.addEventListener('click', () => mapSetWaypoint(x, y, label)); box.appendChild(b); }
    if (Act.waypoint) { const b = document.createElement('button'); b.className = 'off'; b.textContent = 'Remover destino'; b.addEventListener('click', () => { Act.waypoint = null; Act.gps = null; AudioSys.back(); renderMapDests(); drawBigMap(); }); box.appendChild(b); }
  }
}
function closeDialog() { if (Screens.current === 'screen-dialog') Screens.closeAll(); }

/* ---------- estatísticas da pausa ---------- */
function renderPauseStats() {
  const medals = Object.values(Profile.races).filter((r) => r.medal === 3).length;
  const rows = [
    ['Dinheiro', 'R$ ' + fmtMoney(Profile.money)], ['Total ganho', 'R$ ' + fmtMoney(Profile.earned)],
    ['Entregas', Profile.deliveries], ['Distância', (Profile.distance * 0.09 / 1000).toFixed(1) + ' km'],
    ['Pontos de interesse', Profile.discovered.length + '/' + World.pois.length], ['Caderneta', Profile.visited.length + '/' + World.shops.filter((x) => x.kind !== 'garagem').length],
    ['Medalhas de ouro', medals + '/' + World.races.length], ['Carros', Object.keys(Profile.owned).length + '/' + CARS.length],
  ];
  $('pause-stats').innerHTML = rows.map(([a, b]) => `<div>${a} <b>${b}</b></div>`).join('');
}

/* ---------- HUD ---------- */
function clockStr() { const t = Math.floor(Profile.time) % 1440; const h = Math.floor(t / 60), m = t % 60; return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
function updateHUD(dt) {
  if (Game.mode !== 'play' || !player) return;
  const rk = regionKeyAt(player.x, player.y);
  if (rk !== UI.region) {
    UI.region = rk;
    UI.set('region-name', REGIONS[rk].name);
    const bn = $('region-banner'); bn.textContent = REGIONS[rk].name; bn.classList.add('show');
    clearTimeout(UI._bn); UI._bn = setTimeout(() => bn.classList.remove('show'), 2600);
  }
  { const rush = trafficRush().label; UI.set('clock', clockStr() + (rush ? ' · ' + rush : '')); if (rush !== UI.rush) { if (UI.rush !== undefined && rush === 'horário de pico') toast('Horário de pico', 'As ruas de São Gambiarra estão cheias. Paciência no trânsito!', 'info'); UI.rush = rush; } }
  UI.set('money-value', fmtMoney(Profile.money));
  // objetivo
  let title, desc = '', meta = '', cls = '';
  if (Act.race && Act.race.racha) {
    const R = Act.race; cls = 'race';
    title = 'Racha: ' + R.r.name; desc = R.count > 0 ? 'Prepare-se… contra ' + R.r.rival : 'Corre! ' + R.r.rival + ' tá do seu lado. Cuidado com viatura.';
    meta = 'Aposta R$ ' + fmtMoney(R.r.bet) + ' · tempo dele ' + fmtTime(R.r.rivalTime);
  } else if (Act.race) {
    const R = Act.race;
    title = 'Percurso: ' + R.r.name; cls = 'race';
    desc = R.count > 0 ? 'Prepare-se…' : 'Checkpoint ' + (R.idx + 1) + ' de ' + R.r.pts.length;
    meta = 'Ouro ' + fmtTime(R.r.gold) + ' · Prata ' + fmtTime(R.r.silver) + ' · Bronze ' + fmtTime(R.r.bronze);
  } else if (Act.delivery && Act.delivery.stage === 'pickup') {
    const d = Act.delivery; cls = 'active';
    title = d.jobName + ': ' + d.item; desc = 'Buscar em ' + d.pick.name;
    meta = Math.round((Act.gps ? Act.gps.len : 0) * 0.09) + ' m · R$ ' + fmtMoney(d.reward);
  } else if (Act.ride) {
    const R = Act.ride; cls = 'active';
    title = 'PegaAí: ' + R.name; desc = R.stage === 'pickup' ? 'Buscar em ' + R.pick.name : 'Levar até ' + R.dest.name;
    meta = Math.round((Act.gps ? Act.gps.len : 0) * 0.09) + ' m · R$ ' + R.fare;
  } else if (Act.delivery) {
    const d = Act.delivery; cls = 'active';
    title = 'Entrega: ' + d.item;
    desc = 'Destino: ' + d.dest.name + (d.fragile ? ' · carga frágil' : '');
    const dist = Act.gps ? Act.gps.len : Math.hypot(d.dest.x - player.x, d.dest.y - player.y);
    const left = d.par - d.t;
    meta = Math.round(dist * 0.09) + ' m · ' + (left > 0 ? 'prazo ' + fmtTime(left).replace(/\.\d$/, '') : 'atrasado') + ' · R$ ' + fmtMoney(d.reward);
  } else if (Act.waypoint) {
    title = 'Destino no GPS'; desc = 'Siga as setas verdes no chão.';
    meta = Math.round((Act.gps ? Act.gps.len : 0) * 0.09) + ' m';
  } else { const h = freeRoamHint(); title = h[0]; desc = h[1]; }
  UI.set('obj-title', title); UI.set('obj-desc', desc); UI.set('obj-meta', meta);
  if (UI.last.objcls !== cls) { UI.last.objcls = cls; $('hud-objective').className = 'glass ' + cls; }
  // veículo
  UI.set('car-name', carFullName(player.car));
  UI.set('fuel-bar', Math.round(Profile.fuel) + '%', 'width');
  UI.set('fuel-bar', Profile.fuel < 20 ? 'linear-gradient(90deg,#ff5a5a,#ff8a7a)' : '', 'bg');
  UI.set('cond-bar', Math.round(100 - Profile.damage) + '%', 'width');
  UI.set('cond-bar', Profile.damage > 60 ? 'linear-gradient(90deg,#ff8a3d,#ffb547)' : '', 'bg');
  // prompt
  const pr = Act.prompt && !Screens.current ? '<kbd>E</kbd>' + escapeHtml(Act.prompt.text) : '';
  if (UI.last.prompt !== pr) { UI.last.prompt = pr; const el = $('prompt'); el.innerHTML = pr; el.classList.toggle('hidden', !pr); }
  // percurso
  const rt = Act.race && Act.race.count <= 0 ? fmtTime(Act.race.t) : '';
  UI.set('race-timer', rt); $('race-timer').classList.toggle('hidden', !rt);
  const cd = Act.race && Act.race.count > 0 ? String(Math.ceil(Act.race.count)) : Act.race && Act.race.t < 0.8 ? 'VAI!' : '';
  if (UI.last.cd !== cd) { UI.last.cd = cd; const el = $('countdown'); el.textContent = cd; el.classList.toggle('hidden', !cd); }
  { const un = (Profile.msgs || []).some((m) => !m.read); if (UI.last.badge !== un) { UI.last.badge = un; $('hud-phone-badge').classList.toggle('hidden', !un); } }
  drawMinimap();
  drawSpeedo();
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
/* ============================ JOGO / LOOP PRINCIPAL ============================ */
const Game = {
  mode: 'menu', time: 0, autosaveT: 30, fpsT: 0, fpsN: 0,
  get state() { return this.mode === 'menu' ? 'menu' : (Screens.current ? 'paused' : 'playing'); },
};
const NIGHT_START = 19 * 60 + 30, NIGHT_END = 29 * 60;

function startPlay() {
  AudioSys.init();
  Act.reset();
  player = new Player(Profile.current);
  let pos = World.home;
  const sp = Profile.pos;
  if (sp && isFinite(sp.x) && isFinite(sp.y) && sp.x > 60 && sp.y > 60 && sp.x < WORLD_W - 60 && sp.y < WORLD_H - 60 && groundAt(sp.x, sp.y) !== SF.WATER) pos = sp;
  player.place(pos.x, pos.y, pos.a || 0);
  if (player.collide() > 0 || player.inWater()) { player.place(World.home.x, World.home.y, 0); }
  Game.mode = 'play';
  Screens.closeAll();
  Cam.x = player.x; Cam.y = player.y; Cam.zoom = screenZoomBase() * Settings.zoom / 100;
  forceGround = true;
  Traffic.fill(player.x, player.y);
  UI.region = null; UI.last = {};
  Game.autosaveT = 30;
  updateHudVisibility();
}
function newGame() {
  Profile = newProfile();
  startPlay();
  saveGame();
  setTimeout(() => toast('Bem-vindo a São Gambiarra, ES', 'A noite é sua. Explore à vontade — pare nos comércios e aperte E para pegar entregas.', 'info'), 600);
  setTimeout(() => toast('Dica', 'W/S aceleram e freiam, A/D viram, Espaço é o freio de mão. M abre o mapa.', 'info'), 4200);
}
function continueGame() {
  const p = loadProfileFromStorage();
  if (!p) { AudioSys.error(); return; }
  Profile = p;
  startPlay();
  setTimeout(() => toast('Bem-vindo de volta', 'R$ ' + fmtMoney(Profile.money) + ' na carteira · ' + carById(Profile.current).name, 'info'), 500);
}
function saveGame() {
  if (player && Game.mode === 'play') Profile.pos = { x: player.x, y: player.y, a: player.a };
  writeProfile();
}
function toMenu() {
  Game.mode = 'menu';
  player = null;
  Act.reset();
  Screens.closeAll();
  Screens.open('screen-main');
  AudioSys.hornOn = false;
}
function resetVehicle() {
  if (!player) return;
  const ne = nearestEdge(player.x, player.y);
  const e = ne.e;
  const s = clamp(ne.s, e.clearA + 10, Math.max(e.clearA + 10, e.len - e.clearB - 10));
  const off = e.T.lanes[e.T.lanes.length - 1];
  const x = e.a.x + e.dx * s - e.dy * off, y = e.a.y + e.dy * s + e.dx * off;
  player.place(x, y, Math.atan2(e.dy, e.dx));
  Cam.x = x; Cam.y = y;
  toast('Veículo reposicionado', 'Você está na ' + e.name + '.', 'info');
}
function onWindowBlur() { if (Game.state === 'playing') Screens.open('screen-pause'); }
document.addEventListener('visibilitychange', () => { if (document.hidden) onWindowBlur(); });
window.addEventListener('beforeunload', () => { if (Game.mode === 'play') saveGame(); });

function handleKeys() {
  while (KeyPress.length) {
    const k = KeyPress.shift();
    if (k === 'Escape') {
      if (Game.mode === 'play' && !Screens.current) { Screens.open('screen-pause'); AudioSys.click(); }
      else if (Screens.current && Screens.current !== 'screen-main') Screens.back();
      continue;
    }
    // Q: abre o celular; apertando de novo guarda o celular e fecha o que estiver aberto (inclusive o mapa)
    if (k === 'KeyQ' && Game.mode === 'play' && (Screens.current === 'screen-phone' || Screens.current === 'screen-map')) { Screens.closeAll(); AudioSys.tone(900, 0.05, 'sine', 0.05, 'ui', 600); continue; }
    if (Game.state !== 'playing') continue;
    switch (k) {
      case 'KeyE': if (Act.prompt) Act.prompt.act(); break;
      case 'KeyQ': Phone.open('home'); break;
      case 'KeyL': player.highBeam = !player.highBeam; AudioSys.tone(900, 0.04, 'square', 0.05, 'ui'); break;
      case 'KeyC': Cam.quick = Cam.quick === 1 ? 0.72 : 1; break;
      case 'KeyR': if (player.speed < 120) resetVehicle(); break;
    }
  }
}
function stepPlay(dt) {
  Game.time += dt;
  Profile.time += dt;
  if (Profile.time >= NIGHT_END) { Profile.time = NIGHT_START; toast('Uma nova noite começa', 'O relógio volta para as 19:30. A cidade nunca dorme.', 'info'); }
  const locked = Act.race && Act.race.count > 0;
  const inp = { thr: !locked && !!key.up(), brk: !!key.down(), steer: (key.right() ? 1 : 0) - (key.left() ? 1 : 0), hb: !!key.hb() };
  player.update(dt, inp);
  Traffic.update(dt, Game.time, player.x, player.y, Cam.view);
  Animals.update(dt, Cam.x, Cam.y);
  if (Settings.quality !== 'baixa') Peladas.update(dt, Cam.x, Cam.y);
  Particles.update(dt);
  updateActivities(dt);
  Socorro.update(dt);
}
function stepMenu(dt) {
  Game.time += dt;
  Traffic.update(dt, Game.time, Cam.x, Cam.y, Cam.view);
  Animals.update(dt, Cam.x, Cam.y);
  if (Settings.quality !== 'baixa') Peladas.update(dt, Cam.x, Cam.y);
  Particles.update(dt);
}
const STEP = 1 / 120;
let lastT = 0, accT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = lastT ? (now - lastT) / 1000 : 0.016;
  lastT = now;
  dt = clamp(dt, 0, 0.1);
  handleKeys();
  const st = Game.state;
  if (st === 'playing' || st === 'menu') {
    accT += dt;
    let n = 0;
    while (accT >= STEP && n < 12) { if (st === 'playing') stepPlay(STEP); else stepMenu(STEP); accT -= STEP; n++; }
    if (n >= 12) accT = 0;
    updateCamera(dt);
    updateFireflies(dt);
  } else accT = 0;
  AudioSys.hornOn = Game.state === 'playing' && !!key.horn();
  render();
  updateHUD(dt);
  if (Screens.current === 'screen-garage') drawGaragePreview(dt);
  if (Screens.current === 'screen-map' && bigMap) bigMap.draw();
  else if (Screens.current === 'screen-phone' && phoneMap && Phone.app === 'mapa') phoneMap.draw();
  if (AudioSys.ok) {
    const R = REGIONS[regionKeyAt(Cam.x, Cam.y)];
    const river = clamp(1 - (Math.abs(Cam.x - riverCX(Cam.y)) - 160) / 650, 0, 1);
    const p = player;
    AudioSys.update({
      active: Game.state === 'playing' && !!p, rpm: p ? p.rpm : 900, thr: p ? p.thr : 0, speed: p ? p.speed : 0, slip: p ? p.slip : 0,
      surfaceRough: p ? SURF[p.surface].rough : 0, rural: R.rural, city: R.city, river, pitch: p ? p.car.pitch : 1, cyl: p ? (p.car.cyl || 4) : 4,
    });
    let md = Infinity;
    for (const s of World.shops) if (s.kind === 'bar' || s.kind === 'lanchonete' || s.kind === 'churrascaria' || s.kind === 'fazenda') md = Math.min(md, Math.hypot(s.x - Cam.x, s.y - Cam.y));
    for (const q of World.parties) md = Math.min(md, Math.hypot(q.x - Cam.x, q.y - Cam.y) + (q.bar ? 60 : 0));
    AudioSys.music(Game.state === 'screen' ? 0 : Math.pow(clamp(1 - (md - 90) / 650, 0, 1), 1.6) * 0.32);
  }
  if (Game.state === 'playing') {
    Game.autosaveT -= dt;
    if (Game.autosaveT <= 0) { Game.autosaveT = 30; saveGame(); }
  }
  Game.fpsT += dt; Game.fpsN++;
  if (Game.fpsT >= 0.5) {
    if (Settings.showFps) $('fps').textContent = Math.round(Game.fpsN / Game.fpsT) + ' FPS · ' + Traffic.cars.length + ' carros · ' + chunks.size + ' blocos';
    Game.fpsT = 0; Game.fpsN = 0;
  }
}

async function boot() {
  const prog = (f, t) => { $('load-fill').style.width = Math.round(f * 100) + '%'; $('load-text').textContent = t; };
  const tick = () => new Promise((r) => requestAnimationFrame(() => r()));
  loadSettings();
  const saved = loadProfileFromStorage();
  if (saved) { Profile = saved; hasSave = true; }
  resize();
  bindMenus();
  bindSettings();
  $('garage-main-btn').addEventListener('click', () => Garage.main());
  $('phone-body').addEventListener('click', (e) => Phone.click(e));
  $('phone-close').addEventListener('click', () => { AudioSys.back(); Screens.back(); });
  $('hud-phone').addEventListener('click', () => { if (Game.state === 'playing') Phone.open('home'); });
  $('fps').classList.toggle('hidden', !Settings.showFps);
  prog(0.04, 'Preparando texturas…'); await tick();
  buildPatterns(); buildLightSprites();
  RNG = mulberry32(20261108);
  const steps = [
    [buildRoadGraph, 'Traçando ruas…'], [buildRiver, 'Enchendo o Rio Jucu…'], [buildRoadSurface, 'Asfaltando as avenidas…'],
    [buildCity, 'Erguendo bairros e comércios…'], [buildHighwayStrip, 'Abrindo a rodovia…'], [buildSerra, 'Subindo para Feu Rosa e Jardim Carapina…'], [buildRural, 'Plantando o interior…'],
    [buildRoadProps, 'Acendendo os postes…'], [buildActivitiesData, 'Espalhando segredos pela cidade…'],
  ];
  for (let i = 0; i < steps.length; i++) { prog(0.08 + i / steps.length * 0.72, steps[i][1]); await tick(); steps[i][0](); }
  pruneRoadTrees();
  prog(0.84, 'Desenhando o mapa…'); await tick();
  buildMapImage();
  Traffic.prepare();
  Animals.build();
  Peladas.build();
  RNG = mulberry32((Date.now() & 0xffffffff) >>> 0);
  Cam.x = 1756; Cam.y = 1500;
  Traffic.fill(Cam.x, Cam.y);
  prog(0.92, 'Ligando os faróis…'); await tick();
  Screens.open('screen-main');
  requestAnimationFrame(frame);
  await tick(); await tick();
  prog(1, 'Pronto.');
  $('loading').classList.add('fade');
  setTimeout(() => $('loading').remove(), 800);
  const unlock = () => { AudioSys.init(); };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}
boot().catch((err) => {
  console.error(err);
  const t = document.getElementById('load-text');
  if (t) t.textContent = 'Erro ao iniciar: ' + err.message;
});

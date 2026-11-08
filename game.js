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
  loop(buf) { const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; },
  gain(v, dest) { const g = this.ctx.createGain(); g.gain.value = v; if (dest) g.connect(dest); return g; },
  filt(type, f, q, dest) { const b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; if (dest) b.connect(dest); return b; },
  setupEngine() {
    const c = this.ctx;
    this.eOut = this.gain(0, this.bus.engine);
    this.eFilter = this.filt('lowpass', 600, 3, this.eOut);
    this.eO1 = c.createOscillator(); this.eO1.type = 'sawtooth';
    this.eO2 = c.createOscillator(); this.eO2.type = 'square';
    this.eO3 = c.createOscillator(); this.eO3.type = 'triangle';
    this.eO1.connect(this.gain(0.45, this.eFilter));
    this.eO2.connect(this.gain(0.14, this.eFilter));
    this.eO3.connect(this.gain(0.7, this.eFilter));
    [this.eO1, this.eO2, this.eO3].forEach((o) => { o.frequency.value = 40; o.start(); });
    const rumble = this.loop(this.brown);
    this.eRumble = this.gain(0, this.eOut);
    rumble.connect(this.filt('lowpass', 180, 1, this.eRumble));
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
    const f = (28 + p.rpm * 0.021) * p.pitch;
    this.eO1.frequency.setTargetAtTime(f, t, 0.03);
    this.eO2.frequency.setTargetAtTime(f * 2.01, t, 0.03);
    this.eO3.frequency.setTargetAtTime(f * 0.5, t, 0.03);
    this.eFilter.frequency.setTargetAtTime(260 + p.thr * 1300 + p.rpm * 0.18, t, 0.05);
    this.eOut.gain.setTargetAtTime(on * (0.07 + p.thr * 0.09 + Math.min(p.rpm / 7000, 1) * 0.05), t, k);
    this.eRumble.gain.setTargetAtTime(on * (0.15 + p.thr * 0.25), t, k);
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
  thud() { this.tone(90, 0.12, 'sine', 0.15, 'engine', 60); },
  pump() { this.noise(0.9, 1200, 1, 0.08, 'ui', 'bandpass'); this.tone(240, 0.8, 'sawtooth', 0.02, 'ui'); },
  wash() { this.noise(1.4, 3000, 0.6, 0.1, 'ui', 'highpass'); },
  wrench() { [0, 0.18, 0.36].forEach((d) => this.tone(1900, 0.06, 'square', 0.04, 'ui', 1500, d)); },
  aiHorn(dist) {
    const v = clamp(1 - dist / 900, 0, 1) * 0.07;
    if (v < 0.005) return;
    this.tone(392, 0.32, 'square', v, 'ambient'); this.tone(494, 0.32, 'square', v * 0.8, 'ambient');
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
const WORLD_W = 9000, WORLD_H = 6600;
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
  homes: [], animalsDef: [], pickups: [], trafficPoles: [],
};

/* -------- tipos de via -------- */
const RT = {
  street: { id: 'street', w: 76, sw: 22, lanes: [19], speed: 140, asphalt: true, center: 'dash' },
  avenue: { id: 'avenue', w: 150, sw: 22, lanes: [21, 57], speed: 185, asphalt: true, center: 'double', laneDiv: 39 },
  highway: { id: 'highway', w: 160, sw: 0, lanes: [21, 58], speed: 280, asphalt: true, center: 'double', laneDiv: 39, edgeLine: true, shoulder: 16 },
  road: { id: 'road', w: 76, sw: 0, lanes: [19], speed: 200, asphalt: true, center: 'dash', edgeLine: true, shoulder: 12 },
  dirt: { id: 'dirt', w: 66, sw: 0, lanes: [15], speed: 115, asphalt: false },
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
  H(300, 300, 4600, 'street', 'Rua Tiradentes');
  H(880, 300, 4600, 'street', 'Rua Sete de Setembro');
  H(1500, 300, 4600, 'avenue', 'Avenida Brasil');
  H(1500, 4600, 8700, 'road', 'Estrada do Sol');
  H(2080, 300, 4600, 'street', 'Rua XV de Novembro');
  H(2700, 300, 4600, 'street', 'Rua das Acácias');
  H(3300, 300, 4600, 'street', 'Rua dos Ipês');
  H(3880, 300, 4600, 'avenue', 'Avenida das Palmeiras');
  H(3880, 4600, 8700, 'dirt', 'Estrada da Ponte Velha');
  H(4500, 300, 4600, 'street', 'Rua do Sabiá');
  H(5300, 300, 4600, 'street', 'Rua da Esperança');
  H(880, 7500, 8700, 'dirt', 'Estrada da Boa Vista');
  H(5300, 6300, 7500, 'dirt', 'Ramal da Fazenda');
  H(HWY_Y, 300, 8700, 'highway', 'Rodovia BR-Noite');
  V(300, 300, 6200, 'street', 'Rua Santos Dumont');
  V(850, 300, 5300, 'street', 'Rua da Matriz');
  V(1450, 300, 6200, 'street', 'Rua Carlos Gomes');
  V(2100, 300, 6200, 'avenue', 'Avenida Central');
  V(2700, 300, 5300, 'street', 'Rua Bela Vista');
  V(3350, 300, 5300, 'street', 'Rua das Indústrias');
  V(3950, 300, 6200, 'street', 'Rua do Comércio');
  V(4600, 300, 6200, 'street', 'Rua Beira-Rio');
  V(6300, 1500, 6200, 'road', 'Estrada Velha');
  V(7500, 880, 6200, 'dirt', 'Estrada do Sítio');
  V(8700, 880, 6200, 'road', 'Estrada Alta');
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
  centro: { name: 'Centro', dark: 0.72, city: 1, rural: 0 },
  industrial: { name: 'Distrito Industrial', dark: 0.76, city: 0.6, rural: 0.1 },
  vila: { name: 'Vila Esperança', dark: 0.75, city: 0.55, rural: 0.25 },
  jardim: { name: 'Jardim das Palmeiras', dark: 0.75, city: 0.45, rural: 0.3 },
  rio: { name: 'Rio Claro', dark: 0.76, city: 0.15, rural: 0.8 },
  sitio: { name: 'Sítio Boa Vista', dark: 0.76, city: 0, rural: 1 },
  fazenda: { name: 'Fazenda Santa Luzia', dark: 0.76, city: 0, rural: 1 },
  rodovia: { name: 'Rodovia BR-Noite', dark: 0.76, city: 0.2, rural: 0.7 },
  mata: { name: 'Mata da Serra', dark: 0.80, city: 0, rural: 1 },
};
function regionKeyAt(x, y) {
  if (x < 230 || y < 230 || x > 8790 || y > 6440) return 'mata';
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
  pasture: SF.GRASS, earth: SF.EARTH, soccer: SF.EARTH, forest: SF.GRASS, garden: SF.FIELD, sand: SF.SAND, pool: SF.WATER, court: SF.PAVED,
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
  if (type !== 'bush') addCircCol(x, y, type === 'palm' ? 4 : 5 * size, 'tree');
  else addCircCol(x, y, 7 * size, 'tree');
  const sr = R * 0.9;
  bake(x - sr, y - sr, x + sr * 2, y + sr * 2, 7, (g) => {
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
  rendGrid.insert(lamp, Math.min(bx, hx) - 10, Math.min(by, hy) - 10, Math.max(bx, hx) + 10, Math.max(by, hy) + 10);
  addCircCol(bx, by, 4, 'pole');
  if (!lamp.broken) addLight(hx, hy, opt.r || 175, opt.i || 0.92, col, { lamp, flick: opt.flick ? 1 : 0 });
  bake(bx - 4, by - 4, bx + 30, by + 34, 7, (g) => { g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + 22, by + 28); g.stroke(); });
  return lamp;
}
// objetos baixos (desenhados no chão pré-renderizado)
function addProp(type, x, y, opt) {
  opt = opt || {};
  const p = { type, x, y, a: opt.a || 0, c: opt.c || null, w: opt.w || 0, h: opt.h || 0, seed: rnd() };
  const R = opt.R || 30;
  bake(x - R, y - R, x + R, y + R, opt.z || 8, (g) => drawProp(g, p));
  if (opt.col === 'circ') addCircCol(x, y, opt.cr || 6, 'prop');
  else if (opt.col === 'rect') addRectCol(x - opt.w / 2, y - opt.h / 2, x + opt.w / 2, y + opt.h / 2, 'prop');
  return p;
}
function addWall(x0, y0, x1, y1, color, opt) {
  opt = opt || {};
  if (x1 - x0 < 1 || y1 - y0 < 1) return;
  const w = { x0, y0, x1, y1, color, hgt: opt.h || 4, kind: opt.kind || 'wall' };
  bake(x0 - 2, y0 - 8, x1 + 6, y1 + 8, 8, (g) => drawWallBaked(g, w));
  if (!opt.noCol) addRectCol(x0, y0, x1, y1, 'wall');
}
function addFence(x0, y0, x1, y1, opt) {
  opt = opt || {};
  const f = { x0, y0, x1, y1, type: opt.type || 'wood' };
  bake(x0 - 4, y0 - 6, x1 + 6, y1 + 6, 8, (g) => drawFenceBaked(g, f));
  addRectCol(x0, y0, x1, y1, 'fence');
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
const CAR_COLORS = ['#d9d9d9', '#bfc3c7', '#8d949b', '#1d1f24', '#f2f2f2', '#a8231f', '#24446e', '#5a6b4e', '#c9b28a', '#7a1f2b', '#2d5d8a', '#d8c25a', '#3f3f46'];
function randomCarModel() { return pick(['hatch', 'hatch', 'hatch', 'sedan', 'sedan', 'pickup', 'van', 'sport']); }

/* -------- estabelecimentos -------- */
function addShop(def) {
  const s = Object.assign({ id: def.kind + '_' + World.shops.length, visited: false }, def);
  World.shops.push(s);
  return s;
}

/* ============================ LOTES E QUARTEIRÕES ============================ */
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
  const h = sob ? rnd(42, 48) : rnd(25, 31);
  const roofType = rich ? pick(['hip', 'hip', 'flat', 'gable']) : pick(['hip', 'hip', 'laje', 'laje', 'gable']);
  const hr = F.rect(7, setback, W - 7, setback + depth);
  addBuilding(hr[0], hr[1], hr[2], hr[3], h, { style: 'house', front: F.front, roofType, roofColor: roofType === 'hip' || roofType === 'gable' ? pick(ROOF_TILE) : (roofType === 'laje' ? '#8f8b84' : '#6f6c69'), lit: rnd(0.15, 0.6) });
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
  const rp = roadPointFor(F, W / 2, o.roadHW, o.laneOff);
  const s = addShop({ kind: def.kind, name: def.name, x: rp[0], y: rp[1], bld: b, color: def.color, region: o.region, pickup: def.pickup, items: def.items });
  return s;
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
        const hh = officeH();
        const style = hh < 52 ? 'shop' : 'office';
        const signs = ['LOJA', 'HOTEL', 'BAR', 'ÓTICA', 'CALÇADOS', 'MODAS', 'BAZAR', 'LOTÉRICA', 'SALÃO', 'CELULAR'];
        const cols2 = ['#ff5f7a', '#59e0ff', '#ffd24a', '#5be38f', '#c56bff', '#ff8a3d'];
        const b = addBuilding(px0 + il + rnd(0, 4), py0 + it + rnd(0, 4), px1 - ir - rnd(0, 4), py1 - ib - rnd(0, 4), hh, {
          style, front, roofType: 'flat', roofColor: pick(['#6f6d6a', '#7d7a74', '#5f5e5b', '#85817a']), wall: pick(OFFICE_COLORS), lit: rnd(0.25, 0.6),
          sign: style === 'shop' && chance(0.75) ? pick(signs) : null, signColor: pick(cols2),
        });
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
  addBuilding(R.x0 + 20, R.y0 + 30, wx1, R.y1 - 120, rnd(36, 46), { style: 'warehouse', roofType: 'corrugated', roofColor: whCol, wall: '#a9a59b', lit: 0.12, front: 'S' });
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
function hwV(x) { return x === 2100 ? 75 : 38; }
function hwH(y) { return (y === 1500 || y === 3880) ? 75 : 38; }
function cellRect(c, r) { return { x0: XS[c] + hwV(XS[c]) + 22, x1: XS[c + 1] - hwV(XS[c + 1]) - 22, y0: YS[r] + hwH(YS[r]) + 22, y1: YS[r + 1] - hwH(YS[r + 1]) - 22 }; }
const NAMES_H = {}, NAMES_V = {};
function cellRoads(c, r) {
  const mk = (name, hw) => ({ name, hw, lane: hw > 50 ? 57 : 19 });
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
  const b = addBuilding(R.x0 + 20, R.y0 + 60, R.x0 + 240, R.y0 + 200, 38, { style: 'workshop', front: 'N', roofType: 'corrugated', roofColor: '#4d6b86', wall: '#d9d2c0', lit: 0.8, sign: 'OFICINA DOIS IRMÃOS', signColor: '#ffb547' });
  addLight(R.x0 + 130, R.y0 + 40, 140, 1, 'white', { shop: true });
  for (let i = 0; i < 4; i++) addProp('tires', R.x0 + 262 + i * 18, R.y0 + 90 + (i % 2) * 22, { col: 'circ', cr: 8 });
  addParkedCar(R.x0 + 60, R.y0 + 30, 0, 'sedan', '#5a5a5a');
  addParkedCar(R.x0 + 190, R.y0 + 28, Math.PI, 'hatch', '#8a3b2a');
  industrialBlock({ x0: R.x0 + 280, y0: R.y0, x1: R.x1, y1: R.y1 }, { noTrucks: true });
  return addShop({ kind: 'oficina', name: 'Oficina Dois Irmãos', x: R.x0 + 130, y: YS[1] + 19, bld: b, color: '#ffb547', region: 'industrial', pickup: true, items: ['Peças de motor', 'Bateria nova', 'Jogo de pneus'] });
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
function shopLotBuilder(def) { return (F, ro) => shopBuilding(F, def, ro); }

/* ---------- construção da cidade ---------- */
function buildCity() {
  for (const r of ROADS) { if (r.h && r.x1 < 4700) NAMES_H[r.y] = r.name; if (!r.h && r.y1 < 1000) NAMES_V[r.x] = r.name; }
  NAMES_V[4600] = 'Rua Beira-Rio';
  const SPECIAL = {
    '2,1': 'plaza', '3,1': 'parking', '4,2': 'posto', '5,1': 'oficina', '5,3': 'tower', '0,5': 'soccer', '3,7': 'school',
  };
  const shopsDowntown = {
    '1,2': { 0: { kind: 'pizzaria', name: 'Pizzaria Forno a Lenha', sign: 'PIZZARIA', color: '#ff5f3d', h: 32, pickup: true, items: ['Pizza grande', 'Pizza de calabresa', 'Esfihas'] }, 3: { kind: 'farmacia', name: 'Farmácia Saúde Já', sign: 'FARMÁCIA', color: '#3dff8a', h: 34, pickup: true, items: ['Remédios', 'Encomenda da farmácia'] } },
    '0,0': { 1: { kind: 'hotel', name: 'Hotel Estrela da Manhã', sign: 'HOTEL', color: '#c56bff', h: 70, wall: '#c9c2b4' } },
  };
  const resSpecial = {
    '1,4': { side: 'N', w: 186, build: homeLot },
    '2,4': { side: 'N', w: 150, build: shopLotBuilder({ kind: 'padaria', name: 'Padaria Pão Quente', sign: 'PADARIA', color: '#ffc24a', h: 32, depth: 100, pickup: true, items: ['Bolo de aniversário', 'Pães e frios', 'Encomenda de salgados'] }) },
    '0,4': { side: 'N', w: 160, build: shopLotBuilder({ kind: 'mercado', name: 'Mercadinho Bom Preço', sign: 'MERCADINHO', color: '#ff7a3d', h: 32, depth: 105, pickup: true, items: ['Compras do mês', 'Caixa de bebidas', 'Sacolas de compras'] }) },
    '4,6': { side: 'N', w: 150, build: shopLotBuilder({ kind: 'lanchonete', name: 'Lanchonete do Bigode', sign: 'LANCHES', color: '#ff4f8a', h: 30, depth: 95, pickup: true, items: ['X-tudo e batata', 'Pastéis', 'Lanches para a turma'] }) },
    '2,6': { side: 'N', w: 140, build: shopLotBuilder({ kind: 'bar', name: 'Bar do Toninho', sign: 'BAR DO TONINHO', color: '#ffd24a', h: 28, depth: 90 }) },
    '5,5': { side: 'W', w: 150, build: shopLotBuilder({ kind: 'floricultura', name: 'Floricultura Primavera', sign: 'FLORES', color: '#ff8ad8', h: 30, depth: 96, pickup: true, items: ['Buquê de rosas', 'Arranjo de flores'] }) },
  };
  for (let c = 0; c < 7; c++) for (let r = 0; r < 8; r++) {
    const R = cellRect(c, r), k = c + ',' + r;
    const roads = cellRoads(c, r);
    const region = regionKeyAt((R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2);
    const sp = SPECIAL[k];
    if (sp === 'plaza') plazaChurch(R);
    else if (sp === 'parking') parkingLot(R);
    else if (sp === 'posto') {
      gasStation({ x0: R.x0, y0: R.y0, x1: R.x0 + 300, y1: R.y1 }, { name: 'Posto Centro', color: '#ff3d3d', front: 'S', canopy: [R.x0 + 40, R.y0 + 40, R.x0 + 260, R.y0 + 190], store: [R.x0 + 34, R.y1 - 120, R.x0 + 180, R.y1 - 14], wash: [R.x0 + 196, R.y1 - 120, R.x0 + 286, R.y1 - 14], totem: [R.x0 + 14, R.y0 + 14], region: 'centro' });
      downtownBlock({ x0: R.x0 + 300, y0: R.y0, x1: R.x1, y1: R.y1 }, { roads, region, cols: 1 });
    }
    else if (sp === 'oficina') oficinaBlock(R);
    else if (sp === 'tower') waterTowerBlock(R);
    else if (sp === 'soccer') soccerBlock(R);
    else if (sp === 'school') schoolBlock(R);
    else if (r < 4) {
      if (c >= 5) industrialBlock(R, {});
      else downtownBlock(R, { roads, region, shops: shopsDowntown[k] });
    } else residentialBlock(R, { rich: c >= 3, roads, region, special: resSpecial[k] });
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
      // lixeiras / hidrantes
      for (let s = e.clearA + 40; s < e.len - e.clearB - 40; s += 140) {
        if (!chance(0.35)) continue;
        const sd = chance(0.5) ? 1 : -1;
        const px = e.a.x + e.dx * s + nx * (e.hw + T.sw - 5) * sd, py = e.a.y + e.dy * s + ny * (e.hw + T.sw - 5) * sd;
        if (areaBlocked(px - 6, py - 6, px + 6, py + 6)) continue;
        addProp(chance(0.7) ? 'bin' : 'hydrant', px, py, { col: 'circ', cr: 4, R: 8 });
      }
    }
    // pontos de ônibus nas avenidas
    if (T.id === 'avenue' && e.len > 400) {
      const s = e.len * 0.5, sd = 1;
      const px = e.a.x + e.dx * s + nx * (e.hw + 12) * sd, py = e.a.y + e.dy * s + ny * (e.hw + 12) * sd;
      if (!areaBlocked(px - 20, py - 8, px + 20, py + 8)) {
        const st = { kind: 'busstop', x: px, y: py, a: Math.atan2(e.dy, e.dx), h: 26 };
        addTall(st, px - 30, py - 30, px + 30, py + 30);
        addRectCol(px - (e.h ? 22 : 6), py - (e.h ? 6 : 22), px + (e.h ? 22 : 6), py + (e.h ? 6 : 22), 'prop');
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
      addTall(pole, px - 20, py - 20, px + 20, py + 20);
      addCircCol(px, py, 3, 'pole');
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
      addTall(sgn, px - 14, py - 14, px + 14, py + 14);
      addCircCol(px, py, 2.5, 'pole');
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
  forest(0, 0, WORLD_W, 230); forest(0, 230, 230, WORLD_H); forest(8790, 230, WORLD_W, WORLD_H); forest(230, 6440, 8790, WORLD_H);
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
  addShop({ kind: 'sitio', name: 'Sítio Boa Vista', x: 7970, y: 880 + 15, color: '#9be36a', region: 'sitio', pickup: true, items: ['Ovos caipiras', 'Queijo minas', 'Caixa de verduras'] });
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
  addBuilding(7950, 4300, 8200, 4460, 36, { style: 'farmhouse', roofType: 'hip', roofColor: '#b0532e', wall: '#f4efe2', lit: 0.75, front: 'N', sign: 'FAZENDA SANTA LUZIA', signColor: '#ffd24a' });
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
  addShop({ kind: 'fazenda', name: 'Fazenda Santa Luzia', x: 8075, y: 3880 + 15, color: '#ffd24a', region: 'fazenda', pickup: true, items: ['Leite fresco', 'Queijo da fazenda', 'Doce de leite'] });
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
  decal(260, 6300, 8760, 6420, 'pasture');
  for (let x = 300; x < 8700; x += 600) fenceRect(x, 6310, x + 560, 6410, [], 'wood');
  scatterTrees(260, 6290, 8760, 6430, 40, ['round', 'pine', 'mango', 'bush']);
  // capivaras do rio
  for (const y of [1000, 2300, 3300, 4300, 5200]) {
    const cx = riverCX(y) + riverHW(y) + 8;
    World.animalsDef.push({ type: 'capybara', n: 3, rect: [cx - 4, y - 60, cx + 14, y + 60] });
  }
  for (const y of [1900, 4700]) {
    const cx = riverCX(y) - riverHW(y) - 14;
    World.animalsDef.push({ type: 'capybara', n: 2, rect: [cx - 10, y - 50, cx + 6, y + 50] });
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
  const y0 = 5360, y1 = 6108;
  // chácaras
  decal(360, y0, 1390, y1, 'lawn');
  for (const [x0, x1] of [[380, 700], [760, 1100]]) {
    const F = lotFrame(x0, y0, x1, y0 + 220, 'N');
    houseLot(F, { rich: true, back: true, lastLot: true, street: 'Rua da Esperança', roadHW: 38, laneOff: 19, region: 'rodovia' });
  }
  scatterTrees(380, 5600, 1380, 6080, 14, ['mango', 'round', 'palm', 'pine']);
  // Posto Estrela
  decal(1510, y0, 2003, y1, 'lawn');
  World.posto2 = gasStation({ x0: 1510, y0: 5760, x1: 2003, y1: y1 }, { name: 'Posto Estrela', color: '#ffb000', front: 'N', canopy: [1580, 5920, 1880, 6070], store: [1560, 5780, 1760, 5880], totem: [1990, 6090], region: 'rodovia' });
  decal(1510, y0 + 20, 2003, 5740, 'paved');
  const sx0 = 1540, SW = 34;
  bake(sx0, 5400, sx0 + 13 * SW, 5470, 6, (g) => { g.strokeStyle = 'rgba(240,240,230,0.7)'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 13; i++) { g.moveTo(sx0 + i * SW, 5400); g.lineTo(sx0 + i * SW, 5470); } g.moveTo(sx0, 5400); g.lineTo(sx0 + 13 * SW, 5400); g.stroke(); });
  for (let i = 0; i < 13; i++) {
    const x = sx0 + i * SW + SW / 2;
    if (i === 3 || i === 9) { World.parkSpots.push({ id: 'estrela_' + i, name: 'Pátio do Posto Estrela', x, y: 5435, a: -Math.PI / 2, w: SW, l: 62, reward: 200 }); continue; }
    if (chance(0.5)) addParkedCar(x, 5435, -Math.PI / 2, randomCarModel(), pick(CAR_COLORS));
  }
  for (let i = 0; i < 3; i++) addParkedCar(1620 + i * 120, 5640, 0, 'truck', pick(['#d8d8d8', '#c43d2e', '#2c5d9c', '#e0a020']));
  addLamp(1700, 5520, 1700, 5520, 'white', { style: 'pole', h: 64, r: 200 });
  addLamp(1900, 5520, 1900, 5520, 'white', { style: 'pole', h: 64, r: 200 });
  // churrascaria
  decal(2197, y0, 3890, y1, 'lawn');
  decal(2600, 5780, 3100, y1, 'paved');
  const chb = addBuilding(2680, 5790, 3000, 5930, 34, { style: 'shop', front: 'S', roofType: 'hip', roofColor: '#8a3a22', wall: '#e8d2a8', lit: 0.9, sign: 'CHURRASCARIA RODEIO', signColor: '#ff5f3d' });
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
  addShop({ kind: 'churrascaria', name: 'Churrascaria Rodeio', x: 2840, y: 6200 - 21, bld: chb, color: '#ff5f3d', region: 'rodovia', pickup: true, items: ['Marmitas de churrasco', 'Encomenda de carnes'] });
  scatterTrees(2220, 5400, 2580, 6080, 8, ['mango', 'round', 'pine']);
  scatterTrees(3150, 5400, 3880, 6080, 12, ['mango', 'round', 'pine', 'palm']);
  // borracharia
  decal(4010, y0, 4540, y1, 'lawn');
  decal(4100, 5940, 4400, y1, 'gravel');
  const bb = addBuilding(4150, 5960, 4330, 6060, 26, { style: 'shop', front: 'S', roofType: 'corrugated', roofColor: '#6a6a60', wall: '#d4cdb4', lit: 0.9, sign: 'BORRACHARIA 24H', signColor: '#ffd24a' });
  for (let i = 0; i < 5; i++) addProp('tires', 4120 + i * 22, 6080, { col: 'circ', cr: 8 });
  addLight(4240, 6080, 120, 0.9, 'warm', { shop: true });
  addShop({ kind: 'borracharia', name: 'Borracharia 24h', x: 4240, y: 6200 - 21, bld: bb, color: '#ffd24a', region: 'rodovia' });
  scatterTrees(4030, 5400, 4520, 5900, 8, ['round', 'mango', 'palm']);
  // outdoors
  const ads = [['PASTEL DA ESTRADA', '2 KM'], ['VIAJE COM CALMA', 'A NOITE É LONGA'], ['RÁDIO NOITE FM', '98,7'], ['CHURRASCARIA RODEIO', 'ABERTO ATÉ TARDE'], ['FAZENDA STA. LUZIA', 'QUEIJO E DOCE'], ['POSTO ESTRELA', 'ABERTO 24H']];
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
  World.animalsDef.push({ type: 'dog', n: 1, rect: [640, 2740, 1380, 2760] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [1500, 3920, 2000, 3942] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [2740, 4520, 3300, 4540] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [338, 3400, 360, 4400] });
  World.animalsDef.push({ type: 'dog', n: 1, rect: [3360, 4900, 3920, 5240] });
  World.animalsDef.push({ type: 'dog', n: 2, rect: [420, 3420, 760, 3760] });
}

/* ---------- pontos de interesse e percursos ---------- */
function markReflections() {
  for (const L of World.lights) {
    for (let dy = 30; dy <= 260; dy += 20) if (groundAt(L.x, L.y + dy) === SF.WATER) { L.refl = dy + 30; break; }
  }
}
function buildActivitiesData() {
  markReflections();
  const P = (id, name, x, y, desc) => World.pois.push({ id, name, x, y, r: 170, desc });
  P('praca', 'Praça da Matriz', 1756, 1260, 'O coração do Centro, com a fonte e a igreja.');
  P('campo', 'Campo de Várzea', 575, 3570, 'Onde o futebol de domingo vira lenda.');
  P('ponte', 'Ponte Velha', riverCX(3880), 3880, 'Ponte de madeira centenária sobre o Rio Claro.');
  P('mirante', 'Mirante do Rio Claro', World.mirante.x, World.mirante.y, 'A melhor vista do rio à noite.');
  P('fazenda', 'Fazenda Santa Luzia', 8075, 4380, 'Casarão antigo cercado de palmeiras.');
  P('sitio', 'Sítio Boa Vista', 7970, 1050, 'Galinhas, horta e café passado na hora.');
  P('estrela', 'Posto Estrela', 1730, 5990, 'Parada obrigatória de caminhoneiros.');
  P('cafezal', 'Cafezal da Serra', 8100, 2420, 'Fileiras de café até onde a vista alcança.');
  P('acude', 'Açude da Fazenda', 6900, 4590, 'Água parada, sapos e capivaras.');
  P('caixa', "Caixa d'Água", 3650, 2520, 'O ponto mais alto da cidade.');
  P('orla', 'Orla do Rio', 4720, 4300, 'Calçadão de pedras portuguesas à beira-rio.');
  P('milharal', 'Milharal', 6900, 900, 'Um espantalho vigia o milho no escuro.');
  P('escola', 'Escola Estadual', 2420, 4900, 'A quadra iluminada da escola do bairro.');
  P('rodeio', 'Churrascaria Rodeio', 2840, 5900, 'Picanha na brasa até de madrugada.');
  const R = (id, name, desc, pts) => {
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    World.races.push({ id, name, desc, start: pts[0], pts: pts.slice(1), len, gold: len / 270, silver: len / 220, bronze: len / 170, a0: Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) });
  };
  R('centro', 'Volta do Centro', 'Ruas apertadas, semáforos e esquinas do Centro.', [[1720, 2080 + 19], [2700, 2099], [2719, 880], [850, 861], [831, 2080], [1450, 2099], [2081, 2099]]);
  R('fazenda', 'Estrada da Fazenda', 'Terra, poeira e curvas entre o cafezal e a fazenda.', [[6319, 2300], [6319, 3880], [7500, 3895], [7515, 1500], [8700, 1519], [8719, 3880], [8719, 4900]]);
  R('rodovia', 'Rodovia Noturna', 'Reta longa, caminhões e a ponte sobre o Rio Claro.', [[700, 6200 + 21], [2100, 6221], [4600, 6221], [6300, 6221], [8681, 6221], [8681, 4600]]);
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
  PSRC.paved = tex(128, '#3b3d42', (g, s, R) => speck(g, s, R, 1200, ['#34363b', '#45474d', '#4d4f55', '#303237'], 1, 1.8));
  PSRC.sidewalk = tex(64, '#8b8a84', (g, s, R) => {
    speck(g, s, R, 300, ['#83827c', '#93928b', '#7d7c76'], 1, 2);
    g.fillStyle = '#76756f';
    for (let i = 0; i < s; i += 16) { g.fillRect(i, 0, 1, s); g.fillRect(0, i, s, 1); }
  });
  PSRC.dirt = tex(128, '#7a5e42', (g, s, R) => {
    speck(g, s, R, 900, ['#6c523a', '#86694a', '#8f7354', '#604832', '#9a7e5c'], 1, 3);
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(160,140,110,0.5)'; g.beginPath(); g.arc(R() * s, R() * s, 1 + R() * 1.5, 0, TAU); g.fill(); }
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
function drawEdgeBase(g, e) {
  const T = e.T, L = e.len, hw = e.hw;
  edgeLocal(g, e);
  if (T.sw) {
    g.fillStyle = pat(g, 'sidewalk');
    const s0 = e.perpA, s1 = L - e.perpB;
    g.fillRect(s0, -hw - T.sw, s1 - s0, T.sw); g.fillRect(s0, hw, s1 - s0, T.sw);
    g.fillStyle = '#a3a29b'; g.fillRect(s0, -hw - 2.5, s1 - s0, 2.5); g.fillRect(s0, hw, s1 - s0, 2.5);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(s0, -hw - T.sw, s1 - s0, 1.5); g.fillRect(s0, hw + T.sw - 1.5, s1 - s0, 1.5);
  }
  if (T.shoulder) {
    g.fillStyle = pat(g, 'gravel');
    g.fillRect(0, -hw - T.shoulder, L, T.shoulder); g.fillRect(0, hw, L, T.shoulder);
  }
  if (T.asphalt) {
    g.fillStyle = pat(g, 'asphalt'); g.fillRect(0, -hw, L, hw * 2);
    g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(0, -hw, L, 5); g.fillRect(0, hw - 5, L, 5);
    const R = mulberry32(e.id * 977 + 13);
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
    g.fillStyle = 'rgba(40,28,18,0.22)';
    g.fillRect(0, -15 - 3, L, 6); g.fillRect(0, 15 - 3, L, 6);
    g.fillStyle = 'rgba(160,140,100,0.18)'; g.fillRect(0, -2, L, 4);
    const R = mulberry32(e.id * 31 + 7);
    for (let i = 0; i < L / 90; i++) { g.fillStyle = 'rgba(30,22,14,0.3)'; g.beginPath(); g.ellipse(R() * L, (R() - 0.5) * hw * 1.4, 4 + R() * 8, 3 + R() * 5, 0, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(60,90,40,0.55)';
    for (let i = 0; i < L / 14; i++) { const s = R() * L; g.fillRect(s, -hw - 4 + R() * 3, 2, 4); g.fillRect(s + 5, hw + R() * 3, 2, 4); }
  }
  g.restore();
}
function drawEdgeMarkings(g, e) {
  const T = e.T;
  if (!T.asphalt) return;
  const L = e.len, hw = e.hw;
  const pad = T.sw ? 26 : 6;
  const s0 = e.perpA ? e.perpA + pad : 0, s1 = e.perpB ? L - e.perpB - pad : L;
  if (s1 <= s0) return;
  edgeLocal(g, e);
  const yel = '#e3bf3f', wht = 'rgba(236,236,230,0.92)';
  if (T.center === 'dash') {
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
  if (sw) {
    g.fillStyle = pat(g, 'sidewalk');
    g.fillRect(n.x - hv - sw, n.y - hh - sw, sw, sw); g.fillRect(n.x + hv, n.y - hh - sw, sw, sw);
    g.fillRect(n.x - hv - sw, n.y + hh, sw, sw); g.fillRect(n.x + hv, n.y + hh, sw, sw);
    if (!dirs.N) g.fillRect(n.x - hv, n.y - hh - sw, hv * 2, sw);
    if (!dirs.S) g.fillRect(n.x - hv, n.y + hh, hv * 2, sw);
    if (!dirs.W) g.fillRect(n.x - hv - sw, n.y - hh, sw, hh * 2);
    if (!dirs.E) g.fillRect(n.x + hv, n.y - hh, sw, hh * 2);
    g.fillStyle = '#a3a29b';
    if (!dirs.N) g.fillRect(n.x - hv, n.y - hh - 2.5, hv * 2, 2.5);
    if (!dirs.S) g.fillRect(n.x - hv, n.y + hh, hv * 2, 2.5);
    if (!dirs.W) g.fillRect(n.x - hv - 2.5, n.y - hh, 2.5, hh * 2);
    if (!dirs.E) g.fillRect(n.x + hv, n.y - hh, 2.5, hh * 2);
  } else {
    let sh = 0; for (const e of n.edges) sh = Math.max(sh, e.T.shoulder || 0);
    if (sh) { g.fillStyle = pat(g, 'gravel'); g.fillRect(n.x - hv - sh, n.y - hh - sh, (hv + sh) * 2, (hh + sh) * 2); }
  }
  g.fillStyle = pat(g, asph ? 'asphalt' : 'dirt');
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
    g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(b.x0, y - hw, b.x1 - b.x0, hw * 2);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (let x = b.x0 + 60; x < b.x1; x += 120) g.fillRect(x, y - hw, 2, hw * 2);
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
function drawProp(g, p) {
  g.save(); g.translate(p.x, p.y); g.rotate(p.a);
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
  hatch: { id: 'hatch', L: 44, W: 22, ws: 0.20, rf: 0.06, rr: -0.30, rw: -0.43, nose: 6, tail: 5, kind: 'car' },
  sedan: { id: 'sedan', L: 50, W: 23, ws: 0.17, rf: 0.02, rr: -0.20, rw: -0.32, nose: 6, tail: 5, kind: 'car' },
  taxi: { id: 'taxi', L: 50, W: 23, ws: 0.17, rf: 0.02, rr: -0.20, rw: -0.32, nose: 6, tail: 5, kind: 'car', taxi: true },
  pickup: { id: 'pickup', L: 52, W: 24, ws: 0.25, rf: 0.13, rr: -0.07, rw: -0.10, nose: 5, tail: 3, kind: 'car', bed: -0.12 },
  van: { id: 'van', L: 48, W: 24, ws: 0.45, rf: 0.37, rr: -0.44, rw: -0.47, nose: 10, tail: 6, kind: 'car', van: true },
  sport: { id: 'sport', L: 45, W: 24, ws: 0.14, rf: -0.02, rr: -0.25, rw: -0.37, nose: 9, tail: 6, kind: 'car', stripes: true, spoiler: true },
  muscle: { id: 'muscle', L: 56, W: 25, ws: 0.10, rf: -0.05, rr: -0.25, rw: -0.34, nose: 4, tail: 4, kind: 'car', chrome: true },
  truck: { id: 'truck', L: 84, W: 28, kind: 'truck' },
  bus: { id: 'bus', L: 112, W: 30, kind: 'bus' },
  tractor: { id: 'tractor', L: 34, W: 24, kind: 'tractor' },
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
  ctx.save();
  ctx.translate(x + 3, y + 4); ctx.rotate(a);
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath(); rrect(ctx, -m.L / 2 - 1, -m.W / 2 - 0.5, m.L + 2, m.W + 1, 6); ctx.fill();
  ctx.restore();
  const lift = o.noLift ? 0 : vehLift(m);
  if (lift) {
    const bp = bodyPath(m);
    ctx.fillStyle = shade(m.kind === 'car' ? color : '#555555', -0.62);
    for (const k of [0, 0.5]) { ctx.save(); ctx.translate(x, y - lift * k); ctx.rotate(a); ctx.fill(bp); ctx.restore(); }
  }
  ctx.save();
  ctx.translate(x, y - lift); ctx.rotate(a);
  if (o.bump) ctx.translate(o.bump, 0);
  if (m.kind === 'truck') drawTruck(ctx, m, color, o);
  else if (m.kind === 'bus') drawBus(ctx, m, color, o);
  else if (m.kind === 'tractor') drawTractor(ctx, m, color, o);
  else drawCar(ctx, m, color, o);
  ctx.restore();
}
function vehLift(m) { return m.kind === 'truck' || m.kind === 'bus' ? 7 : m.kind === 'tractor' ? 4 : 5; }
function drawLightsFR(ctx, hl, hw, o, chrome) {
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
  drawLightsFR(ctx, hl, hw, o);
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
  ctx.beginPath(); rrect(ctx, rr, -hw + 4 + lean, rf - rr, W - 8, 3); ctx.fill();
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
  if (m.spoiler) { ctx.fillStyle = '#151517'; ctx.fillRect(-hl + 1.2, -hw + 1, 3, W - 2); }
  if (m.chrome) { ctx.fillStyle = shade(color, -0.3); ctx.fillRect(ws + 3, -3.5, hl - ws - 7, 7); ctx.fillStyle = '#222'; ctx.fillRect(ws + 5, -2, 4, 4); }
  if (m.taxi) {
    ctx.fillStyle = '#f2c230'; ctx.fillRect((rr + rf) / 2 - 3, -5 + lean, 6, 10);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect((rr + rf) / 2 - 1, -4 + lean, 2, 8);
  }
  // espelhos
  ctx.fillStyle = shade(color, -0.3);
  ctx.fillRect(ws - 2, -hw - 1.8, 3, 2); ctx.fillRect(ws - 2, hw - 0.2, 3, 2);
  // sujeira e dano
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
function drawTruck(ctx, m, color, o) {
  const L = m.L, W = m.W, hl = L / 2, hw = W / 2;
  for (const x of [hl - 12, -hl + 22, -hl + 10]) { drawWheel(ctx, x, -hw + 1, 11, 5.5, x > 0 ? o.steer : 0, o.roll); drawWheel(ctx, x, hw - 1, 11, 5.5, x > 0 ? o.steer : 0, o.roll); }
  const box = o.box || '#d9d6cc';
  ctx.fillStyle = bodyGrad(ctx, box, hw); ctx.fillRect(-hl, -hw, L - 26, W);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(-hl, -hw, L - 26, W);
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  for (let x = -hl + 6; x < hl - 28; x += 6) { ctx.beginPath(); ctx.moveTo(x, -hw + 1); ctx.lineTo(x, hw - 1); ctx.stroke(); }
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
  { id: 'pampeiro', name: 'Pampeiro 1.0', model: 'hatch', price: 0, max: 418, acc: 118, brk: 330, steer: 1.0, grip: 1.0, pitch: 1.12, fuel: 1.0, desc: 'O popular de sempre: econômico, valente e fácil de estacionar em qualquer vaga.' },
  { id: 'tropeiro', name: 'Tropeiro Furgão', model: 'van', price: 4500, max: 352, acc: 92, brk: 285, steer: 0.9, grip: 0.93, pitch: 0.82, fuel: 1.15, cargo: 1.25, desc: 'Furgão de motor traseiro e teto claro. Lento, mas entregas rendem 25% a mais.' },
  { id: 'sertaneja', name: 'Sertaneja Cabine', model: 'pickup', price: 8000, max: 446, acc: 128, brk: 320, steer: 0.96, grip: 1.04, pitch: 0.92, fuel: 1.1, offroad: true, desc: 'Picape robusta de cabine simples. Perde pouca velocidade na terra, na grama e na lavoura.' },
  { id: 'cometa', name: 'Cometa 2.0', model: 'sedan', price: 12500, max: 508, acc: 146, brk: 370, steer: 1.0, grip: 1.05, pitch: 1.0, fuel: 1.05, desc: 'Sedã confortável de quatro portas. Estável na rodovia e firme nas frenagens.' },
  { id: 'bravo', name: 'Bravo Turbo', model: 'sport', price: 19000, max: 575, acc: 186, brk: 420, steer: 1.12, grip: 1.13, pitch: 1.28, fuel: 1.2, desc: 'Hatch esportivo com faixas no capô e aerofólio. Nervoso, preciso e barulhento.' },
  { id: 'brasa', name: 'Brasa 6C', model: 'muscle', price: 29000, max: 632, acc: 196, brk: 385, steer: 0.95, grip: 0.98, pitch: 0.7, fuel: 1.4, desc: 'Sedã clássico de seis cilindros com para-choques cromados. Ronco grave e força de sobra.' },
];
const PALETTE = ['#c0392b', '#e8e8e8', '#1f2a44', '#2e86de', '#f1c40f', '#27ae60', '#16181d', '#8e9aa6', '#e67e22', '#7d3c98', '#6d4c3a', '#ff6fa5'];
const UPGRADES = [
  { id: 'motor', name: 'Motor', desc: 'Aceleração +10%/nível', base: [350, 800, 1600] },
  { id: 'cambio', name: 'Câmbio', desc: 'Velocidade máx. +5%/nível', base: [300, 700, 1400] },
  { id: 'freio', name: 'Freios', desc: 'Frenagem +12%/nível', base: [250, 550, 1100] },
  { id: 'pneu', name: 'Pneus', desc: 'Aderência e direção', base: [300, 650, 1300] },
];
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
    if (inp.thr && !inp.brk) {
      if (vf < -8) { vf += st.brk * dt; this.braking = true; if (vf > 0) vf = 0; }
      else { const k = clamp(vf / maxS, 0, 1); vf += acc * (1.08 - k * k) * dt; }
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
    if (inp.hb && Math.abs(vf) > 40) yaw *= 1.28;
    this.yaw = yaw;
    const g = (inp.hb ? 3.4 : 17) * st.grip * gripS;
    vl *= Math.exp(-g * dt);
    this.slip = clamp(Math.abs(vl) / 110 + (this.braking && Math.abs(vf) > 200 ? 0.35 : 0) + (inp.hb && Math.abs(vf) > 70 ? 0.45 : 0), 0, 1.2);
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
    if (f0 > 15 && Profile.fuel <= 15) toast('Combustível na reserva', 'Procure um posto: Posto Centro ou Posto Estrela, na rodovia.', 'bad');
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
    this.rpm = lerp(this.rpm, rpmT, 1 - Math.exp(-9 * dt));
    // marcas de pneu e fumaça
    if ((this.slip > 0.5 && sp > 60) || (this.braking && sp > 240)) {
      const rx = this.x - c * this.m.L * 0.3, ry = this.y - s * this.m.L * 0.3;
      const ox = -s * (this.m.W / 2 - 2.5), oy = c * (this.m.W / 2 - 2.5);
      if (this.lastRear) Skids.add(this.lastRear[0], this.lastRear[1], rx + ox, ry + oy, this.lastRear[2], this.lastRear[3], rx - ox, ry - oy, this.surface);
      this.lastRear = [rx + ox, ry + oy, rx - ox, ry - oy];
      if (chance(0.35)) Particles.emit(this.surface === SF.ROAD || this.surface === SF.PAVED ? 'smoke' : 'dust', rx + (chance(0.5) ? ox : -ox), ry + (chance(0.5) ? oy : -oy), -this.vx * 0.1 + rnd(-10, 10), -this.vy * 0.1 + rnd(-10, 10), rnd(0.8, 1.4), 6);
    } else this.lastRear = null;
    if (sp > 120 && (this.surface === SF.DIRT || this.surface === SF.EARTH || this.surface === SF.FIELD || this.surface === SF.SAND) && chance(0.45)) {
      Particles.emit('dust', this.x - c * this.m.L * 0.5 + rnd(-6, 6), this.y - s * this.m.L * 0.5 + rnd(-6, 6), -this.vx * 0.15, -this.vy * 0.15, rnd(0.8, 1.6), 8);
    }
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
          this.x += nx * pen; this.y += ny * pen; cx += nx * pen; cy += ny * pen; any = true;
          const vn = this.vx * nx + this.vy * ny;
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
function trafficMax() { return Settings.quality === 'alta' ? 28 : Settings.quality === 'baixa' ? 14 : 21; }
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
    case 'dirt': return wpick([['pickup', 4], ['hatch', 3], ['tractor', 1.6], ['sedan', 1], ['van', 1]]);
    case 'highway': return wpick([['truck', 4], ['bus', 1.2], ['sedan', 3], ['hatch', 2.5], ['pickup', 2], ['van', 0.8], ['sport', 0.4]]);
    case 'road': return wpick([['pickup', 3], ['hatch', 3], ['sedan', 2], ['truck', 1.5], ['van', 1]]);
    case 'avenue': return wpick([['hatch', 4], ['sedan', 3.5], ['taxi', 1.5], ['bus', 1.1], ['pickup', 1.2], ['van', 1], ['sport', 0.5], ['truck', 0.4]]);
    default: return wpick([['hatch', 5], ['sedan', 3], ['taxi', 1], ['pickup', 1.5], ['van', 1.2], ['sport', 0.5]]);
  }
}
class AICar {
  constructor(e, dir, s, lane, model) {
    this.id = Traffic.idc++;
    this.m = VMODELS[model]; this.model = model;
    this.big = model === 'truck' || model === 'bus';
    this.color = model === 'taxi' ? '#f2f2ee' : model === 'bus' ? pick(['#2a6fd1', '#d13a2a', '#1f9a5a', '#e0a020']) : model === 'tractor' ? pick(['#2e8b3a', '#c0392b', '#2e5fae']) : pick(CAR_COLORS);
    this.box = pick(['#d9d6cc', '#e8e8e8', '#c9c3b5', '#d07a2a', '#5a7aa0']);
    this.mass = this.big ? 6 : model === 'tractor' ? 3 : 1.6;
    this.vmax = model === 'truck' ? 235 : model === 'bus' ? 190 : model === 'tractor' ? 70 : model === 'van' ? 205 : 1e9;
    this.acc = this.big ? 70 : model === 'tractor' ? 45 : rnd(120, 160);
    this.turnV = this.big ? 55 : model === 'tractor' ? 40 : 82;
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
  }
  edgePos(s) { return [this.from.x + this.dx * s - this.dy * this.off, this.from.y + this.dy * s + this.dx * this.off]; }
  allowed(e) {
    if (this.model === 'bus' && e.T.id === 'dirt') return false;
    if (this.model === 'tractor' && (e.T.id === 'highway' || e.T.id === 'avenue' || e.T.id === 'street')) return false;
    if (this.model === 'truck' && e.T.id === 'street' && chance(0.7)) return false;
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
  canEnter(remain, now) {
    const n = this.to;
    if (n.light) {
      const st = lightState(n, this.e.h ? 'H' : 'V', now);
      const go = st === 'G' || (st === 'Y' && remain < 25);
      if (go && (this.turnType === 'left' || this.turnType === 'uturn')) {
        for (const o of Traffic.cars) {
          if (o === this || o.e.h !== this.e.h || o.dir === this.dir || o.turnType === 'left') continue;
          if (o.state === 'edge' && o.to === n && o.sEnd - o.s < 150 && o.v > 10) return false;
          if (o.state === 'turn' && o.turn.node === n && o.turnType === 'straight') return false;
        }
      }
      return go;
    }
    if (n.edges.length >= 3) {
      if (!n.res || n.res === this || !n.res.alive || now - n.resT > 6) { n.res = this; n.resT = now; return true; }
      return false;
    }
    return true;
  }
  startTurn() {
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
    for (let i = 1; i <= 12; i++) { const q = bez(p0, c1, c2, p3, i / 12); len += Math.hypot(q[0] - lx, q[1] - ly); lx = q[0]; ly = q[1]; }
    this.turn = { p0, c1, c2, p3, len: Math.max(len, 1), t: 0, node: n };
    this.state = 'turn';
  }
  finishTurn() {
    const n = this.turn.node;
    if (n.res === this) n.res = null;
    this.setEdge(this.next.e, this.next.dir, this.next.lane);
    this.s = this.sStart; this.state = 'edge';
    this.chooseNext();
  }
  hit(imp, nx, ny) {
    this.hitT = Math.max(this.hitT, 0.8 + Math.min(2, imp / 250));
    const k = Math.min(10, imp * 0.03) / this.mass * 1.6;
    this.ox += nx * k; this.oy += ny * k;
    if (imp > 60) this.honkT = Math.min(this.honkT, 0.3);
  }
  scanAhead() {
    const look = 34 + this.v * 1.15 + this.m.L / 2;
    const c = Math.cos(this.a), s = Math.sin(this.a);
    const lat = this.state === 'turn' ? 20 : 13;
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
    if (this.ghost <= 0) for (const o of Traffic.cars) if (o !== this) check(o, o.x, o.y, o.m.L, o.m.W);
    if (player && Game.state !== 'menu') check(player, player.x, player.y, player.m.L, player.m.W);
    for (const an of Animals.list) if (an.onRoad) check(an, an.x, an.y, an.r * 2, an.r * 2);
    return best;
  }
  update(dt, now) {
    let target = this.cruise;
    if (this.state === 'edge') {
      const remain = this.sEnd - this.s;
      if (this.turnType !== 'straight') target = Math.min(target, this.turnV + remain * 0.9);
      if (!this.committed && remain < 40 + this.v * 0.9) {
        if (this.canEnter(remain, now)) this.committed = true;
        else target = Math.min(target, Math.max(0, (remain - 2) * 2.2));
      }
    } else target = this.turnType === 'straight' ? this.cruise : this.turnV;
    const gap = this.scanAhead();
    if (gap < 1e9) target = Math.min(target, Math.max(0, (gap - 8) * 2.0));
    if (this.hitT > 0) { this.hitT -= dt; target = 0; }
    this.ghost -= dt;
    if (this.v < 5 && target < 5) this.wait += dt; else this.wait = Math.max(0, this.wait - dt * 2);
    if (this.wait > 4 && gap < 1e9 && this.ghost <= 0 && this.blockCycle()) { this.ghost = 2; this.wait = 0; }
    this.honkT -= dt;
    if (this.honkT <= 0) {
      this.honkT = rnd(2.5, 4.5);
      if (player && Game.state === 'playing' && ((this.blocker === player && this.wait > 2) || this.hitT > 0)) {
        AudioSys.aiHorn(Math.hypot(this.x - player.x, this.y - player.y));
        this.honking = 0.35;
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
    for (const n of [this.to, this.from]) if (n.res === this) n.res = null;
    if (this.turn && this.turn.node.res === this) this.turn.node.res = null;
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
    while (this.cars.length > mx) this.cars.pop().release();
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
    this.col = type === 'cow' ? pick(['#ece7dc', '#ece7dc', '#8a5a3a', '#2a2420']) : type === 'horse' ? pick(['#6a4026', '#3a2618', '#d8cfc0', '#8a5a34']) : type === 'chicken' ? pick(['#f2efe6', '#b56a2a', '#3a2a1e']) : type === 'dog' ? pick(['#c98a3a', '#c98a3a', '#2a2420', '#e8e0d0', '#7a5a3a']) : '#7a5a3c';
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
  for (const d of World.animalsDef) for (let i = 0; i < d.n; i++) this.list.push(new Animal(d.type, d.rect));
};
Animals.update = function (dt, cx, cy) {
  for (const a of this.list) if (Math.abs(a.x - cx) < 1700 && Math.abs(a.y - cy) < 1400) a.update(dt);
  this.soundT -= dt;
  if (this.soundT <= 0 && Game.state === 'playing') {
    this.soundT = rnd(5, 11);
    const rk = regionKeyAt(cx, cy), R = REGIONS[rk];
    const r = rnd();
    if (R.rural > 0.6) { if (r < 0.3) AudioSys.owl(); else if (r < 0.55) AudioSys.moo(); else if (r < 0.75) AudioSys.bark(900); }
    else if (rk === 'rio') { if (r < 0.6) AudioSys.frog(); else AudioSys.owl(); }
    else { if (r < 0.35) AudioSys.bark(rnd(500, 1100)); else if (r < 0.5) AudioSys.siren(); else if (r < 0.7) AudioSys.aiHorn(rnd(500, 850)); }
  }
};
function drawAnimal(ctx, an) {
  ctx.save(); ctx.translate(an.x, an.y); ctx.rotate(an.a);
  const walk = an.v > 0 ? Math.sin(an.phase) : 0;
  const graze = an.state === 'graze';
  switch (an.type) {
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
      ctx.rotate(-an.a);
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
    const max = Settings.quality === 'baixa' ? 120 : 320;
    if (this.list.length >= max) this.list.shift();
    this.list.push({ type, x, y, vx, vy, life, max: life, size });
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const k = p.type === 'spark' ? 2.5 : 1.8;
      p.vx *= Math.exp(-k * dt); p.vy *= Math.exp(-k * dt);
      if (p.type !== 'spark') p.size += dt * (p.type === 'dust' ? 14 : 10);
    }
  },
  draw(ctx) {
    for (const p of this.list) {
      const t = p.life / p.max;
      if (p.type === 'spark') continue;
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
  pizzaria: 'Cheiro de lenha e calabresa. O pizzaiolo grita da cozinha: "Tem entrega saindo!"',
  farmacia: 'Aberta 24 horas. A balconista separa uma sacola com receita grampeada.',
  padaria: 'O último pão de queijo da noite ainda está quente no balcão.',
  mercado: 'Prateleiras cheias e um rádio tocando sertanejo baixinho.',
  lanchonete: 'O Bigode vira hambúrgueres na chapa enquanto conta causos.',
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
const FRAGILE = /Bolo|Ovos|bebidas|Arranjo|Buquê|Remédios|Doce/i;
const HOT = /Pizza|X-tudo|Pastéis|Lanches|Esfihas|Marmitas|salgados/i;

const Act = {
  delivery: null, race: null, parkSpot: null, parkHold: 0, parkCd: {}, waypoint: null,
  gps: null, gpsT: 0, gpsTarget: null, prompt: null, hintT: 0, hintI: 0, offers: new Map(), parkLock: null,
  reset() { this.parkLock = null; this.delivery = null; this.race = null; this.parkSpot = null; this.parkHold = 0; this.waypoint = null; this.gps = null; this.gpsTarget = null; this.prompt = null; this.offers.clear(); },
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
  Profile.damage = clamp(Profile.damage + k * 9, 0, 100);
  AudioSys.crash(0.2 + k);
  Cam.shake = Math.max(Cam.shake, 3 + k * 12);
  const hx = player.hitX || player.x, hy = player.hitY || player.y;
  for (let i = 0; i < 4 + k * 12; i++) Particles.emit('spark', hx, hy, rnd(-220, 220), rnd(-220, 220), rnd(0.2, 0.5), 2);
  if (Act.delivery && Act.delivery.fragile && imp > 130) {
    Act.delivery.hits++;
    toast('Carga frágil!', 'A encomenda sofreu um impacto (−15%).', 'bad');
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
  if (Act.delivery) return { x: Act.delivery.dest.x, y: Act.delivery.dest.y, kind: 'delivery' };
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
  // entrega em andamento
  if (Act.delivery) {
    const d = Act.delivery;
    d.t += dt;
    if (Math.hypot(d.dest.x - p.x, d.dest.y - p.y) < 70 && sp < 40) finishDelivery();
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
      for (const r of World.races) {
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
  if (Profile.fuel < 22) { const s = nearestShop('posto'); return ['Combustível baixo', 'Procure um posto: ' + (s ? s.name : '') + '. Marque no mapa (M).']; }
  if (Profile.damage > 55) return ['Carro avariado', 'Passe na Oficina Dois Irmãos, no Distrito Industrial.'];
  const cheapest = CARS.filter((c) => !Profile.owned[c.id]).sort((a, b) => a.price - b.price)[0];
  const list = [
    ['Exploração livre', 'Comércios com marcador amarelo oferecem entregas. Pare em frente e aperte E.'],
    ['Exploração livre', 'Pontos de interesse descobertos: ' + disc + '/' + totP + '. O mapa (M) mostra o que falta perto de você.'],
    ['Exploração livre', 'Percursos cronometrados começam nas bandeiras azuis. Medalha de ouro paga bem.'],
    ['Exploração livre', 'Caderneta de visitas: ' + vis + '/' + totV + ' estabelecimentos. Cada visita nova rende R$ 100.'],
    ['Exploração livre', 'Vagas marcadas em azul pagam por um estacionamento perfeito. De ré vale mais.'],
    ['Exploração livre', 'Clique no mapa (M) para traçar uma rota no GPS até qualquer lugar.'],
  ];
  if (cheapest && Profile.money >= cheapest.price) list.push(['Carro novo disponível', 'Você já pode comprar o ' + cheapest.name + ' na sua garagem.']);
  return list[Act.hintI % list.length];
}
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
const SQ = 0.86;      // achatamento vertical: câmera levemente inclinada
const TILT_H = 0.24;  // objetos altos se inclinam para o norte, mostrando a face sul

function resize() {
  SCREEN_W = window.innerWidth; SCREEN_H = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  RS = Settings.quality === 'alta' ? Math.min(dpr, 2) : Settings.quality === 'baixa' ? Math.min(dpr, 1) * 0.8 : Math.min(dpr, 1.25);
  canvas.width = Math.round(SCREEN_W * RS); canvas.height = Math.round(SCREEN_H * RS);
  LS = Settings.quality === 'alta' ? 0.6 : Settings.quality === 'baixa' ? 0.33 : 0.45;
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
function maxChunks() { return Settings.quality === 'baixa' ? 30 : 46; }
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
const WIN_STYLES = { house: 1, farmhouse: 1, office: 2, tower: 2, church: 2, shop: 3, workshop: 3, garage: 3, kiosk: 3 };
function wallWindows(ctx, b, ax, ay, bx, by, ox, oy, side, emissive) {
  const ws = WIN_STYLES[b.style];
  if (!ws) return;
  const ext = Math.hypot(ox, oy);
  if (ext < 2.2) return;
  const len = Math.hypot(bx - ax, by - ay);
  let floors, cols;
  if (ws === 1) { floors = b.h > 40 ? 2 : 1; cols = Math.max(1, Math.floor(len / 30)); }
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
  } else wallWindows(ctx, b, ax, ay, bx, by, ox, oy, side, false);
  if (b.style === 'garage' && b.front === side) {
    ctx.fillStyle = '#5c6470';
    const s0 = 0.12, s1 = 0.88;
    ctx.beginPath(); ctx.moveTo(ax + (bx - ax) * s0, ay + (by - ay) * s0); ctx.lineTo(ax + (bx - ax) * s1, ay + (by - ay) * s1); ctx.lineTo(ax + (bx - ax) * s1 + ox * 0.78, ay + (by - ay) * s1 + oy * 0.78); ctx.lineTo(ax + (bx - ax) * s0 + ox * 0.78, ay + (by - ay) * s0 + oy * 0.78); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(bx + ox * 0.08, by + oy * 0.08); ctx.lineTo(ax + ox * 0.08, ay + oy * 0.08); ctx.closePath(); ctx.fill();
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
  if (alpha < 1) ctx.globalAlpha = 1;
}
function drawBuildingEmissive(ctx, b) {
  const [ox, oy] = bldOffset(b);
  const { x0, y0, x1, y1 } = b;
  if (ox > 0.3) wallWindows(ctx, b, x0, y1, x0, y0, ox, oy, 'W', true); else if (ox < -0.3) wallWindows(ctx, b, x1, y0, x1, y1, ox, oy, 'E', true);
  if (oy > 0.3) wallWindows(ctx, b, x0, y0, x1, y0, ox, oy, 'N', true); else if (oy < -0.3) wallWindows(ctx, b, x1, y1, x0, y1, ox, oy, 'S', true);
  if (b.sign) { const gs = signGlow(b); ctx.globalAlpha = 0.9; ctx.drawImage(gs, x0 + ox - 10, y0 + oy - 10); ctx.globalAlpha = 1; }
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
      const [ox, oy] = offAt(o.x, o.y, o.h);
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
    case 'busstop': {
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
      if (o.broken) return;
      const [ox, oy] = offAt(o.hx, o.hy, o.h);
      const hex = lightHex(o.col);
      ctx.drawImage(glowSprite(hex), o.hx + ox - 16, o.hy + oy - 16, 32, 32);
      ctx.drawImage(glowSprite('#ffffff'), o.hx + ox - 5, o.hy + oy - 5, 10, 10);
      break;
    }
    case 'tlight': {
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
  const want = R.rural > 0.5 && Settings.quality !== 'baixa' ? 45 : 0;
  while (Fireflies.list.length < want) Fireflies.list.push({ x: Cam.x + rnd(-900, 900), y: Cam.y + rnd(-600, 600), ph: rnd(TAU), vx: rnd(-8, 8), vy: rnd(-8, 8) });
  if (Fireflies.list.length > want) Fireflies.list.length = want;
  for (const f of Fireflies.list) {
    f.ph += dt; f.x += (f.vx + Math.sin(f.ph * 0.7) * 6) * dt; f.y += (f.vy + Math.cos(f.ph * 0.9) * 6) * dt;
    if (Math.abs(f.x - Cam.x) > 1000 || Math.abs(f.y - Cam.y) > 700) { f.x = Cam.x + rnd(-900, 900); f.y = Cam.y + rnd(-600, 600); }
  }
}
function carLightsInfo(c, isPlayer) {
  const m = c.m, ca = Math.cos(c.a), sa = Math.sin(c.a);
  const hl = m.L / 2, hw = m.W / 2 - 4;
  const cy = c.y - vehLift(m);
  return { ca, sa, fx: c.x + ca * hl, fy: cy + sa * hl, rx: c.x - ca * hl, ry: cy - sa * hl, nx: -sa * hw, ny: ca * hw };
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
    cone(player, player.highBeam ? 520 : 360, 1);
    lctx.globalAlpha = 0.55; lctx.drawImage(LSPR, player.x - 105, player.y - 105, 210, 210);
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
    if (L.flick) { const f = Math.sin(T * 23 + L.seed * 50) + Math.sin(T * 7.3 + L.seed * 9); i *= f > 1.2 ? 0.2 : 1; }
    const a = (L.shop ? 0.32 : L.canopy ? 0.12 : L.flood ? 0.1 : 0.17) * i;
    gctx.globalAlpha = a;
    gctx.drawImage(glowSprite(lightHex(L.col)), L.x - L.r * 0.85, L.y - L.r * 0.85, L.r * 1.7, L.r * 1.7);
  }
  // reflexos das luzes na água
  for (const L of _lq) {
    if (!L.refl || L.y + L.refl < view.y0 - 100 || L.y > view.y1) continue;
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
  if (player && Game.state !== 'menu') cone(player, player.highBeam ? 520 : 360, 0.12);
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
    ctx.globalAlpha = 0.95;
    for (const s of [1, -1]) ctx.drawImage(head, I.fx + I.nx * s - 9, I.fy + I.ny * s - 9, 18, 18);
    const tr = brake ? 15 : 9;
    ctx.globalAlpha = brake ? 1 : 0.7;
    for (const s of [1, -1]) ctx.drawImage(tail, I.rx + I.nx * s - tr, I.ry + I.ny * s - tr, tr * 2, tr * 2);
    if (brake) { ctx.globalAlpha = 0.25; ctx.drawImage(tail, I.rx - 30, I.ry - 30, 60, 60); }
    if (rev) { ctx.globalAlpha = 0.8; for (const s of [1, -1]) ctx.drawImage(white, I.rx + I.nx * s * 0.5 - 7, I.ry + I.ny * s * 0.5 - 7, 14, 14); }
    if (blink && (T * 2.6) % 1 < 0.5) {
      ctx.globalAlpha = 0.9;
      const s = blink;
      ctx.drawImage(amber, I.fx + I.nx * s * 1.2 - 8, I.fy + I.ny * s * 1.2 - 8, 16, 16);
      ctx.drawImage(amber, I.rx + I.nx * s * 1.2 - 8, I.ry + I.ny * s * 1.2 - 8, 16, 16);
    }
    if (c.model === 'taxi') { ctx.globalAlpha = 0.8; ctx.drawImage(amber, c.x - 7, c.y - 7, 14, 14); }
    if (c.model === 'bus') { ctx.globalAlpha = 0.6; ctx.drawImage(amber, I.fx - I.ca * 4 - 10, I.fy - I.sa * 4 - 10, 20, 20); }
  };
  for (const c of Traffic.cars) {
    if (c.x < view.x0 - 300 || c.x > view.x1 + 300 || c.y < view.y0 - 300 || c.y > view.y1 + 300) continue;
    const nearNode = c.state === 'turn' || (c.sEnd - c.s) < 150;
    carGlow(c, c.braking || c.hitT > 0 || c.v < 3, false, nearNode ? c.blink : 0, false);
  }
  if (player && Game.state !== 'menu') carGlow(player, player.braking || Keys.Space, player.rev, 0, true);
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
  // destino da entrega
  if (Act.delivery) {
    const d = Act.delivery.dest;
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
  // veículos e animais
  for (const an of Animals.list) if (an.type !== 'owl' && inView(view, an.x, an.y, 30)) drawAnimal(ctx, an);
  for (const c of Traffic.cars) {
    if (!inView(view, c.x, c.y, 80)) continue;
    drawVehicle(ctx, c.m, c.color, c.x, c.y, c.a, { steer: c.steerVis, roll: c.roll, brake: c.braking || c.v < 3, box: c.box });
  }
  if (player && Game.state !== 'menu') {
    drawVehicle(ctx, player.m, player.color, player.x, player.y, player.a, { steer: player.steer * 1.4, roll: player.roll, lean: player.lean, brake: player.braking || Keys.Space, rev: player.rev, dirt: Profile.dirt, damage: Profile.damage, cargo: !!Act.delivery });
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
  glowPass(view, cx, cy);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(lightCanvas, 0, 0, W, Hh);
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(glowCanvas, 0, 0, W, Hh);
  ctx.globalCompositeOperation = 'source-over';
  ctx.setTransform(z, 0, 0, z * SQ, W / 2 - cx * z, Hh / 2 - cy * z * SQ);
  emissivePass(view, _talls);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/* ---------- mapa (minimapa e mapa grande) ---------- */
let MAPIMG = null;
const MAP_S = 0.1;
function buildMapImage() {
  const c = makeCanvas(GW, GH), g = c.getContext('2d');
  const img = g.createImageData(GW, GH), d = img.data;
  const COLS = [[34, 52, 30], [92, 96, 104], [70, 72, 76], [120, 96, 68], [24, 64, 96], [140, 112, 80], [74, 76, 80], [62, 80, 40], [96, 78, 56], [150, 136, 100]];
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
    mm.strokeStyle = '#5be38f'; mm.lineWidth = 5 / scale * k * 0.5; mm.lineJoin = 'round';
    mm.beginPath(); Act.gps.pts.forEach((p, i) => (i ? mm.lineTo(p[0], p[1]) : mm.moveTo(p[0], p[1]))); mm.stroke();
  }
  const ic = (x, y, kind) => { mm.save(); mm.translate(x, y); mm.rotate(-rot); mm.scale(1 / scale * k * 1.05, 1 / scale * k * 1.05); mapIcon(mm, 0, 0, kind, 1.1); mm.restore(); };
  for (const c of Traffic.cars) { if (Math.abs(c.x - player.x) > R * 1.5 || Math.abs(c.y - player.y) > R * 1.5) continue; mm.fillStyle = 'rgba(255,255,255,0.55)'; mm.fillRect(c.x - 12, c.y - 12, 24, 24); }
  for (const s of World.shops) ic(s.x, s.y, shopIconKind(s));
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
const bigCanvas = document.getElementById('bigmap'), bg = bigCanvas.getContext('2d');
let bigMapXf = { s: 1, ox: 0, oy: 0 };
function drawBigMap() {
  if (!MAPIMG) return;
  const r = bigCanvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (bigCanvas.width !== Math.round(r.width * dpr) || bigCanvas.height !== Math.round(r.height * dpr)) { bigCanvas.width = Math.round(r.width * dpr); bigCanvas.height = Math.round(r.height * dpr); }
  const W = bigCanvas.width, H = bigCanvas.height;
  const s = Math.min(W / WORLD_W, H / WORLD_H) * 0.98;
  const ox = (W - WORLD_W * s) / 2, oy = (H - WORLD_H * s) / 2;
  bigMapXf = { s: s / dpr, ox: ox / dpr, oy: oy / dpr };
  bg.setTransform(1, 0, 0, 1, 0, 0);
  bg.fillStyle = '#05080a'; bg.fillRect(0, 0, W, H);
  bg.setTransform(s, 0, 0, s, ox, oy);
  bg.drawImage(MAPIMG, 0, 0, WORLD_W, WORLD_H);
  const k = dpr / s;
  bg.font = `600 ${13 * k}px "Segoe UI", Arial`; bg.textAlign = 'center'; bg.fillStyle = 'rgba(255,255,255,0.5)';
  const labels = [['CENTRO', 1600, 1150], ['DISTRITO INDUSTRIAL', 3650, 700], ['VILA ESPERANÇA', 1150, 4100], ['JARDIM DAS PALMEIRAS', 3400, 4700], ['RIO CLARO', 5450, 5000], ['SÍTIO BOA VISTA', 7500, 2600], ['FAZENDA SANTA LUZIA', 7700, 5000], ['RODOVIA BR-NOITE', 4200, 6370]];
  for (const [t, x, y] of labels) bg.fillText(t, x, y);
  if (Act.gps) { bg.strokeStyle = '#5be38f'; bg.lineWidth = 4 * k; bg.beginPath(); Act.gps.pts.forEach((p, i) => (i ? bg.lineTo(p[0], p[1]) : bg.moveTo(p[0], p[1]))); bg.stroke(); }
  const ic = (x, y, kind) => { bg.save(); bg.translate(x, y); bg.scale(k * 1.3, k * 1.3); mapIcon(bg, 0, 0, kind, 1.25); bg.restore(); };
  for (const p of World.pois) ic(p.x, p.y, Profile.discovered.includes(p.id) ? 'poi' : 'unknown');
  for (const s2 of World.shops) ic(s2.x, s2.y, shopIconKind(s2));
  for (const r2 of World.races) ic(r2.start[0], r2.start[1], 'race');
  for (const sp of World.parkSpots) ic(sp.x, sp.y, 'park');
  const t = currentTarget();
  if (t) { ic(t.x, t.y, 'gps'); }
  if (player) {
    bg.save(); bg.translate(player.x, player.y); bg.rotate(player.a); bg.scale(k * 1.6, k * 1.6);
    bg.fillStyle = '#fff'; bg.strokeStyle = '#000'; bg.lineWidth = 2;
    bg.beginPath(); bg.moveTo(10, 0); bg.lineTo(-7, -7); bg.lineTo(-3, 0); bg.lineTo(-7, 7); bg.closePath(); bg.stroke(); bg.fill();
    bg.restore();
  }
  for (const p of World.pois) if (Profile.discovered.includes(p.id)) { bg.fillStyle = 'rgba(230,200,255,0.85)'; bg.font = `600 ${10 * k}px "Segoe UI", Arial`; bg.fillText(p.name, p.x, p.y - 12 * k); }
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
    if (id === 'screen-map') requestAnimationFrame(drawBigMap);
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
      case 'map': Screens.open('screen-map'); break;
      case 'abandon': abandonActivity(); Screens.closeAll(); break;
      case 'reset': resetVehicle(); Screens.closeAll(); break;
      case 'save-quit': saveGame(); toMenu(); break;
    }
  });
  $('confirm-no').addEventListener('click', () => { AudioSys.back(); Screens.back(); });
  $('confirm-yes').addEventListener('click', () => { AudioSys.click(); const fn = confirmBox.fn; Screens.back(); if (fn) fn(); });
  // mapa: clique para marcar destino
  bigCanvas.addEventListener('click', (e) => {
    if (Game.mode !== 'play') return;
    const r = bigCanvas.getBoundingClientRect();
    const x = (e.clientX - r.left - bigMapXf.ox) / bigMapXf.s, y = (e.clientY - r.top - bigMapXf.oy) / bigMapXf.s;
    if (x < 0 || y < 0 || x > WORLD_W || y > WORLD_H) return;
    const ne = nearestEdge(x, y);
    const px = ne.e.h ? ne.e.a.x + ne.s : ne.e.a.x, py = ne.e.h ? ne.e.a.y : ne.e.a.y + ne.s;
    Act.waypoint = { x: px, y: py };
    Act.gpsT = 0; Act.gps = null;
    if (player) { Act.gps = gpsRoute(player.x, player.y, px, py); }
    AudioSys.click();
    drawBigMap();
  });
  bigCanvas.addEventListener('contextmenu', (e) => { e.preventDefault(); Act.waypoint = null; Act.gps = null; AudioSys.back(); drawBigMap(); });
  window.addEventListener('resize', () => { resize(); if (Screens.current === 'screen-map') drawBigMap(); });
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
      d.innerHTML = `<div class="gname">${c.name}</div><div class="gsub"><span>${{ hatch: 'Hatch', van: 'Furgão', pickup: 'Picape', sedan: 'Sedã', sport: 'Esportivo', muscle: 'Clássico' }[c.model]}</span>${st}</div>`;
      d.addEventListener('click', () => { this.sel = c.id; this.previewColor = null; AudioSys.click(); this.render(); });
      d.addEventListener('mouseenter', () => AudioSys.hover());
      list.appendChild(d);
    }
    $('garage-car-title').textContent = sel.name;
    $('garage-car-desc').textContent = sel.desc;
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
    if (!Profile.owned[sel.id]) {
      if (Profile.money < sel.price) { AudioSys.error(); return; }
      Profile.money -= sel.price;
      Profile.owned[sel.id] = true;
      const cfg = carCfg(sel.id);
      if (this.previewColor) cfg.color = this.previewColor;
      this.previewColor = null;
      AudioSys.money();
      toast('Novo veículo!', sel.name + ' agora é seu.', 'good');
      UI.moneyDelta(-sel.price);
    }
    Profile.current = sel.id;
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
    if (player && player.car.id === sel.id) player.recalc();
    saveGame(); this.render();
  },
};
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
  drawVehicle(gpx, m, col, 0, 0, a, { steer: Math.sin(Garage.t * 0.9) * 0.3, roll: Garage.t * 10, dirt: 0 });
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
  const KIND = { posto: 'POSTO DE COMBUSTÍVEL', oficina: 'OFICINA MECÂNICA', pizzaria: 'PIZZARIA', farmacia: 'FARMÁCIA', padaria: 'PADARIA', mercado: 'MERCADO', lanchonete: 'LANCHONETE', bar: 'BAR', floricultura: 'FLORICULTURA', hotel: 'HOTEL', churrascaria: 'CHURRASCARIA', borracharia: 'BORRACHARIA', sitio: 'SÍTIO', fazenda: 'FAZENDA' };
  $('dialog-kind').textContent = KIND[s.kind] || 'ESTABELECIMENTO';
  $('dialog-title').textContent = s.name;
  $('dialog-text').textContent = SHOP_TEXT[s.kind] || '';
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
      Profile.damage -= fix; Profile.money -= c; UI.moneyDelta(-c); AudioSys.wrench();
      toast('Oficina', 'Lataria e mecânica revisadas.', 'good');
      saveGame(); openShopDialog(s);
    }, Profile.damage < 1 || Profile.money < 4);
    B('Melhorias e pintura', () => { Garage.sel = Profile.current; Screens.replace('screen-garage'); });
  }
  if (s.kind === 'borracharia') B('Calibrar os pneus (grátis)', () => { Profile.damage = Math.max(0, Profile.damage - 3); AudioSys.pump(); toast('Borracharia', 'Pneus calibrados. Valeu, chefe!', 'info'); closeDialog(); });
  if (s.kind === 'bar') B('Pedir um guaraná — R$ 6', () => { Profile.money -= 6; UI.moneyDelta(-6); toast('Bar do Toninho', 'Guaraná trincando de gelado.', 'info'); closeDialog(); }, Profile.money < 6);
  if (s.kind === 'lanchonete') B('Comer um pastel — R$ 8', () => { Profile.money -= 8; UI.moneyDelta(-8); toast('Lanchonete do Bigode', 'Pastel de carne com caldo de cana. Perfeito.', 'info'); closeDialog(); }, Profile.money < 8);
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
  UI.set('clock', clockStr());
  UI.set('money-value', fmtMoney(Profile.money));
  // objetivo
  let title, desc = '', meta = '', cls = '';
  if (Act.race) {
    const R = Act.race;
    title = 'Percurso: ' + R.r.name; cls = 'race';
    desc = R.count > 0 ? 'Prepare-se…' : 'Checkpoint ' + (R.idx + 1) + ' de ' + R.r.pts.length;
    meta = 'Ouro ' + fmtTime(R.r.gold) + ' · Prata ' + fmtTime(R.r.silver) + ' · Bronze ' + fmtTime(R.r.bronze);
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
  UI.set('car-name', player.car.name);
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
  setTimeout(() => toast('Bem-vindo a BR NIGHT DRIVE', 'A noite é sua. Explore à vontade — pare nos comércios e aperte E para pegar entregas.', 'info'), 600);
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
    if (k === 'KeyM' && Screens.current === 'screen-map') { Screens.back(); continue; }
    if (Game.state !== 'playing') continue;
    switch (k) {
      case 'KeyE': if (Act.prompt) Act.prompt.act(); break;
      case 'KeyM': Screens.open('screen-map'); AudioSys.click(); break;
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
  Particles.update(dt);
  updateActivities(dt);
}
function stepMenu(dt) {
  Game.time += dt;
  Traffic.update(dt, Game.time, Cam.x, Cam.y, Cam.view);
  Animals.update(dt, Cam.x, Cam.y);
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
  if (AudioSys.ok) {
    const R = REGIONS[regionKeyAt(Cam.x, Cam.y)];
    const river = clamp(1 - (Math.abs(Cam.x - riverCX(Cam.y)) - 160) / 650, 0, 1);
    const p = player;
    AudioSys.update({
      active: Game.state === 'playing' && !!p, rpm: p ? p.rpm : 900, thr: p ? p.thr : 0, speed: p ? p.speed : 0, slip: p ? p.slip : 0,
      surfaceRough: p ? SURF[p.surface].rough : 0, rural: R.rural, city: R.city, river, pitch: p ? p.car.pitch : 1,
    });
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
  $('fps').classList.toggle('hidden', !Settings.showFps);
  prog(0.04, 'Preparando texturas…'); await tick();
  buildPatterns(); buildLightSprites();
  RNG = mulberry32(20261108);
  const steps = [
    [buildRoadGraph, 'Traçando ruas…'], [buildRiver, 'Enchendo o Rio Claro…'], [buildRoadSurface, 'Asfaltando as avenidas…'],
    [buildCity, 'Erguendo bairros e comércios…'], [buildHighwayStrip, 'Abrindo a rodovia…'], [buildRural, 'Plantando o interior…'],
    [buildRoadProps, 'Acendendo os postes…'], [buildActivitiesData, 'Espalhando segredos pela cidade…'],
  ];
  for (let i = 0; i < steps.length; i++) { prog(0.08 + i / steps.length * 0.72, steps[i][1]); await tick(); steps[i][0](); }
  prog(0.84, 'Desenhando o mapa…'); await tick();
  buildMapImage();
  Traffic.prepare();
  Animals.build();
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

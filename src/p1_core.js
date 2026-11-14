/* =====================================================================
   BR NIGHT DRIVE
   Jogo de exploração noturna top-down 2.5D — HTML5 Canvas + JS puro
   ===================================================================== */
'use strict';
const GAME_VERSION = '1.8.0';
try { document.querySelectorAll('.game-ver').forEach(e => { e.textContent = GAME_VERSION; }); } catch (e) {}
// dica na tela de carregamento
const LOAD_TIPS = ['Parado com o farol aceso por muito tempo, a bateria arria. Aperte H.', 'Sem dinheiro? O Seu Zé faz fiado. Só não some, que ele cobra.', 'De ré na vaga azul vale mais dinheiro.', 'Casca de banana na pista escorrega de verdade.', 'Na blitz da Lei Seca, pare ao lado do guarda de colete.', 'Depois das 22h tem racha. Cuidado com a viatura.', 'Pneus gastam mais quando você derrapa.', 'O Banestresse empresta, mas desconta toda virada de noite.', 'Q abre o celular. O mapa fica no app Mapa.', 'Óleo vencido faz o motor soltar fumaça e perder força.', 'Carona na BR rende gorjeta se você não bater.', 'Na chuva o carro escorrega mais, e no barro mais ainda.', 'F11 deixa o jogo em tela cheia.'];
function loadTipHTML() { return '<b>DICA</b>' + LOAD_TIPS[Math.floor(Math.random() * LOAD_TIPS.length)]; }
try { const el = document.getElementById('load-tip'); if (el) el.innerHTML = loadTipHTML(); } catch (e) {}
// no app do computador (Windows) aparece o botão SAIR DO JOGO
try { if (window.brnd && window.brnd.desktop) document.querySelectorAll('.desk-only').forEach((e) => e.classList.remove('hidden')); } catch (e) {}

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
// altura da câmera em 3 níveis: 1 = 140% (mais perto, padrão), 2 = 135%, 3 = 130% (o mais alto que dá)
const CAM_LEVELS = { 1: 140, 2: 135, 3: 130 }, CAM_MIN = 130;
const Settings = { weather: 'auto', master: 80, engine: 75, ambient: 65, ui: 60, quality: 'alta', cam: '1', zoom: 140, showFps: false, minimapRotate: false, msgMode: 'audio', radio: 70, radioOff: false, sv: 2 };
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('brnd_settings') || 'null');
    if (s && typeof s === 'object') {
      // configuração antiga (antes dos 3 níveis): câmera volta pro padrão e o gráfico passa a ser Alto uma vez
      if (!s.sv || s.sv < 2) { delete s.zoom; s.cam = '1'; s.quality = 'alta'; s.sv = 2; }
      Object.assign(Settings, s);
    }
  } catch (e) { /* sem storage */ }
  if (!CAM_LEVELS[Settings.cam]) Settings.cam = '1';
  Settings.zoom = CAM_LEVELS[Settings.cam];
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
  // sirene da perseguição: "uóóó-uóóó" contínuo, volume pela distância, lado e Doppler
  sirenSet(k, pan, pitch) {
    if (!this.ok) return;
    const c = this.ctx, t = c.currentTime;
    if (!this.sirO) {
      this.sirG = this.gain(0, this.bus.ambient);
      const sh = c.createWaveShaper(); const n = 256, a = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; a[i] = Math.tanh(x * 2.5); } sh.curve = a;
      const bp = this.filt('bandpass', 1100, 0.8, null);
      this.sirPan = c.createStereoPanner ? c.createStereoPanner() : null;
      sh.connect(bp); if (this.sirPan) { bp.connect(this.sirPan); this.sirPan.connect(this.sirG); } else bp.connect(this.sirG);
      this.sirO = c.createOscillator(); this.sirO.type = 'sawtooth'; this.sirO.frequency.value = 900;
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.type = 'triangle'; lfo.frequency.value = 0.55; lg.gain.value = 320;
      lfo.connect(lg); lg.connect(this.sirO.frequency); this.sirO.connect(sh); this.sirO.start(); lfo.start();
    }
    this.sirG.gain.setTargetAtTime(k * 0.07, t, 0.15);
    this.sirO.frequency.setTargetAtTime(900 * (pitch || 1), t, 0.1);
    if (this.sirPan) this.sirPan.pan.setTargetAtTime(pan || 0, t, 0.1);
  },
  // chuva (ruído filtrado em loop) e trovão
  rainSet(k) {
    if (!this.ok) return;
    const c = this.ctx, t = c.currentTime;
    if (!this.rainG) {
      this.rainG = this.gain(0, this.bus.ambient);
      const lp = this.filt('lowpass', 5200, 0.5, this.rainG), hp = this.filt('highpass', 900, 0.5, lp);
      const s = c.createBufferSource(); s.buffer = this.white; s.loop = true; s.connect(hp); s.start();
    }
    this.rainG.gain.setTargetAtTime(k * 0.13, t, 0.6);
  },
  thunder(dist) {
    if (!this.ok) return;
    const v = clamp(0.32 - dist * 0.08, 0.08, 0.3);
    this.noise(2.8, 140, 0.7, v, 'ambient', 'lowpass'); this.noise(0.5, 600, 0.6, v * 0.6, 'ambient', 'lowpass');
    this.tone(48, 2.2, 'sine', v * 0.6, 'ambient', 32);
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

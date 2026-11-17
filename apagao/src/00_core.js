'use strict';
/* APAGÃO — sobrevivência em Santa Aurora. Base: constantes, sorteio, entrada e utilidades. */
const TW = 64, TH = 32, HW = 32, HH = 16, ZS = 36;
const MW = 224, MH = 224;
const SS = 2;                 // nitidez dos desenhos prontos
const WALL_T = 0.14, LVL_H = 2.7;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hash2(x, y, s) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s | 0) + 7, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function angDiff(a, b) { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
const idx = (x, y) => y * MW + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const isoX = (x, y) => (x - y) * HW;
const isoY = (x, y) => (x + y) * HH;

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return [c, c.getContext('2d')];
}
function hexRgb(h) {
  if (h[0] === '#') h = h.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const _shadeCache = new Map();
function shade(hex, f) {          // f < 1 escurece, f > 1 clareia
  const k = hex + f;
  let v = _shadeCache.get(k);
  if (v) return v;
  const [r, g, b] = hexRgb(hex);
  const m = c => f <= 1 ? Math.round(c * f) : Math.round(c + (255 - c) * (f - 1));
  v = 'rgb(' + clamp(m(r), 0, 255) + ',' + clamp(m(g), 0, 255) + ',' + clamp(m(b), 0, 255) + ')';
  _shadeCache.set(k, v);
  return v;
}
function mixHex(a, b, t) {
  const A = hexRgb(a), B = hexRgb(b);
  const h = v => ('0' + Math.round(v).toString(16)).slice(-2);
  return '#' + h(lerp(A[0], B[0], t)) + h(lerp(A[1], B[1], t)) + h(lerp(A[2], B[2], t));
}
function rgba(hex, a) { const [r, g, b] = hexRgb(hex); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }

/* ---------- Configurações ---------- */
const Settings = { vol: 0.8, sfx: 0.9, mus: 0.45, music: true, shadows: true, zoom: 0, shake: true };
function loadSettings() {
  try { const s = JSON.parse(localStorage.getItem('apagao_cfg') || 'null'); if (s) Object.assign(Settings, s); } catch (e) {}
}
function saveSettings() { try { localStorage.setItem('apagao_cfg', JSON.stringify(Settings)); } catch (e) {} }

/* ---------- Estado geral ---------- */
const G = {
  state: 'menu',            // menu | play | pause | dead
  time: 7 * 60,             // minutos do dia
  day: 1,
  now: 0,                   // segundos reais de jogo
  dt: 0,
  invOpen: false, mapOpen: false,
  waterOff: false,
  kills: 0,
  seed: 20261117,
  shake: 0, hurtFlash: 0,
  sleeping: false,
  msgs: []
};

/* ---------- Entrada ---------- */
const Input = {
  keys: Object.create(null), pressed: [], mx: 0, my: 0, down: false, rdown: false, clicked: false, wheel: 0,
  wx: 0, wy: 0,           // posição do mouse no mundo (em casas)
  init(canvas) {
    window.addEventListener('keydown', e => {
      if (e.code === 'Tab' || e.code === 'Space' || (e.code.startsWith('Arrow'))) e.preventDefault();
      if (!this.keys[e.code]) this.pressed.push(e.code);
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = Object.create(null); this.down = false; });
    canvas.addEventListener('mousemove', e => { this.mx = e.clientX; this.my = e.clientY; });
    canvas.addEventListener('mousedown', e => {
      this.mx = e.clientX; this.my = e.clientY;
      if (e.button === 0) { this.down = true; this.clicked = true; }
      if (e.button === 2) this.rdown = true;
    });
    window.addEventListener('mouseup', e => { if (e.button === 0) this.down = false; if (e.button === 2) this.rdown = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => { this.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  },
  k(code) { return !!this.keys[code]; },
  endFrame() { this.pressed.length = 0; this.clicked = false; this.wheel = 0; }
};

function toast(txt, kind) {
  const last = G.msgs[G.msgs.length - 1];
  if (last && last.txt === txt && last.t > 0.5) { last.t = 3.5; return; }
  G.msgs.push({ txt, kind: kind || '', t: 3.8 });
  if (G.msgs.length > 4) G.msgs.shift();
  if (typeof UI !== 'undefined') UI.toasts();
}
const fmtHora = m => { const h = Math.floor(m / 60) % 24, mi = Math.floor(m % 60); return ('0' + h).slice(-2) + ':' + ('0' + mi).slice(-2); };

/* STREAMER LIFE — utilidades, sorteio e barramento de eventos.
   Tudo fica no espaço global SL (scripts clássicos: o jogo abre direto pelo index.html, sem servidor). */
'use strict';
window.SL = window.SL || {};
(function (SL) {
  const U = SL.U = {};

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.approach = (v, target, rate) => v + (target - v) * rate;

  // Sorteio com semente (mulberry32). Pode ser semeado pelos testes.
  let seedState = (Date.now() ^ 0x9e3779b9) >>> 0;
  U.seed = n => { seedState = (n >>> 0) || 1; };
  U.rand = () => {
    seedState |= 0; seedState = (seedState + 0x6D2B79F5) | 0;
    let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  U.mulberry = seed => {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.ri = (a, b) => a + Math.floor(U.rand() * (b - a + 1));
  U.rf = (a, b) => a + U.rand() * (b - a);
  U.chance = p => U.rand() < p;
  U.pick = arr => arr[Math.floor(U.rand() * arr.length)];
  U.pickR = (arr, r) => arr[Math.floor(r() * arr.length)];
  U.wpick = (items, wfn) => {
    let tot = 0; const ws = items.map(it => { const w = Math.max(0, wfn ? wfn(it) : it.w); tot += w; return w; });
    if (tot <= 0) return items[Math.floor(U.rand() * items.length)];
    let r = U.rand() * tot;
    for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };
  // escolhe chave de um objeto {chave: peso}
  U.wkey = obj => {
    let tot = 0; for (const k in obj) tot += Math.max(0, obj[k]);
    let r = U.rand() * tot;
    for (const k in obj) { r -= Math.max(0, obj[k]); if (r <= 0) return k; }
    return Object.keys(obj)[0];
  };
  U.gauss = () => { let u = 0, v = 0; while (!u) u = U.rand(); while (!v) v = U.rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  U.lognorm = (mu, sig) => Math.exp(mu + sig * U.gauss());
  // Poisson para taxas pequenas/médias (usado no fluxo de público)
  U.poisson = lambda => {
    if (lambda <= 0) return 0;
    if (lambda > 40) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * U.gauss()));
    const L = Math.exp(-lambda); let k = 0, p = 1;
    do { k++; p *= U.rand(); } while (p > L);
    return k - 1;
  };
  U.shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(U.rand() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  U.hash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  U.uid = p => { const G = SL.G; const n = G ? (G.seq = (G.seq || 1) + 1) : Math.floor(Math.random() * 1e9); return (p || 'x') + n.toString(36); };

  // Formatação em português
  const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  const nfm = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  U.money = v => (v < 0 ? '-R$ ' : 'R$ ') + nfm.format(Math.abs(v));
  U.money0 = v => (v < 0 ? '-R$ ' : 'R$ ') + nf0.format(Math.abs(Math.round(v)));
  U.int = v => nf0.format(Math.round(v));
  U.num = v => {
    const a = Math.abs(v);
    if (a >= 1e9) return nf1.format(v / 1e9) + ' bi';
    if (a >= 1e6) return nf1.format(v / 1e6) + ' mi';
    if (a >= 1e4) return nf1.format(v / 1e3) + ' mil';
    return nf0.format(Math.round(v));
  };
  U.pct = (v, d = 0) => (v * 100).toFixed(d).replace('.', ',') + '%';
  U.dur = min => {
    min = Math.max(0, Math.round(min));
    const h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + ' min';
    return m ? h + 'h ' + String(m).padStart(2, '0') + 'min' : h + 'h';
  };
  U.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  U.plural = (n, um, varios) => U.int(n) + ' ' + (Math.round(n) === 1 ? um : varios);
  U.stripAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

  U.throttle = (fn, ms) => {
    let last = 0, timer = null;
    return (...a) => {
      const now = performance.now();
      if (now - last >= ms) { last = now; fn(...a); }
      else if (!timer) timer = setTimeout(() => { timer = null; last = performance.now(); fn(...a); }, ms - (now - last));
    };
  };

  U.store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* sem armazenamento */ } },
  };

  // Compressão LZW (bytes UTF-8 -> caracteres de 15 bits) para caber mais no armazenamento do navegador
  U.lzPack = str => {
    const bytes = new TextEncoder().encode(str);
    const dict = new Map(); let next = 257, width = 9, w = '', acc = 0, nb = 0;
    const n = bytes.length; const out = [String.fromCharCode(((n >>> 15) & 0x7fff) + 32), String.fromCharCode((n & 0x7fff) + 32)];
    const emit = code => { acc = (acc << width) | code; nb += width; while (nb >= 15) { nb -= 15; out.push(String.fromCharCode(((acc >>> nb) & 0x7fff) + 32)); } acc &= (1 << nb) - 1; };
    for (let i = 0; i < bytes.length; i++) {
      const c = String.fromCharCode(bytes[i]); const wc = w + c;
      if (wc.length === 1 || dict.has(wc)) { w = wc; continue; }
      emit(w.length === 1 ? w.charCodeAt(0) : dict.get(w));
      if (next < 65535) { dict.set(wc, next++); if (next > (1 << width) && width < 16) width++; }
      else { emit(256); dict.clear(); next = 257; width = 9; }
      w = c;
    }
    if (w) emit(w.length === 1 ? w.charCodeAt(0) : dict.get(w));
    if (nb > 0) out.push(String.fromCharCode(((acc << (15 - nb)) & 0x7fff) + 32));
    return out.join('');
  };
  U.lzUnpack = s => {
    if (s.length < 2) return '';
    const total = ((s.charCodeAt(0) - 32) << 15) | (s.charCodeAt(1) - 32);
    let acc = 0, nb = 0, pos = 2, width = 9, next = 257, dict = [], prev = null; const bytes = [];
    for (let i = 0; i < 256; i++) dict[i] = [i];
    const read = () => { while (nb < width) { if (pos >= s.length) return -1; acc = ((acc << 15) | (s.charCodeAt(pos++) - 32)) >>> 0; nb += 15; } nb -= width; const v = (acc >>> nb) & ((1 << width) - 1); acc &= (1 << nb) - 1; return v; };
    while (bytes.length < total) {
      const code = read(); if (code < 0) break;
      if (code === 256) { dict.length = 257; next = 257; width = 9; prev = null; continue; }
      let entry;
      if (code < dict.length && dict[code]) entry = dict[code];
      else if (prev) entry = prev.concat([prev[0]]);
      else break;
      for (let j = 0; j < entry.length; j++) bytes.push(entry[j]);
      if (prev && next < 65535) { dict[next++] = prev.concat([entry[0]]); }
      if (next + 1 > (1 << width) && width < 16) width++;
      prev = entry;
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  };

  // limita o tamanho de uma lista (mantém os mais novos no fim)
  U.cap_list = (arr, n) => { if (arr.length > n) arr.splice(0, arr.length - n); return arr; };

  // cor: mistura e clareia
  U.shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
  };
  U.rgba = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };

  // Barramento de eventos entre sistemas
  const handlers = {};
  SL.bus = {
    on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); return fn; },
    off(ev, fn) { const h = handlers[ev]; if (h) { const i = h.indexOf(fn); if (i >= 0) h.splice(i, 1); } },
    emit(ev, data) {
      const h = handlers[ev]; if (!h) return;
      for (const fn of h.slice()) { try { fn(data); } catch (e) { console.error('[bus ' + ev + ']', e); } }
    },
  };

  SL.D = SL.D || {};
  SL.Apps = SL.Apps || {};
})(window.SL);

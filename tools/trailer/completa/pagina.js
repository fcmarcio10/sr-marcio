// Gameplay completa: roda dentro da página do jogo ANTES do código do jogo (addInitScript, depois do relogio.js).
// - Som em passo com a imagem: o jogo toca num OfflineAudioContext que anda um quadro por vez junto com o vídeo,
//   então motor, pneus, avisos, ambiente, vozes e rádio saem exatamente como no jogo (sem tocar de novo depois).
// - Áudios de arquivo (vozes, rádio, pedestres) viram um Audio de mentira que toca no mesmo contexto.
// - Piloto: dirige o carro com a física de verdade do jogo (acelera, freia e vira o volante) seguindo a rota do GPS.
// - Toque na tela (bolinha onde tocou) e zoom suave em coisas importantes (o resto da tela continua aparecendo).
(() => {
  const SR = 48000;
  const REC = window.REC = { gravando: false, ctx: null, tocando: new Set(), focos: [], log: [] };
  const noop = () => Promise.resolve();
  const prepara = (c) => { if (!c._resume) { c._resume = c.resume.bind(c); c.resume = noop; } return c; };
  REC.ctx = prepara(new OfflineAudioContext(2, SR, SR));
  REC.dec = new OfflineAudioContext(2, SR, SR); // só para decodificar mp3
  window.AudioContext = window.webkitAudioContext = function () { return REC.ctx; };

  /* ---------- Audio de mentira (o tempo segue o relógio da gravação) ---------- */
  const BUF = new Map();
  const decode = (src) => {
    if (BUF.has(src)) return BUF.get(src);
    const pr = (async () => {
      let ab;
      if (src.startsWith('data:')) { const bin = atob(src.slice(src.indexOf(',') + 1)), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); ab = u8.buffer; }
      else ab = await (await fetch(src)).arrayBuffer();
      return REC.dec.decodeAudioData(ab);
    })();
    BUF.set(src, pr); return pr;
  };
  class FakeAudio {
    constructor(src) {
      this.src = src || ''; this._vol = 1; this.paused = true; this.ended = false; this.onended = null; this._ls = {}; this.readyState = 4; this._pos = 0; this._t0 = 0; this.duration = NaN;
      if (src) decode(src).then((b) => { this._buf = b; this.duration = b.duration; this._agenda(); this._liga(); }, () => {});
    }
    get currentTime() { return this.paused ? this._pos : this._pos + (performance.now() - this._t0) / 1000; }
    set currentTime(x) { const t = !this.paused; if (t) this.pause(); this._pos = Math.max(0, +x || 0); if (t) this.play(); }
    get volume() { return this._vol; }
    set volume(v) { this._vol = v; if (this._g) this._g.gain.setValueAtTime(v, this._g.context.currentTime); }
    play() { if (!this.paused) return Promise.resolve(); this.paused = false; this.ended = false; this._t0 = performance.now(); REC.tocando.add(this); this._agenda(); this._liga(); return Promise.resolve(); }
    pause() { if (this.paused) return; this._pos = this.currentTime; this.paused = true; clearTimeout(this._tm); this._desliga(); REC.tocando.delete(this); }
    _agenda() { clearTimeout(this._tm); if (this.paused || !this._buf) return; const r = this._buf.duration - this.currentTime; this._tm = setTimeout(() => this._fim(), Math.max(0, r * 1000)); }
    _fim() { if (this.paused) return; this._pos = this._buf.duration; this.paused = true; this.ended = true; this._desliga(); REC.tocando.delete(this); if (this.onended) try { this.onended(); } catch (e) {} for (const f of this._ls.ended || []) try { f(); } catch (e) {} }
    _liga() {
      this._desliga(); if (this.paused || !this._buf || !REC.gravando) return;
      const c = REC.ctx, s = c.createBufferSource(), g = c.createGain(); s.buffer = this._buf; g.gain.value = this._vol; s.connect(g); g.connect(c.destination);
      const off = this.currentTime; if (off >= this._buf.duration) return;
      s.start(c.currentTime, off); this._s = s; this._g = g;
    }
    _desliga() { if (this._s) { try { this._s.stop(); } catch (e) {} try { this._s.disconnect(); this._g.disconnect(); } catch (e) {} } this._s = this._g = null; }
    addEventListener(t, f) { if (t === 'loadedmetadata' || t === 'canplay' || t === 'canplaythrough') { setTimeout(f, 0); return; } (this._ls[t] = this._ls[t] || []).push(f); }
    removeEventListener(t, f) { if (this._ls[t]) this._ls[t] = this._ls[t].filter((x) => x !== f); }
    load() {} canPlayType() { return 'probably'; }
  }
  window.Audio = FakeAudio;

  // troca o contexto do som (gravando: o que anda junto com o vídeo; fora da gravação: um que nunca toca)
  REC.troca = function (ctx) {
    REC.ctx = prepara(ctx);
    for (const a of REC.tocando) a._desliga();
    if (typeof AudioSys !== 'undefined' && AudioSys.ctx) {
      AudioSys.ctx = null; AudioSys.ok = false;
      for (const k of ['sirO', 'sirPan', 'rainG', 'mGain', 'mLP', 'mNext']) AudioSys[k] = null;
      AudioSys.init();
      if (typeof Ambiente !== 'undefined') { Ambiente.fundos = {}; Ambiente.tocando = 0; }
      if (typeof frame === 'function') frame.mudo = undefined;
    }
    for (const a of REC.tocando) a._liga();
  };
  // começa a gravar n quadros: o som anda junto (suspende a cada quadro)
  REC.inicia = async function (n) {
    const c = new OfflineAudioContext(2, Math.ceil((n + 40) / 60 * SR), SR);
    REC.gravando = true; REC.k = 0; REC.troca(c);
    const p = c.suspend(1 / 60); REC.render = c.startRendering(); await p;
  };
  REC.passo = async function () {
    window.__VT.step(1000 / 60); REC.k++;
    REC.aplicaFoco();
    if (!REC.gravando) return;
    const c = REC.ctx, p = c.suspend((REC.k + 1) / 60); c._resume(); await p;
  };
  // termina a gravação do trecho: devolve o som (16 bits, intercalado, em pedaços de base64)
  REC.termina = async function () {
    const c = REC.ctx; c._resume(); const buf = await REC.render;
    REC.gravando = false; REC.troca(new OfflineAudioContext(2, SR, SR));
    const n = Math.round(REC.k * SR / 60), L = buf.getChannelData(0), R = buf.getChannelData(1), a = new Int16Array(n * 2);
    for (let i = 0; i < n; i++) { a[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; a[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
    REC.pcm = new Uint8Array(a.buffer); return REC.pcm.length;
  };
  REC.pedaco = function (i, m) { const u = REC.pcm.subarray(i, i + m); let s = ''; for (let k = 0; k < u.length; k += 0x8000) s += String.fromCharCode.apply(null, u.subarray(k, k + 0x8000)); return btoa(s); };

  /* ---------- toque na tela e zoom suave ---------- */
  let ov = null;
  const css = `#rec-ov{position:fixed;inset:0;z-index:999999;pointer-events:none}
  #rec-ov .tq{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.28);border:3px solid rgba(255,255,255,.9);box-shadow:0 0 0 2px rgba(0,0,0,.25);animation:recTq .6s ease-out forwards}
  @keyframes recTq{0%{transform:scale(.6);opacity:0}25%{transform:scale(1);opacity:1}100%{transform:scale(1.15);opacity:0}}
  #phone-body [data-app="trapaca"]{display:none!important}`;
  const garanteOv = () => {
    if (ov) return ov;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    ov = document.createElement('div'); ov.id = 'rec-ov'; document.documentElement.appendChild(ov); // fora do body: o zoom não mexe nele
    return ov;
  };
  const elDe = (a) => (typeof a === 'string' ? document.querySelector(a) : a);
  // toca num botão de verdade e mostra a bolinha no lugar
  REC.toque = function (alvo) {
    const el = elDe(alvo); if (!el) { REC.log.push('sem alvo: ' + alvo); return false; }
    const r = el.getBoundingClientRect(), d = document.createElement('div'); d.className = 'tq';
    d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top + r.height / 2) + 'px'; garanteOv().appendChild(d); setTimeout(() => d.remove(), 700);
    el.click(); return true;
  };
  REC.toqueTexto = function (re, sel) { const b = [...document.querySelectorAll(sel || 'button, [data-act], [data-app]')].filter((x) => x.offsetParent !== null).find((x) => new RegExp(re, 'i').test(x.textContent)); return b ? REC.toque(b) : (REC.log.push('sem botão: ' + re), false); };
  REC.tecla = function (code) { KeyPress.push(code); };
  // zoom suave: aproxima um pouco no alvo (o alvo fica no mesmo lugar e cresce), segura e volta ao normal
  REC.foco = function (alvo, seg, z) {
    const el = elDe(alvo); let r;
    if (el && el.getBoundingClientRect) { const b = el.getBoundingClientRect(); if (!b.width) return false; r = [b.left + b.width / 2, b.top + b.height / 2]; } else if (Array.isArray(alvo)) r = alvo; else return false;
    const W = innerWidth, H = innerHeight;
    const cx = Math.max(W * 0.12, Math.min(W * 0.88, r[0])), cy = Math.max(H * 0.12, Math.min(H * 0.88, r[1]));
    REC.focos.push({ t0: performance.now(), dur: (seg || 3) * 1000, z: z || 1.16, cx, cy }); return true;
  };
  const suave = (x) => x * x * (3 - 2 * x);
  REC.aplicaFoco = function () {
    const now = performance.now(), ent = 700;
    REC.focos = REC.focos.filter((f) => now < f.t0 + f.dur + ent * 2);
    let z = 1, cx = innerWidth / 2, cy = innerHeight / 2;
    for (const f of REC.focos) {
      const t = now - f.t0, k = t < ent ? suave(t / ent) : t < ent + f.dur ? 1 : suave(Math.max(0, 1 - (t - ent - f.dur) / ent));
      const zz = 1 + (f.z - 1) * k; if (zz > z) { z = zz; cx = f.cx; cy = f.cy; }
    }
    const b = document.body; if (!b) return;
    if (z <= 1.0005) { if (b.style.transform) b.style.transform = ''; return; }
    b.style.transformOrigin = cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px'; b.style.transform = 'scale(' + z.toFixed(4) + ')';
  };

  /* ---------- piloto: física de verdade, seguindo a rota ---------- */
  const P = REC.piloto = { R: null, vel: 260, auto: false };
  const at = (R, s) => {
    s = Math.max(0, Math.min(R.len, s));
    let lo = 0, hi = R.S.length - 1; while (lo < hi - 1) { const m = (lo + hi) >> 1; if (R.S[m] <= s) lo = m; else hi = m; }
    const k = (s - R.S[lo]) / ((R.S[hi] - R.S[lo]) || 1);
    return [R.P[lo][0] + (R.P[hi][0] - R.P[lo][0]) * k, R.P[lo][1] + (R.P[hi][1] - R.P[lo][1]) * k];
  };
  P.at = at;
  const rail = (route, lane) => {
    const C = [];
    for (let i = 1; i < route.length; i++) { const [ax, ay] = route[i - 1], [bx, by] = route[i], L = Math.hypot(bx - ax, by - ay); for (let s = 0; s < L; s += 6) C.push([ax + (bx - ax) * s / L, ay + (by - ay) * s / L]); }
    C.push(route[route.length - 1]);
    const off = C.map((p, i) => { const a = C[Math.max(0, i - 3)], b = C[Math.min(C.length - 1, i + 3)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [p[0] - dy / l * lane, p[1] + dx / l * lane]; });
    const sm = off.map((p, i) => { let x = 0, y = 0, n = 0; for (let k = -8; k <= 8; k++) { const q = off[Math.max(0, Math.min(off.length - 1, i + k))]; x += q[0]; y += q[1]; n++; } return [x / n, y / n]; });
    const S = [0]; for (let i = 1; i < sm.length; i++) S.push(S[i - 1] + Math.hypot(sm[i][0] - sm[i - 1][0], sm[i][1] - sm[i - 1][1]));
    return { P: sm, S, len: S[S.length - 1], s: 0 };
  };
  const estica = (R, x, y, para) => { // estica o fim até perto de (x, y)
    const fim = R.P[R.P.length - 1], L = Math.hypot(x - fim[0], y - fim[1]) - (para || 0); if (L <= 4) return;
    const ux = (x - fim[0]) / (L + (para || 0)), uy = (y - fim[1]) / (L + (para || 0)), n = Math.ceil(L / 6);
    for (let i = 1; i <= n; i++) { const q = [fim[0] + ux * L * i / n, fim[1] + uy * L * i / n], u = R.P[R.P.length - 1]; R.S.push(R.S[R.S.length - 1] + Math.hypot(q[0] - u[0], q[1] - u[1])); R.P.push(q); }
    R.len = R.S[R.S.length - 1];
  };
  // vai até (x, y) pela rota do GPS; "para": distância do alvo onde fica parado; "entra": entra até o ponto (pátio, oficina)
  P.vai = function (x, y, opt) {
    opt = opt || {};
    const r = gpsRoute(player.x, player.y, x, y); if (!r) { REC.log.push('sem rota'); return null; }
    const pts = r.pts.slice(1, -1); if (pts.length < 2) pts.unshift([player.x, player.y]);
    const R = rail(pts, opt.lane || 24);
    estica(R, x, y, opt.entra ? 0 : opt.para !== undefined ? opt.para : 46);
    R.vel = opt.vel || P.vel; R.alvo = [x, y]; R.fimT = 0; R.preso = 0;
    R.s = P.perto(R, 0, 120);
    P.R = R; return R;
  };
  // segue uma lista de pontos (ex.: os pontos do racha), ligando um ao outro pela rota
  P.segue = function (pts, opt) {
    opt = opt || {}; let all = []; let px = player.x, py = player.y;
    for (const q of pts) { const r = gpsRoute(px, py, q[0], q[1]); if (r) all = all.concat(all.length ? r.pts.slice(2, -1) : r.pts.slice(1, -1)); px = q[0]; py = q[1]; }
    const R = rail(all, opt.lane || 24); R.vel = opt.vel || P.vel; R.alvo = pts[pts.length - 1]; R.fimT = 0; R.preso = 0; R.s = P.perto(R, 0, 120); P.R = R; return R;
  };
  P.perto = function (R, s0, s1) { let best = s0, bd = 1e9; for (let s = Math.max(0, s0); s <= Math.min(R.len, s1); s += 2) { const q = at(R, s), d = Math.hypot(q[0] - player.x, q[1] - player.y); if (d < bd) { bd = d; best = s; } } return best; };
  // reto para frente a partir de onde está (ex.: entrar no mar)
  P.reto = function (dx, dy, vel) { const R = rail([[player.x, player.y], [player.x + dx, player.y + dy]], 0); R.vel = vel || 150; R.alvo = [player.x + dx, player.y + dy]; R.fimT = 0; R.preso = 0; R.s = 0; P.R = R; return R; };
  P.chegou = () => !P.R;
  P.para = () => { P.R = null; };
  const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  // comandos do volante para este quadro
  P.comandos = function (p) {
    const R = P.R; if (!R) return { brk: p.speed > 4 };
    R.s = P.perto(R, R.s - 10, R.s + 60);
    const q = at(R, R.s), lat = Math.hypot(q[0] - p.x, q[1] - p.y);
    const c = Math.cos(p.a), sn = Math.sin(p.a), vf = p.vx * c + p.vy * sn;
    // velocidade alvo: curvas, carro na frente, gente atravessando e o fim do caminho
    const h = (s) => { const a = at(R, s), b = at(R, s + 12); return Math.atan2(b[1] - a[1], b[0] - a[0]); };
    let curva = 0; for (let d = 10; d <= 130; d += 30) curva = Math.max(curva, Math.abs(ang(h(R.s + d) - h(R.s))) * (1 - d / 260));
    let v = R.vel * (1 - Math.min(1, curva / 1.2) * 0.62);
    const ha = h(R.s);
    for (const a of Traffic.cars) {
      const dx = a.x - p.x, dy = a.y - p.y, u = dx * Math.cos(ha) + dy * Math.sin(ha), l = Math.abs(-dx * Math.sin(ha) + dy * Math.cos(ha));
      if (u > 0 && u < 150 && l < 18) v = Math.min(v, Math.max(0, (a.v || 0) * 0.9 + (u - 55) * 1.6));
      if (Math.hypot(dx, dy) < 40) a.ghost = 2;
    }
    for (const a of Animals.list) {
      if (a.morto || a.oculto) continue;
      const dx = a.x - p.x, dy = a.y - p.y, u = dx * Math.cos(ha) + dy * Math.sin(ha), l = Math.abs(-dx * Math.sin(ha) + dy * Math.cos(ha));
      if (u > 0 && u < 130 && l < 20) v = Math.min(v, Math.max(0, (u - 40) * 1.4));
    }
    const resto = R.len - R.s; v = Math.min(v, Math.sqrt(2 * 330 * Math.max(0, resto - 4)));
    if (Act.race && Act.race.count > 0) v = 0;
    if (P.limite !== undefined) v = Math.min(v, P.limite);
    // volante: persegue um ponto à frente no caminho
    const Ld = 34 + Math.abs(vf) * 0.28, alvo = at(R, R.s + Ld), al = ang(Math.atan2(alvo[1] - p.y, alvo[0] - p.x) - p.a);
    const wb = p.m.L * 0.62, delta = Math.atan(2 * wb * Math.sin(al) / Ld), ganho = 0.42 * p.st.steer / (1 + Math.abs(vf) / 330);
    const steer = Math.max(-1, Math.min(1, delta / ganho));
    const out = { thr: vf < v - 6, brk: vf > v + 22 || (v < 3 && Math.abs(vf) > 3), steer, hb: false };
    // chegou
    if (resto < 10 && Math.abs(vf) < 14) { R.fimT += 1 / 60; if (R.fimT > 0.25) { P.R = null; if (P.fim) { const f = P.fim; P.fim = null; f(); } } }
    // preso ou fora do caminho: volta para o caminho (raro)
    if (Math.abs(vf) < 8 && v > 50) R.preso += 1 / 60; else R.preso = 0;
    if (lat > 70 && R.preso < 1.6 && !R.refeito) { // saiu do caminho: refaz a rota de onde está (sem pular)
      const N = R.alvo && gpsRoute(p.x, p.y, R.alvo[0], R.alvo[1]);
      if (N) { const pts = N.pts.slice(1, -1); if (pts.length < 2) pts.unshift([p.x, p.y]); const R2 = rail(pts, 24); estica(R2, R.alvo[0], R.alvo[1], 30); Object.assign(R2, { vel: R.vel, alvo: R.alvo, fimT: 0, preso: 0, refeito: true }); R2.s = P.perto(R2, 0, 140); P.R = R2; REC.log.push('refez rota ' + Math.round(lat)); return out; }
    }
    if (R.preso > 1.6 || lat > 110) {
      const s2 = Math.min(R.len, R.s + 14), a = at(R, s2), b = at(R, s2 + 12); REC.log.push('reposicionou ' + Math.round(lat));
      p.place(a[0], a[1], Math.atan2(b[1] - a[1], b[0] - a[0])); R.s = s2; R.preso = 0;
    }
    return out;
  };
  // liga o piloto no lugar do teclado (quando não tem caminho, freia até parar)
  REC.ligaPiloto = function () {
    if (player._rec) return;
    const orig = player.update.bind(player);
    player.update = function (dt, inp) { if (P.on) return orig(dt, Object.assign({}, inp, P.comandos(this))); return orig(dt, inp); };
    player._rec = true; P.on = true;
  };
})();

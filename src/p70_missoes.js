/* ============================ MAPA EXPLORADO E CÂMERA DE CINEMA ============================
   (nov/2026: a história e as missões saíram a pedido do dono; o sistema novo de missões vem depois)
   - Nevoa: o mapa do celular começa escuro e vai abrindo por onde o jogador passa.
   - Apresenta: câmera que viaja (com faixas de cinema) até lugares, mostra o nome e volta para o carro.
     Ninguém chama agora: fica pronta para as missões novas (Apresenta.comeca(lugares, fim)). */

/* ---------- mapa explorado (névoa) ---------- */
const NEV_C = 250, NEV_W = Math.ceil(WORLD_W / NEV_C), NEV_H = Math.ceil(WORLD_H / NEV_C);
const Nevoa = { a: null, cv: null, sujo: true, t: 0 };
Nevoa.carrega = function () {
  const N = NEV_W * NEV_H;
  if (typeof Profile.nevoa !== 'string' || Profile.nevoa.length !== N) {
    // quem já jogava antes do mapa explorado fica com o mapa inteiro aberto
    const veterano = !!(Profile.rides || Profile.deliveries || Profile.earned);
    Profile.nevoa = (veterano ? '1' : '0').repeat(N);
  }
  this.a = new Uint8Array(N);
  for (let i = 0; i < N; i++) this.a[i] = Profile.nevoa.charCodeAt(i) === 49 ? 1 : 0;
  this.sujo = true;
};
Nevoa.revela = function (x, y, r) {
  if (!this.a) return 0;
  let n = 0;
  const g0 = Math.max(0, Math.floor((x - r) / NEV_C)), g1 = Math.min(NEV_W - 1, Math.floor((x + r) / NEV_C));
  const h0 = Math.max(0, Math.floor((y - r) / NEV_C)), h1 = Math.min(NEV_H - 1, Math.floor((y + r) / NEV_C));
  for (let gy = h0; gy <= h1; gy++) for (let gx = g0; gx <= g1; gx++) {
    const i = gy * NEV_W + gx;
    if (this.a[i]) continue;
    if (Math.hypot(gx * NEV_C + NEV_C / 2 - x, gy * NEV_C + NEV_C / 2 - y) > r) continue;
    this.a[i] = 1; n++;
  }
  if (n) { this.sujo = true; let s = ''; for (let i = 0; i < this.a.length; i++) s += this.a[i] ? '1' : '0'; Profile.nevoa = s; }
  return n;
};
Nevoa.aberto = function (x, y) {
  if (!this.a) return true;
  const gx = Math.floor(x / NEV_C), gy = Math.floor(y / NEV_C);
  if (gx < 0 || gy < 0 || gx >= NEV_W || gy >= NEV_H) return true;
  return !!this.a[gy * NEV_W + gx];
};
Nevoa.pct = function () { if (!this.a) return 100; let n = 0; for (const v of this.a) n += v; return Math.round(n / this.a.length * 100); };
// imagem pequena (uma casinha por pixel) esticada sobre o mapa com suavização: a borda da névoa fica macia
Nevoa.img = function () {
  if (!this.a) return null;
  if (!this.cv) { this.cv = document.createElement('canvas'); this.cv.width = NEV_W + 2; this.cv.height = NEV_H + 2; }
  if (this.sujo) {
    const g = this.cv.getContext('2d'), im = g.createImageData(NEV_W + 2, NEV_H + 2), d = im.data;
    for (let y = 0; y < NEV_H + 2; y++) for (let x = 0; x < NEV_W + 2; x++) {
      const gx = clamp(x - 1, 0, NEV_W - 1), gy = clamp(y - 1, 0, NEV_H - 1), o = (y * (NEV_W + 2) + x) * 4;
      d[o] = 10; d[o + 1] = 12; d[o + 2] = 16; d[o + 3] = this.a[gy * NEV_W + gx] ? 0 : 252; // área não explorada: quase preta, bloqueada
    }
    g.putImageData(im, 0, 0); this.sujo = false;
  }
  return this.cv;
};
Nevoa.desenha = function (g) {
  const im = this.img(); if (!im) return;
  g.save(); g.imageSmoothingEnabled = true;
  g.drawImage(im, -NEV_C, -NEV_C, (NEV_W + 2) * NEV_C, (NEV_H + 2) * NEV_C);
  g.restore();
};
Nevoa.update = function (dt) {
  if (!player || Game.mode !== 'play') return;
  this.t -= dt; if (this.t > 0) return; this.t = 0.5;
  this.revela(player.x, player.y, 650);
};

/* ---------- apresentação dos lugares (câmera de cinema) ---------- */
const Apresenta = { on: false, fila: [], i: 0, t: 0, fase: 'ida', ox: 0, oy: 0, z0: 1, fim: null, dur: 2 };
Apresenta.comeca = function (lugares, fim) {
  lugares = (lugares || []).filter((q) => q && isFinite(q.x) && isFinite(q.y));
  if (navigator.webdriver && !window.__intro) lugares = []; // testes e gravadores antigos: sem viagem de câmera
  if (!lugares.length || !player || Game.mode !== 'play') { if (fim) fim(); return; }
  this.on = true; this.fila = lugares; this.i = 0; this.fim = fim || null;
  this.z0 = Cam.zoom; this.prox(Cam.x, Cam.y);
  document.body.classList.add('cinema');
  let el = $('cine');
  if (!el) {
    el = document.createElement('div'); el.id = 'cine';
    el.innerHTML = '<i class="cn-top"></i><i class="cn-bot"></i><button id="cine-pular" type="button">Pular <kbd>Enter</kbd></button>';
    document.body.appendChild(el);
    el.querySelector('#cine-pular').addEventListener('click', () => this.pula());
  }
  el.classList.remove('sai'); el.classList.add('on');
  try { AudioSys.tone(220, 1.2, 'triangle', 0.035, 'ui'); AudioSys.tone(330, 1.2, 'triangle', 0.03, 'ui', null, 0.15); } catch (e) {}
};
Apresenta.prox = function (fx, fy) {
  const q = this.fila[this.i];
  this.ox = fx; this.oy = fy; this.t = 0; this.fase = 'ida';
  const tx = q ? q.x : player.x, ty = q ? q.y : player.y;
  this.dur = clamp(Math.hypot(tx - fx, ty - fy) / 2600, 1.1, 2.6);
};
Apresenta.update = function (dt) {
  if (!this.on) return false;
  if (!player || Game.mode !== 'play') { this.encerra(); return false; }
  this.t += dt;
  const q = this.fila[this.i], volta = !q;
  const tx = volta ? player.x : q.x, ty = volta ? player.y : q.y;
  if (this.fase === 'ida') {
    const u = clamp(this.t / this.dur, 0, 1), e = u * u * (3 - 2 * u);
    Cam.x = lerp(this.ox, tx, e); Cam.y = lerp(this.oy, ty, e);
    Cam.zoom = this.z0 * (1 - 0.32 * Math.sin(Math.PI * u) * clamp(this.dur / 1.6, 0.4, 1));
    if (u >= 1) {
      if (volta) { this.encerra(); return false; }
      this.fase = 'olha'; this.t = 0;
      Nevoa.revela(q.x, q.y, q.r || 700);
      Missao.lugar(q.nome, q.sub || '', q.tag || '');
    }
  } else {
    Cam.x = tx + Math.sin(this.t * 0.35) * 18; Cam.y = ty - this.t * 6; Cam.zoom = this.z0 * 1.04;
    if (this.t > (q.seg || 3.4)) { Missao.esconde('ms-lugar'); this.i++; this.prox(Cam.x, Cam.y); }
  }
  return true;
};
Apresenta.pula = function () {
  if (!this.on) return;
  for (let k = this.i; k < this.fila.length; k++) { const q = this.fila[k]; Nevoa.revela(q.x, q.y, q.r || 700); }
  this.encerra();
};
Apresenta.encerra = function () {
  if (!this.on) return;
  this.on = false; Missao.esconde('ms-lugar');
  if (player) { Cam.x = player.x; Cam.y = player.y; Cam.zoom = this.z0; }
  document.body.classList.remove('cinema');
  const el = $('cine'); if (el) { el.classList.add('sai'); setTimeout(() => { if (!this.on) el.classList.remove('on', 'sai'); }, 500); }
  const f = this.fim; this.fim = null; this.fila = [];
  if (f) setTimeout(f, 250);
};

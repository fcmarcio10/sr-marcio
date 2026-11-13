// Roda dentro da página do jogo: trilho (piloto automático), legendas e as cenas do trailer.
(() => {
  const T = window.TR = { f: 0, cap: null, rail: null };
  const V = window.__VT;

  /* ---------- trilho: o carro anda sozinho pela faixa da direita, fazendo as curvas suave ---------- */
  T.makeRail = function (route, lane) {
    // pontos a cada 6 unidades no meio da rua
    const C = [];
    for (let i = 1; i < route.length; i++) {
      const [ax, ay] = route[i - 1], [bx, by] = route[i], L = Math.hypot(bx - ax, by - ay);
      for (let s = 0; s < L; s += 6) C.push([ax + (bx - ax) * s / L, ay + (by - ay) * s / L]);
    }
    C.push(route[route.length - 1]);
    // desloca para a faixa da direita e arredonda as esquinas
    const off = C.map((p, i) => {
      const a = C[Math.max(0, i - 3)], b = C[Math.min(C.length - 1, i + 3)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [p[0] - dy / l * lane, p[1] + dx / l * lane];
    });
    const sm = off.map((p, i) => { let x = 0, y = 0, n = 0; for (let k = -7; k <= 7; k++) { const q = off[Math.max(0, Math.min(off.length - 1, i + k))]; x += q[0]; y += q[1]; n++; } return [x / n, y / n]; });
    const S = [0]; for (let i = 1; i < sm.length; i++) S.push(S[i - 1] + Math.hypot(sm[i][0] - sm[i - 1][0], sm[i][1] - sm[i - 1][1]));
    return { P: sm, S, len: S[S.length - 1] };
  };
  T.at = function (R, s) {
    s = Math.max(0, Math.min(R.len, s));
    let lo = 0, hi = R.S.length - 1; while (lo < hi - 1) { const m = (lo + hi) >> 1; if (R.S[m] <= s) lo = m; else hi = m; }
    const k = (s - R.S[lo]) / ((R.S[hi] - R.S[lo]) || 1);
    return [R.P[lo][0] + (R.P[hi][0] - R.P[lo][0]) * k, R.P[lo][1] + (R.P[hi][1] - R.P[lo][1]) * k];
  };
  T.drive = function (sx, sy, tx, ty, speed, opt) {
    opt = opt || {};
    const r = gpsRoute(sx, sy, tx, ty);
    const R = T.makeRail(r.pts.length > 3 ? r.pts.slice(1, -1) : r.pts, opt.lane || 24);
    return T.useRail(R, speed, opt);
  };
  // chega até (tx, ty) vindo pela rua, começando "before" unidades antes; escolhe o lado que termina mais perto do alvo
  T.toward = function (tx, ty, before, speed, opt) {
    opt = opt || {}; let best = null;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const sx = clamp(tx + dx * 1500, 300, WORLD_W - 300), sy = clamp(ty + dy * 1500, 300, WORLD_H - 300);
      const r = gpsRoute(sx, sy, tx, ty); if (!r || r.pts.length < 4) continue;
      const R = T.makeRail(r.pts.slice(1, -1), opt.lane || 24); if (R.len < before + 30) continue;
      // reta no trecho final (sem esquina no meio da cena)
      const a = T.at(R, R.len - before), b = T.at(R, R.len - before / 2), c = T.at(R, R.len), bend = Math.abs(angDiff(Math.atan2(c[1] - b[1], c[0] - b[0]), Math.atan2(b[1] - a[1], b[0] - a[0])));
      const d = Math.hypot(c[0] - tx, c[1] - ty) + bend * 300;
      if (!best || d < best.d) best = { R, d };
    }
    if (!best) return null;
    opt.skip = Math.max(0, best.R.len - before);
    return T.useRail(best.R, speed, opt);
  };
  T.useRail = function (R, speed, opt) {
    R.s = opt.skip || 0; R.v = opt.v0 !== undefined ? opt.v0 : speed; R.speed = speed; T.rail = R;
    const p0 = T.at(R, R.s), p1 = T.at(R, R.s + 10);
    player.place(p0[0], p0[1], Math.atan2(p1[1] - p0[1], p1[0] - p0[0]));
    Cam.x = p0[0]; Cam.y = p0[1]; Cam.zoom = screenZoomBase() * (Settings.zoom || 140) / 100;
    Traffic.fill(Cam.x, Cam.y); forceGround = true;
    return R;
  };
  T.railStep = function (p, dt) {
    const R = T.rail;
    const a0 = T.at(R, R.s), a1 = T.at(R, R.s + 12), b0 = T.at(R, R.s + 70), b1 = T.at(R, R.s + 82);
    const ha = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]), hb = Math.atan2(b1[1] - b0[1], b1[0] - b0[0]);
    let v = R.speed * (1 - Math.min(1, Math.abs(angDiff(hb, ha)) / 1.3) * 0.55); // freia nas curvas
    // carro parado na frente: diminui (e se encostar, vira "fantasma" pra não bater)
    for (const c of Traffic.cars) {
      const dx = c.x - p.x, dy = c.y - p.y, u = dx * Math.cos(ha) + dy * Math.sin(ha), l = Math.abs(-dx * Math.sin(ha) + dy * Math.cos(ha));
      if (u > 0 && u < 120 && l < 16) v = Math.min(v, Math.max(0, (c.v || 0) * 0.95 + (u - 50)));
      if (Math.hypot(dx, dy) < 34) c.ghost = 2;
    }
    v = Math.min(v, Math.max(0, (R.len - R.s) * 2.4)); // chega parando no fim
    if (R.s >= R.len - 1) v = 0;
    if (Act.race && Act.race.count > 0) v = 0; // espera a largada do racha
    if (R.stopAt !== undefined && R.s >= R.stopAt) v = 0;
    R.v += Math.max(-520 * dt, Math.min(240 * dt, v - R.v));
    R.s += R.v * dt;
    const q0 = T.at(R, R.s), q1 = T.at(R, R.s + 10), a = Math.atan2(q1[1] - q0[1], q1[0] - q0[0]);
    p.steer = Math.max(-0.5, Math.min(0.5, angDiff(a, p.a) / Math.max(dt, 1e-3) * 0.06));
    p.x = q0[0]; p.y = q0[1]; p.px = p.x; p.py = p.y; p.a = a;
    p.vx = Math.cos(a) * R.v; p.vy = Math.sin(a) * R.v;
    p.rpm = 1100 + (R.v % 140) * 30; p.gear = 1 + Math.min(4, Math.floor(R.v / 140)); p.thr = R.v < v ? 1 : 0; p.braking = R.v > v + 25;
    p.roll = (p.roll || 0) + R.v * dt * 0.25; p.lean = 0; p.drift = 0; p.slip = 0; p.surface = groundAt(p.x, p.y);
  };
  // câmera deslocada (ex.: na praia, olhar um pouco pra baixo pra mostrar a areia e o mar)
  const _render = window.render;
  window.render = function () { const o = T.camOff; if (o) { Cam.x += o[0]; Cam.y += o[1]; } _render(); if (o) { Cam.x -= o[0]; Cam.y -= o[1]; } };
  T.hook = function () {
    if (player._tr) return;
    const orig = player.update.bind(player);
    player.update = function (dt, inp) { if (T.rail) T.railStep(this, dt); else orig(dt, inp); };
    player._tr = true;
  };

  /* ---------- legendas e cartelas (por cima do jogo) ---------- */
  const ov = document.createElement('div'); ov.id = 'tr-ov';
  ov.innerHTML = '<div class="tr-black"></div><div class="tr-logo"></div><div class="tr-cap"><b></b><i></i></div>';
  document.body.appendChild(ov);
  const st = document.createElement('style');
  st.textContent = `#tr-ov{position:fixed;inset:0;z-index:99999;pointer-events:none}
  #tr-ov .tr-black{position:absolute;inset:0;background:#000;opacity:0}
  #tr-ov .tr-logo{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0}
  #tr-ov .tr-logo .logo{transform:scale(1.35)}
  #tr-ov .tr-logo .tr-tag{margin-top:64px;font-family:var(--f-cond);font-weight:800;font-size:30px;letter-spacing:.32em;color:#e9edf5;text-transform:uppercase;text-shadow:2px 2px 0 #05070b}
  #tr-ov .tr-cap{position:absolute;left:84px;bottom:175px;opacity:0;max-width:70vw}
  #tr-ov .tr-cap b{display:block;font-family:var(--f-display);font-size:92px;line-height:.95;color:#fff;letter-spacing:.01em;text-transform:uppercase;text-shadow:5px 5px 0 #05070b,0 0 40px rgba(0,0,0,.6)}
  #tr-ov .tr-cap i{display:block;font-style:normal;margin-top:14px;font-family:var(--f-cond);font-weight:800;font-size:30px;letter-spacing:.14em;color:var(--ouro);text-transform:uppercase;text-shadow:3px 3px 0 #05070b}
  body.tr-bigphone #screen-phone .phone{transform:scale(1.75);transform-origin:right center;margin-right:110px}
  body.tr-bigdlg #screen-dialog > *{transform:scale(1.45);transform-origin:center center}
  body.tr-biggar #screen-garage .garage{transform:scale(1.55);transform-origin:46% 36%}
  #tr-ov .tr-vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 55%,rgba(0,0,0,.55) 100%)}`;
  document.head.appendChild(st);
  const vig = document.createElement('div'); vig.className = 'tr-vig'; ov.prepend(vig);
  const logo = document.querySelector('#screen-main .logo'); if (logo) ov.querySelector('.tr-logo').appendChild(logo.cloneNode(true));
  const tag = document.createElement('div'); tag.className = 'tr-tag'; ov.querySelector('.tr-logo').appendChild(tag);
  T.ov = ov;
  // texto grande (entra em 0,3 s e sai em 0,3 s)
  T.caption = function (big, small, f0, f1) { T.cap = { big, small, f0, f1 }; ov.querySelector('.tr-cap b').textContent = big; ov.querySelector('.tr-cap i').textContent = small || ''; };
  T.card = function (black, logoOn, tagText) { T.black = black; T.logoOn = logoOn; tag.textContent = tagText || ''; };
  T.fade = function (f, f0, f1, r) { r = r || 18; if (f < f0 || f > f1) return 0; return Math.min(1, (f - f0) / r, (f1 - f) / r); };

  /* ---------- um quadro ---------- */
  T.step = function () {
    const sl = typeof T.slow === 'function' ? T.slow(T.f) : (T.slow || 1);
    if (!(T.freezeAt !== undefined && T.f >= T.freezeAt)) V.step(1000 / 60 * sl);
    T.f++;
    if (T.onFrame) T.onFrame(T.f);
    T.cine();
    for (const t of document.querySelectorAll('#toasts .toast')) if (/Nova mensagem|Racha contra|Evento:/.test(t.textContent)) t.remove(); // avisos que não interessam no trailer
    if (T.rec && player) T.log.motor.push([T.gf0 + T.f - 1, Math.round(player.speed), +sl.toFixed(3)]);
    const c = T.cap, capEl = ov.querySelector('.tr-cap');
    if (c) { const o = T.fade(T.f, c.f0, c.f1); capEl.style.opacity = o; capEl.style.transform = `translateX(${(1 - o) * -40}px)`; } else capEl.style.opacity = 0;
    ov.querySelector('.tr-black').style.opacity = T.blackO || 0;
    ov.querySelector('.tr-logo').style.opacity = T.logoO || 0;
  };
  // prepara uma cena nova: limpa eventos, celular, legenda, e liga o trilho
  T.reset = function (opt) {
    opt = opt || {};
    T.f = 0; T.cap = null; T.onFrame = null; T.blackO = 0; T.logoO = 0; T.rail = null;
    T.flash0 = opt.flash || 0; T.charBottom = opt.charBottom; T.slow = 1; T.freezeAt = undefined; T.cc = null; T.sub = null; T.punch = null; T.char = null; T.flash = opt.flash || 0; T.lb = opt.lb !== undefined ? opt.lb : T.lb || 0;
    canvas.style.filter = '';
    Screens.closeAll(); Events.clear(); Events.spawnT = 1e9; Act.race = null; Act.ride = null; Act.delivery = null; Act.gps = null; Act.waypoint = null;
    Particles.list.length = 0; Skids.count = 0;
    Profile.time = opt.time || (22 * 60 + 40);
    const rain = opt.rain || 0; Weather.rain = Weather.target = rain; Weather.wet = opt.wet !== undefined ? opt.wet : rain; Settings.weather = rain ? 'chuva' : 'limpo'; Weather.timer = 1e9; Weather.drops.length = 0;
    document.getElementById('hud').style.visibility = opt.hud ? 'visible' : 'hidden';
    const tut = document.getElementById('tutorial'); if (tut) tut.style.display = 'none';
    document.getElementById('toasts').innerHTML = ''; Act.prompt = null;
    T.camOff = opt.camOff || null; document.body.classList.toggle('tr-bigphone', !!opt.bigPhone);
    document.body.classList.toggle('tr-bigdlg', !!opt.bigDlg); document.body.classList.toggle('tr-biggar', !!opt.bigGar);
    Som.on = false; Cam.shake = 0; const rb = document.getElementById('region-banner'); if (rb) rb.style.display = 'none';
    Profile.money = Math.max(Profile.money, 48750);
    Traffic.fill(Cam.x, Cam.y);
    document.getElementById('toasts').style.visibility = opt.toasts ? 'visible' : 'hidden';
    Settings.cam = String(opt.cam || 1); Settings.zoom = CAM_LEVELS[Settings.cam];
    T.hook();
  };

  /* ================= ajudantes das cenas ================= */
  T.spawnEv = function (type, x, y) {
    if (x !== undefined) { player.place(x, y, 0); Cam.x = x; Cam.y = y; }
    for (let i = 0; i < 60; i++) { Events.clear(); if (Events.spawn(type)) break; }
    const E = Events.cur; if (E) { E.life = 1e9; if (E.stage === 'offer') { E.stage = 'wait'; Offer.hide && Offer.hide(); } }
    return E;
  };
  T.follow = function (z0, z1, lead) { lead = lead === undefined ? 0.16 : lead; T.cam({ z: [z0, z1], at: () => [player.x + player.vx * lead, player.y + player.vy * lead], n: T.n }); };
  T.fixo = function (x, y, z0, z1, x2, y2) { T.cam({ z: [z0, z1], at: [x, y], to: x2 !== undefined ? [x2, y2] : null, n: T.n }); };
  // uma pessoa da cidade, colocada num ponto (para a multidão do paredão, por exemplo)
  T.people = function (n, cx, cy, r) {
    const ps = Animals.list.filter((a) => a.type === 'person').slice(0, n);
    ps.forEach((a, i) => { const ang = i / n * Math.PI * 2; a.x = cx + Math.cos(ang) * r * (0.7 + (i % 3) * 0.2); a.y = cy + Math.sin(ang) * r * (0.7 + (i % 2) * 0.3); a.rect = [a.x - 2, a.y - 2, a.x + 2, a.y + 2]; a.v = 0; a.state = 'idle'; a.danceUntil = 1e9; });
    return ps;
  };
  T.beat = (f) => { const b = T.BEATF || 27.69; return Math.floor(f / b) !== Math.floor((f - 1) / b); };

  /* ================= câmera de cinema, camadas e registro de sons ================= */
  const ease = (k) => k * k * (3 - 2 * k);
  // T.cc = { z: [zoom início, zoom fim] (vezes o zoom base da tela), at: [x,y] ou função, to: [x,y], n: quadros, ease }
  T.cc = null;
  const _uc = window.updateCamera;
  window.updateCamera = function (dt) {
    _uc(dt);
    const C = T.cc; if (!C) return;
    const k = C.n > 1 ? Math.min(1, Math.max(0, T.f / (C.n - 1))) : 1, e = C.ease === 'lin' ? k : ease(k);
    if (C.z) Cam.zoom = screenZoomBase() * (C.z[0] + (C.z[1] - C.z[0]) * e);
    const at = typeof C.at === 'function' ? C.at() : C.at;
    if (at) { const to = C.to || at; Cam.x = at[0] + (to[0] - at[0]) * e; Cam.y = at[1] + (to[1] - at[1]) * e; }
  };
  T.cam = function (C) {
    T.cc = C; const at = typeof C.at === 'function' ? C.at() : C.at;
    if (C.z) Cam.zoom = screenZoomBase() * C.z[0];
    if (at) { Cam.x = at[0]; Cam.y = at[1]; } else if (player) { Cam.x = player.x; Cam.y = player.y; }
    forceGround = true;
  };
  // camadas: faixas de cinema, flash, palavra de impacto, legenda de missão e cartão de personagem
  const add = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; ov.appendChild(d); return d; };
  const lbT = add('tr-lb tr-lbt'), lbB = add('tr-lb tr-lbb'), fl = add('tr-flash'), pu = add('tr-punch', '<b></b>');
  const sb = add('tr-sub', '<span></span>'), ch = add('tr-char', '<canvas width="240" height="260"></canvas><div><i></i><b></b><em></em></div>');
  const st2 = document.createElement('style');
  st2.textContent = `#tr-ov .tr-lb{position:absolute;left:0;right:0;height:0;background:#000}#tr-ov .tr-lbt{top:0}#tr-ov .tr-lbb{bottom:0}
  #tr-ov .tr-flash{position:absolute;inset:0;background:#fff;opacity:0}
  #tr-ov .tr-punch{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0}
  #tr-ov .tr-punch b{font-family:var(--f-display);font-size:210px;letter-spacing:.02em;color:#fff;text-transform:uppercase;text-shadow:8px 8px 0 #05070b,0 0 60px rgba(0,0,0,.7)}
  #tr-ov .tr-sub{position:absolute;left:0;right:0;bottom:150px;text-align:center;opacity:0}
  #tr-ov .tr-sub span{display:inline-block;font-family:var(--f-body);font-weight:700;font-size:40px;color:#fff;text-shadow:3px 3px 0 #000,0 0 18px rgba(0,0,0,.9);padding:0 40px}
  #tr-ov .tr-sub y{color:#ffcc2e}#tr-ov .tr-sub c{color:#59e0ff}
  #tr-ov .tr-char{position:absolute;left:110px;bottom:170px;opacity:0;display:flex;align-items:flex-end;gap:42px}
  #tr-ov .tr-char canvas{width:330px;height:358px;border:6px solid var(--cc,#ffcc2e);box-shadow:12px 12px 0 #05070b,0 0 60px rgba(0,0,0,.6);background:#1a1d24}
  #tr-ov .tr-char i{display:block;width:120px;height:12px;margin-bottom:18px}
  #tr-ov .tr-char b{display:block;font-family:var(--f-display);font-size:170px;line-height:.9;text-transform:uppercase;text-shadow:9px 9px 0 #05070b,0 0 50px rgba(0,0,0,.6)}
  #tr-ov .tr-char em{display:block;margin-top:18px;font-style:normal;font-family:var(--f-cond);font-weight:800;font-size:38px;letter-spacing:.12em;color:#fff;text-transform:uppercase;text-shadow:4px 4px 0 #05070b}`;
  document.head.appendChild(st2);
  T.subtitle = function (html, f0, f1) { T.sub = { f0, f1 }; sb.querySelector('span').innerHTML = html; };
  T.word = function (w, f0, f1) { T.punch = { f0, f1 }; pu.querySelector('b').textContent = w; };
  T.charCard = function (name, role, color, f0, retrato) {
    T.char = { f0 }; ch.querySelector('b').textContent = name; ch.querySelector('b').style.color = color; ch.querySelector('i').style.background = color; ch.querySelector('em').textContent = role;
    ch.style.setProperty('--cc', color); ch.style.bottom = (T.charBottom || 170) + 'px'; const cv = ch.querySelector('canvas'); cv.style.display = retrato ? 'block' : 'none'; if (retrato) retrato(cv);
  };
  // retrato do Seu Biu (no estilo do retrato do Seu Zé que já existe no jogo)
  T.drawSeuBiu = function (cv) {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#4a3f22'); bg.addColorStop(1, '#1d1a12'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,220,80,0.07)'; for (let i = 0; i < 5; i++) g.fillRect(10 + i * 46, 24, 30, 40);
    g.translate(W / 2, H / 2 + 14);
    g.fillStyle = '#f1c40f'; g.beginPath(); g.moveTo(-84, 110); g.quadraticCurveTo(-80, 28, 0, 26); g.quadraticCurveTo(80, 28, 84, 110); g.fill(); // camisa amarela
    g.fillStyle = '#d4a20c'; g.fillRect(-4, 34, 8, 76); for (let y = 46; y < 110; y += 18) { g.fillStyle = '#8a6a08'; g.beginPath(); g.arc(0, y, 2.4, 0, TAU); g.fill(); }
    g.fillStyle = '#b07848'; g.fillRect(-13, 6, 26, 24); // pescoço
    g.fillStyle = '#c68a55'; g.beginPath(); g.ellipse(0, -16, 35, 41, 0, 0, TAU); g.fill(); // rosto
    g.fillStyle = '#b07848'; g.beginPath(); g.ellipse(-35, -14, 7, 11, 0, 0, TAU); g.ellipse(35, -14, 7, 11, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(90,50,25,0.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-24, -34); g.quadraticCurveTo(-14, -40, -4, -34); g.moveTo(4, -34); g.quadraticCurveTo(14, -40, 24, -34); g.stroke(); // sobrancelhas
    g.fillStyle = '#1a1410'; g.beginPath(); g.arc(-12, -20, 3, 0, TAU); g.arc(12, -20, 3, 0, TAU); g.fill();
    g.fillStyle = '#a8703f'; g.beginPath(); g.ellipse(0, -6, 6, 9, 0, 0, TAU); g.fill(); // nariz
    g.fillStyle = '#8c8c86'; g.beginPath(); g.moveTo(-24, 6); g.quadraticCurveTo(0, -4, 24, 6); g.quadraticCurveTo(12, 16, 0, 9); g.quadraticCurveTo(-12, 16, -24, 6); g.fill(); // bigode grisalho
    g.strokeStyle = '#5a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(-10, 18); g.quadraticCurveTo(0, 14, 10, 18); g.stroke(); // boca preocupada
    g.fillStyle = '#d9b46a'; g.beginPath(); g.ellipse(0, -50, 62, 13, 0, 0, TAU); g.fill(); // aba do chapéu de palha
    g.fillStyle = '#e6c47c'; g.beginPath(); g.ellipse(0, -60, 34, 20, 0, Math.PI, TAU); g.fill(); g.fillRect(-34, -62, 68, 10);
    g.fillStyle = '#7a3a1a'; g.fillRect(-34, -56, 68, 5); // fita
    g.strokeStyle = 'rgba(120,90,40,0.5)'; g.lineWidth = 1; for (let x = -54; x <= 54; x += 9) { g.beginPath(); g.moveTo(x, -55); g.lineTo(x * 1.08, -45); g.stroke(); }
    // cacho de banana na mão
    g.save(); g.translate(58, 70); g.rotate(-0.5);
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#f7d23a' : '#f1c40f'; g.beginPath(); g.ellipse(i * 9 - 12, 0, 6, 22, 0.25, 0, TAU); g.fill(); g.strokeStyle = '#a07a10'; g.lineWidth = 1; g.stroke(); }
    g.fillStyle = '#5a4a1a'; g.fillRect(-16, -26, 30, 6); g.restore();
    g.fillStyle = '#c68a55'; g.beginPath(); g.ellipse(48, 80, 12, 9, 0, 0, TAU); g.fill(); // mão
  };
  T.cine = function () {
    const f = T.f, lb = Math.round(T.lb || 0);
    lbT.style.height = lb + 'px'; lbB.style.height = lb + 'px';
    fl.style.opacity = Math.max(0, T.flash || 0); T.flash = (T.flash || 0) * 0.82;
    if (T.punch) { const o = T.fade(f, T.punch.f0, T.punch.f1, 4); pu.style.opacity = o; pu.querySelector('b').style.transform = `scale(${1.25 - 0.25 * Math.min(1, (f - T.punch.f0) / 6)})`; } else pu.style.opacity = 0;
    if (T.sub) sb.style.opacity = T.fade(f, T.sub.f0, T.sub.f1, 8); else sb.style.opacity = 0;
    if (T.char) { const k = Math.min(1, Math.max(0, (f - T.char.f0) / 10)); ch.style.opacity = k; ch.style.transform = `translateX(${(1 - k) * -80}px)`; } else ch.style.opacity = 0;
    if (T.freezeAt !== undefined && f >= T.freezeAt) canvas.style.filter = 'saturate(.35) contrast(1.15) brightness(.85)';
  };
  // registro: sons que o jogo toca e velocidade do carro, por quadro gravado (para os efeitos do trailer)
  T.log = { sons: [], motor: [] }; T.rec = false; T.gf0 = 0;
  for (const nm of ['beep', 'chime', 'thud', 'wrench', 'pump', 'checkpoint', 'error', 'click', 'wash', 'siren', 'aiHorn', 'bark']) {
    const fn = AudioSys[nm]; if (typeof fn !== 'function') continue;
    AudioSys[nm] = function () { if (T.rec) T.log.sons.push([T.gf0 + T.f, nm, [...arguments].slice(0, 2)]); return fn.apply(this, arguments); };
  }
  const _pay = window.pay; window.pay = function (v, t) { if (T.rec && v > 0) T.log.sons.push([T.gf0 + T.f, 'grana', [v]]); return _pay.apply(this, arguments); };
  // espirro de poça: é o único "noise" de 0,35 s em passa-banda que o jogo toca
  const _noise = AudioSys.noise;
  AudioSys.noise = function (d, f, q, v, bus, type) { if (T.rec && d === 0.35 && type === 'bandpass' && (f === 1900 || f === 700)) T.log.sons.push([T.gf0 + T.f, 'poca', []]); return _noise.apply(this, arguments); };
})();

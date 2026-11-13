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
    const R = T.makeRail(r.pts, opt.lane || 24);
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
    if (R.s >= R.len - 1) v = 0;
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
  #tr-ov .tr-cap{position:absolute;left:84px;bottom:110px;opacity:0;max-width:70vw}
  #tr-ov .tr-cap b{display:block;font-family:var(--f-display);font-size:92px;line-height:.95;color:#fff;letter-spacing:.01em;text-transform:uppercase;text-shadow:5px 5px 0 #05070b,0 0 40px rgba(0,0,0,.6)}
  #tr-ov .tr-cap i{display:block;font-style:normal;margin-top:14px;font-family:var(--f-cond);font-weight:800;font-size:30px;letter-spacing:.14em;color:var(--ouro);text-transform:uppercase;text-shadow:3px 3px 0 #05070b}
  body.tr-bigphone #screen-phone .phone{transform:scale(1.75);transform-origin:right center;margin-right:110px}
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
    V.step(1000 / 60);
    T.f++;
    if (T.onFrame) T.onFrame(T.f);
    const c = T.cap, capEl = ov.querySelector('.tr-cap');
    if (c) { const o = T.fade(T.f, c.f0, c.f1); capEl.style.opacity = o; capEl.style.transform = `translateX(${(1 - o) * -40}px)`; } else capEl.style.opacity = 0;
    ov.querySelector('.tr-black').style.opacity = T.blackO || 0;
    ov.querySelector('.tr-logo').style.opacity = T.logoO || 0;
  };
  // prepara uma cena nova: limpa eventos, celular, legenda, e liga o trilho
  T.reset = function (opt) {
    opt = opt || {};
    T.f = 0; T.cap = null; T.onFrame = null; T.blackO = 0; T.logoO = 0; T.rail = null;
    Screens.closeAll(); Events.clear(); Events.spawnT = 1e9; Act.race = null; Act.ride = null; Act.delivery = null; Act.gps = null; Act.waypoint = null;
    Particles.list.length = 0; Skids.count = 0;
    Profile.time = opt.time || (22 * 60 + 40);
    const rain = opt.rain || 0; Weather.rain = Weather.target = rain; Weather.wet = opt.wet !== undefined ? opt.wet : rain; Settings.weather = rain ? 'chuva' : 'limpo'; Weather.timer = 1e9; Weather.drops.length = 0;
    document.getElementById('hud').style.visibility = opt.hud ? 'visible' : 'hidden';
    const tut = document.getElementById('tutorial'); if (tut) tut.style.display = 'none';
    document.getElementById('toasts').innerHTML = ''; Act.prompt = null;
    T.camOff = opt.camOff || null; document.body.classList.toggle('tr-bigphone', !!opt.bigPhone);
    Profile.money = Math.max(Profile.money, 48750);
    Traffic.fill(Cam.x, Cam.y);
    document.getElementById('toasts').style.visibility = opt.toasts ? 'visible' : 'hidden';
    Settings.cam = String(opt.cam || 1); Settings.zoom = CAM_LEVELS[Settings.cam];
    T.hook();
  };
})();

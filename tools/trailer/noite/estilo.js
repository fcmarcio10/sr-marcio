// Visual do trailer "Primeira noite" (comédia). Roda depois do cena.js, gameplay/extra.js e cinema/estilo.js.
// letreiro de horário (TR.hora), aviso de ligação e de áudio no zap (TR.notif), rádio no ar no painel (TR.radioNoAr),
// nascer do sol (TR.sol), o carro velho do novato (TR.gou), o carro reformado (TR.reformado), fumaça (TR.fumaca),
// escorregão na casca de banana com a física do jogo (TR.casca) e estrelinhas de tonto (TR.tonto).
(() => {
  const T = window.TR, ov = T.ov;
  const ease = (k) => k * k * (3 - 2 * k);
  const backOut = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
  const st = document.createElement('style');
  st.textContent = `#tr-ov .nt-hora{position:absolute;left:50%;top:44%;display:flex;flex-direction:column;align-items:center;opacity:0;transform:translate(-50%,-50%)}
  #tr-ov .nt-hora b{font-family:var(--f-display);font-weight:400;font-size:190px;line-height:.95;color:#ffd04a;letter-spacing:.03em;text-shadow:9px 9px 0 #05070b,0 0 60px rgba(0,0,0,.75)}
  #tr-ov .nt-hora b i{font-style:normal}
  #tr-ov .nt-hora.txt b{font-size:132px;color:#fff}
  #tr-ov .nt-hora em{margin-top:14px;font-style:normal;font-family:var(--f-cond);font-weight:800;font-size:46px;letter-spacing:.3em;color:#fff;text-transform:uppercase;background:rgba(5,7,11,.72);padding:6px 26px 8px;box-shadow:8px 8px 0 #05070b}
  #tr-ov .nt-not{position:absolute;right:56px;top:230px;width:600px;display:flex;align-items:center;gap:22px;padding:20px 26px;border-radius:24px;background:rgba(20,22,28,.94);box-shadow:0 20px 44px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.06);opacity:0;font-family:var(--f-body);color:#fff}
  #tr-ov .nt-not .ic{width:84px;height:84px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;background:#25d366}
  #tr-ov .nt-not .ic svg{width:48px;height:48px}
  #tr-ov .nt-not b{display:block;font-size:34px;font-weight:800;line-height:1.1}
  #tr-ov .nt-not span{display:block;font-size:25px;opacity:.75;margin-top:4px}
  #tr-ov .nt-not .wv{display:flex;gap:5px;align-items:center;height:34px;margin-top:10px}
  #tr-ov .nt-not .wv i{display:block;width:7px;border-radius:4px;background:#25d366}
  #tr-ov .nt-tonto{position:absolute;left:50%;top:50%;width:0;height:0;opacity:0}
  #tr-ov .nt-tonto svg{position:absolute;width:46px;height:46px;margin:-23px 0 0 -23px;filter:drop-shadow(3px 3px 0 #05070b)}
  #nt-sol{position:fixed;inset:0;z-index:8999;pointer-events:none;opacity:0;mix-blend-mode:screen;
    background:radial-gradient(ellipse at 18% -10%,rgba(255,200,120,1) 0%,rgba(255,150,110,.7) 35%,rgba(190,120,190,.4) 70%,rgba(90,100,170,.25) 100%)}`;
  document.head.appendChild(st);
  const mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; ov.appendChild(d); return d; };

  /* ---------- letreiro de horário (no meio da tela, entra com um "pulo") ---------- */
  const hora = mk('nt-hora', '<b></b><em></em>');
  T.hora = function (big, small, f0, f1, texto) {
    T.ho = { f0, f1, big };
    hora.classList.toggle('txt', !!texto);
    hora.querySelector('b').innerHTML = texto ? big : big.replace(':', '<i>:</i>'); hora.querySelector('em').textContent = small || '';
  };

  /* ---------- aviso de ligação / áudio no zap (canto de cima, à direita) ---------- */
  const IC = {
    tel: '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="#fff"/></svg>',
    zap: '<svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11z" fill="#fff"/></svg>',
  };
  const nt = mk('nt-not', '<div class="ic"></div><div style="flex:1"><b></b><span></span><div class="wv"></div></div>');
  const wv = nt.querySelector('.wv'); for (let i = 0; i < 28; i++) wv.appendChild(document.createElement('i'));
  T.notif = function (tipo, nome, sub, f0, f1) {
    T.no = { f0, f1 }; nt.querySelector('.ic').innerHTML = IC[tipo] || IC.zap;
    nt.querySelector('b').textContent = nome; nt.querySelector('span').textContent = sub || '';
  };

  /* ---------- rádio no ar (o letreiro da Rádio Gambiarra FM do próprio painel do jogo) ---------- */
  T.radioNoAr = function (tag, f0, f1) { T.ra = { tag, f0, f1 }; };

  /* ---------- nascer do sol ---------- */
  const sol = document.createElement('div'); sol.id = 'nt-sol'; document.body.appendChild(sol);
  T.sol = function (k0, k1) { T.so2 = { k0, k1 }; };

  /* ---------- o carro do novato ---------- */
  const VELHA = '#a7956f', NOVA = '#1d63ff';
  // k: 0 = inteiro, 1 = caindo aos pedaços (amassado, sujo, farol fraco)
  T.gou = function (k) {
    Profile.damage = Math.round(k * 70); Profile.dirt = Math.min(1, k > 0 ? 0.3 + k * 0.7 : 0);
    Profile.zones = k > 0 ? { f: k * 0.95, r: k * 0.55, l: k * 0.7, rt: k * 0.45, fL: k * 0.6, fR: k * 0.5 } : null;
    if (player) player.mud = k * 0.5;
  };
  T.reformado = function (on) {
    const cfg = carCfg('pampeiro');
    if (on) { cfg.color = NOVA; Object.assign(carKit('pampeiro'), { finish: 'metal', neon: '#ff2bd6', low: true, spoiler: true, wheels: 'tala', tint: 2 }); }
    else { cfg.color = VELHA; cfg.kit = Object.assign({}, KIT_DEFAULT); }
    if (player && player.car && player.car.id === 'pampeiro') player.setCar('pampeiro');
  };

  /* ---------- fumaça saindo do carro (escapamento e capô) ---------- */
  // taxa: fumacinhas por quadro (0 a ~1,5); dur: quadros (sem dur = a cena toda); de: quadro inicial
  T.fumaca = function (taxa, dur, de) { T.fu = { taxa, f0: de || 0, f1: dur ? (de || 0) + dur : 1e9 }; };
  const solta = () => {
    const F = T.fu; if (!F || !player || T.f < F.f0 || T.f > F.f1) return;
    const c = Math.cos(player.a), s = Math.sin(player.a), L = (player.m && player.m.L) || 40;
    let n = F.taxa; while (n > 0) {
      if (n >= 1 || Math.random() < n) {
        const tipo = Math.random() < 0.7 ? 'steam' : 'smoke';
        if (Math.random() < 0.6) Particles.emit(tipo, player.x - c * L * 0.52 + rnd(-3, 3), player.y - s * L * 0.52 + rnd(-3, 3), -c * 34 + rnd(-16, 16), -s * 34 + rnd(-16, 16), rnd(1.0, 1.9), rnd(8, 13));
        else Particles.emit(tipo, player.x + c * L * 0.36 + rnd(-5, 5), player.y + s * L * 0.36 + rnd(-5, 5), rnd(-12, 12), rnd(-12, 12), rnd(1.1, 2.0), rnd(7, 11));
      }
      n -= 1;
    }
  };

  /* ---------- escorregão na casca de banana (rodopio controlado, pneu cantando de verdade no som do jogo) ---------- */
  // o carro vem pela faixa da direita, pisa nas cascas no quadro fGira, roda umas duas voltas deslizando e para torto
  const ligaGiro = () => {
    if (!player || player._nt) return;
    const prev = player.update;
    player.update = function (dt, inp) { if (T.giro) return T.giro(this, dt); return prev.call(this, dt, inp); };
    player._nt = true;
  };
  T.casca = function (E, speed, fGira) {
    ligaGiro();
    const e = E.edge, h = Math.abs(e.b.y - e.a.y) < Math.abs(e.b.x - e.a.x);
    const lado = h ? Math.sign(E.y - e.a.y) : Math.sign(e.a.x - E.x), ida = lado <= 0 ? 1 : -1;
    const a = h ? (ida > 0 ? 0 : Math.PI) : (ida > 0 ? Math.PI / 2 : -Math.PI / 2), ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
    const lane = 22, cx = (h ? E.x : e.a.x) + nx * lane, cy = (h ? e.a.y : E.y) + ny * lane;
    const D = speed / 60 * fGira; // chega nas cascas no quadro fGira (sem câmera lenta antes)
    const x0 = cx - ux * D, y0 = cy - uy * D;
    E.peels.forEach((p, k) => { if (k < 14) { const d = -30 + k * 8; p.x = cx + ux * d + nx * rnd(-7, 7); p.y = cy + uy * d + ny * rnd(-7, 7); } });
    for (const c of Traffic.cars) { c.release && c.release(); c.dead = true; } Traffic.cars = [];
    T.rail = null; T.manual = null; player.place(x0, y0, a); Cam.x = x0; Cam.y = y0; forceGround = true;
    const S = { s: 0, v: speed, w: 0, lat: 0, ang: a, fase: 0 };
    T.girando = false;
    T.giro = (p, dt) => {
      if (S.fase === 0 && S.s >= D - 6) S.fase = 1;
      if (S.fase === 1) { // rodando: gira forte, perde velocidade, escorrega pro meio da pista
        S.w = Math.min(11, S.w + 40 * dt) * (S.v > 25 ? 1 : 0.9);
        S.v = Math.max(0, S.v - 105 * dt); S.lat = Math.min(26, S.lat + S.v * 0.12 * dt);
        if (S.v <= 0.5 && S.w < 0.4) S.fase = 2;
        if (S.v <= 0.5) S.w *= 0.86;
        S.ang += S.w * dt;
        if (Math.random() < 0.7) Particles.emit('smoke', p.x + rnd(-8, 8), p.y + rnd(-8, 8), rnd(-20, 20), rnd(-20, 20), rnd(0.8, 1.5), rnd(7, 11));
      }
      if (S.fase === 2) { S.v = 0; S.w = 0; }
      S.s += S.v * dt;
      const ox = p.x, oy = p.y;
      p.x = cx - ux * D + ux * S.s - nx * S.lat; p.y = cy - uy * D + uy * S.s - ny * S.lat; p.px = ox; p.py = oy;
      p.a = S.fase === 0 ? a : S.ang;
      p.vx = (p.x - ox) / Math.max(dt, 1e-4); p.vy = (p.y - oy) / Math.max(dt, 1e-4);
      p.slip = S.fase === 1 && S.v > 8 ? 1.2 : 0; p.drift = p.slip; p.steer = S.fase === 1 ? 0.5 : 0; p.braking = S.fase === 1;
      p.rpm = 900 + S.v * 12; p.gear = S.v > 140 ? 2 : 1; p.thr = S.fase === 0 ? 1 : 0; p.surface = groundAt(p.x, p.y);
      p.roll = (p.roll || 0) + S.v * dt * 0.25;
      T.girando = S.fase === 1;
    };
  };

  /* ---------- estrelinhas de tonto girando em cima do carro (o carro fica no meio da tela) ---------- */
  const est = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6L2.5 9.3l6.6-.8z" fill="#ffd23f" stroke="#a77600" stroke-width="1.2"/></svg>';
  const to = mk('nt-tonto', est + est + est);
  T.tonto = function (f0, f1) { T.tn = { f0, f1 }; };

  /* ---------- reinício de cada cena ---------- */
  const _reset = T.reset;
  T.reset = function (opt) {
    opt = opt || {};
    _reset(opt);
    T.ho = null; T.no = null; T.ra = null; T.so2 = null; T.fu = null; T.tn = null; T.girando = false; T.giro = null;
    sol.style.opacity = 0;
    const rp = document.getElementById('hud-radio'); if (rp) rp.classList.add('hidden');
    T.grade(opt.grade === undefined ? 0.4 : opt.grade);
    if (player && player.car && player.car.id === 'pampeiro' && carCfg('pampeiro').color === NOVA && !opt.nova) T.reformado(false);
  };

  /* ---------- desenha as camadas a cada quadro ---------- */
  const _cine = T.cine;
  T.cine = function () {
    _cine();
    const f = T.f;
    solta();
    // horário
    if (T.ho) {
      const H = T.ho, k = f - H.f0, o = f < H.f0 || f > H.f1 ? 0 : Math.min(1, k / 5, (H.f1 - f) / 8);
      const e = Math.min(1, Math.max(0, k / 12)), s = 0.55 + 0.45 * backOut(e);
      hora.style.opacity = o; hora.style.transform = 'translate(-50%,-50%) scale(' + s.toFixed(3) + ')';
      const dp = hora.querySelector('b i'); if (dp) dp.style.opacity = Math.floor(f / 18) % 2 ? 0.25 : 1;
    } else hora.style.opacity = 0;
    // aviso de ligação / zap
    if (T.no) {
      const N = T.no, o = f < N.f0 || f > N.f1 ? 0 : Math.min(1, (f - N.f0) / 8, (N.f1 - f) / 8), e = ease(Math.min(1, Math.max(0, (f - N.f0) / 14)));
      nt.style.opacity = o; nt.style.transform = 'translateX(' + ((1 - e) * 680).toFixed(0) + 'px)';
      wv.querySelectorAll('i').forEach((b, i) => { b.style.height = (6 + Math.abs(Math.sin(f * 0.21 + i * 0.9) * Math.sin(f * 0.07 + i * 0.37)) * 26).toFixed(1) + 'px'; });
    } else nt.style.opacity = 0;
    // rádio no ar
    const rp = document.getElementById('hud-radio');
    if (rp) {
      const R = T.ra, on = R && f >= R.f0 && f <= R.f1;
      rp.classList.toggle('hidden', !on);
      if (on && rp.dataset.tag !== R.tag) { rp.dataset.tag = R.tag; document.getElementById('hr-tag').textContent = R.tag; document.getElementById('hr-who').textContent = 'DJ Biruta'; document.getElementById('hr-txt').textContent = 'Ao vivo na madrugada de São Gambiarra'; }
      if (!on) rp.dataset.tag = '';
    }
    // nascer do sol
    if (T.so2) {
      const k = Math.min(1, Math.max(0, f / Math.max(1, T.n))), v = T.so2.k0 + (T.so2.k1 - T.so2.k0) * ease(k);
      sol.style.opacity = v; canvas.style.filter = 'contrast(1.05) saturate(' + (1.15 + v * 0.2).toFixed(2) + ') brightness(' + (1.03 + v * 0.6).toFixed(2) + ')';
    }
    // estrelinhas de tonto
    if (T.tn) {
      const N = T.tn, o = f < N.f0 || f > N.f1 ? 0 : Math.min(1, (f - N.f0) / 10, (N.f1 - f) / 10);
      to.style.opacity = o; to.style.top = 'calc(50% - ' + Math.round(70 * (Cam.zoom || 1) / 2.5) + 'px)';
      to.querySelectorAll('svg').forEach((sv, i) => { const a = f * 0.09 + i * 2.094, r = 78; sv.style.transform = 'translate(' + (Math.cos(a) * r).toFixed(1) + 'px,' + (Math.sin(a) * r * 0.32).toFixed(1) + 'px) rotate(' + (f * 4 + i * 40) + 'deg) scale(' + (0.85 + 0.25 * Math.sin(a)).toFixed(2) + ')'; sv.style.zIndex = Math.sin(a) > 0 ? 2 : 0; });
    } else to.style.opacity = 0;
  };
})();

// Ajudantes da gameplay (rodam dentro da página do jogo, depois do cena.js):
// registro de TODOS os sons do jogo (para tocar de novo, igualzinho, na montagem), toque na tela,
// tecla apertada, destaque de partes da tela, legendas da narração e cruzar a divisa de bairros.
(() => {
  const T = window.TR, V = window.__VT;

  T.filtroToast = null; // na gameplay todos os avisos do jogo aparecem
  // reset da gameplay: placa do bairro ligada e o dinheiro de verdade (o do trailer enchia o bolso)
  const _reset = T.reset;
  const st0 = document.createElement('style'); st0.textContent = '#toasts{transform:scale(1.55);transform-origin:top right}#phone-body [data-app="trapaca"]{display:none!important}body.gp-soplaca #hud{visibility:visible!important}body.gp-soplaca #hud>*:not(#region-banner){visibility:hidden!important}'; document.head.appendChild(st0);
  T.reset = function (opt) { const m = Profile.money; _reset(opt); Profile.money = m; const rb = document.getElementById('region-banner'); if (rb) rb.style.display = ''; document.body.classList.toggle('gp-soplaca', !!(opt && opt.placa)); };
  /* ---------- quadro global (para os sons caírem no quadro certo do vídeo) ---------- */
  const _vs = V.step;
  V.step = (ms) => { T.inStep = true; try { _vs(ms); } finally { T.inStep = false; } };
  T.quadro = () => T.gf0 + (T.inStep ? T.f : T.f - 1);

  /* ---------- registro dos sons ---------- */
  // só a chamada "de fora" é registrada (chime chama tone por dentro: na montagem, chime toca o tone sozinho)
  const PULA = new Set(['init', 'makeNoise', 'makeEngineCycle', 'loop', 'gain', 'filt', 'setupEngine', 'setupAmbient', 'applyVolumes', 'mNote', 'mNoise', 'mStep']);
  T.som = []; let fundo = 0;
  for (const nm of Object.keys(AudioSys)) {
    const fn = AudioSys[nm];
    if (typeof fn !== 'function' || PULA.has(nm)) continue;
    AudioSys[nm] = function () {
      if (fundo === 0 && T.rec && AudioSys.ok) { let a; try { a = JSON.parse(JSON.stringify([...arguments])); } catch (e) { a = []; } T.som.push([T.quadro(), nm, a]); }
      fundo++; try { return fn.apply(this, arguments); } finally { fundo--; }
    };
  }
  // áudios de voz de verdade (passageiro, Seu Biu...)
  const _vp = VoicePlayer.play, _vst = VoicePlayer.stop;
  VoicePlayer.play = function (m) { if (T.rec && m && m.voice) T.som.push([T.quadro(), 'VOZ', [m.voice.clip]]); return _vp.apply(this, arguments); };
  VoicePlayer.stop = function () { if (T.rec && this.msg) T.som.push([T.quadro(), 'VOZ_PARA', []]); return _vst.apply(this, arguments); };

  /* ---------- camadas: toque, tecla, destaque e legenda ---------- */
  const ov = T.ov, mk = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; ov.appendChild(d); return d; };
  const st = document.createElement('style');
  st.textContent = `#tr-ov .gp-tap{position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;background:rgba(255,255,255,.35);border:4px solid rgba(255,255,255,.95);box-shadow:0 0 0 3px rgba(0,0,0,.35),0 0 24px rgba(255,255,255,.6);animation:gpTap .55s ease-out forwards}
  @keyframes gpTap{0%{transform:scale(.4);opacity:1}60%{transform:scale(1);opacity:.9}100%{transform:scale(1.25);opacity:0}}
  #tr-ov .gp-key{position:absolute;left:50%;bottom:190px;transform:translateX(-50%);display:flex;align-items:center;gap:18px;opacity:0;transition:none}
  #tr-ov .gp-key b{display:inline-flex;align-items:center;justify-content:center;min-width:86px;height:86px;padding:0 18px;border-radius:16px;background:linear-gradient(#f4f6fa,#c9cfda);color:#151821;font-family:var(--f-display);font-size:52px;box-shadow:0 8px 0 #7d8597,0 14px 24px rgba(0,0,0,.55)}
  #tr-ov .gp-key b.down{transform:translateY(6px);box-shadow:0 2px 0 #7d8597,0 6px 12px rgba(0,0,0,.5)}
  #tr-ov .gp-key span{font-family:var(--f-cond);font-weight:800;font-size:34px;letter-spacing:.06em;color:#fff;text-transform:uppercase;text-shadow:3px 3px 0 #000}
  #tr-ov .gp-ring{position:absolute;border:5px solid #ffcc2e;border-radius:16px;box-shadow:0 0 0 3px rgba(0,0,0,.45),0 0 26px rgba(255,204,46,.75);opacity:0;pointer-events:none}
  #tr-ov .gp-ring i{position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;font-style:normal;font-family:var(--f-cond);font-weight:800;font-size:28px;letter-spacing:.08em;text-transform:uppercase;color:#151821;background:#ffcc2e;padding:3px 14px;border-radius:8px}
  #tr-ov .gp-leg{position:absolute;left:0;right:0;bottom:64px;text-align:center;opacity:0}
  #tr-ov .gp-leg span{display:inline-block;max-width:1400px;font-family:var(--f-body);font-weight:700;font-size:40px;line-height:1.25;color:#fff;background:rgba(6,8,12,.62);padding:8px 22px 10px;border-radius:12px;text-shadow:2px 2px 0 rgba(0,0,0,.7)}
  #tr-ov .gp-leg em{font-style:normal;color:#ffcc2e}
  #tr-ov .gp-chap{position:absolute;left:70px;top:64px;opacity:0;font-family:var(--f-cond);font-weight:800;text-transform:uppercase;color:#fff;letter-spacing:.12em}
  #tr-ov .gp-chap small{display:block;font-size:24px;color:#ffcc2e;letter-spacing:.3em}
  #tr-ov .gp-chap b{display:block;font-family:var(--f-display);font-weight:400;font-size:64px;letter-spacing:.02em;text-shadow:4px 4px 0 #05070b}`;
  document.head.appendChild(st);
  const key = mk('gp-key', '<b></b><span></span>'), leg = mk('gp-leg', '<span></span>'), chap = mk('gp-chap', '<small></small><b></b>');

  // toca um botão de verdade (o clique é o do próprio jogo) e mostra a bolinha do toque
  T.tocar = function (alvo) {
    const el = typeof alvo === 'string' ? document.querySelector(alvo) : alvo; if (!el) { console.warn('sem alvo', alvo); return false; }
    const r = el.getBoundingClientRect(), d = document.createElement('div'); d.className = 'gp-tap';
    d.style.left = (r.left + r.width / 2) + 'px'; d.style.top = (r.top + r.height / 2) + 'px'; ov.appendChild(d); setTimeout(() => d.remove(), 650);
    el.click(); return true;
  };
  // aperta uma tecla do jogo (mesmo caminho do teclado) e mostra a tecla na tela
  T.keyT = -1;
  T.tecla = function (code, txt, rotulo) { if (T.rec) T.som.push([T.quadro(), 'FX', ['tecla']]); KeyPress.push(code); T.keyT = T.f; key.querySelector('b').textContent = txt; key.querySelector('span').textContent = rotulo || ''; };
  // destaca uma parte da tela (anel amarelo com o nome)
  T.aneis = [];
  T.destacar = function (sel, nome, f0, f1, cima) {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel; if (!el) { console.warn('sem', sel); return; }
    if (T.rec) T.som.push([T.quadro(), 'FX', ['pop']]);
    const r = el.getBoundingClientRect(), d = mk('gp-ring', '<i>' + nome + '</i>'), m = 8;
    Object.assign(d.style, { left: (r.left - m) + 'px', top: (r.top - m) + 'px', width: (r.width + 2 * m) + 'px', height: (r.height + 2 * m) + 'px' });
    d.querySelector('i').style[cima === false ? 'bottom' : 'top'] = '-46px'; if (cima === false) d.querySelector('i').style.top = 'auto';
    T.aneis.push({ d, f0, f1 });
  };
  T.capitulo = function (sub, tit, f0, f1) { chap.querySelector('small').textContent = sub; chap.querySelector('b').textContent = tit; T.chap = { f0, f1 }; };

  // legendas da narração (quadros globais), montadas pelo gravador a partir de narra/falas.json
  T.legendas = []; T.legDir = 0;
  const _cine = T.cine;
  T.cine = function () {
    _cine();
    const f = T.f, g = T.quadro ? T.gf0 + f - 1 : f;
    // tecla
    const k = T.keyT >= 0 ? f - T.keyT : 99; key.style.opacity = k < 0 ? 0 : k < 40 ? 1 : Math.max(0, 1 - (k - 40) / 10); key.querySelector('b').classList.toggle('down', k >= 2 && k < 9);
    // anéis
    for (const a of T.aneis) { const o = f < a.f0 || f > a.f1 + 8 ? 0 : Math.min(1, (f - a.f0) / 6, (a.f1 + 8 - f) / 8); a.d.style.opacity = o; a.d.style.transform = 'scale(' + (1 + 0.04 * Math.sin(f / 4)) + ')'; }
    // capítulo
    if (T.chap) { const c = T.chap, o = f < c.f0 || f > c.f1 ? 0 : Math.min(1, (f - c.f0) / 10, (c.f1 - f) / 10); chap.style.opacity = o; chap.style.transform = 'translateX(' + ((1 - o) * -30) + 'px)'; } else chap.style.opacity = 0;
    // legenda
    const L = T.legendas.find((l) => g >= l.a && g < l.b);
    if (L) { const sp = leg.querySelector('span'); if (sp.dataset.k !== L.k) { sp.innerHTML = L.html; sp.dataset.k = L.k; } leg.style.opacity = 1; leg.style.right = (T.legDir || 0) + 'px'; } else leg.style.opacity = 0;
  };
  const _limpa = T.limpaGags;
  T.limpaGags = function () { _limpa(); T.onFrame = null; T.cc = null; T.slow = 1; T.freezeAt = undefined; if (canvas) canvas.style.filter = ''; for (const a of T.aneis) a.d.remove(); T.aneis = []; T.keyT = -1; T.chap = null; key.style.opacity = 0; if (T.fixos) T.fixos.clear(); T.escolha = null; T.cada = null; T.sorte = false; T.legDir = 0; };

  /* ---------- cruzar a divisa entre dois bairros (a placa do bairro aparece no quadro fHit) ---------- */
  T.cruzar = function (para, fHit, speed, opt) {
    opt = opt || {};
    const passo = 20, antes = speed / 60 * fHit, tipos = opt.tipo || ['street', 'avenue', 'road', 'highway'];
    const tentados = new Set();
    const lista = opt.perto ? World.edges.slice().sort((a, b) => Math.hypot((a.a.x + a.b.x) / 2 - opt.perto[0], (a.a.y + a.b.y) / 2 - opt.perto[1]) - Math.hypot((b.a.x + b.b.x) / 2 - opt.perto[0], (b.a.y + b.b.y) / 2 - opt.perto[1])) : World.edges;
    for (const e of lista) {
      if (!tipos.includes(e.T.id)) continue;
      const P = (q) => [e.a.x + e.dx * q, e.a.y + e.dy * q];
      let rPrev = regionKeyAt(...P(0));
      for (let s = passo; s <= e.len; s += passo) {
        const r = regionKeyAt(...P(s));
        if (r !== rPrev && (r === para || rPrev === para)) {
          const dir = r === para ? 1 : -1, rA = r === para ? rPrev : r, [cx, cy] = P(s - passo / 2);
          const chave = Math.round(cx / 200) + ',' + Math.round(cy / 200);
          if ((!opt.de || rA === opt.de) && !tentados.has(chave)) {
            tentados.add(chave);
            const ux = e.dx * dir, uy = e.dy * dir, L0 = antes + 260, L1 = opt.depois || 600;
            const r0 = gpsRoute(cx - ux * L0, cy - uy * L0, cx + ux * L1, cy + uy * L1);
            if (r0 && r0.pts.length >= 3) {
              const R = T.makeRail(r0.pts.length > 3 ? r0.pts.slice(1, -1) : r0.pts, opt.lane || 24);
              // onde o trilho entra no bairro "para"
              let sc = -1, ra = regionKeyAt(...T.at(R, 0));
              for (let q = 4; q < R.len; q += 4) { const rq = regionKeyAt(...T.at(R, q)); if (rq === para && ra !== para) { sc = q; break; } ra = rq; }
              if (sc > antes + 20) {
                // trecho reto antes e depois da divisa
                const h = (q) => { const a = T.at(R, q), b = T.at(R, q + 12); return Math.atan2(b[1] - a[1], b[0] - a[0]); };
                const reto = Math.abs(angDiff(h(sc - antes), h(sc))) < 0.15 && Math.abs(angDiff(h(sc), h(Math.min(R.len - 14, sc + 200)))) < 0.15;
                if (reto) {
                  T.useRail(R, speed, { v0: speed, skip: sc - antes });
                  UI.region = regionKeyAt(player.x, player.y); // sem placa no começo da cena
                  return { x: cx, y: cy, de: rA };
                }
              }
            }
          }
        }
        rPrev = r;
      }
    }
    console.warn('sem divisa para', para); return null;
  };
  // objetos que quebram perto de um ponto (poste, hidrante, lixeira, cerca...)
  T.alvos = function (cx, cy, r, f) { const out = []; colGrid.query(cx - r, cy - r, cx + r, cy + r, out); return out.filter((c) => !c.dead && c.brk && f(c)).sort((a, b) => Math.hypot((a.x ?? a.x0) - cx, (a.y ?? a.y0) - cy) - Math.hypot((b.x ?? b.x0) - cx, (b.y ?? b.y0) - cy)); };
  // bate de verdade (física do jogo) num objeto: o carro vem pela rua e acerta o alvo perto do quadro fHit
  T.batida = function (col, fHit, speed, opt) {
    opt = opt || {};
    const tx = col.t ? col.x : (col.x0 + col.x1) / 2, ty = col.t ? col.y : (col.y0 + col.y1) / 2;
    const ne = nearestEdge(tx, ty), e = ne.e, dir = opt.dir || 1, ux = e.dx * dir, uy = e.dy * dir;
    const sx = e.a.x + e.dx * ne.s, sy = e.a.y + e.dy * ne.s, lado = Math.sign((tx - sx) * -uy + (ty - sy) * ux) || 1;
    const D = speed / 60 * fHit, lane = (opt.lane || 18) * lado;
    const x0 = sx - ux * D - uy * lane, y0 = sy - uy * D + ux * lane, a = Math.atan2(ty - y0, tx - x0);
    T.rail = null; player.place(x0, y0, a); player.vx = Math.cos(a) * speed; player.vy = Math.sin(a) * speed;
    Cam.x = x0; Cam.y = y0; Traffic.fill(Cam.x, Cam.y); forceGround = true;
    let bateu = -1; const dano0 = Profile.damage;
    T.manual = (f, p) => { if (bateu < 0 && (col.dead || Profile.damage > dano0 + 0.5)) bateu = f; return bateu < 0 ? { thr: f < fHit + 30 } : { brk: f > bateu + (opt.solta || 8) && p.speed > 12 }; };
    return { x: tx, y: ty, e };
  };
  // toca o botão cujo texto bate com a expressão (diálogo da loja, celular)
  T.botao = function (re, sel) { const b = [...document.querySelectorAll(sel || '#dialog-buttons button, #phone-body button')].find((x) => re.test(x.textContent)); if (!b) console.warn('sem botão', re); return b ? T.tocar(b) : false; };
  // agenda de ações por quadro (só durante a gravação): [[quadro, função], ...]
  T.em = function (lista) { TR.onFrame = (f) => { if (TR.cada) TR.cada(f); if (!TR.rec) return; for (const [q, fn] of lista) if (f === q) fn(f); }; };
  // bate na traseira de um carro parado no trânsito (batida de verdade: a física do jogo conta o impacto)
  T.batidaCarro = function (fHit, speed, modelo, perto) {
    const [px, py] = perto || [player.x, player.y], D = speed / 60 * fHit + 20;
    const es = World.edges.filter((e) => (e.T.id === 'street' || e.T.id === 'avenue') && e.len > D + 260).sort((a, b) => Math.hypot((a.a.x + a.b.x) / 2 - px, (a.a.y + a.b.y) / 2 - py) - Math.hypot((b.a.x + b.b.x) / 2 - px, (b.a.y + b.b.y) / 2 - py));
    const e = es[0]; if (!e) return null;
    for (const c of Traffic.cars) { c.release && c.release(); c.dead = true; } Traffic.cars = [];
    const c = new AICar(e, 1, Math.min(e.len - 120, D + 140), 0, modelo || 'hatch');
    c.cruise = 0; c.v = 0; c.acc = 0; c.pose(); Traffic.cars.push(c);
    const x0 = c.x - Math.cos(c.a) * D, y0 = c.y - Math.sin(c.a) * D;
    T.rail = null; player.place(x0, y0, c.a); player.vx = Math.cos(c.a) * speed; player.vy = Math.sin(c.a) * speed;
    Cam.x = x0; Cam.y = y0; forceGround = true;
    let bateu = -1; const d0 = Profile.damage;
    T.manual = (f, p) => { c.cruise = 0; if (bateu < 0 && (Profile.damage > d0 + 0.3 || Math.hypot(c.x - p.x, c.y - p.y) < (c.m.L + p.m.L) / 2 + 2)) bateu = f; return bateu < 0 ? { thr: true } : { brk: p.speed > 12 }; };
    return c;
  };
  // chega até (x, y) e para perto do quadro fStop
  T.chegar = function (x, y, fStop, speed, opt) { return T.toward(x, y, Math.max(90, speed * (fStop / 60 - 0.55)), speed, opt); };
  // trava o sorteio de uma lista do jogo num item (ex.: a fala do passageiro), sem mexer no resto
  T.fixos = new Map();
  const _pick = window.pick;
  window.pick = function (a) { if (T.fixos.has(a)) { const it = T.fixos.get(a); return typeof it === 'number' ? a[it] : it; } if (T.escolha) { const r = T.escolha(a); if (r !== undefined) return r; } return _pick.apply(this, arguments); };
  T.fixar = (lista, item) => T.fixos.set(lista, item);
  // "sorte": a frase de quando derruba o poste sai sempre (no jogo é 50%)
  const _bo = window.breakObject;
  window.breakObject = function () { const c = window.chance; if (T.sorte) window.chance = () => true; try { return _bo.apply(this, arguments); } finally { window.chance = c; } };
})();

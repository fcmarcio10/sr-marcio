// Visual do trailer vertical (Reels/TikTok): celular grande no meio da tela, frase no topo (estilo TikTok),
// câmera que viaja do carro até o evento (zoom), nomes e cartaz final ajustados para a tela em pé.
// Roda depois do cena.js, gameplay/extra.js e gta6/estilo.js.
(() => {
  const T = window.TR, ov = T.ov;
  document.body.classList.add('vt');
  const st = document.createElement('style');
  st.textContent = `body.vt-cel #screen-phone{justify-content:center!important;align-items:center!important;padding:0!important}
  body.vt-cel #screen-phone .phone{transform:scale(2.22);transform-origin:center center}
  body.vt #toasts{transform:scale(1.32)!important;transform-origin:top right!important;top:300px!important}
  body.vt-cel #toasts{opacity:0}
  body.vt #ev-offer{transform:scale(1.5)!important;transform-origin:top left!important;top:300px!important;left:24px!important}
  body.vt #tr-ov .gp-tap{width:104px;height:104px;margin:-52px 0 0 -52px;border-width:6px}
  body.vt #tr-ov .gp-key{bottom:340px}
  body.vt #tr-ov .g6-nome{left:70px;bottom:430px}
  body.vt #tr-ov .g6-nome b{font-size:150px}
  body.vt #tr-ov .g6-nome em{font-size:30px;letter-spacing:.14em}
  #tr-ov .vt-topo{position:absolute;left:50px;right:50px;top:128px;text-align:center;opacity:0}
  #tr-ov .vt-topo span{display:inline-block;max-width:960px;background:#fff;color:#0d0f14;font-family:var(--f-body);font-weight:800;font-size:50px;line-height:1.16;
    padding:14px 30px 17px;border-radius:20px;box-shadow:0 12px 34px rgba(0,0,0,.5)}
  #tr-ov .vt-topo span b{color:#e0182e}
  body.vt #tr-ov .g6-fim .q-lg .q-t{font-size:84px}
  body.vt #tr-ov .g6-fim .q-lg .q-m{font-size:168px;line-height:.9}
  body.vt #tr-ov .g6-fim .q-lg .q-s{font-size:24px;letter-spacing:.28em}
  body.vt #tr-ov .g6-fim .q-ja{font-size:68px;letter-spacing:.1em;margin-top:90px}
  body.vt #tr-ov .g6-fim .q-sol{width:1000px;height:1000px;margin-left:-500px;top:60%}`;
  document.head.appendChild(st);
  const ease = (k) => k * k * (3 - 2 * k);

  /* ---------- frase no topo (o "gancho" de vídeo curto) ---------- */
  const topo = document.createElement('div'); topo.className = 'vt-topo'; topo.innerHTML = '<span></span>'; ov.appendChild(topo);
  T.topo = function (html, f0, f1) { T.tp = { f0, f1: f1 || T.n }; topo.querySelector('span').innerHTML = html; };

  /* ---------- câmera que viaja até onde está o evento ---------- */
  // T.vcam = { f0, f1, de: () => [x, y] (ou [x, y]), para: [x, y], z0, z1 }  (z = vezes o zoom base da tela)
  const _uc = window.updateCamera;
  window.updateCamera = function (dt) {
    _uc(dt);
    const C = T.vcam; if (!C) return;
    const k = ease(Math.min(1, Math.max(0, (T.f - C.f0) / Math.max(1, C.f1 - C.f0))));
    const a = typeof C.de === 'function' ? C.de() : C.de, b = typeof C.para === 'function' ? C.para() : C.para;
    Cam.x = a[0] + (b[0] - a[0]) * k; Cam.y = a[1] + (b[1] - a[1]) * k;
    Cam.zoom = screenZoomBase() * (C.z0 + (C.z1 - C.z0) * k);
  };

  /* ---------- cada cena começa limpa ---------- */
  const _limpa = T.limpaGags;
  T.limpaGags = function () { _limpa(); T.vcam = null; T.tp = null; T.nmo = null; T.tio = null; T.so = null; T.tvo = null; };
  const _reset = T.reset;
  T.reset = function (opt) {
    opt = opt || {};
    _reset(opt);
    document.body.classList.remove('g6-hud'); // painel do jogo inteiro, como o jogador vê
    document.body.classList.toggle('vt-cel', !!opt.cel);
    T.grade(opt.grade === undefined ? 0.28 : opt.grade);
    canvas.style.filter = 'contrast(1.06) saturate(1.15) brightness(1.04)';
  };
  // abre/fecha o celular grande no meio da tela
  T.celular = function (on) { document.body.classList.toggle('vt-cel', !!on); };

  const _cine = T.cine;
  T.cine = function () {
    _cine();
    const f = T.f;
    if (T.tp) {
      const P = T.tp, k = f - P.f0, o = f < P.f0 || f > P.f1 + 6 ? 0 : Math.min(1, (P.f1 + 6 - f) / 6);
      const e = Math.min(1, Math.max(0, k / 8)), s = 0.6 + 0.4 * (1 + 2.70158 * Math.pow(e - 1, 3) + 1.70158 * Math.pow(e - 1, 2));
      topo.style.opacity = o; topo.style.transform = 'scale(' + s.toFixed(3) + ')';
    } else topo.style.opacity = 0;
  };
})();

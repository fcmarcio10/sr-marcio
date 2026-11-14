// Visual do vídeo de anúncio (YouTube): cor quase natural do jogo, painel inteiro (com os avisos de tecla)
// e o botão "Inscrever-se" com a setinha do mouse clicando no cartaz final.
// Roda depois do cena.js, gameplay/extra.js e cinema/estilo.js.
(() => {
  const T = window.TR, ov = T.ov;
  const _reset = T.reset;
  T.reset = function (opt) {
    opt = opt || {};
    _reset(opt);
    document.body.classList.remove('g6-hud'); // painel do jogo inteiro, como o jogador vê
    T.grade(opt.grade === undefined ? 0.16 : opt.grade);
    canvas.style.filter = opt.filtro || 'contrast(1.05) saturate(1.12) brightness(1.03)';
  };
  const _limpa = T.limpaGags;
  T.limpaGags = function () { _limpa(); T.nmo = null; T.tio = null; T.so = null; T.tvo = null; T.insc = null; };

  /* ---------- botão de inscrever-se (cartaz final) ---------- */
  const st = document.createElement('style');
  st.textContent = `#tr-ov .an-insc{position:absolute;left:50%;top:84%;transform:translate(-50%,-50%);display:flex;align-items:center;gap:18px;opacity:0}
  #tr-ov .an-insc b{display:inline-flex;align-items:center;height:78px;padding:0 40px;border-radius:40px;background:#e8121f;color:#fff;font-family:var(--f-body);font-weight:800;font-size:34px;letter-spacing:.04em;text-transform:uppercase;box-shadow:0 10px 26px rgba(0,0,0,.4)}
  #tr-ov .an-insc b.ok{background:#3a3d46;color:#d6d9e0}
  #tr-ov .an-insc svg.sino{width:58px;height:58px;filter:drop-shadow(0 6px 12px rgba(0,0,0,.4))}
  #tr-ov .an-mouse{position:absolute;width:46px;height:46px;opacity:0;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))}`;
  document.head.appendChild(st);
  const box = document.createElement('div'); box.className = 'an-insc';
  box.innerHTML = '<b>Inscrever-se</b><svg class="sino" viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2z" fill="#fff"/></svg>';
  ov.appendChild(box);
  const rato = document.createElement('div'); rato.className = 'an-mouse';
  rato.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 2l14 10.5-6.2.9 3.6 7.3-2.6 1.3-3.6-7.4L5 19z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  ov.appendChild(rato);
  const ease = (k) => k * k * (3 - 2 * k);
  // f0: o botão aparece; o mouse chega e clica 40 quadros depois
  T.inscreva = function (f0) { T.insc = { f0 }; };
  const _cine = T.cine;
  T.cine = function () {
    _cine();
    const I = T.insc, f = T.f;
    if (!I || f < I.f0) { box.style.opacity = 0; rato.style.opacity = 0; return; }
    const k = f - I.f0, b = box.querySelector('b');
    box.style.opacity = Math.min(1, k / 8) * (T.blackO > 0.5 ? 1 - T.blackO : 1);
    const clicou = k >= 40; b.classList.toggle('ok', clicou); b.textContent = clicou ? 'Inscrito' : 'Inscrever-se';
    const r = b.getBoundingClientRect(), tx = r.left + r.width * 0.55, ty = r.top + r.height * 0.6;
    const m = ease(Math.min(1, Math.max(0, (k - 8) / 30))), x = tx + (1 - m) * 380, y = ty + (1 - m) * 240;
    rato.style.opacity = box.style.opacity; rato.style.left = x + 'px'; rato.style.top = y + 'px';
    rato.style.transform = 'scale(' + (k >= 38 && k < 46 ? 0.82 : 1) + ')';
    if (k === 40 && T.rec) T.som.push([T.quadro(), 'FX', ['pop']]);
  };
})();

// Visual do trailer curto de cinema: cor de cinema, títulos grandes por seção, clipes de rede social na vertical (sem uso hoje),
// jornal da TV, nome dos personagens, título do lugar e o cartaz final. Roda depois do cena.js.
(() => {
  const T = window.TR, ov = T.ov, preto = ov.querySelector('.tr-black');
  const el = (cls, html, antes) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; if (antes) ov.insertBefore(d, antes); else ov.appendChild(d); return d; };
  const svg = (vb, corpo) => '<svg viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg">' + corpo + '</svg>';
  const ease = (k) => k * k * (3 - 2 * k);

  /* ---------- cor de cinema: luzes puxando pro laranja/rosa, sombras pro azul-petróleo ---------- */
  // fica fora do #tr-ov para misturar com o jogo (dentro dele a mistura não enxerga o canvas)
  const gr = document.createElement('div'); gr.id = 'g6-grade'; document.body.appendChild(gr);
  const st = document.createElement('style');
  st.textContent = `#g6-grade{position:fixed;inset:0;z-index:9000;pointer-events:none;mix-blend-mode:soft-light;opacity:0;
    background:linear-gradient(165deg,rgba(255,150,60,.55) 0%,rgba(255,70,140,.38) 42%,rgba(0,120,150,.5) 100%)}
  body.g6-cd #hud > *:not(#countdown){visibility:hidden !important}
  body.g6-hud #prompt,body.g6-hud #money-delta,body.g6-hud #hud-wanted{display:none !important}
  body.g6-hud #tr-ov .g6-nome{bottom:330px}
  #tr-ov .g6-social{position:absolute;inset:0;opacity:0}
  #tr-ov .g6-social .q-sd{position:absolute;top:0;bottom:0;width:calc(50% - 304px);-webkit-backdrop-filter:blur(30px) brightness(.42) saturate(1.3);backdrop-filter:blur(30px) brightness(.42) saturate(1.3)}
  #tr-ov .g6-social .q-sd.q-l{left:0}#tr-ov .g6-social .q-sd.q-r{right:0}
  #tr-ov .g6-social .q-fr{position:absolute;top:0;bottom:0;left:calc(50% - 304px);width:608px;overflow:hidden;font-family:var(--f-body);color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.08)}
  #tr-ov .g6-social .q-fr:after{content:'';position:absolute;left:0;right:0;bottom:0;height:46%;background:linear-gradient(transparent,rgba(0,0,0,.72));z-index:0}
  #tr-ov .g6-social .q-fr:before{content:'';position:absolute;left:0;right:0;top:0;height:16%;background:linear-gradient(rgba(0,0,0,.5),transparent);z-index:0}
  #tr-ov .g6-social .q-fr>*{position:absolute;z-index:1}
  #tr-ov .g6-social .q-bar{left:18px;right:18px;top:16px;height:4px;border-radius:3px;background:rgba(255,255,255,.3)}
  #tr-ov .g6-social .q-bar i{display:block;height:100%;width:0;border-radius:3px;background:#fff}
  #tr-ov .g6-social .q-topo{left:0;right:0;top:36px;text-align:center;font-weight:700;font-size:26px;letter-spacing:.02em}
  #tr-ov .g6-social .q-topo span{opacity:.6;margin:0 14px}#tr-ov .g6-social .q-topo b{border-bottom:3px solid #fff;padding-bottom:6px}
  #tr-ov .g6-social .q-acts{right:14px;bottom:270px;width:84px;display:flex;flex-direction:column;align-items:center;gap:6px}
  #tr-ov .g6-social .q-acts svg{width:62px;height:62px;filter:drop-shadow(0 2px 6px rgba(0,0,0,.6))}
  #tr-ov .g6-social .q-acts em{font-style:normal;font-weight:800;font-size:22px;margin-bottom:22px;text-shadow:0 2px 6px #000}
  #tr-ov .g6-social .q-pe{left:24px;right:118px;bottom:28px;display:flex;flex-direction:column;gap:14px}
  #tr-ov .g6-social .q-usr{display:flex;align-items:center;gap:14px;font-weight:800;font-size:28px;text-shadow:0 2px 8px #000}
  #tr-ov .g6-social .q-av{width:64px;height:64px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;font-family:var(--f-display);font-size:32px;flex:none}
  #tr-ov .g6-social .q-seg{border:2px solid #fff;border-radius:10px;padding:2px 14px;font-size:22px;font-weight:800}
  #tr-ov .g6-social .q-cap{font-weight:600;font-size:27px;line-height:1.28;text-shadow:0 2px 8px #000}
  #tr-ov .g6-social .q-cap b{font-weight:800}
  #tr-ov .g6-social .q-som{display:flex;align-items:center;gap:10px;font-weight:600;font-size:22px;opacity:.95;white-space:nowrap;overflow:hidden;text-shadow:0 2px 6px #000}
  #tr-ov .g6-social .q-som svg{width:26px;height:26px;flex:none}
  #tr-ov .g6-social .q-cor{position:absolute;right:30px;width:52px;height:52px;opacity:0}
  #tr-ov .g6-tv{position:absolute;inset:0;opacity:0;font-family:var(--f-cond);text-transform:uppercase}
  #tr-ov .g6-tv .q-vivo{position:absolute;left:70px;top:58px;background:#d8101e;color:#fff;font-weight:800;font-size:30px;letter-spacing:.1em;padding:6px 18px 6px 44px}
  #tr-ov .g6-tv .q-vivo:before{content:'';position:absolute;left:16px;top:50%;width:16px;height:16px;margin-top:-8px;border-radius:50%;background:#fff}
  #tr-ov .g6-tv .q-bug{position:absolute;right:70px;top:52px;text-align:right;color:#fff;font-family:var(--f-display);font-size:58px;line-height:.9;text-shadow:3px 3px 0 rgba(0,0,0,.6);opacity:.88}
  #tr-ov .g6-tv .q-bug small{display:block;font-family:var(--f-cond);font-weight:800;font-size:18px;letter-spacing:.3em}
  #tr-ov .g6-tv .q-lt{position:absolute;left:70px;right:70px;bottom:120px}
  #tr-ov .g6-tv .q-urg{display:inline-block;background:#d8101e;color:#fff;font-weight:800;font-size:34px;letter-spacing:.12em;padding:6px 22px}
  #tr-ov .g6-tv .q-man{background:#fff;color:#0d1630;font-weight:800;font-size:58px;line-height:1.05;padding:12px 26px;letter-spacing:.01em}
  #tr-ov .g6-tv .q-sub{display:flex;background:#0f2a6b;color:#fff;font-weight:700;font-size:30px;letter-spacing:.04em;text-transform:none}
  #tr-ov .g6-tv .q-sub span{padding:8px 26px;flex:1}#tr-ov .g6-tv .q-sub b{background:#071534;padding:8px 22px;font-weight:800}
  #tr-ov .g6-tv .q-tk{position:absolute;left:0;right:0;bottom:44px;height:56px;background:rgba(5,10,24,.9);overflow:hidden;color:#ffd23a;font-weight:800;font-size:30px;letter-spacing:.06em;line-height:56px;white-space:nowrap}
  #tr-ov .g6-tv .q-tk i{font-style:normal;position:absolute;left:0}
  #tr-ov .g6-nome{position:absolute;left:110px;bottom:150px;opacity:0;isolation:isolate}
  #tr-ov .g6-nome:before{content:'';position:absolute;left:-220px;right:-320px;top:-40px;bottom:-110px;z-index:-1;background:radial-gradient(ellipse at 40% 62%,rgba(3,4,8,.78) 0%,rgba(3,4,8,.45) 45%,transparent 72%)}
  #tr-ov .g6-nome b{display:block;font-family:var(--f-display);font-weight:400;font-size:178px;line-height:1;padding-top:34px;text-transform:uppercase;letter-spacing:.01em;
    background:linear-gradient(100deg,#ff4f9a 0%,#ff8a3d 55%,#ffd04a 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(8px 8px 0 rgba(5,7,11,.9))}
  #tr-ov .g6-nome em{display:block;margin-top:16px;font-style:normal;font-family:var(--f-cond);font-weight:800;font-size:36px;letter-spacing:.2em;color:#fff;text-transform:uppercase;text-shadow:3px 3px 0 #05070b}
  #tr-ov .g6-tit{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;opacity:0}
  #tr-ov .g6-tit b{display:block;font-family:var(--f-display);font-weight:400;font-size:150px;line-height:1;color:#fff;text-transform:uppercase;text-shadow:0 0 50px rgba(0,0,0,.7),6px 6px 0 rgba(5,7,11,.8)}
  #tr-ov .g6-tit em{display:block;margin-top:18px;font-style:normal;font-family:var(--f-cond);font-weight:800;font-size:34px;letter-spacing:.5em;color:#ffd04a;text-transform:uppercase;text-shadow:3px 3px 0 #05070b}
  #tr-ov .g6-fim{position:absolute;inset:0;opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;
    background:linear-gradient(180deg,#2a0d4a 0%,#7a1a6e 34%,#e2416a 62%,#ff8a3d 84%,#ffc65a 100%)}
  #tr-ov .g6-fim .q-sol{position:absolute;left:50%;top:58%;width:900px;height:900px;margin-left:-450px;border-radius:50%;
    background:linear-gradient(180deg,#ffe07a 0%,#ff9a3d 45%,#ff4f9a 100%);opacity:.5;
    -webkit-mask-image:repeating-linear-gradient(180deg,#000 0 46px,transparent 46px 60px);mask-image:repeating-linear-gradient(180deg,#000 0 46px,transparent 46px 60px)}
  #tr-ov .g6-fim .q-lg{position:relative;text-align:center;color:#fff}
  #tr-ov .g6-fim .q-lg .q-t{font-family:var(--f-display);font-size:92px;letter-spacing:.12em;line-height:1;text-shadow:6px 6px 0 rgba(42,13,74,.85)}
  #tr-ov .g6-fim .q-lg .q-m{font-family:var(--f-display);font-size:230px;line-height:.88;letter-spacing:.005em;text-shadow:10px 10px 0 rgba(42,13,74,.85)}
  #tr-ov .g6-fim .q-lg .q-s{margin-top:22px;font-family:var(--f-cond);font-weight:800;font-size:30px;letter-spacing:.42em;text-transform:uppercase;text-shadow:3px 3px 0 rgba(42,13,74,.85)}
  #tr-ov .g6-fim .q-ja{position:relative;margin-top:70px;font-family:var(--f-display);font-size:84px;letter-spacing:.14em;text-transform:uppercase;color:#fff;text-shadow:6px 6px 0 rgba(42,13,74,.85)}
  #tr-ov .g6-fim .q-on{position:relative;margin-top:14px;font-family:var(--f-cond);font-weight:800;font-size:30px;letter-spacing:.3em;color:#2a0d4a;text-transform:uppercase}`;
  document.head.appendChild(st);

  /* ---------- clipe de rede social (vídeo em pé, filmado pelo povo) ---------- */
  const cor = svg('0 0 24 24', '<path d="M12 21.3l-1.4-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5L12 21.3z" fill="#ff2e55"/>');
  const corB = svg('0 0 24 24', '<path d="M12 21.3l-1.4-1.3C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5L12 21.3z" fill="#fff"/>');
  const bal = svg('0 0 24 24', '<path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4 21.5l4.6-2.2c1.1.3 2.2.5 3.4.5 5.5 0 10-3.8 10-8.3S17.5 3 12 3z" fill="#fff"/>');
  const env = svg('0 0 24 24', '<path d="M21 11.5L13 4v4.2C7 8.9 3.5 12.6 3 19c2.2-3.2 5.4-4.7 10-4.8V19l8-7.5z" fill="#fff"/>');
  const nota = svg('0 0 24 24', '<path d="M9 18.5a3 3 0 1 1-2-2.8V5l12-2.5v12.8a3 3 0 1 1-2-2.8V6.9L9 8.5v10z" fill="#fff"/>');
  const so = el('g6-social', '<div class="q-sd q-l"></div><div class="q-sd q-r"></div><div class="q-fr"><div class="q-bar"><i></i></div><div class="q-topo"><span>Seguindo</span><b>Pra você</b></div>' +
    '<div class="q-acts"><div class="q-lk">' + corB + '</div><em class="q-nl"></em>' + bal + '<em class="q-nc"></em>' + env + '<em class="q-ns"></em></div>' +
    '<div class="q-pe"><div class="q-usr"><span class="q-av"></span><span class="q-h"></span><span class="q-seg">Seguir</span></div><div class="q-cap"></div><div class="q-som">' + nota + '<span></span></div></div></div>', preto);
  const fr = so.querySelector('.q-fr');
  // o = { user, txt (html), curtidas, coment, compart, cor (do avatar), f0, f1 }
  T.social = function (o) {
    T.so = Object.assign({ f0: 0, f1: T.n, cor: '#ff4f9a' }, o);
    so.querySelector('.q-av').textContent = o.user.replace(/^@/, '').charAt(0).toUpperCase();
    so.querySelector('.q-av').style.background = T.so.cor;
    so.querySelector('.q-h').textContent = o.user; so.querySelector('.q-cap').innerHTML = o.txt;
    so.querySelector('.q-nl').textContent = o.curtidas; so.querySelector('.q-nc').textContent = o.coment; so.querySelector('.q-ns').textContent = o.compart || 'Compartilhar';
    so.querySelector('.q-som span').textContent = 'som original · ' + o.user;
    for (const c of fr.querySelectorAll('.q-cor')) c.remove();
    T.so.cores = [];
    T.tremido = o.tremido === undefined ? 1 : o.tremido;
    T.grade(0.35); canvas.style.filter = 'contrast(1.1) saturate(1.08) brightness(1.06)';
  };
  // coraçõezinhos subindo no canto (curtidas ao vivo)
  const coracao = (f) => { const d = document.createElement('div'); d.className = 'q-cor'; d.innerHTML = cor; fr.appendChild(d); T.so.cores.push({ d, f0: f, dx: (Math.random() - 0.5) * 40 }); };

  /* ---------- jornal da TV (plantão) ---------- */
  const tv = el('g6-tv', '<div class="q-vivo">Ao vivo</div><div class="q-bug">TVG<small>São Gambiarra</small></div><div class="q-lt"><div class="q-urg">Urgente</div><div class="q-man"></div><div class="q-sub"><span></span><b></b></div></div><div class="q-tk"><i></i></div>', preto);
  T.tv = function (o) {
    T.tvo = Object.assign({ f0: 0, f1: T.n }, o);
    tv.querySelector('.q-man').textContent = o.manchete; tv.querySelector('.q-sub span').textContent = o.sub; tv.querySelector('.q-sub b').textContent = o.hora || '23:47';
    tv.querySelector('.q-tk i').textContent = (o.letreiro + '     ·     ').repeat(3);
    T.tremido = 0.35; canvas.style.filter = 'contrast(1.06) saturate(1.1)';
  };

  /* ---------- nome do personagem (canto de baixo, revelando da esquerda) ---------- */
  const nm = el('g6-nome', '<b></b><em></em>');
  T.nome = function (nome, papel, f0, f1) { T.nmo = { f0, f1: f1 || T.n }; nm.querySelector('b').textContent = nome; nm.querySelector('em').textContent = papel || ''; };

  /* ---------- título do lugar (no meio, letras abrindo devagar) ---------- */
  const ti = el('g6-tit', '<b></b><em></em>');
  T.titulo = function (big, small, f0, f1) { T.tio = { f0, f1: f1 || T.n }; ti.querySelector('b').textContent = big; ti.querySelector('em').textContent = small || ''; };

  /* ---------- cartaz final ---------- */
  const fim = el('g6-fim', '<div class="q-sol"></div><div class="q-lg"><div class="q-t">BR</div><div class="q-m">NIGHT DRIVE</div><div class="q-s">Mundo aberto · São Gambiarra</div></div><div class="q-ja">Em breve para Windows</div><div class="q-on"></div>', preto);
  T.final = function (f0) { T.fimo = { f0 }; };

  T.grade = function (o) { gr.style.opacity = o; };

  /* ---------- câmera na mão (clipes de celular e TV) ---------- */
  const _uc = window.updateCamera;
  window.updateCamera = function (dt) {
    _uc(dt);
    const a = T.tremido || 0; if (!a) return;
    const f = T.f + 13, z = Cam.zoom || 1;
    Cam.x += (Math.sin(f * 0.071) * 7 + Math.sin(f * 0.193 + 1.3) * 3.2 + Math.sin(f * 0.47) * 1.1) * a / z;
    Cam.y += (Math.sin(f * 0.057 + 0.7) * 6 + Math.sin(f * 0.211 + 2.1) * 2.8 + Math.sin(f * 0.53 + 0.4) * 1.0) * a / z;
  };

  /* ---------- reinício de cada cena ---------- */
  const _reset = T.reset;
  T.reset = function (opt) {
    opt = opt || {};
    _reset(opt);
    // carro novinho: sem amassado, sem fumaça e sem sujeira
    Profile.damage = 0; Profile.dirt = 0; Profile.zones = null; if (player) player.mud = 0;
    document.body.classList.toggle('g6-hud', !!opt.hud); // painel do jogo aparecendo (sem o aviso de tecla)
    T.so = null; T.tvo = null; T.nmo = null; T.tio = null; T.fimo = null; T.tremido = 0;
    T.grade(opt.grade === undefined ? 0.55 : opt.grade);
    document.body.classList.toggle('g6-cd', !!opt.soContagem); // do painel, só a contagem do racha
    canvas.style.filter = opt.filtro !== undefined ? opt.filtro : 'contrast(1.08) saturate(1.2) brightness(1.03)';
  };

  /* ---------- desenha as camadas a cada quadro ---------- */
  const _cine = T.cine;
  T.cine = function () {
    _cine();
    const f = T.f;
    // clipe social
    if (T.so) {
      const S = T.so, o = f >= S.f0 && f <= S.f1 ? 1 : 0; so.style.opacity = o;
      so.querySelector('.q-bar i').style.width = (Math.min(1, Math.max(0, (f - S.f0) / Math.max(1, S.f1 - S.f0))) * 100).toFixed(1) + '%';
      const like = f - S.f0 > 22; so.querySelector('.q-lk').innerHTML = like ? cor : corB;
      if (o && f % 13 === 0 && f - S.f0 > 26) coracao(f);
      for (const c of S.cores) {
        const k = (f - c.f0) / 70; c.d.style.opacity = k < 0 || k > 1 ? 0 : Math.min(1, 4 * (1 - k));
        c.d.style.bottom = (690 + k * 280) + 'px'; c.d.style.transform = 'translateX(' + (c.dx + Math.sin(k * 6 + c.f0) * 16).toFixed(1) + 'px) scale(' + (0.6 + 0.6 * Math.min(1, k * 5)).toFixed(2) + ')';
      }
    } else so.style.opacity = 0;
    // TV
    if (T.tvo) {
      const V = T.tvo; tv.style.opacity = f >= V.f0 && f <= V.f1 ? 1 : 0;
      const lt = tv.querySelector('.q-lt'), k = ease(Math.min(1, Math.max(0, (f - V.f0 - 4) / 12)));
      lt.style.transform = 'translateX(' + ((1 - k) * -1300).toFixed(0) + 'px)';
      tv.querySelector('.q-tk i').style.transform = 'translateX(' + (1920 - f * 6) + 'px)';
    } else tv.style.opacity = 0;
    // nome do personagem
    if (T.nmo) {
      const N = T.nmo, k = Math.min(1, Math.max(0, (f - N.f0) / 14)), o = f < N.f0 ? 0 : Math.min(1, (N.f1 - f) / 8);
      nm.style.opacity = Math.max(0, o); { const e = ease(k); nm.style.clipPath = 'inset(-220px calc(' + ((1 - e) * 100).toFixed(1) + '% - ' + (e * 420).toFixed(0) + 'px) -220px -420px)'; }
      nm.style.transform = 'translateX(' + ((1 - ease(k)) * -30).toFixed(1) + 'px)';
    } else nm.style.opacity = 0;
    // título do lugar
    if (T.tio) {
      const I = T.tio, o = T.fade(f, I.f0, I.f1, 22), k = Math.min(1, Math.max(0, (f - I.f0) / Math.max(1, I.f1 - I.f0)));
      ti.style.opacity = o; ti.querySelector('b').style.letterSpacing = (0.02 + 0.1 * k).toFixed(3) + 'em';
    } else ti.style.opacity = 0;
    // cartaz final
    if (T.fimo) {
      const k = f - T.fimo.f0; fim.style.opacity = k < 0 ? 0 : Math.min(1, k / 3);
      const e = Math.max(0, 1 - k / 18); fim.querySelector('.q-lg').style.transform = 'scale(' + (1 + 0.22 * e * e).toFixed(3) + ')';
      fim.querySelector('.q-sol').style.transform = 'translateY(' + (Math.max(0, 1 - k / 200) * 120).toFixed(1) + 'px)';
      const j = Math.max(0, Math.min(1, (k - 40) / 14)); fim.querySelector('.q-ja').style.opacity = j; fim.querySelector('.q-on').style.opacity = Math.max(0, Math.min(1, (k - 56) / 14));
      fim.querySelector('.q-ja').style.transform = 'translateY(' + ((1 - ease(j)) * 30).toFixed(1) + 'px)';
    } else fim.style.opacity = 0;
  };
})();

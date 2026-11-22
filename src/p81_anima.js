/* ============================ ANIMAÇÕES DE ENTRAR E SAIR DO CARRO (0.2.0) ============================
   O passageiro não some nem aparece do nada: na hora de embarcar ele anda até a porta do carro (do lado da calçada),
   abaixa e entra (some aos poucos); na chegada ele sai pela porta, dá uns passos para a calçada, olha em volta e vai embora.
   Enquanto espera, vira o corpo devagar para o carro que chega. Vale para o PegaAí e para a carona dos eventos.
   A sombra de cada um acompanha (Sombras.chao lê Embarque.lista). */
const Embarque = { lista: [] };
// porta do carro do lado de quem está (+1 direita, -1 esquerda do carro)
Embarque.porta = function (lado) {
  const c = Math.cos(player.a), s = Math.sin(player.a), d = player.m.W / 2 + 3;
  return [player.x - s * d * lado + c * 2, player.y + c * d * lado + s * 2];
};
Embarque.ladoDe = function (x, y) { return Math.sign((x - player.x) * -Math.sin(player.a) + (y - player.y) * Math.cos(player.a)) || 1; };
Embarque.novo = function (look, x, y, a, modo) {
  const w = Object.assign({ type: 'person', x, y, a, v: 0, phase: Math.random() * TAU, seed: Math.random(), col: '#ffd24a', skin: '#c68642', hair: '#1a1410', pants: '#2b3a55' }, look || {}, { x, y, a, v: 0, dance: false, danceUntil: 0, state: 'walk' });
  w.modo = modo; w.t = 0; w.alpha = modo === 'sai' ? 0 : 1; w.P = ANIMAL.person;
  this.lista.push(w); return w;
};
// embarcar: anda da calçada até a porta e entra
Embarque.entra = function (look, x, y) {
  if (!player) return;
  const w = this.novo(look, x, y, Math.atan2(player.y - y, player.x - x), 'entra'); w.lado = this.ladoDe(x, y);
};
// desembarcar: sai pela porta do lado da calçada e anda alguns passos para fora da rua
Embarque.sai = function (look, destX, destY) {
  if (!player) return;
  const lado = this.ladoDe(destX, destY), [px, py] = this.porta(lado);
  const w = this.novo(look, px, py, player.a + lado * Math.PI / 2, 'sai');
  const d = Math.hypot(destX - px, destY - py) || 1, k = Math.min(1, 30 / d);
  w.tx = px + (destX - px) * k; w.ty = py + (destY - py) * k;
};
// passageiro esperando: vira devagar para o carro quando ele chega perto (o mesmo para o desenho e a sombra)
Embarque.esperando = function (R) {
  let o = R._esp;
  if (!o) { // o passageiro tem a cara do nome dele (homem ou mulher), com a camisa amarela para achar fácil
    o = R._esp = { type: 'person', x: R.pick.x, y: R.pick.y, a: Math.PI / 2, v: 0, phase: 0, seed: R.seed, skin: pick(['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5a3a22']), hair: '#1a1410', pants: '#2b3a55', dance: true, state: 'idle' };
    vistePessoa(o, typeof genderOf === 'function' && R.name ? genderOf(R.name) === 'f' : Math.random() < 0.5); o.col = '#ffd24a'; if (o.roupa === 'time' || o.roupa === 'listrada') o.roupa = 'lisa';
  }
  o.x = R.pick.x; o.y = R.pick.y;
  return o;
};
Embarque.update = function (dt) {
  const R = Act.ride;
  if (R && R.stage === 'pickup' && player) {
    const o = this.esperando(R), d = Math.hypot(player.x - o.x, player.y - o.y);
    if (d < 260) { o.dance = false; o.a += clamp(angDiff(o.a, Math.atan2(player.y - o.y, player.x - o.x)), -2.5 * dt, 2.5 * dt); } else o.dance = true;
  }
  for (let i = this.lista.length - 1; i >= 0; i--) {
    const w = this.lista[i]; w.t += dt;
    let tx, ty;
    if (w.modo === 'entra') { [tx, ty] = player ? this.porta(w.lado) : [w.x, w.y]; }
    else { tx = w.tx; ty = w.ty; w.alpha = Math.min(1, w.t * 4); }
    const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy);
    if (w.modo === 'entra' && (w.t > 1.7 || (player && player.speed > 45))) w.alpha -= dt * 4; // o carro já saiu ou demorou: entra de vez
    if (d > 1.5) {
      const err = angDiff(w.a, Math.atan2(dy, dx)); w.a += clamp(err, -6 * dt, 6 * dt);
      w.v = aproxima(w.v, Math.min(w.modo === 'entra' ? 58 : 34, d * 3 + 8) * (0.45 + 0.55 * Math.max(0, Math.cos(err))), 120 * dt, 160 * dt);
      const k = Math.min(d, w.v * dt) / d; w.x += dx * k; w.y += dy * k;
    } else {
      w.v = Math.max(0, w.v - 160 * dt);
      if (w.modo === 'entra') { w.alpha -= dt * 3.2; w.a += clamp(angDiff(w.a, player ? player.a : w.a), -6 * dt, 6 * dt); } // vira de costas para o carro e entra
      else if (w.t > 1.6) { w.alpha -= dt * 0.8; if (!w.olhou) { w.olhou = true; w.a += 0.9; } } // olha em volta e some andando devagar
    }
    w.phase += dt * (w.v > 0.5 ? 6 + w.v * 0.12 : 1.5);
    if (w.alpha <= 0 || w.t > (w.modo === 'entra' ? 3 : 4.5)) this.lista.splice(i, 1);
  }
};
Embarque.draw = function (ctx, view) {
  for (const w of this.lista) {
    if (!inView(view, w.x, w.y, 30)) continue;
    ctx.globalAlpha = clamp(w.alpha, 0, 1); drawAnimal(ctx, w);
  }
  ctx.globalAlpha = 1;
};

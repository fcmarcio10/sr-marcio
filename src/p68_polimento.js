/* ============================ POLIMENTO: tela de resultado e comemorações ============================
   Fim de corrida, entrega ou percurso: um cartão aparece no alto (sem parar o jogo) com as estrelas uma a uma,
   os valores subindo em contador animado com som e o total em destaque. Some sozinho em ~5 s. */
const Resultado = { el: null, timers: [] };
Resultado.cria = function () {
  if (this.el) return this.el;
  const el = this.el = document.createElement('div'); el.id = 'resultado'; el.className = 'hidden';
  document.body.appendChild(el); return el;
};
Resultado.limpa = function () { for (const t of this.timers) clearTimeout(t); this.timers = []; };
// o: { titulo, sub, estrelas (0-5 ou null), medalha (texto ou null), linhas: [[rótulo, valor]], total }
Resultado.mostra = function (o) {
  const el = this.cria(); this.limpa();
  const linhas = (o.linhas || []).filter((l) => l[1]);
  el.innerHTML = `<div class="rs-top"><b>${escapeHtml(o.titulo)}</b>${o.sub ? `<small>${escapeHtml(o.sub)}</small>` : ''}</div>` +
    (o.estrelas !== null && o.estrelas !== undefined ? `<div class="rs-stars">${[0, 1, 2, 3, 4].map((i) => `<i data-s="${i}"></i>`).join('')}</div>` : '') +
    (o.medalha ? `<div class="rs-medal m${o.medalhaN || 0}">${escapeHtml(o.medalha)}</div>` : '') +
    `<div class="rs-lines">${linhas.map((l, i) => `<div class="rs-l" data-l="${i}"><span>${escapeHtml(l[0])}</span><em>R$ 0</em></div>`).join('')}</div>` +
    `<div class="rs-total"><span>Total</span><em>R$ 0</em></div>`;
  el.classList.remove('hidden', 'sai'); void el.offsetWidth; el.classList.add('entra');
  const at = (ms, fn) => this.timers.push(setTimeout(fn, ms));
  let t = 250;
  // estrelas: uma de cada vez, com nota subindo
  if (o.estrelas !== null && o.estrelas !== undefined) {
    for (let i = 0; i < 5; i++) {
      const ok = i < o.estrelas;
      at(t, () => { const s = el.querySelector(`[data-s="${i}"]`); if (s) s.classList.add(ok ? 'on' : 'off'); if (ok) AudioSys.tone(660 + i * 120, 0.09, 'triangle', 0.06, 'ui'); });
      t += ok ? 170 : 90;
    }
    t += 150;
  }
  // valores subindo
  const conta = (sel, v, dur, fim) => {
    const box = el.querySelector(sel); if (!box) return; const e = box.querySelector('em'); box.classList.add('on');
    const n = Math.max(6, Math.round(dur / 45));
    for (let k = 1; k <= n; k++) at(t + (dur * k) / n, () => { e.textContent = 'R$ ' + fmtMoney(Math.round(v * k / n)); if (k % 2 === 0) AudioSys.tone(1500, 0.02, 'square', 0.015, 'ui'); if (k === n && fim) fim(); });
    t += dur + 90;
  };
  linhas.forEach((l, i) => conta(`[data-l="${i}"]`, l[1], 420));
  conta('.rs-total', o.total, 520, () => { AudioSys.money(); el.querySelector('.rs-total').classList.add('pop'); });
  at(t + 3200, () => { el.classList.add('sai'); });
  at(t + 3700, () => { el.classList.add('hidden'); el.classList.remove('entra', 'sai'); });
};

// confete na subida de nível (pedacinhos coloridos caindo, só por cima da tela, some sozinho)
function confete(n) {
  const box = document.createElement('div'); box.className = 'confete'; document.body.appendChild(box);
  const cores = ['#ffd23f', '#3ad07a', '#3a9be0', '#ff5a5a', '#ff8ad8', '#ffffff'];
  for (let i = 0, tot = Math.round((n || 70) * 0.4); i < tot; i++) { // discreto: menos pedacinhos, caindo devagar e girando pouco
    const p = document.createElement('i');
    p.style.left = (50 + (Math.random() - 0.5) * 70) + '%'; p.style.background = cores[i % cores.length];
    p.style.animationDelay = (Math.random() * 0.35).toFixed(2) + 's'; p.style.animationDuration = (2.2 + Math.random() * 1).toFixed(2) + 's';
    p.style.setProperty('--dx', ((Math.random() - 0.5) * 160).toFixed(0) + 'px'); p.style.setProperty('--rz', ((Math.random() - 0.5) * 240).toFixed(0) + 'deg');
    box.appendChild(p);
  }
  setTimeout(() => box.remove(), 3900);
}

/* ---------- avisos de missão em estilo de cinema: título do capítulo, legenda do objetivo,
   caixa de ajuda no canto e a faixa de "capítulo concluído" ---------- */
const Missao = { timers: {} };
Missao.el = function (id) {
  let e = $(id);
  if (!e) { e = document.createElement('div'); e.id = id; e.className = 'ms-oculto'; document.body.appendChild(e); }
  return e;
};
Missao.mostra = function (id, html, seg) {
  const e = this.el(id);
  e.innerHTML = html; e.classList.remove('ms-sai', 'ms-oculto'); void e.offsetWidth; e.classList.add('ms-on');
  clearTimeout(this.timers[id]);
  if (seg) this.timers[id] = setTimeout(() => this.esconde(id), seg * 1000);
};
Missao.esconde = function (id) {
  const e = $(id); if (!e || e.classList.contains('ms-oculto')) return;
  e.classList.add('ms-sai'); clearTimeout(this.timers[id]);
  this.timers[id] = setTimeout(() => { e.classList.remove('ms-on', 'ms-sai'); e.classList.add('ms-oculto'); }, 600);
};
// nome do capítulo grande no meio da tela
Missao.titulo = function (rotulo, nome, historia) {
  this.mostra('ms-titulo', `<div class="ms-rot">${escapeHtml(rotulo)}</div><div class="ms-nome">${escapeHtml(nome)}</div>` + (historia ? `<div class="ms-hist">${escapeHtml(historia)}</div>` : ''), historia ? 6.5 : 4.5);
  try { [196, 294, 392].forEach((f, i) => AudioSys.tone(f, 1.4, 'triangle', 0.05, 'ui', null, i * 0.12)); } catch (e) {}
};
// objetivo como legenda embaixo (palavra importante em amarelo)
Missao.legenda = function (html, seg, quem) {
  this.mostra('ms-legenda', (quem ? `<span class="ms-quem">${escapeHtml(quem)}:</span> ` : '') + html, seg || 7);
};
// caixa de ajuda no canto de cima
Missao.ajuda = function (html, seg) {
  Teclas.fecha(); // mesmo canto da tela que o quadro de teclas
  this.mostra('ms-ajuda', html, seg || 8);
  try { AudioSys.tone(880, 0.12, 'sine', 0.05, 'ui'); AudioSys.tone(1320, 0.16, 'sine', 0.04, 'ui', null, 0.08); } catch (e) {}
};
// faixa escura atravessando a tela com "CAPÍTULO CONCLUÍDO"
Missao.passou = function (titulo, sub, valor) {
  this.mostra('ms-passou', `<div class="ms-faixa"><div class="ms-ok">${escapeHtml(titulo)}</div><div class="ms-sub">${escapeHtml(sub)}</div>${valor ? `<div class="ms-val">+ R$ ${fmtMoney(valor)}</div>` : ''}</div>`, 5.5);
  try { [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32], [784, 0.62], [1047, 0.74], [1319, 0.86]].forEach(([f, d]) => AudioSys.tone(f, 0.55, 'triangle', 0.07, 'ui', null, d)); } catch (e) {}
};

// nome do lugar no canto de baixo (apresentação da missão)
Missao.lugar = function (nome, sub, tag) {
  this.mostra('ms-lugar', (tag ? `<div class="ml-tag">${escapeHtml(tag)}</div>` : '') + `<div class="ml-nome">${escapeHtml(nome)}</div>` + (sub ? `<div class="ml-sub">${escapeHtml(sub)}</div>` : ''), 0);
  try { AudioSys.tone(523, 0.25, 'sine', 0.04, 'ui'); AudioSys.tone(784, 0.35, 'sine', 0.035, 'ui', null, 0.1); } catch (e) {}
};

// missão fracassada (desistiu pelo menu): faixa escura com o texto em vermelho
Missao.fracassou = function (sub) {
  this.mostra('ms-passou', `<div class="ms-faixa"><div class="ms-ok ms-falhou">Missão fracassada</div><div class="ms-sub">${escapeHtml(sub || '')}</div></div>`, 4.5);
  try { [[392, 0], [330, 0.18], [262, 0.36], [196, 0.6]].forEach(([f, d]) => AudioSys.tone(f, 0.6, 'triangle', 0.07, 'ui', null, d)); } catch (e) {}
};

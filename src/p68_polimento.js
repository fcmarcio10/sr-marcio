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
  for (let i = 0; i < (n || 70); i++) {
    const p = document.createElement('i');
    p.style.left = (50 + (Math.random() - 0.5) * 70) + '%'; p.style.background = cores[i % cores.length];
    p.style.animationDelay = (Math.random() * 0.35).toFixed(2) + 's'; p.style.animationDuration = (1.6 + Math.random() * 1.2).toFixed(2) + 's';
    p.style.setProperty('--dx', ((Math.random() - 0.5) * 340).toFixed(0) + 'px'); p.style.setProperty('--rz', ((Math.random() - 0.5) * 900).toFixed(0) + 'deg');
    box.appendChild(p);
  }
  setTimeout(() => box.remove(), 3400);
}

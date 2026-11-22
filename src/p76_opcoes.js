/* ============================ SALVAMENTOS, TECLAS, CONTROLE E LEGENDAS ============================
   - 3 espaços de salvamento (brnd_save, brnd_save_2, brnd_save_3); Settings.slot é o espaço em uso.
   - Teclas configuráveis (Settings.teclas, aba Controles > Teclado e mouse); as setas continuam valendo.
   - Controle de videogame (Xbox/PlayStation, padrão do navegador): gatilhos aceleram e freiam, analógico vira.
   - Legendas de todas as falas (Settings.legendas): zap, passageiros, pedestres e Seu Zé. */

// ---------- teclas ----------
const TECLAS_PADRAO = { acelerar: 'KeyW', frear: 'KeyS', esquerda: 'KeyA', direita: 'KeyD', freioMao: 'Space', buzina: 'KeyH', farol: 'KeyJ', farolAlto: 'KeyL', interagir: 'KeyE', celular: 'KeyQ', radio: 'KeyF', paredao: 'KeyB', reposicionar: 'KeyR' };
const TECLAS_NOME = { acelerar: 'Acelerar', frear: 'Frear / ré', esquerda: 'Virar à esquerda', direita: 'Virar à direita', freioMao: 'Freio de mão', buzina: 'Buzina', farol: 'Farol (liga/desliga)', farolAlto: 'Farol alto', interagir: 'Interagir', celular: 'Celular e mapa', radio: 'Rádio', paredao: 'Paredão', reposicionar: 'Reposicionar o carro' };
const TECLAS_GRUPOS = [['Dirigir', ['acelerar', 'frear', 'esquerda', 'direita', 'freioMao']], ['Carro', ['buzina', 'farol', 'farolAlto', 'paredao', 'reposicionar']], ['Celular e menus', ['interagir', 'celular', 'radio']]];
const SETA = { acelerar: 'ArrowUp', frear: 'ArrowDown', esquerda: 'ArrowLeft', direita: 'ArrowRight' };
function tecla(a) { return (Settings.teclas && Settings.teclas[a]) || TECLAS_PADRAO[a]; }
function acaoDaTecla(code) { for (const a in TECLAS_PADRAO) if (tecla(a) === code) return a; for (const a in SETA) if (SETA[a] === code) return a; return null; }
function nomeTecla(code) {
  if (!code) return '—';
  const esp = { Space: 'Espaço', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', ShiftLeft: 'Shift', ShiftRight: 'Shift dir.', ControlLeft: 'Ctrl', ControlRight: 'Ctrl dir.', AltLeft: 'Alt', Enter: 'Enter', Tab: 'Tab', Backspace: 'Apagar', CapsLock: 'Caps' };
  if (esp[code]) return esp[code];
  if (/^Key/.test(code)) return code.slice(3); if (/^Digit/.test(code)) return code.slice(5); if (/^Numpad/.test(code)) return 'Num ' + code.slice(6);
  return code;
}
const Captura = { acao: null };
// escuta antes do jogo: enquanto espera a tecla nova, nada mais recebe a tecla
addEventListener('keydown', (e) => {
  if (!Captura.acao) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const a = Captura.acao; Captura.acao = null;
  if (e.code !== 'Escape') {
    Settings.teclas = Object.assign({}, Settings.teclas || {});
    const outra = Object.keys(TECLAS_PADRAO).find((x) => x !== a && tecla(x) === e.code);
    if (outra) Settings.teclas[outra] = tecla(a); // a tecla já era de outra ação: as duas trocam de lugar
    Settings.teclas[a] = e.code; saveSettings();
    try { AudioSys.click(); } catch (er) {}
  }
  renderTeclas();
}, true);
function renderTeclas() {
  const box = document.querySelector('.ct-pane[data-ctp="teclado"]'); if (!box) return;
  box.innerHTML = TECLAS_GRUPOS.map(([g, L]) => `<div class="ct-grupo"><div class="set-section">${g}</div>` + L.map((a) =>
    `<div class="ct-linha"><button class="ct-tecla${Captura.acao === a ? ' esperando' : ''}" data-tecla="${a}">${Captura.acao === a ? 'Aperte…' : escapeHtml(nomeTecla(tecla(a)))}</button>${SETA[a] ? `<kbd>${nomeTecla(SETA[a])}</kbd>` : ''}<span>${TECLAS_NOME[a]}</span></div>`).join('') + '</div>').join('') +
    '<div class="ct-grupo"><div class="set-section">Fixas</div><div class="ct-linha"><kbd>Esc</kbd><span>Pausar</span></div><div class="ct-linha"><kbd>Clique</kbd><span>Celular e menus</span></div><button class="ct-padrao" data-tecla-padrao="1">Voltar ao padrão</button></div>';
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-tecla]'); if (b) { Captura.acao = b.dataset.tecla; renderTeclas(); return; }
  if (e.target.closest('[data-tecla-padrao]')) { Settings.teclas = {}; saveSettings(); try { AudioSys.click(); } catch (er) {} renderTeclas(); }
});

// ---------- controle de videogame ----------
// A: freio de mão · X: interagir · Y: celular · B: buzina · LB: câmera · RB: farol alto · ↑: paredão · ←: farol · ↓: reposicionar · Back: rádio · Start: pausa
const PAD_BOTOES = { 2: 'interagir', 3: 'celular', 5: 'farolAlto', 8: 'radio', 12: 'paredao', 13: 'reposicionar', 14: 'farol' };
Pad.poll = function () {
  const gs = navigator.getGamepads ? navigator.getGamepads() : [];
  let g = null; for (const x of gs || []) if (x && x.connected) { g = x; break; }
  this.ativo = !!g; this.nome = g ? g.id : '';
  if (!g) { this.thr = this.brk = this.steer = 0; this.hb = this.horn = false; return; }
  const b = (i) => g.buttons[i] ? g.buttons[i].value || (g.buttons[i].pressed ? 1 : 0) : 0;
  const ax = g.axes[0] || 0;
  this.steer = Math.abs(ax) > 0.15 ? clamp((ax - Math.sign(ax) * 0.15) / 0.85, -1, 1) : 0;
  this.thr = b(7); this.brk = b(6); this.hb = b(0) > 0.5; this.horn = b(1) > 0.5;
  const ant = this.ant || [];
  for (let i = 0; i < g.buttons.length; i++) {
    const on = b(i) > 0.5;
    if (on && !ant[i]) {
      if (i === 9) KeyPress.push('Escape');
      else if (PAD_BOTOES[i]) KeyPress.push(tecla(PAD_BOTOES[i]));
    }
    ant[i] = on;
  }
  this.ant = ant;
  if (this.avisado !== this.ativo) { this.avisado = this.ativo; if (this.ativo && Game.mode === 'play') toast('Controle conectado', 'Gatilhos aceleram e freiam, analógico vira.', 'info'); renderControle(); }
};
function renderControle() {
  const box = document.querySelector('.ct-pane[data-ctp="controle"]'); if (!box) return;
  const L = [['Gatilho direito (RT / R2)', 'Acelerar'], ['Gatilho esquerdo (LT / L2)', 'Frear / ré'], ['Analógico esquerdo', 'Virar'], ['A / ✕', 'Freio de mão'], ['B / ○', 'Buzina'], ['X / □', 'Interagir'], ['Y / △', 'Celular e mapa'], ['LB / L1', 'Altura da câmera'], ['RB / R1', 'Farol alto'], ['Direcional ↑', 'Paredão'], ['Direcional ←', 'Farol'], ['Direcional ↓', 'Reposicionar'], ['Back / Share', 'Rádio'], ['Start / Options', 'Pausar']];
  box.innerHTML = `<div class="ct-estado${Pad.ativo ? ' on' : ''}">${Pad.ativo ? 'Controle conectado: ' + escapeHtml(Pad.nome.replace(/\(.*\)/, '').trim().slice(0, 40)) : 'Conecte um controle (Xbox ou PlayStation) e aperte um botão.'}</div>` +
    '<div class="ct-grupo ct-pad">' + L.map(([k, t]) => `<div class="ct-linha"><kbd>${k}</kbd><span>${t}</span></div>`).join('') + '</div>';
}

// ---------- legendas ----------
const Legenda = { t: null };
Legenda.fala = function (quem, texto, dur) {
  if (Settings.legendas === false || !texto || Game.mode !== 'play') return;
  let el = $('fala-leg'); if (!el) { el = document.createElement('div'); el.id = 'fala-leg'; document.body.appendChild(el); }
  // frases curtas, uma de cada vez, no tempo da fala (texto longo não vira um bloco na tela)
  const partes = []; let cur = '';
  for (const f of String(texto).split(/(?<=[.!?…])\s+/)) { if (cur && (cur + ' ' + f).length > 70) { partes.push(cur); cur = f; } else cur = cur ? cur + ' ' + f : f; }
  if (cur) partes.push(cur);
  const total = clamp((dur || texto.length / 14) * 1000, 1800, 14000), cada = total / partes.length;
  clearTimeout(this.t); let i = 0;
  const mostra = () => {
    if (i >= partes.length) { el.classList.remove('on'); return; }
    el.innerHTML = (quem ? '<b>' + escapeHtml(quem) + '</b> ' : '') + escapeHtml(partes[i]); el.classList.add('on');
    i++; this.t = setTimeout(mostra, i >= partes.length ? cada + 500 : cada);
  };
  mostra();
};
const nomeCurto = (s) => String(s || '').replace(/\s*\(.*\)\s*/, '').trim();

// ---------- salvamentos ----------
const slotChave = (n) => (+n || 1) === 1 ? 'brnd_save' : 'brnd_save_' + n;
function slotInfo(n) {
  try { const p = JSON.parse(localStorage.getItem(slotChave(n)) || 'null'); return p && p.v === 1 && p.owned ? p : null; } catch (e) { return null; }
}
function usaSlot(n) { Settings.slot = n; saveSettings(); hasSave = !!loadProfileFromStorage(); }
function renderSlots() {
  const box = $('slots-lista'); if (!box) return;
  const cur = +Settings.slot || 1;
  box.innerHTML = [1, 2, 3].map((n) => {
    const p = slotInfo(n);
    if (!p) return `<div class="slot vazio${cur === n ? ' atual' : ''}"><div class="slot-top"><b>Espaço ${n}</b><small>Vazio</small></div><div class="slot-acoes"><button class="mbtn small" data-slot-novo="${n}">Novo jogo</button></div></div>`;
    const cap = (p.rides || 0) + ' corridas · ' + (p.deliveries || 0) + ' entregas';
    const t = Math.floor((p.time || 0) % 1440), hh = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
    const quando = p.salvoEm ? new Date(p.salvoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    const carro = carById(p.current).name;
    let foto = ''; try { foto = localStorage.getItem(slotFoto(n)) || ''; } catch (e) {}
    return `<div class="slot com-foto${cur === n ? ' atual' : ''}">${foto ? `<img class="slot-foto" src="${foto}" alt="">` : '<div class="slot-foto vazia"></div>'}<div class="slot-dir"><div class="slot-top"><b>Espaço ${n}</b><small>${quando ? 'Salvo em ' + quando : ''}</small></div>` +
      `<div class="slot-info"><span>${cap}</span><span>R$ ${fmtMoney(Math.floor(p.money || 0))}</span><span>${DIAS_CURTO[((p.dia === undefined ? 5 : p.dia) % 7 + 7) % 7]} ${hh}</span><span>${escapeHtml(carro)}</span></div>` +
      `<div class="slot-acoes"><button class="mbtn small" data-slot-jogar="${n}">Jogar</button><button class="mbtn small" data-slot-novo="${n}">Novo jogo</button><button class="mbtn small slot-apagar" data-slot-apagar="${n}">Apagar</button></div></div></div>`;
  }).join('');
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-slot-jogar],[data-slot-novo],[data-slot-apagar]'); if (!t) return;
  try { AudioSys.click(); } catch (er) {}
  if (t.dataset.slotJogar) { usaSlot(+t.dataset.slotJogar); Screens.closeAll(); continueGame(); }
  else if (t.dataset.slotNovo) {
    const n = +t.dataset.slotNovo, vai = () => { usaSlot(n); Screens.closeAll(); newGame(); };
    if (slotInfo(n)) confirmBox('Novo jogo no Espaço ' + n, 'O que está salvo neste espaço será apagado.', vai); else vai();
  } else if (t.dataset.slotApagar) {
    const n = +t.dataset.slotApagar;
    confirmBox('Apagar o Espaço ' + n, 'Isso não pode ser desfeito.', () => { try { localStorage.removeItem(slotChave(n)); localStorage.removeItem(slotFoto(n)); } catch (er) {} if ((+Settings.slot || 1) === n) hasSave = false; Screens.open('screen-slots'); });
  }
});

// foto pequena de onde o jogo parou (guardada junto do espaço; no máximo a cada 20 s)
const slotFoto = (n) => 'brnd_foto_' + ((+n || 1));
function tiraFotoSlot() {
  try {
    if (Game.mode !== 'play' || !canvas || Date.now() - (tiraFotoSlot.t || 0) < 20000) return;
    tiraFotoSlot.t = Date.now();
    const c = tiraFotoSlot.c || (tiraFotoSlot.c = makeCanvas(192, 108)), g = c.getContext('2d');
    const W = canvas.width, H = canvas.height, r = 192 / 108; let sw = W, sh = W / r; if (sh > H) { sh = H; sw = H * r; }
    g.drawImage(canvas, (W - sw) / 2, (H - sh) / 2, sw, sh, 0, 0, 192, 108);
    localStorage.setItem(slotFoto(Settings.slot), c.toDataURL('image/jpeg', 0.72));
  } catch (e) {}
}

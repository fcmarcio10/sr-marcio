
/* ============================ PERSONALIZAÇÃO DO CARRO ============================
   Cada carro da garagem guarda o seu "kit": acabamento, rodas, insulfilm, adesivo no vidro,
   desenho no capô, neon, suspensão rebaixada, som automotivo e aerofólio. */
const KIT_CATS = [
  { id: 'paint', name: 'Pintura', car: false },
  { id: 'finish', name: 'Acabamento', car: true, opts: [['normal', 'Brilho de fábrica', 0], ['metal', 'Metálico', 350], ['fosco', 'Fosco', 400]] },
  { id: 'wheels', name: 'Rodas', car: true, opts: [['serie', 'De série', 0], ['cromada', 'Cromada', 450], ['esportiva', 'Esportiva vermelha', 550], ['preta', 'Preta fosca', 500], ['dourada', 'Dourada ostentação', 900], ['tala', 'Tala larga', 750]] },
  { id: 'tint', name: 'Insulfilm', car: true, opts: [[0, 'Sem insulfilm', 0], [1, 'Claro', 150], [2, 'Médio', 220], [3, 'Limousine', 300]] },
  { id: 'sticker', name: 'Adesivo', car: true, opts: [['', 'Nenhum', 0], ['DEUS É FIEL', 'Deus é fiel', 50], ['NÃO SOU DE VITORINHA', 'Não sou de Vitorinha', 50], ['FILHO FEIO NÃO TEM PAI', 'Filho feio não tem pai', 50], ['100% GAMBIARRA', '100% gambiarra', 50], ['SE BEBER, CHAME O SEU ZÉ', 'Se beber, chame o Seu Zé', 50], ['BAH, TCHÊ', 'Bah, tchê', 50], ['OXENTE', 'Oxente', 50], ['UAI, SÔ', 'Uai, sô', 50], ['ÉGUA, MANO', 'Égua, mano', 50]] },
  { id: 'hood', name: 'Desenho', car: true, opts: [['', 'Nenhum', 0], ['chamas', 'Chamas no capô', 300], ['faixas', 'Faixas de rally', 250], ['n27', 'Número 27 no teto', 200]] },
  { id: 'neon', name: 'Neon', car: false, opts: [['', 'Sem neon', 0], ['#22d1ff', 'Azul', 600], ['#ff2bd6', 'Rosa', 600], ['#39ff6a', 'Verde', 600], ['#b84dff', 'Roxo', 600], ['#ffcc2e', 'Amarelo', 600]] },
  { id: 'low', name: 'Suspensão', car: true, opts: [[false, 'Original', 0], [true, 'Rebaixada', 800]] },
  { id: 'sound', name: 'Som', car: false, opts: [[false, 'Rádio de fábrica', 0], [true, 'Paredão (tecla B)', 1200]] },
  { id: 'spoiler', name: 'Aerofólio', car: true, opts: [[false, 'Sem aerofólio', 0], [true, 'Aerofólio', 500]] },
];
// só o que muda alguma coisa pra quem joga (o resto se vê na prévia)
const KIT_DESC = {
  paint: 'R$ 150 cada pintura.',
  low: '+4% de aderência nas curvas. Solta faísca nas lombadas.',
  sound: 'Tecla B liga e desliga. Parado, gasta bateria.',
};
const KIT_DEFAULT = { finish: 'normal', wheels: 'serie', tint: 0, sticker: '', hood: '', neon: '', low: false, sound: false, spoiler: false };
function carKit(id) {
  const cfg = carCfg(id);
  if (!cfg.kit) cfg.kit = Object.assign({}, KIT_DEFAULT);
  return cfg.kit;
}
function kitCatsFor(carId) { const car = VMODELS[carById(carId).model].kind === 'car'; return KIT_CATS.filter((c) => car || !c.car); }
function kitPrice(cat, val) { const C = KIT_CATS.find((c) => c.id === cat); const o = C && C.opts ? C.opts.find((x) => x[0] === val) : null; return o ? o[2] : 0; }
function colorLum(hex) { const n = parseInt(String(hex).replace('#', ''), 16); if (!isFinite(n)) return 0.5; return (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255; }
const RIMS = { cromada: '#d9dde4', esportiva: '#e0302a', preta: '#26272b', dourada: '#e6b43a', tala: '#b8bec8', serie: '#585c66' };

// --- desenho (chamado dentro de drawCar) ---
function kitTint(ctx, k, m, hw, ws, rf, rr, rw, lean) {
  if (!k || !k.tint) return;
  ctx.fillStyle = `rgba(2,4,8,${[0, 0.35, 0.55, 0.78][k.tint]})`;
  ctx.beginPath(); ctx.moveTo(ws, -hw + 2.4 + lean * 0.4); ctx.lineTo(rf, -hw + 4 + lean); ctx.lineTo(rf, hw - 4 + lean); ctx.lineTo(ws, hw - 2.4 + lean * 0.4); ctx.closePath(); ctx.fill();
  if (m.bed === undefined) { ctx.beginPath(); ctx.moveTo(rr, -hw + 4 + lean); ctx.lineTo(rw, -hw + 2.8 + lean * 0.4); ctx.lineTo(rw, hw - 2.8 + lean * 0.4); ctx.lineTo(rr, hw - 4 + lean); ctx.closePath(); ctx.fill(); }
}
function kitOver(ctx, k, m, color, L, W, hl, hw, ws, rf, rr, rw, lean) {
  if (!k) return;
  // desenho no capô / teto
  if (k.hood === 'chamas') {
    ctx.save(); ctx.beginPath(); ctx.rect(ws + 1, -hw + 2, hl - ws - 3, W - 4); ctx.clip();
    for (const [c, s] of [['#ff4a1a', 1], ['#ffb21a', 0.68], ['#fff07a', 0.38]]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(hl - 2, -hw * 0.8 * s);
      for (let i = 0; i <= 6; i++) { const x = hl - 2 - (hl - ws) * (0.35 + 0.65 * (i % 2 ? 0.55 : 1)) * s, y = -hw * 0.8 * s + (hw * 1.6 * s) * i / 6; ctx.lineTo(x, y); }
      ctx.lineTo(hl - 2, hw * 0.8 * s); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  } else if (k.hood === 'faixas') {
    ctx.fillStyle = colorLum(color) > 0.6 ? 'rgba(20,20,24,0.85)' : 'rgba(245,245,245,0.88)';
    ctx.fillRect(-hl + 1, -3.4 + lean * 0.5, L - 2, 2.2); ctx.fillRect(-hl + 1, 1.2 + lean * 0.5, L - 2, 2.2);
  } else if (k.hood === 'n27') {
    const mx = (rr + rf) / 2;
    ctx.fillStyle = '#f4f4f0'; ctx.beginPath(); ctx.arc(mx, lean, Math.min(5, hw - 5), 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(mx, lean); ctx.rotate(Math.PI / 2); ctx.fillStyle = '#0b0d12'; ctx.font = '5.5px "BRND Anton", Impact, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('27', 0, 0.3); ctx.restore();
  }
  // adesivo no vidro traseiro
  if (k.sticker && m.bed === undefined) {
    const mx = (rr + rw) / 2, h = Math.abs(rr - rw);
    ctx.save(); ctx.translate(mx, lean); ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.font = `800 ${Math.min(2.1, h * 0.55)}px "BRND Cond", Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(k.sticker, 0, 0, W - 10);
    ctx.restore();
  }
  // aerofólio
  if (k.spoiler) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-hl - 0.5, -hw + 0.5, 4, W - 1);
    ctx.fillStyle = shade(color, -0.35); ctx.fillRect(-hl - 1.2, -hw + 0.4, 3.4, W - 0.8);
    ctx.fillStyle = shade(color, 0.15); ctx.fillRect(-hl - 1.2, -hw + 0.4, 1, W - 0.8);
    ctx.fillStyle = '#18181b'; ctx.fillRect(-hl + 2, -hw + 4, 2.2, 1.6); ctx.fillRect(-hl + 2, hw - 5.6, 2.2, 1.6);
  }
}

// --- som automotivo (paredão): batida original sintetizada, 130 BPM ---
const Som = { on: false, step: 0, t: 0 };
Som.toggle = function () {
  if (!player || !carKit(player.car.id).sound) { toast('Sem paredão', 'Instale o som na garagem (Personalizar > Som).', 'info'); return; }
  if (carLife().bat <= 0) { toast('Bateria arriada', 'Sem bateria, sem som.', 'bad'); return; }
  this.on = !this.on; this.step = 0; this.t = 0;
  if (this.on) Radio.stop(); // paredão ligado: o DJ sai do ar
  toast(this.on ? 'Som ligado' : 'Som desligado', '', 'info');
};
Som.update = function (dt) {
  if (!this.on) return;
  if (!player || !carKit(player.car.id).sound || carLife().bat <= 0) { this.on = false; return; }
  this.t -= dt; if (this.t > 0) return;
  this.t += 60 / 130 / 4;
  const s = this.step = (this.step + 1) % 16, sp = player.speed;
  const v = AudioSys.ok ? (sp < 30 ? 0.16 : 0.09) : 0;
  if (v) {
    if ([0, 3, 7, 10].includes(s)) { AudioSys.tone(70, 0.22, 'sine', v, 'engine', 38); if (sp < 30) Cam.shake = Math.max(Cam.shake, 0.8); }
    if (s === 4 || s === 12) AudioSys.noise(0.08, 1500, 0.9, v * 0.55, 'engine', 'bandpass');
    if (s % 2 === 0) AudioSys.noise(0.025, 7500, 1, v * 0.18, 'engine', 'highpass');
    const bass = { 0: 55, 6: 65.4, 8: 49, 14: 58.3 }[s]; if (bass) AudioSys.tone(bass, 0.2, 'square', v * 0.22, 'engine');
    if (s === 2 || s === 10) AudioSys.tone(s === 2 ? 880 : 784, 0.06, 'triangle', v * 0.12, 'engine');
  }
  // quem estiver perto dança
  if (sp < 40 && s % 4 === 0) for (const an of Animals.list) if (an.type === 'person' && Math.abs(an.x - player.x) < 170 && Math.abs(an.y - player.y) < 170) an.danceUntil = Game.time + 0.8;
};

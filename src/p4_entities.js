/* ============================ VEÍCULOS DO JOGADOR ============================ */
const CARS = [
  { id: 'pampeiro', name: 'Gou Quadrado 1.6', model: 'quadrado', price: 0, max: 418, acc: 118, brk: 330, steer: 1.0, grip: 1.0, pitch: 1.0, cyl: 4, fuel: 1.0, desc: 'O hatch quadradinho dos anos 80 que todo brasileiro já teve, ou já empurrou. Faróis retangulares, grade de frisos e valentia de sobra.' },
  { id: 'besouro', name: 'Fuska 1300', model: 'besouro', price: 2800, max: 392, acc: 104, brk: 300, steer: 1.05, grip: 0.96, pitch: 1.22, cyl: 4, fuel: 0.9, desc: 'Motor a ar lá atrás, para-lamas redondos e faróis de sapo. Não corre, mas sobe qualquer ladeira de Vila Véia.' },
  { id: 'tropeiro', name: 'Kombo Corujinha', model: 'van', price: 4500, max: 352, acc: 92, brk: 285, steer: 0.9, grip: 0.93, pitch: 0.82, cyl: 4, fuel: 1.15, cargo: 1.25, desc: 'Furgão de motor traseiro, frente em V e duas cores. O xodó das feiras e das mudanças: entregas rendem 25% a mais.' },
  { id: 'escada', name: 'Unho Mile com Escada', model: 'escada', price: 5500, max: 425, acc: 121, brk: 330, steer: 1.08, grip: 1.0, pitch: 1.06, cyl: 4, fuel: 0.85, cargo: 1.1, desc: 'Hatch caixote de teto alto com a famosa escada no teto. Pau pra toda obra: entregas rendem 10% a mais.' },
  { id: 'sertaneja', name: 'Salvêro do Peão', model: 'pickup', price: 3500, max: 446, acc: 128, brk: 320, steer: 0.96, grip: 1.04, pitch: 0.9, cyl: 4, fuel: 1.1, offroad: true, job: 'pickup', desc: 'Picape de cabine simples: o veículo de trabalho mais barato. Faz fretes pelo app Fretes e quase não perde velocidade na terra.' },
  { id: 'cometa', name: 'Santanão 2.0', model: 'santana', price: 12500, max: 508, acc: 146, brk: 370, steer: 1.0, grip: 1.05, pitch: 0.95, cyl: 4, fuel: 1.05, desc: 'Sedã quadradão de quatro portas, o carro do tio no domingo. Firme e confortável na BR-101.' },
  { id: 'bravo', name: 'Escorte XR3 Turbo', model: 'sport', price: 19000, max: 575, acc: 186, brk: 420, steer: 1.12, grip: 1.13, pitch: 1.12, cyl: 4, fuel: 1.2, desc: 'Hatch esportivo dos anos 90 com faixas, aerofólio e escapamento que acorda a rua inteira.' },
  { id: 'gas', name: '1113 do Gás', model: 'gas', price: 7000, max: 330, acc: 86, brk: 270, steer: 0.84, grip: 0.92, pitch: 0.62, cyl: 6, fuel: 1.5, job: 'gas', desc: 'Caminhãozinho de gás com a musiquinha clássica. Entrega botijão de casa em casa pelo app Fretes.' },
  { id: 'guincho', name: 'Cargo Guincho', model: 'guincho', price: 10000, max: 360, acc: 92, brk: 285, steer: 0.82, grip: 0.95, pitch: 0.6, cyl: 6, fuel: 1.6, job: 'guincho', desc: 'Plataforma para rebocar carros quebrados até a oficina do Seu Zé.' },
  { id: 'cacamba', name: 'Caçambona 113', model: 'cacamba', price: 12000, max: 320, acc: 80, brk: 260, steer: 0.78, grip: 0.95, pitch: 0.55, cyl: 6, fuel: 1.8, offroad: true, job: 'cacamba', desc: 'Recolhe entulho das obras da cidade e leva para o aterro.' },
  { id: 'bau', name: 'Acelerô Baú', model: 'bau', price: 16000, max: 350, acc: 84, brk: 270, steer: 0.76, grip: 0.95, pitch: 0.55, cyl: 6, fuel: 1.9, job: 'bau', desc: 'Caminhão baú que abastece mercados, bares e restaurantes. Fretes longos e bem pagos.' },
  { id: 'tanker', name: 'Tanquezão R440', model: 'tanker', price: 24000, max: 340, acc: 76, brk: 250, steer: 0.72, grip: 0.95, pitch: 0.5, cyl: 6, fuel: 2.1, job: 'tanker', desc: 'Caminhão-tanque que abastece os postos. O frete que mais paga, e o mais pesado de manobrar.' },
  { id: 'brasa', name: 'Opalha 6C', model: 'muscle', price: 29000, max: 632, acc: 196, brk: 385, steer: 0.95, grip: 0.98, pitch: 0.78, cyl: 6, fuel: 1.4, desc: 'O sedã clássico de seis canecos, para-choques cromados e teto de vinil. Ronco grave e força de sobra.' },
];
const PALETTE = ['#c0392b', '#e8e8e8', '#1f2a44', '#2e86de', '#f1c40f', '#27ae60', '#16181d', '#8e9aa6', '#e67e22', '#7d3c98', '#6d4c3a', '#ff6fa5'];
const UPGRADES = [
  { id: 'motor', name: 'Motor', desc: 'Aceleração +10%/nível', base: [350, 800, 1600] },
  { id: 'cambio', name: 'Câmbio', desc: 'Velocidade máx. +5%/nível', base: [300, 700, 1400] },
  { id: 'freio', name: 'Freios', desc: 'Frenagem +12%/nível', base: [250, 550, 1100] },
  { id: 'pneu', name: 'Pneus', desc: 'Aderência e direção', base: [300, 650, 1300] },
];
// marcas inventadas, na zoeira (nenhuma marca real)
// marcas "quase" reais, na zoeira (paródias com trocadilho, sem logotipos)
const BRANDS = {
  volks: { name: 'Volks Vagão', color: '#59a8ff', slogan: 'Carro do povo, fiado em 60 vezes.' },
  fia: { name: 'Fiá', color: '#ff4d4d', slogan: 'Compra fiado e paga quando der.' },
  fort: { name: 'Fort', color: '#4f8cff', slogan: 'Forte que nem pão dormido.' },
  chevrole: { name: 'Chevrolé', color: '#ffd23a', slogan: 'Encontre o seu (no ferro-velho).' },
  toyoda: { name: 'Toyoda', color: '#ff6b6b', slogan: 'Dura mais que a sogra.' },
  ronda: { name: 'Ronda', color: '#ff3b30', slogan: 'Cabe em qualquer vão do trânsito.' },
  merces: { name: 'Mercês-Benz', color: '#c9ccd2', slogan: 'Caminhão de fé, abençoado pela Nossa Senhora das Mercês.' },
  escania: { name: 'Escânia', color: '#ff9f1c', slogan: 'Bruto na subida, manso no posto.' },
  varmete: { name: 'Varmete', color: '#3cb371', slogan: 'Puxa até mudança de sogra.' },
};
const MODEL_BRAND = { quadrado: 'volks', besouro: 'volks', van: 'volks', pickup: 'volks', santana: 'volks', escada: 'fia', hatch: 'chevrole', police: 'chevrole', muscle: 'chevrole', sedan: 'toyoda', taxi: 'toyoda', sport: 'fort', guincho: 'fort', moto: 'ronda', gas: 'merces', bau: 'merces', bus: 'merces', truck: 'escania', tanker: 'escania', cacamba: 'escania', tractor: 'varmete' };
function brandOf(model) { return BRANDS[MODEL_BRAND[model] || 'volks']; }
function carFullName(c) { return brandOf(c.model).name + ' ' + c.name; }
function carById(id) { return CARS.find((c) => c.id === id) || CARS[0]; }
function carCfg(id) {
  if (!Profile.cars[id]) Profile.cars[id] = { color: PALETTE[CARS.findIndex((c) => c.id === id) % PALETTE.length], up: { motor: 0, cambio: 0, freio: 0, pneu: 0 } };
  return Profile.cars[id];
}
function upgradeCost(carId, upId, lvl) {
  const car = carById(carId), u = UPGRADES.find((x) => x.id === upId);
  return Math.round(u.base[lvl] * (1 + car.price / 16000) / 10) * 10;
}
function carStats(id) {
  const c = carById(id), u = carCfg(id).up;
  const low = carCfg(id).kit && carCfg(id).kit.low ? 1.04 : 1;
  return { max: c.max * (1 + 0.05 * u.cambio), acc: c.acc * (1 + 0.1 * u.motor), brk: c.brk * (1 + 0.12 * u.freio), grip: c.grip * (1 + 0.07 * u.pneu) * low, steer: c.steer * (1 + 0.04 * u.pneu), rev: 135 };
}

let player = null;
const _cq = [];
class Player {
  constructor(id) {
    this.x = 0; this.y = 0; this.a = 0; this.vx = 0; this.vy = 0; this.px = 0; this.py = 0;
    this.steer = 0; this.roll = 0; this.lean = 0; this.spin = 0; this.rpm = 900; this.gear = 1;
    this.slip = 0; this.braking = false; this.rev = false; this.highBeam = false; this.thr = 0;
    this.impactCd = 0; this.vf = 0; this.yaw = 0; this.surface = SF.ROAD; this.lastRear = null;
    this.setCar(id);
  }
  setCar(id) { this.car = carById(id); this.m = VMODELS[this.car.model]; this.recalc(); }
  recalc() { this.st = carStats(this.car.id); if (typeof Cheats !== 'undefined' && Cheats.turbo) this.st = Object.assign({}, this.st, { max: this.st.max * 1.5, acc: this.st.acc * 1.6, brk: this.st.brk * 1.3 }); this.color = carCfg(this.car.id).color; }
  get speed() { return Math.hypot(this.vx, this.vy); }
  place(x, y, a) { this.x = this.px = x; this.y = this.py = y; this.a = a; this.vx = this.vy = 0; this.steer = 0; this.spin = 0; this.lastRear = null; }
  update(dt, inp) {
    const st = this.st, c = Math.cos(this.a), s = Math.sin(this.a);
    let vf = this.vx * c + this.vy * s, vl = -this.vx * s + this.vy * c;
    this.surface = groundAt(this.x, this.y);
    const surf = SURF[this.surface];
    const offK = this.car.offroad ? 0.4 : 1;
    const paved = this.surface === SF.ROAD || this.surface === SF.BRIDGE || this.surface === SF.PAVED || this.surface === SF.SIDEWALK;
    const muddyS = this.surface === SF.DIRT || this.surface === SF.EARTH;
    const wetK = Math.min(0.85, Weather.wet * (paved ? 0.28 : muddyS ? 0.3 : 0.12) + (Events.cur ? Events.slipAt(this.x, this.y) : 0)); // barro escorrega mais que asfalto molhado; casca de banana mais ainda
    const drag = surf.drag * offK * (1 + (muddyS ? Weather.wet * 0.6 : 0)), gripS = (this.car.offroad ? lerp(1, surf.grip, 0.45) : surf.grip) * (1 - wetK) * CarLife.gripK();
    const brkW = 1 - 0.22 * Weather.wet;
    let maxS = st.max * (1 - Profile.damage / 100 * 0.3), acc = st.acc;
    // barro molhado: patina na saída, a traseira escorrega fácil e o carro “nada” de lado
    const mudS = muddyS ? Weather.wet : 0;
    acc *= 1 - 0.35 * mudS;
    if (Profile.fuel <= 0) { maxS *= 0.3; acc *= 0.3; }
    { const LM = CarLife.mod(); maxS *= LM.max; acc *= LM.acc; } // pneus, óleo e bateria
    // nunca trava de vez: no fundo do poço (sem gasolina, lataria pocada ou bateria arriada) se arrasta a 5%
    const wreck = CarLife.stalled || (Profile.fuel <= 0 && Profile.damage >= 95);
    if (wreck || maxS < st.max * 0.05) { maxS = st.max * 0.05; acc = Math.max(acc, st.acc * 0.25); }
    this.braking = false;
    // arrancada: pneu patina ao sair forte com o carro parado
    if (inp.thr && !this.prevThr && !inp.brk && Math.abs(vf) < 60 && (surf.grip > 0.75 || mudS > 0.3)) this.launchT = 0.5 + st.acc / 650 + mudS * 0.7;
    if (!inp.thr || inp.brk) this.launchT = 0;
    if (this.launchT > 0) this.launchT -= dt;
    if (inp.thr && !inp.brk) {
      if (vf < -8) { vf += st.brk * brkW * dt; this.braking = true; if (vf > 0) vf = 0; }
      else { const k = clamp(vf / maxS, 0, 1); vf += acc * (1.08 - k * k) * (this.launchT > 0 ? 0.82 : 1) * dt; }
    } else if (inp.brk) {
      if (vf > 8) { vf -= st.brk * brkW * dt; this.braking = true; if (vf < 0) vf = 0; }
      else { vf -= acc * 0.75 * dt; if (vf < -st.rev) vf = -st.rev; }
    } else {
      const eb = (38 + Math.abs(vf) * 0.22) * dt;
      vf = Math.abs(vf) <= eb ? 0 : vf - Math.sign(vf) * eb;
    }
    if (inp.hb) { const hb = 260 * dt; vf = Math.abs(vf) <= hb ? 0 : vf - Math.sign(vf) * hb; }
    vf -= vf * drag * dt;
    if (vf > maxS) vf -= (vf - maxS) * Math.min(1, 3 * dt);
    this.vf = vf;
    // direção progressiva e sensível à velocidade
    const target = inp.steer * 0.42 * st.steer / (1 + Math.abs(vf) / 330);
    const rate = Math.abs(target) > Math.abs(this.steer) && Math.sign(target) === Math.sign(this.steer || target) ? 1.9 : 4.2;
    this.steer += clamp(target - this.steer, -rate * dt, rate * dt);
    const wb = this.m.L * 0.62;
    let yaw = vf / wb * Math.tan(this.steer);
    const latMax = 980 * st.grip * gripS;
    const ylim = latMax / Math.max(60, Math.abs(vf));
    yaw = clamp(yaw, -ylim, ylim);
    // derrapagem: curva fechada em alta velocidade faz a traseira escorregar
    const sMax = 0.42 * st.steer / (1 + Math.abs(vf) / 330);
    const frac = Math.abs(this.steer) / Math.max(0.01, sMax);
    const dStart = 210 - 140 * mudS, dRange = 250 - 120 * mudS;
    const drift = vf > 0 ? clamp((vf - dStart) / dRange, 0, 1) * clamp(frac * (1.5 + mudS) - 0.45, 0, 1) * (this.car.offroad ? 0.7 : 1) : 0;
    this.drift = lerp(this.drift || 0, drift, 1 - Math.exp(-6 * dt));
    if (inp.hb && Math.abs(vf) > 40) yaw *= 1.28;
    yaw *= 1 + 0.22 * this.drift;
    this.yaw = yaw;
    const g = (inp.hb ? 3.4 : 17 * (1 - 0.64 * this.drift)) * st.grip * gripS * (1 - 0.55 * mudS);
    // no barro o carro dá umas escorregadas de lado sozinho
    if (mudS > 0.2 && Math.abs(vf) > 40) { this.mudWob = (this.mudWob || 0) + (rnd(-1, 1) * 3 - (this.mudWob || 0) * 1.5) * dt; vl += this.mudWob * mudS * Math.min(1, Math.abs(vf) / 250) * 60 * dt; }
    if (this.drift > 0.05) vl += Math.sign(yaw) * this.drift * Math.abs(vf) * 0.55 * dt;
    vl *= Math.exp(-g * dt);
    this.slip = clamp(Math.abs(vl) / 110 + (this.braking && Math.abs(vf) > 200 ? 0.35 : 0) + (inp.hb && Math.abs(vf) > 70 ? 0.45 : 0) + this.drift * 0.4 + (this.launchT > 0 ? 0.9 : 0), 0, 1.2);
    this.vx = c * vf - s * vl; this.vy = s * vf + c * vl;
    this.a += (yaw + this.spin) * dt;
    this.spin *= Math.exp(-5 * dt);
    this.px = this.x; this.py = this.y;
    this.x += this.vx * dt; this.y += this.vy * dt;
    let impact = this.collide();
    impact = Math.max(impact, this.collideDynamic());
    if (this.inWater()) {
      this.x = this.px; this.y = this.py;
      impact = Math.max(impact, this.speed * 0.6);
      this.vx *= -0.25; this.vy *= -0.25;
    }
    this.impactCd -= dt;
    if (impact > 70 && this.impactCd <= 0) onPlayerImpact(impact);
    // visuais e consumo
    this.roll += vf * dt * 0.35;
    this.lean = lerp(this.lean, clamp(-yaw * vf / 1500, -1, 1), 1 - Math.exp(-8 * dt));
    this.rev = vf < -3 && inp.brk;
    this.thr = lerp(this.thr, inp.thr ? 1 : 0, 1 - Math.exp(-10 * dt));
    const sp = Math.abs(vf);
    const f0 = Profile.fuel;
    Profile.fuel = Math.max(0, Profile.fuel - (0.022 + this.thr * 0.16 * (0.4 + Math.min(1, sp / 400) * 0.6)) * this.car.fuel * dt);
    if (f0 > 15 && Profile.fuel <= 15) toast('Combustível na reserva', 'Procure um posto: Posto Tanque Cheio, no Centrão, ou Posto Estrela Cadente, na BR-101.', 'bad');
    if (f0 > 0 && Profile.fuel <= 0) toast('Tanque vazio!', 'O motor engasga, mas ainda dá para chegar devagar a um posto.', 'bad');
    Profile.dirt = clamp(Profile.dirt + surf.dirt * dt * clamp(sp / 200, 0, 1.5), 0, 1);
    Profile.distance += sp * dt;
    // câmbio automático (para o som e o painel)
    const bounds = [0, 0.18, 0.36, 0.55, 0.76, 1.05];
    const fr = sp / Math.max(1, st.max);
    let gear = 1; while (gear < 5 && fr > bounds[gear]) gear++;
    this.gear = vf < -3 ? -1 : gear;
    const lo = bounds[gear - 1], hi = bounds[gear];
    let rpmT = sp < 6 ? 850 + this.thr * 1600 : 1300 + clamp((fr - lo) / (hi - lo), 0, 1.1) * 5200;
    if (vf < -3) rpmT = 1200 + sp / st.rev * 3000;
    if (this.launchT > 0) rpmT = Math.max(rpmT, 5200);
    this.rpm = lerp(this.rpm, rpmT, 1 - Math.exp(-9 * dt));
    // marcas de pneu e fumaça
    if (this.launchT > 0 && chance(0.5)) {
      const bx = this.x - c * this.m.L * 0.32, by = this.y - s * this.m.L * 0.32, ox2 = -s * (this.m.W / 2 - 2), oy2 = c * (this.m.W / 2 - 2);
      Particles.emit(this.surface === SF.ROAD || this.surface === SF.PAVED ? 'smoke' : 'dust', bx + (chance(0.5) ? ox2 : -ox2) - c * 6, by + (chance(0.5) ? oy2 : -oy2) - s * 6, -c * 40 + rnd(-18, 18), -s * 40 + rnd(-18, 18), rnd(1, 1.8), 8);
    }
    if ((this.slip > 0.45 && sp > 60) || (this.braking && sp > 240) || (this.launchT > 0 && this.surface !== SF.WATER)) {
      const rx = this.x - c * this.m.L * 0.3, ry = this.y - s * this.m.L * 0.3;
      const ox = -s * (this.m.W / 2 - 2.5), oy = c * (this.m.W / 2 - 2.5);
      if (this.lastRear) Skids.add(this.lastRear[0], this.lastRear[1], rx + ox, ry + oy, this.lastRear[2], this.lastRear[3], rx - ox, ry - oy, this.surface);
      this.lastRear = [rx + ox, ry + oy, rx - ox, ry - oy];
      if (chance(0.35)) Particles.emit(this.surface === SF.ROAD || this.surface === SF.PAVED ? 'smoke' : 'dust', rx + (chance(0.5) ? ox : -ox), ry + (chance(0.5) ? oy : -oy), -this.vx * 0.1 + rnd(-10, 10), -this.vy * 0.1 + rnd(-10, 10), rnd(0.8, 1.4), 6);
    } else this.lastRear = null;
    // pneu junta barro na estrada de terra (muito mais na chuva) e larga o rastro no começo do asfalto
    const muddy = this.surface === SF.DIRT || this.surface === SF.EARTH || this.surface === SF.FIELD;
    if (muddy && sp > 10) this.mud = Math.min(1, (this.mud || 0) + dt * (0.25 + Weather.wet * 0.9));
    if (paved && this.mud > 0.02 && sp > 8) {
      const rx = this.x - c * this.m.L * 0.3, ry = this.y - s * this.m.L * 0.3, fx = this.x + c * this.m.L * 0.3, fy = this.y + s * this.m.L * 0.3;
      const ox = -s * (this.m.W / 2 - 3), oy = c * (this.m.W / 2 - 3);
      if (this.lastMud && Math.hypot(rx - this.lastMud[4], ry - this.lastMud[5]) > 3) {
        const L = this.lastMud;
        Skids.add(L[0], L[1], rx + ox, ry + oy, L[2], L[3], rx - ox, ry - oy, 'mud');
        if (this.mud > 0.45) Skids.add(L[6], L[7], fx + ox, fy + oy, L[8], L[9], fx - ox, fy - oy, 'mud');
      }
      if (!this.lastMud || Math.hypot(rx - this.lastMud[4], ry - this.lastMud[5]) > 3) this.lastMud = [rx + ox, ry + oy, rx - ox, ry - oy, rx, ry, fx + ox, fy + oy, fx - ox, fy - oy];
      this.mud = Math.max(0, this.mud - sp * dt * 0.0042); // ~240 unidades de rastro
    } else this.lastMud = null;
    if (muddy && Weather.wet > 0.3) Profile.dirt = clamp(Profile.dirt + dt * 0.02 * Weather.wet * clamp(sp / 150, 0, 1.5), 0, 1);
    // spray de água atrás das rodas na pista molhada
    if (Weather.wet > 0.25 && sp > 140 && paved && chance(0.35 * Weather.wet)) Particles.emit('water', this.x - c * this.m.L * 0.45 + rnd(-6, 6), this.y - s * this.m.L * 0.45 + rnd(-6, 6), -this.vx * 0.12 + rnd(-20, 20), -this.vy * 0.12 + rnd(-20, 20), rnd(0.3, 0.6), 3);
    if (sp > 120 && (this.surface === SF.DIRT || this.surface === SF.EARTH || this.surface === SF.FIELD || this.surface === SF.SAND) && chance(0.45)) {
      Particles.emit('dust', this.x - c * this.m.L * 0.5 + rnd(-6, 6), this.y - s * this.m.L * 0.5 + rnd(-6, 6), -this.vx * 0.15, -this.vy * 0.15, rnd(0.8, 1.6), 8);
    }
    let onB = false;
    for (const b of World.bumps) if (this.x > b.x0 && this.x < b.x1 && this.y > b.y0 && this.y < b.y1) { onB = true; break; }
    if (onB && !this.onBump && sp > 80) {
      Cam.shake = Math.max(Cam.shake, Math.min(9, sp / 45)); AudioSys.thud(); if (sp > 260) { Profile.damage = Math.min(100, Profile.damage + 0.6); }
      // rebaixado raspa o fundo na lombada
      if (carKit(this.car.id).low) { for (let i = 0; i < 14; i++) Particles.emit('spark', this.x + rnd(-8, 8), this.y + rnd(-8, 8), -this.vx * 0.3 + rnd(-90, 90), -this.vy * 0.3 + rnd(-90, 90), rnd(0.2, 0.45), 2); AudioSys.noise(0.25, 3200, 2, 0.08, 'engine', 'bandpass'); Profile.damage = Math.min(100, Profile.damage + 0.3); }
    }
    this.onBump = onB;
    // efeitos: fumaça do capô amassado, escapamento e estouro no escape
    const Zf = Profile.zones ? Profile.zones.f : 0;
    if (Zf > 0.45 && !this.lampWarn) { this.lampWarn = true; toast('Farol avariado', 'A frente amassada deixou o farol fraco. Conserte na Oficina do Seu Zé.', 'bad'); }
    if (Zf < 0.2) this.lampWarn = false;
    for (const sd of [-1, 1]) {
      const off = playerLampBase(sd) <= 0.01, key = sd < 0 ? 'lampOffL' : 'lampOffR';
      if (off && !this[key] && Game.state === 'playing') toast('Farol ' + (sd < 0 ? 'esquerdo' : 'direito') + ' apagou', 'Esse lado amassou demais. A Oficina do Seu Zé troca a lâmpada.', 'bad');
      this[key] = off;
    }
    if (Zf > 0.62 && chance(0.06 + (Zf - 0.62) * 0.5)) Particles.emit(Zf > 0.85 ? 'smoke' : 'steam', this.x + c * this.m.L * 0.38, this.y + s * this.m.L * 0.38, rnd(-10, 10), rnd(-10, 10), rnd(0.8, 1.6), 4);
    if (this.thr > 0.6 && chance(0.12)) Particles.emit('exhaust', this.x - c * this.m.L * 0.52, this.y - s * this.m.L * 0.52, -c * 30 + rnd(-8, 8), -s * 30 + rnd(-8, 8), rnd(0.4, 0.8), 2.5);
    if (this.prevThr > 0.8 && !inp.thr && this.rpm > 4300 && chance(0.6)) { Particles.emit('flame', this.x - c * this.m.L * 0.55, this.y - s * this.m.L * 0.55, -c * 60, -s * 60, 0.18, 5); AudioSys.noise(0.06, 900, 1, 0.25, 'engine', 'lowpass'); AudioSys.tone(70, 0.08, 'square', 0.12, 'engine'); }
    this.prevThr = inp.thr ? 1 : 0;
    if (this.scrapeT > 0) { this.scrapeT -= dt; if (chance(0.25)) AudioSys.noise(0.08, 3400, 3, 0.05, 'engine', 'bandpass'); }
    if (Profile.damage > 84 && chance(0.15)) Particles.emit('smoke', this.x + c * this.m.L * 0.35, this.y + s * this.m.L * 0.35, rnd(-8, 8), rnd(-8, 8), rnd(0.8, 1.5), 5);
  }
  circleOffsets() {
    const r = this.m.W / 2, span = this.m.L / 2 - r;
    return [-span, 0, span];
  }
  collide() {
    const m = this.m, r = m.W / 2 * 0.98;
    const c = Math.cos(this.a), s = Math.sin(this.a);
    const ks = this.circleOffsets();
    let impact = 0;
    colGrid.query(this.x - m.L, this.y - m.L, this.x + m.L, this.y + m.L, _cq);
    if (!_cq.length) return 0;
    for (let iter = 0; iter < 3; iter++) {
      let any = false;
      for (const k of ks) {
        let cx = this.x + c * k, cy = this.y + s * k;
        for (let i = 0; i < _cq.length; i++) {
          const o = _cq[i];
          if (o.dead) continue;
          let nx, ny, pen;
          if (o.t === 0) {
            const qx = clamp(cx, o.x0, o.x1), qy = clamp(cy, o.y0, o.y1);
            const dx = cx - qx, dy = cy - qy, d2 = dx * dx + dy * dy;
            if (d2 >= r * r) continue;
            if (d2 > 1e-6) { const d = Math.sqrt(d2); nx = dx / d; ny = dy / d; pen = r - d; }
            else {
              const l = cx - o.x0, rr = o.x1 - cx, t = cy - o.y0, b = o.y1 - cy, mn = Math.min(l, rr, t, b);
              if (mn === l) { nx = -1; ny = 0; pen = l + r; } else if (mn === rr) { nx = 1; ny = 0; pen = rr + r; } else if (mn === t) { nx = 0; ny = -1; pen = t + r; } else { nx = 0; ny = 1; pen = b + r; }
            }
          } else {
            const dx = cx - o.x, dy = cy - o.y, d2 = dx * dx + dy * dy, R = r + o.r;
            if (d2 >= R * R) continue;
            const d = Math.sqrt(d2) || 0.001; nx = dx / d; ny = dy / d; pen = R - d;
          }
          if (o.brk) {
            const vb = this.vx * nx + this.vy * ny;
            if (-vb > 70) { breakObject(o, this.vx, this.vy, -vb, cx - nx * r, cy - ny * r); this.vx *= 0.82; this.vy *= 0.82; Profile.damage = Math.min(100, Profile.damage + 0.8); if (Profile.zones) Profile.zones.f = Math.min(1, Profile.zones.f + 0.05); continue; }
          }
          this.x += nx * pen; this.y += ny * pen; cx += nx * pen; cy += ny * pen; any = true;
          const vn = this.vx * nx + this.vy * ny;
          // raspando na parede: faíscas e chiado
          const vtan = Math.abs(-this.vx * ny + this.vy * nx);
          if (vtan > 140 && vn > -60) { if (chance(0.5)) Particles.emit('spark', cx - nx * r, cy - ny * r, -this.vx * 0.3 + rnd(-60, 60), -this.vy * 0.3 + rnd(-60, 60), rnd(0.15, 0.35), 2); this.scrapeT = 0.12; }
          if (vn < 0) {
            const jx = -1.25 * vn * nx, jy = -1.25 * vn * ny;
            this.vx += jx; this.vy += jy;
            const tx = -ny, ty = nx, vt = this.vx * tx + this.vy * ty;
            this.vx -= tx * vt * 0.1; this.vy -= ty * vt * 0.1;
            const tau = (c * k) * jy - (s * k) * jx;
            this.spin = clamp(this.spin + tau * 0.00018, -2.5, 2.5);
            if (-vn > impact) { impact = -vn; this.hitX = cx - nx * r; this.hitY = cy - ny * r; }
          }
        }
      }
      if (!any) break;
    }
    return impact;
  }
  collideDynamic() {
    const m = this.m, r = m.W / 2;
    const c = Math.cos(this.a), s = Math.sin(this.a);
    const ks = this.circleOffsets();
    let impact = 0;
    for (const ai of Traffic.cars.concat(Police.units)) {
      const dx0 = ai.x - this.x, dy0 = ai.y - this.y;
      if (dx0 * dx0 + dy0 * dy0 > 160 * 160) continue;
      const ac = Math.cos(ai.a), as = Math.sin(ai.a), ar = ai.m.W / 2;
      const aks = ai.circles;
      for (const k of ks) {
        let cx = this.x + c * k, cy = this.y + s * k;
        for (const ak of aks) {
          const ox = ai.x + ac * ak, oy = ai.y + as * ak;
          const dx = cx - ox, dy = cy - oy, d2 = dx * dx + dy * dy, R = r + ar;
          if (d2 >= R * R) continue;
          const d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d, pen = R - d;
          this.x += nx * pen; this.y += ny * pen; cx += nx * pen; cy += ny * pen;
          const avx = ac * ai.v, avy = as * ai.v;
          const vn = (this.vx - avx) * nx + (this.vy - avy) * ny;
          if (vn < 0) {
            const share = ai.mass / (ai.mass + 1);
            this.vx -= 1.3 * vn * nx * share; this.vy -= 1.3 * vn * ny * share;
            const tau = (c * k) * (-vn * ny) - (s * k) * (-vn * nx);
            this.spin = clamp(this.spin + tau * 0.00015, -2.5, 2.5);
            if (-vn > impact) { impact = -vn; this.hitX = cx - nx * r; this.hitY = cy - ny * r; }
            ai.hit(-vn, -nx, -ny);
            if (-vn > 70 && !ai.isUnit) { if (ai.model === 'police') Police.crime('Bateu na viatura', 2, ai.x, ai.y, true); else if (-vn > 110) Police.crime('Batida na frente da polícia', 1, ai.x, ai.y); }
          }
        }
      }
    }
    for (const an of Animals.list) {
      if (an.type === 'owl') continue;
      const dx0 = an.x - this.x, dy0 = an.y - this.y;
      if (dx0 * dx0 + dy0 * dy0 > 80 * 80) continue;
      for (const k of ks) {
        const cx = this.x + c * k, cy = this.y + s * k;
        const dx = an.x - cx, dy = an.y - cy, d2 = dx * dx + dy * dy, R = r + an.r;
        if (d2 >= R * R) continue;
        const d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d, pen = R - d;
        const heavy = an.r > 8;
        an.x += nx * pen * (heavy ? 0.4 : 1); an.y += ny * pen * (heavy ? 0.4 : 1);
        if (heavy) { this.x -= nx * pen * 0.6; this.y -= ny * pen * 0.6; this.vx *= 0.97; this.vy *= 0.97; }
        an.scare(this.x, this.y, true);
      }
    }
    return impact;
  }
  inWater() {
    const c = Math.cos(this.a), s = Math.sin(this.a), hl = this.m.L / 2 - 3, hw = this.m.W / 2 - 3;
    for (const [u, v] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw], [0, 0]]) {
      if (groundAt(this.x + c * u - s * v, this.y + s * u + c * v) === SF.WATER) return true;
    }
    return false;
  }
}

/* ============================ TRÁFEGO (IA) ============================ */
const Traffic = { cars: [], idc: 1, timer: 0, cum: null, total: 0 };
function trafficRush() {
  // 19:30–21:00 saída do trabalho; 04:30–05:00 gente indo trabalhar; madrugada vazia
  const t = Profile.time;
  if (t < 21 * 60) return { k: 1.45, label: 'horário de pico' };
  if (t < 23 * 60) return { k: 1.0, label: '' };
  if (t < 25 * 60) return { k: 0.72, label: '' };
  if (t < 28 * 60 + 30) return { k: 0.42, label: 'madrugada' };
  return { k: 1.2, label: 'horário de pico' };
}
// área rural: 60% menos movimento que na cidade
function ruralFactor(x, y) { const R = REGIONS[regionKeyAt(x, y)]; return 1 - 0.8 * clamp((R.rural - 0.3) / 0.5, 0, 1); }
function lightState(n, axis, now) {
  const t = (now + n.light.off) % 15;
  if (axis === 'H') return t < 6 ? 'G' : t < 7.5 ? 'Y' : 'R';
  return t >= 8 && t < 13 ? 'G' : t >= 13 && t < 14.5 ? 'Y' : 'R';
}
function wpick(list) {
  let tot = 0; for (const it of list) tot += it[1];
  let r = rnd(tot);
  for (const it of list) { r -= it[1]; if (r <= 0) return it[0]; }
  return list[0][0];
}
function trafficModelFor(e) {
  switch (e.T.id) {
    case 'dirt': return wpick([['pickup', 4.5], ['tractor', 2.6], ['truck', 1.0], ['cacamba', 0.4], ['quadrado', 0.9], ['besouro', 0.7], ['moto', 0.9]]);
    case 'highway': return wpick([['truck', 1.5], ['bau', 1.4], ['tanker', 0.8], ['gas', 0.5], ['cacamba', 0.6], ['bus', 1.2], ['santana', 2], ['sedan', 1.5], ['quadrado', 1.5], ['escada', 1.2], ['hatch', 1], ['pickup', 2], ['van', 0.8], ['sport', 0.4], ['police', 0.5]]);
    case 'road': return wpick([['pickup', 4], ['tractor', 1.4], ['truck', 1.6], ['bau', 0.7], ['cacamba', 0.5], ['gas', 0.3], ['quadrado', 1], ['santana', 0.8], ['besouro', 0.6], ['moto', 0.6]]);
    case 'avenue': return wpick([['quadrado', 2.5], ['escada', 2], ['besouro', 1.2], ['hatch', 1.5], ['santana', 2], ['sedan', 1.5], ['taxi', 1.5], ['bus', 1.1], ['pickup', 1.2], ['van', 1], ['sport', 0.5], ['truck', 0.4], ['moto', 1.8], ['police', 0.6]]);
    default: return wpick([['gas', 0.35], ['quadrado', 3], ['escada', 2.5], ['besouro', 2], ['hatch', 1.5], ['santana', 2], ['sedan', 1], ['taxi', 1], ['pickup', 1.5], ['van', 1.2], ['sport', 0.5], ['moto', 2.2], ['police', 0.35]]);
  }
}
class AICar {
  constructor(e, dir, s, lane, model) {
    this.id = Traffic.idc++;
    this.m = VMODELS[model]; this.model = model;
    this.horn = model === 'moto' ? 'moto' : model === 'tractor' ? 'trator' : model === 'bus' ? 'onibus' : VMODELS[model].kind === 'truck' ? 'caminhao' : model === 'besouro' || model === 'van' ? pick(['fusquinha', 'fusquinha', 'dupla']) : model === 'sport' || model === 'muscle' ? pick(['esportivo', 'musical']) : pick(['dupla', 'dupla', 'fina', 'fina', 'musical', 'esportivo']);
    this.big = this.m.kind === 'truck' || model === 'bus';
    this.color = model === 'taxi' || model === 'police' ? '#f2f2ee' : model === 'bus' ? pick(['#2a6fd1', '#d13a2a', '#1f9a5a', '#e0a020']) : model === 'tractor' ? pick(['#2e8b3a', '#c0392b', '#2e5fae']) : pick(CAR_COLORS);
    this.box = pick(['#d9d6cc', '#e8e8e8', '#c9c3b5', '#d07a2a', '#5a7aa0']);
    this.mass = this.big ? 6 : model === 'tractor' ? 3 : model === 'moto' ? 0.7 : 1.6;
    this.vmax = this.m.kind === 'truck' ? 235 : model === 'bus' ? 190 : model === 'tractor' ? 70 : model === 'van' ? 205 : 1e9;
    this.acc = this.big ? 70 : model === 'tractor' ? 45 : model === 'moto' ? 190 : rnd(120, 160);
    this.turnV = this.big ? 55 : model === 'tractor' ? 40 : model === 'moto' ? 92 : 82;
    this.mul = rnd(0.85, 1.1);
    const r = this.m.W / 2, span = Math.max(0, this.m.L / 2 - r);
    const n = Math.max(2, Math.ceil(this.m.L / (this.m.W * 1.1)));
    this.circles = []; for (let i = 0; i < n; i++) this.circles.push(-span + 2 * span * i / (n - 1));
    this.alive = true; this.wait = 0; this.ghost = 0; this.hitT = 0; this.ox = 0; this.oy = 0; this.honkT = rnd(1, 3);
    this.roll = 0; this.state = 'edge'; this.blink = 0; this.braking = false; this.v = 0;
    if (this.big) lane = 1;
    this.setEdge(e, dir, lane);
    this.s = clamp(s, this.sStart, this.sEnd);
    this.v = this.cruise * 0.8;
    this.chooseNext();
    this.pose();
  }
  setEdge(e, dir, lane) {
    this.e = e; this.dir = dir;
    this.from = dir > 0 ? e.a : e.b; this.to = dir > 0 ? e.b : e.a;
    this.dx = e.dx * dir; this.dy = e.dy * dir;
    this.lane = Math.min(lane, e.T.lanes.length - 1);
    this.off = e.T.lanes[this.lane];
    this.sStart = dir > 0 ? e.clearA : e.clearB;
    this.sEnd = Math.max(this.sStart, e.len - (dir > 0 ? e.clearB : e.clearA));
    this.cruise = Math.min(e.T.speed * this.mul, this.vmax);
    this.committed = false;
    this.offT = this.off; this.overtake = 0; this.lcBlink = 0;
  }
  edgePos(s) { return [this.from.x + this.dx * s - this.dy * this.off, this.from.y + this.dy * s + this.dx * this.off]; }
  allowed(e) {
    if (e.closed) return false;
    if (this.model === 'bus' && e.T.id === 'dirt') return false;
    if (this.model === 'tractor' && (e.T.id === 'highway' || e.T.id === 'avenue' || e.T.id === 'street')) return false;
    if (this.m.kind === 'truck' && e.T.id === 'street' && chance(0.7)) return false;
    return true;
  }
  chooseNext() {
    const n = this.to;
    let opts = n.edges.filter((x) => x !== this.e && this.allowed(x));
    if (!opts.length) opts = n.edges.filter((x) => x !== this.e && !x.closed);
    let ne, nd;
    if (!opts.length) { ne = this.e; nd = -this.dir; }
    else {
      const weighted = opts.map((x) => { const d = x.a === n ? 1 : -1; const dot = this.dx * x.dx * d + this.dy * x.dy * d; return [x, dot > 0.5 ? 2.3 : 1]; });
      ne = wpick(weighted); nd = ne.a === n ? 1 : -1;
    }
    const ox = ne.dx * nd, oy = ne.dy * nd;
    const dot = this.dx * ox + this.dy * oy, cross = this.dx * oy - this.dy * ox;
    this.turnType = dot > 0.5 ? 'straight' : dot < -0.5 ? 'uturn' : cross > 0 ? 'right' : 'left';
    let lane = this.lane;
    if (ne.T.lanes.length > 1) { if (this.big) lane = 1; else if (this.turnType === 'right') lane = 1; else if (this.turnType === 'left') lane = 0; else lane = this.lane; } else lane = 0;
    this.next = { e: ne, dir: nd, lane };
    this.blink = this.turnType === 'right' ? 1 : this.turnType === 'left' || this.turnType === 'uturn' ? -1 : 0;
  }
  exitBlocked() {
    const N = this.next;
    for (const o of Traffic.cars) {
      if (o === this || o.state !== 'edge' || o.e !== N.e || o.dir !== N.dir) continue;
      if (o.s - o.sStart < this.m.L + 26 && o.v < 60) return true;
    }
    if (player && Game.state !== 'menu') {
      const T = this.planTurn();
      for (let i = 2; i < T.pts.length - 1; i++) { const q = T.pts[i]; if (Math.hypot(q[0] - player.x, q[1] - player.y) < player.m.W * 0.5 + 14) return true; }
    }
    return false;
  }
  planTurn() {
    if (this.plan && this.plan.e === this.e && this.plan.dir === this.dir && this.plan.ne === this.next.e && this.plan.nd === this.next.dir && this.plan.off === this.off) return this.plan;
    const p0 = this.edgePos(this.sEnd);
    const N = this.next, ne = N.e, nd = N.dir;
    const ox = ne.dx * nd, oy = ne.dy * nd;
    const off = ne.T.lanes[Math.min(N.lane, ne.T.lanes.length - 1)];
    const s0 = nd > 0 ? ne.clearA : ne.clearB;
    const n = this.to;
    const p3 = [n.x + ox * s0 - oy * off, n.y + oy * s0 + ox * off];
    let k1, k2;
    if (this.turnType === 'uturn') { k1 = 45; k2 = 45; }
    else if (this.turnType === 'straight') { k1 = k2 = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) / 3; }
    else { k1 = Math.max(4, ((p3[0] - p0[0]) * this.dx + (p3[1] - p0[1]) * this.dy) * 0.55); k2 = Math.max(4, ((p3[0] - p0[0]) * ox + (p3[1] - p0[1]) * oy) * 0.55); }
    const c1 = [p0[0] + this.dx * k1, p0[1] + this.dy * k1], c2 = [p3[0] - ox * k2, p3[1] - oy * k2];
    let len = 0, lx = p0[0], ly = p0[1];
    const pts = [p0];
    for (let i = 1; i <= 12; i++) { const q = bez(p0, c1, c2, p3, i / 12); len += Math.hypot(q[0] - lx, q[1] - ly); lx = q[0]; ly = q[1]; pts.push(q); }
    this.plan = { e: this.e, dir: this.dir, ne, nd, off: this.off, p0, c1, c2, p3, len: Math.max(len, 1), pts, node: n };
    return this.plan;
  }
  conflicts(n) {
    // dois trajetos dentro do cruzamento que passam a menos de ~22px um do outro não entram juntos
    if (!n.active) n.active = new Set();
    const A = this.planTurn().pts;
    for (const o of n.active) {
      if (o === this || !o.alive) { if (!o.alive) n.active.delete(o); continue; }
      if (o.e === this.e && o.dir === this.dir && o.lane === this.lane) continue; // mesma fila: segue atrás
      const B = (o.state === 'turn' ? o.turn : o.plan);
      if (!B) continue;
      const tStart = o.state === 'turn' ? Math.floor(o.turn.t * 12) : 0;
      for (const p of A) for (let j = tStart; j < B.pts.length; j++) { const q = B.pts[j]; const dx = p[0] - q[0], dy = p[1] - q[1]; if (dx * dx + dy * dy < 22 * 22) return true; }
    }
    return false;
  }
  laneClear(off2, back, fwd) {
    const nx = -this.dy, ny = this.dx;
    const test = (ox, oy) => {
      const al = (ox - this.x) * this.dx + (oy - this.y) * this.dy;
      if (al < back || al > fwd) return true;
      const lat = (ox - this.from.x) * nx + (oy - this.from.y) * ny;
      return Math.abs(lat - off2) > 20;
    };
    for (const o of Traffic.cars) if (o !== this && !test(o.x, o.y)) return false;
    if (player && Game.state !== 'menu' && !test(player.x, player.y)) return false;
    return true;
  }
  tryPass() {
    const T = this.e.T, bl = this.blocker;
    const bv = bl === player ? player.speed : (bl.v || 0);
    if (bv > this.cruise - 12) return;
    if (T.lanes.length > 1 && !this.big) {
      const L2 = 1 - this.lane, off2 = T.lanes[L2];
      if (this.laneClear(off2, -70, 120)) { this.lane = L2; this.offT = off2; this.lcT = 3.5; }
      else this.lcT = 0.6;
    } else if (T.lanes.length === 1 && (bl === player || (bl instanceof AICar && bl.hitT > 0)) && this.wait > 1.8 && this.overtake <= 0 && bv < 25) {
      const off2 = -T.lanes[0];
      if (this.laneClear(off2, -40, 280)) { this.offT = off2; this.overtake = 4; this.lcT = 6; }
      else this.lcT = 1;
    }
  }
  canEnter(remain, now) {
    const n = this.to;
    if (this.exitBlocked()) return false;
    if (n.light) {
      const st = lightState(n, this.e.h ? 'H' : 'V', now);
      const go = st === 'G' || (st === 'Y' && remain < 25);
      if (go && this.conflicts(n)) return false;
      if (go && (this.turnType === 'left' || this.turnType === 'uturn')) {
        for (const o of Traffic.cars) {
          if (o === this || o.e.h !== this.e.h || o.dir === this.dir || o.turnType === 'left') continue;
          if (o.state === 'edge' && o.to === n && o.sEnd - o.s < 150 && o.v > 10) return false;
          if (o.state === 'turn' && o.turn.node === n && o.turnType === 'straight') return false;
        }
      }
      return go;
    }
    if (n.edges.length >= 3) return !this.conflicts(n);
    return true;
  }
  startTurn() {
    const P = this.planTurn();
    this.turn = { p0: P.p0, c1: P.c1, c2: P.c2, p3: P.p3, len: P.len, pts: P.pts, t: 0, node: P.node };
    if (!P.node.active) P.node.active = new Set();
    P.node.active.add(this);
    this.state = 'turn';
  }
  finishTurn() {
    const n = this.turn.node;
    if (n.active) n.active.delete(this);
    this.plan = null;
    this.setEdge(this.next.e, this.next.dir, this.next.lane);
    this.s = this.sStart; this.state = 'edge';
    this.chooseNext();
  }
  hit(imp, nx, ny) {
    addZoneDamage(this.zones || (this.zones = { f: 0, r: 0, l: 0, rt: 0 }), this, this.x - nx * 20, this.y - ny * 20, clamp((imp - 40) / 300, 0, 1));
    this.hitT = Math.max(this.hitT, 0.8 + Math.min(2, imp / 250));
    const k = Math.min(10, imp * 0.03) / this.mass * 1.6;
    this.ox += nx * k; this.oy += ny * k;
    if (imp > 60) this.honkT = Math.min(this.honkT, 0.3);
  }
  scanAhead() {
    const look = 34 + this.v * 1.15 + this.m.L / 2;
    const c = Math.cos(this.a), s = Math.sin(this.a);
    const lat = this.state === 'turn' ? 14 : 13;
    let best = 1e9; this.blocker = null;
    const check = (o, ox, oy, oL, oW) => {
      const rx = ox - this.x, ry = oy - this.y;
      const f = rx * c + ry * s;
      if (f <= 0 || f > look + oL / 2) return;
      const l = -rx * s + ry * c;
      if (Math.abs(l) > lat + oW * 0.5) return;
      const g = f - this.m.L / 2 - oL / 2;
      if (g < best) { best = g; this.blocker = o; }
    };
    for (const o of Traffic.cars) {
      if (o === this) continue;
      // modo fantasma (para destravar ciclos no cruzamento) nunca atravessa a fila da própria faixa
      const sameQueue = this.state === 'edge' && o.state === 'edge' && o.e === this.e && o.dir === this.dir && Math.abs(o.off - this.off) < 12;
      if (this.ghost > 0 && !sameQueue) continue;
      if (this.state === 'turn' && o.state === 'edge' && o.e !== this.next.e && Math.abs(angDiff(o.a, this.a)) > 0.9) continue; // parado na faixa de retenção da outra rua
      check(o, o.x, o.y, o.m.L, o.m.W);
    }
    // o jogador é visto de mais longe e com folga lateral maior: os carros mantêm distância de você
    if (player && Game.state !== 'menu') { const m = this.state === 'edge' ? 1 : 0; check(player, player.x, player.y, player.m.L + 26 * m, player.m.W + 12 * m); }
    if (this.ghost <= 0 && this.animalGhost <= 0) for (const an of Animals.list) if (an.onRoad) check(an, an.x, an.y, an.r * 2, an.r * 2);
    if (Events.cur) Events.blocksAhead(this, check);
    return best;
  }
  update(dt, now) {
    let target = this.cruise * (1 - 0.15 * Weather.wet); // na chuva todo mundo vai mais devagar
    if (this.yieldT > 0) { this.yieldT -= dt; target *= 0.35; } // ouviu a sirene: encosta e deixa passar
    if (Events.slow && Events.slowAt(this.x, this.y)) target = Math.min(target, 75); // blitz: todo mundo passa devagar
    const gap = this.scanAhead();
    // rua fechada por evento (festa, carreta tombada): dá meia-volta
    if (this.blocker && this.blocker === Events.cur && this.state === 'edge' && this.v < 5 && this.wait > 2.5) {
      const e = this.e, s = this.s, ox = this.x, oy = this.y;
      if (this.to.active) this.to.active.delete(this);
      this.setEdge(e, -this.dir, 0); this.s = clamp(e.len - s, this.sStart, this.sEnd);
      this.v = 0; this.wait = 0; this.chooseNext(); this.pose();
      this.ox = ox - this.x; this.oy = oy - this.y; this.pose();
    }
    if (this.state === 'edge') {
      const remain = this.sEnd - this.s;
      if (this.turnType !== 'straight') target = Math.min(target, this.turnV + remain * 0.9);
      const firstInLine = !(gap < remain + 4 && this.blocker instanceof AICar && this.blocker.state === 'edge' && this.blocker.e === this.e);
      // cansou de esperar na faixa de retenção sem ser sinal vermelho: escolhe outro caminho
      if (!this.committed && firstInLine && this.wait > 8 && remain < 30 && !(this.to.light && lightState(this.to, this.e.h ? 'H' : 'V', now) !== 'G')) {
        const old = this.next.e; this.chooseNext(); if (this.next.e === old && this.to.edges.length > 2) this.chooseNext();
        this.plan = null; this.wait = 3;
      }
      if (!this.committed && firstInLine && remain < 40 + this.v * 0.9) {
        if (this.canEnter(remain, now)) { this.committed = true; if (!this.to.active) this.to.active = new Set(); this.planTurn(); this.to.active.add(this); }
        else { target = Math.min(target, Math.max(0, (remain - 2) * 2.2)); this.atLight = !!this.to.light; }
      }
    } else target = this.turnType === 'straight' ? this.cruise : this.turnV;
    if (gap < 1e9) {
      const bl = this.blocker;
      let bv = 0;
      if (bl === player) bv = Math.max(0, player.vx * Math.cos(this.a) + player.vy * Math.sin(this.a));
      else if (bl instanceof AICar) bv = Math.max(0, bl.v * Math.cos(bl.a - this.a));
      const keep = bl === player ? 34 : 14; // distância de segurança maior atrás de você
      target = Math.min(target, Math.max(0, bv + (gap - keep) * 1.1), Math.max(0, (gap - keep * 0.5) * 3));
    }
    // ultrapassagem / troca de faixa
    this.lcT = (this.lcT || 0) - dt;
    if (this.state === 'edge' && gap < 110 && this.blocker && !(this.blocker instanceof Animal) && this.lcT <= 0 && this.sEnd - this.s > 170) this.tryPass();
    if (this.overtake > 0) {
      this.overtake -= dt;
      const passed = player && ((player.x - this.x) * this.dx + (player.y - this.y) * this.dy) < -this.m.L - 10;
      if (this.overtake <= 0 || passed || this.sEnd - this.s < 120 || !this.laneClear(this.offT, 0, 140)) { this.overtake = 0; this.offT = this.e.T.lanes[this.lane]; }
    }
    // desvio leve: se você está meio dentro da faixa à frente, ele se afasta um pouco dentro da pista
    this.nudge = (this.nudge || 0) * Math.exp(-2 * dt);
    if (player && this.state === 'edge' && Game.state !== 'menu') {
      const rx = player.x - this.x, ry = player.y - this.y, f = rx * this.dx + ry * this.dy;
      if (f > 0 && f < 60 + this.v * 1.2) {
        const l = -rx * this.dy + ry * this.dx, room = 8;
        if (Math.abs(l) < 34 && Math.abs(l) > 6) { const nd = clamp(-Math.sign(l) * (34 - Math.abs(l)) * 0.5, -room, room); if (this.e.T.lanes.length === 1 || this.laneClear(this.offT + nd, -40, 80)) this.nudge = nd; }
      }
    }
    const dOff = this.offT + this.nudge + (this.yieldT > 0 && this.e.T.lanes.length === 1 ? 9 : 0) - this.off;
    this.off += clamp(dOff, -42 * dt, 42 * dt);
    this.lcBlink = Math.abs(dOff) > 2 ? (dOff > 0 ? 1 : -1) : 0;
    if (this.hitT > 0) { this.hitT -= dt; target = 0; }
    this.ghost -= dt;
    if (this.v < 5 && target < 5) this.wait += dt; else this.wait = Math.max(0, this.wait - dt * 2);
    if (this.wait > 4 && gap < 1e9 && this.ghost <= 0 && this.blockCycle()) { this.ghost = 2; this.wait = 0; }
    // bicho na pista: buzina, espanta e, se não sair, contorna
    this.animalGhost = (this.animalGhost || 0) - dt;
    if (this.blocker instanceof Animal && this.v < 5) {
      this.animalWait = (this.animalWait || 0) + dt;
      if (this.animalWait > 1.2 && this.blocker.state !== 'flee') this.blocker.scare(this.x, this.y, true);
      if (this.animalWait > 3) { this.animalGhost = 2; this.animalWait = 0; }
    } else this.animalWait = 0;
    if (this.v > 8) this.atLight = false;
    this.honkT -= dt;
    if (this.honkT <= 0) {
      this.honkT = rnd(2.5, 4.5);
      if (player && Game.state === 'playing' && ((this.blocker === player && (this.wait > 2 || (gap < 26 && this.v > 70))) || this.hitT > 0)) {
        const d = Math.hypot(this.x - player.x, this.y - player.y), pan = (this.x - player.x) / 500;
        AudioSys.aiHorn(d, this.horn, pan, this.wait > 6);
        this.honking = this.wait > 6 ? 0.9 : 0.4;
      }
    }
    if (this.honking > 0) this.honking -= dt;
    this.braking = target < this.v - 5;
    if (this.v < target) this.v = Math.min(target, this.v + this.acc * dt);
    else this.v = Math.max(target, this.v - (this.hitT > 0 ? 600 : 380) * dt);
    if (this.state === 'edge') {
      this.s += this.v * dt;
      if (this.s >= this.sEnd) { if (this.committed) this.startTurn(); else { this.s = this.sEnd; this.v = 0; } }
    } else {
      this.turn.t += this.v * dt / this.turn.len;
      if (this.turn.t >= 1) this.finishTurn();
    }
    this.ox *= Math.exp(-2.5 * dt); this.oy *= Math.exp(-2.5 * dt);
    this.roll += this.v * dt * 0.35;
    // poeira levantada na estrada de terra
    if (this.v > 50 && (this.state === 'edge' ? this.e.T.id === 'dirt' : this.dirtTurn) && chance(dt * 9)) {
      const v = Cam.view;
      if (v && this.x > v.x0 - 60 && this.x < v.x1 + 60 && this.y > v.y0 - 60 && this.y < v.y1 + 60) {
        const c = Math.cos(this.a), s = Math.sin(this.a), L = this.m.L * 0.5;
        Particles.emit('dust', this.x - c * L + rnd(-6, 6), this.y - s * L + rnd(-6, 6), -c * this.v * 0.12, -s * this.v * 0.12, rnd(0.9, 1.7), 8);
      }
    }
    this.pose();
  }
  pose() {
    if (this.state === 'edge') {
      const p = this.edgePos(this.s);
      this.x = p[0] + this.ox; this.y = p[1] + this.oy; this.a = Math.atan2(this.dy, this.dx);
      this.steerVis = 0;
    } else {
      const T = this.turn, p = bez(T.p0, T.c1, T.c2, T.p3, T.t), d = bezD(T.p0, T.c1, T.c2, T.p3, T.t);
      this.x = p[0] + this.ox; this.y = p[1] + this.oy; this.a = Math.atan2(d[1], d[0]);
      this.steerVis = this.turnType === 'right' ? 0.35 : this.turnType === 'straight' ? 0 : -0.35;
    }
  }
  blockCycle() {
    const b = this.blocker;
    if (b instanceof AICar && b.state === 'edge' && this.state === 'edge' && b.e === this.e && b.dir === this.dir) return false; // fila normal, não é ciclo
    let o = this.blocker, k = 0;
    while (o && o !== player && o instanceof AICar && k < 5) { if (o === this) return true; o = o.blocker; k++; }
    return false;
  }
  release() {
    this.alive = false;
    for (const n of [this.to, this.from]) if (n.active) n.active.delete(this);
    if (this.turn && this.turn.node.active) this.turn.node.active.delete(this);
  }
}
function bez(p0, c1, c2, p3, t) {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p0[0] + b * c1[0] + c * c2[0] + d * p3[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p3[1]];
}
function bezD(p0, c1, c2, p3, t) {
  const u = 1 - t;
  return [3 * u * u * (c1[0] - p0[0]) + 6 * u * t * (c2[0] - c1[0]) + 3 * t * t * (p3[0] - c2[0]), 3 * u * u * (c1[1] - p0[1]) + 6 * u * t * (c2[1] - c1[1]) + 3 * t * t * (p3[1] - c2[1])];
}
Traffic.prepare = function () {
  let acc = 0;
  this.cum = World.edges.map((e) => (acc += e.len));
  this.total = acc;
};
Traffic.randomEdge = function () {
  const r = rnd(this.total);
  let lo = 0, hi = this.cum.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (this.cum[mid] < r) lo = mid + 1; else hi = mid; }
  return World.edges[lo];
};
/* ---------- trânsito só em volta da tela (estilo GTA) ----------
   Carro nasce logo fora da borda da tela e entra andando. Carro que fica fora da tela por alguns
   segundos é apagado. Fora da tela, quem ainda existe é calculado 4x menos vezes. Se um trecho já
   está cheio (engarrafamento), não chega carro novo ali. */
const TR_RING = 240;      // faixa em volta da tela onde os carros nascem e existem (pequena)
const TR_GONE = 2.5;      // segundos fora da tela até o carro sumir
const TR_SLOW = 1 / 30;   // passo do cálculo fora da tela (30 vezes por segundo, em vez de 120)
// quantos carros cabem na faixa (mesma sensação de rua movimentada na tela)
function trafficTarget(view) {
  const dens = Settings.quality === 'alta' ? 2.4 : Settings.quality === 'baixa' ? 1.6 : 2; // carros por milhão de unidades²
  const area = (view.x1 - view.x0 + TR_RING * 2) * (view.y1 - view.y0 + TR_RING * 2) / 1e6;
  const k = Cam && Cam.x !== undefined ? ruralFactor(Cam.x, Cam.y) : 1;
  return clamp(Math.round(dens * area * Math.min(1.2, trafficRush().k) * k), k < 0.7 ? 1 : 2, 9);
}
function trInView(c, v, m) { return c.x > v.x0 - m && c.x < v.x1 + m && c.y > v.y0 - m && c.y < v.y1 + m; }
// ruas que passam perto da tela
Traffic.nearEdges = [];
Traffic.scanEdges = function (v) {
  const x0 = v.x0 - TR_RING, y0 = v.y0 - TR_RING, x1 = v.x1 + TR_RING, y1 = v.y1 + TR_RING, L = this.nearEdges;
  L.length = 0; this.nearMax = 0;
  for (const e of World.edges) {
    if (e.closed) continue;
    const ex0 = Math.min(e.a.x, e.b.x), ex1 = Math.max(e.a.x, e.b.x), ey0 = Math.min(e.a.y, e.b.y), ey1 = Math.max(e.a.y, e.b.y);
    if (ex1 < x0 || ex0 > x1 || ey1 < y0 || ey0 > y1) continue;
    L.push(e); if (e.len > this.nearMax) this.nearMax = e.len;
  }
};
// tenta pôr um carro na faixa em volta da tela (ou na tela também, quando ninguém está vendo ainda)
Traffic.spawnRing = function (v, inside) {
  const L = this.nearEdges; if (!L.length) return null;
  const fast = player && Game.state === 'playing' && player.speed > 140;
  for (let t = 0; t < 30; t++) {
    const e = L[(Math.random() * L.length) | 0];
    if (rnd(this.nearMax) > e.len) continue; // rua comprida recebe mais carro
    if (e.closed) continue;
    const dir = chance(0.5) ? 1 : -1;
    const sStart = dir > 0 ? e.clearA : e.clearB, sEnd = e.len - (dir > 0 ? e.clearB : e.clearA);
    if (sEnd - sStart < 80) continue;
    const s = rnd(sStart + 20, sEnd - 20);
    const fx = dir > 0 ? e.a : e.b, dx = e.dx * dir, dy = e.dy * dir;
    const lane = e.T.lanes.length > 1 ? (chance(0.5) ? 1 : 0) : 0, off = e.T.lanes[lane];
    const x = fx.x + dx * s - dy * off, y = fx.y + dy * s + dx * off;
    if (x < v.x0 - TR_RING || x > v.x1 + TR_RING || y < v.y0 - TR_RING || y > v.y1 + TR_RING) continue;
    if (!inside && x > v.x0 - 70 && x < v.x1 + 70 && y > v.y0 - 70 && y < v.y1 + 70) continue; // nunca aparece do nada na tela
    // correndo: carro novo nasce na frente, não atrás
    if (fast && (x - player.x) * player.vx + (y - player.y) * player.vy < 0 && chance(0.8)) continue;
    // de preferência já vindo em direção à tela (senão ele vai embora antes de alguém ver)
    if (!inside && (((v.x0 + v.x1) / 2 - x) * dx + ((v.y0 + v.y1) / 2 - y) * dy) < 0) continue; // nunca nasce indo embora
    // trecho cheio (engarrafamento): não manda mais carro pra lá
    let ok = true, perto = 0;
    for (const o of this.cars) { const ax = Math.abs(o.x - x), ay = Math.abs(o.y - y); if (ax < 90 && ay < 90) { ok = false; break; } if (ax < 260 && ay < 260 && ++perto >= 2) { ok = false; break; } }
    if (player && Math.abs(player.x - x) < 120 && Math.abs(player.y - y) < 120) ok = false;
    if (!ok) continue;
    if ((e.T.id === 'dirt' || e.T.id === 'road') && !chance(0.3)) continue; // estradas da roça recebem bem menos
    const car = new AICar(e, dir, s, lane, trafficModelFor(e));
    if (!car.allowed(e)) { car.release(); continue; }
    car.off = 0; car.acc = 0;
    this.cars.push(car);
    return car;
  }
  return null;
};
Traffic.fill = function (cx, cy) {
  for (const c of this.cars) c.release();
  this.cars.length = 0;
  for (const n of World.nodes) n.res = null;
  // ainda não tem nada na tela: pode pôr carro em qualquer lugar perto
  const v = Cam.view && Cam.view.x1 > Cam.view.x0 ? Cam.view : { x0: cx - 700, y0: cy - 400, x1: cx + 700, y1: cy + 400 };
  const w = (v.x1 - v.x0) / 2, h = (v.y1 - v.y0) / 2, vv = { x0: cx - w, y0: cy - h, x1: cx + w, y1: cy + h };
  this.scanEdges(vv);
  const mx = trafficTarget(vv);
  for (let i = 0; i < mx * 3 && this.cars.length < mx; i++) this.spawnRing(vv, true);
  this.timer = 0;
};
Traffic.update = function (dt, now, cx, cy, view) {
  const v = view && view.x1 > view.x0 ? view : Cam.view;
  // na tela (e logo antes de entrar): cálculo completo; fora: 4x menos vezes
  for (const c of this.cars) {
    if (trInView(c, v, 160)) { if (c.acc) { c.update(c.acc + dt, now); c.acc = 0; } else c.update(dt, now); c.off = 0; }
    else { c.acc = (c.acc || 0) + dt; if (c.acc >= TR_SLOW) { c.update(c.acc, now); c.acc = 0; } if (!trInView(c, v, 40)) c.off = (c.off || 0) + dt; }
  }
  // vigia anti-travamento: carro parado tempo demais sem ser por sinal vermelho nem pelo jogador
  for (const c of this.cars) {
    if (c.wait < 13) continue;
    let o = c, light = false, k = 0;
    while (o && k < 10) { if (o === player) { light = true; break; } if (o.atLight) { light = true; break; } o = o.blocker instanceof AICar ? o.blocker : null; k++; }
    if (light) continue;
    if (!trInView(c, v, 60)) { c.release(); c.dead = true; continue; }
    c.ghost = 2; c.animalGhost = 2; c.wait = 0;
  }
  // some: saiu da tela indo embora, ficou fora da tela uns segundos ou saiu da área onde os carros nascem
  const mx0 = (v.x0 + v.x1) / 2, my0 = (v.y0 + v.y1) / 2;
  for (const c of this.cars) {
    if (c.dead) continue;
    const fora = !trInView(c, v, 40), indoEmbora = fora && (c.x - mx0) * Math.cos(c.a) + (c.y - my0) * Math.sin(c.a) > 0;
    if (indoEmbora || c.off > TR_GONE || !trInView(c, v, TR_RING + 30)) { c.release(); c.dead = true; }
  }
  if (this.cars.some((c) => c.dead)) this.cars = this.cars.filter((c) => !c.dead);
  this.timer -= dt;
  if (this.timer <= 0) {
    this.timer = 0.25;
    this.scanEdges(v);
    const mx = trafficTarget(v);
    // poucos na tela de cada vez: com a tela já movimentada, não manda mais
    let vis = 0; for (const c of this.cars) if (trInView(c, v, 0)) vis++;
    const visMax = Settings.quality === 'baixa' ? 3 : Settings.quality === 'alta' ? 5 : 4;
    let n = 0;
    while (this.cars.length < mx && vis < visMax && n++ < 2) this.spawnRing(v, false);
    // menos carros fora do pico: tira um por vez, dos que estão fora da tela
    if (this.cars.length > mx) {
      let far = -1, fd = 0;
      this.cars.forEach((c, i) => { if (trInView(c, v, 80)) return; const d = Math.hypot(c.x - cx, c.y - cy); if (d > fd) { fd = d; far = i; } });
      if (far >= 0) { this.cars[far].release(); this.cars.splice(far, 1); }
    }
  }
};

/* ============================ ANIMAIS ============================ */
const Animals = { list: [], soundT: 3 };
const ANIMAL = {
  cow: { r: 11, walk: 12, flee: 55, scare: 110 },
  horse: { r: 10, walk: 22, flee: 95, scare: 130 },
  chicken: { r: 3, walk: 16, flee: 70, scare: 90 },
  dog: { r: 6, walk: 38, flee: 120, scare: 120 },
  capybara: { r: 7, walk: 9, flee: 40, scare: 70 },
  owl: { r: 3, walk: 0, flee: 0, scare: 0 },
  person: { r: 4, walk: 20, flee: 85, scare: 95 },
};
class Animal {
  constructor(type, rect) {
    this.type = type; this.rect = rect; this.P = ANIMAL[type]; this.r = this.P.r;
    this.x = rnd(rect[0], rect[2]); this.y = rnd(rect[1], rect[3]);
    if (type === 'owl') {
      const side = rndi(0, 3);
      if (side === 0) this.y = rect[1]; else if (side === 1) this.y = rect[3]; else if (side === 2) this.x = rect[0]; else this.x = rect[2];
    }
    this.a = rnd(TAU); this.state = 'idle'; this.t = rnd(0, 3); this.tx = this.x; this.ty = this.y;
    this.phase = rnd(TAU); this.seed = rnd(); this.v = 0; this.onRoad = false; this.blinkT = rnd(2, 6);
    if (type === 'person') {
      this.col = chance(0.15) ? '#f7d000' : pick(['#e63946', '#3a86ff', '#2a9d8f', '#f1f1f1', '#22223b', '#ff7f11', '#8338ec', '#2bb24c', '#b5838d', '#14213d', '#d62828']);
      this.skin = pick(['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5a3a22', '#ffdbac']);
      this.hair = pick(['#1a1410', '#2a1a10', '#4a2e1a', '#8a6a3a', '#d8c08a', '#1a1410']);
      this.pants = pick(['#2b3a55', '#1d1d1f', '#5a4a3a', '#3a5a7a']);
    }
    this.col = this.col || (type === 'cow' ? pick(['#ece7dc', '#ece7dc', '#8a5a3a', '#2a2420']) : type === 'horse' ? pick(['#6a4026', '#3a2618', '#d8cfc0', '#8a5a34']) : type === 'chicken' ? pick(['#f2efe6', '#b56a2a', '#3a2a1e']) : type === 'dog' ? pick(['#c98a3a', '#c98a3a', '#2a2420', '#e8e0d0', '#7a5a3a']) : '#7a5a3c');
  }
  scare(px, py, hard) {
    if (this.type === 'owl') return;
    if (this.state !== 'flee' && this.type === 'dog' && Game.state === 'playing') AudioSys.bark(player ? Math.hypot(this.x - player.x, this.y - player.y) : 400);
    this.state = 'flee'; this.t = hard ? 2.2 : 1.6;
    const a = Math.atan2(this.y - py, this.x - px) + rnd(-0.5, 0.5);
    this.tx = clamp(this.x + Math.cos(a) * 160, this.rect[0], this.rect[2]);
    this.ty = clamp(this.y + Math.sin(a) * 160, this.rect[1], this.rect[3]);
  }
  update(dt) {
    this.phase += dt * (this.state === 'idle' ? 2 : 8 + this.v * 0.1);
    if (this.type === 'owl') { this.blinkT -= dt; if (this.blinkT < -0.15) this.blinkT = rnd(2, 6); return; }
    if (player && Game.state === 'playing') {
      const d = Math.hypot(player.x - this.x, player.y - this.y);
      const sp = player.speed;
      if (d < this.P.scare && sp > 50 && this.state !== 'flee') this.scare(player.x, player.y, false);
      if (d < 260 && AudioSys.hornOn && this.state !== 'flee') this.scare(player.x, player.y, false);
    }
    this.t -= dt;
    if (this.state === 'idle' || this.state === 'graze') {
      this.v = 0;
      if (this.t <= 0) {
        if (chance(0.55)) { this.state = 'walk'; this.tx = rnd(this.rect[0], this.rect[2]); this.ty = rnd(this.rect[1], this.rect[3]); this.t = 8; }
        else { this.state = (this.type === 'cow' || this.type === 'horse' || this.type === 'chicken' || this.type === 'capybara') && chance(0.6) ? 'graze' : 'idle'; this.t = rnd(2, 6); }
      }
    } else {
      const spd = this.state === 'flee' ? this.P.flee : this.P.walk;
      const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
      if (d < 4 || this.t <= 0) { this.state = 'idle'; this.t = rnd(1, 4); this.v = 0; }
      else {
        const ta = Math.atan2(dy, dx);
        this.a += clamp(angDiff(this.a, ta), -4 * dt, 4 * dt);
        this.v = spd;
        this.x += Math.cos(this.a) * spd * dt; this.y += Math.sin(this.a) * spd * dt;
        this.x = clamp(this.x, this.rect[0], this.rect[2]); this.y = clamp(this.y, this.rect[1], this.rect[3]);
      }
    }
    const g = groundAt(this.x, this.y);
    this.onRoad = g === SF.ROAD || g === SF.DIRT || g === SF.BRIDGE;
  }
}
Animals.build = function () {
  RNG = mulberry32(777);
  this.list.length = 0;
  for (const d of World.animalsDef) for (let i = 0; i < d.n; i++) { const a = new Animal(d.type, d.rect); if (d.look) Object.assign(a, d.look); this.list.push(a); }
};
// só mexe quem está na tela ou bem perto dela (o resto fica parado, ninguém vê)
function nearView(x, y, m) { const v = Cam.view; return v && v.x1 > v.x0 ? x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m : Math.abs(x - Cam.x) < 1200 && Math.abs(y - Cam.y) < 900; }
Animals.update = function (dt, cx, cy) {
  for (const a of this.list) if (nearView(a.x, a.y, 220)) a.update(dt);
  for (const s of World.sparkers) if (Game.time < s.until && nearView(s.x, s.y, 60)) for (let i = 0; i < 2; i++) Particles.emit('spark', s.x, s.y, rnd(-160, 160), rnd(-160, 160), rnd(0.2, 0.5), 2);
  for (const g of World.geysers) if (Game.time < g.until && nearView(g.x, g.y, 60) && chance(0.7)) Particles.emit('water', g.x + rnd(-2, 2), g.y + rnd(-2, 2), rnd(-70, 70), rnd(-70, 70), rnd(0.5, 1.1), 2);
  for (const g of World.grills) if (g.down === undefined && nearView(g.x, g.y, 80) && chance(dt * 6)) Particles.emit('smoke', g.x + rnd(-4, 4), g.y + rnd(-3, 3), rnd(-6, 6), rnd(-14, -4), rnd(1.2, 2.2), 4);
  this.soundT -= dt;
  if (this.soundT <= 0 && Game.state === 'playing') {
    this.soundT = rnd(5, 11);
    const rk = regionKeyAt(cx, cy), R = REGIONS[rk];
    const r = rnd();
    if (R.rural > 0.6) { if (r < 0.3) AudioSys.owl(); else if (r < 0.55) AudioSys.moo(); else if (r < 0.75) AudioSys.bark(900); }
    else if (rk === 'rio') { if (r < 0.6) AudioSys.frog(); else AudioSys.owl(); }
    else { if (r < 0.35) AudioSys.bark(rnd(500, 1100)); else if (r < 0.5) AudioSys.siren(); else if (r < 0.7) AudioSys.aiHorn(rnd(500, 850), pick(Object.keys(HORNS)), rnd(-0.8, 0.8)); }
  }
};
/* ---------- pelada nos campos de várzea ---------- */
const Peladas = { list: [] };
Peladas.build = function () {
  this.list.length = 0;
  const kits = [['#f7d000', '#f1f1f1'], ['#e63946', '#14213d'], ['#2bb24c', '#f1f1f1'], ['#3a86ff', '#ff7f11']];
  World.pitches.forEach((P, k) => {
    const kit = kits[k % kits.length], pl = [];
    for (let i = 0; i < 10; i++) {
      const team = i % 2, a = new Animal('person', [P.x0, P.y0, P.x1, P.y1]);
      a.col = kit[team]; a.team = team; a.state = 'idle';
      const row = Math.floor(i / 2);
      a.hx = lerp(P.x0 + 14, P.x1 - 14, ((row * 0.37 + team * 0.21) % 1));
      a.hy = team ? lerp(P.cy, P.y1 - 18, (row % 3) / 2.5 + 0.1) : lerp(P.y0 + 18, P.cy, 1 - ((row % 3) / 2.5 + 0.1));
      if (row === 4) { a.hx = P.cx; a.hy = team ? P.y1 - 10 : P.y0 + 10; a.keeper = true; a.col = team ? '#222' : '#9b5de5'; }
      a.x = a.hx; a.y = a.hy; pl.push(a);
    }
    this.list.push({ P, pl, bx: P.cx, by: P.cy, bvx: 0, bvy: 0, cd: 0, cel: 0, score: [0, 0] });
  });
};
Peladas.update = function (dt, cx, cy) {
  for (const G of this.list) {
    const P = G.P;
    if (!nearView(P.cx, P.cy, 300 + Math.max(P.x1 - P.x0, P.y1 - P.y0) / 2)) continue;
    G.cd -= dt;
    if (G.cel > 0) {
      G.cel -= dt;
      for (const p of G.pl) { p.v = 0; p.dance = p.team === G.lastTeam; p.phase += dt * 2; }
      if (G.cel <= 0) { G.bx = P.cx; G.by = P.cy; G.bvx = G.bvy = 0; for (const p of G.pl) { p.x = p.hx; p.y = p.hy; p.dance = false; } }
      continue;
    }
    // bola
    G.bx += G.bvx * dt; G.by += G.bvy * dt;
    const fr = Math.exp(-1.1 * dt); G.bvx *= fr; G.bvy *= fr;
    if (G.bx < P.x0) { G.bx = P.x0; G.bvx = Math.abs(G.bvx) * 0.6; } else if (G.bx > P.x1) { G.bx = P.x1; G.bvx = -Math.abs(G.bvx) * 0.6; }
    for (const [gy, side] of [[P.gy0, 0], [P.gy1, 1]]) {
      const past = side ? G.by > gy - 6 : G.by < gy + 6;
      if (!past) continue;
      if (Math.abs(G.bx - P.cx) < 20) { G.lastTeam = side ? 0 : 1; G.score[G.lastTeam]++; G.cel = 2.6; if (player && Math.hypot(player.x - P.cx, player.y - P.cy) < 600) AudioSys.tone(660, 0.25, 'triangle', 0.05, 'ambient', 880); }
      else { G.by = side ? gy - 6 : gy + 6; G.bvy = -G.bvy * 0.6; }
    }
    // carro do jogador chuta a bola e espanta a galera
    if (player) {
      const d = Math.hypot(player.x - G.bx, player.y - G.by);
      if (d < 16 && player.speed > 10) { const a = Math.atan2(G.by - player.y, G.bx - player.x); const s = 120 + player.speed * 0.8; G.bvx = Math.cos(a) * s; G.bvy = Math.sin(a) * s; }
    }
    // jogadores: o mais perto de cada time vai na bola, o resto se posiciona
    const near = [null, null], nd = [1e9, 1e9];
    for (const p of G.pl) { if (p.keeper) continue; const d = Math.hypot(p.x - G.bx, p.y - G.by); if (d < nd[p.team]) { nd[p.team] = d; near[p.team] = p; } }
    for (const p of G.pl) {
      let tx, ty, spd;
      if (p === near[0] || p === near[1]) { tx = G.bx; ty = G.by; spd = 58; }
      else if (p.keeper) { tx = clamp(G.bx, P.cx - 18, P.cx + 18); ty = p.hy; spd = 40; }
      else { tx = p.hx + (G.bx - P.cx) * 0.45; ty = p.hy + (G.by - P.cy) * 0.35; spd = 30; }
      if (player) { const dx = p.x - player.x, dy = p.y - player.y, d = Math.hypot(dx, dy); if (d < 70) { tx = p.x + dx / d * 60; ty = p.y + dy / d * 60; spd = 85; } }
      tx = clamp(tx, P.x0, P.x1); ty = clamp(ty, P.y0 - 6, P.y1 + 6);
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      if (d > 3) { const ta = Math.atan2(dy, dx); p.a += clamp(angDiff(p.a, ta), -7 * dt, 7 * dt); const s = Math.min(spd, d * 3); p.x += Math.cos(ta) * s * dt; p.y += Math.sin(ta) * s * dt; p.v = s; p.phase += dt * (8 + s * 0.1); }
      else { p.v = 0; p.a += clamp(angDiff(p.a, Math.atan2(G.by - p.y, G.bx - p.x)), -5 * dt, 5 * dt); }
      // chute / passe
      if (G.cd <= 0 && Math.hypot(p.x - G.bx, p.y - G.by) < 7) {
        const goalY = p.team ? P.gy0 : P.gy1;
        let tX = P.cx + rnd(-26, 26), tY = goalY, pw = rnd(150, 230);
        const dGoal = Math.abs(goalY - G.by);
        if (dGoal > 160 && chance(0.6)) { const mates = G.pl.filter((m) => m.team === p.team && m !== p && !m.keeper); const m = pick(mates); tX = m.x; tY = m.y + (p.team ? -20 : 20); pw = rnd(110, 160); }
        if (p.keeper) { tX = P.cx + rnd(-80, 80); tY = P.cy; pw = 230; }
        const a = Math.atan2(tY - G.by, tX - G.bx) + rnd(-0.18, 0.18);
        G.bvx = Math.cos(a) * pw; G.bvy = Math.sin(a) * pw; G.cd = 0.4;
      }
    }
  }
};
Peladas.draw = function (ctx, view) {
  for (const G of this.list) {
    if (!inView(view, G.P.cx, G.P.cy, 400)) continue;
    for (const p of G.pl) drawAnimal(ctx, p);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(G.bx + 1.2, G.by + 1.5, 2.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f8f8f4'; ctx.beginPath(); ctx.arc(G.bx, G.by, 2.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#222'; ctx.fillRect(G.bx - 0.7, G.by - 0.7, 1.4, 1.4);
  }
};
function drawAnimal(ctx, an) {
  const aas = Math.atan2(Math.sin(an.a) * SQ, Math.cos(an.a));
  ctx.save(); ctx.translate(an.x, an.y); ctx.scale(1, 1 / SQ); ctx.rotate(aas);
  const walk = an.v > 0 ? Math.sin(an.phase) : 0;
  const graze = an.state === 'graze';
  switch (an.type) {
    case 'person': {
      const dancing = (an.dance && an.v === 0) || an.danceUntil > Game.time;
      const sw = an.v > 0 ? Math.sin(an.phase) * 2.4 : dancing ? Math.sin(Game.time * 9 + an.seed * 20) * 2.6 : 0;
      if (dancing) ctx.rotate(Math.sin(Game.time * 4.5 + an.seed * 9) * 0.35);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(1.5, 2, 4, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = an.pants; ctx.fillRect(-1 + sw * 0.5, -2.6, 2.6, 1.8); ctx.fillRect(-1 - sw * 0.5, 0.8, 2.6, 1.8);
      ctx.fillStyle = an.skin; ctx.beginPath(); ctx.arc(sw, -4.6, 1.2, 0, TAU); ctx.arc(-sw, 4.6, 1.2, 0, TAU); ctx.fill();
      // na chuva: uns de guarda-chuva, outros de capa de chuva com capuz (os boleiros da pelada não ligam)
      const rk = ((an.seed || 0.37) * 7.31) % 1, wetP = Weather.rain > 0.12 && an.team === undefined && !an.seuze;
      const umb = wetP && rk < 0.55, coat = wetP && rk >= 0.55 && rk < 0.88;
      const coatCol = coat ? ['#f4d03f', '#9ccfe0', '#d64541', '#2c3e70', '#3e9b5a'][Math.floor(rk * 97) % 5] : null;
      ctx.fillStyle = coat ? coatCol : an.col; ctx.beginPath(); ctx.ellipse(0, 0, coat ? 3 : 2.6, coat ? 4.9 : 4.4, 0, 0, TAU); ctx.fill();
      if (an.col === '#f7d000' && !coat) { ctx.fillStyle = '#1f9a48'; ctx.fillRect(-2.2, -0.6, 4.4, 1.2); }
      ctx.fillStyle = an.skin; ctx.beginPath(); ctx.arc(0.5, 0, 2.2, 0, TAU); ctx.fill();
      if (coat) { ctx.fillStyle = shade(coatCol, -0.12); ctx.beginPath(); ctx.arc(-0.3, 0, 2.6, Math.PI * 0.35, Math.PI * 1.65); ctx.fill(); }
      else { ctx.fillStyle = an.hair; ctx.beginPath(); ctx.arc(0, 0, 2.3, Math.PI * 0.5, Math.PI * 1.5); ctx.fill(); }
      if (umb) {
        const uc = ['#1a1a1e', '#c0392b', '#2e86de', '#f1c40f', '#8e44ad', '#16a085', '#ff6fa5', '#e67e22'][Math.floor(rk * 131) % 8];
        ctx.save(); ctx.translate(1.2, 0.4); ctx.rotate(Game.time * 0.3 * (an.v > 0 ? 1 : 0.2) + rk * 6);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(1.2, 1.2, 7.2, 0, TAU); ctx.fill();
        ctx.fillStyle = uc; ctx.beginPath(); for (let i = 0; i <= 8; i++) { const a = i / 8 * TAU, r = i % 2 ? 6.4 : 7.2; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0); } ctx.closePath(); ctx.fill();
        ctx.strokeStyle = shade(uc, -0.35); ctx.lineWidth = 0.5; ctx.beginPath(); for (let i = 0; i < 8; i += 2) { const a = i / 8 * TAU; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 7.2, Math.sin(a) * 7.2); } ctx.stroke();
        ctx.fillStyle = shade(uc, 0.4); ctx.beginPath(); ctx.arc(0, 0, 0.9, 0, TAU); ctx.fill();
        ctx.restore();
      }
      if (an.seuze) { ctx.fillStyle = '#c8302a'; ctx.beginPath(); ctx.arc(0.2, 0, 2.4, -Math.PI * 0.5, Math.PI * 0.5); ctx.fill(); ctx.fillStyle = '#f0f0ea'; ctx.fillRect(2.1, -1, 0.9, 2); }
      break;
    }
    case 'cow': case 'horse': {
      const horse = an.type === 'horse';
      const L = horse ? 13 : 13, W = horse ? 5.5 : 7.5;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(3, 4, L + 2, W + 1.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a2420';
      for (const [lx, ly, ph] of [[8, -W + 0.5, 0], [8, W - 0.5, Math.PI], [-8, -W + 0.5, Math.PI], [-8, W - 0.5, 0]]) ctx.fillRect(lx + Math.sin(an.phase + ph) * (an.v ? 2 : 0) - 1.5, ly - 1.2, 3, 2.4);
      ctx.fillStyle = an.col; ctx.beginPath(); ctx.ellipse(0, 0, L, W, 0, 0, TAU); ctx.fill();
      if (!horse && an.col === '#ece7dc') {
        ctx.fillStyle = '#26211e';
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-8 + hash2(i, an.seed * 100 | 0) * 15, (hash2(i + 9, an.seed * 100 | 0) - 0.5) * W * 1.3, 2.5 + hash2(i, 3) * 2, 2 + hash2(i, 4) * 1.5, 0, 0, TAU); ctx.fill(); }
      }
      if (horse) { ctx.fillStyle = shade(an.col, -0.45); ctx.fillRect(2, -1, 11, 2); }
      const hx = graze ? L + 3 + Math.sin(an.phase * 0.5) * 1 : L + 2;
      ctx.fillStyle = horse ? shade(an.col, -0.1) : (an.col === '#ece7dc' ? '#e2dccf' : an.col);
      ctx.beginPath(); ctx.ellipse(hx, 0, horse ? 6 : 5, horse ? 2.6 : 3.8, 0, 0, TAU); ctx.fill();
      if (!horse) { ctx.fillStyle = '#d8b8a8'; ctx.beginPath(); ctx.ellipse(hx + 3.5, 0, 2, 2.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ddd2b8'; ctx.fillRect(hx - 2, -5.5, 1.5, 2.5); ctx.fillRect(hx - 2, 3, 1.5, 2.5); }
      ctx.strokeStyle = horse ? shade(an.col, -0.5) : '#3a3028'; ctx.lineWidth = horse ? 2 : 1.2;
      ctx.beginPath(); ctx.moveTo(-L, 0); ctx.quadraticCurveTo(-L - 4, Math.sin(an.phase * 0.7) * 3, -L - 7, Math.sin(an.phase * 0.7 + 1) * 4); ctx.stroke();
      break;
    }
    case 'chicken': {
      const peck = graze ? Math.max(0, Math.sin(an.phase * 2)) * 2 : 0;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(1, 1.5, 3.5, 0, TAU); ctx.fill();
      ctx.fillStyle = an.col; ctx.beginPath(); ctx.ellipse(0, 0, 3.6, 2.6, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(3 + peck, 0, 1.7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d82a1a'; ctx.fillRect(2.5 + peck, -0.6, 1.4, 1.2);
      ctx.fillStyle = '#e8a020'; ctx.fillRect(4.5 + peck, -0.5, 1.2, 1);
      break;
    }
    case 'dog': {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(2, 2.5, 8, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(an.col, -0.3);
      for (const [lx, ly, ph] of [[4, -3, 0], [4, 3, Math.PI], [-4, -3, Math.PI], [-4, 3, 0]]) ctx.fillRect(lx + Math.sin(an.phase + ph) * (an.v ? 1.8 : 0) - 1, ly - 0.9, 2, 1.8);
      ctx.fillStyle = an.col; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 3.2, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(6.5, 0, 2.8, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(an.col, -0.35); ctx.beginPath(); ctx.ellipse(5.5, -2.6, 1.6, 1, 0.5, 0, TAU); ctx.ellipse(5.5, 2.6, 1.6, 1, -0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1412'; ctx.fillRect(8.8, -0.6, 1.2, 1.2);
      ctx.strokeStyle = an.col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-10, Math.sin(an.phase * (an.state === 'flee' ? 1 : 2.5)) * 3); ctx.stroke();
      break;
    }
    case 'capybara': {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(2, 2.5, 9.5, 5.5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = an.col; ctx.beginPath(); ctx.ellipse(0, 0, 8.5, 5.2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(an.col, 0.08); ctx.beginPath(); ctx.ellipse(-1, -1, 5, 2.5, 0, 0, TAU); ctx.fill();
      const hx = graze ? 9.5 : 8.5;
      ctx.fillStyle = shade(an.col, -0.12); ctx.beginPath(); rrect(ctx, hx - 3, -3, 6.5, 6, 2.5); ctx.fill();
      ctx.fillStyle = '#2a1e14'; ctx.fillRect(hx + 2.5, -1.5, 1, 1); ctx.fillRect(hx + 2.5, 0.5, 1, 1);
      ctx.fillRect(hx - 2.5, -3.6, 1.6, 1.2); ctx.fillRect(hx - 2.5, 2.4, 1.6, 1.2);
      break;
    }
    case 'owl':
      ctx.rotate(-aas);
      ctx.fillStyle = '#5a4430'; ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c9b08a'; ctx.beginPath(); ctx.arc(0, -0.5, 2.4, 0, TAU); ctx.fill();
      break;
  }
  ctx.restore();
}

/* ============================ PARTÍCULAS E MARCAS ============================ */
const Particles = {
  list: [],
  emit(type, x, y, vx, vy, life, size) {
    if (Settings.quality === 'baixa') return; // gráfico baixo: sem partículas
    if (type === 'dust' && Weather.wet > 0.3) { type = 'mud'; size = Math.min(size, 3.5); life *= 0.55; } // na chuva não levanta poeira: espirra barro
    const max = Settings.quality === 'alta' ? 560 : 320;
    if (this.list.length >= max) this.list.shift();
    this.list.push({ type, x, y, vx, vy, life, max: life, size });
  },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const k = p.type === 'spark' ? 2.5 : p.type === 'leaf' ? 1.4 : p.type === 'hubcap' ? 0.9 : p.type === 'water' ? 1.2 : 1.8;
      if (p.type === 'hubcap') p.rot = (p.rot || 0) + dt * 12;
      p.vx *= Math.exp(-k * dt); p.vy *= Math.exp(-k * dt);
      if (p.type !== 'spark') p.size += dt * (p.type === 'dust' ? 14 : p.type === 'mud' ? 1.5 : p.type === 'water' ? 6 : 10);
    }
  },
  draw(ctx) {
    for (const p of this.list) {
      const t = p.life / p.max;
      if (p.type === 'spark' || p.type === 'flame') continue;
      if (p.type === 'hubcap') { ctx.globalAlpha = Math.min(1, t * 3); ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(p.x, p.y, 3.4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6a6d72'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p.x + Math.cos(p.rot) * 3, p.y + Math.sin(p.rot) * 3); ctx.lineTo(p.x - Math.cos(p.rot) * 3, p.y - Math.sin(p.rot) * 3); ctx.stroke(); continue; }
      if (p.type === 'leaf') { ctx.globalAlpha = t; ctx.fillStyle = '#3f7a2e'; ctx.fillRect(p.x, p.y, 2.4, 1.6); continue; }
      if (p.type === 'steam' || p.type === 'exhaust') { ctx.globalAlpha = t * (p.type === 'steam' ? 0.35 : 0.18); ctx.fillStyle = p.type === 'steam' ? '#f0f4f8' : '#9a9a9a'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); continue; }
      ctx.globalAlpha = t * (p.type === 'dust' ? 0.35 : p.type === 'mud' ? 0.75 : p.type === 'water' ? 0.45 : 0.28);
      ctx.fillStyle = p.type === 'dust' ? '#9a7e5a' : p.type === 'mud' ? '#4e3220' : p.type === 'water' ? '#b9d6e6' : '#c8c8c8';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
  drawEmissive(ctx) {
    ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const p of this.list) {
      if (p.type !== 'spark') continue;
      ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
    }
    ctx.stroke();
    for (const p of this.list) if (p.type === 'flame') { ctx.globalAlpha = p.life / p.max; ctx.drawImage(glowSprite('#ff8a2a'), p.x - 9, p.y - 9, 18, 18); }
    ctx.globalAlpha = 1;
  },
};
const Skids = {
  N: 900, buf: new Float32Array(900 * 4), t: new Float32Array(900), dirt: new Uint8Array(900), i: 0, count: 0,
  add(ax, ay, bx, by, cx, cy, dx, dy, surf) {
    for (const [x0, y0, x1, y1] of [[ax, ay, bx, by], [cx, cy, dx, dy]]) {
      const j = this.i;
      this.buf[j * 4] = x0; this.buf[j * 4 + 1] = y0; this.buf[j * 4 + 2] = x1; this.buf[j * 4 + 3] = y1;
      this.t[j] = Game.time; this.dirt[j] = surf === 'mud' ? 2 : surf === SF.ROAD || surf === SF.PAVED || surf === SF.BRIDGE ? 0 : 1;
      this.i = (j + 1) % this.N; this.count = Math.min(this.N, this.count + 1);
    }
  },
  draw(ctx, view) {
    if (!this.count) return;
    ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    for (let bucket = 0; bucket < 3; bucket++) {
      const lo = bucket * 15, hi = lo + 15;
      ctx.strokeStyle = `rgba(14,14,16,${0.42 - bucket * 0.12})`;
      ctx.beginPath();
      let any = false;
      for (let j = 0; j < this.count; j++) {
        const age = Game.time - this.t[j];
        if (age < lo || age >= hi || this.dirt[j] === 2) continue;
        const x = this.buf[j * 4], y = this.buf[j * 4 + 1];
        if (x < view.x0 - 20 || x > view.x1 + 20 || y < view.y0 - 20 || y > view.y1 + 20) continue;
        ctx.moveTo(x, y); ctx.lineTo(this.buf[j * 4 + 2], this.buf[j * 4 + 3]); any = true;
      }
      if (any) ctx.stroke();
    }
    // rastro de barro dos pneus no asfalto (some devagar)
    ctx.lineWidth = 4.2;
    for (let bucket = 0; bucket < 3; bucket++) {
      const lo = bucket * 20, hi = lo + 20;
      ctx.strokeStyle = `rgba(78,50,30,${0.75 - bucket * 0.2})`;
      ctx.beginPath(); let any = false;
      for (let j = 0; j < this.count; j++) {
        if (this.dirt[j] !== 2) continue;
        const age = Game.time - this.t[j];
        if (age < lo || age >= hi) continue;
        const x = this.buf[j * 4], y = this.buf[j * 4 + 1];
        if (x < view.x0 - 20 || x > view.x1 + 20 || y < view.y0 - 20 || y > view.y1 + 20) continue;
        ctx.moveTo(x, y); ctx.lineTo(this.buf[j * 4 + 2], this.buf[j * 4 + 3]); any = true;
      }
      if (any) ctx.stroke();
    }
    ctx.lineCap = 'butt';
  },
};

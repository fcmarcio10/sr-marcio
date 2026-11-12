
/* ============================ VIDA DO CARRO: PNEUS, ÓLEO E BATERIA ============================
   Cada carro da garagem tem os seus. Pneus gastam rodando (e muito mais derrapando), o óleo vence
   com a quilometragem e a bateria só descarrega com o farol ligado e o carro parado por uns minutos.
   Andando, o alternador recarrega. Farol liga/desliga no H. */
const LIFE_IDLE_GRACE = 150;   // segundos parado com farol aceso antes de começar a gastar bateria
const LIFE_BAT_DRAIN = 240;    // depois disso, segundos para ir de 100% a 0% (farol alto gasta o dobro)
const LIFE_TIRE_KM = 60, LIFE_OIL_KM = 45;
const CarLife = { idleT: 0, stalled: false, warned: {}, smokeT: 0 };
function carLife(id) {
  const cfg = carCfg(id || (player ? player.car.id : Profile.current));
  if (!cfg.life) cfg.life = { tires: 100, oil: 100, bat: 100 };
  return cfg.life;
}
function lifePrice(kind, carId) {
  const c = carById(carId || player.car.id), big = VMODELS[c.model].kind === 'truck';
  if (kind === 'tires') return Math.round((180 + c.price * 0.02) * (big ? 1.6 : 1) / 10) * 10;
  if (kind === 'oil') return big ? 160 : 90;
  return 50; // carga da bateria
}
CarLife.lightsOn = function () { return player && !player.lightsOff && carLife().bat > 0; };
// fatores que o carro usa na física
CarLife.mod = function () {
  const L = carLife();
  let max = 1, acc = 1;
  if (L.oil < 20) { acc *= 0.85; }
  if (L.oil <= 0) { acc *= 0.55; max *= 0.62; }
  if (L.tires <= 0) { max *= 0.6; }
  return { max, acc };
};
CarLife.gripK = function () {
  const L = carLife(), w = 1 - L.tires / 100;
  return L.tires <= 0 ? 0.55 : 1 - 0.28 * Math.pow(w, 1.6);
};
// farol mais fraco com bateria baixa
CarLife.lampK = function () {
  if (!this.lightsOn()) return 0;
  const b = carLife().bat;
  return b >= 30 ? 1 : 0.35 + 0.65 * b / 30;
};
function lifeWarn(key, title, text, kind) {
  if (CarLife.warned[key]) return;
  CarLife.warned[key] = true;
  toast(title, text, kind || 'bad');
  AudioSys.tone(660, 0.12, 'square', 0.05, 'ui'); AudioSys.tone(520, 0.16, 'square', 0.05, 'ui', null, 0.14);
}
CarLife.update = function (dt) {
  if (!player) return;
  const L = carLife(), p = player, sp = p.speed;
  if (CHEATS_ENABLED && Cheats.god) { L.tires = L.oil = L.bat = 100; this.stalled = false; return; }
  const km = sp * dt * 0.09 / 1000;
  // pneus: gastam rodando, muito mais de lado ou cantando pneu na arrancada
  const slide = (p.drift || 0) > 0.3 ? 1 + p.drift * 4 : 1, burn = p.launchT > 0 ? 3 : 1;
  const offr = p.surface === SF.DIRT || p.surface === SF.EARTH || p.surface === SF.GRASS ? 1.4 : 1;
  const tBefore = L.tires;
  L.tires = Math.max(0, L.tires - km * (100 / LIFE_TIRE_KM) * slide * burn * offr);
  // óleo: vence com a quilometragem, mais rápido no talo
  const hot = sp > p.st.max * 0.85 ? 1.6 : 1;
  L.oil = Math.max(0, L.oil - km * (100 / LIFE_OIL_KM) * hot);
  // bateria: farol aceso com o carro parado
  const lit = (!p.lightsOff && L.bat > 0) || Som.on;
  if (sp < 5 && lit) {
    this.idleT += dt;
    if (this.idleT > LIFE_IDLE_GRACE) {
      if (!this.warned.idle) lifeWarn('idle', 'Farol ligado com o carro parado', 'Isso descarrega a bateria. Aperte H para desligar o farol.', 'info');
      L.bat = Math.max(0, L.bat - dt * 100 / LIFE_BAT_DRAIN * (p.highBeam ? 2 : 1));
    }
  } else {
    if (sp > 20) this.idleT = 0; else if (!lit) this.idleT = Math.max(0, this.idleT - dt * 2);
    if (sp > 30 && !this.stalled) L.bat = Math.min(100, L.bat + dt * 0.55); // alternador
  }
  // bateria arriada: com o carro parado ou quase, o motor morre e não pega mais
  if (L.bat <= 0 && sp < 25 && !this.stalled) {
    this.stalled = true;
    AudioSys.tone(140, 0.4, 'sawtooth', 0.06, 'engine', 60);
    toast('A bateria arriou!', 'O motor morreu e o carro só se arrasta. Chame o Seu Zé no zap (Q > Mensagens) pra fazer uma chupeta.', 'bad');
  }
  if (this.stalled && L.bat > 5) this.stalled = false;
  // avisos
  if (L.tires < 25) lifeWarn('t25', 'Pneus carecas', 'O carro escorrega mais. Troque na borracharia ou na oficina.');
  if (L.tires < 10) lifeWarn('t10', 'Pneus no arame!', 'Mais um pouco e estoura. Borracharia ou oficina, urgente.');
  if (L.tires <= 0 && tBefore > 0) {
    AudioSys.noise(0.25, 900, 0.6, 0.35, 'engine'); Cam.shake = Math.max(Cam.shake, 6);
    toast('Pneu estourou!', 'Andando no aro: pouca aderência e devagar. Chame o Seu Zé ou vá até a borracharia.', 'bad');
  }
  if (L.oil < 25) lifeWarn('o25', 'Luz do óleo acendeu', 'Hora de trocar o óleo: oficina ou posto.', 'info');
  if (L.oil < 8) lifeWarn('o8', 'Óleo no fim!', 'O motor vai esquentar e perder força. Troque logo.');
  if (L.bat < 30 && !this.warned.b30) lifeWarn('b30', 'Bateria fraca', 'Os faróis ficaram mais fracos. Rode um pouco pra carregar ou desligue o farol (H) quando parar.');
  // motor sem óleo: fumaça e estrago
  if (L.oil <= 0 && sp > 20) {
    Profile.damage = Math.min(100, Profile.damage + dt * 0.35);
    this.smokeT -= dt;
    if (this.smokeT <= 0) { this.smokeT = 0.12; const c = Math.cos(p.a), s = Math.sin(p.a); Particles.emit('smoke', p.x + c * p.m.L * 0.4, p.y + s * p.m.L * 0.4, rnd(-10, 10), rnd(-25, -10), rnd(0.8, 1.6), 7); }
    lifeWarn('o0', 'Motor esquentando!', 'Sem óleo o motor está fundindo. Troque o óleo agora!');
  }
  // libera os avisos quando o item foi trocado
  if (L.tires > 40) { this.warned.t25 = this.warned.t10 = false; }
  if (L.oil > 40) { this.warned.o25 = this.warned.o8 = this.warned.o0 = false; }
  if (L.bat > 45) this.warned.b30 = false;
  if (this.idleT === 0) this.warned.idle = false;
};
CarLife.reset = function () { this.idleT = 0; this.stalled = false; this.warned = {}; };
// serviços (oficina, borracharia, posto e Seu Zé)
function lifeService(kind, priceMul, fiado) {
  const L = carLife(), price = Math.ceil(lifePrice(kind) * (priceMul || 1));
  if (Profile.money < price) {
    if (!fiado || fiadoOpen()) { AudioSys.error(); toast('Sem dinheiro', 'Custa R$ ' + fmtMoney(price) + '.', 'bad'); return false; }
    zeCharge(price, true); toast('Seu Zé', '"Tá liso? Anotei no fiado. Amanhã eu pego sozinho, se tiver."', 'info');
  } else { Profile.money -= price; UI.moneyDelta(-price); }
  if (kind === 'tires') { L.tires = 100; AudioSys.wrench(); toast('Pneus novos', 'Agarrando no asfalto de novo. R$ ' + fmtMoney(price), 'good'); }
  else if (kind === 'oil') { L.oil = 100; AudioSys.pump(); toast('Óleo trocado', 'Motor macio que nem manteiga. R$ ' + fmtMoney(price), 'good'); }
  else { L.bat = 100; CarLife.stalled = false; AudioSys.wrench(); toast('Bateria carregada', 'Farol forte de novo. R$ ' + fmtMoney(price), 'good'); }
  saveGame(); return true;
}
function lifeButtons(B, s, kinds, fiado) {
  const L = carLife(), pct = (v) => Math.round(v) + '%';
  const fz = fiado && !fiadoOpen(), lbl = (k) => Profile.money < lifePrice(k) && fz ? ' (fiado)' : '', no = (k) => Profile.money < lifePrice(k) && !fz;
  if (kinds.includes('tires')) B(L.tires > 97 ? 'Pneus novos (' + pct(L.tires) + ')' : `Trocar os 4 pneus (${pct(L.tires)}) — R$ ${fmtMoney(lifePrice('tires'))}${lbl('tires')}`, () => { lifeService('tires', 1, fiado); openShopDialog(s); }, L.tires > 97 || no('tires'));
  if (kinds.includes('oil')) B(L.oil > 97 ? 'Óleo em dia (' + pct(L.oil) + ')' : `Trocar o óleo (${pct(L.oil)}) — R$ ${fmtMoney(lifePrice('oil'))}${lbl('oil')}`, () => { lifeService('oil', 1, fiado); openShopDialog(s); }, L.oil > 97 || no('oil'));
  if (kinds.includes('bat')) B(L.bat > 97 ? 'Bateria carregada (' + pct(L.bat) + ')' : `Carregar a bateria (${pct(L.bat)}) — R$ ${fmtMoney(lifePrice('bat'))}${lbl('bat')}`, () => { lifeService('bat', 1, fiado); openShopDialog(s); }, L.bat > 97 || no('bat'));
}
function lifeZeFala() {
  const L = carLife(), out = [];
  if (L.oil < 30) out.push('esse óleo tá parecendo café de rodoviária');
  if (L.tires < 30) out.push('os pneus tão mais lisos que sabonete');
  if (L.bat < 30) out.push('a bateria tá pedindo arrego');
  return out.length ? ' E olha: ' + out.join(', ') + '.' : '';
}

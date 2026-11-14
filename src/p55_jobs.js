/* ============================ CELULAR, PROFISSÕES, APP DE MOTORISTA E RACHA ============================ */
const PASSAGEIROS = ['Dona Cida', 'Seu Jorge', 'Thaís', 'Juninho', 'Pastor Elias', 'Dona Penha', 'Marcão', 'Bia da Farmácia', 'Tio Zezinho', 'Kelly', 'Rafa do Bloco', 'Vó Lurdes', 'Diego Entregador', 'Professora Solange'];
const FALAS_EMBARQUE = ['"Boa noite, moço! Pode ir pela avenida que é mais rápido."', '"Liga o ar aí, por favor?"', '"Tô atrasada pro plantão, vai com fé!"', '"Nossa, esse carro é raiz, hein?"', '"Me deixa na porta, que tá escuro."', '"Pode botar um pagodinho no rádio?"'];
const FALAS_BATIDA = ['"Ô motorista, devagar!"', '"Jesus amado, quase morri!"', '"Vou dar uma estrela pra você, viu?"', '"Eita! Cuidado aí!"'];
const JOB_TYPES = {
  pickup: { name: 'Frete de picape', items: ['Sacos de cimento', 'Mudança pequena', 'Tijolos baianos', 'Geladeira usada', 'Móveis da vó'], mult: 1.35 },
  bau: { name: 'Carga de baú', items: ['Carga de bebidas', 'Caixas de mercadoria', 'Eletrodomésticos', 'Engradados de refrigerante'], mult: 2.2 },
  gas: { name: 'Entrega de gás', items: ['Botijões de gás'], mult: 1.6 },
  tanker: { name: 'Abastecer posto', items: ['Gasolina comum', 'Etanol', 'Diesel S10'], mult: 2.8, fragile: true },
  cacamba: { name: 'Retirar entulho', items: ['Entulho de obra'], mult: 2.0 },
  guincho: { name: 'Reboque', items: ['Carro quebrado de cliente'], mult: 1.9 },
};
// rep: respostas possíveis [[texto, resposta do contato]]; mensagens informativas não têm
// conversas silenciadas: chegam normalmente, mas sem aviso, sem som e sem contar no selo vermelho
function isMuted(from) { return !!(Profile.muted && Profile.muted[from]); }
function unreadCount() { return (Profile.msgs || []).filter((m) => !m.read && !m.me && !isMuted(m.from)).length; }
function addMsg(from, title, body, silent, rep) {
  Profile.msgs = Profile.msgs || [];
  const m = { from, title, body, read: false, t: Math.floor(Profile.time) };
  if (rep) m.rep = rep;
  Profile.msgs.unshift(m);
  if (!silent && !isMuted(from)) { const cfg = phoneCfg(); if (cfg.notif) toast('Nova mensagem: ' + from, (title || body.slice(0, 40)) + ' — aperte Q para abrir o celular.', 'info'); if (cfg.sounds) { AudioSys.tone(1568, 0.08, 'sine', 0.08, 'ui'); AudioSys.tone(2093, 0.12, 'sine', 0.08, 'ui', null, 0.1); } }
  return m;
}
// prévia de localização estilo WhatsApp (mapinha desenhado, sem imagem externa)
const WA_LOC_SVG = '<svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMid slice"><rect width="240" height="110" fill="#e6e1d3"/><path d="M0 70 C60 60 90 85 140 72 S210 50 240 58 L240 110 L0 110Z" fill="#b9d6e6"/><g stroke="#fff" stroke-width="7" fill="none"><path d="M-5 38 H245"/><path d="M70 -5 V115"/><path d="M175 -5 V115"/></g><g stroke="#ffd36b" stroke-width="9" fill="none"><path d="M-5 20 L245 92"/></g><g stroke="#fff" stroke-width="3" fill="none"><path d="M120 -5 V40"/><path d="M20 -5 V40"/></g><rect x="88" y="44" width="22" height="14" fill="#cfd8b8"/><rect x="186" y="12" width="30" height="18" fill="#cfd8b8"/><g transform="translate(120 52)"><ellipse cx="0" cy="14" rx="7" ry="2.5" fill="rgba(0,0,0,0.25)"/><path d="M0 14 C-4 6 -12 0 -12 -8 A12 12 0 0 1 12 -8 C12 0 4 6 0 14Z" fill="#e2412f"/><circle cx="0" cy="-8" r="4.5" fill="#7a1a10"/></g></svg>';
function ensurePhoneData() {
  if (!Profile.msgs) {
    Profile.msgs = [];
    addMsg('Seu Zé (Oficina)', 'Bem-vindo a São Gambiarra!',
      'Aqui é o Seu Zé, da oficina. Você chegou em São Gambiarra, uma cidade que nunca dorme. Seu Gou Quadrado tá na garagem da Vila Sem Pressa.\n\n' +
      'Pra ganhar a vida por aqui:\n• Entregas: pare em frente aos comércios com marcador amarelo e aperte E.\n• App PegaAí: fique online e leve passageiros pela cidade.\n• App Fretes: com uma picape ou caminhão de trabalho (a picape é a mais barata), faça fretes de carga, gás, combustível, entulho e reboque.\n• Percursos: bandeiras azuis no mapa, com medalhas.\n• Racha: depois das 22h, os rachas da madrugada pagam a aposta em dobro. Só cuidado: se a viatura vir, é multa.\n\n' +
      'Abasteça no posto, conserte aqui comigo quando bater e cuidado com o pardal nas avenidas. Q abre o celular, e o mapa fica no app Mapa.\n\nBoa noite e vai com Deus!', true);
  }
  if (Profile.rides === undefined) { Profile.rides = 0; Profile.ratingSum = 0; Profile.jobs = 0; }
  if (!Profile.sosMsg) { Profile.sosMsg = true; addMsg(ZE, 'Socorro 24h', 'Ficou sem gasolina ou bateu feio no meio do caminho? Me chama aqui no zap que eu vou até você com o guincho. Levo gasolina e ferramenta. Cobro 15% a mais que na oficina, por causa do deslocamento.', true); }
}
function randomHome(nx, ny, dmin, dmax) {
  const pool = World.homes.filter((h) => { const d = Math.hypot(h.x - nx, h.y - ny); return d > dmin && d < dmax; });
  return pick(pool.length ? pool : World.homes);
}
function routeLen(a, b) { const r = gpsRoute(a.x, a.y, b.x, b.y); return r ? r.len : Math.hypot(a.x - b.x, a.y - b.y) * 1.3; }
function genJob(type) {
  const J = JOB_TYPES[type];
  let pickPt, dest;
  const P = { x: player.x, y: player.y };
  if (type === 'pickup') {
    const s = pick(World.shops.filter((x) => ['mercado', 'paneleiras', 'oficina', 'sitio', 'fazenda'].includes(x.kind)));
    pickPt = { x: s.x, y: s.y, name: s.name }; const h = randomHome(s.x, s.y, 900, 3600); dest = { x: h.x, y: h.y, name: h.name };
  } else if (type === 'bau') {
    const d = World.depots.bau; pickPt = { x: d.x, y: d.y, name: d.name };
    const s = pick(World.shops.filter((x) => ['mercado', 'padaria', 'farmacia', 'lanchonete', 'churrascaria', 'bar', 'moquecaria', 'fazenda', 'sitio'].includes(x.kind)));
    dest = { x: s.x, y: s.y, name: s.name };
  } else if (type === 'gas') {
    const d = World.depots.gas; pickPt = { x: d.x, y: d.y, name: d.name }; const h = randomHome(d.x, d.y, 700, 4000); dest = { x: h.x, y: h.y, name: h.name };
  } else if (type === 'tanker') {
    const d = World.depots.fuel; pickPt = { x: d.x, y: d.y, name: d.name }; const s = pick(World.shops.filter((x) => x.kind === 'posto')); dest = { x: s.x, y: s.y, name: s.name };
  } else if (type === 'cacamba') {
    const o = pick(World.obras); pickPt = { x: o.x, y: o.y, name: o.name }; const d = World.depots.aterro; dest = { x: d.x, y: d.y, name: d.name };
  } else {
    const h = randomHome(P.x, P.y, 500, 2600); pickPt = { x: h.x, y: h.y, name: h.name };
    const s = World.shops.find((x) => x.kind === 'oficina'); dest = { x: s.x, y: s.y, name: s.name };
  }
  const len = routeLen(pickPt, dest) + routeLen(P, pickPt) * 0.3;
  const reward = Math.round((90 + len * 0.08) * J.mult / 5) * 5;
  return { type, item: pick(J.items), pick: pickPt, dest, len, reward, par: len / 190 + 35, fragile: !!J.fragile, hot: false, jobName: J.name, color: pick(CAR_COLORS) };
}
function startJob(job) {
  Act.delivery = Object.assign({}, job, { t: 0, hits: 0, stage: 'pickup', shop: { name: job.pick.name } });
  Act.gpsT = 0;
  AudioSys.chime();
  toast(job.jobName + ' aceito', 'Buscar ' + job.item.toLowerCase() + ' em ' + job.pick.name + '.', 'info');
}
// ---------- app de motorista ----------
function canDriveRides() { return player && VMODELS[player.car.model].kind !== 'truck'; }
// ---------- racha ----------
function rachaOpen() { const t = Profile.time; return t >= 22 * 60 && t < 28 * 60 + 30; }
function startRacha(r) {
  if (Profile.money < r.bet) { toast('Sem grana pra aposta', 'O racha custa R$ ' + fmtMoney(r.bet) + '.', 'bad'); AudioSys.error(); return; }
  Profile.money -= r.bet; UI.moneyDelta(-r.bet);
  Act.race = { r, idx: 0, t: 0, count: 3.4, lastBeep: 4, racha: true };
  toast('Racha contra ' + r.rival, 'Aposta R$ ' + fmtMoney(r.bet) + ' · tempo dele: ' + fmtTime(r.rivalTime) + '. Fuja das viaturas!', 'bad');
}
function finishRacha(R) {
  const r = R.r;
  Act.race = null;
  if (R.t < r.rivalTime) { AudioSys.chime(); Profile.rachaWins = (Profile.rachaWins || 0) + 1; pay(r.bet * 2, 'Ganhou o racha de ' + r.rival + '! (' + fmtTime(R.t) + ')'); }
  else toast('Perdeu o racha', r.rival + ' chegou antes (' + fmtTime(r.rivalTime) + ' contra ' + fmtTime(R.t) + '). Já era a aposta.', 'bad');
  saveGame();
}
function rachaGhostPos(R) {
  const r = R.r, d = clamp(R.t / r.rivalTime, 0, 1) * r.len;
  let acc = 0;
  for (let i = 1; i < r.all.length; i++) {
    const a = r.all[i - 1], b = r.all[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (acc + L >= d) { const k = (d - acc) / L; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])]; }
    acc += L;
  }
  const z = r.all[r.all.length - 1]; return [z[0], z[1], 0];
}
// ---------- música do gás ----------
const GasJingle = { t: 0 };
function gasJingle(dt) {
  if (!AudioSys.ok || !player || player.car.job !== 'gas' || !Act.delivery || Act.delivery.stage !== 'deliver') { GasJingle.t = 0; return; }
  GasJingle.t -= dt;
  if (GasJingle.t > 0) return;
  GasJingle.t = 7;
  // "Pour Elise" (domínio público), a musiquinha do caminhão de gás
  const N = [659, 622, 659, 622, 659, 494, 587, 523, 440];
  N.forEach((f, i) => { AudioSys.tone(f, 0.22, 'triangle', 0.05, 'engine', null, i * 0.18); AudioSys.tone(f * 2, 0.12, 'sine', 0.015, 'engine', null, i * 0.18); });
}
// ---------- atualização ----------
function updateJobs(dt) {
  const p = player, sp = p.speed;
  ensurePhoneData();
  // estágio de coleta de fretes
  if (Act.delivery && Act.delivery.stage === 'pickup') {
    const d = Act.delivery;
    if (Math.hypot(d.pick.x - p.x, d.pick.y - p.y) < 75 && sp < 40) {
      d.stage = 'deliver'; d.t = 0; Act.gpsT = 0;
      AudioSys.thud(); AudioSys.tone(660, 0.1, 'triangle', 0.08, 'ui');
      toast('Carregado!', d.item + ' a bordo. Leve até ' + d.dest.name + '.', 'good');
    }
  }
  gasJingle(dt);
  // app de motorista
  if (Act.rideOnline && !Act.ride && !Act.delivery && !Act.race) {
    Act.rideT -= dt;
    if (Act.rideT <= 0) newRideRequest();
  }
  if (Act.ride) {
    const R = Act.ride;
    R.t += dt;
    if (R.stage === 'pickup' && Math.hypot(R.pick.x - p.x, R.pick.y - p.y) < 70 && sp < 35) {
      R.stage = 'drive'; R.t = 0; Act.gpsT = 0; AudioSys.thud();
      toast(R.name + ' entrou', rideOnBoard(R), 'info');
    } else if (R.stage === 'drive' && Math.hypot(R.dest.x - p.x, R.dest.y - p.y) < 70 && sp < 35) {
      rideFinish(R);
    }
  }
  // racha: polícia de olho
  if (Act.race && Act.race.racha && Act.race.count <= 0) {
    for (const c of Traffic.cars) {
      if (c.model !== 'police') continue;
      if (Math.hypot(c.x - p.x, c.y - p.y) < 380) {
        Act.race = null;
        const fine = Math.min(300, Math.max(0, Math.floor(Profile.money)));
        Cam.flash = 0.6; AudioSys.siren();
        if (fine) pay(-fine, 'Sujou! A viatura viu o racha. Multa e aposta perdida.'); else toast('Sujou!', 'A viatura viu o racha. Aposta perdida.', 'bad');
        break;
      }
    }
  }
  // convite do racha quando chega a madrugada
  if (rachaOpen() && !Profile.rachaMsg) { Profile.rachaMsg = true; addMsg('Zé do Canecão', 'Racha hoje?', 'E aí, parceiro. Hoje tem racha: arrancada na BR-101, pega na Avenida Cara-Pintada e o racha do Centrão. Aposta na hora, quem ganhar leva o dobro. Abre o app Racha que eu te passo o ponto. Só fica esperto com a viatura, que se ela vir, é multa na certa.', false,
    [['Tô dentro!', 'Fechou! Abre o app Racha que o ponto tá lá. Chega quieto e sem farol alto.'], ['Hoje não, valeu', 'Tranquilo, parceiro. Até a madrugada acaba, se mudar de ideia é só chegar.']]); }
  if (!rachaOpen()) Profile.rachaMsg = false;
}

/* ---------- socorro do Seu Zé: chama pelo zap e ele vem de guincho (15% mais caro que a oficina) ---------- */
const ZE = 'Seu Zé (Oficina)';
const Socorro = { job: null };
function socorroQuote(kind) {
  if (kind === 'bat') return Math.ceil(lifePrice('bat') * 1.15);
  if (kind === 'pneu') return Math.ceil(lifePrice('tires') * 1.15);
  const fuel = Math.ceil(Math.max(0, 100 - Profile.fuel) * 1.8 * 1.15), fix = Math.ceil(Profile.damage * 4 * 1.15);
  return kind === 'gas' ? fuel : kind === 'fix' ? fix : fuel + fix;
}
// rota pela mão direita da pista (os pontos do GPS ficam no meio da rua)
function laneShift(pts, off) {
  const out = pts.map((p) => p.slice());
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    let dx = (c[0] - a[0]), dy = (c[1] - a[1]); const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    out[i] = [b[0] - dy * off, b[1] + dx * off];
  }
  return out;
}
// anda pela rota respeitando quem está na frente (carros da IA e você)
function socorroDrive(J, speed, dt) {
  const c = Math.cos(J.a), s = Math.sin(J.a);
  let blocked = false;
  const ahead = (x, y) => { const rx = x - J.x, ry = y - J.y, f = rx * c + ry * s, l = Math.abs(-rx * s + ry * c); return f > 0 && f < 70 && l < 18; };
  for (const o of Traffic.cars) if (ahead(o.x, o.y)) { blocked = true; break; }
  if (J.state === 'leaving' && player && ahead(player.x, player.y)) blocked = true;
  J.v = lerp(J.v || 0, blocked ? 0 : speed, 1 - Math.exp(-3 * dt));
  let step = J.v * dt;
  while (step > 0 && J.ri < J.pts.length) {
    const p = J.pts[J.ri], dx = p[0] - J.x, dy = p[1] - J.y, d = Math.hypot(dx, dy);
    if (d < 0.5) { J.ri++; continue; }
    const m = Math.min(d, step); J.x += dx / d * m; J.y += dy / d * m; step -= m;
    J.a += angDiff(J.a, Math.atan2(dy, dx)) * Math.min(1, dt * 7);
    if (m >= d) J.ri++;
  }
  return J.ri >= J.pts.length;
}
function socorroCall(kind) {
  if (Socorro.job || !player) return;
  if (!zeFiadoGate()) return; // fiado em aberto: sem acertar, ele não vem
  // sai da oficina se ela estiver perto; senão aparece numa rua a uns 1,2 km de você
  const of = World.shops.find((s) => s.kind === 'oficina');
  let sx, sy;
  if (of && Math.hypot(of.x - player.x, of.y - player.y) < 2600) { sx = of.x; sy = of.y; }
  else { const a = rnd(TAU); const ne = nearestEdge(clamp(player.x + Math.cos(a) * 1300, 100, WORLD_W - 100), clamp(player.y + Math.sin(a) * 1300, 100, WORLD_H - 100)); sx = ne.e.h ? ne.e.a.x + ne.s : ne.e.a.x; sy = ne.e.h ? ne.e.a.y : ne.e.a.y + ne.s; }
  const route = gpsRoute(sx, sy, player.x, player.y);
  const pts = route ? laneShift(route.pts, 20) : [[sx, sy], [player.x, player.y]];
  const J = { kind, x: sx, y: sy, a: 0, pts, ri: 1, state: 'coming', t: 0, rt: 3, quote: socorroQuote(kind) };
  Profile.sos = (Profile.sos || 0) + 1;
  Socorro.job = J;
  const len = route ? route.len : Math.hypot(sx - player.x, sy - player.y), eta = Math.max(1, Math.round(len / 280 / 20));
  const what = kind === 'gas' ? 'gasolina' : kind === 'fix' ? 'conserto' : kind === 'bat' ? 'uma chupeta, a bateria arriou' : kind === 'pneu' ? 'pneus novos, tô no aro' : 'gasolina e conserto';
  Profile.msgs.unshift({ from: ZE, title: '', body: 'Seu Zé, preciso de ' + what + '. Me socorre aí!', read: true, me: true, t: Math.floor(Profile.time) });
  setTimeout(() => {
    addMsg(ZE, '', 'Tô indo aí com o guincho! Fica parado num lugar seguro, com o pisca ligado. Chego em uns ' + eta + ' min. Fica uns R$ ' + fmtMoney(J.quote) + ' (15% a mais que na oficina, por causa do deslocamento).', true);
    if (Screens.current === 'screen-phone' && Phone.chat === ZE) Phone.render();
    phoneTone(1320, 0.06, 0.05);
  }, 1200);
  Act.waypoint = null; Act.gps = null;
}
function socorroCancel() {
  if (!Socorro.job) return;
  Socorro.job = null;
  Profile.msgs.unshift({ from: ZE, title: '', body: 'Seu Zé, pode cancelar, já me virei.', read: true, me: true, t: Math.floor(Profile.time) });
  setTimeout(() => { addMsg(ZE, '', 'Beleza, dei meia-volta. Qualquer coisa me chama!', true); if (Screens.current === 'screen-phone' && Phone.chat === ZE) Phone.render(); }, 900);
}
Socorro.update = function (dt) {
  const J = this.job; if (!J || !player) return;
  J.t += dt;
  if (J.state === 'coming') {
    // recalcula a rota se você saiu do lugar
    J.rt -= dt;
    const end = J.pts[J.pts.length - 1];
    if (J.rt <= 0) { J.rt = 3; if (Math.hypot(end[0] - player.x, end[1] - player.y) > 150) { const r = gpsRoute(J.x, J.y, player.x, player.y); if (r) { J.pts = laneShift(r.pts, 20); J.ri = 1; } } }
    socorroDrive(J, 300, dt);
    if (J.ri >= J.pts.length) { const dx = player.x - J.x, dy = player.y - J.y, d = Math.hypot(dx, dy); if (d > 40) { const m = Math.min(d - 40, 200 * dt); J.x += dx / d * m; J.y += dy / d * m; J.a = Math.atan2(dy, dx); } }
    if (Math.hypot(player.x - J.x, player.y - J.y) < 75) { J.state = 'arrived'; J.t = 0; toast('Seu Zé chegou!', 'Fica parado aí que ele já resolve.', 'info'); AudioSys.aiHorn(60, 'caminhao', 0); }
  } else if (J.state === 'arrived') {
    if (player.speed > 30) { J.t = 0; if (Math.hypot(player.x - J.x, player.y - J.y) > 160) { J.state = 'coming'; J.rt = 0; } return; }
    if (J.t > 0.4 && Math.floor(J.t * 2.5) !== Math.floor((J.t - dt) * 2.5)) AudioSys.wrench();
    if (J.t > 3) {
      // serviço completo; o que faltar de dinheiro o Seu Zé anota no fiado (é amigo)
      const L = carLife();
      let cost = 0, what = '';
      if (J.kind === 'bat') { L.bat = 100; CarLife.stalled = false; cost = J.quote; what = 'Chupeta feita, o motor pegou!'; }
      else if (J.kind === 'pneu') { L.tires = 100; cost = J.quote; what = 'Pneus novos no lugar!'; }
      else {
        const fuelNeed = J.kind !== 'fix' ? Math.max(0, 100 - Profile.fuel) : 0, dmg = J.kind !== 'gas' ? Profile.damage : 0;
        cost = fuelNeed * 1.8 * 1.15 + dmg * 4 * 1.15;
        Profile.fuel = Math.min(100, Profile.fuel + fuelNeed);
        if (dmg > 0) { Profile.damage = 0; if (Profile.zones) { for (const z of ['f', 'r', 'l', 'rt', 'fL', 'fR']) Profile.zones[z] = 0; Profile.zones.seed = (Profile.zones.seed || 0) + 1; } }
        what = 'Tudo resolvido.';
      }
      const ch = zeCharge(cost, true);
      AudioSys.chime();
      toast('Socorro do Seu Zé', what + ' Pago R$ ' + fmtMoney(ch.paid) + (ch.owed ? ' · fiado R$ ' + fmtMoney(ch.owed) : ''), 'good');
      const tip = J.kind === 'bat' ? ' Agora não fica parado com o farol aceso não, hein. Bateria não é poste.' : J.kind === 'pneu' ? ' Pneu novo, sapato novo! Para de cantar pneu em toda esquina.' : ' Vai com Deus e devagar.';
      addMsg(ZE, '', ch.owed ? (ch.paid ? 'Peguei os R$ ' + fmtMoney(ch.paid) + ' que você tinha e ' : 'Tá liso, né? Tranquilo, ') + 'anotei R$ ' + fmtMoney(ch.owed) + ' no fiado. Amanhã, na virada da noite, eu pego sozinho se tiver dinheiro. Se atrasar, entra jurinho, viu?' + tip : 'Prontinho, R$ ' + fmtMoney(ch.paid) + '.' + tip, true);
      J.kind = 'done';
      J.state = 'leaving'; J.t = 0; J.v = 0; saveGame();
      // volta pela rua até a garagem da oficina
      const of = World.shops.find((s) => s.kind === 'oficina');
      const rb = of ? gpsRoute(J.x, J.y, of.x, of.y) : null;
      J.pts = rb ? laneShift(rb.pts, 20) : [[J.x, J.y]]; J.ri = 1;
      if (of && of.bld) { const b = of.bld; J.pts.push([clamp(of.x, b.x0 + 20, b.x1 - 20), clamp(of.y, b.y0, b.y1)]); }
      J.home = !!of;
    }
  } else if (J.state === 'leaving') {
    const done = socorroDrive(J, 260, dt);
    // longe da tela por muito tempo: considera que já chegou
    const far = Math.hypot(J.x - Cam.x, J.y - Cam.y) > 2600 && J.t > 8;
    if (done || far || !J.home) { J.fade = (J.fade || 0) + dt; if (J.fade > 1 || far || !J.home) this.job = null; }
  }
};
function socorroBar(H) {
  const J = Socorro.job;
  if (J) {
    const d = Math.round(Math.hypot(J.x - player.x, J.y - player.y) * 0.09);
    return `<div class="wa-sos"><b>${J.state === 'coming' ? 'Seu Zé está a caminho · ' + (d > 1000 ? (d / 1000).toFixed(1).replace('.', ',') + ' km' : d + ' m') : J.state === 'arrived' ? 'Seu Zé chegou! Fique parado.' : 'Serviço concluído'}</b>${J.state === 'coming' ? '<button data-sos="cancel" class="off">Cancelar</button>' : ''}</div>`;
  }
  const qg = socorroQuote('gas'), qf = socorroQuote('fix');
  const L = carLife(), qb = socorroQuote('bat'), qp = socorroQuote('pneu');
  const opts = [['gas', 'Gasolina', qg, qg >= 8], ['fix', 'Conserto', qf, qf >= 8], ['both', 'Os dois', qg + qf, qg >= 8 && qf >= 8], ['bat', 'Chupeta', qb, L.bat < 30], ['pneu', 'Pneus', qp, L.tires < 15]].filter((o) => o[3]);
  const sub = fiadoOpen() ? `<small class="wa-fiado">fiado R$ ${fmtMoney(Math.ceil(Profile.fiado.amount))}</small>` : '<small>+15% · faz fiado</small>';
  return `<div class="wa-sos"><div class="wa-sos-h"><b>Socorro do Seu Zé</b>${sub}</div>` +
    (opts.length ? '<div class="wa-sos-btns">' + opts.map((o) => `<button data-sos="${o[0]}">${o[1]}<small>R$ ${fmtMoney(o[2])}</small></button>`).join('') + '</div>' : '<small class="wa-sos-ok">Carro em dia, nada pra socorrer.</small>') + '</div>';
}

/* ---------- APP TEMPORÁRIO DE TRAPAÇAS (para testes) ----------
   Para remover: troque CHEATS_ENABLED para false (o ícone some e nada disso roda). */
const CHEATS_ENABLED = true;
const Cheats = { god: false, turbo: false };
const CHEAT_PLACES = [
  ['Garagem', () => World.home], ['Oficina do Seu Zé', () => World.shops.find((s) => s.kind === 'oficina')], ['Batalhão da PM', () => World.shops.find((s) => s.kind === 'batalhao')],
  ['Centrão', () => ({ x: 1600, y: 1150 })], ['Feio Rosa', () => ({ x: 1150, y: 7350 })], ['Jardim Cara-Pintada', () => ({ x: 3300, y: 7350 })],
  ['BR-101', () => ({ x: 4200, y: 6221 })], ['Terceira Ponte e Meia', () => ({ x: 5000, y: 1500 })], ['Fazenda Muuuito Longe', () => ({ x: 7700, y: 5000 })],
];
function cheatTeleport(t) {
  if (!t) return;
  const ne = nearestEdge(t.x, t.y), e = ne.e;
  const x = e.h ? e.a.x + ne.s : e.a.x + e.T.lanes[0], y = e.h ? e.a.y + e.T.lanes[0] : e.a.y + ne.s;
  player.place(x, y, e.h ? 0 : Math.PI / 2); Cam.x = x; Cam.y = y; Traffic.fill(x, y); Police.units.length = 0; Police.level = 0;
}
function cheatDo(k, v) {
  const ok = (t) => { toast('Trapaça', t, 'info'); AudioSys.tone(1500, 0.06, 'square', 0.05, 'ui'); };
  if (k === 'money') { pay(10000, null); ok('+R$ 10.000'); }
  if (k === 'fix') { const L = carLife(); L.tires = L.oil = L.bat = 100; CarLife.stalled = false; Profile.damage = 0; Profile.zones = { f: 0, r: 0, l: 0, rt: 0, seed: ((Profile.zones && Profile.zones.seed) || 0) + 1 }; Profile.fuel = 100; Profile.dirt = 0; ok('Carro novo e tanque cheio'); }
  if (k === 'cars') { for (const c of CARS) Profile.owned[c.id] = true; ok('Todos os veículos liberados na garagem'); }
  if (k === 'pois') { for (const q of World.pois) if (!Profile.discovered.includes(q.id)) Profile.discovered.push(q.id); ok('Todos os pontos de interesse revelados'); }
  if (k === 'time') { Profile.time = +v; ok('Relógio: ' + clockStr()); }
  if (k === 'wx') { Settings.weather = v; if (v === 'auto') { Weather.timer = 0; } else { Weather.target = v === 'chuva' ? 0.9 : v === 'garoa' ? 0.35 : 0; if (v === 'garoa') Settings.weather = 'auto', Weather.target = 0.35, Weather.timer = 120; } saveSettings(); ok('Clima: ' + v); }
  if (k === 'police') { const n = +v; if (n === 0) { Police.level = 0; Police.units.length = 0; ok('Polícia liberada'); } else { Police.crime('Trapaça', n, player.x, player.y, true); Police.level = n; ok(n + ' estrela(s)'); } }
  if (k === 'ev') { Events.clear(); let okv = false; for (let i = 0; i < 12 && !okv; i++) okv = Events.spawn(v); Screens.closeAll(); ok(okv ? 'Evento: ' + EV_NAMES[v] : 'Não achei lugar pra esse evento aqui; tente em outra região'); return; }
  if (k === 'wear') { const L = carLife(), n = +v; L.tires = L.oil = L.bat = n; CarLife.warned = {}; if (n > 5) CarLife.stalled = false; ok('Pneus, óleo e bateria em ' + n + '%'); }
  if (k === 'god') { Cheats.god = !Cheats.god; ok('Modo indestrutível ' + (Cheats.god ? 'ligado' : 'desligado')); }
  if (k === 'turbo') { Cheats.turbo = !Cheats.turbo; player.recalc(); ok('Turbo ' + (Cheats.turbo ? 'ligado' : 'desligado')); }
  if (k === 'tp') { const pl = CHEAT_PLACES[+v]; cheatTeleport(pl && pl[1]()); Screens.closeAll(); ok('Teleporte: ' + (pl ? pl[0] : '')); return; }
  if (k === 'tpgps') { if (Act.waypoint) { cheatTeleport(Act.waypoint); Screens.closeAll(); ok('Teleporte para o destino do GPS'); } else ok('Marque um destino no Mapa antes'); return; }
  saveGame(); Phone.render();
}

/* ---------- conquistas ---------- */
const kmRodados = () => (Profile.distance || 0) * 0.09 / 1000;
const ACHIEVEMENTS_ALL = [
  { id: 'entrega1', name: 'Primeira entrega', desc: 'Faça sua primeira entrega.', goal: 1, val: () => Profile.deliveries || 0, prize: 50 },
  { id: 'entrega10', name: 'Motoboy honorário', desc: 'Complete 10 entregas ou fretes.', goal: 10, val: () => Profile.deliveries || 0, prize: 250 },
  { id: 'corrida1', name: 'Bem-vindo ao PegaAí', desc: 'Faça sua primeira corrida no PegaAí.', goal: 1, val: () => Profile.rides || 0, prize: 50 },
  { id: 'corrida25', name: 'Motorista cinco estrelas', desc: 'Complete 25 corridas no PegaAí.', goal: 25, val: () => Profile.rides || 0, prize: 400 },
  { id: 'turista', name: 'Turista acidental', desc: 'Descubra 5 pontos de interesse.', goal: 5, val: () => (Profile.discovered || []).length, prize: 100 },
  { id: 'explorador', name: 'Conhece cada canto', desc: 'Descubra todos os pontos de interesse.', goal: () => World.pois.length, val: () => (Profile.discovered || []).length, prize: 600 },
  { id: 'ouro', name: 'Medalha de ouro', desc: 'Ganhe ouro em um percurso cronometrado.', goal: 1, val: () => Object.values(Profile.races || {}).filter((r) => r.medal === 3).length, prize: 150 },
  { id: 'reiouro', name: 'Rei dos percursos', desc: 'Ouro em todos os percursos.', goal: () => World.races.length, val: () => Object.values(Profile.races || {}).filter((r) => r.medal === 3).length, prize: 800 },
  { id: 'racha1', name: 'Primeiro racha', desc: 'Ganhe um racha de madrugada.', goal: 1, val: () => Profile.rachaWins || 0, prize: 150 },
  { id: 'racha5', name: 'Lenda da madrugada', desc: 'Ganhe 5 rachas.', goal: 5, val: () => Profile.rachaWins || 0, prize: 500 },
  { id: 'km10', name: 'Pé na estrada', desc: 'Rode 10 km por São Gambiarra.', goal: 10, val: kmRodados, prize: 100, unit: ' km' },
  { id: 'km100', name: 'Rodou a cidade inteira', desc: 'Rode 100 km.', goal: 100, val: kmRodados, prize: 600, unit: ' km' },
  { id: 'veloz', name: 'Radar nem viu', desc: 'Passe dos 180 km/h.', goal: 180, val: () => Profile.topSpeed || 0, prize: 150, unit: ' km/h' },
  { id: 'drift', name: 'Rei do drift', desc: 'Derrape de lado por 20 segundos no total.', goal: 20, val: () => Profile.driftT || 0, prize: 200, unit: ' s' },
  { id: 'vaga', name: 'Baliza perfeita', desc: 'Estacione em 3 vagas marcadas.', goal: 3, val: () => Object.keys(Profile.parks || {}).length, prize: 150 },
  { id: 'colecao', name: 'Colecionador', desc: 'Tenha 4 veículos na garagem.', goal: 4, val: () => Object.keys(Profile.owned || {}).length, prize: 300 },
  { id: 'rico', name: 'Tá podendo, hein', desc: 'Ganhe R$ 10.000 no total.', goal: 10000, val: () => Profile.earned || 0, prize: 500, money: true },
  { id: 'vandalo', name: 'Prefeitura chora', desc: 'Derrube 25 objetos da cidade.', goal: 25, val: () => Profile.broken || 0, prize: 50 },
  { id: 'socorro', name: 'Seu Zé salvou', desc: 'Chame o socorro do Seu Zé.', goal: 1, val: () => Profile.sos || 0, prize: 30 },
  { id: 'fuga', name: 'Sumiu na neblina', desc: 'Despiste uma perseguição da polícia.', goal: 1, val: () => Profile.escapes || 0, prize: 250 },
  { id: 'fichado', name: 'Ficha corrida', desc: 'Seja detido pela polícia (não é motivo de orgulho).', goal: 1, val: () => Profile.busts || 0, prize: 10 },
  { id: 'samaritano', name: 'Bom samaritano', desc: 'Ajude 3 motoristas com o carro quebrado.', goal: 3, val: () => (Profile.evDone || {}).quebrado || 0, prize: 200 },
  { id: 'cupido', name: 'Padrinho de última hora', desc: 'Leve um noivo atrasado até a igreja a tempo.', goal: 1, val: () => (Profile.evDone || {}).noivo || 0, prize: 150 },
  { id: 'bananeiro', name: 'Escorregou mas não caiu', desc: 'Recolha todas as caixas de uma carreta de banana tombada.', goal: 1, val: () => (Profile.evDone || {}).banana || 0, prize: 150 },
  { id: 'leiseca', name: 'Bafômetro zerado', desc: 'Pare numa blitz da Lei Seca.', goal: 1, val: () => (Profile.evDone || {}).blitz || 0, prize: 100 },
  { id: 'arraia', name: 'Salvou o arraiá', desc: 'Ajude a organizadora de uma festa junina.', goal: 1, val: () => (Profile.evDone || {}).festa || 0, prize: 150 },
  { id: 'caroneiro', name: 'Caroneiro da BR', desc: 'Dê 3 caronas na BR.', goal: 3, val: () => (Profile.evDone || {}).carona || 0, prize: 200 },
  { id: 'eventos10', name: 'A noite é uma caixinha de surpresas', desc: 'Participe de 10 eventos pela cidade.', goal: 10, val: () => Profile.evTotal || 0, prize: 400 },
  { id: 'nivel5', name: 'Motorista de aplicativo', desc: 'Chegue ao nível 5.', goal: 5, val: () => career().lvl, prize: 200 },
  { id: 'nivel15', name: 'Lenda em construção', desc: 'Chegue ao nível 15.', goal: 15, val: () => career().lvl, prize: 800 },
  { id: 'vip5', name: 'Motorista de bacana', desc: 'Faça 3 corridas VIP com 5 estrelas.', goal: 3, val: () => Profile.vipOk || 0, prize: 400 },
  { id: 'xingado', name: 'Ouvi poucas e boas', desc: 'Receba um áudio de cliente bravo.', goal: 1, val: () => Profile.angry || 0, prize: 20 },
  { id: 'quitado', name: 'Nome limpo na praça', desc: 'Quite um empréstimo do Banestresse.', goal: 1, val: () => Profile.loansPaid || 0, prize: 150 },
  { id: 'noite', name: 'Varou a madrugada', desc: 'Jogue até o dia amanhecer.', goal: 1, val: () => Profile.nights || 0, prize: 200 },
];
// sem o sistema de polícia, as conquistas de perseguição ficam escondidas
const ACHIEVEMENTS = ACHIEVEMENTS_ALL.filter((a) => POLICE_ENABLED || (a.id !== 'fuga' && a.id !== 'fichado'));
const Achievements = {
  t: 0,
  goal(a) { return typeof a.goal === 'function' ? Math.max(1, a.goal()) : a.goal; },
  check(dt) {
    this.t -= dt; if (this.t > 0) return; this.t = 1;
    Profile.ach = Profile.ach || {};
    for (const a of ACHIEVEMENTS) {
      if (Profile.ach[a.id]) continue;
      if (a.val() >= this.goal(a)) {
        Profile.ach[a.id] = clockStr();
        AudioSys.chime();
        toast('Conquista desbloqueada!', a.name + ' — prêmio de R$ ' + fmtMoney(a.prize), 'good');
        pay(a.prize, null);
      }
    }
  },
};

/* ---------- interface do celular ---------- */
/* ---------- celular Pera: papéis de parede da cidade, ícones e ajustes ---------- */
const PERA_LOGO = '<svg class="pera-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.4c-1.7 0-2.7 1.4-3 3.1C8.7 11.2 5.8 12.6 5.8 16.2c0 3.4 2.8 5.6 6.2 5.6s6.2-2.2 6.2-5.6c0-3.6-2.9-5-3.2-6.7-.3-1.7-1.3-3.1-3-3.1z" fill="currentColor"/><path d="M12 6.4c0-1.6.4-2.9 1.3-3.8" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M13.1 4.3c1.6-1.5 3.6-1.4 4.6-.8-1 1.7-3 2.3-4.6.8z" fill="currentColor"/></svg>';
// ícones minimalistas: um símbolo de traço branco sobre cor sólida
const _ln = (d) => `<g fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</g>`;
const PH_ICONS = {
  mapa: ['#16a085', _ln('<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>')],
  msgs: ['#25b04a', _ln('<path d="M20 11.5a7.5 7 0 0 1-10.6 6.4L4.5 19.5l1.4-4A7 7 0 0 1 4.5 11.5 7.5 7 0 0 1 20 11.5z"/>')],
  pegaai: ['#2c2c30', _ln('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 14v6M10.2 11.2 4.6 9.6M13.8 11.2l5.6-1.6"/>')],
  fretes: ['#f08a24', _ln('<path d="M12 3.5 19.5 7.5v9L12 20.5 4.5 16.5v-9z"/><path d="M4.5 7.5 12 11.5l7.5-4M12 11.5v9"/>')],
  racha: ['#e0353b', _ln('<path d="M6 21V4"/><path d="M6 4.5h11l-2.5 4 2.5 4H6"/>')],
  carteira: ['#2f6fdf', _ln('<rect x="3.5" y="6" width="17" height="13" rx="2.5"/><path d="M3.5 10h17"/><circle cx="16.5" cy="14.5" r="1" fill="#fff"/>')],
  trapaca: ['#7d3cff', _ln('<path d="M4 20 14 10"/><path d="M15 3l1 2.5L18.5 6.5 16 7.5 15 10l-1-2.5L11.5 6.5 14 5.5z"/><path d="M19 12l.6 1.4 1.4.6-1.4.6L19 16l-.6-1.4-1.4-.6 1.4-.6z"/>')],
  conquistas: ['#e0a21b', _ln('<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4"/>')],
  ajustes: ['#7b808a', _ln('<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M5.5 18.5l1.8-1.8M16.7 7.3l1.8-1.8"/>')],
};
const PH_APPS = { mapa: 'Mapa', msgs: 'Mensagens', pegaai: 'PegaAí', fretes: 'Fretes', racha: 'Racha', carteira: 'Carteira', conquistas: 'Conquistas', trapaca: 'Trapaças', ajustes: 'Ajustes' };
function phIcon(id, badge) {
  const [bg, svg] = PH_ICONS[id];
  return `<button class="ph-app" data-app="${id}"><span class="ph-ico" style="background:${bg}"><svg viewBox="0 0 24 24">${svg}</svg>${badge ? `<i class="ph-badge">${badge}</i>` : ''}</span><span class="ph-lbl">${PH_APPS[id]}</span></button>`;
}
// papéis de parede: paisagens de São Gambiarra e arredores, desenhadas em SVG
const WALLS = [
  { id: 'penha', name: 'Convento da Pena', place: 'Vila Véia' },
  { id: 'ponte', name: 'Terceira Ponte e Meia', place: 'Vitorinha' },
  { id: 'pedra', name: 'Pedra Azulejo', place: 'Domingos Martelo' },
  { id: 'camburi', name: 'Praia de Camburiso', place: 'Vitorinha' },
  { id: 'dunas', name: 'Dunas de Ita-Unhas', place: 'Conceição da Barraca' },
  { id: 'estrada', name: 'Estrada da Madrugada', place: 'Rodovia BR-101 e Pouco' },
];
const _wallCache = {};
function wallSVG(id) {
  const R = mulberry32(id.length * 977 + id.charCodeAt(0) * 31);
  const stars = (n, y1, op) => { let s = ''; for (let i = 0; i < n; i++) s += `<circle cx="${(R() * 300).toFixed(1)}" cy="${(R() * y1).toFixed(1)}" r="${(0.4 + R() * 1.1).toFixed(2)}" fill="#fff" opacity="${(op * (0.4 + R() * 0.6)).toFixed(2)}"/>`; return s; };
  const lights = (n, y0, y1, cols) => { let s = ''; for (let i = 0; i < n; i++) s += `<rect x="${(R() * 300).toFixed(1)}" y="${(y0 + R() * (y1 - y0)).toFixed(1)}" width="1.6" height="1.6" fill="${cols[(R() * cols.length) | 0]}" opacity="${(0.5 + R() * 0.5).toFixed(2)}"/>`; return s; };
  const grad = (gid, stops, vert) => `<linearGradient id="${gid}" x1="0" y1="0" x2="${vert ? 0 : 1}" y2="${vert ? 1 : 0}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
  let g = '';
  switch (id) {
    case 'penha':
      g = `<defs>${grad('s', [[0, '#0a1433'], [0.55, '#3a2a6a'], [0.8, '#d0607a'], [1, '#f2a25a']], 1)}${grad('w', [[0, '#1c2550'], [1, '#05081a']], 1)}</defs>
      <rect width="300" height="600" fill="url(#s)"/>${stars(70, 260, 1)}
      <path d="M0 470 C40 455 70 440 100 400 C120 370 140 330 160 318 C175 309 205 306 222 318 C240 334 255 380 275 420 C285 440 295 455 300 462 V600 H0Z" fill="#1a1a2e"/>
      <path d="M118 380 C135 350 150 330 165 322 L170 340 C150 352 135 370 125 392Z" fill="#26263f"/>
      <rect x="170" y="290" width="44" height="22" fill="#e9e2cf"/><rect x="200" y="276" width="14" height="36" fill="#f2ecdc"/>
      <path d="M168 292 L192 280 L216 292Z" fill="#b5523a"/><path d="M198 278 L207 268 L216 278Z" fill="#b5523a"/>
      <rect x="176" y="297" width="4" height="7" fill="#f6c24a"/><rect x="186" y="297" width="4" height="7" fill="#f6c24a"/><rect x="205" y="284" width="4" height="6" fill="#f6c24a"/>
      <rect y="470" width="300" height="130" fill="url(#w)"/>${lights(160, 470, 600, ['#ffcf6a', '#ffe9b0', '#ff9a4a'])}
      <path d="M0 470 H300" stroke="#f2a25a" stroke-opacity="0.5"/>`;
      break;
    case 'ponte':
      g = `<defs>${grad('s', [[0, '#03061a'], [0.7, '#162452'], [1, '#2c3f7a']], 1)}${grad('w', [[0, '#0d1838'], [1, '#02040e']], 1)}</defs>
      <rect width="300" height="600" fill="url(#s)"/>${stars(80, 330, 1)}<circle cx="232" cy="96" r="22" fill="#f4efd6"/><circle cx="224" cy="90" r="22" fill="#162452" opacity="0.15"/>
      <path d="M0 360 h24 v-50 h18 v30 h14 v-62 h20 v82 h16 v-36 h22 v40 H0Z" fill="#0b1230"/><path d="M200 380 v-40 h18 v-30 h22 v50 h16 v-74 h22 v58 h22 v36Z" fill="#0b1230"/>
      ${lights(70, 300, 380, ['#ffd37a', '#bfe3ff'])}
      <rect y="380" width="300" height="220" fill="url(#w)"/>
      <path d="M-10 420 Q150 300 310 420" stroke="#d8dce8" stroke-width="5" fill="none"/>
      ${[30, 70, 110, 150, 190, 230, 270].map((x) => { const t = (x + 10) / 320, y = (1 - t) * (1 - t) * 420 + 2 * (1 - t) * t * 300 + t * t * 420; return `<rect x="${x - 3}" y="${y.toFixed(0)}" width="6" height="${(600 - y).toFixed(0)}" fill="#8a90a6" opacity="0.55"/>`; }).join('')}
      ${Array.from({ length: 26 }, (_, i) => { const t = i / 25, x = -10 + t * 320, y = (1 - t) * (1 - t) * 420 + 2 * (1 - t) * t * 300 + t * t * 420; return `<circle cx="${x.toFixed(1)}" cy="${(y - 5).toFixed(1)}" r="1.8" fill="#ffd37a"/><rect x="${(x - 1).toFixed(1)}" y="${(y + 40 + R() * 80).toFixed(0)}" width="2" height="${(12 + R() * 30).toFixed(0)}" fill="#ffd37a" opacity="0.25"/>`; }).join('')}`;
      break;
    case 'pedra':
      g = `<defs>${grad('s', [[0, '#0b0f2a'], [0.5, '#2a3a7a'], [1, '#7a8ac8']], 1)}${grad('r', [[0, '#7d93b8'], [1, '#3c4f78']], 0)}</defs>
      <rect width="300" height="600" fill="url(#s)"/>${stars(60, 220, 0.9)}
      <path d="M0 420 C40 400 60 390 90 380 L300 360 V600 H0Z" fill="#26305a"/>
      <path d="M60 420 C70 330 105 230 165 215 C220 205 250 290 262 420Z" fill="url(#r)"/>
      <path d="M150 230 C160 280 158 340 170 410" stroke="#5f7298" stroke-width="5" fill="none" opacity="0.7"/><path d="M196 222 C210 260 222 320 232 410" stroke="#a8b8d6" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M232 300 C240 270 258 266 268 290 C274 320 276 370 280 420 H232Z" fill="#4c6190"/>
      <rect y="410" width="300" height="190" fill="#121a36"/>
      ${Array.from({ length: 30 }, (_, i) => { const x = i * 10.5 + R() * 6, h = 30 + R() * 40, y = 415 + R() * 30; return `<path d="M${x.toFixed(0)} ${(y - h).toFixed(0)} L${(x + 9).toFixed(0)} ${y.toFixed(0)} L${(x - 9).toFixed(0)} ${y.toFixed(0)}Z" fill="#0a1226"/>`; }).join('')}
      <rect y="440" width="300" height="160" fill="#070c1c"/><rect y="400" width="300" height="30" fill="#c8d4f0" opacity="0.08"/>`;
      break;
    case 'camburi':
      g = `<defs>${grad('s', [[0, '#3a2a6a'], [0.45, '#d65a6a'], [0.75, '#ffa64a'], [1, '#ffd27a']], 1)}${grad('w', [[0, '#c8706a'], [1, '#203a6a']], 1)}</defs>
      <rect width="300" height="600" fill="url(#s)"/><circle cx="150" cy="345" r="40" fill="#ffe7a0"/>
      <rect y="350" width="300" height="140" fill="url(#w)"/>
      ${Array.from({ length: 16 }, (_, i) => `<rect x="${(150 - 30 + R() * 60 - i * 1.5).toFixed(0)}" y="${358 + i * 8}" width="${(20 + R() * 40 - i).toFixed(0)}" height="2" fill="#ffe7a0" opacity="${(0.8 - i * 0.04).toFixed(2)}"/>`).join('')}
      <path d="M20 345 h30 v-6 h16 v6 h8 v5 h-54z" fill="#2a2440"/><path d="M228 346 h40 v-5 h10 v5 h6 v4 h-56z" fill="#2a2440"/>
      <path d="M0 490 Q150 470 300 490 V600 H0Z" fill="#e8c890"/><path d="M0 500 Q150 482 300 500" stroke="#fff" stroke-opacity="0.5" fill="none"/>
      <path d="M58 600 C62 540 60 500 70 440" stroke="#2a1a24" stroke-width="7" fill="none"/>
      <path d="M70 440 C50 430 30 438 18 452 M70 440 C90 425 112 430 126 446 M70 440 C60 420 46 408 30 404 M70 440 C84 418 102 410 118 412 M70 440 C72 425 70 410 64 398" stroke="#2a1a24" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      break;
    case 'dunas':
      g = `<defs>${grad('s', [[0, '#050a22'], [0.6, '#14285a'], [1, '#2a4c84']], 1)}</defs>
      <rect width="300" height="600" fill="url(#s)"/>${stars(110, 360, 1)}<circle cx="90" cy="150" r="30" fill="#fbf6e0"/><circle cx="90" cy="150" r="50" fill="#fbf6e0" opacity="0.08"/>
      <path d="M0 380 C60 340 120 350 180 380 C230 404 270 370 300 360 V600 H0Z" fill="#6a6a8a"/>
      <path d="M0 430 C80 390 150 400 210 440 C250 466 280 440 300 430 V600 H0Z" fill="#8a7e8e"/>
      <path d="M0 500 C70 470 140 480 200 510 C240 528 270 515 300 505 V600 H0Z" fill="#a8968e"/>
      <path d="M0 430 C80 390 150 400 210 440" stroke="#d8cfd0" stroke-opacity="0.5" fill="none"/><path d="M0 500 C70 470 140 480 200 510" stroke="#efe2d6" stroke-opacity="0.5" fill="none"/>
      <path d="M232 500 C236 470 238 456 246 440" stroke="#2a2440" stroke-width="3" fill="none"/><path d="M246 440 l-12 4 M246 440 l12 2 M246 440 l-6 -10 M246 440 l8 -9" stroke="#2a2440" stroke-width="2.5" stroke-linecap="round"/>`;
      break;
    default: // 'estrada': rodovia de madrugada com a cidade acesa no horizonte
      g = `<defs>${grad('s', [[0, '#04061a'], [0.5, '#141a46'], [0.78, '#4a2a6a'], [1, '#b8506e']], 1)}${grad('r', [[0, '#151a2c'], [1, '#232a40']], 1)}</defs>
      <rect width="300" height="600" fill="url(#s)"/>${stars(90, 300, 1)}<circle cx="236" cy="110" r="18" fill="#f4efd6"/>
      <path d="M0 362 h18 v-34 h14 v20 h12 v-52 h18 v66 h12 v-28 h20 v30 h16 v-44 h14 v44 h22 v-24 h16 v-60 h20 v84 h14 v-36 h22 v20 h18 v-30 h20 v42 H0Z" fill="#0b1030"/>
      ${lights(80, 300, 360, ['#ffd37a', '#bfe3ff', '#ff9a4a'])}
      <rect y="360" width="300" height="240" fill="#070a16"/>
      <path d="M136 360 H164 L300 600 H0Z" fill="url(#r)"/>
      <path d="M136 360 L0 600 M164 360 L300 600" stroke="#e8e2c0" stroke-opacity="0.55" stroke-width="2"/>
      ${Array.from({ length: 9 }, (_, i) => { const t = i / 9, y = 362 + t * t * 238, h = 4 + t * 26, w = 1 + t * 5; return `<rect x="${(150 - w / 2).toFixed(1)}" y="${y.toFixed(0)}" width="${w.toFixed(1)}" height="${h.toFixed(0)}" fill="#f4c430" opacity="${(0.5 + t * 0.4).toFixed(2)}"/>`; }).join('')}
      <circle cx="144" cy="384" r="1.8" fill="#ff3b3b"/><circle cx="152" cy="384" r="1.8" fill="#ff3b3b"/><circle cx="148" cy="384" r="7" fill="#ff3b3b" opacity="0.15"/>
      <path d="M95 600 L140 470 H160 L205 600Z" fill="#ffe9a0" opacity="0.07"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 600" preserveAspectRatio="xMidYMid slice">${g}</svg>`;
}
function wallURL(id) { if (!_wallCache[id]) _wallCache[id] = 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(wallSVG(id)) + '")'; return _wallCache[id]; }
function phoneCfg() { if (!Profile.phone) Profile.phone = { wall: 'auto', notif: true, sounds: true, lastSave: null }; if (Profile.phone.wall === 'bandeira') Profile.phone.wall = 'estrada'; return Profile.phone; }
function phoneTone(f, d, v, delay) { if (phoneCfg().sounds) AudioSys.tone(f, d, 'sine', v, 'ui', null, delay); }
const PERA_OS = '18.4';

const Phone = {
  app: 'home', fretes: [], fretesT: -1e9, chat: null,
  open(app) {
    ensurePhoneData(); const cfg = phoneCfg();
    if (cfg.wall === 'auto' || !WALLS.some((w) => w.id === cfg.wall)) { let w; do { w = pick(WALLS).id; } while (w === this.wall); this.wall = w; } else this.wall = cfg.wall;
    this.app = app || 'home'; if (Screens.current !== 'screen-phone') Screens.open('screen-phone'); this.render(); phoneTone(1200, 0.05, 0.05);
  },
  go(app) { this.app = app; this.chat = null; if (app !== 'pegaai') { this.pgChat = null; this.pgTab = 'drv'; } if (app === 'aj-update') this.updT = performance.now(); this.render(); if (phoneCfg().sounds) AudioSys.click(); },
  render() {
    const body = $('phone-body'); if (!body) return;
    $('phone-clock').textContent = clockStr();
    const unread = unreadCount();
    const H = (s) => escapeHtml(s);
    let html = '';
    const scr = $('phone-screen'), cfg = phoneCfg();
    if (scr) { scr.style.backgroundImage = wallURL(this.wall || 'penha'); scr.classList.toggle('inapp', this.app !== 'home'); }
    body.classList.toggle('home', this.app === 'home');
    const row = (go, label, val, cls) => `<button class="aj-row${cls ? ' ' + cls : ''}" ${go ? `data-go="${go}"` : ''}><span>${label}</span><em>${val || ''}${go ? '<i class="chev"></i>' : ''}</em></button>`;
    const tog = (k, label) => `<button class="aj-row" data-tog="${k}"><span>${label}</span><i class="ios-tog${(k === 'autoWall' ? cfg.wall === 'auto' : cfg[k]) ? ' on' : ''}"></i></button>`;
    if (this.app === 'home') {
      const W = WALLS.find((w) => w.id === this.wall) || WALLS[0];
      const hr = Math.floor(Profile.time / 60) % 24, temp = Math.round(27 - ((hr + 24 - 19) % 24) * 0.55 - Weather.rain * 4), wl = Weather.label();
      const dest = Act.waypoint ? Act.waypoint.label : null, job = Act.delivery ? Act.delivery.item : Act.ride ? 'Corrida: ' + Act.ride.name : null;
      html = `<div class="ph-lock"><div class="ph-date">São Gambiarra</div><div class="ph-time">${clockStr()}</div></div>` +
        `<div class="ph-widgets"><div class="ph-wid wid-sky${Weather.rain > 0.15 ? ' rain' : ''}"><small>São Gambiarra</small><b>${temp}°</b><span>${wl || (hr >= 19 || hr < 5 ? 'Noite abafada' : 'Céu limpo')}</span><span class="wid-sub">Máx. 31° Mín. 21°</span></div>` +
        `<button class="ph-wid wid-money" data-app="carteira"><small>Carteira</small><b>R$ ${fmtMoney(Profile.money)}</b><span>${Profile.deliveries || 0} entregas · ${Profile.rides || 0} corridas</span><span class="wid-sub">${job ? H(job) : dest ? 'Destino: ' + H(dest) : 'Nenhum serviço ativo'}</span></button></div>` +
        '<div class="ph-grid">' + ['fretes', 'racha', 'carteira', 'conquistas'].concat(CHEATS_ENABLED ? ['trapaca'] : []).map((id) => phIcon(id)).join('') + '</div>' +
        `<div class="ph-wname">${H(W.name)} · ${H(W.place)}</div>` +
        '<div class="ph-dock">' + ['mapa', 'msgs', 'pegaai', 'ajustes'].map((id) => phIcon(id, id === 'msgs' ? unread : id === 'pegaai' ? pgUnread() : 0)).join('') + '</div>';
    } else if (this.app === 'ajustes') {
      html = '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Ajustes</div>' +
        `<div class="aj-group"><div class="aj-prof"><span class="aj-ava">${PERA_LOGO}</span><div><b>Motorista de São Gambiarra</b><small>Pera ID · Nuvem Gambiarra</small></div></div></div>` +
        '<div class="aj-group">' + row('aj-wall', 'Papel de parede', cfg.wall === 'auto' ? 'Variado' : (WALLS.find((w) => w.id === cfg.wall) || WALLS[0]).name) + tog('notif', 'Notificações') + tog('sounds', 'Sons do celular') + '</div>' +
        '<div class="aj-group">' + row('aj-sobre', 'Sobre') + row('aj-update', 'Atualização de Software') + '</div>' +
        `<div class="aj-group"><button class="aj-row aj-save" data-act2="save"><span>Salvar jogo</span></button></div><p class="aj-foot">${cfg.lastSave ? 'Último salvamento às ' + H(cfg.lastSave) + ' (horário do jogo).' : 'O jogo também salva sozinho a cada 30 segundos.'}</p>`;
    } else if (this.app === 'aj-wall') {
      html = '<div class="ph-head"><button class="ph-back" data-go="ajustes">‹</button>Papel de parede</div>' +
        '<div class="aj-group">' + tog('autoWall', 'Variar a cada vez que abrir') + '</div>' +
        '<div class="aj-walls">' + WALLS.map((w) => `<button class="aj-wall${cfg.wall === w.id ? ' sel' : ''}" data-wall="${w.id}"><span style="background-image:${wallURL(w.id).replace(/"/g, "'")}"></span><b>${H(w.name)}</b><small>${H(w.place)}</small></button>`).join('') + '</div>';
    } else if (this.app === 'aj-sobre') {
      const free = 256 - 41 - Math.min(60, Math.floor((Profile.distance || 0) / 90000));
      html = '<div class="ph-head"><button class="ph-back" data-go="ajustes">‹</button>Sobre</div><div class="aj-hero">' + PERA_LOGO + '<b>Pera 15 Pro</b></div>' +
        '<div class="aj-group">' + row(null, 'Nome', 'Pera do Motorista') + row(null, 'Versão do PeraOS', PERA_OS) + row(null, 'Modelo', 'Pera 15 Pro') + row(null, 'Operadora', 'Moqueca Tel 5G') + row(null, 'BR Night Drive', 'v' + GAME_VERSION) + '</div>' +
        '<div class="aj-group">' + row(null, 'Capacidade', '256 GB') + row(null, 'Disponível', free + ' GB') + row(null, 'Apps', '7') + row(null, 'Número de série', 'PR0800SG' + (1000 + ((Profile.earned || 0) % 9000))) + '</div>';
    } else if (this.app === 'aj-update') {
      const chk = performance.now() - (this.updT || 0) < 1600;
      html = '<div class="ph-head"><button class="ph-back" data-go="ajustes">‹</button>Atualização</div><div class="aj-hero big">' + PERA_LOGO +
        (chk ? '<div class="aj-spin"></div><p>Procurando atualização…</p>' : `<b>PeraOS ${PERA_OS}</b><p>Seu Pera está atualizado.</p><small>Instalada automaticamente. Inclui melhorias no app Mapa, no PegaAí e na bateria durante corridas noturnas.</small>`) + '</div>' +
        '<div class="aj-group">' + row(null, 'Atualizações automáticas', 'Ativadas') + '</div>';
      if (chk) setTimeout(() => { if (this.app === 'aj-update' && Screens.current === 'screen-phone') { this.render(); phoneTone(1320, 0.12, 0.05); } }, 1700);
    } else if (this.app === 'mapa') {
      html = `<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Mapa<button class="ph-expand" data-act2="map-full" title="Expandir o mapa em tela cheia"><svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>` +
        '<div class="ph-mapbox"><canvas id="phonemap"></canvas>' + MAP_CTRLS + '</div><div id="ph-map-dests" class="ph-dests"></div>';
    } else if (this.app === 'msgs') {
      const M = Profile.msgs || [];
      const fmtT = (t) => { const v = Math.floor(t || 0) % 1440; return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0'); };
      const ava = (n) => { const ini = n.replace(/\(.*\)/, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(); const hue = Math.floor(hash2(n.length * 13, n.charCodeAt(0) + n.charCodeAt(n.length - 1)) * 360); return `<span class="wa-ava" style="background:hsl(${hue} 45% 42%)">${H(ini)}</span>`; };
      if (this.chat) {
        const conv = M.filter((m) => m.from === this.chat).slice().reverse();
        conv.forEach((m) => { m.read = true; });
        const muted = isMuted(this.chat);
        html = `<div class="wa-top"><button class="ph-back" data-go="msgs">‹</button>${ava(this.chat)}<div class="wa-who"><b>${H(this.chat)}</b><small>${muted ? 'silenciada' : 'online'}</small></div><button class="wa-mute${muted ? ' on' : ''}" data-mute="${H(this.chat)}" title="${muted ? 'Reativar notificações' : 'Silenciar conversa'}"><svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z M10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>${muted ? '<path d="M4 4l16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' : ''}</svg></button></div><div class="wa-chat"><div class="wa-day">HOJE</div>` +
          conv.map((m) => m.voice && Settings.msgMode !== 'texto' ? voiceBubble(m, fmtT) : m.loc ? `<div class="wa-msg wa-locmsg"><button class="wa-loc" data-loc="${m.loc.ev}">${WA_LOC_SVG}<span><b>Localização em tempo real</b>${H(m.loc.label)}<em>Toque para marcar a rota</em></span></button><i>${fmtT(m.t)}</i></div>` : `<div class="wa-msg ${m.me ? 'me' : ''}">${m.title && !m.me ? `<b>${H(m.title)}</b>` : ''}${H(m.body).replace(/\n/g, '<br>')}<i>${fmtT(m.t)}${m.me ? ' <span class="wa-ok">✓✓</span>' : ''}</i></div>`).join('') +
          '</div>';
        // só dá para responder a última mensagem do contato, se ela pedir resposta e ainda não foi respondida
        const lastIn = M.find((m) => m.from === this.chat);
        if (this.chat === ZE && Game.mode === 'play') html += socorroBar(H);
        else if (lastIn && !lastIn.me && lastIn.rep && !lastIn.answered) html += '<div class="wa-quick">' + lastIn.rep.map(([q], i) => `<button data-reply="${i}">${H(q)}</button>`).join('') + '</div>';
        else html += '<div class="wa-bar">' + (conv.some((m) => m.me || m.answered) ? 'Você já respondeu esta conversa' : 'Mensagem informativa · não precisa responder') + '</div>';
      } else {
        const order = [], last = {}, unread = {};
        for (const m of M) { if (!(m.from in last)) { last[m.from] = m; order.push(m.from); } if (!m.read && !m.me) unread[m.from] = (unread[m.from] || 0) + 1; }
        html = '<div class="wa-head"><button class="ph-back" data-go="home">‹</button><b>Conversas</b></div>' +
          (order.length ? order.map((n) => { const m = last[n], u = unread[n]; return `<button class="wa-row${isMuted(n) ? ' muted' : ''}" data-chat="${H(n)}">${ava(n)}<div class="wa-mid"><b>${H(n)}${isMuted(n) ? '<svg class="wa-mi" viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM4 4l16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' : ''}</b><span>${m.me ? '<em>Você:</em> ' : ''}${m.voice && Settings.msgMode !== 'texto' ? '<b class="wa-mic">Mensagem de voz</b> (0:' + String(Math.round(m.voice.dur)).padStart(2, '0') + ')' : H((m.me ? m.body : m.title || m.body).slice(0, 60))}</span></div><div class="wa-side"><small class="${u ? 'new' : ''}">${fmtT(m.t)}</small>${u ? `<i>${u}</i>` : ''}</div></button>`; }).join('') : '<p class="ph-empty">Nenhuma conversa.</p>');
      }
    } else if (this.app === 'pegaai' && (this.pgTab === 'msgs' || this.pgChat)) {
      const n = pgUnread();
      if (this.pgChat && pgFind(this.pgChat)) html = pgChatHTML(pgFind(this.pgChat));
      else html = `<div class="ph-head"><button class="ph-back" data-go="home">‹</button>PegaAí Motorista</div><div class="ph-tabs"><button data-pgtab="drv">Motorista</button><button class="on" data-pgtab="msgs">Mensagens${n ? ' (' + n + ')' : ''}</button></div>` + pgListHTML();
    } else if (this.app === 'pegaai') {
      const ok = canDriveRides(), C = career(), tier = ratingTier(), need = C.lvl >= LEVEL_MAX ? 1 : xpNeed(C.lvl);
      const R = Act.ride, rt = R ? RIDE_TYPES[R.type || 'comum'] : null;
      const nU = pgUnread();
      html = `<div class="ph-head"><button class="ph-back" data-go="home">‹</button>PegaAí Motorista</div><div class="ph-tabs"><button class="on" data-pgtab="drv">Motorista</button><button data-pgtab="msgs">Mensagens${nU ? ' (' + nU + ')' : ''}</button></div>` +
        `<div class="pg-hero"><div class="pg-lvl"><b>${C.lvl}</b><small>NÍVEL</small></div><div class="pg-info"><b>${H(levelTitle(C.lvl))}</b><div class="pg-bar"><i style="width:${C.lvl >= LEVEL_MAX ? 100 : Math.round(C.xp / need * 100)}%"></i></div><small>${C.lvl >= LEVEL_MAX ? 'Nível máximo!' : C.xp + ' / ' + need + ' XP'}</small></div></div>` +
        `<div class="pg-rate"><span style="color:${tier[1]}">${tier[0]}</span><b>${career().ratings.length ? fmtRating(recentRating()) : '–'} ★</b><small>${Profile.rides || 0} corridas · nota das últimas ${Math.min(30, career().ratings.length)}</small></div>` +
        (R ? `<div class="ph-card"><div class="ph-big">${H(rt.name)}</div><p><b>${H(R.name)}</b><br>${R.stage === 'pickup' ? 'Buscar em ' + H(R.pick.name) : 'Levar até ' + H(R.dest.name)}<br>R$ ${R.fare}</p></div>` : '') +
        (ok ? `<button class="ph-btn ${Act.rideOnline ? 'off' : ''}" data-act2="ride-toggle">${Act.rideOnline ? 'Ficar offline' : 'Ficar online'}</button>` : '<p class="ph-empty">Caminhão não roda no PegaAí. Use um carro de passeio ou a picape.</p>') +
        '<p class="pg-sec">CATEGORIAS QUE VOCÊ ACEITA</p>' + Object.entries(RIDE_TYPES).map(([id, T]) => { const why = rideTypeCheck(id), on = C.acc[id] !== false; return `<button class="pg-cat${why ? ' locked' : ''}${on && !why ? ' on' : ''}" data-rcat="${id}"><span><b>${H(T.name)}</b><small>${why ? H(why) : H(T.desc)}</small></span><em>${why ? '<svg viewBox="0 0 24 24" class="pg-lock"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>' : on ? 'ON' : 'OFF'}</em></button>`; }).join('') +
        '<p class="ph-note">Nota alta e nível alto liberam corridas que pagam mais. Batida e demora derrubam a nota, e cliente mal atendido manda áudio.</p>';
    } else if (this.app === 'fretes') {
      const job = player.car.job;
      html = '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Fretes</div>';
      if (!job) html += '<p class="ph-empty">Seu veículo não faz fretes. Compre um veículo de trabalho na garagem: o mais barato é a Salvêro do Peão (R$ 3.500). Também tem caminhão de gás, guincho, caçamba, baú e tanque.</p>';
      else if (Act.delivery) html += `<div class="ph-card"><div class="ph-big">${H(Act.delivery.item)}</div><p>${Act.delivery.stage === 'pickup' ? 'Buscar em ' + H(Act.delivery.pick ? Act.delivery.pick.name : '') : 'Entregar em ' + H(Act.delivery.dest.name)}<br>R$ ${fmtMoney(Act.delivery.reward)}</p></div><button class="ph-btn off" data-act2="job-cancel">Cancelar frete</button>`;
      else {
        if (Game.time - this.fretesT > 60 || !this.fretes.length || this.fretes[0].type !== job) { this.fretes = [genJob(job), genJob(job), genJob(job)]; this.fretesT = Game.time; }
        html += `<p class="ph-note">${H(JOB_TYPES[job].name)} · ${H(player.car.name)}</p>` + this.fretes.map((f, i) => `<button class="ph-row" data-job="${i}"><b>${H(f.item)} · R$ ${fmtMoney(f.reward)}</b><span>${H(f.pick.name)} → ${H(f.dest.name)} · ${(f.len * 0.09 / 1000).toFixed(1).replace('.', ',')} km</span></button>`).join('');
      }
    } else if (this.app === 'racha') {
      const open = rachaOpen();
      html = '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Racha</div>' + (open ? '<p class="ph-note">Madrugada liberada. Vá até o ponto e aperte E. Quem ganhar leva o dobro da aposta. Se uma viatura chegar perto, é multa e aposta perdida.</p>' : '<p class="ph-empty">Os rachas só rolam de madrugada, das 22h às 4h30. Agora são ' + clockStr() + '.</p>') +
        World.rachas.map((r, i) => `<button class="ph-row" data-racha="${i}"><b>${H(r.name)} · aposta R$ ${fmtMoney(r.bet)}</b><span>contra ${H(r.rival)} (${fmtTime(r.rivalTime)}) · toque para marcar no GPS</span></button>`).join('');
    } else if (this.app === 'trapaca' && CHEATS_ENABLED) {
      const btn = (k, v, label, on) => `<button class="ch-btn${on ? ' on' : ''}" data-cheat="${k}" data-cv="${v}">${label}</button>`;
      html = '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Trapaças</div><p class="ph-note">App temporário de testes.</p>' +
        '<div class="ch-sec">Dinheiro e carro</div><div class="ch-grid">' + btn('money', 0, '+R$ 10.000') + btn('fix', 0, 'Consertar e encher') + btn('cars', 0, 'Liberar veículos') + btn('pois', 0, 'Revelar pontos') + btn('god', 0, 'Indestrutível', Cheats.god) + btn('turbo', 0, 'Turbo', Cheats.turbo) + '</div>' +
        '<div class="ch-sec">Horário</div><div class="ch-grid">' + btn('time', 19 * 60 + 40, '19:40') + btn('time', 22 * 60 + 5, '22:05 (racha)') + btn('time', 26 * 60, '02:00') + btn('time', 28 * 60 + 40, '04:40') + '</div>' +
        '<div class="ch-sec">Clima</div><div class="ch-grid">' + btn('wx', 'limpo', 'Limpo', Settings.weather === 'limpo') + btn('wx', 'garoa', 'Garoa') + btn('wx', 'chuva', 'Temporal', Settings.weather === 'chuva') + btn('wx', 'auto', 'Dinâmico', Settings.weather === 'auto') + '</div>' +
        (POLICE_ENABLED ? '<div class="ch-sec">Polícia</div><div class="ch-grid">' + btn('police', 1, '★') + btn('police', 2, '★★') + btn('police', 3, '★★★') + btn('police', 0, 'Limpar') + '</div>' : '') +
        '<div class="ch-sec">Eventos</div><div class="ch-grid">' + Object.keys(EV_NAMES).map((k) => btn('ev', k, H(EV_NAMES[k]))).join('') + '</div>' +
        '<div class="ch-sec">Vida do carro</div><div class="ch-grid">' + btn('wear', 15, 'Gastar tudo (15%)') + btn('wear', 0, 'Zerar tudo') + btn('wear', 100, 'Tudo novo') + '</div>' +
        '<div class="ch-sec">Teleporte</div><div class="ch-grid">' + CHEAT_PLACES.map(([n], i) => btn('tp', i, H(n))).join('') + btn('tpgps', 0, 'Destino do GPS') + '</div>';
    } else if (this.app === 'conquistas') {
      const A = Profile.ach || {}, done = ACHIEVEMENTS.filter((a) => A[a.id]).length;
      const fmtV = (a, v) => a.money ? 'R$ ' + fmtMoney(Math.floor(v)) : (a.unit === ' km' || a.unit === ' s' ? v.toFixed(1).replace('.', ',') : Math.floor(v)) + (a.unit || '');
      html = '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Conquistas</div>' +
        `<div class="ach-top"><b>${done}/${ACHIEVEMENTS.length}</b><span>desbloqueadas</span><div class="ach-bar"><i style="width:${(done / ACHIEVEMENTS.length * 100).toFixed(0)}%"></i></div></div>` +
        ACHIEVEMENTS.slice().sort((x, y) => (!!A[y.id]) - (!!A[x.id])).map((a) => {
          const g = Achievements.goal(a), v = Math.min(a.val(), g), ok = !!A[a.id];
          const ico = ok ? '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 24 24"><rect x="6" y="11" width="12" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
          return `<div class="ach${ok ? ' ok' : ''}"><span class="ach-ico">${ico}</span><div class="ach-mid"><b>${H(a.name)}</b><small>${H(a.desc)}</small>` +
            (ok ? `<em>Desbloqueada às ${H(A[a.id])} · +R$ ${fmtMoney(a.prize)}</em>` : `<div class="ach-bar sm"><i style="width:${(v / g * 100).toFixed(0)}%"></i></div><em>${fmtV(a, v)} de ${fmtV(a, g)} · prêmio R$ ${fmtMoney(a.prize)}</em>`) + '</div></div>';
        }).join('');
    } else if (this.app === 'carteira') {
      html = `<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Carteira</div>` + walletHTML(this.wtab);
    }
    body.innerHTML = html;
    if (this.app === 'mapa') { phoneMap = new MapView($('phonemap'), MapState.phone); renderMapDests(); requestAnimationFrame(() => phoneMap && phoneMap.draw()); } else phoneMap = null;
    if (this.chat) { const ch = body.querySelector('.wa-chat'); if (ch) body.scrollTop = body.scrollHeight; }
  },
  click(e) {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.app) { this.go(t.dataset.app); return; }
    if (t.dataset.mz) { if (phoneMap) mapCtrl(phoneMap, t.dataset.mz); return; }
    if (t.dataset.sos) { if (t.dataset.sos === 'cancel') socorroCancel(); else socorroCall(t.dataset.sos); phoneTone(1760, 0.05, 0.04); this.render(); return; }
    if (t.dataset.mute) {
      const n = t.dataset.mute; Profile.muted = Profile.muted || {};
      if (Profile.muted[n]) delete Profile.muted[n]; else Profile.muted[n] = true;
      toast(Profile.muted[n] ? 'Conversa silenciada' : 'Notificações reativadas', n, 'info'); phoneTone(900, 0.04, 0.05); this.render(); return;
    }
    if (t.dataset.wtab) { this.wtab = t.dataset.wtab; phoneTone(900, 0.04, 0.05); this.render(); return; }
    if (t.dataset.lamt) { this.loanAmt = +t.dataset.lamt; phoneTone(900, 0.04, 0.05); this.render(); return; }
    if (t.dataset.loan) { if (takeLoan(this.loanAmt || 1000, +t.dataset.loan)) { phoneTone(1760, 0.06, 0.05); this.render(); } return; }
    if (t.dataset.pgtab) { this.pgTab = t.dataset.pgtab; this.pgChat = null; phoneTone(900, 0.04, 0.05); this.render(); return; }
    if (t.dataset.pgchat) { this.pgChat = t.dataset.pgchat; AudioSys.click(); this.render(); return; }
    if (t.dataset.pgback) { this.pgChat = null; this.pgTab = 'msgs'; AudioSys.back(); this.render(); return; }
    if (t.dataset.pgq && Act.ride) { const R = Act.ride; pgMsg(R, PG_QUICK[+t.dataset.pgq], null, true); phoneTone(1760, 0.05, 0.04); setTimeout(() => { if (Act.ride === R) pgMsg(R, pick(PG_ANS)); }, rnd(1500, 3000)); return; }
    if (t.dataset.rcat) { const id = t.dataset.rcat; if (!rideTypeCheck(id) && id !== 'comum') { career().acc[id] = career().acc[id] === false; phoneTone(900, 0.04, 0.05); this.render(); } return; }
    if (t.dataset.vid) { const m = (Profile.msgs || []).concat(...pgChats().map((c) => c.msgs)).find((x) => x.vid === t.dataset.vid); if (m && m.voice) { if (VoicePlayer.msg === m) VoicePlayer.stop(); else VoicePlayer.play(m); } return; }
    if (t.dataset.loc) { Events.acceptLoc(+t.dataset.loc); return; }
    if (t.dataset.chat) { this.chat = t.dataset.chat; this.render(); if (phoneCfg().sounds) AudioSys.click(); return; }
    if (t.dataset.reply && this.chat) {
      const who = this.chat, src = Profile.msgs.find((m) => m.from === who);
      if (!src || !src.rep || src.answered) return;
      const [q, ans] = src.rep[+t.dataset.reply] || [];
      if (!q) return;
      src.answered = true;
      Profile.msgs.unshift({ from: who, title: '', body: q, read: true, me: true, t: Math.floor(Profile.time) });
      phoneTone(1760, 0.05, 0.04); this.render();
      if (src.act) Events.onReply(src.act, +t.dataset.reply);
      if (ans) setTimeout(() => { addMsg(who, '', ans, true); if (Screens.current === 'screen-phone' && Phone.chat === who) { phoneTone(1320, 0.06, 0.05); Phone.render(); } }, 1800);
      return;
    }
    if (t.dataset.go) { this.go(t.dataset.go); return; }
    if (t.dataset.job) { const j = this.fretes[+t.dataset.job]; if (j && !Act.delivery && !Act.race) { startJob(j); this.fretes = []; Screens.closeAll(); } return; }
    if (t.dataset.racha) { const r = World.rachas[+t.dataset.racha]; Act.waypoint = { x: r.start[0], y: r.start[1], label: 'Racha: ' + r.name }; Act.gpsT = 0; AudioSys.click(); toast('Ponto do racha no GPS', r.name, 'info'); Screens.closeAll(); return; }
    if (t.dataset.tog) {
      const cfg = phoneCfg(), k = t.dataset.tog;
      if (k === 'autoWall') cfg.wall = cfg.wall === 'auto' ? this.wall : 'auto'; else cfg[k] = !cfg[k];
      phoneTone(900, 0.04, 0.05); this.render(); return;
    }
    if (t.dataset.wall) { phoneCfg().wall = this.wall = t.dataset.wall; phoneTone(1100, 0.05, 0.05); this.render(); return; }
    const a = t.dataset.act2;
    if (t.dataset.cheat && CHEATS_ENABLED) { cheatDo(t.dataset.cheat, t.dataset.cv); return; }
    if (a === 'map-full') { Object.assign(MapState.full, MapState.phone); Screens.open('screen-map'); AudioSys.click(); return; }
    if (a === 'save') { saveGame(); phoneCfg().lastSave = clockStr(); writeProfile(); AudioSys.chime(); toast('Jogo salvo', 'Progresso, dinheiro e carros guardados neste navegador.', 'good'); this.render(); return; }
    if (a === 'ride-toggle') { Act.rideOnline = !Act.rideOnline; Act.rideT = rnd(3, 6); if (!Act.rideOnline) Act.ride = null; AudioSys.click(); this.render(); }
    if (a === 'job-cancel') { Act.delivery = null; toast('Frete cancelado', '', 'bad'); AudioSys.back(); this.render(); }
  },
};

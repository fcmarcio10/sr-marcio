
/* ============================ EVENTOS ALEATÓRIOS PELA CIDADE ============================
   Coisas que aparecem do nada enquanto você dirige: carro quebrado, noivo atrasado, carreta de
   banana tombada, blitz da Lei Seca, festa junina fechando a rua e carona na BR.
   Um evento por vez. Cada um dura de 1 a 3 minutos e paga um bônus. */
const EV_NAMES = {
  quebrado: 'Carro quebrado', noivo: 'Noivo atrasado', banana: 'Carreta de banana tombada',
  blitz: 'Blitz da Lei Seca', festa: 'Festa junina na rua', carona: 'Carona na BR',
};
const EV_DRIVERS = ['Seu Valdir', 'Dona Rosângela', 'Cleiton', 'Jéssica', 'Seu Arlindo', 'Tia Nice', 'Wellington', 'Dona Zilda'];
// cada noivo tem a sua noiva fixa; quem já casou com a sua ajuda não aparece de novo
const EV_CASAIS = [['Robson', 'Kátia'], ['Uelinton', 'Suelen'], ['Marquinhos', 'Jaqueline'], ['Jefferson', 'Rayane'], ['Dudu', 'Débora'],
  ['Cleberson', 'Thayná'], ['Washington', 'Gleice'], ['Juninho', 'Patrícia'], ['Edinho', 'Karol'], ['Maicon', 'Vanessa'], ['Tiago', 'Elaine'], ['Rodrigo', 'Fabiana']];
// eventos que chegam como convite (aceitar ou recusar); banana vai pelo zap e blitz é só aviso
const EV_OFFER = { quebrado: 1, noivo: 1, festa: 1, carona: 1 };
const EV_OFFER_T = 20;
const EV_CARONAS = [
  { name: 'Romeiro Tião', col: '#e8e2d0', pants: '#5a4a3a', lines: ['"Tô indo pagar promessa no Convento. Subo a ladeira de joelho!"', '"Moço, já rezei três terços nessa BR."', '"Se Nossa Senhora quiser, o senhor ganha uma bênção extra."'], bye: '"Deus lhe pague, meu filho. Vou rezar pelo seu carro, que tá precisando."' },
  { name: 'Surfista Kauã', col: '#29b6c9', pants: '#f2a03a', lines: ['"Mano, o mar em Camburiso tá flat, mas a resenha tá boa."', '"Já pegou onda em Guarapariu? Lá é outro nível, brother."', '"Esse carro tem lugar pra prancha? Não? Tranquilo, tô de boa."'], bye: '"Valeu, brother! Aloha capixaba!"' },
  { name: 'Seu Geraldo do Queijo', col: '#7a8a3a', pants: '#3a3a2e', lines: ['"Esse queijo aqui é de Domingos Martelo, curado no capricho."', '"Quer provar? Não, né, tá dirigindo. Mais tarde."', '"Minas tem queijo, mas o daqui da serra é melhor. Fala baixo."'], bye: '"Deixei um pedaço de queijo no banco de trás. Presente!"' },
  { name: 'Mochileiro Hans', col: '#d8452e', pants: '#2b3a55', lines: ['"Ô, Vitorinha é por aqui? Eu fala português pouquinho."', '"Moqueca capixaba é a melhor do mundo. Eu provou três vez."', '"Aqui todo mundo fala \'uai, sô\'? Não? Só \'é nóis\'?"'], bye: '"Obrigado, amigo! Muito tchau!"' },
  { name: 'Vó Cotinha', col: '#c46bb0', pants: '#4a3a5a', lines: ['"Meu filho, tô atrasada pro bingo da paróquia!"', '"No meu tempo isso aqui era tudo mato, sabia?"', '"Você é casado? Tenho uma neta solteira, viu?"'], bye: '"Brigada, meu querido. Toma aqui uma bala de coco."' },
];
const EV_NOIVO_FALAS = ['"Ela vai me matar! Acelera, pelo amor de Deus!"', '"Tô suando nesse terno. Liga o ar, por favor!"', '"Se eu chegar atrasado, a sogra nunca mais me perdoa."', '"O padre já mandou três mensagens. TRÊS!"', '"Cuidado com o buraco, que a aliança tá no bolso!"'];
const BIU = 'Seu Biu (Bananas)';
const BIU_NAO = [
  'Tudo bem, eu entendo. Vou ficar aqui sozinho, no escuro, abraçado num cacho de banana. Se o macaco do zoológico fugir, já sabe onde me achar.',
  'Beleza. Vou ligar pro meu cunhado então. Ele tem uma Brasília sem freio e zero noção da vida. Se ele tombar também, a culpa é sua.',
  'Tá bom. Vou fazer vitamina de banana pra cidade inteira então. Dois mil litros. E você não vai ganhar nem um copinho.',
  'Sem problema. Vou chamar o pessoal da igreja. Se o pastor perguntar, eu falo que você tava "ocupado". Com aspas, viu?',
];
const BIU_DEPOIS = [
  'Atualização: o guincho chegou, pisou numa casca e TOMBOU TAMBÉM. Agora são dois veículos deitados na pista. Obrigado por nada, viu? kkkkkk',
  'Atualização: o povo do bairro levou tudo. Fizeram bolo de banana, banana frita, doce de banana... e não sobrou nem a casca pra mim.',
  'Notícia boa: um caminhão de açaí parou pra ajudar. Notícia ruim: bateu na minha carreta. A BR virou a maior tigela de açaí com banana do Brasil.',
  'Meu cunhado veio. Tombou. Agora eu tenho uma carreta de banana e uma Brasília de cabeça pra baixo. Tô montando uma barraca aqui mesmo, passa pra comprar.',
];
const EV_FESTA_ITENS = [['milho verde', 'mercado'], ['gelo pro quentão', 'mercado'], ['fubá da canjica', 'padaria'], ['rojão', 'mercado']];

const Events = {
  cur: null, spawnT: 75, cols: [], closed: [], slow: null,
  reset() {
    this.clear(); this.spawnT = rnd(60, 100);
    // limpa do zap as conversas antigas de noivo e de carro quebrado (agora esses eventos não mandam mensagem)
    if (Profile.msgs) Profile.msgs = Profile.msgs.filter((m) => !/ \(noivo\)$/.test(m.from) && !/^Oi, aqui é .*, do carro quebrado\./.test(m.body || ''));
  },
  clear() {
    if (Offer.E) Offer.hide();
    for (const c of this.cols) c.dead = true;
    this.cols.length = 0;
    for (const e of this.closed) e.closed = false;
    this.closed.length = 0;
    this.slow = null; this.cur = null;
  },
  busy() { return !!(Act.delivery || Act.ride || Act.race); },
};

/* ---------- utilidades ---------- */
function evPos(e, s, off) { return [e.a.x + e.dx * s - e.dy * off, e.a.y + e.dy * s + e.dx * off]; }
function evCirc(x, y, r) { const c = addCircCol(x, y, r, 'event'); Events.cols.push(c); return c; }
function evRect(x0, y0, x1, y1) { const c = addRectCol(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1), 'event'); Events.cols.push(c); return c; }
// fecha a rua para o trânsito: ninguém mais entra e quem estava fora da tela some
function evCloseEdge(e) {
  e.closed = true; Events.closed.push(e);
  const v = Cam.view;
  for (const c of Traffic.cars) {
    const vis = c.x > v.x0 - 80 && c.x < v.x1 + 80 && c.y > v.y0 - 80 && c.y < v.y1 + 80;
    if (c.state === 'edge' && c.e === e && !vis) { c.release(); c.dead = true; }
    else if (c.next && c.next.e === e && !c.committed) c.chooseNext();
  }
  Traffic.cars = Traffic.cars.filter((c) => !c.dead);
}
function evPerson(col, pants, seed, extra) {
  return Object.assign({ type: 'person', a: Math.PI / 2, v: 0, phase: 0, seed, col, skin: pick(['#c68642', '#8d5524', '#e0ac69', '#f1c27d', '#6b4226']), hair: pick(['#1a1410', '#3b2a1a', '#6b6b6b', '#2a1c10']), pants, state: 'idle' }, extra || {});
}
// escolhe um ponto de rua perto de você, de preferência à frente e fora da tela
function evFindSpot(filter, dmin, dmax, margin) {
  const hx = Math.cos(player.a), hy = Math.sin(player.a), v = Cam.view;
  let best = null, bs = -1e9;
  for (let k = 0; k < 220; k++) {
    const e = World.edges[(Math.random() * World.edges.length) | 0];
    if (e.closed || e.bridge || !filter(e)) continue;
    const lo = (e.clearA || 0) + margin, hi = e.len - (e.clearB || 0) - margin;
    if (hi - lo < 20) continue;
    const s = rnd(lo, hi), p = evPos(e, s, 0);
    const d = Math.hypot(p[0] - player.x, p[1] - player.y);
    if (d < dmin || d > dmax) continue;
    if (p[0] > v.x0 - 140 && p[0] < v.x1 + 140 && p[1] > v.y0 - 140 && p[1] < v.y1 + 140) continue;
    if (groundAt(p[0], p[1]) === SF.WATER) continue;
    const sc = ((p[0] - player.x) * hx + (p[1] - player.y) * hy) / d + rnd(0, 0.7);
    if (sc > bs) { bs = sc; best = { e, s, x: p[0], y: p[1] }; }
  }
  return best;
}
function evCurbOff(e) { return e.T.shoulder ? e.hw + 5 : e.T.sw ? e.hw - 4 : e.hw - 6; }
function evWalkOff(e) { return e.hw + (e.T.sw ? e.T.sw * 0.5 : (e.T.shoulder || 0) + 8); }
function evRegion(x, y) { const R = REGIONS[regionKeyAt(x, y)]; return R ? R.name : 'São Gambiarra'; }
function evPlaceName(e, x, y) { return (e.name ? e.name + ', ' : '') + evRegion(x, y); }
function evNearShop(kinds, x, y, dmin) {
  let best = null, bd = 1e18;
  for (const s of World.shops) { if (!kinds.includes(s.kind)) continue; const d = Math.hypot(s.x - x, s.y - y); if (d > (dmin || 0) && d < bd) { bd = d; best = s; } }
  return best;
}
function evChurches() {
  const out = [];
  for (const b of World.buildings) {
    const isC = b.style === 'church' || b.sign === 'IGREJA DA FÉ';
    if (!isC) continue;
    const ne = nearestEdge(b.cx, b.y1 + 30), p = evPos(ne.e, ne.s, 0);
    const name = b.sign === 'IGREJA DA FÉ' ? 'Igreja da Fé' : b.x0 > 7800 && b.y0 < 900 ? 'Convento da Pena' : 'Igreja Matriz';
    if (!out.some((o) => Math.hypot(o.x - p[0], o.y - p[1]) < 200)) out.push({ x: p[0], y: p[1], name: name + ' (' + evRegion(p[0], p[1]) + ')' });
  }
  return out;
}
function evStat(type) { Profile.evDone = Profile.evDone || {}; Profile.evDone[type] = (Profile.evDone[type] || 0) + 1; Profile.evTotal = (Profile.evTotal || 0) + 1; }
function evSay(who, line) { toast(who, line, 'info'); }

/* ---------- criação ---------- */
Events.spawn = function (type) {
  if (!player) return false;
  const builders = { quebrado: evMakeQuebrado, noivo: evMakeNoivo, banana: evMakeBanana, blitz: evMakeBlitz, festa: evMakeFesta, carona: evMakeCarona };
  const E = builders[type]();
  if (!E) return false;
  E.type = type; E.t = 0; E.stage = E.stage || 'wait'; E.life = E.life || rnd(120, 170);
  E.id = this.idc = (this.idc || 0) + 1;
  this.cur = E;
  if (E.invite) { E.invite(); return true; }
  AudioSys.tone(784, 0.09, 'triangle', 0.07, 'ui'); AudioSys.tone(1175, 0.14, 'triangle', 0.07, 'ui', null, 0.11);
  if (EV_OFFER[type]) { E.stage = 'offer'; E.offerT = EV_OFFER_T; Offer.show(E); return true; }
  toast('Evento: ' + EV_NAMES[type], E.intro, 'info');
  return true;
};

/* ---------- convite: janelinha no canto que não pausa o jogo ---------- */
const EV_OFFER_TXT = {
  quebrado: (E) => [E.who + ' está com o carro parado e pediu ajuda.', { bateria: 'Bateria arriada', pneu: 'Pneu furado', gasolina: 'Acabou a gasolina' }[E.kind]],
  noivo: (E) => ['O noivo ' + E.nome + ' tá atrasado pro casamento com a ' + E.noiva + '.', 'Levar até a igreja correndo'],
  festa: () => ['A Dona Fátima do arraiá precisa de uma mão.', 'Buscar o que acabou na festa'],
  carona: (E) => [E.C.name + ' tá pedindo carona na beira da estrada.', 'Levar até ' + E.dest.name.split(' · ')[0]],
};
const Offer = { el: null, E: null };
Offer.show = function (E) {
  this.E = E;
  const el = this.el || (this.el = $('ev-offer'));
  if (!el) return;
  const t = EV_OFFER_TXT[E.type](E);
  const d = Math.round(Math.hypot((E.pick || E).x - player.x, (E.pick || E).y - player.y) * 0.09);
  el.querySelector('.evo-title').textContent = EV_NAMES[E.type];
  el.querySelector('.evo-text').textContent = t[0];
  el.querySelector('.evo-meta').textContent = t[1] + ' · ' + (d > 1000 ? (d / 1000).toFixed(1).replace('.', ',') + ' km' : d + ' m') + ' daqui';
  el.querySelector('.evo-bar i').style.width = '100%';
  el.classList.remove('hidden', 'out');
};
Offer.hide = function () { this.E = null; if (this.el) { this.el.classList.add('out'); const el = this.el; setTimeout(() => { if (!Offer.E) el.classList.add('hidden'); }, 260); } };
Offer.tick = function (E) { if (this.el && this.E === E) this.el.querySelector('.evo-bar i').style.width = Math.max(0, E.offerT / EV_OFFER_T * 100).toFixed(1) + '%'; };
// sim = true aceita, false recusa; vem da tecla (Y/N) ou do clique
Events.answerOffer = function (yes) {
  const E = this.cur; if (!E || E.over || E.stage !== 'offer') return false;
  Offer.hide();
  if (yes) {
    E.stage = 'wait'; E.life = E.t + Math.max(110, E.life - E.t); Act.gpsT = 0;
    AudioSys.chime();
    toast('Ajuda aceita', E.intro.replace(/ Siga o ponto rosa no mapa\.$/, '') + ' Siga o ponto rosa no mapa.', 'good');
  } else {
    E.over = true; E.endT = 0; E.ok = false; E.refused = true; E.target = null; Act.gpsT = 0;
    AudioSys.click();
  }
  return true;
};
function evMakeQuebrado() {
  const P = evFindSpot((e) => e.T.id !== 'highway' && e.len > 260, 520, 1300, 90); if (!P) return null;
  const off = evCurbOff(P.e), dir = chance(0.5) ? 1 : -1;
  const p = evPos(P.e, P.s, off * dir), a = Math.atan2(P.e.dy * dir, P.e.dx * dir);
  const model = pick(['quadrado', 'besouro', 'escada', 'santana', 'hatch', 'van']), m = VMODELS[model];
  const ca = Math.cos(a), sa = Math.sin(a);
  const pw = evPos(P.e, P.s + dir * 22, (evWalkOff(P.e)) * dir);
  const cols = [-m.L / 2 + m.W / 2, m.L / 2 - m.W / 2].map((k) => evCirc(p[0] + ca * k, p[1] + sa * k, m.W / 2));
  const kind = pick(['bateria', 'pneu', 'gasolina']);
  const who = pick(EV_DRIVERS);
  const E = { x: p[0], y: p[1], a, model, color: pick(CAR_COLORS), kind, who, edge: P.e, npc: evPerson(pick(['#2e86de', '#c0392b', '#27ae60', '#f1c40f', '#e67e22']), '#2b3a55', Math.random(), { x: pw[0], y: pw[1], dance: true }),
    tri: [p[0] - ca * (m.L / 2 + 40), p[1] - sa * (m.L / 2 + 40)], smoke: kind === 'bateria' ? 0 : -1, hold: 0, cols };
  E.intro = who + ' está com o carro parado em ' + evPlaceName(P.e, p[0], p[1]) + '. Siga o ponto rosa no mapa.';
  return E;
}
function evMakeNoivo() {
  const ch = evChurches(); if (!ch.length) return null;
  const P = evFindSpot((e) => e.T.id === 'street' || e.T.id === 'avenue', 500, 1200, 60); if (!P) return null;
  const dir = chance(0.5) ? 1 : -1, w = evPos(P.e, P.s, evWalkOff(P.e) * dir), r = evPos(P.e, P.s, (P.e.T.lanes[P.e.T.lanes.length - 1]) * dir);
  const far = ch.filter((c) => { const d = Math.hypot(c.x - r[0], c.y - r[1]); return d > 1100 && d < 4200; });
  const dest = pick(far.length ? far : ch);
  Profile.evCasados = Profile.evCasados || [];
  let livres = EV_CASAIS.filter((c) => !Profile.evCasados.includes(c[0]));
  if (!livres.length) { Profile.evCasados = []; livres = EV_CASAIS; }
  const [nome, noiva] = pick(livres);
  const E = { x: w[0], y: w[1], pick: { x: r[0], y: r[1] }, dest, nome, noiva, edge: P.e, npc: evPerson('#17171c', '#17171c', Math.random(), { x: w[0], y: w[1], dance: true, hair: '#1a1410' }), talkT: 6, hits: 0 };
  E.intro = 'O noivo ' + nome + ' tá desesperado na calçada em ' + evPlaceName(P.e, w[0], w[1]) + '. O casamento com ' + noiva + ' já vai começar!';
  return E;
}
function evMakeBanana() {
  const P = evFindSpot((e) => (e.T.id === 'highway' || e.T.id === 'road' || e.T.id === 'avenue') && e.len > 520, 800, 2400, 200); if (!P) return null;
  const e = P.e, side = chance(0.5) ? 1 : -1, ra = Math.atan2(e.dy, e.dx);
  const center = evPos(e, P.s, e.T.lanes.length > 1 ? 44 * side : 0);
  const a = ra + side * rnd(0.45, 0.75) + (chance(0.5) ? Math.PI : 0);
  const ca = Math.cos(a), sa = Math.sin(a);
  for (let k = -48; k <= 48; k += 16) evCirc(center[0] + ca * k, center[1] + sa * k, 15);
  evCloseEdge(e);
  const crates = [], peels = [];
  for (let i = 0; i < 9; i++) { const ss = P.s + rnd(-180, 180), q = evPos(e, ss, rnd(-e.hw + 12, e.hw - 12)); if (Math.hypot(q[0] - center[0], q[1] - center[1]) < 60) { i--; continue; } crates.push({ x: q[0], y: q[1], a: rnd(TAU), got: false }); }
  for (let i = 0; i < 26; i++) { const q = evPos(e, P.s + rnd(-150, 150), rnd(-e.hw + 6, e.hw - 6)); peels.push({ x: q[0], y: q[1], a: rnd(TAU) }); }
  const cw = evPos(e, P.s - 70, evWalkOff(e));
  const E = { x: center[0], y: center[1], a, edge: e, crates, peels, got: 0, npc: evPerson('#f1c40f', '#3a3a2e', Math.random(), { x: cw[0], y: cw[1], dance: true, hair: '#6b6b6b' }), life: rnd(150, 180) };
  E.intro = 'A carreta de banana do Seu Biu tombou em ' + evPlaceName(e, center[0], center[1]) + '. Cuidado com as cascas, escorrega!';
  E.stage = 'invite'; E.passive = true; E.place = evPlaceName(e, center[0], center[1]);
  E.invite = () => {
    charVoice('biu_socorro');
    const m = addMsg(BIU, 'SOCORRO, PELO AMOR DE DEUS', 'Ô meu patrão, aqui é o Biu, das bananas! Minha carreta TOMBOU na ' + E.place + '. Tá banana pra todo lado, parece feira depois de terremoto. Dá uma força pra recolher as caixas? Pago cada uma, e ainda dou um agrado no final!', false,
      [['Tô indo aí, Biu!', 'Deus te pague, meu filho! Tô aqui sentado em cima de três toneladas de nanica, igual rei da selva. Vou mandar a localização: clica nela que aparece o caminho.'], ['Hoje não, Biu', pick(BIU_NAO)]]);
    m.act = 'biu:' + E.id;
  };
  return E;
}
function evMakeBlitz() {
  // de preferência no caminho do GPS; senão numa avenida ou rua perto
  let P = null;
  if (Act.gps && Act.gps.pts.length > 2) {
    let acc = 0; const pts = Act.gps.pts;
    for (let i = 1; i < pts.length && !P; i++) {
      acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc > 650) { const ne = nearestEdge(pts[i][0], pts[i][1]); if ((ne.e.T.id === 'avenue' || ne.e.T.id === 'street') && ne.s > 140 && ne.s < ne.e.len - 140) P = { e: ne.e, s: ne.s }; }
      if (acc > 1600) break;
    }
  }
  if (!P) P = evFindSpot((e) => (e.T.id === 'avenue' || e.T.id === 'street') && e.len > 380, 550, 1200, 140);
  if (!P) return null;
  const e = P.e, dir = chance(0.5) ? 1 : -1, a = Math.atan2(e.dy * dir, e.dx * dir), off = evCurbOff(e);
  const ca = Math.cos(a), sa = Math.sin(a);
  const cars = [];
  for (const ds of [30, 92]) { const p = evPos(e, P.s + ds * dir, off * dir); cars.push({ x: p[0], y: p[1], a: a + 0.06 }); const m = VMODELS.police; for (const k of [-m.L / 2 + m.W / 2, m.L / 2 - m.W / 2]) evCirc(p[0] + ca * k, p[1] + sa * k, m.W / 2); }
  const laneOff = e.T.lanes[e.T.lanes.length - 1];
  const cones = [];
  for (let i = 0; i < 6; i++) { const p = evPos(e, P.s - (70 + i * 26) * dir, (off - (off - laneOff - 14) * (1 - i / 6)) * dir); cones.push({ x: p[0], y: p[1], down: 0, a: 0 }); }
  const o = evPos(e, P.s - 12 * dir, (laneOff + 26) * dir);
  const E = { x: o[0], y: o[1], a, dir, edge: e, cars, cones, ofc: evPerson('#d8ff3a', '#1f2a44', Math.random(), { x: o[0], y: o[1], a: a + Math.PI, hair: '#1a1410' }), ofc2: evPerson('#d8ff3a', '#1f2a44', Math.random(), { x: cars[1].x + ca * 30 - sa * 10 * dir, y: cars[1].y + sa * 30 + ca * 10 * dir, a: a + Math.PI / 2, dance: true }), hold: 0, lastU: null, life: rnd(150, 180) };
  Events.slow = { x: o[0], y: o[1], r: 190 };
  E.passive = true;
  E.intro = 'Tem blitz da Lei Seca em ' + evPlaceName(e, o[0], o[1]) + '. Passou por lá, pare ao lado do guarda.';
  return E;
}
function evMakeFesta() {
  const P = evFindSpot((e) => e.T.id === 'street' && e.len > 420 && !REGIONS[regionKeyAt(e.a.x, e.a.y)].rural, 600, 1400, 170); if (!P) return null;
  const e = P.e, half = 130, s0 = P.s - half, s1 = P.s + half;
  evCloseEdge(e);
  const W = e.hw + (e.T.sw || 0);
  const bar = (s) => { const a = evPos(e, s, -W), b = evPos(e, s, W); evRect(a[0] - (e.h ? 4 : 0), a[1] - (e.h ? 0 : 4), b[0] + (e.h ? 4 : 0), b[1] + (e.h ? 0 : 4)); return [a, b]; };
  const bars = [bar(s0), bar(s1)];
  const c = evPos(e, P.s, 0); evCirc(c[0], c[1], 14);
  const dancers = [];
  const ROUPA = ['#c0392b', '#2e86de', '#f1c40f', '#e67e22', '#8e44ad', '#27ae60', '#ff6fa5', '#e8e8e8'];
  for (let i = 0; i < 10; i++) dancers.push(evPerson(ROUPA[i % ROUPA.length], i % 2 ? '#3a5a8a' : '#6a4a2a', Math.random(), { dance: true, ph: i / 10 * TAU }));
  const stalls = [[evPos(e, P.s - 70, -(e.hw + 4)), 'PAMONHA', '#ffd23a'], [evPos(e, P.s + 60, e.hw + 4), 'QUENTÃO', '#ff6b3d'], [evPos(e, P.s + 10, -(e.hw + 4)), 'CANJICA', '#ff9ed2']];
  const item = pick(EV_FESTA_ITENS);
  const ent = [evPos(e, s0 - 40, 0), evPos(e, s1 + 40, 0)];
  const E = { x: c[0], y: c[1], edge: e, s0, s1, sMid: P.s, bars, dancers, stalls, item, ent, org: evPerson('#ff6fa5', '#3a2a4a', Math.random(), { x: ent[0][0], y: ent[0][1], dance: true }), life: rnd(160, 190) };
  E.intro = 'Arraiá fechou a rua em ' + evPlaceName(e, c[0], c[1]) + '. Tem quadrilha, fogueira e a organizadora tá precisando de ajuda!';
  return E;
}
function evMakeCarona() {
  const P = evFindSpot((e) => e.T.id === 'highway' || (e.T.id === 'road' && chance(0.4)), 500, 1300, 80);
  if (!P) return null;
  const dir = chance(0.5) ? 1 : -1, w = evPos(P.e, P.s, (P.e.hw + (P.e.T.shoulder || 0) + 9) * dir), r = evPos(P.e, P.s, (P.e.hw - 4) * dir);
  const C = pick(EV_CARONAS);
  const pool = World.homes.concat(World.shops.map((s) => ({ x: s.x, y: s.y, name: s.name }))).filter((h) => { const d = Math.hypot(h.x - w[0], h.y - w[1]); return d > 1800 && d < 4600 && regionKeyAt(h.x, h.y) !== regionKeyAt(w[0], w[1]); });
  if (!pool.length) return null;
  const ds = pick(pool), dest = { x: ds.x, y: ds.y, name: ds.name + ' · ' + evRegion(ds.x, ds.y) };
  const E = { x: w[0], y: w[1], a: Math.atan2(P.e.dy * dir, P.e.dx * dir), dir, pick: { x: r[0], y: r[1] }, dest, C, edge: P.e, npc: evPerson(C.col, C.pants, Math.random(), { x: w[0], y: w[1], a: Math.atan2(P.e.dy * dir, P.e.dx * dir) + Math.PI }), talkT: 8, hits: 0, sign: evRegion(ds.x, ds.y).split(' ')[0].toUpperCase() };
  E.intro = C.name + ' tá pedindo carona no acostamento da ' + (P.e.name || 'BR') + '. Para lá e leva!';
  return E;
}

/* ---------- interação e lógica por quadro ---------- */
Events.gpsTarget = function () {
  const E = this.cur; if (!E || E.over) return null;
  if (E.stage === 'wait' && !E.passive) return { x: E.pick ? E.pick.x : E.x, y: E.pick ? E.pick.y : E.y, kind: 'event' };
  if (E.target) return { x: E.target.x, y: E.target.y, kind: 'event' };
  return null;
};
Events.onReply = function (act, idx) {
  const [kind, id] = String(act).split(':'), E = this.cur;
  if (kind !== 'biu') return;
  const alive = E && E.id === +id && !E.over;
  if (idx === 0) {
    if (!alive) { setTimeout(() => addMsg(BIU, '', 'Ih, já resolveram aqui, meu filho. Mas valeu a intenção!', true), 2600); return; }
    E.stage = 'accepted'; E.life = Math.max(E.life, E.t + 120);
    setTimeout(() => {
      const C = this.cur; if (!C || C.id !== +id || C.over) return;
      const m = addMsg(BIU, '', 'Localização em tempo real', false);
      m.loc = { ev: +id, label: 'Carreta do Biu · ' + C.place };
      if (Screens.current === 'screen-phone' && Phone.chat === BIU) Phone.render();
    }, 4200);
  } else {
    if (alive) { E.refused = true; E.over = true; E.endT = 0; E.ok = false; }
    setTimeout(() => addMsg(BIU, '', pick(BIU_DEPOIS), false), rnd(35000, 60000));
  }
};
Events.acceptLoc = function (id) {
  const E = this.cur;
  if (!E || E.id !== id || E.over) { toast('Localização expirada', 'Essa carreta já foi resolvida.', 'info'); AudioSys.error(); return; }
  if (E.stage === 'collect') { Screens.closeAll(); return; }
  E.stage = 'go'; E.passive = false; E.target = { x: E.x, y: E.y, name: 'Carreta do Seu Biu' }; E.life = Math.max(E.life, E.t + 240);
  Act.gpsT = 0; Screens.closeAll(); AudioSys.chime();
  toast('Rota marcada', 'Siga o GPS até a carreta do Seu Biu.', 'good');
};
Events.onImpact = function (imp) {
  const E = this.cur; if (!E || imp < 110) return;
  if (E.type === 'noivo' && E.stage === 'drive') { E.hits++; evSay(E.nome, pick(['"O TERNO! Amassou o terno!"', '"Pelo amor de Deus, a aliança!"', '"Se eu chegar com olho roxo, a noiva desiste!"'])); }
  if (E.type === 'carona' && E.stage === 'drive') { E.hits++; evSay(E.C.name, pick(FALAS_BATIDA)); }
};
Events.slipAt = function (x, y) {
  const E = this.cur; if (!E || E.type !== 'banana') return 0;
  if (Math.abs(x - E.x) > 260 || Math.abs(y - E.y) > 260) return 0;
  for (const p of E.peels) if (Math.abs(p.x - x) < 13 && Math.abs(p.y - y) < 13) return 0.62;
  return 0;
};
Events.slowAt = function (x, y) { const s = this.slow; return !!(s && Math.abs(x - s.x) < s.r && Math.abs(y - s.y) < s.r); };
Events.blocksAhead = function (car, check) {
  const E = this.cur; if (!E || !E.edge || car.state !== 'edge' || car.e !== E.edge) return;
  if (E.type === 'banana') check(E, E.x, E.y, 70, 70);
  else if (E.type === 'festa') for (const b of E.bars) { const m = [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2]; check(E, m[0], m[1], 10, 400); }
};
function evFinish(E, ok, title, text, money) {
  E.over = true; E.endT = 0; E.target = null; E.ok = ok;
  if (money > 0) { pay(money, title); if (text) setTimeout(() => toast(title, text, 'good'), 900); }
  else if (money < 0) { pay(money, title); if (text) setTimeout(() => toast(title, text, 'bad'), 900); }
  else toast(title, text, ok ? 'good' : 'bad');
  if (ok) evStat(E.type);
  Act.gpsT = 0;
  saveGame();
}
Events.update = function (dt) {
  if (!player) return;
  const busy = this.busy();
  // sorteio de um evento novo
  if (!this.cur) {
    const tutOn = Profile.tut !== undefined && Profile.tut < TUT_STEPS.length;
    if (!Act.race && !Socorro.job && !tutOn) this.spawnT -= dt;
    if (this.spawnT <= 0) {
      // só 40% das vezes rola um evento (60% menos que antes)
      if (!chance(0.4)) { this.spawnT = rnd(90, 160); return; }
      const types = busy ? ['blitz', 'banana', 'festa'] : ['quebrado', 'noivo', 'banana', 'blitz', 'festa', 'carona'];
      const last = this.lastType;
      const opts = types.filter((t) => t !== last);
      let ok = false;
      for (let i = 0; i < 4 && !ok; i++) { const t = pick(opts); ok = this.spawn(t); if (ok) this.lastType = t; }
      this.spawnT = ok ? rnd(90, 160) : 20;
    }
    return;
  }
  const E = this.cur, p = player, sp = p.speed;
  E.t += dt;
  const dP = Math.hypot(E.x - p.x, E.y - p.y);
  // terminou: limpa quando sai de perto ou depois de um tempo
  if (E.over) {
    E.endT += dt;
    if (E.leave) evDriveAway(E, dt);
    if (E.type === 'festa') evFestaAnim(E, dt);
    const ex = E.carX !== undefined ? E.carX : E.x, ey = E.carY !== undefined ? E.carY : E.y;
    const v = Cam.view, vis = ex > v.x0 - 200 && ex < v.x1 + 200 && ey > v.y0 - 200 && ey < v.y1 + 200;
    if ((E.endT > 6 && !vis) || E.endT > 40) this.clear();
    return;
  }
  // ignorou: expira
  // convite na tela: corre só com o jogo na tela; se ignorar, conta como recusado
  if (E.stage === 'offer') {
    if (!Screens.current) E.offerT -= dt;
    Offer.tick(E);
    if (E.offerT <= 0) { this.answerOffer(false); return; }
  }
  const engaged = !['offer', 'wait', 'invite', 'accepted'].includes(E.stage);
  if ((!engaged && (E.t > E.life || (dP > 3800 && E.t > 25 && E.type !== 'banana'))) || (E.type === 'banana' && E.t > E.life)) {
    if (E.type === 'banana' && !E.got) {
      const m = (Profile.msgs || []).find((x) => x.from === BIU);
      addMsg(BIU, '', m && m.read && !m.answered ? 'Visualizou e não respondeu, né? Tá bom. O guincho já veio. Mas fiquei magoado, viu? Magoado igual banana que caiu do cacho.' : 'Já resolveram aqui, o guincho veio. Se cuida aí, meu filho!', true);
    }
    toast('Evento encerrado', EV_NAMES[E.type] + ': ' + (E.type === 'blitz' ? 'a blitz foi desmontada.' : E.type === 'festa' ? 'o arraiá acabou.' : E.type === 'banana' ? 'o guincho levou a carreta.' : 'outra pessoa ajudou.'), 'info');
    E.over = true; E.endT = 0; E.ok = false; Act.gpsT = 0;
    if (E.type === 'quebrado') { E.leave = { v: 0 }; }
    return;
  }
  const canPrompt = !Act.prompt && sp < 70 && !Screens.current;
  const prompt = (text, act) => { if (canPrompt) Act.prompt = { text, act }; };
  const busyMsg = () => toast('Termine o serviço atual', 'Você já está com uma corrida ou entrega. Finalize primeiro.', 'bad');
  switch (E.type) {
    case 'quebrado': evQuebrado(E, dt, prompt, busy, busyMsg); break;
    case 'noivo': evNoivo(E, dt, prompt, busy, busyMsg); break;
    case 'banana': evBanana(E, dt); break;
    case 'blitz': evBlitz(E, dt); break;
    case 'festa': evFesta(E, dt, prompt, busy, busyMsg); break;
    case 'carona': evCarona(E, dt, prompt, busy, busyMsg); break;
  }
  // animação dos NPCs
  for (const n of [E.npc, E.ofc, E.ofc2, E.org]) if (n) n.phase += dt * 6;
};
function evDriveAway(E, dt) {
  const L = E.leave;
  if (!L.pts) {
    const ne = nearestEdge(E.x, E.y), e = ne.e, dir = Math.cos(E.a) * e.dx + Math.sin(E.a) * e.dy >= 0 ? 1 : -1;
    const end = dir > 0 ? e.b : e.a;
    const nx = end.edges.filter((x) => x !== e && !x.closed);
    const ne2 = nx.length ? pick(nx) : e, far = ne2.a === end ? ne2.b : ne2.a;
    const lane = e.T.lanes[0] * dir, q0 = evPos(e, clamp(ne.s + dir * 60, 0, e.len), lane);
    L.pts = [q0, [end.x - e.dy * lane, end.y + e.dx * lane], [far.x, far.y]]; L.ri = 0;
    L.x = E.x; L.y = E.y; L.a = E.a; L.v = 0; L.state = 'leaving';
  }
  if (E.endT < 1.5) return;
  const J = { x: L.x, y: L.y, a: L.a, v: L.v, pts: L.pts, ri: L.ri, state: 'x' };
  socorroDrive(J, 230, dt);
  L.x = J.x; L.y = J.y; L.a = J.a; L.v = J.v; L.ri = J.ri;
  E.carX = L.x; E.carY = L.y; E.carA = L.a;
  if (E.cols) { for (const c of E.cols) c.dead = true; E.cols = null; }
}
function evQuebrado(E, dt, prompt, busy, busyMsg) {
  const p = player, sp = p.speed, d = Math.hypot(E.x - p.x, E.y - p.y);
  if (E.smoke >= 0 && nearView(E.x, E.y, 80) && chance(dt * 3)) Particles.emit('smoke', E.x + Math.cos(E.a) * 16, E.y + Math.sin(E.a) * 16, rnd(-8, 8), rnd(-20, -8), rnd(1, 2), 7);
  if (E.stage === 'wait') {
    if (d < 95) {
      const txt = { bateria: 'Ajudar ' + E.who + ': chupeta na bateria', pneu: 'Ajudar ' + E.who + ': trocar o pneu furado', gasolina: 'Ajudar ' + E.who + ': ficou sem gasolina' }[E.kind];
      prompt(txt, () => {
        if (E.kind === 'gasolina') {
          if (busy) return busyMsg();
          const s = evNearShop(['posto'], E.x, E.y, 0); if (!s) return;
          E.stage = 'fetch'; E.target = { x: s.x, y: s.y, name: s.name }; Act.gpsT = 0;
          evSay(E.who, '"Graças a Deus! Busca um galão de gasolina no ' + s.name + ' pra mim? Eu pago a gasolina e mais um agrado."');
        } else { E.stage = 'fix'; E.hold = 0; evSay(E.who, E.kind === 'bateria' ? '"Encosta o carro aqui pertinho que a gente faz a chupeta!"' : '"O macaco tá no porta-malas. Me ajuda a trocar?"'); }
        AudioSys.click();
      });
    }
  } else if (E.stage === 'fix') {
    if (d < 110 && sp < 12) {
      E.hold += dt;
      if (Math.floor(E.hold * 2.5) !== Math.floor((E.hold - dt) * 2.5)) { AudioSys.wrench(); if (E.kind === 'bateria') for (let i = 0; i < 4; i++) Particles.emit('spark', E.x + Math.cos(E.a) * 18, E.y + Math.sin(E.a) * 18, rnd(-90, 90), rnd(-90, 90), rnd(0.15, 0.3), 2); }
      if (E.hold >= 5) {
        E.smoke = -1; E.leave = { v: 0 };
        const v = Math.round(rnd(90, 150) / 5) * 5;
        AudioSys.tone(220, 0.25, 'sawtooth', 0.05, 'engine'); AudioSys.aiHorn(40, 'dupla', 0);
        evFinish(E, true, 'Motorista salvo!', E.who + ': "Pegou! Deus te abençoe, toma aqui pela ajuda."', v);
      }
    } else if (d > 160) { E.hold = Math.max(0, E.hold - dt); }
  } else if (E.stage === 'fetch') {
    const T = E.target;
    if (Math.hypot(T.x - p.x, T.y - p.y) < 90 && sp < 40) { E.stage = 'back'; E.target = { x: E.x, y: E.y, name: E.who }; Act.gpsT = 0; AudioSys.pump(); toast('Galão cheio!', 'Leve a gasolina até ' + E.who + '.', 'good'); }
  } else if (E.stage === 'back') {
    if (d < 95 && sp < 30) {
      E.smoke = -1; E.leave = { v: 0 };
      evFinish(E, true, 'Gasolina entregue!', E.who + ': "Salvou minha noite! Toma, pela gasolina e pela viagem."', Math.round(rnd(160, 220) / 5) * 5);
    }
  }
}
function evNoivo(E, dt, prompt, busy, busyMsg) {
  const p = player, sp = p.speed;
  if (E.stage === 'wait') {
    if (Math.hypot(E.pick.x - p.x, E.pick.y - p.y) < 85) prompt('Levar o noivo ' + E.nome + ' até a ' + E.dest.name.split(' (')[0], () => {
      if (busy) return busyMsg();
      const len = routeLen(E.pick, E.dest);
      E.stage = 'drive'; E.tmax = len / 215 + 22; E.left = E.tmax; E.target = E.dest; E.len = len; Act.gpsT = 0;
      E.npc = null; AudioSys.thud();
      evSay(E.nome, '"Me leva na ' + E.dest.name + '! A ' + E.noiva + ' já tá no altar, rápido!"');
    });
  } else if (E.stage === 'drive') {
    E.left -= dt; E.talkT -= dt;
    if (E.talkT <= 0) { E.talkT = rnd(11, 16); evSay(E.nome, E.left < 15 ? '"Faltam ' + Math.max(0, Math.ceil(E.left)) + ' segundos! Voa, motorista!"' : pick(EV_NOIVO_FALAS)); }
    if (Math.hypot(E.dest.x - p.x, E.dest.y - p.y) < 90 && sp < 45) {
      const v = clamp(Math.round((260 + E.left * 6 - E.hits * 35) / 5) * 5, 80, 450);
      AudioSys.chime();
      evFinish(E, true, 'Chegou a tempo! O noivo casou', E.nome + ' saiu correndo pro altar. ' + (E.hits ? 'O terno chegou meio amassado, mas deu certo.' : 'Terno impecável!'), v);
      Profile.evCasados = (Profile.evCasados || []).concat(E.nome);
      // o recado de agradecimento aparece na tela (não vai pro WhatsApp)
      setTimeout(() => toast(E.nome + ' e ' + E.noiva + ' casaram!', pick(['"CASEI, BICHO! Ela disse sim! Você agora é padrinho honorário!"', '"Deu tudo certo! A ' + E.noiva + ' mandou guardar um pedaço de bolo pra você!"', '"O padre disse que nunca viu noivo chegar tão rápido. Valeu demais!"']), 'good'), 14000);
    } else if (E.left <= 0) {
      AudioSys.error();
      evFinish(E, false, 'Atrasou!', E.nome + ': "A ' + E.noiva + ' achou que eu tinha fugido e foi embora com o padrinho!" Sem pagamento dessa vez.', 0);
    }
  }
}
function evBanana(E, dt) {
  const p = player, sp = p.speed;
  if (E.stage !== 'collect' && Math.hypot(E.x - p.x, E.y - p.y) < 300) { E.stage = 'collect'; E.target = null; E.life = Math.max(E.life, E.t + 150); evSay('Seu Biu', '"Ó você aí! Passa devagar por cima das caixas que eu pago cada uma!"'); }
  if (E.stage === 'collect') {
    for (const c of E.crates) {
      if (c.got || Math.abs(c.x - p.x) > 24 || Math.abs(c.y - p.y) > 24) continue;
      if (Math.hypot(c.x - p.x, c.y - p.y) < 20) {
        if (sp > 140) { if (!c.warn) { c.warn = 1; toast('Devagar!', 'Passe mais devagar por cima da caixa pra pegar.', 'info'); } continue; }
        c.got = true; E.got++; E.stage = 'collect';
        AudioSys.tone(880 + E.got * 60, 0.08, 'triangle', 0.08, 'ui'); pay(15, null);
        if (E.got === E.crates.length) { E.passive = true; evFinish(E, true, 'Bananas recolhidas!', 'Seu Biu: "Valeu demais! Leva esse cacho pra casa, é da boa!"', 120); setTimeout(() => addMsg(BIU, '', 'Chegou tudo inteiro no Ceasa! Só faltou uma caixa que o guarda comeu. Você é meu herói, patrão. Qualquer coisa que precisar de banana, é só falar.', false), 20000); return; }
        toast('Caixa de banana ' + E.got + '/' + E.crates.length, '+ R$ 15', 'good');
      }
    }
  }
}
function evBlitz(E, dt) {
  const p = player, sp = p.speed;
  for (const c of E.cones) {
    if (c.down) continue;
    if (Math.hypot(c.x - p.x, c.y - p.y) < 14 && sp > 40) { c.down = 1; c.a = Math.atan2(p.vy, p.vx); c.x += p.vx * 0.05; c.y += p.vy * 0.05; AudioSys.thud(); }
  }
  const ux = Math.cos(E.a), uy = Math.sin(E.a);
  const rx = p.x - E.x, ry = p.y - E.y, u = rx * ux + ry * uy, l = Math.abs(-rx * uy + ry * ux);
  const near = Math.hypot(rx, ry);
  if (near < 520 && E.stage === 'wait') { E.stage = 'near'; E.passive = true; }
  if (E.stage === 'near') {
    if (near < 85 && sp < 10) {
      E.hold += dt;
      if (E.hold > 0.3 && !E.greet) { E.greet = true; evSay('Agente da Lei Seca', '"Boa noite. Documento do veículo e habilitação, por favor. Agora sopra aqui no bafômetro."'); AudioSys.tone(1600, 0.25, 'sine', 0.05, 'ui'); }
      if (E.hold >= 3.2) {
        const lamp = typeof playerLamp === 'function' ? Math.min(playerLamp(1), playerLamp(-1)) : 1;
        if (Profile.damage > 75 || lamp < 0.15) evFinish(E, true, 'Bafômetro: 0,00 mg/L', 'Mas o ' + (lamp < 0.15 ? 'farol queimado' : 'carro caindo aos pedaços') + ' rendeu uma advertência. Conserta isso aí, hein!', 0);
        else evFinish(E, true, 'Bafômetro: 0,00 mg/L — motorista exemplar!', 'A Zé Seguros deu um bônus de motorista consciente.', Math.round(rnd(70, 110) / 5) * 5);
        E.stage = 'done';
      }
    } else if (near > 120) E.hold = 0;
    // furou a blitz: passou pelo guarda direto e rápido
    const jump = E.lastP ? Math.hypot(p.x - E.lastP[0], p.y - E.lastP[1]) : 0;
    if (E.lastU !== null && jump < 40 && Math.sign(u) !== Math.sign(E.lastU) && l < E.edge.hw + 30 && sp > 45 && E.hold < 3) {
      const fine = Math.min(250, Math.max(0, Math.floor(Profile.money)));
      AudioSys.tone(2900, 0.12, 'square', 0.06, 'ui'); AudioSys.tone(2900, 0.3, 'square', 0.06, 'ui', null, 0.16);
      Cam.flash = 0.4;
      evFinish(E, false, 'Furou a blitz!', 'O agente anotou a placa: multa por não parar na fiscalização.', fine ? -fine : 0);
      E.stage = 'done';
    }
  }
  E.lastU = u; E.lastP = [p.x, p.y];
}
function evFesta(E, dt, prompt, busy, busyMsg) {
  const p = player, sp = p.speed;
  // organizadora fica na entrada mais perto de você
  const k = Math.hypot(E.ent[0][0] - p.x, E.ent[0][1] - p.y) < Math.hypot(E.ent[1][0] - p.x, E.ent[1][1] - p.y) ? 0 : 1;
  if (E.stage === 'wait') {
    const off = evWalkOff(E.edge) - 8, w = evPos(E.edge, k ? E.s1 + 20 : E.s0 - 20, off);
    E.org.x = w[0]; E.org.y = w[1];
    if (Math.hypot(E.ent[k][0] - p.x, E.ent[k][1] - p.y) < 120) prompt('Falar com Dona Fátima, a organizadora do arraiá', () => {
      if (busy) return busyMsg();
      const s = evNearShop([E.item[1], 'mercado', 'padaria'], E.x, E.y, 350); if (!s) return;
      E.stage = 'fetch'; E.target = { x: s.x, y: s.y, name: s.name }; E.k = k; Act.gpsT = 0;
      evSay('Dona Fátima', '"Ô, meu anjo! Acabou o ' + E.item[0] + '! Busca lá no ' + s.name + ' pra gente? O arraiá não pode parar!"');
      AudioSys.click();
    });
  } else if (E.stage === 'fetch') {
    if (Math.hypot(E.target.x - p.x, E.target.y - p.y) < 90 && sp < 40) { const q = E.ent[E.k]; E.stage = 'back'; E.target = { x: q[0], y: q[1], name: 'Arraiá' }; Act.gpsT = 0; AudioSys.thud(); toast('Carregado!', 'Leve o ' + E.item[0] + ' de volta pro arraiá.', 'good'); }
  } else if (E.stage === 'back') {
    if (Math.hypot(E.target.x - p.x, E.target.y - p.y) < 110 && sp < 40) {
      AudioSys.chime();
      for (let i = 0; i < 18; i++) Particles.emit('spark', E.x + rnd(-30, 30), E.y + rnd(-30, 30), rnd(-160, 160), rnd(-220, -40), rnd(0.4, 0.9), 2.5);
      evFinish(E, true, 'O arraiá foi salvo!', 'Dona Fátima: "Arriba, saia! Toma um prato de canjica e o seu agrado."', Math.round(rnd(170, 230) / 5) * 5);
      E.party = true;
    }
  }
  evFestaAnim(E, dt);
}
function evFestaAnim(E, dt) {
  const p = player;
  if (!nearView(E.x, E.y, 260)) { festaMusic(E, dt, p); return; } // fora da tela: só a música de longe (nada se mexe à toa)
  festaMusic(E, dt, p);
  // a quadrilha gira em volta da fogueira
  const t = Game.time * (E.party ? 1.1 : 0.55);
  E.dancers.forEach((d, i) => { const r = 44 + (i % 2) * 14, a2 = d.ph + t * (i % 2 ? -1 : 1); d.x = E.x + Math.cos(a2) * r; d.y = E.y + Math.sin(a2) * r * 0.8; d.a = a2 + Math.PI / 2; });
  if (chance(dt * 6)) Particles.emit('flame', E.x + rnd(-6, 6), E.y + rnd(-4, 4), rnd(-10, 10), rnd(-40, -20), rnd(0.3, 0.6), 4);
}
// forró baixinho quando você está perto (toca mesmo sem a festa aparecer na tela)
function festaMusic(E, dt, p) {
  E.musT = (E.musT || 0) - dt;
  if (E.musT <= 0 && Math.hypot(E.x - p.x, E.y - p.y) < 600 && AudioSys.ok) {
    E.musT = 1.6;
    const vol = 0.035 * clamp(1 - Math.hypot(E.x - p.x, E.y - p.y) / 600, 0, 1);
    const N = pick([[392, 494, 587, 494], [440, 523, 659, 523], [349, 440, 523, 440]]);
    N.forEach((f, i) => { AudioSys.tone(f, 0.18, 'triangle', vol, 'ui', null, i * 0.2); AudioSys.tone(f / 2, 0.1, 'square', vol * 0.5, 'ui', null, i * 0.4); });
    AudioSys.noise(0.05, 3000, 1, vol * 0.8, 'ui', 'highpass', 0.1); AudioSys.noise(0.05, 3000, 1, vol * 0.8, 'ui', 'highpass', 0.9);
  }
}
function evCarona(E, dt, prompt, busy, busyMsg) {
  const p = player, sp = p.speed;
  if (E.stage === 'wait') {
    if (Math.hypot(E.pick.x - p.x, E.pick.y - p.y) < 90) prompt('Dar carona para ' + E.C.name, () => {
      if (busy) return busyMsg();
      E.len = routeLen(E.pick, E.dest);
      E.stage = 'drive'; E.target = E.dest; E.fare = Math.round((45 + E.len * 0.055) / 5) * 5; Act.gpsT = 0;
      E.npc = null; AudioSys.thud();
      evSay(E.C.name, '"Opa, valeu! Tô indo pra ' + E.dest.name + '."');
    });
  } else if (E.stage === 'drive') {
    E.talkT -= dt;
    if (E.talkT <= 0) { E.talkT = rnd(14, 20); evSay(E.C.name, E.C.lines[(E.li = ((E.li || 0) + 1)) % E.C.lines.length]); }
    if (Math.hypot(E.dest.x - p.x, E.dest.y - p.y) < 90 && sp < 40) {
      const tip = E.hits ? 0 : Math.round(E.fare * 0.3 / 5) * 5;
      AudioSys.chime();
      evFinish(E, true, 'Carona entregue' + (tip ? ' (com gorjeta)' : ''), E.C.name + ': ' + E.C.bye, E.fare + tip);
    }
  }
}

/* ---------- interface ---------- */
Events.hud = function () {
  const E = this.cur; if (!E || E.over) return null;
  const p = player, dist = (q) => { const d = Math.round((Act.gps && Act.gpsTarget && Act.gpsTarget.kind === 'event' ? Act.gps.len : Math.hypot(q.x - p.x, q.y - p.y)) * 0.09); return d > 1000 ? (d / 1000).toFixed(1).replace('.', ',') + ' km' : d + ' m'; };
  if (E.stage === 'offer') return null;
  const left = Math.max(0, Math.ceil(E.life - E.t));
  const t = EV_NAMES[E.type];
  if (E.type === 'banana' && E.stage === 'invite') return [t, 'O Seu Biu mandou mensagem no zap. Abra o celular (Q).', 'some em ' + fmtTime(left).replace(/\.\d$/, '')];
  if (E.type === 'banana' && E.stage === 'accepted') return [t, 'Toque na localização que o Seu Biu mandou no zap.', 'Q · Mensagens'];
  if (E.type === 'banana' && E.stage === 'go') return [t, 'Ir até a carreta do Seu Biu', dist(E)];
  if (E.stage === 'wait') {
    const where = { x: E.pick ? E.pick.x : E.x, y: E.pick ? E.pick.y : E.y };
    const desc = E.type === 'quebrado' ? E.who + ' precisa de ajuda. Pare ao lado e aperte E.' : E.type === 'noivo' ? 'O noivo ' + E.nome + ' precisa chegar na igreja. Pare ao lado dele.' : E.type === 'banana' ? 'Recolha as caixas de banana espalhadas. Cuidado com as cascas!' : E.type === 'blitz' ? 'Se passar por lá, pare ao lado do guarda.' : E.type === 'festa' ? 'Fale com a organizadora na entrada do arraiá.' : E.C.name + ' pede carona no acostamento.';
    return [t, desc, dist(where) + ' · some em ' + fmtTime(left).replace(/\.\d$/, '')];
  }
  switch (E.type) {
    case 'quebrado': return E.stage === 'fix' ? [t, 'Fique parado ao lado do carro…', Math.min(100, Math.round(E.hold / 5 * 100)) + '%'] : E.stage === 'fetch' ? [t, 'Buscar gasolina em ' + E.target.name, dist(E.target)] : [t, 'Levar o galão até ' + E.who, dist(E.target)];
    case 'noivo': return ['Noivo atrasado: ' + E.nome, 'Levar até a ' + E.dest.name, dist(E.dest) + ' · ' + (E.left > 0 ? 'faltam ' + fmtTime(E.left).replace(/\.\d$/, '') : 'atrasado!')];
    case 'banana': return [t, 'Passe devagar por cima das caixas de banana.', E.got + '/' + E.crates.length + ' caixas · R$ 15 cada'];
    case 'blitz': return [t, E.hold > 0 ? 'Fiscalização em andamento… fique parado.' : 'Pare ao lado do guarda de colete verde.', dist(E)];
    case 'festa': return ['Arraiá: falta ' + E.item[0], E.stage === 'fetch' ? 'Buscar em ' + E.target.name : 'Levar de volta pro arraiá', dist(E.target)];
    case 'carona': return ['Carona: ' + E.C.name, 'Levar até ' + E.dest.name, dist(E.dest) + ' · R$ ' + E.fare];
  }
  return null;
};

/* ---------- desenho ---------- */
function evDrawCrate(ctx, c) {
  ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-7, -5, 16, 13);
  ctx.fillStyle = '#9a6a3a'; ctx.fillRect(-8, -6, 16, 12);
  ctx.strokeStyle = '#6a4424'; ctx.lineWidth = 1; ctx.strokeRect(-8, -6, 16, 12); ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
  ctx.fillStyle = '#f2d23a'; for (const [x, y] of [[-4, -3], [1, -3], [-2, 3], [4, 2]]) { ctx.beginPath(); ctx.ellipse(x, y, 3, 1.4, 0.5, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function evDrawTruck(ctx, E) {
  ctx.save(); ctx.translate(E.x, E.y); ctx.rotate(E.a);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(-56, -14, 116, 34);
  // eixos e rodas (o fundo da carreta virou para o lado)
  ctx.fillStyle = '#1b1b1e'; ctx.fillRect(-50, 12, 98, 4);
  for (const x of [-40, -28, 22, 34, 44]) { ctx.fillStyle = '#121214'; ctx.fillRect(x - 5, 13, 10, 8); ctx.fillStyle = '#4a4a50'; ctx.fillRect(x - 2, 15, 4, 4); }
  // lateral da carreta (agora virada para cima)
  ctx.fillStyle = '#e9cf4a'; ctx.fillRect(-52, -15, 88, 28);
  ctx.fillStyle = '#c9ae2e'; for (let x = -48; x < 34; x += 10) ctx.fillRect(x, -15, 2, 28);
  ctx.fillStyle = '#2e7d32'; ctx.fillRect(-52, -2, 88, 3);
  ctx.save(); ctx.scale(1, 1); ctx.fillStyle = '#1e3a1e'; ctx.font = 'italic 900 9px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BANANAS DO BIU', -8, -8); ctx.restore();
  // cabine torta
  ctx.save(); ctx.translate(46, 0); ctx.rotate(0.28);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(-8, -13, 22, 26); ctx.fillStyle = '#7a1e16'; ctx.fillRect(10, -11, 4, 22);
  ctx.fillStyle = '#9fc3d8'; ctx.fillRect(4, -10, 5, 9); ctx.restore();
  ctx.restore();
}
function evDrawFlags(ctx, a, b, seed) {
  const n = Math.max(4, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 12)), COL = ['#ff3b3b', '#ffd23a', '#2e86de', '#27ae60', '#ff6fa5', '#ff8a2a', '#8e44ad'];
  ctx.strokeStyle = 'rgba(30,20,10,0.8)'; ctx.lineWidth = 0.8;
  const pt = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 26 + Math.sin(t * Math.PI) * 10];
  ctx.beginPath(); for (let i = 0; i <= n; i++) { const q = pt(i / n); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke();
  for (let i = 0; i < n; i++) {
    const q = pt((i + 0.5) / n), sw = Math.sin(Game.time * 3 + i + seed) * 1.2;
    ctx.fillStyle = COL[(i + seed) % COL.length]; ctx.beginPath(); ctx.moveTo(q[0] - 3.5, q[1]); ctx.lineTo(q[0] + 3.5, q[1]); ctx.lineTo(q[0] + sw, q[1] + 7); ctx.closePath(); ctx.fill();
  }
}
Events.draw = function (ctx, view) {
  const E = this.cur; if (!E || !inView(view, E.x, E.y, 420)) return;
  if (E.type === 'quebrado') {
    const x = E.carX !== undefined ? E.carX : E.x, y = E.carY !== undefined ? E.carY : E.y, a = E.carA !== undefined ? E.carA : E.a;
    if (!E.leave || E.endT < 1.5) { ctx.save(); ctx.translate(E.tri[0], E.tri[1]); ctx.fillStyle = '#e8261c'; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5.5, 4); ctx.lineTo(-5.5, 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffd0c0'; ctx.beginPath(); ctx.moveTo(0, -2.5); ctx.lineTo(2.6, 2.2); ctx.lineTo(-2.6, 2.2); ctx.closePath(); ctx.fill(); ctx.restore(); }
    drawVehicle(ctx, VMODELS[E.model], E.color, x, y, a, { parked: !E.leave, brake: !E.leave });
    if (E.npc && !(E.leave && E.endT > 1.2)) drawAnimal(ctx, E.npc);
  } else if (E.type === 'noivo' || E.type === 'carona') {
    if (E.npc) {
      drawAnimal(ctx, E.npc);
      if (E.type === 'carona') { // plaquinha de papelão com o destino
        ctx.save(); ctx.translate(E.npc.x + 9, E.npc.y - 12); ctx.fillStyle = '#c9a26a'; ctx.fillRect(-14, -6, 28, 10); ctx.fillStyle = '#2a1a0a'; ctx.font = '800 5px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(E.sign.slice(0, 10), 0, -1); ctx.restore();
      }
      if (E.type === 'noivo') { ctx.fillStyle = '#ffffff'; ctx.fillRect(E.npc.x - 1, E.npc.y - 1.5, 2, 3); }
    }
  } else if (E.type === 'banana') {
    for (const p of E.peels) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = '#d9b62c'; ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 1.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a4a1a'; ctx.fillRect(-5, -0.5, 1.5, 1); ctx.restore(); }
    for (const c of E.crates) if (!c.got) evDrawCrate(ctx, c);
    evDrawTruck(ctx, E);
    if (E.npc) drawAnimal(ctx, E.npc);
  } else if (E.type === 'blitz') {
    for (const c of E.cones) {
      ctx.save(); ctx.translate(c.x, c.y);
      if (c.down) { ctx.rotate(c.a); ctx.fillStyle = '#ff6a1a'; ctx.fillRect(-5, -2.5, 10, 5); ctx.fillStyle = '#fff'; ctx.fillRect(-1, -2.5, 2, 5); }
      else { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(1.5, 1.5, 4.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.arc(0, 0, 4.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.arc(0, 0, 1.4, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    for (const c of E.cars) drawVehicle(ctx, VMODELS.police, '#f2f2ee', c.x, c.y, c.a, { parked: true });
    drawAnimal(ctx, E.ofc); drawAnimal(ctx, E.ofc2);
    // placa "BLITZ"
    ctx.save(); ctx.translate(E.cones[E.cones.length - 1].x, E.cones[E.cones.length - 1].y - 14); ctx.fillStyle = '#1a1a1a'; ctx.fillRect(-1, 0, 2, 10); ctx.fillStyle = '#ffd23a'; ctx.fillRect(-16, -9, 32, 11); ctx.fillStyle = '#111'; ctx.font = '900 7px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LEI SECA', 0, -3.5); ctx.restore();
  } else if (E.type === 'festa') {
    // cavaletes zebrados
    for (const b of E.bars) {
      const n = 8;
      for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n; ctx.strokeStyle = i % 2 ? '#f2f2f2' : '#e8261c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(b[0][0] + (b[1][0] - b[0][0]) * t0, b[0][1] + (b[1][1] - b[0][1]) * t0); ctx.lineTo(b[0][0] + (b[1][0] - b[0][0]) * t1, b[0][1] + (b[1][1] - b[0][1]) * t1); ctx.stroke(); }
    }
    // barraquinhas
    for (const [q, label, col] of E.stalls) {
      ctx.save(); ctx.translate(q[0], q[1]);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-15, -9, 32, 22);
      ctx.fillStyle = '#7a5530'; ctx.fillRect(-16, -10, 32, 20);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? col : '#fff6dc'; ctx.fillRect(-16 + i * 8, -14, 8, 7); }
      ctx.fillStyle = '#1a1208'; ctx.font = '900 6px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 3);
      ctx.restore();
    }
    // fogueira
    ctx.save(); ctx.translate(E.x, E.y);
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(1, 2, 13, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 3.5; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); ctx.lineTo(-Math.cos(a) * 3, -Math.sin(a) * 3); ctx.stroke(); }
    const fl = 1 + Math.sin(Game.time * 17) * 0.12 + Math.sin(Game.time * 7) * 0.1;
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.ellipse(0, -3, 7 * fl, 9 * fl, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(0, -2, 4 * fl, 5.5 * fl, 0, 0, TAU); ctx.fill();
    ctx.restore();
    for (const d of E.dancers) drawAnimal(ctx, d);
    drawAnimal(ctx, E.org);
  }
  ctx.globalAlpha = 1;
};
// coisas que ficam "no alto": bandeirinhas por cima dos carros
Events.drawTop = function (ctx, view) {
  const E = this.cur; if (!E || E.type !== 'festa' || !inView(view, E.x, E.y, 400)) return;
  const W = E.edge.hw + (E.edge.T.sw || 0) - 4;
  for (let i = 0; i < 5; i++) { const s = E.s0 + 20 + i * (E.s1 - E.s0 - 40) / 4; evDrawFlags(ctx, evPos(E.edge, s, -W), evPos(E.edge, s, W), i * 3); }
  evDrawFlags(ctx, evPos(E.edge, E.s0 + 10, -W), evPos(E.edge, E.s1 - 10, W), 5);
  evDrawFlags(ctx, evPos(E.edge, E.s0 + 10, W), evPos(E.edge, E.s1 - 10, -W), 2);
};
// luz no chão (recorta a escuridão)
Events.drawLights = function (lctx, view) {
  const E = this.cur; if (!E || !inView(view, E.x, E.y, 500)) return;
  if (E.type === 'festa') { const f = 0.85 + Math.sin(Game.time * 13) * 0.08; lctx.globalAlpha = f; lctx.drawImage(LSPR, E.x - 190, E.y - 190, 380, 380); for (const [q] of E.stalls) { lctx.globalAlpha = 0.6; lctx.drawImage(LSPR, q[0] - 60, q[1] - 60, 120, 120); } }
  if (E.type === 'blitz') { lctx.globalAlpha = 0.75; lctx.drawImage(LSPR, E.x - 150, E.y - 150, 300, 300); for (const c of E.cars) { lctx.globalAlpha = 0.5; lctx.drawImage(LSPR, c.x - 90, c.y - 90, 180, 180); } }
  if (E.type === 'banana') { lctx.globalAlpha = 0.35; lctx.drawImage(LSPR, E.x - 120, E.y - 120, 240, 240); }
  if ((E.type === 'noivo' || E.type === 'carona') && E.npc) { lctx.globalAlpha = 0.45; lctx.drawImage(LSPR, E.npc.x - 55, E.npc.y - 55, 110, 110); }
  if (E.type === 'quebrado' && !E.leave) { lctx.globalAlpha = 0.3; lctx.drawImage(LSPR, E.x - 70, E.y - 70, 140, 140); }
  lctx.globalAlpha = 1;
};
// brilhos coloridos (pisca-alerta, giroflex, fogueira, marcador do evento)
Events.drawGlow = function (ctx, view) {
  const E = this.cur; if (!E) return;
  const T = Game.time;
  if (!E.over && E.stage === 'wait' && !E.passive && inView(view, E.x, E.y, 200)) {
    const q = E.pick || E, pulse = 0.5 + 0.5 * Math.sin(T * 4);
    ctx.globalAlpha = 0.5 + pulse * 0.4; ctx.strokeStyle = '#ff5ad1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(q.x, q.y, 34 + pulse * 8, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.35; ctx.drawImage(glowSprite('#ff5ad1'), q.x - 40, q.y - 40, 80, 80);
  }
  if (E.target && !E.over && inView(view, E.target.x, E.target.y, 200)) { const pulse = 0.5 + 0.5 * Math.sin(T * 4); ctx.globalAlpha = 0.6 + pulse * 0.3; ctx.strokeStyle = '#ff5ad1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(E.target.x, E.target.y, 40 + pulse * 8, 0, TAU); ctx.stroke(); }
  if (!inView(view, E.x, E.y, 400)) { ctx.globalAlpha = 1; return; }
  if (E.type === 'quebrado' && (!E.leave || E.endT < 1.5) && (T * 2.2) % 1 < 0.5) {
    const a = E.a, ca = Math.cos(a), sa = Math.sin(a), m = VMODELS[E.model], amber = glowSprite('#ffa520');
    ctx.globalAlpha = 0.95;
    for (const u of [m.L / 2 - 2, -m.L / 2 + 2]) for (const v of [-m.W / 2 + 2, m.W / 2 - 2]) ctx.drawImage(amber, E.x + ca * u - sa * v - 8, E.y + sa * u + ca * v - 8, 16, 16);
  }
  if (E.type === 'blitz') {
    E.cars.forEach((c, i) => { const ph = Math.floor(T * 7 + i) % 2; ctx.globalAlpha = 0.95; ctx.drawImage(glowSprite(ph ? '#ff2a2a' : '#2a6aff'), c.x - 14, c.y - 14, 28, 28); ctx.globalAlpha = 0.3; ctx.drawImage(glowSprite(ph ? '#ff2a2a' : '#2a6aff'), c.x - 70, c.y - 70, 140, 140); });
    const o = E.ofc; ctx.globalAlpha = 0.8; ctx.drawImage(glowSprite('#fff4c0'), o.x - 9, o.y - 9, 18, 18); // lanterna do agente
  }
  if (E.type === 'festa') {
    const f = 0.8 + Math.sin(T * 15) * 0.15;
    ctx.globalAlpha = f; ctx.drawImage(glowSprite('#ff8a2a'), E.x - 40, E.y - 40, 80, 80);
    ctx.globalAlpha = 0.35 * f; ctx.drawImage(glowSprite('#ffb547'), E.x - 110, E.y - 110, 220, 220);
    for (const [q, , col] of E.stalls) { ctx.globalAlpha = 0.5; ctx.drawImage(glowSprite(col), q[0] - 22, q[1] - 22, 44, 44); }
    // lampadinhas da gambiarra
    const W = E.edge.hw + (E.edge.T.sw || 0) - 4;
    for (let i = 0; i < 5; i++) { const s = E.s0 + 20 + i * (E.s1 - E.s0 - 40) / 4; for (let j = 0; j <= 6; j++) { const q = evPos(E.edge, s, -W + 2 * W * j / 6); ctx.globalAlpha = 0.55 + 0.4 * ((Math.floor(T * 3) + j + i) % 2); ctx.drawImage(glowSprite(j % 2 ? '#ffd23a' : '#ff6b3d'), q[0] - 5, q[1] - 31, 10, 10); } }
  }
  if (E.type === 'banana' && !E.over) { ctx.globalAlpha = 0.5; for (const c of E.crates) if (!c.got) ctx.drawImage(glowSprite('#ffe14a'), c.x - 12, c.y - 12, 24, 24); }
  ctx.globalAlpha = 1;
};
Events.mapPoint = function () {
  const E = this.cur; if (!E || E.over) return null;
  if (E.target) return [E.target.x, E.target.y];
  if (E.type === 'banana') return E.stage === 'collect' ? [E.x, E.y] : null;
  if (E.stage === 'wait' || E.type === 'blitz') { const q = E.pick || E; return [q.x, q.y]; }
  return null;
};

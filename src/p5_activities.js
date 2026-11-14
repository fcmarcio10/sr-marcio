/* ============================ ATIVIDADES ============================ */
const SHOP_TEXT = {
  moquecaria: 'Panelas de barro fumegando no fogão. Dona Penha grita da cozinha: "Moqueca boa é a daqui, o resto é peixada!"',
  farmacia: 'Aberta 24 horas. A balconista separa uma sacola com receita grampeada.',
  padaria: 'O último pão de queijo da noite ainda está quente no balcão.',
  mercado: 'Prateleiras cheias e um rádio tocando sertanejo baixinho.',
  lanchonete: 'O Bigode vira hambúrgueres na chapa enquanto conta causos.',
  paneleiras: 'Mulheres moldando argila preta do manguezal e queimando as panelas no chão, do jeito que se faz há séculos.',
  batalhao: 'O sargento de plantão te olha por cima do balcão: "Tá perdido, cidadão? Dirige com calma aí, que a noite é longa."',
  bar: 'Mesas de plástico na calçada, futebol na TV e petiscos no balcão. Motorista não bebe — só um guaraná.',
  floricultura: 'Baldes de rosas e girassóis iluminados por um letreiro rosa.',
  hotel: 'O porteiro da noite cochila atrás do balcão de madeira.',
  churrascaria: 'Espetos girando na brasa. O gaúcho da porta acena para você.',
  borracharia: 'Pilhas de pneus e um compressor chiando. "Precisando, é só chamar!"',
  sitio: 'Galinhas dormindo no poleiro e café passado no fogão a lenha.',
  fazenda: 'O casarão tem varanda iluminada e cheiro de doce de leite.',
  oficina: 'Macacos hidráulicos, ferramentas na parede e um rádio AM chiando.',
  posto: 'Frentistas de uniforme e o zumbido das lâmpadas da cobertura.',
};
const FRAGILE = /Moquequeira|Panela|panelas|Bolo|Ovos|bebidas|Arranjo|Buquê|Remédios|Doce/i;
const HOT = /Moqueca|Torta|Pizza|X-tudo|Pastéis|Lanches|Esfihas|Marmitas|salgados/i;

const Act = {
  delivery: null, race: null, parkSpot: null, parkHold: 0, parkCd: {}, waypoint: null,
  gps: null, gpsT: 0, gpsTarget: null, prompt: null, hintT: 0, hintI: 0, offers: new Map(), parkLock: null,
  ride: null, rideOnline: false, rideT: 5,
  reset() { this.ride = null; this.rideOnline = false; this.rideT = 5; this.parkLock = null; this.delivery = null; this.race = null; this.parkSpot = null; this.parkHold = 0; this.waypoint = null; this.gps = null; this.gpsTarget = null; this.prompt = null; this.offers.clear(); },
};
function pay(v, why) {
  v = Math.round(v);
  Profile.money += v;
  if (v > 0) { Profile.earned += v; gainXP(v / 6); }
  UI.moneyDelta(v);
  if (v > 0) AudioSys.money();
  if (why) toast(why, (v >= 0 ? '+' : '−') + ' R$ ' + fmtMoney(Math.abs(v)), v >= 0 ? 'good' : 'bad');
}
function onPlayerImpact(imp) {
  player.impactCd = 0.35;
  const k = clamp((imp - 70) / 380, 0, 1);
  // batidas leves e médias amassam 6% menos; batida forte continua igual
  const kd = k < 0.45 ? k * 0.94 : k;
  Profile.damage = clamp(Profile.damage + kd * 13, 0, 100);
  AudioSys.crash(0.2 + k);
  Cam.shake = Math.max(Cam.shake, 3 + k * 12);
  const hx = player.hitX || player.x, hy = player.hitY || player.y;
  for (let i = 0; i < 4 + k * 12; i++) Particles.emit('spark', hx, hy, rnd(-220, 220), rnd(-220, 220), rnd(0.2, 0.5), 2);
  if (k > 0.45 && chance(0.6)) { const f = pick([['Eita!', 'Isso vai doer no bolso…'], ['Ô, rapá!', 'Olha a lataria, sô!'], ['Que isso, maluco?', 'Seu Zé vai ter trabalho.'], ['Vixe!', 'Bateu feio.'], ['Bah!', 'Que barbaridade, tchê.'], ['Oxente!', 'Arrebentou foi tudo!'], ['Uai!', 'Esse trem amassou, sô.'], ['Égua!', 'Doeu até em mim.'], ['Caraca!', 'Pegou de jeito, mermão.']]); toast(f[0], f[1], 'bad'); }
  const zone = addZoneDamage(Profile.zones || (Profile.zones = { f: 0, r: 0, l: 0, rt: 0 }), player, hx, hy, kd);
  Debris.spill(hx, hy, k, player.color, zone);
  if ((zone === 'l' || zone === 'rt') && k > 0.45 && chance(0.6)) Particles.emit('hubcap', hx, hy, rnd(-140, 140), rnd(-140, 140), 2.6, 3);
  Events.onImpact(imp);
  if (Act.ride && Act.ride.stage === 'drive' && imp > 110) rideHit(Act.ride);
  if (Act.delivery && Act.delivery.fragile && imp > 130) {
    Act.delivery.hits++;
    toast('Carga frágil!', 'A encomenda sofreu um impacto (−15%).', 'bad');
  }
}
// marcas de colisão: amassados por região do carro (frente, traseira, laterais)
function addZoneDamage(Z, car, hx, hy, k) {
  const c = Math.cos(car.a), s = Math.sin(car.a);
  const dx = hx - car.x, dy = hy - car.y;
  const lx = dx * c + dy * s, ly = -dx * s + dy * c;
  let zone;
  if (Math.abs(lx) > car.m.L * 0.28) zone = lx > 0 ? 'f' : 'r'; else zone = ly < 0 ? 'l' : 'rt';
  Z[zone] = clamp(Z[zone] + 0.12 + k * 0.7, 0, 1);
  // batida na frente: guarda de que lado do para-choque foi (para o farol daquele lado)
  if (zone === 'f') { const sk = ly < 0 ? 'fL' : 'fR'; Z[sk] = clamp((Z[sk] || 0) + (0.1 + k * 0.6) * (Math.abs(ly) > car.m.W * 0.15 ? 0.8 : 0.4), 0, 1); }
  Z.seed = (Z.seed || 0) + 1;
  return zone;
}
const Debris = {
  list: [],
  spill(x, y, k, color, zone) {
    const n = Math.round(4 + k * 18);
    for (let i = 0; i < n; i++) {
      const r = rnd(), type = r < 0.45 ? 'glass' : r < 0.75 ? 'paint' : 'plastic';
      this.list.push({ x: x + rnd(-14, 14) * (0.6 + k), y: y + rnd(-14, 14) * (0.6 + k), a: rnd(TAU), s: rnd(1.2, 3.2), type, c: type === 'paint' ? color : type === 'glass' ? (zone === 'r' ? '#ff6a5a' : '#cfe6ff') : '#202024', t: Game.time });
    }
    if (k > 0.25) this.list.push({ x, y, a: rnd(TAU), s: 6 + k * 8, type: 'oil', c: '#000', t: Game.time });
    while (this.list.length > 500) this.list.shift();
  },
  draw(ctx, view) {
    for (const d of this.list) {
      if (d.x < view.x0 - 20 || d.x > view.x1 + 20 || d.y < view.y0 - 20 || d.y > view.y1 + 20) continue;
      const age = Game.time - d.t, al = clamp(1 - (age - 120) / 60, 0, 1);
      if (al <= 0) continue;
      ctx.globalAlpha = al * (d.type === 'oil' ? 0.45 : d.type === 'glass' ? 0.85 : 0.95);
      ctx.fillStyle = d.c;
      if (d.type === 'oil') { ctx.beginPath(); ctx.ellipse(d.x, d.y, d.s, d.s * 0.65, d.a, 0, TAU); ctx.fill(); continue; }
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.a);
      ctx.beginPath(); ctx.moveTo(-d.s, -d.s * 0.4); ctx.lineTo(d.s * 0.8, -d.s * 0.6); ctx.lineTo(d.s * 0.3, d.s * 0.6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
};
function zoneList(Z) {
  if (!Z) return [];
  const N = { f: 'dianteira', r: 'traseira', l: 'lateral esquerda', rt: 'lateral direita' }, out = [];
  for (const k of ['f', 'r', 'l', 'rt']) if (Z[k] > 0.05) out.push(N[k] + (Z[k] > 0.66 ? ' destruída' : Z[k] > 0.33 ? ' amassada' : ' arranhada'));
  return out;
}
// cenário que quebra
function refreshGroundArea(x0, y0, x1, y1) {
  for (let cy = Math.floor(y0 / CHUNK); cy <= Math.floor(y1 / CHUNK); cy++) for (let cx = Math.floor(x0 / CHUNK); cx <= Math.floor(x1 / CHUNK); cx++) {
    if (chunks.has(cy * 1000 + cx)) renderChunk(cx, cy);
  }
}
function breakObject(col, vx, vy, sp, hx, hy) {
  col.dead = true;
  if (vx !== undefined) { Profile.broken = (Profile.broken || 0) + 1; Police.crime('Vandalismo', 1, hx, hy); }
  const b = col.brk, o = b.obj, ang = Math.atan2(vy, vx) + rnd(-0.4, 0.4);
  if (b.kind === 'fence') {
    const long = (o.x1 - o.x0) > (o.y1 - o.y0), L = long ? o.x1 - o.x0 : o.y1 - o.y0;
    const t = clamp(long ? hx - o.x0 : hy - o.y0, 0, L);
    o.gaps.push({ t, a: ang });
    // recria a colisão só nos pedaços que sobraram
    const parts = []; let cur = 0;
    for (const gp of [...o.gaps].sort((a, c) => a.t - c.t)) { if (gp.t - 22 > cur) parts.push([cur, gp.t - 22]); cur = Math.max(cur, gp.t + 22); }
    if (L > cur) parts.push([cur, L]);
    for (const [a, c] of parts) { const nc = long ? addRectCol(o.x0 + a, o.y0, o.x0 + c, o.y1, 'fence') : addRectCol(o.x0, o.y0 + a, o.x1, o.y0 + c, 'fence'); nc.brk = b; }
    colGrid.query(o.x0, o.y0, o.x1, o.y1, _q); for (const c2 of _q) if (c2.brk === b && c2 !== col && c2.t === 0 && (c2.x1 - c2.x0) * (c2.y1 - c2.y0) >= (o.x1 - o.x0) * (o.y1 - o.y0) - 1) c2.dead = true;
    refreshGroundArea(o.x0 - 40, o.y0 - 40, o.x1 + 40, o.y1 + 40);
    AudioSys.breakSnd(o.type === 'chain' ? 'metal' : 'wood', clamp(sp / 400, 0.2, 1));
    Cam.shake = Math.max(Cam.shake, 3);
    return;
  }
  if (b.kind === 'tree') {
    o.down = ang; AudioSys.breakSnd('wood', 0.8);
    for (let i = 0; i < 14; i++) Particles.emit('leaf', o.x + rnd(-14, 14), o.y + rnd(-14, 14), rnd(-60, 60) + Math.cos(ang) * 60, rnd(-60, 60) + Math.sin(ang) * 60, rnd(0.8, 1.6), 2);
    Cam.shake = Math.max(Cam.shake, 5);
    return;
  }
  const k = clamp(sp / 400, 0.2, 1);
  Cam.shake = Math.max(Cam.shake, 2 + k * 5);
  if (b.kind === 'prop') {
    o.broken = true; o.fallA = ang;
    refreshGroundArea(o.x - b.R, o.y - b.R, o.x + b.R, o.y + b.R);
    const mat = BREAKABLE[o.type];
    AudioSys.breakSnd(mat, k);
    const cols = { wood: ['#8a5a34', '#6a4224'], plastic: [o.c || '#2f6a3a', '#e8e2d0'], metal: ['#8a8d92', '#c8302a'], rubber: ['#18181a'], clay: ['#2a2420'] }[mat] || ['#888'];
    for (let i = 0; i < 6 + k * 8; i++) Debris.list.push({ x: o.x + rnd(-6, 6) + Math.cos(ang) * rnd(4, 26), y: o.y + rnd(-6, 6) + Math.sin(ang) * rnd(4, 26), a: rnd(TAU), s: rnd(1.4, 3), type: 'paint', c: pick(cols), t: Game.time });
    if (o.type === 'hydrant') { World.geysers.push({ x: o.x, y: o.y, until: Game.time + 45 }); toast('Hidrante estourado!', 'Molhou a rua inteira.', 'bad'); }
  } else if (b.kind === 'lamp') {
    o.broken = true; o.down = ang;
    if (o.light) o.light.dieAt = Game.time + 1.1;
    World.sparkers.push({ x: o.hx, y: o.hy, until: Game.time + 1.5 });
    AudioSys.breakSnd('lamp', k);
    if (chance(0.5)) toast('Derrubou o poste!', 'A rua ficou no escuro. A prefeitura agradece…', 'bad');
    Debris.spill(o.hx, o.hy, 0.4, '#d8d8d2', 'f');
  } else {
    o.down = ang;
    AudioSys.breakSnd('metal', k);
    if (o.kind === 'tlight') toast('Semáforo no chão!', 'Agora é cada um por si nesse cruzamento.', 'bad');
  }
}
function deliveryOffer(shop) {
  let off = Act.offers.get(shop.id);
  if (off && Game.time - off.made < 90) return off;
  const item = pick(shop.items || ['Encomenda']);
  let dest = null;
  const rural = shop.region === 'sitio' || shop.region === 'fazenda';
  const pool = [];
  if (rural || chance(0.2)) {
    for (const s of World.shops) if (s !== shop && s.pickup && s.region !== shop.region) pool.push({ x: s.x, y: s.y, name: s.name });
  }
  if (!pool.length || chance(0.6)) {
    for (const h of World.homes) {
      const d = Math.hypot(h.x - shop.x, h.y - shop.y);
      if (d > 800 && d < (rural ? 6000 : 3400)) pool.push(h);
    }
  }
  dest = pick(pool) || pick(World.homes);
  const route = gpsRoute(shop.x, shop.y, dest.x, dest.y);
  const len = route ? route.len : Math.hypot(dest.x - shop.x, dest.y - shop.y) * 1.3;
  const cargo = player ? (player.car.cargo || 1) : 1;
  const fragile = FRAGILE.test(item), hot = HOT.test(item);
  const reward = Math.round((70 + len * 0.075) * cargo * (fragile ? 1.15 : 1) / 5) * 5;
  off = { shop, item, dest: { x: dest.x, y: dest.y, name: dest.name }, len, par: len / 230 + 22, reward, fragile, hot, made: Game.time };
  Act.offers.set(shop.id, off);
  return off;
}
function startDelivery(off) {
  Act.delivery = Object.assign({}, off, { t: 0, hits: 0 });
  Act.offers.delete(off.shop.id);
  AudioSys.chime();
  toast('Entrega aceita', off.item + ' para ' + off.dest.name, 'info');
  Act.gpsT = 0;
}
function finishDelivery() {
  const d = Act.delivery;
  let v = d.reward;
  let bonus = 0;
  if (d.t <= d.par) bonus = Math.round(d.reward * (d.hot ? 0.45 : 0.25));
  else if (d.t > d.par * 1.6) v *= 0.75;
  if (d.fragile) v *= Math.max(0.3, 1 - 0.15 * d.hits);
  Act.delivery = null;
  Profile.deliveries++;
  pay(v + bonus, 'Entrega concluída' + (bonus ? ' — no prazo!' : ''));
  saveGame();
}
function startRace(r) {
  Act.race = { r, idx: 0, t: 0, count: 3.4, lastBeep: 4 };
  toast('Percurso: ' + r.name, 'Ouro ' + fmtTime(r.gold) + ' · Prata ' + fmtTime(r.silver) + ' · Bronze ' + fmtTime(r.bronze), 'info');
}
function distToSeg(x, y, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
  const t = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / L2, 0, 1);
  return Math.hypot(x - (a[0] + dx * t), y - (a[1] + dy * t));
}
function finishRace() {
  if (Act.race.racha) { finishRacha(Act.race); return; }
  const R = Act.race, r = R.r, t = R.t;
  const medal = t <= r.gold ? 3 : t <= r.silver ? 2 : t <= r.bronze ? 1 : 0;
  const names = ['Sem medalha', 'Bronze', 'Prata', 'Ouro'];
  const rewards = [60, 300, 550, 900];
  const prev = Profile.races[r.id] || { best: Infinity, medal: -1 };
  let v;
  if (medal > prev.medal) v = rewards[medal] - (prev.medal > 0 ? rewards[prev.medal] : 0);
  else v = Math.round(rewards[medal] * 0.15);
  v = Math.max(v, 40);
  const record = t < prev.best;
  Profile.races[r.id] = { best: Math.min(prev.best, t), medal: Math.max(prev.medal, medal) };
  Act.race = null;
  AudioSys.chime();
  toast(r.name + ' — ' + names[medal], 'Tempo ' + fmtTime(t) + (record ? ' · NOVO RECORDE' : ''), medal >= 2 ? 'good' : 'info');
  pay(v, 'Prêmio do percurso');
  saveGame();
}
function abandonActivity() {
  if (Act.race) { Act.race = null; toast('Percurso abandonado', '', 'bad'); return true; }
  if (Act.delivery) { Act.delivery = null; toast('Entrega cancelada', 'O cliente vai ter que esperar…', 'bad'); return true; }
  if (Act.ride) { Act.ride = null; Act.rideT = 8; toast('Corrida cancelada', 'O passageiro chamou outro motorista.', 'bad'); return true; }
  if (Act.waypoint) { Act.waypoint = null; toast('Destino do GPS removido', '', 'info'); return true; }
  return false;
}
function visitShop(s) {
  if (Profile.visited.includes(s.id)) return;
  Profile.visited.push(s.id);
  const total = World.shops.filter((x) => x.kind !== 'garagem').length;
  const n = Profile.visited.length;
  pay(100, 'Caderneta: ' + s.name + ' (' + n + '/' + total + ')');
  if (n === total) setTimeout(() => pay(1500, 'Caderneta completa! Você conhece a cidade inteira.'), 900);
}

/* ---------- GPS (Dijkstra na malha viária) ---------- */
function gpsRoute(sx, sy, tx, ty) {
  const A = nearestEdge(sx, sy), B = nearestEdge(tx, ty);
  if (!A.e || !B.e) return null;
  const pA = A.e.h ? [A.e.a.x + A.s, A.e.a.y] : [A.e.a.x, A.e.a.y + A.s];
  const pB = B.e.h ? [B.e.a.x + B.s, B.e.a.y] : [B.e.a.x, B.e.a.y + B.s];
  if (A.e === B.e) return { pts: [[sx, sy], pA, pB, [tx, ty]], len: Math.abs(A.s - B.s) + A.d + B.d };
  const N = World.nodes.length;
  const dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  dist[A.e.a.id] = A.s; dist[A.e.b.id] = A.e.len - A.s;
  for (;;) {
    let u = -1, best = Infinity;
    for (let i = 0; i < N; i++) if (!done[i] && dist[i] < best) { best = dist[i]; u = i; }
    if (u < 0) break;
    done[u] = 1;
    const n = World.nodes[u];
    for (const e of n.edges) {
      const o = e.a === n ? e.b : e.a;
      const nd = best + e.len;
      if (nd < dist[o.id]) { dist[o.id] = nd; prev[o.id] = u; }
    }
  }
  const ca = dist[B.e.a.id] + B.s, cb = dist[B.e.b.id] + (B.e.len - B.s);
  let end = ca <= cb ? B.e.a : B.e.b;
  const len = Math.min(ca, cb) + A.d + B.d;
  if (!isFinite(len)) return null;
  const path = [];
  for (let i = end.id; i >= 0; i = prev[i]) path.push(World.nodes[i]);
  path.reverse();
  const pts = [[sx, sy], pA];
  for (const n of path) pts.push([n.x, n.y]);
  pts.push(pB, [tx, ty]);
  return { pts, len };
}
function currentTarget() {
  if (Act.race) { const R = Act.race; const p = R.idx < R.r.pts.length ? R.r.pts[R.idx] : null; return p ? { x: p[0], y: p[1], kind: 'race' } : null; }
  if (Act.delivery) { const D = Act.delivery, q = D.stage === 'pickup' ? D.pick : D.dest; return { x: q.x, y: q.y, kind: 'delivery' }; }
  if (Act.ride) { const q = Act.ride.stage === 'pickup' ? Act.ride.pick : Act.ride.dest; return { x: q.x, y: q.y, kind: 'ride' }; }
  const et = Events.gpsTarget();
  if (et && Events.cur.stage !== 'wait') return et;
  if (Act.waypoint) return { x: Act.waypoint.x, y: Act.waypoint.y, kind: 'waypoint' };
  return et;
}
function nearestShop(kind) {
  let best = null, bd = Infinity;
  for (const s of World.shops) if (s.kind === kind) { const d = Math.hypot(s.x - player.x, s.y - player.y); if (d < bd) { bd = d; best = s; } }
  return best;
}

/* ---------- atualização por quadro ---------- */
function updateActivities(dt) {
  const p = player, sp = p.speed;
  updateJobs(dt);
  // pontos de interesse
  for (const poi of World.pois) {
    if (Profile.discovered.includes(poi.id)) continue;
    if (Math.hypot(poi.x - p.x, poi.y - p.y) < poi.r) {
      Profile.discovered.push(poi.id);
      AudioSys.chime();
      toast('Ponto de interesse: ' + poi.name, poi.desc, 'info');
      pay(150);
      if (Profile.discovered.length === World.pois.length) setTimeout(() => pay(2000, 'Todos os pontos de interesse descobertos!'), 1200);
    }
  }
  // radares (pardal)
  for (const r of World.radars) {
    if (r.obj.down !== undefined) continue;
    if (p.x < r.x0 || p.x > r.x1 || p.y < r.y0 || p.y > r.y1) continue;
    const kmh = sp * 0.3;
    if (kmh > r.lim + 3 && Game.time - r.obj.last > 6) {
      r.obj.last = Game.time; Cam.flash = 1;
      AudioSys.tone(2400, 0.06, 'square', 0.06, 'ui'); AudioSys.tone(2400, 0.06, 'square', 0.06, 'ui', null, 0.1);
      const fine = Math.min(130, Math.max(0, Math.floor(Profile.money)));
      if (fine > 0) pay(-fine, 'Pardal! ' + Math.round(kmh) + ' km/h numa via de ' + r.lim);
      else toast('Pardal!', 'Flagrado a ' + Math.round(kmh) + ' km/h. A multa vai chegar pelo correio…', 'bad');
    }
  }
  // entrega em andamento
  if (Act.delivery) {
    const d = Act.delivery;
    d.t += dt;
    if (d.stage !== 'pickup' && Math.hypot(d.dest.x - p.x, d.dest.y - p.y) < 70 && sp < 40) finishDelivery();
  }
  // corrida
  if (Act.race) {
    const R = Act.race;
    if (R.count > 0) {
      R.count -= dt;
      const c = Math.ceil(R.count);
      if (c < R.lastBeep && c >= 1) { AudioSys.beep(false); R.lastBeep = c; }
      if (R.count <= 0) { AudioSys.beep(true); R.lastBeep = 0; }
    } else {
      R.t += dt;
      const cp = R.r.pts[R.idx];
      if (Math.hypot(cp[0] - p.x, cp[1] - p.y) < 95) {
        R.idx++;
        if (R.idx >= R.r.pts.length) finishRace(); else { AudioSys.checkpoint(); Act.gpsT = 0; }
      } else if (distToSeg(p.x, p.y, R.idx ? R.r.pts[R.idx - 1] : R.r.start, cp) > 1200) { // longe do trajeto (não do ponto: o racha da Cara-Pintada tem 4 km de reta)
        Act.race = null; toast('Percurso cancelado', 'Você se afastou demais do trajeto.', 'bad');
      }
    }
  }
  // GPS
  const tgt = currentTarget();
  if (Act.waypoint && Math.hypot(Act.waypoint.x - p.x, Act.waypoint.y - p.y) < 90) { Act.waypoint = null; toast('Você chegou ao destino', '', 'good'); AudioSys.checkpoint(); }
  Act.gpsT -= dt;
  if (tgt && (Act.gpsT <= 0 || !Act.gps)) { Act.gps = gpsRoute(p.x, p.y, tgt.x, tgt.y); Act.gpsT = 0.8; Act.gpsTarget = tgt; }
  if (!tgt) { Act.gps = null; Act.gpsTarget = null; }
  // vagas
  Act.parkSpot = null;
  if (!Act.race) {
    let best = null, bd = 520;
    for (const s of World.parkSpots) { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = s; } }
    Act.parkSpot = best;
    if (best) {
      const inside = parkedIn(best);
      if (Act.parkLock === best.id) { Act.parkHold = 0; if (!inside) Act.parkLock = null; }
      else if (inside && sp < 12) {
        Act.parkHold += dt;
        if (Act.parkHold >= 1.2) {
          Act.parkHold = 0; Act.parkLock = best.id;
          const cd = Act.parkCd[best.id] || -1e9;
          const rev = Math.abs(angDiff(p.a, best.a)) > Math.PI / 2;
          if (Game.time - cd < 120) toast('Vaga ocupada há pouco', 'Tente outra vaga ou volte mais tarde.', 'info');
          else {
            const first = !Profile.parks[best.id];
            Profile.parks[best.id] = true; Act.parkCd[best.id] = Game.time;
            const v = (first ? best.reward : 45) * (rev ? 1.3 : 1);
            pay(v, (rev ? 'Baliza de ré perfeita! ' : 'Estacionou bonito! ') + best.name);
          }
        }
      } else Act.parkHold = 0;
    }
  }
  // interações (E)
  Act.prompt = null;
  if (sp < 70 && !(Act.race && Act.race.count <= 0)) {
    let best = null, bd = Infinity;
    for (const s of World.shops) {
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < (s.radius || 72) && d < bd) { bd = d; best = s; }
    }
    if (best) {
      const verb = { garagem: 'Entrar na garagem', posto: 'Abastecer / lavar — ' + best.name, oficina: 'Oficina — consertar e melhorar' }[best.kind];
      Act.prompt = { text: verb || (best.pickup && !Act.delivery ? 'Pegar entrega — ' + best.name : 'Entrar — ' + best.name), act: () => openShopDialog(best) };
    } else if (!Act.race) {
      if (rachaOpen()) for (const r of World.rachas) {
        if (Math.hypot(r.start[0] - p.x, r.start[1] - p.y) < 85) { Act.prompt = { text: 'Racha (ilegal): ' + r.name + ' — aposta R$ ' + fmtMoney(r.bet) + ' contra ' + r.rival, act: () => startRacha(r) }; break; }
      }
      if (!Act.prompt) for (const r of World.races) {
        if (Math.hypot(r.start[0] - p.x, r.start[1] - p.y) < 85) {
          const rec = Profile.races[r.id];
          Act.prompt = { text: 'Iniciar percurso: ' + r.name + (rec ? ' (recorde ' + fmtTime(rec.best) + ')' : ''), act: () => startRace(r) };
          break;
        }
      }
    }
  }
  // dicas do modo livre
  Act.hintT -= dt;
  if (Act.hintT <= 0) { Act.hintT = 11; Act.hintI++; }
}
function parkedIn(s) {
  const p = player, m = p.m;
  let da = Math.abs(angDiff(p.a, s.a));
  if (da > Math.PI / 2) da = Math.PI - da;
  if (da > 0.22) return false;
  const c = Math.cos(s.a), sn = Math.sin(s.a);
  const pc = Math.cos(p.a), ps = Math.sin(p.a);
  for (const [u, v] of [[m.L / 2, m.W / 2], [m.L / 2, -m.W / 2], [-m.L / 2, m.W / 2], [-m.L / 2, -m.W / 2]]) {
    const wx = p.x + pc * u - ps * v - s.x, wy = p.y + ps * u + pc * v - s.y;
    const lu = wx * c + wy * sn, lv = -wx * sn + wy * c;
    if (Math.abs(lu) > s.l / 2 + 3 || Math.abs(lv) > s.w / 2 + 3) return false;
  }
  return true;
}
function freeRoamHint() {
  const disc = Profile.discovered.length, totP = World.pois.length;
  const vis = Profile.visited.length, totV = World.shops.filter((x) => x.kind !== 'garagem').length;
  if (Profile.fuel < 22) { const s = nearestShop('posto'); return ['Combustível baixo', 'Procure um posto: ' + (s ? s.name : '') + '. Marque no mapa do celular (Q).']; }
  if (Profile.damage > 55) return ['Carro avariado', 'Passe na Oficina do Seu Zé, no Distrito da Gambiarra.'];
  const cheapest = CARS.filter((c) => !Profile.owned[c.id]).sort((a, b) => a.price - b.price)[0];
  const list = [
    ['Exploração livre', 'Comércios com marcador amarelo oferecem entregas. Pare em frente e aperte E.'],
    ['Exploração livre', 'Pontos de interesse descobertos: ' + disc + '/' + totP + '. O mapa do celular (Q) mostra o que falta perto de você.'],
    ['Exploração livre', 'Percursos cronometrados começam nas bandeiras azuis. Medalha de ouro paga bem.'],
    ['Exploração livre', 'Caderneta de visitas: ' + vis + '/' + totV + ' estabelecimentos. Cada visita nova rende R$ 100.'],
    ['Exploração livre', 'Vagas marcadas em azul pagam por um estacionamento perfeito. De ré vale mais.'],
    ['Exploração livre', 'Abra o mapa no celular (Q) e clique para traçar uma rota no GPS até qualquer lugar.'],
    ['Exploração livre', 'Cuidado com o pardal: radares nas avenidas (80 km/h) e na BR-101 (110 km/h) multam na hora.'],
    ['Exploração livre', 'Tem churrasquinho na esquina do boteco e forró tocando. São Gambiarra nunca dorme.'],
    ['Cuide do carro', 'Pneus, óleo e bateria gastam. Troque na oficina, no posto (óleo) ou na borracharia (pneus).'],
    ['Farol (H)', 'Parado por muito tempo com o farol aceso, a bateria arria. Aperte H para desligar.'],
  ];
  if (cheapest && Profile.money >= cheapest.price) list.push(['Carro novo disponível', 'Você já pode comprar o ' + cheapest.name + ' na sua garagem.']);
  return list[Act.hintI % list.length];
}

/* ============================ POLÍCIA: CRIMES, PERSEGUIÇÃO, PRISÃO E FUGA ============================ */
// sistema de perseguição DESLIGADO por enquanto (a pedido): troque para true para reativar
const POLICE_ENABLED = false;
const Police = { heat: 0, level: 0, units: [], spawnT: 0, lostT: 0, bustT: 0, seenT: 0, lastSeen: null, crimeCd: 0, sirenK: 0 };
Police.patrolNear = function (x, y, r) {
  for (const c of Traffic.cars) if (c.model === 'police' && Math.hypot(c.x - x, c.y - y) < r) return c;
  for (const u of this.units) if (Math.hypot(u.x - x, u.y - y) < r) return u;
  return null;
};
// a polícia só age se viu (viatura perto) — ou se o crime foi contra ela
Police.crime = function (why, lvl, x, y, direct) {
  if (!POLICE_ENABLED) return;
  if (Game.mode !== 'play' || !player) return;
  if (!direct && !this.patrolNear(x, y, 460)) return;
  if (this.crimeCd > 0 && lvl <= this.level) return;
  this.crimeCd = 2;
  const before = this.level;
  // bater na polícia durante a perseguição sobe uma estrela; outros crimes só renovam a perseguição
  this.level = Math.min(3, this.level >= lvl ? (direct && this.level > 0 ? this.level + 1 : this.level) : lvl);
  this.lostT = 0; this.seenT = 0; this.lastSeen = { x: player.x, y: player.y };
  if (this.level > before) {
    toast(this.level === 1 ? 'A polícia te viu!' : 'Perseguição aumentou!', why + ' · ' + '★'.repeat(this.level) + ' · fuja ou pare o carro', 'bad');
    AudioSys.siren();
  }
};
function makeUnit(x, y, a) {
  const m = VMODELS.police, r = m.W / 2, span = m.L / 2 - r;
  return { m, x, y, a, v: 0, pts: null, ri: 1, rt: 0, mode: 'route', id: Math.random(), stuckT: 0, isUnit: true, mass: 1.8, circles: [-span, 0, span], hitT: 0,
    hit(imp, nx, ny) { this.v *= 0.45; this.x += nx * Math.min(8, imp * 0.02); this.y += ny * Math.min(8, imp * 0.02); this.hitT = Math.min(1.2, 0.3 + imp / 400); } };
}
Police.spawnUnit = function () {
  const p = player, v = Cam.view;
  let sx, sy;
  const B = World.shops.find((s) => s.kind === 'batalhao');
  if (B && Math.hypot(B.x - p.x, B.y - p.y) < 1600 && !(B.x > v.x0 && B.x < v.x1 && B.y > v.y0 && B.y < v.y1)) { sx = B.x; sy = B.y; }
  else {
    for (let t = 0; t < 12; t++) {
      const a = rnd(TAU), d = rnd(900, 1300);
      const ne = nearestEdge(clamp(p.x + Math.cos(a) * d, 100, WORLD_W - 100), clamp(p.y + Math.sin(a) * d, 100, WORLD_H - 100));
      if (!ne.e || ne.e.T.id === 'dirt' && chance(0.5)) continue;
      const x = ne.e.h ? ne.e.a.x + ne.s : ne.e.a.x, y = ne.e.h ? ne.e.a.y : ne.e.a.y + ne.s;
      if (x > v.x0 - 60 && x < v.x1 + 60 && y > v.y0 - 60 && y < v.y1 + 60) continue;
      sx = x; sy = y; break;
    }
  }
  if (sx === undefined) return;
  this.units.push(makeUnit(sx, sy, Math.atan2(p.y - sy, p.x - sx)));
};
function edgePt(e, s) { return e.h ? [e.a.x + s, e.a.y] : [e.a.x, e.a.y + s]; }
Police.route = function (u, tx, ty) {
  const ne = nearestEdge(u.x, u.y), e = ne.e;
  const fwd = Math.cos(u.a) * e.dx + Math.sin(u.a) * e.dy >= 0, node = fwd ? e.b : e.a;
  const T = nearestEdge(tx, ty);
  let pts;
  if (T.e === e && (fwd ? T.s >= ne.s : T.s <= ne.s)) pts = [[u.x, u.y], edgePt(e, ne.s), edgePt(e, T.s), [tx, ty]];
  else { const r = gpsRoute(node.x, node.y, tx, ty); pts = [[u.x, u.y], edgePt(e, ne.s), [node.x, node.y]].concat(r ? r.pts.slice(1) : [[tx, ty]]); }
  pts = laneShift(pts, 14); if (pts.length > 2) pts.pop();
  return pts;
};
// caminho livre (sem prédio, muro, árvore ou poste) entre dois pontos
function lineClearFor(x0, y0, x1, y1) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 25));
  for (let i = 1; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (areaBlocked(x - 9, y - 9, x + 9, y + 9)) return false; }
  return true;
}
Police.unitDrive = function (u, dt) {
  const p = player, d = Math.hypot(p.x - u.x, p.y - u.y);
  // velocidade 70% menor que antes: a viatura é perigosa se você parar ou bater, mas dá para fugir
  this.pace = lerp(this.pace || p.speed, p.speed, 1 - Math.exp(-1.0 * dt));
  const pmax = Math.max(300, p.st.max);
  const capK = [0, 0.9, 0.98, 1.05][this.level] || 0.9;
  const vmax = Math.max(344, Math.min(pmax * capK, this.pace * 1.12 + 55) * 0.94); // 0,672 + 40%
  // rota pelas ruas, na mão direita; recalcula com calma (não copia cada virada sua)
  u.rt -= dt;
  const tgt = this.lostT > 0 && this.lastSeen ? this.lastSeen : p;
  if (!u.pts || u.rt <= 0 || u.ri >= u.pts.length) { u.rt = 2.5; u.pts = Police.route(u, tgt.x, tgt.y); u.ri = 1; }
  // pula pontos da rota que já ficaram para trás (nunca dá ré para buscar um ponto)
  while (u.ri < u.pts.length - 1) { const P = u.pts[u.ri], Q = u.pts[u.ri + 1]; if ((Q[0] - P[0]) * (u.x - P[0]) + (Q[1] - P[1]) * (u.y - P[1]) > 0 || Math.hypot(P[0] - u.x, P[1] - u.y) < 10) u.ri++; else break; }
  // freia antes da esquina
  let cornerV = 1e9;
  if (u.ri < u.pts.length - 1) {
    const A = u.ri > 0 ? u.pts[u.ri - 1] : [u.x, u.y], B = u.pts[u.ri], C = u.pts[u.ri + 1];
    const turn = Math.abs(angDiff(Math.atan2(B[1] - A[1], B[0] - A[0]), Math.atan2(C[1] - B[1], C[0] - B[0])));
    const dB = Math.hypot(B[0] - u.x, B[1] - u.y);
    if (turn > 0.3 && dB < 40 + u.v * 0.8) cornerV = 45 + (1 - turn / Math.PI) * 90 + dB * 0.6;
  }
  // cerco: perto de você e com caminho livre, sai da rota e fecha seu carro
  // (a 1ª viatura atravessa na sua frente, a 2ª encosta atrás, a 3ª fecha o lado)
  const role = this.units.indexOf(u) % 3, ca = Math.cos(p.a), sa = Math.sin(p.a);
  const bp = role === 0 ? [p.x + ca * (48 + p.speed * 0.25), p.y + sa * (48 + p.speed * 0.25)] : role === 1 ? [p.x - ca * 48, p.y - sa * 48] : [p.x - sa * 30, p.y + ca * 30];
  u.block = d < 180 && lineClearFor(u.x, u.y, bp[0], bp[1]);
  let target = Math.min(vmax, cornerV);
  if (!u.block) {
    if (d < 160) target = Math.min(target, p.speed + 20 + d * 0.1);
    if (d < 70) target = Math.min(target, p.speed + 6);
  } else target = Math.min(vmax, Math.hypot(bp[0] - u.x, bp[1] - u.y) * 3 + p.speed * 0.9);
  // não encosta na traseira da outra viatura
  for (const o of this.units) {
    if (o === u) continue;
    const rx = o.x - u.x, ry = o.y - u.y, f = rx * Math.cos(u.a) + ry * Math.sin(u.a);
    if (f > 0 && f < 75 && Math.abs(-rx * Math.sin(u.a) + ry * Math.cos(u.a)) < 26) target = Math.min(target, Math.max(0, o.v - 10 + (f - 55)));
  }
  if (u.hitT > 0) { u.hitT -= dt; target = Math.min(target, 40); }
  u.v += clamp(target - u.v, -420 * dt, 220 * dt);
  // anda exatamente pela rota (como os outros carros), com o volante suave
  let step = Math.max(0, u.v) * dt;
  const ox = u.x, oy = u.y;
  if (u.block) {
    // manobra de cerco: vai até o ponto de bloqueio e, chegando, fica atravessada
    const dx = bp[0] - u.x, dy = bp[1] - u.y, dd = Math.hypot(dx, dy);
    if (dd > 3) { const m = Math.min(dd, step); u.x += dx / dd * m; u.y += dy / dd * m; }
    step = 0; u.rt = 0;
  }
  while (step > 0 && u.ri < u.pts.length) {
    const q = u.pts[u.ri], dx = q[0] - u.x, dy = q[1] - u.y, dd = Math.hypot(dx, dy);
    if (dd < 0.5) { u.ri++; continue; }
    const m = Math.min(dd, step); u.x += dx / dd * m; u.y += dy / dd * m; step -= m;
    if (m >= dd) u.ri++;
  }
  // fim da rota e você bem perto: vai encostar devagar
  if (!u.block && u.ri >= u.pts.length && d < 120 && d > 40 && lineClearFor(u.x, u.y, p.x, p.y)) { const m = Math.min(d - 40, u.v * dt); u.x += (p.x - u.x) / d * m; u.y += (p.y - u.y) / d * m; }
  // nunca entra em prédio, muro ou poste: se for entrar, volta e recalcula
  const bodyHit = [-17, 0, 17].some((k) => { const x = u.x + Math.cos(u.a) * k, y = u.y + Math.sin(u.a) * k; return areaBlocked(x - 7, y - 7, x + 7, y + 7); });
  if (bodyHit && !areaBlocked(ox - 7, oy - 7, ox + 7, oy + 7)) { u.x = ox; u.y = oy; u.v *= 0.5; u.rt = 0; u.stuckT += dt; } else u.stuckT = Math.max(0, u.stuckT - dt);
  if (u.stuckT > 2.5) { const ne = nearestEdge(u.x, u.y), q = edgePt(ne.e, ne.s); u.x = q[0]; u.y = q[1]; u.stuckT = 0; u.pts = null; }
  const mvx = u.x - ox, mvy = u.y - oy;
  const near = Math.hypot(bp[0] - u.x, bp[1] - u.y) < 14;
  if (u.block && near && role === 0) u.a += clamp(angDiff(u.a, p.a + Math.PI / 2), -4 * dt, 4 * dt); // atravessada na sua frente
  else if (mvx * mvx + mvy * mvy > 0.0004) u.a += clamp(angDiff(u.a, Math.atan2(mvy, mvx)), -5 * dt, 5 * dt);
  // trânsito abre caminho para a sirene
  for (const c of Traffic.cars) {
    const rx = c.x - u.x, ry = c.y - u.y, f = rx * Math.cos(u.a) + ry * Math.sin(u.a);
    if (f > 0 && f < 260 && Math.abs(-rx * Math.sin(u.a) + ry * Math.cos(u.a)) < 40) c.yieldT = 1.2;
  }
  // bate nos carros do trânsito como um carro de verdade: empurra e perde velocidade, não atravessa
  for (const c of Traffic.cars) {
    const dx0 = c.x - u.x, dy0 = c.y - u.y; if (dx0 * dx0 + dy0 * dy0 > 90 * 90) continue;
    const uc = Math.cos(u.a), us2 = Math.sin(u.a), cc = Math.cos(c.a), cs = Math.sin(c.a), R = u.m.W / 2 + c.m.W / 2;
    for (const ka of u.circles) for (const kb of c.circles) {
      const ax = u.x + uc * ka, ay = u.y + us2 * ka, bx = c.x + cc * kb, by = c.y + cs * kb, dx = bx - ax, dy = by - ay, dd = Math.hypot(dx, dy);
      if (dd >= R || dd < 0.01) continue;
      const pen = R - dd, nx = dx / dd, ny = dy / dd;
      c.ox += nx * pen * 0.6; c.oy += ny * pen * 0.6; u.x -= nx * pen * 0.4; u.y -= ny * pen * 0.4;
      const rel = (uc * u.v - Math.cos(c.a) * c.v) * nx + (us2 * u.v - Math.sin(c.a) * c.v) * ny;
      if (rel > 50) { c.hit(rel, nx, ny); u.v *= 0.7; }
    }
  }
};
Police.update = function (dt) {
  const p = player; if (!p) return;
  if (!POLICE_ENABLED) { if (this.level || this.units.length) { this.level = 0; this.units.length = 0; } if (this.sirenK > 0.001) { this.sirenK = 0; AudioSys.sirenSet && AudioSys.sirenSet(0, 0, 1); } return; }
  this.crimeCd -= dt;
  // excesso de velocidade na frente de uma viatura de ronda
  const kmh = p.speed * 0.3, lim = regionKeyAt(p.x, p.y) === 'rodovia' ? 110 : 80;
  if (kmh > lim + 35 && this.level === 0) { const pc = this.patrolNear(p.x, p.y, 320); if (pc) this.crime('Excesso de velocidade: ' + Math.round(kmh) + ' km/h', 1, p.x, p.y, true); }
  if (this.level === 0) { if (this.units.length) this.units.length = 0; this.sirenK = lerp(this.sirenK, 0, 1 - Math.exp(-2 * dt)); AudioSys.sirenSet && AudioSys.sirenSet(this.sirenK, 0, 1); return; }
  // reforço conforme o nível
  const want = this.level;
  this.spawnT -= dt;
  if (this.units.length < want && this.spawnT <= 0) { this.spawnT = 4; this.spawnUnit(); }
  for (const u of this.units) this.unitDrive(u, dt);
  // uma viatura nunca entra dentro da outra
  for (let i = 0; i < this.units.length; i++) for (let j = i + 1; j < this.units.length; j++) {
    const A = this.units[i], B = this.units[j];
    for (const ka of [-12, 0, 12]) for (const kb of [-12, 0, 12]) {
      const ax = A.x + Math.cos(A.a) * ka, ay = A.y + Math.sin(A.a) * ka, bx = B.x + Math.cos(B.a) * kb, by = B.y + Math.sin(B.a) * kb;
      const dx = bx - ax, dy = by - ay, dd = Math.hypot(dx, dy), R = 23;
      if (dd >= R || dd < 0.01) continue;
      const push = (R - dd) / 2; B.x += dx / dd * push; B.y += dy / dd * push; A.x -= dx / dd * push; A.y -= dy / dd * push;
    }
  }
  // alguém está te vendo?
  let nearest = 1e9, nu = null;
  for (const u of this.units) { const d = Math.hypot(u.x - p.x, u.y - p.y); if (d < nearest) { nearest = d; nu = u; } }
  const seen = nearest < 650;
  if (seen) { this.lostT = 0; this.lastSeen = { x: p.x, y: p.y }; } else this.lostT += dt;
  // fuga: some da vista por um tempo e as estrelas vão caindo
  const need = 7 + this.level * 3;
  if (this.lostT > need) {
    this.level--; this.lostT = 0;
    if (this.level <= 0) {
      this.level = 0; Profile.escapes = (Profile.escapes || 0) + 1;
      toast('Despistou a polícia!', 'As viaturas voltaram para a ronda.', 'good'); AudioSys.chime();
      this.units.length = 0;
    } else { toast('Perdendo você de vista…', '★'.repeat(this.level) + ' · continue sumido', 'info'); if (this.units.length > this.level) this.units.length = this.level; }
  }
  // prisão: parado (ou quase) com a viatura colada
  const boxed = this.units.filter((u) => Math.hypot(u.x - p.x, u.y - p.y) < 100).length;
  if (nearest < 95 && p.speed < 45) this.bustT += dt * (boxed >= 2 ? 1.5 : 1); else this.bustT = Math.max(0, this.bustT - dt * 2);
  if (this.bustT > 2.6) this.bust();
  // sirene com efeito de aproximação (Doppler)
  if (nu) {
    const dx = p.x - nu.x, dy = p.y - nu.y, dd = Math.hypot(dx, dy) || 1;
    const vrel = ((Math.cos(nu.a) * nu.v - p.vx) * dx + (Math.sin(nu.a) * nu.v - p.vy) * dy) / dd; // >0 aproximando
    this.sirenK = lerp(this.sirenK, clamp(1 - nearest / 1400, 0.05, 1), 1 - Math.exp(-4 * dt));
    AudioSys.sirenSet && AudioSys.sirenSet(this.sirenK, clamp((nu.x - p.x) / 500, -0.9, 0.9), clamp(1 + vrel / 1500, 0.8, 1.25));
  }
};
Police.bust = function () {
  const lvl = this.level, fine = 150 * lvl, tow = 150;
  const total = Math.min(Math.max(0, Math.floor(Profile.money)), fine + tow);
  Profile.busts = (Profile.busts || 0) + 1;
  this.level = 0; this.units.length = 0; this.bustT = 0; this.lostT = 0;
  if (total > 0) pay(-total, null);
  Act.race = null;
  // carro vai para o pátio do Batalhão
  const B = World.shops.find((s) => s.kind === 'batalhao') || World.batalhao;
  if (B) { const ne = nearestEdge(B.x, B.y); player.place(B.x, B.y, ne.e && ne.e.h ? 0 : Math.PI / 2); player.vx = player.vy = 0; Cam.x = B.x; Cam.y = B.y; Traffic.fill(B.x, B.y); }
  Cam.flash = 0.8; AudioSys.error();
  showDialog({ kind: 'POLÍCIA MILITAR', title: 'Você foi detido', text: 'Multa de R$ ' + fmtMoney(fine) + ' (' + '★'.repeat(lvl) + ') e R$ ' + fmtMoney(tow) + ' do guincho. Pago: R$ ' + fmtMoney(total) + '. Seu carro foi levado para o pátio do Batalhão da PM. "Na próxima, é cadeia, hein, cidadão!"', buttons: [['Entendi', () => closeDialog()]] });
};

// Roteiro da gameplay de apresentação. Cada cena: nome, seg (duração em segundos), setup (roda dentro do jogo).
// falas: narração (narra/final/gXX.wav) e vozes do jogo, presas a uma cena com atraso t (segundos).
// estilo: trecho da trilha (abre, rola, trampo, baile, fecha) · musica: volume da trilha na cena (1 = normal).
// Tudo o que aparece é o jogo funcionando de verdade: o roteiro só escolhe onde o carro anda,
// em que botão toca e qual tecla aperta (como um jogador faria).
const F = require('./narra/falas.json');
const D = (id) => F[id].dur;
const s = (t) => Math.round(t * 60); // segundos -> quadro
const sem = `for (const c of Traffic.cars) if (c.model === 'police') { c.release(); c.dead = true; } Traffic.cars = Traffic.cars.filter((c) => !c.dead);`;

const cenas = [
  /* ================= ABERTURA ================= */
  { nome: '01-abertura', seg: 0.5 + D('g01') + 0.3, antes: 40, estilo: 'abre',
    setup: `TR.reset({ lb: 120, time: 23 * 60 + 20 }); TR.drive(4300, 1520, 6600, 1520, 300, { lane: 24 }); TR.follow(2.3, 1.3, 0.15);
      TR.onFrame = (f) => { TR.blackO = Math.max(0, 1 - f / 45); };` },
  { nome: '02-logo', seg: 3.2, antes: 30, estilo: 'abre',
    setup: `TR.reset({ time: 23 * 60 + 20 }); TR.drive(2100, 400, 2100, 3800, 200, { lane: 25 }); TR.fixo(2100, 1200, 0.9, 1.0, 2100, 1500);
      TR.card(true, true, 'Mundo aberto · São Gambiarra (ES)'); const lg = TR.ov.querySelector('.tr-logo .logo');
      TR.onFrame = (f) => { TR.blackO = 0.84; TR.logoO = Math.min(1, f / 5, (TR.n - f) / 8); if (lg) lg.style.transform = 'scale(' + (1.3 + 0.4 * Math.max(0, 1 - f / 8)) + ')'; };` },

  /* ================= O MUNDO ================= */
  { nome: '03a-cidade', seg: 6.0, antes: 40, estilo: 'rola',
    setup: `TR.reset({ time: 20 * 60 + 40 }); TR.drive(900, 1260, 3000, 1260, 200, { lane: 24 }); TR.fixo(1600, 1150, 0.7, 0.86, 1850, 1330);` },
  { nome: '03b-centrao', seg: 0.7, antes: 0, placa: true, estilo: 'rola',
    setup: `TR.reset({ placa: true, time: 22 * 60 + 40 }); TR.cruzar('centro', 5, 300, { de: 'vila', perto: [1500, 2600] }); TR.follow(1.3, 1.32, 0.15);` },
  { nome: '03c-vila', seg: 0.95, antes: 0, placa: true, estilo: 'rola',
    setup: `TR.reset({ placa: true, time: 22 * 60 + 40 }); TR.cruzar('vila', 5, 300, { de: 'centro', perto: [900, 2600] }); TR.follow(1.3, 1.32, 0.15);` },
  { nome: '03d-feiorosa', seg: 0.75, antes: 0, placa: true, estilo: 'rola',
    setup: `TR.reset({ placa: true, time: 23 * 60 }); TR.cruzar('feurosa', 5, 260, { perto: [1100, 6400] }); TR.follow(1.3, 1.32, 0.15);` },
  { nome: '03e-carapina', seg: D('g02') - 8.1 + 0.6, antes: 0, placa: true, estilo: 'rola',
    setup: `TR.reset({ placa: true, time: 23 * 60 }); TR.cruzar('carapina', 5, 240, { perto: [3300, 6400], depois: 1400 }); TR.follow(1.3, 1.45, 0.15);` },
  { nome: '04a-br', seg: 2.0, antes: 40, estilo: 'rola',
    setup: `TR.reset({ cam: 3, time: 20 * 60 + 40 }); TR.drive(1450, 6221, 5200, 6221, 520, { lane: 21 }); TR.follow(1.12, 1.22, 0.25);` },
  { nome: '04b-ponte', seg: 0.75, antes: 60, estilo: 'rola',
    setup: `TR.reset({ time: 23 * 60 }); TR.drive(4300, 1520, 6600, 1520, 340, { lane: 24, skip: 300 }); TR.follow(1.5, 1.6, 0.12);` },
  { nome: '04c-orla', seg: 2.9, antes: 40, estilo: 'rola',
    setup: `TR.reset({ time: 23 * 60 + 50, camOff: [0, 130] }); TR.drive(6400, 8725, 8500, 8725, 280, { lane: 25 }); TR.follow(1.05, 1.15, 0.3);` },
  { nome: '04d-viela', seg: 1.2, antes: 20, estilo: 'rola',
    setup: `TR.reset({ time: 23 * 60 + 20 }); const v = World.animalsDef.filter((d) => d.type === 'person' && d.n === 3 && d.rect[2] - d.rect[0] < 14 && d.rect[1] > 6400)[3];
      const cx = (v.rect[0] + v.rect[2]) / 2, cy = (v.rect[1] + v.rect[3]) / 2; player.place(cx + 3000, cy, 0); TR.rail = null; TR.fixo(cx, cy - 50, 2.0, 1.9, cx, cy + 50);` },
  { nome: '04e-pagode', seg: D('g03') - 6.7 + 0.5, antes: 30, estilo: 'rola', musica: 0.55,
    setup: `TR.reset({ time: 23 * 60 + 30 }); const pc = World.pracaBagunca; TR.drive(400, 7525, 3300, 7525, 150, { lane: 25 });
      TR.fixo(pc.x - 40, pc.y + 20, 1.9, 2.2, 1220, 6990);` },
  { nome: '05-chuva', seg: 0.2 + D('g04') + 0.3, antes: 60, estilo: 'rola',
    setup: `TR.reset({ rain: 1, time: 22 * 60 }); TR.drive(400, 900, 2750, 900, 190, { lane: 23 }); TR.follow(1.6, 1.75, 0.1);
      TR.onFrame = (f) => { if (f === 30 && TR.rec) { if (!Weather.puddleGrid) Weather.buildPuddles(); const R = TR.rail, q = TR.at(R, R.s + 190 / 60 * 300), p = { x: q[0], y: q[1], rx: 26, ry: 10, mud: false, cool: 0, ph: 1 }; const C = Weather.puddleCell, k = Math.floor(p.x / C) + ',' + Math.floor(p.y / C); if (!Weather.puddleGrid.has(k)) Weather.puddleGrid.set(k, []); Weather.puddleGrid.get(k).push(p); } };` },

  /* ================= HUD, BATIDA E PARDAL ================= */
  { nome: '06-hud', seg: 0.3 + D('g05') + 0.2, antes: 60, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 30 }); TR.drive(400, 2100, 3000, 2100, 200, { lane: 24 });
      Act.waypoint = { x: 3550, y: 903, label: 'Oficina do Seu Zé' }; Act.gpsT = 0;
      const s = 60, r = (x) => Math.round(x * s);
      TR.destacar('#hud-minimap', 'GPS', r(0.4), r(2.2)); TR.destacar('#speedo', 'velocímetro', r(1.6), r(3.0));
      TR.destacar('#hud-money', 'dinheiro', r(2.9), r(4.2), false); TR.destacar('#hud-level', 'nível', r(3.9), r(5.3), false);
      TR.destacar('#tire-bar', 'pneu', r(5.3), r(7.6)); TR.destacar('#oil-bar', 'óleo', r(5.9), r(7.6)); TR.destacar('#bat-bar', 'bateria', r(6.5), r(7.6)); TR.destacar('#cond-bar', 'lataria', r(8.0), r(10.6));` },
  { nome: '07-poste', seg: 0.2 + 1.9 + D('g07') + 0.4, antes: 0, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 35 }); Profile.damage = 6; TR.sorte = true;
      const A = TR.alvos(1700, 2100, 1600, (c) => c.brk.kind === 'lamp' && Math.abs(nearestEdge(c.x, c.y).d) < 60 && nearestEdge(c.x, c.y).e.T.id === 'street' && nearestEdge(c.x, c.y).e.len > 600);
      TR.batida(A[0], 98, 250);` },
  { nome: '08-pardal', seg: 0.2 + D('g08') + 0.4, antes: 0, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 40 }); ${sem}
      const R = TR.drive(800, 1500, 4600, 1500, 380, { lane: 24 }); let sx = 0; for (let s = 0; s < R.len; s += 4) if (TR.at(R, s)[0] >= 3003) { sx = s; break; }
      R.s = Math.max(0, sx - 380 * 4.57); R.v = 380; const q = TR.at(R, R.s), q1 = TR.at(R, R.s + 10); player.place(q[0], q[1], Math.atan2(q1[1] - q[1], q1[0] - q[0]));` },

  /* ================= CELULAR ================= */
  { nome: '09-celular', seg: 0.3 + D('g09') + 0.5, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 45 }); TR.drive(1500, 1260, 2600, 1260, 0, { lane: 24, v0: 0 });
      const anel = (id, nome) => () => TR.destacar(document.querySelector('#phone-body .ph-grid [data-app="' + id + '"], #phone-body .ph-dock [data-app="' + id + '"]'), nome, TR.f, TR.f + 42);
      TR.em([
        [${s(0.2)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(2.5)}, () => TR.tocar('#phone-body [data-app="ajustes"]')],
        [${s(3.1)}, () => TR.tocar('#phone-body [data-go="aj-sobre"]')],
        [${s(6.7)}, () => TR.tocar('#phone-body .ph-back')], [${s(6.95)}, () => TR.tocar('#phone-body .ph-back')],
        [${s(7.5)}, anel('mapa', 'mapa')], [${s(7.95)}, anel('msgs', 'WhatsApp')], [${s(8.5)}, anel('pegaai', 'corrida')],
        [${s(9.4)}, anel('fretes', 'fretes')], [${s(10.1)}, anel('racha', 'racha')], [${s(10.6)}, anel('carteira', 'carteira')], [${s(11.2)}, anel('conquistas', 'conquistas')],
      ]);` },
  { nome: '10-mapa', seg: 0.2 + D('g10') + 0.7, antes: 0, estilo: 'trampo',
    setup: `TR.legDir = 760; TR.em([
        [${s(0.2)}, () => TR.tocar('#phone-body [data-app="mapa"]')],
        [${s(1.7)}, () => TR.botao(/Oficina do Seu Zé/, '#ph-map-dests button')],
        [${s(3.9)}, () => { TR.tecla('KeyQ', 'Q', 'fechar'); TR.legDir = 0; }],
      ]);` },

  /* ================= PEGAAÍ ================= */
  { nome: '11-pegaai', seg: 0.2 + D('g11') + 0.4, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 50 }); TR.drive(900, 2100, 2600, 2100, 0, { lane: 24, v0: 0 }); Act.waypoint = null;
      const C = career(); C.lvl = 2; C.xp = xpNeed(2) - 6; C.acc = { comum: true, aero: false, mudanca: false, vip: false }; Act.rideOnline = false;
      TR.fixar(PASSAGEIROS, 'Marcão'); TR.fixar(PG_PICKUP.comum, 1);
      TR.em([
        [${s(0.15)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(0.9)}, () => TR.tocar('#phone-body [data-app="pegaai"]')],
        [${s(2.6)}, () => TR.tocar('#phone-body [data-act2="ride-toggle"]')],
        [${s(3.4)}, () => { TR.tecla('KeyQ', 'Q', 'fechar'); TR.legDir = 0; Act.rideT = 0.3; }],
        [${s(4.0)}, () => { const t = __VT.timers.find((t) => String(t.fn).includes('PG_PICKUP')); if (t) t.at = __VT.t + 1600; }],
      ]);` },
  { nome: '12-busca', seg: 0.2 + D('g12') + 0.5, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_EMBARQUE, 5); const R = Act.ride; TR.chegar(R.pick.x, R.pick.y, ${s(3.7)}, 240);` },
  { nome: '13a-emocao', seg: 3.6, antes: 0, estilo: 'trampo',
    // passeio com o passageiro, para longe do destino (o carro só chega lá na cena 14)
    setup: `const R = Act.ride; const tx = clamp(R.pick.x - (R.dest.x - R.pick.x) * 3, 400, WORLD_W - 400), ty = clamp(R.pick.y - (R.dest.y - R.pick.y) * 3, 400, WORLD_H - 400);
      const r = TR.drive(R.pick.x, R.pick.y, tx, ty, 280, { lane: 24 }); r.s = Math.min(150, r.len / 4); r.v = 280;` },
  { nome: '13b-hidrante', seg: 1.9, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_BATIDA, 1); TR.batidaCarro(40, 250, 'hatch');` },
  { nome: '13c-lixeira', seg: 1.9, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_BATIDA, 2); TR.batidaCarro(35, 250, 'van', [player.x + 900, player.y]); TR.cada = (f) => { if (f % 8 === 0) { const c = Traffic.cars[0]; console.warn('DBG f' + f + ' carros ' + Traffic.cars.length + (c ? ' d=' + Math.round(Math.hypot(c.x - player.x, c.y - player.y)) + ' v=' + Math.round(c.v) + ' dead=' + !!c.dead + ' st=' + c.state : '') + ' pv=' + Math.round(player.speed) + ' dano=' + Profile.damage.toFixed(1)); } };` },
  { nome: '13d-cerca', seg: 0.2 + D('g13') - 3.6 - 1.9 - 1.9 + 0.6, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_BATIDA, 0); TR.batidaCarro(30, 250, 'taxi', [player.x, player.y + 900]); TR.cada = (f) => { if (f % 8 === 0) { const c = Traffic.cars[0]; console.warn('DBG f' + f + ' carros ' + Traffic.cars.length + (c ? ' d=' + Math.round(Math.hypot(c.x - player.x, c.y - player.y)) + ' v=' + Math.round(c.v) + ' dead=' + !!c.dead + ' st=' + c.state : '') + ' pv=' + Math.round(player.speed) + ' dano=' + Profile.damage.toFixed(1)); } };` },
  { nome: '14-chegada', seg: 0.2 + D('g14') + 0.4, antes: 0, estilo: 'trampo',
    setup: `const R = Act.ride; R.t = 5; TR.ultima = R; Profile.damage = Math.min(Profile.damage, 30); TR.chegar(R.dest.x, R.dest.y, ${s(0.4)}, 170);
      TR.em([[${s(1.4)}, () => { __VT.timers = __VT.timers.filter((t) => !String(t.fn).includes('angryVoice')); Act.rideOnline = false; Act.rideT = 1e9; }]]);` },
  { nome: '15-audio', seg: 0.3 + D('g15') + 0.9 + D('p_moqueca') + 0.4 + D('g16') + 0.5, antes: 0, estilo: 'trampo', musica: 0.6,
    setup: `const R = TR.ultima; TR.escolha = (a) => (Array.isArray(a) ? a.find((x) => x && x.clip === 'p_moqueca') : undefined);
      TR.em([
        [${s(0.15)}, () => angryVoice(R, false)],
        [${s(2.2)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(2.6)}, () => TR.tocar('#phone-body [data-app="pegaai"]')],
        [${s(3.0)}, () => TR.tocar('#phone-body [data-pgtab="msgs"]')],
        [${s(3.35)}, () => TR.tocar('#phone-body [data-pgchat="' + R.rid + '"]')],
        [${s(3.9)}, () => TR.tocar('#phone-body .wa-voice')],
      ]);` },
  { nome: '16a-categorias', seg: 0.2 + 7.5, antes: 0, estilo: 'trampo',
    setup: `TR.legDir = 760; const anel = (id, nome) => () => TR.destacar('#phone-body [data-rcat="' + id + '"]', nome, TR.f, TR.f + 170, false);
      TR.em([
        [${s(0.1)}, () => TR.tocar('#phone-body [data-pgback]')], [${s(0.35)}, () => TR.tocar('#phone-body [data-pgtab="drv"]')],
        [${s(0.9)}, () => { const b = document.querySelector('#phone-body'); if (b) b.scrollTop = 9999; }],
        [${s(1.0)}, anel('aero', 'aeroporto')], [${s(3.9)}, anel('mudanca', 'mudança')], [${s(6.6)}, anel('vip', 'VIP')],
      ]);` },
  { nome: '16b-vip', seg: 0.2 + D('g17') - 7.5 + 0.4, antes: 0, estilo: 'trampo',
    setup: `Screens.closeAll(); document.body.classList.remove('tr-bigphone'); const C = career(); C.lvl = 5; C.ratings = [5, 5, 5, 5, 5, 5]; C.acc = { comum: false, aero: false, mudanca: false, vip: true };
      Profile.damage = 0; Profile.dirt = 0; Profile.zones = { f: 0, r: 0, l: 0, rt: 0, seed: 1 }; Act.ride = null; Act.rideOnline = false;
      TR.fixar(VIPS, 'Doutor Valdemar'); TR.fixar(VIP_FALAS, 0); newRideRequest(); const R = Act.ride; TR.chegar(R.pick.x, R.pick.y, ${s(0.55)}, 150);` },

  /* ================= ENTREGA E FRETE ================= */
  { nome: '17a-moquecaria', seg: 0.2 + 7.84, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 52 }); const C = career(); C.lvl = 3; C.xp = 20; C.ratings = [2]; Act.ride = null; Act.rideOnline = false;
      const sh = World.shops.find((x) => x.kind === 'moquecaria'); TR.fixar(sh.items, 'Moqueca capixaba'); TR.chegar(sh.x, sh.y, ${s(2.0)}, 200);
      TR.em([[${s(5.6)}, () => TR.tecla('KeyE', 'E', 'pegar entrega')], [${s(6.9)}, () => TR.botao(/Moqueca capixaba/)]]);` },
  { nome: '17b-entregue', seg: D('g18') - 7.84 + 0.6, antes: 0, estilo: 'trampo',
    setup: `const d = Act.delivery; d.t = 4; TR.chegar(d.dest.x, d.dest.y, ${s(1.2)}, 200);` },
  { nome: '18-fretes', seg: 0.2 + D('g19') + 0.4, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 54 }); Profile.current = 'gas'; player.setCar('gas'); TR.hook();
      const d = World.depots.gas, ne = nearestEdge(d.x, d.y), e = ne.e; TR.makeRail; const x = e.a.x + e.dx * ne.s, y = e.a.y + e.dy * ne.s;
      TR.useRail(TR.makeRail([[x - e.dx * 80, y - e.dy * 80], [x + e.dx * 4, y + e.dy * 4]], 20), 0, { v0: 0, skip: 70 });
      TR.em([
        [${s(0.2)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(0.8)}, () => TR.tocar('#phone-body [data-app="fretes"]')],
        [${s(5.0)}, () => TR.tocar('#phone-body [data-job="0"]')],
        [${s(6.6)}, () => { TR.tecla('KeyQ', 'Q', 'fechar'); TR.legDir = 0; }],
      ]);` },
  { nome: '19-gas', seg: 0.2 + D('g20') + 0.5, antes: 0, estilo: 'trampo',
    setup: `const J = Act.delivery; J.stage = 'deliver'; GasJingle.t = 0; const r = TR.drive(J.pick.x, J.pick.y, J.dest.x, J.dest.y, 190, { lane: 22 }); r.s = r.len * 0.45; r.v = 190; TR.follow(1.35, 1.45, 0.12);` },

  /* ================= OFICINA, POSTO E BANCO ================= */
  { nome: '20-oficina', seg: 0.2 + D('g21') + 0.5, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 40 }); Act.delivery = null; Profile.current = 'brasa'; player.setCar('brasa'); TR.hook();
      Profile.damage = 42; Profile.zones = { f: 0.6, r: 0.25, l: 0.45, rt: 0.1, seed: 3 }; Profile.money = 90; Profile.fiado = null;
      const of = World.shops.find((x) => x.kind === 'oficina'); TR.chegar(of.x, of.y, ${s(0.5)}, 150);
      const fb = () => [...document.querySelectorAll('#dialog-buttons button')].find((b) => /fiado/i.test(b.textContent));
      TR.em([[${s(0.9)}, () => TR.tecla('KeyE', 'E', 'oficina')], [${s(6.5)}, () => TR.destacar(fb(), 'fiado', TR.f, TR.f + 60, false)], [${s(7.6)}, () => TR.tocar(fb())]]);` },
  { nome: '21-posto', seg: 0.2 + D('g22') + 0.4, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 42 }); Profile.fuel = 28; Profile.dirt = 0.85; Profile.money = 640; Profile.damage = 0;
      const ps = World.shops.find((x) => x.kind === 'posto' && x.wash); TR.chegar(ps.x, ps.y, ${s(0.4)}, 150);
      TR.em([[${s(0.6)}, () => TR.tecla('KeyE', 'E', 'posto')], [${s(1.3)}, () => TR.botao(/Encher o tanque/)], [${s(3.0)}, () => TR.botao(/Lavar o carro/)], [${s(5.0)}, () => TR.botao(/café/)]]);` },
  { nome: '22a-emprestimo', seg: 0.2 + 5.5, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 44 }); Profile.loan = null; Profile.money = 120; TR.drive(1500, 1260, 2600, 1260, 0, { lane: 24, v0: 0 });
      TR.em([
        [${s(0.1)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(0.6)}, () => TR.tocar('#phone-body [data-app="carteira"]')],
        [${s(1.4)}, () => TR.tocar('#phone-body [data-wtab="loan"]')],
        [${s(2.4)}, () => TR.tocar('#phone-body [data-lamt="1000"]')],
        [${s(3.6)}, () => TR.tocar('#phone-body [data-loan="8"]')],
      ]);` },
  { nome: '22b-juros', seg: D('g23') - 5.5 + 0.6, antes: 0, estilo: 'trampo',
    setup: `TR.legDir = 760; const L = Profile.loan;
      TR.em([
        [${s(0.1)}, () => { L.billed = 2; L.overdue = L.parcela; Profile.money = 0; Finance.newDay(); }],
        [${s(0.35)}, () => TR.tocar('#phone-body .ph-back')],
        [${s(0.8)}, () => TR.tocar('#phone-body [data-app="msgs"]')],
        [${s(1.3)}, () => TR.tocar('#phone-body [data-chat="' + BANK + '"]')],
      ]);` },

  /* ================= EVENTOS ================= */
  { nome: '23a-convite', seg: 0.2 + 5.5, antes: 30, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 46 }); Profile.loan = null; Profile.money = 980; TR.drive(500, 2100, 3000, 2100, 190, { lane: 24 });
      TR.em([[${s(1.5)}, () => { for (let i = 0; i < 60; i++) { Events.clear(); if (Events.spawn('noivo')) break; } Events.cur.life = 1e9; }], [${s(4.1)}, () => TR.tecla('KeyY', 'Y', 'aceitar')]]);` },
  { nome: '23b-noivo', seg: 2.6, antes: 0, estilo: 'baile',
    setup: `const E = Events.cur; TR.chegar(E.pick.x, E.pick.y, ${s(0.8)}, 200); TR.em([[${s(1.1)}, () => TR.tecla('KeyE', 'E', 'levar o noivo')]]);` },
  { nome: '23c-igreja', seg: 0.2 + D('g24') - 5.5 - 2.6 + 0.9, antes: 0, estilo: 'baile',
    setup: `const E = Events.cur; E.left = 30; TR.chegar(E.dest.x, E.dest.y, ${s(0.6)}, 200);` },
  { nome: '24a-biu', seg: 0.3 + D('g25') + 0.6 + D('biu_socorro') + 0.5 + 2.8, antes: 10, estilo: 'baile', musica: 0.6,
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 48 }); TR.drive(1500, 6221, 4000, 6221, 0, { lane: 21, v0: 0 });
      TR.em([
        [${s(0.2)}, () => { for (let i = 0; i < 60; i++) { Events.clear(); if (Events.spawn('banana')) break; } Events.cur.life = 1e9; }],
        [${s(2.6)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(3.0)}, () => TR.tocar('#phone-body [data-app="msgs"]')],
        [${s(3.4)}, () => TR.tocar('#phone-body [data-chat="' + BIU + '"]')],
        [${s(3.8)}, () => TR.tocar('#phone-body .wa-voice')],
        [${s(14.2)}, () => TR.tocar('#phone-body [data-reply="0"]')],
        [${s(16.0)}, () => TR.tocar('#phone-body .wa-loc')],
      ]);` },
  { nome: '24b-bananas', seg: 0.2 + D('g26') + 0.4, antes: 0, estilo: 'baile',
    setup: `Screens.closeAll(); document.body.classList.remove('tr-bigphone'); TR.legDir = 0; const E = Events.cur; E.stage = 'collect';
      const e = E.edge, h = e.a.y === e.b.y, lado = h ? Math.sign(E.y - e.a.y) : Math.sign(e.a.x - E.x), ida = lado <= 0 ? 1 : -1, x0 = h ? E.x - ida * 330 : e.a.x, y0 = h ? e.a.y : E.y - ida * 330;
      TR.drive(x0, y0, h ? x0 + ida * 1500 : x0, h ? y0 : y0 + ida * 1500, 120, { lane: 24, v0: 120 }); TR.follow(1.6, 1.75, 0.08);
      const R = TR.rail; E.crates.forEach((c, k) => { const q = TR.at(R, R.s + 60 + k * 52); c.x = q[0]; c.y = q[1]; c.got = false; });` },
  { nome: '25-blitz', seg: 0.2 + D('g27') + 0.4, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 50 }); const E = TR.spawnEv('blitz', 1600, 3880); TR.chegar(E.x, E.y, ${s(1.3)}, 190);` },
  { nome: '26a-arraia', seg: 1.3, antes: 20, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 30 }); const E = TR.spawnEv('festa', 1500, 3300); E.party = true; E.stage = 'wait'; player.place(E.x + 3000, E.y + 3000, 0); TR.rail = null; TR.fixo(E.x, E.y, 2.0, 2.3);` },
  { nome: '26b-chupeta', seg: 2.4, antes: 24, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 50 }); const E = TR.spawnEv('quebrado', 1600, 2700); E.kind = 'bateria'; E.stage = 'fix'; E.smoke = 0; E.hold = 0.2;
      const px = E.x - Math.cos(E.a) * 47, py = E.y - Math.sin(E.a) * 47; player.place(px, py, E.a); TR.rail = null; TR.fixo((E.x + px) / 2, (E.y + py) / 2, 2.7, 3.0);` },
  { nome: '26c-carona', seg: 2.3, antes: 20, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 30 }); const E = TR.spawnEv('carona', 2500, 6221); E.stage = 'wait'; TR.chegar(E.pick.x, E.pick.y, ${s(1.6)}, 170); TR.fixo(E.npc.x, E.npc.y, 2.5, 2.8);` },
  { nome: '26d-festa', seg: 0.2 + D('g28') - 1.3 - 2.4 - 2.3 + 0.5, antes: 20, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 30 }); const E = TR.spawnEv('festa', 1500, 3300); E.party = true; E.stage = 'wait'; player.place(E.x + 3000, E.y + 3000, 0); TR.rail = null; TR.fixo(E.x - 60, E.y, 1.5, 1.7, E.x + 60, E.y);` },

  /* ================= RACHA E DESAFIOS ================= */
  { nome: '27a-convite', seg: 0.2 + 3.5, antes: 20, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 22 * 60 + 1 }); Profile.rachaMsg = false; ${sem} TR.drive(1800, 6179, 5200, 6179, 300, { lane: 21 });` },
  { nome: '27b-racha', seg: D('g29') + 0.2 - 3.7 + 1.8, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 22 * 60 + 3 }); ${sem} const r = World.rachas.find((x) => x.id === 'arrancada');
      const R = TR.drive(r.start[0], r.start[1], r.pts[r.pts.length - 1][0], r.pts[r.pts.length - 1][1], 0, { lane: 0, v0: 0 });
      TR.slow = () => (Act.race && Act.race.count > 0 ? 1.38 : 1); TR.cada = () => { ${sem} };
      TR.em([[${s(2.34)}, () => { TR.tecla('KeyE', 'E', 'racha'); R.speed = 440; }]]);` },
  { nome: '28a-percurso', seg: 0.2 + 3.8, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 52 }); const r = World.races.find((x) => x.id === 'centro');
      const R = TR.drive(r.start[0], r.start[1], r.pts[0][0], r.pts[0][1], 0, { lane: 0, v0: 0 });
      TR.em([[${s(0.7)}, () => { TR.tecla('KeyE', 'E', 'percurso'); R.speed = 300; }]]);` },
  { nome: '28b-baliza', seg: D('g30') - 3.8 + 0.7, antes: 0, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 53 }); const v = World.parkSpots.find((x) => x.id === 'central_3_9');
      const R = TR.makeRail([[v.x - Math.cos(v.a) * 75, v.y - Math.sin(v.a) * 75], [v.x, v.y]], 0); TR.useRail(R, 95, { v0: 95, re: true }); TR.fixo(v.x, v.y, 2.3, 2.5);` },

  /* ================= GARAGEM, PAREDÃO E FINAL ================= */
  { nome: '29-garagem', seg: 0.2 + D('g31') + 0.6, antes: 6, estilo: 'fecha',
    setup: `TR.reset({ time: 20 * 60 + 55 }); Profile.money = 4850; Garage.sel = 'brasa'; Garage.tab = 'kit'; Garage.cat = 'paint'; Garage.preview = {}; Garage.previewColor = null; Screens.open('screen-garage'); Garage.render();
      const card = (re) => () => TR.tocar([...document.querySelectorAll('#garage-list .gcard')].find((d) => re.test(d.textContent)));
      const cat = (id) => () => TR.tocar('[data-kcat="' + id + '"]'); const opt = (n) => () => { const o = document.querySelectorAll('#garage-tab [data-kopt], #garage-tab [data-kcol]'); if (o[n]) TR.tocar(o[n]); };
      TR.em([
        [${s(3.3)}, card(/Fuska/)], [${s(3.8)}, card(/Kombo/)], [${s(4.4)}, card(/Santanão/)], [${s(5.0)}, card(/Opalha/)],
        [${s(5.9)}, cat('paint')], [${s(6.2)}, opt(3)], [${s(6.7)}, cat('wheels')], [${s(7.0)}, opt(2)],
        [${s(7.5)}, cat('neon')], [${s(7.8)}, opt(2)], [${s(8.4)}, cat('low')], [${s(8.7)}, opt(1)], [${s(9.3)}, cat('spoiler')], [${s(9.6)}, opt(1)],
      ]);` },
  { nome: '30-paredao', seg: 0.2 + D('g32') + 0.9, antes: 20, estilo: 'fecha', musica: 0.12,
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 57 }); Screens.closeAll(); const pc = World.pracaBagunca, ne = nearestEdge(pc.x, pc.y), e = ne.e;
      const x = e.a.x + e.dx * ne.s - e.dy * 24, y = e.a.y + e.dy * ne.s + e.dx * 24; player.place(x, y, Math.atan2(e.dy, e.dx)); TR.rail = null; carLife().bat = 100;
      TR.people(12, x, y, 66); TR.fixo(x, y, 2.3, 2.55); TR.em([[${s(2.75)}, () => TR.tecla('KeyB', 'B', 'paredão')]]);` },
  { nome: '31a-final', seg: 2.2, antes: 40, estilo: 'fecha',
    setup: `TR.reset({ cam: 3, time: 20 * 60 + 40 }); TR.drive(1450, 6221, 5200, 6221, 520, { lane: 21 }); TR.follow(1.15, 1.3, 0.25);` },
  { nome: '31b-final', seg: 2.0, antes: 40, estilo: 'fecha',
    setup: `TR.reset({ rain: 1, time: 22 * 60 }); TR.drive(400, 1500, 2700, 1500, 300, { lane: 25 }); TR.follow(2.1, 2.3, 0.08);` },
  { nome: '31c-final', seg: 2.1, antes: 40, estilo: 'fecha',
    setup: `TR.reset({ time: 23 * 60 + 50, camOff: [0, 130] }); TR.drive(6400, 8725, 8500, 8725, 280, { lane: 25 }); TR.follow(1.05, 1.2, 0.3);` },
  { nome: '31d-final', seg: 2.0, antes: 40, estilo: 'fecha',
    setup: `TR.reset({ time: 23 * 60 + 20 }); TR.drive(400, 7525, 3300, 7525, 260, { lane: 25 }); TR.fixo(1800, 7600, 0.8, 0.95, 2600, 7650);` },
  { nome: '31e-final', seg: 0.2 + D('g33') - 8.3 + 0.6, antes: 50, estilo: 'fecha',
    setup: `TR.reset({ time: 23 * 60 + 45 }); TR.drive(4400, 7475, 400, 7475, 400, { lane: 25 }); TR.slow = 0.45; TR.follow(2.4, 1.6, 0.12);` },
  { nome: '32-logo', seg: 0.4 + D('g34') + 1.6, antes: 30, estilo: 'fecha',
    setup: `TR.reset({ flash: 0.6, time: 23 * 60 + 55 }); TR.drive(2100, 400, 2100, 3800, 200, { lane: 25 }); TR.fixo(2100, 1200, 0.9, 1.0, 2100, 1500);
      TR.card(true, true, 'Acelera, mermão. A cidade é sua.'); const lg = TR.ov.querySelector('.tr-logo .logo');
      TR.onFrame = (f) => { const n = TR.n; TR.blackO = f > n - 40 ? Math.min(1, 0.86 + (f - (n - 40)) / 40) : Math.min(0.86, 0.5 + f / 20);
        TR.logoO = f > n - 40 ? Math.max(0, (n - f) / 40) : 1; if (lg) lg.style.transform = 'scale(' + (1.35 + 0.35 * Math.max(0, 1 - f / 7)) + ')'; };` },
];

const falas = [
  { id: 'g01', cena: '01-abertura', t: 0.5 },
  { id: 'g02', cena: '03a-cidade', t: 0.3 },
  { id: 'g03', cena: '04a-br', t: 0.15 },
  { id: 'g04', cena: '05-chuva', t: 0.2 },
  { id: 'g05', cena: '06-hud', t: 0.3 },
  { id: 'g06', cena: '07-poste', t: 0.2 },
  { id: 'g07', cena: '07-poste', t: 2.1 },
  { id: 'g08', cena: '08-pardal', t: 0.2 },
  { id: 'g09', cena: '09-celular', t: 0.3 },
  { id: 'g10', cena: '10-mapa', t: 0.2 },
  { id: 'g11', cena: '11-pegaai', t: 0.2 },
  { id: 'g12', cena: '12-busca', t: 0.2 },
  { id: 'g13', cena: '13a-emocao', t: 0.2 },
  { id: 'g14', cena: '14-chegada', t: 0.2 },
  { id: 'g15', cena: '15-audio', t: 0.3 },
  { id: 'p_moqueca', cena: '15-audio', t: 3.9 + 0.02, jogo: true },
  { id: 'g16', cena: '15-audio', t: 0.3 + D('g15') + 0.9 + D('p_moqueca') + 0.4 },
  { id: 'g17', cena: '16a-categorias', t: 0.2 },
  { id: 'g18', cena: '17a-moquecaria', t: 0.2 },
  { id: 'g19', cena: '18-fretes', t: 0.2 },
  { id: 'g20', cena: '19-gas', t: 0.2 },
  { id: 'g21', cena: '20-oficina', t: 0.2 },
  { id: 'g22', cena: '21-posto', t: 0.2 },
  { id: 'g23', cena: '22a-emprestimo', t: 0.2 },
  { id: 'g24', cena: '23a-convite', t: 0.2 },
  { id: 'g25', cena: '24a-biu', t: 0.3 },
  { id: 'biu_socorro', cena: '24a-biu', t: 3.8 + 0.02, jogo: true },
  { id: 'g26', cena: '24b-bananas', t: 0.2 },
  { id: 'g27', cena: '25-blitz', t: 0.2 },
  { id: 'g28', cena: '26a-arraia', t: 0.2 },
  { id: 'g29', cena: '27a-convite', t: 0.2 },
  { id: 'g30', cena: '28a-percurso', t: 0.2 },
  { id: 'g31', cena: '29-garagem', t: 0.2 },
  { id: 'g32', cena: '30-paredao', t: 0.2 },
  { id: 'g33', cena: '31a-final', t: 0.2 },
  { id: 'g34', cena: '32-logo', t: 0.4 },
];

module.exports = { cenas, falas };

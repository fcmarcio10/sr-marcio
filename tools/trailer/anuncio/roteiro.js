// Vídeo de anúncio para o YouTube (horizontal, ~3 min): "Eu tô criando um GTA brasileiro... no Espírito Santo".
// Narração em primeira pessoa (voz/gXX.mp3, voz Jonas) + vozes do próprio jogo (passageiro e Seu Biu).
// Cada cena: nome, seg (duração em segundos), setup (roda dentro do jogo). estilo = trecho da música (gameplay/mix.py),
// musica = volume da trilha na cena. Os cortes caem nas pausas da narração (medidas em narra/final/gXX.wav).
// Tudo o que aparece é o jogo funcionando: o roteiro só escolhe onde o carro anda, em que botão toca e que tecla aperta.
const F = require('./narra/falas.json');
const D = (id) => F[id].dur;
const s = (t) => Math.round(t * 60); // segundos -> quadro
const sem = `for (const c of Traffic.cars) if (c.model === 'police') { c.release(); c.dead = true; } Traffic.cars = Traffic.cars.filter((c) => !c.dead);`;
const claro = `canvas.style.filter = 'contrast(1.06) saturate(1.2) brightness(1.3)';`; // fazenda (é escura no jogo)

const cenas = [
  /* ================= GANCHO E LOGO ================= */
  { nome: 'a01-gancho', seg: 0.4 + D('g01') + 0.3, antes: 40, estilo: 'abre',
    setup: `TR.reset({ lb: 120, time: 23 * 60 + 20 }); TR.drive(1450, 6221, 5200, 6221, 470, { lane: 21 }); TR.follow(2.4, 1.35, 0.2);
      TR.onFrame = (f) => { TR.blackO = Math.max(0, 1 - f / 40); };` },
  { nome: 'a02a-cidade', seg: 5.8, antes: 40, estilo: 'abre',
    setup: `TR.reset({ time: 22 * 60 + 40 }); TR.drive(900, 1260, 3000, 1260, 200, { lane: 24 }); TR.fixo(1600, 1150, 0.7, 0.86, 1850, 1330);` },
  { nome: 'a02b-logo', seg: D('g02') - 5.74 + 0.2 + 0.9, antes: 30, estilo: 'abre',
    setup: `TR.reset({ time: 23 * 60 + 20 }); TR.drive(2100, 400, 2100, 3800, 200, { lane: 25 }); TR.fixo(2100, 1200, 0.9, 1.0, 2100, 1500);
      TR.card(true, true, 'Mundo aberto · São Gambiarra (ES)'); const lg = TR.ov.querySelector('.tr-logo .logo');
      TR.onFrame = (f) => { TR.blackO = 0.84; TR.logoO = Math.min(1, f / 5, (TR.n - f) / 8); if (lg) lg.style.transform = 'scale(' + (1.3 + 0.4 * Math.max(0, 1 - f / 8)) + ')'; };` },

  /* ================= A CIDADE ================= */
  { nome: 'a03a-cidade', seg: 5.65, antes: 40, estilo: 'rola',
    setup: `TR.reset({ hud: true, time: 20 * 60 + 40 }); TR.drive(900, 2100, 3000, 2100, 220, { lane: 24 }); TR.follow(1.5, 1.7, 0.15);` },
  { nome: 'a03b-centrao', seg: 0.6, antes: 0, placa: true, estilo: 'rola',
    setup: `TR.reset({ placa: true, time: 22 * 60 + 40 }); TR.cruzar('centro', 5, 300, { de: 'vila', perto: [1500, 2600] }); TR.follow(1.3, 1.32, 0.15);` },
  { nome: 'a03c-vila', seg: 0.75, antes: 0, placa: true, estilo: 'rola',
    setup: `TR.reset({ placa: true, time: 22 * 60 + 40 }); TR.cruzar('vila', 5, 300, { de: 'centro', perto: [900, 2600] }); TR.follow(1.3, 1.32, 0.15);` },
  { nome: 'a03d-feiorosa', seg: 0.65, antes: 0, placa: true, estilo: 'rola',
    setup: `TR.reset({ placa: true, time: 23 * 60 }); TR.cruzar('feurosa', 5, 260, { perto: [1100, 6400] }); TR.follow(1.3, 1.32, 0.15);` },
  { nome: 'a03e-carapina', seg: 0.2 + D('g03') - 5.65 - 2.0 + 0.5, antes: 0, placa: true, estilo: 'rola',
    setup: `TR.reset({ placa: true, time: 23 * 60 }); TR.cruzar('carapina', 5, 240, { perto: [3300, 6400], depois: 1400 }); TR.follow(1.3, 1.45, 0.15);` },
  // "Tem a BR-101 e Pouco..." / "a Terceira Ponte e Meia," / "a orla de Camburiso," / "o morro com viela e pagode na laje..." / "e lá longe, a Fazenda Muuuito Longe."
  { nome: 'a04a-br', seg: 2.75, antes: 40, estilo: 'rola',
    setup: `TR.reset({ cam: 3, time: 20 * 60 + 40 }); TR.drive(1450, 6221, 5200, 6221, 520, { lane: 21 }); TR.follow(1.12, 1.22, 0.25);` },
  { nome: 'a04b-ponte', seg: 1.45, antes: 60, estilo: 'rola',
    setup: `TR.reset({ time: 23 * 60 }); TR.drive(4300, 1520, 6600, 1520, 340, { lane: 24, skip: 300 }); TR.follow(1.5, 1.6, 0.12);` },
  { nome: 'a04c-orla', seg: 1.4, antes: 40, estilo: 'rola',
    setup: `TR.reset({ time: 23 * 60 + 50, camOff: [0, 130] }); TR.drive(6400, 8725, 8500, 8725, 280, { lane: 25 }); TR.follow(1.05, 1.15, 0.3);` },
  { nome: 'a04d-viela', seg: 1.0, antes: 20, estilo: 'rola',
    setup: `TR.reset({ time: 23 * 60 + 20 }); const v = World.animalsDef.filter((d) => d.type === 'person' && d.n === 3 && d.rect[2] - d.rect[0] < 14 && d.rect[1] > 6400)[3];
      const cx = (v.rect[0] + v.rect[2]) / 2, cy = (v.rect[1] + v.rect[3]) / 2; player.place(cx + 3000, cy, 0); TR.rail = null; TR.fixo(cx, cy - 50, 2.0, 1.9, cx, cy + 50);` },
  { nome: 'a04e-pagode', seg: 1.6, antes: 30, estilo: 'rola', musica: 0.55,
    setup: `TR.reset({ time: 23 * 60 + 30 }); const pc = World.pracaBagunca; TR.drive(400, 7525, 3300, 7525, 150, { lane: 25 }); TR.fixo(pc.x - 40, pc.y + 20, 1.9, 2.2, 1220, 6990);` },
  { nome: 'a04f-fazenda', seg: 3.6, antes: 20, estilo: 'rola',
    setup: `TR.reset({ hud: true, time: 18 * 60 + 25 }); ${claro} const f = World.shops.find((x) => x.kind === 'fazenda'); TR.chegar(f.x, f.y, ${s(3.0)}, 200); TR.follow(1.5, 1.85, 0.12);` },

  /* ================= A NOSSA CARA: CHUVA, LOMBADA E PARDAL ================= */
  { nome: 'a05a-chuva', seg: 3.9, antes: 60, estilo: 'rola',
    setup: `TR.reset({ rain: 1, time: 22 * 60 }); TR.drive(400, 900, 2750, 900, 190, { lane: 23 }); TR.follow(1.6, 1.75, 0.1);
      TR.onFrame = (f) => { if (f === 30 && TR.rec) { if (!Weather.puddleGrid) Weather.buildPuddles(); const R = TR.rail, q = TR.at(R, R.s + 190 * 2.3), p = { x: q[0], y: q[1], rx: 26, ry: 10, mud: false, cool: 0, ph: 1 }; const C = Weather.puddleCell, k = Math.floor(p.x / C) + ',' + Math.floor(p.y / C); if (!Weather.puddleGrid.has(k)) Weather.puddleGrid.set(k, []); Weather.puddleGrid.get(k).push(p); } };` },
  { nome: 'a05b-lombada', seg: 0.2 + D('g05') - 3.9 + 0.5, antes: 0, estilo: 'rola',
    setup: `TR.reset({ time: 23 * 60 + 5 }); TR.lombada(40, 300, 0.6); TR.follow(2.6, 2.9, 0.05); TR.onBump = () => { TR.flash = 0.18; };` },
  { nome: 'a06-pardal', seg: 0.2 + D('g06') + 0.4, antes: 0, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 40 }); ${sem}
      const R = TR.drive(800, 1500, 4600, 1500, 380, { lane: 24 }); let sx = 0; for (let s = 0; s < R.len; s += 4) if (TR.at(R, s)[0] >= 3003) { sx = s; break; }
      R.s = Math.max(0, sx - 380 * 3.55); R.v = 380; const q = TR.at(R, R.s), q1 = TR.at(R, R.s + 10); player.place(q[0], q[1], Math.atan2(q1[1] - q[1], q1[0] - q[0]));` },

  /* ================= O CELULAR ================= */
  { nome: 'a07-celular', seg: 0.3 + D('g07') + 0.5, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 45 }); TR.drive(1500, 1260, 2600, 1260, 0, { lane: 24, v0: 0 });
      const anel = (id, nome) => () => TR.destacar(document.querySelector('#phone-body .ph-grid [data-app="' + id + '"], #phone-body .ph-dock [data-app="' + id + '"]'), nome, TR.f, TR.f + 42);
      TR.em([
        [${s(0.2)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(1.1)}, () => TR.tocar('#phone-body [data-app="ajustes"]')],
        [${s(1.6)}, () => TR.tocar('#phone-body [data-go="aj-sobre"]')],
        [${s(4.3)}, () => TR.tocar('#phone-body .ph-back')], [${s(4.55)}, () => TR.tocar('#phone-body .ph-back')],
        [${s(5.0)}, anel('mapa', 'mapa')], [${s(5.4)}, anel('msgs', 'WhatsApp')], [${s(6.2)}, anel('pegaai', 'corrida')],
        [${s(7.3)}, anel('fretes', 'fretes')], [${s(7.8)}, anel('racha', 'racha')], [${s(8.6)}, anel('carteira', 'banco')],
      ]);` },

  /* ================= PEGAAÍ ================= */
  { nome: 'a08a-pegaai', seg: 0.2 + D('g08') + 0.3, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 50 }); TR.drive(900, 2100, 2600, 2100, 0, { lane: 24, v0: 0 }); Act.waypoint = null;
      const C = career(); C.lvl = 2; C.xp = xpNeed(2) - 6; C.acc = { comum: true, aero: false, mudanca: false, vip: false }; Act.rideOnline = false;
      TR.fixar(PASSAGEIROS, 'Marcão'); TR.fixar(PG_PICKUP.comum, 1);
      TR.em([
        [${s(0.15)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(0.8)}, () => TR.tocar('#phone-body [data-app="pegaai"]')],
        [${s(2.5)}, () => TR.tocar('#phone-body [data-act2="ride-toggle"]')],
        [${s(3.3)}, () => { TR.fecharCel(); Act.rideT = 0.3; }],
        [${s(3.9)}, () => { const t = __VT.timers.find((t) => String(t.fn).includes('PG_PICKUP')); if (t) t.at = __VT.t + 1600; }],
      ]);` },
  { nome: 'a08b-busca', seg: 3.6, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_EMBARQUE, 5); const R = Act.ride; TR.chegar(R.pick.x, R.pick.y, ${s(2.6)}, 240);` },
  // "Só que aqui cada batida conta. O passageiro reclama, a nota despenca... e o cara ainda manda áudio."
  { nome: 'a09a-batida', seg: 2.0, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_BATIDA, 1); TR.batidaCarro(40, 250, 'hatch');` },
  { nome: 'a09b-batida', seg: 1.9, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_BATIDA, 2); TR.batidaCarro(35, 250, 'van', [player.x + 900, player.y]);` },
  { nome: 'a09c-chegada', seg: 3.4, antes: 0, estilo: 'trampo',
    setup: `const R = Act.ride; R.t = 5; R.hits = Math.max(R.hits || 0, 3); TR.ultima = R; Profile.damage = Math.min(Profile.damage, 30); TR.chegar(R.dest.x, R.dest.y, ${s(0.4)}, 170);
      TR.em([[${s(1.4)}, () => { __VT.timers = __VT.timers.filter((t) => !String(t.fn).includes('angryVoice')); Act.rideOnline = false; Act.rideT = 1e9; }]]);` },
  // o áudio do passageiro (Marcão) no chat do PegaAí, e o comentário depois
  { nome: 'a10-audio', seg: 2.7 + D('p_moqueca') + 0.3 + D('g10') + 0.4, antes: 0, estilo: 'trampo', musica: 0.6,
    setup: `const R = TR.ultima; TR.escolha = (a) => (Array.isArray(a) ? a.find((x) => x && x.clip === 'p_moqueca') : undefined);
      TR.em([
        [${s(0.15)}, () => angryVoice(R, false)],
        [${s(1.0)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(1.4)}, () => TR.tocar('#phone-body [data-app="pegaai"]')],
        [${s(1.8)}, () => TR.tocar('#phone-body [data-pgtab="msgs"]')],
        [${s(2.15)}, () => TR.tocar('#phone-body [data-pgchat="' + R.rid + '"]')],
        [${s(2.7)}, () => TR.tocar('#phone-body .wa-voice')],
      ]);` },

  /* ================= ENTREGA, FRETE E GÁS ================= */
  { nome: 'a11a-moqueca', seg: 2.5, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 52 }); Screens.closeAll(); document.body.classList.remove('tr-bigphone'); const C = career(); C.lvl = 3; C.xp = 20; C.ratings = [2]; Act.ride = null; Act.rideOnline = false;
      const sh = World.shops.find((x) => x.kind === 'moquecaria'); TR.fixar(sh.items, 'Moqueca capixaba'); TR.chegar(sh.x, sh.y, ${s(0.6)}, 200);
      TR.em([[${s(0.8)}, () => TR.tecla('KeyE', 'E', 'pegar entrega')], [${s(1.8)}, () => TR.botao(/Moqueca capixaba/)]]);` },
  { nome: 'a11b-fretes', seg: 1.7, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 54 }); Act.delivery = null; Profile.current = 'gas'; player.setCar('gas'); TR.hook();
      const d = World.depots.gas, ne = nearestEdge(d.x, d.y), e = ne.e; const x = e.a.x + e.dx * ne.s, y = e.a.y + e.dy * ne.s;
      TR.useRail(TR.makeRail([[x - e.dx * 80, y - e.dy * 80], [x + e.dx * 4, y + e.dy * 4]], 20), 0, { v0: 0, skip: 70 });
      TR.em([[${s(0.1)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }], [${s(0.5)}, () => TR.tocar('#phone-body [data-app="fretes"]')], [${s(1.4)}, () => TR.tocar('#phone-body [data-job="0"]')]]);` },
  { nome: 'a11c-gas', seg: 0.15 + D('g11') - 4.2 + 2.6, antes: 0, estilo: 'trampo', musica: 0.35,
    setup: `Screens.closeAll(); document.body.classList.remove('tr-bigphone'); TR.legDir = 0; const J = Act.delivery; J.stage = 'deliver'; GasJingle.t = 0;
      const r = TR.drive(J.pick.x, J.pick.y, J.dest.x, J.dest.y, 190, { lane: 22 }); r.s = r.len * 0.45; r.v = 190; TR.follow(1.35, 1.45, 0.12);` },

  /* ================= PERSONAGENS ================= */
  { nome: 'a12-oficina', seg: 0.6 + D('g12') + 0.6, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 40 }); Act.delivery = null; Profile.current = 'brasa'; player.setCar('brasa'); TR.hook();
      Profile.damage = 42; Profile.zones = { f: 0.6, r: 0.25, l: 0.45, rt: 0.1, seed: 3 }; Profile.money = 90; Profile.fiado = null; Profile.visited = World.shops.map((x) => x.id);
      const of = World.shops.find((x) => x.kind === 'oficina'); TR.chegar(of.x, of.y, ${s(0.5)}, 150);
      const fb = () => [...document.querySelectorAll('#dialog-buttons button')].find((b) => /fiado/i.test(b.textContent));
      TR.em([[${s(0.9)}, () => TR.tecla('KeyE', 'E', 'oficina')], [${s(5.5)}, () => TR.destacar(fb(), 'fiado', TR.f, TR.f + 60, false)], [${s(7.0)}, () => TR.tocar(fb())]]);` },
  { nome: 'a13-biu', seg: 0.3 + 5.9 + D('biu_socorro') + 0.3 + 0.9, antes: 10, estilo: 'baile', musica: 0.6,
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 48 }); Screens.closeAll(); TR.drive(1500, 6221, 4000, 6221, 0, { lane: 21, v0: 0 }); Profile.money = Math.max(Profile.money, 900);
      TR.charCard('Seu Biu', 'Caminhoneiro · tomba toda semana', '#f1c40f', ${s(0.4)}, TR.drawSeuBiu);
      TR.em([
        [${s(0.2)}, () => { for (let i = 0; i < 60; i++) { Events.clear(); if (Events.spawn('banana')) break; } Events.cur.life = 1e9; }],
        [${s(2.9)}, () => { TR.char = null; TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(3.4)}, () => TR.tocar('#phone-body [data-app="msgs"]')],
        [${s(3.9)}, () => TR.tocar('#phone-body [data-chat="' + BIU + '"]')],
        [${s(6.2)}, () => TR.tocar('#phone-body .wa-voice')],
        [${s(6.5 + D('biu_socorro'))}, () => { TR.tocar('#phone-body [data-reply="0"]'); TR.cada = () => { const l = document.querySelector('#phone-body .wa-loc'); if (TR.rec && l && !TR._locFeito) { TR._locFeito = true; setTimeout(() => TR.tocar(l), 450); } }; }],
      ]);` },
  { nome: 'a14-bananas', seg: 0.2 + D('g14') + 0.9, antes: 0, estilo: 'baile',
    setup: `Screens.closeAll(); document.body.classList.remove('tr-bigphone'); TR.legDir = 0; const E = Events.cur; E.stage = 'collect';
      const e = E.edge, h = e.a.y === e.b.y, lado = h ? Math.sign(E.y - e.a.y) : Math.sign(e.a.x - E.x), ida = lado <= 0 ? 1 : -1, x0 = h ? E.x - ida * 330 : e.a.x, y0 = h ? e.a.y : E.y - ida * 330;
      TR.drive(x0, y0, h ? x0 + ida * 1500 : x0, h ? y0 : y0 + ida * 1500, 120, { lane: 24, v0: 120 }); TR.follow(1.6, 1.75, 0.08);
      const R = TR.rail; E.crates.forEach((c, k) => { const q = TR.at(R, R.s + 60 + k * 52); c.x = q[0]; c.y = q[1]; c.got = false; });` },
  // "Tem também o Banestresse, o banco que estressa. Atrasou a parcela? Os juros trabalham por você."
  { nome: 'a15-banco', seg: 0.2 + D('g15') + 0.8, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 44 }); Events.clear(); Profile.loan = null; Profile.money = 120; TR.drive(1500, 1260, 2600, 1260, 0, { lane: 24, v0: 0 });
      TR.em([
        [${s(0.1)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(0.5)}, () => TR.tocar('#phone-body [data-app="carteira"]')],
        [${s(1.0)}, () => TR.tocar('#phone-body [data-wtab="loan"]')],
        [${s(1.6)}, () => TR.tocar('#phone-body [data-lamt="1000"]')],
        [${s(2.3)}, () => TR.tocar('#phone-body [data-loan="8"]')],
        [${s(3.4)}, () => { const L = Profile.loan; if (L) { L.billed = 2; L.overdue = L.parcela; } Profile.money = 0; Finance.newDay(); }],
        [${s(3.6)}, () => TR.tocar('#phone-body .ph-back')],
        [${s(4.0)}, () => TR.tocar('#phone-body [data-app="msgs"]')],
        [${s(4.5)}, () => TR.tocar('#phone-body [data-chat="' + BANK + '"]')],
      ]);` },

  /* ================= EVENTOS ================= */
  { nome: 'a16a-noivo', seg: 3.8, antes: 30, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 46 }); Screens.closeAll(); document.body.classList.remove('tr-bigphone'); TR.legDir = 0; Profile.loan = null; Profile.money = 980;
      TR.drive(500, 3300, 1900, 3300, 190, { lane: 24 });
      TR.em([[${s(0.6)}, () => { for (let i = 0; i < 60; i++) { Events.clear(); if (Events.spawn('noivo')) break; } Events.cur.life = 1e9; }], [${s(3.0)}, () => TR.tocar('#ev-offer .evo-yes')]]);` },
  { nome: 'a16b-blitz', seg: 1.3, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 50 }); const E = TR.spawnEv('blitz', 1600, 3880); TR.chegar(E.x, E.y, ${s(1.0)}, 190);` },
  { nome: 'a16c-arraia', seg: 1.3, antes: 20, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 30 }); const E = TR.spawnEv('festa', 1500, 3300); E.party = true; E.stage = 'wait'; player.place(E.x + 3000, E.y + 3000, 0); TR.rail = null; TR.fixo(E.x, E.y, 2.0, 2.3);` },
  { nome: 'a16d-chupeta', seg: 0.2 + D('g16') - 6.4 + 1.0, antes: 24, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 50 }); const E = TR.spawnEv('quebrado', 1600, 2700); E.kind = 'bateria'; E.stage = 'fix'; E.smoke = 0; E.hold = 0.2;
      const px = E.x - Math.cos(E.a) * 47, py = E.y - Math.sin(E.a) * 47; player.place(px, py, E.a); TR.rail = null; TR.fixo((E.x + px) / 2, (E.y + py) / 2, 2.7, 3.0);` },

  /* ================= RACHA (a contagem do jogo bate com "Três... dois... um... VAI!") ================= */
  { nome: 'a17a-convite', seg: 2.4, antes: 20, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 22 * 60 + 1 }); Profile.rachaMsg = false; ${sem} TR.drive(1800, 6179, 5200, 6179, 300, { lane: 21 });` },
  { nome: 'a17b-racha', seg: 1.4 + 2.5 + 2.4, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 22 * 60 + 3 }); ${sem} Profile.money = Math.max(Profile.money, 900); const r = World.rachas.find((x) => x.id === 'arrancada');
      const R = TR.drive(r.start[0], r.start[1], r.pts[r.pts.length - 1][0], r.pts[r.pts.length - 1][1], 0, { lane: 0, v0: 0 }); TR.follow(1.7, 1.55, 0.2);
      TR.slow = () => (Act.race && Act.race.count > 0 ? 1.38 : 1); TR.cada = () => { ${sem} };
      TR.em([[${s(1.4)}, () => { TR.tecla('KeyE', 'E', 'racha'); R.speed = 440; }]]);` },

  /* ================= GARAGEM E PAREDÃO ================= */
  { nome: 'a18a-garagem', seg: 6.6, antes: 6, estilo: 'fecha',
    setup: `TR.reset({ time: 20 * 60 + 55 }); Profile.money = 4850; Garage.sel = 'brasa'; Garage.tab = 'kit'; Garage.cat = 'paint'; Garage.preview = {}; Garage.previewColor = null; Screens.open('screen-garage'); Garage.render();
      const cat = (id) => () => TR.tocar('[data-kcat="' + id + '"]'); const opt = (n) => () => { const o = document.querySelectorAll('#garage-tab [data-kopt], #garage-tab [data-kcol]'); if (o[n]) TR.tocar(o[n]); };
      TR.em([
        [${s(2.7)}, cat('paint')], [${s(2.95)}, opt(3)], [${s(3.2)}, cat('wheels')], [${s(3.45)}, opt(2)],
        [${s(3.75)}, cat('neon')], [${s(4.0)}, opt(2)], [${s(4.5)}, cat('low')], [${s(4.75)}, opt(1)], [${s(5.4)}, cat('spoiler')], [${s(5.65)}, opt(1)],
      ]);` },
  { nome: 'a18b-paredao', seg: 0.2 + D('g18') - 6.6 + 2.6, antes: 20, estilo: 'fecha', musica: 0.12,
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 57 }); Screens.closeAll(); const pc = World.pracaBagunca, ne = nearestEdge(pc.x, pc.y), e = ne.e;
      const x = e.a.x + e.dx * ne.s - e.dy * 24, y = e.a.y + e.dy * ne.s + e.dx * 24; player.place(x, y, Math.atan2(e.dy, e.dx)); TR.rail = null; carLife().bat = 100;
      TR.people(12, x, y, 66); TR.fixo(x, y, 2.3, 2.55); TR.em([[${s(0.3)}, () => TR.tecla('KeyB', 'B', 'paredão')]]);` },

  /* ================= FECHAMENTO ================= */
  { nome: 'a19a-final', seg: 2.2, antes: 40, estilo: 'fecha',
    setup: `TR.reset({ time: 23 * 60 + 50, camOff: [0, 130] }); TR.drive(6400, 8725, 8500, 8725, 280, { lane: 25 }); TR.follow(1.05, 1.2, 0.3);` },
  { nome: 'a19b-final', seg: 2.2, antes: 40, estilo: 'fecha',
    setup: `TR.reset({ rain: 1, time: 22 * 60 }); TR.drive(400, 1500, 2700, 1500, 300, { lane: 25 }); TR.follow(2.1, 2.3, 0.08);` },
  { nome: 'a19c-final', seg: 0.2 + D('g19') - 4.4 + 0.5, antes: 50, estilo: 'fecha',
    setup: `TR.reset({ time: 23 * 60 + 45 }); TR.drive(4400, 7475, 400, 7475, 400, { lane: 25 }); TR.slow = 0.45; TR.follow(2.4, 1.6, 0.12);
      TR.caption('Comenta aí', 'O que não pode faltar num GTA capixaba?', 6, TR.n - 4);` },
  { nome: 'a20-logo', seg: 0.3 + D('g20') + 1.7, antes: 0, estilo: 'fecha',
    setup: `TR.reset({ time: 23 * 60 + 59 }); Screens.closeAll(); TR.rail = null; TR.final(0); TR.flash = 0.6; TR.inscreva(${s(0.6)});
      TR.onFrame = (f) => { TR.blackO = f < TR.n - 26 ? 0 : Math.min(1, (f - (TR.n - 26)) / 24); };` },
];

// narração (g..) e vozes do jogo (jogo: true), presas a uma cena com atraso t (segundos; pode ser negativo)
const falas = [
  { id: 'g01', cena: 'a01-gancho', t: 0.4 },
  { id: 'g02', cena: 'a02a-cidade', t: 0.2 },
  { id: 'g03', cena: 'a03a-cidade', t: 0.2 },
  { id: 'g04', cena: 'a04a-br', t: 0.15 },
  { id: 'g05', cena: 'a05a-chuva', t: 0.2 },
  { id: 'g06', cena: 'a06-pardal', t: 0.2 },
  { id: 'g07', cena: 'a07-celular', t: 0.3 },
  { id: 'g08', cena: 'a08a-pegaai', t: 0.2 },
  { id: 'g09', cena: 'a09a-batida', t: 0.1 },
  { id: 'p_moqueca', cena: 'a10-audio', t: 2.7 + 0.02, jogo: true },
  { id: 'g10', cena: 'a10-audio', t: 2.7 + D('p_moqueca') + 0.3 },
  { id: 'g11', cena: 'a11a-moqueca', t: 0.15 },
  { id: 'g12', cena: 'a12-oficina', t: 0.6 },
  { id: 'g13', cena: 'a13-biu', t: 0.3 },
  { id: 'biu_socorro', cena: 'a13-biu', t: 6.2 + 0.02, jogo: true },
  { id: 'g14', cena: 'a14-bananas', t: 0.2 },
  { id: 'g15', cena: 'a15-banco', t: 0.2 },
  { id: 'g16', cena: 'a16a-noivo', t: 0.2 },
  // "Três" cai 3,67 s depois do começo da fala; o "3" aparece na tela 0,29 s depois do E (quadro 1,4 s da cena)
  { id: 'g17', cena: 'a17b-racha', t: 1.4 + 0.29 - 3.67 },
  { id: 'g18', cena: 'a18a-garagem', t: 0.2 },
  { id: 'g19', cena: 'a19a-final', t: 0.2 },
  { id: 'g20', cena: 'a20-logo', t: 0.3 },
];

module.exports = { cenas, falas };

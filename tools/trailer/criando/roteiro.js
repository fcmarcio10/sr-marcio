// Vídeo do YouTube "Estou criando um jogo de carro que se passa no Brasil" (horizontal, ~6:40).
// Abre com um trailer rápido (sem narração) e depois o criador mostra tudo o que o jogo já tem, parte por parte.
// Narração em primeira pessoa (voz/gXX.mp3, voz Jonas) + vozes do próprio jogo: clientes reclamando no chat do PegaAí,
// Seu Zé cobrando o fiado no zap e o DJ Biruta na rádio. Sem legenda (pedido do dono).
// Cada cena: nome, seg (duração em segundos), setup (roda dentro do jogo). estilo = trecho da música (gameplay/mix.py:
// oitenta, abre, rola, trampo, baile, fecha), musica = volume da trilha na cena.
// Tudo o que aparece é o jogo funcionando: o roteiro só escolhe onde o carro anda, em que botão toca e que tecla aperta.
const F = require('./narra/falas.json');
const D = (id) => F[id].dur;
const s = (t) => Math.round(t * 60); // segundos -> quadro
const sem = `for (const c of Traffic.cars) if (c.model === 'police') { c.release(); c.dead = true; } Traffic.cars = Traffic.cars.filter((c) => !c.dead);`;
const claro = `canvas.style.filter = 'contrast(1.06) saturate(1.2) brightness(1.3)';`; // fazenda (é escura no jogo)
const poca = (frente) => `if (!Weather.puddleGrid) Weather.buildPuddles(); { const R = TR.rail, q = TR.at(R, R.s + ${frente}), p = { x: q[0], y: q[1], rx: 26, ry: 10, mud: false, cool: 0, ph: 1 }; const C = Weather.puddleCell, k = Math.floor(p.x / C) + ',' + Math.floor(p.y / C); if (!Weather.puddleGrid.has(k)) Weather.puddleGrid.set(k, []); Weather.puddleGrid.get(k).push(p); }`;
const opala = `Profile.current = 'brasa'; player.setCar('brasa'); TR.hook();`;
const gasCar = `Profile.current = 'gas'; player.setCar('gas'); TR.hook();`;
const racha = (skip) => `${sem} const r = World.rachas.find((x) => x.id === 'arrancada');
  TR.drive(r.start[0], r.start[1], r.pts[r.pts.length - 1][0], r.pts[r.pts.length - 1][1], 460, { lane: 0, v0: ${skip ? 420 : 0}, skip: ${skip || 0} });
  Profile.money = Math.max(Profile.money, 5000); startRacha(r); Act.race.count = 0; Act.race.t = ${skip ? (skip / 360).toFixed(2) : 0}; TR.onFrame = () => { ${sem} };`;
// chat do PegaAí: abre o celular, entra na conversa do passageiro e toca o áudio (no quadro "voz")
const chatPg = (rid, voz) => `[${s(0.3)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
  [${s(0.8)}, () => TR.tocar('#phone-body [data-app="pegaai"]')],
  [${s(1.25)}, () => TR.tocar('#phone-body [data-pgtab="msgs"]')],
  [${s(1.7)}, () => TR.tocar('#phone-body [data-pgchat="' + ${rid} + '"]')],
  [${s(voz)}, () => TR.tocar('#phone-body .wa-voice')],`;
// passageiro que reclama por áudio (a fala escolhida é a do arquivo pedido)
const bravo = (rid, nome, tipo, hits, clip) => `{ const R = { rid: ${rid}, name: '${nome}', type: '${tipo}', hits: ${hits}, t: 0 }; TR.escolha = (a) => (Array.isArray(a) ? a.find((x) => x && x.clip === '${clip}') : undefined); angryVoice(R, false); TR.escolha = null; }`;

const cenas = [
  /* ================= TRAILER RÁPIDO (sem narração) ================= */
  { nome: 't01-orla', seg: 2.3, antes: 40, estilo: 'oitenta', musica: 2.6,
    setup: `TR.reset({ time: 23 * 60 + 50, camOff: [0, 130], flash: 0.6 }); ${opala} TR.drive(6400, 8725, 8500, 8725, 320, { lane: 25 }); TR.follow(1.1, 1.3, 0.3);
      TR.onFrame = (f) => { TR.blackO = Math.max(0, 1 - f / 18); };` },
  { nome: 't02-racha', seg: 2.3, antes: 10, estilo: 'oitenta', musica: 2.6,
    setup: `TR.reset({ hud: true, time: 23 * 60 + 40, flash: 0.5 }); ${opala} ${racha(900)} TR.follow(2.2, 1.9, 0.12);` },
  { nome: 't03-banana', seg: 2.6, antes: 0, estilo: 'oitenta', musica: 2.6,
    setup: `TR.reset({ hud: true, time: 26 * 60 + 14, flash: 0.5 }); Profile.current = 'pampeiro'; player.setCar('pampeiro'); TR.hook();
      const E = TR.spawnEv('banana', 3400, 6221); E.stage = 'collect'; TR.casca(E, 170, 30); TR.follow(2.1, 2.4, 0.08); TR.slow = () => (TR.girando ? 0.5 : 1);` },
  { nome: 't04-gas', seg: 2.0, antes: 20, estilo: 'oitenta', musica: 2.6,
    setup: `TR.reset({ hud: true, time: 22 * 60 + 40, flash: 0.5 }); ${gasCar} startJob(genJob('gas')); const J = Act.delivery; J.stage = 'deliver'; GasJingle.t = 0;
      const r = TR.drive(J.pick.x, J.pick.y, J.dest.x, J.dest.y, 220, { lane: 22 }); r.s = r.len * 0.3; r.v = 220; TR.follow(1.7, 1.9, 0.14);` },
  { nome: 't05-garagem', seg: 2.2, antes: 6, estilo: 'oitenta', musica: 2.6,
    setup: `TR.reset({ bigGar: true, flash: 0.5 }); Garage.sel = 'brasa'; Garage.tab = 'kit'; Garage.cat = 'neon'; Garage.preview = {}; Garage.previewColor = null; Screens.open('screen-garage'); Garage.render();
      let i = 0; const neon = ['#ff2bd6', '#39ff6a', '#ffcc2e', '#22d1ff']; TR.onFrame = (f) => { if (TR.rec && f % 28 === 1) { Garage.preview.neon = neon[i++ % 4]; TR.flash = 0.25; Garage.render(); } };` },
  { nome: 't06-chuva', seg: 2.4, antes: 40, estilo: 'oitenta', musica: 2.6,
    setup: `TR.reset({ hud: true, rain: 1, time: 22 * 60, flash: 0.4 }); Screens.closeAll(); ${opala} TR.drive(400, 900, 2750, 900, 280, { lane: 23 }); TR.follow(2.5, 2.85, 0.08); TR.slow = 0.35;
      TR.onFrame = (f) => { if (f === 1 && TR.rec) { ${poca(22)} } };` },
  { nome: 't07-batida', seg: 2.0, antes: 0, estilo: 'oitenta', musica: 2.6,
    setup: `TR.reset({ hud: true, time: 21 * 60, flash: 0.4 }); ${opala} TR.batidaCarro(34, 260, 'hatch', [2400, 3300]); TR.follow(2.2, 2.5, 0.1); TR.slow = (f) => (f > 32 && f < 70 ? 0.45 : 1);` },
  { nome: 't08-paredao', seg: 2.2, antes: 20, estilo: 'oitenta', musica: 2.6,
    setup: `TR.reset({ hud: true, time: 20 * 60 + 57, flash: 0.4 }); ${opala} const pc = World.pracaBagunca, ne = nearestEdge(pc.x, pc.y), e = ne.e;
      const x = e.a.x + e.dx * ne.s - e.dy * 24, y = e.a.y + e.dy * ne.s + e.dx * 24; player.place(x, y, Math.atan2(e.dy, e.dx)); TR.rail = null; carLife().bat = 100; carKit('brasa').sound = true; Som.on = true;
      TR.people(12, x, y, 66); TR.fixo(x, y, 2.3, 2.6);` },
  { nome: 't09-titulo', seg: 2.6, antes: 30, estilo: 'oitenta', musica: 2.6,
    setup: `TR.reset({ time: 23 * 60 + 20, flash: 0.8 }); Som.on = false; TR.drive(2100, 400, 2100, 3800, 200, { lane: 25 }); TR.fixo(2100, 1200, 0.9, 1.0, 2100, 1500);
      TR.card(true, true, 'Mundo aberto · São Gambiarra'); const lg = TR.ov.querySelector('.tr-logo .logo');
      TR.onFrame = (f) => { TR.blackO = 0.84; TR.logoO = Math.min(1, f / 5, (TR.n - f) / 8); if (lg) lg.style.transform = 'scale(' + (1.3 + 0.4 * Math.max(0, 1 - f / 8)) + ')'; };` },

  /* ================= ABERTURA: "Eu tô criando um jogo de carro..." ================= */
  { nome: 'c01-gancho', seg: 0.3 + D('g01') + 0.3, antes: 40, estilo: 'oitenta',
    setup: `TR.reset({ lb: 110, time: 23 * 60 + 20 }); ${opala} TR.drive(1450, 6221, 5200, 6221, 470, { lane: 21 }); TR.follow(2.4, 1.4, 0.2);` },
  { nome: 'c02-nome', seg: 0.2 + D('g02') + 0.5, antes: 40, estilo: 'oitenta',
    setup: `TR.reset({ time: 22 * 60 + 40 }); TR.drive(900, 1260, 3000, 1260, 200, { lane: 24 }); TR.fixo(1600, 1150, 0.72, 0.9, 1850, 1330);
      TR.card(true, true, 'Mundo aberto · São Gambiarra'); const lg = TR.ov.querySelector('.tr-logo .logo');
      TR.onFrame = (f) => { const k = f < ${s(3.4)} ? 1 : Math.max(0, 1 - (f - ${s(3.4)}) / 20); TR.blackO = 0.8 * k; TR.logoO = Math.min(1, f / 6) * k; if (lg) lg.style.transform = 'scale(' + (1.3 + 0.3 * Math.max(0, 1 - f / 10)) + ')'; };` },

  /* ================= A CIDADE E O CARRO ================= */
  { nome: 'c03a-aerea', seg: 3.0, antes: 40, estilo: 'rola',
    setup: `TR.reset({ time: 22 * 60 + 40 }); TR.drive(500, 1260, 2700, 1260, 140, { lane: 24 }); TR.fixo(1600, 1150, 0.75, 0.88, 1850, 1330);
      TR.hora('A cidade', 'São Gambiarra', 6, ${s(2.6)}, true);` },
  { nome: 'c03b-br', seg: 1.8, antes: 40, estilo: 'rola',
    setup: `TR.reset({ cam: 3, time: 20 * 60 + 40 }); ${opala} TR.drive(1450, 6221, 5200, 6221, 520, { lane: 21 }); TR.follow(1.12, 1.22, 0.25);` },
  { nome: 'c03c-praia', seg: 1.8, antes: 40, estilo: 'rola',
    setup: `TR.reset({ time: 23 * 60 + 50, camOff: [0, 130] }); TR.drive(6400, 8725, 8500, 8725, 280, { lane: 25 }); TR.follow(1.05, 1.15, 0.3);` },
  { nome: 'c03d-morro', seg: 1.6, antes: 30, estilo: 'rola',
    setup: `TR.reset({ time: 23 * 60 + 30 }); const pc = World.pracaBagunca; TR.drive(400, 7525, 3300, 7525, 150, { lane: 25 }); TR.fixo(pc.x - 40, pc.y + 20, 1.9, 2.2, 1220, 6990);` },
  { nome: 'c03e-fazenda', seg: 0.2 + D('g03') - 8.2 + 0.6, antes: 20, estilo: 'rola',
    setup: `TR.reset({ hud: true, time: 18 * 60 + 25, camOff: [0, 90] }); ${claro} const f = World.shops.find((x) => x.kind === 'fazenda'); TR.chegar(f.x, f.y, ${s(2.0)}, 200); TR.follow(1.5, 1.85, 0.12);` },
  { nome: 'c04a-dirigir', seg: 5.0, antes: 40, estilo: 'rola',
    setup: `TR.reset({ hud: true, time: 20 * 60 + 40 }); ${opala} TR.drive(900, 2100, 3000, 2100, 240, { lane: 24 }); TR.follow(1.5, 1.75, 0.15);` },
  { nome: 'c04b-transito', seg: 0.2 + D('g04') - 5.0 + 0.5, antes: 40, estilo: 'rola',
    setup: `TR.reset({ hud: true, time: 18 * 60 + 40 }); ${opala} TR.drive(1500, 3300, 3400, 3300, 200, { lane: 24 }); TR.follow(1.9, 2.1, 0.12);` },
  { nome: 'c05-chuva', seg: 0.2 + D('g05') + 0.5, antes: 60, estilo: 'rola',
    setup: `TR.reset({ hud: true, rain: 1, time: 22 * 60 }); ${opala} TR.drive(400, 900, 2750, 900, 190, { lane: 23 }); TR.follow(1.6, 1.85, 0.1);
      TR.slow = (f) => (f > ${s(3.6)} && f < ${s(6.2)} ? 0.45 : 1); TR.onFrame = (f) => { if (f === ${s(2.4)} && TR.rec) { ${poca(170)} } };` },
  { nome: 'c06a-lombada', seg: 4.0, antes: 0, estilo: 'rola',
    setup: `TR.reset({ time: 23 * 60 + 5 }); ${opala} TR.lombada(40, 300, 0.55); TR.follow(2.6, 2.9, 0.05); TR.onBump = () => { TR.flash = 0.18; };` },
  { nome: 'c06b-amassado', seg: 0.2 + D('g06') - 4.0 + 0.8, antes: 0, estilo: 'rola',
    setup: `TR.reset({ hud: true, time: 21 * 60 }); ${opala} TR.batidaCarro(30, 250, 'van', [2400, 3300]); TR.follow(2.3, 2.9, 0.06); TR.slow = (f) => (f > 28 && f < 70 ? 0.5 : 1);` },

  /* ================= PEGAAÍ ================= */
  { nome: 'c07-pegaai', seg: 0.3 + D('g07') + 0.4, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 50 }); ${opala} TR.drive(900, 2100, 2600, 2100, 0, { lane: 24, v0: 0 }); Act.waypoint = null;
      const C = career(); C.lvl = 2; C.xp = 20; C.acc = { comum: true, aero: false, mudanca: false, vip: false }; Act.rideOnline = false;
      TR.hora('PegaAí', 'o app de corrida', 6, ${s(2.0)}, true);
      TR.em([[${s(3.4)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }], [${s(4.6)}, () => TR.tocar('#phone-body [data-app="pegaai"]')]]);` },
  { nome: 'c08a-online', seg: 3.0, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(PASSAGEIROS, 'Marcão'); TR.fixar(PG_PICKUP.comum, 1);
      TR.em([[${s(0.6)}, () => TR.tocar('#phone-body [data-act2="ride-toggle"]')], [${s(1.8)}, () => { TR.fecharCel(); Act.rideT = 0.3; }],
        [${s(2.4)}, () => { const t = __VT.timers.find((t) => String(t.fn).includes('PG_PICKUP')); if (t) t.at = __VT.t + 1600; }]]);` },
  { nome: 'c08b-busca', seg: 0.2 + D('g08') - 3.0 + 0.5, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_EMBARQUE, 5); const R = Act.ride; if (R) TR.chegar(R.pick.x, R.pick.y, ${s(3.0)}, 240);` },
  { nome: 'c09a-batida', seg: 2.2, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_BATIDA, 1); TR.batidaCarro(40, 250, 'hatch');` },
  { nome: 'c09b-batida', seg: 0.1 + D('g09') - 2.2 + 0.5, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_BATIDA, 2); TR.batidaCarro(35, 250, 'van', [player.x + 900, player.y]);` },
  // os áudios dos passageiros no chat do PegaAí (três conversas criadas de uma vez; o celular fica aberto entre elas)
  { nome: 'c10-audio1', seg: 2.3 + D('xingo2') + 0.5, antes: 0, estilo: 'trampo', musica: 0.6,
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 58 }); ${opala} TR.drive(900, 2100, 2600, 2100, 0, { lane: 24, v0: 0 }); Act.ride = null; Act.rideOnline = false; Act.rideT = 1e9;
      ${bravo(701, 'Seu Tonho', 'comum', 3, 'p_uai')} ${bravo(702, 'Dona Rosa', 'comum', 1, 'p_bah')} ${bravo(703, 'Dona Cida', 'comum', 1, 'xingo2')}
      document.getElementById('toasts').innerHTML = '';
      TR.em([${chatPg(703, 2.3)}]);` },
  { nome: 'c11-mineiro', seg: 0.2 + D('g10') + 0.4 + D('p_uai') + 0.5, antes: 0, estilo: 'trampo', musica: 0.6,
    setup: `TR.em([[${s(0.5)}, () => TR.tocar('#phone-body [data-pgback="1"]')], [${s(1.4)}, () => TR.tocar('#phone-body [data-pgchat="701"]')],
      [${s(0.2 + D('g10') + 0.4)}, () => TR.tocar('#phone-body .wa-voice')]]);` },
  { nome: 'c12-gaucha', seg: 0.2 + D('g11') + 0.5 + D('p_bah') + 0.5, antes: 0, estilo: 'trampo', musica: 0.6,
    setup: `TR.em([[${s(0.4)}, () => TR.tocar('#phone-body [data-pgback="1"]')], [${s(1.2)}, () => TR.tocar('#phone-body [data-pgchat="702"]')],
      [${s(0.2 + D('g11') + 0.5)}, () => TR.tocar('#phone-body .wa-voice')]]);` },
  { nome: 'c13a-estrela', seg: 4.2, antes: 30, estilo: 'trampo',
    setup: `TR.reset({ hud: true, time: 20 * 60 + 24 }); ${opala} Profile.damage = 30; Profile.zones = { f: 0.5, r: 0.2, l: 0.3, rt: 0.1, seed: 3 }; TR.drive(500, 2100, 2700, 2100, 160, { lane: 24 }); TR.follow(2.4, 2.2, 0.1);
      TR.estrelas(1, '"Carrinho de bate-bate."', ${s(1.8)}, TR.n, '50%', '42%');` },
  { nome: 'c13b-categorias', seg: 0.2 + D('g12') - 4.2 + 0.3, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 50 }); ${opala} TR.drive(900, 2100, 2600, 2100, 0, { lane: 24, v0: 0 }); const C = career(); C.lvl = 7; C.acc = { comum: true, aero: true, mudanca: true, vip: true };
      const anel = (id, nome) => () => TR.destacar('#phone-body [data-rcat="' + id + '"]', nome, TR.f, TR.f + 150, false);
      TR.em([[${s(0.2)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }], [${s(0.8)}, () => TR.tocar('#phone-body [data-app="pegaai"]')],
        [${s(2.4)}, anel('aero', 'aeroporto')], [${s(4.2)}, anel('vip', 'VIP')], [${s(6.0)}, anel('mudanca', 'mudança')]]);` },
  { nome: 'c13c-mudanca', seg: 2.3 + D('mudanca') + 0.5, antes: 0, estilo: 'trampo', musica: 0.6,
    setup: `TR.reset({ hud: true, bigPhone: true, time: 21 * 60 + 5 }); ${opala} TR.drive(900, 2100, 2600, 2100, 0, { lane: 24, v0: 0 }); Act.ride = null;
      ${bravo(704, 'Dona Neide', 'mudanca', 2, 'mudanca')}
      TR.em([${chatPg(704, 2.3)}]);` },

  /* ================= FRETES E GÁS ================= */
  { nome: 'c14a-fretes', seg: 0.2 + D('g13') + 0.4, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 54 }); Act.delivery = null; ${gasCar}
      const d = World.depots.gas, ne = nearestEdge(d.x, d.y), e = ne.e; const x = e.a.x + e.dx * ne.s, y = e.a.y + e.dy * ne.s;
      TR.useRail(TR.makeRail([[x - e.dx * 80, y - e.dy * 80], [x + e.dx * 4, y + e.dy * 4]], 20), 0, { v0: 0, skip: 70 });
      TR.hora('Fretes', 'baú, guincho e gás', 6, ${s(1.8)}, true);
      TR.em([[${s(2.0)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }], [${s(2.6)}, () => TR.tocar('#phone-body [data-app="fretes"]')], [${s(5.2)}, () => TR.tocar('#phone-body [data-job="0"]')]]);` },
  { nome: 'c14b-gas', seg: 0.2 + D('g14') + 1.2, antes: 0, estilo: 'trampo', musica: 0.35,
    setup: `Screens.closeAll(); document.body.classList.remove('tr-bigphone'); TR.legDir = 0; if (!Act.delivery) startJob(genJob('gas')); const J = Act.delivery; J.stage = 'deliver'; GasJingle.t = 0;
      const r = TR.drive(J.pick.x, J.pick.y, J.dest.x, J.dest.y, 190, { lane: 22 }); r.s = r.len * 0.45; r.v = 190; TR.follow(1.35, 1.5, 0.12);` },

  /* ================= EVENTOS NA RUA ================= */
  { nome: 'c15-madrugada', seg: 0.2 + D('g15') + 0.3, antes: 40, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 26 * 60 + 5 }); Act.delivery = null; ${opala} TR.drive(1450, 6221, 5200, 6221, 380, { lane: 21 }); TR.follow(1.4, 1.6, 0.2);
      TR.hora('Eventos', 'a madrugada é imprevisível', 6, ${s(2.0)}, true);
      TR.em([[${s(2.6)}, () => { for (let i = 0; i < 60; i++) { Events.clear(); if (Events.spawn('noivo')) break; } if (Events.cur) Events.cur.life = 1e9; }]]);` },
  { nome: 'c16-biu', seg: 0.2 + D('g16') + 1.0, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 26 * 60 + 8 }); ${opala} TR.drive(1500, 6221, 4000, 6221, 0, { lane: 21, v0: 0 });
      TR.em([
        [${s(0.1)}, () => { for (let i = 0; i < 60; i++) { Events.clear(); if (Events.spawn('banana')) break; } Events.cur.life = 1e9; }],
        [${s(1.6)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(2.2)}, () => TR.tocar('#phone-body [data-app="msgs"]')],
        [${s(2.8)}, () => TR.tocar('#phone-body [data-chat="' + BIU + '"]')],
      ]);` },
  // recolhe as caixas e, no "escorrega MESMO", roda na casca de banana
  { nome: 'c17-bananas', seg: 0.2 + D('g17') + 0.9, antes: 0, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 26 * 60 + 12 }); Screens.closeAll(); document.body.classList.remove('tr-bigphone'); TR.legDir = 0; Profile.current = 'pampeiro'; player.setCar('pampeiro'); TR.hook();
      const E = TR.spawnEv('banana', 3400, 6221); E.stage = 'collect'; TR.casca(E, 150, ${s(0.2 + D('g17') - 2.0)}); TR.follow(1.9, 2.2, 0.08); TR.slow = () => (TR.girando ? 0.55 : 1);` },
  { nome: 'c18a-chupeta', seg: 3.0, antes: 24, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 50 }); TR.giro = null; ${opala} const E = TR.spawnEv('quebrado', 1600, 2700); E.kind = 'bateria'; E.stage = 'fix'; E.smoke = 0; E.hold = 0.2;
      const px = E.x - Math.cos(E.a) * 47, py = E.y - Math.sin(E.a) * 47; player.place(px, py, E.a); TR.rail = null; TR.fixo((E.x + px) / 2, (E.y + py) / 2, 2.7, 3.0);` },
  { nome: 'c18b-noivo', seg: 3.0, antes: 30, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 46 }); ${opala} TR.drive(500, 3300, 1900, 3300, 190, { lane: 24 });
      TR.em([[${s(0.3)}, () => { for (let i = 0; i < 60; i++) { Events.clear(); if (Events.spawn('noivo')) break; } Events.cur.life = 1e9; }], [${s(2.3)}, () => TR.tocar('#ev-offer .evo-yes')]]);` },
  { nome: 'c18c-carona', seg: 0.2 + D('g18') - 6.0 + 0.6, antes: 20, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 30 }); ${opala} const E = TR.spawnEv('carona', 2500, 6221); E.stage = 'wait'; TR.chegar(E.pick.x, E.pick.y, ${s(1.6)}, 170); TR.fixo(E.npc.x, E.npc.y, 2.5, 2.8);` },

  /* ================= FAZENDA E RALI ================= */
  { nome: 'c19-fazenda', seg: 0.2 + D('g19') + 0.4, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, bigDlg: true, time: 18 * 60 + 25 }); ${claro} ${opala}
      const f = World.shops.find((x) => x.kind === 'fazenda'); TR.fixar(f.items, 'Queijo da fazenda'); TR.chegar(f.x, f.y, ${s(3.0)}, 220); TR.follow(2.0, 2.5, 0.12);
      TR.hora('Fazenda', 'Muuuito Longe', 6, ${s(2.0)}, true);
      TR.em([[${s(3.4)}, () => TR.tecla('KeyE', 'E', 'pegar entrega')], [${s(4.8)}, () => TR.botao(/Queijo da fazenda/)]]);` },
  { nome: 'c20-rali', seg: 0.2 + D('g20') + 0.9, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 18 * 60 + 27 }); ${claro} ${opala} const r = World.races.find((x) => x.id === 'fazenda');
      const R = TR.drive(r.start[0], r.start[1], r.pts[0][0], r.pts[0][1], 0, { lane: 0, v0: 0 }); TR.follow(2.15, 2.3, 0.15);
      TR.em([[${s(0.4)}, () => { TR.tecla('KeyE', 'E', 'rali'); R.speed = 320; }], [${s(0.45)}, () => { if (Act.race) Act.race.count = Math.min(Act.race.count, 1.1); }]]);` },

  /* ================= RACHA E PERCURSOS ================= */
  { nome: 'c21-racha', seg: 0.2 + D('g21') + 1.4, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 22 * 60 + 3 }); ${opala} ${sem} Profile.money = Math.max(Profile.money, 900); const r = World.rachas.find((x) => x.id === 'arrancada');
      const R = TR.drive(r.start[0], r.start[1], r.pts[r.pts.length - 1][0], r.pts[r.pts.length - 1][1], 0, { lane: 0, v0: 0 }); TR.follow(1.7, 1.55, 0.2);
      TR.cada = () => { ${sem} }; TR.hora('Racha', 'arrancada e percursos', 6, ${s(1.9)}, true);
      TR.em([[${s(2.6)}, () => { TR.tecla('KeyE', 'E', 'racha'); R.speed = 440; }]]);` },
  { nome: 'c22-percurso', seg: 0.2 + D('g22') + 1.0, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 52 }); ${opala} const r = World.races.find((x) => x.id === 'centro');
      const R = TR.drive(r.start[0], r.start[1], r.pts[0][0], r.pts[0][1], 0, { lane: 0, v0: 0 }); TR.follow(1.7, 1.9, 0.15);
      TR.onFrame = (f) => { if (!TR.rec) return; if (f === 6) { KeyPress.push('KeyE'); R.speed = 330; } if (f <= 30 && Act.race && Act.race.count > 0.6) Act.race.count = 0.6; };` },

  /* ================= GARAGEM ================= */
  { nome: 'c23-carros', seg: 0.2 + D('g23') + 0.5, antes: 6, estilo: 'fecha',
    setup: `TR.reset({ bigGar: true, time: 20 * 60 + 55 }); Profile.money = 48500; for (const c of CARS) Profile.owned[c.id] = true;
      Garage.sel = 'brasa'; Garage.tab = 'perf'; Garage.preview = {}; Garage.previewColor = null; Screens.open('screen-garage'); Garage.render();
      TR.hora('Garagem', 'carros e personalização', 6, ${s(2.0)}, true);
      const ver = (id) => () => { Garage.sel = id; Garage.render(); TR.flash = 0.15; };
      TR.em([[${s(5.9)}, ver('pampeiro')], [${s(6.8)}, ver('besouro')], [${s(7.7)}, ver('brasa')], [${s(8.6)}, ver('tropeiro')], [${s(9.5)}, ver('bravo')]]);` },
  { nome: 'c24a-personaliza', seg: 6.6, antes: 6, estilo: 'fecha',
    setup: `TR.reset({ bigGar: true, time: 20 * 60 + 55 }); Profile.money = 4850; Garage.sel = 'brasa'; Garage.tab = 'kit'; Garage.cat = 'paint'; Garage.preview = {}; Garage.previewColor = null; Screens.open('screen-garage'); Garage.render();
      const cat = (id) => () => TR.tocar('[data-kcat="' + id + '"]'); const opt = (n) => () => { const o = document.querySelectorAll('#garage-tab [data-kopt], #garage-tab [data-kcol]'); if (o[n]) TR.tocar(o[n]); };
      TR.em([
        [${s(0.5)}, cat('paint')], [${s(0.8)}, opt(3)], [${s(1.4)}, cat('wheels')], [${s(1.7)}, opt(2)],
        [${s(2.4)}, cat('low')], [${s(2.7)}, opt(1)], [${s(3.4)}, cat('spoiler')], [${s(3.7)}, opt(1)], [${s(4.4)}, cat('tint')], [${s(4.7)}, opt(2)], [${s(5.4)}, cat('neon')], [${s(5.7)}, opt(2)],
      ]);` },
  { nome: 'c24b-paredao', seg: 0.2 + D('g24') - 6.6 + 2.6, antes: 20, estilo: 'fecha', musica: 0.12,
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 57 }); Screens.closeAll(); ${opala} const pc = World.pracaBagunca, ne = nearestEdge(pc.x, pc.y), e = ne.e;
      const x = e.a.x + e.dx * ne.s - e.dy * 24, y = e.a.y + e.dy * ne.s + e.dx * 24; player.place(x, y, Math.atan2(e.dy, e.dx)); TR.rail = null; carLife().bat = 100; carKit('brasa').sound = true;
      TR.people(12, x, y, 66); TR.fixo(x, y, 2.3, 2.55); TR.em([[${s(0.3)}, () => TR.tecla('KeyB', 'B', 'paredão')]]);` },

  /* ================= VIDA DO CARRO, OFICINA E BANCO ================= */
  { nome: 'c25-desgaste', seg: 0.2 + D('g25') + 0.4, antes: 30, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 21 * 60 + 10 }); Som.on = false; ${opala} TR.drive(500, 2100, 2700, 2100, 170, { lane: 24 }); TR.follow(1.9, 2.1, 0.1);
      Profile.damage = 55; Profile.zones = { f: 0.7, r: 0.3, l: 0.5, rt: 0.2, seed: 3 }; const L = carLife(); L.tire = 22; L.oil = 18; L.bat = 30; TR.fumaca(0.35);
      TR.hora('Vida do carro', 'pneu, óleo, bateria e lataria', 6, ${s(1.9)}, true);
      TR.destacar('#tire-bar', 'pneu', ${s(2.2)}, ${s(5.0)}); TR.destacar('#oil-bar', 'óleo', ${s(3.0)}, ${s(5.0)}); TR.destacar('#bat-bar', 'bateria', ${s(3.9)}, ${s(6.4)}); TR.destacar('#cond-bar', 'lataria', ${s(6.6)}, ${s(9.4)});` },
  { nome: 'c26a-oficina', seg: 0.6 + D('g26') + 0.3, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 40 }); ${opala} TR.fu = null;
      Profile.damage = 42; Profile.zones = { f: 0.6, r: 0.25, l: 0.45, rt: 0.1, seed: 3 }; Profile.money = 90; Profile.fiado = null; Profile.visited = World.shops.map((x) => x.id);
      const of = World.shops.find((x) => x.kind === 'oficina'); TR.chegar(of.x, of.y, ${s(0.5)}, 150);
      const fb = () => [...document.querySelectorAll('#dialog-buttons button')].find((b) => /fiado/i.test(b.textContent));
      TR.em([[${s(0.9)}, () => TR.tecla('KeyE', 'E', 'oficina')], [${s(5.6)}, () => TR.destacar(fb(), 'fiado', TR.f, TR.f + 60, false)], [${s(7.2)}, () => TR.tocar(fb())]]);` },
  // o Seu Zé cobrando o fiado no zap
  { nome: 'c26b-ze', seg: 2.5 + D('ze_fiado') + 0.5, antes: 0, estilo: 'trampo', musica: 0.6,
    setup: `TR.reset({ hud: true, bigPhone: true, time: 21 * 60 + 30 }); ${opala} TR.drive(1500, 1260, 2600, 1260, 0, { lane: 24, v0: 0 }); Profile.msgs = []; ensurePhoneData();
      TR.em([
        [${s(0.1)}, () => charVoice('ze_fiado')],
        [${s(0.5)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(1.1)}, () => TR.tocar('#phone-body [data-app="msgs"]')],
        [${s(1.7)}, () => TR.tocar('#phone-body [data-chat="Seu Zé (Oficina)"]')],
        [${s(2.5)}, () => TR.tocar('#phone-body .wa-voice')],
      ]);` },
  { nome: 'c27-banco', seg: 0.2 + D('g27') + 0.7, antes: 10, estilo: 'trampo',
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

  /* ================= RÁDIO, CELULAR E NÍVEL ================= */
  { nome: 'c28a-radio', seg: 0.2 + D('g28') + 0.4, antes: 40, estilo: 'rola',
    setup: `TR.reset({ hud: true, time: 23 * 60 + 10 }); Screens.closeAll(); document.body.classList.remove('tr-bigphone'); TR.legDir = 0; Profile.loan = null; Profile.money = 980; ${opala}
      TR.drive(900, 2100, 3000, 2100, 210, { lane: 24 }); TR.follow(1.7, 1.9, 0.14);
      TR.hora('Rádio', 'Gambiarra FM 171,1', 6, ${s(1.9)}, true); TR.em([[${s(2.2)}, () => TR.dj('radio_v1', true)]]);` },
  { nome: 'c28b-dj', seg: 0.3 + D('radio_03') + 0.6, antes: 0, estilo: 'rola', musica: 0.5, radio: true,
    setup: `TR.em([[${s(0.3)}, () => TR.dj('radio_03')]]); TR.follow(1.9, 2.3, 0.12);` },
  { nome: 'c29-desliga', seg: 0.2 + D('g29') + 0.9, antes: 0, estilo: 'rola', radio: true,
    setup: `TR.em([[${s(0.2)}, () => TR.dj('radio_v3', true)], [${s(0.2 + D('g29') - 0.6)}, () => TR.tecla('KeyF', 'F', 'rádio')]]); TR.follow(2.3, 1.8, 0.14);` },
  { nome: 'c30-celular', seg: 0.3 + D('g30') + 0.5, antes: 10, estilo: 'rola',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 20 * 60 + 45 }); TR.drive(1500, 1260, 2600, 1260, 0, { lane: 24, v0: 0 });
      const anel = (id, nome) => () => TR.destacar(document.querySelector('#phone-body .ph-grid [data-app="' + id + '"], #phone-body .ph-dock [data-app="' + id + '"]'), nome, TR.f, TR.f + 42);
      TR.em([
        [${s(0.2)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(1.2)}, anel('msgs', 'zap')], [${s(2.5)}, anel('pegaai', 'PegaAí')], [${s(3.4)}, anel('fretes', 'fretes')], [${s(4.2)}, anel('mapa', 'mapa')], [${s(5.1)}, anel('carteira', 'banco')],
        [${s(6.2)}, () => TR.tocar('#phone-body [data-app="ajustes"]')], [${s(6.8)}, () => TR.tocar('#phone-body [data-go="aj-wall"]')],
        [${s(7.9)}, () => { const w = document.querySelectorAll('#phone-body [data-wall]'); if (w[3]) TR.tocar(w[3]); }],
      ]);` },
  { nome: 'c31-nivel', seg: 0.2 + D('g31') + 0.7, antes: 30, estilo: 'rola',
    setup: `TR.reset({ hud: true, toasts: true, time: 21 * 60 + 20 }); Screens.closeAll(); document.body.classList.remove('tr-bigphone'); TR.legDir = 0; ${opala}
      const C = career(); C.lvl = 4; C.xp = xpNeed(4) - 10; Profile.ach = Profile.ach || {}; TR.drive(900, 2100, 3000, 2100, 200, { lane: 24 }); TR.follow(1.6, 1.8, 0.14);
      TR.em([[${s(1.6)}, () => gainXP(40)], [${s(5.6)}, () => { const a = ACHIEVEMENTS.find((x) => /Escorregou/.test(x.name)) || ACHIEVEMENTS[0]; Profile.ach[a.id] = clockStr(); AudioSys.chime(); toast('Conquista desbloqueada!', a.name + ' — prêmio de R$ ' + fmtMoney(a.prize), 'good'); pay(a.prize, null); }]]);` },

  /* ================= O QUE VEM POR AÍ ================= */
  { nome: 'c32a-futuro', seg: 3.6, antes: 40, estilo: 'oitenta', musica: 1.3,
    setup: `TR.reset({ lb: 110, time: 23 * 60 + 50, camOff: [0, 130] }); ${opala} TR.drive(8500, 8725, 6400, 8725, 300, { lane: 25 }); TR.follow(1.3, 1.15, 0.25);
      TR.hora('O que vem por aí', 'mais eventos, carros e lugares', 6, ${s(2.2)}, true);` },
  { nome: 'c32b-futuro', seg: 3.6, antes: 40, estilo: 'oitenta', musica: 1.3,
    setup: `TR.reset({ lb: 110, cam: 3, time: 21 * 60 + 40 }); ${opala} TR.drive(4400, 6179, 700, 6179, 520, { lane: 21 }); TR.follow(1.2, 1.3, 0.3);` },
  { nome: 'c32c-futuro', seg: 0.2 + D('g32') - 7.2 + 0.4, antes: 40, estilo: 'oitenta', musica: 1.3,
    setup: `TR.reset({ lb: 110, rain: 0.6, time: 23 * 60 + 10 }); ${opala} TR.drive(500, 1520, 2700, 1520, 230, { lane: 25 }); TR.follow(3.2, 2.9, 0.05); TR.slow = 0.6;` },
  { nome: 'c33-windows', seg: 0.3 + D('g33') + 1.3, antes: 0, estilo: 'oitenta', musica: 1.3,
    setup: `TR.reset({ time: 23 * 60 + 59 }); TR.rail = null; TR.final(0); TR.flash = 0.7;` },

  /* ================= FINAL: pergunta, inscreva-se e cartaz ================= */
  { nome: 'c34-comenta', seg: 0.2 + D('g34') + 0.6, antes: 50, estilo: 'oitenta',
    setup: `TR.reset({ time: 23 * 60 + 45 }); ${opala} TR.drive(4400, 7475, 400, 7475, 400, { lane: 25 }); TR.slow = 0.45; TR.follow(2.4, 1.6, 0.12);
      TR.caption('Comenta aí', 'Que evento maluco deveria acontecer na madrugada?', 6, TR.n - 4);` },
  { nome: 'c35-logo', seg: 0.3 + D('g35') + 2.0, antes: 0, estilo: 'oitenta', musica: 1.4,
    setup: `TR.reset({ time: 23 * 60 + 59 }); Screens.closeAll(); TR.rail = null; TR.final(0); TR.flash = 0.6; TR.inscreva(${s(1.0)});
      TR.onFrame = (f) => { TR.blackO = f < TR.n - 26 ? 0 : Math.min(1, (f - (TR.n - 26)) / 24); };` },
];

// narração (g..) presa a uma cena com atraso t (segundos). As vozes do jogo entram sozinhas (registradas na gravação).
const falas = [
  { id: 'g01', cena: 'c01-gancho', t: 0.3 }, { id: 'g02', cena: 'c02-nome', t: 0.2 },
  { id: 'g03', cena: 'c03a-aerea', t: 0.2 }, { id: 'g04', cena: 'c04a-dirigir', t: 0.2 }, { id: 'g05', cena: 'c05-chuva', t: 0.2 }, { id: 'g06', cena: 'c06a-lombada', t: 0.2 },
  { id: 'g07', cena: 'c07-pegaai', t: 0.3 }, { id: 'g08', cena: 'c08a-online', t: 0.2 }, { id: 'g09', cena: 'c09a-batida', t: 0.1 },
  { id: 'g10', cena: 'c11-mineiro', t: 0.2 }, { id: 'g11', cena: 'c12-gaucha', t: 0.2 }, { id: 'g12', cena: 'c13a-estrela', t: 0.2 },
  { id: 'g13', cena: 'c14a-fretes', t: 0.2 }, { id: 'g14', cena: 'c14b-gas', t: 0.2 },
  { id: 'g15', cena: 'c15-madrugada', t: 0.2 }, { id: 'g16', cena: 'c16-biu', t: 0.2 }, { id: 'g17', cena: 'c17-bananas', t: 0.2 }, { id: 'g18', cena: 'c18a-chupeta', t: 0.2 },
  { id: 'g19', cena: 'c19-fazenda', t: 0.2 }, { id: 'g20', cena: 'c20-rali', t: 0.2 },
  { id: 'g21', cena: 'c21-racha', t: 0.2 }, { id: 'g22', cena: 'c22-percurso', t: 0.2 },
  { id: 'g23', cena: 'c23-carros', t: 0.2 }, { id: 'g24', cena: 'c24a-personaliza', t: 0.2 },
  { id: 'g25', cena: 'c25-desgaste', t: 0.2 }, { id: 'g26', cena: 'c26a-oficina', t: 0.6 }, { id: 'g27', cena: 'c27-banco', t: 0.2 },
  { id: 'g28', cena: 'c28a-radio', t: 0.2 }, { id: 'g29', cena: 'c29-desliga', t: 0.2 }, { id: 'g30', cena: 'c30-celular', t: 0.3 }, { id: 'g31', cena: 'c31-nivel', t: 0.2 },
  { id: 'g32', cena: 'c32a-futuro', t: 0.2 }, { id: 'g33', cena: 'c33-windows', t: 0.3 },
  { id: 'g34', cena: 'c34-comenta', t: 0.2 }, { id: 'g35', cena: 'c35-logo', t: 0.3 },
];

module.exports = { cenas, falas, semLegenda: true };

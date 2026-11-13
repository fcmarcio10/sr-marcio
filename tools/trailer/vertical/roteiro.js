// Trailer vertical (Reels/TikTok, 1080x1920, até 1:30): o jogo funcionando de verdade, com toques na tela.
// Seu Biu manda áudio no zap -> câmera viaja até a carreta -> recolhe as bananas -> PegaAí (corrida, batida,
// cliente reclamando por áudio no chat) -> missão do noivo -> fazenda e Rali da Vaca Atolada -> Seu Zé cobrando
// o fiado -> cartaz "Em breve para Windows".
// Cada cena: nome, seg (duração em segundos), setup (roda dentro do jogo). estilo = trecho da música (mix.py da gameplay).
// cortaVoz: o áudio que ainda estiver tocando para no fim da cena.
const s = (t) => Math.round(t * 60); // segundos -> quadro
const zap = (sel) => `TR.tocar('#phone-body ${sel}')`;

const cenas = [
  /* ---------- gancho ---------- */
  { nome: 'v01-gancho', seg: 3.2, antes: 40, estilo: 'baile',
    setup: `TR.reset({ hud: true, cam: 3, time: 21 * 60 }); TR.drive(700, 6221, 4400, 6221, 470, { lane: 21 }); TR.follow(2.5, 2.0, 0.22);
      TR.topo('POV: seu primeiro dia de motorista em <b>São Gambiarra</b>', 4, TR.n);` },

  /* ---------- Seu Biu manda áudio no WhatsApp ---------- */
  { nome: 'v02-biu-zap', seg: 14.6, antes: 10, estilo: 'trampo', musica: 0.6,
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 48 }); TR.drive(1500, 6221, 4000, 6221, 0, { lane: 21, v0: 0 }); TR.follow(2.3, 2.5, 0);
      TR.topo('O <b>Seu Biu</b> mandou áudio no zap...', ${s(0.5)}, ${s(3.1)});
      TR.em([
        [${s(0.2)}, () => { for (let i = 0; i < 60; i++) { Events.clear(); if (Events.spawn('banana')) break; } Events.cur.life = 1e9; }],
        [${s(1.4)}, () => { TR.celular(true); TR.tocar('#hud-phone'); }],
        [${s(2.1)}, () => ${zap('[data-app="msgs"]')}],
        [${s(2.7)}, () => TR.tocar('#phone-body [data-chat="' + BIU + '"]')],
        [${s(3.3)}, () => ${zap('.wa-voice')}],
        [${s(13.3)}, () => { ${zap('[data-reply="0"]')}; TR.cada = () => { const l = document.querySelector('#phone-body .wa-loc'); if (TR.rec && l && !TR._locFeito) { TR._locFeito = true; setTimeout(() => TR.tocar(l), 450); } }; }],
      ]);` },
  // a câmera sai do carro e vai até a carreta tombada
  { nome: 'v03-zoom-carreta', seg: 3.5, antes: 0, estilo: 'trampo',
    setup: `const E = Events.cur; TR.vcam = { f0: ${s(0.3)}, f1: ${s(2.4)}, de: [player.x, player.y], para: [E.x, E.y], z0: 2.3, z1: 3.1 };
      TR.topo('A carreta tombou na BR!', ${s(0.5)}, ${s(2.2)}); TR.nome('Seu Biu', 'Caminhoneiro · tomba toda semana', ${s(2.2)}, TR.n);
      TR.em([[1, () => { TR.tocar('#phone-close'); TR.celular(false); }]]);` },
  { nome: 'v04-bananas', seg: 5.8, antes: 0, estilo: 'trampo',
    setup: `Screens.closeAll(); TR.celular(false); const E = Events.cur; E.stage = 'collect';
      const e = E.edge, h = e.a.y === e.b.y, lado = h ? Math.sign(E.y - e.a.y) : Math.sign(e.a.x - E.x), ida = lado <= 0 ? 1 : -1, x0 = h ? E.x - ida * 330 : e.a.x, y0 = h ? e.a.y : E.y - ida * 330;
      TR.drive(x0, y0, h ? x0 + ida * 1500 : x0, h ? y0 : y0 + ida * 1500, 120, { lane: 24, v0: 120 }); TR.follow(2.2, 2.45, 0.08);
      const R = TR.rail; E.crates.forEach((c, k) => { const q = TR.at(R, R.s + 60 + k * 52); c.x = q[0]; c.y = q[1]; c.got = false; });
      TR.topo('Bora ajudar: cada caixa é <b>grana no bolso</b>', ${s(0.3)}, ${s(3.0)});` },

  /* ---------- PegaAí ---------- */
  { nome: 'v05-pegaai', seg: 4.6, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 50 }); Events.clear(); TR.drive(900, 2100, 2600, 2100, 0, { lane: 24, v0: 0 }); TR.follow(2.3, 2.4, 0); Act.waypoint = null;
      const C = career(); C.lvl = 2; C.xp = xpNeed(2) - 6; C.acc = { comum: true, aero: false, mudanca: false, vip: false }; Act.rideOnline = false;
      TR.fixar(PASSAGEIROS, 'Marcão'); TR.fixar(PG_PICKUP.comum, 1);
      TR.topo('Hora de rodar no <b>PegaAí</b>', ${s(0.2)}, ${s(2.3)});
      TR.em([
        [${s(0.4)}, () => { TR.celular(true); TR.tocar('#hud-phone'); }],
        [${s(1.1)}, () => ${zap('[data-app="pegaai"]')}],
        [${s(2.2)}, () => ${zap('[data-act2="ride-toggle"]')}],
        [${s(3.2)}, () => { TR.tocar('#phone-close'); TR.celular(false); Act.rideT = 0.3; }],
        [${s(3.9)}, () => { const t = __VT.timers.find((t) => String(t.fn).includes('PG_PICKUP')); if (t) t.at = __VT.t + 1600; }],
      ]);` },
  { nome: 'v06-busca', seg: 4.2, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_EMBARQUE, 5); const R = Act.ride; TR.chegar(R.pick.x, R.pick.y, ${s(2.8)}, 240); TR.follow(2.1, 2.7, 0.1);` },
  { nome: 'v07-batida', seg: 2.2, antes: 0, estilo: 'trampo',
    setup: `TR.fixar(FALAS_BATIDA, 1); TR.batidaCarro(40, 250, 'hatch'); TR.follow(2.3, 2.5, 0.1); TR.topo('Motorista <b>5 estrelas</b>', ${s(0.15)}, TR.n);` },
  { nome: 'v08-chegada', seg: 3.2, antes: 0, estilo: 'trampo',
    setup: `const R = Act.ride; R.t = 5; R.hits = Math.max(R.hits || 0, 3); TR.ultima = R; TR.chegar(R.dest.x, R.dest.y, ${s(0.4)}, 170); TR.follow(2.3, 2.5, 0.1);
      TR.em([[${s(1.4)}, () => { __VT.timers = __VT.timers.filter((t) => !String(t.fn).includes('angryVoice')); Act.rideOnline = false; Act.rideT = 1e9; }]]);` },
  // cliente reclamando por áudio no chat do PegaAí (e outras reclamações antigas na lista)
  { nome: 'v09-reclama', seg: 11.7, antes: 0, estilo: 'trampo', musica: 0.5,
    setup: `const R = TR.ultima;
      [['Dona Cida', 'Moço, minha peruca voou pela janela na lombada! Uma estrela.', 31], ['Pastor Elias', 'Orei a viagem inteira. Deus é fiel, mas o senhor não.', 58], ['Kelly', 'Pedi um carro e chegou um foguete desgovernado kkkkk', 95]]
        .forEach(([n, txt, dt], i) => { const c = pgChat({ rid: 'velho' + i, name: n, type: 'comum' }); c.msgs.push({ body: txt, me: false, t: Math.floor(Profile.time) - dt }); c.t = Math.floor(Profile.time) - dt; c.stars = 1; c.read = false; });
      { const cs = pgChats(), i = cs.findIndex((c) => c.rid === R.rid); if (i > 0) cs.unshift(cs.splice(i, 1)[0]); }
      document.getElementById('toasts').innerHTML = '';
      TR.escolha = (a) => (Array.isArray(a) ? a.find((x) => x && x.clip === 'p_bicho') : undefined);
      TR.topo('E os clientes <b>reclamam</b> no chat...', ${s(1.5)}, ${s(3.7)});
      TR.em([
        [${s(0.15)}, () => angryVoice(R, false)],
        [${s(1.2)}, () => { TR.celular(true); TR.tocar('#hud-phone'); }],
        [${s(1.8)}, () => ${zap('[data-app="pegaai"]')}],
        [${s(2.3)}, () => ${zap('[data-pgtab="msgs"]')}],
        [${s(3.4)}, () => TR.tocar('#phone-body [data-pgchat="' + R.rid + '"]')],
        [${s(4.0)}, () => ${zap('.wa-voice')}],
      ]);` },

  /* ---------- missão: o noivo atrasado ---------- */
  { nome: 'v10-noivo', seg: 4.6, antes: 30, estilo: 'baile',
    setup: `TR.reset({ hud: true, time: 20 * 60 + 46 }); Screens.closeAll(); TR.celular(false); TR.drive(500, 3300, 1900, 3300, 190, { lane: 24 }); TR.follow(2.2, 2.35, 0.15);
      TR.topo('Missão: o <b>noivo</b> tá atrasado pro casamento!', ${s(1.3)}, TR.n);
      TR.em([[${s(0.8)}, () => { for (let i = 0; i < 60; i++) { Events.clear(); if (Events.spawn('noivo')) break; } Events.cur.life = 1e9; }], [${s(3.0)}, () => TR.tocar('#ev-offer .evo-yes')]]);` },
  { nome: 'v11-noivo-embarca', seg: 3.0, antes: 0, estilo: 'baile',
    setup: `const E = Events.cur; TR.chegar(E.pick.x, E.pick.y, ${s(0.8)}, 200); TR.follow(2.4, 2.6, 0.1); TR.cada = () => { if (TR.rec && TR.f > ${s(0.9)}) TR.apertarE('levar o noivo'); }; TR.em([]);` },
  { nome: 'v12-igreja', seg: 3.6, antes: 0, estilo: 'baile',
    setup: `const E = Events.cur; E.left = 30; TR.chegar(E.dest.x, E.dest.y, ${s(0.6)}, 200); TR.follow(2.3, 2.6, 0.1);` },

  /* ---------- fazenda ---------- */
  // entrega na fazenda: chega no casarão, aperta E e escolhe o queijo da fazenda
  { nome: 'v13-fazenda', seg: 5.0, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, bigDlg: true, time: 18 * 60 + 25 }); canvas.style.filter = 'contrast(1.06) saturate(1.2) brightness(1.3)';
      const f = World.shops.find((x) => x.kind === 'fazenda'); TR.fixar(f.items, 'Queijo da fazenda'); TR.chegar(f.x, f.y, ${s(2.0)}, 220); TR.follow(2.0, 2.5, 0.12);
      TR.topo('Entrega lá na <b>fazenda</b>', ${s(0.3)}, ${s(2.6)});
      TR.em([[${s(2.4)}, () => TR.tecla('KeyE', 'E', 'pegar entrega')], [${s(3.6)}, () => TR.botao(/Queijo da fazenda/)]]);` },
  { nome: 'v14-rali', seg: 4.8, antes: 10, estilo: 'baile',
    setup: `TR.reset({ hud: true, toasts: true, time: 18 * 60 + 27 }); canvas.style.filter = 'contrast(1.06) saturate(1.2) brightness(1.3)'; const r = World.races.find((x) => x.id === 'fazenda');
      const R = TR.drive(r.start[0], r.start[1], r.pts[0][0], r.pts[0][1], 0, { lane: 0, v0: 0 }); TR.follow(2.15, 2.3, 0.15);
      TR.topo('Rali da <b>Vaca Atolada</b>', ${s(0.3)}, ${s(3.2)});
      TR.em([[${s(0.4)}, () => { TR.tecla('KeyE', 'E', 'rali'); R.speed = 320; }], [${s(0.45)}, () => { if (Act.race) Act.race.count = Math.min(Act.race.count, 1.1); }]]);` },

  /* ---------- Seu Zé cobrando o fiado (o áudio corta na hora do cartaz) ---------- */
  { nome: 'v15-ze', seg: 7.5, antes: 10, estilo: 'fecha', musica: 0.5, cortaVoz: true,
    setup: `TR.reset({ hud: true, toasts: true, time: 20 * 60 + 55 }); Act.race = null; TR.drive(1500, 1260, 2600, 1260, 0, { lane: 24, v0: 0 }); TR.follow(2.3, 2.4, 0);
      TR.topo('E o <b>Seu Zé</b> cobrando o fiado...', ${s(0.3)}, ${s(2.6)});
      TR.em([
        [${s(0.2)}, () => charVoice('ze_fiado')],
        [${s(1.0)}, () => { TR.celular(true); TR.tocar('#hud-phone'); }],
        [${s(1.6)}, () => ${zap('[data-app="msgs"]')}],
        [${s(2.2)}, () => TR.tocar('#phone-body [data-chat="' + ZE + '"]')],
        [${s(2.8)}, () => ${zap('.wa-voice')}],
      ]);` },
  { nome: 'v16-logo', seg: 4.6, antes: 0, estilo: 'fecha',
    setup: `TR.reset({ time: 23 * 60 + 59 }); Screens.closeAll(); TR.celular(false); TR.rail = null; TR.final(0); TR.flash = 0.6;
      TR.onFrame = (f) => { TR.blackO = f < TR.n - 24 ? 0 : Math.min(1, (f - (TR.n - 24)) / 22); };` },
];

module.exports = { cenas };

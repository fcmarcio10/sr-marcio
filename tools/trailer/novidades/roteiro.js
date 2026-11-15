// Vídeo do YouTube "Novidades do BR Night Drive" (horizontal, ~2:40): o criador mostra a atualização de nov/2026,
// com humor. Narração em primeira pessoa (voz/gXX.mp3, voz Jonas) + vozes do jogo (pedestre, DJ, música da rádio,
// cliente do gás). Sem legenda. Mesma estrutura do vídeo "criando" (gravar.js, montar.sh, gameplay/mix.py).
const F = require('./narra/falas.json');
const D = (id) => F[id].dur;
const s = (t) => Math.round(t * 60); // segundos -> quadro
const sem = `for (const c of Traffic.cars) if (c.model === 'police') { c.release(); c.dead = true; } Traffic.cars = Traffic.cars.filter((c) => !c.dead);`;
const claro = `canvas.style.filter = 'contrast(1.06) saturate(1.2) brightness(1.45)';`;
const opala = `Profile.current = 'brasa'; player.setCar('brasa'); TR.hook();`;
const gasCar = `Profile.current = 'gas'; player.setCar('gas'); TR.hook();`;
const ponto = (frente) => `TR.at(TR.rail, TR.rail.s + ${frente})`;

const cenas = [
  /* ================= ABERTURA ================= */
  { nome: 'a01-abre', seg: 0.3 + D('g01') + 0.5, antes: 40, estilo: 'oitenta', musica: 1.4,
    setup: `TR.reset({ time: 23 * 60 + 20, flash: 0.6 }); ${opala} TR.drive(1450, 6221, 5200, 6221, 470, { lane: 21 }); TR.follow(1.5, 1.25, 0.25);
      TR.card(true, true, 'Atualização de novembro'); const lg = TR.ov.querySelector('.tr-logo .logo');
      TR.onFrame = (f) => { const k = f < ${s(4.6)} ? 1 : Math.max(0, 1 - (f - ${s(4.6)}) / 24); TR.blackO = 0.7 * k; TR.logoO = Math.min(1, f / 6) * k; if (lg) lg.style.transform = 'scale(' + (1.3 + 0.3 * Math.max(0, 1 - f / 10)) + ')'; };
      TR.carimbo('NOVIDADE', 'e muita', '#ffd24a', ${s(6.0)}, TR.n, '74%', '30%', -8);` },

  /* ================= SONS ================= */
  { nome: 'a02a-cidade', seg: 5.2, antes: 40, estilo: 'rola',
    setup: `TR.reset({ time: 22 * 60 + 40 }); TR.drive(500, 1260, 2700, 1260, 140, { lane: 24 }); TR.fixo(1600, 1150, 0.8, 0.95, 1850, 1330);
      TR.hora('Sons de ambiente', 'cidade, roça e bicho de verdade', 6, ${s(4.6)}, true);` },
  { nome: 'a02b-roca', seg: 0.2 + D('g02') - 5.0 + 0.5, antes: 40, estilo: 'rola',
    setup: `TR.reset({ hud: true, time: 18 * 60 + 40 }); ${claro} const v = Animals.list.filter((a) => a.type === 'cow')[2] || Animals.list.find((a) => a.type === 'cow');
      ${opala} player.place(v.x - 120, v.y + 40, 0); TR.rail = null; TR.fixo(v.x - 30, v.y, 2.8, 3.2);
      TR.em([[${s(3.3)}, () => TR.vozJogo('sfx_vaca')], [${s(3.5)}, () => TR.carimbo('MUUU', 'vaca de verdade', '#ffd24a', TR.f, TR.f + 110, '58%', '34%', 7)]]);` },
  { nome: 'a03-pedestre', seg: 0.2 + D('g03') + 0.2 + D('ped_1') + 0.6, antes: 40, estilo: 'rola', musica: 0.7,
    setup: `TR.reset({ hud: true, time: 21 * 60 + 10 }); ${opala} TR.drive(500, 2100, 2700, 2100, 120, { lane: 24 }); TR.follow(2.4, 2.7, 0.08);
      TR.em([[${s(0.2 + D('g03') + 0.2)}, () => { const an = Animals.list.filter((a) => a.type === 'person' && !a.morto).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
          PedVoz.t = 0; TR.escolha = (a) => (Array.isArray(a) ? a.find((x) => Array.isArray(x) && x[0] === 'ped_1') : undefined); PedVoz.fala(an, 'susto'); TR.escolha = null; TR.vozJogo('ped_1');
          TR.carimbo('ELE NÃO GOSTOU', '', '#ff5a5a', TR.f, TR.n, '62%', '28%', -6); }]]);` },
  { nome: 'a04-atropelo', seg: 0.2 + D('g04') + 0.6, antes: 30, estilo: 'rola',
    setup: `TR.reset({ hud: true, time: 23 * 60 + 15 }); ${opala} ${sem} TR.drive(500, 3300, 3400, 3300, 260, { lane: 24 }); TR.follow(2.3, 2.6, 0.1);
      const q = ${ponto(330)}; const an = TR.pedestre(q[0], q[1]);
      TR.slow = (f) => (an.morto && an.mortoT < 1.2 ? 0.4 : 1);
      TR.cada = (f) => { if (!an.morto) { an.x = q[0]; an.y = q[1]; an.v = 0; } };
      TR.em([[${s(2.3)}, () => TR.carimbo('O SEGURO', 'não cobre', '#ff5a5a', TR.f, TR.f + 200, '66%', '30%', -9)], [${s(7.0)}, () => TR.aviso('Não tente isso em casa. Nem na rua.', TR.f, TR.n)]]);` },

  /* ================= BURACOS E CASAS ================= */
  { nome: 'a05-buraco', seg: 0.2 + D('g05') + 0.4, antes: 30, estilo: 'trampo',
    setup: `TR.reset({ hud: true, time: 20 * 60 + 50 }); ${opala} TR.drive(500, 2100, 2900, 2100, 190, { lane: 24 }); TR.follow(2.6, 2.9, 0.06);
      for (const d of [260, 560, 900, 1320]) { const q = ${ponto('d')}; TR.buraco(q[0], q[1], 1); }
      TR.hora('Buracos', 'uma cidade brasileira de verdade', 6, ${s(3.0)}, true);
      TR.em([[${s(5.4)}, () => TR.carimbo('PATROCÍNIO', 'Prefeitura de São Gambiarra', '#ffd24a', TR.f, TR.f + 260, '70%', '30%', -7)]]);` },
  { nome: 'a06-casas', seg: 0.2 + D('g06') + 0.5, antes: 40, estilo: 'trampo',
    setup: `TR.reset({ time: 18 * 60 + 30 }); ${claro} TR.drive(900, 3300, 3000, 3300, 120, { lane: 24 }); TR.fixo(1450, 3180, 1.75, 2.05, 1750, 3420);
      TR.hora('Casas', 'com cara de Brasil', 6, ${s(3.0)}, true);` },
  { nome: 'a07-noite', seg: 0.2 + D('g07') + 0.4, antes: 40, estilo: 'rola',
    setup: `TR.reset({ cam: 3, time: 23 * 60 + 40 }); ${opala} TR.drive(4400, 6179, 700, 6179, 420, { lane: 21 }); TR.follow(1.15, 1.25, 0.25);
      TR.hora('Noite mais escura', 'e 60 quadros por segundo', 6, ${s(4.0)}, true);` },

  /* ================= RÁDIO ================= */
  { nome: 'a08-radio', seg: 0.2 + D('g08') + 0.3 + D('dj_m1') + 0.2 + 4.5, antes: 40, estilo: 'rola', musica: 0.12, radio: true,
    setup: `TR.reset({ hud: true, time: 23 * 60 + 10 }); ${opala} TR.drive(1450, 6221, 5200, 6221, 200, { lane: 21 }); TR.follow(1.9, 2.2, 0.12);
      TR.hora('Rádio', 'Gambiarra FM 171,1', 6, ${s(3.0)}, true);
      TR.em([[${s(0.2 + D('g08') + 0.3)}, () => TR.dj('dj_m1')], [${s(0.2 + D('g08') + 0.3 + D('dj_m1') + 0.2)}, () => TR.musicaRadio(0)], [TR.n - 2, () => TR.paraVoz()]]);` },
  { nome: 'a09-desliga', seg: 0.2 + D('g09') + 0.8, antes: 0, estilo: 'rola', radio: true,
    setup: `TR.em([[${s(0.1)}, () => TR.musicaRadio(0, true)], [${s(0.2 + D('g09') - 0.7)}, () => TR.tecla('KeyF', 'F', 'rádio')]]); TR.follow(2.3, 1.9, 0.14);` },

  /* ================= CELULAR ================= */
  { nome: 'a10-fretes', seg: 0.3 + D('g10') + 0.4 + D('fr_ok1') + 0.6, antes: 20, estilo: 'trampo', musica: 0.6,
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 22 * 60 + 40 }); Screens.closeAll(); Profile.owned.gas = true; ${gasCar} TR.drive(1500, 1260, 2600, 1260, 0, { lane: 24, v0: 0 });
      Act.delivery = null; Profile.fr = { chats: [] }; startJob(genJob('gas')); const d = Act.delivery; d.cliente = 'Dona Neide';
      __VT.timers = __VT.timers.filter((t) => !String(t.fn).includes('FR_PEDIDO')); frMsg(d, 'Moço, traz o botijão que a pizza ficou pela metade no forno!'); frMsg(d, 'Já tô a caminho!', null, true);
      const V = FR_VOZ.find((v) => v.clip === 'fr_ok1');
      TR.em([
        [${s(0.3)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(1.0)}, () => TR.tocar('#phone-body [data-app="fretes"]')],
        [${s(1.6)}, () => TR.tocar('#phone-body [data-frtab="msgs"]')],
        [${s(2.2)}, () => TR.tocar('#phone-body [data-frchat]')],
        [${s(3.6)}, () => { frMsg(d, V.text, { clip: V.clip, dur: VOICE_CLIPS[V.clip].dur }); Phone.render(); }],
        [${s(0.3 + D('g10') + 0.4)}, () => TR.tocar('#phone-body .wa-voice')],
      ]);` },
  { nome: 'a11-pegaai', seg: 0.2 + D('g11') + 1.0, antes: 10, estilo: 'trampo',
    setup: `TR.reset({ hud: true, toasts: true, bigPhone: true, time: 21 * 60 + 5 }); Screens.closeAll(); Act.delivery = null; ${opala} TR.drive(900, 2100, 2600, 2100, 0, { lane: 24, v0: 0 });
      Act.rideOnline = true; Act.ride = null; TR.fixar(PASSAGEIROS, 'Kelly'); newRideRequest(); const R = Act.ride; Act.rideT = 1e9; pgMsg(R, 'Oi! Tô no portão azul, tá?');
      document.getElementById('toasts').innerHTML = '';
      TR.em([
        [${s(0.2)}, () => { TR.tecla('KeyQ', 'Q', 'celular'); TR.legDir = 760; }],
        [${s(0.8)}, () => TR.tocar('#phone-body [data-app="pegaai"]')],
        [${s(1.3)}, () => TR.tocar('#phone-body [data-pgtab="msgs"]')],
        [${s(1.8)}, () => TR.tocar('#phone-body [data-pgchat="' + R.rid + '"]')],
        [${s(3.0)}, () => TR.tocar('#phone-body [data-pgq="0"]')],
        [${s(3.4)}, () => TR.destacar('#phone-body .pgc-closed', 'uma vez só', TR.f, TR.n)],
        [${s(5.6)}, () => TR.carimbo('15x NÃO', '', '#ff5a5a', TR.f, TR.n, '30%', '32%', -8)],
      ]);` },

  /* ================= CARRO ================= */
  { nome: 'a12-barro', seg: 0.2 + D('g12') + 0.4, antes: 30, estilo: 'rola',
    setup: `TR.reset({ hud: true, time: 20 * 60 + 30 }); Screens.closeAll(); document.body.classList.remove('tr-bigphone'); TR.legDir = 0; Act.ride = null; Act.rideOnline = false; ${opala}
      TR.drive(500, 3300, 3400, 3300, 170, { lane: 24 }); TR.follow(2.6, 2.4, 0.04);
      TR.cada = (f) => { if (f < ${s(4.5)}) { player.wmud = [1, 0, 1, 0]; } };
      TR.hora('Barro', 'só na roda que pisou na terra', 6, ${s(3.6)}, true);
      TR.em([[${s(5.0)}, () => TR.carimbo('FÍSICA', 'aprovada pelo Seu Zé', '#ffd24a', TR.f, TR.n, '68%', '30%', -7)]]);` },
  { nome: 'a13-passando', seg: 0.2 + D('g13') + 0.5, antes: 40, estilo: 'rola',
    setup: `TR.reset({ cam: 3, hud: true, time: 21 * 60 + 40 }); ${opala} TR.drive(1450, 6221, 5200, 6221, 480, { lane: 21 }); TR.follow(1.2, 1.3, 0.25);
      TR.hora('Carro passando', 'só acima de 85 km/h', 6, ${s(3.6)}, true);` },

  /* ================= FINAL ================= */
  { nome: 'a14-logo', seg: 0.3 + D('g14') + 2.0, antes: 0, estilo: 'oitenta', musica: 1.4,
    setup: `TR.reset({ time: 23 * 60 + 59 }); Screens.closeAll(); TR.rail = null; TR.final(0); TR.flash = 0.6; TR.inscreva(${s(4.0)});
      TR.onFrame = (f) => { TR.blackO = f < TR.n - 26 ? 0 : Math.min(1, (f - (TR.n - 26)) / 24); };` },
];

const falas = [
  { id: 'g01', cena: 'a01-abre', t: 0.3 }, { id: 'g02', cena: 'a02a-cidade', t: 0.2 }, { id: 'g03', cena: 'a03-pedestre', t: 0.2 }, { id: 'g04', cena: 'a04-atropelo', t: 0.2 },
  { id: 'g05', cena: 'a05-buraco', t: 0.2 }, { id: 'g06', cena: 'a06-casas', t: 0.2 }, { id: 'g07', cena: 'a07-noite', t: 0.2 },
  { id: 'g08', cena: 'a08-radio', t: 0.2 }, { id: 'g09', cena: 'a09-desliga', t: 0.2 },
  { id: 'g10', cena: 'a10-fretes', t: 0.3 }, { id: 'g11', cena: 'a11-pegaai', t: 0.2 },
  { id: 'g12', cena: 'a12-barro', t: 0.2 }, { id: 'g13', cena: 'a13-passando', t: 0.2 }, { id: 'g14', cena: 'a14-logo', t: 0.3 },
];

module.exports = { cenas, falas, semLegenda: true };

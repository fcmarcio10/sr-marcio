// Trailer "Primeira noite" (comédia, ~2:17): um novato chega em São Gambiarra e sobrevive à primeira noite.
// 63 compassos a 110 batidas por minuto. Partes com letreiro de horário: chegada (19:30), primeira corrida (20:15),
// entrega do gás (22:40), banana na BR (02:10), chuva (03:30) e amanhece (04:59). Carro velho a noite toda
// (Gou Quadrado cada vez mais amassado), reformado rapidinho na garagem no fim; o DJ Biruta encerra pela rádio.
// uso (de dentro de tools/trailer/noite):  node gravar.js [cena ...]   |   FOTOS=10,120 node gravar.js X  (prévia)
// depois: ./montar.sh
const LB = 138; // faixas de cinema nas cenas de conversa
const BIU = 'Seu Biu (Bananas)';
const s = (t) => Math.round(t * 60);
// na frente da oficina do Seu Zé (ox, oy = vaga na rua, de frente pra oficina; vx, vy = câmera puxada pro lado da placa)
const naOficina = () => `const of = World.shops.find((x) => x.kind === 'oficina'), ne = nearestEdge(of.x, of.y), e = ne.e;
  const ox = e.a.x + e.dx * ne.s - e.dy * 24, oy = e.a.y + e.dy * ne.s + e.dx * 24; player.place(ox, oy, Math.atan2(e.dy, e.dx)); TR.rail = null; const od = Math.hypot(of.x - ox, of.y - oy) || 1, vx = ox - (of.x - ox) / od * 80, vy = oy - (of.y - oy) / od * 80;`;
const poca = (frente) => `if (!Weather.puddleGrid) Weather.buildPuddles(); { const R = TR.rail, q = TR.at(R, R.s + ${frente}), p = { x: q[0], y: q[1], rx: 26, ry: 10, mud: false, cool: 0, ph: 1 }; const C = Weather.puddleCell, k = Math.floor(p.x / C) + ',' + Math.floor(p.y / C); if (!Weather.puddleGrid.has(k)) Weather.puddleGrid.set(k, []); Weather.puddleGrid.get(k).push(p); }`;
const gou = (k) => `TR.gou(${k});`; // o carro do novato (0 = inteiro, 1 = caindo aos pedaços)
const caminhaoGas = `Profile.current = 'gas'; player.setCar('gas'); TR.hook();`;

module.exports = {
  bpm: 110,
  // falas (ElevenLabs, projeto "BR Night Drive - Trailer Primeira Noite (falas)"): voz/<id>.mp3 entra no compasso "bar"
  // filtro: 'radio' (DJ na rádio do carro) ou 'tel' (ligação e áudio de zap)
  falas: [
    { id: 'z1', bar: 1.0, quem: 'Seu Zé', txt: 'Então você que é o novato? Toma a chave. O carro é de 87... mas o motor é de 85.' },
    { id: 'm1', bar: 4.6, quem: 'Novato', txt: 'Seu Zé... o banco tá preso com fita crepe?' },
    { id: 'z2', bar: 6.3, quem: 'Seu Zé', txt: 'Fita crepe não, rapá. Tecnologia nacional!' },
    { id: 'm2', bar: 12.6, quem: 'Novato', txt: 'Primeira corrida! É só não bater em nada. Fácil.' },
    { id: 'p1', bar: 15.9, quem: 'Passageira', txt: 'Moço, eu pedi um carro, não um carrinho de bate-bate!' },
    { id: 'm3', bar: 17.75, quem: 'Novato', txt: 'Foi o buraco, dona! Ele apareceu do nada!' },
    { id: 'd1', bar: 20.3, quem: 'DJ Biruta', filtro: 'radio', txt: 'Tá ouvindo a musiquinha? É o caminhão do gás!' },
    { id: 'm4', bar: 22.0, quem: 'Novato', txt: 'Frete de gás. Dez minutos. Moleza.' },
    { id: 'c1', bar: 25.2, quem: 'Cliente', filtro: 'tel', txt: 'Moço, cadê meu gás? O feijão tá de molho desde ontem!' },
    { id: 'm5', bar: 27.25, quem: 'Novato', txt: 'Tô chegando! O botijão é que tá enjoado!' },
    { id: 'b1', bar: 31.0, quem: 'Seu Biu', filtro: 'tel', txt: 'Ô meu patrão, a carreta tombou! Tá banana pra todo lado!' },
    { id: 'm6', bar: 33.2, quem: 'Novato', txt: 'Banana? Na BR? Às duas da manhã?' },
    { id: 'm7', bar: 38.7, quem: 'Novato', txt: 'Seu Biu... eu escorreguei numa banana. De carro. Isso existe?!' },
    { id: 'd2', bar: 42.3, quem: 'DJ Biruta', filtro: 'radio', txt: 'Alerta de chuva! Poça aqui não é poça, é piscina com vista pra pista!' },
    { id: 'm8', bar: 45.9, quem: 'Novato', txt: 'O escapamento! O Seu Zé vai me matar!' },
    { id: 'z3', bar: 47.7, quem: 'Seu Zé', filtro: 'tel', txt: 'Bateu de novo? Traz que eu ajeito... e anota no fiado!' },
    { id: 'm9', bar: 50.5, quem: 'Novato', txt: 'Sobrevivi. Primeira noite... e amanhã tem mais.' },
    { id: 'd3', bar: 56.3, quem: 'DJ Biruta', filtro: 'radio', txt: 'E aí, novato, sobreviveu? Descansa, que São Gambiarra te espera de novo! Gambiarra FM, 171,1!' },
  ],
  cenas: [
    /* ======================= 19:30 · A CHEGADA (sem música, só a noite) ======================= */
    { nome: '01-chegada', bars: 4.5, antes: 30,
      setup: `TR.reset({ lb: ${LB}, time: 19 * 60 + 30 }); ${naOficina()} ${gou(0.15)}
        TR.fixo(vx, vy, 1.55, 2.05, (vx + ox) / 2, (vy + oy) / 2); TR.blackO = 1;
        TR.hora('19:30', 'A chegada', 22, 132);
        TR.onFrame = (f) => { TR.blackO = f < 40 ? 1 : Math.max(0, 1 - (f - 40) / 110); };` },
    { nome: '02-fita', bars: 3.5, antes: 20,
      setup: `TR.reset({ lb: ${LB}, time: 19 * 60 + 31 }); ${naOficina()} ${gou(0.15)}
        TR.fixo(ox, oy, 2.75, 3.05); TR.slow = 0.8;
        TR.carimbo('Fita crepe', 'tecnologia nacional', '#ffd04a', 300, 455, '68%', '38%', -8);` },
    // a música entra: o carro sai da oficina soltando fumaça
    { nome: '03-saida', bars: 2, antes: 10, motor: true,
      setup: `TR.reset({ lb: ${LB}, time: 19 * 60 + 32 }); ${naOficina()} ${gou(0.15)}
        TR.drive(ox - Math.cos(player.a) * 30, oy - Math.sin(player.a) * 30, ox + Math.cos(player.a) * 2400, oy + Math.sin(player.a) * 2400, 150, { lane: 24, v0: 0 });
        TR.fixo(player.x, player.y, 1.5, 1.6, player.x + Math.cos(player.a) * 140, player.y + Math.sin(player.a) * 140); TR.fumaca(0.9, 140);
        TR.titulo('Primeira noite', 'em São Gambiarra', 8, TR.n - 4); TR.flash = 0.55;` },
    { nome: '04-cidade', bars: 2, antes: 40,
      setup: `TR.reset({ lb: ${LB}, time: 19 * 60 + 50 }); ${gou(0.15)} TR.drive(500, 1260, 2700, 1260, 140, { lane: 24 });
        TR.fixo(1600, 1150, 0.72, 0.86, 1850, 1330);` },

    /* ======================= 20:15 · PRIMEIRA CORRIDA ======================= */
    { nome: '05-corrida', bars: 3, antes: 30, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 20 * 60 + 15 }); ${gou(0.15)} player.place(1600, 2100, 0); const C = career(); C.lvl = 1; C.acc = { comum: true, aero: false, mudanca: false, vip: false };
        newRideRequest(); const R = Act.ride; R.name = 'Dona Cida'; TR.toward(R.pick.x, R.pick.y, 420, 190); TR.follow(1.9, 2.15, 0.12);
        TR.hora('20:15', 'Primeira corrida', 8, 140);` },
    // batida de verdade (física do jogo) com a passageira no banco de trás
    { nome: '06-batida', bars: 2.5, antes: 0, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 20 * 60 + 21 }); ${gou(0.18)} newRideRequest(); const R = Act.ride; R.name = 'Dona Cida'; R.stage = 'drive'; R.t = 0;
        TR.batidaCarro(52, 255, 'hatch', [2400, 3300]); TR.follow(2.3, 2.6, 0.1);
        TR.slow = (f) => (f > 50 && f < 95 ? 0.45 : 1); TR.onBump = null;
        TR.em([[53, () => { TR.flash = 0.45; Cam.shake = 9; }]]);` },
    { nome: '07-estrela', bars: 2.5, antes: 30, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 20 * 60 + 24 }); ${gou(0.35)} newRideRequest(); const R = Act.ride; R.name = 'Dona Cida'; R.stage = 'drive';
        TR.drive(500, 2100, 2700, 2100, 160, { lane: 24 }); TR.follow(2.4, 2.2, 0.1); TR.fumaca(0.25);
        TR.estrelas(1, '"Carrinho de bate-bate."', 175, TR.n, '50%', '42%');` },

    /* ======================= 22:40 · ENTREGA DO GÁS (musiquinha do gás) ======================= */
    { nome: '08-gas', bars: 3, antes: 20, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 22 * 60 + 40 }); ${caminhaoGas} startJob(genJob('gas')); const J = Act.delivery; J.stage = 'deliver'; GasJingle.t = 0;
        const r = TR.drive(J.pick.x, J.pick.y, J.dest.x, J.dest.y, 200, { lane: 22 }); r.s = r.len * 0.2; r.v = 200; TR.follow(1.75, 1.9, 0.14);
        TR.hora('22:40', 'Entrega do gás', 8, 140); TR.radioNoAr('Caminhão do gás', 39, 215);` },
    { nome: '09-lombada', bars: 2, antes: 0, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 22 * 60 + 44 }); ${caminhaoGas} startJob(genJob('gas')); Act.delivery.stage = 'deliver'; GasJingle.t = 0;
        TR.lombada(70, 320, 0.42); TR.follow(2.9, 3.3, 0.05);
        TR.onBump = () => { TR.flash = 0.25; if (TR.rec) TR.log.sons.push([TR.gf0 + TR.f, 'boing', []]); TR.carimbo('Boing!', '', '#ffffff', TR.f + 1, TR.f + 70, '60%', '30%', 7); };` },
    { nome: '10-cliente', bars: 3, antes: 30, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 22 * 60 + 47 }); ${caminhaoGas} startJob(genJob('gas')); const J = Act.delivery; J.stage = 'deliver'; GasJingle.t = 0;
        TR.drive(4400, 6221, 700, 6221, 430, { lane: 21 }); TR.follow(1.45, 1.25, 0.25);
        TR.notif('tel', 'Dona Neide', 'cliente do gás · ligando...', 4, 270);` },
    { nome: '11-entrega', bars: 2, antes: 20, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 22 * 60 + 51 }); ${caminhaoGas} startJob(genJob('gas')); const J = Act.delivery; J.stage = 'deliver'; GasJingle.t = 0;
        const dx = J.dest.x, dy = J.dest.y; J.dest = { x: dx + 6000, y: dy + 6000 }; // o jogo não conclui a entrega sozinho (a piada é o atraso)
        TR.toward(dx, dy, 380, 230); TR.follow(2.0, 2.3, 0.1);
        TR.carimbo('Entregue', 'só 1 minutinho atrasado', '#3ee07a', 120, TR.n, '50%', '40%', -7);
        TR.em([[112, () => { Act.delivery = null; pay(85, 'Frete de gás · entregue'); }]]);` },

    /* ======================= 02:10 · BANANA NA BR (áudio do Seu Biu no zap) ======================= */
    { nome: '12-zap-biu', bars: 5, antes: 10,
      setup: `TR.reset({ lb: 0, hud: true, bigPhone: true, time: 26 * 60 + 10 }); Profile.current = 'pampeiro'; player.setCar('pampeiro'); TR.hook(); ${gou(0.4)}
        TR.drive(1500, 6221, 4000, 6221, 0, { lane: 21, v0: 0 }); TR.follow(2.3, 2.5, 0);
        TR.hora('02:10', 'Banana na BR', 6, 110);
        TR.em([
          [6, () => { for (let i = 0; i < 60; i++) { Events.clear(); if (Events.spawn('banana')) break; } Events.cur.life = 1e9;
            const m = [...(Profile.msgs || [])].reverse().find((x) => x.from === '${BIU}'); if (m) { m.body = 'Ô meu patrão, a carreta tombou! Tá banana pra todo lado!'; if (m.voice) m.voice.dur = 4.4; } }],
          [36, () => TR.tocar('#hud-phone')],
          [76, () => TR.tocar('#phone-body [data-app="msgs"]')],
          [104, () => TR.tocar('#phone-body [data-chat="${BIU}"]')],
          [131, () => TR.tocar('#phone-body .wa-voice')],
          [430, () => { TR.tocar('#phone-close'); }],
        ]);` },
    // escorrega na casca de banana de verdade (física do jogo: a casca tira a aderência do pneu)
    { nome: '13-banana', bars: 3.5, antes: 0, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 26 * 60 + 14 }); Screens.closeAll(); Profile.current = 'pampeiro'; player.setCar('pampeiro'); TR.hook(); ${gou(0.45)}
        const E = TR.spawnEv('banana', 3400, 6221); E.stage = 'collect'; TR.casca(E, 170, 200); TR.follow(2.0, 2.25, 0.08);
        TR.slow = (f) => (TR.girando ? 0.5 : 1);` },
    { nome: '14-tonto', bars: 3.5, antes: 0,
      setup: `TR.f = 0; TR.girando = false; TR.slow = 0.85; TR.giro = (p) => { p.vx = 0; p.vy = 0; p.slip = 0; p.thr = 0; p.rpm = 850; }; TR.fixo(player.x, player.y, 2.5, 3.1); TR.tonto(10, TR.n - 20);` },

    /* ======================= 03:30 · CHUVA ======================= */
    { nome: '15-chuva', bars: 3, antes: 40, motor: true, chuva: true,
      setup: `TR.reset({ lb: 0, hud: true, rain: 1, time: 27 * 60 + 30 }); Profile.current = 'pampeiro'; player.setCar('pampeiro'); TR.hook(); ${gou(0.55)}
        TR.drive(400, 900, 2750, 900, 270, { lane: 23 }); TR.follow(2.5, 2.85, 0.08); TR.slow = (f) => (f > 150 && f < 300 ? 0.38 : 1);
        TR.hora('03:30', 'Chuva', 6, 110); TR.radioNoAr('Alerta de chuva', 39, 360);
        TR.onFrame = (f) => { if (f === 150 && TR.rec) { ${poca(26)} } };` },
    { nome: '16-escapamento', bars: 2.5, antes: 0, motor: true, chuva: true,
      setup: `TR.reset({ lb: 0, hud: true, rain: 0.9, time: 27 * 60 + 34 }); Profile.current = 'pampeiro'; player.setCar('pampeiro'); TR.hook(); ${gou(0.6)}
        TR.lombada(60, 280, 0.45); TR.follow(2.9, 3.2, 0.05);
        TR.onBump = () => { TR.flash = 0.2; TR.fumaca(1.2, 120, TR.f); if (TR.rec) TR.log.sons.push([TR.gf0 + TR.f + 6, 'calota', []]); };` },
    { nome: '17-zap-ze', bars: 2.5, antes: 30, motor: true, chuva: true,
      setup: `TR.reset({ lb: 0, hud: true, rain: 0.8, time: 27 * 60 + 40 }); Profile.current = 'pampeiro'; player.setCar('pampeiro'); TR.hook(); ${gou(0.8)}
        TR.drive(500, 2100, 2700, 2100, 85, { lane: 24 }); TR.follow(2.6, 2.4, 0.1); TR.fumaca(0.8);
        TR.notif('zap', 'Seu Zé (Oficina)', 'mensagem de voz', 6, 290);` },

    /* ======================= 04:59 · AMANHECE ======================= */
    { nome: '18-amanhece', bars: 4, antes: 30,
      setup: `TR.reset({ lb: ${LB}, time: 28 * 60 + 59 }); ${naOficina()} Profile.current = 'pampeiro'; player.setCar('pampeiro'); TR.hook(); player.place(ox, oy, player.a); ${gou(0.95)}
        TR.fixo(vx, vy, 2.0, 2.45, ox, oy); TR.fumaca(0.45); TR.sol(0.2, 1.0);
        TR.hora('04:59', 'Amanhece', 6, 120);` },
    // um mês depois: o mesmo Gou Quadrado reformado na garagem (o neon muda de cor na batida)
    { nome: '19-reforma', bars: 2, antes: 6,
      setup: `TR.reset({ lb: 0, bigGar: true, flash: 0.5 }); TR.gou(0); TR.reformado(true);
        Garage.sel = 'pampeiro'; Garage.tab = 'kit'; Garage.cat = 'neon'; Garage.preview = {}; Garage.previewColor = null; Screens.open('screen-garage'); Garage.render();
        TR.hora('Um mês depois', 'e muito fiado no Seu Zé', 4, TR.n - 4, true);
        let i = 0; const neon = ['#ff2bd6', '#39ff6a', '#ffcc2e', '#22d1ff'];
        TR.onFrame = (f) => { if (TR.rec && TR.beat(f)) { Garage.preview.neon = neon[i++ % 4]; TR.flash = 0.25; Garage.render(); } };` },
    // o DJ encerra: o carro reformado passeia na orla com o dia nascendo
    { nome: '20-dj', bars: 4.5, antes: 40, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 28 * 60 + 58, camOff: [0, 110] }); Screens.closeAll(); Profile.current = 'pampeiro'; player.setCar('pampeiro'); TR.hook(); TR.gou(0); TR.reformado(true);
        TR.drive(6400, 8725, 8500, 8725, 300, { lane: 25 }); TR.follow(1.7, 1.45, 0.25); TR.sol(0.75, 0.9);
        TR.radioNoAr('Encerramento', 39, 540);` },
    { nome: '21-logo', bars: 2.5, antes: 0, sfx: [{ t: 0, s: 'impacto' }],
      setup: `TR.reset({ lb: 0, time: 28 * 60 + 59 }); TR.rail = null; TR.blackO = 1; TR.final(0); TR.flash = 0.7;
        TR.onFrame = (f) => { TR.blackO = f < TR.n - 30 ? 0 : Math.min(1, (f - (TR.n - 30)) / 26); };` },
  ],
};

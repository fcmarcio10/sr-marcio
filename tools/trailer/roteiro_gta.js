// Trailer estilo GTA (humorístico): 41,5 compassos a 130 batidas por minuto (~77 s). Cada cena dura "bars" compassos.
// setup roda dentro do jogo (TR = câmera de cinema, trilho, legendas). TR.n = quadros da cena.
// sfx: efeitos extras (t em segundos dentro da cena). motor/chuva: camadas de som desta cena.
const LB = 138; // faixas de cinema (tela 2.39:1)
const semPolicia = `for (const c of Traffic.cars) if (c.model === 'police') { c.release(); c.dead = true; } Traffic.cars = Traffic.cars.filter((c) => !c.dead);`;
const poca = (frente) => `if (!Weather.puddleGrid) Weather.buildPuddles(); { const R = TR.rail, q = TR.at(R, R.s + ${frente}), p = { x: q[0], y: q[1], rx: 24, ry: 9, mud: false, cool: 0, ph: 1 }; const C = Weather.puddleCell, k = Math.floor(p.x / C) + ',' + Math.floor(p.y / C); if (!Weather.puddleGrid.has(k)) Weather.puddleGrid.set(k, []); Weather.puddleGrid.get(k).push(p); }`;
// na frente da oficina do Seu Zé, com o Opalha amassado soltando fumaça
const naOficina = (dano) => `const of = World.shops.find((x) => x.kind === 'oficina'), ne = nearestEdge(of.x, of.y), e = ne.e;
  const ox = e.a.x + e.dx * ne.s - e.dy * 24, oy = e.a.y + e.dy * ne.s + e.dx * 24; player.place(ox, oy, Math.atan2(e.dy, e.dx)); TR.rail = null; Profile.damage = ${dano};
  Profile.zones = { f: 0.8, r: 0.3, l: 0.6, rt: 0.2, seed: 7 };`;
const racha = (skip, t) => `${semPolicia} const r = World.rachas.find((x) => x.id === 'carapina');
  TR.drive(r.start[0], r.start[1], r.pts[r.pts.length - 1][0], r.pts[r.pts.length - 1][1], 430, { lane: 0, v0: ${skip ? 400 : 0}, skip: ${skip || 0} });
  startRacha(r); Act.race.count = ${t === undefined ? 0 : t}; Act.race.t = ${skip ? (skip / 340).toFixed(2) : 0};
  TR.onFrame = () => { ${semPolicia} };`;
const garagem = (cat) => `Garage.sel = 'brasa'; Garage.tab = 'kit'; Garage.cat = '${cat}'; Garage.preview = {}; Garage.previewColor = null; Screens.open('screen-garage'); Garage.render();`;

module.exports = {
  bpm: 130,
  // falas (geradas no ElevenLabs): arquivo voz/<id>.mp3 entra no compasso "bar"
  vozes: [
    { id: 'n1', bar: 0.75 }, { id: 'n2', bar: 5.0 }, { id: 'p1', bar: 20.05 }, { id: 'z1', bar: 23.1 }, { id: 'b1', bar: 26.6 }, { id: 'n3', bar: 37.45 },
  ],
  cenas: [
    /* ---------- ABERTURA (lenta, faixas de cinema) ---------- */
    { nome: '01-cidade', bars: 2, antes: 40,
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 + 20 }); TR.drive(500, 1260, 2700, 1260, 140, { lane: 24 });
        TR.fixo(1600, 1150, 0.72, 0.86, 1850, 1330); TR.onFrame = (f) => { TR.blackO = Math.max(0, 1 - f / 80); };
        TR.caption('São Gambiarra', 'Espírito Santo · onde o buraco tem CEP', 50, TR.n - 6);` },
    { nome: '02-ponte', bars: 2, antes: 60, motor: true,
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 }); TR.drive(4300, 1520, 6600, 1520, 340, { lane: 24 }); TR.follow(1.6, 1.9, 0.12); TR.slow = 0.45;
        TR.obra('Prefeitura de São Gambiarra', ['Obra: <b>Ponte Nova</b>', 'Início: <b>1987</b>', 'Entrega: <b>em breve</b>'], 22, TR.n - 2, '74%', '57%');` },
    { nome: '03-poca', bars: 2, antes: 40, motor: true, chuva: true,
      setup: `TR.reset({ lb: ${LB}, rain: 1, time: 22 * 60 }); TR.drive(400, 900, 2750, 900, 280, { lane: 23 }); TR.follow(2.5, 2.85, 0.08); TR.slow = 0.32;
        TR.onFrame = (f) => { if (f === 1 && TR.rec) { ${poca(45)} } };
        // o carimbo cai junto com o espirro da poça
        const g = TR.carimbo('Lava-jato grátis', null, '#3dbdff', 1e9, TR.n - 2, '50%', '31%', -8); TR.onPoca = () => { if (g.f0 > 1e8) g.f0 = TR.f + 3; };` },
    // "...e o quebra-molas": o Opalha rebaixado raspa na lombada (faísca), bem na fala do narrador
    { nome: '04-lombada', bars: 2, antes: 0, motor: true,
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 + 5 }); TR.lombada(128, 300, 0.42); TR.follow(3.0, 3.4, 0.05); TR.onBump = () => { TR.flash = 0.22; };` },
    /* ---------- VIRADA (a batida entra) ---------- */
    { nome: '05-celular', bars: 1, antes: 20, sfx: [{ t: 0.03, s: 'ping' }],
      setup: `TR.reset({ bigPhone: true, time: 21 * 60 + 15, camOff: [260, 0] }); TR.drive(850, 2100, 850, 4400, 200, { lane: 23 }); TR.follow(1.5, 1.65);
        newRideRequest(); const R = Act.ride; R.name = 'Dona Rosângela'; pgChats().length = 0; pgMsg(R, 'Oi, motorista! Tô na padaria, de blusa amarela. Vem com cuidado que eu tô levando uma moqueca!');
        Phone.open('pegaai'); Phone.pgChat = pgChats()[0] && pgChats()[0].rid; Phone.render();` },
    { nome: '06-busca', bars: 1.5, antes: 8,
      setup: `TR.reset({ time: 21 * 60 + 15 }); player.place(1600, 1520, 0); newRideRequest(); const R = Act.ride; R.name = 'Dona Rosângela';
        TR.toward(R.pick.x, R.pick.y, 250, 190); TR.fixo(R.pick.x, R.pick.y, 2.3, 2.9);
        TR.subtitle('Busque a <c>' + R.name + '</c> em <y>' + R.pick.name + '</y>. Ela tá com uma moqueca no colo.', 6, TR.n - 4);` },
    { nome: '07-seuze', bars: 1, antes: 10, sfx: [{ t: 0.15, s: 'congela' }],
      setup: `TR.reset({ time: 22 * 60 + 5 }); ${naOficina(80)}
        TR.fixo(ox, oy - 30, 2.5, 2.8); TR.freezeAt = 9; TR.charCard('Seu Zé', 'Mecânico · fiado, só uma vez', '#ffcc2e', 9, drawSeuZe);` },
    { nome: '08-largada', bars: 0.5, antes: 0,
      setup: `TR.reset({ hud: true, time: 23 * 60 + 40 }); Profile.damage = 0; ${racha(0, 'TR.n / 60 + 0.03')}
        TR.fixo(r.start[0] + 70, r.start[1] + 8, 2.3, 2.6);` },
    /* ---------- DROP 1 (um corte por compasso) ---------- */
    { nome: '09-vai', bars: 1, antes: 0, motor: true, sfx: [{ t: 0, s: 'impacto' }, { t: 0.04, s: 'pneu' }],
      setup: `TR.flash0 = 0.9; TR.slow = 1; TR.lb = 0; TR.follow(1.75, 1.45, 0.22);` },
    { nome: '10-br', bars: 1, antes: 40, motor: true,
      setup: `TR.reset({ cam: 3, flash: 0.7, time: 21 * 60 }); TR.drive(700, 6221, 4400, 6221, 480, { lane: 21 }); TR.follow(1.12, 1.25, 0.25);
        TR.carimbo('Pedágio?', 'não conheço', '#ff3b3b', 30, TR.n - 2, '50%', '33%', -7);` },
    { nome: '11-banana', bars: 1, antes: 20,
      setup: `TR.reset({ flash: 0.6, toasts: true, time: 22 * 60 + 10 }); const E = TR.spawnEv('banana', 3400, 6221); E.stage = 'collect';
        const e = E.edge, h = e.a.y === e.b.y, cx = E.x, cy = E.y;
        // passa pela faixa do lado oposto ao da carreta tombada (senão atravessa o caminhão)
        const lado = h ? Math.sign(E.y - e.a.y) : Math.sign(e.a.x - E.x), ida = lado <= 0 ? 1 : -1, x0 = h ? E.x - ida * 330 : e.a.x, y0 = h ? e.a.y : E.y - ida * 330;
        TR.drive(x0, y0, h ? x0 + ida * 1300 : x0, h ? y0 : y0 + ida * 1300, 130, { lane: 24, v0: 130 }); TR.follow(1.95, 2.15, 0.08);
        // as caixas ficam no caminho, uma por batida (o dinheiro cai no ritmo)
        TR.onFrame = (f) => { if (f === 1 && TR.rec) { document.getElementById('toasts').innerHTML = ''; const R = TR.rail; E.crates.forEach((c, k) => { if (k < 4) { const q = TR.at(R, R.s + 24 + k * 60); c.x = q[0]; c.y = q[1]; } c.got = k >= 4 ? c.got : false; }); } };
        TR.encarte('Oferta', 'R$ 0,99', 'o cacho', 22, TR.n, '21%', '44%', -9);` },
    // arranhão de disco, imagem congela e a música para (só o grilo)
    { nome: '12-biu', bars: 1, antes: 0, sfx: [{ t: 0.15, s: 'scratch' }, { t: 0.62, s: 'grilo' }], mudo: [0.16, 99],
      setup: `TR.flash0 = 0.35; document.getElementById('toasts').style.visibility = 'hidden'; const E = Events.cur; TR.rail.speed = 0;
        TR.cam({ z: [4.2, 4.7], at: () => [E.npc.x + 30, E.npc.y - 10], n: TR.n }); TR.onFrame = null;
        TR.freezeAt = 10; TR.charCard('Seu Biu', 'Caminhoneiro · tomba toda semana', '#f1c40f', 10, TR.drawSeuBiu);` },
    { nome: '13-noivo', bars: 1, antes: 30, motor: true,
      setup: `TR.reset({ hud: true, flash: 0.6, time: 22 * 60 + 40 }); const E = TR.spawnEv('noivo', 1600, 2700);
        E.stage = 'drive'; E.npc = null; E.tmax = 25; E.left = 9.4; E.target = E.dest; Act.gpsT = 0;
        TR.toward(E.dest.x, E.dest.y, 560, 300); TR.follow(1.6, 1.75, 0.2);
        TR.subtitle('Leve o noivo <c>' + E.nome + '</c> até a <y>' + E.dest.name.split(' (')[0] + '</y>.', 4, TR.n - 4);
        TR.carimbo('O padre tá esperando', null, '#ff3b3b', 34, TR.n - 2, '50%', '34%', -6);` },
    { nome: '14-blitz', bars: 1, antes: 20,
      setup: `TR.reset({ flash: 0.6, time: 23 * 60 }); const E = TR.spawnEv('blitz', 1600, 3880); TR.toward(E.x, E.y, 320, 170); TR.fixo(E.x, E.y, 2.1, 2.5);
        TR.subtitle('<c>Lei Seca</c>: Bebeu hoje? <y>— Só caldo de cana, seu guarda!</y>', 4, TR.n - 4);
        TR.carimbo('Bafômetro: 0,00', null, '#2bdc6a', 58, TR.n - 2, '50%', '32%', -8);` },
    { nome: '15-arraia', bars: 1, antes: 20,
      setup: `TR.reset({ flash: 0.6, time: 22 * 60 + 30 }); const E = TR.spawnEv('festa', 1500, 3300); E.party = true; E.stage = 'wait'; player.place(E.x + 3000, E.y + 3000, 0); TR.rail = null; TR.fixo(E.x, E.y, 2.1, 2.6);
        TR.meme('Festa junina', 'o ano inteiro', 3, TR.n);` },
    { nome: '16-garagem', bars: 1, antes: 6,
      setup: `TR.reset({ bigGar: true, flash: 0.5 }); ${garagem('neon')} let i = 0; const neon = ['#ff2bd6', '#39ff6a', '#ffcc2e', '#22d1ff'];
        TR.onFrame = (f) => { if (TR.rec && TR.beat(f)) { Garage.preview.neon = neon[i++ % 4]; TR.flash = 0.25; Garage.render(); } };
        TR.encarte('Parcelado', '12x', 'sem juros', 8, TR.n, '82%', '40%', 8);` },
    /* ---------- PAUSA (música baixa, falas dos personagens) ---------- */
    { nome: '17-passageira', bars: 3, antes: 20, chuva: true, sfx: [{ t: 0.1, s: 'ping' }],
      setup: `TR.reset({ lb: ${LB}, bigPhone: true, rain: 0.7, camOff: [260, 0], time: 22 * 60 }); TR.drive(400, 900, 2750, 900, 220, { lane: 23 }); TR.follow(1.5, 1.6); TR.slow = 0.5;
        newRideRequest(); const R = Act.ride; R.name = 'Dona Rosângela'; R.stage = 'drive'; pgChats().length = 0;
        pgMsg(R, 'Ô moço, que corrida foi essa?! Minha moqueca virou sopa!'); Phone.open('pegaai'); Phone.pgChat = pgChats()[0] && pgChats()[0].rid; Phone.render();
        TR.subtitle('<c>Dona Rosângela</c>: Ô moço, que corrida foi essa?! Minha moqueca virou sopa!', 8, 240, 760);
        // depois da fala: 1 estrela e o trombone triste
        TR.estrelas(1, '"Dirige igual piloto de fuga."', 249, TR.n, '31%', '50%');` },
    { nome: '18-oficina', bars: 3.5, antes: 30,
      setup: `TR.reset({ lb: ${LB}, time: 22 * 60 + 5, charBottom: 280 }); ${naOficina(90)}
        TR.fixo(ox, oy - 20, 2.4, 3.0); TR.slow = 0.7; TR.charCard('Seu Zé', 'Mecânico · fiado, só uma vez', '#ffcc2e', 2, drawSeuZe);
        TR.subtitle('<c>Seu Zé</c>: Bateu de novo, bicho? Traz aqui... mas fiado é só uma vez!', 10, TR.n - 6);
        TR.papelao('Fiado só amanhã', '(e amanhã nunca chega)', 266, TR.n, '73%', '33%', 4);` },
    // placar de futebol e apito do juiz (fim de jogo) no silêncio antes do drop 2
    { nome: '19-carreta', bars: 2.5, antes: 30, sfx: [{ t: 3.32, s: 'apito' }],
      setup: `TR.reset({ lb: ${LB}, time: 22 * 60 + 10 }); const E = TR.spawnEv('banana', 3400, 6221); E.stage = 'collect'; player.place(E.x + 2000, E.y, 0);
        TR.fixo(E.x, E.y, 1.75, 2.1, E.npc.x, E.npc.y); TR.slow = 0.6;
        TR.subtitle('<c>Seu Biu</c>: Ô meu patrão! Tá banana até no poste!', 12, TR.n - 10);
        TR.placar('Carreta', 0, 1, 'Poste', "2ºT 47'", 170, TR.n, '50%', '${LB + 92}px');` },
    /* ---------- DROP 2 (cortes rápidos) ---------- */
    { nome: '20-poca2', bars: 0.5, antes: 30, chuva: true, motor: true, sfx: [{ t: 0, s: 'impacto' }],
      setup: `TR.reset({ flash: 0.8, rain: 1, time: 22 * 60 }); TR.drive(400, 1500, 2700, 1500, 300, { lane: 25 }); TR.follow(2.2, 2.35, 0.08);
        TR.onFrame = (f) => { if (f === 1 && TR.rec) { ${poca(26)} } };` },
    { nome: '21-rival', bars: 0.5, antes: 10, motor: true,
      setup: `TR.reset({ flash: 0.5, time: 23 * 60 + 40 }); ${racha(900)} TR.follow(2.4, 2.2, 0.12);` },
    { nome: '22-chupeta', bars: 0.5, antes: 24,
      setup: `TR.reset({ flash: 0.5, time: 22 * 60 + 50 }); const E = TR.spawnEv('quebrado', 1600, 2700); E.kind = 'bateria'; E.stage = 'fix'; E.smoke = 0; E.hold = 0.2;
        const px = E.x - Math.cos(E.a) * 47, py = E.y - Math.sin(E.a) * 47; player.place(px, py, E.a); TR.rail = null;
        TR.fixo((E.x + px) / 2, (E.y + py) / 2, 2.9, 3.15); TR.carimbo('Chupeta', 'na bateria', '#ffcc2e', 5, TR.n, '50%', '28%', -8);` },
    { nome: '23-paredao', bars: 0.5, antes: 10,
      setup: `TR.reset({ flash: 0.5, time: 23 * 60 + 30 }); const pc = World.pracaBagunca, ne = nearestEdge(pc.x, pc.y), e = ne.e;
        const x = e.a.x + e.dx * ne.s - e.dy * 24, y = e.a.y + e.dy * ne.s + e.dx * 24; player.place(x, y, Math.atan2(e.dy, e.dx)); TR.rail = null;
        Som.on = true; TR.people(11, x, y, 62); TR.fixo(x, y, 2.4, 2.6); TR.onFrame = (f) => { if (TR.beat(f)) Cam.shake = 1.6; };
        TR.carimbo('Paredão ligado', 'vizinho acordado', '#ff3fd8', 5, TR.n, '50%', '27%', 7);` },
    { nome: '24-orla', bars: 1, antes: 40,
      setup: `TR.reset({ flash: 0.4, time: 23 * 60 + 50, camOff: [0, 130] }); TR.drive(6400, 8725, 8500, 8725, 280, { lane: 25 }); TR.follow(1.05, 1.2, 0.3);` },
    { nome: '25-carona', bars: 0.5, antes: 20,
      setup: `TR.reset({ flash: 0.5, time: 21 * 60 + 30 }); const E = TR.spawnEv('carona', 2500, 6221); if (E && E.pick) TR.toward(E.pick.x, E.pick.y, 160, 150);
        TR.fixo(E.npc.x, E.npc.y, 2.8, 3.1);` },
    { nome: '26-viela', bars: 0.5, antes: 20,
      setup: `TR.reset({ flash: 0.5, time: 23 * 60 + 20 }); const v = World.animalsDef.filter((d) => d.type === 'person' && d.n === 3 && d.rect[2] - d.rect[0] < 14 && d.rect[1] > 6400)[3];
        const cx = (v.rect[0] + v.rect[2]) / 2, cy = (v.rect[1] + v.rect[3]) / 2; player.place(cx + 3000, cy, 0); TR.rail = null; TR.fixo(cx, cy - 60, 2.0, 1.85, cx, cy + 60);` },
    { nome: '27-pintura', bars: 0.5, antes: 6,
      setup: `TR.reset({ bigGar: true, flash: 0.5 }); ${garagem('paint')} let i = 0; const cor = ['#f1c40f', '#1f2a44', '#e8e8e8'];
        TR.onFrame = (f) => { if (TR.rec && TR.beat(f)) { Garage.previewColor = cor[i++ % 3]; TR.flash = 0.25; Garage.render(); } };
        TR.encarte('Pintura', 'R$ 150', 'cada', 4, TR.n, '82%', '40%', 8);` },
    { nome: '28-neon', bars: 1, antes: 40, motor: true,
      setup: `TR.reset({ flash: 0.4, time: 23 * 60 + 10 }); TR.drive(500, 1520, 2700, 1520, 230, { lane: 25 }); TR.follow(3.3, 3.0, 0.05); TR.slow = 0.6;
        TR.meme('Rebaixado, neon e paredão', 'e a prestação atrasada', 3, TR.n);` },
    { nome: '29-br2', bars: 0.5, antes: 40, motor: true,
      setup: `TR.reset({ cam: 3, flash: 0.5, time: 21 * 60 + 40 }); TR.drive(4400, 6179, 700, 6179, 500, { lane: 21 }); TR.follow(1.2, 1.3, 0.3);` },
    { nome: '30-aerea', bars: 1, antes: 30,
      setup: `TR.reset({ flash: 0.4, time: 23 * 60 + 30 }); TR.drive(400, 7525, 3300, 7525, 260, { lane: 25 }); TR.fixo(1800, 7600, 0.78, 0.92, 2600, 7650);` },
    { nome: '31-heroi', bars: 1, antes: 50, motor: true, sfx: [{ t: 1.2, s: 'whoosh' }],
      setup: `TR.reset({ flash: 0.4, time: 23 * 60 + 45 }); TR.drive(4400, 7475, 400, 7475, 400, { lane: 25 }); TR.slow = 0.4; TR.follow(2.4, 1.5, 0.12);
        TR.meme('Eu indo na padaria', 'comprar dois pãezinhos', 3, TR.n);` },
    /* ---------- FINAL ---------- */
    // depois do "cuidado com o buraco!": pancada no buraco e a calota saindo rodando, com a tela já escura
    { nome: '32-logo', bars: 4.5, antes: 30, sfx: [{ t: 0, s: 'impacto' }, { t: 6.74, s: 'calota' }],
      setup: `TR.reset({ flash: 1, time: 23 * 60 + 55 }); TR.drive(2100, 400, 2100, 3800, 200, { lane: 25 }); TR.fixo(2100, 1200, 0.9, 1.0, 2100, 1500);
        TR.card(true, true, 'Acelera, mermão. E cuidado com o buraco.'); TR.aviso('Nenhuma banana foi ferida durante a gravação deste trailer.', 290, TR.n); const lg = TR.ov.querySelector('.tr-logo .logo');
        TR.onFrame = (f) => { const n = TR.n; TR.blackO = f > n - 50 ? Math.min(1, 0.86 + (f - (n - 50)) / 50) : Math.min(0.86, 0.55 + f / 25);
          TR.logoO = f > n - 50 ? Math.max(0, (n - f) / 50) : 1; if (lg) lg.style.transform = 'scale(' + (1.35 + 0.35 * Math.max(0, 1 - f / 7)) + ')'; };` },
  ],
};

// Trailer curto no estilo GTA 6 (no máximo 1:30): 41 compassos a 110 batidas por minuto = 89,5 s.
// uso (de dentro de tools/trailer):  ROTEIRO=./gta6/roteiro.js node gravar.js [cena ...]
// depois: python3 gta6/som.py && ./gta6/montar.sh
// Abertura com diálogo no escuro, cidade, clipes "do povo" na vertical (rede social Fuxico), plantão da TV,
// nome dos personagens, frase de efeito, clímax em câmera lenta, "Vai com Deus..." e o cartaz final.
const LB = 138; // faixas de cinema (tela 2.39:1)
const semPolicia = `for (const c of Traffic.cars) if (c.model === 'police') { c.release(); c.dead = true; } Traffic.cars = Traffic.cars.filter((c) => !c.dead);`;
const poca = (frente) => `if (!Weather.puddleGrid) Weather.buildPuddles(); { const R = TR.rail, q = TR.at(R, R.s + ${frente}), p = { x: q[0], y: q[1], rx: 24, ry: 9, mud: false, cool: 0, ph: 1 }; const C = Weather.puddleCell, k = Math.floor(p.x / C) + ',' + Math.floor(p.y / C); if (!Weather.puddleGrid.has(k)) Weather.puddleGrid.set(k, []); Weather.puddleGrid.get(k).push(p); }`;
// na frente da oficina do Seu Zé (ox, oy = vaga na rua, de frente pra oficina; vx, vy = câmera puxada pro lado da placa)
const naOficina = () => `const of = World.shops.find((x) => x.kind === 'oficina'), ne = nearestEdge(of.x, of.y), e = ne.e;
  const ox = e.a.x + e.dx * ne.s - e.dy * 24, oy = e.a.y + e.dy * ne.s + e.dx * 24; player.place(ox, oy, Math.atan2(e.dy, e.dx)); TR.rail = null; const od = Math.hypot(of.x - ox, of.y - oy) || 1, vx = ox - (of.x - ox) / od * 80, vy = oy - (of.y - oy) / od * 80;`;
// arrancada na BR-101 contra o Zé do Canecão (skip = já no meio da corrida)
const racha = (skip, t) => `${semPolicia} const r = World.rachas.find((x) => x.id === 'arrancada');
  TR.drive(r.start[0], r.start[1], r.pts[r.pts.length - 1][0], r.pts[r.pts.length - 1][1], 460, { lane: 0, v0: ${skip ? 420 : 0}, skip: ${skip || 0} });
  Profile.money = Math.max(Profile.money, 5000); startRacha(r); Act.race.count = ${t === undefined ? 0 : t}; Act.race.t = ${skip ? (skip / 360).toFixed(2) : 0};
  TR.onFrame = () => { ${semPolicia} };`;
const social = (o) => `TR.social(${JSON.stringify(o)});`;

module.exports = {
  bpm: 110,
  pastas: { quadros: 'gta6/quadros', eventos: 'gta6/eventos', previa: 'gta6/previa' },
  extra: ['gta6/estilo.js'],
  // falas (ElevenLabs, projeto "BR Night Drive - Trailer GTA 6 (falas)"): gta6/voz/<id>.mp3 entra no compasso "bar"
  vozes: [
    { id: 'z1', bar: 0.45, quem: 'Seu Zé' }, { id: 'm1', bar: 3.15, quem: 'Motorista' },
    { id: 'm2', bar: 19.1, quem: 'Motorista' }, { id: 'z2', bar: 36.2, quem: 'Seu Zé' },
  ],
  cenas: [
    /* ---------- ABERTURA: diálogo no escuro (sem música) ---------- */
    // "Me fala uma coisa, meu filho... por que você veio parar em São Gambiarra?"
    { nome: '01-oficina', bars: 3, antes: 30,
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 + 30 }); ${naOficina()}
        TR.fixo(vx, vy, 1.5, 2.15); TR.slow = 0.75; TR.blackO = 1;
        TR.onFrame = (f) => { TR.blackO = f < 75 ? 1 : Math.max(0, 1 - (f - 75) / 120); };` },
    // "Azar, eu acho." (o carro sai devagar da oficina)
    { nome: '02-saida', bars: 2, antes: 10, motor: true,
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 + 31 }); ${naOficina()}
        TR.drive(ox - Math.cos(player.a) * 30, oy - Math.sin(player.a) * 30, ox + Math.cos(player.a) * 2400, oy + Math.sin(player.a) * 2400, 150, { lane: 24, v0: 0 });
        TR.fixo(player.x, player.y, 1.45, 1.55, player.x + Math.cos(player.a) * 120, player.y + Math.sin(player.a) * 120);` },
    /* ---------- A CIDADE (a música entra) ---------- */
    { nome: '03-cidade', bars: 2, antes: 40,
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 + 20 }); TR.drive(500, 1260, 2700, 1260, 140, { lane: 24 });
        TR.fixo(1600, 1150, 0.72, 0.86, 1850, 1330); TR.titulo('São Gambiarra', 'Espírito Santo', 24, TR.n - 4);` },
    { nome: '04-orla', bars: 1, antes: 40, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 23 * 60 + 50, camOff: [0, 130] }); TR.drive(6400, 8725, 8500, 8725, 280, { lane: 25 }); TR.follow(1.05, 1.2, 0.3);` },
    { nome: '05-ponte', bars: 1, antes: 60, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 23 * 60 }); TR.drive(4300, 1520, 6600, 1520, 340, { lane: 24 }); TR.follow(1.6, 1.9, 0.12); TR.slow = 0.45;` },
    /* ---------- O POVO FILMA (bateria entra) ---------- */
    { nome: '06-tv-banana', bars: 1.5, antes: 30,
      setup: `TR.reset({ lb: 0, time: 22 * 60 + 10 }); const E = TR.spawnEv('banana', 3400, 6221); E.stage = 'collect'; player.place(E.x + 2000, E.y, 0); TR.rail = null;
        TR.fixo(E.x, E.y, 1.8, 2.05, E.npc.x, E.npc.y); TR.slow = 0.85;
        TR.tv({ manchete: 'Carreta de banana tomba na BR pela 47ª vez', sub: 'Motorista garante que "a curva mudou de lugar"', hora: '22:10',
          letreiro: 'TRÂNSITO: Ponte Nova segue em obras desde 1987  ·  TEMPO: chuva forte na Serra durante a noite  ·  ECONOMIA: Banestresse anuncia juros "camaradas"' });` },
    { nome: '07-lombada', bars: 1, antes: 0, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 23 * 60 + 5 }); TR.lombada(62, 300, 0.42); TR.follow(3.0, 3.4, 0.05); TR.onBump = () => { TR.flash = 0.2; };` },
    { nome: '08-blitz', bars: 1.5, antes: 20,
      setup: `TR.reset({ lb: 0, time: 23 * 60 }); const E = TR.spawnEv('blitz', 1600, 3880); TR.toward(E.x, E.y, 320, 170); TR.fixo(E.x, E.y - 70, 2.5, 2.8);
        ${social({ user: '@flagra.sg', cor: '#2bb3ff', curtidas: '8.432', coment: '611', txt: 'blitz da lei seca 23h e o cara soprou 0,00. disse que só bebeu caldo de cana kkkkk <b>#SãoGambiarra</b> <b>#LeiSeca</b>' })}` },
    { nome: '09-br', bars: 1, antes: 40, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, cam: 3, time: 21 * 60 }); TR.drive(700, 6221, 4400, 6221, 480, { lane: 21 }); TR.follow(1.12, 1.25, 0.25);` },
    { nome: '10-paredao', bars: 1.5, antes: 10,
      setup: `TR.reset({ lb: 0, time: 23 * 60 + 30 }); const pc = World.pracaBagunca, ne = nearestEdge(pc.x, pc.y), e = ne.e;
        const x = e.a.x + e.dx * ne.s - e.dy * 24, y = e.a.y + e.dy * ne.s + e.dx * 24; player.place(x, y, Math.atan2(e.dy, e.dx)); TR.rail = null;
        Som.on = true; TR.people(11, x, y, 62); TR.fixo(x, y, 2.6, 2.75); TR.onFrame = (f) => { if (TR.beat(f)) Cam.shake = 1.4; };
        ${social({ user: '@paredao.da.praca', cor: '#ff3fd8', curtidas: '21,7 mil', coment: '2.093', txt: 'o vizinho pediu pra abaixar o som. a gente abaixou... o vidro <b>#paredão</b> <b>#ES</b>' })}` },
    { nome: '11-poca', bars: 1, antes: 40, motor: true, chuva: true,
      setup: `TR.reset({ lb: 0, hud: true, rain: 1, time: 22 * 60 }); TR.drive(400, 900, 2750, 900, 280, { lane: 23 }); TR.follow(2.5, 2.85, 0.08); TR.slow = 0.32;
        TR.onFrame = (f) => { if (f === 1 && TR.rec) { ${poca(22)} } };` },
    { nome: '12-arraia', bars: 1.5, antes: 20,
      setup: `TR.reset({ lb: 0, time: 22 * 60 + 30 }); const E = TR.spawnEv('festa', 1500, 3300); E.party = true; E.stage = 'wait'; player.place(E.x + 3000, E.y + 3000, 0); TR.rail = null; TR.fixo(E.x, E.y, 2.4, 2.65);
        ${social({ user: '@arraia.sem.fim', cor: '#ffb020', curtidas: '5.120', coment: '348', txt: 'festa junina em novembro? aqui pode, bicho. quentão liberado até o padre chegar <b>#arraiá</b> <b>#SãoGambiarra</b>' })}` },
    { nome: '13-neon', bars: 1, antes: 40, motor: true, chuva: true,
      setup: `TR.reset({ lb: 0, hud: true, rain: 0.6, time: 23 * 60 + 10 }); TR.drive(500, 1520, 2700, 1520, 230, { lane: 25 }); TR.follow(3.3, 3.0, 0.05); TR.slow = 0.6;` },
    /* ---------- PAUSA: "Aqui é assim: ou você acelera... ou a cidade te atropela." ---------- */
    { nome: '14-frase', bars: 2, antes: 40, motor: true,
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 + 40, camOff: [0, 40] }); TR.drive(6400, 8725, 8500, 8725, 260, { lane: 25 }); TR.slow = 0.5; TR.follow(2.7, 1.7, 0.1);` },
    /* ---------- REFRÃO (cortes rápidos, nomes dos personagens) ---------- */
    { nome: '15-largada', bars: 1, antes: 0,
      setup: `TR.reset({ lb: 0, hud: true, time: 23 * 60 + 40 }); Profile.damage = 0; ${racha(0, '(TR.n - 6) / 60')}
        TR.fixo(r.start[0] + 70, r.start[1] + 8, 2.2, 2.5); TR.nome('Zé do Canecão', 'Dono do racha · nunca perdeu (segundo ele)', 10, TR.n - 2);` },
    { nome: '16-vai', bars: 1, antes: 0, motor: true, sfx: [{ t: 0, s: 'impacto' }, { t: 0.04, s: 'pneu' }],
      setup: `TR.flash0 = 0.9; TR.slow = 1; TR.lb = 0; TR.nmo = null; TR.follow(1.75, 1.45, 0.22);` },
    { nome: '17-moqueca', bars: 1.5, antes: 40, motor: true,
      setup: `TR.reset({ lb: 0, time: 21 * 60 + 15 }); TR.drive(850, 2100, 850, 4400, 330, { lane: 23 }); TR.follow(2.3, 2.5, 0.12);
        ${social({ user: '@rosangela.moquecas', cor: '#ff6a3d', curtidas: '47,3 mil', coment: '5.871', txt: 'pedi um PegaAí com uma moqueca no colo. cheguei com sopa. 1 estrela pro piloto de fuga <b>#PegaAí</b> <b>#capixaba</b>' })}` },
    { nome: '18-seuze', bars: 1, antes: 30,
      setup: `TR.reset({ lb: ${LB}, time: 22 * 60 + 5 }); ${naOficina()} TR.fixo(vx, vy, 2.2, 2.45); TR.slow = 0.6;
        TR.nome('Seu Zé', 'Mecânico · fiado, só uma vez', 6, TR.n - 2);` },
    { nome: '19-rival', bars: 1, antes: 10, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 23 * 60 + 40 }); ${racha(900)} TR.follow(2.3, 2.1, 0.12);` },
    { nome: '20-chupeta', bars: 1.5, antes: 24,
      setup: `TR.reset({ lb: 0, time: 22 * 60 + 50 }); const E = TR.spawnEv('quebrado', 1600, 2700); E.kind = 'bateria'; E.stage = 'fix'; E.smoke = 0; E.hold = 0.2;
        const px = E.x - Math.cos(E.a) * 47, py = E.y - Math.sin(E.a) * 47; player.place(px, py, E.a); TR.rail = null;
        TR.fixo((E.x + px) / 2, (E.y + py) / 2, 3.0, 3.25);
        ${social({ user: '@zezinho.da.kombi', cor: '#2bdc6a', curtidas: '12,9 mil', coment: '904', txt: 'bateria arriou 23h e um doido de Opalha rebaixado parou pra dar chupeta. ainda existe gente boa nesse mundo <b>#SãoGambiarra</b>' })}` },
    { nome: '21-seubiu', bars: 1, antes: 20,
      setup: `TR.reset({ lb: ${LB}, time: 22 * 60 + 10 }); const E = TR.spawnEv('banana', 3400, 6221); E.stage = 'collect'; player.place(E.x + 2000, E.y, 0); TR.rail = null;
        TR.fixo(E.x, E.y, 2.35, 2.75, (E.x * 2 + E.npc.x) / 3, (E.y * 2 + E.npc.y) / 3); TR.slow = 0.6; TR.nome('Seu Biu', 'Caminhoneiro · tomba toda semana', 6, TR.n - 2);` },
    { nome: '22-viela', bars: 1, antes: 20,
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 + 20 }); const v = World.animalsDef.filter((d) => d.type === 'person' && d.n === 3 && d.rect[2] - d.rect[0] < 14 && d.rect[1] > 6400)[3];
        const cx = (v.rect[0] + v.rect[2]) / 2, cy = (v.rect[1] + v.rect[3]) / 2; player.place(cx + 3000, cy, 0); TR.rail = null; TR.fixo(cx, cy - 60, 2.0, 1.85, cx, cy + 60);` },
    { nome: '23-orla2', bars: 1, antes: 40, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 23 * 60 + 50, camOff: [0, 120] }); TR.drive(8500, 8725, 6400, 8725, 420, { lane: 25 }); TR.follow(1.5, 1.35, 0.25);` },
    { nome: '24-aerea', bars: 1, antes: 30,
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 + 30 }); TR.drive(400, 7525, 3300, 7525, 260, { lane: 25 }); TR.fixo(1800, 7600, 0.78, 0.92, 2600, 7650);` },
    { nome: '25-br2', bars: 1, antes: 40, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, cam: 3, time: 21 * 60 + 40 }); TR.drive(4400, 6179, 700, 6179, 520, { lane: 21 }); TR.follow(1.2, 1.3, 0.3);` },
    /* ---------- CLÍMAX (câmera lenta e corte seco) ---------- */
    { nome: '26-heroi', bars: 2, antes: 50, motor: true, sfx: [{ t: 2.6, s: 'whoosh' }],
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 + 45 }); TR.drive(4400, 7475, 400, 7475, 400, { lane: 25 }); TR.slow = 0.35; TR.follow(2.6, 1.5, 0.12);` },
    { nome: '27-ultimo', bars: 1, antes: 40, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, cam: 3, time: 23 * 60 + 50 }); TR.drive(700, 6221, 4400, 6221, 560, { lane: 21 }); TR.follow(1.6, 1.15, 0.3); TR.flash = 0.6;` },
    /* ---------- FINAL: "Vai com Deus, meu filho... e devagar, viu?" + cartaz ---------- */
    { nome: '28-escuro', bars: 2.5, antes: 30, motor: true,
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 + 58 }); TR.drive(2100, 400, 2100, 3800, 170, { lane: 25 }); TR.fixo(player.x, player.y + 120, 1.3, 1.2, player.x, player.y + 520);
        TR.onFrame = (f) => { TR.blackO = Math.min(1, 0.45 + f / 330); };` },
    { nome: '29-logo', bars: 2.5, antes: 0, sfx: [{ t: 0, s: 'impacto' }],
      setup: `TR.reset({ lb: 0, time: 23 * 60 + 59 }); TR.rail = null; TR.blackO = 1; TR.final(0); TR.flash = 0.7;
        TR.onFrame = (f) => { TR.blackO = f < TR.n - 30 ? 0 : Math.min(1, (f - (TR.n - 30)) / 26); };` },
  ],
};

// Trailer curto de cinema de um jogo de carro (no máximo 1:30): 41 compassos a 110 batidas por minuto = 89,5 s.
// uso (de dentro de tools/trailer):  ROTEIRO=./cinema/roteiro.js node gravar.js [cena ...]
// depois: python3 cinema/som.py && ./cinema/montar.sh
// Abertura com diálogo no escuro, a cidade, seções com título grande (DIRIJA, TRABALHE, CORRA, PERSONALIZE),
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
const garagem = (cat) => `Garage.sel = 'brasa'; Garage.tab = 'kit'; Garage.cat = '${cat}'; Garage.preview = {}; Garage.previewColor = null; Screens.open('screen-garage'); Garage.render();`;
const opala = `Profile.current = 'brasa'; player.setCar('brasa'); TR.hook();`; // volta pro Opalha depois do caminhão de gás

module.exports = {
  bpm: 110,
  pastas: { quadros: 'cinema/quadros', eventos: 'cinema/eventos', previa: 'cinema/previa' },
  extra: ['cinema/estilo.js'],
  // falas (ElevenLabs, projeto "BR Night Drive - Trailer GTA 6 (falas)"): cinema/voz/<id>.mp3 entra no compasso "bar"
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
        TR.fixo(1600, 1150, 0.72, 0.86, 1850, 1330); TR.titulo('São Gambiarra', 'a cidade que nunca dorme', 24, TR.n - 4);` },
    { nome: '04-orla', bars: 1, antes: 40, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 23 * 60 + 50, camOff: [0, 130] }); TR.drive(6400, 8725, 8500, 8725, 280, { lane: 25 }); TR.follow(1.05, 1.2, 0.3);` },
    { nome: '05-ponte', bars: 1, antes: 60, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 23 * 60 }); TR.drive(4300, 1520, 6600, 1520, 340, { lane: 24 }); TR.follow(1.6, 1.9, 0.12); TR.slow = 0.45;` },
    /* ---------- DIRIJA E TRABALHE (bateria entra) ---------- */
    { nome: '06-dirija', bars: 1.5, antes: 40, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, cam: 3, time: 21 * 60 + 10 }); TR.drive(1450, 6221, 5200, 6221, 500, { lane: 21 }); TR.follow(1.15, 1.3, 0.25);
        TR.titulo('Dirija', 'a noite inteira', 4, TR.n - 6);` },
    { nome: '07-lombada', bars: 1, antes: 0, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 23 * 60 + 5 }); TR.lombada(62, 300, 0.42); TR.follow(3.0, 3.4, 0.05); TR.onBump = () => { TR.flash = 0.2; };` },
    { nome: '08-poca', bars: 1, antes: 40, motor: true, chuva: true,
      setup: `TR.reset({ lb: 0, hud: true, rain: 1, time: 22 * 60 }); TR.drive(400, 900, 2750, 900, 280, { lane: 23 }); TR.follow(2.5, 2.85, 0.08); TR.slow = 0.32;
        TR.onFrame = (f) => { if (f === 1 && TR.rec) { ${poca(22)} } };` },
    // corrida no app: o carro vai buscar o passageiro (painel com o objetivo e o GPS)
    { nome: '09-trabalhe', bars: 1.5, antes: 30, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, toasts: true, time: 20 * 60 + 50 }); player.place(1600, 2100, 0); const C = career(); C.lvl = 2; C.acc = { comum: true, aero: false, mudanca: false, vip: false };
        newRideRequest(); const R = Act.ride; R.name = 'Marcão'; TR.toward(R.pick.x, R.pick.y, 380, 200); TR.follow(1.9, 2.2, 0.12);
        TR.titulo('Trabalhe', 'corridas, entregas e fretes', 4, TR.n - 6);` },
    { nome: '10-gas', bars: 1, antes: 20, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 20 * 60 + 54 }); Profile.current = 'gas'; player.setCar('gas'); TR.hook(); startJob(genJob('gas')); const J = Act.delivery; J.stage = 'deliver'; GasJingle.t = 0;
        const r = TR.drive(J.pick.x, J.pick.y, J.dest.x, J.dest.y, 190, { lane: 22 }); r.s = r.len * 0.45; r.v = 190; TR.follow(1.6, 1.75, 0.12);` },
    // a carreta do Seu Biu tombou: o carro passa recolhendo as caixas (o dinheiro entra no canto)
    { nome: '11-bananas', bars: 1.5, antes: 20,
      setup: `TR.reset({ lb: 0, hud: true, toasts: true, time: 22 * 60 + 10 }); ${opala} const E = TR.spawnEv('banana', 3400, 6221); E.stage = 'collect';
        const e = E.edge, h = e.a.y === e.b.y, lado = h ? Math.sign(E.y - e.a.y) : Math.sign(e.a.x - E.x), ida = lado <= 0 ? 1 : -1, x0 = h ? E.x - ida * 330 : e.a.x, y0 = h ? e.a.y : E.y - ida * 330;
        TR.drive(x0, y0, h ? x0 + ida * 1300 : x0, h ? y0 : y0 + ida * 1300, 130, { lane: 24, v0: 130 }); TR.follow(1.95, 2.15, 0.08);
        TR.onFrame = (f) => { if (f === 1 && TR.rec) { document.getElementById('toasts').innerHTML = ''; const R = TR.rail; E.crates.forEach((c, k) => { if (k < 6) { const q = TR.at(R, R.s + 24 + k * 50); c.x = q[0]; c.y = q[1]; c.got = false; } }); } };` },
    { nome: '12-neon', bars: 1, antes: 40, motor: true, chuva: true,
      setup: `TR.reset({ lb: 0, hud: true, rain: 0.6, time: 23 * 60 + 10 }); ${opala} TR.drive(500, 1520, 2700, 1520, 230, { lane: 25 }); TR.follow(3.3, 3.0, 0.05); TR.slow = 0.6;` },
    // carro quebrado no caminho: chupeta na bateria
    { nome: '13-chupeta', bars: 1.5, antes: 24,
      setup: `TR.reset({ lb: ${LB}, time: 22 * 60 + 50 }); const E = TR.spawnEv('quebrado', 1600, 2700); E.kind = 'bateria'; E.stage = 'fix'; E.smoke = 0; E.hold = 0.2;
        const px = E.x - Math.cos(E.a) * 47, py = E.y - Math.sin(E.a) * 47; player.place(px, py, E.a); TR.rail = null; TR.fixo((E.x + px) / 2, (E.y + py) / 2, 2.6, 2.95);` },
    /* ---------- PAUSA: "Aqui é assim: ou você acelera... ou a cidade te atropela." ---------- */
    { nome: '14-frase', bars: 2, antes: 40, motor: true,
      setup: `TR.reset({ lb: ${LB}, time: 23 * 60 + 40, camOff: [0, 40] }); TR.drive(6400, 8725, 8500, 8725, 260, { lane: 25 }); TR.slow = 0.5; TR.follow(2.7, 1.7, 0.1);` },
    /* ---------- CORRA E PERSONALIZE (cortes rápidos, nomes dos personagens) ---------- */
    { nome: '15-largada', bars: 1, antes: 0,
      setup: `TR.reset({ lb: 0, hud: true, time: 23 * 60 + 40 }); Profile.damage = 0; ${racha(0, '(TR.n - 6) / 60')}
        TR.fixo(player.x + 70, player.y + 20, 2.2, 2.5); TR.nome('Zé do Canecão', 'Dono do racha · nunca perdeu (segundo ele)', 10, TR.n - 2);` },
    { nome: '16-vai', bars: 1, antes: 0, motor: true, sfx: [{ t: 0, s: 'impacto' }, { t: 0.04, s: 'pneu' }],
      setup: `TR.flash0 = 0.9; TR.slow = 1; TR.lb = 0; TR.nmo = null; TR.follow(1.75, 1.45, 0.22); TR.titulo('Corra', 'rachas e percursos', 44, TR.n - 2);` },
    // percurso cronometrado pelo Centrão (bandeiras, tempo e medalha)
    { nome: '17-percurso', bars: 1.5, antes: 10, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, toasts: true, time: 20 * 60 + 52 }); const r = World.races.find((x) => x.id === 'centro');
        const R = TR.drive(r.start[0], r.start[1], r.pts[0][0], r.pts[0][1], 0, { lane: 0, v0: 0 }); TR.follow(1.7, 1.9, 0.15);
        TR.onFrame = (f) => { if (!TR.rec) return; if (f === 6) { KeyPress.push('KeyE'); R.speed = 330; } if (f <= 30 && Act.race && Act.race.count > 0.6) Act.race.count = 0.6; };` },
    { nome: '18-seuze', bars: 1, antes: 30,
      setup: `TR.reset({ lb: ${LB}, time: 22 * 60 + 5 }); ${naOficina()} TR.fixo(vx, vy, 2.2, 2.45); TR.slow = 0.6;
        TR.nome('Seu Zé', 'Mecânico · fiado, só uma vez', 6, TR.n - 2);` },
    { nome: '19-rival', bars: 1, antes: 10, motor: true,
      setup: `TR.reset({ lb: 0, hud: true, time: 23 * 60 + 40 }); ${racha(900)} TR.follow(2.3, 2.1, 0.12);` },
    // garagem: a cor do neon muda a cada batida
    { nome: '20-garagem', bars: 1.5, antes: 6,
      setup: `TR.reset({ lb: 0, bigGar: true, flash: 0.5 }); ${garagem('neon')} let i = 0; const neon = ['#ff2bd6', '#39ff6a', '#ffcc2e', '#22d1ff'];
        TR.onFrame = (f) => { if (TR.rec && TR.beat(f)) { Garage.preview.neon = neon[i++ % 4]; TR.flash = 0.25; Garage.render(); } };` },
    { nome: '21-seubiu', bars: 1, antes: 20,
      setup: `TR.reset({ lb: ${LB}, time: 22 * 60 + 10 }); Screens.closeAll(); const E = TR.spawnEv('banana', 3400, 6221); E.stage = 'collect'; player.place(E.x + 2000, E.y, 0); TR.rail = null;
        TR.fixo(E.x, E.y, 2.35, 2.75, (E.x * 2 + E.npc.x) / 3, (E.y * 2 + E.npc.y) / 3); TR.slow = 0.6; TR.nome('Seu Biu', 'Caminhoneiro · tomba toda semana', 6, TR.n - 2);` },
    // o carro montado: rebaixado, neon, aerofólio e rodas de tala larga, de perto e em câmera lenta
    { nome: '22-personalize', bars: 1, antes: 40, motor: true,
      setup: `TR.reset({ lb: 0, time: 23 * 60 + 15 }); TR.drive(500, 2100, 2700, 2100, 230, { lane: 25 }); TR.follow(3.2, 2.8, 0.05); TR.slow = 0.55;
        TR.titulo('Personalize', 'pintura, rodas, neon e paredão', 4, TR.n - 4);` },
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

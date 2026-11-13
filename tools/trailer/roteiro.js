// Roteiro do trailer: cada cena prepara o jogo (setup) e grava N quadros (60 por segundo).
// "antes" = quadros rodados sem gravar, para o trânsito e a câmera se ajeitarem.
// TR.caption(texto grande, texto pequeno, quadro que entra, quadro que sai)
const F = 60;
module.exports = [
  {
    nome: '01-abertura', quadros: 3.2 * F, antes: 60,
    setup: `TR.reset({ time: 23 * 60 + 20 }); TR.drive(500, 1260, 2700, 1260, 120, { lane: 24 });
      TR.onFrame = (f) => { TR.blackO = Math.max(0.55, 1 - f / 60); TR.logoO = TR.fade(f, 25, 192 + 30, 35); };
      TR.card(true, true, 'Uma noite em São Gambiarra');`,
  },
  {
    nome: '02-ponte', quadros: 4 * F, antes: 90,
    setup: `TR.reset({ time: 23 * 60 }); TR.drive(4300, 1520, 6600, 1520, 330, { lane: 24 });
      TR.caption('São Gambiarra', 'Espírito Santo · 23:00', 25, 225);`,
  },
  {
    nome: '03-centro', quadros: 4 * F, antes: 120,
    setup: `TR.reset({ hud: true, time: 20 * 60 + 40 }); TR.drive(500, 1520, 2700, 1520, 270, { lane: 25 });
      TR.caption('Uma cidade inteira', 'pra rodar a noite toda', 25, 225);`,
  },
  {
    nome: '04-br', quadros: 3.5 * F, antes: 120,
    setup: `TR.reset({ cam: 3, time: 21 * 60 }); TR.drive(700, 6221, 4400, 6221, 430, { lane: 21 });
      TR.caption('BR-101 e Pouco', 'pé embaixo na rodovia', 25, 195);`,
  },
  {
    nome: '05-chuva', quadros: 4 * F, antes: 150,
    setup: `TR.reset({ rain: 0.95, time: 22 * 60 }); TR.drive(400, 900, 2750, 900, 230, { lane: 23 });
      TR.caption('Chuva, poça', 'e o povo de guarda-chuva', 25, 225);`,
  },
  {
    nome: '06-favela', quadros: 4.5 * F, antes: 120,
    setup: `TR.reset({ time: 23 * 60 + 30 }); TR.drive(400, 7525, 3300, 7525, 210, { lane: 25 });
      TR.caption('Feio Rosa · Cara-Pintada', 'pagode, viela e churrasco na laje', 25, 255);`,
  },
  {
    nome: '07-praia', quadros: 4 * F, antes: 120,
    setup: `TR.reset({ time: 23 * 60 + 50, camOff: [0, 120] }); TR.drive(5600, 8725, 8500, 8725, 260, { lane: 25 });
      TR.caption('Orla de Camburiso', 'quiosque, maré e o porto', 25, 225);`,
  },
  {
    nome: '08-pegaai', quadros: 3.6 * F, antes: 60,
    setup: `TR.reset({ hud: true, bigPhone: true, time: 21 * 60 + 15, camOff: [260, 0] }); TR.drive(850, 2100, 850, 4400, 200, { lane: 23 });
      Settings.msgMode = 'texto'; newRideRequest();
      const R = Act.ride; if (R) { pgMsg(R, 'Moço, tô na frente da padaria de blusa amarela. Vem logo que a moqueca tá esfriando!'); }
      Phone.open('pegaai'); Phone.pgChat = pgChats()[0] && pgChats()[0].rid; Phone.render();
      TR.caption('Corridas no PegaAí', 'e passageiro reclamando no chat', 25, 200);`,
  },
  {
    nome: '09-biu', quadros: 4 * F, antes: 30,
    setup: `TR.reset({ toasts: true, time: 22 * 60 + 10 }); player.place(3400, 6221, 0); Cam.x = 3400; Cam.y = 6221;
      let ok = false; for (let i = 0; i < 40 && !ok; i++) { Events.clear(); ok = Events.spawn('banana'); }
      const E = Events.cur; E.stage = 'collect'; E.life = 1e9;
      const e = E.edge, h = e.a.y === e.b.y, cx = E.x, cy = E.y;
      // passa por cima das caixas, devagar, recolhendo
      const c0 = E.crates.reduce((a, c) => (h ? c.x < a.x : c.y < a.y) ? c : a), c1 = E.crates.reduce((a, c) => (h ? c.x > a.x : c.y > a.y) ? c : a);
      TR.drive(h ? c0.x - 260 : cx, h ? cy : c0.y - 260, h ? c1.x + 400 : cx, h ? cy : c1.y + 400, 120, { lane: 24 });
      TR.caption('Carreta de banana tombada', 'o Seu Biu precisa de você', 25, 225);`,
  },
  {
    nome: '10-festa', quadros: 3 * F, antes: 30,
    setup: `TR.reset({ time: 22 * 60 + 30 }); player.place(1500, 3300, 0); Cam.x = 1500; Cam.y = 3300;
      let ok = false; for (let i = 0; i < 40 && !ok; i++) { Events.clear(); ok = Events.spawn('festa'); }
      const E = Events.cur; E.stage = 'wait'; E.offerT = 0; E.party = true; E.life = 1e9;
      const k = E.ent[0], dx = E.ent[1][0] - k[0], dy = E.ent[1][1] - k[1], L = Math.hypot(dx, dy);
      TR.drive(k[0] - dx / L * 420, k[1] - dy / L * 420, k[0] - dx / L * 40, k[1] - dy / L * 40, 150, { lane: 24 });
      TR.caption('Arraiá fechando a rua', 'quadrilha, quentão e fogueira', 20, 165);`,
  },
  {
    nome: '11-racha', quadros: 4 * F, antes: 0,
    setup: `TR.reset({ hud: true, time: 23 * 60 + 40 }); const r = World.rachas.find((x) => x.id === 'carapina');
      TR.drive(r.start[0], r.start[1], r.pts[r.pts.length - 1][0], r.pts[r.pts.length - 1][1], 380, { lane: 0, v0: 0 });
      for (const c of Traffic.cars) if (c.model === 'police') { c.release(); c.dead = true; } Traffic.cars = Traffic.cars.filter((c) => !c.dead); startRacha(r); Act.race.count = 0; Act.race.t = 0;
      // sem viatura passando (senão ela "pega" o racha)
      TR.onFrame = () => { for (const c of Traffic.cars) if (c.model === 'police') { c.release(); c.dead = true; } Traffic.cars = Traffic.cars.filter((c) => !c.dead); };
      TR.caption('Racha na avenida', 'aposta valendo, sem polícia por perto', 30, 225);`,
  },
  {
    nome: '12-garagem', quadros: 4 * F, antes: 30,
    setup: `TR.reset({ time: 22 * 60 }); Garage.sel = 'brasa'; Garage.tab = 'kit'; Garage.cat = 'neon'; Screens.open('screen-garage'); Garage.render();
      const neon = ['#22d1ff', '#ff2bd6', '#39ff6a', '#ffcc2e'], cor = ['#b3121f', '#1f2a44', '#f1c40f', '#e8e8e8'];
      TR.onFrame = (f) => { if (f % 60 === 1) { const i = Math.floor(f / 60) % 4; Garage.cat = i % 2 ? 'paint' : 'neon'; Garage.preview.neon = neon[i]; Garage.previewColor = cor[i]; Garage.render(); } };
      TR.caption('Do seu jeito', 'pintura, neon, rebaixado e paredão', 25, 225);`,
  },
  {
    nome: '13-final', quadros: 4.2 * F, antes: 60,
    setup: `TR.reset({ time: 23 * 60 + 55 }); TR.drive(2100, 400, 2100, 3800, 200, { lane: 25 });
      TR.card(true, true, 'Acelera, mermão. A cidade é sua.');
      TR.onFrame = (f) => { TR.blackO = Math.min(0.8, f / 40); TR.logoO = TR.fade(f, 20, 252 + 60, 30); };`,
  },
];

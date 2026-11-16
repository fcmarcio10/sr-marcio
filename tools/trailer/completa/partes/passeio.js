// Parte 7: o mundo livre depois da história — manhã de sol na cidade, chuva chegando, garagem (pintura e rodas) e a praia
const U0 = require('./_util.js');
module.exports = async (G) => {
  const U = U0(G);
  await U0.novoJogo(G, 6, { hora: 7 * 60 + 35, dinheiro: 9800, rides: 14, entregas: 8, fim: true });
  await G.js(() => { Act.waypoint = null; Events.spawnT = 1e9; });
  await G.grava(1);
  // passeio de manhã: vai até a garagem dando uma volta pela cidade
  const h = await G.js(() => [World.home.x, World.home.y]);
  const meio = await G.js(([hx, hy]) => { const s = World.shops.filter((q) => Math.hypot(q.x - hx, q.y - hy) > 1400 && Math.hypot(q.x - hx, q.y - hy) < 2200)[0]; return s ? [s.x, s.y] : [hx + 1500, hy]; }, h);
  await G.vai(meio[0], meio[1], { vel: 300 });
  await G.grava(16);
  await G.js(() => { Weather.target = 1; Settings.weather = 'chuva'; });  // a chuva vai chegando
  await G.grava(14);
  await G.pula(120, '!REC.piloto.R');
  await G.js(() => { Weather.rain = Weather.target = 1; Weather.wet = 1; });
  await U.dirige(h[0], h[1], { vel: 260, para: 20, ini: 12 });
  await G.grava(4, () => !!Act.prompt);
  await G.tecla('KeyE'); await G.grava(1.5);
  await G.foco('#screen-garage .garage', 16, 1.08); await G.grava(2);
  await G.toque('[data-gtab="kit"]'); await G.grava(1.5);
  await G.toque('[data-kcat="paint"]'); await G.grava(1.2);
  await G.toque('#garage-colors [data-kcol]:nth-child(6)'); await G.grava(1.8);
  await G.toque('[data-kpaint]'); await G.grava(2.2);
  await G.toque('[data-kcat="wheels"]'); await G.grava(1.5);
  await G.toque('[data-kopt="wheels"]:nth-of-type(3)'); await G.grava(1.8);
  await G.toque('[data-kbuy]'); await G.grava(2.5);
  await G.toque('#screen-garage [data-act="back"]'); await G.grava(2);
  // a chuva passa e o dia segue: vai até a praia e entra no mar
  await G.js(() => { Weather.target = 0; Settings.weather = 'limpo'; });
  const praia = await G.js(() => { const x = ORLA_X0 + 600; return [x, SAND_Y - 70]; });
  await U.dirige(praia[0], praia[1], { vel: 300, para: 0, ini: 8 });
  await G.grava(1.5);
  await G.js(() => REC.piloto.reto(0, 420, 140));
  await G.grava(14, () => Praia.conta !== undefined);
  await G.js(() => REC.piloto.para());
  await G.foco('#praia-conta', 3.5, 1.1);
  await G.grava(9, () => Praia.t > 0); await G.grava(6);
  await G.grava(9);
};

// Parte 2: capítulo "Ganha-pão" — PegaAí, chat com o passageiro, rádio e a missão cumprida
const U0 = require('./_util.js');
module.exports = async (G) => {
  const U = U0(G);
  await U0.novoJogo(G, 1, { hora: 22 * 60 + 10, dinheiro: 600, rides: 1 });
  await G.grava(60, () => !Apresenta.on && Historia.t > 0 && !!document.querySelector('#ms-titulo.ms-on'));
  await G.grava(9);
  // celular: PegaAí online
  await G.toque('#hud-phone'); await G.grava(0.6); await G.foco('#screen-phone .phone', 7.5, 1.14); await G.grava(2);
  await G.toque('#phone-body [data-app="pegaai"]'); await G.grava(2);
  await G.toque('#phone-body [data-act2="ride-toggle"]'); await G.grava(2.5);
  await G.grava(25, () => !!Act.ride); await G.grava(3);
  await G.tecla('KeyQ'); await G.grava(1);
  // liga a rádio
  await G.toque('#hud-radio-btn'); await G.grava(0.5); await G.foco('#hud-radio', 2.5, 1.12);
  let a = await G.js(() => [Act.ride.pick.x, Act.ride.pick.y]);
  await U.dirige(a[0], a[1], { vel: 270, para: 30, ini: 9 });
  await G.grava(8, () => Act.ride && Act.ride.stage !== 'pickup'); await G.grava(3);
  // chat do PegaAí com o passageiro
  a = await G.js(() => [Act.ride.dest.x, Act.ride.dest.y]);
  await G.vai(a[0], a[1], { vel: 270, para: 30 });
  await G.grava(4);
  await G.toque('#hud-phone'); await G.grava(0.6); await G.foco('#screen-phone .phone', 8, 1.14); await G.grava(1.5);
  await G.toque('#phone-body [data-app="pegaai"]'); await G.grava(1.5);
  await G.toque('#phone-body [data-pgtab="msgs"]'); await G.grava(1.5);
  await G.toque('#phone-body [data-pgchat]'); await G.grava(2.5);
  await G.toque('#phone-body [data-pgq="0"]'); await G.grava(4);
  await G.tecla('KeyQ'); await G.grava(4);
  await G.pula(200, `!REC.piloto.R || Math.hypot(player.x - ${a[0]}, player.y - ${a[1]}) < 260`);
  await G.grava(40, () => !REC.piloto.R); await G.grava(9);
  // mais corridas (corte) e a quinta termina a missão
  await G.js(() => { Profile.rides = Historia.h().base + 4; });
  await G.pula(40, '!!Act.ride');
  await U0.segue(G, () => Historia.h().cap >= 2, { vel: 280, ini: 5 });
  await G.grava(9);
};

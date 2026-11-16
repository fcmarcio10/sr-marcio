// Parte 1: menu, escolha do jogo, chegada em São Gambiarra e o passo a passo do Seu Zé (capítulo 1)
module.exports = async (G) => {
  const U = require('./_util.js')(G);
  await G.grava(6);                                   // menu animado
  await G.toque('[data-act="play"]'); await G.grava(1.2);
  await G.foco('#slots-lista', 2.6, 1.12); await G.grava(3.6);
  await G.toque('[data-slot-novo="1"]'); await G.grava(1.5);
  await G.pula(20, 'Game.carregando === false');      // tela de carregar (corte)
  await G.js(() => { Profile.time = 21 * 60 + 40; Weather.rain = Weather.target = 0; Weather.wet = 0; Weather.timer = 1e9; });
  await G.grava(3);
  await G.grava(70, () => Historia.h().apres && !Apresenta.on);   // a câmera apresenta os lugares
  await G.grava(5);
  // passo 1 e 2: dar uma volta e frear
  await G.grava(30, () => Profile.tut >= 0 && Tutorial.shown === 0);
  await G.grava(2.5);
  const o = await G.js(() => { const s = oficinaZe(); return [s.x, s.y]; });
  await G.vai(o[0] + 900, o[1] + 600, { vel: 250 });
  await G.grava(9);
  await G.grava(15, () => Profile.tut >= 1);
  await G.js(() => REC.piloto.para());
  await G.grava(12, () => Profile.tut >= 2);
  await G.grava(3);
  // passo 3 e 4: celular e PegaAí
  await G.toque('#hud-phone'); await G.grava(0.6); await G.foco('#screen-phone .phone', 9, 1.14); await G.grava(2.6);
  await G.toque('#phone-body [data-app="pegaai"]'); await G.grava(2.2);
  await G.toque('#phone-body [data-act2="ride-toggle"]'); await G.grava(3);
  await G.grava(25, () => !!Act.ride); await G.grava(3.5);
  await G.tecla('KeyQ'); await G.grava(1.5);
  // passo 5 e 6: buscar e levar o passageiro
  let a = await G.js(() => [Act.ride.pick.x, Act.ride.pick.y]);
  await U.dirige(a[0], a[1], { vel: 260, para: 30 });
  await G.grava(8, () => Act.ride && Act.ride.stage !== 'pickup'); await G.grava(2);
  a = await G.js(() => [Act.ride.dest.x, Act.ride.dest.y]);
  await U.dirige(a[0], a[1], { vel: 270, para: 30, ini: 10 });
  await G.grava(10, () => Profile.tut >= 6); await G.grava(6);
  // passo 7: oficina do Seu Zé
  await U.dirige(o[0], o[1], { vel: 260, para: 22 });
  await G.grava(4, () => !!Act.prompt);
  await G.tecla('KeyE'); await G.grava(1); await G.foco('#screen-dialog .dialog, #dialog', 3, 1.1); await G.grava(4.5);
  await G.js(() => closeDialog()); await G.grava(2);
  await G.grava(16, () => Historia.h().cap >= 1);     // fim do passo a passo e "Missão cumprida"
  await G.grava(7);
};

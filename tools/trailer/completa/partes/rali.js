// Parte 5: capítulo "A estrada da roça" — fazenda, terra e o Rali da Vaca Atolada (de manhãzinha)
const U0 = require('./_util.js');
module.exports = async (G) => {
  await U0.novoJogo(G, 4, { hora: 8 * 60 + 40, dinheiro: 3900, rides: 9, entregas: 5 });
  await G.grava(60, () => !Apresenta.on && !!document.querySelector('#ms-titulo.ms-on'));
  await G.grava(7);
  await U0.segue(G, () => !!Act.race, { vel: 330, ini: 10, espera: 4, apertaE: true, voltas: 4 });
  await U0.segue(G, () => Historia.h().cap >= 5, { vel: 330, velCorrida: 360, corridaInteira: false, apertaE: true, voltas: 4 });
  await G.grava(6);
};

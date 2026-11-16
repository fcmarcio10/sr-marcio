// Parte 6: "O dono do Opalha" (chupeta no Opalha do Juninho) e "Tudo ou nada" (racha contra o Zé do Canecão)
const U0 = require('./_util.js');
module.exports = async (G) => {
  await U0.novoJogo(G, 5, { hora: 21 * 60 + 15, dinheiro: 5200, rides: 10, entregas: 6 });
  await G.grava(60, () => !Apresenta.on && !!document.querySelector('#ms-titulo.ms-on'));
  await G.grava(6);
  await U0.segue(G, () => !!(Profile.hist && Profile.hist.juninho), { vel: 280, ini: 7, espera: 9, apertaE: true });
  await G.grava(10);
  await G.pula(30, () => Historia.h().cap >= 6 && !!Profile.emprestimo);
  await G.js(() => { Profile.time = 22 * 60 + 5; });
  await G.grava(60, () => !Apresenta.on && !!document.querySelector('#ms-titulo.ms-on'));
  await G.grava(7);
  await U0.segue(G, () => !!Act.race, { vel: 300, ini: 8, espera: 4, apertaE: true, voltas: 4 });
  await G.js(() => { const R = Act.race; if (R && !R.r._lento) { R.r._lento = true; R.r.rivalTime *= 1.4; } }); // o Zé do Canecão sai devagar nesta noite
  await U0.segue(G, () => !Act.race, { velCorrida: 560, corridaInteira: true, voltas: 2 });
  await G.grava(16);
};

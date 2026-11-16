// Parte 4: capítulo "Socorro na madrugada" — pedidos de ajuda na cidade
const U0 = require('./_util.js');
module.exports = async (G) => {
  await U0.novoJogo(G, 3, { hora: 1 * 60 + 30, dinheiro: 2600, rides: 8, entregas: 4 });
  await G.grava(60, () => !Apresenta.on && !!document.querySelector('#ms-titulo.ms-on'));
  await G.grava(8);
  await G.grava(20, () => { const e = document.getElementById('ev-offer'); return e && !e.classList.contains('hidden'); });
  await U0.segue(G, () => (Profile.evTotal || 0) >= Historia.h().base + 1, { vel: 270, ini: 6, espera: 8, apertaE: true });
  await G.grava(6);
  await G.pula(30, () => { const e = document.getElementById('ev-offer'); return e && !e.classList.contains('hidden'); });
  await U0.segue(G, () => Historia.h().cap >= 4, { vel: 270, ini: 5, espera: 8, apertaE: true });
  await G.grava(9);
};

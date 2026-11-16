// Parte 3: capítulo "Entregador da madrugada" — comércio com entrega: parar na frente, apertar E e levar até o cliente
const U0 = require('./_util.js');
module.exports = async (G) => {
  const U = U0(G);
  await U0.novoJogo(G, 2, { hora: 23 * 60 + 20, dinheiro: 1500, rides: 6 });
  await G.grava(60, () => !Apresenta.on && !!document.querySelector('#ms-titulo.ms-on'));
  await G.grava(8);
  const pega = async (gravaTudo) => {
    const w = await G.js(() => { const s = World.shops.filter((q) => q.pickup).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0]; Act.waypoint = { x: s.x, y: s.y, label: 'Entrega: ' + s.name }; Act.gpsT = 0; return [s.x, s.y]; });
    await U.dirige(w[0], w[1], { vel: 270, para: 26, ini: gravaTudo ? 8 : 3 });
    await G.grava(4, () => !!Act.prompt);
    await G.tecla('KeyE'); await G.grava(1); await G.foco('#screen-dialog .dialog', 3.2, 1.1); await G.grava(2.5);
    await G.toqueTexto('^Entregar', '#dialog-buttons button'); await G.grava(2.5);
    const d = await G.js(() => Act.delivery && [Act.delivery.dest.x, Act.delivery.dest.y]);
    if (!d) { G.log('sem entrega'); return; }
    await U.dirige(d[0], d[1], { vel: 270, para: 30, ini: 8 });
    await G.grava(6, () => !Act.delivery); await G.grava(5);
  };
  await pega(true);
  await G.js(() => { Profile.deliveries = Historia.h().base + 2; });   // mais uma entrega (corte)
  await G.pula(6);
  await pega(false);
  await G.grava(9, () => Historia.h().cap >= 3); await G.grava(6);
};

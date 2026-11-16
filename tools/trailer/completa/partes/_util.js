// Ajudantes comuns das partes da gameplay
module.exports = (G) => {
  const U = {};
  // dirige até (x, y): grava o começo, corta o meio (se for longe) e grava a chegada
  U.dirige = async (x, y, opt) => {
    opt = opt || {};
    if (!(await G.vai(x, y, opt))) { G.log('sem rota até', x, y); return false; }
    const ini = opt.ini !== undefined ? opt.ini : 7, fim = opt.fim !== undefined ? opt.fim : 260;
    const longe = () => G.js(([x, y, f]) => Math.hypot(player.x - x, player.y - y) > f && !!REC.piloto.R, [x, y, fim]);
    await G.grava(ini, () => !REC.piloto.R);
    if (opt.inteiro) await G.grava(opt.max || 120, () => !REC.piloto.R);
    else if (await longe()) await G.pula(opt.max || 90, `!REC.piloto.R || Math.hypot(player.x - ${x}, player.y - ${y}) < ${fim}`);
    await G.grava(40, () => !REC.piloto.R);
    return true;
  };
  U.alvo = () => G.js(() => { const t = currentTarget(); return t ? [t.x, t.y, t.kind] : null; });
  return U;
};
// começa um jogo novo já num capítulo da história (o capítulo abre de verdade: viagem da câmera, nome e áudio do Seu Zé)
module.exports.novoJogo = async (G, cap, o) => {
  o = o || {};
  await G.toque('[data-act="play"]'); await G.pula(1);
  await G.toque('[data-slot-novo="1"]');
  await G.pula(25, 'Game.carregando === false && (Historia.h().apres || Apresenta.on)');
  await G.js(([cap, o]) => {
    Apresenta.fim = null; Apresenta.encerra();
    Profile.tut = TUT_STEPS.length; const tb = document.getElementById('tutorial'); if (tb) tb.classList.add('hidden');
    Profile.money = o.dinheiro || 900; Profile.time = o.hora || 22 * 60; Profile.rides = o.rides || 6; Profile.deliveries = o.entregas || 0;
    Profile.hist = { cap, base: 0, fim: false, v: 4, apres: true, anunciar: true, juninho: false };
    Profile.hist.base = Historia.cru(cap);
    if (o.fim) { Profile.hist.fim = true; Profile.hist.anunciar = false; Profile.hist.tudo = true; Profile.hist.juninho = true; Profile.owned.brasa = true; Profile.current = 'brasa'; carCfg('brasa').color = '#141416'; player.setCar('brasa'); }
    if (o.nevoa !== false && typeof Nevoa !== 'undefined' && Nevoa.tudo) try { Nevoa.tudo(); } catch (e) {}
    Weather.rain = Weather.target = o.chuva || 0; Weather.wet = o.chuva || 0; Weather.timer = 1e9;
    if (o.x) { player.place(o.x, o.y, o.a || 0); Cam.x = o.x; Cam.y = o.y; }
    Events.clear(); Events.spawnT = o.eventos ? 30 : 1e9;
    for (const m of document.querySelectorAll('.ms-on')) m.classList.remove('ms-on');
  }, [cap, o]);
  await G.pula(0.6);
};
// segue o objetivo do jogo (corrida, entrega, evento, percurso) até a condição; grava a chegada de cada etapa
module.exports.segue = async (G, cond, opt) => {
  opt = opt || {}; const U = module.exports(G);
  for (let volta = 0; volta < (opt.voltas || 12); volta++) {
    if (await G.js(cond)) return true;
    // pedido de ajuda chegando: aceita tocando no botão
    if (await G.js(() => { const e = document.getElementById('ev-offer'); return e && !e.classList.contains('hidden') && !e.classList.contains('out'); })) {
      await G.foco('#ev-offer', 3, 1.12); await G.grava(2.2); await G.toque('#ev-offer .evo-yes'); await G.grava(2.5); continue;
    }
    if (await G.js(() => Screens.current === 'screen-garage' || Screens.current === 'screen-dialog')) { await G.js(() => Screens.closeAll()); await G.grava(1); }
    if (opt.apertaE && await G.js(() => { const q = currentTarget(); return !!Act.prompt && !Screens.current && !/garagem|Entrar —|Abastecer|Oficina/i.test(Act.prompt.text || '') && (!q || Math.hypot(q.x - player.x, q.y - player.y) < 260); })) { await G.tecla('KeyE'); await G.grava(3); continue; }
    const t = await U.alvo();
    if (!t) { await G.grava(2, cond); continue; }
    if (t[2] === 'race') {
      await G.js((v) => { REC.ligaPiloto(); const R = Act.race; REC.piloto.segue(R.r.pts.slice(R.idx), { vel: v }); }, opt.velCorrida || 420);
      await G.grava(opt.corridaInteira ? 400 : 14, () => !Act.race);
      if (!opt.corridaInteira) { await G.pula(400, '!Act.race || (Act.race.idx >= Act.race.r.pts.length - 2)'); await G.grava(30, () => !Act.race); }
      await G.js(() => REC.piloto.para()); await G.grava(5);
      continue;
    }
    await U.dirige(t[0], t[1], { vel: opt.vel || 270, para: opt.para !== undefined ? opt.para : 30, ini: opt.ini, inteiro: opt.inteiro });
    await G.grava(opt.espera || 6, () => { const q = currentTarget(); return !q || q.kind === 'race' || Math.hypot(q.x - player.x, q.y - player.y) > 120; });
  }
  return G.js(cond);
};

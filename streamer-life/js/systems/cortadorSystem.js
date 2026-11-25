// Mod de Cortes (nov/2026, pedido do dono): você contrata um editor que cria cortes da sua live
// e posta sozinho no YouTube e/ou no TikTok. Salário por semana do jogo; quanto melhor o editor,
// mais cortes por live e melhor a edição. Os cortes dele vêm além dos cortes automáticos.
(function (SL) {
  'use strict';
  const U = SL.U, D = SL.D, G = () => SL.G;
  const C = SL.Cortador = {};
  C.EDITORES = [
    { id: 'juninho', nome: 'Juninho Cortes', nivel: 'Iniciante', semana: 99.99, porRede: 1, base: 52, look: ['#c28a5e', 1, '#1d1512', '#3b82f6'], desc: 'Começando agora, faz o básico bem feito.' },
    { id: 'bia', nome: 'Bia Edits', nivel: 'Profissional', semana: 249.99, porRede: 2, base: 66, look: ['#f1c7a5', 5, '#6b3a1e', '#ec4899'], desc: 'Legenda animada, zoom no momento certo e título que dá clique.' },
    { id: 'kaio', nome: 'Kaio Viral', nivel: 'Estrela', semana: 599.99, porRede: 3, base: 80, look: ['#8d5a3b', 3, '#111111', '#f59e0b'], desc: 'Já editou para canais grandes. Thumbnail forte e corte que viraliza.' },
  ];
  C.REDES = { vision: { nome: 'YouTube', tipo: 'corte' }, clipz: { nome: 'TikTok', tipo: 'short' } };
  C.editor = id => C.EDITORES.find(e => e.id === id);
  C.estado = () => G().cortador || null;
  C.atual = () => { const s = C.estado(); return s ? C.editor(s.id) : null; };
  C.lookDe = ed => ({ skin: ed.look[0], hair: ed.look[1], hairColor: ed.look[2], shirt: ed.look[3], pants: '#2a2f3d', acc: 0, beard: 0 });

  C.contratar = (id, redes) => {
    const ed = C.editor(id); if (!ed) return 'Editor não encontrado.';
    const atual = C.estado(); if (atual && atual.id === id) return 'Ele já trabalha para você.';
    if (!SL.Econ.spend(ed.semana, 'equipe', 'Mod de Cortes: 1ª semana de ' + ed.nome)) return 'Precisa de ' + U.money(ed.semana) + ' para pagar a primeira semana.';
    G().cortador = { id, redes: redes || (atual && atual.redes) || { vision: true, clipz: true }, desde: SL.Clock.day(), pago: SL.Clock.day(), feitos: 0 };
    SL.notify({ cat: 'carreira', icon: 'scissors', title: ed.nome + ' foi contratado', text: 'Depois de cada live ele posta ' + ed.porRede + ' corte' + (ed.porRede > 1 ? 's' : '') + ' por rede.' });
    SL.bus.emit('staff'); return null;
  };
  C.demitir = () => { const ed = C.atual(); G().cortador = null; if (ed) SL.notify({ cat: 'carreira', icon: 'scissors', title: ed.nome + ' saiu', text: 'Os cortes extras param na próxima live.' }); SL.bus.emit('staff'); };
  C.setRede = (plat, on) => { const s = C.estado(); if (!s || !C.REDES[plat]) return; s.redes[plat] = !!on; if (!s.redes.vision && !s.redes.clipz) s.redes[plat === 'vision' ? 'clipz' : 'vision'] = true; SL.bus.emit('staff'); };

  // salário: a cada 7 dias do jogo; sem dinheiro, ele vai embora
  SL.bus.on('tick:day', day => {
    const s = C.estado(); if (!s) return; const ed = C.editor(s.id); if (!ed) { G().cortador = null; return; }
    if (day - s.pago < 7) return;
    if (SL.Econ.spend(ed.semana, 'equipe', 'Mod de Cortes: semana de ' + ed.nome)) { s.pago = day; return; }
    G().cortador = null;
    SL.notify({ cat: 'carreira', icon: 'alert', title: ed.nome + ' parou de trabalhar', text: 'Faltou dinheiro para pagar a semana (' + U.money(ed.semana) + ').' });
    SL.bus.emit('staff');
  });

  const TIT = {
    short: ['{m}!', 'Ninguém esperava isso no {g}', 'Esse momento no {g}...', 'PARTE {n}: {m}', 'O chat foi à loucura: {m}', 'Ele não acreditou: {m}'],
    corte: ['{m} | Melhores momentos de {g}', 'A live de {g} saiu do controle', 'TOP momentos da live: {m}', '{g}: {m} (corte da live)', 'Você precisa ver isso: {m}'],
  };
  const TXT_THUMB = ['OLHA ISSO', 'NÃO ACREDITO', 'INSANO', 'QUE ISSO?!', 'ERREI FEIO', 'DEU CERTO?'];

  // chamado no fim da live, depois dos cortes automáticos
  C.aposLive = rawId => {
    const s = C.estado(); const ed = C.atual(); if (!s || !ed) return [];
    const G0 = G(); const raw = G0.raw.find(r => r.id === rawId); if (!raw || !raw.moments || !raw.moments.length) return [];
    const VS = SL.Videos; const g = D.gameById(raw.game) || D.gameById('conversa'); const out = [];
    const ordem = raw.moments.map((m, i) => [m.clip, i]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
    Object.keys(C.REDES).filter(p => s.redes[p]).forEach(plat => {
      const type = C.REDES[plat].tipo; const T = VS.TYPES[type];
      const need = T.short ? 1 : Math.max(2, Math.round((T.len[0] + T.len[1]) / 2 / 180));
      for (let k = 0; k < ed.porRede; k++) {
        // cada corte começa num momento diferente (o automático já usou o melhor)
        const ini = (k + 1) % ordem.length; const mom = [];
        for (let i = 0; i < Math.min(need, ordem.length); i++) mom.push(ordem[(ini + i) % ordem.length]);
        const repetido = k + 1 >= ordem.length;
        const e = VS.createEdit({ raw: raw.id, type, moments: mom, level: 'padrao' });
        if (typeof e === 'string') return;
        e.auto = true; e.cortador = ed.id;
        e.qAcc = U.clamp((ed.base + U.rf(-5, 5)) * (repetido ? 0.88 : 1), 10, 98); e.qN = 1; e.done = e.work; e.status = 'pronto';
        const mo = e.moments[0]; const fill = t => t.replace('{g}', g.name).replace('{m}', mo ? mo.txt : 'Que momento').replace('{n}', k + 1);
        e.title = fill(U.pick(TIT[type])).slice(0, 95);
        e.desc = 'Corte da live de ' + g.name + ' (edição: ' + ed.nome + '). Live quase todo dia na Twitch: @' + G0.player.user + '. Segue para não perder!';
        e.tags = SL.Algo.suggestTags(raw.game).slice(0, 3);
        if (!T.short) e.thumb = { scene: k % 3, expr: U.pick(['surpreso', 'rindo', 'bravo']), text: U.pick(TXT_THUMB), color: U.pick(['#ffe066', '#ff5a36', '#4de0ff']), arrow: ed.base >= 60, circle: ed.base >= 75 };
        if (VS.publish(e.id)) return;
        const v = G0.videos.find(x => x.id === e.video);
        if (v) { v.cortador = ed.id; s.feitos++; out.push({ id: v.id, plat: C.REDES[plat].nome, app: plat, title: v.title, q: v.quality, ed: ed.nome }); }
      }
    });
    return out;
  };
})(window.SL);

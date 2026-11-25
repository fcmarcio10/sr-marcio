/* Chat: monta cada mensagem a partir da intenção, do contexto da live, da personalidade e da memória de quem escreve.
   Evita repetir frases (fila de frases recentes) e escreve no estilo de cada pessoa (maiúsculas, risada, erros, emotes). */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const C = SL.Chat = {};
  const L = () => D.chat;
  const recent = [];
  const RECENT_MAX = 70;
  let msgSeq = 0;

  const parse = s => (s.length > 2 && s[1] === '|') ? { tone: s[0], text: s.slice(2) } : { tone: 'n', text: s };
  const toneW = (v, tone) => {
    if (!v) return 1;
    const t = (D.archetypes[v.a] || {}).tones || {};
    return (t[tone] || 0) + (tone === 'n' ? 0.6 : 0.15);
  };
  C.pick = (pool, v, key) => {
    if (!pool || !pool.length) return null;
    const items = pool.map((s, i) => ({ s, i, p: parse(s) }));
    let avail = items.filter(it => !recent.includes(key + it.i));
    if (!avail.length) avail = items;
    const it = U.wpick(avail, x => toneW(v, x.p.tone));
    recent.push(key + it.i); if (recent.length > RECENT_MAX) recent.shift();
    return it.p;
  };

  const LAUGHS = ['kkkk', 'kkkkkkk', 'KKKKKKK', 'hahaha', 'rsrsrs', 'KKKKKKKKKKKK', 'kkkkkkkkkkk'];
  C.laugh = v => {
    const base = LAUGHS[(v && v.sty) ? v.sty.lg : U.ri(0, 6)];
    const ch = base[0];
    if (ch === 'k' || ch === 'K') return ch.repeat(U.ri(4, 13));
    return base;
  };
  const VIEWER_GENDERED = ['obrigado', 'viciado', 'bolado', 'atrasado', 'bem-vindo'];
  const gender = (txt, v) => {
    const sg = SL.G ? SL.G.player.gender : 'n';
    txt = txt.replace(/(^|\s)o\(a\)(?=\s)/g, (m, sp) => sp + (sg === 'f' ? 'a' : sg === 'm' ? 'o' : 'o(a)'));
    return txt.replace(/([A-Za-zÀ-ú-]+)o\(a\)/g, (m, w) => {
      const isViewer = VIEWER_GENDERED.some(x => (w + 'o').toLowerCase().startsWith(x.slice(0, -1)));
      const g = isViewer ? (v ? v.sx : 'n') : sg;
      return g === 'f' ? w + 'a' : g === 'm' ? w + 'o' : w + 'o(a)';
    }).replace(/ELE\(A\)/g, sg === 'f' ? 'ELA' : sg === 'm' ? 'ELE' : 'ELE(A)').replace(/\(a\)/g, sg === 'f' ? 'a' : '');
  };
  C.fill = (text, v, ctx) => {
    ctx = ctx || {};
    let t = text.replace(/\{kk\}/g, () => C.laugh(v))
      .replace(/\{s\}/g, ctx.s || '').replace(/\{g\}/g, ctx.g || '').replace(/\{p\}/g, ctx.p || '')
      .replace(/\{u\}/g, ctx.u || '').replace(/\{n\}/g, ctx.n != null ? ctx.n : '').replace(/\{m\}/g, ctx.m || '')
      .replace(/\{cat\}/g, ctx.cat || '').replace(/\{canal\}/g, ctx.canal || '').replace(/\{via\}/g, ctx.via || 'diretório')
      .replace(/\{og\}/g, ctx.og || '').replace(/\{cr\}/g, ctx.cr || '');
    return gender(t, v);
  };
  // aplica o jeito de escrever de cada pessoa
  C.style = (text, v, tone) => {
    if (!v || !v.sty) return text;
    const parts = text.split(/(:[a-z]+:|@[\w.]+)/g);
    const st = v.sty;
    const caps = (tone === 'h' || tone === 'z') && U.chance(st.cp);
    const lower = st.lo && !caps;
    for (let i = 0; i < parts.length; i += 2) {
      let p = parts[i];
      if (caps) p = p.toUpperCase();
      else if (lower) { p = p.toLowerCase(); if (U.chance(0.35)) p = U.stripAccents(p); }
      if (st.ty && U.chance(st.ty * 4) && p.length > 6) {
        const j = U.ri(1, p.length - 3);
        if (/[a-z]/i.test(p[j]) && /[a-z]/i.test(p[j + 1])) p = p.slice(0, j) + p[j + 1] + p[j] + p.slice(j + 2);
      }
      parts[i] = p;
    }
    let out = parts.join('');
    if (lower) out = out.replace(/[.!]+$/, '');
    if (!/[!?.)]$/.test(out) && !/:$/.test(out)) {
      if (tone === 'h' && U.chance(st.pu * 0.6)) out += U.pick(['!', '!!', '!!!']);
      else if (tone === 'q' && !/\?$/.test(out)) out += '?';
    }
    if (U.chance(st.em * 0.35) && !/:[a-z]+:/.test(out)) {
      const em = { h: ['hype', 'fogo', 'palmas'], z: ['riso', 'riso', 'nossa'], c: ['bravo', 'pensa'], t: ['pensa'], q: ['pensa'], n: ['coracao', 'palmas', 'gg'] }[tone] || ['coracao'];
      out += ' :' + U.pick(em) + ':';
    }
    return out;
  };

  const badgesOf = v => {
    const b = [];
    if (!v) return b;
    if (v.npc) b.push('amigo');
    if (v.mod) b.push('mod');
    if (v.sub) b.push('sub');
    if (v.m.v >= 20 && v.loy >= 70) b.push('veterano');
    else if (v.m.v <= 1 && !v.npc) b.push('novo');
    if (v.m.don >= 50) b.push('apoiador');
    return b;
  };
  C.html = raw => {
    let h = U.esc(raw);
    h = h.replace(/@([\w.]+)/g, '<b class="mention">@$1</b>');
    return SL.renderEmotes(h);
  };
  C.msg = (v, text, o) => {
    o = o || {};
    return { id: 'm' + (++msgSeq), t: SL.G ? SL.G.time.t : 0, vid: v ? v.id : null, u: v ? v.u : (o.u || 'sistema'), c: v ? v.c : (o.c || '#8b93a7'),
      badges: o.badges || badgesOf(v), raw: text, html: C.html(text), kind: o.kind || 'msg', q: o.q || null, qd: o.qd || null, intent: o.intent || null, tone: o.tone || 'n', target: o.target || null, amount: o.amount || 0 };
  };
  C.system = (kind, text, o) => C.msg(null, text, Object.assign({ kind, u: (o && o.u) || '', badges: [] }, o || {}));
  C.streamer = text => {
    const G = SL.G;
    return { id: 'm' + (++msgSeq), t: G.time.t, vid: null, u: G.player.user, c: '#c9b8ff', badges: ['streamer'], raw: text, html: C.html(text), kind: 'streamer' };
  };

  // ---------- intenções ----------
  const momentPool = m => {
    const P = L().m;
    if (P[m.type]) return { pool: P[m.type], key: 'm_' + m.type };
    if (m.big) return { pool: P.epic, key: 'm_epic' };
    if (m.funny > 0.6) return { pool: P.funny, key: 'm_funny' };
    if (m.good === true) return { pool: P.win, key: 'm_win' };
    if (m.good === false) return { pool: P.lose, key: 'm_lose' };
    return null;
  };

  C.questionType = (v, ctx) => {
    const a = v.a;
    const w = { contexto: 0, agenda: 1.2, setup: 0.6, idade: 0.4, origem: 0.6, jogo_fav: 0.6, inscritos: 0.5, dica: 0.4, pedido: 0.6, opiniao: 0.3, pessoal: 0.35, musica: 0.2 };
    if (a === 'novato') { w.contexto = 4; w.dica = 1; }
    if (ctx.late) w.contexto += 2;
    if (a === 'especialista') { w.setup = 3; w.dica = 1.2; }
    if (a === 'competitivo') { w.setup = 1.2; w.inscritos = 2; }
    if (a === 'comunicativo') { w.pessoal = 1; w.origem = 1; w.jogo_fav = 1; }
    if (a === 'criador') { w.dica = 2.5; w.opiniao = 1; }
    if (a === 'fiel') { w.agenda = 2.5; w.inscritos = 1.2; }
    if (v.fg === ctx.gameId) w.pedido = 0;
    if (ctx.nongame) w.contexto *= 0.3;
    return U.wkey(w);
  };

  C.memoryOptions = (v, ctx) => {
    const m = v.m, G = SL.G, opts = [];
    if (m.rep >= 1 && m.v >= 2) opts.push(['replied', {}]);
    if (m.ign >= 2) opts.push(['ignored', {}]);
    if (m.don > 0) opts.push(['donated', {}]);
    const moments = m.saw.map(id => G.ch.moments.find(x => x.id === id)).filter(x => x && x.mt);
    if (moments.length) { const mo = U.pick(moments); opts.push(['moment', { m: mo.mt }]); opts.push(['moment', { m: mo.mt }]); }
    if (v.fg !== ctx.gameId && (m.g[v.fg] || 0) >= 2) opts.push(['game', { og: (D.gameById(v.fg) || {}).name }]);
    if (m.pk) opts.push(['promise_ok', {}]);
    if (m.pb) { opts.push(['promise_broken', {}]); opts.push(['promise_broken', {}]); }
    if (m.fight) opts.push(['fight', {}]);
    if (m.v >= 8 && m.f0 != null && G.ch.pulso.f > Math.max(20, m.f0 * 3)) opts.push(['growth', { n: U.int(Math.max(2, m.f0)) }]);
    if (v.sub && v.subM >= 2) opts.push(['sub', { n: v.subM }]);
    if (m.v >= 10 && Object.keys(m.g).length >= 3) opts.push(['changed', {}]);
    return opts;
  };

  // Gera uma mensagem de uma pessoa. Retorna null se não houver o que dizer.
  C.say = (v, intent, ctx, o) => {
    o = o || {}; ctx = ctx || {};
    const LL = L();
    let line = null, q = null, qd = null, extra = {};
    switch (intent) {
      case 'greet': {
        if (v.npc === 'mae') line = C.pick(LL.greet_mom, v, 'gm');
        else if (v.npc) line = C.pick(LL.greet_friend, v, 'gf');
        else if (v.m.v === 0) line = C.pick(LL.greet_first, v, 'g1');
        else if (v.m.l >= 0 && SL.Clock.day() - v.m.l > 20) line = C.pick(LL.greet_absence, v, 'ga');
        else if (ctx.late && U.chance(0.45)) line = C.pick(LL.greet_late, v, 'gl');
        else { const n = v.m.v + 1; const tier = n >= 20 ? 20 : n >= 8 ? 8 : n >= 4 ? 4 : 2; line = C.pick(LL.greet_return[tier], v, 'gr' + tier); }
        if (line && /\?$/.test(line.text) && /quanto tempo|perdi|rolou|o que/.test(line.text)) { q = 'contexto'; }
        break;
      }
      case 'moment': { const mp = momentPool(o.moment); if (mp) line = C.pick(mp.pool, v, mp.key); break; }
      case 'chatter': {
        const extraPool = LL.chatter_cat[ctx.sim] || [];
        const pool = U.chance(extraPool.length ? 0.45 : 0) ? extraPool : LL.chatter;
        line = C.pick(pool, v, pool === extraPool ? 'cc' + ctx.sim : 'ch'); break;
      }
      case 'question': {
        q = o.qtype || C.questionType(v, ctx);
        if (q === 'pedido') { const og = D.gameById(v.fg); ctx = Object.assign({}, ctx, { og: og ? og.name : 'Chess.com' }); qd = { game: v.fg }; }
        if (q === 'opiniao') { const cr = U.pick(D.creators.filter(c => !c.small)); ctx = Object.assign({}, ctx, { cr: cr.name }); qd = { creator: cr.id }; }
        const pool = LL.q[q]; const p = C.pick(pool, v, 'q' + q); line = p ? { tone: 'q', text: p.text } : null; break;
      }
      case 'compliment': {
        const G = SL.G; const recentUp = G.flags.lastUpgrade && G.time.t - G.flags.lastUpgrade < 3 * 1440 && v.m.v >= 2;
        line = C.pick(recentUp && U.chance(0.6) ? LL.compliment_setup : LL.compliment, v, recentUp ? 'cs' : 'co'); break;
      }
      case 'crit': line = C.pick(LL.crit[o.reason] || LL.crit.silencio, v, 'cr' + o.reason); if (o.reason === 'audio' && line && /\?/.test(line.text)) q = null; break;
      case 'attention': line = C.pick(LL.attention, v, 'at'); break;
      case 'leave': line = C.pick(o.bored ? LL.leave_bored : LL.leave, v, o.bored ? 'lb' : 'lv'); break;
      case 'memory': {
        const opts = C.memoryOptions(v, ctx); if (!opts.length) return null;
        const [k, add] = U.pick(opts); ctx = Object.assign({}, ctx, add);
        line = C.pick(LL.mem[k], v, 'mem' + k); extra.memory = k; break;
      }
      case 'troll': line = C.pick(LL.troll, v, 'tr'); break;
      case 'defend': line = C.pick(LL.defend, v, 'df'); break;
      case 'argue': line = C.pick(LL.argue, v, 'ar'); break;
      case 'reply_other': line = C.pick(LL.reply_other, v, 'ro'); break;
      case 'welcome_other': line = C.pick(LL.welcome_other, v, 'wo'); break;
      case 'answer_other': line = C.pick(LL.answer_other, v, 'ao'); break;
      case 'react': line = C.pick(LL.react[o.kind] || [], v, 'r' + o.kind); break;
      case 'celeb': line = C.pick(LL.celeb, v, 'ce'); break;
      case 'raid': line = C.pick(LL.raid, v, 'ra'); break;
      case 'viral': line = C.pick(LL.viral, v, 'vi'); break;
      default: return null;
    }
    if (!line) return null;
    let text = C.fill(line.text, v, ctx);
    text = C.style(text, v, line.tone);
    if (q && !/\?$/.test(text) && !/:[a-z]+:$/.test(text)) text += '?';
    return C.msg(v, text, { q, qd, intent, tone: line.tone, target: ctx.uTarget || null, ...extra });
  };

  // ---------- respostas do streamer a perguntas ----------
  // fx: efeitos aplicados pelo sistema da live (Live.answer)
  C.ANSWERS = {
    contexto: [{ id: 'info', label: 'Explicar o que está rolando', text: c => 'Tá ' + c.p + '! Fica aí que tá bom', fx: { sat: 0.3 } }, { id: 'curta', label: 'Responder rapidinho', text: c => c.p, fx: { sat: 0.15 } }],
    agenda: [{ id: 'amanha', label: 'Prometer a próxima live', text: () => 'Amanhã tem live de novo, pode cobrar!', fx: { sat: 0.35, promise: 'live' } }, { id: 'naosei', label: 'Dizer que ainda não sabe', text: () => 'Ainda não sei, fica de olho no meu Instagram', fx: { sat: 0.1 } }, { id: 'folga', label: 'Avisar que amanhã é folga', text: () => 'Amanhã é folga, mas depois volto!', fx: { sat: 0.15, trust: 0.2 } }],
    setup: [{ id: 'contar', label: 'Contar o setup', text: c => 'Tô usando ' + c.setup + '. Aos poucos vou melhorando', fx: { sat: 0.3 } }, { id: 'piada', label: 'Fazer piada com o setup', text: () => 'Meu setup é movido a fé e café', fx: { sat: 0.2, hype: 3 } }],
    idade: [{ id: 'resp', label: 'Responder a idade', text: () => 'Tenho ' + (SL.G.player.age || 24) + ' anos', fx: { sat: 0.25 } }, { id: 'seg', label: 'Fazer mistério', text: () => 'Segredo de estado', fx: { sat: 0.1, hype: 1 } }],
    origem: [{ id: 'resp', label: 'Contar de onde é', text: () => 'Sou daqui de Vila Esperança mesmo, prazer!', fx: { sat: 0.3 } }],
    jogo_fav: [{ id: 'atual', label: 'Dizer que é o jogo atual', text: c => 'Hoje? ' + c.g + ', com certeza', fx: { sat: 0.25 } }, { id: 'retro', label: 'Falar de um clássico', text: () => 'Os jogos da infância ninguém supera', fx: { sat: 0.25, hype: 2 } }],
    inscritos: [{ id: 'prometer', label: 'Prometer jogar com o chat na próxima live', text: () => 'Na próxima live a gente joga junto, prometido!', fx: { sat: 0.4, promise: 'inscritos' } }, { id: 'talvez', label: 'Dizer "talvez um dia"', text: () => 'Quem sabe um dia, quando o canal crescer', fx: { sat: 0.05 } }],
    dica: [{ id: 'sincero', label: 'Dar um conselho sincero', text: () => 'Constância e paciência. Faz pelo prazer, o resto vem', fx: { sat: 0.4, cred: 0.3 } }, { id: 'brinca', label: 'Brincar', text: () => 'Dica: compra um microfone antes de uma cadeira', fx: { sat: 0.2, hype: 2 } }],
    pedido: [{ id: 'prometer', label: 'Prometer jogar esse jogo esta semana', text: c => 'Fechado, essa semana tem ' + c.og + '!', fx: { sat: 0.4, promise: 'jogo' } }, { id: 'pensar', label: 'Dizer que vai pensar', text: () => 'Vou pensar, anotado aqui', fx: { sat: 0.12 } }],
    opiniao: [{ id: 'elogio', label: 'Elogiar o criador', text: c => 'Gosto muito do trabalho do ' + c.cr + ', respeito demais', fx: { sat: 0.2, creator: 4 } }, { id: 'neutro', label: 'Ficar neutro', text: () => 'Não acompanho muito, prefiro não opinar', fx: { sat: 0.1 } }, { id: 'critica', label: 'Criticar (pode dar polêmica)', text: c => 'Sinceramente? Acho o ' + c.cr + ' meio forçado', fx: { sat: 0.1, hype: 6, creator: -12, polemic: 1 } }],
    pessoal: [{ id: 'resp', label: 'Responder com bom humor', text: () => 'Minha vida é live, edição e café. Romântico, né?', fx: { sat: 0.3, hype: 2 } }, { id: 'priv', label: 'Preservar a vida pessoal', text: () => 'Essa parte eu guardo pra mim, tá?', fx: { sat: 0.1 } }],
    musica: [{ id: 'resp', label: 'Dizer qual é a música', text: () => 'É uma lo-fi livre de direitos, procura "Noite de Garoa"', fx: { sat: 0.25 } }],
  };
})(window.SL);

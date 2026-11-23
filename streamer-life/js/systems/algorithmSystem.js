/* Algoritmos das plataformas: tendências, nota de título/descrição/tags/thumbnail, alcance da live e recomendação de vídeos. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const A = SL.Algo = {};
  const G = () => SL.G;

  A.trendMul = id => (G().trends.games[id] || 1);
  A.gamePop = g => g.pop * A.trendMul(g.id);
  A.todMul = h => (h >= 19 && h <= 23) ? 1 : (h >= 12 && h < 19) ? 0.72 : (h >= 7 && h < 12) ? 0.45 : (h >= 0 && h < 3) ? 0.62 : 0.25;
  A.diff = () => SL.State.DIFF[G().player.diff].algo;

  // ---------- títulos, descrição, tags ----------
  const HOOKS = ['desafio', 'primeira vez', 'recorde', 'impossível', 'zerando', 'zerei', 'reagindo', 'testei', 'tentei', 'como', 'por que', 'segredo', 'verdade', 'melhor', 'pior', 'não acredito', 'final', 'épico', 'insano', 'sem morrer', 'contra', 'nunca', 'último', 'mais difícil', 'do zero', 'até'];
  const BAIT = ['chocante', 'você não vai acreditar', 'urgente', 'acabou', 'polêmica', 'exposed', 'treta', 'revelado', 'ninguém sabia', 'me processaram', 'deu ruim'];
  A.titleScore = (title, ctx) => {
    ctx = ctx || {}; const notes = [];
    const t = (title || '').trim(); const low = t.toLowerCase();
    let s = 38;
    if (t.length < 10) { s -= 25; notes.push('Título curto demais'); }
    else if (t.length >= 22 && t.length <= 68) { s += 12; notes.push('Bom tamanho'); }
    else if (t.length > 90) { s -= 12; notes.push('Título longo demais'); }
    const g = ctx.game ? D.gameById(ctx.game) : null;
    if (g && (low.includes(g.name.toLowerCase()) || g.tags.some(tag => low.includes(tag)))) { s += 10; notes.push('Fala do jogo'); }
    else if (g && !g.nongame) notes.push('Cite o nome do jogo');
    const hooks = HOOKS.filter(h => low.includes(h)).length;
    if (hooks) { s += Math.min(2, hooks) * 7; notes.push('Gancho que dá curiosidade'); } else notes.push('Falta um gancho (desafio, primeira vez, recorde...)');
    if (/\d/.test(t)) { s += 6; notes.push('Número chama atenção'); }
    if (/[!?]/.test(t)) s += 3;
    const letters = t.replace(/[^A-Za-zÀ-ú]/g, ''); const caps = letters.replace(/[^A-ZÀ-Ý]/g, '').length;
    if (letters.length > 8 && caps / letters.length > 0.65) { s -= 12; notes.push('Maiúsculas demais parecem spam'); }
    else if (/\b[A-ZÀ-Ý]{3,}\b/.test(t)) s += 4;
    const tr = G().trends;
    if (tr.tags.some(x => low.includes(x.tag.slice(1).toLowerCase())) || tr.topics.some(x => low.includes(x.key))) { s += 10; notes.push('Está na tendência'); }
    const bait = BAIT.some(b => low.includes(b));
    if (bait) { s += 9; notes.push('Clickbait: atrai cliques, mas decepciona se o conteúdo não entregar'); }
    if (ctx.kind === 'live' && /ao vivo|live/.test(low)) s += 2;
    const prev = (G().videos.slice(-5).map(v => v.title.toLowerCase()));
    if (prev.includes(low)) { s -= 12; notes.push('Título repetido'); }
    return { score: U.clamp(Math.round(s + G().player.skills.marketing * 0.15), 0, 100), notes, bait };
  };
  A.descScore = desc => {
    const d = (desc || '').trim(); let s = 30;
    if (d.length >= 40) s += 25; if (d.length >= 120) s += 15; if (d.length > 700) s -= 10;
    if (/connect|segue|siga|inscreva|horário|todo dia|agenda|lives? (às|toda)/i.test(d)) s += 15;
    if (/#\w+/.test(d)) s += 8;
    return U.clamp(s, 0, 100);
  };
  A.tagScore = (tags, gameId) => {
    const g = gameId ? D.gameById(gameId) : null; let s = 20;
    (tags || []).forEach(t => {
      const tt = t.toLowerCase().replace('#', '');
      if (g && (g.tags.includes(tt) || g.name.toLowerCase().includes(tt))) s += 15;
      else if (G().trends.tags.some(x => x.tag.toLowerCase() === '#' + tt)) s += 18;
      else s += 4;
    });
    if ((tags || []).length > 8) s -= 10;
    return U.clamp(s, 0, 100);
  };
  A.suggestTags = gameId => {
    const g = gameId ? D.gameById(gameId) : null;
    const out = g ? g.tags.slice() : ['vlog', 'dia a dia'];
    if (g) out.push(g.name.toLowerCase());
    G().trends.tags.slice(0, 3).forEach(t => out.push(t.tag.slice(1).toLowerCase()));
    out.push('gameplay', 'brasil', 'ao vivo', 'engraçado');
    return [...new Set(out)];
  };
  // thumbnail: { scene, expr, text, color, arrow, circle }
  A.thumbScore = (th, ctx) => {
    if (!th) return 20; let s = 30; const notes = [];
    const words = (th.text || '').trim().split(/\s+/).filter(Boolean).length;
    if (words >= 1 && words <= 4) { s += 20; notes.push('Texto curto e legível'); } else if (words > 6) { s -= 10; notes.push('Texto demais'); } else if (!words) notes.push('Sem texto');
    if (['surpreso', 'bravo', 'rindo'].includes(th.expr)) { s += 16; notes.push('Expressão forte'); } else if (th.expr === 'feliz') s += 8;
    if (th.color === '#ffe066' || th.color === '#ff3b3b' || th.color === '#ffffff') s += 8;
    if (th.arrow) s += 5; if (th.circle) s += 5; if (th.arrow && th.circle && words > 3) { s -= 8; notes.push('Poluída'); }
    if (ctx && ctx.momentInt) s += ctx.momentInt * 12;
    if (ctx && ctx.title && th.text && ctx.title.toLowerCase().includes(th.text.toLowerCase().split(' ')[0])) s += 4;
    s += G().player.skills.marketing * 0.12 + (G().player.skills.edicao * 0.05);
    return { score: U.clamp(Math.round(s), 0, 100), notes };
  };

  // ---------- live: competição e chegada de público novo ----------
  A.competitors = gameId => {
    let n = 0, best = null;
    G().creators.forEach(c => { if (c.live && c.live.game === gameId) { n += c.live.viewers; if (!best || c.live.viewers > best.live.viewers) best = c; } });
    return { viewers: n, best };
  };
  // chegadas por minuto vindas do diretório da plataforma, boca a boca e outras redes
  A.liveDiscovery = L => {
    const G0 = G(); const g = D.gameById(L.game); const h = SL.Clock.hour();
    const Vn = L.viewers;
    const pop = A.gamePop(g) / 100;
    const vis = 0.35 + 0.65 * Math.min(1, Math.log10(1 + Vn) / 3.6);
    const titleMul = 0.7 + (L.titleScore / 100) * 0.6 + (L.tagScore - 20) / 400;
    const techMul = 0.6 + (L.tech.overall / 100) * 0.6;
    const repMul = 0.8 + G0.rep.popularidade / 200 + G0.rep.imagem / 400;
    const comp = A.competitors(L.game).viewers;
    const pressure = 1 / (1 + Math.log10(1 + comp) / 6);
    let disc = 1.05 * pop * (1 - 0.7 * g.sat) * vis * titleMul * techMul * A.todMul(h) * repMul * pressure;
    disc += Vn * 0.002 * (L.hype / 60) * (L.contentQ / 60);
    const cross = G0.ch.vision.f + G0.ch.clipz.f * 0.6 + G0.ch.connect.f * 0.5;
    disc += cross * 0.000012 * A.todMul(h) * (L.announced ? 2 : 1);
    if (L.followersOnly) disc *= 0.92;
    return disc * A.diff();
  };

  // ---------- tendências ----------
  A.learnTrend = src => {
    const G0 = G(); G0.flags.trendKnown = SL.Clock.day();
    SL.Life.skillUp('marketing', 0.4);
    const top = Object.entries(G0.trends.games).sort((a, b) => b[1] - a[1])[0];
    const tag = G0.trends.tags[0];
    const g = D.gameById(top[0]);
    if (src === 'tv' && U.chance(0.6)) SL.notify({ cat: 'mundo', icon: 'trend', title: 'Você ficou por dentro', text: g.name + ' está em alta' + (tag ? ' e a trend ' + tag.tag + ' domina o TikTok.' : '.'), silent: false });
  };
  A.hotGames = () => D.games.map(g => ({ g, m: A.trendMul(g.id), pop: A.gamePop(g) })).sort((a, b) => b.pop - a.pop);

  SL.bus.on('tick:day', day => {
    const G0 = G(); if (!G0) return; const tr = G0.trends;
    D.games.forEach(g => {
      let m = tr.games[g.id] || 1;
      m += (1 - m) * 0.06 + U.gauss() * 0.035;
      tr.games[g.id] = U.clamp(m, 0.55, 2.2);
    });
    if (U.chance(0.12)) {
      const g = U.pick(D.games.filter(x => !x.nongame));
      if (U.chance(0.65)) { tr.games[g.id] = U.clamp(tr.games[g.id] + U.rf(0.35, 0.7), 0.55, 2.2); SL.Social && SL.Social.news('update', { g: g.name }); }
      else { tr.games[g.id] = U.clamp(tr.games[g.id] - U.rf(0.2, 0.35), 0.55, 2.2); SL.Social && SL.Social.news('decline', { g: g.name }); }
    }
    tr.tags.forEach(t => { t.heat *= 0.86; });
    tr.tags = tr.tags.filter(t => t.heat > 0.12);
    if (tr.tags.length < 3 || U.chance(0.3)) {
      const nt = U.pick(D.T.tags.filter(x => !tr.tags.some(t => t.tag === x)));
      if (nt) { tr.tags.unshift({ tag: nt, heat: U.rf(0.8, 1.2), since: day }); SL.Social && SL.Social.news('trend', { tag: nt }); }
    }
    tr.tags.sort((a, b) => b.heat - a.heat); tr.tags = tr.tags.slice(0, 6);
    tr.topics.forEach(t => { t.heat *= 0.8; }); tr.topics = tr.topics.filter(t => t.heat > 0.1);
  });

  // ---------- recomendação de vídeos (por hora) ----------
  const PLAT = {
    vision: { ctrBase: 0.045, retBase: 0.42, floor: 26, subK: 0.045, conv: 0.006 },
    clipz: { ctrBase: 0.5, retBase: 0.55, floor: 140, subK: 0.09, conv: 0.004 },
    connect: { ctrBase: 0.35, retBase: 0.5, floor: 60, subK: 0.06, conv: 0.003 },
  };
  A.PLAT = PLAT;
  A.videoHour = v => {
    const G0 = G(); const P = PLAT[v.plat]; const ch = G0.ch[v.plat] || G0.ch.connect;
    const age = (G0.time.t - v.t) / 60;
    if (age < 0) return;
    const subs = ch.f;
    const perf = (v.ctr / P.ctrBase) * Math.pow(v.ret / P.retBase, 1.3) * v.luck * (v.trend || 1);
    const amp = Math.pow(Math.max(0.05, perf), 2.1);
    let imp = subs * P.subK * Math.exp(-age / 26) + P.floor * amp * Math.exp(-age / (v.plat === 'clipz' ? 40 : 90)) * A.diff();
    imp += v.plat === 'vision' ? 2 * amp * Math.exp(-age / 900) : 0; // cauda longa
    if (v.viral && age >= v.viral.at && age < v.viral.at + v.viral.dur) imp *= v.viral.mul;
    if (v.boost && G0.time.t < v.boost.until) imp *= v.boost.mul;
    if (v.plat === 'clipz') imp *= 1 + G0.trends.tags.filter(t => (v.tags || []).some(x => '#' + x.toLowerCase().replace('#', '') === t.tag.toLowerCase())).reduce((s, t) => s + t.heat, 0);
    const imps = Math.max(0, imp * U.rf(0.7, 1.3));
    const views = imps * v.ctr;
    const q = v.quality / 100;
    v.imp += imps; v.views += views;
    v.likes += views * (0.018 + q * 0.06) * (v.bait && q < 0.6 ? 0.6 : 1);
    v.dislikes += views * (0.002 + (v.bait && q < 0.6 ? 0.012 : 0) + (1 - q) * 0.004 + (v.sponsor ? 0.002 : 0));
    v.ccount += views * (0.003 + q * 0.005) * (v.type === 'opiniao' ? 2 : 1);
    v.shares += views * 0.0016 * Math.pow(q + 0.3, 2) * (v.funny ? 1.6 : 1);
    const subConv = (P.conv + Math.pow(q, 2) * 0.018) * (v.plat === 'vision' ? 1 : 0.7);
    const ns = views * subConv;
    v.newSubs += ns; v.subAcc = (v.subAcc || 0) + ns;
    const whole = Math.floor(v.subAcc); v.subAcc -= whole;
    if (whole > 0) {
      ch.f += whole;
      const cross = whole * (v.plat === 'clipz' ? 0.045 : 0.07);
      G0.ch.pulso.fAcc = (G0.ch.pulso.fAcc || 0) + cross;
      const cw = Math.floor(G0.ch.pulso.fAcc); if (cw > 0) { G0.ch.pulso.fAcc -= cw; G0.ch.pulso.f += cw; }
    }
    if (v.plat === 'vision') { const wh = views * (v.len / 60) * v.ret / 60; v.wh += wh; ch.wh += wh; }
    ch.views = (ch.views || 0) + views;
    // receita
    let rev = 0;
    if (v.plat === 'vision' && ch.mon) { const rpm = (v.len >= 480 ? 9 : 5) * (D.gameById(v.game) || { rpm: 1 }).rpm * (0.6 + v.ret); rev = views / 1000 * rpm * 0.55 * (v.sponsor ? 0.95 : 1); }
    if (v.plat === 'clipz' && ch.mon) rev = views / 1000 * 0.16;
    if (rev > 0) { v.rev += rev; ch.bal += rev; }
    // histórico diário
    const d = Math.floor(age / 24);
    v.hist[d] = (v.hist[d] || 0) + views;
    if (v.hist.length > 90) v.hist.length = 90;
  };
  // chance de viralizar definida na publicação
  A.rollViral = v => {
    const P = PLAT[v.plat];
    const perf = (v.ctr / P.ctrBase) * Math.pow(v.ret / P.retBase, 1.3) * v.luck * (v.trend || 1);
    const p = U.clamp(0.003 + (perf - 1) * 0.035 + (v.plat === 'clipz' ? 0.02 : 0) + (v.funny ? 0.015 : 0), 0, 0.3) * A.diff();
    if (U.chance(p)) v.viral = { at: U.ri(4, 60), dur: U.ri(24, 96), mul: U.lognorm(Math.log(v.plat === 'clipz' ? 14 : 8), 0.7) };
  };
})(window.SL);

// Teste de estresse sem tela: joga muitos dias com ações aleatórias em todos os sistemas e procura erros
// (exceções, números inválidos, listas crescendo sem limite). Uso: node tests/estresse_node.js [dias] [semente]
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => (!/\/(render|ui)\//.test(f) || /cityScene/.test(f)) && !/main\.js/.test(f));
const store = {};
const ctx = { console, performance, setTimeout: f => f(), clearTimeout, Intl, Math, Date, JSON, TextEncoder, TextDecoder, localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } } };
ctx.window = ctx; vm.createContext(ctx);
files.forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
const SL = ctx.SL; const U = SL.U; const D = SL.D;
const DAYS = +process.argv[2] || 120; U.seed(+process.argv[3] || 99);
SL.loadGame = d => { SL.G = d; SL.Viewers.reindex(); };
SL.settings = { autosave: true };
SL.G = SL.State.newGame({ name: 'Estresse', channel: 'CanalEstresse', user: 'estresse', diff: 'normal', pref: 'todos' });
SL.bus.emit('newgame');
const G = () => SL.G;
let errs = 0; const errList = [];
const safe = (name, fn) => { try { return fn(); } catch (e) { errs++; if (errList.length < 12) errList.push(name + ': ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]); } };
const stepTo = h => { let g = 0; while (SL.Clock.hour() !== h && g++ < 2000) safe('step', () => SL.Clock.step()); };
const keep = () => Object.assign(G().needs, { fome: Math.max(G().needs.fome, 50), sede: Math.max(G().needs.sede, 50), sono: Math.max(G().needs.sono, 45), saude: Math.max(G().needs.saude, 40) });
const checkNum = () => {
  const bad = [];
  const scan = (o, p, depth) => { if (depth > 5 || !o) return; for (const k in o) { const v = o[k]; if (typeof v === 'number' && !Number.isFinite(v)) bad.push(p + '.' + k); else if (v && typeof v === 'object' && !Array.isArray(v)) scan(v, p + '.' + k, depth + 1); } };
  scan(G().needs, 'needs', 0); scan(G().ch, 'ch', 0); scan(G().rep, 'rep', 0); if (!Number.isFinite(G().money)) bad.push('money');
  G().videos.forEach((v, i) => { ['views', 'likes', 'ctr', 'ret', 'rev'].forEach(k => { if (!Number.isFinite(v[k])) bad.push('video' + i + '.' + k); }); });
  return bad;
};
const choices = id => { const d = SL.Events.DEF[id]; return d ? d.choices.map(c => c.id) : []; };
for (let d = 0; d < DAYS; d++) {
  // manhã: atividades da casa e da cidade
  stepTo(9); keep();
  safe('comer', () => { const s = SL.Life.stockList().filter(x => !x.food.cook && !x.food.coffee)[0]; if (s) SL.Life.start('comer', { food: s.food.id }); SL.Clock.skip(15); });
  safe('compras', () => { if (SL.Life.foodCount('ingredientes') < 2 && G().money > 100) { SL.Econ.spend(28, 'comida', 'mercado'); SL.Life.addFood('ingredientes', 3); SL.Life.addFood('miojo', 3); } });
  safe('banho', () => { SL.Life.start(U.pick(['banho', 'banho_longo', 'escovar'])); SL.Clock.skip(40); });
  if (U.chance(0.3)) safe('cidade', () => { const p = U.pick(D.places.filter(x => x.id !== 'casa')); SL.City.goOutside(); SL.City.travel(p.id, U.pick(['pe', 'onibus', 'app'])); SL.Clock.skip(90); const acts = SL.City.activities(p.id).filter(a => a.run && !a.disabled); if (acts.length) { const r = U.pick(acts).run(); SL.Clock.skip(120); } const ppl = SL.Rel.presentAt(p.id); if (ppl.length) { const id = U.pick(ppl); SL.Rel.meet(id); SL.Rel.interact(id, U.pick(SL.Rel.ACTIONS).id); if (U.chance(0.3)) SL.Rel.invite(id, U.pick(Object.keys(SL.Rel.INVITES)), 1, 15); } SL.City.travel('casa', 'onibus'); SL.Clock.skip(60); });
  // tarde: vídeos e redes
  stepTo(14); keep();
  safe('gravar', () => { if (U.chance(0.4)) { const err = SL.Videos.startRecording({ kind: U.pick(['gameplay', 'react', 'opiniao', 'desafio']), game: U.pick(['xeque', 'golplaca', 'corredor13', 'blocolandia']), minutes: 60 }); SL.Clock.skip(70); } });
  safe('editar', () => { const raw = G().raw[G().raw.length - 1]; if (raw && raw.moments.length && U.chance(0.6)) { const type = U.pick(Object.keys(SL.Videos.TYPES).filter(k => { const T = SL.Videos.TYPES[k]; return T.raws === 'any' || T.raws.includes(raw.kind); })); if (!type) return; const e = SL.Videos.createEdit({ raw: raw.id, type, moments: [0, 1, 2].filter(i => raw.moments[i]), level: U.pick(['rapida', 'padrao']), editor: SL.Rel.staffOf('editor')[0] ? SL.Rel.staffOf('editor')[0].id : 'eu' }); if (e && e.id && e.editor === 'eu') { SL.Videos.startEditing(e.id, 9999); SL.Clock.skip(e.work + 5); } } });
  safe('publicar', () => { G().edits.filter(e => e.status === 'pronto').forEach(e => { e.title = 'DESAFIO: ' + (D.gameById(e.game) || { name: 'vlog' }).name + ' até vencer'; e.thumb.text = 'IMPOSSÍVEL'; e.tags = SL.Algo.suggestTags(e.game).slice(0, 4); const c = SL.Sponsors.active().find(x => x.deliv.some(dd => dd.k === 'video' && dd.done < dd.n)); if (c) e.sponsor = c.id; SL.Videos.publish(e.id, U.chance(0.2) ? G().time.t + 300 : null); }); });
  safe('post', () => { if (U.chance(0.5)) { const t = U.pick(D.T.playerPostTopics); SL.Social.post({ kind: t.kind, text: t.text, eng: t.eng, risk: t.risk || 0, polemic: !!t.polemic }); } });
  safe('feed', () => { const f = G().feed.filter(x => x.author !== 'me').slice(-5); f.forEach(x => { if (U.chance(0.4)) SL.Social.like(x.id); if (U.chance(0.2)) SL.Social.comment(x.id, U.pick(['elogio', 'piada', 'critica'])); }); });
  // dinheiro e carreira
  safe('ofertas', () => { G().offers.slice().forEach(o => { const r = U.rand(); if (r < 0.5) SL.Sponsors.accept(o.id); else if (r < 0.7) SL.Sponsors.negotiate(o.id, 0.2); else if (r < 0.8) SL.Sponsors.decline(o.id); }); });
  safe('contratos', () => SL.Sponsors.active().forEach(c => c.deliv.filter(dd => dd.k === 'post' && dd.done < dd.n).forEach(() => SL.Sponsors.deliver(c.id, 'post', {}))));
  safe('loja', () => { if (G().money > 4000 && U.chance(0.1)) { const it = U.pick(D.equip.filter(e => e.price && e.price < G().money * 0.5 && !G().equip.owned[e.id])); if (it) SL.Equip.buy(it.id, U.chance(0.5) ? 'entrega' : 'na_hora'); } if (G().money > 3000 && U.chance(0.1)) { const f = U.pick(D.furniture.filter(x => x.price && x.price < G().money * 0.3)); if (f) SL.Home.buyFurniture(f.id, 'na_hora'); } });
  safe('equipe', () => { if (d === 40) SL.Rel.hire('ed_jo'); if (d === 60) SL.Rel.hire('mod_ze'); if (d === 70) SL.Rel.hire('emp_ro'); });
  safe('banco', () => { if (G().money < 200 && SL.Econ.creditLimit() > 1000 && U.chance(0.3)) SL.Econ.loanTake(1000, 6); SL.Econ.payAll(); });
  safe('merch', () => { D.merch.forEach(m => { if (SL.Sponsors.fans() > m.minFans && !G().ch.merch.products[m.id] && G().money > 2000) SL.Sponsors.launch(m.id); }); });
  safe('dms', () => { Object.values(G().dms).forEach(th => { const m = th.msgs.find(x => x.opts && !x.done); if (m) SL.Rel.onDmOption(th.id, m.id, U.pick(m.opts).id); }); });
  safe('eventos', () => { while (G().events.pending.length) { const ev = G().events.pending[0]; SL.Events.choose(ev.uid, U.pick(ev.choices).id); } });
  if (d % 17 === 5) safe('evento forçado', () => { const ids = Object.keys(SL.Events.DEF); const id = U.pick(ids); const data = { id: 'c_cha', name: 'Chá com Polêmica', f: 1000, hard: true, text: 'teste', views: 1000, txt: 'teste', title: 'teste', day: SL.Clock.day() + 5, cache: 1000, u: 'fulano', v: 100, msg: 'oi', slot: 'computador' }; if (id === 'equip_quebra') { data.id = G().equip.setup.computador; data.name = 'PC'; } SL.Events.trigger(id, data); const ev = G().events.pending[G().events.pending.length - 1]; SL.Events.choose(ev.uid, U.pick(choices(id))); });
  // noite: live
  stepTo(20); keep();
  if (d % 6 !== 5) safe('live', () => {
    const ok = D.games.filter(g => SL.Equip.canStream(g, '720p').ok); if (!ok.length) { const b = Object.keys(G().equip.broken)[0]; if (b) SL.Equip.repair(b); return; } const game = U.pick(ok).id;
    const collab = Object.keys(G().rel).find(id => G().rel[id].plan && G().rel[id].plan.kind === 'collab');
    const err = SL.Live.start({ game, title: 'Live de ' + D.gameById(game).name + ': desafio do chat', desc: 'todo dia às 20h no Connect', quality: U.pick(['480p', '720p', '1080p']), planned: 120, announce: U.chance(0.6), tags: ['desafio'] });
    if (err) return;
    if (collab) G().rel[collab].plan = null;
    for (let m = 0; m < 130 && SL.Live.cur; m++) {
      SL.Clock.step(); const L = SL.Live.cur; if (!L) break; keep();
      if (m % 3 === 0) { const q = L.questions.find(x => !x.done); if (q) SL.Live.answer(q.msgId, U.pick(SL.Chat.ANSWERS[q.type]).id); }
      if (m % 5 === 1 && L.newcomers[0]) SL.Live.welcome(L.newcomers[0].vid);
      if (m % 7 === 2) SL.Live.thank('all');
      if (m % 11 === 3) SL.Live.talk(U.pick(SL.Live.TALKS).id);
      if (m % 19 === 4) SL.Live.joke();
      if (m === 30) SL.Live.poll(U.pick(SL.Live.POLLS).id);
      if (m === 50) SL.Live.challenge(U.pick(SL.Live.CHALLENGES).id);
      if (m === 60 && U.chance(0.3)) SL.Live.changeGame(U.pick(D.games).id);
      if (m === 70) SL.Live.pause();
      if (m === 90 && SL.Sponsors.active()[0]) SL.Live.sponsor(SL.Sponsors.active()[0].id);
      if (m === 95) SL.Live.ad();
      if (L.trolls.size && U.chance(0.5)) SL.Live.ban([...L.trolls][0], U.chance(0.5));
      if (L.ev.mic) SL.Live.fixMic(); if (L.ev.net) SL.Live.fixNet(U.pick(['qualidade', 'roteador']));
      if (L.ev.celeb && !L.ev.celeb.greeted) SL.Live.greetCeleb();
      if (m === 100 && U.chance(0.3)) SL.Live.scheduleNext(1, 20);
      if (m === 40 && U.chance(0.2)) SL.Live.makeMod([...L.present.keys()][0]);
    }
    if (SL.Live.cur) SL.Live.end();
  });
  // dormir
  stepTo(23); safe('dormir', () => { SL.Life.start('dormir', {}); SL.Clock.skip(60 * 8); SL.Life.stop(true); });
  if (d % 30 === 29) safe('salvar', () => { const e = SL.Save.write('1'); if (e) throw new Error(e); const back = SL.Save.readRaw('1'); SL.Save.migrate(back.data); });
  if (d % 20 === 0 || d === DAYS - 1) {
    const c = G().ch; const bad = checkNum();
    console.log(`dia ${d}: R$ ${Math.round(G().money)} | Pulso ${c.pulso.f} Vision ${c.vision.f} Clipz ${c.clipz.f} Connect ${c.connect.f} | lives ${G().lives.length} vídeos ${G().videos.length} | conhecidos ${G().viewers.list.length} | nível ${SL.Career.tierName()} | contratos ${G().contracts.length} | erros ${errs}${bad.length ? ' | INVÁLIDOS: ' + bad.join(',') : ''}`);
  }
}
const sizes = { ledger: G().ledger.length, feed: G().feed.length, notifs: G().notifs.length, viewers: G().viewers.list.length, raw: G().raw.length, lives: G().lives.length, promises: G().promises.length, cal: G().cal.length, dmsMsgs: Object.values(G().dms).reduce((s, t) => s + t.msgs.length, 0) };
console.log('tamanhos', JSON.stringify(sizes));
const sz = SL.Save.serialize(G()).length; console.log('save', Math.round(sz / 1024) + ' KB JSON,', Math.round(U.lzPack(SL.Save.serialize(G())).length / 1024) + ' K caracteres comprimido');
const tot = {}; Object.values(G().month).forEach(m => { for (const k in m.in) tot['+' + k] = Math.round((tot['+' + k] || 0) + m.in[k]); for (const k in m.out) tot['-' + k] = Math.round((tot['-' + k] || 0) + m.out[k]); }); console.log('dinheiro por categoria', JSON.stringify(tot));
console.log('rep', JSON.stringify(G().rep, (k, v) => typeof v === 'number' ? Math.round(v) : v), 'ranking', SL.Creators.ranking().findIndex(x => x.me) + 1);
console.log(errs ? 'ERROS: ' + errs + '\n' + errList.join('\n') : 'SEM ERROS');
process.exit(errs ? 1 : 0);

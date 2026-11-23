// Simulação sem tela: carrega os sistemas no Node e joga N dias com uma rotina "razoável".
// Uso: node tests/sim_node.js [dias] [semente]
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(f => !/\/(render|ui)\//.test(f) && !/main\.js/.test(f));
const ctx = { console, performance, setTimeout: (f) => f(), clearTimeout, Intl, Math, Date, JSON };
ctx.window = ctx; vm.createContext(ctx);
files.forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));
const SL = ctx.SL; const U = SL.U;
const DAYS = +process.argv[2] || 60; U.seed(+process.argv[3] || 7);
SL.loadGame = d => { SL.G = d; };
SL.G = SL.State.newGame({ name: 'Teste', channel: 'CanalTeste', user: 'teste', diff: 'normal' });
SL.bus.emit('newgame');
const G = SL.G; G.flags.noEvents = 1;
const stepTo = (h) => { let guard = 0; while (SL.Clock.hour() !== h && guard++ < 2000) SL.Clock.step(); };
const keep = () => { Object.assign(G.needs, { fome: 70, sede: 70, sono: 80, higiene: 70, energia: 80, estresse: 30, saude: 90 }); };
let maxQ = 0;
for (let d = 0; d < DAYS; d++) {
  stepTo(20); keep();
  if (G.money < 0) G.money = 500;
  if (d === 10 && G.money > 2600) SL.Equip.buy('pc_entrada');
  if (d === 20) { SL.Equip.buy('mic_usb'); SL.Equip.buy('cam_hd'); }
  const game = d < 10 ? 'xeque' : U.pick(['xeque', 'golplaca', 'corredor13']);
  // computador quebrado: manda consertar (como um jogador faria)
  const pcId = G.equip.setup.computador; if (pcId && SL.Equip.isBroken(pcId)) { SL.Equip.repair(pcId); delete G.equip.broken[pcId]; }
  if (d % 7 !== 6) {
    const err = SL.Live.start({ game, title: 'Desafio: ' + SL.D.gameById(game).name + ' até vencer! Primeira vez', desc: 'Lives todo dia às 20h. Segue no Connect!', quality: '720p', planned: 120, announce: d % 2 === 0, tags: ['desafio'] });
    if (err) { console.log('erro live', err); }
    for (let m = 0; m < 120 && SL.Live.cur; m++) {
      SL.Clock.step();
      const L = SL.Live.cur; if (!L) break;
      if (m % 3 === 0) { const q = L.questions.find(x => !x.done); if (q) SL.Live.answer(q.msgId, U.pick(SL.Chat.ANSWERS[q.type]).id); }
      if (m % 4 === 1) { const n = L.newcomers[0]; if (n) SL.Live.welcome(n.vid); }
      if (L.donations.some(x => !x.thanked)) SL.Live.thank('all');
      if (m % 9 === 2) SL.Live.talk(U.pick(['dia', 'historia', 'perguntar', 'planos']));
      if (m % 17 === 5) SL.Live.joke();
      if (L.trolls.size) SL.Live.ban([...L.trolls][0], true);
      if (m % 13 === 0) keep();
    }
    const sum = SL.Live.end();
    if (sum && (d % 5 === 0 || d === DAYS - 1)) console.log(`dia ${d} ${game} pico ${sum.peak} média ${sum.avg} seg+${sum.fol} msgs ${sum.msgs} don R$${sum.don} q${sum.q} | Pulso ${G.ch.pulso.f} Vision ${G.ch.vision.f} Clipz ${G.ch.clipz.f} Connect ${G.ch.connect.f} | conhecidos ${G.viewers.list.length} | R$ ${Math.round(G.money)}`);
  }
  // vídeo a cada 3 dias (corte da live) e short todo dia
  const raw = G.raw[G.raw.length - 1];
  if (raw && raw.moments.length) {
    const e = SL.Videos.createEdit({ raw: raw.id, type: d % 3 === 0 ? 'corte' : 'short', moments: raw.moments.map((_, i) => i).slice(0, 4), level: 'padrao' });
    if (e && e.id) { for (let i = 0; i < e.work; i++) SL.Videos.workMinute(e.id); e.status = 'pronto'; e.title = 'NÃO ACREDITO nesse momento no ' + SL.D.gameById(raw.game).name + '!'; e.thumb.text = 'NÃO ACREDITO'; e.tags = ['desafio', 'brasil']; SL.Videos.publish(e.id); }
  }
  if (d % 2 === 0) SL.Social.post({ kind: 'texto', text: 'Live hoje às 20h, bora!', eng: 1.1 });
  stepTo(0);
}
const vids = G.videos.slice().sort((a, b) => b.views - a.views);
console.log('Top vídeos:', vids.slice(0, 5).map(v => `${v.plat} ${Math.round(v.views)} q${v.quality} ${v.viral ? 'VIRAL' : ''}`).join(' | '));
console.log('Nível:', SL.Career.tierName(), 'score', G.career.score, 'rep', JSON.stringify(G.rep, (k, v) => typeof v === 'number' ? Math.round(v) : v));
console.log('Afiliado', G.ch.pulso.afil, 'subs', G.ch.pulso.subs, 'contas', G.bills.filter(b => !b.paid).length, 'ofertas', G.offers.length, 'contratos', G.contracts.length);
console.log('Ranking:', SL.Creators.ranking().findIndex(x => x.me) + 1, 'de', SL.Creators.ranking().length);
const sample = G.viewers.list.filter(v => v.m.v >= 3).slice(0, 3).map(v => `${v.u}(${v.a}) visitas ${v.m.v} loy ${Math.round(v.loy)} notas ${v.m.notes.map(n => n.x).join('; ')}`);
console.log(sample.join('\n'));
console.log('Feed', G.feed.length, 'notifs', G.notifs.length, 'tamanho do save', Math.round(SL.Save.serialize(G).length / 1024) + ' KB');
if (process.env.SIZES) { const r = (k, v) => (typeof v === 'number' && !Number.isInteger(v)) ? Math.round(v * 100) / 100 : v; for (const k in G) console.log(k.padEnd(12), Math.round(JSON.stringify(G[k], r).length / 1024) + ' KB'); console.log(JSON.stringify(G.viewers.list[50], r)); }

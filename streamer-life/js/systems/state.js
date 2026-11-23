/* Estado do jogo (G): tudo o que é salvo fica aqui. Cria uma partida nova. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D;
  const S = SL.State = {};
  S.SAVE_VERSION = 3;
  S.START = Date.UTC(2027, 2, 1); // segunda-feira, 1 de março de 2027

  S.DIFF = {
    tranquilo: { label: 'Tranquilo', money: 5200, rent: 0.85, needs: 0.8, algo: 1.25, desc: 'Mais dinheiro no começo, contas menores e público um pouco mais generoso.' },
    normal: { label: 'Normal', money: 2400, rent: 1, needs: 1, algo: 1, desc: 'A experiência pensada para o jogo: começo apertado, mas possível.' },
    dificil: { label: 'Desafiador', money: 900, rent: 1.15, needs: 1.15, algo: 0.82, desc: 'Pouco dinheiro, contas altas e algoritmo exigente. Cada decisão pesa.' },
  };

  S.defaultLook = () => ({ skin: D.skins[2], hair: 1, hairColor: D.hairColors[1], shirt: D.shirtColors[0], pants: '#2a2f3d', acc: 0, beard: 0, body: 'a' });

  S.newGame = opts => {
    const diff = S.DIFF[opts.diff] ? opts.diff : 'normal';
    const DF = S.DIFF[diff];
    const G = {
      v: S.SAVE_VERSION, id: 'g' + Date.now().toString(36), created: Date.now(), playMs: 0, seq: 10,
      time: { t: 9 * 60, speed: 1 },
      player: {
        name: opts.name || 'Alex', channel: opts.channel || 'CanalDoAlex', user: (opts.user || 'alex').replace(/^@/, ''),
        look: opts.look || S.defaultLook(), diff, pref: opts.pref || 'todos', gender: opts.gender || 'n',
        skills: { carisma: 8, jogo: 14, edicao: 4, marketing: 3, culinaria: 6, fisico: 12 },
      },
      needs: { fome: 72, sede: 70, sono: 86, higiene: 68, energia: 80, saude: 92, humor: 64, estresse: 22 },
      loc: { area: 'casa', tx: 5, ty: 4, place: null, dir: 1 },
      act: null,
      home: {
        id: 'kitnet', owned: false, studio: false, dirt: 18,
        items: { cama: 'colchao', geladeira: 'frigobar', fogao: 'fogao2', mesa: 'mesa_dobravel', cadeira: 'cadeira_plastico', chuveiro: 'chuveiro', sofa: null, tv: null, cafeteira: null, bike: null, acustica: null },
        deco: [], food: { miojo: [99999, 99999, 99999, 99999], pao: [4, 4], frutas: [5, 5], refri: [99999], cafe: [99999, 99999, 99999] },
        plants: {},
      },
      money: DF.money, ledger: [], bills: [], loans: [], month: {}, autopay: true,
      equip: {
        setup: { computador: 'pc_note', monitor: null, microfone: null, webcam: null, headset: 'fone_simples', teclado: null, mouse: null, iluminacao: null, captura: null, vlogcam: null, console: null },
        owned: { pc_note: { cond: 70, t: 0 }, fone_simples: { cond: 80, t: 0 } }, broken: {}, net: 'net50', soft: {}, vehicles: [], deliveries: [],
      },
      staff: [], gym: 0,
      ch: {
        pulso: { f: 0, subs: 0, afil: false, parc: false, hours: 0, livesN: 0, peak: 0, bal: 0, adsOn: false, followersOnly: false },
        vision: { f: 0, views: 0, wh: 0, mon: false, bal: 0 },
        clipz: { f: 0, views: 0, mon: false, bal: 0 },
        connect: { f: 0, views: 0 },
        moments: [], catHist: {}, contentDays: [], schedule: [], subCohorts: [], lastLiveQ: 50, avgViewers: [],
        merch: { on: false, products: {}, sold: 0, stock: {} },
      },
      viewers: { list: [], next: 1 },
      lives: [], raw: [], edits: [], videos: [], posts: [], feed: [], dms: {},
      creators: [], rel: {},
      rep: { imagem: 50, confianca: 50, credibilidade: 40, popularidade: 2, profissional: 25 },
      contracts: [], offers: [], promises: [],
      events: { log: [], cd: {}, pending: [] },
      cal: [],
      career: { tier: 0, score: 0, hist: [], low: 0, best: 0 },
      goals: {}, notifs: [],
      trends: { games: {}, tags: [], topics: [] },
      stats: { days: [], kwh: 0, pcMin: 0, income: {}, lastSnap: -1 },
      flags: { tutorial: 1 },
      courses: {},
    };
    // tendências iniciais
    D.games.forEach(g => { G.trends.games[g.id] = 1; });
    // criadores
    G.creators = D.creators.map(c => ({
      id: c.id, f: Object.assign({}, c.f), mom: U.rf(-0.2, 0.3), rep: 60 - c.tox * 30, live: null, vids: [], rel: {}, hist: [], lastPost: -1, mood: 0, relPlayer: 0, knowsPlayer: false,
    }));
    D.creatorLinks.forEach(([a, b, v]) => {
      const ca = G.creators.find(c => c.id === a), cb = G.creators.find(c => c.id === b);
      if (ca && cb) { ca.rel[b] = v; cb.rel[a] = v; }
    });
    // relações
    D.npcs.forEach(n => {
      const st = n.start || {};
      G.rel[n.id] = { met: !!st.met || n.role === 'familia', aff: st.aff != null ? st.aff : (n.role === 'familia' ? 70 : 0), trust: st.trust != null ? st.trust : (n.role === 'familia' ? 80 : 20), rom: 0,
        stage: st.stage || (n.role === 'familia' ? 'familia' : 'desconhecido'), last: 0, hist: [], memo: [], flags: {} };
    });
    G.creators.forEach(c => { G.rel[c.id] = { met: false, aff: 0, trust: 20, rom: 0, stage: 'desconhecido', last: 0, hist: [], memo: [], flags: {} }; });
    return G;
  };

  // Sorteio de nome de canal/usuário a partir do nome
  S.suggestChannel = name => {
    const base = U.stripAccents(name || 'Alex').replace(/[^A-Za-z0-9]/g, '');
    const opts = [base + 'Play', base + 'TV', 'Canal' + base, base + 'Ao Vivo', 'O' + base, base + 'Games'];
    return U.pick(opts);
  };
})(window.SL);

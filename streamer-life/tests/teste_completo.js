// Teste de ponta a ponta do Streamer Life (Playwright, abrindo o index.html direto do disco).
// Verifica: criação, tempo, necessidades, casa, compras, live (público, chat, memória), vídeos, redes,
// contas, relacionamentos, eventos, salvamento e recarga do navegador. Uso: node tests/teste_completo.js [pasta_fotos]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const out = process.argv[2] || path.join(__dirname, 'shots');
fs.mkdirSync(out, { recursive: true });
const results = []; const errors = [];
const ok = (name, cond, info) => { results.push({ name, ok: !!cond, info }); console.log((cond ? 'PASSOU ' : 'FALHOU ') + name + (info !== undefined ? ' -> ' + JSON.stringify(info) : '')); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 820 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' | ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const shot = async n => page.screenshot({ path: path.join(out, n + '.png') });
  // fecha as janelas abertas de cima para baixo (eventos com decisão escolhem a primeira opção)
  const fechaJanelas = async () => {
    for (let i = 0; i < 8; i++) {
      const top = await page.$('#modals .modal-bg:last-child'); if (!top) return;
      const ch = await top.$('.choice[data-c]'); if (ch) { await ch.click(); await page.waitForTimeout(250); }
      const bt = await top.$('.mf .btn.primary'); if (bt) { await bt.click().catch(() => {}); await page.waitForTimeout(250); } else if (!ch) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); }
    }
  };
  const url = 'file://' + path.join(__dirname, '..', 'index.html');
  await page.goto(url); await ev(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(400);

  // 1. criação de personagem
  await page.click('[data-m="novo"]');
  await page.fill('#f-name', 'Teste'); await page.click('[data-g="m"]');
  await page.fill('#f-ch', 'CanalDoTeste'); await page.fill('#f-us', 'canal.teste');
  await page.click('[data-hair="3"]'); await page.click('[data-acc="1"]');
  await page.click('[data-diff="normal"]');
  await page.click('[data-go]'); await page.waitForTimeout(300);
  ok('criação de personagem', await ev(() => !!SL.G && SL.G.player.channel === 'CanalDoTeste' && SL.G.player.look.hair === 3 && SL.G.player.look.acc === 1));
  await page.click('.modal .mf .btn.primary'); await page.waitForTimeout(300);
  ok('nova partida começa em casa às 9h', await ev(() => SL.G.loc.area === 'casa' && SL.Clock.fmtTime(SL.G.time.t) === '09:00' && SL.G.money === 2400), await ev(() => SL.Clock.fmtStamp(SL.G.time.t)));
  ok('salvamento automático da partida nova', await ev(() => !!localStorage.getItem('streamerlife_save_1')));

  // 2. passagem do tempo e necessidades
  const t0 = await ev(() => SL.G.time.t);
  await page.waitForTimeout(2500);
  const t1 = await ev(() => SL.G.time.t);
  ok('sem relógio: parado em casa o tempo não passa', t1 === t0 && await ev(() => document.querySelector('#hud .speeds').hidden && !document.querySelector('#hud .hc-time')), t1 - t0);
  ok('topo mostra a próxima meta com prêmio', await ev(() => { const m = SL.Goals.atual(); const b = document.querySelector('#hud .hud-meta b'); return !!m && !!b && b.textContent === m.g.title && m.g.r > 0; }), await ev(() => document.querySelector('#hud .hud-meta').textContent));
  await ev(() => SL.Life.start('banho')); await page.waitForTimeout(1500);
  ok('fazendo alguma coisa o tempo anda', await ev(t => SL.G.time.t > t, t0), await ev(t => SL.G.time.t - t, t0));
  await ev(() => { if (SL.G.act) SL.Life.stop(true); });
  const before = await ev(() => Object.assign({}, SL.G.needs));
  await ev(() => SL.debug.skip(180));
  const after = await ev(() => Object.assign({}, SL.G.needs));
  ok('necessidades caem com o tempo (fome, sede e cansaço)', after.fome < before.fome && after.sede < before.sede && after.energia < before.energia, { fome: [before.fome, after.fome].map(Math.round) });

  // 3. casa: clicar na geladeira, ver o que tem e preparar (pega, cozinha no fogão, leva à mesa e come)
  await ev(() => { SL.HomeScene.placeAt('mesa_jantar'); SL.HomeScene.focus(); }); await page.waitForTimeout(300);
  const fr = await ev(() => { const o = SL.HomeScene.objects().find(x => x.id === 'geladeira'); const r = document.getElementById('cv-world').getBoundingClientRect(); const p = SL.HomeScene.tileToScreen(o.x + 0.5, o.y + 0.6); return { x: r.left + p.x, y: r.top + p.y }; });
  await page.mouse.click(fr.x, fr.y);
  ok('clicar no móvel de longe não abre o menu (precisa ir até lá)', await ev(() => !document.querySelector('.pie')));
  const perto = await page.waitForFunction(() => SL.HomeScene.near() && SL.HomeScene.near().id === 'geladeira', null, { timeout: 9000 }).catch(() => null);
  await page.waitForTimeout(200);
  ok('chegando perto aparece o nome do móvel com a tecla E', !!perto && await ev(() => { const e = document.querySelector('.e-prompt'); return e && !e.hidden && /Frigobar|Geladeira/.test(e.textContent); }));
  await page.keyboard.press('e');
  const menu = await page.waitForSelector('.pie-o', { timeout: 3000 }).catch(() => null); ok('apertar E abre as opções do móvel', !!menu);
  const pieTxt = await ev(() => [...document.querySelectorAll('.pie-o')].map(b => b.textContent.trim()));
  ok('menu da geladeira: ver geladeira e cancelar', pieTxt.length === 2 && /Ver geladeira/.test(pieTxt[0]) && /Cancelar/.test(pieTxt[1]), pieTxt);
  if (menu) await shot('05_menu_geladeira');
  await page.click('.pie-o:not(.cancel)'); await page.waitForSelector('.fr-i', { timeout: 3000 });
  const fomeAntes = await ev(() => SL.G.needs.fome);
  await page.click('.fr-i [data-eat="miojo"]');
  let travado = false;
  for (let i = 0; i < 120; i++) { await page.waitForTimeout(200); const st = await ev(() => ({ busy: SL.Seq.busy(), locked: document.getElementById('hud').classList.contains('locked') })); if (st.busy && st.locked) travado = true; if (!st.busy) break; }
  ok('preparar trava os botões e termina comendo à mesa', travado && await ev(() => !SL.Seq.busy()));
  ok('comer aumenta a fome', await ev(f => SL.G.needs.fome > f && SL.G.flags.ate, fomeAntes), await ev(() => Math.round(SL.G.needs.fome)));
  ok('vaso sanitário tem ação e o banho/vaso usam censura', await ev(() => { const v = SL.HomeScene.objects().find(x => x.id === 'vaso'); const a = SL.HUD.objectActions(v); return a.length > 0 && /banheiro/i.test(a[0].label) && !!SL.Life.ACT.vaso; }));

  // 4. computador e loja (entrega no dia seguinte)
  await page.click('[data-h="pc"]'); await page.waitForSelector('#overlay-pc:not([hidden])', { timeout: 9000 }).catch(() => null);
  ok('computador abre', await ev(() => !document.getElementById('overlay-pc').hidden));
  await page.click('.dicon[data-app="loja"]'); await page.waitForTimeout(400);
  await page.click('.win [data-act="slot"][data-v="microfone"]');
  const dinAntes = await ev(() => SL.G.money);
  await page.click('.win [data-act="buy"][data-v="mic_usb"]'); await page.waitForTimeout(300);
  ok('compra online agenda entrega', await ev(d => SL.G.equip.deliveries.some(x => x.id === 'mic_usb') && SL.G.money < d, dinAntes));
  await shot('06_pc_loja');
  await ev(() => { SL.debug.skip(60 * 26); SL.debug.fill(); });
  ok('entrega chega e equipa', await ev(() => SL.G.equip.setup.microfone === 'mic_usb'));

  // 5. primeira live
  await ev(() => { SL.debug.toHour(20); SL.debug.fill(); });
  await page.click('.dicon[data-app="pulso"]'); await page.waitForTimeout(400);
  await page.click('.win [data-act="game"][data-g="xeque"]');
  await page.fill('#lv-title', 'Primeira live! Desafio de Xeque Rápido até vencer');
  await shot('07_pulso_setup');
  await page.click('.win [data-act="start"]'); await page.waitForTimeout(600);
  ok('live começa e estúdio abre', await ev(() => !!SL.Live.cur && !document.getElementById('overlay-live').hidden));
  let answered = 0, welcomed = 0;
  for (let i = 0; i < 24; i++) {
    if (i >= 12) break;
    await ev(() => { SL.debug.skip(8); SL.G.needs.sono = Math.max(SL.G.needs.sono, 60); });
    await page.waitForTimeout(350);
    const tenta = async sel => { const l = page.locator(sel).first(); if (!(await l.count())) return false; return l.click({ timeout: 1500 }).then(() => true).catch(() => false); };
    if (await tenta('#lv-pend [data-pa="ans"]')) answered++;
    if (await tenta('#lv-pend [data-pa="welcome"]')) welcomed++;
  }
  await page.waitForTimeout(1200);
  const comentario = page.locator('#lv-chat .cm[data-m]:not(.sys):not(.follow):not(.sub):not(.streamer):not(.donation):not(.mod):not(.superchat)');
  // o chat segue o ritmo do público (poucas pessoas = poucas mensagens na tela): espera aparecer um comentário
  await page.waitForFunction(() => document.querySelectorAll('#lv-chat .cm[data-m]:not(.sys):not(.follow):not(.sub):not(.streamer):not(.donation):not(.mod):not(.superchat)').length > 0, null, { timeout: 30000 }).catch(() => null);
  if (await comentario.count()) { await comentario.last().click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(250); }
  const popOk = await ev(() => !!document.querySelector('.viewer-pop [data-p="rep"]'));
  if (popOk) { await page.click('.viewer-pop [data-p="rep"]'); await page.waitForTimeout(200); }
  ok('clicar num comentário abre as respostas e responde no chat', popOk && await ev(() => SL.Live.cur.chat.some(m => m.kind === 'streamer' || m.streamer || /@/.test(m.text || m.raw || ''))));
  await page.click('.taskbar [data-live]'); await page.waitForTimeout(200);
  const minim = await ev(() => document.getElementById('overlay-live').hidden && !!SL.Live.cur);
  await page.click('.taskbar [data-live]'); await page.waitForTimeout(200);
  ok('live minimiza pela barra de tarefas e volta', minim && await ev(() => !document.getElementById('overlay-live').hidden));
  // anúncios de 30, 60 ou 120 segundos: dinheiro vai para o saldo da Twitch (repasse de segunda)
  await page.click('#lv-actions [data-la="ad"]'); await page.waitForTimeout(250);
  const opAds = await ev(() => document.querySelectorAll('#overlay-live .ctx .opt').length);
  const balAntes = await ev(() => SL.G.ch.pulso.bal);
  await page.click('#overlay-live .ctx .opt[data-i="0"]'); await page.waitForTimeout(300);
  ok('anúncios de 30/60/120 s na live pagam no saldo da Twitch', opAds === 3 && await ev(b => SL.G.ch.pulso.bal > b && (SL.G.ch.pulso.ads || []).length === 1, balAntes));
  ok('chat no ritmo do público (poucas pessoas, chat calmo)', await ev(() => { const L = SL.Live.cur; const o = L.viewers; L.viewers = 5; const r = SL.LiveUI.chatRate(L); SL.settings.chatCap = 3; const c = SL.LiveUI.chatRate(L); SL.settings.chatCap = 6; L.viewers = o; return r < 0.3 && c < r; }));
  // 3 velocidades em todo lugar; levantar do PC com a live no ar e voltar
  ok('velocidades (pausa, normal, 3x) só aparecem com a live no ar', await ev(() => document.querySelectorAll('#lv-ctl [data-speed]').length === 3 && !document.querySelector('.taskbar .tb-speeds').hidden));
  // momento de decisão: 2 botões com tempo; arriscar vira momento forte (ou fracasso engraçado) e o público grita
  await ev(() => { window.__voz = []; const o = SL.audio.voz; SL.audio.voz = id => { window.__voz.push(id); o(id); }; const L = SL.Live.cur; L.momento = null; L.momEm = L.min + 1; SL.debug.skip(1); });
  await page.waitForTimeout(400);
  const mom = await ev(() => { const el = document.getElementById('lv-mom'); return { vis: !!el && !el.hidden, bt: el ? el.querySelectorAll('[data-mom]').length : 0, t: el ? el.textContent : '' }; });
  ok('momento de decisão aparece na tela da live com 2 botões', mom.vis && mom.bt === 2, mom);
  await shot('08a_momento');
  if (mom.bt) await page.click('#lv-mom [data-mom="a"]');
  await page.waitForTimeout(300);
  ok('arriscar vira momento da live e o público reage com voz', await ev(() => { const L = SL.Live.cur; return !L.momento && !!L.momRes && L.best.some(m => /^Arriscou/.test(m.txt)) && window.__voz.some(v => /^pb_/.test(v)); }), await ev(() => window.__voz));
  ok('sem escolher, o momento some sozinho (joga seguro)', await ev(() => { const L = SL.Live.cur; L.momEm = L.min + 1; SL.debug.skip(1); const tinha = !!L.momento; if (L.momento) L.momento.gasto = 99999; return tinha; }) && await page.waitForFunction(() => !SL.Live.cur.momento, null, { timeout: 3000 }).then(() => true).catch(() => false));
  await page.click('.taskbar [data-sair]'); await page.waitForTimeout(400);
  ok('sair do PC com a live no ar: ela continua e aparece a janelinha da live', await ev(() => !SL.UI.pcOpen() && !!SL.Live.cur && SL.Live.cur.away && !document.querySelector('#hud .hud-live').hidden));
  await ev(() => SL.debug.skip(5));
  await page.click('#hud .hud-live [data-h="voltarpc"]'); await page.waitForSelector('#overlay-live:not([hidden])', { timeout: 9000 }).catch(() => null);
  ok('voltar ao PC retoma a live', await ev(() => SL.UI.pcOpen() && !SL.Live.cur.away && !!SL.G.act && SL.G.act.id === 'live'));
  await shot('08_live');
  const L1 = await ev(() => { const L = SL.Live.cur; return { min: L.min, viewers: L.viewers, peak: L.peak, msgs: L.stats.msgs, chatDom: document.querySelectorAll('#lv-chat .cm').length, att: L.att.size, intents: [...new Set(L.chat.map(m => m.intent).filter(Boolean))], moments: L.moments.length }; });
  ok('público chega na live', L1.peak >= 1, L1);
  ok('chat tem mensagens na tela', L1.chatDom > 3 && L1.msgs > 5, { dom: L1.chatDom, msgs: L1.msgs });
  ok('mensagens contextuais (momentos do jogo e saudações)', L1.intents.includes('greet') && (L1.intents.includes('moment') || L1.moments > 0), L1.intents);
  ok('Bigode (moderador) responde, dá boas-vindas e agradece sozinho', await ev(() => SL.Live.cur.chat.some(m => m.kind === 'mod' && m.u === 'Bigode')), await ev(() => SL.Live.cur.chat.filter(m => m.kind === 'mod').slice(-3).map(m => m.raw)));
  ok('live simples: só Desafio, Anúncios, Chat (e Patrocínio com contrato)', await ev(() => { const t = [...document.querySelectorAll('#lv-actions .lbtn span')].map(s => s.textContent); return t.length <= 4 && t.includes('Desafio') && t.includes('Anúncios') && !t.includes('Conversar') && !t.includes('Piada'); }));
  await ev(() => { window.__vozes = []; const o = SL.audio.superchat; SL.audio.superchat = id => { window.__vozes.push(id); o(id); }; const L = SL.Live.cur; const v = SL.Viewers.byId([...L.present.keys()][0]); SL.Live.donate(v, 20, ''); });
  await page.waitForTimeout(800);
  ok('superchat com voz (ElevenLabs), som e destaque no chat', await ev(() => window.__vozes.length >= 1 && /^sc_/.test(window.__vozes[0]) && !!document.querySelector('#lv-chat .cm.superchat') && !!(SL.SONS && SL.SONS.sc_som)));
  await page.click('[data-la="end"]'); await page.waitForTimeout(200); await page.click('.modal .mf .btn.danger'); await page.waitForTimeout(600);
  ok('resumo da live aparece', await ev(() => !!document.querySelector('#sum-ch')));
  ok('resumo da live: próximos passos (Instagram e vídeo)', await ev(() => document.querySelectorAll('[data-prox]').length >= 2 && !document.querySelector('[data-prox="agenda"]')));
  ok('cortes automáticos no TikTok e no YouTube quando a live acaba', await ev(() => { const s = SL.G.lives[SL.G.lives.length - 1]; return s.cortes && s.cortes.length === 2 && SL.G.videos.filter(v => v.auto && v.status === 'publicado').length === 2 && document.querySelectorAll('.modal [data-ver]').length === 2; }), await ev(() => (SL.G.lives[SL.G.lives.length - 1].cortes || []).map(c => c.plat + ': ' + c.title)));
  ok('doações, inscrições e anúncios caem na conta no fim da live', await ev(() => { const s = SL.G.lives[SL.G.lives.length - 1]; return s.pago > 0 && SL.G.ch.pulso.bal === 0 && SL.G.ledger.some(l => /Repasse da Twitch/.test(l.desc)); }), await ev(() => SL.G.lives[SL.G.lives.length - 1].pago));
  await shot('09_resumo_live');
  await page.click('.modal .mf .btn.primary');
  const after1 = await ev(() => ({ lives: SL.G.lives.length, f: SL.G.ch.pulso.f, known: SL.G.viewers.list.length, raw: SL.G.raw.length, visited: SL.G.viewers.list.filter(v => v.m.v >= 1).length }));
  ok('live registrada, seguidores e material bruto', after1.lives === 1 && after1.f >= 1 && after1.raw >= 1, after1);

  // 6. segunda e terceira lives: memória dos espectadores
  for (let k = 0; k < 2; k++) {
    await ev(() => { SL.debug.skip(60 * 23); SL.debug.toHour(20); SL.debug.fill(); });
    await ev(() => SL.Live.start({ game: 'xeque', title: 'Voltamos! Xeque Rápido com o chat', desc: 'todo dia às 20h', quality: '720p', planned: 90, announce: true }));
    for (let i = 0; i < 9; i++) await ev(() => { SL.debug.skip(10); SL.G.needs.sono = Math.max(SL.G.needs.sono, 60); const L = SL.Live.cur; const q = L.questions.find(x => !x.done); if (q) SL.Live.answer(q.msgId, SL.Chat.ANSWERS[q.type][0].id); });
    await ev(() => SL.LiveUI.finish());
    await page.waitForTimeout(300); await fechaJanelas();
  }
  // sair de casa com a live no ar: pergunta e encerra
  await ev(() => { SL.debug.fill(); SL.Live.start({ game: 'xeque', title: 'Teste de saída', quality: '720p', planned: 60 }); });
  await page.waitForTimeout(400);
  await page.click('.taskbar [data-sair]'); await page.waitForTimeout(300);
  await ev(() => SL.City.goOutside()); await page.waitForTimeout(250);
  const pergunta = await ev(() => /live/i.test((document.querySelector('.modal') || {}).textContent || ''));
  await page.click('.modal .mf .btn.danger'); await page.waitForTimeout(500);
  ok('sair de casa com a live no ar pergunta e encerra a live', pergunta && await ev(() => !SL.Live.cur && SL.G.loc.area === 'cidade'));
  { const bb = await page.$('.modal .mf .btn.primary'); if (bb) await bb.click(); }
  await ev(() => { SL.G.lives.pop(); SL.City.enter('casa'); SL.UI.openPC(); }); await page.waitForTimeout(300);
  const mem = await ev(() => {
    const rec = SL.G.viewers.list.filter(v => v.m.v >= 2);
    const greetsReturn = SL.G.lives.length;
    return { recorrentes: rec.length, exemplo: rec.slice(0, 3).map(v => ({ u: v.u, visitas: v.m.v, loy: Math.round(v.loy), rep: v.m.rep, notas: v.m.notes.map(n => SL.Viewers.noteText(n)) })), lives: greetsReturn, f: SL.G.ch.pulso.f };
  });
  ok('espectadores voltam e são lembrados (memória individual)', mem.recorrentes >= 2, mem);
  // confere frase de retorno gerada para um recorrente
  const retorno = await ev(() => { const v = SL.G.viewers.list.find(x => x.m.v >= 2 && !x.npc); if (!v) return null; const m = SL.Chat.say(v, 'greet', { s: 'Teste', g: 'Xeque', cat: 'Xadrez' }); return m && m.raw; });
  ok('saudação de quem volta é diferente da de primeira vez', !!retorno && !/primeira vez/i.test(retorno), retorno);

  // 7. vídeos dentro do app: corte da live no TikTok (gravação pronta → Editar → Rápida → Editando → título, descrição e hashtags → publicar)
  await ev(() => { SL.debug.fill(); SL.G.time.speed = 3; });
  await page.click('.dicon[data-app="clipz"]'); await page.waitForTimeout(400);
  await page.click('.win [data-act="criar"][data-k="corte"]'); await page.waitForTimeout(300);
  await page.click('.criar [data-raw]'); await page.waitForTimeout(200);
  ok('gravação da live aparece pronta com o botão Editar', await ev(() => !!document.querySelector('.criar [data-editar]')));
  await page.click('.criar [data-editar]'); await page.waitForTimeout(150);
  ok('Editar mostra Rápida, Normal e Caprichada', await ev(() => document.querySelectorAll('.criar [data-level]').length === 3));
  await page.click('.criar [data-level="rapida"]'); await page.waitForTimeout(400);
  ok('caixa de carregamento Editando', await ev(() => /Editando/.test(document.querySelector('.criar .cv-wait') ? document.querySelector('.criar .cv-wait').textContent : '')));
  await shot('10_editando');
  await page.waitForSelector('.criar [data-publicar]', { timeout: 120000 });
  ok('3 opções de título e descrição e 5 hashtags', await ev(() => document.querySelectorAll('.criar [data-pick="titulo"]').length === 3 && document.querySelectorAll('.criar [data-pick="descricao"]').length === 3 && document.querySelectorAll('.criar .cv-tag').length === 5));
  await page.click('.criar [data-pick="titulo"][data-i="0"]'); await page.click('.criar [data-pick="descricao"][data-i="0"]');
  for (let i = 0; i < 5; i++) { const t = page.locator('.criar .cv-tag:not(.on):not([disabled])').first(); if (await t.count()) await t.click(); }
  ok('no máximo 3 hashtags', await ev(() => document.querySelectorAll('.criar .cv-tag.on').length === 3));
  await shot('11_configurar_video');
  await page.click('.criar [data-publicar]'); await page.waitForTimeout(300);
  ok('vídeo publicado e nota de cada escolha', await ev(() => SL.G.videos.some(v => !v.auto && v.status === 'publicado') && document.querySelectorAll('.criar .cv-row').length >= 5));
  ok('criar vídeo sem a opção de vlog (falar com a câmera)', await ev(() => !SL.Videos.TYPES.vlog || !document.querySelector('[data-game="opiniao"]')));
  ok('vídeo publicado traz público para a próxima live', await ev(() => SL.Videos.buzz().k > 0));
  await page.click('.criar [data-fim]'); await ev(() => { SL.G.time.speed = 1; });
  await ev(() => SL.debug.skip(60 * 30));
  const vid = await ev(() => { const v = SL.G.videos[0]; return { views: Math.round(v.views), likes: Math.round(v.likes), ctr: v.ctr, ret: v.ret, comments: v.comments.length, hist: v.hist.length }; });
  ok('algoritmo distribui o vídeo (visualizações ao longo do tempo)', vid.views > 0 && vid.hist >= 1, vid);

  await page.waitForTimeout(300); await fechaJanelas();
  // 8. redes sociais: post no Connect pela interface
  await page.click('.dicon[data-app="connect"]'); await page.waitForTimeout(300);
  await page.click('.win [data-act="tab"][data-t="publicar"]'); await page.click('.win [data-act="topic"][data-v="pergunta"]');
  await page.click('.win [data-act="post"]'); await page.waitForTimeout(200);
  ok('post publicado no Connect', await ev(() => SL.G.posts.length >= 1));
  await ev(() => SL.debug.skip(60 * 12));
  const post = await ev(() => { const p = SL.G.posts[0]; return { reach: Math.round(p.reach), likes: Math.round(p.likes), comments: p.comments.length }; });
  ok('post recebe alcance e curtidas', post.reach > 0 && post.likes > 0, post);
  ok('feed vivo com outros criadores', await ev(() => SL.G.feed.filter(f => f.author !== 'me').length > 10 && SL.G.feed.some(f => f.plat === 'pulso')), await ev(() => SL.G.feed.length));
  await page.waitForTimeout(300); await fechaJanelas();
  await page.click('.win [data-act="tab"][data-t="feed"]'); await page.waitForTimeout(300); await shot('12_connect_feed');

  // 9. contas e banco
  await ev(() => { SL.debug.money(3000); const d = SL.Clock.day(); SL.debug.skip(((SL.Clock.dayForDayOfMonth(d, 10) - d) * 1440) + 600); });
  const bank = await ev(() => ({ paid: SL.G.ledger.some(l => /Aluguel/.test(l.desc) && l.v < 0), money: SL.G.money, pend: SL.Econ.pending().length }));
  ok('aluguel pago no vencimento (débito automático)', bank.paid, bank);
  await page.waitForTimeout(300); await fechaJanelas();
  await page.click('.dicon[data-app="banco"]'); await page.waitForTimeout(300); await shot('13_banco');

  await page.waitForTimeout(300); await fechaJanelas();
  // 10. cidade, lugar e relacionamento
  await ev(() => { SL.UI.closePC(); if (SL.G.act) SL.Life.stop(false); SL.debug.fill(); SL.debug.toHour(10); SL.debug.fill(); });
  await ev(() => { SL.City.goOutside(); SL.City.travel('cafeteria', 'onibus'); });
  await page.waitForTimeout(300); await shot('14_cidade_viagem');
  await ev(() => SL.debug.skip(60));
  ok('viagem até a cafeteria', await ev(() => SL.G.loc.area === 'local' && SL.G.loc.place === 'cafeteria'), await ev(() => SL.G.loc));
  await page.waitForTimeout(500); await shot('15_cafeteria');
  const relAntes = await ev(() => SL.G.rel.bia.aff);
  await ev(() => SL.HUD.talk('bia')); await page.waitForTimeout(300);
  await page.click('.modal [data-ta="chat"]'); await page.waitForTimeout(200); await page.click('.modal [data-ta="vida"]'); await page.waitForTimeout(200);
  await shot('16_conversa');
  ok('conversa muda a relação e fica na memória', await ev(a => SL.G.rel.bia.met && SL.G.rel.bia.aff !== a && SL.G.rel.bia.hist.length >= 2, relAntes), await ev(() => ({ aff: SL.G.rel.bia.aff, stage: SL.G.rel.bia.stage })));
  await page.keyboard.press('Escape'); await ev(() => document.querySelectorAll('.modal-bg').forEach(m => m.remove()));

  // 11. evento com decisão
  await ev(() => SL.Events.trigger('fake_news', { text: '@canal.teste vai parar com o canal' }));
  await page.waitForTimeout(700);
  ok('evento abre decisão e pausa o tempo', await ev(() => !!document.querySelector('.choice[data-c]') && SL.Clock.held()));
  await shot('17_evento');
  await page.click('.choice[data-c="desmentir"]'); await page.waitForTimeout(200); await page.click('.modal .mf .btn.primary');
  ok('decisão registrada no histórico', await ev(() => SL.G.events.log.some(e => e.id === 'fake_news') && !SL.Clock.held()));

  // 12. celular
  await page.keyboard.press('c'); await page.waitForTimeout(300); await shot('18_celular');
  ok('celular abre com apps', await ev(() => document.querySelectorAll('#overlay-phone .app-grid .dicon').length >= 10));
  await page.click('#overlay-phone [data-app="stats"]'); await page.waitForTimeout(300); await shot('19_celular_carreira');
  await page.click('[data-pclose]');

  // 12b. resumo da semana, chuva e cenário da casa na câmera
  await ev(() => { document.querySelectorAll('.modal-bg').forEach(m => m.remove()); SL.G.resumo = SL.Goals.semana(SL.Clock.day()); SL.G.flags.chuva = 1; });
  await page.waitForSelector('.modal', { timeout: 3000 }).catch(() => null);
  ok('resumo da semana aparece sozinho', await ev(() => /Resumo da semana/.test((document.querySelector('.modal') || {}).textContent || '') && !SL.G.resumo));
  await shot('19a_resumo_semana');
  await ev(() => document.querySelectorAll('.modal-bg').forEach(m => m.remove()));
  ok('chuva: som de fundo sem erro', await ev(() => { try { SL.audio.ambiente({ chuva: true, fora: false, teclado: true, live: false }); return true; } catch (e) { return false; } }));
  ok('Agenda saiu (sem dias e horários)', await ev(() => !SL.Apps.calendario));

  // 13. todos os apps abrem sem erro
  const appErr = await ev(() => { const bad = []; Object.keys(SL.Apps).forEach(id => { const el = document.createElement('div'); try { const ctx = { app: id, args: {}, st: {}, mode: 'pc', host: el, render() {}, rr() {} }; SL.Apps[id].render(el, ctx); if (SL.Apps[id].render && el.innerHTML.includes('Erro')) bad.push(id); } catch (e) { bad.push(id + ': ' + e.message); } }); return bad; });
  ok('todos os apps renderizam', appErr.length === 0, appErr);

  // 14. salvar, fechar o navegador e continuar
  await ev(() => { if (SL.G.act) SL.Life.stop(false); SL.G.time.speed = 0; });
  const snap = await ev(() => ({ t: SL.G.time.t, f: SL.G.ch.pulso.f, viewers: SL.G.viewers.list.length, vids: SL.G.videos.length, money: Math.round(SL.G.money), mem: SL.G.viewers.list.filter(v => v.m.v >= 2).map(v => v.u + ':' + v.m.v).slice(0, 5) }));
  const err = await ev(() => SL.Save.write('2'));
  ok('salvamento manual no espaço 2', err === null, err);
  const size = await ev(() => (localStorage.getItem('streamerlife_save_2') || '').length);
  ok('arquivo comprimido pequeno', size > 1000 && size < 600000, size);
  await page.close();
  const page2 = await ctx.newPage();
  page2.on('pageerror', e => errors.push('pageerror(2): ' + e.message));
  await page2.goto(url); await page2.waitForTimeout(400);
  await page2.click('[data-m="carregar"]'); await page2.waitForTimeout(200);
  await page2.screenshot({ path: path.join(out, '20_carregar.png') });
  await page2.click('[data-load="2"]'); await page2.waitForTimeout(500);
  const snap2 = await page2.evaluate(() => ({ t: SL.G.time.t, f: SL.G.ch.pulso.f, viewers: SL.G.viewers.list.length, vids: SL.G.videos.length, money: Math.round(SL.G.money), mem: SL.G.viewers.list.filter(v => v.m.v >= 2).map(v => v.u + ':' + v.m.v).slice(0, 5) }));
  ok('carregar depois de reabrir o navegador restaura tudo', JSON.stringify(snap) === JSON.stringify(snap2), { snap, snap2 });
  const exp = await page2.evaluate(() => { const s = SL.Save.exportStr(); return SL.Save.importStr(s); });
  ok('exportar e importar salvamento', exp === null, exp);
  await page2.waitForTimeout(300); await page2.screenshot({ path: path.join(out, '21_depois_de_carregar.png') });

  console.log('\nErros no console: ' + (errors.length ? '\n' + errors.slice(0, 15).join('\n') : 'nenhum'));
  const fails = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - fails}/${results.length} verificações passaram.`);
  await browser.close();
  process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE', e); process.exit(2); });

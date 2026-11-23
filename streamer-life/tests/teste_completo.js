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
  await page.click('[data-speed="3"]'); await page.waitForTimeout(1500); await page.click('[data-speed="1"]');
  const t1 = await ev(() => SL.G.time.t);
  ok('tempo passa em tempo real (velocidade 3)', t1 - t0 >= 6, t1 - t0);
  const before = await ev(() => Object.assign({}, SL.G.needs));
  await ev(() => SL.debug.skip(180));
  const after = await ev(() => Object.assign({}, SL.G.needs));
  ok('necessidades caem com o tempo (fome, sede e cansaço)', after.fome < before.fome && after.sede < before.sede && after.energia < before.energia, { fome: [before.fome, after.fome].map(Math.round) });

  // 3. casa: clicar na geladeira, ver o que tem e preparar (pega, cozinha no fogão, leva à mesa e come)
  await ev(() => { SL.HomeScene.placeAt('mesa_jantar'); SL.HomeScene.focus(); }); await page.waitForTimeout(300);
  const fr = await ev(() => { const o = SL.HomeScene.objects().find(x => x.id === 'geladeira'); const r = document.getElementById('cv-world').getBoundingClientRect(); const p = SL.HomeScene.tileToScreen(o.x + 0.5, o.y + 0.6); return { x: r.left + p.x, y: r.top + p.y }; });
  await page.mouse.click(fr.x, fr.y);
  const menu = await page.waitForSelector('.pie-o', { timeout: 9000 }).catch(() => null); ok('personagem anda até a geladeira e o menu aparece', !!menu);
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

  // 4. computador e loja (entrega no dia seguinte)
  await page.click('[data-h="pc"]'); await page.waitForSelector('#overlay-pc:not([hidden])', { timeout: 9000 }).catch(() => null);
  ok('computador abre', await ev(() => !document.getElementById('overlay-pc').hidden));
  await page.click('.dicon[data-app="loja"]'); await page.waitForTimeout(400);
  await page.click('.win [data-act="slot"][data-v="microfone"]');
  await page.click('.win [data-act="buy"][data-v="mic_usb"]'); await page.waitForTimeout(300);
  ok('compra online agenda entrega', await ev(() => SL.G.equip.deliveries.some(d => d.id === 'mic_usb') && SL.G.money < 2400));
  await shot('06_pc_loja');
  await ev(() => { SL.debug.skip(60 * 26); SL.debug.fill(); });
  ok('entrega chega e equipa', await ev(() => SL.G.equip.setup.microfone === 'mic_usb'));

  // 5. primeira live
  await ev(() => { SL.debug.toHour(20); SL.debug.fill(); });
  await page.click('.dicon[data-app="pulso"]'); await page.waitForTimeout(400);
  await page.click('.win [data-act="game"][data-g="xeque"]');
  await page.fill('#lv-title', 'Primeira live! Desafio de Xeque Rápido até vencer');
  await page.fill('#lv-desc', 'Lives todo dia às 20h. Segue no Connect!');
  await shot('07_pulso_setup');
  await page.click('.win [data-act="start"]'); await page.waitForTimeout(600);
  ok('live começa e estúdio abre', await ev(() => !!SL.Live.cur && !document.getElementById('overlay-live').hidden));
  let answered = 0, welcomed = 0;
  for (let i = 0; i < 12; i++) {
    await ev(() => { SL.debug.skip(8); SL.G.needs.sono = Math.max(SL.G.needs.sono, 60); });
    await page.waitForTimeout(350);
    const ans = await page.$('#lv-pend [data-pa="ans"]'); if (ans) { await ans.click(); answered++; }
    const wel = await page.$('#lv-pend [data-pa="welcome"]'); if (wel) { await wel.click(); welcomed++; }
    if (i === 3) { await page.click('[data-la="talk"]'); await page.waitForTimeout(150); const o = await page.$('#overlay-live .ctx .opt'); if (o) await o.click(); }
    if (i === 6) await page.click('[data-la="joke"]');
  }
  await page.waitForTimeout(1200);
  await shot('08_live_estudio');
  const L1 = await ev(() => { const L = SL.Live.cur; return { min: L.min, viewers: L.viewers, peak: L.peak, msgs: L.stats.msgs, chatDom: document.querySelectorAll('#lv-chat .cm').length, att: L.att.size, intents: [...new Set(L.chat.map(m => m.intent).filter(Boolean))], moments: L.moments.length }; });
  ok('público chega na live', L1.peak >= 1, L1);
  ok('chat tem mensagens na tela', L1.chatDom > 3 && L1.msgs > 5, { dom: L1.chatDom, msgs: L1.msgs });
  ok('mensagens contextuais (momentos do jogo e saudações)', L1.intents.includes('greet') && (L1.intents.includes('moment') || L1.moments > 0), L1.intents);
  ok('perguntas respondidas pela interface', answered + welcomed > 0, { answered, welcomed });
  await page.click('[data-la="end"]'); await page.waitForTimeout(200); await page.click('.modal .mf .btn.danger'); await page.waitForTimeout(600);
  ok('resumo da live aparece', await ev(() => !!document.querySelector('#sum-ch')));
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
    await page.waitForTimeout(300); const b = await page.$('.modal .mf .btn.primary'); if (b) await b.click();
  }
  const mem = await ev(() => {
    const rec = SL.G.viewers.list.filter(v => v.m.v >= 2);
    const greetsReturn = SL.G.lives.length;
    return { recorrentes: rec.length, exemplo: rec.slice(0, 3).map(v => ({ u: v.u, visitas: v.m.v, loy: Math.round(v.loy), rep: v.m.rep, notas: v.m.notes.map(n => SL.Viewers.noteText(n)) })), lives: greetsReturn, f: SL.G.ch.pulso.f };
  });
  ok('espectadores voltam e são lembrados (memória individual)', mem.recorrentes >= 2, mem);
  // confere frase de retorno gerada para um recorrente
  const retorno = await ev(() => { const v = SL.G.viewers.list.find(x => x.m.v >= 2 && !x.npc); if (!v) return null; const m = SL.Chat.say(v, 'greet', { s: 'Teste', g: 'Xeque', cat: 'Xadrez' }); return m && m.raw; });
  ok('saudação de quem volta é diferente da de primeira vez', !!retorno && !/primeira vez/i.test(retorno), retorno);

  // 7. vídeos: criar, editar, renderizar, publicar e ver desempenho
  await ev(() => SL.debug.fill());
  await page.click('.dicon[data-app="estudio"]'); await page.waitForTimeout(400);
  await page.click('.win [data-act="type"][data-v="short"]'); await page.click('.win [data-act="step"][data-s="2"]');
  await page.click('.win [data-act="step"][data-s="3"]'); await page.click('.win [data-act="wgame"][data-v="xeque"]'); await page.click('.win [data-act="step"][data-s="4"]');
  const rawBtn = await page.$('.win [data-act="raw"]'); if (rawBtn) await rawBtn.click();
  await page.click('.win [data-act="step"][data-s="5"]');
  await shot('10_estudio_momentos');
  await page.click('.win [data-act="step"][data-s="6"]'); await page.click('.win [data-act="create"]'); await page.waitForTimeout(300);
  ok('projeto de edição criado', await ev(() => SL.G.edits.length >= 1));
  const eid = await ev(() => SL.G.edits[SL.G.edits.length - 1].id);
  await page.click(`.win [data-act="edit"][data-e="${eid}"][data-m="9999"]`); await page.waitForTimeout(200);
  await ev(() => SL.debug.skip(400));
  ok('edição termina e renderiza', await ev(id => SL.G.edits.find(e => e.id === id).status === 'pronto', eid), await ev(id => SL.G.edits.find(e => e.id === id).status, eid));
  await ev(() => SL.UI.wins.find(w => w.app === 'estudio').ctx.render());
  await page.click('.win [data-act="tab"][data-t="producao"]'); await page.click(`.win [data-act="fin"][data-e="${eid}"]`);
  await page.fill('.win [data-f="etitle"]', 'NÃO ACREDITO nesse xeque-mate no Xeque Rápido!');
  await page.click('.win [data-act="ft"][data-v="tags"]'); for (let i = 0; i < 3; i++) await page.click('.win [data-act="etag"]:not(.on)');
  await page.click('.win [data-act="ft"][data-v="pub"]'); await page.waitForTimeout(200);
  await shot('11_estudio_publicar');
  await page.click(`.win [data-act="pub"][data-e="${eid}"]`); await page.waitForTimeout(200);
  ok('vídeo publicado', await ev(() => SL.G.videos.length >= 1 && SL.G.videos[0].status === 'publicado'));
  await ev(() => SL.debug.skip(60 * 30));
  const vid = await ev(() => { const v = SL.G.videos[0]; return { views: Math.round(v.views), likes: Math.round(v.likes), ctr: v.ctr, ret: v.ret, comments: v.comments.length, hist: v.hist.length }; });
  ok('algoritmo distribui o vídeo (visualizações ao longo do tempo)', vid.views > 0 && vid.hist >= 1, vid);

  // 8. redes sociais: post no Connect pela interface
  await page.click('.dicon[data-app="connect"]'); await page.waitForTimeout(300);
  await page.click('.win [data-act="tab"][data-t="publicar"]'); await page.click('.win [data-act="topic"][data-v="pergunta"]');
  await page.click('.win [data-act="post"]'); await page.waitForTimeout(200);
  ok('post publicado no Connect', await ev(() => SL.G.posts.length >= 1));
  await ev(() => SL.debug.skip(60 * 12));
  const post = await ev(() => { const p = SL.G.posts[0]; return { reach: Math.round(p.reach), likes: Math.round(p.likes), comments: p.comments.length }; });
  ok('post recebe alcance e curtidas', post.reach > 0 && post.likes > 0, post);
  ok('feed vivo com outros criadores', await ev(() => SL.G.feed.filter(f => f.author !== 'me').length > 10 && SL.G.feed.some(f => f.plat === 'pulso')), await ev(() => SL.G.feed.length));
  await page.click('.win [data-act="tab"][data-t="feed"]'); await page.waitForTimeout(300); await shot('12_connect_feed');

  // 9. contas e banco
  await ev(() => { SL.debug.money(3000); const d = SL.Clock.day(); SL.debug.skip(((SL.Clock.dayForDayOfMonth(d, 10) - d) * 1440) + 600); });
  const bank = await ev(() => ({ paid: SL.G.ledger.some(l => /Aluguel/.test(l.desc) && l.v < 0), money: SL.G.money, pend: SL.Econ.pending().length }));
  ok('aluguel pago no vencimento (débito automático)', bank.paid, bank);
  await page.click('.dicon[data-app="banco"]'); await page.waitForTimeout(300); await shot('13_banco');

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

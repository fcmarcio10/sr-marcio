// t99: chat do PegaAí responde uma vez só (sem dar para ficar mandando de novo); só libera outra resposta
// se o passageiro perguntar algo. WhatsApp: uma resposta por mensagem que pede resposta.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; Settings.msgMode = 'texto'; Settings.radioOff = true; VoicePlayer.stop(); newRideRequest(); });
  await p.waitForTimeout(5500); // espera a primeira mensagem do passageiro (cria a conversa)
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  await p.evaluate(() => { Phone.go('pegaai'); Phone.pgTab = 'msgs'; Phone.pgChat = Act.ride.rid; Phone.render(); }); await p.waitForTimeout(200);
  const ok = []; const conta = () => p.evaluate(() => [pgFind(Act.ride.rid).msgs.filter((m) => m.me).length, document.querySelectorAll('#phone-body [data-pgq]').length, (document.querySelector('#phone-body .pgc-closed') || {}).textContent || '']);
  let c = await conta(); console.log('antes de responder (minhas, botões):', c); ok.push(c[0] === 0 && c[1] === 3);
  await p.click('#phone-body [data-pgq="0"]'); await p.waitForTimeout(150);
  c = await conta(); console.log('depois de responder:', c); ok.push(c[0] === 1 && c[1] === 0 && /já respondeu/.test(c[2]));
  // tentativa de ficar mandando (clique direto no botão, mesmo sem ele estar na tela)
  await p.evaluate(() => { const bt = document.createElement('button'); bt.dataset.pgq = '2'; document.getElementById('phone-body').appendChild(bt); bt.click(); bt.click(); });
  await p.waitForTimeout(3500);
  c = await conta(); console.log('depois de tentar mandar de novo + resposta do passageiro:', c, await p.evaluate(() => pgFind(Act.ride.rid).msgs.map((m) => (m.me ? 'EU: ' : 'ELE: ') + m.body)));
  ok.push(c[0] === 1 && c[1] === 0);
  // passageiro pergunta algo: libera mais uma resposta (só uma)
  await p.evaluate(() => { const m = pgMsg(Act.ride, 'Oi! Tô com duas malas, cabe aí?'); m.ask = true; Phone.render(); }); await p.waitForTimeout(150);
  c = await conta(); console.log('passageiro perguntou:', c); ok.push(c[1] === 3);
  await p.click('#phone-body [data-pgq="1"]'); await p.waitForTimeout(150);
  c = await conta(); console.log('respondeu a pergunta:', c); ok.push(c[0] === 2 && c[1] === 0);
  await (await p.$('.phone')).screenshot({ path: 'pg_umavez.png' });
  // mensagem que não é pergunta não libera
  await p.evaluate(() => { pgMsg(Act.ride, 'Tô na frente do portão azul.'); Phone.render(); }); await p.waitForTimeout(150);
  c = await conta(); console.log('mensagem comum do passageiro:', c); ok.push(c[1] === 0);
  // WhatsApp: mensagem que pede resposta → responde uma vez e some
  await p.evaluate(() => { addMsg('Seu Biu (Bananas)', 'Teste', 'Vai me ajudar?', false, [['Vou sim!', 'Valeu!'], ['Agora não', 'Poxa.']]); Phone.go('msgs'); Phone.chat = 'Seu Biu (Bananas)'; Phone.render(); });
  await p.waitForTimeout(150);
  const wa = () => p.evaluate(() => [document.querySelectorAll('#phone-body [data-reply]').length, (Profile.msgs || []).filter((m) => m.from === 'Seu Biu (Bananas)' && m.me).length]);
  let w = await wa(); console.log('zap antes:', w); ok.push(w[0] === 2);
  await p.click('#phone-body [data-reply="0"]'); await p.waitForTimeout(2200);
  w = await wa(); console.log('zap depois:', w); ok.push(w[0] === 0 && w[1] === 1);
  console.log(ok.every(Boolean) ? 'OK: responde uma vez só' : 'FALHOU: ' + JSON.stringify(ok));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

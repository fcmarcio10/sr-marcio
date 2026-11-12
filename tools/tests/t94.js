const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; Settings.msgMode = 'audio'; newRideRequest(); });
  await p.waitForTimeout(5500);
  console.log('chat após chamada:', await p.evaluate(() => [pgUnread(), pgChats()[0].msgs.map(m => m.body)]));
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  await p.evaluate(() => Phone.go('pegaai')); await p.click('[data-pgtab="msgs"]'); await p.waitForTimeout(200);
  await (await p.$('.phone')).screenshot({ path: 'pg_list.png' });
  await p.click('[data-pgchat]'); await p.waitForTimeout(200); await p.click('[data-pgq="1"]'); await p.waitForTimeout(3500);
  await (await p.$('.phone')).screenshot({ path: 'pg_chat.png' });
  await p.keyboard.press('KeyQ');
  // corrida ruim
  await p.evaluate(() => { const R = Act.ride; R.stage = 'drive'; R.hits = 3; R.t = 5; rideFinish(R); });
  await p.waitForTimeout(13000);
  console.log('whatsapp com passageiro?', await p.evaluate(() => Profile.msgs.filter(m => /Dona|Seu|Thaís|Juninho|Pastor|Marcão|Bia|Tio|Kelly|Rafa|Vó|Diego|Professora/.test(m.from) && m.voice).length), 'pg voz:', await p.evaluate(() => pgChats()[0].msgs.filter(m => m.voice).map(m => m.voice.clip)));
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  await p.evaluate(() => { Phone.go('pegaai'); Phone.pgChat = pgChats()[0].rid; Phone.render(); }); await p.waitForTimeout(300);
  await (await p.$('.phone')).screenshot({ path: 'pg_voice.png' });
  await p.evaluate(() => { Settings.msgMode = 'texto'; Phone.render(); }); await p.waitForTimeout(200);
  await (await p.$('.phone')).screenshot({ path: 'pg_text.png' });
  await p.keyboard.press('KeyQ');
  // configurações
  await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.click('#screen-pause [data-act="settings"]'); await p.waitForTimeout(400);
  console.log('opção nas configurações:', await p.evaluate(() => [...document.querySelectorAll('[data-seg="msgMode"] button')].map(b => b.textContent + (b.classList.contains('on') ? '*' : ''))));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

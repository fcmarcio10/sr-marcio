// t107: botões do celular (bolinha = início, seta = voltar para a tela de antes)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; VoicePlayer.stop(); Screens.closeAll(); });
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(400);
  const passos = [];
  const st = () => p.evaluate(() => Phone.app + (Phone.chat ? '/' + Phone.chat : '') + (Phone.app === 'ajustes' || Phone.app.startsWith('aj-') ? '' : ''));
  await p.click('#phone-body [data-app="ajustes"]'); await p.waitForTimeout(200); passos.push(await st());
  await p.click('#phone-body [data-go="aj-wall"]'); await p.waitForTimeout(200); passos.push(await st());
  await p.click('#phone-nav-back'); await p.waitForTimeout(200); passos.push('seta→' + await st());
  await p.click('#phone-nav-back'); await p.waitForTimeout(200); passos.push('seta→' + await st());
  await p.click('#phone-body [data-app="msgs"]'); await p.waitForTimeout(200);
  await p.click('#phone-body [data-chat]'); await p.waitForTimeout(200); passos.push(await st());
  await p.click('#phone-nav-back'); await p.waitForTimeout(200); passos.push('seta→' + await st());
  await p.click('#phone-body [data-chat]'); await p.waitForTimeout(200);
  await p.click('#phone-nav-home'); await p.waitForTimeout(200); passos.push('bolinha→' + await st());
  await (await p.$('.phone')).screenshot({ path: 'cel_botoes.png' });
  console.log(passos.join(' | '));
  const ok = passos[0] === 'ajustes' && passos[1] === 'aj-wall' && passos[2] === 'seta→ajustes' && passos[3] === 'seta→home' && passos[4].startsWith('msgs/') && passos[5] === 'seta→msgs' && passos[6] === 'bolinha→home';
  console.log(ok ? 'OK: bolinha e seta do celular' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

// t114: nada fala nem reage durante o carregamento, rádio começa desligada, aviso grande do tutorial (a história saiu)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.evaluate(() => { localStorage.clear(); Settings.radioOff = false; });
  await p.click('[data-act="play"]'); await p.waitForTimeout(3000);
  const durante = await p.evaluate(() => ({ carregando: Game.carregando, toasts: document.querySelectorAll('#toasts .toast, .toast').length, tut: !document.getElementById('tutorial').classList.contains('hidden'), voz: !!VoicePlayer.msg, radio: Radio.isOn(), dist: Profile.distance }));
  await p.waitForTimeout(7000);
  const depois = await p.evaluate(() => ({ carregando: Game.carregando, toasts: document.querySelectorAll('.toast').length, tut: !document.getElementById('tutorial').classList.contains('hidden'), pop: (document.getElementById('ms-ajuda') || {}).textContent || '', radio: Radio.isOn(), boasVindas: (Profile.msgs || []).some((m) => m.voice && m.voice.clip === 'boas_vindas'), vozZap: !!VoicePlayer.msg }));
  await p.screenshot({ path: 't114_tutorial.png' });
  console.log(JSON.stringify({ durante, depois }));
  const ok = durante.carregando && !durante.toasts && !durante.tut && !durante.voz && !durante.radio && !depois.carregando && depois.tut && /Passo 1/.test(depois.pop) && !depois.radio && !depois.boasVindas && !depois.vozZap;
  console.log(ok ? 'OK: espera o carregamento, rádio desligada e tutorial' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

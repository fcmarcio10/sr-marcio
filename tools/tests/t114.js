// t114: nada fala nem reage durante o carregamento, rádio começa desligada, aviso grande do tutorial e história em capítulos
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
  // história: terminar o tutorial fecha o capítulo 1
  const m0 = await p.evaluate(() => { Profile.tut = TUT_STEPS.length; return Profile.money; });
  await p.waitForTimeout(1500);
  const c1 = await p.evaluate(() => ({ cap: Profile.hist.cap, money: Profile.money, passou: document.getElementById('ms-passou').textContent }));
  await p.screenshot({ path: 't114_passou.png' });
  await p.waitForTimeout(6500);
  await p.screenshot({ path: 't114_titulo.png' });
  await p.waitForTimeout(5500);
  const abre2 = await p.evaluate(() => ({ pop: (document.getElementById('ms-titulo') || {}).textContent || '', leg: document.getElementById('ms-legenda').textContent, ajuda: document.getElementById('ms-ajuda').textContent, tag: document.getElementById('obj-tag').textContent, titulo: document.getElementById('obj-title').textContent, meta: document.getElementById('obj-meta').textContent, msg: (Profile.msgs || []).some((m) => m.voice && m.voice.clip === 'cap_2') }));
  await p.screenshot({ path: 't114_capitulo.png' });
  await p.evaluate(() => { Profile.rides = (Profile.rides || 0) + 5; }); await p.waitForTimeout(1500);
  const c2 = await p.evaluate(() => Profile.hist.cap);
  // pula até o último e compra o Opalha
  await p.evaluate(() => { Profile.hist.cap = 6; Profile.owned.brasa = true; }); await p.waitForTimeout(1500);
  const fim = await p.evaluate(() => ({ fim: Profile.hist.fim, pop: document.getElementById('ms-passou').textContent }));
  await p.evaluate(() => { Screens.open && Screens.open('screen-pause'); });
  console.log(JSON.stringify({ durante, depois, m0, c1, abre2, c2, fim }));
  const ok = durante.carregando && !durante.toasts && !durante.tut && !durante.voz && !durante.radio && !depois.carregando && depois.tut && /Passo 1/.test(depois.pop) && !depois.radio && !depois.boasVindas && !depois.vozZap
    && c1.cap === 1 && c1.money >= m0 + 200 && /Capítulo concluído/.test(c1.passou) && /Capítulo 2/.test(abre2.pop) && /5 corridas/.test(abre2.leg) && /online/.test(abre2.ajuda) && abre2.tag === 'HISTÓRIA' && /Capítulo 2/.test(abre2.titulo) && abre2.msg && c2 === 2 && fim.fim && /História concluída/.test(fim.pop);
  console.log(ok ? 'OK: espera o carregamento, rádio desligada, tutorial e história' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

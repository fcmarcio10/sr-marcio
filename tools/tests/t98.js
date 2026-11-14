// Rádio Gambiarra FM sempre no ar (liga/desliga, entra num ponto qualquer, pausa com áudio e volta),
// falas novas de passageiro (sotaques) e voz de cliente feliz
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  await p.evaluate(() => { localStorage.clear(); });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7000);
  console.log('clips:', await p.evaluate(() => JSON.stringify({ radio: RADIO.concat(RADIO_VINHETAS).filter(r => VOICE_CLIPS[r.clip]).length + '/' + (RADIO.length + RADIO_VINHETAS.length), falas: VOICE_LINES.filter(l => VOICE_CLIPS[l.clip]).length + '/' + VOICE_LINES.length, then: RADIO.filter(r => r.then && !RADIO.find(x => x.clip === r.then)).length + ' sem par' })));
  // já entra no ar sozinha, ligada por padrão
  let r = await p.evaluate(() => ({ ligada: Radio.isOn(), modo: Radio.mode, cur: Radio.cur && Radio.cur.clip, k: +Radio.k.toFixed(1), dur: Radio.dur, visivel: !$('hud-radio').classList.contains('hidden'), botao: $('hud-radio-btn').classList.contains('on'), txt: $('hr-txt').textContent }));
  console.log('no ar ao começar:', JSON.stringify(r));
  await p.screenshot({ path: 'radio.png' });
  // boas-vindas do Seu Zé (9,5 s) deixa a rádio em silêncio e depois ela volta
  await p.waitForTimeout(3500);
  console.log('durante o áudio do Seu Zé:', await p.evaluate(() => JSON.stringify({ voz: !!VoicePlayer.msg, held: Radio.held, pausada: !Radio.a || Radio.a.paused, visivel: !$('hud-radio').classList.contains('hidden') })));
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; VoicePlayer.stop(); Screens.closeAll(); });
  await p.waitForTimeout(500);
  console.log('depois do áudio:', await p.evaluate(() => JSON.stringify({ held: Radio.held, modo: Radio.mode, tocando: Radio.a ? !Radio.a.paused : 'sem audio' })));
  // ponto de entrada sorteado: em 30 sintonias, quantas começam no meio e quantos quadros diferentes
  console.log('sintonia:', await p.evaluate(() => { let meio = 0; const s = new Set(); for (let i = 0; i < 30; i++) { Radio.stop(); Radio.sintoniza(); if (Radio.k > 0) meio++; s.add(Radio.cur.clip); } Radio.stop(); return meio + ' de 30 no meio, ' + s.size + ' quadros diferentes'; }));
  // fim de uma fala: intervalo curto e emenda a próxima (programação contínua)
  await p.evaluate(() => { Radio.sintoniza(); Radio.k = Radio.dur + 2; });
  await p.waitForTimeout(2500);
  console.log('emenda:', await p.evaluate(() => JSON.stringify({ modo: Radio.mode, cur: Radio.cur && Radio.cur.clip })));
  // ouvinte ligando: o DJ responde logo depois
  console.log('ouvinte:', await p.evaluate(() => { Radio.bag = [RADIO.find(x => x.clip === 'radio_tonho')]; const f = Radio.monta(); return f.map(x => x.clip).join(' > '); }));
  // chuva: só toca quadro de chuva com chuva
  console.log('chuva:', await p.evaluate(() => { const o = {}; for (const w of [0, 0.8]) { Weather.rain = w; const s = new Set(); Radio.bag = []; for (let i = 0; i < 46; i++) s.add(Radio.next().clip); o[w ? 'chovendo' : 'seco'] = ['radio_17', 'radio_marcao', 'radio_36'].filter(c => s.has(c)).join(',') || 'nenhum'; } Weather.rain = 0; return JSON.stringify(o); }));
  // tecla F desliga; botão Rádio liga de novo
  await p.keyboard.press('KeyF'); await p.waitForTimeout(400);
  const a2 = await p.evaluate(() => ({ off: Settings.radioOff, modo: Radio.mode, botao: $('hud-radio-btn').classList.contains('on') }));
  await p.waitForTimeout(1500);
  const a3 = await p.evaluate(() => Radio.mode);
  await p.click('#hud-radio-btn'); await p.waitForTimeout(400);
  console.log('desligar/ligar:', JSON.stringify(a2), 'continua desligada:', a3, '| botão liga:', await p.evaluate(() => JSON.stringify({ off: Settings.radioOff, modo: Radio.mode, cur: Radio.cur && Radio.cur.clip })));
  // configurações: Desligada
  await p.evaluate(() => { Settings.radioOff = true; }); await p.waitForTimeout(300);
  console.log('configuração desligada:', await p.evaluate(() => Radio.mode));
  await p.evaluate(() => { Settings.radioOff = false; }); await p.waitForTimeout(400);
  // paredão: silêncio; desligou o paredão, volta
  await p.evaluate(() => { carKit(player.car.id).sound = true; Som.on = true; }); await p.waitForTimeout(400);
  const s1 = await p.evaluate(() => ({ held: Radio.held }));
  await p.evaluate(() => { Som.on = false; }); await p.waitForTimeout(400);
  console.log('paredão:', JSON.stringify(s1), '→ depois', await p.evaluate(() => JSON.stringify({ held: Radio.held, modo: Radio.mode })));
  // pausa
  await p.evaluate(() => Screens.open('screen-pause')); await p.waitForTimeout(400);
  const pz = await p.evaluate(() => ({ held: Radio.held, pausada: !Radio.a || Radio.a.paused }));
  await p.evaluate(() => Screens.back()); await p.waitForTimeout(400);
  console.log('pausa:', JSON.stringify(pz), '→ voltou', await p.evaluate(() => JSON.stringify({ held: Radio.held })));
  // falas por sotaque e gênero
  console.log('bravos:', await p.evaluate(() => {
    const out = {};
    for (const [nome, hits, late] of [['Dona Cida', 1, false], ['Seu Juca', 3, false], ['Seu Juca', 0, true], ['Kelly', 0, true]]) {
      const set = new Set();
      for (let i = 0; i < 40; i++) { const R = { rid: 1000 + i, name: nome, type: 'comum', hits, t: 0 }; angryVoice(R, late); const c = pgFind(R.rid); set.add(c.msgs[c.msgs.length - 1].voice.clip); }
      out[nome + (late ? ' atrasou' : ' bateu ' + hits)] = [...set].sort().join(',');
    }
    return JSON.stringify(out);
  }));
  // volume 0 = desligada
  await p.evaluate(() => { Settings.radio = 0; }); await p.waitForTimeout(300);
  console.log('volume 0:', await p.evaluate(() => Radio.mode));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

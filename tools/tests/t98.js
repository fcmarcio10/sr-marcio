// Rádio Gambiarra FM (DJ Biruta), falas novas de passageiro (sotaques) e voz de cliente feliz
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  await p.evaluate(() => { localStorage.clear(); });
  await p.click('[data-act="play"]'); await p.waitForTimeout(11000);
  await p.evaluate(() => { Profile.tut = 99; Profile.welcomed = true; Events.spawnT = 1e9; VoicePlayer.stop(); Screens.closeAll(); });
  console.log('clips:', await p.evaluate(() => JSON.stringify({ radio: RADIO.filter(r => VOICE_CLIPS[r.clip]).length + '/' + RADIO.length, falas: VOICE_LINES.filter(l => VOICE_CLIPS[l.clip]).length + '/' + VOICE_LINES.length, felizes: VOICE_LINES.filter(l => l.when === 'top').length })));
  // entra no ar sozinha depois de ~25 s (aqui adiantamos o relógio da rádio)
  await p.evaluate(() => { Radio.t = 0.2; });
  await p.waitForTimeout(1200);
  let r = await p.evaluate(() => ({ cur: Radio.cur && Radio.cur.clip, visivel: !$('hud-radio').classList.contains('hidden'), tag: $('hr-tag').textContent, txt: $('hr-txt').textContent }));
  console.log('no ar:', JSON.stringify(r));
  await p.screenshot({ path: 'radio.png' });
  // pausa segura o áudio; volta e continua
  await p.evaluate(() => Screens.open('screen-pause')); await p.waitForTimeout(400);
  console.log('pausa:', await p.evaluate(() => ({ cur: !!Radio.cur, held: Radio.held })));
  await p.evaluate(() => Screens.back()); await p.waitForTimeout(400);
  console.log('voltou:', await p.evaluate(() => ({ cur: !!Radio.cur, held: Radio.held })));
  // áudio do PegaAí corta o DJ
  await p.evaluate(() => { const R = { rid: 99, name: 'Dona Cida', type: 'comum', hits: 0, t: 0, len: 100, fare: 30 }; happyVoice(R); const c = pgFind(99); VoicePlayer.play(c.msgs[c.msgs.length - 1]); });
  console.log('voz de cliente feliz corta o rádio:', await p.evaluate(() => ({ radio: !!Radio.cur, voz: VoicePlayer.msg && VoicePlayer.msg.voice.clip })));
  await p.evaluate(() => VoicePlayer.stop());
  // tecla F: chama o DJ na hora; de novo: desliga e fica desligada
  await p.keyboard.press('KeyF'); await p.waitForTimeout(300);
  const a1 = await p.evaluate(() => Radio.cur && Radio.cur.clip);
  await p.keyboard.press('KeyF'); await p.waitForTimeout(300);
  const a2 = await p.evaluate(() => ({ cur: !!Radio.cur, off: Settings.radioOff }));
  await p.evaluate(() => { Radio.t = 0; }); await p.waitForTimeout(600);
  console.log('tecla F:', a1, JSON.stringify(a2), 'desligada não volta sozinha:', await p.evaluate(() => !Radio.cur));
  await p.keyboard.press('KeyF'); await p.waitForTimeout(300);
  // paredão tira o DJ do ar
  await p.evaluate(() => { carKit(player.car.id).sound = true; Som.toggle(); });
  console.log('paredão:', await p.evaluate(() => ({ som: Som.on, radio: !!Radio.cur })));
  await p.evaluate(() => { Som.on = false; });
  // não repete: 13 vinhetas seguidas sem repetir
  console.log('sorteio:', await p.evaluate(() => { Radio.bag = []; Radio.last = null; const s = new Set(); for (let i = 0; i < 13; i++) s.add(Radio.next().clip); return s.size + ' diferentes em 13'; }));
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
  // volume 0 desliga
  await p.evaluate(() => { Radio.stop(); Settings.radio = 0; Settings.radioOff = false; Radio.t = 0; }); await p.waitForTimeout(500);
  console.log('volume 0:', await p.evaluate(() => !Radio.cur ? 'fica quieta' : 'TOCOU'));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

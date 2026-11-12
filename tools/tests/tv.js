const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  console.log(await p.evaluate(() => {
    const keys = Object.keys(VOICE_CLIPS);
    const lines = VOICE_LINES.map(l => l.clip + (VOICE_CLIPS[l.clip] ? ' OK' : ' (sem áudio)'));
    const chars = Object.keys(CHAR_VOICES).map(k => k + (VOICE_CLIPS[k] ? ' OK' : ' (sem áudio)'));
    return JSON.stringify({ total: keys.length, passageiros: lines, personagens: chars }, null, 1);
  }));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

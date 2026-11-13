// boas-vindas do Seu Zé, faixa dos carros, cortes (árvores, pedestres, poças, mariposas)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  console.log('mundo:', await p.evaluate(() => ({ arvores: World.tall.filter(t => t.kind === 'tree').length, pedestres: Animals.list.filter(a => a.type === 'person').length, mariposasNaFavela: World.tall.filter(t => t.kind === 'lamp').length })));
  await p.click('[data-act="play"]'); await p.waitForTimeout(7600);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; });
  await p.waitForTimeout(3500);
  const w = await p.evaluate(() => { const m = (Profile.msgs || []).filter(x => x.from === 'Seu Zé (Oficina)'); return { n: m.length, voz: !!(m[0] && m[0].voice), tocou: !!(m[0] && m[0].voice && m[0].voice.heard), welcomed: Profile.welcomed, texto: m[0] && m[0].body.slice(0, 60) }; });
  console.log('boas-vindas:', JSON.stringify(w));
  console.log('carros na faixa:', await p.evaluate(() => Traffic.cars.every(c => c.e.T.lanes.some(l => Math.abs(l - c.off) < 15 || c.overtake)) + ' (' + Traffic.cars.length + ' carros)'));
  // sair e entrar de novo: não manda outra vez
  await p.evaluate(() => { saveGame(); Screens.open('screen-pause'); });
  await p.click('[data-act="abandon"]').catch(() => {}); await p.waitForTimeout(800);
  await p.evaluate(() => { if (Game.mode !== 'menu') { Game.mode = 'menu'; } });
  await p.click('[data-act="play"]').catch(() => p.click('[data-act="continue"]').catch(() => {})); await p.waitForTimeout(18000);
  console.log('de novo:', await p.evaluate(() => (Profile.msgs || []).filter(x => x.body && x.body.startsWith('Ô meu filho, seja bem-vindo')).length));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

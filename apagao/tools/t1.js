// Teste rápido: abre o jogo, começa, tira fotos e mostra erros.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 600))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await p.goto('file://' + __dirname + '/teste.html'); await p.waitForTimeout(2500);
  await p.screenshot({ path: process.argv[2] + '/menu.png' });
  await p.click('#b-new').catch(e => errs.push('click ' + e.message.slice(0, 200))); await p.waitForTimeout(7000);
  await p.mouse.move(800, 420);
  await p.screenshot({ path: process.argv[2] + '/casa.png' });
  const info = await p.evaluate(() => ({ st: G.state, z: Zombies.list.length, props: World.props.length, builds: World.builds.length, px: Player.x, py: Player.y, act: Zombies.active.length }));
  console.log(JSON.stringify(info)); console.log(errs.slice(0, 8).join('\n---\n') || 'sem erros');
  await b.close();
})();

// Teste rápido: abre o index.html direto do disco (file://), cria personagem e tira fotos das telas principais.
// Uso: node tests/smoke.js [pasta_saida]
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2] || path.join(__dirname, 'shots');
require('fs').mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, '01_titulo.png') });
  await page.click('[data-m="novo"]');
  await page.fill('#f-name', 'Marina');
  await page.click('[data-g="f"]');
  await page.click('[data-sug]');
  await page.screenshot({ path: path.join(out, '02_criacao.png') });
  await page.click('[data-go]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, '03_boasvindas.png') });
  await page.click('.modal .mf .btn.primary');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, '04_casa.png') });
  console.log(JSON.stringify(await page.evaluate(() => ({ t: SL.Clock.fmtStamp(SL.G.time.t), money: SL.G.money, area: SL.G.loc.area, notifs: SL.G.notifs.length, feed: SL.G.feed.length }))));
  console.log(errors.length ? errors.join('\n---\n') : 'SEM ERROS');
  await browser.close();
})();

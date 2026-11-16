// salvamentos em 3 espaços, troca de teclas, controle de videogame e legendas das falas
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.__slots = true; const pad = { connected: true, id: 'Controle de teste', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ value: 0, pressed: false })) }; window.__pad = pad; navigator.getGamepads = () => [pad]; });
  await p.goto('file://' + process.cwd() + '/wrapped.html'); await p.waitForTimeout(2500);
  // salvamentos
  await p.click('[data-act="play"]'); await p.waitForTimeout(300);
  const vazios = await p.evaluate(() => document.querySelectorAll('.slot.vazio').length);
  await p.screenshot({ path: 't123_slots_vazio.png' });
  await p.click('[data-slot-novo="2"]'); await p.waitForTimeout(400);
  await p.waitForFunction(() => Game.state === 'playing' && !Game.carregando, null, { timeout: 30000 });
  const s1 = await p.evaluate(() => { Profile.money = 4321; saveGame(); return { slot: Settings.slot, tem2: !!slotInfo(2), tem1: !!slotInfo(1), money2: slotInfo(2).money }; });
  // teclas: troca acelerar para I
  const t = await p.evaluate(() => { Captura.acao = 'acelerar'; return true; });
  await p.keyboard.press('KeyI'); await p.waitForTimeout(100);
  const tk = await p.evaluate(() => ({ acel: tecla('acelerar'), farol: tecla('farol'), buzina: tecla('buzina') }));
  await p.keyboard.down('KeyI'); await p.waitForTimeout(600); const v1 = await p.evaluate(() => player.speed); await p.keyboard.up('KeyI');
  await p.evaluate(() => { Settings.teclas = {}; player.vx = player.vy = 0; });
  // controle: gatilho direito acelera e o analógico vira; botão Y abre o celular
  await p.evaluate(() => { window.__pad.buttons[7] = { value: 1, pressed: true }; window.__pad.axes[0] = 0.8; });
  await p.waitForTimeout(700);
  const pad = await p.evaluate(() => ({ ativo: Pad.ativo, vel: Math.round(player.speed), steer: +player.steer.toFixed(2) }));
  await p.evaluate(() => { window.__pad.buttons[7] = { value: 0, pressed: false }; window.__pad.axes[0] = 0; window.__pad.buttons[3] = { value: 1, pressed: true }; });
  await p.waitForTimeout(200);
  const cel = await p.evaluate(() => Screens.current);
  await p.evaluate(() => { window.__pad.buttons[3] = { value: 0, pressed: false }; Screens.closeAll(); });
  // legenda
  await p.evaluate(() => { Legenda.fala('Pedestre', 'Devagar, motorista!', 3); });
  await p.waitForTimeout(300);
  const leg = await p.evaluate(() => document.getElementById('fala-leg').textContent);
  await p.screenshot({ path: 't123_legenda.png' });
  // tela de configurações > controles
  await p.evaluate(() => Screens.open('screen-settings')); await p.waitForTimeout(200);
  await p.click('[data-tab="controles"]'); await p.waitForTimeout(200);
  const nt = await p.evaluate(() => document.querySelectorAll('.ct-tecla').length);
  await p.screenshot({ path: 't123_teclas.png' });
  await p.click('[data-ct="controle"]'); await p.waitForTimeout(200);
  const est = await p.evaluate(() => document.querySelector('.ct-estado').textContent);
  console.log(vazios, JSON.stringify(s1), JSON.stringify(tk), Math.round(v1), JSON.stringify(pad), cel, leg, nt, est);
  const ok = vazios === 3 && s1.slot === 2 && s1.tem2 && !s1.tem1 && s1.money2 === 4321 && tk.acel === 'KeyI' && tk.farol !== tk.buzina && v1 > 20 && pad.ativo && pad.vel > 20 && pad.steer > 0.1 && cel === 'screen-phone' && /Devagar/.test(leg) && nt === 14 && /conectado/.test(est);
  console.log(ok ? 'OK: salvamentos, teclas, controle e legendas' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

// t106: celular abre ao lado esquerdo do velocímetro e o jogo continua (dá para dirigir com ele aberto)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; VoicePlayer.stop(); Screens.closeAll(); });
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(500);
  const t0 = await p.evaluate(() => ({ estado: Game.state, hud: !$('hud').classList.contains('hidden'), t: Game.time, x: player.x }));
  await p.keyboard.down('KeyW'); await p.waitForTimeout(1500); await p.keyboard.up('KeyW');
  const r = await p.evaluate(() => {
    const ph = document.querySelector('#screen-phone .phone').getBoundingClientRect(), d = $('hud-dash').getBoundingClientRect();
    return { estado: Game.state, aberto: Screens.current, tempoAndou: Game.time, x: player.x, celularDireita: Math.round(ph.right), painelEsquerda: Math.round(d.left), celularBaixo: Math.round(ph.bottom), painelBaixo: Math.round(d.bottom), celularTopo: Math.round(ph.top) };
  });
  await p.screenshot({ path: 'celular_aberto.png' });
  // tocar no celular funciona
  await p.click('#phone-body [data-app="mapa"]').catch(() => {}); await p.waitForTimeout(300);
  const app = await p.evaluate(() => Phone.app);
  await p.keyboard.press('KeyQ'); await p.waitForTimeout(300);
  const fechou = await p.evaluate(() => Screens.current);
  console.log(JSON.stringify({ t0, r, app, fechou }));
  const ok = t0.estado === 'playing' && t0.hud && r.tempoAndou > t0.t + 1 && Math.abs(r.x - t0.x) > 20 && r.celularDireita <= r.painelEsquerda && Math.abs(r.celularBaixo - r.painelBaixo) < 30 && r.celularTopo >= 60 && app === 'mapa' && fechou === null;
  console.log(ok ? 'OK: celular em cima do painel e o jogo continua' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

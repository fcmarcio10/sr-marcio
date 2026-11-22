// t110: passageiro reage à batida falando (sem aviso escrito), voz certa para homem/mulher;
// prévia da câmera nas configurações não tapa as outras opções; volumes padrão novos
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.evaluate(() => localStorage.clear());
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const r = await p.evaluate(() => {
    Profile.tut = 99; Events.spawnT = 1e9; VoicePlayer.stop(); document.getElementById('toasts').innerHTML = '';
    const ouvidas = [];
    const _A = window.Audio; window.Audio = function (src) { const k = Object.keys(VOICE_CLIPS).find((c) => VOICE_CLIPS[c].src === src); ouvidas.push(k); return { play: () => Promise.resolve(), pause() {}, volume: 1 }; };
    for (const [nome, tipo] of [['Dona Cida', 'comum'], ['Seu Jorge', 'comum'], ['Kelly', 'vip'], ['Marcão', 'mudanca']]) { vozBatida.t = 0; rideHit({ name: nome, type: tipo, hits: 0, broke: [] }); }
    window.Audio = _A;
    const avisos = document.getElementById('toasts').children.length;
    return { ouvidas, avisos, padrao: { engine: Settings.engine, ambient: Settings.ambient, ui: Settings.ui, radio: Settings.radio, quality: Settings.quality, zoom: Settings.zoom } };
  });
  console.log(JSON.stringify(r));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.evaluate(() => Screens.open('screen-settings')); await p.waitForTimeout(300);
  await p.click('[data-tab="video"]'); await p.waitForTimeout(150);
  const cp = await p.evaluate(() => ({ semCamera: !document.querySelector('[data-seg="cam"]') && !document.getElementById('cam-prev') }));
  console.log(JSON.stringify(cp));
  const ok = r.avisos === 0 && /bt_f/.test(r.ouvidas[0]) && /bt_m/.test(r.ouvidas[1]) && r.ouvidas[2] === 'bt_vf' && r.ouvidas[3] === 'bt_qm' && r.padrao.ambient === 40 && r.padrao.quality === 'alta' && r.padrao.zoom === 145 && cp.semCamera;
  console.log(ok ? 'OK: voz na batida, câmera única e padrões' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

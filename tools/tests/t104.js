// t104: nitidez automática (segura 60 FPS baixando um pouco a resolução quando os quadros atrasam e voltando com folga)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const r = await p.evaluate(() => {
    Profile.tut = 99; Events.spawnT = 1e9; VoicePlayer.stop();
    const out = { desligadaNoTeste: AutoRes.off, w0: canvas.width };
    AutoRes.off = false; AutoRes.espera = 0; AutoRes.n = AutoRes.lentos = AutoRes.trab = AutoRes.t = 0;
    for (let i = 0; i < 70; i++) AutoRes.quadro(1 / 30, 20); // 30 FPS: tem que baixar
    out.k1 = AutoRes.k; out.w1 = canvas.width;
    AutoRes.espera = 0; for (let i = 0; i < 130; i++) AutoRes.quadro(1 / 60, 4); // 60 FPS com folga: sobe? (não passa do degrau que travou)
    out.k2 = AutoRes.k;
    AutoRes.teto = 1; AutoRes.espera = 0; for (let i = 0; i < 130; i++) AutoRes.quadro(1 / 60, 4);
    out.k3 = AutoRes.k;
    Settings.quality = 'media'; resize(); out.trocouGrafico = AutoRes.k; Settings.quality = 'alta'; resize();
    AutoRes.off = true; return out;
  });
  console.log(JSON.stringify(r));
  const ok = r.desligadaNoTeste && r.k1 < 1 && r.w1 < r.w0 && r.k2 === r.k1 && r.k3 > r.k1 && r.trocouGrafico === 1;
  console.log(ok ? 'OK: nitidez automática' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

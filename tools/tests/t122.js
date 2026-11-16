// dia e noite: 24 h com dia da semana, céu claro ao meio-dia, luzes apagando, loja fechada com aviso, movimento por hora
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.__dia = true; });
  await p.goto('file://' + process.cwd() + '/wrapped.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => startPlay());
  await p.waitForFunction(() => Game.state === 'playing' && !Game.carregando, null, { timeout: 30000 });
  const r = await p.evaluate(() => {
    const out = {};
    Profile.dia = 5; Profile.time = 1439.5; stepPlay(1); out.virou = Profile.dia === 6 && Profile.time < 2;
    Profile.time = 12 * 60; Dia.update(); out.meioDia = { sol: Dia.sol, apaga: Dia.apaga };
    Profile.time = 2 * 60; Dia.update(); out.madrugada = { sol: Dia.sol, apaga: Dia.apaga, mov: Dia.movimento().k, ped: Dia.pedestres() };
    Profile.dia = 2; Profile.time = 8 * 60; Dia.update(); out.picoManha = Dia.movimento().label;
    Profile.dia = 0; out.domingoCalmo = Dia.movimento().label !== 'horário de pico';
    // loja fechada (padaria às 2h) e aberta (bar às 2h)
    Profile.time = 2 * 60; Dia.update();
    const pad = World.shops.find((s) => s.kind === 'padaria'), bar = World.shops.find((s) => s.kind === 'bar');
    out.padaria = lojaAberta(pad); out.bar = lojaAberta(bar);
    player.place(pad.x, pad.y + 20, 0); player.vx = player.vy = 0;
    return out;
  });
  await p.waitForTimeout(500);
  const pr = await p.evaluate(() => Act.prompt && Act.prompt.text);
  await p.keyboard.press('KeyE'); await p.waitForTimeout(400);
  const aviso = await p.evaluate(() => { const e = document.getElementById('loja-fechada'); return e ? e.textContent : ''; });
  await p.screenshot({ path: 't122_fechada.png' });
  console.log(JSON.stringify(r), pr, aviso);
  const ok = r.virou && r.meioDia.sol === 1 && r.meioDia.apaga === 1 && r.madrugada.sol === 0 && r.madrugada.apaga === 0 && r.madrugada.mov < 0.5 && r.madrugada.ped < 0.5 && r.picoManha === 'horário de pico' && r.domingoCalmo && !r.padaria && r.bar && /Fechada/.test(pr || '') && /Loja fechada/.test(aviso);
  console.log(ok ? 'OK: dia e noite, dias da semana, luzes e loja fechada' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

// convite de evento (aceitar/recusar) e noivo sem WhatsApp
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message + e.stack));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 40000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(600);
  await p.waitForTimeout(7600);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; });
  const spawn = (t) => p.evaluate((t) => { Events.clear(); for (let i = 0; i < 30; i++) if (Events.spawn(t)) return true; return false; }, t);
  const st = () => p.evaluate(() => { const E = Events.cur; return E && { type: E.type, stage: E.stage, over: !!E.over, refused: !!E.refused, map: !!Events.mapPoint(), gps: !!Events.gpsTarget(), hud: !!Events.hud(), card: !document.getElementById('ev-offer').classList.contains('hidden') }; });
  // 1) noivo: convite aparece, sem ponto no mapa; recusa com N
  console.log('spawn noivo', await spawn('noivo')); await p.waitForTimeout(500);
  console.log('offer:', JSON.stringify(await st()));
  await p.screenshot({ path: 'offer1.png' });
  await p.keyboard.press('KeyN'); await p.waitForTimeout(400);
  console.log('after N:', JSON.stringify(await st()));
  // 2) quebrado: aceita clicando
  console.log('spawn quebrado', await spawn('quebrado')); await p.waitForTimeout(400);
  await p.click('#ev-offer .evo-yes'); await p.waitForTimeout(400);
  console.log('after click yes:', JSON.stringify(await st()));
  await p.screenshot({ path: 'offer2.png' });
  // 3) carona (ou quebrado, se não tiver BR perto): ignora até acabar o tempo
  console.log('spawn carona/quebrado', (await spawn('carona')) || (await spawn('quebrado')));
  await p.evaluate(() => { Events.cur.offerT = 0.6; }); await p.waitForTimeout(1200);
  console.log('after timeout:', JSON.stringify(await st()));
  // 4) festa: aceita com Y
  console.log('spawn festa', await spawn('festa')); await p.waitForTimeout(300);
  await p.keyboard.press('KeyY'); await p.waitForTimeout(300);
  console.log('festa after Y:', JSON.stringify(await st()));
  // 5) noivo chega a tempo: nada no WhatsApp, recado na tela, não repete o mesmo noivo
  console.log('spawn noivo', await spawn('noivo')); await p.keyboard.press('KeyY'); await p.waitForTimeout(200);
  const r = await p.evaluate(() => { const E = Events.cur, n0 = (Profile.msgs || []).length; E.stage = 'drive'; E.left = 60; E.tmax = 80; E.dest = { x: player.x, y: player.y, name: 'Igreja Teste' }; E.target = E.dest; return { nome: E.nome, noiva: E.noiva, n0 }; });
  await p.waitForTimeout(16000);
  console.log('casou:', JSON.stringify(r), await p.evaluate((n0) => ({ msgsNovas: Profile.msgs.length - n0, casados: Profile.evCasados, toasts: [...document.querySelectorAll('#toasts .toast b')].map(x => x.textContent) }), r.n0));
  const seen = await p.evaluate((nome) => { let rep = 0; for (let i = 0; i < 40; i++) { Events.clear(); if (Events.spawn('noivo') && Events.cur.nome === nome) rep++; } Events.clear(); return rep; }, r.nome);
  console.log('noivo casado reapareceu', seen, 'vezes');
  // 6) limpeza das conversas antigas
  console.log('cleanup:', await p.evaluate(() => { addMsg('Robson (noivo)', '', 'CASEI', true); addMsg('Cleiton', '', 'Oi, aqui é Cleiton, do carro quebrado. Peguei seu número', true); const a = Profile.msgs.length; Events.reset(); return [a, Profile.msgs.length, Profile.msgs.some(m => /noivo/.test(m.from))]; }));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

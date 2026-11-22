// t101: noite sem acúmulo de escuridão (canto sem poste não fica preto total) e sons de ambiente por região:
// fundo da cidade e da roça trocando, bicho perto tocando o som certo, carro passando raspando e sem cachorro latindo nem fundo gravado na cidade.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  await p.evaluate(() => { Profile.tut = 99; Events.spawnT = 1e9; Settings.radioOff = true; Radio.stop(); VoicePlayer.stop(); });
  const ok = [];
  // ---------- luz ----------
  const luz = await p.evaluate(() => {
    player.place(7500, 2518, 0); Cam.x = 7750; Cam.y = 2620;
    for (let i = 0; i < 12; i++) render();
    const a = lctx.getImageData(10, 200, 1, 1).data[3] / 255, dk = Cam.dark;
    return { alfaCanto: +a.toFixed(2), dark: +dk.toFixed(2) };
  });
  console.log('luz (roça):', JSON.stringify(luz)); ok.push(luz.alfaCanto < 0.97);
  // ---------- fundo da cidade ----------
  await p.evaluate(() => { player.place(2100, 1518, 0); Cam.x = 2100; Cam.y = 1500; });
  await p.waitForTimeout(4000);
  const cid = await p.evaluate(() => ({ ok: AudioSys.ok, fundos: Object.keys(Ambiente.fundos), cidade: Ambiente.fundos.cidade ? +Ambiente.fundos.cidade.g.gain.value.toFixed(3) : 0, pesos: Ambiente.pesos() }));
  console.log('cidade:', JSON.stringify(cid)); ok.push(cid.ok && !cid.cidade && !Object.keys(cid.pesos).includes("cidade"));
  // ---------- roça ----------
  await p.evaluate(() => { player.place(7200, 1350, 0); Cam.x = 7200; Cam.y = 1350; });
  await p.waitForTimeout(5000);
  const roca = await p.evaluate(() => {
    const R = REGIONS[regionKeyAt(Cam.x, Cam.y)], n0 = Ambiente.n;
    for (const c of ['sfx_vaca', 'sfx_cavalo', 'sfx_galinha', 'sfx_coruja', 'sfx_galo']) Ambiente.pronto(c);
    return { reg: regionKeyAt(Cam.x, Cam.y), rural: R.rural, roca: Ambiente.fundos.roca ? +Ambiente.fundos.roca.g.gain.value.toFixed(3) : 0, cidade: Ambiente.fundos.cidade ? +Ambiente.fundos.cidade.g.gain.value.toFixed(3) : 0, n0 };
  });
  await p.waitForTimeout(800);
  const sorteio = await p.evaluate(() => {
    const _t = Ambiente.toca, out = []; Ambiente.toca = function (clip, x, y, v, al) { out.push(clip); return _t.call(this, clip, x, y, v, al); };
    for (let i = 0; i < 40; i++) Ambiente.sorteia(regionKeyAt(Cam.x, Cam.y), REGIONS[regionKeyAt(Cam.x, Cam.y)], Cam.x, Cam.y);
    Ambiente.toca = _t; const cont = {}; for (const c of out) cont[c] = (cont[c] || 0) + 1; return cont;
  });
  console.log('roça:', JSON.stringify(roca), 'sorteio:', JSON.stringify(sorteio));
  ok.push(roca.roca > 0.05 && roca.cidade < roca.roca, (sorteio.sfx_vaca || 0) + (sorteio.sfx_cavalo || 0) + (sorteio.sfx_galinha || 0) > 5, !sorteio.sfx_onibus);
  // ---------- cidade: sorteio de rua ----------
  const rua = await p.evaluate(() => {
    for (const c of ['sfx_carro', 'sfx_moto', 'sfx_onibus', 'sfx_risada']) Ambiente.pronto(c);
    return true;
  });
  await p.waitForTimeout(800);
  const sc = await p.evaluate(() => {
    const out = {}, _t = Ambiente.toca; Ambiente.toca = function (clip, x, y, v, al) { out[clip] = (out[clip] || 0) + 1; return _t.call(this, clip, x, y, v, al); };
    for (let i = 0; i < 40; i++) Ambiente.sorteia('centro', REGIONS.centro, 2100, 1500);
    Ambiente.toca = _t; return out;
  });
  console.log('rua:', JSON.stringify(sc)); ok.push(rua && !sc.sfx_carro && !sc.sfx_moto && !sc.sfx_cachorro && !sc.sfx_vaca); // cidade como era antes: sem sons gravados
  // ---------- carro passando raspando e cachorro ----------
  const pass = await p.evaluate(() => {
    player.place(2100, 1518, 0); Cam.x = 2100; Cam.y = 1500; player.vx = 0; player.vy = 0;
    const n0 = Ambiente.n, a = Traffic.cars[0] || { m: VMODELS.hatch }; Traffic.cars.unshift(a);
    a.x = player.x + 60; a.y = player.y + 20; a.vx = 400; a.vy = 0; Ambiente.passouT = 0; Ambiente.passou.clear();
    Ambiente.resto(0.016); const devagar = Ambiente.n - n0; // eu parado: não faz barulho
    player.vx = -330; player.speed = 330; Ambiente.passouT = 0; Ambiente.tocando = 0; Ambiente.passou.clear(); // eu a ~99 km/h
    Ambiente.resto(0.016); const rapido = Ambiente.n - n0 - devagar; player.vx = 0; player.speed = 0;
    return { devagar, rapido, latido: typeof Ambiente.latido === 'undefined' };
  });
  console.log('carro passando (eu parado / eu acima de 85) + latido:', JSON.stringify(pass)); ok.push(pass.devagar === 0 && pass.rapido === 1 && pass.latido);
  console.log(ok.every(Boolean) ? 'OK: noite clara e sons de ambiente' : 'FALHOU: ' + JSON.stringify(ok));
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

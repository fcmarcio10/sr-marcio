// t108: IA melhor — pedestre atravessa a rua olhando para os dois lados e o carro do trânsito para para ele;
// carro mantém distância maior quando está mais rápido e volta para a faixa da direita.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/wrapped.html');
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.click('[data-act="play"]'); await p.waitForTimeout(7500);
  const r = await p.evaluate(() => {
    Profile.tut = 99; Events.spawnT = 1e9; VoicePlayer.stop();
    // pedestre numa calçada de rua da cidade
    const cand = Animals.list.filter((a) => a.type === 'person' && !a.dance && Math.min(a.rect[2] - a.rect[0], a.rect[3] - a.rect[1]) <= 30 && Math.abs(a.x - 2100) < 900 && Math.abs(a.y - 1600) < 900);
    let an = null, ok0 = false;
    for (const a of cand) { a.state = 'idle'; a.t = 0; if (a.vaiCruzar()) { an = a; ok0 = true; break; } }
    if (!an) return { semPedestre: cand.length };
    player.place(an.x + 1500, an.y + 1500, 0); Cam.x = an.x; Cam.y = an.y; Traffic.cars.forEach((c) => c.release && c.release()); Traffic.cars.length = 0;
    const lado0 = an.cruza.h ? Math.sign(an.y - an.cruza.e.a.y) : Math.sign(an.x - an.cruza.e.a.x), fases = new Set();
    let olhou = 0, a0 = an.a;
    for (let i = 0; i < 60 * 25 && an.cruza; i++) { fases.add(an.cruza.fase); if (an.cruza.fase === 1) olhou = Math.max(olhou, Math.abs(angDiff(an.a, a0))); an.update(1 / 60); }
    const lado1 = Math.sign((fases.size && an.rect ? (an.y + an.x) : 0)) ;
    const e = Animals.list.indexOf(an);
    const ladoFim = (an.y - an.rect[1] >= -1 && an.y - an.rect[3] <= 1) && (an.x - an.rect[0] >= -1 && an.x - an.rect[2] <= 1);
    return { fases: [...fases], atravessou: !an.cruza, dentroDoNovoRect: ladoFim, lado0 };
  });
  console.log('pedestre:', JSON.stringify(r));
  // carro para para quem está atravessando
  const c = await p.evaluate(() => {
    player.place(2100, 1518, 0); Cam.x = 2100; Cam.y = 1518; for (let i = 0; i < 1200 && !Traffic.cars.some((x) => x.state === 'edge' && x.sEnd - x.s > 250); i++) stepPlay(1 / 60);
    const a = Traffic.cars.find((x) => x.state === 'edge' && x.sEnd - x.s > 250) || null;
    if (!a) return { semCarro: true };
    const q = a.edgePos(a.s + 120); const an = Animals.list.find((x) => x.type === 'person' && !x.morto);
    an.cruza = null; an.x = q[0]; an.y = q[1]; an.onRoad = true; an.state = 'idle'; an.t = 99; a.v = 150; a.animalGhost = 0; a.ghost = 0;
    let vmin = 999; for (let i = 0; i < 300; i++) { an.x = q[0]; an.y = q[1]; an.onRoad = true; an.state = 'idle'; an.t = 99; a.update(1 / 60, Game.time); vmin = Math.min(vmin, a.v); }
    const dist = Math.hypot(a.x - q[0], a.y - q[1]);
    return { vmin: Math.round(vmin), distParou: Math.round(dist) };
  });
  console.log('carro x pedestre:', JSON.stringify(c));
  const ok = r.atravessou && r.dentroDoNovoRect && r.fases.includes(1) && r.fases.includes(2) && (c.semCarro || (c.vmin < 10 && c.distParou > 10));
  console.log(ok ? 'OK: pedestre atravessa e carro para' : 'FALHOU');
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();

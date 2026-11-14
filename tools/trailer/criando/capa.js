// Capa do vídeo do YouTube (1280x720): o Opalha rebaixado com neon na pista molhada de madrugada, texto grande à esquerda.
// uso (de dentro de tools/trailer/criando):  node capa.js  ->  saida/capa.jpg (e saida/capa_<n>.jpg com outras posições)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const AQ = __dirname, TRD = path.join(AQ, '..');
// três jeitos do carro na orla (cor, acabamento, insulfilm e neon); a capa principal é a primeira
const POS = [
  { nome: 'vermelho', x: 7300, y: 8737, a: Math.PI, wet: 0.8, cor: '#a90d18', finish: 'none', tint: 1, neon: '#22d1ff' },
  { nome: 'amarelo', x: 7300, y: 8737, a: Math.PI, wet: 0.8, cor: '#f2b705', finish: 'none', tint: 1, neon: '#ff2bd6' },
  { nome: 'azul', x: 7300, y: 8737, a: Math.PI, wet: 0.8, cor: '#1450d8', finish: 'none', tint: 1, neon: '#ff3a3a' },
];
const Z = 6.2;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.log('erro:', e.message));
  await p.addInitScript({ path: path.join(TRD, 'relogio.js') });
  await p.goto('file://' + path.join(TRD, '..', 'tests', 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.evaluate(() => { localStorage.clear(); Settings.quality = 'alta'; Settings.radioOff = true; resize(); });
  await p.click('[data-act="play"]'); await p.waitForTimeout(10500);
  await p.evaluate(() => {
    Profile.tut = 99; Profile.welcomed = true; Profile.owned.brasa = true; Profile.current = 'brasa';
    const cfg = carCfg('brasa'); cfg.color = '#c4101e';
    Object.assign(carKit('brasa'), { finish: 'metal', neon: '#22d1ff', low: true, spoiler: true, wheels: 'tala', tint: 2 });
    player.setCar('brasa'); Events.spawnT = 1e9; Profile.msgs = []; VoicePlayer.stop(); Screens.closeAll();
  });
  for (const f of ['cena.js', 'cinema/estilo.js']) await p.addScriptTag({ path: path.join(TRD, f) });
  await p.evaluate(() => { window.__VT.start(); });
  // camada do texto
  await p.evaluate(() => {
    const st = document.createElement('style');
    st.textContent = `#capa{position:fixed;inset:0;z-index:100000;pointer-events:none;font-family:var(--f-display)}
    #capa .sombra{position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,5,10,.92) 0%,rgba(4,5,10,.78) 34%,rgba(4,5,10,.15) 58%,rgba(4,5,10,0) 70%),radial-gradient(ellipse at 72% 55%,rgba(0,0,0,0) 30%,rgba(0,0,0,.45) 100%)}
    #capa .tx{position:absolute;left:78px;top:150px;line-height:.9;text-transform:uppercase}
    #capa .tx i{display:block;font-style:normal;font-size:86px;color:#fff;letter-spacing:.01em;text-shadow:7px 7px 0 #000}
    #capa .tx b{display:block;font-weight:400;font-size:214px;color:#ffd23f;letter-spacing:.005em;text-shadow:10px 10px 0 #000,0 0 50px rgba(255,190,40,.35)}
    #capa .tx b.br{font-size:176px;background:linear-gradient(100deg,#1fdc6a 0%,#ffd23f 60%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(10px 10px 0 #000)}
    #capa .selo{position:absolute;left:84px;bottom:92px;display:flex;align-items:center;gap:22px}
    #capa .selo span{font-family:var(--f-cond);font-weight:800;font-size:40px;letter-spacing:.2em;color:#fff;background:#e8121f;padding:8px 22px 10px;text-transform:uppercase;box-shadow:7px 7px 0 #000}
    #capa .selo em{font-style:normal;font-family:var(--f-cond);font-weight:800;font-size:38px;letter-spacing:.14em;color:#fff;text-transform:uppercase;text-shadow:4px 4px 0 #000}`;
    document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'capa';
    d.innerHTML = '<div class="sombra"></div><div class="tx"><i>Estou criando um</i><b>Jogo de carro</b><b class="br">brasileiro</b></div><div class="selo"><span>Mundo aberto</span><em>BR Night Drive</em></div>';
    document.body.appendChild(d);
  });
  fs.mkdirSync(path.join(AQ, 'saida'), { recursive: true });
  let k = 0;
  for (const P of POS) {
    await p.evaluate((P) => {
      const cfg = carCfg('brasa'); cfg.color = P.cor; Object.assign(carKit('brasa'), { finish: P.finish, tint: P.tint, neon: P.neon }); player.setCar('brasa');
      TR.n = 400; TR.reset({ time: 23 * 60 + 30, rain: 0, wet: P.wet, grade: 0.3 }); Act.race = null; Events.clear(); document.getElementById('hud').style.visibility = 'hidden';
      player.place(P.x, P.y, P.a); TR.rail = null; TR.manual = () => ({ brk: true });
      for (const c of Traffic.cars) { c.release && c.release(); c.dead = true; } Traffic.cars = [];
      const zw = 1920 / (screenZoomBase() * P.Z); TR.fixo(P.x - 0.2 * zw, P.y - 4, P.Z, P.Z);
      canvas.style.filter = 'contrast(1.12) saturate(1.3) brightness(1.08)';
    }, Object.assign({ Z }, P));
    for (let i = 0; i < 40; i++) await p.evaluate(() => TR.step());
    const arq = path.join(AQ, 'saida', 'capa_' + P.nome + '.png');
    await p.screenshot({ path: arq });
    execFileSync('python3', ['-c', `from PIL import Image; Image.open('${arq}').convert('RGB').resize((1280, 720), Image.LANCZOS).save('${arq.replace('.png', '.jpg')}', quality=92)`]);
    fs.unlinkSync(arq); console.log('capa', P.nome); k++;
  }
  fs.copyFileSync(path.join(AQ, 'saida', 'capa_' + POS[0].nome + '.jpg'), path.join(AQ, 'saida', 'capa.jpg'));
  await b.close();
})();

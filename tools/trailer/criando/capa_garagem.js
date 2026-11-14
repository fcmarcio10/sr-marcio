// Capa do vídeo do YouTube (1280x720) com o carro da vitrine da garagem do jogo (grande, com neon embaixo) e a cidade de noite atrás.
// uso (de dentro de tools/trailer/criando):  node capa_garagem.js  ->  saida/capa_garagem_<cor>.jpg
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const AQ = __dirname, TRD = path.join(AQ, '..');
const CORES = [ // a primeira vira saida/capa.jpg
  { nome: 'vermelho', cor: '#c4101e', neon: '#22d1ff', finish: 'metal' },
  { nome: 'azul', cor: '#1d63ff', neon: '#ff2bd6', finish: 'metal' },
];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.log('erro:', e.message));
  await p.goto('file://' + path.join(TRD, '..', 'tests', 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.evaluate(() => { localStorage.clear(); Settings.quality = 'alta'; Settings.radioOff = true; resize(); });
  await p.click('[data-act="play"]'); await p.waitForTimeout(10500);
  await p.evaluate(() => {
    Profile.tut = 99; Profile.welcomed = true; Profile.owned.brasa = true; Profile.current = 'brasa'; player.setCar('brasa'); VoicePlayer.stop(); Screens.closeAll();
    const st = document.createElement('style');
    st.textContent = `body.capa #screen-garage{background:transparent!important}
    body.capa #screen-garage .garage > *:not(.garage-body){visibility:hidden}
    body.capa #screen-garage .garage-list, body.capa #screen-garage .garage-side, body.capa #screen-garage .garage-center > *:not(#garage-preview){visibility:hidden}
    body.capa #garage-preview{position:fixed!important;right:-150px;top:80px;width:1560px!important;height:944px!important;z-index:99990;-webkit-mask-image:radial-gradient(ellipse 44% 50% at 56% 52%,#000 50%,transparent 100%);mask-image:radial-gradient(ellipse 44% 50% at 56% 52%,#000 50%,transparent 100%)}
    #capa{position:fixed;inset:0;z-index:100000;pointer-events:none;font-family:var(--f-display)}
    #capa .sombra{position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,5,10,.9) 0%,rgba(4,5,10,.7) 32%,rgba(4,5,10,0) 55%)}
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
    // a cidade de noite atrás, desfocada (luzes do Centrão), sem trânsito por perto
    player.place(1650, 1272, Math.PI); Cam.x = 1650; Cam.y = 1272; canvas.style.filter = 'blur(7px) brightness(0.8) saturate(1.35)'; for (const c of Traffic.cars) { c.release && c.release(); c.dead = true; } Traffic.cars = [];
  });
  await p.waitForTimeout(1500);
  fs.mkdirSync(path.join(AQ, 'saida'), { recursive: true });
  for (const C of CORES) {
    await p.evaluate((C) => {
      const cfg = carCfg('brasa'); cfg.color = C.cor; Object.assign(carKit('brasa'), { finish: C.finish, neon: C.neon, low: true, spoiler: true, wheels: 'tala', tint: 2 });
      document.body.classList.add('capa'); Garage.sel = 'brasa'; Garage.tab = 'kit'; Garage.cat = 'neon'; Garage.preview = {}; Garage.previewColor = null; Screens.open('screen-garage'); Garage.render();
    }, C);
    await p.waitForTimeout(1800);
    const arq = path.join(AQ, 'saida', 'capa_garagem_' + C.nome + '.png');
    await p.screenshot({ path: arq });
    execFileSync('python3', ['-c', `from PIL import Image; Image.open('${arq}').convert('RGB').resize((1280, 720), Image.LANCZOS).save('${arq.replace('.png', '.jpg')}', quality=92)`]);
    fs.unlinkSync(arq); console.log('capa', C.nome);
  }
  fs.copyFileSync(path.join(AQ, 'saida', 'capa_garagem_' + CORES[0].nome + '.jpg'), path.join(AQ, 'saida', 'capa.jpg'));
  await b.close();
})();

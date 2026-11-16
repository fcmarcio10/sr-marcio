/* ============================ JOGO / LOOP PRINCIPAL ============================ */
const Game = {
  mode: 'menu', time: 0, autosaveT: 30, fpsT: 0, fpsN: 0,
  get state() { return this.mode === 'menu' ? 'menu' : (Screens.current && Screens.current !== 'screen-phone' ? 'paused' : 'playing'); }, // celular aberto não pausa
};
const NIGHT_START = 19 * 60 + 30, NIGHT_END = 29 * 60;

function startPlay() {
  AudioSys.init();
  Act.reset(); Events.reset(); CarLife.reset(); Som.on = false; Radio.stop(); Settings.radioOff = true; if (typeof saveSettings === "function") saveSettings(); // a rádio sempre começa desligada (liga no F)
  player = new Player(Profile.current);
  let pos = World.home;
  const sp = Profile.pos;
  if (sp && isFinite(sp.x) && isFinite(sp.y) && sp.x > 60 && sp.y > 60 && sp.x < WORLD_W - 60 && sp.y < WORLD_H - 60 && groundAt(sp.x, sp.y) !== SF.WATER) pos = sp;
  player.place(pos.x, pos.y, pos.a || 0);
  if (player.collide() > 0 || player.inWater()) { player.place(World.home.x, World.home.y, 0); }
  Game.mode = 'play';
  Screens.closeAll();
  Cam.x = player.x; Cam.y = player.y; Cam.zoom = screenZoomBase() * Settings.zoom / 100;
  forceGround = true;
  Traffic.fill(player.x, player.y);
  UI.region = null; UI.last = {};
  Game.autosaveT = 30;
  updateHudVisibility();
  Nevoa.carrega(); Historia.h(); if (Apresenta.on) Apresenta.encerra();
  Profile.welcomed = true; // sem áudio de boas-vindas (o tutorial do Seu Zé já fala)
}
// tela de carregamento entre o menu e o jogo, com dica
function withTransit(fn) {
  const el = $('transit'), fill = $('transit-fill'), txt = $('transit-text');
  if (!el) { fn(); return; }
  const MSG = ['Procurando a chave…', 'Ligando o motor…', 'Esquentando o óleo…', 'Ajustando o retrovisor…', 'Acordando a cidade…', 'Acendendo os postes…', 'Chamando o trânsito…', 'Bora rodar!'];
  // 3 dicas diferentes, uma a cada 2 segundos
  const tips = LOAD_TIPS.slice().sort(() => Math.random() - 0.5).slice(0, 3), tipEl = $('transit-tip');
  let tipI = 0; tipEl.innerHTML = '<b>DICA</b>' + tips[0]; tipEl.style.opacity = 1;
  txt.textContent = MSG[0]; fill.style.width = '0%';
  el.classList.remove('hidden', 'fade');
  Game.carregando = true; Game.posCarga = 0; // nada fala nem reage antes do fim do carregamento
  const t0 = performance.now(), D = 6600;
  setTimeout(fn, 40); // monta o jogo por trás da tela de carregamento
  const step = (now) => {
    const k = Math.min(1, (now - t0) / D);
    fill.style.width = (k * 100).toFixed(1) + '%';
    txt.textContent = MSG[Math.min(MSG.length - 1, Math.floor(k * MSG.length))];
    const ti = Math.min(tips.length - 1, Math.floor((now - t0) / 2200));
    if (ti !== tipI) { tipI = ti; tipEl.style.opacity = 0; setTimeout(() => { tipEl.innerHTML = '<b>DICA</b>' + tips[ti]; tipEl.style.opacity = 1; }, 220); }
    if (k < 1) requestAnimationFrame(step);
    else { el.classList.add('fade'); setTimeout(() => { el.classList.add('hidden'); Game.carregando = false; }, 460); }
  };
  requestAnimationFrame(step);
}
function newGame() { withTransit(newGameNow); }
// coisas que só acontecem depois que a tela de carregamento some (falas, avisos, tutorial)
const AposCarga = { fila: [] };
function aposCarregar(fn, s) { AposCarga.fila.push({ fn, s: s || 0 }); }
function carregou(seg) { return !Game.carregando && (Game.posCarga === undefined || Game.posCarga >= (seg || 0)); }
AposCarga.update = function (dt) {
  if (Game.carregando) return;
  if (Game.posCarga !== undefined) Game.posCarga += dt;
  const pc = Game.posCarga === undefined ? 1e9 : Game.posCarga;
  for (let i = this.fila.length - 1; i >= 0; i--) { const q = this.fila[i]; if (pc >= q.s) { this.fila.splice(i, 1); try { q.fn(); } catch (e) { console.error(e); } } }
};
function newGameNow() {
  Profile = newProfile();
  startPlay();
  saveGame();
  // as boas-vindas agora são a apresentação da cidade (câmera de cinema) no começo da história
  Profile.tut = 0; Tutorial.t = 0; Tutorial.d0 = Profile.distance || 0; Tutorial.shown = -1; Tutorial.rapido = false;
}
function continueGame() {
  const p = loadProfileFromStorage();
  if (!p) { AudioSys.error(); return; }
  withTransit(() => continueGameNow(p));
}
function continueGameNow(p) {
  Profile = p;
  startPlay();
  aposCarregar(() => toast('Bem-vindo de volta', 'R$ ' + fmtMoney(Profile.money) + ' na carteira · ' + carById(Profile.current).name, 'info'), 0.6);
}
function saveGame() {
  if (player && Game.mode === 'play') Profile.pos = { x: player.x, y: player.y, a: player.a };
  writeProfile();
}
function toMenu() {
  Game.mode = 'menu';
  player = null;
  Act.reset(); Events.reset(); CarLife.reset(); Som.on = false; Radio.stop();
  Screens.closeAll();
  Screens.open('screen-main');
  AudioSys.hornOn = false;
}
function resetVehicle() {
  if (!player) return;
  const ne = nearestEdge(player.x, player.y);
  const e = ne.e;
  const s = clamp(ne.s, e.clearA + 10, Math.max(e.clearA + 10, e.len - e.clearB - 10));
  const off = e.T.lanes[e.T.lanes.length - 1];
  const x = e.a.x + e.dx * s - e.dy * off, y = e.a.y + e.dy * s + e.dx * off;
  player.place(x, y, Math.atan2(e.dy, e.dx));
  Cam.x = x; Cam.y = y;
  toast('Veículo reposicionado', 'Você está na ' + e.name + '.', 'info');
}
function onWindowBlur() { if (Game.state === 'playing') Screens.open('screen-pause'); }
document.addEventListener('visibilitychange', () => { if (document.hidden) onWindowBlur(); });
window.addEventListener('beforeunload', () => { if (Game.mode === 'play') saveGame(); });

function handleKeys() {
  while (KeyPress.length) {
    const k = KeyPress.shift();
    if (Apresenta.on && (k === 'Escape' || k === 'Enter' || k === 'Space' || k === 'NumpadEnter')) { Apresenta.pula(); continue; }
    if (Apresenta.on && (k === 'KeyQ' || k === 'KeyE' || k === 'KeyR')) continue;
    if (k === 'Escape') {
      if (Game.mode === 'play' && !Screens.current) { Screens.open('screen-pause'); AudioSys.click(); }
      else if (Screens.current && Screens.current !== 'screen-main') Screens.back();
      continue;
    }
    // Q: abre o celular; apertando de novo guarda o celular e fecha o que estiver aberto (inclusive o mapa)
    if (k === 'KeyQ' && Game.mode === 'play' && (Screens.current === 'screen-phone' || Screens.current === 'screen-map')) { Screens.closeAll(); AudioSys.tone(900, 0.05, 'sine', 0.05, 'ui', 600); continue; }
    if (Game.state !== 'playing') continue;
    switch (k) {
      case 'KeyE': if (Act.prompt) Act.prompt.act(); break;
      case 'KeyY': Events.answerOffer(true); break;
      case 'KeyN': Events.answerOffer(false); break;
      case 'KeyQ': Phone.open('home'); break;
      case 'KeyH': player.lightsOff = !player.lightsOff; AudioSys.tone(player.lightsOff ? 600 : 900, 0.05, 'square', 0.05, 'ui'); toast(player.lightsOff ? 'Farol desligado' : 'Farol ligado', '', 'info'); break;
      case 'KeyB': Som.toggle(); break;
      case 'KeyF': Radio.toggle(); break;
      case 'KeyL': player.highBeam = !player.highBeam; AudioSys.tone(900, 0.04, 'square', 0.05, 'ui'); break;
      case 'KeyC': { // troca a altura da câmera: 1 → 2 → 3 → 1
        Settings.cam = String(Settings.cam % 3 + 1); Settings.zoom = CAM_LEVELS[Settings.cam]; saveSettings(); syncSettingsUI();
        AudioSys.tone(900, 0.04, 'square', 0.05, 'ui'); toast('Câmera: nível ' + Settings.cam, Settings.cam === '1' ? 'Mais perto do carro.' : Settings.cam === '3' ? 'Mais alto, vê mais a cidade.' : 'Altura do meio.', 'info'); break;
      }
      case 'KeyR': if (player.speed < 120) resetVehicle(); break;
    }
  }
}
function stepPlay(dt) {
  Game.time += dt;
  Profile.time += dt;
  if (Profile.time >= NIGHT_END) { Profile.nights = (Profile.nights || 0) + 1; Profile.time = NIGHT_START; toast('Uma nova noite começa', 'O relógio volta para as 19:30. A cidade nunca dorme.', 'info'); Finance.newDay(); }
  const locked = Act.race && Act.race.count > 0;
  const cine = Apresenta.on; // câmera apresentando um lugar: o carro fica freado
  const inp = cine ? { thr: false, brk: true, steer: 0, hb: false } : { thr: !locked && !!key.up(), brk: !!key.down(), steer: (key.right() ? 1 : 0) - (key.left() ? 1 : 0), hb: !!key.hb() };
  player.update(dt, inp);
  Traffic.update(dt, Game.time, player.x, player.y, Cam.view);
  Animals.update(dt, Cam.x, Cam.y);
  if (Settings.quality !== 'baixa') Peladas.update(dt, Cam.x, Cam.y);
  Particles.update(dt);
  updateActivities(dt);
  Events.update(dt);
  MissaoAjuda.update(dt); Nevoa.update(dt);
  CarLife.update(dt);
  Finance.update(dt);
  Som.update(dt);
  Socorro.update(dt);
  Achievements.check(dt);
  Historia.update(dt);
  Weather.updatePlayer(dt, player);
  Police.update(dt);
  if (CHEATS_ENABLED && Cheats.god && (Profile.damage > 0 || (Profile.zones && (Profile.zones.f || Profile.zones.r || Profile.zones.l || Profile.zones.rt)))) { Profile.damage = 0; Profile.zones = { f: 0, r: 0, l: 0, rt: 0, seed: ((Profile.zones && Profile.zones.seed) || 0) + 1 }; }
  const kmh = player.speed * 0.3; if (kmh > (Profile.topSpeed || 0)) Profile.topSpeed = kmh;
  if (player.drift > 0.45 && player.speed > 180) Profile.driftT = (Profile.driftT || 0) + dt;
}
function stepMenu(dt) {
  Game.time += dt;
  Traffic.update(dt, Game.time, Cam.x, Cam.y, Cam.view);
  Animals.update(dt, Cam.x, Cam.y);
  if (Settings.quality !== 'baixa') Peladas.update(dt, Cam.x, Cam.y);
  Particles.update(dt);
}
const STEP = 1 / 120;
let lastT = 0, accT = 0;
let fpsGate = 0;
function frame(now) {
  requestAnimationFrame(frame);
  // trava de FPS (30, 60 ou 120): pula o quadro que chegou antes da hora, sem mexer na física (ela usa o tempo real)
  const cap = +Settings.fpsCap || 0;
  if (cap) {
    const iv = 1000 / cap;
    if (now < fpsGate - 1) return;
    fpsGate = now - fpsGate > iv ? now + iv : fpsGate + iv;
  }
  const t0q = performance.now();
  let dt = lastT ? (now - lastT) / 1000 : 0.016;
  if (lastT && Game.state === 'playing') AutoRes.quadro(dt, frame.trab || 0, cap);
  lastT = now;
  dt = clamp(dt, 0, 0.1);
  handleKeys();
  const st = Game.state;
  if (st === 'playing' || st === 'menu') {
    accT += dt;
    let n = 0;
    while (accT >= STEP && n < 12) { if (st === 'playing') { if (!Game.carregando) stepPlay(STEP); } else stepMenu(STEP); accT -= STEP; n++; }
    if (n >= 12) accT = 0;
    updateCamera(dt);
    Apresenta.update(dt); // viagem da câmera até os lugares da missão
    updateFireflies(dt);
    Weather.update(dt); Agua.atualiza(dt);
  } else accT = 0;
  AposCarga.update(dt);
  Radio.update(dt);
  if (!Game.carregando) { Ambiente.update(dt); PedVoz.update(); } // sons de ambiente por região; voz do pedestre
  Atropelo.update(dt); Colecao.update(dt); // voz do pedestre abaixando com a distância; atropelamento
  AudioSys.hornOn = Game.state === 'playing' && !!key.horn();
  render();
  updateHUD(dt);
  Tutorial.update(dt);
  CamPrev.update(dt);
  if (Screens.current === 'screen-garage') drawGaragePreview(dt);
  if (Screens.current === 'screen-map' && bigMap) bigMap.draw();
  else if (Screens.current === 'screen-phone' && phoneMap && Phone.app === 'mapa') phoneMap.draw();
  if (AudioSys.ok) {
    const R = REGIONS[regionKeyAt(Cam.x, Cam.y)];
    const river = Math.max(clamp(1 - (Math.abs(Cam.x - riverCX(Cam.y)) - 160) / 650, 0, 1), clamp(1 - (SEA_Y - Cam.y) / 700, 0, 1) * 1.3); // rio e mar
    const p = player;
    AudioSys.update({
      active: Game.state === 'playing' && !Game.carregando && !!p, rpm: p ? p.rpm : 900, thr: p ? p.thr : 0, speed: p ? p.speed : 0, slip: p ? p.slip : 0,
      surfaceRough: p ? SURF[p.surface].rough : 0, paved: p ? (p.surface === SF.ROAD || p.surface === SF.PAVED || p.surface === SF.BRIDGE || p.surface === SF.SIDEWALK) : true, rural: R.rural, city: R.city, river, pitch: p ? p.car.pitch : 1, cyl: p ? (p.car.cyl || 4) : 4,
    });
    let md = Infinity;
    for (const s of World.shops) if (s.kind === 'bar' || s.kind === 'lanchonete' || s.kind === 'churrascaria' || s.kind === 'fazenda') md = Math.min(md, Math.hypot(s.x - Cam.x, s.y - Cam.y));
    for (const q of World.parties) md = Math.min(md, Math.hypot(q.x - Cam.x, q.y - Cam.y) + (q.bar ? 60 : 0));
    AudioSys.music(Game.state === 'screen' ? 0 : Math.pow(clamp(1 - (md - 90) / 650, 0, 1), 1.6) * 0.32);
  }
  if (Game.state === 'playing') {
    Game.autosaveT -= dt;
    if (Game.autosaveT <= 0) { Game.autosaveT = 30; saveGame(); }
  }
  Game.fpsT += dt; Game.fpsN++;
  if (Game.fpsT >= 0.5) {
    if (Settings.showFps) {
      const f = Math.round(Game.fpsN / Game.fpsT), alvo = cap === 30 ? 30 : 60, el = $('fps');
      el.textContent = f + ' FPS';
      el.classList.toggle('medio', f < alvo * 0.92 && f >= alvo * 0.6); el.classList.toggle('ruim', f < alvo * 0.6);
    }
    Game.fpsT = 0; Game.fpsN = 0;
  }
  frame.trab = performance.now() - t0q; // tempo gasto neste quadro (para a nitidez automática)
}

async function boot() {
  const prog = (f, t) => { $('load-fill').style.width = Math.round(f * 100) + '%'; $('load-text').textContent = t; };
  const tick = () => new Promise((r) => requestAnimationFrame(() => r()));
  loadSettings();
  const saved = loadProfileFromStorage();
  if (saved) { Profile = saved; hasSave = true; }
  resize();
  bindMenus();
  bindSettings();
  $('garage-main-btn').addEventListener('click', () => Garage.main());
  document.querySelector('#screen-garage .garage-side').addEventListener('click', (e) => Garage.click(e));
  $('phone-body').addEventListener('click', (e) => Phone.click(e));
  $('phone-close').addEventListener('click', () => { AudioSys.back(); Screens.back(); });
  // botões de baixo do celular: bolinha volta para o início, seta volta para a tela de antes
  $('phone-nav-home').addEventListener('click', () => { if (Phone.app !== 'home') { phoneTone(1000, 0.04, 0.04); Phone.go('home'); } });
  $('phone-nav-back').addEventListener('click', () => {
    const b = [...document.querySelectorAll('#phone-body .ph-back, #phone-body [data-pgback], #phone-body [data-frback]')].find((x) => x.offsetParent !== null);
    if (b) b.click(); else if (Phone.app !== 'home') Phone.go('home');
  });
  // tocar nos botões do celular não rouba o teclado do carro (dá para dirigir com ele aberto)
  document.querySelector('#screen-phone .phone').addEventListener('mousedown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
  $('hud-phone').addEventListener('click', () => { if (Game.state === 'playing') Phone.open('home'); });
  $('fps').classList.toggle('hidden', !Settings.showFps);
  prog(0.04, 'Preparando texturas…'); await tick();
  buildPatterns(); buildLightSprites();
  RNG = mulberry32(20261108);
  const steps = [
    [buildRoadGraph, 'Traçando ruas…'], [buildRiver, 'Enchendo o Rio Jururu…'], [buildRoadSurface, 'Asfaltando as avenidas…'],
    [buildCity, 'Erguendo bairros e comércios…'], [buildHighwayStrip, 'Abrindo a rodovia…'], [buildSerra, 'Subindo para Feio Rosa e Jardim Cara-Pintada…'], [buildRural, 'Plantando o interior…'], [buildLitoral, 'Molhando os pés na Orla de Camburiso…'],
    [buildRoadProps, 'Acendendo os postes…'], [buildActivitiesData, 'Espalhando segredos pela cidade…'],
  ];
  for (let i = 0; i < steps.length; i++) { prog(0.08 + i / steps.length * 0.72, steps[i][1]); await tick(); steps[i][0](); }
  alargaRuas(); empurraDaPista(); // ruas 10% mais largas (depois de montar tudo: a cidade não muda)
  pruneRoadTrees(); thinTrees(); addBuracos(); Colecao.monta();
  buildShadowSprites(); bakeLampShadows();
  prog(0.84, 'Desenhando o mapa…'); await tick();
  buildMapImage();
  Traffic.prepare();
  Animals.build();
  Peladas.build();
  RNG = mulberry32((Date.now() & 0xffffffff) >>> 0);
  Cam.x = 1756; Cam.y = 1500;
  Traffic.fill(Cam.x, Cam.y);
  prog(0.92, 'Ligando os faróis…'); await tick();
  Screens.open('screen-main');
  requestAnimationFrame(frame);
  await tick(); await tick();
  prog(0.97, 'Conferindo tudo…');
  await new Promise((r) => setTimeout(r, 500)); // meio segundo a mais para garantir que tudo assentou
  prog(1, 'Pronto.');
  $('loading').classList.add('fade');
  setTimeout(() => $('loading').remove(), 800);
  const unlock = () => { AudioSys.init(); };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}
boot().catch((err) => {
  console.error(err);
  const t = document.getElementById('load-text');
  if (t) t.textContent = 'Erro ao iniciar: ' + err.message;
});

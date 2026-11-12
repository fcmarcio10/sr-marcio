/* ============================ JOGO / LOOP PRINCIPAL ============================ */
const Game = {
  mode: 'menu', time: 0, autosaveT: 30, fpsT: 0, fpsN: 0,
  get state() { return this.mode === 'menu' ? 'menu' : (Screens.current ? 'paused' : 'playing'); },
};
const NIGHT_START = 19 * 60 + 30, NIGHT_END = 29 * 60;

function startPlay() {
  AudioSys.init();
  Act.reset(); Events.reset(); CarLife.reset(); Som.on = false;
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
  const t0 = performance.now(), D = 6600;
  setTimeout(fn, 40); // monta o jogo por trás da tela de carregamento
  const step = (now) => {
    const k = Math.min(1, (now - t0) / D);
    fill.style.width = (k * 100).toFixed(1) + '%';
    txt.textContent = MSG[Math.min(MSG.length - 1, Math.floor(k * MSG.length))];
    const ti = Math.min(tips.length - 1, Math.floor((now - t0) / 2200));
    if (ti !== tipI) { tipI = ti; tipEl.style.opacity = 0; setTimeout(() => { tipEl.innerHTML = '<b>DICA</b>' + tips[ti]; tipEl.style.opacity = 1; }, 220); }
    if (k < 1) requestAnimationFrame(step);
    else { el.classList.add('fade'); setTimeout(() => el.classList.add('hidden'), 460); }
  };
  requestAnimationFrame(step);
}
function newGame() { withTransit(newGameNow); }
function newGameNow() {
  Profile = newProfile();
  startPlay();
  saveGame();
  setTimeout(() => toast('Bem-vindo a São Gambiarra, ES', 'A noite é sua. Explore à vontade — pare nos comércios e aperte E para pegar entregas.', 'info'), 600);
  Profile.tut = 0; Tutorial.t = 0; Tutorial.d0 = Profile.distance || 0;
}
function continueGame() {
  const p = loadProfileFromStorage();
  if (!p) { AudioSys.error(); return; }
  withTransit(() => continueGameNow(p));
}
function continueGameNow(p) {
  Profile = p;
  startPlay();
  setTimeout(() => toast('Bem-vindo de volta', 'R$ ' + fmtMoney(Profile.money) + ' na carteira · ' + carById(Profile.current).name, 'info'), 500);
}
function saveGame() {
  if (player && Game.mode === 'play') Profile.pos = { x: player.x, y: player.y, a: player.a };
  writeProfile();
}
function toMenu() {
  Game.mode = 'menu';
  player = null;
  Act.reset(); Events.reset(); CarLife.reset(); Som.on = false;
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
      case 'KeyL': player.highBeam = !player.highBeam; AudioSys.tone(900, 0.04, 'square', 0.05, 'ui'); break;
      case 'KeyC': Cam.quick = Cam.quick === 1 ? 0.72 : 1; break;
      case 'KeyR': if (player.speed < 120) resetVehicle(); break;
    }
  }
}
function stepPlay(dt) {
  Game.time += dt;
  Profile.time += dt;
  if (Profile.time >= NIGHT_END) { Profile.nights = (Profile.nights || 0) + 1; Profile.time = NIGHT_START; toast('Uma nova noite começa', 'O relógio volta para as 19:30. A cidade nunca dorme.', 'info'); Finance.newDay(); }
  const locked = Act.race && Act.race.count > 0;
  const inp = { thr: !locked && !!key.up(), brk: !!key.down(), steer: (key.right() ? 1 : 0) - (key.left() ? 1 : 0), hb: !!key.hb() };
  player.update(dt, inp);
  Traffic.update(dt, Game.time, player.x, player.y, Cam.view);
  Animals.update(dt, Cam.x, Cam.y);
  if (Settings.quality !== 'baixa') Peladas.update(dt, Cam.x, Cam.y);
  Particles.update(dt);
  updateActivities(dt);
  Events.update(dt);
  CarLife.update(dt);
  Finance.update(dt);
  Som.update(dt);
  Socorro.update(dt);
  Achievements.check(dt);
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
function frame(now) {
  requestAnimationFrame(frame);
  let dt = lastT ? (now - lastT) / 1000 : 0.016;
  lastT = now;
  dt = clamp(dt, 0, 0.1);
  handleKeys();
  const st = Game.state;
  if (st === 'playing' || st === 'menu') {
    accT += dt;
    let n = 0;
    while (accT >= STEP && n < 12) { if (st === 'playing') stepPlay(STEP); else stepMenu(STEP); accT -= STEP; n++; }
    if (n >= 12) accT = 0;
    updateCamera(dt);
    updateFireflies(dt);
    Weather.update(dt);
  } else accT = 0;
  AudioSys.hornOn = Game.state === 'playing' && !!key.horn();
  render();
  updateHUD(dt);
  Tutorial.update(dt);
  if (Screens.current === 'screen-garage') drawGaragePreview(dt);
  if (Screens.current === 'screen-map' && bigMap) bigMap.draw();
  else if (Screens.current === 'screen-phone' && phoneMap && Phone.app === 'mapa') phoneMap.draw();
  if (AudioSys.ok) {
    const R = REGIONS[regionKeyAt(Cam.x, Cam.y)];
    const river = Math.max(clamp(1 - (Math.abs(Cam.x - riverCX(Cam.y)) - 160) / 650, 0, 1), clamp(1 - (SEA_Y - Cam.y) / 700, 0, 1) * 1.3); // rio e mar
    const p = player;
    AudioSys.update({
      active: Game.state === 'playing' && !!p, rpm: p ? p.rpm : 900, thr: p ? p.thr : 0, speed: p ? p.speed : 0, slip: p ? p.slip : 0,
      surfaceRough: p ? SURF[p.surface].rough : 0, rural: R.rural, city: R.city, river, pitch: p ? p.car.pitch : 1, cyl: p ? (p.car.cyl || 4) : 4,
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
    if (Settings.showFps) $('fps').textContent = Math.round(Game.fpsN / Game.fpsT) + ' FPS · ' + Traffic.cars.length + ' carros · ' + chunks.size + ' blocos';
    Game.fpsT = 0; Game.fpsN = 0;
  }
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
  pruneRoadTrees();
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

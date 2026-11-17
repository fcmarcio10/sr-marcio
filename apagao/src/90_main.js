/* Laço principal e estados do jogo. */
const Main = {
  last: 0, saveT: 0, menuT: 0, eN0: null, eW0: null,
  boot() {
    loadSettings();
    World.gen(G.seed);
    this.eN0 = World.eN.slice(); this.eW0 = World.eW.slice();
    Art.registerAll();
    const cv = $('cv');
    Render.init(cv); Input.init(cv); UI.init();
    Player.reset();
    G.state = 'menu'; G.time = 18.3 * 60;
    UI.show('menu');
    window.addEventListener('keydown', e => this.key(e));
    window.addEventListener('beforeunload', () => Save.write());
    document.addEventListener('visibilitychange', () => { if (document.hidden) { Save.write(); if (G.state === 'play') this.pause(); } });
    requestAnimationFrame(t => this.loop(t));
  },
  resetWorld() {
    const W = World;
    W.eN.set(this.eN0); W.eW.set(this.eW0);
    W.loot = {}; W.changed = {}; W.barr = new Set(); W.edgeHp = new Map(); W.used = {};
    for (const p of W.props) p.uses = 0;
    Render.WC = [[], []];
    Ground.items = []; Decals.list = []; FX.list = []; FX.fires = []; FX.proj = []; FX.flares = [];
    G.msgs = []; UI.toasts(); G.invOpen = false; G.mapOpen = false; G.sleeping = false; G.hurtFlash = 0; G.shake = 0;
    $('inv').hidden = true; $('map').hidden = true;
    Clock.hordeDone = false; Clock.hordeAt = 22.5 * 60;
  },
  start() {
    G.state = 'play'; UI.hideAll(); $('hud').hidden = false; UI.hotKey = '';
    Cam.x = Player.x; Cam.y = Player.y; this.saveT = 40;
  },
  newGame() {
    this.resetWorld();
    G.day = 1; G.time = 8 * 60; G.kills = 0; G.waterOff = false; G.now = 0;
    Player.reset(); Zombies.spawnAll();
    this.start();
    const it = $('intro'); it.hidden = false; requestAnimationFrame(() => it.classList.add('on'));
    setTimeout(() => { it.classList.remove('on'); setTimeout(() => { it.hidden = true; }, 1300); toast('Sua casa está trancada e vazia de zumbis. Reviste os móveis com E.'); }, 5200);
  },
  continueGame() {
    this.resetWorld(); Player.reset(); Zombies.spawnAll();
    if (!Save.load()) { this.newGame(); return; }
    this.start(); toast('Dia ' + G.day + '. Você continua vivo.');
  },
  pause() { if (G.state !== 'play') return; G.state = 'pause'; UI.closeInv(); UI.show('pause'); Save.write(); },
  resume() { G.state = 'play'; UI.hideAll(); this.last = performance.now(); },
  toMenu() { G.state = 'menu'; $('hud').hidden = true; UI.closeInv(); G.sleeping = false; G.time = 18.3 * 60; UI.show('menu'); },
  key(e) {
    AudioSys.init();
    if (G.state === 'play') {
      if (e.code === 'Escape') { if (G.invOpen) UI.closeInv(); else if (G.mapOpen) UI.toggleMap(); else this.pause(); }
      else if (e.code === 'Tab' || e.code === 'KeyI') { if (G.invOpen) UI.closeInv(); else if (!Player.sleeping) UI.openInv(null); }
      else if (e.code === 'KeyM') UI.toggleMap();
      else if (e.code === 'KeyE' && G.invOpen) UI.closeInv();
    } else if (G.state === 'pause' && e.code === 'Escape') { if (!$('pause').hidden) this.resume(); else UI.show('pause'); }
    else if (G.state === 'menu' && e.code === 'Escape') UI.show('menu');
  },
  loop(t) {
    requestAnimationFrame(tt => this.loop(tt));
    const dt = Math.min(0.05, (t - this.last) / 1000 || 0.016); this.last = t; G.dt = dt;
    this.step(dt);
  },
  step(dt) {
    const P = Player;
    [Input.wx, Input.wy] = Render.toWorld(Input.mx, Input.my + 14);
    if (G.state === 'play') {
      G.now += dt;
      if (Input.wheel && !G.invOpen) { Cam.zoom = clamp(Cam.zoom * (Input.wheel > 0 ? 0.9 : 1.1), 0.8, 2.6); }
      Clock.update(dt);
      P.update(dt);
      Zombies.update(dt);
      FX.update(dt);
      Interact.find();
      const lx = P.x + Math.cos(P.a) * 0.9, ly = P.y + Math.sin(P.a) * 0.9;
      Cam.x += (lx - Cam.x) * Math.min(1, dt * 6); Cam.y += (ly - Cam.y) * Math.min(1, dt * 6);
      this.saveT -= dt; if (this.saveT <= 0) { this.saveT = 45; Save.write(); }
    } else if (G.state === 'menu') {
      this.menuT += dt; G.now += dt;
      const cx = blockStart(2) + 14, cy = blockStart(2) + 16;
      Cam.x = cx + Math.cos(this.menuT * 0.05) * 16; Cam.y = cy + Math.sin(this.menuT * 0.05) * 16;
    } else if (G.state === 'dead') { G.now += dt; Zombies.update(dt); FX.update(dt); }
    G.shake *= Math.max(0, 1 - dt * 9); G.hurtFlash = Math.max(0, G.hurtFlash - dt * 2.2);
    Render.frame();
    AudioSys.update(dt);
    UI.update(dt);
    Input.endFrame();
  }
};
window.addEventListener('load', () => { const go = () => Main.boot(); if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('30px "BRND Anton"'), document.fonts.load('700 30px "BRND Cond"'), document.fonts.load('15px "BRND Sans"')]).then(go, go); else go(); });

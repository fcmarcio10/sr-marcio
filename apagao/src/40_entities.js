/* Jogador, zumbis, combate, barulho, itens no chão e efeitos. */
const NIGHT = () => G.time < 5.5 * 60 || G.time > 18.6 * 60;
const EKEY = (o, i) => o * MW * MH + i;

const Noise = {
  last: [],
  emit(x, y, r, who) {
    for (const z of Zombies.active) {
      if (z.dead || z === who) continue;
      const d = dist(x, y, z.x, z.y);
      if (d < r) z.hear(x, y, r);
    }
    this.last.push({ x, y, r, t: 0.6 }); if (this.last.length > 12) this.last.shift();
  }
};

const Ground = {
  items: [],
  drop(x, y, it) {
    let px = x, py = y;
    for (let k = 0; k < 8; k++) { const a = Math.random() * 6.28, d = 0.25 + Math.random() * 0.35; if (canStand(x + Math.cos(a) * d, y + Math.sin(a) * d, 0.15)) { px = x + Math.cos(a) * d; py = y + Math.sin(a) * d; break; } }
    this.items.push({ x: px, y: py, it });
  }
};
const Decals = { list: [], add(x, y, k, r) { this.list.push({ x, y, k, r: r || 1, a: Math.random() * 6.28, s: Math.random() }); if (this.list.length > 160) this.list.shift(); } };
const FX = {
  list: [], fires: [], proj: [], flares: [],
  add(o) { this.list.push(o); },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) { const f = this.list[i]; f.t -= dt; if (f.vx !== undefined) { f.x += f.vx * dt; f.y += f.vy * dt; f.z = Math.max(0, (f.z || 0) + (f.vz || 0) * dt); if (f.vz !== undefined) f.vz -= 9 * dt; } if (f.t <= 0) this.list.splice(i, 1); }
    for (let i = this.proj.length - 1; i >= 0; i--) {
      const p = this.proj[i]; p.t += dt;
      const k = Math.min(1, p.t / p.dur);
      const nx = lerp(p.x0, p.x1, k), ny = lerp(p.y0, p.y1, k);
      if (!canStand(nx, ny, 0.1) && k > 0.1) { p.x1 = p.x; p.y1 = p.y; p.t = p.dur; }
      else { p.x = nx; p.y = ny; }
      p.z = 1.3 + Math.sin(k * Math.PI) * 1.6 - k * 1.3;
      if (p.t >= p.dur) { this.proj.splice(i, 1); this.land(p); }
    }
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const f = this.fires[i]; f.t -= dt; f.tick -= dt;
      if (f.tick <= 0) {
        f.tick = 0.25;
        for (const z of Zombies.active) if (!z.dead && dist(z.x, z.y, f.x, f.y) < f.r) Zombies.damage(z, 5, 0, 0, true);
        if (dist(Player.x, Player.y, f.x, f.y) < f.r - 0.3) Player.hurt(2.5, null, true);
        if (Math.random() < 0.7) this.add({ k: 'smoke', x: f.x + rand(-1, 1), y: f.y + rand(-1, 1), z: 0.5, vx: 0, vy: 0, vz: 1.2, t: 1.2 });
      }
      if (f.t <= 0) { this.fires.splice(i, 1); Decals.add(f.x, f.y, 'burn', 1.6); }
    }
    for (let i = this.flares.length - 1; i >= 0; i--) {
      const f = this.flares[i]; f.t -= dt; f.tick -= dt;
      if (f.tick <= 0) {
        f.tick = f.k === 'rojao' ? 0.9 : 1.6;
        Noise.emit(f.x, f.y, f.k === 'rojao' ? 30 : 15);
        if (f.k === 'rojao') { AudioSys.bang(f.x, f.y); this.add({ k: 'flash', x: f.x, y: f.y, t: 0.12, r: 7, col: '#ffd9a0' }); for (let j = 0; j < 6; j++) this.add({ k: 'spark', x: f.x, y: f.y, z: 0.3, vx: rand(-3, 3), vy: rand(-3, 3), vz: rand(2, 5), t: 0.5, col: '#ffd060' }); }
      }
      if (f.t <= 0) this.flares.splice(i, 1);
    }
  },
  land(p) {
    if (p.k === 'molotov') { this.fires.push({ x: p.x, y: p.y, r: 1.7, t: 9, tick: 0 }); AudioSys.glass(p.x, p.y); AudioSys.whoosh(); Noise.emit(p.x, p.y, 9); }
    else if (p.k === 'rojao') this.flares.push({ k: 'rojao', x: p.x, y: p.y, t: 5.2, tick: 0.5 });
    else if (p.k === 'sinalizador') { this.flares.push({ k: 'flare', x: p.x, y: p.y, t: 38, tick: 0.2 }); AudioSys.hiss(); }
  }
};

/* ---------- jogador ---------- */
const Player = {
  reset() {
    Object.assign(this, { x: World.spawn.x, y: World.spawn.y, a: 0.8, hp: 100, hunger: 82, thirst: 78, energy: 92, stam: 100, bleed: 0, bleedT: 0, infected: false, infT: 0,
      inv: [], eq: { hand: null, body: null, head: null, bag: null }, hot: [null, null, null, null, null], walk: 0, mv: 0, atkCd: 0, sw: -1, swT: 0, swDur: 0.5, swHit: false, reload: 0,
      lightOn: false, sneak: false, hurtT: 0, stepT: 0, dead: false, sleeping: false, sleepT: 0, climb: null, vx: 0, vy: 0, moving: false, sprint: false,
      pal: { skin: '#b98a66', shirt: '#4d6a7a', pants: '#2f3a52', hair: '#241a12', shoe: '#2a2420' } });
    const st = [newItem('cabo', 1), newItem('agua', 1), newItem('pao', 2), newItem('atadura', 1)];
    for (const it of st) this.add(it);
    this.equip(this.inv[0]);
  },
  cap() { const b = this.eq.bag; return 12 + (b ? ITEMS[b.k].cap : 0); },
  slots() { const b = this.eq.bag; return 14 + (b ? ITEMS[b.k].slots : 0); },
  weight() { let w = 0; for (const it of this.inv) w += ITEMS[it.k].w * it.q; return w; },
  count(k) { let n = 0; for (const it of this.inv) if (it.k === k) n += it.q; return n; },
  has(k) { return this.inv.some(i => i.k === k); },
  add(it) {
    const d = ITEMS[it.k];
    if (d.stack > 1) for (const o of this.inv) if (o.k === it.k && o.q < d.stack) { const m = Math.min(d.stack - o.q, it.q); o.q += m; it.q -= m; if (it.q <= 0) return true; }
    if (this.inv.length >= this.slots()) return false;
    this.inv.push(it); return true;
  },
  take(k, q) {
    for (let i = this.inv.length - 1; i >= 0 && q > 0; i--) { const o = this.inv[i]; if (o.k !== k) continue; const m = Math.min(o.q, q); o.q -= m; q -= m; if (o.q <= 0) this.removeItem(o); }
    return q <= 0;
  },
  removeItem(it) {
    const i = this.inv.indexOf(it); if (i >= 0) this.inv.splice(i, 1);
    for (const s in this.eq) if (this.eq[s] === it) this.eq[s] = null;
    for (let h = 0; h < 5; h++) if (this.hot[h] === it) this.hot[h] = null;
  },
  equip(it) {
    const d = ITEMS[it.k];
    const slot = d.t === 'body' ? 'body' : d.t === 'head' ? 'head' : d.t === 'bag' ? 'bag' : 'hand';
    if (this.eq[slot] === it) { if (slot === 'bag' && this.inv.length > 14) { toast('Esvazie a mochila antes de tirar.'); return; } this.eq[slot] = null; return; }
    this.eq[slot] = it; this.reload = 0;
    if (slot === 'hand' && !this.hot.includes(it)) { const f = this.hot.indexOf(null); if (f >= 0) this.hot[f] = it; }
    AudioSys.click();
  },
  use(it) {
    const d = ITEMS[it.k];
    if (d.t === 'melee' || d.t === 'gun' || d.t === 'throw' || d.t === 'body' || d.t === 'head' || d.t === 'bag') return this.equip(it);
    if (d.t === 'food' || d.t === 'drink' || d.t === 'med') {
      if (d.cure && !this.infected && !d.hp) { toast('Você não está infectado. Melhor guardar.'); return; }
      if (d.bleed && !d.hp && this.bleed <= 0) { toast('Você não está sangrando.'); return; }
      if (d.hunger) this.hunger = clamp(this.hunger + d.hunger, 0, 100);
      if (d.thirst) this.thirst = clamp(this.thirst + d.thirst, 0, 100);
      if (d.energy) this.energy = clamp(this.energy + d.energy, 0, 100);
      if (d.hp) this.hp = clamp(this.hp + d.hp, 0, 100);
      if (d.bleed) { this.bleed = Math.max(0, this.bleed - d.bleed); }
      if (d.cure && this.infected) { this.infected = false; this.infT = 0; toast('A febre começou a baixar. A infecção cedeu.', 'ok'); }
      if (d.t === 'food') AudioSys.eat(); else if (d.t === 'drink' || d.thirst) AudioSys.drink(); else AudioSys.rip();
      it.q--; if (it.q <= 0) this.removeItem(it);
      if (d.gives) this.add(newItem(d.gives, 1));
      return;
    }
    if (it.k === 'pilhas') { const l = this.inv.find(i => i.k === 'lanterna'); if (!l) { toast('Você não tem lanterna.'); return; } l.c = 100; it.q--; if (it.q <= 0) this.removeItem(it); toast('Pilhas novas na lanterna.', 'ok'); AudioSys.click(); return; }
    if (it.k === 'fita') { const w = this.eq.hand; if (!w || ITEMS[w.k].t !== 'melee') { toast('Segure a arma que quer consertar.'); return; } const md = ITEMS[w.k].dur; if (w.d >= md) { toast('A arma está inteira.'); return; } w.d = Math.min(md, w.d + Math.round(md * 0.4)); it.q--; if (it.q <= 0) this.removeItem(it); toast('Arma remendada com fita.', 'ok'); AudioSys.rip(); return; }
    if (it.k === 'lanterna') { this.toggleLight(); return; }
    toast('Não dá para usar isso sozinho.');
  },
  drop(it, all) {
    const q = all ? it.q : 1;
    const o = Object.assign({}, it, { q });
    it.q -= q; if (it.q <= 0) this.removeItem(it);
    Ground.drop(this.x, this.y, o);
  },
  toggleLight() {
    const l = this.inv.find(i => i.k === 'lanterna');
    if (!l) { toast('Você não tem lanterna.'); return; }
    if (!this.lightOn && l.c <= 0) { toast('A lanterna está sem pilha.'); return; }
    this.lightOn = !this.lightOn; AudioSys.click();
  },
  wpnDef() { const h = this.eq.hand; return h ? ITEMS[h.k] : null; },
  hurt(d, z, fire) {
    if (this.dead) return;
    let def = 0;
    if (this.eq.body) def += ITEMS[this.eq.body.k].def; if (this.eq.head) def += ITEMS[this.eq.head.k].def;
    this.hp -= d * (1 - def);
    this.hurtT = 0.35; G.hurtFlash = 1; G.shake = Math.max(G.shake, 5);
    if (this.sleeping) { this.sleeping = false; G.sleeping = false; toast('Você acordou sendo atacado!', 'bad'); }
    if (!fire) {
      AudioSys.hurt();
      if (Math.random() < 0.3 * (1 - def)) { this.bleed = Math.min(3, this.bleed + 1); this.bleedT = 90; toast('Você está sangrando. Use uma atadura.', 'bad'); }
      if (!this.infected && Math.random() < 0.07 * (1 - def * 1.2)) { this.infected = true; this.infT = 0; toast('Foi mordida funda. A ferida está feia: procure antibiótico.', 'bad'); }
    }
    if (this.hp <= 0) this.die();
  },
  die() { this.hp = 0; this.dead = true; this.deadT = 0; G.state = 'dead'; AudioSys.death(); Save.clear(); UI.showDeath(); },
  update(dt) {
    const I = Input, W = World;
    if (this.sleeping) return this.sleepUpdate(dt);
    if (this.climb) {
      const c = this.climb; c.t += dt / 0.55; const k = Math.min(1, c.t);
      this.x = lerp(c.x0, c.x1, k); this.y = lerp(c.y0, c.y1, k); this.mv = 1; this.walk += dt * 9;
      if (k >= 1) this.climb = null;
      return;
    }
    const free = !G.invOpen && !G.mapOpen;
    /* mira */
    if (free) this.a = Math.atan2(I.wy - this.y, I.wx - this.x);
    /* movimento */
    let ix = 0, iy = 0;
    if (free) { ix = (I.k('KeyD') || I.k('ArrowRight') ? 1 : 0) - (I.k('KeyA') || I.k('ArrowLeft') ? 1 : 0); iy = (I.k('KeyS') || I.k('ArrowDown') ? 1 : 0) - (I.k('KeyW') || I.k('ArrowUp') ? 1 : 0); }
    let dx = ix + iy, dy = -ix + iy; const m = Math.hypot(dx, dy);
    const over = this.weight() > this.cap();
    this.sprint = free && m > 0 && (I.k('ShiftLeft') || I.k('ShiftRight')) && this.stam > 2 && !this.sneak && !over && !this.tired;
    if (this.stam < 2) this.tired = true; if (this.stam > 25) this.tired = false;
    let sp = this.sneak ? 1.35 : this.sprint ? 4.7 : 2.75;
    if (over) sp *= 0.55; if (this.energy < 15) sp *= 0.8; if (this.hp < 30) sp *= 0.88; if (this.sw >= 0) sp *= 0.6;
    if (this.reload > 0) sp *= 0.75;
    if (m > 0) {
      dx /= m; dy /= m;
      /* andar de costas é mais lento */
      const back = Math.cos(angDiff(Math.atan2(dy, dx), this.a));
      if (back < -0.3) sp *= 0.75;
      const nx = this.x + dx * sp * dt, ny = this.y + dy * sp * dt;
      if (canStand(nx, this.y, 0.24)) this.x = nx;
      if (canStand(this.x, ny, 0.24)) this.y = ny;
      this.walk += dt * sp * 3.4; this.mv = Math.min(1, this.mv + dt * 8); this.moving = true;
      this.stepT -= dt * sp;
      if (this.stepT <= 0) {
        this.stepT = 1.5;
        const indoor = W.bld[idx(Math.floor(this.x), Math.floor(this.y))] > 0, gt = W.ground[idx(Math.floor(this.x), Math.floor(this.y))];
        AudioSys.step(indoor ? 2 : (gt === GR.GRASS || gt === GR.DRYG || gt === GR.DIRT || gt === GR.FIELD) ? 1 : 0, this.sneak ? 0.25 : this.sprint ? 1 : 0.6);
        Noise.emit(this.x, this.y, this.sneak ? 0.9 : this.sprint ? 7.5 : 3.2);
      }
    } else { this.mv = Math.max(0, this.mv - dt * 8); this.moving = false; }
    /* fôlego */
    if (this.sprint) { this.stam -= 13 * dt; this.energy -= 0.04 * dt; }
    else { let rg = 9; if (this.energy < 25) rg *= 0.55; if (this.hunger < 15) rg *= 0.7; if (over) rg *= 0.4; if (this.moving) rg *= 0.6; this.stam += rg * dt; }
    const maxSt = this.infected ? 70 : 100;
    this.stam = clamp(this.stam, 0, maxSt);
    /* teclas */
    if (free) for (const c of I.pressed) {
      if (c === 'KeyF') this.toggleLight();
      else if (c === 'KeyC' || c === 'ControlLeft') { this.sneak = !this.sneak; }
      else if (c === 'KeyR') this.startReload();
      else if (c === 'KeyQ') this.shove();
      else if (c === 'KeyE') Interact.act();
      else if (c === 'KeyB') Interact.barricade();
      else if (c.startsWith('Digit')) { const n = +c[5] - 1; if (n >= 0 && n < 5 && this.hot[n]) { const it = this.hot[n], d = ITEMS[it.k]; if (d.t === 'melee' || d.t === 'gun' || d.t === 'throw') { if (this.eq.hand !== it) this.equip(it); } else this.use(it); } }
    }
    /* ataque */
    this.atkCd -= dt;
    if (this.reload > 0) { this.reload -= dt; if (this.reload <= 0) this.finishReload(); }
    if (free && (I.clicked || I.pressed.includes('Space') || (I.down && this.wpnDef() && this.wpnDef().t === 'gun' && this.wpnDef().rate < 0.3))) this.attack();
    if (this.sw >= 0) {
      this.swT += dt; this.sw = this.swT / this.swDur;
      if (!this.swHit && this.sw >= 0.5) { this.swHit = true; this.meleeHit(); }
      if (this.sw >= 1) this.sw = -1;
    }
    /* lanterna */
    if (this.lightOn) { const l = this.inv.find(i => i.k === 'lanterna'); if (!l) this.lightOn = false; else { l.c -= dt * 0.14; if (l.c <= 0) { l.c = 0; this.lightOn = false; toast('A pilha da lanterna acabou.', 'bad'); } } }
    this.hurtT -= dt;
    this.needs(dt, 1);
  },
  needs(dt, rate) {
    const gm = dt * rate;                 // minutos de jogo
    const slow = this.sleeping ? 0.4 : 1;
    this.hunger = Math.max(0, this.hunger - 0.085 * gm * slow);
    this.thirst = Math.max(0, this.thirst - 0.125 * gm * slow);
    if (!this.sleeping) this.energy = Math.max(0, this.energy - 0.075 * gm);
    let dh = 0;
    if (this.hunger <= 0) dh -= 0.12 * gm; if (this.thirst <= 0) dh -= 0.2 * gm;
    if (this.bleed > 0) { dh -= 0.28 * this.bleed * dt; this.bleedT -= dt; if (this.bleedT <= 0) { this.bleed--; this.bleedT = 90; } if (Math.random() < dt * 0.8) Decals.add(this.x, this.y, 'blood', 0.3); }
    if (this.infected) { this.infT += gm; dh -= (0.03 + Math.min(0.06, this.infT / 60000)) * gm; }
    if (this.energy <= 0) dh -= 0.05 * gm;
    if (dh === 0 && this.hunger > 35 && this.thirst > 35) dh = (this.hunger > 70 && this.thirst > 70 ? 0.07 : 0.035) * gm * (this.sleeping ? 1.6 : 1);
    this.hp = clamp(this.hp + dh, 0, 100);
    if (this.hp <= 0 && !this.dead) this.die();
  },
  sleepUpdate(dt) {
    this.sleepT += dt;
    this.energy = Math.min(100, this.energy + 0.21 * dt * 45 * (this.sleepQ || 1));
    this.needs(dt, 45);
    let wake = this.energy >= 100 ? 'Você acordou descansado.' : null;
    for (const z of Zombies.active) if (!z.dead && dist(z.x, z.y, this.x, this.y) < 3.2 && canSee(z.x, z.y, this.x, this.y)) wake = 'Um barulho te acordou!';
    if (this.sleepT > 1 && (Input.pressed.length || Input.clicked)) wake = 'Você levantou.';
    if (wake) { this.sleeping = false; G.sleeping = false; toast(wake); }
  },
  startSleep(q) {
    if (this.energy > 82) { toast('Você não está com sono.'); return; }
    for (const z of Zombies.active) if (!z.dead && (z.st === 'chase' || dist(z.x, z.y, this.x, this.y) < 7)) { toast('Não dá para dormir com zumbi por perto.', 'bad'); return; }
    this.sleeping = true; G.sleeping = true; this.sleepT = 0; this.sleepQ = q; this.lightOn = false;
    Save.write();
  },
  attack() {
    if (this.atkCd > 0 || this.sw >= 0 || this.reload > 0) return;
    const h = this.eq.hand, d = h ? ITEMS[h.k] : null;
    if (!d) return this.shove();
    if (d.t === 'melee') {
      if (this.stam < d.stam * 0.6) { this.atkCd = 0.3; return; }
      const slow = this.stam < 20 || this.energy < 15 ? 1.35 : 1;
      this.stam -= d.stam; this.sw = 0; this.swT = 0; this.swDur = d.spd * slow; this.swHit = false; this.atkCd = d.spd * slow + 0.08; this.swKind = 'melee';
      AudioSys.swing();
    } else if (d.t === 'gun') {
      if (h.a <= 0) { AudioSys.dry(); this.atkCd = 0.3; if (this.count(d.ammo) > 0) this.startReload(); else toast('Sem munição.'); return; }
      h.a--; this.atkCd = d.rate; this.kick = 0.12;
      const n = d.pellets || 1, spread = (1 - d.prec) * 0.5 * (this.moving ? 1.6 : 1) * (this.sneak ? 0.75 : 1);
      const mx = this.x + Math.cos(this.a) * 0.5, my = this.y + Math.sin(this.a) * 0.5;
      for (let i = 0; i < n; i++) {
        const a = this.a + (Math.random() - 0.5) * 2 * spread;
        let ex = this.x + Math.cos(a) * d.rng, ey = this.y + Math.sin(a) * d.rng;
        const f = rayCast(this.x, this.y, ex, ey, edgeSee);
        let best = null, bt = f * d.rng;
        for (const z of Zombies.active) {
          if (z.dead) continue;
          const rx = z.x - this.x, ry = z.y - this.y, t = rx * Math.cos(a) + ry * Math.sin(a);
          if (t < 0.2 || t > bt) continue;
          const pd = Math.abs(-rx * Math.sin(a) + ry * Math.cos(a));
          if (pd < 0.3 * (z.sc || 1)) { bt = t; best = z; }
        }
        ex = this.x + Math.cos(a) * bt; ey = this.y + Math.sin(a) * bt;
        FX.add({ k: 'tracer', x: mx, y: my, x1: ex, y1: ey, t: 0.07 });
        if (best) { const crit = Math.random() < 0.22; Zombies.damage(best, d.dmg * rand(0.85, 1.15) * (crit ? 2 : 1) * (1 - 0.35 * bt / d.rng), Math.cos(a) * 0.5, Math.sin(a) * 0.5); }
        else FX.add({ k: 'spark', x: ex, y: ey, z: 1, vx: 0, vy: 0, vz: 1, t: 0.25, col: '#c9c0a8' });
      }
      FX.add({ k: 'flash', x: mx, y: my, t: 0.07, r: 6, col: '#ffe2a8' });
      AudioSys.shot(h.k); Noise.emit(this.x, this.y, d.noise);
      G.shake = Math.max(G.shake, d.pellets ? 6 : 3);
    } else if (d.t === 'throw') {
      const dd = Math.min(9.5, dist(this.x, this.y, Input.wx, Input.wy));
      const tx = this.x + Math.cos(this.a) * dd, ty = this.y + Math.sin(this.a) * dd;
      FX.proj.push({ k: h.k, x: this.x, y: this.y, x0: this.x, y0: this.y, x1: tx, y1: ty, z: 1.3, t: 0, dur: 0.35 + dd * 0.07 });
      this.sw = 0; this.swT = 0; this.swDur = 0.3; this.swHit = true; this.swKind = 'throw'; this.atkCd = 0.6;
      h.q--; if (h.q <= 0) this.removeItem(h);
      AudioSys.swing();
    }
  },
  meleeHit() {
    const h = this.eq.hand; if (!h) return;
    const d = ITEMS[h.k]; if (d.t !== 'melee') return;
    const c = [];
    for (const z of Zombies.active) {
      if (z.dead) continue;
      const dd = dist(z.x, z.y, this.x, this.y);
      if (dd > d.rng + 0.25 * (z.sc || 1)) continue;
      if (Math.abs(angDiff(Math.atan2(z.y - this.y, z.x - this.x), this.a)) > 0.95 && dd > 0.5) continue;
      if (rayCast(this.x, this.y, z.x, z.y, edgePass) < 1) continue;
      c.push([dd, z]);
    }
    c.sort((a, b) => a[0] - b[0]);
    const n = Math.min(c.length, d.multi || 1);
    for (let i = 0; i < n; i++) {
      const z = c[i][1];
      let dmg = d.dmg * rand(0.85, 1.15);
      let crit = Math.random() < 0.1;
      if (z.st !== 'chase' && Math.abs(angDiff(z.a, this.a)) < 1.2) { dmg *= 2.4; crit = true; }
      if (crit && dmg < d.dmg * 2) dmg *= 1.8;
      if (this.stam < 15) dmg *= 0.7;
      Zombies.damage(z, dmg, Math.cos(this.a) * (0.25 + d.dmg * 0.012), Math.sin(this.a) * (0.25 + d.dmg * 0.012));
      z.stun = Math.max(z.stun, 0.3 + d.spd * 0.3);
      if (crit) FX.add({ k: 'crit', x: z.x, y: z.y, t: 0.5 });
    }
    if (n > 0) {
      AudioSys.hit(d.dmg > 22); Noise.emit(this.x, this.y, h.k === 'frigideira' ? 8 : 4.5); G.shake = Math.max(G.shake, 2.5);
      h.d -= 1;
      if (h.d <= 0) { toast(d.n + ' quebrou!', 'bad'); AudioSys.breakS(); this.removeItem(h); }
    } else {
      /* acertou janela? */
      const tx = Math.floor(this.x + Math.cos(this.a) * 0.9), ty = Math.floor(this.y + Math.sin(this.a) * 0.9), cx = Math.floor(this.x), cy = Math.floor(this.y);
      if ((tx !== cx) !== (ty !== cy)) {
        const o = tx !== cx ? 1 : 0, i = tx !== cx ? idx(Math.max(cx, tx), cy) : idx(cx, Math.max(cy, ty));
        const arr = o ? World.eW : World.eN;
        if (arr[i] === E.WIN) { arr[i] = E.WOPEN; AudioSys.glass(this.x, this.y); Noise.emit(this.x, this.y, 13); }
      }
    }
  },
  shove() {
    if (this.atkCd > 0 || this.stam < 6) return;
    this.atkCd = 0.55; this.stam -= 6; this.sw = 0; this.swT = 0; this.swDur = 0.3; this.swHit = true; this.swKind = 'shove';
    AudioSys.swing();
    let any = false;
    for (const z of Zombies.active) {
      if (z.dead) continue;
      const dd = dist(z.x, z.y, this.x, this.y);
      if (dd > 1.15 || Math.abs(angDiff(Math.atan2(z.y - this.y, z.x - this.x), this.a)) > 1.1) continue;
      if (rayCast(this.x, this.y, z.x, z.y, edgePass) < 1) continue;
      const heavy = z.type === 'bruto' ? 0.35 : 1;
      Zombies.damage(z, 3, Math.cos(this.a) * 1.6 * heavy, Math.sin(this.a) * 1.6 * heavy);
      z.stun = Math.max(z.stun, 0.7 * heavy);
      if (Math.random() < 0.3 * heavy && !z.dead) z.down = 1.8;
      any = true;
    }
    if (any) { AudioSys.hit(false); Noise.emit(this.x, this.y, 3); }
  },
  startReload() {
    const h = this.eq.hand; if (!h) return; const d = ITEMS[h.k];
    if (d.t !== 'gun' || this.reload > 0 || h.a >= d.mag) return;
    if (this.count(d.ammo) <= 0) { toast('Sem ' + ITEMS[d.ammo].n.toLowerCase() + '.'); return; }
    this.reload = d.reload; AudioSys.reload();
  },
  finishReload() {
    const h = this.eq.hand; if (!h) return; const d = ITEMS[h.k]; if (d.t !== 'gun') return;
    const n = Math.min(d.mag - h.a, this.count(d.ammo));
    this.take(d.ammo, n); h.a += n; AudioSys.click();
  }
};

/* ---------- interação (E) ---------- */
const Interact = {
  cur: null,
  find() {
    const P = Player, W = World; let best = null, bs = 1e9;
    const consider = (o, d, bonus) => { const s = d - (bonus || 0); if (s < bs) { bs = s; best = o; } };
    for (const gi of Ground.items) { const d = dist(gi.x, gi.y, P.x, P.y); if (d < 1.15) consider({ kind: 'item', gi, x: gi.x, y: gi.y, label: 'Pegar ' + ITEMS[gi.it.k].n + (gi.it.q > 1 ? ' (' + gi.it.q + ')' : '') }, d, 0.5); }
    const cx = Math.floor(P.x), cy = Math.floor(P.y), fx = Math.cos(P.a), fy = Math.sin(P.a);
    const seen = new Set();
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
      const tx = cx + i, ty = cy + j; if (!inMap(tx, ty)) continue;
      const pi = W.propAt[idx(tx, ty)]; if (pi < 0 || seen.has(pi)) continue; seen.add(pi);
      const p = W.props[pi], d0 = PROPS[p.t];
      if (!p.tbl && !d0.inter) continue;
      const nx = clamp(P.x, p.x, p.x + p.w), ny = clamp(P.y, p.y, p.y + p.h), d = dist(nx, ny, P.x, P.y);
      if (d > 0.95) continue;
      if (rayCast(P.x, P.y, lerp(P.x, nx, 0.9), lerp(P.y, ny, 0.9), edgePass) < 1) continue;
      const face = ((nx - P.x) * fx + (ny - P.y) * fy) > -0.1 ? 0.3 : 0;
      let label = p.tbl ? 'Revistar ' + (d0.n || 'recipiente') : d0.inter === 'bed' ? 'Dormir (' + d0.n + ')' : d0.inter === 'sink' ? (G.waterOff ? 'Pia (sem água)' : 'Beber água da pia') : 'Beber do ' + d0.n;
      if (d0.inter === 'filter' && (p.uses || 0) >= 3) label = 'Filtro de barro (vazio)';
      consider({ kind: 'prop', p, x: p.x + p.w / 2, y: p.y + p.h / 2, label }, d, face);
    }
    const edge = (o, i, mx, my) => {
      const t = o ? W.eW[i] : W.eN[i];
      if (t !== E.DOOR && t !== E.DOPEN && t !== E.GATE && t !== E.GOPEN && t !== E.WIN && t !== E.WOPEN) return;
      const d = dist(mx, my, P.x, P.y); if (d > 1.0) return;
      const face = ((mx - P.x) * fx + (my - P.y) * fy) > 0 ? 0.45 : 0;
      const barr = W.barr && W.barr.has(EKEY(o, i));
      const label = t === E.DOOR ? (barr ? 'Tirar as tábuas da porta' : 'Abrir porta') : t === E.DOPEN ? 'Fechar porta' : t === E.GATE ? 'Abrir portão' : t === E.GOPEN ? 'Fechar portão' : 'Pular a janela';
      consider({ kind: 'edge', o, i, t, x: mx, y: my, label, barr, canBarr: t === E.DOOR && !barr }, d + 0.15, face);
    };
    for (const [ex, ey] of [[cx, cy], [cx, cy + 1], [cx - 1, cy], [cx + 1, cy], [cx - 1, cy + 1], [cx + 1, cy + 1]]) if (inMap(ex, ey)) edge(0, idx(ex, ey), ex + 0.5, ey);
    for (const [ex, ey] of [[cx, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1], [cx + 1, cy - 1], [cx + 1, cy + 1]]) if (inMap(ex, ey)) edge(1, idx(ex, ey), ex, ey + 0.5);
    this.cur = best;
    return best;
  },
  act() {
    const c = this.cur, P = Player, W = World; if (!c) return;
    if (c.kind === 'item') {
      if (P.add(c.gi.it)) { Ground.items.splice(Ground.items.indexOf(c.gi), 1); AudioSys.pickup(); }
      else toast('Inventário cheio.');
    } else if (c.kind === 'prop') {
      const p = c.p, d = PROPS[p.t];
      if (p.tbl) { UI.openInv(p); AudioSys.open(); Noise.emit(P.x, P.y, 2); }
      else if (d.inter === 'bed') P.startSleep(p.t === 'sofa' ? 0.8 : 1);
      else if (d.inter === 'sink') {
        if (G.waterOff) { toast('A torneira só chia. A água da rua acabou.'); return; }
        P.thirst = clamp(P.thirst + 35, 0, 100); AudioSys.drink();
        const e = P.inv.filter(i => i.k === 'garrafa'); let n = 0;
        for (const g of e) { const q = g.q; P.removeItem(g); for (let k = 0; k < q; k++) { P.add(newItem('agua', 1)); n++; } }
        toast(n ? 'Você bebeu e encheu ' + n + (n > 1 ? ' garrafas.' : ' garrafa.') : 'Você bebeu água da torneira.', 'ok');
      } else if (d.inter === 'filter') {
        if ((p.uses || 0) >= 3) { toast('O filtro está seco.'); return; }
        p.uses = (p.uses || 0) + 1; P.thirst = clamp(P.thirst + 35, 0, 100); AudioSys.drink(); toast('Água fresca do filtro de barro.', 'ok');
        W.used = W.used || {}; W.used[p.id] = p.uses;
      }
    } else if (c.kind === 'edge') {
      const arr = c.o ? W.eW : W.eN, i = c.i, t = arr[i], key = EKEY(c.o, i);
      const x = i % MW, y = (i - x) / MW;
      if (t === E.DOOR) {
        if (c.barr) { W.barr.delete(key); W.edgeHp.delete(key); P.add(newItem('tabua', 1)) || Ground.drop(P.x, P.y, newItem('tabua', 1)); toast('Você tirou as tábuas.'); AudioSys.thump(P.x, P.y); Noise.emit(P.x, P.y, 6); return; }
        arr[i] = E.DOPEN; AudioSys.door(true); Noise.emit(P.x, P.y, 3.5);
      } else if (t === E.DOPEN) {
        for (const z of Zombies.active) if (!z.dead && dist(z.x, z.y, c.x, c.y) < 0.6) { toast('Tem um deles na porta!', 'bad'); return; }
        if (dist(P.x, P.y, c.x, c.y) < 0.28) return;
        arr[i] = E.DOOR; AudioSys.door(false); Noise.emit(P.x, P.y, 3);
      } else if (t === E.GATE) { arr[i] = E.GOPEN; AudioSys.gate(); Noise.emit(P.x, P.y, 6); }
      else if (t === E.GOPEN) { arr[i] = E.GATE; AudioSys.gate(); Noise.emit(P.x, P.y, 6); }
      else if (t === E.WIN || t === E.WOPEN) {
        if (t === E.WIN) { arr[i] = E.WOPEN; AudioSys.door(true); Noise.emit(P.x, P.y, 4); }
        let tx, ty;
        if (c.o === 0) { tx = x + 0.5; ty = P.y < y ? y + 0.5 : y - 0.5; } else { ty = y + 0.5; tx = P.x < x ? x + 0.5 : x - 0.5; }
        if (!canStand(tx, ty, 0.24)) { toast('Tem algo bloqueando do outro lado.'); return; }
        P.climb = { x0: P.x, y0: P.y, x1: tx, y1: ty, t: 0 };
      }
      W.changed = W.changed || {}; W.changed[key] = arr[i];
    }
  },
  barricade() {
    const c = this.cur, P = Player, W = World;
    if (!c || c.kind !== 'edge' || !c.canBarr) return;
    if (!P.has('martelo')) { toast('Precisa de um martelo.'); return; }
    if (P.count('tabua') < 1 || P.count('pregos') < 4) { toast('Precisa de 1 tábua e 4 pregos.'); return; }
    P.take('tabua', 1); P.take('pregos', 4);
    W.barr = W.barr || new Set(); const key = EKEY(c.o, c.i);
    W.barr.add(key); W.edgeHp.set(key, 190);
    toast('Porta reforçada com tábuas.', 'ok'); AudioSys.thump(P.x, P.y); Noise.emit(P.x, P.y, 9);
  }
};

/* ---------- zumbis ---------- */
const ZT = {
  comum:    { hp: 50, sp: 1.4, dmg: 8, sc: 1 },
  lerdo:    { hp: 42, sp: 0.85, dmg: 7, sc: 1, drag: 1 },
  corredor: { hp: 34, sp: 3.5, dmg: 7, sc: 0.96, runner: 1 },
  bruto:    { hp: 150, sp: 1.05, dmg: 17, sc: 1.2, fat: 1.35 },
  gritador: { hp: 44, sp: 1.6, dmg: 6, sc: 1 }
};
const Zombies = {
  list: [], active: [], corpses: [], grid: new Map(), budget: 0, nid: 1,
  pickType() {
    const d = G.day, r = Math.random() * 100;
    const run = Math.min(22, 7 + d * 1.5), br = Math.min(14, 5 + d), gr = 6;
    return r < run ? 'corredor' : r < run + br ? 'bruto' : r < run + br + gr ? 'gritador' : r < run + br + gr + 22 ? 'lerdo' : 'comum';
  },
  make(x, y, type) {
    type = type || this.pickType();
    const T = ZT[type], s = Math.floor(Math.random() * 1e6);
    const z = { id: this.nid++, x, y, a: Math.random() * 6.28, type, hp: T.hp * rand(0.85, 1.15), st: 'idle', stT: rand(1, 6), tx: x, ty: y, hx: x, hy: y, path: null, pi: 0, pathT: 0, dirT: 0, direct: false,
      seeT: -99, lx: x, ly: y, atkCd: 0, wind: 0, stun: 0, kx: 0, ky: 0, down: 0, vis: 0, walk: Math.random() * 6, mv: 0, t: Math.random() * 0.4, bashT: 0, dead: false, fall: 0, sc: T.sc, groanT: rand(2, 12), stuck: 0, screamT: 0, s,
      pal: { skin: PAL_ZSKIN[s % 5], shirt: type === 'gritador' ? '#8a8478' : PAL_SHIRT[s % 10], pants: PAL_PANTS[(s >> 3) % 5], hair: PAL_HAIR[(s >> 5) % 5], shoe: '#231d18' },
      hear(nx, ny, r) { if (this.st === 'chase' || this.dead) return; this.st = 'invest'; this.tx = nx + rand(-1.2, 1.2); this.ty = ny + rand(-1.2, 1.2); this.stT = 14; this.path = null; this.pathT = 0; } };
    if (type === 'bruto') z.pal.shirt = ['#5a4a3a', '#3a4a5a', '#6a5a3a'][s % 3];
    this.list.push(z);
    return z;
  },
  spawnAll() {
    this.list.length = 0; this.corpses.length = 0;
    for (const s of World.zspawn) this.make(s.x, s.y);
  },
  damage(z, d, kx, ky, silent) {
    if (z.dead) return;
    z.hp -= d;
    const res = z.type === 'bruto' ? 0.4 : 1;
    z.kx += kx * res * 4; z.ky += ky * res * 4;
    if (!silent) { for (let i = 0; i < 3; i++) FX.add({ k: 'spark', x: z.x, y: z.y, z: 1.1, vx: kx * 3 + rand(-1, 1), vy: ky * 3 + rand(-1, 1), vz: rand(1, 3), t: 0.35, col: '#5a1f1a' }); }
    if (z.st !== 'chase') { z.st = 'chase'; z.lx = Player.x; z.ly = Player.y; z.seeT = G.now; }
    if (z.hp <= 0) this.kill(z, kx, ky);
  },
  kill(z, kx, ky) {
    z.dead = true; z.fall = 0.01; z.fa = Math.atan2(-(ky || Math.sin(z.a)), -(kx || Math.cos(z.a)));
    G.kills++; AudioSys.zdie(z.x, z.y);
    Decals.add(z.x, z.y, 'blood', 0.9);
    if (Math.random() < 0.07) Ground.drop(z.x, z.y, newItem(pick(['pano', 'pilhas', 'pacoca', 'atadura', 'm38', 'biscoito']), 1));
  },
  near(x, y, r, out) {
    out.length = 0;
    const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { const c = this.grid.get(j * MW + i); if (c) for (const z of c) out.push(z); }
    return out;
  },
  update(dt) {
    const P = Player, night = NIGHT();
    this.budget = 5;
    this.active.length = 0; this.grid.clear();
    for (let i = this.list.length - 1; i >= 0; i--) {
      const z = this.list[i];
      if (z.dead) {
        z.fall = Math.min(1, z.fall + dt * 2.6);
        if (z.fall >= 1) { this.list.splice(i, 1); this.corpses.push({ x: z.x, y: z.y, a: z.fa, pal: z.pal, sc: z.sc, fat: ZT[z.type].fat, t: 0 }); if (this.corpses.length > 45) this.corpses.shift(); continue; }
      }
      if (Math.abs(z.x - P.x) < 44 && Math.abs(z.y - P.y) < 44) {
        this.active.push(z);
        if (!z.dead) { const k = Math.floor(z.y) * MW + Math.floor(z.x); let c = this.grid.get(k); if (!c) this.grid.set(k, c = []); c.push(z); }
      } else z.vis = 0;
    }
    const tmp = [];
    for (const z of this.active) {
      if (z.dead) continue;
      const T = ZT[z.type];
      const d = dist(z.x, z.y, P.x, P.y);
      /* percepção */
      z.t -= dt;
      if (z.t <= 0) {
        z.t = 0.22 + Math.random() * 0.12;
        let seen = false, los = false;
        if (d < 26) los = canSee(z.x, z.y, P.x, P.y);
        z.los = los;
        if (!P.dead && los && !P.sleeping) {
          let vr = (night ? 6.5 : 11.5) * (P.sneak ? 0.6 : 1) * (P.lightOn && night ? 1.75 : 1) * (z.type === 'gritador' ? 1.2 : 1);
          if (d < vr) { const cone = Math.abs(angDiff(Math.atan2(P.y - z.y, P.x - z.x), z.a)) < 1.85 || d < 1.7; if (cone) seen = true; }
        } else if (P.sleeping && los && d < 3) seen = true;
        if (seen) {
          if (z.st !== 'chase') {
            z.st = 'chase'; z.wind = 0; z.path = null; z.pathT = 0;
            AudioSys.groan(z.x, z.y, true);
            if (z.type === 'gritador' && G.now - z.screamT > 18) { z.screamT = G.now; z.stun = 0.9; z.scream = 0.9; AudioSys.scream(z.x, z.y); Noise.emit(z.x, z.y, 22, z); }
          }
          z.lx = P.x; z.ly = P.y; z.seeT = G.now;
        } else if (z.st === 'chase' && G.now - z.seeT > 1.6) { z.st = 'search'; z.tx = z.lx; z.ty = z.ly; z.stT = 8 + Math.random() * 7; z.path = null; z.pathT = 0; }
      }
      const tv = z.los && d < 24 ? 1 : 0;
      z.vis += clamp(tv - z.vis, -dt * 3, dt * 5);
      z.groanT -= dt;
      if (z.groanT <= 0) { z.groanT = rand(5, 16); if (d < 16) AudioSys.groan(z.x, z.y, false); }
      /* empurrão e tontura */
      if (z.kx || z.ky) {
        const nx = z.x + z.kx * dt, ny = z.y + z.ky * dt;
        if (canStand(nx, z.y, 0.2)) z.x = nx; if (canStand(z.x, ny, 0.2)) z.y = ny;
        z.kx *= Math.max(0, 1 - dt * 9); z.ky *= Math.max(0, 1 - dt * 9);
        if (Math.abs(z.kx) + Math.abs(z.ky) < 0.05) z.kx = z.ky = 0;
      }
      if (z.scream > 0) z.scream -= dt;
      if (z.down > 0) { z.down -= dt; z.mv = 0; continue; }
      if (z.stun > 0) { z.stun -= dt; z.mv = Math.max(0, z.mv - dt * 6); continue; }
      z.atkCd -= dt;
      /* comportamento */
      let gx = z.x, gy = z.y, sp = 0, go = false;
      if (z.st === 'chase') {
        const live = G.now - z.seeT < 0.5;
        gx = live ? P.x : z.lx; gy = live ? P.y : z.ly; sp = T.sp * (night ? 1.12 : 1); go = true;
        if (z.wind > 0) {
          z.wind -= dt; go = false; z.a = Math.atan2(P.y - z.y, P.x - z.x);
          if (z.wind <= 0) { if (d < 1.1 && rayCast(z.x, z.y, P.x, P.y, edgePass) >= 1) P.hurt(T.dmg * rand(0.8, 1.2), z); z.atkCd = 1.0; }
        } else if (live && d < 0.82 && z.atkCd <= 0 && rayCast(z.x, z.y, P.x, P.y, edgePass) >= 1) { z.wind = 0.38; go = false; AudioSys.groan(z.x, z.y, true); }
        else if (live && d < 0.55) go = false;
      } else if (z.st === 'invest' || z.st === 'search') {
        gx = z.tx; gy = z.ty; sp = T.sp * (z.st === 'invest' ? 0.75 : 0.85); go = true;
        z.stT -= dt;
        if (dist(z.x, z.y, gx, gy) < 0.6) {
          go = false; z.a += dt * 1.2 * (z.s % 2 ? 1 : -1);
          if (z.st === 'search' && z.stT > 2 && Math.random() < dt * 0.6) { const a = Math.random() * 6.28, r = 2 + Math.random() * 4; const nx = z.lx + Math.cos(a) * r, ny = z.ly + Math.sin(a) * r; if (inMap(Math.floor(nx), Math.floor(ny)) && !World.solid[idx(Math.floor(nx), Math.floor(ny))]) { z.tx = nx; z.ty = ny; z.path = null; z.pathT = 0; } }
        }
        if (z.stT <= 0) { z.st = 'idle'; z.stT = rand(2, 6); z.hx = z.x; z.hy = z.y; }
      } else if (z.st === 'wander') {
        gx = z.tx; gy = z.ty; sp = T.sp * 0.38; go = true; z.stT -= dt;
        if (dist(z.x, z.y, gx, gy) < 0.5 || z.stT <= 0) { z.st = 'idle'; z.stT = rand(2, 9); }
      } else {
        z.stT -= dt;
        if (z.stT <= 0) {
          const a = Math.random() * 6.28, r = 1.5 + Math.random() * 5, nx = z.hx + Math.cos(a) * r, ny = z.hy + Math.sin(a) * r;
          if (inMap(Math.floor(nx), Math.floor(ny)) && walkClear(z.x, z.y, nx, ny, 0.22)) { z.st = 'wander'; z.tx = nx; z.ty = ny; z.stT = 10; } else z.stT = 1;
        }
      }
      if (go) this.navigate(z, gx, gy, sp, dt, T, tmp); else { z.mv = Math.max(0, z.mv - dt * 6); z.bash = 0; }
    }
  },
  navigate(z, gx, gy, sp, dt, T, tmp) {
    const W = World;
    z.dirT -= dt;
    if (z.dirT <= 0) { z.dirT = 0.25 + Math.random() * 0.2; z.direct = dist(z.x, z.y, gx, gy) < 14 && walkClear(z.x, z.y, gx, gy, 0.21); }
    let wx = gx, wy = gy;
    if (!z.direct) {
      z.pathT -= dt;
      if ((!z.path || z.pathT <= 0 || dist(gx, gy, z.pgx, z.pgy) > 2.5) && this.budget > 0) {
        this.budget--; z.path = Path.find(z.x, z.y, gx, gy, z.st === 'chase' ? 900 : 500); z.pi = z.path ? z.path.length : 0; z.pathT = 0.9 + Math.random() * 0.8; z.pgx = gx; z.pgy = gy;
      }
      if (z.path && z.pi >= 2) {
        wx = z.path[z.pi - 2]; wy = z.path[z.pi - 1];
        if (dist(z.x, z.y, wx, wy) < 0.32) { z.pi -= 2; if (z.pi >= 2) { wx = z.path[z.pi - 2]; wy = z.path[z.pi - 1]; } else { wx = gx; wy = gy; } }
      }
    }
    let dx = wx - z.x, dy = wy - z.y; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    /* não amontoar */
    let px = 0, py = 0;
    for (const o of this.near(z.x, z.y, 1, tmp)) { if (o === z) continue; const ox = z.x - o.x, oy = z.y - o.y, dd = Math.hypot(ox, oy); if (dd < 0.5 && dd > 0.001) { px += ox / dd * (0.5 - dd) * 5; py += oy / dd * (0.5 - dd) * 5; } }
    const ta = Math.atan2(dy, dx); z.a += clamp(angDiff(ta, z.a), -dt * 7, dt * 7);
    const vx = dx * sp + px, vy = dy * sp + py;
    const ox = z.x, oy = z.y;
    const nx = z.x + vx * dt, ny = z.y + vy * dt;
    if (canStand(nx, z.y, 0.21)) z.x = nx; if (canStand(z.x, ny, 0.21)) z.y = ny;
    const moved = Math.hypot(z.x - ox, z.y - oy);
    z.walk += moved * (T.runner ? 4.2 : 5); z.mv = Math.min(1, z.mv + dt * 6);
    z.bash = 0;
    if (moved < sp * dt * 0.35) {
      z.stuck += dt;
      /* porta, janela ou portão no caminho: arromba */
      const cx = Math.floor(z.x), cy = Math.floor(z.y);
      let o, i;
      if (Math.abs(dx) > Math.abs(dy)) { o = 1; i = idx(cx + (dx > 0 ? 1 : 0), cy); } else { o = 0; i = idx(cx, cy + (dy > 0 ? 1 : 0)); }
      let t = o ? W.eW[i] : W.eN[i];
      if (t !== E.DOOR && t !== E.WIN && t !== E.GATE) { if (o) { o = 0; i = idx(cx, cy + (dy > 0 ? 1 : 0)); } else { o = 1; i = idx(cx + (dx > 0 ? 1 : 0), cy); } t = o ? W.eW[i] : W.eN[i]; }
      if ((t === E.DOOR || t === E.WIN || t === E.GATE) && z.st !== 'wander') {
        z.bash = 1; z.bashT -= dt;
        if (z.bashT <= 0) {
          z.bashT = 0.85 + Math.random() * 0.3;
          const key = EKEY(o, i); let hp = W.edgeHp.get(key);
          if (hp === undefined) hp = t === E.DOOR ? 120 : t === E.WIN ? 20 : 170;
          hp -= z.type === 'bruto' ? 22 : 8; W.edgeHp.set(key, hp);
          AudioSys.thump(z.x, z.y); Noise.emit(z.x, z.y, 7, z);
          if (hp <= 0) {
            const nt = t === E.DOOR ? E.FRAME : t === E.WIN ? E.WOPEN : E.GOPEN;
            if (o) W.eW[i] = nt; else W.eN[i] = nt;
            W.edgeHp.delete(key); if (W.barr) W.barr.delete(key);
            W.changed = W.changed || {}; W.changed[key] = nt;
            if (t === E.WIN) AudioSys.glass(z.x, z.y); else AudioSys.breakS();
            if (dist(z.x, z.y, Player.x, Player.y) < 14 && t === E.DOOR) toast('Arrombaram uma porta!', 'bad');
          }
        }
      } else if (z.stuck > 1.2) { z.stuck = 0; z.path = null; z.pathT = 0; z.dirT = 0; if (z.st === 'wander' || z.st === 'invest') { z.st = 'idle'; z.stT = 1; } }
    } else z.stuck = 0;
  }
};

/* ---------- relógio, eventos e mundo vivo ---------- */
const Clock = {
  hordeAt: 22 * 60, hordeDone: false,
  update(dt) {
    const rate = G.sleeping ? 45 : 1;
    const before = G.time;
    G.time += dt * rate;
    if (G.time >= 1440) {
      G.time -= 1440; G.day++; this.hordeDone = false; this.hordeAt = (21 + Math.random() * 5) * 60 % 1440;
      toast('Dia ' + G.day + ' do apagão.');
      if (G.day >= 4 && !G.waterOff) { G.waterOff = true; toast('As torneiras secaram. A água da rua acabou.', 'bad'); }
    }
    if (before < 360 && G.time >= 360) this.respawn();
    if (!this.hordeDone && ((G.time >= this.hordeAt && this.hordeAt > 1200) || (this.hordeAt < 300 && G.time >= this.hordeAt && G.time < 300))) { this.hordeDone = true; this.horde(); }
  },
  horde() {
    const P = Player; let n = 6 + G.day * 2;
    for (const z of Zombies.list) {
      if (n <= 0) break;
      const d = dist(z.x, z.y, P.x, P.y);
      if (d > 18 && d < 75 && z.st !== 'chase' && !z.dead) { z.st = 'invest'; z.tx = P.x + rand(-7, 7); z.ty = P.y + rand(-7, 7); z.stT = 60; z.path = null; z.pathT = 0; n--; }
    }
    AudioSys.horde();
    toast('Você ouve muitos passos arrastados ao longe...', 'bad');
  },
  respawn() {
    const P = Player, W = World; let n = Math.min(60, 10 + G.day * 5);
    if (Zombies.list.length > 560) return;
    for (let k = 0; k < n * 12 && n > 0; k++) {
      const x = randi(3, MW - 4), y = randi(3, MH - 4), i = idx(x, y);
      if (W.solid[i] || W.bld[i] || dist(x, y, P.x, P.y) < 45) continue;
      if (Math.random() > ZONE_DENS[W.zone[i]] + 0.15) continue;
      Zombies.make(x + 0.5, y + 0.5); n--;
    }
  }
};

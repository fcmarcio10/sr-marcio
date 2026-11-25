/* Início do jogo e laço principal: relógio, desenho do cenário, painel e salvamento automático. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const $ = UI.$;
  let running = false, last = 0, lastSlow = 0, lastAuto = Date.now(), lastWall = 0;

  SL.loadGame = G => {
    SL.G = G; SL.Clock.resetHolds();
    if (SL.Live.cur) SL.Live.cur = null;
    SL.LiveUI.close();
    UI.closePhone(); $('#overlay-pc').hidden = true; $('#overlay-pc').innerHTML = ''; UI.wins.length = 0; document.body.classList.remove('pc-open', 'live-open');
    $('#stage-ui').innerHTML = ''; $('.notif-panel') && $('.notif-panel').remove(); $('#modals').innerHTML = '';
    SL.Viewers.reindex();
    UI.show('game');
    SL.HUD.build(); SL.HUD.bindStageOnce();
    SL.HomeScene.build();
    if (G.act && G.act.id === 'usar_pc') G.act = null;
    G.time.speed = SL.Clock.sp();
    SL.HUD.update(true);
    SL.bus.emit('loaded');
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    if (SL.settings.musicOn) { SL.audio.init(); SL.audio.music(true); }
  };
  SL.HUD.bindStageOnce = () => { if (SL.HUD._bound) return; SL.HUD._bound = true; SL.HUD.bindStage(); };

  SL.startNewGame = opts => {
    U.seed((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    const G = SL.State.newGame(opts);
    SL.G = G;
    SL.bus.emit('newgame');
    SL.Viewers.ensureNpcViewers();
    G.flags.noEvents = 1; SL.bus.emit('tick:day', 0); G.flags.noEvents = 0;
    // primeiras mensagens
    SL.Social.dm('mae', 'Filho(a), boa sorte nessa vida nova! Se precisar de alguma coisa, me liga.', [{ id: 'mae_ligar', label: 'Ligar para ela (20 min)' }, { id: 'mae_novidade', label: 'Contar as novidades' }], { silent: true });
    SL.Social.dm('duda', 'E aí, já montou o canal?? Quero ver sua primeira live, me avisa!', null, { silent: true });
    SL.Social.dm('rafa', 'Se aquele notebook der problema me chama. Mas sério, junta grana pra um PC de verdade kkkk', null, { silent: true });
    G.notifs.length = 0;
    const free = SL.Save.list().find(s => s.slot !== 'auto' && s.empty);
    G.slot = free ? free.slot : '1';
    SL.loadGame(G);
    SL.Save.write(G.slot);
    SL.notify({ cat: 'sistema', icon: 'home', title: 'Bem-vindo(a) à sua nova casa', text: 'Comece explorando: clique nos objetos para usar.' });
    UI.modal({ title: 'Bem-vindo(a) a Streamer Life', icon: 'pulso', hold: true, wide: true, html: `<p>Você acabou de se mudar para um apartamento simples na Vila Esperança, com um notebook velho emprestado e ${U.money0(G.money)} na conta. O sonho: viver de internet.</p>
      <div class="grid2"><div class="card flat col gap4"><b class="small">${SL.icon('home', 15)} Sua casa</b><span class="small muted">Clique num objeto: o personagem vai até ele e aparecem as opções. Ande com WASD ou clicando no chão.</span></div>
      <div class="card flat col gap4"><b class="small">${SL.icon('laptop', 15)} Computador</b><span class="small muted">Clique na mesa do escritório: OBS Studio para as lives na Twitch, YouTube e TikTok para gravar vídeos, Steam, Instagram, Bank e mais. Dá para levantar do PC com a live no ar (sair de casa encerra a live).</span></div>
      <div class="card flat col gap4"><b class="small">${SL.icon('phone', 15)} Celular</b><span class="small muted">Tecla C ou botão no topo. Mensagens, redes, banco, mapa e comida, de qualquer lugar.</span></div>
      <div class="card flat col gap4"><b class="small">${SL.icon('heart', 15)} Necessidades</b><span class="small muted">Fome, sede e cansaço (as barrinhas no canto). Cansado demais, você fica com sono e rende menos.</span></div>
      <div class="card flat col gap4"><b class="small">${SL.icon('money', 15)} Dinheiro</b><span class="small muted">A Twitch paga no fim de cada live. Aluguel, internet e energia chegam uma vez por mês (veja no Bank). Freelas e turnos no café ajudam no começo.</span></div>
      <div class="card flat col gap4"><b class="small">${SL.icon('clock', 15)} Tempo</b><span class="small muted">Não tem relógio: o tempo só passa quando você faz alguma coisa (live, editar, comer, dormir). Na live dá para pausar ou acelerar 3x.</span></div></div>
      <p class="small muted">A "Próxima meta" no topo da tela mostra o próximo passo e o prêmio em dinheiro. Não existe um caminho certo: você decide como viver.</p>`, buttons: [{ label: 'Começar', cls: 'primary', icon: 'play' }] });
  };
  SL.quitToTitle = () => {
    SL.LiveUI.close(); UI.closePhone(); $('#overlay-pc').hidden = true; $('#overlay-pc').innerHTML = ''; UI.wins.length = 0; document.body.classList.remove('pc-open', 'live-open');
    $('#modals').innerHTML = ''; SL.Clock.resetHolds(); SL.G = null; SL.Screens.title();
  };

  const fitCanvas = cv => { const dpr = Math.min(2, window.devicePixelRatio || 1); const w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); } const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); return { c, w, h }; };

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const G = SL.G;
    if (UI.screen !== 'game' || !G) return;
    G.playMs += dt * 1000;
    try { SL.Clock.advance(dt); } catch (e) { console.error(e); }
    if (!SL.G) return;
    const t = now / 1000;
    const pcOpen = UI.pcOpen(), liveOpen = !$('#overlay-live').hidden;
    if (G.loc.area === 'casa') SL.HomeScene.update(dt);
    if (!pcOpen && !liveOpen) {
      const cv = $('#cv-world'); const { c, w, h } = fitCanvas(cv);
      if (w && h) {
        if (G.loc.area === 'casa') SL.HomeScene.render(c, w, h, t);
        else if (G.loc.area === 'cidade') SL.City.renderMap(c, w, h, t, dt);
        else SL.City.renderPlace(c, w, h, t);
      }
    }
    if (SL.HUD.prompt) SL.HUD.prompt();
    if (SL.Live.cur && !liveOpen && !SL.LiveUI.minimized && !SL.Live.cur.away) SL.LiveUI.open();
    if (SL.HUD.liveMini) SL.HUD.liveMini(t, pcOpen);
    SL.LiveUI.frame(t);
    SL.HUD.update();
    if (now - lastSlow > 250) {
      lastSlow = now;
      UI.pcSaude(); UI.checkDecisions(); SL.HUD.placePanel(); SL.HUD.stageOverlay(); if (G.resumo) SL.HUD.resumoSemana();
      if (SL.audio.ambiente) { const a = G.act; SL.audio.ambiente({ chuva: !!G.flags.chuva, fora: G.loc.area !== 'casa', teclado: !!(a && ['editar', 'freela', 'estudar'].includes(a.id)), live: !!SL.Live.cur }); }
      if (pcOpen) {
        const ts = $('#overlay-pc .tb-speeds'); if (ts) { const ar = !!SL.Live.cur; if (ts.hidden === ar) ts.hidden = !ar; }
        const pr = SL.Life.progress(); UI.$$('#overlay-pc [data-actprog]').forEach(b => { b.style.width = (pr * 100).toFixed(1) + '%'; });
        const fim = G.act && G.act.dur ? Math.round(pr * 100) + '%' : ''; UI.$$('#overlay-pc [data-actfim]').forEach(b => { if (b.textContent !== fim) b.textContent = fim; });
        if (now - lastWall > 1000) { lastWall = now; const wcv = $('#overlay-pc canvas.wall'); if (wcv) SL.Preview.wallpaper(wcv, now); SL.UI.renderDesktopIcons(); }
      }
      if (UI.phoneOpen()) { const pb = $('#overlay-phone .ph-bat'); if (pb && !pb.textContent) pb.textContent = '87%'; }
    }
    const every = (SL.settings.autosaveMin || 3) * 60000;
    if (Date.now() - lastAuto > every) { lastAuto = Date.now(); SL.Save.auto(); }
  }

  // reações de interface a eventos dos sistemas
  SL.bus.on('loc', () => { UI.closeCtx(); if (SL.G && SL.G.loc.area === 'casa') SL.HomeScene.build(); SL.HUD.update(true); });
  SL.bus.on('home', () => { if (SL.G) SL.HomeScene.build(); });
  SL.bus.on('equip', () => { if (SL.G) SL.HomeScene.build(); });
  SL.bus.on('activity', a => { if (SL.G) SL.HUD.update(true); if (a && a.id === 'comer') SL.G.flags.ate = 1; if (SL.G) SL.Goals.check(); });
  SL.bus.on('saved', slot => { if (slot !== 'auto') return; const el = document.querySelector('.hud-clock .d'); if (el) { el.style.color = 'var(--ok)'; setTimeout(() => { el.style.color = ''; }, 900); } });

  // ferramentas para testes automáticos
  SL.debug = {
    skip: m => SL.Clock.skip(m),
    toHour: h => { let g = 0; while (SL.Clock.hour() !== h && g++ < 2000) SL.Clock.step(); },
    needs: o => SL.Life.mod(o),
    fill: () => Object.assign(SL.G.needs, { fome: 90, sede: 90, sono: 95, higiene: 90, energia: 95, estresse: 10, saude: 100, humor: 80 }),
    money: v => { SL.G.money = v; SL.bus.emit('money'); },
  };

  // boot
  const boot = () => {
    SL.Save.loadSettings(); SL.Screens.applySettings();
    SL.Screens.title();
    const unlock = () => { SL.audio.init(); if (SL.settings.musicOn) SL.audio.music(true); window.removeEventListener('pointerdown', unlock); };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('beforeunload', () => { if (SL.G && !(SL.Live && SL.Live.cur)) SL.Save.auto(true); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && SL.G) SL.Save.auto(); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.SL);

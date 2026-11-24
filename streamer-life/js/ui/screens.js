/* Telas: inicial, criação de personagem, carregar partida, configurações e menu de pausa. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const $ = UI.$, $$ = UI.$$;
  const SC = SL.Screens = {};
  let titleRaf = null;

  // ---------- inicial ----------
  SC.title = () => {
    UI.show('title');
    const el = $('#scr-title');
    const last = SL.Save.last(); const info = last ? SL.Save.readMeta(last) : null; const meta = info && info.meta;
    el.innerHTML = `<canvas class="bg"></canvas>
      <div class="title-col">
        <div class="logo"><span class="dev-tag"><i></i>build de desenvolvimento 0.4</span><div class="mark">${UI.ic('pulso', 30)}<span>SIMULADOR DE VIDA DIGITAL</span></div><h1>STREAMER<br><em>LIFE</em></h1><p>Comece do zero num quarto simples. Faça lives, publique vídeos, cuide da sua vida e construa uma carreira na internet.</p></div>
        <nav class="menu">
          <button class="mi ${meta ? 'main' : ''}" data-m="continuar" ${meta ? '' : 'disabled'}>${UI.ic('play', 20)}<div><b>Continuar</b><small>${meta ? U.esc(meta.name + ' · ' + meta.day) : 'Nenhuma partida salva'}</small></div></button>
          <button class="mi ${meta ? '' : 'main'}" data-m="novo">${UI.ic('plus', 20)}<div><b>Novo jogo</b><small>Criar personagem e canal</small></div></button>
          <button class="mi" data-m="carregar">${UI.ic('folder', 20)}<div><b>Carregar partida</b><small>3 espaços + salvamento automático</small></div></button>
          <button class="mi" data-m="config">${UI.ic('settings', 20)}<div><b>Configurações</b><small>Som, salvamento e acessibilidade</small></div></button>
        </nav>
        <div class="title-foot">Versão 0.4 · em desenvolvimento · Tudo fica salvo no seu navegador.</div>
      </div>
      <div class="title-side">${meta ? `<div class="last-card"><div class="upper">Última partida</div><div class="row" style="margin-top:8px"><canvas width="54" height="54" style="width:54px;height:54px;border-radius:50%"></canvas><div class="grow"><b>${U.esc(meta.channel)}</b><div class="muted small">${U.esc(meta.tier || '')}</div></div></div><div class="kv" style="margin-top:10px"><span>Seguidores</span><span>${U.num(meta.followers)}</span><span>Dinheiro</span><span>${U.money0(meta.money)}</span><span>Dia</span><span>${U.esc(meta.day.split(',')[0])}</span></div></div>` : ''}</div>`;
    if (meta) SL.Avatar.toCanvas($('.last-card canvas', el), meta.look, { scale: 0.95 });
    $$('[data-m]', el).forEach(b => b.onclick = () => {
      SL.audio.init(); SL.audio.play('click');
      const m = b.dataset.m;
      if (m === 'continuar') { const err = SL.Save.load(SL.Save.last()); if (err) UI.alert('Não foi possível continuar', err, 'alert'); }
      if (m === 'novo') SC.creator();
      if (m === 'carregar') SC.load();
      if (m === 'config') SC.settings('title');
    });
    const cv = $('canvas.bg', el);
    cancelAnimationFrame(titleRaf);
    const loop = t => { if (UI.screen !== 'title') return; SL.Preview.titleBg(cv, t); titleRaf = requestAnimationFrame(loop); };
    titleRaf = requestAnimationFrame(loop);
  };

  // ---------- criação ----------
  SC.creator = () => {
    UI.show('new');
    const st = { name: '', gender: 'n', look: SL.State.defaultLook(), channel: '', user: '', diff: 'normal', pref: 'todos', expr: 'feliz' };
    const el = $('#scr-new');
    const sw = (key, list) => `<div class="swatches">${list.map(c => `<button class="sw ${st.look[key] === c ? 'on' : ''}" style="background:${c}" data-sw="${key}" data-v="${c}" aria-label="cor ${c}"></button>`).join('')}</div>`;
    const draw = () => {
      el.innerHTML = `<div class="page"><div class="page-in">
        <div class="page-head"><button class="ibtn" data-back aria-label="Voltar">${UI.ic('left')}</button><h2>Criar personagem</h2></div>
        <div class="creator">
          <div class="preview"><canvas id="cr-prev" title="Clique para mudar a expressão"></canvas>
            <div class="channel-card"><canvas class="ava" id="cr-mini"></canvas><div class="grow"><b class="ellipsis" id="cr-ch">${U.esc(st.channel || 'SeuCanal')}</b><div class="muted small">@<span id="cr-us">${U.esc(st.user || 'usuario')}</span> · 0 seguidores</div></div><span class="tag">Desconhecido</span></div>
            <p class="small muted">Você começa num apartamento simples, com um notebook velho e pouco dinheiro. O resto é com você.</p>
          </div>
          <div class="col gap24">
            <div class="section"><h3>Quem é você</h3>
              <div class="grid2"><div class="field"><label for="f-name">Nome do personagem</label><input id="f-name" class="input" maxlength="20" value="${U.esc(st.name)}" placeholder="Ex.: Alex"></div>
              <div class="field"><label>Como o chat se refere a você</label><div class="row wrap">${[['m', 'Ele'], ['f', 'Ela'], ['n', 'Neutro']].map(([v, l]) => `<button class="chip ${st.gender === v ? 'on' : ''}" data-g="${v}">${l}</button>`).join('')}</div></div></div>
            </div>
            <div class="section"><h3>Aparência</h3>
              <div class="field"><label>Tom de pele</label>${sw('skin', D.skins)}</div>
              <div class="field"><label>Cabelo</label><div class="row wrap">${D.hairStyles.map((h, i) => `<button class="chip ${st.look.hair === i ? 'on' : ''}" data-hair="${i}">${h}</button>`).join('')}</div></div>
              <div class="field"><label>Cor do cabelo</label>${sw('hairColor', D.hairColors)}</div>
              <div class="grid2"><div class="field"><label>Camiseta</label>${sw('shirt', D.shirtColors)}</div><div class="field"><label>Calça</label>${sw('pants', ['#2a2f3d', '#3a4a6b', '#4a3a2a', '#5a5f6e', '#1d2230', '#7a2e3a'])}</div></div>
              <div class="field"><label>Acessório</label><div class="row wrap">${['Nenhum', 'Óculos', 'Boné', 'Fone'].map((a, i) => `<button class="chip ${st.look.acc === i ? 'on' : ''}" data-acc="${i}">${a}</button>`).join('')}<button class="chip ${st.look.beard ? 'on' : ''}" data-beard>Barba</button><button class="chip" data-rand>${UI.ic('refresh', 14)} Sortear visual</button></div></div>
            </div>
            <div class="section"><h3>Seu canal</h3>
              <div class="grid2"><div class="field"><label for="f-ch">Nome do canal</label><div class="row"><input id="f-ch" class="input" maxlength="22" value="${U.esc(st.channel)}" placeholder="Ex.: AlexAoVivo"><button class="ibtn" data-sug title="Sugerir">${UI.ic('sparkle')}</button></div></div>
              <div class="field"><label for="f-us">Usuário nas redes</label><input id="f-us" class="input" maxlength="20" value="${U.esc(st.user)}" placeholder="alex.aovivo"></div></div>
            </div>
            <div class="section"><h3>Dificuldade</h3><div class="diff">${Object.entries(SL.State.DIFF).map(([k, d]) => `<div class="dc ${st.diff === k ? 'on' : ''}" data-diff="${k}" tabindex="0"><b>${d.label}</b><div class="mono small ok">${U.money0(d.money)} no início</div><p>${d.desc}</p></div>`).join('')}</div></div>
            <div class="section"><h3>Romance (opcional)</h3><div class="row wrap">${[['todos', 'Todas as pessoas'], ['mulheres', 'Mulheres'], ['homens', 'Homens'], ['nenhum', 'Desligado']].map(([v, l]) => `<button class="chip ${st.pref === v ? 'on' : ''}" data-pref="${v}">${l}</button>`).join('')}</div><p class="small muted">Relacionamentos amorosos são opcionais e nunca obrigatórios para progredir.</p></div>
            <div class="row end"><button class="btn ghost" data-back>Voltar</button><button class="btn primary lg" data-go>${UI.ic('play', 16)} Começar a vida</button></div>
          </div>
        </div></div></div>`;
      paint();
      bind();
    };
    const paint = () => { SL.Avatar.toCanvas($('#cr-prev', el), st.look, { expr: st.expr }); SL.Avatar.toCanvas($('#cr-mini', el), st.look, { scale: 1 }); };
    const bind = () => {
      $$('[data-back]', el).forEach(b => b.onclick = () => SC.title());
      $('#f-name', el).oninput = e => { st.name = e.target.value; };
      $('#f-ch', el).oninput = e => { st.channel = e.target.value; $('#cr-ch', el).textContent = st.channel || 'SeuCanal'; };
      $('#f-us', el).oninput = e => { st.user = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''); e.target.value = st.user; $('#cr-us', el).textContent = st.user || 'usuario'; };
      $('[data-sug]', el).onclick = () => { st.channel = SL.State.suggestChannel(st.name); st.user = U.stripAccents((st.name || 'alex').toLowerCase()).replace(/[^a-z0-9]/g, '') + U.pick(['.aovivo', '_tv', 'play', '.live', 'oficial']); draw(); };
      $$('[data-g]', el).forEach(b => b.onclick = () => { st.gender = b.dataset.g; draw(); });
      $$('[data-sw]', el).forEach(b => b.onclick = () => { st.look[b.dataset.sw] = b.dataset.v; draw(); });
      $$('[data-hair]', el).forEach(b => b.onclick = () => { st.look.hair = +b.dataset.hair; draw(); });
      $$('[data-acc]', el).forEach(b => b.onclick = () => { st.look.acc = +b.dataset.acc; draw(); });
      $('[data-beard]', el).onclick = () => { st.look.beard = st.look.beard ? 0 : 1; draw(); };
      $('[data-rand]', el).onclick = () => { st.look = SL.Avatar.randomLook(); draw(); };
      $$('[data-diff]', el).forEach(b => b.onclick = () => { st.diff = b.dataset.diff; draw(); });
      $$('[data-pref]', el).forEach(b => b.onclick = () => { st.pref = b.dataset.pref; draw(); });
      $('#cr-prev', el).onclick = () => { const ex = ['feliz', 'rindo', 'surpreso', 'neutro', 'bravo', 'concentrado']; st.expr = ex[(ex.indexOf(st.expr) + 1) % ex.length]; paint(); };
      $('[data-go]', el).onclick = () => {
        const name = st.name.trim(), ch = st.channel.trim(), us = st.user.trim();
        if (name.length < 2) return UI.err('Escreva o nome do personagem (2 letras ou mais).');
        if (ch.length < 3) return UI.err('O nome do canal precisa de pelo menos 3 caracteres.');
        if (us.length < 3) return UI.err('O usuário precisa de pelo menos 3 caracteres (letras, números, ponto ou _).');
        SL.startNewGame({ name, gender: st.gender, look: st.look, channel: ch, user: us, diff: st.diff, pref: st.pref });
      };
    };
    draw();
  };

  // ---------- carregar ----------
  SC.load = from => {
    UI.show('load');
    const el = $('#scr-load');
    const list = SL.Save.list();
    const name = s => s === 'auto' ? 'Salvamento automático' : 'Espaço ' + s;
    el.innerHTML = `<div class="page"><div class="page-in">
      <div class="page-head"><button class="ibtn" data-back>${UI.ic('left')}</button><h2>Carregar partida</h2></div>
      <div class="slots">${list.map(s => `<div class="card slot">
        <div class="upper">${name(s.slot)}</div>
        ${s.empty ? '<div class="empty">Vazio</div>' : s.broken ? '<div class="empty bad">Arquivo corrompido</div>' : `<div class="top"><canvas data-look="${s.slot}"></canvas><div class="grow"><b>${U.esc(s.meta.channel)}</b><div class="muted small">${U.esc(s.meta.name)} · ${U.esc(s.meta.tier || '')}</div></div></div>
        <div class="kv"><span>Data no jogo</span><span>${U.esc(s.meta.day.split(' de ').slice(0, 2).join(' de '))}</span><span>Seguidores</span><span>${U.num(s.meta.followers)}</span><span>Dinheiro</span><span>${U.money0(s.meta.money)}</span><span>Salvo em</span><span>${new Date(s.savedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span></div>`}
        <div class="row">${s.empty || s.broken ? '' : `<button class="btn primary sm" data-load="${s.slot}">${UI.ic('play', 14)} Carregar</button>`}${s.empty ? '' : `<button class="btn danger sm" data-del="${s.slot}">${UI.ic('trash', 14)} Excluir</button>`}</div>
      </div>`).join('')}</div>
      <div class="card col"><h3>Importar salvamento</h3><p class="small muted">Use um arquivo exportado antes, ou cole o código do salvamento.</p>
        <div class="row wrap"><label class="btn sm">${UI.ic('upload', 14)} Escolher arquivo<input type="file" accept=".json,application/json" hidden id="imp-file"></label></div>
        <textarea class="textarea" id="imp-txt" placeholder="Ou cole aqui o código do salvamento"></textarea><div class="row end"><button class="btn sm" data-imp>Importar código</button></div></div>
    </div></div>`;
    $$('[data-look]', el).forEach(cv => { const s = list.find(x => x.slot === cv.dataset.look); SL.Avatar.toCanvas(cv, s.meta.look, { scale: 0.95 }); });
    $('[data-back]', el).onclick = () => from === 'game' ? UI.show('game') : SC.title();
    $$('[data-load]', el).forEach(b => b.onclick = () => { const err = SL.Save.load(b.dataset.load); if (err) UI.alert('Não foi possível carregar', err, 'alert'); });
    $$('[data-del]', el).forEach(b => b.onclick = () => UI.confirm('Excluir salvamento', 'Isso apaga ' + name(b.dataset.del).toLowerCase() + ' para sempre.', () => { SL.Save.del(b.dataset.del); SC.load(from); }, 'Excluir', true));
    $('#imp-file', el).onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { const err = SL.Save.importStr(String(r.result)); if (err) UI.alert('Importação falhou', err, 'alert'); }; r.readAsText(f); };
    $('[data-imp]', el).onclick = () => { const err = SL.Save.importStr($('#imp-txt', el).value.trim()); if (err) UI.alert('Importação falhou', err, 'alert'); };
  };

  // ---------- configurações ----------
  SC.settingsHTML = () => {
    const s = SL.settings;
    return `<div class="col gap16">
      <div class="field"><label for="s-vol">Volume dos efeitos: <b id="s-vol-v">${Math.round(s.volume * 100)}%</b></label><input type="range" id="s-vol" min="0" max="1" step="0.05" value="${s.volume}"></div>
      <label class="row"><input type="checkbox" id="s-mus" ${s.musicOn ? 'checked' : ''}> Música ambiente lo-fi</label>
      <div class="field"><label for="s-musv">Volume da música</label><input type="range" id="s-musv" min="0" max="1" step="0.05" value="${s.music}"></div>
      <label class="row"><input type="checkbox" id="s-auto" ${s.autosave !== false ? 'checked' : ''}> Salvamento automático (a cada dia no jogo e depois das lives)</label>
      <label class="row"><input type="checkbox" id="s-rm" ${s.reduceMotion ? 'checked' : ''}> Reduzir animações</label>
      <div class="field"><label>Tamanho do texto</label><div class="row">${[[0.9, 'Menor'], [1, 'Normal'], [1.12, 'Maior']].map(([v, l]) => `<button class="chip ${s.textScale === v ? 'on' : ''}" data-ts="${v}">${l}</button>`).join('')}</div></div>
      <div class="field"><label>Velocidade do chat na live <span class="tiny muted">(também depende de quantas pessoas estão assistindo)</span></label><div class="row">${[[3, 'Calma'], [6, 'Normal'], [12, 'Frenética']].map(([v, l]) => `<button class="chip ${s.chatCap === v ? 'on' : ''}" data-cc="${v}">${l}</button>`).join('')}</div></div>
    </div>`;
  };
  SC.bindSettings = root => {
    const s = SL.settings; const save = () => { SL.Save.saveSettings(); SC.applySettings(); };
    $('#s-vol', root).oninput = e => { s.volume = +e.target.value; $('#s-vol-v', root).textContent = Math.round(s.volume * 100) + '%'; save(); };
    $('#s-mus', root).onchange = e => { s.musicOn = e.target.checked; save(); SL.audio.init(); SL.audio.music(s.musicOn); };
    $('#s-musv', root).oninput = e => { s.music = +e.target.value; save(); };
    $('#s-auto', root).onchange = e => { s.autosave = e.target.checked; save(); };
    $('#s-rm', root).onchange = e => { s.reduceMotion = e.target.checked; save(); };
    $$('[data-ts]', root).forEach(b => b.onclick = () => { s.textScale = +b.dataset.ts; save(); $$('[data-ts]', root).forEach(x => x.classList.toggle('on', x === b)); });
    $$('[data-cc]', root).forEach(b => b.onclick = () => { s.chatCap = +b.dataset.cc; save(); $$('[data-cc]', root).forEach(x => x.classList.toggle('on', x === b)); });
  };
  SC.applySettings = () => {
    const s = SL.settings; document.documentElement.style.setProperty('--ts', s.textScale);
    document.body.classList.toggle('reduce-motion', !!s.reduceMotion); SL.audio.applyVolume();
  };
  SC.settings = from => {
    if (from === 'game') { const m = UI.modal({ title: 'Configurações', icon: 'settings', html: SC.settingsHTML(), buttons: [{ label: 'Pronto', cls: 'primary' }] }); SC.bindSettings(m.el); return; }
    UI.show('settings');
    const el = $('#scr-settings');
    el.innerHTML = `<div class="page"><div class="page-in" style="max-width:620px"><div class="page-head"><button class="ibtn" data-back>${UI.ic('left')}</button><h2>Configurações</h2></div><div class="card">${SC.settingsHTML()}</div></div></div>`;
    SC.bindSettings(el);
    $('[data-back]', el).onclick = () => SC.title();
  };

  // ---------- menu do jogo ----------
  SC.pauseMenu = () => {
    if (SL.Live && SL.Live.cur) return UI.err('Encerre a live para abrir o menu.');
    const G = SL.G;
    const pm = (k, ic, t, sub, cls) => `<button class="mi ${cls || ''}" data-pm="${k}">${UI.ic(ic, 20)}<div><b>${t}</b>${sub ? '<small>' + sub + '</small>' : ''}</div></button>`;
    const m = UI.modal({ title: 'Pausa', icon: 'pause', hold: true, cls: 'game pause-modal', html: `<nav class="menu wide">
      ${pm('voltar', 'play', 'Continuar', 'Voltar para o jogo', 'main')}
      <div class="upper" style="margin-top:4px">Salvar o jogo</div><div class="slots3">${['1', '2', '3'].map(s => `<button class="slot-b" data-save="${s}"><b>Espaço ${s}</b><small>${(SL.Save.readMeta(s) || {}).meta ? 'Substituir' : 'Vazio'}</small></button>`).join('')}</div>
      ${pm('carregar', 'folder', 'Carregar outra partida', '')}
      ${pm('config', 'settings', 'Configurações', 'Som, tela e salvamento')}
      ${pm('export', 'upload', 'Exportar salvamento', 'Código ou arquivo de segurança')}
      ${pm('sair', 'exit', 'Salvar e sair', 'Volta para o menu inicial', 'quit')}</nav>` });
    $$('[data-save]', m.el).forEach(b => b.onclick = () => { const err = SL.Save.write(b.dataset.save); m.close(); if (err) UI.alert('Não foi possível salvar', err, 'alert'); else UI.toast({ title: 'Jogo salvo', text: 'Espaço ' + b.dataset.save + ' · ' + SL.Clock.fmtStamp(G.time.t), icon: 'save', cat: 'sistema' }, 'success'); });
    $$('[data-pm]', m.el).forEach(b => b.onclick = () => {
      const a = b.dataset.pm; m.close();
      if (a === 'export') SC.exportDialog();
      if (a === 'carregar') SC.load('game');
      if (a === 'config') SC.settings('game');
      if (a === 'sair') { SL.Save.write(G.slot || '1'); SL.quitToTitle(); }
    });
  };
  SC.exportDialog = () => {
    const str = SL.Save.exportStr();
    const m = UI.modal({ title: 'Exportar salvamento', icon: 'upload', wide: true, html: `<p class="small muted">Guarde este código num lugar seguro. Para voltar, use "Importar" na tela de carregar partida.</p><textarea class="textarea mono" style="min-height:160px;font-size:11px" readonly id="exp-txt"></textarea>`, buttons: [(location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) && { label: 'Baixar arquivo', icon: 'save', keep: true, fn: () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([str], { type: 'application/json' })); a.download = 'streamer-life-' + SL.G.player.user + '.json'; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { UI.err('O navegador bloqueou o download. Copie o código.'); } } }, { label: 'Copiar código', cls: 'primary', keep: true, fn: () => { const t = $('#exp-txt', m.el); t.select(); (navigator.clipboard ? navigator.clipboard.writeText(str) : Promise.reject()).then(() => UI.toast({ title: 'Código copiado', icon: 'check', cat: 'sistema' }, null, true)).catch(() => { document.execCommand && document.execCommand('copy'); }); } }] });
    $('#exp-txt', m.el).value = str;
  };
})(window.SL);

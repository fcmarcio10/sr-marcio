/* Telas: inicial, criação de personagem, carregar partida, configurações e menu de pausa. */
'use strict';
(function (SL) {
  const U = SL.U, D = SL.D, UI = SL.UI;
  const $ = UI.$, $$ = UI.$$;
  const SC = SL.Screens = {};
  let titleRaf = null;

  // ---------- inicial ----------
  SC.title = sub => {
    UI.show('title');
    const el = $('#scr-title');
    const last = SL.Save.last(); const info = last ? SL.Save.readMeta(last) : null; const meta = info && info.meta;
    const bt = (m, txt, extra) => `<button class="mb ${extra || ''}" data-m="${m}">${txt}</button>`;
    // menu principal: Jogar, Opções, Créditos e Sair. "Jogar" abre Continuar / Novo jogo / Carregar
    const menu = sub === 'jogar'
      ? (meta ? bt('continuar', 'Continuar', 'main') : '') + bt('novo', 'Novo jogo', meta ? '' : 'main') + bt('carregar', 'Carregar') + bt('voltar', 'Voltar', 'sec')
      : bt('jogar', 'Jogar', 'main') + bt('config', 'Opções') + bt('creditos', 'Créditos') + bt('sair', 'Sair');
    el.innerHTML = `<canvas class="bg"></canvas><div class="tm-sombra"></div>
      <div class="tm-col">
        <div class="tm-logo"><h1>STREAMER<br><em>LIFE</em></h1><span class="dev-tag"><i></i>build de desenvolvimento 0.4</span></div>
        <nav class="tm-menu">${menu}</nav>
        ${sub === 'jogar' && meta ? `<div class="tm-ult">Última partida: <b>${U.esc(meta.channel)}</b> · ${U.esc(meta.tier || '')}</div>` : ''}
        <div class="tm-foot">Versão 0.4 · em desenvolvimento</div>
      </div>`;
    $$('[data-m]', el).forEach(b => b.onclick = () => {
      SL.audio.init(); SL.audio.play('click');
      const m = b.dataset.m;
      if (m === 'jogar') return SC.title('jogar');
      if (m === 'voltar') return SC.title();
      if (m === 'continuar') { const err = SL.Save.load(SL.Save.last()); if (err) UI.alert('Não foi possível continuar', err, 'alert'); }
      if (m === 'novo') SC.creator();
      if (m === 'carregar') SC.load();
      if (m === 'config') SC.settings('title');
      if (m === 'creditos') SC.creditos();
      if (m === 'sair') UI.confirm('Sair do jogo?', 'Seu progresso fica salvo no navegador.', () => { try { window.close(); } catch (e) { /* ignora */ } el.innerHTML = '<div class="tm-tchau"><b>Valeu por jogar!</b><span>Pode fechar esta aba. Para voltar, recarregue a página.</span></div>'; }, 'Sair');
    });
    const cv = $('canvas.bg', el); const look = meta && meta.look ? meta.look : SL.State.defaultLook();
    cancelAnimationFrame(titleRaf);
    const loop = t => { if (UI.screen !== 'title' || !cv.isConnected) return; SL.Preview.menuStreamer(cv, t / 1000, look); titleRaf = requestAnimationFrame(loop); };
    titleRaf = requestAnimationFrame(loop);
  };

  // ---------- créditos (nov/2026): só o essencial e o botão CRIADOR (abre o Instagram do criador) ----------
  SC.CRIADOR_URL = 'https://www.instagram.com/marciomotta.777/';
  const IG = '<svg class="ig" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>';
  SC.creditos = () => {
    const m = UI.modal({ title: 'Créditos', icon: 'star', cls: 'creditos', html: `<div class="cr-box">
      <div class="cr-logo">STREAMER<em>LIFE</em></div>
      <div class="cr-ver">Versão 0.4 · em desenvolvimento</div>
      <a class="cr-criador" href="${SC.CRIADOR_URL}" target="_blank" rel="noopener noreferrer" data-criador>${IG}<span>CRIADOR</span></a>
      <p class="cr-aviso">Todas as pessoas, canais, marcas e acontecimentos deste jogo são fictícios. Os nomes dos aplicativos aparecem só como nome.</p>
      <p class="cr-obg">Obrigado por jogar!</p></div>`, buttons: [{ label: 'Fechar', cls: 'primary' }] });
    const a = m.el.querySelector('[data-criador]'); if (a) a.addEventListener('click', () => { if (SL.audio) SL.audio.play('click'); });
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
        <div class="kv"><span>Nível</span><span>${U.esc(s.meta.tier || '')}</span><span>Seguidores</span><span>${U.num(s.meta.followers)}</span><span>Dinheiro</span><span>${U.money0(s.meta.money)}</span><span>Salvo em</span><span>${new Date(s.savedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span></div>`}
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
  // ---------- opções (nov/2026: refeitas em abas) ----------
  SC.CORES = { roxo: ['#8b5cf6', '#b49dff'], azul: ['#3b82f6', '#93c5fd'], verde: ['#10b981', '#6ee7b7'], rosa: ['#ec4899', '#f9a8d4'], laranja: ['#f97316', '#fdba74'] };
  SC.PADRAO = { volume: 0.6, music: 0.25, musicOn: true, vozes: 1, ambOn: true, teclas: true, autosave: true, reduceMotion: false, textScale: 1, chatCap: 6, tips: true, cor: 'roxo', blur: true };
  SC.optTab = 'som';
  SC.settingsHTML = () => {
    const s = SL.settings; const t = SC.optTab;
    const tg = (id, on, nome, desc) => `<label class="op-row"><span class="op-t"><b>${nome}</b>${desc ? `<small>${desc}</small>` : ''}</span><span class="tgl"><input type="checkbox" data-tg="${id}" ${on ? 'checked' : ''}><i></i></span></label>`;
    const sl = (id, v, nome, desc) => `<div class="op-row"><span class="op-t"><b>${nome}</b>${desc ? `<small>${desc}</small>` : ''}</span><span class="op-sl"><input type="range" min="0" max="1" step="0.05" value="${v}" data-sl="${id}" style="--p:${Math.round(v * 100)}%"><em>${Math.round(v * 100)}%</em></span></div>`;
    const sg = (id, cur, ops, nome, desc) => `<div class="op-row col-m"><span class="op-t"><b>${nome}</b>${desc ? `<small>${desc}</small>` : ''}</span><span class="seg">${ops.map(([v, l]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-sg="${id}" data-v="${v}">${l}</button>`).join('')}</span></div>`;
    const abas = [['som', 'Som', 'music'], ['jogo', 'Jogo', 'gamepad'], ['tela', 'Tela', 'laptop'], ['dados', 'Dados', 'folder']];
    let corpo = '';
    if (t === 'som') corpo = sl('volume', s.volume, 'Volume geral', 'Efeitos, avisos e tudo do jogo') + tg('musicOn', s.musicOn, 'Música calma', 'Lo-fi tocando no fundo') + sl('music', s.music, 'Volume da música') + sl('vozes', s.vozes == null ? 1 : s.vozes, 'Vozes', 'Superchats (a partir de R$ 5)') + tg('ambOn', s.ambOn !== false, 'Sons de fundo', 'Chuva na janela e teclado enquanto trabalha') + tg('teclas', s.teclas !== false, 'Som ao digitar', 'Uma tecla a cada letra que você escreve');
    if (t === 'jogo') corpo = sg('chatCap', s.chatCap, [[3, 'Calmo'], [6, 'Normal'], [12, 'Agitado']], 'Ritmo do chat na live', 'Também depende de quantas pessoas estão assistindo') + tg('autosave', s.autosave !== false, 'Salvar sozinho', 'A cada poucos minutos e depois das lives') + tg('tips', s.tips !== false, 'Dicas na tela', 'Lembretes de teclas e do que fazer');
    if (t === 'tela') corpo = sg('textScale', s.textScale, [[0.9, 'Menor'], [1, 'Normal'], [1.12, 'Maior']], 'Tamanho do texto') + `<div class="op-row col-m"><span class="op-t"><b>Cor de destaque</b><small>Botões, barras e detalhes</small></span><span class="cores">${Object.keys(SC.CORES).map(k => `<button class="cor ${(s.cor || 'roxo') === k ? 'on' : ''}" data-cor="${k}" style="--c:${SC.CORES[k][0]}" title="${k}"></button>`).join('')}</span></div>` + tg('blur', s.blur !== false, 'Painéis de vidro', 'Fundo desfocado atrás das janelas (desligue se o jogo ficar lento)') + tg('reduceMotion', !!s.reduceMotion, 'Menos animações', 'Janelas e avisos aparecem sem movimento');
    if (t === 'dados') corpo = `<div class="op-row"><span class="op-t"><b>Salvamentos</b><small>${SL.Save.list().filter(x => !x.empty).length} de ${SL.Save.list().length} espaços em uso, tudo no seu navegador</small></span><button class="btn sm" data-op="carregar">Ver salvamentos</button></div>` + (SL.G ? `<div class="op-row"><span class="op-t"><b>Cópia de segurança</b><small>Código da partida atual para guardar</small></span><button class="btn sm" data-op="exportar">Exportar</button></div>` : '') + `<div class="op-row"><span class="op-t"><b>Voltar ao padrão</b><small>Só as opções; suas partidas não mudam</small></span><button class="btn sm red" data-op="padrao">Restaurar</button></div>`;
    return `<div class="opcoes"><nav class="op-abas">${abas.map(([k, l, i]) => `<button class="${t === k ? 'on' : ''}" data-aba="${k}">${UI.ic(i, 16)}<span>${l}</span></button>`).join('')}</nav><div class="op-corpo">${corpo}</div></div>`;
  };
  SC.bindSettings = (root, redraw) => {
    const s = SL.settings; const save = () => { SL.Save.saveSettings(); SC.applySettings(); };
    const host = root.querySelector('.opcoes').parentNode;
    const again = () => { host.innerHTML = SC.settingsHTML(); SC.bindSettings(root, redraw); };
    host.onclick = e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.aba) { SC.optTab = b.dataset.aba; SL.audio.play('click'); return again(); }
      if (b.dataset.sg) { s[b.dataset.sg] = +b.dataset.v; save(); SL.audio.play('click'); return again(); }
      if (b.dataset.cor) { s.cor = b.dataset.cor; save(); SL.audio.play('click'); return again(); }
      if (b.dataset.op === 'carregar') { const md = root.closest && root.closest('.modal-bg'); if (md) md.remove(); return SC.load(SL.G ? 'game' : undefined); }
      if (b.dataset.op === 'exportar') return SC.exportDialog();
      if (b.dataset.op === 'padrao') return UI.confirm('Voltar ao padrão?', 'Volume, cores e outras opções voltam como eram no começo.', () => { Object.assign(s, SC.PADRAO); save(); SL.audio.init(); SL.audio.music(s.musicOn); again(); }, 'Restaurar', true);
    };
    root.querySelectorAll('[data-tg]').forEach(i => i.onchange = () => { s[i.dataset.tg] = i.checked; save(); if (i.dataset.tg === 'musicOn') { SL.audio.init(); SL.audio.music(s.musicOn); } });
    root.querySelectorAll('[data-sl]').forEach(i => i.oninput = () => { s[i.dataset.sl] = +i.value; i.style.setProperty('--p', Math.round(i.value * 100) + '%'); i.nextElementSibling.textContent = Math.round(i.value * 100) + '%'; save(); });
  };
  SC.applySettings = () => {
    const s = SL.settings; const r = document.documentElement.style; r.setProperty('--ts', s.textScale);
    const c = SC.CORES[s.cor || 'roxo'] || SC.CORES.roxo; r.setProperty('--accent', c[0]); r.setProperty('--accent2', c[1]); r.setProperty('--b-roxo', c[0]); r.setProperty('--b-roxo-l', c[1]); r.setProperty('--accent-soft', c[0] + '29');
    document.body.classList.toggle('reduce-motion', !!s.reduceMotion); document.body.classList.toggle('sem-vidro', s.blur === false); SL.audio.applyVolume();
  };
  SC.settings = from => {
    if (from === 'game') { const m = UI.modal({ title: 'Opções', icon: 'settings', wide: true, html: SC.settingsHTML(), buttons: [{ label: 'Pronto', cls: 'primary' }] }); SC.bindSettings(m.el); return; }
    UI.show('settings');
    const el = $('#scr-settings');
    el.innerHTML = `<div class="page op-page"><div class="page-in" style="max-width:760px"><div class="page-head"><button class="ibtn" data-back>${UI.ic('left')}</button><h2>Opções</h2></div><div class="card op-card">${SC.settingsHTML()}</div></div></div>`;
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

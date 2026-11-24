/* Salvamento: 3 espaços manuais + automático, com versão dos dados e migração. Também exporta/importa arquivo. */
'use strict';
(function (SL) {
  const U = SL.U;
  const S = SL.Save = {};
  S.PREFIX = 'streamerlife_save_';
  S.SLOTS = ['1', '2', '3', 'auto'];
  S.SETTINGS_KEY = 'streamerlife_settings';
  S.LAST_KEY = 'streamerlife_last';

  // migrações: cada função leva os dados da versão N para N+1
  S.MIGRATIONS = {
    1: d => { d.ch = d.ch || {}; d.ch.merch = d.ch.merch || { on: false, products: {}, sold: 0, stock: {} }; d.v = 2; return d; },
    2: d => { d.courses = d.courses || {}; if (d.events && !d.events.pendingLater) d.events.pendingLater = []; d.v = 3; return d; },
  };
  const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
  const fill = (t, def) => { for (const k in def) { if (t[k] === undefined) t[k] = JSON.parse(JSON.stringify(def[k])); else if (isObj(t[k]) && isObj(def[k]) && !['rel', 'dms', 'goals', 'month', 'trends'].includes(k)) fill(t[k], def[k]); } return t; };
  S.migrate = d => {
    if (!d || typeof d !== 'object' || !d.player || !d.time) throw new Error('Arquivo de salvamento inválido.');
    let guard = 0;
    while ((d.v || 1) < SL.State.SAVE_VERSION && guard++ < 20) { const f = S.MIGRATIONS[d.v || 1]; if (!f) break; d = f(d); }
    if ((d.v || 1) > SL.State.SAVE_VERSION) throw new Error('Este salvamento é de uma versão mais nova do jogo.');
    const tpl = SL.State.newGame({ name: d.player.name, diff: d.player.diff });
    fill(d, tpl);
    // relações e criadores novos que não existiam no save
    for (const id in tpl.rel) if (!d.rel[id]) d.rel[id] = tpl.rel[id];
    tpl.creators.forEach(c => { if (!d.creators.find(x => x.id === c.id)) d.creators.push(c); });
    if (d.act && (d.act.id === 'live' || d.act.id === 'viagem')) d.act = null;
    if (d.loc.area === 'viagem') d.loc.area = 'casa';
    d.v = SL.State.SAVE_VERSION;
    return d;
  };
  S.meta = G => ({ name: G.player.name, channel: G.player.channel, day: (SL.Career.TIERS[G.career.tier] || {}).n || '', time: '', money: G.money,
    followers: G.ch.pulso.f + G.ch.vision.f + G.ch.clipz.f + G.ch.connect.f, tier: (SL.Career.TIERS[G.career.tier] || {}).n, look: G.player.look, playMs: G.playMs });
  const round = (k, v) => (typeof v === 'number' && !Number.isInteger(v)) ? Math.round(v * 100) / 100 : v;
  S.serialize = G => JSON.stringify({ app: 'streamer-life', v: SL.State.SAVE_VERSION, savedAt: Date.now(), meta: S.meta(G), data: G }, round);
  // os dados vão comprimidos (prefixo LZ1:) e o resumo fica numa chave separada, para listar sem abrir tudo
  S.write = slot => {
    const G = SL.G; if (!G) return 'Nenhum jogo em andamento.';
    if (SL.Live && SL.Live.cur) return 'Não dá para salvar durante uma live.';
    G.slot = slot === 'auto' ? (G.slot || '1') : slot;
    const str = S.serialize(G);
    let packed; try { packed = 'LZ1:' + U.lzPack(str); } catch (e) { packed = str; }
    const ok = U.store.set(S.PREFIX + slot, packed);
    if (!ok) return 'O navegador não deixou salvar (armazenamento cheio ou bloqueado). Use "Exportar arquivo".';
    U.store.set(S.PREFIX + slot + '_meta', JSON.stringify({ meta: S.meta(G), savedAt: Date.now(), v: SL.State.SAVE_VERSION }));
    U.store.set(S.LAST_KEY, slot);
    S.lastWrite = Date.now();
    SL.bus.emit('saved', slot);
    return null;
  };
  S.readRaw = slot => {
    const s = U.store.get(S.PREFIX + slot); if (!s) return null;
    try { return JSON.parse(s.startsWith('LZ1:') ? U.lzUnpack(s.slice(4)) : s); } catch (e) { return { broken: true }; }
  };
  S.readMeta = slot => {
    const m = U.store.get(S.PREFIX + slot + '_meta');
    if (m) { try { return JSON.parse(m); } catch (e) { /* cai para o arquivo completo */ } }
    if (!U.store.get(S.PREFIX + slot)) return null;
    const r = S.readRaw(slot); return r && !r.broken ? { meta: r.meta, savedAt: r.savedAt } : { broken: true };
  };
  S.list = () => S.SLOTS.map(slot => { const r = S.readMeta(slot); return { slot, empty: !r, broken: r && r.broken, meta: r && r.meta, savedAt: r && r.savedAt }; });
  S.load = slot => {
    const r = S.readRaw(slot); if (!r || r.broken) return 'Salvamento vazio ou corrompido.';
    try { const d = S.migrate(r.data); SL.loadGame(d); U.store.set(S.LAST_KEY, slot); return null; } catch (e) { console.error(e); return e.message || 'Falha ao carregar.'; }
  };
  S.del = slot => { U.store.del(S.PREFIX + slot); U.store.del(S.PREFIX + slot + '_meta'); };
  S.last = () => { const l = U.store.get(S.LAST_KEY); const r = l && S.readMeta(l); if (r && !r.broken) return l; const any = S.list().filter(x => !x.empty && !x.broken).sort((a, b) => b.savedAt - a.savedAt)[0]; return any ? any.slot : null; };
  S.exportStr = () => SL.G ? S.serialize(SL.G) : null;
  S.importStr = str => {
    let r; try { r = JSON.parse(str); } catch (e) { return 'O arquivo não é um salvamento válido.'; }
    if (!r || r.app !== 'streamer-life' || !r.data) return 'O arquivo não é um salvamento do Streamer Life.';
    try { SL.loadGame(S.migrate(r.data)); return null; } catch (e) { return e.message; }
  };
  S.lastWrite = 0;
  S.auto = force => {
    if (!SL.G || !(SL.settings && SL.settings.autosave !== false)) return;
    if (SL.Live && SL.Live.cur) return;
    if (!force && Date.now() - S.lastWrite < 45000) return;
    S.write('auto');
  };

  // configurações (separadas do jogo)
  S.loadSettings = () => {
    let s = {}; try { s = JSON.parse(U.store.get(S.SETTINGS_KEY) || '{}') || {}; } catch (e) { s = {}; }
    SL.settings = Object.assign({ volume: 0.6, music: 0.25, musicOn: true, autosave: true, autosaveMin: 3, reduceMotion: false, textScale: 1, chatCap: 6, tips: true }, s);
    if (!SL.settings.somV2) { SL.settings.somV2 = 1; SL.settings.musicOn = true; }   // nov/2026: música calma ligada por padrão
    return SL.settings;
  };
  S.saveSettings = () => U.store.set(S.SETTINGS_KEY, JSON.stringify(SL.settings));
  SL.bus.on('tick:day', () => S.auto());
  SL.bus.on('live:end', () => setTimeout(S.auto, 100));
})(window.SL);

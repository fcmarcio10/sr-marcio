// Copia o jogo para dist/, desliga as trapaças e liga os recursos do app de computador
// (botão Sair, botão do criador abrindo no navegador, F11 tela cheia, sem menu de clique direito nem atalhos de navegador).
// O código vai compactado e sem comentários (ninguém lê nem mexe por dentro do app).
const fs = require('fs'), path = require('path');
const { minify } = require('terser');
const src = path.join(__dirname, '..'), dst = path.join(__dirname, 'dist');
(async () => {
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  const css = fs.readFileSync(path.join(src, 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*\n/g, '\n');
  fs.writeFileSync(path.join(dst, 'style.css'), css);
  let js = fs.readFileSync(path.join(src, 'game.js'), 'utf8').replace('const CHEATS_ENABLED = true;', 'const CHEATS_ENABLED = false;');
  const r = await minify(js, { compress: { passes: 1 }, mangle: true, keep_classnames: true, keep_fnames: true, format: { comments: false } });
  if (!r.code) throw new Error('falhou ao compactar o jogo');
  fs.writeFileSync(path.join(dst, 'game.js'), r.code);
  const shim = `<script>
(function () {
  var T = window.__TAURI__;
  if (T && T.core) window.brnd = { desktop: true, quit: function () { T.core.invoke('quit_game'); }, abrir: function (u) { T.core.invoke('abrir_link', { url: u }); } };
  window.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('keydown', function (e) {
    var k = e.key, c = e.ctrlKey || e.metaKey;
    if (k === 'F11') { e.preventDefault(); if (T && T.core) T.core.invoke('toggle_fullscreen'); return; }
    if (k === 'F5' || k === 'F3' || k === 'F7' || k === 'F12' || (c && /^[rpfgujsholn+=\\-0]$/i.test(k)) || (e.altKey && (k === 'ArrowLeft' || k === 'ArrowRight'))) e.preventDefault();
  }, true);
  window.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
})();
</script>`;
  let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="style.css">\n' + shim);
  fs.writeFileSync(path.join(dst, 'index.html'), html);
  console.log('Jogo preparado em nativo/dist (' + (r.code.length / 1e6).toFixed(1) + ' MB).');
})().catch((e) => { console.error(e); process.exit(1); });

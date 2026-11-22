// Copia o jogo para dist/, desliga as trapaças e liga os recursos do app de computador
// (botão Sair do jogo, F11 tela cheia, sem menu de clique direito nem atalhos de navegador).
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..'), dst = path.join(__dirname, 'dist');
fs.mkdirSync(dst, { recursive: true });
fs.copyFileSync(path.join(src, 'style.css'), path.join(dst, 'style.css'));
let js = fs.readFileSync(path.join(src, 'game.js'), 'utf8').replace('const CHEATS_ENABLED = true;', 'const CHEATS_ENABLED = false;');
fs.writeFileSync(path.join(dst, 'game.js'), js);
const shim = `<script>
(function () {
  var T = window.__TAURI__;
  if (T && T.core) window.brnd = { desktop: true, quit: function () { T.core.invoke('quit_game'); } };
  window.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('keydown', function (e) {
    var k = e.key, c = e.ctrlKey || e.metaKey;
    if (k === 'F11') { e.preventDefault(); if (T && T.core) T.core.invoke('toggle_fullscreen'); return; }
    if (k === 'F5' || k === 'F3' || k === 'F7' || k === 'F12' || (c && /^[rpfgujsholn+=\\-0]$/i.test(k)) || (e.altKey && (k === 'ArrowLeft' || k === 'ArrowRight'))) e.preventDefault();
  }, true);
  window.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
})();
</script>`;
let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8').replace('<link rel="stylesheet" href="style.css">', '<link rel="stylesheet" href="style.css">\n' + shim);
fs.writeFileSync(path.join(dst, 'index.html'), html);
console.log('Jogo preparado em nativo/dist.');

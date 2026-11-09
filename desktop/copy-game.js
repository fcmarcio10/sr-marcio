// Copia o jogo (index.html, style.css, game.js) para desktop/app e desliga as trapaças na versão empacotada.
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, '..'), dst = path.join(__dirname, 'app');
fs.mkdirSync(dst, { recursive: true });
for (const f of ['index.html', 'style.css']) fs.copyFileSync(path.join(src, f), path.join(dst, f));
let js = fs.readFileSync(path.join(src, 'game.js'), 'utf8');
js = js.replace('const CHEATS_ENABLED = true;', 'const CHEATS_ENABLED = false;');
fs.writeFileSync(path.join(dst, 'game.js'), js);
console.log('Jogo copiado para desktop/app (trapaças desligadas).');

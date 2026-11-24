// Junta os áudios de audio/*.mp3 (vozes do superchat e o som do superchat, feitos no ElevenLabs)
// em js/data/sons.js, para o jogo funcionar abrindo o index.html direto e na página única.
// Uso: node tools/sons.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const dir = path.join(root, 'audio');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).sort();
let out = '/* GERADO por tools/sons.js a partir de audio/*.mp3 — não editar à mão. */\n\'use strict\';\nwindow.SL = window.SL || {};\nSL.SONS = {\n';
let total = 0;
files.forEach(f => {
  const b = fs.readFileSync(path.join(dir, f)); total += b.length;
  out += '  ' + JSON.stringify(f.replace(/\.mp3$/, '')) + ': "data:audio/mpeg;base64,' + b.toString('base64') + '",\n';
});
out += '};\n';
fs.writeFileSync(path.join(root, 'js', 'data', 'sons.js'), out);
console.log('js/data/sons.js: ' + files.length + ' áudios, ' + Math.round(total / 1024) + ' KB');

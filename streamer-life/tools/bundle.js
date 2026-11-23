// Junta tudo num arquivo só: dist/streamer-life.html (abre direto no navegador)
// e dist/artifact.html (mesmo conteúdo, sem <html>/<head>/<body>, para publicar como página).
// Uso: node tools/bundle.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
let css = '';
html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, f) => { css += '/* ' + f + ' */\n' + read(f) + '\n'; return ''; });
const fontImport = (css.match(/@import url\([^)]*\);/) || [''])[0];
css = css.replace(/@import url\([^)]*\);\n?/g, '');
let js = '';
html.replace(/<script src="([^"]+)"><\/script>/g, (m, f) => { const src = read(f); if (/<\/script/i.test(src)) throw new Error('Texto proibido em ' + f); js += '\n/* ' + f + ' */\n' + src; return ''; });
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script src=')).trim();
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="' + (fontImport.match(/url\('([^']+)'\)/) || [])[1] + '">';
const page = `<title>Streamer Life</title>\n<meta name="description" content="Simulador de vida, streaming e influência digital.">\n${fonts}\n<style>\n${css}</style>\n${body}\n<script>\n${js}\n</script>\n`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), page);
fs.writeFileSync(path.join(root, 'dist', 'streamer-life.html'), `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${page.replace(body, '').replace(/<script>[\s\S]*<\/script>\n$/, '')}</head>\n<body>\n${body}\n<script>\n${js}\n</script>\n</body>\n</html>\n`);
console.log('dist/artifact.html ' + Math.round(page.length / 1024) + ' KB');

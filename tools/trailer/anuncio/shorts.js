// Corte curto em pé para o YouTube Shorts (1080x1920), feito a partir do vídeo de anúncio já montado.
// Pega 3 trechos inteiros (as falas nunca são cortadas no meio): o gancho com o logo, a corrida com o
// passageiro mandando áudio da moqueca, e o cartaz final. O vídeo deitado fica no meio da tela, com o
// próprio vídeo borrado no fundo, título em cima e rodapé embaixo (desenhados com as fontes do jogo).
// uso (de dentro de tools/trailer/anuncio, depois do ./montar.sh):  node shorts.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const AQ = __dirname, RAIZ = path.join(AQ, '..', '..', '..');
const L = JSON.parse(fs.readFileSync(path.join(AQ, 'eventos', '_linha.json'), 'utf8'));
const cena = (n) => { const c = L.cenas.find((x) => x.nome === n); if (!c) throw new Error('cena não existe: ' + n); return c; };
const ini = (n) => cena(n).f0 / 60, fim = (n) => (cena(n).f0 + cena(n).n) / 60;
const TRECHOS = [[0, fim('a02b-logo')], [ini('a09a-batida'), fim('a10-audio')], [ini('a20-logo'), fim('a20-logo')]];
const total = TRECHOS.reduce((a, [x, y]) => a + y - x, 0);
console.log('trechos:', TRECHOS.map(([a, b]) => a.toFixed(2) + '-' + b.toFixed(2)).join(', '), '| total %s s', total.toFixed(1));

(async () => {
  // 1) moldura (título e rodapé) com as fontes do jogo
  const css = fs.readFileSync(path.join(RAIZ, 'style.css'), 'utf8').match(/@font-face\s*{[^}]*}/g).join('\n');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${css}
    html,body{margin:0;width:1080px;height:1920px;background:transparent}
    .t{position:absolute;left:0;right:0;top:250px;text-align:center;font-family:'BRND Anton';text-transform:uppercase;color:#fff;line-height:1.02;text-shadow:0 6px 0 #0a0c12,0 0 40px rgba(0,0,0,.7)}
    .t b{display:block;font-weight:400;font-size:116px}.t i{display:block;font-style:normal;font-size:96px;color:#ffcc2e}
    .s{position:absolute;left:0;right:0;top:560px;text-align:center;font-family:'BRND Cond';font-weight:800;font-size:34px;letter-spacing:.24em;color:#e9edf5;text-transform:uppercase;text-shadow:0 3px 0 #0a0c12}
    .r{position:absolute;left:0;right:0;top:1340px;text-align:center;font-family:'BRND Anton';font-size:84px;color:#fff;text-transform:uppercase;text-shadow:0 6px 0 #0a0c12}
    .r small{display:block;margin-top:14px;font-family:'BRND Cond';font-weight:800;font-size:40px;letter-spacing:.2em;color:#ffcc2e}</style></head>
    <body><div class="t"><b>Tô criando um GTA</b><i>no Espírito Santo</i></div><div class="s">mundo aberto · São Gambiarra (ES)</div>
    <div class="r">BR Night Drive<small>em breve para Windows</small></div></body></html>`;
  fs.mkdirSync(path.join(AQ, 'saida'), { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(html); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(AQ, 'saida', 'shorts_moldura.png'), omitBackground: true });
  await b.close();
  // 2) junta os trechos (vídeo e som, com uma emenda suave no som) e monta a tela em pé
  const V = path.join(AQ, 'saida', 'br-night-drive-anuncio.mp4');
  // cada trecho entra como uma entrada separada (corte rápido na leitura, sem guardar o vídeo inteiro na memória)
  const ent = [], n = TRECHOS.length;
  let f = '', cat = '';
  TRECHOS.forEach(([a, z], k) => {
    ent.push('-ss', a.toFixed(3), '-t', (z - a).toFixed(3), '-i', V);
    f += `[${k}:v]setpts=PTS-STARTPTS[v${k}];[${k}:a]asetpts=PTS-STARTPTS,afade=t=in:d=0.08,afade=t=out:st=${(z - a - 0.12).toFixed(3)}:d=0.12[a${k}];`;
    cat += `[v${k}][a${k}]`;
  });
  f += `${cat}concat=n=${n}:v=1:a=1[v][a];`;
  // fundo: o próprio vídeo pequeno, borrado e escurecido, esticado para a tela em pé
  f += `[v]split[v1][v2];[v1]scale=180:320:force_original_aspect_ratio=increase,crop=180:320,boxblur=8:2,eq=brightness=-0.22:saturation=1.2,scale=1080:1920[fundo];[v2]scale=1080:-2[meio];`;
  f += `[fundo][meio]overlay=0:(H-h)/2[base];[base][${n}:v]overlay=0:0,format=yuv420p[out]`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ent, '-i', path.join(AQ, 'saida', 'shorts_moldura.png'), '-filter_complex', f,
    '-map', '[out]', '-map', '[a]', '-r', '60', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
    path.join(AQ, 'saida', 'br-night-drive-shorts.mp4')], { stdio: 'inherit' });
  console.log('saida/br-night-drive-shorts.mp4 pronto');
})();

// Gameplay completa: grava o jogo de verdade, jogado pelo piloto, parte por parte.
// uso (de dentro de tools/trailer/completa):  node gravar.js parte1 [parte2 ...]
//   cada parte (partes/NOME.js) vira saida/partes/NOME.mp4 (imagem) + NOME.wav (som do jogo, em passo com a imagem)
//   FOTOS=1 node gravar.js X   grava só 1 quadro a cada 30 (prévia rápida em saida/previa/X/)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const AQ = __dirname, SAI = path.join(AQ, 'saida', 'partes'), SR = 48000, FPS = 60;
fs.mkdirSync(SAI, { recursive: true });
const FOTOS = !!process.env.FOTOS;

async function grava(nome) {
  const parte = require('./partes/' + nome + '.js');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', (e) => console.log('  [erro]', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('  [p]', m.text().slice(0, 200)); });
  await p.addInitScript(() => { window.__intro = true; window.__travas = true; window.__slots = true; });
  await p.addInitScript({ path: path.join(AQ, '..', 'relogio.js') }); await p.addInitScript({ path: path.join(AQ, 'pagina.js') });
  await p.goto('file://' + path.join(AQ, '..', '..', 'tests', 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  await p.evaluate(() => { localStorage.clear(); Settings.fpsCap = 0; Settings.showFps = false; Settings.quality = 'alta'; Settings.msgMode = 'audio'; window.__VT.start();
    // zoom suave sozinho no cartão de resultado e na faixa de missão cumprida
    const rm = Resultado.mostra; Resultado.mostra = function () { const r = rm.apply(this, arguments); setTimeout(() => REC.foco('#resultado', 3.2, 1.15), 350); return r; };
    const mp = Missao.passou; Missao.passou = function () { const r = mp.apply(this, arguments); setTimeout(() => REC.foco('#ms-passou', 2.8, 1.1), 300); return r; };
  });

  // vídeo: as fotos vão direto para o ffmpeg (sem guardar quadro no disco)
  const prev = path.join(AQ, 'saida', 'previa', nome);
  if (FOTOS) { fs.rmSync(prev, { recursive: true, force: true }); fs.mkdirSync(prev, { recursive: true }); }
  const ff = FOTOS ? null : spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), path.join(SAI, nome + '.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const pcm = []; let quadros = 0, gravando = false, maxQ = 0;
  const G = { p, nome, t0: Date.now() };
  G.js = (fn, arg) => p.evaluate(fn, arg);
  const foto = async () => {
    if (FOTOS) { if (quadros % 30 === 0) await p.screenshot({ path: path.join(prev, String(quadros).padStart(6, '0') + '.jpg'), type: 'jpeg', quality: 70 }); }
    else { const buf = await p.screenshot({ type: 'jpeg', quality: 93 }); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r)); }
    quadros++;
  };
  const abre = async (max) => { if (gravando) return; maxQ = max; await p.evaluate((n) => REC.inicia(n), max); gravando = true; G.k = 0; };
  const fecha = async () => {
    if (!gravando) return; gravando = false;
    const n = await p.evaluate(() => REC.termina()), out = Buffer.alloc(n);
    for (let i = 0; i < n; i += 4 << 20) Buffer.from(await p.evaluate(([i, m]) => REC.pedaco(i, m), [i, 4 << 20]), 'base64').copy(out, i);
    pcm.push(out);
  };
  // grava "seg" segundos (ou até a condição dar verdadeiro, no máximo "seg")
  G.grava = async (seg, cond) => {
    const n = Math.round(seg * FPS);
    if (gravando && G.k + n > maxQ) await fecha();
    await abre(Math.max(n, 60 * 120));
    for (let i = 0; i < n; i++) {
      await p.evaluate(() => REC.passo()); G.k++; await foto();
      if (cond && i % 6 === 0 && await p.evaluate(cond)) break;
      if (G.k >= maxQ - 2) { await fecha(); await abre(60 * 120); }
    }
  };
  // avança sem gravar (corte): o jogo anda mais rápido, em passos maiores
  G.pula = async (seg, cond) => {
    await fecha();
    const n = Math.round(seg * 20);
    for (let i = 0; i < n; i++) { await p.evaluate(() => { window.__VT.step(50); REC.aplicaFoco(); }); if (cond && i % 4 === 0 && await p.evaluate(cond)) break; }
  };
  G.ate = async (cond, max, comGravar) => { if (comGravar === false) return G.pula(max, cond); return G.grava(max, cond); };
  G.toque = (sel) => p.evaluate((s) => REC.toque(s), sel);
  G.toqueTexto = (re, sel) => p.evaluate(([r, s]) => REC.toqueTexto(r, s), [re, sel]);
  G.foco = (sel, seg, z) => p.evaluate(([s, g, zz]) => REC.foco(s, g, zz), [sel, seg, z]);
  G.tecla = (code) => p.evaluate((c) => REC.tecla(c), code);
  G.vai = (x, y, opt) => p.evaluate(([x, y, o]) => { REC.ligaPiloto(); return !!REC.piloto.vai(x, y, o); }, [x, y, opt || {}]);
  G.chegou = () => p.evaluate(() => !REC.piloto.R);
  G.log = (...a) => console.log('  ' + nome + ' [' + (quadros / FPS).toFixed(1) + ' s]', ...a);

  try { await parte(G); } catch (e) { console.log('ERRO na parte', nome, e.stack); }
  await fecha();
  const log = await p.evaluate(() => REC.log); if (log.length) console.log('  log:', log.slice(0, 20).join(' | '));
  if (ff) { ff.stdin.end(); await new Promise((r) => ff.on('close', r)); }
  if (!FOTOS) {
    const dados = Buffer.concat(pcm), h = Buffer.alloc(44);
    h.write('RIFF', 0); h.writeUInt32LE(36 + dados.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
    h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(dados.length, 40);
    fs.writeFileSync(path.join(SAI, nome + '.wav'), Buffer.concat([h, dados]));
  }
  console.log(nome + ':', (quadros / FPS).toFixed(1), 's de vídeo em', ((Date.now() - G.t0) / 60000).toFixed(1), 'min');
  await b.close();
}
(async () => { for (const n of process.argv.slice(2)) await grava(n); })();

// Som original do jogo: toca de novo, num "estúdio" fora do tempo real, todos os sons que o jogo fez
// durante a gravação (motor, pneus, buzinas, avisos do celular, chuva, forró dos bares, paredão,
// musiquinha do gás...), no quadro exato em que aconteceram. Usa o próprio AudioSys do jogo.
// uso: node som_jogo.js   ->  saida/jogo.wav
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const AQ = __dirname, SR = 48000;
const L = JSON.parse(fs.readFileSync(path.join(AQ, 'eventos', '_linha.json'), 'utf8'));
const ev = [];
for (const c of L.cenas) {
  const fp = path.join(AQ, 'eventos', c.nome + '.json'); if (!fs.existsSync(fp)) continue;
  for (const e of JSON.parse(fs.readFileSync(fp, 'utf8')).som) if (e[1] !== 'VOZ' && e[1] !== 'VOZ_PARA' && e[1] !== 'FX') ev.push(e);
}
ev.sort((a, b) => a[0] - b[0]);
const dur = L.total + 1;

(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', (e) => console.log('erro na página:', e.message));
  await p.goto('file://' + path.join(AQ, '..', '..', 'tests', 'wrapped.html'));
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 60000 });
  await p.evaluate(() => localStorage.clear());
  const t0 = Date.now();
  const n = await p.evaluate(async ({ ev, dur, SR }) => {
    const ctx = new OfflineAudioContext(2, Math.ceil(dur * SR), SR);
    window.AudioContext = function () { return ctx; }; window.webkitAudioContext = window.AudioContext;
    AudioSys.ctx = null; AudioSys.ok = false; AudioSys.init();
    const por = new Map();
    for (const e of ev) { if (!por.has(e[0])) por.set(e[0], []); por.get(e[0]).push(e); }
    let falhas = 0;
    for (const [f, lista] of por) {
      const t = f / 60; if (t <= 0.01 || t >= dur - 0.05) continue;
      ctx.suspend(t).then(() => {
        for (const [, nm, a] of lista) { try { AudioSys[nm](...a.map((x) => (x === null ? undefined : x))); } catch (err) { falhas++; } }
        ctx.resume();
      });
    }
    const buf = await ctx.startRendering();
    window.__L = buf.getChannelData(0); window.__R = buf.getChannelData(1); window.__falhas = falhas;
    return buf.length;
  }, { ev, dur, SR });
  console.log('renderizado em', ((Date.now() - t0) / 1000).toFixed(0), 's;', ev.length, 'chamadas; falhas:', await p.evaluate(() => window.__falhas));
  // busca o áudio em pedaços (16 bits, intercalado)
  fs.mkdirSync(path.join(AQ, 'saida'), { recursive: true });
  const out = Buffer.alloc(n * 4); const PED = SR * 20;
  for (let i = 0; i < n; i += PED) {
    const b64 = await p.evaluate(({ i, PED }) => {
      const L = window.__L, R = window.__R, m = Math.min(PED, L.length - i), a = new Int16Array(m * 2);
      for (let k = 0; k < m; k++) { a[2 * k] = Math.max(-1, Math.min(1, L[i + k])) * 32767; a[2 * k + 1] = Math.max(-1, Math.min(1, R[i + k])) * 32767; }
      let s = ''; const u = new Uint8Array(a.buffer); for (let k = 0; k < u.length; k += 0x8000) s += String.fromCharCode.apply(null, u.subarray(k, k + 0x8000));
      return btoa(s);
    }, { i, PED });
    Buffer.from(b64, 'base64').copy(out, i * 4);
  }
  // cabeçalho WAV
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + out.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(out.length, 40);
  fs.writeFileSync(path.join(AQ, 'saida', 'jogo.wav'), Buffer.concat([h, out]));
  console.log('saida/jogo.wav:', (n / SR).toFixed(1), 's');
  await b.close();
})();

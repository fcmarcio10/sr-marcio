const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
  const out = await p.evaluate((sizes) => {
    const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    // ponte: altura do tabuleiro em função de x (sobe até o vão central alto)
    const deckY = (x) => { const t = (x - 116) / 140; return 134 + 44 * t * t; };
    const draw = (S) => {
      const simple = S <= 32, mid = S <= 64;
      const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'); g.scale(S / 256, S / 256);
      const R = simple ? 40 : 54;
      rr(g, 4, 4, 248, 248, R);
      const sky = g.createLinearGradient(0, 0, 0, 256);
      sky.addColorStop(0, '#070b24'); sky.addColorStop(0.45, '#1b1a4a'); sky.addColorStop(0.68, '#6a2f5c'); sky.addColorStop(0.78, '#e2763a'); sky.addColorStop(0.8, '#0b1430'); sky.addColorStop(1, '#040713');
      g.fillStyle = sky; g.fill(); g.save(); g.clip();
      if (!simple) {
        // estrelas
        g.fillStyle = '#fff';
        for (let i = 0; i < 46; i++) { const x = (i * 97.3) % 248 + 4, y = (i * 53.7) % 120 + 8, s = (i % 5 === 0) ? 1.8 : 1; g.globalAlpha = 0.35 + (i % 3) * 0.2; g.fillRect(x, y, s, s); }
        g.globalAlpha = 1;
        // lua
        g.fillStyle = '#fff4d6'; g.beginPath(); g.arc(150, 44, 13, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#0d1232'; g.beginPath(); g.arc(156, 40, 12, 0, Math.PI * 2); g.fill();
      }
      // brilho da cidade no horizonte
      const glow = g.createRadialGradient(110, 200, 10, 110, 200, 150); glow.addColorStop(0, 'rgba(255,150,70,0.35)'); glow.addColorStop(1, 'rgba(255,150,70,0)');
      g.fillStyle = glow; g.fillRect(0, 0, 256, 256);
      // skyline distante (lado de Vitorinha)
      g.fillStyle = '#141a38';
      [[0, 176, 14], [12, 168, 10], [22, 180, 12], [34, 172, 9], [44, 182, 14]].forEach(([x, y, w]) => g.fillRect(x, y, w, 210 - y));
      if (!simple) { g.fillStyle = '#ffcf6a'; for (let i = 0; i < 18; i++) g.fillRect((i * 13.7) % 56 + 2, 178 + (i * 7) % 26, 2, 2); }
      // Morro da Penha com o convento
      const hill = g.createLinearGradient(0, 90, 0, 210); hill.addColorStop(0, '#2c3a2c'); hill.addColorStop(1, '#0d140f');
      g.fillStyle = hill; g.beginPath(); g.moveTo(132, 212); g.bezierCurveTo(150, 168, 170, 120, 192, 104); g.lineTo(226, 102); g.bezierCurveTo(240, 120, 250, 150, 262, 170); g.lineTo(262, 212); g.closePath(); g.fill();
      if (!simple) {
        // pedra exposta
        g.fillStyle = 'rgba(160,150,140,0.28)'; g.beginPath(); g.moveTo(186, 112); g.quadraticCurveTo(170, 140, 168, 170); g.quadraticCurveTo(182, 150, 196, 116); g.closePath(); g.fill();
        g.fillStyle = 'rgba(160,150,140,0.2)'; g.beginPath(); g.moveTo(228, 108); g.quadraticCurveTo(236, 130, 246, 150); g.quadraticCurveTo(232, 134, 222, 110); g.closePath(); g.fill();
        // árvores no morro
        g.fillStyle = '#1d2c1e'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(160 + i * 7, 150 + Math.sin(i * 1.7) * 18 + (i < 5 ? 20 - i * 6 : 0), 6, 0, Math.PI * 2); g.fill(); }
      }
      // convento (paredes brancas iluminadas)
      const cx = 209, cy = 103;
      const lit = g.createRadialGradient(cx, cy - 10, 2, cx, cy - 10, 40); lit.addColorStop(0, 'rgba(255,220,150,0.55)'); lit.addColorStop(1, 'rgba(255,220,150,0)');
      g.fillStyle = lit; g.beginPath(); g.arc(cx, cy - 10, 40, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f2eadb';
      g.fillRect(cx - 24, cy - 18, 40, 18);                 // claustro
      g.fillRect(cx + 10, cy - 30, 12, 30);                // igreja
      g.beginPath(); g.moveTo(cx + 8, cy - 30); g.lineTo(cx + 16, cy - 38); g.lineTo(cx + 24, cy - 30); g.closePath(); g.fill(); // frontão
      g.fillRect(cx - 4, cy - 34, 9, 18);                  // torre
      g.beginPath(); g.moveTo(cx - 5, cy - 34); g.lineTo(cx + 0.5, cy - 42); g.lineTo(cx + 6, cy - 34); g.closePath(); g.fill();
      g.fillStyle = '#c9bca5'; g.fillRect(cx - 24, cy - 3, 46, 3);
      if (!simple) {
        g.fillStyle = '#ffd27a';
        for (let i = 0; i < 5; i++) g.fillRect(cx - 21 + i * 6, cy - 13, 3, 5);
        g.fillRect(cx + 14, cy - 22, 4, 7); g.fillRect(cx - 1, cy - 29, 3, 4);
        g.strokeStyle = '#f2eadb'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx + 16, cy - 38); g.lineTo(cx + 16, cy - 46); g.moveTo(cx + 13, cy - 43); g.lineTo(cx + 19, cy - 43); g.stroke();
      }
      // mar
      const sea = g.createLinearGradient(0, 206, 0, 256); sea.addColorStop(0, '#0f1d40'); sea.addColorStop(1, '#03060f');
      g.fillStyle = sea; g.fillRect(0, 206, 256, 50);
      // Terceira Ponte: pilares + tabuleiro
      g.fillStyle = '#1a2240';
      for (let x = 8; x <= 248; x += 20) { if (x > 92 && x < 132) continue; const y = deckY(x); g.fillRect(x - 2.5, y + 4, 5, 210 - y); }
      g.fillRect(84, deckY(86) + 4, 8, 210 - deckY(86)); g.fillRect(132, deckY(134) + 4, 8, 210 - deckY(134));
      g.strokeStyle = '#2b355e'; g.lineWidth = simple ? 10 : 8; g.lineCap = 'butt';
      g.beginPath(); for (let x = -4; x <= 260; x += 4) { const y = deckY(x); x < 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
      // vão central: viga mais funda
      g.fillStyle = '#2b355e'; g.beginPath(); g.moveTo(84, deckY(84) + 3); g.quadraticCurveTo(112, deckY(112) + 14, 140, deckY(140) + 3); g.lineTo(140, deckY(140)); g.lineTo(84, deckY(84)); g.closePath(); g.fill();
      if (!simple) {
        // rastros de luz dos carros (faróis brancos e lanternas vermelhas)
        g.lineWidth = 2.2; g.lineCap = 'round';
        g.strokeStyle = 'rgba(255,245,220,0.95)'; g.beginPath(); for (let x = 0; x <= 256; x += 4) { const y = deckY(x) - 2.5; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        g.strokeStyle = 'rgba(255,60,50,0.95)'; g.beginPath(); for (let x = 0; x <= 256; x += 4) { const y = deckY(x) + 1.5; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        // postes
        for (let x = 14; x < 256; x += 22) { const y = deckY(x) - 4; g.strokeStyle = '#3a4570'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 8); g.stroke();
          const lg = g.createRadialGradient(x, y - 9, 0, x, y - 9, 6); lg.addColorStop(0, 'rgba(255,210,120,0.9)'); lg.addColorStop(1, 'rgba(255,210,120,0)'); g.fillStyle = lg; g.beginPath(); g.arc(x, y - 9, 6, 0, Math.PI * 2); g.fill(); }
        // reflexos na água (faixas onduladas)
        for (let x = 14; x < 256; x += 22) for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(255,200,110,' + (0.32 - k * 0.07) + ')'; g.fillRect(x - 3 + Math.sin(x + k * 2) * 2, 214 + k * 9, 6 - k, 1.6); }
        for (let k = 0; k < 5; k++) { g.fillStyle = 'rgba(255,90,70,' + (0.22 - k * 0.04) + ')'; g.fillRect(60 + k * 30 + Math.sin(k) * 6, 222 + (k % 3) * 8, 14, 1.4); }
        g.fillStyle = 'rgba(255,230,170,0.22)'; for (let k = 0; k < 4; k++) g.fillRect(cx - 12 + Math.sin(k * 3) * 4, 218 + k * 9, 20 - k * 4, 1.6);
      } else {
        g.strokeStyle = '#ffd23f'; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= 256; x += 8) { const y = deckY(x) - 2; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      }
      g.restore();
      // selo BR (igual ao logo do jogo)
      const bx = S <= 16 ? 26 : simple ? 22 : mid ? 22 : 24, by = S <= 16 ? 20 : simple ? 22 : mid ? 22 : 24, bw = S <= 16 ? 200 : simple ? 150 : mid ? 120 : 96, bh = S <= 16 ? 118 : simple ? 86 : mid ? 66 : 54;
      g.save(); g.translate(bx, by); g.transform(1, 0, -0.12, 1, 0, 0);
      g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 8; g.shadowOffsetY = 3;
      rr(g, 0, 0, bw, bh, 9); g.fillStyle = '#2ecc55'; g.fill(); g.shadowColor = 'transparent';
      g.font = 'italic 900 ' + (bh * 0.82) + 'px Arial Black, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#05070f'; g.fillText('BR', bw / 2 + 2, bh / 2 + 3);
      g.restore();
      if (!mid) {
        // NIGHT DRIVE em dourado, pequeno, abaixo do selo
        g.save(); g.translate(26, 96); g.transform(1, 0, -0.14, 1, 0, 0);
        g.font = 'italic 900 21px Arial Black, Arial, sans-serif'; g.textBaseline = 'alphabetic';
        const tg = g.createLinearGradient(0, -18, 0, 2); tg.addColorStop(0, '#ffe27a'); tg.addColorStop(1, '#ff8a1f');
        g.lineJoin = 'round'; g.lineWidth = 4; g.strokeStyle = '#05070f'; g.strokeText('NIGHT', 0, 0); g.strokeText('DRIVE', 0, 22);
        g.fillStyle = tg; g.fillText('NIGHT', 0, 0); g.save(); g.translate(0, 22); g.fillText('DRIVE', 0, 0); g.restore();
        g.restore();
      }
      // borda
      rr(g, 4, 4, 248, 248, R); g.lineWidth = simple ? 8 : 5; g.strokeStyle = '#ffb02e'; g.stroke();
      return c.toDataURL('image/png');
    };
    const o = {}; for (const s of sizes) o[s] = draw(s); return o;
  }, sizes);
  const D = '/home/user/sr-marcio/desktop/build/';
  const pngs = {}; for (const s of sizes) pngs[s] = Buffer.from(out[s].split(',')[1], 'base64');
  fs.writeFileSync(D + 'icon.png', pngs[1024]);
  for (const s of [16, 32, 48, 256, 512]) fs.writeFileSync(__dirname + '/ic' + s + '.png', pngs[s]);
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(icoSizes.length, 4);
  const dir = Buffer.alloc(16 * icoSizes.length); let off = 6 + dir.length; const datas = [];
  icoSizes.forEach((s, i) => { const d = pngs[s]; const e = i * 16; dir.writeUInt8(s >= 256 ? 0 : s, e); dir.writeUInt8(s >= 256 ? 0 : s, e + 1); dir.writeUInt16LE(1, e + 4); dir.writeUInt16LE(32, e + 6); dir.writeUInt32LE(d.length, e + 8); dir.writeUInt32LE(off, e + 12); off += d.length; datas.push(d); });
  fs.writeFileSync(D + 'icon.ico', Buffer.concat([header, dir, ...datas]));
  // folha de prévia
  const pv = await b.newPage({ viewport: { width: 760, height: 560 } });
  await pv.setContent('<body style="margin:0;background:#cfd6e4;display:flex;gap:24px;align-items:flex-end;padding:20px;flex-wrap:wrap">' + [128, 64, 48, 32, 16].map(s => `<img src="data:image/png;base64,${pngs[s].toString('base64')}" width="${s}" style="image-rendering:pixelated">`).join('') + '<div style="background:#202020;padding:10px;display:flex;gap:10px">' + [48, 32, 16].map(s => `<img src="data:image/png;base64,${pngs[s].toString('base64')}" width="${s}">`).join('') + '</div></body>');
  await pv.screenshot({ path: __dirname + '/icprev.png' });
  console.log('ok'); await b.close();
})();

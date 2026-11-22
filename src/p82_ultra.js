/* ============================ GRÁFICO ULTRA: CHUVA DE VERDADE (0.2.0) ============================
   Só no Ultra (nada disso roda no Alto, Médio ou Baixo):
   - chão molhando aos poucos: quando a chuva chega, manchas escuras aparecem no asfalto, na calçada e na terra
     (presas ao mapa) e vão crescendo até se juntar; quando para, secam na ordem contrária;
   - poças nascem pequenas e crescem com a chuva, com várias ondinhas abrindo ao mesmo tempo e o céu refletido;
   - respingos das gotas batendo no chão (coroinha que abre e gotinhas pulando para fora);
   - gotas em quatro camadas (2,5x mais), com a ponta brilhando e algumas bem perto da câmera.
   Tudo num caminho só por camada (poucas pinceladas). */
const Ultra = { resp: [], _mancha: {} };
// mancha macia pronta (asfalto molhado fica quase preto-azulado; terra molhada vira marrom escuro)
Ultra.mancha = function (tipo) {
  let c = this._mancha[tipo];
  if (!c) {
    c = makeCanvas(64, 64); const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    const cor = tipo === 'terra' ? '40,26,14' : tipo === 'areia' ? '120,96,60' : '10,14,24';
    gr.addColorStop(0, `rgba(${cor},1)`); gr.addColorStop(0.55, `rgba(${cor},0.85)`); gr.addColorStop(1, `rgba(${cor},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); this._mancha[tipo] = c;
  }
  return c;
};
// chão molhando: cada casinha de 56 do mapa tem a hora dela de molhar (hash), a mancha cresce com Weather.wet
Ultra.molhando = function (ctx, view) {
  if (!ultraQ() || Weather.wet < 0.02) return;
  // desenhado numa tela 4x menor (as manchas são macias, não perde nada) e ampliado numa pincelada só
  const Q = 4, C = 56, w = Weather.wet, W = Math.ceil((view.x1 - view.x0) / Q) + 2, H = Math.ceil((view.y1 - view.y0) / Q) + 2;
  const ox = Math.floor(view.x0 / Q) * Q, oy = Math.floor(view.y0 / Q) * Q, chave = ox + ',' + oy + ',' + W + ',' + H + ',' + w.toFixed(3);
  let oc = this._oc; if (!oc) oc = this._oc = makeCanvas(W, H);
  if (chave !== this._chave) {
    this._chave = chave; if (oc.width !== W || oc.height !== H) { oc.width = W; oc.height = H; }
    const g = oc.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.setTransform(1 / Q, 0, 0, 1 / Q, -ox / Q, -oy / Q);
    for (let cy = Math.floor(view.y0 / C) - 1; cy <= Math.floor(view.y1 / C) + 1; cy++) for (let cx = Math.floor(view.x0 / C) - 1; cx <= Math.floor(view.x1 / C) + 1; cx++) {
      const h = hash2(cx * 3 + 11, cy * 5 + 7), k = clamp((w - h * 0.75) / 0.3, 0, 1); if (k <= 0) continue;
      const x = (cx + 0.3 + hash2(cx, cy + 91) * 0.4) * C, y = (cy + 0.3 + hash2(cx + 57, cy) * 0.4) * C, gs = groundAt(x, y);
      const tipo = gs === SF.ROAD || gs === SF.PAVED || gs === SF.BRIDGE || gs === SF.SIDEWALK ? 'asfalto' : gs === SF.EARTH || gs === SF.DIRT ? 'terra' : gs === SF.SAND ? 'areia' : null; if (!tipo) continue;
      const r = C * (0.35 + 0.75 * k);
      g.globalAlpha = (tipo === 'asfalto' ? 0.42 : tipo === 'terra' ? 0.45 : 0.26) * (0.4 + 0.6 * k);
      g.drawImage(this.mancha(tipo), x - r, y - r, r * 2, r * 2);
    }
  }
  ctx.drawImage(oc, ox, oy, W * Q, H * Q);
};
// poça na chuva (Ultra): cresce com a chuva, reflexo do céu e várias ondinhas abrindo em pontos diferentes
Ultra.poca = function (ctx, p, k, T) {
  const s = 0.35 + 0.65 * clamp(Weather.wet / 0.7, 0, 1), rx = p.rx * s, ry = p.ry * s;
  ctx.globalAlpha = k;
  ctx.fillStyle = p.mud ? 'rgba(48,32,18,0.8)' : 'rgba(14,20,32,0.78)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, rx, ry, 0, 0, TAU); ctx.fill();
  const gr = ctx.createLinearGradient(p.x - rx, p.y - ry, p.x + rx, p.y + ry); // céu refletido, mais claro de um lado
  gr.addColorStop(0, p.mud ? 'rgba(150,130,100,0.28)' : 'rgba(170,190,220,0.32)'); gr.addColorStop(0.6, 'rgba(120,140,170,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gr; ctx.fill();
  ctx.strokeStyle = p.mud ? 'rgba(110,84,56,0.55)' : 'rgba(150,170,200,0.4)'; ctx.lineWidth = 0.9; ctx.stroke();
  if (Weather.rain > 0.05) { // de 3 a 6 ondinhas ao mesmo tempo, cada uma num ponto e numa hora
    const n = 3 + Math.round(Weather.rain * 3); ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const ph = p.ph * (i + 1) * 1.37, t = (T * (1.1 + Weather.rain * 0.9) + ph) % 1, rot = Math.floor(T * (1.1 + Weather.rain * 0.9) + ph);
      const ox = (hash2(rot, i * 13 + (p.x | 0)) - 0.5) * rx * 1.3, oy = (hash2(i * 7 + (p.y | 0), rot) - 0.5) * ry * 1.3, rr = 0.6 + t * Math.min(6, rx * 0.5);
      ctx.moveTo(p.x + ox + rr, p.y + oy); ctx.ellipse(p.x + ox, p.y + oy, rr, rr * 0.62, 0, 0, TAU);
    }
    ctx.strokeStyle = `rgba(205,220,240,${(0.42 * Weather.rain).toFixed(3)})`; ctx.lineWidth = 0.7; ctx.stroke();
  }
};
// respingos: as gotas que caem no chão perto da câmera
Ultra.update = function (dt) {
  const L = this.resp;
  for (let i = L.length - 1; i >= 0; i--) { L[i].t += dt; if (L[i].t > 0.32) { L[i] = L[L.length - 1]; L.pop(); } }
  if (!ultraQ() || Weather.rain < 0.05 || !Cam.view) return;
  const v = Cam.view, n = Weather.rain * 260 * dt;
  for (let i = 0; i < n && L.length < 420; i++) {
    const x = rnd(v.x0, v.x1), y = rnd(v.y0, v.y1), g = groundAt(x, y);
    if (g === SF.WATER) continue; // na água já tem o anel
    L.push({ x, y, t: 0, a: Math.random() * TAU, g: g === SF.EARTH || g === SF.DIRT ? 1 : g === SF.GRASS || g === SF.FIELD ? 2 : 0 });
  }
};
Ultra.respingos = function (ctx, view) {
  if (!ultraQ() || !this.resp.length) return;
  const anel = new Path2D(), pingo = new Path2D(), barro = new Path2D();
  for (const r of this.resp) {
    if (r.x < view.x0 || r.x > view.x1 || r.y < view.y0 || r.y > view.y1) continue;
    const k = r.t / 0.32, rr = 0.5 + k * 3.2;
    if (r.g !== 2) { anel.moveTo(r.x + rr, r.y); anel.ellipse(r.x, r.y, rr, rr * 0.6, 0, 0, TAU); } // coroinha que abre (na grama não aparece)
    if (k < 0.75) { // gotinhas pulando para fora: sobem e descem (parábola)
      const P = r.g === 1 ? barro : pingo, d = 1 + k * 5, alt = Math.sin(k / 0.75 * Math.PI) * 2.2;
      for (let j = 0; j < 4; j++) { const a = r.a + j * 1.571, px = r.x + Math.cos(a) * d, py = r.y + Math.sin(a) * d * 0.6 - alt; P.moveTo(px + 0.55, py); P.arc(px, py, 0.55, 0, TAU); }
    }
  }
  ctx.strokeStyle = 'rgba(200,214,235,0.32)'; ctx.lineWidth = 0.6; ctx.stroke(anel);
  ctx.fillStyle = 'rgba(215,228,245,0.55)'; ctx.fill(pingo);
  ctx.fillStyle = 'rgba(92,66,42,0.6)'; ctx.fill(barro);
};
// gotas (Ultra): quarta camada bem perto da câmera, mais grossas, com a ponta brilhando
Ultra.gotasPerto = function (ctx, drops, cx, cy, wx) {
  const P = new Path2D(), cab = new Path2D();
  for (const d of drops) {
    if (d.z < 0.86) continue;
    const ca = Math.cos(d.a), sa = Math.sin(d.a), k = 0.55 + 0.45 * d.z, x = cx + ca * d.r * k + wx * (1 - d.z), y = cy + sa * d.r * k;
    const tl = Math.max(9, d.r * d.l) * (0.9 + d.z * 1.4);
    P.moveTo(x, y); P.lineTo(x + ca * tl - wx * 0.08, y + sa * tl);
    cab.moveTo(x + 1.1, y); cab.arc(x, y, 1.1, 0, TAU);
  }
  ctx.strokeStyle = 'rgba(225,235,250,0.3)'; ctx.lineWidth = 2; ctx.stroke(P);
  ctx.fillStyle = 'rgba(240,246,255,0.5)'; ctx.fill(cab);
};

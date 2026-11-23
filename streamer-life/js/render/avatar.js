/* Personagens desenhados no Canvas: retrato (rosto e ombros) e boneco visto de cima para casa/cidade. */
'use strict';
(function (SL) {
  const U = SL.U;
  const A = SL.Avatar = {};
  const dark = (c, a) => U.shade(c, -a), light = (c, a) => U.shade(c, a);
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  A.rr = rr;

  const backHair = (ctx, L, cx, cy, s) => {
    const c = L.hairColor; ctx.fillStyle = dark(c, 0.15);
    if (L.hair === 5) { rr(ctx, cx - s * 0.36, cy - s * 0.2, s * 0.72, s * 0.62, s * 0.2); ctx.fill(); }
    if (L.hair === 4) { rr(ctx, cx - s * 0.33, cy - s * 0.2, s * 0.66, s * 0.42, s * 0.16); ctx.fill(); }
    if (L.hair === 6) { ctx.beginPath(); ctx.ellipse(cx + s * 0.3, cy + s * 0.05, s * 0.09, s * 0.22, -0.3, 0, 7); ctx.fill(); }
    if (L.hair === 7) { ctx.beginPath(); ctx.arc(cx, cy - s * 0.08, s * 0.42, 0, 7); ctx.fill(); }
    if (L.hair === 8) { ctx.beginPath(); ctx.arc(cx, cy - s * 0.36, s * 0.12, 0, 7); ctx.fill(); }
  };
  const frontHair = (ctx, L, cx, cy, s) => {
    const c = L.hairColor; const g = ctx.createLinearGradient(cx, cy - s * 0.4, cx, cy); g.addColorStop(0, light(c, 0.12)); g.addColorStop(1, c);
    ctx.fillStyle = g;
    const hw = s * 0.3, top = cy - s * 0.33;
    switch (L.hair) {
      case 0: ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.17, hw * 0.98, s * 0.2, 0, Math.PI, 0); ctx.fill(); ctx.globalAlpha = 1; break;
      case 1: ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.17, hw * 1.04, s * 0.22, 0, Math.PI * 1.02, -0.02); ctx.fill(); rr(ctx, cx - hw, cy - s * 0.2, hw * 2, s * 0.07, s * 0.03); ctx.fill(); break;
      case 2: ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.17, hw * 1.04, s * 0.22, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + s * 0.04, top - s * 0.02, s * 0.2, s * 0.11, -0.25, 0, 7); ctx.fill(); break;
      case 3: for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * hw * 0.92, cy - s * 0.15 + Math.sin(a) * s * 0.21, s * 0.085, 0, 7); ctx.fill(); } break;
      case 4: case 5: ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.16, hw * 1.08, s * 0.23, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - hw * 1.05, cy - s * 0.18); ctx.quadraticCurveTo(cx - hw * 1.2, cy + s * 0.12, cx - hw * 0.95, cy + s * (L.hair === 5 ? 0.32 : 0.14)); ctx.lineTo(cx - hw * 0.72, cy - s * 0.05); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx + hw * 1.05, cy - s * 0.18); ctx.quadraticCurveTo(cx + hw * 1.2, cy + s * 0.12, cx + hw * 0.95, cy + s * (L.hair === 5 ? 0.32 : 0.14)); ctx.lineTo(cx + hw * 0.72, cy - s * 0.05); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - hw * 0.9, cy - s * 0.2); ctx.quadraticCurveTo(cx - s * 0.05, cy - s * 0.05, cx + hw * 0.4, cy - s * 0.23); ctx.lineTo(cx + hw, cy - s * 0.2); ctx.lineTo(cx, cy - s * 0.38); ctx.fill(); break;
      case 6: case 8: ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.16, hw * 1.04, s * 0.22, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx - hw, cy - s * 0.18); ctx.quadraticCurveTo(cx, cy - s * 0.1, cx + hw, cy - s * 0.2); ctx.lineTo(cx, cy - s * 0.38); ctx.fill(); break;
      case 7: ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.2, hw * 1.15, s * 0.22, 0, Math.PI, 0); ctx.fill(); break;
      default: break;
    }
  };
  const face = (ctx, L, cx, cy, s, expr) => {
    const eyeY = cy - s * 0.02, ex = s * 0.105, ink = '#2a1a14';
    const brow = dark(L.hairColor === '#f0f0f0' || L.hairColor === '#bdbdbd' ? '#8a8a8a' : L.hairColor, 0.1);
    // sobrancelhas
    ctx.strokeStyle = brow; ctx.lineWidth = Math.max(1.2, s * 0.022); ctx.lineCap = 'round';
    const by = eyeY - s * 0.07;
    const bt = expr === 'bravo' ? 0.035 : expr === 'surpreso' ? -0.03 : expr === 'triste' ? -0.02 : 0;
    ctx.beginPath(); ctx.moveTo(cx - ex - s * 0.05, by - (expr === 'triste' ? -0.01 * s : 0) - (expr === 'surpreso' ? s * 0.02 : 0)); ctx.lineTo(cx - ex + s * 0.05, by + bt * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + ex + s * 0.05, by - (expr === 'surpreso' ? s * 0.02 : 0)); ctx.lineTo(cx + ex - s * 0.05, by + bt * s); ctx.stroke();
    // olhos
    const closed = expr === 'rindo' || expr === 'cansado';
    for (const sx of [-1, 1]) {
      const x = cx + sx * ex;
      if (closed) { ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.2, s * 0.02); ctx.beginPath(); if (expr === 'rindo') ctx.arc(x, eyeY + s * 0.01, s * 0.035, Math.PI * 1.1, Math.PI * 1.9); else { ctx.moveTo(x - s * 0.035, eyeY); ctx.lineTo(x + s * 0.035, eyeY); } ctx.stroke(); continue; }
      const er = expr === 'surpreso' ? s * 0.05 : s * 0.042;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, eyeY, er * 1.05, er * 0.9, 0, 0, 7); ctx.fill();
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(x + (expr === 'concentrado' ? sx * -s * 0.005 : 0), eyeY + s * 0.004, er * 0.62, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(x - er * 0.25, eyeY - er * 0.3, er * 0.22, 0, 7); ctx.fill();
    }
    // nariz
    ctx.strokeStyle = dark(L.skin, 0.25); ctx.lineWidth = Math.max(1, s * 0.016);
    ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.03); ctx.quadraticCurveTo(cx - s * 0.025, cy + s * 0.075, cx + s * 0.012, cy + s * 0.08); ctx.stroke();
    // boca
    const my = cy + s * 0.145; ctx.lineWidth = Math.max(1.3, s * 0.02); ctx.strokeStyle = '#6b2a22';
    if (expr === 'feliz') { ctx.beginPath(); ctx.arc(cx, my - s * 0.03, s * 0.065, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else if (expr === 'rindo') { ctx.fillStyle = '#5a1d18'; ctx.beginPath(); ctx.moveTo(cx - s * 0.075, my - s * 0.02); ctx.quadraticCurveTo(cx, my + s * 0.1, cx + s * 0.075, my - s * 0.02); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(cx - s * 0.05, my - s * 0.017, s * 0.1, s * 0.022); }
    else if (expr === 'surpreso') { ctx.fillStyle = '#5a1d18'; ctx.beginPath(); ctx.ellipse(cx, my, s * 0.035, s * 0.048, 0, 0, 7); ctx.fill(); }
    else if (expr === 'bravo' || expr === 'triste') { ctx.beginPath(); ctx.arc(cx, my + s * 0.05, s * 0.055, Math.PI + 0.4, -0.4); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(cx - s * 0.04, my); ctx.quadraticCurveTo(cx, my + (expr === 'cansado' ? -0.004 : 0.012) * s, cx + s * 0.04, my); ctx.stroke(); }
    if (expr === 'feliz' || expr === 'rindo') { ctx.fillStyle = 'rgba(255,110,110,.22)'; ctx.beginPath(); ctx.arc(cx - s * 0.16, cy + s * 0.08, s * 0.045, 0, 7); ctx.arc(cx + s * 0.16, cy + s * 0.08, s * 0.045, 0, 7); ctx.fill(); }
    if (expr === 'cansado') { ctx.strokeStyle = 'rgba(80,60,120,.35)'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.arc(cx - ex, eyeY + s * 0.04, s * 0.03, 0.3, Math.PI - 0.3); ctx.stroke(); ctx.beginPath(); ctx.arc(cx + ex, eyeY + s * 0.04, s * 0.03, 0.3, Math.PI - 0.3); ctx.stroke(); }
  };
  const accessory = (ctx, L, cx, cy, s, shirt) => {
    if (L.acc === 1) { ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = Math.max(1.4, s * 0.02); const y = cy - s * 0.02; [-1, 1].forEach(sx => { rr(ctx, cx + sx * s * 0.105 - s * 0.07, y - s * 0.05, s * 0.14, s * 0.1, s * 0.03); ctx.stroke(); }); ctx.beginPath(); ctx.moveTo(cx - s * 0.035, y); ctx.lineTo(cx + s * 0.035, y); ctx.stroke(); }
    if (L.acc === 2) { ctx.fillStyle = dark(shirt, 0.25); ctx.beginPath(); ctx.ellipse(cx, cy - s * 0.2, s * 0.32, s * 0.2, 0, Math.PI, 0); ctx.fill(); rr(ctx, cx - s * 0.05, cy - s * 0.22, s * 0.42, s * 0.06, s * 0.03); ctx.fill(); }
    if (L.acc === 3) { ctx.strokeStyle = '#20232e'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.arc(cx, cy - s * 0.04, s * 0.33, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.fillStyle = '#2b2f3d'; [-1, 1].forEach(sx => { rr(ctx, cx + sx * s * 0.33 - s * 0.06, cy - s * 0.08, s * 0.12, s * 0.17, s * 0.05); ctx.fill(); }); ctx.fillStyle = '#8b5cf6'; [-1, 1].forEach(sx => { ctx.fillRect(cx + sx * s * 0.33 - s * 0.012, cy - s * 0.04, s * 0.024, s * 0.08); }); }
  };

  // retrato: cabeça e ombros centralizados em (cx, cy) com tamanho s
  A.portrait = (ctx, L, cx, cy, s, opts) => {
    opts = opts || {}; const expr = opts.expr || 'neutro';
    const headY = cy - s * 0.08;
    // ombros
    const shirt = L.shirt || '#8b5cf6';
    const g = ctx.createLinearGradient(cx, cy + s * 0.2, cx, cy + s * 0.6); g.addColorStop(0, light(shirt, 0.08)); g.addColorStop(1, dark(shirt, 0.25));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.56, s * (L.body === 'b' ? 0.4 : 0.44), s * 0.3, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(cx - s * (L.body === 'b' ? 0.4 : 0.44), cy + s * 0.55, s * (L.body === 'b' ? 0.8 : 0.88), s * 0.2);
    backHair(ctx, L, cx, headY, s);
    // pescoço
    ctx.fillStyle = dark(L.skin, 0.12); rr(ctx, cx - s * 0.08, headY + s * 0.18, s * 0.16, s * 0.2, s * 0.05); ctx.fill();
    ctx.fillStyle = dark(shirt, 0.15); ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.29, s * 0.12, s * 0.05, 0, 0, Math.PI); ctx.fill();
    // orelhas
    ctx.fillStyle = dark(L.skin, 0.05); [-1, 1].forEach(sx => { ctx.beginPath(); ctx.ellipse(cx + sx * s * 0.285, headY + s * 0.02, s * 0.045, s * 0.065, 0, 0, 7); ctx.fill(); });
    // cabeça
    const hg = ctx.createRadialGradient(cx - s * 0.08, headY - s * 0.08, s * 0.05, cx, headY, s * 0.36); hg.addColorStop(0, light(L.skin, 0.08)); hg.addColorStop(1, dark(L.skin, 0.08));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(cx, headY, s * 0.28, s * 0.31, 0, 0, 7); ctx.fill();
    if (L.beard) { ctx.fillStyle = U.rgba(dark(L.hairColor === '#f0f0f0' ? '#9a9a9a' : L.hairColor, 0.05), 0.82); ctx.beginPath(); ctx.ellipse(cx, headY + s * 0.17, s * 0.21, s * 0.14, 0, 0, Math.PI); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx, headY + s * 0.11, s * 0.1, s * 0.03, 0, 0, 7); ctx.fill(); }
    face(ctx, L, cx, headY, s, expr);
    frontHair(ctx, L, cx, headY, s);
    accessory(ctx, L, cx, headY, s, shirt);
  };
  // desenha um retrato preenchendo um <canvas> (com fundo)
  A.toCanvas = (cv, L, opts) => {
    opts = opts || {};
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth || cv.width, h = cv.clientHeight || cv.height;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    if (opts.bg !== false) { const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, opts.bg || '#2a2350'); g.addColorStop(1, '#141923'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
    A.portrait(ctx, L, w / 2, h * 0.56, Math.min(w, h) * (opts.scale || 0.86), opts);
  };
  // inicial colorida para quem não tem rosto (contas, marcas)
  A.initial = (cv, text, color) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1); const w = cv.clientWidth || 38, h = cv.clientHeight || 38;
    cv.width = w * dpr; cv.height = h * dpr; const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = color || '#475069'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff'; ctx.font = '800 ' + Math.round(h * 0.42) + 'px Sora, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((text || '?').slice(0, 1).toUpperCase(), w / 2, h / 2 + 1);
  };

  // boneco visto de cima (3/4) para casa, cidade e lugares. (x, y) = posição dos pés
  A.sprite = (ctx, L, x, y, s, o) => {
    o = o || {}; const dir = o.dir || 'down'; const ph = o.walk || 0; const step = Math.sin(ph) * 3 * s;
    ctx.save(); ctx.translate(x, y);
    if (o.sleep) { ctx.rotate(-Math.PI / 2); ctx.translate(0, -6 * s); }
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 0, 9 * s, 3.5 * s, 0, 0, 7); ctx.fill();
    const flip = dir === 'left' ? -1 : 1; ctx.scale(flip, 1);
    const pants = L.pants || '#2a2f3d', shirt = L.shirt || '#8b5cf6';
    if (!o.sit) {
      ctx.fillStyle = dark(pants, 0.1); rr(ctx, -5 * s, -12 * s + Math.max(0, step), 4 * s, 12 * s - Math.max(0, step), 1.5 * s); ctx.fill();
      ctx.fillStyle = pants; rr(ctx, 1 * s, -12 * s + Math.max(0, -step), 4 * s, 12 * s - Math.max(0, -step), 1.5 * s); ctx.fill();
      ctx.fillStyle = '#1b1d24'; rr(ctx, -5.5 * s, -2 * s + Math.max(0, step) * 0, 5 * s, 2.5 * s, 1 * s); ctx.fill(); rr(ctx, 0.5 * s, -2 * s, 5 * s, 2.5 * s, 1 * s); ctx.fill();
    } else { ctx.fillStyle = pants; rr(ctx, -5.5 * s, -9 * s, 11 * s, 6 * s, 2 * s); ctx.fill(); }
    const by = o.sit ? -9 * s : -12 * s;
    const sg = ctx.createLinearGradient(0, by - 13 * s, 0, by); sg.addColorStop(0, light(shirt, 0.1)); sg.addColorStop(1, dark(shirt, 0.18));
    ctx.fillStyle = sg; rr(ctx, -7 * s, by - 13 * s, 14 * s, 14 * s, 4 * s); ctx.fill();
    const arm = o.sit ? 0 : -step * 0.8;
    ctx.fillStyle = dark(shirt, 0.08); rr(ctx, -9.5 * s, by - 12 * s + arm, 3.5 * s, 9 * s, 1.8 * s); ctx.fill(); rr(ctx, 6 * s, by - 12 * s - arm, 3.5 * s, 9 * s, 1.8 * s); ctx.fill();
    ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(-7.7 * s, by - 2.5 * s + arm, 1.9 * s, 0, 7); ctx.arc(7.7 * s, by - 2.5 * s - arm, 1.9 * s, 0, 7); ctx.fill();
    // cabeça
    const hy = by - 20 * s;
    if (L.hair === 5 || L.hair === 4 || L.hair === 7) { ctx.fillStyle = dark(L.hairColor, 0.15); ctx.beginPath(); ctx.ellipse(0, hy + (L.hair === 7 ? -1 : 3) * s, (L.hair === 7 ? 11.5 : 9.5) * s, (L.hair === 5 ? 11 : 9.5) * s, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = L.skin; ctx.beginPath(); ctx.arc(0, hy, 8 * s, 0, 7); ctx.fill();
    ctx.fillStyle = L.hairColor;
    if (dir === 'up') { ctx.beginPath(); ctx.arc(0, hy - 0.5 * s, 8.4 * s, 0, 7); ctx.fill(); }
    else if (L.hair !== 0) { ctx.beginPath(); ctx.ellipse(0, hy - 3 * s, 8.4 * s, 5.8 * s, 0, Math.PI * 0.98, Math.PI * 2.02); ctx.fill(); if (L.hair === 2) { ctx.beginPath(); ctx.ellipse(1 * s, hy - 8 * s, 5 * s, 3 * s, -0.2, 0, 7); ctx.fill(); } if (L.hair === 8 || L.hair === 6) { ctx.beginPath(); ctx.arc(dir === 'down' ? 0 : -6 * s, hy - 8.5 * s, 3 * s, 0, 7); ctx.fill(); } }
    else { ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(0, hy - 3.5 * s, 8 * s, 5 * s, 0, Math.PI, 0); ctx.fill(); ctx.globalAlpha = 1; }
    if (L.acc === 2) { ctx.fillStyle = dark(shirt, 0.3); ctx.beginPath(); ctx.ellipse(0, hy - 4 * s, 8.6 * s, 5 * s, 0, Math.PI, 0); ctx.fill(); if (dir !== 'up') { rr(ctx, -2 * s, hy - 5 * s, 11 * s, 2.5 * s, 1.2 * s); ctx.fill(); } }
    if (L.acc === 3) { ctx.strokeStyle = '#20232e'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(0, hy, 8.6 * s, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    if (dir !== 'up' && !o.sleep) {
      ctx.fillStyle = '#2a1a14'; const ox = dir === 'down' ? 0 : 2.5 * s;
      ctx.beginPath(); ctx.arc(-2.8 * s + ox, hy + 1 * s, 1.1 * s, 0, 7); if (dir === 'down') ctx.arc(2.8 * s, hy + 1 * s, 1.1 * s, 0, 7); ctx.fill();
      if (L.acc === 1) { ctx.strokeStyle = '#111'; ctx.lineWidth = 0.9 * s; ctx.strokeRect(-4.6 * s + ox, hy - 0.3 * s, 3.6 * s, 2.6 * s); if (dir === 'down') ctx.strokeRect(1 * s, hy - 0.3 * s, 3.6 * s, 2.6 * s); }
    }
    if (o.sleep) { ctx.fillStyle = '#2a1a14'; ctx.fillRect(-3.5 * s, hy + 0.8 * s, 2.5 * s, 0.7 * s); ctx.fillRect(1 * s, hy + 0.8 * s, 2.5 * s, 0.7 * s); }
    ctx.restore();
  };

  // aparência aleatória (para pessoas genéricas na cidade e no público)
  A.randomLook = r => {
    r = r || Math.random; const D = SL.D; const p = a => a[Math.floor(r() * a.length)];
    return { skin: p(D.skins), hair: Math.floor(r() * 9), hairColor: p(D.hairColors.slice(0, 6)), shirt: p(D.shirtColors), pants: p(['#2a2f3d', '#3a4a6b', '#4a3a2a', '#1d2230', '#5a5f6e']), acc: r() < 0.25 ? Math.floor(r() * 3) + 1 : 0, beard: r() < 0.2 ? 1 : 0, body: r() < 0.5 ? 'a' : 'b' };
  };
})(window.SL);

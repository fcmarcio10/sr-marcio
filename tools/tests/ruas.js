// Varredura: nenhum objeto no meio das ruas (asfalto, terra, bloquete) nem das vielas de terra das comunidades.
// Confere colisões (casas, árvores, postes, objetos, muros), árvores/postes/prédios, objetos baixos (addProp),
// muros e o chão (algum decalque cobrindo a pista). Uso (de dentro de tools/tests): node ruas.js [--fotos]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  // cópia do jogo que anota os objetos baixos, os muros e as vielas enquanto o mapa é montado
  let html = fs.readFileSync(path.join(__dirname, 'wrapped.html'), 'utf8');
  const patch = (a, b) => { if (!html.includes(a)) { console.log('NÃO ACHEI:', a); process.exit(1); } html = html.replace(a, b); };
  patch('function addProp(type, x, y, opt) {\n  opt = opt || {};', 'function addProp(type, x, y, opt) {\n  opt = opt || {}; (window.__P = window.__P || []).push({ type, x, y, w: opt.w || 0, h: opt.h || 0, col: opt.col || null, cr: opt.cr || 0 });');
  patch('function addWall(x0, y0, x1, y1, color, opt) {\n  opt = opt || {};', 'function addWall(x0, y0, x1, y1, color, opt) {\n  opt = opt || {}; (window.__W = window.__W || []).push({ x0, y0, x1, y1, kind: opt.kind || \'wall\' });');
  patch('function decal(x0, y0, x1, y1, type, opt) {', 'function decal(x0, y0, x1, y1, type, opt) {\n  if (type === \'earth\' && (Math.abs(x1 - x0 - 16) < 0.5 || Math.abs(y1 - y0 - 16) < 0.5 || Math.abs(y1 - y0 - 22) < 0.5)) (window.__V = window.__V || []).push([x0, y0, x1, y1]);');
  const tmp = path.join(__dirname, '_ruas.html'); fs.writeFileSync(tmp, html);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + tmp);
  await p.waitForFunction(() => !document.getElementById('loading'), null, { timeout: 90000 });
  const R = await p.evaluate(() => {
    const M = 3; // tolerância (encostar na beira não conta)
    const roads = [];
    for (const e of World.edges) {
      const r = e.h ? [e.a.x, e.a.y - e.hw, e.b.x, e.a.y + e.hw] : [e.a.x - e.hw, e.a.y, e.a.x + e.hw, e.b.y];
      roads.push({ r, nome: e.name, tipo: e.T.asphalt ? (['street', 'avenue'].includes(e.T.id) && /Serra|Feio|Cara|Laje|Campinho|Padaria do Morro|Baile|Esperança Que Sobe/.test(e.name) ? 'bloquete?' : 'asfalto') : 'terra', e });
    }
    for (const n of World.nodes) roads.push({ r: [n.x - n.hx, n.y - n.hy, n.x + n.hx, n.y + n.hy], nome: 'cruzamento ' + n.edges.map((e) => e.name).filter((v, i, a) => a.indexOf(v) === i).join(' x '), tipo: 'cruzamento' });
    for (const v of window.__V || []) roads.push({ r: v, nome: 'viela da comunidade', tipo: 'viela' });
    const fura = (a, x0, y0, x1, y1) => { const r = a.r; const ix = Math.min(r[2], x1) - Math.max(r[0], x0), iy = Math.min(r[3], y1) - Math.max(r[1], y0); return ix > M && iy > M ? Math.min(ix, iy) : 0; };
    const achados = [];
    const testa = (o, x0, y0, x1, y1, oque) => {
      for (const a of roads) {
        const d = fura(a, x0, y0, x1, y1); if (!d) continue;
        // quanto entra na pista (do lado mais perto); objeto inteiro dentro = no meio
        achados.push({ oque, x: Math.round((x0 + x1) / 2), y: Math.round((y0 + y1) / 2), w: Math.round(x1 - x0), h: Math.round(y1 - y0), rua: a.nome, tipo: a.tipo, entra: Math.round(d) });
      }
    };
    // 1) colisões
    const vistos = new Set();
    for (const cell of colGrid.cells) if (cell) for (const c of cell) {
      if (vistos.has(c)) continue; vistos.add(c);
      if (c.tag === 'rail') continue;
      if (c.tag === 'car' && PARKED.some((p) => Math.abs(p.x - (c.x0 + c.x1) / 2) < 1 && Math.abs(p.y - (c.y0 + c.y1) / 2) < 1) && Math.min(c.x1 - c.x0, c.y1 - c.y0) <= 27) continue; // carro estacionado na vaga da rua (de propósito)
      if (c.t === 0) testa(c, c.x0, c.y0, c.x1, c.y1, 'colisão:' + c.tag + (c.brk ? '/' + c.brk.kind + (c.brk.obj && c.brk.obj.type ? ':' + c.brk.obj.type : '') : ''));
      else testa(c, c.x - c.r, c.y - c.r, c.x + c.r, c.y + c.r, 'colisão:' + c.tag + (c.brk ? '/' + c.brk.kind + (c.brk.obj && c.brk.obj.type ? ':' + c.brk.obj.type : '') : ''));
    }
    // 2) árvores, postes, prédios e outros altos
    for (const t of World.tall) {
      if (t.kind === 'bld') testa(t, t.x0, t.y0, t.x1, t.y1, 'prédio/casa');
      else if (t.kind === 'tree') testa(t, t.x - 5, t.y - 5, t.x + 5, t.y + 5, 'árvore:' + t.type);
      else if (t.kind === 'lamp') testa(t, t.x - 4, t.y - 4, t.x + 4, t.y + 4, 'poste');
      else if (t.x0 !== undefined) testa(t, t.x0, t.y0, t.x1, t.y1, 'alto:' + t.kind);
      else if (t.x !== undefined) testa(t, t.x - 5, t.y - 5, t.x + 5, t.y + 5, 'alto:' + t.kind);
    }
    // 3) objetos baixos (lixeira, banco, cone, pneu, caixote...)
    for (const q of (typeof World !== 'undefined' && World.props) || window.__P || []) {
      const hw = q.w ? q.w / 2 : q.cr || 5, hh = q.h ? q.h / 2 : q.cr || 5;
      testa(q, q.x - hw, q.y - hh, q.x + hw, q.y + hh, 'objeto:' + q.type);
    }
    // 4) muros e cercas
    for (const w of window.__W || []) testa(w, w.x0, w.y0, w.x1, w.y1, 'muro:' + w.kind);
    // 5) chão: pedaço da pista que virou outra coisa (decalque por cima)
    const nomeSF = Object.fromEntries(Object.entries(SF).map(([k, v]) => [v, k]));
    const chao = {};
    for (const a of roads) {
      if (a.tipo === 'viela') continue;
      const [x0, y0, x1, y1] = a.r;
      for (let y = y0 + 6; y < y1 - 5; y += 10) for (let x = x0 + 6; x < x1 - 5; x += 10) {
        const g = groundAt(x, y);
        if (g === SF.ROAD || g === SF.DIRT || g === SF.BRIDGE || g === SF.WATER && a.e && a.e.bridge) continue;
        const k = a.nome + ' → ' + nomeSF[g]; (chao[k] = chao[k] || []).push([Math.round(x), Math.round(y)]);
      }
    }
    return { achados, chao, nRoads: roads.length, nVielas: (window.__V || []).length, nProps: (window.__P || []).length, nWalls: (window.__W || []).length, nCol: vistos.size };
  });
  console.log('ruas/cruzamentos/vielas conferidos:', R.nRoads, '(vielas', R.nVielas + ')', '| colisões', R.nCol, '| objetos baixos', R.nProps, '| muros', R.nWalls);
  // agrupa iguais (mesmo tipo de objeto na mesma rua)
  const grupos = {};
  for (const a of R.achados) { const k = a.oque + ' @ ' + a.rua + ' [' + a.tipo + ']'; (grupos[k] = grupos[k] || []).push(a); }
  const ks = Object.keys(grupos).sort();
  console.log('\nOBJETOS NA PISTA:', R.achados.length, 'em', ks.length, 'grupos');
  for (const k of ks) console.log(' ', grupos[k].length + 'x', k, '→', grupos[k].slice(0, 6).map((a) => `(${a.x},${a.y} ${a.w}x${a.h} entra ${a.entra})`).join(' '));
  const cks = Object.keys(R.chao);
  console.log('\nCHÃO DA PISTA TROCADO:', cks.length);
  for (const k of cks) console.log(' ', R.chao[k].length, 'pontos', k, '→', R.chao[k].slice(0, 4).map((q) => q.join(',')).join(' | '));
  if (process.argv.includes('--json')) fs.writeFileSync(path.join(__dirname, 'ruas.json'), JSON.stringify(R));
  if (errs.length) console.log('ERROS:', errs.slice(0, 5).join('\n'));
  await b.close(); fs.unlinkSync(tmp);
})();

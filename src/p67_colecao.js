/* ============================ COLECIONÁVEIS ============================
   30 panelas de barro escondidas, 15 placas de zoeira na beira das estradas e 12 pontos turísticos para
   fotografar com o app Câmera do celular. Cada coleção completa dá um prêmio. Tudo montado com sorteio próprio
   (não mexe no sorteio do mapa) e salvo em Profile.col = { p: {}, s: {}, f: {} }. */
const COL_PLACAS = [
  'PROIBIDO PROIBIR', 'CUIDADO: LOMBADA INVISÍVEL', 'ATENÇÃO: SOGRA NA PISTA', 'FIADO SÓ AMANHÃ',
  'BURACO TOMBADO PELO PATRIMÔNIO', 'SINAL DE CELULAR SÓ NA PONTA DO PÉ', 'CACHORRO MANSO. O DONO NÃO',
  'VELOCIDADE MÁXIMA: A QUE O CARRO AGUENTAR', 'VACA TEM PREFERÊNCIA', 'AQUI JAZ UM AMORTECEDOR',
  'SORRIA, VOCÊ ESTÁ SENDO FILMADO (MENTIRA)', 'RETORNO A 50 KM (OU MAIS)', 'PROIBIDO JOGAR LIXO. SUJEITO A FOFOCA',
  'DEVAGAR: CRIANÇA, IDOSO E GALINHA', 'BEM-VINDO A SÃO GAMBIARRA. AQUI TUDO DÁ UM JEITO',
];
const COL_FOTOS = ['praca', 'ponte', 'mirante', 'convento', 'ponte3', 'caixa', 'orlacamburi', 'barra', 'pedra', 'porto', 'campao', 'fazenda'];
const COL_INFO = {
  p: { nome: 'Panelas de barro', premio: 5000, cor: '#b8643a' },
  s: { nome: 'Placas de zoeira', premio: 3000, cor: '#f2c43a' },
  f: { nome: 'Fotos turísticas', premio: 4000, cor: '#3a9be0' },
};
const Colecao = { panelas: [], placas: [], fotos: [], t: 0, flashT: 0 };
function colSave() { if (!Profile.col) Profile.col = { p: {}, s: {}, f: {} }; return Profile.col; }

// monta onde fica cada coisa (depois do mapa pronto; sorteio próprio, sempre igual)
Colecao.monta = function () {
  const R = mulberry32(3030), edges = World.edges.filter((e) => e.len > 220 && !e.bridge);
  const ok = (x, y, L, dmin) => {
    if (x < 260 || y < 260 || x > WORLD_W - 260 || y > WORLD_H - 260) return false;
    const g = groundAt(x, y); if (g === SF.ROAD || g === SF.DIRT || g === SF.BRIDGE || g === SF.WATER) return false;
    if (areaBlocked(x - 7, y - 7, x + 7, y + 7)) return false;
    return L.every((q) => Math.abs(q.x - x) > dmin || Math.abs(q.y - y) > dmin);
  };
  const porReg = {};
  const lugar = (L, n, dmin, maxReg, longe) => {
    for (let tent = 0; tent < 6000 && L.length < n; tent++) {
      const e = edges[Math.floor(R() * edges.length)], s = 40 + R() * (e.len - 80), sd = R() < 0.5 ? 1 : -1;
      const o = e.hw + (e.T.sw ? e.T.sw : 0) + longe + R() * 10, nx = e.h ? 0 : 1, ny = e.h ? 1 : 0;
      const x = e.a.x + e.dx * s + nx * o * sd, y = e.a.y + e.dy * s + ny * o * sd, rk = regionKeyAt(x, y);
      const k = L === Colecao.panelas ? 'p' + rk : 's' + rk;
      if ((porReg[k] || 0) >= maxReg || !ok(x, y, L, dmin)) continue;
      porReg[k] = (porReg[k] || 0) + 1;
      L.push({ id: L.length, x, y, reg: rk, a: e.h ? 0 : Math.PI / 2, sd });
    }
  };
  this.panelas.length = 0; this.placas.length = 0;
  lugar(this.panelas, 30, 420, 3, 4);
  lugar(this.placas, 15, 700, 2, 10);
  this.placas.forEach((q, i) => { q.txt = COL_PLACAS[i % COL_PLACAS.length]; });
  this.fotos = COL_FOTOS.map((id) => World.pois.find((p) => p.id === id)).filter(Boolean);
};

// pega a panela e lê a placa passando perto; confere os prêmios
Colecao.update = function (dt) {
  if (!player || Game.mode !== 'play' || Game.state !== 'playing') return;
  this.flashT = Math.max(0, this.flashT - dt);
  this.camT = (this.camT || 0) - dt;
  if (this.camT <= 0 && Screens.current === 'screen-phone' && Phone.app === 'camera') { this.camT = 1; Phone.render(); } // câmera acompanha o caminho
  this.t -= dt; if (this.t > 0) return; this.t = 0.15;
  const C = colSave(), px = player.x, py = player.y;
  for (const q of this.panelas) if (!C.p[q.id] && Math.abs(q.x - px) < 24 && Math.abs(q.y - py) < 24) {
    C.p[q.id] = clockStr(); AudioSys.chime(); pay(50);
    toast('Panela de barro ' + Object.keys(C.p).length + '/' + this.panelas.length, 'Achou uma panela das paneleiras escondida em ' + REGIONS[q.reg].name + '.', 'good');
    this.premio('p');
  }
  for (const q of this.placas) if (!C.s[q.id] && Math.abs(q.x - px) < 70 && Math.abs(q.y - py) < 70) {
    C.s[q.id] = clockStr(); AudioSys.chime(); pay(50);
    toast('Placa de zoeira ' + Object.keys(C.s).length + '/' + this.placas.length, '"' + q.txt + '"', 'good');
    this.premio('s');
  }
};
Colecao.total = function (k) { return k === 'p' ? this.panelas.length : k === 's' ? this.placas.length : this.fotos.length; };
Colecao.premio = function (k) {
  const C = colSave(); C.ok = C.ok || {};
  if (C.ok[k] || Object.keys(C[k]).length < this.total(k)) return;
  C.ok[k] = true; const I = COL_INFO[k];
  setTimeout(() => { AudioSys.chime(); pay(I.premio, 'Coleção completa: ' + I.nome + '!'); toast('Coleção completa!', I.nome + ' — prêmio de R$ ' + fmtMoney(I.premio), 'good'); }, 900);
};
// ponto turístico mais perto ainda sem foto
Colecao.pontoPerto = function () {
  const C = colSave(); let best = null, bd = 1e9;
  for (const q of this.fotos) { if (C.f[q.id]) continue; const d = Math.hypot(q.x - player.x, q.y - player.y); if (d < bd) { bd = d; best = q; } }
  return best ? { q: best, d: bd } : null;
};
Colecao.FOTO_R = 260;
Colecao.fotografa = function () {
  const P = this.pontoPerto(); if (!P || P.d > this.FOTO_R) { phoneTone(300, 0.08, 0.05); return; }
  const C = colSave(); C.f[P.q.id] = clockStr(); this.flashT = 0.35;
  AudioSys.noise(0.08, 3000, 1, 0.12, 'ui', 'highpass'); phoneTone(1500, 0.04, 0.05, 0.08); pay(100);
  toast('Foto: ' + P.q.name, 'Foto ' + Object.keys(C.f).length + '/' + this.fotos.length + ' do álbum turístico.', 'good');
  this.premio('f'); Phone.render(); setTimeout(() => { if (Phone.app === 'camera') Phone.render(); }, 380);
};

// desenho no chão (só o que está perto da tela)
Colecao.desenha = function (ctx, view) {
  const C = colSave();
  for (const q of this.panelas) {
    if (C.p[q.id] || !inView(view, q.x, q.y, 20)) continue;
    const x = q.x, y = q.y;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x + 1.5, y + 1.5, 6.5, 5.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a3a22'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); // panela de barro vista de cima
    ctx.fillStyle = '#8a4e2c'; ctx.beginPath(); ctx.arc(x - 0.5, y - 0.5, 4.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#3a2016'; ctx.beginPath(); ctx.arc(x - 0.5, y - 0.5, 1.4, 0, TAU); ctx.fill(); // pegador da tampa
    ctx.fillStyle = '#6a3a22'; ctx.fillRect(x - 8, y - 1.2, 2.4, 2.4); ctx.fillRect(x + 5.6, y - 1.2, 2.4, 2.4); // alças
    if ((Game.time * 0.7 + q.id * 0.37) % 4 < 0.12) { ctx.fillStyle = 'rgba(255,240,200,0.9)'; ctx.fillRect(x - 3, y - 4, 1.5, 1.5); } // brilho de vez em quando
  }
  for (const q of this.placas) {
    if (!inView(view, q.x, q.y, 40)) continue;
    const lido = !!C.s[q.id];
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-13, 3, 28, 5);
    ctx.fillStyle = '#6a6a6a'; ctx.fillRect(-11, 4, 2, 4); ctx.fillRect(9, 4, 2, 4); // pés
    ctx.fillStyle = lido ? '#c9a83a' : '#f2c43a'; ctx.fillRect(-14, -4, 28, 9); // placa amarela
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1; ctx.strokeRect(-13.5, -3.5, 27, 8);
    ctx.fillStyle = '#1a1a1a'; for (let i = 0; i < 3; i++) ctx.fillRect(-10 + i * 7, -1, 5, 1.2); ctx.fillRect(-8, 1.5, 15, 1.2); // "letras"
    ctx.restore();
  }
};

/* ---------- apps do celular ---------- */
function cameraHTML() {
  const C = colSave(), P = Colecao.pontoPerto(), n = Object.keys(C.f).length, tot = Colecao.fotos.length;
  const dirTxt = (q) => { const a = Math.atan2(q.y - player.y, q.x - player.x), d = ['leste', 'sudeste', 'sul', 'sudoeste', 'oeste', 'noroeste', 'norte', 'nordeste']; return d[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; };
  let h = '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Câmera</div>';
  h += '<p class="ph-desc">Chegue perto de um ponto turístico e tire a foto. Álbum completo vale R$ ' + fmtMoney(COL_INFO.f.premio) + '.</p>';
  const perto = P && P.d <= Colecao.FOTO_R;
  h += `<div class="cam-view${perto ? ' ok' : ''}${Colecao.flashT > 0 ? ' flash' : ''}"><i class="cam-c tl"></i><i class="cam-c tr"></i><i class="cam-c bl"></i><i class="cam-c br"></i>` +
    (perto ? `<b>${escapeHtml(P.q.name)}</b><span>No enquadramento</span>` : n >= tot ? '<b>Álbum completo!</b><span>Você fotografou todos os pontos</span>' :
      `<b>Nada para fotografar aqui</b><span>${P ? 'Mais perto: ' + escapeHtml(P.q.name) + ' — ' + (P.d * 0.09 >= 1000 ? (P.d * 0.09 / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(P.d * 0.09 / 10) * 10 + ' m') + ' ao ' + dirTxt(P.q) : ''}</span>`) + '</div>';
  h += `<button class="cam-shot" data-foto="1" ${perto ? '' : 'disabled'} title="Fotografar"><i></i></button>`;
  h += `<div class="col-sub">Álbum turístico · ${n}/${tot}</div><div class="cam-album">` +
    Colecao.fotos.map((q) => `<div class="cam-ph${C.f[q.id] ? ' ok' : ''}"><span>${C.f[q.id] ? escapeHtml(q.name) : '?'}</span></div>`).join('') + '</div>';
  return h;
}
function colecaoHTML() {
  const C = colSave();
  let h = '<div class="ph-head"><button class="ph-back" data-go="home">‹</button>Coleção</div>';
  h += '<p class="ph-desc">Coisas escondidas por São Gambiarra inteira. Cada coleção completa dá um prêmio.</p>';
  const card = (k, extra) => {
    const I = COL_INFO[k], n = Object.keys(C[k]).length, tot = Colecao.total(k), done = C.ok && C.ok[k];
    return `<div class="col-card"><div class="col-top"><i style="background:${I.cor}"></i><b>${I.nome}</b><em>${n}/${tot}</em></div>` +
      `<div class="col-bar"><i style="width:${(n / Math.max(1, tot) * 100).toFixed(0)}%;background:${I.cor}"></i></div>` +
      `<small>${done ? 'Completa! Prêmio de R$ ' + fmtMoney(I.premio) + ' recebido.' : 'Prêmio ao completar: R$ ' + fmtMoney(I.premio)}</small>${extra}</div>`;
  };
  // panelas: quantas faltam em cada bairro (a dica para explorar)
  const reg = {}; for (const q of Colecao.panelas) { const r = reg[q.reg] || (reg[q.reg] = [0, 0]); r[1]++; if (C.p[q.id]) r[0]++; }
  const pz = Object.entries(reg).sort((a, b) => (a[1][0] === a[1][1]) - (b[1][0] === b[1][1]) || REGIONS[a[0]].name.localeCompare(REGIONS[b[0]].name))
    .map(([k, v]) => `<span class="col-chip${v[0] === v[1] ? ' ok' : ''}">${escapeHtml(REGIONS[k].name)} ${v[0]}/${v[1]}</span>`).join('');
  h += card('p', '<div class="col-hint">Por bairro:</div><div class="col-chips">' + pz + '</div>');
  const lidas = Colecao.placas.filter((q) => C.s[q.id]);
  h += card('s', lidas.length ? '<ul class="col-list">' + lidas.map((q) => `<li>"${escapeHtml(q.txt)}"</li>`).join('') + '</ul>' : '<div class="col-hint">Placas amarelas na beira das ruas e estradas. Passe perto para ler.</div>');
  h += card('f', '<div class="col-hint">Use o app Câmera perto dos pontos turísticos.</div>');
  return h;
}
// uma linha explicando cada app (embaixo do título)
const PH_DESC = {
  mapa: 'Veja a cidade e marque um destino no GPS.', msgs: 'Conversas com o Seu Zé, o Seu Biu e o banco.', pegaai: 'Fique online, aceite corridas e leve passageiros.',
  fretes: 'Entregas e cargas. Um frete por vez.', carteira: 'Seu dinheiro, contas e empréstimo.', racha: 'Corridas de madrugada valendo dinheiro.',
  conquistas: 'Desafios cumpridos e os prêmios de cada um.', ajustes: 'Som, mensagens, notificações e papel de parede.',
};
function phComDescricao(app, html) {
  const d = PH_DESC[app]; if (!d || html.indexOf('ph-desc') >= 0) return html;
  const i = html.indexOf('</div>', html.indexOf('class="ph-head"')); if (html.indexOf('class="ph-head"') < 0 || i < 0) return html;
  return html.slice(0, i + 6) + `<p class="ph-desc">${d}</p>` + html.slice(i + 6);
}

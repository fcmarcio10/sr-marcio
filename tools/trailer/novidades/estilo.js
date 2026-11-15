// Vídeo "Novidades do BR Night Drive": ajudantes das cenas (roda depois do criando/estilo.js).
(() => {
  const T = window.TR;
  // voz ou música do jogo que entra na montagem (o mix.py lê 'VOZ' e corta no 'VOZ_PARA' da mesma cena)
  T.vozJogo = function (clip) { if (T.rec) T.som.push([T.quadro(), 'VOZ', [clip]]); };
  T.paraVoz = function () { if (T.rec) T.som.push([T.quadro(), 'VOZ_PARA', []]); };
  // rádio tocando uma música: letreiro "Tocando agora" (o áudio entra na montagem)
  T.musicaRadio = function (i, mudo) {
    const M = RADIO_MUSICAS[i]; Settings.radioOff = false; if (!(Settings.radio > 0)) Settings.radio = 70;
    Radio.fila = []; Radio.play(radioFaixa(M), 0);
    if (Radio.a) { try { Radio.a.pause(); } catch (e) {} Radio.a.onended = null; Radio.a = null; }
    if (!mudo) T.vozJogo(M.clip);
  };
  // buraco novo bem no caminho do carro (desenhado no chão e com a tremida do jogo)
  T.buraco = function (x, y, k) {
    k = k || 1; const p = { x, y, k, a: 0.6 };
    bake(x - 16, y - 16, x + 16, y + 16, 5.6, (g) => drawBuraco(g, p));
    World.buracos.push({ x, y, r: 9 * k, t: -9 }); clearChunks();
  };
  // pedestre parado num ponto (até ser atropelado)
  T.pedestre = function (x, y) {
    const an = Animals.list.find((a) => a.type === 'person' && !a.morto && Math.hypot(a.x - x, a.y - y) > 300);
    an.x = x; an.y = y; an.v = 0; an.state = 'idle'; an.t = 99; an.a = Math.PI / 2; an.danceUntil = 0; return an;
  };
})();

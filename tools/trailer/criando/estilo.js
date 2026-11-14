// Visual do vídeo do YouTube "Estou criando um jogo de carro...": cor quase natural do jogo, rádio do DJ no ar
// quando a cena pede (TR.dj) e desligada no resto. Roda depois do cena.js, gameplay/extra.js, cinema/estilo.js,
// anuncio/estilo.js (botão Inscrever-se) e noite/estilo.js (letreiro TR.hora, rodopio TR.casca, fumaça).
(() => {
  const T = window.TR;
  const _reset = T.reset;
  T.reset = function (opt) {
    opt = opt || {};
    _reset(opt);
    T.grade(opt.grade === undefined ? 0.16 : opt.grade);
    canvas.style.filter = opt.filtro || 'contrast(1.05) saturate(1.12) brightness(1.03)';
    if (!opt.radio) { Settings.radioOff = true; if (window.Radio) Radio.stop(); }
    Profile.rachaMsg = true; // sem o convite de racha do Zé do Canecão pipocando nas cenas
    if (typeof Phone !== 'undefined') { Phone.pgTab = 'drv'; Phone.pgChat = null; }
  };
  // cena que continua a anterior (sem reset): o letreiro, o aviso e as estrelinhas da cena de antes não voltam
  const _limpa = T.limpaGags;
  T.limpaGags = function () { _limpa(); T.ho = null; T.no = null; T.tn = null; T.ra = null; };
  // DJ no ar: o letreiro da Rádio Gambiarra FM com a legenda; o áudio entra na montagem (mudo = só o letreiro)
  T.dj = function (clip, mudo) {
    const S = RADIO.find((r) => r.clip === clip) || RADIO_VINHETAS.find((r) => r.clip === clip); if (!S) return;
    Settings.radioOff = false; if (!(Settings.radio > 0)) Settings.radio = 70;
    Radio.fila = []; Radio.play(S, 0);
    if (Radio.a) { try { Radio.a.pause(); } catch (e) {} Radio.a.onended = null; Radio.a = null; }
    if (T.rec && !mudo) T.som.push([T.quadro(), 'VOZ', [clip]]);
  };
})();

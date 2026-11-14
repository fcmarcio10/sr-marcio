
/* ============================ NÍVEL DE MOTORISTA E REPUTAÇÃO ============================
   Experiência (XP) vem de tudo que paga: entregas, corridas, eventos, conquistas...
   A nota no PegaAí (média das últimas 30 corridas) e o nível liberam corridas melhores:
   Aeroporto, Mudança e VIP. Cliente mal atendido manda áudio xingando no WhatsApp. */
const LEVEL_MAX = 30;
const LEVEL_TITLES = [[1, 'Motorista de primeira viagem'], [3, 'Barbeiro em recuperação'], [5, 'Motorista de aplicativo'], [8, 'Conhece todo atalho'], [12, 'Rei da BR-101'], [16, 'Lenda da madrugada'], [20, 'Taxista honorário'], [25, 'Patrimônio da cidade'], [30, 'Dono das ruas de São Gambiarra']];
function xpNeed(L) { return 120 + 80 * (L - 1); }
function career() {
  if (!Profile.career) Profile.career = { lvl: 1, xp: 0, ratings: [], acc: { comum: true, aero: true, mudanca: true, vip: true } };
  return Profile.career;
}
function levelTitle(L) { let t = LEVEL_TITLES[0][1]; for (const [l, n] of LEVEL_TITLES) if (L >= l) t = n; return t; }
function recentRating() { const r = career().ratings; if (!r.length) return Profile.rides ? Profile.ratingSum / Profile.rides : 5; return r.reduce((a, b) => a + b, 0) / r.length; }
function ratingTier() {
  const n = career().ratings.length, v = recentRating();
  if (n < 5) return ['Novato', '#9aa2b6'];
  return v >= 4.8 ? ['Diamante', '#7fe3ff'] : v >= 4.6 ? ['Ouro', '#ffcc2e'] : v >= 4.3 ? ['Prata', '#cfd6e2'] : ['Bronze', '#d98a4a'];
}
function fmtRating(v) { return v.toFixed(1).replace('.', ','); }
function gainXP(n) {
  n = Math.round(n); if (n <= 0) return;
  const C = career(); if (C.lvl >= LEVEL_MAX) return;
  C.xp += n;
  while (C.lvl < LEVEL_MAX && C.xp >= xpNeed(C.lvl)) { C.xp -= xpNeed(C.lvl); C.lvl++; levelUp(C.lvl); }
  if (C.lvl >= LEVEL_MAX) C.xp = 0;
}
function levelUp(L) {
  const bonus = L * 50;
  Profile.money += bonus; Profile.earned += bonus; UI.moneyDelta(bonus);
  AudioSys.chime(); AudioSys.tone(523, 0.12, 'triangle', 0.08, 'ui', null, 0.15); AudioSys.tone(784, 0.25, 'triangle', 0.08, 'ui', null, 0.3);
  const el = $('levelup');
  if (el) { $('lu-num').textContent = 'NÍVEL ' + L; $('lu-title').textContent = levelTitle(L) + ' · bônus R$ ' + fmtMoney(bonus); el.classList.remove('hidden', 'go'); void el.offsetWidth; el.classList.add('go'); clearTimeout(levelUp.t); levelUp.t = setTimeout(() => el.classList.add('hidden'), 4200); }
  for (const [id, T] of Object.entries(RIDE_TYPES)) if (T.lvl === L) addMsg('PegaAí', 'Nova categoria liberada!', 'Parabéns, você chegou ao nível ' + L + '! Agora você pode receber corridas ' + T.name + '. ' + T.desc + (T.rating ? ' Só manter a nota acima de ' + fmtRating(T.rating) + '.' : ''), false);
}

// ---------- tipos de corrida ----------
const RIDE_TYPES = {
  comum: { name: 'PegaAí', mult: 1, lvl: 1, rating: 0, w: 3, desc: 'Corridas normais pela cidade.' },
  aero: { name: 'PegaAí Aeroporto', mult: 1.3, lvl: 2, rating: 0, w: 1.3, desc: 'Passageiro com mala e hora do voo marcada. Atrasou, ele perde o avião.' },
  mudanca: { name: 'PegaAí Mudança', mult: 1.8, lvl: 3, rating: 0, w: 1.3, desc: 'Precisa de Kombo, picape ou Unho com escada. Carga frágil: cada batida quebra alguma coisa.' },
  vip: { name: 'PegaAí VIP', mult: 2.4, lvl: 5, rating: 4.5, w: 1.1, desc: 'Cliente exigente: carro limpo e inteiro, sem batida e sem demora. Paga muito bem.' },
};
const VIPS = ['Doutor Valdemar', 'Influencer Kamylla', 'Deputada Rosimeire', 'Empresário Juvenal', 'Jogador do Gambiarra FC', 'Cantor de Pagode Thiaguinho do Morro', 'Desembargador Otacílio', 'Fazendeiro do Agro de Goiás', 'Influencer de Floripa', 'Cantor de Sertanejo Universitário Repetente'];
const MUDANCA_ITENS = ['a geladeira', 'a TV de 50 polegadas', 'o espelho da vó', 'a cristaleira', 'o aquário', 'a máquina de lavar', 'o vaso de planta da sogra'];
const AERO_FALAS = ['"Meu voo sai daqui a pouco, pelo amor de Deus, corre!"', '"Esqueci o passaporte... não, achei! Bora, bora!"', '"Se eu perder esse voo, a lua de mel acaba antes de começar."'];
const VIP_FALAS = ['"Ar no 21, por favor. Nem 20, nem 22."', '"Evite buracos. Meu terno custou mais que esse carro."', '"Você tem água com gás? Não? Hum."'];
function rideTypeCheck(id) {
  const T = RIDE_TYPES[id], C = career();
  if (C.lvl < T.lvl) return 'Libera no nível ' + T.lvl;
  if (T.rating && career().ratings.length >= 3 && recentRating() < T.rating) return 'Precisa de nota ' + fmtRating(T.rating) + ' (a sua: ' + fmtRating(recentRating()) + ')';
  if (id === 'mudanca' && !['van', 'pickup', 'escada'].includes(player.car.model)) return 'Precisa de Kombo, picape ou Unho com escada';
  if (id === 'vip' && (Profile.damage > 30 || (Profile.dirt || 0) > 0.4)) return 'Carro amassado ou sujo demais pra VIP';
  return null;
}
function airportPt() {
  if (!World.airport) { const e = World.edges.filter((x) => x.T.id === 'highway').sort((a, b) => Math.max(b.a.x, b.b.x) - Math.max(a.a.x, a.b.x))[0], x = Math.max(e.a.x, e.b.x) - 70; World.airport = { x, y: e.a.y + e.T.lanes[e.T.lanes.length - 1], name: 'Aeroporto de Vitorinha (acesso pela BR)' }; }
  return World.airport;
}
// substitui o pedido de corrida: escolhe o tipo pelo nível, nota e carro
function newRideRequest() {
  const C = career(), opts = [];
  for (const [id, T] of Object.entries(RIDE_TYPES)) if (C.acc[id] !== false && !rideTypeCheck(id)) opts.push([id, T.w]);
  const type = opts.length ? wpick(opts) : 'comum', T = RIDE_TYPES[type];
  const near = World.homes.concat(World.shops.map((s) => ({ x: s.x, y: s.y, name: s.name })));
  const pool = near.filter((h) => { const d = Math.hypot(h.x - player.x, h.y - player.y); return d > 250 && d < 1300; });
  const pk = pick(pool.length ? pool : near);
  let ds;
  if (type === 'aero') ds = airportPt();
  else if (type === 'mudanca') { const dd = World.homes.filter((h) => { const d = Math.hypot(h.x - pk.x, h.y - pk.y); return d > 1200 && d < 3500; }); ds = pick(dd.length ? dd : World.homes); }
  else { const dd = near.filter((h) => { const d = Math.hypot(h.x - pk.x, h.y - pk.y); return d > 900 && d < 3600; }); ds = pick(dd.length ? dd : near); }
  const len = routeLen(pk, ds);
  const R = { type, name: type === 'vip' ? pick(VIPS) : pick(PASSAGEIROS), pick: { x: pk.x, y: pk.y, name: pk.name }, dest: { x: ds.x, y: ds.y, name: ds.name }, len, fare: Math.round((8 + len * 0.048) * T.mult), stage: 'pickup', hits: 0, t: 0, seed: rnd(), broke: [] };
  if (type === 'aero' || type === 'vip') R.tmax = len / (type === 'aero' ? 235 : 210) + (type === 'aero' ? 28 : 35);
  R.rid = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e4);
  Act.ride = R; Act.gpsT = 0;
  setTimeout(() => { if (Act.ride === R && R.stage === 'pickup') pgMsg(R, pick(PG_PICKUP[type])); }, rnd(2500, 5000));
  AudioSys.tone(988, 0.1, 'square', 0.06, 'ui'); AudioSys.tone(1319, 0.14, 'square', 0.06, 'ui', null, 0.12);
  toast(T.name + ': nova corrida', R.name + ' em ' + pk.name + ' · R$ ' + R.fare, type === 'comum' ? 'info' : 'good');
}
function rideOnBoard(R) {
  if (R.type === 'aero') return pick(AERO_FALAS);
  if (R.type === 'vip') return pick(VIP_FALAS);
  if (R.type === 'mudanca') return '"Cuidado com ' + pick(MUDANCA_ITENS) + ', que é herança de família!"';
  return pick(FALAS_EMBARQUE);
}
function rideHit(R) {
  R.hits++;
  if (R.type === 'mudanca') { const it = pick(MUDANCA_ITENS.filter((x) => !R.broke.includes(x)).concat(['mais alguma coisa'])); R.broke.push(it); toast('Quebrou ' + it + '!', R.name + ': "Ai, meu Deus do céu!"', 'bad'); }
  else if (R.type === 'vip') toast(R.name, pick(['"Isso vai pra minha assessoria."', '"Você sabe com quem está falando?"', '"Que experiência lamentável."']), 'bad');
  else toast(R.name, pick(FALAS_BATIDA), 'bad');
}
function rideFinish(R) {
  const late = R.tmax ? R.t > R.tmax : R.t > R.len / 120 + 40;
  let s = 5;
  if (R.type === 'aero') s -= R.hits + (late ? 3 : 0);
  else if (R.type === 'mudanca') s -= Math.round(R.hits * 1.5) + (late ? 1 : 0);
  else if (R.type === 'vip') s -= R.hits * 2 + (late ? 2 : 0) + ((Profile.dirt || 0) > 0.4 ? 1 : 0);
  else s -= R.hits + (late ? 1 : 0);
  const stars = clamp(s, 1, 5);
  const tipK = stars === 5 ? { comum: 0.1, aero: 0.2, mudanca: 0.15, vip: 0.35 }[R.type] : 0;
  let v = Math.round(R.fare * (0.6 + stars * 0.1));
  if (R.type === 'aero' && late) v = Math.round(R.fare * 0.4);
  const tip = Math.round(v * tipK);
  Profile.rides++; Profile.ratingSum += stars;
  const C = career(); C.ratings.push(stars); if (C.ratings.length > 30) C.ratings.shift();
  if (R.type === 'vip' && stars === 5) Profile.vipOk = (Profile.vipOk || 0) + 1;
  pgChat(R).stars = stars;
  Act.ride = null; Act.rideT = rnd(4, 9);
  pay(v + tip, (RIDE_TYPES[R.type].name) + ' ' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + (tip ? ' + gorjeta' : '') + ' · ' + R.name);
  gainXP(stars * 4 + { comum: 0, aero: 15, mudanca: 15, vip: 30 }[R.type]);
  if (R.type === 'aero' && late) setTimeout(() => toast(R.name, '"Perdi o voo! Agora vou de ônibus pra Vitorinha, com galinha no colo."', 'bad'), 1200);
  if (stars <= 2) setTimeout(() => angryVoice(R, late), rnd(6000, 12000));
  else if (stars === 5) setTimeout(() => {
    if (R.type !== 'vip' && Math.random() < 0.45) happyVoice(R);
    else pgMsg(R, R.type === 'vip' ? 'Serviço impecável. Vou te recomendar pro meu círculo de amigos. E olha que meu círculo é exclusivo.' : pick(['Valeu pela corrida, motorista! Nota 5!', 'Corrida top, chegou rapidinho!', 'Melhor motorista de São Gambiarra, bicho!', 'Bah, que corrida tri! Valeu, tchê!', 'Oxe, chegou foi ligeiro! Nota 5, visse?', 'Uai, nem senti os buracos, sô!', 'Égua, que motorista pai d\'égua!']));
  }, 7000);
  saveGame();
}

// ---------- áudios de cliente bravo ----------
// clip: arquivo de voz embutido no jogo; sem clip, o celular "fala" o texto
const VOICE_LINES = [
  { clip: 'xingo1', g: 'm', when: 'hits', text: 'Ô, motorista! Você dirige igual minha vó de chinelo! Quase que eu fui parar no para-brisa! Uma estrela é muito pra você, viu!' },
  { clip: 'xingo2', g: 'f', when: 'hits', text: 'Moço, eu pedi um carro, não um carrinho de bate-bate! Meu café tá todinho na minha blusa! Vou te denunciar pro PegaAí, viu!' },
  { clip: 'xingo3', g: 'm', when: 'hits3', text: 'A gente bateu TRÊS vezes! Três! Nem no autódromo eu passei tanto aperto. Vai fazer autoescola de novo, vai!' },
  { clip: 'vip', g: 'f', when: 'vip', text: 'Querido, eu sou cliente VIP, tá? V-I-P! E você me tratou que nem saco de batata. Vou postar isso pros meus duzentos mil seguidores!' },
  { clip: 'mudanca', g: 'f', when: 'mudanca', text: 'Minha geladeira chegou parecendo uma sanfona! Minha sogra vai me matar... e depois eu te mato! Brincadeira. Ou não.' },
  { clip: 'demora', g: 'm', when: 'late', text: 'Demorou tanto que eu fiquei mais velho dentro desse carro. Cheguei atrasado e ainda com torcicolo. Uma estrela, e olhe lá!' },
  { clip: 'aero', g: 'm', when: 'aero', text: 'Perdi o voo! PERDI O VOO! Agora vou ter que ir pra Vitorinha de ônibus, com galinha no colo. Obrigado, viu, campeão!' },
  // mais falas
  { clip: 'p_bicho', g: 'm', when: 'hits', text: 'Ô bicho, que corrida foi essa? Quase quebrei o joelho no banco da frente! Vou dar uma estrela e olhe lá, mermão!' },
  { clip: 'p_ahla', g: 'f', when: 'hits3', text: 'Ai, meu Deus! Bateu de novo! Tô passando mal demais nesse carro. Me deixa aqui que eu vou a pé!' },
  { clip: 'p_moqueca', g: 'm', when: 'hits', text: 'Rapá, tu pegou todo buraco de São Gambiarra. Minha moqueca chegou virada dentro da panela. Era o almoço de domingo da família, e agora virou sopa!' },
  { clip: 'p_tartaruga', g: 'f', when: 'late', text: 'Ô meu querido, eu pedi um carro e chegou uma tartaruga! Já dava pra ter ido de canoa pelo Rio Jururu. Que isso, bicho!' },
  { clip: 'p_sofa', g: 'm', when: 'mudanca', text: 'Meu sofá chegou com mais buraco que a BR depois da chuva! Rasgou tudo, mermão! Um prejuízo daqueles!' },
  { clip: 'p_aviao', g: 'f', when: 'aero', text: 'O avião foi embora e eu fiquei aqui olhando pro céu igual bobo. Valeu, piloto de fogão!' },
  { clip: 'p_vip2', g: 'm', when: 'vip', text: 'Olha, eu moro na parte chique de Camburiso, tá? Lá ninguém anda nesse sacolejo. Que experiência mais cafona, bicho.' },
  // sotaques de vários cantos do Brasil
  { clip: 'p_uai', g: 'm', when: 'hits3', text: 'Uai, sô! Cê bateu esse trem três vezes e ainda quer cinco estrelas? Nem minha vó dirige assim, uai! Uma estrela, e olhe lá!' },
  { clip: 'p_bah', g: 'f', when: 'hits', text: 'Bah, tchê! Que barbaridade de corrida! Quase derramei o chimarrão inteiro no colo. Uma estrela pra ti, e olhe lá!' },
  { clip: 'p_oxe', g: 'f', when: 'hits', text: 'Oxente, meu filho! Tu acha que eu sou saco de cimento, é? Nunca vi barbeiragem desse tamanho, visse? Uma estrela, e já é muito!' },
  { clip: 'p_meu', g: 'm', when: 'late', text: 'Meu, que rolê demorado! Mais lento que avenida às seis da tarde em dia de chuva. Uma estrela pra você, mano. Sem ressentimento, tá?' },
  { clip: 'p_caraca', g: 'm', when: 'mudanca', text: 'Caraca, mermão! Minha televisão chegou parecendo arte moderna! Agora vou ter que assistir novela em formato de sanfona!' },
  { clip: 'p_egua', g: 'f', when: 'late', text: 'Égua, mana! Demorou tanto que deu tempo de tomar um açaí, fazer uma tapioca e ainda lavar a louça! Uma estrela, e é de presente!' },
  // cliente feliz (corrida de 5 estrelas)
  { clip: 'p_top1', g: 'f', when: 'top', text: 'Motorista nota mil! Chegou rapidinho, carro cheiroso e ainda tava tocando a Rádio Gambiarra. Cinco estrelas e um beijo!' },
  { clip: 'p_top2', g: 'm', when: 'top', text: 'Ô trem bão, sô! Corrida macia que nem pão de queijo quentinho. Cinco estrelas procê, viu? Deus te abençoe!' },
  { clip: 'p_top3', g: 'm', when: 'top', text: 'Aí sim, mano! Dirigiu igual piloto de Fórmula 1, mas sem bater em nada! Cinco estrelas, e ainda vou te dar gorjeta!' },
];
// áudios dos personagens do jogo (clip opcional; sem clip o celular lê o texto)
const CHAR_VOICES = {
  ze_fiado: { from: 'Seu Zé (Oficina)', text: 'Ô meu filho, cadê o meu dinheiro? A caderneta já tá com cheiro de mofo! Paga o fiado aí que eu sou amigo, mas não sou de ferro, bicho!' },
  ze_nao: { from: 'Seu Zé (Oficina)', text: 'Rapá, de novo? Ainda tem fiado pendurado aqui! Fiado é igual sogra: uma vez a gente aguenta, duas já é abuso. Acerta comigo que eu vou voando!' },
  biu_socorro: { from: 'Seu Biu (Bananas)', text: 'Ô meu patrão, a carreta tombou! Tá banana pra todo lado, parece feira depois de terremoto! Me ajuda aqui, pelo amor de Deus, que eu pago cada caixa!' },
  boas_vindas: { from: 'Seu Zé (Oficina)', text: 'Ô meu filho, seja bem-vindo a São Gambiarra! Aqui é o Seu Zé, da oficina. Pegou a chave do carro? Então bora rodar: corrida no PegaAí, frete, e foge dos buracos, que aqui tem mais buraco que queijo suíço. Bateu? Vem na oficina que eu ajeito. Vai com Deus, e devagar, viu?' },
  banco_atraso: { from: 'Banestresse', text: 'Olá. Aqui é a assistente virtual do Banestresse. Identificamos uma parcela em atraso. Os juros já estão trabalhando por você. Tenha uma ótima noite.' },
};
function charVoice(key, from, fallbackText) {
  const C = CHAR_VOICES[key]; if (!C) return null;
  const m = addMsg(from || C.from, '', C.text, false);
  if (Settings.msgMode === 'texto') return m;
  m.voice = { clip: key, dur: (VOICE_CLIPS[key] && VOICE_CLIPS[key].dur) || Math.max(5, Math.round(C.text.length / 14)) };
  if (Screens.current === 'screen-phone') Phone.render();
  return m;
}
function angryVoice(R, late) {
  const want = R.type === 'vip' ? 'vip' : R.type === 'mudanca' ? 'mudanca' : R.type === 'aero' && late ? 'aero' : R.hits >= 3 ? 'hits3' : R.hits >= 1 ? 'hits' : 'late';
  let opts = VOICE_LINES.filter((l) => l.when === want);
  if (want === 'hits3') opts = opts.concat(VOICE_LINES.filter((l) => l.when === 'hits'));
  // voz de homem para passageiro, voz de mulher para passageira
  const g = genderOf(R.name), same = opts.filter((l) => l.g === g);
  if (same.length) opts = same;
  const L = pick(opts);
  pgMsg(R, L.text, { clip: L.clip, dur: (VOICE_CLIPS[L.clip] && VOICE_CLIPS[L.clip].dur) || Math.max(5, Math.round(L.text.length / 14)) });
  Profile.angry = (Profile.angry || 0) + 1;
}
// áudio de cliente feliz (corrida de 5 estrelas); passageira recebe voz de mulher quando tem
function happyVoice(R) {
  let opts = VOICE_LINES.filter((l) => l.when === 'top');
  const g = genderOf(R.name), same = opts.filter((l) => l.g === g);
  if (same.length) opts = same;
  const L = pick(opts);
  pgMsg(R, L.text, { clip: L.clip, dur: (VOICE_CLIPS[L.clip] && VOICE_CLIPS[L.clip].dur) || Math.max(5, Math.round(L.text.length / 14)) });
}
const FEM = /^(Dona|Thaís|Bia|Kelly|Vó|Professora|Influencer|Deputada|Tia|Jéssica|Rayane)/;
function genderOf(name) { return FEM.test(name) ? 'f' : 'm'; }
const VoicePlayer = { a: null, msg: null, t0: 0 };
VoicePlayer.play = function (m) {
  this.stop(); // a rádio fica em silêncio enquanto o áudio toca (Radio.update)
  const vol = clamp(((Settings.master !== undefined ? Settings.master : 80) / 100), 0, 1);
  this.msg = m; this.t0 = performance.now(); m.voice.heard = true;
  const c = VOICE_CLIPS[m.voice.clip];
  if (c) { try { this.a = new Audio(c.src); this.a.volume = vol; this.a.play().catch(() => {}); this.a.onended = () => this.stop(); } catch (e) { this.a = null; } }
  else if (window.speechSynthesis) {
    try { const u = new SpeechSynthesisUtterance(m.body); u.lang = 'pt-BR'; u.rate = 1.12; u.pitch = 0.9; u.volume = vol; const v = speechSynthesis.getVoices().find((x) => /pt[-_]BR/i.test(x.lang)); if (v) u.voice = v; u.onend = () => this.stop(); speechSynthesis.speak(u); } catch (e) {}
  }
  this.tick();
};
VoicePlayer.stop = function () {
  if (this.a) { try { this.a.pause(); } catch (e) {} this.a = null; }
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
  const was = this.msg; this.msg = null;
  if (was) document.querySelectorAll('.wa-voice.playing').forEach((el) => el.classList.remove('playing'));
};
VoicePlayer.tick = function () {
  if (!this.msg) return;
  const m = this.msg, k = clamp((performance.now() - this.t0) / 1000 / m.voice.dur, 0, 1);
  const el = document.querySelector('.wa-voice[data-vid="' + m.vid + '"]');
  if (el) { el.classList.add('playing'); const f = el.querySelector('.wv-fill'); if (f) f.style.width = (k * 100).toFixed(1) + '%'; }
  if (k >= 1 && !this.a) { this.stop(); return; }
  requestAnimationFrame(() => this.tick());
};

/* ---------- Rádio Gambiarra FM 171,1: programação no ar o tempo todo ----------
   O DJ Biruta fala sem parar (quadros, comerciais, ouvintes ligando), com vinheta entre um e outro.
   Ao ligar (ou voltar depois de um tempo fora), a rádio "sintoniza" num ponto qualquer da programação,
   às vezes no meio de uma fala, como rádio de verdade. Liga e desliga: tecla F, botão Rádio no painel
   ou Configurações (Ligada/Desligada e volume). Fica em silêncio enquanto toca áudio do zap/PegaAí,
   com o paredão ligado e na contagem do racha, e continua depois.
   cond: 'chuva' só quando está chovendo, 'seco' só sem chuva. then: o que entra logo em seguida. */
const RADIO = [
  { clip: 'radio_01', tag: 'Abertura', text: 'Alôôô, motorista da madrugada! Tá ligado na Rádio Gambiarra FM, cento e setenta e um vírgula um: a rádio que não te engana... muito! Aqui é o DJ Biruta, e a noite é nossa!' },
  { clip: 'radio_02', tag: 'Previsão do tempo', text: 'Previsão do tempo pra São Gambiarra: céu nublado, noventa por cento de chance de chuva e cem por cento de chance de buraco na pista! Leva o guarda-chuva e o macaco, que o pneu vai furar!' },
  { clip: 'radio_03', tag: 'Plantão do futebol', text: 'Plantão do futebol! O Vasco ligou aqui pra rádio querendo ser vice também no nosso concurso de piadas. Calma, torcedor vascaíno, é brincadeira! Vice também sobe no pódio... ali do ladinho.' },
  { clip: 'radio_04', tag: 'Pergunta do ouvinte', text: 'Pergunta do ouvinte: o Palmeiras tem Mundial? A produção foi conferir e... a ligação caiu! E um abraço pro torcedor corintiano que ainda tá pagando o estádio no carnê!' },
  { clip: 'radio_05', tag: 'Plantão do futebol', text: 'Atenção, torcedor do Flamengo: aquele cheirinho de título voltou! Ah, não... é o churrasquinho da esquina. E o Botafogo ganhou de virada do próprio azar. Coisas que só acontecem com o Botafogo!' },
  { clip: 'radio_06', tag: 'Futebol pelo Brasil', text: 'Lá em Minas, o Galo cantou de madrugada e acordou até o torcedor do Cruzeiro. E no Sul, gremista e colorado dividiram um chimarrão em paz... mentira, isso nunca aconteceu!' },
  { clip: 'radio_07', tag: 'Boletim do trânsito', text: 'Boletim do trânsito: a Ponte Nova continua em obras desde mil novecentos e oitenta e sete. Previsão de entrega: ano que vem. Que ano? Ninguém sabe, meu amigo!' },
  { clip: 'radio_08', tag: 'Oferta da madrugada', text: 'Oferta da madrugada na Borracharia Furou, Chamou! Você fura o pneu e eles já sabem o seu nome. Atendimento vinte e cinco horas por dia, porque vinte e quatro é pouco!' },
  { clip: 'radio_09', tag: 'Horóscopo do motorista', text: 'Horóscopo do motorista! Áries: cuidado com o pardal. Touro: sua cara-metade tá na próxima corrida do PegaAí. Escorpião... freia, Escorpião! Freia!' },
  { clip: 'radio_10', tag: 'Você sabia?', text: 'Você sabia? Se juntar todos os buracos de São Gambiarra, dá pra fazer uma piscina olímpica! A prefeitura disse que é a piscina mais democrática do Brasil: todo mundo cai!' },
  { clip: 'radio_11', tag: 'Reclame', text: 'PegaAí: o aplicativo que te pega aí... e te larga ali! Recebeu uma estrela? Relaxa, que o passageiro também levou uma do motorista!' },
  { clip: 'radio_12', tag: 'Futebol pelo Brasil', text: 'Notícia boa da Bahia: o torcedor do Bahia e o do Vitória fizeram as pazes... pra brigar de novo sobre quem faz o melhor acarajé. E o torcedor do São Paulo ligou dizendo que é soberano. Soberano de quê? Ele desligou!' },
  { clip: 'radio_13', tag: 'Recado do Seu Zé', text: 'Recado do Seu Zé da oficina: quem tá devendo fiado, a caderneta tá de olho! E quem não tá devendo... bate o carro aí que ele te dá desconto! Palavra do Seu Zé, não da rádio, tá?' },
  { clip: 'radio_14', tag: 'Vinheta', text: 'Rádio Gambiarra FM: tocando o terror na madrugada desde... ontem! Não sai daí, que o DJ Biruta já volta com mais besteira!' },
  { clip: 'radio_15', tag: 'Oficina', text: 'Barulhinho estranho no carro? Na Oficina do Seu Zé o barulho some na hora... junto com o seu dinheiro! Brincadeira, Seu Zé, não corta o meu fiado! Oficina do Seu Zé: conserta tudo, menos coração partido.' },
  { clip: 'radio_16', tag: 'Preço da gasolina', text: 'A gasolina tá tão cara que no Posto Tanque Cheio o frentista agora pergunta: vai encher ou vai só dar uma cheiradinha? E no Posto Estrela Cadente, você abastece, faz um pedido... e o preço sobe de novo!' },
  { clip: 'radio_17', tag: 'Alerta de chuva', cond: 'chuva', text: 'Alerta de chuva em São Gambiarra! Motorista, poça aqui não é poça, é piscina com vista pra pista. Tira o pé, que aquaplanagem ainda não virou esporte olímpico!' },
  { clip: 'radio_18', tag: 'Notícia da roça', text: 'Uai, sô! Lá na Fazenda Muuuito Longe o trem é bão demais da conta! Tem queijo, tem café, tem vaca... e tem estrada de terra que come o seu amortecedor com farofa, uai! Desculpa, gente, me empolguei no sotaque!' },
  { clip: 'radio_19', tag: 'Rali da Vaca Atolada', text: 'Ô, cês que gosta de lama, presta atenção: o Rali da Vaca Atolada tá aí, sô! Cê acelera, a vaca olha, o carro afunda. Prêmio pro primeiro que chegar... e banho de mangueira pro último, uai!' },
  { clip: 'radio_20', tag: 'Notícia da roça', text: 'Notícia da roça, sô: lá no Sítio Bota Fé a galinha botou um ovo do tamanho de pneu de Fuska! O dono falou: isso é trem de Minas, uai, aqui tudo é grande, até a saudade!' },
  { clip: 'radio_21', tag: 'Comercial', text: 'Quer ganhar um dinheirinho na madrugada? Liga o PegaAí no celular e sai buscando passageiro por São Gambiarra! Corrida comum, aeroporto, mudança e até cliente VIP. Só não bate o carro, que estrela não dá em árvore!' },
  { clip: 'radio_22', tag: 'Comercial', text: 'Seu carro tá com cara de geladeira velha? Passa na garagem! Pintura, neon, rebaixado, aerofólio, roda tala larga e até paredão no porta-malas. Fica tão bonito que até o pardal pede pra tirar foto!' },
  { clip: 'radio_23', tag: 'Caminhão do gás', text: 'Tá ouvindo a musiquinha? É o caminhão do gás passando! A Gambiarra FM avisa: frete de gás paga bem, mas vai devagar na lombada, que botijão não usa cinto de segurança!' },
  { clip: 'radio_24', tag: 'Recado', text: 'Recado pros apressadinhos: racha na BR é perigoso, ilegal... e dá um dinheirinho. A rádio não recomenda! Mas se for, aposta no carro vermelho, que vermelho anda mais. Todo mundo sabe disso!' },
  { clip: 'radio_25', tag: 'Comercial', text: 'O Banestresse informa: empréstimo aprovado na hora, dinheiro na hora, e cobrança... toda hora! Banestresse: o único banco que te liga mais que a sua mãe!' },
  { clip: 'radio_26', tag: 'Alerta na BR', text: 'Atenção, motorista da BR! Se você vir banana espalhada na pista, não é miragem: é a carreta do Seu Biu tombada de novo! Ajuda o homem, que ele paga por caixa e ainda dá uma penca de brinde!' },
  { clip: 'radio_27', tag: 'Feira do Rolo', text: 'Feira do Rolo da Madrugada! Lá você troca um rádio sem antena por uma antena sem rádio. É o comércio mais justo do Brasil, meu amigo!' },
  { clip: 'radio_28', tag: 'Plantão do futebol', text: 'Plantão do futebol! O torcedor do Fluminense ligou pra dizer que o time toca tanto a bola que até o juiz entrou na roda. E o santista mandou avisar: tá com saudade do Pelé. A gente também, meu amigo, a gente também!' },
  { clip: 'radio_29', tag: 'Plantão do futebol', text: 'Um ouvinte vascaíno pediu pra gente tocar a música dele no programa. Tocamos! E ela ficou... em segundo lugar na parada. Ô Vasco, até na rádio, rapaz! É brincadeira, Vascão, a gente te ama!' },
  { clip: 'radio_30', tag: 'Futebol pelo Brasil', text: 'Clássico pegando fogo no Norte e Nordeste! Torcedor do Remo e do Paysandu discutiram até o açaí esfriar. E torcedor do Ceará e do Fortaleza brigando pra saber de quem é o mar. Briga boa é briga com praia!' },
  { clip: 'radio_31', tag: 'Boletim da BR', text: 'Boletim da BR-101 e Pouco: tem tanto buraco que os motoristas já dão nome pra eles. O maior se chama Claudinho. Manda um abraço pro Claudinho, que ele tá aí desde o ano passado!' },
  { clip: 'radio_32', tag: 'Dica de passeio', text: 'Dica de passeio: o Convento da Pena lá no alto e a Pedra Azulejo, que nunca viu um azulejo na vida! São Gambiarra: a cidade onde o nome do lugar já é a primeira piada.' },
  { clip: 'radio_33', tag: 'Madrugada', text: 'Já é alta madrugada e você ainda tá rodando? Para no Posto Estrela Cadente e toma um café. É tão forte que acorda até carro parado no estacionamento!' },
  { clip: 'radio_34', tag: 'Ouvinte na linha', text: 'Vamos atender o ouvinte! Alô? Alô? ... Alô? Caiu. Igual o sinal do celular na Mata do Saci. Próximo!' },
  { clip: 'radio_35', tag: 'Horóscopo do motorista', text: 'Horóscopo, parte dois! Leão: hoje você vai achar dinheiro... no fiado do Seu Zé, que é dele. Virgem: arruma esse porta-luvas. Peixes: cuidado com a poça. Sagitário: pé no freio, Sagitário!' },
  { clip: 'radio_36', tag: 'Previsão do tempo', cond: 'seco', text: 'Previsão: noite seca e estrelada em São Gambiarra. Ótima noite pra lavar o carro... porque amanhã chove. É lei!' },
  { clip: 'radio_37', tag: 'Lava-jato', text: 'No lava-jato do Posto Tanque Cheio entra carro sujo e sai carro limpinho, cheiroso... e um motorista mais pobre! Lavou, tá novo!' },
  { clip: 'radio_38', tag: 'Notícia arrepiante', text: 'Notícia arrepiante: um motorista jura que viu o Saci pedindo carona na Mata do Saci. Recusou a corrida? Melhor: é uma perna a menos pra reclamar no PegaAí!' },
  // comerciais com a voz de quem anuncia
  { clip: 'radio_ze', tag: 'Comercial', who: 'Seu Zé', text: 'Oficina do Seu Zé! Bateu, ralou, amassou? Traz que eu ajeito! Aceito dinheiro, pix e fiado... fiado só pra quem tem cara de honesto, hein! Oficina do Seu Zé: seu carro sai novinho... e o meu bolso também!' },
  { clip: 'radio_biu', tag: 'Comercial', who: 'Seu Biu', text: 'Aqui é o Seu Biu! Banana fresquinha, direto da carreta... quando ela não tomba! Penca na promoção! E se você vir uma carreta tombada na BR, sou eu, viu? Me ajuda!' },
  { clip: 'radio_banco', tag: 'Comercial', who: 'Banestresse', text: 'Banestresse. Seu dinheiro em boas mãos. As nossas. Juros a partir de... não se preocupe com isso agora. Banestresse: estressar você é a nossa missão.' },
  { clip: 'radio_posto', tag: 'Comercial', who: 'Posto Tanque Cheio', text: 'Posto Tanque Cheio! Gasolina, etanol, café requentado e banheiro com a chave na recepção. Abasteceu acima de cinquenta reais? Ganha um sorriso do frentista! Posto Tanque Cheio: o tanque enche, a carteira esvazia!' },
  { clip: 'radio_pegaai', tag: 'Comercial', who: 'PegaAí', text: 'PegaAí! Precisa de uma corrida? A gente te pega aí! Precisa chegar na hora? Aí já é outra história! PegaAí: baixe agora... e reze.' },
  // ouvintes ligando (o DJ responde logo depois)
  { clip: 'radio_tonho', tag: 'Ouvinte na linha', who: 'Tonho, da fazenda', then: 'radio_19', text: 'Alô, DJ Biruta? Aqui é o Tonho, lá da Fazenda Muuuito Longe! Ô sô, manda um alô pra minha vaca Mimosa? Ela atolou de novo no rali, mas tá bem, uai! Beijo, Mimosa!' },
  { clip: 'radio_gaucha', tag: 'Ouvinte na linha', who: 'Ouvinte gaúcha', then: 'radio_06', text: 'Bah, DJ! Liguei só pra dizer que o chimarrão tá quente e a rádio tá tri! E manda um abraço pro meu marido, que é motorista do PegaAí... e me deu uma estrela, o pilantra!' },
  { clip: 'radio_marcao', tag: 'Ouvinte na linha', who: 'Marcão, do PegaAí', cond: 'chuva', then: 'radio_17', text: 'Fala, DJ! Aqui é o Marcão, do PegaAí! Mermão, a poça da avenida tá tão grande que agora há pouco passou um surfista. Sério! Valeu, Gambiarra FM!' },
  { clip: 'radio_azulina', tag: 'Ouvinte na linha', who: 'Ouvinte azulina', then: 'radio_30', text: 'Égua, DJ! Liguei pra pedir uma música! Ah, vocês não tocam música? Então conta uma piada do Paysandu, que eu sou azulina, mana!' },
];
// vinhetas curtas entre um quadro e outro
const RADIO_VINHETAS = [
  { clip: 'radio_v1', tag: 'Vinheta', text: 'Gambiarra FM! Cento e setenta e um vírgula um!' },
  { clip: 'radio_v2', tag: 'Vinheta', text: 'Você tá ouvindo a rádio que pega até debaixo da ponte!' },
  { clip: 'radio_v3', tag: 'Vinheta', text: 'DJ Biruta na área! Aumenta o som aí, motorista!' },
  { clip: 'radio_v4', tag: 'Vinheta', text: 'Gambiarra FM: saiu do ar? Dá um tapa no rádio que ela volta!' },
];
const Radio = { a: null, cur: null, mode: 'idle', k: 0, dur: 0, gap: 0, bag: [], fila: [], held: false, heldT: 0, line: -1, parts: null, last: null, lastV: null };
Radio.isOn = function () { return !Settings.radioOff && (Settings.radio === undefined ? 70 : Settings.radio) > 0; };
Radio.vol = function () { return clamp((Settings.master !== undefined ? Settings.master : 80) / 100, 0, 1) * clamp((Settings.radio === undefined ? 70 : Settings.radio) / 100, 0, 1); };
Radio.cond = function (S) {
  if (S.cond === 'chuva') return Weather.rain > 0.15;
  if (S.cond === 'seco') return Weather.rain < 0.05;
  return true;
};
// sorteio sem repetir: passa por todos os quadros antes de repetir um
Radio.next = function () {
  for (let tent = 0; tent < 2; tent++) {
    if (!this.bag.length) {
      this.bag = RADIO.slice();
      for (let i = this.bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]]; }
      if (this.last && this.bag[this.bag.length - 1] === this.last) this.bag.unshift(this.bag.pop());
    }
    for (let i = this.bag.length - 1; i >= 0; i--) if (this.cond(this.bag[i])) { const S = this.bag.splice(i, 1)[0]; this.last = S; return S; }
    this.bag = [];
  }
  return (this.last = RADIO[0]);
};
// próximo bloco da programação: às vezes uma vinheta antes, e o "then" logo depois
Radio.monta = function () {
  const S = this.next(), out = [];
  if (Math.random() < 0.3) { let V = pick(RADIO_VINHETAS); if (V === this.lastV) V = pick(RADIO_VINHETAS); this.lastV = V; out.push(V); }
  out.push(S);
  if (S.then) { const T = RADIO.find((x) => x.clip === S.then); if (T) out.push(T); }
  return out;
};
Radio.play = function (S, off) {
  this.solta();
  const c = VOICE_CLIPS[S.clip];
  this.cur = S; this.mode = 'clip'; this.dur = c ? c.dur : Math.max(4, S.text.length / 14); this.k = off || 0; this.line = -1;
  // legenda: uma frase por vez, no tempo proporcional ao tamanho
  const fr = S.text.split(/(?<=[.!?])\s+/), tot = S.text.length; let acc = 0;
  this.parts = fr.map((f) => { const o = { f, k0: acc / tot }; acc += f.length + 1; return o; });
  if (c) {
    try {
      const a = this.a = new Audio(c.src); a.volume = this.vol();
      if (off) { const pula = () => { try { a.currentTime = off; } catch (e) {} }; if (a.readyState >= 1) pula(); else a.addEventListener('loadedmetadata', pula, { once: true }); }
      a.play().catch(() => {}); a.onended = () => { if (this.a === a) this.fim(); };
    } catch (e) { this.a = null; }
  }
  this.mostra(true);
  $('hr-tag').textContent = S.tag; $('hr-who').textContent = S.who || 'DJ Biruta'; $('hr-txt').textContent = '';
};
// sintoniza num ponto qualquer da programação (às vezes no meio de uma fala), com chiado
Radio.sintoniza = function () {
  this.fila = this.monta().filter((x) => !RADIO_VINHETAS.includes(x));
  const S = this.fila.shift(), c = VOICE_CLIPS[S.clip], d = c ? c.dur : 8;
  if (AudioSys.ok) AudioSys.noise(0.35, 2400, 0.6, 0.05 * this.vol(), 'ui', 'bandpass');
  this.play(S, Math.random() < 0.65 ? d * rnd(0.12, 0.55) : 0);
};
Radio.fim = function () {
  this.solta();
  this.mode = 'gap'; this.gap = this.fila.length ? rnd(0.3, 0.6) : rnd(0.7, 1.6);
  if (!this.fila.length && AudioSys.ok) { // vinheta tocada (três notinhas)
    const v = 0.05 * this.vol();
    AudioSys.tone(523, 0.12, 'triangle', v, 'ui'); AudioSys.tone(659, 0.12, 'triangle', v, 'ui', null, 0.1); AudioSys.tone(784, 0.22, 'triangle', v, 'ui', null, 0.2);
  }
};
Radio.solta = function () {
  if (this.a) { const a = this.a; this.a = null; a.onended = null; try { a.pause(); } catch (e) {} }
  this.cur = null; this.held = false;
};
// desliga de vez (ou para tudo ao sair do jogo); ao ligar de novo, sintoniza em outro ponto
Radio.stop = function () { this.solta(); this.mode = 'idle'; this.fila = []; this.mostra(false); };
Radio.mostra = function (on) {
  const el = $('hud-radio'); if (el) el.classList.toggle('hidden', !on);
  const b = $('hud-radio-btn'); if (b) b.classList.toggle('on', this.isOn());
};
Radio.toggle = function () {
  if (this.isOn()) { this.stop(); Settings.radioOff = true; saveSettings(); syncSettingsUI(); this.mostra(false); toast('Rádio desligada', 'Aperte F (ou o botão Rádio) para ligar de novo.', 'info'); return; }
  Settings.radioOff = false; if (!(Settings.radio > 0)) Settings.radio = 70;
  saveSettings(); syncSettingsUI();
  Som.on = false; VoicePlayer.stop();
  this.sintoniza();
};
document.addEventListener('click', (e) => {
  const t = e.target && e.target.closest ? e.target.closest('#hud-radio, #hud-radio-btn') : null;
  if (t) Radio.toggle();
});
Radio.update = function (dt) {
  const sc = Screens.current;
  const fora = Game.mode !== 'play' || Game.state === 'menu' || sc === 'screen-pause' || sc === 'screen-settings' || sc === 'screen-main' || sc === 'screen-credits';
  const ocupado = !!VoicePlayer.msg || Som.on || !!(Act.race && Act.race.count > 0);
  const btn = $('hud-radio-btn'); if (btn && btn.classList.contains('on') !== this.isOn()) btn.classList.toggle('on', this.isOn());
  if (!this.isOn()) { if (this.mode !== 'idle') this.stop(); return; }
  if (fora || ocupado) {
    // em silêncio: segura a fala onde parou
    if (this.a && !this.a.paused) { this.a.pause(); }
    if (this.mode !== 'idle' && !this.held) { this.held = true; this.heldT = 0; this.mostra(false); }
    if (this.held) this.heldT += dt;
    return;
  }
  if (this.held) {
    this.held = false; this.mostra(this.mode !== 'idle');
    // ficou muito tempo fora do ar: a programação andou, sintoniza em outro ponto
    if (this.heldT > 20) { this.stop(); this.sintoniza(); return; }
    if (this.a) this.a.play().catch(() => {});
  }
  if (this.mode === 'idle') { if (Game.state === 'playing') this.sintoniza(); return; }
  if (this.mode === 'gap') {
    this.gap -= dt; if (this.gap > 0) return;
    if (!this.fila.length) this.fila = this.monta();
    this.play(this.fila.shift(), 0);
    return;
  }
  // tocando uma fala
  this.k = this.a && this.a.currentTime > 0 ? this.a.currentTime : this.k + dt;
  if (this.a) this.a.volume = this.vol();
  if (this.k > this.dur + 1.2) { this.fim(); return; }
  const kk = this.k / Math.max(1, this.dur);
  let i = 0; while (i + 1 < this.parts.length && this.parts[i + 1].k0 <= kk) i++;
  if (i !== this.line) { this.line = i; $('hr-txt').textContent = this.parts[i].f; }
};

function voiceBubble(m, fmtT) {
  if (!m.vid) m.vid = 'v' + Math.floor(Math.random() * 1e9);
  const n = 34, bars = []; let s = m.vid.length * 7.3;
  for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; bars.push(4 + Math.round(s / 233280 * 16 * (0.5 + 0.5 * Math.sin(i * 0.55)))); }
  const d = Math.round(m.voice.dur), dur = '0:' + String(d).padStart(2, '0');
  return `<div class="wa-msg wa-vmsg"><button class="wa-voice${m.voice.heard ? ' heard' : ''}" data-vid="${m.vid}"><span class="wv-play"></span><span class="wv-wave">${bars.map((h) => `<span class="wb" style="height:${h}px"></span>`).join('')}<span class="wv-fill"></span></span><em>${dur}</em></button><small class="wv-tr">Transcrição: ${escapeHtml(m.body)}</small><i>${fmtT(m.t)}</i></div>`;
}

/* ---------- chat do PegaAí (estilo app de corrida, separado do WhatsApp) ----------
   Passageiro não fica com o seu contato: a conversa é dentro do app, uma por corrida. */
const PG_PICKUP = {
  comum: ['Oi! Tô na frente do portão azul.', 'Pode buzinar que eu desço.', 'Tô de camisa amarela, perto da esquina.', 'Já tô na calçada, moço!', 'Oxe, demora não, viu? Tô na esquina.', 'Uai, tô te esperando aqui na porta, sô.', 'Bah, tô aqui de cuia na mão, tchê. Não tem erro.', 'Égua, tô de boné vermelho, pai d\'égua!', 'Mano, tô na frente da padaria, chega mais.'],
  aero: ['Oi! Tô com duas malas, cabe aí?', 'Corre que meu voo não espera, por favor!'],
  mudanca: ['As caixas já tão na calçada!', 'Traz espaço que a geladeira é grande, hein.'],
  vip: ['Estou aguardando. Sem buzina, por favor.', 'Prefiro que não converse durante o trajeto. Obrigado.'],
};
const PG_QUICK = ['Já estou chegando!', 'Cheguei!', 'Tô no trânsito, 2 minutinhos.'];
const PG_ANS = ['Beleza!', 'Ok, tô te esperando.', 'Valeu!', 'Tá bom, sem pressa (mas com um pouco de pressa).'];
function pgChats() { if (!Profile.pg) Profile.pg = { chats: [] }; return Profile.pg.chats; }
function pgUnread() { return pgChats().filter((c) => !c.read).length; }
function pgChat(R) {
  let c = pgChats().find((x) => x.rid === R.rid);
  if (!c) { c = { rid: R.rid, name: R.name, type: R.type || 'comum', t: Math.floor(Profile.time), stars: 0, msgs: [], read: true }; pgChats().unshift(c); if (pgChats().length > 20) pgChats().length = 20; }
  return c;
}
function pgMsg(R, body, voice, me) {
  const c = pgChat(R), m = { body, me: !!me, t: Math.floor(Profile.time) };
  if (voice) m.voice = voice;
  c.msgs.push(m);
  if (!me) {
    c.read = false;
    if (phoneCfg().notif) toast('PegaAí · ' + R.name, voice && Settings.msgMode !== 'texto' ? 'Mensagem de voz' : body, 'info');
    if (phoneCfg().sounds) { AudioSys.tone(880, 0.07, 'sine', 0.07, 'ui'); AudioSys.tone(660, 0.12, 'sine', 0.07, 'ui', null, 0.09); }
  }
  if (Screens.current === 'screen-phone' && Phone.app === 'pegaai') Phone.render();
  return m;
}
function pgFind(rid) { return pgChats().find((c) => c.rid === rid); }
function pgChatHTML(c) {
  c.read = true;
  const T = RIDE_TYPES[c.type] || RIDE_TYPES.comum, fmtT = (t) => { const v = Math.floor(t || 0) % 1440; return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0'); };
  const live = Act.ride && Act.ride.rid === c.rid;
  let h = `<div class="pgc"><div class="pgc-top"><button class="ph-back" data-pgback="1">‹</button><span class="pgc-ava">${escapeHtml(c.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span><div><b>${escapeHtml(c.name)}</b><small>${escapeHtml(T.name)} · ${live ? 'corrida em andamento' : c.stars ? '★'.repeat(c.stars) + '☆'.repeat(5 - c.stars) : 'corrida encerrada'}</small></div></div><div class="pgc-body">`;
  h += '<div class="pgc-note">As mensagens ficam só no app. Seu número não é compartilhado com o passageiro.</div>';
  for (const m of c.msgs) {
    if (m.voice && Settings.msgMode !== 'texto') h += voiceBubble(m, fmtT).replace('class="wa-msg wa-vmsg"', 'class="wa-msg wa-vmsg pgc-in"');
    else h += `<div class="pgc-msg ${m.me ? 'me' : ''}">${escapeHtml(m.body)}<i>${fmtT(m.t)}</i></div>`;
  }
  h += '</div>';
  if (live) h += '<div class="pgc-quick">' + PG_QUICK.map((q, i) => `<button data-pgq="${i}">${escapeHtml(q)}</button>`).join('') + '</div>';
  else h += '<div class="pgc-closed">Corrida encerrada · não dá para enviar mensagens</div>';
  return h + '</div>';
}
function pgListHTML() {
  const L = pgChats();
  if (!L.length) return '<p class="ph-empty">Nenhuma conversa ainda. Fique online e aceite corridas.</p>';
  return L.map((c) => { const last = c.msgs[c.msgs.length - 1]; return `<button class="pg-row${c.read ? '' : ' new'}" data-pgchat="${c.rid}"><span class="pgc-ava">${escapeHtml(c.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span><span class="pg-mid"><b>${escapeHtml(c.name)}</b><small>${last ? (last.me ? 'Você: ' : '') + (last.voice && Settings.msgMode !== 'texto' ? 'Mensagem de voz' : escapeHtml(last.body.slice(0, 48))) : ''}</small></span><em>${escapeHtml((RIDE_TYPES[c.type] || RIDE_TYPES.comum).name.replace('PegaAí ', '').replace('PegaAí', 'Comum'))}</em></button>`; }).join('');
}

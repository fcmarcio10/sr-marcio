
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
  this.stop(); Radio.stop(); // áudio do zap ou do PegaAí corta o DJ
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

/* ---------- Rádio Gambiarra FM 171,1: o DJ Biruta entra no ar de vez em quando ----------
   Volume em Configurações (Rádio); tecla F liga (chama o DJ na hora) e desliga.
   Não toca junto com áudio do zap/PegaAí, com o paredão ligado nem na contagem do racha. */
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
];
const Radio = { a: null, cur: null, t: 25, k: 0, dur: 0, bag: [], first: true, held: false, line: -1, parts: null };
Radio.off = function () { return !!Settings.radioOff || !((Settings.radio === undefined ? 70 : Settings.radio) > 0); };
Radio.vol = function () { return clamp((Settings.master !== undefined ? Settings.master : 80) / 100, 0, 1) * clamp((Settings.radio === undefined ? 70 : Settings.radio) / 100, 0, 1); };
Radio.next = function () {
  if (this.first) { this.first = false; return RADIO[0]; }
  if (!this.bag.length) {
    this.bag = RADIO.slice(1);
    for (let i = this.bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]]; }
    if (this.last && this.bag[this.bag.length - 1] === this.last) this.bag.unshift(this.bag.pop()); // não repete o último
  }
  return (this.last = this.bag.pop());
};
Radio.play = function (S) {
  this.stop();
  const c = VOICE_CLIPS[S.clip];
  this.cur = S; this.k = 0; this.dur = c ? c.dur : Math.max(6, S.text.length / 14); this.line = -1;
  // legenda: uma frase por vez, no tempo proporcional ao tamanho
  const fr = S.text.split(/(?<=[.!?])\s+/), tot = S.text.length; let acc = 0;
  this.parts = fr.map((f) => { const o = { f, k0: acc / tot }; acc += f.length + 1; return o; });
  if (c) { try { this.a = new Audio(c.src); this.a.volume = this.vol(); this.a.play().catch(() => {}); this.a.onended = () => this.stop(); } catch (e) { this.a = null; } }
  const el = $('hud-radio');
  if (el) { $('hr-tag').textContent = S.tag; $('hr-txt').textContent = ''; el.classList.remove('hidden'); }
};
Radio.stop = function () {
  if (this.a) { try { this.a.pause(); } catch (e) {} this.a.onended = null; this.a = null; }
  if (this.cur) { this.cur = null; this.t = rnd(55, 95); }
  this.held = false;
  const el = $('hud-radio'); if (el) el.classList.add('hidden');
};
Radio.toggle = function () {
  if (this.cur) { this.stop(); Settings.radioOff = true; saveSettings(); toast('Rádio desligada', 'Aperte F para chamar o DJ Biruta de novo.', 'info'); return; }
  Settings.radioOff = false; if (!(Settings.radio > 0)) Settings.radio = 70;
  saveSettings(); syncSettingsUI();
  Som.on = false; VoicePlayer.stop();
  this.play(this.next());
};
document.addEventListener('click', (e) => { if (e.target && e.target.closest && e.target.closest('#hud-radio')) Radio.toggle(); }); // tocar no letreiro desliga
Radio.update = function (dt) {
  const sc = Screens.current;
  const hold = Game.mode !== 'play' || Game.state === 'menu' || sc === 'screen-pause' || sc === 'screen-settings' || sc === 'screen-main' || sc === 'screen-credits';
  if (this.cur) {
    if (this.a) {
      if (hold && !this.a.paused) { this.a.pause(); this.held = true; }
      else if (!hold && this.held) { this.held = false; this.a.play().catch(() => {}); }
    }
    if (hold) return;
    if (this.off() || Som.on) { this.stop(); return; }
    this.k = this.a && this.a.currentTime > 0 ? this.a.currentTime : this.k + dt;
    if (this.a) this.a.volume = this.vol();
    if (this.k > this.dur + 1.5) { this.stop(); return; }
    const kk = this.k / Math.max(1, this.dur);
    let i = 0; while (i + 1 < this.parts.length && this.parts[i + 1].k0 <= kk) i++;
    if (i !== this.line) { this.line = i; $('hr-txt').textContent = this.parts[i].f; }
    return;
  }
  if (hold || Game.state !== 'playing' || this.off()) return;
  this.t -= dt;
  if (this.t > 0) return;
  if (VoicePlayer.msg || Som.on || (Act.race && Act.race.count > 0)) { this.t = 8; return; }
  this.play(this.next());
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

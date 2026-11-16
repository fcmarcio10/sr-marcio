
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
  confete(80);
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
// ponto na calçada mais perto (rua da cidade) ou no acostamento (estrada e roça), do lado em que o lugar fica
function naCalcada(x, y) {
  let best = null, bd = Infinity;
  for (const e of World.edges) {
    if (e.bridge) continue;
    const t = clamp(((x - e.a.x) * e.dx + (y - e.a.y) * e.dy), 0, e.len), px = e.a.x + e.dx * t, py = e.a.y + e.dy * t, d = Math.hypot(x - px, y - py);
    if (d < bd) { bd = d; best = { e, px, py }; }
  }
  if (!best || bd > 400) return { x, y };
  const { e, px, py } = best, nx = -e.dy, ny = e.dx, lado = (x - px) * nx + (y - py) * ny >= 0 ? 1 : -1;
  const off = e.hw + (e.T.sw ? e.T.sw * 0.55 : 12);
  return { x: px + nx * off * lado, y: py + ny * off * lado };
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
  const pc = naCalcada(pk.x, pk.y); // o passageiro espera na calçada (ou no acostamento, na roça), nunca no meio da pista
  const R = { type, name: type === 'vip' ? pick(VIPS) : pick(PASSAGEIROS), pick: { x: pc.x, y: pc.y, name: pk.name }, dest: { x: ds.x, y: ds.y, name: ds.name }, len, fare: Math.round((8 + len * 0.048) * T.mult), stage: 'pickup', hits: 0, t: 0, seed: rnd(), broke: [] };
  if (type === 'aero' || type === 'vip') R.tmax = len / (type === 'aero' ? 235 : 210) + (type === 'aero' ? 28 : 35);
  R.rid = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e4);
  Act.ride = R; Act.gpsT = 0;
  setTimeout(() => { if (Act.ride === R && R.stage === 'pickup') { const tx = pick(PG_PICKUP[type]), m = pgMsg(R, tx); if (/\?$/.test(tx)) { m.ask = true; if (Screens.current === 'screen-phone' && Phone.app === 'pegaai') Phone.render(); } } }, rnd(2500, 5000)); // pergunta do passageiro libera mais uma resposta
  AudioSys.tone(988, 0.1, 'square', 0.06, 'ui'); AudioSys.tone(1319, 0.14, 'square', 0.06, 'ui', null, 0.12);
  toast(T.name + ': nova corrida', R.name + ' em ' + pk.name + ' · R$ ' + R.fare, type === 'comum' ? 'info' : 'good');
}
function rideOnBoard(R) {
  if (R.type === 'aero') return pick(AERO_FALAS);
  if (R.type === 'vip') return pick(VIP_FALAS);
  if (R.type === 'mudanca') return '"Cuidado com ' + pick(MUDANCA_ITENS) + ', que é herança de família!"';
  return pick(FALAS_EMBARQUE);
}
// passageiro reage à batida falando (dentro do carro), na voz de homem ou de mulher conforme o nome
const BATIDA_VOZ = { f: ['bt_f1', 'bt_f2', 'bt_f3', 'bt_f4', 'bt_f5'], m: ['bt_m1', 'bt_m2', 'bt_m3', 'bt_m4', 'bt_m5', 'bt_m6', 'bt_m7'], vip: { m: 'bt_vm', f: 'bt_vf' }, quebra: { m: 'bt_qm', f: 'bt_qf' } };
function vozBatida(nome, tipo) {
  if (Game.time < (vozBatida.t || 0)) return; vozBatida.t = Game.time + 3.2;
  const g = genderOf(nome || '') === 'f' ? 'f' : 'm';
  let clip = tipo === 'vip' ? BATIDA_VOZ.vip[g] : tipo === 'quebra' ? BATIDA_VOZ.quebra[g] : pick(BATIDA_VOZ[g].filter((c) => c !== vozBatida.ult));
  vozBatida.ult = clip; const C = VOICE_CLIPS[clip]; if (!C) return;
  Legenda.fala(nome ? nome.split(' ')[0] : (g === 'f' ? 'Passageira' : 'Passageiro'), tipo === 'quebra' ? '[reclama da mudança balançando]' : '[reclama da batida]', 2.5);
  try { const a = new Audio(C.src); a.volume = clamp((Settings.master !== undefined ? Settings.master : 80) / 100, 0, 1) * 0.55; a.play().catch(() => {}); } catch (e) {} // mais baixa (nov/2026: 0,9 → 0,55)
}
function rideHit(R) {
  R.hits++;
  if (R.type === 'mudanca') { const it = pick(MUDANCA_ITENS.filter((x) => !R.broke.includes(x)).concat(['mais alguma coisa'])); R.broke.push(it); vozBatida(R.name, 'quebra'); }
  else if (R.type === 'vip') vozBatida(R.name, 'vip');
  else vozBatida(R.name); // sem aviso escrito: o passageiro fala
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
  Desafios.conta('corrida'); if (stars >= 5) Desafios.conta('corrida5');
  const C = career(); C.ratings.push(stars); if (C.ratings.length > 30) C.ratings.shift();
  if (R.type === 'vip' && stars === 5) Profile.vipOk = (Profile.vipOk || 0) + 1;
  pgChat(R).stars = stars;
  Act.ride = null; Act.rideT = rnd(4, 9);
  pay(v + tip); // sem aviso: o cartão de resultado mostra tudo
  Resultado.mostra({ titulo: 'Corrida concluída', sub: RIDE_TYPES[R.type].name + ' · ' + R.name, estrelas: stars, linhas: [['Corrida', v], ['Gorjeta', tip]], total: v + tip });
  gainXP(stars * 4 + { comum: 0, aero: 15, mudanca: 15, vip: 30 }[R.type]);
  if (R.type === 'aero' && late) setTimeout(() => toast(R.name, '"Perdi o voo! Agora vou de ônibus pra Vitorinha, com galinha no colo."', 'bad'), 1200);
  if (stars <= 2) setTimeout(() => angryVoice(R, late), rnd(6000, 12000));
  else if (stars === 5) setTimeout(() => {
    if (R.type !== 'vip' && Math.random() < 0.45) happyVoice(R);
    else pgMsg(R, R.type === 'vip' ? 'Serviço impecável. Vou te recomendar pro meu círculo de amigos. E olha que meu círculo é exclusivo.' : pick(PG_TOP));
  }, 7000);
  else if (stars >= 3 && Math.random() < 0.5) setTimeout(() => pgMsg(R, pick(PG_MEIO)), rnd(5000, 9000)); // corrida mais ou menos: comentário curto
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
  // terceira leva (passageiros novos)
  { clip: 'p_pastel', g: 'm', when: 'hits3', text: 'Ô, motorista! Meu pastel de vento voou pela janela na terceira batida! Agora é só vento mesmo! Uma estrela pra você, mermão!' },
  { clip: 'p_bolo', g: 'f', when: 'hits', text: 'Moço, o bolo do aniversário da minha filha virou farofa! Era de três andares, agora é um andar só! Uma estrela, e com raiva!' },
  { clip: 'p_novela', g: 'f', when: 'late', text: 'Meu filho, perdi o último capítulo da novela por causa dessa demora! Agora eu nunca vou saber quem é o pai do bebê! Uma estrela!' },
  { clip: 'p_galinha', g: 'm', when: 'mudanca', text: 'Minhas galinhas chegaram tudo tonta, rapaz! Uma botou ovo mexido! Isso é frete ou montanha-russa?' },
  { clip: 'p_entrevista', g: 'm', when: 'late', text: 'Mano, marquei a entrevista de emprego às dez e cheguei às onze! O cara me contratou só por pena. Uma estrela... mas obrigado pela pena!' },
  { clip: 'p_vip3', g: 'f', when: 'vip', text: 'Querido, eu pedi o VIP e o ar-condicionado era a janela aberta! Meu cabelo tá parecendo ninho de passarinho. Inaceitável!' },
  { clip: 'p_top4', g: 'f', when: 'top', text: 'Bah, que corrida tri legal, tchê! Chegou na hora e sem nenhum solavanco. Cinco estrelas, e o chimarrão é por minha conta!' },
  { clip: 'p_top5', g: 'm', when: 'top', text: 'Rapá, que motorista bom! Nem senti o carro andar, achei que tava no sofá de casa! Cinco estrelas, bicho!' },
  { clip: 'p_top6', g: 'f', when: 'top', text: 'Ô meu filho, que educação! Me ajudou com as sacolas e ainda dirigiu devagarinho. Deus te pague! Cinco estrelas!' },
];
// áudios dos personagens do jogo (clip opcional; sem clip o celular lê o texto)
const CHAR_VOICES = {
  ze_fiado: { from: 'Seu Zé (Oficina)', text: 'Ô meu filho, cadê o meu dinheiro? A caderneta já tá com cheiro de mofo! Paga o fiado aí que eu sou amigo, mas não sou de ferro, bicho!' },
  ze_nao: { from: 'Seu Zé (Oficina)', text: 'Rapá, de novo? Ainda tem fiado pendurado aqui! Fiado é igual sogra: uma vez a gente aguenta, duas já é abuso. Acerta comigo que eu vou voando!' },
  biu_socorro: { from: 'Seu Biu (Bananas)', text: 'Ô meu patrão, a carreta tombou! Tá banana pra todo lado, parece feira depois de terremoto! Me ajuda aqui, pelo amor de Deus, que eu pago cada caixa!' },
  boas_vindas: { from: 'Seu Zé (Oficina)', text: 'Ô meu filho, seja bem-vindo a São Gambiarra! Aqui é o Seu Zé, da oficina. Pegou a chave do carro? Então bora rodar: corrida no PegaAí, frete, e foge dos buracos, que aqui tem mais buraco que queijo suíço. Bateu? Vem na oficina que eu ajeito. Vai com Deus, e devagar, viu?' },
  cap_2: { from: 'Seu Zé (Oficina)', text: 'Ô meu filho, viu aquele Opalha 6C preto no fundo da oficina? Pois é... tá à venda! R$ 29.000 e ele é seu. Começa pelo PegaAí: faz cinco corridas e vem me contar!' },
  cap_3: { from: 'Seu Zé (Oficina)', text: 'Mandou bem nas corridas, bicho! Mas o Opalha não se paga sozinho, né? Pega umas entregas aí nos comércios. Faz três entregas que eu te conto um segredo.' },
  cap_4: { from: 'Seu Zé (Oficina)', text: 'O segredo é esse: quem ajuda a cidade, a cidade ajuda de volta. De madrugada sempre tem alguém precisando de socorro. Fica de olho e ajuda duas pessoas aí, meu filho!' },
  cap_5: { from: 'Seu Zé (Oficina)', text: 'Rapá, o povo só fala de você! Agora vai lá pra roça encarar o Rali da Vaca Atolada. Lama até o para-choque, mas quem termina ganha respeito. E não atola, hein!' },
  cap_opalha: { from: 'Seu Zé (Oficina)', text: 'Ô meu filho, o Gou Quadrado não ganha do carro do Zé do Canecão nem descendo ladeira! Mas tem um rapaz, o Juninho, com um Opalha parado aqui perto, sem bateria. Dá uma chupeta nele que ele te ajuda.' },
  juninho_empresta: { from: 'Juninho (Opalha)', text: 'Valeu demais, parceiro! Fiquei sabendo que tu vai encarar o Zé do Canecão. Na hora do racha, pega meu Opalha emprestado. E se um dia quiser um igual, eu falo com o Seu Zé pra te fazer um precinho.' },
  cap_6: { from: 'Seu Zé (Oficina)', text: 'Tá pronto, meu filho. Hoje de madrugada tem racha. Ganha um e a cidade inteira vai saber quem é você. Mas vai com cuidado, que eu não quero conserto!' },
  cap_7: { from: 'Seu Zé (Oficina)', text: 'Olha só pra você! Agora é só juntar o dinheiro. O Opalha tá aqui te esperando, encerado e de tanque cheio. R$ 29.000 e a chave é sua!' },
  cap_fim: { from: 'Seu Zé (Oficina)', text: 'Ô meu filho, que orgulho! O Opalha agora é seu. Lembra do primeiro dia, do Gou Quadrado tossindo? Pois é. São Gambiarra inteira tá falando de você. Agora, ó... e o fiado?' },
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
  if (!m.me) Legenda.fala(nomeCurto(m.from || m.name), m.body, m.voice.dur); // legenda da fala
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

/* ---------- pedestres que falam: susto, carro na calçada, buzina e paredão ----------
   Um de cada vez, com intervalo; a voz vai abaixando conforme o carro se afasta (PedVoz.update). */
const PED_FALAS = {
  susto: [['ped_1', 'Ô, maluco! Olha por onde anda!'], ['ped_2', 'Ai, meu Deus! Quase me atropela!'], ['ped_3', 'Devagar, motorista!'], ['ped_4', 'Ê, rapá! Quer me levar junto, é?'], ['ped_11', 'Tá doido, é?!'], ['ped_12', 'Eita! Por pouco, hein!'], ['ped_13', 'Olha a pressa, rapaz!'], ['ped_14', 'Calma, piloto!']],
  calcada: [['ped_5', 'Sai da calçada, doido!'], ['ped_6', 'Moço! A rua é ali, ó!'], ['ped_15', 'Desce da calçada, motorista!'], ['ped_16', 'Ô! Aqui é calçada, viu?']],
  buzina: [['ped_7', 'Buzina pra tua avó, rapá!'], ['ped_8', 'Bah, que susto, tchê!'], ['ped_17', 'Tô surdo não, moço!'], ['ped_18', 'Pra que essa buzina toda?']],
  paredao: [['ped_9', 'Aumenta o som, motorista!'], ['ped_10', 'Esse paredão é bom demais!'], ['ped_19', 'Aí sim, hein!'], ['ped_20', 'Que som é esse, meu Deus!']],
};
const PedVoz = { t: 0, a: null, ultimo: null, quem: null, falas: 0 };
PedVoz.fala = function (an, tipo) {
  if (!an || an.morto || Game.mode !== 'play' || Game.time < this.t || VoicePlayer.msg) return false;
  const L = PED_FALAS[tipo]; if (!L) return false;
  let F = pick(L); if (F[0] === this.ultimo && L.length > 1) F = L.find((x) => x[0] !== this.ultimo);
  this.ultimo = F[0]; this.t = Game.time + rnd(7, 12); this.falas++;
  this.quem = an; this.vol0 = 1;
  const c = VOICE_CLIPS[F[0]];
  Legenda.fala('Pedestre', F[1], c ? c.dur : 2.5);
  if (c) {
    const d = player ? Math.hypot(an.x - player.x, an.y - player.y) : 0;
    const vol = clamp((Settings.master !== undefined ? Settings.master : 80) / 100, 0, 1) * clamp(1 - d / 288, 0.2, 1) * 0.5;
    try { if (this.a) this.a.pause(); const a = this.a = new Audio(c.src); a.volume = vol; a.play().catch(() => {}); } catch (e) { this.a = null; }
  }
  return true;
};
// a voz acompanha a distância: quanto mais o carro se afasta, mais baixa; longe demais, para de vez
PedVoz.update = function () {
  const a = this.a, an = this.quem;
  if (!a || !an) return;
  if (a.ended || a.paused) { this.a = null; this.quem = null; return; }
  const d = Math.hypot(an.x - Cam.x, an.y - Cam.y), k = an.morto ? 0 : clamp(1 - (d - 34.5) / 198, 0, 1); // some a uns 232 de distância (+15%)
  const v = clamp((Settings.master !== undefined ? Settings.master : 80) / 100, 0, 1) * 0.5 * k; // mais baixa (nov/2026: 0,782 → 0,5)
  if (v < 0.015) { try { a.pause(); } catch (e) {} this.a = null; this.quem = null; return; }
  a.volume = v;
};

/* ---------- atropelamento: o pedestre cai, o corpo fica uns segundos e some devagar; fica só o sangue no chão,
   que some quando o carro vai embora (não fica desenhado fora da tela à toa). Quem estava perto sai correndo. ---------- */
const Atropelo = { mortos: [], sangue: [], n: 0 };
Atropelo.update = function (dt) {
  if (!player || Game.mode !== 'play' || Game.state !== 'playing') return;
  const sp = player.speed;
  if (sp > 50) {
    const m = player.m, ca = Math.cos(player.a), sa = Math.sin(player.a), hl = m.L / 2 + 2, hw = m.W / 2 + 2;
    for (const an of Animals.list) {
      if (an.type !== 'person' || an.morto || an.oculto) continue;
      const dx = an.x - player.x, dy = an.y - player.y; if (dx > 45 || dx < -45 || dy > 45 || dy < -45) continue;
      const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
      if (Math.abs(lx) < hl && Math.abs(ly) < hw) this.atropela(an, sp);
    }
  }
  for (let i = this.mortos.length - 1; i >= 0; i--) {
    const an = this.mortos[i]; an.mortoT += dt;
    if (an.mortoT <= 6 && an.morreuX !== undefined) { an.x = an.morreuX; an.y = an.morreuY; an.v = 0; } // fica estático onde caiu
    // corpo sumiu: a pessoa volta em outro ponto da calçada dela, longe da câmera (a cidade não fica vazia)
    if (an.mortoT > 6 && Math.hypot(an.x - Cam.x, an.y - Cam.y) > 1500) {
      an.morto = false; an.morreuX = undefined; an.cruza = null; an.state = 'idle'; an.t = rnd(1, 4); an.v = 0;
      an.x = rnd(an.rect[0], an.rect[2]); an.y = rnd(an.rect[1], an.rect[3]);
      this.mortos.splice(i, 1);
    }
  }
  // roda que passou por cima da poça de sangue marca um pouquinho nos primeiros metros (só essa roda)
  const W = player.rodas(), sr = player.sangueR || (player.sangueR = [0, 0, 0, 0]), sl = player.sangueL || (player.sangueL = [null, null, null, null]);
  for (const q of this.sangue) {
    if (Math.abs(q.x - player.x) > q.r + 40 || Math.abs(q.y - player.y) > q.r + 40) continue;
    const ca = Math.cos(q.a), sa = Math.sin(q.a), Lr = (q.rastro || 0) * q.t;
    for (let k = 0; k < 4; k++) {
      const dx = W[k * 2] - q.x, dy = W[k * 2 + 1] - q.y;
      const naPoca = dx * dx + dy * dy < (q.r * 0.9 + 1.5) ** 2;
      const u = dx * ca + dy * sa, v = -dx * sa + dy * ca, noRastro = Lr > 0 && u > 0 && u < Lr && Math.abs(v) < q.r * 0.32 + 1.5; // rastro arrastado
      if ((naPoca || noRastro) && !(sr[k] > 50)) sr[k] = 90;
    }
  }
  player.sangueRodas = Math.max(sr[0], sr[1], sr[2], sr[3]);
  for (let k = 0; k < 4; k++) {
    if (sr[k] > 0 && sp > 6) {
      const wx = W[k * 2], wy = W[k * 2 + 1], L = sl[k];
      if (!L) sl[k] = [wx, wy];
      else if (Math.hypot(wx - L[0], wy - L[1]) > 3) { Skids.add1(L[0], L[1], wx, wy, sr[k] > 45 ? 'sangue' : 'sangue2'); L[0] = wx; L[1] = wy; }
      sr[k] -= sp * dt;
    } else if (!(sr[k] > 0)) sl[k] = null;
  }
  // sangue longe da tela some de vez
  const v = Cam.view, mg = 500;
  if (v && v.x1 > v.x0) for (let i = this.sangue.length - 1; i >= 0; i--) { const q = this.sangue[i]; q.age = (q.age || 0) + dt; if (q.age > 1.5 && (q.x < v.x0 - mg || q.x > v.x1 + mg || q.y < v.y0 - mg || q.y > v.y1 + mg)) this.sangue.splice(i, 1); }
};
Atropelo.atropela = function (an, sp) {
  an.morto = true; an.mortoT = 0; an.v = 0; an.danceUntil = 0;
  const f = clamp(sp / 400, 0.3, 1);
  // é jogado um pouco para frente, mas nunca para dentro de casa ou muro (para antes)
  for (let k = 8 + 16 * f; k > 0; k -= 4) { const nx = an.x + Math.cos(player.a) * k, ny = an.y + Math.sin(player.a) * k; if (!areaBlocked(nx - 4, ny - 4, nx + 4, ny + 4)) { an.x = nx; an.y = ny; break; } }
  an.morreuX = an.x; an.morreuY = an.y;
  an.ca = player.a + rnd(-1.2, 1.2); // de que jeito ficou caído
  this.mortos.push(an); this.n++;
  this.sangue.push({ x: an.x, y: an.y, s: Math.random() * 1000, r: rnd(6.2, 8.2), a: player.a, t: 0, rastro: (10 + 14 * f) * 0.6 }); // metade do sangue de antes
  if (this.sangue.length > 24) this.sangue.splice(0, this.sangue.length - 24);
  if (PedVoz.quem === an && PedVoz.a) { try { PedVoz.a.pause(); } catch (e) {} PedVoz.a = null; PedVoz.quem = null; }
  AudioSys.thud(); AudioSys.noise(0.12, 600, 1, 0.12 * f, 'engine', 'lowpass');
  player.vx *= 0.93; player.vy *= 0.93; Cam.shake = Math.max(Cam.shake, 3);
  for (const o of Animals.list) if (o !== an && !o.morto && Math.abs(o.x - an.x) < 220 && Math.abs(o.y - an.y) < 220) o.scare(an.x, an.y, true); // quem viu, corre
};
// manchas de sangue no chão (uma pincelada por mancha, só as que aparecem na tela)
Atropelo.desenhaSangue = function (ctx, view) {
  if (!this.sangue.length) return;
  for (const q of this.sangue) {
    if (!inView(view, q.x, q.y, 30)) continue;
    q.t = Math.min(1, q.t + 0.04);
    const R = mulberry32(q.s | 0), r = q.r * (0.35 + 0.65 * q.t);
    ctx.fillStyle = 'rgba(150,10,14,0.88)'; ctx.beginPath();
    ctx.ellipse(q.x, q.y, r, r * 0.72, R() * TAU, 0, TAU);
    if (q.rastro) { const L = q.rastro * q.t, ex = q.x + Math.cos(q.a) * L * 0.5, ey = q.y + Math.sin(q.a) * L * 0.5; ctx.moveTo(ex + L * 0.6, ey); ctx.ellipse(ex, ey, L * 0.6, r * 0.32, q.a, 0, TAU); } // arrastado na direção do carro
    for (let k = 0; k < 3; k++) { const a = R() * TAU, dd = r * (0.8 + R() * 0.8), rr = 0.5 + R() * 1.1; ctx.moveTo(q.x + Math.cos(a) * dd + rr, q.y + Math.sin(a) * dd); ctx.arc(q.x + Math.cos(a) * dd, q.y + Math.sin(a) * dd, rr, 0, TAU); }
    ctx.fill();
  }
};
// corpo caído: fica uns 4 segundos e some devagar
Atropelo.desenhaCorpos = function (ctx, view) {
  for (const an of this.mortos) {
    if (an.mortoT > 5.6 || !inView(view, an.x, an.y, 30)) continue;
    const al = an.mortoT < 4 ? 1 : clamp(1 - (an.mortoT - 4) / 1.6, 0, 1);
    ctx.save(); ctx.globalAlpha = al; ctx.translate(an.x, an.y); ctx.rotate(an.ca);
    ctx.fillStyle = an.pants; ctx.fillRect(-6.5, -2.2, 4.6, 1.6); ctx.fillRect(-6.2, 0.6, 4.4, 1.6); // pernas
    ctx.fillStyle = an.col; ctx.beginPath(); ctx.ellipse(-0.6, 0, 3.4, 2.5, 0, 0, TAU); ctx.fill(); // tronco
    ctx.fillStyle = an.skin; ctx.fillRect(-1, -4.1, 3.2, 1.2); ctx.fillRect(0.4, 2.9, 3, 1.2); // braços abertos
    ctx.beginPath(); ctx.arc(4.2, 0.3, 1.9, 0, TAU); ctx.fill(); // cabeça
    ctx.fillStyle = an.hair; ctx.beginPath(); ctx.arc(4.6, 0.3, 1.9, -Math.PI * 0.5, Math.PI * 0.5); ctx.fill();
    ctx.restore();
  }
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
  // terceira leva: mais quadros do DJ e ouvinte pedindo música
  { clip: 'radio_39', tag: 'Promoção da madrugada', text: 'Promoção da madrugada! O primeiro ouvinte que achar uma rua sem buraco em São Gambiarra ganha um pastel de vento. A promoção começou em dois mil e dez... e até agora ninguém ganhou!' },
  { clip: 'radio_40', tag: 'Dica do DJ', text: 'Dica do DJ: se o GPS mandar você virar à direita dentro do rio... não vira, tá? O GPS também tá cansado. É madrugada pra todo mundo!' },
  { clip: 'radio_41', tag: 'Correio do coração', text: 'Correio do coração! A Kelly, do Feio Rosa, manda dizer pro Rafa que ela não esqueceu... os quarenta reais que ele pegou emprestado. Que romântico!' },
  { clip: 'radio_42', tag: 'Teste de conhecimento', text: 'Teste de conhecimento: qual a diferença entre uma lombada e um quebra-molas em São Gambiarra? Nenhuma! Os dois quebram a sua mola!' },
  { clip: 'radio_43', tag: 'Aviso aos motoristas', text: 'Atenção, motorista de aplicativo: se o passageiro perguntar se falta muito, a resposta oficial é: tô virando a esquina. Mesmo que você esteja em outra cidade!' },
  { clip: 'radio_44', tag: 'Receita do DJ', text: 'Receita do DJ: pegue um ovo, coloque no capô do carro depois de um racha... e pronto, ovo frito! Não tente isso em casa. Tente na rua mesmo!' },
  { clip: 'radio_45', tag: 'Alerta de chuva', cond: 'chuva', text: 'Choveu em São Gambiarra! As poças estão tão grandes que o Seu Biu já tá vendendo banana com boia. Pisa leve, que aquaplanagem não é esporte olímpico!' },
  { clip: 'radio_46', tag: 'Recado da prefeitura', text: 'Recado da prefeitura: o semáforo da Avenida Brasil Sil Sil ficou amarelo por quarenta minutos porque o funcionário dormiu. Respeitem o sono do rapaz!' },
  { clip: 'radio_47', tag: 'Você sabia?', text: 'Pedestre, se você atravessou na faixa e o carro parou... tira uma foto, que isso é raro! Motorista educado em São Gambiarra é tipo cometa!' },
  { clip: 'radio_thais', tag: 'Ouvinte na linha', who: 'Thaís, de Camburiso', then: 'dj_m1', text: 'Alô, DJ Biruta? Aqui é a Thaís, de Camburiso! Toca aquele forró do pneu furado pra mim e pro meu namorado, que tá preso no trânsito da BR!' },
  { clip: 'radio_azulina', tag: 'Ouvinte na linha', who: 'Ouvinte azulina', then: 'radio_30', text: 'Égua, DJ! Liguei pra pedir uma música! Ah, vocês não tocam música? Então conta uma piada do Paysandu, que eu sou azulina, mana!' },
];
// vinhetas curtas entre um quadro e outro
const RADIO_VINHETAS = [
  { clip: 'radio_v1', tag: 'Vinheta', text: 'Gambiarra FM! Cento e setenta e um vírgula um!' },
  { clip: 'radio_v2', tag: 'Vinheta', text: 'Você tá ouvindo a rádio que pega até debaixo da ponte!' },
  { clip: 'radio_v3', tag: 'Vinheta', text: 'DJ Biruta na área! Aumenta o som aí, motorista!' },
  { clip: 'radio_v4', tag: 'Vinheta', text: 'Gambiarra FM: saiu do ar? Dá um tapa no rádio que ela volta!' },
];
// músicas da rádio: compostas para o jogo (tools/radio/musicas.py), sem direitos de ninguém. Cada uma tem a
// apresentação do DJ antes; depois, às vezes, um comentário. A Bossa da Garoa só toca com chuva.
const RADIO_MUSICAS = [
  { clip: 'mus_xote', nome: 'Xote do Pneu Furado', banda: 'Trio Pé de Pano', intro: 'dj_m1' },
  { clip: 'mus_funk', nome: 'Batidão da Lombada', banda: 'MC Rebaixado', intro: 'dj_m2' },
  { clip: 'mus_moda', nome: 'Moda da Vaca Atolada', banda: 'Zé Poeira & Toinho Lama', intro: 'dj_m3' },
  { clip: 'mus_pagode', nome: 'Pagode do Pastel de Vento', banda: 'Grupo Fiado Pago', intro: 'dj_m4' },
  { clip: 'mus_neon', nome: 'Neon na BR', banda: 'Os Faróis Altos', intro: 'dj_m5' },
  { clip: 'mus_arrocha', nome: 'Arrocha do Coração Rebaixado', banda: 'Kelvin do Arrocha', intro: 'dj_m6' },
  { clip: 'mus_bossa', nome: 'Bossa da Garoa', banda: 'Quarteto Garoa Fina', intro: 'dj_m7', cond: 'chuva' },
];
const RADIO_APRESENTA = [
  { clip: 'dj_m1', tag: 'Agora toca', musica: 'mus_xote', text: 'E agora, pra arrastar o pé no asfalto: Trio Pé de Pano, com Xote do Pneu Furado! Segura o forró, motorista!' },
  { clip: 'dj_m2', tag: 'Agora toca', musica: 'mus_funk', text: 'Aumenta o grave, que lá vem MC Rebaixado, com Batidão da Lombada! Cuidado, que o escapamento raspa!' },
  { clip: 'dj_m3', tag: 'Agora toca', musica: 'mus_moda', text: 'Ô sô, prepara a botina, uai! Zé Poeira e Toinho Lama, com Moda da Vaca Atolada, direto da roça pra sua cabine!' },
  { clip: 'dj_m4', tag: 'Agora toca', musica: 'mus_pagode', text: 'Madrugada de sexta pede o quê? Pagode! Grupo Fiado Pago, com Pagode do Pastel de Vento!' },
  { clip: 'dj_m5', tag: 'Agora toca', musica: 'mus_neon', text: 'Pra quem tá de farol alto na BR... Os Faróis Altos, com Neon na BR! E abaixa esse farol, por favor!' },
  { clip: 'dj_m6', tag: 'Agora toca', musica: 'mus_arrocha', text: 'Essa vai pra quem levou uma estrela no PegaAí e tá com o coração partido: Kelvin do Arrocha, com Arrocha do Coração Rebaixado!' },
  { clip: 'dj_m7', tag: 'Agora toca', musica: 'mus_bossa', text: 'Garoinha na janela, limpador ligado... Quarteto Garoa Fina, com Bossa da Garoa. Dirige devagar, que o chão tá liso.' },
];
const RADIO_DEPOIS = [
  { clip: 'dj_b1', tag: 'DJ Biruta', text: 'Que música, hein? Pedido de ninguém, porque aqui ninguém pede nada: a gente toca o que quer!' },
  { clip: 'dj_b2', tag: 'DJ Biruta', text: 'Ê, música boa! Se você cantou junto, buzina duas vezes... na calma, que tem gente dormindo!' },
];
function radioFaixa(M) { return { clip: M.clip, tag: 'Tocando agora', who: M.banda, text: M.nome, faixa: true }; }
const Radio = { a: null, cur: null, mode: 'idle', k: 0, dur: 0, gap: 0, bag: [], mbag: [], semMusica: 1, fila: [], held: false, heldT: 0, line: -1, parts: null, last: null, lastV: null };
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
// próxima música (sorteio sem repetir; a da chuva só com chuva)
Radio.proxMusica = function () {
  for (let tent = 0; tent < 2; tent++) {
    if (!this.mbag.length) { this.mbag = RADIO_MUSICAS.slice(); for (let i = this.mbag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.mbag[i], this.mbag[j]] = [this.mbag[j], this.mbag[i]]; } }
    for (let i = this.mbag.length - 1; i >= 0; i--) if (this.cond(this.mbag[i]) && VOICE_CLIPS[this.mbag[i].clip]) return this.mbag.splice(i, 1)[0];
    this.mbag = [];
  }
  return null;
};
// apresentação do DJ + a música (+ às vezes um comentário depois)
Radio.blocoMusica = function (M, out) {
  const A = RADIO_APRESENTA.find((x) => x.clip === M.intro);
  if (A && !out.includes(A)) out.push(A);
  out.push(radioFaixa(M));
  if (Math.random() < 0.45) out.push(pick(RADIO_DEPOIS));
  this.semMusica = 0;
  return out;
};
Radio.monta = function () {
  const out = [];
  // música a cada um ou dois quadros de falação
  if (this.semMusica >= 2 || (this.semMusica >= 1 && Math.random() < 0.5)) { const M = this.proxMusica(); if (M) return this.blocoMusica(M, out); }
  this.semMusica++;
  const S = this.next();
  if (Math.random() < 0.3) { let V = pick(RADIO_VINHETAS); if (V === this.lastV) V = pick(RADIO_VINHETAS); this.lastV = V; out.push(V); }
  out.push(S);
  if (S.then) {
    const T = RADIO.find((x) => x.clip === S.then) || RADIO_APRESENTA.find((x) => x.clip === S.then);
    if (T && T.musica) { // ouvinte pediu música: o DJ apresenta e ela toca
      const M = RADIO_MUSICAS.find((x) => x.clip === T.musica); this.mbag = this.mbag.filter((x) => x !== M);
      if (M && VOICE_CLIPS[M.clip]) { out.push(T); return this.blocoMusica(M, out); }
    } else if (T) out.push(T);
  }
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
      const a = this.a = new Audio(c.src); a.volume = this.vol() * (S.faixa ? 0.8 : 1);
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
  if (t && typeof jogoTravado === 'function' && jogoTravado()) return;
  if (t) Radio.toggle();
});
Radio.update = function (dt) {
  const sc = Screens.current;
  const fora = Game.mode !== 'play' || Game.state === 'menu' || Game.carregando || sc === 'screen-pause' || sc === 'screen-settings' || sc === 'screen-main' || sc === 'screen-credits';
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
  if (this.a) this.a.volume = this.vol() * (this.cur && this.cur.faixa ? 0.8 : 1);
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
  comum: ['Oi! Tô na frente do portão azul.', 'Pode buzinar que eu desço.', 'Tô de camisa amarela, perto da esquina.', 'Já tô na calçada, moço!', 'Oxe, demora não, viu? Tô na esquina.', 'Uai, tô te esperando aqui na porta, sô.', 'Bah, tô aqui de cuia na mão, tchê. Não tem erro.', 'Égua, tô de boné vermelho, pai d\'égua!', 'Mano, tô na frente da padaria, chega mais.', 'Tô de chinelo e pijama, não repara!', 'O cachorro late, mas é manso. Acho.', 'Você aceita pix ou pastel?', 'Tô na frente do bar, de boné virado.'],
  aero: ['Oi! Tô com duas malas, cabe aí?', 'Corre que meu voo não espera, por favor!', 'Tô no portão com a mala de rodinha quebrada. Vem logo?', 'Meu voo é daqui a uma hora. Dá tempo, né?'],
  mudanca: ['As caixas já tão na calçada!', 'Traz espaço que a geladeira é grande, hein.', 'Cuidado que o sofá não passa pela porta de lado!', 'Tem um papagaio na gaiola também. Ele fala, mas não morde.'],
  vip: ['Estou aguardando. Sem buzina, por favor.', 'Prefiro que não converse durante o trajeto. Obrigado.', 'Espero que o carro esteja perfumado. Tenho rinite.', 'Por favor, sem rádio alta. A não ser que toque bossa nova.'],
};
const PG_QUICK = ['Já estou chegando!', 'Cheguei!', 'Tô no trânsito, 2 minutinhos.'];
const PG_ANS = ['Beleza!', 'Ok, tô te esperando.', 'Valeu!', 'Tá bom, sem pressa (mas com um pouco de pressa).', 'Tô vendo o carrinho no mapa, vem!', 'Ufa! Achei que tinha me esquecido.', 'Combinado, tô na porta.', 'Só não buzina que o neném dormiu.'];
// avaliação 5 estrelas por texto (quando não manda áudio)
const PG_TOP = ['Valeu pela corrida, motorista! Nota 5!', 'Corrida top, chegou rapidinho!', 'Melhor motorista de São Gambiarra, bicho!', 'Bah, que corrida tri! Valeu, tchê!', 'Oxe, chegou foi ligeiro! Nota 5, visse?', 'Uai, nem senti os buracos, sô!', 'Égua, que motorista pai d\'égua!'].concat(['Chegou antes do previsto! Nem deu tempo de passar o batom.', 'Motorista educado e carro limpinho. Cinco estrelas!', 'Gostei da rádio que tava tocando. Nota 5!', 'Nunca vi alguém desviar de buraco assim. Artista!', 'Valeu, campeão! Até o cachorro gostou da corrida.', 'Corrida tranquila, música boa e ar fresquinho. Nota mil!']);
// corrida de 3 ou 4 estrelas: comentário curto
const PG_MEIO = ['Corrida ok. Só o banco que tava meio grudento, hein.', 'Chegou, mas pegou todo buraco da avenida.', 'Foi bem, mas da próxima abaixa esse som, por favor.', 'Deu tudo certo. O carro tem cheiro de pastel, é normal?', 'Corrida boa! Só a freada na lombada que me assustou.', 'Tudo certo. Mas o GPS te mandou pelo caminho mais longo, viu?'];
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
// o motorista responde uma vez só; os botões só voltam se o passageiro perguntar algo depois (mensagem com ask)
function pgCanReply(c) {
  const lastMe = c.msgs.map((m) => !!m.me).lastIndexOf(true);
  if (lastMe < 0) return true;
  return c.msgs.slice(lastMe + 1).some((m) => !m.me && m.ask);
}
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
  if (live && pgCanReply(c)) h += '<div class="pgc-quick">' + PG_QUICK.map((q, i) => `<button data-pgq="${i}">${escapeHtml(q)}</button>`).join('') + '</div>';
  else if (live) h += '<div class="pgc-closed">Você já respondeu esta conversa</div>';
  else h += '<div class="pgc-closed">Corrida encerrada · não dá para enviar mensagens</div>';
  return h + '</div>';
}
function pgListHTML() {
  const L = pgChats();
  if (!L.length) return '<p class="ph-empty">Nenhuma conversa ainda. Fique online e aceite corridas.</p>';
  return L.map((c) => { const last = c.msgs[c.msgs.length - 1]; return `<button class="pg-row${c.read ? '' : ' new'}" data-pgchat="${c.rid}"><span class="pgc-ava">${escapeHtml(c.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span><span class="pg-mid"><b>${escapeHtml(c.name)}</b><small>${last ? (last.me ? 'Você: ' : '') + (last.voice && Settings.msgMode !== 'texto' ? 'Mensagem de voz' : escapeHtml(last.body.slice(0, 48))) : ''}</small></span><em>${escapeHtml((RIDE_TYPES[c.type] || RIDE_TYPES.comum).name.replace('PegaAí ', '').replace('PegaAí', 'Comum'))}</em></button>`; }).join('');
}
/* ---------- chat do app de Fretes: o cliente escreve quando o frete é aceito e agradece (ou reclama) na entrega ----------
   Igual ao PegaAí: uma conversa por frete, o motorista responde uma vez só (outra só se o cliente perguntar). */
const FR_PEDIDO = {
  gas: ['Oi! O gás acabou bem na hora do feijão. Vem rapidinho, por favor!', 'Boa noite! É o gás? Tô esperando no portão.', 'Moço, traz o botijão que a pizza ficou pela metade no forno!', 'Vai demorar muito? O arroz tá esperando!'],
  bau: ['Boa noite, motorista. A carga é pra hoje ainda, tá? O caminhão de ontem sumiu.', 'Pode descarregar pelos fundos, a porta da frente emperrou.', 'Cuidado com as caixas de vidro, por favor!'],
  tanker: ['Aqui é do posto. A bomba tá secando e os carros tão fazendo fila!', 'Capricha, que hoje a gasolina tá pela hora da morte.', 'Chega antes do movimento da madrugada?'],
  cacamba: ['O entulho tá todo na calçada. Leva tudo, por favor!', 'A vizinha já reclamou do entulho três vezes. Vem logo?'],
  guincho: ['Meu carro morreu no meio da rua! Tô do lado dele com o pisca ligado.', 'O carro deu um estalo e parou. O Seu Zé mandou chamar você.', 'Tá vindo? Já tá escuro aqui e o celular tá com três por cento!'],
  pickup: ['Oi! Já separei as coisas na garagem. Cuidado com a geladeira!', 'Tem escada aqui, mas eu ajudo a carregar.', 'Cabe tudo na caçamba da picape?'],
  loja: ['Oi! Pedi pelo aplicativo e tô morrendo de fome. Vem rápido!', 'Boa noite! Pode tocar a campainha do 2.', 'É a minha encomenda? Tô de olho no mapa!'],
};
const FR_OK = ['Chegou certinho! Muito obrigado, motorista!', 'Valeu demais! Entrega rápida e tudo inteiro.', 'Obrigada! Da próxima vez peço com você de novo.', 'Show de bola! Cinco estrelas pro frete.', 'Chegou! Nem acreditei que foi tão rápido.', 'Deus te abençoe, meu filho. Chegou tudo bem!'];
const FR_OK_TIPO = { gas: ['Gás chegou! Agora o feijão sai. Muito obrigado!', 'Salvou a janta! Valeu pelo gás, parceiro!'], tanker: ['Tanque cheio! A fila de carro já tá andando. Valeu!'], guincho: ['Carro entregue na oficina! O Seu Zé disse que é só a bateria. Ufa, valeu!'], cacamba: ['Calçada limpinha! A vizinha até sorriu. Obrigado!'] };
const FR_ATRASO = ['Chegou, né... Demorou, mas chegou. Obrigado mesmo assim.', 'Achei que o frete vinha de jegue! Mas valeu.', 'Já tinha até desistido. Obrigado, mas da próxima vez, mais cedo!'];
const FR_AVARIA = ['Chegou, mas metade das caixas tá amassada. Vou relevar dessa vez...', 'Moço, o que você fez com a minha carga? Tá tudo sacudido!', 'Chegou tudo chacoalhado. Parece que veio pela estrada de terra!'];
const FR_QUICK = ['Já tô a caminho!', 'Carga a bordo, chegando!', 'Pode deixar, chega inteirinho!'];
const FR_ANS = ['Beleza, obrigado!', 'Valeu! Tô esperando.', 'Combinado!', 'Vem com Deus!'];
// agradecimento por áudio (às vezes)
const FR_VOZ = [
  { clip: 'fr_ok1', g: 'm', tipo: 'gas', text: 'Chegou o gás! Graças a Deus, que o feijão tava pela metade. Valeu demais, parceiro! Cinco estrelas!' },
  { clip: 'fr_ok2', g: 'f', text: 'Ô meu filho, chegou tudinho inteiro! Nem uma caixa amassada. Volta sempre, viu?' },
  { clip: 'fr_ok3', g: 'm', text: 'Uai, chegou rapidim, sô! A encomenda tá perfeita. Brigado demais da conta!' },
  { clip: 'fr_ok4', g: 'f', text: 'Bah, entrega tri rápida, tchê! Já vou te recomendar pros vizinhos!' },
];
function frChats() { if (!Profile.fr) Profile.fr = { chats: [] }; return Profile.fr.chats; }
function frUnread() { return frChats().filter((c) => !c.read).length; }
function frFind(fid) { return frChats().find((c) => c.fid === fid); }
function frCliente(d) {
  if (d.type === 'bau' || d.type === 'tanker') return d.dest.name; // quem recebe é a loja ou o posto
  if (d.type === 'cacamba') return 'Mestre de obras ' + pick(['Tonhão', 'Juca', 'Valdir', 'Zezé']);
  return pick(PASSAGEIROS);
}
function frChat(d) {
  let c = frFind(d.fid);
  if (!c) { c = { fid: d.fid, name: d.cliente, item: d.item, t: Math.floor(Profile.time), msgs: [], read: true }; frChats().unshift(c); if (frChats().length > 20) frChats().length = 20; }
  return c;
}
function frMsg(d, body, voice, me) {
  const c = frChat(d), m = { body, me: !!me, t: Math.floor(Profile.time) };
  if (voice) m.voice = voice;
  c.msgs.push(m);
  if (!me) {
    c.read = false;
    if (phoneCfg().notif) toast('Fretes · ' + c.name, voice && Settings.msgMode !== 'texto' ? 'Mensagem de voz' : body, 'info');
    if (phoneCfg().sounds) { AudioSys.tone(784, 0.07, 'sine', 0.07, 'ui'); AudioSys.tone(988, 0.12, 'sine', 0.07, 'ui', null, 0.09); }
  }
  if (Screens.current === 'screen-phone' && Phone.app === 'fretes') Phone.render();
  return m;
}
function frCanReply(c) { const i = c.msgs.map((m) => !!m.me).lastIndexOf(true); return i < 0 || c.msgs.slice(i + 1).some((m) => !m.me && m.ask); }
// frete aceito: o cliente escreve em seguida
function frStart(d) {
  d.fid = 'f' + Date.now().toString(36) + Math.floor(Math.random() * 1e4); d.cliente = frCliente(d);
  setTimeout(() => {
    if (Act.delivery !== d) return;
    const tx = pick(FR_PEDIDO[d.type] || FR_PEDIDO.loja), m = frMsg(d, tx);
    if (/\?$/.test(tx)) { m.ask = true; if (Screens.current === 'screen-phone' && Phone.app === 'fretes') Phone.render(); }
  }, rnd(2500, 5000));
}
// frete entregue: agradece (às vezes por áudio), ou reclama do atraso ou da carga sacudida
function frFim(d, atraso, avaria) {
  if (!d.fid) return;
  setTimeout(() => {
    if (avaria) { frMsg(d, pick(FR_AVARIA)); return; }
    if (atraso) { frMsg(d, pick(FR_ATRASO)); return; }
    const g = genderOf(d.cliente), vozes = FR_VOZ.filter((v) => (!v.tipo || v.tipo === d.type) && (v.g === g || /^(Mercad|Posto|Padaria|Farm|Lanch|Bar|Church|Moqu|Sítio|Fazenda|Mestre)/.test(d.cliente)));
    if (vozes.length && Math.random() < 0.35) { const V = pick(vozes); frMsg(d, V.text, { clip: V.clip, dur: (VOICE_CLIPS[V.clip] && VOICE_CLIPS[V.clip].dur) || 6 }); return; }
    frMsg(d, pick((FR_OK_TIPO[d.type] || []).concat(FR_OK)));
  }, rnd(3500, 6500));
}
function frChatHTML(c) {
  c.read = true;
  const fmtT = (t) => { const v = Math.floor(t || 0) % 1440; return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0'); };
  const live = Act.delivery && Act.delivery.fid === c.fid;
  let h = `<div class="pgc"><div class="pgc-top"><button class="ph-back" data-frback="1">‹</button><span class="pgc-ava">${escapeHtml(c.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span><div><b>${escapeHtml(c.name)}</b><small>${escapeHtml(c.item || 'Frete')} · ${live ? 'frete em andamento' : 'entregue'}</small></div></div><div class="pgc-body">`;
  h += '<div class="pgc-note">As mensagens ficam só no app de Fretes.</div>';
  for (const m of c.msgs) {
    if (m.voice && Settings.msgMode !== 'texto') h += voiceBubble(m, fmtT).replace('class="wa-msg wa-vmsg"', 'class="wa-msg wa-vmsg pgc-in"');
    else h += `<div class="pgc-msg ${m.me ? 'me' : ''}">${escapeHtml(m.body)}<i>${fmtT(m.t)}</i></div>`;
  }
  h += '</div>';
  if (live && frCanReply(c)) h += '<div class="pgc-quick">' + FR_QUICK.map((q, i) => `<button data-frq="${i}">${escapeHtml(q)}</button>`).join('') + '</div>';
  else if (live) h += '<div class="pgc-closed">Você já respondeu esta conversa</div>';
  else h += '<div class="pgc-closed">Frete encerrado · não dá para enviar mensagens</div>';
  return h + '</div>';
}
function frListHTML() {
  const L = frChats();
  if (!L.length) return '<p class="ph-empty">Nenhuma conversa ainda. Aceite um frete e o cliente fala com você por aqui.</p>';
  return L.map((c) => { const last = c.msgs[c.msgs.length - 1]; return `<button class="pg-row${c.read ? '' : ' new'}" data-frchat="${c.fid}"><span class="pgc-ava">${escapeHtml(c.name.split(' ').map((w) => w[0]).join('').slice(0, 2))}</span><span class="pg-mid"><b>${escapeHtml(c.name)}</b><small>${last ? (last.me ? 'Você: ' : '') + (last.voice && Settings.msgMode !== 'texto' ? 'Mensagem de voz' : escapeHtml(last.body.slice(0, 48))) : ''}</small></span><em>${escapeHtml((c.item || '').slice(0, 14))}</em></button>`; }).join('');
}

/* ---------- sons de ambiente: fundo em loop por região + sons soltos (bichos, carros, gente) ----------
   Fundos (gravações em loop): cidade, favela, roça (grilos e sapos), praia (ondas), mata e rio; trocam devagar
   conforme a câmera anda. Sons soltos saem do lugar certo (vaca perto das vacas, risada perto dos bares,
   carro passando de verdade quando um carro do trânsito passa raspando) com volume pela distância e lado.
   Cada som é preparado (decodificado) só quando é usado pela primeira vez, sem pesar no começo. */
const AMB_FUNDO = { favela: ['amb_favela', 0.42], roca: ['amb_roca', 0.26], praia: ['amb_praia', 0.45], mata: ['amb_mata', 0.32], rio: ['amb_rio', 0.4] }; // cidade suave, roça baixa (pedido do dono)
const AMB_FAVELAS = { saopedro: 1, terravermelha: 1, feurosa: 1, carapina: 1 };
const Ambiente = { buf: {}, pedido: {}, fundos: {}, t0: 0, passou: new Map(), passouT: 0, pessoasT: 0, n: 0 };
Ambiente.pronto = function (clip) {
  if (this.buf[clip]) return this.buf[clip];
  if (this.pedido[clip] || !AudioSys.ok || !VOICE_CLIPS[clip]) return null;
  this.pedido[clip] = true;
  try {
    const src = VOICE_CLIPS[clip].src, bin = atob(src.slice(src.indexOf(',') + 1)), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    AudioSys.ctx.decodeAudioData(u8.buffer).then((b) => { this.buf[clip] = b; }, () => {});
  } catch (e) {}
  return null;
};
// som solto num ponto do mundo: volume pela distância da câmera e lado esquerdo/direito
Ambiente.toca = function (clip, x, y, vol, alcance) {
  const b = this.pronto(clip); if (!b) return false;
  if (this.tocando > 0) return true; // um som solto de cada vez (dois juntos somavam e chiavam)
  const c = AudioSys.ctx, d = Math.hypot(x - Cam.x, y - Cam.y), g = (vol || 0.5) * clamp(1 - d / (alcance || 1500), 0.06, 1);
  if (!(g >= 0.02) || !isFinite(x) || !isFinite(y)) return true; // posição inválida: não toca
  const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = 0.92 + Math.random() * 0.16;
  const gn = c.createGain(); gn.gain.value = g; s.connect(gn);
  if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp((x - Cam.x) / 750, -0.85, 0.85); gn.connect(p); p.connect(AudioSys.bus.ambient); } else gn.connect(AudioSys.bus.ambient);
  this.tocando = (this.tocando || 0) + 1; s.onended = () => { this.tocando--; };
  s.start(); this.n++;
  return true;
};
// peso de cada fundo conforme o lugar da câmera
Ambiente.pesos = function () {
  const rk = regionKeyAt(Cam.x, Cam.y), R = REGIONS[rk], fav = AMB_FAVELAS[rk] ? 1 : 0;
  const praia = Cam.x > ORLA_X0 - 300 ? clamp(1 - (SAND_Y - Cam.y) / 650, 0, 1) : 0;
  const rio = clamp(1 - (Math.abs(Cam.x - riverCX(Cam.y)) - 160) / 650, 0, 1);
  const mata = rk === 'mata' ? 1 : 0;
  return { favela: fav, roca: R.rural * (1 - mata * 0.7) * (1 - rio * 0.6), praia, mata, rio };
};
Ambiente.update = function (dt) {
  if (!AudioSys.ok) return;
  // prepara os sons aos poucos (um a cada 1,2 s) para estarem prontos na primeira vez, sem travar
  if (!this.fila) this.fila = Object.keys(VOICE_CLIPS).filter((k) => /^(amb|sfx)_/.test(k));
  this.prepT = (this.prepT || 0) - dt;
  if (this.fila.length && this.prepT <= 0) { this.prepT = 1.2; this.pronto(this.fila.shift()); }
  const c = AudioSys.ctx, t = c.currentTime;
  const jogando = Game.mode === 'play' && Game.state === 'playing';
  const fora = !jogando || Screens.current === 'screen-pause' || Screens.current === 'screen-main';
  this.mixT = (this.mixT || 0) - dt;
  if (this.mixT <= 0) this.mix(c, t, fora);
  if (!jogando || !player) return;
  this.resto(dt);
};
// volumes dos fundos (4 vezes por segundo basta: a troca é lenta)
Ambiente.mix = function (c, t, fora) {
  this.mixT = 0.25;
  const W = this.pesos();
  for (const k in AMB_FUNDO) {
    const [clip, vol] = AMB_FUNDO[k], alvo = (fora ? 0.25 : 1) * vol * W[k];
    let F = this.fundos[k];
    if (!F) {
      if (alvo < 0.01) continue;
      const b = this.pronto(clip); if (!b) continue;
      const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.loopStart = 0.03; s.loopEnd = Math.max(1, b.duration - 0.03);
      const g = c.createGain(); g.gain.value = 0; s.connect(g); g.connect(AudioSys.bus.ambient); s.start(0, Math.random() * (b.duration - 1));
      F = this.fundos[k] = { s, g };
    }
    F.g.gain.setTargetAtTime(alvo, t, 1.4);
  }
};
Ambiente.resto = function (dt) {
  // carro do trânsito passando raspando: o som passa junto (carro, moto, caminhão ou ônibus)
  this.passouT -= dt;
  // só quando eu estou rápido (acima de 85 km/h): devagar, carro passando não faz barulho nenhum
  if (this.passouT <= 0 && player.speed * 0.3 > 85) {
    for (const a of Traffic.cars) {
      const dx = a.x - player.x, dy = a.y - player.y; if (dx * dx + dy * dy > 68 * 68) continue; // 55% mais perto que antes (150 → 68)
      const rel = Math.hypot((a.vx || Math.cos(a.a) * (a.v || 0)) - player.vx, (a.vy || Math.sin(a.a) * (a.v || 0)) - player.vy);
      if (rel < 280 || (this.passou.get(a) || -9) > Game.time - 6) continue;
      this.passou.set(a, Game.time); this.passouT = 1.1;
      const kd = a.m && a.m.kind, clip = kd === 'moto' ? 'sfx_moto' : kd === 'truck' ? 'sfx_caminhao' : kd === 'bus' ? 'sfx_onibus' : 'sfx_carro';
      this.toca(clip, a.x, a.y, clamp((rel - 200) / 900, 0.12, 0.38), 900); // mais baixo que antes
      break;
    }
    if (this.passou.size > 40) this.passou.clear();
  }
  // gente reunida perto: conversa e risada de vez em quando
  this.pessoasT -= dt;
  if (this.pessoasT <= 0) {
    this.pessoasT = rnd(6, 11);
    let n = 0, px = 0, py = 0;
    for (const an of Animals.list) if (an.type === 'person' && !an.morto && Math.abs(an.x - Cam.x) < 380 && Math.abs(an.y - Cam.y) < 300) { n++; px += an.x; py += an.y; }
    if (n >= 3 && Math.random() < 0.55 && AMB_FAVELAS[regionKeyAt(Cam.x, Cam.y)]) this.toca('sfx_risada', px / n, py / n, 0.4, 900); // risada só na favela
  }
};
// sorteio dos sons soltos do lugar (chamado pelo relógio de sons dos bichos); devolve false se ainda não carregou
Ambiente.sorteia = function (rk, R, cx, cy) {
  if (!AudioSys.ok) return false;
  const perto = (tipo, raio) => { let best = null, bd = raio * raio; for (const a of Animals.list) if (a.type === tipo) { const d = (a.x - cx) ** 2 + (a.y - cy) ** 2; if (d < bd) { bd = d; best = a; } } return best; };
  const longe = () => { const ang = Math.random() * TAU, r = rnd(350, 900); return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]; };
  const op = []; // [peso, clip, x, y, vol]
  const add = (w, clip, p, vol) => { if (w > 0) op.push([w, clip, p[0], p[1], vol]); };
  const hr = (Profile.time % 1440) / 60, madrugada = hr >= 4 && hr < 6.5;
  // roça e mata: bicho só faz barulho se existir um de verdade por perto (nada de vaca mugindo no meio do nada)
  const v = perto('cow', 800), cv = perto('horse', 800), gl = perto('chicken', 700), ow = perto('owl', 900);
  if (rk === 'mata' || R.rural > 0.5) {
    if (v) add(3, 'sfx_vaca', [v.x, v.y], 0.55);
    if (cv) add(2, 'sfx_cavalo', [cv.x, cv.y], 0.5);
    if (gl) { add(2, 'sfx_galinha', [gl.x, gl.y], 0.45); add(madrugada ? 3 : 0.35, 'sfx_galo', [gl.x, gl.y], 0.5); }
    if (ow) add(1.2, 'sfx_coruja', [ow.x, ow.y], 0.4);
    if (rk === 'rodovia') { add(2.5, 'sfx_caminhao', longe(), 0.5); add(1.5, 'sfx_carro', longe(), 0.45); }
  } else if (AMB_FAVELAS[rk]) {
    add(2, 'sfx_moto', longe(), 0.45); add(1.5, 'sfx_risada', longe(), 0.4);
    add(0.4, 'buzina', longe(), 0); // rojão e galo saíram (pedido do dono: menos sons)
  } else {
    add(1, 'buzina', longe(), 0); // cidade como era antes: só buzina ao longe (sem sons gravados nem cachorro)
  }
  const campo = rk === 'mata' || R.rural > 0.5;
  if (!op.length) return true; // sem bicho por perto: só o fundo (grilos, sapos) toca
  let tot = 0; for (const o of op) tot += o[0];
  let r = Math.random() * tot, o = op[0]; for (const q of op) { r -= q[0]; if (r <= 0) { o = q; break; } }
  if (o[1] === 'buzina') { AudioSys.aiHorn(rnd(500, 850), pick(Object.keys(HORNS)), rnd(-0.8, 0.8)); return true; }
  return this.toca(o[1], o[2], o[3], o[4], 1600) || campo; // no campo nunca cai no mugido sintetizado
};

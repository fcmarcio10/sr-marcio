/* Itens, ícones desenhados no código, tabelas de saque e receitas. */
const ITEMS = {
  // --- armas improvisadas
  cabo:      { n: 'Cabo de vassoura', t: 'melee', w: 0.6, dmg: 9, rng: 1.5, spd: 0.5, dur: 28, stam: 5, ic: ['stick', '#b08a52'], d: 'Leve e comprido. Quebra fácil.' },
  frigideira:{ n: 'Frigideira', t: 'melee', w: 1.2, dmg: 13, rng: 1.05, spd: 0.55, dur: 70, stam: 7, ic: ['pan', '#3a3a3e'], d: 'Ferro fundido. Faz barulho quando acerta.' },
  taco:      { n: 'Taco de sinuca', t: 'melee', w: 0.7, dmg: 11, rng: 1.6, spd: 0.48, dur: 24, stam: 5, ic: ['stick', '#7a4a26', 'cue'], d: 'Veio do boteco. Alcance bom, madeira fraca.' },
  chave:     { n: 'Chave de roda', t: 'melee', w: 1.6, dmg: 17, rng: 1.1, spd: 0.62, dur: 130, stam: 8, ic: ['wrench', '#8a8f96'], d: 'Aço pesado. Dura bastante.' },
  pecabra:   { n: 'Pé de cabra', t: 'melee', w: 2.1, dmg: 21, rng: 1.25, spd: 0.74, dur: 220, stam: 10, ic: ['crowbar', '#9a2e25'], d: 'Quase não quebra. Golpe lento e forte.' },
  enxada:    { n: 'Enxada', t: 'melee', w: 2.4, dmg: 23, rng: 1.65, spd: 0.95, dur: 75, stam: 12, multi: 2, ic: ['hoe', '#8a6a3e'], d: 'Comprida e pesada. Acerta até dois de uma vez.' },
  martelo:   { n: 'Martelo', t: 'melee', w: 1.1, dmg: 15, rng: 0.95, spd: 0.5, dur: 160, stam: 6, ic: ['hammer', '#6b4a2a'], d: 'Serve de arma e para pregar tábuas nas portas.' },
  tabua_pregos: { n: 'Tábua com pregos', t: 'melee', w: 1.5, dmg: 20, rng: 1.3, spd: 0.7, dur: 38, stam: 9, ic: ['plankw', '#9a7446'], d: 'Feita à mão. Machuca bem, dura pouco.' },
  // --- armas brancas
  faca:      { n: 'Faca de cozinha', t: 'melee', w: 0.3, dmg: 14, rng: 0.9, spd: 0.38, dur: 40, stam: 4, ic: ['knife', '#c9ced4', 12], d: 'Rápida e curta. Precisa chegar perto.' },
  peixeira:  { n: 'Peixeira', t: 'melee', w: 0.5, dmg: 20, rng: 1.0, spd: 0.42, dur: 75, stam: 5, ic: ['knife', '#d5d9de', 18], d: 'Lâmina larga de feira. Rápida e firme.' },
  facao:     { n: 'Facão', t: 'melee', w: 0.9, dmg: 27, rng: 1.3, spd: 0.6, dur: 115, stam: 8, multi: 2, ic: ['knife', '#bfc5cc', 26], d: 'De cortar mato. O melhor amigo de quem sobrou.' },
  machado:   { n: 'Machado', t: 'melee', w: 2.6, dmg: 36, rng: 1.3, spd: 1.0, dur: 130, stam: 14, ic: ['axe', '#7a5530'], d: 'Devagar, mas resolve em um ou dois golpes.' },
  lanca:     { n: 'Lança improvisada', t: 'melee', w: 0.9, dmg: 24, rng: 1.95, spd: 0.68, dur: 22, stam: 7, ic: ['spear', '#b08a52'], d: 'Faca amarrada num cabo. Mantém distância.' },
  // --- armas de fogo (fictícias)
  trovao38:  { n: 'Revólver Trovão .38', t: 'gun', w: 0.9, dmg: 46, rng: 14, mag: 6, prec: 0.9, ammo: 'm38', rate: 0.5, reload: 2.4, noise: 34, ic: ['revolver', '#4a4d52'], d: 'Seis tiros. Simples e confiável.' },
  carcara9:  { n: 'Pistola Carcará 9', t: 'gun', w: 0.8, dmg: 38, rng: 15, mag: 12, prec: 0.88, ammo: 'm9', rate: 0.28, reload: 1.6, noise: 32, ic: ['pistol', '#2f3236'], d: 'Da delegacia. Doze tiros no pente.' },
  cartucheira:{ n: 'Cartucheira 12', t: 'gun', w: 3.1, dmg: 19, pellets: 7, rng: 8.5, mag: 2, prec: 0.62, ammo: 'm12', rate: 0.7, reload: 2.6, noise: 44, ic: ['shotgun', '#5a3d22'], d: 'Dois canos. De perto não sobra nada. Acorda o bairro inteiro.' },
  jaguatirica:{ n: 'Rifle Jaguatirica .22', t: 'gun', w: 2.7, dmg: 62, rng: 22, mag: 5, prec: 0.97, ammo: 'm22', rate: 0.9, reload: 2.8, noise: 28, ic: ['rifle', '#6a4526'], d: 'De caça. Preciso de longe, lento para recarregar.' },
  m38: { n: 'Munição .38', t: 'ammo', w: 0.02, stack: 60, ic: ['ammo', '#c9a44a'], d: 'Para o Trovão .38.' },
  m9:  { n: 'Munição 9 mm', t: 'ammo', w: 0.015, stack: 80, ic: ['ammo', '#d0b060'], d: 'Para a Carcará 9.' },
  m12: { n: 'Cartucho 12', t: 'ammo', w: 0.05, stack: 30, ic: ['shell', '#b0372c'], d: 'Para a Cartucheira.' },
  m22: { n: 'Munição .22', t: 'ammo', w: 0.01, stack: 80, ic: ['ammo', '#b89858'], d: 'Para o Jaguatirica.' },
  // --- arremesso / afastar
  rojao:     { n: 'Rojão', t: 'throw', w: 0.2, stack: 6, ic: ['rocket', '#c23b2e'], d: 'Jogue longe: o estouro chama os zumbis para lá.' },
  molotov:   { n: 'Coquetel molotov', t: 'throw', w: 0.8, stack: 4, ic: ['molotov', '#6a8a4a'], d: 'Cachaça e pano. Fogo no chão por alguns segundos.' },
  sinalizador:{ n: 'Sinalizador', t: 'throw', w: 0.3, stack: 4, ic: ['flare', '#d8452e'], d: 'Luz vermelha que prende a atenção deles por um tempo.' },
  // --- defesa
  jaqueta:   { n: 'Jaqueta de couro', t: 'body', w: 1.8, def: 0.3, ic: ['jacket', '#4a3426'], d: 'De motoqueiro. Segura arranhão e mordida leve.' },
  colete:    { n: 'Colete balístico', t: 'body', w: 3.2, def: 0.5, ic: ['vest', '#3b4046'], d: 'Da delegacia. Pesado, protege muito.' },
  capacete:  { n: 'Capacete de moto', t: 'head', w: 1.3, def: 0.15, ic: ['helmet', '#b63a2c'], d: 'Protege a cabeça. Abafa um pouco o som.' },
  // --- ferramentas
  lanterna:  { n: 'Lanterna', t: 'tool', w: 0.4, ic: ['flash', '#d0a52c'], d: 'Tecla F. Gasta pilha. De noite os zumbis veem a luz de longe.' },
  pilhas:    { n: 'Pilhas', t: 'mat', w: 0.1, stack: 8, ic: ['battery', '#d4a017'], d: 'Recarregam a lanterna.' },
  // --- comida
  pao:       { n: 'Pão francês', t: 'food', w: 0.1, stack: 6, hunger: 12, ic: ['bread', '#d9a65a'], d: 'Meio duro, mas é pão.' },
  feijao:    { n: 'Lata de feijão', t: 'food', w: 0.45, stack: 4, hunger: 32, ic: ['can', '#7a3b2a', '#e8dcc0'], d: 'Feijão pronto. Enche a barriga.' },
  sardinha:  { n: 'Sardinha em lata', t: 'food', w: 0.15, stack: 6, hunger: 20, thirst: -4, ic: ['tin', '#c7a233', '#28507a'], d: 'Salgada. Dá sede.' },
  marmita:   { n: 'Marmita', t: 'food', w: 0.6, stack: 2, hunger: 45, ic: ['tray', '#c9ccd0'], d: 'Arroz, feijão e uma mistura. Banquete.' },
  biscoito:  { n: 'Biscoito recheado', t: 'food', w: 0.15, stack: 6, hunger: 14, ic: ['pack', '#7b3fa0', '#f1e6d0'], d: 'Açúcar puro. Ajuda.' },
  goiabada:  { n: 'Goiabada', t: 'food', w: 0.3, stack: 4, hunger: 18, energy: 3, ic: ['block', '#8e1f2f'], d: 'Doce e pesada. Dura para sempre.' },
  pacoca:    { n: 'Paçoca', t: 'food', w: 0.03, stack: 12, hunger: 7, energy: 2, ic: ['pacoca', '#c8a26a'], d: 'Esfarela toda, mas levanta o ânimo.' },
  rapadura:  { n: 'Rapadura', t: 'food', w: 0.25, stack: 4, hunger: 14, energy: 6, ic: ['block', '#7a5222'], d: 'Energia de verdade.' },
  banana:    { n: 'Banana', t: 'food', w: 0.12, stack: 8, hunger: 10, thirst: 2, ic: ['banana', '#e3c63a'], d: 'Madura no ponto.' },
  farinha:   { n: 'Farinha de mandioca', t: 'food', w: 0.5, stack: 3, hunger: 16, thirst: -8, ic: ['sack', '#eadfbe'], d: 'Seca. Só com água do lado.' },
  carneseca: { n: 'Carne seca', t: 'food', w: 0.3, stack: 4, hunger: 28, thirst: -10, ic: ['meat', '#7a3a2c'], d: 'Muito sal. Mata a fome por horas.' },
  miojo:     { n: 'Macarrão instantâneo', t: 'food', w: 0.09, stack: 8, hunger: 13, thirst: -5, ic: ['pack', '#d8862a', '#f3e2a8'], d: 'Cru mesmo. Não tem gás.' },
  // --- bebida
  agua:      { n: 'Garrafa d\'água', t: 'drink', w: 0.55, stack: 4, thirst: 38, gives: 'garrafa', ic: ['bottle', '#9fd0e8', '#2a6aa8'], d: 'Água limpa. O que mais vale agora.' },
  garrafa:   { n: 'Garrafa vazia', t: 'mat', w: 0.05, stack: 6, ic: ['bottle', '#dfe9ee', '#8a9aa6'], d: 'Encha numa pia enquanto ainda tem água na rua.' },
  guarana:   { n: 'Refrigerante de guaraná', t: 'drink', w: 0.4, stack: 4, thirst: 24, energy: 6, ic: ['canS', '#1e7a3c', '#d8b23a'], d: 'Quente, mas é guaraná.' },
  coco:      { n: 'Água de coco', t: 'drink', w: 0.35, stack: 4, thirst: 30, hunger: 4, ic: ['boxd', '#3f8f5a', '#f2f2ea'], d: 'De caixinha.' },
  cerveja:   { n: 'Cerveja', t: 'drink', w: 0.4, stack: 6, thirst: 14, energy: -6, ic: ['canS', '#c9a227', '#f6efd6'], d: 'Mata um pouco a sede. Dá sono.' },
  cachaca:   { n: 'Cachaça', t: 'drink', w: 0.7, stack: 2, thirst: 4, energy: -10, hp: 3, ic: ['bottle', '#e8e2c0', '#a6772c'], d: 'Serve para beber, mas é melhor guardar para o molotov.' },
  cafe:      { n: 'Café solúvel', t: 'drink', w: 0.2, stack: 3, thirst: -4, energy: 24, ic: ['jar', '#5a3520', '#c23b2e'], d: 'Com água fria. Espanta o sono.' },
  // --- remédios (fictícios)
  atadura:   { n: 'Atadura', t: 'med', w: 0.05, stack: 8, bleed: 1, hp: 4, ic: ['bandage', '#eee8dc'], d: 'Estanca um sangramento.' },
  curativos: { n: 'Kit de curativos', t: 'med', w: 0.2, stack: 4, bleed: 3, hp: 14, ic: ['medbox', '#e9e4da', '#3a8a5a'], d: 'Gaze, esparadrapo e antisséptico.' },
  dorzil:    { n: 'Dorzil (analgésico)', t: 'med', w: 0.03, stack: 8, hp: 12, ic: ['pills', '#d85a4a'], d: 'Tira a dor e recupera um pouco.' },
  bactrix:   { n: 'Bactrix (antibiótico)', t: 'med', w: 0.03, stack: 4, cure: 1, ic: ['pills', '#3a78c2'], d: 'Cura a infecção de uma mordida. Raro.' },
  soro:      { n: 'Soro caseiro', t: 'med', w: 0.5, stack: 3, thirst: 40, hp: 6, ic: ['bottle', '#f0e9c8', '#c9a23a'], d: 'Água, sal e açúcar. Reidrata rápido.' },
  primeiros: { n: 'Kit de primeiros socorros', t: 'med', w: 0.9, stack: 2, bleed: 3, hp: 45, ic: ['medkit', '#c23b2e'], d: 'Kit completo da UPA.' },
  guaranapo: { n: 'Guaraná em pó', t: 'med', w: 0.1, stack: 4, energy: 30, ic: ['jar', '#7a2c1e', '#e0c060'], d: 'Uma colher e o sono vai embora.' },
  // --- materiais
  pano:      { n: 'Pano', t: 'mat', w: 0.1, stack: 10, ic: ['cloth', '#b9b2a2'], d: 'Vira atadura ou pavio de molotov.' },
  tabua:     { n: 'Tábua', t: 'mat', w: 1.2, stack: 6, ic: ['plank', '#a37c4c'], d: 'Com martelo e pregos, reforça uma porta.' },
  pregos:    { n: 'Pregos', t: 'mat', w: 0.02, stack: 40, ic: ['nails', '#9aa0a6'], d: 'Caixa de pregos.' },
  fita:      { n: 'Fita prateada', t: 'mat', w: 0.15, stack: 4, ic: ['tape', '#b8bcc2'], d: 'Conserta a arma que está na mão (+40% de vida útil).' },
  // --- mochilas
  mochila:   { n: 'Mochila escolar', t: 'bag', w: 0.5, cap: 8, slots: 6, ic: ['pack2', '#2c5a8a'], d: 'Mais 8 kg e 6 espaços.' },
  cargueira: { n: 'Mochila cargueira', t: 'bag', w: 1.2, cap: 16, slots: 12, ic: ['pack2', '#5a6a3a'], d: 'Mais 16 kg e 12 espaços.' }
};
for (const k in ITEMS) { ITEMS[k].k = k; if (!ITEMS[k].stack) ITEMS[k].stack = 1; }

const RECIPES = [
  { out: 'molotov', q: 1, need: { cachaca: 1, pano: 1 }, n: 'Coquetel molotov' },
  { out: 'atadura', q: 2, need: { pano: 1 }, n: 'Atadura (rasgar pano)' },
  { out: 'lanca', q: 1, need: { cabo: 1, faca: 1, fita: 1 }, n: 'Lança improvisada' },
  { out: 'tabua_pregos', q: 1, need: { tabua: 1, pregos: 6 }, tool: 'martelo', n: 'Tábua com pregos' },
  { out: 'soro', q: 1, need: { agua: 1, pacoca: 1 }, n: 'Soro caseiro (água + doce)' }
];

/* Tabelas de saque: [item, peso, mín, máx] */
const LOOT = {
  cozinha:   { rolls: [1, 3], it: [['faca', 5, 1, 1], ['frigideira', 4, 1, 1], ['feijao', 6, 1, 2], ['miojo', 6, 1, 3], ['farinha', 4, 1, 1], ['cafe', 3, 1, 1], ['pao', 4, 1, 3], ['sardinha', 5, 1, 2], ['goiabada', 3, 1, 1], ['pano', 4, 1, 2], ['garrafa', 3, 1, 2], ['peixeira', 1.5, 1, 1], ['rapadura', 2, 1, 1], ['biscoito', 4, 1, 2]] },
  geladeira: { rolls: [0, 3], it: [['agua', 7, 1, 2], ['guarana', 5, 1, 2], ['cerveja', 5, 1, 3], ['marmita', 3, 1, 1], ['coco', 3, 1, 2], ['banana', 3, 1, 3]] },
  quarto:    { rolls: [0, 2], it: [['pano', 6, 1, 3], ['mochila', 2.5, 1, 1], ['lanterna', 2, 1, 1], ['pilhas', 3, 1, 2], ['dorzil', 2, 1, 2], ['jaqueta', 1.2, 1, 1], ['pacoca', 3, 1, 4], ['trovao38', 0.35, 1, 1], ['m38', 0.8, 3, 8], ['capacete', 0.8, 1, 1], ['biscoito', 2, 1, 1]] },
  banheiro:  { rolls: [0, 2], it: [['atadura', 6, 1, 2], ['dorzil', 5, 1, 3], ['curativos', 2.5, 1, 1], ['pano', 4, 1, 2], ['bactrix', 0.6, 1, 1]] },
  sala:      { rolls: [0, 2], it: [['pilhas', 4, 1, 2], ['lanterna', 2, 1, 1], ['cachaca', 3, 1, 1], ['biscoito', 3, 1, 1], ['pano', 3, 1, 1], ['fita', 2, 1, 1], ['cabo', 3, 1, 1], ['pacoca', 3, 1, 3]] },
  mercado:   { rolls: [1, 4], it: [['feijao', 7, 1, 3], ['sardinha', 7, 1, 3], ['miojo', 7, 1, 4], ['biscoito', 6, 1, 3], ['farinha', 5, 1, 2], ['goiabada', 4, 1, 2], ['carneseca', 3, 1, 2], ['cafe', 3, 1, 1], ['pacoca', 4, 2, 6], ['rapadura', 3, 1, 2], ['banana', 2, 1, 4]] },
  bebidas:   { rolls: [1, 4], it: [['agua', 8, 1, 3], ['guarana', 7, 1, 3], ['coco', 4, 1, 2], ['cerveja', 6, 1, 4], ['cachaca', 3, 1, 1]] },
  padaria:   { rolls: [1, 3], it: [['pao', 9, 2, 5], ['biscoito', 5, 1, 2], ['cafe', 4, 1, 1], ['goiabada', 3, 1, 1], ['agua', 3, 1, 1], ['guarana', 3, 1, 2], ['faca', 2, 1, 1]] },
  bar:       { rolls: [1, 3], it: [['cerveja', 9, 1, 4], ['cachaca', 7, 1, 2], ['guarana', 4, 1, 2], ['taco', 3, 1, 1], ['pacoca', 4, 1, 4], ['sardinha', 3, 1, 1], ['pano', 3, 1, 2], ['agua', 2, 1, 1]] },
  farmacia:  { rolls: [1, 4], it: [['atadura', 8, 1, 3], ['dorzil', 8, 1, 3], ['curativos', 5, 1, 2], ['bactrix', 2, 1, 1], ['soro', 4, 1, 2], ['guaranapo', 3, 1, 1], ['agua', 2, 1, 1], ['primeiros', 1, 1, 1]] },
  hospital:  { rolls: [1, 4], it: [['atadura', 7, 1, 4], ['curativos', 6, 1, 2], ['primeiros', 3, 1, 1], ['bactrix', 3, 1, 2], ['dorzil', 5, 1, 3], ['soro', 5, 1, 2], ['pano', 3, 1, 3]] },
  armas:     { rolls: [2, 4], it: [['carcara9', 4, 1, 1], ['m9', 8, 8, 20], ['cartucheira', 2, 1, 1], ['m12', 5, 4, 10], ['colete', 3, 1, 1], ['trovao38', 3, 1, 1], ['m38', 5, 6, 14], ['lanterna', 2, 1, 1], ['sinalizador', 3, 1, 2]] },
  delegacia: { rolls: [0, 2], it: [['m9', 4, 4, 10], ['lanterna', 4, 1, 1], ['pilhas', 4, 1, 2], ['atadura', 3, 1, 1], ['cafe', 3, 1, 1], ['sinalizador', 2, 1, 1], ['m38', 3, 3, 8], ['colete', 0.7, 1, 1]] },
  ferragens: { rolls: [1, 3], it: [['martelo', 6, 1, 1], ['pregos', 8, 8, 20], ['tabua', 7, 1, 3], ['pecabra', 3, 1, 1], ['fita', 5, 1, 2], ['enxada', 3, 1, 1], ['machado', 1.5, 1, 1], ['facao', 2.5, 1, 1], ['lanterna', 3, 1, 1], ['pilhas', 4, 1, 3], ['cabo', 4, 1, 1]] },
  oficina:   { rolls: [1, 3], it: [['chave', 7, 1, 1], ['pecabra', 3, 1, 1], ['fita', 5, 1, 2], ['martelo', 3, 1, 1], ['pano', 5, 1, 3], ['lanterna', 2, 1, 1], ['pilhas', 3, 1, 2], ['capacete', 2, 1, 1], ['jaqueta', 1.5, 1, 1], ['guarana', 2, 1, 1]] },
  galpao:    { rolls: [0, 3], it: [['tabua', 8, 1, 4], ['pregos', 6, 6, 16], ['fita', 3, 1, 1], ['cargueira', 1.2, 1, 1], ['feijao', 3, 1, 4], ['agua', 3, 1, 3], ['enxada', 2, 1, 1], ['pecabra', 2, 1, 1], ['rojao', 2, 1, 3], ['machado', 1, 1, 1]] },
  carro:     { rolls: [0, 2], it: [['chave', 5, 1, 1], ['agua', 3, 1, 1], ['pano', 4, 1, 2], ['lanterna', 2, 1, 1], ['fita', 2, 1, 1], ['biscoito', 2, 1, 1], ['mochila', 1, 1, 1], ['guarana', 2, 1, 1], ['rojao', 1, 1, 2], ['dorzil', 1.5, 1, 1], ['capacete', 0.8, 1, 1]] },
  lixo:      { rolls: [0, 1], it: [['garrafa', 6, 1, 2], ['pano', 5, 1, 1], ['cabo', 2, 1, 1], ['tabua', 2, 1, 1]] },
  escola:    { rolls: [0, 2], it: [['mochila', 4, 1, 1], ['biscoito', 5, 1, 2], ['pacoca', 5, 1, 4], ['pano', 2, 1, 1], ['agua', 3, 1, 1], ['pilhas', 2, 1, 1], ['cabo', 2, 1, 1]] },
  posto:     { rolls: [1, 3], it: [['guarana', 6, 1, 2], ['agua', 6, 1, 2], ['biscoito', 6, 1, 2], ['pacoca', 4, 1, 4], ['pilhas', 4, 1, 2], ['cerveja', 4, 1, 3], ['lanterna', 2, 1, 1], ['chave', 2, 1, 1], ['fita', 2, 1, 1]] },
  roupas:    { rolls: [1, 2], it: [['pano', 9, 1, 4], ['jaqueta', 3, 1, 1], ['mochila', 3, 1, 1], ['cargueira', 1, 1, 1], ['capacete', 1, 1, 1]] },
  igreja:    { rolls: [0, 2], it: [['pano', 4, 1, 2], ['agua', 3, 1, 2], ['pao', 3, 1, 3], ['atadura', 2, 1, 1], ['biscoito', 2, 1, 1]] },
  festa:     { rolls: [1, 3], it: [['rojao', 9, 1, 4], ['sinalizador', 3, 1, 1], ['cerveja', 3, 1, 3], ['guarana', 3, 1, 2]] },
  camp:      { rolls: [2, 4], it: [['feijao', 5, 1, 2], ['agua', 6, 1, 2], ['atadura', 4, 1, 2], ['facao', 2, 1, 1], ['m38', 2, 3, 8], ['rojao', 3, 1, 2], ['pilhas', 3, 1, 2], ['carneseca', 3, 1, 1], ['jaguatirica', 0.8, 1, 1], ['m22', 2, 5, 12], ['cargueira', 1, 1, 1]] },
  sitio:     { rolls: [1, 3], it: [['enxada', 5, 1, 1], ['facao', 4, 1, 1], ['jaguatirica', 1.5, 1, 1], ['m22', 4, 5, 14], ['cartucheira', 1, 1, 1], ['m12', 3, 2, 6], ['banana', 5, 2, 5], ['farinha', 4, 1, 2], ['rapadura', 4, 1, 2], ['carneseca', 4, 1, 2], ['machado', 2, 1, 1]] }
};
function rollLoot(table, rng) {
  const T = LOOT[table] || LOOT.lixo, out = [];
  const n = T.rolls[0] + Math.floor(rng() * (T.rolls[1] - T.rolls[0] + 1));
  let tot = 0; for (const e of T.it) tot += e[1];
  for (let r = 0; r < n; r++) {
    let v = rng() * tot, e = T.it[0];
    for (const c of T.it) { v -= c[1]; if (v <= 0) { e = c; break; } }
    const q = e[2] + Math.floor(rng() * (e[3] - e[2] + 1));
    out.push(newItem(e[0], q, rng));
  }
  return out;
}
function newItem(k, q, rng) {
  const d = ITEMS[k], it = { k, q: Math.min(q || 1, d.stack) };
  const r = rng ? rng() : Math.random();
  if (d.t === 'melee') it.d = Math.round(d.dur * (rng ? 0.45 + r * 0.55 : 1));
  if (d.t === 'gun') it.a = rng ? Math.floor(r * (d.mag + 1)) : 0;
  if (k === 'lanterna') it.c = rng ? Math.round(30 + r * 70) : 100;
  return it;
}

/* ---------- Ícones ---------- */
const _icons = new Map();
function itemIcon(k, px) {
  px = px || 48;
  const key = k + '@' + px;
  let c = _icons.get(key);
  if (c) return c;
  const [cv, g] = mk(px, px);
  g.scale(px / 48, px / 48);
  g.lineJoin = g.lineCap = 'round';
  const ic = ITEMS[k].ic, a = ic[1], b = ic[2];
  const O = '#15130f';
  const rr = (x, y, w, h, r, f, s) => { g.beginPath(); g.roundRect(x, y, w, h, r); if (f) { g.fillStyle = f; g.fill(); } if (s !== 0) { g.strokeStyle = s || O; g.lineWidth = 1.6; g.stroke(); } };
  const poly = (p, f, s) => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); if (f) { g.fillStyle = f; g.fill(); } if (s !== 0) { g.strokeStyle = s || O; g.lineWidth = 1.6; g.stroke(); } };
  const ell = (x, y, rx, ry, f, s) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); if (f) { g.fillStyle = f; g.fill(); } if (s !== 0) { g.strokeStyle = s || O; g.lineWidth = 1.6; g.stroke(); } };
  const diag = fn => { g.save(); g.translate(24, 24); g.rotate(-Math.PI / 4); fn(); g.restore(); };
  switch (ic[0]) {
    case 'stick': diag(() => { rr(-21, -2, 42, 4, 2, a); if (b === 'cue') { rr(-21, -2.5, 12, 5, 2, '#2a1a10'); rr(18, -1.5, 3, 3, 1, '#e8e2d0'); } }); break;
    case 'spear': diag(() => { rr(-21, -1.8, 34, 3.6, 2, a); poly([12, -3.5, 23, 0, 12, 3.5], '#cfd4da'); rr(9, -2.6, 5, 5.2, 1, '#8a8f96'); }); break;
    case 'pan': diag(() => { rr(-22, -2.2, 20, 4.4, 2, '#22201e'); ell(8, 0, 12, 12, a); ell(8, 0, 8.5, 8.5, shade(a, 1.25), 0); }); break;
    case 'wrench': diag(() => { rr(-18, -2.2, 36, 4.4, 2, a); rr(14, -7, 6, 14, 2, shade(a, 0.85)); rr(-21, -4, 7, 8, 2, shade(a, 0.85)); }); break;
    case 'crowbar': diag(() => { rr(-20, -2, 36, 4, 2, a); g.beginPath(); g.moveTo(15, 0); g.quadraticCurveTo(23, 0, 21, -9); g.strokeStyle = O; g.lineWidth = 6.4; g.stroke(); g.strokeStyle = a; g.lineWidth = 3.6; g.stroke(); poly([-22, -3, -17, -2, -17, 2, -22, 3], '#d2d6da'); }); break;
    case 'hoe': diag(() => { rr(-21, -1.8, 40, 3.6, 2, a); poly([16, -2, 22, -2, 22, 11, 13, 11], '#7f858c'); }); break;
    case 'hammer': diag(() => { rr(-18, -2.2, 32, 4.4, 2, a); rr(10, -8, 9, 16, 2, '#70767d'); }); break;
    case 'axe': diag(() => { rr(-20, -2.2, 38, 4.4, 2, a); poly([8, -3, 17, -3, 20, -13, 6, -10], '#aeb4bb'); }); break;
    case 'plankw': diag(() => { rr(-20, -4, 40, 8, 1.5, a); g.strokeStyle = '#d6dade'; g.lineWidth = 1.4; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(4 + i * 4.5, -4); g.lineTo(5 + i * 4.5, -10); g.stroke(); } }); break;
    case 'knife': diag(() => { const L = b; rr(-18, -2.6, 13, 5.2, 2, '#3a2a1c'); poly([-5, -3.2, -5 + L, -3.2, -5 + L + 5, 0.5, -5 + L - 2, 3.4, -5, 3.4], a); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-3, -1.6); g.lineTo(-7 + L, -1.6); g.stroke(); }); break;
    case 'revolver': poly([8, 17, 36, 17, 36, 22, 26, 22, 26, 25, 21, 25, 18, 38, 10, 38, 13, 25, 8, 24], a); ell(22, 21, 4.5, 4.5, shade(a, 1.3)); rr(10, 27, 8, 11, 2, '#5a3a22'); break;
    case 'pistol': poly([8, 16, 38, 16, 38, 23, 22, 23, 20, 38, 11, 38, 13, 24, 8, 23], a); rr(11, 26, 9, 12, 2, shade(a, 0.7)); rr(10, 17.5, 26, 2, 1, shade(a, 1.5), 0); break;
    case 'shotgun': diag(() => { poly([-22, -2, -8, -4, -8, 4, -22, 6], a); rr(-9, -3.5, 31, 3.2, 1, '#3a3d42'); rr(-9, 0.2, 31, 3.2, 1, '#3a3d42'); rr(-2, -4, 10, 8, 2, shade(a, 1.2)); }); break;
    case 'rifle': diag(() => { poly([-23, -1, -9, -3.5, -9, 3.5, -23, 6], a); rr(-10, -2.2, 33, 3.4, 1, '#34373c'); rr(-6, -3.2, 14, 6, 2, a); rr(-2, -7, 10, 3, 1.5, '#1e2022'); }); break;
    case 'ammo': for (let i = 0; i < 3; i++) { const x = 12 + i * 9; poly([x, 36, x, 20, x + 3, 12, x + 6, 20, x + 6, 36], a); rr(x - 0.5, 33, 7, 4, 1, shade(a, 0.7)); } break;
    case 'shell': for (let i = 0; i < 3; i++) { const x = 11 + i * 9.5; rr(x, 14, 7, 24, 2, a); rr(x, 31, 7, 7, 1.5, '#c9a44a'); } break;
    case 'rocket': diag(() => { rr(-22, -0.9, 30, 1.8, 1, '#b08a52'); rr(4, -4.5, 17, 9, 2, a); poly([21, -4.5, 21, 4.5, 26, 0], '#e4b93a'); rr(8, -4.5, 3, 9, 0, '#f0e6c8', 0); }); break;
    case 'molotov': rr(18, 19, 13, 23, 3, a); rr(21.5, 11, 6, 9, 1, a); poly([22, 11, 25, 3, 29, 9, 27, 12], '#e8e0cc'); poly([24, 5, 27, -1, 31, 6, 28, 9], '#e8892a', 0); rr(19.5, 26, 10, 8, 1, '#e9e0c0', 0); break;
    case 'flare': diag(() => { rr(-16, -4, 30, 8, 2, a); rr(-16, -4, 6, 8, 1, '#f0e6c8'); rr(14, -3, 5, 6, 1, '#2a2a2a'); }); break;
    case 'jacket': poly([14, 10, 20, 8, 24, 12, 28, 8, 34, 10, 42, 18, 37, 24, 34, 21, 34, 40, 14, 40, 14, 21, 11, 24, 6, 18], a); g.strokeStyle = shade(a, 1.6); g.lineWidth = 1.2; g.beginPath(); g.moveTo(24, 12); g.lineTo(24, 40); g.stroke(); break;
    case 'vest': poly([15, 9, 20, 9, 24, 14, 28, 9, 33, 9, 36, 20, 34, 40, 14, 40, 12, 20], a); rr(17, 22, 14, 7, 1, shade(a, 1.35)); rr(17, 31, 6, 6, 1, shade(a, 1.2)); rr(25, 31, 6, 6, 1, shade(a, 1.2)); break;
    case 'helmet': g.beginPath(); g.moveTo(8, 30); g.quadraticCurveTo(8, 9, 25, 9); g.quadraticCurveTo(41, 10, 40, 30); g.lineTo(34, 37); g.lineTo(14, 37); g.closePath(); g.fillStyle = a; g.fill(); g.strokeStyle = O; g.lineWidth = 1.6; g.stroke(); poly([20, 20, 39, 20, 40, 29, 22, 30], '#1c2228'); break;
    case 'flash': diag(() => { rr(-18, -4, 24, 8, 2, '#2f3338'); poly([6, -4, 16, -8, 16, 8, 6, 4], a); rr(16, -8, 3, 16, 1, '#f3edc8'); rr(-8, -5.2, 6, 2.4, 1, '#c23b2e', 0); }); break;
    case 'battery': for (let i = 0; i < 2; i++) { const x = 13 + i * 13; rr(x, 14, 10, 24, 2, a); rr(x, 14, 10, 8, 2, '#1e1e1e'); rr(x + 3, 11, 4, 3.5, 1, '#b8bcc2'); } break;
    case 'bandage': ell(22, 26, 12, 12, a); ell(22, 26, 4.5, 4.5, '#cfc6b4'); poly([30, 17, 41, 14, 42, 22, 33, 26], a); break;
    case 'medbox': rr(9, 14, 30, 22, 3, a); rr(9, 14, 30, 7, 3, b); rr(21, 23, 6, 10, 0.5, b, 0); rr(19, 25, 10, 6, 0.5, b, 0); break;
    case 'medkit': rr(8, 15, 32, 23, 3, a); rr(18, 10, 12, 6, 2, null); rr(21.5, 20, 5, 13, 0.5, '#f4f0e6', 0); rr(17.5, 24, 13, 5, 0.5, '#f4f0e6', 0); break;
    case 'pills': rr(9, 15, 30, 19, 3, '#d9dde0'); for (let i = 0; i < 6; i++) ell(15 + (i % 3) * 9, 21 + Math.floor(i / 3) * 8, 3, 2.4, a, 0); break;
    case 'cloth': poly([9, 16, 30, 11, 40, 20, 36, 34, 15, 38, 8, 28], a); g.strokeStyle = shade(a, 0.75); g.lineWidth = 1.2; g.beginPath(); g.moveTo(14, 22); g.lineTo(33, 18); g.moveTo(15, 30); g.lineTo(34, 26); g.stroke(); break;
    case 'plank': diag(() => { rr(-21, -5, 42, 10, 1.5, a); g.strokeStyle = shade(a, 0.75); g.lineWidth = 1; g.beginPath(); g.moveTo(-17, -1.5); g.lineTo(12, -2); g.moveTo(-10, 2); g.lineTo(17, 1.5); g.stroke(); }); break;
    case 'nails': rr(10, 20, 28, 18, 2, '#8a6a42'); g.strokeStyle = a; g.lineWidth = 1.8; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(14 + i * 5, 22); g.lineTo(16 + i * 4.4, 10 + (i % 2) * 3); g.stroke(); } break;
    case 'tape': ell(24, 25, 14, 13, a); ell(24, 25, 6.5, 6, '#3a3632'); break;
    case 'pack2': rr(12, 12, 24, 28, 7, a); rr(15, 24, 18, 12, 3, shade(a, 1.25)); g.strokeStyle = O; g.lineWidth = 1.6; g.beginPath(); g.moveTo(18, 12); g.quadraticCurveTo(24, 3, 30, 12); g.stroke(); rr(14, 17, 20, 2, 1, shade(a, 0.7), 0); break;
    case 'bread': ell(24, 26, 16, 9, a); g.strokeStyle = shade(a, 0.7); g.lineWidth = 1.4; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(15 + i * 7, 22); g.lineTo(19 + i * 7, 29); g.stroke(); } break;
    case 'can': rr(13, 12, 22, 27, 3, '#b9bec4'); rr(13, 17, 22, 16, 0, a, 0); rr(16, 21, 16, 8, 1, b, 0); rr(13, 12, 22, 27, 3, null); break;
    case 'canS': rr(16, 10, 16, 30, 4, a); rr(16, 21, 16, 8, 0, b, 0); rr(16, 10, 16, 30, 4, null); rr(19, 8, 10, 3, 1, '#c9ced4'); break;
    case 'tin': rr(8, 18, 32, 14, 5, a); rr(12, 21, 24, 8, 3, b, 0); ell(34, 21, 2.2, 2.2, '#e6e6e6'); break;
    case 'tray': poly([8, 20, 40, 20, 36, 36, 12, 36], a); rr(7, 17, 34, 5, 2, shade(a, 1.2)); break;
    case 'pack': rr(9, 14, 30, 21, 2, a); rr(13, 19, 22, 11, 2, b, 0); poly([9, 14, 6, 17, 9, 20], a); poly([39, 14, 42, 17, 39, 20], a); break;
    case 'block': poly([10, 20, 30, 14, 40, 20, 40, 32, 20, 38, 10, 32], a); poly([10, 20, 30, 14, 40, 20, 20, 26], shade(a, 1.35)); break;
    case 'pacoca': ell(24, 26, 9, 5, shade(a, 0.8)); rr(15, 14, 18, 12, 0, a); ell(24, 14, 9, 5, shade(a, 1.2)); break;
    case 'banana': g.beginPath(); g.moveTo(9, 16); g.quadraticCurveTo(18, 40, 41, 28); g.quadraticCurveTo(22, 32, 14, 14); g.closePath(); g.fillStyle = a; g.fill(); g.strokeStyle = O; g.lineWidth = 1.6; g.stroke(); break;
    case 'sack': g.beginPath(); g.moveTo(13, 12); g.quadraticCurveTo(24, 16, 35, 12); g.quadraticCurveTo(41, 28, 36, 40); g.lineTo(12, 40); g.quadraticCurveTo(7, 28, 13, 12); g.fillStyle = a; g.fill(); g.strokeStyle = O; g.lineWidth = 1.6; g.stroke(); rr(16, 23, 16, 9, 1, '#b5803a', 0); break;
    case 'meat': g.beginPath(); g.moveTo(9, 22); g.quadraticCurveTo(16, 9, 32, 13); g.quadraticCurveTo(43, 20, 38, 32); g.quadraticCurveTo(24, 41, 12, 34); g.closePath(); g.fillStyle = a; g.fill(); g.strokeStyle = O; g.lineWidth = 1.6; g.stroke(); g.strokeStyle = '#d9c9b0'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(16, 24); g.quadraticCurveTo(25, 18, 34, 24); g.stroke(); break;
    case 'bottle': rr(17, 16, 14, 26, 4, a); rr(21, 8, 6, 9, 1.5, a); rr(20.5, 5, 7, 4, 1, b); rr(17, 25, 14, 8, 0, b, 0); rr(17, 16, 14, 26, 4, null); break;
    case 'boxd': poly([14, 14, 24, 9, 34, 14, 34, 40, 14, 40], a); rr(17, 22, 14, 10, 1, b, 0); break;
    case 'jar': rr(14, 16, 20, 24, 4, a); rr(13, 10, 22, 7, 2, b); rr(17, 23, 14, 9, 1, '#efe6cf', 0); break;
    default: rr(12, 12, 24, 24, 4, a || '#888');
  }
  _icons.set(key, cv);
  return cv;
}

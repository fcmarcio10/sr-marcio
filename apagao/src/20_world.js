/* Santa Aurora: montagem da cidade (sempre a mesma, pelo sorteio com semente). */
const GR = { GRASS: 0, DIRT: 1, ASPH: 2, SIDE: 3, CER: 4, WOOD: 5, RED: 6, WHITE: 7, CHECK: 8, CONC: 9, PORT: 10, LW: 11, LN: 12, ZV: 13, ZH: 14, PARK: 15, FIELD: 16, DRYG: 17, DLW: 18, DLN: 19, COURT: 20 };
const E = { NONE: 0, WALL: 1, WIN: 2, DOOR: 3, DOPEN: 4, FRAME: 5, WOPEN: 6, MURO: 7, GRADE: 8, GATE: 9, GOPEN: 10 };
const ZONE = { MATO: 0, RES: 1, CENTRO: 2, PRACA: 3, UPA: 4, IND: 5, MORRO: 6, CEMIT: 7, CAMPO: 8, ESCOLA: 9, RUA: 10 };
const ZONE_NOME = ['Mato', 'Vila Mangueira', 'Centro', 'Praça da Matriz', 'UPA', 'Distrito Industrial', 'Morro do Urubu', 'Cemitério', 'Campo do Várzea', 'Escola', 'Rua'];
const ZONE_DENS = [0.10, 0.22, 0.42, 0.5, 0.6, 0.28, 0.5, 1.1, 0.2, 0.4, 0.2];

const edgePass = t => t === 0 || t === 4 || t === 5 || t === 6 || t === 10;
const edgeSee = t => t !== 1 && t !== 3;

const RWID = [10, 10, 12, 12, 10, 10], RPOS = [];
(function () { let p = 8; for (let i = 0; i < 6; i++) { RPOS.push(p); p += RWID[i] + 28; } })();
const RING0 = 8, RING1 = RPOS[5] + RWID[5];
function roadAt(v) { for (let i = 0; i < 6; i++) if (v >= RPOS[i] && v < RPOS[i] + RWID[i]) return i; return -1; }
const blockStart = i => RPOS[i] + RWID[i];

/* Objetos do cenário: tamanho, se bloqueia, recipiente, interação. Os desenhos ficam em 30_art.js */
const PROPS = {
  cama: { w: 1, h: 2, s: 1, inter: 'bed', n: 'Cama', sh: 0.5 }, cama_casal: { w: 2, h: 2, s: 1, inter: 'bed', n: 'Cama de casal', sh: 0.5 },
  sofa: { w: 2, h: 1, s: 1, inter: 'bed', n: 'Sofá', sh: 0.7 }, mesa: { w: 1, h: 1, s: 1, sh: 0.7 }, cadeira: { w: 1, h: 1, s: 1, sh: 0.6 },
  geladeira: { w: 1, h: 1, s: 1, cont: 'geladeira', n: 'Geladeira', sh: 1.7 }, fogao: { w: 1, h: 1, s: 1, cont: 'cozinha', n: 'Fogão', sh: 0.9 },
  armario_coz: { w: 1, h: 1, s: 1, cont: 'cozinha', n: 'Armário da cozinha', sh: 0.9 }, pia: { w: 1, h: 1, s: 1, inter: 'sink', n: 'Pia', sh: 0.9 },
  filtro: { w: 1, h: 1, s: 1, inter: 'filter', n: 'Filtro de barro', sh: 1.2 }, guarda_roupa: { w: 1, h: 1, s: 1, cont: 'quarto', n: 'Guarda-roupa', sh: 1.9 },
  comoda: { w: 1, h: 1, s: 1, cont: 'quarto', n: 'Cômoda', sh: 0.9 }, criado: { w: 1, h: 1, s: 1, cont: 'quarto', n: 'Criado-mudo', sh: 0.6 },
  estante: { w: 1, h: 1, s: 1, cont: 'sala', n: 'Estante', sh: 1.7 }, tv: { w: 1, h: 1, s: 1, cont: 'sala', n: 'Rack da TV', sh: 1.0 },
  vaso: { w: 1, h: 1, s: 1, sh: 0.5 }, pia_ban: { w: 1, h: 1, s: 1, cont: 'banheiro', n: 'Armário do banheiro', sh: 0.9 },
  prateleira: { w: 1, h: 1, s: 1, cont: 'mercado', n: 'Prateleira', sh: 1.6 }, arara: { w: 1, h: 1, s: 1, cont: 'roupas', n: 'Arara de roupas', sh: 1.4 },
  balcao: { w: 1, h: 1, s: 1, cont: 'sala', n: 'Balcão', sh: 1.0 }, caixa_reg: { w: 1, h: 1, s: 1, cont: 'sala', n: 'Caixa', sh: 1.0 },
  freezer: { w: 1, h: 1, s: 1, cont: 'bebidas', n: 'Freezer', sh: 1.0 }, maca: { w: 1, h: 2, s: 1, inter: 'bed', n: 'Maca', sh: 0.7 },
  arm_med: { w: 1, h: 1, s: 1, cont: 'hospital', n: 'Armário de remédios', sh: 1.8 }, arm_armas: { w: 1, h: 1, s: 1, cont: 'armas', n: 'Armário de armas', sh: 1.9 },
  escrivaninha: { w: 1, h: 1, s: 1, cont: 'delegacia', n: 'Escrivaninha', sh: 0.8 }, arquivo: { w: 1, h: 1, s: 1, cont: 'delegacia', n: 'Arquivo', sh: 1.3 },
  carteira: { w: 1, h: 1, s: 1, sh: 0.7 }, caixote: { w: 1, h: 1, s: 1, cont: 'galpao', n: 'Caixote', sh: 0.8 }, pallet: { w: 1, h: 1, s: 1, sh: 1.2 },
  tambor: { w: 1, h: 1, s: 1, sh: 0.9 }, tambor_fogo: { w: 1, h: 1, s: 1, sh: 0.9, light: [5.5, '#ff9a3c', 1] }, pneus: { w: 1, h: 1, s: 1, sh: 0.8 },
  bancada: { w: 1, h: 1, s: 1, cont: 'oficina', n: 'Bancada', sh: 0.9 }, mesa_bar: { w: 1, h: 1, s: 1, sh: 0.7 }, cad_bar: { w: 1, h: 1, s: 0, sh: 0.5 },
  sinuca: { w: 2, h: 1, s: 1, cont: 'bar', n: 'Mesa de sinuca', sh: 0.8 }, banco_igreja: { w: 2, h: 1, s: 1, sh: 0.6 }, altar: { w: 2, h: 1, s: 1, cont: 'igreja', n: 'Altar', sh: 1.0 },
  lixeira: { w: 1, h: 1, s: 1, cont: 'lixo', n: 'Lixeira', sh: 0.9 }, saco_lixo: { w: 1, h: 1, s: 0, sh: 0 }, orelhao: { w: 1, h: 1, s: 1, sh: 1.8 },
  banco_praca: { w: 2, h: 1, s: 1, sh: 0.5 }, poste: { w: 1, h: 1, s: 1, sh: 5, thin: 1 }, ponto_onibus: { w: 3, h: 1, s: 1, sh: 2.2 },
  mangueira: { w: 1, h: 1, s: 1, sh: 4.2, tree: 1.7 }, ipe: { w: 1, h: 1, s: 1, sh: 3.8, tree: 1.4 }, coqueiro: { w: 1, h: 1, s: 1, sh: 5, tree: 1.1 },
  bananeira: { w: 1, h: 1, s: 1, sh: 2.2, tree: 0.8 }, arbusto: { w: 1, h: 1, s: 0, sh: 0.6, tree: 0.5 }, capim: { w: 1, h: 1, s: 0, sh: 0 },
  carro_a: { w: 4, h: 2, s: 1, cont: 'carro', n: 'Porta-malas', sh: 1.4, car: 1 }, carro_b: { w: 4, h: 2, s: 1, cont: 'carro', n: 'Porta-malas', sh: 1.4, car: 1 },
  kombi: { w: 4, h: 2, s: 1, cont: 'carro', n: 'Perua', sh: 1.9, car: 1 }, pickup: { w: 5, h: 2, s: 1, cont: 'galpao', n: 'Caçamba', sh: 1.5, car: 1 },
  viatura: { w: 4, h: 2, s: 1, cont: 'delegacia', n: 'Viatura', sh: 1.5, car: 1 }, ambulancia: { w: 5, h: 2, s: 1, cont: 'hospital', n: 'Ambulância', sh: 2.1, car: 1 },
  queimado: { w: 4, h: 2, s: 1, sh: 1.2, car: 1 }, onibus: { w: 9, h: 3, s: 1, sh: 2.9, car: 1 }, caminhao: { w: 7, h: 3, s: 1, cont: 'galpao', n: 'Baú do caminhão', sh: 3, car: 1 },
  conteiner: { w: 5, h: 2, s: 1, sh: 2.5, car: 1 }, tumulo: { w: 1, h: 2, s: 1, sh: 0.5 }, cruz: { w: 1, h: 1, s: 1, sh: 1.2 },
  gol: { w: 1, h: 4, s: 1, sh: 2.2 }, barraca: { w: 2, h: 2, s: 1, cont: 'camp', n: 'Barraca', sh: 1.4 }, sacos_areia: { w: 1, h: 1, s: 1, sh: 0.9 },
  cavalete: { w: 1, h: 1, s: 1, sh: 1.0 }, botijao: { w: 1, h: 1, s: 1, sh: 0.6 }, caixa_dagua: { w: 1, h: 1, s: 1, sh: 1.2 }, varal: { w: 2, h: 1, s: 0, sh: 0 },
  bomba: { w: 1, h: 1, s: 1, sh: 1.6 }, carrinho: { w: 1, h: 1, s: 1, sh: 0.9 }, bicicleta: { w: 1, h: 1, s: 0, sh: 0 }, horta: { w: 2, h: 2, s: 0, sh: 0 },
  fonte: { w: 3, h: 3, s: 1, sh: 0.8 }, coreto: { w: 1, h: 1, s: 1, sh: 3, thin: 1 }, fogueira: { w: 1, h: 1, s: 1, sh: 0, light: [6.5, '#ff8a30', 1] },
  luz_emerg: { w: 1, h: 1, s: 0, sh: 0, light: [6, '#cfe6d8', 2] }, arquibancada: { w: 4, h: 1, s: 1, sh: 1.2 }, placa_q: { w: 2, h: 1, s: 1, sh: 2.2 }
};

/* Tipos de construção */
const COL_CASA = ['#c9b488', '#a8b79e', '#b5a6b6', '#c5a08a', '#9eafbc', '#d0c9b8', '#bf856a', '#b8bf8e', '#c7b9a0', '#8fa9a4'];
const COL_COM = ['#b5a48c', '#93a5a8', '#c0b39b', '#a88f7c', '#aab08f', '#b49c9c'];
const BT = {
  casa: { floor: GR.RED, rooms: ['sala', 'quarto', 'cozinha', 'banheiro', 'quarto'], maxA: 22, minS: 2, win: 0.5, roof: 'telha', cols: COL_CASA, z: [0, 2], barr: 1 },
  casa_morro: { floor: GR.CONC, rooms: ['sala', 'quarto', 'cozinha'], maxA: 13, minS: 2, win: 0.35, roof: 'laje', cols: ['#a8623e', '#b06a44', '#9c5a3a', '#b9a58c', '#a45f3d'], brick: 1, z: [0, 2] },
  predio: { floor: GR.CER, rooms: ['sala', 'quarto', 'cozinha', 'banheiro', 'quarto', 'sala', 'quarto'], maxA: 24, minS: 3, win: 0.6, roof: 'laje', cols: COL_COM, z: [1, 4], levels: 3, barr: 1 },
  mercado: { floor: GR.CER, rooms: ['mercado', 'deposito', 'escritorio'], maxA: 95, minS: 3, win: 0.5, roof: 'laje', cols: ['#c4b08a', '#b9b29c'], z: [3, 7], sign: ['MERCADINHO BOM PREÇO', 'SUPERMERCADO AURORA', 'MERCEARIA DO POVO', 'ATACADO CENTRAL'], sc: '#b0302a', tbl: 'mercado', wide: 1 },
  farmacia: { floor: GR.WHITE, rooms: ['farmacia', 'deposito'], maxA: 46, minS: 3, win: 0.5, roof: 'laje', cols: ['#d4d6cf'], z: [1, 3], sign: ['DROGARIA SANTA AURORA', 'FARMÁCIA DO POVO'], sc: '#2e7a4f', tbl: 'farmacia', wide: 1 },
  padaria: { floor: GR.CER, rooms: ['padaria', 'cozinha_ind'], maxA: 44, minS: 3, win: 0.6, roof: 'telha', cols: ['#c9b488', '#c5a08a'], z: [1, 3], sign: ['PADARIA PÃO QUENTE', 'PANIFICADORA DA PRAÇA', 'PADARIA ESTRELA'], sc: '#8a5a22', tbl: 'padaria' },
  boteco: { floor: GR.CHECK, rooms: ['bar', 'deposito', 'banheiro'], maxA: 40, minS: 2, win: 0.4, roof: 'telha', cols: ['#b8bf8e', '#9eafbc', '#c5a08a'], z: [2, 5], sign: ['BAR DO TONHÃO', 'BOTECO DA ESQUINA', 'BAR E MERCEARIA', 'BAR DO CAMPO'], sc: '#c9a227', tbl: 'bar', wide: 1 },
  loterica: { floor: GR.CER, rooms: ['loterica', 'escritorio'], maxA: 30, minS: 3, win: 0.4, roof: 'laje', cols: ['#9eafbc'], z: [0, 2], sign: ['LOTÉRICA', 'LOTÉRICA DA SORTE'], sc: '#1f5fa0', tbl: 'sala' },
  ferragens: { floor: GR.CONC, rooms: ['ferragens', 'deposito'], maxA: 60, minS: 3, win: 0.3, roof: 'zinco', cols: ['#a88f7c', '#aab08f'], z: [1, 3], sign: ['CASA DO CONSTRUTOR', 'FERRAGENS SÃO JORGE'], sc: '#c2531e', tbl: 'ferragens', wide: 1 },
  sertao: { floor: GR.WOOD, rooms: ['ferragens', 'deposito'], maxA: 60, minS: 3, win: 0.3, roof: 'telha', cols: ['#b9a58c'], z: [1, 3], sign: ['ARMAZÉM DO SERTÃO'], sc: '#5a6a2a', tbl: 'sitio' },
  roupas: { floor: GR.CER, rooms: ['roupas', 'deposito'], maxA: 50, minS: 3, win: 0.7, roof: 'laje', cols: ['#b5a6b6', '#c0b39b'], z: [1, 2], sign: ['MODAS SANTA AURORA', 'LOJA DA MODA'], sc: '#8a2a6a', tbl: 'roupas' },
  restaurante: { floor: GR.CHECK, rooms: ['restaurante', 'cozinha_ind', 'banheiro'], maxA: 60, minS: 2, win: 0.6, roof: 'telha', cols: ['#c7b9a0', '#bf856a'], z: [2, 5], sign: ['RESTAURANTE SABOR CASEIRO', 'SELF-SERVICE DA DONA NENA', 'CHURRASCARIA BOI NA BRASA'], sc: '#9a2e25', tbl: 'cozinha' },
  upa: { floor: GR.WHITE, rooms: ['recepcao', 'enfermaria', 'consultorio', 'farm_hosp', 'enfermaria', 'consultorio', 'banheiro', 'deposito', 'enfermaria', 'consultorio'], maxA: 40, minS: 3, win: 0.5, roof: 'laje', cols: ['#d8dcd6'], z: [12, 18], sign: ['UPA 24H SANTA AURORA'], sc: '#2e7a4f', tbl: 'hospital', wide: 1, emerg: 1, barrCol: '#3f8f66' },
  delegacia: { floor: GR.CER, rooms: ['recep_del', 'escr_del', 'armaria', 'cela', 'cela', 'banheiro', 'escr_del'], maxA: 30, minS: 3, win: 0.3, roof: 'laje', cols: ['#bdb8aa'], z: [4, 7], sign: ['DELEGACIA DE POLÍCIA'], sc: '#1d2f4a', tbl: 'delegacia', emerg: 1, barrCol: '#2c456b' },
  escola: { floor: GR.CER, rooms: ['recepcao', 'sala_aula', 'sala_aula', 'sala_aula', 'cantina', 'diretoria', 'banheiro', 'sala_aula'], maxA: 44, minS: 3, win: 0.6, roof: 'telha', cols: ['#d6c98f'], z: [5, 9], sign: ['ESCOLA MUNICIPAL PROF. ZULMIRA'], sc: '#1f5fa0', tbl: 'escola', barrCol: '#3566a0' },
  igreja: { floor: GR.WOOD, rooms: ['nave'], maxA: 999, minS: 3, win: 0.4, roof: 'telha', cols: ['#e2dccb'], z: [3, 6], levels: 2, tbl: 'igreja', barr: 1 },
  galpao: { floor: GR.CONC, rooms: ['galpao', 'escritorio'], maxA: 190, minS: 4, win: 0.12, roof: 'zinco', cols: ['#8d9296', '#9a9486', '#7f8a8c'], z: [2, 6], tbl: 'galpao', wide: 1 },
  oficina: { floor: GR.CONC, rooms: ['oficina', 'escritorio'], maxA: 80, minS: 3, win: 0.2, roof: 'zinco', cols: ['#a88f7c'], z: [1, 3], sign: ['BORRACHARIA DO ZÉ'], sc: '#222', tbl: 'oficina', wide: 1 },
  conveniencia: { floor: GR.CER, rooms: ['posto_loja'], maxA: 999, minS: 3, win: 0.6, roof: 'laje', cols: ['#d0c9b8'], z: [1, 2], sign: ['POSTO IPÊ'], sc: '#c9a227', tbl: 'posto' },
  vestiario: { floor: GR.CONC, rooms: ['vestiario'], maxA: 999, minS: 3, win: 0.2, roof: 'laje', cols: ['#a8b79e'], z: [0, 2], tbl: 'roupas' },
  capela: { floor: GR.RED, rooms: ['capela'], maxA: 999, minS: 3, win: 0.3, roof: 'telha', cols: ['#e2dccb'], z: [1, 3], tbl: 'igreja' },
  fogos: { floor: GR.CONC, rooms: ['fogos'], maxA: 999, minS: 3, win: 0.3, roof: 'telha', cols: ['#c5a08a'], z: [0, 1], sign: ['FOGOS SÃO JOÃO'], sc: '#b0302a', tbl: 'festa' },
  cobertura: { floor: GR.CONC, open: 1, roof: 'posto', cols: ['#d0c9b8'], z: [0, 0] }
};
/* Móveis por cômodo: [objeto, mín, máx, modo]  modo: w parede, c meio, g fileiras */
const ROOMS = {
  sala: { f: GR.WOOD, it: [['sofa', 1, 1, 'w'], ['tv', 1, 1, 'w'], ['estante', 0, 1, 'w'], ['mesa', 0, 1, 'c'], ['cadeira', 0, 2, 'c']] },
  cozinha: { f: GR.CER, it: [['geladeira', 1, 1, 'w'], ['fogao', 1, 1, 'w'], ['pia', 1, 1, 'w'], ['armario_coz', 1, 2, 'w'], ['filtro', 0, 1, 'w'], ['mesa', 0, 1, 'c']] },
  quarto: { f: 0, it: [['cama', 1, 1, 'w'], ['guarda_roupa', 1, 1, 'w'], ['criado', 0, 1, 'w'], ['comoda', 0, 1, 'w']] },
  banheiro: { f: GR.WHITE, it: [['vaso', 1, 1, 'w'], ['pia_ban', 1, 1, 'w']] },
  mercado: { it: [['caixa_reg', 2, 3, 'w'], ['freezer', 2, 4, 'w'], ['prateleira', 0, 0, 'g'], ['carrinho', 1, 3, 'c']] },
  deposito: { f: GR.CONC, it: [['caixote', 2, 5, 'w'], ['pallet', 0, 2, 'w']] },
  escritorio: { it: [['escrivaninha', 1, 1, 'w'], ['arquivo', 1, 2, 'w'], ['cadeira', 0, 1, 'c']] },
  farmacia: { it: [['balcao', 2, 3, 'w'], ['prateleira', 0, 0, 'g'], ['arm_med', 1, 2, 'w']] },
  padaria: { it: [['balcao', 2, 4, 'w'], ['prateleira', 2, 3, 'w'], ['freezer', 1, 1, 'w'], ['mesa', 1, 2, 'c'], ['cadeira', 1, 3, 'c']] },
  cozinha_ind: { f: GR.WHITE, it: [['fogao', 1, 2, 'w'], ['armario_coz', 2, 3, 'w'], ['geladeira', 1, 2, 'w'], ['pia', 1, 1, 'w']] },
  bar: { it: [['balcao', 2, 3, 'w'], ['freezer', 1, 2, 'w'], ['sinuca', 0, 1, 'c'], ['mesa_bar', 2, 4, 'c'], ['cad_bar', 2, 5, 'c']] },
  loterica: { it: [['balcao', 2, 3, 'w'], ['cadeira', 1, 2, 'w']] },
  ferragens: { it: [['balcao', 1, 2, 'w'], ['prateleira', 0, 0, 'g'], ['caixote', 1, 3, 'w']] },
  roupas: { it: [['balcao', 1, 2, 'w'], ['arara', 4, 8, 'c'], ['arara', 2, 4, 'w']] },
  restaurante: { it: [['balcao', 2, 3, 'w'], ['mesa', 3, 6, 'c'], ['cadeira', 4, 8, 'c'], ['freezer', 1, 1, 'w']] },
  recepcao: { it: [['balcao', 2, 3, 'w'], ['cadeira', 3, 6, 'w'], ['arquivo', 0, 1, 'w']] },
  enfermaria: { it: [['maca', 2, 5, 'w'], ['arm_med', 1, 2, 'w']] },
  consultorio: { it: [['escrivaninha', 1, 1, 'w'], ['maca', 1, 1, 'w'], ['arm_med', 1, 1, 'w']] },
  farm_hosp: { it: [['arm_med', 3, 5, 'w'], ['balcao', 1, 1, 'c']] },
  recep_del: { it: [['balcao', 2, 3, 'w'], ['cadeira', 2, 4, 'w'], ['arquivo', 1, 1, 'w']] },
  escr_del: { it: [['escrivaninha', 2, 3, 'w'], ['arquivo', 1, 2, 'w']] },
  cela: { f: GR.CONC, it: [['cama', 1, 2, 'w']] },
  armaria: { f: GR.CONC, it: [['arm_armas', 2, 3, 'w'], ['caixote', 0, 1, 'w']] },
  sala_aula: { it: [['escrivaninha', 1, 1, 'w'], ['carteira', 0, 0, 'g']] },
  cantina: { it: [['geladeira', 1, 1, 'w'], ['armario_coz', 1, 2, 'w'], ['mesa', 2, 3, 'c'], ['cadeira', 2, 4, 'c']] },
  diretoria: { it: [['escrivaninha', 1, 1, 'w'], ['arquivo', 1, 2, 'w'], ['estante', 1, 1, 'w']] },
  nave: { it: [['altar', 1, 1, 'w'], ['banco_igreja', 0, 0, 'g']] },
  capela: { it: [['altar', 1, 1, 'w'], ['banco_igreja', 1, 2, 'c']] },
  galpao: { it: [['caixote', 6, 12, 'w'], ['pallet', 4, 8, 'c'], ['tambor', 2, 4, 'w'], ['caixote', 3, 6, 'c']] },
  oficina: { it: [['bancada', 2, 3, 'w'], ['pneus', 2, 4, 'w'], ['tambor', 1, 2, 'w'], ['caixote', 1, 2, 'w']] },
  posto_loja: { it: [['balcao', 1, 2, 'w'], ['freezer', 1, 2, 'w'], ['prateleira', 2, 4, 'w']] },
  vestiario: { it: [['guarda_roupa', 2, 3, 'w'], ['banco_praca', 1, 1, 'c']] },
  fogos: { it: [['balcao', 1, 2, 'w'], ['prateleira', 2, 3, 'w'], ['caixote', 1, 2, 'w']] }
};
const PICHA = ['NÃO ABRA', 'TEM GENTE VIVA', 'DEUS NOS AJUDE', 'SEM COMIDA AQUI', 'FUJAM PRA ROÇA', 'MORDIDO DENTRO', 'CADÊ O EXÉRCITO', 'VOLTO LOGO MÃE', 'SILÊNCIO', 'ÁGUA NÃO'];

const World = {
  ground: new Uint8Array(MW * MH), bld: new Uint16Array(MW * MH), room: new Uint16Array(MW * MH),
  eN: new Uint8Array(MW * MH), eW: new Uint8Array(MW * MH), solid: new Uint8Array(MW * MH),
  zone: new Uint8Array(MW * MH), occ: new Uint8Array(MW * MH), keep: new Uint8Array(MW * MH),
  propAt: new Int32Array(MW * MH),
  props: [], builds: [null], rooms: [null], lights: [], signs: new Map(), zspawn: [],
  loot: {}, edgeHp: new Map(), spawn: { x: 30, y: 60 }, home: 0,

  gen(seed) {
    const R = mulberry32(seed), W = this;
    const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
    const pk = a => a[Math.floor(R() * a.length)];
    W.propAt.fill(-1);
    const g = W.ground;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const n = hash2(x >> 2, y >> 2, 3) * 0.6 + hash2(x, y, 5) * 0.4;
      g[idx(x, y)] = n > 0.72 ? GR.DRYG : n < 0.12 ? GR.DIRT : GR.GRASS;
    }
    /* ---- ruas ---- */
    const paintRoad = (x, y, i, j) => {
      const ki = i >= 0 ? x - RPOS[i] : -1, kj = j >= 0 ? y - RPOS[j] : -1;
      const aV = i >= 0 && ki >= 2 && ki < RWID[i] - 2, aH = j >= 0 && kj >= 2 && kj < RWID[j] - 2;
      const id = idx(x, y);
      W.zone[id] = ZONE.RUA;
      if (aV || aH) {
        let t = GR.ASPH;
        if (aV && j < 0) {
          if (ki === RWID[i] / 2) t = RWID[i] > 10 ? GR.DLW : GR.LW;
          if (roadAt(y + 1) >= 0 || roadAt(y + 2) >= 0 || roadAt(y - 1) >= 0 || roadAt(y - 2) >= 0) t = GR.ZV;
        } else if (aH && i < 0) {
          if (kj === RWID[j] / 2) t = RWID[j] > 10 ? GR.DLN : GR.LN;
          if (roadAt(x + 1) >= 0 || roadAt(x + 2) >= 0 || roadAt(x - 1) >= 0 || roadAt(x - 2) >= 0) t = GR.ZH;
        }
        g[id] = t;
      } else g[id] = GR.SIDE;
    };
    for (let y = RING0; y < RING1; y++) for (let x = RING0; x < RING1; x++) {
      const i = roadAt(x), j = roadAt(y);
      if (i >= 0 || j >= 0) paintRoad(x, y, i, j);
    }
    for (let k = 0; k < MW; k++) {
      if (k >= RING0 && k < RING1) continue;
      for (let x = RPOS[2]; x < RPOS[2] + RWID[2]; x++) paintRoad(x, k, 2, -1);
      for (let y = RPOS[3]; y < RPOS[3] + RWID[3]; y++) paintRoad(k, y, -1, 3);
    }

    /* ---- ajudantes ---- */
    const setN = (x, y, t) => { if (inMap(x, y)) W.eN[idx(x, y)] = t; };
    const setW = (x, y, t) => { if (inMap(x, y)) W.eW[idx(x, y)] = t; };
    const fill = (x0, y0, x1, y1, t, zone) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { g[idx(x, y)] = t; if (zone !== undefined) W.zone[idx(x, y)] = zone; } };
    const rotDim = (d, r) => (r & 1) ? [d.h, d.w] : [d.w, d.h];
    const freeRect = (x, y, w, h, indoor) => {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
        if (!inMap(i, j)) return false;
        const id = idx(i, j);
        if (W.occ[id] || W.keep[id] || W.solid[id]) return false;
        if (!indoor && W.bld[id]) return false;
      }
      return true;
    };
    const addProp = (t, x, y, rot, extra) => {
      const d = PROPS[t]; rot = rot || 0;
      const [w, h] = rotDim(d, rot);
      if (!freeRect(x, y, w, h, extra && extra.indoor)) return null;
      const p = { id: W.props.length, t, x, y, w, h, rot, v: Math.floor(R() * 1000) };
      if (extra) { if (extra.tbl) p.tbl = extra.tbl; if (extra.b) p.b = extra.b; }
      if (d.cont && !p.tbl) p.tbl = d.cont;
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { const id = idx(i, j); W.occ[id] = 1; if (d.s) W.solid[id] = 1; W.propAt[id] = p.id; }
      W.props.push(p);
      if (d.light) W.lights.push({ x: x + w / 2, y: y + h / 2, r: d.light[0], col: d.light[1], fl: d.light[2], z: 1 });
      return p;
    };
    const tryProps = (t, n, x0, y0, x1, y1, rotFn) => {
      let made = 0;
      for (let k = 0; k < n * 8 && made < n; k++) {
        const rot = rotFn ? rotFn() : ri(0, 3);
        if (addProp(t, ri(x0, x1), ri(y0, y1), rot)) made++;
      }
      return made;
    };
    /* confere se o cômodo continua todo alcançável com o móvel novo */
    const roomOK = (rm) => {
      const st = []; let total = 0, first = -1;
      const seen = new Set();
      for (let y = rm.y0; y <= rm.y1; y++) for (let x = rm.x0; x <= rm.x1; x++) { const id = idx(x, y); if (!W.solid[id]) { total++; if (first < 0 && W.keep[id]) first = id; } else if (W.keep[id]) return false; }
      if (first < 0) return true;
      st.push(first); seen.add(first);
      while (st.length) {
        const id = st.pop(), x = id % MW, y = (id - x) / MW;
        const nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
        for (const [a, b] of nb) {
          if (a < rm.x0 || a > rm.x1 || b < rm.y0 || b > rm.y1) continue;
          const n = idx(a, b);
          if (W.solid[n] || seen.has(n)) continue;
          seen.add(n); st.push(n);
        }
      }
      return seen.size === total;
    };
    const placeIn = (rm, t, mode, tbl) => {
      const d = PROPS[t];
      for (let k = 0; k < 14; k++) {
        let x, y, rot = 0;
        if (mode === 'w') {
          const side = R() < 0.42 ? 0 : R() < 0.6 ? 3 : R() < 0.5 ? 2 : 1;   // 0 norte, 3 oeste, 2 sul, 1 leste
          rot = side;
          const [w, h] = rotDim(d, rot);
          if (w > rm.x1 - rm.x0 + 1 || h > rm.y1 - rm.y0 + 1) continue;
          if (side === 0) { x = ri(rm.x0, rm.x1 - w + 1); y = rm.y0; }
          else if (side === 2) { x = ri(rm.x0, rm.x1 - w + 1); y = rm.y1 - h + 1; }
          else if (side === 3) { x = rm.x0; y = ri(rm.y0, rm.y1 - h + 1); }
          else { x = rm.x1 - w + 1; y = ri(rm.y0, rm.y1 - h + 1); }
        } else {
          rot = ri(0, 3);
          const [w, h] = rotDim(d, rot);
          const m = (rm.x1 - rm.x0 >= 3 && rm.y1 - rm.y0 >= 3) ? 1 : 0;
          if (rm.x1 - m - w + 1 < rm.x0 + m || rm.y1 - m - h + 1 < rm.y0 + m) continue;
          x = ri(rm.x0 + m, rm.x1 - m - w + 1); y = ri(rm.y0 + m, rm.y1 - m - h + 1);
        }
        const p = addProp(t, x, y, rot, { indoor: 1, tbl, b: rm.b });
        if (!p) continue;
        if (d.s && !roomOK(rm)) { W.removeProp(p); continue; }
        return p;
      }
      return null;
    };
    const furnish = (b, rm) => {
      const spec = ROOMS[rm.kind]; if (!spec) return;
      const T = BT[b.type];
      const tblFor = t => {
        const d = PROPS[t];
        if (!d.cont) return undefined;
        if (t === 'prateleira' || t === 'balcao' || t === 'caixote' || t === 'escrivaninha' || t === 'arquivo' || t === 'altar') return T.tbl || d.cont;
        if (t === 'arm_med' && T.tbl === 'farmacia') return 'farmacia';
        if (t === 'freezer' && T.tbl === 'hospital') return 'hospital';
        return d.cont;
      };
      for (const [t, a, bb, mode] of spec.it) {
        if (mode === 'g') {
          const horiz = (rm.x1 - rm.x0) >= (rm.y1 - rm.y0);
          const two = PROPS[t].w === 2;
          if (horiz) {
            for (let x = rm.x0 + 2; x <= rm.x1 - 1; x += (t === 'carteira' ? 2 : 3)) for (let y = rm.y0 + 2; y <= rm.y1 - 2; y += (t === 'carteira' ? 2 : 1)) {
              if (two) continue;
              const p = addProp(t, x, y, 3, { indoor: 1, tbl: tblFor(t), b: b.id });
              if (p && !roomOK(rm)) W.removeProp(p);
            }
            if (two) for (let y = rm.y0 + 2; y <= rm.y1 - 1; y += 2) for (let x = rm.x0 + 1; x + 1 <= rm.x1 - 1; x += 3) { const p = addProp(t, x, y, 0, { indoor: 1, b: b.id }); if (p && !roomOK(rm)) W.removeProp(p); }
          } else {
            for (let y = rm.y0 + 2; y <= rm.y1 - 1; y += (t === 'carteira' || two ? 2 : 3)) for (let x = rm.x0 + (two ? 1 : 2); x <= rm.x1 - 2; x += (t === 'carteira' ? 2 : two ? 3 : 1)) {
              const p = addProp(t, x, y, 0, { indoor: 1, tbl: tblFor(t), b: b.id });
              if (p && !roomOK(rm)) W.removeProp(p);
            }
          }
          continue;
        }
        const n = ri(a, bb);
        for (let i = 0; i < n; i++) placeIn(rm, t, mode, tblFor(t));
      }
    };
    let nameIx = {};
    const mkBuilding = (x0, y0, w, h, type, side, o) => {
      o = o || {};
      const T = BT[type], id = W.builds.length, x1 = x0 + w - 1, y1 = y0 + h - 1;
      const b = { id, x0, y0, x1, y1, type, levels: o.levels || T.levels || 1, roof: o.roof || T.roof, col: o.col || pk(T.cols), brick: T.brick || 0, open: T.open || 0, rooms: [], seed: Math.floor(R() * 1e6), side };
      b.barr = T.barrCol || (T.barr && R() < 0.75 ? 1 : 0);
      b.int = pk(['#cfc6b0', '#c4cbbf', '#d2cdc4', '#c9bfae', '#bcc4c8']);
      W.builds.push(b);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = idx(x, y); W.bld[i] = id; g[i] = T.floor; }
      if (T.open) return b;
      for (let x = x0; x <= x1; x++) { setN(x, y0, E.WALL); setN(x, y1 + 1, E.WALL); }
      for (let y = y0; y <= y1; y++) { setW(x0, y, E.WALL); setW(x1 + 1, y, E.WALL); }
      /* cômodos */
      const leaves = [];
      const split = (a0, b0, a1, b1, depth) => {
        const cw = a1 - a0 + 1, ch = b1 - b0 + 1, ms = T.minS;
        const canX = cw >= ms * 2, canY = ch >= ms * 2;
        if (cw * ch <= T.maxA || (!canX && !canY) || depth > 5) { leaves.push([a0, b0, a1, b1]); return; }
        let sx = canX && (!canY || cw > ch * 1.15 || (cw > ch * 0.87 && R() < 0.5));
        const dt = () => { const r = R(); return r < 0.45 ? E.FRAME : r < 0.8 ? E.DOOR : E.DOPEN; };
        if (sx) {
          const p = a0 + ms + Math.floor(R() * (cw - ms * 2 + 1));
          for (let y = b0; y <= b1; y++) setW(p, y, E.WALL);
          const dy = ri(b0, b1); setW(p, dy, dt()); W.keep[idx(p, dy)] = 1; W.keep[idx(p - 1, dy)] = 1;
          split(a0, b0, p - 1, b1, depth + 1); split(p, b0, a1, b1, depth + 1);
        } else {
          const p = b0 + ms + Math.floor(R() * (ch - ms * 2 + 1));
          for (let x = a0; x <= a1; x++) setN(x, p, E.WALL);
          const dx = ri(a0, a1); setN(dx, p, dt()); W.keep[idx(dx, p)] = 1; W.keep[idx(dx, p - 1)] = 1;
          split(a0, b0, a1, p - 1, depth + 1); split(a0, p, a1, b1, depth + 1);
        }
      };
      split(x0, y0, x1, y1, 0);
      /* porta de fora */
      const mkDoor = (sd, wide, closedOnly) => {
        let dx, dy, ix, iy, ox, oy, t = closedOnly ? E.DOOR : (R() < (o.openP !== undefined ? o.openP : 0.35) ? (R() < 0.5 ? E.FRAME : E.DOPEN) : E.DOOR);
        if (wide && !closedOnly) t = R() < 0.6 ? E.FRAME : E.DOOR;
        const n = wide && w > 5 && h > 5 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          if (sd === 'S' || sd === 'N') {
            if (k === 0) dx = ri(x0 + 1, Math.max(x0 + 1, x1 - 1 - (n - 1))); else dx++;
            if (sd === 'S') { setN(dx, y1 + 1, t); ix = dx; iy = y1; ox = dx; oy = y1 + 1; } else { setN(dx, y0, t); ix = dx; iy = y0; ox = dx; oy = y0 - 1; }
          } else {
            if (k === 0) dy = ri(y0 + 1, Math.max(y0 + 1, y1 - 1 - (n - 1))); else dy++;
            if (sd === 'E') { setW(x1 + 1, dy, t); ix = x1; iy = dy; ox = x1 + 1; oy = dy; } else { setW(x0, dy, t); ix = x0; iy = dy; ox = x0 - 1; oy = dy; }
          }
          W.keep[idx(ix, iy)] = 1; if (inMap(ox, oy)) W.keep[idx(ox, oy)] = 1;
        }
        return { x: ix, y: iy, ox, oy, sd };
      };
      b.door = mkDoor(side, T.wide, o.closed);
      if (o.back) b.door2 = mkDoor(o.back, 0, 0);
      /* janelas */
      const winAt = (isN, x, y, k) => {
        const cur = isN ? W.eN[idx(x, y)] : W.eW[idx(x, y)];
        if (cur !== E.WALL) return;
        if (hash2(x * 3 + (isN ? 1 : 0), y * 5, b.seed) < T.win && (k % 2 === 1)) { if (isN) setN(x, y, E.WIN); else setW(x, y, E.WIN); }
      };
      for (let x = x0 + 1; x < x1; x++) { winAt(1, x, y0, x - x0); winAt(1, x, y1 + 1, x - x0); }
      for (let y = y0 + 1; y < y1; y++) { winAt(0, x0, y, y - y0); winAt(0, x1 + 1, y, y - y0); }
      /* cômodos: tipo e piso */
      const entry = leaves.findIndex(l => b.door.x >= l[0] && b.door.x <= l[2] && b.door.y >= l[1] && b.door.y <= l[3]);
      const order = leaves.map((l, i) => i).filter(i => i !== entry).sort((p, q) => {
        const A = leaves[p], B = leaves[q];
        return (B[2] - B[0] + 1) * (B[3] - B[1] + 1) - (A[2] - A[0] + 1) * (A[3] - A[1] + 1);
      });
      const kinds = T.rooms.slice();
      const seq = [entry].concat(order);
      const hasBan = kinds.indexOf('banheiro');
      seq.forEach((li, n) => {
        const l = leaves[li];
        let kind = kinds[Math.min(n, kinds.length - 1)];
        if (n >= kinds.length) kind = kinds[1 + (n % Math.max(1, kinds.length - 1))] || kinds[0];
        if (hasBan > 0 && n === seq.length - 1 && seq.length > 2) kind = 'banheiro';
        else if (kind === 'banheiro' && n !== seq.length - 1) kind = kinds[1] || kinds[0];
        const rm = { id: W.rooms.length, b: id, x0: l[0], y0: l[1], x1: l[2], y1: l[3], kind };
        W.rooms.push(rm); b.rooms.push(rm);
        let fl = ROOMS[kind] && ROOMS[kind].f;
        if (kind === 'quarto' || kind === 'sala') fl = T.floor === GR.RED ? (b.seed % 3 ? GR.RED : GR.WOOD) : T.floor === GR.CONC ? GR.CONC : GR.WOOD;
        for (let y = l[1]; y <= l[3]; y++) for (let x = l[0]; x <= l[2]; x++) { W.room[idx(x, y)] = rm.id; if (fl) g[idx(x, y)] = fl; }
      });
      if (!o.empty) for (const rm of b.rooms) furnish(b, rm);
      /* placa */
      if (T.sign && !o.noSign) {
        nameIx[type] = (nameIx[type] || 0);
        b.name = T.sign[nameIx[type]++ % T.sign.length];
        const sd = (side === 'S' || side === 'E') ? side : (b.door2 && (b.door2.sd === 'S' || b.door2.sd === 'E') ? b.door2.sd : (w >= h ? 'S' : 'E'));
        const len = sd === 'S' ? w : h, n = clamp(Math.ceil(b.name.length * 0.21) + 1, 2, len);
        if (sd === 'S') { const cx = side === 'S' ? b.door.x : x0 + (w >> 1); const s = clamp(cx - (n >> 1), x0, x1 - n + 1); for (let i = 0; i < n; i++) W.signs.set('0:' + idx(s + i, y1 + 1), { txt: b.name, i, n, col: T.sc, st: 0 }); }
        else { const cy = side === 'E' ? b.door.y : y0 + (h >> 1); const s = clamp(cy - (n >> 1), y0, y1 - n + 1); for (let i = 0; i < n; i++) W.signs.set('1:' + idx(x1 + 1, s + i), { txt: b.name, i: n - 1 - i, n, col: T.sc, st: 0 }); }
      } else if (!T.sign && R() < 0.16 && w >= 5 && !o.home) {
        const txt = pk(PICHA), n = clamp(Math.ceil(txt.length * 0.2) + 1, 2, w - 1), s = x0 + ri(0, w - n);
        for (let i = 0; i < n; i++) { const k = '0:' + idx(s + i, y1 + 1); if (W.eN[idx(s + i, y1 + 1)] === E.WALL) W.signs.set(k, { txt, i, n, col: R() < 0.5 ? '#8a1f1a' : '#e8e4d8', st: 1 }); }
      }
      /* luz de emergência */
      if (T.emerg) for (const rm of b.rooms) if (R() < 0.55) W.lights.push({ x: (rm.x0 + rm.x1 + 1) / 2, y: (rm.y0 + rm.y1 + 1) / 2, r: 5.5, col: '#cfe6d8', fl: 2, z: 2.2, b: id });
      /* zumbis dentro */
      if (!o.home) {
        const nz = ri(T.z[0], T.z[1]);
        for (let k = 0, m = 0; k < nz * 6 && m < nz; k++) { const x = ri(x0, x1), y = ri(y0, y1); if (!W.solid[idx(x, y)]) { W.zspawn.push({ x: x + 0.5, y: y + 0.5 }); m++; } }
      }
      return b;
    };
    const carT = () => { const r = R(); return r < 0.34 ? 'carro_a' : r < 0.66 ? 'carro_b' : r < 0.8 ? 'kombi' : r < 0.93 ? 'pickup' : 'queimado'; };
    const tree = () => { const r = R(); return r < 0.4 ? 'mangueira' : r < 0.6 ? 'ipe' : r < 0.8 ? 'coqueiro' : 'bananeira'; };
    const lotWall = (x0, y0, w, h, type, gateSide, gx) => {
      for (let x = x0; x < x0 + w; x++) { setN(x, y0, type); setN(x, y0 + h, type); }
      for (let y = y0; y < y0 + h; y++) { setW(x0, y, type); setW(x0 + w, y, type); }
      const gt = R() < 0.55 ? E.GOPEN : E.GATE;
      if (gateSide === 'N') { setN(gx, y0, gt); W.keep[idx(gx, y0)] = 1; W.keep[idx(gx, y0 - 1)] = 1; }
      if (gateSide === 'S') { setN(gx, y0 + h, gt); W.keep[idx(gx, y0 + h - 1)] = 1; W.keep[idx(gx, y0 + h)] = 1; }
      if (gateSide === 'E') { setW(x0 + w, gx, gt); W.keep[idx(x0 + w - 1, gx)] = 1; W.keep[idx(x0 + w, gx)] = 1; }
      if (gateSide === 'W') { setW(x0, gx, gt); W.keep[idx(x0, gx)] = 1; W.keep[idx(x0 - 1, gx)] = 1; }
    };

    /* ---- quarteirões ---- */
    const residencial = (X, Y, home) => {
      fill(X, Y, X + 27, Y + 27, GR.GRASS, ZONE.RES);
      const cols = [[0, 9], [9, 10], [19, 9]];
      for (let row = 0; row < 2; row++) for (let c = 0; c < 3; c++) {
        const lx = X + cols[c][0], lw = cols[c][1], ly = Y + row * 14, lh = 14;
        const isHome = home && row === 1 && c === 1;
        const yardT = R() < 0.4 ? GR.CONC : R() < 0.5 ? GR.DIRT : GR.GRASS;
        if (yardT !== GR.GRASS) fill(lx, ly, lx + lw - 1, ly + lh - 1, yardT);
        const hw = lw - ri(3, 4), hh = ri(6, 8);
        const hx = lx + 2, hy = row === 0 ? ly + 2 : ly + lh - 3 - hh;
        const gx = lx + (row === 0 ? 0 : ri(1, lw - 2));
        lotWall(lx, ly, lw, lh, R() < 0.3 ? E.GRADE : E.MURO, row === 0 ? 'N' : 'S', gx);
        for (let y = ly; y < ly + lh; y++) W.keep[idx(lx, y)] = W.keep[idx(lx + 1, y)] = 1;   // corredor lateral livre
        const b = mkBuilding(hx, hy, hw, hh, 'casa', 'S', { home: isHome, closed: isHome, back: R() < 0.4 ? (R() < 0.5 ? 'W' : 'N') : null, openP: 0.3 });
        if (isHome) { W.home = b.id; }
        const yy0 = row === 0 ? hy + hh + 1 : ly + lh - 2, yy1 = row === 0 ? ly + lh - 1 : ly + lh - 1;
        if (R() < 0.7) tryProps(tree(), 1, lx + 2, row === 0 ? hy + hh + 1 : ly, lx + lw - 2, row === 0 ? ly + lh - 2 : hy - 1);
        if (R() < 0.5) tryProps('varal', 1, lx + 2, yy0, lx + lw - 3, yy1, () => 0);
        if (R() < 0.5) tryProps('botijao', 1, hx + hw, hy, hx + hw, hy + hh - 1);
        if (R() < 0.35) tryProps('horta', 1, lx + 2, row === 0 ? hy + hh + 1 : ly, lx + lw - 3, row === 0 ? ly + lh - 2 : Math.max(ly, hy - 2));
        if (R() < 0.4) tryProps('caixa_dagua', 1, lx + 2, ly, lx + lw - 1, ly + lh - 1);
        if (R() < 0.3) tryProps('bicicleta', 1, lx + 2, ly, lx + lw - 1, ly + lh - 1);
        tryProps('arbusto', ri(0, 2), lx + 2, ly, lx + lw - 1, ly + lh - 1);
        tryProps('capim', ri(0, 3), lx + 2, ly, lx + lw - 1, ly + lh - 1);
      }
    };
    const comercial = (X, Y, north, south) => {
      fill(X, Y, X + 27, Y + 27, GR.SIDE, ZONE.CENTRO);
      fill(X, Y + 11, X + 27, Y + 17, GR.PARK);
      let x = X;
      for (const [t, w, o] of north) { const T = BT[t]; mkBuilding(x, Y + 1, w, 10, t, 'S', Object.assign({ back: R() < 0.3 ? 'N' : null }, o)); x += w + 1; }
      x = X;
      for (const [t, w, o] of south) { mkBuilding(x, Y + 19, w, 8, t, 'S', Object.assign({ back: R() < 0.6 ? 'N' : null }, o)); x += w + 1; }
      for (let k = 0; k < 4; k++) if (R() < 0.75) addProp(carT(), X + 1 + k * 7, Y + 13 + ri(0, 2), 0);
      tryProps('lixeira', 2, X, Y + 11, X + 27, Y + 17);
      tryProps('saco_lixo', 4, X, Y + 11, X + 27, Y + 18);
      tryProps('carrinho', 2, X, Y + 11, X + 27, Y + 17);
      tryProps('caixote', 2, X, Y + 11, X + 27, Y + 18);
    };
    const LAY = [
      ['res', 'res', 'escola', 'res', 'cemit'],
      ['home', 'com1', 'com2', 'com3', 'ind'],
      ['res', 'com4', 'praca', 'upa', 'ind2'],
      ['res', 'com5', 'com6', 'res', 'posto'],
      ['campo', 'morro', 'morro', 'res', 'ind']
    ];
    for (let by = 0; by < 5; by++) for (let bx = 0; bx < 5; bx++) {
      const X = blockStart(bx), Y = blockStart(by), k = LAY[by][bx];
      if (k === 'res' || k === 'home') residencial(X, Y, k === 'home');
      else if (k === 'com1') comercial(X, Y, [['mercado', 17], ['padaria', 10]], [['farmacia', 9], ['loterica', 8], ['roupas', 9]]);
      else if (k === 'com2') comercial(X, Y, [['predio', 13], ['predio', 14]], [['restaurante', 13], ['boteco', 14]]);
      else if (k === 'com3') comercial(X, Y, [['ferragens', 13], ['sertao', 14]], [['predio', 9], ['padaria', 9], ['fogos', 8]]);
      else if (k === 'com4') comercial(X, Y, [['predio', 13], ['mercado', 14]], [['boteco', 9], ['farmacia', 9], ['predio', 8]]);
      else if (k === 'com5') comercial(X, Y, [['delegacia', 17], ['predio', 10]], [['restaurante', 9], ['ferragens', 9], ['boteco', 8]]);
      else if (k === 'com6') comercial(X, Y, [['mercado', 14], ['predio', 13]], [['padaria', 9], ['loterica', 8], ['roupas', 9]]);
      else if (k === 'escola') {
        fill(X, Y, X + 27, Y + 27, GR.CONC, ZONE.ESCOLA);
        lotWall(X, Y, 28, 28, E.MURO, 'S', X + 14); setN(X + 13, Y + 28, E.GOPEN); setW(X + 28, Y + 20, E.GOPEN); W.keep[idx(X + 27, Y + 20)] = 1;
        mkBuilding(X + 2, Y + 2, 24, 12, 'escola', 'S', { back: 'E' });
        fill(X + 4, Y + 17, X + 17, Y + 25, GR.COURT);
        tryProps('gol', 1, X + 4, Y + 19, X + 4, Y + 19, () => 0); tryProps('gol', 1, X + 17, Y + 19, X + 17, Y + 19, () => 0);
        tryProps('mangueira', 3, X + 19, Y + 15, X + 26, Y + 26); tryProps('banco_praca', 2, X + 19, Y + 15, X + 25, Y + 26);
        for (let k2 = 0; k2 < 5; k2++) W.zspawn.push({ x: X + ri(3, 25) + 0.5, y: Y + ri(16, 26) + 0.5 });
      } else if (k === 'cemit') {
        fill(X, Y, X + 27, Y + 27, GR.GRASS, ZONE.CEMIT);
        for (let y = Y; y < Y + 28; y++) for (let x2 = X; x2 < X + 28; x2++) if (hash2(x2, y, 9) < 0.3) g[idx(x2, y)] = GR.DIRT;
        fill(X + 13, Y, X + 14, Y + 27, GR.SIDE);
        lotWall(X, Y, 28, 28, E.MURO, 'S', X + 13); setN(X + 14, Y + 28, E.GOPEN);
        mkBuilding(X + 10, Y + 1, 8, 7, 'capela', 'S', {});
        for (let ty = Y + 10; ty < Y + 26; ty += 3) for (let tx = X + 2; tx < X + 26; tx += 2) { if (tx >= X + 12 && tx <= X + 15) continue; if (R() < 0.8) addProp(R() < 0.75 ? 'tumulo' : 'cruz', tx, ty, 0); }
        tryProps('ipe', 4, X + 1, Y + 1, X + 26, Y + 26); tryProps('capim', 14, X + 1, Y + 1, X + 26, Y + 26);
        for (let k2 = 0; k2 < 26; k2++) W.zspawn.push({ x: X + ri(1, 26) + 0.5, y: Y + ri(9, 26) + 0.5 });
      } else if (k === 'ind' || k === 'ind2') {
        fill(X, Y, X + 27, Y + 27, GR.CONC, ZONE.IND);
        lotWall(X, Y, 28, 28, E.GRADE, 'S', X + 6); setN(X + 7, Y + 28, E.GOPEN); setW(X, Y + 20, E.GOPEN); W.keep[idx(X, Y + 20)] = 1;
        mkBuilding(X + 2, Y + 2, 20, 13, 'galpao', 'S', { back: 'E' });
        if (k === 'ind2') mkBuilding(X + 16, Y + 19, 10, 7, 'ferragens', 'W', { noSign: 1 });
        tryProps('conteiner', 3, X + 1, Y + 17, X + 12, Y + 25, () => 0); tryProps('caminhao', 1, X + 2, Y + 17, X + 16, Y + 24, () => 0);
        tryProps('pallet', 6, X + 1, Y + 16, X + 26, Y + 26); tryProps('tambor', 4, X + 1, Y + 16, X + 26, Y + 26); tryProps('caixote', 4, X + 1, Y + 16, X + 26, Y + 26);
        tryProps('pickup', 1, X + 22, Y + 3, X + 22, Y + 9, () => 1);
      } else if (k === 'posto') {
        fill(X, Y, X + 27, Y + 27, GR.CONC, ZONE.IND);
        fill(X, Y, X + 27, Y + 12, GR.ASPH);
        mkBuilding(X + 4, Y + 2, 12, 8, 'cobertura', 'S');
        for (let i = 0; i < 3; i++) { addProp('bomba', X + 6 + i * 4, Y + 4, 0); addProp('bomba', X + 6 + i * 4, Y + 7, 0); }
        mkBuilding(X + 19, Y + 2, 8, 7, 'conveniencia', 'W', {});
        mkBuilding(X + 1, Y + 16, 13, 10, 'oficina', 'N', { back: 'E' });
        mkBuilding(X + 18, Y + 17, 9, 8, 'casa', 'N', {});
        tryProps('pneus', 5, X + 14, Y + 14, X + 17, Y + 27); tryProps('tambor', 3, X + 14, Y + 13, X + 27, Y + 16);
        addProp('tambor_fogo', X + 16, Y + 12, 0);
        addProp(carT(), X + 6, Y + 5, 0); addProp('pickup', X + 15, Y + 14, 0); addProp('queimado', X + 20, Y + 11, 0);
      } else if (k === 'campo') {
        fill(X, Y, X + 27, Y + 27, GR.GRASS, ZONE.CAMPO);
        fill(X + 2, Y + 3, X + 25, Y + 17, GR.FIELD);
        addProp('gol', X + 2, Y + 8, 0); addProp('gol', X + 25, Y + 8, 0);
        for (let i = 0; i < 4; i++) addProp('arquibancada', X + 3 + i * 5, Y + 1, 0);
        mkBuilding(X + 2, Y + 20, 7, 6, 'vestiario', 'E', {});
        mkBuilding(X + 14, Y + 20, 10, 7, 'boteco', 'N', {});
        tryProps('mangueira', 3, X + 10, Y + 19, X + 13, Y + 27); tryProps('mesa_bar', 3, X + 14, Y + 18, X + 24, Y + 19);
        addProp('tambor_fogo', X + 12, Y + 19, 0);
        for (let k2 = 0; k2 < 9; k2++) W.zspawn.push({ x: X + ri(3, 24) + 0.5, y: Y + ri(4, 16) + 0.5 });
      } else if (k === 'morro') {
        fill(X, Y, X + 27, Y + 27, GR.DIRT, ZONE.MORRO);
        for (let y = Y; y < Y + 28; y++) for (let x2 = X; x2 < X + 28; x2++) if (hash2(x2 >> 1, y >> 1, 4) < 0.45) g[idx(x2, y)] = GR.CONC;
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
          const lx = X + c * 7, ly = Y + r * 7;
          if (r === 1 && c === 2 && bx === 1) { addProp('tambor_fogo', lx + 3, ly + 3, 0); tryProps('caixote', 2, lx + 1, ly + 1, lx + 5, ly + 5); tryProps('cad_bar', 3, lx + 1, ly + 1, lx + 5, ly + 5); continue; }
          const w = ri(4, 6), h = ri(4, 6);
          mkBuilding(lx + ri(0, 6 - w), ly + ri(0, 6 - h), w, h, 'casa_morro', R() < 0.5 ? 'S' : 'E', { roof: R() < 0.35 ? 'zinco' : 'laje', levels: R() < 0.25 ? 2 : 1, openP: 0.5 });
        }
        tryProps('caixa_dagua', 5, X, Y, X + 27, Y + 27); tryProps('botijao', 4, X, Y, X + 27, Y + 27); tryProps('saco_lixo', 8, X, Y, X + 27, Y + 27);
        tryProps('varal', 4, X, Y, X + 26, Y + 27, () => ri(0, 1)); tryProps('bananeira', 4, X, Y, X + 27, Y + 27);
        for (let k2 = 0; k2 < 8; k2++) W.zspawn.push({ x: X + ri(0, 27) + 0.5, y: Y + ri(0, 27) + 0.5 });
      } else if (k === 'praca') {
        fill(X, Y, X + 27, Y + 27, GR.GRASS, ZONE.PRACA);
        for (let i = 0; i < 28; i++) { for (let d = -1; d <= 1; d++) { const a = clamp(i + d, 0, 27); g[idx(X + i, Y + a)] = GR.PORT; g[idx(X + i, Y + 27 - a)] = GR.PORT; } }
        fill(X + 10, Y + 15, X + 17, Y + 22, GR.PORT); fill(X, Y + 26, X + 27, Y + 27, GR.PORT); fill(X + 26, Y, X + 27, Y + 27, GR.PORT);
        mkBuilding(X + 9, Y + 1, 10, 13, 'igreja', 'S', {});
        addProp('fonte', X + 12, Y + 17, 0);
        for (const [cx, cy] of [[3, 20], [6, 20], [3, 23], [6, 23]]) addProp('coreto', X + cx, Y + cy, 0);
        const cb = mkBuilding(X + 3, Y + 20, 4, 4, 'cobertura', 'S', { roof: 'coreto' }); cb.keepProps = 1;
        tryProps('ipe', 7, X + 1, Y + 1, X + 26, Y + 25); tryProps('mangueira', 3, X + 1, Y + 1, X + 26, Y + 25); tryProps('coqueiro', 3, X + 20, Y + 2, X + 26, Y + 25);
        tryProps('banco_praca', 6, X + 1, Y + 14, X + 25, Y + 25, () => ri(0, 1)); tryProps('lixeira', 2, X + 1, Y + 14, X + 26, Y + 26);
        /* acampamento abandonado */
        addProp('barraca', X + 21, Y + 17, 0); addProp('barraca', X + 22, Y + 21, 0); addProp('fogueira', X + 20, Y + 20, 0);
        tryProps('caixote', 2, X + 19, Y + 16, X + 25, Y + 24); tryProps('sacos_areia', 4, X + 18, Y + 15, X + 25, Y + 25);
        for (let k2 = 0; k2 < 12; k2++) W.zspawn.push({ x: X + ri(1, 26) + 0.5, y: Y + ri(14, 26) + 0.5 });
      } else if (k === 'upa') {
        fill(X, Y, X + 27, Y + 27, GR.SIDE, ZONE.UPA);
        fill(X, Y + 19, X + 27, Y + 27, GR.PARK);
        mkBuilding(X + 2, Y + 1, 24, 17, 'upa', 'S', { back: 'E' });
        addProp('ambulancia', X + 3, Y + 20, 0); addProp('ambulancia', X + 18, Y + 24, 0); addProp(carT(), X + 10, Y + 21, 0); addProp(carT(), X + 12, Y + 25, 0);
        tryProps('sacos_areia', 6, X + 1, Y + 19, X + 26, Y + 20); tryProps('cavalete', 4, X + 1, Y + 19, X + 26, Y + 27); tryProps('maca', 2, X + 1, Y + 19, X + 26, Y + 26, () => ri(0, 1));
        addProp('barraca', X + 22, Y + 20, 0);
        for (let k2 = 0; k2 < 10; k2++) W.zspawn.push({ x: X + ri(1, 26) + 0.5, y: Y + ri(19, 27) + 0.5 });
      }
    }
    /* ---- ruas: carros largados, postes, lixo ---- */
    for (let i = 0; i < 6; i++) {
      const w = RWID[i], a = RPOS[i];
      for (let p = RING0 + 3; p < RING1 - 6; p++) {
        const cross = roadAt(p) >= 0 || roadAt(p + 5) >= 0 || roadAt(p - 3) >= 0;
        if (!cross) {
          if (R() < 0.05) addProp(carT(), a + 2 + (R() < 0.5 ? 0 : w - 6), p, 1);
          if (R() < 0.05) addProp(carT(), p, a + 2 + (R() < 0.5 ? 0 : w - 6), 0);
          if (R() < 0.012) addProp(carT(), a + (w >> 1) - 1, p, 1);
        }
        if (roadAt(p) < 0) {
          if (p % 9 === 4) { addProp('poste', a + 1, p, 0); addProp('poste', p, a + w - 2, 0); }
          if (R() < 0.03) addProp('lixeira', a + w - 1, p, 0);
          if (R() < 0.04) addProp('saco_lixo', a + ri(0, 1), p, 0);
          if (R() < 0.04) addProp('saco_lixo', p, a + w - 1 - ri(0, 1), 0);
          if (R() < 0.012) addProp('orelhao', a, p, 0);
          if (R() < 0.012) addProp('orelhao', p, a + w - 1, 0);
          if (R() < 0.012) addProp('ponto_onibus', p, a, 0);
          if (R() < 0.03) addProp(R() < 0.5 ? 'ipe' : 'mangueira', p, a + w - 1, 0);
          if (R() < 0.03) addProp(R() < 0.5 ? 'ipe' : 'coqueiro', a, p, 0);
        }
      }
    }
    addProp('onibus', RPOS[2] + 2, RPOS[3] - 22, 1); addProp('onibus', RPOS[1] + 20, RPOS[2] + 4, 0);
    addProp('queimado', RPOS[3] + 3, RPOS[1] + 20, 1);
    W.lights.push({ x: RPOS[3] + 4, y: RPOS[1] + 22, r: 5, col: '#ff7a2a', fl: 1, z: 1 });
    /* saídas bloqueadas: quarentena */
    const bloqueio = (x0, y0, horiz, w) => {
      for (let k = 0; k < w; k++) { const x = horiz ? x0 + k : x0, y = horiz ? y0 : y0 + k; addProp(k % 3 === 1 ? 'cavalete' : 'sacos_areia', x, y, 0); addProp('sacos_areia', horiz ? x : x + 1, horiz ? y + 1 : y, 0); }
    };
    bloqueio(RPOS[2], 2, true, 12); bloqueio(RPOS[2], MH - 5, true, 12); bloqueio(2, RPOS[3], false, 12); bloqueio(MW - 5, RPOS[3], false, 12);
    addProp('placa_q', RPOS[2] + 4, 5, 0); addProp('placa_q', RPOS[2] + 4, MH - 8, 0);
    addProp('caminhao', RPOS[2] + 2, RING1 + 1, 0); addProp('viatura', RPOS[2] + 6, RING0 - 4, 0); addProp('viatura', RING0 - 5, RPOS[3] + 3, 0);
    /* viaturas na delegacia */
    { const X = blockStart(1), Y = blockStart(3); addProp('viatura', X + 2, Y + 12, 0); addProp('viatura', X + 9, Y + 15, 0); }
    /* ---- mato em volta ---- */
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (x >= RING0 && x < RING1 && y >= RING0 && y < RING1) continue;
      const id = idx(x, y);
      if (W.zone[id] === ZONE.RUA || W.occ[id]) continue;
      const r = R();
      if (r < 0.085) addProp(tree(), x, y, 0);
      else if (r < 0.17) addProp('capim', x, y, 0);
      else if (r < 0.2) addProp('arbusto', x, y, 0);
    }
    /* ---- zumbis ao ar livre ---- */
    for (let y = 2; y < MH - 2; y += 1) for (let x = 2; x < MW - 2; x += 1) {
      const id = idx(x, y);
      if (W.bld[id] || W.solid[id]) continue;
      if (R() < ZONE_DENS[W.zone[id]] * 0.0085) W.zspawn.push({ x: x + 0.5, y: y + 0.5 });
    }
    /* ---- casa do jogador ---- */
    const hb = W.builds[W.home];
    let sp = null;
    for (const rm of hb.rooms) if (rm.kind === 'quarto' && !sp) sp = rm;
    sp = sp || hb.rooms[0];
    for (let y = sp.y0; y <= sp.y1 && !W.spawn.set; y++) for (let x = sp.x0; x <= sp.x1; x++) if (!W.solid[idx(x, y)]) { W.spawn = { x: x + 0.5, y: y + 0.5, set: 1 }; break; }
    W.zspawn = W.zspawn.filter(z => dist(z.x, z.y, W.spawn.x, W.spawn.y) > 16 && !W.solid[idx(Math.floor(z.x), Math.floor(z.y))]);
    for (const p of W.props) if (p.b === hb.id) { if (p.t === 'geladeira') p.fixed = [['agua', 2], ['marmita', 1]]; if (p.t === 'armario_coz' || p.t === 'fogao') p.fixed = [['feijao', 1], ['pao', 2], ['faca', 1]]; if (p.t === 'guarda_roupa') p.fixed = [['mochila', 1], ['lanterna', 1], ['pano', 2]]; }
  },
  removeProp(p) {
    for (let j = p.y; j < p.y + p.h; j++) for (let i = p.x; i < p.x + p.w; i++) { const id = idx(i, j); this.occ[id] = 0; this.solid[id] = 0; this.propAt[id] = -1; }
    if (this.props[this.props.length - 1] === p) this.props.pop(); else p.dead = 1;
  },
  /* conteúdo de um recipiente (sorteado na primeira vez que abre) */
  lootOf(p) {
    let L = this.loot[p.id];
    if (!L) {
      const rng = mulberry32(G.seed + p.id * 7919);
      L = p.fixed ? p.fixed.map(e => newItem(e[0], e[1])) : rollLoot(p.tbl, rng);
      this.loot[p.id] = L;
    }
    return L;
  }
};

/* ---------- colisão, visão e caminho ---------- */
function edgeBetween(ax, ay, bx, by, fn) {       // casas vizinhas (em cruz); fn decide se passa
  if (bx !== ax) return fn(World.eW[idx(Math.max(ax, bx), ay)]);
  return fn(World.eN[idx(ax, Math.max(ay, by))]);
}
function canStand(x, y, r) {
  const cx = Math.floor(x), cy = Math.floor(y);
  if (cx < 1 || cy < 1 || cx >= MW - 1 || cy >= MH - 1) return false;
  const W = World;
  if (W.solid[idx(cx, cy)]) return false;
  const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
  if (x0 !== cx) { if (W.solid[idx(x0, cy)] || !edgePass(W.eW[idx(cx, cy)])) return false; }
  if (x1 !== cx) { if (W.solid[idx(x1, cy)] || !edgePass(W.eW[idx(x1, cy)])) return false; }
  if (y0 !== cy) { if (W.solid[idx(cx, y0)] || !edgePass(W.eN[idx(cx, cy)])) return false; }
  if (y1 !== cy) { if (W.solid[idx(cx, y1)] || !edgePass(W.eN[idx(cx, y1)])) return false; }
  const d = r * 0.72;
  const dx0 = Math.floor(x - d), dx1 = Math.floor(x + d), dy0 = Math.floor(y - d), dy1 = Math.floor(y + d);
  const diag = (tx, ty) => {
    if (tx === cx || ty === cy) return true;
    if (W.solid[idx(tx, ty)]) return false;
    const ex = Math.max(cx, tx), ey = Math.max(cy, ty);
    return edgePass(W.eW[idx(ex, cy)]) && edgePass(W.eW[idx(ex, ty)]) && edgePass(W.eN[idx(cx, ey)]) && edgePass(W.eN[idx(tx, ey)]);
  };
  return diag(dx0, dy0) && diag(dx1, dy0) && diag(dx0, dy1) && diag(dx1, dy1);
}
/* linha de visão: devolve a fração do caminho livre (1 = tudo livre) */
function rayCast(x0, y0, x1, y1, fn) {
  const W = World, d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.2));
  let px = Math.floor(x0), py = Math.floor(y0);
  for (let i = 1; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    const tx = Math.floor(x), ty = Math.floor(y);
    if (tx !== px || ty !== py) {
      if (!inMap(tx, ty)) return (i - 1) / n;
      if (tx !== px && ty !== py) {
        const ex = Math.max(px, tx), ey = Math.max(py, ty);
        if (!fn(W.eW[idx(ex, py)]) || !fn(W.eN[idx(tx, ey)]) || !fn(W.eN[idx(px, ey)]) || !fn(W.eW[idx(ex, ty)])) return (i - 1) / n;
      } else if (tx !== px) { if (!fn(W.eW[idx(Math.max(px, tx), py)])) return (i - 1) / n; }
      else if (!fn(W.eN[idx(px, Math.max(py, ty))])) return (i - 1) / n;
      px = tx; py = ty;
    }
  }
  return 1;
}
const canSee = (x0, y0, x1, y1) => rayCast(x0, y0, x1, y1, edgeSee) >= 1;
function walkClear(x0, y0, x1, y1, r) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.3));
  for (let i = 1; i <= n; i++) { const t = i / n; if (!canStand(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r)) return false; }
  return true;
}

const Path = {
  g: new Float32Array(MW * MH), from: new Int32Array(MW * MH), stamp: new Uint32Array(MW * MH), closed: new Uint32Array(MW * MH), gen: 0,
  heap: [], hf: [],
  push(n, f) { const h = this.heap, hf = this.hf; let i = h.length; h.push(n); hf.push(f); while (i > 0) { const p = (i - 1) >> 1; if (hf[p] <= f) break; h[i] = h[p]; hf[i] = hf[p]; i = p; } h[i] = n; hf[i] = f; },
  pop() {
    const h = this.heap, hf = this.hf, top = h[0], n = h.pop(), f = hf.pop();
    if (h.length) { let i = 0; const L = h.length; for (;;) { let c = i * 2 + 1; if (c >= L) break; if (c + 1 < L && hf[c + 1] < hf[c]) c++; if (hf[c] >= f) break; h[i] = h[c]; hf[i] = hf[c]; i = c; } h[i] = n; hf[i] = f; }
    return top;
  },
  /* custo de atravessar uma beirada para zumbi: porta e janela fechadas custam caro, mas passam (ele arromba) */
  cost(t) { return t === 0 || t === 4 || t === 5 || t === 6 || t === 10 ? 0 : t === 3 ? 10 : t === 2 ? 14 : t === 9 ? 12 : -1; },
  find(sx, sy, tx, ty, maxN) {
    const W = World; sx |= 0; sy |= 0; tx |= 0; ty |= 0;
    if (!inMap(tx, ty) || W.solid[idx(tx, ty)]) return null;
    const gen = ++this.gen, g = this.g, from = this.from, st = this.stamp, cl = this.closed;
    this.heap.length = 0; this.hf.length = 0;
    const s = idx(sx, sy), goal = idx(tx, ty);
    g[s] = 0; st[s] = gen; from[s] = -1; this.push(s, 0);
    let n = 0, best = s, bestH = Math.abs(sx - tx) + Math.abs(sy - ty);
    const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
    while (this.heap.length && n++ < (maxN || 900)) {
      const c = this.pop();
      if (cl[c] === gen) continue; cl[c] = gen;
      if (c === goal) { best = c; break; }
      const cx = c % MW, cy = (c - cx) / MW;
      for (let k = 0; k < 8; k++) {
        const nx = cx + DX[k], ny = cy + DY[k];
        if (nx < 1 || ny < 1 || nx >= MW - 1 || ny >= MH - 1) continue;
        const ni = idx(nx, ny);
        if (W.solid[ni] || cl[ni] === gen) continue;
        let ec;
        if (k < 4) { ec = this.cost(nx !== cx ? W.eW[idx(Math.max(cx, nx), cy)] : W.eN[idx(cx, Math.max(cy, ny))]); if (ec < 0) continue; }
        else {
          if (W.solid[idx(nx, cy)] || W.solid[idx(cx, ny)]) continue;
          const ex = Math.max(cx, nx), ey = Math.max(cy, ny);
          if (W.eW[idx(ex, cy)] || W.eW[idx(ex, ny)] || W.eN[idx(cx, ey)] || W.eN[idx(nx, ey)]) continue;
          ec = 0.41;
        }
        const ng = g[c] + 1 + ec;
        if (st[ni] === gen && g[ni] <= ng) continue;
        g[ni] = ng; st[ni] = gen; from[ni] = c;
        const h = Math.hypot(nx - tx, ny - ty);
        if (h < bestH) { bestH = h; best = ni; }
        this.push(ni, ng + h * 1.1);
      }
    }
    const out = [];
    for (let c = best; c !== -1 && c !== s; c = from[c]) { const x = c % MW; out.push(x + 0.5, (c - x) / MW + 0.5); }
    return out;       // pares [x, y] do fim para o começo
  }
};

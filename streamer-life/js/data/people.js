/* Pessoas do mundo: nomes, personalidades de espectadores, personagens, criadores de conteúdo e marcas. Todos fictícios e adultos. */
'use strict';
(function (SL) {
  const D = SL.D;

  D.namesM = ['Lucas', 'Pedro', 'Rafael', 'Gabriel', 'Matheus', 'João', 'Gustavo', 'Felipe', 'Bruno', 'Thiago', 'Diego', 'André', 'Caio', 'Vinícius', 'Leonardo', 'Rodrigo', 'Marcelo', 'Eduardo', 'Daniel', 'Henrique', 'Igor', 'Murilo', 'Otávio', 'Renan', 'Samuel', 'Wesley', 'Yuri', 'Arthur', 'Davi', 'Enzo', 'Fábio', 'Heitor', 'Jonas', 'Kauã', 'Luan', 'Nicolas', 'Paulo', 'Raul', 'Sérgio', 'Túlio', 'Vitor', 'Alex', 'Breno', 'Cauã', 'Danilo', 'Emerson', 'Fernando', 'Guilherme', 'Hugo', 'Ícaro', 'Júlio', 'Lorenzo', 'Mário', 'Nathan', 'Pietro', 'Ricardo', 'Silvio', 'Tales', 'Ulisses', 'Wagner', 'Zeca', 'Cleber', 'Edson', 'Jefferson', 'Ronaldo', 'Anderson', 'Marcos', 'Roberto', 'Alan', 'Douglas'];
  D.namesF = ['Mariana', 'Ana', 'Beatriz', 'Júlia', 'Larissa', 'Camila', 'Fernanda', 'Gabriela', 'Isabela', 'Letícia', 'Amanda', 'Bruna', 'Carolina', 'Débora', 'Eduarda', 'Flávia', 'Giovana', 'Helena', 'Ingrid', 'Jéssica', 'Karina', 'Lívia', 'Manuela', 'Natália', 'Olívia', 'Patrícia', 'Rafaela', 'Sabrina', 'Tainá', 'Vanessa', 'Yasmin', 'Alice', 'Bianca', 'Clara', 'Daniela', 'Elisa', 'Fabiana', 'Gisele', 'Heloísa', 'Isadora', 'Joana', 'Kelly', 'Luana', 'Melissa', 'Nicole', 'Paola', 'Raquel', 'Sofia', 'Thaís', 'Valentina', 'Aline', 'Bárbara', 'Cecília', 'Denise', 'Estela', 'Francine', 'Lorena', 'Milena', 'Priscila', 'Rebeca', 'Simone', 'Tatiane', 'Vitória', 'Luiza', 'Marina', 'Renata', 'Juliana', 'Cristina', 'Paula', 'Mirela'];
  D.surnames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida', 'Nascimento', 'Carvalho', 'Gomes', 'Martins', 'Araújo', 'Ribeiro', 'Barbosa', 'Rocha', 'Dias', 'Teixeira', 'Moreira', 'Cardoso', 'Mendes', 'Freitas', 'Pinto', 'Vieira', 'Monteiro', 'Castro', 'Campos', 'Moura'];
  D.userBits = {
    pre: ['', '', '', 'o_', 'a_', 'xx', 'eu', 'só', 'tio', 'tia', 'mano', 'dona', 'seu', 'lil', 'super', 'sr', 'dr', 'prof'],
    suf: ['gamer', 'plays', 'br', 'tv', 'zera', 'fps', 'oficial', 'real', 'jogos', 'live', 'pro', 'noob', 'sz', 'gg', 'top', 'vibes', 'cria', 'raiz', 'zika', 'safado', 'mestre', 'beta', 'lindo', 'feliz', 'cansado', 'sp', 'rj', 'bh', 'poa', 'ce', 'pe', 'ba'],
    words: ['batata', 'pastel', 'coxinha', 'farofa', 'tapioca', 'pamonha', 'mandioca', 'abacate', 'jabuti', 'capivara', 'tucano', 'sabiá', 'preguiça', 'tatu', 'onça', 'boto', 'cacau', 'goiaba', 'bolinho', 'pudim', 'paçoca', 'brigadeiro', 'sorvete', 'chinelo', 'ventilador', 'controle', 'teclado', 'pixel', 'laser', 'trovão', 'neblina', 'cometa', 'lampião', 'cangaço'],
  };
  D.nameColors = ['#ff7a7a', '#ffb547', '#ffe066', '#7ee081', '#4cd4c4', '#62b6ff', '#9d8cff', '#e38bff', '#ff8fc1', '#b8e86b', '#ff9e5e', '#6ef0ff', '#c6a6ff', '#ffd1a1', '#9ff0c0'];

  // Personalidades de espectadores.
  // tl = vontade de falar, pa = paciência, tx = toxicidade, gen = generosidade, loy = ritmo de fidelização
  // tones: h = empolgação, z = zoeira, c = crítica, t = técnico, q = pergunta, n = neutro
  D.archetypes = {
    silencioso: { label: 'Silencioso', w: 17, tl: 0.035, pa: 0.85, tx: 0.02, gen: 0.25, loy: 1.0, tones: { n: 3, h: 1, t: 1 }, caps: 0.02 },
    comunicativo: { label: 'Comunicativo', w: 14, tl: 0.30, pa: 0.62, tx: 0.05, gen: 0.3, loy: 1.1, tones: { h: 3, n: 3, z: 2, q: 2 }, caps: 0.15 },
    fiel: { label: 'Fã fiel', w: 6, tl: 0.2, pa: 0.92, tx: 0.02, gen: 0.45, loy: 1.7, tones: { h: 4, n: 2, z: 1 }, caps: 0.2 },
    novato: { label: 'Novato', w: 13, tl: 0.13, pa: 0.45, tx: 0.03, gen: 0.15, loy: 1.0, tones: { q: 5, n: 2, h: 1 }, caps: 0.05 },
    engracado: { label: 'Engraçado', w: 10, tl: 0.26, pa: 0.62, tx: 0.08, gen: 0.25, loy: 1.0, tones: { z: 6, h: 1, n: 1 }, caps: 0.3 },
    critico: { label: 'Crítico', w: 8, tl: 0.19, pa: 0.5, tx: 0.25, gen: 0.1, loy: 0.7, tones: { c: 6, t: 2, n: 1 }, caps: 0.05 },
    competitivo: { label: 'Competitivo', w: 8, tl: 0.2, pa: 0.58, tx: 0.15, gen: 0.2, loy: 0.9, tones: { t: 3, h: 3, c: 2 }, caps: 0.35 },
    casual: { label: 'Casual', w: 14, tl: 0.1, pa: 0.55, tx: 0.03, gen: 0.2, loy: 0.9, tones: { n: 4, h: 1, z: 1 }, caps: 0.05 },
    apoiador: { label: 'Apoiador', w: 3, tl: 0.14, pa: 0.82, tx: 0.01, gen: 0.92, loy: 1.3, tones: { h: 3, n: 3 }, caps: 0.1 },
    troll: { label: 'Troll', w: 4, tl: 0.28, pa: 0.35, tx: 0.92, gen: 0.02, loy: 0.3, tones: { c: 4, z: 3 }, caps: 0.4 },
    especialista: { label: 'Especialista', w: 5, tl: 0.18, pa: 0.72, tx: 0.08, gen: 0.22, loy: 1.0, tones: { t: 6, n: 1, c: 1 }, caps: 0.02 },
    criador: { label: 'Criador de conteúdo', w: 3, tl: 0.15, pa: 0.5, tx: 0.05, gen: 0.25, loy: 0.9, tones: { n: 3, h: 2, t: 1 }, caps: 0.1 },
  };
  // categorias que puxam certas personalidades
  D.archetypeByCat = {
    'Battle royale': { competitivo: 2, especialista: 1.5, troll: 1.4 }, 'MOBA': { competitivo: 2, especialista: 1.6, critico: 1.4 },
    'Esporte': { competitivo: 1.6, engracado: 1.3 }, 'Terror': { engracado: 1.7, comunicativo: 1.2 },
    'Conversa': { comunicativo: 2, fiel: 1.4, apoiador: 1.3 }, 'Reação': { engracado: 1.8, comunicativo: 1.3 },
    'Xadrez': { especialista: 2.4, silencioso: 1.3 }, 'Simulação': { casual: 1.8, fiel: 1.3, troll: 0.4 },
    'Retrô / speedrun': { especialista: 2.2, competitivo: 1.3 }, 'Luta': { competitivo: 1.8, especialista: 1.4 },
    'Sandbox': { casual: 1.5, novato: 1.4 }, 'Corrida': { competitivo: 1.4, casual: 1.2 }, 'RPG': { fiel: 1.3, especialista: 1.3 },
  };
  D.viewerHours = { manha: 9, tarde: 15, noite: 21, madrugada: 1 };

  const L = (skin, hair, hairColor, shirt, pants, acc, beard, body) => ({ skin, hair, hairColor, shirt, pants, acc: acc || 0, beard: beard || 0, body: body || 'a' });
  D.skins = ['#f6d3b3', '#eac09a', '#d9a77c', '#c28a5e', '#a46d45', '#7d4f30', '#5a3720'];
  D.hairColors = ['#1d1512', '#3b2418', '#6b3f22', '#a8743f', '#d9b36a', '#bdbdbd', '#7a2e8f', '#2e6bd8', '#d8432f', '#f0f0f0'];
  D.shirtColors = ['#8b5cf6', '#ff5a36', '#19b8a8', '#3b82f6', '#f5c542', '#ef476f', '#2a2f3d', '#f0f0f0', '#5fae3e', '#ff8fc1', '#7a4a2a', '#0f766e'];
  D.hairStyles = ['Raspado', 'Curto', 'Topete', 'Cacheado', 'Médio', 'Longo', 'Rabo de cavalo', 'Black power', 'Coque'];

  // Personagens da vida (família, amigos, possíveis romances, profissionais)
  // place: onde costumam estar {p: lugar, d: dias da semana (0=dom), h: [início, fim]}
  D.npcs = [
    { id: 'mae', name: 'Dona Célia', short: 'Mãe', role: 'familia', age: 54, job: 'Costureira', pers: 'carinhosa', gender: 'f', interests: ['novela', 'culinária', 'família'], look: L('#d9a77c', 4, '#3b2418', '#ef476f', '#2a2f3d', 1, 0, 'b'), romance: false, places: [] },
    { id: 'duda', name: 'Duda Ramos', short: 'Duda', role: 'amigo', age: 25, job: 'Designer gráfica', pers: 'animada', gender: 'f', interests: ['arte', 'música', 'séries', 'thumbnails'], look: L('#c28a5e', 3, '#1d1512', '#f5c542', '#3b82f6', 0, 0, 'b'), romance: false, start: { aff: 45, trust: 60, stage: 'amigo', met: true },
      places: [{ p: 'amigos', d: [0, 1, 2, 3, 4, 5, 6], h: [18, 23] }, { p: 'cafeteria', d: [2, 4], h: [9, 12] }] },
    { id: 'rafa', name: 'Rafael Lima', short: 'Rafa', role: 'amigo', age: 26, job: 'Técnico de informática', pers: 'nerd', gender: 'm', interests: ['jogos', 'hardware', 'tiro', 'tecnologia'], look: L('#eac09a', 1, '#6b3f22', '#2a2f3d', '#2a2f3d', 1, 1), romance: false, start: { aff: 35, trust: 50, stage: 'amigo', met: true },
      places: [{ p: 'rafa', d: [0, 1, 2, 3, 4, 5, 6], h: [19, 24] }, { p: 'eletronicos', d: [1, 2, 3, 4, 5, 6], h: [9, 18] }] },
    { id: 'bia', name: 'Bia Santos', short: 'Bia', role: 'conhecido', age: 24, job: 'Barista no Grão Fino', pers: 'tranquila', gender: 'f', interests: ['café', 'livros', 'plantas', 'música'], look: L('#7d4f30', 7, '#1d1512', '#7a4a2a', '#2a2f3d', 0, 0, 'b'), romance: true,
      places: [{ p: 'cafeteria', d: [1, 2, 3, 4, 5, 6], h: [7, 16] }, { p: 'parque', d: [0], h: [9, 13] }] },
    { id: 'leo', name: 'Léo Martins', short: 'Léo', role: 'conhecido', age: 28, job: 'Fotógrafo', pers: 'aventureiro', gender: 'm', interests: ['fotografia', 'viagens', 'natureza', 'vlogs'], look: L('#a46d45', 4, '#1d1512', '#19b8a8', '#7a4a2a', 0, 1), romance: true,
      places: [{ p: 'parque', d: [0, 3, 6], h: [7, 12] }, { p: 'shopping', d: [5, 6], h: [16, 21] }] },
    { id: 'carol', name: 'Carol Nunes', short: 'Carol', role: 'conhecido', age: 27, job: 'Personal trainer', pers: 'energética', gender: 'f', interests: ['academia', 'corrida', 'saúde', 'música'], look: L('#eac09a', 6, '#a8743f', '#ff5a36', '#2a2f3d', 0, 0, 'b'), romance: true,
      places: [{ p: 'academia', d: [1, 2, 3, 4, 5], h: [6, 13] }, { p: 'parque', d: [6], h: [7, 10] }] },
    { id: 'gabi', name: 'Gabi Torres', short: 'Gabi', role: 'conhecido', age: 23, job: 'Estudante de medicina', pers: 'estudiosa', gender: 'f', interests: ['livros', 'ciência', 'jogos de terror', 'café'], look: L('#f6d3b3', 5, '#1d1512', '#3b82f6', '#2a2f3d', 1, 0, 'b'), romance: true,
      places: [{ p: 'cafeteria', d: [1, 3, 5], h: [14, 19] }, { p: 'parque', d: [0, 6], h: [15, 18] }] },
    { id: 'andre', name: 'André Souza', short: 'André', role: 'conhecido', age: 31, job: 'Chef de cozinha', pers: 'carismático', gender: 'm', interests: ['culinária', 'futebol', 'música', 'viagens'], look: L('#5a3720', 1, '#1d1512', '#f0f0f0', '#2a2f3d', 0, 1), romance: true,
      places: [{ p: 'restaurante', d: [2, 3, 4, 5, 6, 0], h: [11, 23] }] },
    { id: 'sam', name: 'Sam Oliveira', short: 'Sam', role: 'conhecido', age: 26, job: 'Musicista independente', pers: 'criativa', gender: 'nb', interests: ['música', 'arte', 'shows', 'react'], look: L('#c28a5e', 7, '#7a2e8f', '#2a2f3d', '#7a4a2a', 3, 0, 'b'), romance: true,
      places: [{ p: 'shopping', d: [3, 5], h: [14, 20] }, { p: 'cafeteria', d: [0, 6], h: [16, 20] }] },
    { id: 'thiago', name: 'Thiago Reis', short: 'Thiago', role: 'conhecido', age: 29, job: 'Desenvolvedor de jogos', pers: 'reservado', gender: 'm', interests: ['jogos', 'programação', 'indie', 'xadrez'], look: L('#eac09a', 2, '#3b2418', '#5fae3e', '#2a2f3d', 1, 0), romance: true,
      places: [{ p: 'cafeteria', d: [1, 2, 4], h: [17, 21] }, { p: 'expo', d: [6], h: [10, 18] }] },
    { id: 'nina', name: 'Nina Prado', short: 'Nina', role: 'conhecido', age: 30, job: 'Advogada', pers: 'direta', gender: 'f', interests: ['viagens', 'vinho', 'séries', 'debate'], look: L('#d9a77c', 8, '#3b2418', '#2a2f3d', '#2a2f3d', 0, 0, 'b'), romance: true,
      places: [{ p: 'restaurante', d: [5, 6], h: [19, 23] }, { p: 'academia', d: [1, 3], h: [18, 21] }] },
    // profissionais (contratáveis pelo app Equipe)
    { id: 'ed_jo', name: 'Jô Ferreira', short: 'Jô', role: 'editor', age: 22, job: 'Editora de vídeo freelancer', pers: 'perfeccionista', gender: 'f', skill: 52, salary: 1900, interests: ['edição', 'cinema'], look: L('#f6d3b3', 6, '#d8432f', '#ff8fc1', '#2a2f3d', 3, 0, 'b'), places: [] },
    { id: 'ed_ka', name: 'Kauã Mendes', short: 'Kauã', role: 'editor', age: 27, job: 'Editor de vídeo', pers: 'tranquilo', gender: 'm', skill: 72, salary: 3400, interests: ['edição', 'jogos'], look: L('#7d4f30', 0, '#1d1512', '#3b82f6', '#2a2f3d', 0, 1), places: [] },
    { id: 'ed_ma', name: 'Marina Prado', short: 'Marina', role: 'editor', age: 33, job: 'Editora sênior', pers: 'exigente', gender: 'f', skill: 90, salary: 6200, interests: ['edição', 'roteiro'], look: L('#eac09a', 4, '#6b3f22', '#2a2f3d', '#2a2f3d', 1, 0, 'b'), places: [] },
    { id: 'mod_ze', name: 'Zé Vigilante', short: 'Zé', role: 'moderador', age: 35, job: 'Moderador de chat', pers: 'calmo', gender: 'm', skill: 60, salary: 550, interests: ['jogos'], look: L('#a46d45', 1, '#bdbdbd', '#5fae3e', '#2a2f3d', 2, 1), places: [] },
    { id: 'mod_li', name: 'Lívia Alves', short: 'Lívia', role: 'moderador', age: 24, job: 'Moderadora profissional', pers: 'firme', gender: 'f', skill: 85, salary: 1100, interests: ['comunidade'], look: L('#c28a5e', 5, '#1d1512', '#8b5cf6', '#2a2f3d', 0, 0, 'b'), places: [] },
    { id: 'emp_ro', name: 'Roberto Viana', short: 'Roberto', role: 'empresario', age: 45, job: 'Empresário de influenciadores', pers: 'honesto', gender: 'm', cut: 0.15, salary: 0, interests: ['negócios'], look: L('#eac09a', 1, '#bdbdbd', '#2a2f3d', '#2a2f3d', 1, 1), places: [{ p: 'expo', d: [1, 2, 3, 4, 5], h: [10, 17] }] },
    { id: 'emp_va', name: 'Vanessa Kroll', short: 'Vanessa', role: 'empresario', age: 38, job: 'Agente de talentos', pers: 'agressiva', gender: 'f', cut: 0.25, salary: 0, interests: ['negócios', 'marcas'], look: L('#f6d3b3', 5, '#d9b36a', '#ef476f', '#2a2f3d', 0, 0, 'b'), places: [{ p: 'shopping', d: [4, 5], h: [13, 18] }] },
  ];
  D.npcById = id => D.npcs.find(n => n.id === id);

  // Criadores de conteúdo controlados pela IA. sched: dias da semana com live (h = hora de início, dur em horas)
  D.creators = [
    { id: 'c_mestre', name: 'MestreFPS', handle: 'mestrefps', pers: 'competitivo', niche: ['zonafinal'], tox: 0.35, warm: 0.3, amb: 0.9, f: { pulso: 1200000, vision: 2100000, clipz: 3400000, connect: 900000 }, look: L('#eac09a', 2, '#1d1512', '#e0702a', '#2a2f3d', 3, 0), sched: { d: [1, 2, 3, 4, 5, 6], h: 19, dur: 6 }, vids: 4 },
    { id: 'c_lua', name: 'Luazinha', handle: 'luazinha', pers: 'carismática', niche: ['conversa', 'fazendinha'], tox: 0.05, warm: 0.9, amb: 0.7, f: { pulso: 420000, vision: 600000, clipz: 1500000, connect: 800000 }, look: L('#d9a77c', 5, '#7a2e8f', '#ff8fc1', '#2a2f3d', 0, 0, 'b'), sched: { d: [0, 2, 4, 6], h: 20, dur: 4 }, vids: 3 },
    { id: 'c_gabs', name: 'Gabs Turbo', handle: 'gabsturbo', pers: 'acelerado', niche: ['turbo', 'zonafinal'], tox: 0.25, warm: 0.5, amb: 0.8, f: { pulso: 85000, vision: 130000, clipz: 260000, connect: 60000 }, look: L('#a46d45', 1, '#1d1512', '#d8432f', '#2a2f3d', 2, 0), sched: { d: [1, 3, 5], h: 21, dur: 4 }, vids: 3 },
    { id: 'c_vovo', name: 'Vovó Gamer', handle: 'vovogamer', pers: 'fofa', niche: ['fazendinha', 'blocolandia'], tox: 0, warm: 1, amb: 0.4, f: { pulso: 160000, vision: 310000, clipz: 700000, connect: 250000 }, look: L('#eac09a', 8, '#f0f0f0', '#5fae3e', '#7a4a2a', 1, 0, 'b'), sched: { d: [1, 3, 5], h: 15, dur: 3 }, vids: 2 },
    { id: 'c_noturno', name: 'Noturno', handle: 'noturnotv', pers: 'misterioso', niche: ['corredor13'], tox: 0.1, warm: 0.5, amb: 0.6, f: { pulso: 64000, vision: 190000, clipz: 120000, connect: 40000 }, look: L('#f6d3b3', 4, '#1d1512', '#2a2f3d', '#2a2f3d', 0, 1), sched: { d: [5, 6], h: 23, dur: 4 }, vids: 2 },
    { id: 'c_fred', name: 'Fred Bola', handle: 'fredbola', pers: 'zoeiro', niche: ['golplaca'], tox: 0.3, warm: 0.6, amb: 0.75, f: { pulso: 230000, vision: 410000, clipz: 950000, connect: 300000 }, look: L('#7d4f30', 0, '#1d1512', '#f5c542', '#2f9e5b', 0, 1), sched: { d: [0, 2, 3, 4], h: 20, dur: 4 }, vids: 4 },
    { id: 'c_tia', name: 'Tia Tech', handle: 'tiatech', pers: 'didática', niche: ['react'], tox: 0.05, warm: 0.7, amb: 0.6, f: { pulso: 30000, vision: 880000, clipz: 400000, connect: 350000 }, look: L('#c28a5e', 6, '#1d1512', '#4cc3ff', '#2a2f3d', 1, 0, 'b'), sched: { d: [2], h: 19, dur: 2 }, vids: 3, tech: true },
    { id: 'c_cha', name: 'Chá com Polêmica', handle: 'chacompolemica', pers: 'fofoqueiro', niche: ['react', 'conversa'], tox: 0.65, warm: 0.2, amb: 0.85, f: { pulso: 120000, vision: 1300000, clipz: 2000000, connect: 1100000 }, look: L('#eac09a', 3, '#d9b36a', '#c33b8a', '#2a2f3d', 1, 0, 'b'), sched: { d: [1, 4], h: 21, dur: 3 }, vids: 5, drama: true },
    { id: 'c_kai', name: 'Kai Speed', handle: 'kaispeed', pers: 'focado', niche: ['pixel'], tox: 0.05, warm: 0.6, amb: 0.5, f: { pulso: 22000, vision: 48000, clipz: 30000, connect: 9000 }, look: L('#f6d3b3', 1, '#2e6bd8', '#2bb3a6', '#2a2f3d', 3, 0), sched: { d: [0, 2, 4, 6], h: 14, dur: 5 }, vids: 1 },
    { id: 'c_ana', name: 'Ana Xeque', handle: 'anaxeque', pers: 'calma', niche: ['xeque'], tox: 0.02, warm: 0.7, amb: 0.5, f: { pulso: 54000, vision: 210000, clipz: 80000, connect: 30000 }, look: L('#a46d45', 7, '#1d1512', '#8a7a5c', '#2a2f3d', 1, 0, 'b'), sched: { d: [1, 2, 3, 4, 5], h: 18, dur: 3 }, vids: 2 },
    { id: 'c_bruno', name: 'Bruno Bloco', handle: 'brunobloco', pers: 'criativo', niche: ['blocolandia'], tox: 0.08, warm: 0.7, amb: 0.65, f: { pulso: 98000, vision: 520000, clipz: 410000, connect: 70000 }, look: L('#d9a77c', 2, '#a8743f', '#5fae3e', '#3b82f6', 0, 0), sched: { d: [0, 6], h: 16, dur: 5 }, vids: 3 },
    { id: 'c_pedrao', name: 'Pedrão Lendas', handle: 'pedraolendas', pers: 'esquentado', niche: ['lendas'], tox: 0.45, warm: 0.4, amb: 0.7, f: { pulso: 310000, vision: 150000, clipz: 220000, connect: 90000 }, look: L('#5a3720', 0, '#1d1512', '#3a6fd8', '#2a2f3d', 3, 1), sched: { d: [1, 2, 3, 4, 5, 6], h: 22, dur: 5 }, vids: 1 },
    { id: 'c_mila', name: 'Mila Luta', handle: 'milaluta', pers: 'determinada', niche: ['punho'], tox: 0.12, warm: 0.6, amb: 0.7, f: { pulso: 41000, vision: 60000, clipz: 140000, connect: 35000 }, look: L('#7d4f30', 6, '#1d1512', '#c33b8a', '#2a2f3d', 0, 0, 'b'), sched: { d: [2, 4, 6], h: 20, dur: 3 }, vids: 2 },
    { id: 'c_jp', name: 'JP Vlogs', handle: 'jpvlogs', pers: 'aventureiro', niche: ['conversa'], tox: 0.1, warm: 0.8, amb: 0.75, f: { pulso: 15000, vision: 720000, clipz: 1300000, connect: 600000 }, look: L('#eac09a', 3, '#3b2418', '#19b8a8', '#7a4a2a', 2, 0), sched: { d: [6], h: 18, dur: 2 }, vids: 3, vlog: true },
    { id: 'c_nando', name: 'Nando Começando', handle: 'nandocomecando', pers: 'esforçado', niche: ['golplaca', 'zonafinal'], tox: 0.05, warm: 0.85, amb: 0.8, f: { pulso: 180, vision: 120, clipz: 400, connect: 90 }, look: L('#c28a5e', 1, '#1d1512', '#3b82f6', '#2a2f3d', 0, 0), sched: { d: [1, 2, 3, 4, 5], h: 20, dur: 3 }, vids: 2, small: true },
    { id: 'c_lari', name: 'Lari Plays', handle: 'lariplays', pers: 'competitiva', niche: ['lendas', 'corredor13'], tox: 0.2, warm: 0.5, amb: 0.9, f: { pulso: 1400, vision: 900, clipz: 3100, connect: 800 }, look: L('#f6d3b3', 5, '#1d1512', '#ef476f', '#2a2f3d', 3, 0, 'b'), sched: { d: [0, 2, 4, 6], h: 19, dur: 4 }, vids: 2, small: true },
  ];
  D.creatorById = id => D.creators.find(c => c.id === id);
  // amizades e rivalidades iniciais entre criadores
  D.creatorLinks = [['c_mestre', 'c_gabs', 40], ['c_mestre', 'c_pedrao', -30], ['c_lua', 'c_vovo', 60], ['c_lua', 'c_jp', 45], ['c_cha', 'c_mestre', -40], ['c_cha', 'c_lua', -20], ['c_fred', 'c_gabs', 30], ['c_bruno', 'c_vovo', 50], ['c_kai', 'c_ana', 35], ['c_nando', 'c_lari', 20], ['c_noturno', 'c_lari', 25], ['c_tia', 'c_jp', 30], ['c_mila', 'c_pedrao', -15]];

  D.newsAccounts = [
    { id: 'n_pulso', name: 'Pulso Notícias', handle: 'pulsonoticias', color: '#8b5cf6' },
    { id: 'n_fofoca', name: 'Fofoca Digital', handle: 'fofocadigital', color: '#ff3d81' },
    { id: 'n_games', name: 'Mundo dos Games', handle: 'mundodosgames', color: '#35d39a' },
  ];

  D.celebs = [
    { name: 'MC Brisa', handle: 'mcbrisa', kind: 'cantora' }, { name: 'Lara Monte', handle: 'laramonte', kind: 'atriz de novela' },
    { name: 'Dudu Golaço', handle: 'dudugolaco', kind: 'jogador de futebol' }, { name: 'Chef Paulão', handle: 'chefpaulao', kind: 'chef da TV' },
    { name: 'Rodrigo Riso', handle: 'rodrigoriso', kind: 'humorista' },
  ];

  // Marcas para patrocínio. ethics baixo = paga bem, mas o público não gosta
  D.brands = [
    { id: 'energix', name: 'EnergiX', cat: 'bebida', prod: 'energético EnergiX', tier: 0, base: 450, ethics: 0.75, color: '#35d39a' },
    { id: 'gameforce', name: 'GameForce', cat: 'jogos', prod: 'loja de jogos GameForce', tier: 0, base: 500, ethics: 0.95, color: '#4cc3ff' },
    { id: 'pizzanuvem', name: 'Pizza Nuvem', cat: 'comida', prod: 'app Pizza Nuvem', tier: 0, base: 600, ethics: 0.9, color: '#ff8a4c' },
    { id: 'teclamax', name: 'TeclaMax', cat: 'periferico', prod: 'teclado TeclaMax', tier: 1, base: 1100, ethics: 0.95, color: '#c084fc' },
    { id: 'escudovpn', name: 'Escudo VPN', cat: 'app', prod: 'Escudo VPN', tier: 1, base: 1600, ethics: 0.8, color: '#3b82f6' },
    { id: 'cursa', name: 'Cursa+', cat: 'educacao', prod: 'plataforma de cursos Cursa+', tier: 1, base: 1900, ethics: 0.9, color: '#f5c542' },
    { id: 'betasorte', name: 'BetaSorte', cat: 'apostas', prod: 'site de apostas BetaSorte', tier: 1, base: 5200, ethics: 0.1, color: '#ef476f' },
    { id: 'trono', name: 'Cadeiras Trono', cat: 'periferico', prod: 'cadeira gamer Trono', tier: 2, base: 3200, ethics: 0.95, color: '#ff5a36' },
    { id: 'vestrua', name: 'Vest Rua', cat: 'moda', prod: 'coleção Vest Rua', tier: 2, base: 3800, ethics: 0.85, color: '#19b8a8' },
    { id: 'moedabank', name: 'Banco Moeda', cat: 'banco', prod: 'conta digital Banco Moeda', tier: 3, base: 9000, ethics: 0.8, color: '#8b5cf6' },
    { id: 'zapcel', name: 'ZapCel', cat: 'telecom', prod: 'plano de celular ZapCel', tier: 3, base: 14000, ethics: 0.75, color: '#0f766e' },
    { id: 'cripto', name: 'Moedinha Cripto', cat: 'cripto', prod: 'corretora Moedinha', tier: 2, base: 7000, ethics: 0.25, color: '#ffb547' },
  ];
  D.brandById = id => D.brands.find(b => b.id === id);
})(window.SL);

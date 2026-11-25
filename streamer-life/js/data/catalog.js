/* Catálogos: jogos (nomes oficiais, nov/2026, a pedido do dono; capas desenhadas em render/capas.js), equipamentos, móveis, comidas, casas, lugares da cidade. Marcas de equipamento continuam inventadas. */
'use strict';
(function (SL) {
  const D = SL.D;

  // demand = quanto o jogo exige do computador; pop = popularidade base; sat = saturação (quantos streamers disputam)
  D.games = [
    { id: 'golplaca', name: 'FIFA 27', cat: 'Esporte', sim: 'futebol', demand: 45, pop: 70, sat: 0.72, rpm: 1.0, color: '#2f9e5b', tags: ['fifa', 'futebol', 'esporte', 'competitivo'] },
    { id: 'zonafinal', name: 'Fortnite', cat: 'Battle royale', sim: 'br', demand: 66, pop: 92, sat: 0.93, rpm: 1.05, color: '#e0702a', tags: ['fortnite', 'battle royale', 'tiro', 'competitivo'] },
    { id: 'corredor13', name: 'Resident Evil Requiem', cat: 'Terror', sim: 'terror', demand: 54, pop: 56, sat: 0.5, rpm: 1.1, color: '#7a2b3a', tags: ['resident evil', 'terror', 'suspense', 'sustos'] },
    { id: 'turbo', name: 'Forza Horizon 6', cat: 'Corrida', sim: 'corrida', demand: 58, pop: 44, sat: 0.42, rpm: 1.0, color: '#d8432f', tags: ['forza', 'corrida', 'carros', 'velocidade'] },
    { id: 'lendas', name: 'League of Legends', cat: 'MOBA', sim: 'moba', demand: 36, pop: 80, sat: 0.86, rpm: 0.95, color: '#3a6fd8', tags: ['lol', 'moba', 'estratégia', 'competitivo'] },
    { id: 'blocolandia', name: 'Minecraft', cat: 'Sandbox', sim: 'sandbox', demand: 28, pop: 76, sat: 0.8, rpm: 0.9, color: '#5fae3e', tags: ['minecraft', 'construção', 'sandbox', 'sobrevivência'] },
    { id: 'punho', name: 'Street Fighter 6', cat: 'Luta', sim: 'luta', demand: 34, pop: 36, sat: 0.32, rpm: 0.95, color: '#c33b8a', tags: ['street fighter', 'luta', 'combos', 'competitivo'] },
    { id: 'xeque', name: 'Chess.com', cat: 'Xadrez', sim: 'xadrez', demand: 6, pop: 30, sat: 0.28, rpm: 1.2, color: '#8a7a5c', tags: ['xadrez', 'estratégia', 'tabuleiro'] },
    { id: 'fazendinha', name: 'Stardew Valley', cat: 'Simulação', sim: 'fazenda', demand: 20, pop: 40, sat: 0.38, rpm: 1.0, color: '#e2b23a', tags: ['stardew', 'fazenda', 'relaxante', 'simulação'] },
    { id: 'estrela', name: 'GTA 6', cat: 'Ação / mundo aberto', sim: 'rpg', tela: 'gta', demand: 0, pop: 64, sat: 0.55, rpm: 1.15, color: '#6b4fd8', tags: ['gta', 'mundo aberto', 'ação', 'história'], console: true },
    { id: 'pixel', name: 'Tetris', cat: 'Puzzle / speedrun', sim: 'retro', tela: 'tetris', demand: 5, pop: 26, sat: 0.18, rpm: 1.0, color: '#2bb3a6', tags: ['tetris', 'puzzle', 'speedrun', 'retrô'] },
    { id: 'conversa', name: 'Conversando', cat: 'Conversa', sim: 'conversa', demand: 4, pop: 82, sat: 0.9, rpm: 1.1, color: '#8b5cf6', tags: ['conversa', 'bate-papo', 'vida'], nongame: true },
    { id: 'react', name: 'React', cat: 'Reação', sim: 'react', demand: 12, pop: 62, sat: 0.72, rpm: 1.0, color: '#ff5a36', tags: ['react', 'reação', 'humor'], nongame: true },
  ];
  D.gameById = id => D.games.find(g => g.id === id);

  // Equipamentos (setup). rel = confiabilidade (chance de não quebrar)
  D.equip = [
    // computadores
    { id: 'pc_note', slot: 'computador', name: 'Notebook velho', brand: 'Genérico', price: 0, perf: 16, render: 10, rel: 0.985, w: 60, tier: 0, desc: 'Herdado do primo. Esquenta e trava em jogo pesado.' },
    { id: 'pc_entrada', slot: 'computador', name: 'PC Faísca 3', brand: 'Faísca', price: 2600, perf: 42, render: 34, rel: 0.996, w: 260, tier: 1, desc: 'Primeiro PC de verdade. Roda jogos leves e médios.' },
    { id: 'pc_inter', slot: 'computador', name: 'PC Faísca 5 Turbo', brand: 'Faísca', price: 5900, perf: 64, render: 58, rel: 0.997, w: 380, tier: 2, desc: 'Equilíbrio entre jogo e transmissão em 1080p.' },
    { id: 'pc_avanc', slot: 'computador', name: 'PC Trovão 7', brand: 'Trovão', price: 11500, perf: 84, render: 80, rel: 0.998, w: 520, tier: 3, desc: 'Transmite jogo pesado sem perder quadro.' },
    { id: 'pc_pro', slot: 'computador', name: 'Workstation Titã X', brand: 'Titã', price: 24000, perf: 100, render: 100, rel: 0.999, w: 700, tier: 4, desc: 'Profissional: edição pesada e live em 1440p.' },
    // monitores
    { id: 'mon_21', slot: 'monitor', name: 'Monitor 21" 60Hz', brand: 'Visor', price: 520, q: 30, rel: 0.998, tier: 1, desc: 'Tela maior que a do notebook.' },
    { id: 'mon_24', slot: 'monitor', name: 'Monitor 24" 144Hz', brand: 'Visor', price: 1150, q: 55, rel: 0.998, tier: 2, desc: 'Mais fluidez na jogatina.' },
    { id: 'mon_27', slot: 'monitor', name: 'Monitor 27" QHD 165Hz', brand: 'Prisma', price: 2300, q: 75, rel: 0.998, tier: 3, desc: 'Imagem nítida para editar e jogar.' },
    { id: 'mon_duo', slot: 'monitor', name: 'Dois monitores 27" QHD', brand: 'Prisma', price: 4500, q: 92, rel: 0.998, dual: true, tier: 4, desc: 'Um para o jogo, outro para o chat. Produção mais rápida.' },
    // microfones
    { id: 'mic_usb', slot: 'microfone', name: 'Microfone USB Eco', brand: 'Eco', price: 220, audio: 45, rel: 0.996, tier: 1, desc: 'Já tira aquele som de lata.' },
    { id: 'mic_cond', slot: 'microfone', name: 'Condensador Brisa', brand: 'Brisa', price: 680, audio: 66, rel: 0.996, tier: 2, desc: 'Voz encorpada. Pega um pouco do barulho da rua.' },
    { id: 'mic_pro', slot: 'microfone', name: 'Dinâmico Pro + interface', brand: 'Onda', price: 2100, audio: 88, rel: 0.998, tier: 3, desc: 'Som de rádio. Isola ruído do ambiente.' },
    // webcams
    { id: 'cam_hd', slot: 'webcam', name: 'Webcam HD', brand: 'Olho', price: 190, video: 40, rel: 0.995, tier: 1, desc: '720p. Melhor que a do notebook.' },
    { id: 'cam_fhd', slot: 'webcam', name: 'Webcam Full HD 60', brand: 'Olho', price: 560, video: 62, rel: 0.996, tier: 2, desc: '1080p a 60 quadros.' },
    { id: 'cam_mirror', slot: 'webcam', name: 'Câmera Mirrorless Lumi', brand: 'Lumi', price: 4900, video: 90, rel: 0.998, tier: 3, desc: 'Fundo desfocado de cinema.' },
    // headsets
    { id: 'fone_simples', slot: 'headset', name: 'Fone de ouvido simples', brand: 'Genérico', price: 35, audio: 15, rel: 0.99, tier: 0, desc: 'O fio já está descascando.' },
    { id: 'head_gamer', slot: 'headset', name: 'Headset Pulsar', brand: 'Pulsar', price: 290, audio: 50, game: 3, rel: 0.995, tier: 1, desc: 'Ouve os passos do inimigo.' },
    { id: 'head_studio', slot: 'headset', name: 'Fone Studio Monitor', brand: 'Onda', price: 950, audio: 75, game: 5, rel: 0.997, tier: 2, desc: 'Para editar áudio com precisão.' },
    // teclados e mouses
    { id: 'tec_membrana', slot: 'teclado', name: 'Teclado de membrana', brand: 'Genérico', price: 80, game: 2, rel: 0.995, tier: 1, desc: 'Básico e silencioso.' },
    { id: 'tec_mec', slot: 'teclado', name: 'Teclado mecânico Click', brand: 'Click', price: 360, game: 5, rel: 0.997, tier: 2, desc: 'Resposta rápida. Barulhinho bom.' },
    { id: 'tec_pro', slot: 'teclado', name: 'Teclado mecânico Click Pro', brand: 'Click', price: 920, game: 7, rel: 0.998, tier: 3, desc: 'Ótimo para quem joga competitivo.' },
    { id: 'mouse_basico', slot: 'mouse', name: 'Mouse básico', brand: 'Genérico', price: 45, game: 2, rel: 0.995, tier: 1, desc: 'Faz o trabalho.' },
    { id: 'mouse_gamer', slot: 'mouse', name: 'Mouse gamer Flecha', brand: 'Flecha', price: 170, game: 5, rel: 0.997, tier: 2, desc: 'Sensor preciso.' },
    { id: 'mouse_pro', slot: 'mouse', name: 'Mouse Flecha Ultraleve', brand: 'Flecha', price: 560, game: 8, rel: 0.998, tier: 3, desc: '58 gramas de pura mira.' },
    // iluminação
    { id: 'luz_mesa', slot: 'iluminacao', name: 'Luminária de mesa', brand: 'Genérico', price: 65, light: 25, rel: 0.995, tier: 1, desc: 'Tira o rosto da sombra.' },
    { id: 'luz_ring', slot: 'iluminacao', name: 'Ring light 18"', brand: 'Aura', price: 190, light: 50, rel: 0.996, tier: 2, desc: 'O clássico brilho nos olhos.' },
    { id: 'luz_soft', slot: 'iluminacao', name: 'Kit softbox', brand: 'Aura', price: 780, light: 72, rel: 0.997, tier: 3, desc: 'Luz suave de estúdio.' },
    { id: 'luz_pro', slot: 'iluminacao', name: 'Key light + painéis RGB', brand: 'Aura', price: 1900, light: 92, rel: 0.998, tier: 4, desc: 'Iluminação profissional com cores.' },
    // captura, câmera de vlog e console
    { id: 'cap_nebula', slot: 'captura', name: 'Placa de captura Nébula', brand: 'Nébula', price: 950, cap: 70, rel: 0.997, tier: 2, desc: 'Necessária para transmitir do console.' },
    { id: 'cap_nebula_pro', slot: 'captura', name: 'Placa de captura Nébula 4K', brand: 'Nébula', price: 2200, cap: 95, rel: 0.998, tier: 3, desc: 'Captura em alta qualidade sem atraso.' },
    { id: 'vlog_compacta', slot: 'vlogcam', name: 'Câmera de vlog Passo', brand: 'Passo', price: 1650, vlog: 70, rel: 0.997, tier: 2, desc: 'Grava vlogs com estabilização.' },
    { id: 'vlog_cel', slot: 'vlogcam', name: 'Celular top Astro Ultra', brand: 'Astro', price: 4800, vlog: 85, rel: 0.998, tier: 3, desc: 'Grava, edita e publica de qualquer lugar.' },
    { id: 'console_vortex', slot: 'console', name: 'Console VortexStation 5', brand: 'Vortex', price: 3900, rel: 0.998, tier: 2, desc: 'Libera jogos exclusivos de console (precisa de placa de captura para transmitir).' },
  ];
  D.equipById = id => D.equip.find(e => e.id === id);
  D.equipSlots = [
    { id: 'computador', name: 'Computador', icon: 'cpu' }, { id: 'monitor', name: 'Monitor', icon: 'monitor' },
    { id: 'microfone', name: 'Microfone', icon: 'mic' }, { id: 'webcam', name: 'Webcam', icon: 'cam' },
    { id: 'headset', name: 'Headset', icon: 'headset' }, { id: 'teclado', name: 'Teclado', icon: 'keyboard' },
    { id: 'mouse', name: 'Mouse', icon: 'mouse' }, { id: 'iluminacao', name: 'Iluminação', icon: 'light' },
    { id: 'captura', name: 'Placa de captura', icon: 'capture' }, { id: 'vlogcam', name: 'Câmera de vlog', icon: 'cam' },
    { id: 'console', name: 'Console', icon: 'gamepad' },
  ];
  // Peças para montar o PC de mesa (nov/2026): somam desempenho (perf) e renderização (render) ao computador.
  // A placa de vídeo gasta energia (w); fonte fraca segura a placa (ver Equip.pecas).
  D.equip.push(
    { id: 'cpu_3', slot: 'cpu', peca: 1, name: 'Processador Núcleo 3 (4 núcleos)', brand: 'Núcleo', price: 650, perf: 4, render: 6, w: 65, rel: 0.999, tier: 1, desc: 'Básico, mas já ajuda o PC a respirar.' },
    { id: 'cpu_5', slot: 'cpu', peca: 1, name: 'Processador Núcleo 5 (6 núcleos)', brand: 'Núcleo', price: 1300, perf: 8, render: 10, w: 65, rel: 0.999, tier: 2, desc: 'Joga e transmite ao mesmo tempo sem engasgar.' },
    { id: 'cpu_7', slot: 'cpu', peca: 1, name: 'Processador Núcleo 7 (8 núcleos)', brand: 'Núcleo', price: 2400, perf: 12, render: 16, w: 105, rel: 0.999, tier: 3, desc: 'Muitos núcleos: edição bem mais rápida.' },
    { id: 'cpu_9', slot: 'cpu', peca: 1, name: 'Processador Núcleo 9 (16 núcleos)', brand: 'Núcleo', price: 4200, perf: 15, render: 24, w: 170, rel: 0.999, tier: 4, desc: 'Topo de linha. Renderiza vídeo num piscar de olhos.' },
    { id: 'gpu_1', slot: 'gpu', peca: 1, name: 'Placa de vídeo Raio 1650 (4 GB)', brand: 'Raio', price: 1100, perf: 8, render: 3, w: 75, rel: 0.998, tier: 1, desc: 'Roda os jogos leves e médios com folga.' },
    { id: 'gpu_2', slot: 'gpu', peca: 1, name: 'Placa de vídeo Raio 3060 (12 GB)', brand: 'Raio', price: 2300, perf: 15, render: 6, w: 170, rel: 0.998, tier: 2, desc: 'A queridinha dos streamers: 1080p liso.' },
    { id: 'gpu_3', slot: 'gpu', peca: 1, name: 'Placa de vídeo Raio 4070 Super (12 GB)', brand: 'Raio', price: 4600, perf: 22, render: 9, w: 220, rel: 0.998, tier: 3, desc: 'Jogo pesado no máximo e live sem perder quadro.' },
    { id: 'gpu_4', slot: 'gpu', peca: 1, name: 'Placa de vídeo Raio 4090 (24 GB)', brand: 'Raio', price: 12000, perf: 30, render: 14, w: 450, rel: 0.998, tier: 4, desc: 'A mais forte do mercado. Precisa de fonte boa.' },
    { id: 'ram_8', slot: 'ram', peca: 1, name: 'Memória RAM 8 GB DDR4', brand: 'Memora', price: 180, perf: 2, render: 3, rel: 0.999, tier: 1, desc: 'O mínimo para abrir o jogo e o OBS juntos.' },
    { id: 'ram_16', slot: 'ram', peca: 1, name: 'Memória RAM 16 GB DDR4', brand: 'Memora', price: 380, perf: 4, render: 6, rel: 0.999, tier: 2, desc: 'Jogo, live, chat e navegador sem travar.' },
    { id: 'ram_32', slot: 'ram', peca: 1, name: 'Memória RAM 32 GB DDR5 RGB', brand: 'Memora', price: 900, perf: 6, render: 10, rel: 0.999, tier: 3, desc: 'Sobra memória para editar vídeo longo.' },
    { id: 'ram_64', slot: 'ram', peca: 1, name: 'Memória RAM 64 GB DDR5 RGB', brand: 'Memora', price: 1900, perf: 7, render: 15, rel: 0.999, tier: 4, desc: 'Para quem edita em 4K com vários programas abertos.' },
    { id: 'ssd_1', slot: 'ssd', peca: 1, name: 'SSD 480 GB SATA', brand: 'Rápido', price: 230, perf: 1, render: 4, rel: 0.998, tier: 1, desc: 'O PC liga em segundos e o jogo carrega rápido.' },
    { id: 'ssd_2', slot: 'ssd', peca: 1, name: 'SSD NVMe 1 TB', brand: 'Rápido', price: 520, perf: 1, render: 8, rel: 0.998, tier: 2, desc: 'Muito mais rápido para abrir e salvar vídeos.' },
    { id: 'ssd_3', slot: 'ssd', peca: 1, name: 'SSD NVMe 2 TB Gen4', brand: 'Rápido', price: 1100, perf: 2, render: 12, rel: 0.999, tier: 3, desc: 'Espaço de sobra para as gravações das lives.' },
    { id: 'fonte_1', slot: 'fonte', peca: 1, name: 'Fonte 500 W 80 Plus', brand: 'Volt', price: 320, pw: 500, rel: 0.998, tier: 1, desc: 'Aguenta placa de vídeo simples.' },
    { id: 'fonte_2', slot: 'fonte', peca: 1, name: 'Fonte 750 W Gold', brand: 'Volt', price: 690, pw: 750, rel: 0.999, tier: 2, desc: 'Energia estável para placas fortes.' },
    { id: 'fonte_3', slot: 'fonte', peca: 1, name: 'Fonte 1000 W Platinum', brand: 'Volt', price: 1400, pw: 1000, rel: 0.999, tier: 3, desc: 'Segura qualquer placa de vídeo.' },
    { id: 'cooler_1', slot: 'cooler', peca: 1, name: 'Cooler a ar Torre', brand: 'Gelo', price: 180, perf: 1, cool: 1, rel: 0.999, tier: 1, desc: 'O PC esquenta menos e quebra menos.' },
    { id: 'cooler_2', slot: 'cooler', peca: 1, name: 'Water cooler 240 mm', brand: 'Gelo', price: 650, perf: 2, cool: 2, rel: 0.999, tier: 2, desc: 'Processador fresquinho mesmo em live longa.' },
    { id: 'cooler_3', slot: 'cooler', peca: 1, name: 'Water cooler 360 mm RGB', brand: 'Gelo', price: 1200, perf: 3, cool: 3, rel: 0.999, tier: 3, desc: 'Silencioso, gelado e cheio de luz.' },
  );
  D.pecaSlots = [
    { id: 'cpu', name: 'Processador', icon: 'cpu' }, { id: 'gpu', name: 'Placa de vídeo', icon: 'monitor' },
    { id: 'ram', name: 'Memória RAM', icon: 'capture' }, { id: 'ssd', name: 'SSD', icon: 'folder' },
    { id: 'fonte', name: 'Fonte', icon: 'energy' }, { id: 'cooler', name: 'Refrigeração', icon: 'sparkle' },
  ];

  D.internet = [
    { id: 'net50', name: 'Plano 50 Mega', up: 6, stab: 0.86, price: 89 },
    { id: 'fibra300', name: 'Fibra 300 Mega', up: 18, stab: 0.95, price: 129 },
    { id: 'fibra1g', name: 'Fibra 1 Giga', up: 60, stab: 0.992, price: 229 },
  ];
  D.software = [
    { id: 'editor_pro', name: 'Editor Corte Pro (assinatura)', price: 59, monthly: true, desc: 'Edição 15% melhor e 25% mais rápida.' },
    { id: 'overlays', name: 'Pacote de overlays animados', price: 140, monthly: false, desc: 'Visual da live mais profissional (+5 de qualidade visual).' },
    { id: 'bot_chat', name: 'Bot de moderação Vigia', price: 29, monthly: true, desc: 'Silencia trolls automaticamente e lembra do seu Instagram no chat.' },
    { id: 'auto_ads', name: 'Mod AutoAnúncios', price: 390, monthly: false, desc: 'Roda os intervalos de anúncios sozinho durante a live, do jeito que você configurar no app Anúncios. Pagamento único.' },
  ];

  // Móveis e decoração da casa
  D.furniture = [
    { id: 'colchao', slot: 'cama', name: 'Colchão no chão', price: 0, sleep: 0.78, comfort: 10, tier: 0 },
    { id: 'cama_solteiro', slot: 'cama', name: 'Cama de solteiro', price: 690, sleep: 1.0, comfort: 30, tier: 1 },
    { id: 'cama_casal', slot: 'cama', name: 'Cama box casal', price: 1850, sleep: 1.15, comfort: 55, tier: 2 },
    { id: 'cama_premium', slot: 'cama', name: 'Cama premium com colchão de molas', price: 4300, sleep: 1.32, comfort: 80, tier: 3 },
    { id: 'frigobar', slot: 'geladeira', name: 'Frigobar', price: 0, cap: 8, keep: 1, tier: 0 },
    { id: 'geladeira', slot: 'geladeira', name: 'Geladeira duplex', price: 2100, cap: 18, keep: 1.5, tier: 1 },
    { id: 'geladeira_inox', slot: 'geladeira', name: 'Geladeira inox frost free', price: 4600, cap: 30, keep: 2, tier: 2 },
    { id: 'fogao2', slot: 'fogao', name: 'Fogareiro de 2 bocas', price: 0, cook: 0.85, tier: 0 },
    { id: 'fogao4', slot: 'fogao', name: 'Fogão 4 bocas', price: 750, cook: 1.0, tier: 1 },
    { id: 'cooktop', slot: 'fogao', name: 'Cooktop com forno elétrico', price: 1950, cook: 1.2, tier: 2 },
    { id: 'mesa_dobravel', slot: 'mesa', name: 'Mesa dobrável', price: 0, prod: 0, tier: 0 },
    { id: 'mesa_gamer', slot: 'mesa', name: 'Mesa gamer', price: 620, prod: 4, tier: 1 },
    { id: 'mesa_l', slot: 'mesa', name: 'Mesa em L', price: 1500, prod: 8, tier: 2 },
    { id: 'cadeira_plastico', slot: 'cadeira', name: 'Cadeira de plástico', price: 0, comfort: 5, tier: 0 },
    { id: 'cadeira_escritorio', slot: 'cadeira', name: 'Cadeira de escritório', price: 460, comfort: 30, tier: 1 },
    { id: 'cadeira_gamer', slot: 'cadeira', name: 'Cadeira gamer Trono', price: 1250, comfort: 50, tier: 2 },
    { id: 'cadeira_ergo', slot: 'cadeira', name: 'Cadeira ergonômica Postura', price: 3300, comfort: 85, tier: 3 },
    { id: 'chuveiro', slot: 'chuveiro', name: 'Chuveiro elétrico', price: 0, hyg: 1, tier: 0 },
    { id: 'ducha', slot: 'chuveiro', name: 'Ducha pressurizada', price: 650, hyg: 1.4, tier: 1 },
    { id: 'sofa', slot: 'sofa', name: 'Sofá de dois lugares', price: 950, fun: 1.0, comfort: 35, tier: 1 },
    { id: 'sofa_retratil', slot: 'sofa', name: 'Sofá retrátil', price: 2700, fun: 1.25, comfort: 70, tier: 2 },
    { id: 'tv32', slot: 'tv', name: 'TV 32"', price: 1150, fun: 1.0, tier: 1 },
    { id: 'tv55', slot: 'tv', name: 'TV 55" 4K', price: 3300, fun: 1.35, tier: 2 },
    { id: 'cafeteira', slot: 'cafeteira', name: 'Cafeteira elétrica', price: 360, tier: 1 },
    { id: 'bike_ergo', slot: 'bike', name: 'Bicicleta ergométrica', price: 1450, fit: 1, tier: 1 },
    { id: 'acustica', slot: 'acustica', name: 'Espuma acústica no escritório', price: 420, audio: 10, tier: 1 },
    // decoração (vários por casa)
    { id: 'planta', slot: 'deco', name: 'Vaso de planta', price: 90, decor: 4, kind: 'planta' },
    { id: 'quadro', slot: 'deco', name: 'Quadro abstrato', price: 160, decor: 4, kind: 'quadro' },
    { id: 'poster', slot: 'deco', name: 'Pôster de jogo', price: 60, decor: 3, kind: 'poster' },
    { id: 'tapete', slot: 'deco', name: 'Tapete felpudo', price: 290, decor: 5, kind: 'tapete' },
    { id: 'led', slot: 'deco', name: 'Fita de LED colorida', price: 130, decor: 6, cam: 6, kind: 'led' },
    { id: 'estante', slot: 'deco', name: 'Estante com colecionáveis', price: 950, decor: 9, cam: 8, kind: 'estante' },
    { id: 'neon', slot: 'deco', name: 'Letreiro neon com o nome do canal', price: 680, decor: 8, cam: 12, kind: 'neon' },
    { id: 'luminaria', slot: 'deco', name: 'Luminária de chão', price: 260, decor: 4, kind: 'luminaria' },
  ];
  // pôsteres de jogo: você escolhe o jogo na loja (o 'poster' antigo fica só para salvamentos antigos)
  D.furniture.find(f => f.id === 'poster').oculto = true;
  D.games.filter(g => !g.nongame).forEach(g => D.furniture.push({ id: 'poster_' + g.id, slot: 'deco', name: 'Pôster ' + g.name, price: 60, decor: 3, kind: 'poster', game: g.id }));
  D.furnById = id => D.furniture.find(f => f.id === id);

  // Comidas do mercado. perish = dias até estragar (0 = não estraga)
  D.foods = [
    { id: 'miojo', name: 'Macarrão instantâneo', price: 3.5, portions: 1, perish: 0, eat: { fome: 26, saude: -1, humor: 1 }, time: 10, cook: false },
    { id: 'pao', name: 'Pão e frios', price: 14, portions: 4, perish: 5, eat: { fome: 28, humor: 1 }, time: 8 },
    { id: 'frutas', name: 'Frutas da estação', price: 11, portions: 4, perish: 6, eat: { fome: 15, sede: 10, saude: 1.5 }, time: 4 },
    { id: 'ingredientes', name: 'Ingredientes de refeição', price: 28, portions: 3, perish: 5, eat: { fome: 62, saude: 2, humor: 4 }, time: 40, cook: true },
    { id: 'lasanha', name: 'Lasanha congelada', price: 17, portions: 1, perish: 0, eat: { fome: 45, humor: 3, saude: -0.5 }, time: 15 },
    { id: 'salada', name: 'Salada pronta', price: 15, portions: 1, perish: 3, eat: { fome: 30, saude: 2.5, humor: 1 }, time: 5 },
    { id: 'salgadinho', name: 'Salgadinhos', price: 7.5, portions: 2, perish: 0, eat: { fome: 13, humor: 2, saude: -0.5 }, time: 3 },
    { id: 'refri', name: 'Refrigerante', price: 8, portions: 2, perish: 0, eat: { sede: 32, humor: 2, saude: -0.5 }, time: 2 },
    { id: 'suco', name: 'Suco natural', price: 9, portions: 2, perish: 4, eat: { sede: 35, saude: 1 }, time: 2 },
    { id: 'energetico', name: 'Energético', price: 9.5, portions: 1, perish: 0, eat: { energia: 24, sono: 8, estresse: 3, saude: -1.5 }, time: 2 },
    { id: 'cafe', name: 'Pacote de café', price: 16, portions: 10, perish: 0, eat: { energia: 12, sono: 6, humor: 1 }, time: 6, coffee: true },
  ];
  D.foodById = id => D.foods.find(f => f.id === id);

  D.delivery = [
    { id: 'pizza', name: 'Pizza grande', price: 56, eat: { fome: 70, humor: 9, saude: -1 }, leftovers: 'pao' },
    { id: 'hamburguer', name: 'Hambúrguer artesanal', price: 39, eat: { fome: 60, humor: 7, saude: -1 } },
    { id: 'marmita', name: 'Marmita caseira', price: 24, eat: { fome: 58, saude: 1.5, humor: 3 } },
    { id: 'sushi', name: 'Combinado de sushi', price: 72, eat: { fome: 55, humor: 10, saude: 1 } },
    { id: 'acai', name: 'Açaí de 500 ml', price: 23, eat: { fome: 25, sede: 15, humor: 6 } },
    { id: 'poke', name: 'Poke de salmão', price: 45, eat: { fome: 50, saude: 2.5, humor: 5 } },
  ];

  // Casas: layout = planta desenhada em homeScene
  D.homes = [
    { id: 'kitnet', name: 'Apartamento simples', district: 'Vila Esperança', rent: 900, price: 0, layout: 'A', deco: 6, desc: 'Pequeno, barulhento e com infiltração no banheiro. Mas é seu.' },
    { id: 'mae', name: 'Casa da sua mãe', district: 'Jardim das Flores', rent: 0, price: 0, layout: 'A', deco: 6, desc: 'De volta ao quarto da adolescência.' },
    { id: 'apto', name: 'Apartamento de 2 quartos', district: 'Jardim Aurora', rent: 2300, price: 390000, layout: 'B', deco: 10, desc: 'Escritório separado, varanda e silêncio para gravar.' },
    { id: 'casa', name: 'Casa com espaço para estúdio', district: 'Alto da Colina', rent: 5800, price: 950000, layout: 'C', deco: 14, desc: 'Casa grande com um cômodo pronto para virar estúdio.' },
  ];
  D.homeById = id => D.homes.find(h => h.id === id);
  D.STUDIO_COST = 65000;

  // Lugares da cidade (mapa 1000x640)
  D.places = [
    { id: 'casa', name: 'Sua casa', kind: 'casa', x: 170, y: 470, icon: 'home', color: '#8b5cf6', open: [0, 24] },
    { id: 'mercado', name: 'Mercado Bom Preço', kind: 'mercado', x: 330, y: 380, icon: 'cart', color: '#35d39a', open: [7, 22] },
    { id: 'restaurante', name: 'Cantina da Nonna Lu', kind: 'restaurante', x: 560, y: 470, icon: 'utensils', color: '#ff8a4c', open: [11, 23] },
    { id: 'eletronicos', name: 'MegaByte Eletrônicos', kind: 'eletronicos', x: 690, y: 290, icon: 'cpu', color: '#4cc3ff', open: [9, 20] },
    { id: 'academia', name: 'Academia Força Total', kind: 'academia', x: 300, y: 190, icon: 'dumbbell', color: '#ff4d6d', open: [6, 23] },
    { id: 'shopping', name: 'Shopping Aurora', kind: 'shopping', x: 800, y: 470, icon: 'bag', color: '#c084fc', open: [10, 22] },
    { id: 'parque', name: 'Parque das Palmeiras', kind: 'parque', x: 540, y: 160, icon: 'tree', color: '#5fae3e', open: [5, 22] },
    { id: 'cafeteria', name: 'Café Grão Fino', kind: 'cafeteria', x: 450, y: 300, icon: 'coffee', color: '#d6a36b', open: [7, 21] },
    { id: 'amigos', name: 'Casa da Duda', kind: 'amigos', x: 120, y: 250, icon: 'users', color: '#ffb547', open: [9, 23], host: 'duda' },
    { id: 'rafa', name: 'Casa do Rafa', kind: 'amigos', x: 860, y: 180, icon: 'users', color: '#ffb547', open: [10, 24], host: 'rafa' },
    { id: 'expo', name: 'Centro de Eventos Expo Norte', kind: 'expo', x: 870, y: 330, icon: 'flag', color: '#ff5a36', open: [9, 22] },
  ];
  D.placeById = id => D.places.find(p => p.id === id);

  D.transport = [
    { id: 'pe', name: 'A pé', icon: 'walk', speed: 70, cost: 0, wait: 0 },
    { id: 'bike', name: 'Bicicleta', icon: 'bike', speed: 170, cost: 0, wait: 0, needs: 'bike' },
    { id: 'onibus', name: 'Ônibus', icon: 'bus', speed: 260, cost: 5, wait: 9 },
    { id: 'app', name: 'Carro por app', icon: 'car', speed: 380, cost: 9, perKm: 1.9, wait: 5 },
    { id: 'carro', name: 'Seu carro', icon: 'car', speed: 400, cost: 3, wait: 0, needs: 'carro' },
  ];
  D.vehicles = [
    { id: 'bike', name: 'Bicicleta urbana', price: 950, monthly: 0, desc: 'Viagens mais rápidas e ainda exercita.' },
    { id: 'carro', name: 'Carro popular seminovo', price: 46000, monthly: 420, desc: 'Seguro, IPVA e manutenção: R$ 420 por mês.' },
  ];

  // Cursos online (estudar no computador)
  D.courses = [
    { id: 'c_edicao1', name: 'Edição de vídeo do zero', skill: 'edicao', price: 0, hours: 3, gain: 4, desc: 'Curso gratuito no YouTube.' },
    { id: 'c_edicao2', name: 'Edição dinâmica para retenção', skill: 'edicao', price: 190, hours: 6, gain: 9, min: 20 },
    { id: 'c_mkt1', name: 'Títulos e thumbnails que funcionam', skill: 'marketing', price: 0, hours: 2, gain: 4 },
    { id: 'c_mkt2', name: 'Estratégia de conteúdo e algoritmo', skill: 'marketing', price: 240, hours: 6, gain: 9, min: 20 },
    { id: 'c_orat', name: 'Oratória e presença em câmera', skill: 'carisma', price: 160, hours: 5, gain: 7 },
    { id: 'c_coz', name: 'Cozinha prática', skill: 'culinaria', price: 90, hours: 3, gain: 6 },
  ];

  // Produtos próprios (loja do canal)
  D.merch = [
    { id: 'camiseta', name: 'Camiseta do canal', unit: 32, price: 79, minFans: 300 },
    { id: 'caneca', name: 'Caneca personalizada', unit: 14, price: 45, minFans: 200 },
    { id: 'moletom', name: 'Moletom com capuz', unit: 78, price: 189, minFans: 1500 },
    { id: 'mousepad', name: 'Mousepad gigante', unit: 22, price: 69, minFans: 800 },
  ];

  // Datas especiais (mês-dia). O jogo começa em 01/03/2027.
  D.specialDates = [
    { md: '04-21', name: 'Feriado de Tiradentes', kind: 'feriado' },
    { md: '05-01', name: 'Dia do Trabalho', kind: 'feriado' },
    { md: '06-12', name: 'Dia dos Namorados', kind: 'especial' },
    { md: '06-24', name: 'Festa junina na praça', kind: 'especial' },
    { md: '09-07', name: 'Independência', kind: 'feriado' },
    { md: '10-12', name: 'Dia das Crianças (promoções de jogos)', kind: 'especial' },
    { md: '11-02', name: 'Finados', kind: 'feriado' },
    { md: '11-15', name: 'Proclamação da República', kind: 'feriado' },
    { md: '11-26', name: 'Black Friday (30% na loja)', kind: 'promo' },
    { md: '12-25', name: 'Natal', kind: 'feriado' },
    { md: '12-31', name: 'Virada de ano', kind: 'especial' },
    { md: '01-01', name: 'Ano-novo', kind: 'feriado' },
  ];
  // Eventos fixos no Centro de Eventos (convites dependem da carreira)
  D.expoEvents = [
    { md: '04-17', name: 'Encontro de Criadores Iniciantes', minTier: 0, fee: 40, days: 1 },
    { md: '06-19', name: 'GameFest Norte', minTier: 1, fee: 90, days: 2 },
    { md: '08-14', name: 'Conferência Twitch Criadores', minTier: 2, fee: 0, days: 1 },
    { md: '10-09', name: 'Feira de Tecnologia MegaByte', minTier: 1, fee: 60, days: 2 },
    { md: '12-04', name: 'Prêmio Criadores do Ano', minTier: 3, fee: 0, days: 1 },
    { md: '02-20', name: 'Encontro de Streamers de Verão', minTier: 1, fee: 50, days: 1 },
  ];
  // preços estilo Brasil (nov/2026, pedido do dono): tudo termina em ,99 (2600 vira 2.599,99; 3,50 vira 3,99)
  D.precoBR = p => !(p > 0) ? p : p >= 10 ? Math.round(p) - 0.01 : Math.floor(p) + 0.99;
  [D.equip, D.furniture, D.internet, D.software, D.foods, D.delivery, D.vehicles, D.courses, D.merch].forEach(lista => (lista || []).forEach(it => { if (it.price > 0) it.price = D.precoBR(it.price); }));
})(window.SL);

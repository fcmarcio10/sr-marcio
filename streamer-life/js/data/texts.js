/* Textos do mundo: títulos de vídeos de outros criadores, postagens, notícias, comentários e conversas. */
'use strict';
(function (SL) {
  const T = SL.D.T = {};

  T.titleParts = {
    hooks: ['NÃO ACREDITO', 'PRIMEIRA VEZ', 'O DIA EM QUE', 'TENTEI', 'DESAFIO:', 'IMPOSSÍVEL?', 'REAGINDO', 'TESTEI', 'FIZ'],
  };
  // {g} = jogo, {n} = número
  T.creatorTitles = {
    futebol: ['Fiz um time só de veteranos no {g}', 'Gol de bicicleta no último minuto!', 'Do pior ao melhor time em 24h no {g}', 'Testei a tática mais apelona do {g}', 'Modo carreira: estreia do meu time da várzea'],
    br: ['{n} abates sozinho contra squads', 'Só pistola até o top 1 no {g}', 'A NOVA ARMA ESTÁ QUEBRADA', 'Ganhei sem pegar nenhuma arma?!', 'Treino de mira que mudou meu jogo'],
    terror: ['Zerei {g} sem acender a luz', 'O final secreto que ninguém achou', 'Jogando {g} às 3 da manhã', 'Esse jogo me fez gritar 47 vezes'],
    corrida: ['Do último ao primeiro em uma volta', 'Carro de R$ 1 contra supercarro', 'A pista mais difícil do {g}', 'Desafio: correr sem frear'],
    moba: ['Subi de elo só jogando de suporte', 'O campeão mais quebrado do patch', 'Partida de 60 minutos que virou no final', 'Guia definitivo para iniciantes no {g}'],
    sandbox: ['Construí uma cidade inteira em 100 dias', 'Sobrevivi 100 dias no modo difícil', 'A maior base que já fiz no {g}', 'Casa automática com 1 botão'],
    luta: ['Combo de 100% de dano explicado', 'Enfrentei o número 1 do ranking', 'Do zero ao mestre em uma semana'],
    xadrez: ['O sacrifício de dama mais bonito do ano', 'Xeque-mate em 7 lances!', 'Joguei contra um grande mestre'],
    fazenda: ['Minha fazenda depois de 3 anos no jogo', 'A colheita perfeita', 'Casei no {g} e olha no que deu'],
    rpg: ['O chefe mais difícil do {g}', 'Final verdadeiro de {g} (emocionante)', 'Build que destrói tudo'],
    retro: ['Novo recorde mundial?!', 'Speedrun com os olhos vendados', 'O atalho que economiza 12 segundos'],
    conversa: ['Respondendo perguntas que ninguém tem coragem', 'Contei a verdade sobre a internet', 'Minha rotina real de criador', 'Um dia comigo'],
    react: ['Reagindo aos vídeos mais estranhos da internet', 'Reagindo aos meus primeiros vídeos', 'A polêmica da semana explicada', 'Vídeos que dão vergonha alheia'],
    vlog: ['Passei 24h no shopping', 'Testei a comida mais cara da cidade', 'Fui no maior evento de games do ano', 'Um dia de vlog com os amigos'],
    tech: ['Montei o PC dos sonhos com orçamento curto', 'Vale a pena comprar esse microfone?', 'O setup ideal para começar a fazer live'],
  };
  T.creatorPosts = {
    live: ['Ao vivo agora jogando {g}! Chega mais', 'Live começando: {g} até cansar', 'Bora de {g}, link no perfil', 'Começando a live, hoje tem desafio no {g}'],
    video: ['Vídeo novo no ar: {t}', 'Saiu vídeo! {t}', 'Esse vídeo deu trabalho, espero que gostem: {t}'],
    life: ['Dia de folga, ninguém me chama', 'Comprei uma cadeira nova, minhas costas agradecem', 'Gravando muita coisa pra semana que vem', 'Às vezes a gente precisa de uma pausa', 'Café, edição e chuva lá fora', 'Saudade das lives pequenas, todo mundo se conhecia'],
    milestone: ['Chegamos a {n} seguidores! Obrigado demais', 'Recorde de público ontem: {n} pessoas na live', 'Não acredito que bateu {n} no vídeo novo'],
    opinion: ['A nova atualização do {g} deixou o jogo pior. Pronto, falei', 'Criador pequeno precisa de mais espaço nas plataformas', 'Live de 12 horas faz mal pra saúde, gente', 'O algoritmo do TikTok anda muito estranho'],
    trend: ['Entrei na trend {tag}, ficou uma vergonha', 'Quem mais tá fazendo o {tag}?', 'Desafio aceito: {tag}'],
    drama: ['Tem gente que cresce copiando os outros e acha que ninguém percebe', 'Não vou citar nomes, mas tem criador fingindo número de público', 'Treta resolvida, bola pra frente'],
    praise: ['Fica a dica: sigam o @{h}, conteúdo muito bom', 'Que live incrível do @{h} ontem', 'Collab com @{h} saindo em breve'],
    beef: ['O @{h} adora falar dos outros, né?', 'Ainda esperando o @{h} explicar aquilo'],
  };
  T.news = {
    update: ['{g} recebe atualização grande e volta a ganhar jogadores', 'Nova temporada de {g} começa hoje', 'Desenvolvedores de {g} anunciam modo novo'],
    decline: ['{g} perde jogadores pelo terceiro mês seguido', 'Comunidade de {g} reclama de bugs'],
    record: ['@{h} bate recorde com {n} espectadores ao vivo', '@{h} passa de {n} seguidores'],
    trend: ['Trend do momento no TikTok: {tag}', '{tag} domina as redes nesta semana'],
    gossip: ['Clima tenso entre @{h} e @{h2} nas redes', '@{h} some das redes e fãs ficam preocupados', '@{h} anuncia pausa nas lives'],
    player_good: ['Criador em ascensão: @{u} chama atenção com {n} seguidores', 'O vídeo de @{u} é um dos mais vistos da semana', 'Corte da live de @{u} viraliza'],
    player_bad: ['@{u} recebe críticas depois de comentário polêmico', 'Fãs de @{u} reclamam de publi excessiva', 'Boato sobre @{u} circula nas redes'],
  };
  T.tags = ['#DesafioDoSilêncio', '#SetupTour', '#MeuPrimeiroPC', '#JogandoDeOlhosVendados', '#ChatEscolhe', '#ReceitaEm1Minuto', '#TrendDoSofá', '#PerguntasDosSeguidores', '#VerãoGamer', '#DublandoNPC', '#ReagindoAoAntigo', '#RotinaDeCriador', '#UmDiaComigo', '#ClipeDoAno', '#MiraDeOuro'];

  // Comentários em vídeos do jogador (gerados por espectadores conforme o vídeo)
  T.vcomments = {
    great: ['Vídeo incrível, a edição tá muito boa', 'Esse canal merece 1 milhão', 'Vi até o final sem pular', 'Melhor vídeo do canal até agora', 'Que trabalho bem feito', 'Inscrito! Mais vídeos assim por favor'],
    good: ['Curti o vídeo', 'Muito bom, continua assim', 'Bom demais', 'Gostei da edição', 'Passou rápido o vídeo'],
    meh: ['Vídeo ok', 'Podia ser mais curto', 'O começo demorou', 'Faltou algo, mas tá valendo'],
    bad: ['Edição ruim, cansa ver', 'Muito arrastado', 'Áudio baixo, quase não ouvi', 'Não gostei, desculpa'],
    clickbait: ['Cadê o que tá no título?', 'Clickbait pesado', 'Título enganoso, deslike'],
    moment: ['O momento do {m} foi demais', '{m} kkkkkkk', 'Voltei várias vezes pra ver {m}', 'Ri demais em {m}'],
    first: ['Primeiro!', 'Cheguei cedo', 'Notificação ativada, cheguei'],
    vlog: ['Que lugar bonito', 'Adoro vlog, faz mais', 'Parece que eu tava junto'],
    opinion: ['Concordo com tudo', 'Discordo totalmente', 'Opinião corajosa', 'Finalmente alguém falou isso', 'Isso vai dar polêmica'],
    sponsor: ['Muita propaganda', 'Publi bem feita, nem incomodou', 'Pulei a publi'],
  };
  T.pcomments = {
    texto: ['Verdade!', 'Concordo', 'Kkkkkk muito real', 'Força!', 'Bom dia pra você também', 'Isso aí'],
    foto: ['Que foto bonita', 'Setup lindo', 'Ficou ótimo', 'Quero um desse', 'Que lugar é esse?'],
    anuncio: ['Estarei lá!', 'Lembrete ativado', 'Vou chegar atrasado mas vou', 'Bora!'],
    enquete: ['Votei!', 'Difícil escolher', 'A primeira opção, óbvio'],
    polemica: ['Discordo de você', 'Que opinião ruim', 'Finalmente alguém falou', 'Vai dar treta', 'Respeito, mas não concordo'],
  };

  // Postagens prontas do jogador no Instagram (assuntos)
  T.playerPostTopics = [
    { id: 'bomdia', label: 'Bom dia, seguidores', kind: 'texto', text: 'Bom dia! Hoje o dia vai ser produtivo. E vocês, o que vão fazer?', eng: 1 },
    { id: 'bastidores', label: 'Bastidores da edição', kind: 'texto', text: 'Editando o próximo vídeo. Esse aqui tá ficando especial.', eng: 1.1 },
    { id: 'agradecer', label: 'Agradecer os seguidores', kind: 'texto', text: 'Obrigado a cada pessoa que acompanha o canal. Vocês são demais.', eng: 1.2 },
    { id: 'desabafo', label: 'Desabafo sincero', kind: 'texto', text: 'Às vezes bate o cansaço, mas lembrar de vocês me dá força pra continuar.', eng: 1.3, risk: 0.05 },
    { id: 'opiniao_jogo', label: 'Opinião sobre um jogo', kind: 'texto', text: 'Opinião sincera: {g} está muito melhor que o pessoal fala.', eng: 1.4, risk: 0.12, polemic: true },
    { id: 'opiniao_forte', label: 'Opinião polêmica', kind: 'texto', text: 'Vou falar: tem muito criador grande que não respeita quem tá começando.', eng: 2.0, risk: 0.35, polemic: true },
    { id: 'meme', label: 'Meme do dia', kind: 'texto', text: 'Eu: vou dormir cedo hoje. Também eu, às 4 da manhã: só mais uma partida.', eng: 1.5 },
    { id: 'pergunta', label: 'Perguntar ao público', kind: 'texto', text: 'Qual jogo vocês querem ver na próxima live?', eng: 1.3 },
  ];
  T.photoKinds = [
    { id: 'setup', label: 'Foto do setup', where: 'casa', eng: 1.2 },
    { id: 'selfie', label: 'Selfie', where: 'any', eng: 1.0 },
    { id: 'comida', label: 'Foto da comida', where: 'any', eng: 0.9 },
    { id: 'lugar', label: 'Foto do lugar onde está', where: 'out', eng: 1.25 },
  ];

  // ---------- Conversas com personagens ----------
  // ações: chat (papo), vida (perguntar da vida), trabalho, elogio, piada, conselho, flerte, desculpa, presente
  T.dialog = {
    chat: {
      good: ['Ah, que bom falar com você! Tava precisando de uma conversa assim.', 'Haha, sério? Me conta mais depois.', 'Você sempre me faz rir.', 'Adoro esses papos sem compromisso.'],
      ok: ['Legal, legal. E aí, tudo certo?', 'Hm, entendi.', 'Pois é, a vida tá corrida.'],
      bad: ['Agora não é uma boa hora...', 'Desculpa, tô meio sem paciência hoje.', 'Hm. Tá.'],
    },
    vida: {
      good: ['Obrigado(a) por perguntar! Tá tudo indo bem, {x}.', 'Que bom que você quer saber. As coisas estão melhorando, {x}.', 'Ninguém costuma perguntar isso. {x}'],
      ok: ['Tá indo, né. {x}', 'Normal, nada de novo. {x}'],
      bad: ['Prefiro não falar disso agora.', 'É complicado.'],
    },
    trabalho: {
      good: ['Nossa, que legal o que você tá fazendo com o canal! Tô acompanhando.', 'Você tá crescendo, hein! Fico feliz.', 'Se precisar de ajuda é só falar.'],
      ok: ['Hm, legal. Eu não entendo muito disso, mas legal.', 'Você só fala de trabalho, né? Haha.'],
      bad: ['De novo esse assunto do canal...', 'Toda conversa vira sobre seguidores, cansa.'],
    },
    elogio: {
      good: ['Ahh, para! Você que é demais.', 'Fiquei sem graça agora. Obrigado(a)!', 'Isso me ganhou o dia.'],
      ok: ['Valeu, haha.', 'Obrigado(a).'],
      bad: ['Hm, tá querendo alguma coisa?', 'Que estranho você falar isso assim.'],
    },
    piada: {
      good: ['HAHAHA não acredito, essa foi ótima!', 'Você é muito bobo(a), haha.', 'Para que eu choro de rir!'],
      ok: ['Haha... entendi.', 'Essa foi fraquinha, mas valeu.'],
      bad: ['Não achei graça.', 'Sério isso?'],
    },
    conselho: {
      good: ['Olha, eu acho que você deveria cuidar mais de você. O canal vem depois.', 'Meu conselho: consistência. Faz um pouco todo dia.', 'Confia no seu jeito. É isso que o pessoal gosta.'],
      ok: ['Não sei se sou a melhor pessoa pra isso, mas faz o que seu coração mandar.'],
      bad: ['Agora não consigo pensar nisso.'],
    },
    flerte: {
      good: ['Hmm... você tá me deixando sem graça. Mas eu gostei.', 'Eu tava esperando você falar algo assim.', 'Que sorriso é esse, hein?'],
      ok: ['Haha, você é engraçado(a).', 'Vamos com calma, né?'],
      bad: ['Acho que você entendeu errado, a gente é só amigo(a).', 'Prefiro que não, tá bom?'],
    },
    desculpa: {
      good: ['Tudo bem. Obrigado(a) por reconhecer. Vamos seguir.', 'Eu também exagerei. Tá tudo certo.'],
      ok: ['Tá... vou pensar.', 'Preciso de um tempo, mas obrigado(a) por falar.'],
      bad: ['Pedir desculpa não muda o que aconteceu.'],
    },
    presente: {
      good: ['Você lembrou de mim! Que presente lindo.', 'Não precisava! Amei.'],
      ok: ['Obrigado(a), que gentil.'],
      bad: ['Hm, obrigado(a)...'],
    },
  };
  T.lifeBits = {
    carinhosa: ['tô costurando um vestido de noiva', 'a vizinha trouxe bolo hoje', 'tô com saudade de você'],
    animada: ['peguei um trabalho de identidade visual', 'fui num show incrível', 'comecei a pintar de novo'],
    nerd: ['montei um PC pra um cliente', 'tô viciado num jogo indie', 'consertei um notebook que todo mundo deu como perdido'],
    tranquila: ['li um livro ótimo essa semana', 'tô cuidando das minhas plantas', 'aprendi uma receita de café nova'],
    aventureiro: ['fiz uma trilha no fim de semana', 'tô planejando uma viagem', 'tirei umas fotos lindas do pôr do sol'],
    energética: ['bati meu recorde na corrida', 'comecei a dar aula de funcional', 'tô treinando pra uma maratona'],
    estudiosa: ['tenho prova de anatomia', 'tô de plantão no hospital escola', 'estudei a madrugada toda'],
    carismático: ['inventei um prato novo no restaurante', 'o restaurante tá lotado essa semana', 'tô pensando em abrir meu próprio lugar'],
    criativa: ['tô compondo uma música nova', 'fiz um show pequeno no centro', 'gravei uma demo'],
    reservado: ['tô terminando um jogo que estou programando', 'fui num encontro de desenvolvedores', 'tô estudando inteligência artificial'],
    direta: ['ganhei um caso difícil', 'trabalhei até tarde de novo', 'tô precisando de férias'],
    default: ['a semana foi corrida', 'tá tudo bem por aqui', 'nada demais'],
  };

  // Mensagens que os personagens mandam sozinhos
  T.npcMsgs = {
    mae: ['Filho(a), você está se alimentando direito?', 'Vi sua live ontem! Não entendi nada, mas fiquei orgulhosa.', 'Liga pra sua mãe de vez em quando, viu?', 'Fiz aquele bolo que você gosta. Passa aqui?', 'Não fica acordado(a) até tarde, isso faz mal.', 'Minhas amigas da costura agora te seguem, haha'],
    duda: ['Bora tomar um café essa semana?', 'Vi teu último vídeo! A thumbnail podia ser melhor, posso te ajudar.', 'Tô com saudade das nossas conversas', 'Tem um show sábado, topa?'],
    rafa: ['Bora jogar Fortnite hoje à noite?', 'Chegou peça nova na loja, se quiser trocar o PC te faço preço', 'Tua live ontem travou um pouco, quer que eu dê uma olhada no PC?', 'Vi um corte teu no TikTok, kkkkk'],
    partner: ['Tô com saudade. A gente se vê hoje?', 'Pensando em você', 'Você tá trabalhando demais, sabia?', 'Bora sair esse fim de semana?'],
    crush: ['Oi! Foi bom conversar com você aquele dia.', 'Vi seu canal, muito legal!', 'Tá fazendo o quê de bom?'],
  };
  T.creatorMsgs = {
    collab: ['E aí! Curti teu conteúdo. Bora fazer uma live juntos?', 'Vi tua live, muito boa. Topa uma collab?', 'Tenho uma ideia de vídeo que combina com teu canal. Bora?'],
    congrats: ['Parabéns pelo crescimento! Merecido.', 'Vi que teu vídeo bombou, parabéns!', 'Que live boa ontem, parabéns!'],
    advice: ['Dica de quem já passou por isso: não liga pros haters.', 'Investe num microfone bom, faz toda diferença.', 'Consistência é tudo. Mantém o horário das lives.'],
    criticism: ['Achei meio desnecessário o que você falou sobre mim...', 'Cara, vi o que você postou. Não precisava.'],
    thanks: ['Valeu pela raid! A galera chegou animada.', 'Obrigado pela força ontem!'],
  };
})(window.SL);

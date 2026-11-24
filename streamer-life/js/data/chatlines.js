/* Falas do chat. Prefixo de tom: h = empolgação, z = zoeira, c = crítica, t = técnico, q = pergunta, n = neutro.
   Marcadores: {kk} risada no estilo da pessoa, {s} nome do streamer, {g} jogo, {p} placar/estado, {u} pessoa citada,
   {n} número, {m} momento lembrado, {cat} categoria, {canal}, {via} por onde chegou, :emote: rostinho desenhado. */
'use strict';
(function (SL) {
  const C = SL.D.chat = {};

  // ---------- Chegada ----------
  C.greet_first = [
    'n|Salve! Primeira vez aqui.', 'n|opa, boa noite! primeira vez no canal', 'n|caí aqui pela categoria de {cat}', 'n|cheguei pelo {via}, bora ver',
    'n|eae {s}, nunca tinha visto teu canal', 'h|que live bonita, primeira vez aqui :hype:', 'q|é a primeira vez que vejo, você sempre faz live?',
    'n|oi oi, vim conhecer', 'z|caí aqui de paraquedas {kk}', 'n|primeira vez, gostei da vibe', 'q|primeira vez aqui, de onde você é?',
    'n|chegando agora, primeira live que eu pego', 't|vim ver se você joga bem mesmo', 'n|boa! achei o canal pelo {via}',
  ];
  C.greet_return = {
    2: ['n|Voltei! Hoje tem live de novo?', 'n|voltei {s} {kk}', 'h|opa, de novo aqui! curti a última', 'n|eae, lembra de mim? vim ontem', 'n|voltei pra ver mais {g}', 'z|não consegui ficar longe {kk}'],
    4: ['n|já tá virando costume vir aqui', 'h|salve salve, presente de novo :coracao:', 'n|boa noite {s}! chegou a hora da live', 'n|mais um dia, mais uma live', 'z|minha rotina agora é trabalhar e ver live {kk}'],
    8: ['z|Já virei presença confirmada aqui {kk}', 'h|chamada: PRESENTE :hype:', 'n|nem preciso de notificação, já sei o horário', 'h|a família chegou! boa live {s}', 'n|cheguei, pode começar a live agora {kk}'],
    20: ['h|veterano na área :coracao:', 'n|quantas lives já foram? eu vi quase todas', 'h|desde o começo aqui, orgulho de ver o canal crescer', 'n|mais uma live, mais uma presença confirmada', 'z|já devia ganhar salário de tanto que venho {kk}'],
  };
  C.greet_absence = ['n|sumi mas voltei! saudade dessa live', 'n|faz tempo que não apareço, a vida tá corrida', 'n|voltei depois de um tempão, o canal tá diferente', 'h|olha quem voltou! saudade {s}'];
  C.greet_late = ['q|cheguei agora, perdi muito?', 'q|o que rolou até agora?', 'n|atrasado mas cheguei', 'q|quanto tempo de live já?', 'n|saí do trabalho e vim direto pra cá'];
  C.greet_friend = ['h|VAI {s}!! orgulho demais de você', 'h|olha só, fazendo live! tô aqui torcendo', 'z|cheguei pra dar moral pro canal {kk}', 'h|todo mundo segue o canal aí, é meu amigo!'];
  C.greet_mom = ['n|Oi filho(a), estou assistindo! Como faço pra comentar?', 'n|Que lindo te ver aí! Já comeu hoje?', 'n|Mandei o link pras minhas amigas da costura', 'n|Estou orgulhosa de você. Vai dormir cedo hoje, viu?'];

  // ---------- Conversa geral (sem acontecimento específico) ----------
  C.chatter = [
    'n|boa live', 'n|que vibe boa hoje', 'n|alguém mais tá vendo do trabalho? {kk}', 'n|acabei de chegar em casa, que dia', 'n|tô jantando e vendo a live',
    'n|essa hora é a melhor pra ver live', 'z|chat, quem aqui também devia estar dormindo? {kk}', 'n|aqui tá chovendo muito', 'n|alguém de Minas aí?', 'n|alguém do Nordeste?',
    'n|que calor hoje, misericórdia', 'h|amo esse canal :coracao:', 'n|chat tá animado hoje', 'z|o {s} hoje tá inspirado(a) {kk}', 'n|boa noite pra quem chegou agora',
    'n|tava precisando de uma live assim', 'n|daqui a pouco tenho que sair mas vou ficar mais um pouco', 'h|bora chat, energia!', 'n|que horas termina a live?', 'n|só passando pra dar oi',
    't|essa categoria tá crescendo muito', 'n|gosto quando você conversa com o chat', 'z|eu devia estar estudando agora {kk}', 'n|essa música de fundo é boa', 'n|alguém me indica um jogo bom?',
  ];
  C.chatter_cat = {
    conversa: ['n|que papo bom hoje', 'q|e aí, como foi teu dia?', 'n|eu concordo com o que você falou', 'z|o chat virou terapia em grupo {kk}', 'n|adoro live de conversa, parece que tô com amigos', 'q|qual teu maior sonho?'],
    react: ['z|esse vídeo é muito ruim {kk}', 'q|coloca aquele vídeo do gato depois!', 'n|tua reação é melhor que o vídeo', 'z|já vi esse, a parte final é a melhor {kk}', 'n|manda mais vídeo assim'],
    fazenda: ['n|que live relaxante', 'n|essa música do jogo me dá sono bom', 'q|vai plantar o quê agora?', 'n|amo jogo de fazenda', 'z|o fazendeiro mais dedicado do Brasil {kk}'],
    xadrez: ['t|essa abertura é boa', 'q|qual teu rating?', 't|cuidado com o cavalo dele', 'n|aprendo muito vendo você jogar', 't|eu teria trocado as damas ali'],
  };

  // ---------- Reações a momentos do jogo (por tipo de momento) ----------
  C.m = {
    // futebol
    chance: ['h|VAI CHUTAAAAR!', 'h|chuta, chuta, chuta!', 'h|vai que é tua!', 't|toca pro lado, tá livre!', 'h|É AGORAAA'],
    gol: ['h|GOOOOOOL :hype:', 'h|MDS ELE FEZ O GOL', 'h|QUE GOLAÇO', 'h|gol gol gol :fogo:', 'z|o goleiro foi buscar pão {kk}', 't|bela finalização, cruzada no ângulo', 'c|até que enfim um gol né', 'h|GOL!! :gg:'],
    gol_sofrido: ['c|que defesa horrível', 'z|o goleiro tava de chinelo {kk}', 't|a zaga dormiu nessa', 'c|tomou gol bobo', 'n|eita, empatou o jogo', 'z|pode desligar o controle {kk}', ':f:'],
    perdeu: ['z|{kk} perdeu esse gol', 'z|como que perde ESSE gol {kk}', 'c|era só empurrar pra dentro', 'h|NÃÃÃO quase', 't|tinha que ter chutado de chapa', 'z|minha avó fazia esse {kk}'],
    defesa: ['t|esse goleiro é muito apelão', 'h|QUE DEFESA', 'z|o goleiro deles é um muro {kk}', 'n|uff, salvou', 'c|chutou no meio do goleiro'],
    cartao: ['c|juiz ladrão', 'z|carrinho criminoso {kk}', 'n|cartão merecido', 'c|nem foi falta isso'],
    penalti: ['h|PÊNALTI! bate no canto', 'q|quem vai bater?', 'h|não erra, não erra', 't|bate no alto que não tem erro'],
    golaco: ['h|QUE GOLAÇO!!! :fogo: :fogo:', 'h|ISSO VAI VIRAR CORTE', 'h|gol de placa mesmo :hype:', 'h|CLIPA ISSO CHAT', 't|que domínio antes do chute, absurdo'],
    frango: ['z|FRANGO {kk} :riso:', 'z|o goleiro pegou e soltou {kk}', 'z|que frangaço, socorro {kk}', 'c|isso foi bizarro'],
    fim_vit: ['h|VITÓRIA :gg:', 'h|ganhamos! bora mais uma', 'n|gg, jogou bem', 'h|que jogo bom :palmas:'],
    fim_der: ['n|gg, faz parte', 'c|perdeu pro time pior', 'z|desliga o videogame {kk}', 'n|bora a próxima, revanche', ':f:'],
    fim_emp: ['n|empate justo', 'c|ficou devendo', 'n|bora outra'],
    inicio: ['h|começou! bora', 'q|qual time você é?', 'n|bom jogo', 'q|é ranqueada?'],
    // battle royale
    pouso: ['q|vai cair onde?', 't|cai na cidade grande que tem loot', 'h|bora que bora', 'z|cai no meio do nada de novo {kk}'],
    kill: ['h|DERRUBOU :hype:', 'h|boaaa', 't|bela mira', 'h|mais um!', 'z|mandou pro lobby {kk}', 't|headshot limpo'],
    multikill: ['h|TRIPLA!!! :fogo:', 'h|ESSE É O CARA', 'h|monstro demais', 'h|CLIPA ISSO', 't|que reflexo absurdo'],
    morte: ['z|morreu {kk}', ':f:', 'c|que jogada ruim', 't|se tivesse ficado no prédio não morria', 'z|o inimigo nem viu você {kk}', 'n|azar, próxima'],
    morte_boba: ['z|caiu do prédio {kk} :riso:', 'z|morreu sozinho {kk}', 'z|ISSO VAI VIRAR MEME {kk}', 'c|como que morre assim'],
    clutch: ['h|QUE CLUTCH :fogo:', 'h|1 contra 3 e venceu, ABSURDO', 'h|O REI DO CLUTCH', 't|jogou muito com a vida baixa'],
    vitoria: ['h|VITÓRIA!!! :gg: :gg:', 'h|GANHOUUU', 'h|TOP 1 :hype:', 'h|que partida, mano', 'n|merecido demais'],
    top10: ['h|top 10, bora!', 'n|tá ficando tenso', 'h|dá pra ganhar essa'],
    zona: ['t|cuidado com a zona', 'n|a zona tá fechando', 't|corre pro centro'],
    loot: ['h|loot lendário :hype:', 'n|boa arma', 't|pega a mira de 4x'],
    // terror
    jumpscare: ['z|PULEI DA CADEIRA {kk}', 'z|o grito {kk} :riso:', 'h|AAAAAAAAA', 'z|tá com medinho? {kk}', ':susto: :susto:', 'z|esse susto vai virar corte {kk}'],
    susto_falso: ['z|era só um gato {kk}', 'n|que tensão', 'z|morreu de medo de nada {kk}'],
    puzzle: ['t|a senha tava no quadro', 'h|boa, resolveu!', 't|era o número da parede', 'n|inteligente'],
    perseguicao: ['h|CORREEEE', 'h|ele tá atrás de você!', 't|vira à esquerda!', 'z|corre igual eu na hora de pagar boleto {kk}'],
    capitulo: ['h|capítulo novo!', 'n|tá ficando bom', 'q|falta muito pra zerar?'],
    // corrida
    ultrapassagem: ['h|QUE ULTRAPASSAGEM', 'h|passou por fora!', 't|freou na hora certa', 'h|bora pro pódio'],
    batida: ['z|bateu no muro {kk}', 'z|o carro virou sanfona {kk}', 'c|freou tarde demais', ':f:'],
    volta_rapida: ['h|volta mais rápida! :fogo:', 't|traçado perfeito'],
    vitoria_corrida: ['h|PRIMEIRO LUGAR :gg:', 'h|campeão!', 'h|que corrida linda'],
    podio: ['n|pódio, boa!', 'h|bora melhorar mais'],
    // moba
    abate: ['h|pegou o abate!', 't|bom posicionamento', 'h|amassou'],
    team_win: ['h|TEAMFIGHT GANHA', 'h|que luta!', 't|a habilidade final foi perfeita'],
    team_lose: ['c|entrou sozinho na luta', 't|tinha que esperar o time', 'z|o time inteiro dormiu {kk}'],
    troll_aliado: ['z|o aliado tá trollando {kk}', 'c|esse teu time é ruim demais', 'z|reporta esse cara {kk}'],
    objetivo: ['h|pegou o dragão!', 't|bom controle de mapa'],
    // sandbox
    construcao: ['n|ficando bonita a casa', 'q|vai fazer o quê agora?', 't|coloca vidro na janela', 'h|a base tá ficando top'],
    diamante: ['h|DIAMANTE :hype:', 'h|ACHOU DIAMANTE!', 'z|agora fica rico {kk}'],
    explosao: ['z|EXPLODIU TUDO {kk} :riso:', 'z|lá se vai a casa {kk}', ':f:', 'z|o bicho verde de novo {kk}'],
    projeto: ['h|FICOU INCRÍVEL :palmas:', 'h|que construção linda', 'n|valeu a pena o esforço'],
    // luta
    combo: ['h|QUE COMBO', 'h|tirou metade da vida', 't|cancelou o golpe certinho'],
    perfect: ['h|PERFECT :fogo:', 'h|nem tomou dano', 'h|humilhou'],
    round_win: ['h|round ganho', 'n|boa'], round_lose: ['c|apertou botão demais', 't|tinha que defender baixo', 'z|levou uma surra {kk}'],
    rage: ['z|tá bravo(a) {kk}', 'z|calma, respira {kk}', 'z|a mesa tá em perigo {kk}'],
    // xadrez
    sacrificio: ['t|sacrifício de dama?!', 'h|QUE JOGADA', 't|lance brilhante', 'q|por que entregou a peça?'],
    erro_xadrez: ['t|perdeu a torre', 'c|esse lance foi muito ruim', 'z|o cavalo fugiu do tabuleiro {kk}', 't|tinha mate em dois ali'],
    xeque_mate: ['h|XEQUE-MATE :gg:', 'h|que final', 't|bela rede de mate'],
    // fazenda
    colheita: ['h|colheita gigante!', 'n|que bonita a plantação', 'n|que live gostosa de ver'],
    festival: ['h|festival! :coracao:', 'n|que fofo esse evento', 'q|vai ganhar o concurso?'],
    animal: ['h|que vaquinha fofa', 'q|qual nome vai dar?', 'z|coloca o nome de {u} {kk}'],
    // rpg
    chefe: ['h|CHEFE! bora', 't|cuidado com o ataque de área', 'n|tensão'],
    chefe_ok: ['h|DERROTOU O CHEFE :gg:', 'h|que luta épica', 'h|CLIPA ESSA'],
    cena: ['n|que história linda', ':chora: :chora:', 'n|chorei nessa parte', 'n|esse jogo é arte'],
    level: ['h|subiu de nível!', 't|coloca ponto em força'],
    // retrô
    run: ['h|bora mais uma tentativa', 'q|qual o recorde?', 't|a parte difícil é o castelo'],
    split_bom: ['h|tá no ritmo do recorde!', 't|split verde :hype:', 'h|vai dar!'],
    erro_bobo: ['z|caiu no primeiro buraco {kk}', 'z|reset {kk}', ':f:', 'z|o pulo mais difícil do jogo {kk}'],
    recorde: ['h|RECORDE PESSOAL :gg: :gg:', 'h|CONSEGUIU!!!', 'h|HISTÓRICO'],
    // conversa e react
    historia: ['z|{kk} não acredito nisso', 'h|conta mais!', 'z|essa história é muito boa {kk}', 'n|aconteceu igual comigo'],
    historia_ruim: ['n|hmm', 'c|não entendi a graça', 'n|ok...'],
    desabafo: ['n|força, você consegue :coracao:', 'n|tamo junto', 'n|obrigado por compartilhar isso', 'n|isso é muito real'],
    video_engracado: ['z|{kk} :riso:', 'z|NÃO {kk}', 'z|o cachorro {kk}', 'z|morri {kk}'],
    video_triste: [':chora:', 'n|que triste', 'n|não chora não'],
    video_absurdo: ['z|isso é real??', 'z|a internet não tem limite {kk}', 'c|que vídeo bizarro'],
    // genéricos
    bug: ['z|o jogo bugou {kk}', 'z|o personagem tá voando {kk}', 'c|esse jogo é cheio de bug', 'z|feature, não bug {kk}'],
    win: ['h|VITÓRIA :gg:', 'h|isso!', 'h|bora!'],
    lose: [':f:', 'n|gg', 'c|ficou devendo', 'n|próxima é nossa'],
    epic: ['h|QUE MOMENTO :fogo: :fogo:', 'h|CLIPA ISSO CHAT', 'h|ISSO FOI SURREAL', 'h|NÃO ACREDITO'],
    funny: ['z|{kk} :riso:', 'z|CHORANDO DE RIR {kk}', 'z|isso vai virar meme {kk}', 'z|alguém clipou?? {kk}'],
  };

  // ---------- Perguntas para o streamer (o jogador pode responder) ----------
  C.q = {
    contexto: ['qual o placar?', 'que jogo é esse?', 'faz quanto tempo de live?', 'o que tá acontecendo?', 'tá ganhando?'],
    agenda: ['vai ter live amanhã?', 'qual o horário das lives?', 'amanhã tem live de novo?', 'você faz live todo dia?'],
    setup: ['qual teu setup?', 'qual microfone você usa?', 'que pc é esse?', 'qual tua webcam?'],
    idade: ['quantos anos você tem?', 'você é de qual ano?'],
    origem: ['de onde você é?', 'você mora em qual cidade?'],
    jogo_fav: ['qual teu jogo favorito?', 'qual o melhor jogo que você já jogou?'],
    inscritos: ['joga com inscrito?', 'bora jogar com o chat um dia?', 'faz live com os seguidores!'],
    dica: ['alguma dica pra quem tá começando?', 'como você começou?', 'vale a pena ser streamer?'],
    pedido: ['joga {og} depois?', 'faz live de {og}!', 'volta a jogar {og}!'],
    opiniao: ['o que acha do {cr}?', 'você conhece o {cr}?', 'já viu a polêmica do {cr}?'],
    pessoal: ['tá namorando?', 'o que você faz além de live?', 'você trabalha com o quê?'],
    musica: ['qual a música de fundo?', 'que música é essa?'],
  };

  // ---------- Elogios, críticas, pedidos de atenção ----------
  C.compliment = ['h|live muito boa', 'n|gosto muito do teu jeito de falar', 'h|teu canal merecia muito mais gente :coracao:', 'n|melhor live que eu vejo', 'n|você é muito gente boa', 'h|o canal tá evoluindo demais', 'n|teu áudio tá ótimo hoje', 'n|adoro o clima dessa live', 'h|tô viciado(a) nas tuas lives', 'n|você responde todo mundo, isso é raro'];
  C.compliment_setup = ['n|a câmera nova ficou top', 'n|o som melhorou muito', 't|o setup tá ficando profissional', 'n|essa luz ficou bonita'];
  C.crit = {
    audio: ['c|áudio tá estourando', 'c|não dá pra entender o que você fala', 'c|o microfone tá chiando', 'c|abaixa o jogo, tua voz some', 'q|sem áudio??'],
    lag: ['c|tá travando muito', 'c|a live tá engasgando', 'c|o pc não aguenta esse jogo né', 'c|travou de novo', 'q|só pra mim tá travando?'],
    video: ['c|a câmera tá muito escura', 'c|webcam pixelada demais', 'c|qualidade baixa, parece batata', 't|baixa a resolução que trava menos'],
    silencio: ['c|tá muito quieto hoje', 'c|fala com o chat!', 'q|tá vivo(a)? {kk}', 'c|live sem conversa é difícil', 'c|ninguém responde aqui...'],
    repetitivo: ['c|esse jogo de novo?', 'c|muda de jogo, por favor', 'c|tá ficando repetitivo', 'c|todo dia a mesma coisa'],
    clickbait: ['c|cadê o que tava no título?', 'c|título enganoso hein', 'c|caí no clickbait {kk}'],
    gameplay: ['c|joga muito mal {kk}', 't|tá errando muito o básico', 'c|meu irmão de 10 anos joga melhor', 't|precisa treinar mais a mira'],
    anuncio: ['c|muito anúncio', 'c|mais propaganda?', 'c|essa live virou comercial'],
    cansado: ['n|você parece cansado(a) hoje', 'q|dormiu bem?', 'n|vai descansar depois, hein'],
  };
  C.attention = ['n|{s} lê meu comentário!', 'n|me dá um oi {kk}', 'n|responde aí {s}', 'n|ninguém me vê aqui {kk}'];
  C.leave = ['n|vou dormir, falou! boa live', 'n|tenho que ir, até a próxima', 'n|tchau chat, amanhã tô aqui', 'n|boa live! fui', 'n|acabou meu intervalo, tchau', 'n|vou jantar, depois volto'];
  C.leave_bored = ['c|tá parado demais, vou ver outra live', 'c|fui, tá chato hoje', 'n|vou nessa'];

  // ---------- Memória (falas que lembram de algo que aconteceu antes) ----------
  C.mem = {
    replied: ['n|da última vez você me respondeu, fiquei feliz {kk}', 'n|você lembra de mim? você respondeu minha pergunta outro dia', 'h|o(a) {s} sempre responde a gente :coracao:'],
    ignored: ['c|você nunca responde minhas perguntas né', 'n|perguntei de novo e nada {kk}', 'c|acho que você não lê o chat'],
    donated: ['n|mais um pix pro mestre {kk}', 'n|lembra da minha doação? continuo apoiando', 'h|sempre que der vou apoiar o canal'],
    moment: ['z|lembra quando {m}? {kk}', 'z|nunca vou esquecer {m} {kk}', 'h|aquele dia que {m} foi histórico', 'n|eu tava aqui quando {m}'],
    game: ['n|hoje não vai ter {og}?', 'n|saudade das lives de {og}', 'n|curti mais quando você jogava {og}', 'q|volta pro {og} um dia?'],
    promise_ok: ['h|cumpriu a promessa da live, respeito :palmas:', 'n|você falou que ia ter live e teve, gosto disso'],
    promise_broken: ['c|e aquela live que você prometeu?', 'c|você disse que ia ter live e sumiu', 'c|prometeu e não cumpriu hein'],
    fight: ['c|ainda tô bolado(a) com aquela discussão', 'n|depois daquela treta eu quase parei de vir'],
    growth: ['h|lembro quando tinha {n} pessoas aqui, olha agora!', 'h|vi o canal crescer, que orgulho', 'n|o canal cresceu muito, parabéns'],
    changed: ['n|o canal mudou bastante', 'c|saudade de quando era mais simples', 'n|gosto da fase nova do canal'],
    sub: ['h|{n} meses de inscrição :coracao:', 'n|renovei a inscrição!'],
  };

  // ---------- Troll e discussões ----------
  C.troll = ['c|esse canal é muito fraco', 'c|chat morto {kk}', 'c|por que alguém assiste isso?', 'c|desiste de ser streamer', 'z|quem segue esse canal? {kk}', 'c|esse jogo é lixo', 'c|vi lives melhores com 0 pessoas', 'z|{s} você é uma piada {kk}', 'c|unfollow', 'c|alguém me explica a graça disso'];
  C.defend = ['n|@{u} vai embora então', 'n|@{u} respeita o canal', 'n|@{u} ninguém te obrigou a ficar', 'n|ignorem o @{u}', 'n|bane esse @{u}', 'z|@{u} vai procurar o que fazer {kk}'];
  C.argue = ['c|@{u} você não entende nada', 'c|@{u} tá errado(a)', 't|@{u} não é assim que funciona', 'z|@{u} que opinião ruim {kk}', 'c|@{u} fala sério'];
  C.answer_other = ['n|@{u} {p}', 'n|@{u} tá {p}', 'n|@{u} acho que {p}'];
  C.reply_other = ['n|@{u} verdade', 'z|@{u} {kk}', 'n|@{u} pensei a mesma coisa', 'n|@{u} concordo', 'n|@{u} boa', 'z|@{u} não viaja {kk}'];
  C.welcome_other = ['n|@{u} bem-vindo(a)!', 'h|@{u} chega mais', 'n|@{u} a live é boa, fica aí'];

  // ---------- Reações às ações do streamer ----------
  C.react = {
    joke_ok: ['z|{kk} :riso:', 'z|{kk} essa foi boa', 'z|PARA {kk}', 'z|o(a) {s} é muito engraçado(a) {kk}', 'z|chorando {kk}'],
    joke_bad: ['n|...', 'c|piada ruim {kk}', 'z|essa doeu {kk}', 'n|grilos', 'z|risada de consideração: {kk}'],
    talk_ok: ['n|verdade', 'n|faz sentido', 'h|adoro quando você conversa', 'n|concordo totalmente', 'q|e depois?'],
    thanks: ['h|que fofo agradecendo todo mundo :coracao:', 'n|você é muito atencioso(a)', 'h|merecido!'],
    poll: ['n|votei!', 'n|vota todo mundo', 'h|a opção {p} é óbvia', 'n|difícil escolher'],
    challenge: ['h|DUVIDO', 'h|vai conseguir!', 'z|vai dar errado {kk}', 'h|bora desafio!', 'n|tá valendo'],
    challenge_ok: ['h|CONSEGUIU O DESAFIO :gg:', 'h|LENDA', 'h|eu sabia!!'],
    challenge_fail: ['z|não conseguiu {kk}', ':f:', 'n|quase! tenta de novo'],
    momento_ok: ['h|QUE JOGADA :gg:', 'h|INSANO', 'h|clipa isso!!', 'h|MONSTRO', 'h|eu não acredito :nossa:', 'h|isso vai pro TikTok'],
    momento_fail: ['z|deu ruim {kk}', 'z|KKKKKKKKKK', 'n|faz parte', 'z|clipa isso kkk', 'n|quase!', 'z|vergonha alheia {kk}'],
    momento_safe: ['n|jogou com a cabeça', 'n|prudente', 'q|ué, não vai arriscar?', 'n|melhor assim'],
    pause_back: ['n|voltou!', 'h|bem-vindo(a) de volta', 'n|demorou hein {kk}'],
    ausente: ['q|cadê você?', 'n|ainda tá aí?', 'z|foi buscar um lanche {kk}', 'n|tô esperando aqui', 'c|live parada hein', 'q|volta logo!', 'n|a cadeira vazia tá ótima {kk}'],
    game_change: ['h|boa, adoro {g}', 'c|preferia o outro jogo', 'q|por que trocou?', 'n|bora de {g}'],
    sponsor: ['n|propaganda né {kk}', 'n|já uso esse produto', 'c|lá vem publi', 'q|tem cupom?'],
    ad: ['c|anúncio de novo...', 'n|tranquilo, apoio o canal vendo anúncio', 'z|hora do lanche {kk}'],
    ban: ['h|BANIDO :palmas:', 'n|já foi tarde', 'h|isso, moderação firme', 'z|tchau {kk}'],
    ban_unfair: ['c|baniu só porque criticou?', 'c|não precisava banir', 'c|censura isso hein'],
    reply_got: ['h|ELE(A) ME RESPONDEU :coracao:', 'n|valeu por responder!', 'h|ganhei o dia', 'n|obrigado(a) {s}!'],
    welcome_got: ['h|obrigado(a) pelo boas-vindas!', 'n|valeu! vou ficar', 'n|que recepção boa'],
    risky_ok: ['h|QUE JOGADA ARRISCADA :fogo:', 'h|deu certo!!', 'h|coragem demais'],
    risky_fail: ['z|não deu {kk}', 'c|era melhor ter ido seguro', ':f:'],
    focus: ['n|modo concentração ativado', 'z|ficou sério(a) {kk}'],
    read: ['n|leu meu comentário!', 'h|que honra'],
    mic_fix: ['n|voltou o áudio!', 'n|agora sim, dá pra ouvir'],
    net_fix: ['n|parou de travar', 'n|agora tá liso'],
  };

  // ---------- Doações ----------
  C.donation = ['pelo gol!', 'pra comprar um microfone novo', 'lê minha mensagem!', 'pela live de hoje', 'pra ajudar o canal crescer', 'manda um abraço pra {u}', 'pela jogada absurda', 'vai dormir depois da live hein', 'pelo café da manhã de amanhã', 'continue assim!', 'pela risada que eu dei', 'compra uma cadeira melhor', 'meu primeiro apoio!', 'hoje é meu aniversário, só queria um parabéns', '', '', ''];
  C.donation_big = ['Seu conteúdo me ajudou num momento difícil. Obrigado de verdade.', 'Pra investir no canal. Você vai longe!', 'Apoio de fã desde o começo. Bora pro topo!', 'Compra aquele PC novo que você falou!'];

  // ---------- Moderador ----------
  C.mod = ['calma aí pessoal, respeito no chat', 'sem ofensa, galera', 'quem continuar provocando vai ser silenciado', 'chat, foco na live', 'regras no painel do canal'];
  C.bot = ['Siga o canal para não perder as próximas lives!', 'Tem Instagram? Segue lá: @{canal}', 'Respeite todos no chat. Mensagens ofensivas serão removidas.'];

  // ---------- Celebridade e raid ----------
  C.celeb = ['h|MEU DEUS O {u} TÁ AQUI', 'h|É O {u} MESMO??', 'h|{u} NA LIVE :hype: :hype:', 'n|olha quem chegou: {u}', 'q|{u} é você mesmo?', 'h|print print print'];
  C.raid = ['h|viemos da live do {u}!', 'h|RAID DO {u} :hype:', 'n|o {u} mandou a gente aqui', 'h|salve, galera do {u} chegando'];
  C.viral = ['n|vim do vídeo que tá bombando', 'h|o vídeo viralizou! vim por ele', 'n|vi o corte no TikTok e vim'];
})(window.SL);

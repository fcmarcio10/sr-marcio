# Roteiro das vozes — BR Night Drive

Gere cada fala no ElevenLabs (modelo **Eleven v4**, que entende as marcações entre colchetes).
Baixe em **MP3** e salve com **exatamente o nome do arquivo** da tabela. Depois é só me mandar os arquivos.

Todas as vozes desta lista já estão no jogo (as dos personagens, as dos sotaques, as de cliente feliz e as da rádio foram geradas no plano pago).

Os áudios dos passageiros chegam no **chat do PegaAí**. Os dos personagens (Seu Zé, Seu Biu, Banestresse) chegam no **WhatsApp**.

## Passageiros (PegaAí)

| Arquivo | Voz sugerida | Texto |
|---|---|---|
| `p_bicho.mp3` | Marcio Brasil Brasileiro | [bravo] Ô bicho, que corrida foi essa? Quase quebrei o joelho no banco da frente! Vou dar uma estrela e olhe lá, mermão! |
| `p_ahla.mp3` | Bianca - Quirky and Animated | [indignada] Ai, meu Deus! Bateu de novo! Tô passando mal demais nesse carro. Me deixa aqui que eu vou a pé! |
| `p_moqueca.mp3` | Thiago - Warm and inviting | [irritado] Rapá, tu pegou todo buraco de São Gambiarra. Minha moqueca chegou virada dentro da panela. Era o almoço de domingo da família, e agora virou sopa! |
| `p_tartaruga.mp3` | Lucinda - Earthy and Wise | [impaciente] Ô meu querido, eu pedi um carro e chegou uma tartaruga! Já dava pra ter ido de canoa pelo Rio Jururu. Que isso, bicho! |
| `p_sofa.mp3` | Eduardo Norte do Paraná | [revoltado] Meu sofá chegou com mais buraco que a BR depois da chuva! Rasgou tudo, mermão! Um prejuízo daqueles! |
| `p_aviao.mp3` | Bianca - Quirky and Animated | [sarcástica] O avião foi embora e eu fiquei aqui olhando pro céu igual boba. Valeu, piloto de fogão! |
| `p_vip2.mp3` | Nick Storyteller Prime | [esnobe] Olha, eu moro na parte chique de Camburiso, tá? Lá ninguém anda nesse sacolejo. Que experiência mais cafona, bicho. |
| `p_uai.mp3` | Anderson - Sotaque Mineiro | [indignado] Uai, sô! Cê bateu esse trem três vezes e ainda quer cinco estrelas? Nem minha vó dirige assim, uai! Uma estrela, e olhe lá! |
| `p_bah.mp3` | Gaucha SouthOfBrazil | [indignada] Bah, tchê! Que barbaridade de corrida! Quase derramei o chimarrão inteiro no colo. Uma estrela pra ti, e olhe lá! |
| `p_oxe.mp3` | Lucinda - Earthy and Wise | [irritada] Oxente, meu filho! Tu acha que eu sou saco de cimento, é? Nunca vi barbeiragem desse tamanho, visse? Uma estrela, e já é muito! |
| `p_meu.mp3` | Felipe Leão | [impaciente] Meu, que rolê demorado! Mais lento que avenida às seis da tarde em dia de chuva. Uma estrela pra você, mano. Sem ressentimento, tá? |
| `p_caraca.mp3` | Phelipe Carioca | [revoltado] Caraca, mermão! Minha televisão chegou parecendo arte moderna! Agora vou ter que assistir novela em formato de sanfona! |
| `p_egua.mp3` | Bianca - Quirky and Animated | [irônica] Égua, mana! Demorou tanto que deu tempo de tomar um açaí, fazer uma tapioca e ainda lavar a louça! Uma estrela, e é de presente! |

### Cliente feliz (corrida de 5 estrelas, quase metade das vezes)

| Arquivo | Voz | Texto |
|---|---|---|
| `p_top1.mp3` | Dani | [feliz] Motorista nota mil! Chegou rapidinho, carro cheiroso e ainda tava tocando a Rádio Gambiarra. Cinco estrelas e um beijo! |
| `p_top2.mp3` | Anderson - Sotaque Mineiro | [satisfeito] Ô trem bão, sô! Corrida macia que nem pão de queijo quentinho. Cinco estrelas procê, viu? Deus te abençoe! |
| `p_top3.mp3` | Felipe Leão | [empolgado] Aí sim, mano! Dirigiu igual piloto de Fórmula 1, mas sem bater em nada! Cinco estrelas, e ainda vou te dar gorjeta! |

## Personagens do jogo

| Arquivo | Personagem | Voz sugerida | Texto |
|---|---|---|---|
| `ze_nao.mp3` | Seu Zé (oficina) | Sergio Funny | [suspira] Rapá, de novo? Ainda tem fiado pendurado aqui! Fiado é igual sogra: uma vez a gente aguenta, duas já é abuso. Acerta comigo que eu vou voando! |
| `biu_socorro.mp3` | Seu Biu (bananas) | Thiago - Warm and inviting | [desesperado] Ô meu patrão, a carreta tombou! Tá banana pra todo lado, parece feira depois de terremoto! Me ajuda aqui, pelo amor de Deus, que eu pago cada caixa! |
| `boas_vindas.mp3` | Seu Zé (boas-vindas, 1ª vez no jogo) | Sergio Funny | [animado, acolhedor] Ô meu filho, seja bem-vindo a São Gambiarra! Aqui é o Seu Zé, da oficina. Pegou a chave do carro? Então bora rodar: corrida no PegaAí, frete, e foge dos buracos, que aqui tem mais buraco que queijo suíço. [ri] Bateu? Vem na oficina que eu ajeito. Vai com Deus, e devagar, viu? |
| `banco_atraso.mp3` | Banestresse (robô do banco) | Lucinda - Earthy and Wise | [voz de atendente eletrônica, calma demais] Olá. Aqui é a assistente virtual do Banestresse. Identificamos uma parcela em atraso. Os juros já estão trabalhando por você. Tenha uma ótima noite. |

## Rádio Gambiarra FM 171,1 (DJ Biruta)

Voz: **Eddy Miller** (locutor). Projeto do ElevenLabs "BR Night Drive - Rádio Gambiarra FM e passageiros novos" (também tem as falas com sotaque e de cliente feliz). Os textos ficam em `RADIO` (`src/p66_career.js`); a legenda na tela mostra uma frase por vez.

| Arquivo | Quadro | Texto |
|---|---|---|
| `radio_01.mp3` | Abertura (sempre a primeira) | Alôôô, motorista da madrugada! Tá ligado na Rádio Gambiarra FM, cento e setenta e um vírgula um: a rádio que não te engana... muito! Aqui é o DJ Biruta, e a noite é nossa! |
| `radio_02.mp3` | Previsão do tempo | Céu nublado, noventa por cento de chance de chuva e cem por cento de chance de buraco na pista! |
| `radio_03.mp3` | Plantão do futebol | O Vasco ligou querendo ser vice também no concurso de piadas. Vice também sobe no pódio... ali do ladinho. |
| `radio_04.mp3` | Pergunta do ouvinte | O Palmeiras tem Mundial? A ligação caiu! E um abraço pro corintiano que ainda tá pagando o estádio no carnê! |
| `radio_05.mp3` | Plantão do futebol | Cheirinho de título do Flamengo... é o churrasquinho da esquina. O Botafogo ganhou de virada do próprio azar. |
| `radio_06.mp3` | Futebol pelo Brasil | O Galo acordou o cruzeirense; gremista e colorado dividiram um chimarrão em paz... mentira! |
| `radio_07.mp3` | Boletim do trânsito | A Ponte Nova está em obras desde 1987. Previsão de entrega: ano que vem. Que ano? |
| `radio_08.mp3` | Oferta da madrugada | Borracharia Furou, Chamou: atendimento vinte e cinco horas por dia. |
| `radio_09.mp3` | Horóscopo do motorista | Áries: cuidado com o pardal. Escorpião... freia, Escorpião! |
| `radio_10.mp3` | Você sabia? | Os buracos de São Gambiarra dão uma piscina olímpica: a mais democrática do Brasil, todo mundo cai! |
| `radio_11.mp3` | Reclame | PegaAí: o aplicativo que te pega aí... e te larga ali! |
| `radio_12.mp3` | Futebol pelo Brasil | Bahia e Vitória fizeram as pazes pra brigar pelo acarajé; o são-paulino ligou dizendo que é soberano... e desligou! |
| `radio_13.mp3` | Recado do Seu Zé | Quem tá devendo fiado, a caderneta tá de olho! |
| `radio_14.mp3` | Vinheta | Tocando o terror na madrugada desde... ontem! |

### Programação contínua (segunda leva)

Projeto do ElevenLabs "BR Night Drive - Rádio Gambiarra FM (programação contínua)". Textos completos em `RADIO` (`src/p66_career.js`).

| Arquivo | Voz | Quadro |
|---|---|---|
| `radio_15` a `radio_38` | Eddy Miller (DJ Biruta) | Oficina do Seu Zé, preço da gasolina nos postos, alerta de chuva (só com chuva), roça e fazenda imitando sotaque mineiro (`radio_18`, `radio_19` Rali da Vaca Atolada, `radio_20` Sítio Bota Fé), comerciais do PegaAí e da garagem, caminhão do gás, recado do racha, Banestresse, banana do Seu Biu na BR, Feira do Rolo, futebol (Fluminense e Santos, Vasco de novo, Remo e Paysandu, Ceará e Fortaleza), buraco Claudinho na BR, Convento da Pena e Pedra Azulejo, café no Posto Estrela Cadente, ouvinte que caiu, horóscopo 2, noite seca (só sem chuva), lava-jato, Saci pedindo carona |
| `radio_v1` a `radio_v4` | Eddy Miller | Vinhetas curtas ("Gambiarra FM! Cento e setenta e um vírgula um!", "a rádio que pega até debaixo da ponte", "DJ Biruta na área", "dá um tapa no rádio que ela volta") |
| `radio_ze` | Sergio Funny (Seu Zé) | Comercial da Oficina do Seu Zé |
| `radio_biu` | Thiago (Seu Biu) | Comercial da banana do Seu Biu |
| `radio_banco` | Lucinda (Banestresse) | Comercial do Banestresse |
| `radio_posto` | Felipe Leão | Comercial do Posto Tanque Cheio |
| `radio_pegaai` | Dani | Comercial do PegaAí |
| `radio_tonho` | Anderson (mineiro) | Ouvinte da Fazenda Muuuito Longe manda um alô pra vaca Mimosa (depois: `radio_19`) |
| `radio_gaucha` | Gaucha SouthOfBrazil | Ouvinte gaúcha (depois: `radio_06`) |
| `radio_marcao` | Phelipe Carioca | Ouvinte carioca, surfista na poça; só com chuva (depois: `radio_17`) |
| `radio_azulina` | Bianca | Ouvinte paraense azulina pede piada do Paysandu (depois: `radio_30`) |

## Observações

- Nas Configurações, o jogador escolhe **Áudio (só em português)** ou **Texto**. Em Texto, todas as mensagens de voz aparecem escritas.
- Enquanto um arquivo não existe, o celular do jogo mostra a mensagem de voz com a transcrição e lê o texto com a voz do próprio Windows.
- O plano grátis do ElevenLabs pede crédito ao ElevenLabs (já está na tela de Créditos) e **não permite uso comercial**. Para vender o jogo, as vozes precisam ser geradas num plano pago.

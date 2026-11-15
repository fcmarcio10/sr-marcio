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

## Terceira leva (músicas da rádio, passageiros, pedestres e fretes)

Projeto do ElevenLabs "BR Night Drive - Músicas da rádio, passageiros, pedestres e fretes" (modelo Eleven v4, uma tomada por fala). As 8 músicas da rádio não são do ElevenLabs: foram compostas no código (`tools/radio/musicas.py`).

### Rádio: apresentação das músicas e comentário depois

| Arquivo | Voz | Texto |
|---|---|---|
| `dj_m1.mp3` | Eddy Miller (DJ Biruta) | [radialista animado] E agora, pra arrastar o pé no asfalto: Trio Pé de Pano, com Xote do Pneu Furado! Segura o forró, motorista! |
| `dj_m2.mp3` | Eddy Miller (DJ Biruta) | [empolgado] Aumenta o grave, que lá vem MC Rebaixado, com Batidão da Lombada! Cuidado, que o escapamento raspa! |
| `dj_m3.mp3` | Eddy Miller (DJ Biruta) | [imitando sotaque mineiro, divertido] Ô sô, prepara a botina, uai! Zé Poeira e Toinho Lama, com Moda da Vaca Atolada, direto da roça pra sua cabine! |
| `dj_m4.mp3` | Eddy Miller (DJ Biruta) | [animado] Madrugada de sexta pede o quê? Pagode! Grupo Fiado Pago, com Pagode do Pastel de Vento! |
| `dj_m5.mp3` | Eddy Miller (DJ Biruta) | [voz de locutor de filme] Pra quem tá de farol alto na BR... Os Faróis Altos, com Neon na BR! [ri] E abaixa esse farol, por favor! |
| `dj_m6.mp3` | Eddy Miller (DJ Biruta) | [dramático, exagerado] Essa vai pra quem levou uma estrela no PegaAí e tá com o coração partido: Kelvin do Arrocha, com Arrocha do Coração Rebaixado! |
| `dj_m7.mp3` | Eddy Miller (DJ Biruta) | [calmo, suave] Garoinha na janela, limpador ligado... Quarteto Garoa Fina, com Bossa da Garoa. Dirige devagar, que o chão tá liso. |
| `dj_m8.mp3` | Eddy Miller (DJ Biruta) | [gritando de alegria] Tira o pé do chão... mas não do freio! Banda Botijão, com Axé do Caminhão do Gás! |
| `dj_b1.mp3` | Eddy Miller (DJ Biruta) | [animado] Que música, hein? Pedido de ninguém, porque aqui ninguém pede nada: a gente toca o que quer! |
| `dj_b2.mp3` | Eddy Miller (DJ Biruta) | [rindo] Ê, música boa! Se você cantou junto, buzina duas vezes... na calma, que tem gente dormindo! |

### Rádio: quadros novos e ouvinte pedindo música

| Arquivo | Voz | Texto |
|---|---|---|
| `radio_39.mp3` | Eddy Miller (DJ Biruta) | [animado] Promoção da madrugada! O primeiro ouvinte que achar uma rua sem buraco em São Gambiarra ganha um pastel de vento. A promoção começou em dois mil e dez... e até agora ninguém ganhou! |
| `radio_40.mp3` | Eddy Miller (DJ Biruta) | [conselheiro] Dica do DJ: se o GPS mandar você virar à direita dentro do rio... não vira, tá? O GPS também tá cansado. É madrugada pra todo mundo! |
| `radio_41.mp3` | Eddy Miller (DJ Biruta) | [voz romântica exagerada] Correio do coração! A Kelly, do Feio Rosa, manda dizer pro Rafa que ela não esqueceu... os quarenta reais que ele pegou emprestado. [suspira] Que romântico! |
| `radio_42.mp3` | Eddy Miller (DJ Biruta) | [apresentador de quiz] Teste de conhecimento: qual a diferença entre uma lombada e um quebra-molas em São Gambiarra? [pausa] Nenhuma! Os dois quebram a sua mola! |
| `radio_43.mp3` | Eddy Miller (DJ Biruta) | [sério, fingindo ser oficial] Atenção, motorista de aplicativo: se o passageiro perguntar se falta muito, a resposta oficial é: tô virando a esquina. Mesmo que você esteja em outra cidade! |
| `radio_44.mp3` | Eddy Miller (DJ Biruta) | [apresentador de culinária] Receita do DJ: pegue um ovo, coloque no capô do carro depois de um racha... e pronto, ovo frito! Não tente isso em casa. Tente na rua mesmo! |
| `radio_45.mp3` | Eddy Miller (DJ Biruta) | [alarmado e divertido] Choveu em São Gambiarra! As poças estão tão grandes que o Seu Biu já tá vendendo banana com boia. Pisa leve, que aquaplanagem não é esporte olímpico! |
| `radio_46.mp3` | Eddy Miller (DJ Biruta) | [repórter] Recado da prefeitura: o semáforo da Avenida Brasil Sil Sil ficou amarelo por quarenta minutos porque o funcionário dormiu. Respeitem o sono do rapaz! |
| `radio_47.mp3` | Eddy Miller (DJ Biruta) | [admirado] Pedestre, se você atravessou na faixa e o carro parou... tira uma foto, que isso é raro! Motorista educado em São Gambiarra é tipo cometa! |
| `radio_thais.mp3` | Dani | [animada, ligando pra rádio] Alô, DJ Biruta? Aqui é a Thaís, de Camburiso! Toca aquele forró do pneu furado pra mim e pro meu namorado, que tá preso no trânsito da BR! |

### Passageiros (PegaAí)

| Arquivo | Voz | Texto |
|---|---|---|
| `p_pastel.mp3` | Phelipe Carioca | [revoltado] Ô, motorista! Meu pastel de vento voou pela janela na terceira batida! Agora é só vento mesmo! Uma estrela pra você, mermão! |
| `p_bolo.mp3` | Dani | [indignada, quase chorando] Moço, o bolo do aniversário da minha filha virou farofa! Era de três andares, agora é um andar só! Uma estrela, e com raiva! |
| `p_novela.mp3` | Lucinda | [impaciente] Meu filho, perdi o último capítulo da novela por causa dessa demora! Agora eu nunca vou saber quem é o pai do bebê! Uma estrela! |
| `p_galinha.mp3` | Eduardo Norte do Paraná | [bravo] Minhas galinhas chegaram tudo tonta, rapaz! Uma botou ovo mexido! Isso é frete ou montanha-russa? |
| `p_entrevista.mp3` | Davi Leão | [irônico] Mano, marquei a entrevista de emprego às dez e cheguei às onze! O cara me contratou só por pena. Uma estrela... mas obrigado pela pena! |
| `p_vip3.mp3` | Bianca - Quirky and Animated | [esnobe, ofendida] Querido, eu pedi o VIP e o ar-condicionado era a janela aberta! Meu cabelo tá parecendo ninho de passarinho. Inaceitável! |
| `p_top4.mp3` | Gaucha SouthOfBrazil | [feliz] Bah, que corrida tri legal, tchê! Chegou na hora e sem nenhum solavanco. Cinco estrelas, e o chimarrão é por minha conta! |
| `p_top5.mp3` | Marcio Brasil Brasileiro | [satisfeito] Rapá, que motorista bom! Nem senti o carro andar, achei que tava no sofá de casa! Cinco estrelas, bicho! |
| `p_top6.mp3` | Lucinda | [carinhosa] Ô meu filho, que educação! Me ajudou com as sacolas e ainda dirigiu devagarinho. Deus te pague! Cinco estrelas! |

### Pedestres

| Arquivo | Voz | Texto |
|---|---|---|
| `ped_1.mp3` | Marcio Brasil Brasileiro | [gritando, assustado] Ô, maluco! Olha por onde anda! |
| `ped_2.mp3` | Bianca - Quirky and Animated | [gritando, assustada] Ai, meu Deus! Quase me atropela! |
| `ped_3.mp3` | Lucinda | [brava, gritando] Devagar, motorista! Aqui não é autódromo! |
| `ped_4.mp3` | Phelipe Carioca | [gritando] Ê, rapá! Quer me levar junto, é? |
| `ped_5.mp3` | Thiago - Warm and inviting | [bravo, gritando] Sai da calçada, doido! Calçada é de gente! |
| `ped_6.mp3` | Dani | [indignada] Moço! A rua é ali, ó! |
| `ped_7.mp3` | Felipe Leão | [irritado] Buzina pra tua avó, rapá! |
| `ped_8.mp3` | Gaucha SouthOfBrazil | [assustada] Bah, que susto, tchê! Precisa buzinar desse jeito? |
| `ped_9.mp3` | Davi Leão | [animado, dançando] Aumenta o som, motorista! |
| `ped_10.mp3` | Dani | [empolgada] Esse paredão é bom demais! Toca mais uma! |

### Clientes de frete agradecendo (app de Fretes)

| Arquivo | Voz | Texto |
|---|---|---|
| `fr_ok1.mp3` | Thiago - Warm and inviting | [aliviado, feliz] Chegou o gás! Graças a Deus, que o feijão tava pela metade. Valeu demais, parceiro! Cinco estrelas! |
| `fr_ok2.mp3` | Lucinda | [carinhosa] Ô meu filho, chegou tudinho inteiro! Nem uma caixa amassada. Volta sempre, viu? |
| `fr_ok3.mp3` | Anderson - Sotaque Mineiro | [contente] Uai, chegou rapidim, sô! A encomenda tá perfeita. Brigado demais da conta! |
| `fr_ok4.mp3` | Gaucha SouthOfBrazil | [feliz] Bah, entrega tri rápida, tchê! Já vou te recomendar pros vizinhos! |

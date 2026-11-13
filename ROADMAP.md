# BR Night Drive — Roteiro de ideias

Objetivo: dar motivo para o jogador voltar amanhã e não enjoar rápido.

## Feito

- [x] **2. Eventos aleatórios pela cidade** (versão 1.2.0)
  - Carro quebrado pedindo ajuda
  - Noivo atrasado para o casamento
  - Carreta de banana tombada
  - Blitz da Lei Seca
  - Festa junina fechando a rua
  - Alguém pedindo carona na BR
  - Cada um dura de 1 a 3 minutos e paga um bônus.
  - Um evento por vez. Na 1.3.0 a chance caiu 60%: a cada 1,5 a 2,5 minutos (tempo real) depois do anterior, só 40% de chance de rolar um. 7 conquistas novas.
  - Carro quebrado, noivo, festa junina e carona chegam como **convite** num cartão no canto da tela (não pausa): Aceitar (Y ou clique) ou Recusar (N). Ignorar por 20 s conta como recusa. Só depois de aceitar aparece o ponto rosa e o GPS. Blitz continua só como aviso.
  - Noivo: cada um tem a sua noiva fixa e quem já casou não volta. Noivo e carro quebrado não mandam mais mensagem no WhatsApp.
  - Carreta do Seu Biu chega como mensagem no WhatsApp: aceitar manda a localização (toque marca a rota); recusar rende resposta de zoeira.
- [x] **Vida do carro** (versão 1.3.0)
  - Pneus (60 km, gastam mais derrapando), óleo (45 km, gasta mais no talo) e bateria por carro.
  - Bateria só descarrega com farol aceso e carro parado depois de 2,5 min; andando, recarrega. H liga/desliga o farol.
  - Troca na oficina (tudo), no posto (óleo) e na borracharia (pneus); Seu Zé faz chupeta e troca pneu pelo zap.
- [x] **Chuva 10% mais longa**, com pedestres de guarda-chuva e de capa de chuva.
- [x] **Banco e fiado** (versão 1.4.0)
  - Banestresse (app Carteira > Empréstimo): R$ 500, 1.000 ou 2.000 em 3x (6%), 5x (12%) ou 8x (20%). Um por vez.
  - Parcela descontada sozinha a cada virada de noite (05:00). Sem saldo: atrasa, +10% de juros por noite, e desconta assim que entrar dinheiro, com mensagem do banco.
  - Seu Zé faz fiado (socorro e oficina): cobra sozinho na virada da noite; se não der, +5% de juros. Com fiado em aberto ele não vem de novo e manda uma resposta de zoeira.

- [x] **3. Personalização do carro + garagem refeita** (versão 1.6.0)
  - Pintura, acabamento (metálico/fosco), rodas, insulfilm, adesivo no vidro traseiro, desenho no capô, neon, rebaixado (+4% aderência, faísca na lombada), paredão (tecla B, povo dança, gasta bateria parado) e aerofólio.
  - Garagem com passo a passo, "Meus carros" e "À venda", marca na cor dela com o slogan embaixo, etiquetas do que o carro faz, prévia ao vivo antes de pagar.

- [x] **Desempenho e gráfico Alta** (versão 1.7.0)
  - Mais leve sem perder qualidade: camada de luz em resolução menor (é toda suave), tela opaca, blocos de chão sem recálculo repetido no Baixa.
  - Alta: sombras dos postes (construções e árvores), sombras que se mexem de carros e pedestres, sombra de contato macia e escurecimento no pé das construções.

- [x] **6. Nível de motorista e reputação** (versão 1.8.0)
  - XP de tudo que paga; 30 níveis com títulos e bônus; banner "SUBIU DE NÍVEL" e chip de nível no HUD.
  - Nota (últimas 30 corridas) com faixas Bronze/Prata/Ouro/Diamante. Nível e nota liberam PegaAí Aeroporto (nível 2), Mudança (nível 3, Kombo/picape/Unho) e VIP (nível 5, nota 4,5).
  - Cliente mal atendido (1-2 estrelas) manda áudio no WhatsApp: voz real (ElevenLabs) ou leitura pelo Windows, com transcrição. Personagens (Seu Zé, Seu Biu, Banestresse) também mandam áudios. Roteiro das vozes em ROTEIRO-VOZES.md.

- [x] **Desempenho na Serra** (Cara-Pintada, Feio Rosa, Flexão, Nova Prosa)
  - Paredes das casinhas viram "adesivos" prontos, reaproveitados entre casas iguais; bandeirinhas da mesma cor numa pincelada só. Pinceladas por quadro caíram de ~11.700 para ~6.300 nesses bairros, sem mudar o visual.

- [x] **Câmera mais perto e trânsito em volta da tela**
  - Câmera em 3 alturas (140/135/130%) com prévia nas configurações; tecla C troca. Gráfico Alto por padrão.
  - Trânsito estilo GTA: carro nasce fora da borda da tela vindo pra dentro, some depois de 4 s fora da tela, trecho cheio não recebe carro novo. De 32 para 4 a 8 carros simulados, com mais carro por pedaço de tela.
  - Pessoas, animais e peladas só se mexem na tela. GPS 20% mais perto e sem carros. Praia só do lado da cidade grande.

## Próximos

1. **História em capítulos** — missões contadas pelo WhatsApp, com personagens fixos (Seu Zé, o primo enrolado, um cliente misterioso, o dono do ferro-velho). Cada capítulo libera bairro, carro ou oficina nova. Ex.: buscar uma encomenda em Vila Véia e descobrir que é a moqueca roubada do concurso de Camburiso.
4. **Colecionáveis escondidos** — 30 panelas de barro pelo mapa, pontos turísticos para "fotografar" com o celular, placas de zoeira. Coleção completa dá prêmio.
5. **Desafios diários e semanais** — "3 corridas sem bater", "entregue um frete na chuva", "dirija 5 km na BR à noite".

## Depois, se quiser

- Rádio com locutor de zoeira (só falas, sem música).
- Corridas contra outros carros com ranking.
- Polícia de volta, feita do jeito certo (o sistema atual está desligado com `POLICE_ENABLED = false`).

## Ordem combinada

Eventos aleatórios (2) → personalização (3) → história (1).

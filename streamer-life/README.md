# Streamer Life

Simulador de vida, streaming e influência digital. Você começa num apartamento simples, com um notebook velho e pouco dinheiro, e tenta viver de internet: faz lives, publica vídeos, cuida das redes, paga as contas, conhece gente e constrói uma carreira (ou não).

## Como jogar

Abra o arquivo `index.html` no navegador (dois cliques). Não precisa de internet nem de servidor. As fontes vêm do Google Fonts quando há internet; sem internet o jogo usa as fontes do sistema.

Também existe a versão de arquivo único: `node tools/bundle.js` gera `dist/streamer-life.html`.

### Controles

- **Mouse**: clique nos objetos da casa para usar, nos lugares do mapa para viajar e nas pessoas para conversar.
- **WASD / setas**: andar dentro de casa.
- **Espaço**: pausa. **1, 2, 3**: velocidade do tempo.
- **C**: celular. **P**: computador (em casa). **Esc**: fecha janelas e abre o menu.

## O que tem no jogo

- **Vida**: fome, sede, sono, higiene, energia, saúde, humor e estresse; elas mudam o desempenho nas lives, na edição e nas conversas. Comida estraga, a casa suja, planta morre sem água.
- **Casa em 2D** (3 casas possíveis + estúdio): tudo que você compra aparece no cômodo (cama, geladeira, PC, monitores, microfone, luz, LED, letreiro neon...).
- **Cidade**: mercado, restaurante, loja de eletrônicos, academia, shopping, parque, cafeteria, casas de amigos e centro de eventos, com horários; viagem a pé, de bicicleta, ônibus, carro por app ou carro próprio.
- **Lives (Pulso Studio)**: preparação (jogo, título com nota, descrição, tags, qualidade, layout, divulgação), prévia do jogo desenhada, câmera que mostra seu cenário, chat em tempo real e ações (conversar, piada, enquete, desafio, pausa, trocar de jogo, patrocinador, anúncio, moderação).
- **Espectadores com inteligência própria**: cada pessoa conhecida tem nome, idade, personalidade (silencioso, comunicativo, fã fiel, novato, engraçado, crítico, competitivo, casual, apoiador, troll, especialista, criador), gostos, horário, paciência, dinheiro, fidelidade e **memória** (visitas, respostas, perguntas ignoradas, doações, momentos marcantes que presenciou, promessas). O público grande é simulado em números; até 1.000 pessoas ficam guardadas com memória.
- **Vídeos (Estúdio de Vídeo)**: 10 passos (tipo, assunto, jogo, gravação, momentos, edição, título e descrição, thumbnail, tags, publicar ou agendar). Edição por você ou por editor contratado.
- **Redes**: Vision (vídeos longos), Clipz (curtos e trends) e Connect (posts, fotos, enquetes, anúncios de live), com algoritmos diferentes, feed vivo e comentários.
- **Outros criadores**: 16 criadores com carreira própria (fazem live no horário deles, publicam, crescem, caem, brigam, viralizam, mandam raid, convidam para collab ou criticam você).
- **Pessoas**: família, amigos, romance opcional, editores, moderadores e empresários; convites viram compromissos no calendário e faltar tem consequência.
- **Dinheiro**: contas do mês, impostos (carnê-leão ou MEI), repasses das plataformas, empréstimo, patrimônio, patrocínios com exigências e multa, loja do canal.
- **Eventos e reputação**: corte viraliza, notícia falsa, crítica de outro criador, equipamento quebra, proposta duvidosa, vizinho reclama, esgotamento, entrevista na TV, eventos no centro de eventos.
- **Carreira**: Desconhecido, Iniciante, Pequeno criador, Criador em crescimento, Influenciador conhecido, Influenciador de grande porte e Celebridade digital (por resultado e reputação, pode subir e cair) + objetivos.
- **Salvamento**: 3 espaços + automático (comprimido), exportar/importar, com versão e migração dos dados.

## Organização

```
index.html
css/      base, interface, apps, streaming, animations
js/core/      util (sorteio, formatos, barramento), icons (SVG próprios e emotes), audio (sons sintetizados)
js/data/      catálogo, pessoas, falas do chat, textos do mundo
js/systems/   estado, relógio, notificações, vida, economia, equipamentos, espectadores (IA), jogos,
              chat, algoritmo, live, vídeos, redes, criadores (IA), relacionamentos, patrocínios,
              eventos/reputação, carreira/calendário/objetivos, salvamento
js/render/    personagens, prévias e thumbnails, casa, cidade
js/ui/        interface (janelas, celular, avisos), telas, painel, apps
js/main.js    início e laço principal
tests/        testes automáticos
tools/        bundle.js (arquivo único)
```

Os scripts são clássicos (não módulos) de propósito: assim o jogo abre direto do disco.

## Testes

```bash
node tests/teste_completo.js
```

```bash
node tests/estresse_node.js 150
```

```bash
node tests/sim_node.js 60
```

- `teste_completo.js` (Playwright): cria personagem, passa o tempo, come, compra, faz 3 lives (público, chat, perguntas, memória), cria e publica vídeo, posta, paga conta, viaja, conversa, decide um evento, abre o celular, renderiza todos os apps, salva, fecha o navegador e carrega de novo.
- `estresse_node.js`: joga muitos dias com ações aleatórias em todos os sistemas e procura erros e números inválidos.
- `sim_node.js`: mede o crescimento do canal com uma rotina "boa" (para calibrar a economia).

# Streamer Life

Simulador de vida, streaming e influência digital. Você começa num apartamento simples, com um notebook velho e pouco dinheiro, e tenta viver de internet: faz lives, publica vídeos, cuida das redes, paga as contas, conhece gente e constrói uma carreira (ou não).

## Como jogar

Abra o arquivo `index.html` no navegador (dois cliques). Não precisa de internet nem de servidor. As fontes vêm do Google Fonts quando há internet; sem internet o jogo usa as fontes do sistema.

Também existe a versão de arquivo único: `node tools/bundle.js` gera `dist/streamer-life.html`.

### Controles

- **Clique num objeto da casa**: o personagem vai até ele e aparece um menu redondo com as opções (e Cancelar). Ações de várias etapas, como preparar comida (pegar na geladeira, cozinhar, levar à mesa e comer), travam os botões até terminar.
- **WASD / setas**: andar. **Shift**: correr. **E**: usar o objeto mais perto. **Roda do mouse**: aproximar.
- **Espaço**: pausa. **1, 2, 3**: velocidade do tempo.
- **C**: celular. **P**: computador (em casa). **Esc**: fecha janelas e abre o menu.

## O que tem no jogo

- **Casa vista de cima**: câmera que segue o personagem, paredes e móveis com volume, portas que abrem, sol pelas janelas e luzes à noite. Tudo que você compra aparece no cômodo.
- **Vida**: só fome, sede e cansaço (as barrinhas do canto). Cansado demais, você fica com sono, anda mais devagar e rende menos.
- **Tempo calmo**: na velocidade normal, 1 minuto do jogo passa a cada 2 segundos; banho, sono e live levam o tempo de verdade (e dá para acelerar).
- **Computador**: OBS Studio (lives na Twitch), Premiere Pro (edição), YouTube, TikTok, Instagram, WhatsApp, Gmail (parcerias), Bank, Mercado Livre, iFood, Udemy, LinkedIn, Agenda e Carreira.
- **Celular**: redes, WhatsApp, Gmail, Bank, Mercado Livre, iFood, Agenda, Carreira, Contatos, Maps e Notificações (a central de avisos fica só aqui).
- **Cidade**: mercado, restaurante, loja de eletrônicos, academia, shopping, parque, cafeteria, casas de amigos e centro de eventos, com horários.
- **Lives**: preparação no OBS Studio, chat em tempo real com espectadores que têm personalidade e **memória** (visitas, perguntas, doações, promessas).
- **Vídeos** em 10 passos no Premiere Pro, **redes** com algoritmos diferentes, **outros criadores** com carreira própria, **pessoas**, **dinheiro**, **eventos e reputação**, **carreira** e **salvamento** em 3 espaços + automático.

Os nomes de aplicativos são só nomes: os ícones e o visual são do jogo.

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

- `teste_completo.js` (Playwright): cria personagem, passa o tempo, abre a geladeira pelo menu redondo e prepara comida (com os botões travados), compra, faz 3 lives (público, chat, perguntas, memória), cria e publica vídeo, posta, paga conta, viaja, conversa, decide um evento, abre o celular, renderiza todos os apps, salva, fecha o navegador e carrega de novo.
- `estresse_node.js`: joga muitos dias com ações aleatórias em todos os sistemas e procura erros e números inválidos.
- `sim_node.js`: mede o crescimento do canal com uma rotina "boa" (para calibrar a economia).

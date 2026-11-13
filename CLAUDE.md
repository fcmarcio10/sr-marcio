# BR Night Drive — guia para o Claude

Jogo de direção noturna top-down 2.5D em HTML5 Canvas + JS puro, na cidade fictícia de São Gambiarra (ES).
O dono do projeto fala português e não é técnico: responda em português simples, sem jargão.

## Como montar

- O código fica em `src/` (partes numeradas). **Não edite `game.js` direto**: ele é gerado.
- `./tools/build.sh` → gera `src/p00_clips.js` (vozes de `audio/`), junta tudo em `game.js`, confere a sintaxe e gera `dist/br-night-drive.html` (página única) e `tools/tests/wrapped.html`.
- Testes (Playwright, rodar de dentro de `tools/tests/`): `t3` (fluxo geral, oficina, garagem), `t26` (celular, fretes, racha), `t43` (conquistas), `t66` (litoral), `t75` (vida do carro, Seu Biu, chuva), `t77` (banco e fiado), `t83` (personalização), `t94` (chat do PegaAí), `t95` (convite de evento e noivo), `t96` (câmera em 3 níveis, prévia, gráfico Alto padrão), `t97` (boas-vindas, faixa dos carros, cortes). `trafego.js [y]` mede carros simulados x carros na tela. `tipos.js` mostra o custo de desenho por tipo de objeto em 11 bairros. `quem.js x y` conta as pinceladas do quadro inteiro (mapa, GPS, velocímetro) por função. `prof2.js alta|media|baixa` mede o tempo de desenho; `prof3.js alta 7500` dirige o carro mais rápido pela Serra (Cara-Pintada) e mede travadas; `calls.js wrapped.html` conta as pinceladas por quadro; `shot.js arquivo.html saida.png x y` tira foto da mesma cena para comparar versões. Este computador de testes não tem placa de vídeo: compare pinceladas por quadro, não só milissegundos.
- Trailer: `tools/trailer/` — `node gravar.js [cena]` grava quadro a quadro (relógio controlado, carro no trilho pela rota do GPS), `./montar.sh` junta em `saida/br-night-drive-trailer.mp4` (1080p60), `./narrar.sh` encaixa `voz/narra_1..6.mp3` (projeto do ElevenLabs "BR Night Drive - Narração do trailer"). Cenas em `roteiro.js`.
- Trailer estilo GTA: `ROTEIRO=./roteiro_gta.js node gravar.js [cena]` (32 cenas em compassos, 130 BPM; câmera de cinema, câmera lenta, cartões de personagem com retrato, legendas), `python3 som.py` compõe a trilha (funk no groove do paredão + efeitos no quadro em que o jogo tocou cada som), `./montar_gta.sh` gera `saida/br-night-drive-trailer-gta.mp4` e encaixa `voz/n1,n2,p1,z1,b1,n3.mp3` (projeto do ElevenLabs "BR Night Drive - Trailer GTA (falas)") abaixando a música. `SO_SOM=1` refaz só o som.
- Jogo no navegador: artefato https://claude.ai/artifact/A27NagegSAtFf2ud7b3fsU — publicar sempre o arquivo `dist/br-night-drive.html` nesse mesmo link.

## App do Windows

- Atual: `nativo/` (instalador pequeno, ~2 MB). `cd nativo && npm install && npm run build:win` (precisa de Rust com alvo `x86_64-pc-windows-gnu`, `mingw-w64` e `nsis`). Mandar o instalador dentro de um `.zip` (o app do Claude não baixa `.exe` solto).
- Antigo: `desktop/` (zip grande). Não usar mais, a não ser que peçam.
- **Não gerar instalador nem mudar a versão** a não ser em mudança grande, ou quando pedirem. Versão em `GAME_VERSION` (`src/p1_core.js`), `index.html` (`game-ver`), `nativo/package.json`, `nativo/src-tauri/Cargo.toml`, `nativo/src-tauri/tauri.conf.json`.
- Nada no app pode citar a ferramenta usada para fazê-lo (nome, empresa e descrição: só "BR Night Drive").

## Vozes (ElevenLabs)

- Vozes ficam em `audio/*.mp3` (já comprimidas). O nome do arquivo é a chave em `VOICE_LINES` / `CHAR_VOICES` (`src/p66_career.js`).
- Faltam as 4 dos personagens em `ROTEIRO-VOZES.md` (inclui `boas_vindas`, áudio do Seu Zé na 1ª vez no jogo, `Profile.welcomed`) (nome do arquivo, voz e texto com as marcações de emoção). Gerar uma por vez com o modelo `eleven_v4`, baixar o `content_url` (host `elevenlabsusercontent.com` liberado no ambiente "sr-marcio"), comprimir com ffmpeg e rodar o build.
- As contas grátis (antiga e principal) foram bloqueadas por "atividade incomum" depois de algumas gerações: só gera de novo com plano pago. O plano grátis não permite uso comercial (o crédito está na tela de Créditos). `tools/tests/tv.js` lista quais vozes já têm áudio.
- Passageiros falam pelo **chat do PegaAí** (estilo app de corrida). Personagens fixos (Seu Zé, Seu Biu, Banestresse) falam pelo **WhatsApp**. Gente de evento (noivo, motorista do carro quebrado) **não** manda mensagem no WhatsApp: o agradecimento aparece só na tela. Configuração "Mensagens dos personagens": Áudio (só português) ou Texto.

## Regras e preferências do dono

- Sem emojis como visual. Sem imagens externas (tudo desenhado no código). Fontes embutidas (Anton e Barlow, licença OFL).
- Nomes de zoeira/paródia (cidades e marcas), humor brasileiro e gírias capixabas.
- Câmera: 3 alturas (1 = 140% padrão, 2 = 135%, 3 = 130%); nada passa de 130%, nem correndo. Gráfico padrão: Alto.
- Trânsito enxuto: nasce numa faixa pequena (240) fora da borda, sempre vindo pra tela; some ao sair da tela indo embora, após 2,5 s fora dela ou ao sair da faixa. No máximo ~5 carros na tela e 9 no total. GPS sem carros. Praia só do lado da cidade grande (embaixo da Serra é mata).
- **Mapa montado por sorteio numa sequência só** (`RNG` em `p1_core.js`): mudar quantos sorteios uma parte faz embaralha tudo o que vem depois (lojas, postes, árvores). Ao mexer na montagem, use sorteio próprio na parte nova e repita os sorteios antigos — ver `comunidadeSorteioAntigo` e `orlaSorteioAntigo` (`p2_world.js`).
- Garagem só com o essencial (sem passo a passo, legenda nem "nível X de 3"); personalização só com texto quando muda algo ("R$ 150 cada pintura", tecla B, +4% aderência).
- Luz das janelas de todas as construções numa pincelada só por quadro (`EM_BATCH`). Ícones do GPS como imagens prontas (`mapIconSprite`), brilho do poste com núcleo junto (`lampGlowSprite`), fios num traço só, velocímetro só redesenha quando muda. Partículas continuam uma por uma (a fumaça fica mais densa onde se sobrepõe).
- Nada fora da tela: `tallVisible` corta construções/árvores/postes que não aparecem (comparado pixel a pixel: igual). Festa, fumaça de evento e vagalumes só perto da tela.
- Comunidade: casas grandes (−34%) com viela de terra de cima a baixo (abre o muro) e uma atravessando; 16 de largura (carro tem 21+, não entra).
- Cuidado no trânsito: `AICar.off` é a faixa e `AICar.acc` a aceleração; o tempo fora da tela é `hideT` e o passo reduzido é `simT`.
- Mariposas só em 30% dos postes das favelas; 20% menos árvores (`thinTrees`, por posição); 35% menos pedestres; chuva e poças −10%; espirro −35%. Carros desenham a banda do pneu e frisos numa pincelada (−28% por carro).
- Cortes de desempenho: sem placas de PARE (só faixa e letras no chão), sem mariposas nos postes, sem bandeirinhas nos quarteirões de comunidade, casinhas da comunidade maiores e em menor número. Bloquete só na favela (Serra, São Pedreiro, Terra Amarelou); no resto, um asfalto só.
- Pichações foram removidas (pesavam). Polícia está desligada (`POLICE_ENABLED = false`) até ser refeita.
- Pedidos chegam também por comentários no artefato: responder no próprio comentário, em português.
- Ideias e ordem de desenvolvimento: `ROADMAP.md`. Próximos: história em capítulos, colecionáveis, desafios diários.

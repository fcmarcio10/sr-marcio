# BR Night Drive — guia para o Claude

Jogo de direção noturna top-down 2.5D em HTML5 Canvas + JS puro, na cidade fictícia de São Gambiarra (ES).
O dono do projeto fala português e não é técnico: responda em português simples, sem jargão.

## Como montar

- O código fica em `src/` (partes numeradas). **Não edite `game.js` direto**: ele é gerado.
- `./tools/build.sh` → gera `src/p00_clips.js` (vozes de `audio/`), junta tudo em `game.js`, confere a sintaxe e gera `dist/br-night-drive.html` (página única) e `tools/tests/wrapped.html`.
- Testes (Playwright, rodar de dentro de `tools/tests/`): `t3` (fluxo geral, oficina, garagem), `t26` (celular, fretes, racha), `t43` (conquistas), `t66` (litoral), `t75` (vida do carro, Seu Biu, chuva), `t77` (banco e fiado), `t83` (personalização), `t94` (chat do PegaAí), `t95` (convite de evento e noivo). `prof2.js alta|media|baixa` mede o tempo de desenho; `prof3.js alta 7500` dirige o carro mais rápido pela Serra (Cara-Pintada) e mede travadas; `calls.js wrapped.html` conta as pinceladas por quadro; `shot.js arquivo.html saida.png x y` tira foto da mesma cena para comparar versões. Este computador de testes não tem placa de vídeo: compare pinceladas por quadro, não só milissegundos.
- Jogo no navegador: artefato https://claude.ai/artifact/A27NagegSAtFf2ud7b3fsU — publicar sempre o arquivo `dist/br-night-drive.html` nesse mesmo link.

## App do Windows

- Atual: `nativo/` (instalador pequeno, ~2 MB). `cd nativo && npm install && npm run build:win` (precisa de Rust com alvo `x86_64-pc-windows-gnu`, `mingw-w64` e `nsis`). Mandar o instalador dentro de um `.zip` (o app do Claude não baixa `.exe` solto).
- Antigo: `desktop/` (zip grande). Não usar mais, a não ser que peçam.
- **Não gerar instalador nem mudar a versão** a não ser em mudança grande, ou quando pedirem. Versão em `GAME_VERSION` (`src/p1_core.js`), `index.html` (`game-ver`), `nativo/package.json`, `nativo/src-tauri/Cargo.toml`, `nativo/src-tauri/tauri.conf.json`.
- Nada no app pode citar a ferramenta usada para fazê-lo (nome, empresa e descrição: só "BR Night Drive").

## Vozes (ElevenLabs)

- Vozes ficam em `audio/*.mp3` (já comprimidas). O nome do arquivo é a chave em `VOICE_LINES` / `CHAR_VOICES` (`src/p66_career.js`).
- Faltam as 3 dos personagens em `ROTEIRO-VOZES.md` (nome do arquivo, voz e texto com as marcações de emoção). Gerar uma por vez com o modelo `eleven_v4`, baixar o `content_url` (host `elevenlabsusercontent.com` liberado no ambiente "sr-marcio"), comprimir com ffmpeg e rodar o build.
- As contas grátis (antiga e principal) foram bloqueadas por "atividade incomum" depois de algumas gerações: só gera de novo com plano pago. O plano grátis não permite uso comercial (o crédito está na tela de Créditos). `tools/tests/tv.js` lista quais vozes já têm áudio.
- Passageiros falam pelo **chat do PegaAí** (estilo app de corrida). Personagens fixos (Seu Zé, Seu Biu, Banestresse) falam pelo **WhatsApp**. Gente de evento (noivo, motorista do carro quebrado) **não** manda mensagem no WhatsApp: o agradecimento aparece só na tela. Configuração "Mensagens dos personagens": Áudio (só português) ou Texto.

## Regras e preferências do dono

- Sem emojis como visual. Sem imagens externas (tudo desenhado no código). Fontes embutidas (Anton e Barlow, licença OFL).
- Nomes de zoeira/paródia (cidades e marcas), humor brasileiro e gírias capixabas.
- Pichações foram removidas (pesavam). Polícia está desligada (`POLICE_ENABLED = false`) até ser refeita.
- Pedidos chegam também por comentários no artefato: responder no próprio comentário, em português.
- Ideias e ordem de desenvolvimento: `ROADMAP.md`. Próximos: história em capítulos, colecionáveis, desafios diários.

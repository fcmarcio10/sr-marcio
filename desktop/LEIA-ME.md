# BR Night Drive — versão para computador (Electron)

O jogo roda offline: os arquivos vão dentro do aplicativo.

## Requisito (uma vez só)
Instale o **Node.js** (versão LTS): https://nodejs.org

## Rodar para testar
Abra o terminal nesta pasta (`desktop`) e rode:

    npm install
    npm start

## Gerar o instalador do Windows
    npm run dist:win

O resultado sai em `desktop/release/`:
- `BR-Night-Drive-Setup-1.1.0.exe` — instalador
- `BR-Night-Drive-1.1.0-portatil.exe` — versão portátil (abre direto, sem instalar)

## Observações
- F11 alterna tela cheia.
- O app Trapaças fica desligado automaticamente na versão empacotada.
- O save fica em `%APPDATA%\br-night-drive`.
- Sempre que mudar o jogo (index.html, style.css, game.js na pasta de cima), rode o comando de novo.

## Versão e ícone

- A versão fica em `package.json` (`"version"`) e em `GAME_VERSION` no topo do `game.js`. Mude as duas juntas.
- O ícone está em `build/icon.png` e `build/icon.ico`. O `after-pack.js` grava o ícone e a versão dentro do `.exe` do Windows (funciona até gerando no Linux, sem Wine).

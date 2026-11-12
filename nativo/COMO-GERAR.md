# Gerar o instalador do Windows (app nativo)

```bash
cd nativo
npm install
npm run build:win
```

Precisa de: Rust com o alvo `x86_64-pc-windows-gnu`, `mingw-w64` e `nsis`.
O instalador sai em `src-tauri/target/x86_64-pc-windows-gnu/release/bundle/nsis/`.
Versão: mude em `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` e `GAME_VERSION` no jogo.

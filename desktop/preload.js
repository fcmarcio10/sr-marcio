// Ponte segura entre o jogo e o Windows: só expõe "sair do jogo".
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('brnd', { desktop: true, quit: () => ipcRenderer.send('brnd-quit') });

// BR Night Drive — janela do jogo no computador (Electron). Roda 100% offline.
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

// Nome próprio do app (sem "Electron" em lugar nenhum: barra de tarefas, Gerenciador de Tarefas, notificações)
app.setName('BR Night Drive');
if (process.platform === 'win32') app.setAppUserModelId('com.brnightdrive.game');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 760, minWidth: 960, minHeight: 600,
    title: 'BR Night Drive', icon: path.join(__dirname, 'build', 'icon.png'), backgroundColor: '#05070f', autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false, preload: path.join(__dirname, 'preload.js') },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  // F11 alterna tela cheia
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
}

// botão SAIR DO JOGO dentro do jogo
ipcMain.on('brnd-quit', () => app.quit());

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

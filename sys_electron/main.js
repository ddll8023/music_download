const { app, BrowserWindow, ipcMain, dialog, net, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');
const netModule = require('net');

const DEFAULT_PORT = 3492;
const isDev = !app.isPackaged;

let mainWindow = null;
let flaskProcess = null;
let flaskPort = DEFAULT_PORT;

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = netModule.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

function waitForFlask(port, maxRetries = 30, interval = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      http
        .get(`http://127.0.0.1:${port}/health`, (res) => {
          resolve();
        })
        .on('error', () => {
          retries++;
          if (retries >= maxRetries) {
            reject(new Error(`Flask 在端口 ${port} 启动超时`));
          } else {
            setTimeout(check, interval);
          }
        });
    };
    check();
  });
}

function startFlask() {
  return new Promise(async (resolve, reject) => {
    flaskPort = await findAvailablePort(DEFAULT_PORT);

    const flaskExePath = path.join(
      process.resourcesPath,
      'flask-backend',
      'music_download_backend'
    );

    flaskProcess = spawn(flaskExePath, ['--port', String(flaskPort)], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    flaskProcess.stdout.on('data', (data) => {
      console.log(`[Flask] ${data.toString().trim()}`);
    });

    flaskProcess.stderr.on('data', (data) => {
      console.error(`[Flask] ${data.toString().trim()}`);
    });

    flaskProcess.on('error', (err) => {
      console.error('Flask 进程启动失败:', err);
      reject(err);
    });

    flaskProcess.on('exit', (code) => {
      console.log(`Flask 进程退出，code=${code}`);
      flaskProcess = null;
    });

    try {
      await waitForFlask(flaskPort);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function registerIpcHandlers() {
  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('select-files', async (event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: filters || [],
    });
    if (result.canceled) return null;
    return result.filePaths;
  });

  ipcMain.handle('download-file', async (event, options) => {
    const { url, filename } = options;
    const saveResult = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename,
    });
    if (saveResult.canceled) return false;

    try {
      const response = await net.fetch(url);
      if (!response.ok) return false;
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(saveResult.filePath, buffer);
      return true;
    } catch (err) {
      console.error('文件下载失败:', err);
      return false;
    }
  });

  ipcMain.handle('get-app-info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    isPackaged: app.isPackaged,
  }));

  ipcMain.handle('get-flask-port', () => flaskPort);

  ipcMain.handle('window-minimize', () => mainWindow?.minimize());
  ipcMain.handle('window-maximize', () => {
    if (!mainWindow) return;
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });
  ipcMain.handle('window-close', () => mainWindow?.close());
  ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);
}

function stopFlask() {
  if (flaskProcess) {
    flaskProcess.kill();
    flaskProcess = null;
  }
}

function createMenu(mainWindow) {
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '重新加载', accelerator: 'Ctrl+R', click: () => mainWindow.reload() },
        { label: '开发者工具', accelerator: 'F12', click: () => mainWindow.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: '退出', accelerator: 'Ctrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'copy', label: '复制', accelerator: 'Ctrl+C' },
        { role: 'paste', label: '粘贴', accelerator: 'Ctrl+V' },
        { role: 'selectAll', label: '全选', accelerator: 'Ctrl+A' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { label: '放大', accelerator: 'Ctrl+=', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: '缩小', accelerator: 'Ctrl+-', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
        { label: '重置缩放', accelerator: 'Ctrl+0', click: () => mainWindow.webContents.setZoomLevel(0) },
        { type: 'separator' },
        { label: '全屏', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
      ],
    },
    {
      label: '帮助',
      submenu: [
        { label: '关于', click: () => dialog.showMessageBox(mainWindow, { type: 'info', title: '关于', message: 'Music Download Platform', detail: `版本: ${app.getVersion()}\n平台: ${process.platform}\nElectron 桌面应用` }) },
        { label: 'GitHub', click: () => shell.openExternal('https://github.com') },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const frontendPath = path.join(__dirname, '..', '..', 'sys_vue', 'dist', 'index.html');
    mainWindow.loadFile(frontendPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  registerIpcHandlers();

  if (!isDev) {
    try {
      await startFlask();
    } catch (err) {
      console.error('Flask 后端启动失败:', err);
    }
  } else {
    flaskPort = DEFAULT_PORT;
  }

  createWindow();
  createMenu(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopFlask();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  stopFlask();
});

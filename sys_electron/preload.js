const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),

  selectFiles: (filters) => ipcRenderer.invoke('select-files', filters),

  downloadFile: (options) => ipcRenderer.invoke('download-file', options),

  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  getFlaskPort: () => ipcRenderer.invoke('get-flask-port'),

  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
});

import { contextBridge, ipcRenderer } from 'electron'

// window.api je jedini kanal komunikacije između renderer i main procesa.
// Sve operacije baze dodavati ovdje u narednim fazama.
contextBridge.exposeInMainWorld('api', {
  // Provjera IPC komunikacije
  ping: () => ipcRenderer.invoke('ping')
})

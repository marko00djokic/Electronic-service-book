import { ipcMain } from 'electron'

// Centralno mjesto za registraciju svih IPC handlera.
// Faze 2-4 dodaju vehicle, owner, serviceOrder handlere ovdje.
export function registerIpcHandlers() {
  ipcMain.handle('ping', () => 'pong')
}

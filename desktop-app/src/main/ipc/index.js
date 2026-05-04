import { ipcMain } from 'electron'
import { registerVehicleHandlers } from './vehicles-ipc.js'
import { registerOwnerHandlers } from './owners-ipc.js'

export function registerIpcHandlers() {
  ipcMain.handle('ping', () => 'pong')
  registerVehicleHandlers()
  registerOwnerHandlers()
}

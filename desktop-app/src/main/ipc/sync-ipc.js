import { ipcMain } from 'electron'
import { triggerSync, getSyncStatus } from '../sync-service.js'

export function registerSyncHandlers() {
  ipcMain.handle('sync:trigger', async () => {
    await triggerSync()
    return getSyncStatus()
  })

  ipcMain.handle('sync:getStatus', () => getSyncStatus())
}

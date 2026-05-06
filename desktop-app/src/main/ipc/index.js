import { ipcMain } from 'electron'
import { registerVehicleHandlers } from './vehicles-ipc.js'
import { registerOwnerHandlers } from './owners-ipc.js'
import { registerServiceOrderHandlers } from './service-orders-ipc.js'
import { registerCatalogHandlers } from './parts-catalog-ipc.js'
import { registerSpecialRecordHandlers } from './special-records-ipc.js'
import { registerPdfHandlers } from './pdf-ipc.js'
import { registerDashboardHandlers } from './dashboard-ipc.js'
import { registerSyncHandlers } from './sync-ipc.js'

export function registerIpcHandlers() {
  ipcMain.handle('ping', () => 'pong')
  registerVehicleHandlers()
  registerOwnerHandlers()
  registerServiceOrderHandlers()
  registerCatalogHandlers()
  registerSpecialRecordHandlers()
  registerPdfHandlers()
  registerDashboardHandlers()
  registerSyncHandlers()
}

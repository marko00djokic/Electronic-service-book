import { ipcMain } from 'electron'
import * as specialRecord from '../models/specialRecord.js'

export function registerSpecialRecordHandlers() {
  ipcMain.handle('specialRecords:getByVehicle', (_, vehicleId) => {
    try { return specialRecord.getByVehicle(vehicleId) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('specialRecords:getByType', (_, vehicleId, type) => {
    try { return specialRecord.getByType(vehicleId, type) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('specialRecords:create', (_, data) => {
    try { return specialRecord.create(data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('specialRecords:update', (_, id, data) => {
    try { return specialRecord.update(id, data) }
    catch (err) { return { error: err.message } }
  })
}

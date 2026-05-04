import { ipcMain } from 'electron'
import * as vehicle from '../models/vehicle.js'
import * as ownershipHistory from '../models/ownershipHistory.js'

export function registerVehicleHandlers() {
  ipcMain.handle('vehicles:getAll', () => {
    try { return vehicle.getAll() }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('vehicles:getById', (_, id) => {
    try { return vehicle.getById(id) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('vehicles:create', (_, data) => {
    try { return vehicle.create(data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('vehicles:update', (_, id, data) => {
    try { return vehicle.update(id, data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('vehicles:remove', (_, id) => {
    try { return vehicle.remove(id) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('vehicles:search', (_, query) => {
    try { return vehicle.search(query) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('ownershipHistory:getByVehicle', (_, vehicleId) => {
    try { return ownershipHistory.getByVehicle(vehicleId) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('ownershipHistory:addOwner', (_, vehicleId, ownerId, startDate) => {
    try { return ownershipHistory.addOwner(vehicleId, ownerId, startDate) }
    catch (err) { return { error: err.message } }
  })
}

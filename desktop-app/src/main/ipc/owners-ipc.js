import { ipcMain } from 'electron'
import * as owner from '../models/owner.js'
import * as ownershipHistory from '../models/ownershipHistory.js'

export function registerOwnerHandlers() {
  ipcMain.handle('owners:getAll', () => {
    try { return owner.getAll() }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('owners:getById', (_, id) => {
    try { return owner.getById(id) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('owners:create', (_, data) => {
    try { return owner.create(data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('owners:update', (_, id, data) => {
    try { return owner.update(id, data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('owners:remove', (_, id) => {
    try { return owner.remove(id) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('owners:search', (_, query) => {
    try { return owner.search(query) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('ownershipHistory:getByOwner', (_, ownerId) => {
    try { return ownershipHistory.getByOwner(ownerId) }
    catch (err) { return { error: err.message } }
  })
}

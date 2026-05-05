import { ipcMain } from 'electron'
import * as partsCatalog from '../models/partsCatalog.js'

export function registerCatalogHandlers() {
  ipcMain.handle('catalog:getAll', () => {
    try { return partsCatalog.getAll() }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('catalog:search', (_, query) => {
    try { return partsCatalog.search(query) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('catalog:create', (_, data) => {
    try { return partsCatalog.create(data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('catalog:update', (_, id, data) => {
    try { return partsCatalog.update(id, data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('catalog:remove', (_, id) => {
    try { return partsCatalog.remove(id) }
    catch (err) { return { error: err.message } }
  })
}

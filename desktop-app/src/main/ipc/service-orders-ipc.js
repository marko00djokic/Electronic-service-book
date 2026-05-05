import { ipcMain } from 'electron'
import * as serviceOrder from '../models/serviceOrder.js'
import * as serviceItem from '../models/serviceItem.js'
import * as servicePart from '../models/servicePart.js'

export function registerServiceOrderHandlers() {
  ipcMain.handle('serviceOrders:getAll', () => {
    try { return serviceOrder.getAll() }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceOrders:getById', (_, id) => {
    try { return serviceOrder.getById(id) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceOrders:getByVehicle', (_, vehicleId) => {
    try { return serviceOrder.getByVehicle(vehicleId) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceOrders:create', (_, data) => {
    try { return serviceOrder.create(data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceOrders:update', (_, id, data) => {
    try { return serviceOrder.update(id, data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceOrders:remove', (_, id) => {
    try { return serviceOrder.remove(id) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceItems:getByOrder', (_, orderId) => {
    try { return serviceItem.getByOrder(orderId) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceItems:create', (_, orderId, data) => {
    try { return serviceItem.create(orderId, data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceItems:update', (_, id, data) => {
    try { return serviceItem.update(id, data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceItems:remove', (_, id) => {
    try { return serviceItem.remove(id) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceItems:removeByOrder', (_, orderId) => {
    try { return serviceItem.removeByOrder(orderId) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceParts:getByOrder', (_, orderId) => {
    try { return servicePart.getByOrder(orderId) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceParts:create', (_, orderId, data) => {
    try { return servicePart.create(orderId, data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceParts:update', (_, id, data) => {
    try { return servicePart.update(id, data) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceParts:remove', (_, id) => {
    try { return servicePart.remove(id) }
    catch (err) { return { error: err.message } }
  })

  ipcMain.handle('serviceParts:removeByOrder', (_, orderId) => {
    try { return servicePart.removeByOrder(orderId) }
    catch (err) { return { error: err.message } }
  })
}

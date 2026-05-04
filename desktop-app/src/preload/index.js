import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  ping: () => ipcRenderer.invoke('ping'),

  vehicles: {
    getAll:   ()          => ipcRenderer.invoke('vehicles:getAll'),
    getById:  (id)        => ipcRenderer.invoke('vehicles:getById', id),
    create:   (data)      => ipcRenderer.invoke('vehicles:create', data),
    update:   (id, data)  => ipcRenderer.invoke('vehicles:update', id, data),
    remove:   (id)        => ipcRenderer.invoke('vehicles:remove', id),
    search:   (query)     => ipcRenderer.invoke('vehicles:search', query),
  },

  owners: {
    getAll:   ()          => ipcRenderer.invoke('owners:getAll'),
    getById:  (id)        => ipcRenderer.invoke('owners:getById', id),
    create:   (data)      => ipcRenderer.invoke('owners:create', data),
    update:   (id, data)  => ipcRenderer.invoke('owners:update', id, data),
    remove:   (id)        => ipcRenderer.invoke('owners:remove', id),
    search:   (query)     => ipcRenderer.invoke('owners:search', query),
  },

  ownership: {
    getByVehicle: (vehicleId)                       => ipcRenderer.invoke('ownershipHistory:getByVehicle', vehicleId),
    addOwner:     (vehicleId, ownerId, startDate)   => ipcRenderer.invoke('ownershipHistory:addOwner', vehicleId, ownerId, startDate),
    getByOwner:   (ownerId)                         => ipcRenderer.invoke('ownershipHistory:getByOwner', ownerId),
  }
})

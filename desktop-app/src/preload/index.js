import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronEvents', {
  onNavigate: (callback) => ipcRenderer.on('navigate', (_, path) => callback(path)),
  removeNavigateListener: () => ipcRenderer.removeAllListeners('navigate'),
})

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
  },

  serviceOrders: {
    getAll:       ()              => ipcRenderer.invoke('serviceOrders:getAll'),
    getById:      (id)            => ipcRenderer.invoke('serviceOrders:getById', id),
    getByVehicle: (vehicleId)     => ipcRenderer.invoke('serviceOrders:getByVehicle', vehicleId),
    create:       (data)          => ipcRenderer.invoke('serviceOrders:create', data),
    update:       (id, data)      => ipcRenderer.invoke('serviceOrders:update', id, data),
    remove:       (id)            => ipcRenderer.invoke('serviceOrders:remove', id),
  },

  serviceItems: {
    getByOrder:    (orderId)       => ipcRenderer.invoke('serviceItems:getByOrder', orderId),
    create:        (orderId, data) => ipcRenderer.invoke('serviceItems:create', orderId, data),
    update:        (id, data)      => ipcRenderer.invoke('serviceItems:update', id, data),
    remove:        (id)            => ipcRenderer.invoke('serviceItems:remove', id),
    removeByOrder: (orderId)       => ipcRenderer.invoke('serviceItems:removeByOrder', orderId),
  },

  serviceParts: {
    getByOrder:    (orderId)       => ipcRenderer.invoke('serviceParts:getByOrder', orderId),
    create:        (orderId, data) => ipcRenderer.invoke('serviceParts:create', orderId, data),
    update:        (id, data)      => ipcRenderer.invoke('serviceParts:update', id, data),
    remove:        (id)            => ipcRenderer.invoke('serviceParts:remove', id),
    removeByOrder: (orderId)       => ipcRenderer.invoke('serviceParts:removeByOrder', orderId),
  },

  specialRecords: {
    getByVehicle: (vehicleId)       => ipcRenderer.invoke('specialRecords:getByVehicle', vehicleId),
    getByType:    (vehicleId, type) => ipcRenderer.invoke('specialRecords:getByType', vehicleId, type),
    create:       (data)            => ipcRenderer.invoke('specialRecords:create', data),
    update:       (id, data)        => ipcRenderer.invoke('specialRecords:update', id, data),
  },

  catalog: {
    getAll:  ()          => ipcRenderer.invoke('catalog:getAll'),
    search:  (query)     => ipcRenderer.invoke('catalog:search', query),
    create:  (data)      => ipcRenderer.invoke('catalog:create', data),
    update:  (id, data)  => ipcRenderer.invoke('catalog:update', id, data),
    remove:  (id)        => ipcRenderer.invoke('catalog:remove', id),
  },

  pdf: {
    serviceBook: (vehicleId) => ipcRenderer.invoke('pdf:serviceBook', vehicleId),
    order:       (orderId)   => ipcRenderer.invoke('pdf:order', orderId),
  },

  dashboard: {
    getStats:                 ()                       => ipcRenderer.invoke('dashboard:getStats'),
    getMonthlyRevenue:        (year)                   => ipcRenderer.invoke('dashboard:getMonthlyRevenue', year),
    getServiceTypeDistribution: ()                     => ipcRenderer.invoke('dashboard:getServiceTypeDistribution'),
    getRecentOrders:          ()                       => ipcRenderer.invoke('dashboard:getRecentOrders'),
    getUpcomingServices:      (days, kmThreshold)      => ipcRenderer.invoke('dashboard:getUpcomingServices', days, kmThreshold),
    getOverdueVehiclesCount:  ()                       => ipcRenderer.invoke('dashboard:getOverdueVehiclesCount'),
    globalSearch:             (query)                  => ipcRenderer.invoke('dashboard:globalSearch', query),
  },
})

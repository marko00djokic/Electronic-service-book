import { app, BrowserWindow, shell, Notification, ipcMain } from 'electron'
import { join } from 'path'
import { initDatabase } from './database.js'
import { registerIpcHandlers } from './ipc/index.js'
import { getDatabase as getDb } from './database.js'
import { startSyncService, stopSyncService } from './sync-service.js'

let mainWindow = null

function checkOverdueAndNotify() {
  try {
    const db = getDb()
    const row = db.prepare(`
      SELECT COUNT(DISTINCT v.id) as count
      FROM vehicles v
      JOIN service_orders so ON so.vehicle_id = v.id
      WHERE so.id = (
        SELECT id FROM service_orders WHERE vehicle_id = v.id ORDER BY reception_date DESC LIMIT 1
      )
      AND so.next_service_date IS NOT NULL
      AND so.next_service_date < date('now')
    `).get()

    const count = row?.count || 0
    if (count > 0 && Notification.isSupported()) {
      const notif = new Notification({
        title: 'Servisna knjižica — podsetnik',
        body: `${count} vozilo${count > 1 ? 'a' : ''} je prekoračilo rok za servis.`,
        silent: false
      })
      notif.on('click', () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
          mainWindow.webContents.send('navigate', '/reminders')
        }
      })
      notif.show()
    }
  } catch (_) {
    // Notifikacija nije kritična — ignorišemo grešku pri pokretanju
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Elektronska Servisna Knjizica',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Otvori eksterne linkove u sistemskom browser-u, ne u Electronu
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Proveri prekoračene rokove nakon što se renderer učita
  mainWindow.webContents.once('did-finish-load', () => {
    setTimeout(checkOverdueAndNotify, 2000)
  })
}

app.whenReady().then(() => {
  initDatabase()
  registerIpcHandlers()
  createWindow()
  startSyncService()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopSyncService()
  if (process.platform !== 'darwin') app.quit()
})

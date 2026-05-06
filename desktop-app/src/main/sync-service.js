import { net } from 'electron'
import { getDatabase } from './database.js'

const SYNC_INTERVAL_MS = 5 * 60 * 1000
const MAX_BATCH = 100
const MAX_ATTEMPTS = 5

let syncTimer = null
let isSyncing = false

export function startSyncService() {
  if (syncTimer) return
  syncTimer = setInterval(runSync, SYNC_INTERVAL_MS)
  // Pokušaj odmah pri pokretanju
  setTimeout(runSync, 10_000)
}

export function stopSyncService() {
  if (syncTimer) {
    clearInterval(syncTimer)
    syncTimer = null
  }
}

// Javna metoda za manualni trigger iz IPC handlera
export async function triggerSync() {
  return runSync()
}

export function getSyncStatus() {
  const db = getDatabase()
  const pending = db.prepare(`SELECT COUNT(*) as n FROM sync_queue WHERE status = 'pending'`).get()?.n ?? 0
  const failed  = db.prepare(`SELECT COUNT(*) as n FROM sync_queue WHERE status = 'failed'`).get()?.n ?? 0
  return { pending, failed, syncing: isSyncing }
}

async function runSync() {
  if (isSyncing) return
  if (!isOnline()) return

  const apiUrl  = process.env.VITE_API_URL
  const apiKey  = process.env.VITE_API_KEY
  const desktopId = process.env.VITE_DESKTOP_ID || 'desktop-1'

  if (!apiUrl || !apiKey) return

  isSyncing = true
  const db = getDatabase()

  try {
    const items = db.prepare(`
      SELECT * FROM sync_queue
      WHERE status = 'pending' AND attempts < ?
      ORDER BY created_at ASC
      LIMIT ?
    `).all(MAX_ATTEMPTS, MAX_BATCH)

    if (!items.length) return

    const ids = items.map(i => i.id)

    const response = await fetchWithTimeout(`${apiUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ desktop_id: desktopId, items }),
    }, 30_000)

    if (response.ok) {
      const placeholders = ids.map(() => '?').join(',')
      db.prepare(`DELETE FROM sync_queue WHERE id IN (${placeholders})`).run(...ids)
    } else {
      incrementAttempts(db, ids)
    }
  } catch (err) {
    console.error('Sync greška:', err.message)
    const ids = db.prepare(`
      SELECT id FROM sync_queue WHERE status = 'pending' AND attempts < ?
      ORDER BY created_at ASC LIMIT ?
    `).all(MAX_ATTEMPTS, MAX_BATCH).map(r => r.id)
    if (ids.length) incrementAttempts(db, ids)
  } finally {
    isSyncing = false
  }
}

function incrementAttempts(db, ids) {
  const placeholders = ids.map(() => '?').join(',')
  db.prepare(`
    UPDATE sync_queue
    SET attempts = attempts + 1,
        last_attempt_at = datetime('now'),
        status = CASE WHEN attempts + 1 >= ${MAX_ATTEMPTS} THEN 'failed' ELSE 'pending' END
    WHERE id IN (${placeholders})
  `).run(...ids)
}

function isOnline() {
  return net.isOnline()
}

function fetchWithTimeout(url, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    // Koristimo globalThis.fetch dostupan u Electron 28+ (Node 20)
    fetch(url, options)
      .then(r => { clearTimeout(timer); resolve(r) })
      .catch(e => { clearTimeout(timer); reject(e) })
  })
}

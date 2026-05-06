'use strict'

const express = require('express')
const router = express.Router()
const { requireApiKey } = require('../middleware/auth')
const pool = require('../db')

const MAX_BATCH = 100

// POST /ESK/api/sync — prima batch izmena od desktop app
router.post('/', requireApiKey, async (req, res) => {
  const { desktop_id, items } = req.body

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Batch je prazan ili nije array' })
  }
  if (items.length > MAX_BATCH) {
    return res.status(400).json({ error: `Batch prelazi limit od ${MAX_BATCH} stavki` })
  }

  const conn = await pool.getConnection()
  const results = { success: 0, failed: 0, errors: [] }

  try {
    await conn.beginTransaction()

    const [logResult] = await conn.query(
      'INSERT INTO sync_log (received_at, desktop_id, batch_size, status) VALUES (NOW(), ?, ?, ?)',
      [desktop_id || null, items.length, 'pending']
    )
    const logId = logResult.insertId

    for (const item of items) {
      try {
        await applyChange(conn, item)
        results.success++
      } catch (err) {
        results.failed++
        results.errors.push({ id: item.id, error: err.message })
      }
    }

    const finalStatus = results.failed === 0 ? 'success' : (results.success > 0 ? 'partial' : 'failed')
    await conn.query('UPDATE sync_log SET status = ? WHERE id = ?', [finalStatus, logId])

    await conn.commit()
    res.json({ received: items.length, ...results })
  } catch (err) {
    await conn.rollback()
    console.error('Sync greška:', err)
    res.status(500).json({ error: 'Greška pri obradi sync batch-a' })
  } finally {
    conn.release()
  }
})

async function applyChange(conn, item) {
  const { entity_type, operation, payload } = item
  const data = typeof payload === 'string' ? JSON.parse(payload) : payload
  const now = new Date()

  const tableMap = {
    vehicle: 'vehicles',
    owner: 'owners',
    ownership_history: 'ownership_history',
    service_order: 'service_orders',
    service_item: 'service_items',
    service_part: 'service_parts',
    special_record: 'special_records',
    parts_catalog: 'parts_catalog',
  }

  const table = tableMap[entity_type]
  if (!table) throw new Error(`Nepoznat entity_type: ${entity_type}`)

  data.synced_at = now

  if (operation === 'INSERT' || operation === 'UPDATE') {
    const cols = Object.keys(data)
    const vals = Object.values(data)
    const placeholders = cols.map(() => '?').join(', ')
    const updates = cols.map(c => `${c} = VALUES(${c})`).join(', ')
    await conn.query(
      `INSERT INTO \`${table}\` (${cols.join(', ')}) VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE ${updates}`,
      vals
    )
  } else if (operation === 'DELETE') {
    await conn.query(`DELETE FROM \`${table}\` WHERE id = ?`, [data.id])
  } else {
    throw new Error(`Nepoznata operacija: ${operation}`)
  }
}

module.exports = router

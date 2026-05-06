'use strict'

const pool = require('../db')

async function create({ desktop_id, batch_size, status }) {
  const [result] = await pool.query(
    'INSERT INTO sync_log (received_at, desktop_id, batch_size, status) VALUES (NOW(), ?, ?, ?)',
    [desktop_id, batch_size, status]
  )
  return result.insertId
}

async function updateStatus(id, status) {
  await pool.query('UPDATE sync_log SET status = ? WHERE id = ?', [status, id])
}

module.exports = { create, updateStatus }

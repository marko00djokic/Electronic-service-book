'use strict'

const pool = require('../db')

async function findByVehicle(vehicleId) {
  const [rows] = await pool.query(
    'SELECT * FROM service_orders WHERE vehicle_id = ? ORDER BY reception_date DESC',
    [vehicleId]
  )
  return rows
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM service_orders WHERE id = ?', [id])
  return rows[0] || null
}

module.exports = { findByVehicle, findById }

'use strict'

const pool = require('../db')

async function findByVin(vin) {
  const [rows] = await pool.query('SELECT * FROM vehicles WHERE vin = ?', [vin])
  return rows[0] || null
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id])
  return rows[0] || null
}

module.exports = { findByVin, findById }

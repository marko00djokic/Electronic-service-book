'use strict'

const express = require('express')
const router = express.Router()
const pool = require('../db')

// GET /ESK/api/vehicles/:vin — detalji vozila za web portal (javno)
router.get('/:vin', async (req, res) => {
  const { vin } = req.params
  if (!vin || vin.length !== 17) {
    return res.status(400).json({ error: 'VIN mora imati 17 karaktera' })
  }

  try {
    const [vehicles] = await pool.query(
      `SELECT id, vin, license_plate, make, model, year,
              engine_type, engine_displacement, engine_power,
              color, first_registration_date
       FROM vehicles WHERE vin = ?`,
      [vin.toUpperCase()]
    )
    if (!vehicles.length) return res.status(404).json({ error: 'Vozilo nije pronađeno' })

    const vehicle = vehicles[0]

    const [owners] = await pool.query(
      `SELECT o.first_name, o.last_name, oh.start_date, oh.end_date
       FROM ownership_history oh
       JOIN owners o ON o.id = oh.owner_id
       WHERE oh.vehicle_id = ?
       ORDER BY oh.start_date DESC`,
      [vehicle.id]
    )

    res.json({ vehicle, owners })
  } catch (err) {
    console.error('Greška pri dohvatanju vozila:', err)
    res.status(500).json({ error: 'Greška servera' })
  }
})

module.exports = router

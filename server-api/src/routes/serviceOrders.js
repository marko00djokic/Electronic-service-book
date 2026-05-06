'use strict'

const express = require('express')
const router = express.Router()
const pool = require('../db')

// GET /ESK/api/service-orders/:vehicleId — servisna istorija za web portal (javno)
router.get('/:vehicleId', async (req, res) => {
  const vehicleId = parseInt(req.params.vehicleId, 10)
  if (isNaN(vehicleId)) return res.status(400).json({ error: 'Nevažeći vehicleId' })

  try {
    const [orders] = await pool.query(
      `SELECT id, order_number, reception_date, mileage_in, service_type,
              labor_cost, parts_cost, materials_cost, total_cost,
              technician_notes, recommendations,
              next_service_date, next_service_mileage, status
       FROM service_orders
       WHERE vehicle_id = ?
       ORDER BY reception_date DESC`,
      [vehicleId]
    )

    if (!orders.length) return res.json([])

    const orderIds = orders.map(o => o.id)

    const [items] = await pool.query(
      `SELECT order_id, name, hours, hourly_rate, total
       FROM service_items WHERE order_id IN (?)`,
      [orderIds]
    )

    const [parts] = await pool.query(
      `SELECT order_id, name, oem_number, category, quantity, unit, unit_price, total
       FROM service_parts WHERE order_id IN (?)`,
      [orderIds]
    )

    const ordersWithDetails = orders.map(order => ({
      ...order,
      items: items.filter(i => i.order_id === order.id),
      parts: parts.filter(p => p.order_id === order.id),
    }))

    res.json(ordersWithDetails)
  } catch (err) {
    console.error('Greška pri dohvatanju naloga:', err)
    res.status(500).json({ error: 'Greška servera' })
  }
})

module.exports = router

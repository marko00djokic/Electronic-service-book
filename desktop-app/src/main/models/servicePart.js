import { getDatabase } from '../database.js'

export function getByOrder(orderId) {
  const db = getDatabase()
  return db.prepare('SELECT * FROM service_parts WHERE order_id = ? ORDER BY id').all(orderId)
}

export function create(orderId, data) {
  const db = getDatabase()
  const { name, oem_number, category, quantity, unit, unit_price, catalog_id } = data
  const total = (Number(quantity) || 1) * (Number(unit_price) || 0)
  const result = db.prepare(`
    INSERT INTO service_parts (order_id, name, oem_number, category, quantity, unit, unit_price, total, catalog_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId, name, oem_number || null, category || 'part',
    Number(quantity) || 1, unit || 'kom', Number(unit_price) || 0, total, catalog_id || null
  )
  return db.prepare('SELECT * FROM service_parts WHERE id = ?').get(result.lastInsertRowid)
}

export function update(id, data) {
  const db = getDatabase()
  const { name, oem_number, category, quantity, unit, unit_price, catalog_id } = data
  const total = (Number(quantity) || 1) * (Number(unit_price) || 0)
  db.prepare(`
    UPDATE service_parts SET
      name = ?, oem_number = ?, category = ?, quantity = ?, unit = ?, unit_price = ?, total = ?, catalog_id = ?
    WHERE id = ?
  `).run(
    name, oem_number || null, category || 'part',
    Number(quantity) || 1, unit || 'kom', Number(unit_price) || 0, total, catalog_id || null,
    id
  )
  return db.prepare('SELECT * FROM service_parts WHERE id = ?').get(id)
}

export function remove(id) {
  const db = getDatabase()
  db.prepare('DELETE FROM service_parts WHERE id = ?').run(id)
  return { success: true }
}

export function removeByOrder(orderId) {
  const db = getDatabase()
  db.prepare('DELETE FROM service_parts WHERE order_id = ?').run(orderId)
  return { success: true }
}

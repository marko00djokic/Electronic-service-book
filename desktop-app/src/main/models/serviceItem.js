import { getDatabase } from '../database.js'

export function getByOrder(orderId) {
  const db = getDatabase()
  return db.prepare('SELECT * FROM service_items WHERE order_id = ? ORDER BY id').all(orderId)
}

export function create(orderId, data) {
  const db = getDatabase()
  const { name, hours, hourly_rate, catalog_id } = data
  const total = (Number(hours) || 0) * (Number(hourly_rate) || 0)
  const result = db.prepare(`
    INSERT INTO service_items (order_id, name, hours, hourly_rate, total, catalog_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(orderId, name, Number(hours) || 0, Number(hourly_rate) || 0, total, catalog_id || null)
  return db.prepare('SELECT * FROM service_items WHERE id = ?').get(result.lastInsertRowid)
}

export function update(id, data) {
  const db = getDatabase()
  const { name, hours, hourly_rate, catalog_id } = data
  const total = (Number(hours) || 0) * (Number(hourly_rate) || 0)
  db.prepare(`
    UPDATE service_items SET name = ?, hours = ?, hourly_rate = ?, total = ?, catalog_id = ? WHERE id = ?
  `).run(name, Number(hours) || 0, Number(hourly_rate) || 0, total, catalog_id || null, id)
  return db.prepare('SELECT * FROM service_items WHERE id = ?').get(id)
}

export function remove(id) {
  const db = getDatabase()
  db.prepare('DELETE FROM service_items WHERE id = ?').run(id)
  return { success: true }
}

export function removeByOrder(orderId) {
  const db = getDatabase()
  db.prepare('DELETE FROM service_items WHERE order_id = ?').run(orderId)
  return { success: true }
}

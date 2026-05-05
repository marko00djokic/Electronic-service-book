import { getDatabase } from '../database.js'

export function getAll() {
  const db = getDatabase()
  return db.prepare('SELECT * FROM parts_catalog ORDER BY category, name').all()
}

export function search(query) {
  const db = getDatabase()
  const q = `%${query}%`
  return db.prepare(`
    SELECT * FROM parts_catalog
    WHERE name LIKE ? OR oem_number LIKE ?
    ORDER BY category, name
  `).all(q, q)
}

export function create(data) {
  const db = getDatabase()
  const { name, oem_number, category, unit, price, notes } = data
  const result = db.prepare(`
    INSERT INTO parts_catalog (name, oem_number, category, unit, price, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name, oem_number || null, category || 'part', unit || 'kom',
    Number(price) || 0, notes || null
  )
  return db.prepare('SELECT * FROM parts_catalog WHERE id = ?').get(result.lastInsertRowid)
}

export function update(id, data) {
  const db = getDatabase()
  const { name, oem_number, category, unit, price, notes } = data
  db.prepare(`
    UPDATE parts_catalog SET name = ?, oem_number = ?, category = ?, unit = ?, price = ?, notes = ? WHERE id = ?
  `).run(
    name, oem_number || null, category || 'part', unit || 'kom',
    Number(price) || 0, notes || null, id
  )
  return db.prepare('SELECT * FROM parts_catalog WHERE id = ?').get(id)
}

export function remove(id) {
  const db = getDatabase()
  db.prepare('DELETE FROM parts_catalog WHERE id = ?').run(id)
  return { success: true }
}

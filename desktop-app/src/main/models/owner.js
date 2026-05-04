import { getDatabase } from '../database.js'

export function getAll() {
  const db = getDatabase()
  return db.prepare('SELECT * FROM owners ORDER BY last_name, first_name').all()
}

export function getById(id) {
  const db = getDatabase()
  return db.prepare('SELECT * FROM owners WHERE id = ?').get(id)
}

export function create(data) {
  const db = getDatabase()
  const { first_name, last_name, phone, email, address, city } = data
  const result = db.prepare(`
    INSERT INTO owners (first_name, last_name, phone, email, address, city)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    first_name, last_name,
    phone || null, email || null, address || null, city || null
  )
  return getById(result.lastInsertRowid)
}

export function update(id, data) {
  const db = getDatabase()
  const { first_name, last_name, phone, email, address, city } = data
  db.prepare(`
    UPDATE owners SET
      first_name = ?, last_name = ?, phone = ?, email = ?,
      address = ?, city = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    first_name, last_name,
    phone || null, email || null, address || null, city || null,
    id
  )
  return getById(id)
}

export function remove(id) {
  const db = getDatabase()
  const run = db.transaction(() => {
    const active = db.prepare(`
      SELECT COUNT(*) AS count FROM ownership_history
      WHERE owner_id = ? AND end_date IS NULL
    `).get(id)
    if (active.count > 0) {
      throw new Error('Vlasnik ima aktivno vozilo i ne može biti obrisan')
    }
    db.prepare('DELETE FROM owners WHERE id = ?').run(id)
  })
  run()
  return { success: true }
}

export function search(query) {
  const db = getDatabase()
  const q = `%${query}%`
  return db.prepare(`
    SELECT * FROM owners
    WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?
    ORDER BY last_name, first_name
  `).all(q, q, q)
}

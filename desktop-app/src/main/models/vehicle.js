import { getDatabase } from '../database.js'

export function getAll() {
  const db = getDatabase()
  return db.prepare(`
    SELECT v.*,
           o.first_name || ' ' || o.last_name AS current_owner_name,
           o.id AS current_owner_id
    FROM vehicles v
    LEFT JOIN ownership_history oh ON oh.vehicle_id = v.id AND oh.end_date IS NULL
    LEFT JOIN owners o ON o.id = oh.owner_id
    ORDER BY v.make, v.model
  `).all()
}

export function getById(id) {
  const db = getDatabase()
  return db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id)
}

export function create(data) {
  const db = getDatabase()
  const { vin, license_plate, make, model, year, engine_type,
          engine_displacement, engine_power, color, first_registration_date, notes } = data
  const result = db.prepare(`
    INSERT INTO vehicles
      (vin, license_plate, make, model, year, engine_type,
       engine_displacement, engine_power, color, first_registration_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    vin.toUpperCase(), license_plate || null, make, model, year,
    engine_type || null, engine_displacement || null, engine_power || null,
    color || null, first_registration_date || null, notes || null
  )
  return getById(result.lastInsertRowid)
}

export function update(id, data) {
  const db = getDatabase()
  const { vin, license_plate, make, model, year, engine_type,
          engine_displacement, engine_power, color, first_registration_date, notes } = data
  db.prepare(`
    UPDATE vehicles SET
      vin = ?, license_plate = ?, make = ?, model = ?, year = ?,
      engine_type = ?, engine_displacement = ?, engine_power = ?,
      color = ?, first_registration_date = ?, notes = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    vin.toUpperCase(), license_plate || null, make, model, year,
    engine_type || null, engine_displacement || null, engine_power || null,
    color || null, first_registration_date || null, notes || null,
    id
  )
  return getById(id)
}

export function remove(id) {
  const db = getDatabase()
  const run = db.transaction(() => {
    db.prepare('DELETE FROM ownership_history WHERE vehicle_id = ?').run(id)
    db.prepare('DELETE FROM vehicles WHERE id = ?').run(id)
  })
  run()
  return { success: true }
}

export function search(query) {
  const db = getDatabase()
  const q = `%${query}%`
  return db.prepare(`
    SELECT v.*,
           o.first_name || ' ' || o.last_name AS current_owner_name,
           o.id AS current_owner_id
    FROM vehicles v
    LEFT JOIN ownership_history oh ON oh.vehicle_id = v.id AND oh.end_date IS NULL
    LEFT JOIN owners o ON o.id = oh.owner_id
    WHERE v.vin LIKE ? OR v.make LIKE ? OR v.model LIKE ? OR v.license_plate LIKE ?
    ORDER BY v.make, v.model
  `).all(q, q, q, q)
}

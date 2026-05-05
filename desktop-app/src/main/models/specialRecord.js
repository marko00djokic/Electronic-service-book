import { getDatabase } from '../database.js'

export function getByVehicle(vehicleId) {
  const db = getDatabase()
  return db.prepare(`
    SELECT * FROM special_records WHERE vehicle_id = ? ORDER BY record_date DESC
  `).all(vehicleId)
}

export function getByType(vehicleId, type) {
  const db = getDatabase()
  return db.prepare(`
    SELECT * FROM special_records WHERE vehicle_id = ? AND record_type = ? ORDER BY record_date DESC
  `).all(vehicleId, type)
}

export function create(data) {
  const db = getDatabase()
  const { vehicle_id, order_id, record_type, data: recordData, record_date, mileage, notes } = data
  const result = db.prepare(`
    INSERT INTO special_records (vehicle_id, order_id, record_type, data, record_date, mileage, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    vehicle_id, order_id || null, record_type,
    typeof recordData === 'string' ? recordData : JSON.stringify(recordData),
    record_date, mileage || null, notes || null
  )
  return db.prepare('SELECT * FROM special_records WHERE id = ?').get(result.lastInsertRowid)
}

export function update(id, data) {
  const db = getDatabase()
  const { record_type, data: recordData, record_date, mileage, notes } = data
  db.prepare(`
    UPDATE special_records SET record_type = ?, data = ?, record_date = ?, mileage = ?, notes = ? WHERE id = ?
  `).run(
    record_type,
    typeof recordData === 'string' ? recordData : JSON.stringify(recordData),
    record_date, mileage || null, notes || null, id
  )
  return db.prepare('SELECT * FROM special_records WHERE id = ?').get(id)
}

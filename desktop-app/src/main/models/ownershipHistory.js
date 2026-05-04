import { getDatabase } from '../database.js'

export function getByVehicle(vehicleId) {
  const db = getDatabase()
  return db.prepare(`
    SELECT oh.*,
           o.first_name || ' ' || o.last_name AS owner_name,
           o.phone AS owner_phone
    FROM ownership_history oh
    JOIN owners o ON o.id = oh.owner_id
    WHERE oh.vehicle_id = ?
    ORDER BY oh.start_date DESC
  `).all(vehicleId)
}

export function getByOwner(ownerId) {
  const db = getDatabase()
  return db.prepare(`
    SELECT oh.*,
           v.make, v.model, v.year, v.vin, v.license_plate
    FROM ownership_history oh
    JOIN vehicles v ON v.id = oh.vehicle_id
    WHERE oh.owner_id = ?
    ORDER BY oh.start_date DESC
  `).all(ownerId)
}

export function addOwner(vehicleId, ownerId, startDate) {
  const db = getDatabase()
  const run = db.transaction(() => {
    db.prepare(`
      UPDATE ownership_history SET end_date = ?
      WHERE vehicle_id = ? AND end_date IS NULL
    `).run(startDate, vehicleId)
    const result = db.prepare(`
      INSERT INTO ownership_history (vehicle_id, owner_id, start_date)
      VALUES (?, ?, ?)
    `).run(vehicleId, ownerId, startDate)
    return result.lastInsertRowid
  })
  return run()
}

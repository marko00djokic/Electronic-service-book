import { getDatabase } from '../database.js'

function generateOrderNumber(db) {
  const year = new Date().getFullYear()
  const prefix = `SO-${year}-`
  const last = db.prepare(
    "SELECT order_number FROM service_orders WHERE order_number LIKE ? ORDER BY order_number DESC LIMIT 1"
  ).get(`${prefix}%`)
  if (!last) return `${prefix}0001`
  const lastNum = parseInt(last.order_number.split('-')[2], 10)
  return `${prefix}${String(lastNum + 1).padStart(4, '0')}`
}

export function getAll() {
  const db = getDatabase()
  return db.prepare(`
    SELECT so.*,
           v.make, v.model, v.license_plate, v.vin,
           o.first_name || ' ' || o.last_name AS owner_name
    FROM service_orders so
    LEFT JOIN vehicles v ON v.id = so.vehicle_id
    LEFT JOIN owners o ON o.id = so.owner_id
    ORDER BY so.reception_date DESC, so.created_at DESC
  `).all()
}

export function getById(id) {
  const db = getDatabase()
  return db.prepare(`
    SELECT so.*,
           v.make, v.model, v.license_plate, v.vin, v.year AS vehicle_year,
           v.engine_type, v.engine_displacement, v.engine_power,
           o.first_name || ' ' || o.last_name AS owner_name,
           o.phone AS owner_phone, o.email AS owner_email
    FROM service_orders so
    LEFT JOIN vehicles v ON v.id = so.vehicle_id
    LEFT JOIN owners o ON o.id = so.owner_id
    WHERE so.id = ?
  `).get(id)
}

export function getByVehicle(vehicleId) {
  const db = getDatabase()
  return db.prepare(`
    SELECT so.*,
           o.first_name || ' ' || o.last_name AS owner_name
    FROM service_orders so
    LEFT JOIN owners o ON o.id = so.owner_id
    WHERE so.vehicle_id = ?
    ORDER BY so.reception_date DESC
  `).all(vehicleId)
}

export function create(data) {
  const db = getDatabase()
  const orderNumber = generateOrderNumber(db)
  const {
    vehicle_id, owner_id, reception_date, mileage_in, service_type,
    labor_cost, parts_cost, materials_cost, total_cost, vat_rate,
    invoice_number, technician_notes, recommendations,
    next_service_date, next_service_mileage, status
  } = data

  const result = db.prepare(`
    INSERT INTO service_orders
      (vehicle_id, owner_id, order_number, reception_date, mileage_in, service_type,
       labor_cost, parts_cost, materials_cost, total_cost, vat_rate,
       invoice_number, technician_notes, recommendations,
       next_service_date, next_service_mileage, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    vehicle_id, owner_id || null, orderNumber, reception_date, mileage_in || null, service_type,
    labor_cost || 0, parts_cost || 0, materials_cost || 0, total_cost || 0, vat_rate || 20,
    invoice_number || null, technician_notes || null, recommendations || null,
    next_service_date || null, next_service_mileage || null, status || 'open'
  )
  return getById(result.lastInsertRowid)
}

export function update(id, data) {
  const db = getDatabase()
  const {
    vehicle_id, owner_id, reception_date, mileage_in, service_type,
    labor_cost, parts_cost, materials_cost, total_cost, vat_rate,
    invoice_number, technician_notes, recommendations,
    next_service_date, next_service_mileage, status
  } = data

  db.prepare(`
    UPDATE service_orders SET
      vehicle_id = ?, owner_id = ?, reception_date = ?, mileage_in = ?, service_type = ?,
      labor_cost = ?, parts_cost = ?, materials_cost = ?, total_cost = ?, vat_rate = ?,
      invoice_number = ?, technician_notes = ?, recommendations = ?,
      next_service_date = ?, next_service_mileage = ?, status = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    vehicle_id, owner_id || null, reception_date, mileage_in || null, service_type,
    labor_cost || 0, parts_cost || 0, materials_cost || 0, total_cost || 0, vat_rate || 20,
    invoice_number || null, technician_notes || null, recommendations || null,
    next_service_date || null, next_service_mileage || null, status || 'open',
    id
  )
  return getById(id)
}

export function remove(id) {
  const db = getDatabase()
  db.transaction(() => {
    db.prepare('DELETE FROM service_items WHERE order_id = ?').run(id)
    db.prepare('DELETE FROM service_parts WHERE order_id = ?').run(id)
    db.prepare('DELETE FROM special_records WHERE order_id = ?').run(id)
    db.prepare('DELETE FROM service_orders WHERE id = ?').run(id)
  })()
  return { success: true }
}

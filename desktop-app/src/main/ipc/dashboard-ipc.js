import { ipcMain } from 'electron'
import { getDatabase as getDb } from '../database.js'

export function registerDashboardHandlers() {
  ipcMain.handle('dashboard:getStats', () => {
    const db = getDb()

    const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles').get().count

    const now = new Date()
    const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const ordersThisMonth = db.prepare(
      "SELECT COUNT(*) as count FROM service_orders WHERE reception_date >= ?"
    ).get(firstOfMonth).count

    const revenueThisMonth = db.prepare(
      "SELECT COALESCE(SUM(total_cost), 0) as total FROM service_orders WHERE reception_date >= ? AND status = 'closed'"
    ).get(firstOfMonth).total

    const upcomingCount = db.prepare(`
      SELECT COUNT(DISTINCT v.id) as count
      FROM vehicles v
      JOIN service_orders so ON so.vehicle_id = v.id
      WHERE so.id = (
        SELECT id FROM service_orders
        WHERE vehicle_id = v.id
        ORDER BY reception_date DESC
        LIMIT 1
      )
      AND (
        (so.next_service_date IS NOT NULL AND so.next_service_date <= date('now', '+30 days'))
        OR (so.next_service_mileage IS NOT NULL AND so.mileage_in IS NOT NULL AND so.next_service_mileage - so.mileage_in <= 500)
      )
    `).get().count

    return { totalVehicles, ordersThisMonth, revenueThisMonth, upcomingCount }
  })

  ipcMain.handle('dashboard:getMonthlyRevenue', (_, year) => {
    const db = getDb()
    const targetYear = year || new Date().getFullYear()

    const rows = db.prepare(`
      SELECT
        strftime('%m', reception_date) as month,
        COALESCE(SUM(total_cost), 0) as revenue
      FROM service_orders
      WHERE strftime('%Y', reception_date) = ? AND status = 'closed'
      GROUP BY month
      ORDER BY month
    `).all(String(targetYear))

    const months = ['01','02','03','04','05','06','07','08','09','10','11','12']
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Avg','Sep','Okt','Nov','Dec']
    return months.map((m, i) => {
      const found = rows.find(r => r.month === m)
      return { month: MONTH_NAMES[i], revenue: found ? found.revenue : 0 }
    })
  })

  ipcMain.handle('dashboard:getServiceTypeDistribution', () => {
    const db = getDb()
    const rows = db.prepare(`
      SELECT service_type, COUNT(*) as count
      FROM service_orders
      GROUP BY service_type
      ORDER BY count DESC
    `).all()

    const LABELS = {
      mali: 'Mali servis',
      veliki: 'Veliki servis',
      vanredni: 'Vanredni',
      garantni: 'Garantni'
    }
    return rows.map(r => ({ name: LABELS[r.service_type] || r.service_type, value: r.count }))
  })

  ipcMain.handle('dashboard:getRecentOrders', () => {
    const db = getDb()
    return db.prepare(`
      SELECT
        so.id, so.order_number, so.reception_date, so.service_type,
        so.total_cost, so.status,
        v.make, v.model, v.license_plate,
        o.first_name || ' ' || o.last_name as owner_name
      FROM service_orders so
      JOIN vehicles v ON v.id = so.vehicle_id
      LEFT JOIN owners o ON o.id = so.owner_id
      ORDER BY so.created_at DESC
      LIMIT 5
    `).all()
  })

  ipcMain.handle('dashboard:getUpcomingServices', (_, days = 30, kmThreshold = 500) => {
    const db = getDb()
    return db.prepare(`
      SELECT
        v.id as vehicle_id, v.make, v.model, v.license_plate, v.vin,
        o.first_name || ' ' || o.last_name as owner_name,
        o.phone as owner_phone,
        so.id as last_order_id,
        so.reception_date as last_service_date,
        so.mileage_in as last_mileage,
        so.next_service_date,
        so.next_service_mileage
      FROM vehicles v
      LEFT JOIN (
        SELECT oh.vehicle_id, ow.first_name, ow.last_name, ow.phone
        FROM ownership_history oh
        JOIN owners ow ON ow.id = oh.owner_id
        WHERE oh.end_date IS NULL
      ) o ON o.vehicle_id = v.id
      JOIN service_orders so ON so.vehicle_id = v.id
      WHERE so.id = (
        SELECT id FROM service_orders WHERE vehicle_id = v.id ORDER BY reception_date DESC LIMIT 1
      )
      AND (
        (so.next_service_date IS NOT NULL AND so.next_service_date <= date('now', '+' || ? || ' days'))
        OR (so.next_service_mileage IS NOT NULL AND so.mileage_in IS NOT NULL AND so.next_service_mileage - so.mileage_in <= ?)
      )
      ORDER BY so.next_service_date ASC NULLS LAST
    `).all(days, kmThreshold)
  })

  ipcMain.handle('dashboard:getOverdueVehiclesCount', () => {
    const db = getDb()
    const row = db.prepare(`
      SELECT COUNT(DISTINCT v.id) as count
      FROM vehicles v
      JOIN service_orders so ON so.vehicle_id = v.id
      WHERE so.id = (
        SELECT id FROM service_orders WHERE vehicle_id = v.id ORDER BY reception_date DESC LIMIT 1
      )
      AND so.next_service_date IS NOT NULL
      AND so.next_service_date < date('now')
    `).get()
    return row.count
  })

  ipcMain.handle('dashboard:globalSearch', (_, query) => {
    if (!query || query.trim().length < 2) return { vehicles: [], owners: [], orders: [] }
    const db = getDb()
    const like = `%${query.trim()}%`

    const vehicles = db.prepare(`
      SELECT id, make, model, license_plate, vin
      FROM vehicles
      WHERE make LIKE ? OR model LIKE ? OR license_plate LIKE ? OR vin LIKE ?
      LIMIT 5
    `).all(like, like, like, like)

    const owners = db.prepare(`
      SELECT id, first_name, last_name, phone
      FROM owners
      WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?
         OR (first_name || ' ' || last_name) LIKE ?
      LIMIT 5
    `).all(like, like, like, like)

    const orders = db.prepare(`
      SELECT so.id, so.order_number, so.reception_date, so.service_type,
             v.make, v.model, v.license_plate
      FROM service_orders so
      JOIN vehicles v ON v.id = so.vehicle_id
      WHERE so.order_number LIKE ?
         OR v.license_plate LIKE ? OR v.vin LIKE ?
      LIMIT 5
    `).all(like, like, like)

    return { vehicles, owners, orders }
  })
}

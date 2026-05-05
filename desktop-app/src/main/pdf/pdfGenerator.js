import { jsPDF } from 'jspdf'
import { getDatabase } from '../database.js'

const MARGIN = 14
const LINE_H = 7

function initDoc() {
  return new jsPDF({ unit: 'mm', format: 'a4' })
}

function header(doc, title) {
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, MARGIN, 20)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, 23, 200, 23)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
}

function row(doc, label, value, y) {
  doc.setFont('helvetica', 'bold')
  doc.text(label + ':', MARGIN, y)
  doc.setFont('helvetica', 'normal')
  doc.text(String(value || '—'), 65, y)
  return y + LINE_H
}

function tableHeader(doc, cols, y) {
  doc.setFillColor(240, 240, 240)
  doc.rect(MARGIN, y - 5, 182, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  let x = MARGIN
  for (const col of cols) {
    doc.text(col.label, x + 1, y)
    x += col.w
  }
  doc.setFont('helvetica', 'normal')
  return y + LINE_H
}

function tableRow(doc, cols, values, y) {
  let x = MARGIN
  doc.setFontSize(9)
  for (let i = 0; i < cols.length; i++) {
    const val = String(values[i] ?? '—')
    doc.text(val.length > 30 ? val.slice(0, 28) + '..' : val, x + 1, y)
    x += cols[i].w
  }
  doc.line(MARGIN, y + 2, 196, y + 2)
  return y + LINE_H
}

export function generateServiceBookPdf(vehicleId) {
  const db = getDatabase()
  const vehicle = db.prepare(`
    SELECT v.*, o.first_name || ' ' || o.last_name AS owner_name, o.phone AS owner_phone
    FROM vehicles v
    LEFT JOIN ownership_history oh ON oh.vehicle_id = v.id AND oh.end_date IS NULL
    LEFT JOIN owners o ON o.id = oh.owner_id
    WHERE v.id = ?
  `).get(vehicleId)

  const orders = db.prepare(`
    SELECT * FROM service_orders WHERE vehicle_id = ? ORDER BY reception_date DESC
  `).all(vehicleId)

  const specialRecords = db.prepare(`
    SELECT * FROM special_records WHERE vehicle_id = ? ORDER BY record_date DESC
  `).all(vehicleId)

  const doc = initDoc()
  header(doc, 'Servisna knjizica vozila')

  let y = 32
  doc.setFontSize(10)
  y = row(doc, 'Vozilo', vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : '—', y)
  y = row(doc, 'VIN', vehicle?.vin, y)
  y = row(doc, 'Registracija', vehicle?.license_plate, y)
  y = row(doc, 'Motor', vehicle?.engine_type, y)
  y = row(doc, 'Vlasnik', vehicle?.owner_name, y)
  y = row(doc, 'Telefon', vehicle?.owner_phone, y)
  y += 4

  // Tabela naloga
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Servisni nalozi', MARGIN, y)
  doc.setFont('helvetica', 'normal')
  y += 6

  const orderCols = [
    { label: 'Broj naloga', w: 38 },
    { label: 'Datum', w: 28 },
    { label: 'Km', w: 22 },
    { label: 'Tip servisa', w: 40 },
    { label: 'Status', w: 25 },
    { label: 'Ukupno', w: 29 },
  ]

  y = tableHeader(doc, orderCols, y)
  for (const o of orders) {
    if (y > 270) { doc.addPage(); y = 20 }
    y = tableRow(doc, orderCols, [
      o.order_number, o.reception_date, o.mileage_in,
      o.service_type, o.status, `${(o.total_cost || 0).toFixed(2)} RSD`
    ], y)
  }
  y += 6

  // Specijalne evidencije po tipu
  const types = [...new Set(specialRecords.map(r => r.record_type))]
  for (const type of types) {
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`Evidencija: ${type}`, MARGIN, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    const recs = specialRecords.filter(r => r.record_type === type)
    for (const rec of recs) {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.setFontSize(9)
      let dataStr = ''
      try { dataStr = JSON.stringify(JSON.parse(rec.data)) } catch { dataStr = rec.data }
      doc.text(`${rec.record_date}  km: ${rec.mileage || '—'}  ${dataStr}`, MARGIN + 4, y)
      y += LINE_H
    }
    y += 3
  }

  return doc.output('arraybuffer')
}

export function generateOrderPdf(orderId) {
  const db = getDatabase()
  const order = db.prepare(`
    SELECT so.*,
           v.make, v.model, v.license_plate, v.vin, v.year AS vehicle_year,
           o.first_name || ' ' || o.last_name AS owner_name,
           o.phone AS owner_phone
    FROM service_orders so
    LEFT JOIN vehicles v ON v.id = so.vehicle_id
    LEFT JOIN owners o ON o.id = so.owner_id
    WHERE so.id = ?
  `).get(orderId)

  const items = db.prepare('SELECT * FROM service_items WHERE order_id = ? ORDER BY id').all(orderId)
  const parts = db.prepare('SELECT * FROM service_parts WHERE order_id = ? ORDER BY id').all(orderId)

  const doc = initDoc()
  header(doc, `Servisni nalog ${order?.order_number || orderId}`)

  let y = 32
  y = row(doc, 'Vozilo', order ? `${order.make} ${order.model} (${order.vehicle_year})` : '—', y)
  y = row(doc, 'VIN', order?.vin, y)
  y = row(doc, 'Registracija', order?.license_plate, y)
  y = row(doc, 'Vlasnik', order?.owner_name, y)
  y = row(doc, 'Telefon', order?.owner_phone, y)
  y = row(doc, 'Datum prijema', order?.reception_date, y)
  y = row(doc, 'Kilometraza', order?.mileage_in ? `${order.mileage_in} km` : '—', y)
  y = row(doc, 'Vrsta servisa', order?.service_type, y)
  if (order?.invoice_number) y = row(doc, 'Broj fakture', order.invoice_number, y)
  y += 4

  // Tabela radova
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Obavljeni radovi', MARGIN, y)
  doc.setFont('helvetica', 'normal')
  y += 6

  const itemCols = [
    { label: 'Naziv rada', w: 80 },
    { label: 'Sati', w: 22 },
    { label: 'Cena/h', w: 30 },
    { label: 'Ukupno', w: 50 },
  ]
  y = tableHeader(doc, itemCols, y)
  for (const item of items) {
    if (y > 270) { doc.addPage(); y = 20 }
    y = tableRow(doc, itemCols, [
      item.name, item.hours, `${(item.hourly_rate || 0).toFixed(2)}`,
      `${(item.total || 0).toFixed(2)} RSD`
    ], y)
  }
  if (items.length === 0) { doc.setFontSize(9); doc.text('Nema unetih radova.', MARGIN + 2, y); y += LINE_H }
  y += 4

  // Tabela delova
  if (y > 240) { doc.addPage(); y = 20 }
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Ugradeni delovi i materijali', MARGIN, y)
  doc.setFont('helvetica', 'normal')
  y += 6

  const partCols = [
    { label: 'Naziv', w: 55 },
    { label: 'OEM', w: 35 },
    { label: 'Kol.', w: 15 },
    { label: 'Jed.', w: 15 },
    { label: 'Cena/jed.', w: 30 },
    { label: 'Ukupno', w: 32 },
  ]
  y = tableHeader(doc, partCols, y)
  for (const part of parts) {
    if (y > 270) { doc.addPage(); y = 20 }
    y = tableRow(doc, partCols, [
      part.name, part.oem_number, part.quantity, part.unit,
      `${(part.unit_price || 0).toFixed(2)}`, `${(part.total || 0).toFixed(2)} RSD`
    ], y)
  }
  if (parts.length === 0) { doc.setFontSize(9); doc.text('Nema unetih delova.', MARGIN + 2, y); y += LINE_H }
  y += 6

  // Finansijski sumar
  if (y > 240) { doc.addPage(); y = 20 }
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Finansijski sumar', MARGIN, y)
  y += 6
  doc.setFontSize(10)
  y = row(doc, 'Radovi', `${(order?.labor_cost || 0).toFixed(2)} RSD`, y)
  y = row(doc, 'Delovi', `${(order?.parts_cost || 0).toFixed(2)} RSD`, y)
  y = row(doc, 'Materijali', `${(order?.materials_cost || 0).toFixed(2)} RSD`, y)
  y = row(doc, 'PDV', `${order?.vat_rate || 20}%`, y)
  doc.setFont('helvetica', 'bold')
  y = row(doc, 'UKUPNO', `${(order?.total_cost || 0).toFixed(2)} RSD`, y)
  y += 6

  // Napomene
  if (order?.technician_notes) {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Napomene servisera:', MARGIN, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    const lines = doc.splitTextToSize(order.technician_notes, 180)
    doc.text(lines, MARGIN, y)
    y += lines.length * 5 + 3
  }
  if (order?.recommendations) {
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Preporuke:', MARGIN, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    const lines = doc.splitTextToSize(order.recommendations, 180)
    doc.text(lines, MARGIN, y)
    y += lines.length * 5 + 3
  }
  if (order?.next_service_date || order?.next_service_mileage) {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Sledeci servis:', MARGIN, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    if (order.next_service_date) { doc.text(`Datum: ${order.next_service_date}`, MARGIN + 4, y); y += LINE_H }
    if (order.next_service_mileage) { doc.text(`Kilometraza: ${order.next_service_mileage} km`, MARGIN + 4, y); y += LINE_H }
  }

  return doc.output('arraybuffer')
}

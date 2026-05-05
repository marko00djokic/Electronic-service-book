import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Select from 'react-select'

const TABS = ['Osnovno', 'Radovi', 'Delovi', 'Finansije', 'Preporuke']

const EMPTY_FIELDS = {
  vehicle_id: '', owner_id: '', owner_name: '',
  reception_date: new Date().toISOString().slice(0, 10),
  mileage_in: '', service_type: 'mali', vat_rate: '20',
  invoice_number: '', status: 'open',
}
const EMPTY_REC = { technician_notes: '', recommendations: '', next_service_date: '', next_service_mileage: '' }
const EMPTY_ITEM = () => ({ _key: Math.random(), name: '', hours: '', hourly_rate: '', catalog_id: null })
const EMPTY_PART = () => ({ _key: Math.random(), name: '', oem_number: '', category: 'part', quantity: '1', unit: 'kom', unit_price: '', catalog_id: null })

function computeFinancials(items, parts, vatRate) {
  const labor = items.reduce((s, i) => s + (Number(i.hours) || 0) * (Number(i.hourly_rate) || 0), 0)
  const partsTotal = parts.filter(p => p.category === 'part').reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.unit_price) || 0), 0)
  const materials = parts.filter(p => p.category === 'material').reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.unit_price) || 0), 0)
  const subtotal = labor + partsTotal + materials
  const vat = vatRate / 100
  const total = subtotal * (1 + vat)
  return { labor, partsTotal, materials, subtotal, total }
}

function ItemRow({ item, onChange, onRemove, catalogOptions }) {
  const selectedOption = item.catalog_id ? catalogOptions.find(o => o.value === item.catalog_id) || null : null
  function handleSelect(opt) {
    if (opt) onChange({ ...item, name: opt.label, hourly_rate: opt.price || '', catalog_id: opt.value })
    else onChange({ ...item, catalog_id: null })
  }
  return (
    <tr className="border-b border-gray-100">
      <td className="px-2 py-1 w-56">
        <Select
          options={catalogOptions.filter(o => o.category !== 'part')}
          value={selectedOption}
          onChange={handleSelect}
          isClearable
          placeholder="Iz kataloga..."
          className="text-sm"
          classNamePrefix="sel"
        />
        {!selectedOption && (
          <input
            className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="ili unesi naziv"
            value={item.name}
            onChange={e => onChange({ ...item, name: e.target.value })}
          />
        )}
      </td>
      <td className="px-2 py-1 w-20">
        <input type="number" min="0" step="0.5"
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={item.hours} onChange={e => onChange({ ...item, hours: e.target.value })} />
      </td>
      <td className="px-2 py-1 w-28">
        <input type="number" min="0" step="0.01"
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={item.hourly_rate} onChange={e => onChange({ ...item, hourly_rate: e.target.value })} />
      </td>
      <td className="px-2 py-1 w-28 text-right text-sm font-medium text-gray-700">
        {((Number(item.hours) || 0) * (Number(item.hourly_rate) || 0)).toFixed(2)} RSD
      </td>
      <td className="px-2 py-1 w-10 text-center">
        <button onClick={onRemove} className="text-red-500 hover:text-red-700 text-lg leading-none">×</button>
      </td>
    </tr>
  )
}

function PartRow({ part, onChange, onRemove, catalogOptions }) {
  const selectedOption = part.catalog_id ? catalogOptions.find(o => o.value === part.catalog_id) || null : null
  function handleSelect(opt) {
    if (opt) onChange({ ...part, name: opt.label, oem_number: opt.oem_number || '', unit: opt.unit || 'kom', unit_price: opt.price || '', catalog_id: opt.value })
    else onChange({ ...part, catalog_id: null })
  }
  return (
    <tr className="border-b border-gray-100">
      <td className="px-2 py-1 w-44">
        <Select
          options={catalogOptions.filter(o => o.category !== 'labor')}
          value={selectedOption}
          onChange={handleSelect}
          isClearable
          placeholder="Iz kataloga..."
          className="text-sm"
          classNamePrefix="sel"
        />
        {!selectedOption && (
          <input
            className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="ili unesi naziv"
            value={part.name}
            onChange={e => onChange({ ...part, name: e.target.value })}
          />
        )}
      </td>
      <td className="px-2 py-1 w-28">
        <input className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={part.oem_number} onChange={e => onChange({ ...part, oem_number: e.target.value })} placeholder="OEM" />
      </td>
      <td className="px-2 py-1 w-24">
        <select value={part.category} onChange={e => onChange({ ...part, category: e.target.value })}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="part">Deo</option>
          <option value="material">Materijal</option>
        </select>
      </td>
      <td className="px-2 py-1 w-16">
        <input type="number" min="0" step="0.01"
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={part.quantity} onChange={e => onChange({ ...part, quantity: e.target.value })} />
      </td>
      <td className="px-2 py-1 w-16">
        <select value={part.unit} onChange={e => onChange({ ...part, unit: e.target.value })}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="kom">kom</option>
          <option value="l">l</option>
          <option value="kg">kg</option>
          <option value="m">m</option>
        </select>
      </td>
      <td className="px-2 py-1 w-28">
        <input type="number" min="0" step="0.01"
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={part.unit_price} onChange={e => onChange({ ...part, unit_price: e.target.value })} />
      </td>
      <td className="px-2 py-1 w-28 text-right text-sm font-medium text-gray-700">
        {((Number(part.quantity) || 0) * (Number(part.unit_price) || 0)).toFixed(2)} RSD
      </td>
      <td className="px-2 py-1 w-10 text-center">
        <button onClick={onRemove} className="text-red-500 hover:text-red-700 text-lg leading-none">×</button>
      </td>
    </tr>
  )
}

export default function ServiceOrderForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [activeTab, setActiveTab] = useState(0)
  const [fields, setFields] = useState(EMPTY_FIELDS)
  const [rec, setRec] = useState(EMPTY_REC)
  const [items, setItems] = useState([EMPTY_ITEM()])
  const [parts, setParts] = useState([EMPTY_PART()])
  const [vehicles, setVehicles] = useState([])
  const [catalog, setCatalog] = useState([])
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    window.api.vehicles.getAll().then(d => setVehicles(Array.isArray(d) ? d : []))
    window.api.catalog.getAll().then(d => setCatalog(Array.isArray(d) ? d : []))
    if (isEdit) loadOrder()
  }, [id])

  async function loadOrder() {
    const [o, i, p] = await Promise.all([
      window.api.serviceOrders.getById(Number(id)),
      window.api.serviceItems.getByOrder(Number(id)),
      window.api.serviceParts.getByOrder(Number(id)),
    ])
    if (!o) return
    setFields({
      vehicle_id: String(o.vehicle_id),
      owner_id: o.owner_id ? String(o.owner_id) : '',
      owner_name: o.owner_name || '',
      reception_date: o.reception_date || '',
      mileage_in: o.mileage_in ? String(o.mileage_in) : '',
      service_type: o.service_type || 'mali',
      vat_rate: String(o.vat_rate || 20),
      invoice_number: o.invoice_number || '',
      status: o.status || 'open',
    })
    setRec({
      technician_notes: o.technician_notes || '',
      recommendations: o.recommendations || '',
      next_service_date: o.next_service_date || '',
      next_service_mileage: o.next_service_mileage ? String(o.next_service_mileage) : '',
    })
    setItems(Array.isArray(i) && i.length > 0
      ? i.map(x => ({ _key: Math.random(), name: x.name, hours: String(x.hours), hourly_rate: String(x.hourly_rate), catalog_id: x.catalog_id || null }))
      : [EMPTY_ITEM()])
    setParts(Array.isArray(p) && p.length > 0
      ? p.map(x => ({ _key: Math.random(), name: x.name, oem_number: x.oem_number || '', category: x.category || 'part', quantity: String(x.quantity), unit: x.unit || 'kom', unit_price: String(x.unit_price), catalog_id: x.catalog_id || null }))
      : [EMPTY_PART()])
  }

  const vehicleOptions = useMemo(() =>
    vehicles.map(v => ({ value: String(v.id), label: `${v.make} ${v.model} — ${v.license_plate || v.vin}`, owner_id: v.current_owner_id, owner_name: v.current_owner_name })),
    [vehicles]
  )

  const catalogOptions = useMemo(() =>
    catalog.map(c => ({ value: c.id, label: c.name, price: c.price, oem_number: c.oem_number, unit: c.unit, category: c.category })),
    [catalog]
  )

  const selectedVehicle = fields.vehicle_id ? vehicleOptions.find(v => v.value === fields.vehicle_id) || null : null

  function handleVehicleSelect(opt) {
    if (opt) {
      setFields(f => ({ ...f, vehicle_id: opt.value, owner_id: opt.owner_id ? String(opt.owner_id) : '', owner_name: opt.owner_name || '' }))
    } else {
      setFields(f => ({ ...f, vehicle_id: '', owner_id: '', owner_name: '' }))
    }
  }

  function updateItem(key, updated) {
    setItems(prev => prev.map(i => i._key === key ? { ...updated, _key: key } : i))
  }
  function removeItem(key) { setItems(prev => prev.filter(i => i._key !== key)) }
  function updatePart(key, updated) {
    setParts(prev => prev.map(p => p._key === key ? { ...updated, _key: key } : p))
  }
  function removePart(key) { setParts(prev => prev.filter(p => p._key !== key)) }

  const fin = useMemo(() => computeFinancials(items, parts, Number(fields.vat_rate) || 20), [items, parts, fields.vat_rate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fields.vehicle_id) { setServerError('Izaberite vozilo.'); setActiveTab(0); return }
    if (!fields.reception_date) { setServerError('Unesite datum prijema.'); setActiveTab(0); return }

    setSaving(true)
    setServerError('')

    const orderData = {
      vehicle_id: Number(fields.vehicle_id),
      owner_id: fields.owner_id ? Number(fields.owner_id) : null,
      reception_date: fields.reception_date,
      mileage_in: fields.mileage_in ? Number(fields.mileage_in) : null,
      service_type: fields.service_type,
      vat_rate: Number(fields.vat_rate) || 20,
      invoice_number: fields.invoice_number || null,
      status: fields.status,
      labor_cost: fin.labor,
      parts_cost: fin.partsTotal,
      materials_cost: fin.materials,
      total_cost: fin.total,
      technician_notes: rec.technician_notes || null,
      recommendations: rec.recommendations || null,
      next_service_date: rec.next_service_date || null,
      next_service_mileage: rec.next_service_mileage ? Number(rec.next_service_mileage) : null,
    }

    let order
    if (isEdit) {
      order = await window.api.serviceOrders.update(Number(id), orderData)
      if (order?.error) { setServerError(order.error); setSaving(false); return }
      await window.api.serviceItems.removeByOrder(Number(id))
      await window.api.serviceParts.removeByOrder(Number(id))
    } else {
      order = await window.api.serviceOrders.create(orderData)
      if (order?.error) { setServerError(order.error); setSaving(false); return }
    }

    const orderId = order.id
    const validItems = items.filter(i => i.name && (Number(i.hours) > 0 || Number(i.hourly_rate) > 0))
    for (const item of validItems) {
      await window.api.serviceItems.create(orderId, { name: item.name, hours: Number(item.hours) || 0, hourly_rate: Number(item.hourly_rate) || 0, catalog_id: item.catalog_id })
    }
    const validParts = parts.filter(p => p.name && Number(p.unit_price) > 0)
    for (const part of validParts) {
      await window.api.serviceParts.create(orderId, { name: part.name, oem_number: part.oem_number, category: part.category, quantity: Number(part.quantity) || 1, unit: part.unit, unit_price: Number(part.unit_price) || 0, catalog_id: part.catalog_id })
    }

    navigate(`/service-orders/${orderId}`)
  }

  const tabClass = i => `px-4 py-2 text-sm font-medium border-b-2 cursor-pointer ${activeTab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`

  return (
    <div className="p-6 max-w-4xl">
      <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm mb-4">← Nazad</button>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{isEdit ? 'Izmena naloga' : 'Novi servisni nalog'}</h2>

      {serverError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">{serverError}</div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {TABS.map((t, i) => (
          <button key={t} type="button" className={tabClass(i)} onClick={() => setActiveTab(i)}>{t}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tab 1 — Osnovno */}
        {activeTab === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vozilo <span className="text-red-500">*</span></label>
              <Select
                options={vehicleOptions}
                value={selectedVehicle}
                onChange={handleVehicleSelect}
                isClearable
                placeholder="Izaberi vozilo..."
                className="text-sm"
              />
            </div>
            {fields.owner_name && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                Vlasnik: <span className="font-medium">{fields.owner_name}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum prijema <span className="text-red-500">*</span></label>
                <input type="date" value={fields.reception_date} onChange={e => setFields(f => ({ ...f, reception_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kilometraza (km)</label>
                <input type="number" min="0" value={fields.mileage_in} onChange={e => setFields(f => ({ ...f, mileage_in: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vrsta servisa</label>
                <select value={fields.service_type} onChange={e => setFields(f => ({ ...f, service_type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="mali">Mali servis</option>
                  <option value="veliki">Veliki servis</option>
                  <option value="vanredni">Vanredni</option>
                  <option value="garantni">Garantni</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={fields.status} onChange={e => setFields(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="open">Otvoren</option>
                  <option value="closed">Zatvoren</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Broj fakture</label>
                <input type="text" value={fields.invoice_number} onChange={e => setFields(f => ({ ...f, invoice_number: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 — Radovi */}
        {activeTab === 1 && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-left">
                    <th className="px-2 py-2 font-medium">Naziv rada</th>
                    <th className="px-2 py-2 font-medium">Sati</th>
                    <th className="px-2 py-2 font-medium">Cena/h (RSD)</th>
                    <th className="px-2 py-2 font-medium text-right">Ukupno</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <ItemRow
                      key={item._key}
                      item={item}
                      onChange={updated => updateItem(item._key, updated)}
                      onRemove={() => removeItem(item._key)}
                      catalogOptions={catalogOptions}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setItems(prev => [...prev, EMPTY_ITEM()])}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">
              + Dodaj rad
            </button>
          </div>
        )}

        {/* Tab 3 — Delovi */}
        {activeTab === 2 && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-left">
                    <th className="px-2 py-2 font-medium">Naziv</th>
                    <th className="px-2 py-2 font-medium">OEM broj</th>
                    <th className="px-2 py-2 font-medium">Kategorija</th>
                    <th className="px-2 py-2 font-medium">Kol.</th>
                    <th className="px-2 py-2 font-medium">Jed.</th>
                    <th className="px-2 py-2 font-medium">Cena/jed.</th>
                    <th className="px-2 py-2 font-medium text-right">Ukupno</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map(part => (
                    <PartRow
                      key={part._key}
                      part={part}
                      onChange={updated => updatePart(part._key, updated)}
                      onRemove={() => removePart(part._key)}
                      catalogOptions={catalogOptions}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setParts(prev => [...prev, EMPTY_PART()])}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium">
              + Dodaj deo/materijal
            </button>
          </div>
        )}

        {/* Tab 4 — Finansije */}
        {activeTab === 3 && (
          <div className="max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PDV stopa (%)</label>
              <input type="number" min="0" max="100" value={fields.vat_rate}
                onChange={e => setFields(f => ({ ...f, vat_rate: e.target.value }))}
                className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Radovi:</span><span className="font-medium">{fin.labor.toFixed(2)} RSD</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Delovi:</span><span className="font-medium">{fin.partsTotal.toFixed(2)} RSD</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Materijali:</span><span className="font-medium">{fin.materials.toFixed(2)} RSD</span></div>
              <div className="flex justify-between text-sm border-t border-gray-300 pt-2"><span className="text-gray-500">Osnova:</span><span className="font-medium">{fin.subtotal.toFixed(2)} RSD</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">PDV ({fields.vat_rate}%):</span><span className="font-medium">{(fin.total - fin.subtotal).toFixed(2)} RSD</span></div>
              <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-2"><span>UKUPNO:</span><span>{fin.total.toFixed(2)} RSD</span></div>
            </div>
          </div>
        )}

        {/* Tab 5 — Preporuke */}
        {activeTab === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Napomene servisera</label>
              <textarea rows={3} value={rec.technician_notes} onChange={e => setRec(r => ({ ...r, technician_notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preporuke</label>
              <textarea rows={3} value={rec.recommendations} onChange={e => setRec(r => ({ ...r, recommendations: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sledeci servis — datum</label>
                <input type="date" value={rec.next_service_date} onChange={e => setRec(r => ({ ...r, next_service_date: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sledeci servis — km</label>
                <input type="number" min="0" value={rec.next_service_mileage} onChange={e => setRec(r => ({ ...r, next_service_mileage: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8 pt-4 border-t border-gray-200">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
            {saving ? 'Snimanje...' : 'Sacuvaj nalog'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 text-sm">
            Otkaži
          </button>
        </div>
      </form>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const RECORD_TYPES = [
  { value: 'tires', label: 'Gume' },
  { value: 'brakes', label: 'Kočioni sistem' },
  { value: 'obd', label: 'OBD dijagnostika' },
  { value: 'timing_belt', label: 'Zupčasti kaiš' },
  { value: 'ac_service', label: 'Klima servis' },
  { value: 'electrical', label: 'Električni sistem' },
]

const TYPE_FIELDS = {
  tires: [
    { name: 'dimension', label: 'Dimenzija', placeholder: '205/55R16' },
    { name: 'type', label: 'Tip', placeholder: 'letnje / zimske' },
    { name: 'brand', label: 'Marka', placeholder: 'Michelin' },
    { name: 'dot', label: 'DOT kod', placeholder: '2423' },
    { name: 'position', label: 'Pozicija', placeholder: 'sve 4 / prednje' },
  ],
  brakes: [
    { name: 'axle', label: 'Osovina', placeholder: 'prednja / zadnja' },
    { name: 'pad_thickness_mm', label: 'Debljina pločica (mm)', type: 'number' },
    { name: 'disc_thickness_mm', label: 'Debljina diska (mm)', type: 'number' },
    { name: 'note', label: 'Napomena', placeholder: '' },
  ],
  obd: [
    { name: 'code', label: 'Kod greške', placeholder: 'P0301' },
    { name: 'description', label: 'Opis', placeholder: 'Misfire cilindar 1' },
    { name: 'status', label: 'Status', placeholder: 'aktivan / obrisan' },
  ],
  timing_belt: [
    { name: 'type', label: 'Tip', placeholder: 'kaiš / lanac' },
    { name: 'replaced_at_km', label: 'Zamenjen na km', type: 'number' },
    { name: 'next_at_km', label: 'Sledeća zamena na km', type: 'number' },
  ],
  ac_service: [
    { name: 'refrigerant', label: 'Rashladni gas', placeholder: 'R134a / R1234yf' },
    { name: 'amount_g', label: 'Količina (g)', type: 'number' },
    { name: 'pressure_bar', label: 'Pritisak (bar)', type: 'number' },
  ],
  electrical: [
    { name: 'system', label: 'Sistem', placeholder: 'alternator / akumulator' },
    { name: 'voltage_v', label: 'Napon (V)', type: 'number' },
    { name: 'amps', label: 'Struja (A)', type: 'number' },
    { name: 'note', label: 'Napomena', placeholder: '' },
  ],
}

function typeLabel(val) {
  return RECORD_TYPES.find(t => t.value === val)?.label || val
}

function parseData(rec) {
  try { return JSON.parse(rec.data) } catch { return {} }
}

function DataBadges({ data }) {
  const entries = Object.entries(data).filter(([, v]) => v !== '' && v != null)
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([k, v]) => (
        <span key={k} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
          {k}: {String(v)}
        </span>
      ))}
    </div>
  )
}

function AddForm({ vehicleId, onSave, onCancel }) {
  const [type, setType] = useState('tires')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [mileage, setMileage] = useState('')
  const [fieldValues, setFieldValues] = useState({})
  const [saving, setSaving] = useState(false)

  function setField(name, value) {
    setFieldValues(prev => ({ ...prev, [name]: value }))
  }

  function handleTypeChange(e) {
    setType(e.target.value)
    setFieldValues({})
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!date) return
    setSaving(true)
    await window.api.specialRecords.create({
      vehicle_id: Number(vehicleId),
      record_type: type,
      data: JSON.stringify(fieldValues),
      record_date: date,
      mileage: mileage ? Number(mileage) : null,
    })
    setSaving(false)
    onSave()
  }

  const fields = TYPE_FIELDS[type] || []
  const inp = 'border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full'

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h4 className="text-sm font-semibold text-blue-800 mb-3">Nova evidencija</h4>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tip evidencije</label>
          <select className={inp} value={type} onChange={handleTypeChange}>
            {RECORD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Datum <span className="text-red-500">*</span></label>
          <input type="date" className={inp} value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Kilometraža</label>
          <input type="number" min="0" className={inp} value={mileage} onChange={e => setMileage(e.target.value)} placeholder="npr. 87500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {fields.map(f => (
          <div key={f.name}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
            <input
              type={f.type || 'text'}
              className={inp}
              value={fieldValues[f.name] || ''}
              onChange={e => setField(f.name, e.target.value)}
              placeholder={f.placeholder || ''}
              step={f.type === 'number' ? '0.01' : undefined}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
          {saving ? 'Snimanje...' : 'Dodaj evidenciju'}
        </button>
        <button type="button" onClick={onCancel}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">
          Otkaži
        </button>
      </div>
    </form>
  )
}

export default function SpecialRecords() {
  const { id: vehicleId } = useParams()
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeType, setActiveType] = useState('all')

  useEffect(() => { load() }, [vehicleId])

  async function load() {
    setLoading(true)
    const [recs, veh] = await Promise.all([
      window.api.specialRecords.getByVehicle(Number(vehicleId)),
      window.api.vehicles.getById(Number(vehicleId)),
    ])
    setRecords(Array.isArray(recs) ? recs : [])
    setVehicle(veh || null)
    setLoading(false)
  }

  const usedTypes = [...new Set(records.map(r => r.record_type))]
  const displayed = activeType === 'all' ? records : records.filter(r => r.record_type === activeType)

  const grouped = {}
  for (const rec of displayed) {
    if (!grouped[rec.record_type]) grouped[rec.record_type] = []
    grouped[rec.record_type].push(rec)
  }

  if (loading) return <div className="p-6 text-gray-500">Učitavanje...</div>

  return (
    <div className="p-6 max-w-3xl">
      <button onClick={() => navigate(`/vehicles/${vehicleId}`)} className="text-gray-500 hover:text-gray-700 text-sm mb-4">
        ← Nazad na vozilo
      </button>

      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Specijalne evidencije</h2>
          {vehicle && (
            <p className="text-sm text-gray-500 mt-1">{vehicle.make} {vehicle.model} — {vehicle.license_plate || vehicle.vin}</p>
          )}
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          {showForm ? 'Zatvori formu' : '+ Nova evidencija'}
        </button>
      </div>

      {showForm && (
        <AddForm
          vehicleId={vehicleId}
          onSave={() => { setShowForm(false); load() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filter po tipu */}
      {usedTypes.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button
            onClick={() => setActiveType('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium ${activeType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Sve
          </button>
          {usedTypes.map(t => (
            <button key={t}
              onClick={() => setActiveType(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${activeType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {typeLabel(t)}
            </button>
          ))}
        </div>
      )}

      {records.length === 0 ? (
        <p className="text-gray-400 text-center py-12">Nema specijalnih evidencija za ovo vozilo.</p>
      ) : (
        Object.entries(grouped).map(([type, recs]) => (
          <div key={type} className="mb-6">
            <h3 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">
              {typeLabel(type)}
            </h3>
            <div className="space-y-2">
              {recs.map(rec => {
                const data = parseData(rec)
                return (
                  <div key={rec.id} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-medium text-gray-800">{rec.record_date}</span>
                        {rec.mileage && (
                          <span className="ml-3 text-sm text-gray-500">{rec.mileage.toLocaleString()} km</span>
                        )}
                      </div>
                    </div>
                    <DataBadges data={data} />
                    {rec.notes && <p className="text-xs text-gray-500 mt-1">{rec.notes}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

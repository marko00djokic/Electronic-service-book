import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function getUrgency(row) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let dateOverdue = false
  let dateSoon = false
  let kmSoon = false

  if (row.next_service_date) {
    const next = new Date(row.next_service_date)
    const diffDays = Math.floor((next - today) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) dateOverdue = true
    else if (diffDays <= 30) dateSoon = true
  }

  if (row.next_service_mileage && row.last_mileage) {
    const remaining = row.next_service_mileage - row.last_mileage
    if (remaining <= 500) kmSoon = true
  }

  if (dateOverdue) return 'overdue'
  if (dateSoon || kmSoon) return 'soon'
  return 'ok'
}

function urgencyOrder(urgency) {
  if (urgency === 'overdue') return 0
  if (urgency === 'soon') return 1
  return 2
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('sr-RS')
}

function UrgencyBadge({ urgency }) {
  const config = {
    overdue: { label: 'Prekoračeno', cls: 'bg-red-100 text-red-700' },
    soon:    { label: 'Bliži se',    cls: 'bg-amber-100 text-amber-700' },
    ok:      { label: 'U redu',      cls: 'bg-emerald-100 text-emerald-700' },
  }
  const { label, cls } = config[urgency] || config.ok
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}

export default function Reminders() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [kmThreshold, setKmThreshold] = useState(500)

  useEffect(() => {
    loadReminders()
  }, [days, kmThreshold])

  async function loadReminders() {
    setLoading(true)
    try {
      const data = await window.api.dashboard.getUpcomingServices(days, kmThreshold)
      const withUrgency = data.map(row => ({ ...row, urgency: getUrgency(row) }))
      withUrgency.sort((a, b) => urgencyOrder(a.urgency) - urgencyOrder(b.urgency))
      setItems(withUrgency)
    } finally {
      setLoading(false)
    }
  }

  const overdueCount = items.filter(i => i.urgency === 'overdue').length
  const soonCount = items.filter(i => i.urgency === 'soon').length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Podsetnici</h2>
        <div className="flex items-center gap-3 text-sm">
          <label className="text-gray-500">
            Period:
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="ml-2 border border-gray-200 rounded px-2 py-1 text-gray-700"
            >
              <option value={7}>7 dana</option>
              <option value={14}>14 dana</option>
              <option value={30}>30 dana</option>
              <option value={60}>60 dana</option>
            </select>
          </label>
          <label className="text-gray-500">
            Km prag:
            <select
              value={kmThreshold}
              onChange={e => setKmThreshold(Number(e.target.value))}
              className="ml-2 border border-gray-200 rounded px-2 py-1 text-gray-700"
            >
              <option value={300}>300 km</option>
              <option value={500}>500 km</option>
              <option value={1000}>1000 km</option>
            </select>
          </label>
        </div>
      </div>

      {/* Sažetak */}
      {(overdueCount > 0 || soonCount > 0) && (
        <div className="flex gap-3">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span className="text-sm text-red-700 font-medium">{overdueCount} vozilo{overdueCount > 1 ? 'a' : ''} prekoračilo rok</span>
            </div>
          )}
          {soonCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span className="text-sm text-amber-700 font-medium">{soonCount} vozilo{soonCount > 1 ? 'a' : ''} bliži se servis</span>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <span className="text-gray-400 text-sm">Učitavanje...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-10 text-center">
          <p className="text-gray-500">Nema vozila kojima se bliži servis u zadatom periodu.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-medium">Vozilo</th>
                <th className="px-5 py-3 text-left font-medium">Vlasnik</th>
                <th className="px-5 py-3 text-left font-medium">Poslednji servis</th>
                <th className="px-5 py-3 text-left font-medium">Sledeći servis (datum)</th>
                <th className="px-5 py-3 text-left font-medium">Sledeći servis (km)</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Akcija</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const rowCls = item.urgency === 'overdue'
                  ? 'border-l-4 border-l-red-400 bg-red-50/30'
                  : item.urgency === 'soon'
                  ? 'border-l-4 border-l-amber-400 bg-amber-50/20'
                  : 'border-l-4 border-l-transparent'

                const kmRemaining = item.next_service_mileage && item.last_mileage
                  ? item.next_service_mileage - item.last_mileage
                  : null

                return (
                  <tr key={item.vehicle_id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${rowCls}`}>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => navigate(`/vehicles/${item.vehicle_id}`)}
                        className="font-medium text-blue-600 hover:underline text-left"
                      >
                        {item.make} {item.model}
                      </button>
                      <div className="text-xs text-gray-400">{item.license_plate}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      <div>{item.owner_name || '—'}</div>
                      {item.owner_phone && <div className="text-xs text-gray-400">{item.owner_phone}</div>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{formatDate(item.last_service_date)}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {item.next_service_date ? (
                        <span className={item.urgency === 'overdue' ? 'text-red-600 font-medium' : ''}>
                          {formatDate(item.next_service_date)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {kmRemaining !== null ? (
                        <span className={kmRemaining <= 0 ? 'text-red-600 font-medium' : kmRemaining <= 500 ? 'text-amber-600' : ''}>
                          {kmRemaining <= 0 ? `${Math.abs(kmRemaining)} km prekoračeno` : `${kmRemaining} km`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <UrgencyBadge urgency={item.urgency} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => navigate(`/service-orders/new?vehicleId=${item.vehicle_id}`)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
                      >
                        Novi nalog
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

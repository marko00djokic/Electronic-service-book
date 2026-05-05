import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STATUS_LABEL = { open: 'Otvoren', closed: 'Zatvoren' }
const STATUS_COLOR = { open: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-600' }

export default function ServiceOrderList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    setLoading(true)
    const data = await window.api.serviceOrders.getAll()
    const list = Array.isArray(data) ? data : []
    setAllOrders(list)
    setOrders(list)
    setLoading(false)
  }

  function applyFilters(q, status, list) {
    let filtered = list
    if (status) filtered = filtered.filter(o => o.status === status)
    if (q.trim()) {
      const lq = q.toLowerCase()
      filtered = filtered.filter(o =>
        (o.order_number || '').toLowerCase().includes(lq) ||
        (o.make || '').toLowerCase().includes(lq) ||
        (o.model || '').toLowerCase().includes(lq) ||
        (o.license_plate || '').toLowerCase().includes(lq) ||
        (o.owner_name || '').toLowerCase().includes(lq)
      )
    }
    setOrders(filtered)
  }

  function handleSearch(e) {
    const q = e.target.value
    setQuery(q)
    applyFilters(q, statusFilter, allOrders)
  }

  function handleStatus(e) {
    const s = e.target.value
    setStatusFilter(s)
    applyFilters(query, s, allOrders)
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!confirm('Obrisati ovaj servisni nalog i sve stavke?')) return
    await window.api.serviceOrders.remove(id)
    loadOrders()
  }

  if (loading) return <div className="p-6 text-gray-500">Ucitavanje...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Servisni nalozi</h2>
        <button
          onClick={() => navigate('/service-orders/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + Novi nalog
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Pretrazi po broju naloga, vozilu, vlasniku..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <select
          value={statusFilter}
          onChange={handleStatus}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Svi statusi</option>
          <option value="open">Otvoreni</option>
          <option value="closed">Zatvoreni</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          {query || statusFilter ? 'Nema rezultata za unete filtere.' : 'Nema servisnih naloga. Dodajte prvi nalog.'}
        </p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 border-b border-gray-200">
                <th className="px-4 py-3 font-medium">Broj naloga</th>
                <th className="px-4 py-3 font-medium">Vozilo</th>
                <th className="px-4 py-3 font-medium">Vlasnik</th>
                <th className="px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3 font-medium">Km</th>
                <th className="px-4 py-3 font-medium">Tip</th>
                <th className="px-4 py-3 font-medium">Ukupno</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium w-28"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/service-orders/${o.id}`)}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono text-gray-700">{o.order_number}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{o.make} {o.model} <span className="text-gray-500 font-normal">{o.license_plate}</span></td>
                  <td className="px-4 py-3 text-gray-600">{o.owner_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.reception_date}</td>
                  <td className="px-4 py-3 text-gray-600">{o.mileage_in ? `${o.mileage_in} km` : '—'}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{o.service_type}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{(o.total_cost || 0).toFixed(2)} RSD</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[o.status] || STATUS_COLOR.open}`}>
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/service-orders/${o.id}/edit`) }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Izmeni
                    </button>
                    <button
                      onClick={e => handleDelete(o.id, e)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Obrisi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

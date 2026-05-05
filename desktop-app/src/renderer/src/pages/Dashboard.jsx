import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

const SERVICE_TYPE_LABELS = {
  mali: 'Mali servis',
  veliki: 'Veliki servis',
  vanredni: 'Vanredni',
  garantni: 'Garantni'
}

function KpiCard({ label, value, sub, colorClass }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-3xl font-bold ${colorClass || 'text-gray-900'}`}>{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

function formatCurrency(val) {
  return new Intl.NumberFormat('sr-RS', { style: 'currency', currency: 'RSD', maximumFractionDigits: 0 }).format(val)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('sr-RS')
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [serviceTypes, setServiceTypes] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    window.api.dashboard.getMonthlyRevenue(year).then(setMonthlyRevenue)
  }, [year])

  async function loadAll() {
    setLoading(true)
    try {
      const [s, mr, st, ro] = await Promise.all([
        window.api.dashboard.getStats(),
        window.api.dashboard.getMonthlyRevenue(year),
        window.api.dashboard.getServiceTypeDistribution(),
        window.api.dashboard.getRecentOrders(),
      ])
      setStats(s)
      setMonthlyRevenue(mr)
      setServiceTypes(st)
      setRecentOrders(ro)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-400 text-sm">Učitavanje...</span>
      </div>
    )
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* KPI kartice */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ukupno vozila"
          value={stats?.totalVehicles ?? 0}
          colorClass="text-blue-600"
        />
        <KpiCard
          label="Naloga ovog meseca"
          value={stats?.ordersThisMonth ?? 0}
          colorClass="text-emerald-600"
        />
        <KpiCard
          label="Prihod ovog meseca"
          value={formatCurrency(stats?.revenueThisMonth ?? 0)}
          sub="zatvoreni nalozi"
          colorClass="text-violet-600"
        />
        <KpiCard
          label="Bliži se servis"
          value={stats?.upcomingCount ?? 0}
          sub="narednih 30 dana / 500 km"
          colorClass={stats?.upcomingCount > 0 ? 'text-amber-600' : 'text-gray-700'}
        />
      </div>

      {/* Grafikoni */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Prihodi po mesecima */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Prihodi po mesecima</h3>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyRevenue} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Prihod" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Raspodela po vrsti servisa */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Vrsta servisa</h3>
          {serviceTypes.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Nema podataka
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={serviceTypes}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {serviceTypes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Poslednji nalozi */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Poslednji servisni nalozi</h3>
          <button
            onClick={() => navigate('/service-orders')}
            className="text-xs text-blue-600 hover:underline"
          >
            Svi nalozi →
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 px-5 py-6">Nema servisnih naloga.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                <th className="px-5 py-2 text-left font-medium">Nalog</th>
                <th className="px-5 py-2 text-left font-medium">Vozilo</th>
                <th className="px-5 py-2 text-left font-medium">Vlasnik</th>
                <th className="px-5 py-2 text-left font-medium">Datum</th>
                <th className="px-5 py-2 text-left font-medium">Vrsta</th>
                <th className="px-5 py-2 text-right font-medium">Iznos</th>
                <th className="px-5 py-2 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr
                  key={order.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/service-orders/${order.id}`)}
                >
                  <td className="px-5 py-3 font-mono text-xs text-gray-600">{order.order_number || `#${order.id}`}</td>
                  <td className="px-5 py-3 text-gray-900">{order.make} {order.model} <span className="text-gray-400">{order.license_plate}</span></td>
                  <td className="px-5 py-3 text-gray-600">{order.owner_name || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(order.reception_date)}</td>
                  <td className="px-5 py-3 text-gray-600">{SERVICE_TYPE_LABELS[order.service_type] || order.service_type}</td>
                  <td className="px-5 py-3 text-right text-gray-900 font-medium">{formatCurrency(order.total_cost)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'closed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status === 'closed' ? 'Zatvoren' : 'Otvoren'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

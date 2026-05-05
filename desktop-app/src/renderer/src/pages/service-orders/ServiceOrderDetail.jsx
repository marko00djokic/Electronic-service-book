import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const STATUS_LABEL = { open: 'Otvoren', closed: 'Zatvoren' }
const STATUS_COLOR = { open: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-600' }

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-gray-700 border-b border-gray-200 pb-1 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="flex gap-2 text-sm mb-1">
      <span className="text-gray-500 w-44 shrink-0">{label}:</span>
      <span className="text-gray-900">{value || '—'}</span>
    </div>
  )
}

export default function ServiceOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => { loadData() }, [id])

  async function loadData() {
    setLoading(true)
    const [o, i, p] = await Promise.all([
      window.api.serviceOrders.getById(Number(id)),
      window.api.serviceItems.getByOrder(Number(id)),
      window.api.serviceParts.getByOrder(Number(id)),
    ])
    setOrder(o)
    setItems(Array.isArray(i) ? i : [])
    setParts(Array.isArray(p) ? p : [])
    setLoading(false)
  }

  async function handlePdf() {
    setPdfLoading(true)
    const result = await window.api.pdf.order(Number(id))
    setPdfLoading(false)
    if (result?.error) alert(`Greska pri generisanju PDF-a: ${result.error}`)
    else if (result?.success) alert(`PDF sacuvan: ${result.filePath}`)
  }

  if (loading) return <div className="p-6 text-gray-500">Ucitavanje...</div>
  if (!order) return <div className="p-6 text-red-500">Nalog nije pronadjen.</div>

  return (
    <div className="p-6 max-w-3xl">
      <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm mb-4">← Nazad</button>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{order.order_number}</h2>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.status] || STATUS_COLOR.open}`}>
            {STATUS_LABEL[order.status] || order.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/service-orders/${id}/edit`)}
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium"
          >
            Izmeni
          </button>
          <button
            onClick={handlePdf}
            disabled={pdfLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {pdfLoading ? 'Generisanje...' : 'Stampaj PDF'}
          </button>
        </div>
      </div>

      <Section title="Osnovno">
        <Field label="Vozilo" value={`${order.make} ${order.model} (${order.vehicle_year})`} />
        <Field label="VIN" value={order.vin} />
        <Field label="Registracija" value={order.license_plate} />
        <Field label="Vlasnik" value={order.owner_name} />
        <Field label="Telefon vlasnika" value={order.owner_phone} />
        <Field label="Datum prijema" value={order.reception_date} />
        <Field label="Kilometraza" value={order.mileage_in ? `${order.mileage_in} km` : null} />
        <Field label="Vrsta servisa" value={order.service_type} />
        <Field label="Broj fakture" value={order.invoice_number} />
      </Section>

      <Section title="Obavljeni radovi">
        {items.length === 0 ? (
          <p className="text-gray-400 text-sm">Nema unetih radova.</p>
        ) : (
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-3 py-2 text-left font-medium">Naziv</th>
                <th className="px-3 py-2 text-right font-medium">Sati</th>
                <th className="px-3 py-2 text-right font-medium">Cena/h</th>
                <th className="px-3 py-2 text-right font-medium">Ukupno</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2 text-right">{item.hours}</td>
                  <td className="px-3 py-2 text-right">{(item.hourly_rate || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-medium">{(item.total || 0).toFixed(2)} RSD</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Delovi i materijali">
        {parts.length === 0 ? (
          <p className="text-gray-400 text-sm">Nema unetih delova.</p>
        ) : (
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-3 py-2 text-left font-medium">Naziv</th>
                <th className="px-3 py-2 text-left font-medium">OEM</th>
                <th className="px-3 py-2 text-right font-medium">Kol.</th>
                <th className="px-3 py-2 text-right font-medium">Jed.</th>
                <th className="px-3 py-2 text-right font-medium">Cena/jed.</th>
                <th className="px-3 py-2 text-right font-medium">Ukupno</th>
              </tr>
            </thead>
            <tbody>
              {parts.map(part => (
                <tr key={part.id} className="border-t border-gray-100">
                  <td className="px-3 py-2">{part.name}</td>
                  <td className="px-3 py-2 text-gray-500">{part.oem_number || '—'}</td>
                  <td className="px-3 py-2 text-right">{part.quantity}</td>
                  <td className="px-3 py-2 text-right">{part.unit}</td>
                  <td className="px-3 py-2 text-right">{(part.unit_price || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-medium">{(part.total || 0).toFixed(2)} RSD</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Finansije">
        <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1 max-w-xs">
          <div className="flex justify-between"><span className="text-gray-500">Radovi:</span><span>{(order.labor_cost || 0).toFixed(2)} RSD</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Delovi:</span><span>{(order.parts_cost || 0).toFixed(2)} RSD</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Materijali:</span><span>{(order.materials_cost || 0).toFixed(2)} RSD</span></div>
          <div className="flex justify-between"><span className="text-gray-500">PDV:</span><span>{order.vat_rate || 20}%</span></div>
          <div className="flex justify-between font-bold border-t border-gray-300 pt-1 mt-1">
            <span>UKUPNO:</span><span>{(order.total_cost || 0).toFixed(2)} RSD</span>
          </div>
        </div>
      </Section>

      {(order.technician_notes || order.recommendations || order.next_service_date || order.next_service_mileage) && (
        <Section title="Napomene i preporuke">
          {order.technician_notes && <Field label="Napomene servisera" value={order.technician_notes} />}
          {order.recommendations && <Field label="Preporuke" value={order.recommendations} />}
          {order.next_service_date && <Field label="Sledeci servis (datum)" value={order.next_service_date} />}
          {order.next_service_mileage && <Field label="Sledeci servis (km)" value={`${order.next_service_mileage} km`} />}
        </Section>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function OwnerDetail() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [owner, setOwner] = useState(null)
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { loadData() }, [id])

    async function loadData() {
        setLoading(true)
        const [o, v] = await Promise.all([
            window.api.owners.getById(Number(id)),
            window.api.ownership.getByOwner(Number(id))
        ])
        setOwner(o)
        setVehicles(Array.isArray(v) ? v : [])
        setLoading(false)
    }

    async function handleDelete() {
        if (!confirm('Da li ste sigurni da želite da obrišete ovog vlasnika?')) return
        const result = await window.api.owners.remove(Number(id))
        if (result?.error) { alert(result.error); return }
        navigate('/owners')
    }

    if (loading) return <div className="p-6 text-gray-500">Učitavanje...</div>
    if (!owner) return <div className="p-6 text-red-600">Vlasnik nije pronađen.</div>

    return (
        <div className="p-6 max-w-3xl">
            <button onClick={() => navigate('/owners')} className="text-gray-500 hover:text-gray-700 text-sm mb-4">← Svi vlasnici</button>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{owner.last_name} {owner.first_name}</h2>
                    {owner.city && <p className="text-gray-500 text-sm mt-1">{owner.city}</p>}
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate(`/owners/${id}/edit`)}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">
                        Izmeni
                    </button>
                    <button onClick={handleDelete}
                        className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm">
                        Obriši
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {[
                    ['Telefon', owner.phone],
                    ['Email', owner.email],
                    ['Adresa', owner.address],
                    ['Grad', owner.city],
                ].map(([label, value]) => (
                    <div key={label}>
                        <span className="text-gray-500">{label}: </span>
                        <span className="font-medium">{value || '—'}</span>
                    </div>
                ))}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">Vozila</h3>

            {vehicles.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">Vlasnik nema evidentiranih vozila.</p>
            ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left text-gray-600 border-b border-gray-200">
                                <th className="px-4 py-2 font-medium">Vozilo</th>
                                <th className="px-4 py-2 font-medium">VIN</th>
                                <th className="px-4 py-2 font-medium">Registracija</th>
                                <th className="px-4 py-2 font-medium">Od</th>
                                <th className="px-4 py-2 font-medium">Do</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map(v => (
                                <tr key={v.id} onClick={() => navigate(`/vehicles/${v.vehicle_id}`)}
                                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer last:border-b-0">
                                    <td className="px-4 py-2 font-medium text-gray-900">{v.make} {v.model} ({v.year})</td>
                                    <td className="px-4 py-2 text-gray-600 font-mono">{v.vin}</td>
                                    <td className="px-4 py-2 text-gray-600">{v.license_plate || '—'}</td>
                                    <td className="px-4 py-2 text-gray-600">{v.start_date}</td>
                                    <td className="px-4 py-2">
                                        {v.end_date
                                            ? <span className="text-gray-600">{v.end_date}</span>
                                            : <span className="text-green-600 font-medium">Trenutni</span>}
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
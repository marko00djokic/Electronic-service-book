import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function VehicleList() {
    const navigate = useNavigate()
    const [vehicles, setVehicles] = useState([])
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => { loadVehicles() }, [])

    async function loadVehicles() {
        setLoading(true)
        const data = await window.api.vehicles.getAll()
        setVehicles(Array.isArray(data) ? data : [])
        setLoading(false)
    }

    async function handleSearch(e) {
        const q = e.target.value
        setQuery(q)
        if (q.trim()) {
            const data = await window.api.vehicles.search(q)
            setVehicles(Array.isArray(data) ? data : [])
        } else {
            loadVehicles()
        }
    }

    async function handleDelete(id, e) {
        e.stopPropagation()
        if (!confirm('Da li ste sigurni da želite da obrišete ovo vozilo?')) return
        await window.api.vehicles.remove(id)
        loadVehicles()
    }

    if (loading) return <div className="p-6 text-gray-500">Učitavanje...</div>

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Vozila</h2>
                <button
                    onClick={() => navigate('/vehicles/new')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                    + Novo vozilo
                </button>
            </div>

            <input
                type="text"
                value={query}
                onChange={handleSearch}
                placeholder="Pretraži po VIN-u, marki, modelu, registraciji..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />

            {vehicles.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                    {query ? 'Nema rezultata za unetu pretragu.' : 'Nema vozila. Dodajte prvo vozilo.'}
                </p>
            ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left text-gray-600 border-b border-gray-200">
                                <th className="px-4 py-3 font-medium">Vozilo</th>
                                <th className="px-4 py-3 font-medium">VIN</th>
                                <th className="px-4 py-3 font-medium">Registracija</th>
                                <th className="px-4 py-3 font-medium">Godište</th>
                                <th className="px-4 py-3 font-medium">Trenutni vlasnik</th>
                                <th className="px-4 py-3 font-medium w-28"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map(v => (
                                <tr
                                    key={v.id}
                                    onClick={() => navigate(`/vehicles/${v.id}`)}
                                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer last:border-b-0"
                                >
                                    <td className="px-4 py-3 font-medium text-gray-900">{v.make} {v.model}</td>
                                    <td className="px-4 py-3 text-gray-600 font-mono">{v.vin}</td>
                                    <td className="px-4 py-3 text-gray-600">{v.license_plate || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{v.year}</td>
                                    <td className="px-4 py-3 text-gray-600">{v.current_owner_name || '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={e => { e.stopPropagation(); navigate(`/vehicles/${v.id}/edit`) }}
                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                        >
                                            Izmeni
                                        </button>
                                        <button
                                            onClick={e => handleDelete(v.id, e)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Obriši
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
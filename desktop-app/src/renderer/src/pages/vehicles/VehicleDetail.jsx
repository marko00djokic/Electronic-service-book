import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const ENGINE_LABELS = { benzin: 'Benzin', dizel: 'Dizel', elektro: 'Elektro', hibrid: 'Hibrid' }

export default function VehicleDetail() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [vehicle, setVehicle] = useState(null)
    const [history, setHistory] = useState([])
    const [allOwners, setAllOwners] = useState([])
    const [showAddOwner, setShowAddOwner] = useState(false)
    const [newOwner, setNewOwner] = useState({ owner_id: '', start_date: '' })
    const [loading, setLoading] = useState(true)
    const [addError, setAddError] = useState('')

    useEffect(() => { loadData() }, [id])

    async function loadData() {
        setLoading(true)
        const [v, h, o] = await Promise.all([
            window.api.vehicles.getById(Number(id)),
            window.api.ownership.getByVehicle(Number(id)),
            window.api.owners.getAll()
        ])
        setVehicle(v)
        setHistory(Array.isArray(h) ? h : [])
        setAllOwners(Array.isArray(o) ? o : [])
        setLoading(false)
    }

    async function handleDelete() {
        if (!confirm('Da li ste sigurni da želite da obrišete ovo vozilo? Sva istorija vlasništva biće obrisana.')) return
        await window.api.vehicles.remove(Number(id))
        navigate('/vehicles')
    }

    async function handleAddOwner(e) {
        e.preventDefault()
        setAddError('')
        const result = await window.api.ownership.addOwner(Number(id), Number(newOwner.owner_id), newOwner.start_date)
        if (result?.error) { setAddError(result.error); return }
        setShowAddOwner(false)
        setNewOwner({ owner_id: '', start_date: '' })
        loadData()
    }

    if (loading) return <div className="p-6 text-gray-500">Učitavanje...</div>
    if (!vehicle) return <div className="p-6 text-red-600">Vozilo nije pronađeno.</div>

    return (
        <div className="p-6 max-w-3xl">
            <button onClick={() => navigate('/vehicles')} className="text-gray-500 hover:text-gray-700 text-sm mb-4">← Sva vozila</button>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{vehicle.make} {vehicle.model} ({vehicle.year})</h2>
                    <p className="text-gray-500 font-mono text-sm mt-1">{vehicle.vin}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate(`/vehicles/${id}/special`)}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">
                        Spec. evidencije
                    </button>
                    <button onClick={() => navigate(`/vehicles/${id}/edit`)}
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
                    ['Registracija', vehicle.license_plate],
                    ['Boja', vehicle.color],
                    ['Motor', ENGINE_LABELS[vehicle.engine_type]],
                    ['Zapremina', vehicle.engine_displacement ? `${vehicle.engine_displacement} cm³` : null],
                    ['Snaga', vehicle.engine_power ? `${vehicle.engine_power} kW` : null],
                    ['Prva registracija', vehicle.first_registration_date],
                ].map(([label, value]) => (
                    <div key={label}>
                        <span className="text-gray-500">{label}: </span>
                        <span className="font-medium">{value || '—'}</span>
                    </div>
                ))}
                {vehicle.notes && (
                    <div className="col-span-2">
                        <span className="text-gray-500">Napomene: </span>
                        <span className="font-medium">{vehicle.notes}</span>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Istorija vlasništva</h3>
                <button onClick={() => { setShowAddOwner(true); setAddError('') }}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm">
                    + Dodaj vlasnika
                </button>
            </div>

            {showAddOwner && (
                <form onSubmit={handleAddOwner} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    {addError && <p className="text-red-600 text-sm mb-3">{addError}</p>}
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vlasnik <span className="text-red-500">*</span>
                            </label>
                            <select required value={newOwner.owner_id}
                                onChange={e => setNewOwner(n => ({ ...n, owner_id: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">— Izaberi vlasnika —</option>
                                {allOwners.map(o => (
                                    <option key={o.id} value={o.id}>{o.last_name} {o.first_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Od datuma <span className="text-red-500">*</span>
                            </label>
                            <input required type="date" value={newOwner.start_date}
                                onChange={e => setNewOwner(n => ({ ...n, start_date: e.target.value }))}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">Sačuvaj</button>
                        <button type="button" onClick={() => setShowAddOwner(false)}
                            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Otkaži</button>
                    </div>
                </form>
            )}

            {history.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">Nema evidentiranih vlasnika.</p>
            ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left text-gray-600 border-b border-gray-200">
                                <th className="px-4 py-2 font-medium">Vlasnik</th>
                                <th className="px-4 py-2 font-medium">Telefon</th>
                                <th className="px-4 py-2 font-medium">Od</th>
                                <th className="px-4 py-2 font-medium">Do</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(h => (
                                <tr key={h.id} className="border-b border-gray-100 last:border-b-0">
                                    <td className="px-4 py-2">
                                        <button onClick={() => navigate(`/owners/${h.owner_id}`)}
                                            className="text-blue-600 hover:underline">
                                            {h.owner_name}
                                        </button>
                                    </td>
                                    <td className="px-4 py-2 text-gray-600">{h.owner_phone || '—'}</td>
                                    <td className="px-4 py-2 text-gray-600">{h.start_date}</td>
                                    <td className="px-4 py-2">
                                        {h.end_date
                                            ? <span className="text-gray-600">{h.end_date}</span>
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
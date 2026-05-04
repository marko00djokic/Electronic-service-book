import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function OwnerList() {
    const navigate = useNavigate()
    const [owners, setOwners] = useState([])
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => { loadOwners() }, [])

    async function loadOwners() {
        setLoading(true)
        const data = await window.api.owners.getAll()
        setOwners(Array.isArray(data) ? data : [])
        setLoading(false)
    }

    async function handleSearch(e) {
        const q = e.target.value
        setQuery(q)
        if (q.trim()) {
            const data = await window.api.owners.search(q)
            setOwners(Array.isArray(data) ? data : [])
        } else {
            loadOwners()
        }
    }

    async function handleDelete(id, e) {
        e.stopPropagation()
        if (!confirm('Da li ste sigurni da želite da obrišete ovog vlasnika?')) return
        const result = await window.api.owners.remove(id)
        if (result?.error) { alert(result.error); return }
        loadOwners()
    }

    if (loading) return <div className="p-6 text-gray-500">Učitavanje...</div>

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Vlasnici</h2>
                <button onClick={() => navigate('/owners/new')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                    + Novi vlasnik
                </button>
            </div>

            <input type="text" value={query} onChange={handleSearch}
                placeholder="Pretraži po imenu, prezimenu, telefonu..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />

            {owners.length === 0 ? (
                <p className="text-gray-500 text-center py-12">
                    {query ? 'Nema rezultata za unetu pretragu.' : 'Nema vlasnika. Dodajte prvog vlasnika.'}
                </p>
            ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left text-gray-600 border-b border-gray-200">
                                <th className="px-4 py-3 font-medium">Ime i prezime</th>
                                <th className="px-4 py-3 font-medium">Telefon</th>
                                <th className="px-4 py-3 font-medium">Email</th>
                                <th className="px-4 py-3 font-medium">Grad</th>
                                <th className="px-4 py-3 font-medium w-28"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {owners.map(o => (
                                <tr key={o.id} onClick={() => navigate(`/owners/${o.id}`)}
                                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer last:border-b-0">
                                    <td className="px-4 py-3 font-medium text-gray-900">{o.last_name} {o.first_name}</td>
                                    <td className="px-4 py-3 text-gray-600">{o.phone || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{o.email || '—'}</td>
                                    <td className="px-4 py-3 text-gray-600">{o.city || '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={e => { e.stopPropagation(); navigate(`/owners/${o.id}/edit`) }}
                                            className="text-blue-600 hover:text-blue-800 mr-3">Izmeni</button>
                                        <button onClick={e => handleDelete(o.id, e)}
                                            className="text-red-600 hover:text-red-800">Obriši</button>
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
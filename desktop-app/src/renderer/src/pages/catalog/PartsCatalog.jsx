import { useState, useEffect } from 'react'

const CATEGORIES = [
  { value: 'part', label: 'Deo' },
  { value: 'material', label: 'Materijal' },
  { value: 'labor', label: 'Rad' },
]
const UNITS = ['kom', 'l', 'kg', 'm', 'h']

const EMPTY_ROW = { name: '', oem_number: '', category: 'part', unit: 'kom', price: '', notes: '' }

function catLabel(val) {
  return CATEGORIES.find(c => c.value === val)?.label || val
}

function InlineForm({ initial, onSave, onCancel }) {
  const [row, setRow] = useState(initial || EMPTY_ROW)
  function set(field, value) { setRow(r => ({ ...r, [field]: value })) }
  function handleSubmit(e) {
    e.preventDefault()
    if (!row.name.trim()) return
    onSave(row)
  }
  const inp = 'border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full'
  return (
    <tr className="bg-blue-50">
      <td className="px-3 py-2">
        <input className={inp} value={row.name} onChange={e => set('name', e.target.value)} placeholder="Naziv *" autoFocus />
      </td>
      <td className="px-3 py-2">
        <input className={inp} value={row.oem_number} onChange={e => set('oem_number', e.target.value)} placeholder="OEM" />
      </td>
      <td className="px-3 py-2">
        <select className={inp} value={row.category} onChange={e => set('category', e.target.value)}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </td>
      <td className="px-3 py-2">
        <select className={inp} value={row.unit} onChange={e => set('unit', e.target.value)}>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </td>
      <td className="px-3 py-2">
        <input type="number" min="0" step="0.01" className={inp} value={row.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
      </td>
      <td className="px-3 py-2">
        <input className={inp} value={row.notes} onChange={e => set('notes', e.target.value)} placeholder="Napomena" />
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        <button onClick={handleSubmit} className="text-blue-700 hover:text-blue-900 font-medium text-sm mr-2">Sačuvaj</button>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 text-sm">Otkaži</button>
      </td>
    </tr>
  )
}

export default function PartsCatalog() {
  const [catalog, setCatalog] = useState([])
  const [filtered, setFiltered] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const data = await window.api.catalog.getAll()
    const list = Array.isArray(data) ? data : []
    setCatalog(list)
    applySearch(query, list)
    setLoading(false)
  }

  function applySearch(q, list) {
    if (!q.trim()) { setFiltered(list); return }
    const lq = q.toLowerCase()
    setFiltered(list.filter(c =>
      c.name.toLowerCase().includes(lq) ||
      (c.oem_number || '').toLowerCase().includes(lq) ||
      (c.category || '').toLowerCase().includes(lq)
    ))
  }

  function handleSearch(e) {
    const q = e.target.value
    setQuery(q)
    applySearch(q, catalog)
  }

  async function handleAdd(row) {
    await window.api.catalog.create({ ...row, price: Number(row.price) || 0 })
    setAdding(false)
    load()
  }

  async function handleEdit(id, row) {
    await window.api.catalog.update(id, { ...row, price: Number(row.price) || 0 })
    setEditingId(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Obrisati stavku iz kataloga?')) return
    await window.api.catalog.remove(id)
    load()
  }

  if (loading) return <div className="p-6 text-gray-500">Učitavanje...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Katalog delova i usluga</h2>
        <button
          onClick={() => { setAdding(true); setEditingId(null) }}
          disabled={adding}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          + Dodaj stavku
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Pretraži po nazivu, OEM broju, kategoriji..."
          className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 border-b border-gray-200">
              <th className="px-3 py-3 font-medium">Naziv</th>
              <th className="px-3 py-3 font-medium">OEM broj</th>
              <th className="px-3 py-3 font-medium">Kategorija</th>
              <th className="px-3 py-3 font-medium">Jedinica</th>
              <th className="px-3 py-3 font-medium">Cena (RSD)</th>
              <th className="px-3 py-3 font-medium">Napomena</th>
              <th className="px-3 py-3 font-medium w-32"></th>
            </tr>
          </thead>
          <tbody>
            {adding && (
              <InlineForm
                onSave={handleAdd}
                onCancel={() => setAdding(false)}
              />
            )}
            {filtered.length === 0 && !adding ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-gray-400">
                  {query ? 'Nema rezultata za unetu pretragu.' : 'Katalog je prazan. Dodajte prvu stavku.'}
                </td>
              </tr>
            ) : (
              filtered.map(item => (
                editingId === item.id
                  ? <InlineForm
                      key={item.id}
                      initial={{ name: item.name, oem_number: item.oem_number || '', category: item.category || 'part', unit: item.unit || 'kom', price: String(item.price), notes: item.notes || '' }}
                      onSave={row => handleEdit(item.id, row)}
                      onCancel={() => setEditingId(null)}
                    />
                  : <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{item.name}</td>
                      <td className="px-3 py-2 text-gray-500">{item.oem_number || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{catLabel(item.category)}</td>
                      <td className="px-3 py-2 text-gray-600">{item.unit || '—'}</td>
                      <td className="px-3 py-2 text-gray-800 font-medium">{(item.price || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-gray-500 text-xs">{item.notes || '—'}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => { setEditingId(item.id); setAdding(false) }} className="text-blue-600 hover:text-blue-800 mr-3">Izmeni</button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">Obriši</button>
                      </td>
                    </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {catalog.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">{catalog.length} stavki u katalogu</p>
      )}
    </div>
  )
}

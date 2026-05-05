import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function TopBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebounce(query, 250)
  const containerRef = useRef(null)

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null)
      setOpen(false)
      return
    }
    window.api.dashboard.globalSearch(debouncedQuery).then(r => {
      setResults(r)
      setOpen(true)
    })
  }, [debouncedQuery])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((path) => {
    setQuery('')
    setOpen(false)
    navigate(path)
  }, [navigate])

  const hasResults = results && (
    results.vehicles?.length > 0 || results.owners?.length > 0 || results.orders?.length > 0
  )

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="text-base font-semibold text-gray-800 flex-shrink-0">
        Elektronska Servisna Knjižica
      </h1>

      {/* GlobalSearch */}
      <div className="relative ml-4 flex-1 max-w-md" ref={containerRef}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => hasResults && setOpen(true)}
            placeholder="Pretraži vozila, vlasnike, naloge..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setOpen(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>

        {open && (
          <div className="absolute top-full mt-1 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {!hasResults ? (
              <p className="text-sm text-gray-400 px-4 py-3">Nema rezultata za &ldquo;{debouncedQuery}&rdquo;</p>
            ) : (
              <>
                {results.vehicles?.length > 0 && (
                  <section>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      Vozila
                    </div>
                    {results.vehicles.map(v => (
                      <button
                        key={v.id}
                        onClick={() => handleSelect(`/vehicles/${v.id}`)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 border-b border-gray-50"
                      >
                        <span className="text-sm font-medium text-gray-900">{v.make} {v.model}</span>
                        <span className="text-xs text-gray-400">{v.license_plate || v.vin}</span>
                      </button>
                    ))}
                  </section>
                )}
                {results.owners?.length > 0 && (
                  <section>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      Vlasnici
                    </div>
                    {results.owners.map(o => (
                      <button
                        key={o.id}
                        onClick={() => handleSelect(`/owners/${o.id}`)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 border-b border-gray-50"
                      >
                        <span className="text-sm font-medium text-gray-900">{o.first_name} {o.last_name}</span>
                        <span className="text-xs text-gray-400">{o.phone}</span>
                      </button>
                    ))}
                  </section>
                )}
                {results.orders?.length > 0 && (
                  <section>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      Servisni nalozi
                    </div>
                    {results.orders.map(ord => (
                      <button
                        key={ord.id}
                        onClick={() => handleSelect(`/service-orders/${ord.id}`)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3"
                      >
                        <span className="text-sm font-mono text-gray-700">{ord.order_number || `#${ord.id}`}</span>
                        <span className="text-sm text-gray-900">{ord.make} {ord.model}</span>
                        <span className="text-xs text-gray-400">{ord.license_plate}</span>
                      </button>
                    ))}
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

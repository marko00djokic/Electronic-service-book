# Faza 2 — Upravljanje vozilima i vlasnicima: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementirati kompletan CRUD za vozila i vlasnike u desktop Electron aplikaciji — modeli, IPC handleri i React stranice.

**Architecture:** Tri sloja — SQLite modeli u main procesu, IPC handleri koji ekspozuju operacije, React renderer koji poziva `window.api.*` kroz preload bridge. Navigacija je zasnovana na React Router v6 rutama.

**Tech Stack:** Electron, React 18, React Router v6, better-sqlite3, TailwindCSS 3

---

## Napomena o testovima

Projekat nema podešenu test infrastrukturu — nema Jest, Vitest, ni Playwright. Umesto TDD koraka, plan sadrži **manuelnu verifikaciju** kroz `npm run dev` (Electron DevTools konzola + UI interakcija). Verifikacioni koraci su eksplicitni i konkretni.

**Preduslovi pre pokretanja:**
- VS 2022 Community instaliran sa "Desktop development with C++" workload
- `cd desktop-app && npm run postinstall` izvršen (kompajlira better-sqlite3)
- `npm run dev` pokreće Electron prozor bez grešaka

---

## Mapa fajlova

| Fajl | Akcija | Odgovornost |
|------|--------|-------------|
| `desktop-app/src/main/models/vehicle.js` | Kreirati | SQLite CRUD za vozila |
| `desktop-app/src/main/models/owner.js` | Kreirati | SQLite CRUD za vlasnike |
| `desktop-app/src/main/models/ownershipHistory.js` | Kreirati | Istorija vlasništva |
| `desktop-app/src/main/ipc/vehicles-ipc.js` | Kreirati | IPC handleri za vozila |
| `desktop-app/src/main/ipc/owners-ipc.js` | Kreirati | IPC handleri za vlasnike |
| `desktop-app/src/main/ipc/index.js` | Izmeniti | Registracija novih handlera |
| `desktop-app/src/preload/index.js` | Izmeniti | window.api.vehicles, .owners, .ownership |
| `desktop-app/src/renderer/src/App.jsx` | Izmeniti | Nove rute za vozila i vlasnike |
| `desktop-app/src/renderer/src/pages/vehicles/VehicleList.jsx` | Kreirati | Lista vozila sa pretragom |
| `desktop-app/src/renderer/src/pages/vehicles/VehicleForm.jsx` | Kreirati | Forma za dodavanje/izmenu vozila |
| `desktop-app/src/renderer/src/pages/vehicles/VehicleDetail.jsx` | Kreirati | Detalji vozila + istorija vlasništva |
| `desktop-app/src/renderer/src/pages/owners/OwnerList.jsx` | Kreirati | Lista vlasnika sa pretragom |
| `desktop-app/src/renderer/src/pages/owners/OwnerForm.jsx` | Kreirati | Forma za dodavanje/izmenu vlasnika |
| `desktop-app/src/renderer/src/pages/owners/OwnerDetail.jsx` | Kreirati | Detalji vlasnika + lista vozila |
| `CLAUDE.md` | Izmeniti | Dodati napomene o migracijama i granama |
| `.claude/progress.md` | Izmeniti | Označiti Fazu 2 kao završenu |
| `.claude/tasks.md` | Izmeniti | Označiti Faza 2 taskove kao [x] |

---

## Task 1: Ažurirati CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Korak 1: Dodati napomenu o migracionim fajlovima i granama u CLAUDE.md**

  Otvori `CLAUDE.md` i dodaj sledeće dve napomene u sekciju **VAZNE KONVENCIJE**:

  ```markdown
  - Migracioni fajlovi idu u `desktop-app/database/migrations/` (ne u `src/main/migrations/`)
    — Napomena: `001_initial.js` je kreiran u `src/main/migrations/` pre uvođenja ove konvencije i ne treba ga pomerati
  - Za razvoj novih funkcionalnosti kreiraj GitHub granu (npr. `feature/phase-2-vehicles`), nemoj koristiti `.worktrees/` direktorijume — verzionisanje ide kroz GitHub, ne kroz lokalne foldere
  ```

- [ ] **Korak 2: Commit**

  ```bash
  git add CLAUDE.md
  git commit -m "docs: add migration path and branch conventions to CLAUDE.md"
  ```

---

## Task 2: Data modeli (main process)

**Files:**
- Create: `desktop-app/src/main/models/vehicle.js`
- Create: `desktop-app/src/main/models/owner.js`
- Create: `desktop-app/src/main/models/ownershipHistory.js`

- [ ] **Korak 1: Kreirati `desktop-app/src/main/models/vehicle.js`**

  ```js
  import { getDatabase } from '../database.js'

  export function getAll() {
    const db = getDatabase()
    return db.prepare(`
      SELECT v.*,
             o.first_name || ' ' || o.last_name AS current_owner_name,
             o.id AS current_owner_id
      FROM vehicles v
      LEFT JOIN ownership_history oh ON oh.vehicle_id = v.id AND oh.end_date IS NULL
      LEFT JOIN owners o ON o.id = oh.owner_id
      ORDER BY v.make, v.model
    `).all()
  }

  export function getById(id) {
    const db = getDatabase()
    return db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id)
  }

  export function create(data) {
    const db = getDatabase()
    const { vin, license_plate, make, model, year, engine_type,
            engine_displacement, engine_power, color, first_registration_date, notes } = data
    const result = db.prepare(`
      INSERT INTO vehicles
        (vin, license_plate, make, model, year, engine_type,
         engine_displacement, engine_power, color, first_registration_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vin.toUpperCase(), license_plate || null, make, model, year,
      engine_type || null, engine_displacement || null, engine_power || null,
      color || null, first_registration_date || null, notes || null
    )
    return getById(result.lastInsertRowid)
  }

  export function update(id, data) {
    const db = getDatabase()
    const { vin, license_plate, make, model, year, engine_type,
            engine_displacement, engine_power, color, first_registration_date, notes } = data
    db.prepare(`
      UPDATE vehicles SET
        vin = ?, license_plate = ?, make = ?, model = ?, year = ?,
        engine_type = ?, engine_displacement = ?, engine_power = ?,
        color = ?, first_registration_date = ?, notes = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      vin.toUpperCase(), license_plate || null, make, model, year,
      engine_type || null, engine_displacement || null, engine_power || null,
      color || null, first_registration_date || null, notes || null,
      id
    )
    return getById(id)
  }

  export function remove(id) {
    const db = getDatabase()
    db.prepare('DELETE FROM ownership_history WHERE vehicle_id = ?').run(id)
    db.prepare('DELETE FROM vehicles WHERE id = ?').run(id)
    return { success: true }
  }

  export function search(query) {
    const db = getDatabase()
    const q = `%${query}%`
    return db.prepare(`
      SELECT v.*,
             o.first_name || ' ' || o.last_name AS current_owner_name,
             o.id AS current_owner_id
      FROM vehicles v
      LEFT JOIN ownership_history oh ON oh.vehicle_id = v.id AND oh.end_date IS NULL
      LEFT JOIN owners o ON o.id = oh.owner_id
      WHERE v.vin LIKE ? OR v.make LIKE ? OR v.model LIKE ? OR v.license_plate LIKE ?
      ORDER BY v.make, v.model
    `).all(q, q, q, q)
  }
  ```

- [ ] **Korak 2: Kreirati `desktop-app/src/main/models/owner.js`**

  ```js
  import { getDatabase } from '../database.js'

  export function getAll() {
    const db = getDatabase()
    return db.prepare('SELECT * FROM owners ORDER BY last_name, first_name').all()
  }

  export function getById(id) {
    const db = getDatabase()
    return db.prepare('SELECT * FROM owners WHERE id = ?').get(id)
  }

  export function create(data) {
    const db = getDatabase()
    const { first_name, last_name, phone, email, address, city } = data
    const result = db.prepare(`
      INSERT INTO owners (first_name, last_name, phone, email, address, city)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      first_name, last_name,
      phone || null, email || null, address || null, city || null
    )
    return getById(result.lastInsertRowid)
  }

  export function update(id, data) {
    const db = getDatabase()
    const { first_name, last_name, phone, email, address, city } = data
    db.prepare(`
      UPDATE owners SET
        first_name = ?, last_name = ?, phone = ?, email = ?,
        address = ?, city = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      first_name, last_name,
      phone || null, email || null, address || null, city || null,
      id
    )
    return getById(id)
  }

  export function remove(id) {
    const db = getDatabase()
    const active = db.prepare(`
      SELECT COUNT(*) AS count FROM ownership_history
      WHERE owner_id = ? AND end_date IS NULL
    `).get(id)
    if (active.count > 0) {
      throw new Error('Vlasnik ima aktivno vozilo i ne može biti obrisan')
    }
    db.prepare('DELETE FROM owners WHERE id = ?').run(id)
    return { success: true }
  }

  export function search(query) {
    const db = getDatabase()
    const q = `%${query}%`
    return db.prepare(`
      SELECT * FROM owners
      WHERE first_name LIKE ? OR last_name LIKE ? OR phone LIKE ?
      ORDER BY last_name, first_name
    `).all(q, q, q)
  }
  ```

- [ ] **Korak 3: Kreirati `desktop-app/src/main/models/ownershipHistory.js`**

  ```js
  import { getDatabase } from '../database.js'

  export function getByVehicle(vehicleId) {
    const db = getDatabase()
    return db.prepare(`
      SELECT oh.*,
             o.first_name || ' ' || o.last_name AS owner_name,
             o.phone AS owner_phone
      FROM ownership_history oh
      JOIN owners o ON o.id = oh.owner_id
      WHERE oh.vehicle_id = ?
      ORDER BY oh.start_date DESC
    `).all(vehicleId)
  }

  export function getByOwner(ownerId) {
    const db = getDatabase()
    return db.prepare(`
      SELECT oh.*,
             v.make, v.model, v.year, v.vin, v.license_plate
      FROM ownership_history oh
      JOIN vehicles v ON v.id = oh.vehicle_id
      WHERE oh.owner_id = ?
      ORDER BY oh.start_date DESC
    `).all(ownerId)
  }

  export function addOwner(vehicleId, ownerId, startDate) {
    const db = getDatabase()
    const run = db.transaction(() => {
      db.prepare(`
        UPDATE ownership_history SET end_date = ?
        WHERE vehicle_id = ? AND end_date IS NULL
      `).run(startDate, vehicleId)
      const result = db.prepare(`
        INSERT INTO ownership_history (vehicle_id, owner_id, start_date)
        VALUES (?, ?, ?)
      `).run(vehicleId, ownerId, startDate)
      return result.lastInsertRowid
    })
    return run()
  }
  ```

- [ ] **Korak 4: Commit**

  ```bash
  git add desktop-app/src/main/models/
  git commit -m "feat: add vehicle, owner, ownershipHistory SQLite models"
  ```

---

## Task 3: IPC sloj + Preload

**Files:**
- Create: `desktop-app/src/main/ipc/vehicles-ipc.js`
- Create: `desktop-app/src/main/ipc/owners-ipc.js`
- Modify: `desktop-app/src/main/ipc/index.js`
- Modify: `desktop-app/src/preload/index.js`

- [ ] **Korak 1: Kreirati `desktop-app/src/main/ipc/vehicles-ipc.js`**

  ```js
  import { ipcMain } from 'electron'
  import * as vehicle from '../models/vehicle.js'
  import * as ownershipHistory from '../models/ownershipHistory.js'

  export function registerVehicleHandlers() {
    ipcMain.handle('vehicles:getAll', () => {
      try { return vehicle.getAll() }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('vehicles:getById', (_, id) => {
      try { return vehicle.getById(id) }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('vehicles:create', (_, data) => {
      try { return vehicle.create(data) }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('vehicles:update', (_, id, data) => {
      try { return vehicle.update(id, data) }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('vehicles:remove', (_, id) => {
      try { return vehicle.remove(id) }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('vehicles:search', (_, query) => {
      try { return vehicle.search(query) }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('ownershipHistory:getByVehicle', (_, vehicleId) => {
      try { return ownershipHistory.getByVehicle(vehicleId) }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('ownershipHistory:addOwner', (_, vehicleId, ownerId, startDate) => {
      try { return ownershipHistory.addOwner(vehicleId, ownerId, startDate) }
      catch (err) { return { error: err.message } }
    })
  }
  ```

- [ ] **Korak 2: Kreirati `desktop-app/src/main/ipc/owners-ipc.js`**

  ```js
  import { ipcMain } from 'electron'
  import * as owner from '../models/owner.js'
  import * as ownershipHistory from '../models/ownershipHistory.js'

  export function registerOwnerHandlers() {
    ipcMain.handle('owners:getAll', () => {
      try { return owner.getAll() }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('owners:getById', (_, id) => {
      try { return owner.getById(id) }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('owners:create', (_, data) => {
      try { return owner.create(data) }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('owners:update', (_, id, data) => {
      try { return owner.update(id, data) }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('owners:remove', (_, id) => {
      try { return owner.remove(id) }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('owners:search', (_, query) => {
      try { return owner.search(query) }
      catch (err) { return { error: err.message } }
    })

    ipcMain.handle('ownershipHistory:getByOwner', (_, ownerId) => {
      try { return ownershipHistory.getByOwner(ownerId) }
      catch (err) { return { error: err.message } }
    })
  }
  ```

- [ ] **Korak 3: Izmeniti `desktop-app/src/main/ipc/index.js`**

  Zameni kompletan sadržaj fajla:

  ```js
  import { ipcMain } from 'electron'
  import { registerVehicleHandlers } from './vehicles-ipc.js'
  import { registerOwnerHandlers } from './owners-ipc.js'

  export function registerIpcHandlers() {
    ipcMain.handle('ping', () => 'pong')
    registerVehicleHandlers()
    registerOwnerHandlers()
  }
  ```

- [ ] **Korak 4: Izmeniti `desktop-app/src/preload/index.js`**

  Zameni kompletan sadržaj fajla:

  ```js
  import { contextBridge, ipcRenderer } from 'electron'

  contextBridge.exposeInMainWorld('api', {
    ping: () => ipcRenderer.invoke('ping'),

    vehicles: {
      getAll:   ()          => ipcRenderer.invoke('vehicles:getAll'),
      getById:  (id)        => ipcRenderer.invoke('vehicles:getById', id),
      create:   (data)      => ipcRenderer.invoke('vehicles:create', data),
      update:   (id, data)  => ipcRenderer.invoke('vehicles:update', id, data),
      remove:   (id)        => ipcRenderer.invoke('vehicles:remove', id),
      search:   (query)     => ipcRenderer.invoke('vehicles:search', query),
    },

    owners: {
      getAll:   ()          => ipcRenderer.invoke('owners:getAll'),
      getById:  (id)        => ipcRenderer.invoke('owners:getById', id),
      create:   (data)      => ipcRenderer.invoke('owners:create', data),
      update:   (id, data)  => ipcRenderer.invoke('owners:update', id, data),
      remove:   (id)        => ipcRenderer.invoke('owners:remove', id),
      search:   (query)     => ipcRenderer.invoke('owners:search', query),
    },

    ownership: {
      getByVehicle: (vehicleId)                       => ipcRenderer.invoke('ownershipHistory:getByVehicle', vehicleId),
      addOwner:     (vehicleId, ownerId, startDate)   => ipcRenderer.invoke('ownershipHistory:addOwner', vehicleId, ownerId, startDate),
      getByOwner:   (ownerId)                         => ipcRenderer.invoke('ownershipHistory:getByOwner', ownerId),
    }
  })
  ```

- [ ] **Korak 5: Commit**

  ```bash
  git add desktop-app/src/main/ipc/ desktop-app/src/preload/index.js
  git commit -m "feat: add vehicles and owners IPC handlers, update preload API"
  ```

---

## Task 4: React rute

**Files:**
- Modify: `desktop-app/src/renderer/src/App.jsx`

- [ ] **Korak 1: Izmeniti `App.jsx`**

  Zameni kompletan sadržaj fajla:

  ```jsx
  import { HashRouter, Routes, Route } from 'react-router-dom'
  import Layout from './components/layout/Layout'
  import Dashboard from './pages/Dashboard'
  import ServiceOrders from './pages/ServiceOrders'
  import Catalog from './pages/Catalog'
  import Reminders from './pages/Reminders'
  import VehicleList from './pages/vehicles/VehicleList'
  import VehicleForm from './pages/vehicles/VehicleForm'
  import VehicleDetail from './pages/vehicles/VehicleDetail'
  import OwnerList from './pages/owners/OwnerList'
  import OwnerForm from './pages/owners/OwnerForm'
  import OwnerDetail from './pages/owners/OwnerDetail'

  export default function App() {
    return (
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />

            <Route path="vehicles" element={<VehicleList />} />
            <Route path="vehicles/new" element={<VehicleForm />} />
            <Route path="vehicles/:id" element={<VehicleDetail />} />
            <Route path="vehicles/:id/edit" element={<VehicleForm />} />

            <Route path="owners" element={<OwnerList />} />
            <Route path="owners/new" element={<OwnerForm />} />
            <Route path="owners/:id" element={<OwnerDetail />} />
            <Route path="owners/:id/edit" element={<OwnerForm />} />

            <Route path="service-orders" element={<ServiceOrders />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="reminders" element={<Reminders />} />
          </Route>
        </Routes>
      </HashRouter>
    )
  }
  ```

- [ ] **Korak 2: Commit**

  ```bash
  git add desktop-app/src/renderer/src/App.jsx
  git commit -m "feat: add vehicle and owner routes to React Router"
  ```

---

## Task 5: Vehicle stranice

**Files:**
- Create: `desktop-app/src/renderer/src/pages/vehicles/VehicleList.jsx`
- Create: `desktop-app/src/renderer/src/pages/vehicles/VehicleForm.jsx`
- Create: `desktop-app/src/renderer/src/pages/vehicles/VehicleDetail.jsx`

- [ ] **Korak 1: Kreirati `desktop-app/src/renderer/src/pages/vehicles/VehicleList.jsx`**

  ```jsx
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
  ```

- [ ] **Korak 2: Kreirati `desktop-app/src/renderer/src/pages/vehicles/VehicleForm.jsx`**

  ```jsx
  import { useState, useEffect } from 'react'
  import { useNavigate, useParams } from 'react-router-dom'

  const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i

  // Definisano van komponente da React ne bi unmountovao/remountovao pri svakom renderu
  function Field({ label, name, required, type = 'text', fields, errors, touched, onChange, onBlur, children, ...rest }) {
    const showError = touched[name] && errors[name]
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children || (
          <input
            type={type}
            name={name}
            value={fields[name]}
            onChange={onChange}
            onBlur={onBlur}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${showError ? 'border-red-500' : 'border-gray-300'}`}
            {...rest}
          />
        )}
        {showError && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
      </div>
    )
  }

  function validateVehicle(f) {
    const errors = {}
    if (!f.vin) errors.vin = 'VIN je obavezan'
    else if (!VIN_REGEX.test(f.vin)) errors.vin = 'VIN mora biti 17 alfanumeričkih karaktera (bez I, O, Q)'
    if (!f.make) errors.make = 'Marka je obavezna'
    if (!f.model) errors.model = 'Model je obavezan'
    if (!f.year) errors.year = 'Godište je obavezno'
    else if (Number(f.year) < 1900 || Number(f.year) > new Date().getFullYear() + 1)
      errors.year = 'Neispravno godište'
    return errors
  }

  // Field je definisan van VehicleForm da ne bi bio unmounted/remounted na svaki render
  // (definisanje komponente unutar komponente uzrokuje gubitak fokusa pri kucanju)

  const EMPTY = {
    vin: '', license_plate: '', make: '', model: '', year: '',
    engine_type: '', engine_displacement: '', engine_power: '',
    color: '', first_registration_date: '', notes: ''
  }

  export default function VehicleForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = Boolean(id)

    const [fields, setFields] = useState(EMPTY)
    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})
    const [saving, setSaving] = useState(false)
    const [serverError, setServerError] = useState('')

    useEffect(() => {
      if (!isEdit) return
      window.api.vehicles.getById(Number(id)).then(v => {
        if (!v) return
        setFields({
          vin: v.vin || '',
          license_plate: v.license_plate || '',
          make: v.make || '',
          model: v.model || '',
          year: v.year ? String(v.year) : '',
          engine_type: v.engine_type || '',
          engine_displacement: v.engine_displacement ? String(v.engine_displacement) : '',
          engine_power: v.engine_power ? String(v.engine_power) : '',
          color: v.color || '',
          first_registration_date: v.first_registration_date || '',
          notes: v.notes || ''
        })
      })
    }, [id])

    function handleChange(e) {
      const { name, value } = e.target
      setFields(f => ({ ...f, [name]: value }))
      if (touched[name]) setErrors(validateVehicle({ ...fields, [name]: value }))
    }

    function handleBlur(e) {
      const { name } = e.target
      setTouched(t => ({ ...t, [name]: true }))
      setErrors(validateVehicle(fields))
    }

    async function handleSubmit(e) {
      e.preventDefault()
      const allTouched = Object.keys(EMPTY).reduce((a, k) => ({ ...a, [k]: true }), {})
      setTouched(allTouched)
      const errs = validateVehicle(fields)
      setErrors(errs)
      if (Object.keys(errs).length > 0) return

      setSaving(true)
      setServerError('')
      const data = {
        ...fields,
        vin: fields.vin.toUpperCase(),
        year: Number(fields.year),
        engine_displacement: fields.engine_displacement ? Number(fields.engine_displacement) : null,
        engine_power: fields.engine_power ? Number(fields.engine_power) : null,
      }

      const result = isEdit
        ? await window.api.vehicles.update(Number(id), data)
        : await window.api.vehicles.create(data)

      if (result?.error) {
        setServerError(result.error)
        setSaving(false)
        return
      }

      navigate(isEdit ? `/vehicles/${id}` : `/vehicles/${result.id}`)
    }

    const hasValidationErrors = Object.keys(touched).length > 0 && Object.keys(validateVehicle(fields)).length > 0

    return (
      <div className="p-6 max-w-2xl">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm mb-4">← Nazad</button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Izmena vozila' : 'Novo vozilo'}
        </h2>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field name="vin" label="VIN" required fields={fields} errors={errors} touched={touched}
            onChange={handleChange} onBlur={handleBlur} placeholder="npr. WBA1A2B3C4D567890" />

          <div className="grid grid-cols-2 gap-4">
            <Field name="make" label="Marka" required fields={fields} errors={errors} touched={touched}
              onChange={handleChange} onBlur={handleBlur} placeholder="npr. Volkswagen" />
            <Field name="model" label="Model" required fields={fields} errors={errors} touched={touched}
              onChange={handleChange} onBlur={handleBlur} placeholder="npr. Golf" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field name="year" label="Godište" required type="number" fields={fields} errors={errors} touched={touched}
              onChange={handleChange} onBlur={handleBlur} min="1900" max={new Date().getFullYear() + 1} />
            <Field name="license_plate" label="Registarska oznaka" fields={fields} errors={errors} touched={touched}
              onChange={handleChange} onBlur={handleBlur} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field name="engine_type" label="Vrsta motora" fields={fields} errors={errors} touched={touched}
              onChange={handleChange} onBlur={handleBlur}>
              <select name="engine_type" value={fields.engine_type} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">—</option>
                <option value="benzin">Benzin</option>
                <option value="dizel">Dizel</option>
                <option value="elektro">Elektro</option>
                <option value="hibrid">Hibrid</option>
              </select>
            </Field>
            <Field name="engine_displacement" label="Zapremina (cm³)" type="number" fields={fields} errors={errors} touched={touched}
              onChange={handleChange} onBlur={handleBlur} min="0" />
            <Field name="engine_power" label="Snaga (kW)" type="number" fields={fields} errors={errors} touched={touched}
              onChange={handleChange} onBlur={handleBlur} min="0" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field name="color" label="Boja" fields={fields} errors={errors} touched={touched}
              onChange={handleChange} onBlur={handleBlur} />
            <Field name="first_registration_date" label="Prva registracija" type="date" fields={fields} errors={errors} touched={touched}
              onChange={handleChange} onBlur={handleBlur} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Napomene</label>
            <textarea name="notes" value={fields.notes} onChange={handleChange} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || hasValidationErrors}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
              {saving ? 'Snimanje...' : 'Sačuvaj'}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 text-sm">
              Otkaži
            </button>
          </div>
        </form>
      </div>
    )
  }
  ```

- [ ] **Korak 3: Kreirati `desktop-app/src/renderer/src/pages/vehicles/VehicleDetail.jsx`**

  ```jsx
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
  ```

- [ ] **Korak 4: Commit**

  ```bash
  git add desktop-app/src/renderer/src/pages/vehicles/
  git commit -m "feat: add VehicleList, VehicleForm, VehicleDetail pages"
  ```

---

## Task 6: Owner stranice

**Files:**
- Create: `desktop-app/src/renderer/src/pages/owners/OwnerList.jsx`
- Create: `desktop-app/src/renderer/src/pages/owners/OwnerForm.jsx`
- Create: `desktop-app/src/renderer/src/pages/owners/OwnerDetail.jsx`

- [ ] **Korak 1: Kreirati `desktop-app/src/renderer/src/pages/owners/OwnerList.jsx`**

  ```jsx
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
  ```

- [ ] **Korak 2: Kreirati `desktop-app/src/renderer/src/pages/owners/OwnerForm.jsx`**

  ```jsx
  import { useState, useEffect } from 'react'
  import { useNavigate, useParams } from 'react-router-dom'

  const PHONE_REGEX = /^(\+381|06)\d{7,9}$/

  function validateOwner(f) {
    const errors = {}
    if (!f.first_name) errors.first_name = 'Ime je obavezno'
    if (!f.last_name) errors.last_name = 'Prezime je obavezno'
    if (f.phone && !PHONE_REGEX.test(f.phone))
      errors.phone = 'Format: +381XXXXXXXXX ili 06XXXXXXXX'
    return errors
  }

  // Definisano van komponente da React ne bi unmountovao/remountovao pri svakom renderu
  function F({ name, label, required, type = 'text', fields, errors, touched, onChange, onBlur, ...rest }) {
    const showError = touched[name] && errors[name]
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input type={type} name={name} value={fields[name]}
          onChange={onChange} onBlur={onBlur}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${showError ? 'border-red-500' : 'border-gray-300'}`}
          {...rest} />
        {showError && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
      </div>
    )
  }

  const EMPTY = { first_name: '', last_name: '', phone: '', email: '', address: '', city: '' }

  export default function OwnerForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEdit = Boolean(id)

    const [fields, setFields] = useState(EMPTY)
    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})
    const [saving, setSaving] = useState(false)
    const [serverError, setServerError] = useState('')

    useEffect(() => {
      if (!isEdit) return
      window.api.owners.getById(Number(id)).then(o => {
        if (!o) return
        setFields({
          first_name: o.first_name || '',
          last_name: o.last_name || '',
          phone: o.phone || '',
          email: o.email || '',
          address: o.address || '',
          city: o.city || ''
        })
      })
    }, [id])

    function handleChange(e) {
      const { name, value } = e.target
      setFields(f => ({ ...f, [name]: value }))
      if (touched[name]) setErrors(validateOwner({ ...fields, [name]: value }))
    }

    function handleBlur(e) {
      const { name } = e.target
      setTouched(t => ({ ...t, [name]: true }))
      setErrors(validateOwner(fields))
    }

    async function handleSubmit(e) {
      e.preventDefault()
      const allTouched = Object.keys(EMPTY).reduce((a, k) => ({ ...a, [k]: true }), {})
      setTouched(allTouched)
      const errs = validateOwner(fields)
      setErrors(errs)
      if (Object.keys(errs).length > 0) return

      setSaving(true)
      setServerError('')
      const result = isEdit
        ? await window.api.owners.update(Number(id), fields)
        : await window.api.owners.create(fields)

      if (result?.error) { setServerError(result.error); setSaving(false); return }
      navigate(isEdit ? `/owners/${id}` : `/owners/${result.id}`)
    }

    const hasValidationErrors = Object.keys(touched).length > 0 && Object.keys(validateOwner(fields)).length > 0

    return (
      <div className="p-6 max-w-lg">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-sm mb-4">← Nazad</button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Izmena vlasnika' : 'Novi vlasnik'}
        </h2>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <F name="first_name" label="Ime" required fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />
            <F name="last_name" label="Prezime" required fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />
          </div>
          <F name="phone" label="Telefon" placeholder="+381XXXXXXXXX ili 06XXXXXXXX" fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />
          <F name="email" label="Email" type="email" fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />
          <F name="address" label="Adresa" fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />
          <F name="city" label="Grad" fields={fields} errors={errors} touched={touched} onChange={handleChange} onBlur={handleBlur} />

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || hasValidationErrors}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
              {saving ? 'Snimanje...' : 'Sačuvaj'}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 text-sm">
              Otkaži
            </button>
          </div>
        </form>
      </div>
    )
  }
  ```

- [ ] **Korak 3: Kreirati `desktop-app/src/renderer/src/pages/owners/OwnerDetail.jsx`**

  ```jsx
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
  ```

- [ ] **Korak 4: Commit**

  ```bash
  git add desktop-app/src/renderer/src/pages/owners/
  git commit -m "feat: add OwnerList, OwnerForm, OwnerDetail pages"
  ```

---

## Task 7: Manuelna verifikacija

**Preduslovi:** better-sqlite3 mora biti kompajliran (VS 2022 + `npm run postinstall`)

- [ ] **Korak 1: Pokrenuti aplikaciju**

  ```bash
  cd desktop-app && npm run dev
  ```

  Očekivano: Electron prozor se otvori bez grešaka u terminal output-u.

- [ ] **Korak 2: Verifikovati IPC ping**

  U Electron DevTools konzoli (automatski otvoren pri dev modu):
  ```js
  await window.api.ping()
  // Očekivano: "pong"
  ```

- [ ] **Korak 3: Verifikovati vozila CRUD**

  U DevTools konzoli:
  ```js
  // Kreiranje vozila
  const v = await window.api.vehicles.create({
    vin: 'WBA1A2B3C4D567890', make: 'BMW', model: '320d', year: 2020,
    license_plate: 'BG123AB', engine_type: 'dizel', engine_displacement: 1995,
    engine_power: 140, color: 'Crna'
  })
  console.log(v) // Očekivano: { id: 1, vin: 'WBA1A2B3C4D567890', make: 'BMW', ... }

  // Dohvatanje svih vozila
  await window.api.vehicles.getAll()
  // Očekivano: [{...}] sa BMW

  // Pretraga
  await window.api.vehicles.search('BMW')
  // Očekivano: [{...}] sa BMW
  ```

- [ ] **Korak 4: Verifikovati vlasnike CRUD**

  ```js
  const o = await window.api.owners.create({
    first_name: 'Petar', last_name: 'Petrović',
    phone: '0641234567', city: 'Beograd'
  })
  console.log(o) // Očekivano: { id: 1, first_name: 'Petar', ... }

  await window.api.owners.getAll()
  // Očekivano: [{ id: 1, ... }]
  ```

- [ ] **Korak 5: Verifikovati istoriju vlasništva**

  ```js
  // Dodavanje vlasnika vozilu (koristiti id-eve iz prethodnih koraka)
  await window.api.ownership.addOwner(1, 1, '2020-06-15')
  // Očekivano: 1 (lastInsertRowid)

  await window.api.ownership.getByVehicle(1)
  // Očekivano: [{ owner_name: 'Petar Petrović', start_date: '2020-06-15', end_date: null }]
  ```

- [ ] **Korak 6: Verifikovati UI stranice**

  Kliknuti kroz UI:
  - Meni "Vozila" → lista se prikazuje (prazna ili sa dodanim vozilom)
  - "+ Novo vozilo" → forma se otvara
  - Uneti vozilo sa neispravnim VIN-om → crvena poruka greške ispod polja
  - Uneti ispravno vozilo → redirekt na detalje
  - Klik na vozilo u listi → detalji vozila
  - "Izmeni" → forma popunjena podacima
  - "Obriši" → confirm dialog, vozilo nestaje iz liste
  - Meni "Vlasnici" → isti flow za vlasnike

---

## Task 8: Ažuriranje kontekstnih fajlova

**Files:**
- Modify: `.claude/progress.md`
- Modify: `.claude/tasks.md`

- [ ] **Korak 1: Ažurirati `.claude/progress.md`**

  Dodaj novu sekciju na kraj fajla:

  ```markdown
  ## Sesija: 2026-05-04 — Faza 2 završena

  ### Šta je urađeno:
  - SQLite modeli: vehicle.js, owner.js, ownershipHistory.js
  - IPC handleri: vehicles-ipc.js, owners-ipc.js, registrovani u ipc/index.js
  - Preload API: window.api.vehicles, window.api.owners, window.api.ownership
  - React stranice: VehicleList, VehicleForm, VehicleDetail, OwnerList, OwnerForm, OwnerDetail
  - React Router rute za /vehicles/* i /owners/*
  - Validacije: VIN (17 chars, bez I/O/Q), telefon (srpski format), obavezna polja
  - CLAUDE.md ažuriran: putanja migracija, konvencija za grane

  ### Trenutno stanje koda:

  | Komponenta                  | Status              |
  |-----------------------------|---------------------|
  | Projektna dokumentacija     | ✅ Završena         |
  | Desktop app setup           | ✅ Faza 1 završena  |
  | SQLite šema + migracije     | ✅ DDL kreiran      |
  | Vozila CRUD                 | ✅ Faza 2 završena  |
  | Vlasnici CRUD               | ✅ Faza 2 završena  |
  | Servisni nalozi             | ❌ Nije početo      |
  | Katalog delova/usluga       | ❌ Nije početo      |
  | PDF export                  | ❌ Nije početo      |
  | Dashboard + podsetnici      | ❌ Nije početo      |
  | Cloud API (Express)         | ❌ Nije početo      |
  | MySQL šema                  | ❌ Nije početo      |
  | Sync mehanizam              | ❌ Nije početo      |
  | Web portal                  | ❌ Nije početo      |
  | Windows installer           | ⚠️ Config kreiran, build nije testiran |

  ### Sledeća sesija treba da počne sa:
  Faza 3 — Servisni nalozi.
  Prompt za ovu fazu: `docs/Electronic-service-book.md` → FAZA 3 PROMPT
  ```

- [ ] **Korak 2: Ažurirati `.claude/tasks.md` — označiti Faza 2 taskove**

  U fajlu `.claude/tasks.md`, zameni sve `- [ ]` u sekciji **FAZA 2** sa `- [x]`:

  ```markdown
  ## FAZA 2 — Vozila i Vlasnici ✅ ZAVRŠENA

  - [x] SQLite migracije: vehicles, owners, ownership_history tabele
  - [x] Vehicle model i CRUD operacije (main process)
  - [x] Owner model i CRUD operacije (main process)
  - [x] IPC handlers za vozila i vlasnike
  - [x] VehicleList stranica sa pretragom i filterima
  - [x] VehicleForm komponenta (dodavanje/editovanje)
  - [x] VehicleDetail stranica sa istorijom vlasništva
  - [x] OwnerList stranica
  - [x] OwnerForm komponenta
  - [x] OwnerDetail stranica sa listom vozila
  - [x] Validacije formi (VIN format, obavezna polja)
  ```

- [ ] **Korak 3: Final commit**

  ```bash
  git add .claude/progress.md .claude/tasks.md
  git commit -m "docs: mark Phase 2 complete, update progress and tasks"
  ```

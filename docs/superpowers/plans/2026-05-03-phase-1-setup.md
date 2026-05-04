# Phase 1 — Project Setup + Osnovna Struktura Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postaviti kompletan Electron + React + SQLite boilerplate sa navigacijom i praznim tabelama baze.

**Architecture:** Electron main process inicijalizuje SQLite bazu i registruje IPC handlere; preload.js eksponuje `window.api` kroz contextBridge; React renderer koristi React Router 6 sa Layout/Sidebar/TopBar komponentama i placeholder stranicama za svaki modul.

**Tech Stack:** Electron 31, electron-vite 2, React 18, React Router 6, better-sqlite3, TailwindCSS 3, electron-builder 24

---

## Prerequisites

Na Windows mašini moraju biti instalirani **Visual C++ Build Tools** (potrebni za kompajliranje `better-sqlite3` native modula):
- Instaliraj iz: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Izaberi "Desktop development with C++"
- Alternativno: `npm install --global --production windows-build-tools` (deprecated, ali često radi)

Bez build tools, `npm install` će failovati na `better-sqlite3`.

---

## File Map

```
desktop-app/
├── electron.vite.config.mjs          — vite konfiguracija za main/preload/renderer
├── package.json                      — zavisnosti i npm skripte
├── tailwind.config.js                — TailwindCSS content paths
├── postcss.config.js                 — PostCSS plugin chain
├── electron-builder.config.js        — Windows NSIS installer config
├── .env.example                      — template za environment varijable
└── src/
    ├── main/
    │   ├── index.js                  — main process: window, app lifecycle, IPC boot
    │   ├── database.js               — SQLite init, migration runner, getDatabase()
    │   ├── migrations/
    │   │   └── 001_initial.js        — DDL za sve tabele (vozila, nalozi, sync...)
    │   └── ipc/
    │       └── index.js              — registracija svih IPC handlera
    ├── preload/
    │   └── index.js                  — contextBridge: window.api definicija
    └── renderer/
        ├── index.html                — HTML entry point
        └── src/
            ├── main.jsx              — React DOM mount
            ├── App.jsx               — HashRouter + Routes
            ├── index.css             — @tailwind direktive
            ├── components/
            │   └── layout/
            │       ├── Layout.jsx    — Sidebar + TopBar + <Outlet />
            │       ├── Sidebar.jsx   — NavLink navigacija
            │       └── TopBar.jsx    — zaglavlje aplikacije
            └── pages/
                ├── Dashboard.jsx
                ├── Vehicles.jsx
                ├── Owners.jsx
                ├── ServiceOrders.jsx
                ├── Catalog.jsx
                └── Reminders.jsx
```

---

## Task 1: package.json + electron-vite konfiguracija

**Files:**
- Create/Overwrite: `desktop-app/package.json`
- Create: `desktop-app/electron.vite.config.mjs`

- [ ] **Step 1: Kreiraj package.json**

```json
{
  "name": "electronic-service-book",
  "version": "1.0.0",
  "description": "Elektronska servisna knjizica za auto-servisere",
  "main": "out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "build:win": "npm run build && electron-builder --win",
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "better-sqlite3": "^9.4.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1"
  },
  "devDependencies": {
    "@electron/rebuild": "^3.6.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "electron": "^31.0.0",
    "electron-builder": "^24.13.3",
    "electron-vite": "^2.3.0",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}
```

- [ ] **Step 2: Kreiraj electron.vite.config.mjs**

```js
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
```

- [ ] **Step 3: Instaliraj zavisnosti**

```bash
cd desktop-app
npm install
```

Očekivani output: npm instalira sve pakete i pokrenuće `postinstall` koji rebuilda `better-sqlite3` za Electron. Može potrajati 2-5 minuta.

Ako `electron-rebuild` faila: provjeri da li su instalirani Visual C++ Build Tools (vidi Prerequisites).

- [ ] **Step 4: Commit**

```bash
git add desktop-app/package.json desktop-app/electron.vite.config.mjs
git commit -m "feat: initialize electron-vite project with dependencies"
```

---

## Task 2: TailwindCSS konfiguracija

**Files:**
- Create: `desktop-app/tailwind.config.js`
- Create: `desktop-app/postcss.config.js`
- Create: `desktop-app/src/renderer/src/index.css`

- [ ] **Step 1: Kreiraj tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/src/**/*.{js,jsx,ts,tsx}',
    './src/renderer/index.html'
  ],
  theme: {
    extend: {}
  },
  plugins: []
}
```

- [ ] **Step 2: Kreiraj postcss.config.js**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

- [ ] **Step 3: Kreiraj src/renderer/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Commit**

```bash
git add desktop-app/tailwind.config.js desktop-app/postcss.config.js desktop-app/src/renderer/src/index.css
git commit -m "feat: configure TailwindCSS for renderer process"
```

---

## Task 3: Database inicijalizacija i migration runner

**Files:**
- Create: `desktop-app/src/main/database.js`

- [ ] **Step 1: Kreiraj src/main/database.js**

```js
import { join } from 'path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { migration001 } from './migrations/001_initial.js'

// Svi registrovani migracije u redoslijedu izvršavanja
const MIGRATIONS = [
  { id: 1, name: '001_initial', run: migration001 }
]

let db = null

export function initDatabase() {
  const dbPath = join(app.getPath('userData'), 'esb.db')
  db = new Database(dbPath)

  // WAL mod za bolji concurrent pristup, foreign keys za integritet
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations()

  return db
}

export function getDatabase() {
  if (!db) throw new Error('Baza nije inicijalizovana — pozovi initDatabase() prvo')
  return db
}

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    )
  `)

  for (const migration of MIGRATIONS) {
    const applied = db.prepare('SELECT id FROM migrations WHERE name = ?').get(migration.name)
    if (!applied) {
      const runInTransaction = db.transaction(() => {
        migration.run(db)
        db.prepare('INSERT INTO migrations (id, name) VALUES (?, ?)').run(migration.id, migration.name)
      })
      runInTransaction()
      console.log(`Migracija ${migration.name} primijenjena`)
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add desktop-app/src/main/database.js
git commit -m "feat: add SQLite database init and migration runner"
```

---

## Task 4: Inicijalna migracija — DDL za sve tabele

**Files:**
- Create: `desktop-app/src/main/migrations/001_initial.js`

- [ ] **Step 1: Kreiraj src/main/migrations/001_initial.js**

```js
// Inicijalna migracija: kreira sve tabele prazne (bez podataka)
export function migration001(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vin TEXT UNIQUE NOT NULL,
      license_plate TEXT,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      engine_type TEXT,
      engine_displacement INTEGER,
      engine_power INTEGER,
      color TEXT,
      first_registration_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ownership_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
      owner_id INTEGER NOT NULL REFERENCES owners(id),
      start_date TEXT NOT NULL,
      end_date TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS parts_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      oem_number TEXT,
      category TEXT,
      unit TEXT,
      price REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
      owner_id INTEGER REFERENCES owners(id),
      order_number TEXT UNIQUE,
      reception_date TEXT NOT NULL,
      mileage_in INTEGER,
      service_type TEXT NOT NULL,
      labor_cost REAL DEFAULT 0,
      parts_cost REAL DEFAULT 0,
      materials_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      vat_rate REAL DEFAULT 20,
      invoice_number TEXT,
      technician_notes TEXT,
      recommendations TEXT,
      next_service_date TEXT,
      next_service_mileage INTEGER,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES service_orders(id),
      name TEXT NOT NULL,
      hours REAL DEFAULT 0,
      hourly_rate REAL DEFAULT 0,
      total REAL DEFAULT 0,
      catalog_id INTEGER REFERENCES parts_catalog(id)
    );

    CREATE TABLE IF NOT EXISTS service_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES service_orders(id),
      name TEXT NOT NULL,
      oem_number TEXT,
      category TEXT DEFAULT 'part',
      quantity REAL DEFAULT 1,
      unit TEXT DEFAULT 'kom',
      unit_price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      catalog_id INTEGER REFERENCES parts_catalog(id)
    );

    CREATE TABLE IF NOT EXISTS special_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
      order_id INTEGER REFERENCES service_orders(id),
      record_type TEXT NOT NULL,
      data TEXT NOT NULL,
      record_date TEXT NOT NULL,
      mileage INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      attempts INTEGER DEFAULT 0,
      last_attempt_at TEXT,
      status TEXT DEFAULT 'pending'
    );
  `)
}
```

- [ ] **Step 2: Commit**

```bash
git add desktop-app/src/main/migrations/001_initial.js
git commit -m "feat: add initial migration with all database tables"
```

---

## Task 5: Main process — window creation + app lifecycle

**Files:**
- Create: `desktop-app/src/main/index.js`

- [ ] **Step 1: Kreiraj src/main/index.js**

```js
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { initDatabase } from './database.js'
import { registerIpcHandlers } from './ipc/index.js'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Elektronska Servisna Knjizica',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Otvori eksterne linkove u sistemskom browser-u, ne u Electronu
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initDatabase()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 2: Commit**

```bash
git add desktop-app/src/main/index.js
git commit -m "feat: add electron main process with window creation"
```

---

## Task 6: Preload script — contextBridge i window.api

**Files:**
- Create: `desktop-app/src/preload/index.js`

- [ ] **Step 1: Kreiraj src/preload/index.js**

```js
import { contextBridge, ipcRenderer } from 'electron'

// window.api je jedini kanal komunikacije između renderer i main procesa.
// Sve operacije baze dodavati ovdje u narednim fazama.
contextBridge.exposeInMainWorld('api', {
  // Provjera IPC komunikacije
  ping: () => ipcRenderer.invoke('ping')
})
```

- [ ] **Step 2: Commit**

```bash
git add desktop-app/src/preload/index.js
git commit -m "feat: add preload script with contextBridge"
```

---

## Task 7: IPC handlers registracija

**Files:**
- Create: `desktop-app/src/main/ipc/index.js`

- [ ] **Step 1: Kreiraj src/main/ipc/index.js**

```js
import { ipcMain } from 'electron'

// Centralno mjesto za registraciju svih IPC handlera.
// Faze 2-4 dodaju vehicle, owner, serviceOrder handlere ovdje.
export function registerIpcHandlers() {
  ipcMain.handle('ping', () => 'pong')
}
```

- [ ] **Step 2: Commit**

```bash
git add desktop-app/src/main/ipc/index.js
git commit -m "feat: add IPC handlers registration skeleton"
```

---

## Task 8: Renderer HTML entry + React setup + App router

**Files:**
- Create: `desktop-app/src/renderer/index.html`
- Create: `desktop-app/src/renderer/src/main.jsx`
- Create: `desktop-app/src/renderer/src/App.jsx`

- [ ] **Step 1: Kreiraj src/renderer/index.html**

```html
<!DOCTYPE html>
<html lang="sr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Elektronska Servisna Knjizica</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Kreiraj src/renderer/src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Kreiraj src/renderer/src/App.jsx**

```jsx
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Owners from './pages/Owners'
import ServiceOrders from './pages/ServiceOrders'
import Catalog from './pages/Catalog'
import Reminders from './pages/Reminders'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="owners" element={<Owners />} />
          <Route path="service-orders" element={<ServiceOrders />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="reminders" element={<Reminders />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
```

Napomena: HashRouter koristimo umjesto BrowserRouter jer Electron u production modu učitava fajlove direktno (`file://`) i history API ne radi ispravno.

- [ ] **Step 4: Commit**

```bash
git add desktop-app/src/renderer/index.html desktop-app/src/renderer/src/main.jsx desktop-app/src/renderer/src/App.jsx
git commit -m "feat: add React entry point and router configuration"
```

---

## Task 9: Layout komponente — Layout, Sidebar, TopBar

**Files:**
- Create: `desktop-app/src/renderer/src/components/layout/Layout.jsx`
- Create: `desktop-app/src/renderer/src/components/layout/Sidebar.jsx`
- Create: `desktop-app/src/renderer/src/components/layout/TopBar.jsx`

- [ ] **Step 1: Kreiraj src/renderer/src/components/layout/Layout.jsx**

```jsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Kreiraj src/renderer/src/components/layout/Sidebar.jsx**

```jsx
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/',              label: 'Dashboard',       end: true },
  { to: '/vehicles',      label: 'Vozila',          end: false },
  { to: '/owners',        label: 'Vlasnici',        end: false },
  { to: '/service-orders',label: 'Servisni nalozi', end: false },
  { to: '/catalog',       label: 'Katalog',         end: false },
  { to: '/reminders',     label: 'Podsetnici',      end: false }
]

export default function Sidebar() {
  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div className="px-4 py-5 border-b border-gray-700">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Servisna knjizica
        </span>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Kreiraj src/renderer/src/components/layout/TopBar.jsx**

```jsx
export default function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
      <h1 className="text-base font-semibold text-gray-800">
        Elektronska Servisna Knjizica
      </h1>
    </header>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add desktop-app/src/renderer/src/components/
git commit -m "feat: add Layout, Sidebar, and TopBar components"
```

---

## Task 10: Placeholder stranice (6 modula)

**Files:**
- Create: `desktop-app/src/renderer/src/pages/Dashboard.jsx`
- Create: `desktop-app/src/renderer/src/pages/Vehicles.jsx`
- Create: `desktop-app/src/renderer/src/pages/Owners.jsx`
- Create: `desktop-app/src/renderer/src/pages/ServiceOrders.jsx`
- Create: `desktop-app/src/renderer/src/pages/Catalog.jsx`
- Create: `desktop-app/src/renderer/src/pages/Reminders.jsx`

- [ ] **Step 1: Kreiraj src/renderer/src/pages/Dashboard.jsx**

```jsx
export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
      <p className="text-gray-500">Pregled statistika, prihoda i podsetnika. Implementacija u Fazi 4.</p>
    </div>
  )
}
```

- [ ] **Step 2: Kreiraj src/renderer/src/pages/Vehicles.jsx**

```jsx
export default function Vehicles() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Vozila</h2>
      <p className="text-gray-500">Lista vozila, pretraga, dodavanje i editovanje. Implementacija u Fazi 2.</p>
    </div>
  )
}
```

- [ ] **Step 3: Kreiraj src/renderer/src/pages/Owners.jsx**

```jsx
export default function Owners() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Vlasnici</h2>
      <p className="text-gray-500">Lista vlasnika vozila, kontakt informacije. Implementacija u Fazi 2.</p>
    </div>
  )
}
```

- [ ] **Step 4: Kreiraj src/renderer/src/pages/ServiceOrders.jsx**

```jsx
export default function ServiceOrders() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Servisni nalozi</h2>
      <p className="text-gray-500">Kreiranje i pregled servisnih naloga, PDF export. Implementacija u Fazi 3.</p>
    </div>
  )
}
```

- [ ] **Step 5: Kreiraj src/renderer/src/pages/Catalog.jsx**

```jsx
export default function Catalog() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Katalog</h2>
      <p className="text-gray-500">Katalog delova i usluga sa cenama. Implementacija u Fazi 3.</p>
    </div>
  )
}
```

- [ ] **Step 6: Kreiraj src/renderer/src/pages/Reminders.jsx**

```jsx
export default function Reminders() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Podsetnici</h2>
      <p className="text-gray-500">Vozila kojima se blizi servis ili registracija. Implementacija u Fazi 4.</p>
    </div>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add desktop-app/src/renderer/src/pages/
git commit -m "feat: add placeholder pages for all six modules"
```

---

## Task 11: electron-builder config + .env.example

**Files:**
- Overwrite: `desktop-app/electron-builder.config.js`
- Create: `desktop-app/.env.example`

- [ ] **Step 1: Kreiraj electron-builder.config.js**

```js
module.exports = {
  appId: 'rs.kafanica.esb',
  productName: 'Elektronska Servisna Knjizica',
  copyright: 'Copyright 2024 Kafanica sa dobrom klopom',
  directories: {
    output: 'dist'
  },
  files: [
    'out/**/*',
    'package.json'
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ]
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'ESB'
  }
}
```

Napomena: `icon` polje je izostavljeno jer ikonica ne postoji u Fazi 1. Dodati u kasnijoj fazi: `"icon": "resources/icon.ico"` unutar `win` bloka.

- [ ] **Step 2: Kreiraj .env.example**

```
# URL cloud API-ja za sync funkcionalnost (Faza 5)
API_URL=https://kafanica-sa-dobrom-klopom.rs/ESK

# SQLite baza se automatski kreira u:
# Windows: C:\Users\<korisnik>\AppData\Roaming\electronic-service-book\esb.db
```

- [ ] **Step 3: Commit**

```bash
git add desktop-app/electron-builder.config.js desktop-app/.env.example
git commit -m "feat: add electron-builder NSIS config and env example"
```

---

## Task 12: Smoke test — verifikacija da sve radi

**Files:** nema novih fajlova

- [ ] **Step 1: Pokreni dev server**

```bash
cd desktop-app
npm run dev
```

Očekivani rezultat:
- Electron prozor se otvara (1280x800)
- Vidljiv je Sidebar sa 6 linkova s lijeve strane (tamna pozadina)
- Vidljiv je TopBar sa naslovom gore
- Dashboard placeholder tekst je u main content area-i
- DevTools se otvaraju automatski u development modu

- [ ] **Step 2: Testiraj navigaciju**

Klikni svaki link u sidebar-u i provjeri:
- URL u DevTools mijenja se (hash rute: `#/`, `#/vehicles`, itd.)
- Sadržaj desno se mijenja za svaku stranicu
- Aktivan link je plavo obojen

- [ ] **Step 3: Provjeri SQLite bazu**

Otvori File Explorer i idi na:
```
C:\Users\<tvoje_ime>\AppData\Roaming\electronic-service-book\
```

Mora postojati `esb.db` fajl. Možeš ga otvoriti sa DB Browser for SQLite da provjeriš da li postoje sve tabele (vehicles, owners, service_orders, itd.).

- [ ] **Step 4: Provjeri DevTools console**

U DevTools (F12) → Console tab:
- Ne smije biti crvenih grešaka
- `window.api` treba biti definisan (ukucaj u konzolu: `window.api`)
- `await window.api.ping()` treba da vrati `'pong'`

- [ ] **Step 5: Ažuriraj .claude/progress.md**

Zamijeni sadržaj `desktop-app` reda u tabeli sa:

```markdown
| Desktop app setup           | ✅ Faza 1 završena |
```

Dodaj na kraj sekcije "Šta je urađeno":
```markdown
## Sesija: 2026-05-03 (nastavak)

### Šta je urađeno:
- Faza 1 kompletno implementirana
- electron-vite boilerplate sa React 18 i React Router 6
- TailwindCSS konfigurisan i aktivan u renderer procesu
- SQLite baza sa migration runner sistemom
- Inicijalna migracija 001_initial.js — sve tabele kreirane
- Electron main/preload/renderer arhitektura
- Layout sa Sidebar + TopBar + Outlet
- 6 placeholder stranica
- electron-builder NSIS config

### Trenutno stanje:
| Desktop app setup           | ✅ Završena |
| SQLite šema + migracije     | ✅ Završena |

### Sledeća sesija:
Faza 2 — Vozila i Vlasnici CRUD. Prompt u docs/Electronic-service-book.md → FAZA 2 PROMPT
```

- [ ] **Step 6: Ažuriraj .claude/tasks.md — označi Faza 1 taskove kao završene**

Zamijeni sve `- [ ]` pod `## FAZA 1` sa `- [x]`:

```markdown
## FAZA 1 — Project Setup

- [x] Inicijalizacija Electron + React projekta (electron-vite boilerplate)
- [x] Konfiguracija TailwindCSS
- [x] Postavljanje folder strukture po konvencijama
- [x] Setup better-sqlite3 i kreiranje inicijalnih migracija
- [x] Osnovna navigacija (sidebar menu: Vozila, Vlasnici, Nalozi, Katalog, Dashboard)
- [x] Glavni layout komponente (Sidebar, TopBar, MainContent)
- [x] Setup electron-builder za Windows build
- [x] .env konfiguracija (API URL, database path)
```

- [ ] **Step 7: Final commit**

```bash
git add .claude/progress.md .claude/tasks.md
git commit -m "docs: mark Phase 1 as complete in progress and tasks"
```

---

## Troubleshooting

**`better-sqlite3` build faila:**
- Instaliraj Visual C++ Build Tools (vidi Prerequisites)
- Ili pokušaj: `npm install --global windows-build-tools` (admin PowerShell)
- Provjeri da je Node.js version kompatibilan sa Electron verzijom: `node --version`

**`electron-vite dev` ne pokreće Electron prozor:**
- Provjeri da je `electron` instaliran: `ls node_modules/.bin/electron`
- Pokušaj: `npx electron-vite dev`

**TailwindCSS klase ne rade (elementi nemaju stilove):**
- Provjeri da `index.css` ima sve tri `@tailwind` direktive
- Provjeri da je `index.css` importovan u `main.jsx`
- Provjeri da `tailwind.config.js` ima ispravne `content` putanje

**`window.api` je undefined u renderer:**
- Provjeri da `preload/index.js` postoji i da ga `main/index.js` referencira ispravnim putom
- U DevTools → Application → Service Workers — osvježi stranicu

**HashRouter ne navigira ispravno:**
- Uvijek koristiti `HashRouter` u Electronu, ne `BrowserRouter`
- Rute počinju s `/` ali u URL-u izgledaju kao `#/vehicles`

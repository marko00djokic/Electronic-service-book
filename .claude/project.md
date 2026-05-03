# ESB — Arhitektura i tech stack

## Dijagram arhitekture sistema

```
┌─────────────────────────────────┐
│   Desktop Electron App          │
│   (računar servisera)           │
│                                 │
│  ┌──────────┐  ┌─────────────┐  │
│  │  React   │  │    Main     │  │
│  │ Renderer │◄─│   Process   │  │
│  │  (UI)    │  │  (Node.js)  │  │
│  └──────────┘  └──────┬──────┘  │
│                       │         │
│                ┌──────▼──────┐  │
│                │   SQLite    │  │
│                │  (lokalna   │  │
│                │    baza)    │  │
│                └─────────────┘  │
└──────────────┬──────────────────┘
               │ HTTP (sync, kada ima internet)
               │
┌──────────────▼──────────────────┐
│   cPanel API                    │
│   /home/kafanicars/ESK/         │
│   Node.js 20 + Express          │
│   Passenger (process manager)   │
│                                 │
│  kafanica-sa-dobrom-klopom.rs/ESK│
└──────────────┬──────────────────┘
               │
        ┌──────▼──────┐
        │   MySQL 8   │
        │  (cPanel)   │
        └──────┬──────┘
               │
┌──────────────▼──────────────────┐
│   Web Portal (React)            │
│   Read-only, za vlasnike        │
│   Vite build → cPanel static    │
└─────────────────────────────────┘
```

---

## Tech stack sa verzijama

### Desktop App (Deo 1)

| Tehnologija        | Verzija  | Zašto                                                          |
|--------------------|----------|----------------------------------------------------------------|
| Electron           | latest   | Desktop app sa Node.js backendom, SQLite, PDF generisanje      |
| React              | 18       | Moderna UI biblioteka, hooks, component model                  |
| React Router       | 6        | Navigacija između stranica u renderer procesu                  |
| better-sqlite3     | latest   | Sinhroni SQLite driver, idealan za Electron main process       |
| TailwindCSS        | 3        | Utility-first CSS, brz razvoj, konzistentan dizajn             |
| Axios              | latest   | HTTP klijent za sync pozive ka cloud API-ju                    |
| electron-builder   | latest   | Pakovanje u Windows .exe installer (NSIS)                      |
| jsPDF              | latest   | Generisanje PDF dokumenata unutar main procesa                 |
| Recharts           | latest   | Grafikoni za Dashboard (LineChart, PieChart)                   |

### Cloud Server — API (Deo 2)

| Tehnologija        | Verzija  | Zašto                                                          |
|--------------------|----------|----------------------------------------------------------------|
| Node.js            | 20.20.2  | LTS verzija, podržana na cPanel serveru                        |
| Express.js         | 4        | Minimalan framework, lak deploy na cPanel sa Passenger-om      |
| mysql2             | latest   | MySQL driver sa Promise podrška                                |
| JWT (jsonwebtoken) | latest   | Autentifikacija web portala                                    |
| helmet             | latest   | HTTP security headers                                          |
| express-rate-limit | latest   | Zaštita od zloupotrebe API-ja                                  |
| Passenger          | ugrađen  | cPanel process manager, NE PM2 (PM2 startup ne radi na cPanel) |

### Web Portal (Deo 3)

| Tehnologija        | Verzija  | Zašto                                                          |
|--------------------|----------|----------------------------------------------------------------|
| React              | 18       | Isti stack kao desktop app                                     |
| Vite               | latest   | Brz build tool, statički output za cPanel                      |
| TailwindCSS        | 3        | Mobilno-responzivan dizajn, isti design system                 |
| Axios              | latest   | API pozivi ka cloud API-ju                                     |

---

## Offline-first strategija

### Princip
Desktop aplikacija je **uvek izvor istine**. Cloud je replika.

### Tok podataka
1. Serviser unosi podatke → SQLite lokalno (uvek uspeva, bez interneta)
2. Ista promena se upisuje u `sync_queue` tabelu
3. Sync servis u pozadini proverava internet svakih 5 minuta
4. Kada ima internet: šalje batch iz queue-a na POST /api/sync
5. Na uspeh: briše iz queue-a, upisuje u sync_log
6. Na grešku: povećava `attempts`, posle 5 označava kao `failed`

### Conflict resolution
Nije potrebna — desktop je uvek master. Cloud nikada ne inicira promenu.

### Šta se dešava bez interneta
- Aplikacija radi 100% normalno
- Sync queue se puni
- Kada se internet vrati, automatski se šalje sve iz queue-a

---

## Struktura SQLite baze (desktop-app)

```sql
-- Vozila
vehicles (
  id INTEGER PRIMARY KEY,
  vin TEXT UNIQUE NOT NULL,           -- 17 karaktera
  license_plate TEXT,
  make TEXT NOT NULL,                 -- marka (Volkswagen)
  model TEXT NOT NULL,                -- model (Golf)
  year INTEGER NOT NULL,              -- godište
  engine_type TEXT,                   -- benzin/dizel/elektro/hibrid
  engine_displacement INTEGER,        -- zapremina u cm3
  engine_power INTEGER,               -- snaga u kW
  color TEXT,
  first_registration_date TEXT,       -- ISO date string
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)

-- Vlasnici
owners (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)

-- Istorija vlasništva (vozilo ↔ vlasnik)
ownership_history (
  id INTEGER PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  owner_id INTEGER NOT NULL REFERENCES owners(id),
  start_date TEXT NOT NULL,
  end_date TEXT,                      -- NULL = trenutni vlasnik
  notes TEXT
)

-- Katalog delova i usluga (interni cenovnik)
parts_catalog (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  oem_number TEXT,
  category TEXT,                      -- part/labor/material
  unit TEXT,                          -- kom/l/kg/h
  price REAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)

-- Servisni nalozi
service_orders (
  id INTEGER PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  owner_id INTEGER REFERENCES owners(id),
  order_number TEXT UNIQUE,           -- auto-generisan broj naloga
  reception_date TEXT NOT NULL,       -- datum prijema
  mileage_in INTEGER,                 -- km pri prijemu
  service_type TEXT NOT NULL,         -- mali/veliki/vanredni/garantni
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
  status TEXT DEFAULT 'open',         -- open/closed
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)

-- Stavke naloga — obavljeni radovi
service_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES service_orders(id),
  name TEXT NOT NULL,
  hours REAL DEFAULT 0,
  hourly_rate REAL DEFAULT 0,
  total REAL DEFAULT 0,
  catalog_id INTEGER REFERENCES parts_catalog(id)
)

-- Stavke naloga — delovi i materijali
service_parts (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES service_orders(id),
  name TEXT NOT NULL,
  oem_number TEXT,
  category TEXT DEFAULT 'part',       -- part/material
  quantity REAL DEFAULT 1,
  unit TEXT DEFAULT 'kom',
  unit_price REAL DEFAULT 0,
  total REAL DEFAULT 0,
  catalog_id INTEGER REFERENCES parts_catalog(id)
)

-- Specijalne evidencije
special_records (
  id INTEGER PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  order_id INTEGER REFERENCES service_orders(id),
  record_type TEXT NOT NULL,          -- tires/brakes/obd/timing_belt/ac_service/electrical
  data TEXT NOT NULL,                 -- JSON blob sa specifičnim podacima za tip
  record_date TEXT NOT NULL,
  mileage INTEGER,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)

-- Red za sinhronizaciju
sync_queue (
  id INTEGER PRIMARY KEY,
  entity_type TEXT NOT NULL,          -- vehicle/owner/service_order/...
  entity_id INTEGER NOT NULL,
  operation TEXT NOT NULL,            -- INSERT/UPDATE/DELETE
  payload TEXT NOT NULL,              -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  attempts INTEGER DEFAULT 0,
  last_attempt_at TEXT,
  status TEXT DEFAULT 'pending'       -- pending/sent/failed
)
```

---

## Struktura MySQL baze (cloud server-api)

Iste tabele kao SQLite uz sledeće razlike:
- Primarni ključevi su `BIGINT UNSIGNED AUTO_INCREMENT`
- Datumi su `DATETIME` tip (ne TEXT)
- Svaka tabela ima kolonu `synced_at DATETIME` — kada je primljena od desktop app
- Dodatne tabele:

```sql
-- Log sinhronizacije (svaki batch od desktop app)
sync_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  received_at DATETIME NOT NULL,
  desktop_id TEXT,                    -- identifikator desktop instance
  batch_size INTEGER,
  status TEXT                         -- success/partial/failed
)

-- API ključevi za desktop aplikacije
api_keys (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  key_hash TEXT NOT NULL,             -- bcrypt hash ključa
  description TEXT,
  created_at DATETIME DEFAULT NOW(),
  last_used_at DATETIME,
  is_active BOOLEAN DEFAULT TRUE
)
```

---

## Konvencije imenovanja

| Kontekst               | Konvencija   | Primer                            |
|------------------------|--------------|-----------------------------------|
| Tabele baze            | snake_case   | `service_orders`, `sync_queue`    |
| Modeli (klase)         | PascalCase   | `ServiceOrder`, `Vehicle`         |
| React komponente       | PascalCase   | `VehicleList`, `ServiceOrderForm` |
| Fajlovi komponenti     | kebab-case   | `vehicle-list.jsx`                |
| API rute               | kebab-case   | `/api/service-orders`             |
| Varijable i funkcije   | camelCase    | `getServiceOrders`, `vehicleId`   |
| Konstante              | UPPER_SNAKE  | `MAX_SYNC_BATCH`, `DB_VERSION`    |

---

## IPC arhitektura u Electronu

```
┌─────────────────────────────────────────────────┐
│  Renderer Process (React)                        │
│                                                 │
│  window.api.vehicles.getAll()  ──────────────┐  │
│  window.api.vehicles.create(data) ──────────┐│  │
└───────────────────────────────────────────────│┘  │
                                               ││
           preload.js (contextBridge)          ││
           window.api = {                      ││
             vehicles: { getAll, create, ... } ││
             owners: { ... }                   ││
             serviceOrders: { ... }            ││
           }                                   ││
                                               ││
┌──────────────────────────────────────────────▼▼┐
│  Main Process (Node.js)                         │
│                                                 │
│  ipcMain.handle('vehicles:getAll', ...)         │
│  ipcMain.handle('vehicles:create', ...)         │
│                                                 │
│  ──► SQLite (better-sqlite3, sinhrono)          │
└─────────────────────────────────────────────────┘
```

**Pravilo:** Renderer nikada ne pristupa Node.js modulima direktno. Sve ide kroz preload.js.

---

## Deployment workflow — server-api na cPanel

1. Lokalno: `npm run build` (ako ima build step) ili direktno upload
2. Upload fajlova u `/home/kafanicars/ESK/` (FTP ili cPanel File Manager)
3. U cPanel → Node.js App → Set startup file: `app.js`
4. Restart aplikacije kroz cPanel Node.js interfejs
5. Proveri logove: cPanel → Node.js App → Logs
6. NE koristiti PM2 startup — Passenger preuzima tu ulogu

### .env varijable na serveru:
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` — MySQL kredencijali
- `JWT_SECRET` — tajni ključ za JWT tokene
- `API_KEY` — ključ za desktop app autentifikaciju pri sync-u
- `PORT` — port (Passenger ga ignoruje, ali Express ga čita)
- `NODE_ENV=production`

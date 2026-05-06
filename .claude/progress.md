# Progress Log

## Sesija: 2026-05-04 — Faza 1 završena

### Šta je urađeno:
- Faza 1 kompletno implementirana na branch `feature/phase-1-setup`
- electron-vite boilerplate sa React 18 i React Router 6 (HashRouter)
- TailwindCSS 3 konfigurisan i kompajlira se ispravno (13.62 kB CSS output)
- SQLite baza: migration runner sistem sa transakcijama
- Inicijalna migracija 001_initial.js — sve tabele kreirane (9 tabela)
- Electron main/preload/renderer arhitektura — contextIsolation, IPC ping
- Layout: Sidebar (6 nav linkova, aktivan state) + TopBar + Outlet
- 6 placeholder stranica za sve module
- electron-builder NSIS config za Windows installer
- `electron-vite build` prošao bez grešaka ✅

### Poznati problemi / Tech debt:
- `better-sqlite3` native modul nije kompajliran — mašina ima VS 2025 Preview
  (verzija 18, node-gyp podržava do VS 2022 / verzija 17)
  **Fix:** Instaliraj VS 2022 Community sa "Desktop development with C++" workload,
  pa pokreni: `cd desktop-app && npm run postinstall`
- `npm run dev` neće raditi dok better-sqlite3 nije kompajliran (main process crasha
  pri `initDatabase()` pozivu). Renderer dio (React UI) je ispravan.

### Serverska infrastruktura (potvrđeno):
- Node.js v20.20.2 ✅
- npm v11.13.0 ✅
- PM2 v7.0.1 ✅ (instaliran, ali koristimo Passenger)
- Passenger ✅ (ugrađen u cPanel, brine o auto-restartu)
- MySQL ✅ (dostupan kroz cPanel)
- API folder: /home/kafanicars/ESK/ ✅
- Startup file: app.js ✅

---

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

### Git stanje:
- Branch: `feature/phase-2-vehicles-owners` merged u `main2`

---

## Sesija: 2026-05-05 — Faza 3 završena

### Šta je urađeno (nastavak prekinute sesije):
Sesija prekinuta nestankom struje — backend je bio 100% završen, dovršen je frontend:

**Backend (završeno u prethodnoj sesiji):**
- SQLite tabele: sve u `001_initial.js` (parts_catalog, service_orders, service_items, service_parts, special_records)
- Modeli: `serviceOrder.js`, `serviceItem.js`, `servicePart.js`, `specialRecord.js`, `partsCatalog.js`
- IPC handleri: `service-orders-ipc.js`, `parts-catalog-ipc.js`, `special-records-ipc.js`, `pdf-ipc.js`
- Preload API: `window.api.serviceOrders`, `serviceItems`, `serviceParts`, `specialRecords`, `catalog`, `pdf`
- PDF generator: `pdfGenerator.js` — `generateServiceBookPdf` i `generateOrderPdf`
- Zavisnosti: `jspdf` i `react-select` instalirani

**Frontend (završeno u ovoj sesiji):**
- `ServiceOrderList.jsx` — tabela naloga sa filterima i pretragom
- `ServiceOrderForm.jsx` — 5-tab forma (Osnovno, Radovi, Delovi, Finansije, Preporuke) sa react-select autocomplete
- `ServiceOrderDetail.jsx` — read-only pregled naloga + PDF štampa
- `PartsCatalog.jsx` — inline CRUD tabela sa pretragom (`pages/catalog/`)
- `SpecialRecords.jsx` — grupovane evidencije po tipu sa dinamičkom formom (`pages/service-orders/`)
- `App.jsx` — sve Faza 3 rute: `/service-orders/*`, `/catalog`, `/vehicles/:id/special`
- `VehicleDetail.jsx` — dodat dugme "Spec. evidencije" → `/vehicles/:id/special`

### Trenutno stanje koda:

| Komponenta                  | Status              |
|-----------------------------|---------------------|
| Projektna dokumentacija     | ✅ Završena         |
| Desktop app setup           | ✅ Faza 1 završena  |
| SQLite šema + migracije     | ✅ DDL kreiran      |
| Vozila CRUD                 | ✅ Faza 2 završena  |
| Vlasnici CRUD               | ✅ Faza 2 završena  |
| Servisni nalozi             | ✅ Faza 3 završena  |
| Katalog delova/usluga       | ✅ Faza 3 završena  |
| PDF export                  | ✅ Faza 3 završena  |
| Specijalne evidencije       | ✅ Faza 3 završena  |
| Dashboard + podsetnici      | ❌ Nije početo      |
| Cloud API (Express)         | ❌ Nije početo      |
| MySQL šema                  | ❌ Nije početo      |
| Sync mehanizam              | ❌ Nije početo      |
| Web portal                  | ❌ Nije početo      |
| Windows installer           | ⚠️ Config kreiran, build nije testiran |

### Git stanje:
- Branch: `main2` (izmene nisu komitovane — faza 3 fajlovi su untracked/modified)

### Sledeća sesija treba da počne sa:
Faza 5 — Cloud Sync + API.
Prompt za ovu fazu: `docs/Electronic-service-book.md` → FAZA 5 PROMPT

---

## Sesija: 2026-05-05 — Faza 4 završena

### Šta je urađeno:

**Backend (main process):**
- `dashboard-ipc.js` — 7 IPC handlera:
  - `dashboard:getStats` — KPI agregacije (ukupno vozila, nalozi/prihodi ovog meseca, broj vozila kojima se bliži servis)
  - `dashboard:getMonthlyRevenue(year)` — prihodi po mesecima za izabranu godinu
  - `dashboard:getServiceTypeDistribution` — raspodela naloga po vrsti servisa
  - `dashboard:getRecentOrders` — poslednjih 5 servisnih naloga
  - `dashboard:getUpcomingServices(days, kmThreshold)` — vozila kojima se bliži servis
  - `dashboard:getOverdueVehiclesCount` — broj vozila sa prekoračenim rokom
  - `dashboard:globalSearch(query)` — pretraga po vozilima, vlasnicima i nalozima
- `ipc/index.js` — registrovani dashboard handleri
- `main/index.js` — Electron notifikacija pri pokretanju: prikazuje Windows toast za prekoračene rokove, klik vodi na /reminders

**Preload:**
- `preload/index.js` — dodat `window.api.dashboard` namespace (7 metoda)
- Dodat `window.electronEvents` za IPC navigate event (klik na notifikaciju)

**Frontend:**
- `Dashboard.jsx` — KPI kartice (4), LineChart prihoda po mesecima (Recharts), PieChart raspodele servisa (Recharts), tabela poslednjih 5 naloga
- `Reminders.jsx` — tabela vozila kojima se bliži servis, sortirana po urgentnosti (prekoračeno → bliži se → u redu), vizuelni indikatori (crveno/žuto/zeleno), filter za period i km prag, dugme "Novi nalog" za direktno kreiranje
- `TopBar.jsx` — GlobalSearch sa debounce 250ms, dropdown sa rezultatima grupisanim po kategorijama (vozila/vlasnici/nalozi), klik navigira do odgovarajuće stranice
- `App.jsx` — dodat `NotificationNavigator` komponent koji sluša Electron IPC `navigate` event

**Zavisnosti:**
- `recharts` instaliran (39 paketa)

### Trenutno stanje koda:

| Komponenta                  | Status              |
|-----------------------------|---------------------|
| Projektna dokumentacija     | ✅ Završena         |
| Desktop app setup           | ✅ Faza 1 završena  |
| SQLite šema + migracije     | ✅ DDL kreiran      |
| Vozila CRUD                 | ✅ Faza 2 završena  |
| Vlasnici CRUD               | ✅ Faza 2 završena  |
| Servisni nalozi             | ✅ Faza 3 završena  |
| Katalog delova/usluga       | ✅ Faza 3 završena  |
| PDF export                  | ✅ Faza 3 završena  |
| Specijalne evidencije       | ✅ Faza 3 završena  |
| Dashboard + podsetnici      | ✅ Faza 4 završena  |
| Globalna pretraga           | ✅ Faza 4 završena  |
| Electron notifikacije       | ✅ Faza 4 završena  |
| Cloud API (Express)         | ❌ Nije početo      |
| MySQL šema                  | ❌ Nije početo      |
| Sync mehanizam              | ❌ Nije početo      |
| Web portal                  | ❌ Nije početo      |
| Windows installer           | ⚠️ Config kreiran, build nije testiran |

### Git stanje:
- Branch: `feature/phase-4-dashboard` (izmene nisu komitovane)

---

## Sesija: 2026-05-05 — Faza 5 završena

### Šta je urađeno:

**server-api/ (novi fajlovi):**
- `package.json` — Express, mysql2, helmet, cors, express-rate-limit, jsonwebtoken, bcryptjs
- `app.js` — Express setup, helmet + cors + rate-limit middleware, rute, Passenger export
- `src/db.js` — mysql2 connection pool
- `src/middleware/auth.js` — `requireApiKey` (bcrypt hash match), `requireJwt`, `generateToken`
- `src/routes/sync.js` — POST /ESK/api/sync (batch upsert, sync_log, error tracking)
- `src/routes/vehicles.js` — GET /ESK/api/vehicles/:vin (javno, za web portal)
- `src/routes/serviceOrders.js` — GET /ESK/api/service-orders/:vehicleId (sa items + parts)
- `src/models/Vehicle.js`, `ServiceOrder.js`, `SyncLog.js` — MySQL query helperi
- `database/migrations/001_initial.sql` — kompletna MySQL DDL šema (9 tabela + synced_at)
- `.env.example` — sve potrebne env varijable dokumentovane

**desktop-app/ (izmene):**
- `src/main/sync-service.js` — `startSyncService`, `stopSyncService`, `triggerSync`, `getSyncStatus`
  - setInterval 5min, net.isOnline() check, batch 100, max 5 pokušaja → status 'failed'
- `src/main/ipc/sync-ipc.js` — `sync:trigger`, `sync:getStatus` IPC handleri
- `src/main/ipc/index.js` — registrovan `registerSyncHandlers()`
- `src/main/index.js` — `startSyncService()` pri pokretanju, `stopSyncService()` pri zatvaranju
- `src/preload/index.js` — dodat `window.api.sync` namespace (`trigger`, `getStatus`)

**Dokumentacija:**
- `docs/technical/technical_manual.md` — popunjene sekcije 6 (API docs + auth setup) i 7.2 (deployment koraci), 5.3 (sync detalji)

### Napomena:
- `sync_queue` tabela je već bila u `001_initial.js` (SQLite) — nova migracija nije bila potrebna
- Env varijable za sync: `VITE_API_URL`, `VITE_API_KEY`, `VITE_DESKTOP_ID` u desktop-app/.env

### Trenutno stanje koda:

| Komponenta                  | Status              |
|-----------------------------|---------------------|
| Projektna dokumentacija     | ✅ Završena         |
| Desktop app setup           | ✅ Faza 1 završena  |
| SQLite šema + migracije     | ✅ DDL kreiran      |
| Vozila CRUD                 | ✅ Faza 2 završena  |
| Vlasnici CRUD               | ✅ Faza 2 završena  |
| Servisni nalozi             | ✅ Faza 3 završena  |
| Katalog delova/usluga       | ✅ Faza 3 završena  |
| PDF export                  | ✅ Faza 3 završena  |
| Specijalne evidencije       | ✅ Faza 3 završena  |
| Dashboard + podsetnici      | ✅ Faza 4 završena  |
| Globalna pretraga           | ✅ Faza 4 završena  |
| Electron notifikacije       | ✅ Faza 4 završena  |
| Cloud API (Express)         | ✅ Faza 5 završena  |
| MySQL šema                  | ✅ Faza 5 završena  |
| Sync mehanizam              | ✅ Faza 5 završena  |
| Web portal                  | ❌ Nije početo      |
| Windows installer           | ⚠️ Config kreiran, build nije testiran |

### Git stanje:
- Branch: `feature/phase-4-dashboard` (sve izmene faze 4 i 5 nisu komitovane)

### Sledeća sesija treba da počne sa:
Faza 6 — Web Portal + Polish.
Prompt za ovu fazu: `docs/Electronic-service-book.md` → FAZA 6 PROMPT

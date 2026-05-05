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
Faza 4 — Dashboard i podsetnici.
Prompt za ovu fazu: `docs/Electronic-service-book.md` → FAZA 4 PROMPT

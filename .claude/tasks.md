# Task Backlog

## FAZA 1 — Project Setup ✅ ZAVRŠENA

- [x] Inicijalizacija Electron + React projekta (electron-vite boilerplate)
- [x] Konfiguracija TailwindCSS
- [x] Postavljanje folder strukture po konvencijama
- [x] Setup better-sqlite3 i kreiranje inicijalnih migracija
- [x] Osnovna navigacija (sidebar menu: Vozila, Vlasnici, Nalozi, Katalog, Dashboard)
- [x] Glavni layout komponente (Sidebar, TopBar, MainContent)
- [x] Setup electron-builder za Windows build
- [x] .env konfiguracija (API URL, database path)

### ⚠️ Preduslovi za Fazu 2:
- [x] Instalirati VS 2022 Community (Desktop development with C++ workload)
- [x] Pokrenuti `cd desktop-app && npm run postinstall` da se kompajlira better-sqlite3
- [x] Verifikovati `npm run dev` pokreće Electron prozor
- [x] Verifikovati `window.api.ping()` vraća 'pong' u DevTools konzoli
- [x] Mergati `feature/phase-1-setup` u `main2`

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

## FAZA 3 — Servisni Nalozi ✅ ZAVRŠENA

- [x] SQLite migracije: service_orders, service_items, service_parts, special_records, parts_catalog tabele
- [x] ServiceOrder model i CRUD operacije
- [x] PartsCatalog model i CRUD operacije
- [x] IPC handlers za naloge i katalog (service-orders-ipc, parts-catalog-ipc, special-records-ipc, pdf-ipc)
- [x] Preload API: serviceOrders, serviceItems, serviceParts, specialRecords, catalog, pdf
- [x] ServiceOrderList stranica sa filterima i pretragom
- [x] ServiceOrderForm — 5-tab forma sa react-select autocomplete
- [x] ServiceOrderDetail stranica (pregled naloga + PDF štampa)
- [x] PartsCatalog stranica (inline CRUD tabela sa pretragom)
- [x] PDF export — servisna knjižica vozila (generateServiceBookPdf)
- [x] PDF export — pojedinačni servisni nalog (generateOrderPdf)
- [x] Specijalne evidencije (SpecialRecords.jsx — 6 tipova sa dinamičkim formama)
- [x] App.jsx — sve Faza 3 rute registrovane
- [x] VehicleDetail — link ka specijalnim evidencijama

## FAZA 4 — Dashboard i Podsetnici

- [ ] Dashboard stranica — statistike (ukupno vozila, naloga, prihoda)
- [ ] Grafikon prihoda po mesecima (Recharts)
- [ ] Grafikon po vrsti servisa
- [ ] Lista vozila kojima se bliži servis (po datumu i km)
- [ ] Podsetnik notifikacije u Electronu
- [ ] Pretraga kroz celu aplikaciju
- [ ] Filteri i sortiranje lista

## FAZA 5 — Cloud Sync + API

- [ ] Express.js API setup u server-api/
- [ ] MySQL šema (iste tabele kao SQLite)
- [ ] API rute: vozila, vlasnici, servisni nalozi, sync
- [ ] JWT autentifikacija (za web portal)
- [ ] Sync queue u SQLite (tabela sync_queue)
- [ ] Sync servis u Electronu (šalje izmene kada ima internet)
- [ ] Conflict resolution strategija
- [ ] Deploy API na cPanel (/home/kafanicars/ESK/)
- [ ] Testiranje sync mehanizma

## FAZA 6 — Web Portal + Polish

- [ ] React + Vite web portal setup
- [ ] Pretraga vozila po VIN / registarskom broju
- [ ] Prikaz servisne istorije vozila
- [ ] Prikaz detalja servisnog naloga
- [ ] Mobilno-responzivan dizajn
- [ ] Deploy portala na cPanel (public_html)
- [ ] Windows installer (electron-builder NSIS config)
- [ ] Auto-updater konfiguracija
- [ ] E2E testovi (Playwright)
- [ ] UX polish i review

## Backlog / Buduće ideje

- [ ] Višejezična podrška (srpski/engleski)
- [ ] Backup i restore SQLite baze
- [ ] Import podataka iz Excel/CSV
- [ ] SMS/email podsetnici vlasnicima
- [ ] Višekorisnički mod (više servisera na istom nalogu)
- [ ] Fotografije vozila i oštećenja
- [ ] Integracija sa katalozima originalnih delova (TecDoc API)

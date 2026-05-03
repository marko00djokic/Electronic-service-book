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
- [ ] Instalirati VS 2022 Community (Desktop development with C++ workload)
- [ ] Pokrenuti `cd desktop-app && npm run postinstall` da se kompajlira better-sqlite3
- [ ] Verifikovati `npm run dev` pokreće Electron prozor
- [ ] Verifikovati `window.api.ping()` vraća 'pong' u DevTools konzoli
- [ ] Mergati `feature/phase-1-setup` u `main2`

## FAZA 2 — Vozila i Vlasnici

- [ ] SQLite migracije: vehicles, owners, ownership_history tabele
- [ ] Vehicle model i CRUD operacije (main process)
- [ ] Owner model i CRUD operacije (main process)
- [ ] IPC handlers za vozila i vlasnike
- [ ] VehicleList stranica sa pretragom i filterima
- [ ] VehicleForm komponenta (dodavanje/editovanje)
- [ ] VehicleDetail stranica sa istorijom vlasništva
- [ ] OwnerList stranica
- [ ] OwnerForm komponenta
- [ ] OwnerDetail stranica sa listom vozila
- [ ] Validacije formi (VIN format, obavezna polja)

## FAZA 3 — Servisni Nalozi

- [ ] SQLite migracije: service_orders, service_items, service_parts, special_records, parts_catalog tabele
- [ ] ServiceOrder model i CRUD operacije
- [ ] PartsCatalog model i CRUD operacije
- [ ] IPC handlers za naloge i katalog
- [ ] ServiceOrderList stranica
- [ ] ServiceOrderForm — kompleksna forma sa sekcijama
- [ ] ServiceOrderDetail stranica (pregled naloga)
- [ ] PartsCatalog stranica (upravljanje katalogom)
- [ ] PDF export — servisna knjižica vozila
- [ ] PDF export — pojedinačni servisni nalog
- [ ] Specijalne evidencije (gume, kočnice, OBD, klima...)

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

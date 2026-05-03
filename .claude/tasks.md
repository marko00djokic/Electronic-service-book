# Task Backlog

## FAZA 1 — Project Setup

- [ ] Inicijalizacija Electron + React projekta (electron-vite boilerplate)
- [ ] Konfiguracija TailwindCSS
- [ ] Postavljanje folder strukture po konvencijama
- [ ] Setup better-sqlite3 i kreiranje inicijalnih migracija
- [ ] Osnovna navigacija (sidebar menu: Vozila, Vlasnici, Nalozi, Katalog, Dashboard)
- [ ] Glavni layout komponente (Sidebar, TopBar, MainContent)
- [ ] Setup electron-builder za Windows build
- [ ] .env konfiguracija (API URL, database path)

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

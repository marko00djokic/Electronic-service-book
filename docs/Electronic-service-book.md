# Electronic Service Book (ESB) — Projektni dokument

## 1. Ideja i opis projekta

**Electronic Service Book (ESB)** je digitalno rešenje za praćenje servisne istorije automobila.
Sistem se sastoji od dve međusobno povezane celine: desktop aplikacije za servisere i cloud
infrastrukture koja omogućava vlasnicima automobila da prate servisnu istoriju svog vozila putem
web portala.

### 1.1 Problem koji rešavamo

Servisne knjižice u papirnom obliku se gube, habaju i teško su prenosive. Serviseri nemaju
efikasan alat za upravljanje istorijom vozila, a vlasnici automobila nemaju lak pristup podacima
o servisu svog vozila. ESB digitalizuje ceo ovaj proces.

### 1.2 Tri komponente sistema

#### DEO 1 — Desktop aplikacija (Electron)

Offline desktop aplikacija koja se instalira na računaru servisera automobila. Serviser je jedini
korisnik koji unosi i upravlja podacima. Aplikacija radi potpuno offline — internet veza nije
uslov za rad.

**Funkcionalnosti:**

- **Upravljanje vozilima (CRUD)** — VIN, marka, model, godište, tip motora, zapremina, snaga,
  gorivo, boja, registarski broj, datum prve registracije
- **Upravljanje vlasnicima (CRUD)** — ime i prezime, telefon, email, adresa, istorija vlasništva
  vozila (jedno vozilo može imati više vlasnika tokom vremena)
- **Kreiranje i upravljanje servisnim nalozima:**
  - Datum prijema, kilometraža pri prijemu, vrsta servisa (mali/veliki/vanredni/garantni)
  - Lista obavljenih radova (naziv rada, vreme u normočasovima, cena po normočasu)
  - Lista ugrađenih delova (naziv dela, OEM/kataloški broj, količina, jedinična cena)
  - Utrošeni materijali (motorno ulje, antifriz, tečnost za kočnice, aditivi — količina i cena)
  - Finansije: cena rada, cena delova, cena materijala, ukupan iznos, PDV, broj računa
  - Napomene i preporuke servisera
  - Datum i kilometraža narednog preporučenog servisa
- **Specijalne evidencije:**
  - Zamena guma (dimenzije, tip, marka, DOT kod, dubina šare, datum)
  - Kočioni sistem (pločice, diskovi, bubnjevi, debljina, datum)
  - OBD dijagnostika (greška kod, opis, status, datum)
  - Zupčasti kaiš (zamena, preporučeni interval, datum)
  - Klima servis (punjenje gasa, tip gasa, količina, datum)
  - Električni sistem (akumulator, alternator, starteri — tip, kapacitet, datum)
- **Katalog delova i usluga** — interni cenovnik koji ubrzava unos pri kreiranju naloga
- **Podsetnici** — lista vozila kojima se bliži datum ili kilometraža sledećeg servisa
- **Pretraga** — po VIN-u, registarskom broju, imenu vlasnika, broju naloga
- **PDF export** — servisna knjižica vozila (cela istorija) i pojedinačni servisni nalog
- **Cloud sync** — automatski šalje podatke na server kada je internet dostupan

#### DEO 2 — Cloud API (Node.js + Express)

Backend API koji prima podatke od desktop aplikacije putem sync mehanizma i servira podatke
web portalu. Hostovan na cPanel serveru.

**Funkcionalnosti:**
- REST API za primanje sync podataka od Electron aplikacije
- JWT autentifikacija za web portal
- Serviranje podataka web portalu (read-only)
- Rate limiting za zaštitu od zloupotrebe

#### DEO 3 — Web portal (React)

Read-only web aplikacija za vlasnike automobila. Bez registracije — pretraga po VIN-u ili
registarskom broju je javno dostupna.

**Funkcionalnosti:**
- Pretraga vozila po VIN broju ili registarskom broju
- Prikaz kompletne servisne istorije vozila
- Prikaz detalja svakog servisnog naloga
- Mobilno-responzivan dizajn

### 1.3 Offline-first pristup i sync mehanizam

Osnovno načelo: **desktop aplikacija je uvek izvor istine za podatke.**

- Sve operacije se uvek zapisuju u lokalnu SQLite bazu — bez čekanja na internet
- Svaka izmena (INSERT/UPDATE/DELETE) se istovremeno dodaje u tabelu `sync_queue`
- U pozadini radi sync servis koji proverava internet konekciju svakih N minuta
- Kada je internet dostupan, sync servis šalje stavke iz queue-a na cloud API
- Nakon uspešnog slanja, stavka se briše iz queue-a i upisuje u `sync_log`
- **Conflict resolution:** Nije potrebna — desktop je uvek master. Cloud samo prima podatke.
- Korisnici web portala vide podatke sa određenim kašnjenjem (od poslednjeg sync-a)

---

## 2. Plan razvoja po fazama

---

### FAZA 1: Project Setup + Osnovna struktura

**Cilj:** Funkcionalna Electron + React aplikacija sa SQLite bazom i osnovnom navigacijom.

**Šta se radi:**
- Inicijalizacija Electron projekta (electron-vite boilerplate)
- Konfiguracija React 18 i React Router
- Postavljanje TailwindCSS
- Setup better-sqlite3 i kreiranje inicijalnih migracija (prazna šema)
- Osnovni layout: Sidebar navigacija, TopBar, MainContent zona
- Stranice-placeholder za sve module (Vozila, Vlasnici, Nalozi, Katalog, Dashboard)
- Electron main/renderer razdvajanje, preload.js contextBridge setup
- Setup electron-builder za Windows NSIS installer
- .env konfiguracija

---

## FAZA 1 PROMPT — Project Setup + Osnovna struktura

```
Pre nego što počneš, pročitaj sledeće fajlove:
- CLAUDE.md (onboarding i konvencije)
- .claude/project.md (arhitektura i tech stack)
- .claude/progress.md (trenutno stanje)
- .claude/tasks.md (aktivni taskovi za ovu fazu)

## Zadatak: Faza 1 — Project Setup + Osnovna struktura

### Šta treba da bude urađeno na kraju ove faze:

1. **Electron + React boilerplate** (electron-vite)
   - desktop-app/ folder sa kompletnom strukturom projekta
   - package.json sa svim zavisnostima: electron, react, react-router-dom,
     better-sqlite3, tailwindcss, electron-builder, axios

2. **TailwindCSS** — konfigurisano i radi u renderer procesu

3. **SQLite setup** (better-sqlite3)
   - Baza se kreira u AppData folderu korisnika
   - Sistem migracija (verzionisanje šeme)
   - Inicijalna migracija 001_initial.js koja kreira prazne tabele

4. **Electron arhitektura**
   - main/index.js — main process, kreira prozor, inicijalizuje bazu
   - preload.js — contextBridge sa window.api objektom
   - IPC handlers za database operacije

5. **React aplikacija**
   - App.jsx sa React Router konfiguracijom
   - Layout: Sidebar + TopBar + MainContent
   - Sidebar sa linkovima: Dashboard, Vozila, Vlasnici, Servisni nalozi,
     Katalog, Podsetnici
   - Placeholder stranice za svaki modul (samo naslov i opis)

6. **electron-builder.config.js**
   - Target: Windows NSIS installer
   - AppId, naziv aplikacije, ikonica

7. **Verifikacija:**
   - `npm run dev` pokreće Electron prozor sa React UI
   - Navigacija između stranica radi
   - SQLite baza se kreira pri prvom pokretanju
   - Nema console grešaka

### Na kraju faze obavezno:
- Ažuriraj .claude/progress.md — označi Fazu 1 kao završenu
- Ažuriraj .claude/tasks.md — označi sve Faza 1 taskove kao [x]
- Napiši "✅ Context files ažurirani" kao poslednju poruku
```

---

### FAZA 2: Upravljanje vozilima i vlasnicima

**Cilj:** Kompletan CRUD za vozila i vlasnike sa pretragom i SQLite šemom.

**Šta se radi:**
- SQLite migracije: tabele `vehicles`, `owners`, `ownership_history`
- Vehicle model (CRUD operacije u main procesu)
- Owner model (CRUD operacije u main procesu)
- IPC handlers za sve operacije
- VehicleList stranica sa pretragom i filterima
- VehicleForm komponenta (dodavanje i editovanje)
- VehicleDetail stranica sa istorijom vlasništva
- OwnerList, OwnerForm, OwnerDetail stranice
- Validacije formi (VIN format, obavezna polja, regex)

---

## FAZA 2 PROMPT — Upravljanje vozilima i vlasnicima

```
Pre nego što počneš, pročitaj sledeće fajlove:
- CLAUDE.md (onboarding i konvencije)
- .claude/project.md (arhitektura, šema baze, IPC konvencije)
- .claude/progress.md (trenutno stanje — Faza 1 mora biti završena)
- .claude/tasks.md (aktivni taskovi za ovu fazu)

## Zadatak: Faza 2 — Upravljanje vozilima i vlasnicima

### Šta treba da bude urađeno na kraju ove faze:

1. **SQLite migracije** (u desktop-app/database/migrations/)
   - 002_vehicles.js — tabela vehicles (sve kolone prema project.md)
   - 003_owners.js — tabela owners
   - 004_ownership_history.js — tabela ownership_history (veza vozilo-vlasnik)

2. **Main process modeli** (desktop-app/src/main/models/)
   - vehicle.js — getAll, getById, create, update, delete, search
   - owner.js — getAll, getById, create, update, delete, search
   - ownershipHistory.js — getByVehicle, addOwner

3. **IPC handlers** (desktop-app/src/main/ipc/)
   - vehicles-ipc.js — ipc.handle za sve vehicle operacije
   - owners-ipc.js — ipc.handle za sve owner operacije

4. **React stranice i komponente** (desktop-app/src/renderer/)
   - pages/vehicles/VehicleList.jsx — tabela sa pretragom, dugmad za edit/delete
   - pages/vehicles/VehicleForm.jsx — forma za dodavanje i editovanje
   - pages/vehicles/VehicleDetail.jsx — detalji vozila + istorija vlasništva
   - pages/owners/OwnerList.jsx — tabela vlasnika sa pretragom
   - pages/owners/OwnerForm.jsx — forma za dodavanje i editovanje vlasnika
   - pages/owners/OwnerDetail.jsx — detalji vlasnika + lista vozila

5. **Validacije:**
   - VIN: 17 karaktera, alfanumerički (bez I, O, Q)
   - Telefon: srpski format (+381 ili 06x)
   - Obavezna polja označena u UI

6. **Verifikacija:**
   - Dodavanje, editovanje i brisanje vozila radi
   - Dodavanje, editovanje i brisanje vlasnika radi
   - Pretraga vozila po VIN-u, marki, modelu radi
   - Pretraga vlasnika po imenu i telefonu radi
   - Istorija vlasništva se pravilno prikazuje

### Na kraju faze obavezno:
- Ažuriraj .claude/progress.md — označi Fazu 2 kao završenu
- Ažuriraj .claude/tasks.md — označi sve Faza 2 taskove kao [x]
- Napiši "✅ Context files ažurirani" kao poslednju poruku
```

---

### FAZA 3: Servisni nalozi

**Cilj:** Kompletan sistem servisnih naloga, katalog delova i PDF export.

**Šta se radi:**
- SQLite migracije: `service_orders`, `service_items`, `service_parts`,
  `special_records`, `parts_catalog`
- Modeli i IPC handlers za sve entitete
- ServiceOrderList i ServiceOrderForm (kompleksna višesekcijska forma)
- ServiceOrderDetail (pregled naloga)
- PartsCatalog stranica
- Specijalne evidencije (gume, kočnice, OBD, kaiš, klima, elektrika)
- PDF export: servisna knjižica i pojedinačni nalog

---

## FAZA 3 PROMPT — Servisni nalozi, katalog i PDF export

```
Pre nego što počneš, pročitaj sledeće fajlove:
- CLAUDE.md (onboarding i konvencije)
- .claude/project.md (arhitektura, šema baze, IPC konvencije)
- .claude/progress.md (trenutno stanje — Faza 2 mora biti završena)
- .claude/tasks.md (aktivni taskovi za ovu fazu)

## Zadatak: Faza 3 — Servisni nalozi, katalog i PDF export

### Šta treba da bude urađeno na kraju ove faze:

1. **SQLite migracije** (u desktop-app/database/migrations/)
   - 005_parts_catalog.js — tabela parts_catalog (ime, OEM, kategorija, cena)
   - 006_service_orders.js — tabela service_orders
   - 007_service_items.js — tabela service_items (radovi)
   - 008_service_parts.js — tabela service_parts (delovi i materijali)
   - 009_special_records.js — tabela special_records (tires, brakes, obd,
     timing_belt, ac_service, electrical)

2. **Main process modeli:**
   - serviceOrder.js — getAll, getById, getByVehicle, create, update, delete
   - serviceItem.js — getByOrder, create, update, delete
   - servicePart.js — getByOrder, create, update, delete
   - specialRecord.js — getByVehicle, getByType, create, update
   - partsCatalog.js — getAll, search, create, update, delete

3. **IPC handlers:**
   - service-orders-ipc.js
   - parts-catalog-ipc.js
   - special-records-ipc.js

4. **React stranice i komponente:**
   - pages/service-orders/ServiceOrderList.jsx — lista naloga sa filterima
   - pages/service-orders/ServiceOrderForm.jsx — višesekcijska forma:
     * Sekcija 1: Osnovno (vozilo, vlasnik, datum, km, vrsta servisa)
     * Sekcija 2: Radovi (dodavanje sa autocomplete iz kataloga)
     * Sekcija 3: Delovi i materijali (dodavanje sa autocomplete)
     * Sekcija 4: Finansije (automatski izračun totala)
     * Sekcija 5: Preporuke i sledeći servis
   - pages/service-orders/ServiceOrderDetail.jsx — prikaz završenog naloga
   - pages/catalog/PartsCatalog.jsx — upravljanje katalogom
   - pages/service-orders/SpecialRecords.jsx — specijalne evidencije po tipu

5. **PDF export** (u main procesu, koristeći jsPDF):
   - generateServiceBookPdf(vehicleId) — kompletna servisna knjižica
   - generateOrderPdf(orderId) — pojedinačni servisni nalog
   - IPC handler koji otvara dialog za čuvanje fajla

6. **Verifikacija:**
   - Kreiranje servisnog naloga od a do z radi
   - Autocomplete iz kataloga radi u formi
   - Finansije se automatski izračunavaju
   - PDF servisne knjižice se generiše i čuva
   - PDF pojed. naloga se generiše i čuva
   - Specijalne evidencije se dodaju i prikazuju

### Na kraju faze obavezno:
- Ažuriraj .claude/progress.md — označi Fazu 3 kao završenu
- Ažuriraj .claude/tasks.md — označi sve Faza 3 taskove kao [x]
- Napiši "✅ Context files ažurirani" kao poslednju poruku
```

---

### FAZA 4: Dashboard i podsetnici

**Cilj:** Pregled statistika, grafikoni, lista vozila kojima se bliži servis.

**Šta se radi:**
- Dashboard stranica sa KPI karticama (ukupno vozila, naloga, prihoda)
- Grafikon prihoda po mesecima (Recharts)
- Grafikon raspodele po vrsti servisa
- Podsetnici — lista vozila sortirana po urgentnosti
- Electron notifikacije za vozila kojima je prošao rok
- Globalna pretraga kroz aplikaciju

---

## FAZA 4 PROMPT — Dashboard i podsetnici

```
Pre nego što počneš, pročitaj sledeće fajlove:
- CLAUDE.md (onboarding i konvencije)
- .claude/project.md (arhitektura i tech stack)
- .claude/progress.md (trenutno stanje — Faza 3 mora biti završena)
- .claude/tasks.md (aktivni taskovi za ovu fazu)

## Zadatak: Faza 4 — Dashboard i podsetnici

### Šta treba da bude urađeno na kraju ove faze:

1. **Dashboard stranica** (pages/Dashboard.jsx):
   - KPI kartice: ukupno vozila, naloga ovog meseca, prihod ovog meseca,
     vozila kojima se bliži servis
   - Grafikon prihoda po mesecima (poslednjih 12) — Recharts LineChart
   - Grafikon raspodele po vrsti servisa — Recharts PieChart
   - Lista poslednjih 5 servisnih naloga

2. **Podsetnici** (pages/Reminders.jsx):
   - Lista svih vozila kojima se bliži servis (u narednih 30 dana ili 500 km)
   - Sortiranje po urgentnosti (prekoračeni rok na vrhu)
   - Vizuelni indikatori: crvena (prekoračeno), žuta (bliži se), zelena (u redu)
   - Dugme za direktno kreiranje novog naloga za vozilo

3. **Electron notifikacije:**
   - Pri pokretanju aplikacije, proverava vozila sa prekoračenim rokom
   - Prikazuje Windows notifikaciju sa brojem vozila
   - Klik na notifikaciju otvara Podsetnici stranicu

4. **Globalna pretraga:**
   - SearchBar u TopBaru
   - Pretraga simultano po: VIN, reg. broj, vlasnik, broj naloga
   - Dropdown sa rezultatima grupisanim po kategorijama
   - Klik vodi na odgovarajuću stranicu

5. **SQL upiti za dashboard** (u main procesu):
   - getDashboardStats() — agregacije za KPI kartice
   - getMonthlyRevenue(year) — prihodi po mesecima
   - getServiceTypeDistribution() — raspodela po vrsti servisa
   - getUpcomingServices(days, kmThreshold) — vozila kojima se bliži servis

6. **Verifikacija:**
   - Dashboard se učitava i prikazuje tačne podatke
   - Grafikoni se renderuju ispravno
   - Lista podsetnika je tačna i sortirana
   - Pretraga vraća relevantne rezultate

### Na kraju faze obavezno:
- Ažuriraj .claude/progress.md — označi Fazu 4 kao završenu
- Ažuriraj .claude/tasks.md — označi sve Faza 4 taskove kao [x]
- Napiši "✅ Context files ažurirani" kao poslednju poruku
```

---

### FAZA 5: Cloud Sync + API

**Cilj:** Express.js API na cPanel-u, MySQL šema, sync mehanizam u Electronu.

**Šta se radi:**
- Express API setup u server-api/ (rute, kontroleri, middleware)
- MySQL šema (iste tabele kao SQLite + sync_log)
- JWT autentifikacija za web portal
- Sync queue u SQLite (tabela `sync_queue`)
- Sync servis u Electronu (background, šalje kada ima internet)
- Deploy na cPanel (/home/kafanicars/ESK/, Passenger)

---

## FAZA 5 PROMPT — Cloud Sync + API

```
Pre nego što počneš, pročitaj sledeće fajlove:
- CLAUDE.md (onboarding i konvencije)
- .claude/project.md (arhitektura, deployment workflow za cPanel)
- .claude/progress.md (trenutno stanje — Faza 4 mora biti završena)
- .claude/tasks.md (aktivni taskovi za ovu fazu)

## Zadatak: Faza 5 — Cloud Sync + API

### Šta treba da bude urađeno na kraju ove faze:

1. **SQLite migracija** (desktop-app):
   - 010_sync_queue.js — tabela sync_queue (entity_type, entity_id,
     operation, payload JSON, created_at, attempts)

2. **Express API** (server-api/):
   - app.js — Express setup, middleware (cors, helmet, rate-limit), rute
   - src/routes/sync.js — POST /api/sync (prima batch izmena od desktop app)
   - src/routes/vehicles.js — GET /api/vehicles/:vin (za web portal)
   - src/routes/serviceOrders.js — GET /api/service-orders/:vehicleId
   - src/middleware/auth.js — JWT verifikacija za zaštićene rute
   - src/models/ — MySQL modeli za sve entitete (mysql2/promise)
   - database/migrations/ — MySQL DDL skripte

3. **MySQL šema:**
   - Iste tabele kao SQLite + kolona `synced_at`
   - Tabela `sync_log` (beleži svaki primljeni sync batch)
   - Tabela `api_keys` (za desktop app autentifikaciju pri sync-u)

4. **Sync servis u Electronu** (desktop-app/src/main/sync-service.js):
   - setInterval proverava internet konekciju svakih 5 minuta
   - Uzima batch iz sync_queue (max 100 stavki)
   - Šalje POST /api/sync sa API ključem u headeru
   - Na uspeh: briše stavke iz queue, upisuje u sync_log
   - Na grešku: povećava attempts, posle 5 pokušaja označava kao failed

5. **Deploy na cPanel:**
   - .env.example sa svim potrebnim varijablama (DB_HOST, DB_USER, DB_PASS,
     DB_NAME, JWT_SECRET, API_KEY, PORT)
   - Instrukcije za deployment u docs/technical/technical_manual.md
   - Passenger startup file: app.js (mora exportovati Express app)

6. **Verifikacija:**
   - API lokalno radi (npm run dev u server-api/)
   - Sync servis šalje podatke i queue se prazni
   - MySQL baza prima podatke
   - JWT token se generiše i verifikuje

### Na kraju faze obavezno:
- Ažuriraj .claude/progress.md — označi Fazu 5 kao završenu
- Ažuriraj .claude/tasks.md — označi sve Faza 5 taskove kao [x]
- Napiši "✅ Context files ažurirani" kao poslednju poruku
- Napisi mi E2E user test plan
```

---

### FAZA 6: Web portal + Polish

**Cilj:** React web portal za vlasnike, Windows installer, UX polish, testovi.

**Šta se radi:**
- React + Vite web portal setup
- Pretraga vozila i prikaz servisne istorije
- Mobilno-responzivan dizajn
- Deploy web portala na cPanel
- Windows installer (NSIS config)
- Auto-updater
- E2E testovi (Playwright)
- UX polish i review

---

## FAZA 6 PROMPT — Web portal + Polish

```
Pre nego što počneš, pročitaj sledeće fajlove:
- CLAUDE.md (onboarding i konvencije)
- .claude/project.md (arhitektura i tech stack)
- .claude/progress.md (trenutno stanje — Faza 5 mora biti završena)
- .claude/tasks.md (aktivni taskovi za ovu fazu)

## Zadatak: Faza 6 — Web portal + Polish

### Šta treba da bude urađeno na kraju ove faze:

1. **Web portal** (web-portal/):
   - Vite + React 18 + TailwindCSS setup
   - vite.config.js sa base URL konfiguracijom za cPanel deploy
   - pages/SearchPage.jsx — pretraga po VIN-u ili registarskom broju
   - pages/VehicleHistory.jsx — prikaz kompletne servisne istorije
   - pages/ServiceOrderDetail.jsx — detalji jednog servisnog naloga
   - components/ServiceCard.jsx — kartica jednog servisa u listi
   - Axios konfiguracija sa API base URL iz .env
   - Mobilno-responzivan dizajn (mobile-first, Tailwind breakpoints)

2. **Windows installer** (electron-builder.config.js):
   - NSIS target konfiguracija
   - Instalacioni i deinstalacioni wizard
   - Shortcut na Desktop i Start menu
   - Auto-updater konfiguracija (GitHub Releases ili vlastiti server)

3. **E2E testovi** (Playwright):
   - Test: kreiranje vozila → kreiranje naloga → PDF export
   - Test: pretraga vozila u desktop aplikaciji
   - Test: web portal pretraga i prikaz istorije

4. **UX polish:**
   - Loading skeleton komponente za sve liste
   - Error boundary komponente
   - Toast notifikacije za uspešne i neuspešne operacije
   - Keyboard navigacija i accessibility (ARIA labele)
   - Consistent spacing i boje kroz celu aplikaciju

5. **Deploy:**
   - Web portal: `npm run build` → upload u cPanel public_html
   - API: upload u /home/kafanicars/ESK/, restart Passengera
   - Verifikacija live URL-a: kafanica-sa-dobrom-klopom.rs/ESK

6. **Verifikacija:**
   - `npm run build` u desktop-app/ generiše .exe installer
   - Web portal se prikazuje na mobilnom i desktop uređaju
   - E2E testovi prolaze
   - Live API i web portal rade

### Na kraju faze obavezno:
- Ažuriraj .claude/progress.md — označi Fazu 6 kao završenu
- Ažuriraj .claude/tasks.md — označi sve Faza 6 taskove kao [x]
- Napiši "✅ Context files ažurirani — Projekat završen!" kao poslednju poruku
```

---

## 3. Potencijalne buduće funkcionalnosti

- Višejezična podrška (srpski / engleski)
- Backup i restore SQLite baze
- Import podataka iz Excel / CSV
- SMS / email podsetnici vlasnicima
- Fotografije vozila i oštećenja
- Višekorisnički mod (više servisera)
- Integracija sa katalozima originalnih delova (TecDoc API)

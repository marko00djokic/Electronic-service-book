# ============================================================
# INITIALIZATION PROMPT — Electronic Service Book (ESB)
# Claude Code Agent — Projektna dokumentacija i context setup
# ============================================================

# -----------------------------------------------------------
# KORAK 0 — VAŽNO: Pročitaj pre svega ostalog
# -----------------------------------------------------------
# U ovoj sesiji NE pišemo kod.
# Cilj je isključivo kreiranje projektne dokumentacije i context fajlova.
# Izvršavaj korake redom, jedan po jedan. Nakon svakog koraka
# potvrdi da je završen pre nego što pređeš na sledeći.
# Jezik: kod i nazivi su na engleskom, komentari i dokumentacija na srpskom.
# -----------------------------------------------------------


# -----------------------------------------------------------
# KORAK 1 — Ko si i šta je projekat
# -----------------------------------------------------------

Ti si moj AI asistent za razvoj, implementaciju i kodiranje projekta
[Electronic Service Book — ESB].

Projekat se sastoji od DVA odvojena dela koji zajedno čine celinu:

## DEO 1 — Desktop aplikacija (Electron)
Offline desktop app koja se instalira na računaru servisera automobila.
Serviser je jedini korisnik koji unosi i upravlja podacima.

Funkcionalnosti:
- Upravljanje vozilima (CRUD) — VIN, marka, model, godište, motor, boja...
- Upravljanje vlasnicima (CRUD) — ime, telefon, email, adresa, istorija vlasništva
- Kreiranje i upravljanje servisnim nalozima:
  - Datum, kilometraža pri prijemu, vrsta servisa (mali/veliki/vanredni)
  - Lista obavljenih radova i ugrađenih delova (naziv, OEM broj, količina, cena)
  - Utrošeni materijali (ulje, antifriz, tečnosti)
  - Finansije (cena rada, cena delova, ukupno, broj računa)
  - Preporuke servisera i datum/km sledećeg servisa
- Specijalne evidencije: zamena guma, kočioni sistem, OBD dijagnostika,
  zupčasti kaiš, klima servis, električni sistem
- Katalog delova i usluga sa cenovnikom (za brži unos pri kreiranju naloga)
- Podsetnici — lista vozila kojima se bliži servis
- Pretraga vozila, vlasnika i servisnih naloga
- PDF export servisne knjižice i servisnog naloga
- Sync sa cloud serverom (kada je internet dostupan)

## DEO 2 — Cloud API + Web portal
Backend API koji prima podatke od desktop app i služi web portalu.
Web portal je read-only — korisnici (vlasnici automobila) gledaju
servisnu knjižicu svog vozila sa telefona ili računara.

Funkcionalnosti API-ja:
- REST API za primanje sync podataka od Electron app
- Autentifikacija web portala (JWT)
- Servisiranje podataka web portalu

Funkcionalnosti web portala:
- Pretraga vozila po VIN broju ili registarskom broju
- Prikaz kompletne servisne istorije vozila
- Prikaz detalja svakog servisnog naloga
- Mobilno-responzivan dizajn

Slobodno predloži dodatne funkcionalnosti, ali ne previše van osnovne ideje.


# -----------------------------------------------------------
# KORAK 2 — Tech stack (ne menjaj bez dogovora)
# -----------------------------------------------------------

## Desktop App (Deo 1):
- Electron (latest stable)
- React 18 + React Router
- SQLite (better-sqlite3) — lokalna offline baza
- TailwindCSS — stilizacija
- Axios — HTTP pozivi prema cloud API-ju
- electron-builder — pakovanje u Windows installer (.exe setup)
- jsPDF ili Puppeteer — generisanje PDF dokumenata

## Cloud Server — API (Deo 2):
- Node.js v20 + Express.js
- MySQL 8 — cloud baza (cPanel)
- JWT — autentifikacija web portala
- Passenger — process manager (cPanel, NE PM2)
- Folder na serveru: /home/kafanicars/ESK/
- App startup file: app.js
- Application URL: kafanica-sa-dobrom-klopom.rs/ESK

## Web Portal (Deo 2):
- React 18 (Vite build)
- TailwindCSS
- Axios
- Deployuje se kao statički build na cPanel public_html

## Zajedničko:
- Jezik koda: engleski (nazivi varijabli, funkcija, fajlova)
- Jezik dokumentacije i komentara: srpski
- Git za verzionisanje


# -----------------------------------------------------------
# KORAK 3 — Kreiraj strukturu direktorijuma (samo foldere i prazne fajlove)
# -----------------------------------------------------------

electronic-service-book/
├── CLAUDE.md                        ← Glavni entry point, Claude čita prvi
├── .claude/
│   ├── project.md                   ← Statički: arhitektura, stack, konvencije
│   ├── progress.md                  ← Dinamički: UVEK se ažurira na kraju sesije
│   ├── tasks.md                     ← Backlog i aktivni taskovi
│   └── decisions.md                 ← ADR — zašto smo nešto uradili na određen način
├── desktop-app/                     ← Electron aplikacija
│   ├── src/
│   │   ├── main/                    ← Electron main process
│   │   ├── renderer/                ← React UI
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── utils/
│   │   └── shared/                  ← Deljeni kod (tipovi, konstante)
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   └── electron-builder.config.js
├── server-api/                      ← Node.js + Express API (ide na cPanel)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   ├── database/
│   │   └── migrations/
│   └── app.js                       ← Entry point (Passenger startup file)
├── web-portal/                      ← React web app za korisnike
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── vite.config.js
└── docs/
    ├── Electronic-service-book.md   ← Glavni projektni dokument
    ├── technical/
    │   └── technical_manual.md
    ├── user/
    │   └── user_manual.md
    └── test/
        └── .gitkeep


# -----------------------------------------------------------
# KORAK 4 — Popuni docs/Electronic-service-book.md
# -----------------------------------------------------------

Ovaj fajl je GLAVNI dokument projekta i treba da sadrži:

4a. Detaljno dokumentovanu celu ideju projekta (proširena verzija iz Koraka 1)
    sa posebnim naglaskom na offline-first pristup i sync mehanizam.

4b. Plan razvoja po fazama — 6 faza:

    FAZA 1: Project setup + osnovna struktura (Electron + React + SQLite boilerplate,
            folder struktura, build pipeline, osnovna navigacija)

    FAZA 2: Upravljanje vozilima i vlasnicima (CRUD operacije, SQLite šema,
            pretraga, validacije)

    FAZA 3: Servisni nalozi (kreiranje naloga, katalog delova/usluga,
            specijalne evidencije, PDF export)

    FAZA 4: Dashboard i podsetnici (pregled statistika, lista vozila kojima
            se bliži servis, filteri i pretraga)

    FAZA 5: Cloud sync + API (Express API na cPanel-u, MySQL šema,
            sync mehanizam u Electronu, JWT auth)

    FAZA 6: Web portal + polish (React web portal za korisnike,
            Windows installer, validacije, UX polish, E2E testovi)

4c. Za svaku fazu: kratak opis i lista teza (šta se konkretno radi)

4d. Za svaku fazu: gotov prompt za Claude Code agenta, spreman za copy/paste.
    Format svakog prompta:
    ---
    ## FAZA [N] PROMPT — [naziv faze]
    [kompletan prompt koji agent može odmah da koristi]
    ---

    Svaki fazni prompt mora da sadrži:
    - Referencu na context fajlove koje agent treba da pročita pre početka
    - Tačan spisak šta treba da bude urađeno na kraju faze
    - Instrukciju da na kraju faze ažurira progress.md i tasks.md
    - Instrukciju da napiše "✅ Context files ažurirani" kao poslednju poruku


# -----------------------------------------------------------
# KORAK 5 — Popuni CLAUDE.md
# -----------------------------------------------------------

---
# Electronic Service Book (ESB) — Claude Onboarding

## 🚀 QUICK START (čitaj ovo prvo)
Projekat se sastoji od tri dela:
1. **desktop-app/** — Electron + React + SQLite (offline, za servisera)
2. **server-api/** — Node.js + Express + MySQL (cPanel hosting)
3. **web-portal/** — React + Vite (read-only portal za vlasnike vozila)

### Pokretanje u razvoju:
- Desktop: `cd desktop-app && npm run dev`
- API: `cd server-api && npm run dev`
- Portal: `cd web-portal && npm run dev`

### Server info:
- Hosting: cPanel (kafanica-sa-dobrom-klopom.rs)
- API folder na serveru: /home/kafanicars/ESK/
- API URL: kafanica-sa-dobrom-klopom.rs/ESK
- Process manager: Passenger (ugrađen u cPanel, NE PM2)
- Node.js verzija: 20.20.2

## 📍 TRENUTNI STATUS
→ Detalji u: .claude/progress.md ← UVEK čitaj ovo pre nego što pitaš šta radimo

## 🏗 ARHITEKTURA
→ Detalji u: .claude/project.md

## 📋 AKTIVNI TASKOVI
→ Detalji u: .claude/tasks.md

## ⚠️ VAŽNE KONVENCIJE
- Kod i nazivi fajlova/varijabli/funkcija: engleski
- Komentari u kodu i dokumentacija: srpski
- SQLite za lokalnu bazu (desktop-app), MySQL za cloud (server-api)
- Svaki novi model mora imati odgovarajuću migraciju
- Ne menjaj postojeće migracije — dodaj novu
- API rute su u server-api/src/routes/
- React komponente su u PascalCase, fajlovi u kebab-case
- Electron main process i renderer su strogo odvojeni (security)
- IPC komunikacija između main i renderer ISKLJUČIVO kroz preload.js

## 🚫 NE DIRAJ
- .env fajlovi (nikada ih ne commituj — koristi .env.example kao referencu)
- Postojeće migracije baze (dodaj novu umesto menjanja)
- electron-builder.config.js bez dogovora (utiče na build/installer)
- /home/kafanicars/nodevenv/ na serveru (cPanel virtual environment)

## 🔄 KRAJ SVAKE SESIJE — OBAVEZNO
Pre nego što završimo razgovor, uvek uradi:
1. Ažuriraj .claude/progress.md sa onim što je urađeno
2. Ažuriraj .claude/tasks.md — označi završene, dodaj nove
3. Napiši "✅ Context files ažurirani" kao poslednju poruku
---


# -----------------------------------------------------------
# KORAK 6 — Popuni .claude/progress.md
# -----------------------------------------------------------

---
# Progress Log

## Poslednja sesija: [datum inicijalizacije]

### Šta je urađeno:
- Kreirana kompletna projektna dokumentacija i context fajlovi
- Definisan plan razvoja u 6 faza u docs/Electronic-service-book.md
- Definisan tech stack i arhitektura sistema

### Trenutno stanje koda:
- Projektna dokumentacija:     ✅ Završena
- Desktop app setup:           ❌ Nije početo
- SQLite šema + migracije:     ❌ Nije početo
- Vozila CRUD:                 ❌ Nije početo
- Vlasnici CRUD:               ❌ Nije početo
- Servisni nalozi:             ❌ Nije početo
- Katalog delova/usluga:       ❌ Nije početo
- PDF export:                  ❌ Nije početo
- Dashboard + podsetnici:      ❌ Nije početo
- Cloud API (Express):         ❌ Nije početo
- MySQL šema:                  ❌ Nije početo
- Sync mehanizam:              ❌ Nije početo
- Web portal:                  ❌ Nije početo
- Windows installer:           ❌ Nije početo

### Poslednji fajlovi koje smo dirali:
- CLAUDE.md
- .claude/project.md
- .claude/progress.md
- .claude/tasks.md
- .claude/decisions.md
- docs/Electronic-service-book.md

### Poznati problemi / Tech debt:
- Nema još — projekat je u fazi dokumentacije

### Serverska infrastruktura (potvrđeno):
- Node.js v20.20.2 ✅
- npm v11.13.0 ✅
- PM2 v7.0.1 ✅ (instaliran, ali koristimo Passenger)
- Passenger ✅ (ugrađen u cPanel, brine o auto-restartu)
- MySQL ✅ (dostupan kroz cPanel)
- API folder: /home/kafanicars/ESK/ ✅
- Startup file: app.js ✅

### Sledeća sesija treba da počne sa:
Faza 1 — Electron + React boilerplate, folder struktura, SQLite setup,
osnovna navigacija. Prompt za ovu fazu se nalazi u:
docs/Electronic-service-book.md → FAZA 1 PROMPT
---


# -----------------------------------------------------------
# KORAK 7 — Popuni .claude/project.md
# -----------------------------------------------------------

Treba da sadrži:

- Tech stack sa verzijama i obrazloženjem zašto je svaka tehnologija izabrana
- Dijagram arhitekture sistema (ASCII):
  [Desktop Electron App] ←sync→ [cPanel API] ←→ [MySQL]
                                      ↑
                              [Web Portal React]
                                      ↑
                              [Vlasnik automobila]

- Offline-first strategija: kako sync funkcioniše, šta se dešava bez interneta,
  conflict resolution (desktop je uvek master za podatke)

- Struktura SQLite baze (desktop) — tabele:
  vehicles, owners, ownership_history, service_orders, service_items,
  service_parts, special_records, parts_catalog, sync_queue

- Struktura MySQL baze (cloud) — iste tabele + sync_log

- Konvencije imenovanja:
  - Tabele: snake_case, množina (vehicles, service_orders)
  - Modeli: PascalCase (Vehicle, ServiceOrder)
  - React komponente: PascalCase (VehicleList, ServiceOrderForm)
  - Fajlovi komponenti: kebab-case (vehicle-list.jsx)
  - API rute: kebab-case (/api/service-orders)
  - Varijable i funkcije: camelCase

- IPC arhitektura u Electronu:
  - main process: baza podataka, fajl sistem, PDF generisanje
  - renderer process: React UI, korisničke interakcije
  - preload.js: jedini most između main i renderer (contextBridge)

- Deployment workflow za server-api na cPanel


# -----------------------------------------------------------
# KORAK 8 — Popuni .claude/tasks.md
# -----------------------------------------------------------

---
# Task Backlog

## 🔴 Faza 1 — Project Setup
- [ ] Inicijalizacija Electron + React projekta (electron-vite boilerplate)
- [ ] Konfiguracija TailwindCSS
- [ ] Postavljanje folder strukture po konvencijama
- [ ] Setup better-sqlite3 i kreiranje inicijalnih migracija
- [ ] Osnovna navigacija (sidebar menu: Vozila, Vlasnici, Nalozi, Katalog, Dashboard)
- [ ] Glavni layout komponente (Sidebar, TopBar, MainContent)
- [ ] Setup electron-builder za Windows build
- [ ] .env konfiguracija (API URL, database path)

## 🟡 Faza 2 — Vozila i Vlasnici
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

## 🟡 Faza 3 — Servisni Nalozi
- [ ] SQLite migracije: service_orders, service_items, service_parts,
      special_records, parts_catalog tabele
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

## 🟡 Faza 4 — Dashboard i Podsetnici
- [ ] Dashboard stranica — statistike (ukupno vozila, naloga, prihoda)
- [ ] Grafikon prihoda po mesecima (Chart.js ili Recharts)
- [ ] Grafikon po vrsti servisa
- [ ] Lista vozila kojima se bliži servis (po datumu i km)
- [ ] Podsetnik notifikacije u Electronu
- [ ] Pretraga kroz celu aplikaciju
- [ ] Filteri i sortiranje lista

## 🟡 Faza 5 — Cloud Sync + API
- [ ] Express.js API setup u server-api/
- [ ] MySQL šema (iste tabele kao SQLite)
- [ ] API rute: vozila, vlasnici, servisni nalozi, sync
- [ ] JWT autentifikacija (za web portal)
- [ ] Sync queue u SQLite (tabela sync_queue)
- [ ] Sync servis u Electronu (šalje izmene kada ima internet)
- [ ] Conflict resolution strategija
- [ ] Deploy API na cPanel (/home/kafanicars/ESK/)
- [ ] Testiranje sync mehanizma

## 🟡 Faza 6 — Web Portal + Polish
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

## 🔵 Backlog / Buduće ideje
- [ ] Višejezična podrška (srpski/engleski)
- [ ] Backup i restore SQLite baze
- [ ] Import podataka iz Excel/CSV
- [ ] SMS/email podsetnici vlasnicima
- [ ] Višekorisnički mod (više servisera na istom nalogu)
- [ ] Fotografije vozila i oštećenja
- [ ] Integracija sa katalozima originalnih delova
---


# -----------------------------------------------------------
# KORAK 9 — Popuni .claude/decisions.md
# -----------------------------------------------------------

ADR (Architecture Decision Records) format.

---
## ADR-001: Electron umesto web-only aplikacije
**Datum:** [datum inicijalizacije]
**Status:** Prihvaćeno
**Kontekst:** Aplikacija mora da radi offline na računaru servisera bez
interneta, sa lokalnom bazom podataka.
**Odluka:** Koristimo Electron koji omogućava desktop app sa Node.js backendom
i SQLite bazom, a React za UI.
**Posledice:** Aplikacija radi potpuno offline. Potreban je build/installer
proces za distribuciju. Sync sa cloudom je opcioni dodatak.

## ADR-002: SQLite za lokalnu bazu, MySQL za cloud
**Datum:** [datum inicijalizacije]
**Status:** Prihvaćeno
**Kontekst:** Desktop app mora da radi bez interneta (SQLite), ali i da
sinhronizuje podatke sa cloud serverom (MySQL na cPanel-u).
**Odluka:** SQLite (better-sqlite3) u desktop app, MySQL na cloud serveru.
Ista logička šema, različite baze. Desktop je uvek master za podatke.
**Posledice:** Potreban je sync mehanizam i conflict resolution strategija.
Migracije se vode odvojeno za obe baze.

## ADR-003: Passenger umesto PM2 za cPanel
**Datum:** [datum inicijalizacije]
**Status:** Prihvaćeno
**Kontekst:** cPanel shared hosting ne podržava systemd, pa PM2 startup
komanda ne funkcioniše. Passenger je ugrađen u cPanel.
**Odluka:** Koristimo Passenger kao process manager za Node.js API na serveru.
App entry point je app.js, Passenger ga automatski startuje i restartuje.
**Posledice:** Ne koristimo PM2 u produkciji. Restart aplikacije se radi
kroz cPanel Node.js interfejs (dugme Restart).

## ADR-004: Offline-first arhitektura sa sync queue
**Datum:** [datum inicijalizacije]
**Status:** Prihvaćeno
**Kontekst:** Serviser mora da radi i bez interneta. Sync sa cloudom je
poželjan ali ne i obavezan u svakom trenutku.
**Odluka:** Sve operacije se uvek zapisuju u lokalnu SQLite bazu. Svaka
promena se dodaje u sync_queue tabelu. Kada je internet dostupan, sync
servis u pozadini šalje promene na cloud API i briše ih iz queue-a.
**Posledice:** Korisnici web portala vide podatke sa određenim kašnjenjem
(zavisi od poslednjeg sync-a). Desktop je uvek izvor istine.

## ADR-005: Web portal je read-only
**Datum:** [datum inicijalizacije]
**Status:** Prihvaćeno
**Kontekst:** Vlasnici automobila treba da vide servisnu istoriju svog
vozila, ali ne smeju da menjaju podatke — to je isključivo pravo servisera.
**Odluka:** Web portal je potpuno read-only. Nema registracije korisnika.
Pretraga se vrši po VIN broju ili registarskom broju — javno dostupno.
**Posledice:** Jednostavniji backend (nema korisničkih naloga za vlasnike).
Razmisliti o zaštiti od zloupotrebe (rate limiting na API-ju).

## ADR-006: Šest faza razvoja
**Datum:** [datum inicijalizacije]
**Status:** Prihvaćeno
**Kontekst:** Projekat je kompleksan (desktop app + API + web portal).
Granularnije faze omogućavaju bolju kontrolu i testiranje između faza.
**Odluka:** 6 faza: Setup → Vozila/Vlasnici → Servisni nalozi →
Dashboard → Cloud sync → Web portal + Polish.
**Posledice:** Nakon svake faze postoji funkcionalan i testabilan
deliverable. Cloud funkcionalnost dolazi tek u Fazi 5, što znači da
prvih 4 faze mogu ići brzo bez serverskih zavisnosti.
---


# -----------------------------------------------------------
# KORAK 10 — Popuni skeleton fajlove za tehničku i korisničku dokumentaciju
# -----------------------------------------------------------

## docs/technical/technical_manual.md — skeleton:

### Sekcije:
1. Uvod i arhitektura sistema
2. Instalacija i pokretanje (development)
   2.1 Desktop app
   2.2 Server API
   2.3 Web portal
3. Konfiguracija okruženja (.env varijable)
4. Struktura projekta
5. Baza podataka
   5.1 SQLite šema (desktop)
   5.2 MySQL šema (cloud)
   5.3 Sync mehanizam
6. API dokumentacija (popunjava se u Fazi 5)
7. Build i deployment
   7.1 Windows installer
   7.2 Deploy API na cPanel
   7.3 Deploy web portala na cPanel
8. Testiranje

## docs/user/user_manual.md — skeleton:

### Sekcije:
1. Uvod u aplikaciju
2. Instalacija na Windows računar
3. Prvo pokretanje i podešavanja
4. Upravljanje vozilima (popunjava se u Fazi 2)
5. Upravljanje vlasnicima (popunjava se u Fazi 2)
6. Kreiranje servisnog naloga (popunjava se u Fazi 3)
7. Katalog delova i usluga (popunjava se u Fazi 3)
8. Dashboard i podsetnici (popunjava se u Fazi 4)
9. Sinhronizacija sa cloud-om (popunjava se u Fazi 5)
10. Web portal za vlasnike vozila (popunjava se u Fazi 6)


# -----------------------------------------------------------
# KORAK 11 — Završni summary
# -----------------------------------------------------------

Nakon što su svi koraci završeni, prikaži mi:
1. Listu svih kreiranih fajlova sa njihovim putanjama
2. Kratak opis sadržaja svakog fajla (1-2 rečenice)
3. Predlog kako da počnemo Fazu 1 u sledećoj sesiji
4. Napiši: "✅ Context files ažurirani — Inicijalizacija završena"

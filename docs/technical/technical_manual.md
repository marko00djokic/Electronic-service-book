# ESB — Tehnički manual

## 1. Uvod i arhitektura sistema

Electronic Service Book (ESB) je troslojna aplikacija:
- **Desktop app** (Electron + React + SQLite) — radi offline na računaru servisera
- **Cloud API** (Node.js + Express + MySQL) — prima sync podatke, servira web portal
- **Web portal** (React + Vite) — read-only prikaz za vlasnike vozila

Detaljna arhitektura: `.claude/project.md`

---

## 2. Instalacija i pokretanje (development)

### 2.1 Desktop app

```bash
cd desktop-app
npm install
npm run dev
```

Zahtevi: Node.js 20+, npm

Baza se kreira automatski u:
- Windows: `%APPDATA%\electronic-service-book\esb.db`

### 2.2 Server API

```bash
cd server-api
cp .env.example .env
# Popuni .env sa MySQL kredencijalima
npm install
npm run dev
```

### 2.3 Web portal

```bash
cd web-portal
cp .env.example .env
# VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

---

## 3. Konfiguracija okruženja (.env varijable)

### desktop-app/.env

```
API_BASE_URL=https://kafanica-sa-dobrom-klopom.rs/ESK
API_KEY=<api_kljuc_za_sync>
SYNC_INTERVAL_MS=300000
```

### server-api/.env

```
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=<mysql_korisnik>
DB_PASS=<mysql_lozinka>
DB_NAME=esb_production
JWT_SECRET=<tajni_kljuc_za_jwt>
API_KEY=<isti_kljuc_kao_u_desktop_app>
```

### web-portal/.env

```
VITE_API_URL=https://kafanica-sa-dobrom-klopom.rs/ESK
```

---

## 4. Struktura projekta

```
electronic-service-book/
├── CLAUDE.md
├── .claude/
│   ├── project.md
│   ├── progress.md
│   ├── tasks.md
│   └── decisions.md
├── desktop-app/
│   ├── src/
│   │   ├── main/           ← Electron main process
│   │   ├── renderer/       ← React UI
│   │   └── shared/         ← Deljeni tipovi i konstante
│   ├── database/
│   │   └── migrations/     ← SQLite migracije (001_*, 002_*, ...)
│   └── electron-builder.config.js
├── server-api/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   └── utils/
│   ├── database/
│   │   └── migrations/     ← MySQL DDL skripte
│   └── app.js              ← Passenger startup file
├── web-portal/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── utils/
└── docs/
```

---

## 5. Baza podataka

### 5.1 SQLite šema (desktop)

→ Detalji u: `.claude/project.md` — sekcija "Struktura SQLite baze"

Migracije se nalaze u `desktop-app/database/migrations/`.
Sistem migracija automatski izvršava nove migracije pri pokretanju aplikacije.
**Nikada ne menjaj postojeće migracije — dodaj novu.**

### 5.2 MySQL šema (cloud)

→ Detalji u: `.claude/project.md` — sekcija "Struktura MySQL baze"

DDL skripte se nalaze u `server-api/database/migrations/`.

### 5.3 Sync mehanizam

Implementiran u `desktop-app/src/main/sync-service.js`.

**Tok:**
1. Svaka promena podataka u desktop app upisuje se u `sync_queue` (status: `pending`)
2. Sync servis se pokreće 10s po startu, zatim svakih 5 minuta
3. Proverava `net.isOnline()` — preskače ako nema interneta
4. Uzima batch od max 100 `pending` stavki iz queue-a
5. Šalje `POST /api/sync` sa `x-api-key` headerom
6. Na uspeh: briše stavke iz queue-a
7. Na grešku: uvećava `attempts`; posle 5 pokušaja status postaje `failed`

**IPC API (renderer → main):**
- `window.api.sync.trigger()` — manualni sync
- `window.api.sync.getStatus()` → `{ pending, failed, syncing }`

**Env varijable u desktop-app/.env:**
```
VITE_API_URL=https://kafanica-sa-dobrom-klopom.rs/ESK
VITE_API_KEY=<isti_kljuc_koji_je_hashovan_u_bazi>
VITE_DESKTOP_ID=desktop-1
```

---

## 6. API dokumentacija

Base URL (produkcija): `https://kafanica-sa-dobrom-klopom.rs/ESK`
Base URL (razvoj): `http://localhost:3000/ESK`

### 6.1 Endpoint-i

| Method | Ruta                              | Opis                              | Auth          |
|--------|-----------------------------------|-----------------------------------|---------------|
| GET    | /health                           | Health check                      | -             |
| POST   | /api/sync                         | Prijem batch izmena od desktop    | API Key       |
| GET    | /api/vehicles/:vin                | Podaci o vozilu po VIN-u          | -             |
| GET    | /api/service-orders/:vehicleId    | Lista servisnih naloga za vozilo  | -             |

### 6.2 POST /api/sync

**Header:** `x-api-key: <API_KEY>`

**Request body:**
```json
{
  "desktop_id": "desktop-1",
  "items": [
    {
      "id": 42,
      "entity_type": "vehicle",
      "operation": "INSERT",
      "payload": "{\"id\": 1, \"vin\": \"WBA3A5G5XHNY33467\", ...}",
      "created_at": "2026-05-05T10:00:00"
    }
  ]
}
```

- `entity_type`: `vehicle` | `owner` | `ownership_history` | `service_order` | `service_item` | `service_part` | `special_record` | `parts_catalog`
- `operation`: `INSERT` | `UPDATE` | `DELETE`
- Maksimalno 100 stavki po batch-u

**Response 200:**
```json
{ "received": 3, "success": 3, "failed": 0, "errors": [] }
```

### 6.3 Autentifikacija

- **Desktop app → API sync:** `x-api-key` header sa plain-text ključem koji se poredi sa bcrypt hashom u tabeli `api_keys`
- **Web portal → API:** JWT Bearer token (za buduću Fazu 6)

### 6.4 Postavljanje API ključa u bazi

Po prvom deployu, unesi hash API ključa:

```bash
node -e "
const b = require('bcryptjs');
b.hash('tvoj_api_kljuc', 10).then(h => console.log(h));
"
```

Zatim u MySQL:
```sql
INSERT INTO api_keys (key_hash, description) VALUES ('<hash>', 'Desktop app - servis 1');
```

---

## 7. Build i deployment

### 7.1 Windows installer

```bash
cd desktop-app
npm run build
# Generiše: dist/ESB-Setup-x.x.x.exe
```

Konfiguracija: `desktop-app/electron-builder.config.js`

### 7.2 Deploy API na cPanel

#### Korak 1 — Priprema MySQL baze
1. cPanel → MySQL Databases → kreiraj bazu `kafanicars_esb` i korisnika
2. Dodaj korisnika na bazu sa svim privilegijama
3. cPanel → phpMyAdmin → izvrši `server-api/database/migrations/001_initial.sql`

#### Korak 2 — Upload fajlova
```
Uploadovati u /home/kafanicars/ESK/:
  app.js
  package.json
  src/
  database/
```
NE uploadovati: `node_modules/`, `.env`

#### Korak 3 — Instalacija zavisnosti na serveru
- cPanel → Node.js App → izaberi `/home/kafanicars/ESK/`
- Klikni **Run NPM Install**

#### Korak 4 — Env varijable
- cPanel → Node.js App → Environment Variables
- Unesi sve varijable iz `server-api/.env.example` sa pravim vrednostima

#### Korak 5 — Startup file i restart
- Startup file: `app.js`
- Klikni **Restart Application**
- Proveri: `curl https://kafanica-sa-dobrom-klopom.rs/ESK/health`

#### Korak 6 — Dodaj API ključ u bazu
Vidi sekciju 6.4 iznad.

**Passenger restart bez cPanel UI:** `touch /home/kafanicars/ESK/tmp/restart.txt`

#### Provjera logova
cPanel → Node.js App → klikni na aplikaciju → sekcija Logs

### 7.3 Deploy web portala na cPanel

```bash
cd web-portal
npm run build
# Sadržaj dist/ uploadovati u cPanel public_html/
```

---

## 8. Testiranje

*Popunjava se u Fazi 6.*

- E2E testovi: Playwright (`desktop-app/tests/e2e/`)
- Pokretanje: `npm run test:e2e`

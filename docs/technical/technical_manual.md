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

→ Detalji u: `.claude/project.md` — sekcija "Offline-first strategija"

Sync servis se nalazi u: `desktop-app/src/main/sync-service.js`

---

## 6. API dokumentacija

*Popunjava se u Fazi 5.*

### Endpoint-i (preview):

| Method | Ruta                          | Opis                              | Auth       |
|--------|-------------------------------|-----------------------------------|------------|
| POST   | /api/sync                     | Prijem batch izmena od desktop    | API Key    |
| GET    | /api/vehicles/:vin            | Podaci o vozilu po VIN-u          | -          |
| GET    | /api/service-orders/:vehicleId| Lista servisnih naloga za vozilo  | -          |
| GET    | /api/service-orders/:id       | Detalji jednog naloga             | -          |

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

1. Lokalno: pripremi fajlove
2. Upload u `/home/kafanicars/ESK/` (FTP ili cPanel File Manager)
3. NE uploadovati `node_modules/` — instaliraj na serveru:
   - cPanel → Node.js App → Run npm install
4. Postavi env varijable u cPanel Node.js App konfiguraciji
5. Set startup file: `app.js`
6. Klikni Restart

**Passenger restart trik:** `touch /home/kafanicars/ESK/tmp/restart.txt`

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

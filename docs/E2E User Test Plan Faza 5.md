E2E User Test Plan — Faza 5
⚠️ LOKALNO OKRUŽENJE: MySQL radi kroz XAMPP na portu 3307 (ne 3306).
Test 9 (cPanel deploy) se preskače dok MySQL ne bude na live serveru.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRIPREMA — server-api/.env (lokalno/XAMPP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
cd server-api && cp .env.example .env

Popuni u .env:
  DB_HOST=127.0.0.1
  DB_PORT=3307
  DB_USER=root
  DB_PASS=           ← ostavi prazno ako XAMPP root nema lozinku
  DB_NAME=esb_test   ← ili kako nazoveš bazu u phpMyAdmin
  JWT_SECRET=test-jwt-secret-dev
  API_KEY=test-key-123
  PORT=3000
  NODE_ENV=development
  CORS_ORIGIN=*

PRIPREMA — desktop-app/.env (lokalno testiranje)
  VITE_API_URL=http://localhost:3000/ESK
  VITE_API_KEY=test-key-123
  VITE_DESKTOP_ID=dev-desktop-01


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 1: API Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
npm install && npm run dev
curl http://localhost:3000/ESK/health → očekuje {"status":"ok","ts":"..."}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 2: MySQL šema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Otvori phpMyAdmin: http://localhost/phpmyadmin
  → Korisnik: root, Lozinka: (prazno ili tvoja XAMPP lozinka), Port: 3307
  → Kreiraj bazu: esb_test (utf8mb4_unicode_ci)
  → Import → izaberi: server-api/database/migrations/001_initial.sql → Go
Verifikuj da postoji 11 tabela (vehicles, owners, ownership_history,
  parts_catalog, service_orders, service_items, service_parts,
  special_records, sync_queue, sync_log, api_keys)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 3: API Key setup i autentifikacija
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generiši hash (iz server-api/ foldera):
  node -e "const b=require('bcryptjs');b.hash('test-key-123',10).then(h=>console.log(h))"

Unesi u bazu (phpMyAdmin → SQL tab):
  INSERT INTO api_keys (key_hash, description) VALUES ('<hash>', 'Test dev key');

Test — sa ključem:
  curl -X POST http://localhost:3000/ESK/api/sync \
    -H "x-api-key: test-key-123" \
    -H "Content-Type: application/json" \
    -d '{"desktop_id":"dev-desktop-01","items":[]}' \
  → očekuje {"error":"Batch je prazan..."}

Test — bez ključa:
  curl -X POST http://localhost:3000/ESK/api/sync \
    -H "Content-Type: application/json" \
    -d '{"desktop_id":"test","items":[]}' \
  → očekuje 401


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 4: Sync batch end-to-end
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pripremi payload sa jednim vozilom (INSERT):
curl -X POST http://localhost:3000/ESK/api/sync \
  -H "x-api-key: test-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "desktop_id": "dev-desktop-01",
    "items": [{
      "entity_type": "vehicle",
      "operation": "INSERT",
      "payload": {
        "vin": "WBA3A5G5XHNY33467",
        "make": "BMW",
        "model": "3 Series",
        "year": 2017,
        "license_plate": "BG001AA"
      }
    }]
  }'
→ očekuje {"success":true,"processed":1}

Verifikuj u phpMyAdmin: tabela vehicles → novi red sa VIN
Verifikuj u phpMyAdmin: tabela sync_log → novi red sa status='success'


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 5: GET /api/vehicles/:vin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Postoji vozilo (dodano u Test 4):
  curl http://localhost:3000/ESK/api/vehicles/WBA3A5G5XHNY33467
  → 200 sa {vehicle, owners}

Nepostojeći VIN:
  curl http://localhost:3000/ESK/api/vehicles/XXXXXXXXXXXXXXXXX
  → 404

VIN kraći od 17 karaktera:
  curl http://localhost:3000/ESK/api/vehicles/KRATKOVIN
  → 400


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 6: GET /api/service-orders/:vehicleId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vozilo sa ID 1 (od prethodnog testa):
  curl http://localhost:3000/ESK/api/service-orders/1
  → 200, array naloga sa items i parts (može biti prazan array [])

Nepostojeći vehicleId:
  curl http://localhost:3000/ESK/api/service-orders/9999
  → 200, prazan array []


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 7: Electron sync servis (desktop app)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Proveri da desktop-app/.env ima:
  VITE_API_URL=http://localhost:3000/ESK
  VITE_API_KEY=test-key-123

Pokreni desktop app:
  cd desktop-app && npm run dev

Kreiraj vozilo u aplikaciji → otvori SQLite (npr. DB Browser) →
  tabela sync_queue → novi red sa status='pending'

Pričekaj 10s (inicijalni delay) — API mora biti pokrenut (Test 1) →
  red treba da nestane, u MySQL tabeli vehicles pojavilo se vozilo

Isključi mrežu (ili zaustavi server-api) →
  kreiraj još vozilo → red ostaje pending, attempts=0

Uključi mrežu (ili pokreni server-api ponovo) →
  pričekaj do 5min → red se prazni automatski

DevTools konzola (Ctrl+Shift+I u Electron app):
  window.api.sync.getStatus() → {pending: 0, failed: 0, syncing: false}
  window.api.sync.trigger()   → manualni sync


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 8: Retry i failed logika
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
U desktop-app/.env postavi pogrešan URL:
  VITE_API_URL=http://localhost:9999/ESK   ← nepostojeći port

Restart desktop app → kreiraj vozilo
Pričekaj 5 sync ciklusa (5 × 5min ili ubrzo triggeruj manualno) →
  verifikuj da attempts raste (1, 2, 3, 4, 5) u sync_queue
Nakon 5 pokušaja: status = 'failed' u sync_queue

Vrati VITE_API_URL na http://localhost:3000/ESK za nastavak testiranja.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 9: cPanel deployment — ⛔ PRESKOČITI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MySQL baza još uvek nije na live serveru (kafanica-sa-dobrom-klopom.rs).
Ovaj test se izvršava kada bude ispunjen preduslov:
  ✅ MySQL baza kreirana na cPanel hosting-u
  ✅ server-api/.env popunjen sa cPanel kredencijalima
  ✅ Fajlovi uploadovani u /home/kafanicars/ESK/
  ✅ cPanel → Node.js App → Restart

Tada:
  curl https://kafanica-sa-dobrom-klopom.rs/ESK/health → 200


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Napomena — bcrypt hash za ključ '0Rto00p@risiEsk':
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$2b$10$RKylODfJTf3SumqnlQTjseiRK5OObO.HcRcSGDRltL1khQCRNiOl6
(koristiti za produkcijski api_keys INSERT kada bude spreman cPanel deploy)

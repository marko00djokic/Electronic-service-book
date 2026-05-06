E2E User Test Plan — Faza 5

Test 1: API Health Check
cd server-api && cp .env.example .env — popuni MySQL kredencijale
npm install && npm run dev
curl http://localhost:3000/ESK/health → očekuje {"status":"ok","ts":"..."}


Test 2: MySQL šema
Otvori phpMyAdmin ili MySQL klijent
Izvrši server-api/database/migrations/001_initial.sql
Verifikuj da postoji 11 tabela (uključujući sync_log, api_keys)


Test 3: API Key setup i autentifikacija
Generiši hash: node -e "const b=require('bcryptjs'); b.hash('test-key-123',10).then(h=>console.log(h))"
Unesi u bazu: INSERT INTO api_keys (key_hash, description) VALUES ('<hash>', 'Test')
curl -X POST http://localhost:3000/ESK/api/sync -H "x-api-key: test-key-123" -H "Content-Type: application/json" -d '{"desktop_id":"test","items":[]}' → očekuje {"error":"Batch je prazan..."}
Isti poziv bez headera → očekuje 401


Test 4: Sync batch end-to-end
Pripremi payload sa jednim vozilom (INSERT)
POST /ESK/api/sync sa validnim x-api-key
Verifikuj unos u MySQL tabeli vehicles
Verifikuj red u sync_log


Test 5: GET /api/vehicles/:vin
Kada ima vozilo u MySQL: GET /ESK/api/vehicles/WBA3A5G5XHNY33467 → 200 sa {vehicle, owners}
Nepostojeći VIN → 404
VIN kraći od 17 karaktera → 400


Test 6: GET /api/service-orders/:vehicleId
GET /ESK/api/service-orders/1 → 200, array naloga sa items i parts
Vozilo bez naloga → 200, prazan array


Test 7: Electron sync servis (desktop app)
Pokreni desktop app (npm run dev)
Kreiraj vozilo — proveri SQLite tabelu sync_queue (red sa status=pending)
Pričekaj 10s (inicijalni delay) — red treba da nestane ako je API dostupan
Isključi mrežu — kreiraj još vozilo — red ostaje pending
Uključi mrežu — pričekaj do 5min — red se prazni
U DevTools konzoli: window.api.sync.getStatus() → prikazuje {pending, failed, syncing}
window.api.sync.trigger() → manualni sync


Test 8: Retry i failed logika
Postavi pogrešan API URL u .env
Kreiraj podatak — verifikuj da attempts raste pri svakom sync-u
Nakon 5 pokušaja: status = 'failed' u sync_queue


Test 9: cPanel deployment
Upload app.js, package.json, src/, database/ u /home/kafanicars/ESK/
cPanel → Node.js App → Run NPM Install
Postavi env varijable, startup file = app.js, Restart
curl https://kafanica-sa-dobrom-klopom.rs/ESK/health → 200




┌──(Marko〇Kameleon)-[~/Documents/Github/Electronic-service-book] ─(   feature/phase-4-dashboard  ?8 ~7)
└─$  node -e "const b=require('bcryptjs');b.hash('0Rto00p@risiEsk',10).then(h=>console.log(h))"
$2b$10$RKylODfJTf3SumqnlQTjseiRK5OObO.HcRcSGDRltL1khQCRNiOl6







# Electronic Service Book (ESB) — Claude Onboarding

## QUICK START (čitaj ovo prvo)

Projekat se sastoji od tri dela:
1. **desktop-app/** — Electron + React + SQLite (offline, za servisera)
2. **server-api/** — Node.js + Express + MySQL (cPanel hosting)
3. **web-portal/** — React + Vite (read-only portal za vlasnike vozila)

### Pokretanje u razvoju:
```bash
# Desktop aplikacija
cd desktop-app && npm run dev

# API server
cd server-api && npm run dev

# Web portal
cd web-portal && npm run dev
```

### Server info:
- Hosting: cPanel (kafanica-sa-dobrom-klopom.rs)
- API folder na serveru: /home/kafanicars/ESK/
- API URL: kafanica-sa-dobrom-klopom.rs/ESK
- Process manager: Passenger (ugrađen u cPanel, NE PM2)
- Node.js verzija: 20.20.2

---

## TRENUTNI STATUS

→ Detalji u: `.claude/progress.md` — UVEK čitaj ovo pre nego što pitaš šta radimo

---

## ARHITEKTURA

→ Detalji u: `.claude/project.md`

```
[Desktop Electron App] ──sync──> [cPanel API /home/kafanicars/ESK/] <──> [MySQL]
                                              ^
                                     [Web Portal React]
                                              ^
                                    [Vlasnik automobila]
```

---

## AKTIVNI TASKOVI

→ Detalji u: `.claude/tasks.md`

---

## VAZNE KONVENCIJE

- Kod i nazivi fajlova/varijabli/funkcija: **engleski**
- Komentari u kodu i dokumentacija: **srpski**
- SQLite za lokalnu bazu (desktop-app), MySQL za cloud (server-api)
- Svaki novi model mora imati odgovarajuću migraciju
- Ne menjaj postojeće migracije — dodaj novu
- API rute su u `server-api/src/routes/`
- React komponente su u PascalCase, fajlovi u kebab-case
- Electron main process i renderer su strogo odvojeni (security)
- IPC komunikacija između main i renderer **ISKLJUČIVO kroz preload.js**

### Imenovanje:
- Tabele baze: `snake_case`, množina (`vehicles`, `service_orders`)
- Modeli: PascalCase (`Vehicle`, `ServiceOrder`)
- React komponente: PascalCase fajl (`VehicleList.jsx`)
- API rute: kebab-case (`/api/service-orders`)
- Varijable i funkcije: camelCase

---

## NE DIRAJ

- `.env` fajlovi — nikada ih ne commituj, koristi `.env.example` kao referencu
- Postojeće migracije baze — dodaj novu umesto menjanja
- `electron-builder.config.js` bez dogovora — utiče na build/installer
- `/home/kafanicars/nodevenv/` na serveru — cPanel virtual environment

---

## KRAJ SVAKE SESIJE — OBAVEZNO

Pre nego što završimo razgovor, uvek uradi:
1. Ažuriraj `.claude/progress.md` sa onim što je urađeno
2. Ažuriraj `.claude/tasks.md` — označi završene, dodaj nove
3. Napiši "✅ Context files ažurirani" kao poslednju poruku

---

## REFERENCE

- Glavni projektni dokument: `docs/Electronic-service-book.md`
- Tehnički manual: `docs/technical/technical_manual.md`
- Korisnički manual: `docs/user/user_manual.md`
- Arhitekturne odluke: `.claude/decisions.md`

# Progress Log

## Poslednja sesija: 2026-05-03

### Šta je urađeno:
- Kreirana kompletna projektna dokumentacija i context fajlovi
- Definisan plan razvoja u 6 faza u docs/Electronic-service-book.md
- Definisan tech stack i arhitektura sistema
- Kreirani svi context fajlovi: CLAUDE.md, project.md, tasks.md, decisions.md
- Kreirani skeleton fajlovi: technical_manual.md, user_manual.md
- Kreirana kompletna folder struktura projekta

### Trenutno stanje koda:

| Komponenta                  | Status         |
|-----------------------------|----------------|
| Projektna dokumentacija     | ✅ Završena    |
| Desktop app setup           | ❌ Nije početo |
| SQLite šema + migracije     | ❌ Nije početo |
| Vozila CRUD                 | ❌ Nije početo |
| Vlasnici CRUD               | ❌ Nije početo |
| Servisni nalozi             | ❌ Nije početo |
| Katalog delova/usluga       | ❌ Nije početo |
| PDF export                  | ❌ Nije početo |
| Dashboard + podsetnici      | ❌ Nije početo |
| Cloud API (Express)         | ❌ Nije početo |
| MySQL šema                  | ❌ Nije početo |
| Sync mehanizam              | ❌ Nije početo |
| Web portal                  | ❌ Nije početo |
| Windows installer           | ❌ Nije početo |

### Poslednji fajlovi koje smo dirali:
- CLAUDE.md
- .claude/project.md
- .claude/progress.md
- .claude/tasks.md
- .claude/decisions.md
- docs/Electronic-service-book.md
- docs/technical/technical_manual.md
- docs/user/user_manual.md

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
`docs/Electronic-service-book.md` → FAZA 1 PROMPT

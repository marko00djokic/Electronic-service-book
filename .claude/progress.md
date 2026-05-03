# Progress Log

## Sesija: 2026-05-04 — Faza 1 završena

### Šta je urađeno:
- Faza 1 kompletno implementirana na branch `feature/phase-1-setup`
- electron-vite boilerplate sa React 18 i React Router 6 (HashRouter)
- TailwindCSS 3 konfigurisan i kompajlira se ispravno (13.62 kB CSS output)
- SQLite baza: migration runner sistem sa transakcijama
- Inicijalna migracija 001_initial.js — sve tabele kreirane (9 tabela)
- Electron main/preload/renderer arhitektura — contextIsolation, IPC ping
- Layout: Sidebar (6 nav linkova, aktivan state) + TopBar + Outlet
- 6 placeholder stranica za sve module
- electron-builder NSIS config za Windows installer
- `electron-vite build` prošao bez grešaka ✅

### Trenutno stanje koda:

| Komponenta                  | Status              |
|-----------------------------|---------------------|
| Projektna dokumentacija     | ✅ Završena         |
| Desktop app setup           | ✅ Faza 1 završena  |
| SQLite šema + migracije     | ✅ DDL kreiran      |
| Vozila CRUD                 | ❌ Nije početo      |
| Vlasnici CRUD               | ❌ Nije početo      |
| Servisni nalozi             | ❌ Nije početo      |
| Katalog delova/usluga       | ❌ Nije početo      |
| PDF export                  | ❌ Nije početo      |
| Dashboard + podsetnici      | ❌ Nije početo      |
| Cloud API (Express)         | ❌ Nije početo      |
| MySQL šema                  | ❌ Nije početo      |
| Sync mehanizam              | ❌ Nije početo      |
| Web portal                  | ❌ Nije početo      |
| Windows installer           | ⚠️ Config kreiran, build nije testiran |

### Git stanje:
- Branch: `feature/phase-1-setup` (worktree: `.worktrees/phase-1-setup/`)
- 8 commitova na branch-u (od `6c6f892` do `75535d7`)
- Merge u `main2` pending (nakon verifikacije)

### Poznati problemi / Tech debt:
- `better-sqlite3` native modul nije kompajliran — mašina ima VS 2025 Preview
  (verzija 18, node-gyp podržava do VS 2022 / verzija 17)
  **Fix:** Instaliraj VS 2022 Community sa "Desktop development with C++" workload,
  pa pokreni: `cd desktop-app && npm run postinstall`
- `npm run dev` neće raditi dok better-sqlite3 nije kompajliran (main process crasha
  pri `initDatabase()` pozivu). Renderer dio (React UI) je ispravan.

### Serverska infrastruktura (potvrđeno):
- Node.js v20.20.2 ✅
- npm v11.13.0 ✅
- PM2 v7.0.1 ✅ (instaliran, ali koristimo Passenger)
- Passenger ✅ (ugrađen u cPanel, brine o auto-restartu)
- MySQL ✅ (dostupan kroz cPanel)
- API folder: /home/kafanicars/ESK/ ✅
- Startup file: app.js ✅

### Sledeća sesija treba da počne sa:
Faza 2 — Vozila i Vlasnici CRUD.
Prompt za ovu fazu: `docs/Electronic-service-book.md` → FAZA 2 PROMPT
PRE TOGA: Resolvi better-sqlite3 compile problem (VS 2022 build tools)

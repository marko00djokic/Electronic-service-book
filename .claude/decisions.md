# Architecture Decision Records (ADR)

---

## ADR-001: Electron umesto web-only aplikacije

**Datum:** 2026-05-03
**Status:** Prihvaćeno

**Kontekst:**
Aplikacija mora da radi offline na računaru servisera bez interneta, sa lokalnom bazom podataka.
Serviseri u manjim radionicama često nemaju stabilan internet, a rad ne sme da stane.

**Odluka:**
Koristimo Electron koji omogućava desktop app sa Node.js backendom i SQLite bazom, a React za UI.

**Posledice:**
- Aplikacija radi potpuno offline
- Potreban je build/installer proces za distribuciju (electron-builder → .exe)
- Sync sa cloudom je opcioni dodatak, ne uslov za rad
- Korisnici moraju da instaliraju aplikaciju (nije web)

---

## ADR-002: SQLite za lokalnu bazu, MySQL za cloud

**Datum:** 2026-05-03
**Status:** Prihvaćeno

**Kontekst:**
Desktop app mora da radi bez interneta (lokalna baza), ali i da sinhronizuje podatke sa cloud
serverom (MySQL na cPanel-u) kako bi web portal mogao da prikazuje podatke.

**Odluka:**
SQLite (better-sqlite3) u desktop app, MySQL na cloud serveru.
Ista logička šema, različite implementacije. Desktop je uvek master za podatke.

**Posledice:**
- Potreban je sync mehanizam (tabela sync_queue)
- Migracije se vode odvojeno za obe baze
- better-sqlite3 je sinhron driver — idealan za Electron main process (nema callback/Promise overhead)
- MySQL na cPanel-u je jedina dostupna opcija bez posebne serverske konfiguracije

---

## ADR-003: Passenger umesto PM2 za cPanel

**Datum:** 2026-05-03
**Status:** Prihvaćeno

**Kontekst:**
cPanel shared hosting ne podržava systemd, pa `pm2 startup` komanda ne funkcioniše.
PM2 se može koristiti za pokretanje, ali se ne može konfigurisati kao system service.

**Odluka:**
Koristimo Passenger kao process manager za Node.js API na serveru.
App entry point je `app.js`, Passenger ga automatski startuje i restartuje kada server radi.

**Posledice:**
- Ne koristimo PM2 u produkciji (instaliran je, ali samo za ručno pokretanje u emergenciji)
- Restart aplikacije se radi kroz cPanel Node.js interfejs (dugme Restart) ili touch `app.js`
- `app.js` mora da exportuje Express app (ne da je sam poziva na port) kada Passenger to zahteva
- Folder virtuelnog okruženja `/home/kafanicars/nodevenv/` ne dirajmo — cPanel ga kreira i održava

---

## ADR-004: Offline-first arhitektura sa sync queue

**Datum:** 2026-05-03
**Status:** Prihvaćeno

**Kontekst:**
Serviseri moraju da rade i bez interneta. Sync sa cloudom je poželjan ali ne i obavezan u
svakom trenutku. Cloud je replika desktop baze, ne nezavisna baza.

**Odluka:**
Sve operacije se uvek zapisuju u lokalnu SQLite bazu. Svaka promena se dodaje u `sync_queue`
tabelu. Kada je internet dostupan, sync servis u pozadini šalje promene na cloud API i briše
ih iz queue-a.

**Posledice:**
- Korisnici web portala vide podatke sa određenim kašnjenjem (od poslednjeg sync-a)
- Conflict resolution nije potrebna — desktop je uvek master
- Sync queue može da poraste ako nema interneta duži period (bezazleno, SQLite ga drži)
- Ako sync fail-uje 5 puta za isti entitet, označava se kao `failed` i ne pokušava više automatski

---

## ADR-005: Web portal je read-only bez korisničkih naloga

**Datum:** 2026-05-03
**Status:** Prihvaćeno

**Kontekst:**
Vlasnici automobila treba da vide servisnu istoriju svog vozila, ali ne smeju da menjaju
podatke — to je isključivo pravo servisera. Registracija korisnika bi komplikovala sistem.

**Odluka:**
Web portal je potpuno read-only. Nema registracije korisnika (vlasnika). Pretraga se vrši po
VIN broju ili registarskom broju — javno dostupno bez prijave.

**Posledice:**
- Jednostavniji backend (nema user management-a za vlasnike)
- Svako ko zna VIN broj vozila može da vidi njegovu servisnu istoriju (svesna odluka — VIN je
  inače dostupan na tablicama i u dokumentima vozila)
- Rate limiting na API-ju je važan za zaštitu od masovnog scrapinga
- JWT se koristi samo interno (desktop app ↔ API), ne za krajnje korisnike

---

## ADR-006: Šest faza razvoja

**Datum:** 2026-05-03
**Status:** Prihvaćeno

**Kontekst:**
Projekat je kompleksan (desktop app + API + web portal). Potrebna je granularna podela koja
omogućava testiranje i isporuku u koracima, sa jasnim "šta je gotovo" na kraju svake faze.

**Odluka:**
6 faza: Setup → Vozila/Vlasnici → Servisni nalozi → Dashboard → Cloud sync → Web portal + Polish.
Svaka faza ima gotov prompt za Claude Code agenta.

**Posledice:**
- Nakon svake faze postoji funkcionalan i testabilan deliverable
- Cloud funkcionalnost dolazi tek u Fazi 5 — prvih 4 faze idu brzo bez serverskih zavisnosti
- Agent koji radi Fazu N mora da pročita context fajlove pre početka
- Na kraju svake faze obavezno se ažuriraju progress.md i tasks.md

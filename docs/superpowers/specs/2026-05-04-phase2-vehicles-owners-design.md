# Faza 2 — Upravljanje vozilima i vlasnicima: Design Spec

**Datum:** 2026-05-04  
**Status:** Odobreno  
**Scope:** Desktop Electron app (desktop-app/) — React renderer + main process

---

## Kontekst

Faza 1 je završena: Electron + React + SQLite boilerplate je operativan, sve tabele su kreirane u `001_initial.js`. Faza 2 dodaje kompletan CRUD za vozila i vlasnike, sa istorijom vlasništva.

---

## Arhitektura i struktura fajlova

### Novi fajlovi

```
desktop-app/src/main/
  models/
    vehicle.js
    owner.js
    ownershipHistory.js
  ipc/
    vehicles-ipc.js
    owners-ipc.js

desktop-app/src/renderer/src/
  pages/
    vehicles/
      VehicleList.jsx
      VehicleForm.jsx
      VehicleDetail.jsx
    owners/
      OwnerList.jsx
      OwnerForm.jsx
      OwnerDetail.jsx
```

### Izmenjeni fajlovi

```
desktop-app/src/main/ipc/index.js   — registracija novih handlera
desktop-app/src/preload/index.js    — window.api.vehicles, .owners, .ownership
desktop-app/src/renderer/src/App.jsx — nove rute
```

### Napomena o migracijama

Tabele `vehicles`, `owners`, `ownership_history` su već kreirane u `001_initial.js`. Nema potrebe za novim migracionim fajlovima za ovu fazu. **Buduće migracije idu u `desktop-app/database/migrations/`** (ne u `src/main/migrations/`).

---

## Data modeli (main process)

### vehicle.js

| Funkcija | Opis |
|----------|------|
| `getAll()` | Sva vozila sa trenutnim vlasnikom (LEFT JOIN ownership_history ON vehicle_id=id AND end_date IS NULL) |
| `getById(id)` | Jedno vozilo po ID |
| `create(data)` | INSERT, vraća `{ id, ...data }` |
| `update(id, data)` | UPDATE + `updated_at = datetime('now')` |
| `delete(id)` | DELETE vozila i vezanih ownership_history redova |
| `search(query)` | Filtrira po `vin`, `make`, `model`, `license_plate` (LIKE '%query%') |

### owner.js

| Funkcija | Opis |
|----------|------|
| `getAll()` | Svi vlasnici |
| `getById(id)` | Jedan vlasnik |
| `create(data)` | INSERT |
| `update(id, data)` | UPDATE + `updated_at` |
| `delete(id)` | DELETE — odbija ako vlasnik ima aktivna vozila (end_date IS NULL) |
| `search(query)` | Filtrira po `first_name`, `last_name`, `phone` |

### ownershipHistory.js

| Funkcija | Opis |
|----------|------|
| `getByVehicle(vehicleId)` | Hronološka lista vlasnika vozila (ORDER BY start_date DESC) |
| `getByOwner(ownerId)` | Lista vozila vlasnika |
| `addOwner(vehicleId, ownerId, startDate)` | Zatvara prethodni zapis (end_date = startDate), kreira novi |

---

## IPC sloj

### Kanali

```
vehicles:getAll        → vehicle.getAll()
vehicles:getById       → vehicle.getById(id)
vehicles:create        → vehicle.create(data)
vehicles:update        → vehicle.update(id, data)
vehicles:delete        → vehicle.delete(id)
vehicles:search        → vehicle.search(query)

owners:getAll          → owner.getAll()
owners:getById         → owner.getById(id)
owners:create          → owner.create(data)
owners:update          → owner.update(id, data)
owners:delete          → owner.delete(id)
owners:search          → owner.search(query)

ownershipHistory:getByVehicle  → ownershipHistory.getByVehicle(vehicleId)
ownershipHistory:getByOwner    → ownershipHistory.getByOwner(ownerId)
ownershipHistory:addOwner      → ownershipHistory.addOwner(vehicleId, ownerId, startDate)
```

### Preload (window.api)

```js
window.api.vehicles  = { getAll, getById, create, update, remove, search }
window.api.owners    = { getAll, getById, create, update, remove, search }
window.api.ownership = { getByVehicle, addOwner, getByOwner }
```

Napomena: koristimo `remove` umesto `delete` — `delete` je rezervisana reč u JS-u i ne može biti property name pozvan kao metod.

---

## React stranice i rutiranje

### Pristup: Zasebne stranice sa React Router v6 rutama

```
/vehicles              → VehicleList
/vehicles/new          → VehicleForm (mode: create)
/vehicles/:id          → VehicleDetail
/vehicles/:id/edit     → VehicleForm (mode: edit)

/owners                → OwnerList
/owners/new            → OwnerForm (mode: create)
/owners/:id            → OwnerDetail
/owners/:id/edit       → OwnerForm (mode: edit)
```

### Ponašanje stranica

**VehicleList**
- Tabela: Marka/Model, VIN, Registracija, Godište, Trenutni vlasnik
- Search bar — filtrira pozivom `window.api.vehicles.search(query)`
- "Novo vozilo" dugme → navigate('/vehicles/new')
- Klik na red → navigate('/vehicles/:id')
- Edit ikona → navigate('/vehicles/:id/edit')
- Delete ikona → confirm dialog, pa `window.api.vehicles.delete(id)`, refresh liste

**VehicleForm**
- Ista komponenta za create i edit (detektuje `:id` iz `useParams`)
- Pri edit: učitava podatke sa `getById(id)`, popunjava forme
- Na save → navigate('/vehicles/:id')
- Na cancel → navigate(-1)

**VehicleDetail**
- Prikazuje sve kolone vozila
- Tabela istorije vlasništva (vlasnik, od, do)
- "Dodaj vlasnika" — inline forma: select vlasnika iz liste + datum početka
- Edit dugme → navigate('/vehicles/:id/edit')
- Delete dugme → confirm, delete, navigate('/vehicles')

**OwnerList / OwnerForm / OwnerDetail** — isti pattern kao vehicles.

**OwnerDetail** dodatno prikazuje listu vozila vlasnika (iz `ownership.getByOwner`).

---

## Validacije

### VIN
```
Regex: /^[A-HJ-NPR-Z0-9]{17}$/i
- Tačno 17 karaktera
- Dozvoljeni: A-Z, 0-9
- Zabranjeni: I, O, Q (ISO 3779)
- Čuva se uppercase
```

### Telefon (opciono polje)
```
Regex: /^(\+381|06)\d{7,9}$/
- +381XXXXXXXXX ili 06XXXXXXXX
- Validira se samo ako je polje popunjeno
```

### Obavezna polja

| Entitet | Obavezna polja |
|---------|----------------|
| Vozilo | `vin`, `make`, `model`, `year` |
| Vlasnik | `first_name`, `last_name` |
| Vlasništvo | `owner_id`, `start_date` |

### UI feedback
- Crveni border + poruka ispod fielda pri grešci
- "Sačuvaj" dugme disabled dok postoje validacione greške
- Validacija se okida `onBlur` (ne `onChange`)

---

## Greške i edge cases

- **Delete vozila sa istorijom:** Kaskadni DELETE na `ownership_history`
- **Delete vlasnika sa aktivnim vozilom:** Odbija se sa porukom "Vlasnik ima aktivno vozilo"
- **IPC greške:** `try/catch` u svakom handleru, vraća `{ error: message }` umesto throw
- **Prazna lista:** Prikazuje placeholder poruku umesto prazne tabele

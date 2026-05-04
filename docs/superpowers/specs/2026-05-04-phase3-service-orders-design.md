# Faza 3 — Servisni nalozi, katalog i PDF export

**Datum:** 2026-05-04  
**Grana:** `feature/phase-3-service-orders`  
**Status:** Odobreno, spreman za implementaciju

---

## Scope

Implementacija kompletnog toka servisnog naloga u desktop Electron aplikaciji:
- CRUD za servisne naloge sa stavkama (radovi + delovi)
- Katalog delova/usluga sa autocomplete podrškom u formama
- Specijalne evidencije po tipu (gume, kočnice, OBD, kaiš, klima, elektrika)
- PDF export — servisna knjižica vozila i pojedinačni nalog

---

## 1. Migracije

Sve potrebne tabele su **već kreirane** u `src/main/migrations/001_initial.js`:
- `parts_catalog`
- `service_orders`
- `service_items`
- `service_parts`
- `special_records`

Novi migracioni fajlovi **nisu potrebni**. `database.js` se ne menja.

---

## 2. Backend — Modeli

Lokacija: `src/main/models/`

### `serviceOrder.js`
- `getAll()` — sve naloge, JOIN sa vehicles i owners
- `getById(id)` — jedan nalog
- `getByVehicle(vehicleId)` — svi nalozi za vozilo
- `create(data)` — auto-generiše `order_number` formata `SO-{YYYY}-{0001}`
- `update(id, data)` — ažurira nalog, recalculate totals
- `remove(id)` — briše nalog i sve stavke u transakciji
- `generateOrderNumber()` — interni helper: `SO-{godina}-{padStart(4,'0')}`

### `serviceItem.js`
- `getByOrder(orderId)`
- `create(orderId, data)` — `total = hours * hourly_rate`
- `update(id, data)`
- `remove(id)`

### `servicePart.js`
- `getByOrder(orderId)`
- `create(orderId, data)` — `total = quantity * unit_price`
- `update(id, data)`
- `remove(id)`

### `specialRecord.js`
- `getByVehicle(vehicleId)`
- `getByType(vehicleId, type)`
- `create(data)` — `data.data` je JSON.stringify blob
- `update(id, data)`

### `partsCatalog.js`
- `getAll()`
- `search(query)` — LIKE po name i oem_number
- `create(data)`
- `update(id, data)`
- `remove(id)`

---

## 3. Backend — IPC Handleri

Lokacija: `src/main/ipc/`

### `service-orders-ipc.js`
Kanali: `serviceOrders:getAll`, `serviceOrders:getById`, `serviceOrders:getByVehicle`,
`serviceOrders:create`, `serviceOrders:update`, `serviceOrders:remove`,
`serviceItems:getByOrder`, `serviceItems:create`, `serviceItems:update`, `serviceItems:remove`,
`serviceParts:getByOrder`, `serviceParts:create`, `serviceParts:update`, `serviceParts:remove`

### `parts-catalog-ipc.js`
Kanali: `catalog:getAll`, `catalog:search`, `catalog:create`, `catalog:update`, `catalog:remove`

### `special-records-ipc.js`
Kanali: `specialRecords:getByVehicle`, `specialRecords:getByType`, `specialRecords:create`, `specialRecords:update`

### `pdf-ipc.js`
Kanali: `pdf:serviceBook(vehicleId)`, `pdf:order(orderId)`  
Flow: generiši PDF → `dialog.showSaveDialog` → `fs.writeFileSync`

Registracija u `ipc/index.js`.

---

## 4. Preload API

Proširenje `src/preload/index.js`:

```js
window.api.serviceOrders = {
  getAll, getById, getByVehicle, create, update, remove
}
window.api.serviceItems = { getByOrder, create, update, remove }
window.api.serviceParts = { getByOrder, create, update, remove }
window.api.specialRecords = { getByVehicle, getByType, create, update }
window.api.catalog = { getAll, search, create, update, remove }
window.api.pdf = { serviceBook, order }
```

---

## 5. Frontend — React Stranice

### `pages/service-orders/ServiceOrderList.jsx`
- Tabela sa kolonama: broj naloga, vozilo, datum, km, tip, total, status (badge)
- Filteri: status (open/closed), tekstualna pretraga
- Akcije po redu: Detalji, Izmeni, Obriši
- Pattern identičan VehicleList

### `pages/service-orders/ServiceOrderForm.jsx`
Forma sa 5 tabova, sav state drži se lokalno u komponenti, čuva se kao celina:

| Tab | Naziv | Sadržaj |
|-----|-------|---------|
| 1 | Osnovno | Select vozila (pretraga), vlasnik (auto), datum, km, tip servisa, faktura |
| 2 | Radovi | Tabela: naziv (react-select iz kataloga), sati, cena/h, total (auto) |
| 3 | Delovi | Tabela: naziv (react-select), OEM, kat., kol., jed., cena, total (auto) |
| 4 | Finansije | Read-only: zbir radova, delovi, materijali, PDV %, ukupno |
| 5 | Preporuke | Napomene servisera, preporuke, sledeći servis (datum + km) |

### `pages/service-orders/ServiceOrderDetail.jsx`
- Read-only prikaz svih sekcija
- Dugmad: Izmeni, Štampaj PDF naloga

### `pages/catalog/PartsCatalog.jsx`
- Tabela sa pretragom
- Inline dodavanje/editovanje reda (naziv, OEM, kategorija, jedinica, cena)

### `pages/service-orders/SpecialRecords.jsx`
- Otvara se sa VehicleDetail (`/vehicles/:id/special`)
- Lista evidencija grupisana po tipu
- Dinamička forma za dodavanje (polja zavise od odabranog tipa)

---

## 6. Routing (App.jsx)

```
/service-orders             → ServiceOrderList
/service-orders/new         → ServiceOrderForm
/service-orders/:id         → ServiceOrderDetail
/service-orders/:id/edit    → ServiceOrderForm
/catalog                    → PartsCatalog
/vehicles/:id/special       → SpecialRecords
```

---

## 7. PDF Export

Lokacija: `src/main/pdf/pdfGenerator.js`

### `generateServiceBookPdf(vehicleId)`
1. Naslovna strana — podaci o vozilu (marka, model, VIN, reg., godište, motor), trenutni vlasnik
2. Tabela svih naloga — broj naloga | datum | km | tip | sažetak radova | total
3. Posebne evidencije po tipu — svaki tip kao zasebna sekcija

### `generateOrderPdf(orderId)`
1. Zaglavlje — broj naloga, datum, vozilo, vlasnik, km
2. Tabela radova — naziv, sati, cena/h, total
3. Tabela delova — naziv, OEM, kol., jed., cena, total
4. Finansijski sumar — radovi + delovi + materijali + PDV + **UKUPNO**
5. Napomene, preporuke, sledeći servis

**Biblioteka:** jsPDF (`npm install jspdf`), koristi se isključivo u main procesu.

---

## 8. Specijalne evidencije — JSON struktura

```json
// tires
{ "dimension": "205/55R16", "type": "letnje", "brand": "Michelin", "dot": "2423", "position": "sve 4" }

// brakes
{ "axle": "prednja", "pad_thickness_mm": 8, "disc_thickness_mm": 22, "note": "" }

// obd
{ "code": "P0301", "description": "Misfire cilindar 1", "status": "obrisan" }

// timing_belt
{ "type": "kaiš", "replaced_at_km": 120000, "next_at_km": 240000 }

// ac_service
{ "refrigerant": "R134a", "amount_g": 550, "pressure_bar": 14 }

// electrical
{ "system": "alternator", "voltage_v": 14.2, "amps": 80, "note": "" }
```

---

## 9. Zavisnosti koje treba instalirati

```bash
cd desktop-app
npm install jspdf react-select
```

---

## 10. Verifikacija (Definition of Done)

- [ ] Kreiranje servisnog naloga od a do z prolazi (svi tabovi, čuvanje)
- [ ] Autocomplete iz kataloga radi u tabovima 2 i 3
- [ ] Finansije se automatski izračunavaju (Tab 4)
- [ ] PDF servisne knjižice se generiše i čuva na disk
- [ ] PDF pojedinačnog naloga se generiše i čuva na disk
- [ ] Specijalne evidencije se dodaju i prikazuju po tipu
- [ ] Katalog — CRUD radi (dodavanje, izmena, brisanje, pretraga)

import { _electron as electron } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Pokreće Electron aplikaciju iz build outputa.
 * Preduslov: `npm run build` mora biti pokrenut pre testova.
 */
export async function launchApp() {
  const app = await electron.launch({
    args: [path.join(__dirname, '../out/main/index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  })
  const window = await app.firstWindow()
  await window.waitForLoadState('domcontentloaded')
  // Čeka da se SQLite inicijalizuje (IPC ping)
  await window.waitForFunction(() => typeof window.api !== 'undefined', null, { timeout: 10000 })
  return { app, window }
}

/** Navigacija putem hash rutera */
export async function navigate(window, hash) {
  await window.evaluate((h) => { window.location.hash = h }, hash)
  await window.waitForTimeout(300)
}

/** Kreira vozilo direktno kroz window.api (zaobilazi UI za setup) */
export async function createVehicle(window, data = {}) {
  return window.evaluate(async (d) => {
    return window.api.vehicles.create({
      vin: d.vin || `TESTVIN${Date.now()}`.slice(0, 17),
      make: d.make || 'TestMake',
      model: d.model || 'TestModel',
      year: d.year || 2020,
      license_plate: d.license_plate || 'NS-TEST-01',
      engine_type: 'benzin',
    })
  }, data)
}

/** Kreira vlasnika direktno kroz window.api */
export async function createOwner(window, data = {}) {
  return window.evaluate(async (d) => {
    return window.api.owners.create({
      first_name: d.first_name || 'Test',
      last_name: d.last_name || 'Vlasnik',
      phone: d.phone || '0601234567',
    })
  }, data)
}

/** Kreira katalog stavku direktno kroz window.api */
export async function createCatalogItem(window, data = {}) {
  return window.evaluate(async (d) => {
    return window.api.catalog.create({
      name: d.name || 'Test usluga',
      category: d.category || 'labor',
      unit: d.unit || 'h',
      price: d.price || 2000,
    })
  }, data)
}

/** Briše sva vozila sa VIN prefiksom TEST (cleanup) */
export async function cleanupTestData(window) {
  await window.evaluate(async () => {
    const vehicles = await window.api.vehicles.getAll()
    for (const v of vehicles) {
      if (v.vin && v.vin.startsWith('TESTVIN')) {
        await window.api.vehicles.remove(v.id)
      }
    }
    const catalog = await window.api.catalog.getAll()
    for (const c of catalog) {
      if (c.name && c.name.startsWith('E2E-')) {
        await window.api.catalog.remove(c.id)
      }
    }
  })
}

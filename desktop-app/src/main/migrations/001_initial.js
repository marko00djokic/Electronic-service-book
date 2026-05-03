// Inicijalna migracija: kreira sve tabele prazne (bez podataka)
export function migration001(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vin TEXT UNIQUE NOT NULL,
      license_plate TEXT,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      engine_type TEXT,
      engine_displacement INTEGER,
      engine_power INTEGER,
      color TEXT,
      first_registration_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ownership_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
      owner_id INTEGER NOT NULL REFERENCES owners(id),
      start_date TEXT NOT NULL,
      end_date TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS parts_catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      oem_number TEXT,
      category TEXT,
      unit TEXT,
      price REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
      owner_id INTEGER REFERENCES owners(id),
      order_number TEXT UNIQUE,
      reception_date TEXT NOT NULL,
      mileage_in INTEGER,
      service_type TEXT NOT NULL,
      labor_cost REAL DEFAULT 0,
      parts_cost REAL DEFAULT 0,
      materials_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      vat_rate REAL DEFAULT 20,
      invoice_number TEXT,
      technician_notes TEXT,
      recommendations TEXT,
      next_service_date TEXT,
      next_service_mileage INTEGER,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS service_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES service_orders(id),
      name TEXT NOT NULL,
      hours REAL DEFAULT 0,
      hourly_rate REAL DEFAULT 0,
      total REAL DEFAULT 0,
      catalog_id INTEGER REFERENCES parts_catalog(id)
    );

    CREATE TABLE IF NOT EXISTS service_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES service_orders(id),
      name TEXT NOT NULL,
      oem_number TEXT,
      category TEXT DEFAULT 'part',
      quantity REAL DEFAULT 1,
      unit TEXT DEFAULT 'kom',
      unit_price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      catalog_id INTEGER REFERENCES parts_catalog(id)
    );

    CREATE TABLE IF NOT EXISTS special_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
      order_id INTEGER REFERENCES service_orders(id),
      record_type TEXT NOT NULL,
      data TEXT NOT NULL,
      record_date TEXT NOT NULL,
      mileage INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      attempts INTEGER DEFAULT 0,
      last_attempt_at TEXT,
      status TEXT DEFAULT 'pending'
    );
  `)
}

-- ESB MySQL šema — inicijalna migracija
-- Pokreni jednom pri postavljanju baze na cPanel

CREATE TABLE IF NOT EXISTS vehicles (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vin                   VARCHAR(17) NOT NULL UNIQUE,
  license_plate         VARCHAR(20),
  make                  VARCHAR(100) NOT NULL,
  model                 VARCHAR(100) NOT NULL,
  year                  SMALLINT UNSIGNED NOT NULL,
  engine_type           VARCHAR(50),
  engine_displacement   SMALLINT UNSIGNED,
  engine_power          SMALLINT UNSIGNED,
  color                 VARCHAR(50),
  first_registration_date DATE,
  notes                 TEXT,
  created_at            DATETIME DEFAULT NOW(),
  updated_at            DATETIME DEFAULT NOW() ON UPDATE NOW(),
  synced_at             DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS owners (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL,
  phone       VARCHAR(30),
  email       VARCHAR(150),
  address     TEXT,
  city        VARCHAR(100),
  created_at  DATETIME DEFAULT NOW(),
  updated_at  DATETIME DEFAULT NOW() ON UPDATE NOW(),
  synced_at   DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ownership_history (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id  BIGINT UNSIGNED NOT NULL,
  owner_id    BIGINT UNSIGNED NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE,
  notes       TEXT,
  synced_at   DATETIME,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id)   REFERENCES owners(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS parts_catalog (
  id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(200) NOT NULL,
  oem_number VARCHAR(100),
  category  VARCHAR(50),
  unit      VARCHAR(20),
  price     DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes     TEXT,
  created_at DATETIME DEFAULT NOW(),
  synced_at  DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS service_orders (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id            BIGINT UNSIGNED NOT NULL,
  owner_id              BIGINT UNSIGNED,
  order_number          VARCHAR(50) UNIQUE,
  reception_date        DATE NOT NULL,
  mileage_in            INT UNSIGNED,
  service_type          VARCHAR(50) NOT NULL,
  labor_cost            DECIMAL(10,2) DEFAULT 0,
  parts_cost            DECIMAL(10,2) DEFAULT 0,
  materials_cost        DECIMAL(10,2) DEFAULT 0,
  total_cost            DECIMAL(10,2) DEFAULT 0,
  vat_rate              DECIMAL(5,2) DEFAULT 20,
  invoice_number        VARCHAR(50),
  technician_notes      TEXT,
  recommendations       TEXT,
  next_service_date     DATE,
  next_service_mileage  INT UNSIGNED,
  status                VARCHAR(20) DEFAULT 'open',
  created_at            DATETIME DEFAULT NOW(),
  updated_at            DATETIME DEFAULT NOW() ON UPDATE NOW(),
  synced_at             DATETIME,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id)   REFERENCES owners(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS service_items (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(200) NOT NULL,
  hours       DECIMAL(8,2) DEFAULT 0,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  total       DECIMAL(10,2) DEFAULT 0,
  catalog_id  BIGINT UNSIGNED,
  synced_at   DATETIME,
  FOREIGN KEY (order_id)   REFERENCES service_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (catalog_id) REFERENCES parts_catalog(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS service_parts (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(200) NOT NULL,
  oem_number  VARCHAR(100),
  category    VARCHAR(20) DEFAULT 'part',
  quantity    DECIMAL(8,3) DEFAULT 1,
  unit        VARCHAR(20) DEFAULT 'kom',
  unit_price  DECIMAL(10,2) DEFAULT 0,
  total       DECIMAL(10,2) DEFAULT 0,
  catalog_id  BIGINT UNSIGNED,
  synced_at   DATETIME,
  FOREIGN KEY (order_id)   REFERENCES service_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (catalog_id) REFERENCES parts_catalog(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS special_records (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id  BIGINT UNSIGNED NOT NULL,
  order_id    BIGINT UNSIGNED,
  record_type VARCHAR(50) NOT NULL,
  data        JSON NOT NULL,
  record_date DATE NOT NULL,
  mileage     INT UNSIGNED,
  notes       TEXT,
  created_at  DATETIME DEFAULT NOW(),
  synced_at   DATETIME,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)       ON DELETE CASCADE,
  FOREIGN KEY (order_id)   REFERENCES service_orders(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Log sinhronizacije
CREATE TABLE IF NOT EXISTS sync_log (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  received_at DATETIME NOT NULL,
  desktop_id  VARCHAR(100),
  batch_size  INT UNSIGNED,
  status      VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- API ključevi za desktop aplikacije
CREATE TABLE IF NOT EXISTS api_keys (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  key_hash    VARCHAR(255) NOT NULL,
  description VARCHAR(200),
  created_at  DATETIME DEFAULT NOW(),
  last_used_at DATETIME,
  is_active   TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS store_factories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_license_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  factory_json TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  review_note TEXT,
  reviewed_at INTEGER,
  reviewed_by TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_license_id) REFERENCES licenses(id)
);

CREATE INDEX IF NOT EXISTS idx_store_factories_status_updated
  ON store_factories(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS store_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  factory_id INTEGER NOT NULL,
  license_id INTEGER NOT NULL,
  device_hash TEXT NOT NULL,
  downloaded_at INTEGER NOT NULL,
  FOREIGN KEY (factory_id) REFERENCES store_factories(id),
  FOREIGN KEY (license_id) REFERENCES licenses(id)
);

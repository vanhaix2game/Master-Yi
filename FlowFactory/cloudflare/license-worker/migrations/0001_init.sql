CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hash TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'lifetime')),
  expires_at INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  max_devices INTEGER NOT NULL DEFAULT 3,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS activations (
  license_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  PRIMARY KEY (license_id, device_id),
  FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
);

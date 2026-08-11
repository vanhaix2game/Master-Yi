CREATE TABLE IF NOT EXISTS installations (
  device_hash TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  architecture TEXT NOT NULL,
  current_version TEXT NOT NULL,
  first_installed_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  install_count INTEGER NOT NULL DEFAULT 0,
  update_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS installation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id_hash TEXT NOT NULL UNIQUE,
  device_hash TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('install', 'update')),
  version TEXT NOT NULL,
  platform TEXT NOT NULL,
  architecture TEXT NOT NULL,
  occurred_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_installation_events_occurred_at
  ON installation_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_installation_events_type_occurred_at
  ON installation_events(event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_installations_version
  ON installations(current_version);

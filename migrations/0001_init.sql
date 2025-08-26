-- D1 initial schema
-- Favorites: anonymous device-level saved cities
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  city TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  added_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_favorites_device ON favorites(device_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_favorites_device_city ON favorites(device_id, city);

-- User settings synced across devices (optional now)
CREATE TABLE IF NOT EXISTS settings (
  device_id TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'system',
  units TEXT DEFAULT 'fahrenheit',
  updated_at INTEGER NOT NULL
);

-- Geocoding cache (normalized query -> coords)
CREATE TABLE IF NOT EXISTS geocoding_cache (
  query TEXT PRIMARY KEY,
  normalized TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  hits INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL
);

-- Newsletter subscribers table (already created in the "newsletter" D1 database).
-- Kept here for reference, or to recreate the table if needed.
CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- See everyone who subscribed, newest first:
-- SELECT email, source, country, created_at FROM subscribers ORDER BY created_at DESC;

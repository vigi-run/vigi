-- Restore unique constraint on name column
-- Create a unique index (works for both PostgreSQL and SQLite)
CREATE UNIQUE INDEX IF NOT EXISTS tags_name_key ON tags(name);
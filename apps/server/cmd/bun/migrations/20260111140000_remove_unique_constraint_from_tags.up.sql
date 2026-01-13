-- Drop unique index on name column
-- This works for both PostgreSQL and SQLite
DROP INDEX IF EXISTS tags_name_key;
DROP INDEX IF EXISTS tags_name_uindex;
DROP INDEX IF EXISTS idx_tags_name;
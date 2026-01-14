--bun:split
ALTER TABLE catalog_items
ADD COLUMN name VARCHAR;
-- Update existing records to have a name (copy product_key as fallback)
UPDATE catalog_items
SET name = product_key
WHERE name IS NULL;
-- Make it not null after populating
-- SQLite doesn't support ALTER COLUMN SET NOT NULL comfortably in one go usually, 
-- but added columns with default or nullable is safer. 
-- We will leave it nullable for the ADD, but the application will treat it as required.
-- OR strict approach: re-create table. 
-- For simplicity and safety on existing data: leave as nullable in DB but enforce in app, 
-- OR strictly: SQLite simple ADD COLUMN doesn't support NOT NULL without DEFAULT.
-- Let's just ADD COLUMN generic.
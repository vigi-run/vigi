ALTER TABLE status_pages DROP CONSTRAINT IF EXISTS fk_status_pages_org_id;
ALTER TABLE status_pages DROP COLUMN IF EXISTS org_id;
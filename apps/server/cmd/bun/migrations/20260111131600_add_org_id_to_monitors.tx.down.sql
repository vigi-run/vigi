ALTER TABLE monitors DROP CONSTRAINT IF EXISTS fk_monitors_organizations;
ALTER TABLE monitors DROP COLUMN IF EXISTS org_id;
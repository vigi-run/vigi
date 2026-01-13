ALTER TABLE maintenances DROP CONSTRAINT IF EXISTS fk_maintenances_org_id;
ALTER TABLE maintenances DROP COLUMN IF EXISTS org_id;
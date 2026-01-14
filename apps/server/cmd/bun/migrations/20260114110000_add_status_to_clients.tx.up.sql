--bun:split
ALTER TABLE clients
ADD COLUMN status VARCHAR NOT NULL DEFAULT 'active';
--bun:split
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    id_number VARCHAR,
    vat_number VARCHAR,
    address1 VARCHAR,
    address_number VARCHAR,
    address2 VARCHAR,
    city VARCHAR,
    state VARCHAR,
    postal_code VARCHAR,
    custom_value1 DECIMAL,
    classification VARCHAR NOT NULL DEFAULT 'company',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CHECK (classification IN ('individual', 'company'))
);
CREATE INDEX clients_organization_id_idx ON clients (organization_id);
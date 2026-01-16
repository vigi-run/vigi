--bun:split
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    client_id UUID NOT NULL,
    number VARCHAR NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'DRAFT',
    date TIMESTAMP,
    due_date TIMESTAMP,
    terms TEXT,
    notes TEXT,
    total REAL NOT NULL DEFAULT 0,
    currency VARCHAR NOT NULL DEFAULT 'BRL',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
);
CREATE INDEX invoices_organization_id_idx ON invoices (organization_id);
CREATE INDEX invoices_client_id_idx ON invoices (client_id);
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL,
    catalog_item_id UUID,
    description VARCHAR NOT NULL,
    quantity REAL NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id) ON DELETE
    SET NULL
);
CREATE INDEX invoice_items_invoice_id_idx ON invoice_items (invoice_id);
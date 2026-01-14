--bun:split
CREATE TABLE catalog_items (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    type VARCHAR NOT NULL,
    product_key VARCHAR NOT NULL,
    notes TEXT,
    price REAL NOT NULL,
    cost REAL NOT NULL,
    unit VARCHAR NOT NULL,
    ncm_nbs VARCHAR,
    tax_rate REAL NOT NULL,
    in_stock_quantity REAL,
    stock_notification BOOLEAN,
    stock_threshold REAL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE INDEX catalog_items_organization_id_idx ON catalog_items (organization_id);
CREATE INDEX catalog_items_product_key_idx ON catalog_items (product_key);
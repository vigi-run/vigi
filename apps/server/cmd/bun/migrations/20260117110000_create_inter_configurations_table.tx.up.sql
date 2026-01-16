CREATE TABLE inter_configurations (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL UNIQUE,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    certificate TEXT NOT NULL,
    cert_key TEXT NOT NULL,
    account_number TEXT,
    environment TEXT NOT NULL DEFAULT 'sandbox',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

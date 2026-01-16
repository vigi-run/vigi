--bun:split
CREATE TABLE invoice_emails (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    email_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    events JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_invoice_emails_invoice_id ON invoice_emails(invoice_id);
CREATE INDEX idx_invoice_emails_email_id ON invoice_emails(email_id);
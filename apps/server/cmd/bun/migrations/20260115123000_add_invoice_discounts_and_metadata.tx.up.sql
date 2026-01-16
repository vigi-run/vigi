--bun:split
ALTER TABLE invoices
ADD COLUMN nf_id VARCHAR;
ALTER TABLE invoices
ADD COLUMN nf_status VARCHAR;
ALTER TABLE invoices
ADD COLUMN bank_invoice_id VARCHAR;
ALTER TABLE invoices
ADD COLUMN bank_invoice_status VARCHAR;
ALTER TABLE invoices
ADD COLUMN discount REAL NOT NULL DEFAULT 0;
ALTER TABLE invoice_items
ADD COLUMN discount REAL NOT NULL DEFAULT 0;
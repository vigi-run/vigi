--bun:split
ALTER TABLE invoices DROP COLUMN nf_id;
ALTER TABLE invoices DROP COLUMN nf_status;
ALTER TABLE invoices DROP COLUMN bank_invoice_id;
ALTER TABLE invoices DROP COLUMN bank_invoice_status;
ALTER TABLE invoices DROP COLUMN discount;
ALTER TABLE invoice_items DROP COLUMN discount;
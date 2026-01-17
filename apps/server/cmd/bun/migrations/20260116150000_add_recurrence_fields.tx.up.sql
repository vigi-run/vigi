ALTER TABLE recurring_invoices
ADD COLUMN frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE recurring_invoices
ADD COLUMN interval INTEGER NOT NULL DEFAULT 1;
ALTER TABLE recurring_invoices
ADD COLUMN day_of_month INTEGER;
ALTER TABLE recurring_invoices
ADD COLUMN day_of_week INTEGER;
ALTER TABLE recurring_invoices
ADD COLUMN month INTEGER;
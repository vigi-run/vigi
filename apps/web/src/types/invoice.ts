import type { Client } from './client';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';

export interface InvoiceEmail {
  id: string;
  invoiceId: string;
  type: 'created' | 'first' | 'second' | 'third';
  emailId: string;
  status: string;
  events: any[]; // refine if needed
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  catalogItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  clientId: string;
  client?: Client;
  number: string;
  status: InvoiceStatus;
  date?: string; // ISO Date
  dueDate?: string; // ISO Date
  terms?: string;
  notes?: string;
  total: number;
  discount: number;
  currency: string;
  items: InvoiceItem[];
  // Metadata / Integrations
  nfId?: string;
  nfStatus?: string;
  nfLink?: string;
  bankInvoiceId?: string;
  bankInvoiceStatus?: string;
  bankProvider?: string;
  bankPixPayload?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceItemDTO {
  catalogItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoiceDTO {
  clientId: string;
  number: string;
  date?: Date;
  dueDate?: Date;
  terms?: string;
  notes?: string;
  discount?: number;
  nfId?: string;
  nfStatus?: string;
  nfLink?: string;
  bankInvoiceId?: string;
  bankInvoiceStatus?: string;
  items: CreateInvoiceItemDTO[];
}

export interface UpdateInvoiceDTO extends Partial<Omit<CreateInvoiceDTO, 'items'>> {
  status?: InvoiceStatus;
  items?: CreateInvoiceItemDTO[];
}

export type InvoiceFilter = {
  page?: number;
  limit?: number;
  q?: string;
  status?: InvoiceStatus;
  clientId?: string;
};

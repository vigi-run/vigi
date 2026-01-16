export type RecurringInvoiceStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface RecurringInvoiceItem {
    id: string;
    recurringInvoiceId: string;
    catalogItemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
    createdAt: string;
}

export interface RecurringInvoice {
    id: string;
    organizationId: string;
    clientId: string;
    number: string;
    status: RecurringInvoiceStatus;
    nextGenerationDate?: string; // ISO Date
    date?: string; // ISO Date
    dueDate?: string; // ISO Date
    terms?: string;
    notes?: string;
    total: number;
    discount: number;
    currency: string;
    items: RecurringInvoiceItem[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateRecurringInvoiceItemDTO {
    catalogItemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
}

export interface CreateRecurringInvoiceDTO {
    clientId: string;
    number: string;
    nextGenerationDate?: Date;
    date?: Date;
    dueDate?: Date;
    terms?: string;
    notes?: string;
    discount?: number;
    items: CreateRecurringInvoiceItemDTO[];
}

export interface UpdateRecurringInvoiceDTO extends Partial<Omit<CreateRecurringInvoiceDTO, 'items'>> {
    status?: RecurringInvoiceStatus;
    items?: CreateRecurringInvoiceItemDTO[];
}

export type RecurringInvoiceFilter = {
    page?: number;
    limit?: number;
    q?: string;
    status?: RecurringInvoiceStatus;
    clientId?: string;
};

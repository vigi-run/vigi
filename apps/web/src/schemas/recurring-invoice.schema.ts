import { z } from 'zod';

export const getRecurringInvoiceSchema = (t: (key: string) => string) => {
  return z.object({
    clientId: z.string().min(1, t('invoice.validation.client_required')),
    number: z.string().min(1, t('invoice.validation.number_required')),
    nextGenerationDate: z.date().optional(),
    date: z.date().optional(),
    dueDate: z.date().optional(),
    terms: z.string().optional(),
    notes: z.string().optional(),
    discount: z.number().min(0).optional().default(0),
    frequency: z.string().min(1),
    interval: z.coerce.number().min(1),
    dayOfMonth: z.coerce.number().optional(),
    dayOfWeek: z.coerce.number().optional(),
    month: z.coerce.number().optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).optional(),
    items: z
      .array(
        z.object({
          catalogItemId: z.string().nullish(),
          description: z.string().min(1, t('invoice.validation.item_description_required')),
          quantity: z.number().min(0.01, t('invoice.validation.item_quantity_min')),
          unitPrice: z.number().min(0, t('invoice.validation.item_price_min')),
          discount: z.number().min(0).optional().default(0),
        })
      )
      .min(1, t('invoice.validation.items_required')),
  });
};

export type RecurringInvoiceFormValues = z.infer<ReturnType<typeof getRecurringInvoiceSchema>>;

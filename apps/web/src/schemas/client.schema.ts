import { z } from 'zod';
import { isValidCNPJ, isValidCPF } from '../lib/validators';

export const ClientClassificationSchema = z.enum(['individual', 'company']);

export const ClientSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    idNumber: z.string().optional(),
    vatNumber: z.string().optional(),
    address1: z.string().optional(),
    addressNumber: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    customValue1: z.number().optional(),
    classification: ClientClassificationSchema,
}).superRefine((data, ctx) => {
    if (data.idNumber) {
        if (data.classification === 'individual') {
            if (!isValidCPF(data.idNumber)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Invalid CPF',
                    path: ['idNumber'],
                });
            }
        } else {
            if (!isValidCNPJ(data.idNumber)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Invalid CNPJ',
                    path: ['idNumber'],
                });
            }
        }
    }
});

export type ClientFormValues = z.infer<typeof ClientSchema>;

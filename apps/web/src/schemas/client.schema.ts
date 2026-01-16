import { z } from 'zod';
import { isValidCNPJ, isValidCPF } from '../lib/validators';

export const ClientClassificationSchema = z.enum(['individual', 'company']);

export const getClientContactSchema = (t: (key: string) => string) => z.object({
    name: z.string().min(1, t('clients.validation.name_required')),
    email: z.string().email(t('clients.validation.email_invalid')).optional().or(z.literal('')),
    phone: z.string().optional(),
    role: z.string().optional(),
});

export const getClientSchema = (t: (key: string) => string) => {
    return z.object({
        name: z.string().min(1, t('clients.validation.name_required')),
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
        contacts: z.array(getClientContactSchema(t)).default([]),
    }).superRefine((data, ctx) => {
        // ID Validation
        if (data.classification === 'individual') {
            if (!data.idNumber) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: t('clients.validation.cpf_required'),
                    path: ['idNumber'],
                });
            } else if (!isValidCPF(data.idNumber)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: t('clients.validation.cpf_invalid'),
                    path: ['idNumber'],
                });
            }
        } else {
            // For companies, idNumber (CNPJ) might be optional? User didn't specify, but let's assume required for now or at least validated if present.
            // Actually user said "CPF não ta obrigatorio", suggesting it SHOULD be.
            if (data.idNumber && !isValidCNPJ(data.idNumber)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: t('clients.validation.cnpj_invalid'),
                    path: ['idNumber'],
                });
            }
        }

        // PF Contact Validation (Email OR Phone required)
        if (data.classification === 'individual') {
            // We assume contacts[0] is the main contact for PF
            const contact = data.contacts?.[0];
            // If no contact or both email and phone are empty/missing
            if (!contact || (!contact.email && !contact.phone)) {
                // Mark both fields as error to be visible
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: t('clients.validation.contact_required'),
                    path: ['contacts', 0, 'email'],
                });
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: t('clients.validation.contact_required'),
                    path: ['contacts', 0, 'phone'],
                });
            }
        }
    });
};

export type ClientFormValues = z.infer<ReturnType<typeof getClientSchema>>;
export type ClientContact = z.infer<ReturnType<typeof getClientContactSchema>>;


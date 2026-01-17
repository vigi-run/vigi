import { client } from "./client.gen";

export interface AsaasConfig {
    apiKey?: string;
    environment?: string;
    // other fields if needed
}

export const getAsaasConfig = async (organizationId: string) => {
    return client.get({
        url: `/organizations/${organizationId}/integrations/asaas`,
    });
};

export const saveAsaasConfig = async (organizationId: string, data: AsaasConfig) => {
    return client.post({
        url: `/organizations/${organizationId}/integrations/asaas`,
        body: data,
    });
};

export const generateAsaasCharge = async (organizationId: string, invoiceId: string) => {
    return client.post({
        url: `/organizations/${organizationId}/integrations/asaas/charge`,
        body: { invoiceId },
    });
};

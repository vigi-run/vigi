import { client } from './client.gen';

export const getInterConfig = async (organizationId: string) => {
    return client.get({
        url: `/organizations/${organizationId}/integrations/inter`,
    });
};

export const saveInterConfig = async (organizationId: string, data: any) => {
    return client.post({
        url: `/organizations/${organizationId}/integrations/inter`,
        body: data,
    });
};

export const generateInterCharge = async (organizationId: string, invoiceId: string) => {
    return client.post({
        url: `/organizations/${organizationId}/integrations/inter/charge`,
        body: { invoiceId },
    });
};

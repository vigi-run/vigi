import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client.gen';
import type { CreateRecurringInvoiceDTO, RecurringInvoice, RecurringInvoiceFilter, UpdateRecurringInvoiceDTO } from '@/types/recurring-invoice';

export const getRecurringInvoicesInfiniteOptions = (orgId: string, params?: RecurringInvoiceFilter) => ({
    queryKey: ['recurring-invoices', orgId, params],
    queryFn: async ({ pageParam = 1 }: { pageParam?: number }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('page', pageParam.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.q) queryParams.append('q', params.q);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.clientId) queryParams.append('clientId', params.clientId);

        const res = await client.get({
            url: `/organizations/${orgId}/recurring-invoices?${queryParams.toString()}`,
        });
        return (res.data as any).data;
    },
    getNextPageParam: (lastPage: any) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
});

export const getRecurringInvoiceOptions = (id: string, enabled = true) => queryOptions({
    queryKey: ['recurring-invoice', id],
    queryFn: async () => {
        const res = await client.get({ url: `/recurring-invoices/${id}` });
        return (res.data as any).data as RecurringInvoice;
    },
    enabled,
});

export const useCreateRecurringInvoiceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orgId, data }: { orgId: string; data: CreateRecurringInvoiceDTO }) => {
            const res = await client.post({
                url: `/organizations/${orgId}/recurring-invoices`,
                body: data,
            });
            return (res.data as any).data as RecurringInvoice;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['recurring-invoices', variables.orgId] });
        },
    });
};

export const useUpdateRecurringInvoiceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateRecurringInvoiceDTO }) => {
            const res = await client.patch({ url: `/recurring-invoices/${id}`, body: data });
            return (res.data as any).data as RecurringInvoice;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['recurring-invoices', data.organizationId] });
            queryClient.invalidateQueries({ queryKey: ['recurring-invoice', data.id] });
        },
    });
};

export const useDeleteRecurringInvoiceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete({ url: `/recurring-invoices/${id}` });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recurring-invoices'] });
        },
    });
};

export const useGenerateInvoiceMutation = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await client.post({ url: `/recurring-invoices/${id}/generate` });
            return (res.data as any).data;
        },
    });
};

import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client.gen';
import type { CreateInvoiceDTO, Invoice, InvoiceFilter, UpdateInvoiceDTO } from '@/types/invoice';

export const getInvoicesInfiniteOptions = (orgId: string, params?: InvoiceFilter) => ({
    queryKey: ['invoices', orgId, params],
    queryFn: async ({ pageParam = 1 }: { pageParam?: number }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('page', pageParam.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.q) queryParams.append('q', params.q);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.clientId) queryParams.append('clientId', params.clientId);

        const res = await client.get({
            url: `/organizations/${orgId}/invoices?${queryParams.toString()}`,
        });
        return (res.data as any).data;
    },
    getNextPageParam: (lastPage: any) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
});

export const getInvoiceOptions = (id: string, enabled = true) => queryOptions({
    queryKey: ['invoice', id],
    queryFn: async () => {
        const res = await client.get({ url: `/invoices/${id}` });
        return (res.data as any).data as Invoice;
    },
    enabled,
});

export const useCreateInvoiceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orgId, data }: { orgId: string; data: CreateInvoiceDTO }) => {
            const res = await client.post({
                url: `/organizations/${orgId}/invoices`,
                body: data,
            });
            return (res.data as any).data as Invoice;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', variables.orgId] });
        },
    });
};

export const useUpdateInvoiceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateInvoiceDTO }) => {
            const res = await client.patch({ url: `/invoices/${id}`, body: data });
            return (res.data as any).data as Invoice;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['invoices', data.organizationId] });
            queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
        },
    });
};

export const useDeleteInvoiceMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete({ url: `/invoices/${id}` });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });
};

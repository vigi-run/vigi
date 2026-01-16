import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client.gen';
import type { CatalogItem, CatalogItemFilter, CreateCatalogItemDTO, UpdateCatalogItemDTO } from '@/types/catalogItem';

export type GetCatalogItemsParams = CatalogItemFilter;

// Infinite Query for List
export const getCatalogItemsInfiniteOptions = (orgId: string, params?: GetCatalogItemsParams) => ({
    queryKey: ['catalogItems', orgId, params],
    queryFn: async ({ pageParam = 1 }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('page', pageParam.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.q) queryParams.append('q', params.q);
        if (params?.type) queryParams.append('type', params.type);

        const res = await client.get({
            url: `/organizations/${orgId}/catalog-items?${queryParams.toString()}`,
        });
        return (res.data as any).data;
    },
    getNextPageParam: (lastPage: any) =>
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
});

// Single Entity Query
export const getCatalogItemOptions = (id: string) => queryOptions({
    queryKey: ['catalogItem', id],
    queryFn: async () => {
        const res = await client.get({ url: `/catalog-items/${id}` });
        return (res.data as any).data as CatalogItem;
    },
});

// Create Mutation
export const useCreateCatalogItemMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orgId, data }: { orgId: string; data: CreateCatalogItemDTO }) => {
            const res = await client.post({
                url: `/organizations/${orgId}/catalog-items`,
                body: data,
            });
            return (res.data as any).data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['catalogItems', variables.orgId] });
        },
    });
};

// Update Mutation
export const useUpdateCatalogItemMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateCatalogItemDTO }) => {
            const res = await client.patch({ url: `/catalog-items/${id}`, body: data });
            return (res.data as any).data;
        },
        onSuccess: (data: CatalogItem) => {
            queryClient.invalidateQueries({ queryKey: ['catalogItems', data.organizationId] });
            queryClient.invalidateQueries({ queryKey: ['catalogItem', data.id] });
        },
    });
};

// Delete Mutation
export const useDeleteCatalogItemMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete({ url: `/catalog-items/${id}` });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogItems'] });
        },
    });
};

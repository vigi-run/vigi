import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client.gen';
import type { Client, CreateClientDTO, UpdateClientDTO } from '../types/client';

type ApiResponse<T> = {
    data: T;
    message: string;
};

export type PaginatedResponse<T> = {
    data: T[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type GetClientsParams = {
    page?: number;
    limit?: number;
    q?: string;
    classification?: string;
    status?: string;
};

export const getClientsInfiniteOptions = (orgId: string, params?: GetClientsParams) => {
    return {
        queryKey: ['clients', orgId, params],
        queryFn: async ({ pageParam = 1 }: { pageParam?: number }): Promise<PaginatedResponse<Client>> => {
            const queryParams = new URLSearchParams();
            queryParams.append('page', pageParam.toString());
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.q) queryParams.append('q', params.q);
            if (params?.classification) queryParams.append('classification', params.classification);
            if (params?.status) queryParams.append('status', params.status);

            const res = await client.get<ApiResponse<PaginatedResponse<Client>>>({
                url: `/organizations/${orgId}/clients?${queryParams.toString()}`,
            });
            return (res.data as unknown as ApiResponse<PaginatedResponse<Client>>).data;
        },
        getNextPageParam: (lastPage: PaginatedResponse<Client>) => {
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    };
};

export const getClientOptions = (clientId: string) => {
    return queryOptions({
        queryKey: ['client', clientId],
        queryFn: async (): Promise<Client> => {
            const res = await client.get<ApiResponse<Client>>({
                url: `/clients/${clientId}`,
            });
            return (res.data as unknown as ApiResponse<Client>).data;
        },
    });
}

export const useCreateClientMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orgId, data }: { orgId: string; data: CreateClientDTO }) => {
            const res = await client.post<ApiResponse<Client>>({
                url: `/organizations/${orgId}/clients`,
                body: data,
            });
            return (res.data as unknown as ApiResponse<Client>).data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['clients', variables.orgId] });
        },
    });
};

export const useUpdateClientMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateClientDTO }) => {
            const res = await client.patch<ApiResponse<Client>>({
                url: `/clients/${id}`,
                body: data,
            });
            return (res.data as unknown as ApiResponse<Client>).data;
        },
        onSuccess: (data) => {
            // data is Client
            queryClient.invalidateQueries({ queryKey: ['clients', data.organizationId] });
            queryClient.invalidateQueries({ queryKey: ['client', data.id] });
        },
    });
};

export const useDeleteClientMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await client.delete<ApiResponse<any>>({
                url: `/clients/${id}`,
            });
            return res.data;
        },
        onSuccess: () => {
            // We don't have orgId easily here without passing it or fetching it.
            // But we can invalidate all 'clients' queries which is safe enough.
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });
};

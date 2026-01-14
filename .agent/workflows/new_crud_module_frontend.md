---
description: Frontend implementation for new CRUD modules (React + TypeScript + React Query)
---
# Frontend CRUD Module Implementation

## Directory Structure

```
apps/web/src/
├── api/<module_name>-manual.ts      # API client + React Query hooks
├── types/<module_name>.ts           # TypeScript types
├── schemas/<module_name>.schema.ts  # Zod validation
├── app/<module_name>/
│   ├── page.tsx                     # List (filters + infinite scroll)
│   ├── new/page.tsx                 # Create form
│   ├── view/page.tsx                # Details + inline status change
│   ├── edit/page.tsx                # Edit form
│   └── components/
│       └── <module_name>-card.tsx   # List item card
└── i18n/locales/*.json              # Translations
```

---

## 1. Types (`src/types/<module_name>.ts`)

```typescript
export type <EntityName>Status = 'active' | 'inactive' | 'blocked';

export interface <EntityName> {
    id: string;
    organizationId: string;
    name: string;
    status: <EntityName>Status;
    createdAt: string;
    updatedAt: string;
}

export interface Create<EntityName>DTO {
    name: string;
}

export type Update<EntityName>DTO = Partial<Create<EntityName>DTO> & {
    status?: <EntityName>Status;
};
```

---

## 2. API Client (`src/api/<module_name>-manual.ts`)

> [!IMPORTANT]
> **Always invalidate cache after mutations!**

```typescript
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from './client.gen';

type ApiResponse<T> = { data: T; message: string; };

export type PaginatedResponse<T> = {
    data: T[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type Get<EntityName>sParams = {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
};

// Infinite Query for List
export const get<EntityName>sInfiniteOptions = (orgId: string, params?: Get<EntityName>sParams) => ({
    queryKey: ['<module_name>s', orgId, params],
    queryFn: async ({ pageParam = 1 }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('page', pageParam.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.q) queryParams.append('q', params.q);
        if (params?.status) queryParams.append('status', params.status);
        
        const res = await client.get({
            url: `/organizations/${orgId}/<module_name>s?${queryParams.toString()}`,
        });
        return res.data.data;
    },
    getNextPageParam: (lastPage) => 
        lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
});

// Single Entity Query
export const get<EntityName>Options = (id: string) => queryOptions({
    queryKey: ['<module_name>', id],
    queryFn: async () => {
        const res = await client.get({ url: `/<module_name>s/${id}` });
        return res.data.data;
    },
});

// Create Mutation
export const useCreate<EntityName>Mutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orgId, data }) => {
            const res = await client.post({
                url: `/organizations/${orgId}/<module_name>s`,
                body: data,
            });
            return res.data.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['<module_name>s', variables.orgId] });
        },
    });
};

// Update Mutation
export const useUpdate<EntityName>Mutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await client.patch({ url: `/<module_name>s/${id}`, body: data });
            return res.data.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['<module_name>s', data.organizationId] });
            queryClient.invalidateQueries({ queryKey: ['<module_name>', data.id] });
        },
    });
};

// Delete Mutation
export const useDelete<EntityName>Mutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await client.delete({ url: `/<module_name>s/${id}` });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['<module_name>s'] });
        },
    });
};
```

---

## 3. List Page (`src/app/<module_name>/page.tsx`)

> [!TIP]
> **Match Monitors page UI:** Filters on the right, in a row.

```tsx
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

const <EntityName>sPage = () => {
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "blocked">("all");

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
        ...get<EntityName>sInfiniteOptions(orgId, {
            q: debouncedSearch || undefined,
            status: statusFilter === "all" ? undefined : statusFilter,
            limit: 10,
        }),
        enabled: !!orgId,
    });

    // Infinite scroll
    const handleObserver = useCallback((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const { ref: observerRef } = useIntersectionObserver<HTMLDivElement>(handleObserver);

    const entities = data?.pages.flatMap((page) => page.data) || [];

    return (
        <Layout pageName={t("<module_name>.title")} onCreate={() => navigate("new")}>
            {/* Filters */}
            <div className="mb-4">
                <div className="flex flex-col gap-4 md:flex-row sm:justify-end items-end">
                    {/* Status Filter */}
                    <div className="flex flex-col gap-1">
                        <Label>{t("common.status")}</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("common.all")}</SelectItem>
                                <SelectItem value="active">{t("common.active")}</SelectItem>
                                <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
                                <SelectItem value="blocked">{t("<module_name>.status.blocked")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col gap-1">
                        <Label>{t("common.search")}</Label>
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("<module_name>.filters.search_placeholder")}
                            className="w-[300px]"
                        />
                    </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && <Skeleton className="h-24 w-full" />}

            {/* Empty */}
            {!isLoading && entities.length === 0 && (
                <EmptyList title={t("<module_name>.empty.title")} onClick={() => navigate("new")} />
            )}

            {/* List */}
            {entities.map((entity) => (
                <<EntityName>Card key={entity.id} entity={entity} />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={observerRef} style={{ height: 1 }} />
            {isFetchingNextPage && <Skeleton className="h-24 w-full" />}
        </Layout>
    );
};
```

---

## 4. Card Component (`components/<module_name>-card.tsx`)

```tsx
const <EntityName>Card = ({ entity, onDelete }) => {
    const getStatusVariant = (status) => {
        switch (status) {
            case 'active': return 'outline';
            case 'inactive': return 'secondary';
            case 'blocked': return 'destructive';
        }
    };

    return (
        <Card className="hover:bg-muted/50">
            <CardContent>
                <div className="flex justify-between items-center">
                    <div className="cursor-pointer" onClick={() => navigate(entity.id)}>
                        <h3>{entity.name}</h3>
                        <Badge variant={getStatusVariant(entity.status)}>
                            {t(`<module_name>.status.${entity.status}`)}
                        </Badge>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => navigate(`${entity.id}/edit`)}>Edit</Button>
                        <Button variant="destructive" onClick={() => onDelete(entity.id)}>Delete</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
```

---

## 5. Details Page with Inline Status Change

> [!TIP]
> **Usability:** Change status directly from details, no edit screen needed.

```tsx
const <EntityName>DetailsPage = () => {
    const updateMutation = useUpdate<EntityName>Mutation();

    const handleStatusChange = async (newStatus) => {
        await updateMutation.mutateAsync({ id: entity.id, data: { status: newStatus } });
        toast.success(t("<module_name>.status_updated"));
    };

    return (
        <Layout>
            <div className="flex justify-between mb-6">
                <BackButton />
                <div className="flex gap-4">
                    {/* Inline status dropdown */}
                    <Select value={entity.status} onValueChange={handleStatusChange}>
                        <SelectTrigger>
                            <Badge>{t(`<module_name>.status.${entity.status}`)}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => navigate("edit")}>Edit</Button>
                </div>
            </div>
            {/* Entity details */}
        </Layout>
    );
};
```

---

## 6. Routes (`src/routes/protected-routes.tsx`)

```tsx
<Route path="<module_name>s" element={<Outlet />}>
    <Route index element={<<EntityName>sPage />} />
    <Route path="new" element={<New<EntityName>Page />} />
    <Route path=":id" element={<Outlet />}>
        <Route index element={<<EntityName>DetailsPage />} />
        <Route path="edit" element={<Edit<EntityName>Page />} />
    </Route>
</Route>
```

---

## 7. Translations

```json
{
    "<module_name>": {
        "title": "Entities",
        "create": "Create",
        "status": {
            "active": "Active",
            "inactive": "Inactive",
            "blocked": "Blocked"
        },
        "status_updated": "Status updated",
        "filters": {
            "search_placeholder": "Search..."
        },
        "empty": {
            "title": "No entities found"
        }
    }
}
```

---

## Common Issues

| Error | Solution |
|-------|----------|
| Cache not updating | Add `invalidateQueries` in `onSuccess` |
| `useIntersectionObserver` type error | Use generic: `<HTMLDivElement>` |
| Duplicate i18n keys | Keep only one (object or string) |
| `data is undefined` | Check API response: `res.data.data` |

import { getCatalogItemsInfiniteOptions, useDeleteCatalogItemMutation } from "@/api/catalogItem-manual";
import { CatalogItemCard } from "@/app/catalog-items/components/catalog-item-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizationStore } from "@/store/organization";
import { type CatalogItem, CatalogItemType } from "@/types/catalogItem";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/hooks/useDebounce";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import Layout from "@/layout";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyList from "@/components/empty-list";
import { Label } from "@/components/ui/label";

export default function CatalogItemsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentOrganization: organization } = useOrganizationStore();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [type, setType] = useState<CatalogItemType | "ALL">("ALL");

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery(
        getCatalogItemsInfiniteOptions(organization?.id ?? "", {
            q: debouncedSearch,
            type: type === "ALL" ? undefined : type,
            limit: 20,
        })
    );

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    );

    const { ref } = useIntersectionObserver<HTMLDivElement>(handleObserver);

    const deleteMutation = useDeleteCatalogItemMutation();

    const handleDelete = async (id: string) => {
        if (confirm(t("common.confirm_delete_title"))) {
            try {
                await deleteMutation.mutateAsync(id);
                toast.success(t("catalog_item.delete_success"));
            } catch (error) {
                console.error(error);
                toast.error(t("catalog_item.delete_error"));
            }
        }
    };

    if (!organization) return null;

    // Safely flatten items from pages
    // Using page.data instead of page.items matching typical backend response
    const items = data?.pages?.flatMap(page => (page?.data || [])) as CatalogItem[] || [];

    return (
        <Layout
            pageName={t("catalog_item.title")}
            onCreate={() => navigate("new")}
        >
            <div className="space-y-8">
                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row sm:justify-end items-end">
                    {/* Type Filter */}
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                        <Label>{t("catalog_item.fields.type")}</Label>
                        <Select value={type} onValueChange={(val) => setType(val as CatalogItemType | "ALL")}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder={t("catalog_item.filters.type_placeholder")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">{t("common.all")}</SelectItem>
                                <SelectItem value={CatalogItemType.PRODUCT}>{t("catalog_item.type.product")}</SelectItem>
                                <SelectItem value={CatalogItemType.SERVICE}>{t("catalog_item.type.service")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                        <Label>{t("common.search")}</Label>
                        <Input
                            placeholder={t("catalog_item.filters.search_placeholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full md:w-[300px]"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && items.length === 0 && (
                    <EmptyList
                        title={t("catalog_item.empty.title")}
                        text={t("catalog_item.empty.description")}
                        actionText={t("catalog_item.create")}
                        onClick={() => navigate("new")}
                    />
                )}

                {/* List */}
                {!isLoading && items.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                            <CatalogItemCard key={item.id} entity={item} onDelete={handleDelete} />
                        ))}
                    </div>
                )}

                {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                        <Skeleton className="h-[200px] w-full max-w-sm rounded-xl" />
                    </div>
                )}

                <div ref={ref} className="h-4" />
            </div>
        </Layout>
    );
}

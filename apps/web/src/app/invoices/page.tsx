import { useInfiniteQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useOrganizationStore } from "@/store/organization";
import { getInvoicesInfiniteOptions, useDeleteInvoiceMutation } from "@/api/invoice-manual";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyList from "@/components/empty-list";
import { InvoiceCard } from "./components/invoice-card";
import type { InvoiceStatus } from "@/types/invoice";
import { toast } from "sonner";
import Layout from "@/layout";

export default function InvoicesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentOrganization: organization } = useOrganizationStore();
    const orgId = organization?.id;

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
        ...getInvoicesInfiniteOptions(orgId!, {
            q: debouncedSearch || undefined,
            status: statusFilter === "all" ? undefined : statusFilter,
            limit: 10,
        }),
        enabled: !!orgId,
    });

    const deleteMutation = useDeleteInvoiceMutation();

    const handleDelete = async (id: string) => {
        if (confirm(t('common.confirm_delete'))) {
            try {
                await deleteMutation.mutateAsync(id);
                toast.success(t('common.deleted_successfully'));
            } catch (error) {
                toast.error(t('common.error_occurred'));
            }
        }
    };

    // Infinite scroll
    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const { ref: observerRef } = useIntersectionObserver<HTMLDivElement>(handleObserver);

    const entities = data?.pages.flatMap((page) => page.data).filter((e) => !!e) || [];

    return (
        <Layout pageName={t("invoice.title")} onCreate={() => navigate("new")}>
            {/* Filters */}
            <div className="mb-6">
                <div className="flex flex-col gap-4 md:flex-row sm:justify-end items-end">
                    {/* Status Filter */}
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                        <Label>{t("common.status")}</Label>
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                            <SelectTrigger className="w-full md:w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t("common.all")}</SelectItem>
                                <SelectItem value="DRAFT">{t("invoice.status.draft")}</SelectItem>
                                <SelectItem value="SENT">{t("invoice.status.sent")}</SelectItem>
                                <SelectItem value="PAID">{t("invoice.status.paid")}</SelectItem>
                                <SelectItem value="CANCELLED">{t("invoice.status.cancelled")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                        <Label>{t("common.search")}</Label>
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t("invoice.filters.search_placeholder")}
                            className="w-full md:w-[300px]"
                        />
                    </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="grid grid-cols-1 gap-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            )}

            {/* Empty */}
            {!isLoading && entities.length === 0 && (
                <EmptyList
                    title={t("invoice.empty.title")}
                    text={t("invoice.empty.description")}
                    actionText={t("invoice.new_invoice")}
                    onClick={() => navigate("new")}
                />
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {entities.map((entity) => (
                    <InvoiceCard key={entity.id} entity={entity} onDelete={handleDelete} />
                ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={observerRef} style={{ height: 1 }} />
            {isFetchingNextPage && <Skeleton className="h-24 w-full mt-4" />}
        </Layout>
    );
}

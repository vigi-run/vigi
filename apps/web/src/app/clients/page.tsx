import { useInfiniteQuery } from "@tanstack/react-query";
import { getClientsInfiniteOptions, useDeleteClientMutation } from "@/api/clients-manual";
import Layout from "@/layout";
import { useLocalizedTranslation } from "@/hooks/useTranslation";
import { useOrganizationStore } from "@/store/organization";
import { useNavigate } from "react-router-dom";
import EmptyList from "@/components/empty-list";
import { Skeleton } from "@/components/ui/skeleton";
import ClientCard from "./components/client-card";
import { toast } from "sonner";
import { useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

const ClientsPage = () => {
    const { t } = useLocalizedTranslation();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    const deleteMutation = useDeleteClientMutation();

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "blocked">("all");
    const [classificationFilter, setClassificationFilter] = useState<"all" | "individual" | "company">("all");

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        ...getClientsInfiniteOptions(currentOrganization?.id || "", {
            q: debouncedSearch || undefined,
            limit: 10,
            status: statusFilter === "all" ? undefined : statusFilter,
            classification: classificationFilter === "all" ? undefined : classificationFilter,
        }),
        enabled: !!currentOrganization?.id,
    });

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    );

    const { ref: observerRef } = useIntersectionObserver<HTMLDivElement>(handleObserver);

    const clients = data?.pages.flatMap((page) => page.data) || [];

    const handleCreate = () => {
        navigate("new");
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            toast.success(t("clients.delete_success", "Client deleted successfully"));
        } catch (error) {
            console.error(error);
            toast.error(t("clients.delete_error", "Failed to delete client"));
        }
    };

    return (
        <Layout
            pageName={t("clients.title", "Clients")}
            onCreate={handleCreate}
        >
            <div>
                <div className="mb-4 space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row sm:justify-end sm:gap-4 items-end">
                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                            <Label htmlFor="status-filter">{t("common.status", "Status")}</Label>
                            <Select
                                value={statusFilter}
                                onValueChange={(v) =>
                                    setStatusFilter(v as "all" | "active" | "inactive" | "blocked")
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[140px]">
                                    <SelectValue placeholder={t("common.all", "All")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                                    <SelectItem value="active">{t("common.active", "Active")}</SelectItem>
                                    <SelectItem value="inactive">{t("common.inactive", "Inactive")}</SelectItem>
                                    <SelectItem value="blocked">{t("clients.status.blocked", "Blocked")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                            <Label htmlFor="classification-filter">{t("clients.classification", "Classification")}</Label>
                            <Select
                                value={classificationFilter}
                                onValueChange={(v) =>
                                    setClassificationFilter(v as "all" | "individual" | "company")
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue placeholder={t("common.all", "All")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("common.all", "All")}</SelectItem>
                                    <SelectItem value="individual">{t("clients.classification.individual", "Individual")}</SelectItem>
                                    <SelectItem value="company">{t("clients.classification.company", "Company")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1 w-full sm:w-auto">
                            <Label htmlFor="search-clients">{t("common.search", "Search")}</Label>
                            <Input
                                id="search-clients"
                                placeholder={t("clients.filters.search_placeholder", "Search by name...")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full lg:w-[300px]"
                            />
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="flex flex-col space-y-2">
                        {Array.from({ length: 5 }, (_, id) => (
                            <Skeleton className="h-24 w-full rounded-xl" key={id} />
                        ))}
                    </div>
                )}

                {!isLoading && clients.length === 0 && (
                    <EmptyList
                        title={t("clients.empty.title", "No clients found")}
                        text={t("clients.empty.description", "Create your first client to get started.")}
                        actionText={t("clients.create", "Create Client")}
                        onClick={handleCreate}
                    />
                )}

                {!isLoading && clients.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {clients.map((client) => (
                            <ClientCard
                                key={client.id}
                                client={client}
                                onDelete={handleDelete}
                                isDeleting={deleteMutation.isPending}
                            />
                        ))}
                        <div ref={observerRef} style={{ height: 1 }} />
                        {isFetchingNextPage && (
                            <Skeleton className="h-24 w-full rounded-xl" />
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ClientsPage;

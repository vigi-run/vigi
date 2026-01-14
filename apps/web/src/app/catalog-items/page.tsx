import { getCatalogItemsInfiniteOptions, useDeleteCatalogItemMutation } from "@/api/catalogItem-manual";
import { CatalogItemCard } from "@/app/catalog-items/components/catalog-item-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizationStore } from "@/store/organization";
import { type CatalogItem, CatalogItemType } from "@/types/catalogItem";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/hooks/useDebounce";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import Layout from "@/layout";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("catalog_item.filters.search_placeholder")}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={type} onValueChange={(val) => setType(val as CatalogItemType | "ALL")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("catalog_item.filters.type_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("catalog_item.filters.type_placeholder")}</SelectItem>
              <SelectItem value={CatalogItemType.PRODUCT}>{t("catalog_item.type.product")}</SelectItem>
              <SelectItem value={CatalogItemType.SERVICE}>{t("catalog_item.type.service")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/10">
            <h3 className="text-lg font-semibold">{t("catalog_item.empty.title")}</h3>
            <p className="text-muted-foreground">{t("catalog_item.empty.description")}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CatalogItemCard key={item.id} entity={item} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        <div ref={ref} className="h-4" />
      </div>
    </Layout>
  );
}

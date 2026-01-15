import { getCatalogItemOptions, useUpdateCatalogItemMutation } from "@/api/catalogItem-manual";
import { CatalogItemForm } from "@/app/catalog-items/components/catalog-item-form";
import { useOrganizationStore } from "@/store/organization";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { CatalogItemFormValues } from "@/schemas/catalogItem";
import { CatalogItemType, type UpdateCatalogItemDTO } from "@/types/catalogItem";
import Layout from "@/layout";
import { BackButton } from "@/components/back-button";
import { toast } from "sonner";

export default function EditCatalogItemPage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentOrganization: organization } = useOrganizationStore();

    const { data: item, isLoading } = useQuery(getCatalogItemOptions(id!));
    const mutation = useUpdateCatalogItemMutation();

    const handleSubmit = async (values: CatalogItemFormValues) => {
        const dto: UpdateCatalogItemDTO = { ...(values as any) };

        if (dto.type === CatalogItemType.SERVICE) {
            delete dto.inStockQuantity;
            delete dto.stockNotification;
            delete dto.stockThreshold;
        }

        if (!organization?.id) return;

        try {
            await mutation.mutateAsync({
                id: id!,
                data: dto,
            });
            toast.success(t("catalog_item.update_success"));
            navigate(listPath);
        } catch (error) {
            console.error(error);
            toast.error(t("catalog_item.update_error"));
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!item) return <div>{t("common.not_found")}</div>;

    const listPath = organization?.slug ? `/${organization.slug}/catalog-items` : "/catalog-items";

    return (
        <Layout pageName={t("catalog_item.edit.title")}>
            <div className="max-w-2xl space-y-4">
                <BackButton to={listPath} />
                <CatalogItemForm
                    defaultValues={item as unknown as CatalogItemFormValues}
                    onSubmit={handleSubmit}
                    isLoading={mutation.isPending}
                />
            </div>
        </Layout>
    );
}

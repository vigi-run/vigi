import { useCreateCatalogItemMutation } from "@/api/catalogItem-manual";
import { CatalogItemForm } from "@/app/catalog-items/components/catalog-item-form";
import Layout from "@/layout";
import { useOrganizationStore } from "@/store/organization";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { CatalogItemFormValues } from "@/schemas/catalogItem";
import type { CreateCatalogItemDTO } from "@/types/catalogItem";
import { CatalogItemType } from "@/types/catalogItem";
import { BackButton } from "@/components/back-button";
import { toast } from "sonner";

export default function NewCatalogItemPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentOrganization: organization } = useOrganizationStore();
    const mutation = useCreateCatalogItemMutation();

    const handleSubmit = async (values: CatalogItemFormValues) => {
        if (!organization?.id) return;

        const dto: CreateCatalogItemDTO = {
            ...(values as any),
            ncmNbs: values.ncmNbs || undefined,
            // Ensure stock fields are undefined for SERVICE type
            ...(values.type === CatalogItemType.SERVICE && {
                inStockQuantity: undefined,
                stockNotification: undefined,
                stockThreshold: undefined,
            })
        };

        if (dto.type === CatalogItemType.SERVICE) {
            delete dto.inStockQuantity;
            delete dto.stockNotification;
            delete dto.stockThreshold;
        }

        try {
            await mutation.mutateAsync({
                orgId: organization.id,
                data: dto,
            });
            toast.success(t("catalog_item.create_success"));
            navigate(listPath);
        } catch (error) {
            console.error(error);
            toast.error(t("catalog_item.create_error"));
        }
    };

    const listPath = organization?.slug ? `/${organization.slug}/catalog-items` : "/catalog-items";

    return (
        <Layout pageName={t("catalog_item.new.title")}>
            <div className="max-w-2xl space-y-4">
                <BackButton to={listPath} />
                <CatalogItemForm onSubmit={handleSubmit} isLoading={mutation.isPending} />
            </div>
        </Layout>
    );
}

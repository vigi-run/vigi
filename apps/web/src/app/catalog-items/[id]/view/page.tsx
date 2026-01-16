import { getCatalogItemOptions, useDeleteCatalogItemMutation } from "@/api/catalogItem-manual";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Edit, Loader2, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CatalogItemType } from "@/types/catalogItem";
import Layout from "@/layout";
import { BackButton } from "@/components/back-button";
import { useOrganizationStore } from "@/store/organization";

export default function CatalogItemDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentOrganization: organization } = useOrganizationStore();

    const { data: item, isLoading } = useQuery(getCatalogItemOptions(id!));
    const deleteMutation = useDeleteCatalogItemMutation();

    const handleDelete = async () => {
        if (confirm(t("common.confirm_delete_title"))) {
            await deleteMutation.mutateAsync(id!);
            navigate("..");
        }
    };

    if (isLoading) return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-8" />;
    if (!item) return <div className="text-center mt-8">{t("common.not_found")}</div>;

    const listPath = organization?.slug ? `/${organization.slug}/catalog-items` : "/catalog-items";

    return (
        <Layout pageName={item.name || item.productKey || t("catalog_item.details.title")}>
            <div className="max-w-3xl space-y-4">
                <BackButton to={listPath} />

                <div className="flex justify-end gap-2">
                    <Link to={`/catalog-items/${item.id}/edit`}>
                        <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            {t("common.edit")}
                        </Button>
                    </Link>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash className="h-4 w-4 mr-2" />
                        {t("common.delete")}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t("catalog_item.details.general")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold text-sm">{t("catalog_item.fields.name")}</h4>
                                <p>{item.name}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{t("catalog_item.fields.type")}</h4>
                                <p>{item.type === CatalogItemType.PRODUCT ? t("catalog_item.type.product") : t("catalog_item.type.service")}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{t("catalog_item.fields.productKey")}</h4>
                                <p>{item.productKey}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{t("catalog_item.fields.price")}</h4>
                                <p>{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{t("catalog_item.fields.cost")}</h4>
                                <p>{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'BRL' }).format(item.cost)}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{t("catalog_item.fields.unit")}</h4>
                                <p>{item.unit}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{t("catalog_item.fields.ncmNbs")}</h4>
                                <p>{item.ncmNbs}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{t("catalog_item.fields.taxRate")}</h4>
                                <p>{item.taxRate}%</p>
                            </div>
                        </div>
                        {item.notes && (
                            <div>
                                <h4 className="font-semibold text-sm">{t("catalog_item.fields.notes")}</h4>
                                <p className="whitespace-pre-wrap">{item.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {item.type === CatalogItemType.PRODUCT && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t("catalog_item.details.stock")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-sm">{t("catalog_item.fields.inStockQuantity")}</h4>
                                    <p>{item.inStockQuantity}</p>
                                </div>
                                {item.stockNotification && (
                                    <div>
                                        <h4 className="font-semibold text-sm">{t("catalog_item.fields.stockThreshold")}</h4>
                                        <p>{item.stockThreshold}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Layout>
    );
}

import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Layout from "@/layout";
import { BackButton } from "@/components/back-button";
import { InvoiceForm } from "../../components/invoice-form";
import { getInvoiceOptions, useUpdateInvoiceMutation } from "@/api/invoice-manual";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { InvoiceFormValues } from "@/schemas/invoice.schema";

export default function EditInvoicePage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const updateMutation = useUpdateInvoiceMutation();

    const { data: invoice, isLoading } = useQuery(getInvoiceOptions(id!));

    const handleSubmit = async (data: InvoiceFormValues) => {
        if (!id) return;

        try {
            await updateMutation.mutateAsync({
                id,
                data: {
                    ...data,
                    nfId: data.nfId || undefined,
                    nfStatus: data.nfStatus || undefined,
                    nfLink: data.nfLink || undefined,
                    bankInvoiceId: data.bankInvoiceId || undefined,
                    bankInvoiceStatus: data.bankInvoiceStatus || undefined,
                    items: data.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount,
                        catalogItemId: item.catalogItemId || undefined
                    }))
                },
            });
            toast.success(t("invoice.updated_successfully"));
            navigate(`/invoices/${id}`);
        } catch (error) {
            toast.error(t("common.error_occurred"));
        }
    };

    if (isLoading) {
        return (
            <Layout pageName={t("invoice.edit_invoice")}>
                <Skeleton className="h-10 w-40 mb-6" />
                <Skeleton className="h-[500px] w-full" />
            </Layout>
        );
    }

    if (!invoice) return null;

    return (
        <Layout pageName={t("invoice.edit_invoice")}>
            <div className="mb-6">
                <BackButton />
                <h1 className="text-2xl font-bold mt-4">{t("invoice.edit_invoice")}</h1>
            </div>

            <InvoiceForm
                defaultValues={{
                    clientId: invoice.clientId,
                    number: invoice.number,
                    discount: invoice.discount || 0,
                    nfId: invoice.nfId,
                    nfStatus: invoice.nfStatus,
                    bankInvoiceId: invoice.bankInvoiceId,
                    bankInvoiceStatus: invoice.bankInvoiceStatus,
                    date: invoice.date ? new Date(invoice.date) : undefined,
                    dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
                    terms: invoice.terms,
                    notes: invoice.notes,
                    items: invoice.items.map(item => ({
                        catalogItemId: item.catalogItemId,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount || 0,
                    }))
                }}
                onSubmit={handleSubmit}
                isLoading={updateMutation.isPending}
                submitLabel={t("common.save")}
            />
        </Layout>
    );
}

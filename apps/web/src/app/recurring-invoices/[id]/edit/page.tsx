import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useOrganizationStore } from "@/store/organization";
import Layout from "@/layout";
import { RecurringInvoiceForm } from "../../components/recurring-invoice-form";
import { useUpdateRecurringInvoiceMutation, getRecurringInvoiceOptions } from "@/api/recurring-invoice";
import type { RecurringInvoiceFormValues } from "@/schemas/recurring-invoice.schema";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditRecurringInvoicePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { currentOrganization: organization } = useOrganizationStore();
    const orgId = organization?.id;

    const { data: invoice, isLoading } = useQuery({
        ...getRecurringInvoiceOptions(id!),
        enabled: !!id,
    });

    const updateMutation = useUpdateRecurringInvoiceMutation();

    const handleSubmit = async (data: RecurringInvoiceFormValues) => {
        if (!orgId || !id) return;

        try {
            await updateMutation.mutateAsync({
                id,
                data: {
                    ...data,
                    date: data.date,
                    dueDate: data.dueDate,
                    nextGenerationDate: data.nextGenerationDate,
                    frequency: data.frequency,
                    interval: data.interval,
                    dayOfMonth: data.dayOfMonth,
                    dayOfWeek: data.dayOfWeek,
                    month: data.month,
                    items: data.items.map((item) => ({
                        ...item,
                        catalogItemId: item.catalogItemId || undefined,
                    })),
                },
            });
            toast.success("Recurring invoice updated successfully");
            navigate("/recurring-invoices");
        } catch (error) {
            toast.error(t("common.error_occurred"));
        }
    };

    if (isLoading) {
        return (
            <Layout pageName="Edit Recurring Invoice">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </Layout>
        );
    }

    if (!invoice) return null;

    return (
        <Layout pageName={`Edit ${invoice.number}`}>
            <RecurringInvoiceForm
                defaultValues={{
                    ...invoice,
                    clientId: invoice.clientId,
                    number: invoice.number,
                    status: invoice.status,
                    items: invoice.items.map(i => ({
                        catalogItemId: i.catalogItemId,
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        discount: i.discount,
                    })),
                    date: invoice.date ? new Date(invoice.date) : undefined,
                    dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
                    nextGenerationDate: invoice.nextGenerationDate ? new Date(invoice.nextGenerationDate) : undefined,
                }}
                onSubmit={handleSubmit}
                isLoading={updateMutation.isPending}
                submitLabel={t("common.save")}
            />
        </Layout>
    );
}

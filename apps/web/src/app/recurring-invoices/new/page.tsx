import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOrganizationStore } from "@/store/organization";
import Layout from "@/layout";
import { RecurringInvoiceForm } from "../components/recurring-invoice-form";
import { useCreateRecurringInvoiceMutation } from "@/api/recurring-invoice";
import type { RecurringInvoiceFormValues } from "@/schemas/recurring-invoice.schema";

export default function NewRecurringInvoicePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentOrganization: organization } = useOrganizationStore();
    const orgId = organization?.id;

    const createMutation = useCreateRecurringInvoiceMutation();

    const handleSubmit = async (data: RecurringInvoiceFormValues) => {
        if (!orgId) return;

        try {
            await createMutation.mutateAsync({
                orgId,
                data: {
                    ...data,
                    date: data.date,
                    dueDate: data.dueDate,
                    nextGenerationDate: data.nextGenerationDate,
                },
            });
            toast.success("Recurring invoice created successfully");
            navigate("/recurring-invoices");
        } catch (error) {
            toast.error(t("common.error_occurred"));
        }
    };

    return (
        <Layout pageName="Create Recurring Invoice" backLink="/recurring-invoices">
            <RecurringInvoiceForm
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending}
                submitLabel={t("common.create")}
            />
        </Layout>
    );
}

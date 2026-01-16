import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Layout from "@/layout";
import { BackButton } from "@/components/back-button";
import { InvoiceForm } from "../components/invoice-form";
import { useCreateInvoiceMutation } from "@/api/invoice-manual";
import { useOrganizationStore } from "@/store/organization";
import type { InvoiceFormValues } from "@/schemas/invoice.schema";

export default function NewInvoicePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentOrganization: organization } = useOrganizationStore();
    const createMutation = useCreateInvoiceMutation();

    const handleSubmit = async (data: InvoiceFormValues) => {
        if (!organization?.id) return;

        try {
            await createMutation.mutateAsync({
                orgId: organization.id,
                data: {
                    ...data,
                    // Ensure nulls are converted to undefined
                    nfId: data.nfId || undefined,
                    nfStatus: data.nfStatus || undefined,
                    nfLink: data.nfLink || undefined,
                    bankInvoiceId: data.bankInvoiceId || undefined,
                    bankInvoiceStatus: data.bankInvoiceStatus || undefined,
                    // Ensure dates are defined, though schema makes them optional but DTO might need handling if API expects them
                    items: data.items.map(item => ({
                        ...item,
                        catalogItemId: item.catalogItemId || undefined
                    }))
                },
            });
            toast.success(t("invoice.created_successfully"));
            navigate(`/${organization.slug}/invoices`);
        } catch (error) {
            toast.error(t("common.error_occurred"));
        }
    };

    return (
        <Layout pageName={t("invoice.new_invoice")}>
            <div className="mb-6">
                <BackButton />
                <h1 className="text-2xl font-bold mt-4">{t("invoice.new_invoice")}</h1>
            </div>

            <InvoiceForm
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending}
                submitLabel={t("common.create")}
                defaultValues={{
                    date: new Date(),
                    dueDate: new Date(new Date().setDate(new Date().getDate() + 15)), // Default 15 days due date
                }}
            />
        </Layout>
    );
}

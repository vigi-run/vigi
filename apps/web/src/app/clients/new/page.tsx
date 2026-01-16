import Layout from "@/layout";
import { useLocalizedTranslation } from "@/hooks/useTranslation";
import { ClientForm } from "@/components/clients/client-form";
import { useCreateClientMutation } from "@/api/clients-manual";
import { useOrganizationStore } from "@/store/organization";
import { type ClientFormValues } from "@/schemas/client.schema";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BackButton } from "@/components/back-button";

const NewClientPage = () => {
    const { t } = useLocalizedTranslation();
    const { currentOrganization } = useOrganizationStore();
    const navigate = useNavigate();
    const createMutation = useCreateClientMutation();

    const handleSubmit = async (data: ClientFormValues) => {
        if (!currentOrganization?.id) return;

        try {
            await createMutation.mutateAsync({
                orgId: currentOrganization.id,
                data: data,
            });
            toast.success(t("clients.create_success", "Client created successfully"));
            navigate("../clients");
        } catch (error) {
            console.error(error);
            toast.error(t("clients.create_error", "Failed to create client"));
        }
    };

    return (
        <Layout pageName={t("clients.new.title", "New Client")}>
            <BackButton />
            <div className="max-w-2xl">
                <ClientForm
                    onSubmit={handleSubmit}
                    isSubmitting={createMutation.isPending}
                />
            </div>
        </Layout>
    );
};

export default NewClientPage;

import Layout from "@/layout";
import { useLocalizedTranslation } from "@/hooks/useTranslation";
import { ClientForm } from "@/components/clients/client-form";
import { useUpdateClientMutation, getClientOptions } from "@/api/clients-manual";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BackButton } from "@/components/back-button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientFormValues } from "@/schemas/client.schema";

const EditClientPage = () => {
    const { t } = useLocalizedTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const updateMutation = useUpdateClientMutation();

    const { data: client, isLoading } = useQuery({
        ...getClientOptions(id!),
        enabled: !!id,
    });

    const handleSubmit = async (data: ClientFormValues) => {
        if (!id) return;

        try {
            await updateMutation.mutateAsync({
                id: id,
                data: data,
            });
            toast.success(t("clients.update_success", "Client updated successfully"));
            navigate("../clients");
        } catch (error) {
            console.error(error);
            toast.error(t("clients.update_error", "Failed to update client"));
        }
    };

    if (isLoading) {
        return (
            <Layout pageName={t("clients.edit.loading", "Loading Client...")}>
                <BackButton />
                <div className="max-w-2xl space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </Layout>
        );
    }

    if (!client) {
        return (
            <Layout pageName={t("clients.edit.not_found", "Client Not Found")}>
                <BackButton />
                <div className="p-4">
                    {t("clients.errors.not_found_message", "The requested client does not exist.")}
                </div>
            </Layout>
        );
    }

    return (
        <Layout pageName={`${t("clients.edit.title", "Edit Client")}: ${client.name}`}>
            <BackButton />
            <div className="max-w-2xl">
                {/* @ts-ignore */}
                <ClientForm
                    initialValues={client as any}
                    onSubmit={handleSubmit}
                    isSubmitting={updateMutation.isPending}
                />
            </div>
        </Layout>
    );
};

export default EditClientPage;

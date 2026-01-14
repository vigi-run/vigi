import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getClientOptions, useUpdateClientMutation } from "@/api/clients-manual";
import Layout from "@/layout";
import { BackButton } from "@/components/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalizedTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ClientStatus } from "@/types/client";

const ClientDetailsPage = () => {
    const { t, i18n } = useLocalizedTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const updateMutation = useUpdateClientMutation();

    const { data: client, isLoading } = useQuery({
        ...getClientOptions(id!),
        enabled: !!id,
    });

    const handleStatusChange = async (newStatus: ClientStatus) => {
        if (!client) return;
        try {
            await updateMutation.mutateAsync({
                id: client.id,
                data: { status: newStatus },
            });
            queryClient.invalidateQueries({ queryKey: ['client', client.id] });
            toast.success(t("clients.status_updated", "Status updated successfully"));
        } catch (error) {
            console.error(error);
            toast.error(t("clients.status_update_error", "Failed to update status"));
        }
    };

    if (isLoading) {
        return (
            <Layout pageName={t("clients.details.loading", "Loading Client...")}>
                <BackButton />
                <div className="max-w-4xl space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </Layout>
        );
    }

    if (!client) {
        return (
            <Layout pageName={t("clients.details.not_found", "Client Not Found")}>
                <BackButton />
                <div className="p-4">
                    {t("clients.errors.not_found_message", "The requested client does not exist.")}
                </div>
            </Layout>
        );
    }

    const formattedCreatedAt = format(new Date(client.createdAt), "PPp", {
        locale: i18n.language === "pt-BR" ? ptBR : enUS,
    });

    const getStatusBadgeVariant = (status: ClientStatus) => {
        switch (status) {
            case 'active': return 'outline';
            case 'inactive': return 'secondary';
            case 'blocked': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <Layout pageName={client.name}>
            <div className="flex items-center justify-between mb-6">
                <BackButton />
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{t("common.status", "Status")}:</span>
                        <Select
                            value={client.status}
                            onValueChange={(v) => handleStatusChange(v as ClientStatus)}
                            disabled={updateMutation.isPending}
                        >
                            <SelectTrigger className="w-[130px]">
                                <Badge variant={getStatusBadgeVariant(client.status)}>
                                    {t(`clients.status.${client.status}`, client.status)}
                                </Badge>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">{t("clients.status.active", "Active")}</SelectItem>
                                <SelectItem value="inactive">{t("clients.status.inactive", "Inactive")}</SelectItem>
                                <SelectItem value="blocked">{t("clients.status.blocked", "Blocked")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={() => navigate("edit")}>
                        <Edit className="w-4 h-4 mr-2" />
                        {t("common.edit", "Edit")}
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl space-y-6">
                {/* Company Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("clients.details.company_data", "Company Data")}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">{t("clients.name", "Name")}</div>
                            <div className="text-lg font-semibold">{client.name}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">{t("clients.classification", "Classification")}</div>
                            <div className="mt-1">
                                <Badge variant={client.classification === 'company' ? 'default' : 'secondary'}>
                                    {t(`clients.classification.${client.classification}`, client.classification)}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">
                                {client.classification === 'company' ? t("clients.form.cnpj", "CNPJ") : t("clients.form.cpf", "CPF")}
                            </div>
                            <div>{client.idNumber || "-"}</div>
                        </div>
                        {client.classification === 'company' && (
                            <div>
                                <div className="text-sm font-medium text-muted-foreground">{t("clients.form.vat_number", "VAT Number")}</div>
                                <div>{client.vatNumber || "-"}</div>
                            </div>
                        )}
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">{t("common.created_at", "Created At")}</div>
                            <div>{formattedCreatedAt}</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Address Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t("clients.details.address_data", "Address Data")}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">{t("clients.form.address", "Address")}</div>
                            <div>{client.address1 || "-"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">{t("clients.form.address_number", "Number")}</div>
                            <div>{client.addressNumber || "-"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">{t("clients.form.city", "City")}</div>
                            <div>{client.city || "-"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">{t("clients.form.state", "State")}</div>
                            <div>{client.state || "-"}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">{t("clients.form.postal_code", "Postal Code")}</div>
                            <div>{client.postalCode || "-"}</div>
                        </div>
                        {client.address2 && (
                            <div className="col-span-2">
                                <div className="text-sm font-medium text-muted-foreground">{t("clients.form.complement", "Complement")}</div>
                                <div>{client.address2}</div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default ClientDetailsPage;

import { useNavigate, useParams } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { getClientOptions, useUpdateClientMutation } from "@/api/clients-manual";
import { getInvoicesInfiniteOptions } from "@/api/invoice-manual";
import Layout from "@/layout";
import { BackButton } from "@/components/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalizedTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Mail, Phone, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { ClientStatus } from "@/types/client";
import { useOrganizationStore } from "@/store/organization";
import EmptyList from "@/components/empty-list";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useCallback } from "react";

const ClientDetailsPage = () => {
    const { t, i18n } = useLocalizedTranslation();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const updateMutation = useUpdateClientMutation();
    const { currentOrganization } = useOrganizationStore();

    const { data: client, isLoading } = useQuery({
        ...getClientOptions(id!),
        enabled: !!id,
    });

    // Invoices Query
    const {
        data: invoicesData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isLoadingInvoices
    } = useInfiniteQuery({
        ...getInvoicesInfiniteOptions(currentOrganization?.id || '', {
            clientId: id,
            limit: 20,
        }),
        enabled: !!currentOrganization?.id && !!id,
    });

    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const { ref: observerRef } = useIntersectionObserver<HTMLDivElement>(handleObserver);

    const invoices = invoicesData?.pages.flatMap((page) => page.data).filter((e) => !!e) || [];

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
                <div className="max-w-6xl space-y-4">
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(i18n.language, {
            style: 'currency',
            currency: 'BRL', // Assuming BRL, could be dynamic
        }).format(value);
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
                                    {t(`clients.status.${client.status}`, client.status) as string}
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

            <div className="space-y-6">
                {/* Info Cards Row */}
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Company Details */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold">{t("clients.details.company_data", "Company Data")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <div className="text-xs font-medium text-muted-foreground uppercase">{t("clients.name", "Name")}</div>
                                <div className="font-medium truncate" title={client.name}>{client.name}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">{t("clients.form.classification", "Type")}</div>
                                    <Badge variant="secondary" className="mt-1">
                                        {t(`clients.classification.${client.classification}`, client.classification)}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                        {client.classification === 'company' ? t("clients.form.cnpj", "CNPJ") : t("clients.form.cpf", "CPF")}
                                    </div>
                                    <div className="font-medium">{client.idNumber || "-"}</div>
                                </div>
                            </div>
                            {client.classification === 'company' && (
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">{t("clients.form.vat_number", "VAT Number")}</div>
                                    <div className="font-medium">{client.vatNumber || "-"}</div>
                                </div>
                            )}
                            <div>
                                <div className="text-xs font-medium text-muted-foreground uppercase">{t("common.created_at", "Created At")}</div>
                                <div className="text-sm text-muted-foreground">{formattedCreatedAt}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Details */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold">{t("clients.details.address_data", "Address Data")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <div className="text-xs font-medium text-muted-foreground uppercase">{t("clients.form.address", "Address")}</div>
                                <div className="font-medium">{client.address1 || "-"}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">{t("clients.form.address_number", "Number")}</div>
                                    <div className="font-medium">{client.addressNumber || "-"}</div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">{t("clients.form.postal_code", "CEP")}</div>
                                    <div className="font-medium">{client.postalCode || "-"}</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-muted-foreground uppercase">{t("clients.form.city", "City")} / {t("clients.form.state", "State")}</div>
                                <div className="font-medium">{client.city || "-"} / {client.state || "-"}</div>
                            </div>
                            {client.address2 && (
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">{t("clients.form.complement", "Complement")}</div>
                                    <div className="font-medium">{client.address2}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact Details */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold">{t("clients.form.contacts", "Contacts")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {client.contacts && client.contacts.length > 0 ? (
                                <div className="space-y-4">
                                    {client.contacts.map((contact) => (
                                        <div key={contact.id} className="flex gap-3 pb-3 border-b last:border-0 last:pb-0">
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-sm truncate">{contact.name}</div>
                                                {contact.email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                        <Mail className="h-3 w-3" />
                                                        <span className="truncate" title={contact.email}>{contact.email}</span>
                                                    </div>
                                                )}
                                                {contact.phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                                        <Phone className="h-3 w-3" />
                                                        <span className="truncate">{contact.phone}</span>
                                                    </div>
                                                )}
                                                {contact.role && (
                                                    <Badge variant="outline" className="text-[10px] h-4 mt-1 px-1 py-0 font-normal">
                                                        {contact.role}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground italic py-4 text-center">
                                    {t("clients.no_contacts", "No contacts added")}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="invoices" className="w-full">
                    <TabsList>
                        <TabsTrigger value="invoices">{t("invoice.title_plural", "Invoices")}</TabsTrigger>
                        <TabsTrigger value="recurring">{t("invoice.recurring_title", "Recurring Invoices")}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="invoices" className="mt-4">
                        <Card>
                            <CardContent className="p-0">
                                {isLoadingInvoices ? (
                                    <div className="p-4 space-y-2">
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ) : invoices.length > 0 ? (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{t("invoice.form.number", "Number")}</TableHead>
                                                    <TableHead>{t("invoice.form.date", "Date")}</TableHead>
                                                    <TableHead>{t("invoice.form.due_date", "Due Date")}</TableHead>
                                                    <TableHead className="text-right">{t("invoice.form.total", "Total")}</TableHead>
                                                    <TableHead className="w-[100px]">{t("common.status", "Status")}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {invoices.map((invoice) => (
                                                    <TableRow
                                                        key={invoice.id}
                                                        className="cursor-pointer hover:bg-muted/50"
                                                        onClick={() => navigate(`/${currentOrganization?.slug}/invoices/${invoice.id}`)}
                                                    >
                                                        <TableCell className="font-medium">{invoice.number}</TableCell>
                                                        <TableCell>
                                                            {invoice.date ? format(new Date(invoice.date), 'dd/MM/yyyy') : '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {invoice.dueDate ? (
                                                                <span className={(() => {
                                                                    if (invoice.status === 'PAID') return '';
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    const due = new Date(invoice.dueDate);
                                                                    due.setHours(0, 0, 0, 0);
                                                                    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                                    if (diff < 0) return 'text-destructive font-medium';
                                                                    if (diff <= 2) return 'text-orange-500 font-medium';
                                                                    return '';
                                                                })()}>
                                                                    {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                                                                </span>
                                                            ) : '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(invoice.total)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className={`
                                                                inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                                                                ${invoice.status === 'PAID' ? 'border-transparent bg-green-500 text-white hover:bg-green-600' : ''}
                                                                ${invoice.status === 'SENT' ? 'border-transparent bg-blue-500 text-white hover:bg-blue-600' : ''}
                                                                ${invoice.status === 'DRAFT' ? 'text-foreground' : ''}
                                                                ${invoice.status === 'CANCELLED' ? 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80' : ''}
                                                            `}>
                                                                {t(`invoice.status.${invoice.status.toLowerCase()}`, invoice.status) as string}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                        {/* Sentinel for infinite scroll */}
                                        <div ref={observerRef} className="h-1" />
                                        {isFetchingNextPage && (
                                            <div className="p-4 flex justify-center">
                                                <Skeleton className="h-6 w-24" />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <EmptyList
                                        title={t("invoice.empty.title", "No invoices found")}
                                        text={t("invoice.empty.description_client", "This client has no invoices yet.")}
                                        actionText={t("invoice.new_invoice", "Create Invoice")}
                                        onClick={() => navigate(`/${currentOrganization?.slug}/invoices/new`)}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="recurring" className="mt-4">
                        <Card>
                            <CardContent className="h-40 flex items-center justify-center text-muted-foreground italic">
                                {t("common.coming_soon", "Coming Soon")} :)
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};

export default ClientDetailsPage;

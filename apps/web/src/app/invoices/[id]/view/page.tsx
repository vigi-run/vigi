import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Layout from "@/layout";
import { BackButton } from "@/components/back-button";
import { getInvoiceOptions, useUpdateInvoiceMutation, getInvoiceEmailsOptions } from "@/api/invoice-manual";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InvoiceStatus } from "@/types/invoice";
import { client } from "@/api/client.gen";
import { useOrganizationStore } from "@/store/organization";
import { generateInterCharge } from "@/api/inter";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Printer } from "lucide-react";

export default function InvoiceDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const updateMutation = useUpdateInvoiceMutation();
    const { currentOrganization: organization } = useOrganizationStore();
    const { data: invoice, isLoading } = useQuery(getInvoiceOptions(id!));
    const { data: emails } = useQuery(getInvoiceEmailsOptions(id!, !!id));
    const [isGeneratingCharge, setIsGeneratingCharge] = useState(false);

    // Fetch client details for display
    const { data: clientData } = useQuery({
        queryKey: ['client', invoice?.clientId],
        queryFn: async () => {
            const res = await client.get({ url: `/clients/${invoice?.clientId}` });
            // @ts-ignore
            return res.data.data;
        },
        enabled: !!invoice?.clientId
    });


    const handleStatusChange = async (newStatus: InvoiceStatus) => {
        if (!id) return;
        try {
            await updateMutation.mutateAsync({
                id,
                data: { status: newStatus }
            });
            toast.success(t("invoice.status_updated"));
        } catch (error) {
            toast.error(t("common.error_occurred"));
        }
    };

    const handleGenerateCharge = async () => {
        if (!organization || !id) return;
        setIsGeneratingCharge(true);
        try {
            const provider = (organization as any).bank_provider || 'inter';

            if (provider === 'inter') {
                await generateInterCharge(organization.id!, id);
                toast.success("Charge generated successfully via Banco Inter");
            } else {
                toast.error(`Provider ${provider} not implemented yet`);
                // Placeholder for other providers
            }

            queryClient.invalidateQueries({ queryKey: getInvoiceOptions(id).queryKey });
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate charge");
        } finally {
            setIsGeneratingCharge(false);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30';
            case 'SENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30';
            case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    if (isLoading) {
        return (
            <Layout pageName={t("invoice.details")}>
                <Skeleton className="h-10 w-40 mb-6" />
                <Skeleton className="h-[500px] w-full" />
            </Layout>
        );
    }

    if (!invoice) return null;

    return (
        <Layout pageName={t("invoice.details")}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <h1 className="text-2xl font-bold">{t("invoice.details")}</h1>
                    <Badge variant="outline" className={`border-0 ${statusColor(invoice.status)}`}>
                        {t(`invoice.status.${invoice.status.toLowerCase()}`)}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={invoice.status} onValueChange={(v) => handleStatusChange(v as InvoiceStatus)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DRAFT">{t("invoice.status.draft")}</SelectItem>
                            <SelectItem value="SENT">{t("invoice.status.sent")}</SelectItem>
                            <SelectItem value="PAID">{t("invoice.status.paid")}</SelectItem>
                            <SelectItem value="CANCELLED">{t("invoice.status.cancelled")}</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center rounded-md shadow-sm">
                        <Button
                            className="rounded-r-none border-r-0"
                            onClick={() => navigate("edit")}
                        >
                            {t("invoice.edit_and_actions")}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="px-3 rounded-l-none" variant="default">
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {!invoice.bankInvoiceId && (
                                    <DropdownMenuItem onClick={handleGenerateCharge} disabled={isGeneratingCharge}>
                                        {isGeneratingCharge ? "Generating..." : "Generate Charge"}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => navigate(`email`)}>
                                    <Mail className="h-4 w-4 mr-2" />
                                    {t("invoice.email.send")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => window.print()}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    {t("common.print")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>


            <Card className="max-w-4xl mx-auto print:shadow-none print:border-none">
                <CardHeader className="flex flex-row justify-between border-b pb-8">
                    <div>
                        <div className="text-2xl font-bold tracking-tight mb-1">{organization?.name}</div>
                        {/* We could add organization address here if available in store */}
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-muted-foreground">{t("invoice.invoice_number")}</div>
                        <div className="text-xl font-bold">{invoice.number}</div>

                        <div className="mt-4 text-sm text-muted-foreground">{t("invoice.date_issued")}</div>
                        <div>{invoice.date ? format(new Date(invoice.date), 'PPP') : '-'}</div>

                        {invoice.dueDate && (
                            <>
                                <div className="mt-2 text-sm text-muted-foreground">{t("invoice.due_date")}</div>
                                <div className="text-orange-600 font-medium">{format(new Date(invoice.dueDate), 'PPP')}</div>
                            </>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                    {/* Bill To */}
                    <div>
                        <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("invoice.bill_to")}</div>
                        {clientData ? (
                            <div className="text-lg font-medium">
                                <div>{clientData.name}</div>
                                <div className="text-base text-muted-foreground font-normal whitespace-pre-line">
                                    {clientData.address1}, {clientData.addressNumber}
                                    {clientData.address2 && <div>{clientData.address2}</div>}
                                    <div>{clientData.city}, {clientData.state} {clientData.postalCode}</div>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">{clientData.email}</div>
                            </div>
                        ) : (
                            <Skeleton className="h-20 w-48" />
                        )}
                    </div>

                    {/* Fiscal Information */}
                    {(invoice.nfId || invoice.bankInvoiceId || invoice.nfLink) && (
                        <div className="mt-6 mb-6">
                            <h3 className="text-lg font-semibold mb-2">{t("invoice.form.fiscal_info")}</h3>
                            <div className="grid grid-cols-2 gap-4 border p-4 rounded-md bg-muted/20">
                                {(invoice.nfId || invoice.nfLink) && (
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">{t("invoice.form.fiscal_info")}</div>
                                        {invoice.nfId && <div className="text-sm font-medium">{invoice.nfId}</div>}
                                        {invoice.nfStatus && (
                                            <div className="text-xs text-muted-foreground">
                                                {t(`invoice.status.${invoice.nfStatus.toLowerCase()}`)}
                                            </div>
                                        )}
                                        {invoice.nfLink && (
                                            <div className="mt-1">
                                                <a href={invoice.nfLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                    {t("invoice.form.nf_link")}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {invoice.bankInvoiceId && (
                                    <div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase">{t("invoice.form.bank_invoice_id")}</div>
                                        <div className="text-sm font-medium">{invoice.bankInvoiceId}</div>
                                        {invoice.bankInvoiceStatus && (
                                            <div className="text-xs text-muted-foreground">
                                                {t(`invoice.status.${invoice.bankInvoiceStatus.toLowerCase()}`)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                                <tr>
                                    <th className="px-4 py-3">{t("invoice.item_description")}</th>
                                    <th className="px-4 py-3 text-right">{t("invoice.item_quantity")}</th>
                                    <th className="px-4 py-3 text-right">{t("invoice.item_price")}</th>
                                    <th className="px-4 py-3 text-right">{t("invoice.form.discount")}</th>
                                    <th className="px-4 py-3 text-right">{t("invoice.item_total")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoice.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 font-medium">{item.description}</td>
                                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                                        <td className="px-4 py-3 text-right text-red-500">
                                            {item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-muted/30 font-medium text-sm">
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-right text-muted-foreground">{t("invoice.form.subtotal")}</td>
                                    <td className="px-4 py-2 text-right">
                                        {formatCurrency(invoice.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0))}
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={4} className="px-4 py-2 text-right text-red-500">{t("invoice.form.total_discount")}</td>
                                    <td className="px-4 py-2 text-right text-red-500">
                                        -{formatCurrency(invoice.items.reduce((acc, item) => acc + item.discount, 0) + (invoice.discount || 0))}
                                    </td>
                                </tr>
                                <tr className="border-t border-muted-foreground/20">
                                    <td colSpan={4} className="px-4 py-3 text-right text-lg font-bold text-primary">{t("invoice.form.final_total")}</td>
                                    <td className="px-4 py-3 text-right text-lg font-bold text-primary">{formatCurrency(invoice.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Notes & Terms */}
                    {(invoice.notes || invoice.terms) && (
                        <div className="grid md:grid-cols-2 gap-8 pt-4">
                            {invoice.notes && (
                                <div>
                                    <div className="text-sm font-semibold text-muted-foreground mb-1">{t("invoice.notes")}</div>
                                    <div className="text-sm whitespace-pre-wrap rounded-md bg-muted/30 p-3">{invoice.notes}</div>
                                </div>
                            )}
                            {invoice.terms && (
                                <div>
                                    <div className="text-sm font-semibold text-muted-foreground mb-1">{t("invoice.terms")}</div>
                                    <div className="text-sm whitespace-pre-wrap rounded-md bg-muted/30 p-3">{invoice.terms}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Email History */}
                    {emails && emails.length > 0 && (
                        <div className="mt-8 pt-8 border-t">
                            <h3 className="text-lg font-semibold mb-4">{t("invoice.email.history")}</h3>
                            <div className="space-y-4">
                                {emails.map((email) => (
                                    <div key={email.id} className="flex justify-between items-center p-4 border rounded-lg bg-muted/10">
                                        <div>
                                            <div className="font-medium capitalize">{t(`invoice.email.type.${email.type.toLowerCase() as "created"}`)}</div>
                                            <div className="text-sm text-muted-foreground">{format(new Date(email.createdAt), "PPp")}</div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline">{email.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="justify-center border-t py-6 bg-muted/5 text-muted-foreground text-sm">
                    {t("invoice.thank_you")}
                </CardFooter>
            </Card>
        </Layout>
    );
}

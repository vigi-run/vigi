import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import Layout from "@/layout";
import { BackButton } from "@/components/back-button";
import { getRecurringInvoiceOptions, useUpdateRecurringInvoiceMutation } from "@/api/recurring-invoice";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RecurringInvoiceStatus } from "@/types/recurring-invoice";
import { client } from "@/api/client.gen";
import { useOrganizationStore } from "@/store/organization";

export default function RecurringInvoiceDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const updateMutation = useUpdateRecurringInvoiceMutation();
    const { currentOrganization: organization } = useOrganizationStore();
    const { data: invoice, isLoading } = useQuery(getRecurringInvoiceOptions(id!));

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


    const handleStatusChange = async (newStatus: RecurringInvoiceStatus) => {
        if (!id) return;
        try {
            await updateMutation.mutateAsync({
                id,
                data: { status: newStatus }
            });
            toast.success("Status updated");
        } catch (error) {
            toast.error(t("common.error_occurred"));
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30';
            case 'PAUSED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30';
            case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    if (isLoading) {
        return (
            <Layout pageName="Recurring Invoice Details">
                <Skeleton className="h-10 w-40 mb-6" />
                <Skeleton className="h-[500px] w-full" />
            </Layout>
        );
    }

    if (!invoice) return null;

    return (
        <Layout pageName="Recurring Invoice Details">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <h1 className="text-2xl font-bold">Recurring Invoice Details</h1>
                    <Badge variant="outline" className={`border-0 ${statusColor(invoice.status)}`}>
                        {invoice.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={invoice.status} onValueChange={(v) => handleStatusChange(v as RecurringInvoiceStatus)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PAUSED">Paused</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={() => navigate("edit")}>{t("common.edit")}</Button>
                    <Button variant="outline" onClick={() => window.print()}>{t("common.print")}</Button>
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

                        <div className="mt-4 text-sm text-muted-foreground">Next Generation</div>
                        <div>{invoice.nextGenerationDate ? format(new Date(invoice.nextGenerationDate), 'PPP') : '-'}</div>

                        {invoice.dueDate && (
                            <>
                                <div className="mt-2 text-sm text-muted-foreground">Due Date (Template)</div>
                                <div>{format(new Date(invoice.dueDate), 'PPP')}</div>
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

                </CardContent>
                <CardFooter className="justify-center border-t py-6 bg-muted/5 text-muted-foreground text-sm">
                    {t("invoice.thank_you")}
                </CardFooter>
            </Card>
        </Layout>
    );
}

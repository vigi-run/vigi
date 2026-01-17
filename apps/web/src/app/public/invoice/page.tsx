import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getPublicInvoiceOptions } from "@/api/invoice-manual";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import QRCode from "react-qr-code";
import { Copy, CheckCircle, AlertTriangle, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function PublicInvoicePage() {
  // ...
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: invoice, isLoading, error } = useQuery(getPublicInvoiceOptions(id!, !!id));

  const handleCopyPix = () => {
    if (invoice?.bankPixPayload) {
      navigator.clipboard.writeText(invoice.bankPixPayload);
      toast.success(t("common.link_copied"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Fatura não encontrada</h2>
          <p className="text-muted-foreground">Não foi possível encontrar a fatura solicitada. Verifique o link e tente novamente.</p>
        </Card>
      </div>
    );
  }

  const isPaid = invoice.status === 'PAID' || invoice.bankInvoiceStatus === 'PAID' || invoice.bankInvoiceStatus === 'RECEIVED';
  const statusColor = isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  const statusText = isPaid ? t("invoice.status.paid") : t("invoice.status.pending");

  return (
    <div className="dark min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white text-foreground font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Actions Bar */}
        <div className="flex justify-end gap-2 print:hidden">
          <Button variant="secondary" size="sm" onClick={() => window.print()} className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border">
            <Printer className="h-4 w-4 mr-2" />
            {t("common.print")}
          </Button>
          {invoice.nfLink && (
            <Button variant="secondary" size="sm" asChild className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border">
              <a href={invoice.nfLink} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </a>
            </Button>
          )}
        </div>

        {/* Status Banner (if paid) */}
        {isPaid && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3 text-green-400 shadow-sm">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Esta fatura já foi paga. Obrigado!</span>
          </div>
        )}

        <Card className="shadow-2xl print:shadow-none print:border-none overflow-hidden border-border bg-card print:bg-white print:text-black">
          <CardHeader className="flex flex-col md:flex-row justify-between border-b border-border pb-8 p-8">
            <div>
              {/* Organization Name */}
              <div className="text-3xl font-bold tracking-tight mb-2 text-primary print:text-black">Fatura</div>
              <div className="text-sm text-muted-foreground font-medium">#{invoice.number}</div>
            </div>
            <div className="mt-4 md:mt-0 text-left md:text-right space-y-1">
              {/* Dates */}
              <div>
                <span className="text-sm text-muted-foreground block">{t("invoice.date_issued")}</span>
                <span className="font-medium text-foreground">{invoice.date ? format(new Date(invoice.date), 'PPP') : '-'}</span>
              </div>
              {invoice.dueDate && (
                <div className="pt-2">
                  <span className="text-sm text-muted-foreground block">{t("invoice.due_date")}</span>
                  <span className={`font-bold text-lg ${isPaid ? 'text-green-500' : 'text-red-500'}`}>
                    {format(new Date(invoice.dueDate), 'PPP')}
                  </span>
                </div>
              )}
              <div className="pt-2">
                <Badge variant="outline" className={`mt-1 border-0 ${statusColor}`}>
                  {statusText}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Payment Actions (If not paid) */}
            {!isPaid && invoice.bankPixPayload && (
              <div className="bg-background/50 p-6 rounded-xl border border-border flex flex-col items-center justify-center gap-6 print:hidden">
                <div className="flex flex-col items-center text-center space-y-4 w-full max-w-sm">
                  <div className="font-semibold text-lg flex items-center gap-2 text-foreground">
                    <QRCode value={invoice.bankPixPayload} size={16} className="h-4 w-4 fill-white" />
                    Pagamento via Pix
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-border">
                    <QRCode value={invoice.bankPixPayload} size={180} />
                  </div>
                  <div className="w-full">
                    <Button
                      variant="outline"
                      className="w-full bg-secondary border-border text-secondary-foreground hover:bg-secondary/80"
                      onClick={handleCopyPix}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar "Copia e Cola"
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Bill To */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t("invoice.bill_to")}</div>
                {invoice.client ? (
                  <div className="text-lg font-medium text-foreground">
                    <div className="text-xl font-semibold">{invoice.client.name}</div>
                    <div className="text-base text-muted-foreground font-normal whitespace-pre-line text-sm mt-2 leading-relaxed">
                      {invoice.client.address1 && <span>{invoice.client.address1}, {invoice.client.addressNumber}</span>}
                      {invoice.client.address2 && <div className="mt-0.5">{invoice.client.address2}</div>}
                      {invoice.client.city && <div className="mt-0.5">{invoice.client.city}, {invoice.client.state} {invoice.client.postalCode}</div>}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2 font-mono">
                      {invoice.client.contacts?.[0]?.email}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">Informações do cliente indisponíveis</div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-border rounded-lg overflow-hidden bg-background/50">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                  <tr>
                    <th className="px-4 py-3">{t("invoice.item_description")}</th>
                    <th className="px-4 py-3 text-right">{t("invoice.item_quantity")}</th>
                    <th className="px-4 py-3 text-right">{t("invoice.item_price")}</th>
                    <th className="px-4 py-3 text-right">{t("invoice.form.discount")}</th>
                    <th className="px-4 py-3 text-right">{t("invoice.item_total")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="text-foreground">
                      <td className="px-4 py-3 font-medium">{item.description}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right text-red-400">
                        {item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 font-medium text-sm">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right text-muted-foreground pt-4">{t("invoice.form.subtotal")}</td>
                    <td className="px-4 py-2 text-right text-foreground pt-4">
                      {formatCurrency(invoice.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0))}
                    </td>
                  </tr>
                  {(invoice.items.reduce((acc, item) => acc + item.discount, 0) + (invoice.discount || 0)) > 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-1 text-right text-red-400">{t("invoice.form.total_discount")}</td>
                      <td className="px-4 py-1 text-right text-red-400">
                        -{formatCurrency(invoice.items.reduce((acc, item) => acc + item.discount, 0) + (invoice.discount || 0))}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={5} className="px-4 py-2">
                      <div className="border-t border-border w-full md:w-1/3 ml-auto"></div>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-1 pb-4 text-right text-lg font-bold text-primary">{t("invoice.form.final_total")}</td>
                    <td className="px-4 py-1 pb-4 text-right text-lg font-bold text-primary">{formatCurrency(invoice.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                {invoice.notes && (
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("invoice.notes")}</div>
                    <div className="text-sm whitespace-pre-wrap rounded-lg bg-background/50 border border-border p-4 text-muted-foreground leading-relaxed">{invoice.notes}</div>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("invoice.terms")}</div>
                    <div className="text-sm whitespace-pre-wrap rounded-lg bg-background/50 border border-border p-4 text-muted-foreground leading-relaxed">{invoice.terms}</div>
                  </div>
                )}
              </div>
            )}

          </CardContent>
          <CardFooter className="justify-center py-8 bg-card text-muted-foreground text-sm border-t border-border">
            {t("invoice.thank_you")}
          </CardFooter>
        </Card>

        <div className="text-center text-xs text-muted-foreground pb-8 print:hidden">
          Desenvolvido por <a href="https://vigi.neves.run" target="_blank" className="hover:underline hover:text-foreground font-medium transition-colors">Vigi</a>
        </div>
      </div >
    </div >
  );
}

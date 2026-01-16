import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { usePreviewInvoiceEmailMutation, useSendInvoiceEmailMutation } from "@/api/invoice-manual";
import type { InvoiceEmail } from "@/types/invoice";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import { RichEditor } from "@/components/ui/rich-editor/rich-editor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useOrganizationStore } from "@/store/organization";

export default function InvoiceEmailPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id: invoiceId } = useParams<{ id: string }>();
    const [type, setType] = useState<InvoiceEmail['type']>('created');
    const [subject, setSubject] = useState("");
    const [html, setHtml] = useState("");
    const currentOrganization = useOrganizationStore((state) => state.currentOrganization);

    // Preview mutation
    const previewMutation = usePreviewInvoiceEmailMutation();
    const sendMutation = useSendInvoiceEmailMutation();

    useEffect(() => {
        if (invoiceId) {
            // Clear old content while loading new template
            setHtml("");
            setSubject("");
            loadPreview(type);
        }
    }, [type, invoiceId]);

    const loadPreview = async (emailType: InvoiceEmail['type']) => {
        if (!invoiceId) return;
        try {
            const data = await previewMutation.mutateAsync({ id: invoiceId, type: emailType });
            setSubject(data.subject);
            setHtml(data.html);
        } catch (error) {
            toast.error(t("common.error_occurred"));
        }
    };

    const handleSend = async () => {
        if (!invoiceId) return;
        try {
            await sendMutation.mutateAsync({
                id: invoiceId,
                type,
                subject,
                html
            });
            toast.success(t("invoice.email_sent"));
            navigate(`/${currentOrganization?.slug}/invoices/${invoiceId}`);
        } catch (error) {
            toast.error(t("common.error_occurred"));
        }
    };

    if (!invoiceId) return null;

    return (
        <div className="container mx-auto py-6 max-w-5xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/${currentOrganization?.slug}/invoices/${invoiceId}`)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("invoice.email.send_title")}</h1>
                    <p className="text-muted-foreground">{t("invoice.email.send_description", "Compose and send your invoice email.")}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">{t("invoice.email.subject")}</Label>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                            <div className="min-h-[500px] border rounded-md">
                                <RichEditor
                                    key={type} // Force re-mount when template type changes
                                    value={html}
                                    onChange={setHtml}
                                    placeholder="Type '/' for commands..."
                                    organization={{
                                        name: currentOrganization?.name || '',
                                        logoUrl: currentOrganization?.image_url || undefined
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                            <CardDescription>Choose a template for your email</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">
                                    {t("invoice.email.template")}
                                </Label>
                                <Select
                                    value={type}
                                    onValueChange={(v) => setType(v as any)}
                                    disabled={previewMutation.isPending}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="created">{t("invoice.email.type.created")}</SelectItem>
                                        <SelectItem value="first">{t("invoice.email.type.first")}</SelectItem>
                                        <SelectItem value="second">{t("invoice.email.type.second")}</SelectItem>
                                        <SelectItem value="third">{t("invoice.email.type.third")}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleSend}
                                disabled={sendMutation.isPending || previewMutation.isPending}
                            >
                                {sendMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="mr-2 h-4 w-4" />
                                )}
                                {t("invoice.email.send_action")}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

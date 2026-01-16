import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import { RichEditor } from "@/components/ui/rich-editor/rich-editor";

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  onSend: () => void;
}

export function SendEmailDialog({ open, onOpenChange, invoiceId, onSend }: SendEmailDialogProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<InvoiceEmail['type']>('created');
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");

  // Preview mutation
  const previewMutation = usePreviewInvoiceEmailMutation();
  const sendMutation = useSendInvoiceEmailMutation();

  useEffect(() => {
    if (open && invoiceId) {
      loadPreview(type);
    }
  }, [open, type, invoiceId]);

  const loadPreview = async (emailType: InvoiceEmail['type']) => {
    try {
      const data = await previewMutation.mutateAsync({ id: invoiceId, type: emailType });
      setSubject(data.subject);
      setHtml(data.html);
    } catch (error) {
      toast.error(t("common.error_occurred"));
    }
  };

  const handleSend = async () => {
    try {
      await sendMutation.mutateAsync({
        id: invoiceId,
        type,
        subject,
        html // Send edited html content
      });
      toast.success(t("invoice.email_sent"));
      onSend();
      onOpenChange(false);
    } catch (error) {
      toast.error(t("common.error_occurred"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("invoice.email.send_title")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 flex-1 overflow-auto">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              {t("invoice.email.template")}
            </Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as any)}
              disabled={previewMutation.isPending}
            >
              <SelectTrigger className="col-span-3">
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

          {previewMutation.isPending ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subject" className="text-right">
                  {t("invoice.email.subject")}
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="col-span-3"
                />
              </div>

              <div className="flex-1 overflow-auto border rounded-md mt-2 min-h-[300px]">
                <RichEditor
                  value={html}
                  onChange={setHtml}
                  placeholder="Type '/' for commands..."
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSend} disabled={sendMutation.isPending || previewMutation.isPending}>
            {sendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("invoice.email.send_action")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

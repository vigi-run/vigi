import Layout from "@/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InterConfigForm } from "@/components/inter-config-form";
import { AsaasConfigForm } from "@/components/asaas-config-form";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { useOrganizationStore } from "@/store/organization";
import { client } from "@/api/client.gen";
import { toast } from "sonner";


export default function IntegrationsPage() {
  const { t } = useTranslation();
  const { currentOrganization, isLoading } = useOrganizationStore();
  const [selectedBank, setSelectedBank] = useState<string>("inter");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (currentOrganization && (currentOrganization as any).bank_provider) {
      setSelectedBank((currentOrganization as any).bank_provider);
    }
  }, [currentOrganization]);

  const handleBankChange = async (value: string) => {
    setSelectedBank(value);
    if (!currentOrganization) return;

    setIsUpdating(true);
    try {
      await client.patch({
        url: `/organizations/${currentOrganization.id}`,
        // @ts-ignore
        body: { bank_provider: value }
      });
      toast.success(t("common.saved_successfully"));
    } catch (error) {
      toast.error(t("common.error_occurred"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Layout pageName={t("organization.integrations.title")}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">{t("organization.integrations.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("organization.integrations.description")}
          </p>
        </div>

        <Tabs defaultValue="banks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices" disabled>{t("organization.integrations.tabs.invoices")}</TabsTrigger>
            <TabsTrigger value="banks">{t("organization.integrations.tabs.banks")}</TabsTrigger>
            <TabsTrigger value="signatures" disabled>{t("organization.integrations.tabs.signatures")}</TabsTrigger>
            <TabsTrigger value="tickets" disabled>{t("organization.integrations.tabs.tickets")}</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="space-y-4">
            <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <h3 className="mt-4 text-lg font-semibold">{t("organization.integrations.common.coming_soon")}</h3>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="banks" className="space-y-4">
            <div className="space-y-4">
              <div className="w-[300px] space-y-2">
                <Label>{t("organization.integrations.bank_select.label")}</Label>
                <Select value={selectedBank} onValueChange={handleBankChange} disabled={isUpdating}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("organization.integrations.bank_select.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">{t("organization.integrations.bank_select.inter")}</SelectItem>
                    <SelectItem value="asaas">{t("organization.integrations.bank_select.asaas")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedBank === "inter" && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("organization.integrations.inter.title")}</CardTitle>
                    <CardDescription>
                      {t("organization.integrations.inter.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InterConfigForm />
                  </CardContent>
                </Card>
              )}

              {selectedBank === "asaas" && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("organization.integrations.asaas.title")}</CardTitle>
                    <CardDescription>
                      {t("organization.integrations.asaas.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AsaasConfigForm />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="signatures" className="space-y-4">
            <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <h3 className="mt-4 text-lg font-semibold">{t("organization.integrations.common.coming_soon")}</h3>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
              <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                <h3 className="mt-4 text-lg font-semibold">{t("organization.integrations.common.coming_soon")}</h3>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

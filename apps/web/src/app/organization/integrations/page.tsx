import Layout from "@/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InterConfigForm } from "@/components/inter-config-form";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Label } from "@/components/ui/label";

export default function IntegrationsPage() {
    const { t } = useTranslation();
    const [selectedBank, setSelectedBank] = useState<string>("inter");

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
                                <Select value={selectedBank} onValueChange={setSelectedBank}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("organization.integrations.bank_select.placeholder")} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inter">{t("organization.integrations.bank_select.inter")}</SelectItem>
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

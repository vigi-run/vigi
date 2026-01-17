import { useTranslation } from "react-i18next";
import Layout from "@/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Send, CheckCircle2, AlertTriangle, Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useOrganizationStore } from "@/store/organization";
import { useQuery } from "@tanstack/react-query";
import { getInvoiceStatsOptions } from "@/api/invoice-manual";

export default function DashboardPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentOrganization } = useOrganizationStore();

    const { data: invoiceStats } = useQuery(getInvoiceStatsOptions(currentOrganization?.id || "", !!currentOrganization?.id));

    const stats = [
        {
            title: t("invoice.status.draft"),
            value: invoiceStats?.draftCount ?? "-",
            icon: FileText,
            color: "text-muted-foreground",
        },
        {
            title: t("invoice.status.sent"),
            value: invoiceStats?.sentCount ?? "-",
            icon: Send,
            color: "text-blue-500",
        },
        {
            title: t("invoice.status.paid"),
            value: invoiceStats?.paidCount ?? "-",
            icon: CheckCircle2,
            color: "text-green-500",
        },
        {
            title: t("invoice.status.overdue"),
            value: invoiceStats?.overdueCount ?? "-",
            icon: AlertTriangle,
            color: "text-amber-500",
        },
    ];

    return (
        <Layout pageName={t("navigation.home")}>
            <div className="flex flex-col gap-8">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {t("dashboard.welcome", "Welcome back")}, {currentOrganization?.name}
                        </h2>
                        <p className="text-muted-foreground">
                            {t("dashboard.subtitle", "Here's an overview of your organization's activity.")}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => navigate("clients/new")} variant="outline">
                            <Briefcase className="mr-2 h-4 w-4" />
                            {t("client.new_client")}
                        </Button>
                        <Button onClick={() => navigate("invoices/new")}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t("invoice.new_invoice")}
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Placeholder for Recent Activity or Revenue Chart */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>{t("dashboard.getting_started", "Getting Started")}</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-6 text-sm text-muted-foreground space-y-2">
                            <p>1. {t("dashboard.step1", "Register your clients to keep track of their details.")}</p>
                            <p>2. {t("dashboard.step2", "Create and define your catalog items/services.")}</p>
                            <p>3. {t("dashboard.step3", "Generate professional invoices and send them via email.")}</p>
                        </CardContent>
                    </Card>
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>{t("dashboard.quick_links", "Quick Links")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                <Button variant="ghost" className="justify-start px-2" onClick={() => navigate("settings/organization")}>
                                    {t("navigation.organization_settings")}
                                </Button>
                                <Button variant="ghost" className="justify-start px-2" onClick={() => navigate("settings/members")}>
                                    {t("navigation.members")}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}

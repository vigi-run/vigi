import Layout from "@/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InterConfigForm } from "@/components/inter-config-form";

export default function IntegrationsPage() {
    return (
        <Layout pageName="Integrations">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">Integrations</h3>
                    <p className="text-sm text-muted-foreground">
                        Configure third-party integrations.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Banco Inter</CardTitle>
                        <CardDescription>
                            Configure Banco Inter API for Boleto/Pix.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InterConfigForm />
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}

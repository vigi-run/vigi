import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getInterConfig, saveInterConfig } from "@/api/inter";
import { useOrganizationStore } from "@/store/organization";
import { useTranslation } from "react-i18next";

const formSchema = z.object({
    clientId: z.string().min(1, "Client ID is required"),
    clientSecret: z.string().min(1, "Client Secret is required"),
    certificate: z.string().min(1, "Certificate is required"),
    key: z.string().min(1, "Key is required"),
    accountNumber: z.string().optional(),
    environment: z.enum(["sandbox", "production"]),
});

export function InterConfigForm() {
    const { t } = useTranslation();
    const { currentOrganization } = useOrganizationStore();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientId: "",
            clientSecret: "",
            certificate: "",
            key: "",
            accountNumber: "",
            environment: "sandbox",
        },
    });

    useEffect(() => {
        const loadConfig = async () => {
            if (!currentOrganization?.id) return;
            try {
                const res = await getInterConfig(currentOrganization.id);
                const data = res.data as any;
                if (data?.data) {
                    form.reset({
                        clientId: data.data.clientId,
                        clientSecret: data.data.clientSecret,
                        certificate: data.data.certificate,
                        key: data.data.key,
                        accountNumber: data.data.accountNumber || "",
                        environment: data.data.environment,
                    });
                }
            } catch (error) {
                console.error("Failed to load Inter config", error);
            }
        };
        loadConfig();
    }, [currentOrganization, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!currentOrganization?.id) return;
        setIsLoading(true);
        try {
            const payload = { ...values };
            if (payload.certificate === "********") {
                // @ts-ignore
                delete payload.certificate;
            }
            if (payload.key === "********") {
                // @ts-ignore
                delete payload.key;
            }
            if (payload.clientSecret === "********") {
                // @ts-ignore
                delete payload.clientSecret;
            }
            await saveInterConfig(currentOrganization.id, payload);
            toast.success(t("organization.integrations.form.toast_success"));
        } catch (error) {
            console.error(error);
            toast.error(t("organization.integrations.form.toast_error"));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="environment"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("organization.integrations.form.environment")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("organization.integrations.form.select_environment")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="sandbox">{t("organization.integrations.form.sandbox")}</SelectItem>
                                        <SelectItem value="production">{t("organization.integrations.form.production")}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("organization.integrations.form.account_number")}</FormLabel>
                                <FormControl>
                                    <Input placeholder="12345678" {...field} />
                                </FormControl>
                                <FormDescription>{t("organization.integrations.form.optional_derived")}</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("organization.integrations.form.client_id")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("organization.integrations.form.client_id")} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="clientSecret"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("organization.integrations.form.client_secret")}</FormLabel>
                            <FormControl>
                                <div className="space-y-2">
                                    {field.value === "********" ? (
                                        <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/20">
                                            <div className="flex-1 text-sm text-muted-foreground italic">
                                                {t("organization.integrations.form.encrypted_secret")}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => field.onChange("")}
                                            >
                                                {t("organization.integrations.form.replace_content")}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Input type="password" placeholder={t("organization.integrations.form.client_secret")} {...field} />
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="certificate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("organization.integrations.form.certificate")}</FormLabel>
                            <FormControl>
                                <div className="space-y-2">
                                    {field.value === "********" ? (
                                        <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/20">
                                            <div className="flex-1 text-sm text-muted-foreground italic">
                                                {t("organization.integrations.form.encrypted_certificate")}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => field.onChange("")}
                                            >
                                                {t("organization.integrations.form.replace_content")}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Textarea
                                            className="font-mono text-xs"
                                            rows={5}
                                            placeholder="-----BEGIN CERTIFICATE-----..."
                                            {...field}
                                        />
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("organization.integrations.form.key")}</FormLabel>
                            <FormControl>
                                <div className="space-y-2">
                                    {field.value === "********" ? (
                                        <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/20">
                                            <div className="flex-1 text-sm text-muted-foreground italic">
                                                {t("organization.integrations.form.encrypted_key")}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => field.onChange("")}
                                            >
                                                {t("organization.integrations.form.replace_content")}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Textarea
                                            className="font-mono text-xs"
                                            rows={5}
                                            placeholder="-----BEGIN PRIVATE KEY-----..."
                                            {...field}
                                        />
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? t("organization.integrations.form.saving") : t("organization.integrations.form.save")}
                </Button>
            </form>
        </Form>
    );
}

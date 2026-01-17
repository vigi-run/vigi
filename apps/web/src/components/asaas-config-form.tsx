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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAsaasConfig, saveAsaasConfig } from "@/api/asaas";
import { useOrganizationStore } from "@/store/organization";
import { useTranslation } from "react-i18next";

const formSchema = z.object({
    apiKey: z.string().min(1, "API Key is required"),
    environment: z.enum(["sandbox", "production"]),
});

export function AsaasConfigForm() {
    const { t } = useTranslation();
    const { currentOrganization } = useOrganizationStore();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            apiKey: "",
            environment: "sandbox",
        },
    });

    useEffect(() => {
        const loadConfig = async () => {
            if (!currentOrganization?.id) return;
            try {
                const res = await getAsaasConfig(currentOrganization.id);
                const data = res.data as any;
                if (data?.data) {
                    form.reset({
                        apiKey: data.data.apiKey,
                        environment: data.data.environment,
                    });
                }
            } catch (error) {
                console.error("Failed to load Asaas config", error);
            }
        };
        loadConfig();
    }, [currentOrganization, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!currentOrganization?.id) return;
        setIsLoading(true);
        try {
            const payload = { ...values };
            if (payload.apiKey === "********") {
                // @ts-ignore
                delete payload.apiKey;
            }
            await saveAsaasConfig(currentOrganization.id, payload);
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
                    name="apiKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("organization.integrations.form.api_key")}</FormLabel>
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
                                        <Input type="password" placeholder="API Key" {...field} />
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

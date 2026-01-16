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

const formSchema = z.object({
    clientId: z.string().min(1, "Client ID is required"),
    clientSecret: z.string().min(1, "Client Secret is required"),
    certificate: z.string().min(1, "Certificate is required"),
    key: z.string().min(1, "Key is required"),
    accountNumber: z.string().optional(),
    environment: z.enum(["sandbox", "production"]),
});

export function InterConfigForm() {
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
            await saveInterConfig(currentOrganization.id, values);
            toast.success("Inter configuration saved");
        } catch (error) {
            console.error(error);
            toast.error("Failed to save Inter configuration");
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
                                <FormLabel>Environment</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select environment" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="sandbox">Sandbox</SelectItem>
                                        <SelectItem value="production">Production</SelectItem>
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
                                <FormLabel>Account Number (x-conta-corrente)</FormLabel>
                                <FormControl>
                                    <Input placeholder="12345678" {...field} />
                                </FormControl>
                                <FormDescription>Optional/Derived</FormDescription>
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
                            <FormLabel>Client ID</FormLabel>
                            <FormControl>
                                <Input placeholder="Client ID" {...field} />
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
                            <FormLabel>Client Secret</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Client Secret" {...field} />
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
                            <FormLabel>Certificate (CRT)</FormLabel>
                            <FormControl>
                                <Textarea className="font-mono text-xs" rows={5} placeholder="-----BEGIN CERTIFICATE-----..." {...field} />
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
                            <FormLabel>Private Key (KEY)</FormLabel>
                            <FormControl>
                                <Textarea className="font-mono text-xs" rows={5} placeholder="-----BEGIN PRIVATE KEY-----..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Configuration"}
                </Button>
            </form>
        </Form>
    );
}

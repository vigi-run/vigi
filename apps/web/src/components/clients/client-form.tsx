import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientSchema, type ClientFormValues } from "@/schemas/client.schema";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLocalizedTranslation } from "@/hooks/useTranslation";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ClientFormProps {
    initialValues?: ClientFormValues;
    onSubmit: (data: ClientFormValues) => Promise<void>;
    isSubmitting?: boolean;
}

export function ClientForm({ initialValues, onSubmit, isSubmitting }: ClientFormProps) {
    const { t } = useLocalizedTranslation();
    const navigate = useNavigate();

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(ClientSchema),
        defaultValues: initialValues || {
            name: "",
            classification: "individual",
            idNumber: "",
            address1: "",
            addressNumber: "",
            address2: "",
            city: "",
            state: "",
            postalCode: "",
            customValue1: undefined,
        },
    });

    const classification = form.watch("classification");

    // Reset validation when classification changes
    useEffect(() => {
        if (form.formState.isDirty) {
            form.trigger("idNumber");
        }
    }, [classification, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("clients.form.name", "Name")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("clients.form.name_placeholder", "My Client")} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="classification"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("clients.form.classification", "Classification")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select classification" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="individual">{t("clients.classification.individual", "Individual")}</SelectItem>
                                        <SelectItem value="company">{t("clients.classification.company", "Company")}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="idNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    {classification === "individual"
                                        ? t("clients.form.cpf", "CPF")
                                        : t("clients.form.cnpj", "CNPJ")}
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="vatNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("clients.form.vat_number", "VAT Number")}</FormLabel>
                                <FormControl>
                                    {/* @ts-ignore */}
                                    <Input {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t("clients.form.address", "Address")}</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="address1"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("clients.form.address1", "Street")}</FormLabel>
                                    <FormControl>
                                        {/* @ts-ignore */}
                                        <Input {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="addressNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("clients.form.address_number", "Number")}</FormLabel>
                                    <FormControl>
                                        {/* @ts-ignore */}
                                        <Input {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("clients.form.city", "City")}</FormLabel>
                                    <FormControl>
                                        {/* @ts-ignore */}
                                        <Input {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("clients.form.state", "State")}</FormLabel>
                                    <FormControl>
                                        {/* @ts-ignore */}
                                        <Input {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("clients.form.postal_code", "Postal Code")}</FormLabel>
                                    <FormControl>
                                        {/* @ts-ignore */}
                                        <Input {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                        {t("common.cancel", "Cancel")}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t("common.saving", "Saving...") : t("common.save", "Save")}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

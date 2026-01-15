import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getClientSchema, type ClientFormValues } from "@/schemas/client.schema";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLocalizedTranslation } from "@/hooks/useTranslation";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Trash, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientFormProps {
    initialValues?: ClientFormValues;
    onSubmit: (data: ClientFormValues) => Promise<void>;
    isSubmitting?: boolean;
}

export function ClientForm({ initialValues, onSubmit, isSubmitting }: ClientFormProps) {
    const { t } = useLocalizedTranslation();
    const navigate = useNavigate();
    const [isLoadingCep, setIsLoadingCep] = useState(false);

    const form = useForm<any>({
        // @ts-ignore
        resolver: zodResolver(getClientSchema(t)),
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
            contacts: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "contacts",
    });

    const classification = form.watch("classification");

    // Reset validation when classification changes
    useEffect(() => {
        if (form.formState.isDirty) {
            form.trigger("idNumber");
        }
    }, [classification, form]);

    const postalCode = form.watch("postalCode");

    useEffect(() => {
        const fetchAddress = async () => {
            const cleanCep = postalCode?.replace(/\D/g, "");
            if (cleanCep?.length === 8) {
                try {
                    setIsLoadingCep(true);
                    const response = await axios.get(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
                    const { street, city, state } = response.data;

                    form.setValue("address1", street);
                    form.setValue("city", city);
                    form.setValue("state", state);
                } catch (error) {
                    toast.error(t("clients.errors.cep_fetch", "Failed to fetch address details"));
                    console.error("CEP fetch error:", error);
                } finally {
                    setIsLoadingCep(false);
                }
            }
        };

        fetchAddress();
    }, [postalCode, form, t]);

    // Handle classification changes for contacts logic
    useEffect(() => {
        if (classification === "individual") {
            // Ensure at least one contact exists for individual
            if (fields.length === 0) {
                append({ name: form.getValues("name"), email: "", phone: "", role: "" });
            } else if (fields.length > 1) {
                // Determine if we should clear extra contacts? 
                // For now let's keep them but UI normally shows only one. 
                // Or better, force length 1 if switching. 
                // Let's rely on UI showing index 0 for individual.
            }
        }
    }, [classification, fields.length, append, form]);

    // Sync client name with contact name for individual
    const clientName = form.watch("name");
    useEffect(() => {
        if (classification === "individual" && fields.length > 0) {
            form.setValue("contacts.0.name", clientName);
        }
    }, [clientName, classification, fields.length, form]);

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
                                    <MaskedInput
                                        {...field}
                                        mask={
                                            classification === "individual"
                                                ? "999.999.999-99"
                                                : "99.999.999/9999-99"
                                        }
                                        value={field.value || ""}
                                    />
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
                            name="postalCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("clients.form.postal_code", "Postal Code")}</FormLabel>
                                    <FormControl>
                                        <MaskedInput
                                            {...field}
                                            mask="99999-999"
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address1"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("clients.form.address1", "Street")}</FormLabel>
                                    <FormControl>
                                        {/* @ts-ignore */}
                                        <Input {...field} value={field.value || ""} disabled={isLoadingCep} />
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
                                        <Input {...field} value={field.value || ""} disabled={isLoadingCep} />
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
                                        <Input {...field} value={field.value || ""} disabled={isLoadingCep} />
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
                                        <Input {...field} value={field.value || ""} disabled={isLoadingCep} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">
                            {classification === "individual"
                                ? t("clients.form.contact_info", "Contact Info")
                                : t("clients.form.financial_contact", "Contacts")}
                        </h3>
                        {classification !== "individual" && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ name: "", email: "", phone: "", role: "" })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {t("clients.form.add_contact", "Add Contact")}
                            </Button>
                        )}
                    </div>

                    {fields.map((field, index) => {
                        // For individual, show only the first contact (if any exists, should be auto-created)
                        if (classification === "individual" && index > 0) return null;

                        return (
                            <Card key={field.id} className="relative">
                                {classification !== "individual" && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-2 top-2 h-6 w-6 text-destructive hover:text-destructive/90"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                )}
                                {classification !== "individual" && (
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base font-medium flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            {t("clients.form.contacts", "Contact")} {index + 1}
                                        </CardTitle>
                                    </CardHeader>
                                )}
                                <CardContent className={`grid grid-cols-1 gap-4 ${classification !== "individual" ? "md:grid-cols-2 pt-0" : "md:grid-cols-2 pt-6"}`}>
                                    {classification !== "individual" && (
                                        <FormField
                                            control={form.control}
                                            name={`contacts.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t("clients.form.contact_name", "Name")}</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    <FormField
                                        control={form.control}
                                        name={`contacts.${index}.email`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("clients.form.contact_email", "Email")}</FormLabel>
                                                <FormControl>
                                                    {/* @ts-ignore */}
                                                    <Input type="email" {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`contacts.${index}.phone`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("clients.form.contact_phone", "Phone")}</FormLabel>
                                                <FormControl>
                                                    <MaskedInput
                                                        {...field}
                                                        mask="(99) 99999-9999"
                                                        value={field.value || ""}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {classification !== "individual" && (
                                        <FormField
                                            control={form.control}
                                            name={`contacts.${index}.role`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t("clients.form.contact_role", "Role")}</FormLabel>
                                                    <FormControl>
                                                        {/* @ts-ignore */}
                                                        <Input {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}

                    {fields.length === 0 && classification !== "individual" && (
                        <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground bg-muted/10">
                            {t("clients.form.no_contacts", "No contacts added")}
                        </div>
                    )}
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

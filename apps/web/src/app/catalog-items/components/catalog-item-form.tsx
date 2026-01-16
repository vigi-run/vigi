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
import { MoneyInput } from "@/components/ui/money-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    type CatalogItemFormValues,
    getCatalogItemSchema,
} from "@/schemas/catalogItem";
import { CatalogItemType, CatalogItemUnits } from "@/types/catalogItem";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface CatalogItemFormProps {

    defaultValues?: Partial<CatalogItemFormValues>;
    onSubmit: (data: CatalogItemFormValues) => Promise<void>;
    isLoading?: boolean;
}

export const CatalogItemForm = ({
    defaultValues,
    onSubmit,
    isLoading,
}: CatalogItemFormProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const form = useForm<CatalogItemFormValues>({
        resolver: zodResolver(getCatalogItemSchema(t)),
        // @ts-ignore
        defaultValues: {
            type: CatalogItemType.PRODUCT,
            price: 0,
            cost: 0,
            taxRate: 0,
            stockThreshold: 0,
            stockNotification: false,
            name: "",
            productKey: "",
            unit: CatalogItemUnits[0],
            ncmNbs: "",
            notes: "",
            ...defaultValues,
        } as any,
    });

    const type = form.watch("type");
    const isService = type === CatalogItemType.SERVICE;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control as any}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("catalog_item.form.type")}</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={t("catalog_item.form.type_placeholder")}
                                            />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={CatalogItemType.PRODUCT}>
                                            {t("catalog_item.type.product")}
                                        </SelectItem>
                                        <SelectItem value={CatalogItemType.SERVICE}>
                                            {t("catalog_item.type.service")}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("catalog_item.form.name")}</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="productKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("catalog_item.form.product_key")}</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="ncmNbs"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("catalog_item.form.ncm_nbs")}</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="unit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("catalog_item.form.unit")}</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("catalog_item.form.unit_placeholder")} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {CatalogItemUnits.map((u) => (
                                            <SelectItem key={u} value={u}>
                                                {u}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("catalog_item.form.price")}</FormLabel>
                                <FormControl>
                                    <MoneyInput
                                        {...field}
                                        onChange={(val) => field.onChange(val)}
                                        value={field.value}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="cost"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("catalog_item.form.cost")}</FormLabel>
                                <FormControl>
                                    <MoneyInput
                                        {...field}
                                        onChange={(val) => field.onChange(val)}
                                        value={field.value}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control as any}
                        name="taxRate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("catalog_item.form.tax_rate")}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...field}
                                        value={field.value}
                                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {!isService && (
                    <div className="border p-4 rounded-md space-y-4">
                        <h3 className="font-medium">Stock Management</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control as any}
                                name="inStockQuantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("catalog_item.form.in_stock_quantity")}</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="stockThreshold"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("catalog_item.form.stock_threshold")}</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="1" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control as any}
                                name="stockNotification"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel>{t("catalog_item.form.stock_notification")}</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}

                <FormField
                    control={form.control as any}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("catalog_item.form.notes")}</FormLabel>
                            <FormControl>
                                <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                        disabled={isLoading}
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? t("common.saving") : t("common.save")}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, formatCurrency } from '@/lib/utils';
import { Plus, Trash, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { getInvoiceSchema, type InvoiceFormValues } from '@/schemas/invoice.schema';
import { MoneyInput } from '@/components/ui/money-input';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useOrganizationStore } from '@/store/organization';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/api/client.gen';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface InvoiceFormProps {
    defaultValues?: Partial<InvoiceFormValues> & { clientId?: string };
    onSubmit: (data: InvoiceFormValues) => void;
    isLoading: boolean;
    submitLabel: string;
}

export function InvoiceForm({ defaultValues, onSubmit, isLoading, submitLabel }: InvoiceFormProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentOrganization: organization } = useOrganizationStore();
    const [openClient, setOpenClient] = useState(false);


    // Fetch clients for combobox
    const { data: clientsData } = useQuery({
        queryKey: ['clients', organization?.id],
        queryFn: async () => {
            const res = await client.get({ url: `/organizations/${organization?.id}/clients?page=1&limit=50` });
            // @ts-ignore
            return res.data.data.data || [];
        },
        enabled: !!organization?.id,
    });

    // Fetch catalog items for quick add
    const { data: catalogItemsData } = useQuery({
        queryKey: ['catalogItems', organization?.id],
        queryFn: async () => {
            const res = await client.get({ url: `/organizations/${organization?.id}/catalog-items?page=1&limit=50` });
            // @ts-ignore
            return res.data.data.data || [];
        },
        enabled: !!organization?.id,
    });

    const sanitizedDefaultItems = defaultValues?.items?.map(item => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        discount: item.discount || 0,
        catalogItemId: item.catalogItemId,
    })) || [{ description: '', quantity: 1, unitPrice: 0, discount: 0 }];

    const defaultValuesConfig: InvoiceFormValues = {
        ...defaultValues,
        clientId: defaultValues?.clientId || '',
        number: defaultValues?.number || '',
        discount: defaultValues?.discount || 0,
        items: sanitizedDefaultItems,
        nfId: defaultValues?.nfId || '',
        nfStatus: defaultValues?.nfStatus || '',
        nfStatus: defaultValues?.nfStatus || '',
        nfLink: defaultValues?.nfLink || '',
        terms: defaultValues?.terms,
        notes: defaultValues?.notes,
        date: defaultValues?.date ? new Date(defaultValues.date) : undefined,
        dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : undefined,
    };

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(getInvoiceSchema(t)) as any,
        defaultValues: defaultValuesConfig,
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    const calculateTotals = () => {
        const items = form.watch('items');
        const invoiceDiscount = form.watch('discount') || 0;

        let subtotal = 0;
        let itemsDiscount = 0;

        items.forEach(item => {
            const qty = item.quantity || 0;
            const price = item.unitPrice || 0;
            const discount = item.discount || 0;

            subtotal += qty * price;
            itemsDiscount += discount;
        });

        const total = Math.max(0, subtotal - itemsDiscount - invoiceDiscount);

        return {
            subtotal,
            itemsDiscount,
            totalDiscount: itemsDiscount + invoiceDiscount,
            total
        };
    };

    const handleCatalogItemSelect = (itemId: string, index: number) => {
        const item = catalogItemsData?.find((i: any) => i.id === itemId);
        if (item) {
            form.setValue(`items.${index}.description`, item.name);
            form.setValue(`items.${index}.unitPrice`, item.price);
            form.setValue(`items.${index}.catalogItemId`, item.id);
        }

    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.error("Form Validation Errors:", errors))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* General Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('invoice.form.general_info')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="clientId"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('invoice.form.client')}</FormLabel>
                                        <Popover open={openClient} onOpenChange={setOpenClient}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value
                                                            ? clientsData?.find((client: any) => client.id === field.value)?.name
                                                            : t('invoice.form.select_client')}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0">
                                                <Command>
                                                    <CommandInput placeholder={t('invoice.form.search_client')} />
                                                    <CommandList>
                                                        <CommandEmpty>{t('common.no_results')}</CommandEmpty>
                                                        <CommandGroup>
                                                            {clientsData?.map((client: any) => (
                                                                <CommandItem
                                                                    value={`${client.name} ${client.email || ''} ${client.document || ''}`}
                                                                    key={client.id}
                                                                    onSelect={() => {
                                                                        form.setValue("clientId", client.id);
                                                                        setOpenClient(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            client.id === field.value ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <div className="flex flex-col">
                                                                        <span>{client.name}</span>
                                                                        {client.email && (
                                                                            <span className="text-xs text-muted-foreground">{client.email}</span>
                                                                        )}
                                                                    </div>
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('invoice.form.number')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="INV-001" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{t('invoice.form.date')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    value={field.value && !isNaN(new Date(field.value).getTime()) ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (!value) {
                                                            field.onChange(undefined);
                                                            return;
                                                        }
                                                        const [y, m, d] = value.split('-').map(Number);
                                                        const date = new Date(y, m - 1, d, 12, 0, 0, 0); // Sets to noon local time to avoid timezone shifts
                                                        field.onChange(date);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="dueDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{t('invoice.form.due_date')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    value={field.value && !isNaN(new Date(field.value).getTime()) ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (!value) {
                                                            field.onChange(undefined);
                                                            return;
                                                        }
                                                        const [y, m, d] = value.split('-').map(Number);
                                                        const date = new Date(y, m - 1, d, 12, 0, 0, 0); // Sets to noon local time to avoid timezone shifts
                                                        field.onChange(date);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes & Terms */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('invoice.form.additional_info')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="terms"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('invoice.form.terms')}</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} placeholder={t('invoice.form.terms_placeholder')} className="min-h-[100px]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('invoice.form.notes')}</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} placeholder={t('invoice.form.notes_placeholder')} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Fiscal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('invoice.form.fiscal_info')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="nfId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('invoice.form.nf_id')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nfStatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('invoice.form.nf_status')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('invoice.form.select_status')} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PENDING">{t('invoice.status.pending')}</SelectItem>
                                                <SelectItem value="SENT">{t('invoice.status.sent')}</SelectItem>
                                                <SelectItem value="PAID">{t('invoice.status.paid')}</SelectItem>
                                                <SelectItem value="CANCELLED">{t('invoice.status.cancelled')}</SelectItem>
                                                <SelectItem value="ERROR">{t('invoice.status.error')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nfLink"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('invoice.form.nf_link')}</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="https://..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                    </CardContent>
                </Card>

                {/* Invoice Items */}
                < Card >
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{t('invoice.form.items')}</CardTitle>
                        <Button type="button" variant="secondary" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, discount: 0 })}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t('invoice.form.add_item')}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Header Row */}
                            <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground mb-2 px-2">
                                <div className="col-span-12 md:col-span-4">{t('invoice.form.item_description')}</div>
                                <div className="col-span-4 md:col-span-2 text-right">{t('invoice.form.item_quantity')}</div>
                                <div className="col-span-4 md:col-span-2 text-right">{t('invoice.form.item_price')}</div>
                                <div className="col-span-4 md:col-span-2 text-right">{t('invoice.form.discount')}</div>
                                <div className="col-span-4 md:col-span-2 text-right">{t('invoice.form.item_total')}</div>
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-2 rounded-lg border bg-card text-card-foreground shadow-sm">
                                    <div className="col-span-12 md:col-span-4">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        {/* Catalog Item Quick Select using a hacky select/combobox approach if needed, or just Textarea */}
                                                        <div className="flex gap-2">
                                                            <Textarea {...field} placeholder={t("invoice.form.item_description_placeholder")} className="min-h-[2.5rem] resize-none" rows={1} />

                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="outline" size="icon" type="button" title={t("invoice.form.select_from_catalog")}>
                                                                        <ChevronsUpDown className="h-4 w-4" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                                    <Command>
                                                                        <CommandInput placeholder={t("invoice.form.search_catalog")} />
                                                                        <CommandList>
                                                                            <CommandEmpty>{t("invoice.form.no_catalog_items")}</CommandEmpty>
                                                                            <CommandGroup>
                                                                                {catalogItemsData?.map((item: any) => (
                                                                                    <CommandItem
                                                                                        key={item.id}
                                                                                        value={`${item.name} ${item.price}`}
                                                                                        onSelect={() => handleCatalogItemSelect(item.id, index)}
                                                                                    >
                                                                                        <Check
                                                                                            className={cn(
                                                                                                "mr-2 h-4 w-4",
                                                                                                item.id === form.watch(`items.${index}.catalogItemId`) ? "opacity-100" : "opacity-0"
                                                                                            )}
                                                                                        />
                                                                                        {item.name} - {formatCurrency(item.price)}
                                                                                    </CommandItem>
                                                                                ))}
                                                                            </CommandGroup>
                                                                        </CommandList>
                                                                    </Command>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="text-right" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.unitPrice`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <MoneyInput
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            className="text-right"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.discount`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <MoneyInput
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            className="text-right text-muted-foreground"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-2">
                                        <div className="font-semibold tabular-nums">
                                            {formatCurrency(Math.max(0, (form.watch(`items.${index}.quantity`) || 0) * (form.watch(`items.${index}.unitPrice`) || 0) - (form.watch(`items.${index}.discount`) || 0)))}
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => remove(index)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            <Separator className="my-4" />

                            <div className="flex flex-col gap-2 justify-end items-end text-sm mt-4">
                                <div className="flex justify-between w-full md:w-1/3">
                                    <span className="text-muted-foreground">{t('invoice.form.subtotal')}:</span>
                                    <span>{formatCurrency(calculateTotals().subtotal)}</span>
                                </div>
                                <div className="flex justify-between w-full md:w-1/3 items-center">
                                    <span className="text-muted-foreground">{t('invoice.form.discount')} (Global):</span>
                                    <div className="w-32">
                                        <FormField
                                            control={form.control}
                                            name="discount"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <MoneyInput
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            className="text-right h-8"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between w-full md:w-1/3 text-red-500">
                                    <span>{t('invoice.form.total_discount')}:</span>
                                    <span>- {formatCurrency(calculateTotals().totalDiscount)}</span>
                                </div>
                                <Separator className="w-full md:w-1/3 my-2" />
                                <div className="flex justify-between w-full md:w-1/3 text-lg font-bold text-primary">
                                    <span>{t('invoice.form.final_total')}:</span>
                                    <span>{formatCurrency(calculateTotals().total)}</span>
                                </div>
                            </div>

                        </div>
                    </CardContent>
                </Card >

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/invoices')}
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? t('common.saving') : submitLabel}
                    </Button>
                </div>
            </form >
        </Form >
    );
}

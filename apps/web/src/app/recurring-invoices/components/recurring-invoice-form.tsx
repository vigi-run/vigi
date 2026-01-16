import React from 'react';
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
import { Plus, Trash, Check, ChevronsUpDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { getRecurringInvoiceSchema, type RecurringInvoiceFormValues } from '@/schemas/recurring-invoice.schema';
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

interface RecurringInvoiceFormProps {
  defaultValues?: Partial<RecurringInvoiceFormValues> & { clientId?: string };
  onSubmit: (data: RecurringInvoiceFormValues) => void;
  isLoading: boolean;
  submitLabel: string;
}

export function RecurringInvoiceForm({ defaultValues, onSubmit, isLoading, submitLabel }: RecurringInvoiceFormProps) {
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

  const defaultValuesConfig: RecurringInvoiceFormValues = {
    ...defaultValues,
    clientId: defaultValues?.clientId || '',
    number: defaultValues?.number || '',
    discount: defaultValues?.discount || 0,
    items: sanitizedDefaultItems,
    terms: defaultValues?.terms,
    notes: defaultValues?.notes,
    date: defaultValues?.date ? new Date(defaultValues.date) : undefined,
    dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : undefined,
    nextGenerationDate: defaultValues?.nextGenerationDate ? new Date(defaultValues.nextGenerationDate) : undefined,
    status: defaultValues?.status || 'ACTIVE',
    frequency: defaultValues?.frequency || 'MONTHLY',
    interval: defaultValues?.interval || 1,
    dayOfMonth: defaultValues?.dayOfMonth,
    dayOfWeek: defaultValues?.dayOfWeek,
    month: defaultValues?.month,
  };

  const form = useForm<RecurringInvoiceFormValues>({
    resolver: zodResolver(getRecurringInvoiceSchema(t)) as any,
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

  const { frequency, interval, nextGenerationDate, dayOfWeek, dayOfMonth, month, date: issueDate, dueDate } = form.watch();

  const nextOccurrences = React.useMemo(() => {
    if (!nextGenerationDate || !frequency || !interval) return [];

    let startDate = new Date(nextGenerationDate);
    if (isNaN(startDate.getTime())) return [];

    // Calculate Due Days offset
    let dueDays = 0;
    if (issueDate && dueDate) {
      const iDate = new Date(issueDate);
      const dDate = new Date(dueDate);
      if (!isNaN(iDate.getTime()) && !isNaN(dDate.getTime())) {
        const diffTime = Math.abs(dDate.getTime() - iDate.getTime());
        dueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    const occurrences: { generationDate: Date; dueDate: Date }[] = [];

    // Helper to add results
    const addOccurrence = (d: Date) => {
      const genDate = new Date(d);
      const due = new Date(d);
      due.setDate(due.getDate() + dueDays);
      occurrences.push({ generationDate: genDate, dueDate: due });
    };

    // 1. Find the FIRST occurrence strictly respecting the constraints on/after startDate
    let firstDate = new Date(startDate);

    if (frequency === 'WEEKLY' && typeof dayOfWeek === 'number') {
      const currentDay = firstDate.getDay();
      const diff = (dayOfWeek - currentDay + 7) % 7;
      firstDate.setDate(firstDate.getDate() + diff);
    } else if ((frequency === 'MONTHLY' || frequency === 'YEARLY') && dayOfMonth) {
      if (firstDate.getDate() > dayOfMonth) {
        firstDate.setMonth(firstDate.getMonth() + 1);
      }
      firstDate.setDate(dayOfMonth);

      if (frequency === 'YEARLY' && month) {
        const targetMonthIndex = month - 1;
        let checkDate = new Date(startDate);
        checkDate.setMonth(targetMonthIndex);
        checkDate.setDate(dayOfMonth);

        if (checkDate < startDate) {
          checkDate.setFullYear(checkDate.getFullYear() + 1);
        }
        firstDate = checkDate;
      }
    }

    addOccurrence(firstDate);

    // 2. Calculate next occurrences based on Interval
    for (let i = 0; i < 3; i++) { // Generate 3 more (total 4)
      const prev = occurrences[occurrences.length - 1].generationDate;
      const next = new Date(prev);

      switch (frequency) {
        case 'DAILY':
          next.setDate(next.getDate() + interval);
          break;
        case 'WEEKLY':
          next.setDate(next.getDate() + (interval * 7));
          break;
        case 'MONTHLY':
          next.setMonth(next.getMonth() + interval);
          break;
        case 'YEARLY':
          next.setFullYear(next.getFullYear() + interval);
          break;
      }
      addOccurrence(next);
    }

    return occurrences;
  }, [frequency, interval, nextGenerationDate, dayOfWeek, dayOfMonth, month, issueDate, dueDate]);

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

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || 'ACTIVE'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="PAUSED">Paused</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nextGenerationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t('invoice.form.recurrence_start_date')}</FormLabel>
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
                            const date = new Date(y, m - 1, d, 12, 0, 0, 0);
                            field.onChange(date);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem className="flex flex-col">
                  <FormLabel>{t('invoice.form.due_in_days')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Ex: 30"
                      onChange={(e) => {
                        const days = parseInt(e.target.value);
                        if (!isNaN(days)) {
                          const now = new Date();
                          // Set Invoice Date to Today
                          // form.setValue('date', now);
                          // Set Due Date to Today + Days
                          const dueDate = new Date(now);
                          dueDate.setDate(dueDate.getDate() + days);
                          form.setValue('dueDate', dueDate);
                          form.setValue('date', now);
                        }
                      }}
                      // Calculate default value from existing dates if editing
                      defaultValue={
                        form.getValues('date') && form.getValues('dueDate')
                          ? Math.round((new Date(form.getValues('dueDate')!).getTime() - new Date(form.getValues('date')!).getTime()) / (1000 * 60 * 60 * 24))
                          : undefined
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              {/* Hidden Date Field (Always Today on Submit, or preserved) */}
              <FormField
                control={form.control}
                name="date"
                render={() => <input type="hidden" />}
              />


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

        {/* Recurrence Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('invoice.form.recurrence.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoice.form.recurrence.frequency')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('invoice.form.recurrence.frequency_placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAILY">{t('invoice.form.recurrence.frequencies.daily')}</SelectItem>
                        <SelectItem value="WEEKLY">{t('invoice.form.recurrence.frequencies.weekly')}</SelectItem>
                        <SelectItem value="MONTHLY">{t('invoice.form.recurrence.frequencies.monthly')}</SelectItem>
                        <SelectItem value="YEARLY">{t('invoice.form.recurrence.frequencies.yearly')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoice.form.recurrence.interval')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            // @ts-ignore
                            field.onChange(undefined);
                          } else {
                            const parsed = parseInt(value);
                            if (!isNaN(parsed)) {
                              field.onChange(parsed);
                            }
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {form.watch('frequency') === 'WEEKLY' && (
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('invoice.form.recurrence.day_of_week')}</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(parseInt(val))}
                        defaultValue={field.value?.toString()}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">{t('invoice.form.recurrence.days.sunday')}</SelectItem>
                          <SelectItem value="1">{t('invoice.form.recurrence.days.monday')}</SelectItem>
                          <SelectItem value="2">{t('invoice.form.recurrence.days.tuesday')}</SelectItem>
                          <SelectItem value="3">{t('invoice.form.recurrence.days.wednesday')}</SelectItem>
                          <SelectItem value="4">{t('invoice.form.recurrence.days.thursday')}</SelectItem>
                          <SelectItem value="5">{t('invoice.form.recurrence.days.friday')}</SelectItem>
                          <SelectItem value="6">{t('invoice.form.recurrence.days.saturday')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(form.watch('frequency') === 'MONTHLY' || form.watch('frequency') === 'YEARLY') && (
                <FormField
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('invoice.form.recurrence.day_of_month')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              field.onChange(undefined);
                            } else {
                              const parsed = parseInt(value);
                              if (!isNaN(parsed)) {
                                field.onChange(parsed);
                              }
                            }
                          }}
                          placeholder="1-31"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('frequency') === 'YEARLY' && (
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('invoice.form.recurrence.month')}</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(parseInt(val))}
                        defaultValue={field.value?.toString()}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">{t('invoice.form.recurrence.months.january')}</SelectItem>
                          <SelectItem value="2">{t('invoice.form.recurrence.months.february')}</SelectItem>
                          <SelectItem value="3">{t('invoice.form.recurrence.months.march')}</SelectItem>
                          <SelectItem value="4">{t('invoice.form.recurrence.months.april')}</SelectItem>
                          <SelectItem value="5">{t('invoice.form.recurrence.months.may')}</SelectItem>
                          <SelectItem value="6">{t('invoice.form.recurrence.months.june')}</SelectItem>
                          <SelectItem value="7">{t('invoice.form.recurrence.months.july')}</SelectItem>
                          <SelectItem value="8">{t('invoice.form.recurrence.months.august')}</SelectItem>
                          <SelectItem value="9">{t('invoice.form.recurrence.months.september')}</SelectItem>
                          <SelectItem value="10">{t('invoice.form.recurrence.months.october')}</SelectItem>
                          <SelectItem value="11">{t('invoice.form.recurrence.months.november')}</SelectItem>
                          <SelectItem value="12">{t('invoice.form.recurrence.months.december')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Next Occurrences Preview */}
            {nextOccurrences.length > 0 && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-dashed">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('invoice.form.recurrence.next_occurrences')}</h4>
                <ul className="text-sm space-y-2">
                  {nextOccurrences.map((occurrence, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">{format(occurrence.generationDate, 'dd/MM/yyyy')}</span>
                      <span className="text-muted-foreground text-xs">
                        ({t('invoice.form.due_date')}: {format(occurrence.dueDate, 'dd/MM/yyyy')})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
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
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/recurring-invoices')}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('common.saving') : submitLabel}
          </Button>
        </div>
      </form>
    </Form >
  );
}

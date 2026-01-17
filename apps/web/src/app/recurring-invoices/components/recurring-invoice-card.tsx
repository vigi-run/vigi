import React from 'react';
import type { RecurringInvoice } from '@/types/recurring-invoice';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Calendar, CreditCard, RefreshCw, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useGenerateInvoiceMutation } from '@/api/recurring-invoice';

interface RecurringInvoiceCardProps {
    entity: RecurringInvoice;
    onDelete: (id: string) => void;
}

export const RecurringInvoiceCard: React.FC<RecurringInvoiceCardProps> = ({ entity, onDelete }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const generateMutation = useGenerateInvoiceMutation();

    const handleGenerate = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await generateMutation.mutateAsync(entity.id);
            toast.success(t('invoice.created_successfully'));
        } catch (error) {
            toast.error(t('common.error_occurred'));
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30';
            case 'PAUSED': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30';
            case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    return (
        <Card
            className="group relative overflow-hidden border transition-all hover:shadow-md cursor-pointer"
            onClick={() => navigate(entity.id)}
        >
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <RefreshCw className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">{entity.number}</h3>
                                <Badge variant="outline" className={`border-0 ${statusColor(entity.status)}`}>
                                    {entity.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                    Next: {entity.nextGenerationDate ? format(new Date(entity.nextGenerationDate), 'dd/MM/yyyy') : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleGenerate}>
                                <div className="flex items-center gap-2">
                                    <Play className="h-4 w-4" />
                                    <span>{t('invoice.generate')}</span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`${entity.id}/edit`); }}>
                                {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(entity.id);
                                }}
                            >
                                {t('common.delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>

            <CardFooter className="bg-muted/30 px-5 py-3 flex justify-between items-center border-t">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {t('invoice.items_label', { count: entity.items?.length || 0 })}
                </div>
                <div className="text-lg font-bold text-foreground">
                    {formatCurrency(entity.total)}
                </div>
            </CardFooter>
        </Card>
    );
};

import React from 'react';
import type { Invoice } from '@/types/invoice';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, MoreHorizontal, Calendar, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface InvoiceCardProps {
    entity: Invoice;
    onDelete: (id: string) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ entity, onDelete }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();



    const statusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30';
            case 'SENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30';
            case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800';
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
                            <FileText className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">{entity.number}</h3>
                                <Badge variant="outline" className={`border-0 ${statusColor(entity.status)}`}>
                                    {t(`invoice.status.${entity.status.toLowerCase()}`)}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                    {entity.date ? format(new Date(entity.date), 'dd/MM/yyyy') : '-'}
                                </span>
                                {entity.dueDate && (
                                    <>
                                        <span>•</span>
                                        <span className={(() => {
                                            if (entity.status === 'PAID') return ''; // Default color if paid

                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const due = new Date(entity.dueDate);
                                            due.setHours(0, 0, 0, 0);

                                            const diffTime = due.getTime() - today.getTime();
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                            if (diffDays < 0) return 'text-destructive font-medium'; // Overdue
                                            if (diffDays <= 2) return 'text-orange-500 font-medium'; // Due soon

                                            return ''; // Normal
                                        })()}>
                                            Vence {format(new Date(entity.dueDate), 'dd/MM/yyyy')}
                                        </span>
                                    </>
                                )}
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

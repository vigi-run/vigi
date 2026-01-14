import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CatalogItem } from "@/types/catalogItem";
import { Edit, MoreVertical, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface CatalogItemCardProps {
    entity: CatalogItem;
    onDelete: (id: string) => void;
}

export const CatalogItemCard = ({ entity, onDelete }: CatalogItemCardProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const getPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    };

    return (
        <Card className="hover:bg-muted/50 transition-colors group">
            <CardContent className="p-4 flex items-center justify-between gap-4">
                <div
                    className="flex-1 space-y-1 cursor-pointer"
                    onClick={() => navigate(entity.id)}
                >
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base">{entity.name}</h3>
                        <Badge variant="secondary" className="text-xs font-normal text-muted-foreground">
                            {entity.productKey}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase h-5">
                            {t(`catalog_item.type.${entity.type.toLowerCase()}`)}
                        </Badge>
                        <span className="text-sm text-muted-foreground capitalize">
                            {entity.unit}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="font-bold text-lg tabular-nums">
                        {getPrice(entity.price)}
                    </span>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`${entity.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t("common.update")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(entity.id)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                {t("common.delete")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
};

import { type Client } from "@/types/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLocalizedTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ClientCardProps {
    client: Client;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

const ClientCard = ({ client, onDelete, isDeleting }: ClientCardProps) => {
    const navigate = useNavigate();
    const { t, i18n } = useLocalizedTranslation();

    const formattedDate = format(new Date(client.createdAt), "PPp", {
        locale: i18n.language === "pt-BR" ? ptBR : enUS,
    });

    return (
        <Card
            className="mb-2 p-2 hover:bg-muted/50 transition-colors"
        >
            <CardContent className="px-2 py-2">
                <div className="flex justify-between flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex flex-col gap-1 cursor-pointer flex-grow" onClick={() => navigate(`${client.id}`)}>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{client.name}</h3>
                            <Badge variant={client.classification === 'company' ? 'default' : 'secondary'}>
                                {t(`clients.classification.${client.classification}`, client.classification)}
                            </Badge>
                            <Badge variant={client.status === 'active' ? 'outline' : client.status === 'blocked' ? 'destructive' : 'secondary'}>
                                {t(`clients.status.${client.status}`, client.status)}
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:gap-4">
                            <span>
                                {client.classification === 'company' ? 'CNPJ' : 'CPF'}: {client.idNumber || '-'}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span>{t("common.created", "Created")}: {formattedDate}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <Button variant="outline" size="sm" onClick={() => navigate(`${client.id}/edit`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t("common.edit", "Edit")}
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={isDeleting}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    {t("common.delete", "Delete")}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t("common.confirm_delete_title", "Are you absolutely sure?")}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t("common.confirm_delete_description", "This action cannot be undone. This will permanently delete the client.")}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(client.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        {t("common.confirm", "Confirm")}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ClientCard;

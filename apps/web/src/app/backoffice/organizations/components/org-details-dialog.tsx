import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getBackofficeOrg } from "@/api/backoffice";
import type { BackofficeOrgDetailDto } from "@/api/types.gen";
import { Loader2 } from "lucide-react";

interface OrgDetailsDialogProps {
    orgId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OrgDetailsDialog({
    orgId,
    open,
    onOpenChange,
}: OrgDetailsDialogProps) {
    const [data, setData] = useState<BackofficeOrgDetailDto | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && orgId) {
            setLoading(true);
            getBackofficeOrg(orgId)
                .then((res) => {
                    if (res.data) {
                        setData(res.data as BackofficeOrgDetailDto);
                    }
                })
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setData(null);
        }
    }, [open, orgId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Organization Details</DialogTitle>
                </DialogHeader>
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : data ? (
                    <div className="grid gap-4 py-4">
                        <div>
                            <h3 className="font-semibold text-lg">{data.name}</h3>
                            <p className="text-sm text-muted-foreground">{data.slug}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col space-y-1 rounded-md border p-3">
                                <span className="text-sm font-medium text-muted-foreground">Users</span>
                                <span className="text-2xl font-bold">{data.userCount}</span>
                            </div>
                            <div className="flex flex-col space-y-1 rounded-md border p-3">
                                <span className="text-sm font-medium text-muted-foreground">Monitors</span>
                                <span className="text-2xl font-bold">{data.stats.monitors}</span>
                            </div>
                            <div className="flex flex-col space-y-1 rounded-md border p-3">
                                <span className="text-sm font-medium text-muted-foreground">Status Pages</span>
                                <span className="text-2xl font-bold">{data.stats.statusPages}</span>
                            </div>
                            <div className="flex flex-col space-y-1 rounded-md border p-3">
                                <span className="text-sm font-medium text-muted-foreground">Maintenances</span>
                                <span className="text-2xl font-bold">{data.stats.maintenances}</span>
                            </div>
                            <div className="flex flex-col space-y-1 rounded-md border p-3 col-span-2">
                                <span className="text-sm font-medium text-muted-foreground">Notification Channels</span>
                                <span className="text-2xl font-bold">{data.stats.notificationChannels}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No data available.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

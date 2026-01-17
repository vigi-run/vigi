import { useEffect, useState } from "react";
import { getBackofficeOrgs } from "@/api/backoffice";
import type { BackofficeOrgListDto } from "@/api/types.gen";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { OrgDetailsDialog } from "./components/org-details-dialog";

export default function BackofficeOrgsPage() {
    const [orgs, setOrgs] = useState<BackofficeOrgListDto[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        getBackofficeOrgs()
            .then((response) => {
                if (response.data) {
                    setOrgs(response.data);
                }
            })
            .catch((error) => console.error("Failed to fetch orgs", error));
    }, []);

    const handleViewDetails = (orgId: string) => {
        setSelectedOrgId(orgId);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Organizations</h1>
            <Card>
                <CardHeader>
                    <CardTitle>All Organizations</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orgs.map((org) => (
                                <TableRow key={org.id}>
                                    <TableCell className="font-medium">{org.name}</TableCell>
                                    <TableCell>{org.slug}</TableCell>
                                    <TableCell>{org.userCount}</TableCell>
                                    <TableCell>{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleViewDetails(org.id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">View Details</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <OrgDetailsDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                orgId={selectedOrgId}
            />
        </div>
    );
}

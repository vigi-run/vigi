import { useEffect, useState } from "react";
import { getBackofficeUsers } from "@/api/backoffice";
import type { BackofficeUserListDto } from "@/api/types.gen";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BackofficeUsersPage() {
    const [users, setUsers] = useState<BackofficeUserListDto[]>([]);

    useEffect(() => {
        getBackofficeUsers()
            .then((response) => {
                if (response.data) {
                    setUsers(response.data);
                }
            })
            .catch((error) => console.error("Failed to fetch users", error));
    }, []);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Users</h1>
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Organizations</TableHead>
                                <TableHead>Joined At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>{user.orgCount}</TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

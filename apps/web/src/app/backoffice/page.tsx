import { useEffect, useState } from "react";
import { getBackofficeStats } from "@/api/backoffice";
import type { BackofficeStatsDto } from "@/api/types.gen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function BackofficeDashboardPage() {
    const [stats, setStats] = useState<BackofficeStatsDto | null>(null);

    useEffect(() => {
        getBackofficeStats()
            .then((response) => {
                if (response.data) {
                    setStats(response.data);
                }
            })
            .catch((error) => console.error("Failed to fetch stats", error));
    }, []);

    if (!stats) return <div>Loading...</div>;

    const chartData = [
        { name: "Users", value: stats.totalUsers },
        { name: "Organizations", value: stats.totalOrgs },
        // { name: "Active Pings", value: stats.activePings },
        // { name: "Executed Pings", value: stats.executedPings },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrgs}</div>
                    </CardContent>
                </Card>
                {/*
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Pings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activePings}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Executed Pings (24h)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.executedPings}</div>
                    </CardContent>
                </Card>
                */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

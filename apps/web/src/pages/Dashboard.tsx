import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { AlertCircle, CreditCard, Users, ArrowUpRight, Tag, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, addDays, isBefore } from 'date-fns';

export const Dashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSpend: 0,
        savings: 0,
        activeSeats: 0,
        totalSeats: 0,
        criticalAlerts: 0,
        warningAlerts: 0
    });
    const [platformSpend, setPlatformSpend] = useState<{ name: string, spend: number }[]>([]);
    const [utilizationData, setUtilizationData] = useState<{ name: string, value: number, color: string }[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [renewals, setRenewals] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch Licenses
            const { data: licensesData } = await supabase.from('licenses').select('*');

            // Fetch Savings
            const { data: savingsData } = await supabase.from('optimization_recommendations')
                .select('potential_savings')
                .eq('status', 'open');

            // Fetch Alerts
            const { data: alertsData } = await supabase.from('compliance_alerts')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: false })
                .limit(5);

            let spend = 0;
            let active = 0;
            let total = 0;
            const spendMap: Record<string, number> = {};
            const upcomingRenewals: any[] = [];

            if (licensesData) {
                const now = new Date();
                const thirtyDaysFromNow = addDays(now, 30);

                licensesData.forEach((lic: any) => {
                    const monthlyCost = Number(lic.cost_per_seat) * lic.total_seats;
                    spend += monthlyCost;

                    active += lic.allocated_seats;
                    total += lic.total_seats;

                    if (spendMap[lic.platform]) {
                        spendMap[lic.platform] += monthlyCost;
                    } else {
                        spendMap[lic.platform] = monthlyCost;
                    }

                    if (lic.renewal_date) {
                        const rDate = new Date(lic.renewal_date);
                        if (isBefore(rDate, thirtyDaysFromNow) && !isBefore(rDate, now)) {
                            upcomingRenewals.push(lic);
                        }
                    }
                });
            }

            const platformData = Object.entries(spendMap)
                .map(([name, val]) => ({ name, spend: val }))
                .sort((a, b) => b.spend - a.spend)
                .slice(0, 5); // top 5

            const totalSavings = (savingsData || []).reduce((acc, curr) => acc + Number(curr.potential_savings), 0);

            let criticalCount = 0;
            let warningCount = 0;
            if (alertsData) {
                alertsData.forEach((a: any) => {
                    if (a.severity === 'critical') criticalCount++;
                    if (a.severity === 'warning') warningCount++;
                });
            }

            setStats({
                totalSpend: spend,
                savings: totalSavings,
                activeSeats: active,
                totalSeats: total,
                criticalAlerts: criticalCount,
                warningAlerts: warningCount
            });

            setPlatformSpend(platformData);

            setUtilizationData([
                { name: 'Active', value: active, color: 'hsl(var(--chart-1))' },
                { name: 'Unassigned', value: total - active, color: 'hsl(var(--chart-3))' }
            ]);

            setAlerts(alertsData || []);
            setRenewals(upcomingRenewals.sort((a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground">Monitor your corporate SaaS licenses and identify savings.</p>
            </div>

            {/* Quick Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Monthly Spend</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            Based on connected active licenses
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${stats.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            Available via pending optimizations
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Seat Licensing</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeSeats} / {stats.totalSeats}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            Active vs Total Purchased
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Alerts</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex gap-2 items-center">
                            {stats.criticalAlerts > 0 ? (
                                <Badge variant="destructive">{stats.criticalAlerts} Critical</Badge>
                            ) : null}
                            {stats.warningAlerts > 0 ? (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{stats.warningAlerts} Warning</Badge>
                            ) : null}
                            {stats.criticalAlerts === 0 && stats.warningAlerts === 0 && (
                                <span className="text-muted-foreground text-sm font-normal">All clear</span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Active system notifications</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* Bar Chart: Platform Spend */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Top Spend by Platform</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            {platformSpend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={platformSpend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                        <Tooltip
                                            cursor={{ fill: 'var(--muted)' }}
                                            contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                                            formatter={(value: number) => [`$${value}`, 'Spend']}
                                        />
                                        <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">
                                    No spend data available yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Donut Chart: Utilization */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Seat Utilization</CardTitle>
                        <CardDescription>Aggregate across all active integrations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full">
                            {stats.totalSeats > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={utilizationData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {utilizationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => [`${value} Seats`, 'Count']} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-[240px] mt-4 items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">
                                    No seat data connected.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts & Next Renewals */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Alerts</CardTitle>
                        <CardDescription>Compliance flags and system notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {alerts.length > 0 ? alerts.map((alert) => (
                                <div key={alert.id} className="flex items-start gap-4 rounded-lg border p-3">
                                    <AlertCircle className={`mt-0.5 h-5 w-5 ${alert.severity === 'critical' ? 'text-red-500' :
                                        alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                                        }`} />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{alert.title}</p>
                                        <p className="text-sm text-muted-foreground">{alert.description || 'No detailed description available.'}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-sm text-muted-foreground p-4 text-center border-dashed border-2 rounded-md">
                                    No recent alerts.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Renewals</CardTitle>
                        <CardDescription>Licenses renewing in the next 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {renewals.length > 0 ? renewals.map((lic) => (
                                <div key={lic.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{lic.platform} {lic.plan_name && `- ${lic.plan_name}`}</p>
                                        <p className="text-sm text-muted-foreground">{lic.total_seats} seats • ${(Number(lic.cost_per_seat) * lic.total_seats).toLocaleString()}/cycle</p>
                                    </div>
                                    <Badge variant="outline" className="whitespace-nowrap ml-4">
                                        {formatDistanceToNow(new Date(lic.renewal_date), { addSuffix: true })}
                                    </Badge>
                                </div>
                            )) : (
                                <div className="text-sm text-muted-foreground p-4 text-center border-dashed border-2 rounded-md">
                                    No renewals upcoming in the next 30 days.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

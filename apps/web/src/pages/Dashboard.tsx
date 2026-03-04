import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { AlertCircle, CreditCard, Users, Tag, Loader2, RotateCw, Download } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, addDays, isBefore } from 'date-fns';
import { toast } from 'sonner';

export const Dashboard = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [stats, setStats] = useState({
        totalSpend: 0,
        savings: 0,
        activeSeats: 0,
        totalSeats: 0,
        criticalAlerts: 0,
        warningAlerts: 0
    });
    const [platformSpend, setPlatformSpend] = useState<{ name: string; spend: number }[]>([]);
    const [utilizationData, setUtilizationData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [renewals, setRenewals] = useState<any[]>([]);
    const [licensesRaw, setLicensesRaw] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const { data: licensesData } = await supabase.from('licenses').select('*');
            const { data: savingsData } = await supabase.from('optimization_recommendations')
                .select('estimated_savings')
                .eq('status', 'pending');
            const { data: alertsData } = await supabase.from('compliance_alerts')
                .select('*')
                .eq('is_resolved', false)
                .order('created_at', { ascending: false })
                .limit(5);

            let spend = 0, active = 0, total = 0;
            const spendMap: Record<string, number> = {};
            const upcomingRenewals: any[] = [];

            if (licensesData) {
                setLicensesRaw(licensesData);
                const now = new Date();
                const thirtyDays = addDays(now, 30);
                licensesData.forEach((lic: any) => {
                    const cost = Number(lic.cost_per_seat) * lic.seats_purchased;
                    spend += cost;
                    active += lic.seats_used;
                    total += lic.seats_purchased;
                    spendMap[lic.platform] = (spendMap[lic.platform] || 0) + cost;
                    if (lic.renewal_date) {
                        const rd = new Date(lic.renewal_date);
                        if (isBefore(rd, thirtyDays) && !isBefore(rd, now)) upcomingRenewals.push(lic);
                    }
                });
            }

            const platformData = Object.entries(spendMap)
                .map(([name, val]) => ({ name, spend: val }))
                .sort((a, b) => b.spend - a.spend)
                .slice(0, 5);

            const totalSavings = (savingsData || []).reduce((acc, c) => acc + Number(c.estimated_savings), 0);
            let crit = 0, warn = 0;
            (alertsData || []).forEach((a: any) => {
                if (a.severity === 'critical') crit++;
                if (a.severity === 'warning') warn++;
            });

            setStats({ totalSpend: spend, savings: totalSavings, activeSeats: active, totalSeats: total, criticalAlerts: crit, warningAlerts: warn });
            setPlatformSpend(platformData);
            setUtilizationData([
                { name: 'Used', value: active, color: 'hsl(var(--chart-1))' },
                { name: 'Available', value: Math.max(total - active, 0), color: 'hsl(var(--chart-3))' }
            ]);
            setAlerts(alertsData || []);
            setRenewals(upcomingRenewals.sort((a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSyncNow = async () => {
        setIsSyncing(true);
        await new Promise(r => setTimeout(r, 2000));
        await fetchDashboardData();
        setIsSyncing(false);
        toast.success('Dashboard synced successfully!');
    };

    const handleExportCSV = () => {
        if (licensesRaw.length === 0) {
            toast.error('No data to export');
            return;
        }
        const headers = ['Platform', 'Plan', 'Seats Purchased', 'Seats Used', 'Cost/Seat', 'Billing Cycle', 'Renewal Date'];
        const rows = licensesRaw.map(l => [
            l.platform, l.plan_name, l.seats_purchased, l.seats_used, l.cost_per_seat, l.billing_cycle, l.renewal_date
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `licensly-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report exported!');
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                    <p className="text-muted-foreground">Monitor your corporate SaaS licenses and identify savings.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSyncNow} disabled={isSyncing}>
                        <RotateCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
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
                        <p className="text-xs text-muted-foreground mt-1">Based on active licenses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
                        <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${stats.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">From pending optimizations</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Seat Licensing</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeSeats} / {stats.totalSeats}</div>
                        <p className="text-xs text-muted-foreground mt-1">Used vs Purchased</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Alerts</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex gap-2 items-center">
                            {stats.criticalAlerts > 0 && <Badge variant="destructive">{stats.criticalAlerts} Critical</Badge>}
                            {stats.warningAlerts > 0 && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{stats.warningAlerts} Warning</Badge>}
                            {stats.criticalAlerts === 0 && stats.warningAlerts === 0 && <span className="text-muted-foreground text-sm font-normal">All clear</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Active notifications</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader><CardTitle>Top Spend by Platform</CardTitle></CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            {platformSpend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={platformSpend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                                        <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} formatter={(v: number) => [`$${v}`, 'Spend']} />
                                        <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">
                                    <div className="text-center"><p>No spend data yet.</p><Button variant="link" className="mt-1" onClick={() => navigate('/integrations')}>Connect integrations</Button></div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader><CardTitle>Seat Utilization</CardTitle><CardDescription>All active integrations</CardDescription></CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full">
                            {stats.totalSeats > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={utilizationData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value">
                                            {utilizationData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                                        </Pie>
                                        <Tooltip formatter={(v: number) => [`${v} Seats`, 'Count']} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-md">No seat data.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts & Renewals */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader><CardTitle>Recent Alerts</CardTitle><CardDescription>Compliance flags and notifications</CardDescription></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.length > 0 ? alerts.map(alert => (
                                <div key={alert.id} className="flex items-start gap-4 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/compliance')}>
                                    <AlertCircle className={`mt-0.5 h-5 w-5 ${alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-none truncate">{alert.message}</p>
                                        <p className="text-xs text-muted-foreground">{alert.alert_type} • {alert.severity}</p>
                                    </div>
                                    <Badge variant="outline" className="text-xs shrink-0">{alert.severity}</Badge>
                                </div>
                            )) : (
                                <div className="text-sm text-muted-foreground p-4 text-center border-dashed border-2 rounded-md">No recent alerts.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Upcoming Renewals</CardTitle><CardDescription>Next 30 days</CardDescription></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {renewals.length > 0 ? renewals.map(lic => (
                                <div key={lic.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">{lic.platform} {lic.plan_name && `- ${lic.plan_name}`}</p>
                                        <p className="text-sm text-muted-foreground">{lic.seats_purchased} seats • ${(Number(lic.cost_per_seat) * lic.seats_purchased).toLocaleString()}/cycle</p>
                                    </div>
                                    <Badge variant="outline" className="whitespace-nowrap ml-4">
                                        {formatDistanceToNow(new Date(lic.renewal_date), { addSuffix: true })}
                                    </Badge>
                                </div>
                            )) : (
                                <div className="text-sm text-muted-foreground p-4 text-center border-dashed border-2 rounded-md">No renewals in the next 30 days.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

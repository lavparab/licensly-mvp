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
import { api } from '../lib/api';
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
            const data = await api.get('/api/dashboard/stats');

            const s = data.stats || {};
            setStats({
                totalSpend: s.totalSpend || 0,
                savings: s.savings || 0,
                activeSeats: s.activeSeats || 0,
                totalSeats: s.totalSeats || 0,
                criticalAlerts: s.criticalAlerts || 0,
                warningAlerts: s.warningAlerts || 0,
            });

            setPlatformSpend((data.platformSpend || []).map((p: any) => ({ name: p.name, spend: Number(p.spend) })));

            setUtilizationData((data.utilizationData || []).map((d: any, i: number) => ({
                ...d,
                color: i === 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-3))',
            })));

            setAlerts((data.alerts || []).slice(0, 5));

            const upcomingRenewals = data.upcomingRenewals || [];
            setRenewals(upcomingRenewals.sort((a: any, b: any) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()));

            const licensesRes = await api.get('/api/licenses?limit=100');
            setLicensesRaw(licensesRes.licenses || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
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
                    <h1 className="font-sans font-semibold text-[32px] tracking-tight text-[var(--text-primary)]">Dashboard</h1>
                    <p className="text-[14px] text-[var(--text-muted)]">Monitor your corporate SaaS licenses and identify savings.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-9 rounded-[6px] text-[13px]" onClick={handleSyncNow} disabled={isSyncing}>
                        <RotateCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button variant="outline" className="h-9 rounded-[6px] text-[13px]" onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-t-2 border-t-[var(--accent)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[13px] font-sans font-medium text-[var(--text-muted)]">Total Monthly Spend</CardTitle>
                        <CreditCard className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-[24px] font-mono font-semibold text-[var(--text-primary)]">${stats.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[12px] text-[var(--text-muted)] mt-1">Based on active licenses</p>
                    </CardContent>
                </Card>
                <Card className="border-t-2 border-t-[var(--success)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[13px] font-sans font-medium text-[var(--text-muted)]">Potential Savings</CardTitle>
                        <Tag className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-[24px] font-mono font-semibold text-[var(--success)]">${stats.savings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[12px] text-[var(--text-muted)] mt-1">From pending optimizations</p>
                    </CardContent>
                </Card>
                <Card className="border-t-2 border-t-[var(--accent)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[13px] font-sans font-medium text-[var(--text-muted)]">Seat Licensing</CardTitle>
                        <Users className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-[24px] font-mono font-semibold text-[var(--text-primary)]">{stats.activeSeats} / {stats.totalSeats}</div>
                        <p className="text-[12px] text-[var(--text-muted)] mt-1">Used vs Purchased</p>
                    </CardContent>
                </Card>
                <Card className="border-t-2 border-t-[var(--warning)]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[13px] font-sans font-medium text-[var(--text-muted)]">Compliance Alerts</CardTitle>
                        <AlertCircle className="h-4 w-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 items-center">
                            {stats.criticalAlerts > 0 && <Badge variant="destructive">{stats.criticalAlerts} Critical</Badge>}
                            {stats.warningAlerts > 0 && <Badge variant="secondary" className="bg-[var(--warning-light)] text-[var(--warning)] border-[var(--warning)]/20">{stats.warningAlerts} Warning</Badge>}
                            {stats.criticalAlerts === 0 && stats.warningAlerts === 0 && <span className="text-[var(--text-muted)] text-[13px]">All clear</span>}
                        </div>
                        <p className="text-[12px] text-[var(--text-muted)] mt-1">Active notifications</p>
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
                                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                                        <Tooltip cursor={{ fill: 'var(--bg-secondary)' }} contentStyle={{ borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'DM Sans', fontSize: '13px' }} formatter={(v: number) => [`$${v}`, 'Spend']} />
                                        <Bar dataKey="spend" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-[var(--text-muted)] text-[13px] border border-dashed border-[var(--border)] rounded-[6px]">
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
                                <div className="flex h-full items-center justify-center text-[var(--text-muted)] text-[13px] border border-dashed border-[var(--border)] rounded-[6px]">No seat data.</div>
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
                                <div key={alert.id} className="flex items-start gap-4 rounded-[6px] border border-[var(--border)] p-3 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => navigate('/compliance')}>
                                    <AlertCircle className={`mt-0.5 h-5 w-5 flex-shrink-0 ${alert.severity === 'critical' ? 'text-[var(--error)]' : alert.severity === 'warning' ? 'text-[var(--warning)]' : 'text-[var(--accent)]'}`} strokeWidth={1.5} />
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <p className="text-[13px] font-medium leading-none truncate">{alert.message}</p>
                                        <p className="text-[12px] text-[var(--text-muted)]">{alert.alert_type} • {alert.severity}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[11px] shrink-0">{alert.severity}</Badge>
                                </div>
                            )) : (
                                <div className="text-[13px] text-[var(--text-muted)] p-4 text-center border border-dashed border-[var(--border)] rounded-[6px]">No recent alerts.</div>
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
                                <div className="text-[13px] text-[var(--text-muted)] p-4 text-center border border-dashed border-[var(--border)] rounded-[6px]">No renewals in the next 30 days.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

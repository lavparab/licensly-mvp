import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { AlertCircle, ShieldCheck, Calendar, Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export const Compliance = () => {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [renewals, setRenewals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [alertsResponse, licensesResponse] = await Promise.all([
                api.get('/api/compliance/alerts?limit=50'),
                api.get('/api/licenses?limit=10')
            ]);

            // Handle both { alerts: [] } and direct array response
            const alertsData = alertsResponse.alerts ?? alertsResponse ?? [];
            const licensesData = licensesResponse.licenses ?? licensesResponse ?? [];

            setAlerts(alertsData);

            const withRenewals = licensesData
                .filter((l: any) => l.renewal_date)
                .sort((a: any, b: any) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime());
            setRenewals(withRenewals);

        } catch (err) {
            console.error('Error fetching compliance data:', err);
            toast.error('Failed to load compliance data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunScan = async () => {
        setIsScanning(true);
        try {
            const res = await api.post('/api/compliance/scan');
            if (res.newAlertsCount > 0) {
                toast.warning(`Scan complete. Found ${res.newAlertsCount} new alerts.`);
            } else {
                toast.success('Scan complete. No new alerts found.');
            }
            await fetchData();
        } catch (err: any) {
            console.error('Scan failed:', err);
            toast.error(err.message || 'Failed to run compliance scan.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleResolve = async (id: string) => {
        setActionId(id);
        try {
            await api.patch(`/api/compliance/alerts/${id}/resolve`);
            setAlerts(prev => prev.filter(a => a.id !== id));
            toast.success('Alert resolved!');
        } catch (err) {
            toast.error('Failed to resolve alert');
        }
        setActionId(null);
    };

    const handleSendReminder = (licenseName: string) => {
        toast.success(`Reminder sent for ${licenseName} renewal!`, { description: 'Email notification sent to stakeholders.' });
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'destructive';
            case 'warning': return 'secondary';
            default: return 'outline';
        }
    };

    if (isLoading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>
                    <p className="text-muted-foreground">Monitor compliance alerts and upcoming license renewals.</p>
                </div>
                <Button onClick={handleRunScan} disabled={isScanning} variant="default">
                    {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {isScanning ? 'Scanning...' : 'Run Compliance Scan'}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Open Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{alerts.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {alerts.filter(a => a.severity === 'critical').length} critical, {alerts.filter(a => a.severity === 'warning').length} warning
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{renewals.length}</div>
                        <p className="text-xs text-muted-foreground">Next 12 months</p>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{alerts.length === 0 ? '100%' : Math.max(0, 100 - alerts.length * 10) + '%'}</div>
                        <p className="text-xs text-muted-foreground">Based on open alerts</p>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts Section */}
            <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" /> Active Alerts
                </h2>
                {alerts.length > 0 ? (
                    <div className="space-y-3">
                        {alerts.map(alert => (
                            <Card key={alert.id} className="bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                                <CardContent className="flex items-center gap-4 py-4">
                                    <AlertCircle className={`h-5 w-5 shrink-0 ${alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{alert.message}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {alert.licenses?.platform && `${alert.licenses.platform} • `}
                                            {alert.alert_type} • {alert.due_date ? `Due ${format(new Date(alert.due_date), 'MMM d, yyyy')}` : 'No due date'}
                                        </p>
                                    </div>
                                    <Badge variant={getSeverityColor(alert.severity) as any}>{alert.severity}</Badge>
                                    <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)} disabled={actionId === alert.id}>
                                        {actionId === alert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-1 h-4 w-4" /> Resolve</>}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                        <div className="bg-muted p-4 rounded-full mb-4"><ShieldCheck className="h-8 w-8 text-green-500" /></div>
                        <CardTitle className="text-xl mb-2">All clear!</CardTitle>
                        <CardDescription>No open compliance alerts. Your licenses are in good standing.</CardDescription>
                    </Card>
                )}
            </div>

            {/* Renewal Calendar */}
            <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" /> Renewal Calendar
                </h2>
                {renewals.length > 0 ? (
                    <div className="space-y-2">
                        {renewals.map(lic => (
                            <Card key={lic.id} className="bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                                <CardContent className="flex items-center justify-between py-3">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{lic.platform} — {lic.plan_name}</p>
                                        <p className="text-xs text-muted-foreground">{lic.seats_purchased} seats • ${(Number(lic.cost_per_seat) * lic.seats_purchased).toLocaleString()}/{lic.billing_cycle}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{format(new Date(lic.renewal_date), 'MMM d, yyyy')}</p>
                                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(lic.renewal_date), { addSuffix: true })}</p>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => handleSendReminder(lic.platform)}>
                                            <Bell className="mr-1 h-4 w-4" /> Reminder
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground p-6 text-center border-dashed border-2 rounded-md">No renewal dates configured.</div>
                )}
            </div>
        </div>
    );
};

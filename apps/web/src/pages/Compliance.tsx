import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { AlertTriangle, Clock, ShieldAlert, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export const Compliance = () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const { data, error } = await supabase
                .from('compliance_alerts')
                .select('*, licenses(platform)')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (!error && data) {
                const mapped = data.map((alert: any) => ({
                    id: alert.id,
                    title: alert.title,
                    platform: alert.licenses?.platform || 'System',
                    message: alert.description,
                    severity: alert.severity,
                    type: alert.alert_type,
                    date: formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })
                }));
                setAlerts(mapped);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getAlertIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'critical': return <ShieldAlert className="h-5 w-5 text-red-500" />;
            case 'high':
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            default: return <AlertCircle className="h-5 w-5 text-blue-500" />;
        }
    };

    const handleResolve = async (id: string, action: 'resolved' | 'ignored') => {
        setAlerts(alerts.filter(a => a.id !== id));
        try {
            await supabase
                .from('compliance_alerts')
                .update({ status: action })
                .eq('id', id);
        } catch (error) {
            console.error(`Error updating alert ${id}:`, error);
            fetchAlerts();
        }
    };

    const criticalCount = alerts.filter(a => a.severity.toLowerCase() === 'critical').length;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Compliance & Risk</h1>
                <p className="text-muted-foreground">Monitor license violations, upcoming renewals, and shadow IT.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_350px]">
                {/* Alerts List */}
                <div className="flex flex-col gap-4">
                    <Card>
                        <CardHeader className="pb-3 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">Active Alerts</CardTitle>
                                {criticalCount > 0 && <Badge variant="destructive" className="ml-2">{criticalCount} Critical</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : alerts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="bg-muted p-4 rounded-full mb-4">
                                        <CheckCircle className="h-8 w-8 text-green-500" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-1">All clear</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">
                                        No active compliance alerts. Connect more integrations to increase coverage.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {alerts.map(alert => (
                                        <div key={alert.id} className="p-4 hover:bg-muted/30 transition-colors flex gap-4">
                                            <div className="mt-1 flex-shrink-0">
                                                {getAlertIcon(alert.severity)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {alert.date}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{alert.message}</p>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <Badge variant="outline" className="text-xs truncate max-w-[120px]">{alert.platform}</Badge>
                                                    <Badge variant="secondary" className="text-xs capitalize">{alert.type.replace('_', ' ')}</Badge>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id, 'resolved')}>Resolve</Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleResolve(alert.id, 'ignored')}>Ignore</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Overuse Detector Widget - Only show if there's overuse content (mocked for demo if empty) */}
                    {alerts.some(a => a.type === 'overuse') && (
                        <Card className="border-red-200">
                            <CardHeader className="bg-red-50/50 pb-4">
                                <CardTitle className="text-red-800 flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    License Overuse Detected
                                </CardTitle>
                                <CardDescription className="text-red-700/80">Immediate action required to avoid true-up penalties.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div>
                                        <h4 className="font-medium text-red-900">Over-provisioned Platform</h4>
                                        <p className="text-sm text-red-800/80">View active users vs purchased seats in Licenses tab.</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-red-600">Action Needed</div>
                                    </div>
                                </div>
                                <Button className="w-full mt-4" variant="destructive">Purchase Additional Seats</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Sidebar: Calendar */}
                <div className="flex flex-col gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Renewal Calendar</CardTitle>
                            <CardDescription>Upcoming subscription renewals</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border shadow-sm w-full"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Upcoming Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-center p-4">
                                    <p className="text-sm text-muted-foreground">No upcoming events this month.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

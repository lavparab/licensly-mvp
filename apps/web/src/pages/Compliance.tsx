import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { AlertTriangle, Clock, ShieldAlert, AlertCircle, CheckCircle } from 'lucide-react';

const ALERTS = [
    { id: '1', title: 'GitHub Over-Provisioned', platform: 'GitHub', message: 'You have exhausted your 50 Enterprise seats. 2 new developers are unable to join the organization.', severity: 'critical', type: 'overuse', date: '2 hours ago' },
    { id: '2', title: 'Adobe CC Renewal Fast Approaching', platform: 'Adobe CC', message: '15 All Apps licenses renew on 2026-08-01. Review utilization before the 30-day cancellation window.', severity: 'warning', type: 'renewal', date: 'Yesterday' },
    { id: '3', title: 'Shadow IT Detected: Miro', platform: 'O365 SSO Logs', message: 'Detected 4 unique logins to Miro via Microsoft SSO. This application is not currently tracked.', severity: 'info', type: 'shadow_it', date: '3 days ago' },
];

export const Compliance = () => {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 7, 15)); // Mock Date

    const getAlertIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <ShieldAlert className="h-5 w-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            default: return <AlertCircle className="h-5 w-5 text-blue-500" />;
        }
    };

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
                                <Badge variant="destructive" className="ml-2">1 Critical</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/50">
                                {ALERTS.map(alert => (
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
                                                <Badge variant="outline" className="text-xs">{alert.platform}</Badge>
                                                <Badge variant="secondary" className="text-xs capitalize">{alert.type}</Badge>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button size="sm" variant="outline">Resolve</Button>
                                            <Button size="sm" variant="ghost">Ignore</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Overuse Detector Widget */}
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
                                    <h4 className="font-medium text-red-900">GitHub Enterprise</h4>
                                    <p className="text-sm text-red-800/80">52 active users across 50 purchased seats.</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-red-600">2 Seats Over</div>
                                </div>
                            </div>
                            <Button className="w-full mt-4" variant="destructive">Purchase Additional Seats</Button>
                        </CardContent>
                    </Card>
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
                                modifiers={{
                                    booked: [new Date(2026, 7, 1), new Date(2026, 7, 15), new Date(2026, 7, 28)]
                                }}
                                modifiersStyles={{
                                    booked: { fontWeight: 'bold', backgroundColor: 'hsl(var(--destructive))', color: 'white' }
                                }}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">August 2026 Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium">Aug 1: Adobe CC</p>
                                        <p className="text-xs text-muted-foreground">15 Licenses Renew ($1800)</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium">Aug 15: Notified Date</p>
                                        <p className="text-xs text-muted-foreground">Review Zoom Pro Renewal</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium">Aug 28: Microsoft Teams</p>
                                        <p className="text-xs text-muted-foreground">150 E3 Licenses Renew</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

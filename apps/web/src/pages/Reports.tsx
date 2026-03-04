import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { FileText, Download, Plus, Loader2, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';

const REPORT_TYPES = [
    { value: 'utilization', label: 'Utilization Report', desc: 'Seat usage and activity across all platforms' },
    { value: 'optimization', label: 'Optimization Report', desc: 'Cost savings and recommendation summary' },
    { value: 'compliance', label: 'Compliance Report', desc: 'Alerts, renewals, and compliance status' },
];

export const Reports = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => { fetchReports(); }, []);

    const fetchReports = async () => {
        try {
            const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
            if (data) setReports(data);
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    };

    const generateCSVContent = async (type: string) => {
        if (type === 'utilization') {
            const { data } = await supabase.from('licenses').select('*');
            if (!data || data.length === 0) return null;
            const headers = ['Platform', 'Plan', 'Seats Purchased', 'Seats Used', 'Utilization %', 'Cost/Seat'];
            const rows = data.map(l => [l.platform, l.plan_name, l.seats_purchased, l.seats_used, Math.round((l.seats_used / (l.seats_purchased || 1)) * 100), l.cost_per_seat]);
            return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        }
        if (type === 'optimization') {
            const { data } = await supabase.from('optimization_recommendations').select('*, licenses(platform)');
            if (!data || data.length === 0) return null;
            const headers = ['Platform', 'Type', 'Estimated Savings', 'Status'];
            const rows = data.map(r => [r.licenses?.platform || 'Unknown', r.type, r.estimated_savings, r.status]);
            return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        }
        if (type === 'compliance') {
            const { data } = await supabase.from('compliance_alerts').select('*, licenses(platform)');
            if (!data || data.length === 0) return null;
            const headers = ['Platform', 'Alert Type', 'Severity', 'Message', 'Resolved', 'Due Date'];
            const rows = data.map(a => [a.licenses?.platform || 'Unknown', a.alert_type, a.severity, `"${a.message}"`, a.is_resolved, a.due_date]);
            return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        }
        return null;
    };

    const handleGenerate = async (type: string) => {
        setGenerating(type);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) { clearInterval(interval); return 90; }
                return prev + 15;
            });
        }, 300);

        const csv = await generateCSVContent(type);
        clearInterval(interval);
        setProgress(100);

        await new Promise(r => setTimeout(r, 500));

        if (csv) {
            // Save report record
            try {
                await supabase.from('reports').insert({
                    org_id: (await supabase.from('users').select('org_id').eq('id', (await supabase.auth.getUser()).data.user?.id).single()).data?.org_id,
                    type,
                    file_url: `generated-${Date.now()}.csv`,
                });
                await fetchReports();
            } catch (err) { console.error(err); }

            // Download
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`; a.click();
            URL.revokeObjectURL(url);
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated and downloaded!`);
        } else {
            toast.error('No data available for this report type');
        }

        setGenerating(null);
        setProgress(0);
    };

    const handleDownload = async (report: any) => {
        const csv = await generateCSVContent(report.type);
        if (csv) {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${report.type}-report-${format(new Date(report.created_at), 'yyyy-MM-dd')}.csv`; a.click();
            URL.revokeObjectURL(url);
            toast.success('Report downloaded!');
        } else {
            toast.error('No data available for download');
        }
    };

    if (isLoading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                <p className="text-muted-foreground">Generate and download reports for your SaaS landscape.</p>
            </div>

            {/* Generate Reports */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Generate New Report</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {REPORT_TYPES.map(rt => (
                        <Card key={rt.value} className="flex flex-col">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-base">{rt.label}</CardTitle>
                                </div>
                                <CardDescription className="text-xs">{rt.desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col justify-end">
                                {generating === rt.value ? (
                                    <div className="space-y-2">
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">Generating... {progress}%</p>
                                    </div>
                                ) : (
                                    <Button className="w-full" onClick={() => handleGenerate(rt.value)}>
                                        <Plus className="mr-2 h-4 w-4" /> Generate
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Past Reports */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Report History</h2>
                {reports.length > 0 ? (
                    <div className="space-y-2">
                        {reports.map(report => (
                            <Card key={report.id}>
                                <CardContent className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium text-sm capitalize">{report.type} Report</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize">{report.type}</Badge>
                                        <Button size="sm" variant="outline" onClick={() => handleDownload(report)}>
                                            <Download className="mr-1 h-4 w-4" /> Download
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                        <div className="bg-muted p-4 rounded-full mb-4"><FileText className="h-8 w-8 text-muted-foreground" /></div>
                        <CardTitle className="text-xl mb-2">No reports generated yet</CardTitle>
                        <CardDescription>Generate your first report above to track your SaaS landscape.</CardDescription>
                    </Card>
                )}
            </div>
        </div>
    );
};

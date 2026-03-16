import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { FileText, Download, Plus, Loader2, BarChart3 } from 'lucide-react';
import { api } from '../lib/api';
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
            const data = await api.get('/api/reports');
            if (data && data.reports) setReports(data.reports);
        } catch (err) { 
            console.error(err); 
            toast.error('Failed to load reports history');
        }
        finally { setIsLoading(false); }
    };

    const handleGenerate = async (type: string) => {
        setGenerating(type);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + 15, 90));
        }, 300);

        try {
            const blob = await api.download('/api/reports/generate', { type, format: 'csv' });
            clearInterval(interval);
            setProgress(100);

            await new Promise(r => setTimeout(r, 500));

            // Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated!`);
            await fetchReports();
        } catch (err: any) {
            clearInterval(interval);
            toast.error(err.message || 'Failed to generate report. No basic data available.');
        }

        setGenerating(null);
        setProgress(0);
    };

    const handleDownload = async (report: any) => {
        try {
            const blob = await api.download('/api/reports/generate', { type: report.type, format: 'csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); 
            a.href = url; 
            a.download = `${report.type}-report-${format(new Date(report.created_at), 'yyyy-MM-dd')}.csv`; 
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Report downloaded!');
        } catch (err: any) {
            toast.error(err.message || 'Failed to download report');
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

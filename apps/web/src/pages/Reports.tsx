import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { FileText, Download, Target, Printer, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

export const Reports = () => {
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const { data, error } = await supabase
                    .from('reports')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    setReports(data);
                }
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, []);

    const handleGenerate = () => {
        // Mock generation
        console.log('Generating report...');
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                <p className="text-muted-foreground">Generate and export historical data for auditing and financial planning.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">

                {/* Generate Report Form */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Generate New Report</CardTitle>
                        <CardDescription>Configure parameters for export.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Report Type</label>
                            <Select defaultValue="utilization">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="utilization">License Utilization</SelectItem>
                                    <SelectItem value="optimization">Cost Optimization</SelectItem>
                                    <SelectItem value="compliance">Compliance & Audits</SelectItem>
                                    <SelectItem value="billing">Vendor Billing Summary</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date Range</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="date" defaultValue="2026-07-01" />
                                <Input type="date" defaultValue="2026-08-15" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Export Format</label>
                            <Select defaultValue="pdf">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select format" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF Document</SelectItem>
                                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                                    <SelectItem value="json">JSON</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleGenerate}>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate Report
                        </Button>
                    </CardFooter>
                </Card>

                {/* Report History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Report History</CardTitle>
                        <CardDescription>Recently generated reports available for download.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground border-dashed border-2 rounded-lg">
                                <FileText className="h-8 w-8 mb-2 opacity-50" />
                                <p>No reports generated yet.</p>
                                <p>Use the form on the left to generate your first report.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Report Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Date Generated</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reports.map((report) => (
                                            <TableRow key={report.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {report.format?.toUpperCase() === 'PDF' ? <Printer className="h-4 w-4 text-blue-500" /> : <Target className="h-4 w-4 text-green-500" />}
                                                        {report.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="capitalize">{report.report_type.replace('_', ' ')}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {format(new Date(report.created_at), 'yyyy-MM-dd')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" className="h-8" onClick={() => window.open(report.file_url, '_blank')}>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

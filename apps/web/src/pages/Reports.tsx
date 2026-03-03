import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { FileText, Download, Target, Printer } from 'lucide-react';

const MOCK_REPORTS = [
    { id: '1', name: 'Q2 2026 License Utilization', type: 'Utilization', format: 'PDF', date: '2026-07-01', size: '2.4 MB' },
    { id: '2', name: 'August Cost Savings Opportunities', type: 'Optimization', format: 'Excel', date: '2026-08-01', size: '1.1 MB' },
    { id: '3', name: 'Compliance & Audit Log Report', type: 'Compliance', format: 'PDF', date: '2026-08-15', size: '4.5 MB' },
];

export const Reports = () => {
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
                        <Button className="w-full">
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
                                {MOCK_REPORTS.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {report.format === 'PDF' ? <Printer className="h-4 w-4 text-blue-500" /> : <Target className="h-4 w-4 text-green-500" />}
                                                {report.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{report.type}</TableCell>
                                        <TableCell className="text-muted-foreground">{report.date}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" className="h-8">
                                                <Download className="mr-2 h-4 w-4" />
                                                {report.size}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Download, Loader2, BarChart3, DollarSign, Shield, Plug } from 'lucide-react';
import { toast } from 'sonner';

const REPORT_TYPES = [
    {
        id: 'utilization',
        title: 'License Utilization Report',
        description: 'Complete breakdown of seat usage, utilization rates, and unused seats across all platforms.',
        icon: BarChart3,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-900',
    },
    {
        id: 'optimization',
        title: 'Cost Optimization Report',
        description: 'AI-powered savings opportunities, spend analysis, and actionable recommendations.',
        icon: DollarSign,
        color: 'text-green-600',
        bg: 'bg-green-50 dark:bg-green-950/30',
        border: 'border-green-200 dark:border-green-900',
    },
    {
        id: 'compliance',
        title: 'Compliance Audit Report',
        description: 'Compliance score, active alerts, expiring licenses, and audit trail.',
        icon: Shield,
        color: 'text-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-900',
    },
    {
        id: 'integrations',
        title: 'Integration Summary Report',
        description: 'Connected platforms, sync status, and license coverage across all integrations.',
        icon: Plug,
        color: 'text-purple-600',
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        border: 'border-purple-200 dark:border-purple-900',
    },
];

export const Reports = () => {
    const [generating, setGenerating] = useState<string | null>(null);

    const handleGenerate = async (type: string, format: 'pdf' | 'csv') => {
        const key = `${type}-${format}`;
        setGenerating(key);

        try {
            const { supabase } = await import('../lib/supabase');
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                toast.error('Not authenticated. Please log in again.');
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/reports/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ type, format })
                }
            );

            if (!response.ok) throw new Error('Failed to generate report');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `licensly-${type}-report-${new Date().toISOString().split('T')[0]}.${format}`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success(`${format.toUpperCase()} report downloaded successfully!`);
        } catch (err: any) {
            toast.error(err.message || 'Failed to generate report');
        } finally {
            setGenerating(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                <p className="text-muted-foreground">Generate and download professional reports for your SaaS licenses.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {REPORT_TYPES.map(report => {
                    const Icon = report.icon;
                    const isPDFLoading = generating === `${report.id}-pdf`;
                    const isCSVLoading = generating === `${report.id}-csv`;

                    return (
                        <Card key={report.id} className={`border ${report.border} ${report.bg}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg bg-white dark:bg-[#1a1a1a] border ${report.border}`}>
                                        <Icon className={`h-5 w-5 ${report.color}`} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{report.title}</CardTitle>
                                        <CardDescription className="text-xs mt-0.5">{report.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex gap-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleGenerate(report.id, 'pdf')}
                                        disabled={!!generating}
                                        className="flex-1 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-[#ededed] border border-gray-200 dark:border-[#2e2e2e] hover:bg-gray-50 dark:hover:bg-[#2e2e2e]"
                                    >
                                        {isPDFLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <FileText className="mr-2 h-4 w-4 text-red-500" />
                                        )}
                                        {isPDFLoading ? 'Generating...' : 'Export PDF'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleGenerate(report.id, 'csv')}
                                        disabled={!!generating}
                                        className="flex-1 bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2e2e2e]"
                                    >
                                        {isCSVLoading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Download className="mr-2 h-4 w-4 text-green-500" />
                                        )}
                                        {isCSVLoading ? 'Generating...' : 'Export CSV'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Info section */}
            <Card className="bg-white dark:bg-[#111111] border-gray-200 dark:border-[#2e2e2e]">
                <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-[#ededed]">Reports use your real-time data</p>
                            <p className="text-xs text-gray-500 dark:text-[#666666] mt-0.5">
                                All reports are generated from your live license, integration, and compliance data.
                                PDF reports include charts and formatted tables. CSV exports are compatible with Excel and Google Sheets.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

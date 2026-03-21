import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, X, TrendingDown, TrendingUp, Trash2, GitMerge, DollarSign, Loader2, Sparkles, Minus, Building2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import { CardLoader } from '../components/LoadingScreen';
import { EmptyState } from '../components/EmptyState';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

type RecommendationType = 'downgrade' | 'remove' | 'consolidate';

interface Recommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    savings: number;
    platform: string;
    status: string;
}

export const Optimization = () => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [accepted, setAccepted] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);
    const { session } = useAuth();

    const [benchmarks, setBenchmarks] = useState<any>(null);
    const [benchmarkLoading, setBenchmarkLoading] = useState(true);

    useEffect(() => {
        if (session) fetchRecommendations();
    }, [session]);

    useEffect(() => {
        api.get('/api/ai/benchmarks')
            .then(setBenchmarks)
            .catch(console.error)
            .finally(() => setBenchmarkLoading(false));
    }, []);

    const fetchRecommendations = async () => {
        try {
            const data = await api.get('/api/ai/recommendations');

            if (data) {
                const mapped = data.map((rec: any) => ({
                    id: rec.id,
                    type: rec.type as RecommendationType,
                    title: `${rec.type === 'downgrade' ? 'Downgrade' : rec.type === 'remove' ? 'Remove unused' : 'Consolidate'} license`,
                    description: `Optimization recommendation for ${rec.licenses?.platform || 'platform'}`,
                    savings: Number(rec.estimated_savings),
                    platform: rec.licenses?.platform || 'Unknown',
                    status: rec.status,
                }));
                setRecommendations(mapped.filter((r: Recommendation) => r.status === 'pending'));
                setAccepted(mapped.filter((r: Recommendation) => r.status === 'accepted'));
            }
        } catch (error) { console.error('Error:', error); }
        finally { setIsLoading(false); }
    };

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            await api.post('/api/ai/analyze');
            toast.success('AI Analysis complete! New recommendations generated.');
            await fetchRecommendations();
        } catch (error: any) {
            console.error('Analysis failed:', error);
            toast.error(error.message || 'Failed to run AI analysis. Please ensure you have licenses and integrations setup.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const pendingSavings = recommendations.reduce((acc, r) => acc + r.savings, 0);
    const acceptedSavings = accepted.reduce((acc, r) => acc + r.savings, 0);

    const handleAction = async (id: string, action: 'accept' | 'dismiss') => {
        setActionId(id);
        const rec = recommendations.find(r => r.id === id);
        try {
            await api.patch(`/api/ai/recommendations/${id}`, {
                status: action === 'accept' ? 'accepted' : 'dismissed'
            });

            if (action === 'accept' && rec) {
                setAccepted(prev => [...prev, { ...rec, status: 'accepted' }]);
                toast.success(`Saved $${rec.savings.toFixed(2)}/mo by accepting recommendation!`);
            } else {
                toast('Recommendation dismissed');
            }
            setRecommendations(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to update recommendation');
        }
        setActionId(null);
    };

    const getIcon = (type: RecommendationType) => {
        switch (type) {
            case 'downgrade': return <TrendingDown className="h-5 w-5 text-blue-500" />;
            case 'remove': return <Trash2 className="h-5 w-5 text-red-500" />;
            case 'consolidate': return <GitMerge className="h-5 w-5 text-purple-500" />;
        }
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Optimization</h1>
                    <p className="text-muted-foreground">AI-driven recommendations to reduce wasted spend.</p>
                </div>
                <Button onClick={handleRunAnalysis} disabled={isAnalyzing} variant="default">
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <div className="mr-2 h-4 w-4 flex items-center justify-center">✨</div>}
                    {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                </Button>
            </div>

            {/* Savings Counters */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-green-50/50 dark:bg-[#111111] border-green-200 dark:border-[#2e2e2e]">
                    <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full"><DollarSign className="h-5 w-5 text-green-700 dark:text-green-400" /></div>
                                <div>
                                    <CardTitle className="text-green-800 dark:text-green-300 text-sm">Pending Savings</CardTitle>
                                    <CardDescription className="text-green-700/80 dark:text-green-400/70">{recommendations.length} recommendations</CardDescription>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">${pendingSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo</div>
                        </div>
                    </CardHeader>
                </Card>
                <Card className="bg-blue-50/50 dark:bg-[#111111] border-blue-200 dark:border-[#2e2e2e]">
                    <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full"><Check className="h-5 w-5 text-blue-700 dark:text-blue-400" /></div>
                                <div>
                                    <CardTitle className="text-blue-800 dark:text-blue-300 text-sm">Accepted Savings</CardTitle>
                                    <CardDescription className="text-blue-700/80 dark:text-blue-400/70">{accepted.length} applied</CardDescription>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">${acceptedSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo</div>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            {/* Pending Recommendations */}
            <div className="grid gap-4">
                {recommendations.length > 0 ? recommendations.map(rec => (
                    <Card key={rec.id} className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2e2e2e]">
                        <div className="flex flex-col md:flex-row md:items-center">
                            <CardHeader className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    {getIcon(rec.type)}
                                    <Badge variant="outline" className="capitalize">{rec.type}</Badge>
                                    <span className="text-sm font-medium text-muted-foreground">{rec.platform}</span>
                                </div>
                                <CardTitle className="text-lg">{rec.title}</CardTitle>
                                <CardDescription>{rec.description}</CardDescription>
                            </CardHeader>
                            <div className="flex flex-col p-6 pt-0 md:pt-6 md:items-end gap-4 min-w-[200px]">
                                <div className="text-xl font-bold text-green-600">Saves ${rec.savings.toFixed(2)}/mo</div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <Button variant="outline" className="flex-1 md:flex-none" onClick={() => handleAction(rec.id, 'dismiss')} disabled={actionId === rec.id}>
                                        <X className="mr-2 h-4 w-4" /> Dismiss
                                    </Button>
                                    <Button className="flex-1 md:flex-none" onClick={() => handleAction(rec.id, 'accept')} disabled={actionId === rec.id}>
                                        {actionId === rec.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                        Accept
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <EmptyState
                        icon={Sparkles}
                        title="All optimized!"
                        description="No pending recommendations. Run an AI analysis to discover cost saving opportunities across your licenses."
                        actionLabel="Run AI Analysis"
                        onAction={handleRunAnalysis}
                    />
                )}
            </div>

            {/* Benchmarking Section */}
            <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-5 w-5 text-[#2563eb]" />
                    <h2 className="text-lg font-semibold">Industry Benchmarking</h2>
                    <Badge variant="outline" className="text-[11px] dark:border-[#2e2e2e]">
                        {benchmarks?.industry || 'Technology'} Industry
                    </Badge>
                </div>

                {benchmarkLoading ? (
                    <CardLoader message="Comparing against industry benchmarks..." />
                ) : benchmarks ? (
                    <div className="space-y-4">

                        {/* Key Metrics Comparison */}
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* Utilization Rate */}
                            <Card className="bg-white dark:bg-[#111111] border-gray-200 dark:border-[#2e2e2e]">
                                <CardContent className="pt-4">
                                    <p className="text-[12px] text-gray-500 dark:text-[#666666] mb-1">Seat Utilization</p>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-2xl font-bold font-mono text-gray-900 dark:text-[#ededed]">
                                            {benchmarks.metrics.utilizationRate}%
                                        </span>
                                        <span className="text-[12px] text-gray-400 dark:text-[#666666] mb-1">
                                            vs {benchmarks.metrics.benchmarkUtilizationRate}% avg
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-[#2e2e2e] rounded-full overflow-hidden mb-2">
                                        <div
                                            className="h-full rounded-full bg-[#2563eb]"
                                            style={{ width: `${Math.min(benchmarks.metrics.utilizationRate, 100)}%` }}
                                        />
                                    </div>
                                    <div className={`flex items-center gap-1 text-[11px] font-medium ${benchmarks.metrics.utilizationScore === 'above' ? 'text-green-600' : 'text-amber-600'}`}>
                                        {benchmarks.metrics.utilizationScore === 'above' ? (
                                            <><TrendingUp className="h-3 w-3" /> Above industry average</>
                                        ) : (
                                            <><TrendingDown className="h-3 w-3" /> Below industry average</>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Spend per Employee */}
                            <Card className="bg-white dark:bg-[#111111] border-gray-200 dark:border-[#2e2e2e]">
                                <CardContent className="pt-4">
                                    <p className="text-[12px] text-gray-500 dark:text-[#666666] mb-1">Annual Spend/Employee</p>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-2xl font-bold font-mono text-gray-900 dark:text-[#ededed]">
                                            ${benchmarks.metrics.spendPerEmployee.toLocaleString()}
                                        </span>
                                        <span className="text-[12px] text-gray-400 dark:text-[#666666] mb-1">
                                            vs ${benchmarks.metrics.benchmarkSpendPerEmployee.toLocaleString()} avg
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-[#2e2e2e] rounded-full overflow-hidden mb-2">
                                        <div
                                            className="h-full rounded-full bg-[#8b5cf6]"
                                            style={{ width: `${Math.min((benchmarks.metrics.spendPerEmployee / benchmarks.metrics.benchmarkSpendPerEmployee) * 100, 150)}%` }}
                                        />
                                    </div>
                                    <div className={`flex items-center gap-1 text-[11px] font-medium ${benchmarks.metrics.spendScore === 'below' ? 'text-green-600' : 'text-red-600'}`}>
                                        {benchmarks.metrics.spendScore === 'below' ? (
                                            <><TrendingDown className="h-3 w-3" /> Spending efficiently</>
                                        ) : (
                                            <><TrendingUp className="h-3 w-3" /> Above industry average</>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Tool Count */}
                            <Card className="bg-white dark:bg-[#111111] border-gray-200 dark:border-[#2e2e2e]">
                                <CardContent className="pt-4">
                                    <p className="text-[12px] text-gray-500 dark:text-[#666666] mb-1">SaaS Tools in Use</p>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-2xl font-bold font-mono text-gray-900 dark:text-[#ededed]">
                                            {benchmarks.metrics.toolCount}
                                        </span>
                                        <span className="text-[12px] text-gray-400 dark:text-[#666666] mb-1">
                                            vs {benchmarks.metrics.benchmarkToolCount} avg
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-[#2e2e2e] rounded-full overflow-hidden mb-2">
                                        <div
                                            className="h-full rounded-full bg-[#10b981]"
                                            style={{ width: `${Math.min((benchmarks.metrics.toolCount / benchmarks.metrics.benchmarkToolCount) * 100, 150)}%` }}
                                        />
                                    </div>
                                    <div className={`flex items-center gap-1 text-[11px] font-medium ${benchmarks.metrics.toolCount <= benchmarks.metrics.benchmarkToolCount ? 'text-green-600' : 'text-amber-600'}`}>
                                        {benchmarks.metrics.toolCount <= benchmarks.metrics.benchmarkToolCount ? (
                                            <><CheckCircle className="h-3 w-3" /> Within industry range</>
                                        ) : (
                                            <><AlertTriangle className="h-3 w-3" /> More tools than average</>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Platform Cost Comparison */}
                        {benchmarks.platformComparisons?.length > 0 && (
                            <Card className="bg-white dark:bg-[#111111] border-gray-200 dark:border-[#2e2e2e]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">Cost per Seat vs Industry Average</CardTitle>
                                    <CardDescription className="text-xs">
                                        Compare what you pay against {benchmarks.industry} industry benchmarks
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {benchmarks.platformComparisons.map((p: any) => (
                                            <div key={p.platform} className="flex items-center gap-4">
                                                <div className="w-28 shrink-0">
                                                    <p className="text-[13px] font-medium text-gray-900 dark:text-[#ededed] truncate">{p.platform}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="flex-1 h-2 bg-gray-100 dark:bg-[#2e2e2e] rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${p.status === 'overpaying' ? 'bg-red-500' : p.status === 'good_deal' ? 'bg-green-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${Math.min((p.actualCostPerSeat / (p.benchmarkCostPerSeat * 1.5)) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] text-gray-500 dark:text-[#666666]">
                                                            You: ${p.actualCostPerSeat}/seat • Avg: ${p.benchmarkCostPerSeat}/seat
                                                        </span>
                                                        <span className={`text-[11px] font-medium ${p.status === 'overpaying' ? 'text-red-500' : p.status === 'good_deal' ? 'text-green-500' : 'text-gray-500 dark:text-[#666666]'}`}>
                                                            {p.percentDiff > 0 ? '+' : ''}{p.percentDiff}%
                                                            {p.status === 'overpaying' && p.monthlySavingsPotential > 0 && (
                                                                <span className="text-red-400"> • Save ${p.monthlySavingsPotential}/mo</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    {p.status === 'overpaying' && <TrendingUp className="h-4 w-4 text-red-500" />}
                                                    {p.status === 'good_deal' && <TrendingDown className="h-4 w-4 text-green-500" />}
                                                    {p.status === 'on_par' && <Minus className="h-4 w-4 text-gray-400" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {benchmarks.metrics.totalBenchmarkSavings > 0 && (
                                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                                            <p className="text-[13px] font-medium text-red-700 dark:text-red-400">
                                                💡 Potential savings from price negotiation: ${benchmarks.metrics.totalBenchmarkSavings}/month
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* AI Insights */}
                        {benchmarks.aiInsights?.length > 0 && (
                            <Card className="bg-white dark:bg-[#111111] border-gray-200 dark:border-[#2e2e2e]">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-[#2563eb]" />
                                        AI Benchmark Insights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {benchmarks.aiInsights.map((insight: any, i: number) => (
                                            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${
                                                insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900' :
                                                insight.type === 'success' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' :
                                                'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                                            }`}>
                                                {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
                                                {insight.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />}
                                                {insight.type === 'info' && <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />}
                                                <div>
                                                    <p className={`text-[13px] font-medium ${
                                                        insight.type === 'warning' ? 'text-amber-800 dark:text-amber-300' :
                                                        insight.type === 'success' ? 'text-green-800 dark:text-green-300' :
                                                        'text-blue-800 dark:text-blue-300'
                                                    }`}>{insight.title}</p>
                                                    <p className="text-[12px] text-gray-600 dark:text-[#a1a1a1] mt-0.5">{insight.description}</p>
                                                </div>
                                                <Badge variant="outline" className={`shrink-0 text-[10px] ml-auto ${
                                                    insight.impact === 'high' ? 'border-red-300 text-red-600' :
                                                    insight.impact === 'medium' ? 'border-amber-300 text-amber-600' :
                                                    'border-gray-300 text-gray-500'
                                                }`}>
                                                    {insight.impact} impact
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Industry Platforms */}
                        <Card className="bg-white dark:bg-[#111111] border-gray-200 dark:border-[#2e2e2e]">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold">
                                    Platform Popularity in {benchmarks.industry}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Most used SaaS tools in your industry
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {benchmarks.topIndustryPlatforms?.map((platform: string) => {
                                        const isConnected = benchmarks.connectedPlatforms?.includes(platform.toLowerCase());
                                        return (
                                            <div key={platform} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-medium ${
                                                isConnected
                                                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                                    : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#2e2e2e] text-gray-600 dark:text-[#a1a1a1]'
                                            }`}>
                                                {isConnected && <CheckCircle className="h-3 w-3" />}
                                                {platform}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-[11px] text-gray-400 dark:text-[#666666] mt-3">
                                    Green = Connected to Licensly • Gray = Not yet connected
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

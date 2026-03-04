import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, X, TrendingDown, Trash2, GitMerge, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

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
    const [actionId, setActionId] = useState<string | null>(null);

    useEffect(() => { fetchRecommendations(); }, []);

    const fetchRecommendations = async () => {
        try {
            const { data, error } = await supabase
                .from('optimization_recommendations')
                .select('*, licenses(platform)')
                .in('status', ['pending', 'accepted']);

            if (!error && data) {
                const mapped = data.map((rec: any) => ({
                    id: rec.id,
                    type: rec.type as RecommendationType,
                    title: `${rec.type === 'downgrade' ? 'Downgrade' : rec.type === 'remove' ? 'Remove unused' : 'Consolidate'} license`,
                    description: `Optimization recommendation for ${rec.licenses?.platform || 'platform'}`,
                    savings: Number(rec.estimated_savings),
                    platform: rec.licenses?.platform || 'Unknown',
                    status: rec.status,
                }));
                setRecommendations(mapped.filter(r => r.status === 'pending'));
                setAccepted(mapped.filter(r => r.status === 'accepted'));
            }
        } catch (error) { console.error('Error:', error); }
        finally { setIsLoading(false); }
    };

    const pendingSavings = recommendations.reduce((acc, r) => acc + r.savings, 0);
    const acceptedSavings = accepted.reduce((acc, r) => acc + r.savings, 0);

    const handleAction = async (id: string, action: 'accept' | 'dismiss') => {
        setActionId(id);
        const rec = recommendations.find(r => r.id === id);
        try {
            await supabase
                .from('optimization_recommendations')
                .update({ status: action === 'accept' ? 'accepted' : 'dismissed' })
                .eq('id', id);

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

    if (isLoading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Optimization</h1>
                <p className="text-muted-foreground">AI-driven recommendations to reduce wasted spend.</p>
            </div>

            {/* Savings Counters */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
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
                <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
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
                    <Card key={rec.id}>
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
                    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card">
                        <div className="bg-muted p-4 rounded-full mb-4"><Check className="h-8 w-8 text-green-500" /></div>
                        <h3 className="text-lg font-medium">All optimized!</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">No pending recommendations. Connect more integrations or check back later.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

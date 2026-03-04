import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Check, X, TrendingDown, Trash2, GitMerge, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type RecommendationType = 'downgrade' | 'remove' | 'consolidate';

interface Recommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    savings: number;
    platform: string;
}

export const Optimization = () => {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            const { data, error } = await supabase
                .from('optimization_recommendations')
                .select('*, licenses(platform)')
                .eq('status', 'open');

            if (!error && data) {
                const mapped = data.map((rec: any) => ({
                    id: rec.id,
                    type: rec.recommendation_type,
                    title: rec.title,
                    description: rec.description,
                    savings: Number(rec.potential_savings),
                    platform: rec.licenses?.platform || 'Unknown Platform'
                }));
                setRecommendations(mapped);
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const totalSavings = recommendations.reduce((acc, curr) => acc + curr.savings, 0);

    const handleAction = async (id: string, action: 'accept' | 'dismiss') => {
        // Optimistic UI update
        setRecommendations(recommendations.filter(r => r.id !== id));

        try {
            await supabase
                .from('optimization_recommendations')
                .update({ status: action === 'accept' ? 'applied' : 'dismissed' })
                .eq('id', id);
        } catch (error) {
            console.error(`Error updating recommendation ${id}:`, error);
            // Revert on failure
            fetchRecommendations();
        }
    };

    const getIcon = (type: RecommendationType) => {
        switch (type) {
            case 'downgrade': return <TrendingDown className="h-5 w-5 text-blue-500" />;
            case 'remove': return <Trash2 className="h-5 w-5 text-red-500" />;
            case 'consolidate': return <GitMerge className="h-5 w-5 text-purple-500" />;
            default: return <TrendingDown className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <div className="flex flex-col gap-6">

            {/* Header & Total Banner */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Optimization</h1>
                    <p className="text-muted-foreground">AI-driven recommendations to reduce wasted spend.</p>
                </div>

                <Card className="bg-green-50/50 border-green-200">
                    <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="bg-green-100 p-2 rounded-full">
                                    <DollarSign className="h-6 w-6 text-green-700" />
                                </div>
                                <div>
                                    <CardTitle className="text-green-800">Total Potential Savings</CardTitle>
                                    <CardDescription className="text-green-700/80">Available this billing cycle</CardDescription>
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-green-700">
                                ${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : recommendations.length > 0 ? (
                    recommendations.map((rec) => (
                        <Card key={rec.id}>
                            <div className="flex flex-col md:flex-row md:items-center">
                                <CardHeader className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {getIcon(rec.type)}
                                        <Badge variant="outline" className="capitalize">{rec.type}</Badge>
                                        <span className="text-sm font-medium text-muted-foreground">{rec.platform}</span>
                                    </div>
                                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                                    <CardDescription className="text-base">{rec.description}</CardDescription>
                                </CardHeader>
                                <div className="flex flex-col p-6 pt-0 md:pt-6 md:items-end gap-4 min-w-[200px]">
                                    <div className="text-xl font-bold text-green-600">
                                        Saves ${rec.savings}/mo
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <Button
                                            variant="outline"
                                            className="flex-1 md:flex-none"
                                            onClick={() => handleAction(rec.id, 'dismiss')}
                                        >
                                            <X className="mr-2 h-4 w-4" /> Dismiss
                                        </Button>
                                        <Button
                                            className="flex-1 md:flex-none"
                                            onClick={() => handleAction(rec.id, 'accept')}
                                        >
                                            <Check className="mr-2 h-4 w-4" /> Accept
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card">
                        <div className="bg-muted p-4 rounded-full mb-4">
                            <Check className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-medium">All optimized!</h3>
                        <p className="text-muted-foreground max-w-sm mt-2">
                            There are no more savings recommendations right now. Connect more integrations or check back later after the next sync.
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
};

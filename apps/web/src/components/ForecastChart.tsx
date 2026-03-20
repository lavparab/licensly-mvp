import { useState, useEffect } from 'react';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, Area, ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Users, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

// Detect dark mode
function useIsDark() {
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const check = () => setIsDark(document.documentElement.classList.contains('dark'));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);
    return isDark;
}

// Custom tooltip
const ForecastTooltip = ({ active, payload, label, isDark }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={`rounded-lg border px-3 py-2 shadow-lg text-[12px] ${isDark ? 'bg-[#111111] border-[#2e2e2e] text-[#ededed]' : 'bg-white border-gray-200 text-gray-900'}`}>
            <p className="font-semibold mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
                    <span>{p.name}:</span>
                    <span className="font-medium">{typeof p.value === 'number' ? (p.name.includes('Seats') ? p.value : `$${p.value.toLocaleString()}`) : p.value}</span>
                </p>
            ))}
        </div>
    );
};

export function ForecastChart() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeChart, setActiveChart] = useState<'spend' | 'platforms' | 'seats' | 'savings'>('spend');
    const isDark = useIsDark();

    const axisColor = isDark ? '#666666' : '#9ca3af';
    const gridColor = isDark ? '#2e2e2e' : '#f0f0f0';

    useEffect(() => {
        api.get('/api/dashboard/forecast')
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <Card className="bg-white dark:bg-[#111111] border-gray-200 dark:border-[#2e2e2e]">
            <CardContent className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </CardContent>
        </Card>
    );

    if (!data) return null;

    const tabs = [
        { id: 'spend', label: 'Total Spend', icon: DollarSign },
        { id: 'platforms', label: 'By Platform', icon: TrendingUp },
        { id: 'seats', label: 'Seat Growth', icon: Users },
        { id: 'savings', label: 'Savings', icon: TrendingDown },
    ] as const;

    // Get unique platforms for platform chart
    const platforms = data.months[0]?.platforms?.map((p: any) => p.platform) || [];

    // Transform data for platform chart
    const platformData = data.months.map((m: any) => {
        const obj: any = { month: m.month, isForecast: m.isForecast };
        m.platforms?.forEach((p: any) => {
            obj[p.platform] = Math.round(p.cost);
        });
        return obj;
    });

    return (
        <Card className="bg-white dark:bg-[#111111] border-gray-200 dark:border-[#2e2e2e]">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold">Cost Forecasting</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                            3-month AI projection based on current license data
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[11px] text-green-600 border-green-200 dark:border-green-800">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Save ${data.potentialSavings.toFixed(0)}/mo
                        </Badge>
                        <Badge variant="outline" className="text-[11px] dark:border-[#2e2e2e]">
                            Forecast →
                        </Badge>
                    </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3">
                        <p className="text-[11px] text-gray-500 dark:text-[#666666]">Current/mo</p>
                        <p className="text-lg font-bold font-mono text-gray-900 dark:text-[#ededed]">
                            ${data.currentSpend.toFixed(0)}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3">
                        <p className="text-[11px] text-gray-500 dark:text-[#666666]">Projected (3mo)</p>
                        <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                            ${data.projectedSpend.toFixed(0)}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3">
                        <p className="text-[11px] text-gray-500 dark:text-[#666666]">Potential Savings</p>
                        <p className="text-lg font-bold font-mono text-green-600 dark:text-green-400">
                            ${data.potentialSavings.toFixed(0)}/mo
                        </p>
                    </div>
                </div>

                {/* Chart tabs */}
                <div className="flex gap-1 mt-3 border-b border-gray-100 dark:border-[#2e2e2e] overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveChart(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium border-b-2 transition-colors ${
                                activeChart === tab.id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-[#666666] hover:text-gray-700 dark:hover:text-[#a1a1a1]'
                            }`}
                        >
                            <tab.icon className="h-3 w-3" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={280}>
                    {activeChart === 'spend' ? (
                        <ComposedChart data={data.months}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                            <Tooltip content={<ForecastTooltip isDark={isDark} />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
                            <ReferenceLine x={data.months[3]?.month} stroke={isDark ? '#2e2e2e' : '#e5e7eb'} strokeDasharray="4 4" label={{ value: 'Today', fill: axisColor, fontSize: 10 }} />
                            <Area type="monotone" dataKey="totalSpend" name="Total Spend" fill="#3b82f620" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                            <Line type="monotone" dataKey="optimizedSpend" name="With Savings" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#10b981', r: 3 }} />
                        </ComposedChart>
                    ) : activeChart === 'platforms' ? (
                        <ComposedChart data={platformData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                            <Tooltip content={<ForecastTooltip isDark={isDark} />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
                            <ReferenceLine x={data.months[3]?.month} stroke={isDark ? '#2e2e2e' : '#e5e7eb'} strokeDasharray="4 4" />
                            {platforms.slice(0, 6).map((platform: string, i: number) => (
                                <Bar key={platform} dataKey={platform} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} radius={i === platforms.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                            ))}
                        </ComposedChart>
                    ) : activeChart === 'seats' ? (
                        <ComposedChart data={data.months}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ForecastTooltip isDark={isDark} />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
                            <ReferenceLine x={data.months[3]?.month} stroke={isDark ? '#2e2e2e' : '#e5e7eb'} strokeDasharray="4 4" label={{ value: 'Today', fill: axisColor, fontSize: 10 }} />
                            <Area type="monotone" dataKey="totalSeats" name="Total Seats" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
                        </ComposedChart>
                    ) : (
                        <ComposedChart data={data.months}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                            <Tooltip content={<ForecastTooltip isDark={isDark} />} />
                            <Legend wrapperStyle={{ fontSize: 11, color: axisColor }} />
                            <ReferenceLine x={data.months[3]?.month} stroke={isDark ? '#2e2e2e' : '#e5e7eb'} strokeDasharray="4 4" label={{ value: 'Today', fill: axisColor, fontSize: 10 }} />
                            <Bar dataKey="savingsOpportunity" name="Savings Opportunity" fill="#10b981" opacity={0.8} radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="totalSpend" name="Total Spend" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                        </ComposedChart>
                    )}
                </ResponsiveContainer>

                {/* Forecast disclaimer */}
                <p className="text-[10px] text-gray-400 dark:text-[#666666] mt-2 text-center">
                    Projections based on current license data with estimated 2% monthly growth • Dashed line indicates forecast period
                </p>
            </CardContent>
        </Card>
    );
}

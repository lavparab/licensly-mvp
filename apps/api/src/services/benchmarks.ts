import { supabase } from '../utils/supabase';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Industry benchmark data (research-based averages)
const INDUSTRY_BENCHMARKS = {
    Technology: {
        avgCostPerSeatByPlatform: {
            slack: 8.75, github: 21.00, zoom: 15.99,
            'microsoft-365': 22.00, 'google-workspace': 12.00,
            'adobe-creative-cloud': 54.99, default: 15.00
        },
        avgUtilizationRate: 78,
        avgSaaSSpendPerEmployee: 4200, // annual
        avgNumberOfTools: 12,
        topPlatforms: ['Slack', 'Microsoft 365', 'Google Workspace', 'Zoom', 'GitHub'],
    },
    Finance: {
        avgCostPerSeatByPlatform: {
            slack: 8.75, zoom: 15.99,
            'microsoft-365': 22.00, default: 18.00
        },
        avgUtilizationRate: 82,
        avgSaaSSpendPerEmployee: 5100,
        avgNumberOfTools: 8,
        topPlatforms: ['Microsoft 365', 'Zoom', 'Slack', 'Salesforce'],
    },
    Healthcare: {
        avgCostPerSeatByPlatform: {
            zoom: 15.99, 'microsoft-365': 22.00, default: 16.00
        },
        avgUtilizationRate: 85,
        avgSaaSSpendPerEmployee: 3800,
        avgNumberOfTools: 7,
        topPlatforms: ['Microsoft 365', 'Zoom', 'Slack'],
    },
    Education: {
        avgCostPerSeatByPlatform: {
            zoom: 13.99, 'google-workspace': 6.00,
            'microsoft-365': 10.00, default: 10.00
        },
        avgUtilizationRate: 72,
        avgSaaSSpendPerEmployee: 2100,
        avgNumberOfTools: 6,
        topPlatforms: ['Google Workspace', 'Zoom', 'Microsoft 365'],
    },
    default: {
        avgCostPerSeatByPlatform: { default: 15.00 },
        avgUtilizationRate: 76,
        avgSaaSSpendPerEmployee: 3500,
        avgNumberOfTools: 10,
        topPlatforms: ['Slack', 'Microsoft 365', 'Zoom', 'Google Workspace'],
    }
};

export async function generateBenchmarks(orgId: string) {
    // 1. Fetch org data
    const { data: licenses } = await supabase
        .from('licenses').select('*').eq('org_id', orgId);
    
    const { data: org } = await supabase
        .from('organizations').select('industry, company_size').eq('id', orgId).single();

    const { data: integrations } = await supabase
        .from('integrations').select('platform, status').eq('org_id', orgId);

    const licenseList = licenses || [];
    const industry = org?.industry || 'default';
    const benchmarkData = INDUSTRY_BENCHMARKS[industry as keyof typeof INDUSTRY_BENCHMARKS] || INDUSTRY_BENCHMARKS.default;

    // 2. Calculate org metrics
    const totalMonthlySpend = licenseList.reduce((sum: number, l: any) =>
        sum + (Number(l.cost_per_seat) * (l.seats_purchased || 0)), 0);
    const totalSeats = licenseList.reduce((sum: number, l: any) => sum + (l.seats_purchased || 0), 0);
    const totalUsedSeats = licenseList.reduce((sum: number, l: any) => sum + (l.seats_used || 0), 0);
    const utilizationRate = totalSeats > 0 ? (totalUsedSeats / totalSeats) * 100 : 0;
    const connectedPlatforms = (integrations || []).filter((i: any) => i.status === 'connected').length;

    // 3. Parse company size for employee estimate
    const sizeMap: Record<string, number> = {
        '1-50': 25, '51-200': 125, '201-1000': 500, '1000+': 2000
    };
    const estimatedEmployees = sizeMap[org?.company_size || '1-50'] || 25;
    const annualSpend = totalMonthlySpend * 12;
    const spendPerEmployee = estimatedEmployees > 0 ? annualSpend / estimatedEmployees : 0;

    // 4. Platform cost comparisons
    const platformComparisons = licenseList.map((l: any) => {
        const platformKey = l.platform?.toLowerCase().replace(/\s+/g, '-');
        const benchmarkCost = (benchmarkData.avgCostPerSeatByPlatform as any)[platformKey]
            || (benchmarkData.avgCostPerSeatByPlatform as any).default;
        const actualCost = Number(l.cost_per_seat);
        const difference = actualCost - benchmarkCost;
        const percentDiff = benchmarkCost > 0 ? ((difference / benchmarkCost) * 100) : 0;

        return {
            platform: l.platform,
            actualCostPerSeat: actualCost,
            benchmarkCostPerSeat: benchmarkCost,
            difference: Math.round(difference * 100) / 100,
            percentDiff: Math.round(percentDiff),
            status: percentDiff > 15 ? 'overpaying' : percentDiff < -15 ? 'good_deal' : 'on_par',
            monthlySavingsPotential: difference > 0 ? Math.round(difference * (l.seats_purchased || 0) * 100) / 100 : 0
        };
    });

    // 5. Overall scores
    const utilizationScore = utilizationRate >= benchmarkData.avgUtilizationRate ? 'above' : 'below';
    const spendScore = spendPerEmployee <= benchmarkData.avgSaaSSpendPerEmployee ? 'below' : 'above';
    const totalBenchmarkSavings = platformComparisons.reduce((sum: number, p: any) => sum + p.monthlySavingsPotential, 0);

    // 6. Use Gemini for AI insights
    const prompt = `
You are a SaaS cost analyst. Based on the following benchmarking data, provide 3 concise, actionable insights.

Industry: ${industry}
Company Size: ${org?.company_size || 'Unknown'}
Current Monthly Spend: $${totalMonthlySpend.toFixed(2)}
Spend per Employee (Annual): $${spendPerEmployee.toFixed(0)} vs Industry Average: $${benchmarkData.avgSaaSSpendPerEmployee}
Utilization Rate: ${utilizationRate.toFixed(1)}% vs Industry Average: ${benchmarkData.avgUtilizationRate}%
Number of Tools: ${licenseList.length} vs Industry Average: ${benchmarkData.avgNumberOfTools}

Platform Cost Comparisons:
${platformComparisons.map((p: any) => `- ${p.platform}: $${p.actualCostPerSeat}/seat vs $${p.benchmarkCostPerSeat} industry avg (${p.percentDiff > 0 ? '+' : ''}${p.percentDiff}%)`).join('\n')}

Respond with a JSON array of exactly 3 insight objects:
[
  {
    "type": "warning" | "success" | "info",
    "title": "Short title (5-7 words)",
    "description": "One sentence actionable insight with specific numbers",
    "impact": "high" | "medium" | "low"
  }
]
Return only the JSON array, no markdown.`;

    let aiInsights = [];
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.1, responseMimeType: 'application/json' }
        });
        aiInsights = JSON.parse(response.text || '[]');
    } catch (e) {
        aiInsights = [
            { type: 'info', title: 'Benchmarking analysis complete', description: `Your organization uses ${licenseList.length} SaaS tools with ${utilizationRate.toFixed(0)}% average utilization.`, impact: 'medium' }
        ];
    }

    return {
        industry,
        companySize: org?.company_size,
        metrics: {
            utilizationRate: Math.round(utilizationRate),
            benchmarkUtilizationRate: benchmarkData.avgUtilizationRate,
            utilizationScore,
            spendPerEmployee: Math.round(spendPerEmployee),
            benchmarkSpendPerEmployee: benchmarkData.avgSaaSSpendPerEmployee,
            spendScore,
            toolCount: licenseList.length,
            benchmarkToolCount: benchmarkData.avgNumberOfTools,
            totalMonthlySpend: Math.round(totalMonthlySpend),
            totalBenchmarkSavings: Math.round(totalBenchmarkSavings),
        },
        platformComparisons,
        topIndustryPlatforms: benchmarkData.topPlatforms,
        connectedPlatforms: (integrations || []).filter((i: any) => i.status === 'connected').map((i: any) => i.platform),
        aiInsights,
    };
}

import { supabase } from '../utils/supabase';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function processNaturalLanguageQuery(orgId: string, question: string) {
    // 1. Fetch ALL org data in parallel
    const [
        licensesResult,
        integrationsResult,
        alertsResult,
        recommendationsResult  // ← removed assignmentsResult
    ] = await Promise.all([
        supabase.from('licenses').select('*').eq('org_id', orgId),
        supabase.from('integrations').select('id, platform, status, last_synced_at').eq('org_id', orgId),
        supabase.from('compliance_alerts').select('*').eq('org_id', orgId).eq('is_resolved', false),
        supabase.from('optimization_recommendations').select('*').eq('org_id', orgId).eq('status', 'pending')
    ]);

    const licenses = licensesResult.data || [];
    const integrations = integrationsResult.data || [];
    const alerts = alertsResult.data || [];
    const recommendations = recommendationsResult.data || [];

    // 2. Pre-compute useful aggregates
    const today = new Date();
    const totalMonthlySpend = licenses.reduce((sum, l) =>
        sum + (Number(l.cost_per_seat) * (l.seats_purchased || 0)), 0);
    const totalSeats = licenses.reduce((sum, l) => sum + (l.seats_purchased || 0), 0);
    const totalUsedSeats = licenses.reduce((sum, l) => sum + (l.seats_used || 0), 0);
    const utilizationRate = totalSeats > 0 ? ((totalUsedSeats / totalSeats) * 100).toFixed(1) : '0';

    const expiringIn30Days = licenses.filter(l => {
        if (!l.renewal_date) return false;
        const days = Math.ceil((new Date(l.renewal_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 30;
    });

    const expiredLicenses = licenses.filter(l => {
        if (!l.renewal_date) return false;
        return new Date(l.renewal_date) < today;
    });

    const unusedSeats = licenses.map(l => ({
        platform: l.platform,
        plan: l.plan_name,
        unused: (l.seats_purchased || 0) - (l.seats_used || 0),
        monthlyCost: Number(l.cost_per_seat) * ((l.seats_purchased || 0) - (l.seats_used || 0))
    })).filter(l => l.unused > 0);

    const connectedIntegrations = integrations.filter(i => i.status === 'connected');

    // 3. Build rich context
    const context = {
        summary: {
            totalLicenses: licenses.length,
            totalMonthlySpend: `$${totalMonthlySpend.toFixed(2)}`,
            totalSeats,
            totalUsedSeats,
            utilizationRate: `${utilizationRate}%`,
            connectedIntegrations: connectedIntegrations.length,
            openAlerts: alerts.length,
            pendingRecommendations: recommendations.length,
            potentialSavings: `$${recommendations.reduce((sum, r) => sum + Number(r.estimated_savings || 0), 0).toFixed(2)}/mo`
        },
        licenses: licenses.map(l => ({
            platform: l.platform,
            plan: l.plan_name,
            seatsPurchased: l.seats_purchased,
            seatsUsed: l.seats_used,
            unusedSeats: (l.seats_purchased || 0) - (l.seats_used || 0),
            costPerSeat: `$${Number(l.cost_per_seat).toFixed(2)}`,
            monthlyTotal: `$${(Number(l.cost_per_seat) * (l.seats_purchased || 0)).toFixed(2)}`,
            billingCycle: l.billing_cycle,
            renewalDate: l.renewal_date,
            daysUntilRenewal: l.renewal_date ? Math.ceil((new Date(l.renewal_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null,
            utilizationPct: (l.seats_purchased || 0) > 0 ? `${(((l.seats_used || 0) / l.seats_purchased) * 100).toFixed(0)}%` : '0%'
        })),
        expiringIn30Days: expiringIn30Days.map(l => ({
            platform: l.platform,
            renewalDate: l.renewal_date,
            daysLeft: Math.ceil((new Date(l.renewal_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
            monthlyCost: `$${(Number(l.cost_per_seat) * (l.seats_purchased || 0)).toFixed(2)}`
        })),
        expiredLicenses: expiredLicenses.map(l => ({
            platform: l.platform,
            expiredOn: l.renewal_date
        })),
        unusedSeats,
        integrations: integrations.map(i => ({
            platform: i.platform,
            status: i.status,
            lastSynced: i.last_synced_at
        })),
        complianceAlerts: alerts.map(a => ({
            type: a.alert_type,
            severity: a.severity,
            message: a.message
        })),
        optimizationRecommendations: recommendations.map(r => ({
            type: r.type,
            platform: r.platform,
            estimatedSavings: `$${Number(r.estimated_savings).toFixed(2)}/mo`,
            description: r.description
        }))
    };

    // 4. Build prompt
    const prompt = `
You are Licensly AI, an expert SaaS license management assistant. 
You have access to real-time data about the user's organization's licenses, integrations, and costs.

CURRENT DATE: ${today.toISOString().split('T')[0]}

ORGANIZATION DATA:
${JSON.stringify(context, null, 2)}

USER QUESTION: "${question}"

Instructions:
- Answer the question accurately using ONLY the data provided above
- Be conversational but precise
- Include specific numbers, costs, and dates from the data
- If the question asks for a list, format it clearly
- If data is not available to answer the question, say so honestly
- Keep answers concise but complete
- Never make up data that isn't in the context

Respond with a JSON object in this exact format:
{
  "answer": "Your conversational answer here with specific data points",
  "type": "text" | "list" | "table" | "metric",
  "data": null | [...] | {...},
  "followUpQuestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

For "type":
- "text": simple text answer
- "list": when answer is a list of items, put items in "data" array
- "table": when answer needs a table, put rows in "data" array
- "metric": when answer is a key number/stat, put { value, label, trend } in "data"

For "followUpQuestions": always suggest 3 relevant follow-up questions based on the answer.
`;

    // 5. Call Gemini
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
        }
    });

    const rawText = response.text || '{}';

    try {
        const parsed = JSON.parse(rawText);
        return {
            question,
            answer: parsed.answer,
            type: parsed.type || 'text',
            data: parsed.data || null,
            followUpQuestions: parsed.followUpQuestions || [],
            timestamp: new Date().toISOString()
        };
    } catch (e) {
        return {
            question,
            answer: rawText,
            type: 'text',
            data: null,
            followUpQuestions: [],
            timestamp: new Date().toISOString()
        };
    }
}

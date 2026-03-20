import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/dashboard/stats — Aggregated dashboard metrics
router.get('/stats', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    // Run all queries in parallel
    const [licensesResult, savingsResult, alertsResult] = await Promise.all([
        supabase
            .from('licenses')
            .select('*')
            .eq('org_id', orgId),
        supabase
            .from('optimization_recommendations')
            .select('estimated_savings')
            .eq('org_id', orgId)
            .eq('status', 'pending'),
        supabase
            .from('compliance_alerts')
            .select('*')
            .eq('org_id', orgId)
            .eq('is_resolved', false)
            .order('created_at', { ascending: false })
            .limit(10),
    ]);

    const licenses = licensesResult.data || [];
    const savings = savingsResult.data || [];
    const alerts = alertsResult.data || [];

    // Calculate stats
    let totalSpend = 0;
    let activeSeats = 0;
    let totalSeats = 0;
    const spendByPlatform: Record<string, number> = {};
    const upcomingRenewals: any[] = [];
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const lic of licenses) {
        const cost = Number(lic.cost_per_seat) * lic.seats_purchased;
        totalSpend += cost;
        activeSeats += lic.seats_used;
        totalSeats += lic.seats_purchased;
        spendByPlatform[lic.platform] = (spendByPlatform[lic.platform] || 0) + cost;

        if (lic.renewal_date) {
            const renewal = new Date(lic.renewal_date);
            if (renewal >= now && renewal <= thirtyDaysOut) {
                upcomingRenewals.push(lic);
            }
        }
    }

    const totalSavings = savings.reduce((acc, s) => acc + Number(s.estimated_savings), 0);

    let criticalAlerts = 0;
    let warningAlerts = 0;
    for (const a of alerts) {
        if (a.severity === 'critical') criticalAlerts++;
        if (a.severity === 'warning') warningAlerts++;
    }

    const platformSpend = Object.entries(spendByPlatform)
        .map(([name, spend]) => ({ name, spend }))
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5);

    upcomingRenewals.sort((a, b) =>
        new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime()
    );

    res.json({
        stats: {
            totalSpend,
            savings: totalSavings,
            activeSeats,
            totalSeats,
            criticalAlerts,
            warningAlerts,
        },
        platformSpend,
        utilizationData: [
            { name: 'Used', value: activeSeats },
            { name: 'Available', value: Math.max(totalSeats - activeSeats, 0) },
        ],
        alerts,
        upcomingRenewals,
    });
}));

// GET /api/dashboard/forecast — Cost forecasting data
router.get('/forecast', requireAuth, async (req: AuthRequest, res) => {
    try {
        const orgId = req.orgId;

        const { data: licenses } = await supabase
            .from('licenses')
            .select('*')
            .eq('org_id', orgId);

        const { data: recommendations } = await supabase
            .from('optimization_recommendations')
            .select('estimated_savings')
            .eq('org_id', orgId)
            .eq('status', 'pending');

        const licenseList = licenses || [];
        const today = new Date();

        // Current monthly spend
        const currentSpend = licenseList.reduce((sum, l) =>
            sum + (Number(l.cost_per_seat) * (l.seats_purchased || 0)), 0);

        // Potential savings
        const potentialSavings = (recommendations || [])
            .reduce((sum, r) => sum + Number(r.estimated_savings || 0), 0);

        // Generate 6 months of data (3 past + current + 3 future)
        const months = [];
        for (let i = -3; i <= 3; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            const isPast = i < 0;
            const isForecast = i > 0;

            // Simulate slight growth for past months and projected growth
            const growthFactor = isPast ? (1 - (Math.abs(i) * 0.03)) : (1 + (i * 0.02));
            const spend = currentSpend * growthFactor;

            // Per platform breakdown
            const platforms = licenseList.map(l => ({
                platform: l.platform,
                cost: Number(l.cost_per_seat) * (l.seats_purchased || 0) * growthFactor
            }));

            // Seat growth
            const totalSeats = licenseList.reduce((sum, l) =>
                sum + (l.seats_purchased || 0), 0);
            const projectedSeats = Math.round(totalSeats * growthFactor);

            // Savings if recommendations applied
            const savingsApplied = isForecast ? potentialSavings : 0;

            months.push({
                month: monthLabel,
                date: date.toISOString(),
                totalSpend: Math.round(spend * 100) / 100,
                optimizedSpend: Math.round((spend - savingsApplied) * 100) / 100,
                platforms,
                totalSeats: projectedSeats,
                isForecast,
                isPast,
                savingsOpportunity: isForecast ? potentialSavings : 0
            });
        }

        // Top platforms by spend
        const platformTotals = licenseList.reduce((acc: any, l) => {
            const cost = Number(l.cost_per_seat) * (l.seats_purchased || 0);
            acc[l.platform] = (acc[l.platform] || 0) + cost;
            return acc;
        }, {});

        res.json({
            months,
            currentSpend,
            projectedSpend: currentSpend * 1.06, // 6% growth over 3 months
            potentialSavings,
            platformTotals,
            totalSeats: licenseList.reduce((sum, l) => sum + (l.seats_purchased || 0), 0),
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

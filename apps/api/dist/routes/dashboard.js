"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../utils/supabase");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// GET /api/dashboard/stats — Aggregated dashboard metrics
router.get('/stats', auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const orgId = req.orgId;
    if (!orgId)
        return res.status(400).json({ error: 'Organization not found' });
    // Run all queries in parallel
    const [licensesResult, savingsResult, alertsResult] = await Promise.all([
        supabase_1.supabase
            .from('licenses')
            .select('*')
            .eq('org_id', orgId),
        supabase_1.supabase
            .from('optimization_recommendations')
            .select('estimated_savings')
            .eq('org_id', orgId)
            .eq('status', 'pending'),
        supabase_1.supabase
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
    const spendByPlatform = {};
    const upcomingRenewals = [];
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
        if (a.severity === 'critical')
            criticalAlerts++;
        if (a.severity === 'warning')
            warningAlerts++;
    }
    const platformSpend = Object.entries(spendByPlatform)
        .map(([name, spend]) => ({ name, spend }))
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5);
    upcomingRenewals.sort((a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime());
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
exports.default = router;

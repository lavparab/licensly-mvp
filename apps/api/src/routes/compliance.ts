import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { alertFilterSchema } from '../types/schemas';
import { checkOrganizationCompliance } from '../services/compliance';

const router = Router();

// GET /api/compliance/alerts — List alerts with filters
router.get('/alerts', requireAuth, validate(alertFilterSchema, 'query'), asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    const { severity, is_resolved, page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    let query = supabase
        .from('compliance_alerts')
        .select('*, licenses(platform, plan_name)', { count: 'exact' })
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (severity) query = query.eq('severity', severity);
    if (is_resolved !== undefined) query = query.eq('is_resolved', is_resolved);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
        alerts: data || [],
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
        },
    });
}));

// PATCH /api/compliance/alerts/:id/resolve — Mark alert as resolved
router.patch('/alerts/:id/resolve', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    const { id } = req.params;

    const { data: alert, error } = await supabase
        .from('compliance_alerts')
        .update({ is_resolved: true })
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error || !alert) {
        return res.status(404).json({ error: 'Alert not found' });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: req.user?.id,
        action: 'alert_resolved',
        entity_type: 'compliance_alert',
        entity_id: id,
    });

    res.json({ alert });
}));

// GET /api/compliance/stats — Aggregated compliance stats
router.get('/stats', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    const { data: alerts, error } = await supabase
        .from('compliance_alerts')
        .select('severity, is_resolved')
        .eq('org_id', orgId);

    if (error) throw error;

    const allAlerts = alerts || [];
    const unresolved = allAlerts.filter(a => !a.is_resolved);

    const stats = {
        total: allAlerts.length,
        resolved: allAlerts.filter(a => a.is_resolved).length,
        unresolved: unresolved.length,
        critical: unresolved.filter(a => a.severity === 'critical').length,
        warning: unresolved.filter(a => a.severity === 'warning').length,
        info: unresolved.filter(a => a.severity === 'info').length,
    };

    res.json({ stats });
}));

// POST /api/compliance/scan — Run compliance check for org
router.post('/scan', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    await checkOrganizationCompliance(orgId);

    // Re-fetch stats after scan
    const { data: alerts, error } = await supabase
        .from('compliance_alerts')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_resolved', false);

    if (error) throw error;

    res.json({ success: true, newAlertsCount: alerts.length, alerts });
}));

export default router;

import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { createLicenseSchema, updateLicenseSchema, licenseFilterSchema } from '../types/schemas';

const router = Router();

// GET /api/licenses — List licenses for the org (with filters)
router.get('/', requireAuth, validate(licenseFilterSchema, 'query'), asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    const { platform, billing_cycle, page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    let query = supabase
        .from('licenses')
        .select('*', { count: 'exact' })
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (platform) query = query.eq('platform', platform);
    if (billing_cycle) query = query.eq('billing_cycle', billing_cycle);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
        licenses: data || [],
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
        },
    });
}));

// GET /api/licenses/:id — Get single license with assignments
router.get('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    const { id } = req.params;

    const { data: license, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

    if (error || !license) {
        return res.status(404).json({ error: 'License not found' });
    }

    // Fetch assignments for this license
    const { data: assignments } = await supabase
        .from('license_assignments')
        .select('*')
        .eq('license_id', id)
        .order('last_active_at', { ascending: false });

    res.json({ license, assignments: assignments || [] });
}));

// POST /api/licenses — Create a manual license
router.post('/', requireAuth, validate(createLicenseSchema), asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    const { data: license, error } = await supabase
        .from('licenses')
        .insert({
            org_id: orgId,
            ...req.body,
        })
        .select()
        .single();

    if (error) throw error;

    // Audit log
    await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: req.user?.id,
        action: 'license_created',
        entity_type: 'license',
        entity_id: license.id,
        metadata: { platform: req.body.platform, plan_name: req.body.plan_name },
    });

    res.status(201).json({ license });
}));

// PATCH /api/licenses/:id — Update license details
router.patch('/:id', requireAuth, validate(updateLicenseSchema), asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    const { id } = req.params;

    // Verify ownership
    const { data: existing } = await supabase
        .from('licenses')
        .select('id')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

    if (!existing) {
        return res.status(404).json({ error: 'License not found' });
    }

    const { data: license, error } = await supabase
        .from('licenses')
        .update(req.body)
        .eq('id', id)
        .eq('org_id', orgId)
        .select()
        .single();

    if (error) throw error;

    // Audit log
    await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: req.user?.id,
        action: 'license_updated',
        entity_type: 'license',
        entity_id: id,
        metadata: req.body,
    });

    res.json({ license });
}));

// DELETE /api/licenses/:id — Delete a license
router.delete('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    const { id } = req.params;

    const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', id)
        .eq('org_id', orgId);

    if (error) throw error;

    // Audit log
    await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: req.user?.id,
        action: 'license_deleted',
        entity_type: 'license',
        entity_id: id,
    });

    res.json({ message: 'License deleted successfully' });
}));

export default router;

import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { updateOrgSchema, updateProfileSchema } from '../types/schemas';

const router = Router();

// GET /api/settings/org — Get org settings
router.get('/org', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

    if (error || !org) {
        return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ org });
}));

// PATCH /api/settings/org — Update org settings
router.patch('/org', requireAuth, validate(updateOrgSchema), asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    // Only admins can update org settings
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Only admins can update organization settings' });
    }

    const { data: org, error } = await supabase
        .from('organizations')
        .update(req.body)
        .eq('id', orgId)
        .select()
        .single();

    if (error) throw error;

    // Audit log
    await supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: req.user?.id,
        action: 'org_settings_updated',
        entity_type: 'organization',
        entity_id: orgId,
        metadata: req.body,
    });

    res.json({ org });
}));

// GET /api/settings/profile — Get current user profile
router.get('/profile', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile, error } = await supabase
        .from('users')
        .select('id, email, role, avatar_url, org_id, onboarding_completed, created_at')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });
}));

// PATCH /api/settings/profile — Update user profile
router.patch('/profile', requireAuth, validate(updateProfileSchema), asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile, error } = await supabase
        .from('users')
        .update(req.body)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;

    res.json({ profile });
}));

// GET /api/settings/members — List org team members
router.get('/members', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    const { data: members, error } = await supabase
        .from('users')
        .select('id, email, role, avatar_url, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ members: members || [] });
}));

export default router;

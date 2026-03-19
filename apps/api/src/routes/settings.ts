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

// GET /api/settings/organization
router.get('/organization', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    const { data: organization, error } = await supabase
        .from('organizations')
        .select('id, name, domain, plan, company_size, industry, created_at')
        .eq('id', orgId)
        .single();

    if (error || !organization) {
        return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);
}));

// PATCH /api/settings/organization
router.patch('/organization', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    const { name, domain, company_size, industry } = req.body;

    const { data: updatedOrg, error } = await supabase
        .from('organizations')
        .update({ name, domain, company_size, industry })
        .eq('id', orgId)
        .select()
        .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert({
        org_id: orgId,
        action: 'settings_updated',
        entity_type: 'organization',
        entity_id: orgId,
        metadata: { changes: req.body }
    });

    res.json({ organization: updatedOrg });
}));

// GET /api/settings/profile
router.get('/profile', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: profile, error } = await supabase
        .from('users')
        .select('id, email, role, onboarding_completed')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        return res.status(404).json({ error: 'Profile not found' });
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    if (authError) throw authError;

    res.json({
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: authUser?.user?.user_metadata?.full_name,
        avatar_url: authUser?.user?.user_metadata?.avatar_url,
        onboarding_completed: profile.onboarding_completed
    });
}));

// PATCH /api/settings/profile
router.patch('/profile', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { role, full_name } = req.body;

    if (role) {
        const { error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', userId);
        if (error) throw error;
    }

    if (full_name !== undefined) {
        const { error } = await supabase.auth.admin.updateUserById(userId, { user_metadata: { full_name } });
        if (error) throw error;
    }

    const { data: updatedProfile } = await supabase.from('users').select('*').eq('id', userId).single();
    
    res.json({ profile: { ...updatedProfile, full_name } });
}));

// PATCH /api/settings/password
router.patch('/password', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const { password } = req.body;
    if (!password || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { error } = await supabase.auth.admin.updateUserById(userId, { password });
    if (error) throw error;

    res.json({ message: 'Password updated successfully' });
}));

// GET /api/settings/members
router.get('/members', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const orgId = req.orgId;
    if (!orgId) return res.status(400).json({ error: 'Organization not found' });

    const { data: members, error } = await supabase
        .from('users')
        .select('id, email, role, onboarding_completed')
        .eq('org_id', orgId);

    if (error) throw error;

    res.json({ members: members || [] });
}));

// PATCH /api/settings/members/:userId/role
router.patch('/members/:userId/role', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const { userId } = req.params;
    const orgId = req.orgId;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    const { data: requester } = await supabase.from('users').select('role').eq('id', req.user?.id).single();
    if (requester?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)
        .eq('org_id', orgId);

    if (error) throw error;

    res.json({ message: 'Role updated' });
}));

// DELETE /api/settings/members/:userId
router.delete('/members/:userId', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const { userId } = req.params;
    const orgId = req.orgId;

    if (userId === req.user?.id) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const { data: requester } = await supabase.from('users').select('role').eq('id', req.user?.id).single();
    if (requester?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .eq('org_id', orgId);

    if (error) throw error;

    res.json({ message: 'Member removed' });
}));

export default router;

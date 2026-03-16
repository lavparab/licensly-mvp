"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../utils/supabase");
const validate_1 = require("../middleware/validate");
const errorHandler_1 = require("../middleware/errorHandler");
const schemas_1 = require("../types/schemas");
const router = (0, express_1.Router)();
// GET /api/settings/org — Get org settings
router.get('/org', auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const orgId = req.orgId;
    if (!orgId)
        return res.status(400).json({ error: 'Organization not found' });
    const { data: org, error } = await supabase_1.supabase
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
router.patch('/org', auth_1.requireAuth, (0, validate_1.validate)(schemas_1.updateOrgSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const orgId = req.orgId;
    if (!orgId)
        return res.status(400).json({ error: 'Organization not found' });
    // Only admins can update org settings
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Only admins can update organization settings' });
    }
    const { data: org, error } = await supabase_1.supabase
        .from('organizations')
        .update(req.body)
        .eq('id', orgId)
        .select()
        .single();
    if (error)
        throw error;
    // Audit log
    await supabase_1.supabase.from('audit_logs').insert({
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
router.get('/profile', auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const { data: profile, error } = await supabase_1.supabase
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
router.patch('/profile', auth_1.requireAuth, (0, validate_1.validate)(schemas_1.updateProfileSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const { data: profile, error } = await supabase_1.supabase
        .from('users')
        .update(req.body)
        .eq('id', userId)
        .select()
        .single();
    if (error)
        throw error;
    res.json({ profile });
}));
// GET /api/settings/members — List org team members
router.get('/members', auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const orgId = req.orgId;
    if (!orgId)
        return res.status(400).json({ error: 'Organization not found' });
    const { data: members, error } = await supabase_1.supabase
        .from('users')
        .select('id, email, role, avatar_url, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: true });
    if (error)
        throw error;
    res.json({ members: members || [] });
}));
exports.default = router;

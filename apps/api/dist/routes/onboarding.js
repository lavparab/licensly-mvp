"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../utils/supabase");
const validate_1 = require("../middleware/validate");
const errorHandler_1 = require("../middleware/errorHandler");
const schemas_1 = require("../types/schemas");
const router = (0, express_1.Router)();
// POST /api/onboarding/complete — Complete the onboarding flow
router.post('/complete', auth_1.requireAuth, (0, validate_1.validate)(schemas_1.onboardingCompleteSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const orgId = req.orgId;
    if (!userId || !orgId) {
        return res.status(400).json({ error: 'User or organization not found' });
    }
    const { company_size, industry, org_name } = req.body;
    // Update org with onboarding data
    const orgUpdate = { company_size, industry };
    if (org_name)
        orgUpdate.name = org_name;
    const { error: orgError } = await supabase_1.supabase
        .from('organizations')
        .update(orgUpdate)
        .eq('id', orgId);
    if (orgError)
        throw orgError;
    // Mark onboarding as completed for the user
    const { error: userError } = await supabase_1.supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', userId);
    if (userError)
        throw userError;
    // Audit log
    await supabase_1.supabase.from('audit_logs').insert({
        org_id: orgId,
        user_id: userId,
        action: 'onboarding_completed',
        entity_type: 'user',
        entity_id: userId,
        metadata: { company_size, industry },
    });
    res.json({ success: true, message: 'Onboarding completed successfully' });
}));
// GET /api/onboarding/status — Check onboarding status
router.get('/status', auth_1.requireAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const { data: user, error } = await supabase_1.supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();
    if (error)
        throw error;
    res.json({
        onboarding_completed: user?.onboarding_completed || false,
    });
}));
exports.default = router;

import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { onboardingCompleteSchema } from '../types/schemas';

const router = Router();

// POST /api/onboarding/complete — Complete the onboarding flow
router.post('/complete', requireAuth, validate(onboardingCompleteSchema), asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    const orgId = req.orgId;

    if (!userId || !orgId) {
        return res.status(400).json({ error: 'User or organization not found' });
    }

    const { company_size, industry, org_name } = req.body;

    // Update org with onboarding data
    const orgUpdate: Record<string, any> = { company_size, industry };
    if (org_name) orgUpdate.name = org_name;

    const { error: orgError } = await supabase
        .from('organizations')
        .update(orgUpdate)
        .eq('id', orgId);

    if (orgError) throw orgError;

    // Mark onboarding as completed for the user
    const { error: userError } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', userId);

    if (userError) throw userError;

    // Insert licenses from onboarding
    const { licenses } = req.body;
    if (licenses && licenses.length > 0) {
        const rows = licenses.map((lic: any) => ({
            org_id: orgId,
            platform: lic.platform,
            plan_name: 'Standard',
            seats_purchased: lic.seats,
            seats_used: 0,
            cost_per_seat: lic.costPerSeat,
            billing_cycle: 'monthly',
            renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString().split('T')[0],
        }));

        console.log('Inserting licenses:', JSON.stringify(rows)); // ✅ after rows is defined
        const { error: licError, data: licData } = await supabase
            .from('licenses')
            .insert(rows);
        console.log('License insert result:', licError, licData);
        if (licError) throw licError;
    }

    // Audit log
    await supabase.from('audit_logs').insert({
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
router.get('/status', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: user, error } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

    if (error) throw error;

    res.json({
        onboarding_completed: user?.onboarding_completed || false,
    });
}));

export default router;

import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { integrationManager } from '../services/integrations';
import { supabase } from '../utils/supabase';
import { syncIntegrationData } from '../services/syncEngine';

const router = Router();

// 1. List all available platforms
router.get('/platforms', requireAuth, (req: AuthRequest, res) => {
    const platforms = integrationManager.listAvailablePlatforms();
    res.json({ platforms });
});

// 2. Check current integrations for the org
router.get('/', requireAuth, async (req: AuthRequest, res) => {
    const orgId = req.orgId;

    try {
        const { data: integrations, error } = await supabase
            .from('integrations')
            .select('id, platform, status, last_synced_at')
            .eq('org_id', orgId);

        if (error) throw error;
        res.json({ integrations });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Start OAuth Flow
router.get('/:platform/auth', requireAuth, async (req: AuthRequest, res) => {
    try {
        const platform = req.params.platform;
        const adapter = integrationManager.getAdapter(platform);

        // FIXED: use API_URL env var instead of req.protocol
        const redirectUri = `${process.env.API_URL}/api/integrations/${platform}/callback`;

        const state = Buffer.from(JSON.stringify({ orgId: req.orgId })).toString('base64');
        const authUrl = adapter.getAuthUrl(state, redirectUri);

        console.log('=== AUTH URL ===', authUrl); // keep this for now
        res.json({ url: authUrl });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// 4. Handle OAuth Callback
router.get('/:platform/callback', async (req, res) => {
    try {
        const platform = req.params.platform;
        const { code, state, error } = req.query;

        if (error) return res.status(400).json({ error });

        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString('ascii'));
        const orgId = stateData.orgId;

        const adapter = integrationManager.getAdapter(platform);
        const redirectUri = `${process.env.API_URL}/api/integrations/${platform}/callback`;
        // Authenticate and fetch token
        const authResult = await adapter.authenticate({ code: code as string }, redirectUri);

        // Upsert into Supabase `integrations` table
        const { data, error: dbError } = await supabase
            .from('integrations')
            .upsert({
                org_id: orgId,
                platform: platform,
                credentials_encrypted: JSON.stringify(authResult),
                status: 'connected',
            }, { onConflict: 'org_id, platform' })
            .select().single();

        if (dbError) throw dbError;

        // Trigger initial sync here
        // We do not strictly await the entire sync before returning to provide a snappier front-end experience.
        // But for MVP, awaiting it ensures the user sees the data immediately.
        await syncIntegrationData(data.id);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/integrations?success=true&platform=${encodeURIComponent(platform)}`);
    } catch (err: any) {
        console.error('OAuth Callback Error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/integrations?error=${encodeURIComponent(err.message)}`);
    }
});

// 5. Trigger Manual Sync
router.post('/:id/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
        const integrationId = req.params.id;

        // Fetch integration details
        const { data: integration, error } = await supabase
            .from('integrations')
            .select('*')
            .eq('id', integrationId)
            .eq('org_id', req.orgId)
            .single();

        if (error || !integration) throw new Error('Integration not found');

        const success = await syncIntegrationData(integrationId);

        if (!success) throw new Error('Sync failed');

        res.json({ message: 'Sync completed successfully', status: 'connected' });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// 6. Disconnect integration
router.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { error } = await supabase
            .from('integrations')
            .delete()
            .match({ id: req.params.id, org_id: req.orgId });

        if (error) throw error;
        res.json({ message: "Successfully disconnected." });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

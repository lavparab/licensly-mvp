import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { integrationManager } from '../services/integrations';
import { supabase } from '../utils/supabase';
import { syncIntegrationData } from '../services/syncEngine';

const router = Router();

async function getZoomToken(orgId: string) {
    const { data: integration, error } = await supabase
        .from('integrations')
        .select('credentials_encrypted')
        .eq('org_id', orgId)
        .eq('platform', 'zoom')
        .single();
    if (error || !integration) throw new Error('Zoom integration not found');
    const credentials = JSON.parse(integration.credentials_encrypted as string);
    return credentials.accessToken;
}

router.get('/connect', requireAuth, (req: AuthRequest, res) => {
    try {
        const adapter = integrationManager.getAdapter('zoom');
        const redirectUri = `${process.env.API_URL}/api/integrations/zoom/callback`;
        const state = Buffer.from(JSON.stringify({ orgId: req.orgId })).toString('base64');
        const authUrl = adapter.getAuthUrl(state, redirectUri);
        res.json({ url: authUrl });
    } catch (error: any) {
        console.error('Zoom connect error:', error);
        res.status(500).json({ error: 'Failed to initiate Zoom connection' });
    }
});

router.get('/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error || !code || !state) {
        return res.redirect(`${process.env.FRONTEND_URL}/integrations?error=auth_failed`);
    }

    try {
        const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString('utf8'));
        const orgId = decodedState.orgId;

        const adapter = integrationManager.getAdapter('zoom');
        const redirectUri = `${process.env.API_URL}/api/integrations/zoom/callback`;
        const authResult = await adapter.authenticate({ code: code as string }, redirectUri);

        // Standardise data to save
        const { data: upsertData } = await supabase
            .from('integrations')
            .upsert({
                org_id: orgId,
                platform: 'zoom',
                status: 'connected',
                credentials_encrypted: JSON.stringify(authResult),
                last_synced_at: new Date().toISOString()
            }, { onConflict: 'org_id, platform' })
            .select('id')
            .single();

        try {
            if (upsertData?.id) {
                await syncIntegrationData(upsertData.id);
            }
        } catch (syncError) {
            console.error('Initial sync failed for Zoom:', syncError);
        }

        res.redirect(`${process.env.FRONTEND_URL}/integrations?success=true&platform=zoom`);
    } catch (err) {
        console.error('Zoom callback error:', err);
        res.redirect(`${process.env.FRONTEND_URL}/integrations?error=connection_failed`);
    }
});

router.get('/members', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getZoomToken(req.orgId!);
        const adapter = integrationManager.getAdapter('zoom') as any;
        const members = await adapter.fetchZoomMembers(token);
        res.json({ members });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/inactive', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getZoomToken(req.orgId!);
        const adapter = integrationManager.getAdapter('zoom') as any;
        const inactiveMembers = await adapter.fetchInactiveMembers(token);
        res.json({ inactiveMembers });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/account', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getZoomToken(req.orgId!);
        const adapter = integrationManager.getAdapter('zoom') as any;
        const account = await adapter.fetchAccountInfo(token);
        res.json({ account });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/disconnect', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { error } = await supabase
            .from('integrations')
            .delete()
            .match({ org_id: req.orgId, platform: 'zoom' });

        if (error) throw error;
        
        await supabase
            .from('licenses')
            .delete()
            .match({ org_id: req.orgId, platform: 'zoom' });

        res.json({ message: 'Successfully disconnected Zoom.' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to disconnect Zoom' });
    }
});

export default router;

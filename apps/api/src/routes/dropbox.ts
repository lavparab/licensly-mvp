import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { integrationManager } from '../services/integrations';
import { supabase } from '../utils/supabase';
import { syncIntegrationData } from '../services/syncEngine';

const router = Router();

// Helper to get Dropbox access token for the org
async function getDropboxToken(orgId: string) {
    const { data: integration, error } = await supabase
        .from('integrations')
        .select('credentials_encrypted')
        .eq('org_id', orgId)
        .eq('platform', 'dropbox')
        .single();

    if (error || !integration) throw new Error('Dropbox integration not found');
    const credentials = JSON.parse(integration.credentials_encrypted as string);
    return credentials.accessToken;
}

// GET /api/integrations/dropbox/connect
router.get('/connect', requireAuth, async (req: AuthRequest, res) => {
    try {
        const adapter = integrationManager.getAdapter('dropbox');
        const redirectUri = `${process.env.API_URL}/api/integrations/dropbox/callback`;
        const state = Buffer.from(JSON.stringify({ orgId: req.orgId })).toString('base64');
        const authUrl = adapter.getAuthUrl(state, redirectUri);

        res.json({ url: authUrl });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/integrations/dropbox/callback
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error) return res.status(400).json({ error });

        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString('ascii'));
        const orgId = stateData.orgId;

        const adapter = integrationManager.getAdapter('dropbox');
        const redirectUri = `${process.env.API_URL}/api/integrations/dropbox/callback`;

        const authResult = await adapter.authenticate({ code: code as string }, redirectUri);

        const { data, error: dbError } = await supabase
            .from('integrations')
            .upsert({
                org_id: orgId,
                platform: 'dropbox',
                credentials_encrypted: JSON.stringify(authResult),
                status: 'connected',
            }, { onConflict: 'org_id, platform' })
            .select().single();

        if (dbError) throw dbError;

        try {
            await syncIntegrationData(data.id);
        } catch (syncErr) {
            console.error('Dropbox data sync failed during callback:', syncErr);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/integrations?success=true&platform=dropbox`);
    } catch (err: any) {
        console.error('Dropbox OAuth Callback Error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/integrations?error=${encodeURIComponent(err.message)}`);
    }
});

// GET /api/integrations/dropbox/members
router.get('/members', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getDropboxToken(req.orgId!);
        const adapter = integrationManager.getAdapter('dropbox') as any;
        const members = await adapter.fetchTeamMembers(token);
        res.json({ members });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/integrations/dropbox/inactive
router.get('/inactive', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getDropboxToken(req.orgId!);
        const adapter = integrationManager.getAdapter('dropbox') as any;

        const data = await adapter.fetchTeamMembers(token);
        const inactiveMembers = data
            .filter((member: any) => member.status !== 'active');

        res.json({ inactiveMembers });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/integrations/dropbox/storage
router.get('/storage', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getDropboxToken(req.orgId!);
        const adapter = integrationManager.getAdapter('dropbox') as any;
        const storage = await adapter.fetchStorageUsage(token);
        res.json({ storage });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/integrations/dropbox/disconnect
router.post('/disconnect', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { error } = await supabase
            .from('integrations')
            .delete()
            .match({ org_id: req.orgId, platform: 'dropbox' });

        if (error) throw error;
        res.json({ message: "Successfully disconnected Dropbox." });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { integrationManager } from '../services/integrations';
import { supabase } from '../utils/supabase';
import { syncIntegrationData } from '../services/syncEngine';

const router = Router();

// Helper to get Google Workspace access token for the org
async function getGoogleToken(orgId: string) {
    const { data: integration, error } = await supabase
        .from('integrations')
        .select('credentials_encrypted')
        .eq('org_id', orgId)
        .eq('platform', 'google-workspace')
        .single();

    if (error || !integration) throw new Error('Google Workspace integration not found');
    const credentials = JSON.parse(integration.credentials_encrypted as string);
    return credentials.accessToken;
}

// GET /api/integrations/google-workspace/connect
router.get('/connect', requireAuth, async (req: AuthRequest, res) => {
    try {
        const adapter = integrationManager.getAdapter('google-workspace');
        const redirectUri = `${process.env.API_URL}/api/integrations/google-workspace/callback`;
        const state = Buffer.from(JSON.stringify({ orgId: req.orgId })).toString('base64');
        const authUrl = adapter.getAuthUrl(state, redirectUri);
        
        res.json({ url: authUrl });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/integrations/google-workspace/callback
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error) return res.status(400).json({ error });

        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString('ascii'));
        const orgId = stateData.orgId;

        const adapter = integrationManager.getAdapter('google-workspace');
        const redirectUri = `${process.env.API_URL}/api/integrations/google-workspace/callback`;

        const authResult = await adapter.authenticate({ code: code as string }, redirectUri);

        const { data, error: dbError } = await supabase
            .from('integrations')
            .upsert({
                org_id: orgId,
                platform: 'google-workspace',
                credentials_encrypted: JSON.stringify(authResult),
                status: 'connected',
            }, { onConflict: 'org_id, platform' })
            .select().single();

        if (dbError) throw dbError;

        try {
            await syncIntegrationData(data.id);
        } catch (syncErr) {
            console.error('Google Workspace data sync failed during callback:', syncErr);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/integrations?success=true&platform=google-workspace`);
    } catch (err: any) {
        console.error('Google Workspace OAuth Callback Error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/integrations?error=${encodeURIComponent(err.message)}`);
    }
});

// GET /api/integrations/google-workspace/users
router.get('/users', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getGoogleToken(req.orgId!);
        const adapter = integrationManager.getAdapter('google-workspace') as any;
        const users = await adapter.fetchDirectoryUsers(token);
        res.json({ users });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/integrations/google-workspace/suspended
router.get('/suspended', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getGoogleToken(req.orgId!);
        const adapter = integrationManager.getAdapter('google-workspace') as any;
        
        // Use adapter logic to fetch all users mapping to UI shape so suspended can be displayed
        const data = await adapter.getUsersList(token);
        const suspendedUsers = data
            .filter((user: any) => user.suspended)
            .map((user: any) => ({
                id: user.id,
                name: user.name?.fullName,
                email: user.primaryEmail,
                isAdmin: !!user.isAdmin,
                isSuspended: !!user.suspended,
                status: 'suspended', 
                lastLoginTime: user.lastLoginTime,
                avatarUrl: user.thumbnailPhotoUrl,
                orgUnit: user.orgUnitPath
            }));
        
        res.json({ suspendedUsers });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/integrations/google-workspace/domain
router.get('/domain', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getGoogleToken(req.orgId!);
        const adapter = integrationManager.getAdapter('google-workspace') as any;
        const domain = await adapter.fetchDomainInfo(token);
        res.json({ domain });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/integrations/google-workspace/disconnect
router.post('/disconnect', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { error } = await supabase
            .from('integrations')
            .delete()
            .match({ org_id: req.orgId, platform: 'google-workspace' });

        if (error) throw error;
        res.json({ message: "Successfully disconnected Google Workspace." });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

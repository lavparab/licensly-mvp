import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { integrationManager } from '../services/integrations';
import { supabase } from '../utils/supabase';
import { syncIntegrationData } from '../services/syncEngine';

const router = Router();

// GET /api/integrations/github/connect
router.get('/connect', requireAuth, async (req: AuthRequest, res) => {
    try {
        const adapter = integrationManager.getAdapter('github');
        const redirectUri = `${process.env.API_URL}/api/integrations/github/callback`;
        const state = Buffer.from(JSON.stringify({ orgId: req.orgId })).toString('base64');
        const authUrl = adapter.getAuthUrl(state, redirectUri);
        res.json({ url: authUrl });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/integrations/github/callback
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error) return res.status(400).json({ error });

        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString('ascii'));
        const orgId = stateData.orgId;

        const adapter = integrationManager.getAdapter('github');
        const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/github/callback`;

        const authResult = await adapter.authenticate({ code: code as string }, redirectUri);

        const { data, error: dbError } = await supabase
            .from('integrations')
            .upsert({
                org_id: orgId,
                platform: 'github',
                credentials_encrypted: JSON.stringify(authResult),
                status: 'connected',
            }, { onConflict: 'org_id, platform' })
            .select().single();

        if (dbError) throw dbError;

        await syncIntegrationData(data.id);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/integrations?success=true&platform=github`);
    } catch (err: any) {
        console.error('GitHub OAuth Callback Error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/integrations?error=${encodeURIComponent(err.message)}`);
    }
});

// Helper to get Github access token for the org
async function getGithubToken(orgId: string) {
    const { data: integration, error } = await supabase
        .from('integrations')
        .select('credentials_encrypted')
        .eq('org_id', orgId)
        .eq('platform', 'github')
        .single();

    if (error || !integration) throw new Error('GitHub integration not found');
    const credentials = JSON.parse(integration.credentials_encrypted as string);
    return credentials.accessToken;
}

// GET /api/integrations/github/members
router.get('/members', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getGithubToken(req.orgId!);
        const adapter = integrationManager.getAdapter('github') as any;
        const members = await adapter.fetchOrgMembersWithActivity(token);
        res.json({ members });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/integrations/github/idle
router.get('/idle', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getGithubToken(req.orgId!);
        const adapter = integrationManager.getAdapter('github') as any;
        const members = await adapter.fetchOrgMembersWithActivity(token);

        // Filter by activity score < 50 or no commits in 30 days
        const idleMembers = members.filter((m: any) => m.activityScore < 50);

        res.json({ idleMembers });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/integrations/github/copilot
router.get('/copilot', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getGithubToken(req.orgId!);
        const adapter = integrationManager.getAdapter('github') as any;
        const copilotData = await adapter.fetchCopilotSeats(token);
        res.json({ copilotData });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/integrations/github/disconnect
router.post('/disconnect', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { error } = await supabase
            .from('integrations')
            .delete()
            .match({ org_id: req.orgId, platform: 'github' });

        if (error) throw error;
        res.json({ message: "Successfully disconnected GitHub." });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

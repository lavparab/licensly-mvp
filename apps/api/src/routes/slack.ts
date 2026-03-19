import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { integrationManager } from '../services/integrations';
import { supabase } from '../utils/supabase';
import { syncIntegrationData } from '../services/syncEngine';

const router = Router();

// Helper to get Slack access token for the org
async function getSlackToken(orgId: string) {
    const { data: integration, error } = await supabase
        .from('integrations')
        .select('credentials_encrypted')
        .eq('org_id', orgId)
        .eq('platform', 'slack')
        .single();

    if (error || !integration) throw new Error('Slack integration not found');
    const credentials = JSON.parse(integration.credentials_encrypted as string);
    return credentials.accessToken;
}

// GET /api/integrations/slack/connect
router.get('/connect', requireAuth, async (req: AuthRequest, res) => {
    try {
        const adapter = integrationManager.getAdapter('slack');
        const redirectUri = `${process.env.API_URL}/api/integrations/slack/callback`;
        const state = Buffer.from(JSON.stringify({ orgId: req.orgId })).toString('base64');
        const authUrl = adapter.getAuthUrl(state, redirectUri);

        res.json({ url: authUrl });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/integrations/slack/callback
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;
        if (error) return res.status(400).json({ error });

        const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString('ascii'));
        const orgId = stateData.orgId;

        const adapter = integrationManager.getAdapter('slack');
        const redirectUri = `${process.env.API_URL}/api/integrations/slack/callback`;

        const authResult = await adapter.authenticate({ code: code as string }, redirectUri);

        const { data, error: dbError } = await supabase
            .from('integrations')
            .upsert({
                org_id: orgId,
                platform: 'slack',
                credentials_encrypted: JSON.stringify(authResult),
                status: 'connected',
            }, { onConflict: 'org_id, platform' })
            .select().single();

        if (dbError) throw dbError;

        try {
            await syncIntegrationData(data.id);
        } catch (syncErr) {
            console.error('Slack data sync failed during callback:', syncErr);
            // We do not fail the connection if sync fails.
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/integrations?success=true&platform=slack`);
    } catch (err: any) {
        console.error('Slack OAuth Callback Error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/integrations?error=${encodeURIComponent(err.message)}`);
    }
});

// GET /api/integrations/slack/members
router.get('/members', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getSlackToken(req.orgId!);
        const adapter = integrationManager.getAdapter('slack') as any;
        const members = await adapter.fetchWorkspaceMembers(token);
        res.json({ members });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/integrations/slack/inactive
router.get('/inactive', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getSlackToken(req.orgId!);
        const adapter = integrationManager.getAdapter('slack') as any;

        // Fetch users using the generic method to get deleted statuses too, or workspace members if preferred.
        // wait, fetchUsers returns active/idle. Let's use fetchWorkspaceMembers for all and filter if it supports deleted.
        // Wait, fetchWorkspaceMembers filters out deleted. Let's use users.list directly or modify fetchWorkspaceMembers.
        // Actually, the prompt says "fetch members, filter where status === 'inactive'"
        // But fetchWorkspaceMembers currently filters deleted users!
        // Let's modify fetchWorkspaceMembers in SlackAdapter to NOT filter deleted users, since it's used here, OR we can fetch them directly.
        // Let's just use adapter.fetchUsers and filter.

        // To precisely match prompt: "fetch members, filter where status === 'inactive'"
        // Let's use adapter.fetchUsers which maps deleted to idle/inactive.
        const users = await adapter.fetchUsers(token);
        const inactiveMembers = users.filter((u: any) => u.status === 'idle' || u.status === 'inactive');

        res.json({ inactiveMembers });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/integrations/slack/workspace
router.get('/workspace', requireAuth, async (req: AuthRequest, res) => {
    try {
        const token = await getSlackToken(req.orgId!);
        const adapter = integrationManager.getAdapter('slack') as any;
        const team = await adapter.fetchWorkspaceInfo(token);
        res.json({ team });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/integrations/slack/disconnect
router.post('/disconnect', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { error } = await supabase
            .from('integrations')
            .delete()
            .match({ org_id: req.orgId, platform: 'slack' });

        if (error) throw error;
        res.json({ message: "Successfully disconnected Slack." });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

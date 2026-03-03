"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const integrations_1 = require("../services/integrations");
const supabase_1 = require("../utils/supabase");
const router = (0, express_1.Router)();
// 1. List all available platforms
router.get('/platforms', auth_1.requireAuth, (req, res) => {
    const platforms = integrations_1.integrationManager.listAvailablePlatforms();
    res.json({ platforms });
});
// 2. Check current integrations for the org
router.get('/', auth_1.requireAuth, async (req, res) => {
    const orgId = req.orgId;
    try {
        const { data: integrations, error } = await supabase_1.supabase
            .from('integrations')
            .select('id, platform, status, last_synced_at')
            .eq('org_id', orgId);
        if (error)
            throw error;
        res.json({ integrations });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 3. Start OAuth Flow
router.get('/:platform/auth', auth_1.requireAuth, async (req, res) => {
    try {
        const platform = req.params.platform;
        const adapter = integrations_1.integrationManager.getAdapter(platform);
        // Create a local dev callback URL
        const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/${platform}/callback`;
        // We pass the orgId in the state to correlate the callback later
        const state = Buffer.from(JSON.stringify({ orgId: req.orgId })).toString('base64');
        const authUrl = adapter.getAuthUrl(state, redirectUri);
        res.json({ url: authUrl });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// 4. Handle OAuth Callback
router.get('/:platform/callback', async (req, res) => {
    try {
        const platform = req.params.platform;
        const { code, state, error } = req.query;
        if (error)
            return res.status(400).json({ error });
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));
        const orgId = stateData.orgId;
        const adapter = integrations_1.integrationManager.getAdapter(platform);
        const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/${platform}/callback`;
        // Authenticate and fetch token
        const authResult = await adapter.authenticate({ code: code }, redirectUri);
        // Upsert into Supabase `integrations` table
        const { data, error: dbError } = await supabase_1.supabase
            .from('integrations')
            .upsert({
            org_id: orgId,
            platform: platform,
            credentials_encrypted: JSON.stringify(authResult),
            status: 'connected',
        }, { onConflict: 'org_id, platform' })
            .select().single();
        if (dbError)
            throw dbError;
        // Trigger initial sync here if necessary...
        res.redirect(`http://localhost:5173/integrations?success=true&platform=${platform}`);
    }
    catch (err) {
        console.error('OAuth Callback Error:', err);
        res.redirect(`http://localhost:5173/integrations?error=${encodeURIComponent(err.message)}`);
    }
});
// 5. Trigger Manual Sync
router.post('/:id/sync', auth_1.requireAuth, async (req, res) => {
    try {
        const integrationId = req.params.id;
        // Fetch integration details
        const { data: integration, error } = await supabase_1.supabase
            .from('integrations')
            .select('*')
            .eq('id', integrationId)
            .eq('org_id', req.orgId)
            .single();
        if (error || !integration)
            throw new Error('Integration not found');
        const adapter = integrations_1.integrationManager.getAdapter(integration.platform);
        // This is async, we can run it in the background or await it 
        // In MVP, we might want to just schedule it and return quickly
        // For now we'll do a mock sync...
        await adapter.testConnection(''); // Mock test
        res.json({ message: 'Sync triggered successfully', status: 'syncing' });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// 6. Disconnect integration
router.delete('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const { error } = await supabase_1.supabase
            .from('integrations')
            .delete()
            .match({ id: req.params.id, org_id: req.orgId });
        if (error)
            throw error;
        res.json({ message: "Successfully disconnected." });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;

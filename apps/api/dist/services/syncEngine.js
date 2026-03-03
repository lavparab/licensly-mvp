"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncIntegrationData = syncIntegrationData;
const supabase_1 = require("../utils/supabase");
const integrations_1 = require("./integrations");
/**
 * Executes a full sync pipeline for a specific integration ID
 */
async function syncIntegrationData(integrationId) {
    try {
        // 1. Fetch integration to get platform and credentials
        const { data: integration, error } = await supabase_1.supabase
            .from('integrations')
            .select('id, org_id, platform, credentials_encrypted')
            .eq('id', integrationId)
            .single();
        if (error || !integration) {
            throw new Error(`Integration ${integrationId} not found`);
        }
        const adapter = integrations_1.integrationManager.getAdapter(integration.platform);
        // In real app, decrypt credentials. For MVP demo, pass empty string or mock
        const token = typeof integration.credentials_encrypted === 'string'
            ? integration.credentials_encrypted
            : 'mock-token';
        // 2. Fetch fresh data from platform
        const licenses = await adapter.fetchLicenses(token);
        const users = await adapter.fetchUsers(token);
        // 3. Upsert Licenses into database
        for (const lic of licenses) {
            // Create or update the license
            const { data: dbLicense, error: licError } = await supabase_1.supabase
                .from('licenses')
                .upsert({
                org_id: integration.org_id,
                integration_id: integration.id,
                platform: lic.platform,
                plan_name: lic.planName,
                seats_purchased: lic.seatsPurchased,
                seats_used: lic.seatsUsed,
                cost_per_seat: lic.costPerSeat,
                billing_cycle: lic.billingCycle,
                renewal_date: lic.renewalDate
            }, { onConflict: 'org_id, platform, plan_name' }) // Assuming unique based on these
                .select('id')
                .single();
            if (licError || !dbLicense) {
                console.error('Error upserting license:', licError);
                continue;
            }
            // 4. Update or replace User Assignments for this license
            // For MVP, we'll blindly assign users to the first license plan fetched for simplicity,
            // since the mock data generator associates them loosely.
            for (const u of users) {
                await supabase_1.supabase
                    .from('license_assignments')
                    .upsert({
                    license_id: dbLicense.id,
                    user_email: u.email,
                    status: u.status,
                    last_active_at: u.lastActiveAt
                }, { onConflict: 'license_id, user_email' });
            }
        }
        // 5. Update last_synced timestamp
        await supabase_1.supabase
            .from('integrations')
            .update({ last_synced_at: new Date().toISOString(), status: 'connected' })
            .eq('id', integrationId);
        // 6. Create Audit Log
        await supabase_1.supabase.from('audit_logs').insert({
            org_id: integration.org_id,
            action: 'sync_completed',
            entity_type: 'integration',
            entity_id: integrationId,
            metadata: { platform: integration.platform, licensesCount: licenses.length, usersCount: users.length }
        });
        console.log(`✅ Successfully synced ${integration.platform} for org ${integration.org_id}`);
        return true;
    }
    catch (err) {
        console.error(`❌ Sync failed for integration ${integrationId}:`, err.message);
        // Update status to error
        await supabase_1.supabase
            .from('integrations')
            .update({ status: 'error' })
            .eq('id', integrationId);
        return false;
    }
}

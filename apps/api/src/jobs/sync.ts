import cron from 'node-cron';
import { supabase } from '../utils/supabase';
import { syncIntegrationData } from '../services/syncEngine';

/**
 * Initializes the automated sync cron jobs
 */
export function initCronJobs() {
    // Run every 6 hours: '0 */6 * * *'
    // For demo testing, run every minute: '* * * * *'
    cron.schedule('0 */6 * * *', async () => {
        console.log(`[CRON] Starting routine license synchronization...`);

        try {
            // Find all connected integrations that haven't errored
            const { data: integrations, error } = await supabase
                .from('integrations')
                .select('id')
                .eq('status', 'connected');

            if (error) throw error;

            if (integrations && integrations.length > 0) {
                console.log(`[CRON] Found ${integrations.length} active integrations to sync.`);

                // Execute syncs sequentially to avoid overwhelming rate limits
                for (const integration of integrations) {
                    await syncIntegrationData(integration.id);
                }
            } else {
                console.log(`[CRON] No active integrations found.`);
            }

        } catch (err) {
            console.error('[CRON] Error during routine sync iteration:', err);
        }
    });

    console.log('🕒 Cron jobs initialized.');
}

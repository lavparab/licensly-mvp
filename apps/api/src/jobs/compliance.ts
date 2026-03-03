import cron from 'node-cron';
import { supabase } from '../utils/supabase';
import { checkOrganizationCompliance } from '../services/compliance';

export function initComplianceCronJobs() {
    // Run daily at midnight: '0 0 * * *'
    // For demo testing, run every 2 minutes: '*/2 * * * *'
    cron.schedule('0 0 * * *', async () => {
        console.log(`[CRON] Starting daily compliance checks...`);

        try {
            // Get all active organizations
            const { data: orgs, error } = await supabase
                .from('organizations')
                .select('id');

            if (error) throw error;

            if (orgs) {
                console.log(`[CRON] Running compliance checks for ${orgs.length} organizations.`);
                for (const org of orgs) {
                    await checkOrganizationCompliance(org.id);
                }
            }

        } catch (err) {
            console.error('[CRON] Error during daily compliance checks:', err);
        }
    });

    console.log('🕒 Compliance Cron jobs initialized.');
}

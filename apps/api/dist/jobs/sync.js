"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = initCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const supabase_1 = require("../utils/supabase");
const syncEngine_1 = require("../services/syncEngine");
/**
 * Initializes the automated sync cron jobs
 */
function initCronJobs() {
    // Run every 6 hours: '0 */6 * * *'
    // For demo testing, run every minute: '* * * * *'
    node_cron_1.default.schedule('0 */6 * * *', async () => {
        console.log(`[CRON] Starting routine license synchronization...`);
        try {
            // Find all connected integrations that haven't errored
            const { data: integrations, error } = await supabase_1.supabase
                .from('integrations')
                .select('id')
                .eq('status', 'connected');
            if (error)
                throw error;
            if (integrations && integrations.length > 0) {
                console.log(`[CRON] Found ${integrations.length} active integrations to sync.`);
                // Execute syncs sequentially to avoid overwhelming rate limits
                for (const integration of integrations) {
                    await (0, syncEngine_1.syncIntegrationData)(integration.id);
                }
            }
            else {
                console.log(`[CRON] No active integrations found.`);
            }
        }
        catch (err) {
            console.error('[CRON] Error during routine sync iteration:', err);
        }
    });
    console.log('🕒 Cron jobs initialized.');
}

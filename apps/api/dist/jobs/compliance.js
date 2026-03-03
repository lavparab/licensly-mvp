"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initComplianceCronJobs = initComplianceCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const supabase_1 = require("../utils/supabase");
const compliance_1 = require("../services/compliance");
function initComplianceCronJobs() {
    // Run daily at midnight: '0 0 * * *'
    // For demo testing, run every 2 minutes: '*/2 * * * *'
    node_cron_1.default.schedule('0 0 * * *', async () => {
        console.log(`[CRON] Starting daily compliance checks...`);
        try {
            // Get all active organizations
            const { data: orgs, error } = await supabase_1.supabase
                .from('organizations')
                .select('id');
            if (error)
                throw error;
            if (orgs) {
                console.log(`[CRON] Running compliance checks for ${orgs.length} organizations.`);
                for (const org of orgs) {
                    await (0, compliance_1.checkOrganizationCompliance)(org.id);
                }
            }
        }
        catch (err) {
            console.error('[CRON] Error during daily compliance checks:', err);
        }
    });
    console.log('🕒 Compliance Cron jobs initialized.');
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkOrganizationCompliance = checkOrganizationCompliance;
const supabase_1 = require("../utils/supabase");
// Helper to calculate days between dates
const daysBetween = (d1, d2) => {
    return Math.max(0, Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24)));
};
async function checkOrganizationCompliance(orgId) {
    try {
        const today = new Date();
        // 1. Check for upcoming renewals (30, 14, 7 days) and expired licenses
        const { data: licenses, error: licError } = await supabase_1.supabase
            .from('licenses')
            .select('*')
            .eq('org_id', orgId);
        if (licError)
            throw licError;
        for (const license of licenses || []) {
            if (!license.renewal_date)
                continue;
            const renewalDate = new Date(license.renewal_date);
            const daysUntilRenewal = daysBetween(renewalDate, today);
            if (daysUntilRenewal <= 0) {
                // Expired
                await createAlert(orgId, license.id, 'renewal', 'critical', `License for ${license.platform} - ${license.plan_name} has expired or needs immediate action.`);
            }
            else if (daysUntilRenewal === 7 || daysUntilRenewal === 14 || daysUntilRenewal === 30) {
                // Upcoming renewal alert
                await createAlert(orgId, license.id, 'renewal', 'warning', `License for ${license.platform} renewing in ${daysUntilRenewal} days. Review utilization.`);
            }
            // 2. Check for Overuse (seats_used > seats_purchased)
            if (license.seats_used > license.seats_purchased) {
                await createAlert(orgId, license.id, 'overuse', 'critical', `Overuse detected: ${license.platform} - ${license.plan_name}. ${license.seats_used} active users for ${license.seats_purchased} purchased seats.`);
            }
        }
    }
    catch (error) {
        console.error(`Error checking compliance for org ${orgId}:`, error);
    }
}
async function createAlert(orgId, licenseId, alertType, severity, message) {
    // Only insert if an identical unresolved alert doesn't already exist
    const { data: existing } = await supabase_1.supabase
        .from('compliance_alerts')
        .select('id')
        .eq('org_id', orgId)
        .eq('license_id', licenseId)
        .eq('alert_type', alertType)
        .eq('is_resolved', false)
        .single();
    if (!existing) {
        await supabase_1.supabase.from('compliance_alerts').insert({
            org_id: orgId,
            license_id: licenseId,
            alert_type: alertType,
            severity: severity,
            message: message,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // arbitrary 7-day due date
        });
    }
}

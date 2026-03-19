import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
    try {
        const orgId = req.orgId;
        const notifications: any[] = [];

        // 1. Expiring licenses in next 30 days
        const { data: licenses } = await supabase
            .from('licenses')
            .select('id, platform, plan_name, renewal_date')
            .eq('org_id', orgId);

        const today = new Date();
        licenses?.forEach(lic => {
            if (!lic.renewal_date) return;
            const days = Math.ceil((new Date(lic.renewal_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (days < 0) {
                notifications.push({
                    id: `license-expired-${lic.id}`,
                    title: `${lic.platform} license expired`,
                    message: `${lic.plan_name} expired ${Math.abs(days)} days ago`,
                    time: `${Math.abs(days)} days ago`,
                    read: false,
                    type: 'error'
                });
            } else if (days <= 30) {
                notifications.push({
                    id: `license-expiring-${lic.id}`,
                    title: `${lic.platform} renewing soon`,
                    message: `${lic.plan_name} renews in ${days} days`,
                    time: 'upcoming',
                    read: false,
                    type: 'warning'
                });
            }
        });

        // 2. Compliance alerts
        const { data: alerts } = await supabase
            .from('compliance_alerts')
            .select('id, message, severity, created_at')
            .eq('org_id', orgId)
            .eq('is_resolved', false)
            .order('created_at', { ascending: false })
            .limit(3);

        alerts?.forEach(alert => {
            notifications.push({
                id: `alert-${alert.id}`,
                title: alert.severity === 'critical' ? 'Critical compliance alert' : 'Compliance warning',
                message: alert.message,
                time: new Date(alert.created_at).toLocaleDateString(),
                read: false,
                type: alert.severity === 'critical' ? 'error' : 'warning'
            });
        });

        // 3. Connected integrations
        const { data: integrations } = await supabase
            .from('integrations')
            .select('platform, last_synced_at')
            .eq('org_id', orgId)
            .eq('status', 'connected')
            .order('last_synced_at', { ascending: false })
            .limit(2);

        integrations?.forEach(integration => {
            if (integration.last_synced_at) {
                notifications.push({
                    id: `sync-${integration.platform}`,
                    title: `${integration.platform} synced`,
                    message: `Data synced successfully`,
                    time: new Date(integration.last_synced_at).toLocaleDateString(),
                    read: true,
                    type: 'success'
                });
            }
        });

        res.json({ notifications });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
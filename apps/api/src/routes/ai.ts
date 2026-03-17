import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import { generateOptimizationRecommendations } from '../services/optimization';

const router = Router();

// Trigger full AI organization analysis
router.post('/analyze', requireAuth, async (req: AuthRequest, res) => {
    try {
        const orgId = req.orgId;
        if (!orgId) return res.status(400).json({ error: 'Organization not found' });
        
        const results = await generateOptimizationRecommendations(orgId);

        res.json({ success: true, ...results });
    } catch (error: any) {
        console.error('AI Analysis trigger failed:', error);
        res.status(500).json({ error: 'Failed to trigger AI optimization analysis' });
    }
});

// Fetch active recommendations
router.get('/recommendations', requireAuth, async (req: AuthRequest, res) => {
    try {
        const orgId = req.orgId;
        const { data, error } = await supabase
            .from('optimization_recommendations')
            .select('id, type, title, description, estimated_savings, status, platform, licenses(platform)')
            .eq('org_id', orgId)
            .eq('status', 'pending');
            
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// Fetch total projected savings
router.get('/savings', requireAuth, async (req: AuthRequest, res) => {
    try {
        const orgId = req.orgId;
        const { data, error } = await supabase
            .from('optimization_recommendations')
            .select('estimated_savings')
            .eq('org_id', orgId)
            .eq('status', 'pending');
            
        if (error) throw error;
        
        const total = (data || []).reduce((sum, r) => sum + Number(r.estimated_savings || 0), 0);
        res.json({ total_potential_savings: total });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch savings estimate' });
    }
});

// Accept or dismiss a recommendation
router.patch('/recommendations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
        const orgId = req.orgId;
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'dismissed'

        if (!['accepted', 'dismissed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const { data, error } = await supabase
            .from('optimization_recommendations')
            .update({ status })
            .eq('id', id)
            .eq('org_id', orgId)
            .select()
            .single();

        if (error) throw error;

        // Optionally, if status === 'accepted', we might want to take automated action 
        // like firing a webhook or modifying the license directly. For MVP, we just update status.

        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update recommendation' });
    }
});

export default router;

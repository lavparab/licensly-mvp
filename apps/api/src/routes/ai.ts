import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Trigger full AI organization analysis
router.post('/analyze', requireAuth, async (req: AuthRequest, res) => {
    try {
        const orgId = req.orgId;
        // Call the Python FastAPI microservice
        const response = await axios.post(`${AI_SERVICE_URL}/api/ai/analyze/${orgId}`);

        res.json({ success: true, ...response.data });
    } catch (error: any) {
        console.error('AI Analysis trigger failed:', error.message);
        res.status(500).json({ error: 'Failed to trigger AI optimization analysis' });
    }
});

// Fetch active recommendations
router.get('/recommendations', requireAuth, async (req: AuthRequest, res) => {
    try {
        const orgId = req.orgId;
        const response = await axios.get(`${AI_SERVICE_URL}/api/ai/recommendations/${orgId}`);
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// Fetch total projected savings
router.get('/savings', requireAuth, async (req: AuthRequest, res) => {
    try {
        const orgId = req.orgId;
        const response = await axios.get(`${AI_SERVICE_URL}/api/ai/savings-estimate/${orgId}`);
        res.json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch savings estimate' });
    }
});

export default router;

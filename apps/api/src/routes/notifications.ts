import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, async (req: AuthRequest, res) => {
    // Static demo notifications for now
    res.json({
        notifications: [
            { id: 1, title: 'GitHub sync completed', message: '23 members synced successfully', time: '2 min ago', read: false, type: 'success' },
            { id: 2, title: 'License expiring soon', message: 'Adobe Creative Cloud renews in 7 days', time: '1 hour ago', read: false, type: 'warning' },
            { id: 3, title: 'New member detected', message: '2 new GitHub members need license assignment', time: '3 hours ago', read: true, type: 'info' },
        ]
    });
});

export default router;
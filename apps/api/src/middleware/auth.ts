import { Request, Response, NextFunction } from 'express';
import { supabase } from '../utils/supabase';

// Extend Express Request to include user context
export interface AuthRequest extends Request {
    user?: any;
    orgId?: string;
    userRole?: string;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or malformed Authorization header' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token using Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }

        // Optionally fetch custom roles or organization
        // Realistically this should be cached or included in JWT claims
        const { data: userData } = await supabase
            .from('users')
            .select('org_id, role')
            .eq('id', user.id)
            .single();

        req.user = user;
        req.orgId = userData?.org_id;
        req.userRole = userData?.role;

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

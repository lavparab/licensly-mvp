"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const supabase_1 = require("../utils/supabase");
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or malformed Authorization header' });
        }
        const token = authHeader.split(' ')[1];
        // Verify token using Supabase
        const { data: { user }, error } = await supabase_1.supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        // Optionally fetch custom roles or organization
        // Realistically this should be cached or included in JWT claims
        const { data: userData } = await supabase_1.supabase
            .from('users')
            .select('org_id, role')
            .eq('id', user.id)
            .single();
        req.user = user;
        req.orgId = userData?.org_id;
        req.userRole = userData?.role;
        next();
    }
    catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};
exports.requireAuth = requireAuth;

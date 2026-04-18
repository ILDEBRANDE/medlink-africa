const db = require('../db');

// FIX: added try/catch so DB errors don't crash the process
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};

const requireRole = (roles) => {
    return async (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        try {
            const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.session.userId]);
            if (users.length === 0) return res.status(401).json({ error: 'User not found' });
            if (!roles.includes(users[0].role)) return res.status(403).json({ error: 'Access denied' });
            req.userRole = users[0].role;
            next();
        } catch (err) {
            console.error('requireRole error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    };
};

module.exports = { requireAuth, requireRole };

const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Get all settings (language, theme, notifications)
router.get('/', requireAuth, async (req, res) => {
    try {
        const [users] = await db.query('SELECT language FROM users WHERE id = ?', [req.session.userId]);
        const [settings] = await db.query('SELECT * FROM user_settings WHERE user_id = ?', [req.session.userId]);
        res.json({
            language: users[0]?.language || 'en',
            theme: settings[0]?.theme || 'light',
            notifications_enabled: settings[0]?.notifications_enabled ?? true,
            email_notifications: settings[0]?.email_notifications ?? true
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update language only
router.put('/language', requireAuth, async (req, res) => {
    const { language } = req.body;
    const allowed = ['en', 'rw', 'fr', 'sw'];
    if (!allowed.includes(language)) return res.status(400).json({ error: 'Invalid language' });
    try {
        await db.query('UPDATE users SET language = ? WHERE id = ?', [language, req.session.userId]);
        res.json({ message: 'Language updated', language });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update theme and notification preferences
router.put('/', requireAuth, async (req, res) => {
    const { theme, notifications_enabled, email_notifications } = req.body;
    try {
        await db.query(`
            INSERT INTO user_settings (user_id, theme, notifications_enabled, email_notifications)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            theme = VALUES(theme),
            notifications_enabled = VALUES(notifications_enabled),
            email_notifications = VALUES(email_notifications)
        `, [req.session.userId, theme, notifications_enabled, email_notifications]);
        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update email
router.put('/email', requireAuth, async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    try {
        await db.query('UPDATE users SET email = ? WHERE id = ?', [email, req.session.userId]);
        res.json({ message: 'Email updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change password
router.put('/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing passwords' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    try {
        const [user] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.session.userId]);
        const valid = await bcrypt.compare(currentPassword, user[0].password_hash);
        if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
        const newHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.session.userId]);
        res.json({ message: 'Password changed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
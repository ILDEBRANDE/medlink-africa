const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Helper to create a notification (used by other modules)
async function createNotification(userId, title, message) {
    if (!userId) return;
    try {
        await db.query('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [userId, title, message]);
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
}

// Get all notifications for logged-in user
router.get('/', requireAuth, async (req, res) => {
    try {
        const [notifications] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [req.session.userId]
        );
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark as read
router.put('/:id/read', requireAuth, async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [req.params.id, req.session.userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a notification (user can delete their own)
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const [notif] = await db.query('SELECT user_id FROM notifications WHERE id = ?', [req.params.id]);
        if (!notif.length) return res.status(404).json({ error: 'Notification not found' });
        if (notif[0].user_id !== req.session.userId) return res.status(403).json({ error: 'Not your notification' });
        await db.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = { router, createNotification };
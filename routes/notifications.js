const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Helper function to create notification
async function createNotification(userId, title, message) {
    if (!userId) return;
    try {
        await db.query(
            'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
            [userId, title, message]
        );
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
        console.log(`Fetched ${notifications.length} notifications for user ${req.session.userId}`);
        res.json(notifications);
    } catch (err) {
        console.error('GET /notifications error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read
router.put('/:id/read', requireAuth, async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.session.userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('PUT /notifications/:id/read error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete notification
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const [notif] = await db.query('SELECT user_id FROM notifications WHERE id = ?', [req.params.id]);
        if (!notif.length) return res.status(404).json({ error: 'Notification not found' });
        if (notif[0].user_id !== req.session.userId) {
            return res.status(403).json({ error: 'Not your notification' });
        }
        await db.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        console.error('DELETE /notifications/:id error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = { router, createNotification };
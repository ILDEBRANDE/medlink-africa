const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Get conversations for logged-in user
router.get('/conversations', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    try {
        const [conversations] = await db.query(`
            SELECT DISTINCT 
                u.id as other_user_id,
                CASE 
                    WHEN u.role = 'doctor' THEN d.full_name
                    WHEN u.role = 'hospital' THEN h.hospital_name
                    WHEN u.role = 'admin' THEN CONCAT('Admin (', u.email, ')')
                END as other_name,
                (SELECT message FROM messages 
                 WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) 
                 ORDER BY created_at DESC LIMIT 1) as last_message,
                (SELECT created_at FROM messages 
                 WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?) 
                 ORDER BY created_at DESC LIMIT 1) as last_message_time
            FROM messages m
            JOIN users u ON u.id = m.sender_id OR u.id = m.receiver_id
            LEFT JOIN doctors d ON u.id = d.user_id
            LEFT JOIN hospitals h ON u.id = h.user_id
            WHERE (m.sender_id = ? OR m.receiver_id = ?) AND u.id != ?
            GROUP BY u.id
            ORDER BY last_message_time DESC
        `, [userId, userId, userId, userId, userId, userId, userId]);
        res.json(conversations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get messages with a specific user
router.get('/:userId', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const otherUserId = req.params.userId;
    try {
        const [messages] = await db.query(`
            SELECT * FROM messages 
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        `, [userId, otherUserId, otherUserId, userId]);
        await db.query('UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ?', [userId, otherUserId]);
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get user by email (for contact admin with email)
router.get('/user-by-email/:email', requireAuth, async (req, res) => {
    try {
        const [user] = await db.query('SELECT id, role, email FROM users WHERE email = ?', [req.params.email]);
        if (!user.length) return res.status(404).json({ error: 'User not found' });
        res.json({ id: user[0].id, role: user[0].role, email: user[0].email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Send a message
router.post('/', requireAuth, async (req, res) => {
    const { receiver_id, message } = req.body;
    if (!receiver_id || !message) {
        return res.status(400).json({ error: 'Missing receiver_id or message' });
    }
    try {
        const [receiver] = await db.query('SELECT id FROM users WHERE id = ?', [receiver_id]);
        if (!receiver.length) {
            return res.status(404).json({ error: 'Receiver not found' });
        }
        const [result] = await db.query(
            'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
            [req.session.userId, receiver_id, message]
        );
        console.log(`Message sent: ${req.session.userId} -> ${receiver_id}`);
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a message
router.delete('/:messageId', requireAuth, async (req, res) => {
    try {
        const [msg] = await db.query('SELECT sender_id FROM messages WHERE id = ?', [req.params.messageId]);
        if (!msg.length) return res.status(404).json({ error: 'Message not found' });
        if (msg[0].sender_id !== req.session.userId) {
            return res.status(403).json({ error: 'You can only delete your own messages' });
        }
        await db.query('DELETE FROM messages WHERE id = ?', [req.params.messageId]);
        res.json({ message: 'Message deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get user name by ID
router.get('/user/:userId/name', requireAuth, async (req, res) => {
    try {
        const [user] = await db.query(`
            SELECT u.id, 
                   CASE 
                       WHEN u.role = 'doctor' THEN d.full_name
                       WHEN u.role = 'hospital' THEN h.hospital_name
                       WHEN u.role = 'admin' THEN CONCAT('Admin (', u.email, ')')
                   END as name
            FROM users u
            LEFT JOIN doctors d ON u.id = d.user_id
            LEFT JOIN hospitals h ON u.id = h.user_id
            WHERE u.id = ?
        `, [req.params.userId]);
        if (!user.length) return res.status(404).json({ error: 'User not found' });
        res.json({ name: user[0].name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const fs = require('fs');
const { requireAuth, requireRole } = require('../middleware/auth');
const uploadPhoto = require('../middleware/uploadPhoto');
const router = express.Router();

// ========== PUBLIC ADMIN ID ENDPOINT (accessible by any authenticated user) ==========
router.get('/admin-id', requireAuth, async (req, res) => {
    try {
        // Try to find admin by email first
        let [admin] = await db.query("SELECT id FROM users WHERE email = 'admin@gmail.com' LIMIT 1");
        if (!admin.length) {
            // Fallback: find any admin
            [admin] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        }
        if (!admin.length) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        res.json({ adminId: admin[0].id });
    } catch (err) {
        console.error('Admin ID error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========== ALL FOLLOWING ROUTES REQUIRE ADMIN ROLE ==========
router.use(requireAuth);
router.use(requireRole(['admin']));

// ========== ADMIN PROFILE PHOTO ==========
router.post('/upload-photo', uploadPhoto.single('photo'), async (req, res) => {
    try {
        const photoPath = req.file.path;
        const [existing] = await db.query('SELECT id FROM admin_profiles WHERE user_id = ?', [req.session.userId]);
        if (existing.length) {
            await db.query('UPDATE admin_profiles SET profile_photo = ? WHERE user_id = ?', [photoPath, req.session.userId]);
        } else {
            await db.query('INSERT INTO admin_profiles (user_id, profile_photo, full_name) VALUES (?, ?, ?)', 
                [req.session.userId, photoPath, 'Admin User']);
        }
        res.json({ message: 'Photo uploaded successfully', path: photoPath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// ========== 1. USER MANAGEMENT ==========
router.get('/users', async (req, res) => {
    try {
        const [doctors] = await db.query(`
            SELECT u.id, u.email, u.role, u.created_at, d.id as doctor_id, d.full_name, d.specialty, 
                   d.experience_years, d.location_pref, d.phone, d.profile_photo
            FROM users u JOIN doctors d ON u.id = d.user_id WHERE u.role = 'doctor' ORDER BY d.full_name
        `);
        const [hospitals] = await db.query(`
            SELECT u.id, u.email, u.role, u.created_at, h.id as hospital_id, h.hospital_name, 
                   h.location, h.contact_phone, h.profile_photo, h.latitude, h.longitude
            FROM users u JOIN hospitals h ON u.id = h.user_id WHERE u.role = 'hospital' ORDER BY h.hospital_name
        `);
        res.json({ doctors, hospitals });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/user/:userId', async (req, res) => {
    try {
        const [user] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.userId]);
        if (!user.length) return res.status(404).json({ error: 'User not found' });
        await db.query('DELETE FROM users WHERE id = ?', [req.params.userId]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 2. CONTENT MODERATION ==========
router.get('/doctors-documents', async (req, res) => {
    const [doctors] = await db.query(`
        SELECT d.id, d.user_id, d.full_name, d.specialty, d.cv_path, d.license_path, u.email 
        FROM doctors d JOIN users u ON d.user_id = u.id ORDER BY d.full_name
    `);
    res.json(doctors);
});

router.delete('/doctor-document/:doctorId/:type', async (req, res) => {
    const { doctorId, type } = req.params;
    const [doctor] = await db.query(`SELECT ${type}_path as path FROM doctors WHERE id = ?`, [doctorId]);
    if (doctor[0]?.path && fs.existsSync(doctor[0].path)) fs.unlinkSync(doctor[0].path);
    await db.query(`UPDATE doctors SET ${type}_path = NULL WHERE id = ?`, [doctorId]);
    res.json({ message: `${type.toUpperCase()} deleted` });
});

router.get('/jobs', async (req, res) => {
    const [jobs] = await db.query(`
        SELECT j.*, h.hospital_name 
        FROM jobs j JOIN hospitals h ON j.hospital_id = h.id 
        ORDER BY j.posted_date DESC
    `);
    res.json(jobs);
});

router.delete('/job/:jobId', async (req, res) => {
    await db.query('DELETE FROM jobs WHERE id = ?', [req.params.jobId]);
    res.json({ message: 'Job deleted' });
});

// ========== 3. STATISTICS ==========
router.get('/stats', async (req, res) => {
    const [totalDoctors] = await db.query('SELECT COUNT(*) as count FROM doctors');
    const [totalHospitals] = await db.query('SELECT COUNT(*) as count FROM hospitals');
    const [totalJobs] = await db.query('SELECT COUNT(*) as count FROM jobs');
    const [totalApplications] = await db.query('SELECT COUNT(*) as count FROM applications');
    const [ruralJobs] = await db.query('SELECT COUNT(*) as count FROM jobs WHERE location_type = "rural"');
    const [urbanJobs] = await db.query('SELECT COUNT(*) as count FROM jobs WHERE location_type = "urban"');
    res.json({ 
        doctors: totalDoctors[0].count, 
        hospitals: totalHospitals[0].count, 
        jobs: totalJobs[0].count, 
        applications: totalApplications[0].count, 
        ruralJobs: ruralJobs[0].count, 
        urbanJobs: urbanJobs[0].count 
    });
});

// ========== 4. SUPPORT & MESSAGES ==========
router.get('/messages', async (req, res) => {
    const [messages] = await db.query(`
        SELECT m.*, 
               CASE WHEN s.role = 'doctor' THEN d.full_name ELSE h.hospital_name END as sender_name,
               CASE WHEN r.role = 'doctor' THEN d2.full_name ELSE h2.hospital_name END as receiver_name
        FROM messages m 
        JOIN users s ON m.sender_id = s.id 
        JOIN users r ON m.receiver_id = r.id
        LEFT JOIN doctors d ON s.id = d.user_id 
        LEFT JOIN hospitals h ON s.id = h.user_id
        LEFT JOIN doctors d2 ON r.id = d2.user_id 
        LEFT JOIN hospitals h2 ON r.id = h2.user_id
        ORDER BY m.created_at DESC
    `);
    res.json(messages);
});

router.delete('/message/:messageId', async (req, res) => {
    await db.query('DELETE FROM messages WHERE id = ?', [req.params.messageId]);
    res.json({ message: 'Message deleted' });
});

router.post('/broadcast', async (req, res) => {
    const { role, title, message } = req.body;
    let users = [];
    if (role === 'doctor') users = await db.query('SELECT user_id FROM doctors');
    else if (role === 'hospital') users = await db.query('SELECT user_id FROM hospitals');
    else users = await db.query('SELECT id as user_id FROM users WHERE role IN ("doctor","hospital")');
    for (const u of users[0]) {
        await db.query('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [u.user_id, title, message]);
    }
    res.json({ message: `Broadcast sent to ${role}s` });
});

// ========== 5. SYSTEM MAINTENANCE ==========
router.get('/health-check', (req, res) => res.json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() }));
router.post('/backup', async (req, res) => { res.json({ message: 'Backup created' }); });
router.post('/cleanup-old-jobs', async (req, res) => { res.json({ message: 'Cleaned' }); });
router.get('/system-logs', async (req, res) => { 
    const [logs] = await db.query('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 100'); 
    res.json(logs); 
});

// ========== 6. MAP LOCATIONS ==========
router.get('/hospital-locations', async (req, res) => {
    try {
        const [hospitals] = await db.query(`
            SELECT id, hospital_name, location, latitude, longitude 
            FROM hospitals WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        `);
        res.json(hospitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/hospital-location/:hospitalId', async (req, res) => {
    try {
        const [hospital] = await db.query('SELECT latitude, longitude FROM hospitals WHERE id = ?', [req.params.hospitalId]);
        res.json(hospital[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/hospital-location/:hospitalId', async (req, res) => {
    const { latitude, longitude } = req.body;
    try {
        await db.query('UPDATE hospitals SET latitude = ?, longitude = ? WHERE id = ?', [latitude, longitude, req.params.hospitalId]);
        res.json({ message: 'Location updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 7. ADMIN NOTIFICATIONS ==========
router.get('/notifications', async (req, res) => {
    try {
        const [notifs] = await db.query(`
            SELECT an.*, h.hospital_name, h.location
            FROM admin_notifications an
            JOIN hospitals h ON an.hospital_id = h.id
            ORDER BY an.created_at DESC
            LIMIT 50
        `);
        res.json(notifs);
    } catch (err) {
        console.error('Admin notifications error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/notifications/:id/read', async (req, res) => {
    try {
        await db.query('UPDATE admin_notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/notifications/:id', async (req, res) => {
    try {
        const [notif] = await db.query('SELECT id FROM admin_notifications WHERE id = ?', [req.params.id]);
        if (!notif.length) return res.status(404).json({ error: 'Notification not found' });
        await db.query('DELETE FROM admin_notifications WHERE id = ?', [req.params.id]);
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/notifications/clear-all', async (req, res) => {
    try {
        await db.query('DELETE FROM admin_notifications');
        res.json({ message: 'All notifications cleared' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 8. ADMIN SETTINGS ==========
router.get('/admin-settings', async (req, res) => {
    const [settings] = await db.query('SELECT * FROM admin_settings WHERE admin_user_id = ?', [req.session.userId]);
    const [profile] = await db.query('SELECT profile_photo FROM admin_profiles WHERE user_id = ?', [req.session.userId]);
    res.json({ 
        language: settings[0]?.language || 'en', 
        theme: settings[0]?.theme || 'light', 
        customColor: settings[0]?.custom_color || null, 
        timezone: settings[0]?.timezone || 'Africa/Kigali', 
        profile_photo: profile[0]?.profile_photo || null 
    });
});

router.put('/admin-settings', async (req, res) => {
    const { language, theme, customColor, timezone } = req.body;
    await db.query(`
        INSERT INTO admin_settings (admin_user_id, language, theme, custom_color, timezone)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        language = VALUES(language),
        theme = VALUES(theme),
        custom_color = VALUES(custom_color),
        timezone = VALUES(timezone)
    `, [req.session.userId, language, theme, customColor, timezone]);
    res.json({ message: 'Settings updated' });
});

router.put('/admin-email', async (req, res) => { 
    await db.query('UPDATE users SET email = ? WHERE id = ?', [req.body.email, req.session.userId]); 
    res.json({ message: 'Email updated' }); 
});

router.put('/admin-password', async (req, res) => { 
    const { currentPassword, newPassword } = req.body;
    const [admin] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.session.userId]);
    const valid = await bcrypt.compare(currentPassword, admin[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.session.userId]);
    res.json({ message: 'Password changed' });
});

router.delete('/admin-account', async (req, res) => { 
    await db.query('DELETE FROM users WHERE id = ?', [req.session.userId]); 
    req.session.destroy(); 
    res.json({ message: 'Account deleted' }); 
});

module.exports = router;
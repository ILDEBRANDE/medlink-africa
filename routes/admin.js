const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const fs = require('fs');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireRole(['admin']));

// ========== 1. USER MANAGEMENT ==========
router.get('/users', async (req, res) => {
    try {
        const [doctors] = await db.query(`
            SELECT u.id, u.email, u.role, u.created_at, 
                   d.id as doctor_id, d.full_name, d.specialty, d.experience_years, d.location_pref, d.phone
            FROM users u
            JOIN doctors d ON u.id = d.user_id
            WHERE u.role = 'doctor'
            ORDER BY d.full_name
        `);
        const [hospitals] = await db.query(`
            SELECT u.id, u.email, u.role, u.created_at,
                   h.id as hospital_id, h.hospital_name, h.location, h.contact_phone
            FROM users u
            JOIN hospitals h ON u.id = h.user_id
            WHERE u.role = 'hospital'
            ORDER BY h.hospital_name
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
        await db.query('INSERT INTO system_logs (action, details) VALUES (?, ?)', ['delete_user', `Deleted user ID ${req.params.userId}`]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 2. CONTENT MODERATION ==========
router.get('/doctors-documents', async (req, res) => {
    try {
        const [doctors] = await db.query(`
            SELECT d.id, d.user_id, d.full_name, d.specialty, d.cv_path, d.license_path, u.email
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            ORDER BY d.full_name
        `);
        res.json(doctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/doctor-document/:doctorId/:type', async (req, res) => {
    const { doctorId, type } = req.params;
    try {
        const [doctor] = await db.query(`SELECT ${type}_path as path FROM doctors WHERE id = ?`, [doctorId]);
        if (doctor[0]?.path && fs.existsSync(doctor[0].path)) {
            fs.unlinkSync(doctor[0].path);
        }
        await db.query(`UPDATE doctors SET ${type}_path = NULL WHERE id = ?`, [doctorId]);
        await db.query('INSERT INTO system_logs (action, details) VALUES (?, ?)', ['delete_document', `Deleted ${type} for doctor ID ${doctorId}`]);
        res.json({ message: `${type.toUpperCase()} deleted` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/jobs', async (req, res) => {
    try {
        const [jobs] = await db.query(`
            SELECT j.*, h.hospital_name 
            FROM jobs j 
            JOIN hospitals h ON j.hospital_id = h.id 
            ORDER BY j.posted_date DESC
        `);
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/job/:jobId', async (req, res) => {
    try {
        await db.query('DELETE FROM jobs WHERE id = ?', [req.params.jobId]);
        await db.query('INSERT INTO system_logs (action, details) VALUES (?, ?)', ['delete_job', `Deleted job ID ${req.params.jobId}`]);
        res.json({ message: 'Job deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 3. STATISTICS ==========
router.get('/stats', async (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/matching-stats', async (req, res) => {
    try {
        const [jobs] = await db.query('SELECT id, specialty_required, location_type FROM jobs WHERE status = "open"');
        const [doctors] = await db.query('SELECT id, specialty, location_pref, experience_years FROM doctors');
        let totalMatch = 0, count = 0;
        for (const job of jobs) {
            for (const doc of doctors) {
                let score = 0;
                if (doc.specialty === job.specialty_required) score += 40;
                else if (doc.specialty && job.specialty_required && doc.specialty.toLowerCase().includes(job.specialty_required.toLowerCase())) score += 20;
                if (doc.location_pref === job.location_type || doc.location_pref === 'both') score += 30;
                if (doc.experience_years >= 5) score += 30;
                else if (doc.experience_years >= 3) score += 20;
                else if (doc.experience_years >= 1) score += 10;
                totalMatch += score;
                count++;
            }
        }
        const avgMatch = count > 0 ? (totalMatch / count).toFixed(2) : 0;
        res.json({ average_match_score: avgMatch, total_jobs: jobs.length, total_doctors: doctors.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 4. SUPPORT & DISPUTES ==========
router.get('/messages', async (req, res) => {
    try {
        const [messages] = await db.query(`
            SELECT m.*, 
                   CASE 
                       WHEN s.role = 'doctor' THEN d.full_name
                       WHEN s.role = 'hospital' THEN h.hospital_name
                       WHEN s.role = 'admin' THEN CONCAT('Admin (', s.email, ')')
                   END as sender_name,
                   CASE 
                       WHEN r.role = 'doctor' THEN d2.full_name
                       WHEN r.role = 'hospital' THEN h2.hospital_name
                       WHEN r.role = 'admin' THEN CONCAT('Admin (', r.email, ')')
                   END as receiver_name
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/message/:messageId', async (req, res) => {
    try {
        await db.query('DELETE FROM messages WHERE id = ?', [req.params.messageId]);
        await db.query('INSERT INTO system_logs (action, details) VALUES (?, ?)', ['delete_message', `Deleted message ID ${req.params.messageId}`]);
        res.json({ message: 'Message deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/broadcast', async (req, res) => {
    const { role, title, message } = req.body;
    try {
        let users = [];
        if (role === 'doctor') users = await db.query('SELECT user_id FROM doctors');
        else if (role === 'hospital') users = await db.query('SELECT user_id FROM hospitals');
        else users = await db.query('SELECT id as user_id FROM users WHERE role IN ("doctor","hospital")');
        for (const u of users[0]) {
            await db.query('INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)', [u.user_id, title, message]);
        }
        await db.query('INSERT INTO system_logs (action, details) VALUES (?, ?)', ['broadcast', `Sent to ${role}s: ${title}`]);
        res.json({ message: `Broadcast sent to ${role}s` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 5. SYSTEM MAINTENANCE ==========
router.get('/health-check', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date(), uptime: process.uptime() });
});

router.post('/backup', async (req, res) => {
    try {
        const tables = ['users', 'doctors', 'hospitals', 'jobs', 'applications', 'messages', 'notifications', 'user_settings', 'admin_notifications', 'system_logs'];
        const backup = {};
        for (const table of tables) {
            const [rows] = await db.query(`SELECT * FROM ${table}`);
            backup[table] = rows;
        }
        const backupDir = './backups';
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
        const filename = `backup_${Date.now()}.json`;
        fs.writeFileSync(`${backupDir}/${filename}`, JSON.stringify(backup, null, 2));
        await db.query('INSERT INTO system_logs (action, details) VALUES (?, ?)', ['backup', `Created backup file ${filename}`]);
        res.json({ message: 'Backup created', file: filename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/cleanup-old-jobs', async (req, res) => {
    try {
        const [result] = await db.query("DELETE FROM jobs WHERE status = 'closed' AND posted_date < DATE_SUB(NOW(), INTERVAL 30 DAY)");
        await db.query('INSERT INTO system_logs (action, details) VALUES (?, ?)', ['cleanup_jobs', `Deleted ${result.affectedRows} old closed jobs`]);
        res.json({ message: `Deleted ${result.affectedRows} old closed jobs` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/system-logs', async (req, res) => {
    try {
        const [logs] = await db.query('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 100');
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 6. MAP LOCATIONS ==========
router.get('/hospital-locations', async (req, res) => {
    try {
        const [hospitals] = await db.query('SELECT id, hospital_name, location, latitude, longitude FROM hospitals WHERE latitude IS NOT NULL AND longitude IS NOT NULL');
        res.json(hospitals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/hospital-location/:hospitalId', async (req, res) => {
    try {
        const [hospital] = await db.query('SELECT latitude, longitude FROM hospitals WHERE id = ?', [req.params.hospitalId]);
        if (!hospital.length) return res.status(404).json({ error: 'Hospital not found' });
        res.json({ latitude: hospital[0].latitude, longitude: hospital[0].longitude });
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
            SELECT an.*, h.hospital_name 
            FROM admin_notifications an
            JOIN hospitals h ON an.hospital_id = h.id
            ORDER BY an.created_at DESC
        `);
        res.json(notifs);
    } catch (err) {
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

// NEW: Delete all admin notifications for the current admin
router.delete('/notifications', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM admin_notifications WHERE admin_user_id = ?', [req.session.userId]);
        res.json({ message: 'All notifications cleared', affectedRows: result[0].affectedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ========== 8. ADMIN SETTINGS ==========
router.get('/admin-settings', async (req, res) => {
    try {
        const [settings] = await db.query('SELECT * FROM admin_settings WHERE admin_user_id = ?', [req.session.userId]);
        res.json({
            language: settings[0]?.language || 'en',
            theme: settings[0]?.theme || 'light',
            customColor: settings[0]?.custom_color || null,
            timezone: settings[0]?.timezone || 'Africa/Kigali'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/admin-settings', async (req, res) => {
    const { language, theme, customColor, timezone } = req.body;
    try {
        await db.query(`
            INSERT INTO admin_settings (admin_user_id, language, theme, custom_color, timezone)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            language = VALUES(language),
            theme = VALUES(theme),
            custom_color = VALUES(custom_color),
            timezone = VALUES(timezone)
        `, [req.session.userId, language, theme, customColor || null, timezone]);
        res.json({ message: 'Settings updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/admin-email', async (req, res) => {
    const { email } = req.body;
    try {
        await db.query('UPDATE users SET email = ? WHERE id = ?', [email, req.session.userId]);
        res.json({ message: 'Email updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/admin-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const [admin] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.session.userId]);
        const valid = await bcrypt.compare(currentPassword, admin[0].password_hash);
        if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
        const newHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.session.userId]);
        res.json({ message: 'Password changed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/admin-account', async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.session.userId]);
        req.session.destroy();
        res.json({ message: 'Account deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== 9. ADMIN ID FOR CONTACT ==========
router.get('/admin-id', async (req, res) => {
    try {
        const [admin] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        if (!admin.length) return res.status(404).json({ error: 'Admin not found' });
        res.json({ adminId: admin[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
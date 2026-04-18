const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

// Hospital schedules an interview
router.post('/schedule', requireAuth, requireRole(['hospital']), async (req, res) => {
    const { application_id, scheduled_datetime, meeting_link, notes } = req.body;
    try {
        const [hospital] = await db.query('SELECT id FROM hospitals WHERE user_id = ?', [req.session.userId]);
        const [app] = await db.query(`
            SELECT a.*, j.hospital_id FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = ? AND j.hospital_id = ?
        `, [application_id, hospital[0].id]);

        if (!app.length) return res.status(404).json({ error: 'Application not found' });

        const [existing] = await db.query('SELECT id FROM interviews WHERE application_id = ?', [application_id]);
        if (existing.length) {
            await db.query(
                'UPDATE interviews SET scheduled_datetime = ?, meeting_link = ?, notes = ?, status = "scheduled" WHERE application_id = ?',
                [scheduled_datetime, meeting_link, notes, application_id]
            );
        } else {
            await db.query(
                'INSERT INTO interviews (application_id, scheduled_datetime, meeting_link, notes) VALUES (?, ?, ?, ?)',
                [application_id, scheduled_datetime, meeting_link, notes]
            );
        }
        await db.query('UPDATE applications SET status = "interview_scheduled" WHERE id = ?', [application_id]);

        // ----- Notify admin -----
        const [admin] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        if (admin.length) {
            await db.query(
                'INSERT INTO admin_notifications (admin_user_id, hospital_id, action_type, details) VALUES (?, ?, ?, ?)',
                [admin[0].id, app[0].hospital_id, 'schedule_interview', `Scheduled interview for application #${application_id} at ${scheduled_datetime}`]
            );
        }

        res.json({ message: 'Interview scheduled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to schedule interview' });
    }
});

// Doctor gets their interviews
router.get('/doctor', requireAuth, requireRole(['doctor']), async (req, res) => {
    try {
        const [interviews] = await db.query(`
            SELECT i.*, j.title, h.hospital_name, a.status as application_status
            FROM interviews i
            JOIN applications a ON i.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            JOIN hospitals h ON j.hospital_id = h.id
            WHERE a.doctor_id = (SELECT id FROM doctors WHERE user_id = ?)
            ORDER BY i.scheduled_datetime DESC
        `, [req.session.userId]);
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Hospital gets interviews for its jobs
router.get('/hospital', requireAuth, requireRole(['hospital']), async (req, res) => {
    try {
        const [hospital] = await db.query('SELECT id FROM hospitals WHERE user_id = ?', [req.session.userId]);
        const [interviews] = await db.query(`
            SELECT i.*, j.title, d.full_name, d.specialty, a.status as application_status
            FROM interviews i
            JOIN applications a ON i.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE j.hospital_id = ?
            ORDER BY i.scheduled_datetime DESC
        `, [hospital[0].id]);
        res.json(interviews);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createNotification } = require('./notifications');
const router = express.Router();

// Get all open jobs (public)
router.get('/', async (req, res) => {
    try {
        const [jobs] = await db.query(`
            SELECT j.*, h.hospital_name, h.location as hospital_location
            FROM jobs j
            JOIN hospitals h ON j.hospital_id = h.id
            WHERE j.status = 'open'
            ORDER BY j.posted_date DESC
        `);
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single job
router.get('/:id', async (req, res) => {
    try {
        const [jobs] = await db.query(`
            SELECT j.*, h.hospital_name, h.location as hospital_location
            FROM jobs j
            JOIN hospitals h ON j.hospital_id = h.id
            WHERE j.id = ?
        `, [req.params.id]);
        if (jobs.length === 0) return res.status(404).json({ error: 'Job not found' });
        res.json(jobs[0]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Hospital creates job (with notification to matching doctors and admin)
router.post('/', requireAuth, requireRole(['hospital']), async (req, res) => {
    const { title, description, specialty_required, location_type, salary_range } = req.body;
    try {
        const [hospital] = await db.query('SELECT id, user_id FROM hospitals WHERE user_id = ?', [req.session.userId]);
        if (hospital.length === 0) {
            return res.status(404).json({ error: 'Hospital profile not found' });
        }

        // Insert the job
        const [result] = await db.query(
            'INSERT INTO jobs (hospital_id, title, description, specialty_required, location_type, salary_range) VALUES (?, ?, ?, ?, ?, ?)',
            [hospital[0].id, title, description, specialty_required, location_type, salary_range]
        );
        const jobId = result.insertId;

        // ----- Notify matching doctors -----
        const [matchingDoctors] = await db.query(`
            SELECT d.user_id
            FROM doctors d
            WHERE d.specialty = ? OR d.location_pref = ? OR d.location_pref = 'both'
        `, [specialty_required, location_type]);

        for (const doctor of matchingDoctors) {
            await createNotification(
                doctor.user_id,
                'New Job Match',
                `A new "${title}" position (${location_type}) matching your profile has been posted.`
            );
        }

        // ----- Notify admin -----
        const [admin] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        if (admin.length) {
            await db.query(`
                INSERT INTO admin_notifications (admin_user_id, hospital_id, action_type, details) 
                VALUES (?, ?, 'post_job', ?)
            `, [admin[0].id, hospital[0].id, `Posted new job: ${title}`]);
        }

        res.status(201).json({ message: 'Job posted successfully', jobId });
    } catch (error) {
        console.error('Job post error:', error);
        res.status(500).json({ error: 'Failed to post job' });
    }
});

// Hospital updates job
router.put('/:id', requireAuth, requireRole(['hospital']), async (req, res) => {
    const { title, description, specialty_required, location_type, salary_range, status } = req.body;
    try {
        const [hospital] = await db.query('SELECT id FROM hospitals WHERE user_id = ?', [req.session.userId]);
        const [job] = await db.query('SELECT * FROM jobs WHERE id = ? AND hospital_id = ?', [req.params.id, hospital[0].id]);
        if (job.length === 0) {
            return res.status(404).json({ error: 'Job not found or unauthorized' });
        }
        await db.query(
            'UPDATE jobs SET title = ?, description = ?, specialty_required = ?, location_type = ?, salary_range = ?, status = ? WHERE id = ?',
            [title, description, specialty_required, location_type, salary_range, status, req.params.id]
        );
        res.json({ message: 'Job updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// Hospital delete job
router.delete('/:id', requireAuth, requireRole(['hospital']), async (req, res) => {
    try {
        const [hospital] = await db.query('SELECT id FROM hospitals WHERE user_id = ?', [req.session.userId]);
        const [result] = await db.query('DELETE FROM jobs WHERE id = ? AND hospital_id = ?', [req.params.id, hospital[0].id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Job not found or unauthorized' });
        }
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Deletion failed' });
    }
});

// Get all jobs for the logged-in hospital
router.get('/hospital/my-jobs', requireAuth, requireRole(['hospital']), async (req, res) => {
    try {
        const [hospital] = await db.query('SELECT id FROM hospitals WHERE user_id = ?', [req.session.userId]);
        const [jobs] = await db.query('SELECT * FROM jobs WHERE hospital_id = ? ORDER BY posted_date DESC', [hospital[0].id]);
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
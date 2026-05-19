const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createNotification } = require('./notifications');
const router = express.Router();

// Doctor applies for a job
router.post('/apply', requireAuth, requireRole(['doctor']), async (req, res) => {
    const { job_id } = req.body;
    try {
        const [doctor] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.session.userId]);
        if (!doctor.length) return res.status(404).json({ error: 'Doctor profile not found' });

        const [job] = await db.query('SELECT id, title, hospital_id FROM jobs WHERE id = ? AND status = "open"', [job_id]);
        if (!job.length) return res.status(404).json({ error: 'Job not found or closed' });

        const [existing] = await db.query('SELECT id FROM applications WHERE job_id = ? AND doctor_id = ?', [job_id, doctor[0].id]);
        if (existing.length) return res.status(400).json({ error: 'Already applied' });

        await db.query('INSERT INTO applications (job_id, doctor_id, status) VALUES (?, ?, "applied")', [job_id, doctor[0].id]);

        // Notify hospital
        const [hospital] = await db.query('SELECT user_id FROM hospitals WHERE id = ?', [job[0].hospital_id]);
        if (hospital.length) {
            const [docProfile] = await db.query('SELECT full_name FROM doctors WHERE user_id = ?', [req.session.userId]);
            const doctorName = docProfile[0]?.full_name || 'A doctor';
            await createNotification(hospital[0].user_id, 'New Application', `${doctorName} applied for "${job[0].title}".`);
        }

        res.status(201).json({ message: 'Application submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Application failed' });
    }
});

// Hospital sees all applications
router.get('/hospital/applications', requireAuth, requireRole(['hospital']), async (req, res) => {
    try {
        const [hospital] = await db.query('SELECT id FROM hospitals WHERE user_id = ?', [req.session.userId]);
        if (!hospital.length) return res.status(404).json({ error: 'Hospital profile not found' });

        const [applications] = await db.query(`
            SELECT a.*, j.title as job_title, j.specialty_required,
                   d.id as doctor_id, d.user_id as doctor_user_id, d.full_name, d.specialty, d.experience_years, d.phone, d.cv_path, d.license_path
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE j.hospital_id = ?
            ORDER BY a.applied_date DESC
        `, [hospital[0].id]);

        res.json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Hospital updates application status (sends notification to doctor)
router.put('/:applicationId/status', requireAuth, requireRole(['hospital']), async (req, res) => {
    const { status, reason } = req.body;
    const validStatuses = ['shortlisted', 'rejected', 'hired', 'interview_scheduled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    try {
        const [hospital] = await db.query('SELECT id FROM hospitals WHERE user_id = ?', [req.session.userId]);
        const [application] = await db.query(`
            SELECT a.*, d.user_id as doctor_user_id, j.title
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.id = ? AND j.hospital_id = ?
        `, [req.params.applicationId, hospital[0].id]);

        if (!application.length) return res.status(404).json({ error: 'Application not found' });

        if (status === 'rejected' && !reason) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }

        const query = status === 'rejected'
            ? 'UPDATE applications SET status = ?, rejection_reason = ? WHERE id = ?'
            : 'UPDATE applications SET status = ? WHERE id = ?';
        const params = status === 'rejected'
            ? [status, reason, req.params.applicationId]
            : [status, req.params.applicationId];

        await db.query(query, params);

        // Send notification to doctor
        const statusMessages = {
            'shortlisted': 'Your application has been shortlisted!',
            'rejected': `Your application was rejected. Reason: ${reason || 'Not provided'}`,
            'hired': 'Congratulations! You have been hired.',
            'interview_scheduled': 'An interview has been scheduled for you.'
        };
        await createNotification(
            application[0].doctor_user_id,
            `Application ${status}`,
            `${statusMessages[status]} For job: ${application[0].title}`
        );

        res.json({ message: `Application ${status} successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Update failed' });
    }
});

module.exports = router;
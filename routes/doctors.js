const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadCV, uploadLicense } = require('../middleware/upload');
const uploadPhoto = require('../middleware/uploadPhoto');
const router = express.Router();

// ========== DOWNLOAD ENDPOINT ==========
router.get('/download/:fileType', requireAuth, async (req, res) => {
    const { fileType } = req.params;
    const { doctorId } = req.query;
    if (!doctorId) return res.status(400).json({ error: 'Missing doctorId' });

    try {
        const [users] = await db.query('SELECT role FROM users WHERE id = ?', [req.session.userId]);
        if (users.length === 0) return res.status(401).json({ error: 'User not found' });
        const currentRole = users[0].role;
        if (currentRole !== 'hospital' && currentRole !== 'admin' && req.session.userId !== parseInt(doctorId)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const [doctors] = await db.query(`SELECT ${fileType}_path as path FROM doctors WHERE user_id = ?`, [doctorId]);
        if (!doctors.length || !doctors[0].path) return res.status(404).json({ error: 'File not found' });
        res.download(doctors[0].path);
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========== ALL FOLLOWING ROUTES REQUIRE DOCTOR ROLE ==========
router.use(requireAuth);
router.use(requireRole(['doctor']));

// Get doctor profile
router.get('/profile', async (req, res) => {
    try {
        const [doctors] = await db.query('SELECT * FROM doctors WHERE user_id = ?', [req.session.userId]);
        if (doctors.length === 0) return res.status(404).json({ error: 'Profile not found' });
        res.json(doctors[0]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update doctor profile
router.put('/profile', async (req, res) => {
    const { full_name, specialty, experience_years, location_pref, salary_expectation, bio, phone } = req.body;
    try {
        await db.query(
            'UPDATE doctors SET full_name = ?, specialty = ?, experience_years = ?, location_pref = ?, salary_expectation = ?, bio = ?, phone = ? WHERE user_id = ?',
            [full_name, specialty, experience_years, location_pref, salary_expectation, bio, phone, req.session.userId]
        );
        res.json({ message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// Upload profile photo
router.post('/upload-photo', uploadPhoto.single('photo'), async (req, res) => {
    try {
        const photoPath = req.file.path;
        await db.query('UPDATE doctors SET profile_photo = ? WHERE user_id = ?', [photoPath, req.session.userId]);
        res.json({ message: 'Photo uploaded successfully', path: photoPath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Upload CV
router.post('/upload-cv', uploadCV.single('cv'), async (req, res) => {
    try {
        await db.query('UPDATE doctors SET cv_path = ? WHERE user_id = ?', [req.file.path, req.session.userId]);
        res.json({ message: 'CV uploaded', path: req.file.path });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Upload License
router.post('/upload-license', uploadLicense.single('license'), async (req, res) => {
    try {
        await db.query('UPDATE doctors SET license_path = ? WHERE user_id = ?', [req.file.path, req.session.userId]);
        res.json({ message: 'License uploaded', path: req.file.path });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Get available jobs
router.get('/jobs', async (req, res) => {
    try {
        const [doctor] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.session.userId]);
        const doctorId = doctor[0]?.id || null;
        const [jobs] = await db.query(`
            SELECT j.*, h.hospital_name, h.location as hospital_location, 
                   h.id as hospital_id, h.user_id as hospital_user_id,
                   a.id as application_id, a.status as application_status, a.rejection_reason
            FROM jobs j
            JOIN hospitals h ON j.hospital_id = h.id
            LEFT JOIN applications a ON a.job_id = j.id AND a.doctor_id = ?
            WHERE j.status = 'open'
            ORDER BY j.posted_date DESC
        `, [doctorId]);
        const jobsWithStatus = jobs.map(job => ({
            ...job,
            has_applied: !!job.application_status,
            application_status: job.application_status || null,
            rejection_reason: job.rejection_reason || null,
            application_id: job.application_id || null
        }));
        res.json(jobsWithStatus);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get doctor's applications
router.get('/applications', async (req, res) => {
    try {
        const [applications] = await db.query(`
            SELECT a.*, j.title, j.specialty_required, j.location_type, h.hospital_name,
                   i.scheduled_datetime, i.meeting_link, i.status as interview_status
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            JOIN hospitals h ON j.hospital_id = h.id
            LEFT JOIN interviews i ON a.id = i.application_id
            WHERE a.doctor_id = (SELECT id FROM doctors WHERE user_id = ?)
            ORDER BY a.applied_date DESC
        `, [req.session.userId]);
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get interview details
router.get('/interview/:applicationId', requireAuth, requireRole(['doctor']), async (req, res) => {
    try {
        const { applicationId } = req.params;
        const [interview] = await db.query(`
            SELECT i.*, j.title as job_title, h.hospital_name
            FROM interviews i
            JOIN applications a ON i.application_id = a.id
            JOIN jobs j ON a.job_id = j.id
            JOIN hospitals h ON j.hospital_id = h.id
            WHERE a.id = ? AND a.doctor_id = (SELECT id FROM doctors WHERE user_id = ?)
        `, [applicationId, req.session.userId]);
        if (!interview.length) return res.status(404).json({ error: 'No interview scheduled' });
        res.json(interview[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get all applicants for a job
router.get('/job/:jobId/applicants', requireAuth, requireRole(['doctor']), async (req, res) => {
    try {
        const { jobId } = req.params;
        const currentDoctorUserId = req.session.userId;
        const [applicants] = await db.query(`
            SELECT d.user_id, d.full_name, d.specialty, d.experience_years, d.phone, 
                   a.status, a.applied_date, a.rejection_reason,
                   CASE WHEN d.user_id = ? THEN 1 ELSE 0 END as is_current
            FROM applications a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.job_id = ?
            ORDER BY is_current DESC, a.applied_date DESC
        `, [currentDoctorUserId, jobId]);
        res.json(applicants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
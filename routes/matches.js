const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

function calcMatchScore(doctor, job) {
    let score = 0;
    if (doctor.specialty.toLowerCase() === job.specialty_required.toLowerCase()) score += 40;
    else if (doctor.specialty.toLowerCase().includes(job.specialty_required.toLowerCase())) score += 20;
    if (doctor.location_pref === job.location_type || doctor.location_pref === 'both') score += 30;
    else score += 10;
    if (doctor.experience_years >= 5) score += 30;
    else if (doctor.experience_years >= 3) score += 20;
    else if (doctor.experience_years >= 1) score += 10;
    return score;
}

router.get('/job/:jobId/doctors', requireAuth, requireRole(['hospital']), async (req, res) => {
    try {
        const [jobs] = await db.query('SELECT * FROM jobs WHERE id = ?', [req.params.jobId]);
        if (!jobs.length) return res.status(404).json({ error: 'Job not found' });
        const job = jobs[0];
        const [doctors] = await db.query(
            `SELECT d.*, u.email, u.id as user_id FROM doctors d JOIN users u ON d.user_id = u.id
             WHERE d.specialty = ? OR d.specialty LIKE ?`,
            [job.specialty_required, `%${job.specialty_required}%`]
        );
        const matched = doctors
            .map(doc => ({ ...doc, match_score: calcMatchScore(doc, job) }))
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, 20);
        res.json({ job, matched_doctors: matched });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/doctor/jobs', requireAuth, requireRole(['doctor']), async (req, res) => {
    try {
        const [doctors] = await db.query('SELECT * FROM doctors WHERE user_id = ?', [req.session.userId]);
        if (!doctors.length) return res.status(404).json({ error: 'Doctor profile not found' });
        const doctor = doctors[0];
        const [jobs] = await db.query(
            `SELECT j.*, h.hospital_name, h.location as hospital_location FROM jobs j
             JOIN hospitals h ON j.hospital_id = h.id
             WHERE j.status='open' AND h.verification_status='approved' AND j.is_verified=TRUE AND h.suspended=FALSE`
        );
        const matched = jobs
            .map(job => ({ ...job, match_score: calcMatchScore(doctor, job) }))
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, 20);
        res.json(matched);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

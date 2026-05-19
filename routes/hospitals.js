const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const uploadPhoto = require('../middleware/uploadPhoto');
const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['hospital']));

// Get hospital profile
router.get('/profile', async (req, res) => {
    try {
        const [hospitals] = await db.query('SELECT * FROM hospitals WHERE user_id = ?', [req.session.userId]);
        if (!hospitals.length) return res.status(404).json({ error: 'Profile not found' });
        res.json(hospitals[0]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update hospital profile
router.put('/profile', async (req, res) => {
    const { hospital_name, location, contact_phone, description } = req.body;
    try {
        await db.query(
            'UPDATE hospitals SET hospital_name = ?, location = ?, contact_phone = ?, description = ? WHERE user_id = ?',
            [hospital_name, location, contact_phone, description, req.session.userId]
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
        await db.query('UPDATE hospitals SET profile_photo = ? WHERE user_id = ?', [photoPath, req.session.userId]);
        res.json({ message: 'Photo uploaded successfully', path: photoPath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Search doctors
router.get('/search-doctors', async (req, res) => {
    const { specialty, location_pref, min_experience } = req.query;
    let query = `
        SELECT d.*, u.id as user_id, u.email
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE 1=1
    `;
    const params = [];
    if (specialty) { query += ` AND d.specialty LIKE ?`; params.push(`%${specialty}%`); }
    if (location_pref) { query += ` AND (d.location_pref = ? OR d.location_pref = 'both')`; params.push(location_pref); }
    if (min_experience) { query += ` AND d.experience_years >= ?`; params.push(parseInt(min_experience)); }
    query += ` ORDER BY d.experience_years DESC`;
    try {
        const [doctors] = await db.query(query, params);
        res.json(doctors);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get hospital location by ID
router.get('/location/:hospitalId', requireAuth, async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const [hospital] = await db.query('SELECT id, hospital_name, latitude, longitude FROM hospitals WHERE id = ?', [hospitalId]);
        if (!hospital.length) return res.status(404).json({ error: 'Hospital not found' });
        const lat = hospital[0].latitude !== null ? hospital[0].latitude : -1.9403;
        const lng = hospital[0].longitude !== null ? hospital[0].longitude : 29.8739;
        res.json({ id: hospital[0].id, name: hospital[0].hospital_name, lat: lat, lng: lng });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
const express = require('express');
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
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

// Search doctors (returns user_id for contact)
router.get('/search-doctors', async (req, res) => {
    const { specialty, location_pref, min_experience } = req.query;
    let query = `
        SELECT d.*, u.id as user_id, u.email
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE 1=1
    `;
    const params = [];
    if (specialty) {
        query += ` AND d.specialty LIKE ?`;
        params.push(`%${specialty}%`);
    }
    if (location_pref) {
        query += ` AND (d.location_pref = ? OR d.location_pref = 'both')`;
        params.push(location_pref);
    }
    if (min_experience) {
        query += ` AND d.experience_years >= ?`;
        params.push(parseInt(min_experience));
    }
    query += ` ORDER BY d.experience_years DESC`;
    try {
        const [doctors] = await db.query(query, params);
        res.json(doctors);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get hospital location by ID (accessible by any authenticated user)
router.get('/location/:hospitalId', requireAuth, async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const [hospital] = await db.query(
            'SELECT id, hospital_name, latitude, longitude FROM hospitals WHERE id = ?',
            [hospitalId]
        );
        if (!hospital.length) return res.status(404).json({ error: 'Hospital not found' });
        // Default to Kigali, Rwanda if no coordinates stored
        const lat = hospital[0].latitude !== null ? hospital[0].latitude : -1.9403;
        const lng = hospital[0].longitude !== null ? hospital[0].longitude : 29.8739;
        res.json({
            id: hospital[0].id,
            name: hospital[0].hospital_name,
            lat: lat,
            lng: lng
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
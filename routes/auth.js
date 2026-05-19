const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

// ========== REGISTRATION ==========
router.post('/register', async (req, res) => {
    const { email, password, role, ...profileData } = req.body;
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length) return res.status(400).json({ error: 'Email already registered' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            const [userResult] = await connection.query(
                'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
                [email, hashedPassword, role]
            );
            const userId = userResult.insertId;
            if (role === 'doctor') {
                await connection.query(
                    'INSERT INTO doctors (user_id, full_name, specialty, experience_years, location_pref, salary_expectation, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [userId, profileData.fullName, profileData.specialty, profileData.experienceYears || 0,
                     profileData.locationPref || 'both', profileData.salaryExpectation || null, profileData.phone || null]
                );
            } else if (role === 'hospital') {
                await connection.query(
                    'INSERT INTO hospitals (user_id, hospital_name, location, contact_phone, description) VALUES (?, ?, ?, ?, ?)',
                    [userId, profileData.hospitalName, profileData.location, profileData.contactPhone, profileData.description || null]
                );
            }
            await connection.commit();
            res.status(201).json({ message: 'Registration successful' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const user = users[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        // Admin first‑login enforcement
        if (user.role === 'admin' && (user.must_change_password || password === 'admin123')) {
            req.session.userId = user.id;
            req.session.userRole = user.role;
            req.session.requirePasswordChange = true;
            return res.json({
                message: 'Password change required',
                requireChange: true,
                user: { id: user.id, email: user.email, role: user.role }
            });
        }

        req.session.userId = user.id;
        req.session.userRole = user.role;

        let profile = null;
        if (user.role === 'doctor') {
            const [doctors] = await db.query('SELECT * FROM doctors WHERE user_id = ?', [user.id]);
            profile = doctors[0];
        } else if (user.role === 'hospital') {
            const [hospitals] = await db.query('SELECT * FROM hospitals WHERE user_id = ?', [user.id]);
            profile = hospitals[0];
        }
        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, role: user.role, profile }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ========== CHANGE DEFAULT PASSWORD ==========
router.post('/change-default-password', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing passwords' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    try {
        const [user] = await db.query('SELECT password_hash, role FROM users WHERE id = ?', [req.session.userId]);
        if (!user.length) return res.status(404).json({ error: 'User not found' });
        if (user[0].role !== 'admin') return res.status(403).json({ error: 'Access denied' });
        const valid = await bcrypt.compare(currentPassword, user[0].password_hash);
        if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
        const newHash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?', [newHash, req.session.userId]);
        req.session.destroy();
        res.json({ message: 'Password changed. Please log in again.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== CHANGE USER ROLE (ADMIN ONLY) ==========
router.put('/change-role/:userId', async (req, res) => {
    // Check if the requester is admin (using session)
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    const [adminUser] = await db.query('SELECT role FROM users WHERE id = ?', [req.session.userId]);
    if (!adminUser.length || adminUser[0].role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { newRole } = req.body;
    if (!['doctor', 'hospital'].includes(newRole)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const [user] = await connection.query('SELECT role FROM users WHERE id = ?', [userId]);
        if (!user.length) return res.status(404).json({ error: 'User not found' });
        const oldRole = user[0].role;

        if (oldRole === newRole) {
            return res.status(400).json({ error: 'User already has this role' });
        }

        // If old role is doctor, remove doctor profile and related data
        if (oldRole === 'doctor') {
            // Get doctor internal id
            const [doctor] = await connection.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
            if (doctor.length) {
                // Delete applications
                await connection.query('DELETE FROM applications WHERE doctor_id = ?', [doctor[0].id]);
                // Delete doctor profile
                await connection.query('DELETE FROM doctors WHERE user_id = ?', [userId]);
            }
        }

        // If old role is hospital, remove hospital profile and related data
        if (oldRole === 'hospital') {
            // Get hospital internal id
            const [hospital] = await connection.query('SELECT id FROM hospitals WHERE user_id = ?', [userId]);
            if (hospital.length) {
                // Delete jobs
                await connection.query('DELETE FROM jobs WHERE hospital_id = ?', [hospital[0].id]);
                // Delete hospital profile
                await connection.query('DELETE FROM hospitals WHERE user_id = ?', [userId]);
            }
        }

        // Update user role
        await connection.query('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);

        // Create new profile for the new role
        if (newRole === 'doctor') {
            await connection.query(`
                INSERT INTO doctors (user_id, full_name, specialty, experience_years, location_pref, salary_expectation)
                VALUES (?, 'New Doctor', 'General Practice', 0, 'both', NULL)
            `, [userId]);
        } else if (newRole === 'hospital') {
            await connection.query(`
                INSERT INTO hospitals (user_id, hospital_name, location, contact_phone, description)
                VALUES (?, 'New Hospital', 'Unknown', NULL, NULL)
            `, [userId]);
        }

        // Log the action
        await connection.query(
            'INSERT INTO system_logs (action, details) VALUES (?, ?)',
            ['change_role', `Admin changed user ${userId} from ${oldRole} to ${newRole}`]
        );

        await connection.commit();
        res.json({ message: `User role changed from ${oldRole} to ${newRole}`, newRole });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

// ========== LOGOUT ==========
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// ========== GET CURRENT USER ==========
router.get('/me', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const [users] = await db.query('SELECT id, email, role FROM users WHERE id = ?', [req.session.userId]);
        if (users.length === 0) return res.status(401).json({ error: 'User not found' });
        const user = users[0];
        let profile = null;
        if (user.role === 'doctor') {
            const [doctors] = await db.query('SELECT * FROM doctors WHERE user_id = ?', [user.id]);
            profile = doctors[0];
        } else if (user.role === 'hospital') {
            const [hospitals] = await db.query('SELECT * FROM hospitals WHERE user_id = ?', [user.id]);
            profile = hospitals[0];
        }
        res.json({ user: { ...user, profile } });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
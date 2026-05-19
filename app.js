const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Create upload directories if they don't exist
['uploads', 'uploads/cvs', 'uploads/licenses', 'uploads/photos'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/locales', express.static('public/locales'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'medical_recruitment_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Import routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const hospitalRoutes = require('./routes/hospitals');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const matchRoutes = require('./routes/matches');
const interviewRoutes = require('./routes/interviews');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const adminRoutes = require('./routes/admin');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes.router);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Medical Recruitment running on http://localhost:${PORT}`);
});
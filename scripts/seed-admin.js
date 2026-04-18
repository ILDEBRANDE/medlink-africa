const bcrypt = require('bcrypt');
const db = require('../db');

async function seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@medlink.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2024';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
        if (existing.length === 0) {
            await db.query('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', [adminEmail, hashedPassword, 'admin']);
            console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
        } else {
            console.log(`ℹ️  Admin already exists: ${adminEmail}`);
        }
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
    }
}

module.exports = seedAdmin;

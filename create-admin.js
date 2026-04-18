const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    
    const email = 'admin@medlink.com';
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    
    await connection.execute(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [email, hash, 'admin']
    );
    console.log('Admin user created successfully!');
    await connection.end();
}

createAdmin().catch(console.error);
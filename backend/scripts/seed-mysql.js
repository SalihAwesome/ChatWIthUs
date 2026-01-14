const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

async function seed() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is not defined');
        process.exit(1);
    }

    const url = new URL(connectionString);

    try {
        const connection = await mysql.createConnection({
            host: url.hostname,
            port: url.port || 3306,
            user: url.username,
            password: url.password,
            database: url.pathname.substring(1)
        });

        console.log('🌱 Seeding database with mysql2...');

        const users = [
            { id: 'user-sarah', username: 'sarah', name: 'Sarah Wilson', role: 'SUPPORT', password: 'agent123' },
            { id: 'user-mike', username: 'mike', name: 'Mike Johnson', role: 'SUPPORT', password: 'agent123' },
            { id: 'user-emma', username: 'emma', name: 'Emma Davis', role: 'MENTOR', password: 'mentor123' }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await connection.query(
                'INSERT INTO User (id, username, password, name, role) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, role = ?',
                [user.id, user.username, hashedPassword, user.name, user.role, user.name, user.role]
            );
            console.log(`✅ User ${user.username} created/updated.`);
        }

        console.log('✅ Seeding complete.');
        await connection.end();
    } catch (error) {
        console.error('❌ Seeding error:', error.message);
        process.exit(1);
    }
}

seed();

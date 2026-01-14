const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function setup() {
    const config = {
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: 'root',
        database: 'support_chat'
    };

    try {
        console.log('Connecting to MySQL at 127.0.0.1:3306...');
        const connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password
        });

        console.log('✅ Connected to MySQL server.');

        await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
        console.log(`✅ Database ${config.database} checked/created.`);

        await connection.query(`USE ${config.database}`);

        console.log('Creating tables...');

        await connection.query(`
      CREATE TABLE IF NOT EXISTS User (
        id VARCHAR(191) PRIMARY KEY,
        username VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(191) NOT NULL,
        name VARCHAR(191) NOT NULL,
        role ENUM('GUEST', 'SUPPORT', 'MENTOR') NOT NULL,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      )
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS Request (
        id VARCHAR(191) PRIMARY KEY,
        guestId VARCHAR(191) NOT NULL,
        email VARCHAR(191) NOT NULL,
        issue VARCHAR(191) NOT NULL,
        description TEXT NOT NULL,
        priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
        status ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'PENDING',
        category VARCHAR(191) NOT NULL,
        assignedAgent VARCHAR(191),
        resolvedAt DATETIME(3),
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX (guestId),
        CONSTRAINT fk_guest FOREIGN KEY (guestId) REFERENCES User(id)
      )
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS Message (
        id VARCHAR(191) PRIMARY KEY,
        requestId VARCHAR(191) NOT NULL,
        senderId VARCHAR(191) NOT NULL,
        content TEXT NOT NULL,
        \`read\` BOOLEAN DEFAULT FALSE,
        createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
        INDEX (requestId),
        INDEX (senderId),
        CONSTRAINT fk_request FOREIGN KEY (requestId) REFERENCES Request(id) ON DELETE CASCADE,
        CONSTRAINT fk_sender FOREIGN KEY (senderId) REFERENCES User(id)
      )
    `);

        console.log('✅ Tables created successfully.');
        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ETIMEDOUT') {
            console.log('TIP: Check if MySQL is actually listening on 127.0.0.1:3306');
        }
        process.exit(1);
    }
}

setup();

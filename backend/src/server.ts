import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import requestRoutes from './routes/requests';
import userRoutes from './routes/users';
import { setupSocketHandlers } from './socket';
import sequelize from './config/database';
import { User } from './models';
import bcrypt from 'bcryptjs';

dotenv.config();


// Validate required environment variables
if (!process.env.JWT_SECRET) {
    console.error('❌ Error: JWT_SECRET environment variable is required');
    console.error('   Please create a .env file with JWT_SECRET set');
    console.error('   See .env.example for reference');
    process.exit(1);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
    }
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', database: 'mysql (sequelize)' });
});

setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL connected.');
        await sequelize.sync({ alter: true });
        console.log('✅ Models synced.');

        const userCount = await User.count();
        if (userCount === 0) {
            console.log('🌱 Seeding...');
            const defaultUsers = [
                { id: 'user-sarah', username: 'sarah', name: 'Sarah Wilson', role: 'SUPPORT' as const, password: 'agent123' },
                { id: 'user-mike', username: 'mike', name: 'Mike Johnson', role: 'SUPPORT' as const, password: 'agent123' },
                { id: 'user-emma', username: 'emma', name: 'Emma Davis', role: 'MENTOR' as const, password: 'mentor123' }
            ];
            for (const u of defaultUsers) {
                const hashed = await bcrypt.hash(u.password, 10);
                await User.create({ ...u, password: hashed });
            }
            console.log('✨ Seeded.');
        }

        httpServer.listen(PORT, () => {
            console.log(`🚀 Server on ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

startServer();
export { io };

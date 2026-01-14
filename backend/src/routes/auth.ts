import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
    } catch (error: any) {
        console.error('Login error:', error);
        console.error(error.stack);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/guest', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const user = await User.create({
            username: `guest_${uuidv4().substring(0, 8)}`,
            password: await bcrypt.hash('guest', 10),
            name: name.trim(),
            role: 'GUEST'
        });
        // Reload the user to ensure all fields are properly populated
        await user.reload();
        const userData = user.get({ plain: true });
        const token = jwt.sign({ userId: userData.id, role: userData.role }, process.env.JWT_SECRET!, { expiresIn: '24h' });
        res.json({ token, user: { id: userData.id, username: userData.username, name: userData.name, role: userData.role } });
    } catch (error) {
        console.error('Guest registration error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const user = await User.findByPk(decoded.userId, { attributes: ['id', 'username', 'name', 'role'] });
        if (!user) return res.status(404).json({ error: 'Not found' });
        res.json({ user });
    } catch (error) {
        res.status(401).json({ error: 'Invalid' });
    }
});

export default router;

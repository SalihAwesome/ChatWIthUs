import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/login', async (req, res) => {
    try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b04a0da8-75f4-47c8-8ce5-ebbe5c4634e2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'auth.ts:11', message: 'Login route entry', data: { username: req.body?.username, hasPassword: !!req.body?.password }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
        // #endregion
        const { username, password } = req.body;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b04a0da8-75f4-47c8-8ce5-ebbe5c4634e2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'auth.ts:13', message: 'Looking up user', data: { username }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
        // #endregion
        const user = await User.findOne({ where: { username } });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b04a0da8-75f4-47c8-8ce5-ebbe5c4634e2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'auth.ts:14', message: 'User lookup result', data: { userFound: !!user, userId: user?.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
        // #endregion
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b04a0da8-75f4-47c8-8ce5-ebbe5c4634e2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'auth.ts:17', message: 'Comparing password', data: { hasUserPassword: !!user.password }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
        // #endregion
        const validPassword = await bcrypt.compare(password, user.password);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b04a0da8-75f4-47c8-8ce5-ebbe5c4634e2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'auth.ts:18', message: 'Password comparison result', data: { validPassword }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
        // #endregion
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b04a0da8-75f4-47c8-8ce5-ebbe5c4634e2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'auth.ts:21', message: 'Generating JWT token', data: { userId: user.id, role: user.role, hasJwtSecret: !!process.env.JWT_SECRET }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
        // #endregion
        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' });
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b04a0da8-75f4-47c8-8ce5-ebbe5c4634e2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'auth.ts:22', message: 'Login successful', data: { userId: user.id, username: user.username }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
        // #endregion
        res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
    } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b04a0da8-75f4-47c8-8ce5-ebbe5c4634e2', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'auth.ts:24', message: 'Login route error', data: { error: error?.message || String(error), stack: error?.stack, name: error?.name }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' }) }).catch(() => { });
        // #endregion
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

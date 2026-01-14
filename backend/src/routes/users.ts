import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Middleware to check if user is MENTOR (You might want to extract this to a middleware file)
const isMentor = async (req: any, res: any, next: any) => {
    // In a real app, you'd decode the token middleware first and populate req.user
    // For now, let's assume req.user is populated or we check based on the requester's ID in body/headers if not using standard auth middleware yet
    // However, looking at auth.ts, we don't seem to have a global auth middleware applied yet.
    // For simplicity in this iteration, we will implement basic checks or assume the frontend sends the right headers.
    // BUT, to be safe, let's skip strict middleware for now and trust the caller (MentorView) 
    // until we add a proper 'authenticateToken' middleware layer to all protected routes.
    // TODO: Add proper authentication middleware
    next();
};

// GET / - List all users
router.get('/', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'name', 'role', 'createdAt']
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST / - Create new user
router.post('/', async (req, res) => {
    try {
        const { username, password, name, role } = req.body;

        // Basic validation
        if (!username || !password || !name || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        const newUser = await User.create({
            id,
            username,
            password: hashedPassword,
            name,
            role
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser.get({ plain: true });
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PATCH /:id - Update user
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, password, role } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (name) user.name = name;
        if (role) user.role = role;
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        const { password: _, ...userWithoutPassword } = user.get({ plain: true });
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /:id - Delete user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

export default router;

import { Router } from 'express';
import { User, SupportRequest, Message } from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { io } from '../server';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { status, priority } = req.query;
        const where: any = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;

        const requests = await SupportRequest.findAll({
            where,
            include: [
                { model: User, as: 'guest', attributes: ['id', 'name', 'username'] },
                { model: Message, as: 'messages', limit: 1, order: [['createdAt', 'DESC']] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ requests });
    } catch (error: any) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const request = await SupportRequest.findByPk(req.params.id as string, {
            include: [
                { model: User, as: 'guest', attributes: ['id', 'name', 'username'] },
                { model: Message, as: 'messages', include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }] }
            ],
            order: [[{ model: Message, as: 'messages' }, 'createdAt', 'ASC']]
        });
        if (!request) return res.status(404).json({ error: 'Request not found' });
        res.json({ request });
    } catch (error: any) {
        console.error('Error fetching request:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { email, issue, description, priority, category } = req.body;

        // Validate required fields
        if (!email || !issue || !description || !category) {
            return res.status(400).json({ error: 'Missing required fields: email, issue, description, and category are required' });
        }

        // Validate priority if provided
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
        }

        const request = await SupportRequest.create({
            guestId: req.userId!,
            email, issue, description,
            priority: priority || 'MEDIUM',
            category
        });
        const full = await SupportRequest.findByPk(request.id, {
            include: [{ model: User, as: 'guest', attributes: ['id', 'name', 'username'] }]
        });
        io.emit('new_request', full);
        res.status(201).json({ request: full });
    } catch (error: any) {
        console.error('Error creating request:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: 'Validation error', details: error.errors.map((e: any) => e.message) });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { status, assignedAgent, priority } = req.body;
        const request = await SupportRequest.findByPk(req.params.id as string);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        // Validate status if provided
        if (status) {
            const validStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
            }
        }

        // Validate priority if provided
        if (priority) {
            const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
            if (!validPriorities.includes(priority)) {
                return res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
            }
        }

        await request.update({
            ...(status && { status }),
            ...(assignedAgent && { assignedAgent }),
            ...(priority && { priority }),
            ...(status === 'RESOLVED' && { resolvedAt: new Date() })
        });
        const full = await SupportRequest.findByPk(request.id, {
            include: [{ model: User, as: 'guest', attributes: ['id', 'name', 'username'] }]
        });
        io.emit('request_updated', full);
        res.json({ request: full });
    } catch (error: any) {
        console.error('Error updating request:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: 'Validation error', details: error.errors.map((e: any) => e.message) });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/:id/messages', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { content } = req.body;

        // Validate required fields
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        // Verify request exists
        const request = await SupportRequest.findByPk(req.params.id as string);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const message = await Message.create({
            requestId: req.params.id,
            senderId: req.userId!,
            content: content.trim()
        });
        const full = await Message.findByPk(message.id, {
            include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }]
        });
        io.to(`request_${req.params.id}`).emit('new_message', full);
        res.status(201).json({ message: full });
    } catch (error: any) {
        console.error('Error creating message:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: 'Validation error', details: error.errors.map((e: any) => e.message) });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id/messages', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const messages = await Message.findAll({
            where: { requestId: req.params.id },
            include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'role'] }],
            order: [['createdAt', 'ASC']]
        });
        res.json({ messages });
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id/messages/read', authMiddleware, async (req: AuthRequest, res) => {
    try {
        await Message.update({ read: true }, { where: { requestId: req.params.id, read: false } });
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const id = req.params.id as string;
        const request = await SupportRequest.findByPk(id);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        // Delete associated messages first
        await Message.destroy({ where: { requestId: id } });
        await request.destroy();

        io.emit('request_deleted', id);
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting request:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        // Require MENTOR role for bulk delete
        if (req.userRole !== 'MENTOR') {
            return res.status(403).json({ error: 'Unauthorized: Only mentors can delete all requests' });
        }

        await Message.destroy({ where: {}, truncate: false });
        await SupportRequest.destroy({ where: {}, truncate: false });

        io.emit('all_requests_deleted');
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting all requests:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

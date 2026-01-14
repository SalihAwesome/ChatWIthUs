import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export const setupSocketHandlers = (io: Server) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
            socket.data.userId = decoded.userId;
            socket.data.role = decoded.role;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`✅ User connected: ${socket.data.userId}`);

        socket.on('join_request', (requestId: string) => {
            socket.join(`request_${requestId}`);
        });

        socket.on('leave_request', (requestId: string) => {
            socket.leave(`request_${requestId}`);
        });

        socket.on('typing', ({ requestId, isTyping }) => {
            socket.to(`request_${requestId}`).emit('user_typing', {
                userId: socket.data.userId,
                isTyping
            });
        });

        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.data.userId}`);
        });
    });
};

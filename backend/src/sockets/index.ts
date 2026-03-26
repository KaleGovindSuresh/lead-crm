import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { config } from '../config/env';
import { verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { setSocketIO } from '../services/notification.service.js';

interface SocketWithUser extends Socket {
  userId?: string;
  userRole?: string;
}

export function initSocketIO(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // JWT Authentication middleware for Socket.IO
  io.use((socket: SocketWithUser, next) => {
    try {
      // Token can come from auth.token or query param
      const token =
        (socket.handshake.auth as { token?: string }).token ??
        (socket.handshake.query['token'] as string | undefined);

      if (!token) {
        return next(new Error('Authentication error: no token provided'));
      }

      const payload = verifyToken(token);
      socket.userId = payload.sub;
      socket.userRole = payload.role;
      next();
    } catch {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket: SocketWithUser) => {
    const userId = socket.userId!;
    const room = `user:${userId}`;

    // Join the user's private room
    socket.join(room);
    logger.info(`Socket connected: user=${userId}, socketId=${socket.id}`);

    // Client can request their unread count
    socket.on('get:unread-count', async () => {
      try {
        const { notificationService } = await import('../services/notification.service.js');
        const count = await notificationService.getUnreadCount(userId);
        socket.emit('unread-count', { count });
      } catch (err) {
        logger.error('Error fetching unread count:', err);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: user=${userId}, reason=${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for user=${userId}:`, err);
    });
  });

  // Share the io instance with notification service
  setSocketIO(io);

  logger.info('Socket.IO server initialized');
  return io;
}

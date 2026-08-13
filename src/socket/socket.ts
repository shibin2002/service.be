import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../common/middleware/auth.middleware';
import { logger } from '../config/logger';
import { env } from '../config/env';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization?.replace('Bearer ', '') as string | undefined);

      if (!token) {
        next(new Error('Unauthorized'));
        return;
      }

      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as { sub: string };
    socket.join(`user:${user.sub}`);
    logger.info(`Socket connected: ${user.sub}`);

    socket.on('job:subscribe', (jobId: string) => {
      socket.join(`job:${jobId}`);
    });

    socket.on('job:unsubscribe', (jobId: string) => {
      socket.leave(`job:${jobId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${user.sub}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

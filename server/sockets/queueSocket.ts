import { Server, Socket } from 'socket.io';
import { db } from '../db/store.js';

let ioInstance: Server | null = null;

export function initSockets(io: Server) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    // Join user specific room for real-time notifications
    socket.on('join:user', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    // Join doctor queue room for live updates
    socket.on('join:queue', (queueId: string) => {
      if (queueId) {
        socket.join(`queue:${queueId}`);
      }
    });

    socket.on('leave:queue', (queueId: string) => {
      if (queueId) {
        socket.leave(`queue:${queueId}`);
      }
    });

    socket.on('disconnect', () => {
      // socket disconnected
    });
  });
}

export function broadcastQueueUpdate(queueId: string, payload: any) {
  if (ioInstance) {
    ioInstance.to(`queue:${queueId}`).emit('queue:updated', payload);
    // Also broadcast globally or to doctor room
    ioInstance.emit('queue:live_change', { queueId, ...payload });
  }
}

export function sendUserNotification(userId: string, notification: any) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit('notification:new', notification);
  }
}

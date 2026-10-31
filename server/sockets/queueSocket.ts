import { Server, Socket } from 'socket.io';

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

    // Join doctor-specific room
    socket.on('join:doctor', (doctorId: string) => {
      if (doctorId) {
        socket.join(`doctor:${doctorId}`);
      }
    });

    socket.on('leave:doctor', (doctorId: string) => {
      if (doctorId) {
        socket.leave(`doctor:${doctorId}`);
      }
    });

    socket.on('disconnect', () => {
      // socket disconnected
    });
  });
}

export function broadcastQueueUpdate(queueId: string, doctorId: string | undefined, payload: any) {
  if (ioInstance) {
    const enrichedPayload = { queueId, doctorId, ...payload, timestamp: new Date().toISOString() };

    if (queueId) {
      ioInstance.to(`queue:${queueId}`).emit('queue:updated', enrichedPayload);
    }
    if (doctorId) {
      ioInstance.to(`doctor:${doctorId}`).emit('queue:updated', enrichedPayload);
    }
    // Also broadcast globally so all dashboards and monitoring displays update instantly
    ioInstance.emit('queue:live_change', enrichedPayload);
    ioInstance.emit('queue:updated', enrichedPayload);
  }
}

export function sendUserNotification(userId: string, notification: any) {
  if (ioInstance && userId) {
    ioInstance.to(`user:${userId}`).emit('notification:new', notification);
  }
}


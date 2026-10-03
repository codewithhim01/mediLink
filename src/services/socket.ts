import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(typeof window !== 'undefined' ? window.location.origin : '', {
      autoConnect: true,
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 3,
      timeout: 4000,
    });

    socketInstance.on('connect_error', () => {
      // Gracefully ignore WebSocket/polling connection errors in preview iframes
    });
  }
  return socketInstance;
}

export function joinUserRoom(userId: string) {
  const socket = getSocket();
  socket.emit('join:user', userId);
}

export function joinQueueRoom(queueId: string) {
  const socket = getSocket();
  socket.emit('join:queue', queueId);
}

export function leaveQueueRoom(queueId: string) {
  const socket = getSocket();
  socket.emit('leave:queue', queueId);
}

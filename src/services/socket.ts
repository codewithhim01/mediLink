import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
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

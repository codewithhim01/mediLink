import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;
const activeRooms = new Set<string>();

export function getSocket(): Socket {
  if (!socketInstance) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    socketInstance = io(origin, {
      autoConnect: true,
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      // Re-join all active rooms on reconnect
      activeRooms.forEach(room => {
        if (room.startsWith('user:')) {
          socketInstance?.emit('join:user', room.replace('user:', ''));
        } else if (room.startsWith('queue:')) {
          socketInstance?.emit('join:queue', room.replace('queue:', ''));
        } else if (room.startsWith('doctor:')) {
          socketInstance?.emit('join:doctor', room.replace('doctor:', ''));
        }
      });
    });

    socketInstance.on('connect_error', () => {
      // Gracefully handle reconnection in iframe sandbox
    });
  }
  return socketInstance;
}

export function joinUserRoom(userId: string) {
  if (!userId) return;
  activeRooms.add(`user:${userId}`);
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('join:user', userId);
  }
}

export function joinQueueRoom(queueId: string) {
  if (!queueId) return;
  activeRooms.add(`queue:${queueId}`);
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('join:queue', queueId);
  }
}

export function leaveQueueRoom(queueId: string) {
  if (!queueId) return;
  activeRooms.delete(`queue:${queueId}`);
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('leave:queue', queueId);
  }
}

export function joinDoctorRoom(doctorId: string) {
  if (!doctorId) return;
  activeRooms.add(`doctor:${doctorId}`);
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('join:doctor', doctorId);
  }
}

export function leaveDoctorRoom(doctorId: string) {
  if (!doctorId) return;
  activeRooms.delete(`doctor:${doctorId}`);
  const socket = getSocket();
  if (socket.connected) {
    socket.emit('leave:doctor', doctorId);
  }
}

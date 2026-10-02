import { db } from '../db/store.js';
import { Notification, NotificationType } from '../types/index.js';
import { sendUserNotification } from '../sockets/queueSocket.js';

export function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  link?: string
): Notification {
  const notif: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    title,
    message,
    type,
    link,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  db.addNotification(notif);
  sendUserNotification(userId, notif);
  return notif;
}

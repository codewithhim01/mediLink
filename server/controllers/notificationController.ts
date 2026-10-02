import { Response } from 'express';
import { db } from '../db/store.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const notifications = db.findNotificationsByUserId(req.user.userId);
    return res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve notifications: ' + error.message });
  }
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const notif = db.markNotificationAsRead(id, req.user.userId);
    if (!notif) {
      return res.status(404).json({ success: false, error: 'Notification not found.' });
    }

    return res.json({ success: true, message: 'Notification marked as read', data: notif });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update notification: ' + error.message });
  }
}

export async function markAllNotificationsRead(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    db.markAllNotificationsAsRead(req.user.userId);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to update notifications: ' + error.message });
  }
}

import { Router } from 'express';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const notificationRouter = Router();

notificationRouter.get('/', authenticate, getNotifications);
notificationRouter.put('/:id/read', authenticate, markNotificationRead);
notificationRouter.put('/read-all', authenticate, markAllNotificationsRead);

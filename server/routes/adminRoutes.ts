import { Router } from 'express';
import {
  getAdminStats,
  getVerifications,
  updateVerificationStatus,
  getUsers,
  updateUserStatus,
  getAuditLogs,
  resetDemoData
} from '../controllers/adminController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

export const adminRouter = Router();

adminRouter.use(authenticate, authorizeRoles('ADMIN'));

adminRouter.get('/stats', getAdminStats);
adminRouter.get('/verifications', getVerifications);
adminRouter.put('/verifications/:entityType/:id', updateVerificationStatus);
adminRouter.get('/users', getUsers);
adminRouter.put('/users/:id/status', updateUserStatus);
adminRouter.get('/audit-logs', getAuditLogs);
adminRouter.post('/reset-demo', resetDemoData);

import { Router } from 'express';
import {
  getAdminStats,
  getVerifications,
  updateVerificationStatus,
  getUsers,
  updateUserStatus,
  deleteUserByAdmin,
  updateAdminProfile,
  createAdminAccount,
  appointCoAdmin,
  removeCoAdmin,
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
adminRouter.delete('/users/:id', deleteUserByAdmin);
adminRouter.put('/profile', updateAdminProfile);
adminRouter.post('/create-admin', createAdminAccount);
adminRouter.post('/appoint-co-admin', appointCoAdmin);
adminRouter.post('/remove-co-admin', removeCoAdmin);
adminRouter.get('/audit-logs', getAuditLogs);
adminRouter.post('/reset-demo', resetDemoData);

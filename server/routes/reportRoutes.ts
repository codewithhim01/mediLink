import { Router } from 'express';
import { getReports, getReportById, uploadLabReport, toggleShareReport } from '../controllers/reportController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

export const reportRouter = Router();

reportRouter.get('/', authenticate, getReports);
reportRouter.get('/:id', authenticate, getReportById);
reportRouter.post('/', authenticate, authorizeRoles('LABORATORY'), uploadLabReport);
reportRouter.put('/:id/share', authenticate, authorizeRoles('PATIENT'), toggleShareReport);

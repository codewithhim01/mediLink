import { Router } from 'express';
import { analyzeReport } from '../controllers/aiReportController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const aiReportRouter = Router();

aiReportRouter.post('/analyze-report', authenticate, analyzeReport);

import { Router } from 'express';
import { getReferrals, createReferral } from '../controllers/referralController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const referralRouter = Router();

referralRouter.get('/', authenticate, getReferrals);
referralRouter.post('/', authenticate, createReferral);

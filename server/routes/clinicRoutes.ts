import { Router } from 'express';
import { getClinics, getClinicById, updateClinicProfile } from '../controllers/clinicController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

export const clinicRouter = Router();

clinicRouter.get('/', getClinics);
clinicRouter.get('/:id', getClinicById);
clinicRouter.put('/profile', authenticate, authorizeRoles('CLINIC'), updateClinicProfile);

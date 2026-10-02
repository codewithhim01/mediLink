import { Router } from 'express';
import { getDoctors, getDoctorById, updateDoctorProfile } from '../controllers/doctorController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

export const doctorRouter = Router();

doctorRouter.get('/', getDoctors);
doctorRouter.get('/:id', getDoctorById);
doctorRouter.put('/profile', authenticate, authorizeRoles('DOCTOR'), updateDoctorProfile);

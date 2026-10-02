import { Router } from 'express';
import { getAppointments, createAppointment, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const appointmentRouter = Router();

appointmentRouter.get('/', authenticate, getAppointments);
appointmentRouter.post('/', authenticate, createAppointment);
appointmentRouter.put('/:id/status', authenticate, updateAppointmentStatus);

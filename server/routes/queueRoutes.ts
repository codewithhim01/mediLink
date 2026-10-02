import { Router } from 'express';
import { getDoctorQueue, callNextPatient, updateQueueDelay } from '../controllers/queueController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

export const queueRouter = Router();

queueRouter.get('/doctor/:doctorId', getDoctorQueue);
queueRouter.put('/:queueId/call-next', authenticate, authorizeRoles('DOCTOR', 'CLINIC'), callNextPatient);
queueRouter.put('/:queueId/delay', authenticate, authorizeRoles('DOCTOR', 'CLINIC'), updateQueueDelay);

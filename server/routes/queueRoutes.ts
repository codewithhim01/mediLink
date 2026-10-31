import { Router } from 'express';
import {
  getDoctorQueue,
  callNextPatient,
  callSpecificTicket,
  completeCurrentConsultation,
  skipTicket,
  requeueTicket,
  addWalkInPatient,
  checkInAppointment,
  resetOrSeedDemoQueue,
  updateQueueDelay,
} from '../controllers/queueController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

export const queueRouter = Router();

// Public / Patient accessible queue inspection & check-in
queueRouter.get('/doctor/:doctorId', getDoctorQueue);
queueRouter.post('/check-in', authenticate, checkInAppointment);

// Doctor & Clinic queue controls
queueRouter.put('/:queueId/call-next', authenticate, authorizeRoles('DOCTOR', 'CLINIC'), callNextPatient);
queueRouter.put('/:queueId/call-ticket/:ticketId', authenticate, authorizeRoles('DOCTOR', 'CLINIC'), callSpecificTicket);
queueRouter.put('/:queueId/complete', authenticate, authorizeRoles('DOCTOR', 'CLINIC'), completeCurrentConsultation);
queueRouter.put('/:queueId/skip/:ticketId', authenticate, authorizeRoles('DOCTOR', 'CLINIC'), skipTicket);
queueRouter.put('/:queueId/requeue/:ticketId', authenticate, authorizeRoles('DOCTOR', 'CLINIC'), requeueTicket);
queueRouter.post('/:queueId/walk-in', authenticate, authorizeRoles('DOCTOR', 'CLINIC'), addWalkInPatient);
queueRouter.post('/:queueId/seed-demo', authenticate, authorizeRoles('DOCTOR', 'CLINIC'), resetOrSeedDemoQueue);
queueRouter.put('/:queueId/delay', authenticate, authorizeRoles('DOCTOR', 'CLINIC'), updateQueueDelay);

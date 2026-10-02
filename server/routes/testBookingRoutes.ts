import { Router } from 'express';
import { getTestBookings, createTestBooking, updateTestBookingStatus } from '../controllers/testBookingController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const testBookingRouter = Router();

testBookingRouter.get('/', authenticate, getTestBookings);
testBookingRouter.post('/', authenticate, createTestBooking);
testBookingRouter.put('/:id/status', authenticate, updateTestBookingStatus);

import { Router } from 'express';
import { getReviews, createReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const reviewRouter = Router();

reviewRouter.get('/:targetType/:targetId', getReviews);
reviewRouter.post('/', authenticate, createReview);

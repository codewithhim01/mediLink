import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getCurrentUser);
authRouter.post('/logout', (req, res) => res.json({ success: true, message: 'Logged out' }));

import { Router } from 'express';
import { register, login, getCurrentUser, deleteOwnAccount } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getCurrentUser);
authRouter.delete('/me', authenticate, deleteOwnAccount);
authRouter.delete('/account', authenticate, deleteOwnAccount);
authRouter.post('/logout', (req, res) => res.json({ success: true, message: 'Logged out' }));

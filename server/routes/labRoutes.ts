import { Router } from 'express';
import {
  getLaboratories,
  getLaboratoryById,
  getDiagnosticTests,
  createDiagnosticTest,
  updateDiagnosticTest,
  deleteDiagnosticTest
} from '../controllers/labController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

export const labRouter = Router();

labRouter.get('/laboratories', getLaboratories);
labRouter.get('/laboratories/:id', getLaboratoryById);
labRouter.get('/diagnostic-tests', getDiagnosticTests);
labRouter.post('/diagnostic-tests', authenticate, authorizeRoles('LABORATORY'), createDiagnosticTest);
labRouter.put('/diagnostic-tests/:id', authenticate, authorizeRoles('LABORATORY'), updateDiagnosticTest);
labRouter.delete('/diagnostic-tests/:id', authenticate, authorizeRoles('LABORATORY'), deleteDiagnosticTest);

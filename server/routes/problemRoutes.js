import express from 'express';
import {
  createProblem,
  getProblemById,
  getProblems,
} from '../controllers/problemController.js';
import { optionalAuth, requireRole, verifyToken } from '../middleware/auth.js';
import { validateProblem } from '../middleware/validate.js';

const router = express.Router();

router.get('/', optionalAuth, getProblems);
router.get('/:id', optionalAuth, getProblemById);
router.post('/', verifyToken, requireRole('instructor'), validateProblem, createProblem);

export default router;

import express from 'express';
import {
  getMyHistory,
  getProblemSubmissions,
  runCode,
  submitCode,
} from '../controllers/submissionController.js';
import { requireRole, verifyToken } from '../middleware/auth.js';
import { validateSubmission } from '../middleware/validate.js';

const router = express.Router();

router.use(verifyToken);

router.post('/run', validateSubmission, runCode);
router.post('/submit', validateSubmission, submitCode);
router.get('/my-history', getMyHistory);
router.get('/problem/:problemId', requireRole('instructor'), getProblemSubmissions);

export default router;

import express from 'express';
import {
  getPublicStats,
  getRecruiterStats,
  getSeekerStats,
} from '../controllers/statsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/public', getPublicStats);
router.get('/recruiter', authenticateToken, requireRole(['recruiter']), getRecruiterStats);
router.get('/seeker', authenticateToken, requireRole(['job_seeker']), getSeekerStats);

export default router;

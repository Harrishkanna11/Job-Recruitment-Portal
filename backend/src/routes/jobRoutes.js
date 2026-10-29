import express from 'express';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  reportJob,
} from '../controllers/jobController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public job endpoints
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected recruiter & admin endpoints
router.post('/', authenticateToken, requireRole(['recruiter', 'admin']), createJob);
router.put('/:id', authenticateToken, requireRole(['recruiter', 'admin']), updateJob);
router.delete('/:id', authenticateToken, requireRole(['recruiter', 'admin']), deleteJob);

// Candidate reporting a job
router.post('/:id/report', authenticateToken, requireRole(['job_seeker']), reportJob);

export default router;

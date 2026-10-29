import express from 'express';
import {
  applyForJob,
  getMyApplications,
  getJobApplicants,
  getAllRecruiterApplicants,
  updateApplicationStatus,
  scheduleInterview,
  withdrawApplication,
} from '../controllers/applicationController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { uploadResume } from '../middleware/upload.js';

const router = express.Router();

// Job Seeker routes
router.post('/jobs/:jobId/apply', authenticateToken, requireRole(['job_seeker']), uploadResume.single('resume'), applyForJob);
router.get('/my', authenticateToken, requireRole(['job_seeker']), getMyApplications);
router.delete('/:id', authenticateToken, requireRole(['job_seeker', 'admin']), withdrawApplication);

// Recruiter routes
router.get('/recruiter/all', authenticateToken, requireRole(['recruiter', 'admin']), getAllRecruiterApplicants);
router.get('/jobs/:jobId/applicants', authenticateToken, requireRole(['recruiter', 'admin']), getJobApplicants);
router.patch('/:id/status', authenticateToken, requireRole(['recruiter', 'admin']), updateApplicationStatus);
router.post('/:id/interview', authenticateToken, requireRole(['recruiter', 'admin']), scheduleInterview);

export default router;

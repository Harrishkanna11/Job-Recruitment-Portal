import express from 'express';
import {
  getMyProfile,
  updateSeekerProfile,
  uploadResumeToProfile,
  updateRecruiterProfile,
  saveJob,
  removeSavedJob,
  getSavedJobs,
} from '../controllers/profileController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { uploadResume } from '../middleware/upload.js';

const router = express.Router();

router.get('/me', authenticateToken, getMyProfile);

// Seeker profile routes
router.put('/seeker', authenticateToken, requireRole(['job_seeker']), updateSeekerProfile);
router.post('/seeker/resume', authenticateToken, requireRole(['job_seeker']), uploadResume.single('resume'), uploadResumeToProfile);

// Recruiter profile routes
router.put('/recruiter', authenticateToken, requireRole(['recruiter']), updateRecruiterProfile);

// Saved jobs
router.get('/saved-jobs', authenticateToken, requireRole(['job_seeker']), getSavedJobs);
router.post('/saved-jobs/:jobId', authenticateToken, requireRole(['job_seeker']), saveJob);
router.delete('/saved-jobs/:jobId', authenticateToken, requireRole(['job_seeker']), removeSavedJob);

export default router;

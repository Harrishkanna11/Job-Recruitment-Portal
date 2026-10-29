import express from 'express';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.js';
import dbService from '../services/dbService.js';

const router = express.Router();

/**
 * Securely stream/download resumes with authorization check
 */
router.get('/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;

    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(filename);
    const resumePath = path.resolve('uploads/resumes', safeName);

    // Verify file exists
    if (!fs.existsSync(resumePath)) {
      // Also check demo seed resumes or fallback
      const demoPath = path.resolve('src/database/demo_resumes', safeName);
      if (fs.existsSync(demoPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
        return fs.createReadStream(demoPath).pipe(res);
      }
      return res.status(404).json({ success: false, message: 'Resume file not found.' });
    }

    // Role check:
    // Admin can access all
    if (req.user.role === 'admin') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      return fs.createReadStream(resumePath).pipe(res);
    }

    // Job Seeker: can access if it belongs to their profile or applications
    if (req.user.role === 'job_seeker') {
      const profile = await dbService.getSeekerProfile(req.user.id);
      const isProfileResume = profile?.resume_path?.includes(safeName);

      const apps = await dbService.getApplicationsBySeeker(req.user.id);
      const isAppResume = apps.some((a) => a.resume_path?.includes(safeName));

      if (isProfileResume || isAppResume) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
        return fs.createReadStream(resumePath).pipe(res);
      }
    }

    // Recruiter: can access if candidate applied to any job owned by recruiter
    if (req.user.role === 'recruiter') {
      const applicants = await dbService.getAllApplicantsForRecruiter(req.user.id);
      const isApplicantResume = applicants.some(
        (a) => a.resume_path?.includes(safeName) || a.profile_resume_path?.includes(safeName)
      );

      if (isApplicantResume) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
        return fs.createReadStream(resumePath).pipe(res);
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You are not authorized to view this document.',
    });
  } catch (err) {
    console.error('Resume access error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving resume document.' });
  }
});

export default router;

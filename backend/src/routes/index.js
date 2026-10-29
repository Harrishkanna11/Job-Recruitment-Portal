import express from 'express';
import authRoutes from './authRoutes.js';
import jobRoutes from './jobRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import profileRoutes from './profileRoutes.js';
import companyRoutes from './companyRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import adminRoutes from './adminRoutes.js';
import statsRoutes from './statsRoutes.js';
import resumeRoutes from './resumeRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);
router.use('/profile', profileRoutes);
router.use('/companies', companyRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/stats', statsRoutes);
router.use('/resumes', resumeRoutes);

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HireHub API Server',
    version: '1.0.0',
  });
});

export default router;

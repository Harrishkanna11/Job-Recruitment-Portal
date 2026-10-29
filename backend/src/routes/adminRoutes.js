import express from 'express';
import {
  getAdminDashboardStats,
  listAllUsers,
  updateUserAccountStatus,
  listJobReports,
  updateReportStatus,
  listAuditLogs,
} from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken, requireRole(['admin']));

router.get('/stats', getAdminDashboardStats);
router.get('/users', listAllUsers);
router.patch('/users/:id/status', updateUserAccountStatus);
router.get('/reports', listJobReports);
router.patch('/reports/:id/status', updateReportStatus);
router.get('/audit-logs', listAuditLogs);

export default router;

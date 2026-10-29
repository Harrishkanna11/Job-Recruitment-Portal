import express from 'express';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getMyNotifications);
router.patch('/:id/read', authenticateToken, markNotificationAsRead);
router.patch('/read-all', authenticateToken, markAllNotificationsAsRead);

export default router;

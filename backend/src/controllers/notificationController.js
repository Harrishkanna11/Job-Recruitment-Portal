import dbService from '../services/dbService.js';

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await dbService.getNotificationsByUser(req.user.id);
    return res.json({
      success: true,
      notifications,
    });
  } catch (err) {
    console.error('getMyNotifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await dbService.markNotificationAsRead(id, req.user.id);
    return res.json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (err) {
    console.error('markNotificationAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await dbService.markAllNotificationsAsRead(req.user.id);
    return res.json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (err) {
    console.error('markAllNotificationsAsRead error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
};

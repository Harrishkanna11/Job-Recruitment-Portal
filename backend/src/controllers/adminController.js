import dbService from '../services/dbService.js';

export const getAdminDashboardStats = async (req, res) => {
  try {
    const stats = await dbService.getAdminStats();
    return res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('getAdminDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve administrative statistics.' });
  }
};

export const listAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const users = await dbService.listUsers({ search, role, status, limit: parseInt(limit, 10), offset });

    return res.json({
      success: true,
      users,
    });
  } catch (err) {
    console.error('listAllUsers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list users.' });
  }
};

export const updateUserAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid account status.' });
    }

    const updatedUser = await dbService.updateUserStatus(id, status);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await dbService.createAuditLog({
      adminId: req.user.id,
      action: 'UPDATE_USER_STATUS',
      targetType: 'USER',
      targetId: id,
      details: `User status changed to ${status}`,
    });

    return res.json({
      success: true,
      message: `User status changed to ${status}.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        account_status: updatedUser.account_status,
      },
    });
  } catch (err) {
    console.error('updateUserAccountStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

export const listJobReports = async (req, res) => {
  try {
    const reports = await dbService.listReports();
    return res.json({
      success: true,
      reports,
    });
  } catch (err) {
    console.error('listJobReports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reports.' });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'dismissed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid report status.' });
    }

    await dbService.updateReportStatus(id, status);

    await dbService.createAuditLog({
      adminId: req.user.id,
      action: 'UPDATE_REPORT_STATUS',
      targetType: 'REPORT',
      targetId: id,
      details: `Report #${id} status changed to ${status}`,
    });

    return res.json({
      success: true,
      message: `Report status updated to ${status}.`,
    });
  } catch (err) {
    console.error('updateReportStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update report status.' });
  }
};

export const listAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const logs = await dbService.listAuditLogs(limit);
    return res.json({
      success: true,
      logs,
    });
  } catch (err) {
    console.error('listAuditLogs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
};

import dbService from '../services/dbService.js';

export const getPublicStats = async (req, res) => {
  try {
    const stats = await dbService.getPlatformStats();
    return res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('getPublicStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve platform statistics.' });
  }
};

export const getRecruiterStats = async (req, res) => {
  try {
    const stats = await dbService.getRecruiterStats(req.user.id);
    return res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('getRecruiterStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve recruiter statistics.' });
  }
};

export const getSeekerStats = async (req, res) => {
  try {
    const stats = await dbService.getSeekerStats(req.user.id);
    return res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('getSeekerStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve seeker statistics.' });
  }
};

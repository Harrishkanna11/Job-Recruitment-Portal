import { verifyToken } from '../utils/jwt.js';
import dbService from '../services/dbService.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication token required.' });
    }

    const decoded = verifyToken(token);
    const user = await dbService.findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }

    if (user.account_status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      account_status: user.account_status,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed. Invalid or expired token.' });
  }
};

export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. This action requires one of the following roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
};

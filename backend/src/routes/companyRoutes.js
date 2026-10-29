import express from 'express';
import {
  listCompanies,
  getCompanyById,
  updateCompany,
  verifyCompany,
} from '../controllers/companyController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', listCompanies);
router.get('/:id', getCompanyById);
router.put('/:id', authenticateToken, requireRole(['recruiter', 'admin']), updateCompany);
router.patch('/:id/verify', authenticateToken, requireRole(['admin']), verifyCompany);

export default router;

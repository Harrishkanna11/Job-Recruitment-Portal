import dbService from '../services/dbService.js';

/**
 * List verified/all companies
 */
export const listCompanies = async (req, res) => {
  try {
    const companies = await dbService.listCompanies();
    return res.json({
      success: true,
      companies,
    });
  } catch (err) {
    console.error('listCompanies error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve companies.' });
  }
};

/**
 * Get company by ID
 */
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await dbService.getCompanyById(id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    return res.json({
      success: true,
      company,
    });
  } catch (err) {
    console.error('getCompanyById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve company details.' });
  }
};

/**
 * Recruiter: Update company profile
 */
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterProfile = await dbService.getRecruiterProfile(req.user.id);

    // If not admin, recruiter must be linked to this company
    if (req.user.role !== 'admin') {
      if (!recruiterProfile || recruiterProfile.company_id !== Number(id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your associated company profile.',
        });
      }
    }

    const { name, description, industry, website, logo_url, location, size } = req.body;

    const updated = await dbService.upsertCompany({
      id,
      name,
      description,
      industry,
      website,
      logo_url,
      location,
      size,
    });

    return res.json({
      success: true,
      message: 'Company profile updated successfully.',
      company: updated,
    });
  } catch (err) {
    console.error('updateCompany error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update company profile.' });
  }
};

/**
 * Admin: Verify company
 */
export const verifyCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const company = await dbService.verifyCompany(id, isVerified);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    await dbService.createAuditLog({
      adminId: req.user.id,
      action: isVerified ? 'VERIFY_COMPANY' : 'UNVERIFY_COMPANY',
      targetType: 'COMPANY',
      targetId: id,
      details: `Company "${company.name}" verification status set to ${isVerified}`,
    });

    return res.json({
      success: true,
      message: `Company ${isVerified ? 'verified' : 'unverified'} successfully.`,
      company,
    });
  } catch (err) {
    console.error('verifyCompany error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update company verification status.' });
  }
};

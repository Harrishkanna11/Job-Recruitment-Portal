import dbService from '../services/dbService.js';

export const getJobs = async (req, res) => {
  try {
    const {
      search,
      title,
      company,
      skills,
      location,
      jobType,
      experienceLevel,
      minSalary,
      maxSalary,
      isRemote,
      category,
      status = 'published',
      recruiterId,
      sortBy = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;

    const { jobs, total } = await dbService.listJobs({
      search,
      title,
      company,
      skills,
      location,
      jobType,
      experienceLevel,
      minSalary,
      maxSalary,
      isRemote,
      category,
      status,
      recruiterId,
      sortBy,
      limit: parsedLimit,
      offset,
    });

    const totalPages = Math.ceil(total / parsedLimit);

    return res.json({
      success: true,
      jobs,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    console.error('getJobs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve job listings.' });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await dbService.getJobById(id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    // Increment view count asynchronously
    dbService.incrementJobViews(id).catch((err) => console.error('View increment error:', err));

    return res.json({
      success: true,
      job,
    });
  } catch (err) {
    console.error('getJobById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve job details.' });
  }
};

export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      skills,
      salary_min,
      salary_max,
      salary_currency,
      location,
      job_type,
      experience_level,
      is_remote,
      category,
      deadline,
    } = req.body;

    if (!title || !description || !location) {
      return res.status(400).json({ success: false, message: 'Title, description, and location are required.' });
    }

    // Find recruiter profile to get associated company
    const recruiterProfile = await dbService.getRecruiterProfile(req.user.id);
    const companyId = recruiterProfile ? recruiterProfile.company_id : null;

    const newJob = await dbService.createJob({
      recruiter_id: req.user.id,
      company_id: companyId,
      title,
      description,
      requirements,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map((s) => s.trim()) : []),
      salary_min: salary_min ? Number(salary_min) : 0,
      salary_max: salary_max ? Number(salary_max) : 0,
      salary_currency: salary_currency || 'USD',
      location,
      job_type: job_type || 'full-time',
      experience_level: experience_level || 'mid',
      is_remote: Boolean(is_remote),
      category: category || 'Software Development',
      status: 'published',
      deadline: deadline || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Job vacancy posted successfully.',
      job: newJob,
    });
  } catch (err) {
    console.error('createJob error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create job posting.' });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbService.getJobById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    // Role check: Only the recruiter who created it or an admin can update
    if (req.user.role !== 'admin' && existing.recruiter_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to edit this job posting.' });
    }

    const updated = await dbService.updateJob(id, req.body);

    return res.json({
      success: true,
      message: 'Job posting updated successfully.',
      job: updated,
    });
  } catch (err) {
    console.error('updateJob error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update job posting.' });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await dbService.getJobById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    // Role check
    if (req.user.role !== 'admin' && existing.recruiter_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this job posting.' });
    }

    await dbService.deleteJob(id);

    // Audit log if admin deleted
    if (req.user.role === 'admin') {
      await dbService.createAuditLog({
        adminId: req.user.id,
        action: 'DELETE_JOB',
        targetType: 'JOB',
        targetId: id,
        details: `Admin deleted job #${id} (${existing.title})`,
      });
    }

    return res.json({
      success: true,
      message: 'Job posting deleted successfully.',
    });
  } catch (err) {
    console.error('deleteJob error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete job posting.' });
  }
};

export const reportJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, details } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Please specify a reason for reporting.' });
    }

    const job = await dbService.getJobById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const report = await dbService.createReport({
      reporterId: req.user.id,
      jobId: id,
      reason,
      details,
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for your report. Our compliance team will review it shortly.',
      report,
    });
  } catch (err) {
    console.error('reportJob error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
};

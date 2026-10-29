import dbService from '../services/dbService.js';

/**
 * Get current user's profile
 */
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let profile = null;

    if (req.user.role === 'job_seeker') {
      profile = await dbService.getSeekerProfile(userId);
    } else if (req.user.role === 'recruiter') {
      profile = await dbService.getRecruiterProfile(userId);
    }

    return res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        account_status: req.user.account_status,
      },
      profile,
    });
  } catch (err) {
    console.error('getMyProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

/**
 * Update Job Seeker Profile
 */
export const updateSeekerProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name,
      headline,
      phone,
      location,
      bio,
      skills,
      experience,
      education,
      portfolio_url,
      github_url,
      linkedin_url,
    } = req.body;

    const parsedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === 'string' && skills.trim()
      ? skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const updated = await dbService.upsertSeekerProfile(userId, {
      full_name,
      headline,
      phone,
      location,
      bio,
      skills: parsedSkills,
      experience: Array.isArray(experience) ? experience : [],
      education: Array.isArray(education) ? education : [],
      portfolio_url,
      github_url,
      linkedin_url,
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: updated,
    });
  } catch (err) {
    console.error('updateSeekerProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

/**
 * Upload resume to Job Seeker Profile
 */
export const uploadResumeToProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a valid PDF resume file to upload.' });
    }

    const resumePath = `resumes/${req.file.filename}`;
    const resumeOriginalName = req.file.originalname;

    const updated = await dbService.upsertSeekerProfile(userId, {
      resume_path: resumePath,
      resume_original_name: resumeOriginalName,
    });

    return res.json({
      success: true,
      message: 'Resume uploaded successfully!',
      profile: updated,
    });
  } catch (err) {
    console.error('uploadResumeToProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload resume.' });
  }
};

/**
 * Update Recruiter Profile
 */
export const updateRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, title, company_id } = req.body;

    const updated = await dbService.upsertRecruiterProfile(userId, {
      full_name,
      phone,
      title,
      company_id,
    });

    const fullProfile = await dbService.getRecruiterProfile(userId);

    return res.json({
      success: true,
      message: 'Recruiter profile updated successfully.',
      profile: fullProfile,
    });
  } catch (err) {
    console.error('updateRecruiterProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update recruiter profile.' });
  }
};

/**
 * Bookmark / Save Job
 */
export const saveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const seekerId = req.user.id;

    const job = await dbService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const saved = await dbService.saveJob(seekerId, jobId);

    return res.json({
      success: true,
      message: 'Job saved to your bookmarks.',
      saved,
    });
  } catch (err) {
    console.error('saveJob error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save job.' });
  }
};

/**
 * Remove saved job bookmark
 */
export const removeSavedJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const seekerId = req.user.id;

    await dbService.removeSavedJob(seekerId, jobId);

    return res.json({
      success: true,
      message: 'Job removed from bookmarks.',
    });
  } catch (err) {
    console.error('removeSavedJob error:', err);
    return res.status(500).json({ success: false, message: 'Failed to remove saved job.' });
  }
};

/**
 * List saved jobs
 */
export const getSavedJobs = async (req, res) => {
  try {
    const seekerId = req.user.id;
    const savedJobs = await dbService.getSavedJobs(seekerId);

    return res.json({
      success: true,
      savedJobs,
    });
  } catch (err) {
    console.error('getSavedJobs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve saved jobs.' });
  }
};

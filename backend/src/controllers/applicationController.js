import dbService from '../services/dbService.js';
import path from 'path';
import fs from 'fs';

/**
 * Job Seeker: Apply for a job
 */
export const applyForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const seekerId = req.user.id;

    // Check if job exists and is open for applications
    const job = await dbService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (job.status !== 'published') {
      return res.status(400).json({ success: false, message: 'This job is no longer accepting applications.' });
    }

    // Check for deadline
    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({ success: false, message: 'The application deadline for this job has passed.' });
    }

    // Duplicate check
    const existingApp = await dbService.findApplicationByJobAndSeeker(jobId, seekerId);
    if (existingApp) {
      return res.status(409).json({ success: false, message: 'You have already applied for this job.' });
    }

    // Determine resume path: either freshly uploaded or existing from profile
    let resumePath = '';
    if (req.file) {
      resumePath = `resumes/${req.file.filename}`;
    } else {
      const profile = await dbService.getSeekerProfile(seekerId);
      if (profile && profile.resume_path) {
        resumePath = profile.resume_path;
      }
    }

    const application = await dbService.createApplication({
      jobId,
      seekerId,
      resumePath,
      coverLetter: coverLetter || '',
    });

    // Notify recruiter
    const seekerProfile = await dbService.getSeekerProfile(seekerId);
    const applicantName = seekerProfile?.full_name || 'A candidate';
    await dbService.createNotification({
      userId: job.recruiter_id,
      title: 'New Applicant Received!',
      message: `${applicantName} applied for "${job.title}".`,
      link: `/recruiter/applicants?jobId=${job.id}`,
    });

    // Confirmation notification to seeker
    await dbService.createNotification({
      userId: seekerId,
      title: 'Application Submitted',
      message: `Your application for "${job.title}" at ${job.company_name} was successfully submitted.`,
      link: '/applications/my',
    });

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application,
    });
  } catch (err) {
    console.error('applyForJob error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
};

/**
 * Job Seeker: List my applications
 */
export const getMyApplications = async (req, res) => {
  try {
    const seekerId = req.user.id;
    const applications = await dbService.getApplicationsBySeeker(seekerId);

    return res.json({
      success: true,
      applications,
    });
  } catch (err) {
    console.error('getMyApplications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your applications.' });
  }
};

/**
 * Recruiter: Get applicants for a specific job owned by the recruiter
 */
export const getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, skills } = req.query;

    const job = await dbService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    // Recruiter isolation check: must be owner or admin
    if (req.user.role !== 'admin' && job.recruiter_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view applicants for your own job listings.',
      });
    }

    const applicants = await dbService.getApplicantsForJob(jobId, { status, skills });

    return res.json({
      success: true,
      job: {
        id: job.id,
        title: job.title,
        company_name: job.company_name,
      },
      applicants,
    });
  } catch (err) {
    console.error('getJobApplicants error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve job applicants.' });
  }
};

/**
 * Recruiter: Get all applicants across all recruiter's jobs
 */
export const getAllRecruiterApplicants = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const applicants = await dbService.getAllApplicantsForRecruiter(recruiterId);

    return res.json({
      success: true,
      applicants,
    });
  } catch (err) {
    console.error('getAllRecruiterApplicants error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve applicants.' });
  }
};

/**
 * Recruiter or Admin: Update application status
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const application = await dbService.getApplicationById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Verify recruiter ownership
    if (req.user.role !== 'admin' && application.recruiter_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot modify applications for jobs you do not manage.',
      });
    }

    const updated = await dbService.updateApplicationStatus(id, status);

    // Friendly status labels for notification
    const statusLabels = {
      under_review: 'is now Under Review',
      shortlisted: 'has been Shortlisted!',
      interview_scheduled: 'has an Interview Scheduled',
      rejected: 'was not moved forward',
      hired: 'resulted in an Offer/Hire!',
    };

    if (statusLabels[status]) {
      await dbService.createNotification({
        userId: application.seeker_id,
        title: 'Application Status Updated',
        message: `Your application for "${application.job_title}" ${statusLabels[status]}.`,
        link: '/applications/my',
      });
    }

    return res.json({
      success: true,
      message: 'Application status updated successfully.',
      application: updated,
    });
  } catch (err) {
    console.error('updateApplicationStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update application status.' });
  }
};

/**
 * Schedule an interview for an applicant
 */
export const scheduleInterview = async (req, res) => {
  try {
    const { id } = req.params; // application id
    const { scheduledAt, durationMinutes, meetingType, meetingLink, notes } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ success: false, message: 'Scheduled date and time are required.' });
    }

    const application = await dbService.getApplicationById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (req.user.role !== 'admin' && application.recruiter_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const interview = await dbService.createInterview({
      applicationId: id,
      recruiterId: req.user.id,
      seekerId: application.seeker_id,
      scheduledAt,
      durationMinutes: durationMinutes || 45,
      meetingType: meetingType || 'video',
      meetingLink: meetingLink || '',
      notes: notes || '',
    });

    // Automatically advance application status to interview_scheduled
    await dbService.updateApplicationStatus(id, 'interview_scheduled');

    // Notify seeker
    const formattedDate = new Date(scheduledAt).toLocaleString();
    await dbService.createNotification({
      userId: application.seeker_id,
      title: 'Interview Scheduled!',
      message: `An interview for "${application.job_title}" has been scheduled for ${formattedDate}.`,
      link: '/applications/my',
    });

    return res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully.',
      interview,
    });
  } catch (err) {
    console.error('scheduleInterview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to schedule interview.' });
  }
};

/**
 * Job Seeker: Withdraw / delete application
 */
export const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await dbService.getApplicationById(id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (req.user.role !== 'admin' && application.seeker_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await dbService.deleteApplication(id);

    return res.json({
      success: true,
      message: 'Application withdrawn successfully.',
    });
  } catch (err) {
    console.error('withdrawApplication error:', err);
    return res.status(500).json({ success: false, message: 'Failed to withdraw application.' });
  }
};

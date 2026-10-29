import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Building2,
  DollarSign,
  Clock,
  Briefcase,
  CheckCircle2,
  Bookmark,
  Share2,
  AlertTriangle,
  FileText,
  Upload,
  ArrowLeft,
  Calendar,
  Eye,
  Check,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';

export const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, isSeeker } = useAuth();
  const { success, error } = useToast();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);

  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [useProfileResume, setUseProfileResume] = useState(true);
  const [submittingApply, setSubmittingApply] = useState(false);

  // Report Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Inaccurate job information');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    const loadJobDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/jobs/${id}`);
        if (data.success) {
          setJob(data.job);
        }

        // If authenticated seeker, check if already applied or saved
        if (isAuthenticated && isSeeker) {
          const [appsRes, savedRes] = await Promise.all([
            api.get('/applications/my'),
            api.get('/profile/saved-jobs'),
          ]);

          if (appsRes.data?.success) {
            const found = appsRes.data.applications.find((a) => a.job_id === Number(id));
            if (found) setExistingApplication(found);
          }

          if (savedRes.data?.success) {
            const saved = savedRes.data.savedJobs.some((s) => s.id === Number(id));
            setIsSaved(saved);
          }
        }
      } catch (err) {
        console.error('Job load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadJobDetails();
  }, [id, isAuthenticated, isSeeker]);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      error('Please log in as a job seeker to bookmark jobs.');
      return;
    }
    if (!isSeeker) {
      error('Only job seekers can bookmark jobs.');
      return;
    }

    try {
      if (isSaved) {
        await api.delete(`/profile/saved-jobs/${id}`);
        setIsSaved(false);
        success('Job removed from saved bookmarks.');
      } else {
        await api.post(`/profile/saved-jobs/${id}`);
        setIsSaved(true);
        success('Job saved to your bookmarks!');
      }
    } catch {
      error('Failed to update bookmark.');
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }
    if (!isSeeker) {
      error('Only candidates / job seekers can submit applications.');
      return;
    }

    if (!useProfileResume && !resumeFile) {
      error('Please select a PDF resume file to upload.');
      return;
    }

    try {
      setSubmittingApply(true);
      const formData = new FormData();
      formData.append('coverLetter', coverLetter);
      if (!useProfileResume && resumeFile) {
        formData.append('resume', resumeFile);
      }

      const { data } = await api.post(`/applications/jobs/${id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        success('Application successfully submitted!');
        setExistingApplication(data.application);
        setApplyModalOpen(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application.';
      error(msg);
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReport(true);
      const { data } = await api.post(`/jobs/${id}/report`, {
        reason: reportReason,
        details: reportDetails,
      });
      if (data.success) {
        success('Thank you. Your report has been submitted to moderation.');
        setReportModalOpen(false);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      success('Link copied to clipboard!');
    }
  };

  const formatSalary = (min, max, currency = 'USD') => {
    if (!min && !max) return 'Competitive Salary';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `From ${formatter.format(min)}`;
    return `Up to ${formatter.format(max)}`;
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mb-6" />
        <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Job Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          This listing may have been closed by the recruiter or removed.
        </p>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to all jobs
      </Link>

      {/* Main Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
            {job.company_logo_url ? (
              <img
                src={job.company_logo_url}
                alt={job.company_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-8 h-8 text-slate-400" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                {job.company_name}
              </span>
              {job.company_is_verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-current" /> Verified Partner
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400" /> {job.location}
              </span>
              <span>•</span>
              <span className="capitalize">{job.job_type}</span>
              <span>•</span>
              <span className="capitalize">{job.experience_level} Level</span>
              {job.is_remote && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Remote Allowed</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleShare}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            title="Share Job"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleToggleSave}
            className={`p-3 rounded-2xl border transition-all ${
              isSaved
                ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 text-brand-600 dark:text-brand-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-600'
            }`}
            title={isSaved ? 'Remove Bookmark' : 'Save Job'}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          {existingApplication ? (
            <div className="px-5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Applied • </span>
              <StatusBadge status={existingApplication.status} />
            </div>
          ) : (
            <button
              onClick={() => setApplyModalOpen(true)}
              className="px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02]"
            >
              Apply For Role
            </button>
          )}
        </div>
      </div>

      {/* Grid: Details & Company Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Description & Requirements */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
                Role Overview
              </h2>
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </div>

            {job.requirements && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
                  Requirements & Qualifications
                </h2>
                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {job.requirements}
                </div>
              </div>
            )}

            {Array.isArray(job.skills) && job.skills.length > 0 && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                  Key Technologies & Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Candidate Safety Notice */}
          <div className="p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-400" />
              Notice any fraudulent or deceptive job posting?
            </span>
            <button
              onClick={() => setReportModalOpen(true)}
              className="text-brand-600 dark:text-brand-400 hover:underline font-semibold"
            >
              Report this listing
            </button>
          </div>
        </div>

        {/* Right Column: Key Details & Company Card */}
        <div className="space-y-6">
          {/* Key Facts Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">
              Position Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Compensation</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Category</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {job.category || 'Software Development'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Total Applicants</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {job.applicants_count || 0} candidates
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Views</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {job.views_count || 1} views
                </span>
              </div>
              {job.deadline && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Deadline</span>
                  <span className="font-semibold text-rose-500">
                    {new Date(job.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Company Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              About {job.company_name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {job.company_description || 'A verified innovative company hiring top talent on HireHub.'}
            </p>

            <div className="space-y-2 text-xs pt-2">
              {job.company_industry && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span>{job.company_industry}</span>
                </div>
              )}
              {job.company_size && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{job.company_size}</span>
                </div>
              )}
              {job.company_website && (
                <div className="pt-2">
                  <a
                    href={job.company_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 dark:text-brand-400 text-xs font-semibold hover:underline"
                  >
                    Visit Company Website ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Apply for {job.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Submitting your application directly to {job.company_name}
              </p>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              {/* Resume selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Resume (PDF Only)
                </label>

                {profile?.resume_path ? (
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        checked={useProfileResume}
                        onChange={() => setUseProfileResume(true)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      Use existing profile resume ({profile.resume_original_name || 'My Resume.pdf'})
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        checked={!useProfileResume}
                        onChange={() => setUseProfileResume(false)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      Upload a new resume for this application
                    </label>
                  </div>
                ) : null}

                {(!profile?.resume_path || !useProfileResume) && (
                  <div className="mt-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-slate-800 dark:file:text-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* Cover Letter */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Cover Note / Pitch (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Introduce yourself and explain why you're a great fit for this position..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submittingApply ? 'Submitting...' : 'Confirm Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Report Listing
            </h3>
            <p className="text-xs text-slate-500">
              Help keep HireHub safe. Reports are immediately audited by platform administrators.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Reason for report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                >
                  <option value="Inaccurate job information">Inaccurate job information</option>
                  <option value="Suspicious employer or phishing attempt">Suspicious employer or phishing attempt</option>
                  <option value="Spam or duplicate listing">Spam or duplicate listing</option>
                  <option value="Discrimination or inappropriate content">Discrimination or inappropriate content</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Additional Details
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide any additional context..."
                  className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;

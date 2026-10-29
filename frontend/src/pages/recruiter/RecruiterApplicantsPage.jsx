import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Video,
  Download,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Briefcase,
  ChevronDown,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';

export const RecruiterApplicantsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || 'all';

  const { user } = useAuth();
  const { success, error } = useToast();

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Schedule Interview Modal state
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/hirehub-session');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [submittingInterview, setSubmittingInterview] = useState(false);

  // Load recruiter's jobs for the dropdown
  useEffect(() => {
    const loadRecruiterJobs = async () => {
      try {
        const { data } = await api.get(`/jobs?recruiterId=${user.id}&status=all&limit=50`);
        if (data.success) {
          setJobs(data.jobs || []);
        }
      } catch {
        // Handle error
      }
    };
    if (user?.id) loadRecruiterJobs();
  }, [user]);

  // Load applicants
  const fetchApplicants = async () => {
    try {
      setLoading(true);
      let endpoint = '/applications/recruiter/all';
      if (selectedJobId && selectedJobId !== 'all') {
        endpoint = `/applications/jobs/${selectedJobId}/applicants`;
      }

      const { data } = await api.get(endpoint);
      if (data.success) {
        setApplicants(data.applicants || []);
      }
    } catch (err) {
      error('Failed to load candidate applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [selectedJobId]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const { data } = await api.patch(`/applications/${appId}/status`, { status: newStatus });
      if (data.success) {
        success('Candidate status updated.');
        setApplicants((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
        );
      }
    } catch {
      error('Failed to update candidate status.');
    }
  };

  const handleOpenInterviewModal = (app) => {
    setSelectedApp(app);
    // Default to tomorrow at 2:00 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    setScheduledAt(tomorrow.toISOString().slice(0, 16));
    setInterviewModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledAt) {
      error('Please specify interview date and time.');
      return;
    }

    try {
      setSubmittingInterview(true);
      const { data } = await api.post(`/applications/${selectedApp.id}/interview`, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes: Number(durationMinutes),
        meetingLink,
        notes: interviewNotes,
      });

      if (data.success) {
        success('Interview scheduled and invitation sent to candidate!');
        setApplicants((prev) =>
          prev.map((a) =>
            a.id === selectedApp.id ? { ...a, status: 'interview_scheduled' } : a
          )
        );
        setInterviewModalOpen(false);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to schedule interview.');
    } finally {
      setSubmittingInterview(false);
    }
  };

  // Filter applicants in memory
  const filteredApplicants = applicants.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      app.full_name?.toLowerCase().includes(q) ||
      app.applicant_name?.toLowerCase().includes(q) ||
      app.job_title?.toLowerCase().includes(q) ||
      (Array.isArray(app.skills) && app.skills.some((s) => s.toLowerCase().includes(q)));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Applicant Pipeline
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review submitted profiles, resumes, and progress candidates through stages
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-bold self-start sm:self-auto">
          {filteredApplicants.length} Candidates
        </span>
      </div>

      {/* Filter controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Job selector */}
        <div className="sm:col-span-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Filter By Job Vacancy
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setSearchParams({ jobId: e.target.value });
            }}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="all">All Vacancies</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="sm:col-span-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Candidate Stage
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none capitalize"
          >
            <option value="all">All Stages</option>
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="hired">Hired / Offer</option>
            <option value="rejected">Not Selected</option>
          </select>
        </div>

        {/* Search */}
        <div className="sm:col-span-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Search Candidate / Skill
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. React, Alex..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Applicant Cards List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
            No applicants found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your job selection or candidate stage filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplicants.map((app) => (
            <div
              key={app.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 transition-all shadow-sm space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shrink-0 uppercase shadow-sm">
                    {(app.full_name || app.applicant_name || 'C').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {app.full_name || app.applicant_name || 'Candidate'}
                      </h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                      Applied for {app.job_title}
                    </p>
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenInterviewModal(app)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Schedule Interview</span>
                  </button>

                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-800 dark:text-slate-200 capitalize focus:outline-none cursor-pointer"
                  >
                    <option value="applied">Applied</option>
                    <option value="under_review">Under Review</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview_scheduled">Interview Scheduled</option>
                    <option value="hired">Hired / Offer</option>
                    <option value="rejected">Not Selected</option>
                  </select>
                </div>
              </div>

              {/* Candidate Info details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {app.email || app.applicant_email || 'No email provided'}
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {app.phone || app.applicant_phone || 'No phone provided'}
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {app.location || app.applicant_location || 'Remote'}
                </span>
              </div>

              {/* Skills Tags */}
              {Array.isArray(app.skills) && app.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {app.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Cover letter */}
              {app.cover_letter && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  "{app.cover_letter}"
                </div>
              )}

              {/* Resume download & attachments */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-400">
                  Applied {new Date(app.created_at).toLocaleDateString()}
                </span>

                {(app.resume_path || app.profile_resume_path) && (
                  <a
                    href={`/api/resumes/${(app.resume_path || app.profile_resume_path).split('/').pop()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Submitted PDF Resume</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {interviewModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Schedule Video Interview
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Candidate: {selectedApp.full_name || selectedApp.applicant_name} • {selectedApp.job_title}
              </p>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Date and Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Duration (Minutes)
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Meeting Format
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Google Meet / Video"
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Video Meeting Link
                </label>
                <input
                  type="url"
                  required
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Interview Notes & Preparation for Candidate
                </label>
                <textarea
                  rows={3}
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="e.g. Round 1 Technical Architecture and Coding session with our Lead Engineer..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInterviewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInterview}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submittingInterview ? 'Scheduling...' : 'Send Interview Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterApplicantsPage;

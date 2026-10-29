import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Building2,
  Calendar,
  Video,
  Clock,
  ExternalLink,
  Trash2,
  AlertCircle,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';

export const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/applications/my');
      if (data.success) {
        setApplications(data.applications || []);
      }
    } catch (err) {
      error('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application? This cannot be undone.')) {
      return;
    }

    try {
      const { data } = await api.delete(`/applications/${appId}`);
      if (data.success) {
        success('Application withdrawn.');
        setApplications((prev) => prev.filter((a) => a.id !== appId));
      }
    } catch {
      error('Failed to withdraw application.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            My Job Applications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track hiring stages, interview invitations, and status updates in real time
          </p>
        </div>

        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors"
        >
          <Briefcase className="w-4 h-4" />
          <span>Browse More Jobs</span>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            No active applications yet
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            You haven't submitted any job applications. Explore verified roles and apply directly in seconds.
          </p>
          <Link
            to="/jobs"
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md"
          >
            Explore Open Vacancies
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 transition-all shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                    {app.company_logo_url ? (
                      <img
                        src={app.company_logo_url}
                        alt={app.company_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 transition-colors">
                      <Link to={`/jobs/${app.job_id}`}>{app.job_title}</Link>
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                      {app.company_name} • {app.job_location}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Applied on {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <StatusBadge status={app.status} />

                  <button
                    onClick={() => handleWithdraw(app.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    title="Withdraw Application"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scheduled Interview Banner */}
              {app.interview_date && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        Interview Confirmed
                      </p>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300">
                        {new Date(app.interview_date).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {app.meeting_link && (
                    <a
                      href={app.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Video Meeting</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Cover note preview */}
              {app.cover_letter && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Your Cover Note
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic line-clamp-2">
                    "{app.cover_letter}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;

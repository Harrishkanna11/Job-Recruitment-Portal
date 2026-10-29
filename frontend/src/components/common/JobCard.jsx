import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Building2, Bookmark, CheckCircle2, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const JobCard = ({ job, isSaved = false, onToggleSave }) => {
  const { isAuthenticated, isSeeker } = useAuth();
  const { success, error } = useToast();
  const [saved, setSaved] = React.useState(isSaved);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      error('Please sign in as a job seeker to bookmark jobs.');
      return;
    }
    if (!isSeeker) {
      error('Only job seekers can bookmark jobs.');
      return;
    }

    try {
      setSaving(true);
      if (saved) {
        await api.delete(`/profile/saved-jobs/${job.id}`);
        setSaved(false);
        success('Job removed from saved bookmarks.');
      } else {
        await api.post(`/profile/saved-jobs/${job.id}`);
        setSaved(true);
        success('Job saved to your bookmarks!');
      }
      if (onToggleSave) onToggleSave(job.id, !saved);
    } catch (err) {
      error('Failed to update bookmark status.');
    } finally {
      setSaving(false);
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

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffHours < 24) return `${Math.max(1, diffHours)}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Header: Company & Bookmark */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {job.company_logo_url ? (
                <img
                  src={job.company_logo_url}
                  alt={job.company_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<span class="text-brand-600 font-bold text-sm">HH</span>';
                  }}
                />
              ) : (
                <Building2 className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {job.company_name}
                </span>
                {job.company_is_verified && (
                  <CheckCircle2 className="w-4 h-4 text-brand-500" title="Verified Employer" />
                )}
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1 mt-0.5">
                <Link to={`/jobs/${job.id}`}>{job.title}</Link>
              </h3>
            </div>
          </div>

          <button
            onClick={handleBookmark}
            disabled={saving}
            className={`p-2.5 rounded-xl border transition-all ${
              saved
                ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 text-brand-600 dark:text-brand-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-brand-600 hover:border-brand-300 dark:hover:border-slate-700'
            }`}
            title={saved ? 'Remove Bookmark' : 'Save Job'}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Badges / Meta Info */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-medium text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {job.location}
          </span>
          {job.is_remote && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Remote
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 capitalize">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            {job.job_type}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 capitalize">
            {job.experience_level} Level
          </span>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {job.description}
        </p>

        {/* Skills Tags */}
        {Array.isArray(job.skills) && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {job.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-50/60 dark:bg-slate-800 text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-slate-700"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="text-[11px] text-slate-400 self-center">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Salary & Apply Link */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block">Salary Range</span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(job.created_at)}
          </span>
          <Link
            to={`/jobs/${job.id}`}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors shadow-sm"
          >
            View Role
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobCard;

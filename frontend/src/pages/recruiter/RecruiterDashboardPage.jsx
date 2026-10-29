import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  Eye,
  CheckCircle2,
  Calendar,
  PlusCircle,
  TrendingUp,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';

export const RecruiterDashboardPage = () => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({
    total_jobs: 0,
    total_views: 0,
    total_applicants: 0,
    shortlisted_count: 0,
    interview_count: 0,
    hired_count: 0,
  });
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [statsRes, appsRes] = await Promise.all([
          api.get('/stats/recruiter'),
          api.get('/applications/recruiter/all'),
        ]);

        if (statsRes.data?.success) {
          setStats(statsRes.data.stats || {});
        }
        if (appsRes.data?.success) {
          setRecentApplicants((appsRes.data.applicants || []).slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load recruiter dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const pipelineData = [
    { name: 'Applied', count: stats.total_applicants || 0, color: '#3b82f6' },
    { name: 'Shortlisted', count: stats.shortlisted_count || 0, color: '#a855f7' },
    { name: 'Interviews', count: stats.interview_count || 0, color: '#6366f1' },
    { name: 'Hires', count: stats.hired_count || 0, color: '#10b981' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md inline-block">
            Employer Control Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {profile?.full_name || 'Recruiter'}
          </h1>
          <p className="text-xs text-brand-200">
            Managing talent acquisition for {profile?.company_name || 'HireHub Partner Company'}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            to="/recruiter/jobs/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Vacancy</span>
          </Link>
          <Link
            to="/recruiter/applicants"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md transition-colors"
          >
            <span>Review Applicants</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Jobs</span>
            <Briefcase className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {stats.total_jobs}
          </p>
          <span className="text-[10px] text-emerald-500 font-bold block">Live on portal</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Views</span>
            <Eye className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {stats.total_views}
          </p>
          <span className="text-[10px] text-indigo-500 font-bold block">Job seeker impressions</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Candidates</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {stats.total_applicants}
          </p>
          <span className="text-[10px] text-blue-500 font-bold block">Total applications</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Shortlisted</span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {stats.shortlisted_count}
          </p>
          <span className="text-[10px] text-purple-500 font-bold block">Passed screening</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Interviews</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {stats.interview_count}
          </p>
          <span className="text-[10px] text-amber-500 font-bold block">Video rounds set</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Placements</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {stats.hired_count}
          </p>
          <span className="text-[10px] text-emerald-500 font-bold block">Offers accepted</span>
        </div>
      </div>

      {/* Grid: Hiring Funnel Chart & Recent Applicants */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Funnel Chart */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recruitment Conversion Pipeline
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current candidate progression across all stages
            </p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Applicants Feed */}
        <div className="lg:col-span-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Recent Applicant Submissions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest candidates awaiting review
              </p>
            </div>
            <Link
              to="/recruiter/applicants"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentApplicants.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No candidate submissions yet. Share your job links to attract applicants!
              </div>
            ) : (
              recentApplicants.map((app) => (
                <div key={app.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                      {app.full_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {app.full_name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        Applied for <span className="font-semibold">{app.job_title}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <Link
                      to={`/recruiter/applicants?jobId=${app.job_id}`}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-600 hover:border-brand-500 transition-colors"
                      title="Inspect Candidate"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboardPage;

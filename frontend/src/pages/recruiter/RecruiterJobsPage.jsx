import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  PlusCircle,
  Eye,
  Users,
  Edit,
  Trash2,
  ExternalLink,
  Power,
  Search,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';

export const RecruiterJobsPage = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/jobs?recruiterId=${user.id}&status=all&limit=50`);
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      error('Failed to load your job postings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchMyJobs();
  }, [user]);

  const handleToggleStatus = async (job) => {
    const nextStatus = job.status === 'published' ? 'closed' : 'published';
    try {
      const { data } = await api.put(`/jobs/${job.id}`, { status: nextStatus });
      if (data.success) {
        success(`Job status changed to ${nextStatus}.`);
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, status: nextStatus } : j))
        );
      }
    } catch {
      error('Failed to update job status.');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting? All attached applications will also be deleted.')) {
      return;
    }

    try {
      const { data } = await api.delete(`/jobs/${jobId}`);
      if (data.success) {
        success('Job posting deleted.');
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } catch {
      error('Failed to delete job posting.');
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Manage Vacancies
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review, publish, edit, or close your company’s job postings
          </p>
        </div>

        <Link
          to="/recruiter/jobs/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post a New Job</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search my jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['all', 'published', 'closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading your vacancies...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No vacancies found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 uppercase font-semibold">
                  <th className="py-4 px-6">Role Title</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-center">Views</th>
                  <th className="py-4 px-4 text-center">Applicants</th>
                  <th className="py-4 px-4">Posted Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-brand-600 transition-colors block"
                      >
                        {job.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        {job.location} • <span className="capitalize">{job.job_type}</span>
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={job.status} />
                    </td>

                    <td className="py-4 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        {job.views_count || 0}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <Link
                        to={`/recruiter/applicants?jobId=${job.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold hover:underline"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {job.applicants_count || 0} candidates
                      </Link>
                    </td>

                    <td className="py-4 px-4 text-slate-400">
                      {new Date(job.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(job)}
                          className={`p-2 rounded-xl border transition-colors ${
                            job.status === 'published'
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 border-slate-200 dark:border-slate-700'
                              : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-slate-200 dark:border-slate-700'
                          }`}
                          title={job.status === 'published' ? 'Close Job' : 'Publish Job'}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        <Link
                          to={`/recruiter/jobs/edit/${job.id}`}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-brand-600 hover:border-brand-500 transition-colors"
                          title="Edit Job Posting"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>

                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-500 transition-colors"
                          title="Delete Job Posting"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterJobsPage;

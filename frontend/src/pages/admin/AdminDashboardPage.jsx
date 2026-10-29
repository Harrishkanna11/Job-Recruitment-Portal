import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Briefcase,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Trash2,
  Check,
  Eye,
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';

export const AdminDashboardPage = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'jobs' | 'reports' | 'logs'

  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, jobsRes, reportsRes, logsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users?limit=50'),
        api.get('/jobs?status=all&limit=50'),
        api.get('/admin/reports'),
        api.get('/admin/audit-logs'),
      ]);

      if (statsRes.data?.success) setStats(statsRes.data.stats || {});
      if (usersRes.data?.success) setUsers(usersRes.data.users || []);
      if (jobsRes.data?.success) setJobs(jobsRes.data.jobs || []);
      if (reportsRes.data?.success) setReports(reportsRes.data.reports || []);
      if (logsRes.data?.success) setAuditLogs(logsRes.data.logs || []);
    } catch (err) {
      error('Failed to load administrative console data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateUserStatus = async (userId, nextStatus) => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      if (data.success) {
        success(`User status changed to ${nextStatus}.`);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, account_status: nextStatus } : u))
        );
      }
    } catch {
      error('Failed to update user status.');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to moderate and remove this job posting?')) {
      return;
    }
    try {
      const { data } = await api.delete(`/jobs/${jobId}`);
      if (data.success) {
        success('Job listing removed by admin.');
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } catch {
      error('Failed to remove job listing.');
    }
  };

  const handleUpdateReport = async (reportId, nextStatus) => {
    try {
      const { data } = await api.patch(`/admin/reports/${reportId}/status`, { status: nextStatus });
      if (data.success) {
        success(`Report marked as ${nextStatus}.`);
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: nextStatus } : r))
        );
      }
    } catch {
      error('Failed to update report status.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Platform Administration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Super Admin
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global governance, user moderation, report management, and security audit logs
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Users</span>
          <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {stats.total_users || 0}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Job Seekers</span>
          <p className="text-xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
            {stats.total_seekers || 0}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Recruiters</span>
          <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {stats.total_recruiters || 0}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Active Jobs</span>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.active_jobs || 0}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Applications</span>
          <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {stats.total_applications || 0}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Interviews</span>
          <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            {stats.interview_count || 0}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Hires</span>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.hired_count || 0}
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>All Job Listings ({jobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Candidate Reports ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Users Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user emails..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              {['all', 'job_seeker', 'recruiter', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize ${
                    userRoleFilter === r
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {r.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 uppercase font-semibold">
                    <th className="py-4 px-6">User Email</th>
                    <th className="py-4 px-4">Role</th>
                    <th className="py-4 px-4">Account Status</th>
                    <th className="py-4 px-4">Registered</th>
                    <th className="py-4 px-6 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                        {u.email}
                      </td>
                      <td className="py-4 px-4 capitalize">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={u.account_status} />
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {u.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-2">
                            {u.account_status === 'active' ? (
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, 'suspended')}
                                className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-bold border border-rose-500/20 hover:bg-rose-100"
                              >
                                Suspend User
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, 'active')}
                                className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-100"
                              >
                                Activate User
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Job Moderation */}
      {activeTab === 'jobs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 uppercase font-semibold">
                  <th className="py-4 px-6">Title & Company</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Location</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-6 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-6">
                      <Link to={`/jobs/${j.id}`} className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:underline">
                        {j.title}
                      </Link>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {j.company_name}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={j.status} />
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                      {j.location}
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                      {j.category}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleDeleteJob(j.id)}
                        className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-bold border border-rose-500/20 hover:bg-rose-100"
                      >
                        Remove Listing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 uppercase font-semibold">
                  <th className="py-4 px-6">Target Role</th>
                  <th className="py-4 px-4">Reporter</th>
                  <th className="py-4 px-6">Reason & Notes</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                      {r.job_title}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {r.reporter_email}
                    </td>
                    <td className="py-4 px-6 max-w-sm">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{r.reason}</p>
                      {r.details && <p className="text-slate-400 text-[11px] mt-0.5">{r.details}</p>}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      {r.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateReport(r.id, 'reviewed')}
                            className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 text-xs font-bold"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => handleUpdateReport(r.id, 'dismissed')}
                            className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 uppercase font-semibold">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-4">Admin Email</th>
                  <th className="py-4 px-4">Action</th>
                  <th className="py-4 px-6">Operation Details</th>
                  <th className="py-4 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {log.admin_email}
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                      {log.details}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;

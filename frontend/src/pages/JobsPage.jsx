import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Filter,
  X,
  Briefcase,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import api from '../services/api';
import JobCard from '../components/common/JobCard';
import { useAuth } from '../context/AuthContext';

export const JobsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isSeeker } = useAuth();

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [locationTerm, setLocationTerm] = useState(searchParams.get('location') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [jobType, setJobType] = useState(searchParams.get('jobType') || 'all');
  const [experienceLevel, setExperienceLevel] = useState(searchParams.get('experienceLevel') || 'all');
  const [isRemote, setIsRemote] = useState(searchParams.get('isRemote') === 'true');
  const [minSalary, setMinSalary] = useState(searchParams.get('minSalary') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Results state
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load saved jobs if seeker
  useEffect(() => {
    if (isAuthenticated && isSeeker) {
      api.get('/profile/saved-jobs')
        .then((res) => {
          if (res.data?.success) {
            setSavedJobIds(res.data.savedJobs.map((j) => j.id));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, isSeeker]);

  // Fetch jobs whenever query changes
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (locationTerm) params.append('location', locationTerm);
      if (category && category !== 'all') params.append('category', category);
      if (jobType && jobType !== 'all') params.append('jobType', jobType);
      if (experienceLevel && experienceLevel !== 'all') params.append('experienceLevel', experienceLevel);
      if (isRemote) params.append('isRemote', 'true');
      if (minSalary) params.append('minSalary', minSalary);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', page.toString());
      params.append('limit', '9');

      // Update URL query params without full reload
      setSearchParams(params, { replace: true });

      const { data } = await api.get(`/jobs?${params.toString()}`);
      if (data.success) {
        setJobs(data.jobs || []);
        setPagination(data.pagination || { page: 1, limit: 9, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, category, jobType, experienceLevel, isRemote, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setLocationTerm('');
    setCategory('all');
    setJobType('all');
    setExperienceLevel('all');
    setIsRemote(false);
    setMinSalary('');
    setSortBy('newest');
    setPage(1);
  };

  const categories = [
    'all',
    'Software Development',
    'AI/ML',
    'Design',
    'Marketing',
    'Finance',
    'Human Resources',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Explore Open Vacancies
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Showing {pagination.total} opportunities matching your criteria
          </p>
        </div>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300"
        >
          <Filter className="w-4 h-4 text-brand-500" />
          <span>Filters</span>
        </button>
      </div>

      {/* 2. Main Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3"
      >
        <div className="sm:col-span-5 flex items-center gap-3 px-3">
          <Search className="w-5 h-5 text-brand-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by title, skills, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-4 flex items-center gap-3 px-3 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0">
          <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="City or Country..."
            value={locationTerm}
            onChange={(e) => setLocationTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-3 flex items-center gap-2">
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* 3. Grid: Sidebar Filters & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside
          className={`lg:block ${
            mobileFilterOpen ? 'block' : 'hidden'
          } bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 h-fit space-y-6 shadow-sm`}
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Filter className="w-4 h-4 text-brand-500" />
              Filter Opportunities
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
            >
              Reset
            </button>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="salary">Highest Salary</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Category
            </label>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setPage(1);
                  }}
                  className={`w-full text-left text-xs px-3 py-1.5 rounded-lg transition-colors capitalize ${
                    category === cat
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Job Type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Employment Type
            </label>
            <div className="space-y-1.5">
              {['all', 'full-time', 'part-time', 'contract', 'internship'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setJobType(type);
                    setPage(1);
                  }}
                  className={`w-full text-left text-xs px-3 py-1.5 rounded-lg transition-colors capitalize ${
                    jobType === type
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {type === 'all' ? 'All Types' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Experience Level
            </label>
            <div className="space-y-1.5">
              {['all', 'entry', 'mid', 'senior', 'lead'].map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setExperienceLevel(level);
                    setPage(1);
                  }}
                  className={`w-full text-left text-xs px-3 py-1.5 rounded-lg transition-colors capitalize ${
                    experienceLevel === level
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold border border-brand-200 dark:border-brand-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {level === 'all' ? 'All Levels' : `${level} Level`}
                </button>
              ))}
            </div>
          </div>

          {/* Remote Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRemote}
                onChange={(e) => {
                  setIsRemote(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Remote Only Roles
              </span>
            </label>
          </div>

          {/* Min Salary */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Minimum Salary ($)
            </label>
            <input
              type="number"
              placeholder="e.g. 100000"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              onBlur={() => {
                setPage(1);
                fetchJobs();
              }}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </aside>

        {/* Job Listings List */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse p-6"
                />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                No matching vacancies found
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                Try broadening your search terms, removing filters, or clearing the location query.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSaved={savedJobIds.includes(job.id)}
                    onToggleSave={(jobId, isSaved) => {
                      setSavedJobIds((prev) =>
                        isSaved ? [...prev, jobId] : prev.filter((id) => id !== jobId)
                      );
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page <= 1}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsPage;

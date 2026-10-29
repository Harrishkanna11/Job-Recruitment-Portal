import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  Users,
  Building2,
  Trophy,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import api from '../services/api';
import JobCard from '../components/common/JobCard';

const CATEGORIES = [
  { name: 'Software Development', icon: '💻', count: '140+ roles' },
  { name: 'AI/ML', icon: '🤖', count: '45+ roles' },
  { name: 'Design', icon: '🎨', count: '30+ roles' },
  { name: 'Marketing', icon: '📈', count: '25+ roles' },
  { name: 'Finance', icon: '📊', count: '20+ roles' },
  { name: 'Human Resources', icon: '🤝', count: '15+ roles' },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [stats, setStats] = useState({
    total_active_jobs: 8,
    total_companies: 3,
    successful_placements: 4,
    total_job_seekers: 4,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [jobsRes, statsRes] = await Promise.all([
          api.get('/jobs?limit=6'),
          api.get('/stats/public'),
        ]);

        if (jobsRes.data?.success) {
          setFeaturedJobs(jobsRes.data.jobs || []);
        }
        if (statsRes.data?.success) {
          setStats(statsRes.data.stats || {});
        }
      } catch (err) {
        console.warn('Could not load homepage dynamic data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.append('search', searchTerm.trim());
    if (locationTerm.trim()) params.append('location', locationTerm.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div className="space-y-20">
      {/* 1. Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-brand-500/20 to-indigo-500/20 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-semibold mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>Next-Generation Career Recruitment Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 leading-[1.15] mb-6">
            Find the career you love. <br />
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Hire the talent you need.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            HireHub connects innovative companies with top engineers, designers, and business leaders. Streamlined applications, transparent salaries, and zero friction.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearch}
            className="p-2 sm:p-3 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-full shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2 max-w-3xl mx-auto transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-500/40"
          >
            <div className="flex items-center gap-3 px-4 w-full sm:flex-1 py-2 sm:py-0">
              <Search className="w-5 h-5 text-brand-500 shrink-0" />
              <input
                type="text"
                placeholder="Job title, tech stack, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-3 px-4 w-full sm:w-56 py-2 sm:py-0">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="City or Remote"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3 rounded-xl sm:rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shrink-0"
            >
              <span>Explore Roles</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Trending keywords:</span>
            {['React', 'PostgreSQL', 'TypeScript', 'Remote', 'Machine Learning'].map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/jobs?search=${tag}`)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Platform Metrics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {stats.total_active_jobs || 8}+
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Verified Vacancies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {stats.total_companies || 3}+
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Partner Companies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {stats.total_job_seekers || 4}+
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Active Job Seekers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {stats.successful_placements || 4}+
              </p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Candidate Placements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Explore by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Explore Popular Industries
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Browse vacancies sorted by career discipline and domain
            </p>
          </div>
          <Link
            to="/jobs"
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            All Categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => navigate(`/jobs?category=${encodeURIComponent(cat.name)}`)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 hover:shadow-lg transition-all text-left group"
            >
              <span className="text-2xl mb-3 block group-hover:scale-110 transition-transform">
                {cat.icon}
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{cat.count}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Featured Job Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                Featured Vacancies
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Verified
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Top opportunities with verified salary transparency and direct recruiter review
            </p>
          </div>

          <Link
            to="/jobs"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            <span>View All {stats.total_active_jobs || 8} Jobs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200/50 dark:border-slate-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/jobs"
            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-sm"
          >
            Browse All Jobs
          </Link>
        </div>
      </section>

      {/* 5. Dual Role Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Seeker CTA */}
          <div className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white overflow-hidden shadow-xl">
            <div className="relative z-10 space-y-4 max-w-md">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md inline-block">
                For Job Seekers
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                Land your dream job at a premier tech company.
              </h3>
              <p className="text-sm text-brand-100 leading-relaxed">
                Create a high-impact profile, upload your resume, receive real-time updates, and schedule interviews with top hiring managers.
              </p>
              <div className="pt-2">
                <Link
                  to="/register?role=job_seeker"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-brand-700 font-bold text-sm shadow-md hover:bg-brand-50 transition-colors"
                >
                  Create Candidate Profile <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recruiter CTA */}
          <div className="relative p-8 sm:p-10 rounded-3xl bg-slate-900 dark:bg-slate-800/80 text-white border border-slate-800 overflow-hidden shadow-xl">
            <div className="relative z-10 space-y-4 max-w-md">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/20 text-brand-400 border border-brand-500/30 inline-block">
                For Hiring Managers
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                Attract top-tier engineers, designers & leaders.
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Publish openings in minutes, filter applicants by skill set, schedule Google Meet interviews directly, and streamline your hiring pipeline.
              </p>
              <div className="pt-2">
                <Link
                  to="/register?role=recruiter"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-colors"
                >
                  Post a Job Today <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

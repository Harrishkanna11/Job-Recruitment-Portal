import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Heart, Shield, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Briefcase className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100">
                HireHub
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Empowering top companies and world-class candidates to connect, interview, and build the future together.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-500" />
              Enterprise-Grade Candidate Privacy
            </div>
          </div>

          {/* Quick links: Job Seekers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              For Job Seekers
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/jobs" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors">
                  Browse All Jobs
                </Link>
              </li>
              <li>
                <Link to="/jobs?isRemote=true" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors">
                  Remote Opportunities
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors">
                  Resume & Profile Builder
                </Link>
              </li>
              <li>
                <Link to="/applications/my" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors">
                  Track Applications
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick links: Recruiters */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              For Employers
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/register" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors">
                  Create Employer Account
                </Link>
              </li>
              <li>
                <Link to="/recruiter/jobs/new" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors">
                  Post a Job Listing
                </Link>
              </li>
              <li>
                <Link to="/recruiter/dashboard" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors">
                  Recruiter Analytics
                </Link>
              </li>
              <li>
                <Link to="/recruiter/applicants" className="text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors">
                  Candidate Pipeline
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-3">
              Platform & Trust
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-500 dark:text-slate-400">
                  Status: <span className="text-emerald-500 font-semibold">All Systems Operational</span>
                </span>
              </li>
              <li>
                <span className="text-slate-500 dark:text-slate-400">
                  Protected with TLS 1.3 & Encrypted Resumes
                </span>
              </li>
              <li>
                <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Try Instant Demo Accounts
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} HireHub Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered for high performance with React, Express & PostgreSQL
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

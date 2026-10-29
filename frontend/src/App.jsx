import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Seeker Pages
import ProfilePage from './pages/seeker/ProfilePage';
import MyApplicationsPage from './pages/seeker/MyApplicationsPage';
import SavedJobsPage from './pages/seeker/SavedJobsPage';

// Recruiter Pages
import RecruiterDashboardPage from './pages/recruiter/RecruiterDashboardPage';
import RecruiterJobsPage from './pages/recruiter/RecruiterJobsPage';
import PostJobPage from './pages/recruiter/PostJobPage';
import RecruiterApplicantsPage from './pages/recruiter/RecruiterApplicantsPage';
import CompanyProfilePage from './pages/recruiter/CompanyProfilePage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

export const App = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Job Seeker Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['job_seeker']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications/my"
            element={
              <ProtectedRoute allowedRoles={['job_seeker']}>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-jobs"
            element={
              <ProtectedRoute allowedRoles={['job_seeker']}>
                <SavedJobsPage />
              </ProtectedRoute>
            }
          />

          {/* Recruiter Protected Routes */}
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <RecruiterDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <RecruiterJobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/new"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <PostJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/edit/:id"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <PostJobPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/applicants"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <RecruiterApplicantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/company"
            element={
              <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                <CompanyProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;

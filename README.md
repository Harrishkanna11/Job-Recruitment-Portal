# HireHub – Enterprise Job Recruitment Portal

A modern, full-stack recruitment platform connecting top talent with forward-thinking employers. Featuring candidate application tracking, recruiter applicant pipelines, interview scheduling, role-based access control (RBAC), and moderation governance.

---

## Architecture Overview

- **Frontend**: React 18, Vite, React Router v7, Tailwind CSS with full dark/light theme support, Lucide icons, Recharts for recruiter funnel visualization, Axios with centralized JWT token interceptor.
- **Backend**: Node.js & Express (ES Modules), PostgreSQL relational schema with fallback persistent store engine, JWT authentication, bcrypt password hashing, Multer PDF file uploads with randomized filenames, Helmet security headers, rate-limiting, and Morgan logging.
- **Security**: Strict Role-Based Access Control (`job_seeker`, `recruiter`, `admin`), input validation, password salting, PDF mime-type restriction (5 MB limit), and authorization-guarded resume access.

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v18+ (tested with v24.19.0)
- **npm** v9+ (tested with v11.17.0)
- Optional: **PostgreSQL** v14+ (if PostgreSQL is not running, HireHub automatically boots with its zero-setup persistent relational engine).

### 2. Backend Setup & Startup

```bash
cd backend

# 1. Install dependencies (if not already installed)
npm install

# 2. Seed initial demo users, companies, and jobs
npm run seed

# 3. Start development server
npm run dev
# or in production: npm start
```
The backend API server will listen on `http://localhost:5000`.

### 3. Frontend Setup & Startup

```bash
cd frontend

# 1. Install dependencies (if not already installed)
npm install

# 2. Start Vite development server
npm run dev
```
Open your browser to `http://localhost:5173`. In development mode, Vite automatically proxies `/api` calls directly to `http://localhost:5000`.

---

## Demo Accounts

For zero-setup evaluation, you can use the instant one-click login buttons on the `/login` page or use the following credentials:

| Role | Email | Password | Features Accessible |
|---|---|---|---|
| **Job Seeker** | `alex.johnson@example.com` | `Password123!` | Browse & filter jobs, apply with PDF resume, track application stages, view scheduled interviews, bookmark jobs |
| **Recruiter** | `sarah.recruiter@technova.com` | `Password123!` | Post/edit/close jobs, applicant pipeline, candidate status progression, Google Meet interview scheduling, company branding |
| **Admin** | `admin@hirehub.com` | `Admin123!` | User moderation & suspension, job moderation, candidate report resolution, security audit logs |

---

## Test & Validation Commands

### Backend Automated Test Suite
To run the automated 20-point integration test suite:
```bash
cd backend
npm test
```
The test suite validates:
- Health and platform public statistics endpoints
- Public job search, category filtering, and salary queries
- Candidate, recruiter, and administrator JWT authentication
- Recruiter job creation
- Candidate job bookmarking and application submission
- Duplicate application prevention (HTTP 409)
- Recruiter applicant inspection and status transitions
- Interview scheduling and Google Meet notification dispatch
- Seeker application status updates
- Recruiter isolation and authorization enforcement (preventing cross-recruiter job edits or applicant inspection)
- Administrative platform metrics and user listing

### Frontend Production Build
To validate JSX compilation, PostCSS, and bundle chunking:
```bash
cd frontend
npm run build
```

---

## Environment Variables

### Backend (`backend/.env`)
```ini
PORT=5000
NODE_ENV=development

# PostgreSQL connection (optional - defaults to persistent JSON engine if unavailable):
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=hirehub_db
PG_USER=postgres
PG_PASSWORD=your_secure_password
# Or DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# CORS & Uploads
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE_MB=5
UPLOAD_DIR=uploads/resumes
```

### Frontend (`frontend/.env`)
```ini
# Leave empty in development to utilize the Vite proxy:
VITE_API_BASE_URL=
# In production, set to your backend API URL (e.g. https://api.hirehub.com/api):
# VITE_API_BASE_URL=https://api.hirehub.com/api
```

---

## Production Deployment Guide

### Option A: Unified Container / Cloud Platform (Render, Railway, DigitalOcean, Heroku)
1. **Database**: Provision a managed PostgreSQL instance (e.g. Supabase, Neon, AWS RDS, or Render PostgreSQL).
2. **Migrations**:
   ```bash
   cd backend && npm run migrate
   npm run seed
   ```
3. **Backend Service**:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment variables: Set `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL=https://your-frontend-domain.com`.
4. **Frontend Service** (Vercel, Netlify, Cloudflare Pages, or Render Static Site):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment variables: `VITE_API_BASE_URL=https://your-backend-domain.com/api`
   - Configure Single Page Application (SPA) redirect rule (rewrite `/*` to `/index.html`).

---

## Project Structure

```
job_recruitment/
├── backend/
│   ├── src/
│   │   ├── controllers/         # Auth, Jobs, Applications, Profile, Admin, Company, Stats
│   │   ├── database/            # schema.sql, db.js, seedData.js, migrate.js, seed.js
│   │   ├── middleware/          # JWT authentication, role guards, Multer resume uploads
│   │   ├── routes/              # Modular Express API routes
│   │   ├── services/            # Dual-mode relational dbService (PostgreSQL & Persistent engine)
│   │   ├── utils/               # JWT token utilities
│   │   ├── server.js            # Express app server entry point
│   │   └── test_api.js          # Automated end-to-end integration test suite
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/                  # Static assets & SVG icons
│   ├── src/
│   │   ├── components/common/   # Navbar, Footer, StatusBadge, JobCard, NotificationBell, ProtectedRoute
│   │   ├── context/             # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/               # HomePage, JobsPage, JobDetailPage, LoginPage, RegisterPage
│   │   │   ├── seeker/          # ProfilePage, MyApplicationsPage, SavedJobsPage
│   │   │   ├── recruiter/       # RecruiterDashboardPage, RecruiterJobsPage, PostJobPage, RecruiterApplicantsPage, CompanyProfilePage
│   │   │   └── admin/           # AdminDashboardPage
│   │   ├── services/            # Axios API client with interceptors
│   │   ├── App.jsx              # Main routing & layout
│   │   ├── index.css            # Tailwind directives & glassmorphism utilities
│   │   └── main.jsx             # React DOM root entry
│   ├── .env.example
│   ├── vite.config.js           # Vite configuration with proxy and vendor chunking
│   ├── tailwind.config.js       # Custom branding and dark mode configuration
│   └── package.json
└── README.md
```

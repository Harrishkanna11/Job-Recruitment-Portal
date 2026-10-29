// Comprehensive Backend API Integration Test
import http from 'http';
import app from './server.js';

let serverInstance = null;
let BASE_URL = '';

const request = async (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
};

const runTests = async () => {
  console.log('🧪 Starting HireHub Backend API Integration Test Suite...');
  const testPort = 5055;
  BASE_URL = `http://127.0.0.1:${testPort}`;

  serverInstance = app.listen(testPort);
  await new Promise((r) => setTimeout(r, 1000));

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✓ ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${title}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    console.log('\n[1] Testing Health Endpoint:');
    const health = await request('GET', '/api/health');
    assert(health.status === 200 && health.body.status === 'healthy', 'GET /api/health returns healthy');

    // 2. Public stats
    console.log('\n[2] Testing Public Stats:');
    const stats = await request('GET', '/api/stats/public');
    assert(stats.status === 200 && stats.body.stats.total_active_jobs > 0, 'GET /api/stats/public returns metrics');

    // 3. Public jobs listing
    console.log('\n[3] Testing Job Search & Filters:');
    const allJobs = await request('GET', '/api/jobs?limit=5');
    assert(allJobs.status === 200 && allJobs.body.jobs.length > 0, 'GET /api/jobs returns job listing');
    const filteredJobs = await request('GET', '/api/jobs?category=AI/ML');
    assert(filteredJobs.status === 200 && filteredJobs.body.jobs.some(j => j.category === 'AI/ML'), 'Filter by category works');

    // 4. Job Seeker Authentication
    console.log('\n[4] Testing Job Seeker Login:');
    const seekerLogin = await request('POST', '/api/auth/login', {
      email: 'alex.johnson@example.com',
      password: 'Password123!',
    });
    assert(seekerLogin.status === 200 && seekerLogin.body.token, 'Job seeker login succeeds with JWT');
    const seekerToken = seekerLogin.body.token;

    // 5. Recruiter Authentication
    console.log('\n[5] Testing Recruiter Login:');
    const recruiterLogin = await request('POST', '/api/auth/login', {
      email: 'sarah.recruiter@technova.com',
      password: 'Password123!',
    });
    assert(recruiterLogin.status === 200 && recruiterLogin.body.user.role === 'recruiter', 'Recruiter login succeeds');
    const recruiterToken = recruiterLogin.body.token;

    // 6. Admin Authentication
    console.log('\n[6] Testing Admin Login:');
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'admin@hirehub.com',
      password: 'Admin123!',
    });
    assert(adminLogin.status === 200 && adminLogin.body.user.role === 'admin', 'Admin login succeeds');
    const adminToken = adminLogin.body.token;

    // 7. Recruiter: Post Job
    console.log('\n[7] Testing Job Creation by Recruiter:');
    const newJobRes = await request(
      'POST',
      '/api/jobs',
      {
        title: 'Principal Cloud Architect',
        description: 'Lead high-scale Kubernetes and AWS multi-region infrastructure.',
        requirements: '7+ years cloud engineering experience.',
        skills: ['AWS', 'Kubernetes', 'Go'],
        salary_min: 190000,
        salary_max: 240000,
        location: 'San Francisco, CA',
        job_type: 'full-time',
        experience_level: 'lead',
        is_remote: true,
      },
      recruiterToken
    );
    assert(newJobRes.status === 201 && newJobRes.body.job.id, 'Recruiter creates new job listing');
    const createdJobId = newJobRes.body.job.id;

    // 8. Seeker: Bookmark Job
    console.log('\n[8] Testing Job Bookmarking:');
    const saveJobRes = await request('POST', `/api/profile/saved-jobs/${createdJobId}`, {}, seekerToken);
    assert(saveJobRes.status === 200, 'Seeker bookmarks job');

    const getSaved = await request('GET', '/api/profile/saved-jobs', null, seekerToken);
    assert(getSaved.body.savedJobs.some((s) => s.id === createdJobId), 'Saved job appears in seeker saved list');

    // 9. Seeker: Apply for Job
    console.log('\n[9] Testing Application Workflow:');
    const applyRes = await request(
      'POST',
      `/api/applications/jobs/${createdJobId}/apply`,
      { coverLetter: 'I am thrilled to apply for the Principal Cloud Architect role!' },
      seekerToken
    );
    assert(applyRes.status === 201 && applyRes.body.application.id, 'Candidate submits job application');
    const applicationId = applyRes.body.application.id;

    // 10. Duplicate Application Prevention
    console.log('\n[10] Testing Duplicate Application Prevention:');
    const duplicateApp = await request(
      'POST',
      `/api/applications/jobs/${createdJobId}/apply`,
      { coverLetter: 'Trying again' },
      seekerToken
    );
    assert(duplicateApp.status === 409, 'Duplicate application is rejected with HTTP 409');

    // 11. Recruiter reviews applicants & updates status
    console.log('\n[11] Testing Recruiter Applicant Pipeline:');
    const applicantsRes = await request('GET', `/api/applications/jobs/${createdJobId}/applicants`, null, recruiterToken);
    assert(applicantsRes.status === 200 && applicantsRes.body.applicants.length > 0, 'Recruiter fetches applicants for job');

    const statusUpdate = await request(
      'PATCH',
      `/api/applications/${applicationId}/status`,
      { status: 'shortlisted' },
      recruiterToken
    );
    assert(statusUpdate.status === 200 && statusUpdate.body.application.status === 'shortlisted', 'Recruiter updates candidate status');

    // 12. Recruiter schedules interview
    console.log('\n[12] Testing Interview Scheduling:');
    const interviewRes = await request(
      'POST',
      `/api/applications/${applicationId}/interview`,
      {
        scheduledAt: '2026-11-12T14:00:00Z',
        durationMinutes: 60,
        meetingLink: 'https://meet.google.com/hirehub-principal-architect',
        notes: 'Round 1 System Architecture Interview',
      },
      recruiterToken
    );
    assert(interviewRes.status === 201 && interviewRes.body.interview.meeting_link, 'Recruiter schedules candidate interview');

    // 13. Job Seeker views updated status
    console.log('\n[13] Testing Seeker Application Status Reflection:');
    const myApps = await request('GET', '/api/applications/my', null, seekerToken);
    const updatedApp = myApps.body.applications.find((a) => a.id === applicationId);
    assert(updatedApp && updatedApp.status === 'interview_scheduled', 'Seeker sees updated interview_scheduled status');

    // 14. Recruiter Isolation & Authorization Checks
    console.log('\n[14] Testing Recruiter Isolation & RBAC:');
    const otherRecruiterLogin = await request('POST', '/api/auth/login', {
      email: 'marcus.hr@cloudscale.io',
      password: 'Password123!',
    });
    const otherRecruiterToken = otherRecruiterLogin.body.token;

    // Other recruiter should NOT be able to view applicants of Sarah's job
    const unauthorizedView = await request(
      'GET',
      `/api/applications/jobs/${createdJobId}/applicants`,
      null,
      otherRecruiterToken
    );
    assert(unauthorizedView.status === 403, 'Recruiter cannot access applicants of unrelated employer (HTTP 403)');

    // Other recruiter should NOT be able to edit Sarah's job
    const unauthorizedEdit = await request(
      'PUT',
      `/api/jobs/${createdJobId}`,
      { title: 'Hacked Title' },
      otherRecruiterToken
    );
    assert(unauthorizedEdit.status === 403, 'Recruiter cannot modify another recruiter’s job (HTTP 403)');

    // 15. Admin Operations
    console.log('\n[15] Testing Admin Governance:');
    const adminStats = await request('GET', '/api/admin/stats', null, adminToken);
    assert(adminStats.status === 200 && adminStats.body.stats.total_users > 0, 'Admin accesses system stats');

    const adminUsers = await request('GET', '/api/admin/users', null, adminToken);
    assert(adminUsers.status === 200 && adminUsers.body.users.length > 0, 'Admin lists all users');

    console.log(`\n========================================`);
    console.log(`🎯 Test Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (serverInstance) serverInstance.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    if (serverInstance) serverInstance.close();
    process.exit(1);
  }
};

runTests();

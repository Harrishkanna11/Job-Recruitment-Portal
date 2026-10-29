// Database Service with complete data operations
import db, { getStore, persist, isPg, query } from '../database/db.js';

export const dbService = {
  // ================= USERS =================
  async findUserByEmail(email) {
    if (isPg()) {
      const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      return res.rows[0] || null;
    }
    const store = getStore();
    return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id) {
    if (isPg()) {
      const res = await query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    const store = getStore();
    return store.users.find((u) => u.id === Number(id)) || null;
  },

  async createUser({ email, password_hash, role, account_status = 'active' }) {
    if (isPg()) {
      const res = await query(
        `INSERT INTO users (email, password_hash, role, account_status)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [email, password_hash, role, account_status]
      );
      return res.rows[0];
    }
    const store = getStore();
    store.counters.users = (store.counters.users || store.users.length) + 1;
    const newUser = {
      id: store.counters.users,
      email,
      password_hash,
      role,
      account_status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.users.push(newUser);
    persist();
    return newUser;
  },

  async updateUserStatus(id, status) {
    if (isPg()) {
      const res = await query('UPDATE users SET account_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [status, id]);
      return res.rows[0];
    }
    const store = getStore();
    const user = store.users.find((u) => u.id === Number(id));
    if (user) {
      user.account_status = status;
      user.updated_at = new Date().toISOString();
      persist();
    }
    return user;
  },

  async listUsers({ search, role, status, limit = 50, offset = 0 } = {}) {
    if (isPg()) {
      let sql = 'SELECT id, email, role, account_status, created_at, updated_at FROM users WHERE 1=1';
      const params = [];
      if (search) {
        params.push(`%${search}%`);
        sql += ` AND email ILIKE $${params.length}`;
      }
      if (role && role !== 'all') {
        params.push(role);
        sql += ` AND role = $${params.length}`;
      }
      if (status && status !== 'all') {
        params.push(status);
        sql += ` AND account_status = $${params.length}`;
      }
      sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);
      const res = await query(sql, params);
      return res.rows;
    }

    const store = getStore();
    let result = store.users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      account_status: u.account_status,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.email.toLowerCase().includes(q));
    }
    if (role && role !== 'all') {
      result = result.filter((u) => u.role === role);
    }
    if (status && status !== 'all') {
      result = result.filter((u) => u.account_status === status);
    }
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return result.slice(offset, offset + limit);
  },

  // ================= SEEKER PROFILES =================
  async getSeekerProfile(userId) {
    if (isPg()) {
      const res = await query(
        `SELECT p.*, u.email, u.role, u.account_status
         FROM job_seeker_profiles p
         JOIN users u ON u.id = p.user_id
         WHERE p.user_id = $1`,
        [userId]
      );
      if (res.rows[0]) {
        res.rows[0].skills = parseJsonSafely(res.rows[0].skills, []);
        res.rows[0].experience = parseJsonSafely(res.rows[0].experience, []);
        res.rows[0].education = parseJsonSafely(res.rows[0].education, []);
      }
      return res.rows[0] || null;
    }

    const store = getStore();
    const user = store.users.find((u) => u.id === Number(userId));
    if (!user) return null;
    let profile = store.job_seeker_profiles.find((p) => p.user_id === Number(userId));
    if (!profile) return null;

    return {
      ...profile,
      email: user.email,
      role: user.role,
      account_status: user.account_status,
      skills: parseJsonSafely(profile.skills, []),
      experience: parseJsonSafely(profile.experience, []),
      education: parseJsonSafely(profile.education, []),
    };
  },

  async upsertSeekerProfile(userId, profileData) {
    const skillsJson = JSON.stringify(profileData.skills || []);
    const experienceJson = JSON.stringify(profileData.experience || []);
    const educationJson = JSON.stringify(profileData.education || []);

    if (isPg()) {
      const existing = await query('SELECT id FROM job_seeker_profiles WHERE user_id = $1', [userId]);
      if (existing.rows.length > 0) {
        const res = await query(
          `UPDATE job_seeker_profiles
           SET full_name = $1, headline = $2, phone = $3, location = $4, bio = $5,
               skills = $6, experience = $7, education = $8, portfolio_url = $9,
               github_url = $10, linkedin_url = $11,
               resume_path = COALESCE($12, resume_path),
               resume_original_name = COALESCE($13, resume_original_name),
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $14 RETURNING *`,
          [
            profileData.full_name,
            profileData.headline || '',
            profileData.phone || '',
            profileData.location || '',
            profileData.bio || '',
            skillsJson,
            experienceJson,
            educationJson,
            profileData.portfolio_url || '',
            profileData.github_url || '',
            profileData.linkedin_url || '',
            profileData.resume_path || null,
            profileData.resume_original_name || null,
            userId,
          ]
        );
        return res.rows[0];
      } else {
        const res = await query(
          `INSERT INTO job_seeker_profiles
           (user_id, full_name, headline, phone, location, bio, skills, experience, education, portfolio_url, github_url, linkedin_url, resume_path, resume_original_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
          [
            userId,
            profileData.full_name,
            profileData.headline || '',
            profileData.phone || '',
            profileData.location || '',
            profileData.bio || '',
            skillsJson,
            experienceJson,
            educationJson,
            profileData.portfolio_url || '',
            profileData.github_url || '',
            profileData.linkedin_url || '',
            profileData.resume_path || null,
            profileData.resume_original_name || null,
          ]
        );
        return res.rows[0];
      }
    }

    const store = getStore();
    let profile = store.job_seeker_profiles.find((p) => p.user_id === Number(userId));
    if (profile) {
      Object.assign(profile, {
        full_name: profileData.full_name !== undefined ? profileData.full_name : profile.full_name,
        headline: profileData.headline !== undefined ? profileData.headline : profile.headline,
        phone: profileData.phone !== undefined ? profileData.phone : profile.phone,
        location: profileData.location !== undefined ? profileData.location : profile.location,
        bio: profileData.bio !== undefined ? profileData.bio : profile.bio,
        skills: skillsJson,
        experience: experienceJson,
        education: educationJson,
        portfolio_url: profileData.portfolio_url !== undefined ? profileData.portfolio_url : profile.portfolio_url,
        github_url: profileData.github_url !== undefined ? profileData.github_url : profile.github_url,
        linkedin_url: profileData.linkedin_url !== undefined ? profileData.linkedin_url : profile.linkedin_url,
        resume_path: profileData.resume_path || profile.resume_path,
        resume_original_name: profileData.resume_original_name || profile.resume_original_name,
        updated_at: new Date().toISOString(),
      });
    } else {
      store.counters.job_seeker_profiles = (store.counters.job_seeker_profiles || store.job_seeker_profiles.length) + 1;
      profile = {
        id: store.counters.job_seeker_profiles,
        user_id: Number(userId),
        full_name: profileData.full_name || 'Job Seeker',
        headline: profileData.headline || '',
        phone: profileData.phone || '',
        location: profileData.location || '',
        bio: profileData.bio || '',
        skills: skillsJson,
        experience: experienceJson,
        education: educationJson,
        portfolio_url: profileData.portfolio_url || '',
        github_url: profileData.github_url || '',
        linkedin_url: profileData.linkedin_url || '',
        resume_path: profileData.resume_path || '',
        resume_original_name: profileData.resume_original_name || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.job_seeker_profiles.push(profile);
    }
    persist();
    return {
      ...profile,
      skills: parseJsonSafely(profile.skills, []),
      experience: parseJsonSafely(profile.experience, []),
      education: parseJsonSafely(profile.education, []),
    };
  },

  // ================= RECRUITER PROFILES & COMPANIES =================
  async getRecruiterProfile(userId) {
    if (isPg()) {
      const res = await query(
        `SELECT rp.*, c.name as company_name, c.description as company_description,
                c.industry as company_industry, c.website as company_website,
                c.logo_url as company_logo_url, c.location as company_location,
                c.size as company_size, c.is_verified as company_is_verified,
                u.email, u.role, u.account_status
         FROM recruiter_profiles rp
         JOIN users u ON u.id = rp.user_id
         LEFT JOIN companies c ON c.id = rp.company_id
         WHERE rp.user_id = $1`,
        [userId]
      );
      return res.rows[0] || null;
    }

    const store = getStore();
    const user = store.users.find((u) => u.id === Number(userId));
    if (!user) return null;
    const rp = store.recruiter_profiles.find((r) => r.user_id === Number(userId));
    if (!rp) return null;
    const company = store.companies.find((c) => c.id === rp.company_id) || {};

    return {
      ...rp,
      email: user.email,
      role: user.role,
      account_status: user.account_status,
      company_name: company.name || '',
      company_description: company.description || '',
      company_industry: company.industry || '',
      company_website: company.website || '',
      company_logo_url: company.logo_url || '',
      company_location: company.location || '',
      company_size: company.size || '',
      company_is_verified: company.is_verified || false,
    };
  },

  async upsertRecruiterProfile(userId, { full_name, phone, title, company_id }) {
    if (isPg()) {
      const existing = await query('SELECT id FROM recruiter_profiles WHERE user_id = $1', [userId]);
      if (existing.rows.length > 0) {
        const res = await query(
          `UPDATE recruiter_profiles
           SET full_name = $1, phone = $2, title = $3, company_id = COALESCE($4, company_id), updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $5 RETURNING *`,
          [full_name, phone, title, company_id, userId]
        );
        return res.rows[0];
      } else {
        const res = await query(
          `INSERT INTO recruiter_profiles (user_id, company_id, full_name, phone, title)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [userId, company_id, full_name, phone, title]
        );
        return res.rows[0];
      }
    }

    const store = getStore();
    let profile = store.recruiter_profiles.find((r) => r.user_id === Number(userId));
    if (profile) {
      profile.full_name = full_name !== undefined ? full_name : profile.full_name;
      profile.phone = phone !== undefined ? phone : profile.phone;
      profile.title = title !== undefined ? title : profile.title;
      if (company_id !== undefined) profile.company_id = company_id;
      profile.updated_at = new Date().toISOString();
    } else {
      store.counters.recruiter_profiles = (store.counters.recruiter_profiles || store.recruiter_profiles.length) + 1;
      profile = {
        id: store.counters.recruiter_profiles,
        user_id: Number(userId),
        company_id: company_id || null,
        full_name,
        phone,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      store.recruiter_profiles.push(profile);
    }
    persist();
    return profile;
  },

  async getCompanyById(id) {
    if (isPg()) {
      const res = await query('SELECT * FROM companies WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    const store = getStore();
    return store.companies.find((c) => c.id === Number(id)) || null;
  },

  async upsertCompany(companyData) {
    if (isPg()) {
      if (companyData.id) {
        const res = await query(
          `UPDATE companies
           SET name = $1, description = $2, industry = $3, website = $4,
               logo_url = $5, location = $6, size = $7, updated_at = CURRENT_TIMESTAMP
           WHERE id = $8 RETURNING *`,
          [
            companyData.name,
            companyData.description,
            companyData.industry,
            companyData.website,
            companyData.logo_url,
            companyData.location,
            companyData.size,
            companyData.id,
          ]
        );
        return res.rows[0];
      } else {
        const res = await query(
          `INSERT INTO companies (name, description, industry, website, logo_url, location, size)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            companyData.name,
            companyData.description,
            companyData.industry,
            companyData.website,
            companyData.logo_url,
            companyData.location,
            companyData.size,
          ]
        );
        return res.rows[0];
      }
    }

    const store = getStore();
    if (companyData.id) {
      const comp = store.companies.find((c) => c.id === Number(companyData.id));
      if (comp) {
        Object.assign(comp, {
          ...companyData,
          updated_at: new Date().toISOString(),
        });
        persist();
        return comp;
      }
    }
    store.counters.companies = (store.counters.companies || store.companies.length) + 1;
    const newComp = {
      id: store.counters.companies,
      name: companyData.name,
      description: companyData.description || '',
      industry: companyData.industry || 'Technology',
      website: companyData.website || '',
      logo_url: companyData.logo_url || '',
      location: companyData.location || '',
      size: companyData.size || '10-50',
      is_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.companies.push(newComp);
    persist();
    return newComp;
  },

  async verifyCompany(companyId, isVerified) {
    if (isPg()) {
      const res = await query('UPDATE companies SET is_verified = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [isVerified, companyId]);
      return res.rows[0];
    }
    const store = getStore();
    const comp = store.companies.find((c) => c.id === Number(companyId));
    if (comp) {
      comp.is_verified = Boolean(isVerified);
      comp.updated_at = new Date().toISOString();
      persist();
    }
    return comp;
  },

  async listCompanies() {
    if (isPg()) {
      const res = await query('SELECT * FROM companies ORDER BY is_verified DESC, name ASC');
      return res.rows;
    }
    const store = getStore();
    return [...store.companies].sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
  },

  // ================= JOBS =================
  async listJobs({
    search = '',
    title = '',
    company = '',
    skills = '',
    location = '',
    jobType = '',
    experienceLevel = '',
    minSalary = null,
    maxSalary = null,
    isRemote = null,
    category = '',
    status = 'published',
    recruiterId = null,
    sortBy = 'newest',
    limit = 20,
    offset = 0,
  } = {}) {
    if (isPg()) {
      let sql = `
        SELECT j.*, c.name as company_name, c.logo_url as company_logo_url,
               c.website as company_website, c.is_verified as company_is_verified,
               (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicants_count
        FROM jobs j
        LEFT JOIN companies c ON c.id = j.company_id
        WHERE 1=1
      `;
      const params = [];

      if (status && status !== 'all') {
        params.push(status);
        sql += ` AND j.status = $${params.length}`;
      }
      if (recruiterId) {
        params.push(recruiterId);
        sql += ` AND j.recruiter_id = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        const idx = params.length;
        sql += ` AND (j.title ILIKE $${idx} OR c.name ILIKE $${idx} OR j.description ILIKE $${idx} OR j.skills ILIKE $${idx})`;
      }
      if (title) {
        params.push(`%${title}%`);
        sql += ` AND j.title ILIKE $${params.length}`;
      }
      if (company) {
        params.push(`%${company}%`);
        sql += ` AND c.name ILIKE $${params.length}`;
      }
      if (skills) {
        params.push(`%${skills}%`);
        sql += ` AND j.skills ILIKE $${params.length}`;
      }
      if (location) {
        params.push(`%${location}%`);
        sql += ` AND j.location ILIKE $${params.length}`;
      }
      if (jobType && jobType !== 'all') {
        params.push(jobType);
        sql += ` AND j.job_type = $${params.length}`;
      }
      if (experienceLevel && experienceLevel !== 'all') {
        params.push(experienceLevel);
        sql += ` AND j.experience_level = $${params.length}`;
      }
      if (category && category !== 'all') {
        params.push(category);
        sql += ` AND j.category = $${params.length}`;
      }
      if (isRemote === true || isRemote === 'true') {
        sql += ' AND j.is_remote = TRUE';
      }
      if (minSalary) {
        params.push(Number(minSalary));
        sql += ` AND j.salary_max >= $${params.length}`;
      }
      if (maxSalary) {
        params.push(Number(maxSalary));
        sql += ` AND j.salary_min <= $${params.length}`;
      }

      if (sortBy === 'salary') {
        sql += ' ORDER BY j.salary_max DESC, j.created_at DESC';
      } else if (sortBy === 'views') {
        sql += ' ORDER BY j.views_count DESC, j.created_at DESC';
      } else {
        sql += ' ORDER BY j.created_at DESC';
      }

      const countSql = `SELECT COUNT(*) FROM (${sql}) as total_count`;
      const countRes = await query(countSql, params);
      const total = parseInt(countRes.rows[0]?.count || 0, 10);

      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const res = await query(sql, params);
      const jobs = res.rows.map((j) => ({
        ...j,
        skills: parseJsonSafely(j.skills, []),
        applicants_count: parseInt(j.applicants_count || 0, 10),
      }));

      return { jobs, total };
    }

    const store = getStore();
    let list = store.jobs.map((j) => {
      const companyObj = store.companies.find((c) => c.id === j.company_id) || {};
      const appsCount = store.applications.filter((a) => a.job_id === j.id).length;
      return {
        ...j,
        company_name: companyObj.name || 'HireHub Partner',
        company_logo_url: companyObj.logo_url || '',
        company_website: companyObj.website || '',
        company_is_verified: companyObj.is_verified || false,
        applicants_count: appsCount,
        skills: parseJsonSafely(j.skills, []),
      };
    });

    if (status && status !== 'all') {
      list = list.filter((j) => j.status === status);
    }
    if (recruiterId) {
      list = list.filter((j) => j.recruiter_id === Number(recruiterId));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        j.company_name.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        (Array.isArray(j.skills) && j.skills.some((s) => s.toLowerCase().includes(q)))
      );
    }
    if (title) {
      const q = title.toLowerCase();
      list = list.filter((j) => j.title.toLowerCase().includes(q));
    }
    if (company) {
      const q = company.toLowerCase();
      list = list.filter((j) => j.company_name.toLowerCase().includes(q));
    }
    if (skills) {
      const q = skills.toLowerCase();
      list = list.filter((j) => Array.isArray(j.skills) && j.skills.some((s) => s.toLowerCase().includes(q)));
    }
    if (location) {
      const q = location.toLowerCase();
      list = list.filter((j) => j.location.toLowerCase().includes(q));
    }
    if (jobType && jobType !== 'all') {
      list = list.filter((j) => j.job_type === jobType);
    }
    if (experienceLevel && experienceLevel !== 'all') {
      list = list.filter((j) => j.experience_level === experienceLevel);
    }
    if (category && category !== 'all') {
      list = list.filter((j) => j.category === category);
    }
    if (isRemote === true || isRemote === 'true') {
      list = list.filter((j) => j.is_remote);
    }
    if (minSalary) {
      list = list.filter((j) => j.salary_max >= Number(minSalary));
    }
    if (maxSalary) {
      list = list.filter((j) => j.salary_min <= Number(maxSalary));
    }

    if (sortBy === 'salary') {
      list.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
    } else if (sortBy === 'views') {
      list.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    const total = list.length;
    const paginated = list.slice(offset, offset + limit);
    return { jobs: paginated, total };
  },

  async getJobById(id) {
    if (isPg()) {
      const res = await query(
        `SELECT j.*, c.name as company_name, c.description as company_description,
                c.logo_url as company_logo_url, c.website as company_website,
                c.location as company_location, c.size as company_size,
                c.industry as company_industry, c.is_verified as company_is_verified,
                rp.full_name as recruiter_name, rp.title as recruiter_title,
                (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicants_count
         FROM jobs j
         LEFT JOIN companies c ON c.id = j.company_id
         LEFT JOIN recruiter_profiles rp ON rp.user_id = j.recruiter_id
         WHERE j.id = $1`,
        [id]
      );
      if (res.rows[0]) {
        res.rows[0].skills = parseJsonSafely(res.rows[0].skills, []);
        res.rows[0].applicants_count = parseInt(res.rows[0].applicants_count || 0, 10);
      }
      return res.rows[0] || null;
    }

    const store = getStore();
    const job = store.jobs.find((j) => j.id === Number(id));
    if (!job) return null;
    const company = store.companies.find((c) => c.id === job.company_id) || {};
    const rp = store.recruiter_profiles.find((r) => r.user_id === job.recruiter_id) || {};
    const appsCount = store.applications.filter((a) => a.job_id === job.id).length;

    return {
      ...job,
      company_name: company.name || 'HireHub Partner',
      company_description: company.description || '',
      company_logo_url: company.logo_url || '',
      company_website: company.website || '',
      company_location: company.location || '',
      company_size: company.size || '',
      company_industry: company.industry || '',
      company_is_verified: company.is_verified || false,
      recruiter_name: rp.full_name || '',
      recruiter_title: rp.title || '',
      applicants_count: appsCount,
      skills: parseJsonSafely(job.skills, []),
    };
  },

  async incrementJobViews(id) {
    if (isPg()) {
      await query('UPDATE jobs SET views_count = views_count + 1 WHERE id = $1', [id]);
      return;
    }
    const store = getStore();
    const job = store.jobs.find((j) => j.id === Number(id));
    if (job) {
      job.views_count = (job.views_count || 0) + 1;
      persist();
    }
  },

  async createJob(jobData) {
    const skillsJson = JSON.stringify(jobData.skills || []);
    if (isPg()) {
      const res = await query(
        `INSERT INTO jobs
         (recruiter_id, company_id, title, description, requirements, skills, salary_min, salary_max, salary_currency, location, job_type, experience_level, is_remote, category, status, deadline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING *`,
        [
          jobData.recruiter_id,
          jobData.company_id || null,
          jobData.title,
          jobData.description,
          jobData.requirements || '',
          skillsJson,
          jobData.salary_min || 0,
          jobData.salary_max || 0,
          jobData.salary_currency || 'USD',
          jobData.location,
          jobData.job_type || 'full-time',
          jobData.experience_level || 'mid',
          Boolean(jobData.is_remote),
          jobData.category || 'Software Development',
          jobData.status || 'published',
          jobData.deadline || null,
        ]
      );
      return res.rows[0];
    }

    const store = getStore();
    store.counters.jobs = (store.counters.jobs || store.jobs.length) + 1;
    const newJob = {
      id: store.counters.jobs,
      recruiter_id: Number(jobData.recruiter_id),
      company_id: jobData.company_id ? Number(jobData.company_id) : null,
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements || '',
      skills: skillsJson,
      salary_min: Number(jobData.salary_min) || 0,
      salary_max: Number(jobData.salary_max) || 0,
      salary_currency: jobData.salary_currency || 'USD',
      location: jobData.location,
      job_type: jobData.job_type || 'full-time',
      experience_level: jobData.experience_level || 'mid',
      is_remote: Boolean(jobData.is_remote),
      category: jobData.category || 'Software Development',
      status: jobData.status || 'published',
      views_count: 0,
      deadline: jobData.deadline || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.jobs.push(newJob);
    persist();
    return newJob;
  },

  async updateJob(id, jobData) {
    const skillsJson = jobData.skills ? JSON.stringify(jobData.skills) : undefined;
    if (isPg()) {
      const res = await query(
        `UPDATE jobs
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             requirements = COALESCE($3, requirements),
             skills = COALESCE($4, skills),
             salary_min = COALESCE($5, salary_min),
             salary_max = COALESCE($6, salary_max),
             location = COALESCE($7, location),
             job_type = COALESCE($8, job_type),
             experience_level = COALESCE($9, experience_level),
             is_remote = COALESCE($10, is_remote),
             category = COALESCE($11, category),
             status = COALESCE($12, status),
             deadline = COALESCE($13, deadline),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $14 RETURNING *`,
        [
          jobData.title,
          jobData.description,
          jobData.requirements,
          skillsJson,
          jobData.salary_min,
          jobData.salary_max,
          jobData.location,
          jobData.job_type,
          jobData.experience_level,
          jobData.is_remote,
          jobData.category,
          jobData.status,
          jobData.deadline,
          id,
        ]
      );
      return res.rows[0];
    }

    const store = getStore();
    const job = store.jobs.find((j) => j.id === Number(id));
    if (job) {
      if (jobData.title !== undefined) job.title = jobData.title;
      if (jobData.description !== undefined) job.description = jobData.description;
      if (jobData.requirements !== undefined) job.requirements = jobData.requirements;
      if (skillsJson !== undefined) job.skills = skillsJson;
      if (jobData.salary_min !== undefined) job.salary_min = Number(jobData.salary_min);
      if (jobData.salary_max !== undefined) job.salary_max = Number(jobData.salary_max);
      if (jobData.location !== undefined) job.location = jobData.location;
      if (jobData.job_type !== undefined) job.job_type = jobData.job_type;
      if (jobData.experience_level !== undefined) job.experience_level = jobData.experience_level;
      if (jobData.is_remote !== undefined) job.is_remote = Boolean(jobData.is_remote);
      if (jobData.category !== undefined) job.category = jobData.category;
      if (jobData.status !== undefined) job.status = jobData.status;
      if (jobData.deadline !== undefined) job.deadline = jobData.deadline;
      job.updated_at = new Date().toISOString();
      persist();
    }
    return job;
  },

  async deleteJob(id) {
    if (isPg()) {
      await query('DELETE FROM jobs WHERE id = $1', [id]);
      return true;
    }
    const store = getStore();
    const idx = store.jobs.findIndex((j) => j.id === Number(id));
    if (idx !== -1) {
      store.jobs.splice(idx, 1);
      // Cascade delete applications and saved jobs
      store.applications = store.applications.filter((a) => a.job_id !== Number(id));
      store.saved_jobs = store.saved_jobs.filter((s) => s.job_id !== Number(id));
      persist();
      return true;
    }
    return false;
  },

  // ================= APPLICATIONS =================
  async findApplicationByJobAndSeeker(jobId, seekerId) {
    if (isPg()) {
      const res = await query('SELECT * FROM applications WHERE job_id = $1 AND seeker_id = $2', [jobId, seekerId]);
      return res.rows[0] || null;
    }
    const store = getStore();
    return store.applications.find((a) => a.job_id === Number(jobId) && a.seeker_id === Number(seekerId)) || null;
  },

  async createApplication({ jobId, seekerId, resumePath, coverLetter }) {
    if (isPg()) {
      const res = await query(
        `INSERT INTO applications (job_id, seeker_id, resume_path, cover_letter, status)
         VALUES ($1, $2, $3, $4, 'applied') RETURNING *`,
        [jobId, seekerId, resumePath || '', coverLetter || '']
      );
      return res.rows[0];
    }

    const store = getStore();
    store.counters.applications = (store.counters.applications || store.applications.length) + 1;
    const newApp = {
      id: store.counters.applications,
      job_id: Number(jobId),
      seeker_id: Number(seekerId),
      resume_path: resumePath || '',
      cover_letter: coverLetter || '',
      status: 'applied',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    store.applications.push(newApp);
    persist();
    return newApp;
  },

  async getApplicationById(id) {
    if (isPg()) {
      const res = await query(
        `SELECT a.*, j.title as job_title, j.recruiter_id, j.company_id,
                c.name as company_name, c.logo_url as company_logo_url,
                p.full_name as applicant_name, p.headline as applicant_headline,
                p.phone as applicant_phone, p.location as applicant_location,
                p.skills as applicant_skills, u.email as applicant_email
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         LEFT JOIN companies c ON c.id = j.company_id
         JOIN users u ON u.id = a.seeker_id
         LEFT JOIN job_seeker_profiles p ON p.user_id = a.seeker_id
         WHERE a.id = $1`,
        [id]
      );
      if (res.rows[0]) {
        res.rows[0].applicant_skills = parseJsonSafely(res.rows[0].applicant_skills, []);
      }
      return res.rows[0] || null;
    }

    const store = getStore();
    const app = store.applications.find((a) => a.id === Number(id));
    if (!app) return null;
    const job = store.jobs.find((j) => j.id === app.job_id) || {};
    const comp = store.companies.find((c) => c.id === job.company_id) || {};
    const user = store.users.find((u) => u.id === app.seeker_id) || {};
    const profile = store.job_seeker_profiles.find((p) => p.user_id === app.seeker_id) || {};

    return {
      ...app,
      job_title: job.title || '',
      recruiter_id: job.recruiter_id,
      company_id: job.company_id,
      company_name: comp.name || '',
      company_logo_url: comp.logo_url || '',
      applicant_name: profile.full_name || 'Job Seeker',
      applicant_headline: profile.headline || '',
      applicant_phone: profile.phone || '',
      applicant_location: profile.location || '',
      applicant_skills: parseJsonSafely(profile.skills, []),
      applicant_email: user.email || '',
    };
  },

  async getApplicationsBySeeker(seekerId) {
    if (isPg()) {
      const res = await query(
        `SELECT a.*, j.title as job_title, j.location as job_location,
                j.job_type, j.salary_min, j.salary_max, j.salary_currency, j.status as job_status,
                c.name as company_name, c.logo_url as company_logo_url,
                i.scheduled_at as interview_date, i.meeting_link, i.status as interview_status
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         LEFT JOIN companies c ON c.id = j.company_id
         LEFT JOIN interviews i ON i.application_id = a.id
         WHERE a.seeker_id = $1
         ORDER BY a.created_at DESC`,
        [seekerId]
      );
      return res.rows;
    }

    const store = getStore();
    const apps = store.applications.filter((a) => a.seeker_id === Number(seekerId));
    const result = apps.map((a) => {
      const job = store.jobs.find((j) => j.id === a.job_id) || {};
      const company = store.companies.find((c) => c.id === job.company_id) || {};
      const interview = store.interviews.find((i) => i.application_id === a.id);
      return {
        ...a,
        job_title: job.title || 'Untitled Role',
        job_location: job.location || '',
        job_type: job.job_type || '',
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency || 'USD',
        job_status: job.status || 'published',
        company_name: company.name || 'HireHub Partner',
        company_logo_url: company.logo_url || '',
        interview_date: interview ? interview.scheduled_at : null,
        meeting_link: interview ? interview.meeting_link : null,
        interview_status: interview ? interview.status : null,
      };
    });
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return result;
  },

  async getApplicantsForJob(jobId, { status = 'all', skills = '' } = {}) {
    if (isPg()) {
      let sql = `
        SELECT a.*, p.full_name, p.headline, p.phone, p.location, p.skills,
               p.experience, p.education, p.portfolio_url, p.github_url, p.linkedin_url,
               p.resume_path as profile_resume_path, p.resume_original_name,
               u.email, j.title as job_title,
               i.scheduled_at as interview_date, i.meeting_link
        FROM applications a
        JOIN users u ON u.id = a.seeker_id
        LEFT JOIN job_seeker_profiles p ON p.user_id = a.seeker_id
        JOIN jobs j ON j.id = a.job_id
        LEFT JOIN interviews i ON i.application_id = a.id
        WHERE a.job_id = $1
      `;
      const params = [jobId];
      if (status && status !== 'all') {
        params.push(status);
        sql += ` AND a.status = $${params.length}`;
      }
      if (skills) {
        params.push(`%${skills}%`);
        sql += ` AND p.skills ILIKE $${params.length}`;
      }
      sql += ' ORDER BY a.created_at DESC';
      const res = await query(sql, params);
      return res.rows.map((row) => ({
        ...row,
        skills: parseJsonSafely(row.skills, []),
        experience: parseJsonSafely(row.experience, []),
        education: parseJsonSafely(row.education, []),
      }));
    }

    const store = getStore();
    let apps = store.applications.filter((a) => a.job_id === Number(jobId));
    if (status && status !== 'all') {
      apps = apps.filter((a) => a.status === status);
    }
    const job = store.jobs.find((j) => j.id === Number(jobId)) || {};

    let result = apps.map((a) => {
      const user = store.users.find((u) => u.id === a.seeker_id) || {};
      const profile = store.job_seeker_profiles.find((p) => p.user_id === a.seeker_id) || {};
      const interview = store.interviews.find((i) => i.application_id === a.id);
      return {
        ...a,
        job_title: job.title || '',
        full_name: profile.full_name || 'Job Seeker',
        headline: profile.headline || '',
        phone: profile.phone || '',
        location: profile.location || '',
        skills: parseJsonSafely(profile.skills, []),
        experience: parseJsonSafely(profile.experience, []),
        education: parseJsonSafely(profile.education, []),
        portfolio_url: profile.portfolio_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        profile_resume_path: profile.resume_path || '',
        resume_original_name: profile.resume_original_name || '',
        email: user.email || '',
        interview_date: interview ? interview.scheduled_at : null,
        meeting_link: interview ? interview.meeting_link : null,
      };
    });

    if (skills) {
      const q = skills.toLowerCase();
      result = result.filter((r) => Array.isArray(r.skills) && r.skills.some((s) => s.toLowerCase().includes(q)));
    }
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return result;
  },

  async getAllApplicantsForRecruiter(recruiterId) {
    if (isPg()) {
      const res = await query(
        `SELECT a.*, p.full_name, p.headline, p.phone, p.location, p.skills,
                p.resume_path as profile_resume_path, p.resume_original_name,
                u.email, j.title as job_title, j.id as job_id,
                i.scheduled_at as interview_date, i.meeting_link
         FROM applications a
         JOIN jobs j ON j.id = a.job_id
         JOIN users u ON u.id = a.seeker_id
         LEFT JOIN job_seeker_profiles p ON p.user_id = a.seeker_id
         LEFT JOIN interviews i ON i.application_id = a.id
         WHERE j.recruiter_id = $1
         ORDER BY a.created_at DESC`,
        [recruiterId]
      );
      return res.rows.map((row) => ({
        ...row,
        skills: parseJsonSafely(row.skills, []),
      }));
    }

    const store = getStore();
    const recruiterJobs = store.jobs.filter((j) => j.recruiter_id === Number(recruiterId));
    const jobIds = recruiterJobs.map((j) => j.id);
    const apps = store.applications.filter((a) => jobIds.includes(a.job_id));

    const result = apps.map((a) => {
      const job = store.jobs.find((j) => j.id === a.job_id) || {};
      const user = store.users.find((u) => u.id === a.seeker_id) || {};
      const profile = store.job_seeker_profiles.find((p) => p.user_id === a.seeker_id) || {};
      const interview = store.interviews.find((i) => i.application_id === a.id);
      return {
        ...a,
        job_title: job.title || '',
        full_name: profile.full_name || 'Job Seeker',
        headline: profile.headline || '',
        phone: profile.phone || '',
        location: profile.location || '',
        skills: parseJsonSafely(profile.skills, []),
        profile_resume_path: profile.resume_path || '',
        resume_original_name: profile.resume_original_name || '',
        email: user.email || '',
        interview_date: interview ? interview.scheduled_at : null,
        meeting_link: interview ? interview.meeting_link : null,
      };
    });
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return result;
  },

  async updateApplicationStatus(id, status) {
    if (isPg()) {
      const res = await query('UPDATE applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [status, id]);
      return res.rows[0];
    }
    const store = getStore();
    const app = store.applications.find((a) => a.id === Number(id));
    if (app) {
      app.status = status;
      app.updated_at = new Date().toISOString();
      persist();
    }
    return app;
  },

  async deleteApplication(id) {
    if (isPg()) {
      await query('DELETE FROM applications WHERE id = $1', [id]);
      return true;
    }
    const store = getStore();
    const idx = store.applications.findIndex((a) => a.id === Number(id));
    if (idx !== -1) {
      store.applications.splice(idx, 1);
      persist();
      return true;
    }
    return false;
  },

  // ================= INTERVIEWS =================
  async createInterview({ applicationId, recruiterId, seekerId, scheduledAt, durationMinutes = 45, meetingType = 'video', meetingLink = '', notes = '' }) {
    if (isPg()) {
      const res = await query(
        `INSERT INTO interviews (application_id, recruiter_id, seeker_id, scheduled_at, duration_minutes, meeting_type, meeting_link, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [applicationId, recruiterId, seekerId, scheduledAt, durationMinutes, meetingType, meetingLink, notes]
      );
      return res.rows[0];
    }

    const store = getStore();
    store.counters.interviews = (store.counters.interviews || store.interviews.length) + 1;
    const newInterview = {
      id: store.counters.interviews,
      application_id: Number(applicationId),
      recruiter_id: Number(recruiterId),
      seeker_id: Number(seekerId),
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      meeting_type: meetingType,
      meeting_link: meetingLink,
      notes,
      status: 'scheduled',
      created_at: new Date().toISOString(),
    };
    store.interviews.push(newInterview);
    persist();
    return newInterview;
  },

  // ================= SAVED JOBS =================
  async saveJob(seekerId, jobId) {
    if (isPg()) {
      const res = await query(
        `INSERT INTO saved_jobs (seeker_id, job_id)
         VALUES ($1, $2)
         ON CONFLICT (seeker_id, job_id) DO NOTHING
         RETURNING *`,
        [seekerId, jobId]
      );
      return res.rows[0] || null;
    }

    const store = getStore();
    const existing = store.saved_jobs.find((s) => s.seeker_id === Number(seekerId) && s.job_id === Number(jobId));
    if (existing) return existing;

    store.counters.saved_jobs = (store.counters.saved_jobs || store.saved_jobs.length) + 1;
    const item = {
      id: store.counters.saved_jobs,
      seeker_id: Number(seekerId),
      job_id: Number(jobId),
      created_at: new Date().toISOString(),
    };
    store.saved_jobs.push(item);
    persist();
    return item;
  },

  async removeSavedJob(seekerId, jobId) {
    if (isPg()) {
      await query('DELETE FROM saved_jobs WHERE seeker_id = $1 AND job_id = $2', [seekerId, jobId]);
      return true;
    }
    const store = getStore();
    const idx = store.saved_jobs.findIndex((s) => s.seeker_id === Number(seekerId) && s.job_id === Number(jobId));
    if (idx !== -1) {
      store.saved_jobs.splice(idx, 1);
      persist();
      return true;
    }
    return false;
  },

  async getSavedJobs(seekerId) {
    if (isPg()) {
      const res = await query(
        `SELECT sj.id as saved_id, sj.created_at as saved_at, j.*,
                c.name as company_name, c.logo_url as company_logo_url
         FROM saved_jobs sj
         JOIN jobs j ON j.id = sj.job_id
         LEFT JOIN companies c ON c.id = j.company_id
         WHERE sj.seeker_id = $1
         ORDER BY sj.created_at DESC`,
        [seekerId]
      );
      return res.rows.map((j) => ({
        ...j,
        skills: parseJsonSafely(j.skills, []),
      }));
    }

    const store = getStore();
    const items = store.saved_jobs.filter((s) => s.seeker_id === Number(seekerId));
    const result = items.map((s) => {
      const job = store.jobs.find((j) => j.id === s.job_id) || {};
      const comp = store.companies.find((c) => c.id === job.company_id) || {};
      return {
        ...job,
        saved_id: s.id,
        saved_at: s.created_at,
        company_name: comp.name || 'HireHub Partner',
        company_logo_url: comp.logo_url || '',
        skills: parseJsonSafely(job.skills, []),
      };
    });
    result.sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));
    return result;
  },

  // ================= NOTIFICATIONS =================
  async createNotification({ userId, title, message, link = '' }) {
    if (isPg()) {
      const res = await query(
        `INSERT INTO notifications (user_id, title, message, link, is_read)
         VALUES ($1, $2, $3, $4, FALSE) RETURNING *`,
        [userId, title, message, link]
      );
      return res.rows[0];
    }

    const store = getStore();
    store.counters.notifications = (store.counters.notifications || store.notifications.length) + 1;
    const item = {
      id: store.counters.notifications,
      user_id: Number(userId),
      title,
      message,
      link,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    store.notifications.push(item);
    persist();
    return item;
  },

  async getNotificationsByUser(userId) {
    if (isPg()) {
      const res = await query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return res.rows;
    }
    const store = getStore();
    const list = store.notifications.filter((n) => n.user_id === Number(userId));
    return [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async markNotificationAsRead(id, userId) {
    if (isPg()) {
      await query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [id, userId]);
      return true;
    }
    const store = getStore();
    const item = store.notifications.find((n) => n.id === Number(id) && n.user_id === Number(userId));
    if (item) {
      item.is_read = true;
      persist();
      return true;
    }
    return false;
  },

  async markAllNotificationsAsRead(userId) {
    if (isPg()) {
      await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
      return true;
    }
    const store = getStore();
    store.notifications.forEach((n) => {
      if (n.user_id === Number(userId)) {
        n.is_read = true;
      }
    });
    persist();
    return true;
  },

  // ================= REPORTS & AUDIT LOGS =================
  async createReport({ reporterId, jobId, reason, details = '' }) {
    if (isPg()) {
      const res = await query(
        `INSERT INTO reports (reporter_id, job_id, reason, details)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [reporterId, jobId, reason, details]
      );
      return res.rows[0];
    }
    const store = getStore();
    store.counters.reports = (store.counters.reports || store.reports.length) + 1;
    const rep = {
      id: store.counters.reports,
      reporter_id: Number(reporterId),
      job_id: Number(jobId),
      reason,
      details,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    store.reports.push(rep);
    persist();
    return rep;
  },

  async listReports() {
    if (isPg()) {
      const res = await query(
        `SELECT r.*, j.title as job_title, u.email as reporter_email
         FROM reports r
         JOIN jobs j ON j.id = r.job_id
         JOIN users u ON u.id = r.reporter_id
         ORDER BY r.created_at DESC`
      );
      return res.rows;
    }
    const store = getStore();
    return store.reports.map((r) => {
      const job = store.jobs.find((j) => j.id === r.job_id) || {};
      const user = store.users.find((u) => u.id === r.reporter_id) || {};
      return {
        ...r,
        job_title: job.title || 'Unknown Job',
        reporter_email: user.email || 'Anonymous',
      };
    });
  },

  async updateReportStatus(id, status) {
    if (isPg()) {
      await query('UPDATE reports SET status = $1 WHERE id = $2', [status, id]);
      return true;
    }
    const store = getStore();
    const rep = store.reports.find((r) => r.id === Number(id));
    if (rep) {
      rep.status = status;
      persist();
      return true;
    }
    return false;
  },

  async createAuditLog({ adminId, action, targetType, targetId, details, ipAddress = '127.0.0.1' }) {
    if (isPg()) {
      const res = await query(
        `INSERT INTO audit_logs (admin_id, action, target_type, target_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [adminId, action, targetType, targetId, details, ipAddress]
      );
      return res.rows[0];
    }
    const store = getStore();
    store.counters.audit_logs = (store.counters.audit_logs || store.audit_logs.length) + 1;
    const log = {
      id: store.counters.audit_logs,
      admin_id: adminId ? Number(adminId) : null,
      action,
      target_type: targetType,
      target_id: targetId ? Number(targetId) : null,
      details,
      ip_address: ipAddress,
      created_at: new Date().toISOString(),
    };
    store.audit_logs.push(log);
    persist();
    return log;
  },

  async listAuditLogs(limit = 50) {
    if (isPg()) {
      const res = await query(
        `SELECT a.*, u.email as admin_email
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.admin_id
         ORDER BY a.created_at DESC LIMIT $1`,
        [limit]
      );
      return res.rows;
    }
    const store = getStore();
    const list = store.audit_logs.map((a) => {
      const user = store.users.find((u) => u.id === a.admin_id) || {};
      return {
        ...a,
        admin_email: user.email || 'System',
      };
    });
    return list.slice(0, limit);
  },

  // ================= PLATFORM & ROLE STATS =================
  async getPlatformStats() {
    if (isPg()) {
      const jobsCountRes = await query("SELECT COUNT(*) FROM jobs WHERE status = 'published'");
      const compCountRes = await query("SELECT COUNT(*) FROM companies");
      const hiresCountRes = await query("SELECT COUNT(*) FROM applications WHERE status = 'hired'");
      const seekersCountRes = await query("SELECT COUNT(*) FROM users WHERE role = 'job_seeker'");

      return {
        total_active_jobs: parseInt(jobsCountRes.rows[0]?.count || 0, 10),
        total_companies: parseInt(compCountRes.rows[0]?.count || 0, 10),
        successful_placements: parseInt(hiresCountRes.rows[0]?.count || 0, 10),
        total_job_seekers: parseInt(seekersCountRes.rows[0]?.count || 0, 10),
      };
    }

    const store = getStore();
    return {
      total_active_jobs: store.jobs.filter((j) => j.status === 'published').length,
      total_companies: store.companies.length,
      successful_placements: store.applications.filter((a) => a.status === 'hired').length,
      total_job_seekers: store.users.filter((u) => u.role === 'job_seeker').length,
    };
  },

  async getAdminStats() {
    if (isPg()) {
      const userStats = await query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE role = 'job_seeker') as total_seekers,
          COUNT(*) FILTER (WHERE role = 'recruiter') as total_recruiters,
          COUNT(*) FILTER (WHERE role = 'admin') as total_admins
        FROM users
      `);
      const jobStats = await query(`
        SELECT
          COUNT(*) as total_jobs,
          COUNT(*) FILTER (WHERE status = 'published') as active_jobs,
          COUNT(*) FILTER (WHERE status = 'closed') as closed_jobs
        FROM jobs
      `);
      const appStats = await query(`
        SELECT
          COUNT(*) as total_applications,
          COUNT(*) FILTER (WHERE status = 'hired') as hired_count,
          COUNT(*) FILTER (WHERE status = 'interview_scheduled') as interview_count,
          COUNT(*) FILTER (WHERE status = 'shortlisted') as shortlisted_count
        FROM applications
      `);

      return {
        ...userStats.rows[0],
        ...jobStats.rows[0],
        ...appStats.rows[0],
      };
    }

    const store = getStore();
    return {
      total_users: store.users.length,
      total_seekers: store.users.filter((u) => u.role === 'job_seeker').length,
      total_recruiters: store.users.filter((u) => u.role === 'recruiter').length,
      total_admins: store.users.filter((u) => u.role === 'admin').length,
      total_jobs: store.jobs.length,
      active_jobs: store.jobs.filter((j) => j.status === 'published').length,
      closed_jobs: store.jobs.filter((j) => j.status === 'closed').length,
      total_applications: store.applications.length,
      hired_count: store.applications.filter((a) => a.status === 'hired').length,
      interview_count: store.applications.filter((a) => a.status === 'interview_scheduled').length,
      shortlisted_count: store.applications.filter((a) => a.status === 'shortlisted').length,
    };
  },

  async getRecruiterStats(recruiterId) {
    if (isPg()) {
      const res = await query(
        `SELECT
           COUNT(DISTINCT j.id) as total_jobs,
           COALESCE(SUM(j.views_count), 0) as total_views,
           COUNT(DISTINCT a.id) as total_applicants,
           COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'shortlisted') as shortlisted_count,
           COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'interview_scheduled') as interview_count,
           COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'hired') as hired_count
         FROM jobs j
         LEFT JOIN applications a ON a.job_id = j.id
         WHERE j.recruiter_id = $1`,
        [recruiterId]
      );
      return res.rows[0] || {};
    }

    const store = getStore();
    const myJobs = store.jobs.filter((j) => j.recruiter_id === Number(recruiterId));
    const myJobIds = myJobs.map((j) => j.id);
    const myApps = store.applications.filter((a) => myJobIds.includes(a.job_id));

    const totalViews = myJobs.reduce((acc, curr) => acc + (curr.views_count || 0), 0);
    const shortlistedCount = myApps.filter((a) => a.status === 'shortlisted').length;
    const interviewCount = myApps.filter((a) => a.status === 'interview_scheduled').length;
    const hiredCount = myApps.filter((a) => a.status === 'hired').length;

    return {
      total_jobs: myJobs.length,
      total_views: totalViews,
      total_applicants: myApps.length,
      shortlisted_count: shortlistedCount,
      interview_count: interviewCount,
      hired_count: hiredCount,
    };
  },

  async getSeekerStats(seekerId) {
    if (isPg()) {
      const res = await query(
        `SELECT
           COUNT(*) as total_applied,
           COUNT(*) FILTER (WHERE status = 'under_review') as under_review_count,
           COUNT(*) FILTER (WHERE status = 'shortlisted') as shortlisted_count,
           COUNT(*) FILTER (WHERE status = 'interview_scheduled') as interview_count,
           COUNT(*) FILTER (WHERE status = 'hired') as hired_count,
           (SELECT COUNT(*) FROM saved_jobs WHERE seeker_id = $1) as saved_jobs_count
         FROM applications
         WHERE seeker_id = $1`,
        [seekerId]
      );
      return res.rows[0] || {};
    }

    const store = getStore();
    const myApps = store.applications.filter((a) => a.seeker_id === Number(seekerId));
    const savedCount = store.saved_jobs.filter((s) => s.seeker_id === Number(seekerId)).length;

    return {
      total_applied: myApps.length,
      under_review_count: myApps.filter((a) => a.status === 'under_review').length,
      shortlisted_count: myApps.filter((a) => a.status === 'shortlisted').length,
      interview_count: myApps.filter((a) => a.status === 'interview_scheduled').length,
      hired_count: myApps.filter((a) => a.status === 'hired').length,
      saved_jobs_count: savedCount,
    };
  },
};

function parseJsonSafely(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export default dbService;

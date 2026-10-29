import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { getSeedData } from './seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runSeed = async () => {
  console.log('🌱 Seeding HireHub Database with initial enterprise data...');

  const seed = await getSeedData();

  const hasPgEnv = process.env.DATABASE_URL || (process.env.PG_HOST && process.env.PG_DATABASE && process.env.USE_SQLITE !== 'true');

  if (hasPgEnv && process.env.USE_SQLITE !== 'true') {
    const config = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL }
      : {
          host: process.env.PG_HOST || 'localhost',
          port: parseInt(process.env.PG_PORT || '5432', 10),
          database: process.env.PG_DATABASE || 'hirehub_db',
          user: process.env.PG_USER || 'postgres',
          password: process.env.PG_PASSWORD || 'postgres',
        };

    const client = new pg.Client(config);

    try {
      await client.connect();
      console.log('✓ Connected to PostgreSQL server.');

      // Insert Users
      for (const u of seed.users) {
        await client.query(
          `INSERT INTO users (id, email, password_hash, role, account_status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash`,
          [u.id, u.email, u.password_hash, u.role, u.account_status]
        );
      }

      // Insert Companies
      for (const c of seed.companies) {
        await client.query(
          `INSERT INTO companies (id, name, description, industry, website, logo_url, location, size, is_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
          [c.id, c.name, c.description, c.industry, c.website, c.logo_url, c.location, c.size, c.is_verified]
        );
      }

      // Recruiter profiles
      for (const r of seed.recruiter_profiles) {
        await client.query(
          `INSERT INTO recruiter_profiles (id, user_id, company_id, full_name, phone, title)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
          [r.id, r.user_id, r.company_id, r.full_name, r.phone, r.title]
        );
      }

      // Seeker profiles
      for (const s of seed.job_seeker_profiles) {
        await client.query(
          `INSERT INTO job_seeker_profiles (id, user_id, full_name, headline, phone, location, bio, skills, experience, education, portfolio_url, github_url, linkedin_url, resume_path, resume_original_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name`,
          [s.id, s.user_id, s.full_name, s.headline, s.phone, s.location, s.bio, s.skills, s.experience, s.education, s.portfolio_url, s.github_url, s.linkedin_url, s.resume_path, s.resume_original_name]
        );
      }

      // Jobs
      for (const j of seed.jobs) {
        await client.query(
          `INSERT INTO jobs (id, recruiter_id, company_id, title, description, requirements, skills, salary_min, salary_max, salary_currency, location, job_type, experience_level, is_remote, category, status, views_count, deadline)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
           ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title`,
          [j.id, j.recruiter_id, j.company_id, j.title, j.description, j.requirements, j.skills, j.salary_min, j.salary_max, j.salary_currency, j.location, j.job_type, j.experience_level, j.is_remote, j.category, j.status, j.views_count, j.deadline]
        );
      }

      // Reset sequence counters in PG
      await client.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));");
      await client.query("SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));");
      await client.query("SELECT setval('recruiter_profiles_id_seq', (SELECT MAX(id) FROM recruiter_profiles));");
      await client.query("SELECT setval('job_seeker_profiles_id_seq', (SELECT MAX(id) FROM job_seeker_profiles));");
      await client.query("SELECT setval('jobs_id_seq', (SELECT MAX(id) FROM jobs));");

      console.log('✓ Successfully seeded PostgreSQL database with users, jobs, and companies.');
      await client.end();
      process.exit(0);
    } catch (err) {
      console.error('❌ PostgreSQL Seeding encountered error:', err.message);
      console.log('ℹ Falling back to local store file.');
    }
  }

  // Fallback persistent json store
  const storePath = path.join(__dirname, 'dev_store.json');
  const storeData = {
    ...seed,
    counters: {
      users: seed.users.length,
      companies: seed.companies.length,
      recruiter_profiles: seed.recruiter_profiles.length,
      job_seeker_profiles: seed.job_seeker_profiles.length,
      jobs: seed.jobs.length,
      applications: seed.applications.length,
      interviews: seed.interviews.length,
      saved_jobs: seed.saved_jobs.length,
      notifications: seed.notifications.length,
      reports: seed.reports.length,
      audit_logs: seed.audit_logs.length,
    },
  };

  fs.writeFileSync(storePath, JSON.stringify(storeData, null, 2), 'utf-8');
  console.log(`✓ Seed data saved to local store at ${storePath}`);
  process.exit(0);
};

runSeed();

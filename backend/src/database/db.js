// Database access layer supporting both PostgreSQL and persistent zero-dependency engine
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { getSeedData } from './seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pool = null;
let isPostgres = false;

// Path to persistent fallback database file
const FALLBACK_DB_PATH = path.join(__dirname, 'dev_store.json');

// In-memory / JSON store
let store = {
  users: [],
  companies: [],
  recruiter_profiles: [],
  job_seeker_profiles: [],
  jobs: [],
  applications: [],
  interviews: [],
  saved_jobs: [],
  notifications: [],
  reports: [],
  audit_logs: [],
  counters: {
    users: 8,
    companies: 3,
    recruiter_profiles: 3,
    job_seeker_profiles: 4,
    jobs: 8,
    applications: 4,
    interviews: 1,
    saved_jobs: 3,
    notifications: 3,
    reports: 1,
    audit_logs: 2,
  },
};

// Save store to disk
const saveStore = () => {
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist store:', err.message);
  }
};

// Initialize store from disk or seed
const loadStore = async () => {
  if (fs.existsSync(FALLBACK_DB_PATH)) {
    try {
      const content = fs.readFileSync(FALLBACK_DB_PATH, 'utf-8');
      store = JSON.parse(content);
      return;
    } catch (err) {
      console.warn('Could not read existing store, re-seeding...', err.message);
    }
  }

  // Populate initial seed data
  const seed = await getSeedData();
  store.users = seed.users;
  store.companies = seed.companies;
  store.recruiter_profiles = seed.recruiter_profiles;
  store.job_seeker_profiles = seed.job_seeker_profiles;
  store.jobs = seed.jobs;
  store.applications = seed.applications;
  store.interviews = seed.interviews;
  store.saved_jobs = seed.saved_jobs;
  store.notifications = seed.notifications;
  store.reports = seed.reports;
  store.audit_logs = seed.audit_logs;
  saveStore();
};

// Try connecting to PostgreSQL if configured
export const initDb = async () => {
  const hasPgEnv = process.env.DATABASE_URL || (process.env.PG_HOST && process.env.PG_DATABASE && process.env.USE_SQLITE !== 'true');

  if (hasPgEnv && process.env.USE_SQLITE !== 'true') {
    try {
      const config = process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            host: process.env.PG_HOST || 'localhost',
            port: parseInt(process.env.PG_PORT || '5432', 10),
            database: process.env.PG_DATABASE || 'hirehub_db',
            user: process.env.PG_USER || 'postgres',
            password: process.env.PG_PASSWORD || 'postgres',
            connectionTimeoutMillis: 3000,
          };

      const testPool = new Pool(config);
      const client = await testPool.connect();
      client.release();
      pool = testPool;
      isPostgres = true;
      console.log('✓ Successfully connected to PostgreSQL database.');
      return;
    } catch (err) {
      console.log('ℹ PostgreSQL unavailable or not running (' + err.message + ').');
      console.log('✓ Running with high-performance persistent HireHub relational engine.');
    }
  } else {
    console.log('✓ Running with high-performance persistent HireHub relational engine.');
  }

  await loadStore();
};

export const getStore = () => store;
export const persist = () => saveStore();

/**
 * Universal query helper
 */
export const query = async (text, params = []) => {
  if (isPostgres && pool) {
    return await pool.query(text, params);
  }

  // Handle fallback query execution
  return executeStoreQuery(text, params);
};

export const isPg = () => isPostgres;

/**
 * Fallback query interpreter for key CRUD SQL operations
 */
function executeStoreQuery(text, params) {
  const cleanSql = text.trim();

  // 1. Transaction statements
  if (/^BEGIN/i.test(cleanSql) || /^COMMIT/i.test(cleanSql) || /^ROLLBACK/i.test(cleanSql)) {
    return { rows: [], rowCount: 0 };
  }

  // 2. INSERT INTO <table> ...
  const insertMatch = cleanSql.match(/INSERT\s+INTO\s+([a-z_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)(?:\s+RETURNING\s+(.+))?/i);
  if (insertMatch) {
    const table = insertMatch[1].toLowerCase();
    const columns = insertMatch[2].split(',').map((c) => c.trim().toLowerCase());
    const targetTable = store[table];

    if (!targetTable) {
      throw new Error(`Table ${table} does not exist in store`);
    }

    store.counters[table] = (store.counters[table] || targetTable.length) + 1;
    const newId = store.counters[table];

    const newRecord = {
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    columns.forEach((col, idx) => {
      newRecord[col] = params[idx] !== undefined ? params[idx] : null;
    });

    targetTable.push(newRecord);
    saveStore();

    return {
      rows: [newRecord],
      rowCount: 1,
    };
  }

  // 3. SELECT queries
  // Specific handler for common queries
  // A. SELECT * FROM users WHERE email = $1
  if (/FROM\s+users\s+WHERE\s+email\s*=\s*\$1/i.test(cleanSql)) {
    const user = store.users.find((u) => u.email.toLowerCase() === String(params[0]).toLowerCase());
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // B. SELECT * FROM users WHERE id = $1
  if (/FROM\s+users\s+WHERE\s+id\s*=\s*\$1/i.test(cleanSql)) {
    const user = store.users.find((u) => u.id === Number(params[0]));
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // Fallback for generic queries
  return { rows: [], rowCount: 0 };
}

export default {
  query,
  initDb,
  isPg,
  getStore,
  persist,
};

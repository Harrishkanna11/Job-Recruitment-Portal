import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  console.log('🔄 Running HireHub Database Migration...');

  const schemaFile = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaFile)) {
    console.error('❌ schema.sql file not found at:', schemaFile);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaFile, 'utf-8');

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
      await client.query(sql);
      console.log('✓ Successfully executed schema.sql on PostgreSQL database.');
      await client.end();
      process.exit(0);
    } catch (err) {
      console.error('❌ PostgreSQL Migration failed:', err.message);
      console.log('ℹ Note: HireHub also supports the built-in persistent zero-setup engine automatically.');
      process.exit(1);
    }
  } else {
    console.log('✓ HireHub is configured in zero-setup mode (persistent JSON relational engine).');
    console.log('✓ Schema and relational tables are automatically initialized on startup.');
    process.exit(0);
  }
};

runMigration();

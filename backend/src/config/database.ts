import { Pool } from 'pg';

import { env } from './env';

const isLocal =
  env.DATABASE_URL.includes('localhost') ||
  env.DATABASE_URL.includes('127.0.0.1') ||
  env.DATABASE_URL.includes('@db:');

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export const testConnection = async () => {
  await pool.query('SELECT 1');
};

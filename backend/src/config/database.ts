import { Pool } from 'pg';

import { env } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const testConnection = async () => {
  await pool.query('SELECT 1');
};

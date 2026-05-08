import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { pool } from '../config/database';

/**
 * Applies the idempotent SQL in `schema.sql` on server startup. Every statement
 * uses `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` or
 * `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, so it is safe to run on every
 * boot. New columns added in development reach production automatically the
 * next time the service redeploys.
 */
export const runMigrations = async (): Promise<void> => {
  const schemaPath = join(__dirname, 'schema.sql');
  let sql: string;
  try {
    sql = readFileSync(schemaPath, 'utf8');
  } catch (err: any) {
    console.warn(`[migrations] schema.sql not found at ${schemaPath}: ${err.message}`);
    return;
  }

  try {
    await pool.query(sql);
    console.log('[migrations] schema.sql applied successfully');
  } catch (err: any) {
    console.error('[migrations] failed to apply schema.sql:', err.message);
    throw err;
  }
};

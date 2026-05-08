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

/**
 * Runs `seed.sql` once on startup IF the existing seed users (email LIKE
 * '%@cofound-seed.com') are missing the new profile fields (entrepreneur_level,
 * goal, linkedin_username, instagram_username). Idempotent: subsequent boots
 * are no-ops because the check returns 0.
 *
 * Skipped when no seeds exist yet (fresh DB) and when SKIP_AUTO_SEED=true is
 * set in the environment.
 */
export const seedSyncIfStale = async (): Promise<void> => {
  if (process.env.SKIP_AUTO_SEED === 'true') {
    console.log('[seeds] skipped (SKIP_AUTO_SEED=true)');
    return;
  }

  let staleResult;
  try {
    staleResult = await pool.query<{ stale: string; total: string }>(
      `SELECT
         count(*) FILTER (WHERE
           linkedin_username IS NULL
           OR entrepreneur_level IS NULL
           OR goal IS NULL
         )::text AS stale,
         count(*)::text AS total
       FROM users WHERE email LIKE '%@cofound-seed.com'`,
    );
  } catch (err: any) {
    console.warn('[seeds] could not check seed staleness:', err.message);
    return;
  }

  const total = Number(staleResult.rows[0].total);
  const stale = Number(staleResult.rows[0].stale);
  if (total === 0) {
    console.log('[seeds] no seed users found; skipping auto-seed');
    return;
  }
  if (stale === 0) {
    console.log(`[seeds] all ${total} seed users already have new fields; skipping`);
    return;
  }

  console.log(`[seeds] ${stale}/${total} seed users are stale; running seed.sql...`);
  const seedPath = join(__dirname, 'seed.sql');
  let seedSql: string;
  try {
    seedSql = readFileSync(seedPath, 'utf8');
  } catch (err: any) {
    console.warn(`[seeds] seed.sql not found at ${seedPath}: ${err.message}`);
    return;
  }

  try {
    await pool.query(seedSql);
    console.log('[seeds] seed.sql applied successfully');
  } catch (err: any) {
    // Don't crash the server if seed fails — log and move on.
    console.error('[seeds] failed to apply seed.sql:', err.message);
  }
};

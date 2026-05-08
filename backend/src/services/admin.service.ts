import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { pool } from '../config/database';

/**
 * Wipes existing seed users (those at @cofound-seed.com) and reinserts the
 * full seed dataset from `db/seed.sql`. Used when seeds need to pick up new
 * fields (entrepreneur_level, goal, linkedin_username, etc.) without
 * connecting to the DB by hand.
 */
export const runSeedScript = async () => {
  const seedPath = join(__dirname, '..', 'db', 'seed.sql');
  const sql = readFileSync(seedPath, 'utf8');
  await pool.query(sql);
  const summary = await pool.query<{
    total: string;
    with_level: string;
    with_goal: string;
    with_linkedin: string;
    with_instagram: string;
  }>(
    `SELECT count(*)::text AS total,
            count(*) FILTER (WHERE entrepreneur_level IS NOT NULL)::text AS with_level,
            count(*) FILTER (WHERE goal IS NOT NULL)::text AS with_goal,
            count(*) FILTER (WHERE linkedin_username IS NOT NULL)::text AS with_linkedin,
            count(*) FILTER (WHERE instagram_username IS NOT NULL)::text AS with_instagram
     FROM users WHERE email LIKE '%@cofound-seed.com'`,
  );
  return {
    total: Number(summary.rows[0].total),
    withLevel: Number(summary.rows[0].with_level),
    withGoal: Number(summary.rows[0].with_goal),
    withLinkedin: Number(summary.rows[0].with_linkedin),
    withInstagram: Number(summary.rows[0].with_instagram),
  };
};

/**
 * Backfills the new profile fields (entrepreneur_level, goal,
 * linkedin_username, instagram_username) for existing seed users that have
 * NULL in those columns. Idempotent — running it twice is a no-op.
 */
export const backfillSeedExtras = async () => {
  await pool.query(
    `UPDATE users
     SET entrepreneur_level = (ARRAY['principiante', 'intermedio', 'avanzado'])[
       (abs(hashtext(id::text)) % 3) + 1
     ]
     WHERE email LIKE '%@cofound-seed.com' AND entrepreneur_level IS NULL`,
  );
  await pool.query(
    `UPDATE users
     SET goal = (ARRAY['learn_skill', 'find_partner', 'networking'])[
       (abs(hashtext(id::text || 'goal')) % 3) + 1
     ]
     WHERE email LIKE '%@cofound-seed.com' AND goal IS NULL`,
  );
  await pool.query(
    `UPDATE users
     SET linkedin_username = lower(
       regexp_replace(
         translate(first_name || '-' || last_name, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN'),
         '[^A-Za-z0-9-]', '', 'g'
       )
     )
     WHERE email LIKE '%@cofound-seed.com' AND linkedin_username IS NULL`,
  );
  await pool.query(
    `UPDATE users
     SET instagram_username = substring(
       lower(
         regexp_replace(
           translate(first_name || last_name, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN'),
           '[^A-Za-z0-9._]', '', 'g'
         )
       ), 1, 24
     )
     WHERE email LIKE '%@cofound-seed.com' AND instagram_username IS NULL`,
  );

  const summary = await pool.query<{
    with_level: string;
    with_goal: string;
    with_linkedin: string;
    with_instagram: string;
    total: string;
  }>(
    `SELECT
       count(*) FILTER (WHERE entrepreneur_level IS NOT NULL)::text AS with_level,
       count(*) FILTER (WHERE goal IS NOT NULL)::text AS with_goal,
       count(*) FILTER (WHERE linkedin_username IS NOT NULL)::text AS with_linkedin,
       count(*) FILTER (WHERE instagram_username IS NOT NULL)::text AS with_instagram,
       count(*)::text AS total
     FROM users WHERE email LIKE '%@cofound-seed.com'`,
  );
  return {
    withLevel: Number(summary.rows[0].with_level),
    withGoal: Number(summary.rows[0].with_goal),
    withLinkedin: Number(summary.rows[0].with_linkedin),
    withInstagram: Number(summary.rows[0].with_instagram),
    totalSeeds: Number(summary.rows[0].total),
  };
};

export const listReports = async () => {
  const result = await pool.query<{
    id: string;
    reason: string;
    created_at: Date;
    reporter_id: string;
    reporter_email: string;
    reporter_name: string;
    reported_id: string;
    reported_email: string;
    reported_name: string;
  }>(
    `SELECT r.id, r.reason, r.created_at,
       reporter.id AS reporter_id, reporter.email AS reporter_email,
       (reporter.first_name || ' ' || reporter.last_name) AS reporter_name,
       reported.id AS reported_id, reported.email AS reported_email,
       (reported.first_name || ' ' || reported.last_name) AS reported_name
     FROM reports r
     JOIN users reporter ON reporter.id = r.reporter_id
     JOIN users reported ON reported.id = r.reported_id
     ORDER BY r.created_at DESC
     LIMIT 200`,
  );

  return result.rows.map((row) => ({
    id: row.id,
    reason: row.reason,
    createdAt: row.created_at,
    reporter: { id: row.reporter_id, email: row.reporter_email, name: row.reporter_name },
    reported: { id: row.reported_id, email: row.reported_email, name: row.reported_name },
  }));
};

export const getStats = async () => {
  const result = await pool.query<{
    total_users: string;
    premium_users: string;
    active_24h: string;
    matches_total: string;
    reports_total: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE deactivated_at IS NULL)::text AS total_users,
       (SELECT COUNT(*) FROM users WHERE is_premium = TRUE AND deactivated_at IS NULL)::text AS premium_users,
       (SELECT COUNT(*) FROM users WHERE last_seen_at > NOW() - INTERVAL '24 hours')::text AS active_24h,
       (SELECT COUNT(*) FROM matches)::text AS matches_total,
       (SELECT COUNT(*) FROM reports)::text AS reports_total`,
  );

  const row = result.rows[0];
  return {
    totalUsers: Number(row.total_users),
    premiumUsers: Number(row.premium_users),
    active24h: Number(row.active_24h),
    matchesTotal: Number(row.matches_total),
    reportsTotal: Number(row.reports_total),
  };
};

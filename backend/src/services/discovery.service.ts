import { pool } from '../config/database';
import { getSkillsMap } from './skill.service';
import { getPhotosMap } from './photo.service';

type DiscoveryOptions = {
  locationFilter?: string;
};

const FREE_DAILY_LIMIT = 5;
const PREMIUM_LIMIT = 100;

export const getDiscoveryFeed = async (
  currentUserId: string,
  options: DiscoveryOptions = {},
) => {
  const { locationFilter } = options;

  const meta = await pool.query<{ is_premium: boolean; today_count: string }>(
    `SELECT u.is_premium,
       ((SELECT COUNT(*) FROM user_likes WHERE sender_id = u.id AND created_at >= CURRENT_DATE) +
        (SELECT COUNT(*) FROM user_passes WHERE sender_id = u.id AND created_at >= CURRENT_DATE))::text AS today_count
     FROM users u WHERE u.id = $1`,
    [currentUserId],
  );

  if (!meta.rowCount) return [];

  const isPremium = meta.rows[0].is_premium;
  const todayCount = Number(meta.rows[0].today_count);

  if (!isPremium && todayCount >= FREE_DAILY_LIMIT) return [];

  const limit = isPremium ? PREMIUM_LIMIT : Math.max(FREE_DAILY_LIMIT - todayCount, 0);
  if (limit === 0) return [];

  const params: (string | number)[] = [currentUserId, limit];
  let locationClause = '';

  if (locationFilter) {
    params.push(`%${locationFilter}%`);
    locationClause = `AND u.location ILIKE $${params.length}`;
  }

  const result = await pool.query<{
    id: string;
    first_name: string;
    last_name: string;
    bio: string | null;
    avatar_url: string | null;
    interests: string | null;
    location: string | null;
    compatibility_score: string;
    super_liked_by_them: boolean;
    is_boosted: boolean;
  }>(
    `WITH my_offer AS (
       SELECT skill_id FROM user_skills WHERE user_id = $1 AND skill_type = 'offer'
     ),
     my_learn AS (
       SELECT skill_id FROM user_skills WHERE user_id = $1 AND skill_type = 'learn'
     ),
     my_total AS (
       SELECT GREATEST((SELECT COUNT(*) FROM my_offer) + (SELECT COUNT(*) FROM my_learn), 1) AS total
     )
     SELECT
       u.id,
       u.first_name,
       u.last_name,
       u.bio,
       u.avatar_url,
       u.interests,
       u.location,
       (u.boost_until IS NOT NULL AND u.boost_until > NOW()) AS is_boosted,
       ROUND(
         ((
           SELECT COUNT(*)
           FROM user_skills us
           WHERE us.user_id = u.id
             AND us.skill_type = 'offer'
             AND us.skill_id IN (SELECT skill_id FROM my_learn)
         ) + (
           SELECT COUNT(*)
           FROM user_skills us
           WHERE us.user_id = u.id
           AND us.skill_type = 'learn'
           AND us.skill_id IN (SELECT skill_id FROM my_offer)
         )) * 100.0 / (SELECT total FROM my_total)
       )::int AS compatibility_score,
       EXISTS (
         SELECT 1 FROM user_likes ul2
         WHERE ul2.sender_id = u.id AND ul2.receiver_id = $1 AND ul2.is_super = TRUE
       ) AS super_liked_by_them
     FROM users u
     WHERE u.id <> $1
       AND NOT EXISTS (
         SELECT 1 FROM user_likes ul
         WHERE ul.sender_id = $1 AND ul.receiver_id = u.id
       )
       AND NOT EXISTS (
         SELECT 1 FROM user_passes up
         WHERE up.sender_id = $1 AND up.receiver_id = u.id
       )
       AND NOT EXISTS (
         SELECT 1 FROM matches m
         WHERE (m.user_a_id = $1 AND m.user_b_id = u.id)
            OR (m.user_b_id = $1 AND m.user_a_id = u.id)
       )
       ${locationClause}
     ORDER BY is_boosted DESC, super_liked_by_them DESC, compatibility_score DESC, u.created_at DESC
     LIMIT $2`,
    params,
  );

  const userIds = result.rows.map((row) => row.id);
  const [skillsMap, photosMap] = await Promise.all([
    getSkillsMap(userIds),
    getPhotosMap(userIds),
  ]);

  return result.rows.map((row) => {
    const skills = skillsMap.get(row.id) ?? { offeredSkills: [], learningSkills: [] };
    const photos = photosMap.get(row.id) ?? [];

    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url ?? null,
      bio: row.bio ?? '',
      interests: row.interests ?? '',
      location: row.location ?? '',
      compatibilityScore: Number(row.compatibility_score),
      superLikedByThem: row.super_liked_by_them,
      isBoosted: row.is_boosted,
      photos,
      ...skills,
    };
  });
};

export const getAvailableLocations = async () => {
  const result = await pool.query<{ location: string }>(
    `SELECT DISTINCT location FROM users WHERE location IS NOT NULL AND location <> '' ORDER BY location`,
  );
  return result.rows.map((r) => r.location);
};

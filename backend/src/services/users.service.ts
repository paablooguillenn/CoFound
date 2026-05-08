import { pool } from '../config/database';
import { AppError } from '../utils/http-error';
import { getPhotosMap } from './photo.service';
import { getSkillsMap } from './skill.service';

/**
 * Returns the full public profile of any user, used to view a profile from
 * places where the current user has not yet matched (e.g. Solicitudes de
 * conexión, search results). Refuses if either side has blocked the other or
 * if the user has been deactivated.
 */
export const getPublicUserProfile = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    throw new AppError('Usa /profile/me para tu propio perfil', 400);
  }

  // Reject if either side has blocked the other.
  const blockedResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM blocked_users
     WHERE (blocker_id = $1 AND blocked_id = $2)
        OR (blocker_id = $2 AND blocked_id = $1)`,
    [currentUserId, targetUserId],
  );
  if (Number(blockedResult.rows[0]?.count ?? 0) > 0) {
    throw new AppError('Perfil no disponible', 404);
  }

  const result = await pool.query<{
    id: string;
    first_name: string;
    last_name: string;
    bio: string | null;
    avatar_url: string | null;
    interests: string | null;
    location: string | null;
    entrepreneur_level: string | null;
    goal: string | null;
    project_stage: string | null;
    is_mentor: boolean;
    linkedin_username: string | null;
    instagram_username: string | null;
    is_premium: boolean;
    last_seen_at: Date | null;
    email_verified: boolean;
  }>(
    `SELECT id, first_name, last_name, bio, avatar_url, interests, location,
            entrepreneur_level, goal, project_stage, is_mentor, linkedin_username, instagram_username,
            is_premium, last_seen_at, email_verified
     FROM users
     WHERE id = $1 AND deactivated_at IS NULL`,
    [targetUserId],
  );

  if (!result.rowCount) {
    throw new AppError('Usuario no encontrado', 404);
  }

  const row = result.rows[0];
  const [skills, photosMap] = await Promise.all([
    getSkillsMap([row.id]),
    getPhotosMap([row.id]),
  ]);
  const userSkills = skills.get(row.id) ?? { offeredSkills: [], learningSkills: [] };
  const photos = photosMap.get(row.id) ?? [];

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: row.avatar_url,
    bio: row.bio ?? '',
    interests: row.interests ?? '',
    location: row.location ?? '',
    entrepreneurLevel: row.entrepreneur_level ?? null,
    goal: row.goal ?? null,
    projectStage: row.project_stage ?? null,
    isMentor: row.is_mentor ?? false,
    linkedinUsername: row.linkedin_username ?? null,
    instagramUsername: row.instagram_username ?? null,
    isPremium: row.is_premium,
    lastSeenAt: row.last_seen_at,
    emailVerified: row.email_verified,
    photos,
    ...userSkills,
  };
};

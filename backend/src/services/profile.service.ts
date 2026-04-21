import { pool } from '../config/database';
import { AppError } from '../utils/http-error';
import { getUserSkills, syncUserSkills } from './skill.service';

type ProfileUpdateInput = {
  firstName: string;
  lastName: string;
  bio?: string;
  interests?: string;
  location?: string;
  offeredSkills: Array<{ name: string; level?: number }>;
  learningSkills: Array<{ name: string; level?: number }>;
};

export const getProfileById = async (userId: string) => {
  const result = await pool.query<{
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    bio: string | null;
    avatar_url: string | null;
    interests: string | null;
    location: string | null;
    is_premium: boolean;
    premium_plan: string | null;
    premium_since: Date | null;
  }>(
    `SELECT id, email, first_name, last_name, bio, avatar_url, interests, location,
            is_premium, premium_plan, premium_since
     FROM users
     WHERE id = $1`,
    [userId],
  );

  if (!result.rowCount) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];
  const skills = await getUserSkills(userId);

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    avatarUrl: user.avatar_url ?? null,
    bio: user.bio ?? '',
    interests: user.interests ?? '',
    location: user.location ?? '',
    isPremium: user.is_premium ?? false,
    premiumPlan: user.premium_plan,
    premiumSince: user.premium_since,
    ...skills,
  };
};

export const upgradeToPremium = async (userId: string, plan: 'monthly' | 'yearly') => {
  const result = await pool.query(
    `UPDATE users
     SET is_premium = TRUE,
         premium_plan = $2,
         premium_since = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING is_premium, premium_plan, premium_since`,
    [userId, plan],
  );

  if (!result.rowCount) {
    throw new AppError('User not found', 404);
  }

  return {
    isPremium: true,
    premiumPlan: plan,
    premiumSince: result.rows[0].premium_since,
  };
};

export const updateProfile = async (userId: string, input: ProfileUpdateInput) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      bio: string | null;
      avatar_url: string | null;
      interests: string | null;
      location: string | null;
    }>(
      `UPDATE users
       SET first_name = $2,
           last_name = $3,
           bio = $4,
           interests = $5,
           location = $6,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, first_name, last_name, bio, avatar_url, interests, location`,
      [
        userId,
        input.firstName.trim(),
        input.lastName.trim(),
        input.bio?.trim() || null,
        input.interests?.trim() || null,
        input.location?.trim() || null,
      ],
    );

    if (!result.rowCount) {
      throw new AppError('User not found', 404);
    }

    await syncUserSkills(userId, input.offeredSkills, input.learningSkills, client);

    await client.query('COMMIT');

    const user = result.rows[0];
    const skills = await getUserSkills(userId);

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      bio: user.bio ?? '',
      interests: user.interests ?? '',
      location: user.location ?? '',
      ...skills,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

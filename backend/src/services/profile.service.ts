import { pool } from '../config/database';
import { AppError } from '../utils/http-error';
import { getUserSkills, syncUserSkills } from './skill.service';
import { comparePassword, hashPassword } from '../utils/password';

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
    preferences: Record<string, unknown>;
    two_factor_enabled: boolean;
  }>(
    `SELECT id, email, first_name, last_name, bio, avatar_url, interests, location,
            is_premium, premium_plan, premium_since, preferences, two_factor_enabled
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
    preferences: user.preferences ?? {},
    twoFactorEnabled: user.two_factor_enabled ?? false,
    ...skills,
  };
};

export const changeEmail = async (userId: string, newEmail: string, password: string) => {
  const normalizedEmail = newEmail.trim().toLowerCase();

  const userResult = await pool.query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId],
  );
  if (!userResult.rowCount) throw new AppError('User not found', 404);

  const valid = await comparePassword(password, userResult.rows[0].password_hash);
  if (!valid) throw new AppError('Contraseña incorrecta', 401);

  const exists = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [normalizedEmail, userId]);
  if (exists.rowCount) throw new AppError('Ese email ya está registrado', 409);

  await pool.query(
    `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`,
    [normalizedEmail, userId],
  );

  return { email: normalizedEmail };
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const userResult = await pool.query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId],
  );
  if (!userResult.rowCount) throw new AppError('User not found', 404);

  const valid = await comparePassword(currentPassword, userResult.rows[0].password_hash);
  if (!valid) throw new AppError('Contraseña actual incorrecta', 401);

  const newHash = await hashPassword(newPassword);
  await pool.query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [newHash, userId],
  );

  return { success: true };
};

export const deleteAccount = async (userId: string, password: string) => {
  const userResult = await pool.query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId],
  );
  if (!userResult.rowCount) throw new AppError('User not found', 404);

  const valid = await comparePassword(password, userResult.rows[0].password_hash);
  if (!valid) throw new AppError('Contraseña incorrecta', 401);

  await pool.query('DELETE FROM reports WHERE reporter_id = $1 OR reported_id = $1', [userId]);
  await pool.query('DELETE FROM blocked_users WHERE blocker_id = $1 OR blocked_id = $1', [userId]);
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);

  return { success: true };
};

export const deactivateAccount = async (userId: string) => {
  await pool.query(`UPDATE users SET deactivated_at = NOW() WHERE id = $1`, [userId]);
  return { success: true };
};

export const reactivateAccount = async (userId: string) => {
  await pool.query(`UPDATE users SET deactivated_at = NULL WHERE id = $1`, [userId]);
  return { success: true };
};

export const updatePreferences = async (userId: string, prefs: Record<string, unknown>) => {
  const result = await pool.query<{ preferences: Record<string, unknown> }>(
    `UPDATE users
     SET preferences = preferences || $2::jsonb,
         updated_at = NOW()
     WHERE id = $1
     RETURNING preferences`,
    [userId, JSON.stringify(prefs)],
  );
  if (!result.rowCount) throw new AppError('User not found', 404);
  return result.rows[0].preferences;
};

export const getPreferences = async (userId: string) => {
  const result = await pool.query<{ preferences: Record<string, unknown>; two_factor_enabled: boolean }>(
    'SELECT preferences, two_factor_enabled FROM users WHERE id = $1',
    [userId],
  );
  if (!result.rowCount) throw new AppError('User not found', 404);
  return {
    preferences: result.rows[0].preferences,
    twoFactorEnabled: result.rows[0].two_factor_enabled,
  };
};

export const toggle2FA = async (userId: string, enable: boolean) => {
  const result = await pool.query<{ two_factor_enabled: boolean }>(
    `UPDATE users SET two_factor_enabled = $2, updated_at = NOW()
     WHERE id = $1 RETURNING two_factor_enabled`,
    [userId, enable],
  );
  if (!result.rowCount) throw new AppError('User not found', 404);
  return { twoFactorEnabled: result.rows[0].two_factor_enabled };
};

export const exportUserData = async (userId: string) => {
  const [user, skills, photos, likesGiven, likesReceived, matches, messages] = await Promise.all([
    pool.query(
      `SELECT id, email, first_name, last_name, bio, avatar_url, interests, location,
              is_premium, premium_plan, premium_since, preferences, two_factor_enabled, created_at
       FROM users WHERE id = $1`,
      [userId],
    ),
    pool.query(
      `SELECT s.name, us.skill_type, us.level
       FROM user_skills us JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = $1`,
      [userId],
    ),
    pool.query(
      `SELECT url, sort_order, created_at FROM user_photos WHERE user_id = $1 ORDER BY sort_order`,
      [userId],
    ),
    pool.query(
      `SELECT receiver_id, is_super, created_at FROM user_likes WHERE sender_id = $1`,
      [userId],
    ),
    pool.query(
      `SELECT sender_id, is_super, created_at FROM user_likes WHERE receiver_id = $1`,
      [userId],
    ),
    pool.query(
      `SELECT id, user_a_id, user_b_id, created_at FROM matches
       WHERE user_a_id = $1 OR user_b_id = $1`,
      [userId],
    ),
    pool.query(
      `SELECT id, match_id, content, created_at, read_at
       FROM messages
       WHERE sender_id = $1
       ORDER BY created_at`,
      [userId],
    ),
  ]);

  if (!user.rowCount) throw new AppError('User not found', 404);

  return {
    exportedAt: new Date().toISOString(),
    user: user.rows[0],
    skills: skills.rows,
    photos: photos.rows,
    likesGiven: likesGiven.rows,
    likesReceived: likesReceived.rows,
    matches: matches.rows,
    messagesSent: messages.rows,
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

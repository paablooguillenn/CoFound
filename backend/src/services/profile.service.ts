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
    email_verified: boolean;
    boost_until: Date | null;
  }>(
    `SELECT id, email, first_name, last_name, bio, avatar_url, interests, location,
            is_premium, premium_plan, premium_since, preferences, two_factor_enabled,
            email_verified, boost_until
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
    emailVerified: user.email_verified ?? false,
    boostActive: user.boost_until ? new Date(user.boost_until).getTime() > Date.now() : false,
    boostUntil: user.boost_until,
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

export const computeProfileCompleteness = async (userId: string): Promise<{ percent: number; missing: string[] }> => {
  const result = await pool.query<{
    avatar_url: string | null;
    bio: string | null;
    interests: string | null;
    location: string | null;
    photos: number;
    offered_skills: number;
    learning_skills: number;
  }>(
    `SELECT u.avatar_url, u.bio, u.interests, u.location,
            (SELECT COUNT(*) FROM user_photos WHERE user_id = u.id)::int AS photos,
            (SELECT COUNT(*) FROM user_skills WHERE user_id = u.id AND skill_type = 'offer')::int AS offered_skills,
            (SELECT COUNT(*) FROM user_skills WHERE user_id = u.id AND skill_type = 'learn')::int AS learning_skills
     FROM users u WHERE u.id = $1`,
    [userId],
  );
  if (!result.rowCount) throw new AppError('User not found', 404);
  const r = result.rows[0];

  const checks: { key: string; label: string; ok: boolean }[] = [
    { key: 'avatar', label: 'Foto de perfil', ok: !!r.avatar_url },
    { key: 'bio', label: 'Sobre ti', ok: !!(r.bio && r.bio.trim().length >= 20) },
    { key: 'interests', label: 'Intereses', ok: !!(r.interests && r.interests.trim().length > 0) },
    { key: 'location', label: 'Ubicación', ok: !!(r.location && r.location.trim().length > 0) },
    { key: 'photos2', label: 'Al menos 2 fotos', ok: r.photos >= 2 },
    { key: 'offered', label: 'Habilidades que ofreces', ok: r.offered_skills >= 1 },
    { key: 'learning', label: 'Habilidades que buscas', ok: r.learning_skills >= 1 },
  ];

  const total = checks.length;
  const completed = checks.filter((c) => c.ok).length;
  const percent = Math.round((completed * 100) / total);
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);

  return { percent, missing };
};

const BOOST_DURATION_MIN = 30;
const BOOST_COOLDOWN_HOURS = 24;

export const activateBoost = async (userId: string) => {
  const userCheck = await pool.query<{ is_premium: boolean; last_boost_at: Date | null }>(
    'SELECT is_premium, last_boost_at FROM users WHERE id = $1',
    [userId],
  );
  if (!userCheck.rowCount) throw new AppError('User not found', 404);
  if (!userCheck.rows[0].is_premium) {
    throw new AppError('Boost es una función Premium', 403);
  }

  const lastBoost = userCheck.rows[0].last_boost_at;
  if (lastBoost) {
    const hoursSince = (Date.now() - new Date(lastBoost).getTime()) / 3600000;
    if (hoursSince < BOOST_COOLDOWN_HOURS) {
      const wait = Math.ceil(BOOST_COOLDOWN_HOURS - hoursSince);
      throw new AppError(`Ya usaste tu boost hoy. Vuelve en ${wait} h.`, 429);
    }
  }

  const boostUntil = new Date(Date.now() + BOOST_DURATION_MIN * 60 * 1000);
  await pool.query(
    `UPDATE users SET boost_until = $2, last_boost_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [userId, boostUntil],
  );

  return { boostUntil, durationMin: BOOST_DURATION_MIN };
};

export const getBoostStatus = async (userId: string) => {
  const result = await pool.query<{ boost_until: Date | null; last_boost_at: Date | null; is_premium: boolean }>(
    'SELECT boost_until, last_boost_at, is_premium FROM users WHERE id = $1',
    [userId],
  );
  if (!result.rowCount) throw new AppError('User not found', 404);
  const r = result.rows[0];
  const now = Date.now();
  const active = r.boost_until ? new Date(r.boost_until).getTime() > now : false;
  let cooldownUntil: Date | null = null;
  if (r.last_boost_at) {
    const next = new Date(new Date(r.last_boost_at).getTime() + BOOST_COOLDOWN_HOURS * 3600000);
    if (next.getTime() > now) cooldownUntil = next;
  }
  return {
    isPremium: r.is_premium,
    active,
    boostUntil: r.boost_until,
    cooldownUntil,
  };
};

export const updateLastSeen = async (userId: string) => {
  // Throttled inside middleware
  await pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [userId]).catch(() => {});
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

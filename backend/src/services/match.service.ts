import { pool } from '../config/database';
import { AppError } from '../utils/http-error';
import { getSkillsMap } from './skill.service';
import { getPhotosMap } from './photo.service';

export const reportUser = async (reporterId: string, reportedId: string, reason: string) => {
  await pool.query(
    `INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)`,
    [reporterId, reportedId, reason],
  );
  return { success: true };
};

export const likeUser = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    throw new AppError('A user cannot like themselves', 400);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check daily like limit for free users
    const userCheck = await client.query<{ is_premium: boolean }>(
      'SELECT is_premium FROM users WHERE id = $1',
      [currentUserId],
    );

    if (!userCheck.rows[0]?.is_premium) {
      const todaySwipes = await client.query<{ count: string }>(
        `SELECT (
           (SELECT COUNT(*) FROM user_likes WHERE sender_id = $1 AND created_at >= CURRENT_DATE) +
           (SELECT COUNT(*) FROM user_passes WHERE sender_id = $1 AND created_at >= CURRENT_DATE)
         )::text AS count`,
        [currentUserId],
      );

      if (Number(todaySwipes.rows[0].count) >= 5) {
        throw new AppError('Has alcanzado el límite de 5 swipes diarios. Actualiza a Premium para swipes ilimitados.', 429);
      }
    }

    const targetUser = await client.query('SELECT id FROM users WHERE id = $1', [targetUserId]);

    if (!targetUser.rowCount) {
      throw new AppError('Target user not found', 404);
    }

    await client.query(
      `INSERT INTO user_likes (sender_id, receiver_id)
       VALUES ($1, $2)
       ON CONFLICT (sender_id, receiver_id) DO NOTHING`,
      [currentUserId, targetUserId],
    );

    const reciprocalLike = await client.query(
      `SELECT id
       FROM user_likes
       WHERE sender_id = $1 AND receiver_id = $2`,
      [targetUserId, currentUserId],
    );

    let isMatch = false;
    let matchId: string | null = null;

    if (reciprocalLike.rowCount) {
      const [userA, userB] = [currentUserId, targetUserId].sort();

      const matchResult = await client.query(
        `INSERT INTO matches (user_a_id, user_b_id)
         VALUES ($1, $2)
         ON CONFLICT (user_a_id, user_b_id) DO NOTHING
         RETURNING id`,
        [userA, userB],
      );

      // If conflict (already existed), fetch it
      if (matchResult.rowCount) {
        matchId = matchResult.rows[0].id;
      } else {
        const existing = await client.query(
          `SELECT id FROM matches WHERE user_a_id = $1 AND user_b_id = $2`,
          [userA, userB],
        );
        matchId = existing.rows[0]?.id ?? null;
      }

      isMatch = true;
    }

    await client.query('COMMIT');

    return {
      isMatch,
      matchId,
      likedUserId: targetUserId,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const superLikeUser = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    throw new AppError('A user cannot super-like themselves', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userCheck = await client.query<{ is_premium: boolean }>(
      'SELECT is_premium FROM users WHERE id = $1',
      [currentUserId],
    );
    if (!userCheck.rowCount) throw new AppError('User not found', 404);
    if (!userCheck.rows[0].is_premium) {
      throw new AppError('Los super-likes son una función Premium', 403);
    }

    const todaySuperLikes = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM user_likes
       WHERE sender_id = $1 AND is_super = TRUE AND created_at >= CURRENT_DATE`,
      [currentUserId],
    );
    if (Number(todaySuperLikes.rows[0].count) >= 5) {
      throw new AppError('Has alcanzado el límite de 5 super-likes diarios.', 429);
    }

    const targetUser = await client.query('SELECT id FROM users WHERE id = $1', [targetUserId]);
    if (!targetUser.rowCount) throw new AppError('Target user not found', 404);

    await client.query(
      `INSERT INTO user_likes (sender_id, receiver_id, is_super)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (sender_id, receiver_id) DO UPDATE SET is_super = TRUE`,
      [currentUserId, targetUserId],
    );

    const reciprocalLike = await client.query(
      `SELECT id FROM user_likes WHERE sender_id = $1 AND receiver_id = $2`,
      [targetUserId, currentUserId],
    );

    let isMatch = false;
    let matchId: string | null = null;

    if (reciprocalLike.rowCount) {
      const [userA, userB] = [currentUserId, targetUserId].sort();

      const matchResult = await client.query(
        `INSERT INTO matches (user_a_id, user_b_id)
         VALUES ($1, $2)
         ON CONFLICT (user_a_id, user_b_id) DO NOTHING
         RETURNING id`,
        [userA, userB],
      );

      if (matchResult.rowCount) {
        matchId = matchResult.rows[0].id;
      } else {
        const existing = await client.query(
          `SELECT id FROM matches WHERE user_a_id = $1 AND user_b_id = $2`,
          [userA, userB],
        );
        matchId = existing.rows[0]?.id ?? null;
      }
      isMatch = true;
    }

    await client.query('COMMIT');
    return { isMatch, matchId, isSuper: true, likedUserId: targetUserId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const rewindLastSwipe = async (currentUserId: string) => {
  const userCheck = await pool.query<{ is_premium: boolean }>(
    'SELECT is_premium FROM users WHERE id = $1',
    [currentUserId],
  );
  if (!userCheck.rowCount) throw new AppError('User not found', 404);
  if (!userCheck.rows[0].is_premium) {
    throw new AppError('Rewind es una función Premium', 403);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const lastLike = await client.query<{ id: string; receiver_id: string; created_at: Date; type: 'like' }>(
      `SELECT id, receiver_id, created_at, 'like'::text AS type
       FROM user_likes WHERE sender_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [currentUserId],
    );
    const lastPass = await client.query<{ id: string; receiver_id: string; created_at: Date; type: 'pass' }>(
      `SELECT id, receiver_id, created_at, 'pass'::text AS type
       FROM user_passes WHERE sender_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [currentUserId],
    );

    const candidates = [lastLike.rows[0], lastPass.rows[0]].filter(Boolean);
    if (!candidates.length) throw new AppError('No hay swipes para deshacer', 404);

    candidates.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const last = candidates[0];

    if (last.type === 'like') {
      const [userA, userB] = [currentUserId, last.receiver_id].sort();
      await client.query(
        `DELETE FROM matches WHERE user_a_id = $1 AND user_b_id = $2`,
        [userA, userB],
      );
      await client.query('DELETE FROM user_likes WHERE id = $1', [last.id]);
    } else {
      await client.query('DELETE FROM user_passes WHERE id = $1', [last.id]);
    }

    await client.query('COMMIT');
    return { success: true, undoneType: last.type, targetUserId: last.receiver_id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getLikesReceived = async (currentUserId: string) => {
  const userCheck = await pool.query<{ is_premium: boolean }>(
    'SELECT is_premium FROM users WHERE id = $1',
    [currentUserId],
  );
  if (!userCheck.rowCount) throw new AppError('User not found', 404);
  if (!userCheck.rows[0].is_premium) {
    throw new AppError('Ver quién te dio like es una función Premium', 403);
  }

  const result = await pool.query<{
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    is_super: boolean;
    liked_at: Date;
  }>(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.bio, u.location,
            ul.is_super, ul.created_at AS liked_at
     FROM user_likes ul
     JOIN users u ON u.id = ul.sender_id
     WHERE ul.receiver_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM user_likes my
         WHERE my.sender_id = $1 AND my.receiver_id = ul.sender_id
       )
     ORDER BY ul.is_super DESC, ul.created_at DESC`,
    [currentUserId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: row.avatar_url,
    bio: row.bio ?? '',
    location: row.location ?? '',
    isSuper: row.is_super,
    likedAt: row.liked_at,
  }));
};

export const passUser = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    throw new AppError('A user cannot pass themselves', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userCheck = await client.query<{ is_premium: boolean }>(
      'SELECT is_premium FROM users WHERE id = $1',
      [currentUserId],
    );
    if (!userCheck.rowCount) throw new AppError('User not found', 404);

    if (!userCheck.rows[0].is_premium) {
      const todaySwipes = await client.query<{ count: string }>(
        `SELECT (
           (SELECT COUNT(*) FROM user_likes WHERE sender_id = $1 AND created_at >= CURRENT_DATE) +
           (SELECT COUNT(*) FROM user_passes WHERE sender_id = $1 AND created_at >= CURRENT_DATE)
         )::text AS count`,
        [currentUserId],
      );
      if (Number(todaySwipes.rows[0].count) >= 5) {
        throw new AppError('Has alcanzado el límite de 5 swipes diarios. Actualiza a Premium para swipes ilimitados.', 429);
      }
    }

    const targetUser = await client.query('SELECT id FROM users WHERE id = $1', [targetUserId]);
    if (!targetUser.rowCount) throw new AppError('Target user not found', 404);

    await client.query(
      `INSERT INTO user_passes (sender_id, receiver_id)
       VALUES ($1, $2)
       ON CONFLICT (sender_id, receiver_id) DO NOTHING`,
      [currentUserId, targetUserId],
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const unmatchUser = async (currentUserId: string, matchId: string) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify the match belongs to this user
    const match = await client.query(
      `SELECT id FROM matches WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)`,
      [matchId, currentUserId],
    );
    if (!match.rowCount) throw new AppError('Match not found', 404);

    // Delete messages first (FK constraint)
    await client.query('DELETE FROM messages WHERE match_id = $1', [matchId]);
    await client.query('DELETE FROM matches WHERE id = $1', [matchId]);

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const blockUser = async (blockerId: string, blockedId: string, reason?: string) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Block the user
    await client.query(
      `INSERT INTO blocked_users (blocker_id, blocked_id, reason) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [blockerId, blockedId, reason ?? null],
    );

    // Remove any match between them
    await client.query(
      `DELETE FROM messages WHERE match_id IN (
        SELECT id FROM matches WHERE (user_a_id = $1 AND user_b_id = $2) OR (user_a_id = $2 AND user_b_id = $1)
      )`,
      [blockerId, blockedId],
    );
    await client.query(
      `DELETE FROM matches WHERE (user_a_id = $1 AND user_b_id = $2) OR (user_a_id = $2 AND user_b_id = $1)`,
      [blockerId, blockedId],
    );

    // Remove likes
    await client.query(
      `DELETE FROM user_likes WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
      [blockerId, blockedId],
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getMatchProfile = async (currentUserId: string, matchId: string) => {
  const result = await pool.query<{
    other_user_id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    bio: string | null;
    interests: string | null;
    location: string | null;
    is_premium: boolean;
  }>(
    `SELECT
       u.id AS other_user_id, u.first_name, u.last_name, u.avatar_url,
       u.bio, u.interests, u.location, u.is_premium
     FROM matches m
     INNER JOIN users u ON u.id = CASE
       WHEN m.user_a_id = $2 THEN m.user_b_id ELSE m.user_a_id END
     WHERE m.id = $1 AND (m.user_a_id = $2 OR m.user_b_id = $2)`,
    [matchId, currentUserId],
  );

  if (!result.rowCount) throw new AppError('Match not found', 404);

  const row = result.rows[0];
  const [skillsMap, photosMap] = await Promise.all([
    getSkillsMap([row.other_user_id]),
    getPhotosMap([row.other_user_id]),
  ]);
  const skills = skillsMap.get(row.other_user_id) ?? { offeredSkills: [], learningSkills: [] };
  const photos = photosMap.get(row.other_user_id) ?? [];

  return {
    id: row.other_user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarUrl: row.avatar_url,
    bio: row.bio ?? '',
    interests: row.interests ?? '',
    location: row.location ?? '',
    isPremium: row.is_premium,
    photos,
    ...skills,
  };
};

export const getMatches = async (currentUserId: string) => {
  const result = await pool.query<{
    match_id: string;
    created_at: Date;
    other_user_id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    bio: string | null;
    interests: string | null;
    location: string | null;
    last_message: string | null;
    last_message_at: Date | null;
    last_message_sender_id: string | null;
    unread_count: string;
  }>(
    `SELECT
       m.id AS match_id,
       m.created_at,
       u.id AS other_user_id,
       u.first_name,
       u.last_name,
       u.avatar_url,
       u.bio,
       u.interests,
       u.location,
       lm.content AS last_message,
       lm.created_at AS last_message_at,
       lm.sender_id AS last_message_sender_id,
       COALESCE(unread.cnt, '0') AS unread_count
     FROM matches m
     INNER JOIN users u ON u.id = CASE
       WHEN m.user_a_id = $1 THEN m.user_b_id
       ELSE m.user_a_id
     END
     LEFT JOIN LATERAL (
       SELECT content, created_at, sender_id FROM messages
       WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1
     ) lm ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*)::text AS cnt FROM messages
       WHERE match_id = m.id AND sender_id <> $1 AND read_at IS NULL
     ) unread ON true
     WHERE m.user_a_id = $1 OR m.user_b_id = $1
     ORDER BY COALESCE(lm.created_at, m.created_at) DESC`,
    [currentUserId],
  );

  const userIds = result.rows.map((row) => row.other_user_id);
  const skillsMap = await getSkillsMap(userIds);

  return result.rows.map((row) => {
    const skills = skillsMap.get(row.other_user_id) ?? { offeredSkills: [], learningSkills: [] };

    return {
      id: row.match_id,
      createdAt: row.created_at,
      lastMessage: row.last_message,
      lastMessageAt: row.last_message_at,
      lastMessageIsMe: row.last_message_sender_id === currentUserId,
      unreadCount: Number(row.unread_count),
      user: {
        id: row.other_user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        avatarUrl: row.avatar_url ?? null,
        bio: row.bio ?? '',
        interests: row.interests ?? '',
        location: row.location ?? '',
        ...skills,
      },
    };
  });
};

export const getUnreadTotal = async (currentUserId: string): Promise<number> => {
  const result = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM messages msg
     INNER JOIN matches m ON m.id = msg.match_id
     WHERE (m.user_a_id = $1 OR m.user_b_id = $1)
       AND msg.sender_id <> $1
       AND msg.read_at IS NULL`,
    [currentUserId],
  );
  return Number(result.rows[0].total);
};

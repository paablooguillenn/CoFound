import { pool } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/http-error';
import { generateAutoReply } from './ai.service';

const aiAutoReplyEnabled = env.AI_AUTO_REPLY === 'true';

export const ALLOWED_REACTIONS = ['👍', '🤝', '🔥', '💡', '❤️'] as const;
export type Reaction = (typeof ALLOWED_REACTIONS)[number];

const ensureMatchAccess = async (currentUserId: string, matchId: string) => {
  const matchCheck = await pool.query(
    `SELECT id FROM matches
     WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)`,
    [matchId, currentUserId],
  );
  if (!matchCheck.rowCount) {
    throw new AppError('Match not found', 404);
  }
};

export const getMessages = async (currentUserId: string, matchId: string) => {
  await ensureMatchAccess(currentUserId, matchId);

  const result = await pool.query(
    `SELECT id, sender_id, content, read_at, created_at
     FROM messages
     WHERE match_id = $1
     ORDER BY created_at ASC`,
    [matchId],
  );

  if (!result.rowCount) {
    return [];
  }

  const ids = result.rows.map((r) => r.id);
  const reactionsRes = await pool.query<{ message_id: string; user_id: string; emoji: string }>(
    `SELECT message_id, user_id, emoji
     FROM message_reactions
     WHERE message_id = ANY($1::uuid[])`,
    [ids],
  );

  const byMessage = new Map<string, { userId: string; emoji: string }[]>();
  for (const row of reactionsRes.rows) {
    const list = byMessage.get(row.message_id) ?? [];
    list.push({ userId: row.user_id, emoji: row.emoji });
    byMessage.set(row.message_id, list);
  }

  return result.rows.map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    content: row.content,
    readAt: row.read_at,
    createdAt: row.created_at,
    reactions: byMessage.get(row.id) ?? [],
  }));
};

const isAllowedReaction = (value: string): value is Reaction =>
  (ALLOWED_REACTIONS as readonly string[]).includes(value);

export const setReaction = async (currentUserId: string, matchId: string, messageId: string, emoji: string) => {
  if (!isAllowedReaction(emoji)) {
    throw new AppError('Reacción no válida', 400);
  }
  await ensureMatchAccess(currentUserId, matchId);

  const msg = await pool.query<{ match_id: string }>(
    'SELECT match_id FROM messages WHERE id = $1',
    [messageId],
  );
  if (!msg.rowCount || msg.rows[0].match_id !== matchId) {
    throw new AppError('Mensaje no encontrado', 404);
  }

  await pool.query(
    `INSERT INTO message_reactions (message_id, user_id, emoji)
     VALUES ($1, $2, $3)
     ON CONFLICT (message_id, user_id)
     DO UPDATE SET emoji = EXCLUDED.emoji, created_at = NOW()`,
    [messageId, currentUserId, emoji],
  );

  return { success: true, emoji };
};

export const clearReaction = async (currentUserId: string, matchId: string, messageId: string) => {
  await ensureMatchAccess(currentUserId, matchId);
  await pool.query(
    'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2',
    [messageId, currentUserId],
  );
  return { success: true };
};

/**
 * Soft-deletes a message: only the original sender can delete their own
 * messages, and only within a 5-minute window after sending. Hard delete
 * (DELETE FROM messages) so the row disappears for both ends.
 */
export const deleteMessage = async (currentUserId: string, messageId: string) => {
  const check = await pool.query<{ sender_id: string; created_at: Date }>(
    'SELECT sender_id, created_at FROM messages WHERE id = $1',
    [messageId],
  );
  if (!check.rowCount) {
    throw new AppError('Mensaje no encontrado', 404);
  }
  if (check.rows[0].sender_id !== currentUserId) {
    throw new AppError('Solo puedes borrar mensajes propios', 403);
  }
  const ageMs = Date.now() - new Date(check.rows[0].created_at).getTime();
  if (ageMs > 5 * 60 * 1000) {
    throw new AppError('Solo puedes borrar mensajes durante los primeros 5 minutos', 403);
  }
  await pool.query('DELETE FROM messages WHERE id = $1', [messageId]);
  return { success: true };
};

export const sendMessage = async (currentUserId: string, matchId: string, content: string) => {
  const matchCheck = await pool.query(
    `SELECT id, user_a_id, user_b_id FROM matches
     WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)`,
    [matchId, currentUserId],
  );

  if (!matchCheck.rowCount) {
    throw new AppError('Match not found', 404);
  }

  const match = matchCheck.rows[0];
  const otherUserId = match.user_a_id === currentUserId ? match.user_b_id : match.user_a_id;

  // Insert the user's message
  const result = await pool.query(
    `INSERT INTO messages (match_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, content, read_at, created_at`,
    [matchId, currentUserId, content],
  );

  const userMessage = {
    id: result.rows[0].id,
    senderId: result.rows[0].sender_id,
    content: result.rows[0].content,
    readAt: result.rows[0].read_at,
    createdAt: result.rows[0].created_at,
  };

  // Auto-reply (academic demo mode). Disabled in real production via
  // AI_AUTO_REPLY=false so messages stay strictly human-to-human.
  if (!aiAutoReplyEnabled) {
    return { userMessage, autoReply: null };
  }

  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error('AI timeout')), 8000),
  );

  let replyText: string;
  try {
    replyText = await Promise.race([
      generateAutoReply(matchId, currentUserId, content),
      timeoutPromise,
    ]);
  } catch {
    replyText = 'Interesante, cuéntame más sobre eso.';
  }

  const replyResult = await pool.query(
    `INSERT INTO messages (match_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING id, sender_id, content, read_at, created_at`,
    [matchId, otherUserId, replyText],
  );

  const autoReply = {
    id: replyResult.rows[0].id,
    senderId: replyResult.rows[0].sender_id,
    content: replyResult.rows[0].content,
    readAt: replyResult.rows[0].read_at,
    createdAt: replyResult.rows[0].created_at,
  };

  return { userMessage, autoReply };
};

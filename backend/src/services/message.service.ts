import { pool } from '../config/database';
import { AppError } from '../utils/http-error';
import { generateAutoReply } from './ai.service';

export const getMessages = async (currentUserId: string, matchId: string) => {
  const matchCheck = await pool.query(
    `SELECT id FROM matches
     WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)`,
    [matchId, currentUserId],
  );

  if (!matchCheck.rowCount) {
    throw new AppError('Match not found', 404);
  }

  const result = await pool.query(
    `SELECT id, sender_id, content, read_at, created_at
     FROM messages
     WHERE match_id = $1
     ORDER BY created_at ASC`,
    [matchId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    content: row.content,
    readAt: row.read_at,
    createdAt: row.created_at,
  }));
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

  // Generate AI reply with 8s timeout
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
